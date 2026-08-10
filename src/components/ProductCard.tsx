import React from "react";
import { Product } from "../types";
import { ShoppingCart, Tag, User as UserIcon, Package, AlertTriangle, Truck, MapPin, Star, Layout, Zap, Globe, Store, MessageSquare, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../lib/utils";
import ReportModal from "./ReportModal";
import ProductDetail from "./ProductDetail";
import { db } from "../firebase";
import { collection, query, where, onSnapshot, deleteDoc, doc, getDocs } from "firebase/firestore";
import { Review, UserProfile } from "../types";

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, menuItem?: any) => void;
  isOwner: boolean;
  currentUser: UserProfile | null;
  customColor?: string;
  sellersMap?: Record<string, UserProfile>;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart, isOwner, currentUser, customColor, sellersMap }) => {
  if (product.type === "service") {
    return null;
  }

  const [isReportModalOpen, setIsReportModalOpen] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);

  // Render a special modern boutique-style product mockup card
  const [activeImgIdx, setActiveImgIdx] = React.useState(0);
  const images = product.imageUrls && product.imageUrls.length > 0 
    ? product.imageUrls 
    : [product.imageUrl || "/placeholder-product.png"];

  // Look up seller's custom storefront primary color if not explicitly provided
  const sellerProfile = sellersMap?.[product.sellerId];
  const brandColor = customColor || sellerProfile?.storefrontSettings?.primaryColor || (product as any).sellerPrimaryColor || "#ff6b00";

  const discountPct = product.discountPercent && product.discountPercent > 0
    ? product.discountPercent
    : (product.priceBefore && product.priceBefore > product.price
        ? Math.round(((product.priceBefore - product.price) / product.priceBefore) * 100)
        : 0);

  return (
    <>
        {/* Premium Modern Boutique Product Card with beautifully bent horizontal S-curve split */}
        <motion.div 
          onClick={() => window.dispatchEvent(new CustomEvent('view-product-detail', { detail: product }))}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          whileHover={{ y: -6, transition: { duration: 0.2 } }}
          className="group relative flex flex-col bg-white dark:bg-zinc-900 rounded-[2.5rem] overflow-hidden h-full shadow-md hover:shadow-2xl transition-all duration-300 border p-4 select-none cursor-pointer"
          style={{
            borderColor: isHovered ? brandColor : "rgba(0, 0, 0, 0.08)",
          }}
        >
          {/* Content Wrapper (Ensures text/elements sit on top) */}
          <div className="relative z-10 flex flex-col h-full">
            {/* Product image container */}
            <div className="aspect-square w-full overflow-hidden bg-slate-50 dark:bg-zinc-850/50 rounded-2xl relative flex items-center justify-center mb-3 sm:mb-4">
              <img
                src={images[activeImgIdx] || "/placeholder-product.png"}
                alt={product.name}
                className="w-11/12 h-11/12 object-contain transition-transform duration-300 group-hover:scale-110 drop-shadow-md"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://placehold.co/400x400/f8fafc/64748b?text=" + encodeURIComponent(product.name);
                }}
                referrerPolicy="no-referrer"
              />

              {/* Floating Category Badge (top left) with seller's custom color theme */}
              <div 
                className="absolute top-3 left-3 bg-white/95 dark:bg-zinc-900/95 px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider shadow-sm z-10 transition-colors border"
                style={{
                  color: brandColor,
                  borderColor: `${brandColor}35`
                }}
              >
                {product.category}
              </div>

              {/* Stock Status Badge (bottom left) */}
              {product.stock === 0 ? (
                <div className="absolute bottom-3 left-3 bg-red-600 text-white px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider shadow-sm z-10">
                  Out of Stock
                </div>
              ) : product.stock < 5 ? (
                <div className="absolute bottom-3 left-3 bg-amber-500 text-white px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider shadow-sm z-10">
                  Low Stock
                </div>
              ) : null}
              
              <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5 z-10">
                {discountPct > 0 && (
                  <div className="bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 text-white px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg shadow-red-500/30 border border-white/20 flex items-center gap-1 animate-pulse">
                    <Tag className="w-3 h-3" />
                    <span>-{discountPct}% OFF</span>
                  </div>
                )}
              </div>
            </div>

            {/* Product info details */}
            <div className="flex flex-col flex-grow">
              {/* Title */}
              <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100 line-clamp-2 leading-snug mb-2 font-sans">
                {product.category === "Food & Drinks" ? product.businessName : product.name}
              </h3>

              {/* Condition Tag styled dynamically using seller's custom storefront primary color */}
              <div className="mb-4 flex items-center justify-between gap-1 flex-wrap">
                <span 
                  className="text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider border"
                  style={{
                    color: brandColor,
                    backgroundColor: `${brandColor}15`,
                    borderColor: `${brandColor}30`
                  }}
                >
                  {product.condition}
                </span>
                {discountPct > 0 && (
                  <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/40">
                    -{discountPct}% SAVINGS
                  </span>
                )}
              </div>

              {/* Pricing and Action bottom block */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mt-auto pt-3 border-t border-slate-100 dark:border-zinc-800">
                <div className="flex flex-col">
                  <div className="flex items-baseline font-bold font-sans flex-wrap gap-1.5">
                    <div className="flex items-start text-slate-900 dark:text-white">
                      <span className="text-xs mt-0.5 mr-0.5 font-black text-slate-800 dark:text-zinc-200">
                        ₦
                      </span>
                      <span className="text-base sm:text-lg tracking-tight leading-none font-black">
                        {Math.floor(product.price).toLocaleString()}
                      </span>
                      <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
                        .00
                      </span>
                    </div>
                    {product.priceBefore && product.priceBefore > product.price ? (
                      <span className="text-xs line-through font-bold text-slate-400 dark:text-zinc-400 decoration-red-500 decoration-2">
                        ₦{Math.floor(product.priceBefore).toLocaleString()}
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Quick action button inside the card bottom-right styled with seller's storefront primary color */}
                {!isOwner ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (product.category === "Food & Drinks" && product.menuItems && product.menuItems.length > 0) {
                        window.dispatchEvent(new CustomEvent('view-product-detail', { detail: product }));
                      } else {
                        onAddToCart(product);
                      }
                    }}
                    disabled={product.stock === 0}
                    className="h-[36px] w-full sm:w-auto px-3.5 rounded-xl flex items-center justify-center font-bold text-xs gap-1.5 transition-all duration-300 shadow-sm hover:scale-105 active:scale-95 cursor-pointer border-none text-white shrink-0"
                    style={{
                      backgroundColor: brandColor,
                    }}
                    title={
                      product.category === "Food & Drinks" && product.menuItems && product.menuItems.length > 0 ? "Explore options" : "Add to cart"
                    }
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>
                      {product.category === "Food & Drinks" && product.menuItems && product.menuItems.length > 0 ? "Explore" : "Add"}
                    </span>
                  </button>
                ) : (
                  <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 self-start sm:self-auto shrink-0">
                    My Item
                  </span>
                )}
              </div>

              {/* Seller and actions footer capsules */}
              <div className="flex items-center justify-between text-[10px] pt-3 mt-3 border-t border-slate-100 dark:border-zinc-800">
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (product.sellerId && product.category !== "Logistics & Errands" && product.category !== "Logistics") {
                      window.dispatchEvent(new CustomEvent('view-seller-store', { detail: product.sellerId }));
                    }
                  }}
                  className={cn(
                    "flex items-center gap-1.5 min-w-0 text-slate-700 dark:text-zinc-300 transition-colors",
                    (product.category !== "Logistics & Errands" && product.category !== "Logistics") ? "cursor-pointer group/seller" : "cursor-default"
                  )}
                  title={(product.category !== "Logistics & Errands" && product.category !== "Logistics") ? `View ${product.sellerName}'s store` : undefined}
                >
                  <div 
                    className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-colors"
                    style={{
                      backgroundColor: `${brandColor}15`,
                      color: brandColor
                    }}
                  >
                    <UserIcon className="w-2.5 h-2.5" style={{ color: brandColor }} />
                  </div>
                  <span 
                    className="truncate max-w-[75px] font-bold transition-colors"
                    style={{
                      color: isHovered ? brandColor : undefined
                    }}
                  >
                    {product.sellerName}
                  </span>
                </div>

                {/* Quick link action capsules */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {currentUser && currentUser.uid !== product.sellerId && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        window.dispatchEvent(new CustomEvent('open-chat', { detail: product.sellerId }));
                      }}
                      className="text-[9px] font-black px-2 py-0.5 rounded-full border border-slate-200 dark:border-zinc-700 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-slate-700 dark:text-zinc-300 transition-colors duration-300 cursor-pointer"
                      title="Message Seller"
                    >
                      CHAT
                    </button>
                  )}
                  {product.sellerId && product.category !== "Logistics & Errands" && product.category !== "Logistics" && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        window.dispatchEvent(new CustomEvent('view-seller-store', { detail: product.sellerId }));
                      }}
                      className="text-[9px] font-black px-2 py-0.5 rounded-full border transition-colors duration-300 cursor-pointer"
                      style={{
                        color: brandColor,
                        borderColor: `${brandColor}35`,
                        backgroundColor: `${brandColor}10`
                      }}
                    >
                      STORE
                    </button>
                  )}
                  {!isOwner && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsReportModalOpen(true);
                      }}
                      className="p-1 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                      title="Report Product or Seller"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

      <ReportModal 
        isOpen={isReportModalOpen} 
        onClose={() => setIsReportModalOpen(false)} 
        vendorId={product.sellerId} 
        vendorName={product.sellerName} 
        productId={product.id}
      />
    </>
  );
}

