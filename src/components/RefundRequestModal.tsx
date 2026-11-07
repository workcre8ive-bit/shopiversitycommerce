import React from "react";
import { Order } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, 
  AlertTriangle, 
  ShieldAlert, 
  Loader2, 
  CheckCircle,
  Building2,
  Clock,
  Landmark,
  CreditCard,
  UserCheck
} from "lucide-react";
import { cn } from "../lib/utils";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

interface RefundRequestModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (refundData: any) => void;
}

const REASON_CATEGORIES = [
  { id: "wrong_item", label: "Wrong Item Received / Incorrect Variant" },
  { id: "damaged_item", label: "Damaged or Defective Item on Arrival" },
  { id: "significantly_different", label: "Item Significantly Different from Description" },
  { id: "item_not_received", label: "Item Not Received / Courier Failed Delivery" },
  { id: "tampered_package", label: "Tampered or Opened Packaging by Courier" },
  { id: "seller_unresponsive", label: "Vendor Unresponsive or Missing Items" },
  { id: "other", label: "Other Legitimate Issue" },
];

const NIGERIAN_BANKS = [
  "Access Bank",
  "GTBank (Guaranty Trust Bank)",
  "Zenith Bank",
  "First Bank of Nigeria",
  "United Bank for Africa (UBA)",
  "OPay Digital Services",
  "PalmPay",
  "Kuda Microfinance Bank",
  "Moniepoint MFB",
  "Stanbic IBTC Bank",
  "Fidelity Bank",
  "Union Bank",
  "Sterling Bank",
  "Wema Bank (ALAT)",
  "FCMB (First City Monument Bank)",
  "Ecobank Nigeria",
  "Polaris Bank",
  "Keystone Bank",
  "Heritage Bank",
  "Jaiz Bank",
  "Taj Bank"
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
  const [reasonCategory, setReasonCategory] = React.useState<string>("wrong_item");
  const [reasonText, setReasonText] = React.useState<string>("");
  const [bankName, setBankName] = React.useState<string>("Access Bank");
  const [customBankName, setCustomBankName] = React.useState<string>("");
  const [accountNumber, setAccountNumber] = React.useState<string>("");
  const [accountName, setAccountName] = React.useState<string>(order.buyerName || "");
  const [evidenceDetails, setEvidenceDetails] = React.useState<string>("");
  const [evidenceFileUrl, setEvidenceFileUrl] = React.useState<string>("");
  const [submitting, setSubmitting] = React.useState<boolean>(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Success 24h confirmation popup state
  const [showConfirmationPopup, setShowConfirmationPopup] = React.useState(false);
  const [submittedData, setSubmittedData] = React.useState<any>(null);

  const orderTotal = order.totalPrice || 0;
  const requestedAmount = refundType === "full" 
    ? orderTotal 
    : Math.min(orderTotal, Math.max(1, Number(customAmount) || 0));

  // Payment & 3-day (72-hour) policy validation
  const isPaid = order.paymentStatus === "paid" || order.paymentMethod === "online";
  const deliveryDate = order.deliveredAt || (
    (order.status === "delivered" || order.status === "completed" || order.status === "Order Delivered" || order.status === "Order Picked Up") 
      ? (order.updatedAt || order.createdAt) 
      : null
  );
  const hoursSinceDelivery = deliveryDate ? (Date.now() - new Date(deliveryDate).getTime()) / (1000 * 60 * 60) : 0;
  const isExpired = deliveryDate && hoursSinceDelivery > 72 && (!order.disputeStatus || order.disputeStatus === "none");

  // 1.5% fee calculation directly on requested refund amount
  const feeRate = 0.015;
  const refundFee = Math.round(requestedAmount * feeRate * 100) / 100;
  const buyerRefundAmount = Math.max(0, Math.round((requestedAmount - refundFee) * 100) / 100);

  const effectiveBank = bankName === "Other Bank" ? customBankName.trim() : bankName;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPaid) {
      setErrorMessage("Refunds are available after payment has been confirmed. For unpaid orders, cancellation is immediate.");
      return;
    }
    if (isExpired) {
      setErrorMessage("Refund requests must be raised within 3 days (72 hours) of delivery. The protection window has expired.");
      return;
    }
    if (!reasonText.trim()) {
      setErrorMessage("Please enter your detailed reason for this refund request.");
      return;
    }
    if (!accountNumber.trim() || accountNumber.replace(/\D/g, "").length !== 10) {
      setErrorMessage("Please enter a valid 10-digit Nigerian NUBAN bank account number.");
      return;
    }
    if (!accountName.trim()) {
      setErrorMessage("Please provide the legal account name corresponding to your bank details.");
      return;
    }
    if (!effectiveBank) {
      setErrorMessage("Please select or specify your bank name.");
      return;
    }
    if (requestedAmount <= 0 || requestedAmount > orderTotal) {
      setErrorMessage(`Refund amount must be between ₦1 and ₦${orderTotal.toLocaleString()}`);
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      // Look up seller email from Firestore if available
      let sellerEmail = "";
      try {
        if (order.sellerId) {
          const sSnap = await getDoc(doc(db, "users", order.sellerId));
          if (sSnap.exists()) {
            sellerEmail = sSnap.data().email || "";
          }
        }
      } catch (e) {
        // quiet fallback
      }

      const buyerEmail = auth.currentUser?.email || (order as any).buyerEmail || "";

      const payload = {
        orderId: order.id,
        buyerId: order.buyerId,
        buyerName: order.buyerName,
        buyerEmail,
        sellerId: order.sellerId,
        sellerName: order.sellerName || "Vendor",
        sellerEmail,
        logisticsId: order.logisticsId || null,
        logisticsName: order.logisticsName || null,
        originalOrderTotal: orderTotal,
        requestedAmount,
        orderTotal,
        reasonCategory,
        reason: reasonText.trim(),
        bankName: effectiveBank,
        accountNumber: accountNumber.trim(),
        accountName: accountName.trim(),
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

      setSubmittedData(data);
      setShowConfirmationPopup(true);
    } catch (err: any) {
      console.error("Refund submit error:", err);
      setErrorMessage(err.message || "An error occurred while submitting your refund request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {!showConfirmationPopup && (
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
                className="absolute top-6 right-6 w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer border-none"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Header */}
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">
                    Customer Escrow Protection
                  </span>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white font-display">
                    Request 3-Day Order Refund
                  </h3>
                </div>
              </div>

              {/* Crucial Perishable & Tampering Exception Notice */}
              <div className="p-3.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl text-[11px] text-red-900 dark:text-red-200 space-y-1 mb-5">
                <div className="flex items-center gap-1.5 font-black text-red-700 dark:text-red-400 uppercase tracking-wide text-[10px]">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>Non-Refundable Exceptions Policy</span>
                </div>
                <p className="text-[11px] font-medium leading-relaxed">
                  Refunds are subject to our 3-day guarantee in <strong>exception of perishable goods</strong> (fresh cooked meals, hot cafeteria snacks, fresh produce) or <strong>goods that have been tampered with, opened, or consumed</strong>. All items must be returned intact in their original condition.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Order summary banner */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Target Product</p>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{order.productName}</p>
                    <p className="text-[10px] text-slate-500 font-medium">
                      {order.sellerName ? `Vendor: ${order.sellerName}` : `Quantity: ${order.quantity}`}
                    </p>
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
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Refund Amount Option
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setRefundType("full");
                        setCustomAmount(orderTotal.toString());
                      }}
                      className={cn(
                        "p-2.5 rounded-xl border text-left transition-all cursor-pointer",
                        refundType === "full"
                          ? "border-[#ff6b00] bg-orange-50/50 dark:bg-orange-950/20 text-orange-900 dark:text-orange-300 ring-2 ring-orange-400/20"
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400"
                      )}
                    >
                      <div className="font-bold text-xs">Full Refund</div>
                      <div className="text-[10px] opacity-70">100% of order (₦{orderTotal.toLocaleString()})</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRefundType("partial")}
                      className={cn(
                        "p-2.5 rounded-xl border text-left transition-all cursor-pointer",
                        refundType === "partial"
                          ? "border-[#ff6b00] bg-orange-50/50 dark:bg-orange-950/20 text-orange-900 dark:text-orange-300 ring-2 ring-orange-400/20"
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400"
                      )}
                    >
                      <div className="font-bold text-xs">Partial Refund</div>
                      <div className="text-[10px] opacity-70">Custom amount</div>
                    </button>
                  </div>
                </div>

                {/* Custom Amount if partial */}
                {refundType === "partial" && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Requested Refund Amount (₦)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={orderTotal}
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-xs font-mono font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                )}

                {/* Reason Category */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Primary Reason Category
                  </label>
                  <select
                    value={reasonCategory}
                    onChange={(e) => setReasonCategory(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-xs font-semibold text-slate-900 dark:text-white"
                  >
                    {REASON_CATEGORIES.map((cat, idx) => (
                      <option key={`refund-cat-${cat.id}-${idx}`} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Detailed Reason */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Detailed Reason for Refund *
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={reasonText}
                    onChange={(e) => setReasonText(e.target.value)}
                    placeholder="Clearly explain the issue (e.g., delivered item defective, wrong specifications delivered, courier missing packaging)..."
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-xs font-medium text-slate-900 dark:text-white resize-none"
                  />
                </div>

                {/* Bank Account Details Section */}
                <div className="p-3.5 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl space-y-3">
                  <div className="flex items-center gap-1.5 text-indigo-900 dark:text-indigo-200 font-black text-xs uppercase tracking-wide">
                    <Landmark className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Your Bank Account Details (for 24h Payout)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Bank Name
                      </label>
                      <select
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="w-full h-10 px-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white outline-none"
                      >
                        {NIGERIAN_BANKS.map((b, idx) => (
                          <option key={`bank-${idx}`} value={b}>
                            {b}
                          </option>
                        ))}
                        <option value="Other Bank">Other Bank (Specify)</option>
                      </select>
                    </div>

                    {bankName === "Other Bank" && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Specify Bank Name
                        </label>
                        <input
                          type="text"
                          required
                          value={customBankName}
                          onChange={(e) => setCustomBankName(e.target.value)}
                          placeholder="Bank Name"
                          className="w-full h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none"
                        />
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        10-Digit Account Number *
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={10}
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                        placeholder="0123456789"
                        className="w-full h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold text-xs text-slate-900 dark:text-white outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Account Name (as registered with your bank) *
                    </label>
                    <input
                      type="text"
                      required
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      placeholder="e.g. Chukwuebuka Daniel Adeyemi"
                      className="w-full h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white outline-none"
                    />
                  </div>
                </div>

                {/* 1.5% Escrow Fee Calculation Card */}
                <div className="p-3 bg-amber-50/60 dark:bg-amber-950/20 rounded-xl border border-amber-200/60 dark:border-amber-800/40 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider block">
                      Net Payout after 1.5% Escrow Fee
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Refund ₦{requestedAmount.toLocaleString()} - Fee ₦{refundFee.toLocaleString()}
                    </span>
                  </div>
                  <span className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">
                    ₦{buyerRefundAmount.toLocaleString()}
                  </span>
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
                    className="flex-1 h-11 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs transition-all cursor-pointer border-none"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !reasonText.trim() || accountNumber.length !== 10}
                    className="flex-1 h-11 bg-gradient-to-r from-[#ff6b00] to-orange-500 hover:from-orange-600 hover:to-orange-500 active:scale-[0.98] disabled:opacity-50 text-white rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 cursor-pointer border-none"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="w-4 h-4" />
                        Submit Refund Request
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Required 24-Hour Confirmation Popup with Non-Tampered Condition Notice */}
      <AnimatePresence>
        {showConfirmationPopup && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 15 }}
              className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-6 sm:p-8 max-w-md w-full border border-slate-200 dark:border-zinc-800 shadow-2xl text-center space-y-4 relative"
            >
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 rounded-full inline-block">
                  Request Received
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-display">
                  Refund Under Processing
                </h3>
              </div>

              {/* Explicit 24-hour and non-tampered policy message */}
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 text-left space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
                  <Clock className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>Disbursement Timeline: Within 24 Hours</span>
                </div>
                <p className="text-[11px] font-medium leading-relaxed">
                  Your refund will take place within <strong>24 hours</strong> directly into your specified bank account.
                </p>
                <div className="pt-2 border-t border-amber-200/60 dark:border-amber-800/60 text-[11px] font-bold text-red-600 dark:text-red-400 flex items-start gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Condition: The goods must be returned in their original condition and not tampered with, opened, or consumed.
                  </span>
                </div>
              </div>

              {/* Bank Details Summary */}
              <div className="p-3.5 bg-slate-50 dark:bg-zinc-800/60 rounded-xl border border-slate-200/60 dark:border-zinc-700/60 text-left text-xs space-y-1 font-sans">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Bank Name:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{effectiveBank}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Account Number:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{accountNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Account Name:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{accountName}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 dark:border-zinc-700 pt-1 mt-1">
                  <span className="text-slate-500 font-medium">Net Refund:</span>
                  <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">₦{buyerRefundAmount.toLocaleString()}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowConfirmationPopup(false);
                  onSuccess(submittedData);
                  onClose();
                }}
                className="w-full py-3.5 bg-gradient-to-r from-[#ff6b00] to-orange-500 hover:from-orange-600 hover:to-orange-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-orange-500/25 transition-all cursor-pointer border-none"
              >
                Understood & Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
