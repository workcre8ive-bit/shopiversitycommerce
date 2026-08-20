import React from "react";
import { CheckCircle2, Star, Sparkles, X, ThumbsUp, MessageSquareHeart } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ReviewSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  rating?: number;
  productName?: string;
  comment?: string;
}

export default function ReviewSuccessModal({
  isOpen,
  onClose,
  rating = 5,
  productName,
  comment,
}: ReviewSuccessModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div id="review-success-modal-container" className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl border border-slate-100 dark:border-slate-800 text-center overflow-hidden z-10"
          >
            {/* Top decorative glow */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-gradient-to-b from-emerald-400/20 to-orange-400/0 rounded-full blur-2xl pointer-events-none" />

            {/* Close Button */}
            <button
              id="close-review-success-modal-btn"
              onClick={onClose}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Animated Icon Badge */}
            <div className="relative mx-auto w-20 h-20 mb-6 flex items-center justify-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 260, damping: 20 }}
                className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center"
              >
                <div className="w-full h-full bg-emerald-50 dark:bg-slate-900 rounded-[22px] flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                </div>
              </motion.div>
              <motion.div
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.25, type: "spring" }}
                className="absolute -top-1 -right-1 w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center text-white shadow-md"
              >
                <Sparkles className="w-4 h-4" />
              </motion.div>
            </div>

            {/* Title & Description */}
            <motion.h3
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-2xl font-black text-slate-900 dark:text-white tracking-tight"
            >
              Review Submitted!
            </motion.h3>

            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium"
            >
              Thank you for your feedback! Your review helps build trust and empowers campus students to shop with confidence.
            </motion.p>

            {/* Rating & Product Highlight Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25 }}
              className="mt-6 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 text-left space-y-2"
            >
              {productName && (
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                  <MessageSquareHeart className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                  <span className="truncate">{productName}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Your Rating</span>
                <div className="flex items-center gap-1 text-amber-400">
                  {[1, 2, 3, 4, 5].map((star, sIdx) => (
                    <Star
                      key={`review-modal-star-${star}-${sIdx}`}
                      className={`w-4 h-4 ${
                        star <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-600 fill-none"
                      }`}
                    />
                  ))}
                  <span className="ml-1 text-xs font-black text-slate-700 dark:text-slate-300">{rating}.0</span>
                </div>
              </div>

              {comment && (
                <p className="text-xs text-slate-600 dark:text-slate-400 italic line-clamp-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                  "{comment}"
                </p>
              )}
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-6 flex flex-col gap-2"
            >
              <button
                id="review-success-done-btn"
                onClick={onClose}
                className="w-full h-12 bg-[#ff6b00] hover:bg-[#e05e00] active:scale-[0.99] text-white rounded-2xl font-bold text-sm shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ThumbsUp className="w-4 h-4" />
                Done
              </button>
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
