import { auth } from "../firebase";

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function isFirestoreQuotaError(error: unknown): boolean {
  let raw = "";
  if (error instanceof Error) {
    raw = error.message;
  } else if (typeof error === "object" && error !== null) {
    raw = `${(error as any).code || ""} ${(error as any).message || ""} ${(error as any).error || ""}`;
  } else {
    raw = String(error);
  }
  const lower = raw.toLowerCase();
  return (
    lower.includes("quota limit exceeded") ||
    lower.includes("quota exceeded") ||
    lower.includes("free daily read units") ||
    lower.includes("resource-exhausted")
  );
}

export const FIRESTORE_QUOTA_EVENT = "shopiversity-firestore-quota";
let lastQuotaWarnAt = 0;

export function notifyFirestoreQuotaExceeded(context?: string): void {
  const now = Date.now();
  if (now - lastQuotaWarnAt > 15000) {
    lastQuotaWarnAt = now;
    console.warn(
      `Firestore daily read quota exceeded${context ? ` (${context})` : ""}; serving cached data cleanly.`
    );
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(FIRESTORE_QUOTA_EVENT, { detail: { context } }));
  }
}

export function handleListenerError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
  onQuota?: () => void
): void {
  if (isFirestoreQuotaError(error)) {
    notifyFirestoreQuotaExceeded(path || undefined);
    onQuota?.();
    return;
  }
  onQuota?.();
  handleFirestoreError(error, operationType, path);
}

export function getFirestoreErrorMessage(error: unknown): string {
  let message = "";
  
  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'object' && error !== null) {
    message = (error as any).message || (error as any).error || (error as any).code || JSON.stringify(error);
  } else {
    message = String(error);
  }

  // If it's already one of our JSON errors, parse it
  try {
    const parsed = JSON.parse(message);
    if (parsed.error) return getFirestoreErrorMessage(new Error(parsed.error));
  } catch (e) {
    // Not a JSON error, continue
  }

  if (message.includes("permission-denied") || message.includes("Missing or insufficient permissions")) {
    return "You don't have permission to perform this action.";
  }
  if (isFirestoreQuotaError(message) || message.includes("quota-exceeded")) {
    return "Daily database read quota reached. Quota resets tomorrow.";
  }
  if (message.includes("unavailable")) {
    return "Service is temporarily unavailable. Check your internet connection.";
  }
  if (message.includes("not-found")) {
    return "The requested record was not found.";
  }
  return message;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  let rawErrorMsg = "";
  if (error instanceof Error) {
    rawErrorMsg = error.message;
  } else if (typeof error === 'object' && error !== null) {
    rawErrorMsg = (error as any).message || (error as any).error || (error as any).code || JSON.stringify(error);
  } else {
    rawErrorMsg = String(error);
  }

  // Don't re-wrap if it's already a stringified error
  try {
    const parsed = JSON.parse(rawErrorMsg);
    if (parsed && parsed.error && parsed.operationType) {
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error(rawErrorMsg);
      }
    }
  } catch (e) {
    // Not already a FirestoreErrorInfo JSON, continue wrapping
  }

  const errInfo: FirestoreErrorInfo = {
    error: rawErrorMsg,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  
  const errorJson = JSON.stringify(errInfo);
  console.error('Firestore Error Detailed:', errorJson);
  
  // Throw a proper Error with pure JSON message as required by the Firebase Integration Skill
  const finalError = new Error(errorJson);
  throw finalError;
}
