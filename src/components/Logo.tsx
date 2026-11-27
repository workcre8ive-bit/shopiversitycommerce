import React from "react";
import { cn } from "../lib/utils";

interface LogoProps {
  className?: string;
  showText?: boolean;
  onClick?: () => void;
  variant?: "default" | "white";
  darkSurface?: boolean;
}

export default function Logo({
  className,
  showText = true,
  onClick,
  variant = "default",
  darkSurface = false,
}: LogoProps) {
  const isWhite = variant === "white";

  const content = (
    <div className={cn("flex items-center gap-1.5 sm:gap-2.5 select-none shrink-0", className)}>
      {/* Official Shopiversity Graduation Cap + Orange Cart Emblem */}
      <div
        className={cn(
          "flex items-center justify-center shrink-0 transition-transform duration-200",
          (darkSurface || isWhite)
            ? "bg-white/95 p-1 rounded-xl shadow-sm"
            : "dark:bg-white/95 dark:p-0.5 sm:dark:p-1 dark:rounded-xl"
        )}
      >
        <img
          src="/shopiversity-logo.png"
          alt="Shopiversity Official Logo"
          className="h-[28px] w-[28px] min-[375px]:h-[32px] min-[375px]:w-[32px] sm:h-[40px] sm:w-[40px] object-contain shrink-0"
          draggable={false}
        />
      </div>

      {/* Signature Lockup: Shopi (black stem, orange dot) + versity (orange) + italic tagline */}
      {showText && (
        <div className="flex flex-col text-left justify-center shrink-0">
          <div
            className={cn(
              "flex items-baseline font-display font-black tracking-[-0.03em] leading-none whitespace-nowrap",
              "text-[17px] min-[375px]:text-[19px] sm:text-[26px]"
            )}
          >
            <span
              className={cn(
                isWhite || darkSurface
                  ? "text-white"
                  : "text-[#141414] dark:text-white"
              )}
            >
              Shop
            </span>
            <span className="relative inline-block leading-none">
              {/* Stemless base of 'i' in black/white + bright orange dot */}
              <span
                className={cn(
                  isWhite || darkSurface
                    ? "text-white"
                    : "text-[#141414] dark:text-white"
                )}
              >
                ı
              </span>
              <span
                aria-hidden="true"
                className="absolute left-1/2 -translate-x-1/2 top-[0.06em] w-[0.23em] h-[0.23em] rounded-full bg-[#ff7a00]"
              />
            </span>
            <span className="text-[#ff7a00]">versity</span>
          </div>

          <span
            className={cn(
              "hidden min-[420px]:block text-[7.5px] sm:text-[10px] italic font-semibold tracking-[0.005em] font-sans leading-none whitespace-nowrap mt-0.5",
              isWhite || darkSurface
                ? "text-slate-200"
                : "text-slate-700 dark:text-slate-300"
            )}
          >
            the marketplace at your finger tips
          </span>
        </div>
      )}
    </div>
  );

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b00] rounded-xl border-none bg-transparent p-0 m-0 flex items-center text-left cursor-pointer hover:opacity-90 active:scale-[0.98] transition-all shrink-0"
        type="button"
        aria-label="Shopiversity Home"
      >
        {content}
      </button>
    );
  }

  return content;
}
