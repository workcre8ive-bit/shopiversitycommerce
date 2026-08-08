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
  updateDoc,
  getDocFromServer,
  getDocs,
  addDoc,
  getDoc
} from "firebase/firestore";
import { Product, UserProfile, CartItem, Notification } from "./types";
import { handleFirestoreError, OperationType, getFirestoreErrorMessage } from "./lib/firebase-errors";
import SellerStorefront from "./components/SellerStorefront";
import LogisticsHub from "./components/LogisticsHub";
import Sidebar from "./components/Sidebar";
import ReferralDashboard from "./components/ReferralDashboard";
import SupportPage from "./components/SupportPage";
import AuthPage from "./components/AuthPage";
import { ProductCard, ProductCardSkeleton } from "./components/ProductCard";
import ProductDetail from "./components/ProductDetail";
import CartDrawer from "./components/CartDrawer";
import SellerDashboard from "./components/SellerDashboard";
import ProfileSettings from "./components/ProfileSettings";
import UserProfileHub from "./components/UserProfileHub";
import OrderTracking from "./components/OrderTracking";
import ProductHistory from "./components/ProductHistory";
import NotificationsPage from "./components/NotificationsPage";
import BuyerDashboard from "./components/BuyerDashboard";
import AdminDashboard from "./components/AdminDashboard";
import ChatView from "./components/Chat/ChatView";
import TermsAndConditions from "./components/TermsAndConditions";
import Carousel from "./components/HeroCarousel";
import Logo from "./components/Logo";
import StickmanLoader from "./components/StickmanLoader";
import Footer from "./components/Footer";
import { cn } from "./lib/utils";
import { 
  Search, 
  Loader2, 
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
  Truck
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
  const [sellers, setSellers] = React.useState<UserProfile[]>([]);
  const [searchType, setSearchType] = React.useState<"products" | "storefronts">("products");
  const [loading, setLoading] = React.useState(true);
  const [authLoading, setAuthLoading] = React.useState(true);
  const [currentUser, setCurrentUser] = React.useState<UserProfile | null>(null);
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
        const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;
        const now = Date.now();
        // Return only items added less than 48 hours ago
        return parsed.filter(item => !item.addedAt || (now - item.addedAt) < TWO_DAYS_MS);
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

  // Periodically clean up items older than 2 days (48 hours) so they are released back to stock for other buyers
  React.useEffect(() => {
    const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;
    const interval = setInterval(() => {
      setCart((prev) => {
        const now = Date.now();
        const valid = prev.filter((item) => !item.addedAt || (now - item.addedAt) < TWO_DAYS_MS);
        if (valid.length !== prev.length) {
          triggerDynamicIsland("Expired cart items returned to available stock! 📦");
        }
        return valid;
      });
    }, 30000);
    return () => clearInterval(interval);
  }, []);
  const [pendingCartItem, setPendingCartItem] = React.useState<{
    product: Product;
    menuItem?: any;
    ticketTier?: any;
    formResponses?: Record<string, string>;
    previousTab: string;
  } | null>(null);
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);
  
  // Navigation & UI states
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [activeTab, setActiveTabState] = React.useState("market");
  const [settingsSubView, setSettingsSubView] = React.useState<"hub" | "edit">("hub");
  const [tabHistory, setTabHistory] = React.useState<string[]>([]);

  const setActiveTab = React.useCallback((newTab: string) => {
    if (newTab === "settings") {
      setSettingsSubView("hub");
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

  const [viewingProduct, setViewingProduct] = React.useState<Product | null>(null);
  const [viewingSellerId, setViewingSellerId] = React.useState<string | null>(null);

  const [activeRole, setActiveRole] = React.useState<"buyer" | "seller">("buyer");
  const [chatWithUserId, setChatWithUserId] = React.useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = React.useState(false);
  const [notificationView, setNotificationView] = React.useState<"unread" | "read">("unread");
  const [connectionError, setConnectionError] = React.useState<string | null>(null);
  const [needsProfile, setNeedsProfile] = React.useState(false);
  const [hibernationMessage, setHibernationMessage] = React.useState<string | null>(null);

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
    
    // Inactivity limit of 10 minutes (600,000 ms)
    const INACTIVITY_LIMIT = 10 * 60 * 1000; 
    let timeoutId: any;

    const handleInactivity = () => {
      // 1. Take back to home page
      setActiveTab("market");
      setActiveRole("buyer");
      setViewingSellerId(null);
      // 2. Log user out
      signOut(auth);
      setCart([]);
      alert("You have been logged out due to inactivity.");
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
    // Check for referral code in URL
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    if (refCode) {
      localStorage.setItem('referredBy', refCode.toUpperCase());
    }

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

    const handleSwitchRole = (e: any) => {
      setActiveRole(e.detail);
      setActiveTab("dashboard");
    };
    window.addEventListener('switch-active-role', handleSwitchRole);

    const handleEditSellerProduct = (e: any) => {
      setPendingEditProduct(e.detail);
      setActiveRole("seller");
      setActiveTab("add-product");
    };
    window.addEventListener('edit-seller-product', handleEditSellerProduct);

    const handleSwitchSellerTab = (e: any) => {
      if (e.detail === "settings") {
        setActiveRole("seller");
        setActiveTab("settings");
        setSettingsSubView("edit");
      }
    };
    window.addEventListener('switch-seller-tab', handleSwitchSellerTab);

    const handleSwitchTabEvent = (e: any) => {
      setActiveTab(e.detail);
    };
    window.addEventListener('switch-tab', handleSwitchTabEvent);

    let unsubscribeProfile: (() => void) | null = null;
    let unsubscribeNotifs: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        if (!currentUser && !needsProfile) {
          setAuthLoading(true);
        }
        unsubscribeProfile = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
          if (docSnap.exists()) {
            let profile = docSnap.data() as UserProfile;
            
            // DEMO ADMIN CHECK: Make specific user an admin
            if (profile.email === "tommzypolaris@gmail.com" && (profile.role as string) !== "admin") {
              profile = { ...profile, role: "admin", profileCompleted: true, isVerified: true } as UserProfile;
              updateDoc(doc(db, "users", profile.uid), { role: "admin", profileCompleted: true, isVerified: true }).catch(() => {});
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

            setCurrentUser(profile);
            
            if (profile.state === "Logistics Partner") {
              setActiveRole("buyer");
            } else if (profile.role === "admin") {
                setActiveRole(profile.activeRole || "buyer");
            } else if (profile.role === "both") {
              setActiveRole(profile.activeRole || "buyer");
            } else if (profile.role === "seller") {
              setActiveRole(profile.activeRole || "seller");
            } else {
              setActiveRole(profile.activeRole || "buyer");
            }

            if (!initialTabSet.current) {
              if (profile.state === "Logistics Partner") {
                setActiveTab("logistics");
              } else {
                const startRole = profile.activeRole || (profile.role === "seller" ? "seller" : "buyer");
                if (startRole === "seller") {
                  setActiveTab("dashboard");
                } else {
                  setActiveTab("market");
                }
              }
              if (profile.theme) {
                setIsDarkMode(profile.theme === "dark");
              }
              initialTabSet.current = true;
            }
            setAuthLoading(false);
            setNeedsProfile(false);
          } else {
            setCurrentUser(null);
            setNeedsProfile(true);
            setTimeout(() => {
              setAuthLoading(false);
            }, 1500);
          }
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
          setAuthLoading(false);
        });

        const notifQ = query(
          collection(db, "notifications"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        );
        unsubscribeNotifs = onSnapshot(notifQ, (snapshot) => {
          const notifs = Array.from(new Map(snapshot.docs.map(doc => {
            const d = { id: doc.id, ...doc.data() } as Notification;
            return [d.id, d];
          })).values());
          setNotifications(notifs);
        }, (error) => {
          if (!auth.currentUser) return;
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
        setAuthLoading(false);
        setNotifications([]);
      }
    });

    const productsQ = query(collection(db, "products")); 
    const unsubscribeProducts = onSnapshot(productsQ, (snapshot) => {
      const productsData = Array.from(new Map(snapshot.docs.map(doc => {
        const d = { id: doc.id, ...doc.data() } as Product;
        return [d.id, d];
      })).values())
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); 
      setProducts(productsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "products");
    });

    const usersQ = query(collection(db, "users"));
    const unsubscribeUsers = onSnapshot(usersQ, (snapshot) => {
      const usersData = snapshot.docs.map(docSnap => ({ uid: docSnap.id, ...docSnap.data() } as UserProfile));
      const sellersList = usersData.filter(u => 
        (u.role === "seller" || u.businessName || u.storefrontSettings?.businessName) && 
        u.state !== "Logistics Partner"
      );
      setSellers(sellersList);
    }, (error) => {
      console.error("Error subscribing to users for storefront search:", error);
    });

    return () => {
      window.removeEventListener('view-product-market', handleViewProduct);
      window.removeEventListener('view-category', handleViewCategory);
      window.removeEventListener('view-product-detail', handleViewProductDetail);
      window.removeEventListener('view-seller-store', handleViewSellerStore);
      window.removeEventListener('open-chat', handleOpenChat);
      window.removeEventListener('switch-active-role', handleSwitchRole);
      window.removeEventListener('edit-seller-product', handleEditSellerProduct);
      window.removeEventListener('switch-tab', handleSwitchTabEvent);
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
      if (unsubscribeNotifs) unsubscribeNotifs();
      unsubscribeProducts();
      unsubscribeUsers();
    };
  }, []);

  const filteredProducts = Array.from(new Map<string, Product>(products.filter((p) => {
    if (p.isDeleted || p.isHibernated || (p.stock !== undefined && p.stock <= 0)) return false;
    
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

  const vendorNames = Array.from(new Set(products.filter(p => !p.isDeleted).map(p => p.sellerName).filter(Boolean))).sort();
  const categories = ALL_CATEGORIES;

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, "notifications", id), { isRead: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `notifications/${id}`);
    }
  };

  const toggleRole = async () => {
    if (!currentUser) return;
    const newRole = activeRole === "buyer" ? "seller" : "buyer";
    
    // Update local state first for immediate UI response
    setActiveRole(newRole);
    setActiveTab(newRole === "seller" ? "dashboard" : "market");
    triggerDynamicIsland(newRole === "seller" ? "Merchant Mode Active 💼" : "Shopping Mode Active 🛍️");
    
    // Persist to Firestore if user has 'both', 'admin', or 'seller' role
    if (currentUser.role === "both" || currentUser.role === "admin" || currentUser.role === "seller") {
      try {
        await updateDoc(doc(db, "users", currentUser.uid), {
          activeRole: newRole
        });
      } catch (error) {
        console.error("Failed to update active role:", error);
      }
    }
  };

  React.useEffect(() => {
    if (currentUser && pendingCartItem) {
      const { product, menuItem, ticketTier, formResponses, previousTab } = pendingCartItem;
      handleAddToCart(product, menuItem, ticketTier, formResponses);
      setActiveTab(previousTab || "market");
      setPendingCartItem(null);
    }
  }, [currentUser, pendingCartItem]);

  const handleAddToCart = async (product: Product, menuItem?: any, ticketTier?: any, formResponses?: Record<string, string>) => {
    if (!currentUser) {
      setPendingCartItem({
        product,
        menuItem,
        ticketTier,
        formResponses,
        previousTab: activeTab
      });
      setActiveTab("settings");
      return;
    }

    if (currentUser && currentUser.uid === product.sellerId) {
      alert("You cannot purchase your own product.");
      return;
    }

    const itemQuantity = menuItem?.quantity || 1;

    setCart((prev) => {
      const existing = prev.find((item) => 
        item.productId === product.id && 
        (menuItem ? (item.menuItemId === (menuItem.id || menuItem.name)) : !item.menuItemId) &&
        (ticketTier ? (item.ticketTierId === (ticketTier.id || ticketTier.name)) : !item.ticketTierId)
      );
      if (existing) {
        return prev.map((item) =>
          (item.productId === product.id && 
           (menuItem ? (item.menuItemId === (menuItem.id || menuItem.name)) : !item.menuItemId) && 
           (ticketTier ? (item.ticketTierId === (ticketTier.id || ticketTier.name)) : !item.ticketTierId))
            ? { ...item, quantity: item.quantity + itemQuantity, formResponses: formResponses || item.formResponses, addedAt: Date.now() }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: menuItem ? `${product.name} - ${menuItem.name}` : (ticketTier ? `${product.name} (${ticketTier.name})` : product.name),
          price: menuItem ? menuItem.price : (ticketTier ? ticketTier.price : product.price),
          quantity: itemQuantity,
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
          addedAt: Date.now(),
        },
      ];
    });
    setIsCartOpen(true);
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
        handleFirestoreError(error, OperationType.CREATE, "notifications/cart");
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
    signOut(auth);
    setCart([]);
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

  if (authLoading || (currentUser && loading)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-slate-950 font-sans">
        {connectionError && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-sm">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 p-4 rounded-2xl flex items-center gap-3 shadow-xl">
              <XCircle className="w-5 h-5 text-red-500 shrink-0" />
              <p className="text-[11px] font-bold text-red-600 dark:text-red-400 leading-tight">{connectionError}</p>
            </div>
          </div>
        )}
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-[#ff6b00] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-widest">
            Loading...
          </p>
        </div>
      </div>
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
  if (currentUser && (currentUser.isSuspended || (currentUser.strikeCount !== undefined && currentUser.strikeCount >= 3))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-900 p-12 rounded-[3rem] shadow-2xl max-w-md w-full border border-red-100 dark:border-red-900/20"
        >
            <div className="w-24 h-24 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-500 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-lg shadow-red-100 dark:shadow-none">
              <XCircle className="w-12 h-12" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">Account Suspended</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-8">
              {currentUser.strikeCount !== undefined && currentUser.strikeCount >= 3 
                ? "Your account has been permanently suspended due to receiving 3 strikes for terms violations."
                : "Your account has been suspended for violating SHOPIVERSITY terms and conditions. If you believe this is a mistake, please contact SHOPIVERSITY support."}
            </p>
          <button 
            onClick={handleLogout}
            className="w-full h-16 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl font-bold text-lg hover:bg-slate-800 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-3"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </motion.div>
      </div>
    );
  }

  // Determine if we should show AuthPage based on selected tab for non-logged users
  const restrictedTabs = ["settings", "orders", "notifications", "messages", "history", "referrals", "dashboard", "analytics", "add-product", "products", "admin"];
  const isTabRestricted = restrictedTabs.includes(activeTab);
  


  // Double check admin access
  if (activeTab === "admin" && currentUser?.email !== "tommzypolaris@gmail.com") {
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
        {/* Mobile-optimized Header (minimal/hidden components on desktop) */}
        <motion.header
          initial={{ y: -15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md text-zinc-800 dark:text-zinc-100 border-b border-slate-100 dark:border-zinc-800/80 sticky top-0 z-[120] shrink-0 select-none font-sans px-3 sm:px-6 h-14 flex items-center justify-between shadow-sm"
        >
          {/* Left: App title or dynamic back button */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {viewingSellerId || viewingProduct || (activeTab !== "market" && activeTab !== "search" && activeTab !== "messages" && activeTab !== "orders" && activeTab !== "settings" && activeTab !== "dashboard") ? (
              <button 
                onClick={handleGoBack} 
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800/80 rounded-xl text-[#ff6b00] active:scale-90 transition-all cursor-pointer border-none"
                title="Go Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800/80 rounded-xl text-[#ff6b00] active:scale-95 transition-all cursor-pointer border-none flex items-center justify-center shrink-0"
                  title="Open Navigation Menu"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <Logo 
                  onClick={() => {
                    if (activeRole === "seller") {
                      setActiveTab("dashboard");
                    } else {
                      setActiveTab("market");
                    }
                    setViewingProduct(null);
                    setViewingSellerId(null);
                    setFilterCategory("All");
                    setSearchQuery("");
                  }} 
                  className="ml-1 sm:ml-3" 
                />
              </div>
            )}
          </div>

          {/* Center: Removed delivery select campus context */}

        {/* Dynamic Title for sub-tabs */}
        {activeTab === "settings" && (
          <span className="hidden sm:inline-block text-xs font-bold text-slate-700 dark:text-slate-300 font-sans truncate max-w-[120px] sm:max-w-none">
            {settingsSubView === "edit" ? "Edit Profile" : "My Profile"}
          </span>
        )}
        {activeTab === "referrals" && (
          <span className="hidden sm:inline-block text-xs font-bold text-slate-700 dark:text-slate-300 font-sans">Referral Network</span>
        )}
        {activeTab === "orders" && (
          <span className="hidden sm:inline-block text-xs font-bold text-slate-700 dark:text-slate-300 font-sans">
            {activeRole === "seller" ? "Sales Orders" : "My Orders"}
          </span>
        )}
        {activeTab === "messages" && (
          <span className="hidden sm:inline-block text-xs font-bold text-slate-700 dark:text-slate-300 font-sans">Inbox Chats</span>
        )}

        {/* Right actions: Theme toggle and Cart */}
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 shrink-0">
          {/* Cart with count (only in buyer explore tab) */}
          {activeRole === "buyer" && (
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative p-1.5 hover:bg-orange-50 dark:hover:bg-zinc-800/80 rounded-xl text-[#ff6b00] cursor-pointer transition-colors border-none"
              aria-label="View shopping cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {cart.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 px-1 bg-[#ff6b00] text-[8px] font-black text-white rounded-full min-w-[14px] h-[14px] flex items-center justify-center border border-white dark:border-zinc-900 leading-none">
                  {cart.reduce((acc, item) => acc + item.quantity, 0)}
                </span>
              )}
            </button>
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
        <main className="flex-1 overflow-y-auto bg-white dark:bg-zinc-950 scroll-smooth">
          <AnimatePresence mode="wait">
            {!currentUser && isTabRestricted ? (
              <motion.div
                key="auth"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="min-h-full flex flex-col justify-center"
              >
                <AuthPage initialNeedsProfile={needsProfile} />
              </motion.div>
            ) : activeTab === "admin" && currentUser?.role === "admin" ? (
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
                              const el = document.getElementById('product-grid');
                              el?.scrollIntoView({ behavior: 'smooth' });
                            } else {
                              setActiveTab("settings");
                            }
                          }}
                          onStartSelling={() => {
                            if (currentUser) {
                              if (currentUser.state === "Logistics Partner") {
                                alert("Your account is registered as a Logistics Partner. You can manage your logistics hub directly.");
                              } else if (currentUser.role === "buyer") {
                                setActiveTab("settings");
                                alert("Please switch to a seller account in your profile/sidebar to start selling.");
                              } else {
                                setActiveRole("seller");
                                setActiveTab("dashboard");
                              }
                            } else {
                              setActiveTab("dashboard"); // This will trigger AuthPage
                            }
                          }}
                          currentUser={currentUser}
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
                          className="h-9 px-3 bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-md text-xs font-medium text-slate-700 dark:text-zinc-300 outline-none focus:border-[#ff6b00] transition-all shadow-sm cursor-pointer"
                        >
                          <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" value="All">All Conditions</option>
                          <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" value="new">Brand New</option>
                          <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" value="used">Gently Used</option>
                        </select>
                        <select 
                          value={filterPriceRange}
                          onChange={(e) => setFilterPriceRange(e.target.value)}
                          className="h-9 px-3 bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-md text-xs font-medium text-slate-700 dark:text-zinc-300 outline-none focus:border-amber-500 transition-all shadow-sm cursor-pointer"
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
                      {loading ? (
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
                          />
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
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
                      {["white shirt", "textbook", "jacket", "calculator"].map((tag) => (
                        <button
                          key={`suggest-tag-${tag}`}
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
                      {["Bites", "Store", "Fashion", "Tutor"].map((tag) => (
                        <button
                          key={`suggest-tag-store-${tag}`}
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
                          <ShoppingBag className="w-16 h-16 text-slate-300 dark:text-zinc-750 mx-auto mb-4" />
                          <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-200">What can we help you find today?</h3>
                          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto mt-2 leading-relaxed">
                            Type your requirements like <span className="font-semibold text-orange-600 dark:text-orange-400">"I want a white shirt"</span> or <span className="font-semibold text-orange-600 dark:text-orange-400">"chemistry textbook"</span> to get instant matches.
                          </p>
                        </div>
                      );
                    }

                    const searchResults = products.filter((p) => {
                      if (p.isDeleted || p.isHibernated || (p.stock !== undefined && p.stock <= 0)) return false;
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
                              key={`search-card-${p.id}-${pIdx}`}
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
                              />
                            </motion.div>
                          ))}
                        </motion.div>
                      </div>
                    );
                  })()}
                </div>
              </motion.div>
            ) : activeTab === "dashboard" && activeRole === "buyer" ? (
              <motion.div
                key="buyer-dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <BuyerDashboard user={currentUser} setActiveTab={setActiveTab} onBack={handleGoBack} />
              </motion.div>
            ) : (activeTab === "dashboard" || activeTab === "overview" || activeTab === "analytics" || activeTab === "add-product" || activeTab === "my-products" || (activeTab === "orders" && activeRole === "seller") || activeTab === "storefront" || activeTab === "referrals" || activeTab === "payouts") && activeRole === "seller" ? (
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
                    activeTab === "orders" ? "orders" : 
                    activeTab === "storefront" ? "storefront" :
                    activeTab === "referrals" ? "referrals" :
                    activeTab === "payouts" ? "payouts" :
                    "overview"
                  }
                  initialProductType="good"
                  initialEditingProduct={pendingEditProduct}
                  onClearEditingProduct={() => setPendingEditProduct(null)}
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
                <OrderTracking setActiveTab={setActiveTab} onBack={handleGoBack} />
              </motion.div>
            ) : activeTab === "history" && currentUser ? (
              <motion.div 
                key="history"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <ProductHistory onBack={handleGoBack} />
              </motion.div>
            ) : activeTab === "referrals" && currentUser ? (
              <motion.div 
                key="referrals"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-8 max-w-[1200px] mx-auto"
              >
                <ReferralDashboard user={currentUser} onBack={handleGoBack} />
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
            ) : activeTab === "terms" ? (
              <motion.div 
                key="terms"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-6"
              >
                <TermsAndConditions onBack={handleGoBack} />
              </motion.div>
            ) : activeTab === "logistics" ? (
              <motion.div 
                key="logistics"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <LogisticsHub onBackToMarket={() => setActiveTab("market")} />
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

          {/* Clean modern website footer */}
          <Footer setActiveTab={setActiveTab} activeTab={activeTab} />
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

        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={(productId, delta, menuItemId, ticketTierId) => {
          setCart(prev => prev.map(item => 
            (item.productId === productId && item.menuItemId === menuItemId && item.ticketTierId === ticketTierId)
              ? { ...item, quantity: Math.max(0, item.quantity + delta) } 
              : item
          ).filter(item => item.quantity > 0));
        }}
        onRemove={(productId, menuItemId, ticketTierId) => 
          setCart(prev => prev.filter(item => 
            !(item.productId === productId && item.menuItemId === menuItemId && item.ticketTierId === ticketTierId)
          ))
        }
        onClear={() => setCart([])}
        currentUser={currentUser}
        setActiveTab={setActiveTab}
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
          setTimeout(() => {
            const el = document.getElementById('support-form');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 100);
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

      {/* Role selector */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-[#ff6b00]">Quick Role Switch</h3>
        <button
          onClick={toggleRole}
          disabled={!currentUser}
          className="w-full h-11 bg-white/5 hover:bg-white/10 active:scale-[0.98] border border-white/10 hover:border-[#ff6b00]/30 rounded-xl flex items-center justify-between px-4 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer group"
        >
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-3.5 h-3.5 text-orange-450 group-hover:rotate-180 transition-transform duration-500" />
            <span className="text-[11px] font-bold text-zinc-300 font-sans">
              Active: {activeRole === "buyer" ? "Buyer" : "Seller"}
            </span>
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest text-[#ff6b00]">
            Toggle
          </span>
        </button>
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

  // Clean Full-Width Website Mode
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col transition-colors duration-500 selection:bg-orange-500/20 relative w-full h-screen overflow-hidden font-sans">
      {appLayout}
    </div>
  );
}
