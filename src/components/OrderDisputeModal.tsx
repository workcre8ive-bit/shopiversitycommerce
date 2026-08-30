import React, { useState } from "react";
import { X, AlertTriangle, ShieldAlert, Send, Loader2, CheckCircle, FileText, Camera } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { auth, db } from "../firebase";
import { doc, updateDoc, collection, addDoc } from "firebase/firestore";
import { Order } from "../types";

interface OrderDisputeModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const DISPUTE_REASONS = [
  { id: "item_not_received", label: "Item Not Received / Non-Delivery" },
  { id: "wrong_item", label: "Wrong Item Sent / Significantly Not as Described" },
  { id: "damaged_item", label: "Item Damaged / Defective on Arrival" },
  { id: "tampered_package", label: "Package Tampered With / Missing Parts" },
  { id: "delivery_issue", label: "Logistics / Courier Dispute (Rider Issue)" },
  { id: "payment_issue", label: "Payment or Billing Inconsistency" },
  { id: "seller_unresponsive", label: "Seller Refused Handover or Unresponsive" },
  { id: "other", label: "Other Serious Problem" },
];

export default function OrderDisputeModal({ order, isOpen, onClose, onSuccess }: OrderDisputeModalProps) {
  const [reasonCategory, setReasonCategory] = useState<string>("item_not_received");
  const [details, setDetails] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!details.trim()) {
      setErrorMsg("Please provide specific details explaining the issue.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const user = auth.currentUser;
      const reporterId = user?.uid || order.buyerId;
      const role = user?.uid === order.sellerId ? "seller" : "buyer";

      // 1. Call Backend Dispute Endpoint to freeze escrow and log audit event
      try {
        const response = await fetch("/api/orders/dispute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: order.id,
            reporterId,
            role,
            reasonCategory,
            details: details.trim(),
            evidenceUrl: evidenceUrl.trim() || undefined,
          }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          console.warn("Backend dispute endpoint notice:", data.error);
        }
      } catch (apiErr) {
        console.warn("Backend dispute API unreachable, using client Firestore fallback:", apiErr);
      }

      // 2. Client-side Firestore sync
      const now = new Date().toISOString();
      const disputeRecord = {
        orderId: order.id,
        buyerId: order.buyerId,
        buyerName: order.buyerName,
        sellerId: order.sellerId,
        sellerName: order.sellerName || "Seller",
        reasonCategory,
        details: details.trim(),
        evidenceUrl: evidenceUrl.trim() || null,
        status: "active",
        createdAt: now,
        totalPrice: order.totalPrice,
      };

      await addDoc(collection(db, "disputes"), disputeRecord);

      await updateDoc(doc(db, "orders", order.id), {
        disputeStatus: "active",
        disputedAt: now,
        disputeCategory: reasonCategory,
        disputeDetails: details.trim(),
        disputeEvidenceUrl: evidenceUrl.trim() || null,
        settlementOnHold: true,
        escrowStatus: "held",
        updatedAt: now,
      });

      // Audit event
      await addDoc(collection(db, "order_events"), {
        id: "EVT_" + Math.random().toString(36).substring(2, 12),
        orderId: order.id,
        eventType: "DISPUTE_OPENED",
        performedBy: reporterId,
        role,
        notes: `Dispute opened (${reasonCategory}): ${details.trim()}`,
        timestamp: now,
      });

      setSubmitted(true);
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 2200);
    } catch (err: any) {
      console.error("Failed to submit dispute:", err);
      setErrorMsg(err.message || "Failed to submit dispute. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden p-6 sm:p-8"
        >
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {submitted ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-3xl mx-auto flex items-center justify-center">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Dispute Filed & Escrow Frozen</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Your dispute has been logged. Settlement for order <span className="font-mono font-bold">#{order.id.slice(0, 8)}</span> is on hold. The SHOPIVERSITY Dispute Resolution Team will review all parties' evidence within 24 hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-900/30 text-red-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">Report Problem / Raise Dispute</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Order #{order.id.slice(0, 8)} • ₦{order.totalPrice.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-2xl text-[11px] text-amber-900 dark:text-amber-300">
                <strong>Anti-Scam Protection:</strong> Raising a formal dispute will immediately freeze escrow payout to the seller and create a permanent audit log entry.
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl font-medium">
                  {errorMsg}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Dispute Reason Category
                </label>
                <select
                  value={reasonCategory}
                  onChange={(e) => setReasonCategory(e.target.value)}
                  className="w-full p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-red-500"
                >
                  {DISPUTE_REASONS.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Detailed Explanation & What Happened
                </label>
                <textarea
                  rows={4}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Describe the issue in detail (e.g. Courier did not show up, received empty box, wrong item specifications, etc.)..."
                  className="w-full p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white outline-none focus:border-red-500 resize-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Photo / Evidence URL (Optional)</span>
                  <span className="text-[10px] text-slate-400 lowercase">e.g. Google Drive, Imgur, or cloud link</span>
                </label>
                <input
                  type="url"
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white outline-none focus:border-red-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl font-bold text-xs hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !details.trim()}
                  className="flex-1 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 active:scale-98 transition-all disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Submit Dispute
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
