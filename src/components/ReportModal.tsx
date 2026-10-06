import React from "react";
import { 
  X, 
  AlertTriangle, 
  Send, 
  Loader2, 
  CheckCircle, 
  Lock, 
  ShieldCheck, 
  ShoppingBag, 
  Truck, 
  CreditCard, 
  PackageX, 
  AlertCircle,
  HelpCircle,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { auth, db } from "../firebase";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { handleFirestoreError, OperationType } from "../lib/firebase-errors";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendorId: string;
  vendorName: string;
  productId?: string;
  productName?: string;
  hasPurchased?: boolean;
}

export interface ReportReasonItem {
  id: string;
  category: "listing" | "purchase";
  label: string;
  description: string;
  iconType: "alert" | "truck" | "card" | "package";
}

const LISTING_REASONS: ReportReasonItem[] = [
  {
    id: "scam_listing",
    category: "listing",
    label: "Counterfeit, fake brand, or scam listing",
    description: "Suspected fake item, non-existent inventory, or fraudulent merchant listing.",
    iconType: "alert"
  },
  {
    id: "misleading_info",
    category: "listing",
    label: "Misleading price, inaccurate photos, or false description",
    description: "Product specifications, photos, or advertised condition do not match reality.",
    iconType: "alert"
  },
  {
    id: "prohibited_item",
    category: "listing",
    label: "Illegal, dangerous, or prohibited campus item",
    description: "Item violates university guidelines, campus safety regulations, or laws.",
    iconType: "alert"
  },
  {
    id: "inappropriate_content",
    category: "listing",
    label: "Inappropriate content or offensive behavior",
    description: "Contains offensive imagery, profanity, harassment, or abusive remarks.",
    iconType: "alert"
  },
  {
    id: "incorrect_category",
    category: "listing",
    label: "Incorrect category or spam duplicate",
    description: "Spam listing repeatedly posted or placed in the wrong marketplace category.",
    iconType: "alert"
  },
  {
    id: "other_listing",
    category: "listing",
    label: "Other listing or merchant violation",
    description: "Another general issue regarding this product listing or storefront.",
    iconType: "alert"
  }
];

const PURCHASE_REASONS: ReportReasonItem[] = [
  {
    id: "non_delivery",
    category: "purchase",
    label: "Item not received / Non-delivery after payment",
    description: "Payment was completed via Escrow, but the seller failed to deliver or provide the goods.",
    iconType: "truck"
  },
  {
    id: "payment_escrow_issue",
    category: "purchase",
    label: "Payment deducted / Escrow fulfillment dispute",
    description: "Payment was processed, but the merchant refused handover or canceled without refund.",
    iconType: "card"
  },
  {
    id: "damaged_defective",
    category: "purchase",
    label: "Damaged, defective, or broken item received after delivery",
    description: "The item was received upon delivery, but arrived broken, defective, or non-functional.",
    iconType: "package"
  },
  {
    id: "wrong_item_delivered",
    category: "purchase",
    label: "Wrong product or missing accessories delivered",
    description: "Delivered package contained an entirely different item or missing essential parts.",
    iconType: "package"
  },
  {
    id: "handover_refusal",
    category: "purchase",
    label: "Seller refused physical handover after order payment",
    description: "Merchant accepted payment but refused to complete the campus handover or meetup.",
    iconType: "truck"
  },
  {
    id: "courier_tampered",
    category: "purchase",
    label: "Delivery package tampered with / Courier dispute",
    description: "The package was visibly opened, tampered with, or stolen in transit by dispatch.",
    iconType: "truck"
  }
];

