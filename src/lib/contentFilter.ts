/**
 * Contact Information Protection System
 * Normalizes text, detects phone numbers, emails, social handles,
 * external platforms, URLs, QR codes, and off-platform prompts.
 */

export const CONTACT_WARNING_MESSAGE = "For your safety, sharing contact information outside this platform is not allowed.";

export interface DetectionResult {
  isBlocked: boolean;
  reason?: string;
  detectedTypes: string[];
  normalizedText?: string;
}

// Number word mapping
const NUMBER_WORDS: Record<string, string> = {
  zero: "0", oh: "0", o: "0",
  one: "1",
  two: "2", to: "2", too: "2",
  three: "3", tree: "3",
  four: "4", for: "4",
  five: "5",
  six: "6",
  seven: "7",
  eight: "8",
  nine: "9",
  ten: "10"
};

// Leetspeak character map
const LEET_MAP: Record<string, string> = {
  "@": "a",
  "0": "o",
  "1": "i",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
  "8": "b",
  "$": "s",
  "!": "i",
  "+": "t",
  "|": "l"
};

// Updatable Blacklist of external platforms & common variations
export const PLATFORM_BLACKLIST = [
  "whatsapp", "watsapp", "watsap", "wasap", "whatapp", "whtsapp", "w/a", "w.a", "wa.me", "wame", "chat.whatsapp",
  "telegram", "tele gram", "t.me", "tme", "tg",
  "instagram", "insta", "ig", "instagr", "instgr",
  "facebook", "fb", "messenger", "fb messenger",
  "snapchat", "snap",
  "discord", "signal", "wechat", "line",
  "twitter", "x.com", "linkedin",
  "gmail", "yahoo", "outlook", "hotmail", "icloud", "protonmail", "ymail",
  "tiktok", "skype", "zoom", "google meet", "gmeet", "teams"
];

// Bank keywords & Nigerian NUBAN bank providers
export const BANK_KEYWORDS = [
  "account", "acct", "acc", "a/c", "nuban", "bank", "sortcode", "routing number",
  "gtb", "gtbank", "guaranty trust", "kuda", "opay", "palmpay", "moniepoint",
  "zenith", "access", "firstbank", "first bank", "uba", "fcmb", "stanbic", "sterling",
  "wema", "alat", "providus", "fidelity", "union bank", "ecobank", "jaiz", "taj",
  "lotus", "rubies", "vfd", "keystone", "heritage", "polaris", "unity", "carbon",
  "fairmoney", "sparkle", "pay into", "transfer to", "send to my acc", "account no",
  "acct no", "account number", "account details", "account num"
];

// Off-platform encouragement phrases
const OFF_PLATFORM_PROMPTS = [
  /\bcall\s*(?:me|us)?\b/i,
  /\btext\s*(?:me|us)?\b/i,
  /\breach\s*(?:me|us)?\s*(?:at|on|via|outside)?\b/i,
  /\bcontact\s*(?:me|us)?\s*(?:at|on|via|outside)?\b/i,
  /\bchat\s*(?:me|us)?\s*(?:at|on|via|outside)?\b/i,
  /\bdm\s*(?:me|us)?\b/i,
  /\bhmu\b/i,
  /\bbuzz\s*(?:me|us)?\b/i,
  /\bmessage\s*(?:me|us)?\s*(?:on|via|at)\b/i,
  /\badd\s*(?:me|us)?\s*(?:on|at)\b/i,
  /\btalk\s*(?:on|via|at)\b/i,
  /\bpay\s*(?:outside|offsite|directly)\b/i,
  /\btransact\s*(?:outside|offsite)\b/i,
  /\bdeal\s*(?:outside|offsite)\b/i,
  /\boutside\s+(?:the\s+)?app\b/i,
  /\boff\s+(?:the\s+)?platform\b/i,
  /\boutside\s+shopiversity\b/i
];

/**
 * Normalizes input text by converting to lowercase, replacing leetspeak,
 * translating number words to digits, and creating a stripped character version.
 */
