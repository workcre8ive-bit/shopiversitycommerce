import { CartItem, OneDollarListing, Product } from "../types";

export const CART_RESERVATION_DAYS = 2;
export const CART_RESERVATION_MS = CART_RESERVATION_DAYS * 24 * 60 * 60 * 1000;

export function parseCartAddedAt(addedAt: unknown): number | null {
  if (typeof addedAt === "number") {
    return Number.isFinite(addedAt) && addedAt > 0 ? addedAt : null;
  }
  if (typeof addedAt === "string") {
    const trimmed = addedAt.trim();
    if (!trimmed) return null;
    const numeric = Number(trimmed);
    if (Number.isFinite(numeric) && numeric > 0) {
      return numeric;
    }
    const parsedDate = Date.parse(trimmed);
    return Number.isFinite(parsedDate) && parsedDate > 0 ? parsedDate : null;
  }
  if (addedAt && typeof addedAt === "object") {
    const maybeTimestamp = addedAt as { toMillis?: () => number; seconds?: number };
    if (typeof maybeTimestamp.toMillis === "function") {
      const ms = maybeTimestamp.toMillis();
      return Number.isFinite(ms) && ms > 0 ? ms : null;
    }
    if (typeof maybeTimestamp.seconds === "number" && Number.isFinite(maybeTimestamp.seconds) && maybeTimestamp.seconds > 0) {
      return maybeTimestamp.seconds * 1000;
    }
  }
  return null;
}

export function isCartItemExpired(
  item: Pick<CartItem, "addedAt"> | null | undefined,
  now: number = Date.now()
): boolean {
  if (!item) return true;
  const addedAtMs = parseCartAddedAt(item.addedAt);
  // Treat missing or invalid timestamps as expired so un-timestamped legacy cart items never linger indefinitely.
  if (addedAtMs === null) return true;
  return now - addedAtMs >= CART_RESERVATION_MS;
}

export function pruneExpiredCartItems(
  items: CartItem[] | null | undefined,
  now: number = Date.now()
): CartItem[] {
  if (!Array.isArray(items) || items.length === 0) return [];
  const valid: CartItem[] = [];
  for (const item of items) {
    if (!item || typeof item !== "object" || !item.productId) continue;
    if (Number(item.quantity || 0) <= 0) continue;
    const addedAtMs = parseCartAddedAt(item.addedAt);
    if (addedAtMs === null || now - addedAtMs >= CART_RESERVATION_MS) continue;
    valid.push(item.addedAt === addedAtMs ? item : { ...item, addedAt: addedAtMs });
  }
  return valid;
}

export function getCartReservationRemainingMs(
  item: Pick<CartItem, "addedAt"> | null | undefined,
  now: number = Date.now()
): number {
  if (!item) return 0;
  const addedAtMs = parseCartAddedAt(item.addedAt);
  if (addedAtMs === null) return 0;
  return Math.max(0, addedAtMs + CART_RESERVATION_MS - now);
}

export function formatCartReservationRemaining(
  item: Pick<CartItem, "addedAt"> | null | undefined,
  now: number = Date.now()
): { label: string; isUrgent: boolean; remainingMs: number } {
  const remainingMs = getCartReservationRemainingMs(item, now);
  if (remainingMs <= 0) {
    return { label: "Expired", isUrgent: true, remainingMs: 0 };
  }
  const totalMinutes = Math.max(1, Math.ceil(remainingMs / 60000));
  const totalHours = Math.floor(totalMinutes / 60);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const mins = totalMinutes % 60;

  let label: string;
  if (days >= 1) {
    label = hours > 0 ? `${days}d ${hours}h left` : `${days}d left`;
  } else if (totalHours >= 1) {
    label = mins > 0 ? `${totalHours}h ${mins}m left` : `${totalHours}h left`;
  } else {
    label = `${mins}m left`;
  }

  return {
    label,
    isUrgent: remainingMs < 6 * 60 * 60 * 1000,
    remainingMs,
  };
}

