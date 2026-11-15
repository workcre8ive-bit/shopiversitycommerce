import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface ShopiversityLoaderProps {
  message?: string;
  fullScreen?: boolean;
  connectionError?: string | null;
  onRetry?: () => void;
}

export default function ShopiversityLoader({
  message = "Loading your campus marketplace...",
  fullScreen = true,
  connectionError,
  onRetry,
}: ShopiversityLoaderProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center select-none ${
        fullScreen
          ? "fixed inset-0 z-[9999] min-h-screen w-screen bg-white dark:bg-[#060b13] transition-colors duration-300 px-4"
          : "w-full py-16 px-4 bg-transparent"
      }`}
      role="status"
      aria-live="polite"
      aria-label="Loading Shopiversity"
    >
      {/* Ambient background glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <motion.div
          animate={{
            scale: [0.9, 1.15, 0.9],
            opacity: [0.35, 0.6, 0.35],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-gradient-to-tr from-[#ff6b00]/15 via-[#ff8c33]/10 to-transparent dark:from-[#ff6b00]/20 dark:via-[#ff8c33]/10 blur-3xl"
        />
      </div>

      {/* Main Brand Content */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-sm w-full">
        {/* Floating Animated Cart Icon */}
        <div className="relative flex items-center justify-center mb-5">
          {/* Subtle pulsating back-plate */}
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.4, 0.75, 0.4],
            }}
            transition={{
              duration: 2.2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-[#ff6b00]/10 dark:bg-[#ff6b00]/15 blur-lg"
          />

          {/* Official Shopiversity Brand Emblem with levitation bounce */}
          <motion.div
            animate={{
              y: [0, -8, 0],
            }}
            transition={{
              duration: 2.4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="relative"
          >
            <img
              src="/shopiversity-logo.png"
              alt="Shopiversity Official Logo"
              className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-[0_6px_16px_rgba(255,107,0,0.3)] select-none"
              draggable={false}
            />

            {/* Micro Sparkle/Shimmer point on cart corner */}
            <motion.div
              animate={{
                scale: [0, 1.2, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                repeatDelay: 0.6,
                ease: "easeOut",
              }}
              className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full blur-[1px] shadow-[0_0_8px_#ffb300]"
            />
          </motion.div>
        </div>

        {/* Brand Typography */}
        <div className="flex flex-col items-center">
          <motion.h1
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white font-sans"
          >
            Shopiversity
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-[10px] sm:text-xs font-bold text-[#ff6b00] dark:text-[#ff7f1a] tracking-widest uppercase mt-0.5"
          >
            The marketplace at your fingertips
          </motion.p>
        </div>

        {/* Sleek, Modern Dynamic Progress Bar */}
        <div className="mt-7 w-44 sm:w-52 h-1 bg-slate-100 dark:bg-zinc-800/80 rounded-full overflow-hidden relative shadow-inner">
          <motion.div
            animate={{
              x: ["-100%", "200%"],
            }}
            transition={{
              duration: 1.4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute top-0 bottom-0 w-2/3 bg-gradient-to-r from-transparent via-[#ff6b00] to-transparent rounded-full shadow-[0_0_10px_rgba(255,107,0,0.8)]"
          />
        </div>

        {/* Animated Subtitle status */}
        <motion.p
          animate={{
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="text-xs text-slate-500 dark:text-zinc-400 font-medium tracking-tight mt-3"
        >
          {message}
        </motion.p>

        {/* Connection Error Banner (if any) */}
        {connectionError && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 w-full bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-sm text-left"
          >
            <div className="flex items-center gap-2 min-w-0">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-[11px] font-semibold text-red-700 dark:text-red-300 truncate">
                {connectionError}
              </p>
            </div>
            {onRetry && (
              <button
                onClick={onRetry}
                type="button"
                className="shrink-0 text-[11px] font-bold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                Retry
              </button>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
