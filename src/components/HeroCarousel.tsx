import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  ShoppingBag, 
  ChevronLeft, 
  ChevronRight, 
  TrendingUp, 
  Eye, 
  GraduationCap, 
  ShieldCheck, 
  DollarSign, 
  Truck, 
  RefreshCw,
  Lock,
  Search,
  CheckCircle,
  HelpCircle,
  Clock
} from "lucide-react";
import { cn } from "../lib/utils";

const slides = [
  {
    id: 1,
    badge: "Studentpreneur Insights",
    prefix: "Did you know? According to research, ",
    highlight: "45% of student entrepreneurs",
    suffix: " think they have a bad product...",
    subtext: "Severe self-doubt and fear of poor quality block young founders before they even show their work to peers.",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1600&auto=format&fit=crop",
    icon: TrendingUp,
    featureName: "The Research",
    featureDesc: "45% doubt their creation"
  },
  {
    id: 2,
    badge: "The Visibility Gap",
    prefix: "But in reality, ",
    highlight: "they just lack a platform",
    suffix: " for the right visibility and targeted reach.",
    subtext: "Without dedicated campus exposure, incredible student-led businesses and custom services stay hidden.",
    image: "https://images.unsplash.com/photo-1556742044-3c52d6e88c62?q=80&w=1600&auto=format&fit=crop",
    icon: Eye,
    featureName: "Right Visibility",
    featureDesc: "Unlocking local exposure"
  },
  {
    id: 3,
    badge: "The Ultimate Solution",
    prefix: "Welcome to ",
    highlight: "SHOPIVERSITY",
    suffix: ", the campus standard marketplace.",
    subtext: "Connecting student business owners, handmade crafts, and services with buyers in a trusted ecosystem.",
    image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1600&auto=format&fit=crop",
    icon: GraduationCap,
    featureName: "Shopiversity",
    featureDesc: "Trust & verification"
  },
  {
    id: 4,
    badge: "Hyper-Local Convenience",
    prefix: "Where the entire ",
    highlight: "marketplace is at your fingertips",
    suffix: " daily.",
    subtext: "Find textbooks, custom clothes, gadgets, and tutoring services with peer-to-peer simplicity.",
    image: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?q=80&w=1600&auto=format&fit=crop",
    icon: ShoppingBag,
    featureName: "At Fingertips",
    featureDesc: "Peer-to-peer convenience"
  },
  {
    id: 5,
    badge: "Bulletproof Protection",
    prefix: "Transact safely with ",
    highlight: "escrow protection",
    suffix: " and secure campus payments.",
    subtext: "Your money is held in a secure lockbox and is only released after you inspect and confirm receipt.",
    image: "https://images.unsplash.com/photo-1563013544-824ae1d704d3?q=80&w=1600&auto=format&fit=crop",
    icon: ShieldCheck,
    featureName: "Escrow Shield",
    featureDesc: "100% fraud prevention"
  },
  {
    id: 6,
    badge: "Student-Friendly Deals",
    prefix: "Discover highly ",
    highlight: "affordable prices",
    suffix: " for premium quality products.",
    subtext: "Direct campus trading means zero middleman fees, translating to student-pocket friendly costs.",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1600&auto=format&fit=crop",
    icon: DollarSign,
    featureName: "Affordable Price",
    featureDesc: "Zero middleman markups"
  },
  {
    id: 7,
    badge: "Swift Campus Delivery",
    prefix: "Leverage reliable ",
    highlight: "logistics services",
    suffix: " tailored to your lecture halls & hostels.",
    subtext: "Campus student dispatch riders deliver directly to your specific doorstep within minutes.",
    image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1600&auto=format&fit=crop",
    icon: Truck,
    featureName: "Swift Logistics",
    featureDesc: "Doorstep delivery agent"
  },
  {
    id: 8,
    badge: "Worry-Free Purchases",
    prefix: "Shop with peace of mind using our ",
    highlight: "better refund system",
    suffix: " and active dispute solvers.",
    subtext: "If an item is damaged or not as described, request refunds immediately under our escrow safeguards.",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=1600&auto=format&fit=crop",
    icon: RefreshCw,
    featureName: "Easy Refund",
    featureDesc: "Hassle-free resolutions"
  }
];

