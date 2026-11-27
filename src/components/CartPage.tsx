import React from "react";
import { CartItem, OneDollarListing, Product, UserProfile } from "../types";
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
import { cn, generateSixDigitPin } from "../lib/utils";
import { handleFirestoreError, OperationType } from "../lib/firebase-errors";
import { usePaystackPayment } from "../hooks/usePaystackPayment";
import { getPaystackPublicKey, getSyncPaystackPublicKey } from "../utils/paystackConfig";
import { notifyOrderPlaced, triggerTemplatedEmail } from "../utils/orderEmailNotifications";
import { clampOneDollarUsd, formatUsd } from "../lib/oneDollarRate";
import { resolveAvailableStockForCartItem } from "../lib/cartStock";
import EscrowCheckoutModal, { EscrowSessionDetails } from "./EscrowCheckoutModal";

interface CartPageProps {
  cart: CartItem[];
  onUpdateQuantity: (productId: string, delta: number, menuItemId?: string, ticketTierId?: string, isOneDollar?: boolean) => void;
  onRemove: (productId: string, menuItemId?: string, ticketTierId?: string, isOneDollar?: boolean) => void;
  onClear: () => void;
  currentUser: UserProfile | null;
  setActiveTab: (tab: string) => void;
  onBack?: () => void;
  products?: Product[];
  oneDollarListings?: OneDollarListing[];
}

