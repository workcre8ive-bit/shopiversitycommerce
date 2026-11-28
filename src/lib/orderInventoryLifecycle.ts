import { doc, getDoc, runTransaction, addDoc, collection, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Order } from "../types";

export const ORDER_INVENTORY_HOLD_MS = 24 * 60 * 60 * 1000;

export interface OrderLiveStockResult {
  availableStock: number;
  isDeleted: boolean;
  isOneDollar: boolean;
  sourceCollection: "products" | "oneDollarListings";
  sourceId: string;
}

export interface ReducedOrderMetrics {
  quantity: number;
  itemSubtotal: number;
  totalPrice: number;
  commissionAmount: number;
  sellerEarnings: number;
}

const inFlightReleaseIds = new Set<string>();
const completedReleaseIds = new Set<string>();

export function getOrderCreatedAtMs(order: Partial<Order>): number {
  if (!order?.createdAt) return 0;
  const parsed = Date.parse(order.createdAt);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function isOrderOver24HoursUncompleted(order: Partial<Order>, now = Date.now()): boolean {
  if (!order) return false;
  if (order.type === "service" || Boolean(order.ticketTierId)) return false;

  const statusLower = (order.status || "").trim().toLowerCase();
  if (
    statusLower === "completed" ||
    statusLower === "cancelled" ||
    statusLower === "acquired"
  ) {
    return false;
  }

  if (order.escrowStatus === "refunded" || order.refundStatus === "completed") {
    return false;
  }

  const createdMs = getOrderCreatedAtMs(order);
  if (createdMs <= 0) return false;

  return now - createdMs >= ORDER_INVENTORY_HOLD_MS;
}

/**
 * Determines whether an uncompleted order has crossed the 24-hour hold window
 * and needs its reserved quantity returned back to live inventory without
 * cancelling the order or revoking its payment stage.
 */
export function shouldReleaseOrderInventoryAfter24h(order: Partial<Order>, now = Date.now()): boolean {
  if (!order?.id) return false;
  if (order.inventoryReleasedAfter24h) return false;
  if (order.paymentStatus === "paid") return false;
  if (Number(order.quantity || 0) <= 0) return false;
  return isOrderOver24HoursUncompleted(order, now);
}

function resolveInventoryTarget(order: Partial<Order>): {
  collectionName: "products" | "oneDollarListings";
  docId: string;
  isOneDollar: boolean;
} | null {
  if (order.isOneDollar && order.oneDollarListingId) {
    return {
      collectionName: "oneDollarListings",
      docId: order.oneDollarListingId,
      isOneDollar: true,
    };
  }
  if (order.productId) {
    return {
      collectionName: "products",
      docId: order.productId,
      isOneDollar: false,
    };
  }
  return null;
}

/**
 * Atomically returns an uncompleted 24h+ order's quantity to inventory while
 * keeping order status and payment stage completely intact.
 */
export async function releaseOrderInventoryAfter24h(order: Order): Promise<boolean> {
  if (!order?.id || !shouldReleaseOrderInventoryAfter24h(order)) {
    return false;
  }
  if (completedReleaseIds.has(order.id) || inFlightReleaseIds.has(order.id)) {
    return false;
  }

  const target = resolveInventoryTarget(order);
  if (!target) return false;

  inFlightReleaseIds.add(order.id);
  try {
    const released = await runTransaction(db, async (tx) => {
      const orderRef = doc(db, "orders", order.id);
      const orderSnap = await tx.get(orderRef);
      if (!orderSnap.exists()) return false;

      const freshOrder = { id: orderSnap.id, ...orderSnap.data() } as Order;
      if (!shouldReleaseOrderInventoryAfter24h(freshOrder)) {
        return false;
      }

      const qty = Math.max(0, Math.floor(Number(freshOrder.quantity || 0)));
      if (qty <= 0) return false;

      const nowIso = new Date().toISOString();
      const targetRef = doc(db, target.collectionName, target.docId);
      const targetSnap = await tx.get(targetRef);

      if (targetSnap.exists()) {
        const targetData = targetSnap.data() as any;
        const currentStock = Math.max(0, Number(targetData?.stock || 0));
        // Ignore virtual unlimited stock (e.g. 999999 on services)
        if (currentStock < 999999 && targetData?.isDeleted !== true) {
          const restoredStock = currentStock + qty;
          if (target.isOneDollar) {
            tx.update(targetRef, {
              stock: restoredStock,
              updatedAt: nowIso,
            });
          } else {
            const productUpdate: Record<string, any> = {
              stock: restoredStock,
              updatedAt: nowIso,
            };
            if (restoredStock > 0 && targetData?.status === "inactive") {
              productUpdate.status = "active";
              productUpdate.outOfStockAt = null;
            }
            tx.update(targetRef, productUpdate);
          }
        }
      }

      // IMPORTANT: Preserve order.status, paymentMethod, paymentStatus, and payment stage
      tx.update(orderRef, {
        inventoryReleasedAfter24h: true,
        inventoryReleasedAt: nowIso,
        inventoryReleasedQty: qty,
        updatedAt: nowIso,
      });

      return true;
    });

    completedReleaseIds.add(order.id);
    return released;
  } catch (err) {
    console.warn(`[24h Inventory Return] Deferred/failed for order ${order.id}:`, err);
    return false;
  } finally {
    inFlightReleaseIds.delete(order.id);
  }
}

export async function releaseExpiredOrdersInventoryBatch(orders: Order[]): Promise<void> {
  if (!Array.isArray(orders) || orders.length === 0) return;
  const now = Date.now();
  const candidates = orders.filter((o) => shouldReleaseOrderInventoryAfter24h(o, now));
  for (const order of candidates) {
    await releaseOrderInventoryAfter24h(order);
  }
}

export async function fetchOrderLiveAvailableStock(order: Order): Promise<OrderLiveStockResult> {
  const target = resolveInventoryTarget(order);
  if (!target) {
    return {
      availableStock: 0,
      isDeleted: true,
      isOneDollar: Boolean(order.isOneDollar),
      sourceCollection: "products",
      sourceId: order.productId || "",
    };
  }

  const snap = await getDoc(doc(db, target.collectionName, target.docId));
  if (!snap.exists()) {
    return {
      availableStock: 0,
      isDeleted: true,
      isOneDollar: target.isOneDollar,
      sourceCollection: target.collectionName,
      sourceId: target.docId,
    };
  }

  const data = snap.data() as any;
  const isDeleted = Boolean(data?.isDeleted);
  const stockNum = isDeleted ? 0 : Math.max(0, Math.floor(Number(data?.stock ?? 0)));

  return {
    availableStock: stockNum,
    isDeleted,
    isOneDollar: target.isOneDollar,
    sourceCollection: target.collectionName,
    sourceId: target.docId,
  };
}

/**
 * When an unpaid order pays after 24 hours (meaning its inventory had been
 * returned to live stock), re-deduct the paid quantity safely inside a transaction.
 */
export async function reclaimOrderInventoryOnPost24hPayment(
  order: Order,
  quantityToDeduct?: number
): Promise<{ ok: boolean; reason?: "insufficient_stock" | "deleted"; availableStock?: number }> {
  if (order.type === "service" || Boolean(order.ticketTierId)) {
    return { ok: true };
  }

  const target = resolveInventoryTarget(order);
  if (!target) return { ok: true };

  const targetQty = Math.max(1, Math.floor(Number(quantityToDeduct ?? order.quantity ?? 1)));
  const nowIso = new Date().toISOString();

  return await runTransaction(db, async (tx) => {
    const orderRef = doc(db, "orders", order.id);
    const orderSnap = await tx.get(orderRef);
    if (!orderSnap.exists()) {
      return { ok: false, reason: "deleted" as const };
    }
    const freshOrder = { id: orderSnap.id, ...orderSnap.data() } as Order;

    // Only re-deduct if inventory was returned after 24h and hasn't already been reclaimed
    if (!freshOrder.inventoryReleasedAfter24h || freshOrder.inventoryReclaimedAfter24h) {
      return { ok: true };
    }

    const targetRef = doc(db, target.collectionName, target.docId);
    const targetSnap = await tx.get(targetRef);
    if (!targetSnap.exists() || targetSnap.data()?.isDeleted) {
      return { ok: false, reason: "deleted" as const, availableStock: 0 };
    }

    const targetData = targetSnap.data() as any;
    const currentStock = Math.max(0, Math.floor(Number(targetData?.stock ?? 0)));

    if (currentStock < targetQty) {
      return {
        ok: false,
        reason: "insufficient_stock" as const,
        availableStock: currentStock,
      };
    }

    const nextStock = Math.max(0, currentStock - targetQty);
    if (target.isOneDollar) {
      tx.update(targetRef, {
        stock: nextStock,
        updatedAt: nowIso,
      });
    } else {
      const prodUpdate: Record<string, any> = {
        stock: nextStock,
        updatedAt: nowIso,
      };
      if (nextStock <= 0) {
        prodUpdate.status = "inactive";
        prodUpdate.outOfStockAt = nowIso;
      }
      tx.update(targetRef, prodUpdate);
    }

    tx.update(orderRef, {
      inventoryReclaimedAfter24h: true,
      inventoryReclaimedAt: nowIso,
      waitingForRefill: false,
      updatedAt: nowIso,
    });

    return { ok: true };
  });
}

export function calculateReducedOrderMetrics(order: Order, newQty: number): ReducedOrderMetrics {
  const originalQty = Math.max(1, Math.floor(Number(order.quantity || 1)));
  const safeNewQty = Math.max(1, Math.min(originalQty, Math.floor(newQty)));
  const deliveryCost = Math.max(0, Number(order.deliveryFee ?? order.deliveryPrice ?? 0));

  const recordedSubtotal = Number(order.itemSubtotal);
  const baseItemSubtotal =
    Number.isFinite(recordedSubtotal) && recordedSubtotal > 0
      ? recordedSubtotal
      : Math.max(0, Number(order.totalPrice || 0) - deliveryCost);

  const unitItemPrice = baseItemSubtotal > 0 ? baseItemSubtotal / originalQty : Number(order.totalPrice || 0) / originalQty;
  const newItemSubtotal = Math.round(unitItemPrice * safeNewQty);

  const defaultRate = order.type === "service" ? 0.06 : 0.05;
  const derivedRate =
    baseItemSubtotal > 0 && Number.isFinite(Number(order.commissionAmount))
      ? Math.max(0, Math.min(0.25, Number(order.commissionAmount) / baseItemSubtotal))
      : defaultRate;

  const newCommission = Math.round(newItemSubtotal * derivedRate);
  const newSellerEarnings = Math.max(0, newItemSubtotal - newCommission);
  const newTotalPrice =
    baseItemSubtotal > 0
      ? Math.max(0, newItemSubtotal + deliveryCost)
      : Math.round((Number(order.totalPrice || 0) / originalQty) * safeNewQty);

  return {
    quantity: safeNewQty,
    itemSubtotal: newItemSubtotal,
    totalPrice: newTotalPrice,
    commissionAmount: newCommission,
    sellerEarnings: newSellerEarnings,
  };
}

export async function reduceUnpaidOrderQuantityToAvailable(
  order: Order,
  availableStock: number
): Promise<Order> {
  const safeAvailable = Math.max(1, Math.floor(availableStock));
  const metrics = calculateReducedOrderMetrics(order, safeAvailable);
  const nowIso = new Date().toISOString();

  await updateDoc(doc(db, "orders", order.id), {
    quantity: metrics.quantity,
    itemSubtotal: metrics.itemSubtotal,
    totalPrice: metrics.totalPrice,
    commissionAmount: metrics.commissionAmount,
    sellerEarnings: metrics.sellerEarnings,
    postExpiryReducedFromQty: order.postExpiryReducedFromQty || order.quantity,
    waitingForRefill: false,
    updatedAt: nowIso,
  });

  if (order.sellerId) {
    await addDoc(collection(db, "notifications"), {
      userId: order.sellerId,
      title: "Order Quantity Adjusted to Available Stock",
      message: `${order.buyerName || "Buyer"} adjusted ${order.productName} from ${order.quantity} to ${metrics.quantity} unit(s) to match your current stock before paying.`,
      type: "order",
      isRead: false,
      createdAt: nowIso,
    }).catch(() => {});
  }

  return {
    ...order,
    quantity: metrics.quantity,
    itemSubtotal: metrics.itemSubtotal,
    totalPrice: metrics.totalPrice,
    commissionAmount: metrics.commissionAmount,
    sellerEarnings: metrics.sellerEarnings,
    postExpiryReducedFromQty: order.postExpiryReducedFromQty || order.quantity,
    waitingForRefill: false,
    updatedAt: nowIso,
  };
}
