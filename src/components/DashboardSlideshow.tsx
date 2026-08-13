import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  ArrowRight, 
  ShoppingBag, 
  Truck, 
  Laptop, 
  Shirt, 
  BookOpen,
  ShieldCheck,
  Store,
  Wallet,
  BarChart3,
  PackageCheck
} from "lucide-react";

export interface SlideItem {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  tagIcon: React.ElementType;
  image: string;
  ctaText?: string;
  ctaAction?: () => void;
  accentColor: string;
}

export const BUYER_SLIDES: SlideItem[] = [
  {
    id: "buyer-market",
    title: "Discover Campus Deals & Thrift",
    subtitle: "Browse thousands of verified student listings for textbooks, gadgets, hostel gear, and fashion at student-friendly prices.",
    tag: "Campus Marketplace",
    tagIcon: ShoppingBag,
    image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1920&q=80",
    ctaText: "Shop Campus Market",
    accentColor: "from-purple-950/80 via-indigo-950/60 to-slate-950/85",
  },
  {
    id: "buyer-tech",
    title: "Student Gadgets & Electronics Hub",
    subtitle: "Upgrade your study setup with budget-friendly laptops, smartphones, chargers, and audio gear directly from students.",
    tag: "Tech & Gadgets",
    tagIcon: Laptop,
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1920&q=80",
    ctaText: "Shop Electronics",
    accentColor: "from-blue-950/80 via-cyan-950/60 to-slate-950/85",
  },
  {
    id: "buyer-escrow",
    title: "100% Protected Buyer Escrow",
    subtitle: "Your funds are securely held in escrow until you receive and confirm your package from the seller or dispatch rider.",
    tag: "Buyer Protection",
    tagIcon: ShieldCheck,
    image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=1920&q=80",
    ctaText: "View My Orders",
    accentColor: "from-emerald-950/80 via-teal-950/60 to-slate-950/85",
  },
  {
    id: "buyer-dispatch",
    title: "Fast Door-to-Door Campus Dispatch",
    subtitle: "Get your items delivered directly to your hostel block or lecture hall safely by verified campus riders.",
    tag: "Campus Logistics",
    tagIcon: Truck,
    image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1920&q=80",
    ctaText: "Track Deliveries",
    accentColor: "from-orange-950/80 via-amber-950/60 to-slate-950/85",
  }
];

export const SELLER_SLIDES: SlideItem[] = [
  {
    id: "seller-growth",
    title: "Grow Your Campus Business",
    subtitle: "List your items in seconds and connect with thousands of active student buyers across Nigerian university campuses.",
    tag: "Seller Growth",
    tagIcon: Store,
    image: "https://images.unsplash.com/photo-1556742049-0a670f4a4591?auto=format&fit=crop&w=1920&q=80",
    ctaText: "Add New Product",
    accentColor: "from-purple-950/80 via-indigo-950/60 to-slate-950/85",
  },
  {
    id: "seller-payouts",
    title: "Automated Bank Payouts",
    subtitle: "Your earnings are automatically deposited directly to your bank account with reliable 48-hour escrow protection.",
    tag: "Payouts & Escrow",
    tagIcon: Wallet,
    image: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1920&q=80",
    ctaText: "Check Earnings",
    accentColor: "from-emerald-950/80 via-teal-950/60 to-slate-950/85",
  },
  {
    id: "seller-analytics",
    title: "Track Orders & Store Insights",
    subtitle: "Monitor active customer orders, sales revenue, store views, and manage product inventory seamlessly.",
    tag: "Store Performance",
    tagIcon: BarChart3,
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1920&q=80",
    ctaText: "View Sales & Orders",
    accentColor: "from-blue-950/80 via-indigo-950/60 to-slate-950/85",
  },
  {
    id: "seller-couriers",
    title: "Partner with Verified Logistics",
    subtitle: "Easily assign verified campus dispatch companies to pick up and deliver your customer packages promptly.",
    tag: "Campus Couriers",
    tagIcon: Truck,
    image: "https://images.unsplash.com/photo-1616401784845-180882ba9ba8?auto=format&fit=crop&w=1920&q=80",
    ctaText: "Manage Store Inventory",
    accentColor: "from-orange-950/80 via-amber-950/60 to-slate-950/85",
  }
];

export const LOGISTICS_SLIDES: SlideItem[] = [
  {
    id: "logistics-jobs",
    title: "Logistics Partner Network",
    subtitle: "Accept delivery requests, assign riders, and provide swift hostel-to-hostel deliveries across university campuses.",
    tag: "Courier Network",
    tagIcon: Truck,
    image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1920&q=80",
    ctaText: "View Available Jobs",
    accentColor: "from-orange-950/80 via-amber-950/60 to-slate-950/85",
  },
  {
    id: "logistics-active",
    title: "Live Dispatch Tracking",
    subtitle: "Update order pickup status, manage transit milestones, and ensure prompt deliveries for campus buyers and sellers.",
    tag: "Dispatch Control",
    tagIcon: PackageCheck,
    image: "https://images.unsplash.com/photo-1616401784845-180882ba9ba8?auto=format&fit=crop&w=1920&q=80",
    ctaText: "View Active Deliveries",
    accentColor: "from-blue-950/80 via-cyan-950/60 to-slate-950/85",
  },
  {
    id: "logistics-earnings",
    title: "Direct Delivery Settlements",
    subtitle: "Earn competitive delivery fees with transparent payout tracking directly to your registered company bank account.",
    tag: "Partner Earnings",
    tagIcon: Wallet,
    image: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1920&q=80",
    ctaText: "View Delivery History",
    accentColor: "from-emerald-950/80 via-teal-950/60 to-slate-950/85",
  },
  {
    id: "logistics-profile",
    title: "Manage Fleet & Coverage",
    subtitle: "Set up base delivery rates, vehicle types (bikes, vans, cars), and covered university campuses for your dispatch firm.",
    tag: "Company Profile",
    tagIcon: ShieldCheck,
    image: "https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?auto=format&fit=crop&w=1920&q=80",
    ctaText: "Update Partner Profile",
    accentColor: "from-purple-950/80 via-indigo-950/60 to-slate-950/85",
  }
];

