import React from "react";
import { db } from "../firebase";
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  updateDoc, 
  orderBy, 
  where,
  getDocs,
  limit,
  addDoc,
  increment
} from "firebase/firestore";
import { 
  ShieldCheck, 
  Wallet, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Search, 
  ArrowUpRight,
  TrendingUp,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  User,
  Clock,
  Filter,
  ArrowLeft
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { handleFirestoreError, OperationType } from "../lib/firebase-errors";

const FALLBACK_BANKS = [
  { name: "Access Bank", code: "044" },
  { name: "Guaranty Trust Bank", code: "058" },
  { name: "Zenith Bank", code: "057" },
  { name: "United Bank for Africa", code: "033" },
  { name: "First Bank of Nigeria", code: "011" },
  { name: "Union Bank of Nigeria", code: "032" },
  { name: "Sterling Bank", code: "232" },
  { name: "Wema Bank", code: "035" },
  { name: "Fidelity Bank", code: "070" },
  { name: "Polaris Bank", code: "076" },
  { name: "Stanbic IBTC Bank", code: "221" },
  { name: "Keystone Bank", code: "082" },
  { name: "Ecobank Nigeria", code: "050" },
  { name: "First City Monument Bank", code: "214" },
  { name: "Jaiz Bank", code: "301" },
  { name: "Providus Bank", code: "101" },
  { name: "TAJ Bank", code: "302" },
  { name: "Globus Bank", code: "103" },
  { name: "OPay Digital Services (OPay)", code: "999992" },
  { name: "PalmPay", code: "999991" },
  { name: "Kuda Bank", code: "50211" },
  { name: "Moniepoint Microfinance Bank", code: "50515" },
  { name: "VFD Microfinance Bank", code: "566" },
  { name: "Other", code: "other" }
];

export default function AdminDashboard({ currentUser, onBack }: { currentUser: any, onBack?: () => void }) {
  // Strict check for builder email only
  if (currentUser?.email !== "tommzypolaris@gmail.com") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center space-y-4">
          <ShieldCheck className="w-16 h-16 text-red-500 mx-auto opacity-20" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Access Denied</h2>
          <p className="text-slate-500">This area is reserved for the system builder.</p>
        </div>
      </div>
    );
  }

  const [payoutRequests, setPayoutRequests] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [processingId, setProcessingId] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState<"all" | "pending" | "approved" | "paid" | "rejected">("pending");
  const [activeTab, setActiveTab] = React.useState<"overview" | "payouts" | "users" | "products" | "reports">("overview");
  const [users, setUsers] = React.useState<any[]>([]);
  const [allProducts, setAllProducts] = React.useState<any[]>([]);
  const [reports, setReports] = React.useState<any[]>([]);
  const [banks, setBanks] = React.useState<any[]>(FALLBACK_BANKS);
  const [systemStats, setSystemStats] = React.useState({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    activeSellers: 0
  });

  React.useEffect(() => {
    // Fetch system-wide overview stats
      const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
        const usersData = Array.from(new Map(snap.docs.map(doc => [doc.id, { id: doc.id, ...doc.data() }])).values());
        const activeSellers = usersData.filter((d: any) => d.role === "seller" || d.role === "both").length;
        setSystemStats(prev => ({ ...prev, totalUsers: usersData.length, activeSellers }));
      }, (error) => {
        console.error("AdminDashboard total users subscription failed:", error);
      });

      const unsubProducts = onSnapshot(collection(db, "products"), (snap) => {
        const productsData = Array.from(new Map(snap.docs.map(doc => [doc.id, { id: doc.id, ...doc.data() }])).values());
        setSystemStats(prev => ({ ...prev, totalProducts: productsData.filter((d: any) => !d.isDeleted).length }));
      }, (error) => {
        console.error("AdminDashboard products subscription failed:", error);
      });

      const unsubOrders = onSnapshot(collection(db, "orders"), (snap) => {
        const ordersData = Array.from(new Map(snap.docs.map(doc => [doc.id, { id: doc.id, ...doc.data() }])).values());
        const totalRev = ordersData.reduce((acc: number, d: any) => acc + (d.totalPrice || 0), 0);
        setSystemStats(prev => ({ ...prev, totalOrders: ordersData.length, totalRevenue: totalRev }));
      }, (error) => {
        console.error("AdminDashboard orders subscription failed:", error);
      });

    return () => {
      unsubUsers();
      unsubProducts();
      unsubOrders();
    };
  }, []);

  React.useEffect(() => {
    const fetchBanks = async () => {
      try {
        const res = await fetch("/api/paystack/banks");
        const data = await res.json();
        if (data.status) setBanks(data.data);
      } catch (err) {
        console.error("Failed to fetch banks", err);
      }
    };
    fetchBanks();
  }, []);

  React.useEffect(() => {
    if (activeTab === "users") {
      const q = query(collection(db, "users"), orderBy("createdAt", "desc"), limit(50));
      const unsub = onSnapshot(q, (snap) => {
        const usersData = Array.from(new Map(snap.docs.map(doc => [doc.id, { id: doc.id, ...doc.data() }])).values());
        setUsers(usersData);
      }, (error) => {
        console.error("AdminDashboard users tab subscription failed:", error);
      });
      return () => unsub();
    }
  }, [activeTab]);

  React.useEffect(() => {
    if (activeTab === "products") {
      const q = query(collection(db, "products"), orderBy("createdAt", "desc"), limit(50));
      const unsub = onSnapshot(q, (snap) => {
        const productsData = Array.from(new Map(snap.docs.map(doc => [doc.id, { id: doc.id, ...doc.data() }])).values());
        setAllProducts(productsData);
      }, (error) => {
        console.error("AdminDashboard products tab subscription failed:", error);
      });
      return () => unsub();
    }
  }, [activeTab]);

  React.useEffect(() => {
    if (activeTab === "reports") {
      const q = query(collection(db, "reports"), orderBy("createdAt", "desc"));
      const unsub = onSnapshot(q, (snap) => {
        const reportsData = Array.from(new Map(snap.docs.map(doc => [doc.id, { id: doc.id, ...doc.data() }])).values());
        setReports(reportsData);
      }, (error) => {
        console.error("AdminDashboard reports tab subscription failed:", error);
      });
      return () => unsub();
    }
  }, [activeTab]);

  const handleToggleUserSuspension = async (userId: string, isSuspended: boolean) => {
    try {
      await updateDoc(doc(db, "users", userId), { isSuspended: !isSuspended });
      alert(isSuspended ? "User unsuspended!" : "User suspended!");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const handleToggleVerification = async (userId: string, isVerified: boolean) => {
    try {
      await updateDoc(doc(db, "users", userId), { isVerified: !isVerified });
      alert(isVerified ? "Verification removed!" : "User verified!");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const handleRemoveProduct = async (product: any) => {
    if (!confirm(`Are you sure you want to remove "${product.name}"? This will soft-delete the product.`)) return;
    try {
      await updateDoc(doc(db, "products", product.id), { 
        isDeleted: true,
        deletedAt: new Date().toISOString(),
        deletedBy: "admin"
      });
      
      // Notify seller
      await addDoc(collection(db, "notifications"), {
        userId: product.sellerId,
        title: "Product Removed by Admin",
        message: `Your product "${product.name}" has been removed by an admin for moderation purposes.`,
        type: "moderation",
        isRead: false,
        createdAt: new Date().toISOString()
      });
      
      alert("Product removed.");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `products/${product.id}`);
    }
  };

  const handleDismissReport = async (reportId: string) => {
    try {
      await updateDoc(doc(db, "reports", reportId), { status: "dismissed" });
      alert("Report dismissed.");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `reports/${reportId}`);
    }
  };

  React.useEffect(() => {
    const q = filter === "all" 
      ? query(collection(db, "payoutRequests"), orderBy("createdAt", "desc"))
      : query(collection(db, "payoutRequests"), where("status", "==", filter), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPayoutRequests(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "payoutRequests");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [filter]);

  const handleApprovePayout = async (payout: any) => {
    setProcessingId(payout.id);
    try {
      await updateDoc(doc(db, "payoutRequests", payout.id), {
        status: "approved",
        approvedAt: new Date().toISOString()
      });
      
      // Notify seller
      await addDoc(collection(db, "notifications"), {
        userId: payout.sellerId,
        title: "Payout Approved!",
        message: `Your payout request for ₦${payout.amount.toLocaleString()} has been approved and is being processed.`,
        type: "payout",
        isRead: false,
        createdAt: new Date().toISOString()
      });
      
      alert("Payout marked as approved!");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `payoutRequests/${payout.id}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectPayout = async (payout: any) => {
    const reason = prompt("Reason for rejection:");
    if (reason === null) return;
    
    setProcessingId(payout.id);
    try {
      await updateDoc(doc(db, "payoutRequests", payout.id), {
        status: "rejected",
        rejectionReason: reason,
        rejectedAt: new Date().toISOString()
      });

      // If it is a referral payout, refund user's referral balance
      if (payout.payoutType === "referral") {
        await updateDoc(doc(db, "users", payout.sellerId), {
          referralWalletBalance: increment(payout.amount)
        });
      }
      
      // Notify seller
      await addDoc(collection(db, "notifications"), {
        userId: payout.sellerId,
        title: "Payout Rejected",
        message: `Your payout request for ₦${payout.amount.toLocaleString()} was rejected: ${reason}`,
        type: "payout",
        isRead: false,
        createdAt: new Date().toISOString()
      });
      
      alert("Payout rejected.");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `payoutRequests/${payout.id}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleProcessTransfer = async (payout: any) => {
    if (!confirm(`Are you sure you want to initiate a REAL transfer of ₦${payout.amount.toLocaleString()} to ${payout.bankDetails.accountName}?`)) {
      return;
    }

    setProcessingId(payout.id);
    try {
      const bankCode = banks.find(b => b.name === payout.bankDetails.bankName)?.code;
      if (!bankCode) throw new Error("Could not find bank code for " + payout.bankDetails.bankName);

      const res = await fetch("/api/paystack/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: payout.amount,
          bankCode: bankCode,
          accountNumber: payout.bankDetails.accountNumber,
          accountName: payout.bankDetails.accountName,
          reason: `SHOPIVERSITY Payout for ${payout.sellerName || 'Seller'}`
        })
      });

      const data = await res.json();

      if (data.status) {
        await updateDoc(doc(db, "payoutRequests", payout.id), {
          status: "paid",
          paidAt: new Date().toISOString(),
          transferReference: data.data.reference,
          transferData: data.data
        });

        // Notify seller
        await addDoc(collection(db, "notifications"), {
          userId: payout.sellerId,
          title: "Payment Disbursed!",
          message: `₦${payout.amount.toLocaleString()} has been sent to your bank account (${payout.bankDetails.bankName}).`,
          type: "payout",
          isRead: false,
          createdAt: new Date().toISOString()
        });

        alert("Transfer successful! Payment is on its way.");
      } else {
        throw new Error(data.error || "Transfer failed at Paystack");
      }
    } catch (error: any) {
      alert("Transfer Error: " + error.message);
      console.error("Transfer error:", error);
    } finally {
      setProcessingId(null);
    }
  };

  const stats = React.useMemo(() => {
    const pending = payoutRequests.filter(p => p.status === "pending" || p.status === "approved");
    const totalPending = pending.reduce((acc, p) => acc + p.amount, 0);
    return {
      pendingCount: pending.length,
      totalPendingAmount: totalPending,
      totalPaid: payoutRequests.filter(p => p.status === "paid").reduce((acc, p) => acc + p.amount, 0)
    };
  }, [payoutRequests]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-8 space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {onBack && (
            <button 
              onClick={onBack}
              className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:scale-105 transition-all text-slate-600 dark:text-slate-400 group"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-3 mb-1">
               <ShieldCheck className="w-8 h-8 text-slate-900 dark:text-white" />
               <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Admin Control</h1>
            </div>
            <p className="text-slate-500 font-medium">System-wide payout management and oversight</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide">
        {[
          { id: "overview", label: "Overview", icon: TrendingUp },
          { id: "payouts", label: "Payouts", icon: Wallet },
          { id: "users", label: "User Management", icon: User },
          { id: "products", label: "Moderation", icon: ShieldCheck },
          { id: "reports", label: "Reports", icon: AlertCircle }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold whitespace-nowrap transition-all",
              activeTab === tab.id 
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xl" 
                : "bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.id === "payouts" && stats.pendingCount > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-indigo-500 text-white rounded-full text-[10px]">
                {stats.pendingCount}
              </span>
            )}
            {tab.id === "reports" && reports.filter(r => r.status === "pending").length > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-red-500 text-white rounded-full text-[10px]">
                {reports.filter(r => r.status === "pending").length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Trading Volume</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">₦{systemStats.totalRevenue.toLocaleString()}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Users</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">{systemStats.totalUsers.toLocaleString()}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Sellers</p>
                  <p className="text-2xl font-black text-indigo-600 tracking-tight">{systemStats.activeSellers.toLocaleString()}</p>
                </div>
              </div>

              <div className="bg-brand-gradient p-8 rounded-[2.5rem] text-white relative overflow-hidden shadow-xl">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                 <div className="relative z-10">
                   <h3 className="text-2xl font-black mb-2 tracking-tight !text-white">Admin Control Center</h3>
                   <p className="text-white/80 text-sm font-medium mb-6 leading-relaxed max-w-xl">
                     Welcome to the SHOPIVERSITY Command Center. From here, you have complete oversight of the platform's ecosystem.
                   </p>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                       <h4 className="font-bold flex items-center gap-2 mb-1 !text-white">
                         <ShieldCheck className="w-4 h-4" />
                         Trust & Safety
                       </h4>
                       <p className="text-[10px] text-white/70">Verify campus celebrities, suspend non-compliant accounts, and moderate suspicious listings.</p>
                     </div>
                     <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                       <h4 className="font-bold flex items-center gap-2 mb-1 !text-white">
                         <Wallet className="w-4 h-4" />
                         Financial Integrity
                       </h4>
                       <p className="text-[10px] text-white/70">Process verified payouts to sellers and ensure ecosystem-wide payment security.</p>
                     </div>
                   </div>
                 </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm h-full">
                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 tracking-tight flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                  Ecosystem Health
                </h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-400">Total Products</p>
                      <p className="text-lg font-black text-slate-900 dark:text-white">{systemStats.totalProducts}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-400">Total Orders</p>
                      <p className="text-lg font-black text-slate-900 dark:text-white">{systemStats.totalOrders}</p>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-50 dark:border-slate-800">
                    <p className="text-[10px] text-slate-400 font-medium italic">
                      Platform commission is set at 5% for all transactions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "payouts" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-8 bg-black dark:bg-slate-900 rounded-[2.5rem] text-white">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Pending Payouts</p>
            <p className="text-4xl font-black mb-1">₦{stats.totalPendingAmount.toLocaleString()}</p>
            <div className="flex items-center gap-2 text-slate-400">
              <Clock className="w-3 h-3" />
              <span className="text-xs font-bold">{stats.pendingCount} requests waiting</span>
            </div>
          </div>
          <div className="p-8 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 rounded-[2.5rem]">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 mb-2">Total Paid Out</p>
            <p className="text-4xl font-black text-slate-900 dark:text-white mb-1">₦{stats.totalPaid.toLocaleString()}</p>
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle className="w-3 h-3" />
              <span className="text-xs font-bold">Successfully settled</span>
            </div>
          </div>
          <div className="p-8 bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] border border-slate-100 dark:border-slate-800">
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Quick Filter</p>
             <div className="flex flex-wrap gap-2 mt-4">
               {["all", "pending", "approved", "paid", "rejected"].map((f) => (
                 <button
                   key={f}
                   onClick={() => setFilter(f as any)}
                   className={cn(
                     "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
                     filter === f 
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" 
                      : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500"
                   )}
                 >
                   {f}
                 </button>
               ))}
             </div>
          </div>
        </div>
      )}

      {activeTab === "payouts" && (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-50 dark:border-slate-800">
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Seller</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Request Details</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Bank info</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {payoutRequests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center text-slate-400 font-medium">
                      No requests matching the current filter.
                    </td>
                  </tr>
                ) : (
                  payoutRequests.map((payout, pIdx) => (
                    <tr key={`adm-payout-${payout.id}-${pIdx}`} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-8 py-6">
                         <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                             <User className="w-5 h-5 text-slate-400" />
                           </div>
                           <div>
                              <p className="text-sm font-bold text-slate-900 dark:text-white leading-none mb-1">{payout.sellerName || "Anonymous Seller"}</p>
                              <p className="text-[10px] text-slate-400 font-mono">{payout.sellerId.substring(0, 8)}...</p>
                           </div>
                         </div>
                      </td>
                      <td className="px-8 py-6">
                         <div className="flex flex-col">
                            <span className="text-lg font-black text-slate-900 dark:text-white">₦{payout.amount.toLocaleString()}</span>
                            <span className="text-[10px] text-slate-400 font-bold">{new Date(payout.createdAt).toLocaleDateString()}</span>
                         </div>
                      </td>
                      <td className="px-8 py-6">
                         <div className="flex flex-col gap-1">
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-none">{payout.bankDetails.accountName}</p>
                            <p className="text-[10px] text-slate-500">{payout.bankDetails.bankName}</p>
                            <p className="text-[10px] font-mono font-bold text-slate-900 dark:text-white tracking-widest">{payout.bankDetails.accountNumber}</p>
                         </div>
                      </td>
                      <td className="px-8 py-6">
                         <div className={cn(
                           "inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest leading-none",
                           payout.status === "paid" ? "bg-emerald-100 text-emerald-600" :
                           payout.status === "approved" ? "bg-blue-100 text-blue-600" :
                           payout.status === "rejected" ? "bg-red-100 text-red-600" :
                           "bg-amber-100 text-amber-600"
                         )}>
                            {payout.status}
                         </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                         <div className="flex items-center justify-end gap-2">
                            {payout.status === "pending" && (
                              <>
                                <button
                                  onClick={() => handleApprovePayout(payout)}
                                  disabled={processingId === payout.id}
                                  className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-[10px] uppercase tracking-widest disabled:opacity-50"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleRejectPayout(payout)}
                                  disabled={processingId === payout.id}
                                  className="p-2 border border-red-100 dark:border-red-900/20 text-red-600 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors disabled:opacity-50"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {payout.status === "approved" && (
                              <button
                                onClick={() => handleProcessTransfer(payout)}
                                disabled={processingId === payout.id}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 disabled:opacity-50"
                              >
                                 {processingId === payout.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wallet className="w-3 h-3" />}
                                 Pay Now
                              </button>
                            )}
                            {payout.status === "paid" && (
                              <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                                 <CheckCircle className="w-3 h-3" /> Settled
                              </span>
                            )}
                         </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "users" && (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-50 dark:border-slate-800">
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">User Details</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Role / Stats</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {users.map((u, uIdx) => (
                  <tr key={`adm-user-${u.id}-${uIdx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100">
                          <img src={u.photoURL || `https://ui-avatars.com/api/?name=${u.displayName}`} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white leading-none mb-1">{u.displayName}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">{u.role}</span>
                        <span className="text-[10px] text-slate-400 font-bold">{u.reportCount || 0} Reports | {u.strikeCount || 0} Strikes</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex gap-2">
                        {u.isVerified ? (
                          <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">Verified</span>
                        ) : (
                          <span className="px-3 py-1 bg-slate-100 text-slate-400 rounded-full text-[10px] font-black uppercase tracking-widest">Unverified</span>
                        )}
                        {u.isSuspended && (
                          <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-[10px] font-black uppercase tracking-widest">Suspended</span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleToggleVerification(u.id, u.isVerified)}
                          className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                        >
                          {u.isVerified ? "Revoke" : "Verify"}
                        </button>
                        <button 
                          onClick={() => handleToggleUserSuspension(u.id, u.isSuspended)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                            u.isSuspended ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
                          )}
                        >
                          {u.isSuspended ? "Unsuspend" : "Suspend"}
                        </button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "products" && (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-50 dark:border-slate-800">
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Product</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Seller</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Price</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {allProducts.map((p, pIdx) => (
                  <tr key={`adm-prod-${p.id}-${pIdx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden">
                          <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-sm text-slate-500">{p.sellerName}</td>
                    <td className="px-8 py-6 text-[10px] font-bold uppercase text-slate-400">{p.category}</td>
                    <td className="px-8 py-6 font-black text-slate-900 dark:text-white">₦{p.price.toLocaleString()}</td>
                    <td className="px-8 py-6 text-right">
                      {!p.isDeleted ? (
                        <button 
                          onClick={() => handleRemoveProduct(p)}
                          className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <XCircle className="w-5 h-5" />
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

      {activeTab === "reports" && (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-50 dark:border-slate-800">
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Reason</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Reported Item</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Reporter</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {reports.map((r, rIdx) => (
                  <tr key={`adm-report-${r.id}-${rIdx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-8 py-6 text-sm font-bold text-red-600">{r.reason}</td>
                    <td className="px-8 py-6 text-xs text-slate-500">{r.productName || r.productId}</td>
                    <td className="px-8 py-6 text-xs text-slate-500">{r.reporterName || r.reporterId}</td>
                    <td className="px-8 py-6 text-[10px] font-bold text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td className="px-8 py-6 text-right">
                       {r.status !== "dismissed" ? (
                         <button 
                           onClick={() => handleDismissReport(r.id)}
                           className="px-3 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest"
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

    </div>
  );
}
