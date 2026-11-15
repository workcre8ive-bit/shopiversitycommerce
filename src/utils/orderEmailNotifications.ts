import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

export interface OrderEmailPartyContext {
  orderId: string;
  order: any;
  buyerEmail?: string | null;
  sellerEmail?: string | null;
  logisticsEmail?: string | null;
}

function normalizeEmail(value?: string | null): string {
  if (!value || typeof value !== "string") return "";
  const trimmed = value.trim().toLowerCase();
  return trimmed.includes("@") ? trimmed : "";
}

/**
 * Resolve a user's email address from direct value first, then Firestore `users/{userId}`.
 */
export async function resolveUserEmail(
  directEmail?: string | null,
  userId?: string | null
): Promise<string> {
  const cleanDirect = normalizeEmail(directEmail);
  if (cleanDirect) return cleanDirect;
  if (!userId) return "";

  try {
    const snap = await getDoc(doc(db, "users", userId));
    if (snap.exists()) {
      return normalizeEmail(snap.data()?.email);
    }
  } catch (err) {
    console.warn("[EMAIL RESOLVE] Unable to look up user email:", userId, err);
  }
  return "";
}

/**
 * Resolve a logistics company's email address from direct value, `logistics_companies/{id}`, or `users/{id}`.
 */
export async function resolveLogisticsEmail(
  directEmail?: string | null,
  logisticsId?: string | null
): Promise<string> {
  const cleanDirect = normalizeEmail(directEmail);
  if (cleanDirect) return cleanDirect;
  if (!logisticsId || logisticsId === "outsourced") return "";

  try {
    const logSnap = await getDoc(doc(db, "logistics_companies", logisticsId));
    if (logSnap.exists()) {
      const logEmail = normalizeEmail(logSnap.data()?.email);
      if (logEmail) return logEmail;
    }
  } catch (err) {
    console.warn("[EMAIL RESOLVE] Unable to look up logistics_companies email:", logisticsId, err);
  }

  return resolveUserEmail(null, logisticsId);
}

export interface SendOrderStatusPayload {
  orderId: string;
  recipientEmail?: string;
  recipientUserId?: string;
  recipientRole?: "buyer" | "seller" | "logistics";
  recipientName?: string;
  buyerName?: string;
  sellerName?: string;
  logisticsName?: string;
  productName?: string;
  quantity?: number;
  totalPrice?: number;
  paymentMethod?: string;
  deliveryType?: string;
  status: string;
  statusTitle: string;
  statusMessage: string;
  deliveryOtp?: string;
  pinLabel?: string;
  idempotencyKey?: string;
}

export async function dispatchOrderStatusEmail(payload: SendOrderStatusPayload): Promise<void> {
  const cleanEmail = normalizeEmail(payload.recipientEmail);
  if (!cleanEmail && !payload.recipientUserId) return;

  try {
    await fetch("/api/send-order-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        recipientEmail: cleanEmail || undefined
      })
    });
  } catch (err) {
    console.warn("[BREVO NOTICE] Order lifecycle email dispatch failed:", err);
  }
}

export async function dispatchReceiptEmail(params: {
  orderId: string;
  recipientEmail?: string;
  recipientName?: string;
  order: any;
}): Promise<void> {
  const cleanEmail = normalizeEmail(params.recipientEmail);
  if (!cleanEmail) return;

  try {
    await fetch("/api/send-receipt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: params.orderId,
        recipientEmail: cleanEmail,
        recipientName: params.recipientName || params.order?.buyerName || "Customer",
        order: params.order
      })
    });
  } catch (err) {
    console.warn("[BREVO NOTICE] Receipt email dispatch failed:", err);
  }
}

/**
 * Stage 1: Buyer places an order -> Email Buyer (+ Escrow Receipt if paid), Seller, and auto-booked Logistics Partner (if applicable).
 */
