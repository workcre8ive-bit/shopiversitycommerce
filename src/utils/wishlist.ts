import { db, auth } from "../firebase";
import { 
  doc, 
  setDoc, 
  deleteDoc, 
  getDoc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove, 
  collection, 
  query, 
  where, 
  getDocs,
  onSnapshot
} from "firebase/firestore";
import { Product, WishlistItem, UserProfile } from "../types";

export const WISHLIST_UPDATED_EVENT = "shopiversity-wishlist-updated";

/**
 * Checks whether a given productId is saved in a wishlist ID array.
 */
export function isProductInWishlist(productId: string, wishlistIds?: string[] | null): boolean {
  if (!productId || !wishlistIds || !Array.isArray(wishlistIds)) return false;
  return wishlistIds.includes(productId);
}

/**
 * Toggles a product in the authenticated user's wishlist in Firestore.
 * Updates both the dedicated /wishlists document and the user's wishlistProductIds array.
 * Returns true if added, false if removed.
 */
export async function toggleWishlist(
  product: Product, 
  user: UserProfile | { uid: string; displayName?: string; email?: string } | null
): Promise<{ added: boolean; error?: string }> {
  if (!user || !user.uid) {
    return { added: false, error: "Please sign in to save products to your Wishlist." };
  }

  const userId = user.uid;
  const wishlistDocId = `${userId}_${product.id}`;
  const wishlistDocRef = doc(db, "wishlists", wishlistDocId);
  const userDocRef = doc(db, "users", userId);

  try {
    const existingDoc = await getDoc(wishlistDocRef);

    if (existingDoc.exists()) {
      // Remove from wishlist
      await deleteDoc(wishlistDocRef);

      try {
        await updateDoc(userDocRef, {
          wishlistProductIds: arrayRemove(product.id)
        });
      } catch (uErr) {
        console.warn("Notice updating user wishlistProductIds on remove:", uErr);
      }

      window.dispatchEvent(new CustomEvent(WISHLIST_UPDATED_EVENT, {
        detail: { productId: product.id, added: false, userId }
      }));

      return { added: false };
    } else {
      // Add to wishlist
      const wishlistItem: WishlistItem = {
        id: wishlistDocId,
        userId,
        productId: product.id,
        productName: product.name || "Product",
        productPrice: typeof product.price === "string" ? parseFloat(product.price) : Number(product.price || 0),
        productImageUrl: product.imageUrl || (product.imageUrls && product.imageUrls[0]) || "",
        category: product.category || "General",
        sellerId: product.sellerId || "",
        sellerName: product.sellerName || "",
        createdAt: new Date().toISOString()
      };

      await setDoc(wishlistDocRef, wishlistItem);

      try {
        await updateDoc(userDocRef, {
          wishlistProductIds: arrayUnion(product.id)
        });
      } catch (uErr) {
        console.warn("Notice updating user wishlistProductIds on add:", uErr);
      }

      window.dispatchEvent(new CustomEvent(WISHLIST_UPDATED_EVENT, {
        detail: { productId: product.id, added: true, userId, item: wishlistItem }
      }));

      return { added: true };
    }
  } catch (err: any) {
    console.error("Failed to toggle wishlist item in Firestore:", err);
    return { added: false, error: err.message || "Failed to update wishlist" };
  }
}

/**
 * Removes a product from the user's wishlist in Firestore.
 */
export async function removeFromWishlist(productId: string, userId: string): Promise<void> {
  if (!productId || !userId) return;
  const wishlistDocId = `${userId}_${productId}`;
  const wishlistDocRef = doc(db, "wishlists", wishlistDocId);
  const userDocRef = doc(db, "users", userId);

  await deleteDoc(wishlistDocRef).catch((e) => console.warn(e));

  try {
    await updateDoc(userDocRef, {
      wishlistProductIds: arrayRemove(productId)
    });
  } catch (e) {
    console.warn("Notice updating user wishlist on removeFromWishlist:", e);
  }

  window.dispatchEvent(new CustomEvent(WISHLIST_UPDATED_EVENT, {
    detail: { productId, added: false, userId }
  }));
}
