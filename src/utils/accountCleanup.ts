import { 
  collection, 
  query, 
  where, 
  getDocs, 
  deleteDoc, 
  doc,
  setDoc 
} from "firebase/firestore";
import { deleteUser, signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { Product } from "../types";

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
  authUser?: any
): Promise<{ success: boolean; error?: string }> {
  if (!uid) {
    return { success: false, error: "Invalid user ID" };
  }

  console.log(`[CASCADE DELETE] Beginning complete purge of account ${uid} across Firebase and website...`);

  try {
    // 1. Delete all products created or released by this account (and their reviews/wishlists)
    try {
      const [sellerProdSnap, userProdSnap] = await Promise.all([
        getDocs(query(collection(db, "products"), where("sellerId", "==", uid))).catch(() => ({ docs: [] })),
        getDocs(query(collection(db, "products"), where("userId", "==", uid))).catch(() => ({ docs: [] }))
      ]);

      const allProdDocs = Array.from(new Map([...sellerProdSnap.docs, ...userProdSnap.docs].map(d => [d.id, d])).values());
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

      if (authUser?.email) {
        const cleanEmail = authUser.email.toLowerCase().trim();
        const emailSnap = await getDocs(query(collection(db, "logistics_companies"), where("email", "==", cleanEmail))).catch(() => ({ docs: [] }));
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

    // 16. Clear Local Storage and Session Storage artifacts
    try {
      localStorage.removeItem("shopiversity_cart");
      localStorage.removeItem(`shopiversity_bank_details_${uid}`);
      localStorage.removeItem("referredBy");
      localStorage.removeItem("shopiversity_recent_searches");
      sessionStorage.clear();
    } catch (storageErr) {
      console.warn("[CASCADE DELETE] Storage cleanup notice:", storageErr);
    }

    // 17. Call Server-Side Cascade Purge Endpoint (background safety net)
    try {
      fetch("/api/account/cascade-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid })
      }).catch(() => {});
    } catch (apiErr) {
      console.warn("[CASCADE DELETE] Server-side cascade notice:", apiErr);
    }

    // 18. Delete from Firebase Authentication (or sign out)
    const targetAuthUser = authUser || (auth.currentUser?.uid === uid ? auth.currentUser : null);
    if (targetAuthUser) {
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
    if (typeof window !== "undefined") {
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
  existingUserIds: Set<string>
): Promise<string[]> {
  if (!allProducts || allProducts.length === 0 || existingUserIds.size === 0) {
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
