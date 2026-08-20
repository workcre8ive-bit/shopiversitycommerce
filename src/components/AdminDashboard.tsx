import React, { useState, useEffect, useMemo } from "react";
import { 
  ShieldCheck, 
  Search, 
  Users, 
  Package, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  Filter, 
  ChevronRight, 
  ArrowUpDown, 
  X, 
  Plus, 
  Building2, 
  Phone, 
  Mail, 
  Calendar, 
  User, 
  Check, 
  ShieldAlert, 
  FileText, 
  HelpCircle, 
  MessageSquare, 
  Send, 
  ExternalLink,
  Wallet,
  Clock,
  ArrowRight,
  Loader2,
  RefreshCw,
  Copy,
  BarChart2,
  Sparkles,
  KeyRound,
  Ban,
  Layers,
  ShoppingBag,
  SlidersHorizontal,
  SortAsc,
  SortDesc
} from "lucide-react";
import { collection, onSnapshot, query, doc, updateDoc, deleteDoc, addDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { UserProfile, Product, Order } from "../types";
import { cn } from "../lib/utils";
import { handleFirestoreError, OperationType } from "../lib/firebase-errors";
import AdminSuspendModal from "./AdminSuspendModal";
import AdminUserDetailModal from "./AdminUserDetailModal";
import AdminAnalyticsCharts from "./AdminAnalyticsCharts";
import AdminSecurityRenewalModal from "./AdminSecurityRenewalModal";

interface AdminDashboardProps {
  currentUser: any;
  onBack?: () => void;
}

export default function AdminDashboard({ currentUser, onBack }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<"analytics" | "users" | "products" | "payouts" | "reports" | "moderation">("analytics");
  
  // Real Firestore Collections State
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [moderationLogs, setModerationLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // User Management Filters & Controls
  const [userCategoryFilter, setUserCategoryFilter] = useState<"all" | "buyer" | "seller" | "logistics" | "admin">("all");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userSortOrder, setUserSortOrder] = useState<"asc" | "desc" | "recent">("asc");
  const [selectedUserForDetail, setSelectedUserForDetail] = useState<UserProfile | null>(null);
  const [selectedUserForSuspend, setSelectedUserForSuspend] = useState<UserProfile | null>(null);
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isSecurityRenewalOpen, setIsSecurityRenewalOpen] = useState(false);

  // Action / State Processing Feedback
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // Real-time Firestore Listeners
  useEffect(() => {
    setLoading(true);

    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const uList = snapshot.docs.map(doc => ({ id: doc.id, uid: doc.id, ...doc.data() } as unknown as UserProfile));
      setUsers(uList);
    }, (err) => handleFirestoreError(err, OperationType.LIST, "users"));

    const unsubProducts = onSnapshot(collection(db, "products"), (snapshot) => {
      const pList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setAllProducts(pList);
    }, (err) => handleFirestoreError(err, OperationType.LIST, "products"));

    const unsubOrders = onSnapshot(collection(db, "orders"), (snapshot) => {
      const oList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      setOrders(oList);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, "orders");
      setLoading(false);
    });

    const unsubPayouts = onSnapshot(collection(db, "payoutRequests"), (snapshot) => {
      const payList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPayouts(payList);
    }, (err) => handleFirestoreError(err, OperationType.LIST, "payoutRequests"));

    const unsubReports = onSnapshot(collection(db, "reports"), (snapshot) => {
      const rList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReports(rList);
    }, (err) => handleFirestoreError(err, OperationType.LIST, "reports"));

    const unsubLogs = onSnapshot(collection(db, "contact_moderation_logs"), (snapshot) => {
      const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setModerationLogs(logs);
    }, (err) => handleFirestoreError(err, OperationType.LIST, "contact_moderation_logs"));

    return () => {
      unsubUsers();
      unsubProducts();
      unsubOrders();
      unsubPayouts();
      unsubReports();
      unsubLogs();
    };
  }, []);

  // Filtered and Alphabetically Sorted Users
  const processedUsers = useMemo(() => {
    let result = [...users];

    // Category filtering
    if (userCategoryFilter === "buyer") {
      result = result.filter(u => u.role === "buyer" || (!u.role && u.state !== "Logistics Partner"));
    } else if (userCategoryFilter === "seller") {
      result = result.filter(u => u.role === "seller");
    } else if (userCategoryFilter === "logistics") {
      result = result.filter(u => u.state === "Logistics Partner");
    } else if (userCategoryFilter === "admin") {
      result = result.filter(u => u.role === "admin" || u.email === "tommzypolaris@gmail.com" || u.email === "fashinaayomide2005@gmail.com" || u.email === "fashinaayomide@2005@gmail.com" || u.email === "fashinaayomide12005@gmail.com");
    }

    // Search query matching (Name, Email, Unique Code, Phone, School)
    if (userSearchQuery.trim()) {
      const query = userSearchQuery.toLowerCase().trim();
      result = result.filter(u => {
        const name = (u.displayName || "").toLowerCase();
        const email = (u.email || "").toLowerCase();
        const code = (u.uniqueCode || u.userCode || `USR-${(u.uid || u.id || "").substring(0, 6)}`).toLowerCase();
        const phone = (u.phoneNumber || u.phone || "").toLowerCase();
        const school = (u.school || "").toLowerCase();
        return name.includes(query) || email.includes(query) || code.includes(query) || phone.includes(query) || school.includes(query);
      });
    }

    // Alphabetical or Chronological Sorting
    result.sort((a, b) => {
      const nameA = (a.displayName || a.email || "Unknown").toLowerCase();
      const nameB = (b.displayName || b.email || "Unknown").toLowerCase();

      if (userSortOrder === "asc") {
        return nameA.localeCompare(nameB);
      } else if (userSortOrder === "desc") {
        return nameB.localeCompare(nameA);
      } else {
        // Recent
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      }
    });

    return result;
  }, [users, userCategoryFilter, userSearchQuery, userSortOrder]);

  // Copy unique user code helper
  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  // Toggle user verified status
  const handleToggleVerification = async (userId: string, currentStatus: boolean) => {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { isVerified: !currentStatus });
      setActionSuccessMessage(`User verification status updated to ${!currentStatus ? "Verified" : "Unverified"}`);
      setTimeout(() => setActionSuccessMessage(null), 3000);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
    }
  };

  // Payout Actions
  const handleApprovePayout = async (payout: any) => {
    setProcessingId(payout.id);
    try {
      const payoutRef = doc(db, "payoutRequests", payout.id);
      await updateDoc(payoutRef, {
        status: "approved",
        approvedAt: new Date().toISOString(),
        approvedBy: currentUser?.email || "Admin"
      });
      setActionSuccessMessage(`Payout ₦${payout.amount.toLocaleString()} approved.`);
      setTimeout(() => setActionSuccessMessage(null), 3000);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, `payoutRequests/${payout.id}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectPayout = async (payout: any) => {
    const reason = prompt("Enter reason for payout rejection:") || "Rejected by administrator";
    setProcessingId(payout.id);
    try {
      const payoutRef = doc(db, "payoutRequests", payout.id);
      await updateDoc(payoutRef, {
        status: "rejected",
        rejectionReason: reason,
        rejectedAt: new Date().toISOString(),
        rejectedBy: currentUser?.email || "Admin"
      });
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, `payoutRequests/${payout.id}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleProcessTransfer = async (payout: any) => {
    setProcessingId(payout.id);
    try {
      const res = await fetch("/api/admin/process-transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payoutId: payout.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to process transfer");
      setActionSuccessMessage(`Payout settled successfully! Ref: ${data.transferCode || "Done"}`);
      setTimeout(() => setActionSuccessMessage(null), 3000);
    } catch (err: any) {
      alert("Transfer Error: " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  // Product removal
  const handleRemoveProduct = async (product: Product) => {
    if (!confirm(`Are you sure you want to remove "${product.name}"?`)) return;
    try {
      await updateDoc(doc(db, "products", product.id), {
        isDeleted: true,
        deletedAt: new Date().toISOString()
      });
      setActionSuccessMessage(`Product "${product.name}" removed from marketplace.`);
      setTimeout(() => setActionSuccessMessage(null), 3000);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, `products/${product.id}`);
    }
  };

  // Report dismissal
  const handleDismissReport = async (reportId: string) => {
    try {
      await updateDoc(doc(db, "reports", reportId), {
        status: "dismissed",
        dismissedAt: new Date().toISOString(),
        dismissedBy: currentUser?.email || "Admin"
      });
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, `reports/${reportId}`);
    }
  };

  // Metrics summary
  const totalGrossVolume = orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
  const pendingPayoutsTotal = payouts.filter(p => p.status === "pending").reduce((sum, p) => sum + (p.amount || 0), 0);
  const buyerCount = users.filter(u => u.role === "buyer" || (!u.role && u.state !== "Logistics Partner")).length;
  const sellerCount = users.filter(u => u.role === "seller").length;
  const logisticsCount = users.filter(u => u.state === "Logistics Partner").length;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 min-h-screen">
      {/* Action Notification Alert */}
      {actionSuccessMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500 text-white shadow-lg text-xs font-black flex items-center justify-between animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>{actionSuccessMessage}</span>
          </div>
          <button onClick={() => setActionSuccessMessage(null)} className="p-1 hover:bg-white/20 rounded cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Header & Admin Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-[2.5rem] p-6 sm:p-10 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-600/80 backdrop-blur-md rounded-2xl shadow-lg shadow-indigo-600/30">
                <ShieldCheck className="w-7 h-7 text-white" />
              </div>
              <span className="px-3.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-black uppercase tracking-widest">
                Root System Controller
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              Executive Admin Operations Hub
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl font-medium">
              Real-time user intelligence, alphabetical directory, custom suspension & ban timeframes, live sales charts, and credentials renewal protocol.
            </p>
          </div>

          {/* Quick Actions & Security Session Renewal */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setIsSecurityRenewalOpen(true)}
              className="px-5 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2.5 shadow-xl shadow-indigo-600/30 active:scale-95 transition-all cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              Renew Login Details
            </button>
            {onBack && (
              <button
                onClick={onBack}
                className="px-5 py-3.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold text-xs transition-all cursor-pointer"
              >
                Back to Market
              </button>
            )}
          </div>
        </div>

        {/* Global Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-8 border-t border-white/10">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Registered Users</span>
            <p className="text-2xl font-black text-white mt-1">{users.length}</p>
            <p className="text-[10px] text-indigo-300 font-bold">{buyerCount} Buyers • {sellerCount} Sellers</p>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Confirmed Orders</span>
            <p className="text-2xl font-black text-white mt-1">{orders.length}</p>
            <p className="text-[10px] text-emerald-400 font-bold">₦{totalGrossVolume.toLocaleString()} Gross Vol</p>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active Listings</span>
            <p className="text-2xl font-black text-white mt-1">{allProducts.filter(p => !p.isDeleted).length}</p>
            <p className="text-[10px] text-slate-400 font-bold">{allProducts.filter(p => p.isDeleted).length} removed</p>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pending Escrow Payouts</span>
            <p className="text-2xl font-black text-amber-400 mt-1">₦{pendingPayoutsTotal.toLocaleString()}</p>
            <p className="text-[10px] text-amber-300 font-bold">{payouts.filter(p => p.status === "pending").length} requests</p>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setActiveTab("analytics")}
          className={cn(
            "px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all shrink-0 cursor-pointer",
            activeTab === "analytics"
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
          )}
        >
          <BarChart2 className="w-4 h-4" />
          General Details & Analytics
        </button>

        <button
          onClick={() => setActiveTab("users")}
          className={cn(
            "px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all shrink-0 cursor-pointer",
            activeTab === "users"
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
          )}
        >
          <Users className="w-4 h-4" />
          User Directory ({users.length})
        </button>

        <button
          onClick={() => setActiveTab("products")}
          className={cn(
            "px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all shrink-0 cursor-pointer",
            activeTab === "products"
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
          )}
        >
          <Package className="w-4 h-4" />
          Products ({allProducts.length})
        </button>

        <button
          onClick={() => setActiveTab("payouts")}
          className={cn(
            "px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all shrink-0 cursor-pointer",
            activeTab === "payouts"
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
          )}
        >
          <DollarSign className="w-4 h-4" />
          Payouts ({payouts.filter(p => p.status === "pending").length})
        </button>

        <button
          onClick={() => setActiveTab("reports")}
          className={cn(
            "px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all shrink-0 cursor-pointer",
            activeTab === "reports"
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
          )}
        >
          <AlertTriangle className="w-4 h-4" />
          Reports ({reports.filter(r => r.status !== "dismissed").length})
        </button>

        <button
          onClick={() => setActiveTab("moderation")}
          className={cn(
            "px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all shrink-0 cursor-pointer",
            activeTab === "moderation"
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
          )}
        >
          <ShieldAlert className="w-4 h-4 text-red-500" />
          Contact Logs ({moderationLogs.length})
        </button>
      </div>

      {/* TAB 1: ANALYTICS & GENERAL DETAILS */}
      {activeTab === "analytics" && (
        <AdminAnalyticsCharts orders={orders} products={allProducts} />
      )}

      {/* TAB 2: USER DIRECTORY & MANAGEMENT */}
      {activeTab === "users" && (
        <div className="space-y-6">
          {/* Filters, Categories & Search */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-5">
            {/* Category Pills */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setUserCategoryFilter("all")}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
                    userCategoryFilter === "all"
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                  )}
                >
                  All Users ({users.length})
                </button>
                <button
                  onClick={() => setUserCategoryFilter("buyer")}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
                    userCategoryFilter === "buyer"
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                  )}
                >
                  Buyers ({buyerCount})
                </button>
                <button
                  onClick={() => setUserCategoryFilter("seller")}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
                    userCategoryFilter === "seller"
                      ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                  )}
                >
                  Sellers ({sellerCount})
                </button>
                <button
                  onClick={() => setUserCategoryFilter("logistics")}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
                    userCategoryFilter === "logistics"
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                  )}
                >
                  Logistics ({logisticsCount})
                </button>
                <button
                  onClick={() => setUserCategoryFilter("admin")}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
                    userCategoryFilter === "admin"
                      ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                  )}
                >
                  Admins ({users.filter(u => u.role === "admin" || u.email === "tommzypolaris@gmail.com" || u.email === "fashinaayomide12005@gmail.com").length})
                </button>
              </div>

              {/* Alphabetical / Recent Sorting Toggle */}
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  onClick={() => setUserSortOrder("asc")}
                  title="Alphabetical A to Z"
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer",
                    userSortOrder === "asc" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  <SortAsc className="w-3.5 h-3.5" />
                  <span>A-Z</span>
                </button>
                <button
                  onClick={() => setUserSortOrder("desc")}
                  title="Alphabetical Z to A"
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer",
                    userSortOrder === "desc" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  <SortDesc className="w-3.5 h-3.5" />
                  <span>Z-A</span>
                </button>
                <button
                  onClick={() => setUserSortOrder("recent")}
                  title="Recently Registered"
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer",
                    userSortOrder === "recent" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Recent</span>
                </button>
              </div>
            </div>

            {/* Instant Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                placeholder="Search user by name, email, unique code (e.g. USR-...), phone number, or university..."
                className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
              {userSearchQuery && (
                <button 
                  onClick={() => setUserSearchQuery("")} 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50 dark:bg-slate-850/50">
                    <th className="px-6 py-5">User Information</th>
                    <th className="px-6 py-5">Unique Code</th>
                    <th className="px-6 py-5">Role & Category</th>
                    <th className="px-6 py-5">Status & Suspension</th>
                    <th className="px-6 py-5 text-right">Moderation Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                  {processedUsers.map((u, uIdx) => {
                    const uniqueCode = u.uniqueCode || u.userCode || `USR-${(u.uid || u.id || "").substring(0, 6).toUpperCase()}`;
                    const isSuspended = u.isSuspended;
                    const isPermanent = !u.suspendedUntil || u.banType === "permanent";
                    const isExpired = u.suspendedUntil && new Date(u.suspendedUntil).getTime() <= Date.now();
                    const suspensionExpiry = u.suspendedUntil ? new Date(u.suspendedUntil).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" }) : null;

                    return (
                      <tr 
                        key={`adm-user-${u.uid || u.id || uIdx}`} 
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        {/* User Details */}
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700">
                              <img 
                                src={u.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.displayName || "User")}&background=6366f1&color=fff`} 
                                alt=""
                                className="w-full h-full object-cover" 
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 dark:text-white leading-tight truncate">
                                {u.displayName || "Unnamed User"}
                              </p>
                              <p className="text-xs text-slate-400 truncate mt-0.5">{u.email || "No email"}</p>
                              {u.school && (
                                <p className="text-[10px] text-slate-500 font-medium truncate flex items-center gap-1 mt-0.5">
                                  <Building2 className="w-3 h-3 text-slate-400" />
                                  {u.school}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Unique Code */}
                        <td className="px-6 py-5">
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs font-black tracking-wider text-slate-900 dark:text-white">
                            <span>{uniqueCode}</span>
                            <button
                              onClick={() => handleCopyCode(uniqueCode, u.uid || u.id)}
                              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
                              title="Copy unique code"
                            >
                              {copiedCodeId === (u.uid || u.id) ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Role & Category */}
                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-1">
                            <span className={cn(
                              "inline-flex items-center self-start px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                              u.role === "seller" ? "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300" :
                              u.role === "admin" ? "bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300" :
                              u.state === "Logistics Partner" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300" :
                              "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300"
                            )}>
                              {u.state === "Logistics Partner" ? "Logistics Rider" : u.role || "Buyer"}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold">
                              {u.reportCount || 0} Reports • {u.strikeCount || 0} Strikes
                            </span>
                          </div>
                        </td>

                        {/* Status & Suspension */}
                        <td className="px-6 py-5">
                          <div className="space-y-1">
                            {isSuspended && !isExpired ? (
                              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300 rounded-full text-[10px] font-black uppercase tracking-wider">
                                <ShieldAlert className="w-3 h-3" />
                                <span>{isPermanent ? "Permanently Banned" : `Suspended: until ${suspensionExpiry}`}</span>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-full text-[10px] font-black uppercase tracking-wider">
                                <CheckCircle className="w-3 h-3" />
                                <span>Active</span>
                              </div>
                            )}

                            <div>
                              {u.isVerified ? (
                                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">✓ Verified Account</span>
                              ) : (
                                <span className="text-[10px] font-medium text-slate-400">Unverified</span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* View Dossier Button */}
                            <button
                              onClick={() => {
                                setSelectedUserForDetail(u);
                                setIsDetailModalOpen(true);
                              }}
                              className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                            >
                              View Dossier
                            </button>

                            {/* Ban / Suspend Button */}
                            <button
                              onClick={() => {
                                setSelectedUserForSuspend(u);
                                setIsSuspendModalOpen(true);
                              }}
                              className={cn(
                                "px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-sm",
                                isSuspended
                                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                                  : "bg-red-600 hover:bg-red-700 text-white shadow-red-600/20"
                              )}
                            >
                              <ShieldAlert className="w-3.5 h-3.5" />
                              {isSuspended ? "Modify Ban" : "Ban / Suspend"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {processedUsers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-16 text-center text-slate-400">
                        <Users className="w-10 h-10 mx-auto opacity-30 mb-2" />
                        <p className="font-bold text-sm">No users found matching your search or filters.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PRODUCT INVENTORY MODERATION */}
      {activeTab === "products" && (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50 dark:bg-slate-850/50">
                  <th className="px-6 py-5">Product</th>
                  <th className="px-6 py-5">Seller</th>
                  <th className="px-6 py-5">Category</th>
                  <th className="px-6 py-5">Price</th>
                  <th className="px-6 py-5 text-right">Moderation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {allProducts.map((p, pIdx) => (
                  <tr key={`adm-prod-${p.id}-${pIdx}`} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0">
                          <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-xs text-slate-500 font-medium">{p.sellerName || "Anonymous Seller"}</td>
                    <td className="px-6 py-5">
                      <span className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase text-slate-500">
                        {p.category}
                      </span>
                    </td>
                    <td className="px-6 py-5 font-black text-slate-900 dark:text-white font-mono">₦{p.price.toLocaleString()}</td>
                    <td className="px-6 py-5 text-right">
                      {!p.isDeleted ? (
                        <button 
                          onClick={() => handleRemoveProduct(p)}
                          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                          Remove Listing
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold text-red-600 uppercase">Removed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: PAYOUTS */}
      {activeTab === "payouts" && (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50 dark:bg-slate-850/50">
                  <th className="px-6 py-5">Seller</th>
                  <th className="px-6 py-5">Requested Amount</th>
                  <th className="px-6 py-5">Bank Account Info</th>
                  <th className="px-6 py-5">Status</th>
                  <th className="px-6 py-5 text-right">Settlement Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {payouts.map((payout, pIdx) => (
                  <tr key={`adm-payout-${payout.id}-${pIdx}`} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="px-6 py-5">
                      <p className="font-bold text-slate-900 dark:text-white leading-none mb-1">{payout.sellerName || "Anonymous"}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{payout.sellerId?.substring(0, 8)}...</p>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-base font-black text-slate-900 dark:text-white font-mono">₦{payout.amount.toLocaleString()}</span>
                      <p className="text-[10px] text-slate-400 font-bold">{new Date(payout.createdAt).toLocaleDateString()}</p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-none">{payout.bankDetails?.accountName}</p>
                      <p className="text-[10px] text-slate-500">{payout.bankDetails?.bankName}</p>
                      <p className="text-[10px] font-mono font-bold text-slate-900 dark:text-white">{payout.bankDetails?.accountNumber}</p>
                    </td>
                    <td className="px-6 py-5">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                        payout.status === "paid" ? "bg-emerald-100 text-emerald-700" :
                        payout.status === "approved" ? "bg-blue-100 text-blue-700" :
                        payout.status === "rejected" ? "bg-red-100 text-red-700" :
                        "bg-amber-100 text-amber-700"
                      )}>
                        {payout.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {payout.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleApprovePayout(payout)}
                              disabled={processingId === payout.id}
                              className="px-3.5 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-xs uppercase tracking-wider cursor-pointer disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectPayout(payout)}
                              disabled={processingId === payout.id}
                              className="p-1.5 border border-red-200 text-red-600 rounded-xl hover:bg-red-50 cursor-pointer disabled:opacity-50"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {payout.status === "approved" && (
                          <button
                            onClick={() => handleProcessTransfer(payout)}
                            disabled={processingId === payout.id}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            {processingId === payout.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wallet className="w-3.5 h-3.5" />}
                            Pay Out
                          </button>
                        )}
                        {payout.status === "paid" && (
                          <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> Settled
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: REPORTS QUEUE */}
      {activeTab === "reports" && (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50 dark:bg-slate-850/50">
                  <th className="px-6 py-5">Reason</th>
                  <th className="px-6 py-5">Reported Item</th>
                  <th className="px-6 py-5">Reporter</th>
                  <th className="px-6 py-5">Date</th>
                  <th className="px-6 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {reports.map((r, rIdx) => (
                  <tr key={`adm-report-${r.id}-${rIdx}`} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="px-6 py-5 font-bold text-red-600">{r.reason}</td>
                    <td className="px-6 py-5 text-xs text-slate-500 font-medium">{r.productName || r.productId}</td>
                    <td className="px-6 py-5 text-xs text-slate-500 font-medium">{r.reporterName || r.reporterId}</td>
                    <td className="px-6 py-5 text-[10px] font-bold text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-5 text-right">
                      {r.status !== "dismissed" ? (
                        <button 
                          onClick={() => handleDismissReport(r.id)}
                          className="px-3.5 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
                        >
                          Dismiss
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Dismissed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: CONTACT MODERATION LOGS */}
      {activeTab === "moderation" && (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 sm:p-8 border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-500" />
                Contact Information Protection Logs
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Real-time review of messages and image uploads blocked for sharing off-platform contact details.
              </p>
            </div>
            <span className="px-3.5 py-1.5 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-full text-xs font-black self-start sm:self-auto">
              {moderationLogs.length} Blocked Attempt{moderationLogs.length === 1 ? "" : "s"}
            </span>
          </div>

          {moderationLogs.length === 0 ? (
            <div className="text-center py-16 text-slate-400 space-y-2">
              <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto opacity-40" />
              <p className="font-bold text-slate-600 dark:text-slate-300">No blocked contact attempts logged yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="pb-4 px-4">User / Sender</th>
                    <th className="pb-4 px-4">Type</th>
                    <th className="pb-4 px-4">Content / Snippet</th>
                    <th className="pb-4 px-4">Detected Violations</th>
                    <th className="pb-4 px-4">Reason</th>
                    <th className="pb-4 px-4 text-right">Date & Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {moderationLogs.map((log, lIdx) => (
                    <tr key={`sec-log-${log.id || lIdx}-${lIdx}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{log.senderName || "Unknown User"}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{log.senderId}</div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={cn(
                          "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider",
                          log.messageType === "image" 
                            ? "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                        )}>
                          {log.messageType === "image" ? "📷 Image OCR" : "💬 Text"}
                        </span>
                      </td>
                      <td className="py-4 px-4 max-w-xs">
                        <p className="font-mono text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded-xl text-slate-700 dark:text-slate-300 break-words line-clamp-2">
                          {log.contentSnippet}
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1">
                          {log.detectedTypes?.map((t: string, idx: number) => (
                            <span key={`log-type-${t}-${idx}`} className="px-2 py-0.5 bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300 rounded text-[10px] font-bold">
                              {t}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-xs font-medium text-slate-600 dark:text-slate-300">
                        {log.reason || "Contact info blocked"}
                      </td>
                      <td className="py-4 px-4 text-right text-xs text-slate-400 font-mono whitespace-nowrap">
                        {log.createdAt?.seconds 
                          ? new Date(log.createdAt.seconds * 1000).toLocaleString() 
                          : "Just now"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: BAN / SUSPEND ACCOUNT */}
      <AdminSuspendModal
        isOpen={isSuspendModalOpen}
        onClose={() => {
          setIsSuspendModalOpen(false);
          setSelectedUserForSuspend(null);
        }}
        user={selectedUserForSuspend}
        currentUser={currentUser}
        onSuccess={() => {
          setActionSuccessMessage("User moderation status updated successfully.");
          setTimeout(() => setActionSuccessMessage(null), 3000);
        }}
      />

      {/* MODAL 2: USER DOSSIER & INDIVIDUAL ANALYTICS */}
      <AdminUserDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedUserForDetail(null);
        }}
        user={selectedUserForDetail}
        orders={orders}
        products={allProducts}
        onOpenSuspendModal={(u) => {
          setSelectedUserForSuspend(u);
          setIsSuspendModalOpen(true);
        }}
        onToggleVerification={handleToggleVerification}
      />

      {/* MODAL 3: ADMIN SECURITY CREDENTIALS RENEWAL */}
      <AdminSecurityRenewalModal
        isOpen={isSecurityRenewalOpen}
        onClose={() => setIsSecurityRenewalOpen(false)}
        currentUser={currentUser}
      />
    </div>
  );
}
