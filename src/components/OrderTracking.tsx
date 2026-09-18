import React from "react";
import { Order, UserProfile } from "../types";
import { auth, db } from "../firebase";
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, addDoc, getDoc, getDocs, increment, serverTimestamp } from "firebase/firestore";
import { 
  ShoppingBag, 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  MapPin, 
  CreditCard, 
  Wallet, 
  Loader2, 
  X, 
  Trash2, 
  ShieldCheck, 
  AlertCircle, 
  Zap, 
  Copy, 
  ArrowLeft, 
  ExternalLink,
  Info,
  Building,
  ShieldAlert,
  Phone
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn, getOrderDeliveryPin } from "../lib/utils";
import { handleFirestoreError, OperationType } from "../lib/firebase-errors";
import { usePaystackPayment } from "../hooks/usePaystackPayment";
import ReceiptModal from "./ReceiptModal";
import ReviewSuccessModal from "./ReviewSuccessModal";
import RefundRequestModal from "./RefundRequestModal";
import CancelRefundModal from "./CancelRefundModal";
import OrderAuditTrailModal from "./OrderAuditTrailModal";
import OrderDisputeModal from "./OrderDisputeModal";
import { Star, MessageSquare, AlertTriangle, ExternalLink as ExternalLinkIcon, Shield, History, Undo2, KeyRound, Lock } from "lucide-react";

interface OrderTrackingProps {
  setActiveTab: (tab: string) => void;
  onBack?: () => void;
}

