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
  Lock, 
  Eye, 
  EyeOff, 
  Check, 
  Receipt, 
  MessageSquare, 
  Phone,
  Key,
  ShieldAlert,
  Layers,
  History
} from "lucide-react";
import { cn } from "../lib/utils";
import AdminEmailTemplateHub from "./AdminEmailTemplateHub";

export default function AdminEmailBrevoSettings() {
  const [apiKey, setApiKey] = useState("");
  const [senderEmail, setSenderEmail] = useState("shopiversitycommerce@gmail.com");
  const [senderName, setSenderName] = useState("SHOPIVERSITY Campus Marketplace");
  const [smsSender, setSmsSender] = useState("SHOPIV");
  const [smtpUser, setSmtpUser] = useState("");
  const [activeHubTab, setActiveHubTab] = useState<"setup" | "blueprint" | "logs">("setup");
  
  const [showApiKey, setShowApiKey] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [testingSms, setTestingSms] = useState(false);

  const [statusData, setStatusData] = useState<{
    configured: boolean;
    hasKey: boolean;
    keyType?: string;
    maskedKey: string;
    senderEmail: string;
    senderName: string;
    smsSender?: string;
    smtpUser?: string;
    needsSmtpUser?: boolean;
    isSmtpKeyOnly?: boolean;
    isConsumerGmailSender?: boolean;
    lastError?: string | null;
    lastErrorAt?: string | null;
    provider: string;
    activeFallback: boolean;
  } | null>(null);

  const [testRecipient, setTestRecipient] = useState("fashinaayomide2005@gmail.com");
  const [testPhoneNumber, setTestPhoneNumber] = useState("");
  const [testType, setTestType] = useState<"general" | "verification" | "password_reset" | "receipt" | "support" | "feedback">("verification");
  
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
      if (data.smsSender) setSmsSender(data.smsSender);
      if (data.smtpUser !== undefined) setSmtpUser(data.smtpUser || "");
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
          apiKey: apiKey.trim() || undefined,
          senderEmail: senderEmail.trim(),
          senderName: senderName.trim(),
          smsSender: smsSender.trim(),
          smtpUser: smtpUser.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save configuration");

      setNotification({
        type: "success",
        message: "Brevo configuration saved and persisted successfully! API key and SMS gateway are active."
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
      let endpoint = "/api/test-email";
      let payload: any = {
        apiKey: apiKey.trim() || undefined,
        senderEmail: senderEmail.trim(),
        senderName: senderName.trim(),
        smtpUser: smtpUser.trim() || undefined,
        recipient: testRecipient.trim(),
        testRecipientEmail: testRecipient.trim()
      };

      if (testType === "verification") {
        endpoint = "/api/send-verification";
        payload = {
          email: testRecipient.trim(),
          code: "482910",
          userName: "Student Tester"
        };
      } else if (testType === "password_reset") {
        endpoint = "/api/send-password-reset";
        payload = {
          email: testRecipient.trim(),
          code: "739201",
          userName: "Account Owner",
          resetLink: `${window.location.origin}/?tab=auth&mode=login`
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
        message: data.message || `Test email (${testType}) successfully dispatched to ${testRecipient} via Brevo!`
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

  const handleSendTestSms = async () => {
    if (!testPhoneNumber) {
      setNotification({ type: "error", message: "Please enter a test mobile phone number (e.g. +234... or 080...)." });
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
      if (!res.ok) throw new Error(data.error || "Failed to dispatch test SMS via Brevo");

      setNotification({
        type: "success",
        message: data.message || `Test SMS successfully dispatched to ${testPhoneNumber} via Brevo!`
      });
      await fetchStatus();
    } catch (err: any) {
      setNotification({
        type: "error",
        message: err.message || "Failed to dispatch test SMS. Please ensure your Brevo account has active SMS credits."
      });
    } finally {
      setTestingSms(false);
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
              Brevo (Sendinblue) Unified Engine
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Email Authentication &amp; Phone SMS Gateway
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Connect your Brevo account to handle student email verification (OTP), phone SMS verification, password resets, escrow receipts, and support tickets across the platform.
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

      {/* Sub-Tab Navigation */}
      <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <button
          type="button"
          onClick={() => setActiveHubTab("setup")}
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer",
            activeHubTab === "setup"
              ? "bg-orange-600 text-white shadow-md shadow-orange-600/20"
              : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          )}
        >
          <KeyRound className="w-4 h-4" />
          Brevo Credentials &amp; Quick Tests
        </button>

        <button
          type="button"
          onClick={() => setActiveHubTab("blueprint")}
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer",
            activeHubTab === "blueprint"
              ? "bg-orange-600 text-white shadow-md shadow-orange-600/20"
              : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          )}
        >
          <Layers className="w-4 h-4" />
          105-Template Blueprint &amp; Tester
        </button>

        <button
          type="button"
          onClick={() => setActiveHubTab("logs")}
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer",
            activeHubTab === "logs"
              ? "bg-orange-600 text-white shadow-md shadow-orange-600/20"
              : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          )}
        >
          <History className="w-4 h-4" />
          Outgoing Logs &amp; QA Checklist
        </button>
      </div>

      {activeHubTab === "blueprint" && (
        <AdminEmailTemplateHub mode="blueprint" defaultTestRecipient={testRecipient} />
      )}

      {activeHubTab === "logs" && (
        <AdminEmailTemplateHub mode="logs" defaultTestRecipient={testRecipient} />
      )}

      {activeHubTab === "setup" && (
        <>
          {/* Services Powered by Brevo Info Box */}
          <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 dark:from-zinc-900 dark:to-zinc-800/80 p-5 rounded-2xl border border-orange-200/80 dark:border-zinc-700 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-md">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              <span>All Communication Services Powered by Brevo</span>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-300 border border-orange-300 dark:border-orange-800">Unified Gateway</span>
            </h4>
            <p className="text-xs text-slate-600 dark:text-zinc-400 mt-0.5 leading-relaxed">
              When connected, Brevo directly dispatches: <strong>1)</strong> 6-Digit Email Signup OTP Codes, <strong>2)</strong> Phone SMS Verification OTPs, <strong>3)</strong> Password Reset Security Codes, <strong>4)</strong> Official Escrow Order Receipts, and <strong>5)</strong> Courier Delivery Updates.
            </p>
          </div>
        </div>
      </div>

      {/* Current Operational Status Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Brevo API Engine</span>
            {statusData?.hasKey ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-3 h-3" /> ACTIVE &amp; READY
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                <AlertCircle className="w-3 h-3" /> KEY NEEDED
              </span>
            )}
          </div>
          <p className="text-lg font-black text-slate-900 dark:text-white">
            {statusData?.hasKey ? (statusData.maskedKey || "Active in Config") : "Not Configured"}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {statusData?.hasKey 
              ? "All transactional email & SMS endpoints deliver directly through Brevo."
              : "Paste your Brevo API key below or enter it via the Connect Brevo dialog."}
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
            Sender: {statusData?.senderName || senderName}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">SMS Sender ID</span>
            <Phone className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-sm font-bold text-slate-900 dark:text-white font-mono">
            {statusData?.smsSender || smsSender || "SHOPIV"}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Display name for Brevo phone verification OTP text messages.
          </p>
        </div>
      </div>

      {/* Live Brevo Delivery Error Diagnostic Alert */}
      {statusData?.lastError && (
        <div className="p-4 sm:p-5 rounded-2xl bg-red-50 dark:bg-red-950/40 border-2 border-red-300 dark:border-red-800 flex items-start gap-3 text-left">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1.5 text-xs text-red-900 dark:text-red-200 leading-relaxed flex-1">
            <p className="font-extrabold">
              Recent Brevo Delivery Failure Detected
              {statusData.lastErrorAt ? ` (${new Date(statusData.lastErrorAt).toLocaleString()})` : ""}
            </p>
            <p className="font-semibold">{statusData.lastError}</p>
            {statusData.lastError.includes("525") && (
              <p>
                Cloud servers rotate IP addresses when restarted. Turn OFF <strong>Brevo &rarr; Profile &rarr; Security &rarr; Authorized IPs</strong> so new server IPs are not rejected, then send a Test Email below.
              </p>
            )}
          </div>
        </div>
      )}

      {/* SMTP Relay vs REST API Delivery Advisory */}
      {(statusData?.isSmtpKeyOnly || statusData?.keyType === "Brevo SMTP Key") && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 flex items-start gap-3 text-left">
          <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1.5 text-xs text-amber-950 dark:text-amber-200 leading-relaxed">
            <p className="font-extrabold">
              Using Brevo SMTP Relay Key (xsmtpsib-) — Why Codes Can Show &quot;Sent&quot; Without Arriving
            </p>
            <p>
              Brevo SMTP always replies <code className="font-mono font-bold">250 OK (queued)</code> first, then silently drops or blocks the email in <strong>Brevo &rarr; Transactional &rarr; Logs</strong> if <strong>{statusData?.senderEmail || senderEmail}</strong> is not verified under <strong>Brevo &rarr; Senders, Domains &amp; IPs &rarr; Senders</strong>, or if your Brevo Transactional SMTP account is still pending activation.
              {statusData?.isConsumerGmailSender && " Also, sending from an @gmail.com address via third-party SMTP fails Gmail DMARC checks and goes straight to Spam."}
            </p>
            <p className="font-semibold">
              Fix: Open <strong>Brevo &rarr; Transactional &rarr; Logs</strong> to inspect blocked/deferred entries, ensure <strong>{statusData?.senderEmail || senderEmail}</strong> is verified in Senders (or update Sender Email below to a verified custom domain email), and ideally connect a <strong>Brevo REST API v3 Key (<code className="font-mono">xkeysib-...</code>)</strong> from <strong>Brevo &rarr; SMTP &amp; API &rarr; API Keys</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Spam Prevention & Inbox Placement Guide */}
      <div className={cn(
        "p-4 sm:p-5 rounded-2xl border flex items-start gap-3 text-left",
        statusData?.isConsumerGmailSender
          ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"
          : "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800"
      )}>
        {statusData?.isConsumerGmailSender ? (
          <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
        ) : (
          <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        )}
        <div className={cn(
          "space-y-1.5 text-xs leading-relaxed",
          statusData?.isConsumerGmailSender
            ? "text-red-950 dark:text-red-200"
            : "text-emerald-950 dark:text-emerald-200"
        )}>
          <p className="font-extrabold">
            {statusData?.isConsumerGmailSender
              ? `Spam Alert: Current sender (${statusData?.senderEmail || senderEmail}) ends in @gmail.com`
              : "Custom Domain Sender Active — High Inbox Deliverability"}
          </p>
          {statusData?.isConsumerGmailSender ? (
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Why it goes to Spam:</strong> Gmail&apos;s strict DMARC policy sees an email claiming <code className="font-mono">@gmail.com</code> sent from Brevo servers instead of Google Mail, so Gmail places it in Spam.</li>
              <li><strong>Permanent Fix (Recommended):</strong> Buy/use a domain (e.g. <code className="font-mono">shopiversity.com</code>), open <strong>Brevo &rarr; Senders, Domains &amp; IPs &rarr; Domains &rarr; Add a domain</strong>, add Brevo&apos;s <strong>DKIM &amp; DMARC TXT records</strong> in your DNS, then set Sender Email below to <code className="font-mono">no-reply@yourdomain.com</code>.</li>
              <li><strong>Switch to REST API Key:</strong> Use a Brevo <strong>xkeysib-</strong> REST API v3 key instead of <code className="font-mono">xsmtpsib-</code> for stronger authentication and instant delivery diagnostics.</li>
              <li><strong>Short-term Test Fix:</strong> Open the message in Gmail Spam and tap <strong>Report not spam</strong> (plus add the sender to contacts) to train your personal inbox while migrating to a custom domain.</li>
            </ul>
          ) : (
            <p>
              Ensure your domain <strong>{String(statusData?.senderEmail || senderEmail).split("@")[1] || "domain"}</strong> shows <strong>Authenticated (DKIM + DMARC)</strong> inside <strong>Brevo &rarr; Senders, Domains &amp; IPs &rarr; Domains</strong> so OTP codes, order receipts, and logistics updates land in Primary Inbox.
            </p>
          )}
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
                Brevo Credentials &amp; Sender Setup
              </h3>
              <p className="text-xs text-slate-500">
                Enter your Brevo v3 API key to activate live email and SMS delivery.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-4">
            {/* API Key Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Brevo Key (<code className="text-orange-600">xkeysib-</code> or <code className="text-orange-600">xsmtpsib-</code>)</span>
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
                Recommended: Brevo REST API v3 key (<code className="text-orange-600 font-mono">xkeysib-</code>). If using an SMTP password (<code className="text-orange-600 font-mono">xsmtpsib-</code>), also enter your Brevo SMTP Login below.
              </p>
            </div>

            {(apiKey.trim().startsWith("xsmtpsib-") || statusData?.keyType === "Brevo SMTP Key" || statusData?.needsSmtpUser) && (
              <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-2">
                <label className="block text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                  Brevo SMTP Login (Required for <code className="font-mono">xsmtpsib-</code> keys)
                </label>
                <input
                  type="text"
                  value={smtpUser}
                  onChange={(e) => setSmtpUser(e.target.value)}
                  placeholder="e.g. 8c4a12001@smtp-brevo.com"
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                />
                <p className="text-[11px] text-amber-800 dark:text-amber-300">
                  Copy your exact <strong>Login</strong> (usually <code className="font-mono">xxxxx@smtp-brevo.com</code>) from Brevo &gt; <strong>SMTP &amp; API &gt; SMTP</strong>, or switch to an <code className="font-mono">xkeysib-</code> API Key instead.
                </p>
              </div>
            )}

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

            {/* Sender Name & SMS Sender ID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Sender Display Name
                </label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="SHOPIVERSITY Campus Marketplace"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  SMS Sender ID (Max 11)
                </label>
                <input
                  type="text"
                  maxLength={11}
                  value={smsSender}
                  onChange={(e) => setSmsSender(e.target.value)}
                  placeholder="SHOPIV"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-sm font-mono uppercase text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                />
              </div>
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
              <li>For Phone Verification SMS: check <strong>Transactional &gt; SMS</strong> in Brevo.</li>
              <li>Copy the key, paste it into the field above, and click <strong>Save</strong>.</li>
            </ol>
          </div>
        </div>

        {/* Right Column: Live Email & SMS Dispatch Tester */}
        <div className="lg:col-span-6 space-y-6">
          {/* Email Tester */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center text-blue-600">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Live Transactional Email Tester
                </h3>
                <p className="text-xs text-slate-500">
                  Send actual styled verification and transaction emails via Brevo.
                </p>
              </div>
            </div>

            <div className="space-y-4">
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

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Select Email Template to Test:
                </label>
                <div className="grid grid-cols-2 gap-2">
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
                    <Mail className="w-4 h-4 text-orange-600 shrink-0" />
                    <span>Signup Verification (OTP)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTestType("password_reset")}
                    className={cn(
                      "p-3 rounded-xl text-left border transition-all text-xs font-bold flex items-center gap-2",
                      testType === "password_reset"
                        ? "bg-red-50 dark:bg-red-950/60 border-red-500 text-red-700 dark:text-red-300 shadow-sm"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    )}
                  >
                    <Key className="w-4 h-4 text-red-600 shrink-0" />
                    <span>Password Reset (OTP)</span>
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
                    <span>Escrow Order Receipt</span>
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
                    <span>Support Ticket</span>
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSendTestEmail}
                disabled={testingEmail}
                className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-black text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                {testingEmail ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending Email via Brevo...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Live Test Email
                  </>
                )}
              </button>
            </div>
          </div>

          {/* SMS Tester */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Live Phone SMS Gateway Tester
                </h3>
                <p className="text-xs text-slate-500">
                  Send real OTP verification SMS using Brevo Transactional SMS API.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Test Recipient Phone Number (International E.164 or Local)
                </label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={testPhoneNumber}
                    onChange={(e) => setTestPhoneNumber(e.target.value)}
                    placeholder="e.g. +2348012345678 or 08012345678"
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleSendTestSms}
                    disabled={testingSms}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {testingSms ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                    Send Test SMS
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-slate-500">
                Transactional SMS requires Brevo credits and a Brevo REST API v3 key (<code className="font-mono">xkeysib-</code>).
              </p>
            </div>
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
}
