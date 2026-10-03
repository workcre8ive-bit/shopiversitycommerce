import React from "react";
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
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case "logistics_mismatch":
        return <Truck className="w-8 h-8 text-orange-600 dark:text-orange-400" />;
      case "buyer_seller_mismatch":
        return <ShoppingBag className="w-8 h-8 text-amber-600 dark:text-amber-400" />;
      case "email_in_use":
        return <UserX className="w-8 h-8 text-red-600 dark:text-red-400" />;
      default:
        return <AlertCircle className="w-8 h-8 text-orange-600 dark:text-orange-400" />;
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

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[350] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/65 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-[2rem] border border-slate-200 dark:border-zinc-800 p-6 sm:p-8 shadow-2xl z-10 text-center space-y-5 overflow-hidden"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer border-none"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Top visual accent glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-2 bg-gradient-to-r from-[#ff6b00] to-amber-500 rounded-b-full" />

          {/* Icon Badge */}
          <div className="flex justify-center pt-2">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border shadow-sm ${getBadgeColors()}`}>
              {getIcon()}
            </div>
          </div>

          {/* Heading & Tag */}
          <div className="space-y-2">
            <span className="text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 inline-block">
              {getSubheadTag()}
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              {title}
            </h3>
          </div>

          {/* Email badge if provided */}
          {email && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 max-w-full">
              <span className="text-xs font-mono font-bold text-orange-700 dark:text-orange-400 truncate">
                {email}
              </span>
            </div>
          )}

          {/* Explanatory Message */}
          <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 font-medium leading-relaxed px-2">
            {message}
          </p>

          {/* Actions */}
          <div className="pt-2 space-y-2.5">
            {primaryActionLabel && onPrimaryAction && (
              <button
                onClick={() => {
                  onPrimaryAction();
                  onClose();
                }}
                className="w-full h-12 bg-gradient-to-r from-[#ff6b00] to-[#ff8c00] hover:from-[#ea6200] hover:to-[#ff7b00] active:scale-[0.98] text-white rounded-xl font-black text-xs sm:text-sm tracking-wide shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer border-none"
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
}
