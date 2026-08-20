import React from "react";
import { 
  X, 
  ShieldAlert, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar, 
  Ban, 
  RotateCcw,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { doc, updateDoc, addDoc, collection } from "firebase/firestore";
import { db } from "../firebase";
import { handleFirestoreError, OperationType } from "../lib/firebase-errors";

interface AdminSuspendModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any | null;
  currentUser: any;
  onSuccess?: () => void;
}

const PRESET_DURATIONS = [
  { label: "1 Hour", hours: 1 },
  { label: "24 Hours (1 Day)", hours: 24 },
  { label: "3 Days", hours: 72 },
  { label: "7 Days (1 Week)", hours: 168 },
  { label: "14 Days (2 Weeks)", hours: 336 },
  { label: "30 Days (1 Month)", hours: 720 },
  { label: "Custom Date/Time", hours: -1 },
  { label: "Permanent Ban", hours: 0 }
];

const PRESET_REASONS = [
  "Violation of Community Terms (Off-platform transaction attempt)",
  "Suspicious or fraudulent product listing",
  "Buyer non-delivery / Escrow dispute violation",
  "Harassment, abuse, or inappropriate communications",
  "Repeated spamming or deceptive marketing",
  "Failed identity verification / Fraudulent credentials",
  "Multiple community strikes received",
  "Other (Specify below)"
];

