import React from "react";
import { 
  BarChart2,
  LayoutDashboard, 
  PlusCircle, 
  Package, 
  ShoppingBag, 
  Settings, 
  X,
  Store,
  Bell,
  Search,
  User,
  ShieldAlert,
  History,
  Trash2,
  FileText,
  CalendarDays,
  ChevronRight,
  LogOut,
  ArrowLeftRight,
  Share2,
  HeartHandshake,
  DollarSign,
  Zap,
  MessageSquare,
  Menu,
  Truck
} from "lucide-react";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { UserProfile } from "../types";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import Logo from "./Logo";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  role: "buyer" | "seller" | "admin";
  activeRole: "buyer" | "seller";
  onToggleRole: () => void;
  user: UserProfile | null;
  onSelectAllCategories?: () => void;
}

export default function Sidebar({ isOpen, onClose, activeTab, setActiveTab, role, activeRole, onToggleRole, user, onSelectAllCategories }: SidebarProps) {
  const isSuperAdminEmail = 
    user?.email === "fashinaayomide2005@gmail.com" || 
    user?.email === "fashinaayomide@2005@gmail.com" || 
    user?.email === "fashinaayomide12005@gmail.com" || 
    user?.email === "tommzypolaris@gmail.com";

  // Only show in sidebar if currently in admin mode or if super admin on admin tab
  const adminItem = (activeTab === "admin" && (user?.role === "admin" || isSuperAdminEmail)) 
    ? [{ id: "admin", label: "Admin Operations", icon: ShieldAlert }] 
    : [];

  const navItems = !user ? [
    { id: "market", label: "Marketplace", icon: Store },
    { id: "search", label: "Search", icon: Search },
    { id: "logistics", label: "Campus Logistics", icon: Truck },
    { id: "settings", label: "Sign In", icon: User },
  ] : (user?.state === "Logistics Partner") ? [
    ...adminItem,
    { id: "logistics", label: "Campus Logistics Hub", icon: Truck },
    { id: "messages", label: "Messages", icon: MessageSquare },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "support", label: "Customer Support", icon: HeartHandshake },
    { id: "feedback-help", label: "Feedback & Help", icon: MessageSquare },
    { id: "settings", label: "Settings", icon: Settings },
  ] : (activeRole === "buyer") ? [
    ...adminItem,
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "market", label: "Marketplace", icon: Store },
    { id: "search", label: "Search", icon: Search },
    { id: "logistics", label: "Campus Logistics", icon: Truck },
    { id: "orders", label: "My Orders", icon: ShoppingBag },
    { id: "referrals", label: "Referral Program", icon: Share2 },
    { id: "history", label: "Product Trash", icon: Trash2 },
    { id: "support", label: "Customer Support", icon: HeartHandshake },
    { id: "feedback-help", label: "Feedback & Help", icon: MessageSquare },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "messages", label: "Messages", icon: MessageSquare },
    { id: "settings", label: "Settings", icon: Settings },
  ] : activeRole === "seller" ? [
    ...adminItem,
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "analytics", label: "Sales Analytics", icon: BarChart2 },
    { id: "search", label: "Search", icon: Search },
    { id: "logistics", label: "Campus Logistics", icon: Truck },
    { id: "add-product", label: "Add Product", icon: PlusCircle },
    { id: "my-products", label: "My Products", icon: Package },
    { id: "orders", label: "Orders", icon: ShoppingBag },
    { id: "payouts", label: "Earnings & Payouts", icon: DollarSign },
    { id: "storefront", label: "Storefront", icon: Store },
    { id: "referrals", label: "Referral Program", icon: Share2 },
    { id: "support", label: "Customer Support", icon: HeartHandshake },
    { id: "feedback-help", label: "Feedback & Help", icon: MessageSquare },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "messages", label: "Messages", icon: MessageSquare },
    { id: "settings", label: "Settings", icon: Settings },
  ] : [
    ...adminItem,
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "market", label: "Marketplace", icon: Store },
    { id: "search", label: "Search", icon: Search },
    { id: "logistics", label: "Campus Logistics", icon: Truck },
    { id: "orders", label: "My Orders", icon: ShoppingBag },
    { id: "referrals", label: "Referral Program", icon: Share2 },
    { id: "support", label: "Customer Support", icon: HeartHandshake },
    { id: "feedback-help", label: "Feedback & Help", icon: MessageSquare },
    { id: "history", label: "Product Trash", icon: Trash2 },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "messages", label: "Messages", icon: MessageSquare },
    { id: "settings", label: "Profile", icon: User },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-[200]"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container */}
      <motion.aside 
        initial={{ x: -400 }}
        animate={{ x: isOpen ? 0 : -400 }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed top-0 left-0 bottom-0 w-[85vw] max-w-[365px] bg-white dark:bg-slate-900 text-slate-900 dark:text-white z-[210] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-brand-gradient p-6 sm:p-8 flex flex-col gap-4 shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full -mr-16 -mt-16 blur-2xl" />
          
          {/* Elegant Close Button Inside Visible Area */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all focus:outline-none z-30 cursor-pointer"
            title="Close menu"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Shopiversity Logo inside Drawer Header */}
          <div className="relative z-10 pb-1">
            <Logo 
              showText={true} 
              onClick={() => {
                setActiveTab(activeRole === "seller" ? "dashboard" : "market");
                onClose();
              }}
              className="text-white"
            />
          </div>
          
          <div className="flex items-center justify-between relative z-10">
            <button
              onClick={() => {
                setActiveTab("settings");
                onClose();
              }}
              className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-xl overflow-hidden hover:scale-105 active:scale-95 transition-all cursor-pointer border-none outline-none group"
              title="View Profile Settings"
            >
              {user?.photoURL ? (
                <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-7 h-7 text-white" />
              )}
            </button>
            
            <div className="flex items-center gap-2">
              {(user?.role === "both" || user?.role === "seller" || user?.role === "admin") && user?.state !== "Logistics Partner" && (
                <button 
                  onClick={onToggleRole}
                  className="flex items-center gap-2 px-3 py-2 bg-white/20 backdrop-blur-md rounded-xl border border-white/30 text-white hover:bg-white/30 transition-all active:scale-95 shadow-lg group"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    Switch to {activeRole === "buyer" ? "Seller" : "Buyer"}
                  </span>
                </button>
              )}
            </div>
          </div>
          
          <button
            onClick={() => {
              setActiveTab("settings");
              onClose();
            }}
            className="relative z-10 text-left hover:opacity-90 transition-opacity cursor-pointer border-none outline-none group"
            title="View Profile Settings"
          >
            <p className="text-white/70 text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
              <span>{user?.state === "Logistics Partner" ? "Logistics Partner Account" : (activeRole === "buyer" ? "Shopping Account" : "Seller Account")}</span>
              <ChevronRight className="w-3.5 h-3.5 text-white/70 group-hover:translate-x-0.5 transition-transform" />
            </p>
            <h2 className="text-2xl font-black !text-white tracking-tight no-underline">Hello, {user?.displayName?.split(' ')[0] || "Guest"}</h2>
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-4 py-8 space-y-8">
          <div>
            <div className="flex items-center gap-3 mb-4 px-4">
               <div className="w-1.5 h-6 bg-[#ff6b00] rounded-full" />
               <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Your Experience</h3>
            </div>
            <div className="space-y-1">
              {navItems.filter(item => ["settings", "orders", "notifications", "messages", "history", "referrals", "support", "feedback-help", "admin", "payouts"].includes(item.id)).map((item, idx) => (
                <button
                   key={`nav-exp-${item.id}-${idx}`}
                   onClick={() => {
                    setActiveTab(item.id);
                    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
                    const mainEl = document.querySelector("main");
                    if (mainEl) mainEl.scrollTop = 0;
                    onClose();
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all group duration-300 relative overflow-hidden outline-none border-none cursor-pointer",
                    activeTab === item.id 
                      ? "bg-gradient-to-r from-[#ff6b00] to-[#ff8c00] text-white shadow-md shadow-orange-500/15" 
                      : "text-slate-500 dark:text-slate-450 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <item.icon className={cn("w-5 h-5 transition-transform duration-300 group-hover:scale-110", activeTab === item.id ? "text-white" : "text-slate-400 dark:text-zinc-500 group-hover:text-[#ff6b00]")} />
                    <span className="text-[15px] font-semibold tracking-tight">{item.label}</span>
                  </div>
                  <ChevronRight className={cn("w-4 h-4 opacity-0 group-hover:opacity-100 transition-all duration-301", activeTab === item.id ? "opacity-100 text-white" : "text-slate-300 dark:text-zinc-650")} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-4 px-4">
               <div className="w-1.5 h-6 bg-[#ff6b00] rounded-full" />
               <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Explore Campus</h3>
            </div>
            <div className="space-y-1">
               {navItems.filter(item => ["market", "search", "dashboard", "add-product", "my-products", "storefront", "logistics"].includes(item.id)).map((item, idx) => (
                <button
                  key={`nav-explore-${item.id}-${idx}`}
                  onClick={() => {
                    setActiveTab(item.id);
                    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
                    const mainEl = document.querySelector("main");
                    if (mainEl) mainEl.scrollTop = 0;
                    onClose();
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all group duration-300 relative overflow-hidden outline-none border-none cursor-pointer",
                    activeTab === item.id 
                      ? "bg-gradient-to-r from-[#ff6b00] to-[#ff8c00] text-white shadow-md shadow-orange-500/15" 
                      : "text-slate-500 dark:text-slate-450 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <item.icon className={cn("w-5 h-5 transition-transform duration-300 group-hover:scale-110", activeTab === item.id ? "text-white" : "text-slate-400 dark:text-zinc-500 group-hover:text-[#ff6b00]")} />
                    <span className="text-[15px] font-semibold tracking-tight">{item.label}</span>
                  </div>
                  <ChevronRight className={cn("w-4 h-4 opacity-0 group-hover:opacity-100 transition-all duration-301", activeTab === item.id ? "opacity-100 text-white" : "text-slate-300 dark:text-zinc-650")} />
                </button>
              ))}

              {/* All Categories Button removed */}
            </div>
          </div>

          {/* Footer as part of normal side menu at the bottom */}
          <div className="pt-8 border-t border-slate-100 dark:border-slate-800 space-y-6 px-4">
             <button 
               onClick={() => {
                 setActiveTab("terms");
                 onClose();
               }}
               className="flex items-center gap-3 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors bg-transparent border-none cursor-pointer outline-none"
             >
                <FileText className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-widest">Terms & Policies</span>
             </button>

             {user && (
               <button 
                 onClick={() => {
                   signOut(auth);
                   onClose();
                 }}
                 className="flex items-center gap-3 text-red-500 hover:text-red-600 transition-colors bg-transparent border-none cursor-pointer outline-none"
               >
                  <LogOut className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">Sign Out</span>
               </button>
             )}
          </div>
        </div>

      </motion.aside>
    </>
  );
}
