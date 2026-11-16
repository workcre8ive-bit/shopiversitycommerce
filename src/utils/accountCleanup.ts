import { 
  collection, 
  query, 
  where, 
  getDoc,
  getDocs, 
  deleteDoc, 
  doc,
  setDoc 
} from "firebase/firestore";
import { deleteUser, signOut, User as FirebaseUser } from "firebase/auth";
import { auth, db } from "../firebase";
import firebaseConfig from "../../firebase-applet-config.json";
import { Product } from "../types";
import {
  checkCanDeleteSellerAccount,
  checkCanDeleteLogisticsAccount,
  cancelUnacceptedPendingOrdersBeforeDelete,
  releasePendingLogisticsJobsBeforeDelete
} from "./deletionGuards";
import { triggerTemplatedEmail } from "./orderEmailNotifications";

export interface CascadeDeleteOptions {
  skipOrderGuards?: boolean;
  skipAuthDelete?: boolean;
  skipEmail?: boolean;
  skipWindowEvent?: boolean;
}

/**
 * Verifies against Google Identity Toolkit whether a signed-in Firebase Auth user
 * still exists in Firebase Authentication (detects accounts deleted directly in
 * Firebase Console -> Authentication -> Users even when a cached JWT is still active).
 * Returns false ONLY when Firebase confirms the Auth user no longer exists or is disabled.
 */
export async function verifyFirebaseAuthUserExists(user: FirebaseUser | null | undefined): Promise<boolean> {
  if (!user || !user.uid) return false;
  try {
    let idToken: string | null = null;
    try {
      idToken = await user.getIdToken(false);
    } catch (tokErr: any) {
      const code = String(tokErr?.code || "");
      if (
        code === "auth/user-not-found" ||
        code === "auth/user-disabled" ||
        code === "auth/invalid-user-token" ||
        code === "auth/user-token-expired"
      ) {
        return false;
      }
      return true;
    }

    if (!idToken) return true;

    const apiKey = firebaseConfig.apiKey;
    if (!apiKey) return true;

    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken })
    });

    if (res.ok) {
      const data = await res.json().catch(() => null);
      if (data && Array.isArray(data.users)) {
        if (data.users.length === 0) return false;
        const found = data.users.find((u: any) => u?.localId === user.uid);
        if (found?.disabled) return false;
        return Boolean(found);
      }
      return true;
    }

    const errData = await res.json().catch(() => null);
    const errMsg = String(errData?.error?.message || "").toUpperCase();
    if (
      errMsg.includes("USER_NOT_FOUND") ||
      errMsg.includes("USER_DISABLED") ||
      errMsg.includes("INVALID_ID_TOKEN")
    ) {
      return false;
    }

    if (errMsg.includes("TOKEN_EXPIRED")) {
      try {
        await user.getIdToken(true);
        return true;
      } catch (refreshErr: any) {
        const code = String(refreshErr?.code || "");
        if (
          code === "auth/user-not-found" ||
          code === "auth/user-disabled" ||
          code === "auth/invalid-user-token" ||
          code === "auth/user-token-expired"
        ) {
          return false;
        }
      }
    }

    return true;
  } catch {
    // Never falsely purge an account on transient offline/network failures
    return true;
  }
}

/**
 * Generates a clean 6-character username using part of the person's name
 * mixed with numbers (e.g., "ayo482", "joh819", "al9204").
 * NEVER uses the email address.
 */
export function generateSmartUsername(name?: string): string {
  // Strip non-letter characters and lowercase
  const clean = (name || "user")
    .trim()
    .toLowerCase()
    .replace(/[^a-z]/g, "");

  // Determine letters part (2 to 3 characters)
  let namePart = clean.slice(0, 3);
  if (namePart.length < 2) {
    namePart = (clean + "usr").slice(0, 3);
  }

  // Calculate digits needed to make the TOTAL username length EXACTLY 6 characters
  const digitsNeeded = 6 - namePart.length; // 3 or 4 digits
  const min = Math.pow(10, digitsNeeded - 1);
  const max = Math.pow(10, digitsNeeded) - 1;
  const numPart = Math.floor(min + Math.random() * (max - min + 1)).toString();

  const finalUsername = `${namePart}${numPart}`.slice(0, 6);
  return finalUsername;
}

