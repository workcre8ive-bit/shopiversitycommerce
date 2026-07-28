/**
 * Utility to filter sensitive information from text.
 * Blocks:
 * - Phone numbers (private contact, etc.)
 * - Social media handles (@handle)
 * - Social media links (instagram.com, t.me, messaging domains, etc.)
 * - Email addresses
 */

const SENSITIVE_PATTERNS = [
  // Phone numbers (various formats)
  /(\+?\d{1,4}[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4,}/g, // Generic phone
  /\b\d{10,11}\b/g, // 10-11 digit numbers
  /\b0[789][01]\d{8}\b/g, // Nigerian mobile numbers

  // Social handles
  /@\w+/g,

  // Social media links / common platforms
  /\b(instagram\.com|facebook\.com|twitter\.com|x\.com|linkedin\.com|t\.me|wa\.me|github\.com|tiktok\.com)\b/gi,
  /\b(http|https):\/\/[^\s]+\b/gi, // Any URL

  // Email addresses
  /\b[\w\.-]+@[\w\.-]+\.\w{2,}\b/gi,

  // Specific keywords
  /\b(whatsapp|ig|insta|instagram|facebook|fb|twitter|linkedin|telegram|tg|email|mail|phone|number|call|dm|snapchat|snap)\b/gi
];

export function filterContent(text: string): string {
  let filteredText = text;
  
  SENSITIVE_PATTERNS.forEach(pattern => {
    filteredText = filteredText.replace(pattern, (match) => {
      // Replace with asterisks of the same length
      return "*".repeat(match.length);
    });
  });

  return filteredText;
}

export function hasSensitiveContent(text: string): boolean {
  return SENSITIVE_PATTERNS.some(pattern => pattern.test(text));
}
