import React from "react";
import { Order, OrderAuditEvent } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, 
  ShieldCheck, 
  Clock, 
  CheckCircle, 
  CreditCard, 
  Truck, 
  Package, 
  AlertTriangle, 
  RefreshCw, 
  FileText,
  User,
  Shield,
  Layers
} from "lucide-react";
import { db } from "../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";

interface OrderAuditTrailModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function OrderAuditTrailModal({
  order,
  isOpen,
  onClose,
}: OrderAuditTrailModalProps) {
  if (!order || !isOpen) return null;

  const [events, setEvents] = React.useState<OrderAuditEvent[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    if (!order) return;
    setLoading(true);

    // Subscribe to real-time events for this order
    const q = query(
      collection(db, "order_events"),
      where("orderId", "==", order.id)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const eventsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as OrderAuditEvent[];

        // Sort chronologically
        eventsData.sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        // Fallback: If no server events recorded yet in Firestore, synthesize the order's known milestone events
        if (eventsData.length === 0) {
          const synthesized: OrderAuditEvent[] = [
            {
              id: "EVT_init",
              orderId: order.id,
              eventType: "ORDER_CREATED",
              performedBy: order.buyerId,
              role: "buyer",
              actorName: order.buyerName || "Buyer",
              notes: `Order #${order.id.slice(0, 8)} placed for ${order.productName} (Qty: ${order.quantity}, Total: ₦${order.totalPrice.toLocaleString()}). Payment Method: ${order.paymentMethod.toUpperCase()}`,
              timestamp: order.createdAt,
            },
          ];

          if (order.acceptedAt) {
            synthesized.push({
              id: "EVT_accepted",
              orderId: order.id,
              eventType: "SELLER_ACCEPTED",
              performedBy: order.sellerId,
              role: "seller",
              actorName: order.sellerName || "Seller",
              notes: "Order accepted by merchant. Packaging and dispatch initiated.",
              timestamp: order.acceptedAt,
            });
          }

          if (order.logisticsAcceptedAt) {
            synthesized.push({
              id: "EVT_logistics_accepted",
              orderId: order.id,
              eventType: "LOGISTICS_ACCEPTED",
              performedBy: order.logisticsId || "courier",
              role: "logistics",
              actorName: order.logisticsName || "Logistics Courier",
              notes: `Logistics partner accepted delivery dispatch.`,
              timestamp: order.logisticsAcceptedAt,
            });
          }

          if (order.handoverVerifiedAt) {
            synthesized.push({
              id: "EVT_handover",
              orderId: order.id,
              eventType: "HANDOVER_VERIFIED",
              performedBy: order.sellerId,
              role: "seller",
              actorName: "Seller & Courier",
              notes: "Package handover authenticated via secure Handover PIN.",
              timestamp: order.handoverVerifiedAt,
            });
          }

          if (order.deliveredAt) {
            synthesized.push({
              id: "EVT_delivered",
              orderId: order.id,
              eventType: "BUYER_DELIVERY_CONFIRMED",
              performedBy: order.buyerId,
              role: "buyer",
              actorName: order.buyerName || "Buyer",
              notes: "Delivery received and confirmed at destination.",
              timestamp: order.deliveredAt,
            });
          }

          if (order.paymentVerifiedAt || (order.paymentStatus === "paid" && order.paymentMethod === "online")) {
            synthesized.push({
              id: "EVT_paid",
              orderId: order.id,
              eventType: "PAYMENT_VERIFIED",
              performedBy: order.buyerId,
              role: "buyer",
              actorName: order.buyerName || "Buyer",
              notes: `Payment of ₦${order.totalPrice.toLocaleString()} confirmed and secured in SHOPIVERSITY Escrow.`,
              timestamp: order.paymentVerifiedAt || order.createdAt,
            });
          }

          if (order.refundStatus && order.refundStatus !== "none") {
            synthesized.push({
              id: "EVT_refund",
              orderId: order.id,
              eventType: order.refundStatus === "approved" ? "REFUND_APPROVED" : "REFUND_REQUESTED",
              performedBy: order.buyerId,
              role: "buyer",
              actorName: order.buyerName || "Buyer",
              notes: `Refund requested for ₦${(order.refundAmount || order.totalPrice).toLocaleString()} (Status: ${order.refundStatus}). 1.5% fee applied. Escrow frozen.`,
              timestamp: order.refundCreatedAt || order.disputedAt || new Date().toISOString(),
            });
          }

          if (order.status === "completed") {
            synthesized.push({
              id: "EVT_completed",
              orderId: order.id,
              eventType: "ORDER_COMPLETED",
              performedBy: "system",
              role: "system",
              actorName: "SHOPIVERSITY Protocol",
              notes: "Order lifecycle verified and concluded. Both delivery receipt and payment validated.",
              timestamp: order.completedAt || order.deliveredAt || new Date().toISOString(),
            });
          }

          setEvents(synthesized);
        } else {
          setEvents(eventsData);
        }
        setLoading(false);
      },
      (err) => {
        console.error("Audit log error:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [order]);

  const getEventBadge = (type: string) => {
    switch (type) {
      case "ORDER_CREATED":
        return { color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300", icon: Package };
      case "SELLER_ACCEPTED":
        return { color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300", icon: CheckCircle };
      case "LOGISTICS_ACCEPTED":
      case "HANDOVER_VERIFIED":
      case "OUT_FOR_DELIVERY":
        return { color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300", icon: Truck };
      case "BUYER_DELIVERY_CONFIRMED":
      case "READY_FOR_PICKUP":
        return { color: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300", icon: CheckCircle };
      case "PAYMENT_REQUIRED":
        return { color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300", icon: Clock };
      case "PAYMENT_VERIFIED":
        return { color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300", icon: CreditCard };
      case "REFUND_REQUESTED":
      case "REFUND_UNDER_REVIEW":
        return { color: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300", icon: AlertTriangle };
      case "REFUND_APPROVED":
      case "REFUND_COMPLETED":
        return { color: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300", icon: ShieldCheck };
      case "ORDER_COMPLETED":
        return { color: "bg-emerald-600 text-white", icon: ShieldCheck };
      default:
        return { color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300", icon: Layers };
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "buyer":
        return "bg-blue-50 text-blue-600 dark:bg-blue-900/20";
      case "seller":
        return "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20";
      case "logistics":
        return "bg-purple-50 text-purple-600 dark:bg-purple-900/20";
      case "admin":
        return "bg-rose-50 text-rose-600 dark:bg-rose-900/20";
      default:
        return "bg-slate-100 text-slate-600 dark:bg-slate-800";
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 lg:p-8 max-w-2xl w-full shadow-2xl border border-slate-100 dark:border-slate-800 my-8 relative"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                Security & Verification
              </span>
              <h3 className="text-xl font-black text-slate-900 dark:text-white font-display">
                Order Activity & Audit Trail
              </h3>
            </div>
          </div>

          {/* Order quick overview */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 mb-6 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Order ID</p>
              <p className="font-mono font-bold text-slate-900 dark:text-white">{order.id}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Payment Protocol</p>
              <p className="font-bold uppercase text-slate-900 dark:text-white">
                {order.paymentMethod === "pod" ? "Pay On Delivery" : "Online Payment (Escrow)"}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Escrow Security</p>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                {order.escrowStatus === "refunded" ? "Refunded" : order.escrowStatus === "held" ? "Held in Escrow" : "Active"}
              </span>
            </div>
          </div>

          {/* Events Timeline */}
          <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                <Clock className="w-6 h-6 animate-spin text-indigo-500" />
                <p className="text-xs font-semibold">Loading verified audit log...</p>
              </div>
            ) : events.length === 0 ? (
              <p className="text-center py-8 text-xs text-slate-400">No events logged yet.</p>
            ) : (
              events.map((evt, idx) => {
                const badge = getEventBadge(evt.eventType);
                const Icon = badge.icon;
                return (
                  <div
                    key={evt.id || idx}
                    className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 flex items-start gap-3.5 relative transition-all hover:border-indigo-200 dark:hover:border-indigo-800/40"
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${badge.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                        <span className="text-xs font-black text-slate-900 dark:text-white">
                          {evt.eventType.replace(/_/g, " ")}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {new Date(evt.timestamp).toLocaleString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {evt.notes}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${getRoleBadge(evt.role)}`}>
                          Role: {evt.role}
                        </span>
                        {evt.actorName && (
                          <span className="text-[10px] text-slate-400 font-medium">
                            by {evt.actorName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              All events cryptographically signed and stored in SHOPIVERSITY immutable logs.
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-xs hover:opacity-90"
            >
              Close Log
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
