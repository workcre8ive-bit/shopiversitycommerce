import React from "react";
import { auth, db } from "../firebase";
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { Notification } from "../types";
import { Bell, CheckCircle2, Trash2, Loader2, Mail, MailOpen, AlertCircle, Info, Package, User, CreditCard, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { handleFirestoreError, OperationType } from "../lib/firebase-errors";
import { cn } from "../lib/utils";

interface NotificationsPageProps {
  onBack?: () => void;
}

export default function NotificationsPage({ onBack }: NotificationsPageProps) {
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<"all" | "unread" | "read">("all");
  const [showClearConfirm, setShowClearConfirm] = React.useState(false);
  const [clearing, setClearing] = React.useState(false);

  React.useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", auth.currentUser.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = Array.from(new Map(snapshot.docs.map(doc => {
        const d = { id: doc.id, ...doc.data() } as Notification;
        return [d.id, d];
      })).values());
      setNotifications(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "notifications");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const markAsRead = async (id: string, e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    // Optimistic UI update for instant feedback on Safari/Mobile
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    try {
      await updateDoc(doc(db, "notifications", id), { isRead: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `notifications/${id}`);
    }
  };

  const markAllAsRead = async (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const unread = notifications.filter(n => !n.isRead);
    if (unread.length === 0) return;
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    const promises = unread.map(n => updateDoc(doc(db, "notifications", n.id), { isRead: true }));
    try {
      await Promise.all(promises);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const deleteNotification = async (id: string, e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    // Optimistic UI update for instant feedback on Safari/Mobile
    setNotifications(prev => prev.filter(n => n.id !== id));
    try {
      await deleteDoc(doc(db, "notifications", id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `notifications/${id}`);
    }
  };

  const handleClearAll = async () => {
    setClearing(true);
    try {
      const promises = notifications.map(n => deleteDoc(doc(db, "notifications", n.id)));
      await Promise.all(promises);
      setShowClearConfirm(false);
    } catch (error) {
      console.error("Error clearing notifications:", error);
    } finally {
      setClearing(false);
    }
  };
  const filteredNotifications = notifications.filter(n => {
    if (filter === "unread") return !n.isRead;
    if (filter === "read") return n.isRead;
    return true;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case "order": return <Package className="w-5 h-5" />;
      case "account": return <User className="w-5 h-5" />;
      case "payout": return <CreditCard className="w-5 h-5" />;
      case "welcome": return <Info className="w-5 h-5" />;
      case "profile": return <AlertCircle className="w-5 h-5" />;
      default: return <Bell className="w-5 h-5" />;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case "order": return "text-blue-600 bg-blue-50 dark:bg-blue-900/10";
      case "account": return "text-purple-600 bg-purple-50 dark:bg-purple-900/10";
      case "payout": return "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/10";
      case "welcome": return "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/10";
      case "profile": return "text-red-600 bg-red-50 dark:bg-red-900/10";
      default: return "text-slate-600 bg-slate-50 dark:bg-slate-900/10";
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
        <p className="text-slate-500 font-medium">Loading notifications...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:scale-105 transition-all text-slate-600 dark:text-slate-400 group"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl flex items-center justify-center text-indigo-600">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white font-display tracking-tight">Notifications</h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Stay updated with your account activity</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {notifications.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors uppercase tracking-wider"
            >
              <Trash2 className="w-4 h-4" />
              Clear All
            </button>
          )}
          <button
            onClick={markAllAsRead}
            disabled={!notifications.some(n => !n.isRead)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 rounded-xl transition-colors uppercase tracking-wider disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            Mark all as read
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 p-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 w-fit">
        {(["all", "unread", "read"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
              filter === f 
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none" 
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredNotifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-12 text-center border border-slate-100 dark:border-slate-800"
            >
              <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                <Bell className="w-10 h-10 text-slate-200 dark:text-slate-700" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No notifications found</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                {filter === "all" ? "You're all caught up! Check back later for updates." : `You have no ${filter} notifications.`}
              </p>
            </motion.div>
          ) : (
            filteredNotifications.map((notification, idx) => (
              <motion.div
                key={`notif-card-${idx}-${notification.id}`}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={cn(
                  "group bg-white dark:bg-slate-900 rounded-3xl border p-6 flex gap-6 items-start transition-all relative overflow-hidden",
                  notification.isRead 
                    ? "border-slate-100 dark:border-slate-800 opacity-75" 
                    : "border-indigo-100 dark:border-indigo-900/30 shadow-sm"
                )}
              >
                {!notification.isRead && (
                  <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600" />
                )}
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", getColor(notification.type))}>
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className={cn("text-base font-bold truncate", notification.isRead ? "text-slate-600 dark:text-slate-400" : "text-slate-900 dark:text-white")}>
                      {notification.title}
                    </h4>
                    <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap ml-4">
                      {new Date(notification.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className={cn("text-sm leading-relaxed mb-4", notification.isRead ? "text-slate-500 dark:text-slate-500" : "text-slate-600 dark:text-slate-300")}>
                    {notification.message}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 pt-1 z-20">
                    {!notification.isRead && (
                      <button
                        type="button"
                        onClick={(e) => markAsRead(notification.id, e)}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 rounded-xl text-xs font-black uppercase tracking-wider transition-all touch-manipulation cursor-pointer active:scale-95 shadow-sm shrink-0"
                      >
                        <MailOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                        <span>Mark as read</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => deleteNotification(notification.id, e)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/50 hover:text-red-600 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 rounded-xl text-xs font-black uppercase tracking-wider transition-all touch-manipulation cursor-pointer active:scale-95 shadow-sm shrink-0"
                    >
                      <Trash2 className="w-4 h-4 text-red-500 shrink-0" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Clear All Confirmation Modal */}
      <AnimatePresence>
        {showClearConfirm && (
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
              <h3 className="text-xl font-bold text-slate-900 dark:text-white text-center mb-2">Clear Notifications?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-8">Are you sure you want to delete all notifications? This action cannot be undone.</p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowClearConfirm(false)}
                  disabled={clearing}
                  className="flex-1 py-4 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleClearAll}
                  disabled={clearing}
                  className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-bold text-sm hover:bg-red-700 transition-all shadow-lg shadow-red-100 dark:shadow-red-900/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {clearing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Clear All"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
