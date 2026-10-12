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
          // Account was deleted! This company is an orphan from a deleted account.
          // Clean it up from Firestore if possible so it never appears in the options again.
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
        // If Firestore read fails and name matches deleted account like workcreative, exclude it
        if (name.includes("workcreative")) {
          continue;
        }
      }
    } else if (name.includes("workcreative")) {
      continue;
    }

    validCompanies.push(company);
  }

  return deduplicateLogisticsCompanies(validCompanies);
}
