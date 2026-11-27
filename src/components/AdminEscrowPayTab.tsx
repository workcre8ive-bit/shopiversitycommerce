import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  ArrowUpRight,
  Copy,
  Check,
  Search,
  Eye,
  X,
  CreditCard,
  Loader2,
  FlaskConical,
  KeyRound,
  Lock
} from "lucide-react";
import { auth, db } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";
import { Order } from "../types";
import { cn } from "../lib/utils";

interface EscrowConfigStatus {
  configured: boolean;
  activeMode: "test" | "live" | "unconfigured";
  isTestMode: boolean;
  isLiveMode: boolean;
  officialBaseUrl: string;
  hasTestSecretKey: boolean;
  hasLiveSecretKey: boolean;
  hasTestPublicKey: boolean;
  hasWebhookSecret: boolean;
  hasWebhookPreviousSecret: boolean;
  missingCredentials: string[];
  webhookEndpointPath: string;
  liveCredentialContext?: any;
  scopeCheck?: any;
  contextError?: string | null;
}

interface AdminEscrowPayTabProps {
  orders: Order[];
  onActionSuccess: (message: string) => void;
}

export default function AdminEscrowPayTab({ orders, onActionSuccess }: AdminEscrowPayTabProps) {
  const [config, setConfig] = useState<EscrowConfigStatus | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);

  const [fixtures, setFixtures] = useState<any[] | null>(null);
  const [loadingFixtures, setLoadingFixtures] = useState(false);
  const [fixturesError, setFixturesError] = useState<string | null>(null);

  const [txFilter, setTxFilter] = useState<"all" | "test" | "live" | "processing">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [manualTxId, setManualTxId] = useState("");
  const [manualOrderId, setManualOrderId] = useState("");

  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<{
    type: "success" | "error" | "info";
    title: string;
    detail: string;
  } | null>(null);

  const [inspectedTx, setInspectedTx] = useState<any | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const getBearerHeaders = useCallback(async () => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    };
    if (auth.currentUser) {
      const token = await auth.currentUser.getIdToken();
      if (token) headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  }, []);

  const fetchConfigStatus = useCallback(async () => {
    setLoadingConfig(true);
    setConfigError(null);
    try {
      const headers = await getBearerHeaders();
      const res = await fetch("/api/payments/escrow/config-status?checkContext=1", {
        headers
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to load EscrowPay status");
      setConfig(data);
    } catch (err: any) {
      setConfigError(err?.message || "Failed to query EscrowPay status");
    } finally {
      setLoadingConfig(false);
    }
  }, [getBearerHeaders]);

  useEffect(() => {
    void fetchConfigStatus();
  }, [fetchConfigStatus]);

  const handleCopy = (label: string, text: string) => {
    if (!text) return;
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const handleFetchSandboxFixtures = async () => {
    setLoadingFixtures(true);
    setFixturesError(null);
    try {
      const headers = await getBearerHeaders();
      const res = await fetch("/api/payments/escrow/sandbox/fixtures", { headers });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Unable to load sandbox identity fixtures");
      }
      const list = Array.isArray(data.fixtures?.fixtures)
        ? data.fixtures.fixtures
        : Array.isArray(data.fixtures?.items)
        ? data.fixtures.items
        : Array.isArray(data.fixtures)
        ? data.fixtures
        : [];
      setFixtures(list);
    } catch (err: any) {
      setFixturesError(err?.message || "Failed to load sandbox identity fixtures");
    } finally {
      setLoadingFixtures(false);
    }
  };

  const syncOrderFallback = async (orderId: string | undefined, syncPayload: Record<string, any> | null | undefined, orderUpdatedByServer: boolean | undefined) => {
    if (!orderId || !syncPayload || orderUpdatedByServer) return;
    try {
      await updateDoc(doc(db, "orders", orderId), syncPayload);
    } catch {
      // Server response still drives UI notification
    }
  };

  const handleVerifyTransaction = async (params: {
    transactionId?: string;
    reference?: string;
    orderId?: string;
  }) => {
    const key = `verify:${params.transactionId || params.reference || params.orderId}`;
    setBusyKey(key);
    setActionResult(null);
    try {
      const headers = await getBearerHeaders();
      const res = await fetch("/api/payments/escrow/verify", {
        method: "POST",
        headers,
        body: JSON.stringify(params)
      });
      const data = await res.json();
      await syncOrderFallback(
        data?.orderConnection?.orderId || params.orderId,
        data?.orderConnection?.syncPayload,
        data?.orderConnection?.orderUpdatedByServer
      );
      setActionResult({
        type: data.status === "secured" ? "success" : data.status === "failed" ? "error" : "info",
        title: `${data.statusLabel || "Status Checked"}${data.transaction?.isTestTransaction ? " (Test Transaction)" : ""}`,
        detail: data.statusMessage || `Provider status: ${data.transaction?.providerStatus || data.status}`
      });
      if (data.status === "secured") {
        onActionSuccess("EscrowPay transaction verified.");
      }
    } catch (err: any) {
      setActionResult({
        type: "error",
        title: "Verification Failed",
        detail: err?.message || "Unable to verify EscrowPay transaction"
      });
    } finally {
      setBusyKey(null);
    }
  };

  const handleSimulateFunding = async (transactionId: string, orderId?: string) => {
    const key = `fund:${transactionId}`;
    setBusyKey(key);
    setActionResult(null);
    try {
      const headers = await getBearerHeaders();
      const res = await fetch("/api/payments/escrow/sandbox/simulate-funding", {
        method: "POST",
        headers,
        body: JSON.stringify({ transactionId, orderId })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Sandbox funding failed");
      }
      await syncOrderFallback(orderId, data.syncPayload, data.orderUpdatedByServer);
      setActionResult({
        type: "success",
        title: "Sandbox Charge Initiated (Test Mode)",
        detail: `Provider returned status "${data.providerStatus}". Canonical Shopiversity status: ${data.status}.`
      });
      onActionSuccess(`Sandbox funding executed for ${transactionId}`);
    } catch (err: any) {
      setActionResult({
        type: "error",
        title: "Sandbox Funding Failed",
        detail: err?.message || "Unable to execute sandbox charge"
      });
    } finally {
      setBusyKey(null);
    }
  };

  const handleEscrowLifecycleAction = async (
    action: "release" | "refund",
    transactionId: string,
    orderId?: string
  ) => {
    const key = `${action}:${transactionId}`;
    setBusyKey(key);
    setActionResult(null);
    try {
      const headers = await getBearerHeaders();
      const endpoint = action === "release" ? "/api/payments/escrow/release" : "/api/payments/escrow/refund";
      const res = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({ transactionId, orderId })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || `EscrowPay ${action} failed`);
      }
      await syncOrderFallback(orderId, data.syncPayload, data.orderUpdatedByServer);
      setActionResult({
        type: "success",
        title: `${action === "release" ? "Funds Released" : "Refund Processed"}${data.isTestTransaction ? " (Test Mode)" : ""}`,
        detail: `EscrowPay status is now "${data.providerStatus}".`
      });
      onActionSuccess(`EscrowPay ${action} succeeded for ${transactionId}`);
    } catch (err: any) {
      setActionResult({
        type: "error",
        title: `EscrowPay ${action === "release" ? "Release" : "Refund"} Failed`,
        detail: err?.message || `Unable to process ${action}`
      });
    } finally {
      setBusyKey(null);
    }
  };

  const handleInspectTransaction = async (transactionId: string) => {
    const key = `inspect:${transactionId}`;
    setBusyKey(key);
    try {
      const headers = await getBearerHeaders();
      const res = await fetch(`/api/payments/escrow/transactions/${encodeURIComponent(transactionId)}`, {
        headers
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Unable to inspect transaction");
      }
      setInspectedTx(data);
    } catch (err: any) {
      setActionResult({
        type: "error",
        title: "Inspection Failed",
        detail: err?.message || "Unable to fetch EscrowPay transaction details"
      });
    } finally {
      setBusyKey(null);
    }
  };

  const escrowOrders = useMemo(() => {
    return orders
      .filter((o) => {
        const isEscrow =
          o.paymentReceipt?.provider === "escrowpay" ||
          Boolean(o.paymentReference?.startsWith("ESC_")) ||
          (o.paymentMethod === "online" && !o.isOneDollar);
        if (!isEscrow) return false;

        const isTest =
          Boolean(o.paymentReceipt?.isTestTransaction) ||
          o.paymentReceipt?.environment === "test" ||
          Boolean(o.paymentReference?.startsWith("ESC_TEST_"));

        if (txFilter === "test" && !isTest) return false;
        if (txFilter === "live" && isTest) return false;
        if (
          txFilter === "processing" &&
          o.paymentStatus === "paid" &&
          o.escrowStatus !== "not_applicable"
        ) {
          return false;
        }

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const hay = [
            o.id,
            o.uniqueOrderId,
            o.productName,
            o.buyerName,
            o.sellerName,
            o.paymentReference,
            o.paymentReceipt?.transactionId
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return hay.includes(q);
        }

        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, txFilter, searchQuery]);

  const webhookUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${config?.webhookEndpointPath || "/api/payments/escrow/webhook"}`
      : "/api/payments/escrow/webhook";

  const modeBanner = useMemo(() => {
    if (!config || config.activeMode === "unconfigured") {
      return {
        wrap: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/60 text-red-950 dark:text-red-100",
        label: "ESCROWPAY UNCONFIGURED",
        summary:
          "No active EscrowPay secret key detected on the server. Marketplace checkouts remain safely in Payment Processing until ESCROWPAY_TEST_SECRET_KEY (ep_test_sk_...) is added.",
        icon: AlertTriangle,
        iconColor: "text-red-600 dark:text-red-400"
      };
    }
    if (config.isTestMode) {
      return {
        wrap: "bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/70 text-amber-950 dark:text-amber-100",
        label: "TEST MODE (SANDBOX ACTIVE)",
        summary:
          "All EscrowPay transactions created right now use EscrowPay Sandbox test credentials. Test transactions are strictly labeled TEST TRANSACTION and cannot be used for live verification or settlement.",
        icon: FlaskConical,
        iconColor: "text-amber-600 dark:text-amber-400"
      };
    }
    return {
      wrap: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/70 text-emerald-950 dark:text-emerald-100",
      label: "LIVE MODE ACTIVE",
      summary:
        "Production EscrowPay live credentials (ep_live_...) are active. Sandbox simulated funding is locked and disabled.",
      icon: ShieldCheck,
      iconColor: "text-emerald-600 dark:text-emerald-400"
    };
  }, [config]);

  const ModeIcon = modeBanner.icon;

  return (
    <div className="space-y-6">
      {/* Mode Status Banner */}
      <div className={cn("rounded-3xl border p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4", modeBanner.wrap)}>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/80 dark:bg-slate-900/70 border border-black/5 dark:border-white/10 flex items-center justify-center shrink-0">
            <ModeIcon className={cn("w-6 h-6", modeBanner.iconColor)} />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-base sm:text-lg font-extrabold tracking-tight">
                {modeBanner.label}
              </h2>
              {config?.officialBaseUrl && (
                <span className="text-xs font-mono text-slate-600 dark:text-slate-300">
                  · {config.officialBaseUrl}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm opacity-90 leading-relaxed max-w-3xl">
              {modeBanner.summary}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchConfigStatus}
          disabled={loadingConfig}
          className="h-10 px-4 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", loadingConfig && "animate-spin")} />
          Refresh Credentials
        </button>
      </div>

      {configError && (
        <div className="p-4 rounded-2xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 text-xs font-semibold text-red-700 dark:text-red-300">
          {configError}
        </div>
      )}

      {actionResult && (
        <div
          className={cn(
            "p-4 rounded-2xl border text-xs flex items-start justify-between gap-3",
            actionResult.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
              : actionResult.type === "error"
              ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-900 dark:text-red-200"
              : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200"
          )}
        >
          <div className="space-y-0.5">
            <p className="font-bold">{actionResult.title}</p>
            <p className="opacity-90 leading-relaxed">{actionResult.detail}</p>
          </div>
          <button
            type="button"
            onClick={() => setActionResult(null)}
            className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
            aria-label="Dismiss notice"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Credentials & Webhook Readiness */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <KeyRound className="w-4 h-4 text-[#ff6b00]" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Server Environment Credentials
              </h3>
            </div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Secrets never leave backend
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {[
              {
                name: "ESCROWPAY_TEST_SECRET_KEY",
                note: "Sandbox API Key (ep_test_sk_...)",
                ok: Boolean(config?.hasTestSecretKey),
                required: "Required for Sandbox"
              },
              {
                name: "ESCROWPAY_WEBHOOK_SECRET",
                note: "Webhook HMAC verification (whsec_...)",
                ok: Boolean(config?.hasWebhookSecret),
                required: "Required for Webhooks"
              },
              {
                name: "ESCROWPAY_TEST_PUBLIC_KEY",
                note: "Optional client reference key",
                ok: Boolean(config?.hasTestPublicKey),
                required: "Optional"
              },
              {
                name: "ESCROWPAY_LIVE_SECRET_KEY",
                note: "Live production key (ep_live_sk_...)",
                ok: Boolean(config?.hasLiveSecretKey),
                required: "Locked until verified"
              }
            ].map((item) => (
              <div key={item.name} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {item.name}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {item.note} · {item.required}
                  </p>
                </div>
                {item.ok ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                    Configured
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold shrink-0">
                    <XCircle className="w-4 h-4" />
                    Missing
                  </span>
                )}
              </div>
            ))}
          </div>

          {config?.contextError && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300">
              Credential Context Notice: {config.contextError}
            </div>
          )}

          {config?.liveCredentialContext && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
              <p className="font-bold text-slate-800 dark:text-slate-200">
                Verified API Key Context
              </p>
              <p className="text-[11px] font-mono text-slate-600 dark:text-slate-300 break-all">
                {JSON.stringify(config.liveCredentialContext)}
              </p>
            </div>
          )}
        </div>

        {/* Webhook & Sandbox Identity Fixtures */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#ff6b00]" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                EscrowPay Webhook Configuration
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Register this endpoint in your EscrowPay Business Dashboard to receive signed{" "}
              <span className="font-mono">EscrowPay-Signature</span> events (<span className="font-mono">t=...,v1=...</span>).
            </p>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
              <span className="font-mono text-xs text-slate-800 dark:text-slate-200 truncate flex-1">
                {webhookUrl}
              </span>
              <button
                type="button"
                onClick={() => handleCopy("webhook", webhookUrl)}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 hover:text-[#ff6b00] cursor-pointer shrink-0"
              >
                {copiedKey === "webhook" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                Copy URL
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Sandbox Identity Fixtures
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Official test NIN/BVN records used automatically in Sandbox onboarding.
                </p>
              </div>
              <button
                type="button"
                onClick={handleFetchSandboxFixtures}
                disabled={loadingFixtures || !config?.isTestMode}
                className="h-10 px-4 rounded-xl bg-[#ff6b00] hover:bg-[#e55f00] disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                {loadingFixtures ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FlaskConical className="w-3.5 h-3.5" />}
                Load Fixtures
              </button>
            </div>

            {fixturesError && (
              <p className="text-xs text-red-600 dark:text-red-400 font-medium">{fixturesError}</p>
            )}

            {fixtures && fixtures.length > 0 && (
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold">
                    <tr>
                      <th className="py-2 px-3">Type</th>
                      <th className="py-2 px-3">Identifier</th>
                      <th className="py-2 px-3">DOB</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                    {fixtures.slice(0, 5).map((f: any, idx: number) => (
                      <tr key={`fixture-${idx}`}>
                        <td className="py-2 px-3 uppercase">{f.type || (f.bvn ? "bvn" : "nin")}</td>
                        <td className="py-2 px-3 tabular-nums">{f.identifier || f.value || f.nin || f.bvn}</td>
                        <td className="py-2 px-3 tabular-nums">{f.date_of_birth || f.dob || "1990-01-15"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Direct Transaction Testing Console */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Direct Sandbox Transaction Actions
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Run status verification, simulated funding (Test Mode only), release, or refund by EscrowPay Transaction ID.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="text"
            value={manualTxId}
            onChange={(e) => setManualTxId(e.target.value)}
            placeholder="EscrowPay Transaction ID (e.g. TXN_01J...)"
            className="h-11 px-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white outline-none focus:border-[#ff6b00]"
          />
          <input
            type="text"
            value={manualOrderId}
            onChange={(e) => setManualOrderId(e.target.value)}
            placeholder="Optional Shopiversity Order ID to sync"
            className="h-11 px-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white outline-none focus:border-[#ff6b00]"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!manualTxId.trim() || Boolean(busyKey)}
            onClick={() =>
              handleVerifyTransaction({
                transactionId: manualTxId.trim(),
                orderId: manualOrderId.trim() || undefined
              })
            }
            className="h-10 px-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Check Status
          </button>

          {config?.isTestMode && (
            <button
              type="button"
              disabled={!manualTxId.trim() || Boolean(busyKey)}
              onClick={() =>
                handleSimulateFunding(manualTxId.trim(), manualOrderId.trim() || undefined)
              }
              className="h-10 px-4 rounded-xl bg-[#ff6b00] hover:bg-[#e55f00] text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              Simulate Sandbox Funding
            </button>
          )}

          <button
            type="button"
            disabled={!manualTxId.trim() || Boolean(busyKey)}
            onClick={() =>
              handleEscrowLifecycleAction(
                "release",
                manualTxId.trim(),
                manualOrderId.trim() || undefined
              )
            }
            className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            Test Release
          </button>

          <button
            type="button"
            disabled={!manualTxId.trim() || Boolean(busyKey)}
            onClick={() =>
              handleEscrowLifecycleAction(
                "refund",
                manualTxId.trim(),
                manualOrderId.trim() || undefined
              )
            }
            className="h-10 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Test Refund
          </button>

          <button
            type="button"
            disabled={!manualTxId.trim() || Boolean(busyKey)}
            onClick={() => handleInspectTransaction(manualTxId.trim())}
            className="h-10 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            Inspect API Payload
          </button>
        </div>
      </div>

      {/* EscrowPay Orders Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#ff6b00]" />
              EscrowPay Transactions ({escrowOrders.length})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Test transactions are clearly marked TEST TRANSACTION and separated from Live orders.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              {(
                [
                  { id: "all", label: "All" },
                  { id: "test", label: "Test Transactions" },
                  { id: "live", label: "Live Transactions" },
                  { id: "processing", label: "Processing" }
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTxFilter(tab.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer",
                    txFilter === tab.id
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search order, ref, buyer..."
                className="h-9 pl-8 pr-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:border-[#ff6b00]"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                <th className="py-3.5 px-5">Order &amp; Environment</th>
                <th className="py-3.5 px-4">Transaction Ref</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Payment State</th>
                <th className="py-3.5 px-5 text-right">EscrowPay Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {escrowOrders.map((order) => {
                const txId = order.paymentReceipt?.transactionId || "";
                const ref = order.paymentReference || order.paymentReceipt?.paymentReference || "";
                const isTestTx =
                  Boolean(order.paymentReceipt?.isTestTransaction) ||
                  order.paymentReceipt?.environment === "test" ||
                  ref.startsWith("ESC_TEST_");

                const hasRemoteTxId = Boolean(txId && !txId.startsWith("ESC_") && !txId.startsWith("ORD"));

                const paymentStateLabel =
                  order.settlementOnHold || order.paymentReceipt?.verifiedStatus === "under_review"
                    ? "Payment Under Review"
                    : order.paymentStatus === "paid"
                    ? order.escrowStatus === "released"
                      ? "Escrow Released"
                      : "Payment Secured"
                    : order.paymentStatus === "failed"
                    ? "Payment Failed"
                    : "Payment Processing";

                return (
                  <tr
                    key={order.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-4 px-5">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {order.productName}
                          </span>
                          {isTestTx ? (
                            <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/80 dark:border-amber-800 text-[10px] font-black uppercase tracking-wider">
                              TEST TRANSACTION
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-800 text-[10px] font-black uppercase tracking-wider">
                              LIVE TRANSACTION
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                          {order.uniqueOrderId || order.id} · Buyer: {order.buyerName} · Seller: {order.sellerName || "Merchant"}
                        </p>
                      </div>
                    </td>

                    <td className="py-4 px-4 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                      <div className="space-y-0.5">
                        <p className="truncate max-w-[200px]">{txId || "Pending creation"}</p>
                        {ref && <p className="text-[10px] text-slate-400 truncate max-w-[200px]">{ref}</p>}
                      </div>
                    </td>

                    <td className="py-4 px-4 font-bold text-slate-900 dark:text-white tabular-nums">
                      ₦{Number(order.totalPrice || 0).toLocaleString()}
                    </td>

                    <td className="py-4 px-4">
                      <span
                        className={cn(
                          "font-bold text-xs",
                          paymentStateLabel === "Payment Secured" || paymentStateLabel === "Escrow Released"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : paymentStateLabel === "Payment Failed"
                            ? "text-red-600 dark:text-red-400"
                            : "text-amber-600 dark:text-amber-400"
                        )}
                      >
                        {paymentStateLabel}
                      </span>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Order: {order.status}
                      </p>
                    </td>

                    <td className="py-4 px-5 text-right">
                      <div className="inline-flex flex-wrap justify-end gap-1.5">
                        <button
                          type="button"
                          disabled={Boolean(busyKey)}
                          onClick={() =>
                            handleVerifyTransaction({
                              transactionId: txId || undefined,
                              reference: ref || undefined,
                              orderId: order.id
                            })
                          }
                          className="h-8 px-2.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-[11px] hover:opacity-90 disabled:opacity-40 cursor-pointer"
                        >
                          Verify
                        </button>

                        {config?.isTestMode && isTestTx && hasRemoteTxId && order.paymentStatus !== "paid" && (
                          <button
                            type="button"
                            disabled={Boolean(busyKey)}
                            onClick={() => handleSimulateFunding(txId, order.id)}
                            className="h-8 px-2.5 rounded-lg bg-[#ff6b00] hover:bg-[#e55f00] text-white font-semibold text-[11px] disabled:opacity-40 cursor-pointer"
                          >
                            Simulate Fund
                          </button>
                        )}

                        {hasRemoteTxId && order.paymentStatus === "paid" && order.escrowStatus === "held" && (
                          <>
                            <button
                              type="button"
                              disabled={Boolean(busyKey)}
                              onClick={() => handleEscrowLifecycleAction("release", txId, order.id)}
                              className="h-8 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] disabled:opacity-40 cursor-pointer"
                            >
                              Release
                            </button>
                            <button
                              type="button"
                              disabled={Boolean(busyKey)}
                              onClick={() => handleEscrowLifecycleAction("refund", txId, order.id)}
                              className="h-8 px-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-[11px] disabled:opacity-40 cursor-pointer"
                            >
                              Refund
                            </button>
                          </>
                        )}

                        {hasRemoteTxId && (
                          <button
                            type="button"
                            disabled={Boolean(busyKey)}
                            onClick={() => handleInspectTransaction(txId)}
                            className="h-8 px-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold text-[11px] disabled:opacity-40 cursor-pointer"
                          >
                            Inspect
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {escrowOrders.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-14 text-center text-slate-400">
                    No matching EscrowPay transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Inspection Modal */}
      {inspectedTx && (
        <div
          className="fixed inset-0 z-[260] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setInspectedTx(null);
          }}
        >
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  EscrowPay Transaction Details{" "}
                  {inspectedTx.isTestTransaction ? "(TEST TRANSACTION)" : "(LIVE)"}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  Environment: {inspectedTx.environment}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInspectedTx(null)}
                className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div>
                <p className="font-bold text-slate-700 dark:text-slate-300 mb-1.5">Transaction</p>
                <pre className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-x-auto font-mono text-[11px] text-slate-800 dark:text-slate-200">
                  {JSON.stringify(inspectedTx.transaction, null, 2)}
                </pre>
              </div>
              {inspectedTx.fundingRecords && (
                <div>
                  <p className="font-bold text-slate-700 dark:text-slate-300 mb-1.5">Funding Records</p>
                  <pre className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-x-auto font-mono text-[11px] text-slate-800 dark:text-slate-200">
                    {JSON.stringify(inspectedTx.fundingRecords, null, 2)}
                  </pre>
                </div>
              )}
              {inspectedTx.timeline && (
                <div>
                  <p className="font-bold text-slate-700 dark:text-slate-300 mb-1.5">Timeline</p>
                  <pre className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-x-auto font-mono text-[11px] text-slate-800 dark:text-slate-200">
                    {JSON.stringify(inspectedTx.timeline, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