export default function AdminSuspendModal({
  isOpen,
  onClose,
  user,
  currentUser,
  onSuccess
}: AdminSuspendModalProps) {
  const [banType, setBanType] = React.useState<"temporary" | "permanent">("temporary");
  const [selectedPresetHours, setSelectedPresetHours] = React.useState<number>(24);
  const [customDateTime, setCustomDateTime] = React.useState<string>("");
  const [selectedReason, setSelectedReason] = React.useState<string>(PRESET_REASONS[0]);
  const [customReason, setCustomReason] = React.useState<string>("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (user) {
      if (user.isSuspended && user.suspendedUntil) {
        setBanType("temporary");
        const date = new Date(user.suspendedUntil);
        const isoLocal = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        setCustomDateTime(isoLocal);
      } else if (user.isSuspended) {
        setBanType("permanent");
      } else {
        setBanType("temporary");
        setSelectedPresetHours(24);
      }
      setSelectedReason(user.suspensionReason || PRESET_REASONS[0]);
      setCustomReason(user.suspensionReason && !PRESET_REASONS.includes(user.suspensionReason) ? user.suspensionReason : "");
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const handleApplySuspension = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      let expiryIso: string | null = null;
      let finalBanType: "temporary" | "permanent" = banType;

      if (banType === "temporary") {
        if (selectedPresetHours > 0) {
          const targetTime = new Date(Date.now() + selectedPresetHours * 60 * 60 * 1000);
          expiryIso = targetTime.toISOString();
        } else if (selectedPresetHours === -1 && customDateTime) {
          const parsed = new Date(customDateTime);
          if (isNaN(parsed.getTime()) || parsed.getTime() <= Date.now()) {
            throw new Error("Please choose a future date and time for the suspension expiry.");
          }
          expiryIso = parsed.toISOString();
        } else if (selectedPresetHours === 0) {
          finalBanType = "permanent";
          expiryIso = null;
        }
      }

      const finalReason = selectedReason === "Other (Specify below)" && customReason.trim()
        ? customReason.trim()
        : (selectedReason || "Administrative policy enforcement");

      const userRef = doc(db, "users", user.uid || user.id);
      await updateDoc(userRef, {
        isSuspended: true,
        suspendedUntil: expiryIso,
        suspensionReason: finalReason,
        banType: finalBanType,
        bannedAt: new Date().toISOString(),
        bannedBy: currentUser?.email || "Super Admin",
        updatedAt: new Date().toISOString()
      });

      // Send real-time notification to user's notifications inbox
      try {
        await addDoc(collection(db, "notifications"), {
          userId: user.uid || user.id,
          title: finalBanType === "permanent" ? "Account Permanently Banned" : "Account Temporarily Suspended",
          message: finalBanType === "permanent"
            ? `Your SHOPIVERSITY account has been permanently restricted. Reason: ${finalReason}`
            : `Your account is suspended until ${expiryIso ? new Date(expiryIso).toLocaleString() : "further notice"}. Reason: ${finalReason}`,
          type: "moderation",
          isRead: false,
          createdAt: new Date().toISOString()
        });
      } catch (notifErr) {
        console.warn("Could not dispatch suspension in-app notification:", notifErr);
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Error setting suspension:", err);
      setError(err.message || "Failed to update user suspension status");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnsuspend = async () => {
    if (!confirm(`Are you sure you want to lift all suspensions for ${user.displayName || user.email}?`)) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const userRef = doc(db, "users", user.uid || user.id);
      await updateDoc(userRef, {
        isSuspended: false,
        suspendedUntil: null,
        suspensionReason: null,
        banType: null,
        updatedAt: new Date().toISOString()
      });

      // Send restoration notification
      try {
        await addDoc(collection(db, "notifications"), {
          userId: user.uid || user.id,
          title: "Account Restored!",
          message: "Your SHOPIVERSITY account suspension has been lifted. You have full access to campus marketplace services.",
          type: "general",
          isRead: false,
          createdAt: new Date().toISOString()
        });
      } catch (notifErr) {
        console.warn("Could not dispatch unsuspend notification:", notifErr);
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Error unsuspending user:", err);
      setError(err.message || "Failed to unsuspend user");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[300] flex items-center justify-center p-4 overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden my-8"
        >
          {/* Modal Header */}
          <div className="bg-gradient-to-r from-red-600 to-rose-700 p-6 sm:p-8 text-white relative">
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                <ShieldAlert className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-red-200">
                Security & Moderation Enforcement
              </span>
            </div>
            <h3 className="text-2xl font-black tracking-tight text-white">
              {user.isSuspended ? "Manage Suspension / Ban" : "Ban or Suspend User"}
            </h3>
            <p className="text-red-100 text-xs sm:text-sm mt-1">
              Target User: <strong className="text-white">{user.displayName || "Unknown"}</strong> ({user.email || "No email"})
            </p>
          </div>

          {/* Modal Content */}
          <div className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
            {error && (
              <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {user.isSuspended && (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
                    Currently Restricted
                  </span>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {user.suspendedUntil 
                      ? `Suspended until ${new Date(user.suspendedUntil).toLocaleString()}`
                      : "Permanently Banned"}
                  </p>
                  {user.suspensionReason && (
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 italic">
                      Reason: "{user.suspensionReason}"
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleUnsuspend}
                  disabled={isSubmitting}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Unsuspend Now
                </button>
              </div>
            )}

            {/* Type selector */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Restriction Level
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setBanType("temporary");
                    if (selectedPresetHours === 0) setSelectedPresetHours(24);
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    banType === "temporary"
                      ? "border-red-500 bg-red-50/70 dark:bg-red-950/30 text-red-900 dark:text-red-100 ring-2 ring-red-500/20"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-black text-sm flex items-center gap-2">
                      <Clock className="w-4 h-4 text-red-600" />
                      Temporary Suspension
                    </span>
                    {banType === "temporary" && <CheckCircle2 className="w-4 h-4 text-red-600" />}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Account access paused for a specified duration and auto-reactivated.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setBanType("permanent");
                    setSelectedPresetHours(0);
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    banType === "permanent"
                      ? "border-red-600 bg-red-600 text-white shadow-lg shadow-red-600/20"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-black text-sm flex items-center gap-2">
                      <Ban className="w-4 h-4" />
                      Permanent Ban
                    </span>
                    {banType === "permanent" && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </div>
                  <p className={`text-[11px] ${banType === "permanent" ? "text-red-100" : "text-slate-500 dark:text-slate-400"}`}>
                    Indefinite block. Account cannot buy, sell, or log into campus services.
                  </p>
                </button>
              </div>
            </div>

            {/* Duration Selector if temporary */}
            {banType === "temporary" && (
              <div className="space-y-3">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Select Suspension Duration / Time Limit
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PRESET_DURATIONS.filter(d => d.hours !== 0).map((preset, idx) => (
                    <button
                      key={`preset-${preset.hours}-${idx}`}
                      type="button"
                      onClick={() => setSelectedPresetHours(preset.hours)}
                      className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-center border cursor-pointer ${
                        selectedPresetHours === preset.hours
                          ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-md"
                          : "bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {selectedPresetHours === -1 && (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2 mt-2">
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-red-500" />
                      Set Exact Expiry Date and Time
                    </label>
                    <input
                      type="datetime-local"
                      value={customDateTime}
                      onChange={(e) => setCustomDateTime(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-red-500 outline-none"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Reason Selector */}
            <div className="space-y-3">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Reason for Moderation Action
              </label>
              <select
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-red-500 outline-none cursor-pointer"
              >
                {PRESET_REASONS.map((r, idx) => (
                  <option key={`reason-opt-${idx}`} value={r} className="text-slate-900 dark:text-white py-2">
                    {r}
                  </option>
                ))}
              </select>

              {(selectedReason === "Other (Specify below)" || !PRESET_REASONS.includes(selectedReason)) && (
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Explain the specific community violation or details of the ban/suspension..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-red-500 outline-none"
                />
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-6 sm:p-8 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApplySuspension}
              disabled={isSubmitting}
              className="px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-red-600/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <ShieldAlert className="w-4 h-4" />
                  {banType === "permanent" ? "Confirm Permanent Ban" : "Apply Suspension"}
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
