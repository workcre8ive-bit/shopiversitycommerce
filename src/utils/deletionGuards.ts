import {
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where
} from "firebase/firestore";
import { db } from "../firebase";
import { handleFirestoreError, OperationType } from "../lib/firebase-errors";
import { DeliveryJob, Order } from "../types";
import { triggerTemplatedEmail } from "./orderEmailNotifications";

const TERMINAL_ORDER_STATUSES = new Set([
  "completed",
  "cancelled",
  "acquired"
]);

const DELIVERED_ORDER_STATUSES = new Set([
  "delivered",
  "order delivered"
]);

const UNACCEPTED_PENDING_ORDER_STATUSES = new Set([
  "pending",
  "pending seller acceptance"
]);

const ACTIVE_LOGISTICS_DELIVERY_STATUSES = new Set([
  "accepted",
  "picked_up",
  "in_transit",
  "out_for_delivery"
]);

export interface ProductOrSellerDeletionCheck {
  allowed: boolean;
  blockingOrders: Order[];
  pendingUnacceptedOrders: Order[];
  reason?: string;
}

export interface LogisticsDeletionCheck {
  allowed: boolean;
  blockingDeliveries: DeliveryJob[];
  blockingOrders: Order[];
  pendingDeliveries: DeliveryJob[];
  reason?: string;
}

function classifyOrderForDeletion(
  order: Order,
  activeDeliveriesByOrderId: Map<string, DeliveryJob>
): { blocking: boolean; isUnacceptedPending: boolean; reasonDetail?: string } {
  const status = String(order.status || "").trim().toLowerCase();
  const escrowStatus = String(order.escrowStatus || "").trim().toLowerCase();
  const disputeStatus = String(order.disputeStatus || "").trim().toLowerCase();
  const refundStatus = String(order.refundStatus || "").trim().toLowerCase();
  const logisticsOfferStatus = String(order.logisticsOfferStatus || "").trim().toLowerCase();

  // Active dispute or pending refund claim ALWAYS blocks deletion until resolved
  if (
    disputeStatus === "active" ||
    disputeStatus === "seller_responded" ||
    ["requested", "under_review", "processing"].includes(refundStatus)
  ) {
    return {
      blocking: true,
      isUnacceptedPending: false,
      reasonDetail: "active dispute or refund review"
    };
  }

  // Completed / Cancelled / Acquired orders do not block deletion
  if (TERMINAL_ORDER_STATUSES.has(status)) {
    return { blocking: false, isUnacceptedPending: false };
  }

  // Delivered orders only unblock once buyer confirmed or escrow released/refunded
  if (DELIVERED_ORDER_STATUSES.has(status)) {
    if (order.confirmOrderPressed === true || escrowStatus === "released" || escrowStatus === "refunded") {
      return { blocking: false, isUnacceptedPending: false };
    }
    return {
      blocking: true,
      isUnacceptedPending: false,
      reasonDetail: "delivered order awaiting buyer completion/escrow release"
    };
  }

  // Logistics company accepted / active delivery in process blocks deletion even before other status sync
  const activeDelivery = activeDeliveriesByOrderId.get(order.id);
  if (
    logisticsOfferStatus === "accepted" ||
    Boolean(order.logisticsAcceptedAt) ||
    Boolean(activeDelivery)
  ) {
    return {
      blocking: true,
      isUnacceptedPending: false,
      reasonDetail: "order already accepted by a logistics company and in delivery process"
    };
  }

  // Seller has NOT accepted yet and NO logistics company has accepted yet
  if (UNACCEPTED_PENDING_ORDER_STATUSES.has(status) && !order.acceptedAt) {
    return { blocking: false, isUnacceptedPending: true };
  }

  // Seller accepted or order is actively in fulfillment/pickup/transit
  return {
    blocking: true,
    isUnacceptedPending: false,
    reasonDetail: `order in process (${order.status || "accepted"})`
  };
}

async function fetchActiveDeliveriesForSeller(sellerId: string): Promise<Map<string, DeliveryJob>> {
  const map = new Map<string, DeliveryJob>();
  try {
    const snap = await getDocs(
      query(collection(db, "logistics_deliveries"), where("senderId", "==", sellerId))
    );
    for (const d of snap.docs) {
      const deliv = { id: d.id, ...d.data() } as DeliveryJob;
      const st = String(deliv.status || "").trim().toLowerCase();
      if (ACTIVE_LOGISTICS_DELIVERY_STATUSES.has(st) && deliv.orderId) {
        map.set(deliv.orderId, deliv);
      }
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, "logistics_deliveries");
  }
  return map;
}

