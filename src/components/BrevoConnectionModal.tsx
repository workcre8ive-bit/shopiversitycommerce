import React, { useState, useEffect } from "react";
import { 
  Mail, 
  KeyRound, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  RefreshCw, 
  ExternalLink, 
  ShieldCheck, 
  Sparkles, 
  HelpCircle, 
  Eye, 
  EyeOff, 
  Check, 
  X,
  Phone,
  MessageSquare,
  Lock
} from "lucide-react";
import { cn } from "../lib/utils";

interface BrevoConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved?: () => void;
}

export default function BrevoConnectionModal({
  isOpen,
  onClose,
  onConfigSaved
}: BrevoConnectionModalProps) {
  const [apiKey, setApiKey] = useState("");
  const [senderEmail, setSenderEmail] = useState("shopiversitycommerce@gmail.com");
  const [senderName, setSenderName] = useState("SHOPIVERSITY Campus Marketplace");
  const [smsSender, setSmsSender] = useState("SHOPIV");
  
  const [showApiKey, setShowApiKey] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [testingSms, setTestingSms] = useState(false);

  const [testRecipientEmail, setTestRecipientEmail] = useState("fashinaayomide2005@gmail.com");
  const [testPhoneNumber, setTestPhoneNumber] = useState("");

  const [statusData, setStatusData] = useState<{
    configured: boolean;
    hasKey: boolean;
    keyType?: string;
    maskedKey: string;
    senderEmail: string;
    senderName: string;
    smsSender?: string;
    provider: string;
  } | null>(null);

  const [notification, setNotification] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const fetchStatus = async () => {
    setLoadingStatus(true);
    try {
      const res = await fetch("/api/brevo/status");
      const data = await res.json();
      setStatusData(data);
      if (data.senderEmail) setSenderEmail(data.senderEmail);
      if (data.senderName) setSenderName(data.senderName);
      if (data.smsSender) setSmsSender(data.smsSender);
    } catch (err: any) {
      console.error("Failed to fetch Brevo status:", err);
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      setNotification(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    setNotification(null);

    try {
      const res = await fetch("/api/brevo/save-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: apiKey.trim() || undefined,
          senderEmail: senderEmail.trim(),
          senderName: senderName.trim(),
          smsSender: smsSender.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save Brevo configuration");

      setNotification({
        type: "success",
        message: "Brevo configuration successfully saved & connected! Live email & SMS verification active."
      });
      setApiKey("");
      await fetchStatus();
      if (onConfigSaved) onConfigSaved();
    } catch (err: any) {
      setNotification({
        type: "error",
        message: err.message || "Failed to save configuration."
      });
    } finally {
      setSavingConfig(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testRecipientEmail) {
      setNotification({ type: "error", message: "Please enter an email address to test." });
      return;
    }
    setTestingEmail(true);
    setNotification(null);

    try {
      const res = await fetch("/api/brevo/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: apiKey.trim() || undefined,
          senderEmail: senderEmail.trim(),
          senderName: senderName.trim(),
          testRecipientEmail: testRecipientEmail.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to dispatch test email");

      setNotification({
        type: "success",
        message: `Test email successfully dispatched to ${testRecipientEmail} via Brevo!`
      });
      await fetchStatus();
    } catch (err: any) {
      setNotification({
        type: "error",
        message: err.message || "Failed to send test email. Check API key and verified sender domain."
      });
    } finally {
      setTestingEmail(false);
    }
  };

  const handleTestSms = async () => {
    if (!testPhoneNumber) {
      setNotification({ type: "error", message: "Please enter a phone number (e.g. +234...) to test SMS." });
      return;
    }
    setTestingSms(true);
    setNotification(null);

    try {
      const res = await fetch("/api/brevo/test-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: testPhoneNumber.trim(),
          customApiKey: apiKey.trim() || undefined,
          smsSender: smsSender.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to dispatch test SMS");

      setNotification({
        type: "success",
        message: data.message || `Test SMS dispatched successfully to ${testPhoneNumber} via Brevo!`
      });
      await fetchStatus();
    } catch (err: any) {
      setNotification({
        type: "error",
        message: err.message || "Failed to send test SMS. Check API key and Brevo SMS account credits."
      });
    } finally {
      setTestingSms(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-950 text-white p-6 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute right-5 top-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2.5 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[11px] font-black uppercase tracking-wider border border-blue-400/30 flex items-center gap-1.5">
              <Mail className="w-3 h-3" />
              Brevo Communication Engine
            </span>
            {statusData?.hasKey ? (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-black uppercase tracking-wider border border-emerald-400/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Connected
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-black uppercase tracking-wider border border-amber-400/30 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> API Key Needed
              </span>
            )}
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-white">
            Connect Your Brevo Account
          </h3>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl leading-relaxed">
            Powers Email OTP Verification during signup, Phone SMS OTPs, Password Resets, Escrow purchase receipts, and Support Tickets.
          </p>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-left">
          {/* Notification Toast */}
          {notification && (
            <div
              className={cn(
                "p-3.5 rounded-2xl flex items-center gap-3 border text-xs sm:text-sm font-semibold animate-in fade-in",
                notification.type === "success" && "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
                notification.type === "error" && "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800",
                notification.type === "info" && "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800"
              )}
            >
              {notification.type === "success" && <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />}
              {notification.type === "error" && <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />}
              {notification.type === "info" && <HelpCircle className="w-5 h-5 shrink-0 text-blue-600" />}
              <div className="flex-1">{notification.message}</div>
              <button
                onClick={() => setNotification(null)}
                className="text-xs font-bold underline opacity-70 hover:opacity-100"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Quick Guide Card */}
          <div className="bg-orange-50/70 dark:bg-orange-950/30 p-4 rounded-2xl border border-orange-200/80 dark:border-orange-800/40 space-y-2">
            <h4 className="text-xs font-black text-orange-900 dark:text-orange-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-orange-600" />
              How to Connect Brevo in 3 Steps:
            </h4>
            <ol className="text-xs text-slate-700 dark:text-slate-300 space-y-1.5 list-decimal list-inside pl-1 leading-relaxed">
              <li>
                Sign in to <a href="https://app.brevo.com" target="_blank" rel="noopener noreferrer" className="text-orange-600 font-bold underline inline-flex items-center gap-0.5">brevo.com <ExternalLink className="w-3 h-3 inline" /></a>.
              </li>
              <li>
                Go to <strong>SMTP &amp; API &gt; API Keys</strong> (<a href="https://app.brevo.com/settings/keys/api" target="_blank" rel="noopener noreferrer" className="text-orange-600 font-bold underline inline-flex items-center gap-0.5">direct link <ExternalLink className="w-3 h-3 inline" /></a>), click <strong>Generate a new API key</strong>, and copy it.
              </li>
              <li>
                Paste your key below and ensure your <strong>Sender Email</strong> is verified under <strong>Senders &amp; IP</strong> in Brevo.
              </li>
            </ol>
          </div>

          {/* Configuration Form */}
          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Brevo Key (<code className="text-orange-600 font-mono">xkeysib-</code> or <code className="text-orange-600 font-mono">xsmtpsib-</code>)</span>
                {statusData?.keyType && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    {statusData.keyType} Active
                  </span>
                )}
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={statusData?.hasKey ? `Currently active: ${statusData.maskedKey} (${statusData.keyType || "Connected"})` : "xkeysib-... or xsmtpsib-..."}
                  className="w-full pl-4 pr-12 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Accepts both Brevo REST API keys (<code className="font-mono text-orange-600">xkeysib-</code>) and SMTP passwords (<code className="font-mono text-orange-600">xsmtpsib-</code>).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Verified Sender Email
                </label>
                <input
                  type="email"
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  placeholder="shopiversitycommerce@gmail.com"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Sender Display Name
                </label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="SHOPIVERSITY Campus Marketplace"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Phone SMS Sender ID (Max 11 chars)</span>
                <span className="text-[10px] text-slate-400 lowercase font-normal">for brevo phone otp sms</span>
              </label>
              <input
                type="text"
                maxLength={11}
                value={smsSender}
                onChange={(e) => setSmsSender(e.target.value)}
                placeholder="SHOPIV"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white uppercase font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Alphanumeric ID displayed as the SMS sender on student mobile phones (e.g. <code>SHOPIV</code>).
              </p>
            </div>

            <button
              type="submit"
              disabled={savingConfig}
              className="w-full py-3.5 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-orange-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {savingConfig ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving &amp; Connecting Brevo...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Save &amp; Connect Brevo Configuration
                </>
              )}
            </button>
          </form>

          {/* Test Dispatch Testing Section */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Send className="w-3.5 h-3.5 text-blue-600" />
              Test Live Connection (Email &amp; Phone SMS)
            </h4>

            {/* Email Test */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                1. Test Email Delivery (Verification / Welcome template):
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={testRecipientEmail}
                  onChange={(e) => setTestRecipientEmail(e.target.value)}
                  placeholder="Enter your email to receive test"
                  className="flex-1 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleTestEmail}
                  disabled={testingEmail}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
                >
                  {testingEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Send Test Email
                </button>
              </div>
            </div>

            {/* Phone SMS Test */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                2. Test Phone SMS Verification (Brevo Transactional SMS):
              </label>
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={testPhoneNumber}
                  onChange={(e) => setTestPhoneNumber(e.target.value)}
                  placeholder="e.g. +2348012345678 or 08012345678"
                  className="flex-1 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
                <button
                  type="button"
                  onClick={handleTestSms}
                  disabled={testingSms}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
                >
                  {testingSms ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageSquare className="w-3.5 h-3.5" />}
                  Send Test SMS
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                Requires transactional SMS credits on your Brevo account. If credits are pending, the signup flow automatically provides instant fallback OTP code entry for uninterrupted testing.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500 font-medium">
            SHOPIVERSITY &times; Brevo API v3
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
