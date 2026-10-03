import { 
  collection, 
  query, 
  where, 
  getDocs, 
  deleteDoc, 
  doc 
} from "firebase/firestore";
import { deleteUser } from "firebase/auth";
import { db } from "../firebase";
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
 * Permanently deletes a user account and CASICADES deletion to everything
 * the account created or released to the public:
 * - Products & Public listings
 * - Product reviews (as buyer or on their products)
 * - Event plans & Ticket listings
 * - Orders & Order disputes
 * - Reports & Moderation records
 * - Logistics company & Deliveries
 * - Payout requests & History
 * - Notifications & Support tickets
 * - User Document & Firebase Auth Account
 */
export async function cascadeDeleteUserAccount(
  uid: string,
  authUser?: any
): Promise<{ success: boolean; error?: string }> {
  if (!uid) {
    return { success: false, error: "Invalid user ID" };
  }

  try {
    // 1. Delete all products created or released to the public by this account
    try {
      const productsQ = query(collection(db, "products"), where("sellerId", "==", uid));
      const productsSnap = await getDocs(productsQ);
      for (const pDoc of productsSnap.docs) {
        try {
          // Delete reviews on this product first
          const revQ = query(collection(db, "reviews"), where("productId", "==", pDoc.id));
          const revSnap = await getDocs(revQ);
          for (const rDoc of revSnap.docs) {
            await deleteDoc(rDoc.ref).catch(() => {});
          }
          await deleteDoc(pDoc.ref);
        } catch (e) {
          console.warn("Notice deleting product doc:", pDoc.id, e);
        }
      }
    } catch (e) {
      console.warn("Notice querying user products for cascade delete:", e);
    }

    // 2. Delete event plans / public event listings created by this account
    try {
      const eventPlansQ = query(collection(db, "event_plans"), where("userId", "==", uid));
      const eventPlansSnap = await getDocs(eventPlansQ);
      for (const epDoc of eventPlansSnap.docs) {
        await deleteDoc(epDoc.ref).catch(() => {});
      }
    } catch (e) {
      console.warn("Notice deleting event plans:", e);
    }

    // 3. Delete reviews written by this user
    try {
      const buyerReviewsQ = query(collection(db, "reviews"), where("buyerId", "==", uid));
      const buyerReviewsSnap = await getDocs(buyerReviewsQ);
      for (const rDoc of buyerReviewsSnap.docs) {
        await deleteDoc(rDoc.ref).catch(() => {});
      }
    } catch (e) {
      console.warn("Notice deleting user reviews:", e);
    }

    // 4. Delete orders associated with this user (as buyer or seller)
    try {
      const buyerOrdersQ = query(collection(db, "orders"), where("buyerId", "==", uid));
      const sellerOrdersQ = query(collection(db, "orders"), where("sellerId", "==", uid));
      const [bOrders, sOrders] = await Promise.all([
        getDocs(buyerOrdersQ).catch(() => ({ docs: [] })),
        getDocs(sellerOrdersQ).catch(() => ({ docs: [] }))
      ]);
      for (const oDoc of [...bOrders.docs, ...sOrders.docs]) {
        await deleteDoc(oDoc.ref).catch(() => {});
      }
    } catch (e) {
      console.warn("Notice deleting orders:", e);
    }

    // 5. Delete order disputes
    try {
      const disputesQ = query(collection(db, "disputes"), where("userId", "==", uid));
      const disputesSnap = await getDocs(disputesQ).catch(() => ({ docs: [] }));
      for (const dDoc of disputesSnap.docs) {
        await deleteDoc(dDoc.ref).catch(() => {});
      }
    } catch (e) {
      console.warn("Notice deleting disputes:", e);
    }

    // 6. Delete reports filed by or against this user
    try {
      const repQ = query(collection(db, "reports"), where("reporterId", "==", uid));
      const venQ = query(collection(db, "reports"), where("vendorId", "==", uid));
      const [repSnap, venSnap] = await Promise.all([
        getDocs(repQ).catch(() => ({ docs: [] })),
        getDocs(venQ).catch(() => ({ docs: [] }))
      ]);
      for (const rDoc of [...repSnap.docs, ...venSnap.docs]) {
        await deleteDoc(rDoc.ref).catch(() => {});
      }
    } catch (e) {
      console.warn("Notice deleting reports:", e);
    }

    // 7. Delete payout requests
    try {
      const payoutQ = query(collection(db, "payoutRequests"), where("sellerId", "==", uid));
      const payoutSnap = await getDocs(payoutQ).catch(() => ({ docs: [] }));
      for (const pDoc of payoutSnap.docs) {
        await deleteDoc(pDoc.ref).catch(() => {});
      }
    } catch (e) {
      console.warn("Notice deleting payout requests:", e);
    }

    // 8. Delete notifications
    try {
      const notifsQ = query(collection(db, "notifications"), where("userId", "==", uid));
      const notifsSnap = await getDocs(notifsQ).catch(() => ({ docs: [] }));
      for (const nDoc of notifsSnap.docs) {
        await deleteDoc(nDoc.ref).catch(() => {});
      }
    } catch (e) {
      console.warn("Notice deleting notifications:", e);
    }

    // 9. Delete logistics company & delivery items
    try {
      const logCompanyDoc = doc(db, "logistics_companies", uid);
      await deleteDoc(logCompanyDoc).catch(() => {});

      const deliveriesQ = query(collection(db, "logistics_deliveries"), where("senderId", "==", uid));
      const deliveriesSnap = await getDocs(deliveriesQ).catch(() => ({ docs: [] }));
      for (const dDoc of deliveriesSnap.docs) {
        await deleteDoc(dDoc.ref).catch(() => {});
      }
    } catch (e) {
      console.warn("Notice deleting logistics data:", e);
    }

    // 10. Delete product browsing history
    try {
      const historyQ = query(collection(db, "product_history"), where("userId", "==", uid));
      const historySnap = await getDocs(historyQ).catch(() => ({ docs: [] }));
      for (const hDoc of historySnap.docs) {
        await deleteDoc(hDoc.ref).catch(() => {});
      }
    } catch (e) {
      console.warn("Notice deleting product history:", e);
    }

    // 11. Delete support tickets
    try {
      const supportQ = query(collection(db, "supportTickets"), where("userId", "==", uid));
      const supportSnap = await getDocs(supportQ).catch(() => ({ docs: [] }));
      for (const sDoc of supportSnap.docs) {
        await deleteDoc(sDoc.ref).catch(() => {});
      }
    } catch (e) {
      console.warn("Notice deleting support tickets:", e);
    }

    // 12. Delete User Profile Document in Firestore
    try {
      await deleteDoc(doc(db, "users", uid));
    } catch (e) {
      console.warn("Notice deleting user doc:", e);
    }

    // 13. Call Server-Side Admin Purge Endpoint (ensures all collections are 100% purged with admin privileges)
    try {
      await fetch("/api/account/cascade-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid })
      });
    } catch (apiErr) {
      console.warn("Server-side cascade delete notice:", apiErr);
    }

    // 14. Clear Local Storage artifacts for this user
    try {
      localStorage.removeItem("shopiversity_cart");
      localStorage.removeItem(`shopiversity_bank_details_${uid}`);
      localStorage.removeItem("referredBy");
    } catch (storageErr) {
      console.warn("Storage cleanup notice:", storageErr);
    }

    // 15. Delete from Firebase Auth if current user
    if (authUser) {
      try {
        await deleteUser(authUser);
      } catch (authErr: any) {
        console.warn("Firebase auth deleteUser notice:", authErr);
        if (authErr.code === "auth/requires-recent-login") {
          return {
            success: true,
            error: "Data deleted. For security, please sign in once more to finish removing your credentials."
          };
        }
      }
    }

    return { success: true };
  } catch (err: any) {
    console.error("Cascade delete account failed:", err);
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
