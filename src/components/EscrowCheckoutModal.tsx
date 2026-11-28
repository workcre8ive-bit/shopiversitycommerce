import React from "react";
import { createPortal } from "react-dom";
import {
  ShieldCheck,
  X,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Clock,
  Lock,
  Landmark,
  AlertTriangle
} from "lucide-react";
import { cn } from "../lib/utils";

export interface EscrowSessionDetails {
  orderId: string;
  uniqueOrderId?: string;
  transactionId: string;
  reference: string;
  environment: "test" | "live";
  isTestTransaction: boolean;
  amountNgn: number;
  currency?: string;
  checkoutUrl?: string | null;
  checkoutSessionId?: string | null;
  virtualAccount?: {
    accountNumber?: string;
    bankName?: string;
    accountName?: string;
    expiresAt?: string;
    expectedAmount?: number;
  } | null;
  returnUrl: string;
}

interface EscrowCheckoutModalProps {
  isOpen: boolean;
  session: EscrowSessionDetails | null;
  onClose: () => void;
  onProceedToReturnCheck: (returnUrl: string) => void;
}

export default function EscrowCheckoutModal({
  isOpen,
  session,
  onClose,
  onProceedToReturnCheck
}: EscrowCheckoutModalProps) {
  const [copiedField, setCopiedField] = React.useState<string | null>(null);

  const isInIframe = React.useMemo(() => {
    try {
      return typeof window !== "undefined" && window.self !== window.top;
    } catch {
      return true;
    }
  }, []);

  React.useEffect(() => {
    if (!isOpen || !session || typeof document === "undefined") return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, session, onClose]);

  if (!isOpen || !session || typeof document === "undefined") return null;

  const copyValue = (key: string, val: string) => {
    if (!val) return;
    navigator.clipboard?.writeText(val).catch(() => {});
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 1800);
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-slate-950/75 backdrop-blur-sm p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="escrow-checkout-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="relative w-full sm:max-w-lg bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[90dvh] animate-in fade-in slide-in-from-bottom-4 duration-200">
        {/* Top Accent Strip */}
        <div className="h-1.5 w-full bg-[#ff6b00] shrink-0" />

        {/* Sticky Header */}
        <div className="px-5 pt-4 pb-3.5 sm:px-6 sm:pt-5 sm:pb-4 border-b border-slate-100 dark:border-zinc-800 flex items-start justify-between gap-3 shrink-0 bg-white dark:bg-zinc-900">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200/80 dark:border-orange-900/60 flex items-center justify-center text-[#ff6b00] shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="min-w-0 text-left">
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  id="escrow-checkout-title"
                  className="text-base sm:text-lg font-extrabold font-display text-slate-900 dark:text-white tracking-tight"
                >
                  Direct Payment Checkout
                </h2>
                {session.isTestTransaction && (
                  <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 text-[10px] font-black uppercase tracking-wider shrink-0">
                    Sandbox Test Mode
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 truncate">
                Order {session.uniqueOrderId || session.orderId} · Protected by EscrowPay
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0 border-none bg-transparent"
            aria-label="Close payment checkout modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 overscroll-contain text-left">
          {session.isTestTransaction && (
            <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 p-3.5 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                This session is running in <strong>EscrowPay Sandbox (Test Mode)</strong>. Your order remains in <strong>Payment Processing</strong> until EscrowPay confirms sandbox funding via authenticated verification or webhook.
              </p>
            </div>
          )}

          {/* Amount & Reference Ledger */}
          <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 divide-y divide-slate-100 dark:divide-zinc-800 text-sm bg-slate-50/60 dark:bg-zinc-950/40">
            <div className="px-4 py-3 flex items-center justify-between gap-4">
              <span className="text-slate-500 dark:text-zinc-400 shrink-0">Amount Due</span>
              <span className="text-lg font-black text-[#ff6b00] tabular-nums">
                ₦{Number(session.amountNgn || 0).toLocaleString("en-NG")}
              </span>
            </div>

            <div className="px-4 py-3 flex items-center justify-between gap-3">
              <span className="text-slate-500 dark:text-zinc-400 shrink-0 text-xs sm:text-sm">
                Transaction ID
              </span>
              <div className="flex items-center gap-1.5 min-w-0 justify-end">
                <span className="font-mono text-xs font-semibold text-slate-900 dark:text-zinc-100 break-all text-right tabular-nums">
                  {session.transactionId}
                </span>
                <button
                  type="button"
                  onClick={() => copyValue("tx", session.transactionId)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-[#ff6b00] cursor-pointer shrink-0 border-none bg-transparent"
                  aria-label="Copy transaction ID"
                >
                  {copiedField === "tx" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="px-4 py-3 flex items-center justify-between gap-3">
              <span className="text-slate-500 dark:text-zinc-400 shrink-0 text-xs sm:text-sm">
                Reference
              </span>
              <div className="flex items-center gap-1.5 min-w-0 justify-end">
                <span className="font-mono text-xs font-semibold text-slate-900 dark:text-zinc-100 break-all text-right tabular-nums">
                  {session.reference}
                </span>
                <button
                  type="button"
                  onClick={() => copyValue("ref", session.reference)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-[#ff6b00] cursor-pointer shrink-0 border-none bg-transparent"
                  aria-label="Copy payment reference"
                >
                  {copiedField === "ref" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Dedicated Virtual Bank Account Transfer Details (when returned by EscrowPay) */}
          {session.virtualAccount?.accountNumber && (
            <div className="rounded-2xl border border-orange-200 dark:border-orange-900/50 bg-orange-50/50 dark:bg-orange-950/20 p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#ff6b00]">
                <Landmark className="w-4 h-4 shrink-0" />
                <span>Direct Escrow Bank Transfer Account</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div>
                  <span className="text-slate-500 dark:text-zinc-400 block">Bank Name</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {session.virtualAccount.bankName || "EscrowPay Partner Bank"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-zinc-400 block">Account Number</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-sm font-black text-slate-900 dark:text-white tabular-nums">
                      {session.virtualAccount.accountNumber}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyValue("acct", session.virtualAccount?.accountNumber || "")}
                      className="p-1 rounded text-slate-400 hover:text-[#ff6b00] cursor-pointer border-none bg-transparent"
                      aria-label="Copy account number"
                    >
                      {copiedField === "acct" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                {session.virtualAccount.accountName && (
                  <div className="sm:col-span-2">
                    <span className="text-slate-500 dark:text-zinc-400 block">Account Name</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {session.virtualAccount.accountName}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-1">
            {session.checkoutUrl && (
              <a
                href={session.checkoutUrl}
                target={isInIframe ? "_blank" : "_self"}
                rel="noopener noreferrer"
                className="w-full h-12 px-5 bg-[#ff6b00] hover:bg-[#e55f00] text-white font-bold text-sm rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 no-underline"
              >
                <Lock className="w-4 h-4 shrink-0" />
                <span>Pay Directly Now (EscrowPay)</span>
                <ExternalLink className="w-4 h-4 shrink-0" />
              </a>
            )}

            {!session.checkoutUrl && !session.virtualAccount?.accountNumber && (
              <div className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/70 dark:bg-amber-950/25 p-3.5 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                EscrowPay created transaction <strong className="font-mono break-all">{session.transactionId}</strong>, but did not return a hosted checkout link or temporary virtual account for this origin yet. Ensure your site domain is allowlisted in your EscrowPay dashboard, then use the button below to verify status.
              </div>
            )}

            <button
              type="button"
              onClick={() => onProceedToReturnCheck(session.returnUrl)}
              className={cn(
                "w-full h-12 px-5 font-bold text-sm rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer border-none",
                session.checkoutUrl
                  ? "bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/30 dark:hover:bg-orange-950/50 text-[#ff6b00] border border-orange-200 dark:border-orange-900/50"
                  : "bg-[#ff6b00] hover:bg-[#e55f00] text-white shadow-sm"
              )}
            >
              <RefreshCw className="w-4 h-4 shrink-0" />
              <span>Verify Payment Status</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full h-11 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 font-semibold text-xs rounded-2xl transition-colors cursor-pointer border-none"
            >
              Keep Order in Processing &amp; View Later
            </button>
          </div>

          <div className="flex items-start gap-2 text-[11px] text-slate-500 dark:text-zinc-400 pt-2 border-t border-slate-100 dark:border-zinc-800">
            <Clock className="w-3.5 h-3.5 text-[#ff6b00] shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Your direct payment is protected through EscrowPay and stays in <strong>Payment Processing</strong> until EscrowPay confirms funding via backend verification.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
