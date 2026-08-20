import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShieldCheck, 
  KeyRound, 
  Lock, 
  Mail, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  X, 
  Send,
  Sparkles,
  ExternalLink
} from "lucide-react";

interface SecretAdminGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdminAuthenticated: () => void;
  initialPasskey?: string;
  initialEmail?: string;
}

export default function SecretAdminGatewayModal({
  isOpen,
  onClose,
  onAdminAuthenticated,
  initialPasskey = "",
  initialEmail = "fashinaayomide2005@gmail.com"
}: SecretAdminGatewayModalProps) {
  const [passkey, setPasskey] = React.useState(initialPasskey);
  const [email, setEmail] = React.useState(initialEmail);
  const [loading, setLoading] = React.useState(false);
  const [requestingNew, setRequestingNew] = React.useState(false);
  const [error, setError] = React.useState("");
  const [successMessage, setSuccessMessage] = React.useState("");
  const [dispatchedDetails, setDispatchedDetails] = React.useState<{ passkey?: string; token?: string } | null>(null);

  React.useEffect(() => {
    if (initialPasskey) {
      setPasskey(initialPasskey);
      handleVerify(initialPasskey);
    }
  }, [initialPasskey]);

  const handleVerify = async (keyToVerify?: string) => {
    const key = (keyToVerify || passkey).trim();
    if (!key) {
      setError("Please enter your dynamic admin passkey.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const res = await fetch("/api/admin/verify-passkey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passkey: key })
      });

      const data = await res.json();

      if (res.ok && data.valid) {
        setSuccessMessage("Super-Admin Passkey Verified! Loading Admin Operations...");
        setTimeout(() => {
          onAdminAuthenticated();
          onClose();
        }, 800);
      } else {
        setError(data.message || "Invalid or expired admin passkey. Request new credentials below.");
      }
    } catch (err: any) {
      setError("Network error while validating passkey. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDispatchNewCredentials = async () => {
    setRequestingNew(true);
    setError("");
    setSuccessMessage("");

    try {
      const res = await fetch("/api/admin/renew-login-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminEmail: "fashinaayomide2005@gmail.com",
          adminName: "Executive Administrator",
          targetNotificationEmail: "fashinaayomide2005@gmail.com",
          triggerReason: "Secret Gateway On-Demand Dispatch",
          origin: window.location.origin
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMessage(`Fresh credentials & secure link sent to fashinaayomide2005@gmail.com!`);
        setDispatchedDetails({
          passkey: data.sessionPasskey,
          token: data.sessionToken
        });
        if (data.sessionPasskey) {
          setPasskey(data.sessionPasskey);
        }
      } else {
        setError("Failed to dispatch credentials. Please check your connection.");
      }
    } catch (err: any) {
      setError("Error dispatching credentials: " + err.message);
    } finally {
      setRequestingNew(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-2xl bg-orange-500/20 text-[#ff6b00] border border-orange-500/30">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">Exclusive Executive Portal</span>
                <h3 className="text-xl font-black tracking-tight">Super-Admin Gateway</h3>
              </div>
            </div>
            <p className="text-xs text-slate-300">
              Restricted portal for <strong className="text-amber-300 font-mono">fashinaayomide2005@gmail.com</strong>.
            </p>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            {error && (
              <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 flex items-start gap-3 text-xs text-red-600 dark:text-red-400">
                <AlertTriangle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
                <div>
                  <p className="font-bold">Authentication Error</p>
                  <p className="mt-0.5 leading-relaxed">{error}</p>
                </div>
              </div>
            )}

            {successMessage && (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-3 text-xs text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500 mt-0.5" />
                <div>
                  <p className="font-bold">Authorized Dispatch</p>
                  <p className="mt-0.5 leading-relaxed">{successMessage}</p>
                </div>
              </div>
            )}

            {dispatchedDetails && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-bold">Dynamic Passkey:</span>
                  <span className="font-mono font-black text-orange-600 dark:text-orange-400 text-sm tracking-wider">{dispatchedDetails.passkey}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-bold">Session Security Token:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">{dispatchedDetails.token}</span>
                </div>
              </div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); handleVerify(); }} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Enter Dynamic Passkey</span>
                  <span className="text-[10px] text-slate-400 font-normal">Check your email inbox</span>
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={passkey}
                    onChange={(e) => setPasskey(e.target.value)}
                    placeholder="e.g. SPV-ADM-748291"
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-mono font-bold tracking-wider text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !passkey.trim()}
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-2xl font-black text-sm uppercase tracking-wider shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Verifying Passkey...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    <span>Unlock Admin Operations</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleDispatchNewCredentials}
                disabled={requestingNew}
                className="w-full py-3 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {requestingNew ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                    <span>Sending Fresh Credentials to Email...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-orange-500" />
                    <span>Email Me New Login Details & Link Now</span>
                  </>
                )}
              </button>
              <p className="text-[11px] text-center text-slate-400">
                Target: <strong className="text-slate-600 dark:text-slate-300 font-mono">fashinaayomide2005@gmail.com</strong>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