export async function notifyOrderPlaced(params: {
  orderId: string;
  order: any;
  buyerEmail?: string | null;
  sellerEmail?: string | null;
  logisticsPartner?: {
    id?: string;
    name?: string;
    email?: string | null;
    deliveryPrice?: number;
  } | null;
}): Promise<void> {
  const { orderId, order, logisticsPartner } = params;
  const displayOrderId = order?.uniqueOrderId || orderId;
  const isPaid = order?.paymentStatus === "paid";
  const buyerName = order?.buyerName || "Student Buyer";
  const sellerName = order?.sellerName || "Campus Merchant";
  const productName = order?.productName || "Campus Marketplace Order";
  const quantity = order?.quantity || 1;
  const totalPrice = Number(order?.totalPrice || 0);
  const deliveryPin = order?.deliveryOtp || order?.deliveryPin || "";

  const [buyerEmail, sellerEmail, logisticsEmail] = await Promise.all([
    resolveUserEmail(params.buyerEmail || order?.buyerEmail, order?.buyerId),
    resolveUserEmail(params.sellerEmail || order?.sellerEmail, order?.sellerId),
    logisticsPartner?.id
      ? resolveLogisticsEmail(logisticsPartner.email, logisticsPartner.id)
      : Promise.resolve("")
  ]);

  const tasks: Promise<void>[] = [];

  if (buyerEmail || order?.buyerId) {
    tasks.push(
      dispatchOrderStatusEmail({
        orderId,
        recipientEmail: buyerEmail,
        recipientUserId: order?.buyerId,
        recipientRole: "buyer",
        recipientName: buyerName,
        buyerName,
        sellerName,
        productName,
        quantity,
        totalPrice,
        paymentMethod: order?.paymentMethod,
        deliveryType: order?.deliveryType,
        status: isPaid ? "Payment Secured & Placed" : "Order Placed",
        statusTitle: isPaid
          ? "Order Placed and Payment Secured in Escrow"
          : "Order Placed Successfully",
        statusMessage: isPaid
          ? `Thank you for your order (${displayOrderId}). Your payment of NGN ${totalPrice.toLocaleString()} is secured in SHOPIVERSITY Escrow. Merchant ${sellerName} has been notified to review and prepare your item.`
          : `Thank you for your order (${displayOrderId}) for "${productName}" (x${quantity}). Merchant ${sellerName} has been notified to accept and fulfill your order.`,
        deliveryOtp: deliveryPin,
        pinLabel: order?.deliveryType === "pickup" ? "Secure Pickup Verification PIN" : "Secure Handover Delivery PIN",
        idempotencyKey: `order_placed_${orderId}_buyer`
      })
    );

    if (isPaid && buyerEmail) {
      tasks.push(
        dispatchReceiptEmail({
          orderId,
          recipientEmail: buyerEmail,
          recipientName: buyerName,
          order: {
            ...order,
            uniqueOrderId: displayOrderId,
            sellerName
          }
        })
      );
    }
  }

  if (sellerEmail || order?.sellerId) {
    tasks.push(
      dispatchOrderStatusEmail({
        orderId,
        recipientEmail: sellerEmail,
        recipientUserId: order?.sellerId,
        recipientRole: "seller",
        recipientName: sellerName,
        buyerName,
        sellerName,
        productName,
        quantity,
        totalPrice,
        paymentMethod: order?.paymentMethod,
        deliveryType: order?.deliveryType,
        status: "New Order Received",
        statusTitle: `New Order Received for "${productName}"`,
        statusMessage: `${buyerName} placed order ${displayOrderId} for "${productName}" (x${quantity}) totaling NGN ${totalPrice.toLocaleString()}. Please open your Seller Dashboard to accept and process this order.`,
        idempotencyKey: `order_received_${orderId}_seller`
      })
    );
  }

  if (logisticsPartner?.id && (logisticsEmail || logisticsPartner.id)) {
    const logisticsName = logisticsPartner.name || "Logistics Partner";
    const feeText = logisticsPartner.deliveryPrice
      ? ` (Delivery Fee: NGN ${Number(logisticsPartner.deliveryPrice).toLocaleString()})`
      : "";
    tasks.push(
      dispatchOrderStatusEmail({
        orderId,
        recipientEmail: logisticsEmail,
        recipientUserId: logisticsPartner.id,
        recipientRole: "logistics",
        recipientName: logisticsName,
        buyerName,
        sellerName,
        logisticsName,
        productName,
        quantity,
        totalPrice,
        deliveryType: order?.deliveryType || "delivery",
        status: "Dispatch Request Received",
        statusTitle: `New Delivery Dispatch Request (${displayOrderId})`,
        statusMessage: `A new order "${productName}" (x${quantity}) from ${sellerName} to ${buyerName} has been assigned to ${logisticsName}${feeText}. Open your Logistics Hub to review and accept this delivery.`,
        idempotencyKey: `logistics_booked_${orderId}_${logisticsPartner.id}`
      })
    );
  }

  await Promise.all(tasks);
}

/**
 * Stage 2 & Pickup/Completion transitions from Seller Dashboard -> Email Buyer, Seller, and Logistics Company (when applicable).
 */
