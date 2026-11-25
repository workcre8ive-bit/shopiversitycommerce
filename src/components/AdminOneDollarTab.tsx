import React from "react";
import {
  AlertTriangle,
  Ban,
  CheckCircle,
  Clock,
  DollarSign,
  EyeOff,
  Loader2,
  Package,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Users,
  XCircle
} from "lucide-react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  query,
  updateDoc
} from "firebase/firestore";
import { db } from "../firebase";
import { OneDollarListing, Order, UserProfile } from "../types";
import { computeOneDollarNgn, formatNaira, formatUsd, useOneDollarRate } from "../lib/oneDollarRate";
import { handleFirestoreError, handleListenerError, isFirestoreQuotaError, OperationType } from "../lib/firebase-errors";
import { cn } from "../lib/utils";

interface AdminOneDollarTabProps {
  currentUser: UserProfile | null;
  users: UserProfile[];
  orders: Order[];
  onActionSuccess?: (msg: string) => void;
}

export default function AdminOneDollarTab({
  currentUser,
  users,
  orders,
  onActionSuccess
}: AdminOneDollarTabProps) {
  const { rateInfo, loading: rateLoading, refreshRate } = useOneDollarRate();
  const [listings, setListings] = React.useState<OneDollarListing[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState<"all" | "pending_approval" | "approved" | "rejected" | "deactivated">("all");
  const [processingId, setProcessingId] = React.useState<string | null>(null);
  const [rejectingId, setRejectingId] = React.useState<string | null>(null);
  const [rejectionNote, setRejectionNote] = React.useState("");

  React.useEffect(() => {
    const q = query(collection(db, "oneDollarListings"), limit(150));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as OneDollarListing))
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setListings(docs);
        setLoading(false);
      },
      (err) => {
        setLoading(false);
        if (isFirestoreQuotaError(err)) return;
        handleListenerError(err, OperationType.LIST, "oneDollarListings");
      }
    );
    return () => unsub();
  }, []);

  const oneDollarOrders = React.useMemo(
    () => orders.filter((o) => o.isOneDollar === true).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [orders]
  );

  const metrics = React.useMemo(() => {
    const participatingVendorIds = new Set(listings.map((l) => l.sellerId));
    const approvedLive = listings.filter((l) => l.status === "approved" && l.isActive).length;
    const pendingCount = listings.filter((l) => l.status === "pending_approval").length;
    const validOrders = oneDollarOrders.filter((o) => o.status !== "cancelled");
    const totalSalesNgn = validOrders.reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);
    const escrowedOrders = validOrders.filter((o) => o.escrowSelected !== false && o.escrowStatus === "held").length;
    const disputedOrders = validOrders.filter((o) => o.disputeStatus === "active").length;
    return {
      vendorsCount: participatingVendorIds.size,
      approvedLive,
      pendingCount,
      orderCount: validOrders.length,
      totalSalesNgn,
      escrowedOrders,
      disputedOrders
    };
  }, [listings, oneDollarOrders]);

  const filteredListings = React.useMemo(() => {
    if (statusFilter === "all") return listings;
    return listings.filter((l) => l.status === statusFilter);
  }, [listings, statusFilter]);

  const participatingVendors = React.useMemo(() => {
    const map = new Map<
      string,
      {
        sellerId: string;
        sellerName: string;
        storeName: string;
        totalListings: number;
        liveListings: number;
        ordersCount: number;
        salesNgn: number;
        userRecord?: UserProfile;
      }
    >();

    for (const l of listings) {
      const existing = map.get(l.sellerId) || {
        sellerId: l.sellerId,
        sellerName: l.sellerName,
        storeName: l.storeName || l.sellerName,
        totalListings: 0,
        liveListings: 0,
        ordersCount: 0,
        salesNgn: 0,
        userRecord: users.find((u) => (u.uid || u.id) === l.sellerId)
      };
      existing.totalListings += 1;
      if (l.status === "approved" && l.isActive) existing.liveListings += 1;
      map.set(l.sellerId, existing);
    }

    for (const o of oneDollarOrders) {
      if (o.status === "cancelled") continue;
      const existing = map.get(o.sellerId);
      if (existing) {
        existing.ordersCount += 1;
        existing.salesNgn += Number(o.totalPrice) || 0;
      }
    }

    return Array.from(map.values());
  }, [listings, oneDollarOrders, users]);

  const handleApprove = async (listing: OneDollarListing) => {
    setProcessingId(listing.id);
    try {
      const now = new Date().toISOString();
      await updateDoc(doc(db, "oneDollarListings", listing.id), {
        status: "approved",
        isActive: true,
        rejectionReason: "",
        approvedAt: now,
        approvedBy: currentUser?.email || "Admin",
        updatedAt: now
      });

      await addDoc(collection(db, "notifications"), {
        userId: listing.sellerId,
        title: "One Dollar Listing Approved",
        message: `Your item "${listing.productName}" (${formatUsd(listing.usdPrice)} USD) is now live in the Shopiversity One Dollar section.`,
        type: "system",
        isRead: false,
        createdAt: now
      }).catch(() => {});

      onActionSuccess?.(`Approved "${listing.productName}" for One Dollar.`);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, `oneDollarListings/${listing.id}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (listing: OneDollarListing) => {
    setProcessingId(listing.id);
    try {
      const now = new Date().toISOString();
      const reason = rejectionNote.trim() || "Does not meet One Dollar program eligibility requirements.";
      await updateDoc(doc(db, "oneDollarListings", listing.id), {
        status: "rejected",
        isActive: false,
        rejectionReason: reason,
        rejectedAt: now,
        updatedAt: now
      });

      await addDoc(collection(db, "notifications"), {
        userId: listing.sellerId,
        title: "One Dollar Listing Not Approved",
        message: `Your One Dollar submission "${listing.productName}" was rejected: ${reason}`,
        type: "system",
        isRead: false,
        createdAt: now
      }).catch(() => {});

      setRejectingId(null);
      setRejectionNote("");
      onActionSuccess?.(`Rejected "${listing.productName}".`);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, `oneDollarListings/${listing.id}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeactivateListing = async (listing: OneDollarListing) => {
    setProcessingId(listing.id);
    try {
      await updateDoc(doc(db, "oneDollarListings", listing.id), {
        status: "deactivated",
        isActive: false,
        updatedAt: new Date().toISOString()
      });
      onActionSuccess?.(`Deactivated "${listing.productName}".`);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, `oneDollarListings/${listing.id}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteListing = async (listing: OneDollarListing) => {
    setProcessingId(listing.id);
    try {
      await deleteDoc(doc(db, "oneDollarListings", listing.id));
      onActionSuccess?.(`Removed "${listing.productName}" from One Dollar.`);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.DELETE, `oneDollarListings/${listing.id}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleToggleVendorSuspension = async (sellerId: string, currentlySuspended: boolean) => {
    setProcessingId(`vendor_${sellerId}`);
    try {
      const nextSuspended = !currentlySuspended;
      const now = new Date().toISOString();
      await updateDoc(doc(db, "users", sellerId), {
        oneDollarSuspended: nextSuspended,
        oneDollarSuspensionReason: nextSuspended
          ? "Suspended from One Dollar participation by platform admin."
          : "",
        oneDollarSuspendedAt: nextSuspended ? now : ""
      });

      if (nextSuspended) {
        const vendorActive = listings.filter((l) => l.sellerId === sellerId && l.isActive);
        await Promise.all(
          vendorActive.map((l) =>
            updateDoc(doc(db, "oneDollarListings", l.id), {
              status: "deactivated",
              isActive: false,
              updatedAt: now
            })
          )
        );
      }

      await addDoc(collection(db, "notifications"), {
        userId: sellerId,
        title: nextSuspended ? "One Dollar Access Suspended" : "One Dollar Access Restored",
        message: nextSuspended
          ? "An administrator has suspended your participation in the One Dollar section."
          : "Your access to participate in the One Dollar section has been restored.",
        type: "system",
        isRead: false,
        createdAt: now
      }).catch(() => {});

      onActionSuccess?.(
        nextSuspended
          ? "Vendor suspended from One Dollar and active $1 listings paused."
          : "Vendor reinstated in One Dollar."
      );
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${sellerId}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleAdminEscrowAction = async (order: Order, action: "release" | "refund") => {
    setProcessingId(`order_${order.id}`);
    try {
      const now = new Date().toISOString();
      if (action === "release") {
        await updateDoc(doc(db, "orders", order.id), {
          escrowStatus: "released",
          payoutStatus: "escrow",
          disputeStatus: order.disputeStatus === "active" ? "resolved" : (order.disputeStatus || "none"),
          updatedAt: now
        });
        onActionSuccess?.(`Released escrow for One Dollar order ${order.uniqueOrderId || order.id}.`);
      } else {
        await updateDoc(doc(db, "orders", order.id), {
          escrowStatus: "refunded",
          refundStatus: "approved",
          status: "cancelled",
          disputeStatus: order.disputeStatus === "active" ? "resolved" : (order.disputeStatus || "none"),
          updatedAt: now
        });
        onActionSuccess?.(`Marked One Dollar order ${order.uniqueOrderId || order.id} refunded.`);
      }
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${order.id}`);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-8 text-left">
      {/* Live Rate & Summary Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#ff6b00] text-white text-[10px] font-black uppercase tracking-widest">
            <DollarSign className="w-3.5 h-3.5" />
            One Dollar Administration
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            Moderation, Participating Vendors &amp; Escrow Oversight
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Review voluntary vendor $1 submissions, monitor exchange-rate pricing, and oversee optional escrow orders.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-orange-50/70 dark:bg-orange-950/20 border border-orange-200/80 dark:border-orange-900/40 flex items-center gap-4 shrink-0">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Live Daily $1 Rate</p>
            <p className="text-xl font-black text-[#ff6b00] tabular-nums">
              {rateInfo ? formatNaira(rateInfo.oneDollarNgnPrice) : "Loading..."}
            </p>
            {rateInfo && (
              <p className="text-[10px] text-slate-500">
                {rateInfo.source} • ₦{rateInfo.rate.toLocaleString()}/$1
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={refreshRate}
            disabled={rateLoading}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#ff6b00] cursor-pointer"
            title="Refresh USD to NGN rate"
          >
            <RefreshCw className={cn("w-4 h-4", rateLoading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <p className="text-[10px] font-black uppercase text-slate-400">Vendors</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums mt-1">{metrics.vendorsCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <p className="text-[10px] font-black uppercase text-slate-400">Pending Queue</p>
          <p className="text-2xl font-black text-amber-600 tabular-nums mt-1">{metrics.pendingCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <p className="text-[10px] font-black uppercase text-slate-400">Approved Live</p>
          <p className="text-2xl font-black text-emerald-600 tabular-nums mt-1">{metrics.approvedLive}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <p className="text-[10px] font-black uppercase text-slate-400">$1 Orders</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums mt-1">{metrics.orderCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <p className="text-[10px] font-black uppercase text-slate-400">$1 Sales Vol</p>
          <p className="text-xl font-black text-[#ff6b00] tabular-nums mt-1">{formatNaira(metrics.totalSalesNgn)}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <p className="text-[10px] font-black uppercase text-slate-400">Escrow / Disputed</p>
          <p className="text-xl font-black text-slate-900 dark:text-white tabular-nums mt-1">
            {metrics.escrowedOrders} / <span className="text-red-500">{metrics.disputedOrders}</span>
          </p>
        </div>
      </div>

      {/* Section 1: Submission Moderation Queue */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="w-4 h-4 text-[#ff6b00]" />
            One Dollar Listing Moderation ({filteredListings.length})
          </h3>
          <div className="flex flex-wrap items-center gap-1.5">
            {(["all", "pending_approval", "approved", "rejected", "deactivated"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider cursor-pointer border transition-colors",
                  statusFilter === tab
                    ? "bg-[#ff6b00] text-white border-[#ff6b00]"
                    : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                )}
              >
                {tab.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-12 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#ff6b00]" />
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-400">
            No One Dollar listings match the selected filter.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredListings.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40 space-y-3"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shrink-0">
                      <img
                        src={item.imageUrl || item.imageUrls?.[0] || "/placeholder-product.png"}
                        alt={item.productName}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-black text-slate-900 dark:text-white">{item.productName}</span>
                        <span className="px-2 py-0.5 rounded bg-orange-100 dark:bg-orange-950/50 text-[#ff6b00] text-[10px] font-black tabular-nums">
                          {formatUsd(item.usdPrice)} USD{rateInfo ? ` (${formatNaira(computeOneDollarNgn(item.usdPrice, rateInfo) || 0)})` : ""}
                        </span>
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-black uppercase",
                            item.status === "approved" && item.isActive
                              ? "bg-emerald-100 text-emerald-700"
                              : item.status === "pending_approval"
                                ? "bg-amber-100 text-amber-700"
                                : item.status === "rejected"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-slate-200 text-slate-600"
                          )}
                        >
                          {item.status === "approved" && !item.isActive ? "approved (paused)" : item.status.replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Vendor: <strong className="text-slate-700 dark:text-slate-200">{item.storeName || item.sellerName}</strong> • {item.category} • Stock: {item.stock}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{item.description}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {item.status !== "approved" && (
                      <button
                        type="button"
                        disabled={processingId === item.id}
                        onClick={() => handleApprove(item)}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 border-none cursor-pointer disabled:opacity-40"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Approve
                      </button>
                    )}
                    {item.status !== "rejected" && (
                      <button
                        type="button"
                        disabled={processingId === item.id}
                        onClick={() => {
                          setRejectingId(rejectingId === item.id ? null : item.id);
                          setRejectionNote("");
                        }}
                        className="px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Reject
                      </button>
                    )}
                    {item.status === "approved" && (
                      <button
                        type="button"
                        disabled={processingId === item.id}
                        onClick={() => handleDeactivateListing(item)}
                        className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <EyeOff className="w-3.5 h-3.5" />
                        Deactivate
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={processingId === item.id}
                      onClick={() => handleDeleteListing(item)}
                      className="px-3 py-2 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove
                    </button>
                  </div>
                </div>

                {rejectingId === item.id && (
                  <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <input
                      type="text"
                      value={rejectionNote}
                      onChange={(e) => setRejectionNote(e.target.value)}
                      placeholder="Enter reason for rejection (sent to vendor)..."
                      className="flex-1 h-9 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:border-red-500"
                    />
                    <button
                      type="button"
                      disabled={processingId === item.id}
                      onClick={() => handleReject(item)}
                      className="px-4 h-9 rounded-xl bg-red-600 text-white text-xs font-bold border-none cursor-pointer"
                    >
                      Confirm Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Participating Vendors */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
        <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Users className="w-4 h-4 text-[#ff6b00]" />
          Participating One Dollar Vendors ({participatingVendors.length})
        </h3>
        {participatingVendors.length === 0 ? (
          <p className="text-xs text-slate-400 py-4">No vendors have opted into One Dollar yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <th className="py-3 pr-4">Vendor / Store</th>
                  <th className="py-3 px-4">Listings (Live / Total)</th>
                  <th className="py-3 px-4">$1 Orders</th>
                  <th className="py-3 px-4">$1 Sales</th>
                  <th className="py-3 px-4">Program Status</th>
                  <th className="py-3 pl-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {participatingVendors.map((v) => {
                  const isSuspended = v.userRecord?.oneDollarSuspended === true;
                  return (
                    <tr key={v.sellerId}>
                      <td className="py-3.5 pr-4">
                        <p className="font-bold text-slate-900 dark:text-white">{v.storeName}</p>
                        <p className="text-[11px] text-slate-400">{v.sellerName}</p>
                      </td>
                      <td className="py-3.5 px-4 tabular-nums font-bold">
                        {v.liveListings} / {v.totalListings}
                      </td>
                      <td className="py-3.5 px-4 tabular-nums font-bold">{v.ordersCount}</td>
                      <td className="py-3.5 px-4 tabular-nums font-bold text-[#ff6b00]">
                        {formatNaira(v.salesNgn)}
                      </td>
                      <td className="py-3.5 px-4">
                        {isSuspended ? (
                          <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-black uppercase">
                            Suspended
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 pl-4 text-right">
                        <button
                          type="button"
                          disabled={processingId === `vendor_${v.sellerId}`}
                          onClick={() => handleToggleVendorSuspension(v.sellerId, isSuspended)}
                          className={cn(
                            "px-3 py-1.5 rounded-xl text-[11px] font-bold border-none cursor-pointer inline-flex items-center gap-1",
                            isSuspended
                              ? "bg-emerald-600 text-white hover:bg-emerald-700"
                              : "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100"
                          )}
                        >
                          <Ban className="w-3 h-3" />
                          <span>{isSuspended ? "Reinstate" : "Suspend from $1"}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 3: One Dollar Orders & Escrow Oversight */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
        <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-[#ff6b00]" />
          One Dollar Orders &amp; Escrow Oversight ({oneDollarOrders.length})
        </h3>
        {oneDollarOrders.length === 0 ? (
          <p className="text-xs text-slate-400 py-4">No One Dollar orders recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <th className="py-3 pr-4">Order / Product</th>
                  <th className="py-3 px-4">Parties</th>
                  <th className="py-3 px-4">Amount &amp; Rate</th>
                  <th className="py-3 px-4">Escrow &amp; Delivery</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 pl-4 text-right">Escrow Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {oneDollarOrders.map((o) => (
                  <tr key={o.id}>
                    <td className="py-3.5 pr-4">
                      <p className="font-bold text-slate-900 dark:text-white">{o.productName}</p>
                      <p className="text-[10px] font-mono text-slate-400">{o.uniqueOrderId || o.id}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">Buyer: {o.buyerName}</p>
                      <p className="text-[11px] text-slate-400">Seller: {o.sellerName || o.sellerId}</p>
                    </td>
                    <td className="py-3.5 px-4 tabular-nums">
                      <p className="font-black text-[#ff6b00]">{formatNaira(o.totalPrice)}</p>
                      <p className="text-[10px] text-slate-400">
                        {formatUsd(o.usdPrice)} USD{o.exchangeRateUsdToNgn ? ` • $1 = ₦${o.exchangeRateUsdToNgn.toLocaleString()}` : ""}
                      </p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold inline-block",
                          o.escrowSelected === false
                            ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                            : "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
                        )}
                      >
                        {o.escrowSelected === false ? "Direct Payment" : `Escrow (${o.escrowStatus || "held"})`}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">Vendor-managed delivery</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold uppercase text-[10px]">
                        {o.status}
                      </span>
                      {o.disputeStatus === "active" && (
                        <span className="ml-1 px-2 py-0.5 rounded bg-red-100 text-red-700 font-bold uppercase text-[10px]">
                          Dispute
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 pl-4 text-right">
                      {o.escrowSelected !== false && o.escrowStatus === "held" ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={processingId === `order_${o.id}`}
                            onClick={() => handleAdminEscrowAction(o, "release")}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-[10px] font-bold border-none cursor-pointer"
                          >
                            Release
                          </button>
                          <button
                            type="button"
                            disabled={processingId === `order_${o.id}`}
                            onClick={() => handleAdminEscrowAction(o, "refund")}
                            className="px-2.5 py-1.5 rounded-lg bg-red-600 text-white text-[10px] font-bold border-none cursor-pointer"
                          >
                            Refund
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
