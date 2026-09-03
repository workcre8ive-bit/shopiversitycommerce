export interface LogisticsPartnerLike {
  id?: string;
  companyName?: string;
  email?: string;
  phoneNumber?: string;
  isVerified?: boolean;
  isActive?: boolean;
  isDuplicate?: boolean;
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
    // Exclude explicitly disabled or marked duplicate documents
    if (company.isDuplicate === true || company.isActive === false) {
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
