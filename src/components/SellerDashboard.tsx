import React from "react";
import { auth, db } from "../firebase";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc, 
  setDoc, 
  deleteDoc,
  orderBy,
  addDoc,
  getDocs,
  getDoc,
  limit,
  increment
} from "firebase/firestore";
import { Product, Order, UserProfile } from "../types";
import { NIGERIAN_CAMPUSES } from "../constants/campuses";
import ReferralDashboard from "./ReferralDashboard";
import LiveRiderTrackingModal from "./LiveRiderTrackingModal";
import SalesAnalytics from "./SalesAnalytics";
import { 
  LayoutDashboard, 
  LayoutGrid,
  CalendarDays,
  TrendingUp, 
  Clock, 
  Package, 
  CheckCircle, 
  XCircle, 
  Loader2,
  DollarSign,
  Truck,
  ArrowUpRight,
  ShoppingBag,
  ExternalLink,
  Plus,
  X,
  Trash2,
  Edit2,
  Wallet,
  User,
  MessageCircle,
  Instagram,
  Linkedin,
  Upload,
  Save,
  ChevronRight,
  AlertCircle,
  UserCircle,
  ArrowRight,
  Sparkles,
  Zap,
  Check,
  Globe,
  Star,
  RefreshCw,
  Image as ImageIcon,
  PieChart as PieIcon,
  BarChart3,
  Users,
  Layout,
  MousePointer2,
  ShieldCheck,
  RotateCcw,
  Store,
  Share2,
  ArrowLeft,
  LogOut,
  CreditCard,
  Bell,
  Info,
  MapPin,
  Phone,
  Tag,
  Navigation
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  PieChart, 
  Pie,
  Legend
} from 'recharts';
import { GoogleGenAI } from "@google/genai";
import { APIProvider, Map as GoogleMap, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';

const GOOGLE_MAPS_API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  "";

import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { handleFirestoreError, OperationType, getFirestoreErrorMessage } from "../lib/firebase-errors";
import { compressImage } from "../lib/imageUtils";
import { NIGERIAN_STATES, STATE_CITIES, NIGERIAN_LGAS, CITY_STREETS } from "../constants/locations";
import ProfileSettings from "./ProfileSettings";
import StorefrontSettingsTab from "./StorefrontSettingsTab";
import ReceiptModal from "./ReceiptModal";


interface SellerDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  onBack?: () => void;
  initialSubTab?: string;
  initialProductType?: "good" | "service";
  initialEditingProduct?: any;
  onClearEditingProduct?: () => void;
}

