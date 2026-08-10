import React from "react";
import { Product, Review, UserProfile } from "../types";
import { X, ArrowLeft, Star, ShoppingCart, Truck, MapPin, Send, MessageSquare, Clock, User as UserIcon, ShieldCheck, ShieldAlert, Shield, CheckCircle, ShoppingBag, Sparkles, Layout, Minus, Plus, Hash, Trash2, RotateCcw, CalendarCheck, Store, ExternalLink, Loader2, Edit2, Tag, ChevronLeft, ChevronRight, Maximize2, Share2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { auth, db } from "../firebase";
import { collection, query, where, orderBy, onSnapshot, addDoc, doc, getDoc, setDoc, getDocs, updateDoc, deleteDoc } from "firebase/firestore";
import { usePaystackPayment } from "../hooks/usePaystackPayment";
import { APIProvider, Map as GoogleMap, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';

const GOOGLE_MAPS_API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  "";

import { cn } from "../lib/utils";
import ReportModal from "./ReportModal";
import { AlertTriangle } from "lucide-react";
import { handleFirestoreError, OperationType } from "../lib/firebase-errors";

interface ProductDetailProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, menuItem?: any, ticketTier?: any, formResponses?: Record<string, string>) => void;
  currentUser: UserProfile | null;
  isPageMode?: boolean;
}

// Helper Component for Menu Item interaction with quantities
interface MenuItemInteractionProps {
  key?: string;
  item: any;
  product: Product;
  quantity: number;
  onQuantityChange: (id: string, qty: number) => void;
  isOwner: boolean;
}

