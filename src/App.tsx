import React from "react";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { 
  collection, 
  query, 
  where,
  orderBy, 
  onSnapshot, 
  doc,
  setDoc,
  updateDoc,
  getDocs,
  addDoc,
  getDoc,
  deleteDoc,
  limit
} from "firebase/firestore";
import { Product, UserProfile, CartItem, Notification, OneDollarListing } from "./types";
import { useOneDollarRate, getCachedOneDollarListings, setCachedOneDollarListings, clampOneDollarUsd, computeOneDollarNgn, formatUsd } from "./lib/oneDollarRate";
import {
  isCartItemExpired,
  parseCartAddedAt,
  pruneExpiredCartItems,
  resolveAvailableStockForCartItem,
  resolveAvailableStockForProduct,
} from "./lib/cartStock";
import { handleFirestoreError, OperationType, getFirestoreErrorMessage, isFirestoreQuotaError, FIRESTORE_QUOTA_EVENT, notifyFirestoreQuotaExceeded } from "./lib/firebase-errors";
import {
  getCachedUserProfile,
  setCachedUserProfile,
  removeCachedUserProfile,
  hasPendingProfileSync,
  setPendingProfileSync,
  hasPendingVerifySync,
  setPendingVerifySync,
  getCachedProducts,
  setCachedProducts,
  getCachedSellers,
  setCachedSellers,
  getCachedNotifications,
  setCachedNotifications
} from "./lib/profileCache";
import SellerStorefront from "./components/SellerStorefront";
import LogisticsHub from "./components/LogisticsHub";
import Sidebar from "./components/Sidebar";
import SupportPage from "./components/SupportPage";
import AuthPage from "./components/AuthPage";
import { ProductCard, ProductCardSkeleton } from "./components/ProductCard";
import ProductDetail from "./components/ProductDetail";
import CartPage from "./components/CartPage";
import SellerDashboard from "./components/SellerDashboard";
import ProfileSettings from "./components/ProfileSettings";
import UserProfileHub from "./components/UserProfileHub";
import OrderTracking from "./components/OrderTracking";
import ProductHistory from "./components/ProductHistory";
import NotificationsPage from "./components/NotificationsPage";
import BuyerDashboard from "./components/BuyerDashboard";
import AdminDashboard from "./components/AdminDashboard";
import SecretAdminGatewayModal from "./components/SecretAdminGatewayModal";
import ChatView from "./components/Chat/ChatView";
import TermsAndConditions from "./components/TermsAndConditions";
import PrivacyPolicy from "./components/PrivacyPolicy";
import CookiesPolicy from "./components/CookiesPolicy";
import RefundPolicy from "./components/RefundPolicy";
import CookieConsentBanner from "./components/CookieConsentBanner";
import ReturnPolicyModal from "./components/ReturnPolicyModal";
import Carousel from "./components/HeroCarousel";
import {
  generateSmartUsername,
  cascadeDeleteUserAccount,
  verifyFirebaseAuthUserExists,
  hasValidSellerStorefront,
  cleanupOrphanedProducts
} from "./utils/accountCleanup";
import Logo from "./components/Logo";
import StickmanLoader from "./components/StickmanLoader";
import ShopiversityLoader from "./components/ShopiversityLoader";
import Footer from "./components/Footer";
import OneDollarBanner from "./components/OneDollarBanner";
import OneDollarSection from "./components/OneDollarSection";
import EscrowReturnPage from "./components/EscrowReturnPage";
import { cn } from "./lib/utils";
import { 
  Search, 
  Loader2, 
  Mail,
  ShoppingBag, 
  Store, 
  LayoutDashboard,
  Menu,
  Bell,
  ShoppingCart,
  X,
  LogOut,
  Moon,
  Sun,
  User as UserIcon,
  Sparkles,
  CheckCircle,
  Clock,
  XCircle,
  CalendarDays,
  MapPin,
  ChevronDown,
  Zap,
  ArrowUpRight,
  Tag,
  Share2,
  ArrowLeft,
  ArrowLeftRight,
  HeartHandshake,
  MessageSquare,
  ArrowRight,
  TrendingUp,
  HelpCircle,
  Palette,
  Paintbrush,
  Truck,
  ShieldAlert,
  UserPlus,
  DollarSign
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const ALL_CATEGORIES = [
  "Electronics", "Textbooks", "Clothing", "Furniture", "Food & Drinks", "Beauty & Health",
  "Creative & Design", "Academic & Tutoring", "Home & Personal Care", "Tech & Digital", 
  "Logistics & Errands", "Sports & Outdoors", "Musical Instruments", 
  "Collectibles & Art", "Jobs & Internships", "Other"
];

const getCategoryEmoji = (category: string) => {
  switch (category) {
    case "All": return "🏪 All Items";
    case "Electronics": return "📱 Tech & Gear";
    case "Textbooks": return "📚 Textbooks";
    case "Clothing": return "👕 Apparel & Fashion";
    case "Furniture": return "🛋️ Furniture";
    case "Food & Drinks": return "🍕 Food & Drinks";
    case "Beauty & Health": return "💅 Beauty & Glow";
    case "Creative & Design": return "🎨 Creative Design";
    case "Academic & Tutoring": return "🎓 Prep & Tutor";
    case "Home & Personal Care": return "🧼 Home & Care";
    case "Tech & Digital": return "💻 Digital Services";
    case "Logistics & Errands": return "📦 Swift Logistics";
    case "Sports & Outdoors": return "⚽ Sports Gear";
    case "Musical Instruments": return "🎸 Instruments";
    case "Collectibles & Art": return "🏺 Fine Art";
    case "Jobs & Internships": return "💼 Internships";
    default: return "✨ " + category;
  }
};


export default function App() {
  const [layoutMode, setLayoutMode] = React.useState<"phone" | "wide">("phone");
  const [simulatedTime, setSimulatedTime] = React.useState("9:30 PM");

  // Mobile Simulator & PWA States
  const [simulatorViewMode, setSimulatorViewMode] = React.useState<"simulator" | "fullscreen">(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth < 768 ? "fullscreen" : "simulator";
    }
    return "simulator";
  });
  const [isPhoneLocked, setIsPhoneLocked] = React.useState(false);
  const [volumeLevel, setVolumeLevel] = React.useState(80);
  const [isVolumeHudVisible, setIsVolumeHudVisible] = React.useState(false);
  const [dynamicIslandState, setDynamicIslandState] = React.useState<"compact" | "expanded-notif" | "expanded-charging">("compact");
  const [dynamicIslandMessage, setDynamicIslandMessage] = React.useState("");
  const [isBatteryCharging, setIsBatteryCharging] = React.useState(true);
  
  const volumeTimerRef = React.useRef<any>(null);
  const dynamicIslandTimerRef = React.useRef<any>(null);

  const triggerDynamicIsland = React.useCallback((message: string, type: "notif" | "charging" = "notif") => {
    setDynamicIslandMessage(message);
    setDynamicIslandState(type === "charging" ? "expanded-charging" : "expanded-notif");
    if (dynamicIslandTimerRef.current) clearTimeout(dynamicIslandTimerRef.current);
    dynamicIslandTimerRef.current = setTimeout(() => {
      setDynamicIslandState("compact");
    }, 3500);
  }, []);

  const handleVolumeChange = (delta: number) => {
    setVolumeLevel(prev => {
      const next = Math.min(100, Math.max(0, prev + delta));
      return next;
    });
    setIsVolumeHudVisible(true);
    if (volumeTimerRef.current) clearTimeout(volumeTimerRef.current);
    volumeTimerRef.current = setTimeout(() => {
      setIsVolumeHudVisible(false);
    }, 2000);
  };

  const handleBatteryClick = () => {
    setIsBatteryCharging(prev => {
      const next = !prev;
      triggerDynamicIsland(next ? "Simulated Charger Connected ⚡" : "Battery Mode: 100% 🔋", "charging");
      return next;
    });
  };

  const toggleLockPhone = () => {
    setIsPhoneLocked(prev => {
      const next = !prev;
      if (next) {
        setIsVolumeHudVisible(false);
      } else {
        triggerDynamicIsland("Phone Unlocked 🔓");
      }
      return next;
    });
  };

  React.useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      let hours = d.getHours();
      const minutes = d.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const minStr = minutes < 10 ? '0' + minutes : minutes;
      setSimulatedTime(`${hours}:${minStr} ${ampm}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const [products, setProducts] = React.useState<Product[]>([]);
  const [oneDollarListings, setOneDollarListings] = React.useState<OneDollarListing[]>(() => getCachedOneDollarListings());
  const { rateInfo: oneDollarRate, loading: oneDollarRateLoading, error: oneDollarRateError, refreshRate: refreshOneDollarRate } = useOneDollarRate();
  const [sellers, setSellers] = React.useState<UserProfile[]>([]);
  const [existingUserIds, setExistingUserIds] = React.useState<Set<string>>(new Set());
  const [invalidSellerIds, setInvalidSellerIds] = React.useState<Set<string>>(new Set());
  const [missingSellerIds, setMissingSellerIds] = React.useState<Set<string>>(new Set());
  const [usersLoaded, setUsersLoaded] = React.useState(false);
  const purgingDeletedAuthUidRef = React.useRef<string | null>(null);
  const checkedSellerIdsRef = React.useRef<Set<string>>(new Set());
  const deletedOrphanProductIdsRef = React.useRef<Set<string>>(new Set());

  const sellersMap = React.useMemo(() => {
    const map: Record<string, UserProfile> = {};
    sellers.forEach(s => {
      if (s.uid) map[s.uid] = s;
    });
    return map;
  }, [sellers]);
  const [searchType, setSearchType] = React.useState<"products" | "storefronts">("products");
  const [loading, setLoading] = React.useState(true);
  const [authLoading, setAuthLoading] = React.useState(true);
  const [firestoreQuotaExceeded, setFirestoreQuotaExceeded] = React.useState(false);

  React.useEffect(() => {
    const onQuotaEvent = () => setFirestoreQuotaExceeded(true);
    window.addEventListener(FIRESTORE_QUOTA_EVENT, onQuotaEvent);
    return () => window.removeEventListener(FIRESTORE_QUOTA_EVENT, onQuotaEvent);
  }, []);

  const [currentUser, setCurrentUser] = React.useState<UserProfile | null>(null);

  // Verify any sellerIds referenced by marketplace products / One Dollar listings that aren't in sellersMap yet,
  // exclude products whose seller account is missing or lacks a storefront, and permanently delete eligible orphans in Firestore.
  React.useEffect(() => {
    if (!usersLoaded) return;

    const allSellerIds = new Set<string>();
    products.forEach((p) => {
      if (p.sellerId) allSellerIds.add(p.sellerId);
    });
    oneDollarListings.forEach((l) => {
      if (l.sellerId) allSellerIds.add(l.sellerId);
    });

    const unknownIds = Array.from(allSellerIds).filter(
      (sid) =>
        !sellersMap[sid] &&
        !invalidSellerIds.has(sid) &&
        !checkedSellerIdsRef.current.has(sid)
    );

    if (unknownIds.length > 0) {
      unknownIds.forEach((sid) => checkedSellerIdsRef.current.add(sid));
      Promise.all(
        unknownIds.map(async (sid) => {
          try {
            const snap = await getDoc(doc(db, "users", sid));
            if (!snap.exists()) {
              return { sid, status: "missing" as const, profile: null };
            }
            const profile = { uid: snap.id, ...snap.data() } as UserProfile;
            if (!hasValidSellerStorefront(profile)) {
              return { sid, status: "no_storefront" as const, profile };
            }
            return { sid, status: "valid" as const, profile };
          } catch {
            return { sid, status: "error" as const, profile: null };
          }
        })
      ).then((results) => {
        const newlyValid: UserProfile[] = [];
        const newlyInvalid: string[] = [];
        const newlyMissing: string[] = [];

        results.forEach((r) => {
          if (r.status === "valid" && r.profile) {
            newlyValid.push(r.profile);
          } else if (r.status === "missing") {
            newlyInvalid.push(r.sid);
            newlyMissing.push(r.sid);
          } else if (r.status === "no_storefront") {
            newlyInvalid.push(r.sid);
          }
        });

        if (newlyValid.length > 0) {
          setSellers((prev) => {
            const merged = new Map<string, UserProfile>();
            prev.forEach((u) => merged.set(u.uid, u));
            newlyValid.forEach((u) => merged.set(u.uid, u));
            const list = Array.from(merged.values());
            setCachedSellers(list);
            return list;
          });
          setExistingUserIds((prev) => {
            const next = new Set(prev);
            newlyValid.forEach((u) => next.add(u.uid));
            return next;
          });
        }

        if (newlyInvalid.length > 0) {
          setInvalidSellerIds((prev) => {
            const next = new Set(prev);
            newlyInvalid.forEach((id) => next.add(id));
            return next;
          });
        }

        if (newlyMissing.length > 0) {
          setMissingSellerIds((prev) => {
            const next = new Set(prev);
            newlyMissing.forEach((id) => next.add(id));
            return next;
          });
        }
      });
    }

    // Identify orphaned or storefront-less products currently in state
    const badProducts = products.filter((p) => {
      if (!p.sellerId) return true;
      if (invalidSellerIds.has(p.sellerId) || missingSellerIds.has(p.sellerId)) return true;
      if (sellersMap[p.sellerId] && !hasValidSellerStorefront(sellersMap[p.sellerId])) return true;
      if (unknownIds.length === 0 && checkedSellerIdsRef.current.has(p.sellerId) && !sellersMap[p.sellerId]) return true;
      return false;
    });

    if (badProducts.length > 0) {
      const badIdSet = new Set(badProducts.map((p) => p.id));
      setProducts((prev) => {
        const next = prev.filter((p) => !badIdSet.has(p.id));
        if (next.length !== prev.length) {
          setCachedProducts(next);
        }
        return next;
      });

      const pendingFirestoreDeletes = badProducts.filter(
        (p) => !deletedOrphanProductIdsRef.current.has(p.id)
      );

      if (pendingFirestoreDeletes.length > 0 && auth.currentUser) {
        cleanupOrphanedProducts(pendingFirestoreDeletes, existingUserIds, true, {
          sellersMap,
          missingSellerIds,
          isAdmin: currentUser?.role === "admin"
        }).then((deleted) => {
          deleted.forEach((id) => deletedOrphanProductIdsRef.current.add(id));
        }).catch(() => {});
      }
    }

    // Also strip orphaned or storefront-less One Dollar listings from UI & cache
    const badOneDollar = oneDollarListings.filter((l) => {
      if (!l.sellerId) return true;
      if (invalidSellerIds.has(l.sellerId) || missingSellerIds.has(l.sellerId)) return true;
      if (sellersMap[l.sellerId] && !hasValidSellerStorefront(sellersMap[l.sellerId])) return true;
      if (unknownIds.length === 0 && checkedSellerIdsRef.current.has(l.sellerId) && !sellersMap[l.sellerId]) return true;
      return false;
    });

    if (badOneDollar.length > 0) {
      const badOdSet = new Set(badOneDollar.map((l) => l.id));
      setOneDollarListings((prev) => {
        const next = prev.filter((l) => !badOdSet.has(l.id));
        if (next.length !== prev.length) {
          setCachedOneDollarListings(next);
        }
        return next;
      });
    }
  }, [products, oneDollarListings, sellersMap, existingUserIds, invalidSellerIds, missingSellerIds, usersLoaded, currentUser?.uid, currentUser?.role]);

  // Smooth Branded Splash Preloader State
  const [isInitialSplashActive, setIsInitialSplashActive] = React.useState(true);
  const splashMountTimeRef = React.useRef<number>(Date.now());

  // Gracefully transition out of the Shopiversity brand loader once auth and catalogue have initialized
  React.useEffect(() => {
    if (!authLoading && !loading) {
      const elapsed = Date.now() - splashMountTimeRef.current;
      const minAnimationDuration = 800; // Ensures the clean cart and logo animation plays with elegance
      const remainingTime = Math.max(0, minAnimationDuration - elapsed);
      const timer = setTimeout(() => {
        setIsInitialSplashActive(false);
      }, remainingTime);
      return () => clearTimeout(timer);
    }
  }, [authLoading, loading]);

  // Safety fallback: Release the splash screen after 3.2s even under poor network conditions
  React.useEffect(() => {
    const safetyTimer = setTimeout(() => {
      setIsInitialSplashActive(false);
    }, 3200);
    return () => clearTimeout(safetyTimer);
  }, []);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterCategory, setFilterCategory] = React.useState("All");
  const [filterVendor, setFilterVendor] = React.useState("All");
  const [filterCondition, setFilterCondition] = React.useState("All");
  const [filterPriceRange, setFilterPriceRange] = React.useState("All");
  const [cart, setCart] = React.useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem("shopiversity_cart");
      if (saved) {
        const parsed: CartItem[] = JSON.parse(saved);
        const valid = pruneExpiredCartItems(parsed, Date.now());
        if (Array.isArray(parsed) && valid.length !== parsed.length) {
          localStorage.setItem("shopiversity_cart", JSON.stringify(valid));
        }
        return valid;
      }
    } catch (e) {
      console.error("Failed to parse cart from localStorage", e);
    }
    return [];
  });

  // Save cart to localStorage whenever it changes
  React.useEffect(() => {
    try {
      localStorage.setItem("shopiversity_cart", JSON.stringify(cart));
    } catch (e) {
      console.error("Failed to save cart to localStorage", e);
    }
  }, [cart]);

  // Periodically clean up items whose 2-day (48-hour) reservation window has expired
  const cleanupExpiredCart = React.useCallback(() => {
    const now = Date.now();
    setCart((prev) => {
      const valid = pruneExpiredCartItems(prev, now);
      if (valid.length !== prev.length) {
        triggerDynamicIsland("Expired cart items returned to available stock! 📦");
        return valid;
      }
      return prev;
    });
  }, [triggerDynamicIsland]);

  React.useEffect(() => {
    cleanupExpiredCart();
    const interval = setInterval(cleanupExpiredCart, 15000);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        cleanupExpiredCart();
      }
    };
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "shopiversity_cart") {
        try {
          const parsed: CartItem[] = e.newValue ? JSON.parse(e.newValue) : [];
          setCart(pruneExpiredCartItems(parsed, Date.now()));
        } catch {
          setCart([]);
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", cleanupExpiredCart);
    window.addEventListener("storage", handleStorage);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", cleanupExpiredCart);
      window.removeEventListener("storage", handleStorage);
    };
  }, [cleanupExpiredCart]);
  const [pendingCartItem, setPendingCartItem] = React.useState<{
    product: Product;
    menuItem?: any;
    ticketTier?: any;
    formResponses?: Record<string, string>;
    previousTab: string;
  } | null>(null);
  const [pendingOneDollarListing, setPendingOneDollarListing] = React.useState<OneDollarListing | null>(null);
  const [pendingOneDollarCartItem, setPendingOneDollarCartItem] = React.useState<{
    listing: OneDollarListing;
    goToCartImmediately?: boolean;
    previousTab: string;
  } | null>(null);
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);

  // Email verification handlers
  const [isResendingFirebaseEmail, setIsResendingFirebaseEmail] = React.useState(false);
  const [verificationBannerNotice, setVerificationBannerNotice] = React.useState<string | null>(null);

  const handleResendFirebaseVerification = async () => {
    if (!auth.currentUser) return;
    setIsResendingFirebaseEmail(true);
    setVerificationBannerNotice(null);
    try {
      const verifyingEmail = (
        currentUser?.email ||
        (typeof window !== "undefined" ? sessionStorage.getItem("shopiversity_verifying_email") : null) ||
        auth.currentUser.email ||
        ""
      ).trim().toLowerCase();
      const res = await fetch("/api/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: verifyingEmail,
          userName: auth.currentUser.displayName || currentUser?.displayName || "Student"
        })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success && data.sent) {
        setVerificationBannerNotice(`Verification email sent to ${verifyingEmail} via Brevo! Check your inbox.`);
        triggerDynamicIsland("Verification email sent! ✉️");
      } else {
        setVerificationBannerNotice(data.error || "Failed to dispatch email via Brevo. Please check your Brevo settings.");
      }
    } catch (err: any) {
      console.error("Error resending verification email:", err);
      if (err.code === "auth/too-many-requests") {
        setVerificationBannerNotice("Too many requests. Please wait a minute before requesting another verification email.");
      } else {
        setVerificationBannerNotice(err.message || "Failed to resend verification email. Please try again.");
      }
    } finally {
      setIsResendingFirebaseEmail(false);
    }
  };
  
  // Navigation & UI states
  const [isEscrowReturnRoute, setIsEscrowReturnRoute] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.location.pathname.replace(/\/+$/, "") === "/payment/escrow/return";
  });
  const [focusedOrderId, setFocusedOrderId] = React.useState<string | null>(null);
  const [pendingOrderRedirectAfterAuth, setPendingOrderRedirectAfterAuth] = React.useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [activeTab, setActiveTabState] = React.useState("market");
  const [settingsSubView, setSettingsSubView] = React.useState<"hub" | "edit">("hub");
  const [tabHistory, setTabHistory] = React.useState<string[]>([]);
  const [viewingProduct, setViewingProduct] = React.useState<Product | null>(null);
  const [viewingSellerId, setViewingSellerId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (activeTab === "cart") {
      cleanupExpiredCart();
    }
  }, [activeTab, cleanupExpiredCart]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const syncPathRoute = () => {
      setIsEscrowReturnRoute(
        window.location.pathname.replace(/\/+$/, "") === "/payment/escrow/return"
      );
    };
    window.addEventListener("popstate", syncPathRoute);
    return () => window.removeEventListener("popstate", syncPathRoute);
  }, []);

  React.useEffect(() => {
    if (typeof document === "undefined") return;
    if (isEscrowReturnRoute) {
      document.title = "EscrowPay Return · SHOPIVERSITY";
    } else {
      document.title = "SHOPIVERSITY - Student E-Commerce Platform";
    }
  }, [isEscrowReturnRoute]);

  const leaveEscrowReturnRoute = React.useCallback(
    (targetTab: string, orderId?: string | null, requireSignIn = false) => {
      if (typeof window !== "undefined" && window.location.pathname.replace(/\/+$/, "") === "/payment/escrow/return") {
        window.history.pushState({}, "", "/");
      }
      setIsEscrowReturnRoute(false);
      setIsInitialSplashActive(false);
      if (orderId) {
        setFocusedOrderId(orderId);
      }
      if (targetTab === "orders") {
        setActiveRole("buyer");
      }
      if (requireSignIn) {
        setPendingOrderRedirectAfterAuth(true);
        setAuthMode("login");
      } else {
        setPendingOrderRedirectAfterAuth(false);
      }
      setActiveTab(targetTab);
    },
    []
  );

  const [isFilterTransitioning, setIsFilterTransitioning] = React.useState(false);
  const filterTimerRef = React.useRef<any>(null);

  // Trigger smooth skeleton loading state when search filters are applied
  React.useEffect(() => {
    if (loading) return;
    setIsFilterTransitioning(true);
    if (filterTimerRef.current) clearTimeout(filterTimerRef.current);
    filterTimerRef.current = setTimeout(() => {
      setIsFilterTransitioning(false);
    }, 280);
    return () => {
      if (filterTimerRef.current) clearTimeout(filterTimerRef.current);
    };
  }, [searchQuery, filterCategory, filterVendor, filterCondition, filterPriceRange, viewingSellerId]);

  const mainContentRef = React.useRef<HTMLElement | null>(null);

  const scrollToTop = React.useCallback(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
    const mainEl = document.querySelector("main");
    if (mainEl) {
      mainEl.scrollTop = 0;
    }
  }, []);

  React.useEffect(() => {
    scrollToTop();
  }, [activeTab, settingsSubView, viewingProduct, viewingSellerId, scrollToTop]);

  const setActiveTab = React.useCallback((newTab: string) => {
    if (newTab === "settings") {
      setSettingsSubView("hub");
    }
    if (newTab === "auth") {
      setAuthMode("login");
      if (typeof window !== "undefined") {
        sessionStorage.setItem("shopiversity_auth_mode", "login");
      }
      setViewingProduct(null);
      setViewingSellerId(null);
    } else if (newTab === "signup") {
      setAuthMode("signup");
      if (typeof window !== "undefined") {
        sessionStorage.setItem("shopiversity_auth_mode", "signup");
      }
      setViewingProduct(null);
      setViewingSellerId(null);
    }
    setActiveTabState((prev) => {
      if (prev !== newTab) {
        setTabHistory((history) => {
          if (history[history.length - 1] === prev) return history;
          return [...history, prev];
        });
      }
      return newTab;
    });
  }, []);

  const [activeRole, setActiveRole] = React.useState<"buyer" | "seller">(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("shopiversity_chosen_role");
      if (saved === "seller") return "seller";
    }
    return "buyer";
  });
  const [authMode, setAuthMode] = React.useState<"login" | "signup">("signup");
  const [authRole, setAuthRole] = React.useState<"buyer" | "seller">("buyer");
  const [chatWithUserId, setChatWithUserId] = React.useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = React.useState(false);
  const [isReturnPolicyOpen, setIsReturnPolicyOpen] = React.useState(false);
  const [isCookieSettingsOpen, setIsCookieSettingsOpen] = React.useState(false);
  const [isSecretAdminModalOpen, setIsSecretAdminModalOpen] = React.useState(false);
  const [secretAdminPasskey, setSecretAdminPasskey] = React.useState("");
  const [notificationView, setNotificationView] = React.useState<"unread" | "read">("unread");
  const [connectionError, setConnectionError] = React.useState<string | null>(null);
  const [needsProfile, setNeedsProfile] = React.useState(false);
  const [hibernationMessage, setHibernationMessage] = React.useState<string | null>(null);
  const [isVerifyingNewSignup, setIsVerifyingNewSignup] = React.useState(false);
  const [pendingVerificationEmail, setPendingVerificationEmail] = React.useState<string>("");

  const activeTabRef = React.useRef(activeTab);
  React.useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  const isVerifyingNewSignupRef = React.useRef(isVerifyingNewSignup);
  React.useEffect(() => {
    isVerifyingNewSignupRef.current = isVerifyingNewSignup;
  }, [isVerifyingNewSignup]);

  const needsProfileRef = React.useRef(needsProfile);
  React.useEffect(() => {
    needsProfileRef.current = needsProfile;
  }, [needsProfile]);

  const currentUserRef = React.useRef(currentUser);
  React.useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  const isInitialSplashActiveRef = React.useRef(isInitialSplashActive);
  React.useEffect(() => {
    isInitialSplashActiveRef.current = isInitialSplashActive;
  }, [isInitialSplashActive]);

  // Keep activeRole strictly synced with the logged-in user's account role
  React.useEffect(() => {
    const savedChosen = typeof window !== "undefined" ? sessionStorage.getItem("shopiversity_chosen_role") : null;
    if (currentUser?.role === "seller" || currentUser?.activeRole === "seller" || (currentUser && savedChosen === "seller" && currentUser.role !== "buyer")) {
      setActiveRole("seller");
    } else if (currentUser?.role === "buyer" || currentUser?.activeRole === "buyer") {
      setActiveRole("buyer");
    }
  }, [currentUser?.role, currentUser?.activeRole]);

  React.useEffect(() => {
    if (currentUser && (activeTab === "auth" || activeTab === "signup")) {
      // If user is unverified or still on the verification confirmation step, don't redirect away!
      if (isVerifyingNewSignup || currentUser.isVerified === false || (!currentUser.isVerified && currentUser.role !== "admin")) {
        setIsVerifyingNewSignup(true);
        return;
      }
      const isSeller = currentUser.role === "seller" || 
                       currentUser.activeRole === "seller" || 
                       sessionStorage.getItem("shopiversity_chosen_role") === "seller";
      if (isSeller) {
        setActiveRole("seller");
        setActiveTab("dashboard");
      } else {
        setActiveRole("buyer");
        setActiveTab("market");
      }
    }
  }, [currentUser, activeTab, isVerifyingNewSignup, setActiveTab]);

  const handleGoBack = React.useCallback(() => {
    if (viewingProduct) {
      setViewingProduct(null);
      if (activeRole === "seller") {
        setActiveTabState("dashboard");
      }
      return;
    }
    if (viewingSellerId) {
      setViewingSellerId(null);
      if (activeRole === "seller") {
        setActiveTabState("dashboard");
      }
      return;
    }
    setTabHistory((history) => {
      if (history.length > 0) {
        const prev = history[history.length - 1];
        setActiveTabState(prev);
        return history.slice(0, -1);
      }
      setActiveTabState(activeRole === "seller" ? "dashboard" : "market");
      return [];
    });
  }, [viewingProduct, viewingSellerId, activeRole]);

  // Unified Home navigation for Shopiversity Logo
  // Sellers -> Vendor Dashboard ("dashboard")
  // Couriers -> Logistics Hub ("logistics")
  // Buyers / Guests -> Marketplace ("market")
  const handleLogoHomeClick = React.useCallback(() => {
    if (currentUser?.state === "Logistics Partner" || currentUser?.role === "logistics") {
      setActiveTab("logistics");
    } else if (
      currentUser?.role === "seller" || 
      activeRole === "seller" || 
      (typeof window !== "undefined" && sessionStorage.getItem("shopiversity_chosen_role") === "seller")
    ) {
      setActiveRole("seller");
      setActiveTab("dashboard");
    } else {
      setActiveRole("buyer");
      setActiveTab("market");
    }
    setViewingProduct(null);
    setViewingSellerId(null);
    setFilterCategory("All");
    setSearchQuery("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentUser, activeRole, setActiveTab]);

  const [pendingEditProduct, setPendingEditProduct] = React.useState<any>(null);
  const [storefrontPreviewSettings, setStorefrontPreviewSettings] = React.useState<any>(null);
  const initialTabSet = React.useRef(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = React.useState(false);

  // Exclusive Visual Theme defaulted to Orange & White (Sunset)
  const selectedTheme = "sunset";

  const [isDarkMode, setIsDarkMode] = React.useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme");
      if (saved) return saved === "dark";
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  const isDarkModeRef = React.useRef(isDarkMode);
  React.useEffect(() => {
    isDarkModeRef.current = isDarkMode;
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const next = !prev;
      const expectedTheme = next ? "dark" : "light";
      if (currentUser && !needsProfile) {
        const userDocRef = doc(db, "users", currentUser.uid);
        updateDoc(userDocRef, {
          theme: expectedTheme
        }).catch(err => {
          if (isFirestoreQuotaError(err)) {
            notifyFirestoreQuotaExceeded(`users/${currentUser.uid}`);
            return;
          }
          if (err.message?.includes("permissions") || err.code === 'not-found' || !auth.currentUser) {
            return;
          }
          handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
        });
      }
      return next;
    });
  };

  React.useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }

    // Apply interactive aesthetic preset classes
    root.classList.remove("theme-sunset", "theme-cyber", "theme-velvet");
    root.classList.add(`theme-${selectedTheme}`);
    localStorage.setItem("shopiversity-theme", selectedTheme);
  }, [isDarkMode, selectedTheme]);

  // Inactivity / Idle Timeout handler (Auto Logout & Home Redirect)
  React.useEffect(() => {
    if (!currentUser) return; // Only track idle timeout if a user is logged in
    
    // Inactivity limit of 2 hours (7,200,000 ms) so users aren't unexpectedly logged out during normal use
    const INACTIVITY_LIMIT = 2 * 60 * 60 * 1000; 
    let timeoutId: any;

    const handleInactivity = () => {
      // 1. Take back to home page
      setActiveTab("market");
      setActiveRole("buyer");
      setViewingSellerId(null);
      // 2. Log user out
      signOut(auth);
      setCart([]);
      triggerDynamicIsland("Signed out after 2 hours of inactivity");
    };

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(handleInactivity, INACTIVITY_LIMIT);
    };

    // Events to monitor for user physical interaction
    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click"];
    
    events.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    // Start timer on mount
    resetTimer();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [currentUser]);

  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);

    const sellerId = urlParams.get('seller');
    if (sellerId) {
      setViewingSellerId(sellerId);
      setActiveTab("market");
    }

    const productId = urlParams.get('product');
    if (productId) {
      getDoc(doc(db, "products", productId)).then((docSnap) => {
        if (docSnap.exists()) {
          setViewingProduct({ id: docSnap.id, ...docSnap.data() } as any);
        }
      }).catch((err) => {
        console.error("Error loading deep-linked product:", err);
      });
    }

    // Check for Secret Super-Admin Gateway Link & Dynamic Passkey in URL
    const adminPortalRequested = urlParams.get('admin_portal') === 'true' || window.location.hash === '#admin-portal';
    const passkeyParam = urlParams.get('passkey');
    if (adminPortalRequested || passkeyParam) {
      setIsSecretAdminModalOpen(true);
      if (passkeyParam) {
        setSecretAdminPasskey(passkeyParam);
      }
    }

    // Stealth keyboard shortcut (Ctrl + Alt + A) for direct secret admin access
    const handleAdminKeyCombo = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.altKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        setIsSecretAdminModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleAdminKeyCombo);

    const handleViewProduct = (e: any) => {
      const productName = e.detail;
      setActiveTab("market");
      setSearchQuery(productName);
    };

    window.addEventListener('view-product-market', handleViewProduct);

    const handleViewCategory = (e: any) => {
      const category = e.detail;
      setActiveTab("market");
      setFilterCategory(category);
      setSearchQuery("");
    };
    window.addEventListener('view-category', handleViewCategory);

    const handleViewProductDetail = (e: any) => {
      setViewingProduct(e.detail);
    };
    window.addEventListener('view-product-detail', handleViewProductDetail);

    const handleViewSellerStore = (e: any) => {
      const { sellerId, previewSettings } = typeof e.detail === 'string' ? { sellerId: e.detail, previewSettings: null } : e.detail;
      setViewingSellerId(sellerId);
      setStorefrontPreviewSettings(previewSettings);
      setActiveTab("market");
    };
    window.addEventListener('view-seller-store', handleViewSellerStore);

    const handleOpenChat = (e: any) => {
      setChatWithUserId(e.detail);
      setActiveTab("messages");
    };
    window.addEventListener('open-chat', handleOpenChat);

    const handleAddToCartEvent = (e: any) => {
      const { product, menuItem, ticketTier, formResponses } = e.detail || {};
      if (product) {
        handleAddToCart(product, menuItem, ticketTier, formResponses);
      }
    };
    window.addEventListener('add-to-cart', handleAddToCartEvent);

    const handleSwitchRole = (e: any) => {
      // Role switching is strictly disabled for registered accounts
      if (!currentUser) {
        setActiveRole(e.detail);
      }
    };
    window.addEventListener('switch-active-role', handleSwitchRole);

    const handleEditSellerProduct = (e: any) => {
      if (currentUser?.role === "seller" || activeRole === "seller") {
        setPendingEditProduct(e.detail);
        setActiveRole("seller");
        setActiveTab("add-product");
      }
    };
    window.addEventListener('edit-seller-product', handleEditSellerProduct);

    const handleSwitchSellerTab = (e: any) => {
      if (currentUser?.role === "seller" || activeRole === "seller") {
        if (e.detail === "settings") {
          setActiveRole("seller");
          setActiveTab("settings");
          setSettingsSubView("edit");
        }
      }
    };
    window.addEventListener('switch-seller-tab', handleSwitchSellerTab);

    const handleSwitchTabEvent = (e: any) => {
      setActiveTab(e.detail);
    };
    window.addEventListener('switch-tab', handleSwitchTabEvent);

    let unsubscribeProfile: (() => void) | null = null;
    let unsubscribeNotifs: (() => void) | null = null;

    const checkAndCascadeIfAuthDeleted = async (user: any): Promise<boolean> => {
      if (!user || !user.uid) return false;
      const stillExistsInAuth = await verifyFirebaseAuthUserExists(user);
      if (stillExistsInAuth) return false;

      if (purgingDeletedAuthUidRef.current === user.uid) return true;
      purgingDeletedAuthUidRef.current = user.uid;
      console.warn(`[FIREBASE AUTH SYNC] User ${user.uid} (${user.email || "unknown"}) was deleted from Firebase Authentication. Running full website cascade delete...`);
      try {
        await cascadeDeleteUserAccount(user.uid, user, {
          skipAuthDelete: true,
          skipOrderGuards: true
        });
      } catch (purgeErr) {
        console.warn("[FIREBASE AUTH SYNC] Cascade delete warning:", purgeErr);
      } finally {
        setCurrentUser(null);
        setNeedsProfile(false);
        setPendingVerificationEmail("");
        isVerifyingNewSignupRef.current = false;
        setIsVerifyingNewSignup(false);
        setAuthLoading(false);
        await signOut(auth).catch(() => {});
        purgingDeletedAuthUidRef.current = null;
      }
      return true;
    };

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        if (!currentUserRef.current && !needsProfileRef.current && isInitialSplashActiveRef.current) {
          setAuthLoading(true);
        }
        const wasDeletedInAuth = await checkAndCascadeIfAuthDeleted(user);
        if (wasDeletedInAuth) {
          return;
        }
        unsubscribeProfile = onSnapshot(doc(db, "users", user.uid), async (docSnap) => {
          if (docSnap.exists()) {
            let profile = docSnap.data() as UserProfile;

            // Flush deferred verification status if user verified while Firestore was over quota
            if (hasPendingVerifySync(user.uid)) {
              if (!profile.isVerified) {
                profile = { ...profile, isVerified: true, emailVerified: true } as UserProfile;
                updateDoc(doc(db, "users", user.uid), {
                  isVerified: true,
                  emailVerified: true
                }).then(() => setPendingVerifySync(user.uid, false)).catch(() => {});
              } else {
                setPendingVerifySync(user.uid, false);
              }
            }
            if (hasPendingProfileSync(user.uid)) {
              setPendingProfileSync(user.uid, false);
            }
            
            // ADMIN CHECK: Only grant admin privileges AFTER email verification succeeds, and never override a Seller account's role
            const adminEmails = [
              "tommzypolaris@gmail.com",
              "fashinaayomide2005@gmail.com",
              "fashinaayomide@2005@gmail.com",
              "fashinaayomide12005@gmail.com"
            ];
            const cleanProfileEmail = (profile.email || "").trim().toLowerCase();
            if (
              cleanProfileEmail &&
              adminEmails.includes(cleanProfileEmail) &&
              profile.isVerified === true &&
              (profile.role as string) !== "admin" &&
              profile.role !== "seller" &&
              profile.activeRole !== "seller"
            ) {
              profile = { ...profile, role: "admin", profileCompleted: true } as UserProfile;
              updateDoc(doc(db, "users", profile.uid), { role: "admin", profileCompleted: true }).catch(() => {});
            }

            if (profile.hibernatedUntil) {
              const until = new Date(profile.hibernatedUntil);
              if (until > new Date()) {
                setHibernationMessage(`Your account is hibernated until ${until.toLocaleDateString()}.`);
              } else {
                updateDoc(doc(db, "users", user.uid), { hibernatedUntil: null });
                if (profile.role === "seller") {
                  const productsQ = query(collection(db, "products"), where("sellerId", "==", user.uid));
                  getDocs(productsQ).then(snap => {
                    snap.docs.forEach(pDoc => {
                      if (pDoc.data().isHibernated) {
                        updateDoc(pDoc.ref, { isHibernated: false });
                      }
                    });
                  });
                }
              }
            }

            // Sync and auto-restore bankDetails from localStorage if missing in Firestore snapshot
            if (profile.uid) {
              const cacheKey = `shopiversity_bank_details_${profile.uid}`;
              if (profile.bankDetails?.accountNumber) {
                try {
                  localStorage.setItem(cacheKey, JSON.stringify(profile.bankDetails));
                } catch (e) {}
              } else {
                try {
                  const cachedBank = localStorage.getItem(cacheKey);
                  if (cachedBank) {
                    const parsedBank = JSON.parse(cachedBank);
                    if (parsedBank?.accountNumber && parsedBank?.bankName) {
                      profile = { ...profile, bankDetails: parsedBank };
                      updateDoc(doc(db, "users", profile.uid), { bankDetails: parsedBank }).catch(() => {});
                    }
                  }
                } catch (e) {}
              }
            }

            setCachedUserProfile(profile);

            // If the user has not completed verification, do NOT log them in yet — keep them pinned on the verification screen!
            if (profile.isVerified === false || (!profile.isVerified && profile.role !== "admin")) {
              setCurrentUser(null);
              if (profile.state === "Logistics Partner" || profile.role === "logistics") {
                setActiveTab("logistics");
              } else {
                const pendingEmail = (profile.email || user.email || "").trim().toLowerCase();
                if (typeof window !== "undefined" && pendingEmail) {
                  sessionStorage.setItem("shopiversity_verifying_email", pendingEmail);
                  sessionStorage.setItem("shopiversity_chosen_role", profile.role === "seller" ? "seller" : "buyer");
                  sessionStorage.setItem("shopiversity_auth_mode", "signup");
                }
                setPendingVerificationEmail(pendingEmail);
                isVerifyingNewSignupRef.current = true;
                setIsVerifyingNewSignup(true);
                setAuthMode("signup");
                if (activeTabRef.current !== "signup" && activeTabRef.current !== "auth") {
                  setActiveTab("signup");
                }
              }
              setAuthLoading(false);
              setNeedsProfile(false);
              return;
            }

            setPendingVerificationEmail("");
            if (typeof window !== "undefined") {
              sessionStorage.removeItem("shopiversity_verifying_email");
            }
            setCurrentUser(profile);

            const chosenSessionRole = typeof window !== "undefined" ? sessionStorage.getItem("shopiversity_chosen_role") : null;
            const isSellerAccount = profile.role === "seller" || profile.activeRole === "seller" || (profile.role !== "buyer" && chosenSessionRole === "seller");

            if (profile.state === "Logistics Partner" || profile.role === "logistics") {
              setActiveTab("logistics");
              initialTabSet.current = true;
            } else if (isSellerAccount) {
              setActiveRole("seller");
              if (!isVerifyingNewSignupRef.current && (!initialTabSet.current || activeTabRef.current === "auth" || activeTabRef.current === "signup")) {
                setActiveTab("dashboard");
                initialTabSet.current = true;
              }
            } else {
              setActiveRole("buyer");
              if (!isVerifyingNewSignupRef.current && (!initialTabSet.current || activeTabRef.current === "auth" || activeTabRef.current === "signup")) {
                setActiveTab("market");
                initialTabSet.current = true;
              }
            }

            if (!initialTabSet.current) {
              if (isVerifyingNewSignupRef.current) {
                // Keep signup verification screen active until handleGoToMarket completes
              } else if (profile.state === "Logistics Partner" || profile.role === "logistics" || activeTabRef.current === "logistics") {
                setActiveTab("logistics");
                initialTabSet.current = true;
              }
              if (profile.theme) {
                setIsDarkMode(profile.theme === "dark");
              }
            }
            setAuthLoading(false);
            setNeedsProfile(false);
          } else {
            // User document does not exist in Firestore yet!
            if (user && user.uid) {
              // If signup/verification happened locally while Firestore was over quota, sync the cached profile now
              const pendingProfile = hasPendingProfileSync(user.uid) ? getCachedUserProfile(user.uid) : null;
              if (pendingProfile) {
                const syncedProfile: UserProfile = {
                  ...pendingProfile,
                  isVerified: Boolean(pendingProfile.isVerified || hasPendingVerifySync(user.uid) || user.emailVerified)
                };
                try {
                  await setDoc(doc(db, "users", user.uid), syncedProfile, { merge: true });
                  setPendingProfileSync(user.uid, false);
                  setPendingVerifySync(user.uid, false);
                  setCachedUserProfile(syncedProfile);
                  if (syncedProfile.isVerified) {
                    setCurrentUser(syncedProfile);
                    setAuthLoading(false);
                    return;
                  }
                } catch (syncErr) {
                  console.warn("Deferred profile sync notice:", syncErr);
                }
              }

              // Check if they are a logistics partner first
              let isLogistics = activeTabRef.current === "logistics";
              try {
                const logCompSnap = await getDoc(doc(db, "logistics_companies", user.uid));
                if (logCompSnap.exists()) {
                  isLogistics = true;
                  const logData = logCompSnap.data();
                  const autoLogisticsProfile: UserProfile = {
                    uid: user.uid,
                    displayName: logData.companyName || user.displayName || "Logistics Partner",
                    username: ((logData.companyName || user.displayName || "logistics").replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "logistics") + "_logistics",
                    email: user.email?.toLowerCase() || logData.email || "",
                    phoneNumber: logData.phoneNumber || user.phoneNumber || "",
                    gender: "other",
                    role: "logistics" as any,
                    activeRole: "logistics" as any,
                    schoolType: "",
                    schoolName: "",
                    state: "Logistics Partner",
                    city: "",
                    deliveryAddress: logData.officeAddress || "",
                    isVerified: true,
                    isSuspended: false,
                    reportCount: 0,
                    createdAt: new Date().toISOString(),
                    verificationIdUrl: "",
                    profileCompleted: true
                  };
                  await setDoc(doc(db, "users", user.uid), autoLogisticsProfile);
                  setCachedUserProfile(autoLogisticsProfile);
                  setCurrentUser(autoLogisticsProfile);
                  setActiveTab("logistics");
                  setAuthLoading(false);
                  return;
                }
              } catch (logErr) {
                console.warn("Logistics check in autoProfile notice:", logErr);
              }

              // If currently signing up on the logistics tab, wait for LogisticsHub to write the profile
              if (isLogistics) {
                setAuthLoading(false);
                return;
              }

              // Check if user is actively in the signup or verification flow (never auto-provision during Sign In)
              const authModeStorage = typeof window !== "undefined" ? sessionStorage.getItem("shopiversity_auth_mode") : null;
              const hasVerifyingSession = typeof window !== "undefined" && Boolean(sessionStorage.getItem("shopiversity_verifying_email"));
              const isInSignupSession = typeof window !== "undefined" && (
                sessionStorage.getItem("shopiversity_in_signup") === "true" ||
                sessionStorage.getItem("shopiversity_google_pending") === "true"
              );
              const isRecentAuth = Boolean(
                user.metadata.creationTime &&
                (Date.now() - new Date(user.metadata.creationTime).getTime() < 300000)
              );
              const isExplicitSignup = isInSignupSession || hasVerifyingSession || isVerifyingNewSignupRef.current || (
                authModeStorage !== "login" && (
                  activeTabRef.current === "signup" ||
                  (activeTabRef.current === "auth" && isRecentAuth)
                )
              );

              if (isExplicitSignup) {
                if (typeof window !== "undefined" && sessionStorage.getItem("shopiversity_google_pending") === "true") {
                  try {
                    const googleName = user.displayName || "Shopiversity Member";
                    const fallbackRole = (sessionStorage.getItem("shopiversity_chosen_role") as any) || "buyer";
                    const isGoogleProvider = user.providerData?.some(p => p.providerId === "google.com") || false;
                    const hasPwdProvider = user.providerData?.some(p => p.providerId === "password") || false;
                    const fallbackProfile: UserProfile = {
                      uid: user.uid,
                      displayName: googleName,
                      username: generateSmartUsername(googleName),
                      email: (user.email || "").trim().toLowerCase(),
                      phoneNumber: user.phoneNumber || "",
                      role: fallbackRole,
                      activeRole: fallbackRole,
                      strikeCount: 0,
                      isVerified: false,
                      isSuspended: false,
                      reportCount: 0,
                      createdAt: new Date().toISOString(),
                      verificationIdUrl: "",
                      profileCompleted: false,
                      authProvider: isGoogleProvider && !hasPwdProvider ? "google" : "password",
                      isGoogleAccount: isGoogleProvider,
                      hasPassword: hasPwdProvider
                    };
                    try {
                      await setDoc(doc(db, "users", user.uid), fallbackProfile, { merge: true });
                    } catch (writeErr) {
                      if (isFirestoreQuotaError(writeErr)) {
                        setPendingProfileSync(user.uid, true);
                      } else {
                        throw writeErr;
                      }
                    }
                    setCachedUserProfile(fallbackProfile);
                    const pendingFallbackEmail = (fallbackProfile.email || "").trim().toLowerCase();
                    if (pendingFallbackEmail) {
                      sessionStorage.setItem("shopiversity_verifying_email", pendingFallbackEmail);
                      sessionStorage.setItem("shopiversity_chosen_role", fallbackRole);
                      sessionStorage.setItem("shopiversity_auth_mode", "signup");
                    }
                    setCurrentUser(null);
                    setPendingVerificationEmail(pendingFallbackEmail);
                    isVerifyingNewSignupRef.current = true;
                    setIsVerifyingNewSignup(true);
                    setAuthMode("signup");
                    if (activeTabRef.current !== "signup" && activeTabRef.current !== "auth") {
                      setActiveTab("signup");
                    }
                    sessionStorage.removeItem("shopiversity_google_pending");
                  } catch (autoErr) {
                    console.warn("Auto-provision profile notice:", autoErr);
                  }
                }
                setAuthLoading(false);
                return;
              }

              // If on AuthPage in login mode, let AuthPage handle deleting/signing out unregistered Google user cleanly
              if ((activeTabRef.current === "auth" || activeTabRef.current === "signup") && authModeStorage === "login") {
                setAuthLoading(false);
                return;
              }

              // This account was deleted from Firebase while actively browsing!
              // Sign out immediately so deleted users cannot persist on the website
              console.log(`[AUTH SYNC] Account ${user.uid} does not exist in Firebase Firestore (deleted). Terminating session.`);
              removeCachedUserProfile(user.uid);
              setCurrentUser(null);
              setAuthLoading(false);
              signOut(auth).catch(() => {});
            } else {
              setCurrentUser(null);
              setAuthLoading(false);
            }
          }
        }, (error) => {
          setAuthLoading(false);
          if (isFirestoreQuotaError(error)) {
            setFirestoreQuotaExceeded(true);
            console.warn("Firestore daily read quota exceeded while subscribing to user profile; using cached fallback.");
            const cachedProfile = getCachedUserProfile(user.uid);
            const verifiedViaAuthOrCache = Boolean(
              cachedProfile?.isVerified ||
              user.emailVerified ||
              hasPendingVerifySync(user.uid)
            );
            if (cachedProfile && verifiedViaAuthOrCache) {
              const recovered: UserProfile = { ...cachedProfile, isVerified: true };
              setCachedUserProfile(recovered);
              setPendingVerificationEmail("");
              setCurrentUser(recovered);
              const isSellerAcc = recovered.role === "seller" || recovered.activeRole === "seller";
              if (recovered.state === "Logistics Partner" || recovered.role === "logistics") {
                setActiveTab("logistics");
              } else if (isSellerAcc) {
                setActiveRole("seller");
                if (!isVerifyingNewSignupRef.current && (!initialTabSet.current || activeTabRef.current === "auth" || activeTabRef.current === "signup")) {
                  setActiveTab("dashboard");
                  initialTabSet.current = true;
                }
              } else {
                setActiveRole("buyer");
                if (!isVerifyingNewSignupRef.current && (!initialTabSet.current || activeTabRef.current === "auth" || activeTabRef.current === "signup")) {
                  setActiveTab("market");
                  initialTabSet.current = true;
                }
              }
            } else if (cachedProfile && !cachedProfile.isVerified) {
              const pendingEmail = (cachedProfile.email || user.email || "").trim().toLowerCase();
              setCurrentUser(null);
              if (pendingEmail) {
                sessionStorage.setItem("shopiversity_verifying_email", pendingEmail);
                sessionStorage.setItem("shopiversity_chosen_role", cachedProfile.role === "seller" ? "seller" : "buyer");
                sessionStorage.setItem("shopiversity_auth_mode", "signup");
                setPendingVerificationEmail(pendingEmail);
                isVerifyingNewSignupRef.current = true;
                setIsVerifyingNewSignup(true);
                setAuthMode("signup");
                if (activeTabRef.current !== "signup" && activeTabRef.current !== "auth") {
                  setActiveTab("signup");
                }
              }
            } else if (!cachedProfile && user.emailVerified) {
              const chosenSessionRole = typeof window !== "undefined" ? sessionStorage.getItem("shopiversity_chosen_role") : null;
              const fallbackRole: "buyer" | "seller" = chosenSessionRole === "seller" ? "seller" : "buyer";
              const cleanEmail = (user.email || "").trim().toLowerCase();
              const synthesized: UserProfile = {
                uid: user.uid,
                displayName: user.displayName || (cleanEmail ? cleanEmail.split("@")[0] : "Student"),
                username: generateSmartUsername(user.displayName || cleanEmail || "User"),
                email: cleanEmail,
                phoneNumber: user.phoneNumber || "",
                role: fallbackRole,
                activeRole: fallbackRole,
                isVerified: true,
                isSuspended: false,
                reportCount: 0,
                createdAt: user.metadata?.creationTime || new Date().toISOString(),
                profileCompleted: false
              };
              setCachedUserProfile(synthesized);
              setPendingVerificationEmail("");
              setCurrentUser(synthesized);
              setActiveRole(fallbackRole);
              if (!isVerifyingNewSignupRef.current && (!initialTabSet.current || activeTabRef.current === "auth" || activeTabRef.current === "signup")) {
                setActiveTab(fallbackRole === "seller" ? "dashboard" : "market");
                initialTabSet.current = true;
              }
            }
            return;
          }
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
        });

        const cachedNotifs = getCachedNotifications<Notification>(user.uid);
        if (cachedNotifs.length > 0) {
          setNotifications(cachedNotifs);
        }

        const notifQ = query(
          collection(db, "notifications"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc"),
          limit(40)
        );
        unsubscribeNotifs = onSnapshot(notifQ, (snapshot) => {
          const notifs = Array.from(new Map(snapshot.docs.map(doc => {
            const d = { id: doc.id, ...doc.data() } as Notification;
            return [d.id, d];
          })).values());
          setNotifications(notifs);
          setCachedNotifications(user.uid, notifs);
        }, (error) => {
          if (!auth.currentUser) return;
          if (isFirestoreQuotaError(error)) {
            setFirestoreQuotaExceeded(true);
            notifyFirestoreQuotaExceeded("notifications");
            return;
          }
          handleFirestoreError(error, OperationType.LIST, "notifications");
        });
      } else {
        if (unsubscribeProfile) {
          unsubscribeProfile();
          unsubscribeProfile = null;
        }
        if (unsubscribeNotifs) {
          unsubscribeNotifs();
          unsubscribeNotifs = null;
        }
        setCurrentUser(null);
        const stillVerifyingEmail = typeof window !== "undefined" ? sessionStorage.getItem("shopiversity_verifying_email") : null;
        if (!stillVerifyingEmail) {
          setPendingVerificationEmail("");
          isVerifyingNewSignupRef.current = false;
          setIsVerifyingNewSignup(false);
        }
        setAuthLoading(false);
        setNotifications([]);
      }
    });

    const cachedInitialProducts = getCachedProducts();
    if (cachedInitialProducts.length > 0) {
      setProducts(cachedInitialProducts);
      setLoading(false);
    }
    const productsQ = query(collection(db, "products"), limit(150)); 
    const unsubscribeProducts = onSnapshot(productsQ, (snapshot) => {
      const productsData = Array.from(new Map(snapshot.docs.map(doc => {
        const d = { id: doc.id, ...doc.data() } as Product;
        return [d.id, d];
      })).values())
        .filter(p => !p.isDeleted && !p.isDraft && p.status !== "draft")
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); 
      setProducts(productsData);
      setCachedProducts(productsData);
      setLoading(false);
    }, (error) => {
      setLoading(false);
      if (isFirestoreQuotaError(error)) {
        setFirestoreQuotaExceeded(true);
        const cachedProducts = getCachedProducts();
        if (cachedProducts.length > 0) {
          setProducts(cachedProducts);
        }
        console.warn("Firestore daily read quota exceeded while subscribing to products; using cached catalog.");
        return;
      }
      handleFirestoreError(error, OperationType.LIST, "products");
    });

    const oneDollarQ = query(collection(db, "oneDollarListings"), where("status", "==", "approved"), limit(24));
    const unsubscribeOneDollar = onSnapshot(oneDollarQ, (snapshot) => {
      const docs = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() } as OneDollarListing))
        .filter(item => item.status === "approved" && item.isActive && item.stock > 0)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setOneDollarListings(docs);
      setCachedOneDollarListings(docs);
    }, (error) => {
      if (isFirestoreQuotaError(error)) {
        return;
      }
      console.warn("One Dollar listings subscription notice:", error);
    });

    // Fetch sellers once with a 15-minute cache instead of opening a real-time onSnapshot listener on the entire users collection
    // (Subscribing to all users on every page load was rapidly exhausting the 50,000 daily free-tier Firestore reads)
    let isUnmounted = false;
    const { sellers: cachedSellers, isFresh: sellersCacheFresh } = getCachedSellers();
    if (cachedSellers.length > 0) {
      const validCachedSellers = cachedSellers.filter(u => hasValidSellerStorefront(u));
      const invalidCachedIds = cachedSellers
        .filter(u => u.uid && !hasValidSellerStorefront(u))
        .map(u => u.uid);
      setSellers(validCachedSellers);
      setExistingUserIds(new Set(validCachedSellers.map(u => u.uid).filter(Boolean)));
      if (invalidCachedIds.length > 0) {
        setInvalidSellerIds(prev => new Set([...prev, ...invalidCachedIds]));
      }
      setUsersLoaded(true);
    }
    if (!sellersCacheFresh) {
      getDocs(query(collection(db, "users"), where("role", "in", ["seller", "both"]))).then((snapshot) => {
        if (isUnmounted) return;
        const allFetchedSellers = snapshot.docs
          .map(docSnap => ({ uid: docSnap.id, ...docSnap.data() } as UserProfile));
        const validSellersList = allFetchedSellers.filter(u => hasValidSellerStorefront(u));
        const noStorefrontIds = allFetchedSellers
          .filter(u => u.uid && !hasValidSellerStorefront(u))
          .map(u => u.uid);

        setSellers(validSellersList);
        setExistingUserIds(new Set(validSellersList.map(u => u.uid).filter(Boolean)));
        if (noStorefrontIds.length > 0) {
          setInvalidSellerIds(prev => new Set([...prev, ...noStorefrontIds]));
        }
        setCachedSellers(validSellersList);
        setUsersLoaded(true);
      }).catch((error) => {
        if (isUnmounted) return;
        setUsersLoaded(true);
        if (isFirestoreQuotaError(error)) {
          setFirestoreQuotaExceeded(true);
          console.warn("Firestore daily read quota exceeded while loading sellers for storefront search.");
          return;
        }
        console.error("Error loading sellers for storefront search:", error);
      });
    }

    // Live Watchdog: Detect immediately when the currently signed-in account is deleted in Firebase Console -> Authentication -> Users
    // (Uses Identity Toolkit accounts:lookup — zero Firestore reads; full offline audit runs on-demand via Admin Sync Firebase Auth button)
    const runActiveAuthCheck = () => {
      const activeAuthUser = auth.currentUser;
      if (activeAuthUser) {
        void checkAndCascadeIfAuthDeleted(activeAuthUser);
      }
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        runActiveAuthCheck();
      }
    };
    window.addEventListener("focus", runActiveAuthCheck);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    const authSyncInterval = window.setInterval(runActiveAuthCheck, 20000);

    const handleAccountDeleted = (e: any) => {
      const deletedUid = e.detail?.uid;
      if (!deletedUid) return;
      console.log(`[ACCOUNT DELETED] Purging all website state for user: ${deletedUid}`);
      removeCachedUserProfile(deletedUid);
      setProducts(prev => prev.filter(p => p.sellerId !== deletedUid));
      setSellers(prev => prev.filter(s => s.uid !== deletedUid));
      setExistingUserIds(prev => {
        const next = new Set(prev);
        next.delete(deletedUid);
        return next;
      });
      if (currentUserRef.current?.uid === deletedUid || auth.currentUser?.uid === deletedUid) {
        setCurrentUser(null);
        setActiveRole("buyer");
        setActiveTab("market");
        signOut(auth).catch(() => {});
      }
    };
    window.addEventListener('account-deleted', handleAccountDeleted);

    return () => {
      isUnmounted = true;
      window.removeEventListener('view-product-market', handleViewProduct);
      window.removeEventListener('view-category', handleViewCategory);
      window.removeEventListener('view-product-detail', handleViewProductDetail);
      window.removeEventListener('view-seller-store', handleViewSellerStore);
      window.removeEventListener('open-chat', handleOpenChat);
      window.removeEventListener('add-to-cart', handleAddToCartEvent);
      window.removeEventListener('switch-active-role', handleSwitchRole);
      window.removeEventListener('edit-seller-product', handleEditSellerProduct);
      window.removeEventListener('switch-tab', handleSwitchTabEvent);
      window.removeEventListener('account-deleted', handleAccountDeleted);
      window.removeEventListener("focus", runActiveAuthCheck);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.clearInterval(authSyncInterval);
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
      if (unsubscribeNotifs) unsubscribeNotifs();
      unsubscribeProducts();
      unsubscribeOneDollar();
      window.removeEventListener('keydown', handleAdminKeyCombo);
    };
  }, []);

  const filteredProducts = Array.from(new Map<string, Product>(products.filter((p) => {
    // 3-Day stock refill window: if stock reached 0, seller has 3 days (72 hours) to refill before removal from marketplace
    const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
    const isOutOfStockOver3Days = (p.stock !== undefined && p.stock <= 0) && (
      p.outOfStockAt 
        ? (Date.now() - new Date(p.outOfStockAt).getTime() > THREE_DAYS_MS) 
        : false
    );

    if (p.isDeleted || p.isDraft || p.status === "draft" || p.isHibernated || p.isArchived || isOutOfStockOver3Days) return false;

    // Never show products whose seller account is missing or lacks a valid storefront
    if (!p.sellerId) return false;
    if (invalidSellerIds.has(p.sellerId) || missingSellerIds.has(p.sellerId)) return false;
    if (usersLoaded && sellersMap[p.sellerId] && !hasValidSellerStorefront(sellersMap[p.sellerId])) return false;
    if (usersLoaded && checkedSellerIdsRef.current.has(p.sellerId) && !sellersMap[p.sellerId]) return false;
    if (existingUserIds.size > 0 && !existingUserIds.has(p.sellerId) && checkedSellerIdsRef.current.has(p.sellerId)) return false;
    
    // Services should not be in general marketplace, only on Services tab
    if (p.type === "service") return false;

    // Strictly exclude logistics from marketplace storefront products
    if (p.category === "Logistics & Errands" || p.category === "Logistics") return false;
    
    const STOP_WORDS = new Set([
      "i", "want", "to", "find", "get", "need", "search", "for", "please", "buy", "a", "an", "the", "some", "any", "is", "are", "of", "in", "on", "at", "by", "with", "from", "and", "or"
    ]);

    const matchesSearch = (() => {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      
      const queryWords = q
        .split(/[\s,.-]+/)
        .map(w => w.trim())
        .filter(w => w && !STOP_WORDS.has(w));
        
      const finalQueryWords = queryWords.length > 0 
        ? queryWords 
        : q.split(/[\s,.-]+/).map(w => w.trim()).filter(Boolean);
        
      if (finalQueryWords.length === 0) return true;
      
      const targetText = `${p.name} ${p.description || ""} ${p.category || ""} ${p.sellerName || ""}`.toLowerCase();
      
      const matchesAllWords = finalQueryWords.every(word => targetText.includes(word));
      const hasSellerOwnershipMatch = (viewingSellerId ? true : (currentUser ? p.sellerId !== currentUser.uid : true));
      return matchesAllWords && hasSellerOwnershipMatch;
    })();
    const matchesCategory = filterCategory === "All" || p.category === filterCategory;
    const matchesVendor = filterVendor === "All" || p.sellerName === filterVendor;
    const matchesCondition = filterCondition === "All" || p.condition === filterCondition;
    const matchesSeller = !viewingSellerId || p.sellerId === viewingSellerId;
    
    let matchesPrice = true;
    if (filterPriceRange !== "All") {
      const [min, max] = filterPriceRange.split("-").map(Number);
      if (max) {
        matchesPrice = p.price >= min && p.price <= max;
      } else {
        matchesPrice = p.price >= min;
      }
    }

    return matchesSearch && matchesCategory && matchesVendor && matchesCondition && matchesPrice && matchesSeller;
  }).map(p => [p.id, p])).values());

  const vendorNames = Array.from(new Set(filteredProducts.map(p => p.sellerName).filter(Boolean))).sort();
  const categories = ALL_CATEGORIES;

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, "notifications", id), { isRead: true });
    } catch (error) {
      if (isFirestoreQuotaError(error)) {
        notifyFirestoreQuotaExceeded(`notifications/${id}`);
        return;
      }
      handleFirestoreError(error, OperationType.UPDATE, `notifications/${id}`);
    }
  };

  const toggleRole = async () => {
    // Role switching is strictly disabled. Buyer and Seller accounts are separate.
    return;
  };

  React.useEffect(() => {
    if (currentUser && pendingCartItem) {
      const { product, menuItem, ticketTier, formResponses, previousTab } = pendingCartItem;
      handleAddToCart(product, menuItem, ticketTier, formResponses);
      setActiveTab(previousTab || "market");
      setPendingCartItem(null);
    }
  }, [currentUser, pendingCartItem]);

  React.useEffect(() => {
    if (currentUser && pendingOneDollarCartItem) {
      const { listing, goToCartImmediately, previousTab } = pendingOneDollarCartItem;
      void handleAddOneDollarToCart(listing, goToCartImmediately);
      if (!goToCartImmediately) {
        setActiveTab(previousTab || "one-dollar");
      }
      setPendingOneDollarCartItem(null);
    }
  }, [currentUser, pendingOneDollarCartItem]);

  const handleAddOneDollarToCart = async (listing: OneDollarListing, goToCartImmediately = true) => {
    if (!currentUser) {
      setPendingOneDollarCartItem({
        listing,
        goToCartImmediately,
        previousTab: activeTab
      });
      setAuthMode("signup");
      setActiveTab("signup");
      return;
    }

    if (currentUser.uid === listing.sellerId) {
      alert("You cannot purchase your own One Dollar listing.");
      return;
    }

    if (listing.stock <= 0) {
      alert("This One Dollar item is currently out of stock.");
      return;
    }

    if (!oneDollarRate || !oneDollarRate.oneDollarNgnPrice) {
      void refreshOneDollarRate();
      alert("Live USD to NGN conversion rate is still loading. Please try again in a moment.");
      return;
    }

    const now = Date.now();
    const itemUsd = clampOneDollarUsd(listing.usdPrice);
    const itemNgn = computeOneDollarNgn(itemUsd, oneDollarRate) || oneDollarRate.oneDollarNgnPrice;
    const existingOneDollar = cart.find(
      (item) => !isCartItemExpired(item, now) && item.isOneDollar && item.productId === listing.productId
    );
    if (existingOneDollar && existingOneDollar.quantity >= listing.stock) {
      if (goToCartImmediately) {
        setActiveTab("cart");
      }
      triggerDynamicIsland(`Maximum inventory (${listing.stock}) already in your cart`);
      return;
    }

    setCart((prev) => {
      const activePrev = pruneExpiredCartItems(prev, now);
      const existing = activePrev.find((item) => item.isOneDollar && item.productId === listing.productId);
      if (existing) {
        const nextQty = Math.min(listing.stock, existing.quantity + 1);
        const preservedAddedAt = parseCartAddedAt(existing.addedAt) ?? now;
        return activePrev.map((item) =>
          (item.isOneDollar && item.productId === listing.productId)
            ? {
                ...item,
                quantity: nextQty,
                maxStock: listing.stock,
                price: itemNgn,
                usdPrice: itemUsd,
                exchangeRateUsdToNgn: oneDollarRate.rate,
                exchangeRateSource: oneDollarRate.source,
                exchangeRateUpdatedAt: oneDollarRate.updatedAt,
                addedAt: preservedAddedAt
              }
            : item
        );
      }
      return [
        ...activePrev,
        {
          productId: listing.productId,
          name: listing.productName,
          price: itemNgn,
          quantity: 1,
          maxStock: listing.stock,
          sellerId: listing.sellerId,
          imageUrl: listing.imageUrl,
          deliveryOptions: { delivery: true, pickup: true },
          type: "good",
          addedAt: now,
          isOneDollar: true,
          oneDollarListingId: listing.id,
          usdPrice: itemUsd,
          exchangeRateUsdToNgn: oneDollarRate.rate,
          exchangeRateSource: oneDollarRate.source,
          exchangeRateUpdatedAt: oneDollarRate.updatedAt
        }
      ];
    });

    if (goToCartImmediately) {
      setActiveTab("cart");
    }
    triggerDynamicIsland(`Added ${formatUsd(itemUsd)} deal to Cart! 🛒`);
  };

  const handleAddToCart = async (product: Product, menuItem?: any, ticketTier?: any, formResponses?: Record<string, string>) => {
    if (!currentUser) {
      setPendingCartItem({
        product,
        menuItem,
        ticketTier,
        formResponses,
        previousTab: activeTab
      });
      setAuthMode("signup");
      setActiveTab("signup");
      return;
    }

    if (currentUser && currentUser.uid === product.sellerId) {
      alert("You cannot purchase your own product.");
      return;
    }

    const itemQuantity = menuItem?.quantity || 1;
    const maxStock = resolveAvailableStockForProduct(product, menuItem, ticketTier);
    if (maxStock !== undefined && maxStock <= 0) {
      triggerDynamicIsland("This item is currently out of stock.");
      return;
    }

    const matchesTarget = (item: CartItem) =>
      !item.isOneDollar &&
      item.productId === product.id &&
      (menuItem ? item.menuItemId === (menuItem.id || menuItem.name) : !item.menuItemId) &&
      (ticketTier ? item.ticketTierId === (ticketTier.id || ticketTier.name) : !item.ticketTierId);

    const now = Date.now();
    const existingInCart = cart.find((item) => !isCartItemExpired(item, now) && matchesTarget(item));
    if (existingInCart && maxStock !== undefined && existingInCart.quantity >= maxStock) {
      triggerDynamicIsland(`Maximum inventory (${maxStock}) already in your cart`);
      return;
    }

    setCart((prev) => {
      const activePrev = pruneExpiredCartItems(prev, now);
      const existing = activePrev.find(matchesTarget);
      if (existing) {
        const nextQty =
          maxStock !== undefined
            ? Math.min(maxStock, existing.quantity + itemQuantity)
            : existing.quantity + itemQuantity;
        const preservedAddedAt = parseCartAddedAt(existing.addedAt) ?? now;
        return activePrev.map((item) =>
          matchesTarget(item)
            ? {
                ...item,
                quantity: nextQty,
                ...(maxStock !== undefined ? { maxStock } : {}),
                formResponses: formResponses || item.formResponses,
                addedAt: preservedAddedAt
              }
            : item
        );
      }
      const initialQty =
        maxStock !== undefined ? Math.min(maxStock, itemQuantity) : itemQuantity;
      return [
        ...activePrev,
        {
          productId: product.id,
          name: menuItem ? `${product.name} - ${menuItem.name}` : (ticketTier ? `${product.name} (${ticketTier.name})` : product.name),
          price: menuItem ? menuItem.price : (ticketTier ? ticketTier.price : product.price),
          quantity: initialQty,
          ...(maxStock !== undefined ? { maxStock } : {}),
          sellerId: product.sellerId,
          imageUrl: menuItem?.imageUrl || ticketTier?.imageUrl || product.imageUrl,
          deliveryOptions: product.deliveryOptions,
          menuItemId: menuItem?.id || menuItem?.name,
          menuItemName: menuItem?.name,
          ticketTierId: ticketTier?.id || ticketTier?.name,
          ticketTierName: ticketTier?.name,
          measureType: menuItem?.measureType,
          measureAmount: menuItem?.measureAmount,
          cheapDataHubPlanId: menuItem?.cheapDataHubPlanId,
          cheapDataHubNetworkCode: menuItem?.cheapDataHubNetworkCode,
          formResponses: formResponses,
          type: product.type || "good",
          addedAt: now,
        },
      ];
    });
    setActiveTab("cart");
    triggerDynamicIsland("Added to Cart! 🛒");

    // Analytics: Log add to cart
    if (currentUser && currentUser.uid !== product.sellerId) {
      try {
        await addDoc(collection(db, "analytics"), {
          productId: product.id,
          sellerId: product.sellerId,
          type: "cart",
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        console.error("Failed to log cart analytics", err);
      }
    }

    // Notify seller that someone added their product to cart
    if (currentUser && currentUser.uid !== product.sellerId) {
      try {
        await addDoc(collection(db, "notifications"), {
          userId: product.sellerId,
          title: "Product in Cart!",
          message: `Someone added ${product.name} to their cart.`,
          type: "cart",
          isRead: false,
          createdAt: new Date().toISOString()
        });
      } catch (error) {
        if (isFirestoreQuotaError(error)) {
          notifyFirestoreQuotaExceeded("notifications/cart");
        } else {
          handleFirestoreError(error, OperationType.CREATE, "notifications/cart");
        }
      }
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.isRead);
    const promises = unread.map(n => updateDoc(doc(db, "notifications", n.id), { isRead: true }));
    await Promise.all(promises);
  };

  const handleLogout = () => {
    const wasAdmin = isUserAdmin || currentUser?.role === "admin" || currentUser?.email === "fashinaayomide2005@gmail.com" || currentUser?.email === "fashinaayomide@2005@gmail.com";
    if (wasAdmin) {
      try {
        // Automatically dispatch fresh login credentials and gateway link to email upon logout
        fetch("/api/admin/renew-login-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            adminEmail: "fashinaayomide2005@gmail.com",
            adminName: currentUser?.displayName || "Executive Super-Admin",
            targetNotificationEmail: "fashinaayomide2005@gmail.com",
            triggerReason: "Automatic Fresh Credentials on Logout",
            origin: window.location.origin
          })
        }).catch((err) => console.warn("Auto logout renewal error:", err));
      } catch (e) {}
    }
    signOut(auth);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("shopiversity_chosen_role");
      sessionStorage.removeItem("shopiversity_verifying_email");
      sessionStorage.removeItem("shopiversity_in_signup");
      sessionStorage.removeItem("shopiversity_google_pending");
      sessionStorage.removeItem("shopiversity_auth_mode");
    }
    isVerifyingNewSignupRef.current = false;
    setIsVerifyingNewSignup(false);
    setPendingVerificationEmail("");
    setCart([]);
    setAuthRole("buyer");
    setActiveTab("market");
    setActiveRole("buyer");
    setViewingProduct(null);
    setViewingSellerId(null);
    setFilterCategory("All");
    setSearchQuery("");
  };

  const [isCancellingHibernation, setIsCancellingHibernation] = React.useState(false);

  const handleCancelHibernation = async () => {
    if (!auth.currentUser) return;
    setIsCancellingHibernation(true);
    try {
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        hibernatedUntil: null
      });

      // Reactivate products if seller
      if (currentUser?.role === "seller") {
        const productsQ = query(collection(db, "products"), where("sellerId", "==", auth.currentUser.uid));
        const productsSnap = await getDocs(productsQ);
        const updatePromises = productsSnap.docs.map(productDoc => updateDoc(productDoc.ref, { isHibernated: false }));
        await Promise.all(updatePromises);
      }
      
      // The onSnapshot listener in App.tsx will automatically update currentUser
      // and remove the hibernation screen.
    } catch (error) {
      console.error("Error cancelling hibernation:", error);
      alert("Failed to cancel hibernation. Please try again.");
    } finally {
      setIsCancellingHibernation(false);
    }
  };

  const isHibernated = currentUser?.hibernatedUntil && new Date(currentUser.hibernatedUntil) > new Date();

  // Dedicated EscrowPay return route renders immediately once auth initializes
  if (isEscrowReturnRoute && !authLoading) {
    return (
      <EscrowReturnPage
        currentUser={currentUser}
        onReturnToOrder={(orderId) => {
          leaveEscrowReturnRoute("orders", orderId, !currentUser);
        }}
        onSignInForOrder={(orderId) => {
          leaveEscrowReturnRoute("orders", orderId, true);
        }}
        onBackToMarketplace={() => {
          leaveEscrowReturnRoute("market");
        }}
        onContactSupport={() => {
          leaveEscrowReturnRoute("support");
        }}
      />
    );
  }

  // Premium branded Shopiversity preloader animation before the home page
  if (isInitialSplashActive || authLoading || (currentUser && loading)) {
    return (
      <ShopiversityLoader
        connectionError={connectionError}
        message="Loading your campus marketplace..."
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (isHibernated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-black p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-900 p-12 rounded-[3rem] shadow-2xl max-w-md w-full text-center border border-slate-100 dark:border-slate-800"
        >
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-lg shadow-blue-100 dark:shadow-none">
              <Moon className="w-12 h-12" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4 font-display tracking-tight">Account Hibernated</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-8">
              Your account is currently in hibernation mode and will be dormant until 
              <span className="text-blue-600 dark:text-blue-400 font-bold block mt-1">
                {new Date(currentUser.hibernatedUntil!).toLocaleDateString()}
              </span>
            </p>
          </div>
          <div className="space-y-3">
            <button 
              onClick={handleCancelHibernation}
              disabled={isCancellingHibernation}
              className="w-full h-16 bg-brand-gradient text-white rounded-2xl font-bold text-lg hover:shadow-lg hover:shadow-purple-200 dark:hover:shadow-purple-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isCancellingHibernation ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Reactivate Account
                </>
              )}
            </button>
            <button 
              onClick={handleLogout}
              className="w-full h-16 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-bold text-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (hibernationMessage) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[3rem] p-12 max-w-md w-full shadow-2xl"
        >
          <div className="w-20 h-20 bg-blue-50 rounded-[2rem] flex items-center justify-center text-blue-600 mx-auto mb-8">
            <Moon className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-4">Account Hibernated</h2>
          <p className="text-slate-500 font-medium leading-relaxed mb-8">
            {hibernationMessage}
          </p>
          <button 
            onClick={() => {
              signOut(auth);
              setHibernationMessage(null);
            }}
            className="w-full h-14 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all"
          >
            Sign Out
          </button>
        </motion.div>
      </div>
    );
  }

  // Suspension Block
  const isSuspensionExpired = currentUser?.suspendedUntil && new Date(currentUser.suspendedUntil).getTime() <= Date.now();
  if (currentUser && isSuspensionExpired && currentUser.isSuspended) {
    // Auto-lift expired temporary suspension
    updateDoc(doc(db, "users", currentUser.uid), {
      isSuspended: false,
      suspendedUntil: null
    }).catch(console.error);
  }

  if (currentUser && !isSuspensionExpired && (currentUser.isSuspended || (currentUser.strikeCount !== undefined && currentUser.strikeCount >= 3))) {
    const isPermanent = !currentUser.suspendedUntil || (currentUser.strikeCount !== undefined && currentUser.strikeCount >= 3) || currentUser.banType === "permanent";
    const untilDateFormatted = currentUser.suspendedUntil ? new Date(currentUser.suspendedUntil).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : null;

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-900 p-10 sm:p-12 rounded-[3rem] shadow-2xl max-w-md w-full border border-red-100 dark:border-red-900/20"
        >
            <div className="w-24 h-24 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-500 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-100 dark:shadow-none">
              <XCircle className="w-12 h-12" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Account {isPermanent ? "Banned" : "Suspended"}</h2>
            
            {!isPermanent && untilDateFormatted && (
              <div className="mb-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-300 text-xs font-black">
                <span>⏱ Active until: {untilDateFormatted}</span>
              </div>
            )}

            {currentUser.suspensionReason && (
              <div className="mb-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 text-left border border-slate-100 dark:border-slate-700">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Reason Provided:</p>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{currentUser.suspensionReason}</p>
              </div>
            )}

            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed mb-8">
              {currentUser.strikeCount !== undefined && currentUser.strikeCount >= 3 
                ? "Your account has been permanently suspended due to receiving 3 strikes for community terms violations."
                : (isPermanent 
                    ? "Your account has been permanently restricted for violating SHOPIVERSITY policies. If you believe this is a mistake, please reach out to SHOPIVERSITY support."
                    : `Your access has been temporarily paused. It will automatically reactivate on ${untilDateFormatted || "the scheduled release date"}.`)}
            </p>
          <button 
            onClick={handleLogout}
            className="w-full h-14 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl font-bold text-base hover:bg-slate-800 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-3 shadow-lg active:scale-98"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </motion.div>
      </div>
    );
  }

  // Determine if we should show AuthPage based on selected tab for non-logged users
  const restrictedTabs = ["settings", "orders", "notifications", "messages", "history", "dashboard", "analytics", "add-product", "products", "seller-one-dollar", "admin", "auth", "signup"];
  const isTabRestricted = restrictedTabs.includes(activeTab);
  
  const cleanCurrentEmail = (currentUser?.email || "").trim().toLowerCase();
  const isUserAdmin = currentUser?.role === "admin" || 
    cleanCurrentEmail === "tommzypolaris@gmail.com" || 
    cleanCurrentEmail === "fashinaayomide2005@gmail.com" || 
    cleanCurrentEmail === "fashinaayomide@2005@gmail.com" || 
    cleanCurrentEmail === "fashinaayomide12005@gmail.com" || 
    cleanCurrentEmail === "fashinaayomide@12005@gmail.com";

  // Double check admin access
  if (activeTab === "admin" && !isUserAdmin) {
    setActiveTab("market");
    return null;
  }

  const appLayout = (
    <div className="w-full h-full flex flex-row bg-white dark:bg-zinc-950 transition-colors duration-500 overflow-hidden relative font-sans">
      {/* Mobile Sliding Sidebar Menu */}
      <Sidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        role={currentUser?.role || "buyer"}
        activeRole={activeRole}
        onToggleRole={toggleRole}
        user={currentUser}
        onSelectAllCategories={() => setFilterCategory("All")}
      />

      {/* Main Viewport Workspace */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* WCAG Accessibility Skip Link */}
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[999999] focus:px-4 focus:py-2.5 focus:bg-[#ff6b00] focus:text-white focus:rounded-xl focus:font-bold focus:shadow-2xl focus:outline-none"
        >
          Skip to main content
        </a>

        {/* Mobile-optimized Header (minimal/hidden components on desktop) */}
        <motion.header
          initial={{ y: -15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md text-zinc-800 dark:text-zinc-100 border-b border-slate-100 dark:border-zinc-800/80 sticky top-0 z-[120] shrink-0 select-none font-sans px-2 sm:px-6 h-14 flex items-center justify-between gap-1.5 shadow-sm"
        >
          {/* Left: App title or dynamic back button */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {viewingSellerId || viewingProduct || (activeTab !== "market" && activeTab !== "search" && activeTab !== "messages" && activeTab !== "orders" && activeTab !== "settings" && activeTab !== "dashboard") ? (
              <button 
                onClick={handleGoBack} 
                className="p-1 sm:p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800/80 rounded-xl text-[#ff6b00] active:scale-90 transition-all cursor-pointer border-none shrink-0 touch-manipulation"
                title="Go Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800/80 rounded-xl text-[#ff6b00] active:scale-95 transition-all cursor-pointer border-none flex items-center justify-center shrink-0 touch-manipulation"
                title="Open Navigation Menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            <Logo 
              showText={false}
              onClick={handleLogoHomeClick} 
              className="ml-0.5 sm:ml-1 shrink-0 cursor-pointer" 
            />
          </div>

          {/* Center: Dynamic Title for sub-tabs */}

        {/* Dynamic Title for sub-tabs */}
        {activeTab === "settings" && (
          <span className="hidden sm:inline-block text-xs font-bold text-slate-700 dark:text-slate-300 font-sans truncate max-w-[160px] sm:max-w-none">
            {(currentUser?.state === "Logistics Partner" || currentUser?.role === "logistics")
              ? "Company Fleet Profile"
              : (settingsSubView === "edit" ? "Edit Profile" : "My Profile")}
          </span>
        )}
        {(activeTab === "auth" || activeTab === "signup") && (
          <span className="hidden sm:inline-block text-xs font-bold text-slate-700 dark:text-slate-300 font-sans">
            {authMode === "signup" ? "Create Account" : "Sign In"}
          </span>
        )}
        {activeTab === "orders" && (
          <span className="hidden sm:inline-block text-xs font-bold text-slate-700 dark:text-slate-300 font-sans">
            {activeRole === "seller" ? "Sales Orders" : "My Orders"}
          </span>
        )}
        {activeTab === "messages" && (
          <span className="hidden sm:inline-block text-xs font-bold text-slate-700 dark:text-slate-300 font-sans">Inbox Chats</span>
        )}
        {activeTab === "one-dollar" && (
          <span className="hidden sm:inline-block text-xs font-bold text-[#ff6b00] font-sans">One Dollar ($1)</span>
        )}

        {/* Right actions: One Dollar, Theme toggle, Cart / Sign Up, and Sign Out */}
        <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
          {currentUser?.state !== "Logistics Partner" && currentUser?.role !== "logistics" && (
            <button
              id="header-one-dollar-btn"
              type="button"
              onClick={() => {
                setPendingOneDollarListing(null);
                setViewingProduct(null);
                setViewingSellerId(null);
                setActiveTab("one-dollar");
              }}
              className={cn(
                "min-h-[32px] sm:min-h-[36px] px-2 sm:px-3 py-1 rounded-xl text-[11px] sm:text-xs font-black transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1 border",
                activeTab === "one-dollar"
                  ? "bg-[#ff6b00] text-white border-[#ff6b00] shadow-sm shadow-orange-500/20"
                  : "bg-orange-50/90 hover:bg-orange-100 dark:bg-orange-950/30 dark:hover:bg-orange-950/50 text-[#ff6b00] border-orange-200/80 dark:border-orange-800/50"
              )}
              title="Browse One Dollar ($1) Marketplace"
            >
              <DollarSign className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden min-[380px]:inline">One Dollar</span>
              <span className="min-[380px]:hidden">$1</span>
            </button>
          )}
          {(!currentUser || !auth.currentUser) ? (
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <button 
                id="header-signin-btn"
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    sessionStorage.removeItem("shopiversity_verifying_email");
                    sessionStorage.removeItem("shopiversity_in_signup");
                    sessionStorage.removeItem("shopiversity_google_pending");
                    sessionStorage.setItem("shopiversity_auth_mode", "login");
                  }
                  if (auth.currentUser && !currentUser?.isVerified) {
                    signOut(auth).catch(() => {});
                  }
                  isVerifyingNewSignupRef.current = false;
                  setIsVerifyingNewSignup(false);
                  setPendingVerificationEmail("");
                  setViewingProduct(null);
                  setViewingSellerId(null);
                  setAuthMode("login");
                  setActiveTab("auth");
                }}
                className={cn(
                  "min-h-[32px] sm:min-h-[38px] px-2 sm:px-3.5 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 touch-manipulation select-none active:scale-95 flex items-center justify-center border",
                  (activeTab === "auth" || (isTabRestricted && authMode === "login"))
                    ? "bg-slate-900 dark:bg-white text-white dark:text-zinc-900 border-slate-900 dark:border-white shadow-sm"
                    : "bg-slate-100/90 hover:bg-slate-200/80 dark:bg-zinc-800/90 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-100 border-slate-200/80 dark:border-zinc-700/80"
                )}
                title="Log In / Sign In"
              >
                <span>Sign In</span>
              </button>
              <button 
                id="header-signup-btn"
                type="button"
                onClick={() => {
                  setViewingProduct(null);
                  setViewingSellerId(null);
                  setAuthMode("signup");
                  setActiveTab("signup");
                }}
                className={cn(
                  "min-h-[32px] sm:min-h-[38px] flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3.5 py-1 sm:py-1.5 bg-[#ff6b00] hover:bg-[#ea6200] active:scale-95 text-white rounded-xl text-[11px] sm:text-xs font-bold shadow-sm shadow-orange-500/20 transition-all cursor-pointer border-none whitespace-nowrap shrink-0 touch-manipulation select-none",
                  (activeTab === "signup" || (isTabRestricted && authMode === "signup")) && "ring-2 ring-orange-300 dark:ring-orange-500/50"
                )}
                title="Sign Up / Create Account"
              >
                <UserPlus className="hidden min-[420px]:inline w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span>Sign Up</span>
              </button>
            </div>
          ) : (
            <>
              {/* Cart with count: strictly for buyers when browsing outside dashboards/logistics (hidden in sellers, buyer dashboard, seller dashboard, and logistics) */}
              {activeRole === "buyer" && activeTab !== "dashboard" && activeTab !== "logistics" && currentUser?.state !== "Logistics Partner" && currentUser?.role !== "logistics" && (
                <button 
                  id="header-cart-btn"
                  onClick={() => setActiveTab("cart")}
                  className={cn(
                    "relative p-1.5 hover:bg-orange-50 dark:hover:bg-zinc-800/80 rounded-xl cursor-pointer transition-colors border-none",
                    activeTab === "cart" ? "bg-orange-100/70 dark:bg-orange-950/40 text-[#ff6b00]" : "text-[#ff6b00]"
                  )}
                  aria-label="View shopping cart"
                  title="Shopping Cart"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {cart.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 px-1 bg-[#ff6b00] text-[8px] font-black text-white rounded-full min-w-[14px] h-[14px] flex items-center justify-center border border-white dark:border-zinc-900 leading-none">
                      {cart.reduce((acc, item) => acc + item.quantity, 0)}
                    </span>
                  )}
                </button>
              )}

              {/* Sign Out Icon in Nav Bar (visible when signed in) */}
              <button 
                id="header-signout-btn"
                onClick={handleLogout}
                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl text-slate-600 dark:text-zinc-300 hover:text-red-600 dark:hover:text-red-400 cursor-pointer transition-all active:scale-95 border-none flex items-center gap-1.5 group"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="w-5 h-5 text-slate-500 group-hover:text-red-600 dark:text-zinc-400 dark:group-hover:text-red-400 transition-colors" />
                <span className="hidden md:inline-block text-xs font-bold text-slate-600 group-hover:text-red-600 dark:text-zinc-300 dark:group-hover:text-red-400 transition-colors">
                  Sign Out
                </span>
              </button>
            </>
          )}

          {/* Theme Mode toggle */}
          <button 
            onClick={toggleDarkMode}
            className="p-1.5 hover:bg-orange-50 dark:hover:bg-zinc-800/80 rounded-xl text-zinc-600 dark:text-zinc-100 cursor-pointer transition-colors border-none"
            title="Toggle theme mode"
          >
            {isDarkMode ? <Sun className="w-5 h-5 text-orange-500" /> : <Moon className="w-5 h-5 text-slate-600" />}
          </button>
        </div>
        </motion.header>


        {/* Content Area */}
        <main ref={mainContentRef} id="main-content" tabIndex={-1} className="flex-1 overflow-y-auto bg-white dark:bg-zinc-950 scroll-smooth outline-none">
          {firestoreQuotaExceeded && (
            <div className="bg-red-500/10 dark:bg-red-950/50 border-b border-red-500/30 px-4 py-3 text-xs text-red-900 dark:text-red-200 flex items-start sm:items-center justify-between gap-3 font-medium">
              <div className="flex items-start sm:items-center gap-2.5">
                <ShieldAlert className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5 sm:mt-0" />
                <div>
                  <p className="font-bold">
                    Daily Firebase Firestore Free-Tier Read Quota Exceeded
                  </p>
                  <p className="text-[11px] text-red-800/90 dark:text-red-300/90 font-normal mt-0.5">
                    This database has reached its free daily read limit and will reset tomorrow. Cached profiles and catalog data remain active so you can continue signing in and browsing; site owners can upgrade the Firestore plan in Firebase Console to remove the daily cap.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFirestoreQuotaExceeded(false)}
                className="p-1 text-red-700 dark:text-red-300 hover:bg-red-500/15 rounded-lg transition-colors shrink-0"
                aria-label="Dismiss notice"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          {currentUser && !isVerifyingNewSignup && (currentUser.isVerified === false || (!currentUser.isVerified && currentUser.role !== "admin")) && (
            <div className="bg-amber-500/10 dark:bg-amber-950/40 border-b border-amber-500/30 px-4 py-3 text-xs text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-medium select-none animate-in fade-in slide-in-from-top-1 duration-300">
              <div className="flex items-start sm:items-center gap-2.5">
                <Mail className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
                <div>
                  <p className="font-bold">
                    Please verify your email address (<span className="underline">{currentUser?.email || (typeof window !== "undefined" ? sessionStorage.getItem("shopiversity_verifying_email") : null) || auth.currentUser?.email}</span>)
                  </p>
                  <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 font-normal mt-0.5">
                    {verificationBannerNotice || "Check your inbox for the 6-digit verification code sent by SHOPIVERSITY via Brevo."}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto flex-wrap">
                <button
                  onClick={() => {
                    isVerifyingNewSignupRef.current = true;
                    setIsVerifyingNewSignup(true);
                    setAuthMode("signup");
                    setActiveTab("signup");
                  }}
                  className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Enter 6-Digit Verification Code
                </button>
                <button
                  onClick={handleResendFirebaseVerification}
                  disabled={isResendingFirebaseEmail}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50"
                >
                  {isResendingFirebaseEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Resend Email
                </button>
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            {(((!currentUser || !auth.currentUser) && isTabRestricted) || isVerifyingNewSignup || (currentUser && (currentUser.isVerified === false || (!currentUser.isVerified && currentUser.role !== "admin")))) ? (
              <motion.div
                key="auth"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="min-h-full flex flex-col justify-center"
              >
                <AuthPage 
                  currentUser={currentUser}
                  pendingVerificationEmail={pendingVerificationEmail}
                  initialNeedsProfile={needsProfile} 
                  initialMode={authMode} 
                  initialRole={authRole}
                  onRoleChange={(chosenRole) => setAuthRole(chosenRole)}
                  setActiveTab={setActiveTab}
                  onOpenCookieSettings={() => setIsCookieSettingsOpen(true)}
                  onModeChange={(mode) => {
                    setAuthMode(mode);
                    if (typeof window !== "undefined") {
                      sessionStorage.setItem("shopiversity_auth_mode", mode);
                    }
                    setActiveTabState(mode === "login" ? "auth" : "signup");
                  }}
                  onVerificationScreenChange={(isVerifying) => {
                    isVerifyingNewSignupRef.current = isVerifying;
                    setIsVerifyingNewSignup(isVerifying);
                    if (!isVerifying) {
                      setPendingVerificationEmail("");
                    }
                  }}
                  onGoToMarket={(preferredRole?: "buyer" | "seller", verifiedProfile?: UserProfile) => {
                    isVerifyingNewSignupRef.current = false;
                    setIsVerifyingNewSignup(false);
                    setPendingVerificationEmail("");
                    setNeedsProfile(false);
                    if (verifiedProfile) {
                      setCurrentUser(verifiedProfile);
                    }
                    const savedRole = typeof window !== "undefined" ? sessionStorage.getItem("shopiversity_chosen_role") : null;
                    const explicitRole = preferredRole === "seller" || preferredRole === "buyer" ? preferredRole : undefined;
                    const targetRole = explicitRole ||
                      (verifiedProfile?.role === "seller" || verifiedProfile?.activeRole === "seller" ? "seller" : undefined) ||
                      (savedRole === "seller" ? "seller" : (currentUser?.role === "seller" ? "seller" : "buyer"));
                    if (pendingOrderRedirectAfterAuth) {
                      setPendingOrderRedirectAfterAuth(false);
                      setActiveRole("buyer");
                      setActiveTab("orders");
                    } else if (targetRole === "seller") {
                      setActiveRole("seller");
                      setActiveTab("dashboard");
                    } else {
                      setActiveRole("buyer");
                      setActiveTab("market");
                    }
                    initialTabSet.current = true;
                    setViewingProduct(null);
                    setViewingSellerId(null);
                    setFilterCategory("All");
                    setSearchQuery("");
                  }}
                  onNavigateToLogistics={() => {
                    setIsVerifyingNewSignup(false);
                    setActiveTab("logistics");
                  }}
                />
              </motion.div>
            ) : activeTab === "admin" && isUserAdmin ? (
              <motion.div
                key="admin"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <AdminDashboard currentUser={currentUser} onBack={() => setActiveTab("market")} />
              </motion.div>
            ) : viewingProduct ? (
              <motion.div
                key="product-detail"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <ProductDetail
                  product={viewingProduct}
                  isOpen={true}
                  onClose={() => setViewingProduct(null)}
                  onAddToCart={handleAddToCart}
                  currentUser={currentUser}
                  isPageMode={true}
                  cart={cart}
                />
              </motion.div>
            ) : activeTab === "market" ? (
              <motion.div
                key="market"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                tabIndex={0}
                exit={{ opacity: 0 }}
                className="pb-20"
              >
                {viewingSellerId ? (
                  <div className="px-4 lg:px-8 max-w-[1600px] mx-auto">
                    <SellerStorefront 
                      sellerId={viewingSellerId} 
                      currentUser={currentUser}
                      previewSettings={storefrontPreviewSettings}
                      onBack={() => {
                        if (storefrontPreviewSettings) {
                          setActiveTab("storefront");
                        }
                        setViewingSellerId(null);
                        setStorefrontPreviewSettings(null);
                      }}
                      onAddToCart={handleAddToCart}
                      cart={cart}
                    />
                  </div>
                ) : (
                  <>
                    {/* Interactive Mobile-App Search Bar */}
                    <div className="px-4 pt-4 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-top-2 duration-300">
                      <div 
                        onClick={() => setActiveTab("search")}
                        className="flex items-center gap-2.5 px-4 h-11 bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl text-slate-400 dark:text-zinc-500 cursor-pointer shadow-sm hover:border-orange-500/30 transition-all active:scale-[0.98]"
                      >
                        <Search className="w-4 h-4 text-slate-450 dark:text-zinc-500 shrink-0" />
                        <span className="text-xs font-semibold">Search products, stores, textbooks...</span>
                      </div>
                    </div>

                    {/* Moving Carousel Hero */}
                    <div className="px-4 lg:px-8 pt-4 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-top-4 duration-300">
                      <div className="relative h-[280px] sm:h-[340px] md:h-[400px] lg:h-[460px] rounded-3xl overflow-hidden group shadow-sm border border-slate-100 dark:border-zinc-800/60">
                        <Carousel 
                          onShopNow={() => {
                            if (currentUser) {
                              if (activeRole !== "buyer") {
                                setActiveRole("buyer");
                              }
                              setActiveTab("market");
                              scrollToTop();
                            } else {
                              setAuthRole("buyer");
                              setAuthMode("signup");
                              setActiveTab("signup");
                              scrollToTop();
                            }
                          }}
                          onStartSelling={() => {
                            if (currentUser) {
                              if (currentUser.state === "Logistics Partner" || currentUser.role === "logistics") {
                                alert("Your account is registered as a Logistics Partner. Fleet operations are managed in your logistics hub.");
                              } else if (currentUser.role === "buyer" || activeRole === "buyer") {
                                alert("This account is registered as a Customer. To sell on SHOPIVERSITY, please sign out and register a separate Vendor account using another email address.");
                              } else {
                                setActiveTab("dashboard");
                                scrollToTop();
                              }
                            } else {
                              setAuthRole("seller");
                              setAuthMode("signup");
                              setActiveTab("signup");
                              scrollToTop();
                            }
                          }}
                          onLogistics={() => {
                            setActiveTab("logistics");
                            scrollToTop();
                          }}
                          currentUser={currentUser}
                          onOpenReturnPolicy={() => setIsReturnPolicyOpen(true)}
                        />
                      </div>
                    </div>

                    {/* Local Campus Logistics Partner Banner */}
                    <div className="px-4 lg:px-8 pt-4 max-w-[1600px] mx-auto animate-in fade-in duration-300">
                      <div className="bg-gradient-to-r from-orange-600 to-amber-500 rounded-3xl p-6 text-white shadow-md relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-orange-500">
                        {/* Background visual accents */}
                        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-12 translate-y-12">
                          <Truck className="w-64 h-64" />
                        </div>
                        
                        <div className="space-y-1.5 relative z-10 text-left">
                          <span className="text-[10px] font-black tracking-widest uppercase bg-white/20 px-2.5 py-1 rounded-full text-white inline-block mb-1">
                            🚚 Dispatch & Deliveries
                          </span>
                          <h3 className="text-xl font-black tracking-tight !text-white">Campus Logistics Services Hub</h3>
                          <p className="text-xs text-orange-50/90 max-w-xl font-medium leading-relaxed">
                            Register your student dispatch fleet, handle buyer-seller package delivery inside campus boundaries, and track active shipments in real-time.
                          </p>
                        </div>

                        <button
                          onClick={() => setActiveTab("logistics")}
                          className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-lg shadow-black/10 shrink-0 cursor-pointer border-none"
                        >
                          Launch Logistics Hub
                        </button>
                      </div>
                    </div>

                    {/* One Dollar ($1 USD) Special Shopping Banner */}
                    <OneDollarBanner
                      previewListings={oneDollarListings}
                      rateInfo={oneDollarRate}
                      rateLoading={oneDollarRateLoading}
                      onExplore={() => {
                        setPendingOneDollarListing(null);
                        setActiveTab("one-dollar");
                      }}
                      onSelectListing={(listing) => {
                        setPendingOneDollarListing(listing);
                        setActiveTab("one-dollar");
                      }}
                    />

                    <div className="px-4 max-w-[1600px] mx-auto mt-4 space-y-6">
                  <div id="product-grid" className="pt-2">
                    <motion.div 
                      initial={{ opacity: 0, y: 15 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-50px" }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                           <div className="w-5 h-1 bg-[#ff6b00] rounded-sm animate-pulse" />
                           <p className="text-[10px] font-bold text-[#ff6b00] uppercase tracking-wider">Students Storefront</p>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-zinc-100 tracking-tight">
                          {viewingSellerId ? "Seller Store Directory" : (filterCategory === "All" ? "Department Recommendations" : `${filterCategory} Department`)}
                        </h2>
                      </div>
                      <div className="flex items-center gap-2">
                        <select 
                          value={filterCondition}
                          onChange={(e) => setFilterCondition(e.target.value)}
                          className="h-10 px-3.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-750 rounded-2xl text-xs font-bold text-slate-700 dark:text-zinc-200 outline-none focus:border-[#ff6b00] hover:border-orange-400 transition-all shadow-sm cursor-pointer"
                        >
                          <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" value="All">All Conditions</option>
                          <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" value="new">Brand New</option>
                          <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" value="used">Gently Used</option>
                        </select>
                        <select 
                          value={filterPriceRange}
                          onChange={(e) => setFilterPriceRange(e.target.value)}
                          className="h-10 px-3.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-750 rounded-2xl text-xs font-bold text-slate-700 dark:text-zinc-200 outline-none focus:border-[#ff6b00] hover:border-orange-400 transition-all shadow-sm cursor-pointer"
                        >
                          <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" value="All">Any Price</option>
                          <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" value="0-5000">Under ₦5,000</option>
                          <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" value="5000-20000">₦5,000 - ₦20,000</option>
                          <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" value="20000-50000">₦20,000 - ₦50,000</option>
                          <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" value="50000">₦50,000 & Above</option>
                        </select>
                      </div>
                    </motion.div>

                    {/* Horizontally Scrollable Category Pill Navigation */}
                    <div className="flex items-center gap-2.5 overflow-x-auto pb-4 pt-1 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
                      {["All", ...ALL_CATEGORIES.filter(c => !["Creative & Design", "Academic & Tutoring", "Tech & Digital", "Logistics & Errands", "Jobs & Internships"].includes(c))].map((category, catIdx) => {
                        const isSelected = filterCategory === category;
                        return (
                          <button
                            key={`cat-pill-${category}-${catIdx}`}
                            onClick={() => setFilterCategory(category)}
                            className={cn(
                              "whitespace-nowrap px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 border select-none cursor-pointer shrink-0 shadow-sm",
                              isSelected
                                ? "bg-[#ff6b00] border-[#ff6b00] text-white font-bold shadow-orange-500/10"
                                : "bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-800 hover:border-orange-300 dark:hover:border-orange-900"
                            )}
                          >
                            {getCategoryEmoji(category)}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-2 mb-6 mt-6">
                        <div className="w-1.5 h-4 bg-orange-500 rounded-sm" />
                       <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-wide">
                         {viewingSellerId ? "Department Results" : (filterCategory === "All" ? "Featured Deals & Recommendations" : `Results in ${filterCategory}`)}
                       </h3>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
                      {loading || isFilterTransitioning ? (
                        Array.from({ length: 10 }).map((_, idx) => (
                          <ProductCardSkeleton key={`product-skeleton-${idx}`} />
                        ))
                      ) : filteredProducts.length === 0 ? (
                        <div className="col-span-full py-20 text-center">
                          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No items found</p>
                        </div>
                      ) : (
                        filteredProducts.map((p, pIdx) => (
                          <ProductCard 
                            key={`market-card-${p.id || pIdx}-${pIdx}`}
                            product={p}
                            onAddToCart={handleAddToCart}
                            isOwner={currentUser?.uid === p.sellerId}
                            currentUser={currentUser}
                            sellersMap={sellersMap}
                            cart={cart}
                          />
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
            ) : activeTab === "one-dollar" ? (
              <motion.div
                key="one-dollar-tab"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
              >
                <OneDollarSection
                  currentUser={currentUser}
                  rateInfo={oneDollarRate}
                  rateLoading={oneDollarRateLoading}
                  rateError={oneDollarRateError}
                  onRefreshRate={refreshOneDollarRate}
                  onAddOneDollarToCart={handleAddOneDollarToCart}
                  onViewSellerStore={(sellerId) => {
                    setViewingSellerId(sellerId);
                    setActiveTab("market");
                  }}
                  onBack={() => {
                    setPendingOneDollarListing(null);
                    setActiveTab("market");
                  }}
                  initialSelectedListing={pendingOneDollarListing}
                  onClearInitialSelectedListing={() => setPendingOneDollarListing(null)}
                  sellersMap={sellersMap}
                  cart={cart}
                />
              </motion.div>
            ) : activeTab === "search" ? (
              <motion.div
                key="search-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="max-w-[1200px] mx-auto px-4 py-4 space-y-4"
              >
                {/* Compact Search Header */}
                <div className="text-center space-y-1 max-w-2xl mx-auto">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-zinc-100 tracking-tight font-sans">Campus Search</h2>
                  <p className="text-xs text-slate-500 font-medium">Find textbooks, apparel, food, or dedicated student shops instantly</p>
                </div>

                {/* Search Type Selector */}
                <div className="flex items-center justify-center gap-4 max-w-sm mx-auto">
                  <button
                    onClick={() => setSearchType("products")}
                    className={cn(
                      "flex-1 h-11 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 border cursor-pointer",
                      searchType === "products"
                        ? "bg-orange-600 text-white border-orange-600 shadow-md shadow-orange-500/15 font-sans"
                        : "bg-white dark:bg-zinc-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-zinc-800 hover:text-[#ff6b00] font-sans"
                    )}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Products
                  </button>
                  <button
                    onClick={() => setSearchType("storefronts")}
                    className={cn(
                      "flex-1 h-11 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 border cursor-pointer",
                      searchType === "storefronts"
                        ? "bg-orange-600 text-white border-orange-600 shadow-md shadow-orange-500/15 font-sans"
                        : "bg-white dark:bg-zinc-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-zinc-800 hover:text-[#ff6b00] font-sans"
                    )}
                  >
                    <Store className="w-4 h-4" />
                    Storefronts
                  </button>
                </div>

                {/* Big Centered Search Bar */}
                <div className="max-w-xl mx-auto space-y-4">
                  <div className="flex items-center bg-white dark:bg-zinc-900 rounded-2xl shadow-md border-2 border-[#ff6b00]/25 focus-within:border-[#ff6b00] h-14 overflow-hidden px-4 gap-3 transition-colors">
                    <Search className="w-5 h-5 text-slate-400 shrink-0" />
                    <input 
                      type="text"
                      placeholder={searchType === "products" ? "Type what you want (e.g. 'white shirt')..." : "Type shop name or category (e.g. 'Campus Bites')..."}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-full text-base bg-transparent text-zinc-900 dark:text-zinc-100 border-none outline-none focus:ring-0 placeholder:text-zinc-400 font-sans"
                    />
                    {searchQuery && (
                      <button 
                        onClick={() => setSearchQuery("")}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  {/* Suggestion Quick Tags */}
                  {searchType === "products" ? (
                    <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-medium text-slate-500">
                      <span className="text-slate-400">Try searching:</span>
                      {["white shirt", "textbook", "jacket", "calculator"].map((tag, idx) => (
                        <button
                          key={`suggest-tag-${tag}-${idx}`}
                          onClick={() => setSearchQuery(tag)}
                          className="px-3 py-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-full hover:border-[#ff6b00] dark:hover:border-[#ff6b00] hover:text-[#ff6b00] dark:hover:text-[#ff6b00] transition-colors cursor-pointer"
                        >
                          "{tag}"
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-medium text-slate-500">
                      <span className="text-slate-400">Try searching:</span>
                      {["Bites", "Store", "Fashion", "Tutor"].map((tag, idx) => (
                        <button
                          key={`suggest-tag-store-${tag}-${idx}`}
                          onClick={() => setSearchQuery(tag)}
                          className="px-3 py-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-full hover:border-[#ff6b00] dark:hover:border-[#ff6b00] hover:text-[#ff6b00] dark:hover:text-[#ff6b00] transition-colors cursor-pointer"
                        >
                          "{tag}"
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Search Results */}
                <div className="pt-4">
                  {(() => {
                    // STOREFRONT SEARCH RENDERING
                    if (searchType === "storefronts") {
                      const matchingSellers = sellers.filter(s => {
                        const hasStorefront = s.businessName || s.storefrontSettings?.businessName;
                        if (!hasStorefront) return false;
                        if (!searchQuery.trim()) return true; // show all storefronts by default if query is blank
                        const q = searchQuery.toLowerCase().trim();
                        const bizName = (s.businessName || s.storefrontSettings?.businessName || "").toLowerCase();
                        const displayName = (s.displayName || "").toLowerCase();
                        const bizBio = (s.storefrontSettings?.businessBio || s.description || "").toLowerCase();
                        return bizName.includes(q) || displayName.includes(q) || bizBio.includes(q);
                      });

                      if (matchingSellers.length === 0) {
                        return (
                          <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-slate-100 dark:border-zinc-850/50 p-8 shadow-sm">
                            <Store className="w-16 h-16 text-slate-350 dark:text-zinc-650 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-200">No matching storefronts found</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto mt-2 leading-relaxed">
                              No student stores matched "<span className="font-semibold text-slate-700 dark:text-zinc-350">{searchQuery}</span>". Try another query or list your own storefront!
                            </p>
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-6 animate-fade-in text-left">
                          <div className="flex items-center justify-between border-b border-slate-200/45 dark:border-zinc-800 pb-4">
                            <h3 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
                              Found {matchingSellers.length} student storefront{matchingSellers.length === 1 ? '' : 's'}
                            </h3>
                          </div>
                          <div className="grid grid-cols-1 gap-4">
                            {matchingSellers.map((seller, sellerIdx) => {
                              const bizName = seller.businessName || seller.storefrontSettings?.businessName || seller.displayName;
                              const bannerUrl = seller.storefrontSettings?.bannerUrl;
                              const bioText = seller.storefrontSettings?.businessBio || seller.description || "Welcome to my official campus storefront! Fast delivery and reliable quality guaranteed.";
                              return (
                                <motion.div
                                  key={`storefront-card-${seller.uid || sellerIdx}-${sellerIdx}`}
                                  whileHover={{ y: -4 }}
                                  className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-150/80 dark:border-zinc-800 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col h-full bg-clip-border"
                                >
                                  {/* Mini Banner Preview */}
                                  <div className="h-28 bg-slate-100 dark:bg-zinc-950 relative overflow-hidden shrink-0">
                                    {bannerUrl ? (
                                      <img
                                        src={bannerUrl}
                                        alt={bizName}
                                        className="w-full h-full object-cover"
                                        referrerPolicy="no-referrer"
                                      />
                                    ) : (
                                      <div className="w-full h-full bg-gradient-to-r from-orange-400/20 to-amber-500/20 flex items-center justify-center">
                                        <Store className="w-8 h-8 text-orange-400" />
                                      </div>
                                    )}
                                    <div className="absolute top-3 right-3 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-[#ff6b00]">
                                      Storefront
                                    </div>
                                  </div>

                                  {/* Content */}
                                  <div className="p-6 flex flex-col flex-1 gap-2 text-left">
                                    <h4 className="text-lg font-black text-slate-900 dark:text-white line-clamp-1">{bizName}</h4>
                                    <p className="text-xs text-slate-400 dark:text-zinc-500 font-semibold uppercase tracking-widest">Owner: {seller.displayName}</p>
                                    <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium line-clamp-3 mt-1 flex-1">{bioText}</p>
                                    
                                    <div className="pt-4 border-t border-slate-100 dark:border-zinc-850/80 flex items-center justify-between gap-2 mt-2">
                                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">Campus Vendor</span>
                                      <button
                                        onClick={() => {
                                          setViewingSellerId(seller.uid);
                                          setActiveTab("market");
                                        }}
                                        className="h-10 px-5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer border-none outline-none"
                                      >
                                        Visit Store
                                        <ArrowRight className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }

                    // PRODUCT SEARCH RENDERING
                    if (!searchQuery.trim()) {
                      return (
                        <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-slate-100 dark:border-zinc-850/50 p-8 shadow-sm">
                          <ShoppingBag className="w-16 h-16 text-slate-350 dark:text-zinc-750 mx-auto mb-4" />
                          <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-200">What can we help you find today?</h3>
                          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto mt-2 leading-relaxed">
                            Type your requirements like <span className="font-semibold text-orange-600 dark:text-orange-400">"I want a white shirt"</span> or <span className="font-semibold text-orange-600 dark:text-orange-400">"chemistry textbook"</span> to get instant matches.
                          </p>
                        </div>
                      );
                    }

                    if (loading || isFilterTransitioning) {
                      return (
                        <div className="space-y-6">
                          <div className="flex items-center justify-between border-b border-slate-250/40 dark:border-zinc-800 pb-4">
                            <div className="h-4 w-48 bg-slate-200 dark:bg-zinc-800 rounded animate-pulse" />
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
                            {Array.from({ length: 10 }).map((_, idx) => (
                              <ProductCardSkeleton key={`search-skeleton-${idx}`} />
                            ))}
                          </div>
                        </div>
                      );
                    }

                    const searchResults = products.filter((p) => {
                      if (p.isDeleted || p.isDraft || p.status === "draft" || p.isHibernated || (p.stock !== undefined && p.stock <= 0)) return false;
                      if (!p.sellerId || invalidSellerIds.has(p.sellerId) || missingSellerIds.has(p.sellerId)) return false;
                      if (usersLoaded && sellersMap[p.sellerId] && !hasValidSellerStorefront(sellersMap[p.sellerId])) return false;
                      if (usersLoaded && checkedSellerIdsRef.current.has(p.sellerId) && !sellersMap[p.sellerId]) return false;
                      if (p.type === "service") return false;
                      if (p.category === "Logistics & Errands" || p.category === "Logistics") return false;
                      
                      const isNotSelf = currentUser ? p.sellerId !== currentUser.uid : true;
                      if (!isNotSelf) return false;

                      const q = searchQuery.trim().toLowerCase();
                      const STOP_WORDS = new Set([
                        "i", "want", "to", "find", "get", "need", "search", "for", "please", "buy", "a", "an", "the", "some", "any", "is", "are", "of", "in", "on", "at", "by", "with", "from", "and", "or"
                      ]);

                      const queryWords = q
                        .split(/[\s,.-]+/)
                        .map(w => w.trim())
                        .filter(w => w && !STOP_WORDS.has(w));
                        
                      const finalQueryWords = queryWords.length > 0 
                        ? queryWords 
                        : q.split(/[\s,.-]+/).map(w => w.trim()).filter(Boolean);
                        
                      if (finalQueryWords.length === 0) return false;
                      
                      const targetText = `${p.name} ${p.description || ""} ${p.category || ""} ${p.sellerName || ""}`.toLowerCase();
                      return finalQueryWords.every(word => targetText.includes(word));
                    });

                    if (searchResults.length === 0) {
                      return (
                        <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-slate-100 dark:border-zinc-850/50 p-8 shadow-sm">
                          <Search className="w-16 h-16 text-slate-350 dark:text-zinc-650 mx-auto mb-4" />
                          <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-200">No matching products found</h3>
                          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto mt-2 leading-relaxed">
                            No listings matched "<span className="font-semibold text-slate-700 dark:text-zinc-300">{searchQuery}</span>". Try using simpler keywords or adjusting your search!
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-250/40 dark:border-zinc-800 pb-4">
                          <h3 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
                            Found {searchResults.length} {searchResults.length === 1 ? 'item' : 'items'} matching your search query
                          </h3>
                        </div>
                        <motion.div 
                          variants={{
                            hidden: { opacity: 0 },
                            visible: {
                              opacity: 1,
                              transition: {
                                staggerChildren: 0.05
                              }
                            }
                          }}
                          initial="hidden"
                          animate="visible"
                          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6"
                        >
                          {searchResults.map((p, pIdx) => (
                            <motion.div
                              key={`search-card-${p.id || pIdx}-${pIdx}`}
                              variants={{
                                hidden: { opacity: 0, y: 15 },
                                visible: { 
                                  opacity: 1, 
                                  y: 0, 
                                  transition: { 
                                    type: "spring", 
                                    stiffness: 100, 
                                    damping: 15 
                                  } 
                                }
                              }}
                            >
                              <ProductCard 
                                product={p}
                                onAddToCart={handleAddToCart}
                                isOwner={currentUser?.uid === p.sellerId}
                                currentUser={currentUser}
                                sellersMap={sellersMap}
                                cart={cart}
                              />
                            </motion.div>
                          ))}
                        </motion.div>
                      </div>
                    );
                  })()}
                </div>
              </motion.div>
            ) : (activeTab === "dashboard" || activeTab === "wishlist") && activeRole === "buyer" && currentUser?.role !== "seller" && currentUser?.activeRole !== "seller" && currentUser?.state !== "Logistics Partner" && currentUser?.role !== "logistics" ? (
              <motion.div
                key="buyer-dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <BuyerDashboard 
                  user={currentUser} 
                  setActiveTab={setActiveTab} 
                  onBack={handleGoBack} 
                  initialSection={activeTab === "wishlist" ? "wishlist" : undefined}
                />
              </motion.div>
            ) : (activeTab === "dashboard" || activeTab === "overview" || activeTab === "analytics" || activeTab === "add-product" || activeTab === "my-products" || activeTab === "seller-one-dollar" || (activeTab === "orders" && (activeRole === "seller" || currentUser?.role === "seller")) || activeTab === "storefront" || activeTab === "payouts") && (activeRole === "seller" || currentUser?.role === "seller" || currentUser?.activeRole === "seller") ? (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <SellerDashboard 
                  isOpen={true} 
                  onClose={handleGoBack} 
                  onBack={handleGoBack}
                  initialSubTab={
                    activeTab === "analytics" ? "analytics" :
                    activeTab === "add-product" ? "add-product" : 
                    activeTab === "my-products" ? "my-products" : 
                    activeTab === "seller-one-dollar" ? "one-dollar" :
                    activeTab === "orders" ? "orders" : 
                    activeTab === "storefront" ? "storefront" :
                    activeTab === "payouts" ? "payouts" :
                    "overview"
                  }
                  initialProductType="good"
                  initialEditingProduct={pendingEditProduct}
                  onClearEditingProduct={() => setPendingEditProduct(null)}
                  userProfile={currentUser}
                  appNotifications={notifications}
                />
              </motion.div>
            ) : activeTab === "notifications" && currentUser ? (
              <motion.div 
                key="notifications"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="h-full overflow-y-auto p-6"
              >
                <NotificationsPage onBack={handleGoBack} />
              </motion.div>
            ) : activeTab === "messages" && currentUser ? (
              <motion.div 
                key="messages"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="h-full px-4 lg:px-8 max-w-[1600px] mx-auto"
              >
                <ChatView 
                  initialRecipientId={chatWithUserId} 
                  onRecipientHandled={() => setChatWithUserId(null)} 
                />
              </motion.div>
            ) : activeTab === "orders" && currentUser ? (
              <motion.div 
                key="orders"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <OrderTracking
                  setActiveTab={setActiveTab}
                  onBack={handleGoBack}
                  userProfile={currentUser}
                  initialOrderId={focusedOrderId}
                  onOrderFocused={() => setFocusedOrderId(null)}
                />
              </motion.div>
            ) : activeTab === "history" && currentUser ? (
              <motion.div 
                key="history"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <ProductHistory onBack={handleGoBack} appProducts={products} />
              </motion.div>
            ) : activeTab === "support" ? (
              <motion.div 
                key="support"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="pt-8"
              >
                <SupportPage user={currentUser} onBack={handleGoBack} mode="support" />
              </motion.div>
            ) : activeTab === "feedback-help" ? (
              <motion.div 
                key="feedback-help"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="pt-8"
              >
                <SupportPage user={currentUser} onBack={handleGoBack} mode="feedback" />
              </motion.div>
            ) : activeTab === "settings" && currentUser ? (
              (currentUser.state === "Logistics Partner" || currentUser.role === "logistics") ? (
                <motion.div
                  key="logistics-company-profile"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <LogisticsHub
                    initialDashboardTab="profile"
                    onBackToMarket={handleGoBack}
                    onNavigateToAuth={(mode) => {
                      setAuthMode(mode || "login");
                      setActiveTab("auth");
                    }}
                  />
                </motion.div>
              ) : (
                <motion.div 
                  key={settingsSubView === "hub" ? "settings-hub" : "settings-edit"}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6 px-4 py-4"
                >
                  {settingsSubView === "hub" ? (
                    <UserProfileHub 
                      user={currentUser}
                      activeRole={activeRole}
                      onToggleRole={toggleRole}
                      onNavigateToEdit={() => setSettingsSubView("edit")}
                      onNavigateTab={(tabId) => setActiveTab(tabId)}
                      onLogout={handleLogout}
                      isDarkMode={isDarkMode}
                      toggleDarkMode={toggleDarkMode}
                    />
                  ) : (
                    <ProfileSettings user={currentUser} onBack={() => setSettingsSubView("hub")} activeRole={activeRole} />
                  )}
                </motion.div>
              )
            ) : activeTab === "terms" ? (
              <motion.div 
                key="terms"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-6"
              >
                <TermsAndConditions 
                  onBack={handleGoBack} 
                  onNavigatePrivacy={() => setActiveTab("privacy")}
                  onNavigateRefund={() => setActiveTab("refund-policy")}
                  onNavigateCookies={() => setActiveTab("cookies")}
                />
              </motion.div>
            ) : activeTab === "privacy" ? (
              <motion.div 
                key="privacy"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-6"
              >
                <PrivacyPolicy 
                  onBack={handleGoBack} 
                  onNavigateTerms={() => setActiveTab("terms")}
                  onNavigateCookies={() => setActiveTab("cookies")}
                />
              </motion.div>
            ) : activeTab === "cookies" ? (
              <motion.div 
                key="cookies"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-6"
              >
                <CookiesPolicy 
                  onBack={handleGoBack} 
                  onOpenCookieSettings={() => setIsCookieSettingsOpen(true)}
                />
              </motion.div>
            ) : activeTab === "refund-policy" ? (
              <motion.div 
                key="refund-policy"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-6"
              >
                <RefundPolicy 
                  onBack={handleGoBack} 
                  onNavigateSupport={() => setActiveTab("support")}
                />
              </motion.div>
            ) : activeTab === "cart" ? (
              <motion.div 
                key="cart"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <CartPage
                  cart={cart}
                  products={products}
                  oneDollarListings={oneDollarListings}
                  onUpdateQuantity={(productId, delta, menuItemId, ticketTierId, isOneDollar) => {
                    const now = Date.now();
                    setCart(prev => pruneExpiredCartItems(prev, now).map(item => {
                      if (!(item.productId === productId && item.menuItemId === menuItemId && item.ticketTierId === ticketTierId && Boolean(item.isOneDollar) === Boolean(isOneDollar))) {
                        return item;
                      }
                      const maxStock = resolveAvailableStockForCartItem(item, products, oneDollarListings);
                      const nextQty =
                        delta > 0 && maxStock !== undefined
                          ? Math.min(maxStock, item.quantity + delta)
                          : Math.max(0, item.quantity + delta);
                      return {
                        ...item,
                        quantity: nextQty,
                        ...(maxStock !== undefined ? { maxStock } : {})
                      };
                    }).filter(item => item.quantity > 0));
                  }}
                  onRemove={(productId, menuItemId, ticketTierId, isOneDollar) => 
                    setCart(prev => prev.filter(item => 
                      !(item.productId === productId && item.menuItemId === menuItemId && item.ticketTierId === ticketTierId && Boolean(item.isOneDollar) === Boolean(isOneDollar))
                    ))
                  }
                  onClear={() => setCart([])}
                  currentUser={currentUser}
                  setActiveTab={setActiveTab}
                  onBack={handleGoBack}
                />
              </motion.div>
            ) : activeTab === "logistics" ? (
              <motion.div 
                key="logistics"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <LogisticsHub 
                  onBackToMarket={() => {
                    setActiveRole("buyer");
                    setActiveTab("market");
                  }} 
                  onNavigateToAuth={(mode) => {
                    setAuthMode(mode || "login");
                    setActiveTab("auth");
                  }}
                />
              </motion.div>
            ) : (
              <motion.div 
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full text-slate-400"
              >
                <Store className="w-16 h-16 mb-4 opacity-20" />
                <p className="font-bold uppercase tracking-widest text-xs">Section Coming Soon</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Clean modern website footer - hidden on product detail view and auth/signup (AuthPage embeds it directly) */}
          {!viewingProduct && activeTab !== "auth" && activeTab !== "signup" && (
            <Footer 
              setActiveTab={setActiveTab} 
              activeTab={activeTab} 
              onOpenCookieSettings={() => setIsCookieSettingsOpen(true)}
              onLogoClick={handleLogoHomeClick}
              currentUser={currentUser}
              activeRole={activeRole}
            />
          )}
        </main>
      </div>

        {/* Drawers */}
        <Sidebar 
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          role={currentUser?.role || "buyer"}
          activeRole={activeRole}
          onToggleRole={toggleRole}
          user={currentUser}
          onSelectAllCategories={() => setFilterCategory("All")}
        />

      <ReturnPolicyModal
        isOpen={isReturnPolicyOpen}
        onClose={() => setIsReturnPolicyOpen(false)}
        onViewOrders={() => setActiveTab("orders")}
      />

      <CookieConsentBanner
        onNavigateCookies={() => {
          setActiveTab("cookies");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onNavigatePrivacy={() => {
          setActiveTab("privacy");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        isOpenModalExplicitly={isCookieSettingsOpen}
        onCloseModalExplicitly={() => setIsCookieSettingsOpen(false)}
      />

      {/* Floating Support Button */}
      <motion.button
        drag
        dragConstraints={{ left: -350, right: 10, top: -750, bottom: 10 }}
        dragElastic={0.15}
        dragMomentum={false}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          setActiveTab("support");
          scrollToTop();
        }}
        className="fixed bottom-6 right-6 z-[150] w-14 h-14 bg-[#ff6b00] text-white rounded-2xl shadow-2xl shadow-orange-500/20 flex items-center justify-center group cursor-grab active:cursor-grabbing hover:bg-orange-600"
        title="Customer Support (Drag to move me!)"
      >
        <HelpCircle className="w-6 h-6" />
        <span className="absolute right-full mr-4 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl">
          Support Center (Drag me!)
        </span>
      </motion.button>
    </div>
  );

  // Render Lock Screen if phone is locked
  const lockScreenOverlay = (
    <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 via-orange-950/90 to-zinc-950 z-[200] flex flex-col justify-between p-8 text-white select-none animate-in fade-in duration-300">
      {/* Status Bar */}
      <div className="flex justify-between items-center text-xs opacity-90">
        <span className="font-bold">{simulatedTime.split(" ")[0]}</span>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-black tracking-widest text-[#ff6b00]">5G</span>
          <div className="w-5 h-2.5 border border-white/40 rounded-sm p-0.5 flex items-center">
            <div className="h-full w-full bg-white rounded-2xs" />
          </div>
        </div>
      </div>

      {/* Date & Time */}
      <div className="text-center mt-12 space-y-2">
        <p className="text-sm font-bold text-orange-200/80 uppercase tracking-widest font-sans">
          {new Date().toLocaleDateString("en-US", { weekday: 'long', month: 'short', day: 'numeric' })}
        </p>
        <h1 className="text-5xl font-black tracking-tighter text-white font-sans">
          {simulatedTime.split(" ")[0]}
          <span className="text-xl ml-1 text-orange-400 font-bold">{simulatedTime.split(" ")[1]}</span>
        </h1>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full border border-white/10 text-[10px] font-black uppercase tracking-wider backdrop-blur-md text-orange-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Verified Escrow Shield Active
        </div>
      </div>

      {/* Mock Lock Screen Notifications */}
      <div className="space-y-3 mt-4 flex-1 flex flex-col justify-center max-h-[300px] overflow-hidden">
        <div className="bg-white/10 border border-white/10 backdrop-blur-md rounded-2xl p-4 space-y-1 shadow-lg text-left">
          <div className="flex justify-between items-center">
            <span className="text-xs font-black text-orange-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-orange-500" />
              CAMPUS SECURITY
            </span>
            <span className="text-[9px] opacity-60 font-bold">Just Now</span>
          </div>
          <p className="text-xs font-bold text-white">Secure Escrow Verified</p>
          <p className="text-[10px] text-zinc-300 leading-snug">
            Your payment is fully protected. Funds are held securely until order receipt is verified by both parties.
          </p>
        </div>

        <div className="bg-white/10 border border-white/10 backdrop-blur-md rounded-2xl p-4 space-y-1 shadow-lg text-left">
          <div className="flex justify-between items-center">
            <span className="text-xs font-black text-amber-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              CAMPUS DIRECT
            </span>
            <span className="text-[9px] opacity-60 font-bold">3m ago</span>
          </div>
          <p className="text-xs font-bold text-white">Pick up nearby</p>
          <p className="text-[10px] text-zinc-300 leading-snug">
            Check the campus marketplace directory for active listings offering free library or dorm drop-offs today!
          </p>
        </div>
      </div>

      {/* Unlock Call to Action */}
      <div className="text-center pb-8 animate-pulse">
        <button 
          onClick={() => setIsPhoneLocked(false)}
          className="mx-auto w-12 h-12 bg-white/10 border border-white/15 backdrop-blur-md hover:bg-white/20 active:scale-95 text-white rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg"
        >
          <UserIcon className="w-5 h-5 text-orange-400" />
        </button>
        <p className="text-[10px] font-black tracking-widest text-orange-200/60 uppercase mt-3">
          Tap profile icon to unlock
        </p>
      </div>

      {/* Home Indicator */}
      <div 
        onClick={() => setIsPhoneLocked(false)} 
        className="w-32 h-1 bg-white/40 rounded-full mx-auto cursor-pointer hover:bg-white/70 transition-all active:scale-90" 
      />
    </div>
  );

  const volumeOverlay = (
    <AnimatePresence>
      {isVolumeHudVisible && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="absolute left-2.5 top-1/4 z-[220] w-6 bg-black/80 backdrop-blur-md rounded-full py-4 flex flex-col items-center gap-3 shadow-2xl border border-white/10"
        >
          <div className="w-1.5 h-24 bg-white/20 rounded-full relative overflow-hidden flex flex-col justify-end">
            <div 
              className="w-full bg-[#ff6b00] rounded-full transition-all duration-150" 
              style={{ height: `${volumeLevel}%` }}
            />
          </div>
          <span className="text-[8px] font-black text-white">{volumeLevel}%</span>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const simulatorStatusBar = (
    <div className="h-10 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 flex items-center justify-between px-6 select-none shrink-0 border-b border-slate-100 dark:border-zinc-800/40 relative z-[150] transition-colors duration-200">
      {/* Clock */}
      <span className="text-xs font-black tracking-tight font-sans">
        {simulatedTime.split(" ")[0]}
      </span>

      {/* Dynamic Island Cutout */}
      <div className="absolute left-1/2 -translate-x-1/2 top-1.5 flex flex-col items-center z-[250]">
        <motion.div
          animate={
            dynamicIslandState === "expanded-notif" 
              ? { width: 280, height: 42, borderRadius: 24 } 
              : dynamicIslandState === "expanded-charging" 
              ? { width: 200, height: 42, borderRadius: 24 } 
              : { width: 110, height: 26, borderRadius: 16 }
          }
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="bg-black text-white flex items-center justify-center px-3 shadow-2xl border border-white/5 relative cursor-pointer"
          onClick={() => {
            triggerDynamicIsland("Verified Student Trust Escrow Protected 🛡️");
          }}
        >
          {dynamicIslandState === "compact" && (
            <div className="flex items-center gap-1 text-[9px] font-black text-orange-500 uppercase tracking-widest scale-90">
              <Sparkles className="w-2.5 h-2.5 animate-pulse text-orange-400" />
              <span>STUDENT</span>
            </div>
          )}

          {dynamicIslandState === "expanded-notif" && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2.5 text-xs font-bold w-full justify-between px-1 animate-in fade-in duration-200"
            >
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-[#ff6b00] flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
                <span className="truncate text-[10px] text-orange-100">{dynamicIslandMessage}</span>
              </div>
              <span className="text-[8px] uppercase tracking-widest bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 font-extrabold shrink-0">
                ACTIVE
              </span>
            </motion.div>
          )}

          {dynamicIslandState === "expanded-charging" && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 text-xs font-bold text-emerald-400 animate-in fade-in duration-200"
            >
              <Zap className="w-3.5 h-3.5 animate-bounce text-emerald-400 shrink-0" />
              <span className="text-[10px] font-black uppercase tracking-wider">{dynamicIslandMessage}</span>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Network / Power Panel */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-[9px] font-black text-[#ff6b00] tracking-widest hidden sm:inline">5G</span>
        
        {/* Battery with charge toggle */}
        <button 
          onClick={handleBatteryClick}
          className="flex items-center gap-1 hover:opacity-85 active:scale-95 transition-all cursor-pointer bg-transparent border-none p-0 focus:outline-none"
          title="Toggle charging mode"
        >
          {isBatteryCharging ? (
            <Zap className="w-3 h-3 text-emerald-500 shrink-0" />
          ) : null}
          <div className="w-5.5 h-3 border border-zinc-400 dark:border-zinc-600 rounded-sm p-0.5 flex items-center relative">
            <div className={cn(
              "h-full rounded-2xs transition-all duration-300",
              isBatteryCharging ? "bg-emerald-500 w-full" : "bg-zinc-600 w-2/3"
            )} />
            <div className="absolute right-[-2px] top-1 w-0.5 h-1 bg-zinc-400 rounded-r-xs" />
          </div>
        </button>
      </div>
    </div>
  );

  const simulatorHomeIndicator = (
    <div className="h-6 bg-white dark:bg-zinc-900 flex items-center justify-center shrink-0 select-none pb-1 transition-colors duration-200 border-t border-slate-50 dark:border-zinc-900">
      <div 
        onClick={() => {
          setViewingSellerId(null);
          setSearchQuery("");
          setActiveTab("market");
        }}
        className="w-32 h-1 bg-slate-300 dark:bg-zinc-700 rounded-full cursor-pointer hover:bg-slate-400 dark:hover:bg-zinc-500 transition-all active:scale-90"
        title="Swipe Up / Home Screen"
      />
    </div>
  );

  const controlPanel = (
    <div className="w-[310px] bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-6 text-white flex flex-col gap-6 shadow-2xl shrink-0 select-none">
      {/* App brand & status */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-brand-gradient flex items-center justify-center text-white font-extrabold text-xs">
            S
          </div>
          <span className="text-sm font-black tracking-widest text-white uppercase font-sans">Shopiversity</span>
        </div>
        <p className="text-[10px] text-zinc-400 font-medium font-sans">Campus Marketplace Simulator</p>
      </div>

      <div className="h-px bg-white/10" />

      {/* Mode selectors */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-[#ff6b00]">Simulator Layout</h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setSimulatorViewMode("simulator")}
            className={cn(
              "py-2 px-3 rounded-xl text-[10px] font-extrabold uppercase tracking-wider border transition-all cursor-pointer font-sans",
              simulatorViewMode === "simulator"
                ? "bg-[#ff6b00] border-[#ff6b00] text-white font-black shadow-lg shadow-orange-500/10"
                : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
            )}
          >
            Simulator
          </button>
          <button
            onClick={() => setSimulatorViewMode("fullscreen")}
            className={cn(
              "py-2 px-3 rounded-xl text-[10px] font-extrabold uppercase tracking-wider border transition-all cursor-pointer font-sans",
              simulatorViewMode === "fullscreen"
                ? "bg-[#ff6b00] border-[#ff6b00] text-white font-black shadow-lg shadow-orange-500/10"
                : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
            )}
          >
            Full Width
          </button>
        </div>
      </div>


      {/* Trigger alert */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-[#ff6b00]">Simulate Notch Action</h3>
        <button
          onClick={() => triggerDynamicIsland("Verified Student Escrow Secured! 🛡️")}
          className="w-full h-11 bg-white/5 hover:bg-white/10 active:scale-[0.98] border border-white/10 hover:border-[#ff6b00]/30 rounded-xl flex items-center justify-start gap-2.5 px-4 transition-all cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-orange-450" />
          <span className="text-[11px] font-bold text-zinc-300 text-left font-sans">Trigger Dynamic Island</span>
        </button>
      </div>

      {/* Charging toggle */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-[#ff6b00]">Simulate Power</h3>
        <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-2.5">
          <span className="text-[11px] font-bold text-zinc-300 font-sans">Battery Charging</span>
          <button 
            onClick={handleBatteryClick}
            className={cn(
              "w-10 h-5.5 rounded-full p-0.5 transition-all cursor-pointer relative focus:outline-none border-none",
              isBatteryCharging ? "bg-emerald-500" : "bg-zinc-700"
            )}
          >
            <div className={cn(
              "w-4.5 h-4.5 bg-white rounded-full transition-all",
              isBatteryCharging ? "translate-x-4.5" : "translate-x-0"
            )} />
          </button>
        </div>
      </div>

      <div className="h-px bg-white/10" />

      {/* Key Features Quick Tips */}
      <div className="space-y-3 text-left">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-[#ff6b00]">Physical Key Functions</h3>
        <ul className="space-y-1.5 text-[10px] text-zinc-400 font-medium list-disc pl-3 leading-relaxed font-sans">
          <li>Hover & click left physical keys to adjust <strong className="text-orange-400 font-bold">Volume HUD</strong> inside.</li>
          <li>Click right physical key to <strong className="text-orange-400 font-bold">Lock/Unlock</strong> the phone.</li>
          <li>Click simulated <strong className="text-orange-400 font-bold">Dynamic Island</strong> to view protection rules.</li>
          <li>Use sticky <strong className="text-orange-400 font-bold">Bottom Navigation</strong> tabs for tactile screen routing.</li>
        </ul>
      </div>
    </div>
  );

  // Clean Full-Width Website Mode with smooth entry fade
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col transition-colors duration-500 selection:bg-orange-500/20 relative w-full h-screen overflow-hidden font-sans"
    >
      {appLayout}

      {/* Secret Executive Super-Admin Gateway Modal */}
      <SecretAdminGatewayModal
        isOpen={isSecretAdminModalOpen}
        onClose={() => setIsSecretAdminModalOpen(false)}
        initialPasskey={secretAdminPasskey}
        initialEmail="fashinaayomide2005@gmail.com"
        onAdminAuthenticated={() => {
          setActiveTab("admin");
        }}
      />
    </motion.div>
  );
}
