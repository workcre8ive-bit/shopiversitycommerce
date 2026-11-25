import React from "react";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  EyeOff,
  ImagePlus,
  Loader2,
  Package,
  Pause,
  Play,
  Plus,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
  XCircle
} from "lucide-react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { OneDollarListing, Order, Product, UserProfile } from "../types";
import { clampOneDollarUsd, computeOneDollarNgn, formatNaira, formatUsd, useOneDollarRate } from "../lib/oneDollarRate";
import { handleFirestoreError, handleListenerError, isFirestoreQuotaError, OperationType } from "../lib/firebase-errors";
import { compressImage } from "../lib/imageUtils";
import { cn } from "../lib/utils";

interface SellerOneDollarPanelProps {
  currentUser: UserProfile | null;
  products: Product[];
  orders: Order[];
  onOpenOrdersTab?: () => void;
}

const ONE_DOLLAR_CATEGORIES = [
  "Electronics",
  "Textbooks",
  "Clothing",
  "Food & Drinks",
  "Beauty & Health",
  "Home & Personal Care",
  "Creative & Design",
  "Tech & Digital",
  "Sports & Outdoors",
  "Collectibles & Art",
  "Other"
];

const PRICE_PRESETS = [0.25, 0.5, 0.75, 1];

export default function SellerOneDollarPanel({
  currentUser,
  products,
  orders,
  onOpenOrdersTab
}: SellerOneDollarPanelProps) {
  const sellerUid = currentUser?.uid || auth.currentUser?.uid || "";
  const { rateInfo, loading: rateLoading, refreshRate } = useOneDollarRate();

  const [listings, setListings] = React.useState<OneDollarListing[]>([]);
  const [loadingListings, setLoadingListings] = React.useState(true);
  const [submittingId, setSubmittingId] = React.useState<string | null>(null);
  const [togglingId, setTogglingId] = React.useState<string | null>(null);
  const [removingId, setRemovingId] = React.useState<string | null>(null);
  const [deliveryNotesByProduct, setDeliveryNotesByProduct] = React.useState<Record<string, string>>({});
  const [usdInputsByProduct, setUsdInputsByProduct] = React.useState<Record<string, string>>({});
  const [editUsdByListing, setEditUsdByListing] = React.useState<Record<string, string>>({});
  const [feedback, setFeedback] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  // Quick Create New $1 & Below Product Form
  const [showCreateForm, setShowCreateForm] = React.useState(false);
  const [creatingProduct, setCreatingProduct] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [newDescription, setNewDescription] = React.useState("");
  const [newCategory, setNewCategory] = React.useState("Other");
  const [newCondition, setNewCondition] = React.useState<"new" | "refurbished" | "used">("new");
  const [newStock, setNewStock] = React.useState("5");
  const [newUsdPrice, setNewUsdPrice] = React.useState("1.00");
  const [newDeliveryNote, setNewDeliveryNote] = React.useState("");
  const [newImageUrl, setNewImageUrl] = React.useState("");
  const [uploadingImage, setUploadingImage] = React.useState(false);

  React.useEffect(() => {
    if (!sellerUid) {
      setLoadingListings(false);
      return;
    }
    const q = query(
      collection(db, "oneDollarListings"),
      where("sellerId", "==", sellerUid),
      limit(60)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as OneDollarListing))
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setListings(docs);
        setLoadingListings(false);
      },
      (err) => {
        setLoadingListings(false);
        if (isFirestoreQuotaError(err)) return;
        handleListenerError(err, OperationType.LIST, "oneDollarListings");
      }
    );
    return () => unsub();
  }, [sellerUid]);

  const submittedProductIds = React.useMemo(
    () => new Set(listings.map((l) => l.productId)),
    [listings]
  );

  const eligibleProducts = React.useMemo(() => {
    return products.filter((p) => {
      if (p.isDeleted || p.isDraft || p.status === "draft" || p.isArchived) return false;
      if (p.type === "service") return false;
      if (p.category === "Logistics & Errands" || p.category === "Logistics") return false;
      if ((p.stock ?? 0) <= 0) return false;
      if (submittedProductIds.has(p.id)) return false;
      return true;
    });
  }, [products, submittedProductIds]);

  const oneDollarOrders = React.useMemo(
    () => orders.filter((o) => o.isOneDollar === true),
    [orders]
  );

  const oneDollarStats = React.useMemo(() => {
    const validOrders = oneDollarOrders.filter((o) => o.status !== "cancelled");
    const completedOrders = oneDollarOrders.filter((o) => o.status === "completed");
    const grossSalesNgn = validOrders.reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);
    const netEarningsNgn = completedOrders.reduce(
      (sum, o) => sum + (Number(o.sellerEarnings) || Number(o.totalPrice) * 0.95),
      0
    );
    return {
      totalOrders: validOrders.length,
      completedCount: completedOrders.length,
      grossSalesNgn,
      netEarningsNgn
    };
  }, [oneDollarOrders]);

  const isSuspended = currentUser?.oneDollarSuspended === true;

  const getDefaultUsdString = (product: Product): string => {
    if (usdInputsByProduct[product.id] !== undefined) {
      return usdInputsByProduct[product.id];
    }
    if (rateInfo?.rate && product.price > 0) {
      const converted = product.price / rateInfo.rate;
      if (converted > 0 && converted <= 1) {
        return Math.max(0.01, Math.min(1, Math.round(converted * 100) / 100)).toFixed(2);
      }
    }
    return "1.00";
  };

  const parseValidUsdPrice = (raw: string): number | null => {
    const num = Number(raw);
    if (!Number.isFinite(num) || num <= 0 || num > 1) return null;
    const rounded = Math.round(num * 100) / 100;
    if (rounded < 0.01 || rounded > 1) return null;
    return rounded;
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    setFeedback(null);
    try {
      const compressed = await compressImage(file);
      setNewImageUrl(compressed);
    } catch (err: any) {
      setFeedback({ type: "error", text: err?.message || "Failed to process image file." });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCreateAndSubmitNewProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellerUid || !currentUser || isSuspended) return;

    const cleanName = newName.trim();
    const cleanDesc = newDescription.trim();
    const parsedStock = Math.floor(Number(newStock));
    const parsedUsd = parseValidUsdPrice(newUsdPrice);

    if (!cleanName) {
      setFeedback({ type: "error", text: "Please enter a product name." });
      return;
    }
    if (!cleanDesc) {
      setFeedback({ type: "error", text: "Please provide a short product description." });
      return;
    }
    if (!Number.isFinite(parsedStock) || parsedStock < 1) {
      setFeedback({ type: "error", text: "Stock must be at least 1 unit." });
      return;
    }
    if (parsedUsd === null) {
      setFeedback({ type: "error", text: "One Dollar product price must be between $0.01 and $1.00 USD." });
      return;
    }

    const ngnPrice = computeOneDollarNgn(parsedUsd, rateInfo) || Math.max(100, Math.round(parsedUsd * (rateInfo?.rate || 1400)));
    const storeName = currentUser.businessName || currentUser.storefrontSettings?.businessName || currentUser.displayName || "Campus Store";

    setCreatingProduct(true);
    setFeedback(null);
    try {
      const now = new Date().toISOString();
      const productPayload: Record<string, any> = {
        name: cleanName.slice(0, 200),
        businessName: storeName,
        description: cleanDesc.slice(0, 5000),
        price: ngnPrice,
        category: newCategory || "Other",
        imageUrl: newImageUrl || "",
        imageUrls: newImageUrl ? [newImageUrl] : [],
        sellerId: sellerUid,
        sellerName: currentUser.displayName || storeName,
        sellerVerified: Boolean(currentUser.isVerified),
        createdAt: now,
        updatedAt: now,
        stock: parsedStock,
        type: "good",
        condition: newCondition,
        deliveryOptions: {
          delivery: true,
          pickup: true,
          deliveryPrice: 0
        },
        location: currentUser.deliveryAddress || currentUser.location || currentUser.campus || "",
        pickupSchool: currentUser.campus || null,
        status: "active",
        isDraft: false
      };
      if (currentUser.publicContact) {
        productPayload.publicContact = currentUser.publicContact;
      }

      const productRef = await addDoc(collection(db, "products"), productPayload);
      const listingId = `odl_${productRef.id}`;
      const listingPayload: Record<string, any> = {
        id: listingId,
        productId: productRef.id,
        sellerId: sellerUid,
        sellerName: currentUser.displayName || "Vendor",
        storeName,
        sellerVerified: Boolean(currentUser.isVerified),
        productName: cleanName.slice(0, 200),
        description: cleanDesc.slice(0, 5000),
        category: newCategory || "Other",
        condition: newCondition,
        imageUrl: newImageUrl || "",
        imageUrls: newImageUrl ? [newImageUrl] : [],
        stock: parsedStock,
        campus: currentUser.campus || "",
        location: currentUser.deliveryAddress || currentUser.location || "",
        usdPrice: parsedUsd,
        status: "pending_approval",
        isActive: false,
        deliveryNotice: newDeliveryNote.trim().slice(0, 300) || "Delivery or campus pickup arranged directly with the vendor.",
        createdAt: now,
        updatedAt: now
      };
      if (currentUser.publicContact) {
        listingPayload.publicContact = currentUser.publicContact;
      }

      await setDoc(doc(db, "oneDollarListings", listingId), listingPayload);

      await addDoc(collection(db, "notifications"), {
        userId: sellerUid,
        title: "One Dollar Product Submitted",
        message: `"${cleanName}" (${formatUsd(parsedUsd)} USD) has been created and submitted for Admin approval.`,
        type: "system",
        isRead: false,
        createdAt: now
      }).catch(() => {});

      setNewName("");
      setNewDescription("");
      setNewStock("5");
      setNewUsdPrice("1.00");
      setNewDeliveryNote("");
      setNewImageUrl("");
      setShowCreateForm(false);

      setFeedback({
        type: "success",
        text: `"${cleanName}" added at ${formatUsd(parsedUsd)} USD and submitted for Admin approval.`
      });
    } catch (err: any) {
      setFeedback({ type: "error", text: err?.message || "Could not create One Dollar product." });
      handleFirestoreError(err, OperationType.CREATE, "oneDollarListings");
    } finally {
      setCreatingProduct(false);
    }
  };

  const handleSubmitProduct = async (product: Product) => {
    if (!sellerUid || !currentUser || isSuspended) return;
    const rawUsd = getDefaultUsdString(product);
    const parsedUsd = parseValidUsdPrice(rawUsd);
    if (parsedUsd === null) {
      setFeedback({
        type: "error",
        text: `Please enter a valid USD price between $0.01 and $1.00 for "${product.name}".`
      });
      return;
    }

    setSubmittingId(product.id);
    setFeedback(null);
    try {
      const listingId = `odl_${product.id}`;
      const now = new Date().toISOString();
      const note = (deliveryNotesByProduct[product.id] || "").trim().slice(0, 300);

      const payload: Record<string, any> = {
        id: listingId,
        productId: product.id,
        sellerId: sellerUid,
        sellerName: currentUser.displayName || product.sellerName || "Vendor",
        storeName: currentUser.businessName || currentUser.storefrontSettings?.businessName || product.businessName || currentUser.displayName || "Campus Store",
        sellerVerified: Boolean(currentUser.isVerified),
        productName: product.name,
        description: product.description || "",
        category: product.category || "Other",
        condition: product.condition || "new",
        imageUrl: product.imageUrl || product.imageUrls?.[0] || "",
        imageUrls: product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls : (product.imageUrl ? [product.imageUrl] : []),
        stock: Number(product.stock || 0),
        campus: currentUser.campus || product.pickupSchool || "",
        location: product.location || currentUser.deliveryAddress || "",
        usdPrice: parsedUsd,
        status: "pending_approval",
        isActive: false,
        deliveryNotice: note || "Delivery or campus pickup arranged directly with the vendor.",
        createdAt: now,
        updatedAt: now
      };
      if (product.publicContact || currentUser.publicContact) {
        payload.publicContact = product.publicContact || currentUser.publicContact;
      }

      await setDoc(doc(db, "oneDollarListings", listingId), payload);

      await addDoc(collection(db, "notifications"), {
        userId: sellerUid,
        title: "One Dollar Listing Submitted",
        message: `"${product.name}" has been submitted at ${formatUsd(parsedUsd)} USD for Admin approval.`,
        type: "system",
        isRead: false,
        createdAt: now
      }).catch(() => {});

      setFeedback({
        type: "success",
        text: `"${product.name}" submitted at ${formatUsd(parsedUsd)} USD. An admin will review and approve it before it goes live.`
      });
    } catch (err: any) {
      setFeedback({ type: "error", text: err?.message || "Could not submit product to One Dollar." });
      handleFirestoreError(err, OperationType.CREATE, `oneDollarListings/odl_${product.id}`);
    } finally {
      setSubmittingId(null);
    }
  };

  const handleUpdateListingPriceAndResubmit = async (listing: OneDollarListing) => {
    if (isSuspended) return;
    const rawUsd = editUsdByListing[listing.id] ?? clampOneDollarUsd(listing.usdPrice).toFixed(2);
    const parsedUsd = parseValidUsdPrice(rawUsd);
    if (parsedUsd === null) {
      setFeedback({ type: "error", text: "Price must be between $0.01 and $1.00 USD." });
      return;
    }

    setTogglingId(listing.id);
    setFeedback(null);
    try {
      const now = new Date().toISOString();
      await updateDoc(doc(db, "oneDollarListings", listing.id), {
        usdPrice: parsedUsd,
        status: "pending_approval",
        isActive: false,
        updatedAt: now
      });
      setFeedback({
        type: "success",
        text: `Updated "${listing.productName}" to ${formatUsd(parsedUsd)} USD and submitted for Admin approval.`
      });
    } catch (err: any) {
      setFeedback({ type: "error", text: err?.message || "Could not update listing price." });
      handleFirestoreError(err, OperationType.UPDATE, `oneDollarListings/${listing.id}`);
    } finally {
      setTogglingId(null);
    }
  };

  const handleToggleActive = async (listing: OneDollarListing) => {
    if (isSuspended && !listing.isActive) return;
    setTogglingId(listing.id);
    setFeedback(null);
    try {
      const now = new Date().toISOString();
      if (listing.status === "approved") {
        const nextActive = !listing.isActive;
        await updateDoc(doc(db, "oneDollarListings", listing.id), {
          isActive: nextActive,
          updatedAt: now
        });
        setFeedback({
          type: "success",
          text: nextActive
            ? `"${listing.productName}" is now live in the One Dollar section.`
            : `"${listing.productName}" has been paused from public One Dollar view.`
        });
      } else if (listing.status === "deactivated" || listing.status === "rejected") {
        const rawUsd = editUsdByListing[listing.id] ?? clampOneDollarUsd(listing.usdPrice).toFixed(2);
        const parsedUsd = parseValidUsdPrice(rawUsd) ?? clampOneDollarUsd(listing.usdPrice);
        await updateDoc(doc(db, "oneDollarListings", listing.id), {
          usdPrice: parsedUsd,
          status: "pending_approval",
          isActive: false,
          updatedAt: now
        });
        setFeedback({
          type: "success",
          text: `"${listing.productName}" (${formatUsd(parsedUsd)} USD) was resubmitted for Admin approval.`
        });
      }
    } catch (err: any) {
      setFeedback({ type: "error", text: err?.message || "Could not update listing status." });
      handleFirestoreError(err, OperationType.UPDATE, `oneDollarListings/${listing.id}`);
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeactivate = async (listing: OneDollarListing) => {
    setTogglingId(listing.id);
    setFeedback(null);
    try {
      await updateDoc(doc(db, "oneDollarListings", listing.id), {
        status: "deactivated",
        isActive: false,
        updatedAt: new Date().toISOString()
      });
      setFeedback({ type: "success", text: `"${listing.productName}" has been deactivated.` });
    } catch (err: any) {
      setFeedback({ type: "error", text: err?.message || "Failed to deactivate listing." });
      handleFirestoreError(err, OperationType.UPDATE, `oneDollarListings/${listing.id}`);
    } finally {
      setTogglingId(null);
    }
  };

  const handleRemoveListing = async (listing: OneDollarListing) => {
    setRemovingId(listing.id);
    setFeedback(null);
    try {
      await deleteDoc(doc(db, "oneDollarListings", listing.id));
      setFeedback({
        type: "success",
        text: `"${listing.productName}" removed from One Dollar. Your regular store product remains untouched.`
      });
    } catch (err: any) {
      setFeedback({ type: "error", text: err?.message || "Could not remove listing." });
      handleFirestoreError(err, OperationType.DELETE, `oneDollarListings/${listing.id}`);
    } finally {
      setRemovingId(null);
    }
  };

  const newFormParsedUsd = parseValidUsdPrice(newUsdPrice);
  const newFormNgn = newFormParsedUsd !== null ? computeOneDollarNgn(newFormParsedUsd, rateInfo) : null;

  return (
    <div className="space-y-6 text-left">
      {/* Header Banner */}
      <div className="bg-white dark:bg-zinc-900 border border-orange-200/80 dark:border-zinc-800 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#ff6b00] text-white text-[10px] font-black uppercase tracking-widest">
              <DollarSign className="w-3 h-3" />
              One Dollar Vendor Program
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              List Products Priced at $1.00 USD &amp; Below
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 max-w-2xl leading-relaxed">
              Participation is voluntary. Pick any price between <strong>$0.01 and $1.00 USD</strong> for existing store products or add a new $1-and-below item directly. Approved listings convert to Naira daily using live FX rates.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-orange-50/70 dark:bg-orange-950/20 border border-orange-200/80 dark:border-orange-900/40 shrink-0 min-w-[230px] space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                Today&apos;s $1.00 Ceiling
              </span>
              <button
                type="button"
                onClick={refreshRate}
                disabled={rateLoading}
                className="text-[10px] font-bold text-[#ff6b00] hover:underline bg-transparent border-none p-0 cursor-pointer flex items-center gap-1"
              >
                <RefreshCw className={cn("w-3 h-3", rateLoading && "animate-spin")} />
                Refresh
              </button>
            </div>
            <p className="text-2xl font-black text-[#ff6b00] tabular-nums">
              ≤ {rateInfo ? formatNaira(rateInfo.oneDollarNgnPrice) : "—"}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-zinc-400">
              $0.01 – $1.00 USD range • 5% fee
            </p>
          </div>
        </div>

        {/* Policies strip */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-zinc-800 text-xs">
          <div className="flex items-start gap-2.5 text-slate-600 dark:text-zinc-300">
            <Truck className="w-4 h-4 text-[#ff6b00] shrink-0 mt-0.5" />
            <span>
              <strong>Vendor-Handled Delivery:</strong> Shopiversity does not assign registered logistics couriers for One Dollar orders. You arrange pickup or delivery directly with the buyer.
            </span>
          </div>
          <div className="flex items-start gap-2.5 text-slate-600 dark:text-zinc-300">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              <strong>Optional Buyer Escrow:</strong> Buyers can opt into Escrow Protected checkout (released upon receipt confirmation) or Standard Direct Payment.
            </span>
          </div>
        </div>
      </div>

      {/* Suspension Alert */}
      {isSuspended && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-xs text-red-800 dark:text-red-200 space-y-1">
            <p className="font-black uppercase tracking-wide">One Dollar Program Access Suspended</p>
            <p>{currentUser?.oneDollarSuspensionReason || "Your account has been restricted from submitting or activating One Dollar listings by an administrator."}</p>
          </div>
        </div>
      )}

      {feedback && (
        <div
          className={cn(
            "p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between gap-3",
            feedback.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-200"
              : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/50 text-red-800 dark:text-red-200"
          )}
        >
          <span>{feedback.text}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-[11px] font-bold underline bg-transparent border-none cursor-pointer text-current"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* One Dollar Sales & Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">My $1 &amp; Below Items</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1 tabular-nums">{listings.length}</p>
          <p className="text-[11px] text-emerald-600 font-semibold">
            {listings.filter((l) => l.status === "approved" && l.isActive).length} live now
          </p>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">One Dollar Orders</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1 tabular-nums">{oneDollarStats.totalOrders}</p>
          <p className="text-[11px] text-slate-500 font-semibold">{oneDollarStats.completedCount} completed</p>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Gross Sales</p>
          <p className="text-2xl font-black text-[#ff6b00] mt-1 tabular-nums">
            {formatNaira(oneDollarStats.grossSalesNgn)}
          </p>
          <p className="text-[11px] text-slate-500 font-semibold">Daily NGN settled total</p>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Net Earnings</p>
          <p className="text-2xl font-black text-emerald-600 mt-1 tabular-nums">
            {formatNaira(oneDollarStats.netEarningsNgn)}
          </p>
          <p className="text-[11px] text-slate-500 font-semibold">After 5% platform fee</p>
        </div>
      </div>

      {/* Add New Product Directly Within $0.01 - $1.00 USD */}
      <div className="bg-white dark:bg-zinc-900 border border-orange-200/80 dark:border-zinc-800 rounded-3xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-base font-black text-slate-900 dark:text-white">
              Add a New Product ($0.01 – $1.00 USD)
            </h4>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Create a product specifically priced within the $1.00 USD and below range and submit it for Admin approval.
            </p>
          </div>
          <button
            type="button"
            disabled={isSuspended}
            onClick={() => setShowCreateForm((v) => !v)}
            className="px-4 py-2.5 rounded-xl bg-[#ff6b00] hover:bg-[#e56000] text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 border-none cursor-pointer shrink-0 disabled:opacity-40"
          >
            <Plus className="w-4 h-4" />
            <span>{showCreateForm ? "Hide Form" : "Add New $1 & Below Product"}</span>
          </button>
        </div>

        {showCreateForm && (
          <form onSubmit={handleCreateAndSubmitNewProduct} className="pt-4 border-t border-slate-100 dark:border-zinc-800 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 dark:text-zinc-300">Product Name *</label>
                <input
                  type="text"
                  required
                  maxLength={200}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g., USB-C Adapter, Notebook Pack, Lip Balm"
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white outline-none focus:border-[#ff6b00]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 dark:text-zinc-300">
                  USD Price ($0.01 – $1.00) *
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max="1.00"
                      required
                      value={newUsdPrice}
                      onChange={(e) => setNewUsdPrice(e.target.value)}
                      className="w-full h-10 pl-7 pr-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-[#ff6b00] tabular-nums"
                    />
                  </div>
                  <div className="px-3 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200/80 dark:border-orange-900/40 flex items-center text-xs font-black text-[#ff6b00] tabular-nums shrink-0">
                    {newFormNgn !== null ? formatNaira(newFormNgn) : "Invalid ($0.01–$1.00)"}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {PRICE_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setNewUsdPrice(preset.toFixed(2))}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-[10px] font-bold border cursor-pointer tabular-nums",
                        Number(newUsdPrice) === preset
                          ? "bg-[#ff6b00] text-white border-[#ff6b00]"
                          : "bg-slate-50 dark:bg-zinc-950 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-800"
                      )}
                    >
                      ${preset.toFixed(2)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 dark:text-zinc-300">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white outline-none focus:border-[#ff6b00]"
                >
                  {ONE_DOLLAR_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-zinc-300">Condition</label>
                  <select
                    value={newCondition}
                    onChange={(e) => setNewCondition(e.target.value as "new" | "refurbished" | "used")}
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white outline-none focus:border-[#ff6b00]"
                  >
                    <option value="new">New</option>
                    <option value="refurbished">Refurbished</option>
                    <option value="used">Used</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-zinc-300">Stock Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-[#ff6b00] tabular-nums"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 dark:text-zinc-300">Description *</label>
              <textarea
                required
                rows={3}
                maxLength={5000}
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Describe size, brand, or pickup details clearly..."
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white outline-none focus:border-[#ff6b00]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 dark:text-zinc-300">Product Image (Optional)</label>
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-xs font-bold text-slate-700 dark:text-zinc-200 cursor-pointer hover:border-[#ff6b00]">
                    {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4 text-[#ff6b00]" />}
                    <span>{newImageUrl ? "Change Image" : "Upload Photo"}</span>
                    <input type="file" accept="image/*" onChange={handleImageFileChange} className="hidden" />
                  </label>
                  {newImageUrl && (
                    <img src={newImageUrl} alt="Preview" className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-zinc-800" />
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 dark:text-zinc-300">Vendor Delivery / Pickup Note</label>
                <input
                  type="text"
                  maxLength={300}
                  value={newDeliveryNote}
                  onChange={(e) => setNewDeliveryNote(e.target.value)}
                  placeholder="e.g., Campus gate pickup or doorstep drop-off arranged directly"
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white outline-none focus:border-[#ff6b00]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-bold text-slate-600 dark:text-zinc-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creatingProduct || newFormParsedUsd === null}
                className="px-5 py-2.5 rounded-xl bg-[#ff6b00] hover:bg-[#e56000] text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 border-none cursor-pointer disabled:opacity-40"
              >
                {creatingProduct ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                <span>Create &amp; Submit ({newFormParsedUsd !== null ? formatUsd(newFormParsedUsd) : "$1.00"})</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Existing One Dollar Submissions */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h4 className="text-base font-black text-slate-900 dark:text-white">
              My One Dollar Listings
            </h4>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Manage approvals, adjust USD pricing ($0.01 – $1.00), pause/reactivate, or remove items anytime.
            </p>
          </div>
        </div>

        {loadingListings ? (
          <div className="py-10 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#ff6b00]" />
          </div>
        ) : listings.length === 0 ? (
          <div className="py-10 text-center rounded-2xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-200/60 dark:border-zinc-800 space-y-1">
            <Package className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">No One Dollar listings yet</p>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Add a new product above or pick any eligible catalog item below at $0.01 – $1.00 USD.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {listings.map((item) => {
              const itemUsd = clampOneDollarUsd(item.usdPrice);
              const itemNgn = computeOneDollarNgn(itemUsd, rateInfo);
              const editVal = editUsdByListing[item.id] ?? itemUsd.toFixed(2);
              const editParsed = parseValidUsdPrice(editVal);
              const priceChanged = editParsed !== null && Math.abs(editParsed - itemUsd) >= 0.009;
              return (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shrink-0">
                      <img
                        src={item.imageUrl || item.imageUrls?.[0] || "/placeholder-product.png"}
                        alt={item.productName}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {item.productName}
                        </p>
                        <span className="px-2 py-0.5 rounded bg-orange-100 dark:bg-orange-950/50 text-[#ff6b00] text-[10px] font-black uppercase tabular-nums">
                          {formatUsd(itemUsd)} USD ({itemNgn ? formatNaira(itemNgn) : "Live rate"})
                        </span>
                        {item.status === "approved" && item.isActive && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold uppercase">
                            <CheckCircle className="w-3 h-3" /> Live
                          </span>
                        )}
                        {item.status === "approved" && !item.isActive && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 text-[10px] font-bold uppercase">
                            <EyeOff className="w-3 h-3" /> Paused
                          </span>
                        )}
                        {item.status === "pending_approval" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-[10px] font-bold uppercase">
                            <Clock className="w-3 h-3" /> Pending Approval
                          </span>
                        )}
                        {item.status === "rejected" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-[10px] font-bold uppercase">
                            <XCircle className="w-3 h-3" /> Rejected
                          </span>
                        )}
                        {item.status === "deactivated" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 text-[10px] font-bold uppercase">
                            Deactivated
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 tabular-nums">
                        Stock: {item.stock} • {item.category}
                      </p>
                      {item.status === "rejected" && item.rejectionReason && (
                        <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                          Admin reason: {item.rejectionReason}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {!isSuspended && (
                      <div className="flex items-center gap-1.5">
                        <div className="relative w-24">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[11px] font-black text-slate-400">$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            max="1.00"
                            value={editVal}
                            onChange={(e) => setEditUsdByListing((prev) => ({ ...prev, [item.id]: e.target.value }))}
                            className="w-full h-8 pl-5 pr-2 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-[#ff6b00] tabular-nums"
                            title="Edit USD price ($0.01 – $1.00)"
                          />
                        </div>
                        {priceChanged && (
                          <button
                            type="button"
                            disabled={togglingId === item.id || editParsed === null}
                            onClick={() => handleUpdateListingPriceAndResubmit(item)}
                            className="px-2.5 h-8 rounded-lg bg-slate-900 dark:bg-zinc-800 text-white text-[11px] font-bold border-none cursor-pointer disabled:opacity-40"
                          >
                            Save Price
                          </button>
                        )}
                      </div>
                    )}

                    {item.status === "approved" && (
                      <>
                        <button
                          type="button"
                          disabled={togglingId === item.id || (isSuspended && !item.isActive)}
                          onClick={() => handleToggleActive(item)}
                          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-bold text-slate-700 dark:text-zinc-200 hover:border-[#ff6b00] flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                        >
                          {item.isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                          <span>{item.isActive ? "Pause" : "Activate"}</span>
                        </button>
                        <button
                          type="button"
                          disabled={togglingId === item.id}
                          onClick={() => handleDeactivate(item)}
                          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-bold text-slate-600 dark:text-zinc-300 hover:border-amber-500 cursor-pointer disabled:opacity-40"
                        >
                          Deactivate
                        </button>
                      </>
                    )}
                    {(item.status === "deactivated" || item.status === "rejected") && !isSuspended && (
                      <button
                        type="button"
                        disabled={togglingId === item.id}
                        onClick={() => handleToggleActive(item)}
                        className="px-3 py-2 rounded-xl bg-[#ff6b00] hover:bg-[#e56000] text-white text-xs font-bold border-none cursor-pointer disabled:opacity-40"
                      >
                        Resubmit ({editParsed !== null ? formatUsd(editParsed) : formatUsd(itemUsd)})
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={removingId === item.id}
                      onClick={() => handleRemoveListing(item)}
                      className="px-3 py-2 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 text-xs font-bold border border-red-200/70 dark:border-red-900/40 flex items-center gap-1 cursor-pointer disabled:opacity-40"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Eligible Store Products to Submit */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-6 space-y-4">
        <div>
          <h4 className="text-base font-black text-slate-900 dark:text-white">
            Select Eligible Store Products ($0.01 – $1.00 USD)
          </h4>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Choose any USD selling price up to <strong>$1.00 USD</strong> ({rateInfo ? `≤ ${formatNaira(rateInfo.oneDollarNgnPrice)}` : "live rate"} today). Your regular catalog price remains unchanged.
          </p>
        </div>

        {eligibleProducts.length === 0 ? (
          <div className="py-8 text-center rounded-2xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-200/60 dark:border-zinc-800 space-y-1">
            <AlertTriangle className="w-7 h-7 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-700 dark:text-zinc-300">
              No additional active in-stock store goods available to submit.
            </p>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400">
              Use &ldquo;Add New $1 &amp; Below Product&rdquo; above or publish an active physical product with stock &gt; 0 first.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {eligibleProducts.map((p) => {
              const rawUsdStr = getDefaultUsdString(p);
              const parsedUsd = parseValidUsdPrice(rawUsdStr);
              const previewNgn = parsedUsd !== null ? computeOneDollarNgn(parsedUsd, rateInfo) : null;
              return (
                <div
                  key={p.id}
                  className="p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-950/40 flex flex-col gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shrink-0">
                      <img
                        src={p.imageUrl || p.imageUrls?.[0] || "/placeholder-product.png"}
                        alt={p.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{p.name}</p>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 tabular-nums">
                        Regular Store Price: ₦{Number(p.price || 0).toLocaleString()} • Stock: {p.stock}
                      </p>
                      <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-orange-50 dark:bg-orange-950/40 border border-orange-200/80 dark:border-orange-900/40 text-[11px] font-black text-[#ff6b00] tabular-nums">
                        <span>One Dollar Price:</span>
                        <span>
                          {parsedUsd !== null ? formatUsd(parsedUsd) : "Invalid ($0.01–$1.00)"}
                          {previewNgn ? ` (${formatNaira(previewNgn)})` : ""}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* USD Range Selector ($0.01 - $1.00) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-zinc-300">
                        Set USD Price ($0.01 – $1.00)
                      </label>
                      <div className="flex items-center gap-1">
                        {PRICE_PRESETS.map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() =>
                              setUsdInputsByProduct((prev) => ({ ...prev, [p.id]: preset.toFixed(2) }))
                            }
                            className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-bold border cursor-pointer tabular-nums",
                              Number(rawUsdStr) === preset
                                ? "bg-[#ff6b00] text-white border-[#ff6b00]"
                                : "bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-800"
                            )}
                          >
                            ${preset.toFixed(2)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max="1.00"
                        value={rawUsdStr}
                        onChange={(e) =>
                          setUsdInputsByProduct((prev) => ({ ...prev, [p.id]: e.target.value }))
                        }
                        placeholder="0.01 to 1.00"
                        className="w-full h-9 pl-7 pr-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-[#ff6b00] tabular-nums"
                      />
                    </div>
                  </div>

                  <input
                    type="text"
                    value={deliveryNotesByProduct[p.id] || ""}
                    onChange={(e) =>
                      setDeliveryNotesByProduct((prev) => ({ ...prev, [p.id]: e.target.value }))
                    }
                    placeholder="Optional pickup / vendor delivery arrangement note..."
                    className="w-full h-9 px-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white outline-none focus:border-[#ff6b00]"
                  />

                  <button
                    type="button"
                    disabled={submittingId === p.id || isSuspended || parsedUsd === null}
                    onClick={() => handleSubmitProduct(p)}
                    className="h-10 rounded-xl bg-[#ff6b00] hover:bg-[#e56000] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer border-none disabled:opacity-40"
                  >
                    {submittingId === p.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    <span>
                      Submit to One Dollar ({parsedUsd !== null ? formatUsd(parsedUsd) : "$1.00 max"})
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent One Dollar Orders */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h4 className="text-base font-black text-slate-900 dark:text-white">
              One Dollar Orders &amp; Sales ({oneDollarOrders.length})
            </h4>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Delivery for these orders is arranged directly by you (no registered campus courier assignment).
            </p>
          </div>
          {onOpenOrdersTab && oneDollarOrders.length > 0 && (
            <button
              type="button"
              onClick={onOpenOrdersTab}
              className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-zinc-800 text-white text-xs font-bold cursor-pointer border-none"
            >
              Manage in Orders
            </button>
          )}
        </div>

        {oneDollarOrders.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 dark:text-zinc-400">
            <ShoppingBag className="w-7 h-7 text-slate-300 mx-auto mb-1" />
            No One Dollar customer orders yet.
          </div>
        ) : (
          <div className="space-y-2.5">
            {oneDollarOrders.slice(0, 12).map((o) => (
              <div
                key={o.id}
                className="p-3.5 rounded-2xl border border-slate-200/70 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">{o.productName}</span>
                    <span className="px-2 py-0.5 rounded bg-orange-100 dark:bg-orange-950/40 text-[#ff6b00] text-[10px] font-black tabular-nums">
                      {formatUsd(o.usdPrice)} Order
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 text-[10px] font-bold">
                      {o.escrowSelected === false ? "Direct Payment" : "Escrow Protected"}
                    </span>
                  </div>
                  <p className="text-slate-500 dark:text-zinc-400">
                    Buyer: {o.buyerName} • Qty {o.quantity} • {formatNaira(o.totalPrice)}
                    {o.exchangeRateUsdToNgn ? ` (@ ₦${o.exchangeRateUsdToNgn.toLocaleString()}/$1)` : ""}
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 font-bold uppercase text-[10px] w-fit">
                  {o.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
