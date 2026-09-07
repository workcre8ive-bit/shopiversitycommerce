import React from "react";
import { 
  Truck, 
  MapPin, 
  Clock, 
  CheckCircle, 
  Phone, 
  ArrowRight, 
  ShieldCheck, 
  Search, 
  ArrowUpDown, 
  X, 
  Kanban, 
  List, 
  Package,
  AlertCircle
} from "lucide-react";
import { cn } from "../../lib/utils";
import type { DeliveryJob, LogisticsCompany } from "./types";

interface ActiveDeliveriesViewProps {
  companyProfile: LogisticsCompany;
  activeDeliveries: DeliveryJob[];
  arrangedActiveDeliveries: DeliveryJob[];
  activeStageFilter: "all" | "accepted" | "picked_up" | "in_transit";
  setActiveStageFilter: (val: "all" | "accepted" | "picked_up" | "in_transit") => void;
  activeSortBy: "pipeline" | "urgent" | "newest" | "oldest" | "highest_fare";
  setActiveSortBy: (val: "pipeline" | "urgent" | "newest" | "oldest" | "highest_fare") => void;
  activeSearchQuery: string;
  setActiveSearchQuery: (val: string) => void;
  activeViewMode: "pipeline" | "list";
  setActiveViewMode: (val: "pipeline" | "list") => void;
  stageAcceptedCount: number;
  stagePickedUpCount: number;
  stageInTransitCount: number;
  handleUpdateStatus: (jobId: string, currentStatus: DeliveryJob["status"]) => Promise<void>;
  setOtpModalJob: (job: DeliveryJob) => void;
  setOtpInput: (val: string) => void;
  setOtpError: (val: string | null) => void;
  loading: boolean;
  formatJobTime: (timestamp?: string) => string;
}

