import React from "react";
import { auth, db } from "../firebase";
import { collection, query, where, orderBy, onSnapshot, limit, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { Order, ProductHistory, Notification, UserProfile } from "../types";
import { 
  ShoppingBag, 
  History, 
  Bell, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  Package,
  ArrowRight,
  Trash2,
  Loader2,
  AlertCircle,
  UserCircle,
  ArrowLeft,
  MessageCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { handleFirestoreError, OperationType } from "../lib/firebase-errors";
import DashboardSlideshow from "./DashboardSlideshow";

interface BuyerDashboardProps {
  user: UserProfile;
  setActiveTab: (tab: string) => void;
  onBack?: () => void;
}

export default function BuyerDashboard({ user, setActiveTab, onBack }: BuyerDashboardProps) {
  const [recentOrders, setRecentOrders] = React.useState<Order[]>([]);
  const [recentHistory, setRecentHistory] = React.useState<ProductHistory[]>([]);
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [orderToDelete, setOrderToDelete] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [showCompleteProfile, setShowCompleteProfile] = React.useState(false);
  const [stats, setStats] = React.useState({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0
  });

  React.useEffect(() => {
    const ordersQuery = query(
      collection(db, "orders"),
      where("buyerId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
      const orders = Array.from(new Map(snapshot.docs.map(doc => {
        const d = { id: doc.id, ...doc.data() };
        return [d.id, d];
      })).values())
        .filter((doc: any) => !doc.hiddenFromHistory) as Order[];
      setRecentOrders(orders.slice(0, 5));
      setStats({
        totalOrders: orders.length,
        pendingOrders: orders.filter(o => o.status !== "completed" && o.status !== "cancelled").length,
        completedOrders: orders.filter(o => o.status === "completed").length
      });
    }, (error) => {
      console.error("Dashboard orders fetch failed:", error);
    });

    const historyQuery = query(
      collection(db, "product_history"),
      where("userId", "==", user.uid),
      orderBy("viewedAt", "desc"),
      limit(5)
    );

    const unsubscribeHistory = onSnapshot(historyQuery, (snapshot) => {
      const history = Array.from(new Map(snapshot.docs.map(doc => {
        const d = { id: doc.id, ...doc.data() } as ProductHistory;
        return [d.id, d];
      })).values());
      setRecentHistory(history);
    }, (error) => {
      console.error("Dashboard history fetch failed:", error);
    });

    const notificationsQuery = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(4)
    );

    const unsubscribeNotifications = onSnapshot(notificationsQuery, (snapshot) => {
      const data = Array.from(new Map(snapshot.docs.map(doc => {
        const d = { id: doc.id, ...doc.data() } as Notification;
        return [d.id, d];
      })).values());
      setNotifications(data);
    }, (error) => {
      console.error("Dashboard notification query failed:", error);
    });

    return () => {
      unsubscribeOrders();
      unsubscribeHistory();
      unsubscribeNotifications();
    };
  }, [user.uid]);

  const handleMarkNotifRead = async (id: string, e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    try {
      await updateDoc(doc(db, "notifications", id), { isRead: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleDeleteNotif = async (id: string, e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setNotifications(prev => prev.filter(n => n.id !== id));
    try {
      await deleteDoc(doc(db, "notifications", id));
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const handleMarkAllNotifsRead = async (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    try {
      const unread = notifications.filter(n => !n.isRead);
      if (unread.length === 0) return;
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      await Promise.all(unread.map(n => updateDoc(doc(db, "notifications", n.id), { isRead: true })));
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  React.useEffect(() => {
    // Show complete profile popup if profile is incomplete
    if (user && user.profileCompleted === false) {
      const timer = setTimeout(() => setShowCompleteProfile(true), 1500);
      return () => clearTimeout(timer);
    } else if (user?.profileCompleted) {
      setShowCompleteProfile(false);
    }
  }, [user?.profileCompleted]);

  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;
    setDeleting(true);
    try {
      await updateDoc(doc(db, "orders", orderToDelete), { 
        hiddenFromHistory: true
      });
      setOrderToDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderToDelete}`);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <motion.div 
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
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
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Welcome back!</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Here's what's happening with your account today.</p>
          </div>
        </div>
      </motion.div>

      {/* Dashboard Hero Slideshow */}
      <DashboardSlideshow 
        role="buyer"
        onCtaClick={(slideId) => {
          if (slideId === "buyer-escrow" || slideId === "buyer-dispatch") {
            setActiveTab("orders");
          } else {
            setActiveTab("market");
          }
        }} 
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard 
          icon={ShoppingBag} 
          label="Total Orders" 
          value={stats.totalOrders} 
          color="orange" 
        />
        <StatCard 
          icon={Clock} 
          label="Pending" 
          value={stats.pendingOrders} 
          color="amber" 
        />
        <StatCard 
          icon={CheckCircle} 
          label="Completed" 
          value={stats.completedOrders} 
          color="emerald" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Columns - Activities */}
        <div className="lg:col-span-2 space-y-8">
          {/* Recent Orders */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Recent Orders</h3>
              <button 
                onClick={() => setActiveTab("orders")}
                className="text-xs font-bold text-[#ff6b00] hover:text-[#e05e00] dark:text-[#ff6b00] dark:hover:text-orange-400 flex items-center gap-1"
              >
                View All <ArrowRight className="w-3 h-3 text-[#ff6b00]" />
              </button>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800/90 overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.02)] dark:shadow-none hover:border-orange-500/30 dark:hover:border-orange-500/20 transition-all">
              {recentOrders.length === 0 ? (
                <div className="p-12 text-center">
                  <ShoppingBag className="w-12 h-12 text-slate-100 dark:text-slate-800 mx-auto mb-4" />
                  <p className="text-sm text-slate-400 font-medium">No orders yet</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  {recentOrders.map((order, orderIdx) => (
                    <div key={`recent-order-${order.id || orderIdx}-${orderIdx}`} className="p-6 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                          <Package className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[180px] sm:max-w-none">{order.productName}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">₦{order.totalPrice.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-4">
                        <span className={cn(
                          "text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-xl",
                          order.status === "completed" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/10 dark:text-emerald-400" :
                          order.status === "cancelled" ? "bg-red-50 text-red-600 dark:bg-red-900/10 dark:text-red-400" : 
                          order.status === "accepted" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/10 dark:text-emerald-400" : "bg-purple-50 text-purple-600 dark:bg-purple-900/10 dark:text-purple-400"
                        )}>
                          {order.status.replace(/-/g, ' ')}
                        </span>
                        {order.sellerId && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              window.dispatchEvent(new CustomEvent('open-chat', { detail: order.sellerId }));
                            }}
                            className="p-2.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/15 rounded-xl transition-all"
                            title="Chat with Seller"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOrderToDelete(order.id);
                          }}
                          className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/15 rounded-xl transition-all"
                          title="Delete order"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recently Viewed */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Recently Viewed</h3>
              <button 
                onClick={() => setActiveTab("history")}
                className="text-xs font-bold text-[#ff6b00] hover:text-[#e05e00] dark:text-[#ff6b00] dark:hover:text-orange-400 flex items-center gap-1"
              >
                View All <ArrowRight className="w-3 h-3 text-[#ff6b00]" />
              </button>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800/90 overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.02)] dark:shadow-none hover:border-orange-500/30 dark:hover:border-orange-500/20 transition-all">
              {recentHistory.length === 0 ? (
                <div className="p-12 text-center">
                  <History className="w-12 h-12 text-slate-100 dark:text-slate-800 mx-auto mb-4" />
                  <p className="text-sm text-slate-400 font-medium">No history yet</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  {recentHistory.map((item, historyIdx) => (
                    <div key={`recent-history-${item.id || historyIdx}-${historyIdx}`} className="p-6 flex items-center gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                      <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                        <img 
                          src={item.productImageUrl} 
                          alt={item.productName}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{item.productName}</p>
                        <p className="text-[10px] font-black text-[#ff6b00] dark:text-orange-400 uppercase tracking-widest">₦{item.productPrice.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Beautiful Live Alerts & Notifications */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Alerts & Logs</h3>
              {notifications.filter(n => !n.isRead).length > 0 && (
                <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-black rounded-lg shadow-sm">
                  {notifications.filter(n => !n.isRead).length}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              {notifications.filter(n => !n.isRead).length > 0 && (
                <button 
                  type="button"
                  onClick={(e) => handleMarkAllNotifsRead(e)}
                  className="text-[10px] font-black text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 uppercase tracking-widest px-2 py-1 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg touch-manipulation cursor-pointer"
                >
                  Clear All
                </button>
              )}
              <button 
                onClick={() => setActiveTab("notifications")}
                className="text-xs font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 flex items-center gap-1"
              >
                Full Inbox <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800/90 p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none space-y-4 min-h-[300px]">
             {notifications.length === 0 ? (
               <div className="py-16 text-center space-y-3">
                 <Bell className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto" />
                 <p className="text-xs font-medium text-slate-400">All caught up! No recent alerts.</p>
               </div>
             ) : (
               <div className="space-y-3.5">
                 {notifications.map((notif, idx) => {
                   // Style category pill
                   const typeColors: any = {
                     welcome: "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400",
                     profile: "bg-pink-100 text-pink-700 dark:bg-pink-900/20 dark:text-pink-400",
                     order: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
                     payout: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
                     system: "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                   };

                   return (
                     <div 
                       key={`notif-buyer-${notif.id || idx}-${idx}`} 
                       className={cn(
                         "p-4 rounded-3xl border transition-all relative flex flex-col gap-1.5",
                         notif.isRead 
                           ? "bg-slate-50/50 dark:bg-slate-800/10 border-slate-100/50 dark:border-slate-800/50 text-slate-500 dark:text-slate-400" 
                           : "bg-white dark:bg-slate-900 border-indigo-100/50 dark:border-indigo-950/50 shadow-md shadow-slate-100 dark:shadow-none hover:border-indigo-200/50"
                       )}
                     >
                       {!notif.isRead && (
                         <div className="absolute top-4 right-4 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                       )}
                       <div className="flex items-center gap-2">
                         <span className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg shrink-0", typeColors[notif.type] || "bg-slate-100 text-slate-700")}>
                           {notif.type}
                         </span>
                         <h4 className={cn("text-xs font-black truncate pr-4 text-slate-900 dark:text-slate-100", notif.isRead && "opacity-75 font-bold")}>
                           {notif.title}
                         </h4>
                       </div>
                       <p className="text-[11px] leading-relaxed select-none">{notif.message}</p>
                       
                       {!notif.isRead && (
                         <button 
                           onClick={() => handleMarkNotifRead(notif.id)}
                           className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 hover:underline text-left self-start mt-1"
                         >
                           Mark as read
                         </button>
                       )}
                     </div>
                   );
                 })}
               </div>
             )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {orderToDelete && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl border border-slate-100 dark:border-slate-800"
            >
              <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center text-red-600 dark:text-red-500 mx-auto mb-6">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white text-center mb-2">Delete Order?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-8">Are you sure you want to delete this order from your dashboard? This action cannot be undone.</p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setOrderToDelete(null)}
                  disabled={deleting}
                  className="flex-1 py-4 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteOrder}
                  disabled={deleting}
                  className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-bold text-sm hover:bg-red-700 transition-all shadow-lg shadow-red-100 dark:shadow-red-900/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Complete Profile Popup */}
      <AnimatePresence>
        {showCompleteProfile && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-800 relative overflow-hidden"
            >
              {/* Decorative Background */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full -mr-16 -mt-16" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/5 rounded-full -ml-12 -mb-12" />

              <div className="relative z-10">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-purple-600 rounded-3xl flex items-center justify-center text-white shadow-lg shadow-purple-200 dark:shadow-purple-950/20 mx-auto mb-6">
                  <UserCircle className="w-10 h-10" />
                </div>
                
                <h3 className="text-2xl font-black text-slate-900 dark:text-white text-center mb-2 tracking-tight">Complete Your Profile</h3>
                <p className="text-slate-500 dark:text-slate-400 text-center mb-8 font-medium">
                  To start buying and selling on SHOPIVERSITY, we need a few more details like your school and delivery address.
                </p>
                              <div className="space-y-3">
                  <button 
                    onClick={() => {
                      setShowCompleteProfile(false);
                      setActiveTab("settings");
                    }}
                    className="w-full py-4 bg-gradient-to-b from-[#ff7a00] to-[#ff5c00] text-white rounded-2xl font-bold text-lg shadow-lg hover:brightness-105 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    Complete Now
                    <ArrowRight className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setShowCompleteProfile(false)}
                    className="w-full py-4 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-2xl font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                  >
                    Maybe Later
                  </button>
                </div>

                <div className="mt-6 flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <AlertCircle className="w-3 h-3 text-[#ff6b00]" />
                  Required for orders & verification
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: any) {
  const colors: any = {
    orange: "bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400",
    amber: "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400",
    emerald: "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400"
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-zinc-800/85 flex items-center gap-6 shadow-sm hover:border-[#ff6b00] dark:hover:border-[#ff6b00]/40 transition-all transition-shadow">
      <div className={cn("w-14 h-14 rounded-lg flex items-center justify-center", colors[color])}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">{label}</p>
        <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{value}</p>
      </div>
    </div>
  );
}
