import React from "react";
import {
  ArrowLeft,
  CheckCircle,
  DollarSign,
  Info,
  Package,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Store,
  Truck,
  X
} from "lucide-react";
import { ExchangeRateSnapshot, OneDollarListing, Product, UserProfile } from "../types";
import { db } from "../firebase";
import { collection, limit, onSnapshot, query, where } from "firebase/firestore";
import { clampOneDollarUsd, computeOneDollarNgn, formatNaira, formatUsd, getCachedOneDollarListings, setCachedOneDollarListings } from "../lib/oneDollarRate";
import { handleListenerError, isFirestoreQuotaError, OperationType } from "../lib/firebase-errors";
import { cn } from "../lib/utils";
import VendorVerificationBadge from "./VendorVerificationBadge";

interface OneDollarSectionProps {
  currentUser: UserProfile | null;
  rateInfo: ExchangeRateSnapshot | null;
  rateLoading: boolean;
  rateError: string | null;
  onRefreshRate: () => void;
  onAddOneDollarToCart: (listing: OneDollarListing, goToCartImmediately?: boolean) => void;
  onViewSellerStore?: (sellerId: string) => void;
  onBack: () => void;
  initialSelectedListing?: OneDollarListing | null;
  onClearInitialSelectedListing?: () => void;
  sellersMap?: Record<string, UserProfile> | Map<string, UserProfile>;
}