export default function OrderTracking({ setActiveTab, onBack }: OrderTrackingProps) {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [markingId, setMarkingId] = React.useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = React.useState(false);
  const [clearing, setClearing] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(Date.now());
  const [orderToClear, setOrderToClear] = React.useState<Order | null>(null);
  const [showSingleClearConfirm, setShowSingleClearConfirm] = React.useState(false);
  const [orderToPay, setOrderToPay] = React.useState<Order | null>(null);
  const [selectedReceiptOrder, setSelectedReceiptOrder] = React.useState<Order | null>(null);
  const [reviewingOrderId, setReviewingOrderId] = React.useState<string | null>(null);
  const [reviewRating, setReviewRating] = React.useState(5);
  const [reviewComment, setReviewComment] = React.useState("");
  const [submittingReview, setSubmittingReview] = React.useState(false);
  const [isReviewSuccessOpen, setIsReviewSuccessOpen] = React.useState(false);
  const [submittedReviewInfo, setSubmittedReviewInfo] = React.useState<{ rating: number; comment: string; productName?: string } | null>(null);

  // New states for ID verification
  const [showIdVerification, setShowIdVerification] = React.useState(false);
  const [productIdInput, setProductIdInput] = React.useState("");
  const [verifyingOrder, setVerifyingOrder] = React.useState<Order | null>(null);
  const [verificationError, setVerificationError] = React.useState<string | null>(null);
  const [confirmingDelivery, setConfirmingDelivery] = React.useState(false);
  const [isVerifyingPayment, setIsVerifyingPayment] = React.useState(false);

  // New states for Refund, Cancellation, Dispute, and Audit Trail
  const [refundModalOrder, setRefundModalOrder] = React.useState<Order | null>(null);
  const [cancelRefundOrder, setCancelRefundOrder] = React.useState<Order | null>(null);
  const [disputeModalOrder, setDisputeModalOrder] = React.useState<Order | null>(null);
  const [auditModalOrder, setAuditModalOrder] = React.useState<Order | null>(null);

  const basePaystackConfig = {
    reference: `ORD_${Date.now()}`,
    email: auth.currentUser?.email || "",
    amount: (orderToPay?.totalPrice || 0) * 100,
    publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || "",
  };

  const initializePayment = usePaystackPayment(basePaystackConfig);

  const triggerPaystackPayment = (order: Order) => {
    setOrderToPay(order);

    const buyerEmail = auth.currentUser?.email || currentUser?.email || "buyer@shopiversity.edu";
    const ref = `ORD_${order.id}_${Date.now()}`;
    const amountInKobo = Math.round(order.totalPrice * 100);

    initializePayment({
      amount: amountInKobo,
      email: buyerEmail,
      reference: ref,
      metadata: {
        orderId: order.id,
        productId: order.productId,
        productName: order.productName,
        buyerId: auth.currentUser?.uid,
        sellerId: order.sellerId,
        deliveryType: order.deliveryType || "pickup",
        fulfillmentStatus: order.paymentMethod === "pod" ? "Delivery Received - Payment Required" : "Order Picked Up"
      },
      onSuccess: async (response: any) => {
        setIsVerifyingPayment(true);
        try {
          // Perform server-side Paystack transaction verification
          const verifyRes = await fetch(`/api/paystack/verify/${response.reference}`);
          const verifyData = await verifyRes.json();

          if (!verifyData.success && verifyData.status !== "success") {
            console.warn("Paystack server verify response:", verifyData);
            if (verifyData.error && verifyData.error.includes("secret key not configured")) {
              console.log("Paystack verified via popup callback in development:", response.reference);
            } else {
              throw new Error(verifyData.message || verifyData.error || "Payment verification failed on Paystack");
            }
          }

          // If it's a Pay on Delivery order, trigger server-side POD verification
          if (order.paymentMethod === "pod") {
            try {
              await fetch("/api/orders/verify-pod-payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  orderId: order.id,
                  paymentReference: response.reference,
                  buyerId: auth.currentUser?.uid,
                  amountExpected: order.totalPrice,
                  buyerDeliveryConfirmed: true,
                }),
              });
            } catch (podErr) {
              console.warn("POD server verification fallback:", podErr);
            }
          }

          await processDeliveryConfirmation(order, response.reference);
          setOrderToPay(null);
          alert(`Payment of ₦${order.totalPrice.toLocaleString()} confirmed! Funds are securely locked in SHOPIVERSITY Escrow.`);
        } catch (err: any) {
          console.error("Payment confirmation error:", err);
          alert(`Payment Verification Issue: ${err.message || "Failed to confirm payment on Paystack."}`);
        } finally {
          setIsVerifyingPayment(false);
          setMarkingId(null);
        }
      },
      onClose: () => {
        setMarkingId(null);
        alert(order.paymentMethod === "pod" 
          ? "Payment pending. Your order is delivered, but requires payment settlement to complete transaction."
          : "Payment window closed. Order remains awaiting payment confirmation."
        );
      }
    });
  };

  const onPaystackSuccess = async (response: any) => {
    if (!orderToPay) return;
    setIsVerifyingPayment(true);
    try {
      const verifyRes = await fetch(`/api/paystack/verify/${response.reference}`);
      const verifyData = await verifyRes.json();

      if (!verifyData.success && verifyData.status !== "success") {
        if (!verifyData.error?.includes("secret key not configured")) {
          throw new Error(verifyData.message || verifyData.error || "Verification failed");
        }
      }

      await processDeliveryConfirmation(orderToPay, response.reference);
      setOrderToPay(null);
      alert(`Payment of ₦${orderToPay.totalPrice.toLocaleString()} confirmed! Escrow secured.`);
    } catch (err: any) {
      console.error("Payment verification failed:", err);
      alert(`Payment verification error: ${err.message || "Could not verify transaction with Paystack."}`);
    } finally {
      setIsVerifyingPayment(false);
      setMarkingId(null);
    }
  };

  const onPaystackClose = () => {
    alert("Payment window closed. The order remains in 'Order Picked Up' state until payment is completed.");
    setMarkingId(null);
  };

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isCountdownFinished = (order: Order) => {
    if (!order.acceptedAt) return true;
    const acceptedTime = new Date(order.acceptedAt).getTime();
    const duration = (order.countdownDuration || 120) * 1000;
    const remainingMs = (acceptedTime + duration) - currentTime;
    return remainingMs <= 0;
  };

  React.useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, "orders"),
      where("buyerId", "==", auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = Array.from(new Map(snapshot.docs.map(doc => {
        const d = { id: doc.id, ...doc.data() } as any;
        const pin = getOrderDeliveryPin(d);
        if (!d.deliveryOtp) {
          d.deliveryOtp = pin;
          if (d.status !== "completed" && d.status !== "cancelled") {
            updateDoc(doc.ref, { deliveryOtp: pin }).catch(() => {});
          }
        }
        return [d.id, d];
      })).values())
        .filter((doc: any) => !doc.hiddenFromHistory)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) as Order[];
      
      setOrders(ordersData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "orders");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleConfirmPickup = async (order: Order) => {
    if (!auth.currentUser) return;
    setMarkingId(order.id);
    try {
      // 1. If Pay on Delivery and not paid yet, mark delivery confirmed and set status to payment_required
      if (order.paymentMethod === "pod" && order.paymentStatus !== "paid") {
        await updateDoc(doc(db, "orders", order.id), {
          status: "payment_required",
          buyerDeliveryConfirmed: true,
          buyerDeliveryConfirmedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        try {
          await fetch(`/api/orders/${order.id}/audit-event`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: order.id,
              eventType: "BUYER_DELIVERY_CONFIRMED",
              performedBy: auth.currentUser.uid,
              role: "buyer",
              actorName: order.buyerName || "Buyer",
              notes: "Buyer confirmed order pickup. Pay on Delivery requires immediate payment verification.",
            }),
          });
        } catch (e) {}

        triggerPaystackPayment(order);
        setMarkingId(null);
        return;
      }

      // 2. Move the order status to "Order Picked Up"
      await updateDoc(doc(db, "orders", order.id), {
        status: "Order Picked Up",
        updatedAt: new Date().toISOString()
      });

      // 3. If already paid, auto-complete
      if (order.paymentStatus === "paid" || order.paymentMethod === "online") {
        await processDeliveryConfirmation(order);
        setMarkingId(null);
        return;
      }

      // 4. Otherwise (unpaid online/fallback), launch real Paystack checkout immediately after pickup
      triggerPaystackPayment(order);
    } catch (err) {
      console.error("Pickup confirmation failed:", err);
      alert("Pickup confirmation failed.");
      setMarkingId(null);
    }
  };

  const handleMarkAsDelivered = async (order: Order, bypassCountdown = false) => {
    if (!auth.currentUser) return;
    
    // Strict restriction: buyers can only confirm order when delivered
    const effectiveStatus = getEffectiveStatus(order);
    if (order.deliveryType === "delivery" && effectiveStatus !== "delivered") {
      alert("Order can only be confirmed once it has reached the Delivered stage.");
      return;
    }
    
    // Check if delivery countdown has elapsed
    if (!bypassCountdown && order.status === "Out For Delivery" && order.acceptedAt) {
      const acceptedTime = new Date(order.acceptedAt).getTime();
      const duration = (order.countdownDuration || 120) * 1000;
      const remainingMs = (acceptedTime + duration) - currentTime;
      if (remainingMs > 0) {
        alert("Please wait for the delivery countdown to finish before confirming.");
        return;
      }
    }

    setMarkingId(order.id);
    try {
      // 1. If Pay on Delivery and not paid yet, enforce strict sequence:
      // Delivery Confirmed -> Payment Required -> Payment Verified -> Completed
      if (order.paymentMethod === "pod" && order.paymentStatus !== "paid") {
        await updateDoc(doc(db, "orders", order.id), {
          status: "payment_required",
          buyerDeliveryConfirmed: true,
          buyerDeliveryConfirmedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        try {
          await fetch(`/api/orders/${order.id}/audit-event`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: order.id,
              eventType: "BUYER_DELIVERY_CONFIRMED",
              performedBy: auth.currentUser.uid,
              role: "buyer",
              actorName: order.buyerName || "Buyer",
              notes: "Buyer confirmed delivery receipt. Final payment settlement required to complete order.",
            }),
          });
        } catch (e) {}

        triggerPaystackPayment(order);
        setMarkingId(null);
        return;
      }

      // 2. Proceed directly to status update: 'Order Picked Up' or 'Order Delivered'
      const nextStatus = order.deliveryType === "pickup" ? "Order Picked Up" : "Order Delivered";
      await updateDoc(doc(db, "orders", order.id), {
        status: nextStatus,
        updatedAt: new Date().toISOString()
      });

      // 3. If it's unpaid, launch real Paystack checkout
      if (order.paymentStatus !== "paid") {
        triggerPaystackPayment(order);
        return;
      }

      // 4. If online paid, transition to Completed
      await processDeliveryConfirmation(order);
      setMarkingId(null);
    } catch (err) {
      console.error("Delivery confirmation error:", err);
      alert("An error occurred during delivery confirmation.");
      setMarkingId(null);
    }
  };

  const getPODCountdown = (order: Order) => {
    if (order.status !== "payment_required" && !(order.paymentMethod === "pod" && order.buyerDeliveryConfirmed && order.paymentStatus !== "paid")) return null;
    const baseTime = order.buyerDeliveryConfirmedAt || order.updatedAt || order.deliveredAt;
    if (!baseTime) return "30m 00s";
    const start = new Date(baseTime).getTime();
    const thirtyMins = 30 * 60 * 1000;
    const remaining = (start + thirtyMins) - currentTime;
    if (remaining <= 0) return "Settlement Window Overdue";
    const mins = Math.floor(remaining / (1000 * 60));
    const secs = Math.floor((remaining % (1000 * 60)) / 1000);
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  const handleConfirmDeliveryReceipt = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!verifyingOrder) return;

    // Strict restriction: buyers can only confirm order when delivered or ready for pickup
    const effectiveStatus = getEffectiveStatus(verifyingOrder);
    if (verifyingOrder.deliveryType === "delivery" && effectiveStatus !== "delivered") {
      setVerificationError("Order can only be confirmed once it has been delivered by the courier.");
      return;
    }

    setVerificationError(null);
    setConfirmingDelivery(true);
    try {
      const isPod = verifyingOrder.paymentMethod === "pod" && verifyingOrder.paymentStatus !== "paid";
      const now = new Date().toISOString();

      if (isPod) {
        // Next stage: Pay on Delivery Settlement
        const updatePayload: any = {
          status: "payment_required",
          buyerDeliveryConfirmed: true,
          buyerDeliveryConfirmedAt: now,
          deliveredAt: now,
          deliveryAttemptStatus: "success",
          updatedAt: now
        };
        try {
          await updateDoc(doc(db, "orders", verifyingOrder.id), updatePayload);
        } catch (dbErr) {
          console.warn("Direct Firestore update fallback error:", dbErr);
        }
        setOrders(prev => prev.map(o => o.id === verifyingOrder.id ? { ...o, ...updatePayload } : o));
        setShowIdVerification(false);
        const orderToTrigger = verifyingOrder;
        setVerifyingOrder(null);
        setProductIdInput("");
        triggerPaystackPayment(orderToTrigger);
      } else {
        // Next stage: Order Completed (Escrow Funds Released to Vendor)
        const updatePayload: any = {
          status: "completed",
          buyerDeliveryConfirmed: true,
          buyerDeliveryConfirmedAt: now,
          deliveredAt: now,
          completedAt: now,
          escrowStatus: "released",
          paymentStatus: "paid",
          deliveryAttemptStatus: "success",
          updatedAt: now
        };
        try {
          await updateDoc(doc(db, "orders", verifyingOrder.id), updatePayload);
        } catch (dbErr) {
          console.warn("Direct Firestore update fallback error:", dbErr);
        }
        setOrders(prev => prev.map(o => o.id === verifyingOrder.id ? { ...o, ...updatePayload } : o));
        await processDeliveryConfirmation(verifyingOrder);
        setShowIdVerification(false);
        setVerifyingOrder(null);
        setProductIdInput("");
      }
    } catch (err: any) {
      console.error("Delivery confirmation error:", err);
      setVerificationError(err.message || "An error occurred during delivery confirmation.");
    } finally {
      setConfirmingDelivery(false);
    }
  };

  const submitReview = async (order: Order) => {
    if (!auth.currentUser || !reviewComment.trim()) return;
    
    setSubmittingReview(true);
    try {
      await addDoc(collection(db, "reviews"), {
        orderId: order.id,
        productId: order.productId,
        buyerId: auth.currentUser.uid,
        buyerName: currentUser?.displayName || "Anonymous",
        rating: reviewRating,
        comment: reviewComment,
        createdAt: new Date().toISOString()
      });

      // Update product rating (simplified)
      const productRef = doc(db, "products", order.productId);
      const productSnap = await getDoc(productRef);
      if (productSnap.exists()) {
        const productData = productSnap.data();
        const currentRating = productData.rating || 0;
        const currentCount = productData.reviewCount || 0;
        const newCount = currentCount + 1;
        const newRating = ((currentRating * currentCount) + reviewRating) / newCount;
        
        await updateDoc(productRef, {
          rating: newRating,
          reviewCount: newCount
        });
      }

      await updateDoc(doc(db, "orders", order.id), {
        hasReviewed: true
      });

      const submittedRating = reviewRating;
      const submittedComment = reviewComment;
      const productName = order.productName;

      setReviewingOrderId(null);
      setReviewComment("");
      setReviewRating(5);

      setSubmittedReviewInfo({
        rating: submittedRating,
        comment: submittedComment,
        productName
      });
      setIsReviewSuccessOpen(true);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, "reviews");
    } finally {
      setSubmittingReview(false);
    }
  };

  const getComplaintCountdown = (order: Order) => {
    if (order.status !== "completed") return null;
    const isPaid = order.paymentStatus === "paid" || order.paymentMethod === "online";
    if (!isPaid) return null;
    
    const baseTime = order.deliveredAt || order.updatedAt || order.createdAt;
    if (!baseTime) return null;
    
    const deliveredAt = new Date(baseTime).getTime();
    const seventyTwoHours = 72 * 60 * 60 * 1000;
    const expiryTime = deliveredAt + seventyTwoHours;
    const remaining = expiryTime - currentTime;

    if (remaining <= 0) return "expired";

    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
    return `${hours}h ${minutes}m ${seconds}s left`;
  };

  const [currentUser, setCurrentUser] = React.useState<UserProfile | null>(null);

  React.useEffect(() => {
    if (!auth.currentUser) return;
    const unsub = onSnapshot(doc(db, "users", auth.currentUser.uid), (doc) => {
      if (doc.exists()) setCurrentUser(doc.data() as UserProfile);
    }, (error) => {
      console.error("OrderTracking user profile subscription failed:", error);
    });
    return () => unsub();
  }, []);

  const processDeliveryConfirmation = async (order: Order, paymentReference?: string) => {
    try {
      // Fetch product serial number if it's a good
      let serialNumber = order.serialNumber;
      if (!serialNumber) {
        try {
          const productDoc = await getDoc(doc(db, "products", order.productId));
          if (productDoc.exists()) {
            serialNumber = productDoc.data().serialNumber;
          }
        } catch (err) {
          console.error("Error fetching serial number:", err);
        }
      }

      const updateData: any = {
        status: "completed",
        deliveredAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        payoutStatus: "escrow",
        paymentStatus: "paid",
        serialNumber: serialNumber || "N/A"
      };

      if (paymentReference) {
        updateData.paymentReference = paymentReference;
      }

      await updateDoc(doc(db, "orders", order.id), updateData);

      // --- Referral Reward Logic ---
      if (order.buyerId && !order.referralCommissionAwarded) {
        try {
          const buyerSnap = await getDoc(doc(db, "users", order.buyerId));
          if (buyerSnap.exists()) {
            const buyerData = buyerSnap.data() as UserProfile;
            const referredBy = buyerData.referredBy;
            
            if (referredBy) {
              // Find referrer
              const referrersQ = query(collection(db, "users"), where("referralCode", "==", referredBy));
              const referrersSnap = await getDocs(referrersQ);
              
              if (!referrersSnap.empty) {
                const referrerDoc = referrersSnap.docs[0];
                const referrerId = referrerDoc.id;
                
                // Award 1.3% of the platform fee (using stored amount if available, otherwise fallback)
                const commissionRate = order.type === "service" ? 0.06 : 0.05;
                const rewardAmount = order.referralCommissionAmount !== undefined 
                  ? order.referralCommissionAmount 
                  : Math.floor((order.totalPrice * commissionRate) * 0.013);
                
                if (rewardAmount > 0) {
                  // 1. Create referral transaction
                  await addDoc(collection(db, "referralTransactions"), {
                    referrerId,
                    referredUserId: order.buyerId,
                    orderId: order.id,
                    amount: rewardAmount,
                    totalOrderValue: order.totalPrice,
                    status: "completed",
                    type: "referral_commission",
                    createdAt: new Date().toISOString()
                  });
                  
                  // 2. Update referrer stats
                  await updateDoc(referrerDoc.ref, {
                    referralEarnings: increment(rewardAmount),
                    referralWalletBalance: increment(rewardAmount)
                  });

                  // Update buyer status if it's their first purchase
                  if (!buyerData.hasMadePurchase) {
                     await updateDoc(doc(db, "users", order.buyerId), {
                       hasMadePurchase: true
                     });
                  }

                  // 3. Update order to mark referral commission as awarded
                  await updateDoc(doc(db, "orders", order.id), {
                    referralCommissionAwarded: true
                  });

                  // 4. Notify referrer
                  await addDoc(collection(db, "notifications"), {
                    userId: referrerId,
                    title: "Referral Commission Earned! 💸",
                    message: `A referral just made a purchase! You've earned ₦${rewardAmount.toLocaleString()} commission.`,
                    type: "referral",
                    isRead: false,
                    createdAt: new Date().toISOString()
                  });
                }
              }
            }
          }
        } catch (err) {
          console.error("Referral bonus error:", err);
        }
      }

      // Notify seller
      await addDoc(collection(db, "notifications"), {
        userId: order.sellerId,
        title: "Order Completed!",
        message: `The buyer has confirmed delivery and paid for ${order.productName}.`,
        type: "order",
        isRead: false,
        createdAt: new Date().toISOString()
      });

      // Notify buyer
      await addDoc(collection(db, "notifications"), {
        userId: auth.currentUser?.uid,
        title: "Order Success!",
        message: `You have successfully completed the order of ${order.productName}. Thank you for shopping!`,
        type: "order",
        isRead: false,
        createdAt: new Date().toISOString()
      });

      alert("Order completed! You can now leave a review for this product.");
      // We stay on the current tab so the user can see the status reflected as "completed"
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${order.id}`);
    } finally {
      setMarkingId(null);
    }
  };

  const getStatusIcon = (status: string, deliveryType?: string) => {
    switch (status) {
      case "awaiting_payment": return <Clock className="w-5 h-5 text-amber-500 animate-pulse" />;
      case "completed": return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case "delivered": return <Package className="w-5 h-5 text-emerald-500" />;
      case "acquired": return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case "cancelled": return <X className="w-5 h-5 text-red-500" />;
      case "payment_required": return <CreditCard className="w-5 h-5 text-amber-500 animate-pulse" />;
      case "out_for_delivery": return <MapPin className="w-5 h-5 text-orange-500 animate-bounce" />;
      case "transit": return <Truck className="w-5 h-5 text-purple-500 animate-pulse" />;
      case "logistics_pending": return <Clock className="w-5 h-5 text-amber-500 animate-pulse" />;
      case "logistics_booked": return <Truck className="w-5 h-5 text-indigo-500" />;
      case "ready_for_pickup": return <Package className="w-5 h-5 text-emerald-500" />;
      case "accepted": return <CheckCircle className="w-5 h-5 text-blue-500" />;
      case "pending": return <Clock className="w-5 h-5 text-indigo-500 animate-pulse" />;
      default: return <Package className="w-5 h-5 text-indigo-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "awaiting_payment": return "bg-amber-50 text-amber-600 animate-pulse border border-amber-200/50";
      case "completed": return "bg-emerald-50 text-emerald-600 border border-emerald-200/60";
      case "delivered": return "bg-emerald-50 text-emerald-600 font-bold border border-emerald-200";
      case "acquired": return "bg-emerald-100 text-emerald-700 font-bold";
      case "cancelled": return "bg-red-50 text-red-600 border border-red-200";
      case "payment_required": return "bg-amber-50 text-amber-600 font-bold border border-amber-200 animate-pulse";
      case "out_for_delivery": return "bg-orange-50 text-orange-600 font-bold border border-orange-200";
      case "transit": return "bg-purple-50 text-purple-600 font-bold border border-purple-200";
      case "logistics_pending": return "bg-amber-50 text-amber-600 font-bold border border-amber-200";
      case "logistics_booked": return "bg-indigo-50 text-indigo-600 font-bold border border-indigo-200";
      case "ready_for_pickup": return "bg-emerald-50 text-emerald-600 font-black animate-pulse border border-emerald-200/55";
      case "accepted": return "bg-blue-50 text-blue-600 border border-blue-200";
      case "pending": return "bg-indigo-50 text-indigo-600 border border-indigo-200";
      default: return "bg-indigo-50 text-indigo-600";
    }
  };

  const handleClearAll = async () => {
    setClearing(true);
    try {
      const promises = orders.map(order => 
        updateDoc(doc(db, "orders", order.id), { 
          hiddenFromHistory: true
        })
      );
      await Promise.all(promises);
      setShowClearConfirm(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, "orders/clear-all");
    } finally {
      setClearing(false);
    }
  };

  const cancelOrder = async (orderId: string, productId: string, sellerId: string, buyerName: string, productName: string, quantity: number) => {
    try {
      // 1. Update order - if it's a ticket, hide it from seller immediately
      const orderRef = doc(db, "orders", orderId);
      const isTicket = productName.toLowerCase().includes("ticket") || !!(await getDoc(orderRef)).data()?.ticketTierId;
      
      await updateDoc(orderRef, {
        status: "cancelled",
        cancelledAt: new Date().toISOString(),
        hiddenFromSeller: isTicket ? true : false
      });

      // 2. Restore stock
      const productRef = doc(db, "products", productId);
      await updateDoc(productRef, {
        stock: increment(quantity)
      });

      // 3. Notify seller about cancellation
      await addDoc(collection(db, "notifications"), {
        userId: sellerId,
        title: "Order Cancelled",
        message: `Buyer ${buyerName} cancelled their order for ${productName}.`,
        type: "order",
        isRead: false,
        createdAt: new Date().toISOString()
      });

      // 4. Stock alert check
      const productSnap = await getDoc(productRef);
      if (productSnap.exists()) {
        const newStock = productSnap.data().stock;
        if (newStock <= 0) {
          await addDoc(collection(db, "notifications"), {
            userId: sellerId,
            title: "Out of Stock!",
            message: `Your product ${productName} is now out of stock.`,
            type: "stock",
            isRead: false,
            createdAt: new Date().toISOString()
          });
        } else if (newStock <= 5) {
          await addDoc(collection(db, "notifications"), {
            userId: sellerId,
            title: "Low Stock Alert!",
            message: `Your product ${productName} has only ${newStock} left in stock.`,
            type: "stock",
            isRead: false,
            createdAt: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const handleClearIndividual = async (order: Order) => {
    const isActive = order.status !== "completed" && order.status !== "cancelled";
    
    if (isActive) {
      const isDispatched = [
        "out_for_delivery", "Out For Delivery",
        "transit", "In Transit", "Out To Pickup Station",
        "ready_for_pickup", "Ready For Pickup",
        "delivered", "Order Picked Up", "Order Delivered",
        "completed", "acquired"
      ].includes(order.status);

      if (isDispatched) {
        alert("This order is already out for delivery or ready for pickup, and cannot be cancelled.");
        return;
      }
      setOrderToClear(order);
      setShowSingleClearConfirm(true);
    } else {
      setClearing(true);
      try {
        await updateDoc(doc(db, "orders", order.id), { 
          hiddenFromHistory: true
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `orders/${order.id}`);
      } finally {
        setClearing(false);
      }
    }
  };

  const confirmSingleClear = async () => {
    if (!orderToClear) return;
    
    setClearing(true);
    try {
      // If it's active, cancel it first
      if (orderToClear.status !== "completed" && orderToClear.status !== "cancelled" && orderToClear.status !== "acquired") {
        await cancelOrder(
          orderToClear.id, 
          orderToClear.productId, 
          orderToClear.sellerId, 
          orderToClear.buyerName, 
          orderToClear.productName, 
          orderToClear.quantity
        );
      }
      
      // Then hide it for both if it's an event ticket
      const isTicket = !!orderToClear.ticketTierId;
      await updateDoc(doc(db, "orders", orderToClear.id), { 
        hiddenFromHistory: true,
        hiddenFromSeller: isTicket ? true : (orderToClear.hiddenFromSeller || false)
      });
      setShowSingleClearConfirm(false);
      setOrderToClear(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderToClear.id}`);
    } finally {
      setClearing(false);
    }
  };

  const getEffectiveStatus = (order: Order) => {
    const s = (order.status || "") as string;
    if (s === "cancelled") return "cancelled";
    if (s === "completed") return "completed";
    if (s === "payment_required" || s === "Payment Required") return "payment_required";
    if (s === "awaiting_payment") return "awaiting_payment";

    // 6. Delivered stage (Courier verified PIN and marked delivered)
    if (
      s === "delivered" ||
      s === "acquired" ||
      s === "Order Delivered" ||
      order.courierHandedOver ||
      order.deliveryStatus === "delivered" ||
      order.logisticsStatus === "delivered" ||
      (order.deliveryType === "pickup" && s === "Order Picked Up")
    ) {
      return "delivered";
    }

    // 5. Out For Delivery stage (Rider on the way / arrived at buyer's doorstep)
    if (
      s === "Out For Delivery" ||
      s === "out_for_delivery" ||
      order.deliveryStatus === "out_for_delivery" ||
      order.logisticsStatus === "out_for_delivery"
    ) {
      return "out_for_delivery";
    }

    // 4. In Transit stage (Courier accepted dispatch / rider moving en route to buyer)
    if (
      s === "In Transit" ||
      s === "transit" ||
      s === "in_transit" ||
      s === "picked_up" ||
      s === "Package Picked Up from Merchant" ||
      s === "Package Picked Up from Seller" ||
      s === "Handed Over to Logistics" ||
      s === "handed_over" ||
      order.deliveryStatus === "transit" ||
      order.deliveryStatus === "picked_up" ||
      order.logisticsStatus === "transit" ||
      order.logisticsStatus === "picked_up" ||
      (order.deliveryType === "delivery" && (
        order.logisticsOfferStatus === "accepted" ||
        Boolean(order.logisticsAcceptedAt) ||
        s === "Order Picked Up" ||
        s === "picked_up"
      ))
    ) {
      return "transit";
    }

    // Pickup station / store ready stage (ONLY FOR PICKUP ORDERS)
    if (
      order.deliveryType === "pickup" &&
      (s === "Ready For Pickup" || s === "Ready For Delivery" || s === "ready_for_pickup" || s === "Out To Pickup Station")
    ) {
      return "ready_for_pickup";
    }

    // 3. Logistics booked / pending courier acceptance
    if (
      order.deliveryType === "delivery" &&
      (
        order.logisticsOfferStatus === "pending" ||
        order.status === "logistics_pending" ||
        order.status === "logistics_booked" ||
        order.logisticsId ||
        order.logisticsName ||
        (order.kwikRiderId && order.kwikRiderId.length > 0)
      )
    ) {
      return "logistics_pending";
    }

    // 2. Seller accepted & packaging
    if (s === "accepted" || (order.deliveryType === "delivery" && (s === "Ready For Pickup" || s === "Ready For Delivery" || s === "ready_for_pickup"))) {
      return "accepted";
    }

    // 1. Pending seller acceptance
    if (s === "pending" || s === "Pending Seller Acceptance") {
      return "pending";
    }

    return s;
  };

  const getStatusHeadingInfo = (order: Order, effectiveStatus: string) => {
    const isPickup = order.deliveryType === "pickup";
    switch (effectiveStatus) {
      case "pending":
        return {
          title: "Order Placed",
          subtitle: "Order submitted to seller. Awaiting seller acceptance."
        };
      case "accepted":
        return {
          title: "Seller Accepted Order",
          subtitle: "Merchant accepted your order and is packaging the items."
        };
      case "logistics_pending":
        return {
          title: "Awaiting Logistics Acceptance",
          subtitle: order.logisticsName 
            ? `Booking request sent to ${order.logisticsName}. Awaiting courier acceptance.`
            : "Seller has sent a booking request to campus courier. Awaiting acceptance."
        };
      case "logistics_booked":
        return {
          title: "Campus Courier Booked",
          subtitle: order.logisticsName 
            ? `${order.logisticsName} assigned. Courier preparing for pickup from merchant.`
            : "Campus logistics partner booked. Awaiting dispatch pickup."
        };
      case "transit":
        return {
          title: isPickup ? "En Route to Station" : "On Transit",
          subtitle: isPickup 
            ? "Package is en route to your designated campus pickup station." 
            : order.logisticsName 
              ? `${order.logisticsName} accepted dispatch and is on transit with your order.`
              : "Logistics courier has accepted dispatch and is on transit with your order."
        };
      case "ready_for_pickup":
        return {
          title: "Ready for Pickup",
          subtitle: "Package has arrived at the pickup station. Ready for your collection."
        };
      case "out_for_delivery":
        return {
          title: isPickup ? "Ready at Station" : "Out For Delivery",
          subtitle: isPickup 
            ? "Package ready at designated pickup point."
            : "Rider has arrived at your doorstep! Share your 6-digit Delivery PIN with the courier."
        };
      case "delivered":
        return {
          title: isPickup ? "Package Collected" : "Order Delivered",
          subtitle: isPickup 
            ? "Handover confirmed. Please inspect your package and complete order."
            : "Handover verified by courier! Please confirm delivery to release escrow funds."
        };
      case "payment_required":
        return {
          title: "POD Payment Required",
          subtitle: "Package received! Please complete your Paystack payment to finalize escrow settlement."
        };
      case "awaiting_payment":
        return {
          title: "Awaiting Payment",
          subtitle: "Please complete payment to finalize your order."
        };
      case "completed":
        return {
          title: "Order Completed",
          subtitle: "Delivery confirmed and escrow funds released to merchant and courier."
        };
      case "cancelled":
        return {
          title: "Order Cancelled",
          subtitle: "This order was cancelled."
        };
      default:
        return {
          title: effectiveStatus.replace(/_/g, " "),
          subtitle: "Order progress update."
        };
    }
  };

  const formatRemainingTime = (order: Order) => {
    if ((order.status === "Out To Pickup Station" || order.status === "Out For Delivery" || order.status === "accepted") && order.acceptedAt) {
      const acceptedTime = new Date(order.acceptedAt).getTime();
      const duration = (order.countdownDuration || 120) * 1000;
      const remainingMs = (acceptedTime + duration) - currentTime;

      if (remainingMs <= 0) return "Ready to Confirm";
      
      const totalSeconds = Math.floor(remainingMs / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${minutes}m ${seconds}s left`;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="w-32 h-32 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-full flex items-center justify-center mb-8 shadow-inner">
          <ShoppingBag className="w-12 h-12 text-slate-200" />
        </div>
        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">No orders found</h3>
        <p className="text-slate-500 dark:text-slate-400 max-w-xs mb-8 font-medium">When you shop from the campus marketplace, you'll be able to track your delivery progress right here.</p>
        <button
          onClick={() => setActiveTab("market")}
          className="px-8 py-4 bg-brand-gradient text-white rounded-2xl font-bold text-lg shadow-lg shadow-purple-200 dark:shadow-purple-900/20 hover:shadow-purple-300 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          Explore Marketplace
          <Zap className="w-5 h-5 fill-current" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack || (() => setActiveTab("market"))}
            className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:scale-105 transition-all text-slate-600 dark:text-slate-400 group"
            title="Back to Market"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white font-display">My Orders</h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Track your purchases and delivery status</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {orders.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors uppercase tracking-wider"
            >
              <X className="w-4 h-4" />
              Clear All
            </button>
          )}
          <div className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mr-2">Total Orders:</span>
            <span className="text-sm font-black text-slate-900 dark:text-white">{orders.length}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {orders.map((order, oIdx) => {
          const effectiveStatus = getEffectiveStatus(order);
          const remainingTime = formatRemainingTime(order);
          const deliveryPin = getOrderDeliveryPin(order);
          
          return (
            <motion.div
              key={`order-tracking-${order.id}-${oIdx}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-md transition-all"
            >
              <div className="p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                  <div className="flex items-center gap-4">
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", getStatusColor(effectiveStatus))}>
                      {getStatusIcon(effectiveStatus, order.deliveryType)}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1">
                        {order.sellerName ? `Merchant: ${order.sellerName}` : (order.deliveryType === "pickup" ? "Self Pickup Station" : "Campus Direct Delivery")}
                      </p>
                      {(() => {
                        const heading = getStatusHeadingInfo(order, effectiveStatus);
                        return (
                          <div className="flex flex-col">
                            <h4 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                              <span>{heading.title}</span>
                              {order.deliveryTime && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 lowercase">
                                  est: {order.deliveryTime} {Number(order.deliveryTime) === 1 ? (order.deliveryTimeUnit?.toLowerCase().startsWith('hour') ? 'hour' : 'day') : (order.deliveryTimeUnit || 'days')}
                                </span>
                              )}
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium leading-relaxed">
                              {heading.subtitle}
                            </p>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn(
                    "px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-2",
                    order.deliveryType === "delivery" ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  )}>
                    {order.deliveryType === "delivery" ? <Truck className="w-3 h-3" /> : <Package className="w-3 h-3" />}
                    {order.deliveryType}
                  </span>
                  <span className={cn(
                    "px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-2",
                    (order.paymentStatus === "paid" || order.paymentMethod === "online") ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400" : "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
                  )}>
                    {(order.paymentStatus === "paid" || order.paymentMethod === "online") ? <CreditCard className="w-3 h-3" /> : <Wallet className="w-3 h-3" />}
                    {(order.paymentStatus === "paid" || order.paymentMethod === "online") ? "Paid Online (In Escrow)" : "Pay on Delivery (Unpaid)"}
                  </span>
                  <button
                    onClick={() => handleClearIndividual(order)}
                    disabled={clearing}
                    className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-red-500 disabled:opacity-50"
                    title="Clear/Cancel Order"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Protection & Review Section */}
              {(effectiveStatus === "completed") && (
                <div className="px-6 sm:px-8 pb-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Complaint/Support Window */}
                    <div className={cn(
                      "rounded-[2rem] p-6 border transition-all",
                      (order.paymentStatus === "paid" || order.paymentMethod === "online") && getComplaintCountdown(order) !== "expired" 
                        ? "bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/20 shadow-lg shadow-amber-500/5" 
                        : "bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800"
                    )}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center",
                            (order.paymentStatus === "paid" || order.paymentMethod === "online") && getComplaintCountdown(order) !== "expired" ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-400"
                          )}>
                            <ShieldCheck className="w-5 h-5" />
                          </div>
                          <div>
                            <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-900 dark:text-white">Active Buyer Protection</h5>
                            <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                              {(order.paymentStatus === "paid" || order.paymentMethod === "online") ? "72h Escrow Inspection Window" : "Payment Required for Escrow"}
                            </p>
                          </div>
                        </div>
                        {!(order.paymentStatus === "paid" || order.paymentMethod === "online") ? (
                          <div className="px-2.5 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full text-[8px] font-black uppercase tracking-wider">
                            Unpaid Order
                          </div>
                        ) : getComplaintCountdown(order) !== "expired" ? (
                          <div className="flex flex-col items-end">
                            <div className="flex items-center gap-1.5 text-[10px] font-black text-amber-600 animate-pulse">
                              <div className="w-2 h-2 bg-amber-500 rounded-full" />
                              {getComplaintCountdown(order)}
                            </div>
                            <span className="text-[8px] font-bold text-amber-500/50 uppercase tracking-widest">Countdown Active</span>
                          </div>
                        ) : (
                          <div className="px-3 py-1 bg-slate-200 dark:bg-slate-800 text-slate-500 rounded-full text-[8px] font-black uppercase tracking-widest">
                            72h Window Expired
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-4">
                        <div className="p-4 bg-white/70 dark:bg-slate-900/50 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 space-y-3">
                           <div className="space-y-2">
                             <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                               <span className="font-black text-slate-900 dark:text-white uppercase mr-1">Term 2.1:</span> You have <strong>72 hours</strong> from delivery to inspect your order and raise a dispute if there are issues.
                             </p>
                             <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                               <span className="font-black text-slate-900 dark:text-white uppercase mr-1">Term 2.3:</span> If no dispute is raised for 72 hours, SHOPIVERSITY marks the order final and pays the seller.
                             </p>
                             {/* Off-platform payment implication point */}
                             <div className="p-2.5 bg-red-50 dark:bg-red-950/30 border border-red-200/70 dark:border-red-900/40 rounded-xl text-[10px] text-red-700 dark:text-red-300 font-medium leading-relaxed">
                               <span className="font-black uppercase mr-1">Term 7.2 & 1.4 (Off-Platform Payment Risk):</span> Never pay sellers or couriers outside the SHOPIVERSITY app (e.g. personal cash or direct transfers). Paying outside completely voids Escrow Protection and forfeits your 72-hour refund eligibility.
                             </div>
                           </div>
                           <div className="flex items-center gap-2 text-[9px] text-amber-600/80 font-bold italic border-t border-amber-100/50 pt-2">
                              <Info className="w-3 h-3 shrink-0" />
                              Governed by SHOPIVERSITY 72-Hour Escrow & Security Rules
                           </div>
                        </div>

                        {(order.paymentStatus === "paid" || order.paymentMethod === "online") && getComplaintCountdown(order) !== "expired" && (!order.disputeStatus || order.disputeStatus === "none") && (
                          <button
                            onClick={() => setDisputeModalOrder(order)}
                            className="w-full h-12 bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl shadow-amber-500/10 cursor-pointer"
                          >
                            <AlertCircle className="w-4 h-4" />
                            Report a Problem (Raise Dispute)
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Review Section */}
                    <div className="bg-purple-50/30 dark:bg-purple-900/5 rounded-2xl p-5 border border-purple-100/50 dark:border-purple-900/20">
                      <div className="flex items-center gap-2 mb-3">
                        <Star className="w-4 h-4 text-purple-600" />
                        <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Share your Experience</h5>
                      </div>
                      
                      {order.hasReviewed ? (
                        <div className="h-full flex flex-col items-center justify-center py-4 text-center">
                          <CheckCircle className="w-8 h-8 text-emerald-500 mb-2" />
                          <p className="text-xs font-bold text-slate-500">Review Submitted</p>
                        </div>
                      ) : reviewingOrderId === order.id ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-center gap-1">
                            {[1, 2, 3, 4, 5].map((star, sIdx) => (
                              <button
                                key={`rate-star-${star}-${sIdx}`}
                                onClick={() => setReviewRating(star)}
                                className="p-1"
                              >
                                <Star
                                  className={cn(
                                    "w-6 h-6 transition-all",
                                    star <= reviewRating 
                                      ? "fill-purple-600 text-purple-600 scale-110" 
                                      : "text-slate-300 dark:text-slate-700"
                                  )}
                                />
                              </button>
                            ))}
                          </div>
                          <textarea
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            placeholder="How was the product and delivery?"
                            className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-purple-500 resize-none h-20"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => submitReview(order)}
                              disabled={submittingReview || !reviewComment.trim()}
                              className="flex-1 py-2 bg-purple-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all hover:bg-purple-700 disabled:opacity-50"
                            >
                              {submittingReview ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Submit Review"}
                            </button>
                            <button
                              onClick={() => setReviewingOrderId(null)}
                              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl font-bold text-[10px] uppercase tracking-widest"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <p className="text-[11px] text-slate-500 font-medium leading-relaxed italic">
                            Your feedback helps other students find the best sellers on campus!
                          </p>
                          <button
                            onClick={() => setReviewingOrderId(order.id)}
                            className="w-full py-2.5 bg-purple-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-purple-200 dark:shadow-none hover:bg-purple-700 transition-all flex items-center justify-center gap-2"
                          >
                            <Star className="w-3.5 h-3.5 fill-current" />
                            Leave a Review
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col lg:flex-row gap-8 p-6 sm:p-8 pt-0">
                <div className="flex-1 space-y-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="w-full sm:w-20 h-40 sm:h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0">
                      <img 
                        src={order.productImageUrl || `https://picsum.photos/seed/${order.productId}/200/200`} 
                        alt={order.productName}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-900 dark:text-white mb-1 text-lg">{order.productName}</h5>
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Quantity: <span className="font-bold text-slate-900 dark:text-white">{order.quantity}</span>
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-lg font-black text-indigo-600">₦{order.totalPrice.toLocaleString()}</p>
                          {order.deliveryType === "delivery" && (
                            order.deliveryFee && order.deliveryFee > 0 ? (
                              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                                Includes ₦{order.deliveryFee.toLocaleString()} Delivery
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/40 px-2 py-0.5 rounded-full">
                                Delivery Fee Pending Booking
                              </span>
                            )
                          )}
                        </div>
                      </div>
                      {order.menuItemName && (
                        <p className="text-xs font-bold text-slate-400 mb-2">
                          Package Plan: <span className="text-indigo-600 dark:text-indigo-400 capitalize">{order.menuItemName}</span>
                        </p>
                      )}
                      {order.formResponses?.target && (
                        <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-100 dark:border-yellow-900/30 rounded-xl w-max max-w-full">
                          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Target Account / Phone Number</p>
                          <p className="text-sm font-black font-mono text-slate-950 dark:text-white select-all">{order.formResponses.target}</p>
                        </div>
                      )}

                      {/* CheapDataHub Topup Status Tracking (for subscription orders) */}
                      {order.cheapDataHubPlanId && (
                        <div className="mt-3 p-4 bg-indigo-50/40 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100/30 dark:border-indigo-900/40 max-w-md">
                          <p className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                            <Zap className="w-3.5 h-3.5 animate-pulse" />
                            VTU Delivery Tracker
                          </p>
                          {order.topUpStatus === "success" ? (
                            <div className="space-y-1 bg-emerald-50 dark:bg-emerald-900/10 p-2.5 rounded-xl border border-emerald-100/40 dark:border-emerald-900/20 text-emerald-800 dark:text-emerald-300">
                              <p className="text-xs font-bold font-display">🎉 Top-up successful!</p>
                              <p className="text-[10px] text-slate-500 font-medium">Your data plan package has been credited to your line. Ref: <span className="font-mono font-bold text-slate-800 dark:text-slate-100 select-all">{order.topUpTransactionId}</span></p>
                            </div>
                          ) : order.topUpStatus === "processing" ? (
                            <div className="space-y-1 bg-amber-50 dark:bg-amber-900/10 p-2.5 rounded-xl border border-amber-100/40 dark:border-amber-900/20 text-amber-800 dark:text-amber-300 animate-pulse">
                              <p className="text-xs font-bold">⚡ Crediting network line...</p>
                              <p className="text-[10px] font-medium">Auto-dispatching data plan via CheapDataHub. This takes less than 2 minutes.</p>
                            </div>
                          ) : order.topUpStatus === "failed" ? (
                            <div className="space-y-1 bg-red-50 dark:bg-red-900/10 p-2.5 rounded-xl border border-red-100/40 dark:border-red-900/20 text-red-800 dark:text-red-300">
                              <p className="text-xs font-bold">⚠️ Automatic Delivery Interrupted</p>
                              <p className="text-[10px] font-medium text-slate-500">The automatic VTU pipeline had an error. The seller has been notified to process manually. Logs: {order.topUpError}</p>
                            </div>
                          ) : (
                            <div className="space-y-1 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl text-slate-600 dark:text-slate-400">
                              <p className="text-[11px] font-bold">⏳ Preparing Dispatch</p>
                              <p className="text-[10px] font-medium">Awaiting merchant automated VTU initiation...</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Campus Dispatch & Courier Tracker */}
                      {(order.kwikRiderId || order.logisticsId || order.logisticsName) && 
                       (order.status === "Out For Delivery" || order.status === "out_for_delivery" || order.status === "transit" || order.status === "In Transit" || order.status === "accepted" || order.status === "Order Delivered" || order.status === "Order Picked Up") && (
                        <div className="mt-3 p-4 bg-orange-50/40 dark:bg-orange-950/20 rounded-2xl border border-orange-100 dark:border-orange-900/40 max-w-md space-y-2">
                          <p className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest flex items-center gap-1.5">
                            <Truck className="w-3.5 h-3.5" />
                            {order.logisticsName || (order.kwikRiderId?.startsWith("CAMPUS-") ? "Campus Logistics Tracker" : "Outsourced Courier Tracker")}
                          </p>
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              {order.logisticsName 
                                ? `🏍️ ${order.logisticsName} Assigned` 
                                : order.kwikRiderId?.startsWith("CAMPUS-") 
                                  ? `🏍️ ${order.kwikRiderId.replace("CAMPUS-", "").replace(/-/g, " ")} Dispatched`
                                  : order.kwikRiderId?.startsWith("OUTSOURCED-") 
                                    ? `🚚 External Courier: ${order.kwikRiderId.replace("OUTSOURCED-", "").replace(/-/g, " ")}`
                                    : "🏍️ Dispatch Rider On the Way"
                              }
                            </p>
                            {(order.logisticsPhone || order.kwikRiderId) && (
                              <p className="text-[10px] text-slate-500 font-medium">
                                {order.logisticsPhone ? (
                                  <>Courier Contact: <a href={`tel:${order.logisticsPhone}`} className="font-mono font-bold text-slate-900 dark:text-slate-100 hover:underline select-all">{order.logisticsPhone}</a></>
                                ) : (
                                  <>Carrier Reference: <span className="font-mono font-bold text-slate-900 dark:text-slate-100 select-all">{order.kwikRiderId?.startsWith("CAMPUS-") ? order.kwikRiderId.replace("CAMPUS-", "") : order.kwikRiderId?.startsWith("OUTSOURCED-") ? order.kwikRiderId.replace("OUTSOURCED-", "") : order.kwikRiderId}</span></>
                                )}
                              </p>
                            )}
                            {order.deliveredWorkNotes && (
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 bg-white/40 dark:bg-slate-900/30 p-2 rounded-xl mt-1.5 italic">
                                {order.deliveredWorkNotes}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-slate-50 dark:border-slate-800">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 text-center sm:text-left">Order Date</p>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300 text-center sm:text-left">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 text-center sm:text-left">
                        {order.deliveryType === "pickup" ? "Expected Pickup" : "Courier Delivery Timeline"}
                      </p>
                      <div className="text-sm font-bold text-slate-700 dark:text-slate-300 text-center sm:text-left">
                        {order.deliveryType === "pickup" ? (
                          order.deliveryTime ? `${order.deliveryTime} ${Number(order.deliveryTime) === 1 ? (order.deliveryTimeUnit?.toLowerCase().startsWith('hour') ? 'hour' : order.deliveryTimeUnit?.toLowerCase().startsWith('week') ? 'week' : 'day') : (order.deliveryTimeUnit || 'days')}` : "Ready after merchant confirmation"
                        ) : (
                          // Delivery Order: Hide timeline until logistics service accepts
                          (order.logisticsOfferStatus === "accepted" || order.status === "out_for_delivery" || order.status === "Out For Delivery" || order.status === "transit" || order.status === "delivered" || order.status === "completed") ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                              {order.logisticsEstimatedDeliveryTimeline || (order.deliveryTime ? `${order.deliveryTime} ${Number(order.deliveryTime) === 1 ? (order.deliveryTimeUnit?.toLowerCase().startsWith('hour') ? 'hour' : order.deliveryTimeUnit?.toLowerCase().startsWith('week') ? 'week' : 'day') : (order.deliveryTimeUnit || 'days')}` : "Campus Courier (1-3 Hours)")}
                            </span>
                          ) : (
                            <span className="text-amber-600 dark:text-amber-400 font-semibold text-xs inline-flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 animate-pulse" />
                              Awaiting Logistics Acceptance
                            </span>
                          )
                        )}
                      </div>
                      {order.logisticsName && (order.logisticsOfferStatus === "accepted" || effectiveStatus === "transit" || effectiveStatus === "out_for_delivery") && (
                        <p className="text-[10px] text-purple-600 dark:text-purple-400 font-bold mt-1 text-center sm:text-left flex items-center justify-center sm:justify-start gap-1">
                          <Truck className="w-3 h-3 text-purple-500 animate-pulse" />
                          <span>{order.logisticsName} {order.logisticsPhone ? `(${order.logisticsPhone})` : ""} • On Transit</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Buyer's 6-Digit Handover PIN Display */}
                  {order.status !== "completed" && order.status !== "cancelled" && (
                    <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-emerald-950/40 border-2 border-emerald-300 dark:border-emerald-700/80 rounded-2xl shadow-xs space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-sm shrink-0">
                            <KeyRound className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h5 className="text-xs sm:text-sm font-black uppercase tracking-wider text-emerald-900 dark:text-emerald-200">
                                Buyer's 6-Digit Delivery PIN
                              </h5>
                              <span className="px-2 py-0.5 bg-emerald-200/80 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-300 rounded-full text-[10px] font-black uppercase tracking-wider">
                                {order.deliveryType === "pickup" ? "Pickup Code" : "Handover PIN"}
                              </span>
                            </div>
                            <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                              {order.deliveryType === "pickup" 
                                ? "Present this 6-digit PIN at the pickup station to collect your package"
                                : "Provide this 6-digit PIN to the logistics courier when they hand over your package"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-3 shadow-inner">
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                            Your 6-Digit Confirmation PIN
                          </p>
                          <p className="text-2xl sm:text-3xl font-black font-mono tracking-[0.2em] text-emerald-600 dark:text-emerald-400 select-all">
                            {deliveryPin}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(deliveryPin);
                            alert(`Delivery PIN ${deliveryPin} copied to clipboard!`);
                          }}
                          className="px-4 py-2 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/50 dark:hover:bg-emerald-800/60 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy PIN</span>
                        </button>
                      </div>

                      <div className="flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-400 bg-white/60 dark:bg-slate-900/60 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span>
                          <strong>Delivery Handover Security:</strong> The logistics courier must enter this 6-digit PIN to confirm package handover to you. Only share this PIN after you receive and inspect your package in person.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Refund Status Card */}
                  {order.refundStatus && order.refundStatus !== "none" && (
                    <div className="p-4 bg-amber-50/80 dark:bg-amber-950/25 border border-amber-200 dark:border-amber-900/40 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                            Refund Status: <span className="capitalize">{order.refundStatus.replace(/_/g, " ")}</span>
                          </span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 uppercase tracking-wide">
                          1.5% Fee Deducted
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs pt-1">
                        <div>
                          <p className="text-[9px] text-slate-500 font-bold uppercase">Requested</p>
                          <p className="font-semibold text-slate-900 dark:text-white">₦{(order.refundAmount || order.totalPrice).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-500 font-bold uppercase">Fee (1.5%)</p>
                          <p className="font-semibold text-red-600">-₦{(order.refundFee || Math.round((order.refundAmount || order.totalPrice) * 0.015)).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-500 font-bold uppercase">Net Refund</p>
                          <p className="font-bold text-emerald-600 dark:text-emerald-400">
                            ₦{(order.netRefundAmount || (order.refundAmount || order.totalPrice) - Math.round((order.refundAmount || order.totalPrice) * 0.015)).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {order.refundReason && (
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 italic bg-white/60 dark:bg-slate-900/60 p-2 rounded-lg border border-amber-100 dark:border-amber-900/30">
                          Reason: {order.refundReason}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Delivery Attempt & Failure Notice UI */}
                  {order.deliveryAttemptStatus === "failed" && (
                    <div className="p-4 bg-red-50/90 dark:bg-red-950/30 border-2 border-red-300 dark:border-red-800/60 rounded-2xl space-y-2.5 animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                          <span className="text-xs font-black text-red-900 dark:text-red-200 uppercase tracking-wide">
                            Delivery Attempt Unsuccessful
                          </span>
                        </div>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300 uppercase tracking-wider">
                          Courier Log
                        </span>
                      </div>
                      <div className="p-3 bg-white/70 dark:bg-slate-900/70 rounded-xl border border-red-200 dark:border-red-900/40 text-xs space-y-1.5">
                        <div className="flex justify-between text-slate-700 dark:text-slate-300">
                          <span className="font-semibold text-slate-500">Reported Reason:</span>
                          <span className="font-bold text-red-700 dark:text-red-400">
                            {order.deliveryAttemptReason === "buyer_unavailable" ? "Recipient Unavailable at Hostel / Address" :
                             order.deliveryAttemptReason === "incorrect_address" ? "Incorrect / Incomplete Campus Address" :
                             order.deliveryAttemptReason === "buyer_refused" ? "Recipient Refused Package" :
                             order.deliveryAttemptReason === "logistics_issue" ? "Courier In-Transit Delay / Vehicle Issue" :
                             (order.deliveryAttemptReason || "Delivery Attempt Delayed")}
                          </span>
                        </div>
                        {order.lastDeliveryAttemptAt && (
                          <div className="flex justify-between text-slate-500 text-[11px]">
                            <span>Attempt Time:</span>
                            <span className="font-mono">{new Date(order.lastDeliveryAttemptAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(order.lastDeliveryAttemptAt).toLocaleDateString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-slate-700 dark:text-slate-300 pt-1 border-t border-slate-100 dark:border-slate-800">
                          <span className="font-semibold text-slate-500">Resolution:</span>
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">
                            {order.deliveryAttemptResolution === "return_to_seller" ? "Returning Package to Merchant" :
                             order.deliveryAttemptResolution === "dispute_required" ? "Escalated to SHOPIVERSITY Support" :
                             "Rescheduled for Next Campus Delivery Run"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* POD Active Payment Window Banner */}
                  {(order.status === "payment_required" || (order.paymentMethod === "pod" && order.buyerDeliveryConfirmed && order.paymentStatus !== "paid")) && (
                    <div className="p-4 bg-gradient-to-r from-amber-50 to-amber-100/70 dark:from-amber-950/40 dark:to-amber-900/30 border-2 border-amber-300 dark:border-amber-700/60 rounded-2xl space-y-3 animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 animate-bounce" />
                          <span className="text-xs font-black text-amber-900 dark:text-amber-200 uppercase tracking-wide">
                            Active Pay on Delivery Window
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-200 dark:bg-amber-800/70 text-amber-900 dark:text-amber-100 font-mono text-[11px] font-black">
                          <Clock className="w-3 h-3 text-amber-700 dark:text-amber-300 animate-spin" />
                          <span>{getPODCountdown(order)}</span>
                        </div>
                      </div>
                      <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed font-medium">
                        📦 Handover confirmed! Pay on Delivery escrow policy requires electronic settlement via Paystack to release final verified receipts and credit vendor balance.
                      </p>
                      <button
                        onClick={() => triggerPaystackPayment(order)}
                        disabled={isVerifyingPayment}
                        className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs tracking-wider transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
                      >
                        {isVerifyingPayment ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CreditCard className="w-4 h-4" />
                        )}
                        PAY VIA PAYSTACK (₦{order.totalPrice.toLocaleString()})
                      </button>
                    </div>
                  )}
                </div>

                <div className="w-full lg:w-72 space-y-6">
                  <div className="p-5 bg-indigo-50/30 dark:bg-indigo-900/5 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/20">
                    <div className="flex items-center gap-3 mb-3">
                      <MapPin className="w-4 h-4 text-indigo-500" />
                      <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Delivery Info</p>
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                      <p className="font-bold text-slate-900 dark:text-white">{order.buyerName}</p>
                      <p className="text-xs">{order.buyerPhone}</p>
                      <p className="text-xs italic bg-white/50 dark:bg-slate-900/50 p-2 rounded-lg mt-2 border border-slate-100 dark:border-slate-800">
                        {order.deliveryAddress || "No address provided"}
                      </p>
                    </div>
                  </div>

                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-100 dark:bg-slate-800" />
                    <div className="space-y-6 relative">
                      {(() => {
                        const isPickup = order.deliveryType === "pickup";
                        const isPod = order.paymentMethod === "pod";

                        let stepList: { key: string; label: string; desc: string; actor: string; icon: any }[] = [];

                        if (isPickup) {
                          // Pickup Flow
                          stepList = [
                            { key: "pending", label: "Order Placed", desc: "Order submitted to merchant", actor: "Buyer", icon: Clock },
                            { key: "accepted", label: "Seller Accepted", desc: "Merchant accepted & packaging item", actor: "Seller", icon: CheckCircle },
                            { key: "ready_for_pickup", label: "Ready at Store / Station", desc: "Awaiting your physical collection", actor: "Station", icon: Package },
                            { key: "delivered", label: "Package Handover Verified", desc: "PIN verified at store/station", actor: "Buyer", icon: Package },
                            ...(isPod ? [{ key: "payment_required", label: "Pay on Delivery Settlement", desc: "Paystack electronic payment", actor: "Buyer", icon: CreditCard }] : []),
                            { key: "completed", label: "Order Completed", desc: "Escrow funds released to vendor", actor: "Escrow", icon: CheckCircle }
                          ];
                        } else {
                          // Home / Campus Delivery Flow (Full Courier Logistics Handshake)
                          const isLogisticsPending = effectiveStatus === "logistics_pending";
                          stepList = [
                            { key: "pending", label: "Order Placed", desc: "Order sent to seller", actor: "Buyer", icon: Clock },
                            { key: "accepted", label: "Seller Accepted", desc: "Merchant accepted & packaging items", actor: "Seller", icon: CheckCircle },
                            { 
                              key: "logistics_booked", 
                              label: isLogisticsPending ? "Awaiting Courier Acceptance" : "Logistics Courier Booked", 
                              desc: isLogisticsPending 
                                ? (order.logisticsName ? `Offer sent to ${order.logisticsName}` : "Booking sent to logistics partner")
                                : (order.logisticsName ? `${order.logisticsName} assigned` : "Logistics courier assigned"), 
                              actor: "Seller ➔ Courier", 
                              icon: Truck 
                            },
                            { 
                              key: "transit", 
                              label: "On Transit", 
                              desc: order.logisticsName ? `${order.logisticsName} accepted dispatch & is on transit` : "Courier accepted dispatch and is on transit", 
                              actor: "Courier", 
                              icon: Truck 
                            },
                            { key: "out_for_delivery", label: "Out For Delivery", desc: "Rider arrived at campus doorstep", actor: "Courier", icon: MapPin },
                            { key: "delivered", label: "Order Delivered", desc: "Delivery PIN verified by courier", actor: "Courier ➔ Buyer", icon: Package },
                            ...(isPod ? [{ key: "payment_required", label: "Pay on Delivery Settlement", desc: "Paystack electronic escrow settlement", actor: "Buyer", icon: CreditCard }] : []),
                            { key: "completed", label: "Order Completed", desc: "Escrow funds released to vendor & courier", actor: "Escrow", icon: CheckCircle }
                          ];
                        }

                        return stepList.map((step, index, array) => {
                          const statuses = array.map(s => s.key);
                          const normalizedStatus = effectiveStatus === "logistics_pending" ? "logistics_booked" : effectiveStatus;
                          const currentIndex = statuses.indexOf(normalizedStatus);
                          const isCompleted = index <= currentIndex && order.status !== "cancelled";
                          const isCurrent = index === currentIndex;
                          
                          let stepColor = "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500";
                          if (isCompleted) {
                            if (step.key === "pending") stepColor = "bg-indigo-600 text-white shadow-md shadow-indigo-600/20";
                            else if (step.key === "accepted") stepColor = "bg-blue-600 text-white shadow-md shadow-blue-600/20";
                            else if (step.key === "logistics_booked") stepColor = "bg-indigo-500 text-white shadow-md shadow-indigo-500/20";
                            else if (step.key === "transit") stepColor = "bg-purple-600 text-white shadow-md shadow-purple-600/20";
                            else if (step.key === "out_for_delivery") stepColor = "bg-orange-600 text-white shadow-md shadow-orange-600/20";
                            else if (step.key === "payment_required") stepColor = "bg-amber-600 text-white shadow-md shadow-amber-600/20";
                            else stepColor = "bg-emerald-600 text-white shadow-md shadow-emerald-600/20";
                          }
                          
                          return (
                            <div key={`order-step-${step.key}-${index}`} className="flex items-start gap-4">
                              <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center z-10 shrink-0 transition-all duration-300",
                                stepColor,
                                isCurrent && "ring-4 ring-indigo-100 dark:ring-indigo-900/40 scale-110"
                              )}>
                                <step.icon className={cn("w-4 h-4", isCurrent && (step.key === "transit" || step.key === "pending") && "animate-pulse")} />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={cn(
                                    "text-xs font-bold transition-colors",
                                    isCompleted ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-500"
                                  )}>
                                    {step.label}
                                  </span>
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    {step.actor}
                                  </span>
                                  {isCurrent && (
                                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                                      ● Active Stage
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                  {step.desc}
                                </p>
                              </div>
                            </div>
                          );
                        });
                      })()}
                      
                      {order.status === "cancelled" && (
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center z-10">
                            <X className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-bold text-red-600">Order Cancelled</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {order.status === "completed" && (
                    <div className="space-y-3 mt-2">
                      {order.serialNumber && (
                        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-800/30 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-brand-gradient rounded-lg flex items-center justify-center text-white">
                              <ShieldCheck className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Product Serial Number</p>
                              <p className="text-sm font-mono font-bold text-slate-900 dark:text-white">{order.serialNumber}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(order.serialNumber!);
                              alert("Serial number copied to clipboard!");
                            }}
                            className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                            title="Copy Serial Number"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      <div className="p-5 bg-stone-50 dark:bg-slate-800/40 rounded-3xl border border-stone-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center text-emerald-700">
                            <CheckCircle className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[10px] text-stone-500 uppercase font-black tracking-widest leading-none mb-1">Receipt Issued</p>
                            <h5 className="text-xs font-bold text-slate-800 dark:text-white">Official Thermal Receipt Available</h5>
                            <p className="text-[9px] text-indigo-600 font-bold uppercase font-sans tracking-wide mt-0.5">
                              [Term 9.5] Verified Escrow Receipt
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setSelectedReceiptOrder(order)}
                          className="px-5 py-3 bg-slate-950 text-white dark:bg-amber-500 dark:text-slate-950 font-sans font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-md"
                        >
                          📄 View Official Receipt
                        </button>
                      </div>
                    </div>
                  )}

                  {order.status !== "completed" && order.status !== "cancelled" && (
                    <div className="flex flex-col gap-3">
                      {/* Countdown widgets for Out To Pickup Station and Out For Delivery states */}
                      {(order.status === "Out To Pickup Station" || order.status === "Out For Delivery" || order.status === "accepted") && remainingTime && remainingTime !== "Ready to Confirm" && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl mb-1">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">
                              {order.deliveryType === "pickup" ? "Pickup Station Countdown" : "Arrival Countdown"}
                            </span>
                            <span className="text-xs font-mono font-black text-blue-600 animate-pulse">
                              {remainingTime}
                            </span>
                          </div>
                        </div>
                      )}

                      {order.status === "Ready For Pickup" && (
                        <div className="p-3 bg-emerald-50 dark:bg-[#10b981]/10 border border-emerald-100 dark:border-[#10b981]/25 rounded-xl mb-1">
                          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Ready for Pickup</p>
                          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-1">Please meet the seller to pickup your order! No verification code needed.</p>
                        </div>
                      )}

                      {/* Action buttons mapped cleanly by effectiveStatus lifecycle */}
                      {order.status === "completed" ? null : (order.type === "service" && order.paymentMethod === "physical") ? (
                        <div className="space-y-2 animate-in fade-in duration-300">
                          {order.location && (
                            <div className="p-3 bg-zinc-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                              <Building className="w-4 h-4 text-purple-500 shrink-0" />
                              <span>Service Location: <strong>{order.location}</strong></span>
                            </div>
                          )}
                          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/25 border border-indigo-100 dark:border-indigo-900/40 rounded-xl text-xs font-medium text-indigo-800 dark:text-indigo-400">
                            Service is set to Physical Payment. Once the service has been completed, please click <strong>Service Done</strong> below to complete on-app secure payment.
                          </div>
                          <button
                            onClick={() => {
                              setOrderToPay(order);
                            }}
                            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm tracking-wide transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Service Done
                          </button>
                        </div>
                      ) : effectiveStatus === "awaiting_payment" ? (
                        <div className="space-y-2 animate-in fade-in duration-305">
                          <div className="p-3 bg-amber-50 dark:bg-amber-900/25 border border-amber-100 dark:border-amber-900/40 rounded-xl text-xs font-medium text-amber-800 dark:text-amber-400">
                            Service completed by vendor! Please finalize your secure online escrow payment on the app now.
                          </div>
                          <button
                            onClick={() => triggerPaystackPayment(order)}
                            disabled={isVerifyingPayment}
                            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm tracking-wide transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                          >
                            {isVerifyingPayment ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <CreditCard className="w-4 h-4" />
                            )}
                            Pay For Service via Paystack (₦{order.totalPrice.toLocaleString()})
                          </button>
                        </div>
                      ) : effectiveStatus === "pending" ? (
                        <button
                          disabled={true}
                          className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 cursor-not-allowed border border-slate-200/50 dark:border-slate-800"
                        >
                          <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                          Awaiting Seller Acceptance...
                        </button>
                      ) : effectiveStatus === "accepted" ? (
                        <div className="space-y-2">
                          <div className="p-4 bg-blue-50/80 dark:bg-blue-950/25 border border-blue-200/80 dark:border-blue-900/40 rounded-2xl flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs font-bold text-blue-900 dark:text-blue-200">Seller Accepted Your Order</p>
                              <p className="text-[11px] text-blue-700 dark:text-blue-300 mt-0.5 leading-relaxed font-medium">
                                The merchant has accepted your order and is currently packaging your items. {order.deliveryType === "pickup" ? "You will receive an update once it is ready at the store/station." : "A campus logistics courier will be assigned shortly for dispatch."}
                              </p>
                            </div>
                          </div>
                          <button
                            disabled={true}
                            className="w-full py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 cursor-not-allowed"
                          >
                            <Clock className="w-4 h-4 text-slate-400" />
                            Seller Packaging Items...
                          </button>
                        </div>
                      ) : effectiveStatus === "logistics_pending" ? (
                        <div className="space-y-3">
                          <div className="p-4 bg-amber-50 dark:bg-amber-950/25 border border-amber-200 dark:border-amber-900/40 rounded-2xl space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Truck className="w-4 h-4 text-amber-600" />
                                <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                                  {order.logisticsName 
                                    ? `Booking Sent: Awaiting ${order.logisticsName} Acceptance` 
                                    : "Awaiting Logistics Courier Acceptance"}
                                </span>
                              </div>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">
                                Step 3: Courier Assignment
                              </span>
                            </div>
                            <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed font-medium">
                              The merchant has sent a delivery booking request to a registered campus courier. Orders cannot be confirmed until your package is delivered.
                            </p>
                          </div>
                          <button
                            disabled={true}
                            className="w-full py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 cursor-not-allowed border border-slate-200/50 dark:border-slate-800"
                          >
                            <Clock className="w-4 h-4 text-amber-500 animate-spin" />
                            Awaiting Logistics Partner Acceptance...
                          </button>
                        </div>
                      ) : effectiveStatus === "logistics_booked" ? (
                        <div className="space-y-3">
                          <div className="p-4 bg-indigo-50 dark:bg-indigo-950/25 border border-indigo-200 dark:border-indigo-900/40 rounded-2xl space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Truck className="w-4 h-4 text-indigo-600" />
                                <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                                  Campus Courier Booked: {order.logisticsName || "Logistics Partner"}
                                </span>
                              </div>
                              {order.logisticsPhone && (
                                <a
                                  href={`tel:${order.logisticsPhone}`}
                                  className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-1"
                                >
                                  <Phone className="w-3 h-3" /> {order.logisticsPhone}
                                </a>
                              )}
                            </div>
                            <p className="text-[11px] text-indigo-700 dark:text-indigo-300 leading-relaxed font-medium">
                              The dispatch rider has been assigned and is heading to the merchant's location to collect your package.
                            </p>
                          </div>
                          <button
                            disabled={true}
                            className="w-full py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 cursor-not-allowed"
                          >
                            <Clock className="w-4 h-4 text-slate-400" />
                            Awaiting Courier Pickup from Merchant...
                          </button>
                        </div>
                      ) : effectiveStatus === "transit" ? (
                        <div className="space-y-3">
                          <div className="p-4 bg-purple-50 dark:bg-purple-950/25 border border-purple-200 dark:border-purple-900/40 rounded-2xl space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Truck className="w-4 h-4 text-purple-600 animate-pulse" />
                                <span className="text-xs font-bold text-purple-900 dark:text-purple-200">
                                  Package On Transit
                                </span>
                              </div>
                              <span className="text-[10px] font-bold px-2.5 py-0.5 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-full">
                                {order.logisticsEstimatedDeliveryTimeline || "En Route"}
                              </span>
                            </div>
                            <p className="text-[11px] text-purple-700 dark:text-purple-300 leading-relaxed font-medium">
                              {order.logisticsName 
                                ? `${order.logisticsName} has accepted the dispatch from the merchant and is on transit with your package.`
                                : "Logistics courier has accepted the delivery dispatch and is on transit with your package."}
                            </p>
                            {order.logisticsPhone && (
                              <div className="pt-2 border-t border-purple-200/50 dark:border-purple-900/30 flex items-center justify-between text-xs">
                                <span className="text-purple-900 dark:text-purple-200 font-semibold">Courier Contact:</span>
                                <a
                                  href={`tel:${order.logisticsPhone}`}
                                  className="text-[11px] font-bold text-purple-700 dark:text-purple-300 hover:underline flex items-center gap-1"
                                >
                                  <Phone className="w-3 h-3" /> {order.logisticsPhone}
                                </a>
                              </div>
                            )}
                          </div>
                          <button
                            disabled={true}
                            className="w-full py-3.5 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 cursor-not-allowed border border-purple-200 dark:border-purple-800/60"
                          >
                            <Truck className="w-4 h-4 text-purple-500 animate-pulse" />
                            Package On Transit to Your Campus Destination...
                          </button>
                        </div>
                      ) : effectiveStatus === "out_for_delivery" ? (
                        <div className="space-y-3 animate-in fade-in">
                          <div className="p-5 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border-2 border-orange-300 dark:border-orange-800/80 rounded-2xl space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-orange-600 animate-bounce" />
                                <span className="text-xs font-black text-orange-900 dark:text-orange-200 uppercase tracking-wide">
                                  Rider Arrived at Your Location!
                                </span>
                              </div>
                              <span className="text-[10px] font-bold px-2.5 py-0.5 bg-orange-200 dark:bg-orange-800 text-orange-900 dark:text-orange-100 rounded-full">
                                Step 5: Doorstep Handover
                              </span>
                            </div>
                            <p className="text-xs text-orange-800 dark:text-orange-300 leading-relaxed font-medium">
                              The courier is at your doorstep or campus pickup point. Please share your <strong>Delivery PIN</strong> with the rider to verify package handover:
                            </p>
                            <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-orange-200 dark:border-orange-900/50 flex items-center justify-between">
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Your 6-Digit Delivery PIN</p>
                                <p className="text-2xl font-black font-mono tracking-widest text-emerald-600 select-all">
                                  {deliveryPin}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(deliveryPin);
                                  alert(`Delivery PIN ${deliveryPin} copied to clipboard!`);
                                }}
                                className="px-3.5 py-2 bg-orange-100 hover:bg-orange-200 text-orange-800 dark:bg-orange-900/60 dark:text-orange-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                              >
                                <Copy className="w-3.5 h-3.5" /> Copy PIN
                              </button>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                              The rider will enter this 6-digit PIN on their courier app to mark "Order Delivered". Once verified, you will inspect your items and confirm receipt below to release escrow.
                            </p>
                          </div>
                          <div className="pt-1">
                            <button
                              disabled={true}
                              className="w-full py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 cursor-not-allowed border border-slate-200/50 dark:border-slate-800"
                            >
                              <Clock className="w-4 h-4 text-orange-500 animate-spin" />
                              Awaiting Courier to Verify Handover PIN...
                            </button>
                          </div>
                        </div>
                      ) : effectiveStatus === "ready_for_pickup" ? (
                        <div className="space-y-3 animate-in fade-in">
                          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/25 border-2 border-emerald-300 dark:border-emerald-800 rounded-2xl space-y-2">
                            <div className="flex items-center gap-2">
                              <Package className="w-5 h-5 text-emerald-600" />
                              <span className="text-xs font-black text-emerald-900 dark:text-emerald-200 uppercase tracking-wide">
                                Ready at Pickup Station!
                              </span>
                            </div>
                            <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed font-medium">
                              Your package is ready for collection at {order.pickupStationName || order.location || "the store/station"}. Present your Pickup PIN: <strong className="font-mono text-emerald-700 dark:text-emerald-300">{deliveryPin}</strong>
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setVerifyingOrder(order);
                              setProductIdInput("");
                              setVerificationError(null);
                              setShowIdVerification(true);
                            }}
                            disabled={markingId === order.id || order.disputeStatus === "active"}
                            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                          >
                            {markingId === order.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                            Confirm Package Collected
                          </button>
                        </div>
                      ) : effectiveStatus === "payment_required" ? (
                        <div className="space-y-2 animate-in fade-in duration-300">
                          <div className="p-3 bg-amber-50 dark:bg-amber-900/25 border border-amber-200 dark:border-amber-900/40 rounded-xl text-xs font-medium text-amber-900 dark:text-amber-300">
                            <strong>📦 Package Handover Confirmed!</strong><br />
                            Pay on Delivery security policy requires electronic payment verification to complete escrow settlement.
                          </div>
                          <button
                            onClick={() => triggerPaystackPayment(order)}
                            disabled={isVerifyingPayment}
                            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm tracking-wide transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95"
                          >
                            {isVerifyingPayment ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <CreditCard className="w-4 h-4" />
                            )}
                            Pay via Paystack (₦{order.totalPrice.toLocaleString()})
                          </button>
                        </div>
                      ) : effectiveStatus === "delivered" ? (
                        <div className="space-y-3 animate-in fade-in">
                          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/25 border-2 border-emerald-300 dark:border-emerald-800 rounded-2xl space-y-2">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-5 h-5 text-emerald-600" />
                              <span className="text-xs font-black text-emerald-900 dark:text-emerald-200 uppercase tracking-wide">
                                Package Handover Verified by Courier!
                              </span>
                            </div>
                            <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed font-medium">
                              {order.paymentMethod === "pod" && order.paymentStatus !== "paid"
                                ? "Package received! Please complete your Paystack payment to finalize settlement and release vendor balance."
                                : "The courier has verified delivery and handed over your package. Please inspect your items and click below to confirm receipt and release escrow funds to the seller and courier."}
                            </p>
                          </div>

                          {order.paymentMethod === "pod" && order.paymentStatus !== "paid" ? (
                            <button
                              onClick={() => triggerPaystackPayment(order)}
                              disabled={isVerifyingPayment || markingId === order.id}
                              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-sm tracking-wide transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer active:scale-95"
                            >
                              {isVerifyingPayment ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                              Pay via Paystack (₦{order.totalPrice.toLocaleString()})
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setVerifyingOrder(order);
                                setProductIdInput("");
                                setVerificationError(null);
                                setShowIdVerification(true);
                              }}
                              disabled={markingId === order.id || order.disputeStatus === "active"}
                              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-sm tracking-wide transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/25 cursor-pointer disabled:opacity-50"
                            >
                              {markingId === order.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <CheckCircle className="w-4 h-4" />
                              )}
                              Confirm Delivery & Release Escrow
                            </button>
                          )}
                        </div>
                      ) : null}

                      {/* Refund & Dispute Action Buttons - ONLY shown after payment is made */}
                      {(() => {
                        const isOrderPaid = order.paymentStatus === "paid" || order.paymentMethod === "online";
                        const canRequestRefund = isOrderPaid && (!order.refundStatus || order.refundStatus === "none" || order.refundStatus === "rejected") && order.status !== "cancelled";
                        const canRaiseDispute = isOrderPaid && (order.status === "Out To Pickup Station" || order.status === "Out For Delivery" || order.status === "Ready For Pickup" || order.status === "accepted" || order.status === "out_for_delivery" || order.status === "transit") && (!order.disputeStatus || order.disputeStatus === "none");

                        return (
                          <>
                            {canRequestRefund && (
                              <button
                                onClick={() => setRefundModalOrder(order)}
                                className="w-full py-3 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 rounded-2xl font-bold text-xs hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all flex items-center justify-center gap-2 border border-indigo-100 dark:border-indigo-900/30 shadow-sm cursor-pointer"
                              >
                                <ShieldAlert className="w-3.5 h-3.5" />
                                Request Refund (1.5% Fee)
                              </button>
                            )}

                            {canRaiseDispute && (
                              <button
                                onClick={() => setDisputeModalOrder(order)}
                                className="w-full py-3 bg-amber-50 dark:bg-amber-900/10 text-amber-600 dark:text-amber-400 rounded-2xl font-bold text-xs hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-all flex items-center justify-center gap-2 border border-amber-200/50 dark:border-amber-900/30 cursor-pointer"
                              >
                                <AlertCircle className="w-3.5 h-3.5" />
                                Raise Escrow Dispute
                              </button>
                            )}

                            {!isOrderPaid && (
                              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-700/50 text-[10px] text-slate-500 dark:text-slate-400 font-medium text-center">
                                🔒 Escrow Refund & Dispute eligibility activates after in-app payment is confirmed.
                              </div>
                            )}
                          </>
                        );
                      })()}

                      {/* Audit Trail Button */}
                      <button
                        onClick={() => setAuditModalOrder(order)}
                        className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-300 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <History className="w-3.5 h-3.5 text-slate-500" />
                        View Security Audit Trail
                      </button>

                      {/* Anti-Scam Cancellation Lock & Role Guards */}
                      {((order.status === "pending" || order.status === "Pending Seller Acceptance") && order.status !== "cancelled" && order.status !== "completed") ? (
                        <button
                          onClick={() => setCancelRefundOrder(order)}
                          className="w-full py-3.5 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-2xl font-bold text-xs hover:bg-red-100 dark:hover:bg-red-900/40 transition-all flex items-center justify-center gap-2 border border-red-200/50 dark:border-red-900/30 shadow-xs cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Cancel Order
                        </button>
                      ) : (order.status !== "cancelled" && order.status !== "completed" && order.status !== "acquired") ? (
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/50 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                          <div className="flex items-center gap-2">
                            <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="text-[11px] font-bold">Cancellation Locked (In Dispatch)</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium">Use Dispute for Issues</span>
                        </div>
                      ) : null}
                    </div>
                  )}

                  {/* Completed order actions: Refund and Audit Trail buttons */}
                  {order.status === "completed" && (
                    <div className="flex flex-col gap-2 pt-2">
                      {(() => {
                        const isOrderPaid = order.paymentStatus === "paid" || order.paymentMethod === "online";
                        const isWindowActive = getComplaintCountdown(order) !== "expired";
                        const canRequestRefund = isOrderPaid && isWindowActive && (!order.refundStatus || order.refundStatus === "none" || order.refundStatus === "rejected");

                        return (
                          <>
                            {canRequestRefund && (
                              <button
                                onClick={() => setRefundModalOrder(order)}
                                className="w-full py-3 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 rounded-2xl font-bold text-xs hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all flex items-center justify-center gap-2 border border-indigo-100 dark:border-indigo-900/30 shadow-sm cursor-pointer"
                              >
                                <ShieldAlert className="w-3.5 h-3.5" />
                                Request Refund (1.5% Fee)
                              </button>
                            )}
                          </>
                        );
                      })()}
                      <button
                        onClick={() => setAuditModalOrder(order)}
                        className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-300 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <History className="w-3.5 h-3.5 text-slate-500" />
                        View Security Audit Trail
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
      </div>

      {/* Individual Order Clear Confirmation Modal */}
      <AnimatePresence>
        {showSingleClearConfirm && orderToClear && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl border border-slate-100 dark:border-slate-800"
            >
              <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center text-amber-600 dark:text-amber-500 mx-auto mb-6">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white text-center mb-2">Cancel & Clear Order?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-8">
                This order is currently <strong>{orderToClear.status.replace(/_/g, ' ')}</strong>. 
                Clearing it now will <strong>CANCEL</strong> the order and restore the stock for the seller.
              </p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    setShowSingleClearConfirm(false);
                    setOrderToClear(null);
                  }}
                  disabled={clearing}
                  className="flex-1 py-4 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-all disabled:opacity-50"
                >
                  Go Back
                </button>
                <button 
                  onClick={confirmSingleClear}
                  disabled={clearing}
                  className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-bold text-sm hover:bg-red-700 transition-all shadow-lg shadow-red-100 dark:shadow-red-900/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {clearing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Cancel & Clear"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Clear All Confirmation Modal */}
      <AnimatePresence>
        {showClearConfirm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl border border-slate-100 dark:border-slate-800"
            >
              <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center text-red-600 dark:text-red-500 mx-auto mb-6">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white text-center mb-2">Clear All History?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-4">This will hide all orders from your tracking list.</p>
              
              {orders.some(o => o.status !== "completed" && o.status !== "cancelled") && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl mb-8">
                  <p className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-1">Warning</p>
                  <p className="text-xs text-red-600 dark:text-red-400">
                    You have active orders. These orders WILL NOT be automatically cancelled if you clear all history. Please cancel active orders individually if you wish to restore stock.
                  </p>
                </div>
              )}
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowClearConfirm(false)}
                  disabled={clearing}
                  className="flex-1 py-4 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleClearAll}
                  disabled={clearing}
                  className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-bold text-sm hover:bg-red-700 transition-all shadow-lg shadow-red-100 dark:shadow-red-900/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {clearing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Hide All"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ReceiptModal
        order={selectedReceiptOrder!}
        isOpen={!!selectedReceiptOrder}
        onClose={() => setSelectedReceiptOrder(null)}
      />

      {/* Branded Escrow Payment Modal */}
      <AnimatePresence>
        {orderToPay && (
          <div className="fixed inset-0 z-[350] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 max-w-md w-full shadow-2xl border border-stone-100 dark:border-slate-800 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16" />
              
              <button 
                onClick={() => setOrderToPay(null)}
                className="absolute top-6 right-6 p-2 text-stone-400 hover:text-red-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-6">
                <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto">
                  <CreditCard className="w-8 h-8 font-bold" />
                </div>

                <div className="text-center space-y-1">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">Escrow Payment Gateway</h3>
                  <p className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest">Secure Order Settlement Portal</p>
                </div>

                <div className="p-5 bg-stone-50 dark:bg-slate-800/50 rounded-[2.5rem] border border-stone-105 dark:border-slate-800 space-y-3 font-sans">
                  <div className="flex justify-between items-center pb-2.5 border-b border-stone-200 dark:border-slate-800">
                    <div>
                      <h4 className="text-xs font-black text-stone-800 dark:text-white uppercase">{orderToPay.productName}</h4>
                      <p className="text-[9px] text-stone-400">Seller: {orderToPay.sellerName || "Shopiversity Merchant"}</p>
                    </div>
                    <span className="text-xs font-bold font-mono">x{orderToPay.quantity}</span>
                  </div>

                  <div className="space-y-1.5 text-xs text-stone-600 dark:text-stone-300">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="font-mono">₦{orderToPay.totalPrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Platform Fee</span>
                      <span className="font-mono text-emerald-600">FREE</span>
                    </div>
                    <div className="flex justify-between font-black text-stone-900 dark:text-white pt-1 text-sm">
                      <span>Total Amount due</span>
                      <span className="font-mono">₦{orderToPay.totalPrice.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-purple-50/50 dark:bg-purple-950/10 rounded-2xl border border-purple-100/50 dark:border-purple-900/20 space-y-2 leading-relaxed">
                  <p className="text-[10px] text-purple-900 dark:text-purple-400 font-medium">
                    <span className="font-black uppercase mr-1">[Term 7.1]</span> Payment must be transacted securely inside the SHOPIVERSITY app to preserve your Active Buyer Protection.
                  </p>
                  <p className="text-[10px] text-purple-900 dark:text-purple-400 font-medium">
                    <span className="font-black uppercase mr-1">[Term 1.1]</span> Escrow holds this payment safely. The vendor is disbursed only after fulfillment validation.
                  </p>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                  <button 
                    onClick={() => triggerPaystackPayment(orderToPay)}
                    disabled={isVerifyingPayment}
                    className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-xl cursor-pointer disabled:opacity-50"
                  >
                    {isVerifyingPayment ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Verifying Real Payment...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        Pay ₦{orderToPay.totalPrice.toLocaleString()} via Paystack
                      </>
                    )}
                  </button>
                  <p className="text-[10px] text-center text-slate-500 dark:text-slate-400 font-medium">
                    Protected by Paystack 256-bit encryption & SHOPIVERSITY Escrow.
                  </p>
                </div>

                <div className="text-center pb-2">
                  <p className="text-[9px] text-stone-400 uppercase tracking-widest font-bold">
                    🛡️ Verified SHOPIVERSITY Escrow Protection
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delivery Receipt & Escrow Release Confirmation Modal */}
      <AnimatePresence>
        {showIdVerification && verifyingOrder && (
          <div 
            className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowIdVerification(false);
                setVerifyingOrder(null);
                setProductIdInput("");
                setVerificationError(null);
              }
            }}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-800 relative"
            >
              <button 
                id="btn-close-verify-modal"
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowIdVerification(false);
                  setVerifyingOrder(null);
                  setProductIdInput("");
                  setVerificationError(null);
                }}
                className="absolute top-6 right-6 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-all border border-slate-200 dark:border-slate-700/50 cursor-pointer z-30"
                title="Cancel & close"
                aria-label="Cancel & close"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-5">
                <CheckCircle className="w-7 h-7" />
              </div>

              <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-white mb-1.5">
                Confirm Package Delivery
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 font-medium leading-relaxed">
                Have you inspected your package and verified that all items have been safely received?
              </p>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs mb-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Item:</span>
                  <span className="font-bold text-slate-900 dark:text-white truncate max-w-[200px]">{verifyingOrder.productName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Quantity:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{verifyingOrder.quantity}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Total:</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400">₦{verifyingOrder.totalPrice.toLocaleString()}</span>
                </div>
                {verifyingOrder.sellerName && (
                  <div className="flex items-center justify-between border-t border-slate-200/60 dark:border-slate-700/60 pt-2 mt-1">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Merchant:</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{verifyingOrder.sellerName}</span>
                  </div>
                )}
                {verifyingOrder.logisticsName && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Courier:</span>
                    <span className="font-bold text-purple-600 dark:text-purple-400">{verifyingOrder.logisticsName}</span>
                  </div>
                )}
              </div>

              <div className="p-3 bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/50 rounded-xl mb-4 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium leading-relaxed">
                  Confirming delivery finalizes your order and releases escrow payment to the merchant and courier.
                </p>
              </div>

              {verificationError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2 mb-4">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{verificationError}</span>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  id="btn-cancel-delivery-confirm"
                  type="button"
                  onClick={() => {
                    setShowIdVerification(false);
                    setVerifyingOrder(null);
                    setProductIdInput("");
                    setVerificationError(null);
                  }}
                  className="flex-1 h-12 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
                >
                  Inspect First
                </button>
                <button
                  id="btn-confirm-delivery-receipt"
                  type="button"
                  onClick={handleConfirmDeliveryReceipt}
                  disabled={confirmingDelivery}
                  className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 active:scale-[0.98] border-none outline-none cursor-pointer"
                >
                  {confirmingDelivery ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  Confirm Delivery
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ReviewSuccessModal
        isOpen={isReviewSuccessOpen}
        onClose={() => setIsReviewSuccessOpen(false)}
        rating={submittedReviewInfo?.rating || 5}
        productName={submittedReviewInfo?.productName}
        comment={submittedReviewInfo?.comment || ""}
      />

      {refundModalOrder && (
        <RefundRequestModal
          order={refundModalOrder}
          isOpen={!!refundModalOrder}
          onClose={() => setRefundModalOrder(null)}
          onSuccess={() => setRefundModalOrder(null)}
        />
      )}

      {cancelRefundOrder && (
        <CancelRefundModal
          order={cancelRefundOrder}
          isOpen={!!cancelRefundOrder}
          onClose={() => setCancelRefundOrder(null)}
          onSuccess={() => setCancelRefundOrder(null)}
          currentUser={currentUser}
        />
      )}

      {disputeModalOrder && (
        <OrderDisputeModal
          order={disputeModalOrder}
          isOpen={!!disputeModalOrder}
          onClose={() => setDisputeModalOrder(null)}
          onSuccess={() => setDisputeModalOrder(null)}
        />
      )}

      {auditModalOrder && (
        <OrderAuditTrailModal
          order={auditModalOrder}
          isOpen={!!auditModalOrder}
          onClose={() => setAuditModalOrder(null)}
        />
      )}
    </div>
  );
}