export function normalizeForScanning(text: string): { normalized: string; stripped: string; digitsOnly: string } {
  let normalized = text.toLowerCase();

  // Replace obfuscated email tokens
  normalized = normalized.replace(/\[\s*at\s*\]|\(\s*at\s*\)|\{\s*at\s*\}|\s+at\s+/g, "@");
  normalized = normalized.replace(/\[\s*dot\s*\]|\(\s*dot\s*\)|\{\s*dot\s*\}|\s+dot\s+/g, ".");

  // Convert number words to digits where appropriate
  const wordTokens = normalized.split(/(\s+|[.,\-_/\()*#]+)/);
  const convertedTokens = wordTokens.map(token => {
    const clean = token.toLowerCase().trim();
    if (NUMBER_WORDS[clean]) {
      return NUMBER_WORDS[clean];
    }
    return token;
  });
  normalized = convertedTokens.join("");

  // Create leetspeak translated version
  let leetTranslated = "";
  for (const ch of normalized) {
    leetTranslated += LEET_MAP[ch] || ch;
  }

  // Stripped version (remove non-alphanumeric except @ and .)
  const stripped = leetTranslated.replace(/[^a-z0-9@.]/gi, "");

  // Digits only sequence
  const digitsOnly = normalized.replace(/\D/g, "");

  return { normalized, stripped, digitsOnly };
}

/**
 * Core detection function for contact information sharing attempts.
 */
export function detectContactSharing(rawText: string): DetectionResult {
  if (!rawText || !rawText.trim()) {
    return { isBlocked: false, detectedTypes: [] };
  }

  const detectedTypes: string[] = [];
  const reasons: string[] = [];
  const { normalized, stripped, digitsOnly } = normalizeForScanning(rawText);

  // 1. Phone number detection
  const phoneRegex = /(?:\+?\d{1,4}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4,}/g;
  const nigerianPhoneRegex = /\b0[789][01]\d{8}\b/g;

  if (phoneRegex.test(rawText) || nigerianPhoneRegex.test(rawText) || phoneRegex.test(normalized)) {
    detectedTypes.push("phone_number");
    reasons.push("Phone number pattern detected.");
  }

  // Check spaced-out numbers (e.g., "0 8 0 1 2 3 4 5 6 7 8" or "zero 8 0 three...")
  if (digitsOnly.length >= 7 && digitsOnly.length <= 15) {
    const digitGroups = rawText.match(/\b\d{1,4}\b/g) || normalized.match(/\b\d{1,4}\b/g);
    if (digitGroups && digitGroups.length >= 3 && digitGroups.join("").length >= 7) {
      if (!detectedTypes.includes("phone_number")) {
        detectedTypes.push("phone_number");
        reasons.push("Disguised phone number sequence detected.");
      }
    }
  }

  // 2. Bank Account & NUBAN detection
  // Standalone 10-digit number (common NUBAN bank account length in Nigeria) or combined bank keywords
  const nubanAccountRegex = /\b\d{10}\b/g;
  const bankKeywordPresent = BANK_KEYWORDS.some(bank => normalized.includes(bank));
  
  if (nubanAccountRegex.test(rawText) || nubanAccountRegex.test(normalized)) {
    detectedTypes.push("bank_account");
    reasons.push("Bank account number (10-digit NUBAN) detected.");
  } else if (bankKeywordPresent && /\d{6,12}/.test(digitsOnly)) {
    detectedTypes.push("bank_account");
    reasons.push("Bank account details detected with banking keywords.");
  }

  // 3. Email detection
  const standardEmailRegex = /[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}/i;
  const obfuscatedEmailRegex = /[\w.-]+(?:\s*@\s*|\s*\[at\]\s*|\s*\(at\)\s*|\s+at\s+)[\w.-]+(?:\s*\.\s*|\s*\[dot\]\s*|\s*\(dot\)\s*|\s+dot\s+)[a-zA-Z]{2,}/i;

  if (standardEmailRegex.test(rawText) || obfuscatedEmailRegex.test(rawText) || standardEmailRegex.test(stripped)) {
    detectedTypes.push("email");
    reasons.push("Email address detected.");
  }

  // 4. Platform mentions & disguised platform names
  for (const platform of PLATFORM_BLACKLIST) {
    const platformClean = platform.replace(/[^a-z0-9]/g, "");
    if (
      normalized.includes(platform) ||
      (platformClean.length >= 3 && stripped.includes(platformClean))
    ) {
      if (!detectedTypes.includes("external_platform")) {
        detectedTypes.push("external_platform");
        reasons.push(`External platform mention detected (${platform}).`);
      }
      break;
    }
  }

  // 5. Social handles & usernames (@handle or "my ig is ...")
  const socialHandleRegex = /@[\w._-]{3,}/i;
  const handleMentionRegex = /(?:my|our)\s+(?:ig|insta|instagram|whatsapp|tg|telegram|snap|twitter|fb|facebook|handle|user)\s*(?:is|:|=|@)?\s*[\w._-]{3,}/i;

  if (socialHandleRegex.test(rawText) || handleMentionRegex.test(normalized)) {
    detectedTypes.push("social_handle");
    reasons.push("Social media handle or username reference detected.");
  }

  // 6. URLs, Web links & QR codes
  const urlRegex = /(?:https?:\/\/|www\.)[^\s]+/i;
  const domainRegex = /\b[a-zA-Z0-9.-]+\.(?:com|ng|org|net|io|co|me|site|app|xyz|link|info|online)\b/i;
  const inviteLinkRegex = /(?:wa\.me|t\.me|chat\.whatsapp\.com|discord\.gg|instagram\.com|facebook\.com)\/[^\s]+/i;
  const qrRegex = /\b(?:qr\s*code|scan\s*(?:my\s*)?qr|qr\s*image|scan\s*code)\b/i;

  if (
    urlRegex.test(rawText) ||
    domainRegex.test(rawText) ||
    inviteLinkRegex.test(rawText) ||
    qrRegex.test(normalized) ||
    domainRegex.test(stripped)
  ) {
    detectedTypes.push("url_or_qr");
    reasons.push("External URL, link, or QR code reference detected.");
  }

  // 7. Off-platform contact prompts
  for (const promptRegex of OFF_PLATFORM_PROMPTS) {
    if (promptRegex.test(normalized) || promptRegex.test(rawText)) {
      if (!detectedTypes.includes("off_platform_prompt")) {
        detectedTypes.push("off_platform_prompt");
        reasons.push("Off-platform communication prompt detected.");
      }
      break;
    }
  }

  const isBlocked = detectedTypes.length > 0;

  return {
    isBlocked,
    reason: isBlocked ? reasons.join(" ") : undefined,
    detectedTypes,
    normalizedText: normalized
  };
}

/**
 * Multi-message sequential / split contact sharing detection.
 * Prevents users from bypassing filters by typing numbers or contact details one-by-one
 * across consecutive messages (e.g. typing digits digit-by-digit, or splitting phone/bank/social/email).
 */
export function detectMultiMessageContactSharing(newMessage: string, historyUserMessages: string[] = []): DetectionResult {
  // 1. Single message check
  const singleResult = detectContactSharing(newMessage);
  if (singleResult.isBlocked) {
    return singleResult;
  }

  if (!historyUserMessages || historyUserMessages.length === 0) {
    return singleResult;
  }

  // Limit to last 10 consecutive messages from the sender to construct sequence context
  const recentHistory = historyUserMessages.slice(-10);

  // Combine history + current message
  const combinedText = [...recentHistory, newMessage].join(" ");
  const combinedResult = detectContactSharing(combinedText);

  if (combinedResult.isBlocked) {
    return {
      isBlocked: true,
      reason: "Disguised or split contact/payment information detected across consecutive messages.",
      detectedTypes: [...combinedResult.detectedTypes, "split_multi_message"],
      normalizedText: combinedResult.normalizedText
    };
  }

  // 2. Specialized Digit Accumulation Check across recent history + current message
  // E.g. User typing digits one by one ("0", "8", "0", "1", "2", "3", "4", "5", "6", "7", "8")
  const { digitsOnly: currentDigits } = normalizeForScanning(newMessage);
  
  if (currentDigits.length > 0) {
    let accumulatedDigits = "";
    // Collect digits backwards from recent consecutive messages that contain digits or short number tokens
    for (let i = recentHistory.length - 1; i >= 0; i--) {
      const { digitsOnly: prevDigits } = normalizeForScanning(recentHistory[i]);
      if (prevDigits.length > 0) {
        accumulatedDigits = prevDigits + accumulatedDigits;
      } else if (recentHistory[i].trim().length > 15) {
        // If a past message was a long text without digits, break accumulation boundary
        break;
      }
    }

    const totalDigits = accumulatedDigits + currentDigits;

    // Check if the accumulated digits hit 10 or 11 digits (or up to 15 digits)
    if (totalDigits.length >= 10 && totalDigits.length <= 15) {
      // Check if it matches Nigerian phone (11 digits e.g. 070, 080, 090, 081, 091, etc.) or 10-digit NUBAN or generic phone
      const isNigerianPhonePattern = /^0[789][01]\d{8}$/.test(totalDigits);
      const isNubanOrPhoneSequence = /^\d{10,15}$/.test(totalDigits);

      if (isNigerianPhonePattern || isNubanOrPhoneSequence) {
        return {
          isBlocked: true,
          reason: `Split sequence of ${totalDigits.length} digits detected across consecutive messages.`,
          detectedTypes: ["phone_number_or_account", "split_digit_sequence"],
          normalizedText: totalDigits
        };
      }
    }
  }

  return { isBlocked: false, detectedTypes: [] };
}

export function hasSensitiveContent(text: string): boolean {
  return detectContactSharing(text).isBlocked;
}

export function filterContent(text: string): string {
  const result = detectContactSharing(text);
  if (result.isBlocked) {
    return "*".repeat(text.length);
  }
  return text;
}
