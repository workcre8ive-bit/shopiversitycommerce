import React from "react";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  RefreshCw,
  ArrowRight,
  ShoppingBag,
  Copy,
  Check,
  Lock,
  LogIn,
  HelpCircle,
  Package
} from "lucide-react";
import { auth, db } from "../firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  updateDoc,
  where
} from "firebase/firestore";
import { Order, UserProfile } from "../types";
import { cn } from "../lib/utils";
import Logo from "./Logo";
import { handleFirestoreError, OperationType } from "../lib/firebase-errors";

export type CanonicalEscrowStatus = "processing" | "secured" | "failed" | "under_review";

interface EscrowVerifyResponse {
  success: boolean;
  verified: boolean;
  verificationSource?: string;
  status: CanonicalEscrowStatus;
  statusLabel: string;
  statusMessage: string;
  retryable?: boolean;
  verifiedAt?: string;
  error?: string;
  transaction?: {
    reference?: string;
    transactionId?: string;
    escrowId?: string;
    amount?: number | null;
    fundedMinor?: number;
    fundingFeeDeductedMinor?: number;
    currency?: string;
    channel?: string;
    paidAt?: string;
    environment?: "test" | "live";
    isTestTransaction?: boolean;
    providerStatus?: string;
  };
  orderConnection?: {
    matched: boolean;
    orderId: string | null;
    uniqueOrderId?: string | null;
    productName?: string;
    productImageUrl?: string | null;
    quantity?: number;
    totalPrice?: number;
    sellerName?: string;
    deliveryType?: string;
    orderStatus?: string;
    paymentStatus?: string;
    escrowStatus?: string;
    createdAt?: string | null;
    isOneDollar?: boolean;
    authorizedView?: boolean;
    requiresSignIn?: boolean;
    orderUpdatedByServer?: boolean;
    syncPayload?: Record<string, any> | null;
  };
}

interface EscrowReturnPageProps {
  currentUser: UserProfile | null;
  onReturnToOrder: (orderId?: string | null) => void;
  onSignInForOrder: (orderId?: string | null) => void;
  onBackToMarketplace: () => void;
  onContactSupport: () => void;
}

function getSafeReturnParams() {
  if (typeof window === "undefined") {
    return { reference: "", transactionId: "", escrowId: "", orderId: "" };
  }
  const params = new URLSearchParams(window.location.search);
  const clean = (key: string) => (params.get(key) || "").trim();

  // Intentionally ignores any URL `status` param — payment status is strictly verified via backend
  const reference = clean("reference") || clean("trxref") || clean("tx_ref") || clean("paymentReference");
  const transactionId = clean("transactionId") || clean("transaction_id") || clean("sessionId") || clean("session_id");
  const escrowId = clean("escrowId") || clean("escrow_id");
  const orderId = clean("orderId") || clean("order_id");

  return { reference, transactionId, escrowId, orderId };
}

