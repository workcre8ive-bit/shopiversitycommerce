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
  badgeText: "Verification Pending" | "Fairly Verified" | "Verification Complete";
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
 * the three-tier verification badge for buyers:
 * - < 40%: "Verification Pending"
 * - 40% to 99%: "Fairly Verified"
 * - 100%: "Verification Complete" (Strict 100% profile requirement with verification badge)
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
      badgeText: "Verification Pending",
      badgeTheme: {
        bg: "bg-amber-50 dark:bg-amber-950/30",
        text: "text-amber-700 dark:text-amber-400",
        border: "border-amber-200 dark:border-amber-800",
        iconColor: "text-amber-600 dark:text-amber-400",
        dotColor: "bg-amber-500",
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

  // Section 3: Campus / Location
  const hasLocation = Boolean(
    (user.schoolName && user.schoolName.trim().length > 0) ||
    (user.campus && user.campus.trim().length > 0) ||
    (user.school && user.school.trim().length > 0) ||
    (user.state && user.state.trim().length > 0) ||
    (user.city && user.city.trim().length > 0) ||
    (user.location && user.location.trim().length > 0)
  );

  // Section 4: Bank Details Saved
  const hasBankDetails = Boolean(
    user.bankDetails?.accountNumber &&
    user.bankDetails.accountNumber.trim().length === 10 &&
    user.bankDetails?.bankName &&
    user.bankDetails.bankName.trim().length > 0
  );

  // Section 5: ID / Identity Verification
  const hasIdentityVerification = Boolean(
    user.isVerified ||
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
  let percentage = completedCount * 20;

  if (user.isVerified && user.profileCompleted) {
    percentage = 100;
  }

  const isFullyComplete = percentage >= 100;

  let tier: "pending" | "fairly" | "complete" = "pending";
  let badgeText: "Verification Pending" | "Fairly Verified" | "Verification Complete" = "Verification Pending";
  let badgeTheme = {
    bg: "bg-amber-50 dark:bg-amber-950/30",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800",
    iconColor: "text-amber-600 dark:text-amber-400",
    dotColor: "bg-amber-500",
  };

  // Vendor is verified ONLY if profile is 100 percent complete
  if (percentage >= 100) {
    tier = "complete";
    badgeText = "Verification Complete";
    badgeTheme = {
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
      text: "text-emerald-700 dark:text-emerald-400",
      border: "border-emerald-200 dark:border-emerald-800",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      dotColor: "bg-emerald-500",
    };
  } else if (percentage >= 40) {
    tier = "fairly";
    badgeText = "Fairly Verified";
    badgeTheme = {
      bg: "bg-blue-50 dark:bg-blue-950/30",
      text: "text-blue-700 dark:text-blue-400",
      border: "border-blue-200 dark:border-blue-800",
      iconColor: "text-blue-600 dark:text-blue-400",
      dotColor: "bg-blue-500",
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