/**
 * Checks if a single product can be deleted (soft trash or permanent delete).
 * Deletion is ONLY allowed if the seller has NO accepted orders and NO orders in process
 * (including orders accepted by a logistics company).
 */
export async function checkCanDeleteProduct(
  productId: string,
  sellerId: string
): Promise<ProductOrSellerDeletionCheck> {
  if (!productId || !sellerId) {
    return { allowed: true, blockingOrders: [], pendingUnacceptedOrders: [] };
  }

  let sellerOrders: Order[] = [];
  try {
    const ordersSnap = await getDocs(
      query(collection(db, "orders"), where("sellerId", "==", sellerId))
    );
    sellerOrders = ordersSnap.docs
      .map((d) => ({ id: d.id, ...d.data() }) as Order)
      .filter((o) => o.productId === productId);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, "orders");
  }

  const activeDeliveriesByOrderId = await fetchActiveDeliveriesForSeller(sellerId);
  const blockingOrders: Order[] = [];
  const pendingUnacceptedOrders: Order[] = [];

  for (const order of sellerOrders) {
    const res = classifyOrderForDeletion(order, activeDeliveriesByOrderId);
    if (res.blocking) {
      blockingOrders.push(order);
    } else if (res.isUnacceptedPending) {
      pendingUnacceptedOrders.push(order);
    }
  }

  if (blockingOrders.length > 0) {
    const orderRefs = blockingOrders
      .slice(0, 3)
      .map((o) => o.uniqueOrderId || o.id.slice(0, 8).toUpperCase())
      .join(", ");
    const more = blockingOrders.length > 3 ? ` (+${blockingOrders.length - 3} more)` : "";
    return {
      allowed: false,
      blockingOrders,
      pendingUnacceptedOrders,
      reason: `Cannot delete this product right now: ${blockingOrders.length} accepted or in-process order(s) (${orderRefs}${more}) are still active or accepted by a logistics company. Complete or cancel those orders first.`
    };
  }

  return {
    allowed: true,
    blockingOrders: [],
    pendingUnacceptedOrders
  };
}

/**
 * Checks if a seller account (or all seller products via Clear All Data) can be deleted.
 * Deletion is ONLY allowed when the seller has NO accepted orders and NO orders in process
 * (including any order accepted by a logistics company).
 */
export async function checkCanDeleteSellerAccount(
  sellerId: string
): Promise<ProductOrSellerDeletionCheck> {
  if (!sellerId) {
    return { allowed: true, blockingOrders: [], pendingUnacceptedOrders: [] };
  }

  let sellerOrders: Order[] = [];
  try {
    const ordersSnap = await getDocs(
      query(collection(db, "orders"), where("sellerId", "==", sellerId))
    );
    sellerOrders = ordersSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, "orders");
  }

  const activeDeliveriesByOrderId = await fetchActiveDeliveriesForSeller(sellerId);
  const blockingOrders: Order[] = [];
  const pendingUnacceptedOrders: Order[] = [];

  for (const order of sellerOrders) {
    const res = classifyOrderForDeletion(order, activeDeliveriesByOrderId);
    if (res.blocking) {
      blockingOrders.push(order);
    } else if (res.isUnacceptedPending) {
      pendingUnacceptedOrders.push(order);
    }
  }

  if (blockingOrders.length > 0) {
    const orderRefs = blockingOrders
      .slice(0, 3)
      .map((o) => o.uniqueOrderId || o.id.slice(0, 8).toUpperCase())
      .join(", ");
    const more = blockingOrders.length > 3 ? ` (+${blockingOrders.length - 3} more)` : "";
    return {
      allowed: false,
      blockingOrders,
      pendingUnacceptedOrders,
      reason: `Cannot delete seller account or all products right now: you have ${blockingOrders.length} accepted or in-process order(s) (${orderRefs}${more}), including any active logistics deliveries. Finish or resolve all active orders first.`
    };
  }

  return {
    allowed: true,
    blockingOrders: [],
    pendingUnacceptedOrders
  };
}

/**
 * Checks if a logistics company account can be deleted.
 * Deletion is ONLY allowed when the logistics company has NO accepted deliveries and
 * NO deliveries currently in process (accepted, picked_up, in_transit, out_for_delivery).
 */
