import React, { useState, useEffect, useMemo } from "react";
import {
  Mail,
  Search,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Eye,
  Smartphone,
  Monitor,
  ShieldCheck,
  Clock,
  Tag,
  Code2,
  Filter,
  ListChecks,
  History,
  Layers,
  Ban,
  CheckSquare
} from "lucide-react";
import { cn } from "../lib/utils";
import {
  SHOPIVERSITY_EMAIL_TEMPLATES,
  EmailRecipientCategory,
  EmailTemplateDefinition,
  getSampleEmailVariables,
  renderShopiversityEmail
} from "../../shared/emailTemplates";

interface EmailLogItem {
  id: string;
  templateId: string;
  templateCode: string;
  templateName: string;
  recipientCategory: string;
  classification: "transactional" | "marketing";
  recipientEmail: string;
  subject: string;
  triggerEvent: string;
  status: "sent" | "failed" | "suppressed_duplicate" | "skipped_unsubscribed";
  provider?: string;
  messageId?: string;
  retryCount: number;
  error?: string;
  isTest?: boolean;
  createdAt: string;
}

const MASTER_QA_ITEMS = [
  { id: "qa_buyer_reg", group: "Buyer Account", text: "Signup triggers B-02 Verification Code -> verifying code fires B-03 & B-01 Welcome" },
  { id: "qa_buyer_sec", group: "Buyer Account", text: "Password reset fires B-04 Reset Code -> completion fires B-05; first login on new browser fires B-06" },
  { id: "qa_order_flow", group: "Order Lifecycle", text: "Checkout fires Buyer Order Placed (+ Escrow Receipt), Seller New Order Received, and Logistics Dispatch Request" },
  { id: "qa_fulfillment", group: "Seller & Logistics", text: "Seller Accept -> Logistics Accept (dual PINs) -> Picked Up -> In Transit -> Reached Buyer -> Completed" },
  { id: "qa_delivery_fail", group: "Exceptions", text: "Failed delivery attempt dispatches B-19 Buyer Failed, S-20 Seller Failed, and L-20/21/22/23 Courier reason email" },
  { id: "qa_refunds", group: "Refunds & Support", text: "Refund Request dispatches B-21 & S-22; Admin/Seller Review dispatches B-22 + S-23/S-24; Support ticket dispatches B-29" },
  { id: "qa_inventory", group: "Inventory & Payouts", text: "New product fires S-34; checkout stock <=5 fires S-36 Low Stock; stock=0 fires S-37 Out of Stock; payout request/approve/reject fire S-28/29/31" },
  { id: "qa_compliance", group: "Consent & Compliance", text: "Unchecking marketing preferences or visiting /api/emails/unsubscribe skips marketing emails while preserving transactional alerts" },
  { id: "qa_dedup", group: "Reliability", text: "Duplicate lifecycle calls with same idempotencyKey are suppressed and recorded as suppressed_duplicate in Outgoing Logs" },
  { id: "qa_clients", group: "Rendering QA", text: "Verify responsive HTML rendering in Gmail Web, Gmail Mobile, and Outlook Desktop with and without blocked images" }
];

interface AdminEmailTemplateHubProps {
  mode: "blueprint" | "logs";
  defaultTestRecipient?: string;
}

