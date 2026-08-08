import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

export interface ModerationLogEntry {
  senderId: string;
  senderName?: string;
  recipientId?: string;
  chatId?: string;
  messageType: "text" | "image";
  contentSnippet: string;
  detectedTypes: string[];
  reason: string;
  status: "blocked";
}

export async function logBlockedAttempt(entry: ModerationLogEntry): Promise<void> {
  try {
    await addDoc(collection(db, "contact_moderation_logs"), {
      ...entry,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn("Failed to log contact moderation attempt:", err);
  }
}
