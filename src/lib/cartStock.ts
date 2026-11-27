import { CartItem, OneDollarListing, Product } from "../types";

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
  return cart.reduce((sum, item) => {
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
