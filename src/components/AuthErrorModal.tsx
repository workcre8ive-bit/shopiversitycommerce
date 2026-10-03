import React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { AlertCircle, Truck, ShoppingBag, UserX, X, ArrowRight } from "lucide-react";

export interface AuthErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "logistics_mismatch" | "buyer_seller_mismatch" | "email_in_use" | "generic";
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
      case "logistics_mismatch":
        return <Truck className="w-7 h-7 sm:w-8 sm:h-8 text-orange-600 dark:text-orange-400" />;
      case "buyer_seller_mismatch":
        return <ShoppingBag className="w-7 h-7 sm:w-8 sm:h-8 text-amber-600 dark:text-amber-400" />;
      case "email_in_use":
        return <UserX className="w-7 h-7 sm:w-8 sm:h-8 text-red-600 dark:text-red-400" />;
      default:
        return <AlertCircle className="w-7 h-7 sm:w-8 sm:h-8 text-orange-600 dark:text-orange-400" />;
    }
  };

  const getBadgeColors = () => {
    switch (type) {
      case "logistics_mismatch":
        return "bg-orange-100 dark:bg-orange-950/60 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300";
      case "buyer_seller_mismatch":
        return "bg-amber-100 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300";
      case "email_in_use":
        return "bg-red-100 dark:bg-red-950/60 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300";
      default:
        return "bg-orange-100 dark:bg-orange-950/60 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300";
    }
  };

  const getSubheadTag = () => {
    switch (type) {
      case "logistics_mismatch":
        return "LOGISTICS ACCOUNT CONFLICT";
      case "buyer_seller_mismatch":
        return "BUYER / SELLER CONFLICT";
      case "email_in_use":
        return "DUPLICATE ACCOUNT DETECTED";
      default:
        return "AUTHENTICATION NOTICE";
    }
  };

  const modalContent = (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[999999] overflow-y-auto overscroll-contain flex flex-col items-center justify-center p-3.5 sm:p-6"
        role="dialog"
        aria-modal="true"
      >
        {/* Backdrop covering entire screen */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-md"
        />

        {/* Modal Card - fully visible, self-centering, never truncated */}
        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 15 }}
          transition={{ type: "spring", stiffness: 350, damping: 26 }}
          className="relative w-full max-w-md my-auto bg-white dark:bg-zinc-900 rounded-[2rem] border border-slate-200 dark:border-zinc-800 p-5 sm:p-7 shadow-2xl z-10 text-center space-y-4 max-h-[calc(100vh-2rem)] overflow-y-auto"
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