/**
 * Permanently deletes a user account and CASCADES deletion to everything
 * the account created or released across Firebase and the website:
 * - Products & Public listings
 * - Product reviews (as buyer or on their products)
 * - Wishlists (saved items and references to their products)
 * - Event plans & Ticket listings
 * - Orders & Order events / disputes
 * - Reports & Moderation records
 * - Chats & direct messages
 * - Logistics company & Deliveries
 * - Payout requests & History
 * - Notifications & Support tickets
 * - Analytics & Product browsing history
 * - User Profile Document in Firestore
 * - Firebase Auth Account & Session Tokens
 */
export async function cascadeDeleteUserAccount(
  uid: string,
  authUser?: any,
  options: CascadeDeleteOptions = {}
): Promise<{ success: boolean; error?: string }> {
  if (!uid) {
    return { success: false, error: "Invalid user ID" };
  }

  console.log(`[CASCADE DELETE] Checking deletion eligibility for account ${uid}...`);

  try {
    // 0A. Strictly enforce order & delivery guards BEFORE deleting any data (unless syncing an already-deleted Firebase Auth account):
    // Sellers cannot delete accounts while accepted or in-process orders (or logistics-accepted deliveries) exist.
    // Logistics companies cannot delete accounts while accepted or in-process deliveries exist.
    let sellerGuard: { allowed: boolean; reason?: string; pendingUnacceptedOrders: any[] } = {
      allowed: true,
      pendingUnacceptedOrders: []
    };
    let logisticsGuard: { allowed: boolean; reason?: string; pendingDeliveries: any[] } = {
      allowed: true,
      pendingDeliveries: []
    };
    if (!options.skipOrderGuards) {
      [sellerGuard, logisticsGuard] = await Promise.all([
        checkCanDeleteSellerAccount(uid),
        checkCanDeleteLogisticsAccount(uid)
      ]);

      if (!sellerGuard.allowed) {
        return { success: false, error: sellerGuard.reason };
      }
      if (!logisticsGuard.allowed) {
        return { success: false, error: logisticsGuard.reason };
      }
    }

    // 0B. Snapshot profile & logistics info BEFORE deletion so confirmation email always knows recipient details
    let userSnapshot: Record<string, any> | null = null;
    let logisticsSnapshot: Record<string, any> | null = null;
    try {
      const [uSnap, lSnap] = await Promise.all([
        getDoc(doc(db, "users", uid)).catch(() => null),
        getDoc(doc(db, "logistics_companies", uid)).catch(() => null)
      ]);
      if (uSnap && uSnap.exists()) userSnapshot = uSnap.data();
      if (lSnap && lSnap.exists()) logisticsSnapshot = lSnap.data();
    } catch {
      // Continue with fallback authUser info
    }

    const capturedEmail = String(
      userSnapshot?.email || logisticsSnapshot?.email || authUser?.email || auth.currentUser?.email || ""
    ).trim();
    const capturedName = String(
      userSnapshot?.displayName || authUser?.displayName || logisticsSnapshot?.companyName || "Shopiversity User"
    ).trim();
    const capturedStoreName = String(
      userSnapshot?.businessName || userSnapshot?.displayName || "Your Store"
    ).trim();
    const capturedCompanyName = String(
      logisticsSnapshot?.companyName || userSnapshot?.businessName || capturedName
    ).trim();
    const capturedRole = String(userSnapshot?.role || (logisticsSnapshot ? "logistics" : "buyer")).toLowerCase();

    // 0C. Cleanly cancel any unaccepted pending seller orders & release unaccepted pending logistics requests
    if (sellerGuard.pendingUnacceptedOrders.length > 0) {
      await cancelUnacceptedPendingOrdersBeforeDelete(
        sellerGuard.pendingUnacceptedOrders,
        "Seller deleted account prior to accepting order."
      );
    }
    if (logisticsGuard.pendingDeliveries.length > 0) {
      await releasePendingLogisticsJobsBeforeDelete(
        logisticsGuard.pendingDeliveries,
        capturedCompanyName
      );
    }

    console.log(`[CASCADE DELETE] Eligibility passed. Beginning complete purge of account ${uid} across Firebase and website...`);

    let deletedProductsCount = 0;

    // 1. Delete all products created or released by this account (and their reviews/wishlists)
    try {
      const [sellerProdSnap, userProdSnap] = await Promise.all([
        getDocs(query(collection(db, "products"), where("sellerId", "==", uid))).catch(() => ({ docs: [] })),
        getDocs(query(collection(db, "products"), where("userId", "==", uid))).catch(() => ({ docs: [] }))
      ]);

      const allProdDocs = Array.from(new Map([...sellerProdSnap.docs, ...userProdSnap.docs].map(d => [d.id, d])).values());
      deletedProductsCount = allProdDocs.length;
      console.log(`[CASCADE DELETE] Found ${allProdDocs.length} products to purge for user ${uid}`);

      for (const pDoc of allProdDocs) {
        try {
          // Delete reviews on this product first
          const revSnap = await getDocs(query(collection(db, "reviews"), where("productId", "==", pDoc.id))).catch(() => ({ docs: [] }));
          for (const rDoc of revSnap.docs) {
            await deleteDoc(rDoc.ref).catch(() => {});
          }

          // Delete wishlists pointing to this product
          const wishSnap = await getDocs(query(collection(db, "wishlists"), where("productId", "==", pDoc.id))).catch(() => ({ docs: [] }));
          for (const wDoc of wishSnap.docs) {
            await deleteDoc(wDoc.ref).catch(() => {});
          }

          // Mark product as deleted first for instant UI reactivity, then permanently delete
          await setDoc(pDoc.ref, { isDeleted: true, status: "deleted" }, { merge: true }).catch(() => {});
          await deleteDoc(pDoc.ref);
        } catch (e) {
          console.warn(`[CASCADE DELETE] Notice deleting product ${pDoc.id}:`, e);
        }
      }
    } catch (e) {
      console.warn("[CASCADE DELETE] Notice querying user products:", e);
    }

    // 2. Delete event plans / public event listings created by this account
    try {
      const eventPlansSnap = await getDocs(query(collection(db, "event_plans"), where("userId", "==", uid))).catch(() => ({ docs: [] }));
      for (const epDoc of eventPlansSnap.docs) {
        await deleteDoc(epDoc.ref).catch(() => {});
      }
    } catch (e) {
      console.warn("[CASCADE DELETE] Notice deleting event plans:", e);
    }

    // 3. Delete reviews written by this user
    try {
      const buyerReviewsSnap = await getDocs(query(collection(db, "reviews"), where("buyerId", "==", uid))).catch(() => ({ docs: [] }));
      for (const rDoc of buyerReviewsSnap.docs) {
        await deleteDoc(rDoc.ref).catch(() => {});
      }
    } catch (e) {
      console.warn("[CASCADE DELETE] Notice deleting user reviews:", e);
    }

    // 4. Delete wishlists created by this user
    try {
      const wishlistsSnap = await getDocs(query(collection(db, "wishlists"), where("userId", "==", uid))).catch(() => ({ docs: [] }));
      for (const wDoc of wishlistsSnap.docs) {
        await deleteDoc(wDoc.ref).catch(() => {});
      }
    } catch (e) {
      console.warn("[CASCADE DELETE] Notice deleting user wishlists:", e);
    }

    // 5. Delete orders associated with this user (as buyer or seller) + related events & refunds
    try {
      const [bOrders, sOrders] = await Promise.all([
        getDocs(query(collection(db, "orders"), where("buyerId", "==", uid))).catch(() => ({ docs: [] })),
        getDocs(query(collection(db, "orders"), where("sellerId", "==", uid))).catch(() => ({ docs: [] }))
      ]);
      const allOrders = Array.from(new Map([...bOrders.docs, ...sOrders.docs].map(d => [d.id, d])).values());
      for (const oDoc of allOrders) {
        // Clean up related order_events & refunds
        try {
          const eventsSnap = await getDocs(query(collection(db, "order_events"), where("orderId", "==", oDoc.id))).catch(() => ({ docs: [] }));
          for (const evDoc of eventsSnap.docs) {
            await deleteDoc(evDoc.ref).catch(() => {});
          }
          const refundsSnap = await getDocs(query(collection(db, "refunds"), where("orderId", "==", oDoc.id))).catch(() => ({ docs: [] }));
          for (const refDoc of refundsSnap.docs) {
            await deleteDoc(refDoc.ref).catch(() => {});
          }
        } catch (subErr) {}
        await deleteDoc(oDoc.ref).catch(() => {});
      }
    } catch (e) {
      console.warn("[CASCADE DELETE] Notice deleting orders:", e);
    }

    // 6. Delete order disputes
    try {
      const [uDisputes, bDisputes, sDisputes] = await Promise.all([
        getDocs(query(collection(db, "disputes"), where("userId", "==", uid))).catch(() => ({ docs: [] })),
        getDocs(query(collection(db, "disputes"), where("buyerId", "==", uid))).catch(() => ({ docs: [] })),
        getDocs(query(collection(db, "disputes"), where("sellerId", "==", uid))).catch(() => ({ docs: [] }))
      ]);
      const allDisputes = Array.from(new Map([...uDisputes.docs, ...bDisputes.docs, ...sDisputes.docs].map(d => [d.id, d])).values());
      for (const dDoc of allDisputes) {
        await deleteDoc(dDoc.ref).catch(() => {});
      }
    } catch (e) {
      console.warn("[CASCADE DELETE] Notice deleting disputes:", e);
    }

    // 7. Delete reports filed by or against this user
    try {
      const [repSnap, venSnap] = await Promise.all([
        getDocs(query(collection(db, "reports"), where("reporterId", "==", uid))).catch(() => ({ docs: [] })),
        getDocs(query(collection(db, "reports"), where("vendorId", "==", uid))).catch(() => ({ docs: [] }))
      ]);
      const allReports = Array.from(new Map([...repSnap.docs, ...venSnap.docs].map(d => [d.id, d])).values());
      for (const rDoc of allReports) {
        await deleteDoc(rDoc.ref).catch(() => {});
      }
    } catch (e) {
      console.warn("[CASCADE DELETE] Notice deleting reports:", e);
    }

    // 8. Delete payout requests
    try {
      const payoutSnap = await getDocs(query(collection(db, "payoutRequests"), where("sellerId", "==", uid))).catch(() => ({ docs: [] }));
      for (const pDoc of payoutSnap.docs) {
        await deleteDoc(pDoc.ref).catch(() => {});
      }
    } catch (e) {
      console.warn("[CASCADE DELETE] Notice deleting payout requests:", e);
    }

    // 9. Delete notifications
    try {
      const notifsSnap = await getDocs(query(collection(db, "notifications"), where("userId", "==", uid))).catch(() => ({ docs: [] }));
      for (const nDoc of notifsSnap.docs) {
        await deleteDoc(nDoc.ref).catch(() => {});
      }
    } catch (e) {
      console.warn("[CASCADE DELETE] Notice deleting notifications:", e);
    }

    // 10. Delete logistics company & delivery items
    try {
      const logCompanyDoc = doc(db, "logistics_companies", uid);
      await setDoc(logCompanyDoc, { isActive: false, isDeleted: true, status: "deleted" }, { merge: true }).catch(() => {});
      await deleteDoc(logCompanyDoc).catch(() => {});

      const targetLogisticsEmail = (authUser?.email || capturedEmail || "").toLowerCase().trim();
      if (targetLogisticsEmail) {
        const emailSnap = await getDocs(query(collection(db, "logistics_companies"), where("email", "==", targetLogisticsEmail))).catch(() => ({ docs: [] }));
        for (const cDoc of emailSnap.docs) {
          await setDoc(cDoc.ref, { isActive: false, isDeleted: true, status: "deleted" }, { merge: true }).catch(() => {});
          await deleteDoc(cDoc.ref).catch(() => {});
        }
      }

      const uidSnap = await getDocs(query(collection(db, "logistics_companies"), where("userId", "==", uid))).catch(() => ({ docs: [] }));
      for (const cDoc of uidSnap.docs) {
        await setDoc(cDoc.ref, { isActive: false, isDeleted: true, status: "deleted" }, { merge: true }).catch(() => {});
        await deleteDoc(cDoc.ref).catch(() => {});
      }

      const [senderDelivs, logDelivs] = await Promise.all([
        getDocs(query(collection(db, "logistics_deliveries"), where("senderId", "==", uid))).catch(() => ({ docs: [] })),
        getDocs(query(collection(db, "logistics_deliveries"), where("logisticsId", "==", uid))).catch(() => ({ docs: [] }))
      ]);
      for (const dDoc of [...senderDelivs.docs, ...logDelivs.docs]) {
        await deleteDoc(dDoc.ref).catch(() => {});
      }
    } catch (e) {
      console.warn("[CASCADE DELETE] Notice deleting logistics data:", e);
    }

    // 11. Delete chats and messages where user was participant
    try {
      const chatsSnap = await getDocs(query(collection(db, "chats"), where("participants", "array-contains", uid))).catch(() => ({ docs: [] }));
      for (const chatDoc of chatsSnap.docs) {
        try {
          const msgSnap = await getDocs(collection(chatDoc.ref, "messages")).catch(() => ({ docs: [] }));
          for (const mDoc of msgSnap.docs) {
            await deleteDoc(mDoc.ref).catch(() => {});
          }
        } catch (msgErr) {}
        await deleteDoc(chatDoc.ref).catch(() => {});
      }
    } catch (e) {
      console.warn("[CASCADE DELETE] Notice deleting chats:", e);
    }

    // 12. Delete product browsing history
    try {
      const historySnap = await getDocs(query(collection(db, "product_history"), where("userId", "==", uid))).catch(() => ({ docs: [] }));
      for (const hDoc of historySnap.docs) {
        await deleteDoc(hDoc.ref).catch(() => {});
      }
    } catch (e) {
      console.warn("[CASCADE DELETE] Notice deleting product history:", e);
    }

    // 13. Delete support tickets
    try {
      const supportSnap = await getDocs(query(collection(db, "supportTickets"), where("userId", "==", uid))).catch(() => ({ docs: [] }));
      for (const sDoc of supportSnap.docs) {
        await deleteDoc(sDoc.ref).catch(() => {});
      }
    } catch (e) {
      console.warn("[CASCADE DELETE] Notice deleting support tickets:", e);
    }

    // 14. Delete analytics records
    try {
      const analyticsSnap = await getDocs(query(collection(db, "analytics"), where("sellerId", "==", uid))).catch(() => ({ docs: [] }));
      for (const aDoc of analyticsSnap.docs) {
        await deleteDoc(aDoc.ref).catch(() => {});
      }
    } catch (e) {
      console.warn("[CASCADE DELETE] Notice deleting analytics records:", e);
    }

    // 15. Delete User Profile Document in Firestore
    try {
      await deleteDoc(doc(db, "users", uid));
      console.log(`[CASCADE DELETE] Successfully deleted Firestore user document users/${uid}`);
    } catch (e) {
      console.warn("[CASCADE DELETE] Notice deleting user doc:", e);
    }

    // 15B. Dispatch Account Deletion Confirmation Email(s) via Brevo BEFORE clearing auth/session
    if (capturedEmail && !options.skipEmail) {
      const deletedTimestamp = new Date().toUTCString();
      const emailTasks: Promise<any>[] = [];

      if (logisticsSnapshot) {
        emailTasks.push(
          triggerTemplatedEmail({
            templateId: "logistics_account_deleted",
            recipientEmail: String(logisticsSnapshot.email || capturedEmail).trim(),
            recipientUserId: uid,
            recipientRole: "logistics",
            variables: {
              courier_name: capturedCompanyName,
              recipient_email: String(logisticsSnapshot.email || capturedEmail).trim(),
              event_timestamp: deletedTimestamp
            },
            idempotencyKey: `logistics_deleted_${uid}`
          })
        );
      }

      if (capturedRole === "seller" || capturedRole === "both" || deletedProductsCount > 0) {
        emailTasks.push(
          triggerTemplatedEmail({
            templateId: "seller_account_deleted",
            recipientEmail: capturedEmail,
            recipientUserId: uid,
            recipientRole: "seller",
            variables: {
              seller_name: capturedName,
              store_name: capturedStoreName,
              deleted_products_count: `${deletedProductsCount} listing${deletedProductsCount === 1 ? "" : "s"}`,
              recipient_email: capturedEmail,
              event_timestamp: deletedTimestamp
            },
            idempotencyKey: `account_deleted_${uid}`
          })
        );
      } else if (!logisticsSnapshot) {
        emailTasks.push(
          triggerTemplatedEmail({
            templateId: "buyer_account_deleted",
            recipientEmail: capturedEmail,
            recipientUserId: uid,
            recipientRole: "buyer",
            variables: {
              buyer_name: capturedName,
              recipient_email: capturedEmail,
              event_timestamp: deletedTimestamp
            },
            idempotencyKey: `account_deleted_${uid}`
          })
        );
      }

      await Promise.allSettled(emailTasks);
    }

    const isDeletingCurrentBrowserUser = Boolean(auth.currentUser?.uid === uid || authUser?.uid === uid);

    // 16. Clear Local Storage and Session Storage artifacts when deleting the active browser user
    if (isDeletingCurrentBrowserUser) {
      try {
        localStorage.removeItem("shopiversity_cart");
        localStorage.removeItem(`shopiversity_bank_details_${uid}`);
        localStorage.removeItem("shopiversity_recent_searches");
        sessionStorage.clear();
      } catch (storageErr) {
        console.warn("[CASCADE DELETE] Storage cleanup notice:", storageErr);
      }
    }

    // 17. Call Server-Side Cascade Purge Endpoint (background safety net)
    try {
      fetch("/api/account/cascade-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid,
          email: capturedEmail,
          displayName: capturedName,
          storeName: capturedStoreName,
          companyName: capturedCompanyName,
          role: capturedRole,
          deletedProductsCount,
          skipOrderGuards: Boolean(options.skipOrderGuards),
          skipEmail: Boolean(options.skipEmail)
        })
      }).catch(() => {});
    } catch (apiErr) {
      console.warn("[CASCADE DELETE] Server-side cascade notice:", apiErr);
    }

    // 18. Delete from Firebase Authentication (unless already deleted from Firebase Console) & sign out if active
    const targetAuthUser = authUser || (auth.currentUser?.uid === uid ? auth.currentUser : null);
    if (!options.skipAuthDelete && targetAuthUser) {
      try {
        await deleteUser(targetAuthUser);
        console.log(`[CASCADE DELETE] Firebase Auth user deleted successfully: ${uid}`);
      } catch (authErr: any) {
        console.warn("[CASCADE DELETE] Firebase auth deleteUser notice:", authErr);
      } finally {
        // ALWAYS sign out to destroy active token sessions and prevent auto-restoring ghost profile
        await signOut(auth).catch(() => {});
      }
    } else if (auth.currentUser?.uid === uid) {
      await signOut(auth).catch(() => {});
    }

    // 19. Dispatch global event to instantly update website UI (remove products, sellers, user state)
    if (typeof window !== "undefined" && !options.skipWindowEvent) {
      window.dispatchEvent(new CustomEvent("account-deleted", { detail: { uid } }));
    }

    console.log(`[CASCADE DELETE] Completed purge of user ${uid}`);
    return { success: true };
  } catch (err: any) {
    console.error("[CASCADE DELETE] Account cascade purge failed:", err);
    return { success: false, error: err.message || "Failed to completely delete account data." };
  }
}