export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="relative flex flex-col bg-white dark:bg-zinc-900/70 rounded-2xl overflow-hidden h-full shadow-sm border border-slate-200/90 dark:border-zinc-805 p-3.5 select-none animate-pulse">
      {/* Product image container skeleton */}
      <div className="aspect-[1.1] w-full bg-slate-100/80 dark:bg-zinc-950/40 rounded-xl relative flex items-center justify-center p-4 mb-3 border border-slate-100 dark:border-zinc-900/30">
        {/* Floating Category Badge Shimmer */}
        <div className="absolute top-2.5 left-2.5 w-14 h-4 bg-slate-200 dark:bg-zinc-800 rounded shadow-sm" />
        
        {/* Save button Shimmer */}
        <div className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-slate-200 dark:bg-zinc-800 shadow-sm" />

        {/* Center icon outline for context */}
        <Package className="w-10 h-10 text-slate-200 dark:text-zinc-850" />
      </div>

      {/* Product info details skeleton */}
      <div className="flex flex-col flex-grow px-1.5">
        {/* Title Shimmer lines */}
        <div className="h-3 w-5/6 bg-slate-200 dark:bg-zinc-800 rounded-md mb-2" />
        <div className="h-3 w-4/6 bg-slate-200 dark:bg-zinc-800 rounded-md mb-3" />

        {/* Condition Tag Shimmer */}
        <div className="mb-4">
          <div className="w-12 h-4 bg-orange-50/70 dark:bg-orange-950/10 rounded" />
        </div>

        {/* Pricing and Action bottom block Shimmer */}
        <div className="flex items-end justify-between mt-auto pt-1">
          <div className="flex flex-col gap-1.5">
            <div className="h-2 w-6 bg-slate-150 dark:bg-zinc-800 rounded" />
            <div className="flex items-center gap-1">
              <div className="h-3 w-2 bg-slate-200 dark:bg-zinc-800 rounded" />
              <div className="h-5 w-16 bg-slate-200 dark:bg-zinc-800 rounded" />
            </div>
          </div>

          {/* Quick action button Shimmer */}
          <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-zinc-800" />
        </div>

        {/* Seller and location footer Shimmer */}
        <div className="flex items-center justify-between pt-2.5 mt-3.5 border-t border-slate-150/55 dark:border-zinc-800/40">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded-full bg-slate-150 dark:bg-zinc-800" />
            <div className="h-2 w-12 bg-slate-150 dark:bg-zinc-800 rounded" />
          </div>

          <div className="flex items-center gap-3">
            <div className="h-2.5 w-6 bg-slate-150 dark:bg-zinc-800 rounded" />
            <div className="h-2.5 w-8 bg-slate-150 dark:bg-zinc-800 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