export default function OneDollarSection({
  currentUser,
  rateInfo,
  rateLoading,
  rateError,
  onRefreshRate,
  onAddOneDollarToCart,
  onViewSellerStore,
  onBack,
  initialSelectedListing,
  onClearInitialSelectedListing,
  sellersMap
}: OneDollarSectionProps) {
  const [listings, setListings] = React.useState<OneDollarListing[]>(() => getCachedOneDollarListings());
  const [loadingListings, setLoadingListings] = React.useState<boolean>(() => getCachedOneDollarListings().length === 0);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("All");
  const [priceFilter, setPriceFilter] = React.useState<"all" | "under_half" | "half_to_one">("all");
  const [selectedListing, setSelectedListing] = React.useState<OneDollarListing | null>(initialSelectedListing || null);
  const [activeImageIdx, setActiveImageIdx] = React.useState(0);

  React.useEffect(() => {
    if (initialSelectedListing) {
      setSelectedListing(initialSelectedListing);
      setActiveImageIdx(0);
    }
  }, [initialSelectedListing]);

  React.useEffect(() => {
    const q = query(
      collection(db, "oneDollarListings"),
      where("status", "==", "approved"),
      limit(80)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as OneDollarListing))
          .filter((item) => item.status === "approved" && item.isActive)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setListings(docs);
        setCachedOneDollarListings(docs);
        setLoadingListings(false);
      },
      (err) => {
        setLoadingListings(false);
        if (isFirestoreQuotaError(err)) {
          return;
        }
        handleListenerError(err, OperationType.LIST, "oneDollarListings");
      }
    );
    return () => unsub();
  }, []);

  const categories = React.useMemo(() => {
    const unique = Array.from(new Set(listings.map((l) => l.category).filter(Boolean))).sort();
    return ["All", ...unique];
  }, [listings]);

  const filteredListings = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return listings.filter((item) => {
      if (item.stock <= 0) return false;
      const usd = clampOneDollarUsd(item.usdPrice);
      if (priceFilter === "under_half" && usd > 0.5) return false;
      if (priceFilter === "half_to_one" && (usd <= 0.5 || usd > 1)) return false;
      if (selectedCategory !== "All" && item.category !== selectedCategory) return false;
      if (!q) return true;
      const haystack = `${item.productName} ${item.description} ${item.category} ${item.sellerName} ${item.storeName || ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [listings, searchQuery, selectedCategory, priceFilter]);

  const liveNgnPrice = rateInfo?.oneDollarNgnPrice ?? null;
  const formattedUpdatedAt = rateInfo?.updatedAt
    ? new Date(rateInfo.updatedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
    : null;

  const closeDetail = () => {
    setSelectedListing(null);
    setActiveImageIdx(0);
    onClearInitialSelectedListing?.();
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 lg:px-8 py-6 space-y-6 pb-24">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 text-xs font-bold transition-colors cursor-pointer border-none"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Marketplace
        </button>

        <button
          type="button"
          onClick={onRefreshRate}
          disabled={rateLoading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-bold text-slate-600 dark:text-zinc-300 hover:border-[#ff6b00] transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={cn("w-3.5 h-3.5 text-[#ff6b00]", rateLoading && "animate-spin")} />
          <span>Refresh Rate</span>
        </button>
      </div>

      {/* Prominent One Dollar Hero Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-[#ff6b00] via-orange-600 to-amber-600 text-white p-6 sm:p-8 shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-white/15 text-white text-[10px] font-black uppercase tracking-widest">
              <DollarSign className="w-3.5 h-3.5" />
              One Dollar Marketplace
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight !text-white">
              Verified Products at $1 USD &amp; Below
            </h1>
            <p className="text-xs sm:text-sm text-orange-50 font-medium leading-relaxed">
              Verified Shopiversity vendors voluntarily list selected items here from $0.01 up to $1.00 USD. Prices automatically convert to Nigerian Naira (₦) daily, and fulfillment is arranged directly between you and the vendor.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs font-semibold text-white/95">
              <span className="inline-flex items-center gap-1.5">
                <Truck className="w-4 h-4" />
                Delivery handled directly by vendor
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                Optional payment escrow at checkout
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-950 text-slate-900 dark:text-white rounded-2xl p-5 sm:min-w-[290px] shadow-xl border border-white/20 text-left space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                Daily Exchange Conversion
              </span>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-orange-50 dark:bg-orange-950/50 text-[#ff6b00]">
                $1.00 &amp; Below
              </span>
            </div>

            {liveNgnPrice ? (
              <>
                <div className="text-3xl font-black text-[#ff6b00] tabular-nums">
                  $1 = {formatNaira(liveNgnPrice)}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400 space-y-0.5 leading-snug">
                  <p>
                    Rate: <strong className="text-slate-700 dark:text-zinc-200 tabular-nums">₦{rateInfo?.rate?.toLocaleString()} / $1</strong>
                  </p>
                  <p>Source: {rateInfo?.source}</p>
                  {formattedUpdatedAt && <p>Updated: {formattedUpdatedAt}</p>}
                  {rateInfo?.staleFallback && (
                    <p className="text-amber-600 font-semibold">Showing last verified cached rate</p>
                  )}
                </div>
              </>
            ) : (
              <div className="py-2 text-xs text-red-600 dark:text-red-400 font-semibold">
                {rateError || "Loading daily exchange rate..."}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Transparent Vendor Delivery & Escrow Notice */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 flex items-start gap-3 text-left">
          <Truck className="w-5 h-5 text-[#ff6b00] shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wide">
              Vendor-Managed Delivery
            </p>
            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              Shopiversity does not dispatch or manage registered logistics partners for One Dollar products. Coordinate pickup or delivery directly with the respective vendor; any delivery fee is arranged separately.
            </p>
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 flex items-start gap-3 text-left">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wide">
              Optional Escrow Payment Protection
            </p>
            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              At checkout, choose either <strong>Escrow Protected</strong> (funds held by Shopiversity until you confirm receipt) or <strong>Direct Payment</strong> without escrow hold.
            </p>
          </div>
        </div>
      </div>

      {/* Search, Price Band & Category Controls */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search $1 & below items or vendor stores..."
              className="w-full h-11 pl-10 pr-9 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-[#ff6b00]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: "all", label: "All (≤ $1.00)" },
              { id: "under_half", label: "$0.01 – $0.50" },
              { id: "half_to_one", label: "$0.51 – $1.00" }
            ].map((band) => (
              <button
                key={band.id}
                type="button"
                onClick={() => setPriceFilter(band.id as "all" | "under_half" | "half_to_one")}
                className={cn(
                  "px-3 py-2 rounded-xl text-[11px] font-bold whitespace-nowrap border transition-colors cursor-pointer",
                  priceFilter === band.id
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white"
                    : "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 hover:border-[#ff6b00]"
                )}
              >
                {band.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition-colors cursor-pointer",
                selectedCategory === cat
                  ? "bg-[#ff6b00] border-[#ff6b00] text-white"
                  : "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 hover:border-orange-300"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      {loadingListings ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="h-80 rounded-2xl bg-slate-100 dark:bg-zinc-900 animate-pulse" />
          ))}
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="py-16 px-6 text-center bg-slate-50 dark:bg-zinc-900 rounded-3xl border border-slate-200/70 dark:border-zinc-800 space-y-3">
          <Package className="w-12 h-12 text-slate-300 dark:text-zinc-700 mx-auto" />
          <h3 className="text-lg font-black text-slate-900 dark:text-white">
            No Approved One Dollar Items Available Yet
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
            Vendors can voluntarily submit or add products priced at $1.00 USD &amp; below from their Seller Dashboard. Once approved by an administrator, they appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredListings.map((item) => {
            const isOwner = currentUser?.uid === item.sellerId;
            const sellerProfile = sellersMap instanceof Map ? sellersMap.get(item.sellerId) : sellersMap?.[item.sellerId];
            const storeLabel = item.storeName || sellerProfile?.businessName || item.sellerName;
            const itemUsd = clampOneDollarUsd(item.usdPrice);
            const itemNgn = computeOneDollarNgn(itemUsd, rateInfo);
            return (
              <div
                key={item.id}
                onClick={() => {
                  setSelectedListing(item);
                  setActiveImageIdx(0);
                }}
                className="group bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/90 dark:border-zinc-800 hover:border-[#ff6b00] transition-all overflow-hidden flex flex-col cursor-pointer shadow-xs hover:shadow-md"
              >
                <div className="relative aspect-[4/3] bg-slate-100 dark:bg-zinc-950 overflow-hidden">
                  <img
                    src={item.imageUrl || item.imageUrls?.[0] || "/placeholder-product.png"}
                    alt={item.productName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-[#ff6b00] text-white text-[10px] font-black uppercase tracking-wider shadow-xs tabular-nums">
                    {formatUsd(itemUsd)}
                  </span>
                </div>

                <div className="p-3.5 flex flex-col flex-1 text-left gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                      {item.productName}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 line-clamp-2 mt-0.5 min-h-[2rem]">
                      {item.description}
                    </p>
                  </div>

                  <div className="flex items-baseline justify-between gap-2 pt-1">
                    <div>
                      <span className="text-lg font-black text-[#ff6b00] tabular-nums block leading-none">
                        {itemNgn ? formatNaira(itemNgn) : "Rate loading"}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 tabular-nums">
                        {formatUsd(itemUsd)} USD
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                      {item.stock} in stock
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 dark:text-zinc-400 border-t border-slate-100 dark:border-zinc-800 pt-2 space-y-1">
                    <div className="flex items-center gap-1 truncate">
                      <Store className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="font-semibold text-slate-700 dark:text-zinc-300 truncate">{storeLabel}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                      <Truck className="w-3 h-3 shrink-0" />
                      <span className="truncate">Vendor-managed delivery</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 mt-auto pt-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      disabled={isOwner || !liveNgnPrice}
                      onClick={() => onAddOneDollarToCart(item, false)}
                      className="h-9 px-2 rounded-xl border border-[#ff6b00] text-[#ff6b00] hover:bg-orange-50 dark:hover:bg-orange-950/30 font-bold text-[11px] transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-transparent"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                    <button
                      type="button"
                      disabled={isOwner || !liveNgnPrice}
                      onClick={() => onAddOneDollarToCart(item, true)}
                      className="h-9 px-2 rounded-xl bg-[#ff6b00] hover:bg-[#e56000] text-white font-bold text-[11px] transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed border-none"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>{isOwner ? "Yours" : "Buy Now"}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedListing && (
        <div
          className="fixed inset-0 z-[260] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={closeDetail}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-zinc-900 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-zinc-800 shadow-2xl"
          >
            <div className="sticky top-0 z-10 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md px-6 py-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded bg-[#ff6b00] text-white text-[10px] font-black uppercase tracking-widest tabular-nums">
                  One Dollar ({formatUsd(selectedListing.usdPrice)})
                </span>
                <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">
                  {selectedListing.category}
                </span>
              </div>
              <button
                type="button"
                onClick={closeDetail}
                className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:text-slate-900 cursor-pointer border-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              {/* Images */}
              <div className="space-y-3">
                {(() => {
                  const gallery = (selectedListing.imageUrls && selectedListing.imageUrls.length > 0)
                    ? selectedListing.imageUrls
                    : [selectedListing.imageUrl || "/placeholder-product.png"];
                  return (
                    <>
                      <div className="aspect-square rounded-2xl overflow-hidden bg-slate-100 dark:bg-zinc-950 border border-slate-200/70 dark:border-zinc-800">
                        <img
                          src={gallery[activeImageIdx] || gallery[0]}
                          alt={selectedListing.productName}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      {gallery.length > 1 && (
                        <div className="flex items-center gap-2 overflow-x-auto pb-1">
                          {gallery.map((imgUrl, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setActiveImageIdx(idx)}
                              className={cn(
                                "w-14 h-14 rounded-xl overflow-hidden border-2 shrink-0 cursor-pointer p-0",
                                activeImageIdx === idx ? "border-[#ff6b00]" : "border-slate-200 dark:border-zinc-800"
                              )}
                            >
                              <img src={imgUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

              {/* Details */}
              <div className="space-y-4 flex flex-col">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {selectedListing.productName}
                  </h2>
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500 dark:text-zinc-400">
                    <span className="capitalize font-semibold">{selectedListing.condition} condition</span>
                    <span>•</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {selectedListing.stock} available
                    </span>
                  </div>
                </div>

                {/* Live Price Box */}
                {(() => {
                  const selectedUsd = clampOneDollarUsd(selectedListing.usdPrice);
                  const selectedNgn = computeOneDollarNgn(selectedUsd, rateInfo);
                  return (
                    <div className="p-4 rounded-2xl bg-orange-50/70 dark:bg-orange-950/20 border border-orange-200/80 dark:border-orange-900/40 space-y-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-3xl font-black text-[#ff6b00] tabular-nums">
                          {selectedNgn ? formatNaira(selectedNgn) : "—"}
                        </span>
                        <span className="text-xs font-black text-slate-600 dark:text-zinc-300 tabular-nums">
                          {formatUsd(selectedUsd)} USD
                        </span>
                      </div>
                      {rateInfo && (
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                          Daily rate: ₦{rateInfo.rate.toLocaleString()}/$1 • {rateInfo.source}
                          {formattedUpdatedAt ? ` (${formattedUpdatedAt})` : ""}
                        </p>
                      )}
                    </div>
                  );
                })()}

                <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
                  {selectedListing.description}
                </p>

                {/* Vendor Card */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-950/70 border border-slate-200/70 dark:border-zinc-800 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Vendor Store</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {selectedListing.storeName || selectedListing.sellerName}
                      </span>
                      {selectedListing.sellerVerified && (
                        <VendorVerificationBadge
                          user={
                            (sellersMap instanceof Map
                              ? sellersMap.get(selectedListing.sellerId)
                              : sellersMap?.[selectedListing.sellerId]) || ({
                              uid: selectedListing.sellerId,
                              displayName: selectedListing.sellerName,
                              email: "",
                              role: "seller",
                              isVerified: true,
                              profileCompleted: true,
                              businessName: selectedListing.storeName || selectedListing.sellerName,
                            } as UserProfile)
                          }
                          size="sm"
                        />
                      )}
                    </div>
                    {selectedListing.campus && (
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                        {selectedListing.campus}
                      </p>
                    )}
                  </div>
                  {onViewSellerStore && (
                    <button
                      type="button"
                      onClick={() => {
                        closeDetail();
                        onViewSellerStore(selectedListing.sellerId);
                      }}
                      className="px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-700 dark:text-zinc-200 hover:border-[#ff6b00] cursor-pointer shrink-0"
                    >
                      Visit Store
                    </button>
                  )}
                </div>

                {/* Delivery Notice */}
                <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 space-y-1">
                  <p className="text-[11px] font-black text-amber-900 dark:text-amber-200 uppercase tracking-wide flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-amber-600" />
                    Delivery Arranged By Vendor
                  </p>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                    Shopiversity does not assign courier logistics for One Dollar orders. The vendor handles delivery or pickup arrangements directly; any separate delivery fee is agreed with the vendor.
                  </p>
                </div>

                {/* Purchase Actions */}
                <div className="pt-2 mt-auto grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={currentUser?.uid === selectedListing.sellerId || !liveNgnPrice}
                    onClick={() => {
                      onAddOneDollarToCart(selectedListing, false);
                      closeDetail();
                    }}
                    className="h-12 rounded-2xl border-2 border-[#ff6b00] text-[#ff6b00] hover:bg-orange-50 dark:hover:bg-orange-950/30 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-transparent"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Add to Cart
                  </button>
                  <button
                    type="button"
                    disabled={currentUser?.uid === selectedListing.sellerId || !liveNgnPrice}
                    onClick={() => {
                      onAddOneDollarToCart(selectedListing, true);
                      closeDetail();
                    }}
                    className="h-12 rounded-2xl bg-[#ff6b00] hover:bg-[#e56000] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed border-none shadow-md shadow-orange-500/20"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {currentUser?.uid === selectedListing.sellerId ? "Your Listing" : "Buy Now"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