function formatAmount(amount: number | null | undefined, currency = "NGN") {
  if (amount === null || amount === undefined || !Number.isFinite(amount)) return "Pending verification";
  if (currency === "NGN") {
    return `₦${Number(amount).toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  }
  return `${currency} ${Number(amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function EscrowReturnPage({
  currentUser,
  onReturnToOrder,
  onSignInForOrder,
  onBackToMarketplace,
  onContactSupport
}: EscrowReturnPageProps) {
  const initialParams = React.useMemo(() => getSafeReturnParams(), []);
  const [status, setStatus] = React.useState<CanonicalEscrowStatus>("processing");
  const [statusLabel, setStatusLabel] = React.useState<string>("Payment Processing");
  const [statusMessage, setStatusMessage] = React.useState<string>(
    "Confirming your EscrowPay transaction securely with our payment verification server..."
  );
  const [isVerifying, setIsVerifying] = React.useState<boolean>(true);
  const [verifyData, setVerifyData] = React.useState<EscrowVerifyResponse | null>(null);
  const [linkedOrder, setLinkedOrder] = React.useState<Order | null>(null);
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);
  const [autoPollCount, setAutoPollCount] = React.useState<number>(0);

  const hasAnyIdentifier = Boolean(
    initialParams.reference || initialParams.transactionId || initialParams.escrowId || initialParams.orderId
  );

  const findAndSyncBuyerOrder = React.useCallback(
    async (backendResponse: EscrowVerifyResponse): Promise<{
      matchedOrder: Order | null;
      escalatedStatus?: CanonicalEscrowStatus;
      escalatedMessage?: string;
    }> => {
      const uid = currentUser?.uid || auth.currentUser?.uid;
      if (!uid) return { matchedOrder: null };

      const candidateOrderId =
        backendResponse.orderConnection?.orderId || initialParams.orderId || "";
      const candidateRefs = Array.from(
        new Set(
          [
            backendResponse.transaction?.reference,
            backendResponse.transaction?.transactionId,
            backendResponse.transaction?.escrowId,
            initialParams.reference,
            initialParams.transactionId,
            initialParams.escrowId
          ].filter(Boolean) as string[]
        )
      );

      let found: Order | null = null;

      try {
        if (candidateOrderId) {
          const directSnap = await getDoc(doc(db, "orders", candidateOrderId));
          if (directSnap.exists()) {
            const candidate = { id: directSnap.id, ...directSnap.data() } as Order;
            if (candidate.buyerId === uid || candidate.sellerId === uid || currentUser?.role === "admin") {
              found = candidate;
            }
          }
        }

        if (!found) {
          const q = query(collection(db, "orders"), where("buyerId", "==", uid), limit(50));
          const snap = await getDocs(q);
          for (const d of snap.docs) {
            const o = { id: d.id, ...d.data() } as Order;
            if (
              (candidateOrderId && (o.id === candidateOrderId || o.uniqueOrderId === candidateOrderId)) ||
              (o.paymentReference && candidateRefs.includes(o.paymentReference)) ||
              (o.paymentReceipt?.transactionId && candidateRefs.includes(o.paymentReceipt.transactionId))
            ) {
              found = o;
              break;
            }
          }
        }
      } catch (lookupErr) {
        console.warn("[ESCROW RETURN] Order lookup notice:", lookupErr);
      }

      if (!found) return { matchedOrder: null };

      // Integrity cross-check when backend confirmed transaction details
      let finalStatus: CanonicalEscrowStatus = backendResponse.status;
      let escalatedMessage: string | undefined;

      if (
        backendResponse.verified &&
        finalStatus === "secured" &&
        backendResponse.transaction?.amount !== null &&
        backendResponse.transaction?.amount !== undefined &&
        found.totalPrice > 0 &&
        (backendResponse.transaction.currency || "NGN") === "NGN" &&
        backendResponse.transaction.amount + 1 < found.totalPrice
      ) {
        finalStatus = "under_review";
        escalatedMessage =
          "Verified transaction amount differs from your Shopiversity order total. Settlement is safely on hold under review.";
      }

      // If server did not update Firestore (e.g., client-governed environment without Admin service account),
      // sync ONLY verified status returned by the backend into Firestore.
      if (
        backendResponse.verified &&
        !backendResponse.orderConnection?.orderUpdatedByServer &&
        found.buyerId === uid
      ) {
        const now = new Date().toISOString();
        const refToSave =
          backendResponse.transaction?.reference ||
          initialParams.reference ||
          found.paymentReference ||
          found.id;
        const txIdToSave =
          backendResponse.transaction?.transactionId ||
          initialParams.transactionId ||
          refToSave;

        const existingReceipt = found.paymentReceipt;
        const receipt = {
          receiptNumber:
            existingReceipt?.receiptNumber ||
            "ESC-" + Math.random().toString(36).substring(2, 8).toUpperCase() + "-" + Date.now().toString().slice(-4),
          orderId: found.id,
          transactionId: txIdToSave,
          paymentReference: refToSave,
          paymentMethod: "online" as const,
          provider: "escrowpay",
          environment: backendResponse.transaction?.environment || existingReceipt?.environment || "test",
          isTestTransaction:
            backendResponse.transaction?.isTestTransaction ??
            (backendResponse.transaction?.environment === "test" || existingReceipt?.isTestTransaction),
          escrowId: backendResponse.transaction?.escrowId || initialParams.escrowId || txIdToSave,
          amountPaid: backendResponse.transaction?.amount ?? found.totalPrice,
          fundedMinor: backendResponse.transaction?.fundedMinor ?? existingReceipt?.fundedMinor,
          fundingFeeDeductedMinor:
            backendResponse.transaction?.fundingFeeDeductedMinor ?? existingReceipt?.fundingFeeDeductedMinor,
          currency: backendResponse.transaction?.currency || "NGN",
          platformFee: found.commissionAmount || 0,
          buyerName: found.buyerName || currentUser?.displayName || "Buyer",
          productName: found.productName || "Shopiversity Order",
          quantity: found.quantity || 1,
          deliveryType: found.deliveryType || "delivery",
          verificationTimestamp: now,
          escrowStatus:
            finalStatus === "secured" || finalStatus === "under_review"
              ? ("held" as const)
              : ("not_applicable" as const),
          status:
            finalStatus === "secured"
              ? ("verified" as const)
              : finalStatus === "under_review"
              ? ("under_review" as const)
              : finalStatus === "failed"
              ? ("failed" as const)
              : ("processing" as const),
          verifiedStatus: finalStatus
        };

        const existingOrderStatus = String(found.status || "").toLowerCase();
        const isTerminal = ["completed", "cancelled", "refunded", "delivered"].includes(existingOrderStatus);

        const updateFields: Record<string, any> = {
          paymentReference: refToSave,
          paymentReceipt: receipt,
          updatedAt: now
        };

        if (finalStatus === "secured") {
          updateFields.paymentStatus = "paid";
          updateFields.escrowStatus = "held";
          updateFields.paymentVerifiedAt = now;
          updateFields.settlementOnHold = false;
          if (!isTerminal && (!existingOrderStatus || ["awaiting_payment", "payment_required"].includes(existingOrderStatus))) {
            updateFields.status = "pending";
          }
        } else if (finalStatus === "under_review") {
          updateFields.paymentStatus = found.paymentStatus === "paid" ? "paid" : "pending";
          updateFields.escrowStatus = "held";
          updateFields.settlementOnHold = true;
        } else if (finalStatus === "failed" && found.paymentStatus !== "paid") {
          updateFields.paymentStatus = "failed";
          updateFields.escrowStatus = "not_applicable";
        }

        try {
          await updateDoc(doc(db, "orders", found.id), updateFields);
          found = { ...found, ...updateFields } as Order;
        } catch (syncErr) {
          try {
            handleFirestoreError(syncErr, OperationType.UPDATE, `orders/${found.id}`);
          } catch {
            // Non-blocking fallback: still display verified backend state cleanly
          }
        }
      }

      return {
        matchedOrder: found,
        escalatedStatus: finalStatus !== backendResponse.status ? finalStatus : undefined,
        escalatedMessage
      };
    },
    [currentUser?.uid, currentUser?.displayName, currentUser?.role, initialParams]
  );

  const verifyEscrowTransaction = React.useCallback(async () => {
    if (!hasAnyIdentifier) {
      setIsVerifying(false);
      setStatus("failed");
      setStatusLabel("Payment Failed");
      setStatusMessage(
        "No transaction or order reference was provided in the return link. Please return to your orders page to check payment status."
      );
      return;
    }

    setIsVerifying(true);
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };

      if (auth.currentUser) {
        try {
          const idToken = await auth.currentUser.getIdToken();
          if (idToken) {
            headers.Authorization = `Bearer ${idToken}`;
          }
        } catch {
          // Proceed without bearer token; backend will omit private order PII
        }
      }

      const res = await fetch("/api/payments/escrow/verify", {
        method: "POST",
        headers,
        body: JSON.stringify({
          reference: initialParams.reference,
          transactionId: initialParams.transactionId,
          escrowId: initialParams.escrowId,
          orderId: initialParams.orderId
        })
      });

      const data: EscrowVerifyResponse = await res.json();
      setVerifyData(data);

      const syncOutcome = await findAndSyncBuyerOrder(data);
      if (syncOutcome.matchedOrder) {
        setLinkedOrder(syncOutcome.matchedOrder);
      }

      const resolvedStatus = syncOutcome.escalatedStatus || data.status || "processing";
      const resolvedLabel =
        resolvedStatus === "secured"
          ? "Payment Secured"
          : resolvedStatus === "under_review"
          ? "Payment Under Review"
          : resolvedStatus === "failed"
          ? "Payment Failed"
          : "Payment Processing";

      setStatus(resolvedStatus);
      setStatusLabel(data.statusLabel && !syncOutcome.escalatedStatus ? data.statusLabel : resolvedLabel);
      setStatusMessage(
        syncOutcome.escalatedMessage ||
          data.statusMessage ||
          "Transaction status retrieved from backend verification."
      );
    } catch (err) {
      console.error("[ESCROW RETURN] Verification request error:", err);
      setStatus("processing");
      setStatusLabel("Payment Processing");
      setStatusMessage(
        "Unable to reach the verification server right now. Do not pay again until you refresh verification status."
      );
    } finally {
      setIsVerifying(false);
    }
  }, [hasAnyIdentifier, initialParams, findAndSyncBuyerOrder]);

  React.useEffect(() => {
    verifyEscrowTransaction();
  }, [verifyEscrowTransaction]);

  // Gentle automatic re-check for up to 3 intervals when transaction is still processing
  React.useEffect(() => {
    if (isVerifying || status !== "processing" || !verifyData?.retryable || autoPollCount >= 3) {
      return;
    }
    const timer = setTimeout(() => {
      setAutoPollCount((c) => c + 1);
      verifyEscrowTransaction();
    }, 5500);
    return () => clearTimeout(timer);
  }, [isVerifying, status, verifyData?.retryable, autoPollCount, verifyEscrowTransaction]);

  const handleCopy = (label: string, value: string) => {
    if (!value) return;
    navigator.clipboard?.writeText(value).catch(() => {});
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const resolvedOrderId =
    linkedOrder?.id ||
    verifyData?.orderConnection?.orderId ||
    initialParams.orderId ||
    null;

  const displayOrderNumber =
    linkedOrder?.uniqueOrderId ||
    verifyData?.orderConnection?.uniqueOrderId ||
    resolvedOrderId ||
    "Pending order match";

  const displayProductName =
    linkedOrder?.productName ||
    verifyData?.orderConnection?.productName ||
    null;

  const displayProductImage =
    linkedOrder?.productImageUrl ||
    verifyData?.orderConnection?.productImageUrl ||
    null;

  const displayAmount =
    verifyData?.transaction?.amount ??
    linkedOrder?.totalPrice ??
    verifyData?.orderConnection?.totalPrice ??
    null;

  const displayCurrency = verifyData?.transaction?.currency || "NGN";

  const displayReference =
    verifyData?.transaction?.reference ||
    initialParams.reference ||
    verifyData?.transaction?.transactionId ||
    initialParams.transactionId ||
    "—";

  const displayEscrowId =
    verifyData?.transaction?.escrowId ||
    initialParams.escrowId ||
    "";

  const statusVisual = React.useMemo(() => {
    switch (status) {
      case "secured":
        return {
          icon: CheckCircle2,
          iconWrap: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/70",
          accentBar: "bg-emerald-500",
          headlineColor: "text-slate-900 dark:text-white",
          escrowCopy: "Held securely in EscrowPay until delivery confirmation"
        };
      case "under_review":
        return {
          icon: AlertTriangle,
          iconWrap: "bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/70",
          accentBar: "bg-amber-500",
          headlineColor: "text-slate-900 dark:text-white",
          escrowCopy: "On hold pending EscrowPay verification review"
        };
      case "failed":
        return {
          icon: XCircle,
          iconWrap: "bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/70",
          accentBar: "bg-red-500",
          headlineColor: "text-slate-900 dark:text-white",
          escrowCopy: "Not funded — no settlement released"
        };
      case "processing":
      default:
        return {
          icon: Clock,
          iconWrap: "bg-orange-50 dark:bg-orange-950/40 text-[#ff6b00] border-orange-200 dark:border-orange-900/60",
          accentBar: "bg-[#ff6b00]",
          headlineColor: "text-slate-900 dark:text-white",
          escrowCopy: "Awaiting final confirmation from EscrowPay"
        };
    }
  }, [status]);

  const StatusIcon = statusVisual.icon;
  const needsSignInForOrder =
    !currentUser && Boolean(resolvedOrderId || verifyData?.orderConnection?.requiresSignIn);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 flex flex-col">
      {/* Brand Header */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-b border-slate-200/80 dark:border-zinc-800/80">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <Logo onClick={onBackToMarketplace} />
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-zinc-400">
            <Lock className="w-3.5 h-3.5 text-[#ff6b00] shrink-0" />
            <span className="hidden min-[380px]:inline">EscrowPay Return</span>
          </div>
        </div>
      </header>

      {/* Centered Verification Card */}
      <main className="flex-1 flex items-start sm:items-center justify-center px-4 py-6 sm:py-12">
        <div className="w-full max-w-xl">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200/90 dark:border-zinc-800 shadow-sm overflow-hidden">
            {/* Top Status Stripe */}
            <div className={cn("h-1.5 w-full", statusVisual.accentBar)} />

            <div className="p-5 sm:p-8 space-y-6">
              {(verifyData?.transaction?.isTestTransaction ||
                verifyData?.transaction?.environment === "test" ||
                linkedOrder?.paymentReceipt?.isTestTransaction ||
                linkedOrder?.paymentReceipt?.environment === "test") && (
                <div className="rounded-2xl border border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between gap-2">
                  <span className="font-bold uppercase tracking-wider">Test Transaction · Sandbox Mode</span>
                  <span className="text-[11px] font-medium text-amber-800 dark:text-amber-300">
                    No live funds charged
                  </span>
                </div>
              )}

              {/* Primary Status Block */}
              <div className="flex flex-col items-center text-center space-y-3">
                <div
                  className={cn(
                    "w-16 h-16 rounded-2xl border flex items-center justify-center transition-colors",
                    statusVisual.iconWrap
                  )}
                >
                  {isVerifying ? (
                    <RefreshCw className="w-7 h-7 animate-spin text-[#ff6b00]" />
                  ) : (
                    <StatusIcon className="w-8 h-8" />
                  )}
                </div>

                <div className="space-y-1.5">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-[#ff6b00]">
                    Shopiversity Escrow Verification
                  </p>
                  <h1
                    className={cn(
                      "text-2xl sm:text-3xl font-extrabold font-display tracking-tight",
                      statusVisual.headlineColor
                    )}
                  >
                    {isVerifying ? "Payment Processing" : statusLabel}
                  </h1>
                  <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed max-w-md mx-auto">
                    {isVerifying
                      ? "Securely verifying transaction status through Shopiversity's backend..."
                      : statusMessage}
                  </p>
                </div>
              </div>

              {/* Linked Order Card (when available & authorized) */}
              {(displayProductName || resolvedOrderId) && (
                <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-950/60 p-4 flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 overflow-hidden shrink-0 flex items-center justify-center">
                    {displayProductImage ? (
                      <img
                        src={displayProductImage}
                        alt={displayProductName || "Order item"}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <Package className="w-6 h-6 text-[#ff6b00]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400 tabular-nums truncate">
                      Order {displayOrderNumber}
                    </p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {displayProductName || "Connected Shopiversity Order"}
                    </p>
                    {linkedOrder?.sellerName || verifyData?.orderConnection?.sellerName ? (
                      <p className="text-xs text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                        Seller: {linkedOrder?.sellerName || verifyData?.orderConnection?.sellerName}
                        {linkedOrder?.quantity ? ` · Qty ${linkedOrder.quantity}` : ""}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                        {needsSignInForOrder
                          ? "Sign in to view full item & delivery details"
                          : "Linked to your Shopiversity order"}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Verified Transaction Ledger */}
              <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 divide-y divide-slate-100 dark:divide-zinc-800/80 text-sm">
                <div className="px-4 py-3 flex items-center justify-between gap-4">
                  <span className="text-slate-500 dark:text-zinc-400">Amount</span>
                  <span className="font-bold text-slate-900 dark:text-white tabular-nums text-right">
                    {formatAmount(displayAmount, displayCurrency)}
                  </span>
                </div>

                <div className="px-4 py-3 flex items-center justify-between gap-4">
                  <span className="text-slate-500 dark:text-zinc-400 shrink-0">Transaction Ref</span>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-mono text-xs font-semibold text-slate-900 dark:text-zinc-100 truncate tabular-nums">
                      {displayReference}
                    </span>
                    {displayReference !== "—" && (
                      <button
                        type="button"
                        onClick={() => handleCopy("ref", displayReference)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-[#ff6b00] hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-colors shrink-0 cursor-pointer"
                        aria-label="Copy transaction reference"
                      >
                        {copiedKey === "ref" ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {displayEscrowId && (
                  <div className="px-4 py-3 flex items-center justify-between gap-4">
                    <span className="text-slate-500 dark:text-zinc-400 shrink-0">Escrow ID</span>
                    <span className="font-mono text-xs font-semibold text-slate-900 dark:text-zinc-100 truncate tabular-nums">
                      {displayEscrowId}
                    </span>
                  </div>
                )}

                <div className="px-4 py-3 flex items-center justify-between gap-4">
                  <span className="text-slate-500 dark:text-zinc-400 shrink-0">Escrow Protection</span>
                  <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200 text-right">
                    {statusVisual.escrowCopy}
                  </span>
                </div>

                {verifyData?.verifiedAt && (
                  <div className="px-4 py-3 flex items-center justify-between gap-4">
                    <span className="text-slate-500 dark:text-zinc-400 shrink-0">Checked At</span>
                    <span className="text-xs font-medium text-slate-700 dark:text-zinc-300 tabular-nums text-right">
                      {new Date(verifyData.verifiedAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons (Mobile-friendly >= 48px targets) */}
              <div className="space-y-3 pt-1">
                {needsSignInForOrder ? (
                  <button
                    type="button"
                    onClick={() => onSignInForOrder(resolvedOrderId)}
                    className="w-full h-12 px-5 bg-[#ff6b00] hover:bg-[#e55f00] text-white font-bold text-sm rounded-2xl shadow-sm transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    Sign In to View Order Details
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onReturnToOrder(resolvedOrderId)}
                    className="w-full h-12 px-5 bg-[#ff6b00] hover:bg-[#e55f00] text-white font-bold text-sm rounded-2xl shadow-sm transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Return to Order Details</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(status === "processing" || status === "under_review") && (
                    <button
                      type="button"
                      onClick={verifyEscrowTransaction}
                      disabled={isVerifying}
                      className="h-12 px-4 bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/30 dark:hover:bg-orange-950/50 text-[#ff6b00] border border-orange-200/80 dark:border-orange-900/50 font-bold text-sm rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                    >
                      <RefreshCw className={cn("w-4 h-4", isVerifying && "animate-spin")} />
                      <span>{isVerifying ? "Checking..." : "Refresh Verification"}</span>
                    </button>
                  )}

                  {(status === "failed" || status === "under_review") && (
                    <button
                      type="button"
                      onClick={onContactSupport}
                      className="h-12 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-100 font-bold text-sm rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <HelpCircle className="w-4 h-4" />
                      <span>Contact Support</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={onBackToMarketplace}
                    className={cn(
                      "h-12 px-4 bg-white hover:bg-slate-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 font-bold text-sm rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer",
                      status === "secured" && "sm:col-span-2"
                    )}
                  >
                    <ShoppingBag className="w-4 h-4 text-[#ff6b00]" />
                    <span>Continue Shopping</span>
                  </button>
                </div>
              </div>

              {/* Trust Notice */}
              <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex items-start gap-2.5 text-xs text-slate-500 dark:text-zinc-400">
                <ShieldCheck className="w-4 h-4 text-[#ff6b00] shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Shopiversity verifies every EscrowPay return transaction directly through our backend before marking an order as funded.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