export async function checkCanDeleteLogisticsAccount(
  logisticsId: string
): Promise<LogisticsDeletionCheck> {
  if (!logisticsId) {
    return { allowed: true, blockingDeliveries: [], blockingOrders: [], pendingDeliveries: [] };
  }

  let deliveries: DeliveryJob[] = [];
  try {
    const snap = await getDocs(
      query(collection(db, "logistics_deliveries"), where("logisticsId", "==", logisticsId))
    );
    deliveries = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as DeliveryJob);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, "logistics_deliveries");
  }

  let linkedOrders: Order[] = [];
  try {
    const ordersSnap = await getDocs(
      query(collection(db, "orders"), where("logisticsId", "==", logisticsId))
    );
    linkedOrders = ordersSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, "orders");
  }

  const blockingDeliveries: DeliveryJob[] = [];
  const pendingDeliveries: DeliveryJob[] = [];

  for (const d of deliveries) {
    const st = String(d.status || "").trim().toLowerCase();
    if (ACTIVE_LOGISTICS_DELIVERY_STATUSES.has(st)) {
      blockingDeliveries.push(d);
    } else if (st === "pending") {
      pendingDeliveries.push(d);
    }
  }

  const blockingOrders: Order[] = [];
  for (const o of linkedOrders) {
    const orderStatus = String(o.status || "").trim().toLowerCase();
    const offerStatus = String(o.logisticsOfferStatus || "").trim().toLowerCase();
    const isFinished =
      TERMINAL_ORDER_STATUSES.has(orderStatus) || DELIVERED_ORDER_STATUSES.has(orderStatus);
    if (!isFinished && (offerStatus === "accepted" || Boolean(o.logisticsAcceptedAt))) {
      blockingOrders.push(o);
    }
  }

  const totalBlocking = Math.max(blockingDeliveries.length, blockingOrders.length);
  if (blockingDeliveries.length > 0 || blockingOrders.length > 0) {
    const refs = [
      ...blockingDeliveries.map((d) => d.orderId),
      ...blockingOrders.map((o) => o.uniqueOrderId || o.id.slice(0, 8).toUpperCase())
    ]
      .filter(Boolean)
      .slice(0, 3)
      .join(", ");
    return {
      allowed: false,
      blockingDeliveries,
      blockingOrders,
      pendingDeliveries,
      reason: `Cannot delete logistics company account: you have ${totalBlocking} accepted or in-process delivery job(s) (${refs}) that have not yet been delivered or cancelled. Complete all active deliveries first.`
    };
  }

  return {
    allowed: true,
    blockingDeliveries: [],
    blockingOrders: [],
    pendingDeliveries
  };
}

/**
 * When a seller deletes a product/account that only has UNACCEPTED pending orders,
 * cleanly cancels those unaccepted orders and notifies affected buyers so nothing is orphaned.
 */
export async function cancelUnacceptedPendingOrdersBeforeDelete(
  pendingOrders: Order[],
  reasonText: string
): Promise<void> {
  const nowIso = new Date().toISOString();
  for (const order of pendingOrders) {
    try {
      await updateDoc(doc(db, "orders", order.id), {
        status: "cancelled",
        cancelledAt: nowIso,
        updatedAt: nowIso,
        deliveredWorkNotes: reasonText
      }).catch(() => {});

      await updateDoc(doc(db, "logistics_deliveries", `DLV_${order.id}`), {
        status: "cancelled",
        updatedAt: nowIso
      }).catch(() => {});

      if (order.buyerEmail) {
        void triggerTemplatedEmail({
          templateId: "buyer_order_rejected_by_seller",
          recipientEmail: order.buyerEmail,
          recipientUserId: order.buyerId,
          recipientRole: "buyer",
          variables: {
            buyer_name: order.buyerName || "Customer",
            order_id: order.uniqueOrderId || order.id,
            product_name: order.productName,
            seller_name: order.sellerName || "Seller",
            order_total: `NGN ${Number(order.totalPrice || 0).toLocaleString()}`,
            cancellation_reason: reasonText
          },
          idempotencyKey: `order_auto_cancel_del_${order.id}`
        });
      }
    } catch {
      // Non-fatal cleanup
    }
  }
}

/**
 * Releases any unaccepted "pending" delivery requests when a logistics company deletes its account.
 */
export async function releasePendingLogisticsJobsBeforeDelete(
  pendingDeliveries: DeliveryJob[],
  companyName?: string
): Promise<void> {
  const nowIso = new Date().toISOString();
  for (const d of pendingDeliveries) {
    try {
      await updateDoc(doc(db, "logistics_deliveries", d.id), {
        status: "declined",
        updatedAt: nowIso
      }).catch(() => {});
      if (d.orderId) {
        await updateDoc(doc(db, "orders", d.orderId), {
          logisticsOfferStatus: "declined",
          deliveredWorkNotes: `${companyName || "Logistics company"} removed account prior to accepting dispatch.`,
          updatedAt: nowIso
        }).catch(() => {});
      }
    } catch {
      // Non-fatal cleanup
    }
  }
}