export async function notifySellerOrderUpdate(params: {
  orderId: string;
  order: any;
  targetStatus: string;
  sellerDisplayName?: string | null;
  sellerEmail?: string | null;
}): Promise<void> {
  const { orderId, order, targetStatus } = params;
  const normalized = targetStatus.trim().toLowerCase();

  if (normalized === "completed" || normalized === "paid") {
    await notifyOrderCompleted({
      orderId,
      order,
      sellerEmail: params.sellerEmail
    });
    return;
  }

  const displayOrderId = order?.uniqueOrderId || orderId;
  const buyerName = order?.buyerName || "Customer";
  const sellerName = params.sellerDisplayName || order?.sellerName || "Campus Merchant";
  const productName = order?.productName || "Campus Order";
  const quantity = order?.quantity || 1;
  const totalPrice = Number(order?.totalPrice || 0);
  const deliveryOtp = order?.deliveryOtp || order?.deliveryPin || "";

  const [buyerEmail, sellerEmail, logisticsEmail] = await Promise.all([
    resolveUserEmail(order?.buyerEmail, order?.buyerId),
    resolveUserEmail(params.sellerEmail || order?.sellerEmail, order?.sellerId),
    order?.logisticsId && order?.logisticsId !== "outsourced"
      ? resolveLogisticsEmail(order?.logisticsEmail, order?.logisticsId)
      : Promise.resolve("")
  ]);

  let buyerTitle = "Order Status Updated";
  let buyerMessage = `Your order ${displayOrderId} for "${productName}" has been updated to ${targetStatus}.`;
  let sellerTitle = `Order ${displayOrderId} Updated`;
  let sellerMessage = `You updated order ${displayOrderId} for "${productName}" to ${targetStatus}.`;
  let includeDeliveryPinForBuyer = false;

  if (normalized === "accepted") {
    buyerTitle = "Seller Accepted Your Order";
    buyerMessage = `${sellerName} has accepted your order (${displayOrderId}) for "${productName}" (x${quantity}) and is preparing it for ${
      order?.deliveryType === "pickup" ? "campus pickup" : "logistics dispatch"
    }.`;
    sellerTitle = `Order ${displayOrderId} Accepted`;
    sellerMessage = `You accepted order ${displayOrderId} for "${productName}" (x${quantity}) from ${buyerName}. ${
      order?.deliveryType === "pickup"
        ? "Mark the order ready when prepared for buyer pickup."
        : "Prepare the package and book or hand over to your campus logistics courier."
    }`;
    includeDeliveryPinForBuyer = Boolean(deliveryOtp);
  } else if (
    normalized === "start_dispatch" ||
    normalized === "out_for_delivery" ||
    normalized === "out to pickup station"
  ) {
    buyerTitle = "Order Dispatched to Pickup Point";
    buyerMessage = `${sellerName} has dispatched "${productName}" to the designated campus pickup location. Keep your pickup verification PIN handy.`;
    sellerTitle = `Pickup Dispatch Started (${displayOrderId})`;
    sellerMessage = `You marked "${productName}" as en route to the campus pickup point for ${buyerName}.`;
    includeDeliveryPinForBuyer = Boolean(deliveryOtp);
  } else if (normalized === "ready for pickup" || normalized === "ready_for_pickup") {
    buyerTitle = "Order Ready for Pickup";
    buyerMessage = `Your order (${displayOrderId}) for "${productName}" is now ready for pickup from ${sellerName}. Present your verification PIN upon collection.`;
    sellerTitle = `Order Marked Ready for Pickup (${displayOrderId})`;
    sellerMessage = `"${productName}" is marked ready for pickup by ${buyerName}.`;
    includeDeliveryPinForBuyer = Boolean(deliveryOtp);
  } else if (normalized === "cancelled") {
    buyerTitle = "Order Cancelled";
    buyerMessage = `Your order (${displayOrderId}) for "${productName}" has been cancelled. If you paid via online escrow, your refund will be processed to your original payment method.`;
    sellerTitle = `Order ${displayOrderId} Cancelled`;
    sellerMessage = `Order ${displayOrderId} for "${productName}" has been marked cancelled.`;
  } else if (normalized === "delivered" || normalized === "order delivered") {
    await notifyOrderReachedBuyer({
      orderId,
      order,
      logisticsName: order?.logisticsName || sellerName,
      sellerEmail: params.sellerEmail
    });
    return;
  }

  const tasks: Promise<void>[] = [];

  if (buyerEmail || order?.buyerId) {
    tasks.push(
      dispatchOrderStatusEmail({
        orderId,
        recipientEmail: buyerEmail,
        recipientUserId: order?.buyerId,
        recipientRole: "buyer",
        recipientName: buyerName,
        buyerName,
        sellerName,
        productName,
        quantity,
        totalPrice,
        deliveryType: order?.deliveryType,
        status: targetStatus,
        statusTitle: buyerTitle,
        statusMessage: buyerMessage,
        deliveryOtp: includeDeliveryPinForBuyer ? deliveryOtp : undefined,
        pinLabel: order?.deliveryType === "pickup" ? "Secure Pickup Verification PIN" : "Secure Handover Delivery PIN",
        idempotencyKey: `seller_update_${orderId}_${normalized}_buyer`
      })
    );
  }

  if (sellerEmail || order?.sellerId) {
    tasks.push(
      dispatchOrderStatusEmail({
        orderId,
        recipientEmail: sellerEmail,
        recipientUserId: order?.sellerId,
        recipientRole: "seller",
        recipientName: sellerName,
        buyerName,
        sellerName,
        productName,
        quantity,
        totalPrice,
        deliveryType: order?.deliveryType,
        status: targetStatus,
        statusTitle: sellerTitle,
        statusMessage: sellerMessage,
        idempotencyKey: `seller_update_${orderId}_${normalized}_seller`
      })
    );
  }

  if (normalized === "cancelled" && order?.logisticsId && order.logisticsId !== "outsourced" && (logisticsEmail || order.logisticsId)) {
    tasks.push(
      dispatchOrderStatusEmail({
        orderId,
        recipientEmail: logisticsEmail,
        recipientUserId: order.logisticsId,
        recipientRole: "logistics",
        recipientName: order?.logisticsName || "Logistics Partner",
        buyerName,
        sellerName,
        logisticsName: order?.logisticsName,
        productName,
        quantity,
        totalPrice,
        deliveryType: order?.deliveryType,
        status: "cancelled",
        statusTitle: `Delivery Cancelled (${displayOrderId})`,
        statusMessage: `Order ${displayOrderId} ("${productName}") has been cancelled by the merchant. No pickup is required.`,
        idempotencyKey: `seller_update_${orderId}_cancelled_logistics`
      })
    );
  }

  await Promise.all(tasks);
}

