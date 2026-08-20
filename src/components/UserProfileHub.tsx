import React from "react";
import { 
  User, 
  MapPin, 
  CreditCard, 
  ShoppingBag, 
  Share2, 
  History, 
  Trash2,
  HeartHandshake, 
  MessageSquare, 
  ShieldAlert, 
  LogOut, 
  ChevronRight, 
  ArrowLeftRight, 
  Sun, 
  Moon, 
  ShieldCheck, 
  Bell, 
  Coins, 
  Settings, 
  Activity, 
  ShieldAlert as AlertIcon,
  Sparkles
} from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../lib/utils";

interface UserProfileHubProps {
  user: any;
  activeRole: "buyer" | "seller";
  onToggleRole: () => void;
  onNavigateToEdit: (section?: string) => void;
  onNavigateTab: (tabId: string) => void;
  onLogout: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export default function UserProfileHub({
  user,
  activeRole,
  onToggleRole,
  onNavigateToEdit,
  onNavigateTab,
  onLogout,
  isDarkMode,
  toggleDarkMode
}: UserProfileHubProps) {
  const isProfileComplete = !!user?.displayName && !!user?.username && !!user?.schoolName && !!user?.location && (user?.role === "seller" || !!user?.deliveryAddress);

  const menuGroups = [
    {
      title: "Account & Deliveries",
      items: [
        {
          id: "edit-profile",
          label: "Edit Personal Details",
          sublabel: "Change name, avatar, and username",
          icon: User,
          color: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
          onClick: () => onNavigateToEdit("personal")
        },
        {
          id: "campus-delivery",
          label: "Campus & Location Info",
          sublabel: `${user?.campus || "Not configured"} • ${user?.deliveryAddress ? "Address saved" : "No address"}`,
          icon: MapPin,
          color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
          onClick: () => onNavigateToEdit("campus")
        },
        {
          id: "payment-details",
          label: "Banking & Bank Transfers",
          sublabel: user?.bankDetails?.bankName ? `${user.bankDetails.bankName} (${user.bankDetails.accountNumber?.slice(-4)})` : "Add verified bank account for payouts",
          icon: CreditCard,
          color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
          onClick: () => onNavigateToEdit("payment")
        }
      ]
    },
    {
      title: "My Activity",
      items: [
        {
          id: "orders",
          label: activeRole === "seller" ? "Merchant Sales Orders" : "My Orders & Purchases",
          sublabel: "Track active shipments, orders, and tickets",
          icon: ShoppingBag,
          color: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
          onClick: () => onNavigateTab("orders")
        },
        {
          id: "messages",
          label: "Direct Messages & Chats",
          sublabel: "Contact sellers or buyers on campus",
          icon: MessageSquare,
          color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
          onClick: () => onNavigateTab("messages")
        },
        {
          id: "referrals",
          label: "Refer & Earn ₦1,500",
          sublabel: `Referrals: ${user?.referralCount || 0} • Share dynamic link`,
          icon: Share2,
          color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
          onClick: () => onNavigateTab("referrals")
        },
        ...(activeRole === "buyer" ? [
          {
            id: "history",
            label: "Product Trash",
            sublabel: "View and manage hidden or deleted product history",
            icon: Trash2,
            color: "bg-red-500/10 text-red-600 dark:text-red-400",
            onClick: () => onNavigateTab("history")
          }
        ] : [])
      ]
    },
    {
      title: "Support & Legal",
      items: [
        {
          id: "support",
          label: "Help Center & Escrow Support",
          sublabel: "24/7 student resolution hub",
          icon: HeartHandshake,
          color: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
          onClick: () => onNavigateTab("support")
        },
        {
          id: "feedback",
          label: "Feedback & Bug Reports",
          sublabel: "Help us build a better marketplace",
          icon: MessageSquare,
          color: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
          onClick: () => onNavigateTab("feedback-help")
        },
        {
          id: "terms",
          label: "Terms of Service & Rules",
          sublabel: "Escrow policies and campus safety rules",
          icon: ShieldAlert,
          color: "bg-red-500/10 text-red-600 dark:text-red-400",
          onClick: () => onNavigateTab("terms")
        },
        ...(user?.email === "tommzypolaris@gmail.com" ? [
          {
            id: "admin",
            label: "Administrator Console",
            sublabel: "Manage disputes, reviews, and users",
            icon: ShieldCheck,
            color: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
            onClick: () => onNavigateTab("admin")
          }
        ] : [])
      ]
    }
  ];

  return (
    <div className="w-full max-w-md mx-auto space-y-6 pb-24 font-sans select-none animate-in fade-in duration-300">
      {/* Native App Top Header (Integrated) */}
      <div className="px-1 text-left pt-2">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2 font-sans">
          <span>My Profile</span>
          <Activity className="w-5 h-5 text-[#ff6b00] animate-pulse" />
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Control center for your campus account</p>
      </div>

      {/* User Card */}
      <div className="bg-white dark:bg-zinc-900/90 rounded-[2.25rem] border border-slate-100 dark:border-zinc-800/80 p-6 shadow-sm flex items-center gap-4 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full -mr-8 -mt-8 blur-xl pointer-events-none" />
        <div className="w-16 h-16 rounded-2xl bg-orange-100 dark:bg-zinc-800 flex-shrink-0 overflow-hidden relative shadow-md border-2 border-white dark:border-zinc-800">
          <img 
            src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid || "guest"}`} 
            alt="" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="font-extrabold text-slate-800 dark:text-white text-base truncate">{user?.displayName || "Campus User"}</h3>
            {user?.isVerified && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-[8px] font-black uppercase tracking-wider">
                <ShieldCheck className="w-2.5 h-2.5 fill-current" />
                Verified
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 dark:text-zinc-500 font-medium">@{user?.username || "campus_pioneer"}</p>
          <p className="text-[10px] font-bold text-[#ff6b00] mt-1 bg-orange-50 dark:bg-orange-950/20 px-2 py-0.5 rounded-md w-fit uppercase tracking-wider">
            {user?.campus || "Unspecified Campus"}
          </p>
        </div>
        <button
          onClick={() => onNavigateToEdit("personal")}
          className="p-2 bg-slate-50 hover:bg-orange-50 dark:bg-zinc-800/50 dark:hover:bg-zinc-800 rounded-xl border border-slate-100 dark:border-zinc-700/50 text-slate-400 hover:text-[#ff6b00] transition-colors shrink-0"
          title="Edit profile settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Modern iOS-Style Segmented Role Switcher */}
      {user && (user.role === "both" || user.role === "seller" || user.role === "admin") && (
        <div className="p-1.5 bg-slate-100 dark:bg-zinc-900 rounded-2xl flex items-center relative border border-slate-200/50 dark:border-zinc-800/80">
          <button
            onClick={() => {
              if (activeRole !== "buyer") onToggleRole();
            }}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer z-10",
              activeRole === "buyer" 
                ? "bg-white dark:bg-zinc-800 text-[#ff6b00] shadow-md font-black" 
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-zinc-300"
            )}
          >
            <User className="w-3.5 h-3.5" />
            Buyer Hub
          </button>
          <button
            onClick={() => {
              if (activeRole !== "seller") onToggleRole();
            }}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer z-10",
              activeRole === "seller" 
                ? "bg-white dark:bg-zinc-800 text-[#ff6b00] shadow-md font-black" 
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-zinc-300"
            )}
          >
            <Sparkles className="w-3.5 h-3.5 text-orange-450" />
            Seller Hub
          </button>
        </div>
      )}

      {/* Quick Stats Dashboard Banner */}
      <div className="grid grid-cols-3 gap-3">
        {activeRole === "buyer" ? (
          <>
            <div className="bg-slate-50/50 dark:bg-zinc-900/40 p-3 rounded-2xl border border-slate-100 dark:border-zinc-800/50 text-center">
              <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 block uppercase tracking-wider">Referrals</span>
              <span className="text-lg font-black text-slate-800 dark:text-white block mt-0.5">{user?.referralCount || 0}</span>
            </div>
            <div className="bg-slate-50/50 dark:bg-zinc-900/40 p-3 rounded-2xl border border-slate-100 dark:border-zinc-800/50 text-center">
              <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 block uppercase tracking-wider">Status</span>
              <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 block mt-1.5 uppercase tracking-wide">
                {isProfileComplete ? "Verified" : "Incomplete"}
              </span>
            </div>
            <div className="bg-slate-50/50 dark:bg-zinc-900/40 p-3 rounded-2xl border border-slate-100 dark:border-zinc-800/50 text-center">
              <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 block uppercase tracking-wider">Points</span>
              <span className="text-lg font-black text-amber-500 block mt-0.5">{(user?.referralCount || 0) * 1500} pts</span>
            </div>
          </>
        ) : (
          <>
            <div className="bg-slate-50/50 dark:bg-zinc-900/40 p-3 rounded-2xl border border-slate-100 dark:border-zinc-800/50 text-center">
              <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 block uppercase tracking-wider">Balance</span>
              <span className="text-xs font-black text-slate-800 dark:text-white block mt-1.5 truncate">₦{user?.earningsBalance !== undefined ? user.earningsBalance.toLocaleString() : "0"}</span>
            </div>
            <div className="bg-slate-50/50 dark:bg-zinc-900/40 p-3 rounded-2xl border border-slate-100 dark:border-zinc-800/50 text-center">
              <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 block uppercase tracking-wider">Store</span>
              <span className="text-[9px] font-black text-amber-600 block mt-1.5 uppercase tracking-wide truncate">
                {user?.businessName || user?.storefrontSettings?.businessName || "Active"}
              </span>
            </div>
            <div className="bg-slate-50/50 dark:bg-zinc-900/40 p-3 rounded-2xl border border-slate-100 dark:border-zinc-800/50 text-center">
              <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 block uppercase tracking-wider">Level</span>
              <span className="text-lg font-black text-[#ff6b00] block mt-0.5">Pro</span>
            </div>
          </>
        )}
      </div>

      {/* Settings Menu Options List */}
      <div className="space-y-6">
        {menuGroups.map((group, gIdx) => (
          <div key={`group-${gIdx}`} className="space-y-2">
            <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest text-left px-2">
              {group.title}
            </h4>
            <div className="bg-white dark:bg-zinc-900/85 rounded-3xl border border-slate-150/60 dark:border-zinc-800/80 overflow-hidden shadow-sm divide-y divide-slate-100 dark:divide-zinc-800/60">
              {group.items.map((item, itemIdx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={`hub-item-${item.id}-${gIdx}-${itemIdx}`}
                    onClick={item.onClick}
                    className="w-full px-4 py-3.5 hover:bg-orange-50/20 dark:hover:bg-zinc-800/45 transition-colors flex items-center justify-between text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className={cn("w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-sm", item.color)}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-slate-800 dark:text-white text-sm block tracking-tight">
                          {item.label}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium block truncate">
                          {item.sublabel}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-350 dark:text-zinc-650 group-hover:translate-x-0.5 transition-transform shrink-0 ml-2" />
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Theme Settings Group */}
        <div className="space-y-2">
          <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest text-left px-2">
            Preferences & Security
          </h4>
          <div className="bg-white dark:bg-zinc-900/85 rounded-3xl border border-slate-150/60 dark:border-zinc-800/80 overflow-hidden shadow-sm divide-y divide-slate-100 dark:divide-zinc-800/60">
            <button
              onClick={toggleDarkMode}
              className="w-full px-4 py-3.5 hover:bg-orange-50/20 dark:hover:bg-zinc-800/45 transition-colors flex items-center justify-between text-left group cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                  {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </div>
                <div>
                  <span className="font-bold text-slate-800 dark:text-white text-sm block tracking-tight">
                    Theme Mode
                  </span>
                  <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium block">
                    Currently: {isDarkMode ? "Dark Theme" : "Light Theme"}
                  </span>
                </div>
              </div>
              <div className="w-8 h-4 rounded-full bg-slate-200 dark:bg-zinc-700 p-0.5 transition-colors flex items-center relative cursor-pointer shadow-inner">
                <div className={cn(
                  "w-3 h-3 rounded-full bg-white dark:bg-zinc-100 shadow-md transition-all",
                  isDarkMode ? "translate-x-4 bg-orange-500 dark:bg-orange-400" : ""
                )} />
              </div>
            </button>
          </div>
        </div>

        {/* Logout Button */}
        <div className="pt-2 px-1">
          <button
            onClick={onLogout}
            className="w-full h-12 bg-red-500/10 hover:bg-red-500/20 active:scale-[0.99] rounded-2xl border border-red-500/20 text-red-600 dark:text-red-400 font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Account</span>
          </button>
        </div>
      </div>
    </div>
  );
}
