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
  if (message.includes("quota-exceeded")) {
    return "Storage quota exceeded. Please try again later.";
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