/**
 * Seller books a logistics partner -> Email Logistics Company, Buyer, and Seller.
 */
export async function notifyLogisticsBooked(params: {
  orderId: string;
  order: any;
  partner: {
    id?: string;
    companyName: string;
    email?: string | null;
    phoneNumber?: string;
  };
  logisticsPrice: number;
  timeline?: string;
  sellerName?: string;
}): Promise<void> {
  const { orderId, order, partner, logisticsPrice, timeline } = params;
  const displayOrderId = order?.uniqueOrderId || orderId;
  const buyerName = order?.buyerName || "Customer";
  const sellerName = params.sellerName || order?.sellerName || "Campus Merchant";
  const productName = order?.productName || "Campus Order";
  const quantity = order?.quantity || 1;
  const newTotalPrice = (order?.itemSubtotal || (order?.totalPrice || 0) - (order?.deliveryFee || 0)) + logisticsPrice;

  const [buyerEmail, sellerEmail, logisticsEmail] = await Promise.all([
    resolveUserEmail(order?.buyerEmail, order?.buyerId),
    resolveUserEmail(order?.sellerEmail, order?.sellerId),
    partner.id && partner.id !== "outsourced"
      ? resolveLogisticsEmail(partner.email, partner.id)
      : Promise.resolve("")
  ]);

  const tasks: Promise<void>[] = [];

  if (partner.id && partner.id !== "outsourced" && (logisticsEmail || partner.id)) {
    tasks.push(
      dispatchOrderStatusEmail({
        orderId,
        recipientEmail: logisticsEmail,
        recipientUserId: partner.id,
        recipientRole: "logistics",
        recipientName: partner.companyName,
        buyerName,
        sellerName,
        logisticsName: partner.companyName,
        productName,
        quantity,
        totalPrice: newTotalPrice,
        deliveryType: order?.deliveryType || "delivery",
        status: "Dispatch Request Sent",
        statusTitle: `New Delivery Dispatch Booking (${displayOrderId})`,
        statusMessage: `Merchant ${sellerName} has booked ${partner.companyName} to deliver "${productName}" (x${quantity}) to ${buyerName} (Delivery Fee: NGN ${logisticsPrice.toLocaleString()}). Please open your Logistics Hub to accept or decline this assignment.`,
        idempotencyKey: `logistics_booked_${orderId}_${partner.id}`
      })
    );
  }

  if (buyerEmail || order?.buyerId) {
    tasks.push(
      dispatchOrderStatusEmail({
        orderId,
        recipientEmail: buyerEmail,
        recipientUserId: order?.buyerId,
        recipientRole: "buyer",
        recipientName: buyerName,
        buyerName,
        sellerName,
        logisticsName: partner.companyName,
        productName,
        quantity,
        totalPrice: newTotalPrice,
        deliveryType: order?.deliveryType || "delivery",
        status: "Courier Booked",
        statusTitle: `Logistics Partner Booked for Order ${displayOrderId}`,
        statusMessage: `${sellerName} booked "${partner.companyName}"${partner.phoneNumber ? ` (${partner.phoneNumber})` : ""} for delivery of "${productName}" (Delivery Fee: NGN ${logisticsPrice.toLocaleString()}).${timeline ? ` Timeline note: ${timeline}.` : ""}`,
        idempotencyKey: `logistics_booked_${orderId}_${partner.id || partner.companyName}_buyer`
      })
    );
  }

  if (sellerEmail || order?.sellerId) {
    tasks.push(
      dispatchOrderStatusEmail({
        orderId,
        recipientEmail: sellerEmail,
        recipientUserId: order?.sellerId,
        recipientRole: "seller",
        recipientName: sellerName,
        buyerName,
        sellerName,
        logisticsName: partner.companyName,
        productName,
        quantity,
        totalPrice: newTotalPrice,
        deliveryType: order?.deliveryType || "delivery",
        status: "Courier Booked",
        statusTitle: `Dispatch Request Sent to ${partner.companyName}`,
        statusMessage: `Your dispatch booking with ${partner.companyName} for "${productName}" (${displayOrderId}) has been sent. You will receive your Seller Handover PIN once the logistics company accepts.`,
        idempotencyKey: `logistics_booked_${orderId}_${partner.id || partner.companyName}_seller`
      })
    );
  }

  await Promise.all(tasks);
}

