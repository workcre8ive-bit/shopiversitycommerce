import React from "react";
import { 
  CheckCircle2, 
  XCircle, 
  Search, 
  ArrowUpDown, 
  X, 
  DollarSign, 
  PackageCheck, 
  AlertTriangle,
  Calendar,
  Clock
} from "lucide-react";
import { cn } from "../../lib/utils";
import type { DeliveryJob, LogisticsCompany } from "./types";

interface DeliveryHistoryViewProps {
  companyProfile: LogisticsCompany;
  deliveryHistory: DeliveryJob[];
  arrangedDeliveryHistory: DeliveryJob[];
  historyStatusFilter: "all" | "delivered" | "cancelled";
  setHistoryStatusFilter: (val: "all" | "delivered" | "cancelled") => void;
  historySortBy: "newest" | "oldest" | "highest_fare";
  setHistorySortBy: (val: "newest" | "oldest" | "highest_fare") => void;
  historySearchQuery: string;
  setHistorySearchQuery: (val: string) => void;
  historyDeliveredCount: number;
  historyCancelledCount: number;
  formatJobTime: (timestamp?: string) => string;
}

export const DeliveryHistoryView: React.FC<DeliveryHistoryViewProps> = ({
  companyProfile,
  deliveryHistory,
  arrangedDeliveryHistory,
  historyStatusFilter,
  setHistoryStatusFilter,
  historySortBy,
  setHistorySortBy,
  historySearchQuery,
  setHistorySearchQuery,
  historyDeliveredCount,
  historyCancelledCount,
  formatJobTime,
}) => {
  const totalSettledEarnings = deliveryHistory
    .filter(j => j.status === "delivered")
    .reduce((sum, j) => sum + (j.deliveryPrice || 0), 0);

  return (
    <div className="space-y-6">
      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-slate-200/60 dark:border-zinc-800/60 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Settled Earnings</p>
            <strong className="text-2xl font-black text-slate-800 dark:text-zinc-100 mt-0.5 block">
              ₦{totalSettledEarnings.toLocaleString()}
            </strong>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-slate-200/60 dark:border-zinc-800/60 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 flex items-center justify-center shrink-0">
            <PackageCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Completed Deliveries</p>
            <strong className="text-2xl font-black text-slate-800 dark:text-zinc-100 mt-0.5 block">
              {historyDeliveredCount} orders
            </strong>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-slate-200/60 dark:border-zinc-800/60 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/30 text-red-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Cancelled Orders</p>
            <strong className="text-2xl font-black text-slate-800 dark:text-zinc-100 mt-0.5 block">
              {historyCancelledCount} jobs
            </strong>
          </div>
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
              placeholder="Search historical logs by ref, item, merchant, buyer..."
              value={historySearchQuery}
              onChange={(e) => setHistorySearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-8 text-xs bg-slate-50 dark:bg-zinc-850/80 border border-slate-200 dark:border-zinc-700 rounded-xl outline-none focus:border-orange-500 focus:bg-white dark:focus:bg-zinc-900 text-slate-800 dark:text-zinc-100 placeholder:text-slate-400"
            />
            {historySearchQuery && (
              <button
                type="button"
                onClick={() => setHistorySearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 p-1 cursor-pointer bg-transparent border-none"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Sort:</span>
            <select
              value={historySortBy}
              onChange={(e) => setHistorySortBy(e.target.value as any)}
              className="h-10 px-3 text-xs font-bold bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-700 rounded-xl outline-none focus:border-orange-500 text-slate-700 dark:text-zinc-200 cursor-pointer"
            >
              <option value="newest">⏱️ Newest Completed First</option>
              <option value="oldest">⏳ Oldest First</option>
              <option value="highest_fare">💰 Highest Fare (₦)</option>
            </select>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none border-t border-slate-100 dark:border-zinc-850">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">Status:</span>
          <button
            type="button"
            onClick={() => setHistoryStatusFilter("all")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer border",
              historyStatusFilter === "all"
                ? "bg-slate-900 dark:bg-zinc-100 text-white dark:text-slate-900 border-slate-900 dark:border-zinc-100 shadow-xs"
                : "bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:bg-slate-100"
            )}
          >
            All Logs ({deliveryHistory.length})
          </button>
          <button
            type="button"
            onClick={() => setHistoryStatusFilter("delivered")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer border flex items-center gap-1.5",
              historyStatusFilter === "delivered"
                ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                : "bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:bg-slate-100"
            )}
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>Delivered</span>
            <span className={cn(
              "px-1.5 py-0.2 rounded-full text-[10px]",
              historyStatusFilter === "delivered" ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
            )}>
              {historyDeliveredCount}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setHistoryStatusFilter("cancelled")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer border flex items-center gap-1.5",
              historyStatusFilter === "cancelled"
                ? "bg-red-600 text-white border-red-600 shadow-xs"
                : "bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:bg-slate-100"
            )}
          >
            <XCircle className="w-3 h-3" />
            <span>Cancelled</span>
            <span className={cn(
              "px-1.5 py-0.2 rounded-full text-[10px]",
              historyStatusFilter === "cancelled" ? "bg-white/20 text-white" : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
            )}>
              {historyCancelledCount}
            </span>
          </button>
        </div>
      </div>

      {/* History Presentation */}
      {arrangedDeliveryHistory.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/60 rounded-[2.5rem] p-10 text-center text-slate-400 text-xs">
          {historySearchQuery.trim() || historyStatusFilter !== "all"
            ? "No historical records match your filter criteria."
            : "No previous delivery logs recorded."}
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/60 rounded-[2.5rem] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-zinc-850 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-zinc-800">
                  <th className="px-6 py-4">Item & Order Ref</th>
                  <th className="px-6 py-4">Pickup / Buyer Route</th>
                  <th className="px-6 py-4">Date Completed</th>
                  <th className="px-6 py-4">Fare Settled</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-zinc-850">
                {arrangedDeliveryHistory.map((job, hIdx) => (
                  <tr 
                    key={`hist-job-${job.id || hIdx}-${hIdx}`} 
                    className="text-xs hover:bg-slate-50/60 dark:hover:bg-zinc-850/40 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800 dark:text-zinc-100">{job.productName} (x{job.quantity || 1})</p>
                      <p className="text-[10px] text-slate-400 font-medium">
                        Order #{job.orderId.slice(-6).toUpperCase()} • {job.campus}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-700 dark:text-zinc-300">Pickup: {job.sellerName}</p>
                      <p className="text-[10px] text-slate-400 font-medium truncate max-w-xs">Dropoff: {job.buyerName} ({job.buyerAddress})</p>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-[11px] font-medium whitespace-nowrap">
                      {formatJobTime(job.updatedAt || job.createdAt)}
                    </td>
                    <td className="px-6 py-4 font-black text-orange-600 text-sm whitespace-nowrap">
                      ₦{job.deliveryPrice.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider inline-flex items-center gap-1",
                        job.status === "delivered" 
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" 
                          : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                      )}>
                        {job.status === "delivered" ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {job.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
