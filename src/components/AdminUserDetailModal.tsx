import React from "react";
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  Building2, 
  MapPin, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Copy, 
  Check, 
  ShoppingBag, 
  DollarSign, 
  Package, 
  TrendingUp, 
  TrendingDown, 
  ShieldAlert, 
  Clock, 
  Award,
  Sparkles,
  ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { UserProfile, Order, Product } from "../types";
import { cn } from "../lib/utils";

interface AdminUserDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  orders: Order[];
  products: Product[];
  onOpenSuspendModal: (user: UserProfile) => void;
  onToggleVerification: (userId: string, currentStatus: boolean) => void;
}

export default function AdminUserDetailModal({
  isOpen,
  onClose,
  user,
  orders,
  products,
  onOpenSuspendModal,
  onToggleVerification
}: AdminUserDetailModalProps) {
  const [copiedCode, setCopiedCode] = React.useState(false);

  if (!isOpen || !user) return null;

  const userUniqueCode = user.uniqueCode || user.userCode || `USR-${(user.uid || user.id).substring(0, 6).toUpperCase()}`;

  // Calculate customer analytics
  const buyerOrders = orders.filter(o => o.buyerId === (user.uid || user.id));
  const totalSpend = buyerOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);

  // Group buyer orders by productId
  const buyerProductMap: Record<string, { name: string; quantity: number; totalSpent: number; imageUrl?: string }> = {};
  buyerOrders.forEach(o => {
    const key = o.productId || o.productName || "unknown";
    if (!buyerProductMap[key]) {
      buyerProductMap[key] = {
        name: o.productName || "Unknown Item",
        quantity: 0,
        totalSpent: 0,
        imageUrl: o.productImageUrl
      };
    }
    buyerProductMap[key].quantity += o.quantity || 1;
    buyerProductMap[key].totalSpent += o.totalPrice || 0;
    if (!buyerProductMap[key].imageUrl && o.productImageUrl) {
      buyerProductMap[key].imageUrl = o.productImageUrl;
    }
  });

  const sortedBuyerProducts = Object.values(buyerProductMap).sort((a, b) => b.quantity - a.quantity);
  const mostBoughtProduct = sortedBuyerProducts.length > 0 ? sortedBuyerProducts[0] : null;

  // Calculate seller analytics
  const sellerProducts = products.filter(p => p.sellerId === (user.uid || user.id));
  const sellerOrders = orders.filter(o => o.sellerId === (user.uid || user.id));
  const totalSellerEarnings = sellerOrders.reduce((sum, o) => sum + (o.sellerEarnings || o.totalPrice || 0), 0);
  const totalSellerUnitsSold = sellerOrders.reduce((sum, o) => sum + (o.quantity || 1), 0);

  // Aggregate product performance for this seller
  const sellerProductSalesMap: Record<string, { product: Product; unitsSold: number; revenue: number }> = {};
  sellerProducts.forEach(p => {
    sellerProductSalesMap[p.id] = {
      product: p,
      unitsSold: 0,
      revenue: 0
    };
  });

  sellerOrders.forEach(o => {
    if (o.productId && sellerProductSalesMap[o.productId]) {
      sellerProductSalesMap[o.productId].unitsSold += o.quantity || 1;
      sellerProductSalesMap[o.productId].revenue += o.totalPrice || 0;
    }
  });

  const sellerProductList = Object.values(sellerProductSalesMap);
  const sortedSellerSales = [...sellerProductList].sort((a, b) => b.unitsSold - a.unitsSold);
  const mostSoldProduct = sortedSellerSales.length > 0 ? sortedSellerSales[0] : null;
  const leastSoldProduct = sortedSellerSales.length > 1 
    ? sortedSellerSales[sortedSellerSales.length - 1] 
    : (sortedSellerSales.length === 1 ? sortedSellerSales[0] : null);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(userUniqueCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const isSuspended = user.isSuspended;
  const isPermanent = !user.suspendedUntil || user.banType === "permanent";
  const suspensionExpiry = user.suspendedUntil ? new Date(user.suspendedUntil).toLocaleString() : null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[250] flex items-center justify-center p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] w-full max-w-3xl shadow-2xl overflow-hidden my-6"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white relative">
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div className="relative">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl overflow-hidden bg-slate-800 border-2 border-white/20 shadow-xl">
                  <img
                    src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || "User")}&background=6366f1&color=fff`}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                {user.isVerified && (
                  <div className="absolute -bottom-1 -right-1 p-1 bg-blue-500 rounded-full text-white shadow-md">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>

              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                    {user.displayName || "Anonymous User"}
                  </h2>
                  <span className={cn(
                    "px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                    user.role === "seller" ? "bg-amber-400 text-amber-950" :
                    user.role === "admin" ? "bg-purple-400 text-purple-950" :
                    user.state === "Logistics Partner" ? "bg-emerald-400 text-emerald-950" :
                    "bg-blue-400 text-blue-950"
                  )}>
                    {user.state === "Logistics Partner" ? "Logistics Rider" : user.role || "Buyer"}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-indigo-400" />
                  {user.email || "No email registered"}
                </p>

                {/* Unique Code Badge */}
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/15 mt-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-200">Unique Code:</span>
                  <span className="font-mono text-xs font-black tracking-widest text-amber-300">{userUniqueCode}</span>
                  <button
                    onClick={handleCopyCode}
                    className="p-1 hover:bg-white/20 rounded-md transition-colors cursor-pointer text-slate-300 hover:text-white"
                    title="Copy Code"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Status & Quick Action Bar */}
          <div className="px-6 sm:px-8 py-4 bg-slate-50 dark:bg-slate-850 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {isSuspended ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300 rounded-full text-xs font-black">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>{isPermanent ? "Permanently Banned" : `Suspended until ${suspensionExpiry}`}</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-black">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Active & In Good Standing</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onToggleVerification(user.uid || user.id, !!user.isVerified)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                {user.isVerified ? "Revoke Verification" : "Grant Verified Badge"}
              </button>
              <button
                onClick={() => {
                  onClose();
                  onOpenSuspendModal(user);
                }}
                className={cn(
                  "px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm cursor-pointer",
                  isSuspended
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                    : "bg-red-600 hover:bg-red-700 text-white shadow-red-600/20"
                )}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                {isSuspended ? "Manage Suspension" : "Ban / Suspend Account"}
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-6 sm:p-8 space-y-6 max-h-[60vh] overflow-y-auto">
            {/* General Profile Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Campus Institution</span>
                <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                  {user.school || "Not specified"}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Phone Number</span>
                <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-500" />
                  {user.phoneNumber || user.phone || "Not provided"}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Location / State</span>
                <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-500" />
                  {user.state || "Nigeria"}
                </p>
              </div>
            </div>

            {/* CUSTOMER ANALYTICS SECTION */}
            <div className="p-5 rounded-3xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-600 text-white rounded-xl">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">Customer Buying Analytics</h4>
                    <p className="text-[11px] text-slate-500">Live order activity across campus stores</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                    {buyerOrders.length} Order{buyerOrders.length === 1 ? "" : "s"} Placed
                  </span>
                  <p className="text-[11px] font-bold text-slate-500">₦{totalSpend.toLocaleString()} Total Spent</p>
                </div>
              </div>

              {/* Most Bought Product Spotlight */}
              {mostBoughtProduct ? (
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-900/30 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-700 overflow-hidden shrink-0">
                    {mostBoughtProduct.imageUrl ? (
                      <img src={mostBoughtProduct.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <Package className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 rounded text-[9px] font-black uppercase">
                        ⭐ Most Bought Product
                      </span>
                    </div>
                    <p className="text-sm font-black text-slate-900 dark:text-white truncate mt-1">
                      {mostBoughtProduct.name}
                    </p>
                    <p className="text-xs text-slate-500 font-medium">
                      Purchased <strong className="text-indigo-600 dark:text-indigo-400">{mostBoughtProduct.quantity} unit(s)</strong> • Spent <strong>₦{mostBoughtProduct.totalSpent.toLocaleString()}</strong>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-800/60 text-center text-xs text-slate-400 font-medium">
                  This user hasn't made any purchases yet.
                </div>
              )}
            </div>

            {/* SELLER ANALYTICS SECTION */}
            {(user.role === "seller" || sellerProducts.length > 0 || sellerOrders.length > 0) && (
              <div className="p-5 rounded-3xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-amber-500 text-white rounded-xl">
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">Merchant & Seller Performance</h4>
                      <p className="text-[11px] text-slate-500">{sellerProducts.length} Active Listings</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-amber-600 dark:text-amber-400">
                      {totalSellerUnitsSold} Units Sold
                    </span>
                    <p className="text-[11px] font-bold text-slate-500">₦{totalSellerEarnings.toLocaleString()} Revenue</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Most Sold Product */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-emerald-100 dark:border-emerald-900/30 flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 overflow-hidden shrink-0">
                      {mostSoldProduct?.product?.imageUrl ? (
                        <img src={mostSoldProduct.product.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <Package className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-[9px] font-black uppercase text-emerald-600">Most Sold Product</span>
                      </div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate mt-0.5">
                        {mostSoldProduct ? mostSoldProduct.product.name : "No sales yet"}
                      </p>
                      {mostSoldProduct && (
                        <p className="text-[11px] text-slate-500 font-medium">
                          <strong>{mostSoldProduct.unitsSold}</strong> units sold • ₦{mostSoldProduct.revenue.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Least Sold Product */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-rose-100 dark:border-rose-900/30 flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 overflow-hidden shrink-0">
                      {leastSoldProduct?.product?.imageUrl ? (
                        <img src={leastSoldProduct.product.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <Package className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
                        <span className="text-[9px] font-black uppercase text-rose-500">Least Sold Product</span>
                      </div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate mt-0.5">
                        {leastSoldProduct ? leastSoldProduct.product.name : "No listings"}
                      </p>
                      {leastSoldProduct && (
                        <p className="text-[11px] text-slate-500 font-medium">
                          <strong>{leastSoldProduct.unitsSold}</strong> units sold
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 sm:p-8 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs cursor-pointer"
            >
              Close Dossier
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
