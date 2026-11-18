import React from "react";
import { motion, MotionConfig } from "motion/react";
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
    <MotionConfig reducedMotion="user">
      <div
        className={`flex flex-col items-center justify-center select-none overflow-hidden ${
          fullScreen
            ? "fixed inset-0 z-[9999] min-h-screen w-screen bg-white dark:bg-[#060b13] transition-colors duration-300 px-4"
            : "relative w-full py-16 px-4 bg-transparent"
        }`}
        role="status"
        aria-live="polite"
        aria-label="Loading Shopiversity"
      >
        {/* Ambient radial warmth behind brand stage */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
          <motion.div
            animate={{
              scale: [0.92, 1.12, 0.92],
              opacity: [0.28, 0.52, 0.28],
            }}
            transition={{
              duration: 3.2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="w-72 h-72 sm:w-[26rem] sm:h-[26rem] rounded-full bg-gradient-to-tr from-[#ff6b00]/20 via-[#ff9838]/12 to-transparent dark:from-[#ff6b00]/25 dark:via-[#ff8c33]/10 blur-3xl"
          />
        </div>

        {/* Main Brand Stage */}
        <div className="relative z-10 flex flex-col items-center text-center max-w-md w-full">
          {/* Kinetic Dual-Ring Emblem Orbit */}
          <div className="relative flex items-center justify-center w-28 h-28 sm:w-32 sm:h-32 mb-5">
            {/* Soft breathing orange aura */}
            <motion.div
              animate={{
                scale: [0.95, 1.12, 0.95],
                opacity: [0.35, 0.7, 0.35],
              }}
              transition={{
                duration: 2.4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute inset-3 rounded-full bg-[#ff6b00]/15 dark:bg-[#ff6b00]/20 blur-xl"
            />

            {/* Outer sweeping kinetic arc */}
            <motion.svg
              viewBox="0 0 120 120"
              className="absolute inset-0 w-full h-full pointer-events-none"
              animate={{ rotate: 360 }}
              transition={{ duration: 2.8, repeat: Infinity, ease: "linear" }}
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="loaderOrbitGradOuter" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ff9500" stopOpacity="0.95" />
                  <stop offset="60%" stopColor="#ff6b00" stopOpacity="0.55" />
                  <stop offset="100%" stopColor="#ff6b00" stopOpacity="0" />
                </linearGradient>
              </defs>
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke="url(#loaderOrbitGradOuter)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray="120 220"
              />
            </motion.svg>

            {/* Inner counter-rotating precision arc */}
            <motion.svg
              viewBox="0 0 120 120"
              className="absolute inset-2 w-[calc(100%-16px)] h-[calc(100%-16px)] pointer-events-none"
              animate={{ rotate: -360 }}
              transition={{ duration: 4.2, repeat: Infinity, ease: "linear" }}
              aria-hidden="true"
            >
              <circle
                cx="60"
                cy="60"
                r="48"
                fill="none"
                stroke="#ff6b00"
                strokeOpacity="0.24"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeDasharray="48 110 24 120"
              />
            </motion.svg>

            {/* Levitating 3D S-Bag Brand Emblem with Sheen Sweep */}
            <motion.div
              initial={{ scale: 0.78, opacity: 0 }}
              animate={{
                scale: [1, 1.04, 1],
                y: [0, -5, 0],
                opacity: 1,
              }}
              transition={{
                opacity: { duration: 0.35 },
                scale: { duration: 2.4, repeat: Infinity, ease: "easeInOut" },
                y: { duration: 2.4, repeat: Infinity, ease: "easeInOut" },
              }}
              className="relative flex items-center justify-center w-20 h-20 sm:w-22 sm:h-22 rounded-3xl overflow-hidden"
            >
              <img
                src="/shopiversity-logo.png"
                alt="Shopiversity Official Logo"
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-[0_10px_22px_rgba(255,107,0,0.34)] select-none"
                draggable={false}
              />

              {/* Diagonal glass sheen sweep */}
              <motion.div
                animate={{ x: ["-130%", "150%"] }}
                transition={{
                  duration: 2.2,
                  repeat: Infinity,
                  repeatDelay: 1.1,
                  ease: [0.16, 1, 0.3, 1],
                }}
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 w-8 bg-gradient-to-r from-transparent via-white/45 to-transparent -skew-x-20"
              />
            </motion.div>
          </div>

          {/* Official Brand Wordmark & Swoosh Reveal */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center"
          >
            <h1 className="flex items-center justify-center font-display text-[26px] sm:text-[32px] font-black uppercase tracking-[0.04em] leading-none">
              <span className="bg-gradient-to-r from-[#ff8800] via-[#ff6b00] to-[#ff4d00] bg-clip-text text-transparent">
                SHOPI
              </span>
              <span className="relative inline-flex items-center justify-center mx-[1px]">
                <span
                  aria-hidden="true"
                  className="absolute -top-[2px] w-[7px] h-[5px] bg-[#ff7a00]"
                  style={{ clipPath: "polygon(0 0, 100% 0, 50% 100%)" }}
                />
                <span className="bg-gradient-to-b from-[#ff7a00] to-[#ff4d00] bg-clip-text text-transparent">
                  V
                </span>
              </span>
              <span className="bg-gradient-to-r from-[#ff6b00] via-[#ff5500] to-[#ff7a00] bg-clip-text text-transparent">
                ERSITY
              </span>
            </h1>

            {/* Tagline flanked by tapering orange bars */}
            <div className="flex items-center justify-center gap-2 mt-2">
              <motion.span
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ duration: 0.45, delay: 0.15 }}
                className="origin-right h-[2px] w-6 sm:w-8 rounded-full bg-gradient-to-r from-transparent to-[#ff6b00]"
              />
              <p className="text-[11px] sm:text-xs italic font-semibold tracking-[0.015em] text-slate-800 dark:text-slate-200 whitespace-nowrap">
                The Marketplace at Your Finger Tips
              </p>
              <motion.span
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ duration: 0.45, delay: 0.15 }}
                className="origin-left h-[2px] w-6 sm:w-8 rounded-full bg-gradient-to-l from-transparent to-[#ff6b00]"
              />
            </div>

            {/* Animated curved swoosh arc */}
            <svg viewBox="0 0 180 12" className="w-40 sm:w-48 h-2.5 mt-1 overflow-visible" aria-hidden="true">
              <motion.path
                d="M 8 10 Q 90 1 172 10"
                fill="none"
                stroke="#ff6b00"
                strokeWidth="2.6"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              />
            </svg>
          </motion.div>

          {/* Sleek Dual-Beam Progress Track */}
          <div className="mt-6 w-48 sm:w-56 h-[5px] bg-slate-100 dark:bg-zinc-800/90 rounded-full overflow-hidden relative shadow-inner">
            <motion.div
              animate={{
                x: ["-100%", "210%"],
              }}
              transition={{
                duration: 1.35,
                repeat: Infinity,
                ease: [0.45, 0, 0.55, 1],
              }}
              className="absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-transparent via-[#ff7b00] to-transparent rounded-full shadow-[0_0_12px_rgba(255,107,0,0.85)]"
            />
          </div>

          {/* Animated Status Message */}
          <motion.p
            animate={{
              opacity: [0.65, 1, 0.65],
            }}
            transition={{
              duration: 1.9,
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
    </MotionConfig>
  );
}
