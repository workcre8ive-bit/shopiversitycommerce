import React from "react";
import { 
  X, 
  RefreshCw, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  FileText, 
  Lock,
  ArrowRight,
  HelpCircle,
  Truck
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Logo from "./Logo";

interface ReturnPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewOrders?: () => void;
}

export default function ReturnPolicyModal({ isOpen, onClose, onViewOrders }: ReturnPolicyModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[220] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 15 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="relative w-full max-w-2xl max-h-[90vh] bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden flex flex-col z-10"
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 p-5 sm:p-6 text-white shrink-0 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none" />
              
              <div className="flex items-center justify-between gap-3 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white/15 backdrop-blur-md rounded-2xl border border-white/20 shadow-md">
                    <RefreshCw className="w-6 h-6 text-white animate-spin-slow" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-black tracking-widest bg-white/20 text-white px-2 py-0.5 rounded-full border border-white/20">
                        Buyer Safeguard
                      </span>
                      <Logo showText={false} className="scale-75" />
                    </div>
                    <h2 className="text-lg sm:text-xl font-black tracking-tight text-white mt-0.5">
                      Worry-Free Return & Refund Policy
                    </h2>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 bg-white/15 hover:bg-white/25 rounded-full text-white transition-all cursor-pointer border-none shrink-0"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Modal Content */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-slate-800 dark:text-zinc-200 text-xs sm:text-sm leading-relaxed">
              
              {/* Escrow Banner */}
              <div className="p-4 sm:p-5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl flex items-start gap-3.5 shadow-sm">
                <div className="p-2 bg-emerald-500 text-white rounded-xl shrink-0 mt-0.5 shadow-md">
                  <Lock className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-black text-emerald-900 dark:text-emerald-200 text-sm sm:text-base flex items-center gap-2">
                    100% Escrow Lockbox Guarantee
                  </h3>
                  <p className="text-emerald-800 dark:text-emerald-300 text-xs font-medium leading-relaxed">
                    When you place an order on SHOPIVERSITY, your payment is held securely in our Escrow Lockbox. The seller does <strong>NOT</strong> receive funds until you inspect and approve the item or service!
                  </p>
                </div>
              </div>

              {/* 4 Pillars Grid */}
              <div>
                <h4 className="font-extrabold text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-orange-500" />
                  Our 4-Step Protection Safeguards
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/60 rounded-2xl space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-xs">
                      <Clock className="w-4 h-4 text-orange-500 shrink-0" />
                      <span>24-48 Hr Inspection Period</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                      Take time to test electronics, check textbook pages, or verify clothing fit before releasing payment.
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/60 rounded-2xl space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-xs">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>1-Click Dispute Trigger</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                      Report damaged, wrong, or unfulfilled goods directly from your Buyer Order tab to freeze escrow instantly.
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/60 rounded-2xl space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-xs">
                      <Truck className="w-4 h-4 text-blue-500 shrink-0" />
                      <span>Free Campus Return Courier</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                      Verified campus dispatchers pick up return items directly from your hostel or lecture hall.
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/60 rounded-2xl space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Fast Refund Credit</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                      Once dispute is verified, 100% of your funds are credited back to your wallet or bank account within 24 hours.
                    </p>
                  </div>
                </div>
              </div>

              {/* Refund Eligibility */}
              <div className="p-4 bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/40 rounded-2xl space-y-2.5">
                <h4 className="font-extrabold text-orange-900 dark:text-orange-200 text-xs uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-orange-600" />
                  Eligible Reasons for Full Refund
                </h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-orange-950 dark:text-orange-200 font-medium">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                    <span>Item arrived broken, torn, or non-functional</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                    <span>Wrong product, size, or color sent</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                    <span>Significant difference from photos or specs</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                    <span>Order not delivered past scheduled timeline</span>
                  </li>
                </ul>
              </div>

              {/* How to initiate return steps */}
              <div className="p-4 bg-slate-50 dark:bg-zinc-800/80 rounded-2xl border border-slate-200 dark:border-zinc-700 space-y-2.5">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-orange-500" />
                  How to Request a Return or Dispute:
                </h4>
                <ol className="list-decimal pl-4 space-y-1.5 text-xs text-slate-600 dark:text-zinc-300 font-medium">
                  <li>Navigate to your <strong>Buyer Dashboard &gt; My Orders</strong>.</li>
                  <li>Click on the order you wish to return and tap <strong>&quot;Request Refund / File Dispute&quot;</strong>.</li>
                  <li>Provide a brief photo or description of the discrepancy.</li>
                  <li>The SHOPIVERSITY Campus Mediation Team will review and process your refund within 24 hours.</li>
                </ol>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 bg-slate-50 dark:bg-zinc-950 border-t border-slate-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium text-center sm:text-left">
                Protected by SHOPIVERSITY Escrow Safeguards & Terms of Service.
              </p>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                {onViewOrders && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onViewOrders();
                    }}
                    className="flex-1 sm:flex-initial px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-orange-500/10 border-none"
                  >
                    <span>View My Orders</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
                
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 rounded-xl text-xs font-bold transition-all cursor-pointer border-none"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
