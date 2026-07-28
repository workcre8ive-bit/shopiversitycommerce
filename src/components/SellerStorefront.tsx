import React from "react";
import { db } from "../firebase";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc,
  orderBy
} from "firebase/firestore";
import { Product, UserProfile, StorefrontSettings } from "../types";
import { 
  Store, 
  Package, 
  ArrowLeft, 
  MessageCircle, 
  ShieldCheck,
  Star,
  Zap,
  Share2,
  Clock,
  MapPin,
  LayoutGrid
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { ProductCard } from "./ProductCard";

interface SellerStorefrontProps {
  sellerId: string;
  currentUser: UserProfile | null;
  previewSettings?: StorefrontSettings | null;
  onBack: () => void;
  onAddToCart: (product: Product, menuItem?: any) => void;
}

export default function SellerStorefront({ sellerId, currentUser, previewSettings, onBack, onAddToCart }: SellerStorefrontProps) {
  const [seller, setSeller] = React.useState<UserProfile | null>(null);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeType, setActiveType] = React.useState<"all" | "good" | "service" | "event">("all");
  const [activeCategory, setActiveCategory] = React.useState("All");

  React.useEffect(() => {
    if (!sellerId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    // Fetch seller profile
    const unsubscribeSeller = onSnapshot(doc(db, "users", sellerId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        setSeller(data);
      } else {
        setSeller(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching seller:", error);
      setLoading(false);
    });

    // Fetch seller products
    const q = query(
      collection(db, "products"),
      where("sellerId", "==", sellerId)
    );

    const unsubscribeProducts = onSnapshot(q, (snapshot) => {
      const prods = snapshot.docs
        .map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Product))
        .filter(p => !p.isDeleted)
        .sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
      setProducts(prods);
    }, (error) => {
      console.error("Error fetching products:", error);
    });

    return () => {
      unsubscribeSeller();
      unsubscribeProducts();
    };
  }, [sellerId]);

  const settings: StorefrontSettings = {
    theme: "minimal",
    primaryColor: "#ff6b00",
    bannerHeight: "medium",
    ...(seller?.storefrontSettings || {}),
    ...(previewSettings || {})
  };

  const colors = {
    primary: settings.primaryColor || "#ff6b00",
    light: `${settings.primaryColor || "#ff6b00"}15`,
    border: `${settings.primaryColor || "#ff6b00"}30`
  };

  const getThemeClasses = () => {
    let base = "";
    switch (settings.theme) {
      case "bold":
        base = "font-black italic tracking-tighter uppercase";
        break;
      case "technical":
        base = "font-mono font-bold tracking-tight";
        break;
      case "playful":
        base = "font-serif italic font-medium";
        break;
      default:
        base = "font-extrabold tracking-tight";
    }
    
    // Add custom font pairings if defined
    if (settings.customFont === "Space Grotesk") {
      base += " font-sans tracking-tight";
    } else if (settings.customFont === "JetBrains Mono") {
      base += " font-mono";
    } else if (settings.customFont === "Playfair Display") {
      base += " font-serif italic";
    } else if (settings.customFont === "Outfit") {
      base += " font-sans font-extrabold tracking-tight";
    }
    return base;
  };

  const availableCategories = React.useMemo(() => {
    const isSeller = currentUser && currentUser.uid === sellerId;
    const cats = Array.from(new Set(products
      .filter(p => {
        if (!isSeller && p.stock !== undefined && p.stock <= 0) return false;
        // Strictly exclude services, events, and logistics in storefront
        if (p.type === "service" || p.category === "Events & Lifestyle" || p.category === "Events" || p.category === "Logistics & Errands" || p.category === "Logistics") {
          return false;
        }
        return p.type === "good";
      })
      .map(p => p.category)
      .filter(Boolean)
    )).filter(c => c !== "All");
    return ["All", ...cats];
  }, [products, currentUser, sellerId]);

  const filteredItems = React.useMemo(() => {
    const isSeller = currentUser && currentUser.uid === sellerId;
    return products.filter(p => {
      if (!isSeller && p.stock !== undefined && p.stock <= 0) return false;
      // Strictly exclude services, events, and logistics in storefront
      if (p.type === "service" || p.category === "Events & Lifestyle" || p.category === "Events" || p.category === "Logistics & Errands" || p.category === "Logistics") {
        return false;
      }
      if (p.type !== "good") return false;
      const categoryMatch = activeCategory === "All" || p.category === activeCategory;
      return categoryMatch;
    });
  }, [products, activeCategory, currentUser, sellerId]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-purple-600 rounded-full animate-spin" style={{ borderTopColor: colors.primary }} />
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800">
        <Store className="w-16 h-16 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
        <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">Seller Not Found</h2>
        <p className="text-sm text-slate-500 mb-6">The student store you are looking for does not exist or has been removed.</p>
        <button 
          onClick={onBack} 
          className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest cursor-pointer border-none"
        >
          Return to Marketplace
        </button>
      </div>
    );
  }

  if (seller.state === "Logistics Partner") {
    return (
      <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800">
        <Store className="w-16 h-16 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
        <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">No Storefront Allowed</h2>
        <p className="text-sm text-slate-500 mb-6">Logistics partners operate logistics hubs directly and do not have storefront catalogs.</p>
        <button 
          onClick={onBack} 
          className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest cursor-pointer border-none"
        >
          Return to Marketplace
        </button>
      </div>
    );
  }

  // Define layout blocks (Modular Block order)
  const layoutBlocks = settings.layoutBlocks || [
    { id: "banner", name: "Landscape Hero Banner", visible: true },
    { id: "header", name: "Store Header & Actions", visible: true },
    { id: "about", name: "About & Info Section", visible: true },
    { id: "badges", name: "Escrow & Trust Card", visible: true },
    { id: "products", name: "Store Product Catalog", visible: true }
  ];

  // Specific Block Renderers
  const renderBannerBlock = () => (
    <div key="banner-block" className="relative">
      <div 
        className={cn(
          "w-full rounded-[3.2rem] overflow-hidden relative shadow-2xl transition-all duration-700",
          settings.bannerHeight === "small" ? "h-48" : settings.bannerHeight === "large" ? "h-96" : "h-64"
        )}
        style={{ backgroundColor: colors.primary }}
      >
        {settings.bannerUrl ? (
          <img src={settings.bannerUrl} alt="Store Banner" className="w-full h-full object-cover opacity-80 animate-in fade-in duration-500" />
        ) : (
          <div className="w-full h-full bg-brand-gradient opacity-30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      </div>
    </div>
  );

  const renderHeaderBlock = () => (
    <div key="header-block" className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 sm:p-8 border border-slate-100 dark:border-slate-800/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div className="flex items-center gap-6">
        <div className="w-20 h-20 rounded-3xl bg-white dark:bg-slate-850 p-1 shadow-md relative shrink-0 border border-slate-100 dark:border-slate-800">
          <img 
            src={seller.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(seller.displayName)}&background=random`} 
            alt={seller.displayName} 
            className="w-full h-full object-cover rounded-[1.25rem]"
          />
          {seller.isVerified && (
            <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center text-white border-2 border-white dark:border-slate-900" style={{ backgroundColor: colors.primary }}>
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          )}
        </div>
        <div>
          <h2 className={cn("text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white", getThemeClasses())} style={{ color: colors.primary }}>
            {settings.businessName || seller.displayName}
          </h2>
          {(settings.businessBio || seller.description) && (
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1 max-w-xl italic">
              {settings.businessBio || seller.description}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
            <div className="flex items-center gap-1 text-amber-500">
              <Star className="w-4 h-4 fill-current" />
              <span className="text-xs sm:text-sm font-black">4.9</span>
            </div>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{products.length} Items</div>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <div className="flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5 text-orange-500 animate-bounce" />
              Explorer Choice
            </div>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{seller.campus || "CAMPUS STORE"}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {currentUser && currentUser.uid !== sellerId && (
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('open-chat', { detail: sellerId }))}
            className="px-6 py-3 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-md flex items-center gap-2 border-none cursor-pointer"
            style={{ backgroundColor: colors.primary }}
          >
            <MessageCircle className="w-4 h-4" />
            Chat with Seller
          </button>
        )}
      </div>
    </div>
  );

  const renderAboutBlock = () => (
    <div key="about-block" className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 sm:p-8 border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
      <h3 className={cn("text-xl font-bold text-slate-900 dark:text-white", getThemeClasses())} style={{ color: colors.primary }}>About the Seller</h3>
      <p className="text-sm sm:text-base font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
        {settings.businessBio || seller.description || "Welcome to my official campus storefront! I offer high-quality products and services tailored for the student community. Fast delivery and reliable quality guaranteed."}
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-50 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: colors.light, color: colors.primary }}>
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Base Location</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{seller.location || seller.campus || "On Campus"}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: colors.light, color: colors.primary }}>
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Typical Payouts</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">Active Since {new Date(seller.createdAt).getFullYear()}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBadgesBlock = () => (
    <div key="badges-block" className="bg-slate-950 dark:bg-zinc-900 rounded-[2.5rem] p-6 sm:p-8 text-white space-y-4 relative overflow-hidden group border border-slate-900 dark:border-zinc-800 shadow-lg">
      <div className="relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
          <ShieldCheck className="w-3.5 h-3.5 text-orange-400" />
          Escrow Protected
        </div>
        <h3 className="text-xl sm:text-2xl font-black italic tracking-tighter leading-none mb-3">Safest Campus Trading</h3>
        <p className="text-xs sm:text-sm text-slate-400 font-medium leading-relaxed max-w-2xl">All payments to this seller are held in escrow until you confirm delivery. Trade with absolute peace of mind.</p>
      </div>
      <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-orange-500/20 transition-all duration-1000" />
    </div>
  );

  const renderProductsBlock = () => (
    <div key="products-block" className="space-y-8">
      {/* Listing Tabs & Category Filter */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 space-y-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h4 className={cn("text-lg font-bold text-slate-900 dark:text-white", getThemeClasses())} style={{ color: colors.primary }}>Store Directory</h4>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sellers Goods & Products</p>
          </div>
        </div>

        {availableCategories.length > 2 && (
          <div className="space-y-3 pt-4 border-t border-slate-50 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-1 h-3.5 bg-orange-600 rounded-full" style={{ backgroundColor: colors.primary }} />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Categories</span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none no-scrollbar">
              {availableCategories.map((cat, cIdx) => (
                <button
                  key={`sf-cat-${cat}-${cIdx}`}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-2 cursor-pointer",
                    activeCategory === cat
                      ? "text-white shadow-md"
                      : "bg-transparent text-slate-500 dark:text-slate-400 border-slate-105 dark:border-slate-800 hover:border-slate-200"
                  )}
                  style={activeCategory === cat ? { backgroundColor: colors.primary, borderColor: colors.primary } : {}}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
        <AnimatePresence mode="popLayout">
          {filteredItems.length === 0 ? (
            <motion.div 
              key="empty-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full py-20 text-center bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 w-full"
            >
              <Package className="w-16 h-16 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">No items found</h3>
              <p className="text-sm text-slate-500">Check back later or browse other categories.</p>
            </motion.div>
          ) : (
            filteredItems.map((product, pIdx) => (
              <motion.div
                key={`sf-product-${product.id || pIdx}-${pIdx}`}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <ProductCard 
                  product={product} 
                  onAddToCart={onAddToCart}
                  isOwner={currentUser?.uid === product.sellerId}
                  currentUser={currentUser}
                  customColor={colors.primary}
                />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-32" style={{ 
      //@ts-ignore
      "--primary-color": colors.primary,
      "--primary-light": colors.light,
      "--primary-border": colors.border
    }}>
      {/* Back Header */}
      <div className="flex items-center gap-4 mb-4">
        <button 
          onClick={onBack}
          className="p-3 bg-white dark:bg-slate-900 rounded-2xl border shadow-sm hover:scale-105 transition-all text-slate-600 dark:text-slate-400 cursor-pointer"
          style={{ borderColor: colors.border, color: colors.primary }}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 text-left">
          <h1 className={cn("text-2xl font-black italic tracking-tighter text-slate-900 dark:text-white", getThemeClasses())} style={{ color: colors.primary }}>{settings.businessName || `${seller.displayName}'s Store`}</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{seller.campus || "CAMPUS STORE"}</p>
        </div>
        <button 
          onClick={() => {
            const shareUrl = `${window.location.origin}${window.location.pathname}?seller=${sellerId}`;
            if (navigator.share) {
              navigator.share({
                title: `${settings.businessName || seller.displayName}'s Store on SHOPIVERSITY`,
                url: shareUrl
              }).catch(() => {});
            } else {
              navigator.clipboard.writeText(shareUrl);
              alert("Store link copied!");
            }
          }}
          className="p-3 bg-white dark:bg-slate-900 rounded-2xl border shadow-sm hover:scale-105 transition-all text-slate-600 dark:text-slate-400 cursor-pointer"
          style={{ borderColor: colors.border, color: colors.primary }}
        >
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      {/* Render layout blocks in their custom drag-and-dropped order */}
      <div className="space-y-8">
        {layoutBlocks.map((block: any, idx: number) => {
          if (!block.visible) return null;
          let content = null;
          switch (block.id) {
            case "banner":
              content = renderBannerBlock();
              break;
            case "header":
              content = renderHeaderBlock();
              break;
            case "about":
              content = renderAboutBlock();
              break;
            case "badges":
              content = renderBadgesBlock();
              break;
            case "products":
              content = renderProductsBlock();
              break;
            default:
              content = null;
          }
          if (!content) return null;
          return <React.Fragment key={`sf-block-${block.id}-${idx}`}>{content}</React.Fragment>;
        })}
      </div>
    </div>
  );
}