interface HeroCarouselProps {
  onShopNow: () => void;
  onStartSelling: () => void;
  currentUser: any;
}

export default function HeroCarousel({ onShopNow, onStartSelling, currentUser }: HeroCarouselProps) {
  const [slideIndex, setSlideIndex] = React.useState(0);
  const [charIndex, setCharIndex] = React.useState(0);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const currentSlide = slides[slideIndex];
  const prefix = currentSlide.prefix;
  const highlight = currentSlide.highlight;
  const suffix = currentSlide.suffix;
  const fullText = prefix + highlight + suffix;

  const prefixLen = prefix.length;
  const highlightLen = highlight.length;

  // Derive typed slices from single integer charIndex to prevent race conditions & half-way halts
  const currentTyped = fullText.slice(0, charIndex);
  const prefixTyped = currentTyped.slice(0, Math.min(charIndex, prefixLen));
  const highlightTyped = currentTyped.slice(prefixLen, Math.min(charIndex, prefixLen + highlightLen));
  const suffixTyped = currentTyped.slice(prefixLen + highlightLen, charIndex);

  // Jump to specific slide
  const handleJumpToSlide = (idx: number) => {
    setSlideIndex(idx);
    setCharIndex(0);
    setIsDeleting(false);
  };

  const handlePrev = () => {
    const prevIdx = (slideIndex - 1 + slides.length) % slides.length;
    handleJumpToSlide(prevIdx);
  };

  const handleNext = () => {
    const nextIdx = (slideIndex + 1) % slides.length;
    handleJumpToSlide(nextIdx);
  };

  // Rock-solid continuous typewriter engine
  React.useEffect(() => {
    const isAtEnd = charIndex >= fullText.length;
    const isAtStart = charIndex <= 0;

    let delay = 22; // Fast typing speed
    if (isDeleting) {
      delay = 12; // Fast deleting speed
    } else if (isAtEnd) {
      delay = 2400; // Pause at end of slide text before backspacing
    }

    const timer = setTimeout(() => {
      if (!isDeleting) {
        if (isAtEnd) {
          setIsDeleting(true);
        } else {
          setCharIndex((prev) => prev + 1);
        }
      } else {
        if (isAtStart) {
          setIsDeleting(false);
          setSlideIndex((prev) => (prev + 1) % slides.length);
          setCharIndex(0);
        } else {
          setCharIndex((prev) => prev - 1);
        }
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [charIndex, isDeleting, fullText, slides.length]);

  // Visual helper widgets corresponding to current typing slide
  const renderVisualInfographic = () => {
    const iconClass = "w-10 h-10 text-[#ff6b00] mb-2 drop-shadow-[0_2px_8px_rgba(255,107,0,0.3)] animate-bounce";
    
    switch (slideIndex) {
      case 0: // Research
        return (
          <div className="flex flex-col items-center justify-center p-5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 h-full min-h-[140px]">
            <TrendingUp className={iconClass} />
            <div className="text-center">
              <span className="text-3xl font-black text-orange-500 block animate-pulse">45%</span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-white/90">Self-Doubt Rate</span>
              <p className="text-[9px] text-slate-300 mt-1">Sellers think their goods are inadequate</p>
            </div>
          </div>
        );
      case 1: // Visibility
        return (
          <div className="flex flex-col items-center justify-center p-5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 h-full min-h-[140px]">
            <Eye className={iconClass} />
            <div className="w-full text-center space-y-1.5">
              <span className="text-xs uppercase font-extrabold text-orange-400 block tracking-wider">Targeted Reach</span>
              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: "10%" }}
                  animate={{ width: "95%" }}
                  transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
                  className="h-full bg-gradient-to-r from-orange-500 to-amber-500"
                />
              </div>
              <p className="text-[9px] text-slate-300">Boosts visibility by 10x on campus</p>
            </div>
          </div>
        );
      case 2: // Shopiversity
        return (
          <div className="flex flex-col items-center justify-center p-5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 h-full min-h-[140px]">
            <GraduationCap className={iconClass} />
            <div className="text-center">
              <span className="text-lg font-black text-white block uppercase tracking-wide">Campus Verified</span>
              <span className="inline-flex items-center gap-1 mt-1 text-[9px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full border border-orange-500/35">
                <CheckCircle className="w-2.5 h-2.5" /> Approved Space
              </span>
            </div>
          </div>
        );
      case 3: // Fingertips
        return (
          <div className="flex flex-col items-center justify-center p-5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 h-full min-h-[140px]">
            <ShoppingBag className={iconClass} />
            <div className="text-center">
              <span className="text-xs uppercase font-black tracking-widest text-orange-500 block">Instant Access</span>
              <p className="text-[9px] text-white/90 mt-1 font-medium">Textbooks, Fashion, Food, Services</p>
              <span className="text-[8px] text-slate-400 block mt-2">1-Click Peer Exchange</span>
            </div>
          </div>
        );
      case 4: // Escrow Shield
        return (
          <div className="flex flex-col items-center justify-center p-5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 h-full min-h-[140px]">
            <ShieldCheck className={iconClass} />
            <div className="text-center space-y-1">
              <span className="text-xs uppercase font-black tracking-wider bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
                Escrow Active
              </span>
              <p className="text-[9px] text-slate-200 block mt-1">Funds held securely until inspection</p>
            </div>
          </div>
        );
      case 5: // Affordable Price
        return (
          <div className="flex flex-col items-center justify-center p-5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 h-full min-h-[140px]">
            <DollarSign className={iconClass} />
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <span className="text-xs line-through text-slate-400">₦15,000</span>
                <span className="text-lg font-black text-emerald-400">₦8,500</span>
              </div>
              <p className="text-[9px] text-slate-300 mt-1">Student rates, direct peers</p>
            </div>
          </div>
        );
      case 6: // Logistics
        return (
          <div className="flex flex-col items-center justify-center p-5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 h-full min-h-[140px]">
            <Truck className={iconClass} />
            <div className="text-center space-y-1">
              <span className="text-xs font-bold text-white block">Intra-Campus Dispatch</span>
              <span className="text-[8px] bg-orange-500/25 text-orange-400 px-1.5 py-0.5 rounded">Avg. 15 Mins</span>
            </div>
          </div>
        );
      case 7: // Refund
        return (
          <div className="flex flex-col items-center justify-center p-5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 h-full min-h-[140px]">
            <RefreshCw className={iconClass} />
            <div className="text-center">
              <span className="text-xs font-extrabold text-white uppercase tracking-wider block">Worry-Free returns</span>
              <span className="text-[8px] text-emerald-400 block font-semibold mt-1">Instant dispute resolution</span>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Touch gesture support for mobile swiping
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (diff > 40) {
      handleNext();
    } else if (diff < -40) {
      handlePrev();
    }
    setTouchStartX(null);
  };

  return (
    <div 
      className="relative w-full h-full bg-[#0a0d14] select-none font-sans overflow-hidden group border border-slate-100 dark:border-zinc-800 rounded-3xl shadow-lg"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 0; }
          50% { opacity: 1; }
        }
      `}</style>

      {/* Dynamic Highly-Visible Background Image Slideshow with smooth crossfade */}
      <div className="absolute inset-0 w-full h-full overflow-hidden bg-zinc-950">
        <AnimatePresence mode="wait">
          <motion.div
            key={slideIndex}
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 0.9, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="absolute inset-0 w-full h-full"
          >
            <img 
              src={currentSlide.image} 
              alt={currentSlide.badge}
              className="w-full h-full object-cover pointer-events-none brightness-[0.6] contrast-[1.1]"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        </AnimatePresence>

        {/* High-Contrast Luxury Gradient Overlays for Maximum Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/45 to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white dark:from-zinc-950 via-black/20 to-transparent z-10 pointer-events-none" />
      </div>

      {/* Hero Content Area */}
      <div className="absolute inset-0 flex flex-col md:flex-row md:items-center justify-between px-4 sm:px-12 lg:px-16 z-20 pb-8 sm:pb-10 pt-4 sm:pt-6 gap-3 sm:gap-6">
        
        {/* Left Side: Typewriter Text details */}
        <div className="flex-1 max-w-2xl space-y-2 sm:space-y-4 text-left self-center">
          
          {/* Dynamic Badge */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 bg-orange-500/10 border border-orange-500/25 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#ff6b00] shadow-sm animate-pulse">
            <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#ff6b00]" />
            <span>{currentSlide.badge}</span>
          </div>

          {/* Typing sentence area */}
          <div className="min-h-[50px] sm:min-h-[90px] md:min-h-[130px] flex items-center">
            <h1 className="text-sm sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-white leading-snug tracking-tight font-sans drop-shadow-[0_2.5px_2.5px_rgba(0,0,0,0.85)]">
              <span className="text-white/95">{prefixTyped}</span>
              {highlightTyped && (
                <span className="text-[#ff6b00] drop-shadow-[0_2px_12px_rgba(255,107,0,0.3)] mx-1 font-black">
                  {highlightTyped}
                </span>
              )}
              <span className="text-slate-200/90">{suffixTyped}</span>
              <span className="inline-block w-[3px] h-[1.1em] bg-[#ff6b00] ml-1.5 align-middle animate-[blink_0.8s_infinite]" />
            </h1>
          </div>

          {/* Supportive description */}
          <p className="text-[11px] sm:text-xs md:text-sm text-slate-100 font-semibold max-w-lg leading-snug sm:leading-relaxed line-clamp-2 drop-shadow-[0_1.5px_1.5px_rgba(0,0,0,0.85)]">
            {currentSlide.subtext}
          </p>

          {/* Actions CTAs */}
          <div className="flex flex-row items-center gap-2.5 pt-1.5 sm:pt-3">
            <motion.button 
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onShopNow}
              className="px-4 py-2 sm:px-6 sm:py-3 bg-[#ff6b00] hover:bg-[#e05e00] text-white rounded-xl font-black tracking-wider transition-all text-[10px] sm:text-xs uppercase cursor-pointer flex items-center gap-1.5 border-none outline-none shadow-lg shadow-orange-500/15 shrink-0"
            >
              <span>Explore Deals</span>
              <ShoppingBag className="w-3.5 h-3.5 text-white" />
            </motion.button>

            <motion.button 
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onStartSelling}
              className="px-4 py-2 sm:px-6 sm:py-3 bg-white/10 text-white hover:bg-white/15 border border-white/20 rounded-xl font-black tracking-wider transition-all text-[10px] sm:text-xs uppercase cursor-pointer flex items-center gap-1.5 outline-none shrink-0"
            >
              Start Selling
            </motion.button>
          </div>
        </div>

        {/* Right Side: Interactive corresponding infographics widget (Hidden on small mobile for pure focus) */}
        <div className="hidden sm:flex w-full md:w-64 lg:w-72 flex-col justify-center shrink-0 pr-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={`visual-${slideIndex}`}
              initial={{ opacity: 0, x: 20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, scale: 0.95 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="w-full"
            >
              {renderVisualInfographic()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Slide Indicator Dots */}
      <div className="absolute bottom-2.5 sm:bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 bg-black/30 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
        {slides.map((slide, idx) => (
          <button
            key={`hero-dot-${slide.id}-${idx}`}
            onClick={() => handleJumpToSlide(idx)}
            aria-label={`Go to slide ${idx + 1}`}
            className={cn(
              "h-1.5 rounded-full transition-all cursor-pointer",
              idx === slideIndex 
                ? "w-5 sm:w-6 bg-[#ff6b00]" 
                : "w-1.5 bg-white/40 hover:bg-white/70"
            )}
          />
        ))}
      </div>
    </div>
  );
}
