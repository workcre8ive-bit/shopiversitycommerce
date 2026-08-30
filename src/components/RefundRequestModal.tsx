import React from "react";
import { Order } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, 
  AlertTriangle, 
  Receipt, 
  HelpCircle, 
  ShieldAlert, 
  ArrowRight, 
  Loader2, 
  CheckCircle,
  FileText,
  DollarSign
} from "lucide-react";
import { cn } from "../lib/utils";

interface RefundRequestModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (refundData: any) => void;
}

const REASON_CATEGORIES = [
  { id: "item_not_received", label: "Item Not Received / Courier Failed Delivery" },
  { id: "wrong_item", label: "Wrong Item Received / Incorrect Variant" },
  { id: "damaged_item", label: "Damaged or Defective Item on Arrival" },
  { id: "significantly_different", label: "Item Significantly Different from Description" },
  { id: "tampered_package", label: "Tampered or Opened Packaging" },
  { id: "quality_issue", label: "Severe Quality / Authenticity Issue" },
  { id: "seller_unresponsive", label: "Seller / Logistics Unresponsive" },
  { id: "other", label: "Other Legitimate Issue" },
];

export default function RefundRequestModal({
  order,
  isOpen,
  onClose,
  onSuccess,
}: RefundRequestModalProps) {
  if (!order || !isOpen) return null;

  const [refundType, setRefundType] = React.useState<"full" | "partial">("full");
  const [customAmount, setCustomAmount] = React.useState<string>(order.totalPrice.toString());
  const [reasonCategory, setReasonCategory] = React.useState<string>("damaged_item");
  const [reasonText, setReasonText] = React.useState<string>("");
  const [evidenceDetails, setEvidenceDetails] = React.useState<string>("");
  const [evidenceFileUrl, setEvidenceFileUrl] = React.useState<string>("");
  const [submitting, setSubmitting] = React.useState<boolean>(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const orderTotal = order.totalPrice || 0;
  const requestedAmount = refundType === "full" 
    ? orderTotal 
    : Math.min(orderTotal, Math.max(1, Number(customAmount) || 0));

  // 1.5% fee calculation directly on the requested refund amount
  const feeRate = 0.015;
  const refundFee = Math.round(requestedAmount * feeRate * 100) / 100;
  const buyerRefundAmount = Math.max(0, Math.round((requestedAmount - refundFee) * 100) / 100);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reasonText.trim()) {
      setErrorMessage("Please describe the issue in detail.");
      return;
    }
    if (requestedAmount <= 0 || requestedAmount > orderTotal) {
      setErrorMessage(`Refund amount must be between ₦1 and ₦${orderTotal.toLocaleString()}`);
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = {
        orderId: order.id,
        buyerId: order.buyerId,
        buyerName: order.buyerName,
        sellerId: order.sellerId,
        sellerName: order.sellerName || "Seller",
        logisticsId: order.logisticsId || null,
        logisticsName: order.logisticsName || null,
        originalOrderTotal: orderTotal,
        requestedAmount,
        orderTotal,
        reasonCategory,
        reason: reasonText.trim(),
        evidenceDetails: evidenceDetails.trim() || undefined,
        evidenceFileUrl: evidenceFileUrl.trim() || undefined
      };

      const res = await fetch("/api/refund/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit refund request");
      }

      onSuccess(data);
      onClose();
    } catch (err: any) {
      console.error("Refund submit error:", err);
      setErrorMessage(err.message || "An error occurred while submitting your refund request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 lg:p-8 max-w-xl w-full shadow-2xl border border-slate-100 dark:border-slate-800 my-8 relative"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">
                Buyer Escrow Protection
              </span>
              <h3 className="text-xl font-black text-slate-900 dark:text-white font-display">
                Request Order Refund
              </h3>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Order summary banner */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Target Order</p>
                <p className="text-xs font-bold text-slate-900 dark:text-white">{order.productName}</p>
                <p className="text-[10px] text-slate-500 font-mono">#{order.id.slice(0, 10)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-slate-400">Order Total</p>
                <p className="text-sm font-black font-mono text-slate-900 dark:text-white">
                  ₦{orderTotal.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Refund Type Selection */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                Refund Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setRefundType("full");
                    setCustomAmount(orderTotal.toString());
                  }}
                  className={cn(
                    "p-3 rounded-2xl border text-left transition-all",
                    refundType === "full"
                      ? "border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-300 ring-2 ring-amber-400/20"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                  )}
                >
                  <div className="font-bold text-xs">Full Refund</div>
                  <div className="text-[10px] opacity-70">100% of order (₦{orderTotal.toLocaleString()})</div>
                </button>

                <button
                  type="button"
                  onClick={() => setRefundType("partial")}
                  className={cn(
                    "p-3 rounded-2xl border text-left transition-all",
                    refundType === "partial"
                      ? "border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-300 ring-2 ring-amber-400/20"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                  )}
                >
                  <div className="font-bold text-xs">Partial Refund</div>
                  <div className="text-[10px] opacity-70">Specify custom amount</div>
                </button>
              </div>
            </div>

            {/* Custom Amount Input (if partial) */}
            {refundType === "partial" && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Requested Refund Amount (₦)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max={orderTotal}
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-amber-500 text-xs font-mono font-bold text-slate-900 dark:text-white"
                  />
                  <span className="absolute right-3 top-3 text-xs text-slate-400 font-bold">NGN</span>
                </div>
              </div>
            )}

            {/* Live 1.5% Fee Breakdown Calculation Card */}
            <div className="p-4 bg-amber-50/60 dark:bg-amber-950/20 rounded-2xl border border-amber-200/60 dark:border-amber-800/40 space-y-2.5">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-amber-200/40 dark:border-amber-800/30">
                <span className="font-bold text-slate-700 dark:text-slate-300">Amount Being Refunded</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  ₦{requestedAmount.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
                <span className="flex items-center gap-1 font-medium">
                  SHOPIVERSITY Processing Fee (1.5%)
                </span>
                <span className="font-mono font-bold">-₦{refundFee.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm pt-1 font-black text-emerald-700 dark:text-emerald-400">
                <span>Net Disbursed to Buyer</span>
                <span className="font-mono text-base">₦{buyerRefundAmount.toLocaleString()}</span>
              </div>
              <p className="text-[10px] text-amber-700 dark:text-amber-400/80 leading-relaxed pt-1">
                ⚠️ <strong>Note:</strong> The 1.5% fee is strictly deducted from the amount actually being refunded. Once requested, vendor escrow release is immediately frozen.
              </p>
            </div>

            {/* Reason Category */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Primary Reason / Issue Category
              </label>
              <select
                value={reasonCategory}
                onChange={(e) => setReasonCategory(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-amber-500 text-xs font-semibold text-slate-900 dark:text-white"
              >
                {REASON_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Detailed Explanation & Circumstances
              </label>
              <textarea
                required
                rows={3}
                value={reasonText}
                onChange={(e) => setReasonText(e.target.value)}
                placeholder="Explain what happened (e.g. item arrived broken, package was never brought by courier, wrong item color/model)..."
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-amber-500 text-xs font-medium text-slate-900 dark:text-white resize-none"
              />
            </div>

            {/* Optional Evidence Details */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Supporting Evidence / Photo Link (Optional)
              </label>
              <input
                type="text"
                value={evidenceFileUrl}
                onChange={(e) => setEvidenceFileUrl(e.target.value)}
                placeholder="https://... or photo description"
                className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-amber-500 text-xs text-slate-900 dark:text-white"
              />
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="flex-1 h-12 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl font-bold text-xs transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !reasonText.trim()}
                className="flex-1 h-12 bg-amber-600 hover:bg-amber-700 active:scale-[0.98] disabled:opacity-50 text-white rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-4 h-4" />
                    Submit Refund Request (₦{buyerRefundAmount.toLocaleString()})
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
