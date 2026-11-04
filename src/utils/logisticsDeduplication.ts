import { doc, getDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

export interface LogisticsPartnerLike {
  id?: string;
  companyName?: string;
  email?: string;
  phoneNumber?: string;
  isVerified?: boolean;
  isActive?: boolean;
  isDuplicate?: boolean;
  isDeleted?: boolean;
  deleted?: boolean;
  status?: string;
  isSuspended?: boolean;
  userId?: string;
  coveredCampuses?: string[];
  baseDeliveryPrice?: number;
  [key: string]: any;
}

/**
 * Deduplicates logistics companies so that the exact same logistics service
 * is never displayed more than once in the seller's dashboard or product forms.
 *
 * It normalizes company names and emails, and when duplicate documents exist,
 * it preserves the one with the most complete and active profile (e.g. valid phone number, verified).
 */
export function deduplicateLogisticsCompanies<T extends LogisticsPartnerLike>(companies: T[]): T[] {
  if (!Array.isArray(companies) || companies.length === 0) {
    return [];
  }

  const map = new Map<string, T>();

  for (const company of companies) {
    // Exclude explicitly disabled, deleted, or marked duplicate documents
    if (
      company.isDuplicate === true ||
      company.isActive === false ||
      company.isDeleted === true ||
      company.deleted === true ||
      company.status === "deleted" ||
      company.isSuspended === true
    ) {
      continue;
    }

    const rawName = (company.companyName || "").trim();
    const rawEmail = (company.email || "").trim();
    const rawPhone = (company.phoneNumber || "").trim().replace(/[^0-9]/g, "");

    // Normalization keys
    const normalizedName = rawName.toLowerCase().replace(/[^a-z0-9]/g, "");
    const normalizedEmail = rawEmail.toLowerCase();

    // Grouping key: prioritize company name so that same business under different accounts doesn't duplicate
    const dedupeKey = normalizedName || normalizedEmail || rawPhone || company.id || Math.random().toString();

    if (!map.has(dedupeKey)) {
      map.set(dedupeKey, company);
    } else {
      const existing = map.get(dedupeKey)!;
      // Calculate completeness score to choose the best record
      const existingScore =
        (existing.phoneNumber && existing.phoneNumber.trim().length > 0 ? 3 : 0) +
        (existing.isVerified ? 2 : 0) +
        (Array.isArray(existing.coveredCampuses) && existing.coveredCampuses.length > 0 ? 2 : 0) +
        (Number(existing.baseDeliveryPrice) > 0 ? 1 : 0);

      const currentScore =
        (company.phoneNumber && company.phoneNumber.trim().length > 0 ? 3 : 0) +
        (company.isVerified ? 2 : 0) +
        (Array.isArray(company.coveredCampuses) && company.coveredCampuses.length > 0 ? 2 : 0) +
        (Number(company.baseDeliveryPrice) > 0 ? 1 : 0);

      if (currentScore > existingScore) {
        map.set(dedupeKey, company);
      }
    }
  }

  return Array.from(map.values());
}

/**
 * Checks whether a logistics partner has completed all required profile information
 * before they can receive gigs from merchants or accept jobs.
 */
export function isLogisticsCompanyProfileComplete(company: LogisticsPartnerLike | null | undefined): boolean {
  if (!company) return false;
  
  const name = String(company.companyName || "").trim();
  const phone = String(company.phoneNumber || "").replace(/[^0-9]/g, "");
  const rc = String(company.rcNumber || "").trim();
  const office = String(company.officeAddress || "").trim();
  const vehicles = Array.isArray(company.vehicleTypes) ? company.vehicleTypes : [];
  const campuses = Array.isArray(company.coveredCampuses) ? company.coveredCampuses : [];
  const basePrice = Number(company.baseDeliveryPrice) || 0;
  
  // Bank details check (either top-level bankName/accountNumber or bankDetails map)
  const bankName = String(company.bankName || company.bankDetails?.bankName || "").trim();
  const accountNumber = String(company.accountNumber || company.bankDetails?.accountNumber || "").replace(/[^0-9]/g, "");

  const hasName = name.length >= 2;
  const hasPhone = phone.length >= 7;
  // A realistic RC number is not a placeholder
  const hasRc = rc.length >= 3 && !rc.toUpperCase().startsWith("RC-00") && rc.toUpperCase() !== "RC-PENDING";
  const hasOffice = office.length >= 3 && office !== "Main Campus Office";
  const hasVehicles = vehicles.length > 0;
  const hasCampuses = campuses.length > 0;
  const hasBasePrice = basePrice > 0;
  const hasBank = bankName.length >= 2 && accountNumber.length >= 7;

  return hasName && hasPhone && hasRc && hasOffice && hasVehicles && hasCampuses && hasBasePrice && hasBank;
}

/**
 * Helper to get the list of missing profile requirements for a logistics company
 */
export function getLogisticsCompanyProfileChecklist(company: LogisticsPartnerLike | null | undefined) {
  if (!company) {
    return [
      { id: "name", label: "Business Name", complete: false },
      { id: "phone", label: "Contact Phone Number", complete: false },
      { id: "rc", label: "CAC / RC Registration Number", complete: false },
      { id: "office", label: "Physical Dispatch Office Address", complete: false },
      { id: "vehicles", label: "Fleet / Vehicle Types Configured", complete: false },
      { id: "campuses", label: "Covered Campus Zones Selected", complete: false },
      { id: "pricing", label: "Base Delivery Pricing Set", complete: false },
      { id: "bank", label: "Settlement Bank Account Details", complete: false },
    ];
  }

  const name = String(company.companyName || "").trim();
  const phone = String(company.phoneNumber || "").replace(/[^0-9]/g, "");
  const rc = String(company.rcNumber || "").trim();
  const office = String(company.officeAddress || "").trim();
  const vehicles = Array.isArray(company.vehicleTypes) ? company.vehicleTypes : [];
  const campuses = Array.isArray(company.coveredCampuses) ? company.coveredCampuses : [];
  const basePrice = Number(company.baseDeliveryPrice) || 0;
  const bankName = String(company.bankName || company.bankDetails?.bankName || "").trim();
  const accountNumber = String(company.accountNumber || company.bankDetails?.accountNumber || "").replace(/[^0-9]/g, "");

  return [
    { id: "name", label: "Business Name", complete: name.length >= 2 },
    { id: "phone", label: "Contact Phone Number", complete: phone.length >= 7 },
    { id: "rc", label: "CAC / RC Registration Number", complete: rc.length >= 3 && !rc.toUpperCase().startsWith("RC-00") && rc.toUpperCase() !== "RC-PENDING" },
    { id: "office", label: "Physical Dispatch Office Address", complete: office.length >= 3 && office !== "Main Campus Office" },
    { id: "vehicles", label: "Fleet / Vehicle Types Configured", complete: vehicles.length > 0 },
    { id: "campuses", label: "Covered Campus Zones Selected", complete: campuses.length > 0 },
    { id: "pricing", label: "Base Delivery Pricing Set", complete: basePrice > 0 },
    { id: "bank", label: "Settlement Bank Account Details", complete: bankName.length >= 2 && accountNumber.length >= 7 },
  ];
}

/**
 * Validates and purges deleted or orphaned logistics company records before
 * presenting them in delivery options across the platform.
 * If the registered company user account was deleted from Firestore `users`,
 * it automatically removes the orphan and excludes it from the options list.
 */
export async function filterActiveLogisticsCompanies<T extends LogisticsPartnerLike>(
  companies: T[]
): Promise<T[]> {
  if (!Array.isArray(companies) || companies.length === 0) {
    return [];
  }

  const validCompanies: T[] = [];

  for (const company of companies) {
    // 1. Exclude explicitly disabled or marked deleted/suspended documents
    if (
      company.isDuplicate === true ||
      company.isActive === false ||
      company.isDeleted === true ||
      company.deleted === true ||
      company.status === "deleted" ||
      company.isSuspended === true
    ) {
      continue;
    }

    const name = String(company.companyName || "").toLowerCase().trim();

    // 2. Check if the underlying user account still exists in `users`
    const ownerUid = company.userId || company.id;
    if (ownerUid) {
      try {
        const userSnap = await getDoc(doc(db, "users", ownerUid));
        if (!userSnap.exists()) {
          const targetId = company.id || ownerUid;
          deleteDoc(doc(db, "logistics_companies", targetId)).catch(() => {});
          updateDoc(doc(db, "logistics_companies", targetId), {
            isDeleted: true,
            isActive: false,
            status: "deleted"
          }).catch(() => {});
          continue;
        }

        const userData = userSnap.data();
        if (userData?.isDeleted || userData?.isSuspended) {
          continue;
        }
      } catch (err) {
        if (name.includes("workcreative")) {
          continue;
        }
      }
    }

    // 3. Exclude logistics companies that have not completed their profile
    if (!isLogisticsCompanyProfileComplete(company)) {
      continue;
    }

    validCompanies.push(company);
  }

  return deduplicateLogisticsCompanies(validCompanies);
}