/**
 * Stage 3: Logistics Company accepts delivery job -> Email Seller (with Seller Handover PIN), Buyer (with Buyer Delivery PIN), and Logistics Company.
 */
export async function notifyLogisticsAccepted(params: {
  orderId: string;
  order: any;
  logisticsCompany: {
    id: string;
    companyName: string;
    email?: string | null;
    phoneNumber?: string;
  };
  timeline: string;
  deliveryFee: number;
  sellerPin: string;
  deliveryPin: string;
}): Promise<void> {
  const { orderId, order, logisticsCompany, timeline, deliveryFee, sellerPin, deliveryPin } = params;
  const displayOrderId = order?.uniqueOrderId || orderId;
  const buyerName = order?.buyerName || "Customer";
  const sellerName = order?.sellerName || "Campus Merchant";
  const productName = order?.productName || "Campus Order";
  const quantity = order?.quantity || 1;
  const totalPrice = Number(order?.totalPrice || 0);

  const [buyerEmail, sellerEmail, logisticsEmail] = await Promise.all([
    resolveUserEmail(order?.buyerEmail, order?.buyerId),
    resolveUserEmail(order?.sellerEmail, order?.sellerId),
    resolveLogisticsEmail(logisticsCompany.email, logisticsCompany.id)
  ]);

  const tasks: Promise<void>[] = [];

  if (sellerEmail || order?.sellerId) {
    tasks.push(
      dispatchOrderStatusEmail({
        orderId,
        recipientEmail: sellerEmail,
        recipientUserId: order?.sellerId,
        recipientRole: "seller",
        recipientName: sellerName,
        buyerName,
        sellerName,
        logisticsName: logisticsCompany.companyName,
        productName,
        quantity,
        totalPrice,
        deliveryType: order?.deliveryType || "delivery",
        status: "Logistics Accepted",
        statusTitle: "Logistics Company Accepted Dispatch Request",
        statusMessage: `${logisticsCompany.companyName} (${logisticsCompany.phoneNumber || "Courier"}) has accepted the delivery assignment for "${productName}" (x${quantity}). Estimated timeline: ${timeline}. Provide the Seller Handover PIN below to the rider upon pickup.`,
        deliveryOtp: sellerPin,
        pinLabel: "Seller Handover PIN (Give to Courier)",
        idempotencyKey: `logistics_accepted_${orderId}_seller`
      })
    );
  }

  if (buyerEmail || order?.buyerId) {
    tasks.push(
      dispatchOrderStatusEmail({
        orderId,
        recipientEmail: buyerEmail,
        recipientUserId: order?.buyerId,
        recipientRole: "buyer",
        recipientName: buyerName,
        buyerName,
        sellerName,
        logisticsName: logisticsCompany.companyName,
        productName,
        quantity,
        totalPrice,
        deliveryType: order?.deliveryType || "delivery",
        status: "Logistics Accepted",
        statusTitle: "Logistics Courier Accepted Your Delivery",
        statusMessage: `${logisticsCompany.companyName} (${logisticsCompany.phoneNumber || "Courier"}) has accepted your delivery for "${productName}"! Estimated timeline: ${timeline}. Keep your Delivery PIN below ready until inspection at handover.`,
        deliveryOtp: deliveryPin,
        pinLabel: "Buyer Delivery PIN (Provide After Inspection)",
        idempotencyKey: `logistics_accepted_${orderId}_buyer`
      })
    );
  }

  if (logisticsEmail || logisticsCompany.id) {
    tasks.push(
      dispatchOrderStatusEmail({
        orderId,
        recipientEmail: logisticsEmail,
        recipientUserId: logisticsCompany.id,
        recipientRole: "logistics",
        recipientName: logisticsCompany.companyName,
        buyerName,
        sellerName,
        logisticsName: logisticsCompany.companyName,
        productName,
        quantity,
        totalPrice,
        deliveryType: order?.deliveryType || "delivery",
        status: "Logistics Accepted",
        statusTitle: `Delivery Job Accepted (${displayOrderId})`,
        statusMessage: `You accepted delivery assignment ${displayOrderId} for "${productName}" (x${quantity}) from ${sellerName} to ${buyerName}. Delivery Fee: NGN ${Number(deliveryFee || 0).toLocaleString()} | Estimated timeline: ${timeline}. Verify the Seller Handover PIN when picking up from the merchant and the Buyer Delivery PIN upon drop-off.`,
        idempotencyKey: `logistics_accepted_${orderId}_logistics`
      })
    );
  }

  await Promise.all(tasks);
}

