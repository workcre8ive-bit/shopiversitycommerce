import { PublicContactInfo, UserProfile } from "../types";

export function normalizeUrl(raw: string, baseUrl: string, stripAt = true): string {
  const val = raw.trim();
  if (!val) return "";
  if (/^https?:\/\//i.test(val)) return val;
  if (val.includes(".") && !val.startsWith("@")) {
    return `https://${val.replace(/^\/+/, "")}`;
  }
  const handle = stripAt ? val.replace(/^@+/, "") : val;
  return `${baseUrl}${encodeURIComponent(handle)}`;
}

export function normalizeWhatsAppUrl(raw: string): string {
  const val = raw.trim();
  if (!val) return "";
  if (/^https?:\/\//i.test(val)) return val;
  if (/^wa\.me\//i.test(val)) return `https://${val}`;
  let digits = val.replace(/\D/g, "");
  if (digits.startsWith("0") && digits.length === 11) {
    digits = `234${digits.slice(1)}`;
  }
  return `https://wa.me/${digits || encodeURIComponent(val)}`;
}

export function normalizeTikTokUrl(raw: string): string {
  const val = raw.trim();
  if (!val) return "";
  if (/^https?:\/\//i.test(val)) return val;
  if (val.includes("tiktok.com")) return `https://${val.replace(/^\/+/, "")}`;
  const handle = val.replace(/^@+/, "");
  return `https://www.tiktok.com/@${encodeURIComponent(handle)}`;
}

export function cleanPublicContact(contact?: PublicContactInfo | null): PublicContactInfo | undefined {
  if (!contact) return undefined;
  const cleaned: PublicContactInfo = {};
  const keys: (keyof PublicContactInfo)[] = [
    "phone",
    "whatsapp",
    "email",
    "instagram",
    "twitter",
    "tiktok",
    "facebook",
    "website",
    "other",
  ];
  for (const key of keys) {
    const val = typeof contact[key] === "string" ? contact[key]!.trim() : "";
    if (val) cleaned[key] = val;
  }
  return Object.keys(cleaned).length > 0 ? cleaned : undefined;
}

export function mergeSellerPublicContact(
  productContact?: PublicContactInfo | null,
  seller?: UserProfile | null
): PublicContactInfo {
  const sf = seller?.storefrontSettings?.publicContact;
  const up = seller?.publicContact;
  const phone =
    productContact?.phone?.trim() ||
    sf?.phone?.trim() ||
    up?.phone?.trim() ||
    seller?.businessPhoneNumber?.trim() ||
    "";
  return {
    phone: phone || undefined,
    whatsapp: (productContact?.whatsapp || sf?.whatsapp || up?.whatsapp || "").trim() || undefined,
    email: (productContact?.email || sf?.email || up?.email || "").trim() || undefined,
    instagram: (productContact?.instagram || sf?.instagram || up?.instagram || "").trim() || undefined,
    twitter: (productContact?.twitter || sf?.twitter || up?.twitter || "").trim() || undefined,
    tiktok: (productContact?.tiktok || sf?.tiktok || up?.tiktok || "").trim() || undefined,
    facebook: (productContact?.facebook || sf?.facebook || up?.facebook || "").trim() || undefined,
    website: (productContact?.website || sf?.website || up?.website || "").trim() || undefined,
    other: (productContact?.other || sf?.other || up?.other || "").trim() || undefined,
  };
}

export function hasAnyPublicContact(contact?: PublicContactInfo | null): boolean {
  if (!contact) return false;
  return Boolean(
    contact.phone?.trim() ||
      contact.whatsapp?.trim() ||
      contact.email?.trim() ||
      contact.instagram?.trim() ||
      contact.twitter?.trim() ||
      contact.tiktok?.trim() ||
      contact.facebook?.trim() ||
      contact.website?.trim() ||
      contact.other?.trim()
  );
}