export default function AdminEmailTemplateHub({
  mode,
  defaultTestRecipient = "fashinaayomide2005@gmail.com"
}: AdminEmailTemplateHubProps) {
  const [categoryFilter, setCategoryFilter] = useState<"all" | EmailRecipientCategory>("all");
  const [classificationFilter, setClassificationFilter] = useState<"all" | "transactional" | "marketing">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string>(SHOPIVERSITY_EMAIL_TEMPLATES[0]?.id || "buyer_welcome");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [testEmail, setTestEmail] = useState(defaultTestRecipient);
  const [sendingTest, setSendingTest] = useState(false);
  const [testFeedback, setTestFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Logs & QA state
  const [logs, setLogs] = useState<EmailLogItem[]>([]);
  const [logStats, setLogStats] = useState({ totalLogged: 0, sent: 0, failed: 0, suppressed: 0, unsubscribedSkipped: 0 });
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logStatusFilter, setLogStatusFilter] = useState("all");
  const [logSearch, setLogSearch] = useState("");
  const [qaChecked, setQaChecked] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem("shopiversity_email_master_qa");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const filteredTemplates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return SHOPIVERSITY_EMAIL_TEMPLATES.filter((t) => {
      if (categoryFilter !== "all" && t.recipientCategory !== categoryFilter) return false;
      if (classificationFilter !== "all" && t.classification !== classificationFilter) return false;
      if (q) {
        const hay = `${t.code} ${t.name} ${t.section} ${t.triggerEvent} ${t.subjectTemplate}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [categoryFilter, classificationFilter, searchQuery]);

  const selectedTemplate: EmailTemplateDefinition = useMemo(() => {
    return (
      filteredTemplates.find((t) => t.id === selectedId) ||
      SHOPIVERSITY_EMAIL_TEMPLATES.find((t) => t.id === selectedId) ||
      filteredTemplates[0] ||
      SHOPIVERSITY_EMAIL_TEMPLATES[0]
    );
  }, [filteredTemplates, selectedId]);

  const renderedPreview = useMemo(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://shopiversity.app";
    const sampleVars = getSampleEmailVariables(selectedTemplate.id, origin);
    return renderShopiversityEmail(selectedTemplate, sampleVars, origin);
  }, [selectedTemplate]);

  const counts = useMemo(
    () => ({
      all: SHOPIVERSITY_EMAIL_TEMPLATES.length,
      buyer: SHOPIVERSITY_EMAIL_TEMPLATES.filter((t) => t.recipientCategory === "buyer").length,
      seller: SHOPIVERSITY_EMAIL_TEMPLATES.filter((t) => t.recipientCategory === "seller").length,
      logistics: SHOPIVERSITY_EMAIL_TEMPLATES.filter((t) => t.recipientCategory === "logistics").length
    }),
    []
  );

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const qs = new URLSearchParams({
        status: logStatusFilter,
        search: logSearch,
        limit: "100"
      });
      const res = await fetch(`/api/emails/logs?${qs.toString()}`);
      const data = await res.json();
      if (data?.success) {
        setLogs(Array.isArray(data.logs) ? data.logs : []);
        if (data.stats) setLogStats(data.stats);
      }
    } catch (err) {
      console.warn("Unable to load email audit logs:", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (mode === "logs") {
      void fetchLogs();
    }
  }, [mode, logStatusFilter]);

  const handleSendTemplateTest = async () => {
    const target = testEmail.trim();
    if (!target || !target.includes("@")) {
      setTestFeedback({ type: "error", text: "Enter a valid recipient email address." });
      return;
    }
    setSendingTest(true);
    setTestFeedback(null);
    try {
      const res = await fetch("/api/emails/send-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          recipientEmail: target,
          isTest: true
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Dispatch failed");
      }
      setTestFeedback({
        type: "success",
        text: `Dispatched [${selectedTemplate.code}] "${data.subject}" to ${target} via ${(data.provider || "brevo").toUpperCase()}.`
      });
    } catch (err: any) {
      setTestFeedback({
        type: "error",
        text: err?.message || "Failed to send test template email."
      });
    } finally {
      setSendingTest(false);
    }
  };

  const toggleQa = (id: string) => {
    const next = { ...qaChecked, [id]: !qaChecked[id] };
    setQaChecked(next);
    try {
      localStorage.setItem("shopiversity_email_master_qa", JSON.stringify(next));
    } catch {}
  };

  if (mode === "logs") {
    const completedQa = MASTER_QA_ITEMS.filter((i) => qaChecked[i.id]).length;
    return (
      <div className="space-y-6">
        {/* Metrics Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { label: "Total Logged", val: logStats.totalLogged, color: "text-slate-900 dark:text-white" },
            { label: "Delivered", val: logStats.sent, color: "text-emerald-600" },
            { label: "Failed", val: logStats.failed, color: "text-red-600" },
            { label: "Dedup Suppressed", val: logStats.suppressed, color: "text-amber-600" },
            { label: "Opt-Out Skipped", val: logStats.unsubscribedSkipped, color: "text-indigo-600" }
          ].map((stat) => (
            <div key={stat.label} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{stat.label}</div>
              <div className={cn("text-2xl font-black mt-1", stat.color)}>{stat.val}</div>
            </div>
          ))}
        </div>

        {/* Outgoing Audit Logs */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <History className="w-5 h-5 text-orange-600" />
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">Outgoing Email Audit Log</h3>
                <p className="text-xs text-slate-500">Every transactional &amp; promotional send, deduplication skip, unsubscribe skip, and retry status.</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchLogs()}
                placeholder="Search recipient, code, trigger..."
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
              />
              <select
                value={logStatusFilter}
                onChange={(e) => setLogStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
              >
                <option value="all">All Statuses</option>
                <option value="sent">Sent</option>
                <option value="failed">Failed</option>
                <option value="suppressed_duplicate">Suppressed Duplicate</option>
                <option value="skipped_unsubscribed">Skipped Unsubscribed</option>
              </select>
              <button
                type="button"
                onClick={fetchLogs}
                disabled={loadingLogs}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-black cursor-pointer"
              >
                <RefreshCw className={cn("w-3.5 h-3.5", loadingLogs && "animate-spin")} />
                Refresh
              </button>
            </div>
          </div>

          {logs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
              No outgoing audit log entries match your filter yet. Send a test template or trigger any signup/order event to inspect live telemetry.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase text-[10px]">
                    <th className="py-2.5 pr-3">Code &amp; Template</th>
                    <th className="py-2.5 pr-3">Recipient</th>
                    <th className="py-2.5 pr-3">Subject</th>
                    <th className="py-2.5 pr-3">Status</th>
                    <th className="py-2.5">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="py-3 pr-3">
                        <span className="font-mono font-black text-orange-600">{log.templateCode}</span>{" "}
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{log.templateName}</span>
                        <div className="text-[10px] text-slate-400 font-mono">{log.triggerEvent}</div>
                      </td>
                      <td className="py-3 pr-3 font-medium text-slate-700 dark:text-slate-300">{log.recipientEmail}</td>
                      <td className="py-3 pr-3 text-slate-700 dark:text-slate-300 max-w-xs truncate">{log.subject}</td>
                      <td className="py-3 pr-3">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase",
                            log.status === "sent" && "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
                            log.status === "failed" && "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
                            log.status === "suppressed_duplicate" && "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
                            log.status === "skipped_unsubscribed" && "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300"
                          )}
                        >
                          {log.status.replace("_", " ")}
                        </span>
                        {log.error && <div className="text-[10px] text-red-500 mt-0.5 max-w-[200px] truncate" title={log.error}>{log.error}</div>}
                      </td>
                      <td className="py-3 text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Master QA Checklist */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <ListChecks className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">Master Email Testing Checklist</h3>
                <p className="text-xs text-slate-500">Verify all buyer, seller, logistics, compliance, and rendering checks end-to-end.</p>
              </div>
            </div>
            <span className="text-xs font-black px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              {completedQa} / {MASTER_QA_ITEMS.length} Verified
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {MASTER_QA_ITEMS.map((item) => (
              <label
                key={item.id}
                className={cn(
                  "flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all",
                  qaChecked[item.id]
                    ? "bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
                    : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700"
                )}
              >
                <input
                  type="checkbox"
                  checked={Boolean(qaChecked[item.id])}
                  onChange={() => toggleQa(item.id)}
                  className="mt-0.5 h-4 w-4 accent-emerald-600 rounded cursor-pointer"
                />
                <div className="space-y-0.5">
                  <div className="text-[10px] font-black uppercase tracking-wider text-orange-600">{item.group}</div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">{item.text}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Filter Controls */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                { id: "all", label: `All Templates (${counts.all})` },
                { id: "buyer", label: `Buyer (${counts.buyer})` },
                { id: "seller", label: `Seller (${counts.seller})` },
                { id: "logistics", label: `Logistics (${counts.logistics})` }
              ] as const
            ).map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryFilter(cat.id)}
                className={cn(
                  "px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer",
                  categoryFilter === cat.id
                    ? "bg-orange-600 text-white shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[210px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search code (B-08, S-28, L-19), event, name..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
              />
            </div>
            <select
              value={classificationFilter}
              onChange={(e) => setClassificationFilter(e.target.value as any)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
            >
              <option value="all">All Classifications</option>
              <option value="transactional">Transactional Only</option>
              <option value="marketing">Marketing / Engagement</option>
            </select>
          </div>
        </div>
      </div>

      {/* Master-Detail Explorer */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Template Selector Column */}
        <div className="xl:col-span-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col max-h-[820px]">
          <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
            <span className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-2">
              <Layers className="w-4 h-4 text-orange-600" />
              Showing {filteredTemplates.length} Templates
            </span>
          </div>
          <div className="overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {filteredTemplates.map((tpl) => {
              const active = tpl.id === selectedTemplate.id;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(tpl.id);
                    setTestFeedback(null);
                  }}
                  className={cn(
                    "w-full text-left px-4 py-3.5 transition-all flex items-start gap-3 cursor-pointer",
                    active
                      ? "bg-orange-50/90 dark:bg-orange-950/30 border-l-4 border-orange-600"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  )}
                >
                  <span className="px-2 py-0.5 rounded-lg bg-slate-900 text-white font-mono text-[10px] font-black shrink-0 mt-0.5">
                    {tpl.code}
                  </span>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="text-xs font-bold text-slate-900 dark:text-white leading-snug">{tpl.name}</div>
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                      <span className="text-slate-500">{tpl.section}</span>
                      <span>&bull;</span>
                      <span
                        className={cn(
                          "font-black uppercase",
                          tpl.classification === "marketing" ? "text-purple-600" : "text-emerald-600"
                        )}
                      >
                        {tpl.classification}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Metadata + Live HTML Preview Column */}
        <div className="xl:col-span-7 space-y-5">
          {/* Specification Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-lg bg-orange-600 text-white font-mono text-xs font-black">
                    {selectedTemplate.code}
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    {selectedTemplate.recipientCategory} &bull; {selectedTemplate.section}
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">{selectedTemplate.name}</h3>
              </div>
              <span
                className={cn(
                  "px-3 py-1 rounded-full text-[11px] font-black uppercase",
                  selectedTemplate.classification === "marketing"
                    ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                    : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                )}
              >
                {selectedTemplate.classification}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/70">
                <div className="text-[10px] font-black uppercase text-slate-500 mb-1">Trigger Event</div>
                <div className="font-mono font-bold text-orange-600">{selectedTemplate.triggerEvent}</div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/70">
                <div className="text-[10px] font-black uppercase text-slate-500 mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Recommended Schedule
                </div>
                <div className="font-bold text-slate-800 dark:text-slate-200">{selectedTemplate.recommendedSchedule}</div>
              </div>
              <div className="md:col-span-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/70">
                <div className="text-[10px] font-black uppercase text-slate-500 mb-1">Sending Conditions &amp; Guardrails</div>
                <div className="text-slate-700 dark:text-slate-300 leading-relaxed">{selectedTemplate.sendingConditions}</div>
              </div>
              <div className="md:col-span-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/70 space-y-1.5">
                <div className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-1">
                  <Code2 className="w-3 h-3" /> Required Dynamic Variables
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedTemplate.requiredVariables.map((v) => (
                    <span
                      key={v}
                      className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300"
                    >
                      {`{{${v}}}`}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Subject / Preview / Send Test Bar */}
            <div className="p-4 rounded-2xl bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/60 space-y-3">
              <div className="text-xs space-y-1">
                <div>
                  <span className="font-black text-slate-500 uppercase text-[10px]">Subject: </span>
                  <span className="font-bold text-slate-900 dark:text-white">{renderedPreview.subject}</span>
                </div>
                <div>
                  <span className="font-black text-slate-500 uppercase text-[10px]">Preview Text: </span>
                  <span className="text-slate-700 dark:text-slate-300">{renderedPreview.previewText}</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="Recipient email to send live test..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-orange-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={handleSendTemplateTest}
                  disabled={sendingTest}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs transition-all shadow cursor-pointer disabled:opacity-50"
                >
                  {sendingTest ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Send {selectedTemplate.code} Test
                </button>
              </div>
              {testFeedback && (
                <div
                  className={cn(
                    "p-3 rounded-xl text-xs font-bold flex items-center gap-2",
                    testFeedback.type === "success"
                      ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
                      : "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200"
                  )}
                >
                  {testFeedback.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{testFeedback.text}</span>
                </div>
              )}
            </div>
          </div>

          {/* Responsive HTML Email Frame */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
              <span className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-600" />
                Live Responsive Email Preview
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPreviewDevice("desktop")}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1 cursor-pointer",
                    previewDevice === "desktop" ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-200"
                  )}
                >
                  <Monitor className="w-3.5 h-3.5" /> Desktop
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice("mobile")}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1 cursor-pointer",
                    previewDevice === "mobile" ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-200"
                  )}
                >
                  <Smartphone className="w-3.5 h-3.5" /> Mobile
                </button>
              </div>
            </div>
            <div className="p-4 bg-slate-100 dark:bg-slate-950 flex justify-center">
              <iframe
                title={`Preview ${selectedTemplate.code}`}
                srcDoc={renderedPreview.html}
                className={cn(
                  "bg-white rounded-2xl border border-slate-200 shadow-inner transition-all h-[540px]",
                  previewDevice === "mobile" ? "w-[375px]" : "w-full"
                )}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