export function resolveAvailableStockForProduct(
  product?: Product | null,
  menuItem?: any,
  ticketTier?: any
): number | undefined {
  if (!product) return undefined;
  if (ticketTier && ticketTier.stock !== undefined && ticketTier.stock !== null) {
    const parsed = Number(ticketTier.stock);
    return Number.isFinite(parsed) ? Math.max(0, parsed) : undefined;
  }
  if (menuItem && menuItem.stock !== undefined && menuItem.stock !== null) {
    const parsed = Number(menuItem.stock);
    return Number.isFinite(parsed) ? Math.max(0, parsed) : undefined;
  }
  if (product.type === "service") {
    return undefined;
  }
  if (product.stock !== undefined && product.stock !== null) {
    const parsed = Number(product.stock);
    return Number.isFinite(parsed) ? Math.max(0, parsed) : undefined;
  }
  return undefined;
}

export function resolveAvailableStockForCartItem(
  item: CartItem,
  products?: Product[],
  oneDollarListings?: OneDollarListing[]
): number | undefined {
  if (item.isOneDollar) {
    const listing = oneDollarListings?.find(
      (l) =>
        (item.oneDollarListingId && l.id === item.oneDollarListingId) ||
        l.productId === item.productId
    );
    if (listing && listing.stock !== undefined && listing.stock !== null) {
      const parsed = Number(listing.stock);
      if (Number.isFinite(parsed)) return Math.max(0, parsed);
    }
    if (typeof item.maxStock === "number" && Number.isFinite(item.maxStock)) {
      return Math.max(0, item.maxStock);
    }
    return undefined;
  }

  if (item.type === "service") {
    return typeof item.maxStock === "number" && Number.isFinite(item.maxStock)
      ? Math.max(0, item.maxStock)
      : undefined;
  }

  const product = products?.find((p) => p.id === item.productId);
  if (product) {
    if (item.ticketTierId && product.eventDetails?.ticketTiers) {
      const tier = product.eventDetails.ticketTiers.find(
        (t: any) => (t.id || t.name) === item.ticketTierId
      );
      if (tier && tier.stock !== undefined && tier.stock !== null) {
        const parsed = Number(tier.stock);
        if (Number.isFinite(parsed)) return Math.max(0, parsed);
      }
    }
    if (item.menuItemId && product.menuItems) {
      const menu = product.menuItems.find(
        (m: any) => (m.id || m.name) === item.menuItemId
      ) as any;
      if (menu && menu.stock !== undefined && menu.stock !== null) {
        const parsed = Number(menu.stock);
        if (Number.isFinite(parsed)) return Math.max(0, parsed);
      }
    }
    if (product.stock !== undefined && product.stock !== null) {
      const parsed = Number(product.stock);
      if (Number.isFinite(parsed)) return Math.max(0, parsed);
    }
  }

  if (typeof item.maxStock === "number" && Number.isFinite(item.maxStock)) {
    return Math.max(0, item.maxStock);
  }
  return undefined;
}

export function getInCartQuantity(
  cart: CartItem[] | undefined,
  target: {
    productId: string;
    menuItemId?: string;
    ticketTierId?: string;
    isOneDollar?: boolean;
  }
): number {
  if (!cart || cart.length === 0) return 0;
  const now = Date.now();
  return cart.reduce((sum, item) => {
    if (isCartItemExpired(item, now)) return sum;
    const sameProduct = item.productId === target.productId;
    const sameOneDollar = Boolean(item.isOneDollar) === Boolean(target.isOneDollar);
    const sameMenu = target.menuItemId !== undefined ? item.menuItemId === target.menuItemId : true;
    const sameTier = target.ticketTierId !== undefined ? item.ticketTierId === target.ticketTierId : true;
    if (sameProduct && sameOneDollar && sameMenu && sameTier) {
      return sum + Number(item.quantity || 0);
    }
    return sum;
  }, 0);
}
