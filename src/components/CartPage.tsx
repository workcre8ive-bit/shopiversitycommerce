import React from "react";
import { CartItem, UserProfile } from "../types";
import { 
  ArrowLeft, 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  CheckCircle, 
  Truck, 
  CreditCard, 
  Wallet, 
  ChevronRight, 
  Loader2, 
  Building, 
  ShieldCheck, 
  Clock, 
  Sparkles,
  Store,
  Check,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { auth, db } from "../firebase";
import { collection, addDoc, doc, updateDoc, getDoc, query, where, getDocs, setDoc } from "firebase/firestore";
import { cn } from "../lib/utils";
import { handleFirestoreError, OperationType } from "../lib/firebase-errors";
import { usePaystackPayment } from "../hooks/usePaystackPayment";

interface CartPageProps {
  cart: CartItem[];
  onUpdateQuantity: (productId: string, delta: number, menuItemId?: string, ticketTierId?: string) => void;
  onRemove: (productId: string, menuItemId?: string, ticketTierId?: string) => void;
  onClear: () => void;
  currentUser: UserProfile | null;
  setActiveTab: (tab: string) => void;
  onBack?: () => void;
}

export default function CartPage({ 
  cart, 
  onUpdateQuantity, 
  onRemove, 
  onClear, 
  currentUser, 
  setActiveTab,
  onBack 
}: CartPageProps) {
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [deliveryType, setDeliveryType] = React.useState<"delivery" | "pickup">("pickup");
  const [paymentMethod, setPaymentMethod] = React.useState<"online" | "pod" | "physical">("online");
  const [selectedItemKeys, setSelectedItemKeys] = React.useState<string[]>([]);
  const isCreating = React.useRef(false);

  const getItemKey = (item: CartItem) => `${item.productId}-${item.menuItemId || 'main'}-${item.ticketTierId || 'none'}`;

  // Initialize all items as selected on cart load and reset success message on new additions
  React.useEffect(() => {
    setSelectedItemKeys(cart.map(getItemKey));
    if (cart.length > 0) {
      setSuccess(false);
    }
  }, [cart.length]);

  const toggleSelection = (key: string) => {
    setSelectedItemKeys(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const selectAll = () => {
    if (selectedItemKeys.length === cart.length) {
      setSelectedItemKeys([]);
    } else {
      setSelectedItemKeys(cart.map(getItemKey));
    }
  };

  const selectedItems = cart.filter(item => 
    selectedItemKeys.includes(getItemKey(item))
  );

  const hasEvent = selectedItems.some(item => item.ticketTierId);
  const hasService = selectedItems.some(item => item.type === "service");
  
  React.useEffect(() => {
    if (hasEvent) {
      setDeliveryType("pickup");
    }
  }, [hasEvent]);

  React.useEffect(() => {
    if (hasService) {
      const firstService = selectedItems.find(item => item.type === "service");
      if (firstService) {
        const canHome = firstService.deliveryOptions?.delivery ?? false;
        const canPhysical = firstService.deliveryOptions?.pickup ?? true;
        
        if (canHome && !canPhysical) {
          setDeliveryType("delivery");
        } else if (!canHome && canPhysical) {
          setDeliveryType("pickup");
        }
      }
      if (paymentMethod === "pod") {
        setPaymentMethod("physical");
      }
    } else {
      if (paymentMethod === "physical") {
        setPaymentMethod("pod");
      }
    }
  }, [hasService, selectedItems, paymentMethod]);

  const subtotal = selectedItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const total = subtotal;

  const config = {
    reference: (new Date()).getTime().toString(),
    email: currentUser?.email || auth.currentUser?.email || "",
    amount: Math.round(total * 100), // Paystack amount in kobo
    publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || "",
    metadata: {
      custom_fields: []
    }
  };

  const initializePayment = usePaystackPayment(config);

  const createOrders = async (isPaid: boolean) => {
    if (selectedItems.length === 0 || isCreating.current) return;
    isCreating.current = true;
    setLoading(true);

    try {
      const uniqueSelectedItems = Array.from(
        new Map(selectedItems.map(item => [getItemKey(item), item])).values()
      );

      // Group selected items by seller
      const sellerGrouped = uniqueSelectedItems.reduce((acc, item) => {
        if (!acc[item.sellerId]) acc[item.sellerId] = [];
        acc[item.sellerId].push(item);
        return acc;
      }, {} as Record<string, CartItem[]>);

      // Pre-generate unique order ID for each seller group
      const sellerOrderIdMap: Record<string, string> = {};
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      Object.keys(sellerGrouped).forEach(sellerId => {
        let randOrd = "";
        for (let i = 0; i < 6; i++) {
          randOrd += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        sellerOrderIdMap[sellerId] = `ORD-${randOrd}`;
      });

      // Get referrer if buyer was referred
      let referrerDoc: any = null;
      if (currentUser?.referredBy) {
        const referrersQ = query(collection(db, "users"), where("referralCode", "==", currentUser.referredBy));
        const referrersSnap = await getDocs(referrersQ);
        if (!referrersSnap.empty) {
          referrerDoc = referrersSnap.docs[0];
          if (referrerDoc.id === auth.currentUser!.uid) {
            referrerDoc = null; 
          }
        }
      }

      // Create an order for each unique selected item
      const orderPromises = uniqueSelectedItems.map(async (item) => {
        const itemTotal = item.price * item.quantity;
        const commissionRate = item.type === "service" ? 0.06 : 0.05;
        const itemReferralCommission = referrerDoc ? Math.floor((itemTotal * commissionRate) * 0.013) : 0;
        const itemPlatformCommission = (itemTotal * commissionRate) - itemReferralCommission;
        const itemSellerEarnings = itemTotal - (itemTotal * commissionRate);

        // Fetch seller profile details
        let dbSellerName = "Merchant";
        let dbSellerPhone = "";
        let dbSellerAddress = "";
        try {
          const sellerSnap = await getDoc(doc(db, "users", item.sellerId));
          if (sellerSnap.exists()) {
            const sData = sellerSnap.data();
            dbSellerName = sData.displayName || "Merchant";
            dbSellerPhone = sData.phoneNumber || sData.phone || "";
            dbSellerAddress = sData.deliveryAddress || sData.location || sData.campus || "";
          }
        } catch (err) {
          console.error("Error fetching seller profile details:", err);
        }

        let randPrd = "";
        for (let i = 0; i < 6; i++) {
          randPrd += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        const uniqueOrderId = sellerOrderIdMap[item.sellerId];
        const uniqueProductId = `PRD-${randPrd}`;

        const orderData: any = {
          uniqueOrderId,
          uniqueProductId,
          buyerId: auth.currentUser!.uid,
          buyerName: currentUser?.displayName || "Anonymous",
          buyerEmail: currentUser?.email || auth.currentUser?.email || "",
          buyerPhone: currentUser?.phoneNumber || "N/A",
          sellerId: item.sellerId,
          sellerName: dbSellerName,
          sellerPhone: dbSellerPhone,
          sellerAddress: dbSellerAddress,
          productId: item.productId,
          productName: item.name,
          productImageUrl: item.imageUrl || "",
          quantity: item.quantity,
          itemSubtotal: itemTotal,
          totalPrice: itemTotal,
          deliveryFee: 0,
          deliveryPrice: 0,
          logisticsOfferStatus: "not_booked",
          commissionAmount: itemPlatformCommission,
          referrerId: referrerDoc?.id || null,
          referralCommissionAmount: itemReferralCommission,
          sellerEarnings: itemSellerEarnings,
          deliveryType,
          paymentMethod: item.ticketTierId ? "online" : paymentMethod,
          paymentStatus: isPaid ? "paid" : "pending",
          status: item.ticketTierId ? "acquired" : (item.type === "service" ? "accepted" : "Pending Seller Acceptance"),
          createdAt: new Date().toISOString(),
          deliveryAddress: currentUser?.deliveryAddress || "",
          type: item.type || "good",
          ...(item.ticketTierId ? { ticketTierId: item.ticketTierId } : {}),
          ...(item.ticketTierName ? { ticketTierName: item.ticketTierName } : {}),
          ...(item.menuItemId ? { menuItemId: item.menuItemId } : {}),
          ...(item.menuItemName ? { menuItemName: item.menuItemName } : {}),
          ...(item.measureType ? { measureType: item.measureType } : {}),
          ...(item.measureAmount ? { measureAmount: item.measureAmount } : {}),
          ...(item.cheapDataHubPlanId ? { cheapDataHubPlanId: item.cheapDataHubPlanId } : {}),
          ...(item.cheapDataHubNetworkCode ? { cheapDataHubNetworkCode: item.cheapDataHubNetworkCode } : {}),
          ...(item.formResponses ? { formResponses: item.formResponses } : {})
        };

        const productRef = doc(db, "products", item.productId);
        const productSnap = await getDoc(productRef);
        if (productSnap.exists()) {
          const prodData = productSnap.data();
          (orderData as any).deliveryTime = prodData.deliveryTime || 1;
          (orderData as any).deliveryTimeUnit = prodData.deliveryTimeUnit || "days";
          if (prodData.location) {
            (orderData as any).location = prodData.location;
          }
        }

        // 1. Create order document
        let orderId = "";
        try {
          const orderRef = await addDoc(collection(db, "orders"), orderData);
          orderId = orderRef.id;
          await addDoc(collection(db, "analytics"), {
            productId: item.productId,
            sellerId: item.sellerId,
            type: "purchase",
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, "orders");
        }

        // 2. Decrement stock
        const rawStock = productSnap.exists() ? productSnap.data().stock : undefined;
        const currentStock = (rawStock !== undefined && rawStock !== null) ? Number(rawStock) : item.quantity;
        const initialStock = productSnap.exists() ? Number(productSnap.data().initialStock || currentStock || 0) : currentStock;
        const newStock = Math.max(0, currentStock - item.quantity);

        if (rawStock !== undefined && rawStock !== null && currentStock < item.quantity) {
          throw new Error(`Insufficient stock for ${item.name}`);
        }

        try {
          await updateDoc(productRef, { stock: newStock });
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `products/${item.productId}`);
        }

        // 3. Automated registered logistics integration if configured
        if (productSnap.exists()) {
          const prodData = productSnap.data();
          if (prodData.logisticsType === "registered" && prodData.logisticsCompanyId) {
            try {
              const deliveryPayload = {
                orderId: orderId,
                productName: item.name,
                productImageUrl: item.imageUrl || "",
                quantity: item.quantity,
                buyerId: auth.currentUser!.uid,
                buyerName: currentUser?.displayName || "Anonymous",
                buyerPhone: currentUser?.phoneNumber || "N/A",
                buyerAddress: currentUser?.deliveryAddress || "Campus Deliveries",
                sellerId: item.sellerId,
                sellerName: dbSellerName,
                sellerAddress: prodData.location || "Campus Retail Hub",
                campus: prodData.pickupSchool || currentUser?.campus || "General",
                status: "pending",
                logisticsId: prodData.logisticsCompanyId,
                logisticsName: prodData.logisticsCompanyName || "Shopiversity Logistics",
                deliveryPrice: Number(prodData.deliveryPrice) || 500,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              };

              await setDoc(doc(db, "logistics_deliveries", `DLV_${orderId}`), deliveryPayload);

              await addDoc(collection(db, "notifications"), {
                userId: prodData.logisticsCompanyId,
                title: "New Dispatch Booking request!",
                message: `Seller ${dbSellerName} booked you to deliver ${item.name} (x${item.quantity}) to ${currentUser?.displayName || "Anonymous"} on ${prodData.pickupSchool || currentUser?.campus || "Campus"}.`,
                type: "logistics",
                isRead: false,
                createdAt: new Date().toISOString()
              });

              await updateDoc(doc(db, "orders", orderId), {
                logisticsOfferStatus: "pending",
                kwikRiderId: `CAMPUS-${(prodData.logisticsCompanyName || "LOGISTICS").toUpperCase().replace(/\s+/g, "-")}`,
                kwikTrackingUrl: "local_logistics",
                deliveredWorkNotes: `Automated Registered Logistics: ${prodData.logisticsCompanyName || "Logistics Partner"}`
              });
            } catch (logErr) {
              console.error("Error setting up automated logistics:", logErr);
            }
          }
        }

        // 4. Notify seller of new order
        try {
          await addDoc(collection(db, "notifications"), {
            userId: item.sellerId,
            title: "New Order Received! 🛍️",
            message: `You have a new order for ${item.name} (x${item.quantity})`,
            type: "order",
            isRead: false,
            createdAt: new Date().toISOString()
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, "notifications/order");
        }

        // 5. Stock alert notifications
        if (newStock <= 0) {
          try {
            await addDoc(collection(db, "notifications"), {
              userId: item.sellerId,
              title: "Out of Stock! ⚠️",
              message: `Your product ${item.name} is now out of stock.`,
              type: "stock",
              isRead: false,
              createdAt: new Date().toISOString()
            });
          } catch (error) {
            handleFirestoreError(error, OperationType.CREATE, "notifications/stock_out");
          }
        }
      });

      await Promise.all(orderPromises);
      
      // Remove ordered items from cart
      uniqueSelectedItems.forEach(item => {
        onRemove(item.productId, item.menuItemId, item.ticketTierId);
      });

      setSuccess(true);
    } catch (err) {
      console.error("Order creation internal error:", err);
      throw err;
    } finally {
      isCreating.current = false;
      setLoading(false);
    }
  };

  const onSuccess = async (response: any) => {
    if (isCreating.current) return;
    setLoading(true);
    try {
      const verifyRes = await fetch(`/api/paystack/verify/${response.reference}`);
      const verifyData = await verifyRes.json();

      if (!verifyData.success) {
        throw new Error("Payment verification failed");
      }

      await createOrders(true);
    } catch (error: any) {
      console.error("Order creation failed", error);
      alert(error.message || "Failed to process order. Please contact support.");
    } finally {
      setLoading(false);
    }
  };

  const onClosePayment = () => {
    setLoading(false);
  };

  const handleCheckout = async () => {
    if (loading || isCreating.current) return;
    if (!auth.currentUser || !currentUser || selectedItems.length === 0) {
      if (selectedItems.length === 0 && cart.length > 0) {
        alert("Please select at least one item to checkout.");
      }
      return;
    }

    if (auth.currentUser && !auth.currentUser.emailVerified) {
      alert("Email Verification Required: Please verify your email address before placing an order. Check your inbox for the verification link or click 'Resend Verification Email' in the top banner.");
      return;
    }
    
    if (paymentMethod === "online") {
      if (!import.meta.env.VITE_PAYSTACK_PUBLIC_KEY) {
        alert("Paystack Public Key is not configured. Please add it to your environment variables.");
        return;
      }
      setLoading(true);
      initializePayment({ onSuccess, onClose: onClosePayment });
    } else {
      try {
        await createOrders(false);
      } catch (error: any) {
        console.error("POD Order creation failed", error);
        alert("Failed to process order. Please try again.");
      }
    }
  };

  // Success Confirmation Full Page State (only shown when cart is empty and order was just completed)
  if (success && cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 sm:py-20 text-center animate-in zoom-in-95 duration-500">
        <motion.div
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          className="mb-8 flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-[2.5rem] bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-2xl shadow-emerald-500/20 mx-auto"
        >
          <CheckCircle className="h-12 w-12 sm:h-14 sm:w-14" />
        </motion.div>
        
        <h2 className="text-3xl sm:text-4xl font-black italic tracking-tighter text-slate-900 dark:text-white leading-tight mb-4">
          Order Successfully Placed!
        </h2>
        <p className="text-slate-600 dark:text-slate-400 font-medium text-sm sm:text-base mb-10 max-w-md mx-auto leading-relaxed">
          Your order has been transmitted directly to the merchant. You can monitor seller acceptance, logistics booking, and delivery status live on your tracking dashboard.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => {
              setSuccess(false);
              onClear();
              setActiveTab("orders");
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-[#ff6b00] hover:bg-[#e05e00] text-white rounded-2xl font-bold text-xs uppercase tracking-widest transition-all shadow-xl shadow-orange-500/20 active:scale-95 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            Track My Orders
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setSuccess(false);
              onClear();
              setActiveTab("market");
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95 cursor-pointer"
          >
            <Store className="w-4 h-4" />
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  // Empty Cart Full Page State
  if (cart.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 sm:py-24 text-center">
        <div className="w-24 sm:w-32 h-24 sm:h-32 bg-orange-50 dark:bg-zinc-900 rounded-[2.5rem] flex items-center justify-center mb-6 sm:mb-8 mx-auto border border-orange-100 dark:border-zinc-800">
          <ShoppingBag className="w-12 sm:w-16 h-12 sm:h-16 text-[#ff6b00]" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black italic tracking-tighter text-slate-900 dark:text-white leading-none mb-3">
          Your Shopping Cart is Empty
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8 sm:mb-10 max-w-sm mx-auto text-xs sm:text-sm font-medium leading-relaxed">
          Looks like you haven't added any products or campus services to your cart yet. Explore thousands of student deals across your campus.
        </p>
        <button 
          onClick={() => setActiveTab("market")}
          className="inline-flex items-center gap-2 px-8 sm:px-10 py-4 bg-[#ff6b00] hover:bg-[#e05e00] text-white rounded-2xl font-bold text-xs uppercase tracking-widest transition-all shadow-xl shadow-orange-500/20 active:scale-95 cursor-pointer"
        >
          <Store className="w-4 h-4" />
          Explore Marketplace
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 animate-in fade-in duration-300">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack ? onBack : () => setActiveTab("market")}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 rounded-xl transition-all active:scale-95 cursor-pointer border-none"
            title="Back to marketplace"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-display tracking-tight">
                Shopping Cart
              </h1>
              <span className="px-2.5 py-0.5 bg-orange-100 dark:bg-orange-950/50 text-[#ff6b00] font-black text-xs rounded-full">
                {cart.length} {cart.length === 1 ? "item" : "items"}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Review your selected goods and services before proceeding to checkout
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center">
          <button
            onClick={selectAll}
            className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-[#ff6b00] transition-colors cursor-pointer bg-transparent border-none"
          >
            {selectedItemKeys.length === cart.length ? "Deselect All" : "Select All Items"}
          </button>
          <span className="text-slate-300 dark:text-zinc-700">|</span>
          <button
            onClick={onClear}
            className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors flex items-center gap-1 cursor-pointer bg-transparent border-none"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Cart
          </button>
        </div>
      </div>

      {/* 2-Day Cart Reservation Policy Alert */}
      <div className="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 p-4 rounded-2xl flex items-start gap-3.5 shadow-sm">
        <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
          <strong className="font-bold">2-Day Cart Reservation Policy:</strong> Items placed in your cart are temporarily reserved for 48 hours. After 48 hours, unpurchased items automatically release back to public merchant stock to ensure fair availability for all campus students.
        </div>
      </div>

      {/* Main 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Cart Items List (lg:col-span-7 or 8) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              Selected Items ({selectedItems.length} of {cart.length})
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              Item Price
            </span>
          </div>

          <div className="space-y-3">
            {cart.map((item, idx) => {
              const key = getItemKey(item);
              const isSelected = selectedItemKeys.includes(key);

              return (
                <motion.div
                  layout
                  key={`cart-page-item-${key}-${idx}`}
                  className={cn(
                    "p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900",
                    isSelected 
                      ? "border-slate-200 dark:border-zinc-800 shadow-sm" 
                      : "opacity-40 border-slate-100 dark:border-zinc-900 grayscale"
                  )}
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    {/* Checkbox Selection */}
                    <button
                      onClick={() => toggleSelection(key)}
                      className={cn(
                        "w-5 h-5 rounded-lg border-2 transition-all flex items-center justify-center shrink-0 cursor-pointer",
                        isSelected 
                          ? "bg-[#ff6b00] border-[#ff6b00] text-white" 
                          : "border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                      )}
                      title={isSelected ? "Deselect item" : "Select item"}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>

                    {/* Thumbnail */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 dark:bg-zinc-800 rounded-2xl overflow-hidden shadow-sm shrink-0 border border-slate-150 dark:border-zinc-800">
                      <img 
                        src={item.imageUrl || "/placeholder-product.png"} 
                        alt={item.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Item Details */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                        {item.name}
                      </h3>
                      
                      {item.menuItemName && (
                        <p className="text-xs text-orange-600 dark:text-orange-400 font-semibold flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> {item.menuItemName}
                        </p>
                      )}

                      {item.ticketTierName && (
                        <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold">
                          Tier: {item.ticketTierName}
                        </p>
                      )}

                      {item.formResponses?.target && (
                        <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md w-fit">
                          Target: {item.formResponses.target}
                        </p>
                      )}

                      <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        ₦{item.price.toLocaleString()} each
                      </div>
                    </div>
                  </div>

                  {/* Quantity and Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-zinc-800">
                    <div className="flex items-center bg-slate-100 dark:bg-zinc-800 rounded-xl p-1 border border-slate-200 dark:border-zinc-700">
                      <button 
                        onClick={() => onUpdateQuantity(item.productId, -1, item.menuItemId, item.ticketTierId)}
                        className="w-7 h-7 flex items-center justify-center text-slate-600 dark:text-zinc-300 hover:text-[#ff6b00] rounded-lg transition-colors cursor-pointer"
                        title="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-xs font-black text-slate-900 dark:text-white">
                        {item.quantity}
                      </span>
                      <button 
                        onClick={() => onUpdateQuantity(item.productId, 1, item.menuItemId, item.ticketTierId)}
                        className="w-7 h-7 flex items-center justify-center text-slate-600 dark:text-zinc-300 hover:text-[#ff6b00] rounded-lg transition-colors cursor-pointer"
                        title="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-right">
                      <div className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                        ₦{(item.price * item.quantity).toLocaleString()}
                      </div>
                      <button 
                        onClick={() => onRemove(item.productId, item.menuItemId, item.ticketTierId)}
                        className="text-[11px] font-bold text-red-500 hover:text-red-600 transition-colors flex items-center gap-1 mt-1 cursor-pointer bg-transparent border-none ml-auto"
                      >
                        <Trash2 className="w-3 h-3" />
                        Remove
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Checkout & Order Summary (lg:col-span-5 or 4, Sticky) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6 lg:sticky lg:top-20">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200/80 dark:border-zinc-800 p-6 shadow-sm space-y-6">
            <h2 className="text-lg font-black text-slate-900 dark:text-white font-display tracking-tight pb-3 border-b border-slate-100 dark:border-zinc-800">
              Order Summary
            </h2>

            {/* Fulfillment Mode Selector */}
            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400 block">
                {hasService ? "Service Fulfillment Mode" : "Delivery Method"}
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setDeliveryType("pickup")}
                  className={cn(
                    "flex flex-col items-center gap-1.5 p-3.5 rounded-2xl border transition-all cursor-pointer text-center",
                    deliveryType === "pickup"
                      ? "border-[#ff6b00] bg-orange-50/40 dark:bg-orange-950/20 text-[#ff6b00] font-bold shadow-sm"
                      : "border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:border-slate-300 dark:hover:border-zinc-700"
                  )}
                >
                  <Building className="w-4 h-4" />
                  <span className="text-xs font-bold">
                    {hasService ? "Physical Meetup" : "Campus Pickup"}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500">Free / Station</span>
                </button>

                {!hasEvent && (
                  <button
                    type="button"
                    onClick={() => setDeliveryType("delivery")}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-3.5 rounded-2xl border transition-all cursor-pointer text-center",
                      deliveryType === "delivery"
                        ? "border-[#ff6b00] bg-orange-50/40 dark:bg-orange-950/20 text-[#ff6b00] font-bold shadow-sm"
                        : "border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:border-slate-300 dark:hover:border-zinc-700"
                    )}
                  >
                    <Truck className="w-4 h-4" />
                    <span className="text-xs font-bold">
                      {hasService ? "Home Delivery" : "Ship to Me"}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500">Campus Courier</span>
                  </button>
                )}
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400 block">
                Payment Option
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("online")}
                  className={cn(
                    "flex flex-col items-center gap-1.5 p-3.5 rounded-2xl border transition-all cursor-pointer text-center",
                    paymentMethod === "online"
                      ? "border-[#ff6b00] bg-orange-50/40 dark:bg-orange-950/20 text-[#ff6b00] font-bold shadow-sm"
                      : "border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:border-slate-300 dark:hover:border-zinc-700"
                  )}
                >
                  <CreditCard className="w-4 h-4" />
                  <span className="text-xs font-bold">Pay Online</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Escrow Protected</span>
                </button>

                {hasService ? (
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("physical")}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-3.5 rounded-2xl border transition-all cursor-pointer text-center",
                      paymentMethod === "physical"
                        ? "border-[#ff6b00] bg-orange-50/40 dark:bg-orange-950/20 text-[#ff6b00] font-bold shadow-sm"
                        : "border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:border-slate-300 dark:hover:border-zinc-700"
                    )}
                  >
                    <Wallet className="w-4 h-4" />
                    <span className="text-xs font-bold">Physical Pay</span>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500">Upon Service</span>
                  </button>
                ) : (
                  !hasEvent && (
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("pod")}
                      className={cn(
                        "flex flex-col items-center gap-1.5 p-3.5 rounded-2xl border transition-all cursor-pointer text-center",
                        paymentMethod === "pod"
                          ? "border-[#ff6b00] bg-orange-50/40 dark:bg-orange-950/20 text-[#ff6b00] font-bold shadow-sm"
                          : "border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:border-slate-300 dark:hover:border-zinc-700"
                      )}
                    >
                      <Wallet className="w-4 h-4" />
                      <span className="text-xs font-bold">Pay on Delivery</span>
                      <span className="text-[10px] text-slate-400 dark:text-zinc-500">Cash / Transfer</span>
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Price Calculations */}
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-zinc-800 text-sm">
              <div className="flex justify-between items-center text-slate-600 dark:text-zinc-400">
                <span>Selected Items Subtotal</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  ₦{subtotal.toLocaleString()}
                </span>
              </div>

              {deliveryType === "delivery" && (
                <div className="p-3 bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200/60 dark:border-orange-900/30 rounded-xl space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-orange-900 dark:text-orange-200">
                      Campus Delivery Fee
                    </span>
                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/50 px-2 py-0.5 rounded-full">
                      Billed Upon Acceptance
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
                    * The final delivery fee is assigned when the seller accepts your order and books an official campus courier.
                  </p>
                </div>
              )}

              <div className="flex justify-between items-baseline pt-3 border-t border-slate-200 dark:border-zinc-800">
                <div>
                  <span className="text-sm font-black text-slate-900 dark:text-white block">
                    Total Due Now:
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {paymentMethod === "online" ? "Online Escrow Transfer" : "Pay upon receipt"}
                  </span>
                </div>
                <span className="text-2xl font-black text-[#ff6b00] tracking-tight">
                  ₦{total.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Checkout Action Button */}
            <button
              onClick={handleCheckout}
              disabled={loading || selectedItems.length === 0}
              className={cn(
                "w-full py-4 bg-[#ff6b00] hover:bg-[#e05e00] active:scale-[0.98] text-white rounded-2xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
                loading && "animate-pulse"
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Processing Order...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Place Order & Checkout</span>
                </>
              )}
            </button>

            {/* Escrow Guarantee Notice */}
            <div className="flex items-center justify-center gap-2 pt-2 text-slate-400 dark:text-zinc-500">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                100% Student Escrow & Buyer Protection
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
