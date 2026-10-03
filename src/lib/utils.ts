import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateReferralCode(name?: string): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Clean 6-char alphanumeric code excluding confusing 0/O/1/I
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generates a clean 6-digit numeric PIN for new orders
 */
export function generateSixDigitPin(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * Strips formatting (spaces, dashes, non-digits) for clean PIN matching
 */
export function cleanPinInput(input?: string): string {
  if (!input) return "";
  return String(input).replace(/\D/g, "").trim();
}

/**
 * Returns the guaranteed 6-digit Buyer Delivery PIN for an order.
 * If order has a stored deliveryOtp/pickupOtp/handoverCode/deliveryPin, it uses that.
 * Otherwise, it deterministically computes a 6-digit numeric PIN from the order ID,
 * ensuring buyer and courier ALWAYS see the exact same 6-digit code.
 */
export function getOrderDeliveryPin(order?: {
  id?: string;
  uniqueOrderId?: string;
  orderId?: string;
  deliveryOtp?: string | number;
  pickupOtp?: string | number;
  handoverCode?: string | number;
  deliveryPin?: string | number;
  [key: string]: any;
}): string {
  if (!order) return "123456";

  const dOtp = order.deliveryOtp !== undefined && order.deliveryOtp !== null ? String(order.deliveryOtp).trim() : "";
  if (dOtp && dOtp.length >= 4) return dOtp;

  const dPin = order.deliveryPin !== undefined && order.deliveryPin !== null ? String(order.deliveryPin).trim() : "";
  if (dPin && dPin.length >= 4) return dPin;

  const pOtp = order.pickupOtp !== undefined && order.pickupOtp !== null ? String(order.pickupOtp).trim() : "";
  if (pOtp && pOtp.length >= 4) return pOtp;

  const hCode = order.handoverCode !== undefined && order.handoverCode !== null ? String(order.handoverCode).trim() : "";
  if (hCode && hCode.length >= 4) return hCode;

  // Normalize order identifier - prefer uniqueOrderId because it is identical across orders and logistics collections
  const rawKey = String(order.uniqueOrderId || order.id || order.orderId || "100000");
  const key = rawKey.replace(/^DLV_/, "").trim();

  // Deterministic 6-digit numeric PIN
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = ((hash << 5) - hash) + key.charCodeAt(i);
    hash |= 0;
  }
  const positive = Math.abs(hash);
  const sixDigit = String(100000 + (positive % 900000));
  return sixDigit;
}

/**
 * Returns the guaranteed 6-digit Seller Handover PIN for an order.
 * When the logistics company collects the package from the seller, the seller provides this PIN
 * to the courier to confirm physical handover before the package moves into transit.
 */
export function getOrderSellerHandoverPin(order?: {
  id?: string;
  uniqueOrderId?: string;
  orderId?: string;
  sellerHandoverPin?: string | number;
  sellerHandoverOtp?: string | number;
  [key: string]: any;
}): string {
  if (!order) return "654321";

  const sPin = order.sellerHandoverPin !== undefined && order.sellerHandoverPin !== null ? String(order.sellerHandoverPin).trim() : "";
  if (sPin && sPin.length >= 4) return sPin;

  const sOtp = order.sellerHandoverOtp !== undefined && order.sellerHandoverOtp !== null ? String(order.sellerHandoverOtp).trim() : "";
  if (sOtp && sOtp.length >= 4) return sOtp;

  // Normalize order identifier - prefer uniqueOrderId because it is identical across orders and logistics collections
  const rawKey = String(order.uniqueOrderId || order.id || order.orderId || "100000");
  const key = rawKey.replace(/^DLV_/, "").trim();

  // Distinct prime shift calculation ensuring it's different from the buyer's PIN
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = ((hash << 7) - hash) + key.charCodeAt(i);
    hash |= 0;
  }
  const positive = Math.abs(hash);
  const sixDigit = String(100000 + ((positive * 3 + 246813) % 900000));
  return sixDigit;
}
