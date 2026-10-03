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
    <div className={cn("flex items-center gap-1.5 sm:gap-2 select-none min-w-0", className)}>
      {/* Precision Vector Re-creation of the Custom Shopiversity Cart in standard square 24x24 */}
      <svg
        viewBox="0 0 24 24"
        className={cn(
          "h-[26px] w-[26px] sm:h-[36px] sm:w-[36px] fill-none shrink-0 transition-all",
          isWhite ? "text-white" : "text-[#ff6b00] dark:text-[#ff7f1a]"
        )}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Wheels - Solid filled circles matching the custom brand */}
        <circle cx="10" cy="20.5" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="16.5" cy="20.5" r="1.5" fill="currentColor" stroke="none" />

        {/* Under carriage support bar loop */}
        <path d="M 10,18 L 16.5,18" strokeWidth="1.6" />
        <path d="M 10,18 C 7.5,18 7,16.5 7,14.5" strokeWidth="1.6" />

        {/* Shopping Cart Basket outer frame */}
        <path d="M 2.5,6 L 5,6.5 L 7.5,14 L 18,14 L 19.5,6.5 L 7.5,6.5" strokeWidth="1.6" />

        {/* Grid divider inside basket: Horizontal */}
        <path d="M 6.2,10.2 L 18.7,10.2" strokeWidth="1.2" />

        {/* Grid dividers inside basket: Vertical */}
        <path d="M 11,6.5 L 11,14" strokeWidth="1.2" />
        <path d="M 14.5,6.5 L 14.5,14" strokeWidth="1.2" />
      </svg>

      {/* Text block: Shopiversity + the marketplace at your fingertips */}
      {showText && (
        <div className="flex flex-col text-left justify-center min-w-0">
          <span
            className={cn(
              "text-[15px] sm:text-2xl font-black tracking-tight font-sans transition-colors leading-none truncate",
              isWhite ? "text-white drop-shadow-sm" : "text-[#ff6b00] dark:text-[#ff7f1a]"
            )}
          >
            Shopiversity
          </span>
          <span
            className={cn(
              "hidden min-[400px]:block text-[7.5px] sm:text-[10px] font-bold tracking-tight mt-0.5 font-sans lowercase leading-none truncate",
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
        className="focus:outline-none border-none bg-transparent p-0 m-0 flex items-center text-left cursor-pointer hover:opacity-90 active:scale-[0.98] transition-all"
        type="button"
      >
        {content}
      </button>
    );
  }

  return content;
}
