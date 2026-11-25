import React from "react";
import { ArrowRight, DollarSign, ShieldCheck, Truck, RefreshCw } from "lucide-react";
import { ExchangeRateSnapshot, OneDollarListing } from "../types";
import { formatNaira, computeOneDollarNgn, formatUsd } from "../lib/oneDollarRate";

interface OneDollarBannerProps {
  rateInfo: ExchangeRateSnapshot | null;
  rateLoading: boolean;
  previewListings: OneDollarListing[];
  onExplore: () => void;
  onSelectListing?: (listing: OneDollarListing) => void;
}

export default function OneDollarBanner({
  rateInfo,
  rateLoading,
  previewListings,
  onExplore,
  onSelectListing
}: OneDollarBannerProps) {
  const activePreviews = previewListings
    .filter((item) => item.status === "approved" && item.isActive && item.stock > 0)
    .slice(0, 4);

  const ngnDisplay = rateInfo ? formatNaira(rateInfo.oneDollarNgnPrice) : "—";

  return (
    <section
      aria-label="One Dollar Deals"
      className="px-4 lg:px-8 pt-4 max-w-[1600px] mx-auto"
    >
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-orange-200/80 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="p-5 sm:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-gradient-to-br from-orange-50/90 via-white to-amber-50/60 dark:from-zinc-900 dark:via-zinc-900 dark:to-orange-950/20">
          <div className="space-y-2.5 max-w-2xl text-left">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#ff6b00] text-white text-[10px] font-black uppercase tracking-widest">
                <DollarSign className="w-3 h-3" />
                One Dollar Deals
              </span>
              <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 tabular-nums">
                {rateLoading && !rateInfo ? (
                  <span className="inline-flex items-center gap-1 text-slate-500">
                    <RefreshCw className="w-3 h-3 animate-spin" /> Loading today&apos;s Naira rate...
                  </span>
                ) : (
                  <>
                    $1 USD = <strong className="text-[#ff6b00]">{ngnDisplay}</strong> today
                  </>
                )}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Verified Campus Finds at $1 &amp; Below
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 font-medium leading-relaxed">
              Approved student vendors list quality items priced from $0.01 up to $1.00 USD, automatically converted to Naira daily. Fulfillment is arranged directly with the vendor, with optional payment escrow protection at checkout.
            </p>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 pt-1 text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
              <span className="inline-flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-[#ff6b00]" />
                Vendor-managed delivery
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Optional checkout escrow
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 shrink-0">
            <div className="px-4 py-2.5 rounded-2xl bg-white dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-800 text-left sm:text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                Up To $1.00 USD
              </p>
              <p className="text-2xl font-black text-[#ff6b00] tabular-nums leading-tight">
                ≤ {ngnDisplay}
              </p>
              <p className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400 tabular-nums">
                $0.01 – $1.00 USD • Daily live rate
              </p>
            </div>

            <button
              type="button"
              onClick={onExplore}
              className="px-5 py-3.5 bg-[#ff6b00] hover:bg-[#e56000] text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 cursor-pointer border-none active:scale-[0.98]"
            >
              <span>Explore One Dollar</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {activePreviews.length > 0 && (
          <div className="px-5 sm:px-7 py-4 border-t border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                Live $1 &amp; Below Vendor Picks
              </span>
              <button
                type="button"
                onClick={onExplore}
                className="text-xs font-bold text-[#ff6b00] hover:underline bg-transparent border-none p-0 cursor-pointer"
              >
                View all One Dollar items →
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {activePreviews.map((item) => {
                const itemNgn = computeOneDollarNgn(item.usdPrice, rateInfo);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => (onSelectListing ? onSelectListing(item) : onExplore())}
                    className="group flex items-center gap-3 p-2.5 rounded-2xl border border-slate-200/70 dark:border-zinc-800 hover:border-[#ff6b00] bg-slate-50/50 dark:bg-zinc-950/60 transition-all text-left cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 shrink-0">
                      <img
                        src={item.imageUrl || item.imageUrls?.[0] || "/placeholder-product.png"}
                        alt={item.productName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {item.productName}
                      </p>
                      <p className="text-xs font-black text-[#ff6b00] tabular-nums">
                        {itemNgn ? formatNaira(itemNgn) : ngnDisplay}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-zinc-500 truncate tabular-nums">
                        {formatUsd(item.usdPrice)} USD • {item.storeName || item.sellerName}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