export default function SellerDashboard({ 
  isOpen, 
  onClose, 
  onBack, 
  initialSubTab = "overview", 
  initialProductType = "good",
  initialEditingProduct,
  onClearEditingProduct
}: SellerDashboardProps) {
  const [activeSubTab, setActiveSubTab] = React.useState(initialSubTab);

  React.useEffect(() => {
    setActiveSubTab(initialSubTab);
  }, [initialSubTab]);

  const [orders, setOrders] = React.useState<Order[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [payouts, setPayouts] = React.useState<any[]>([]);
  const [analytics, setAnalytics] = React.useState<any[]>([]);
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [currentUser, setCurrentUser] = React.useState<UserProfile | null>(null);
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(initialEditingProduct || null);

  React.useEffect(() => {
    if (initialEditingProduct) {
      setEditingProduct(initialEditingProduct);
      setActiveSubTab("add-product");
      if (onClearEditingProduct) {
        onClearEditingProduct();
      }
    }
  }, [initialEditingProduct]);
  const [productToDelete, setProductToDelete] = React.useState<string | null>(null);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = React.useState(false);
  const [showClearOrdersConfirm, setShowClearOrdersConfirm] = React.useState(false);
  const [showClearAllDataConfirm, setShowClearAllDataConfirm] = React.useState(false);
  const [showPermanentDeleteConfirm, setShowPermanentDeleteConfirm] = React.useState(false);
  const [clearingOrders, setClearingOrders] = React.useState(false);
  const [restoringProduct, setRestoringProduct] = React.useState<string | null>(null);
  const [showCompleteProfile, setShowCompleteProfile] = React.useState(false);
  const [productActiveType, setProductActiveType] = React.useState<"all" | "good" | "service" | "event">("all");

  // Inert stubs for deactivated offline receipt modal
  const setShowOfflineReceiptGenerator = (val: boolean) => {};
  const handleCreateOfflineReceipt = (e: any) => {};
  const offlineCustomerName = "";
  const setOfflineCustomerName = (val: string) => {};
  const offlineCustomerPhone = "";
  const setOfflineCustomerPhone = (val: string) => {};
  const offlineProductName = "";
  const setOfflineProductName = (val: string) => {};
  const offlineProductPrice = "";
  const setOfflineProductPrice = (val: string) => {};
  const offlineProductQty = "1";
  const setOfflineProductQty = (val: string) => {};
  const offlineTargetAccount = "";
  const setOfflineTargetAccount = (val: string) => {};
  const offlinePaymentMethod = "pod" as "online" | "pod";
  const setOfflinePaymentMethod = (val: any) => {};
  const offlineDeliveryType = "pickup" as "pickup" | "delivery";
  const setOfflineDeliveryType = (val: any) => {};
  const offlineDeliveryAddress = "";
  const setOfflineDeliveryAddress = (val: string) => {};
  const offlineSubmitting = false;



  React.useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  React.useEffect(() => {
    const handleSwitchTab = (e: any) => {
      setActiveSubTab(e.detail);
    };
    const handleEditProductEvent = (e: any) => {
      if (e.detail) {
        setEditingProduct(e.detail);
        setActiveSubTab("add-product");
      }
    };
    window.addEventListener('switch-seller-tab', handleSwitchTab);
    window.addEventListener('edit-seller-product', handleEditProductEvent);
    return () => {
      window.removeEventListener('switch-seller-tab', handleSwitchTab);
      window.removeEventListener('edit-seller-product', handleEditProductEvent);
    };
  }, []);

  React.useEffect(() => {
    if (!auth.currentUser) return;

    // Fetch user profile
    const unsubscribeUser = onSnapshot(doc(db, "users", auth.currentUser.uid), (snapshot) => {
      if (snapshot.exists()) setCurrentUser(snapshot.data() as UserProfile);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${auth.currentUser?.uid}`);
    });

    // Listen to seller's orders
    const ordersQ = query(
      collection(db, "orders"),
      where("sellerId", "==", auth.currentUser.uid)
    );

    // Listen to seller's products
    const productsQ = query(
      collection(db, "products"),
      where("sellerId", "==", auth.currentUser.uid)
    );

    const unsubscribeOrders = onSnapshot(ordersQ, (snapshot) => {
      const ordersData = Array.from(new Map(snapshot.docs.map(doc => {
        const d = { id: doc.id, ...doc.data() };
        return [d.id, d];
      })).values())
        .filter((o: any) => !o.hiddenFromSeller)
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) as Order[];
      setOrders(ordersData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "orders");
    });

    const unsubscribeProducts = onSnapshot(productsQ, (snapshot) => {
      const productsData = Array.from(new Map(snapshot.docs.map(doc => {
        const d = { id: doc.id, ...doc.data() } as Product;
        return [d.id, d];
      })).values())
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setProducts(productsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "products");
    });

    // Listen to seller's analytics
    const analyticsQ = query(
      collection(db, "analytics"),
      where("sellerId", "==", auth.currentUser.uid)
    );

    const unsubscribeAnalytics = onSnapshot(analyticsQ, (snapshot) => {
      const analyticsData = Array.from(new Map(snapshot.docs.map(doc => {
        const d = { id: doc.id, ...doc.data() };
        return [d.id, d];
      })).values())
        .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setAnalytics(analyticsData);
    }, (error) => {
      console.error("Analytics fetch error:", error);
    });

    // Listen to payout requests
    const payoutsQ = query(
      collection(db, "payoutRequests"),
      where("sellerId", "==", auth.currentUser.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribePayouts = onSnapshot(payoutsQ, (snapshot) => {
      const payoutsData = Array.from(new Map(snapshot.docs.map(doc => {
        const d = { id: doc.id, ...doc.data() };
        return [d.id, d];
      })).values());
      setPayouts(payoutsData);
    }, (error) => {
      console.error("Payouts fetch error:", error);
    });

    // Listen to seller notifications
    const notificationsQ = query(
      collection(db, "notifications"),
      where("userId", "==", auth.currentUser.uid),
      orderBy("createdAt", "desc"),
      limit(5)
    );

    const unsubscribeNotifications = onSnapshot(notificationsQ, (snapshot) => {
      const data = Array.from(new Map(snapshot.docs.map(doc => {
        const d = { id: doc.id, ...doc.data() };
        return [d.id, d];
      })).values()) as any[];
      setNotifications(data);
    }, (error) => {
      console.error("Seller notifications fetch error:", error);
    });

    return () => {
      unsubscribeUser();
      unsubscribeOrders();
      unsubscribeProducts();
      unsubscribeAnalytics();
      unsubscribePayouts();
      unsubscribeNotifications();
    };
  }, [auth.currentUser?.uid]);

  const handleMarkNotifRead = async (id: string) => {
    try {
      await updateDoc(doc(db, "notifications", id), { isRead: true });
    } catch (error) {
      console.error("Error marking notification read:", error);
    }
  };

  const handleMarkAllNotifsRead = async () => {
    try {
      const unread = notifications.filter(n => !n.isRead);
      await Promise.all(unread.map(n => updateDoc(doc(db, "notifications", n.id), { isRead: true })));
    } catch (error) {
      console.error("Error marking all notifications read:", error);
    }
  };

  React.useEffect(() => {
    // Show complete profile popup if profile is incomplete
    if (currentUser && currentUser.profileCompleted === false) {
      const timer = setTimeout(() => setShowCompleteProfile(true), 1500);
      return () => clearTimeout(timer);
    } else if (currentUser?.profileCompleted) {
      setShowCompleteProfile(false);
    }
  }, [currentUser?.profileCompleted]);

  const [requestingPayout, setRequestingPayout] = React.useState(false);

  const stats = React.useMemo(() => {
    const activeProds = products.filter(p => !p.isDeleted);
    // Include completed, acquired (tickets), and delivered in earnings
    const completed = orders.filter(o => o.status === "completed" || o.status === "acquired" || o.status === "delivered");
    const pending = orders.filter(o => o.status === "pending" || o.status === "Pending Seller Acceptance" || o.status === "accepted" || o.status === "out_for_delivery");
    const totalSales = completed.reduce((acc, o) => acc + o.totalPrice, 0);
    const netEarnings = completed.reduce((acc, o) => acc + (o.sellerEarnings || (o.totalPrice * (o.type === "service" ? 0.94 : 0.95))), 0);
    
    // Only completed orders whose escrow payouts are NOT yet released are eligible for manual withdrawal
    const unpaidCompleted = completed.filter(o => o.payoutStatus !== "released");
    const availableEarningsPool = unpaidCompleted.reduce((acc, o) => acc + (o.sellerEarnings || (o.totalPrice * (o.type === "service" ? 0.94 : 0.95))), 0);

    const withdrawnAmount = payouts
      .filter(p => p.status === "approved" || p.status === "paid")
      .reduce((acc, p) => acc + p.amount, 0);
    
    const pendingPayoutAmount = payouts
      .filter(p => p.status === "pending")
      .reduce((acc, p) => acc + p.amount, 0);

    const availablePayout = Math.max(0, availableEarningsPool - withdrawnAmount - pendingPayoutAmount);

    return {
      totalSales,
      netEarnings,
      availablePayout,
      withdrawnAmount,
      pendingCount: pending.length,
      activeProducts: activeProds.length,
      completedCount: completed.length
    };
  }, [orders, products, payouts]);


  const [currentTime, setCurrentTime] = React.useState(Date.now());

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  React.useEffect(() => {
    orders.forEach(async (order) => {
      if ((order.status === "Out To Pickup Station" || order.status === "Out For Delivery" || order.status === "accepted") && order.acceptedAt) {
        const acceptedTime = new Date(order.acceptedAt).getTime();
        const duration = (order.countdownDuration || 120) * 1000;
        const remainingMs = (acceptedTime + duration) - currentTime;
        if (remainingMs <= 0) {
          try {
            await updateDoc(doc(db, "orders", order.id), {
              status: "Ready For Pickup",
              updatedAt: new Date().toISOString()
            });
          } catch (err) {
            console.error("Auto transition to Ready For Pickup failed:", err);
          }
        }
      }
    });
  }, [orders, currentTime]);

  const updateOrderStatus = async (orderId: string, status: string, order: Order) => {
    try {
      let finalStatus = status;
      if (status === "completed" && order.type === "service" && order.paymentMethod === "pod") {
        finalStatus = "awaiting_payment";
      }
      const updateData: any = { status: finalStatus };
      if (status === "accepted") {
        updateData.status = "out_for_delivery";
        updateData.acceptedAt = null;
      } else if (status === "start_dispatch") {
        updateData.status = order.deliveryType === "pickup" ? "Out To Pickup Station" : "Out For Delivery";
        updateData.acceptedAt = new Date().toISOString();
        updateData.countdownDuration = 120; // 120 seconds countdown
      }
      
      // Handle completion/payment logic
      const isTerminal = status === "completed" || status === "paid" || 
                         (status === "delivered" && order.paymentMethod === "online") ||
                         (status === "acquired" && order.paymentMethod === "online") ||
                         (status === "Order Delivered" && order.paymentMethod === "online") ||
                         (status === "Order Picked Up" && order.paymentMethod === "online");

      const isFinishing = status === "completed" || status === "delivered" || status === "acquired" || status === "paid" || status === "Order Delivered" || status === "Order Picked Up";
      
      if (isFinishing) {
        if (!order.deliveredAt) {
          updateData.deliveredAt = new Date().toISOString();
        }
        
        // If it's a finish state, mark as paid if it's online
        if (order.paymentMethod === "online" && (status === "delivered" || status === "acquired" || status === "Order Delivered" || status === "Order Picked Up")) {
           updateData.paymentStatus = "paid";
           updateData.status = "completed"; // Auto-complete online paid orders
        }
      }

      if (status === "paid" && (order.status === "delivered" || order.status === "acquired" || order.status === "Order Delivered" || order.status === "Order Picked Up" || order.status === "Ready For Pickup")) {
        updateData.paymentStatus = "paid";
        updateData.status = "completed";
      }
      
      // --- Referral Reward Logic ---
      // Only award if it reaches a terminal paid state (completed & paid)
      const willBeCompleted = updateData.status === "completed" || order.status === "completed";
      const willBePaid = updateData.paymentStatus === "paid" || order.paymentStatus === "paid";

      if (willBeCompleted) {
        if (!order.completedAt) {
          updateData.completedAt = new Date().toISOString();
        }
        if (!order.payoutStatus) {
          updateData.payoutStatus = "escrow";
        }
      }

      if (willBeCompleted && willBePaid && !order.referralCommissionAwarded) {
          if (order.buyerId) {
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
                      
                      // Mark as awarded in order updateData
                      updateData.referralCommissionAwarded = true;
                      
                      // 3. Notify referrer
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
            } catch (e) {
              console.error("Referral reward error:", e);
            }
          }
        }
        // --- End Referral Reward Logic ---
      
      if (status === "paid" && (order.status === "delivered" || order.status === "acquired")) {
        updateData.paymentStatus = "paid";
        updateData.status = "completed";
      }

      await updateDoc(doc(db, "orders", orderId), updateData);
      
      // Notify buyer
      await addDoc(collection(db, "notifications"), {
        userId: order.buyerId,
        title: status === "paid" ? "Payment Confirmed!" : `Order ${status.replace(/_/g, ' ')}!`,
        message: status === "paid" 
          ? `Seller confirmed payment for ${order.productName}. Your order is now completed.` 
          : `Your order for ${order.productName} is now ${status.replace(/_/g, ' ')}.`,
        type: "order",
        isRead: false,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const handleRequestPayout = async () => {
    if (!currentUser?.bankDetails?.accountNumber) {
      alert("Please set up your bank details in Settings first.");
      setActiveSubTab("settings");
      return;
    }

    if (stats.availablePayout <= 0) {
      alert("You don't have any earnings to withdraw yet.");
      return;
    }

    setRequestingPayout(true);
    try {
      await addDoc(collection(db, "payoutRequests"), {
        sellerId: auth.currentUser?.uid,
        sellerName: currentUser.displayName,
        amount: stats.availablePayout,
        bankDetails: currentUser.bankDetails,
        status: "pending",
        createdAt: new Date().toISOString()
      });

      await addDoc(collection(db, "notifications"), {
        userId: auth.currentUser?.uid,
        title: "Payout Requested",
        message: `Your payout request for ₦${stats.availablePayout.toLocaleString()} has been submitted.`,
        type: "payout",
        isRead: false,
        createdAt: new Date().toISOString()
      });

      alert("Payout request submitted successfully!");
      setActiveSubTab("payouts");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "payoutRequests");
    } finally {
      setRequestingPayout(false);
    }
  };

  const handleDisconnectPaystack = async () => {
    if (!currentUser) return;
    if (!confirm("Are you sure you want to disconnect your bank account? This will remove your saved payout details.")) return;
    
    setLoading(true);
    try {
      await updateDoc(doc(db, "users", currentUser.uid), {
        paystackConnected: false,
        bankDetails: null
      });
      alert("Bank account disconnected successfully.");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${currentUser.uid}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (productId: string) => {
    setProductToDelete(productId);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      // Soft delete: move to history
      await updateDoc(doc(db, "products", productToDelete), {
        isDeleted: true,
        deletedAt: new Date().toISOString()
      });
      setProductToDelete(null);
    } catch (error: any) {
      console.error("Delete product error:", error);
      setDeleteError(getFirestoreErrorMessage(error));
      handleFirestoreError(error, OperationType.UPDATE, `products/${productToDelete}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleRestoreProduct = async (productId: string) => {
    setRestoringProduct(productId);
    try {
      await updateDoc(doc(db, "products", productId), {
        isDeleted: false,
        deletedAt: null
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `products/${productId}`);
    } finally {
      setRestoringProduct(null);
    }
  };

  const confirmPermanentDelete = async () => {
    if (!productToDelete) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      // 1. Delete associated reviews
      const reviewsQ = query(collection(db, "reviews"), where("productId", "==", productToDelete));
      const reviewsSnap = await getDocs(reviewsQ);
      const deleteReviewPromises = reviewsSnap.docs.map(d => deleteDoc(d.ref));
      await Promise.all(deleteReviewPromises);

      // 2. Delete associated reports
      const reportsQ = query(collection(db, "reports"), where("productId", "==", productToDelete));
      const reportsSnap = await getDocs(reportsQ);
      const deleteReportPromises = reportsSnap.docs.map(d => deleteDoc(d.ref));
      await Promise.all(deleteReportPromises);

      // 2.1 Delete associated event plan if it exists
      const plansQ = query(
        collection(db, "event_plans"),
        where("listingId", "==", productToDelete),
        where("userId", "==", auth.currentUser?.uid || "")
      );
      const plansSnap = await getDocs(plansQ);
      const deletePlanPromises = plansSnap.docs.map(d => deleteDoc(d.ref));
      await Promise.all(deletePlanPromises);

      // 3. Delete the product itself
      await deleteDoc(doc(db, "products", productToDelete));
      setProductToDelete(null);
      setShowPermanentDeleteConfirm(false);
    } catch (error: any) {
      console.error("Permanent delete product error:", error);
      setDeleteError(getFirestoreErrorMessage(error));
      handleFirestoreError(error, OperationType.DELETE, `products/${productToDelete}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    if (product.category === "Events & Lifestyle") {
      const event = new CustomEvent('switch-to-event-planner', { detail: product.id });
      window.dispatchEvent(event);
      return;
    }
    setEditingProduct(product);
    setActiveSubTab("add-product");
  };

  const handleClearOrders = async () => {
    setClearingOrders(true);
    try {
      const promises = orders.map(order => 
        updateDoc(doc(db, "orders", order.id), { hiddenFromSeller: true })
      );
      await Promise.all(promises);
      setShowClearOrdersConfirm(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, "orders/clear-all");
    } finally {
      setClearingOrders(false);
    }
  };

  const handleConfirmReceived = async (payoutId: string) => {
    try {
      await updateDoc(doc(db, "payoutRequests", payoutId), {
        confirmedReceived: true,
        receivedAt: new Date().toISOString()
      });
      alert("Payout confirmed as received! Thank you.");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `payoutRequests/${payoutId}`);
    }
  };

  const clearAllData = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      // Delete products
      const productsQ = query(collection(db, "products"), where("sellerId", "==", auth.currentUser.uid));
      const productsSnap = await getDocs(productsQ);
      
      // For each product, also delete reviews and reports
      for (const productDoc of productsSnap.docs) {
        const reviewsQ = query(collection(db, "reviews"), where("productId", "==", productDoc.id));
        const reviewsSnap = await getDocs(reviewsQ);
        await Promise.all(reviewsSnap.docs.map(d => deleteDoc(d.ref)));

        const reportsQ = query(collection(db, "reports"), where("productId", "==", productDoc.id));
        const reportsSnap = await getDocs(reportsQ);
        await Promise.all(reportsSnap.docs.map(d => deleteDoc(d.ref)));
        
        await deleteDoc(productDoc.ref);
      }
      
      // Delete orders
      const ordersQ = query(collection(db, "orders"), where("sellerId", "==", auth.currentUser.uid));
      const ordersSnap = await getDocs(ordersQ);
      await Promise.all(ordersSnap.docs.map(d => deleteDoc(d.ref)));
      
      setShowClearAllDataConfirm(false);
      alert("All products and orders deleted successfully.");
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, "seller_data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600 dark:text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center gap-4">
        {onBack && (
          <button 
            onClick={onBack}
            className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:scale-105 transition-all text-slate-600 dark:text-slate-400 group"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </button>
        )}
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Seller Dashboard</h2>
          <p className="text-sm text-slate-500 font-medium tracking-tight">Manage your shop, products, and earnings</p>
        </div>
      </div>
      
      {/* Sub Navigation / Back to Hub */}
      {activeSubTab !== "overview" ? (
        <button 
          onClick={() => {
            setActiveSubTab("overview");
            if (onClearEditingProduct) {
              onClearEditingProduct();
            }
          }} 
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/10 outline-none rounded-xl cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-950/40 transition-all mb-4 self-start"
        >
          <ArrowLeft className="w-4 h-4" /> 
          Back to Seller Hub
        </button>
      ) : null}

      <AnimatePresence mode="wait">
        {productToDelete && !showPermanentDeleteConfirm && (
          <div key="delete-modal-overlay" className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              key="delete-modal-content"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl border border-slate-100 dark:border-slate-800"
            >
              <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center text-amber-600 dark:text-amber-500 mx-auto mb-6">
                <Clock className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white text-center mb-2">Move to Trash?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-8">This product will be moved to the <strong>Trash (History)</strong> tab. You can restore it later if needed.</p>
              
              {deleteError && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl text-red-600 dark:text-red-400 text-xs font-bold">
                  {deleteError}
                </div>
              )}

              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    setProductToDelete(null);
                    setDeleteError(null);
                  }}
                  disabled={deleteLoading}
                  className="flex-1 py-4 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete}
                  disabled={deleteLoading}
                  className="flex-1 py-4 bg-amber-600 text-white rounded-2xl font-bold text-sm hover:bg-amber-700 transition-all shadow-lg shadow-amber-100 dark:shadow-none flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Move to Trash"}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {activeSubTab === "overview" && (
          <motion.div 
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white font-display">Store Overview</h2>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Track your performance and earnings</p>
              </div>
              <div className="flex items-center gap-3">
                {currentUser?.state !== "Logistics Partner" && (
                  <button 
                    onClick={() => {
                      const event = new CustomEvent('view-seller-store', { detail: currentUser?.uid });
                      window.dispatchEvent(event);
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl font-bold text-sm shadow-xl border border-slate-100 dark:border-slate-800 hover:scale-105 active:scale-95 transition-all"
                  >
                    <Store className="w-4 h-4" />
                    <span className="hidden sm:inline">View Storefront</span>
                  </button>
                )}
                <button 
                  onClick={() => setActiveSubTab("payouts")}
                  className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white dark:bg-slate-800 rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all active:scale-95 border border-transparent dark:border-slate-700"
                >
                  <Wallet className="w-4 h-4" />
                  Request Payout
                </button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Available Balance" value={`₦${stats.availablePayout.toLocaleString()}`} icon={Wallet} trend="Available" color="purple" />
              <StatCard label="Total Net Earnings" value={`₦${stats.netEarnings.toLocaleString()}`} icon={DollarSign} color="indigo" />
              <StatCard label="Pending Orders" value={stats.pendingCount.toString()} icon={Clock} color="amber" />
              <StatCard label="Sales Completed" value={stats.completedCount.toString()} icon={CheckCircle} color="emerald" />
            </div>

            {/* Referral Program Banner */}
            <div className="bg-brand-gradient p-8 rounded-[2.5rem] shadow-2xl shadow-purple-500/20 text-white relative overflow-hidden group">
               <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                 <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md">
                       <Share2 className="w-3 h-3" />
                       Referral Program
                    </div>
                    <h3 className="text-2xl font-black italic tracking-tighter !text-white">Invite Friends, Earn Commissions</h3>
                    <p className="text-purple-50 font-medium max-w-xl">
                       Earn 1.3% of platform commission on every successful purchase made with your code.
                    </p>
                 </div>
                 <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="px-4 py-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 font-medium font-mono text-xs text-white/90 truncate max-w-xs sm:max-w-sm">
                      {`${window.location.origin}/?ref=${(currentUser?.referralCode && currentUser.referralCode !== "---") ? currentUser.referralCode : "S3U8K9"}`}
                    </div>
                    <button 
                      type="button"
                      onClick={() => {
                        const code = (currentUser?.referralCode && currentUser.referralCode !== "---") ? currentUser.referralCode : "S3U8K9";
                        const link = `${window.location.origin}/?ref=${code}`;
                        navigator.clipboard.writeText(link);
                        alert("Referral link copied to clipboard!");
                      }}
                      className="px-6 py-3.5 bg-white text-purple-600 rounded-2xl font-black text-xs uppercase tracking-wider shadow-xl hover:scale-105 active:scale-95 transition-all shrink-0 cursor-pointer"
                    >
                      Copy Link
                    </button>
                 </div>
               </div>
               <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-white/20 transition-all duration-1000" />
            </div>

            {/* Handcrafted Mobile Quick Links Grid */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500 ml-1">Shop Management Shortcuts</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                 {[
                  { id: "analytics", label: "Sales Analytics", icon: TrendingUp, desc: "Revenue & period trends", color: "from-blue-600 to-indigo-600" },
                  { id: "add-product", label: "List Item", icon: Plus, desc: "Publish new good/service", color: "from-orange-500 to-amber-500" },
                  { id: "my-products", label: "My Products", icon: Package, desc: "Edit & update catalogs", color: "from-purple-500 to-indigo-500" },
                  { id: "orders", label: "Customer Orders", icon: ShoppingBag, desc: "Track sales & escrow", color: "from-blue-500 to-teal-500" },
                  { id: "payouts", label: "Withdrawals", icon: Wallet, desc: "Request payout of earnings", color: "from-emerald-500 to-green-500" },
                  ...(currentUser?.state !== "Logistics Partner" ? [{ id: "storefront", label: "Storefront View", icon: Store, desc: "See your public catalog", color: "from-pink-500 to-rose-500" }] : []),
                  { id: "referrals", label: "Referral Hub", icon: Users, desc: "Earn commission rewards", color: "from-indigo-500 to-cyan-500" },
                  { id: "history", label: "Trash & Archive", icon: Trash2, desc: "Restore deleted items", color: "from-slate-500 to-zinc-500" },
                  { id: "settings", label: "Edit Profile", icon: UserCircle, desc: "Update shop & pickup info", color: "from-amber-500 to-yellow-500" }
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        if (item.id === "settings") {
                          // Special dispatch to parent to go to Profile tab
                          const event = new CustomEvent('switch-seller-tab', { detail: 'settings' });
                          window.dispatchEvent(event);
                        } else if (item.id === "storefront") {
                          const event = new CustomEvent('view-seller-store', { detail: currentUser?.uid });
                          window.dispatchEvent(event);
                        } else {
                          setActiveSubTab(item.id);
                        }
                      }}
                      className="flex flex-col items-start p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-zinc-800 rounded-3xl hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-lg transition-all text-left cursor-pointer group relative overflow-hidden"
                    >
                      <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${item.color} text-white flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider block">{item.label}</span>
                      <span className="text-[9px] font-medium text-slate-400 dark:text-zinc-500 mt-1 leading-normal">{item.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              {/* Recent Orders Preview */}
              <div className="lg:col-span-1">
                <DashboardCard 
                  title="Recent Orders" 
                  count={orders.length}
                  action={
                    <button 
                      onClick={() => setActiveSubTab("orders")}
                      className="text-[11px] font-black text-indigo-650 dark:text-indigo-400 hover:text-indigo-700 hover:underline uppercase tracking-widest cursor-pointer bg-transparent border-none p-0"
                    >
                      View All
                    </button>
                  }
                >
                  <div className="space-y-4">
                    {orders.length === 0 ? (
                      <EmptyState icon={ShoppingBag} message="No orders yet" />
                    ) : (
                      orders.slice(0, 5).map((order) => (
                        <OrderRow 
                          key={`recent-${order.id}`} 
                          order={order} 
                          onUpdate={(id, status) => updateOrderStatus(id, status, order)} 
                          currentTime={currentTime}
                          currentUser={currentUser}
                        />
                      ))
                    )}
                    {orders.length > 5 && (
                      <button 
                        onClick={() => setActiveSubTab("orders")}
                        className="w-full mt-4 h-11 border border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl text-xs font-bold text-slate-500 dark:text-zinc-400 shadow-sm transition-colors cursor-pointer"
                      >
                        Show More Orders (+{orders.length - 5})
                      </button>
                    )}
                  </div>
                </DashboardCard>
              </div>

              {/* Recent Products Preview */}
              <div className="lg:col-span-1">
                <DashboardCard 
                  title="My Listings" 
                  count={products.filter(p => !p.isDeleted).length}
                  action={
                    <button 
                      onClick={() => setActiveSubTab("my-products")}
                      className="text-[11px] font-black text-indigo-650 dark:text-indigo-400 hover:text-indigo-700 hover:underline uppercase tracking-widest cursor-pointer bg-transparent border-none p-0"
                    >
                      View All
                    </button>
                  }
                >
                  <div className="space-y-4">
                    {products.filter(p => !p.isDeleted).length === 0 ? (
                      <EmptyState icon={Package} message="No products listed" />
                    ) : (
                      products.filter(p => !p.isDeleted).slice(0, 3).map((product) => (
                        <ProductRow 
                          key={`recent-prod-${product.id}`} 
                          product={product} 
                          onDelete={deleteProduct} 
                          onEdit={handleEdit} 
                        />
                      ))
                    )}
                    {products.filter(p => !p.isDeleted).length > 3 && (
                      <button 
                        onClick={() => setActiveSubTab("my-products")}
                        className="w-full mt-4 h-11 border border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl text-xs font-bold text-slate-500 dark:text-zinc-400 shadow-sm transition-colors cursor-pointer"
                      >
                        Show More Listings (+{products.filter(p => !p.isDeleted).length - 3})
                      </button>
                    )}
                  </div>
                </DashboardCard>
              </div>

              {/* Store Alerts & Updates Feed */}
              <div className="lg:col-span-1">
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-8 shadow-sm h-full flex flex-col">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h4 className="text-lg font-bold text-slate-900 dark:text-white">Store Alerts</h4>
                      <p className="text-[10px] text-slate-400 font-medium">Real-time status updates</p>
                    </div>
                    {notifications.filter(n => !n.isRead).length > 0 ? (
                      <button 
                        onClick={handleMarkAllNotifsRead}
                        className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 hover:underline uppercase tracking-widest"
                      >
                        Clear ({notifications.filter(n => !n.isRead).length})
                      </button>
                    ) : (
                      <span className="text-[10px] font-black text-slate-400 bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-full uppercase tracking-wider">
                        All clear
                      </span>
                    )}
                  </div>

                  <div className="space-y-3 flex-1 overflow-y-auto max-h-[400px] scrollbar-hide">
                    {notifications.length === 0 ? (
                      <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center h-full">
                        <Bell className="w-8 h-8 mb-3 text-slate-200 dark:text-slate-800" />
                        <span className="text-xs font-semibold text-slate-400">No recent store alerts</span>
                      </div>
                    ) : (
                      notifications.map((notif, idx) => {
                        const styleMap: any = {
                          order: "bg-blue-50 dark:bg-blue-900/10 border-blue-100/50 dark:border-blue-950/50 text-blue-800 dark:text-blue-300",
                          payout: "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100/50 dark:border-emerald-950/50 text-emerald-800 dark:text-emerald-300",
                          welcome: "bg-purple-50 dark:bg-purple-900/10 border-purple-100/50 dark:border-purple-950/50 text-purple-705 dark:text-purple-355",
                          system: "bg-amber-50 dark:bg-amber-900/10 border-amber-100/50 dark:border-amber-950/50 text-amber-800 dark:text-amber-300",
                        };

                        return (
                          <div 
                            key={`seller-notif-${notif.id || idx}-${idx}`} 
                            className={cn(
                              "p-4 rounded-3xl border text-left transition-all relative flex flex-col gap-1",
                              notif.isRead 
                                ? "bg-slate-50/50 dark:bg-slate-800/10 border-slate-100/50 dark:border-slate-800/50 text-slate-500" 
                                : "bg-white dark:bg-slate-900 border-indigo-100 dark:border-indigo-950/50 shadow-md shadow-indigo-50/30 dark:shadow-none"
                            )}
                          >
                            {!notif.isRead && (
                              <div className="absolute top-4 right-4 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                            )}
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className={cn("text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg shrink-0", styleMap[notif.type] || "bg-slate-100 text-slate-700")}>
                                {notif.type}
                              </span>
                              <span className={cn("text-xs font-black truncate text-slate-900 dark:text-slate-100", notif.isRead && "opacity-75 font-bold")}>
                                {notif.title}
                              </span>
                            </div>
                            <p className="text-[10px] leading-relaxed select-none">{notif.message}</p>
                            {!notif.isRead && (
                              <button 
                                onClick={() => handleMarkNotifRead(notif.id)}
                                className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 hover:underline text-left self-start mt-1"
                              >
                                Mark Read
                              </button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Embedded Sales Analytics Section inside Store Overview */}
            <div className="pt-4">
              <SalesAnalytics orders={orders} products={products} />
            </div>
          </motion.div>
        )}

        {activeSubTab === "analytics" && (
          <motion.div 
            key="analytics"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <SalesAnalytics orders={orders} products={products} />
          </motion.div>
        )}

        {activeSubTab === "add-product" && (
          <motion.div 
            key="add-product"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <AddProductForm 
              onSuccess={() => {
                setActiveSubTab("my-products");
                setEditingProduct(null);
              }} 
              currentUser={currentUser} 
              editingProduct={editingProduct}
              initialType={initialProductType}
            />
          </motion.div>
        )}

        {activeSubTab === "my-products" && (
          <motion.div 
            key="my-products"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl w-fit">
                {[
                  { id: "all", label: "All Items", icon: LayoutGrid },
                  { id: "good", label: "Goods", icon: Package }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setProductActiveType(tab.id as any)}
                    className={cn(
                      "flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                      productActiveType === tab.id 
                        ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-lg" 
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    )}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setActiveSubTab("add-product")}
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-indigo-100 dark:shadow-none"
              >
                <Plus className="w-4 h-4" />
                Add New
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.filter(p => {
                const isDeleted = p.isDeleted;
                if (isDeleted) return false;
                if (productActiveType === "all") return true;
                if (productActiveType === "good") return p.type === "good" && p.category !== "Events & Lifestyle";
                if (productActiveType === "service") return p.type === "service" && p.category !== "Events & Lifestyle";
                if (productActiveType === "event") return p.category === "Events & Lifestyle";
                return true;
              }).length === 0 ? (
                <div className="col-span-full py-20 text-center bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 transition-colors">
                  <Package className="w-16 h-16 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">No items found</h3>
                  <p className="text-sm text-slate-500">Try changing the category or list a new item.</p>
                </div>
              ) : (
                products.filter(p => {
                  const isDeleted = p.isDeleted;
                  if (isDeleted) return false;
                  if (productActiveType === "all") return true;
                  if (productActiveType === "good") return p.type === "good" && p.category !== "Events & Lifestyle";
                  if (productActiveType === "service") return p.type === "service" && p.category !== "Events & Lifestyle";
                  if (productActiveType === "event") return p.category === "Events & Lifestyle";
                  return true;
                }).map((product) => (
                  <ProductGridItem 
                    key={`grid-${product.id}`} 
                    product={product} 
                    onDelete={deleteProduct} 
                    onEdit={handleEdit} 
                  />
                ))
              )}
            </div>
          </motion.div>
        )}

        {activeSubTab === "history" && (
          <motion.div 
            key="history"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Product History (Trash)</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Manage your deleted products. You can restore them or delete permanently.</p>
              </div>
            </div>

            {products.filter(p => p.isDeleted).length === 0 ? (
              <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 transition-colors">
                <Clock className="w-16 h-16 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Trash is empty</h3>
                <p className="text-sm text-slate-500 mt-1">Deleted products will appear here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.filter(p => p.isDeleted).map((product) => (
                  <ProductGridItem 
                    key={`trash-${product.id}`} 
                    product={product} 
                    onDelete={(id: string) => {
                      setProductToDelete(id);
                      setShowPermanentDeleteConfirm(true);
                    }} 
                    onRestore={(id: string) => handleRestoreProduct(id)}
                    isRestoring={restoringProduct === product.id}
                    isDeletedView 
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeSubTab === "orders" && (
          <motion.div 
            key="orders"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Order Management</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">View real-time customer purchases and track order deliveries.</p>
              </div>
              <div className="flex items-center gap-2">
                {orders.length > 0 && (
                  <button 
                    type="button"
                    onClick={() => setShowClearOrdersConfirm(true)}
                    className="flex items-center gap-1.5 px-4 h-10 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors uppercase tracking-widest border border-red-50 dark:border-red-900/20"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Clear All
                  </button>
                )}
              </div>
            </div>
            {orders.length === 0 ? (
              <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 transition-colors">
                <ShoppingBag className="w-16 h-16 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">No orders yet</h3>
              </div>
            ) : (
              orders.map((order) => (
                <OrderRow 
                  key={`full-${order.id}`} 
                  order={order} 
                  onUpdate={(id, status) => updateOrderStatus(id, status, order)} 
                  full 
                  currentTime={currentTime}
                  currentUser={currentUser}
                />
              ))
            )}
          </motion.div>
        )}

        {activeSubTab === "payouts" && (
          <motion.div 
            key="payouts"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Payout History</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Track your earnings withdrawals and their status.</p>
              </div>
              <div className="flex items-center gap-3">
                {currentUser?.paystackConnected ? (
                  <button 
                    onClick={handleDisconnectPaystack}
                    className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-2xl font-bold text-sm hover:bg-red-100 transition-all active:scale-95 border border-red-100 dark:border-red-900/10"
                  >
                    <LogOut className="w-4 h-4" />
                    Disconnect Account
                  </button>
                ) : (
                  <button 
                    onClick={() => setActiveSubTab("settings")}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-50 text-indigo-600 rounded-2xl font-bold text-sm hover:bg-indigo-100 transition-all active:scale-95 border border-indigo-100 dark:border-indigo-900/10"
                  >
                    <CreditCard className="w-4 h-4" />
                    Connect Paystack
                  </button>
                )}
                <button 
                  onClick={handleRequestPayout}
                  disabled={requestingPayout || stats.availablePayout <= 0 || !currentUser?.paystackConnected}
                  className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-indigo-200 dark:shadow-none"
                >
                  {requestingPayout ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Wallet className="w-4 h-4" />
                  )}
                  Request New Payout
                </button>
              </div>
            </div>

            {currentUser?.paystackConnected ? (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/50 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-800 rounded-xl flex items-center justify-center text-emerald-600">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-emerald-900 dark:text-emerald-400">Paystack Connected</p>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-500 font-medium">{currentUser.bankDetails?.bankName} • {currentUser.bankDetails?.accountNumber}</p>
                  </div>
                </div>
                <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Active</div>
              </div>
            ) : (
              <div className="p-6 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/50 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-center sm:text-left">
                  <div className="w-12 h-12 bg-amber-100 dark:bg-amber-800 rounded-2xl flex items-center justify-center text-amber-600 flex-shrink-0">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-amber-900 dark:text-amber-400">Bank Account Not Connected</p>
                    <p className="text-xs text-amber-600 dark:text-amber-500 font-medium">You need to connect your Paystack account to withdraw your earnings.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveSubTab("settings")}
                  className="px-6 py-3 bg-amber-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-amber-700 transition-all shadow-lg shadow-amber-100 dark:shadow-none whitespace-nowrap"
                >
                  Setup Payout Account
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
               <div className="p-6 bg-emerald-50 dark:bg-emerald-900/10 rounded-3xl border border-emerald-100 dark:border-emerald-900/20">
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Total Earned</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">₦{stats.netEarnings.toLocaleString()}</p>
               </div>
               <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-3xl border border-blue-100 dark:border-blue-900/20">
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Already Withdrawn</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">₦{stats.withdrawnAmount.toLocaleString()}</p>
               </div>
               <div className="p-6 bg-indigo-50 dark:bg-indigo-900/10 rounded-3xl border border-indigo-100 dark:border-indigo-900/20">
                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Available for Payout</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">₦{stats.availablePayout.toLocaleString()}</p>
               </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-50 dark:border-slate-800">
                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date Requested</th>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Bank Details</th>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                      {payouts.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-8 py-20 text-center text-slate-400 font-medium">
                            No payout requests found.
                          </td>
                        </tr>
                      ) : (
                        payouts.map((payout, pIdx) => (
                          <tr key={`payout-${payout.id}-${pIdx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="px-8 py-5">
                               <div className="flex flex-col">
                                  <span className="text-sm font-bold text-slate-900 dark:text-white">{new Date(payout.createdAt).toLocaleDateString()}</span>
                                  <span className="text-[10px] text-slate-400">{new Date(payout.createdAt).toLocaleTimeString()}</span>
                               </div>
                            </td>
                            <td className="px-8 py-5">
                               <span className="text-sm font-black text-slate-900 dark:text-white">₦{payout.amount.toLocaleString()}</span>
                            </td>
                            <td className="px-8 py-5">
                               <div className="flex flex-col">
                                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{payout.bankDetails.bankName}</span>
                                  <span className="text-[10px] text-slate-400 tracking-wider">Account: {payout.bankDetails.accountNumber}</span>
                               </div>
                            </td>
                            <td className="px-8 py-5">
                               <div className={cn(
                                 "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest leading-none",
                                 payout.status === "paid" ? "bg-emerald-100 text-emerald-600" :
                                 payout.status === "approved" ? "bg-blue-100 text-blue-600" :
                                 payout.status === "rejected" ? "bg-red-100 text-red-600" :
                                 "bg-amber-100 text-amber-600"
                               )}>
                                  {payout.status || "pending"}
                               </div>
                            </td>
                            <td className="px-8 py-5 text-right">
                              {(payout.status !== "rejected" && !payout.confirmedReceived) && (
                                <button 
                                  onClick={() => handleConfirmReceived(payout.id)}
                                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-md active:scale-95"
                                >
                                  Confirm Payout
                                </button>
                              )}
                              {payout.confirmedReceived && (
                                <div className="flex items-center justify-end gap-1.5 text-emerald-600">
                                   <CheckCircle className="w-3.5 h-3.5" />
                                   <span className="text-[10px] font-black uppercase tracking-widest">Received</span>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
               </div>
            </div>
          </motion.div>
        )}

        {activeSubTab === "referrals" && currentUser && (
          <motion.div 
            key="referrals"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <ReferralDashboard user={currentUser} />
          </motion.div>
        )}

        {activeSubTab === "storefront" && currentUser && (
          <motion.div 
            key="storefront"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <StorefrontSettingsTab user={currentUser} />
          </motion.div>
        )}

        {activeSubTab === "settings" && currentUser && (
          <motion.div 
            key="settings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <ProfileSettings user={currentUser} activeRole="seller" />
            
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-red-100 dark:border-red-900/30 p-8 shadow-sm">
              <h3 className="text-xl font-bold text-red-600 mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Danger Zone
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Deleting all your data will remove all your listed products and order history. This action is irreversible.
              </p>
              <button 
                onClick={() => setShowClearAllDataConfirm(true)}
                className="px-6 py-3 bg-red-600 text-white rounded-2xl font-bold text-sm hover:bg-red-700 transition-all shadow-lg shadow-red-100 dark:shadow-none flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Clear All My Products & Orders
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clear Orders Confirmation Modal */}
      <AnimatePresence>
        {showClearOrdersConfirm && (
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
              <h3 className="text-xl font-bold text-slate-900 dark:text-white text-center mb-2">Clear All Orders?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-8">This will hide all orders from your dashboard. This action is irreversible.</p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowClearOrdersConfirm(false)}
                  disabled={clearingOrders}
                  className="flex-1 py-4 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleClearOrders}
                  disabled={clearingOrders}
                  className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-bold text-sm hover:bg-red-700 transition-all shadow-lg shadow-red-100 dark:shadow-red-900/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {clearingOrders ? <Loader2 className="w-4 h-4 animate-spin" /> : "Clear All"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Offline Customer Receipt Generator Modal */}
      <AnimatePresence>
        {false && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Offline Receipt Generator</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Record on-campus walk-in sales and issue transaction receipts instantly.</p>
                </div>
                <button 
                  type="button" 
                  onClick={() => setShowOfflineReceiptGenerator(false)}
                  className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateOfflineReceipt} className="space-y-5">
                {/* Customer Info Section */}
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 dark:border-slate-800 pb-1">Customer Profile (Walk-In)</p>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Customer Name *</label>
                    <input 
                      type="text"
                      required
                      value={offlineCustomerName}
                      onChange={(e) => setOfflineCustomerName(e.target.value)}
                      placeholder="e.g. Samuel Adekunle"
                      className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Customer Phone Number (Optional)</label>
                    <input 
                      type="tel"
                      value={offlineCustomerPhone}
                      onChange={(e) => setOfflineCustomerPhone(e.target.value)}
                      placeholder="e.g. 08123456789"
                      className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Purchase Details Section */}
                <div className="space-y-3 pt-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 dark:border-slate-800 pb-1">Purchase Details</p>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Product / Service Name *</label>
                    <input 
                      type="text"
                      required
                      value={offlineProductName}
                      onChange={(e) => setOfflineProductName(e.target.value)}
                      placeholder="e.g. MTN 10GB Data Plan, Chicken Pie, Tutoring Draft"
                      className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Unit Price (₦) *</label>
                      <input 
                        type="number"
                        required
                        min="0"
                        step="any"
                        value={offlineProductPrice}
                        onChange={(e) => setOfflineProductPrice(e.target.value)}
                        placeholder="e.g. 1500"
                        className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Quantity *</label>
                      <input 
                        type="number"
                        required
                        min="1"
                        value={offlineProductQty}
                        onChange={(e) => setOfflineProductQty(e.target.value)}
                        placeholder="e.g. 1"
                        className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Target Account / Phone Number (Optional)</label>
                    <input 
                      type="text"
                      value={offlineTargetAccount}
                      onChange={(e) => setOfflineTargetAccount(e.target.value)}
                      placeholder="e.g. Top-up destination number, ID, or handle"
                      className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Fulfillment & Payment Settings */}
                <div className="space-y-3 pt-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 dark:border-slate-800 pb-1">Payment & Fulfillment</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">Payment Method</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setOfflinePaymentMethod("pod")}
                          className={`flex-1 h-10 rounded-xl text-xs font-bold transition-all ${
                            offlinePaymentMethod === "pod"
                              ? "bg-indigo-600 text-white shadow-md shadow-indigo-100 dark:shadow-none"
                              : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                          }`}
                        >
                          Cash / Transfer
                        </button>
                        <button
                          type="button"
                          onClick={() => setOfflinePaymentMethod("online")}
                          className={`flex-1 h-10 rounded-xl text-xs font-bold transition-all ${
                            offlinePaymentMethod === "online"
                              ? "bg-indigo-600 text-white shadow-md shadow-indigo-100 dark:shadow-none"
                              : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                          }`}
                        >
                          POS / Card
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">Delivery Arrangement</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setOfflineDeliveryType("pickup")}
                          className={`flex-1 h-10 rounded-xl text-xs font-bold transition-all ${
                            offlineDeliveryType === "pickup"
                              ? "bg-indigo-600 text-white shadow-md shadow-indigo-100 dark:shadow-none"
                              : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                          }`}
                        >
                          Picked Up
                        </button>
                        <button
                          type="button"
                          onClick={() => setOfflineDeliveryType("delivery")}
                          className={`flex-1 h-10 rounded-xl text-xs font-bold transition-all ${
                            offlineDeliveryType === "delivery"
                              ? "bg-indigo-600 text-white shadow-md shadow-indigo-100 dark:shadow-none"
                              : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                          }`}
                        >
                          Delivered
                        </button>
                      </div>
                    </div>
                  </div>
                  {offlineDeliveryType === "delivery" && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Delivery Destination Address</label>
                      <input 
                        type="text"
                        required
                        value={offlineDeliveryAddress}
                        onChange={(e) => setOfflineDeliveryAddress(e.target.value)}
                        placeholder="e.g. Jaja Hall, Room B12"
                        className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium outline-none focus:border-indigo-500"
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-50 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowOfflineReceiptGenerator(false)}
                    className="flex-1 py-3.5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    Discard
                  </button>
                  <button
                    type="submit"
                    disabled={offlineSubmitting}
                    className="flex-1 py-3.5 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 dark:shadow-none flex items-center justify-center gap-2"
                  >
                    {offlineSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Generate Receipt"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Clear All Data Confirmation Modal */}
      <AnimatePresence>
        {showClearAllDataConfirm && (
          <div key="clear-all-data-overlay" className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              key="clear-all-data-content"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl border border-slate-100 dark:border-slate-800"
            >
              <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center text-red-600 dark:text-red-500 mx-auto mb-6">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white text-center mb-2">Delete All Data?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-8">Are you sure you want to delete ALL your products and orders? This action is irreversible.</p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowClearAllDataConfirm(false)}
                  disabled={loading}
                  className="flex-1 py-4 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={clearAllData}
                  disabled={loading}
                  className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-bold text-sm hover:bg-red-700 transition-all shadow-lg shadow-red-100 dark:shadow-red-900/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete Everything"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Permanent Delete Confirmation Modal */}
      <AnimatePresence>
        {showPermanentDeleteConfirm && (
          <div key="perm-delete-overlay" className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              key="perm-delete-content"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl border border-slate-100 dark:border-slate-800"
            >
              <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center text-red-600 dark:text-red-500 mx-auto mb-6">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white text-center mb-2">Delete Permanently?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-4">
                This will irreversibly delete this product and all its reviews. <strong>This action cannot be undone.</strong>
              </p>
              
              {deleteError && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl text-red-600 dark:text-red-400 text-xs font-bold">
                  {deleteError}
                </div>
              )}

              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    setShowPermanentDeleteConfirm(false);
                    setProductToDelete(null);
                    setDeleteError(null);
                  }}
                  disabled={deleteLoading}
                  className="flex-1 py-4 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmPermanentDelete}
                  disabled={deleteLoading}
                  className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-bold text-sm hover:bg-red-700 transition-all shadow-lg shadow-red-100 dark:shadow-red-900/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete Forever"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Complete Profile Popup */}
      <AnimatePresence>
        {showCompleteProfile && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-800 relative overflow-hidden"
            >
              {/* Decorative Background */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500/5 rounded-full -ml-12 -mb-12" />

              <div className="relative z-10">
                <div className="w-20 h-20 bg-brand-gradient rounded-3xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 mx-auto mb-6">
                  <UserCircle className="w-10 h-10" />
                </div>
                
                <h3 className="text-2xl font-black text-slate-900 dark:text-white text-center mb-2 tracking-tight">Complete Your Profile</h3>
                <p className="text-slate-500 dark:text-slate-400 text-center mb-8 font-medium">
                  To start selling on SHOPIVERSITY, we need a few more details like your school and business location.
                </p>
                
                <div className="space-y-3">
                  <button 
                    onClick={() => {
                      setShowCompleteProfile(false);
                      setActiveSubTab("settings");
                    }}
                    className="w-full py-4 bg-brand-gradient text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 hover:shadow-indigo-300 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    Complete Now
                    <ArrowRight className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setShowCompleteProfile(false)}
                    className="w-full py-4 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-2xl font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                  >
                    Maybe Later
                  </button>
                </div>

                <div className="mt-6 flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <AlertCircle className="w-3 h-3" />
                  Required for listings & verification
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

function StatCard({ label, value, icon: Icon, trend, color }: any) {
  const colors: any = {
    indigo: "bg-purple-50 dark:bg-purple-900/10 text-purple-600 dark:text-purple-400",
    amber: "bg-amber-50 dark:bg-amber-900/10 text-amber-600",
    emerald: "bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600",
    purple: "bg-purple-100/50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400",
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", colors[color])}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/10 px-2 py-1 rounded-lg flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" /> {trend}
          </span>
        )}
      </div>
      <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{label}</p>
      <h4 className="text-2xl font-black text-slate-900 dark:text-white">{value}</h4>
    </div>
  );
}

function DashboardCard({ title, count, action, children }: any) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800/90 p-8 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none hover:border-purple-200/50 dark:hover:border-purple-950/25 transition-all">
      <div className="flex items-center justify-between mb-8 pb-3 border-b border-slate-50 dark:border-slate-800/40">
        <div>
          <h4 className="text-lg font-bold text-slate-900 dark:text-white leading-none mb-1.5">{title}</h4>
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            {count} Total
          </span>
        </div>
        {action && (
          <div className="shrink-0">
            {action}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

function EmptyState({ icon: Icon, message }: any) {
  return (
    <div className="py-12 text-center">
      <Icon className="w-12 h-12 text-slate-100 dark:text-slate-800 mx-auto mb-4" />
      <p className="text-sm font-medium text-slate-400 dark:text-slate-500">{message}</p>
    </div>
  );
}

function OrderRow({ order, onUpdate, full, currentTime, currentUser }: any) {
  const [showProofUpload, setShowProofUpload] = React.useState(false);
  const [proofUrl, setProofUrl] = React.useState("");
  const [uploadingProof, setUploadingProof] = React.useState(false);
  const [showReceipt, setShowReceipt] = React.useState(false);
  // Logistics Dispatch States (Campus local + Outsource options)
  const [deliveryTab, setDeliveryTab] = React.useState<"registered" | "outsource">("registered");
  const [outsourceCourierName, setOutsourceCourierName] = React.useState("");
  const [outsourceRiderName, setOutsourceRiderName] = React.useState("");
  const [outsourceRiderPhone, setOutsourceRiderPhone] = React.useState("");
  const [outsourceDeliveryFee, setOutsourceDeliveryFee] = React.useState(1000);
  const [outsourceNotes, setOutsourceNotes] = React.useState("");
  const [isOutsourcing, setIsOutsourcing] = React.useState(false);

  // States for in-app tracking modal
  const [trackingRiderOrder, setTrackingRiderOrder] = React.useState<any | null>(null);
  const [trackingProgress, setTrackingProgress] = React.useState(20);

  // Service Delivery Modal States
  const [showServiceDeliveryModal, setShowServiceDeliveryModal] = React.useState(false);
  const [workNotes, setWorkNotes] = React.useState("");
  const [workFileUrl, setWorkFileUrl] = React.useState("");
  const [submittingDelivery, setSubmittingDelivery] = React.useState(false);

  // Campus Local Logistics States
  const [showCampusLogisticsModal, setShowCampusLogisticsModal] = React.useState(false);
  const [logisticsPartners, setLogisticsPartners] = React.useState<any[]>([]);
  const [loadingLogistics, setLoadingLogistics] = React.useState(false);
  const [isHiring, setIsHiring] = React.useState(false);

  // Fetch campus logistics partners
  const fetchCampusLogisticsPartners = async () => {
    setLoadingLogistics(true);
    try {
      const qSnap = await getDocs(collection(db, "logistics_companies"));
      const partners: any[] = [];
      qSnap.forEach((doc) => {
        partners.push({ id: doc.id, ...doc.data() });
      });
      // Filter partners that cover the campus of this order or seller
      const campusFilter = order.pickupSchool || currentUser?.campus || "";
      const filtered = partners.filter(p => 
        !campusFilter || (p.coveredCampuses && p.coveredCampuses.includes(campusFilter))
      );
      setLogisticsPartners(filtered.length > 0 ? filtered : partners); // fallback to all if none covers specifically
    } catch (err) {
      console.error("Error fetching logistics partners:", err);
    } finally {
      setLoadingLogistics(false);
    }
  };

  const handleHireLocalLogistics = async (partner: any) => {
    if (order.status === "pending" || order.status === "Pending Seller Acceptance") {
      alert("You cannot dispatch this order to a registered logistics partner until you accept the order. Please accept the order first.");
      return;
    }
    setIsHiring(true);
    try {
      const deliveryPayload = {
        orderId: order.id,
        productName: order.productName,
        productImageUrl: order.productImageUrl || "",
        quantity: order.quantity,
        buyerId: order.buyerId,
        buyerName: order.buyerName,
        buyerPhone: order.buyerPhone,
        buyerAddress: order.deliveryAddress || "Campus Deliveries",
        sellerId: order.sellerId,
        sellerName: order.sellerName || currentUser?.displayName || "Shopiversity Merchant",
        sellerAddress: currentUser?.deliveryAddress || currentUser?.location || "Campus Retail Hub",
        campus: order.pickupSchool || currentUser?.campus || "General",
        status: "pending",
        logisticsId: partner.id,
        logisticsName: partner.companyName,
        deliveryPrice: Number(partner.baseDeliveryPrice) || 500,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Create local logistics job record
      await setDoc(doc(db, "logistics_deliveries", `DLV_${order.id}`), deliveryPayload);

      // Notify the logistics company
      await addDoc(collection(db, "notifications"), {
        userId: partner.id,
        title: "New Dispatch Booking request!",
        message: `Seller ${currentUser?.displayName || "Shopiversity Merchant"} booked you to deliver ${order.productName} (x${order.quantity}) to ${order.buyerName} on ${order.pickupSchool || currentUser?.campus || "Campus"}.`,
        type: "logistics",
        isRead: false,
        createdAt: new Date().toISOString()
      });

      // Update standard order record to note local dispatch request
      await updateDoc(doc(db, "orders", order.id), {
        status: "accepted",
        logisticsOfferStatus: "pending",
        kwikRiderId: `CAMPUS-${partner.companyName.toUpperCase().replace(/\s+/g, "-")}`,
        kwikTrackingUrl: "local_logistics",
        deliveredWorkNotes: `Requested Campus Logistics: ${partner.companyName} (${partner.phoneNumber})`,
        updatedAt: new Date().toISOString()
      });

      setShowCampusLogisticsModal(false);
      alert(`Local Campus Dispatch successfully booked with ${partner.companyName}!\nThey have been notified to pickup and deliver this order.`);
    } catch (err: any) {
      console.error(err);
      alert("Failed to assign local logistics: " + err.message);
    } finally {
      setIsHiring(false);
    }
  };

  React.useEffect(() => {
    if (showCampusLogisticsModal) {
      fetchCampusLogisticsPartners();
    }
  }, [showCampusLogisticsModal]);

  // Update animated GPS tracking progress of dispatch rider for seller
  React.useEffect(() => {
    if (!trackingRiderOrder) return;
    const interval = setInterval(() => {
      setTrackingProgress((prev) => {
        if (prev >= 100) return 100;
        const r = Math.floor(Math.random() * 3) + 1;
        return Math.min(prev + r, 100);
      });
    }, 1500);
    return () => clearInterval(interval);
  }, [trackingRiderOrder]);

  const getEffectiveStatus = (order: any) => {
    return order.status;
  };

  const handleOutsourceLogistics = async () => {
    if (!outsourceCourierName.trim()) {
      alert("Please enter the Courier/Company Name.");
      return;
    }
    setIsOutsourcing(true);
    try {
      const riderId = `OUTSOURCED-${outsourceCourierName.trim().toUpperCase().replace(/\s+/g, "-")}`;
      const trackingUrl = "outsourced";
      const notesString = `Outsourced to: ${outsourceCourierName.trim()}.${outsourceRiderName ? " Rider: " + outsourceRiderName.trim() : ""}${outsourceRiderPhone ? " (" + outsourceRiderPhone.trim() + ")" : ""}. Fee: ₦${outsourceDeliveryFee.toLocaleString()}.${outsourceNotes ? " Notes: " + outsourceNotes.trim() : ""}`;

      await updateDoc(doc(db, "orders", order.id), {
        kwikRiderId: riderId,
        kwikTrackingUrl: trackingUrl,
        status: "out_for_delivery",
        deliveredWorkNotes: notesString,
        updatedAt: new Date().toISOString()
      });

      // Also create a custom entry in logistics_deliveries if we want it to show up on standard logs
      await setDoc(doc(db, "logistics_deliveries", `DLV_${order.id}`), {
        orderId: order.id,
        productName: order.productName,
        productImageUrl: order.productImageUrl || "",
        quantity: order.quantity,
        buyerId: order.buyerId,
        buyerName: order.buyerName,
        buyerPhone: order.buyerPhone,
        buyerAddress: order.deliveryAddress || "Outsourced Deliveries",
        sellerId: order.sellerId,
        sellerName: order.sellerName || currentUser?.displayName || "Shopiversity Merchant",
        sellerAddress: currentUser?.deliveryAddress || currentUser?.location || "Campus Retail Hub",
        campus: order.pickupSchool || currentUser?.campus || "General",
        status: "outsourced",
        logisticsId: "outsourced",
        logisticsName: outsourceCourierName.trim(),
        deliveryPrice: Number(outsourceDeliveryFee) || 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      setShowCampusLogisticsModal(false);
      alert(`Logistics successfully outsourced to ${outsourceCourierName}!\nStatus updated to Out For Delivery.`);
    } catch (err: any) {
      console.error("Outsource booking error:", err);
      alert("Failed to outsource logistics: " + err.message);
    } finally {
      setIsOutsourcing(false);
    }
  };

  const handleProofSubmit = async () => {
    if (!proofUrl) return;
    setUploadingProof(true);
    try {
      await updateDoc(doc(db, "orders", order.id), {
        sellerProofUrl: proofUrl,
        sellerProofAt: new Date().toISOString(),
        disputeStatus: "seller_responded"
      });
      await addDoc(collection(db, "notifications"), {
        userId: order.buyerId,
        title: "Seller Responded!",
        message: `The seller has provided proof of delivery for ${order.productName}. SHOPIVERSITY will review it shortly.`,
        type: "order",
        isRead: false,
        createdAt: new Date().toISOString()
      });
      setShowProofUpload(false);
      alert("Proof submitted successfully! SHOPIVERSITY will review the dispute.");
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${order.id}`);
    } finally {
      setUploadingProof(false);
    }
  };

  const formatRemainingTime = (order: any) => {
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

  const effectiveStatus = getEffectiveStatus(order);

  return (
    <div className={cn(
      "flex flex-col p-4 rounded-2xl border border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all gap-4",
      full && "p-6"
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center",
            (order.status === "pending" || order.status === "Pending Seller Acceptance") ? "bg-amber-100 dark:bg-amber-900/20 text-amber-600" :
            effectiveStatus === "completed" || effectiveStatus === "accepted" ? "bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600" : "bg-blue-100 dark:bg-blue-900/20 text-blue-600"
          )}>
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-slate-900 dark:text-white">{order.productName}</p>
              {order.status === "accepted" && (
                <span className="flex items-center gap-1 text-[10px] bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 px-2 py-0.5 rounded-full font-bold">
                  <Clock className="w-3 h-3" />
                  {formatRemainingTime(order)}
                </span>
              )}
            </div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {order.buyerName} ({order.buyerEmail || "No Email"}) • ₦{order.totalPrice.toLocaleString()} 
              {order.measureType && ` • ${order.measureAmount} ${order.measureType} per unit`}
              {order.sellerEarnings && ` (You get: ₦${order.sellerEarnings.toLocaleString()})`}
            </p>
            {order.menuItemName && (
              <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                Selected Option: {order.menuItemName}
              </p>
            )}
            {order.formResponses?.target && (
              <div className="mt-2 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-100 dark:border-yellow-900/30 px-3 py-1.5 rounded-xl flex items-center gap-1.5 w-max max-w-full">
                <span>Target:</span>
                <span className="font-mono text-slate-900 dark:text-white select-all">{order.formResponses.target}</span>
              </div>
            )}
            <div className="flex items-center gap-2 mt-1">
              {order.uniqueProductId && (
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase tracking-wider bg-indigo-50 dark:bg-[#6366f1]/10 text-indigo-700 dark:text-[#a5b4fc]">
                  Product ID: {order.uniqueProductId}
                </span>
              )}
              {order.serialNumber && (
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  SN: {order.serialNumber}
                </span>
              )}
              <span className={cn(
                "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider",
                order.deliveryType === "delivery" ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              )}>
                {order.deliveryType}
              </span>
              <span className={cn(
                "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider",
                order.paymentMethod === "online" ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600" : 
                order.paymentMethod === "transfer" ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600" :
                "bg-amber-50 dark:bg-amber-900/20 text-amber-600"
              )}>
                {order.paymentMethod === "online" ? "Paid Online" : 
                 order.paymentMethod === "transfer" ? "Bank Transfer" : "Pay on Delivery"}
              </span>
              {order.escrowStatus === "held" && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider bg-amber-50 dark:bg-amber-900/20 text-amber-600 flex items-center gap-1">
                  <ShieldCheck className="w-2 h-2" /> Escrow Held
                </span>
              )}
            </div>

            {/* API Integration Widgets: CheapDataHub VTU top-up */}
            {order.cheapDataHubPlanId && (
              <div className="mt-4 p-4 bg-indigo-50/40 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100/30 dark:border-indigo-900/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">CheapDataHub Topup Engine</span>
                  </div>
                  {order.topUpStatus === "success" ? (
                    <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 px-2.5 py-1 rounded-full">
                      Successful
                    </span>
                  ) : order.topUpStatus === "failed" ? (
                    <span className="text-[9px] font-black uppercase tracking-wider bg-red-100 dark:bg-red-950/30 text-red-600 px-2.5 py-1 rounded-full">
                      Failed
                    </span>
                  ) : order.topUpStatus === "processing" ? (
                    <span className="text-[9px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-950/30 text-amber-600 px-2.5 py-1 rounded-full animate-pulse font-mono">
                      Processing...
                    </span>
                  ) : (
                    <span className="text-[9px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 px-2.5 py-1 rounded-full">
                      Ready
                    </span>
                  )}
                </div>

                {order.topUpTransactionId && (
                  <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                    Trx Ref: <span className="font-bold text-slate-800 dark:text-slate-100 select-all">{order.topUpTransactionId}</span>
                  </p>
                )}
                {order.topUpError && (
                  <p className="text-[10px] text-red-500 font-medium">
                    Failure logs: {order.topUpError}
                  </p>
                )}

                {(!order.topUpStatus || order.topUpStatus === "failed") && (
                  <button
                    type="button"
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        await updateDoc(doc(db, "orders", order.id), { topUpStatus: "processing" });
                        
                        const response = await fetch("/api/cheapdatahub/purchase", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            mobile_number: order.formResponses?.target || order.buyerPhone || "",
                            network: order.cheapDataHubNetworkCode || "1",
                            plan: order.cheapDataHubPlanId,
                            orderId: order.id
                          })
                        });
                        const data = await response.json();
                        if (!response.ok || !data.success) {
                          throw new Error(data.error || "Failed top-up request");
                        }

                        await updateDoc(doc(db, "orders", order.id), {
                          topUpStatus: "success",
                          topUpTransactionId: data.transaction_id || data.data?.id || `CDH-${Math.floor(Math.random() * 89999 + 10000)}`,
                          topUpError: null
                        });
                        alert("VTU Data Top-up processed successfully!");
                      } catch (err: any) {
                        console.error(err);
                        await updateDoc(doc(db, "orders", order.id), {
                          topUpStatus: "failed",
                          topUpError: err.message || "Connection timeout"
                        });
                        alert(`CheapDataHub VTU Error: ${err.message || "Link down"}`);
                      }
                    }}
                    className="w-full py-2 px-3 bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white text-[10px] font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
                  >
                    <Zap className="w-3 h-3 text-indigo-200" />
                    <span>Dispatch Auto Data Plan</span>
                  </button>
                )}
              </div>
            )}

            {/* Consolidated Campus & Outsourced Logistics booking */}
            {order.deliveryType === "delivery" && effectiveStatus !== "completed" && (
              <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-orange-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">Campus Logistics Hub</span>
                  </div>
                  {order.logisticsOfferStatus === "pending" ? (
                    <span className="text-[9px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 px-2.5 py-1 rounded-full animate-pulse">
                      ⏳ Offer Sent (Awaiting Acceptance)
                    </span>
                  ) : order.logisticsOfferStatus === "declined" ? (
                    <span className="text-[9px] font-black uppercase tracking-wider bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 px-2.5 py-1 rounded-full">
                      ❌ Offer Declined (Please Re-assign)
                    </span>
                  ) : order.kwikRiderId ? (
                    <span className="text-[9px] font-black uppercase tracking-wider bg-orange-100 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 px-2.5 py-1 rounded-full animate-pulse">
                      In Transit / Dispatched
                    </span>
                  ) : (
                    <span className="text-[9px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-400 px-2.5 py-1 rounded-full">
                      Ready to Dispatch
                    </span>
                  )}
                </div>

                {order.logisticsOfferStatus === "pending" ? (
                  <div className="space-y-2 text-[11px] text-slate-600 dark:text-slate-400">
                    <div className="p-3 bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100/30 rounded-xl text-amber-700 dark:text-amber-400 space-y-1">
                      <p className="font-bold flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Awaiting Logistics Partner Response
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
                        You have offered this delivery job to {order.kwikRiderId.replace("CAMPUS-", "").replace(/-/g, " ")}. They will review and either accept or decline it on their dashboard.
                      </p>
                    </div>
                    {order.deliveredWorkNotes && (
                      <div className="p-2.5 bg-white/50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 italic">
                        {order.deliveredWorkNotes}
                      </div>
                    )}
                  </div>
                ) : order.kwikRiderId ? (
                  <div className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                    <p className="font-medium">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {order.kwikRiderId.startsWith("CAMPUS-") ? "Registered Campus Partner:" : "Outsourced Courier:"}
                      </span>{" "}
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {order.kwikRiderId.startsWith("CAMPUS-") 
                          ? order.kwikRiderId.replace("CAMPUS-", "").replace(/-/g, " ") 
                          : order.kwikRiderId.startsWith("OUTSOURCED-") 
                            ? order.kwikRiderId.replace("OUTSOURCED-", "").replace(/-/g, " ") 
                            : order.kwikRiderId
                        }
                      </span>
                    </p>
                    
                    {order.deliveredWorkNotes && (
                      <div className="p-2.5 bg-white/50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 italic">
                        {order.deliveredWorkNotes}
                      </div>
                    )}

                    {order.kwikTrackingUrl === "local_logistics" ? (
                      <p className="text-[10px] text-orange-600 font-bold mt-1">
                        🚚 Handled via Local Campus Dispatcher. Keep track of progress!
                      </p>
                    ) : order.kwikTrackingUrl === "outsourced" ? (
                      <p className="text-[10px] text-orange-600 font-bold mt-1">
                        📦 Package outsourced to third-party courier. Please coordinate externally if needed!
                      </p>
                    ) : order.kwikTrackingUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setTrackingRiderOrder(order);
                          setTrackingProgress(Math.floor(Math.random() * 20) + 15);
                        }}
                        className="inline-flex items-center gap-1 text-xs text-orange-500 hover:text-orange-600 font-bold transition-all pt-1 cursor-pointer"
                      >
                        Track Shipment Live <ExternalLink className="w-3" />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 w-full">
                    {order.logisticsOfferStatus === "declined" && (
                      <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900/30 text-[11px] font-medium space-y-1">
                        <div className="flex items-center gap-1.5 font-bold">
                          <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                          <span>Delivery Offer Declined</span>
                        </div>
                        <p className="leading-relaxed">
                          The logistics company declined your request. Please hire another campus logistics company or outsource the delivery.
                        </p>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowCampusLogisticsModal(true);
                        setDeliveryTab("registered"); // start with registered tab
                      }}
                      className="w-full py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Navigation className="w-4 h-4 animate-pulse" />
                      Book Delivery & Dispatch
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Receipt should only be generated after the buyer completes transaction for order/ complete order */}
          {(order.status === "completed" || effectiveStatus === "completed") && (
            <button 
              type="button"
              onClick={() => setShowReceipt(true)}
              className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-950/30 transition-all flex items-center gap-2"
              title="View Receipt"
            >
              <ExternalLink className="w-4 h-4" />
              {full && <span className="text-[10px] font-bold uppercase tracking-widest font-display">Receipt</span>}
            </button>
          )}
          {order.disputeStatus === "active" ? (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-lg text-red-600 bg-red-50 dark:bg-red-900/20 flex items-center gap-2 animate-pulse">
                <AlertCircle className="w-3 h-3" /> Under Dispute
              </span>
              <button 
                onClick={() => setShowProofUpload(true)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs"
              >
                Resolve
              </button>
            </div>
          ) : (order.status === "pending" || order.status === "Pending Seller Acceptance") ? (
            <div className="flex items-center gap-2">
              <button 
                type="button"
                onClick={() => onUpdate(order.id, "accepted")}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 dark:shadow-none"
              >
                Accept Order
              </button>
              <button 
                type="button"
                onClick={() => onUpdate(order.id, "cancelled")}
                className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
                title="Cancel Order"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          ) : order.status === "accepted" ? (
            <div className="flex items-center gap-2">
              <button 
                type="button"
                onClick={() => onUpdate(order.id, "out_for_delivery")}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 dark:shadow-none flex items-center gap-2"
              >
                {order.type === "service" ? <Zap className="w-3 h-3" /> : <Truck className="w-3 h-3" />}
                {order.type === "service" ? "Start / Accept Service" : (order.deliveryType === "pickup" ? "Mark as Ready" : "Dispatch Order")}
              </button>
              {order.type === "service" && order.revisionFeedback && (
                <button 
                  type="button"
                  onClick={() => {
                    setWorkNotes("");
                    setWorkFileUrl("");
                    setShowServiceDeliveryModal(true);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-bold text-xs hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg flex items-center gap-2 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3 animate-spin text-amber-200" />
                  Redeliver Work
                </button>
              )}
            </div>
          ) : order.status === "out_for_delivery" ? (
            <div className="flex items-center gap-2">
              {(order.deliveryType === "pickup" || order.type === "service") ? (
                order.type === "service" ? (
                  <button 
                    type="button"
                    onClick={() => {
                      setWorkNotes("");
                      setWorkFileUrl("");
                      setShowServiceDeliveryModal(true);
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-650 text-white rounded-xl font-bold text-xs hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg flex items-center gap-2 hover:scale-[1.02] active:scale-95 cursor-pointer"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-300 animate-pulse" />
                    Deliver Work (Fiverr Mode)
                  </button>
                ) : (
                  <button 
                    type="button"
                    onClick={() => onUpdate(order.id, "Ready For Pickup")}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 dark:shadow-none flex items-center gap-2"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Mark as Ready for Pickup
                  </button>
                )
              ) : order.kwikRiderId ? (
                <button 
                  type="button"
                  onClick={() => onUpdate(order.id, "start_dispatch")}
                  className="px-4 py-2 bg-[#ff5c00] hover:bg-[#e05200] text-white rounded-xl font-black text-xs transition-all shadow-lg shadow-purple-100 dark:shadow-none flex items-center gap-2 animate-bounce"
                >
                  <Truck className="w-3.5 h-3.5" />
                  Out for Delivery
                </button>
              ) : (
                <button 
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCampusLogisticsModal(true);
                    setDeliveryTab("registered");
                  }}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-xs transition-all flex items-center gap-2 shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Truck className="w-3.5 h-3.5 animate-pulse" />
                  Book Delivery
                </button>
              )}
            </div>
          ) : (order.status === "Out To Pickup Station" || order.status === "Out For Delivery") ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 animate-pulse bg-indigo-50 dark:bg-indigo-950/20 px-3 py-1.5 rounded-xl border border-indigo-100/30 dark:border-indigo-900/40">
                <Clock className="w-3.5 h-3.5 animate-spin" />
                In Transit ({formatRemainingTime(order) || "In Progress"})
              </span>
            </div>
          ) : order.status === "Ready For Pickup" ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-xl border border-emerald-100/30 dark:border-[#10b981]/25 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" />
                Ready For Pickup
              </span>
            </div>
          ) : order.status === "awaiting_payment" ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-xl border border-amber-100/30 dark:border-amber-600/35 flex items-center gap-1.5 animate-pulse">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                Awaiting Buyer Payment
              </span>
            </div>
          ) : (
            <span className={cn(
              "text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-lg",
              effectiveStatus === "completed" || effectiveStatus === "acquired" || effectiveStatus === "accepted" ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20" : 
              effectiveStatus === "cancelled" ? "text-red-600 bg-red-50 dark:bg-red-900/20" : "text-blue-600 bg-blue-50 dark:bg-blue-900/20"
            )}>
              {order.disputeStatus === "seller_responded" ? "Response Sent" : (effectiveStatus === "completed" ? "completed" : effectiveStatus.replace(/_/g, ' '))}
            </span>
          )}
        </div>
      </div>

      {showProofUpload && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-amber-100 dark:border-amber-900/30 space-y-4"
        >
          <div className="flex items-center gap-2 text-amber-600 mb-2">
            <AlertCircle className="w-4 h-4" />
            <h4 className="text-xs font-black uppercase tracking-widest">Dispute Resolution</h4>
          </div>
          <p className="text-xs text-slate-500">Please provide a URL or link to your Proof of Delivery (e.g. photo of signed delivery note, chat screenshot, or photo at delivery location).</p>
          <div className="flex gap-2">
            <input 
              value={proofUrl}
              onChange={(e) => setProofUrl(e.target.value)}
              placeholder="Paste Proof URL (e.g. image link)"
              className="flex-1 h-12 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-amber-500"
            />
            <button
              onClick={handleProofSubmit}
              disabled={uploadingProof || !proofUrl}
              className="px-6 h-12 bg-amber-600 text-white rounded-xl font-bold text-xs hover:bg-amber-700 disabled:opacity-50"
            >
              {uploadingProof ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Proof"}
            </button>
            <button
              onClick={() => setShowProofUpload(false)}
              className="px-4 h-12 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl font-bold text-xs"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}



      {/* Local Campus Logistics Partner Selection Modal */}
      {showCampusLogisticsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-hidden">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 lg:p-8 border border-slate-100 dark:border-slate-800 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-50 dark:bg-orange-950/20 text-orange-600 rounded-2xl flex items-center justify-center">
                  <Navigation className="w-6 h-6 animate-pulse" />
                </div>
                <div className="text-left animate-in fade-in">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider">Logistics & Delivery</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-300 font-medium">Arrange campus partner dispatcher or external outsourcing</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowCampusLogisticsModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all border-none bg-transparent cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Delivery Option Tabs */}
            <div className="flex border-b border-slate-100 dark:border-slate-800 mb-6">
              <button
                type="button"
                onClick={() => setDeliveryTab("registered")}
                className={cn(
                  "flex-1 pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer bg-transparent",
                  deliveryTab === "registered"
                    ? "border-orange-500 text-orange-600 dark:text-orange-400"
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-white"
                )}
              >
                🎒 Registered Partners
              </button>
              <button
                type="button"
                onClick={() => setDeliveryTab("outsource")}
                className={cn(
                  "flex-1 pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer bg-transparent",
                  deliveryTab === "outsource"
                    ? "border-orange-500 text-orange-600 dark:text-orange-400"
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-white"
                )}
              >
                🤝 Outsource Delivery
              </button>
            </div>

            {deliveryTab === "registered" ? (
              loadingLogistics ? (
                <div className="py-12 text-center space-y-2">
                  <Loader2 className="w-8 h-8 animate-spin text-orange-600 mx-auto" />
                  <p className="text-xs text-slate-500 dark:text-slate-300 font-medium">Scanning for active campus carriers...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(order.status === "pending" || order.status === "Pending Seller Acceptance") && (
                    <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-2xl text-amber-800 dark:text-amber-200 text-xs font-bold flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <p className="leading-relaxed">
                        Order is not accepted yet. Please accept the order first before dispatching to a registered logistics partner.
                      </p>
                    </div>
                  )}

                  {logisticsPartners.length === 0 ? (
                    <div className="py-12 text-center space-y-2">
                      <AlertCircle className="w-12 h-12 text-amber-500 mx-auto animate-bounce" />
                      <h4 className="font-bold text-slate-800 dark:text-white text-sm">No active dispatchers found</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-300 max-w-xs mx-auto leading-relaxed">No logistics partners are registered to cover your campus: <strong className="text-slate-700 dark:text-white font-bold">{order.pickupSchool || currentUser?.campus || "General"}</strong> yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs text-slate-500 dark:text-slate-200 font-bold uppercase tracking-wider">Available Riders on your Campus</p>
                      <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                        {logisticsPartners.map((partner) => (
                          <div 
                            key={partner.id}
                            className="p-4 bg-slate-50 dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-orange-500/50 transition-all flex items-center justify-between gap-4"
                          >
                            <div className="space-y-1 text-left">
                              <h4 className="font-black text-slate-900 dark:text-white text-sm">{partner.companyName}</h4>
                              <div className="flex flex-wrap gap-1">
                                {partner.vehicleTypes?.slice(0, 3).map((v: string, idx: number) => (
                                  <span key={`${v}-${idx}`} className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 text-[10px] rounded text-slate-700 dark:text-slate-200 font-bold">
                                    {v}
                                  </span>
                                ))}
                              </div>
                              <p className="text-[10px] text-slate-500 dark:text-slate-300 font-semibold mt-1">📞 {partner.phoneNumber}</p>
                            </div>

                            <div className="text-right shrink-0">
                              <strong className="text-base font-black text-slate-900 dark:text-white block">₦{(partner.baseDeliveryPrice || 500).toLocaleString()}</strong>
                              <button
                                type="button"
                                disabled={isHiring || order.status === "pending" || order.status === "Pending Seller Acceptance"}
                                onClick={() => handleHireLocalLogistics(partner)}
                                className={cn(
                                  "mt-2 px-4 py-2 text-white text-xs font-bold rounded-xl transition-all cursor-pointer border-none shadow-sm",
                                  (order.status === "pending" || order.status === "Pending Seller Acceptance")
                                    ? "bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed"
                                    : "bg-orange-600 hover:bg-orange-700 shadow-orange-500/10"
                                )}
                                title={(order.status === "pending" || order.status === "Pending Seller Acceptance") ? "Accept order first before dispatching" : "Assign rider"}
                              >
                                {isHiring ? "Hiring..." : (order.status === "pending" || order.status === "Pending Seller Acceptance") ? "Accept Order First" : "Assign & Hire"}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            ) : (
              <div className="space-y-4 text-left animate-in fade-in duration-300">
                <div className="p-4 bg-orange-50/80 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/50 rounded-2xl text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                  <p className="font-bold text-slate-900 dark:text-white mb-1">💡 What does Outsourcing mean?</p>
                  Outsourcing allows you to deliver using any third-party logistics company (like DHL, GIG Logistics, custom student riders, etc.) that is not registered as an official partner on our website. Enter their information below to keep the buyer fully informed.
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-300 uppercase tracking-widest mb-1">Courier / Company Name *</label>
                    <input 
                      type="text"
                      value={outsourceCourierName}
                      onChange={(e) => setOutsourceCourierName(e.target.value)}
                      placeholder="e.g. GIG Logistics, DHL, Custom Rider"
                      className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Rider Name</label>
                      <input 
                        type="text"
                        value={outsourceRiderName}
                        onChange={(e) => setOutsourceRiderName(e.target.value)}
                        placeholder="e.g. Emeka Rider"
                        className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Rider Phone</label>
                      <input 
                        type="tel"
                        value={outsourceRiderPhone}
                        onChange={(e) => setOutsourceRiderPhone(e.target.value)}
                        placeholder="e.g. +234 803 123 4567"
                        className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Delivery Fee (₦)</label>
                      <input 
                        type="number"
                        value={outsourceDeliveryFee}
                        onChange={(e) => setOutsourceDeliveryFee(Number(e.target.value))}
                        placeholder="e.g. 1000"
                        className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tracking Number / Note</label>
                      <input 
                        type="text"
                        value={outsourceNotes}
                        onChange={(e) => setOutsourceNotes(e.target.value)}
                        placeholder="e.g. Ref: GIG-LA-987"
                        className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCampusLogisticsModal(false)}
                    className="flex-1 h-11 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 dark:text-slate-400 rounded-xl font-bold text-xs cursor-pointer border-none"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isOutsourcing}
                    onClick={handleOutsourceLogistics}
                    className="flex-1 h-11 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-orange-500/10 cursor-pointer border-none"
                  >
                    {isOutsourcing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Dispatched...
                      </>
                    ) : (
                      "Confirm Outsourced Dispatch"
                    )}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {showServiceDeliveryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-hidden">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 lg:p-8 border border-slate-100 dark:border-slate-800 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Title */}
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/20 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-left animate-in fade-in">
                <h4 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-white">Deliver Service Project</h4>
                <p className="text-[10px] text-slate-400">Submit deliverables & notes to request final payment release</p>
              </div>
            </div>

            {/* In-app warning box */}
            {order.revisionFeedback && (
              <div className="mb-4 p-3 bg-amber-50/40 dark:bg-amber-950/10 border border-amber-100/30 dark:border-amber-900/30 rounded-xl text-left">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 block mb-1">Requested Revision:</span>
                <p className="text-xs text-slate-600 dark:text-slate-350 font-semibold">"{order.revisionFeedback}"</p>
              </div>
            )}

            {/* Inputs */}
            <div className="space-y-4 text-left">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Delivery Notes & Comments *</label>
                <textarea
                  value={workNotes}
                  onChange={(e) => setWorkNotes(e.target.value)}
                  placeholder="Hi there! I have completed your requested style/service. Inside this deliverable, you will find..."
                  required
                  className="w-full h-24 p-3 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-855 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-purple-500 font-sans"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Deliverable URL / Link (Optional)</label>
                <input
                  type="url"
                  value={workFileUrl}
                  onChange={(e) => setWorkFileUrl(e.target.value)}
                  placeholder="Provide a link to final files, designs, or Google Drive (e.g., https://drive.google.com/...)"
                  className="w-full h-10 px-4 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-855 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-purple-500 font-sans"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end mt-6">
              <button
                type="button"
                onClick={() => setShowServiceDeliveryModal(false)}
                className="px-4 py-2 text-slate-500 hover:text-slate-800 dark:hover:text-white font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingDelivery || !workNotes.trim()}
                onClick={async () => {
                  setSubmittingDelivery(true);
                  try {
                    const orderRef = doc(db, "orders", order.id);
                    await updateDoc(orderRef, {
                      status: "awaiting_payment",
                      deliveredWorkNotes: workNotes,
                      deliveredWorkFileUrl: workFileUrl,
                      deliveredAt: new Date().toISOString()
                    });
                    setShowServiceDeliveryModal(false);
                    onUpdate(order.id, "awaiting_payment");
                    alert("Deliverable successfully submitted to buyer for review!");
                  } catch (err) {
                    console.error("Failed to submit service delivery:", err);
                    alert("Could not update. Please try again.");
                  } finally {
                    setSubmittingDelivery(false);
                  }
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-650 to-indigo-600 hover:from-purple-750 hover:to-indigo-700 disabled:opacity-50 text-white rounded-xl font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-purple-50 cursor-pointer"
              >
                {submittingDelivery ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3.5 h-3.5 font-sans" />
                    Submit Delivery
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <ReceiptModal 
        order={order} 
        isOpen={showReceipt} 
        onClose={() => setShowReceipt(false)} 
      />

      <LiveRiderTrackingModal
        order={trackingRiderOrder}
        progress={trackingProgress}
        onClose={() => setTrackingRiderOrder(null)}
      />
    </div>
  );
}

function ProductRow({ product, onDelete, onEdit, onRestore, isRestoring, isDeletedView }: any) {
  return (
    <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
          <img 
            src={product.imageUrl || `https://picsum.photos/seed/${product.id}/100/100`} 
            alt={product.name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">{product.name}</p>
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              ₦{product.price.toLocaleString()}
              {product.type === "service" && product.pricingType && product.pricingType !== "fixed" && ` / ${product.pricingType}`}
              {product.category === "Food & Drinks" && " (Menu)"}
              {product.type === "good" && product.category !== "Food & Drinks" && ` • ${product.stock} in stock`}
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isDeletedView ? (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => onRestore(product.id)}
              disabled={isRestoring}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 dark:shadow-none disabled:opacity-50"
            >
              {isRestoring ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
              Restore
            </button>
            <button 
              onClick={() => onDelete(product.id)}
              className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-700 transition-all"
              title="Delete Permanently"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <button 
              onClick={() => onEdit(product)}
              className="p-2 text-slate-400 dark:text-slate-500 hover:text-indigo-600 transition-all"
              title="Edit Product"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button 
              onClick={() => onDelete(product.id)}
              className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-600 transition-all"
              title="Move to Trash"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function ProductGridItem({ product, onDelete, onEdit, onRestore, isRestoring, isDeletedView }: any) {
  return (
    <div className={cn(
      "bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 overflow-hidden group shadow-sm hover:shadow-xl transition-all",
      isDeletedView && "opacity-80 grayscale-[0.5] hover:grayscale-0 hover:opacity-100"
    )}>
      <div className="aspect-square relative overflow-hidden">
        <img 
          src={product.imageUrl || `https://picsum.photos/seed/${product.id}/400/400`} 
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {isDeletedView ? (
            <>
              <button 
                onClick={() => onRestore(product.id)}
                disabled={isRestoring}
                className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-emerald-600 shadow-lg disabled:opacity-50"
                title="Restore Product"
              >
                {isRestoring ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
              </button>
              <button 
                onClick={() => onDelete(product.id)}
                className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-red-700 shadow-lg"
                title="Delete Permanently"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => onEdit(product)}
                className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-indigo-600 shadow-lg"
                title="Edit Product"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button 
                onClick={() => onDelete(product.id)}
                className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-red-600 shadow-lg"
                title="Move to Trash"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
        {isDeletedView && (
          <div className="absolute inset-0 bg-red-900/10 flex items-center justify-center pointer-events-none">
            <span className="bg-red-600 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg transform -rotate-12">
              Deleted
            </span>
          </div>
        )}
      </div>
      <div className="p-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider",
              product.condition === "new" ? "bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600" :
              product.condition === "refurbished" ? "bg-blue-50 dark:bg-blue-900/10 text-blue-600" : "bg-amber-50 dark:bg-amber-900/10 text-amber-600"
            )}>
              {product.condition}
            </span>
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/10 px-2 py-1 rounded-lg uppercase tracking-wider">
              {product.category}
            </span>
          </div>
          {product.type === "good" && (
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500">Stock: {product.stock}</span>
          )}
        </div>
        <h5 className="font-bold text-slate-900 dark:text-white mb-1 line-clamp-1">{product.name}</h5>
        {product.deletedAt && isDeletedView && (
          <div className="flex items-center gap-1.5 mb-2 text-red-500">
            <Clock className="w-3 h-3" />
            <p className="text-[9px] font-bold uppercase tracking-wider">
              Deleted {new Date(product.deletedAt).toLocaleDateString()}
            </p>
          </div>
        )}
        {!isDeletedView && product.serialNumber && (
          <p className="text-[10px] font-mono text-slate-500 mb-2">SN: {product.serialNumber}</p>
        )}
        <div className="flex items-center gap-2">
          <p className="text-lg font-black text-indigo-600">₦{product.price.toLocaleString()}</p>
          {product.type === "service" && product.pricingType && product.pricingType !== "fixed" && (
            <span className="text-[10px] font-bold text-slate-400 uppercase">/ {product.pricingType}</span>
          )}
        </div>
        
        {!isDeletedView && (
          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 flex gap-2">
            <button 
              onClick={() => onEdit(product)}
              className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 border-none shadow-sm cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Listing</span>
            </button>
            <button 
              onClick={() => onDelete(product.id)}
              className="w-12 h-12 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-xl flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/30 transition-all border-none cursor-pointer"
              title="Delete Listing"
            >
              <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
            </button>
          </div>
        )}

        {isDeletedView && (
          <div className="mt-6 pt-6 border-t border-slate-50 dark:border-slate-800 flex gap-2">
            <button 
              onClick={() => onRestore(product.id)}
              disabled={isRestoring}
              className="flex-1 h-14 bg-emerald-gradient text-white rounded-2xl font-black text-xs uppercase tracking-[0.15em] hover:shadow-lg hover:shadow-emerald-200 dark:hover:shadow-emerald-900/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 transform"
            >
              {isRestoring ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-5 h-5" />}
              Restore to Store
            </button>
            <button 
              onClick={() => onDelete(product.id)}
              className="w-12 h-12 bg-red-100 dark:bg-red-900/20 text-red-600 rounded-2xl flex items-center justify-center hover:bg-red-200 transition-all"
              title="Delete Permanently"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export interface DynamicFieldConfig {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'url';
  placeholder?: string;
  options?: string[];
  required?: boolean;
}

export interface ServiceCategoryMapping {
  title: string;
  fields: DynamicFieldConfig[];
}

export const SERVICE_CATEGORY_MAPPING: Record<string, ServiceCategoryMapping> = {
  "Tech & Digital": {
    title: "💻 Tech & Digital Service Details",
    fields: [
      { id: "techStack", label: "Tech Stack / Technologies Used", type: "text", placeholder: "e.g., React, Node.js, Tailwind CSS, Python", required: true },
      { id: "digitalFormat", label: "Delivery / Source Code format", type: "select", options: ["GitHub Repository Link", "Figma file / Design URL", "Google Drive / Cloud Drive Link", "Email Shipment / Attachment", "Instant Message / Telegram Shipment", "Zip File download link"], required: true },
      { id: "portfolioUrl", label: "Portfolio or Showcase Link (Optional)", type: "url", placeholder: "e.g. https://github.com/myusername", required: false }
    ]
  },
  "Web Development": {
    title: "💻 Web Development Service Details",
    fields: [
      { id: "techStack", label: "Tech Stack / Technologies Used", type: "text", placeholder: "e.g., React, Node.js, Tailwind CSS, Python", required: true },
      { id: "digitalFormat", label: "Delivery / Source Code format", type: "select", options: ["GitHub Repository Link", "Figma file / Design URL", "Google Drive / Cloud Drive Link", "Email Shipment / Attachment", "Instant Message / Telegram Shipment", "Zip File download link"], required: true },
      { id: "portfolioUrl", label: "Portfolio or Showcase Link (Optional)", type: "url", placeholder: "e.g. https://github.com/myusername", required: false }
    ]
  },
  "Home & Personal Care": {
    title: "🧘 Personal Care & Grooming Details",
    fields: [
      { id: "preferredTime", label: "Preferred Time / Booking Hours", type: "text", placeholder: "e.g., Weekdays 4PM - 8PM, Weekends 10AM - 6PM", required: true },
      { id: "preferredVenue", label: "Service Location / In-Person Venue", type: "text", placeholder: "e.g., Client's Hostel Room, or my Salon at Block C", required: true }
    ]
  },
  "Home Cleaning": {
    title: "🧹 Home Cleaning & Custodian Details",
    fields: [
      { id: "preferredTime", label: "Preferred Location & Schedule Hours", type: "text", placeholder: "e.g., Hostels Block A-D, Mornings 8AM - 11AM", required: true },
      { id: "laundryPreference", label: "Cleaning Scale / Standard Packages", type: "select", options: ["Standard Room Sweep & Dusting", "Full Suite Deep Scrub", "Move-in / Move-out fumigation & clean"], required: true }
    ]
  },
  "Cleaning & Laundry": {
    title: "🧼 Cleaning & Laundry details",
    fields: [
      { id: "preferredTime", label: "Location & Schedule Time Details", type: "text", placeholder: "e.g. Hostels Block A-D, Mornings 8AM - 11AM", required: true },
      { id: "laundryPreference", label: "Cleaning Level / Type of Wash", type: "select", options: ["Wash & Fold", "Wash & Iron", "Premium Dry Cleaning", "Deep Cleaning - Residential", "Express Same-Day Laundry"], required: true }
    ]
  },
  "Academic & Tutoring": {
    title: "🎓 Academic Mentorship & Tutoring",
    fields: [
      { id: "institutionName", label: "University Department / Faculty", type: "text", placeholder: "e.g., Computer Science Dept, UNILAG", required: true },
      { id: "gradeOrQualification", label: "Academic Grade / Highest Qualification", type: "text", placeholder: "e.g., First Class GPA / Professional Tutor Cert", required: true },
      { id: "subjectTaught", label: "Main Subject(s) Offered", type: "text", placeholder: "e.g. Mathematics, Physics, Organic Chemistry", required: true }
    ]
  },
  "Events & Lifestyle": {
    title: "🎭 Event Planning & Entertainment Details",
    fields: [
      { id: "setupTime", label: "Event Setup & Buffer Time Required", type: "select", options: ["30 mins", "1 hour", "2 hours", "3 hours", "1 day"], required: true },
      { id: "eventRadius", label: "Travel Radius Limit from Campus (km)", type: "select", options: ["5", "10", "25", "50", "unlimited"], required: true },
      { id: "includesEquipment", label: "Setup Gear & Sound Equipment Included", type: "checkbox", required: false }
    ]
  },
  "Real Estate & Housing": {
    title: "🔑 Hostel & Housing Booking Details",
    fields: [
      { id: "securityDeposit", label: "Refundable Security Deposit (₦)", type: "text", placeholder: "e.g., ₦15,000", required: true },
      { id: "rentalDuration", label: "Minimum Lease / Booking Duration", type: "text", placeholder: "e.g., 1 Semester, 6 Months, or 1 Year", required: true },
      { id: "rentalTerms", label: "House / Apartment Rules & Terms", type: "textarea", placeholder: "e.g., No parties, light electricity use only, pets friendly", required: false }
    ]
  },
  "Logistics & Errands": {
    title: "🏃 Campus Dispatch & Logistics Runner",
    fields: [
      { id: "transitOption", label: "Dispatch / Errand Vehicle Type", type: "select", options: ["On-foot Campus Runner", "Bicycle dispatch", "Motorcycle dispatcher", "Car/SUV delivery group"], required: true },
      { id: "coverageArea", label: "Delivery Target Coverage Area", type: "text", placeholder: "e.g., Within Main Campus and direct Off-Campus environs", required: true }
    ]
  }
};

export function getDynamicFieldsForCategory(category: string): ServiceCategoryMapping {
  if (!category) {
    return {
      title: "⚙️ General Service Custom Details",
      fields: []
    };
  }

  const matchedKey = Object.keys(SERVICE_CATEGORY_MAPPING).find(
    k => k.toLowerCase() === category.toLowerCase() || category.toLowerCase().includes(k.toLowerCase())
  );

  if (matchedKey) {
    return SERVICE_CATEGORY_MAPPING[matchedKey];
  }

  return {
    title: "⚙️ General Service Custom Details",
    fields: [
      { id: "customServiceName", label: "Special Deliverable or Service Name", type: "text", placeholder: "e.g., Custom tailoring fitting measurements", required: false }
    ]
  };
}

function AddProductForm({ onSuccess, currentUser, editingProduct, initialType }: any) {
  const [type, setType] = React.useState<"good" | "service">(editingProduct?.type || initialType || "good");
  const [name, setName] = React.useState(editingProduct?.name || "");
  const [businessName, setBusinessName] = React.useState(editingProduct?.businessName || "");
  const [customServiceName, setCustomServiceName] = React.useState("");
  const [description, setDescription] = React.useState(editingProduct?.description || "");
  const [price, setPrice] = React.useState(editingProduct?.price?.toString() || "");
  const [category, setCategory] = React.useState(editingProduct?.category || (initialType === "service" || (editingProduct?.type || initialType) === "service" ? "" : "Electronics"));
  const [stock, setStock] = React.useState(editingProduct?.stock?.toString() || "1");
  const [pricingType, setPricingType] = React.useState<"fixed" | "hourly" | "project" | "daily">(editingProduct?.pricingType || "fixed");
  const [condition, setCondition] = React.useState<"new" | "refurbished" | "used">(editingProduct?.condition || "new");
  const [deliveryOptions, setDeliveryOptions] = React.useState({
    delivery: editingProduct?.deliveryOptions?.delivery ?? true,
    pickup: editingProduct?.deliveryOptions?.pickup ?? true,
    deliveryPrice: editingProduct?.deliveryOptions?.deliveryPrice || 500
  });
  const [deliveryPriceInput, setDeliveryPriceInput] = React.useState(editingProduct?.deliveryOptions?.deliveryPrice !== undefined ? editingProduct.deliveryOptions.deliveryPrice.toString() : "500");
  const [deliveryTime, setDeliveryTime] = React.useState(editingProduct?.deliveryTime?.toString() || "1");
  const [deliveryTimeUnit, setDeliveryTimeUnit] = React.useState<"hours" | "days" | "weeks">(editingProduct?.deliveryTimeUnit || "days");
  const [location, setLocation] = React.useState(editingProduct?.location || "");
  const [discountPercent, setDiscountPercent] = React.useState(editingProduct?.discountPercent?.toString() || "");
  const [promoCode, setPromoCode] = React.useState(editingProduct?.promoCode || "");
  const [priceBefore, setPriceBefore] = React.useState(editingProduct?.priceBefore?.toString() || "");
  const [collectionType, setCollectionType] = React.useState(editingProduct?.collectionType || "");
  const [manualBusinessAddress, setManualBusinessAddress] = React.useState(editingProduct?.businessAddress || "");
  const [addrCountry, setAddrCountry] = React.useState("Nigeria");
  const [addrState, setAddrState] = React.useState("");
  const [addrLga, setAddrLga] = React.useState("");
  const [addrCity, setAddrCity] = React.useState("");
  const [addrStreet, setAddrStreet] = React.useState("");
  const [addrSchool, setAddrSchool] = React.useState("");
  const [addrSuggestions, setAddrSuggestions] = React.useState<any[]>([]);
  const [isSearchingSuggestions, setIsSearchingSuggestions] = React.useState(false);
  const [lgaPlacesSearch, setLgaPlacesSearch] = React.useState("");
  const [lgaPlacesSuggestions, setLgaPlacesSuggestions] = React.useState<any[]>([]);
  const [isSearchingLgaPlaces, setIsSearchingLgaPlaces] = React.useState(false);
  const justSelected = React.useRef(false);
  const [formStep, setFormStep] = React.useState<"details" | "pricing" | "logistics" | "images">("details");

  const [hasInitializedAddress, setHasInitializedAddress] = React.useState(false);
  const [campusSearchQuery, setCampusSearchQuery] = React.useState("");
  const [showCampusDropdown, setShowCampusDropdown] = React.useState(false);

  const [logisticsType, setLogisticsType] = React.useState<"registered" | "custom">(editingProduct?.logisticsType || "custom");
  const [selectedLogisticsCompanyId, setSelectedLogisticsCompanyId] = React.useState<string>(editingProduct?.logisticsCompanyId || "");
  const [allLogisticsCompanies, setAllLogisticsCompanies] = React.useState<any[]>([]);
  const [loadingAllLogistics, setLoadingAllLogistics] = React.useState(false);

  React.useEffect(() => {
    if (editingProduct) {
      setLogisticsType(editingProduct.logisticsType || "custom");
      setSelectedLogisticsCompanyId(editingProduct.logisticsCompanyId || "");
    }
  }, [editingProduct]);

  React.useEffect(() => {
    const fetchAllLogistics = async () => {
      setLoadingAllLogistics(true);
      try {
        const qSnap = await getDocs(collection(db, "logistics_companies"));
        const list: any[] = [];
        qSnap.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        setAllLogisticsCompanies(list);
      } catch (err) {
        console.error("Error fetching logistics companies for product form:", err);
      } finally {
        setLoadingAllLogistics(false);
      }
    };
    fetchAllLogistics();
  }, [db]);

  const filteredLogisticsCompanies = React.useMemo(() => {
    const currentSchool = (addrSchool || currentUser?.campus || "").trim().toLowerCase();
    if (!currentSchool) return allLogisticsCompanies;
    return allLogisticsCompanies.filter((company) => {
      return company.coveredCampuses?.some(
        (camp: string) => camp.trim().toLowerCase() === currentSchool
      );
    });
  }, [allLogisticsCompanies, addrSchool, currentUser?.campus]);

  // Sync state if product editing shifts
  React.useEffect(() => {
    setHasInitializedAddress(false);
  }, [editingProduct?.id]);

  React.useEffect(() => {
    if (hasInitializedAddress) return;

    if (editingProduct?.location) {
      const parts = editingProduct.location.split(",").map((p: any) => p.trim());
      const hasNigeria = parts[parts.length - 1]?.toLowerCase() === "nigeria";
      const actualParts = hasNigeria ? parts.slice(0, parts.length - 1) : parts;
      
      let state = "";
      let lga = "";
      let city = "";
      let street = "";
      
      if (actualParts.length > 0) {
        const statePart = actualParts[actualParts.length - 1] || "";
        state = statePart.replace(/\s+State$/i, "").trim();
      }
      if (actualParts.length > 1) {
        const lgaPart = actualParts[actualParts.length - 2] || "";
        lga = lgaPart.replace(/\s+LGA$/i, "").trim();
      }
      if (actualParts.length > 2) {
        city = actualParts[actualParts.length - 3] || "";
      }
      if (actualParts.length > 3) {
        street = actualParts.slice(0, actualParts.length - 3).join(", ");
      } else if (actualParts.length === 3) {
        street = actualParts[0];
      } else if (actualParts.length === 2) {
        street = actualParts[0];
      } else if (actualParts.length === 1) {
        street = actualParts[0];
      }
      
      setAddrCountry("Nigeria");
      const matchedState = NIGERIAN_STATES.find(s => s.toLowerCase() === state.toLowerCase()) || "";
      setAddrState(matchedState);
      
      if (matchedState) {
        const lgasForState = NIGERIAN_LGAS[matchedState] || [];
        const matchedLga = lgasForState.find(l => l.toLowerCase() === lga.toLowerCase() || l.replace(/\s+LGA$/i, "").toLowerCase() === lga.toLowerCase()) || "";
        setAddrLga(matchedLga);
        
        const citiesForState = STATE_CITIES[matchedState] || [];
        const matchedCity = citiesForState.find(c => c.toLowerCase() === city.toLowerCase()) || city || "";
        setAddrCity(matchedCity);
      } else {
        setAddrLga("");
        setAddrCity(city);
      }
      
      setAddrStreet(street);
      const school = editingProduct?.pickupSchool || currentUser?.campus || "";
      setAddrSchool(school);
      setCampusSearchQuery(school);
      setHasInitializedAddress(true);
    } else {
      setAddrCountry("Nigeria");
      setAddrState("");
      setAddrLga("");
      setAddrCity("");
      setAddrStreet("");
      setAddrSchool("");
      setCampusSearchQuery("");
      setHasInitializedAddress(true);
    }
  }, [editingProduct, currentUser, hasInitializedAddress]);

  React.useEffect(() => {
    if (!addrState && !addrLga && !addrCity && !addrStreet && !addrSchool) return;
    
    // Store front or house address remains in the full stored location text
    const parts = [];
    if (addrStreet) parts.push(addrStreet);
    if (addrSchool) parts.push(addrSchool);
    if (addrCity) parts.push(addrCity);
    if (addrLga) parts.push(addrLga.endsWith("LGA") ? addrLga : `${addrLga} LGA`);
    if (addrState) parts.push(addrState.endsWith("State") ? addrState : `${addrState} State`);
    parts.push(addrCountry);
    const compiled = parts.join(", ");
    
    setLocation(compiled);

    // Pinpoint exact requested pickup location address on map
    const pinpointParts = [];
    if (addrStreet) pinpointParts.push(addrStreet);
    if (manualBusinessAddress) pinpointParts.push(manualBusinessAddress);
    if (addrSchool) pinpointParts.push(addrSchool);
    if (addrCity) pinpointParts.push(addrCity);
    if (addrLga) pinpointParts.push(addrLga.endsWith("LGA") ? addrLga : `${addrLga} LGA`);
    if (addrState) pinpointParts.push(addrState.endsWith("State") ? addrState : `${addrState} State`);
    pinpointParts.push(addrCountry);
    const pinpointCompiled = pinpointParts.join(", ");

    const delayDebounceFn = setTimeout(() => {
      if (pinpointCompiled.trim().length > 6) {
        verifyLocationAddress(pinpointCompiled);
      }
    }, 1500);

    return () => clearTimeout(delayDebounceFn);
  }, [addrCountry, addrState, addrLga, addrCity, addrStreet, addrSchool, manualBusinessAddress]);

  React.useEffect(() => {
    if (!addrStreet || addrStreet.trim().length < 3) {
      setAddrSuggestions([]);
      return;
    }
    if (justSelected.current) {
      justSelected.current = false;
      return;
    }

    const delayQuery = setTimeout(async () => {
      setIsSearchingSuggestions(true);
      try {
        const queryStr = `${addrStreet}${addrCity ? ' ' + addrCity : ''}${addrState ? ' ' + addrState : ''}, Nigeria`;
        const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(queryStr)}&countrycodes=ng&limit=5`;
        const res = await fetch(url, {
          headers: {
            "Accept-Language": "en",
            "User-Agent": "Shopiversity-Campus-App"
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data)) {
            setAddrSuggestions(data);
          }
        }
      } catch (err) {
        console.error("Error fetching address suggestions:", err);
      } finally {
        setIsSearchingSuggestions(false);
      }
    }, 500);

    return () => clearTimeout(delayQuery);
  }, [addrStreet]);

  const handleSelectSuggestion = (item: any) => {
    justSelected.current = true;
    const addr = item.address || {};
    
    // Determine street address
    const streetParts = [];
    if (addr.house_number) streetParts.push(addr.house_number);
    if (addr.road) {
      streetParts.push(addr.road);
    } else if (item.display_name) {
      const firstSegment = item.display_name.split(",")[0];
      if (firstSegment) streetParts.push(firstSegment);
    }
    const finalStreet = streetParts.join(" ") || addrStreet;
    setAddrStreet(finalStreet);

    // Determine state
    if (addr.state) {
      const stateClean = addr.state.replace(/\s+State$/i, "").trim();
      const matchedState = NIGERIAN_STATES.find(
        s => s.toLowerCase() === stateClean.toLowerCase()
      );
      if (matchedState) {
        setAddrState(matchedState);
        
        // Determine LGA
        const lgasForState = NIGERIAN_LGAS[matchedState] || [];
        const possibleCounty = (addr.county || addr.suburb || "").replace(/\s+LGA$/i, "").trim().toLowerCase();
        const matchedLga = lgasForState.find(
          l => l.toLowerCase() === possibleCounty || l.replace(/\s+LGA$/i, "").toLowerCase() === possibleCounty
        );
        if (matchedLga) {
          setAddrLga(matchedLga);
        } else if (lgasForState.length > 0) {
          setAddrLga(lgasForState[0]);
        }
      }
    }

    // Determine city
    const possibleCity = addr.city || addr.town || addr.village || addr.suburb || addr.neighbourhood || "";
    if (possibleCity) {
      setAddrCity(possibleCity);
    }

    // Determine coordinates
    if (item.lat && item.lon) {
      const coords = { lat: parseFloat(item.lat), lng: parseFloat(item.lon) };
      setPickupCoordinates(coords);
      setMapCenter(coords);
    }

    setAddrSuggestions([]);
  };

  const triggerOsmLgaFallback = async (queryStr: string) => {
    setIsSearchingLgaPlaces(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(queryStr)}&countrycodes=ng&limit=6`;
      const res = await fetch(url, {
        headers: {
          "Accept-Language": "en",
          "User-Agent": "Shopiversity-Campus-App"
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data)) {
          const mapped = data.map((item: any) => ({
            display_name: item.display_name,
            main_text: item.name || item.display_name.split(",")[0],
            lat: item.lat,
            lon: item.lon,
            address: item.address,
            source: "osm"
          }));
          setLgaPlacesSuggestions(mapped);
        }
      }
    } catch (err) {
      console.error("OSM Fallback error:", err);
    } finally {
      setIsSearchingLgaPlaces(false);
    }
  };

  const triggerDefaultLgaPlaces = async () => {
    if (!addrState || !addrLga) return;
    setIsSearchingLgaPlaces(true);
    const queryStr = `${addrLga}, ${addrState}, Nigeria`;
    
    if (GOOGLE_MAPS_API_KEY && window.google?.maps?.places) {
      try {
        const service = new window.google.maps.places.AutocompleteService();
        service.getPlacePredictions({
          input: queryStr,
          componentRestrictions: { country: "ng" },
        }, (predictions, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            const mapped = predictions.map(p => ({
              display_name: p.description,
              main_text: p.structured_formatting?.main_text || p.description,
              place_id: p.place_id,
              source: "google"
            }));
            setLgaPlacesSuggestions(mapped);
            setIsSearchingLgaPlaces(false);
          } else {
            triggerOsmLgaFallback(queryStr);
          }
        });
        return;
      } catch (err) {
        console.error("Google default places query failed", err);
      }
    }
    await triggerOsmLgaFallback(queryStr);
  };

  const handleSelectLgaPlaceOption = async (item: any) => {
    setAddrStreet(item.main_text || item.display_name);
    setLgaPlacesSearch(item.main_text || item.display_name);
    
    if (item.source === "google" && window.google?.maps) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ placeId: item.place_id }, (results, status) => {
        if (status === "OK" && results && results[0]) {
          const loc = results[0].geometry.location;
          const coords = { lat: loc.lat(), lng: loc.lng() };
          setPickupCoordinates(coords);
          setMapCenter(coords);
        }
      });
    } else if (item.lat && item.lon) {
      const coords = { lat: parseFloat(item.lat), lng: parseFloat(item.lon) };
      setPickupCoordinates(coords);
      setMapCenter(coords);
    }

    setLgaPlacesSuggestions([]);
  };

  React.useEffect(() => {
    if (!addrState || !addrLga) {
      setLgaPlacesSuggestions([]);
      return;
    }
    if (!lgaPlacesSearch || lgaPlacesSearch.trim().length < 2) {
      return;
    }

    const delayQuery = setTimeout(async () => {
      setIsSearchingLgaPlaces(true);
      
      const queryStr = `${lgaPlacesSearch}, ${addrLga}, ${addrState}, Nigeria`;

      if (GOOGLE_MAPS_API_KEY && window.google?.maps?.places) {
        try {
          const service = new window.google.maps.places.AutocompleteService();
          service.getPlacePredictions({
            input: queryStr,
            componentRestrictions: { country: "ng" },
          }, (predictions, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
              const mapped = predictions.map(p => ({
                display_name: p.description,
                main_text: p.structured_formatting?.main_text || p.description,
                place_id: p.place_id,
                source: "google"
              }));
              setLgaPlacesSuggestions(mapped);
              setIsSearchingLgaPlaces(false);
            } else {
              triggerOsmLgaFallback(queryStr);
            }
          });
          return;
        } catch (err) {
          console.error("Google AutocompleteService failed, trying OSM:", err);
        }
      }

      await triggerOsmLgaFallback(queryStr);
    }, 400);

    return () => clearTimeout(delayQuery);
  }, [lgaPlacesSearch, addrLga, addrState]);

  const [images, setImages] = React.useState<string[]>(editingProduct?.imageUrls || (editingProduct?.imageUrl ? [editingProduct.imageUrl] : []));
  
  // Custom Service Fields
  const [subjectTaught, setSubjectTaught] = React.useState(editingProduct?.subjectTaught || "");
  const [subjectsWithPrices, setSubjectsWithPrices] = React.useState<any[]>(editingProduct?.subjectsWithPrices || [{ name: "", price: "" }]);
  const [certificateUrl, setCertificateUrl] = React.useState(editingProduct?.certificateUrl || "");
  const [pickupCoordinates, setPickupCoordinates] = React.useState<{ lat: number; lng: number } | null>(
    editingProduct?.pickupCoordinates || null
  );
  const [mapCenter, setMapCenter] = React.useState<{ lat: number; lng: number }>(
    editingProduct?.pickupCoordinates || { lat: 6.5157, lng: 3.3896 }
  );
  const [geocodingError, setGeocodingError] = React.useState<string>("");
  const [isVerifyingAddress, setIsVerifyingAddress] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (!editingProduct) {
      setBusinessName(
        currentUser?.businessName || 
        currentUser?.storefrontSettings?.businessName || 
        currentUser?.displayName || 
        ""
      );
    }
  }, [currentUser, editingProduct]);

  const verifyLocationAddress = async (addressString: string) => {
    if (!addressString || !addressString.trim()) {
      setGeocodingError("Please enter a valid address to pinpoint on the map.");
      return;
    }
    
    setIsVerifyingAddress(true);
    setGeocodingError("");
    
    // --- Fallback geocoding service: Nominatim OpenStreetMap ---
    const tryNominatimFallback = async (): Promise<boolean> => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressString)}&limit=1`;
        const res = await fetch(url, {
          headers: {
            "Accept-Language": "en",
            "User-Agent": "Shopiversity-Campus-App"
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            const item = data[0];
            const coords = { lat: parseFloat(item.lat), lng: parseFloat(item.lon) };
            setPickupCoordinates(coords);
            setMapCenter(coords);
            setGeocodingError("");
            setIsVerifyingAddress(false);
            return true;
          }
        }
      } catch (osmErr) {
        console.error("OSM Nominatim geocoding fallback failed:", osmErr);
      }
      return false;
    };

    // If Google Maps is still loading or API key is not yet set, use high-speed OSM Nominatim geocoding fallback immediately
    if (!GOOGLE_MAPS_API_KEY || !window.google || !window.google.maps) {
      console.log("Using OSM Nominatim fallback for geocoding...");
      const success = await tryNominatimFallback();
      if (success) {
        setIsVerifyingAddress(false);
        return;
      }
      // If Nominatim also fails, we won't print "Please try again in 1 second." since the SDK lacks credentials.
      // We print a helpful, friendly message and let them continue since the embed map will automatically search.
      setGeocodingError("");
      setIsVerifyingAddress(false);
      return;
    }
    
    try {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: addressString }, async (results, status) => {
        if (status === "OK" && results && results[0]) {
          const loc = results[0].geometry.location;
          const coords = { lat: loc.lat(), lng: loc.lng() };
          setPickupCoordinates(coords);
          setMapCenter(coords);
          setGeocodingError("");
          setIsVerifyingAddress(false);
        } else {
          console.warn(`Google Geocoding failed with status: ${status}. Retrying via OSM Nominatim...`);
          const success = await tryNominatimFallback();
          if (!success) {
            setGeocodingError("");
            setPickupCoordinates(null);
          }
          setIsVerifyingAddress(false);
        }
      });
    } catch (err: any) {
      console.error("Google Geocoder runtime error. Retrying via OSM Nominatim...", err);
      const success = await tryNominatimFallback();
      if (!success) {
        setGeocodingError("");
      }
      setIsVerifyingAddress(false);
    }
  };

  // Location is pre-filled and compiled coordinates via granular states above

  // Dedicated inputs for specific service types (Dynamic custom inputs)
  const [digitalFormat, setDigitalFormat] = React.useState(editingProduct?.digitalFormat || "GitHub Link / Remote");
  const [portfolioUrl, setPortfolioUrl] = React.useState(editingProduct?.portfolioUrl || "");
  const [eventRadius, setEventRadius] = React.useState(editingProduct?.eventRadius || "10");
  const [setupTime, setSetupTime] = React.useState(editingProduct?.setupTime || "1");
  const [includesEquipment, setIncludesEquipment] = React.useState(editingProduct?.includesEquipment ?? false);
  const [institutionName, setInstitutionName] = React.useState(editingProduct?.institutionName || "");
  const [gradeOrQualification, setGradeOrQualification] = React.useState(editingProduct?.gradeOrQualification || "");
  const [securityDeposit, setSecurityDeposit] = React.useState(editingProduct?.securityDeposit || "0");
  const [rentalDuration, setRentalDuration] = React.useState(editingProduct?.rentalDuration || "1");
  const [rentalDurationUnit, setRentalDurationUnit] = React.useState<"hours" | "days" | "weeks">(editingProduct?.rentalDurationUnit || "days");
  const [latePenalty, setLatePenalty] = React.useState(editingProduct?.latePenalty || "1000");
  const [rentalTerms, setRentalTerms] = React.useState(editingProduct?.rentalTerms || "");

  // Mapped dynamic fields state
  const [techStack, setTechStack] = React.useState(editingProduct?.techStack || "");
  const [preferredTime, setPreferredTime] = React.useState(editingProduct?.preferredTime || "");
  const [preferredVenue, setPreferredVenue] = React.useState(editingProduct?.preferredVenue || "");
  const [laundryPreference, setLaundryPreference] = React.useState(editingProduct?.laundryPreference || "Standard Room Sweep & Dusting");
  const [transitOption, setTransitOption] = React.useState(editingProduct?.transitOption || "On-foot Campus Runner");
  const [coverageArea, setCoverageArea] = React.useState(editingProduct?.coverageArea || "");

  const getComputedServiceType = (): "digital" | "event" | "physical" | "in-person" | "academic" | "rental" | "general" => {
    if (type !== "service") return "general";
    const nameLower = (name || "").toLowerCase().trim();
    const catLower = (category || "").toLowerCase().trim();

    // 1. Digital Services
    if (
      [
        "web", "graphic", "content writing", "social media",
        "digital marketing", "seo services", "copywriting", "blog writing", "cv/resume",
        "coding", "data analysis", "sheets help", "virtual assistant", "voice over", 
        "podcast", "nft design", "ai prompt", "app development", "mobile development",
        "ui/ux", "branding"
      ].some(term => nameLower.includes(term)) ||
      catLower === "tech & digital"
    ) {
      return "digital";
    }

    // 2. Academic & Certified
    if (
      [
        "tutoring", "academic research", "thesis", "writing help", "research assistance", 
        "counseling", "proofreading"
      ].some(term => nameLower.includes(term)) ||
      catLower === "academic & tutoring"
    ) {
      return "academic";
    }

    // 3. Event & Entertainment
    if (
      [
        "event planning", "dj", "sound system", "decor & styling", "mc", "hosting", "acoustics",
        "live band", "photo booth", "props", "backdrops", "videography", "drone", "stage rental", "bouncers",
        "modeling", "modelling", "ushering", "usher", "talent"
      ].some(term => nameLower.includes(term)) ||
      catLower === "events & lifestyle"
    ) {
      return "event";
    }

    // 4. Physical / Cooking / Catering / Handmade
    if (
      [
        "cake", "pastries", "catering", "mocktail", "cocktail", "meal prep", "snacks", "handmade",
        "crafts", "beadwork", "jewelry", "t-shirts", "stickers", "crochet", "knitted", "thrift",
        "skincare", "hair products", "artwork", "paintings"
      ].some(term => nameLower.includes(term)) ||
      catLower === "catering & cooking" ||
      catLower === "food & drinks"
    ) {
      return "physical";
    }

    // 5. Rental & Booking
    if (
      [
        "rental", "booking", "sublet", "hostel hunting"
      ].some(term => nameLower.includes(term)) ||
      catLower === "real estate & housing"
    ) {
      return "rental";
    }

    // 6. In-Person & Location
    if (
      [
        "cleaning", "laundry", "repairs", "hairdressing", "makeup", "barbering", "shoe making",
        "carpentry", "electrical", "plumbing", "fumigation", "personal training", "hairstyling", "interior design", "nail tech"
      ].some(term => nameLower.includes(term)) ||
      catLower === "home & personal care" ||
      catLower === "cleaning & laundry" ||
      catLower === "handyman services"
    ) {
      return "in-person";
    }

    return "general";
  };
  
  const [loading, setLoading] = React.useState(false);
  const [loadingMessage, setLoadingMessage] = React.useState<string | null>(null);
  const [aiLoading, setAiLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [newProductId, setNewProductId] = React.useState<string | null>(null);
  const [lastCreatedProduct, setLastCreatedProduct] = React.useState<any>(null);
  const [menuItems, setMenuItems] = React.useState<any[]>(editingProduct?.menuItems || []);
  const isFoodAndDrinks = category === "Food & Drinks" || category === "Catering & Cooking" || [
    "food", "drink", "catering", "cooking", "cake", "pastries", "mocktail", "cocktail", "meal prep", "snacks", "small chops", "puff puff", "shawarma", "burger", "pizza"
  ].some(term => (name || "").toLowerCase().includes(term) || (customServiceName || "").toLowerCase().includes(term));

  const SERVICE_OPTIONS = [
    "Graphic Design", "Tutoring", "Cleaning", "Delivery", "Repairs", "Hairdressing", 
    "Makeup Artistry", "Photography", "Catering", "Food & Drinks", "Laundry", "Tailoring/Fashion Design", 
    "Web Development", "Content Writing", "Social Media Management", "Printing/Photocopying", 
    "Modeling", "Barbering", "Shoe Making/Repair", "Academic Research", "Event Planning", "Hostel Hunting",
    "Gas Refilling", "Carpentry", "Electrical Works", "Plumbing", "Fumigation", "Personal Training",
    "DJ & Sound System", "Event Decor & Styling", "MC & Event Hosting", "Cake Baking & Pastries", 
    "Mocktail & Cocktail Bar", "Tents, Chairs & Stage Rental", "Event Security & Bouncers", 
    "Live Band & Acoustic Performance", "Photo Booth Rental", "Party Props & Backdrops", 
    "Videography & Drone Coverage", "Other"
  ];

  const HOME_SERVICE_REQUIRED = [
    "Cleaning", "Repairs", "Hairdressing", "Makeup Artistry", "Catering", "Food & Drinks", "Laundry", 
    "Tailoring/Fashion Design", "Barbering", "Photography", "Carpentry", "Electrical Works", "Plumbing", "Fumigation"
  ];

  const GOODS_CATEGORIES = [
    "Electronics", "Textbooks", "Clothing", "Furniture", "Beauty & Health",
    "Shoes & Bags", "Phones & Accessories", "Computers & Gadgets", "Musical Instruments", 
    "Sports & Outdoors", "Stationery & Art Supplies", "Home Appliances", "Collectibles & Art",
    "Data Subscriptions", "Other"
  ];

  const SERVICE_CATEGORIES = [
    "Creative & Design", "Academic & Tutoring", "Home & Personal Care", "Tech & Digital", 
    "Events & Lifestyle", "Logistics & Errands", "Real Estate & Housing", "Handyman Services",
    "Tailoring & Fashion", "Cleaning & Laundry", "Photography & Video", "Catering & Cooking",
    "Other"
  ];

  const [customCategory, setCustomCategory] = React.useState("");
  const [showOtherCategoryInput, setShowOtherCategoryInput] = React.useState(false);

  // Auto-map custom service name to existing if it matches
  React.useEffect(() => {
    if (type === "service" && name === "Other" && customServiceName) {
      const matched = SERVICE_OPTIONS.find(s => s.toLowerCase() === customServiceName.trim().toLowerCase());
      if (matched && matched !== "Other") {
        setName(matched);
        setCustomServiceName("");
      }
    }
  }, [customServiceName, name, type]);

  // Auto-map custom category to existing if it matches
  React.useEffect(() => {
    if (showOtherCategoryInput && customCategory) {
      const allOptions = type === "good" ? GOODS_CATEGORIES : SERVICE_CATEGORIES;
      const matched = allOptions.find(cat => cat.toLowerCase() === customCategory.trim().toLowerCase());
      if (matched && matched !== "Other") {
        setCategory(matched);
        setCustomCategory("");
        setShowOtherCategoryInput(false);
      }
    }
  }, [customCategory, type, showOtherCategoryInput]);

  // Sync category and clean name/custom service fields when type changes to prevent duplicate value issues
  React.useEffect(() => {
    if (!editingProduct) {
      if (type === "good") {
        setCategory("Electronics");
        setName("");
      } else {
        setCategory("");
        setName("");
      }
    }
  }, [type, editingProduct]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setLoading(true);
      try {
        const newImages: string[] = [];
        for (let i = 0; i < files.length; i++) {
          const base64 = await compressImage(files[i]);
          newImages.push(base64);
        }
        setImages(prev => [...prev, ...newImages].slice(0, 5)); // Limit to 5 images
      } catch (error) {
        console.error("Error compressing image:", error);
        alert("Failed to process image. Please try a different one.");
      } finally {
        setLoading(false);
      }
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const generateAIDescription = async () => {
    if (!name || name.length < 3) {
      setError("Please enter a product name first to generate a description.");
      return;
    }

    setAiLoading(true);
    setError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Generate a professional, engaging, and concise product description for a ${type} named "${name}" in the "${category}" category. 
      Focus on benefits and key features. Keep it under 150 words. 
      Do not use markdown formatting like bold or bullet points, just plain text.`;

      const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: prompt,
      });

      if (response.text) {
        setDescription(response.text.trim());
      }
    } catch (err: any) {
      console.error("AI Generation Error:", err);
      setError("Failed to generate AI description. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    if (type === "service" && !category) {
      setError("Please select a category for your service.");
      setLoading(false);
      return;
    }

    // Restriction: Seller must have completed their profile
    const isProfileComplete = !!currentUser?.schoolName && !!currentUser?.state && !!currentUser?.city && (currentUser?.role === "seller" || !!currentUser?.deliveryAddress);
    if (!isProfileComplete) {
      setError("Please complete your profile in Settings (School Name, State, City, and Delivery Address) before listing products.");
      // Auto-scroll to error if needed can be handled by UI, but we'll set the error state
      return;
    }

    if (deliveryOptions.delivery && logisticsType === "registered" && !selectedLogisticsCompanyId) {
      setError("Please select a registered logistics partner from the options.");
      return;
    }

    // Validation of pickup/meetup coordinates using geocoder if enabled on submit
    let addressToVerify = location.trim();
    if (type === "service" && !addressToVerify) {
      addressToVerify = (currentUser?.deliveryAddress || "").trim();
    }

    if (deliveryOptions.pickup && addressToVerify) {
      if (GOOGLE_MAPS_API_KEY && window.google?.maps) {
        setLoading(true);
        setError(null);
        setGeocodingError("");
        const geocoder = new window.google.maps.Geocoder();
        try {
          const coords = await new Promise<{ lat: number; lng: number }>((resolve, reject) => {
            geocoder.geocode({ address: addressToVerify }, (results, status) => {
              if (status === "OK" && results && results[0]) {
                const loc = results[0].geometry.location;
                resolve({ lat: loc.lat(), lng: loc.lng() });
              } else {
                reject(new Error("Invalid address"));
              }
            });
          });
          setPickupCoordinates(coords);
          setMapCenter(coords);
          setGeocodingError("");
        } catch (err) {
          // If Google fails, try the OSM Nominatim fallback as a rescue
          try {
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressToVerify)}&limit=1`;
            const res = await fetch(url, {
              headers: {
                "Accept-Language": "en",
                "User-Agent": "Shopiversity-Campus-App"
              }
            });
            if (res.ok) {
              const data = await res.json();
              if (data && data.length > 0) {
                const item = data[0];
                const coords = { lat: parseFloat(item.lat), lng: parseFloat(item.lon) };
                setPickupCoordinates(coords);
                setMapCenter(coords);
                setGeocodingError("");
              } else {
                throw new Error("Nominatim could not resolve address");
              }
            } else {
              throw new Error("Nominatim service unavailable");
            }
          } catch (osmErr) {
            console.log("Could not pinpoint exact map coordinates for:", addressToVerify);
            // Don't fully block, let them save the product anyway!
          }
        }
      } else {
        // Google Maps not available/configured - run high-speed OSM Nominatim geocoder background check
        if (!pickupCoordinates) {
          try {
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressToVerify)}&limit=1`;
            const res = await fetch(url, {
              headers: {
                "Accept-Language": "en",
                "User-Agent": "Shopiversity-Campus-App"
              }
            });
            if (res.ok) {
              const data = await res.json();
              if (data && data.length > 0) {
                const item = data[0];
                const coords = { lat: parseFloat(item.lat), lng: parseFloat(item.lon) };
                setPickupCoordinates(coords);
                setMapCenter(coords);
              }
            }
          } catch (osmErr) {
            console.error("OSM background geocode failed:", osmErr);
          }
        }
      }
    }

    // Validation: School matches location
    const schoolMatched = !currentUser?.campus || !addressToVerify || addressToVerify.toLowerCase().includes(currentUser.campus.toLowerCase());
    
    // If not matched, we just warn or auto-append rather than blocking
    let finalLocation = addressToVerify || currentUser?.campus || "";
    
    setLoading(true);
    setLoadingMessage("AI Verifying compliance & Google search matching...");
    setError(null);
    setSuccessMessage(null);

    try {
      const targetName = (isFoodAndDrinks || name === "Other") ? (customServiceName || name) : name;
      const targetImage = images[0] || null;

      const valResponse = await fetch("/api/gemini/validate-product", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          productName: targetName,
          productType: type,
          productCategory: category,
          productImage: targetImage
        })
      });

      if (valResponse.ok) {
        const valResult = await valResponse.json();
        if (valResult.success && !valResult.isValid) {
          if (valResult.isIllegalOrInappropriate) {
            setError(`🚫 Listing Restricted: ${valResult.reason || "This product violates safety, compliance or campus community guidelines."}`);
            setLoading(false);
            setLoadingMessage(null);
            return;
          } else if (!valResult.exists) {
            setError(`🚫 Verification Failed: "${targetName}" does not exist in our Google search indexes. Please verify the spelling or name.`);
            setLoading(false);
            setLoadingMessage(null);
            return;
          } else if (!valResult.imageMatches) {
            setError(`🚫 Image Mismatch: The provided picture does not match the product name "${targetName}" or was not found on Google. Please upload a real, accurate picture.`);
            setLoading(false);
            setLoadingMessage(null);
            return;
          } else {
            setError(`🚫 Verification Failed: ${valResult.reason || "Google search verification failed."}`);
            setLoading(false);
            setLoadingMessage(null);
            return;
          }
        }
      }
    } catch (valErr) {
      console.warn("AI verification error, continuing gracefully:", valErr);
    }

    setLoadingMessage("Saving listing to campus marketplace...");
    try {
      const productRef = editingProduct 
        ? doc(db, "products", editingProduct.id)
        : doc(collection(db, "products"));
      
      const productId = productRef.id;

      const finalImages = isFoodAndDrinks 
        ? (images.length > 0 ? images : menuItems.map(m => m.imageUrl).filter(Boolean))
        : images;

      const computedServiceType = getComputedServiceType();
      const productData: any = {
        id: productId,
        type,
        name: (isFoodAndDrinks || name === "Other") ? (customServiceName || name) : name,
        businessName: businessName || currentUser?.displayName || "Anonymous",
        description,
        price: parseFloat(price) || 0,
        category: category === "Other" ? (customCategory || category) : category,
        stock: type === "service" ? 999999 : (parseInt(stock) || 0),
        initialStock: type === "service" ? 999999 : (parseInt(stock) || 0),
        condition,
        // Dynamic Fields Metadata
        subjectTaught: category === "Academic & Tutoring" ? subjectTaught : null,
        subjectsWithPrices: category === "Academic & Tutoring" ? subjectsWithPrices : null,
        certificateUrl: type === "service" ? (certificateUrl || null) : null,
        pickupCoordinates: (deliveryOptions.pickup && pickupCoordinates) ? pickupCoordinates : null,
        deliveryOptions: type === "good" ? {
          ...deliveryOptions,
          deliveryPrice: logisticsType === "registered" 
            ? (allLogisticsCompanies.find(c => c.id === selectedLogisticsCompanyId)?.baseDeliveryPrice || 0)
            : deliveryOptions.deliveryPrice
        } : (computedServiceType === "digital" ? {
          delivery: false,
          pickup: false,
          deliveryPrice: 0
        } : computedServiceType === "event" ? {
          delivery: false,
          pickup: true,
          deliveryPrice: 0
        } : {
          delivery: deliveryOptions.delivery,
          pickup: true,
          deliveryPrice: logisticsType === "registered" 
            ? (allLogisticsCompanies.find(c => c.id === selectedLogisticsCompanyId)?.baseDeliveryPrice || 0)
            : deliveryOptions.deliveryPrice
        }),
        logisticsType,
        logisticsCompanyId: logisticsType === "registered" ? selectedLogisticsCompanyId : null,
        logisticsCompanyName: logisticsType === "registered" ? (allLogisticsCompanies.find(c => c.id === selectedLogisticsCompanyId)?.companyName || null) : null,
        deliveryTime: parseInt(deliveryTime) || 1,
        deliveryTimeUnit,
        location: computedServiceType === "digital" ? "Online/Remote" : finalLocation,
        imageUrl: (type === "good" || isFoodAndDrinks || type === "service") ? (finalImages[0] || `https://picsum.photos/seed/${name.replace(/\s/g, '')}/400/400`) : "",
        imageUrls: (type === "good" || isFoodAndDrinks || type === "service") ? (finalImages.length > 0 ? finalImages : [`https://picsum.photos/seed/${name.replace(/\s/g, '')}/400/400`]) : [],
        menuItems: (isFoodAndDrinks || category === "Data Subscriptions" || type === "service") ? menuItems : [],
        sellerId: auth.currentUser.uid,
        sellerName: currentUser?.displayName || auth.currentUser.displayName || "Anonymous",
        sellerVerified: currentUser?.isVerified || false,
        createdAt: editingProduct?.createdAt || new Date().toISOString(),
        isHibernated: false,
        serialNumber: editingProduct?.serialNumber || `SN-${Math.random().toString(36).substr(2, 9).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
        
        // Discount, promo and custom inputs
        discountPercent: parseFloat(discountPercent) || 0,
        promoCode: promoCode.trim(),
        priceBefore: parseFloat(priceBefore) || 0,
        collectionType: collectionType.trim(),
        businessAddress: manualBusinessAddress.trim(),
        pickupSchool: addrSchool || null,
        
        // Dynamic Specific Fields
        digitalFormat: computedServiceType === "digital" ? digitalFormat : null,
        portfolioUrl: computedServiceType === "digital" ? portfolioUrl : null,
        eventRadius: computedServiceType === "event" ? eventRadius : null,
        setupTime: computedServiceType === "event" ? setupTime : null,
        includesEquipment: computedServiceType === "event" ? includesEquipment : null,
        institutionName: computedServiceType === "academic" ? institutionName : null,
        gradeOrQualification: computedServiceType === "academic" ? gradeOrQualification : null,
        securityDeposit: computedServiceType === "rental" ? securityDeposit : null,
        rentalDuration: computedServiceType === "rental" ? rentalDuration : null,
        rentalDurationUnit: computedServiceType === "rental" ? rentalDurationUnit : null,
        latePenalty: computedServiceType === "rental" ? latePenalty : null,
        rentalTerms: computedServiceType === "rental" ? rentalTerms : null,
        
        // Mapped Dynamic Fields configuration
        techStack: category === "Tech & Digital" || category === "Web Development" ? techStack : null,
        preferredTime: category === "Cleaning & Laundry" || category === "Home Cleaning" || category === "Home & Personal Care" ? preferredTime : null,
        preferredVenue: category === "Home & Personal Care" ? preferredVenue : null,
        laundryPreference: category === "Cleaning & Laundry" || category === "Home Cleaning" ? laundryPreference : null,
        transitOption: category === "Logistics & Errands" ? transitOption : null,
        coverageArea: category === "Logistics & Errands" ? coverageArea : null
      };

      if (type === "service") {
        productData.pricingType = pricingType;
      }

      await setDoc(productRef, productData, { merge: true });
      setLastCreatedProduct(productData);
      setNewProductId(productId);
      setSuccessMessage("🎉 Congratulations! I have listed my product successfully.");
    } catch (error) {
      console.error("Submission Error:", error);
      const errorMessage = handleFirestoreError(error, editingProduct ? OperationType.UPDATE : OperationType.CREATE, editingProduct ? `products/${editingProduct.id}` : "products");
      setError(errorMessage);
    } finally {
      setLoading(false);
      setLoadingMessage(null);
    }
  };

  const isProfileIncomplete = currentUser?.profileCompleted === false;

  if (isProfileIncomplete) {
    return (
      <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-12 shadow-sm text-center">
        <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">Profile Incomplete</h3>
        <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium">
          You must complete your profile (School, State, City, and Delivery Address) before you can list products for sale.
        </p>
        <button 
          onClick={() => {
            // Signal to parent to switch to settings tab
            const event = new CustomEvent('switch-seller-tab', { detail: 'settings' });
            window.dispatchEvent(event);
          }}
          className="px-8 py-4 bg-brand-gradient text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 hover:shadow-indigo-300 transition-all flex items-center justify-center gap-2 mx-auto"
        >
          Go to Profile Settings
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto bg-gradient-to-b from-white to-slate-50/50 dark:from-zinc-950 dark:to-zinc-900/50 rounded-3xl border border-slate-200 dark:border-zinc-800 p-6 sm:p-10 shadow-2xl transition-all relative overflow-hidden">
      {/* Visual background lights for an elevated design */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-6 mb-8">
        <div>
          <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              {editingProduct ? "Refine Your Listing" : "List on Campus Storefront"}
            </span>
          </h3>
          <p className="text-slate-400 dark:text-zinc-500 text-xs mt-1.5 font-bold uppercase tracking-wider block">
            ⭐ Reach thousands of students with escrow protection
          </p>
        </div>
        <div className="w-12 h-12 bg-purple-50 dark:bg-purple-950/30 rounded-2xl flex items-center justify-center text-purple-600 dark:text-purple-400 font-extrabold shrink-0 shadow-inner">
          🚀
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl text-red-600 dark:text-red-400 text-xs font-bold">
            {error}
          </div>
        )}
        {successMessage && (
          <AnimatePresence>
            <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="bg-white dark:bg-slate-900 rounded-[2.5rem] max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col"
              >
                {/* Header Banner - Brand Colors */}
                <div className="bg-brand-gradient p-8 text-center text-white relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 text-white font-black text-2xl shadow-md">
                    ✓
                  </div>
                  <h3 className="text-2xl font-black tracking-tight !text-white">{editingProduct ? "Listing Updated" : "Listing Published Successfully"}</h3>
                  <p className="text-purple-50 font-semibold text-xs uppercase tracking-widest mt-1">Receipt Ref: {lastCreatedProduct?.serialNumber?.substring(0, 14) || "SN-NEW-108"}</p>
                </div>

                {/* Details Section */}
                <div className="p-8 space-y-6 flex-1 overflow-y-auto">
                  
                  {/* Product Details Card */}
                  <div className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800/80">
                    <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden shrink-0 border border-slate-200/50 dark:border-slate-700/50">
                      <img 
                        src={lastCreatedProduct?.imageUrl || `https://picsum.photos/seed/default/400/400`} 
                        alt={lastCreatedProduct?.name} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <span className="text-[10px] font-black uppercase tracking-widest bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-md self-start mb-1">
                        {lastCreatedProduct?.category}
                      </span>
                      <h4 className="text-base font-black text-slate-900 dark:text-white truncate">{lastCreatedProduct?.name || "Campus Listing"}</h4>
                      <p className="text-lg font-black text-purple-600 dark:text-purple-400 mt-0.5">
                        ₦{lastCreatedProduct?.price?.toLocaleString() || "0"}
                        {lastCreatedProduct?.pricingType ? ` / ${lastCreatedProduct.pricingType}` : ""}
                      </p>
                    </div>
                  </div>

                  {/* Fact Sheet (Metadata Grid) */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs bg-slate-50/50 dark:bg-slate-800/20 p-4 rounded-3xl border border-dashed border-slate-100 dark:border-slate-850">
                    <div>
                      <span className="text-slate-400 font-bold block">Unique Serial:</span>
                      <span className="font-mono text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase truncate block">
                        {lastCreatedProduct?.serialNumber || "SN-GENERATED"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block">Type / Listing:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 capitalize block">
                        {lastCreatedProduct?.type === "good" ? "📦 Physical Item" : "⚡ Digital Service"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block">Location (Campus):</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                        📍 {lastCreatedProduct?.location || "Main Campus"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block">Escrow Status:</span>
                      <span className="font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        🛡️ Active Escrow
                      </span>
                    </div>
                  </div>

                  {/* Safety Message */}
                  <div className="p-4 bg-purple-50 dark:bg-purple-950/10 rounded-2xl text-[11px] text-purple-705 dark:text-purple-300 font-semibold flex items-start gap-2.5 font-sans">
                    <span className="text-base leading-none">💡</span>
                    <div>
                      <p className="font-bold">Did you know?</p>
                      <p className="opacity-90 mt-0.5">Campus buyers can only release payments once they confirm receipt of your item or completion of your service successfully.</p>
                    </div>
                  </div>

                </div>

                {/* Footer Controls */}
                <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800/50 flex flex-col gap-3">
                  <div className="flex gap-4">
                    <button 
                      type="button"
                      onClick={() => {
                        setSuccessMessage(null);
                        onSuccess();
                        const event = new CustomEvent('view-seller-store', { 
                          detail: { 
                            sellerId: currentUser?.uid || auth.currentUser?.uid, 
                            previewSettings: null 
                          } 
                        });
                        window.dispatchEvent(event);
                      }}
                      className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl font-black text-sm transition-all focus:ring-2 focus:ring-purple-500"
                    >
                      My Store
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        setSuccessMessage(null);
                        onSuccess();
                        if (lastCreatedProduct) {
                          const event = new CustomEvent('view-product-detail', { detail: lastCreatedProduct });
                          window.dispatchEvent(event);
                        }
                      }}
                      className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-sm shadow-lg shadow-emerald-100 dark:shadow-emerald-950/20 transition-all focus:ring-2 focus:ring-emerald-500"
                    >
                      View Live Product
                    </button>
                  </div>
                  
                  <button 
                    type="button"
                    onClick={() => {
                      // Reset listing state completely to prepare for next item
                      setSuccessMessage(null);
                      setLastCreatedProduct(null);
                      setFormStep("details");
                      setName("");
                      setCustomServiceName("");
                      setBusinessName(
                        currentUser?.businessName || 
                        currentUser?.storefrontSettings?.businessName || 
                        currentUser?.displayName || 
                        ""
                      );
                      setDescription("");
                      setPrice("");
                      setStock("1");
                      setCategory(type === "service" ? "" : "Electronics");
                      setPricingType("fixed");
                      setCondition("new");
                      setDeliveryOptions({
                        delivery: true,
                        pickup: true,
                        deliveryPrice: 500
                      });
                      setDeliveryPriceInput("500");
                      setDeliveryTime("1");
                      setDeliveryTimeUnit("days");
                      setLocation("");
                      setDiscountPercent("");
                      setPromoCode("");
                      setPriceBefore("");
                      setCollectionType("");
                      setManualBusinessAddress("");
                      setAddrState("");
                      setAddrLga("");
                      setAddrCity("");
                      setAddrStreet("");
                      setAddrSchool("");
                      setCampusSearchQuery("");
                      setImages([]);
                      setSubjectTaught("");
                      setSubjectsWithPrices([{ name: "", price: "" }]);
                      setCertificateUrl("");
                      setPickupCoordinates(null);
                      setMapCenter({ lat: 6.5157, lng: 3.3896 });
                      setGeocodingError("");
                      setIsVerifyingAddress(false);
                    }}
                    className="w-full py-3.5 bg-brand-gradient hover:-translate-y-0.5 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-purple-200 dark:shadow-purple-950/20 transition-all"
                  >
                    🚀 List Another Listing
                  </button>
                </div>

              </motion.div>
            </div>
          </AnimatePresence>
        )}

        {/* Handcrafted Stepper for Mobile Form */}
        <div className="flex items-center justify-between pb-6 mb-4 border-b border-slate-100 dark:border-zinc-800">
          {[
            { id: "details", label: "Details", icon: "📝" },
            { id: "pricing", label: "Pricing", icon: "💰" },
            { id: "logistics", label: "Logistics", icon: "🚚" },
            { id: "images", label: "Media", icon: "🖼️" }
          ].map((step, idx) => {
            const isActive = formStep === step.id;
            const isDone = ["details", "pricing", "logistics", "images"].indexOf(formStep) > ["details", "pricing", "logistics", "images"].indexOf(step.id);
            return (
              <React.Fragment key={step.id}>
                {idx > 0 && <div className={`flex-1 h-0.5 mx-1 ${isDone ? "bg-purple-600" : "bg-slate-200 dark:bg-zinc-800"}`} />}
                <button
                  type="button"
                  onClick={() => setFormStep(step.id as any)}
                  className={cn(
                    "flex flex-col items-center gap-1 cursor-pointer select-none border-none outline-none bg-transparent transition-all",
                    isActive ? "scale-105 font-black" : "opacity-50"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center text-xs transition-all",
                    isActive ? "bg-purple-600 text-white font-black scale-110 shadow-lg shadow-purple-500/20" : (isDone ? "bg-purple-100 text-purple-600 dark:bg-purple-950/40" : "bg-slate-100 dark:bg-zinc-800 text-slate-500")
                  )}>
                    {step.icon}
                  </div>
                  <span className="text-[10px] uppercase tracking-wider font-bold">{step.label}</span>
                </button>
              </React.Fragment>
            );
          })}
        </div>

        <div className={formStep === "details" ? "space-y-6" : "hidden"}>
          {/* Dynamic Service Fields */}
          {type === "service" && (() => {
          const compType = getComputedServiceType();
          const mapping = getDynamicFieldsForCategory(category);
          
          const getFieldState = (id: string) => {
            switch(id) {
              case "techStack": return { value: techStack, onChange: setTechStack };
              case "digitalFormat": return { value: digitalFormat, onChange: setDigitalFormat };
              case "portfolioUrl": return { value: portfolioUrl, onChange: setPortfolioUrl };
              case "preferredTime": return { value: preferredTime, onChange: setPreferredTime };
              case "preferredVenue": return { value: preferredVenue, onChange: setPreferredVenue };
              case "laundryPreference": return { value: laundryPreference, onChange: setLaundryPreference };
              case "transitOption": return { value: transitOption, onChange: setTransitOption };
              case "coverageArea": return { value: coverageArea, onChange: setCoverageArea };
              case "institutionName": return { value: institutionName, onChange: setInstitutionName };
              case "gradeOrQualification": return { value: gradeOrQualification, onChange: setGradeOrQualification };
              case "subjectTaught": return { value: subjectTaught, onChange: setSubjectTaught };
              case "setupTime": return { value: setupTime, onChange: setSetupTime };
              case "eventRadius": return { value: eventRadius, onChange: setEventRadius };
              case "includesEquipment": return { value: includesEquipment, onChange: setIncludesEquipment };
              case "securityDeposit": return { value: securityDeposit, onChange: setSecurityDeposit };
              case "rentalDuration": return { value: rentalDuration, onChange: setRentalDuration };
              case "rentalTerms": return { value: rentalTerms, onChange: setRentalTerms };
              case "customServiceName": return { value: customServiceName, onChange: setCustomServiceName };
              default: return { value: "", onChange: () => {} };
            }
          };

          return (
            <div className="p-6 bg-slate-50/60 dark:bg-zinc-950/40 rounded-3xl border border-slate-200 dark:border-zinc-800/80 space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-widest text-[#ca8a04] dark:text-orange-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-orange-500" />
                  Service Customization
                </h4>
                <span className="text-[10px] font-black uppercase tracking-widest bg-orange-100 dark:bg-orange-950/45 text-orange-600 dark:text-orange-400 px-3 py-1 rounded-full">
                  {category ? `Category: ${category}` : "Choose Category below"}
                </span>
              </div>

              {category && mapping.fields.length > 0 ? (
                <div className="space-y-4">
                  <div className="p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10 text-[11px] text-amber-700 dark:text-amber-400 font-semibold mb-2">
                    💡 <strong>{mapping.title}:</strong> Fill in specific choices for {category} below to list your service beautifully!
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {mapping.fields.map((field) => {
                      const stateVal = getFieldState(field.id);
                      return (
                        <div key={field.id} className="space-y-2 col-span-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 font-bold">
                            {field.label} {field.required && <span className="text-red-500">*</span>}
                          </label>
                          {field.type === 'select' ? (
                            <select
                              value={stateVal.value as string}
                              onChange={(e) => stateVal.onChange(e.target.value)}
                              className="w-full h-12 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-indigo-500 transition-all text-slate-800 dark:text-slate-100"
                            >
                              {field.options?.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          ) : field.type === 'textarea' ? (
                            <textarea
                              rows={2}
                              value={stateVal.value as string}
                              onChange={(e) => stateVal.onChange(e.target.value)}
                              placeholder={field.placeholder}
                              required={field.required}
                              className="w-full p-4 col-span-1 md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-indigo-500 transition-all text-slate-800 dark:text-slate-100 resize-none"
                            />
                          ) : field.type === 'checkbox' ? (
                            <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{field.label}</span>
                              <input
                                type="checkbox"
                                checked={!!stateVal.value}
                                onChange={(e) => stateVal.onChange(e.target.checked)}
                                className="w-5 h-5 accent-purple-600 rounded"
                              />
                            </div>
                          ) : (
                            <input
                              type={field.type}
                              value={stateVal.value as string}
                              onChange={(e) => stateVal.onChange(e.target.value)}
                              placeholder={field.placeholder}
                              required={field.required}
                              className="w-full h-12 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-indigo-500 transition-all text-slate-800 dark:text-slate-100"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 dark:text-slate-500 italic ml-1">
                  {!category ? "💡 Please choose a Service Category below to display customized dynamic fields." : "✨ Direct Listing: No additional category specific field required."}
                </p>
              )}

              {/* Competency Certificate for all services */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 font-bold">
                  Competency Certificate or Supporting Credentials {compType === "academic" ? "(REQUIRED)" : "(Optional)"}
                </label>
                <div className="flex gap-2">
                  <input 
                    required={compType === "academic"}
                    value={certificateUrl}
                    onChange={(e) => setCertificateUrl(e.target.value)}
                    placeholder={compType === "academic" ? "REQUIRED: Paste transcript or credentials link" : "Paste certificate/credentials link or upload below"}
                    className="flex-1 h-12 px-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-705 rounded-xl text-sm font-sans"
                  />
                  <div className="relative">
                    <input 
                      type="file" 
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                           const base64 = await compressImage(file);
                           setCertificateUrl(base64);
                        }
                      }}
                      className="hidden" 
                      id="cert-upload-form"
                    />
                    <label htmlFor="cert-upload-form" className="flex items-center gap-2 px-4 h-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-705 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700">
                      <Upload className="w-4 h-4 text-slate-500" />
                    </label>
                  </div>
                </div>
              </div>

              {/* Notice period with dynamic labels based on service type */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 font-bold">
                  {compType === "digital" ? "Digital Turnaround time (Lead Notice)" : compType === "academic" ? "Tutoring Booking Lead time" : "Service Coordination Notice Period"}
                </label>
                <div className="flex gap-3">
                  <input 
                    required
                    type="number"
                    min="1"
                    value={deliveryTime}
                    onChange={(e) => setDeliveryTime(e.target.value)}
                    className="w-24 h-12 px-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  />
                  <select 
                    value={deliveryTimeUnit}
                    onChange={(e) => setDeliveryTimeUnit(e.target.value as any)}
                    className="flex-1 h-12 px-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm appearance-none"
                  >
                    <option value="hours">Hours Notice</option>
                    <option value="days">Days Notice</option>
                    <option value="weeks">Weeks Notice</option>
                  </select>
                </div>
              </div>
            </div>
          );
        })()}

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
              Business Name / Brand
            </label>
            <input 
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full h-14 px-6 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-white font-medium placeholder:text-slate-400"
              placeholder={isFoodAndDrinks ? "e.g. Mama Cass" : "e.g. Apple or My Boutique"}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
              {isFoodAndDrinks || type === "service" ? "Service/Main Item Name" : "Product Name"}
            </label>
            {isFoodAndDrinks ? (
              <div className="space-y-3">
                <select
                  required
                  value={customServiceName === "Traditional Meals" || customServiceName === "Fast Food" || customServiceName === "Drinks & Cocktails" || customServiceName === "Snacks & Pastries" || customServiceName === "Street Food" || customServiceName === "Healthy/Vegan" ? customServiceName : "Other"}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "Other") {
                      setCustomServiceName("");
                    } else {
                      setCustomServiceName(val);
                      setName(val);
                      if (val === "Healthy/Vegan") setCategory("Food & Drinks");
                    }
                  }}
                  className="w-full h-14 px-6 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 outline-none transition-all appearance-none text-slate-900 dark:text-white"
                >
                  <option value="" disabled>Select Menu Type...</option>
                  <option value="Traditional Meals">Traditional Meals</option>
                  <option value="Fast Food">Fast Food</option>
                  <option value="Street Food">Street Food</option>
                  <option value="Drinks & Cocktails">Drinks & Cocktails</option>
                  <option value="Snacks & Pastries">Snacks & Pastries</option>
                  <option value="Healthy/Vegan">Healthy/Vegan</option>
                  <option value="Other">Custom Food Menu...</option>
                </select>
                {(customServiceName === "" || !["Traditional Meals", "Fast Food", "Street Food", "Drinks & Cocktails", "Snacks & Pastries", "Healthy/Vegan"].includes(customServiceName)) && (
                  <input 
                    required
                    value={customServiceName}
                    onChange={(e) => setCustomServiceName(e.target.value)}
                    className="w-full h-14 px-6 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-white font-medium placeholder:text-slate-400"
                    placeholder="e.g. Jollof Rice & Chicken Platter"
                  />
                )}
              </div>
            ) : type === "good" ? (
            <input 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-14 px-6 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
              placeholder="e.g. iPhone 13 Pro Max"
            />
          ) : (
            <div className="space-y-3">
              <select 
                required
                value={name}
                onChange={(e) => {
                  const val = e.target.value;
                  setName(val);
                  
                  // Auto-category mapping
                  const categoryMap: Record<string, string> = {
                    "Graphic Design": "Creative & Design",
                    "Tutoring": "Academic & Tutoring",
                    "Cleaning": "Cleaning & Laundry",
                    "Delivery": "Logistics & Errands",
                    "Repairs": "Handyman Services",
                    "Hairdressing": "Home & Personal Care",
                    "Makeup Artistry": "Home & Personal Care",
                    "Photography": "Photography & Video",
                    "Catering": "Catering & Cooking",
                    "Food & Drinks": "Catering & Cooking",
                    "Laundry": "Cleaning & Laundry",
                    "Tailoring/Fashion Design": "Tailoring & Fashion",
                    "Web Development": "Tech & Digital",
                    "Content Writing": "Creative & Design",
                    "Social Media Management": "Tech & Digital",
                    "Printing/Photocopying": "Creative & Design",
                    "Modeling": "Creative & Design",
                    "Barbering": "Home & Personal Care",
                    "Shoe Making/Repair": "Handyman Services"
                  };
                  
                  if (categoryMap[val]) {
                    setCategory(categoryMap[val]);
                  } else if (val === "Other") {
                    setCategory("Other");
                    setShowOtherCategoryInput(true);
                  }

                  if (HOME_SERVICE_REQUIRED.includes(val)) {
                    setDeliveryOptions(prev => ({ ...prev, delivery: true }));
                  } else {
                    setDeliveryOptions(prev => ({ ...prev, delivery: false }));
                  }
                }}
                className="w-full h-14 px-6 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 outline-none transition-all appearance-none text-slate-900 dark:text-white"
              >
                <option value="" disabled className="text-slate-500">Select a service...</option>
                {SERVICE_OPTIONS.map(s => (
                  <option key={s} value={s} className="bg-slate-900">{s}</option>
                ))}
              </select>
              {name === "Other" && (
                <input 
                  required
                  type="text"
                  value={customServiceName}
                  onChange={(e) => setCustomServiceName(e.target.value)}
                  className="w-full h-14 px-6 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-white font-medium placeholder:text-slate-400"
                  placeholder="Enter your service name..."
                />
              )}
            </div>
          )}
        </div>
      </div>
      <div className="space-y-2">
          <div className="flex items-center justify-between ml-1">
            <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Description</label>
          </div>
          <textarea 
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-6 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 outline-none transition-all resize-none text-slate-900 dark:text-white placeholder:text-slate-400"
            placeholder={type === "good" ? "Describe your product in detail..." : "Describe your service and what you offer..."}
          />
      </div>
      </div>

      <div className={formStep === "pricing" ? "space-y-6" : "hidden"}>
      {/* Unified Deal & Pricing Workspace */}
      <div className="p-6 bg-slate-50 dark:bg-slate-800/20 border border-slate-200 dark:border-slate-800 rounded-[2rem] space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
          <Tag className="w-4 h-4 text-orange-500" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Pricing, Discounts & Collections</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {!isFoodAndDrinks ? (
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
                Price Now / Selling Price (₦)
              </label>
              <input 
                required
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full h-12 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-indigo-500 outline-none transition-all text-sm text-slate-900 dark:text-white font-bold"
                placeholder="0.00"
              />
            </div>
          ) : (
            <div className="space-y-1.5 col-span-1 sm:col-span-2">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Service Mode</label>
              <div className="h-12 px-4 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center text-slate-600 dark:text-slate-400 font-bold text-xs uppercase tracking-wider">
                Restaurant / Catering
              </div>
            </div>
          )}

          {!isFoodAndDrinks ? (
            <div className="space-y-1.5 relative">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Original Price / Price Before (₦)
                </label>
                {priceBefore && (
                  <button
                    type="button"
                    onClick={() => setPriceBefore("")}
                    className="text-[10px] font-bold text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                  >
                    Clear Comparison Price
                  </button>
                )}
              </div>
              <input 
                type="number"
                value={priceBefore}
                onChange={(e) => setPriceBefore(e.target.value)}
                className="w-full h-12 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-[#ff6b00] outline-none transition-all text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
                placeholder="e.g. 12000 (Shows a crossed-out comparison price to highlight discounts)"
              />
              <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold ml-1">
                Optional. If typed, buyers see this price crossed out next to the selling price to highlight a savings discount!
              </p>
            </div>
          ) : null}

          {type === "good" && !isFoodAndDrinks ? (
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Stock Quantity</label>
              <input 
                required
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full h-12 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-indigo-500 outline-none transition-all text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
                placeholder="1"
              />
            </div>
          ) : type === "service" && !isFoodAndDrinks ? (
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Pricing Detail</label>
              <select 
                value={pricingType}
                onChange={(e) => setPricingType(e.target.value as any)}
                className="w-full h-12 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-indigo-500 outline-none transition-all text-sm text-slate-900 dark:text-white"
              >
                <option value="fixed">Fixed Price</option>
                <option value="hourly">Per Hour</option>
                <option value="project">Per Project</option>
                <option value="daily">Per Day</option>
              </select>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
              Discount Percentage (%)
            </label>
            <input 
              type="number"
              min="0"
              max="100"
              value={discountPercent}
              onChange={(e) => setDiscountPercent(e.target.value)}
              className="w-full h-12 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-indigo-500 outline-none transition-all text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
              placeholder="e.g. 15 for 15% off"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
              Offer / Promo Code (for buyers)
            </label>
            <input 
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              className="w-full h-12 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-indigo-500 outline-none transition-all text-sm text-slate-900 dark:text-white placeholder:text-slate-400 uppercase tracking-wider font-mono font-bold"
              placeholder="e.g. UNILAG500"
            />
          </div>

          <div className="space-y-1.5 col-span-1 sm:col-span-2">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
              Promo or Collection Type [Manual]
            </label>
            <input 
              type="text"
              value={collectionType}
              onChange={(e) => setCollectionType(e.target.value)}
              className="w-full h-12 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-indigo-500 outline-none transition-all text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
              placeholder="e.g. Black Friday, Summer Wear, New Arrival"
            />
          </div>
        </div>
      </div>
        
        {!isFoodAndDrinks && (
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
              {category === "Academic & Tutoring" ? "Home Teaching (In-person) Availability" : "Available for Delivery/Pickup in"}
            </label>
            <div className="flex gap-3">
              <input 
                required
                type="number"
                min="1"
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value)}
                className="w-24 h-14 px-6 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
              />
              <select 
                value={deliveryTimeUnit}
                onChange={(e) => setDeliveryTimeUnit(e.target.value as any)}
                className="flex-1 h-14 px-6 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 outline-none transition-all appearance-none text-slate-900 dark:text-white"
              >
                <option value="hours" className="bg-white dark:bg-slate-900">Hours</option>
                <option value="days" className="bg-white dark:bg-slate-900">Days</option>
                <option value="weeks" className="bg-white dark:bg-slate-900">Weeks</option>
              </select>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Category</label>
          <div className="space-y-3">
            <select 
              value={category}
              onChange={(e) => {
                const val = e.target.value;
                setCategory(val);
                setShowOtherCategoryInput(val === "Other");
              }}
              className="w-full h-14 px-6 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 outline-none transition-all appearance-none text-slate-900 dark:text-white"
            >
              <option value="" disabled className="bg-white dark:bg-slate-900">Select Category</option>
              {type === "good" 
                ? GOODS_CATEGORIES.map(cat => (
                    <option key={cat} value={cat} className="bg-white dark:bg-slate-900">{cat}</option>
                  ))
                : SERVICE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat} className="bg-white dark:bg-slate-900">{cat}</option>
                  ))
              }
            </select>
            {showOtherCategoryInput && (
              <input 
                required
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="w-full h-14 px-6 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-white"
                placeholder="Enter custom category..."
              />
            )}
          </div>
        </div>

        {type === "good" && !isFoodAndDrinks && (
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Condition</label>
            <div className="grid grid-cols-3 gap-2">
              {["new", "refurbished", "used"].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCondition(c as any)}
                  className={cn(
                    "py-3 rounded-xl text-xs font-bold capitalize transition-all border",
                    condition === c 
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100 dark:shadow-indigo-900/20" 
                      : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-900/50"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}
        </div>

        <div className={formStep === "logistics" ? "space-y-6" : "hidden"}>
        {getComputedServiceType() === "digital" ? (
          <div className="p-6 bg-orange-500/5 dark:bg-orange-500/10 border border-orange-500/20 rounded-[2rem] space-y-3 shadow-sm antialiased">
            <h4 className="text-sm font-bold text-orange-600 dark:text-orange-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-500" />
              Digital Escrow Delivery Active
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed font-semibold">
              This service is classified as a **Digital Service**. Home Delivery and Physical Meetup settings have been automatically locked. Buyers can easily purchase online and you will deliver through digital channels.
            </p>
          </div>
        ) : getComputedServiceType() === "event" ? (
          <div className="p-6 bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/20 rounded-[2rem] space-y-3 shadow-sm antialiased">
            <h4 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Venue/Location Booking Active
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed font-semibold">
              This service is classified as an **Event or Talent Booking** (modeling, DJ, MC, booking, ushering). Home service/out-calls are disabled. Fulfillment is tied to the event location designated by the buyer, or met at your specified studio/meetup address.
            </p>
            
            <div className="space-y-2 mt-2">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block ml-1">
                Your Studio or Meetup/Agency Base Location (Optional pointer)
              </label>
              <input 
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full h-12 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-205 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                placeholder="e.g. Campus Studio, or Online zoom meeting pointer"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
              Fulfillment Options
            </label>
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] space-y-4 shadow-sm">
              {/* Option 1: Home Delivery / Home Service */}
              {type !== "service" && (
                <>
                  <div className="flex items-center justify-between gap-4">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center justify-center">
                        <input 
                          type="checkbox"
                          checked={deliveryOptions.delivery}
                          onChange={(e) => {
                            setDeliveryOptions(prev => ({ ...prev, delivery: e.target.checked }));
                            setLogisticsType("custom");
                          }}
                          className="peer h-6 w-6 appearance-none rounded-lg border-2 border-slate-200 dark:border-slate-200/20 checked:border-indigo-500 checked:bg-indigo-500 transition-all"
                        />
                        <CheckCircle className="absolute h-4 w-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 transition-colors block">
                          Home Delivery
                        </span>
                        <span className="text-[10px] text-slate-400 block font-bold">Deliver directly to the buyer's spot or hostel</span>
                      </div>
                    </label>
                  </div>

                  {deliveryOptions.delivery && (
                    <div className="mt-2 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Home Delivery Fee</span>
                          <span className="text-[9px] text-slate-400 block">Type the amount you charge for this delivery</span>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Fee: ₦</span>
                          <input 
                            type="text"
                            pattern="[0-9]*"
                            value={deliveryPriceInput}
                            onChange={(e) => {
                              const valText = e.target.value.replace(/[^0-9]/g, "");
                              setDeliveryPriceInput(valText);
                              const parsedVal = valText === "" ? 0 : parseInt(valText, 10);
                              setDeliveryOptions(prev => ({ ...prev, deliveryPrice: parsedVal }));
                            }}
                            className="w-20 bg-transparent text-sm font-bold text-slate-900 dark:text-white outline-none"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <hr className="border-slate-100 dark:border-slate-800" />
                </>
              )}
              
              {/* Option 2: Physical Meet */}
              <div>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input 
                      type="checkbox"
                      checked={deliveryOptions.pickup}
                      onChange={(e) => setDeliveryOptions(prev => ({ ...prev, pickup: e.target.checked }))}
                      className="peer h-6 w-6 appearance-none rounded-lg border-2 border-slate-200 dark:border-slate-700 checked:border-indigo-500 checked:bg-indigo-500 transition-all"
                    />
                    <CheckCircle className="absolute h-4 w-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 transition-colors block">
                      {type === "service" ? "Service Venue (Physical Meetup / Pickup)" : "Physical Meet (In-Person / Local Pickup)"}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-bold">Meetup exchange or physical service meetup on campus</span>
                  </div>
                </label>
              </div>
            </div>
            
            {(!deliveryOptions.delivery && !deliveryOptions.pickup) && (
              <p className="text-[10px] font-bold text-red-500 ml-1">Please select at least one fulfillment option</p>
            )}

            {/* If physical meet is chosen then service location should show up */}
            {deliveryOptions.pickup && (
              <div className="space-y-4 mt-4">
                <div className="p-5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-1 border-b border-slate-100 dark:border-slate-800 pb-2">
                    <MapPin className="w-4 h-4 text-[#ff6b00]" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Pickup Address Details (Nigeria)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Country option */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">Country</label>
                      <select 
                        disabled
                        value={addrCountry} 
                        onChange={(e) => setAddrCountry(e.target.value)}
                        className="w-full h-11 px-4 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none select-none text-xs text-slate-500 dark:text-slate-400 font-bold"
                      >
                        <option value="Nigeria">Nigeria 🇳🇬</option>
                      </select>
                    </div>

                    {/* State Option */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">State</label>
                      <select 
                        required={false}
                        value={addrState}
                        onChange={(e) => {
                          const stateVal = e.target.value;
                          setAddrState(stateVal);
                          // Auto set first LGA of the new state
                          const stateLgas = NIGERIAN_LGAS[stateVal] || [];
                          setAddrLga(stateLgas[0] || "");
                          // Auto set first City of the new state
                          const stateCities = STATE_CITIES[stateVal] || [];
                          setAddrCity(stateCities[0] || "");
                        }}
                        className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-[#ff6b00] outline-none transition-all text-xs text-slate-900 dark:text-white font-semibold shadow-sm"
                      >
                        <option value="">select state</option>
                        {NIGERIAN_STATES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    {/* LGA Option */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">Local Government (LGA)</label>
                      <select 
                        required={false}
                        value={addrLga}
                        onChange={(e) => setAddrLga(e.target.value)}
                        disabled={!addrState}
                        className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-[#ff6b00] outline-none transition-all text-xs text-slate-900 dark:text-white font-semibold disabled:opacity-50 shadow-sm"
                      >
                        <option value="">select local government</option>
                        {addrState && (NIGERIAN_LGAS[addrState] || []).map((l) => (
                          <option key={l} value={l}>{l}</option>
                        ))}
                      </select>
                    </div>

                    {/* City Option */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">City / Town</label>
                      <div className="flex gap-2">
                        <select 
                          value={STATE_CITIES[addrState]?.includes(addrCity) ? addrCity : "custom"}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "custom") {
                              setAddrCity("");
                            } else {
                              setAddrCity(val);
                            }
                          }}
                          disabled={!addrState}
                          className="flex-1 h-11 px-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-[#ff6b00] outline-none transition-all text-xs text-slate-900 dark:text-white font-semibold disabled:opacity-50 shadow-sm"
                        >
                          <option value="">select town/ city</option>
                          {addrState && (STATE_CITIES[addrState] || []).map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                          <option value="custom">✍️ Custom City...</option>
                        </select>
                        
                        {(!STATE_CITIES[addrState]?.includes(addrCity) || addrCity === "") && (
                          <input 
                            type="text"
                            placeholder="Type City..."
                            value={addrCity}
                            onChange={(e) => setAddrCity(e.target.value)}
                            className="w-1/2 h-11 px-3 bg-slate-50 dark:bg-slate-800 border-2 border-[#ff6b00]/60 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-[#ff6b00] outline-none transition-all text-xs text-slate-900 dark:text-white font-semibold shadow-sm"
                          />
                        )}
                      </div>
                    </div>

                    {/* GA/LGA Address/Spot search with map suggestions */}
                    {addrState && addrLga && (
                      <div className="space-y-1.5 sm:col-span-2 col-span-1 relative bg-orange-50/20 dark:bg-orange-950/5 p-4 rounded-xl border border-orange-200/40 dark:border-orange-800/10">
                        <label className="text-[10px] font-black text-[#ff6b00] dark:text-orange-400 uppercase tracking-wider block ml-1">
                          🔍 Google Map Address Options in {addrLga} LGA (Type/Search to pinpoint & select)
                        </label>
                        <div className="relative mt-1">
                          <input 
                            type="text"
                            placeholder={`e.g. Type popular markets, landmarks or streets in ${addrLga}...`}
                            value={lgaPlacesSearch}
                            onChange={(e) => setLgaPlacesSearch(e.target.value)}
                            onFocus={() => {
                              if (!lgaPlacesSearch) {
                                triggerDefaultLgaPlaces();
                              }
                            }}
                            className="w-full h-11 pl-10 pr-4 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl focus:border-[#ff6b00] outline-none transition-all text-xs text-slate-900 dark:text-white font-semibold shadow-sm"
                          />
                          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                            🔍
                          </div>
                          {isSearchingLgaPlaces && (
                            <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                              <Loader2 className="w-4 h-4 text-[#ff6b00] animate-spin" />
                            </div>
                          )}
                        </div>

                        {lgaPlacesSuggestions.length > 0 && (
                          <div className="absolute z-50 left-4 right-4 mt-2 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-2xl max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-805">
                            {lgaPlacesSuggestions.map((item, index) => (
                              <button
                                key={`lga-place-${index}`}
                                type="button"
                                onMouseDown={() => handleSelectLgaPlaceOption(item)}
                                className="w-full text-left px-4 py-3 text-xs font-semibold hover:bg-orange-50/50 dark:hover:bg-orange-95/20 text-slate-700 dark:text-slate-300 transition-colors flex items-start gap-2 border-none outline-none cursor-pointer"
                              >
                                <span className="text-[#ff6b00] text-sm leading-none shrink-0 mt-0.5">📍</span>
                                <div className="flex-1 min-w-0">
                                  <p className="font-extrabold truncate text-slate-900 dark:text-slate-100">{item.main_text}</p>
                                  <p className="text-[10px] text-slate-450 dark:text-slate-500 truncate mt-0.5">{item.display_name}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                        <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold ml-1 mt-1">
                          Typing here searches the Google map for exact landmarks inside {addrLga}. Selecting an option pinpoints it and populates the street address box below!
                        </p>
                      </div>
                    )}

                    {/* School/Campus Option (With Search Input) */}
                    <div className="space-y-1.5 sm:col-span-2 col-span-1 relative">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">
                        Campus / School Option (Pickup Location)
                      </label>
                      <div className="relative">
                        <input 
                          type="text"
                          placeholder="Type or search your school/campus..."
                          value={campusSearchQuery}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCampusSearchQuery(val);
                            setAddrSchool(val); // Sync to value
                            setShowCampusDropdown(true);
                          }}
                          onFocus={() => setShowCampusDropdown(true)}
                          onBlur={() => {
                            // Slight delay to allow clicking options before dropdown closes
                            setTimeout(() => setShowCampusDropdown(false), 250);
                          }}
                          className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-[#ff6b00] outline-none transition-all text-xs text-slate-900 dark:text-white font-semibold shadow-sm"
                        />
                        {campusSearchQuery && (
                          <button
                            type="button"
                            onClick={() => {
                              setCampusSearchQuery("");
                              setAddrSchool("");
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-304 px-2.5 py-1 rounded-lg font-black transition-all cursor-pointer"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      
                      {showCampusDropdown && (
                        <div className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-250 dark:border-zinc-800 shadow-2xl max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-800/80">
                          <button
                            type="button"
                            onMouseDown={() => {
                              setAddrSchool("");
                              setCampusSearchQuery("");
                              setShowCampusDropdown(false);
                            }}
                            className="w-full text-left px-4 py-3 text-xs font-semibold hover:bg-orange-50/50 dark:hover:bg-orange-950/20 text-slate-400 dark:text-slate-500 transition-colors"
                          >
                            -- Direct Pickup (No Specific Campus) --
                          </button>
                          {NIGERIAN_CAMPUSES.filter(camp => 
                            camp.toLowerCase().includes(campusSearchQuery.toLowerCase())
                          ).slice(0, 20).map((camp) => (
                            <button
                              key={camp}
                              type="button"
                              onMouseDown={() => {
                                setAddrSchool(camp);
                                setCampusSearchQuery(camp);
                                setShowCampusDropdown(false);
                              }}
                              className={`w-full text-left px-4 py-3 text-xs font-semibold transition-colors flex items-center justify-between border-none outline-none cursor-pointer ${
                                addrSchool === camp 
                                  ? "bg-orange-50 text-[#ff6b00] dark:bg-orange-950/20" 
                                  : "hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-slate-300"
                              }`}
                            >
                              <span className="truncate pr-4">🏫 {camp}</span>
                              {addrSchool === camp && <Check className="w-4 h-4 text-[#ff6b00] flex-shrink-0" />}
                            </button>
                          ))}
                          {NIGERIAN_CAMPUSES.filter(camp => 
                            camp.toLowerCase().includes(campusSearchQuery.toLowerCase())
                          ).length === 0 && (
                            <div className="px-4 py-3 text-xs text-slate-400 font-bold text-center">
                              No matching campuses found. You can type custom school above!
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Street & Estate Options */}
                  <div className="space-y-1.5 relative">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">Street / House Address or Estate Name</label>
                    <div className="relative">
                      <input 
                        type="text"
                        required={false}
                        value={addrStreet}
                        onChange={(e) => setAddrStreet(e.target.value)}
                        className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-[#ff6b00] outline-none transition-all text-xs text-slate-900 dark:text-white placeholder:text-slate-400"
                        placeholder="e.g. 15 Herbert Macaulay Way, Yaba, or Unilag Staff Estate"
                      />
                      {isSearchingSuggestions && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader2 className="w-4 h-4 text-[#ff6b00] animate-spin" />
                        </div>
                      )}
                    </div>

                    {/* Autocomplete Suggestions Menu Dropdown */}
                    {addrSuggestions.length > 0 && (
                      <div className="absolute z-50 left-0 right-0 top-full mt-1.5 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xl max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-800">
                        {addrSuggestions.map((item, index) => (
                          <button
                            key={`addr-suggest-${item.place_id || index}-${index}`}
                            type="button"
                            onClick={() => handleSelectSuggestion(item)}
                            className="w-full text-left px-4 py-3 text-xs font-semibold hover:bg-orange-50/50 dark:hover:bg-orange-950/20 text-slate-700 dark:text-slate-300 transition-colors flex items-start gap-2 border-none outline-none cursor-pointer"
                          >
                            <span className="text-orange-500 text-sm leading-none shrink-0 mt-0.5">📍</span>
                            <span className="line-clamp-2 leading-relaxed">{item.display_name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Manual Business Address Input */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-zinc-800/65">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">Seller's Business Address (Manual Input)</label>
                    <input 
                      type="text"
                      className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-[#ff6b00] outline-none transition-all text-xs text-slate-900 dark:text-white placeholder:text-slate-400"
                      placeholder="e.g. Block C, Shop 4, Campus Shopping Complex, Lagos"
                      value={manualBusinessAddress}
                      onChange={(e) => setManualBusinessAddress(e.target.value)}
                    />
                  </div>

                  {/* Address Summary Preview */}
                  {location && (
                    <div className="p-3 bg-slate-100 dark:bg-slate-800/40 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 border border-dotted border-slate-200 dark:border-slate-700 flex items-start gap-2">
                      <span className="text-[#ff6b00] text-lg leading-none mt-0.5">📍</span>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Full Compiled Address</span>
                        <p className="font-semibold text-slate-850 dark:text-slate-200 mt-0.5">{location}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block ml-1">
                    {type === "service" ? "Requested Service Location for Google Map Pinpoint" : "Requested Pickup / Delivery Location for Google Map Pinpoint"}
                  </span>
                  
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      required={false}
                      className="flex-1 h-12 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-[#ff6b00] outline-none transition-all text-xs text-slate-900 dark:text-white"
                      placeholder={type === "service" ? "e.g. Hostels Block A Room 204 or Campus Salon" : "e.g. Block C Shop 4, Campus Shopping Complex, Unilag Gate"}
                    />
                    <button 
                      type="button"
                      onClick={() => {
                        const pinpointParts = [];
                        if (manualBusinessAddress) pinpointParts.push(manualBusinessAddress);
                        if (location && location !== manualBusinessAddress) pinpointParts.push(location);
                        if (addrSchool) pinpointParts.push(addrSchool);
                        if (addrCity) pinpointParts.push(addrCity);
                        if (addrLga) pinpointParts.push(addrLga.endsWith("LGA") ? addrLga : `${addrLga} LGA`);
                        if (addrState) pinpointParts.push(addrState.endsWith("State") ? addrState : `${addrState} State`);
                        if (addrCountry) pinpointParts.push(addrCountry);
                        const pinpointCompiled = pinpointParts.join(", ");
                        verifyLocationAddress(pinpointCompiled || location);
                      }}
                      className="px-4 h-12 bg-[#ff6b00] hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shrink-0 flex items-center gap-1.5 border-none cursor-pointer outline-none"
                      disabled={isVerifyingAddress}
                    >
                      {isVerifyingAddress ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5" />}
                      Verify
                    </button>
                  </div>

                  {geocodingError && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-xl text-[11px] font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                      <span>{geocodingError}</span>
                    </div>
                  )}
                  
                  {GOOGLE_MAPS_API_KEY ? (
                    <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 h-64 relative mt-2">
                       <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
                        <GoogleMap
                          zoom={15}
                          center={mapCenter}
                          onClick={(e) => {
                            if (e.detail?.latLng) {
                              const latLng = e.detail.latLng;
                              const lat = typeof latLng.lat === 'function' ? latLng.lat() : (latLng as any).lat;
                              const lng = typeof latLng.lng === 'function' ? latLng.lng() : (latLng as any).lng;
                              const coords = { lat, lng };
                              setPickupCoordinates(coords);
                              setMapCenter(coords);
                            }
                          }}
                          mapId="DEMO_MAP_ID"
                          gestureHandling="cooperative"
                          style={{ width: '100%', height: '100%' }}
                          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                        >
                          {pickupCoordinates && (
                            <AdvancedMarker position={pickupCoordinates}>
                              <Pin background={'#4f46e5'} borderColor={'#3730a3'} glyphColor={'#ffffff'} />
                            </AdvancedMarker>
                          )}
                        </GoogleMap>
                      </APIProvider>
                      {pickupCoordinates ? (
                        <div className="absolute bottom-3 left-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-[10px] font-bold text-emerald-600 flex items-center gap-1.5 shadow-sm">
                          <Check className="w-3.5 h-3.5" />
                          Pin set: {pickupCoordinates.lat.toFixed(4)}, {pickupCoordinates.lng.toFixed(4)}
                          <button 
                            type="button" 
                            onClick={(ev) => { ev.stopPropagation(); setPickupCoordinates(null); }}
                            className="ml-2 text-red-500 hover:text-red-600 font-bold"
                          >
                            Clear
                          </button>
                        </div>
                      ) : (
                        <div className="absolute bottom-3 left-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-[10px] font-bold text-indigo-600 shadow-sm animate-pulse">
                          💡 Click on map to place your business / pickup pin!
                        </div>
                      )}
                    </div>
                  ) : (pickupCoordinates || (location && location.trim() !== "")) ? (
                    <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 h-64 relative mt-2 bg-slate-100 dark:bg-slate-900 shadow-inner">
                      <iframe
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        loading="lazy"
                        allowFullScreen
                        referrerPolicy="no-referrer-when-downgrade"
                        src={
                          pickupCoordinates 
                            ? `https://maps.google.com/maps?q=${pickupCoordinates.lat},${pickupCoordinates.lng}&z=15&output=embed`
                            : `https://maps.google.com/maps?q=${encodeURIComponent(location.trim())}&z=15&output=embed`
                        }
                      />
                      {pickupCoordinates ? (
                        <div className="absolute bottom-3 left-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-[10px] font-bold text-emerald-600 flex items-center gap-1.5 shadow-md">
                          <Check className="w-3.5 h-3.5" />
                          Live Pin: {pickupCoordinates.lat.toFixed(4)}, {pickupCoordinates.lng.toFixed(4)}
                          <button 
                            type="button" 
                            onClick={(ev) => { ev.stopPropagation(); setPickupCoordinates(null); }}
                            className="ml-2 text-red-500 hover:text-red-600 font-bold"
                          >
                            Reset
                          </button>
                        </div>
                      ) : (
                        <div className="absolute bottom-3 left-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-[10px] font-bold text-indigo-600 shadow-md">
                          📍 Showing Location Live on Map
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 h-44 relative mt-2 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col items-center justify-center p-6 text-center">
                      <MapPin className="w-8 h-8 text-slate-400 dark:text-slate-500 mb-2" />
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200">No Pickup / Delivery Address Set</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                        Enter a location address above or click "Pin Location on Map" to display a pin on Google Maps.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        </div>

        <div className={formStep === "images" ? "space-y-6" : "hidden"}>
        {category !== "Food & Drinks" && !isFoodAndDrinks && (
          <div className="space-y-4">
            <div className="flex items-center justify-between ml-1">
              <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{type === "service" ? "Service Showcase Images" : "Product Images"}</label>
              <div className="flex gap-3 items-center">
                <span className="text-[10px] font-bold text-slate-400">Max 5 images</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {images.map((img, index) => (
                <div key={`${img.substring(0, 50)}-${index}`} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm group">
                  <img src={img} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                  
                  {/* Action Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                    <label className="p-2 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white rounded-xl cursor-pointer transition-all active:scale-95">
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setLoading(true);
                            try {
                              const base64 = await compressImage(file);
                              const updated = [...images];
                              updated[index] = base64;
                              setImages(updated);
                            } finally {
                              setLoading(false);
                            }
                          }
                        }}
                      />
                      <RefreshCw className="w-4 h-4" />
                    </label>
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="p-2 bg-red-600/80 hover:bg-red-600 text-white rounded-xl transition-all active:scale-95 shadow-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {index === 0 && (
                    <div className="absolute bottom-0 left-0 right-0 py-1 bg-black/60 text-white text-[8px] font-black text-center uppercase tracking-widest backdrop-blur-sm">
                      Main Profile/Thumbnail
                    </div>
                  )}
                </div>
              ))}
              
              {images.length < 5 && (
                <label className="aspect-square border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer group">
                  <input 
                    type="file" 
                    accept="image/*" 
                    multiple
                    onChange={handleImageChange} 
                    className="hidden" 
                  />
                  <Upload className="w-6 h-6 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 transition-colors mb-1" />
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Add Image</span>
                </label>
              )}
            </div>
          </div>
        )}

        {isFoodAndDrinks && (
          <div className="space-y-6 p-6 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-[2rem]">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Menu Items</h4>
                <p className="text-[10px] text-slate-500 font-medium tracking-tight">Add individual food items with their own prices and photos</p>
              </div>
              <button 
                type="button"
                onClick={() => setMenuItems([...menuItems, { id: Math.random().toString(36).substr(2, 9), name: "", price: 0, measureType: "piece", measureAmount: 1, imageUrl: "" }])}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-800 text-white dark:text-indigo-500 rounded-xl text-[10px] font-bold hover:bg-slate-800 transition-all shadow-sm"
              >
                <Plus className="w-3 h-3" />
                Add Menu Item
              </button>
            </div>

            <div className="space-y-4">
              {menuItems.map((item, index) => (
                <div key={`edit-menu-${item.id || ""}-${index}`} className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col gap-4 shadow-sm relative group">
                  <button 
                    type="button"
                    onClick={() => setMenuItems(menuItems.filter((_, i) => i !== index))}
                    className="absolute -top-2 -right-2 p-1.5 bg-red-100 dark:bg-red-900/20 text-red-600 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-200"
                  >
                    <X className="w-3 h-3" />
                  </button>

                  <div className="flex gap-4">
                    <label className="w-20 h-20 rounded-xl bg-slate-50 dark:bg-slate-800 border border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center cursor-pointer overflow-hidden shrink-0 group/img">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <ImageIcon className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover/img:text-indigo-500 mb-1" />
                          <span className="text-[8px] font-bold text-slate-400">Photo</span>
                        </>
                      )}
                      <input 
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const base64 = await compressImage(file);
                            const updated = [...menuItems];
                            updated[index].imageUrl = base64;
                            setMenuItems(updated);
                          }
                        }}
                      />
                    </label>

                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input 
                        placeholder="Item Name (e.g. Egusi Soup)"
                        value={item.name}
                        onChange={(e) => {
                          const updated = [...menuItems];
                          updated[index].name = e.target.value;
                          setMenuItems(updated);
                        }}
                        className="w-full h-10 px-4 bg-slate-50 dark:bg-slate-850 border border-slate-250 dark:border-zinc-700 rounded-xl text-xs font-bold text-slate-905 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">₦</span>
                        <input 
                          type="number"
                          placeholder="Price"
                          value={item.price || ""}
                          onChange={(e) => {
                            const updated = [...menuItems];
                            updated[index].price = parseFloat(e.target.value) || 0;
                            setMenuItems(updated);
                          }}
                          className="w-full h-10 pl-8 pr-4 bg-slate-50 dark:bg-slate-850 border border-slate-250 dark:border-zinc-700 rounded-xl text-xs font-bold text-slate-905 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <select
                        value={item.measureType || "piece"}
                        onChange={(e) => {
                          const updated = [...menuItems];
                          updated[index].measureType = e.target.value;
                          setMenuItems(updated);
                        }}
                        className="w-full h-10 px-4 bg-slate-50 dark:bg-slate-850 border border-slate-250 dark:border-zinc-700 rounded-xl text-xs font-bold text-slate-905 dark:text-white outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
                      >
                        <option value="piece">Per Piece</option>
                        <option value="spoon">Per Spoon</option>
                        <option value="plate">Per Plate</option>
                        <option value="cup">Per Cup</option>
                        <option value="kg">Per KG</option>
                        <option value="wrap">Per Wrap</option>
                        <option value="bottle">Per Bottle</option>
                        <option value="pack">Per Pack</option>
                      </select>
                      <input 
                        type="number"
                        placeholder="Amount (e.g. 1)"
                        value={item.measureAmount || 1}
                        onChange={(e) => {
                          const updated = [...menuItems];
                          updated[index].measureAmount = parseFloat(e.target.value) || 1;
                          setMenuItems(updated);
                        }}
                        className="w-full h-10 px-4 bg-slate-50 dark:bg-slate-850 border border-slate-250 dark:border-zinc-700 rounded-xl text-xs font-bold text-slate-905 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              {menuItems.length === 0 && (
                <div className="py-6 text-center bg-white/50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                  <p className="text-[10px] font-bold text-slate-400">No menu items added. Your main product price will apply.</p>
                </div>
              )}
            </div>
          </div>
        )}
        </div>

        <div className={formStep === "pricing" ? "space-y-6" : "hidden"}>
        {category === "Data Subscriptions" && (
          <div className="space-y-6 p-6 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-[2rem]">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Subscription Packages / Plans</h4>
                <p className="text-[10px] text-slate-500 font-medium tracking-tight">Add individual packages, data sizes or subscription options</p>
              </div>
              <button 
                type="button"
                onClick={() => setMenuItems([...menuItems, { id: Math.random().toString(36).substr(2, 9), name: "", price: 0, measureType: "30 Days", measureAmount: 1, imageUrl: "" }])}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-800 text-white dark:text-indigo-500 rounded-xl text-[10px] font-bold hover:bg-slate-800 transition-all shadow-sm"
              >
                <Plus className="w-3 h-3" />
                Add Package / Option
              </button>
            </div>

            <div className="space-y-4">
              {menuItems.map((item, index) => (
                <div key={`edit-subs-${item.id || ""}-${index}`} className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col gap-4 shadow-sm relative group">
                  <button 
                    type="button"
                    onClick={() => setMenuItems(menuItems.filter((_, i) => i !== index))}
                    className="absolute -top-2 -right-2 p-1.5 bg-red-100 dark:bg-red-900/20 text-red-600 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-200"
                  >
                    <X className="w-3 h-3" />
                  </button>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Plan Name</label>
                      <input 
                        placeholder="e.g. MTN 10GB Data, Netflix Premium"
                        value={item.name}
                        onChange={(e) => {
                          const updated = [...menuItems];
                          updated[index].name = e.target.value;
                          setMenuItems(updated);
                        }}
                        className="w-full h-10 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-950 dark:text-white placeholder:text-slate-500 outline-none focus:border-indigo-500"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Price (₦)</label>
                      <input 
                        type="number"
                        placeholder="Price"
                        value={item.price || ""}
                        onChange={(e) => {
                          const updated = [...menuItems];
                          updated[index].price = parseFloat(e.target.value) || 0;
                          setMenuItems(updated);
                        }}
                        className="w-full h-10 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-950 dark:text-white placeholder:text-slate-500 outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Validity (e.g. 30 Days)</label>
                      <input 
                        placeholder="e.g. 30 Days, 7 Days, 1 Month"
                        value={item.measureType || ""}
                        onChange={(e) => {
                          const updated = [...menuItems];
                          updated[index].measureType = e.target.value;
                          setMenuItems(updated);
                        }}
                        className="w-full h-10 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-950 dark:text-white placeholder:text-slate-500 outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Data Amount / Access Details</label>
                      <input 
                        placeholder="e.g. 10GB Data, Unlimited access"
                        value={item.measureAmountDetail || ""}
                        onChange={(e) => {
                          const updated = [...menuItems];
                          updated[index].measureAmountDetail = e.target.value;
                          setMenuItems(updated);
                        }}
                        className="w-full h-10 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-950 dark:text-white placeholder:text-slate-500 outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="sm:col-span-2 border-t border-slate-100 dark:border-slate-800 pt-3 mt-1">
                      <p className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                        ⚡ CheapDataHub Automation Binding (Optional)
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1">CheapDataHub Plan ID (e.g. 120)</label>
                          <input 
                            placeholder="e.g. 120"
                            value={item.cheapDataHubPlanId || ""}
                            onChange={(e) => {
                              const updated = [...menuItems];
                              updated[index].cheapDataHubPlanId = e.target.value;
                              setMenuItems(updated);
                            }}
                            className="w-full h-10 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-950 dark:text-white placeholder:text-slate-400 outline-none focus:border-indigo-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1">Data Network Code</label>
                          <select 
                            value={item.cheapDataHubNetworkCode || ""}
                            onChange={(e) => {
                              const updated = [...menuItems];
                              updated[index].cheapDataHubNetworkCode = e.target.value;
                              setMenuItems(updated);
                            }}
                            className="w-full h-10 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-950 dark:text-white outline-none focus:border-indigo-500"
                          >
                            <option value="">-- No Auto-Topup / Select Network --</option>
                            <option value="1">1 - MTN</option>
                            <option value="2">2 - GLO</option>
                            <option value="3">3 - 9mobile</option>
                            <option value="4">4 - Airtel</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {menuItems.length === 0 && (
                <div className="py-6 text-center bg-white/50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                  <p className="text-[10px] font-bold text-slate-400">No packages added yet. Click 'Add Package / Option' above.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {type === "service" && (
          <div className="space-y-6 p-6 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-[2rem]">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Service Options & Styling Menu</h4>
                <p className="text-[10px] text-slate-500 font-medium tracking-tight">Add individual style variations, sub-services, or package options with their own images and pricing</p>
              </div>
              <button 
                type="button"
                onClick={() => setMenuItems([...menuItems, { id: Math.random().toString(36).substr(2, 9), name: "", price: 0, measureType: "style", measureAmount: 1, imageUrl: "" }])}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-800 text-white dark:text-indigo-500 rounded-xl text-[10px] font-bold hover:bg-slate-800 transition-all shadow-sm"
              >
                <Plus className="w-3 h-3" />
                Add Service Option
              </button>
            </div>

            <div className="space-y-4">
              {menuItems.map((item, index) => (
                <div key={`edit-service-menu-${item.id || ""}-${index}`} className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col gap-4 shadow-sm relative group">
                  <button 
                    type="button"
                    onClick={() => setMenuItems(menuItems.filter((_, i) => i !== index))}
                    className="absolute -top-2 -right-2 p-1.5 bg-red-100 dark:bg-red-900/20 text-red-600 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-200"
                  >
                    <X className="w-3 h-3" />
                  </button>

                  <div className="flex gap-4">
                    <label className="w-20 h-20 rounded-xl bg-slate-50 dark:bg-slate-800 border border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center cursor-pointer overflow-hidden shrink-0 group/img">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <ImageIcon className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover/img:text-indigo-500 mb-1" />
                          <span className="text-[8px] font-bold text-slate-400">Photo</span>
                        </>
                      )}
                      <input 
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const base64 = await compressImage(file);
                            const updated = [...menuItems];
                            updated[index].imageUrl = base64;
                            setMenuItems(updated);
                          }
                        }}
                      />
                    </label>

                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input 
                        placeholder="Option Name (e.g. Knotless Braids)"
                        value={item.name}
                        onChange={(e) => {
                          const updated = [...menuItems];
                          updated[index].name = e.target.value;
                          setMenuItems(updated);
                        }}
                        className="w-full h-10 px-4 bg-slate-50 dark:bg-slate-855 border border-slate-250 dark:border-zinc-700 rounded-xl text-xs font-bold text-slate-905 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">₦</span>
                        <input 
                          type="number"
                          placeholder="Price"
                          value={item.price || ""}
                          onChange={(e) => {
                            const updated = [...menuItems];
                            updated[index].price = parseFloat(e.target.value) || 0;
                            setMenuItems(updated);
                          }}
                          className="w-full h-10 pl-8 pr-4 bg-slate-50 dark:bg-slate-855 border border-slate-250 dark:border-zinc-700 rounded-xl text-xs font-bold text-slate-905 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <select
                        value={item.measureType || "style"}
                        onChange={(e) => {
                          const updated = [...menuItems];
                          updated[index].measureType = e.target.value;
                          setMenuItems(updated);
                        }}
                        className="w-full h-10 px-4 bg-slate-50 dark:bg-slate-855 border border-slate-250 dark:border-zinc-700 rounded-xl text-xs font-bold text-slate-950 dark:text-white outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
                      >
                        <option value="style">Per Style</option>
                        <option value="session">Per Session</option>
                        <option value="hour">Per Hour</option>
                        <option value="person">Per Person</option>
                        <option value="service">Per Service</option>
                        <option value="package">Per Package</option>
                      </select>
                      <input 
                        type="number"
                        placeholder="Multiplier (e.g. 1)"
                        value={item.measureAmount || 1}
                        onChange={(e) => {
                          const updated = [...menuItems];
                          updated[index].measureAmount = parseFloat(e.target.value) || 1;
                          setMenuItems(updated);
                        }}
                        className="w-full h-10 px-4 bg-slate-50 dark:bg-slate-855 border border-slate-250 dark:border-zinc-700 rounded-xl text-xs font-bold text-slate-905 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <input 
                        type="text"
                        placeholder="Package Details / Inclusions (e.g. Attachment included, takes 3 hours)"
                        value={item.measureAmountDetail || ""}
                        onChange={(e) => {
                          const updated = [...menuItems];
                          updated[index].measureAmountDetail = e.target.value;
                          setMenuItems(updated);
                        }}
                        className="w-full h-10 px-4 bg-slate-50 dark:bg-slate-855 border border-slate-250 dark:border-zinc-700 rounded-xl text-xs font-bold text-slate-905 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-purple-500 sm:col-span-2"
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              {menuItems.length === 0 && (
                <div className="py-6 text-center bg-white/50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                  <p className="text-[10px] font-bold text-slate-400 font-sans">No options added yet. Your main catalog item price will apply.</p>
                </div>
              )}
            </div>
          </div>
        )}
        </div>

        {/* Foot Navigation / Submit Button */}
        <div className="flex gap-4 pt-4 border-t border-slate-100 dark:border-zinc-800">
          {formStep !== "details" && (
            <button 
              type="button"
              onClick={() => {
                const steps: ("details" | "pricing" | "logistics" | "images")[] = ["details", "pricing", "logistics", "images"];
                const currentIdx = steps.indexOf(formStep);
                if (currentIdx > 0) setFormStep(steps[currentIdx - 1]);
              }}
              className="flex-1 h-14 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border-none outline-none cursor-pointer"
            >
              Back
            </button>
          )}

          {formStep !== "images" ? (
            <button 
              type="button"
              onClick={() => {
                const steps: ("details" | "pricing" | "logistics" | "images")[] = ["details", "pricing", "logistics", "images"];
                const currentIdx = steps.indexOf(formStep);
                if (currentIdx < steps.length - 1) setFormStep(steps[currentIdx + 1]);
              }}
              className="flex-1 h-14 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all border-none outline-none cursor-pointer shadow-md"
            >
              Continue
            </button>
          ) : (
            <motion.button 
              whileHover={{ scale: 1.02, boxShadow: "0px 10px 30px rgba(249, 115, 22, 0.35)" }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="flex-1 h-14 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-2xl font-black text-xs sm:text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 cursor-pointer border-none outline-none"
            >
              {loading ? (
                <div className="flex items-center gap-2 text-white">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-[10px] sm:text-[11px] font-bold tracking-tight">
                    {loadingMessage || "Publishing..."}
                  </span>
                </div>
              ) : (
                editingProduct ? "Update Listing" : (type === "service" ? "Publish Service" : "Publish Product")
              )}
            </motion.button>
          )}
        </div>
      </form>
    </div>
  );
}
