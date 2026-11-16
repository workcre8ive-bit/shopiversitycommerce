import React from "react";
import { cn } from "../lib/utils";

interface LogoProps {
  className?: string;
  showText?: boolean;
  onClick?: () => void;
  variant?: "default" | "white";
}

export default function Logo({ className, showText = true, onClick, variant = "default" }: LogoProps) {
  const isWhite = variant === "white";

  const content = (
    <div className={cn("flex items-center gap-1.5 sm:gap-2 select-none shrink-0", className)}>
      {/* Official Shopiversity Brand Emblem */}
      <img
        src="/shopiversity-logo.png"
        alt="Shopiversity Official Logo"
        className={cn(
          "h-[24px] w-[24px] min-[375px]:h-[28px] min-[375px]:w-[28px] sm:h-[38px] sm:w-[38px] object-contain shrink-0 transition-all",
          isWhite && "brightness-0 invert"
        )}
        draggable={false}
      />

      {/* Text block: Shopiversity + the marketplace at your fingertips */}
      {showText && (
        <div className="flex flex-col text-left justify-center shrink-0">
          <span
            className={cn(
              "text-[14px] min-[375px]:text-[15.5px] sm:text-2xl font-black tracking-tight font-sans transition-colors leading-none whitespace-nowrap",
              isWhite ? "text-white drop-shadow-sm" : "text-[#ff6b00] dark:text-[#ff7f1a]"
            )}
          >
            Shopiversity
          </span>
          <span
            className={cn(
              "hidden min-[480px]:block text-[8px] sm:text-[10px] font-bold tracking-tight mt-0.5 font-sans lowercase leading-none whitespace-nowrap",
              isWhite ? "text-white/80" : "text-[#ff6b00] dark:text-[#ff7f1a]"
            )}
          >
            the marketplace at your fingertips
          </span>
        </div>
      )}
    </div>
  );

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="focus:outline-none border-none bg-transparent p-0 m-0 flex items-center text-left cursor-pointer hover:opacity-90 active:scale-[0.98] transition-all shrink-0"
        type="button"
      >
        {content}
      </button>
    );
  }

  return content;
}
