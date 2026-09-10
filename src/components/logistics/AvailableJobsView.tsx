import React from "react";
import { 
  Package, 
  Phone, 
  Check, 
  X, 
  Truck, 
  Search, 
  ArrowUpDown, 
  Clock, 
  Sparkles,
  MapPin,
  Building2,
  Calendar
} from "lucide-react";
import { cn } from "../../lib/utils";
import type { DeliveryJob, LogisticsCompany } from "./types";

interface AvailableJobsViewProps {
  companyProfile: LogisticsCompany;
  arrangedAvailableJobs: DeliveryJob[];
  availableJobsTotalCount: number;
  directOffersCount: number;
  openPoolCount: number;
  scopeCampusFilter: "all" | "covered";
  setScopeCampusFilter: (val: "all" | "covered") => void;
  availableSearchQuery: string;
  setAvailableSearchQuery: (val: string) => void;
  availableTypeFilter: "all" | "direct" | "open";
  setAvailableTypeFilter: (val: "all" | "direct" | "open") => void;
  availableSortBy: "direct_first" | "newest" | "oldest" | "highest_fare";
  setAvailableSortBy: (val: "direct_first" | "newest" | "oldest" | "highest_fare") => void;
  jobAcceptingId: string | null;
  setJobAcceptingId: (id: string | null) => void;
  jobEtaInput: string;
  setJobEtaInput: (val: string) => void;
  handleAcceptJob: (jobId: string, eta: string) => Promise<void>;
  handleDeclineJob: (jobId: string) => Promise<void>;
  loading: boolean;
  formatJobTime: (timestamp?: string) => string;
}

