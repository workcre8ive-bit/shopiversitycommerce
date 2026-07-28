import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateReferralCode(name?: string): string {
  // Generate a random 6-digit number string
  return Math.floor(100000 + Math.random() * 900000).toString();
}