/**
 * Helper for "Order Reached the Buyer / Delivered" emails across Buyer, Seller, and Logistics Company.
 */
export async function notifyOrderReachedBuyer(params: {
  orderId: string;
  order: any;
  logisticsName?: string;
  logisticsCompanyId?: string;
  logisticsEmail?: string | null;
  sellerEmail?: string | null;
}): Promise<void> {
  const { orderId, order } = params;
  const displayOrderId = order?.uniqueOrderId || orderId;
  const buyerName = order?.buyerName || "Customer";
  const sellerName = order?.sellerName || "Campus Merchant";
  const courierName = params.logisticsName || order?.logisticsName || "Campus Logistics";
  const logisticsId = params.logisticsCompanyId || order?.logisticsId;
  const productName = order?.productName || "Campus Order";
  const quantity = order?.quantity || 1;
  const totalPrice = Number(order?.totalPrice || 0);

  const [buyerEmail, sellerEmail, logisticsEmail] = await Promise.all([
    resolveUserEmail(order?.buyerEmail, order?.buyerId),
    resolveUserEmail(params.sellerEmail || order?.sellerEmail, order?.sellerId),
    logisticsId && logisticsId !== "outsourced"
      ? resolveLogisticsEmail(params.logisticsEmail || order?.logisticsEmail, logisticsId)
      : Promise.resolve("")
  ]);

  const tasks: Promise<void>[] = [];

  if (buyerEmail || order?.buyerId) {
    tasks.push(
      dispatchOrderStatusEmail({
        orderId,
        recipientEmail: buyerEmail,
        recipientUserId: order?.buyerId,
        recipientRole: "buyer",
        recipientName: buyerName,
        buyerName,
        sellerName,
        logisticsName: courierName,
        productName,
        quantity,
        totalPrice,
        deliveryType: order?.deliveryType,
        status: "delivered",
        statusTitle: "Your Order Has Reached You (Delivered)",
        statusMessage: `${courierName} has delivered "${productName}" (x${quantity}) for order ${displayOrderId}. Please inspect your item thoroughly and confirm order completion inside your Orders tab to release escrow payment.`,
        idempotencyKey: `courier_update_${orderId}_delivered_buyer`
      })
    );
  }

  if (sellerEmail || order?.sellerId) {
    tasks.push(
      dispatchOrderStatusEmail({
        orderId,
        recipientEmail: sellerEmail,
        recipientUserId: order?.sellerId,
        recipientRole: "seller",
        recipientName: sellerName,
        buyerName,
        sellerName,
        logisticsName: courierName,
        productName,
        quantity,
        totalPrice,
        deliveryType: order?.deliveryType,
        status: "delivered",
        statusTitle: "Package Reached Buyer (Delivered)",
        statusMessage: `${courierName} has delivered "${productName}" (x${quantity}) to ${buyerName}. Escrow funds will be credited once the buyer confirms completion.`,
        idempotencyKey: `courier_update_${orderId}_delivered_seller`
      })
    );
  }

  if (logisticsId && logisticsId !== "outsourced" && (logisticsEmail || logisticsId)) {
    tasks.push(
      dispatchOrderStatusEmail({
        orderId,
        recipientEmail: logisticsEmail,
        recipientUserId: logisticsId,
        recipientRole: "logistics",
        recipientName: courierName,
        buyerName,
        sellerName,
        logisticsName: courierName,
        productName,
        quantity,
        totalPrice,
        deliveryType: order?.deliveryType,
        status: "delivered",
        statusTitle: `Delivery Completed at Buyer (${displayOrderId})`,
        statusMessage: `Handover for order ${displayOrderId} ("${productName}") to ${buyerName} has been recorded as delivered.`,
        idempotencyKey: `courier_update_${orderId}_delivered_logistics`
      })
    );
  }

  await Promise.all(tasks);
}

/**
 * Stage 4: Logistics delivery milestones (`picked_up`, `in_transit`, `delivered`) -> Email Buyer, Seller, and Logistics Company.
 */
