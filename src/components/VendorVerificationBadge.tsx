import React from "react";
import { ShieldCheck, Shield, Clock } from "lucide-react";
import { UserProfile } from "../types";
import { calculateVendorProfileProgress } from "../utils/vendorVerification";
import { cn } from "../lib/utils";

interface VendorVerificationBadgeProps {
  user?: UserProfile | null;
  className?: string;
  size?: "xs" | "sm" | "md";
  showIconOnly?: boolean;
}

export default function VendorVerificationBadge({
  user,
  className,
  size = "sm",
  showIconOnly = false
}: VendorVerificationBadgeProps) {
  const progress = calculateVendorProfileProgress(user);

  const IconComponent = progress.tier === "complete" 
    ? ShieldCheck 
    : progress.tier === "fairly" 
    ? Shield 
    : Clock;

  const sizeClasses = {
    xs: {
      wrapper: "px-2 py-0.5 text-[9px] gap-1",
      icon: "w-2.5 h-2.5",
    },
    sm: {
      wrapper: "px-2.5 py-1 text-[10px] gap-1.5",
      icon: "w-3 h-3",
    },
    md: {
      wrapper: "px-3 py-1.5 text-xs gap-1.5",
      icon: "w-3.5 h-3.5",
    }
  };

  if (showIconOnly) {
    return (
      <span
        title={`${progress.badgeText} (${progress.percentage}% profile complete)`}
        className={cn(
          "inline-flex items-center justify-center rounded-full p-1 border shadow-xs transition-transform hover:scale-105",
          progress.badgeTheme.bg,
          progress.badgeTheme.border,
          progress.badgeTheme.iconColor,
          className
        )}
      >
        <IconComponent className={sizeClasses[size].icon} />
      </span>
    );
  }

  return (
    <div
      title={`Vendor verification: ${progress.percentage}% complete`}
      className={cn(
        "inline-flex items-center font-bold tracking-wider uppercase rounded-full border shadow-xs transition-all",
        sizeClasses[size].wrapper,
        progress.badgeTheme.bg,
        progress.badgeTheme.border,
        progress.badgeTheme.text,
        className
      )}
    >
      <IconComponent className={cn(sizeClasses[size].icon, progress.badgeTheme.iconColor, "shrink-0")} />
      <span className="whitespace-nowrap font-sans font-black">{progress.badgeText}</span>
    </div>
  );
}
