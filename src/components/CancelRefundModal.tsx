import React from "react";
import { Order } from "../types";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  AlertTriangle,
  CreditCard,
  Wallet,
  Building2,
  CheckCircle2,
  Loader2,
  ShieldAlert,
  ArrowRight,
  RotateCcw,
  FileText,
  DollarSign
} from "lucide-react";
import { cn } from "../lib/utils";
import { doc, updateDoc, increment, addDoc, collection, getDoc } from "firebase/firestore";
import { db, auth } from "../firebase";

interface CancelRefundModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedOrder?: any) => void;
  currentUser?: any;
}

const CANCEL_REASONS = [
  { id: "changed_mind", label: "Changed my mind / No longer needed" },
  { id: "seller_delayed", label: "Seller delayed processing / packaging" },
  { id: "wrong_item_ordered", label: "Ordered wrong item / size / specification" },
  { id: "campus_location_changed", label: "My campus delivery location changed" },
  { id: "found_cheaper_alternative", label: "Found alternative on campus" },
  { id: "other", label: "Other reason" }
];

const NIGERIAN_BANKS = [
  "Access Bank",
  "GTBank (Guaranty Trust)",
  "First Bank of Nigeria",
  "Zenith Bank",
  "UBA (United Bank for Africa)",
  "Kuda Bank",
  "OPay",
  "PalmPay",
  "Moniepoint MFB",
  "Fidelity Bank",
  "Stanbic IBTC Bank",
  "Sterling Bank",
  "Union Bank",
  "Wema Bank / ALAT"
];