export async function notifyLogisticsProgress(params: {
  orderId: string;
  order: any;
  nextStatus: "picked_up" | "in_transit" | "delivered";
  logisticsCompany: {
    id: string;
    companyName: string;
    email?: string | null;
    phoneNumber?: string;
  };
}): Promise<void> {
  const { orderId, order, nextStatus, logisticsCompany } = params;

  if (nextStatus === "delivered") {
    await notifyOrderReachedBuyer({
      orderId,
      order,
      logisticsName: logisticsCompany.companyName,
      logisticsCompanyId: logisticsCompany.id,
      logisticsEmail: logisticsCompany.email
    });
    return;
  }

  const displayOrderId = order?.uniqueOrderId || orderId;
  const buyerName = order?.buyerName || "Customer";
  const sellerName = order?.sellerName || "Campus Merchant";
  const productName = order?.productName || "Campus Order";
  const quantity = order?.quantity || 1;
  const totalPrice = Number(order?.totalPrice || 0);
  const deliveryPin = order?.deliveryOtp || order?.deliveryPin || "";

  const [buyerEmail, sellerEmail, logisticsEmail] = await Promise.all([
    resolveUserEmail(order?.buyerEmail, order?.buyerId),
    resolveUserEmail(order?.sellerEmail, order?.sellerId),
    resolveLogisticsEmail(logisticsCompany.email, logisticsCompany.id)
  ]);

  const isPickedUp = nextStatus === "picked_up";

  const buyerTitle = isPickedUp
    ? "Package Picked Up From Merchant and In Transit"
    : "Courier Out for Doorstep Delivery";
  const buyerMessage = isPickedUp
    ? `${logisticsCompany.companyName} has collected "${productName}" from ${sellerName} and is now in transit to your delivery address.`
    : `${logisticsCompany.companyName} is out for delivery with "${productName}". Have your 6-digit Delivery PIN ready once you inspect the package.`;

  const sellerTitle = isPickedUp
    ? "Product Handed Over to Logistics Courier"
    : "Courier Out for Doorstep Delivery to Buyer";
  const sellerMessage = isPickedUp
    ? `${logisticsCompany.companyName} confirmed pickup of "${productName}" (x${quantity}) from you and is en route to ${buyerName}.`
    : `${logisticsCompany.companyName} is on the final leg to deliver "${productName}" to ${buyerName}.`;

  const logisticsTitle = isPickedUp
    ? `Pickup Recorded for ${displayOrderId}`
    : `Out for Delivery (${displayOrderId})`;
  const logisticsMessage = isPickedUp
    ? `Seller handover confirmed for order ${displayOrderId} ("${productName}"). Proceed to the buyer's drop-off location.`
    : `Order ${displayOrderId} ("${productName}") is marked Out for Delivery to ${buyerName}. Request the Buyer Delivery PIN after inspection.`;

  const tasks: Promise<void>[] = [];

  if (buyerEmail || order?.buyerId) {
    tasks.push(
      dispatchOrderStatusEmail({
        orderId,
        recipientEmail: buyerEmail,
        recipientUserId: order?.buyerId,
        recipientRole: "buyer",
        recipientName: buyerName,
        buyerName,
        sellerName,
        logisticsName: logisticsCompany.companyName,
        productName,
        quantity,
        totalPrice,
        deliveryType: order?.deliveryType || "delivery",
        status: nextStatus,
        statusTitle: buyerTitle,
        statusMessage: buyerMessage,
        deliveryOtp: deliveryPin,
        pinLabel: "Buyer Delivery PIN (Provide After Inspection)",
        idempotencyKey: `courier_update_${orderId}_${nextStatus}_buyer`
      })
    );
  }

  if (sellerEmail || order?.sellerId) {
    tasks.push(
      dispatchOrderStatusEmail({
        orderId,
        recipientEmail: sellerEmail,
        recipientUserId: order?.sellerId,
        recipientRole: "seller",
        recipientName: sellerName,
        buyerName,
        sellerName,
        logisticsName: logisticsCompany.companyName,
        productName,
        quantity,
        totalPrice,
        deliveryType: order?.deliveryType || "delivery",
        status: nextStatus,
        statusTitle: sellerTitle,
        statusMessage: sellerMessage,
        idempotencyKey: `courier_update_${orderId}_${nextStatus}_seller`
      })
    );
  }

  if (logisticsEmail || logisticsCompany.id) {
    tasks.push(
      dispatchOrderStatusEmail({
        orderId,
        recipientEmail: logisticsEmail,
        recipientUserId: logisticsCompany.id,
        recipientRole: "logistics",
        recipientName: logisticsCompany.companyName,
        buyerName,
        sellerName,
        logisticsName: logisticsCompany.companyName,
        productName,
        quantity,
        totalPrice,
        deliveryType: order?.deliveryType || "delivery",
        status: nextStatus,
        statusTitle: logisticsTitle,
        statusMessage: logisticsMessage,
        idempotencyKey: `courier_update_${orderId}_${nextStatus}_logistics`
      })
    );
  }

  await Promise.all(tasks);
}

/**
 * Stage 5: Order Completed -> Email Buyer, Seller, and Logistics Company (when logistics was used).
 */
