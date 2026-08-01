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
  Building 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { handleFirestoreError, OperationType } from "../lib/firebase-errors";
import { usePaystackPayment } from "../hooks/usePaystackPayment";
import ReceiptModal from "./ReceiptModal";
import LiveRiderTrackingModal from "./LiveRiderTrackingModal";
import { Star, MessageSquare, AlertTriangle, ExternalLink as ExternalLinkIcon } from "lucide-react";

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

  // New states for ID verification
  const [showIdVerification, setShowIdVerification] = React.useState(false);
  const [productIdInput, setProductIdInput] = React.useState("");
  const [verifyingOrder, setVerifyingOrder] = React.useState<Order | null>(null);
  const [verificationError, setVerificationError] = React.useState<string | null>(null);
  const [confirmingDelivery, setConfirmingDelivery] = React.useState(false);
  const [confirmingOrderMap, setConfirmingOrderMap] = React.useState<Record<string, boolean>>({});

  // New states for live in-app rider tracking
  const [trackingRiderOrder, setTrackingRiderOrder] = React.useState<Order | null>(null);
  const [trackingProgress, setTrackingProgress] = React.useState(20);

  const config = {
    reference: (new Date()).getTime().toString(),
    email: auth.currentUser?.email || "",
    amount: (orderToPay?.totalPrice || 0) * 100,
    publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || "pk_test_placeholder",
  };

  const initializePayment = usePaystackPayment(config);

  const onPaystackSuccess = async (response: any) => {
    if (!orderToPay) return;
    await processDeliveryConfirmation(orderToPay, response.reference);
    setOrderToPay(null);
  };

  const onPaystackClose = () => {
    alert("Payment cancelled. Delivery cannot be confirmed without payment.");
    setMarkingId(null);
    setOrderToPay(null);
  };

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Update animated GPS tracking progress of dispatch rider
  React.useEffect(() => {
    if (!trackingRiderOrder) return;
    const interval = setInterval(() => {
      setTrackingProgress((prev) => {
        if (prev >= 100) return 100;
        // Keep moving between 5 to 9 percentage points every second for interactive feedback
        const r = Math.floor(Math.random() * 5) + 5;
        return Math.min(prev + r, 100);
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [trackingRiderOrder]);

  // Handle transition when rider arrives at destination
  React.useEffect(() => {
    if (trackingRiderOrder && trackingProgress >= 100) {
      const nextStatus = trackingRiderOrder.deliveryType === "pickup" ? "Ready For Pickup" : "Ready For Delivery";
      const updateOrderArrival = async () => {
        try {
          await updateDoc(doc(db, "orders", trackingRiderOrder.id), {
            status: nextStatus,
            updatedAt: new Date().toISOString()
          });
          setTimeout(() => {
            setTrackingRiderOrder(null);
          }, 3000);
        } catch (err) {
          console.error("Failed to update status to arrived:", err);
        }
      };
      updateOrderArrival();
    }
  }, [trackingProgress, trackingRiderOrder]);

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
        const d = { id: doc.id, ...doc.data() };
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
      // 1. Move the order status to "Order Picked Up"
      await updateDoc(doc(db, "orders", order.id), {
        status: "Order Picked Up",
        updatedAt: new Date().toISOString()
      });

      // 2. If already paid, auto-complete
      if (order.paymentStatus === "paid" || order.paymentMethod === "online") {
        await processDeliveryConfirmation(order);
        setMarkingId(null);
        return;
      }

      // 3. Otherwise (e.g. POD, or unpaid), take directly to payment page
      setOrderToPay(order);
      setTimeout(() => {
        initializePayment({ onSuccess: onPaystackSuccess, onClose: onPaystackClose });
      }, 100);
    } catch (err) {
      console.error("Pickup confirmation failed:", err);
      alert("Pickup confirmation failed.");
    } finally {
      setMarkingId(null);
    }
  };

  const handleMarkAsDelivered = async (order: Order, bypassCountdown = false) => {
    if (!auth.currentUser) return;
    
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
      // Proceed directly to status update: 'Order Picked Up' or 'Order Delivered'
      const nextStatus = order.deliveryType === "pickup" ? "Order Picked Up" : "Order Delivered";
      await updateDoc(doc(db, "orders", order.id), {
        status: nextStatus,
        updatedAt: new Date().toISOString()
      });

      // If it's Pay on Delivery, we need payment now
      if (order.paymentMethod === "pod" && order.paymentStatus !== "paid") {
        setOrderToPay(order);
        setTimeout(() => {
          initializePayment({ onSuccess: onPaystackSuccess, onClose: onPaystackClose });
        }, 100);
        return;
      }

      // If online paid, auto transition to Completed
      await processDeliveryConfirmation(order);
    } catch (err) {
      console.error("Delivery confirmation error:", err);
      alert("An error occurred during delivery confirmation.");
    } finally {
      setMarkingId(null);
    }
  };

  const handleVerifyProductIdAndConfirm = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!verifyingOrder) return;

    if (productIdInput.trim() !== verifyingOrder.productId) {
      setVerificationError("Incorrect Product ID. Please verify the code and try again.");
      return;
    }

    setVerificationError(null);
    setConfirmingDelivery(true);
    try {
      await handleMarkAsDelivered(verifyingOrder, true);
      setShowIdVerification(false);
      setVerifyingOrder(null);
      setProductIdInput("");
    } catch (err) {
      console.error("Verification confirmation error:", err);
      setVerificationError("An error occurred during verification.");
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

      setReviewingOrderId(null);
      setReviewComment("");
      setReviewRating(5);
      alert("Thank you for your review!");
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, "reviews");
    } finally {
      setSubmittingReview(false);
    }
  };

  const getComplaintCountdown = (order: Order) => {
    if (order.status !== "completed") return null;
    
    const baseTime = order.deliveredAt || order.updatedAt || order.createdAt;
    if (!baseTime) return null;
    
    const deliveredAt = new Date(baseTime).getTime();
    const fortyEightHours = 48 * 60 * 60 * 1000;
    const expiryTime = deliveredAt + fortyEightHours;
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
      case "delivered": return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case "acquired": return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case "cancelled": return <Clock className="w-5 h-5 text-red-500" />;
      case "transit": return <Truck className="w-5 h-5 text-purple-500 animate-pulse" />;
      case "ready_for_pickup": return <Package className="w-5 h-5 text-emerald-500" />;
      case "out_for_delivery": 
        return deliveryType === "pickup" 
          ? <Package className="w-5 h-5 text-blue-500" /> 
          : <Truck className="w-5 h-5 text-blue-500" />;
      case "accepted": return <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />;
      default: return <Package className="w-5 h-5 text-indigo-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "awaiting_payment": return "bg-amber-50 text-amber-600 animate-pulse border border-amber-200/50";
      case "completed": return "bg-emerald-50 text-emerald-600";
      case "delivered": return "bg-emerald-50 text-emerald-600 animate-pulse font-bold";
      case "acquired": return "bg-emerald-100 text-emerald-700 font-bold";
      case "cancelled": return "bg-red-50 text-red-600";
      case "transit": return "bg-purple-50 text-purple-600 font-bold";
      case "ready_for_pickup": return "bg-emerald-50 text-emerald-600 font-black animate-pulse border border-emerald-200/55";
      case "out_for_delivery": return "bg-blue-50 text-blue-600";
      case "accepted": return "bg-emerald-50 text-emerald-600";
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
    const s = order.status;
    if (s === "awaiting_payment") return "awaiting_payment";
    if (s === "pending" || s === "Pending Seller Acceptance") return "pending";
    if (s === "out_for_delivery" || s === "accepted") return "out_for_delivery";
    if (s === "Out To Pickup Station" || s === "Out For Delivery") return "transit";
    if (s === "Ready For Pickup" || s === "Ready For Delivery") return "ready_for_pickup";
    if (s === "delivered" || s === "acquired" || s === "Order Picked Up" || s === "Order Delivered") return "delivered";
    if (s === "completed") return "completed";
    return s;
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
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Order ID: {order.id.slice(0, 8)}</p>
                      <h4 className="text-lg font-bold text-slate-900 dark:text-white capitalize flex flex-col">
                        {effectiveStatus === "transit" 
                          ? (order.deliveryType === "pickup" ? "En Route to Station" : "Out For Delivery")
                          : effectiveStatus === "ready_for_pickup" 
                          ? (order.deliveryType === "pickup" ? "Ready for Pickup" : "Arrived at Destination") 
                          : effectiveStatus === "out_for_delivery" 
                          ? "Accepted & Preparing" 
                          : effectiveStatus.replace(/_/g, ' ')}
                        {effectiveStatus === "out_for_delivery" && order.deliveryTime && (
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 lowercase">
                            (Estimated {order.deliveryTime} {Number(order.deliveryTime) === 1 ? (order.deliveryTimeUnit?.toLowerCase().startsWith('hour') ? 'hour' : order.deliveryTimeUnit?.toLowerCase().startsWith('week') ? 'week' : 'day') : (order.deliveryTimeUnit || 'days')} {order.deliveryType === "pickup" ? "pickup" : "delivery"})
                          </span>
                        )}
                      </h4>
                    </div>
                  </div>
                <div className="flex flex-wrap items-center gap-2">
                  {order.sellerId && (
                    <button
                      onClick={() => window.dispatchEvent(new CustomEvent('open-chat', { detail: order.sellerId }))}
                      className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl font-bold text-[10px] uppercase tracking-wider flex items-center gap-2 hover:bg-indigo-100 transition-all border border-indigo-100/50 dark:border-indigo-900/30"
                    >
                      <MessageSquare className="w-3 h-3" />
                      Chat with Seller
                    </button>
                  )}
                  <span className={cn(
                    "px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-2",
                    order.deliveryType === "delivery" ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  )}>
                    {order.deliveryType === "delivery" ? <Truck className="w-3 h-3" /> : <Package className="w-3 h-3" />}
                    {order.deliveryType}
                  </span>
                  <span className={cn(
                    "px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-2",
                    order.paymentMethod === "online" ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400" : "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
                  )}>
                    {order.paymentMethod === "online" ? <CreditCard className="w-3 h-3" /> : <Wallet className="w-3 h-3" />}
                    {order.paymentMethod === "online" ? "Paid Online" : "Pay on Delivery"}
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
                      getComplaintCountdown(order) !== "expired" 
                        ? "bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/20 shadow-lg shadow-amber-500/5 rotate-1" 
                        : "bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800"
                    )}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center",
                            getComplaintCountdown(order) !== "expired" ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-400"
                          )}>
                            <ShieldCheck className="w-5 h-5" />
                          </div>
                          <div>
                            <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-900 dark:text-white">Active Buyer Protection</h5>
                            <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">To be reported within 48hrs</p>
                          </div>
                        </div>
                        {getComplaintCountdown(order) !== "expired" ? (
                          <div className="flex flex-col items-end">
                            <div className="flex items-center gap-1.5 text-[10px] font-black text-amber-600 animate-pulse">
                              <div className="w-2 h-2 bg-amber-500 rounded-full" />
                              {getComplaintCountdown(order)}
                            </div>
                            <span className="text-[8px] font-bold text-amber-500/50 uppercase tracking-widest">Time Remaining</span>
                          </div>
                        ) : (
                          <div className="px-3 py-1 bg-slate-200 dark:bg-slate-800 text-slate-500 rounded-full text-[8px] font-black uppercase tracking-widest">
                            Protection Expired
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-4">
                        <div className="p-4 bg-white/60 dark:bg-slate-900/40 rounded-2xl border border-white/40 dark:border-slate-800/40 space-y-3">
                           <div className="space-y-2">
                             <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                               <span className="font-black text-slate-900 dark:text-white uppercase mr-1">Term 2.1:</span> You have 48 hours from the stated delivery time to inspect your order and raise a dispute if there are issues.
                             </p>
                             <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                               <span className="font-black text-slate-900 dark:text-white uppercase mr-1">Term 2.3:</span> If you do nothing for 48 hours, SHOPIVERSITY will automatically mark the order as "Delivered" and pay the seller. All sales are final after 48 hours.
                             </p>
                           </div>
                           <div className="flex items-center gap-2 text-[9px] text-amber-600/60 font-bold italic border-t border-amber-100/50 pt-2">
                              <Info className="w-3 h-3 shrink-0" />
                              Points related to Section 2 of the Terms of Service
                           </div>
                        </div>

                        {getComplaintCountdown(order) !== "expired" && (
                          <button
                            onClick={() => setActiveTab("support")}
                            className="w-full h-12 bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl shadow-amber-500/10"
                          >
                            <MessageSquare className="w-4 h-4" />
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
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
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
                        <p className="text-lg font-black text-indigo-600">₦{order.totalPrice.toLocaleString()}</p>
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
                      {order.kwikRiderId && (order.status === "Out For Delivery" || order.status === "out_for_delivery") && !order.confirmOrderPressed && (
                        <div className="mt-3 p-4 bg-orange-50/40 dark:bg-orange-950/20 rounded-2xl border border-orange-100 dark:border-orange-900/40 max-w-md space-y-2">
                          <p className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest flex items-center gap-1.5">
                            <Truck className="w-3.5 h-3.5" />
                            {order.kwikRiderId.startsWith("CAMPUS-") ? "Campus Logistics Tracker" : "Outsourced Courier Tracker"}
                          </p>
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              {order.kwikRiderId.startsWith("CAMPUS-") 
                                ? `🏍️ ${order.kwikRiderId.replace("CAMPUS-", "").replace(/-/g, " ")} Dispatched`
                                : order.kwikRiderId.startsWith("OUTSOURCED-") 
                                  ? `🚚 External Courier: ${order.kwikRiderId.replace("OUTSOURCED-", "").replace(/-/g, " ")}`
                                  : "🏍️ Dispatch Rider On the Way"
                              }
                            </p>
                            <p className="text-[10px] text-slate-500 font-medium">
                              Carrier Reference: <span className="font-mono font-bold text-slate-900 dark:text-slate-100 select-all">{order.kwikRiderId.startsWith("CAMPUS-") ? order.kwikRiderId.replace("CAMPUS-", "") : order.kwikRiderId.startsWith("OUTSOURCED-") ? order.kwikRiderId.replace("OUTSOURCED-", "") : order.kwikRiderId}</span>
                            </p>
                            {order.deliveredWorkNotes && (
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 bg-white/40 dark:bg-slate-900/30 p-2 rounded-xl mt-1.5 italic">
                                {order.deliveredWorkNotes}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            {order.kwikTrackingUrl && order.kwikTrackingUrl !== "local_logistics" && order.kwikTrackingUrl !== "outsourced" && (
                              <button
                                type="button"
                                onClick={() => {
                                  setTrackingRiderOrder(order);
                                  setTrackingProgress(Math.floor(Math.random() * 20) + 15);
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-[10px] font-bold shadow-md shadow-orange-500/10 cursor-pointer transition-all active:scale-[0.98]"
                              >
                                Track Dispatch Rider Live <ExternalLink className="w-3 h-3" />
                              </button>
                            )}
                            <button
                              type="button"
                              disabled={confirmingOrderMap[order.id]}
                              onClick={async () => {
                                setConfirmingOrderMap(prev => ({ ...prev, [order.id]: true }));
                                try {
                                  await updateDoc(doc(db, "orders", order.id), {
                                    confirmOrderPressed: true,
                                    updatedAt: new Date().toISOString()
                                  });
                                } catch (err) {
                                  console.error("Failed to update confirmOrderPressed:", err);
                                  alert("Error occurred while confirming order.");
                                } finally {
                                  setConfirmingOrderMap(prev => ({ ...prev, [order.id]: false }));
                                }
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-bold shadow-md shadow-indigo-500/10 cursor-pointer transition-all active:scale-[0.98] disabled:opacity-55"
                            >
                              {confirmingOrderMap[order.id] ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <CheckCircle className="w-3.5 h-3.5" />
                              )}
                              Confirm Order
                            </button>
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
                        {order.deliveryType === "pickup" ? "Expected Pickup" : "Est. Delivery"}
                      </p>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300 text-center sm:text-left">
                        {order.deliveryTime ? `${order.deliveryTime} ${Number(order.deliveryTime) === 1 ? (order.deliveryTimeUnit?.toLowerCase().startsWith('hour') ? 'hour' : order.deliveryTimeUnit?.toLowerCase().startsWith('week') ? 'week' : 'day') : (order.deliveryTimeUnit || 'days')}` : "2-3 Business Days"}
                      </p>
                    </div>
                  </div>
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
                      {[
                        { key: "pending", label: "Order Placed", icon: Clock },
                        { key: "out_for_delivery", label: "Accepted & Preparing", icon: CheckCircle },
                        { 
                          key: "transit", 
                          label: order.deliveryType === "pickup" ? "En Route to Station" : "Out for Delivery", 
                          icon: Truck 
                        },
                        { 
                          key: "ready_for_pickup", 
                          label: order.deliveryType === "pickup" ? "Ready for Pickup" : "Arrived at Destination", 
                          icon: Package 
                        },
                        { 
                          key: "delivered", 
                          label: order.deliveryType === "pickup" ? "Order Picked Up" : "Order Delivered", 
                          icon: Package 
                        },
                        { key: "completed", label: "Completed", icon: CheckCircle }
                      ].map((step, index, array) => {
                        const statuses = array.map(s => s.key);
                        const currentIndex = statuses.indexOf(effectiveStatus);
                        const isCompleted = index <= currentIndex && order.status !== "cancelled";
                        const isCurrent = index === currentIndex;
                        
                        // Green for reached, indigo for pending, slate for future
                        let stepColor = "bg-slate-100 dark:bg-slate-800";
                        if (isCompleted) {
                          if (step.key === "pending") stepColor = "bg-indigo-600";
                          else stepColor = "bg-emerald-600";
                        }
                        
                        return (
                          <div key={step.key} className="flex items-center gap-4">
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center z-10 transition-all duration-500",
                              stepColor,
                              isCompleted ? "text-white shadow-lg" : "text-slate-400 dark:text-slate-500",
                              isCurrent && "ring-4 ring-indigo-100 dark:ring-indigo-900/30"
                            )}>
                              <step.icon className={cn("w-4 h-4", isCurrent && step.key === "transit" && "animate-spin")} />
                            </div>
                            <div className="flex flex-col">
                              <span className={cn(
                                "text-xs font-bold transition-colors",
                                isCompleted ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-500"
                              )}>
                                {step.label}
                                {isCurrent && step.key === "transit" && remainingTime && (
                                  <span className="ml-2 font-mono text-[10px] text-emerald-600">{remainingTime}</span>
                                )}
                              </span>
                              {isCurrent && (
                                <p className="text-[10px] font-medium text-indigo-600 animate-pulse">Current Status</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      
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

                      {order.status === "out_for_delivery" && (
                        <div className="p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-xl mb-1">
                          <p className="text-[10px] font-black uppercase tracking-widest text-[#d97706] dark:text-amber-500">Merchant Preparing Dispatch</p>
                          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-1">
                            The merchant has accepted your order and is preparing or booking campus dispatch/courier. Please wait.
                          </p>
                        </div>
                      )}

                      {order.status === "Pending Seller Acceptance" ? (
                        <button
                          disabled={true}
                          className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 cursor-not-allowed"
                        >
                          <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                          Awaiting Seller Acceptance...
                        </button>
                      ) : (order.type === "service" && order.paymentMethod === "physical") ? (
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
                      ) : order.status === "awaiting_payment" ? (
                        <div className="space-y-2 animate-in fade-in duration-305">
                          <div className="p-3 bg-amber-50 dark:bg-amber-900/25 border border-amber-100 dark:border-amber-900/40 rounded-xl text-xs font-medium text-amber-800 dark:text-amber-400">
                            Service completed by vendor! Please finalize your secure online escrow payment on the app now.
                          </div>
                          <button
                            onClick={() => {
                              setOrderToPay(order);
                            }}
                            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm tracking-wide transition-all duration-300 animate-pulse flex items-center justify-center gap-2"
                          >
                            <CreditCard className="w-4 h-4" />
                            Pay For Service via Paystack (₦{order.totalPrice.toLocaleString()})
                          </button>
                        </div>
                      ) : (order.status === "Order Picked Up" || order.status === "Order Delivered") && order.paymentMethod === "pod" && order.paymentStatus !== "paid" ? (
                        <div className="space-y-2">
                          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 rounded-xl text-xs font-medium text-amber-800 dark:text-amber-400">
                            Fulfillment verified! Please complete your secure escrow payment below to finalize this order.
                          </div>
                          <button
                            onClick={() => {
                              setOrderToPay(order);
                            }}
                            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm tracking-wide transition-all duration-300 animate-pulse flex items-center justify-center gap-2"
                          >
                            <CreditCard className="w-4 h-4" />
                            Pay For Order via Paystack (₦{order.totalPrice.toLocaleString()})
                          </button>
                        </div>
                      ) : order.deliveryType === "pickup" ? (
                        <button
                          onClick={() => handleConfirmPickup(order)}
                          disabled={
                            markingId === order.id || 
                            order.disputeStatus === "active" || 
                            order.status === "Out To Pickup Station" ||
                            order.status === "out_for_delivery"
                          }
                          className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold text-sm hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:bg-slate-200 dark:disabled:bg-slate-800"
                        >
                          {markingId === order.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                          Order Picked Up
                          {order.status === "Out To Pickup Station" && (
                            <span className="block text-[10px] font-medium opacity-70">
                              (Wait for Countdown)
                            </span>
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setVerifyingOrder(order);
                            setProductIdInput("");
                            setVerificationError(null);
                            setShowIdVerification(true);
                          }}
                          disabled={
                            markingId === order.id || 
                            order.disputeStatus === "active"
                          }
                          className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold text-sm hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:bg-slate-200 dark:disabled:bg-slate-800"
                        >
                          {markingId === order.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                          Confirm Delivery
                        </button>
                      )}

                      {(order.status === "Out To Pickup Station" || order.status === "Out For Delivery" || order.status === "Ready For Pickup" || order.status === "accepted") && (!order.disputeStatus || order.disputeStatus === "none") && (
                        <button
                          onClick={async () => {
                            if (!window.confirm("Raise a dispute? This will freeze funds in escrow while SHOPIVERSITY investigates. The seller has 24 hours to respond with proof of delivery.")) return;
                            try {
                              await updateDoc(doc(db, "orders", order.id), {
                                disputeStatus: "active",
                                disputedAt: new Date().toISOString(),
                                escrowStatus: "held"
                              });
                              await addDoc(collection(db, "notifications"), {
                                userId: order.sellerId,
                                title: "Dispute Raised!",
                                message: `A dispute has been raised for your order ${order.productName}. You have 24 hours to provide proof of delivery.`,
                                type: "order",
                                isRead: false,
                                createdAt: new Date().toISOString()
                              });
                            } catch (err) {
                              handleFirestoreError(err, OperationType.UPDATE, `orders/${order.id}`);
                            }
                          }}
                          className="w-full py-3 bg-amber-50 dark:bg-amber-900/10 text-amber-600 dark:text-amber-400 rounded-2xl font-bold text-xs hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-all flex items-center justify-center gap-2"
                        >
                          <AlertCircle className="w-3 h-3" />
                          Raise Dispute
                        </button>
                      )}

                      <button
                        onClick={() => handleClearIndividual(order)}
                        className="w-full py-3 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-2xl font-bold text-xs hover:bg-red-100 dark:hover:bg-red-900/20 transition-all flex items-center justify-center gap-2"
                      >
                        <Trash2 className="w-3 h-3" />
                        Cancel Order
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

                <div className="flex flex-col gap-2 pt-2 col-span-2">
                  <button 
                    onClick={() => {
                      initializePayment({
                        onSuccess: onPaystackSuccess,
                        onClose: onPaystackClose
                      });
                    }}
                    className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    <CreditCard className="w-4 h-4" />
                    Pay via Paystack
                  </button>

                  <button 
                    onClick={async () => {
                      const tReference = "SIM_" + Date.now();
                      await onPaystackSuccess({ reference: tReference });
                    }}
                    className="w-full h-12 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 rounded-2xl font-black text-[9px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-1.5"
                  >
                    <Wallet className="w-3.5 h-3.5" />
                    Simulate Wallet / Bank Transfer (Saves Escrow)
                  </button>
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

      <AnimatePresence>
        {showIdVerification && verifyingOrder && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 lg:p-8 max-w-sm w-full shadow-2xl border border-slate-100 dark:border-slate-800 relative"
            >
              <button 
                type="button"
                onClick={() => {
                  setShowIdVerification(false);
                  setVerifyingOrder(null);
                  setProductIdInput("");
                  setVerificationError(null);
                }}
                className="absolute top-6 right-6 w-9 h-9 rounded-full bg-slate-50 dark:bg-slate-800/80 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all border border-slate-100 dark:border-slate-700/50 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6">
                <ShieldCheck className="w-8 h-8" />
              </div>

              <h3 className="text-xl font-black italic tracking-tight text-slate-900 dark:text-white mb-2">
                Verify Delivery Securely
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 font-medium leading-relaxed">
                To confirm receiving this order securely, please enter the correct **Product ID** of the item you ordered. This completes the escrow protection check.
              </p>

              <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl border border-indigo-100/30 dark:border-indigo-900/40 mb-6 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest leading-none mb-1">Product ID Required</p>
                  <p className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 select-all">{verifyingOrder.productId}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(verifyingOrder.productId);
                  }}
                  className="p-1 px-2 bg-white dark:bg-slate-800 hover:bg-slate-100 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 shadow-sm active:scale-95"
                >
                  <Copy className="w-3 h-3" /> Copy
                </button>
              </div>

              <form onSubmit={handleVerifyProductIdAndConfirm} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                    Enter Product ID
                  </label>
                  <input
                    type="text"
                    required
                    value={productIdInput}
                    onChange={(e) => {
                      setProductIdInput(e.target.value);
                      setVerificationError(null);
                    }}
                    placeholder="e.g. prod_abc123"
                    className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/70 outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 font-medium text-xs text-slate-900 dark:text-white font-mono"
                  />
                  {verificationError && (
                    <motion.p 
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-[10px] font-bold text-red-600 dark:text-red-400 mt-1.5 pl-1 flex items-center gap-1"
                    >
                      <AlertCircle className="w-3.5 h-3.5" />
                      {verificationError}
                    </motion.p>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowIdVerification(false);
                      setVerifyingOrder(null);
                      setProductIdInput("");
                      setVerificationError(null);
                    }}
                    className="flex-1 h-12 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-850 text-slate-500 dark:text-slate-400 rounded-xl font-bold text-xs transition-all border border-slate-100 dark:border-slate-700/40"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={confirmingDelivery || !productIdInput.trim()}
                    className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/10 active:scale-[0.98] border-none outline-none"
                  >
                    {confirmingDelivery ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    Verify & Confirm
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <LiveRiderTrackingModal
        order={trackingRiderOrder}
        progress={trackingProgress}
        onClose={() => setTrackingRiderOrder(null)}
      />
    </div>
  );
}
