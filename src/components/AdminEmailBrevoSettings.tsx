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
  FileText, 
  HelpCircle, 
  Lock, 
  Eye, 
  EyeOff, 
  Check, 
  Copy,
  Receipt,
  MessageSquare,
  Flame
} from "lucide-react";
import { cn } from "../lib/utils";

export default function AdminEmailBrevoSettings() {
  const [apiKey, setApiKey] = useState("");
  const [senderEmail, setSenderEmail] = useState("shopiversitycommerce@gmail.com");
  const [senderName, setSenderName] = useState("SHOPIVERSITY Campus Marketplace");
  
  const [showApiKey, setShowApiKey] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);

  const [statusData, setStatusData] = useState<{
    configured: boolean;
    hasKey: boolean;
    maskedKey: string;
    senderEmail: string;
    senderName: string;
    provider: string;
    activeFallback: boolean;
  } | null>(null);

  const [testRecipient, setTestRecipient] = useState("fashinaayomide2005@gmail.com");
  const [testType, setTestType] = useState<"general" | "verification" | "receipt" | "password_reset" | "support" | "feedback">("general");
  
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  // Fetch current Brevo status on mount
  const fetchStatus = async () => {
    setLoadingStatus(true);
    try {
      const res = await fetch("/api/brevo/status");
      const data = await res.json();
      setStatusData(data);
      if (data.senderEmail) setSenderEmail(data.senderEmail);
      if (data.senderName) setSenderName(data.senderName);
    } catch (err: any) {
      console.error("Failed to fetch Brevo status:", err);
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    setNotification(null);

    try {
      const res = await fetch("/api/brevo/save-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: apiKey.trim(),
          senderEmail: senderEmail.trim(),
          senderName: senderName.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save configuration");

      setNotification({
        type: "success",
        message: "Brevo configuration saved successfully! API key is active."
      });
      setApiKey("");
      await fetchStatus();
    } catch (err: any) {
      setNotification({
        type: "error",
        message: err.message || "Failed to save Brevo configuration."
      });
    } finally {
      setSavingConfig(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testRecipient) {
      setNotification({ type: "error", message: "Please enter a test recipient email." });
      return;
    }

    setTestingEmail(true);
    setNotification(null);

    try {
      let endpoint = "/api/brevo/test-connection";
      let payload: any = {
        apiKey: apiKey.trim() || undefined,
        senderEmail: senderEmail.trim(),
        senderName: senderName.trim(),
        testRecipientEmail: testRecipient.trim()
      };

      if (testType === "verification") {
        endpoint = "/api/send-verification";
        payload = {
          email: testRecipient.trim(),
          code: Math.floor(100000 + Math.random() * 900000).toString(),
          userName: "Test User"
        };
      } else if (testType === "receipt") {
        endpoint = "/api/send-receipt";
        payload = {
          orderId: `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
          recipientEmail: testRecipient.trim(),
          recipientName: "Test Buyer",
          order: {
            uniqueOrderId: `ORD-${Date.now().toString().slice(-6)}`,
            productName: "Apple MacBook Pro M2 & Campus Essential Kit",
            quantity: 1,
            totalPrice: 450000,
            deliveryType: "Campus Courier Handover",
            campus: "Main Campus Hub",
            sellerName: "Campus Tech Store"
          }
        };
      } else if (testType === "password_reset") {
        endpoint = "/api/send-password-reset";
        payload = {
          email: testRecipient.trim(),
          code: Math.floor(100000 + Math.random() * 900000).toString(),
          userName: "Test Student"
        };
      } else if (testType === "support") {
        endpoint = "/api/send-support-ticket";
        payload = {
          userEmail: testRecipient.trim(),
          userName: "Test Student",
          category: "Order & Payment Escrow",
          subject: "Test Support Ticket via Brevo",
          message: "This is an automated test ticket dispatched from the SHOPIVERSITY admin control center."
        };
      } else if (testType === "feedback") {
        endpoint = "/api/send-feedback";
        payload = {
          userEmail: testRecipient.trim(),
          userName: "Test Student",
          feedbackType: "Platform Experience",
          rating: 5,
          message: "Everything is running smoothly! Loving the campus escrow system.",
          campus: "University Main Campus"
        };
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || "Failed to dispatch test email");

      setNotification({
        type: "success",
        message: data.message || `Test email successfully dispatched to ${testRecipient}!`
      });
      await fetchStatus();
    } catch (err: any) {
      setNotification({
        type: "error",
        message: err.message || "Failed to send test email. Check API key and sender email."
      });
    } finally {
      setTestingEmail(false);
    }
  };

  return (
    <div id="admin_email_brevo_settings" className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-950 text-white p-6 sm:p-8 rounded-3xl relative overflow-hidden shadow-xl border border-blue-800/40">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-black uppercase tracking-wider border border-blue-400/30">
              <Mail className="w-3.5 h-3.5" />
              Brevo (Sendinblue) Transactional Engine
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Email Dispatch & Brevo API Setup
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Configure your Brevo API key to power all campus transactional emails: 6-digit OTP verifications, official Escrow receipts, password reset links, student support tickets, and feedback surveys.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <a
              href="https://app.brevo.com/settings/keys/api"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all border border-white/20"
            >
              Get Brevo API Key
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={fetchStatus}
              disabled={loadingStatus}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs transition-all shadow-lg cursor-pointer"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", loadingStatus && "animate-spin")} />
              Refresh Status
            </button>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={cn(
            "p-4 rounded-2xl flex items-center gap-3 border text-sm font-medium animate-in fade-in slide-in-from-top-2",
            notification.type === "success" && "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
            notification.type === "error" && "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800",
            notification.type === "info" && "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800"
          )}
        >
          {notification.type === "success" && <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />}
          {notification.type === "error" && <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />}
          {notification.type === "info" && <HelpCircle className="w-5 h-5 shrink-0 text-blue-600" />}
          <div className="flex-1 text-xs sm:text-sm">{notification.message}</div>
          <button
            onClick={() => setNotification(null)}
            className="text-xs font-bold underline opacity-70 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Current Operational Status Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Brevo API Engine</span>
            {statusData?.hasKey ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-3 h-3" /> ACTIVE & READY
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                <AlertCircle className="w-3 h-3" /> KEY NEEDED
              </span>
            )}
          </div>
          <p className="text-lg font-black text-slate-900 dark:text-white">
            {statusData?.hasKey ? (statusData.maskedKey || "Configured in Environment") : "Not Configured"}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {statusData?.hasKey 
              ? "All transactional endpoints will deliver directly through Brevo."
              : "Paste your API key below or add BREVO_API_KEY to your .env file."}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Verified Sender</span>
            <Mail className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
            {statusData?.senderEmail || senderEmail}
          </p>
          <p className="text-xs text-slate-500 mt-1 truncate">
            From Name: {statusData?.senderName || senderName}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fallback Safeguards</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-sm font-bold text-slate-900 dark:text-white">
            {statusData?.activeFallback ? "Resend / SMTP Fallback Ready" : "Built-in Code Auto-Fill Enabled"}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Zero downtime: If an API quota is reached, verification codes are never blocked.
          </p>
        </div>
      </div>

      {/* Configuration & Test Dispatch Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: API Configuration Form */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 rounded-2xl bg-orange-100 dark:bg-orange-950/60 flex items-center justify-center text-orange-600">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Brevo API Credentials Input
              </h3>
              <p className="text-xs text-slate-500">
                Enter your Brevo v3 API key to activate live email delivery.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-4">
            {/* API Key Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Brevo API Key (Starts with <code className="text-orange-600">xkeysib-</code>)
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={statusData?.hasKey ? "Key is currently configured (enter new key to update)" : "xkeysib-..."}
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
                You can generate a key from your Brevo Dashboard under <strong>Settings &gt; SMTP &amp; API &gt; API Keys</strong>.
              </p>
            </div>

            {/* Sender Email Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Sender Email Address
              </label>
              <input
                type="email"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                placeholder="e.g. shopiversitycommerce@gmail.com"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                required
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Must be an authorized sender in your Brevo account (under <strong>Senders &amp; IP</strong>).
              </p>
            </div>

            {/* Sender Name Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Sender Display Name
              </label>
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="e.g. SHOPIVERSITY Campus Marketplace"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                required
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingConfig}
                className="w-full py-3.5 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-orange-600/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                {savingConfig ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving Configuration...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Save Brevo Configuration
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Setup Checklist */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-2">
            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-orange-600" />
              Quick Brevo Setup Steps:
            </h4>
            <ol className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 list-decimal list-inside pl-1">
              <li>Log in to <a href="https://app.brevo.com" target="_blank" rel="noopener noreferrer" className="text-orange-600 font-bold underline">brevo.com</a>.</li>
              <li>Go to <strong>Senders &amp; IP</strong> and verify your sender email.</li>
              <li>Go to <strong>SMTP &amp; API &gt; API Keys</strong> and click <strong>Generate a new API key</strong>.</li>
              <li>Copy the key, paste it into the field above, and click <strong>Save</strong>.</li>
            </ol>
          </div>
        </div>

        {/* Right Column: Live Email Dispatch Tester */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center text-blue-600">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Live Transactional Email Tester
              </h3>
              <p className="text-xs text-slate-500">
                Send an actual styled test email to your inbox to confirm formatting and deliverability.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Test Recipient Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Test Recipient Email
              </label>
              <input
                type="email"
                value={testRecipient}
                onChange={(e) => setTestRecipient(e.target.value)}
                placeholder="Enter email to receive test message"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            {/* Email Type Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Select Transactional Email Template to Test:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTestType("general")}
                  className={cn(
                    "p-3 rounded-xl text-left border transition-all text-xs font-bold flex items-center gap-2",
                    testType === "general"
                      ? "bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-700 dark:text-blue-300 shadow-sm"
                      : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                  )}
                >
                  <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>General Test</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTestType("verification")}
                  className={cn(
                    "p-3 rounded-xl text-left border transition-all text-xs font-bold flex items-center gap-2",
                    testType === "verification"
                      ? "bg-orange-50 dark:bg-orange-950/60 border-orange-500 text-orange-700 dark:text-orange-300 shadow-sm"
                      : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                  )}
                >
                  <ShieldCheck className="w-4 h-4 text-orange-600 shrink-0" />
                  <span>6-Digit Verification OTP</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTestType("receipt")}
                  className={cn(
                    "p-3 rounded-xl text-left border transition-all text-xs font-bold flex items-center gap-2",
                    testType === "receipt"
                      ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-sm"
                      : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                  )}
                >
                  <Receipt className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Escrow Transaction Receipt</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTestType("password_reset")}
                  className={cn(
                    "p-3 rounded-xl text-left border transition-all text-xs font-bold flex items-center gap-2",
                    testType === "password_reset"
                      ? "bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-700 dark:text-rose-300 shadow-sm"
                      : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                  )}
                >
                  <Lock className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Password Reset Code</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTestType("support")}
                  className={cn(
                    "p-3 rounded-xl text-left border transition-all text-xs font-bold flex items-center gap-2",
                    testType === "support"
                      ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-700 dark:text-indigo-300 shadow-sm"
                      : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                  )}
                >
                  <HelpCircle className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Support Ticket Confirmation</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTestType("feedback")}
                  className={cn(
                    "p-3 rounded-xl text-left border transition-all text-xs font-bold flex items-center gap-2",
                    testType === "feedback"
                      ? "bg-amber-50 dark:bg-amber-950/60 border-amber-500 text-amber-700 dark:text-amber-300 shadow-sm"
                      : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                  )}
                >
                  <MessageSquare className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Feedback Thank-You</span>
                </button>
              </div>
            </div>

            {/* Send Test Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSendTestEmail}
                disabled={testingEmail}
                className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-black text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                {testingEmail ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending Email via Brevo...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Live Test Email to {testRecipient}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
