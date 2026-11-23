import { Product, UserProfile } from "../types";

const PROFILE_PREFIX = "shopiversity_cached_profile_";
const PENDING_SYNC_PREFIX = "shopiversity_pending_profile_sync_";
const PENDING_VERIFY_PREFIX = "shopiversity_pending_verify_";
const PRODUCTS_CACHE_KEY = "shopiversity_cached_products_v1";
const SELLERS_CACHE_KEY = "shopiversity_cached_sellers_v1";

export function getCachedUserProfile(uid?: string | null): UserProfile | null {
  if (typeof window === "undefined" || !uid) return null;
  try {
    const raw = localStorage.getItem(`${PROFILE_PREFIX}${uid}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && parsed.uid ? (parsed as UserProfile) : null;
  } catch {
    return null;
  }
}

export function setCachedUserProfile(profile: UserProfile | null | undefined): void {
  if (typeof window === "undefined" || !profile?.uid) return;
  try {
    localStorage.setItem(`${PROFILE_PREFIX}${profile.uid}`, JSON.stringify(profile));
  } catch {
    // Ignore storage quota errors
  }
}

export function removeCachedUserProfile(uid?: string | null): void {
  if (typeof window === "undefined" || !uid) return;
  try {
    localStorage.removeItem(`${PROFILE_PREFIX}${uid}`);
    localStorage.removeItem(`${PENDING_SYNC_PREFIX}${uid}`);
    localStorage.removeItem(`${PENDING_VERIFY_PREFIX}${uid}`);
  } catch {
    // Ignore storage errors
  }
}

export function hasPendingProfileSync(uid?: string | null): boolean {
  if (typeof window === "undefined" || !uid) return false;
  try {
    return localStorage.getItem(`${PENDING_SYNC_PREFIX}${uid}`) === "true";
  } catch {
    return false;
  }
}

export function setPendingProfileSync(uid: string | null | undefined, pending: boolean): void {
  if (typeof window === "undefined" || !uid) return;
  try {
    if (pending) {
      localStorage.setItem(`${PENDING_SYNC_PREFIX}${uid}`, "true");
    } else {
      localStorage.removeItem(`${PENDING_SYNC_PREFIX}${uid}`);
    }
  } catch {
    // Ignore storage errors
  }
}

export function hasPendingVerifySync(uid?: string | null): boolean {
  if (typeof window === "undefined" || !uid) return false;
  try {
    return localStorage.getItem(`${PENDING_VERIFY_PREFIX}${uid}`) === "true";
  } catch {
    return false;
  }
}

export function setPendingVerifySync(uid: string | null | undefined, pending: boolean): void {
  if (typeof window === "undefined" || !uid) return;
  try {
    if (pending) {
      localStorage.setItem(`${PENDING_VERIFY_PREFIX}${uid}`, "true");
    } else {
      localStorage.removeItem(`${PENDING_VERIFY_PREFIX}${uid}`);
    }
  } catch {
    // Ignore storage errors
  }
}

export function getCachedProducts(): Product[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PRODUCTS_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Product[]) : [];
  } catch {
    return [];
  }
}

export function setCachedProducts(products: Product[]): void {
  if (typeof window === "undefined" || !Array.isArray(products)) return;
  try {
    localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(products.slice(0, 120)));
  } catch {
    // Ignore storage errors
  }
}

export function getCachedSellers(maxAgeMs = 15 * 60 * 1000): { sellers: UserProfile[]; isFresh: boolean } {
  if (typeof window === "undefined") return { sellers: [], isFresh: false };
  try {
    const raw = sessionStorage.getItem(SELLERS_CACHE_KEY) || localStorage.getItem(SELLERS_CACHE_KEY);
    if (!raw) return { sellers: [], isFresh: false };
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.sellers)) {
      const ts = Number(parsed.timestamp || 0);
      return {
        sellers: parsed.sellers as UserProfile[],
        isFresh: ts > 0 && Date.now() - ts < maxAgeMs
      };
    }
  } catch {
    // Ignore parse errors
  }
  return { sellers: [], isFresh: false };
}

export function setCachedSellers(sellers: UserProfile[]): void {
  if (typeof window === "undefined" || !Array.isArray(sellers)) return;
  try {
    const payload = JSON.stringify({ timestamp: Date.now(), sellers });
    sessionStorage.setItem(SELLERS_CACHE_KEY, payload);
    localStorage.setItem(SELLERS_CACHE_KEY, payload);
  } catch {
    // Ignore storage errors
  }
}

function getScopedCache<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function setScopedCache<T>(key: string, items: T[], maxItems = 100): void {
  if (typeof window === "undefined" || !Array.isArray(items)) return;
  try {
    localStorage.setItem(key, JSON.stringify(items.slice(0, maxItems)));
  } catch {
    // Ignore storage quota errors
  }
}

export function getCachedSellerOrders<T = any>(uid?: string | null): T[] {
  return uid ? getScopedCache<T>(`shopiversity_seller_orders_${uid}`) : [];
}

export function setCachedSellerOrders<T = any>(uid: string | null | undefined, orders: T[]): void {
  if (uid) setScopedCache(`shopiversity_seller_orders_${uid}`, orders, 100);
}

export function getCachedSellerProducts(uid?: string | null): Product[] {
  return uid ? getScopedCache<Product>(`shopiversity_seller_products_${uid}`) : [];
}

export function setCachedSellerProducts(uid: string | null | undefined, products: Product[]): void {
  if (uid) setScopedCache(`shopiversity_seller_products_${uid}`, products, 100);
}

export function getCachedSellerPayouts<T = any>(uid?: string | null): T[] {
  return uid ? getScopedCache<T>(`shopiversity_seller_payouts_${uid}`) : [];
}

export function setCachedSellerPayouts<T = any>(uid: string | null | undefined, payouts: T[]): void {
  if (uid) setScopedCache(`shopiversity_seller_payouts_${uid}`, payouts, 50);
}

export function getCachedSellerAnalytics<T = any>(uid?: string | null): T[] {
  return uid ? getScopedCache<T>(`shopiversity_seller_analytics_${uid}`) : [];
}

export function setCachedSellerAnalytics<T = any>(uid: string | null | undefined, analytics: T[]): void {
  if (uid) setScopedCache(`shopiversity_seller_analytics_${uid}`, analytics, 100);
}

export function getCachedNotifications<T = any>(uid?: string | null): T[] {
  return uid ? getScopedCache<T>(`shopiversity_notifications_${uid}`) : [];
}

export function setCachedNotifications<T = any>(uid: string | null | undefined, notifications: T[]): void {
  if (uid) setScopedCache(`shopiversity_notifications_${uid}`, notifications, 40);
}