export default function CartPage({ 
  cart, 
  onUpdateQuantity, 
  onRemove, 
  onClear, 
  currentUser, 
  setActiveTab,
  onBack,
  products,
  oneDollarListings
}: CartPageProps) {
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [deliveryType, setDeliveryType] = React.useState<"delivery" | "pickup">("pickup");
  const [paymentMethod, setPaymentMethod] = React.useState<"online" | "pod" | "physical">("online");
  const [useOneDollarEscrow, setUseOneDollarEscrow] = React.useState(true);
  const [oneDollarProvider, setOneDollarProvider] = React.useState<"paystack" | "escrowpay">("paystack");
  const [escrowSession, setEscrowSession] = React.useState<EscrowSessionDetails | null>(null);
  const [isEscrowModalOpen, setIsEscrowModalOpen] = React.useState(false);
  const [checkoutError, setCheckoutError] = React.useState<string | null>(null);
  const [failedEscrowOrders, setFailedEscrowOrders] = React.useState<Array<{ orderId: string; uniqueOrderId: string; totalPrice: number; sellerId: string; productName: string; commissionRate: number; amountNgn: number; isOneDollar: boolean }> | null>(null);
  const [selectedItemKeys, setSelectedItemKeys] = React.useState<string[]>([]);
  const isCreating = React.useRef(false);

  const getItemKey = (item: CartItem) => `${item.isOneDollar ? '1usd-' : ''}${item.productId}-${item.menuItemId || 'main'}-${item.ticketTierId || 'none'}`;

  // Initialize all items as selected on cart load and reset success message on new additions
  React.useEffect(() => {
    setSelectedItemKeys(cart.map(getItemKey));
    if (cart.length > 0) {
      setSuccess(false);
      setCheckoutError(null);
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
  const hasOneDollarItems = selectedItems.some(item => item.isOneDollar);
  const hasRegularMarketplaceItems = selectedItems.some(item => !item.isOneDollar);
  const hasMixedCartItems = hasOneDollarItems && hasRegularMarketplaceItems;
  const allOneDollarItems = selectedItems.length > 0 && selectedItems.every(item => item.isOneDollar);
  
  React.useEffect(() => {
    if (hasEvent) {
      setDeliveryType("pickup");
    }
  }, [hasEvent]);

  React.useEffect(() => {
    if (hasOneDollarItems && paymentMethod !== "online") {
      setPaymentMethod("online");
    }
  }, [hasOneDollarItems, paymentMethod]);

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
      if (!hasOneDollarItems && paymentMethod === "pod") {
        setPaymentMethod("physical");
      }
    } else {
      if (paymentMethod === "physical") {
        setPaymentMethod(hasOneDollarItems ? "online" : "pod");
      }
    }
  }, [hasService, hasOneDollarItems, selectedItems, paymentMethod]);

  const subtotal = selectedItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const total = subtotal;

  const config = {
    reference: (new Date()).getTime().toString(),
    email: currentUser?.email || auth.currentUser?.email || "",
    amount: Math.round(total * 100), // Paystack amount in kobo
    publicKey: getSyncPaystackPublicKey(),
    metadata: {
      custom_fields: []
    }
  };

  const initializePayment = usePaystackPayment(config);

  const createOrders = async (
    isPaid: boolean,
    validatedOneDollar?: {
      oneDollarUnitNgn: number;
      exchangeRateUsdToNgn: number;
      exchangeRateSource: string;
      exchangeRateUpdatedAt: string;
      paymentReference?: string;
    },
    paymentReference?: string,
    options?: {
      initialOrderStatus?: string;
      skipSuccessScreen?: boolean;
      forceEscrowSelected?: boolean;
      paymentProvider?: "escrowpay" | "paystack";
    }
  ): Promise<Array<{ orderId: string; uniqueOrderId: string; totalPrice: number; sellerId: string; productName: string; commissionRate: number }>> => {
    if (selectedItems.length === 0 || isCreating.current) return [];
    isCreating.current = true;
    setLoading(true);

    const createdRecords: Array<{ orderId: string; uniqueOrderId: string; totalPrice: number; sellerId: string; productName: string; commissionRate: number }> = [];

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

      // Create an order for each unique selected item
      const orderPromises = uniqueSelectedItems.map(async (item) => {
        const isOneDollarItem = Boolean(item.isOneDollar);
        const itemUsd = isOneDollarItem ? clampOneDollarUsd(item.usdPrice) : undefined;
        const unitPriceNgn = isOneDollarItem && validatedOneDollar?.exchangeRateUsdToNgn
          ? (itemUsd === 1 && validatedOneDollar?.oneDollarUnitNgn
              ? validatedOneDollar.oneDollarUnitNgn
              : Math.max(1, Math.round((itemUsd || 1) * validatedOneDollar.exchangeRateUsdToNgn)))
          : item.price;
        const itemTotal = unitPriceNgn * item.quantity;
        const commissionRate = item.type === "service" ? 0.06 : 0.05;
        const itemPlatformCommission = isOneDollarItem
          ? Math.round(itemTotal * commissionRate)
          : itemTotal * commissionRate;
        const itemSellerEarnings = itemTotal - itemPlatformCommission;

        // Fetch seller profile details
        let dbSellerName = "Merchant";
        let dbSellerPhone = "";
        let dbSellerAddress = "";
        let dbSellerEmail = "";
        try {
          const sellerSnap = await getDoc(doc(db, "users", item.sellerId));
          if (sellerSnap.exists()) {
            const sData = sellerSnap.data();
            dbSellerName = sData.displayName || "Merchant";
            dbSellerPhone = sData.phoneNumber || sData.phone || "";
            dbSellerAddress = sData.deliveryAddress || sData.location || sData.campus || "";
            dbSellerEmail = sData.email || "";
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
        const deliveryOtp = generateSixDigitPin();
        const sellerHandoverPin = generateSixDigitPin();

        const resolvedRate = validatedOneDollar?.exchangeRateUsdToNgn || item.exchangeRateUsdToNgn;
        const resolvedRateSource = validatedOneDollar?.exchangeRateSource || item.exchangeRateSource;
        const resolvedRateUpdated = validatedOneDollar?.exchangeRateUpdatedAt || item.exchangeRateUpdatedAt;

        const resolvedEscrowSelected = options?.forceEscrowSelected ?? useOneDollarEscrow;
        const orderData: any = {
          uniqueOrderId,
          uniqueProductId,
          deliveryOtp,
          deliveryPin: deliveryOtp,
          sellerHandoverPin,
          sellerHandoverOtp: sellerHandoverPin,
          buyerId: auth.currentUser!.uid,
          buyerName: currentUser?.displayName || "Anonymous",
          buyerEmail: currentUser?.email || auth.currentUser?.email || "",
          buyerPhone: currentUser?.phoneNumber || "N/A",
          sellerId: item.sellerId,
          sellerName: dbSellerName,
          sellerEmail: dbSellerEmail,
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
          sellerEarnings: itemSellerEarnings,
          deliveryType,
          paymentMethod: item.ticketTierId ? "online" : paymentMethod,
          paymentStatus: isPaid ? "paid" : "pending",
          ...(paymentReference ? { paymentReference } : {}),
          status:
            options?.initialOrderStatus ||
            (item.ticketTierId ? "acquired" : (item.type === "service" ? "accepted" : "Pending Seller Acceptance")),
          createdAt: new Date().toISOString(),
          deliveryAddress: currentUser?.deliveryAddress || "",
          type: item.type || "good",
          ...(isOneDollarItem ? {
            isOneDollar: true,
            ...(item.oneDollarListingId ? { oneDollarListingId: item.oneDollarListingId } : {}),
            usdPrice: itemUsd || 1,
            ...(resolvedRate ? { exchangeRateUsdToNgn: resolvedRate } : {}),
            ...(resolvedRateSource ? { exchangeRateSource: resolvedRateSource } : {}),
            ...(resolvedRateUpdated ? { exchangeRateUpdatedAt: resolvedRateUpdated } : {}),
            escrowSelected: resolvedEscrowSelected,
            ...(isPaid ? {
              escrowStatus: resolvedEscrowSelected ? "held" : "not_applicable",
              payoutStatus: resolvedEscrowSelected ? "escrow" : "released"
            } : {}),
            deliveryHandledBy: "vendor"
          } : {
            ...(isPaid ? { escrowStatus: "held", payoutStatus: "escrow" } : {})
          }),
          ...(options?.paymentProvider === "escrowpay" ? {
            paymentReceipt: {
              receiptNumber: `ESC-INIT-${Date.now().toString().slice(-6)}`,
              orderId: "",
              transactionId: paymentReference || "",
              paymentReference: paymentReference || "",
              paymentMethod: "online",
              provider: "escrowpay",
              amountPaid: itemTotal,
              currency: "NGN",
              platformFee: itemPlatformCommission,
              buyerName: currentUser?.displayName || "Buyer",
              productName: item.name,
              quantity: item.quantity,
              deliveryType,
              verificationTimestamp: new Date().toISOString(),
              escrowStatus: "not_applicable",
              status: "processing",
              verifiedStatus: "processing"
            }
          } : {}),
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
          createdRecords.push({
            orderId,
            uniqueOrderId,
            totalPrice: itemTotal,
            sellerId: item.sellerId,
            productName: item.name,
            commissionRate
          });
          await addDoc(collection(db, "analytics"), {
            productId: item.productId,
            sellerId: item.sellerId,
            type: "purchase",
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, "orders");
        }

        // 2. Decrement stock (One Dollar promo stock tracked on oneDollarListings; regular catalog stock on products)
        let newStock = 0;
        if (isOneDollarItem && item.oneDollarListingId) {
          const listingRef = doc(db, "oneDollarListings", item.oneDollarListingId);
          const listingSnap = await getDoc(listingRef);
          const currentPromoStock = listingSnap.exists() ? Number(listingSnap.data().stock || 0) : item.quantity;
          if (listingSnap.exists() && currentPromoStock < item.quantity) {
            throw new Error(`Insufficient One Dollar stock for ${item.name}`);
          }
          newStock = Math.max(0, currentPromoStock - item.quantity);
          try {
            await updateDoc(listingRef, {
              stock: newStock,
              updatedAt: new Date().toISOString()
            });
          } catch (error) {
            console.warn("Unable to decrement One Dollar listing stock:", error);
          }
        } else {
          const rawStock = productSnap.exists() ? productSnap.data().stock : undefined;
          const currentStock = (rawStock !== undefined && rawStock !== null) ? Number(rawStock) : item.quantity;
          newStock = Math.max(0, currentStock - item.quantity);

          if (rawStock !== undefined && rawStock !== null && currentStock < item.quantity) {
            throw new Error(`Insufficient stock for ${item.name}`);
          }

          try {
            const updatePayload: any = {
              stock: newStock
            };
            if (newStock <= 0) {
              updatePayload.status = "inactive";
              updatePayload.outOfStockAt = new Date().toISOString();
            }
            await updateDoc(productRef, updatePayload);
          } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, `products/${item.productId}`);
          }
        }

        // 3. Automated registered logistics integration if configured (NEVER for One Dollar items!)
        let bookedLogisticsPartner: { id?: string; name?: string; deliveryPrice?: number } | null = null;
        if (!isOneDollarItem && productSnap.exists()) {
          const prodData = productSnap.data();
          if (prodData.logisticsType === "registered" && prodData.logisticsCompanyId) {
            try {
              let resolvedDeliveryPrice = Number(prodData.deliveryPrice) > 0 ? Number(prodData.deliveryPrice) : 0;
              if (resolvedDeliveryPrice <= 0) {
                try {
                  const compSnap = await getDoc(doc(db, "logistics_companies", prodData.logisticsCompanyId));
                  if (compSnap.exists()) {
                    const compFee = Number(compSnap.data()?.baseDeliveryPrice) || 0;
                    if (compFee > 0) resolvedDeliveryPrice = compFee;
                  }
                } catch {}
              }

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
                deliveryPrice: resolvedDeliveryPrice,
                deliveryOtp,
                deliveryPin: deliveryOtp,
                sellerHandoverPin,
                sellerHandoverOtp: sellerHandoverPin,
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

              bookedLogisticsPartner = {
                id: prodData.logisticsCompanyId,
                name: prodData.logisticsCompanyName || "Shopiversity Logistics",
                deliveryPrice: resolvedDeliveryPrice
              };
            } catch (logErr) {
              console.error("Error setting up automated logistics:", logErr);
            }
          }
        }

        // 4. Notify seller of new order in Firestore & send Brevo Email Notifications
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

        // Dispatch Brevo transactional emails to Buyer (+ Escrow Receipt if paid), Seller, and booked Logistics Partner
        const buyerEmail = currentUser?.email || auth.currentUser?.email;
        void notifyOrderPlaced({
          orderId,
          order: {
            ...orderData,
            campus: currentUser?.campus || "Campus"
          },
          buyerEmail,
          sellerEmail: dbSellerEmail,
          logisticsPartner: bookedLogisticsPartner
        });

        // 5. Stock alert notifications (in-app + S-36/S-37 Brevo emails)
        if (newStock <= 0) {
          try {
            await addDoc(collection(db, "notifications"), {
              userId: item.sellerId,
              title: "⚠️ Product Out of Stock - 3 Days to Refill!",
              message: `Your product "${item.name}" has completely sold out and is now inactive to buy. Please refill your stock within 3 days (72 hours) in your Seller Dashboard or it will be automatically removed from the marketplace.`,
              type: "stock",
              isRead: false,
              createdAt: new Date().toISOString()
            });
          } catch (error) {
            handleFirestoreError(error, OperationType.CREATE, "notifications/stock_out");
          }
          void triggerTemplatedEmail({
            templateId: "seller_product_out_of_stock",
            recipientEmail: dbSellerEmail,
            recipientUserId: item.sellerId,
            recipientRole: "seller",
            variables: {
              seller_name: dbSellerName || "Campus Merchant",
              product_name: item.name,
              stock_remaining: "0 units"
            },
            idempotencyKey: `out_of_stock_${item.productId}_${orderId}`
          });
        } else if (newStock <= 5) {
          void triggerTemplatedEmail({
            templateId: "seller_product_low_stock",
            recipientEmail: dbSellerEmail,
            recipientUserId: item.sellerId,
            recipientRole: "seller",
            variables: {
              seller_name: dbSellerName || "Campus Merchant",
              product_name: item.name,
              stock_remaining: `${newStock} unit${newStock === 1 ? "" : "s"}`
            },
            idempotencyKey: `low_stock_${item.productId}_${newStock}_${orderId}`
          });
        }
      });

      await Promise.all(orderPromises);
      
      // Remove ordered items from cart
      uniqueSelectedItems.forEach(item => {
        onRemove(item.productId, item.menuItemId, item.ticketTierId, item.isOneDollar);
      });

      if (!options?.skipSuccessScreen) {
        setSuccess(true);
      }
      return createdRecords;
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

      const oneDollarSelected = selectedItems.filter(i => i.isOneDollar);
      let validatedOneDollar: any = undefined;
      if (oneDollarSelected.length > 0) {
        const valRes = await fetch("/api/one-dollar/validate-checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: oneDollarSelected.map((i) => ({
              productId: i.productId,
              quantity: i.quantity,
              usdPrice: clampOneDollarUsd(i.usdPrice),
              unitPriceNgn: i.price
            })),
            paymentReference: response.reference,
            paymentMethod: "online",
            paymentProvider: "paystack",
            totalCartAmountNgn: total
          })
        });
        const valData = await valRes.json();
        if (!valRes.ok || !valData.success) {
          throw new Error(valData.error || "One Dollar exchange rate validation failed.");
        }
        validatedOneDollar = {
          oneDollarUnitNgn: valData.authoritativeUnitNgn,
          exchangeRateUsdToNgn: valData.rateSnapshot?.rate,
          exchangeRateSource: valData.rateSnapshot?.source,
          exchangeRateUpdatedAt: valData.rateSnapshot?.updatedAt
        };
      }

      await createOrders(true, validatedOneDollar, response.reference);
    } catch (error: any) {
      console.error("Order creation failed", error);
      setCheckoutError(error?.message || "Failed to process order. Please contact support.");
    } finally {
      setLoading(false);
    }
  };

  const onClosePayment = () => {
    setLoading(false);
  };

  const startEscrowPayCheckout = async (
    retryRecords?: Array<{ orderId: string; uniqueOrderId: string; totalPrice: number; sellerId: string; productName: string; commissionRate: number; amountNgn: number; isOneDollar: boolean }>
  ) => {
    setLoading(true);
    setCheckoutError(null);
    let createdRecordsForRetry: Array<{ orderId: string; uniqueOrderId: string; totalPrice: number; sellerId: string; productName: string; commissionRate: number; amountNgn: number; isOneDollar: boolean }> =
      retryRecords || [];

    try {
      // Pre-flight check so missing EscrowPay credentials never wipe the user's cart or create orphan orders
      const cfgRes = await fetch("/api/payments/escrow/config-status");
      if (cfgRes.ok) {
        const cfgData = await cfgRes.json();
        if (!cfgData.configured) {
          throw new Error(
            "EscrowPay Sandbox API key is not configured on the server yet (missing ESCROWPAY_TEST_SECRET_KEY). Add it in your server environment variables and redeploy."
          );
        }
      }

      if (!retryRecords || retryRecords.length === 0) {
        let validatedOneDollar: any = undefined;
        if (hasOneDollarItems) {
          const oneDollarSelected = selectedItems.filter(i => i.isOneDollar);
          const valRes = await fetch("/api/one-dollar/validate-checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              items: oneDollarSelected.map((i) => ({
                productId: i.productId,
                quantity: i.quantity,
                usdPrice: clampOneDollarUsd(i.usdPrice),
                unitPriceNgn: i.price
              })),
              paymentReference: `ESC_PRE_${Date.now()}`,
              paymentMethod: "online",
              paymentProvider: "escrowpay",
              totalCartAmountNgn: total
            })
          });
          const valData = await valRes.json();
          if (!valRes.ok || !valData.success) {
            throw new Error(valData.error || "One Dollar exchange rate validation failed.");
          }
          validatedOneDollar = {
            oneDollarUnitNgn: valData.authoritativeUnitNgn,
            exchangeRateUsdToNgn: valData.rateSnapshot?.rate,
            exchangeRateSource: valData.rateSnapshot?.source,
            exchangeRateUpdatedAt: valData.rateSnapshot?.updatedAt
          };
        }

        // Create pending awaiting_payment order(s) FIRST — NEVER marked paid until EscrowPay verifies!
        const createdRecords = await createOrders(false, validatedOneDollar, undefined, {
          initialOrderStatus: "awaiting_payment",
          skipSuccessScreen: true,
          forceEscrowSelected: true,
          paymentProvider: "escrowpay"
        });

        createdRecordsForRetry = createdRecords.map((rec) => ({
          ...rec,
          amountNgn: total,
          isOneDollar: hasOneDollarItems
        }));
      }

      const primaryRecord = createdRecordsForRetry[0];
      if (!primaryRecord?.orderId) {
        throw new Error("Could not create pending order for EscrowPay checkout.");
      }

      const checkoutAmount = primaryRecord.amountNgn || total;
      const idToken = await auth.currentUser?.getIdToken(true);
      const createRes = await fetch("/api/payments/escrow/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {})
        },
        body: JSON.stringify({
          orderId: primaryRecord.orderId,
          uniqueOrderId: primaryRecord.uniqueOrderId,
          amountNgn: checkoutAmount,
          description:
            createdRecordsForRetry.length > 1
              ? `Shopiversity Cart (${createdRecordsForRetry.length} items)`
              : primaryRecord.productName,
          sellerId: primaryRecord.sellerId,
          buyerName: currentUser?.displayName || "Buyer",
          buyerPhone: currentUser?.phoneNumber || "",
          commissionRate: primaryRecord.commissionRate,
          isOneDollar: Boolean(primaryRecord.isOneDollar),
          returnOrigin: window.location.origin
        })
      });

      const createData = await createRes.json().catch(() => ({}));
      if (!createRes.ok || !createData.success) {
        if (createdRecordsForRetry.length > 0) {
          setFailedEscrowOrders(createdRecordsForRetry);
        }
        throw new Error(
          createData.error ||
            "Order saved in Payment Processing, but EscrowPay checkout session could not start right now."
        );
      }

      setFailedEscrowOrders(null);

      // Link EscrowPay transaction details back to all created order docs cleanly (no undefined fields)
      const nowIso = new Date().toISOString();
      await Promise.all(
        createdRecordsForRetry.map((rec) =>
          updateDoc(doc(db, "orders", rec.orderId), {
            paymentReference: createData.reference,
            paymentStatus: "pending",
            paymentReceipt: {
              receiptNumber: `${createData.isTestTransaction ? "ESC-TEST-" : "ESC-"}${Date.now().toString().slice(-6)}`,
              orderId: rec.orderId,
              transactionId: createData.transactionId,
              paymentReference: createData.reference,
              paymentMethod: "online",
              provider: "escrowpay",
              environment: createData.environment,
              isTestTransaction: createData.isTestTransaction,
              escrowId: createData.transactionId,
              ...(createData.checkoutSessionId ? { checkoutSessionId: createData.checkoutSessionId } : {}),
              ...(createData.checkoutUrl ? { checkoutUrl: createData.checkoutUrl } : {}),
              ...(createData.virtualAccount ? { virtualAccount: createData.virtualAccount } : {}),
              amountPaid: rec.totalPrice,
              currency: "NGN",
              platformFee: 0,
              buyerName: currentUser?.displayName || "Buyer",
              productName: rec.productName,
              quantity: 1,
              deliveryType,
              verificationTimestamp: nowIso,
              escrowStatus: "not_applicable",
              status: "processing",
              verifiedStatus: "processing"
            },
            updatedAt: nowIso
          }).catch((updErr) => {
            console.warn("Non-fatal paymentReceipt update warning:", updErr);
          })
        )
      );

      setEscrowSession({
        orderId: primaryRecord.orderId,
        uniqueOrderId: primaryRecord.uniqueOrderId,
        transactionId: createData.transactionId,
        reference: createData.reference,
        environment: createData.environment,
        isTestTransaction: createData.isTestTransaction,
        amountNgn: checkoutAmount,
        currency: "NGN",
        checkoutUrl: createData.checkoutUrl,
        checkoutSessionId: createData.checkoutSessionId,
        virtualAccount: createData.virtualAccount,
        returnUrl: createData.returnUrl
      });
      setIsEscrowModalOpen(true);
    } catch (err: any) {
      console.error("EscrowPay checkout error:", err);
      setCheckoutError(err?.message || "Failed to initialize EscrowPay checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (loading || isCreating.current) return;
    setCheckoutError(null);
    if (!auth.currentUser || !currentUser || selectedItems.length === 0) {
      if (selectedItems.length === 0 && cart.length > 0) {
        setCheckoutError("Please select at least one item to checkout.");
      }
      return;
    }

    if (hasMixedCartItems) {
      setCheckoutError("Please checkout One Dollar items separately from Regular Marketplace items so the right payment gateway applies to each.");
      return;
    }

    if (auth.currentUser && !auth.currentUser.emailVerified) {
      setCheckoutError("Email Verification Required: Please verify your email address before placing an order. Check your inbox or click 'Resend Verification Email' in the top banner.");
      return;
    }

    for (const selectedItem of selectedItems) {
      const liveMaxStock = resolveAvailableStockForCartItem(selectedItem, products, oneDollarListings);
      if (liveMaxStock !== undefined && liveMaxStock <= 0) {
        setCheckoutError(`"${selectedItem.name}" is currently out of stock. Please remove it from your selection to continue.`);
        return;
      }
      if (liveMaxStock !== undefined && selectedItem.quantity > liveMaxStock) {
        setCheckoutError(`"${selectedItem.name}" only has ${liveMaxStock} left in inventory. Please reduce the quantity to ${liveMaxStock} or less before checking out.`);
        return;
      }
    }

    // One Dollar checkout: Paystack primary with optional EscrowPay
    if (hasOneDollarItems) {
      if (oneDollarProvider === "escrowpay") {
        await startEscrowPayCheckout();
        return;
      }
      setLoading(true);
      const activeKey = await getPaystackPublicKey();
      if (!activeKey) {
        setLoading(false);
        setCheckoutError(
          "Paystack Public Key is not configured. Please add VITE_PAYSTACK_PUBLIC_KEY (or live_public_key) to your server environment variables, or choose the EscrowPay Option."
        );
        return;
      }
      initializePayment({ onSuccess, onClose: onClosePayment, publicKey: activeKey });
      return;
    }

    // Regular Marketplace checkout: EscrowPay ONLY (no Paystack!) for online payment; POD / Physical preserved
    if (paymentMethod === "online") {
      await startEscrowPayCheckout();
    } else {
      try {
        await createOrders(false);
      } catch (error: any) {
        console.error("POD Order creation failed", error);
        setCheckoutError(error?.message || "Failed to process order. Please try again.");
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
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                          {item.name}
                        </h3>
                        {item.isOneDollar && (
                          <span className="px-2 py-0.5 rounded bg-[#ff6b00] text-white text-[9px] font-black uppercase tracking-wider shrink-0 tabular-nums">
                            One Dollar ({formatUsd(item.usdPrice)})
                          </span>
                        )}
                      </div>
                      
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

                      <div className="text-xs font-bold text-slate-500 dark:text-slate-400 tabular-nums">
                        ₦{item.price.toLocaleString()} each
                        {item.isOneDollar && (
                          <span className="ml-1.5 text-[10px] font-semibold text-[#ff6b00]">
                            ({formatUsd(item.usdPrice)} USD{item.exchangeRateUsdToNgn ? ` @ ₦${item.exchangeRateUsdToNgn.toLocaleString()}/$1` : ""})
                          </span>
                        )}
                      </div>

                      {item.isOneDollar && (
                        <p className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                          <Truck className="w-3 h-3 shrink-0" />
                          Vendor-managed delivery (No Shopiversity courier assigned)
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Quantity and Actions */}
                  {(() => {
                    const maxStock = resolveAvailableStockForCartItem(item, products, oneDollarListings);
                    const isAtMaxStock = maxStock !== undefined && item.quantity >= maxStock;
                    const exceedsLiveStock = maxStock !== undefined && item.quantity > maxStock;

                    return (
                      <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-zinc-800">
                        <div className="flex flex-col items-start sm:items-center gap-1">
                          <div className="flex items-center bg-slate-100 dark:bg-zinc-800 rounded-xl p-1 border border-slate-200 dark:border-zinc-700">
                            <button 
                              type="button"
                              onClick={() => onUpdateQuantity(item.productId, -1, item.menuItemId, item.ticketTierId, item.isOneDollar)}
                              className="w-7 h-7 flex items-center justify-center text-slate-600 dark:text-zinc-300 hover:text-[#ff6b00] rounded-lg transition-colors cursor-pointer"
                              title="Decrease quantity"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-8 text-center text-xs font-black text-slate-900 dark:text-white tabular-nums">
                              {item.quantity}
                            </span>
                            <button 
                              type="button"
                              disabled={isAtMaxStock}
                              onClick={() => onUpdateQuantity(item.productId, 1, item.menuItemId, item.ticketTierId, item.isOneDollar)}
                              className={cn(
                                "w-7 h-7 flex items-center justify-center rounded-lg transition-colors",
                                isAtMaxStock
                                  ? "text-slate-300 dark:text-zinc-600 cursor-not-allowed opacity-40"
                                  : "text-slate-600 dark:text-zinc-300 hover:text-[#ff6b00] cursor-pointer"
                              )}
                              title={isAtMaxStock ? `Inventory limit reached (${maxStock} available)` : "Increase quantity"}
                              aria-label={isAtMaxStock ? `Inventory limit reached (${maxStock} available)` : "Increase quantity"}
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          {exceedsLiveStock ? (
                            <span className="text-[10px] font-bold text-red-600 dark:text-red-400">
                              Only {maxStock} left in stock
                            </span>
                          ) : isAtMaxStock ? (
                            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                              Max stock ({maxStock})
                            </span>
                          ) : maxStock !== undefined ? (
                            <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-500">
                              {maxStock} in stock
                            </span>
                          ) : null}
                        </div>

                        <div className="text-right">
                          <div className="text-sm sm:text-base font-black text-slate-900 dark:text-white tabular-nums">
                            ₦{(item.price * item.quantity).toLocaleString()}
                          </div>
                          <button 
                            onClick={() => onRemove(item.productId, item.menuItemId, item.ticketTierId, item.isOneDollar)}
                            className="text-[11px] font-bold text-red-500 hover:text-red-600 transition-colors flex items-center gap-1 mt-1 cursor-pointer bg-transparent border-none ml-auto"
                          >
                            <Trash2 className="w-3 h-3" />
                            Remove
                          </button>
                        </div>
                      </div>
                    );
                  })()}
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
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                      {allOneDollarItems ? "Vendor Arranged" : "Campus Courier"}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Mixed Cart Guard */}
            {hasMixedCartItems && (
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-2.5">
                <div className="flex items-start gap-2 text-xs text-amber-900 dark:text-amber-200">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>Separate Checkout Required:</strong> Regular marketplace items checkout via <strong>EscrowPay</strong>, while One Dollar items use <strong>Paystack</strong> (with an optional EscrowPay choice).
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedItemKeys(cart.filter(i => !i.isOneDollar).map(getItemKey))}
                    className="py-2 px-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-amber-300 dark:border-amber-800 text-[11px] font-bold text-slate-800 dark:text-zinc-200 hover:border-[#ff6b00] cursor-pointer"
                  >
                    Select Marketplace Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedItemKeys(cart.filter(i => i.isOneDollar).map(getItemKey))}
                    className="py-2 px-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-amber-300 dark:border-amber-800 text-[11px] font-bold text-slate-800 dark:text-zinc-200 hover:border-[#ff6b00] cursor-pointer"
                  >
                    Select One Dollar Only
                  </button>
                </div>
              </div>
            )}

            {/* Payment Method Selector */}
            {hasOneDollarItems ? (
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400 block">
                  One Dollar Payment Gateway &amp; Protection
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod("online");
                      setOneDollarProvider("paystack");
                    }}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all cursor-pointer text-center",
                      oneDollarProvider === "paystack"
                        ? "border-[#ff6b00] bg-orange-50/40 dark:bg-orange-950/20 text-[#ff6b00] font-bold shadow-sm"
                        : "border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:border-slate-300 dark:hover:border-zinc-700"
                    )}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span className="text-xs font-bold">Paystack</span>
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400">Card / Bank / USSD</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod("online");
                      setOneDollarProvider("escrowpay");
                      setUseOneDollarEscrow(true);
                    }}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all cursor-pointer text-center",
                      oneDollarProvider === "escrowpay"
                        ? "border-[#ff6b00] bg-orange-50/40 dark:bg-orange-950/20 text-[#ff6b00] font-bold shadow-sm"
                        : "border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:border-slate-300 dark:hover:border-zinc-700"
                    )}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span className="text-xs font-bold">EscrowPay Option</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Escrow Protected</span>
                  </button>
                </div>

                {oneDollarProvider === "paystack" && (
                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setUseOneDollarEscrow(true)}
                      className={cn(
                        "flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-all cursor-pointer text-center",
                        useOneDollarEscrow
                          ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 font-bold"
                          : "border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400"
                      )}
                    >
                      <span className="text-[11px] font-bold">Escrow Protected</span>
                      <span className="text-[10px] opacity-80">Held Until Receipt</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setUseOneDollarEscrow(false)}
                      className={cn(
                        "flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-all cursor-pointer text-center",
                        !useOneDollarEscrow
                          ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 font-bold"
                          : "border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400"
                      )}
                    >
                      <span className="text-[11px] font-bold">Direct Payment</span>
                      <span className="text-[10px] opacity-80">No Escrow Hold</span>
                    </button>
                  </div>
                )}

                <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                  {oneDollarProvider === "escrowpay"
                    ? "Your One Dollar payment routes through EscrowPay and stays in Payment Processing until EscrowPay confirms escrow funding."
                    : useOneDollarEscrow
                    ? "Your online Paystack payment is held securely in Shopiversity Escrow until you confirm delivery."
                    : "Your online Paystack payment settles directly after existing platform commission without an escrow hold."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400 block">
                  Payment Option (Marketplace EscrowPay)
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
                    <ShieldCheck className="w-4 h-4" />
                    <span className="text-xs font-bold">Pay via EscrowPay</span>
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
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500">EscrowPay Upon Delivery</span>
                      </button>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Price Calculations */}
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-zinc-800 text-sm">
              <div className="flex justify-between items-center text-slate-600 dark:text-zinc-400">
                <span>Selected Items Subtotal</span>
                <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                  ₦{subtotal.toLocaleString()}
                </span>
              </div>

              {hasOneDollarItems ? (
                <div className="p-3 bg-amber-50/70 dark:bg-amber-950/25 border border-amber-200/70 dark:border-amber-900/40 rounded-xl space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                      One Dollar Delivery
                    </span>
                    <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/50 px-2 py-0.5 rounded-full">
                      Vendor-Managed
                    </span>
                  </div>
                  <p className="text-[10px] text-amber-800 dark:text-amber-300 leading-normal">
                    Shopiversity does not manage delivery or assign campus logistics partners for One Dollar products. Delivery or pickup is arranged directly with the vendor.
                  </p>
                </div>
              ) : deliveryType === "delivery" && (
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
                    {hasOneDollarItems
                      ? oneDollarProvider === "escrowpay"
                        ? "EscrowPay Escrow Hold"
                        : (useOneDollarEscrow ? "Paystack Escrow Hold" : "Paystack Direct Payment")
                      : (paymentMethod === "online" ? "EscrowPay Protected Transfer" : "Pay upon receipt")}
                  </span>
                </div>
                <span className="text-2xl font-black text-[#ff6b00] tracking-tight tabular-nums">
                  ₦{total.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Escrow & Refund Consent Notice */}
            <div className="p-3 bg-slate-50 dark:bg-zinc-900/60 rounded-xl border border-slate-200/60 dark:border-zinc-800 text-left space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 dark:text-zinc-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>
                  {hasOneDollarItems && oneDollarProvider === "paystack" && !useOneDollarEscrow
                    ? "Standard Direct Paystack Checkout"
                    : "Protected by 72-Hour Campus Escrow"}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-normal">
                By completing this order, you agree to the{" "}
                <button
                  type="button"
                  onClick={() => setActiveTab("terms")}
                  className="text-[#ff6b00] hover:underline font-bold bg-transparent border-none p-0 cursor-pointer"
                >
                  Conditions of Use
                </button>{" "}
                and acknowledge the{" "}
                <button
                  type="button"
                  onClick={() => setActiveTab("refund-policy")}
                  className="text-[#ff6b00] hover:underline font-bold bg-transparent border-none p-0 cursor-pointer"
                >
                  72-Hour Refund Policy
                </button>.
              </p>
            </div>

            {/* Visible Inline Checkout Error Banner (replaces iframe-blocked alerts) */}
            {checkoutError && (
              <div
                role="alert"
                className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/35 border border-red-200 dark:border-red-900/50 text-left space-y-2.5"
              >
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                  <p className="text-xs font-semibold text-red-800 dark:text-red-200 leading-relaxed flex-1">
                    {checkoutError}
                  </p>
                </div>
                {failedEscrowOrders && failedEscrowOrders.length > 0 && (
                  <div className="flex flex-wrap gap-2 pl-6">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => void startEscrowPayCheckout(failedEscrowOrders)}
                      className="px-3 py-1.5 rounded-xl bg-[#ff6b00] hover:bg-[#e05e00] text-white text-[11px] font-bold cursor-pointer disabled:opacity-50"
                    >
                      Retry EscrowPay Checkout
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCheckoutError(null);
                        setFailedEscrowOrders(null);
                        setActiveTab("orders");
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-[11px] font-bold cursor-pointer"
                    >
                      View Saved Order
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Checkout Action Button */}
            <button
              onClick={handleCheckout}
              disabled={loading || selectedItems.length === 0 || hasMixedCartItems}
              className={cn(
                "w-full py-4 bg-[#ff6b00] hover:bg-[#e05e00] active:scale-[0.98] text-white rounded-2xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus-visible:ring-2 focus-visible:ring-[#ff6b00] outline-none",
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
                  <span>
                    {hasOneDollarItems
                      ? oneDollarProvider === "escrowpay"
                        ? `Pay ₦${total.toLocaleString()} via EscrowPay`
                        : `Pay ₦${total.toLocaleString()} (${useOneDollarEscrow ? "Paystack Escrow" : "Paystack Direct"})`
                      : (paymentMethod === "online" 
                          ? `Pay ₦${total.toLocaleString()} via EscrowPay` 
                          : `Place Order (₦${total.toLocaleString()} POD)`)}
                  </span>
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

      <EscrowCheckoutModal
        isOpen={isEscrowModalOpen}
        session={escrowSession}
        onClose={() => {
          setIsEscrowModalOpen(false);
          setActiveTab("orders");
        }}
        onProceedToReturnCheck={(returnUrl) => {
          setIsEscrowModalOpen(false);
          try {
            const parsed = new URL(returnUrl, window.location.origin);
            window.history.pushState({}, "", `${parsed.pathname}${parsed.search}`);
            window.dispatchEvent(new PopStateEvent("popstate"));
          } catch {
            window.location.href = returnUrl;
          }
        }}
      />
    </div>
  );
}