export async function notifyOrderCompleted(params: {
  orderId: string;
  order: any;
  buyerEmail?: string | null;
  sellerEmail?: string | null;
  logisticsEmail?: string | null;
}): Promise<void> {
  const { orderId, order } = params;
  const displayOrderId = order?.uniqueOrderId || orderId;
  const buyerName = order?.buyerName || "Customer";
  const sellerName = order?.sellerName || "Campus Merchant";
  const courierName = order?.logisticsName || "Campus Logistics";
  const logisticsId = order?.logisticsId;
  const productName = order?.productName || "Campus Order";
  const quantity = order?.quantity || 1;
  const totalPrice = Number(order?.totalPrice || 0);

  const [buyerEmail, sellerEmail, logisticsEmail] = await Promise.all([
    resolveUserEmail(params.buyerEmail || order?.buyerEmail, order?.buyerId),
    resolveUserEmail(params.sellerEmail || order?.sellerEmail, order?.sellerId),
    logisticsId && logisticsId !== "outsourced"
      ? resolveLogisticsEmail(params.logisticsEmail || order?.logisticsEmail, logisticsId)
      : Promise.resolve("")
  ]);

  const tasks: Promise<void>[] = [];

  if (buyerEmail || order?.buyerId) {
    tasks.push(
      dispatchOrderStatusEmail({
        orderId,
        recipientEmail: buyerEmail,
        recipientUserId: order?.buyerId,
        recipientRole: "buyer",
        recipientName: buyerName,
        buyerName,
        sellerName,
        logisticsName: order?.logisticsName,
        productName,
        quantity,
        totalPrice,
        deliveryType: order?.deliveryType,
        status: "completed",
        statusTitle: "Order Completed Successfully",
        statusMessage: `You have confirmed receipt for "${productName}" (x${quantity}) on order ${displayOrderId}. Escrow funds have been cleared for ${sellerName}. Your 72-hour post-delivery protection window remains active. Thank you for shopping on SHOPIVERSITY.`,
        idempotencyKey: `order_completed_${orderId}_buyer`
      })
    );
  }

  if (sellerEmail || order?.sellerId) {
    tasks.push(
      dispatchOrderStatusEmail({
        orderId,
        recipientEmail: sellerEmail,
        recipientUserId: order?.sellerId,
        recipientRole: "seller",
        recipientName: sellerName,
        buyerName,
        sellerName,
        logisticsName: order?.logisticsName,
        productName,
        quantity,
        totalPrice,
        deliveryType: order?.deliveryType,
        status: "completed",
        statusTitle: "Order Completed and Escrow Payout Unlocked",
        statusMessage: `${buyerName} confirmed completion of order ${displayOrderId} for "${productName}" (x${quantity}). Payment of NGN ${totalPrice.toLocaleString()} is now credited toward your Seller Dashboard earnings pool.`,
        idempotencyKey: `order_completed_${orderId}_seller`
      })
    );
  }

  if (logisticsId && logisticsId !== "outsourced" && (logisticsEmail || logisticsId)) {
    tasks.push(
      dispatchOrderStatusEmail({
        orderId,
        recipientEmail: logisticsEmail,
        recipientUserId: logisticsId,
        recipientRole: "logistics",
        recipientName: courierName,
        buyerName,
        sellerName,
        logisticsName: courierName,
        productName,
        quantity,
        totalPrice,
        deliveryType: order?.deliveryType,
        status: "completed",
        statusTitle: `Order Completed and Closed (${displayOrderId})`,
        statusMessage: `Buyer ${buyerName} has confirmed receipt and completed order ${displayOrderId} ("${productName}") delivered by ${courierName}. This assignment is now finalized.`,
        idempotencyKey: `order_completed_${orderId}_logistics`
      })
    );
  }

  await Promise.all(tasks);
}

export interface TriggerTemplatedEmailParams {
  templateId: string;
  recipientEmail?: string | null;
  recipientUserId?: string | null;
  recipientRole?: "buyer" | "seller" | "logistics";
  variables?: Record<string, string | number | undefined | null>;
  idempotencyKey?: string;
}

/**
 * Dispatch any of the 101 Shopiversity automated email templates via `/api/emails/send-template`.
 * Never throws or blocks user actions on failure.
 */
export async function triggerTemplatedEmail(params: TriggerTemplatedEmailParams): Promise<void> {
  const cleanEmail = normalizeEmail(params.recipientEmail);
  if (!cleanEmail && !params.recipientUserId) return;

  try {
    await fetch("/api/emails/send-template", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        templateId: params.templateId,
        recipientEmail: cleanEmail || undefined,
        recipientUserId: params.recipientUserId || undefined,
        recipientRole: params.recipientRole,
        variables: params.variables || {},
        idempotencyKey: params.idempotencyKey
      })
    });
  } catch (err) {
    console.warn(`[EMAIL ENGINE] Failed triggering ${params.templateId}:`, err);
  }
}