/**
 * Checks for orphaned products or public items in the app whose creator/seller
 * account was deleted from Firebase, deletes them from Firebase Firestore,
 * and returns the list of deleted product IDs so the UI updates immediately.
 */
export async function cleanupOrphanedProducts(
  allProducts: Product[],
  existingUserIds: Set<string>,
  forceCheck = false
): Promise<string[]> {
  if (!allProducts || allProducts.length === 0 || (!forceCheck && existingUserIds.size === 0)) {
    return [];
  }

  const orphanedProducts: Product[] = [];

  for (const product of allProducts) {
    // If the product has a sellerId that does not exist in the active users collection
    if (product.sellerId && !existingUserIds.has(product.sellerId)) {
      orphanedProducts.push(product);
    }
  }

  if (orphanedProducts.length === 0) {
    return [];
  }

  const deletedIds: string[] = [];

  for (const orphaned of orphanedProducts) {
    try {
      // Delete from client Firestore
      await deleteDoc(doc(db, "products", orphaned.id));
      deletedIds.push(orphaned.id);
    } catch (err) {
      console.warn(`Could not delete orphaned product ${orphaned.id} directly from client:`, err);
    }
  }

  // Also notify server to clean up any remaining orphaned items in Firebase
  try {
    fetch("/api/account/cleanup-orphaned-content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productIds: orphanedProducts.map(p => p.id) })
    }).catch(() => {});
  } catch (e) {
    // Ignore background sync errors
  }

  return deletedIds;
}
