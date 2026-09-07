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
 * Returns the guaranteed 6-digit PIN for an order.
 * If order has a stored deliveryOtp/pickupOtp/handoverCode, it uses that.
 * Otherwise, it deterministically computes a 6-digit numeric PIN from the order ID,
 * ensuring buyer and courier ALWAYS see the exact same 6-digit code.
 */
export function getOrderDeliveryPin(order?: {
  id?: string;
  deliveryOtp?: string;
  pickupOtp?: string;
  handoverCode?: string;
  deliveryPin?: string;
}): string {
  if (!order) return "123456";

  const dOtp = order.deliveryOtp ? String(order.deliveryOtp).trim() : "";
  if (dOtp && dOtp.length >= 4) return dOtp;

  const pOtp = order.pickupOtp ? String(order.pickupOtp).trim() : "";
  if (pOtp && pOtp.length >= 4) return pOtp;

  const hCode = order.handoverCode ? String(order.handoverCode).trim() : "";
  if (hCode && hCode.length >= 4) return hCode;

  const dPin = order.deliveryPin ? String(order.deliveryPin).trim() : "";
  if (dPin && dPin.length >= 4) return dPin;

  // Deterministic 6-digit numeric PIN based on order.id
  let hash = 0;
  const idStr = String(order.id || "100000");
  for (let i = 0; i < idStr.length; i++) {
    hash = ((hash << 5) - hash) + idStr.charCodeAt(i);
    hash |= 0;
  }
  const positive = Math.abs(hash);
  const sixDigit = String(100000 + (positive % 900000));
  return sixDigit;
}
