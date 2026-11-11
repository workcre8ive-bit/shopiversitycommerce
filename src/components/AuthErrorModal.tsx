import React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { AlertCircle, Truck, ShoppingBag, UserX, UserCheck, X, ArrowRight } from "lucide-react";

export interface AuthErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "logistics_mismatch" | "buyer_seller_mismatch" | "email_in_use" | "profile_missing" | "google_account_no_password" | "generic";
  title: string;
  message: string;
  email?: string;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

export default function AuthErrorModal({
  isOpen,
  onClose,
  type,
  title,
  message,
  email,
  primaryActionLabel,
  onPrimaryAction,
  secondaryActionLabel = "Dismiss",
  onSecondaryAction,
}: AuthErrorModalProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const getIcon = () => {
    switch (type) {
      case "google_account_no_password":
        return (
          <svg className="w-7 h-7 sm:w-8 sm:h-8" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
        );
      case "logistics_mismatch":
        return <Truck className="w-7 h-7 sm:w-8 sm:h-8 text-orange-600 dark:text-orange-400" />;
      case "buyer_seller_mismatch":
        return <ShoppingBag className="w-7 h-7 sm:w-8 sm:h-8 text-amber-600 dark:text-amber-400" />;
      case "email_in_use":
        return <UserX className="w-7 h-7 sm:w-8 sm:h-8 text-red-600 dark:text-red-400" />;
      case "profile_missing":
        return <UserCheck className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400" />;
      default:
        return <AlertCircle className="w-7 h-7 sm:w-8 sm:h-8 text-orange-600 dark:text-orange-400" />;
    }
  };

  const getBadgeColors = () => {
    switch (type) {
      case "google_account_no_password":
        return "bg-blue-100 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300";
      case "logistics_mismatch":
        return "bg-orange-100 dark:bg-orange-950/60 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300";
      case "buyer_seller_mismatch":
        return "bg-amber-100 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300";
      case "email_in_use":
        return "bg-red-100 dark:bg-red-950/60 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300";
      case "profile_missing":
        return "bg-blue-100 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300";
      default:
        return "bg-orange-100 dark:bg-orange-950/60 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300";
    }
  };

  const getSubheadTag = () => {
    switch (type) {
      case "google_account_no_password":
        return "GOOGLE ACCOUNT • NO PASSWORD REQUIRED";
      case "logistics_mismatch":
        return "LOGISTICS ACCOUNT CONFLICT";
      case "buyer_seller_mismatch":
        return "BUYER / SELLER CONFLICT";
      case "email_in_use":
        return "DUPLICATE ACCOUNT DETECTED";
      case "profile_missing":
        return "ACCOUNT EXISTS • PROFILE MISSING";
      default:
        return "AUTHENTICATION NOTICE";
    }
  };

  const modalContent = (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[999999] overflow-y-auto overscroll-contain flex flex-col items-center justify-start p-3 sm:p-4 pt-3 sm:pt-4 md:pt-6"
        role="dialog"
        aria-modal="true"
      >
        {/* Backdrop covering entire screen */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Card - positioned UP at top of viewport, fully visible without scrolling or cut-off */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -20 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="relative w-full max-w-md my-0 bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-zinc-800 p-5 sm:p-6 shadow-2xl z-10 text-center space-y-3.5"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer border-none z-20"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Top visual accent glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 sm:w-36 h-1.5 bg-gradient-to-r from-[#ff6b00] to-amber-500 rounded-b-full pointer-events-none" />

          {/* Icon Badge */}
          <div className="flex justify-center pt-2">
            <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center border shadow-sm ${getBadgeColors()}`}>
              {getIcon()}
            </div>
          </div>

          {/* Heading & Tag */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 inline-block">
              {getSubheadTag()}
            </span>
            <h3 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-snug break-words">
              {title}
            </h3>
          </div>

          {/* Email badge if provided */}
          {email && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/50 max-w-full">
              <span className="text-xs font-mono font-bold text-orange-700 dark:text-orange-400 truncate break-all max-w-[280px] sm:max-w-[340px]">
                {email}
              </span>
            </div>
          )}

          {/* Explanatory Message - fully displayed with break-words */}
          <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 font-medium leading-relaxed px-1 sm:px-2 break-words">
            {message}
          </p>

          {/* Actions */}
          <div className="pt-2 space-y-2 shrink-0">
            {primaryActionLabel && onPrimaryAction && (
              <button
                onClick={() => {
                  onPrimaryAction();
                  onClose();
                }}
                className="w-full h-11 sm:h-12 bg-gradient-to-r from-[#ff6b00] to-[#ff8c00] hover:from-[#ea6200] hover:to-[#ff7b00] active:scale-[0.98] text-white rounded-xl font-black text-xs sm:text-sm tracking-wide shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer border-none"
              >
                <span>{primaryActionLabel}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => {
                if (onSecondaryAction) {
                  onSecondaryAction();
                }
                onClose();
              }}
              className="w-full py-2.5 text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white text-xs font-bold transition-colors cursor-pointer bg-transparent border-none"
            >
              {secondaryActionLabel}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
