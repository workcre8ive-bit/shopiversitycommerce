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
      {/* Official Shopiversity 3D S-Bag Brand Emblem */}
      <img
        src="/shopiversity-logo.png"
        alt="Shopiversity Official Logo"
        className={cn(
          "h-[28px] w-[28px] min-[375px]:h-[32px] min-[375px]:w-[32px] sm:h-[42px] sm:w-[42px] object-contain shrink-0 transition-transform duration-200",
          isWhite && "brightness-0 invert"
        )}
        draggable={false}
      />

      {/* Signature Lockup: Vertical Divider + SHOPIVERSITY + Tagline + Curved Swoosh */}
      {showText && (
        <>
          <span
            aria-hidden="true"
            className={cn(
              "w-[1.5px] sm:w-[2px] h-5 min-[375px]:h-6 sm:h-9 rounded-full shrink-0",
              isWhite
                ? "bg-gradient-to-b from-transparent via-white/80 to-transparent"
                : "bg-gradient-to-b from-transparent via-[#ff6b00] to-transparent"
            )}
          />

          <div className="flex flex-col text-left justify-center shrink-0">
            {/* Uppercase Geometric Wordmark with Stylized Cap-V */}
            <div
              className={cn(
                "flex items-center font-display font-black uppercase tracking-[0.025em] leading-none whitespace-nowrap",
                "text-[13px] min-[375px]:text-[15px] sm:text-[22px]"
              )}
            >
              <span
                className={cn(
                  isWhite
                    ? "text-white drop-shadow-sm"
                    : "bg-gradient-to-r from-[#ff7a00] via-[#ff6b00] to-[#ff4d00] bg-clip-text text-transparent"
                )}
              >
                SHOPI
              </span>
              <span className="relative inline-flex items-center justify-center mx-[0.5px]">
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute -top-[1px] sm:-top-[2px] w-[4px] h-[3px] sm:w-[6px] sm:h-[4px]",
                    isWhite ? "bg-white" : "bg-[#ff7a00]"
                  )}
                  style={{ clipPath: "polygon(0 0, 100% 0, 50% 100%)" }}
                />
                <span
                  className={cn(
                    isWhite
                      ? "text-white drop-shadow-sm"
                      : "bg-gradient-to-b from-[#ff7a00] to-[#ff4d00] bg-clip-text text-transparent"
                  )}
                >
                  V
                </span>
              </span>
              <span
                className={cn(
                  isWhite
                    ? "text-white drop-shadow-sm"
                    : "bg-gradient-to-r from-[#ff6b00] via-[#ff5c00] to-[#ff7a00] bg-clip-text text-transparent"
                )}
              >
                ERSITY
              </span>
            </div>

            {/* Tagline & Signature Curved Swoosh */}
            <div className="hidden min-[480px]:flex flex-col items-center mt-0.5 sm:mt-[3px] w-full">
              <div className="flex items-center gap-1 sm:gap-1.5 w-full justify-center">
                <span
                  aria-hidden="true"
                  className={cn(
                    "h-[1.5px] w-2.5 sm:w-4 shrink-0 rounded-full",
                    isWhite
                      ? "bg-gradient-to-r from-transparent to-white/80"
                      : "bg-gradient-to-r from-transparent to-[#ff6b00]"
                  )}
                />
                <span
                  className={cn(
                    "text-[7.5px] sm:text-[9.5px] italic font-semibold tracking-[0.01em] font-sans leading-none whitespace-nowrap",
                    isWhite
                      ? "text-white/90"
                      : darkSurface
                      ? "text-slate-200"
                      : "text-slate-800 dark:text-slate-200"
                  )}
                >
                  The Marketplace at Your Finger Tips
                </span>
                <span
                  aria-hidden="true"
                  className={cn(
                    "h-[1.5px] w-2.5 sm:w-4 shrink-0 rounded-full",
                    isWhite
                      ? "bg-gradient-to-l from-transparent to-white/80"
                      : "bg-gradient-to-l from-transparent to-[#ff6b00]"
                  )}
                />
              </div>

              {/* Curved Orange Accent Swoosh */}
              <svg
                viewBox="0 0 120 8"
                className="w-20 sm:w-32 h-[4px] sm:h-[5px] mt-[2px] overflow-visible"
                aria-hidden="true"
              >
                <path
                  d="M 4 6.5 Q 60 0 116 6.5 Q 60 2.6 4 6.5 Z"
                  fill={isWhite ? "#ffffff" : "#ff6b00"}
                />
              </svg>
            </div>
          </div>
        </>
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