export default function CancelRefundModal({
  order,
  isOpen,
  onClose,
  onSuccess,
  currentUser
}: CancelRefundModalProps) {
  if (!order || !isOpen) return null;

  const isPaid = order.paymentStatus === "paid" || order.paymentMethod === "online";
  const orderTotal = order.totalPrice || 0;
  
  // Standard 1.5% escrow processing fee for paid order refunds
  const refundFee = isPaid ? Math.round(orderTotal * 0.015) : 0;
  const netRefundAmount = isPaid ? Math.max(0, orderTotal - refundFee) : 0;

  const [selectedReason, setSelectedReason] = React.useState<string>("changed_mind");
  const [customReasonDetails, setCustomReasonDetails] = React.useState<string>("");
  const [refundDestination, setRefundDestination] = React.useState<"wallet" | "card" | "bank">("wallet");
  
  // Bank details for manual bank transfer refund
  const [bankName, setBankName] = React.useState<string>(currentUser?.bankName || "");
  const [accountNumber, setAccountNumber] = React.useState<string>(currentUser?.accountNumber || "");
  const [accountName, setAccountName] = React.useState<string>(currentUser?.displayName || "");

  const [loading, setLoading] = React.useState<boolean>(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [completedSuccess, setCompletedSuccess] = React.useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (isPaid && refundDestination === "bank") {
      if (!bankName.trim() || accountNumber.trim().length < 10 || !accountName.trim()) {
        setErrorMessage("Please complete all bank settlement account fields (10-digit NUBAN number, bank, account name).");
        return;
      }
    }

    setLoading(true);

    try {
      const orderRef = doc(db, "orders", order.id);
      const isTicket = order.productName.toLowerCase().includes("ticket") || !!order.ticketTierId;
      const cancellationReasonLabel = CANCEL_REASONS.find(r => r.id === selectedReason)?.label || selectedReason;
      const fullReasonString = customReasonDetails.trim() 
        ? `${cancellationReasonLabel} - ${customReasonDetails.trim()}`
        : cancellationReasonLabel;

      const refundData: any = {
        status: "cancelled",
        cancelledAt: new Date().toISOString(),
        cancellationInitiator: "buyer",
        hiddenFromSeller: isTicket ? true : false,
        refundStatus: isPaid ? (refundDestination === "wallet" ? "completed" : "requested") : "none",
        refundAmount: isPaid ? orderTotal : 0,
        refundFee: isPaid ? refundFee : 0,
        netRefundAmount: isPaid ? netRefundAmount : 0,
        refundReason: fullReasonString,
        refundDestination: isPaid ? refundDestination : "none",
        refundRequestedAt: new Date().toISOString()
      };

      if (isPaid && refundDestination === "bank") {
        refundData.refundBankDetails = {
          bankName: bankName.trim(),
          accountNumber: accountNumber.trim(),
          accountName: accountName.trim()
        };
      }

      // If user selected instant wallet refund and has a valid user document, credit the wallet
      if (isPaid && refundDestination === "wallet" && auth.currentUser) {
        try {
          const userRef = doc(db, "users", auth.currentUser.uid);
          await updateDoc(userRef, {
            walletBalance: increment(netRefundAmount)
          });
          refundData.refundProcessedAt = new Date().toISOString();
          refundData.refundNote = `Instant credit of ₦${netRefundAmount.toLocaleString()} applied to SHOPIVERSITY Campus Wallet`;
        } catch (walletErr) {
          console.warn("Wallet increment failed, setting refund to requested for admin settlement:", walletErr);
          refundData.refundStatus = "requested";
        }
      }

      // 1. Update Order in Firestore
      await updateDoc(orderRef, refundData);

      // 2. Restore Product Inventory Stock
      if (order.productId) {
        try {
          const productRef = doc(db, "products", order.productId);
          await updateDoc(productRef, {
            stock: increment(order.quantity || 1)
          });
        } catch (stockErr) {
          console.warn("Stock restoration note:", stockErr);
        }
      }

      // 3. Post Audit Trail Entry in Firestore
      try {
        await addDoc(collection(db, "order_audit_trail"), {
          orderId: order.id,
          actorId: auth.currentUser?.uid || order.buyerId,
          actorName: currentUser?.displayName || order.buyerName || "Buyer",
          actorRole: "buyer",
          action: "ORDER_CANCELLED_AND_REFUND_INITIATED",
          details: `Order #${order.id.slice(-6).toUpperCase()} cancelled by buyer. Reason: ${fullReasonString}. Refund destination: ${isPaid ? refundDestination : 'N/A'}. Net refund: ₦${netRefundAmount.toLocaleString()}.`,
          timestamp: new Date().toISOString()
        });
      } catch (auditErr) {
        console.warn("Audit trail logging note:", auditErr);
      }

      // 4. Send Notification to Seller
      if (order.sellerId) {
        try {
          await addDoc(collection(db, "notifications"), {
            userId: order.sellerId,
            title: "Order Cancelled by Buyer",
            message: `Buyer ${order.buyerName || 'Student'} cancelled order for ${order.productName}. Stock has been restored.`,
            type: "order",
            isRead: false,
            createdAt: new Date().toISOString()
          });
        } catch (notifErr) {
          console.warn("Notification error:", notifErr);
        }
      }

      // 5. Also ping backend API for centralized record tracking
      if (isPaid) {
        try {
          await fetch("/api/refund/request", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: order.id,
              buyerId: order.buyerId,
              buyerName: order.buyerName,
              sellerId: order.sellerId,
              sellerName: order.sellerName || "Merchant",
              logisticsId: order.logisticsId || null,
              logisticsName: order.logisticsName || null,
              originalOrderTotal: orderTotal,
              requestedAmount: orderTotal,
              orderTotal,
              reasonCategory: selectedReason,
              reason: fullReasonString,
              refundDestination,
              bankDetails: refundDestination === "bank" ? { bankName, accountNumber, accountName } : null
            })
          });
        } catch (apiErr) {
          console.warn("Backend refund endpoint note:", apiErr);
        }
      }

      setCompletedSuccess(true);
      onSuccess(refundData);
    } catch (err: any) {
      console.error("Cancellation error:", err);
      setErrorMessage(err.message || "Failed to cancel order and submit refund. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-[2.5rem] p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-6 my-8 text-left"
        >
          {completedSuccess ? (
            <div className="text-center py-6 space-y-5">
              <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                  Order Cancelled Successfully
                </h3>
                <p className="text-sm text-slate-600 dark:text-zinc-300 max-w-md mx-auto leading-relaxed">
                  {isPaid ? (
                    refundDestination === "wallet" ? (
                      <>
                        Your order has been cancelled and <strong className="text-emerald-600 dark:text-emerald-400">₦{netRefundAmount.toLocaleString()}</strong> has been credited directly to your <strong>SHOPIVERSITY Campus Wallet</strong>.
                      </>
                    ) : (
                      <>
                        Your refund request of <strong className="text-emerald-600 dark:text-emerald-400">₦{netRefundAmount.toLocaleString()}</strong> has been submitted to escrow settlement. You will receive updates as it completes.
                      </>
                    )
                  ) : (
                    <>Your Pay-on-Delivery order has been cancelled. No charge was incurred and the seller's stock has been restored.</>
                  )}
                </p>
              </div>
              <div className="pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-8 py-3.5 bg-slate-900 dark:bg-zinc-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
                >
                  Done & Close
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/40 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                    <RotateCcw className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                      Cancel Order & Refund
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">
                      {order.productName} • ₦{order.totalPrice.toLocaleString()}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 flex items-center justify-center text-slate-500 dark:text-zinc-400 transition-colors cursor-pointer text-sm font-bold border-none"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {errorMessage && (
                <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-2xl text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Financial Summary Breakdown */}
                {isPaid ? (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-850/60 border border-slate-200 dark:border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-wider">
                      <span>Refund Breakdown</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300">
                        1.5% Escrow Fee
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-600 dark:text-zinc-300">
                        <span>Original Order Total:</span>
                        <span className="font-bold">₦{orderTotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-red-600 dark:text-red-400">
                        <span>SHOPIVERSITY Processing Fee (1.5%):</span>
                        <span className="font-bold">-₦{refundFee.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-zinc-750 text-sm font-black text-slate-900 dark:text-white">
                        <span>Net Refund Amount to Buyer:</span>
                        <span className="text-emerald-600 dark:text-emerald-400 text-base">
                          ₦{netRefundAmount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                    <p className="leading-relaxed">
                      This is a <strong>Pay on Delivery</strong> order. No funds were debited, so cancelling this order incurs <strong>₦0 fee</strong> and restores inventory immediately for the merchant.
                    </p>
                  </div>
                )}

                {/* Refund Destination Selection (Only if paid) */}
                {isPaid && (
                  <div className="space-y-2.5">
                    <label className="text-xs font-black text-slate-800 dark:text-zinc-200 uppercase tracking-wider block">
                      Choose Refund Destination:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setRefundDestination("wallet")}
                        className={cn(
                          "p-3.5 rounded-2xl border text-left flex flex-col justify-between space-y-2 transition-all cursor-pointer",
                          refundDestination === "wallet"
                            ? "bg-orange-50 dark:bg-orange-950/20 border-orange-500 text-orange-900 dark:text-orange-200 ring-2 ring-orange-500/20 shadow-xs"
                            : "bg-slate-50 dark:bg-zinc-850 border-slate-200 dark:border-zinc-750 text-slate-700 dark:text-zinc-300 hover:border-slate-300"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <Wallet className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                          <span className="text-[9px] font-black px-1.5 py-0.5 bg-emerald-600 text-white rounded-md uppercase">
                            Instant
                          </span>
                        </div>
                        <div>
                          <p className="font-black text-xs">Campus Wallet</p>
                          <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-tight">
                            Instant balance credit
                          </p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRefundDestination("card")}
                        className={cn(
                          "p-3.5 rounded-2xl border text-left flex flex-col justify-between space-y-2 transition-all cursor-pointer",
                          refundDestination === "card"
                            ? "bg-orange-50 dark:bg-orange-950/20 border-orange-500 text-orange-900 dark:text-orange-200 ring-2 ring-orange-500/20 shadow-xs"
                            : "bg-slate-50 dark:bg-zinc-850 border-slate-200 dark:border-zinc-750 text-slate-700 dark:text-zinc-300 hover:border-slate-300"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <CreditCard className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                          <span className="text-[9px] font-black text-slate-400 uppercase">
                            1-2 Days
                          </span>
                        </div>
                        <div>
                          <p className="font-black text-xs">Original Card</p>
                          <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-tight">
                            Reversal via Paystack
                          </p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRefundDestination("bank")}
                        className={cn(
                          "p-3.5 rounded-2xl border text-left flex flex-col justify-between space-y-2 transition-all cursor-pointer",
                          refundDestination === "bank"
                            ? "bg-orange-50 dark:bg-orange-950/20 border-orange-500 text-orange-900 dark:text-orange-200 ring-2 ring-orange-500/20 shadow-xs"
                            : "bg-slate-50 dark:bg-zinc-850 border-slate-200 dark:border-zinc-750 text-slate-700 dark:text-zinc-300 hover:border-slate-300"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <Building2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-[9px] font-black text-slate-400 uppercase">
                            Transfer
                          </span>
                        </div>
                        <div>
                          <p className="font-black text-xs">Bank Account</p>
                          <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-tight">
                            Direct NUBAN payout
                          </p>
                        </div>
                      </button>
                    </div>

                    {/* Bank Settlement Inputs (when bank chosen) */}
                    {refundDestination === "bank" && (
                      <div className="p-4 rounded-2xl bg-orange-50/50 dark:bg-orange-950/10 border border-orange-200/80 dark:border-orange-900/40 space-y-3 animate-in fade-in slide-in-from-top-1">
                        <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 block">
                          Enter Bank Account for Refund Payout:
                        </span>
                        <div className="space-y-2">
                          <select
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                            required
                            className="w-full h-10 px-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs outline-none focus:border-orange-500"
                          >
                            <option value="">Select Bank...</option>
                            {NIGERIAN_BANKS.map((b, idx) => (
                              <option key={`bank-opt-${b}-${idx}`} value={b}>{b}</option>
                            ))}
                          </select>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input
                              type="text"
                              maxLength={10}
                              value={accountNumber}
                              onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                              placeholder="10-Digit Account Number"
                              required
                              className="h-10 px-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs outline-none focus:border-orange-500"
                            />
                            <input
                              type="text"
                              value={accountName}
                              onChange={(e) => setAccountName(e.target.value)}
                              placeholder="Account Holder Full Name"
                              required
                              className="h-10 px-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs outline-none focus:border-orange-500"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Reason for Cancellation */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-800 dark:text-zinc-200 uppercase tracking-wider block">
                    Reason for Cancellation:
                  </label>
                  <select
                    value={selectedReason}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="w-full h-11 px-3 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs outline-none focus:border-orange-500 font-medium"
                  >
                    {CANCEL_REASONS.map((r, idx) => (
                      <option key={`cancel-reason-${r.id}-${idx}`} value={r.id}>{r.label}</option>
                    ))}
                  </select>
                </div>

                {/* Custom Notes / Feedback */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block">
                    Additional Details / Feedback (Optional):
                  </label>
                  <textarea
                    rows={2}
                    value={customReasonDetails}
                    onChange={(e) => setCustomReasonDetails(e.target.value)}
                    placeholder="Tell us more about why you are cancelling..."
                    className="w-full p-3 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs outline-none focus:border-orange-500 resize-none"
                  />
                </div>

                {/* Submit / Cancel Buttons */}
                <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="px-5 h-12 rounded-xl text-xs font-bold text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer border-none"
                  >
                    Keep Order
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 h-12 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-red-600/20 disabled:opacity-50 border-none"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Processing Cancellation...
                      </>
                    ) : (
                      <>
                        <RotateCcw className="w-4 h-4" />
                        {isPaid ? `Cancel & Refund ₦${netRefundAmount.toLocaleString()}` : "Confirm Order Cancellation"}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