function MenuItemInteraction({ item, product, quantity, onQuantityChange, isOwner }: MenuItemInteractionProps) {
  const isSelected = quantity > 0;
  
  return (
    <div 
      onClick={() => !isOwner && onQuantityChange(item.id || item.name, isSelected ? 0 : 1)}
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer group",
        isSelected 
          ? "bg-indigo-50 dark:bg-indigo-900/10 border-indigo-500 shadow-sm" 
          : "bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
      )}
    >
      <div className="flex items-center gap-4 mb-4 sm:mb-0">
        <div className={cn(
          "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
          isSelected ? "bg-indigo-600 border-indigo-600" : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
        )}>
          {isSelected && <CheckCircle className="w-3.5 h-3.5 text-white" />}
        </div>
        
        {item.imageUrl && (
          <img 
            src={item.imageUrl} 
            alt={item.name} 
            className="w-14 h-14 rounded-xl object-cover shadow-sm" 
            referrerPolicy="no-referrer"
          />
        )}
        <div className="space-y-0.5">
          <p className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">{item.name}</p>
          <div className="flex items-center gap-2">
            <p className="text-sm font-black text-indigo-600">₦{item.price.toLocaleString()}</p>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded uppercase">
              {item.measureAmount || 1} {item.measureType || 'piece'}
            </span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
        {!isOwner && (
          <div className="flex items-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-1 shadow-sm">
            <button 
              onClick={() => onQuantityChange(item.id || item.name, Math.max(0, quantity - 1))}
              className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-indigo-500 transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center text-xs font-black text-slate-900 dark:text-white">{quantity}</span>
            <button 
              onClick={() => onQuantityChange(item.id || item.name, quantity + 1)}
              className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-indigo-500 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProductDetail({ product, isOpen, onClose, onAddToCart, currentUser, isPageMode = false }: ProductDetailProps) {
  const [reviews, setReviews] = React.useState<Review[]>([]);
  const [newReview, setNewReview] = React.useState("");
  const [rating, setRating] = React.useState(5);
  const [submitting, setSubmitting] = React.useState(false);
  const [hasPurchased, setHasPurchased] = React.useState(false);
  const [isDelivered, setIsDelivered] = React.useState(false);
  const [sellerProfile, setSellerProfile] = React.useState<UserProfile | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = React.useState(false);
  const [activeImageIndex, setActiveImageIndex] = React.useState(0);
  const [selectedTier, setSelectedTier] = React.useState<any>(null);
  const [formResponses, setFormResponses] = React.useState<Record<string, string>>({});
  const [isRegistering, setIsRegistering] = React.useState(false);

  // Lightbox picture-viewer gallery states
  const [isLightboxOpen, setIsLightboxOpen] = React.useState(false);
  const [lightboxImageIndex, setLightboxImageIndex] = React.useState(0);

  const [isBookingService, setIsBookingService] = React.useState(false);
  const [selectedServicePackage, setSelectedServicePackage] = React.useState<any | null>(null);
  const [serviceDoneInputs, setServiceDoneInputs] = React.useState<Record<string, string>>({});
  const [isSubmittingServiceOrder, setIsSubmittingServiceOrder] = React.useState(false);

  // Web Share API implementation and clipboard fallback
  const [shareFeedback, setShareFeedback] = React.useState<string | null>(null);

  const fallbackCopyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url)
      .then(() => {
        setShareFeedback("Copied to clipboard!");
        setTimeout(() => setShareFeedback(null), 3000);
      })
      .catch((err) => {
        console.error("Clipboard copy failed:", err);
        setShareFeedback("Could not copy link");
        setTimeout(() => setShareFeedback(null), 3000);
      });
  };

  const handleShare = async () => {
    let shareUrl = `${window.location.origin}/?product=${product.id}`;
    if (currentUser?.referralCode) {
      shareUrl += `&ref=${currentUser.referralCode}`;
    }

    const shareData = {
      title: product.name,
      text: `Check out "${product.name}" on Shopiversity: ${product.description ? product.description.substring(0, 100) : "Campus Marketplace"}`,
      url: shareUrl,
    };

    // Safely check for Web Share API availability in current context (e.g., iframe permissions)
    if (navigator.share && typeof navigator.canShare === "function" && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        setShareFeedback("Shared successfully!");
        setTimeout(() => setShareFeedback(null), 3000);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.warn("Web Share failed, using copy fallback:", err);
          fallbackCopyToClipboard(shareUrl);
        }
      }
    } else {
      fallbackCopyToClipboard(shareUrl);
    }
  };

  const renderSellerControls = () => (
    <div className="space-y-4 p-6 bg-amber-500/5 dark:bg-zinc-800/50 rounded-[2rem] border border-amber-500/20 dark:border-zinc-700 text-left mb-10 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center gap-2 mb-2 text-amber-600 dark:text-amber-405">
        <Store className="w-5 h-5" />
        <h4 className="text-xs font-bold uppercase tracking-widest leading-none">Your Listing Controls</h4>
      </div>
      <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium leading-relaxed">
        You listed this on campus. You can refine its description, pricing, photos, or delete/withdraw it.
      </p>
      
      <div className="grid grid-cols-2 gap-3 pt-2">
        <button
          type="button"
          onClick={() => {
            onClose();
            const editEvent = new CustomEvent('edit-seller-product', { detail: product });
            window.dispatchEvent(editEvent);
            
            const switchTabEvent = new CustomEvent('switch-seller-tab', { detail: 'add-product' });
            window.dispatchEvent(switchTabEvent);
            
            window.dispatchEvent(new CustomEvent('switch-active-role', { detail: 'seller' }));
          }}
          className="flex items-center justify-center gap-2 h-12 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer border-none shadow-sm"
        >
          <Edit2 className="w-4 h-4 text-white animate-pulse" />
          <span>Edit Product</span>
        </button>
        
        <button
          type="button"
          onClick={async () => {
            if (!confirm("Are you sure you want to move this listing to the Recycle/Trash bin? It will be hidden from the student market.")) return;
            try {
              await updateDoc(doc(db, "products", product.id), {
                isDeleted: true,
                deletedAt: new Date().toISOString()
              });
              alert("Product listing moved to trash successfully.");
              onClose();
            } catch (err) {
              console.error("Error moving product to trash:", err);
              alert("Failed to delete listing. Please try again.");
            }
          }}
          className="flex items-center justify-center gap-2 h-12 rounded-xl bg-red-50 dark:bg-red-950/20 hover:bg-red-100 hover:text-red-700 active:scale-95 text-red-600 dark:text-red-400 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer border-none"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete</span>
        </button>
      </div>
    </div>
  );

  const handleDirectServiceBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) {
      alert("Please sign in or register to book a service.");
      return;
    }
    setIsSubmittingServiceOrder(true);
    try {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let randOrd = "";
      let randPrd = "";
      for (let i = 0; i < 6; i++) {
        randOrd += chars.charAt(Math.floor(Math.random() * chars.length));
        randPrd += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const uniqueOrderId = `ORD-${randOrd}`;
      const uniqueProductId = `PRD-${randPrd}`;

      let dbSellerName = product.sellerName || "Merchant";
      try {
        const sellerSnap = await getDoc(doc(db, "users", product.sellerId));
        if (sellerSnap.exists()) {
          dbSellerName = sellerSnap.data().displayName || "Merchant";
        }
      } catch (err) {
        console.error("Error fetching seller profile name:", err);
      }

      const totalPayablePrice = selectedServicePackage ? (selectedServicePackage.price || product.price || 0) : (product.price || 0);
      const commissionAmount = totalPayablePrice * 0.045; // 4.5% commission
      const sellerEarnings = totalPayablePrice - commissionAmount;

      const orderData = {
        uniqueOrderId,
        uniqueProductId,
        buyerId: auth.currentUser.uid,
        buyerName: currentUser?.displayName || "Anonymous",
        buyerEmail: currentUser?.email || auth.currentUser?.email || "",
        buyerPhone: currentUser?.phoneNumber || "N/A",
        sellerId: product.sellerId,
        sellerName: dbSellerName,
        productId: product.id,
        productName: product.name,
        productImageUrl: product.imageUrl || "",
        quantity: 1,
        totalPrice: totalPayablePrice,
        commissionAmount,
        sellerEarnings,
        deliveryType: "pickup",
        paymentMethod: "pod", // pod means Deferred Pay-on-Complete via Paystack
        paymentStatus: "pending",
        status: "Pending Seller Acceptance",
        type: "service",
        createdAt: new Date().toISOString(),
        deliveryAddress: product.location || "",
        menuItemId: selectedServicePackage ? selectedServicePackage.id : null,
        menuItemName: selectedServicePackage ? selectedServicePackage.name : null,
        formResponses: serviceDoneInputs
      };

      await addDoc(collection(db, "orders"), orderData);

      await addDoc(collection(db, "analytics"), {
        productId: product.id,
        sellerId: product.sellerId,
        type: "purchase",
        timestamp: new Date().toISOString()
      });

      alert("Success! Your service request has been placed. Redirecting to your service tracking dashboard...");
      
      // Dispatch redirection custom event
      window.dispatchEvent(new CustomEvent('switch-to-service-tracking'));
      
      // Reset state and close modal
      setIsBookingService(false);
      setServiceDoneInputs({});
      onClose();
    } catch (err) {
      console.error("Failed to complete service booking:", err);
      alert("Error placing service request. Please try again.");
    } finally {
      setIsSubmittingServiceOrder(false);
    }
  };

  const ticketPrice = selectedTier ? Number(selectedTier.price) : 0;
  const paystackConfig = {
    reference: (new Date()).getTime().toString(),
    email: currentUser?.email || auth.currentUser?.email || "guest@campus.com",
    amount: Math.round(ticketPrice * 100),
    publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || "",
    metadata: {
      custom_fields: []
    }
  };

  const initializePaystackRegistration = usePaystackPayment(paystackConfig);

  const handleDirectRegistration = async (tier: any, responses: Record<string, string>) => {
    if (!auth.currentUser) {
      alert("Please sign in or register to join.");
      return;
    }
    setIsRegistering(true);
    try {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let randOrd = "";
      let randPrd = "";
      for (let i = 0; i < 6; i++) {
        randOrd += chars.charAt(Math.floor(Math.random() * chars.length));
        randPrd += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const uniqueOrderId = `ORD-${randOrd}`;
      const uniqueProductId = `PRD-${randPrd}`;

      let dbSellerName = product.sellerName || "Merchant";
      try {
        const sellerSnap = await getDoc(doc(db, "users", product.sellerId));
        if (sellerSnap.exists()) {
          dbSellerName = sellerSnap.data().displayName || "Merchant";
        }
      } catch (err) {
        console.error("Error fetching seller profile name:", err);
      }

      const totalPayablePrice = tier ? Number(tier.price) : 0;
      const commissionAmount = totalPayablePrice * 0.02; // 2% for events
      const sellerEarnings = totalPayablePrice - commissionAmount;

      const orderData = {
        uniqueOrderId,
        uniqueProductId,
        buyerId: auth.currentUser.uid,
        buyerName: currentUser?.displayName || "Anonymous",
        buyerEmail: currentUser?.email || auth.currentUser?.email || "",
        buyerPhone: currentUser?.phoneNumber || "N/A",
        sellerId: product.sellerId,
        sellerName: dbSellerName,
        productId: product.id,
        productName: product.name,
        productImageUrl: product.imageUrl || "",
        quantity: 1,
        totalPrice: totalPayablePrice,
        commissionAmount,
        sellerEarnings,
        deliveryType: "pickup",
        paymentMethod: "online",
        paymentStatus: "paid",
        status: "acquired",
        createdAt: new Date().toISOString(),
        deliveryAddress: "",
        ...(tier ? { ticketTierId: tier.id, ticketTierName: tier.name } : {}),
        formResponses: responses || {}
      };

      await addDoc(collection(db, "orders"), orderData);

      const productRef = doc(db, "products", product.id);
      const productSnap = await getDoc(productRef);
      if (productSnap.exists()) {
        const prodData = productSnap.data();
        if (prodData.stock !== undefined && prodData.stock !== null) {
          const currentStock = Number(prodData.stock);
          const newStock = Math.max(0, currentStock - 1);
          await updateDoc(productRef, { stock: newStock });
        }
      }

      await addDoc(collection(db, "analytics"), {
        productId: product.id,
        sellerId: product.sellerId,
        type: "purchase",
        timestamp: new Date().toISOString()
      });

      alert("Registration Successful! You have successfully booked your ticket. Check your profile or tickets to view.");
      onClose();
    } catch (error) {
      console.error("Error in registration:", error);
      alert("Registration failed. Please try again.");
    } finally {
      setIsRegistering(false);
    }
  };

  const handleRegistrationClick = () => {
    if (product.eventDetails?.isPaid && !selectedTier) {
      alert("Please select a ticket tier.");
      return;
    }
    const missingRequired = !product.eventDetails?.googleFormUrl && product.eventDetails?.formFields?.find(f => f.required && !formResponses[f.id]);
    if (missingRequired) {
      alert(`Please fill in the required field: ${missingRequired.label}`);
      return;
    }

    if (!auth.currentUser) {
      alert("Please sign in or register to book tickets.");
      return;
    }

    if (auth.currentUser && !auth.currentUser.emailVerified) {
      alert("Email Verification Required: Please verify your email address before booking tickets or placing orders. Check your inbox or click 'Resend Verification Email' in the top banner.");
      return;
    }

    const finalResponses = product.eventDetails?.googleFormUrl 
      ? { ...formResponses, googleFormRegistration: "Registered via Google Forms Link" }
      : formResponses;

    if (product.eventDetails?.isPaid) {
      // Direct payment checkout before registering
      initializePaystackRegistration({
        onSuccess: (reference: any) => {
          handleDirectRegistration(selectedTier, finalResponses);
        },
        onClose: () => {
          alert("Payment cancelled.");
        }
      });
    } else {
      // Direct registration as requested since it is free:
      // "but if it's fully free registration then it just to register and for payment it's just direct pay no pick up"
      handleDirectRegistration(null, finalResponses);
    }
  };

  const [menuQuantities, setMenuQuantities] = React.useState<Record<string, number>>({});
  const [selectedSubPlan, setSelectedSubPlan] = React.useState<any>(null);
  const [subscriberTarget, setSubscriberTarget] = React.useState<string>("");

  const isFoodAndDrinks = product.category === "Food & Drinks";

  React.useEffect(() => {
    setSelectedSubPlan(null);
    setSubscriberTarget("");
    // Reset menu quantities when product changes
    setMenuQuantities({});
  }, [product]);

  const handleMenuQuantityChange = (id: string, qty: number) => {
    setMenuQuantities(prev => ({ ...prev, [id]: qty }));
  };

  const getSelectedMenuTotal = () => {
    if (!product.menuItems) return 0;
    return product.menuItems.reduce((acc, item) => {
      const q = menuQuantities[item.id || item.name] || 0;
      return acc + (item.price * q);
    }, 0);
  };

  const getSelectedMenuCount = () => {
    return Object.values(menuQuantities).filter((q: number) => q > 0).length;
  };

  const images = product.imageUrls && product.imageUrls.length > 0 
    ? product.imageUrls 
    : [product.imageUrl || "https://placehold.co/800x800/f8fafc/64748b?text=Product"].filter(Boolean) as string[];

  // Keyboard navigation for image lightbox
  React.useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsLightboxOpen(false);
      } else if (e.key === "ArrowRight") {
        setLightboxImageIndex((prev) => (prev + 1) % images.length);
      } else if (e.key === "ArrowLeft") {
        setLightboxImageIndex((prev) => (prev - 1 + images.length) % images.length);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen, images]);

  React.useEffect(() => {
    if (!isOpen || !product.sellerId) return;

    const fetchSeller = async () => {
      try {
        const sellerDoc = await getDoc(doc(db, "users", product.sellerId));
        if (sellerDoc.exists()) {
          setSellerProfile(sellerDoc.data() as UserProfile);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `users/${product.sellerId}`);
      }
    };

    const addToHistory = async () => {
      if (!auth.currentUser || auth.currentUser.uid === product.sellerId) return;
      try {
        const historyId = `${auth.currentUser.uid}_${product.id}`;
        await setDoc(doc(db, "product_history", historyId), {
          id: historyId,
          userId: auth.currentUser.uid,
          productId: product.id,
          productName: product.name,
          productPrice: typeof product.price === 'string' ? parseFloat(product.price) : Number(product.price),
          productImageUrl: product.imageUrl || null,
          viewedAt: new Date().toISOString()
        });

        // Add to analytics if it's an event
        if (product.category === "Events & Lifestyle") {
          await addDoc(collection(db, "analytics"), {
            productId: product.id,
            sellerId: product.sellerId,
            type: "view",
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, "product_history");
      }
    };

    const checkPurchaseStatus = async () => {
      if (!auth.currentUser) return;
      try {
        const q = query(
          collection(db, "orders"),
          where("buyerId", "==", auth.currentUser.uid),
          where("productId", "==", product.id)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          setHasPurchased(true);
          const deliveredOrder = snapshot.docs.find(doc => doc.data().status === "completed");
          if (deliveredOrder) {
            setIsDelivered(true);
          }
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, "orders");
      }
    };

    fetchSeller();
    addToHistory();
    checkPurchaseStatus();
  }, [isOpen, product.id, product.sellerId]);

  React.useEffect(() => {
    if (!isOpen) return;

    const q = query(
      collection(db, "reviews"),
      where("productId", "==", product.id),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reviewsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Review[];
      setReviews(reviewsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "reviews");
    });

    return () => unsubscribe();
  }, [isOpen, product.id]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !newReview.trim()) return;

    if (!hasPurchased) {
      alert("You can only review products you have purchased.");
      return;
    }

    if (!isDelivered) {
      alert("You can only review products after they have been completed.");
      return;
    }

    setSubmitting(true);
    try {
      const reviewData: Omit<Review, "id"> = {
        productId: product.id,
        buyerId: auth.currentUser.uid,
        buyerName: currentUser?.displayName || "Anonymous",
        rating,
        comment: newReview.trim(),
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, "reviews"), reviewData);

      // Notify seller
      await addDoc(collection(db, "notifications"), {
        userId: product.sellerId,
        title: "New Review!",
        message: `${currentUser?.displayName || "Someone"} reviewed your product ${product.name}.`,
        type: "review",
        isRead: false,
        createdAt: new Date().toISOString()
      });

      setNewReview("");
      setRating(5);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "reviews");
    } finally {
      setSubmitting(false);
    }
  };

  const averageRating = reviews.length > 0 
    ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length 
    : 0;

  const getVerificationStatus = (profile: UserProfile | null) => {
    if (!profile) return null;
    const importantFields = [
      profile.displayName, profile.username, profile.email, profile.phoneNumber, 
      profile.campus, profile.location, 
      profile.country, profile.city, profile.businessPhoneNumber, profile.photoURL
    ];
    const filledCount = importantFields.filter(f => !!f).length;
    const totalFields = importantFields.length;

    if (filledCount === totalFields) return { label: "Verified", color: "text-emerald-600 bg-emerald-50", icon: ShieldCheck, tag: "verified" };
    if (filledCount >= totalFields / 2) return { label: "Pending Verification", color: "text-blue-600 bg-blue-50", icon: ShieldAlert, tag: "pending" };
    return { label: "Unverified", color: "text-red-600 bg-red-50", icon: Shield, tag: "unverified" };
  };

  const sellerStatus = getVerificationStatus(sellerProfile);

  if (product.isDeleted && currentUser?.uid !== product.sellerId) {
    if (isPageMode) {
      return (
        <div className="w-full max-w-lg mx-auto px-4 py-12 text-center">
          <div className="w-24 h-24 bg-slate-100 dark:bg-zinc-850 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
            <Trash2 className="w-12 h-12 text-slate-400" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 font-sans">Listing Removed</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-8 font-sans">This product or service has been deleted by the vendor and is no longer available.</p>
          <button
            onClick={onClose}
            className="px-8 py-3 bg-[#ff6b00] hover:bg-orange-600 text-white rounded-xl font-bold hover:shadow-lg transition-all active:scale-95 cursor-pointer"
          >
            Back to Marketplace
          </button>
        </div>
      );
    }
    return (
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 shadow-2xl text-center"
            >
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Listing Removed</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-8">This product or service has been deleted by the vendor and is no longer available.</p>
              <button
                onClick={onClose}
                className="w-full py-4 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl font-bold hover:shadow-lg transition-all"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );
  }

  const ContainerWrapper = ({ children }: { children: React.ReactNode }) => {
    if (isPageMode) {
      return (
        <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 py-6 font-sans">
          {children}
        </div>
      );
    }

    return (
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-3xl max-h-[85vh] bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl overflow-y-auto flex flex-col border border-slate-100 dark:border-slate-800"
            >
              {children}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );
  };

  return (
    <ContainerWrapper>
      {isPageMode ? (
        <button
          onClick={onClose}
          className="mb-6 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 rounded-xl text-slate-750 dark:text-zinc-300 transition-all font-black text-xs uppercase tracking-wider cursor-pointer border-none flex items-center gap-1.5 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 text-[#ff6b00]" />
          <span>
            {currentUser?.role === 'seller' || product?.sellerId === currentUser?.uid 
              ? 'Back to Seller Dashboard' 
              : 'Back to marketplace'}
          </span>
        </button>
      ) : (
        <>
          <button
            onClick={onClose}
            className="absolute top-6 left-6 z-[20] p-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all border border-slate-200 dark:border-zinc-800 active:scale-95 shadow-xl flex items-center gap-2 group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Back</span>
          </button>

          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-[20] p-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl text-slate-400 hover:text-red-500 transition-all border border-slate-200 dark:border-zinc-800 active:scale-95 shadow-xl sm:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </>
      )}

      <div className="flex flex-col gap-8 items-stretch mt-4">
              {/* Product Image */}
              <div className="w-full bg-slate-100 dark:bg-slate-800 relative flex flex-col shrink-0 rounded-3xl overflow-hidden border border-slate-150 dark:border-zinc-800/80 shadow-sm h-[320px] sm:h-[480px] md:h-[520px]">
                <div 
                  onClick={() => {
                    setLightboxImageIndex(activeImageIndex);
                    setIsLightboxOpen(true);
                  }}
                  className="flex-1 relative overflow-hidden cursor-pointer group"
                  title="Click to view full image gallery"
                >
                  <motion.img
                    key={activeImageIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ 
                      opacity: 1, 
                      x: 0,
                    }}
                    transition={{ duration: 0.3 }}
                    src={images[activeImageIndex]}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    referrerPolicy="no-referrer"
                  />

                  {/* Magnifying Glass Indicator on Hover */}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="p-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-xl flex items-center gap-2 transform scale-90 group-hover:scale-100 transition-all duration-300">
                      <Maximize2 className="w-4 h-4 text-[#ff6b00]" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">
                        View Full Pictures
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 bottom-6 left-6 absolute z-10">
                    <span className="px-3 py-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-xl text-[10px] font-bold text-indigo-600 uppercase tracking-wider shadow-sm">
                      {product.category}
                    </span>
                    {product.type === "good" && (
                      <span className="px-3 py-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-xl text-[10px] font-bold text-emerald-600 uppercase tracking-wider shadow-sm">
                        {product.condition}
                      </span>
                    )}
                  </div>
                </div>

                {/* Carousel Selection */}
                {images.length > 1 && (
                  <div className="p-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm flex justify-center gap-2 border-t border-slate-100 dark:border-slate-800">
                    {images.map((img, index) => (
                      <button
                        key={`${img.substring(0, 50)}-${index}`}
                        onClick={() => setActiveImageIndex(index)}
                        className={cn(
                          "w-12 h-12 rounded-xl overflow-hidden border-2 transition-all",
                          activeImageIndex === index 
                            ? "border-indigo-500 scale-110 shadow-md" 
                            : "border-transparent opacity-60 hover:opacity-100"
                        )}
                      >
                        <img 
                          src={img} 
                          alt={`Thumbnail ${index}`} 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className={cn("flex-1 flex flex-col", isPageMode ? "p-0 mt-4" : "p-6 sm:p-10")}>
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex text-amber-400">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={`avg-star-${s}`} className={cn("w-4 h-4 fill-current", s > Math.round(averageRating) && "text-slate-200 dark:text-slate-700 fill-none")} />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500">({reviews.length} Reviews)</span>
                  </div>
                  {product.businessName && (
                    <span className="inline-block px-3 py-1 bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest mb-3">
                      {product.businessName}
                    </span>
                  )}
                  <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-2 font-display leading-[0.9] italic tracking-tighter">
                    {product.name}
                  </h2>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-2">
                       <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">by {product.sellerName}</span>
                       {product.category !== "Logistics & Errands" && product.category !== "Logistics" && (
                         <button 
                           onClick={(e) => {
                             e.stopPropagation();
                             onClose();
                             window.dispatchEvent(new CustomEvent('view-seller-store', { detail: product.sellerId }));
                           }}
                           className="flex items-center gap-1.5 px-3 py-1 bg-purple-50 dark:bg-purple-900/10 text-purple-600 rounded-lg hover:bg-purple-100 transition-all font-black text-[10px] uppercase tracking-widest"
                         >
                           <Store className="w-3 h-3" />
                           Visit Store
                         </button>
                       )}
                       {currentUser && currentUser.uid !== product.sellerId && (
                         <button 
                           onClick={(e) => {
                             e.stopPropagation();
                             onClose();
                             window.dispatchEvent(new CustomEvent('open-chat', { detail: product.sellerId }));
                           }}
                           className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-all font-black text-[10px] uppercase tracking-widest"
                         >
                           <MessageSquare className="w-3.5 h-3.5" />
                           Chat
                         </button>
                       )}
                       <button 
                         onClick={(e) => {
                           e.stopPropagation();
                           handleShare();
                         }}
                         className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-all font-black text-[10px] uppercase tracking-widest relative"
                         title="Share Product"
                       >
                         <Share2 className="w-3.5 h-3.5" />
                         Share
                         {shareFeedback && (
                           <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-2.5 py-1 text-[10px] font-black tracking-widest uppercase rounded-lg shadow-xl whitespace-nowrap animate-bounce z-[100] border border-slate-800">
                             {shareFeedback}
                           </span>
                         )}
                       </button>
                    </div>
                    {product.location && (
                      <div className="flex items-center gap-2 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-[9px] font-black text-slate-500 uppercase tracking-widest">
                        <MapPin className="w-3 h-3" />
                        {product.location}
                      </div>
                    )}
                  </div>
                    <div className="flex items-center gap-1 ml-2 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                      <Star className="w-2.5 h-2.5 text-amber-400 fill-current" />
                      {averageRating.toFixed(1)} ({reviews.length} reviews)
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mb-4">
                    <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium flex-1">{product.description}</p>
                    {product.eventDetails?.location && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600 rounded-xl text-[10px] font-bold uppercase tracking-wider">
                        <MapPin className="w-3.5 h-3.5" />
                        {product.eventDetails.location}
                      </div>
                    )}
                    {auth.currentUser && auth.currentUser.uid !== product.sellerId && (
                      <button
                        onClick={() => setIsReportModalOpen(true)}
                        className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-900/10 rounded-xl hover:bg-red-100 transition-colors uppercase tracking-wider"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Report Product
                      </button>
                    )}
                  </div>

                {product.category === "Food & Drinks" && product.menuItems && product.menuItems.length > 0 && (
                  <div className="p-6 bg-indigo-50 dark:bg-indigo-900/10 rounded-[2rem] border border-indigo-100 dark:border-indigo-900/20 mb-8">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Menu Availability</p>
                        <p className="text-xl font-bold text-slate-900 dark:text-white">Selection Required</p>
                      </div>
                      <button 
                        onClick={() => {
                          const menuSection = document.getElementById('food-menu-section');
                          menuSection?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="px-6 py-3 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-2xl font-bold text-xs border border-indigo-100 dark:border-indigo-900/20 hover:bg-indigo-50 transition-all flex items-center gap-2 shadow-sm"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        View Menu List
                      </button>
                    </div>
                  </div>
                )}

                {product.isDeleted && currentUser?.uid === product.sellerId && (
                  <div className="p-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-[2rem] border border-emerald-100 dark:border-emerald-900/20 mb-8 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Status: In Trash</p>
                      <p className="text-sm font-bold text-emerald-900 dark:text-emerald-400">This listing is currently hidden.</p>
                    </div>
                    <button 
                      onClick={async () => {
                        try {
                          await updateDoc(doc(db, "products", product.id), {
                            isDeleted: false,
                            deletedAt: null
                          });
                          onClose();
                        } catch (err) {
                          handleFirestoreError(err, OperationType.UPDATE, `products/${product.id}`);
                        }
                      }}
                      className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold text-xs hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-lg shadow-emerald-200 dark:shadow-none"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Restore Listing
                    </button>
                  </div>
                )}

                {product.type === "service" && (
                  <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-[2rem] border border-blue-100 dark:border-blue-900/20 mb-8">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-blue-600 shrink-0 shadow-sm">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Service Commitment</p>
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2 leading-tight">Professional Quality Guaranteed</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">This service is fulfilled by a verified campus peer. Payment remains in escrow until you confirm satisfaction.</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-6 mb-8 py-6 border-t border-b border-slate-50 dark:border-slate-800/50">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Essential Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/10 flex items-center justify-center text-indigo-600 focus:ring-2 focus:ring-indigo-500">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Business Location</p>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{product.location || sellerProfile?.campus || "Not Specified"}</p>
                      </div>
                    </div>
                    {product.type === "good" && (
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 flex items-center justify-center text-emerald-600">
                          <CheckCircle className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Condition</p>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300 capitalize">{product.condition}</p>
                        </div>
                      </div>
                    )}
                    {product.serialNumber && (
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/10 flex items-center justify-center text-indigo-600">
                          <Hash className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Serial Number</p>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">{product.serialNumber}</p>
                        </div>
                      </div>
                    )}
                    {product.type === "service" && product.pricingType && product.pricingType.toLowerCase() !== "fixed" && (
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/10 flex items-center justify-center text-blue-600">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Pricing</p>
                          <p className="text-xs font-bold text-slate-750 dark:text-slate-300 capitalize">Per {product.pricingType.toLowerCase()}</p>
                        </div>
                      </div>
                    )}
                    {product.collectionType && (
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-950/20 flex items-center justify-center text-[#ff6b00]">
                          <Truck className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Handover / Collection Option</p>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300 capitalize">{product.collectionType}</p>
                        </div>
                      </div>
                    )}
                    {product.businessAddress && (
                      <div className="flex items-start gap-3 col-span-2 mt-1">
                        <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-950/20 flex items-center justify-center text-[#ff6b00] shrink-0">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Extra Handover / Business Address Information</p>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{product.businessAddress}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {product.category !== "Food & Drinks" && (() => {
                  const computedDiscountPct = product.discountPercent && product.discountPercent > 0
                    ? product.discountPercent
                    : (product.priceBefore && product.priceBefore > product.price
                        ? Math.round(((product.priceBefore - product.price) / product.priceBefore) * 100)
                        : 0);
                  const savedAmount = product.priceBefore && product.priceBefore > product.price
                    ? product.priceBefore - product.price
                    : 0;

                  return (
                  <div className="space-y-4 mb-8">
                    {/* Main Price & Stock Row */}
                    <div className="grid gap-4 grid-cols-2">
                      <div className="p-5 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/40 dark:to-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700/80 shadow-sm flex flex-col justify-center relative overflow-hidden">
                        {computedDiscountPct > 0 && (
                          <div className="absolute top-2.5 right-2.5 bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 text-white font-black text-[10px] px-2.5 py-1 rounded-full shadow-md tracking-wider uppercase flex items-center gap-1 animate-pulse">
                            <Tag className="w-3 h-3" />
                            <span>-{computedDiscountPct}% OFF</span>
                          </div>
                        )}
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                          <span>Selling Price</span>
                        </p>
                        <div className="flex items-baseline gap-2.5 flex-wrap">
                          <p className="text-3xl font-black text-slate-900 dark:text-white leading-none">
                            ₦{product.price.toLocaleString()}
                          </p>
                          {product.priceBefore && product.priceBefore > product.price ? (
                            <p className="text-base font-bold text-slate-400 dark:text-zinc-400 line-through decoration-red-500 decoration-2">
                              ₦{product.priceBefore.toLocaleString()}
                            </p>
                          ) : null}
                        </div>
                        {savedAmount > 0 && (
                          <p className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1">
                            🎉 You save ₦{savedAmount.toLocaleString()}!
                          </p>
                        )}
                      </div>

                      <div className="p-5 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/40 dark:to-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700/80 shadow-sm flex flex-col justify-center">
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Stock Left</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">
                          {product.stock === 0 ? "Out of Stock" : `${product.stock} Units Available`}
                        </p>
                      </div>
                    </div>

                    {/* Pricing, Discounts & Collections Section */}
                    <div className="p-5 bg-orange-50/20 dark:bg-zinc-850/20 rounded-2xl border border-orange-100/50 dark:border-zinc-800/80 space-y-4">
                      <div className="flex items-center gap-2 border-b border-orange-100/30 dark:border-zinc-800 pb-2">
                        <Tag className="w-4 h-4 text-orange-500" />
                        <span className="text-[10px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-widest">
                          Pricing & Savings Breakdown
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div className="space-y-1">
                          <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Selling Price</p>
                          <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">₦{product.price.toLocaleString()}</p>
                        </div>

                        {product.priceBefore && product.priceBefore > product.price ? (
                          <div className="space-y-1">
                            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Original Price (Before Discount)</p>
                            <p className="text-sm font-bold text-slate-400 dark:text-slate-500 line-through decoration-red-500 decoration-2">₦{product.priceBefore.toLocaleString()}</p>
                          </div>
                        ) : null}

                        {computedDiscountPct > 0 ? (
                          <div className="space-y-1">
                            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Discount Savings</p>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="px-2 py-0.5 bg-red-500 text-white font-black text-[10px] rounded-full uppercase tracking-wider">
                                -{computedDiscountPct}% OFF
                              </span>
                              {savedAmount > 0 && (
                                <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-xs">
                                  Save ₦{savedAmount.toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : null}

                        {product.promoCode ? (
                          <div className="space-y-1">
                            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Promo / Offer Code</p>
                            <span className="inline-block px-2 py-0.5 bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400 rounded text-[10px] font-mono font-black uppercase tracking-wider">
                              {product.promoCode}
                            </span>
                          </div>
                        ) : null}

                        <div className="space-y-1">
                          <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Promo or Collection Type</p>
                          <p className="font-bold text-slate-700 dark:text-slate-300 capitalize">
                            {product.collectionType || "Standard Listing"}
                          </p>
                        </div>

                        {product.deliveryTime ? (
                          <div className="space-y-1">
                            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Estimated Handover Time</p>
                            <p className="font-bold text-slate-700 dark:text-slate-300">
                              Within {product.deliveryTime} {
                                Number(product.deliveryTime) === 1 
                                  ? (product.deliveryTimeUnit?.toLowerCase().startsWith('hour') ? 'hour' : product.deliveryTimeUnit?.toLowerCase().startsWith('week') ? 'week' : 'day') 
                                  : (product.deliveryTimeUnit || 'days')
                              }
                            </p>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  );
                })()}

                {product.category === "Food & Drinks" && product.menuItems && product.menuItems.length > 0 && (
                  <div id="food-menu-section" className="space-y-4 mb-8 pt-4 scroll-mt-24">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Menu List</h4>
                      <div className="flex items-center gap-3">
                        {getSelectedMenuCount() > 0 && (
                          <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg animate-pulse">
                            {getSelectedMenuCount()} Selected
                          </span>
                        )}
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg">
                          {product.menuItems.length} Options
                        </span>
                      </div>
                    </div>
                      <div className="grid gap-3">
                        {product.menuItems.map((item, idx) => (
                          <MenuItemInteraction 
                            key={item.id ? `${item.id}-${idx}` : `menu-${idx}`} 
                            item={item} 
                            product={product} 
                            quantity={menuQuantities[item.id || item.name] || 0}
                            onQuantityChange={handleMenuQuantityChange}
                            isOwner={currentUser?.uid === product.sellerId}
                          />
                        ))}
                      </div>

                      {/* Bulk Add for Menu Items */}
                      {product.menuItems && product.menuItems.length > 0 && currentUser?.uid !== product.sellerId && (
                        <motion.div
                          initial={false}
                          animate={{ height: getSelectedMenuCount() > 0 ? "auto" : 0, opacity: getSelectedMenuCount() > 0 ? 1 : 0 }}
                          className="overflow-hidden"
                        >
                          <button
                            onClick={() => {
                              product.menuItems?.forEach(item => {
                                const qty = menuQuantities[item.id || item.name] || 0;
                                if (qty > 0) {
                                  onAddToCart(product, { ...item, quantity: qty });
                                }
                              });
                              setMenuQuantities({});
                              onClose();
                            }}
                            className="w-full h-16 mt-4 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl font-bold translate-y-0 active:scale-95 transition-all flex items-center justify-center gap-3 shadow-xl"
                          >
                            <ShoppingCart className="w-5 h-5" />
                            Add Selected Items (₦{getSelectedMenuTotal().toLocaleString()})
                          </button>
                        </motion.div>
                      )}
                  </div>
                )}

                {product.promoCode && (
                  <div className="p-4 bg-orange-50/45 dark:bg-orange-950/15 border border-dashed border-orange-500/30 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                    <div className="text-left">
                      <div className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400">
                        <Tag className="w-3.5 h-3.5 text-[#ff6b00]" />
                        <p className="text-[10px] font-black uppercase tracking-widest leading-none">Promo Code Available</p>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">Use this coupon code or quote it when discussing with the seller!</p>
                    </div>
                    <div className="px-3.5 py-2 bg-white dark:bg-slate-800 border-2 border-orange-500/20 rounded-xl text-xs font-black text-[#ff6b00]/95 select-all cursor-pointer hover:border-[#ff6b00] transition-colors font-mono tracking-wider shadow-sm shrink-0">
                      {product.promoCode}
                    </div>
                  </div>
                )}

                <div className="space-y-4 mb-10">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Delivery & Pickup</h4>
                    <div className="flex flex-col gap-3">
                      {product.deliveryOptions?.delivery && (
                        <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/10 text-blue-600 rounded-2xl border border-blue-100 dark:border-blue-900/20">
                          <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm">
                            <Truck className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest mb-0.5">Campus Delivery</p>
                            <p className="text-xs font-bold">₦{product.deliveryOptions?.deliveryPrice || 500} • To your {product.location || "nearest landmark"}</p>
                          </div>
                        </div>
                      )}
                      {product.deliveryOptions?.pickup && (
                        <div className="flex flex-col gap-3 p-4 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl border border-slate-100 dark:border-slate-700">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm">
                              <MapPin className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest mb-0.5">Self Pickup</p>
                              <p className="text-xs font-bold">Free • At {product.location || "Seller's Location"}</p>
                            </div>
                          </div>
                          {(product.pickupCoordinates || (product.location && product.location.trim() !== "")) && (
                            <div className="rounded-[1.5rem] overflow-hidden border border-slate-200 dark:border-slate-700 relative mt-1 w-full flex flex-col bg-white dark:bg-slate-900 shadow-sm">
                              <div className="h-44 relative w-full bg-slate-50 dark:bg-slate-950">
                                {GOOGLE_MAPS_API_KEY && product.pickupCoordinates ? (
                                  <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
                                    <GoogleMap
                                      defaultZoom={15}
                                      defaultCenter={product.pickupCoordinates}
                                      mapId="DEMO_MAP_ID"
                                      gestureHandling="cooperative"
                                      style={{ width: '100%', height: '100%' }}
                                      internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                                    >
                                      <AdvancedMarker position={product.pickupCoordinates}>
                                        <Pin background={'#4f46e5'} borderColor={'#3730a3'} glyphColor={'#ffffff'} />
                                      </AdvancedMarker>
                                    </GoogleMap>
                                  </APIProvider>
                                ) : (
                                  <iframe
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    loading="lazy"
                                    allowFullScreen
                                    referrerPolicy="no-referrer-when-downgrade"
                                    src={
                                      product.pickupCoordinates 
                                        ? `https://maps.google.com/maps?q=${product.pickupCoordinates.lat},${product.pickupCoordinates.lng}&z=15&output=embed`
                                        : `https://maps.google.com/maps?q=${encodeURIComponent(product.location!.trim())}&z=15&output=embed`
                                    }
                                  />
                                )}
                              </div>
                              <a
                                href={
                                  product.pickupCoordinates
                                    ? `https://www.google.com/maps/dir/?api=1&destination=${product.pickupCoordinates.lat},${product.pickupCoordinates.lng}`
                                    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(product.location!.trim())}`
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full h-10 bg-slate-100 hover:bg-slate-150 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-zinc-250 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 transition-colors border-t border-slate-150 dark:border-slate-750/50"
                              >
                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <polygon points="3 11 22 2 13 21 11 13 3 11"/>
                                </svg>
                                Launch GPS Directions
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                {false ? (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 mb-10">
                    {/* Ticket Tiers */}
                    {product.eventDetails?.isPaid && product.eventDetails.ticketTiers && product.eventDetails.ticketTiers.length > 0 && (
                      <div className="space-y-4">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Select Ticket Tier</h4>
                        <div className="grid gap-3">
                          {product.eventDetails.ticketTiers.map((tier: any, idx: number) => (
                            <button
                              key={tier.id ? `${tier.id}-${idx}` : `tier-${idx}`}
                              type="button"
                              onClick={() => setSelectedTier(tier)}
                              className={cn(
                                "flex items-center justify-between p-4 rounded-2xl border-2 transition-all group w-full",
                                selectedTier?.id === tier.id 
                                  ? "bg-indigo-50 dark:bg-indigo-900/10 border-indigo-500 shadow-md" 
                                  : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-indigo-200"
                              )}
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center overflow-hidden">
                                  {tier.imageUrl ? (
                                    <img src={tier.imageUrl} alt={tier.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <Sparkles className="w-5 h-5 text-indigo-500" />
                                  )}
                                </div>
                                <div className="text-left">
                                  <p className="text-sm font-bold text-slate-900 dark:text-white">{tier.name}</p>
                                  <p className="text-xs text-slate-500 font-medium">{tier.stock} left</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-black text-slate-900 dark:text-white">₦{tier.price.toLocaleString()}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Google Form Link / Embed */}
                    {product.eventDetails?.googleFormUrl && (
                      <div className="space-y-4 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Layout className="w-3 h-3 text-indigo-500" />
                            Google Form Registration
                          </h4>
                          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20 dark:text-indigo-400 px-2 py-0.5 rounded-md">External</span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                          Registration for this event is collected securely on Google Forms. Please fill out the Google Form first, then confirm your RSVP below to add it to your tickets!
                        </p>
                        
                        <a 
                          href={product.eventDetails.googleFormUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full h-11 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 text-xs font-bold shadow-md shadow-indigo-200 dark:shadow-none"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Open google Form & Fill
                        </a>
                      </div>
                    )}

                    {/* Registration Form */}
                    {!product.eventDetails?.googleFormUrl && product.eventDetails?.formFields && product.eventDetails.formFields.length > 0 && (
                      <div className="space-y-4 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Layout className="w-3 h-3 text-indigo-500" />
                            Attendee Information
                          </h4>
                          <span className="text-[10px] font-bold text-slate-400">Required fields marked *</span>
                        </div>
                        <div className="space-y-4">
                          {product.eventDetails.formFields.map((field: any, idx: number) => (
                            <div key={field.id ? `${field.id}-${idx}` : `field-${idx}`} className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                                {field.label} {field.required && <span className="text-red-500">*</span>}
                              </label>
                              {field.type === 'select' ? (
                                <select
                                  required={field.required}
                                  value={formResponses[field.id] || ''}
                                  onChange={(e) => setFormResponses({ ...formResponses, [field.id]: e.target.value })}
                                  className="w-full h-12 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-900 dark:text-white"
                                >
                                  <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" value="">Select an option</option>
                                  {field.options?.map((opt: string, optIdx: number) => (
                                    <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" key={`${opt}-${optIdx}`} value={opt}>{opt}</option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type={field.type === 'email' ? 'email' : (field.type === 'number' ? 'number' : 'text')}
                                  required={field.required}
                                  placeholder={`Enter ${field.label.toLowerCase()}`}
                                  value={formResponses[field.id] || ''}
                                  onChange={(e) => setFormResponses({ ...formResponses, [field.id]: e.target.value })}
                                  className="w-full h-12 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {(currentUser?.uid === product.sellerId || currentUser?.role === "admin") ? (
                      <div className="space-y-3 w-full">
                        <div className="w-full h-16 bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-600 rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center justify-center border border-dashed border-slate-200 dark:border-slate-800">
                          {currentUser?.uid === product.sellerId ? "Your Event Listing" : "Admin View"}
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!confirm("Are you sure you want to permanently delete this event? This action is irreversible.")) return;
                            try {
                              // 1. Delete associated event plans if any match the product ID
                              const plansQ = query(collection(db, "event_plans"), where("listingId", "==", product.id));
                              const plansSnap = await getDocs(plansQ);
                              await Promise.all(plansSnap.docs.map(d => deleteDoc(d.ref)));

                              // 2. Delete the product itself
                              await deleteDoc(doc(db, "products", product.id));

                              // 3. Delete reviews
                              const reviewsQ = query(collection(db, "reviews"), where("productId", "==", product.id));
                              const reviewsSnap = await getDocs(reviewsQ);
                              await Promise.all(reviewsSnap.docs.map(d => deleteDoc(d.ref)));

                              // 4. Delete reports
                              const reportsQ = query(collection(db, "reports"), where("productId", "==", product.id));
                              const reportsSnap = await getDocs(reportsQ);
                              await Promise.all(reportsSnap.docs.map(d => deleteDoc(d.ref)));

                              alert("Event has been successfully deleted.");
                              onClose();
                            } catch (err) {
                              console.error("Error deleting event:", err);
                              alert("Failed to delete event. Please try again.");
                            }
                          }}
                          className="w-full h-12 bg-red-600 hover:bg-red-700 text-white rounded-[2rem] text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4 text-white" />
                          <span>Delete Event Listing</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        disabled={isRegistering}
                        onClick={handleRegistrationClick}
                        className="w-full h-16 bg-brand-gradient text-white rounded-2xl font-bold text-lg shadow-lg shadow-purple-200 dark:shadow-purple-900/20 hover:shadow-purple-300 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
                      >
                        {isRegistering ? (
                          <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                          <Sparkles className="w-6 h-6" />
                        )}
                        {isRegistering ? "Processing RSVP..." : (product.eventDetails?.googleFormUrl ? "Confirm & Book RSVP" : (product.eventDetails?.isPaid ? "Buy Tickets" : "Register Now"))}
                      </button>
                    )}
                  </div>
                ) : (
                  false ? (
                    currentUser?.uid === product.sellerId ? (
                      renderSellerControls()
                    ) : (
                      <div className="space-y-6 pt-4 mb-10">
                        <div>
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Choose Subscription Plan</h4>
                          <div className="space-y-3">
                            {product.menuItems.map((plan, idx) => (
                              <button
                                key={plan.id ? `${plan.id}-${idx}` : `plan-${idx}`}
                                type="button"
                                onClick={() => setSelectedSubPlan(plan)}
                                className={cn(
                                  "flex items-center justify-between p-4 rounded-2xl border-2 transition-all w-full relative group",
                                  selectedSubPlan?.id === plan.id 
                                    ? "bg-indigo-50 dark:bg-indigo-900/10 border-indigo-500 shadow-md" 
                                    : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-indigo-200"
                                )}
                              >
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 font-black text-xs uppercase shrink-0">
                                    {(plan.measureType || "30D").replace(/days|day/gi, '').trim() + "D"}
                                  </div>
                                  <div className="text-left">
                                    <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{plan.name}</p>
                                    {plan.measureAmountDetail && (
                                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{plan.measureAmountDetail}</p>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-black text-slate-900 dark:text-white">₦{plan.price.toLocaleString()}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Subscriber Target Field */}
                        <div className="space-y-3 p-6 bg-slate-50 dark:bg-slate-800/40 rounded-[2rem] border border-slate-100/50 dark:border-slate-800">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            Recipient Account Details
                          </h4>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">
                              Phone Number or Target ID / Email <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. 08031234567 or user@netflix.com"
                              value={subscriberTarget}
                              onChange={(e) => setSubscriberTarget(e.target.value)}
                              className="w-full h-12 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                            />
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            if (!selectedSubPlan) {
                              alert("Please select a subscription package.");
                              return;
                            }
                            if (!subscriberTarget.trim()) {
                              alert("Please provide the recipient Phone Number or Account ID.");
                              return;
                            }
                            onAddToCart(product, selectedSubPlan, undefined, { target: subscriberTarget });
                            onClose();
                          }}
                          className="w-full h-16 bg-brand-gradient text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 hover:shadow-indigo-300 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                        >
                          <ShoppingCart className="w-6 h-6" />
                          <span>Order Subscription • ₦{selectedSubPlan.price.toLocaleString()}</span>
                        </button>
                      </div>
                    )
                  ) : (
                    isFoodAndDrinks && product.menuItems && product.menuItems.length > 0 ? (
                      currentUser?.uid === product.sellerId ? (
                        renderSellerControls()
                      ) : (
                      <div className="space-y-4 mb-10">
                        <button
                          onClick={() => {
                            const selectedMenuItems = product.menuItems!.filter(item => (menuQuantities[item.id || item.name] || 0) > 0);
                            if (selectedMenuItems.length === 0) {
                              alert("Please select at least one item from the menu.");
                              return;
                            }
                            
                            selectedMenuItems.forEach(item => {
                              const qty = menuQuantities[item.id || item.name];
                              for (let i = 0; i < qty; i++) {
                                onAddToCart(product, item);
                              }
                            });
                            onClose();
                          }}
                          className="w-full h-16 bg-brand-gradient text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
                        >
                          <ShoppingCart className="w-5 h-5" />
                          {getSelectedMenuCount() > 0 ? (
                            <span>Add {getSelectedMenuCount()} items to Cart • ₦{getSelectedMenuTotal().toLocaleString()}</span>
                          ) : (
                            <span>Select Items to Add</span>
                          )}
                        </button>
                      </div>
                    )
                  ) : (
                    (!isFoodAndDrinks || !product.menuItems || product.menuItems.length === 0) && (
                      currentUser?.uid === product.sellerId ? (
                        <div className="w-full h-16 bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-600 rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 mb-10">
                          Your Listing
                        </div>
                      ) : (
                        product.type === "service" ? (
                          isBookingService ? (
                            <form onSubmit={handleDirectServiceBooking} className="p-6 bg-slate-50 dark:bg-slate-850/40 rounded-3xl border border-slate-150 dark:border-slate-800/80 space-y-4 mb-10 text-left">
                              <h4 className="text-sm font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-purple-600 animate-pulse" />
                                Customize Your Service Request
                              </h4>
                              <p className="text-[11px] text-slate-500 font-semibold mb-2">
                                Please fill out the details requested by {product.sellerName} to start the service customized for you.
                              </p>

                              {/* Chosen Package Summary visual */}
                              <div className="p-4 bg-indigo-50/40 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100/35 dark:border-indigo-900/40 flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-[10px]">
                                    {selectedServicePackage ? "PKG" : "STD"}
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-tight">Selected gig tier</p>
                                    <p className="text-xs font-extrabold text-slate-700 dark:text-slate-200 mt-0.5 leading-tight">
                                      {selectedServicePackage ? selectedServicePackage.name : "Full Service / Standard"}
                                    </p>
                                  </div>
                                </div>
                                <p className="text-sm font-black text-slate-900 dark:text-white font-mono">
                                  ₦{selectedServicePackage ? selectedServicePackage.price.toLocaleString() : (product.price || 0).toLocaleString()}
                                </p>
                              </div>

                              {/* 1. Academic & Tutoring Fields */}
                              {product.category === "Academic & Tutoring" && (
                                <div className="space-y-3">
                                  <div className="space-y-1">
                                    <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Course Code / Study Topic *</label>
                                    <input 
                                      type="text"
                                      required
                                      value={serviceDoneInputs["courseCode"] || ""}
                                      onChange={(e) => setServiceDoneInputs(prev => ({...prev, courseCode: e.target.value}))}
                                      placeholder="e.g. MTH 101, Calculus, Python Basics"
                                      className="w-full text-xs p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:border-indigo-500 text-slate-900 dark:text-white font-sans"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Preferred Learning Mode *</label>
                                    <select
                                      required
                                      value={serviceDoneInputs["learningMode"] || ""}
                                      onChange={(e) => setServiceDoneInputs(prev => ({...prev, learningMode: e.target.value}))}
                                      className="w-full text-xs p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:border-indigo-500 text-slate-900 dark:text-white font-sans"
                                    >
                                      <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" value="">Select learning mode</option>
                                      <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" value="In-person (On Campus)">In-person (On Campus)</option>
                                      <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" value="Online (Zoom / GMeet)">Online (Zoom / GMeet)</option>
                                    </select>
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Class Schedule / Time *</label>
                                    <input 
                                      type="text"
                                      required
                                      value={serviceDoneInputs["schedule"] || ""}
                                      onChange={(e) => setServiceDoneInputs(prev => ({...prev, schedule: e.target.value}))}
                                      placeholder="e.g. Sat & Sun at 4 PM"
                                      className="w-full text-xs p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:border-indigo-500 text-slate-900 dark:text-white font-sans"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">More Details / Topics to Cover *</label>
                                    <textarea
                                      required
                                      value={serviceDoneInputs["studyDetails"] || ""}
                                      onChange={(e) => setServiceDoneInputs(prev => ({...prev, studyDetails: e.target.value}))}
                                      placeholder="Provide a list of subjects, syllabus details, or exam preparation request..."
                                      className="w-full text-xs p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none h-20 resize-none focus:border-indigo-500 text-slate-900 dark:text-white font-sans"
                                    />
                                  </div>
                                </div>
                              )}

                              {/* 2. Creative & Design / Tech & Digital / Photography & Video */}
                              {(product.category === "Creative & Design" || product.category === "Tech & Digital" || product.category === "Photography & Video") && (
                                <div className="space-y-3">
                                  <div className="space-y-1">
                                    <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Project Brief & Details *</label>
                                    <textarea
                                      required
                                      value={serviceDoneInputs["projectBrief"] || ""}
                                      onChange={(e) => setServiceDoneInputs(prev => ({...prev, projectBrief: e.target.value}))}
                                      placeholder="What do you want created / developed / captured? Describe references or specifications..."
                                      className="w-full text-xs p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none h-24 resize-none focus:border-indigo-500 text-slate-900 dark:text-white font-sans"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Required File Formats *</label>
                                    <select
                                      required
                                      value={serviceDoneInputs["requiredFormat"] || ""}
                                      onChange={(e) => setServiceDoneInputs(prev => ({...prev, requiredFormat: e.target.value}))}
                                      className="w-full text-xs p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:border-indigo-500 text-slate-900 dark:text-white font-sans"
                                    >
                                      <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" value="">Select preferred files format</option>
                                      <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" value="Final Output Files Only (PNG/JPG/PDF)">Final Output Files Only (PNG/JPG/PDF)</option>
                                      <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" value="Source Code / Live Website Link">Source Code / Live Website Link</option>
                                      <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" value="Raw Media / Videos (.MP4 / HighRes RAW)">Raw Media / Videos (.MP4 / HighRes RAW)</option>
                                      <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" value="Complete Design Assets Bundle (with Source .AI/.PSD)">Complete Design Assets Bundle (with Source .AI/.PSD)</option>
                                    </select>
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Requested Deadline *</label>
                                    <input 
                                      type="date"
                                      required
                                      value={serviceDoneInputs["deadline"] || ""}
                                      onChange={(e) => setServiceDoneInputs(prev => ({...prev, deadline: e.target.value}))}
                                      className="w-full text-xs p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:border-indigo-500 text-slate-900 dark:text-white font-sans"
                                    />
                                  </div>
                                </div>
                              )}

                              {/* 3. Logistics & Errands / Handyman Services / Cleaning / Tailoring */}
                              {(product.category === "Logistics & Errands" || product.category === "Handyman Services" || product.category === "Cleaning & Laundry" || product.category === "Tailoring & Fashion") && (
                                <div className="space-y-3">
                                  <div className="space-y-1">
                                    <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Your Hostel / Location Address *</label>
                                    <input 
                                      type="text"
                                      required
                                      value={serviceDoneInputs["serviceLocation"] || ""}
                                      onChange={(e) => setServiceDoneInputs(prev => ({...prev, serviceLocation: e.target.value}))}
                                      placeholder="e.g. Amina Hall, Room B12"
                                      className="w-full text-xs p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:border-indigo-500 text-slate-900 dark:text-white font-sans"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Job requirements & instructions *</label>
                                    <textarea
                                      required
                                      value={serviceDoneInputs["taskDetails"] || ""}
                                      onChange={(e) => setServiceDoneInputs(prev => ({...prev, taskDetails: e.target.value}))}
                                      placeholder="Describe tasks to do, items to clean / deliver / sew, size options..."
                                      className="w-full text-xs p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none h-24 resize-none focus:border-indigo-500 text-slate-900 dark:text-white font-sans"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Preferred Visit Date & Time *</label>
                                    <input 
                                      type="datetime-local"
                                      required
                                      value={serviceDoneInputs["preferredDateTime"] || ""}
                                      onChange={(e) => setServiceDoneInputs(prev => ({...prev, preferredDateTime: e.target.value}))}
                                      className="w-full text-xs p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:border-indigo-500 text-slate-900 dark:text-white font-sans"
                                    />
                                  </div>
                                </div>
                              )}

                              {/* 4. Catering & Cooking */}
                              {product.category === "Catering & Cooking" && (
                                <div className="space-y-3">
                                  <div className="space-y-1">
                                    <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Portions / Guest Count *</label>
                                    <input 
                                      type="number"
                                      min="1"
                                      required
                                      value={serviceDoneInputs["portions"] || ""}
                                      onChange={(e) => setServiceDoneInputs(prev => ({...prev, portions: e.target.value}))}
                                      placeholder="e.g. 5 portions"
                                      className="w-full text-xs p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:border-indigo-500 text-slate-900 dark:text-white font-sans"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Dietary Preferences / Allergy Warnings *</label>
                                    <input 
                                      type="text"
                                      required
                                      value={serviceDoneInputs["dietary"] || ""}
                                      onChange={(e) => setServiceDoneInputs(prev => ({...prev, dietary: e.target.value}))}
                                      placeholder="e.g. No Peanuts, Vegetarian Options"
                                      className="w-full text-xs p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:border-indigo-500 text-slate-900 dark:text-white font-sans"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Preferred Feast/Catering Schedule *</label>
                                    <input 
                                      type="datetime-local"
                                      required
                                      value={serviceDoneInputs["eventTime"] || ""}
                                      onChange={(e) => setServiceDoneInputs(prev => ({...prev, eventTime: e.target.value}))}
                                      className="w-full text-xs p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:border-indigo-550 text-slate-900 dark:text-white font-sans"
                                    />
                                  </div>
                                </div>
                              )}

                              {/* 5. Default Fallback Service fields */}
                              {product.category !== "Academic & Tutoring" && 
                               product.category !== "Creative & Design" && 
                               product.category !== "Tech & Digital" && 
                               product.category !== "Photography & Video" && 
                               product.category !== "Logistics & Errands" && 
                               product.category !== "Handyman Services" && 
                               product.category !== "Cleaning & Laundry" && 
                               product.category !== "Tailoring & Fashion" && 
                               product.category !== "Catering & Cooking" && (
                                <div className="space-y-3">
                                  <div className="space-y-1">
                                    <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Requirements & instructions *</label>
                                    <textarea
                                      required
                                      value={serviceDoneInputs["generalRequirements"] || ""}
                                      onChange={(e) => setServiceDoneInputs(prev => ({...prev, generalRequirements: e.target.value}))}
                                      placeholder="What specifically do you need?"
                                      className="w-full text-xs p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none h-24 resize-none focus:border-indigo-500 text-slate-900 dark:text-white font-sans"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Target Date & Time *</label>
                                    <input 
                                      type="datetime-local"
                                      required
                                      value={serviceDoneInputs["targetDateTime"] || ""}
                                      onChange={(e) => setServiceDoneInputs(prev => ({...prev, targetDateTime: e.target.value}))}
                                      className="w-full text-xs p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:border-indigo-550 text-slate-900 dark:text-white font-sans"
                                    />
                                  </div>
                                </div>
                              )}

                              <div className="flex gap-2.5 pt-4">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsBookingService(false);
                                    setServiceDoneInputs({});
                                  }}
                                  className="flex-1 py-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-transform active:scale-95 cursor-pointer text-center font-sans border-none"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="submit"
                                  disabled={isSubmittingServiceOrder}
                                  className="flex-[2] py-3 bg-brand-gradient text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer text-center flex items-center justify-center gap-2 font-sans"
                                >
                                  {isSubmittingServiceOrder ? (
                                    <>
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                      Ordering...
                                    </>
                                  ) : (
                                    <>
                                      <CalendarCheck className="w-4 h-4" />
                                      Book & Track Service
                                    </>
                                  )}
                                </button>
                              </div>
                            </form>
                          ) : (
                            <div className="space-y-6 mb-10 text-left">
                              <div className="border border-indigo-100/50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 rounded-[2rem] p-6">
                                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-650 dark:text-indigo-400 mb-3 flex items-center gap-1.5 leading-tight">
                                  <Sparkles className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
                                  Available Service Options / Packages
                                </h4>
                                <p className="text-[11px] text-slate-500 font-semibold mb-5 leading-normal">
                                  Select your preferred style menu, design package, list variation, or package option to begin customization & secure ordering on campus checkout.
                                </p>

                                <div className="space-y-4">
                                  {product.menuItems && product.menuItems.length > 0 ? (
                                    product.menuItems.map((plan: any, idx: number) => (
                                      <div 
                                        key={`srv-plan-${plan.id || ""}-${idx}`}
                                        className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-indigo-200 hover:shadow-md group relative"
                                      >
                                        <div className="flex gap-4 items-start">
                                          <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-150/30 font-black text-xs uppercase font-sans">
                                            {(plan.measureType || "SVC").substring(0, 3)}
                                          </div>
                                          <div>
                                            <h5 className="text-sm font-black text-slate-800 dark:text-white leading-tight">{plan.name}</h5>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 leading-normal max-w-sm">
                                              {plan.measureAmountDetail || "Custom standard delivery & premium execution tailored to schedule."}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="flex sm:flex-col items-end gap-2 justify-between mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                                          <span className="text-base font-black text-slate-900 dark:text-white font-mono leading-none">
                                            ₦{plan.price.toLocaleString()}
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setSelectedServicePackage(plan);
                                              setIsBookingService(true);
                                            }}
                                            className="px-5 py-2.5 bg-gradient-to-r from-indigo-650 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md shadow-indigo-100 dark:shadow-none cursor-pointer"
                                          >
                                            <CalendarCheck className="w-3.5 h-3.5" />
                                            <span>Order Gig</span>
                                          </button>
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                      <div className="flex gap-4 items-start">
                                        <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-450 flex items-center justify-center shrink-0 border border-indigo-150/30">
                                          <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
                                        </div>
                                        <div>
                                          <h5 className="text-sm font-black text-slate-800 dark:text-white leading-tight">Standard Package</h5>
                                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 leading-normal">
                                            Full personalized service delivered matching your custom description guidelines.
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex sm:flex-col items-end gap-2 justify-between mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                                        <span className="text-base font-black text-slate-900 dark:text-white font-mono leading-none">
                                          ₦{(product.price || 0).toLocaleString()}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setSelectedServicePackage(null);
                                            setIsBookingService(true);
                                          }}
                                          className="px-5 py-2.5 bg-gradient-to-r from-indigo-650 to-purple-650 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md shadow-indigo-100 dark:shadow-none cursor-pointer"
                                        >
                                          <CalendarCheck className="w-3.5 h-3.5" />
                                          <span>Order service</span>
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        ) : (
                          currentUser?.uid === product.sellerId ? (
                            renderSellerControls()
                          ) : (
                            <button
                              onClick={() => {
                                onAddToCart(product);
                                onClose();
                              }}
                              disabled={product.type === "good" && product.stock === 0}
                              className="w-full h-16 bg-brand-gradient text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 hover:shadow-indigo-300 transition-all active:scale-[0.98] flex items-center justify-center gap-3 mb-10 disabled:opacity-50"
                            >
                              <ShoppingCart className="w-6 h-6" />
                              Add to Cart
                            </button>
                          )
                        )
                      )
                    )
                  )
                )
              )}

              {/* Reviews Section */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-10 space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-purple-500" />
                    Reviews
                  </h3>
                  <span className="text-sm font-bold text-slate-400 dark:text-slate-500">{reviews.length} Total</span>
                </div>

                {/* Add Review Form */}
                {auth.currentUser && auth.currentUser.uid !== product.sellerId && (
                  <div className="space-y-4">
                    {!hasPurchased ? (
                      <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-700 text-center">
                        <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400">You must purchase this product before you can leave a review.</p>
                      </div>
                    ) : !isDelivered ? (
                      <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-700 text-center">
                        <Truck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400">You can leave a review once your order has been delivered.</p>
                      </div>
                    ) : (
                      <form onSubmit={handleSubmitReview} className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-700 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Your Rating</span>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <button
                                key={`input-star-${s}`}
                                type="button"
                                onClick={() => setRating(s)}
                                className="p-1 transition-transform active:scale-125"
                              >
                                <Star className={cn("w-6 h-6", s <= rating ? "text-amber-400 fill-current" : "text-slate-300 dark:text-slate-700")} />
                              </button>
                            ))}
                          </div>
                        </div>
                        <textarea
                          value={newReview}
                          onChange={(e) => setNewReview(e.target.value)}
                          placeholder="Share your experience with this product..."
                          className="w-full h-24 p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all resize-none text-slate-900 dark:text-white placeholder:text-slate-400"
                          required
                        />
                        <button
                          type="submit"
                          disabled={submitting}
                          className="w-full py-3 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-slate-800 dark:hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {submitting ? <Clock className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          Post Review
                        </button>
                      </form>
                    )}
                  </div>
                )}

                {/* Reviews List */}
                <div className="space-y-6">
                  {reviews.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-sm font-medium text-slate-400 italic">No reviews yet. Be the first to review!</p>
                    </div>
                  ) : (
                    reviews.map((review, rIdx) => (
                      <div key={`review-${review.id}-${rIdx}`} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                              <UserIcon className="w-4 h-4 text-slate-400" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900 dark:text-white">{review.buyerName}</p>
                              <div className="flex text-amber-400">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star key={`rev-star-${review.id}-${s}`} className={cn("w-3 h-3 fill-current", s > review.rating && "text-slate-200 dark:text-slate-700 fill-none")} />
                                ))}
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed pl-11">{review.comment}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
      <ReportModal 
        isOpen={isReportModalOpen} 
        onClose={() => setIsReportModalOpen(false)} 
        vendorId={product.sellerId} 
        vendorName={product.sellerName} 
        productId={product.id}
      />

      {/* Immersive Fullscreen Lightbox Image Gallery Overlay */}
      <AnimatePresence>
        {isLightboxOpen && (
          <div className="fixed inset-0 z-[200] flex flex-col justify-between bg-black/95 backdrop-blur-2xl p-4 md:p-8 font-sans select-none animate-in fade-in duration-200">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between w-full z-10">
              <div className="text-white text-xs font-bold uppercase tracking-widest truncate max-w-[60%]">
                {product.name}
              </div>
              <div className="px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-white text-[11px] font-black tracking-widest uppercase">
                {lightboxImageIndex + 1} of {images.length}
              </div>
              <button
                onClick={() => setIsLightboxOpen(false)}
                className="p-3 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-2xl transition-all cursor-pointer border-none flex items-center justify-center"
                title="Close gallery"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Main Interactive Stage */}
            <div className="flex-1 flex items-center justify-between relative max-w-6xl w-full mx-auto my-4">
              {/* Left Navigation */}
              {images.length > 1 && (
                <button
                  onClick={() => setLightboxImageIndex((prev) => (prev - 1 + images.length) % images.length)}
                  className="p-3.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-2xl transition-all cursor-pointer border-none flex items-center justify-center z-10"
                  title="Previous image"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}

              {/* Middle Image Stage */}
              <div className="flex-1 flex items-center justify-center p-4 max-h-[65vh]">
                <motion.img
                  key={lightboxImageIndex}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25 }}
                  src={images[lightboxImageIndex]}
                  alt={product.name}
                  className="max-w-full max-h-[60vh] md:max-h-[65vh] object-contain rounded-2xl shadow-2xl border border-white/5"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Right Navigation */}
              {images.length > 1 && (
                <button
                  onClick={() => setLightboxImageIndex((prev) => (prev + 1) % images.length)}
                  className="p-3.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-2xl transition-all cursor-pointer border-none flex items-center justify-center z-10"
                  title="Next image"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}
            </div>

            {/* Bottom Thumbnail Navigator */}
            {images.length > 1 && (
              <div className="flex flex-col items-center gap-3 w-full max-w-2xl mx-auto z-10">
                <div className="flex justify-center gap-2 overflow-x-auto py-2 px-4 max-w-full">
                  {images.map((img, index) => (
                    <button
                      key={`lightbox-thumb-${index}`}
                      onClick={() => setLightboxImageIndex(index)}
                      className={cn(
                        "w-12 h-12 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0",
                        lightboxImageIndex === index 
                          ? "border-[#ff6b00] scale-110 shadow-md" 
                          : "border-transparent opacity-40 hover:opacity-100"
                      )}
                    >
                      <img 
                        src={img} 
                        alt={`Thumbnail ${index}`} 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </AnimatePresence>
    </ContainerWrapper>
  );
}
