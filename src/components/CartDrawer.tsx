import React from "react";
import { CartItem, UserProfile } from "../types";
import { X, ShoppingBag, Trash2, Plus, Minus, Send, CheckCircle, Truck, Package as PackageIcon, CreditCard, Wallet, ChevronRight, Loader2, Building, ShieldCheck, Clock } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { auth, db } from "../firebase";
import { collection, addDoc, doc, updateDoc, getDoc, query, where, getDocs, setDoc } from "firebase/firestore";
import { cn } from "../lib/utils";
import { handleFirestoreError, OperationType } from "../lib/firebase-errors";
import { usePaystackPayment } from "../hooks/usePaystackPayment";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (productId: string, delta: number, menuItemId?: string, ticketTierId?: string) => void;
  onRemove: (productId: string, menuItemId?: string, ticketTierId?: string) => void;
  onClear: () => void;
  currentUser: UserProfile | null;
  setActiveTab: (tab: string) => void;
}

export default function CartDrawer({ isOpen, onClose, cart, onUpdateQuantity, onRemove, onClear, currentUser, setActiveTab }: CartDrawerProps) {
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [deliveryType, setDeliveryType] = React.useState<"delivery" | "pickup">("pickup");
  const [paymentMethod, setPaymentMethod] = React.useState<"online" | "pod" | "physical">("online");
  const [selectedItemKeys, setSelectedItemKeys] = React.useState<string[]>([]);
  const isCreating = React.useRef(false);

  const getItemKey = (item: CartItem) => `${item.productId}-${item.menuItemId || 'main'}-${item.ticketTierId || 'none'}`;

  // Initialize selection when cart changes or drawer opens
  React.useEffect(() => {
    if (isOpen) {
      setSelectedItemKeys(cart.map(getItemKey));
    }
  }, [isOpen, cart.length]);

  const toggleSelection = (key: string) => {
    setSelectedItemKeys(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
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
  const deliveryFee = React.useMemo(() => {
    if (deliveryType !== "delivery" || selectedItems.length === 0) return 0;
    // Calculate total delivery fee as sum of unique sellers' fees
    const sellerFees = new Map<string, number>();
    selectedItems.forEach(item => {
      const fee = item.deliveryOptions?.deliveryPrice || 500;
      if (!sellerFees.has(item.sellerId) || fee > sellerFees.get(item.sellerId)!) {
        sellerFees.set(item.sellerId, fee);
      }
    });
    return Array.from(sellerFees.values()).reduce((sum, fee) => sum + fee, 0);
  }, [selectedItems, deliveryType]);

  const total = subtotal + deliveryFee;

  const config = {
    reference: (new Date()).getTime().toString(),
    email: currentUser?.email || auth.currentUser?.email || "",
    amount: Math.round(total * 100), // Paystack amount is in kobo, ensure it's an integer
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
      // Group selected items by seller
      const uniqueSelectedItems = Array.from(
        new Map(selectedItems.map(item => [getItemKey(item), item])).values()
      );

      // Group selected items by seller to distribute delivery fees
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
          // Basic fraud prevention: self-referral check
          if (referrerDoc.id === auth.currentUser!.uid) {
            referrerDoc = null; 
          }
        }
      }

      // Create an order for each unique selected item
      const orderPromises = uniqueSelectedItems.map(async (item) => {
        // Calculate proportional commission for this item
        const itemTotal = item.price * item.quantity;
        const commissionRate = item.type === "service" ? 0.06 : 0.05;
        const itemReferralCommission = referrerDoc ? Math.floor((itemTotal * commissionRate) * 0.013) : 0;
        const itemPlatformCommission = (itemTotal * commissionRate) - itemReferralCommission;
        
        // Extract delivery price for this seller's products
        const sellerItems = sellerGrouped[item.sellerId];
        const sellerFee = sellerItems[0].deliveryOptions?.deliveryPrice || 500;
        const itemDeliveryFee = deliveryType === "delivery" ? (sellerFee / sellerItems.length) : 0;

        const itemSellerEarnings = itemTotal - (itemTotal * commissionRate) + itemDeliveryFee;

        // Fetch seller profile to get seller profile name
        let dbSellerName = "Merchant";
        try {
          const sellerSnap = await getDoc(doc(db, "users", item.sellerId));
          if (sellerSnap.exists()) {
            dbSellerName = sellerSnap.data().displayName || "Merchant";
          }
        } catch (err) {
          console.error("Error fetching seller profile name:", err);
        }

        // Generate unique Order ID and unique Product ID
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
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
          productId: item.productId,
          productName: item.name,
          productImageUrl: item.imageUrl || "",
          quantity: item.quantity,
          totalPrice: itemTotal + itemDeliveryFee,
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

        // Fetch product to get delivery time and location
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

        // 1. Create the order
        let orderId = "";
        try {
          const orderRef = await addDoc(collection(db, "orders"), orderData);
          orderId = orderRef.id;
          // Log purchase analytic
          await addDoc(collection(db, "analytics"), {
            productId: item.productId,
            sellerId: item.sellerId,
            type: "purchase",
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, "orders");
        }

        const rawStock = productSnap.exists() ? productSnap.data().stock : undefined;
        const currentStock = (rawStock !== undefined && rawStock !== null) ? Number(rawStock) : item.quantity;
        const initialStock = productSnap.exists() ? Number(productSnap.data().initialStock || currentStock || 0) : currentStock;
        const newStock = Math.max(0, currentStock - item.quantity);

        if (rawStock !== undefined && rawStock !== null && currentStock < item.quantity) {
          throw new Error(`Insufficient stock for ${item.name}`);
        }

        try {
          await updateDoc(productRef, {
            stock: newStock
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `products/${item.productId}`);
        }

        // If the product uses a registered logistics company, notify that company and create logistics delivery record automatically!
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

              // Notify the logistics company
              await addDoc(collection(db, "notifications"), {
                userId: prodData.logisticsCompanyId,
                title: "New Dispatch Booking request!",
                message: `Seller ${dbSellerName} booked you to deliver ${item.name} (x${item.quantity}) to ${currentUser?.displayName || "Anonymous"} on ${prodData.pickupSchool || currentUser?.campus || "Campus"}.`,
                type: "logistics",
                isRead: false,
                createdAt: new Date().toISOString()
              });

              // Update order record to show dispatch requested
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

        // 3. Notify seller of the order
        try {
          await addDoc(collection(db, "notifications"), {
            userId: item.sellerId,
            title: "New Order Received!",
            message: `You have a new order for ${item.name} (x${item.quantity})`,
            type: "order",
            isRead: false,
            createdAt: new Date().toISOString()
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, "notifications/order");
        }

        // 4. Notify seller if stock is low or finished
        if (newStock <= 0) {
          try {
            await addDoc(collection(db, "notifications"), {
              userId: item.sellerId,
              title: "Out of Stock!",
              message: `Your product ${item.name} is now out of stock.`,
              type: "stock",
              isRead: false,
              createdAt: new Date().toISOString()
            });
          } catch (error) {
            handleFirestoreError(error, OperationType.CREATE, "notifications/stock_out");
          }
        } else {
          // If the stock level drops to 20% or less of the initial stock, alert the seller to refill!
          const isLowStock20Percent = initialStock > 0 && newStock <= 0.2 * initialStock;
          if (isLowStock20Percent) {
            try {
              await addDoc(collection(db, "notifications"), {
                userId: item.sellerId,
                title: "Stock Refill Warning (20% remaining)!",
                message: `Your product "${item.name}" has only ${newStock} units left (${Math.round((newStock / initialStock) * 100)}% remaining of original ${initialStock}). Please refill your products!`,
                type: "stock",
                isRead: false,
                createdAt: new Date().toISOString()
              });
            } catch (error) {
              handleFirestoreError(error, OperationType.CREATE, "notifications/stock_low_20_percent");
            }
          } else if (newStock <= 5) {
            try {
              await addDoc(collection(db, "notifications"), {
                userId: item.sellerId,
                title: "Low Stock Alert!",
                message: `Your product ${item.name} has only ${newStock} left in stock.`,
                type: "stock",
                isRead: false,
                createdAt: new Date().toISOString()
              });
            } catch (error) {
              handleFirestoreError(error, OperationType.CREATE, "notifications/stock_low");
            }
          }
        }
      });

      await Promise.all(orderPromises);
      
      // Remove selected items from cart
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
      // Verify payment on server
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
    console.log("Payment closed");
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
    
    if (paymentMethod === "online") {
      if (!import.meta.env.VITE_PAYSTACK_PUBLIC_KEY) {
        alert("Paystack Public Key is not configured. Please add it to your environment variables.");
        return;
      }
      setLoading(true);
      initializePayment({ onSuccess, onClose: onClosePayment });
    } else {
      // Pay on Delivery
      try {
        await createOrders(false);
      } catch (error: any) {
        console.error("POD Order creation failed", error);
        alert("Failed to process order. Please try again.");
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-[200]"
        />
      )}

        <motion.aside
        initial={{ x: "100%" }}
        animate={{ x: isOpen ? 0 : "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed top-0 right-0 bottom-0 w-full sm:w-[400px] bg-white dark:bg-slate-900 text-slate-900 dark:text-white z-[250] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-white dark:bg-slate-900 px-4 sm:px-8 py-4 sm:py-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-col">
            <h2 className="text-xl sm:text-2xl font-black italic tracking-tighter leading-none">Your Cart</h2>
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1 sm:mt-2">{cart.length} unique items</span>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 sm:p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl transition-all text-slate-500 active:scale-90"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 scrollbar-hide">
          {success ? (
            <div className="flex h-full flex-col items-center justify-center text-center animate-in zoom-in-95 duration-500">
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                className="mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-lg shadow-amber-500/10"
              >
                <CheckCircle className="h-10 w-10" />
              </motion.div>
              <h3 className="text-3xl font-black italic tracking-tighter leading-tight mb-4">You're All Set!</h3>
              <p className="text-slate-500 dark:text-slate-400 font-bold text-sm mb-10 max-w-[280px] mx-auto uppercase tracking-wide">Your order has been shot to the vendor. Expect magic soon.</p>
              <button
                onClick={() => {
                  onClear();
                  onClose();
                  setActiveTab("orders");
                }}
                className="group flex items-center gap-3 px-10 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-full font-bold text-xs uppercase tracking-widest transition-all hover:shadow-[0_2px_10px_rgba(234,88,12,0.2)] active:scale-95 cursor-pointer"
              >
                Track My Orders
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          ) : cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in slide-in-from-bottom-8">
              <div className="w-24 sm:w-32 h-24 sm:h-32 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center mb-6 sm:mb-8">
                <ShoppingBag className="w-10 sm:w-12 h-10 sm:h-12 text-slate-200 dark:text-slate-700" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black italic tracking-tighter leading-none mb-3">Cart is Empty</h3>
              <p className="text-slate-400 dark:text-slate-500 mb-8 sm:mb-10 max-w-[240px] mx-auto text-[10px] sm:text-xs font-bold uppercase tracking-widest leading-loose">Go find something amazing on the marketplace.</p>
              <button 
                onClick={() => {
                  setActiveTab("market");
                  onClose();
                }}
                className="px-8 sm:px-10 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-full font-bold text-[10px] sm:text-xs uppercase tracking-widest transition-all hover:shadow-[0_2px_10px_rgba(234,88,12,0.2)] active:scale-95 cursor-pointer"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <>
              {/* 2-Day Cart Reservation Policy Banner */}
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 p-3.5 rounded-2xl flex items-center gap-3">
                <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                <div className="text-xs text-amber-900 dark:text-amber-200">
                  <span className="font-bold">2-Day Reservation Policy:</span> Items stay in your cart for 2 days (48 hours). After 2 days, unpurchased items automatically return to stock for other buyers to buy.
                </div>
              </div>

              {/* Product List */}
              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-center justify-between">
                  <button 
                    onClick={() => setSelectedItemKeys(selectedItemKeys.length === cart.length ? [] : cart.map(getItemKey))}
                    className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest hover:text-amber-600 transition-colors"
                  >
                    {selectedItemKeys.length === cart.length ? "Deselect All" : "Select Everything"}
                  </button>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subtotal</span>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  {cart.map((item, idx) => {
                    const key = getItemKey(item);
                    const isSelected = selectedItemKeys.includes(key);
                    return (
                      <motion.div 
                        layout
                        key={`cart-item-${key}-${idx}`} 
                        className={cn(
                          "flex gap-3 sm:gap-4 p-4 rounded-xl border transition-all",
                          isSelected 
                            ? "bg-white dark:bg-slate-900 border-slate-250 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.05)]" 
                            : "opacity-40 border-slate-100 dark:border-slate-900 grayscale"
                        )}
                      >
                        <div className="flex items-center pr-1.5">
                          <button 
                            onClick={() => toggleSelection(key)}
                            className={cn(
                              "w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center",
                              isSelected ? "bg-purple-600 border-purple-600 text-white" : "border-slate-300 dark:border-zinc-700"
                            )}
                          >
                            {isSelected && <div className="w-2 h-2 rounded-sm bg-white" />}
                          </button>
                        </div>
                        <div className="w-16 sm:w-20 h-16 sm:h-20 bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm shrink-0 border border-slate-150 dark:border-zinc-800">
                          <img 
                            src={item.imageUrl || "/placeholder-product.png"} 
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 flex flex-col justify-between">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <h4 className="text-[13px] sm:text-sm font-black text-slate-900 dark:text-white line-clamp-1 italic tracking-tighter leading-none pt-1">
                                {item.name}
                              </h4>
                              {item.menuItemName && (
                                <p className="text-[10px] text-purple-600 dark:text-purple-400 font-bold mt-1 uppercase tracking-widest">{item.menuItemName}</p>
                              )}
                              {item.formResponses?.target && (
                                <p className="text-[9px] text-slate-400 dark:text-slate-500 font-mono mt-0.5 uppercase">Target: {item.formResponses.target}</p>
                              )}
                            </div>
                            <span className="text-[13px] sm:text-sm font-black text-slate-900 dark:text-white whitespace-nowrap">
                              ₦{(item.price * item.quantity).toLocaleString()}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center bg-slate-50 dark:bg-slate-805 rounded-lg p-0.5 shadow-sm border border-slate-300 dark:border-zinc-700">
                               <button 
                                 onClick={() => onUpdateQuantity(item.productId, -1, item.menuItemId, item.ticketTierId)}
                                 className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-purple-600 transition-colors"
                               >
                                 <Minus className="w-2.5 h-2.5" />
                               </button>
                               <span className="w-6 text-center text-xs font-bold text-slate-900 dark:text-white">{item.quantity}</span>
                               <button 
                                 onClick={() => onUpdateQuantity(item.productId, 1, item.menuItemId, item.ticketTierId)}
                                 className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-purple-600 transition-colors"
                               >
                                 <Plus className="w-2.5 h-2.5" />
                               </button>
                            </div>
                            <button 
                              onClick={() => onRemove(item.productId, item.menuItemId, item.ticketTierId)}
                              className="text-xs text-slate-500 dark:text-slate-400 hover:text-red-600 hover:underline transition-colors font-semibold flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-slate-400" /> Delete
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Checkout Options */}
              <div className="space-y-6 sm:space-y-8 pb-10">
                 <div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                      {hasService ? "Service Fulfillment" : "Fulfillment Mode"}
                    </h3>
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      {hasService ? (
                        <>
                          {(selectedItems.find(item => item.type === "service")?.deliveryOptions?.pickup ?? true) && (
                            <button
                              onClick={() => setDeliveryType("pickup")}
                              className={cn(
                                "flex flex-col items-center gap-2 p-3.5 rounded-2xl border transition-all group cursor-pointer",
                                deliveryType === "pickup" ? "border-orange-500 bg-orange-50/20 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 font-bold" : "border-slate-200 dark:border-zinc-800 text-slate-500 hover:border-slate-300 dark:hover:border-zinc-700"
                              )}
                            >
                              <Building className={cn("w-4 h-4 transition-transform group-hover:scale-105", deliveryType === "pickup" ? "text-orange-600 dark:text-orange-400" : "text-slate-400")} />
                              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-center">Physical Meetup</span>
                            </button>
                          )}
                          {(selectedItems.find(item => item.type === "service")?.deliveryOptions?.delivery ?? false) && (
                            <button
                              onClick={() => setDeliveryType("delivery")}
                              className={cn(
                                "flex flex-col items-center gap-2 p-3.5 rounded-2xl border transition-all group cursor-pointer",
                                deliveryType === "delivery" ? "border-orange-500 bg-orange-50/20 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 font-bold" : "border-slate-200 dark:border-zinc-800 text-slate-500 hover:border-slate-300 dark:hover:border-zinc-700"
                              )}
                            >
                              <Truck className={cn("w-4 h-4 transition-transform group-hover:scale-105", deliveryType === "delivery" ? "text-orange-600 dark:text-orange-400" : "text-slate-400")} />
                              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-center">Home Delivery</span>
                            </button>
                          )}
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setDeliveryType("pickup")}
                            className={cn(
                              "flex flex-col items-center gap-2 p-3.5 rounded-2xl border transition-all group cursor-pointer",
                              deliveryType === "pickup" ? "border-orange-500 bg-orange-50/20 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 font-bold" : "border-slate-200 dark:border-zinc-800 text-slate-500 hover:border-slate-300 dark:hover:border-zinc-700"
                            )}
                          >
                            <Building className={cn("w-4 h-4 transition-transform group-hover:scale-105", deliveryType === "pickup" ? "text-orange-600 dark:text-orange-400" : "text-slate-400")} />
                            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest">Pickup</span>
                          </button>
                          {!hasEvent && (
                            <button
                              onClick={() => setDeliveryType("delivery")}
                              className={cn(
                                "flex flex-col items-center gap-2 p-3.5 rounded-2xl border transition-all group cursor-pointer",
                                deliveryType === "delivery" ? "border-orange-500 bg-orange-50/20 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 font-bold" : "border-slate-200 dark:border-zinc-800 text-slate-500 hover:border-slate-300 dark:hover:border-zinc-700"
                              )}
                            >
                              <Truck className={cn("w-4 h-4 transition-transform group-hover:scale-105", deliveryType === "delivery" ? "text-orange-600 dark:text-orange-400" : "text-slate-400")} />
                              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest">Ship to Me</span>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                 </div>
 
                 <div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Payment Selection</h3>
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      <button
                        onClick={() => setPaymentMethod("online")}
                        className={cn(
                          "flex flex-col items-center gap-2 p-3.5 rounded-2xl border transition-all group cursor-pointer",
                          paymentMethod === "online" ? "border-orange-500 bg-orange-50/20 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 font-bold" : "border-slate-200 dark:border-zinc-800 text-slate-500 hover:border-slate-300 dark:hover:border-zinc-700"
                        )}
                      >
                        <CreditCard className={cn("w-4 h-4 transition-transform group-hover:scale-105", paymentMethod === "online" ? "text-orange-600 dark:text-orange-400" : "text-slate-400")} />
                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest">Direct Pay</span>
                      </button>
                      {hasService ? (
                        <button
                          onClick={() => setPaymentMethod("physical")}
                          className={cn(
                            "flex flex-col items-center gap-2 p-3.5 rounded-2xl border transition-all group cursor-pointer",
                            paymentMethod === "physical" ? "border-orange-500 bg-orange-50/20 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 font-bold" : "border-slate-200 dark:border-zinc-800 text-slate-500 hover:border-slate-300 dark:hover:border-zinc-700"
                          )}
                        >
                          <Wallet className={cn("w-4 h-4 transition-transform group-hover:scale-105", paymentMethod === "physical" ? "text-orange-600 dark:text-orange-400" : "text-slate-400")} />
                          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-center">Physical Payments</span>
                        </button>
                      ) : (
                        !hasEvent && (
                          <button
                            onClick={() => setPaymentMethod("pod")}
                            className={cn(
                              "flex flex-col items-center gap-2 p-3.5 rounded-2xl border transition-all group cursor-pointer",
                              paymentMethod === "pod" ? "border-orange-500 bg-orange-50/20 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 font-bold" : "border-slate-200 dark:border-zinc-800 text-slate-500 hover:border-slate-300 dark:hover:border-zinc-700"
                            )}
                          >
                            <Wallet className={cn("w-4 h-4 transition-transform group-hover:scale-105", paymentMethod === "pod" ? "text-orange-600 dark:text-orange-400" : "text-slate-400")} />
                            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest">On Delivery</span>
                          </button>
                        )
                      )}
                    </div>
                 </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Summary */}
        {cart.length > 0 && !success && (
          <div className="bg-slate-50 dark:bg-slate-950 p-6 shadow-md border-t border-slate-200 dark:border-zinc-800">
            <div className="space-y-2 mb-6">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 dark:text-zinc-400">Selected Subtotal:</span>
                <span className="font-bold text-slate-900 dark:text-white">₦{subtotal.toLocaleString()}</span>
              </div>
              {deliveryType === "delivery" && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 dark:text-zinc-400 font-bold">Delivery Charge</span>
                  <span className="font-bold text-slate-900 dark:text-white">₦{deliveryFee.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-3 border-t border-slate-205 dark:border-zinc-800">
                <span className="text-slate-900 dark:text-white font-bold">Total:</span>
                <span className="text-2xl font-black text-purple-600 dark:text-purple-400 tracking-tight">₦{total.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={loading || selectedItems.length === 0}
              className={cn(
                "w-full h-11 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white rounded-xl font-bold text-xs sm:text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-purple-500/10 cursor-pointer",
                loading && "animate-pulse"
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-900" />
                  Encrypting...
                </>
              ) : (
                <>
                  Finalize Checkout
                </>
              )}
            </button>
            <div className="flex items-center justify-center gap-2 mt-4 sm:mt-6">
               <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
               <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  Secure Encryption Active
               </p>
            </div>
          </div>
        )}
      </motion.aside>
    </AnimatePresence>
  );
}
