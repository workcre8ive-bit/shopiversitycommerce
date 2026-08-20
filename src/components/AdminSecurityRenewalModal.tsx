import React from "react";
import { 
  X, 
  Key, 
  Mail, 
  Send, 
  CheckCircle2, 
  ShieldCheck, 
  RefreshCw, 
  AlertCircle, 
  Copy, 
  Check,
  Lock,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AdminSecurityRenewalModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
}

export default function AdminSecurityRenewalModal({
  isOpen,
  onClose,
  currentUser
}: AdminSecurityRenewalModalProps) {
  const [isSending, setIsSending] = React.useState(false);
  const [successResult, setSuccessResult] = React.useState<any | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [copiedPasskey, setCopiedPasskey] = React.useState(false);

  const handleRenewCredentials = async () => {
    setIsSending(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/renew-login-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminEmail: currentUser?.email || "fashinaayomide2005@gmail.com",
          adminName: currentUser?.displayName || "System Administrator",
          targetNotificationEmail: "fashinaayomide2005@gmail.com"
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to renew session credentials");
      }

      setSuccessResult(data);
    } catch (err: any) {
      console.error("Error renewing admin login session:", err);
      setError(err.message || "Failed to renew login session");
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyPasskey = (passkey: string) => {
    navigator.clipboard.writeText(passkey);
    setCopiedPasskey(true);
    setTimeout(() => setCopiedPasskey(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[320] flex items-center justify-center p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden my-8"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white relative">
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-600/30">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-indigo-300">
                Admin Authentication Protocol
              </span>
            </div>
            <h3 className="text-2xl font-black tracking-tight text-white">
              Renew Admin Login Details
            </h3>
            <p className="text-slate-300 text-xs sm:text-sm mt-1">
              Dispatch dynamic credentials and passkey to: <strong className="text-amber-300 font-mono">fashinaayomide2005@gmail.com</strong>
            </p>
          </div>

          {/* Body */}
          <div className="p-6 sm:p-8 space-y-6">
            {error && (
              <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successResult ? (
              <div className="space-y-4">
                <div className="p-5 rounded-3xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-black text-sm">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <span>Credentials Successfully Renewed & Dispatched!</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    A secure authentication package has been transmitted to <strong className="font-mono text-slate-900 dark:text-white">{successResult.sentTo?.[0] || "fashinaayomide2005@gmail.com"}</strong>.
                  </p>
                </div>

                {/* Generated Session Details */}
                <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Live Session Credential Matrix
                  </span>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-500 font-bold">Admin Username:</span>
                      <span className="font-mono font-black text-slate-900 dark:text-white">{successResult.username}</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-500 font-bold">Temporary Passkey:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-indigo-600 dark:text-indigo-400">{successResult.temporaryPasskey}</span>
                        <button
                          onClick={() => handleCopyPasskey(successResult.temporaryPasskey)}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                        >
                          {copiedPasskey ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-500 font-bold">Session Security Token:</span>
                      <span className="font-mono font-bold text-[11px] text-slate-600 dark:text-slate-300">{successResult.sessionToken}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 flex items-start gap-3">
                  <Lock className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <p className="font-bold text-slate-900 dark:text-white">
                      Zero-Trust Authentication Session Renewal
                    </p>
                    <p className="text-slate-500 dark:text-slate-400">
                      Every time you log into the admin portal, clicking below generates fresh encrypted session credentials and dispatches the authorization passkey directly to the verified root admin mailbox.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-bold">Target Dispatch Email:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">fashinaayomide2005@gmail.com</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-bold">Initiating Account:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{currentUser?.email || "tommzypolaris@gmail.com"}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 sm:p-8 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isSending}
              className="px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              {successResult ? "Done" : "Cancel"}
            </button>
            {!successResult && (
              <button
                onClick={handleRenewCredentials}
                disabled={isSending}
                className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Renewing & Dispatching...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Renew & Send Credentials Now
                  </>
                )}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