export const ActiveDeliveriesView: React.FC<ActiveDeliveriesViewProps> = ({
  companyProfile,
  activeDeliveries,
  arrangedActiveDeliveries,
  activeStageFilter,
  setActiveStageFilter,
  activeSortBy,
  setActiveSortBy,
  activeSearchQuery,
  setActiveSearchQuery,
  activeViewMode,
  setActiveViewMode,
  stageAcceptedCount,
  stagePickedUpCount,
  stageInTransitCount,
  handleUpdateStatus,
  setOtpModalJob,
  setOtpInput,
  setOtpError,
  loading,
  formatJobTime,
}) => {
  const renderJobActionBtn = (job: DeliveryJob) => {
    if (job.status === "accepted") {
      return (
        <button
          type="button"
          disabled={loading}
          onClick={() => handleUpdateStatus(job.id, job.status)}
          className="w-full h-11 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md shadow-purple-600/20 cursor-pointer border-none active:scale-95"
        >
          <Truck className="w-4 h-4" />
          Product Handed Over by Seller (Move to Transit)
        </button>
      );
    }

    if (job.status === "picked_up") {
      return (
        <button
          type="button"
          disabled={loading}
          onClick={() => handleUpdateStatus(job.id, job.status)}
          className="w-full h-11 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md shadow-orange-500/20 cursor-pointer border-none active:scale-95"
        >
          <MapPin className="w-4 h-4" />
          Out for Delivery
        </button>
      );
    }

    if (job.status === "in_transit") {
      return (
        <button
          type="button"
          disabled={loading}
          onClick={() => {
            setOtpModalJob(job);
            setOtpInput("");
            setOtpError(null);
          }}
          className="w-full h-11 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer border-none active:scale-95"
        >
          <ShieldCheck className="w-4 h-4" />
          Verify Delivery PIN & Deliver to Buyer
        </button>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6">
      {/* Top Header & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-800 dark:text-zinc-100 flex items-center gap-2 flex-wrap">
            <span>Live Delivery Shipments</span>
            <span className="text-xs font-bold text-orange-600 bg-orange-50 dark:bg-orange-950/30 px-2.5 py-0.5 rounded-full border border-orange-200 dark:border-orange-900/50">
              {activeDeliveries.length} In Progress
            </span>
          </h3>
          <p className="text-xs text-slate-500">
            Advance fulfillment stages: Seller Handover → In Transit → Out for Delivery → PIN Verification
          </p>
        </div>

        {/* View Mode Switcher: Pipeline Board vs List View */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-zinc-800/80 rounded-2xl shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveViewMode("pipeline")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer border-none flex items-center gap-1.5",
              activeViewMode === "pipeline"
                ? "bg-white dark:bg-zinc-900 text-orange-600 shadow-xs"
                : "text-slate-500 hover:text-slate-700 dark:text-zinc-400"
            )}
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>Pipeline Board</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveViewMode("list")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer border-none flex items-center gap-1.5",
              activeViewMode === "list"
                ? "bg-white dark:bg-zinc-900 text-orange-600 shadow-xs"
                : "text-slate-500 hover:text-slate-700 dark:text-zinc-400"
            )}
          >
            <List className="w-3.5 h-3.5" />
            <span>List View</span>
          </button>
        </div>
      </div>

      {/* Arrangement Toolbar (Search, Filter, Sort) */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/70 dark:border-zinc-800/70 p-3.5 sm:p-4 rounded-3xl shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search active orders by ref, product, merchant, buyer, or address..."
              value={activeSearchQuery}
              onChange={(e) => setActiveSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-8 text-xs bg-slate-50 dark:bg-zinc-850/80 border border-slate-200 dark:border-zinc-700 rounded-xl outline-none focus:border-orange-500 focus:bg-white dark:focus:bg-zinc-900 text-slate-800 dark:text-zinc-100 placeholder:text-slate-400"
            />
            {activeSearchQuery && (
              <button
                type="button"
                onClick={() => setActiveSearchQuery("")}
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
              value={activeSortBy}
              onChange={(e) => setActiveSortBy(e.target.value as any)}
              className="h-10 px-3 text-xs font-bold bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-700 rounded-xl outline-none focus:border-orange-500 text-slate-700 dark:text-zinc-200 cursor-pointer"
            >
              <option value="pipeline">📋 Sequential Flow (Seller Pickup → Transit → Handover)</option>
              <option value="urgent">⚡ Urgent Handover (Out for Delivery First)</option>
              <option value="newest">⏱️ Newest Updated First</option>
              <option value="oldest">⏳ Oldest First</option>
              <option value="highest_fare">💰 Highest Fare (₦)</option>
            </select>
          </div>
        </div>

        {/* Stage Filter Chips (especially useful in List view) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none border-t border-slate-100 dark:border-zinc-850">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">Stage:</span>
          <button
            type="button"
            onClick={() => setActiveStageFilter("all")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer border",
              activeStageFilter === "all"
                ? "bg-slate-900 dark:bg-zinc-100 text-white dark:text-slate-900 border-slate-900 dark:border-zinc-100 shadow-xs"
                : "bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:bg-slate-100"
            )}
          >
            All Active ({activeDeliveries.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveStageFilter("accepted")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer border flex items-center gap-1.5",
              activeStageFilter === "accepted"
                ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                : "bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:bg-slate-100"
            )}
          >
            <Clock className="w-3 h-3" />
            <span>1. Awaiting Pickup</span>
            <span className={cn(
              "px-1.5 py-0.2 rounded-full text-[10px]",
              activeStageFilter === "accepted" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
            )}>
              {stageAcceptedCount}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveStageFilter("picked_up")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer border flex items-center gap-1.5",
              activeStageFilter === "picked_up"
                ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                : "bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:bg-slate-100"
            )}
          >
            <Truck className="w-3 h-3" />
            <span>2. In Transit</span>
            <span className={cn(
              "px-1.5 py-0.2 rounded-full text-[10px]",
              activeStageFilter === "picked_up" ? "bg-white/20 text-white" : "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
            )}>
              {stagePickedUpCount}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveStageFilter("in_transit")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer border flex items-center gap-1.5",
              activeStageFilter === "in_transit"
                ? "bg-orange-600 text-white border-orange-600 shadow-xs"
                : "bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:bg-slate-100"
            )}
          >
            <MapPin className="w-3 h-3" />
            <span>3. Out for Delivery</span>
            <span className={cn(
              "px-1.5 py-0.2 rounded-full text-[10px]",
              activeStageFilter === "in_transit" ? "bg-white/20 text-white" : "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300"
            )}>
              {stageInTransitCount}
            </span>
          </button>
        </div>
      </div>

      {/* Content Rendering: Empty State, Pipeline Board, or List View */}
      {activeDeliveries.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-dashed border-slate-200 dark:border-zinc-800 rounded-[2.5rem] p-12 text-center space-y-3">
          <Truck className="w-16 h-16 text-slate-300 mx-auto animate-pulse" />
          <h4 className="font-bold text-slate-700 dark:text-zinc-300">No active shipments in progress</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Accept pending delivery contracts from the 'Available Jobs' tab to start dispatching orders.
          </p>
        </div>
      ) : arrangedActiveDeliveries.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-dashed border-slate-200 dark:border-zinc-800 rounded-[2.5rem] p-10 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="font-bold text-slate-700 dark:text-zinc-300">No shipments match your filter</h4>
          <p className="text-xs text-slate-400">Try changing your search query or selecting 'All Active'.</p>
          <button
            type="button"
            onClick={() => {
              setActiveSearchQuery("");
              setActiveStageFilter("all");
            }}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs border-none"
          >
            Clear Filters
          </button>
        </div>
      ) : activeViewMode === "pipeline" ? (
        /* PIPELINE BOARD MODE: 3-STAGE KANBAN ARRANGEMENT */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
          {/* COLUMN 1: AWAITING PICKUP FROM SELLER */}
          <div className="bg-slate-50/70 dark:bg-zinc-900/50 p-4 rounded-3xl border border-amber-200/60 dark:border-amber-900/30 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-amber-200/40 dark:border-amber-900/20">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-black text-xs">
                  1
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-800 dark:text-zinc-100 uppercase tracking-wider">
                    Awaiting Seller Handover
                  </h4>
                  <p className="text-[10px] text-slate-400">Collect package from merchant</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                {stageAcceptedCount}
              </span>
            </div>

            <div className="space-y-3 min-h-[120px]">
              {arrangedActiveDeliveries
                .filter(job => job.status === "accepted")
                .map((job, idx) => (
                  <div
                    key={`col1-${job.id}-${idx}`}
                    className="bg-white dark:bg-zinc-850 p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-700/80 shadow-xs hover:shadow-md transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-zinc-800 pb-2.5">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block">
                          Ref: #{job.orderId.slice(-6).toUpperCase()}
                        </span>
                        <h5 className="text-xs font-black text-slate-800 dark:text-zinc-100 line-clamp-1">
                          {job.productName} (x{job.quantity || 1})
                        </h5>
                      </div>
                      <span className="font-black text-orange-600 text-xs shrink-0">
                        ₦{job.deliveryPrice.toLocaleString()}
                      </span>
                    </div>

                    <div className="space-y-2 text-[11px]">
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-800/60">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase">
                          <span>Pickup Merchant</span>
                          {job.sellerPhone && (
                            <a href={`tel:${job.sellerPhone}`} className="text-orange-600 hover:underline flex items-center gap-1">
                              <Phone className="w-2.5 h-2.5" /> Call
                            </a>
                          )}
                        </div>
                        <p className="font-bold text-slate-700 dark:text-zinc-200 truncate">{job.sellerName}</p>
                        <p className="text-slate-400 text-[10px] truncate">{job.sellerAddress}</p>
                      </div>

                      <div className="p-2 rounded-xl bg-orange-50/40 dark:bg-orange-950/20 border border-orange-100/40 dark:border-orange-900/20">
                        <div className="flex items-center justify-between text-[10px] font-bold text-orange-600 uppercase">
                          <span>Buyer Destination</span>
                          {job.buyerPhone && (
                            <a href={`tel:${job.buyerPhone}`} className="text-orange-600 hover:underline flex items-center gap-1">
                              <Phone className="w-2.5 h-2.5" /> Call
                            </a>
                          )}
                        </div>
                        <p className="font-bold text-slate-700 dark:text-zinc-200 truncate">{job.buyerName}</p>
                        <p className="text-slate-400 text-[10px] truncate">{job.buyerAddress}</p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-zinc-800">
                      {renderJobActionBtn(job)}
                    </div>
                  </div>
                ))}
              {arrangedActiveDeliveries.filter(job => job.status === "accepted").length === 0 && (
                <div className="text-center py-8 text-xs text-slate-400 font-medium">
                  No orders currently awaiting pickup
                </div>
              )}
            </div>
          </div>

          {/* COLUMN 2: IN TRANSIT TO DESTINATION */}
          <div className="bg-slate-50/70 dark:bg-zinc-900/50 p-4 rounded-3xl border border-purple-200/60 dark:border-purple-900/30 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-purple-200/40 dark:border-purple-900/20">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-black text-xs">
                  2
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-800 dark:text-zinc-100 uppercase tracking-wider">
                    In Transit
                  </h4>
                  <p className="text-[10px] text-slate-400">Package with courier en route</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                {stagePickedUpCount}
              </span>
            </div>

            <div className="space-y-3 min-h-[120px]">
              {arrangedActiveDeliveries
                .filter(job => job.status === "picked_up")
                .map((job, idx) => (
                  <div
                    key={`col2-${job.id}-${idx}`}
                    className="bg-white dark:bg-zinc-850 p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-700/80 shadow-xs hover:shadow-md transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-zinc-800 pb-2.5">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block">
                          Ref: #{job.orderId.slice(-6).toUpperCase()}
                        </span>
                        <h5 className="text-xs font-black text-slate-800 dark:text-zinc-100 line-clamp-1">
                          {job.productName} (x{job.quantity || 1})
                        </h5>
                      </div>
                      <span className="font-black text-orange-600 text-xs shrink-0">
                        ₦{job.deliveryPrice.toLocaleString()}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-purple-50/40 dark:bg-purple-950/20 border border-purple-100/40 dark:border-purple-900/20 space-y-1 text-[11px]">
                      <div className="flex items-center justify-between text-[10px] font-bold text-purple-600 uppercase">
                        <span>Dropoff Destination</span>
                        {job.buyerPhone && (
                          <a href={`tel:${job.buyerPhone}`} className="text-purple-600 hover:underline flex items-center gap-1 font-bold">
                            <Phone className="w-2.5 h-2.5" /> Call Buyer ({job.buyerPhone})
                          </a>
                        )}
                      </div>
                      <p className="font-bold text-slate-700 dark:text-zinc-200">{job.buyerName}</p>
                      <p className="text-slate-500 text-[10px] leading-relaxed">{job.buyerAddress}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-zinc-800">
                      {renderJobActionBtn(job)}
                    </div>
                  </div>
                ))}
              {arrangedActiveDeliveries.filter(job => job.status === "picked_up").length === 0 && (
                <div className="text-center py-8 text-xs text-slate-400 font-medium">
                  No orders currently in transit
                </div>
              )}
            </div>
          </div>

          {/* COLUMN 3: OUT FOR DELIVERY / ARRIVED AT BUYER */}
          <div className="bg-slate-50/70 dark:bg-zinc-900/50 p-4 rounded-3xl border border-orange-200/60 dark:border-orange-900/30 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-orange-200/40 dark:border-orange-900/20">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center font-black text-xs">
                  3
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-800 dark:text-zinc-100 uppercase tracking-wider">
                    Out for Delivery
                  </h4>
                  <p className="text-[10px] text-slate-400">Arrived at doorstep • PIN required</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300">
                {stageInTransitCount}
              </span>
            </div>

            <div className="space-y-3 min-h-[120px]">
              {arrangedActiveDeliveries
                .filter(job => job.status === "in_transit")
                .map((job, idx) => (
                  <div
                    key={`col3-${job.id}-${idx}`}
                    className="bg-white dark:bg-zinc-850 p-4 rounded-2xl border border-orange-300/80 dark:border-orange-800/80 shadow-xs hover:shadow-md transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-zinc-800 pb-2.5">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block">
                          Ref: #{job.orderId.slice(-6).toUpperCase()}
                        </span>
                        <h5 className="text-xs font-black text-slate-800 dark:text-zinc-100 line-clamp-1">
                          {job.productName} (x{job.quantity || 1})
                        </h5>
                      </div>
                      <span className="font-black text-orange-600 text-xs shrink-0">
                        ₦{job.deliveryPrice.toLocaleString()}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-orange-50/60 dark:bg-orange-950/30 border border-orange-200/50 dark:border-orange-900/30 space-y-1 text-[11px]">
                      <div className="flex items-center justify-between text-[10px] font-bold text-orange-600 uppercase">
                        <span>Buyer Location</span>
                        {job.buyerPhone && (
                          <a href={`tel:${job.buyerPhone}`} className="text-orange-600 hover:underline flex items-center gap-1 font-bold">
                            <Phone className="w-2.5 h-2.5" /> Call Buyer ({job.buyerPhone})
                          </a>
                        )}
                      </div>
                      <p className="font-bold text-slate-800 dark:text-zinc-100">{job.buyerName}</p>
                      <p className="text-slate-600 dark:text-zinc-300 text-[10px] leading-relaxed">{job.buyerAddress}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-zinc-800">
                      {renderJobActionBtn(job)}
                    </div>
                  </div>
                ))}
              {arrangedActiveDeliveries.filter(job => job.status === "in_transit").length === 0 && (
                <div className="text-center py-8 text-xs text-slate-400 font-medium">
                  No orders currently out for delivery
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* DETAILED LIST VIEW */
        <div className="space-y-4">
          {arrangedActiveDeliveries.map((job, aIdx) => (
            <div 
              key={`active-job-${job.id || aIdx}-${aIdx}`} 
              className="bg-white dark:bg-zinc-900 border border-slate-200/70 dark:border-zinc-800/70 p-6 rounded-[2.5rem] shadow-xs space-y-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-zinc-850 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                      job.status === "accepted" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20" :
                      job.status === "picked_up" ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20" :
                      job.status === "in_transit" ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20" :
                      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                    )}>
                      {job.status === "accepted" ? <Clock className="w-3.5 h-3.5" /> :
                       job.status === "picked_up" ? <Truck className="w-3.5 h-3.5" /> :
                       job.status === "in_transit" ? <MapPin className="w-3.5 h-3.5" /> :
                       <CheckCircle className="w-3.5 h-3.5" />}
                      {job.status === "accepted" ? "Awaiting Handover from Seller" :
                       job.status === "picked_up" ? "In Transit" :
                       job.status === "in_transit" ? "Out for Delivery" : "Delivered"}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      Updated {formatJobTime(job.updatedAt || job.createdAt)}
                    </span>
                  </div>
                  <h4 className="text-base font-black text-slate-800 dark:text-zinc-100">
                    {job.productName} (x{job.quantity || 1})
                  </h4>
                  <p className="text-xs font-medium text-slate-400">
                    Order Ref: #{job.orderId.slice(-6).toUpperCase()} • Campus: {job.campus}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400 font-bold">Delivery Fare Paid</p>
                  <strong className="text-xl font-black text-orange-600">
                    ₦{job.deliveryPrice.toLocaleString()}
                  </strong>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-850/50">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      Pickup Location (Seller)
                    </span>
                    {job.sellerPhone && (
                      <a
                        href={`tel:${job.sellerPhone}`}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-600 dark:text-orange-400 hover:underline"
                      >
                        <Phone className="w-3 h-3" /> Call Seller ({job.sellerPhone})
                      </a>
                    )}
                  </div>
                  <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                    {job.sellerName} {job.sellerPhone ? `• ${job.sellerPhone}` : ""}
                  </p>
                  <p className="text-xs text-slate-500 leading-relaxed">{job.sellerAddress}</p>
                </div>

                <div className="space-y-2 p-3.5 rounded-2xl bg-orange-50/50 dark:bg-orange-950/10 border border-orange-100/50 dark:border-orange-900/20">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-orange-600 uppercase tracking-wider">
                      Destination (Buyer)
                    </span>
                    {job.buyerPhone && (
                      <a
                        href={`tel:${job.buyerPhone}`}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-600 hover:underline"
                      >
                        <Phone className="w-3 h-3" /> Call Buyer ({job.buyerPhone})
                      </a>
                    )}
                  </div>
                  <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                    {job.buyerName} {job.buyerPhone ? `(${job.buyerPhone})` : ""}
                  </p>
                  <p className="text-xs text-slate-500 leading-relaxed">{job.buyerAddress}</p>
                </div>
              </div>

              {/* Status Stepper Progression Bar & Primary Action Button */}
              <div className="pt-3 border-t border-slate-100 dark:border-zinc-850 flex items-center justify-between flex-wrap gap-4">
                <div className="flex gap-2 items-center text-xs font-semibold text-slate-500 dark:text-slate-400 flex-wrap">
                  <span className={cn(
                    "px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1",
                    job.status === "accepted" 
                      ? "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 ring-2 ring-amber-400/40" 
                      : "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300"
                  )}>
                    1. Accepted
                  </span>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                  <span className={cn(
                    "px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1",
                    job.status === "picked_up" 
                      ? "bg-purple-100 text-purple-900 dark:bg-purple-950/60 dark:text-purple-300 ring-2 ring-purple-400/40" 
                      : (job.status === "in_transit" || job.status === "delivered") 
                      ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300" 
                      : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                  )}>
                    2. In Transit
                  </span>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                  <span className={cn(
                    "px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1",
                    job.status === "in_transit" 
                      ? "bg-orange-100 text-orange-900 dark:bg-orange-950/60 dark:text-orange-300 ring-2 ring-orange-400/40" 
                      : job.status === "delivered" 
                      ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300" 
                      : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                  )}>
                    3. Out for Delivery
                  </span>
                </div>

                <div className="w-full sm:w-auto">
                  {renderJobActionBtn(job)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