interface DashboardSlideshowProps {
  slides?: SlideItem[];
  role?: "buyer" | "seller" | "logistics";
  autoPlayInterval?: number;
  onCtaClick?: (slideId: string) => void;
  className?: string;
}

export default function DashboardSlideshow({
  slides,
  role = "buyer",
  autoPlayInterval = 5000,
  onCtaClick,
  className = ""
}: DashboardSlideshowProps) {
  const activeSlides = React.useMemo(() => {
    if (slides && slides.length > 0) return slides;
    if (role === "seller") return SELLER_SLIDES;
    if (role === "logistics") return LOGISTICS_SLIDES;
    return BUYER_SLIDES;
  }, [slides, role]);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isPlaying, setIsPlaying] = React.useState(true);
  const [direction, setDirection] = React.useState<"left" | "right">("right");

  const handleNext = React.useCallback(() => {
    setDirection("right");
    setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
  }, [activeSlides.length]);

  const handlePrev = React.useCallback(() => {
    setDirection("left");
    setCurrentIndex((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);
  }, [activeSlides.length]);

  React.useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      handleNext();
    }, autoPlayInterval);

    return () => clearInterval(timer);
  }, [isPlaying, autoPlayInterval, handleNext]);

  const currentSlide = activeSlides[currentIndex] || activeSlides[0];
  const TagIcon = currentSlide.tagIcon || Sparkles;

  return (
    <div 
      className={`relative w-full rounded-[2.5rem] overflow-hidden shadow-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-900 text-white min-h-[260px] sm:min-h-[300px] md:min-h-[320px] flex flex-col justify-between p-6 sm:p-8 select-none ${className}`}
      onMouseEnter={() => setIsPlaying(false)}
      onMouseLeave={() => setIsPlaying(true)}
    >
      {/* Background Image & Cross-fade animation */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={currentSlide.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
          className="absolute inset-0 z-0"
        >
          <img 
            src={currentSlide.image} 
            alt={currentSlide.title} 
            className="w-full h-full object-cover object-center"
            referrerPolicy="no-referrer"
          />
          {/* Multi-layered gradient overlay for rich contrast and aesthetic typography readability */}
          <div className={`absolute inset-0 bg-gradient-to-r ${currentSlide.accentColor}`} />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Top Header Tag */}
      <div className="relative z-10 flex items-center justify-between gap-4">
        <motion.div 
          key={`tag-${currentSlide.id}`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-black uppercase tracking-wider text-white shadow-sm"
        >
          <TagIcon className="w-3.5 h-3.5 text-orange-300" />
          <span>{currentSlide.tag}</span>
        </motion.div>
      </div>

      {/* Middle Content Section */}
      <div className="relative z-10 max-w-2xl space-y-3 my-auto pt-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={`content-${currentSlide.id}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="space-y-2"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-tight drop-shadow-md">
              {currentSlide.title}
            </h2>
            <p className="text-sm sm:text-base text-slate-200 font-medium leading-relaxed drop-shadow-sm max-w-xl">
              {currentSlide.subtitle}
            </p>

            {currentSlide.ctaText && (
              <div className="pt-2">
                <button
                  onClick={() => {
                    if (currentSlide.ctaAction) {
                      currentSlide.ctaAction();
                    } else if (onCtaClick) {
                      onCtaClick(currentSlide.id);
                    }
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-900 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-wider shadow-lg shadow-black/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                >
                  <span>{currentSlide.ctaText}</span>
                  <ArrowRight className="w-4 h-4 text-orange-600" />
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Indicator Dots */}
      <div className="relative z-10 flex items-center justify-between pt-4 border-t border-white/10">
        <div className="flex items-center gap-2">
          {activeSlides.map((slide, idx) => (
            <button
              key={slide.id}
              onClick={() => {
                setDirection(idx > currentIndex ? "right" : "left");
                setCurrentIndex(idx);
              }}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                idx === currentIndex 
                  ? "w-8 bg-orange-400" 
                  : "w-2 bg-white/30 hover:bg-white/60"
              }`}
              title={`Go to slide ${idx + 1}: ${slide.title}`}
            />
          ))}
        </div>

        <span className="text-[11px] font-bold tracking-widest text-white/60 uppercase">
          {currentIndex + 1} / {activeSlides.length}
        </span>
      </div>
    </div>
  );
}