export const AvailableJobsView: React.FC<AvailableJobsViewProps> = ({
  companyProfile,
  arrangedAvailableJobs,
  availableJobsTotalCount,
  directOffersCount,
  openPoolCount,
  scopeCampusFilter,
  setScopeCampusFilter,
  availableSearchQuery,
  setAvailableSearchQuery,
  availableTypeFilter,
  setAvailableTypeFilter,
  availableSortBy,
  setAvailableSortBy,
  jobAcceptingId,
  setJobAcceptingId,
  jobEtaInput,
  setJobEtaInput,
  handleAcceptJob,
  handleDeclineJob,
  loading,
  formatJobTime,
}) => {
  return (
    <div className="space-y-6">
      {/* Top Header & Campus Scope Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-800 dark:text-zinc-100 flex items-center gap-2 flex-wrap">
            <span>Pending Campus Deliveries</span>
            <span className="text-xs font-bold text-orange-600 bg-orange-50 dark:bg-orange-950/30 px-2.5 py-0.5 rounded-full border border-orange-200 dark:border-orange-900/50">
              {arrangedAvailableJobs.length} of {availableJobsTotalCount} Available
            </span>
            {directOffersCount > 0 && (
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {directOffersCount} Direct Contract{directOffersCount > 1 ? "s" : ""}
              </span>
            )}
          </h3>
          <p className="text-xs text-slate-500">
            Dispatch orders awaiting courier acceptance on campus
          </p>
        </div>

        {/* Scope toggle */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-zinc-800/80 rounded-2xl shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setScopeCampusFilter("all")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer border-none",
              scopeCampusFilter === "all"
                ? "bg-white dark:bg-zinc-900 text-orange-600 shadow-xs"
                : "text-slate-500 hover:text-slate-700 dark:text-zinc-400"
            )}
          >
            All Campus Orders
          </button>
          <button
            type="button"
            onClick={() => setScopeCampusFilter("covered")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer border-none",
              scopeCampusFilter === "covered"
                ? "bg-white dark:bg-zinc-900 text-orange-600 shadow-xs"
                : "text-slate-500 hover:text-slate-700 dark:text-zinc-400"
            )}
          >
            My Covered Campuses
          </button>
        </div>
      </div>

      {/* Arrangement & Controls Toolbar */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/70 dark:border-zinc-800/70 p-3.5 sm:p-4 rounded-3xl shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by order ref (#123), item, merchant, buyer, or campus..."
              value={availableSearchQuery}
              onChange={(e) => setAvailableSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-8 text-xs bg-slate-50 dark:bg-zinc-850/80 border border-slate-200 dark:border-zinc-700 rounded-xl outline-none focus:border-orange-500 focus:bg-white dark:focus:bg-zinc-900 text-slate-800 dark:text-zinc-100 placeholder:text-slate-400"
            />
            {availableSearchQuery && (
              <button
                type="button"
                onClick={() => setAvailableSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 p-1 cursor-pointer bg-transparent border-none"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-2 shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Sort:</span>
            <select
              value={availableSortBy}
              onChange={(e) => setAvailableSortBy(e.target.value as any)}
              className="h-10 px-3 text-xs font-bold bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-700 rounded-xl outline-none focus:border-orange-500 text-slate-700 dark:text-zinc-200 cursor-pointer"
            >
              <option value="direct_first">⭐ Direct Offers First</option>
              <option value="newest">⏱️ Newest Dispatches First</option>
              <option value="oldest">⏳ Oldest First (Needs Dispatch)</option>
              <option value="highest_fare">💰 Highest Fare (₦)</option>
            </select>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none border-t border-slate-100 dark:border-zinc-850">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">Filter:</span>
          <button
            type="button"
            onClick={() => setAvailableTypeFilter("all")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer border",
              availableTypeFilter === "all"
                ? "bg-orange-600 text-white border-orange-600 shadow-xs"
                : "bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:bg-slate-100"
            )}
          >
            All Orders ({availableJobsTotalCount})
          </button>
          <button
            type="button"
            onClick={() => setAvailableTypeFilter("direct")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer border flex items-center gap-1.5",
              availableTypeFilter === "direct"
                ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                : "bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:bg-slate-100"
            )}
          >
            <span>⭐ Direct Contract Offers</span>
            <span className={cn(
              "px-1.5 py-0.2 rounded-full text-[10px]",
              availableTypeFilter === "direct" ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
            )}>
              {directOffersCount}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setAvailableTypeFilter("open")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer border flex items-center gap-1.5",
              availableTypeFilter === "open"
                ? "bg-slate-900 dark:bg-zinc-100 text-white dark:text-slate-900 border-slate-900 dark:border-zinc-100 shadow-xs"
                : "bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:bg-slate-100"
            )}
          >
            <span>🌐 Open Campus Pool</span>
            <span className={cn(
              "px-1.5 py-0.2 rounded-full text-[10px]",
              availableTypeFilter === "open" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700 dark:bg-zinc-700 dark:text-zinc-300"
            )}>
              {openPoolCount}
            </span>
          </button>
        </div>
      </div>

      {/* Orders Presentation */}
      {arrangedAvailableJobs.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-dashed border-slate-200 dark:border-zinc-800 rounded-[2.5rem] p-12 text-center space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-orange-50 dark:bg-orange-950/20 text-orange-600 flex items-center justify-center mx-auto">
            <Package className="w-8 h-8" />
          </div>
          <h4 className="font-bold text-slate-700 dark:text-zinc-300">
            {availableSearchQuery.trim() || availableTypeFilter !== "all" 
              ? "No orders match your filter criteria" 
              : "No unassigned orders right now"}
          </h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {availableSearchQuery.trim() || availableTypeFilter !== "all"
              ? "Try resetting your search query or switching to 'All Orders'."
              : scopeCampusFilter === "covered"
              ? "No pending orders found on your selected covered campuses. Try switching to 'All Campus Orders'."
              : "New orders will appear here automatically when sellers request campus delivery."}
          </p>
          {(availableSearchQuery.trim() || availableTypeFilter !== "all") && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setAvailableSearchQuery("");
                  setAvailableTypeFilter("all");
                }}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs border-none"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {arrangedAvailableJobs.map((job, jIdx) => {
            const isDirectOffer = 
              job.logisticsId === companyProfile.id || 
              (!!job.logisticsName && !!companyProfile.companyName && job.logisticsName.toLowerCase().trim() === companyProfile.companyName.toLowerCase().trim());

            return (
              <div 
                key={`avail-job-${job.id || jIdx}-${jIdx}`} 
                className={cn(
                  "bg-white dark:bg-zinc-900 p-5 sm:p-6 rounded-[2rem] shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 border",
                  isDirectOffer 
                    ? "border-emerald-500/40 dark:border-emerald-500/40 ring-1 ring-emerald-500/20" 
                    : "border-slate-200/70 dark:border-zinc-800/70"
                )}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-zinc-850 pb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isDirectOffer ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-700 dark:text-emerald-300 uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                            ⭐ Direct Contract Offer
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[9px] font-black text-orange-600 uppercase tracking-wider bg-orange-50 dark:bg-orange-950/30 px-2.5 py-0.5 rounded-full border border-orange-200 dark:border-orange-900/40">
                            🌐 Campus Pool Order
                          </span>
                        )}
                        <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatJobTime(job.createdAt)}
                        </span>
                      </div>
                      <h4 className="font-black text-slate-800 dark:text-zinc-100 text-sm sm:text-base line-clamp-1">
                        {job.productName} (x{job.quantity || 1})
                      </h4>
                      <p className="text-[10px] font-bold text-slate-400">
                        Order Ref: #{job.orderId.slice(-6).toUpperCase()} • Campus: {job.campus}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Fare Paid</span>
                      <span className="font-black text-orange-600 text-base">₦{job.deliveryPrice.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Journey Details */}
                  <div className="space-y-2.5 text-xs">
                    <div className="flex gap-2.5 items-start p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-850/50">
                      <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-200 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                        A
                      </div>
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-slate-500 uppercase tracking-wider text-[9px]">Pickup Location (Merchant)</p>
                          {job.sellerPhone && (
                            <a
                              href={`tel:${job.sellerPhone}`}
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-600 dark:text-orange-400 hover:underline"
                            >
                              <Phone className="w-2.5 h-2.5" /> Call ({job.sellerPhone})
                            </a>
                          )}
                        </div>
                        <p className="font-bold text-slate-800 dark:text-zinc-200 truncate">
                          {job.sellerName} {job.sellerPhone ? `• ${job.sellerPhone}` : ""}
                        </p>
                        <p className="text-slate-400 text-[11px] truncate">{job.sellerAddress}</p>
                      </div>
                    </div>

                    <div className="flex gap-2.5 items-start p-2.5 rounded-xl bg-orange-50/50 dark:bg-orange-950/10 border border-orange-100/50 dark:border-orange-900/20">
                      <div className="w-5 h-5 rounded-full bg-orange-600 text-white flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                        B
                      </div>
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-orange-600 uppercase tracking-wider text-[9px]">Dropoff Destination (Buyer)</p>
                          {job.buyerPhone && (
                            <a
                              href={`tel:${job.buyerPhone}`}
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-600 hover:underline"
                            >
                              <Phone className="w-2.5 h-2.5" /> Call ({job.buyerPhone})
                            </a>
                          )}
                        </div>
                        <p className="font-bold text-slate-800 dark:text-zinc-200 truncate">
                          {job.buyerName} {job.buyerPhone ? `• ${job.buyerPhone}` : ""}
                        </p>
                        <p className="text-slate-400 text-[11px] truncate">{job.buyerAddress}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Acceptance / Actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-zinc-850 space-y-2">
                  {jobAcceptingId === job.id ? (
                    <div className="space-y-3 bg-gradient-to-br from-orange-50/90 to-amber-50/70 dark:from-orange-950/30 dark:to-zinc-900/60 p-3.5 sm:p-4 rounded-2xl border border-orange-200/80 dark:border-orange-900/50 shadow-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                          <span className="text-xs font-black text-slate-800 dark:text-zinc-100 uppercase tracking-wider">
                            Decide Order Turnaround
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setJobAcceptingId(null)}
                          className="text-[11px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 cursor-pointer bg-transparent border-none"
                        >
                          Cancel
                        </button>
                      </div>

                      <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-snug">
                        Turnaround time depends on the product type, pickup point, and destination. Select or enter the realistic turnaround for this order before confirming:
                      </p>

                      {/* Route & Product quick context */}
                      <div className="p-2.5 rounded-xl bg-white/90 dark:bg-zinc-850/80 border border-orange-100/70 dark:border-zinc-800 text-[10px] space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-zinc-200 truncate">
                          <Package className="w-3 h-3 text-orange-500 shrink-0" />
                          <span>{job.productName} (x{job.quantity || 1})</span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-slate-500 dark:text-zinc-400">
                          <span className="truncate">📍 Pickup: <strong className="text-slate-700 dark:text-zinc-300">{job.sellerAddress}</strong></span>
                          <span className="truncate">🏁 Dropoff: <strong className="text-slate-700 dark:text-zinc-300">{job.buyerAddress}</strong></span>
                        </div>
                      </div>

                      {/* Quick turnaround presets */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Select Turnaround:</span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                          {[
                            "30-45 Mins (Fast Campus)",
                            "1-2 Hours (Standard)",
                            "2-3 Hours (Distant/Hostel)",
                            "Today by 5:00 PM",
                            "Today by 8:00 PM",
                            "Next Day Morning"
                          ].map((preset, pIdx) => (
                            <button
                              key={`eta-preset-${preset}-${pIdx}`}
                              type="button"
                              onClick={() => setJobEtaInput(preset)}
                              className={cn(
                                "py-1 px-1.5 rounded-lg text-[10px] font-bold transition-all border cursor-pointer truncate text-left",
                                jobEtaInput === preset
                                  ? "bg-orange-600 text-white border-orange-600 shadow-xs"
                                  : "bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:border-orange-300"
                              )}
                            >
                              {preset}
                            </button>
                          ))}
                        </div>
                      </div>

                      <input
                        type="text"
                        placeholder="Or custom turnaround (e.g. 45 mins after merchant handover)"
                        value={jobEtaInput}
                        onChange={(e) => setJobEtaInput(e.target.value)}
                        className="w-full h-8 px-2.5 text-xs bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg outline-none focus:border-orange-500"
                      />

                      <button
                        type="button"
                        disabled={loading || !jobEtaInput.trim()}
                        onClick={() => handleAcceptJob(job.id, jobEtaInput.trim() || "1-2 Hours")}
                        className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs border-none disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" /> Confirm & Accept Delivery
                      </button>
                    </div>
                  ) : isDirectOffer ? (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setJobAcceptingId(job.id);
                          setJobEtaInput("1-2 Hours (Standard)");
                        }}
                        className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs border-none"
                      >
                        <Check className="w-4 h-4" />
                        Accept Offer
                      </button>
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => handleDeclineJob(job.id)}
                        className="flex-1 h-11 bg-red-100 dark:bg-red-950/30 hover:bg-red-200 text-red-700 dark:text-red-400 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none"
                      >
                        <X className="w-4 h-4" />
                        Decline Offer
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setJobAcceptingId(job.id);
                        setJobEtaInput("1-2 Hours (Standard)");
                      }}
                      className="w-full h-11 bg-slate-900 dark:bg-zinc-800 hover:bg-orange-600 hover:dark:bg-orange-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs border-none"
                    >
                      <Truck className="w-4 h-4" />
                      Accept Delivery Contract
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