export default function ReportModal({
  isOpen,
  onClose,
  vendorId,
  vendorName,
  productId,
  productName,
  hasPurchased
}: ReportModalProps) {
  const [selectedReason, setSelectedReason] = React.useState<string>("");
  const [customDetails, setCustomDetails] = React.useState<string>("");
  const [loading, setLoading] = React.useState<boolean>(false);
  const [success, setSuccess] = React.useState<boolean>(false);
  const [isBuyerVerified, setIsBuyerVerified] = React.useState<boolean>(hasPurchased ?? false);
  const [checkingPurchase, setCheckingPurchase] = React.useState<boolean>(false);
  const [matchedOrderId, setMatchedOrderId] = React.useState<string | null>(null);
  const [deactivatedWarning, setDeactivatedWarning] = React.useState<string | null>(null);

  // Check if current user has purchased this product
  React.useEffect(() => {
    if (!isOpen) {
      setSelectedReason("");
      setCustomDetails("");
      setDeactivatedWarning(null);
      return;
    }

    if (hasPurchased !== undefined) {
      setIsBuyerVerified(hasPurchased);
    }

    const checkBuyerOrders = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser || !productId) {
        if (hasPurchased === undefined) setIsBuyerVerified(false);
        return;
      }

      setCheckingPurchase(true);
      try {
        const q = query(
          collection(db, "orders"),
          where("buyerId", "==", currentUser.uid)
        );
        const snapshot = await getDocs(q);
        const matchingOrder = snapshot.docs.find(docSnap => {
          const data = docSnap.data();
          const directMatch = data.productId === productId;
          const itemsMatch = Array.isArray(data.items) && data.items.some((it: any) => it.id === productId || it.productId === productId);
          return directMatch || itemsMatch;
        });

        if (matchingOrder) {
          setIsBuyerVerified(true);
          setMatchedOrderId(matchingOrder.id);
        } else if (hasPurchased === undefined) {
          setIsBuyerVerified(false);
          setMatchedOrderId(null);
        }
      } catch (err) {
        console.warn("Could not check buyer order history for report:", err);
      } finally {
        setCheckingPurchase(false);
      }
    };

    checkBuyerOrders();
  }, [isOpen, productId, hasPurchased]);

  const handleSelectReason = (item: ReportReasonItem) => {
    if (item.category === "purchase" && !isBuyerVerified) {
      setDeactivatedWarning(
        `"${item.label}" is deactivated because you have not bought this product. Payment, escrow, and after-delivery reports are exclusively for buyers who completed an order.`
      );
      return;
    }

    setDeactivatedWarning(null);
    setSelectedReason(item.label);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setDeactivatedWarning("Please sign in to submit a report.");
      return;
    }

    if (!selectedReason.trim()) {
      setDeactivatedWarning("Please select a report reason.");
      return;
    }

    const isPurchaseCategory = PURCHASE_REASONS.some(r => r.label === selectedReason);
    if (isPurchaseCategory && !isBuyerVerified) {
      setDeactivatedWarning("Payment and delivery reasons are deactivated for non-buyers. Please choose an active listing violation reason.");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "reports"), {
        // Reporter information
        reporterId: currentUser.uid,
        reporterName: currentUser.displayName || "Marketplace User",
        reporterEmail: currentUser.email || "No email",

        // Reported party information
        vendorId,
        vendorName: vendorName || "Unknown Vendor",
        reportedUserId: vendorId,
        reportedUserName: vendorName || "Unknown Vendor",

        // Product information
        productId: productId || null,
        productName: productName || (productId ? "Product Listing" : null),

        // Report details & categorization
        reason: selectedReason.trim(),
        details: customDetails.trim() || selectedReason.trim(),
        isVerifiedBuyer: isBuyerVerified,
        orderId: matchedOrderId || null,
        reportCategory: isPurchaseCategory ? "purchase_and_delivery_dispute" : "listing_violation",

        status: "pending",
        createdAt: new Date().toISOString(),
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setSelectedReason("");
        setCustomDetails("");
        setDeactivatedWarning(null);
        onClose();
      }, 2200);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "reports");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-3.5 sm:p-4 overscroll-contain">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 15 }}
            transition={{ type: "spring", stiffness: 350, damping: 26 }}
            className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-zinc-800 my-auto max-h-[92vh] flex flex-col"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-2xl flex items-center justify-center text-red-600 shrink-0 shadow-sm">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-zinc-100 leading-tight">
                    {productId ? "Report Product Listing" : "Report Vendor"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 truncate max-w-[240px] sm:max-w-xs">
                    {productName ? `${productName} • ${vendorName}` : vendorName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {success ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-200 dark:border-emerald-800 rounded-full flex items-center justify-center mx-auto shadow-md animate-bounce">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h4 className="text-xl font-black text-slate-900 dark:text-zinc-100">Report Successfully Submitted</h4>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-xs mx-auto leading-relaxed">
                    Our campus moderation and escrow team will review this report within 24 hours to ensure marketplace safety.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5 text-left font-sans">
                  {/* Buyer Verification Status Banner */}
                  {checkingPurchase ? (
                    <div className="p-3 bg-slate-50 dark:bg-zinc-800/60 rounded-xl flex items-center gap-2 text-xs text-slate-500 animate-pulse">
                      <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                      <span>Verifying your purchase history for this product...</span>
                    </div>
                  ) : isBuyerVerified ? (
                    <div className="p-3.5 bg-emerald-50/90 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl flex items-start gap-3">
                      <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black text-emerald-900 dark:text-emerald-300">
                            Verified Buyer of this Product
                          </span>
                          <span className="text-[10px] bg-emerald-200/80 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wider">
                            Purchase Confirmed
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-700 dark:text-emerald-400 leading-snug">
                          All payment, non-delivery, damaged goods, and post-delivery dispute options are <strong>activated</strong>.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-2xl flex items-start gap-3">
                      <div className="w-7 h-7 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                        <Lock className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black text-amber-900 dark:text-amber-300">
                            Buyer Status: Not Purchased
                          </span>
                          <span className="text-[10px] bg-amber-200/80 dark:bg-amber-900 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wider">
                            Browsing Mode
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-800 dark:text-amber-400 leading-snug">
                          You have not bought this product. Reasons regarding <strong>payment or after-delivery reports are deactivated</strong>. You can still report listing & content violations below.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Deactivated Warning Toast / Alert */}
                  {deactivatedWarning && (
                    <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-start gap-2 animate-in fade-in">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <span>{deactivatedWarning}</span>
                    </div>
                  )}

                  {/* Quick Dropdown Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
                      Select Primary Reason:
                    </label>
                    <select
                      value={selectedReason}
                      onChange={(e) => {
                        const val = e.target.value;
                        const isPurchase = PURCHASE_REASONS.some(pr => pr.label === val);
                        if (isPurchase && !isBuyerVerified) {
                          setDeactivatedWarning(`"${val}" is deactivated for non-buyers. Payment and delivery issues require a verified purchase record.`);
                          return;
                        }
                        setDeactivatedWarning(null);
                        setSelectedReason(val);
                      }}
                      className="w-full h-11 px-3.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-slate-800 dark:text-zinc-100 font-semibold text-xs cursor-pointer"
                    >
                      <option value="">-- Choose a report reason --</option>
                      
                      <optgroup label="📋 Listing & Merchant Violations (Active for All Users)">
                        {LISTING_REASONS.map(r => (
                          <option key={r.id} value={r.label}>
                            {r.label}
                          </option>
                        ))}
                      </optgroup>

                      <optgroup label={isBuyerVerified ? "📦 Payment, Delivery & Fulfillment (Active for Verified Buyer)" : "🔒 Payment & After-Delivery (DEACTIVATED - Requires Purchase)"}>
                        {PURCHASE_REASONS.map(r => (
                          <option 
                            key={r.id} 
                            value={r.label}
                            disabled={!isBuyerVerified}
                            className={!isBuyerVerified ? "text-slate-400 italic bg-slate-100 dark:bg-zinc-800" : ""}
                          >
                            {!isBuyerVerified ? `🔒 [DEACTIVATED] ${r.label}` : `✓ ${r.label}`}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  {/* Categorized Visual Reason Options Cards */}
                  <div className="space-y-4 pt-1">
                    {/* SECTION 1: Listing & Content Options (Always Active) */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
                          Listing & Policy Violations
                        </span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold uppercase">
                          Active for all
                        </span>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {LISTING_REASONS.map((item) => {
                          const isSelected = selectedReason === item.label;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => handleSelectReason(item)}
                              className={`w-full p-3 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                                isSelected
                                  ? "bg-purple-50 dark:bg-purple-950/40 border-purple-500 ring-1 ring-purple-500 shadow-sm"
                                  : "bg-slate-50/70 dark:bg-zinc-800/60 border-slate-200 dark:border-zinc-700/80 hover:border-slate-300 dark:hover:border-zinc-600"
                              }`}
                            >
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                                isSelected ? "border-purple-600 bg-purple-600 text-white" : "border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-900"
                              }`}>
                                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                              </div>
                              <div className="flex-1">
                                <p className="text-xs font-bold text-slate-900 dark:text-zinc-100 leading-tight">
                                  {item.label}
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 leading-snug">
                                  {item.description}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* SECTION 2: Payment & Delivery Options (Activated for buyers, Deactivated for non-buyers) */}
                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5 text-blue-500" />
                          Payment & Post-Delivery Disputes
                        </span>
                        {isBuyerVerified ? (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold uppercase bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                            ✓ Activated (Buyer)
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-700 dark:text-amber-300 font-extrabold uppercase bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" /> Deactivated
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-2">
                        {PURCHASE_REASONS.map((item) => {
                          const isSelected = selectedReason === item.label;
                          const isDeactivated = !isBuyerVerified;

                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => handleSelectReason(item)}
                              disabled={isDeactivated}
                              className={`w-full p-3 rounded-xl border text-left transition-all flex items-start gap-3 ${
                                isDeactivated
                                  ? "bg-slate-100/60 dark:bg-zinc-850/40 border-slate-200/60 dark:border-zinc-800 opacity-60 cursor-not-allowed select-none"
                                  : isSelected
                                  ? "bg-blue-50 dark:bg-blue-950/40 border-blue-500 ring-1 ring-blue-500 shadow-sm cursor-pointer"
                                  : "bg-slate-50/70 dark:bg-zinc-800/60 border-slate-200 dark:border-zinc-700/80 hover:border-slate-300 dark:hover:border-zinc-600 cursor-pointer"
                              }`}
                            >
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                                isDeactivated
                                  ? "border-slate-300 dark:border-zinc-700 bg-slate-200/50 dark:bg-zinc-800 text-slate-400"
                                  : isSelected
                                  ? "border-blue-600 bg-blue-600 text-white"
                                  : "border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-900"
                              }`}>
                                {isDeactivated ? (
                                  <Lock className="w-2.5 h-2.5" />
                                ) : isSelected ? (
                                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                ) : null}
                              </div>

                              <div className="flex-1">
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <p className={`text-xs font-bold leading-tight ${
                                    isDeactivated ? "text-slate-500 dark:text-zinc-500" : "text-slate-900 dark:text-zinc-100"
                                  }`}>
                                    {item.label}
                                  </p>
                                  {isDeactivated && (
                                    <span className="text-[9px] font-black uppercase text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950 px-1.5 py-0.5 rounded">
                                      Buyers Only
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 leading-snug">
                                  {item.description}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Detailed Description Textarea */}
                  <div className="space-y-1.5 pt-1">
                    <label className="text-xs font-black text-slate-700 dark:text-zinc-300 uppercase tracking-wider flex items-center justify-between">
                      <span>Additional Report Details:</span>
                      <span className="text-[10px] text-slate-400 font-normal">Optional specifics</span>
                    </label>
                    <textarea
                      rows={3}
                      value={customDetails}
                      onChange={(e) => setCustomDetails(e.target.value)}
                      placeholder="Explain what occurred in detail so our moderators can investigate and take action..."
                      className="w-full p-3.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl focus:bg-white dark:focus:bg-zinc-900 focus:border-purple-500 outline-none transition-all resize-none text-slate-900 dark:text-white text-xs placeholder:text-slate-400"
                    />
                  </div>

                  {/* Submit and Cancel Buttons */}
                  <div className="pt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 h-12 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={loading || !selectedReason.trim()}
                      className="flex-[2] h-12 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-xl transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-40 disabled:scale-100 cursor-pointer text-xs"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Submit Official Report</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
