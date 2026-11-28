import { UserProfile } from "../types";

export interface VendorProfileSection {
  id: string;
  label: string;
  isComplete: boolean;
  weight: number;
}

export interface VendorVerificationProgress {
  percentage: number;
  isFullyComplete: boolean;
  sections: VendorProfileSection[];
  completedCount: number;
  totalSections: number;
  tier: "pending" | "fairly" | "complete";
  badgeText: "Unverified" | "Verified";
  badgeTheme: {
    bg: string;
    text: string;
    border: string;
    iconColor: string;
    dotColor: string;
  };
}

/**
 * Calculates a vendor's profile completion percentage and determines
 * whether the account holds a Verified or Unverified badge:
 * - < 100%: "Unverified" (until all profile details are finished)
 * - 100%: "Verified" (strict 100% profile completion)
 */
export function calculateVendorProfileProgress(user: UserProfile | null | undefined): VendorVerificationProgress {
  if (!user) {
    return {
      percentage: 0,
      isFullyComplete: false,
      sections: [],
      completedCount: 0,
      totalSections: 5,
      tier: "pending",
      badgeText: "Unverified",
      badgeTheme: {
        bg: "bg-red-50 dark:bg-red-950/30",
        text: "text-red-700 dark:text-red-400",
        border: "border-red-200 dark:border-red-800",
        iconColor: "text-red-600 dark:text-red-400",
        dotColor: "bg-red-500",
      }
    };
  }

  // Section 1: Basic info (Business Name or Display Name)
  const hasBasicInfo = Boolean(
    (user.businessName && user.businessName.trim().length > 0) ||
    (user.displayName && user.displayName.trim().length > 0) ||
    (user.storefrontSettings?.businessName && user.storefrontSettings.businessName.trim().length > 0)
  );

  // Section 2: Contact Phone Number
  const hasPhone = Boolean(
    (user.businessPhoneNumber && user.businessPhoneNumber.trim().length >= 8) ||
    (user.phoneNumber && user.phoneNumber.trim().length >= 8) ||
    (user.phone && user.phone.trim().length >= 8)
  );

  // Section 3: Campus / Location (requires both campus/school and state/city/location)
  const hasSchool = Boolean(
    (user.schoolName && user.schoolName.trim().length > 0) ||
    (user.campus && user.campus.trim().length > 0) ||
    (user.school && user.school.trim().length > 0)
  );
  const hasRegion = Boolean(
    (user.state && user.state.trim().length > 0) &&
    (user.city && user.city.trim().length > 0)
  );
  const hasLocation = hasSchool && (hasRegion || Boolean(user.location && user.location.trim().length > 0 && (user.state || user.city)));

  // Section 4: Bank Details Saved
  const hasBankDetails = Boolean(
    user.bankDetails?.accountNumber &&
    user.bankDetails.accountNumber.trim().length === 10 &&
    user.bankDetails?.bankName &&
    user.bankDetails.bankName.trim().length > 0
  );

  // Section 5: ID / Identity Verification (must have uploaded ID, ID number, or Face ID — NOT just email OTP)
  const hasIdentityVerification = Boolean(
    (user.verificationIdUrl && user.verificationIdUrl.trim().length > 0) ||
    (user.idNumber && user.idNumber.trim().length > 0) ||
    (user.faceVerificationUrl && user.faceVerificationUrl.trim().length > 0)
  );

  const sections: VendorProfileSection[] = [
    { id: "basic", label: "Business Name & Info", isComplete: hasBasicInfo, weight: 20 },
    { id: "phone", label: "Business Contact Phone", isComplete: hasPhone, weight: 20 },
    { id: "location", label: "Campus & Location Info", isComplete: hasLocation, weight: 20 },
    { id: "bank", label: "Payout Bank Details", isComplete: hasBankDetails, weight: 20 },
    { id: "identity", label: "Identity Verification", isComplete: hasIdentityVerification, weight: 20 },
  ];

  const completedCount = sections.filter(s => s.isComplete).length;
  const percentage = completedCount * 20;
  const isFullyComplete = percentage >= 100;

  let tier: "pending" | "fairly" | "complete" = "pending";
  let badgeText: "Unverified" | "Verified" = "Unverified";
  let badgeTheme = {
    bg: "bg-red-50 dark:bg-red-950/30",
    text: "text-red-700 dark:text-red-400",
    border: "border-red-200 dark:border-red-800",
    iconColor: "text-red-600 dark:text-red-400",
    dotColor: "bg-red-500",
  };

  // Vendor is Verified ONLY if 100% of profile details are finished
  if (isFullyComplete) {
    tier = "complete";
    badgeText = "Verified";
    badgeTheme = {
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
      text: "text-emerald-700 dark:text-emerald-400",
      border: "border-emerald-200 dark:border-emerald-800",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      dotColor: "bg-emerald-500",
    };
  } else if (percentage >= 40) {
    tier = "fairly";
    badgeText = "Unverified";
    badgeTheme = {
      bg: "bg-amber-50 dark:bg-amber-950/30",
      text: "text-amber-700 dark:text-amber-400",
      border: "border-amber-200 dark:border-amber-800",
      iconColor: "text-amber-600 dark:text-amber-400",
      dotColor: "bg-amber-500",
    };
  }

  return {
    percentage,
    isFullyComplete,
    sections,
    completedCount,
    totalSections: sections.length,
    tier,
    badgeText,
    badgeTheme,
  };
}

/**
 * Checks whether any account (seller or buyer) has completed its required profile details
 * so it can legitimately display a "Verified" tag instead of "Unverified".
 */
export function isUserAccountProfileVerified(user: UserProfile | null | undefined, roleOverride?: string): boolean {
  if (!user) return false;
  const effectiveRole = roleOverride || user.activeRole || user.role;
  if (effectiveRole === "seller") {
    return calculateVendorProfileProgress(user).isFullyComplete;
  }
  return Boolean(
    user.displayName && user.displayName.trim().length > 0 &&
    user.username && user.username.trim().length > 0 &&
    ((user.schoolName && user.schoolName.trim().length > 0) || (user.campus && user.campus.trim().length > 0)) &&
    user.state && user.state.trim().length > 0 &&
    user.city && user.city.trim().length > 0 &&
    user.deliveryAddress && user.deliveryAddress.trim().length > 0
  );
}
