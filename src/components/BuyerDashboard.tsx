import React from "react";
import { auth, db } from "../firebase";
import { collection, query, where, orderBy, onSnapshot, limit, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { Order, ProductHistory, Notification, UserProfile, WishlistItem } from "../types";
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
  MessageCircle,
  Heart,
  ShoppingCart,
  Eye,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { handleFirestoreError, OperationType } from "../lib/firebase-errors";
import DashboardSlideshow from "./DashboardSlideshow";
import { removeFromWishlist } from "../utils/wishlist";

interface BuyerDashboardProps {
  user: UserProfile;
  setActiveTab: (tab: string) => void;
  onBack?: () => void;
  initialSection?: "overview" | "wishlist";
}

export default function BuyerDashboard({ user, setActiveTab, onBack, initialSection = "overview" }: BuyerDashboardProps) {
  const [activeSection, setActiveSection] = React.useState<"overview" | "wishlist">(initialSection);
  const [recentOrders, setRecentOrders] = React.useState<Order[]>([]);
  const [recentHistory, setRecentHistory] = React.useState<ProductHistory[]>([]);
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [wishlistItems, setWishlistItems] = React.useState<WishlistItem[]>([]);
  const [wishlistLoading, setWishlistLoading] = React.useState(true);
  const [removingWishlistId, setRemovingWishlistId] = React.useState<string | null>(null);
  const [orderToDelete, setOrderToDelete] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [showCompleteProfile, setShowCompleteProfile] = React.useState(false);
  const [stats, setStats] = React.useState({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0
  });

  // Sync initialSection prop
  React.useEffect(() => {
    if (initialSection) {
      setActiveSection(initialSection);
    }
  }, [initialSection]);

  // Real-time Wishlist subscription from Firestore
  React.useEffect(() => {
    if (!user?.uid) return;
    setWishlistLoading(true);

    const wishlistQuery = query(
      collection(db, "wishlists"),
      where("userId", "==", user.uid)
    );

    const unsubscribeWishlist = onSnapshot(wishlistQuery, (snapshot) => {
      const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as WishlistItem[];
      // Sort in-memory by createdAt descending
      items.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setWishlistItems(items);
      setWishlistLoading(false);
    }, (error) => {
      console.warn("Dashboard wishlist fetch notice:", error);
      setWishlistLoading(false);
    });

    return () => unsubscribeWishlist();
  }, [user.uid]);

  // Real-time Orders, History, and Notifications
  React.useEffect(() => {
    if (!user?.uid) return;

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

  const handleRemoveWishlistItem = async (productId: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setRemovingWishlistId(productId);
    try {
      await removeFromWishlist(productId, user.uid);
      setWishlistItems(prev => prev.filter(item => item.productId !== productId));
    } catch (err) {
      console.error("Failed to remove item from wishlist:", err);
    } finally {
      setRemovingWishlistId(null);
    }
  };

  const handleAddWishlistToCart = (item: WishlistItem, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const productObj = {
      id: item.productId,
      name: item.productName,
      price: item.productPrice,
      category: item.category || "General",
      imageUrl: item.productImageUrl,
      sellerId: item.sellerId || "",
      sellerName: item.sellerName || "Vendor",
      deliveryOptions: { delivery: true, pickup: true },
      stock: 1
    };
    window.dispatchEvent(new CustomEvent("add-to-cart", { detail: { product: productObj } }));
    setActiveTab("cart");
  };

  const handleViewWishlistProduct = (item: WishlistItem) => {
    const productObj = {
      id: item.productId,
      name: item.productName,
      price: item.productPrice,
      category: item.category || "General",
      imageUrl: item.productImageUrl,
      sellerId: item.sellerId || "",
      sellerName: item.sellerName || "Vendor",
      deliveryOptions: { delivery: true, pickup: true },
      stock: 1
    };
    window.dispatchEvent(new CustomEvent("view-product-detail", { detail: productObj }));
  };

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
    <div className="space-y-8 text-left">
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
              className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:scale-105 transition-all text-slate-600 dark:text-slate-400 group cursor-pointer"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/50 text-[#ff6b00] text-[10px] font-black uppercase tracking-wider border border-orange-200 dark:border-orange-800/60">
                Customer Account
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Welcome back, {user.displayName || "Customer"}!
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-xs sm:text-sm">
              Manage your orders, campus deliveries, and saved wishlist products.
            </p>
          </div>
        </div>

        {/* Section Navigation Switcher */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shrink-0 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setActiveSection("overview")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer touch-manipulation",
              activeSection === "overview"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Overview</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSection("wishlist")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer touch-manipulation",
              activeSection === "wishlist"
                ? "bg-rose-500 text-white shadow-sm"
                : "text-slate-500 hover:text-rose-600 dark:hover:text-rose-400"
            )}
          >
            <Heart className={cn("w-3.5 h-3.5", activeSection === "wishlist" ? "fill-current" : "")} />
            <span>Wishlist ({wishlistItems.length})</span>
          </button>
        </div>
      </motion.div>

      {/* Hero Slideshow for Customer */}
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

      {/* 4-Stat Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
        <StatCard 
          icon={ShoppingBag} 
          label="Total Orders" 
          value={stats.totalOrders} 
          color="orange" 
          onClick={() => setActiveTab("orders")}
        />
        <StatCard 
          icon={Clock} 
          label="Pending" 
          value={stats.pendingOrders} 
          color="amber" 
          onClick={() => setActiveTab("orders")}
        />
        <StatCard 
          icon={CheckCircle} 
          label="Completed" 
          value={stats.completedOrders} 
          color="emerald" 
          onClick={() => setActiveTab("orders")}
        />
        <StatCard 
          icon={Heart} 
          label="Wishlist Items" 
          value={wishlistItems.length} 
          color="rose" 
          onClick={() => setActiveSection("wishlist")}
          highlight={activeSection === "wishlist"}
        />
      </div>

      {/* MAIN VIEW CONTENT: WISHLIST SECTION OR OVERVIEW */}
      <AnimatePresence mode="wait">
        {activeSection === "wishlist" ? (
          <motion.div
            key="wishlist-section"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Wishlist Header & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-500 flex items-center justify-center">
                    <Heart className="w-4 h-4 fill-current" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    My Saved Wishlist
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 text-xs font-black">
                    {wishlistItems.length} {wishlistItems.length === 1 ? "item" : "items"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                  Products you've bookmarked to buy later. Persisted securely in your account.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("market")}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Discover More Deals</span>
                </button>
              </div>
            </div>

            {/* Wishlist Products Content */}
            {wishlistLoading ? (
              <div className="p-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                <Loader2 className="w-8 h-8 text-rose-500 animate-spin mx-auto mb-3" />
                <p className="text-xs text-slate-400 font-bold">Loading your saved items...</p>
              </div>
            ) : wishlistItems.length === 0 ? (
              <div className="p-12 sm:p-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800/90 shadow-sm space-y-4">
                <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/30 text-rose-500 flex items-center justify-center mx-auto shadow-inner">
                  <Heart className="w-8 h-8" />
                </div>
                <div className="space-y-1.5 max-w-sm mx-auto">
                  <h4 className="text-lg font-black text-slate-900 dark:text-white">Your Wishlist is Empty</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    Explore student listings, textbooks, fashion, and tech on the marketplace. Tap the heart icon on any product to save it right here!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("market")}
                  className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:brightness-105 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Explore Marketplace</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {wishlistItems.map((item) => (
                  <motion.div
                    key={`wishlist-card-${item.id}`}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group"
                  >
                    {/* Thumbnail Image */}
                    <div 
                      onClick={() => handleViewWishlistProduct(item)}
                      className="aspect-square w-full bg-slate-50 dark:bg-slate-800/50 relative overflow-hidden flex items-center justify-center cursor-pointer group-hover:opacity-95 transition-opacity"
                    >
                      {item.productImageUrl ? (
                        <img 
                          src={item.productImageUrl} 
                          alt={item.productName}
                          className="w-11/12 h-11/12 object-contain group-hover:scale-105 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <Package className="w-12 h-12 text-slate-300 dark:text-slate-700" />
                      )}

                      {/* Category Badge */}
                      {item.category && (
                        <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 text-[9px] font-black uppercase tracking-wider border border-slate-200 dark:border-slate-700 shadow-xs">
                          {item.category}
                        </span>
                      )}

                      {/* Remove from Wishlist button */}
                      <button
                        type="button"
                        onClick={(e) => handleRemoveWishlistItem(item.productId, e)}
                        disabled={removingWishlistId === item.productId}
                        className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 dark:bg-slate-900/90 text-rose-500 hover:bg-rose-500 hover:text-white border border-rose-100 dark:border-rose-900/40 shadow-sm flex items-center justify-center transition-all cursor-pointer"
                        title="Remove from wishlist"
                      >
                        {removingWishlistId === item.productId ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {/* Card Content */}
                    <div className="p-4 flex flex-col flex-1 gap-2">
                      <div 
                        onClick={() => handleViewWishlistProduct(item)}
                        className="cursor-pointer"
                      >
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug hover:text-orange-600 transition-colors">
                          {item.productName}
                        </h4>
                        {item.sellerName && (
                          <p className="text-[10px] font-semibold text-slate-400 mt-0.5 truncate">
                            Vendor: {item.sellerName}
                          </p>
                        )}
                      </div>

                      <div className="mt-auto pt-2 flex items-baseline gap-1">
                        <span className="text-xs font-black text-slate-800 dark:text-zinc-200">₦</span>
                        <span className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                          {Math.floor(item.productPrice).toLocaleString()}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                        <button
                          type="button"
                          onClick={() => handleViewWishlistProduct(item)}
                          className="h-9 px-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-zinc-200 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleAddWishlistToCart(item, e)}
                          className="h-9 px-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>Cart</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="overview-section"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Left Columns - Activities */}
            <div className="lg:col-span-2 space-y-8">
              {/* Wishlist Quick Highlight */}
              {wishlistItems.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-rose-500 fill-current" />
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">Saved in Wishlist</h3>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
                        {wishlistItems.length}
                      </span>
                    </div>
                    <button 
                      onClick={() => setActiveSection("wishlist")}
                      className="text-xs font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 flex items-center gap-1 cursor-pointer"
                    >
                      View All Wishlist <ArrowRight className="w-3 h-3 text-rose-600" />
                    </button>
                  </div>

                  <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800/90 p-4 overflow-hidden shadow-sm">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {wishlistItems.slice(0, 4).map((item) => (
                        <div 
                          key={`quick-wish-${item.id}`}
                          onClick={() => handleViewWishlistProduct(item)}
                          className="group p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/60 hover:border-rose-400/50 transition-all cursor-pointer flex flex-col"
                        >
                          <div className="aspect-square w-full rounded-lg bg-slate-50 dark:bg-slate-800 overflow-hidden mb-2 flex items-center justify-center">
                            {item.productImageUrl ? (
                              <img src={item.productImageUrl} alt={item.productName} className="w-full h-full object-contain group-hover:scale-105 transition-transform" />
                            ) : (
                              <Package className="w-6 h-6 text-slate-300" />
                            )}
                          </div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{item.productName}</p>
                          <p className="text-[10px] font-black text-rose-600 dark:text-rose-400 mt-0.5">₦{Math.floor(item.productPrice).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Orders */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Recent Orders</h3>
                  <button 
                    onClick={() => setActiveTab("orders")}
                    className="text-xs font-bold text-[#ff6b00] hover:text-[#e05e00] dark:text-[#ff6b00] dark:hover:text-orange-400 flex items-center gap-1 cursor-pointer"
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
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOrderToDelete(order.id);
                              }}
                              className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/15 rounded-xl transition-all cursor-pointer"
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
                    className="text-xs font-bold text-[#ff6b00] hover:text-[#e05e00] dark:text-[#ff6b00] dark:hover:text-orange-400 flex items-center gap-1 cursor-pointer"
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

            {/* Right Column - Live Alerts & Logs */}
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
                    className="text-xs font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 flex items-center gap-1 cursor-pointer"
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
                      const typeColors: any = {
                        welcome: "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400",
                        profile: "bg-pink-100 text-pink-700 dark:bg-pink-900/20 dark:text-pink-400",
                        order: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
                        payout: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
                        default: "bg-orange-100 text-[#ff6b00] dark:bg-orange-950/40 dark:text-orange-400"
                      };
                      const pillStyle = typeColors[notif.type] || typeColors.default;

                      return (
                        <div 
                          key={`dashboard-notif-${notif.id || idx}`} 
                          onClick={(e) => handleMarkNotifRead(notif.id, e)}
                          className={cn(
                            "p-4 rounded-2xl border transition-all relative group flex flex-col gap-2.5 cursor-pointer touch-manipulation",
                            notif.isRead 
                              ? "bg-slate-50/50 dark:bg-slate-850/20 border-slate-100 dark:border-slate-800/40 opacity-75" 
                              : "bg-white dark:bg-slate-850/60 border-indigo-100/80 dark:border-indigo-900/40 shadow-sm"
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <span className={cn("text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full select-none", pillStyle)}>
                              {notif.type || "Update"}
                            </span>
                            <div className="flex items-center gap-2">
                              {!notif.isRead && (
                                <button
                                  type="button"
                                  onClick={(e) => handleMarkNotifRead(notif.id, e)}
                                  className="w-2.5 h-2.5 rounded-full bg-indigo-600 hover:scale-125 transition-transform"
                                  title="Mark as read"
                                />
                              )}
                              <button
                                type="button"
                                onClick={(e) => handleDeleteNotif(notif.id, e)}
                                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 rounded-lg transition-all"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">{notif.title}</h4>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed mt-1">{notif.message}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Order Confirmation Dialog */}
      <AnimatePresence>
        {orderToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 dark:border-slate-800 space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="text-center space-y-1">
                <h4 className="text-base font-bold text-slate-900 dark:text-white">Delete Order Record?</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Are you sure you want to remove this order from your activity history?
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setOrderToDelete(null)}
                  className="flex-1 h-10 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteOrder}
                  disabled={deleting}
                  className="flex-1 h-10 rounded-xl bg-red-500 text-white font-bold text-xs hover:bg-red-600 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Complete Profile Reminder Dialog */}
      <AnimatePresence>
        {showCompleteProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-800 text-center relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="w-16 h-16 rounded-3xl bg-orange-50 dark:bg-orange-950/30 text-[#ff6b00] flex items-center justify-center mx-auto mb-6 shadow-inner">
                <UserCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Complete Your Campus Profile</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-6">
                Add your campus hall and delivery details so student vendors and riders can deliver orders right to your doorstep.
              </p>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCompleteProfile(false);
                    setActiveTab("settings");
                  }}
                  className="w-full h-12 bg-brand-gradient text-white font-bold text-xs rounded-2xl shadow-lg shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                >
                  Complete Profile Now
                </button>
                <button
                  type="button"
                  onClick={() => setShowCompleteProfile(false)}
                  className="w-full h-10 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
                >
                  I'll do it later
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, onClick, highlight }: any) {
  const colors: any = {
    orange: "bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400",
    amber: "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400",
    emerald: "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400",
    rose: "bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400"
  };

  return (
    <div 
      onClick={onClick}
      className={cn(
        "bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border flex items-center gap-3 sm:gap-4 shadow-sm transition-all select-none",
        onClick ? "cursor-pointer hover:scale-[1.02] active:scale-[0.98]" : "",
        highlight 
          ? "border-rose-500 dark:border-rose-500 ring-2 ring-rose-500/20" 
          : "border-slate-200 dark:border-zinc-800/85 hover:border-orange-500/40"
      )}
    >
      <div className={cn("w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner", colors[color] || colors.orange)}>
        <Icon className={cn("w-5 h-5 sm:w-6 sm:h-6", color === "rose" ? "fill-current" : "")} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-wider truncate mb-0.5">{label}</p>
        <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">{value}</p>
      </div>
    </div>
  );
}
