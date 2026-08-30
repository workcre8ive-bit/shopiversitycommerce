import React from "react";
import { auth, db, googleProvider } from "../firebase";
import { handleFirestoreError, OperationType, getFirestoreErrorMessage } from "../lib/firebase-errors";
import { generateReferralCode, cn } from "../lib/utils";
import Logo from "./Logo";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  browserPopupRedirectResolver
} from "firebase/auth";
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  onSnapshot,
  addDoc
} from "firebase/firestore";
import { 
  Truck, 
  Package, 
  Navigation, 
  ShieldCheck, 
  Clock, 
  DollarSign, 
  Building, 
  Mail, 
  Lock, 
  Phone, 
  User, 
  MapPin, 
  Search, 
  Check, 
  Bell,
  AlertCircle, 
  Loader2, 
  LogOut, 
  ChevronRight, 
  ArrowRight, 
  Layers, 
  Sparkles, 
  ShieldAlert, 
  TrendingUp,
  UserCheck,
  X,
  Eye,
  EyeOff,
  Tag,
  CheckCircle2,
  Edit3,
  Save,
  CheckCircle,
  RefreshCw,
  Smartphone,
  CreditCard,
  Plus
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { NIGERIAN_CAMPUSES } from "../constants/campuses";
import DashboardSlideshow from "./DashboardSlideshow";

interface LogisticsCompany {
  id: string;
  companyName: string;
  rcNumber: string;
  email: string;
  phoneNumber: string;
  whatsappNumber?: string;
  officeAddress: string;
  vehicleTypes: string[];
  coveredCampuses: string[];
  baseDeliveryPrice: number;
  estimatedTurnaround?: string;
  description?: string;
  operatingHours?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

interface DeliveryJob {
  id: string;
  orderId: string;
  productName: string;
  productImageUrl?: string;
  quantity: number;
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
  buyerAddress: string;
  sellerId: string;
  sellerName: string;
  sellerPhone?: string;
  sellerAddress: string;
  campus: string;
  status: "pending" | "accepted" | "picked_up" | "in_transit" | "delivered" | "cancelled";
  logisticsId?: string;
  logisticsName?: string;
  deliveryPrice: number;
  createdAt: string;
  updatedAt: string;
}

export default function LogisticsHub({ onBackToMarket }: { onBackToMarket: () => void }) {
  const [view, setView] = React.useState<"splash" | "login" | "signup" | "verify" | "dashboard">("splash");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [successMsg, setSuccessMsg] = React.useState("");

  // Auth User state
  const [companyProfile, setCompanyProfile] = React.useState<LogisticsCompany | null>(null);

  // Login form states
  const [loginEmail, setLoginEmail] = React.useState("");
  const [loginPassword, setLoginPassword] = React.useState("");

  // Forgot Password states
  const [showForgotPassword, setShowForgotPassword] = React.useState(false);
  const [resetEmail, setResetEmail] = React.useState("");
  const [resetEmailSent, setResetEmailSent] = React.useState(false);
  const [resetLoading, setResetLoading] = React.useState(false);
  const [resetError, setResetError] = React.useState("");

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail || !resetEmail.trim()) {
      setResetError("Please enter your account email address.");
      return;
    }
    setResetLoading(true);
    setResetError("");
    try {
      const actionCodeSettings = {
        url: window.location.origin,
        handleCodeInApp: false
      };
      await sendPasswordResetEmail(auth, resetEmail.trim(), actionCodeSettings);
      setResetEmailSent(true);
    } catch (err: any) {
      console.error("Password reset error:", err);
      if (err.code === "auth/user-not-found") {
        setResetError("No account found with this email address.");
      } else if (err.code === "auth/invalid-email") {
        setResetError("Please enter a valid email address.");
      } else if (err.code === "auth/too-many-requests") {
        setResetError("Too many password reset requests. Please wait a moment and try again.");
      } else {
        setResetError(err.message || "Failed to send password reset email. Please try again.");
      }
    } finally {
      setResetLoading(false);
    }
  };

  // Signup form states
  const [companyName, setCompanyName] = React.useState("");
  const [rcNumber, setRcNumber] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phoneNumber, setPhoneNumber] = React.useState("");
  const [officeAddress, setOfficeAddress] = React.useState("");
  const [selectedVehicles, setSelectedVehicles] = React.useState<string[]>([]);
  const [selectedCampuses, setSelectedCampuses] = React.useState<string[]>([]);
  const [basePrice, setBasePrice] = React.useState(500);
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");

  // Password visibility states
  const [showLoginPassword, setShowLoginPassword] = React.useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  // Campus search in signup
  const [campusSearch, setCampusSearch] = React.useState("");

  // Verification code states
  const [verificationCode, setVerificationCode] = React.useState("");
  const [generatedOtp, setGeneratedOtp] = React.useState("");

  // Referral code state
  const [referralCodeInput, setReferralCodeInput] = React.useState("");

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      localStorage.setItem('referredBy', ref);
      setReferralCodeInput(ref);
    } else {
      const storedRef = localStorage.getItem('referredBy');
      if (storedRef) setReferralCodeInput(storedRef);
    }
  }, []);

  // Dashboard Tab state
  const [activeTab, setActiveTab] = React.useState<"available-jobs" | "active-deliveries" | "history" | "profile">("available-jobs");

  // Profile editing states
  const [isEditingProfile, setIsEditingProfile] = React.useState(false);
  const [editCompanyName, setEditCompanyName] = React.useState("");
  const [editRcNumber, setEditRcNumber] = React.useState("");
  const [editPhoneNumber, setEditPhoneNumber] = React.useState("");
  const [editWhatsappNumber, setEditWhatsappNumber] = React.useState("");
  const [editOfficeAddress, setEditOfficeAddress] = React.useState("");
  const [editBaseDeliveryPrice, setEditBaseDeliveryPrice] = React.useState(500);
  const [editEstimatedTurnaround, setEditEstimatedTurnaround] = React.useState("1-3 Hours on Campus");
  const [editOperatingHours, setEditOperatingHours] = React.useState("8:00 AM - 8:00 PM");
  const [editDescription, setEditDescription] = React.useState("");
  const [editSelectedVehicles, setEditSelectedVehicles] = React.useState<string[]>([]);
  const [editSelectedCampuses, setEditSelectedCampuses] = React.useState<string[]>([]);
  const [editBankName, setEditBankName] = React.useState("");
  const [editAccountNumber, setEditAccountNumber] = React.useState("");
  const [editAccountName, setEditAccountName] = React.useState("");
  const [editIsActive, setEditIsActive] = React.useState(true);
  const [profileCampusSearch, setProfileCampusSearch] = React.useState("");
  const [customVehicleInput, setCustomVehicleInput] = React.useState("");
  const [savingProfile, setSavingProfile] = React.useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = React.useState("");

  // Quick accept & filter states
  const [jobAcceptingId, setJobAcceptingId] = React.useState<string | null>(null);
  const [jobEtaInput, setJobEtaInput] = React.useState<string>("");
  const [scopeCampusFilter, setScopeCampusFilter] = React.useState<"all" | "covered">("all");

  // Courier Delivery OTP verification states
  const [otpModalJob, setOtpModalJob] = React.useState<DeliveryJob | null>(null);
  const [otpInput, setOtpInput] = React.useState("");
  const [otpError, setOtpError] = React.useState<string | null>(null);
  const [verifyingOtp, setVerifyingOtp] = React.useState(false);

  // Delivery Attempt / Failure Reporting states
  const [failureModalJob, setFailureModalJob] = React.useState<DeliveryJob | null>(null);
  const [failureReason, setFailureReason] = React.useState<string>("buyer_unavailable");
  const [failureResolution, setFailureResolution] = React.useState<string>("reschedule");
  const [failureNotes, setFailureNotes] = React.useState<string>("");
  const [submittingFailure, setSubmittingFailure] = React.useState(false);

  // Database jobs lists
  const [allDeliveries, setAllDeliveries] = React.useState<DeliveryJob[]>([]);

  // Synchronize edit fields when company profile loads
  React.useEffect(() => {
    if (companyProfile) {
      setEditCompanyName(companyProfile.companyName || "");
      setEditRcNumber(companyProfile.rcNumber || "");
      setEditPhoneNumber(companyProfile.phoneNumber || "");
      setEditWhatsappNumber(companyProfile.whatsappNumber || "");
      setEditOfficeAddress(companyProfile.officeAddress || "");
      setEditBaseDeliveryPrice(companyProfile.baseDeliveryPrice || 500);
      setEditEstimatedTurnaround(companyProfile.estimatedTurnaround || "1-3 Hours on Campus");
      setEditOperatingHours(companyProfile.operatingHours || "8:00 AM - 8:00 PM");
      setEditDescription(companyProfile.description || "");
      setEditSelectedVehicles(companyProfile.vehicleTypes && companyProfile.vehicleTypes.length > 0 ? companyProfile.vehicleTypes : ["Bike / Motorcycle"]);
      setEditSelectedCampuses(companyProfile.coveredCampuses || []);
      setEditBankName(companyProfile.bankName || "");
      setEditAccountNumber(companyProfile.accountNumber || "");
      setEditAccountName(companyProfile.accountName || "");
      setEditIsActive(companyProfile.isActive !== false);
    }
  }, [companyProfile]);

  // Check auth on load
  React.useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setLoading(true);
        try {
          const docSnap = await getDoc(doc(db, "logistics_companies", user.uid));
          if (docSnap.exists()) {
            const data = docSnap.data() as LogisticsCompany;
            if (data.isVerified) {
              setCompanyProfile(data);
              setView("dashboard");
            } else {
              // Sign out if not verified yet
              await signOut(auth);
              setView("login");
            }
          } else {
            // Not a logistics user, wait and let them login or do nothing
          }
        } catch (err: any) {
          console.error("Error fetching logistics profile:", err);
        } finally {
          setLoading(false);
        }
      } else {
        setCompanyProfile(null);
        if (view === "dashboard") {
          setView("splash");
        }
      }
    });
    return unsubscribe;
  }, [view]);

  // Guard view when signed in as Buyer/Seller
  React.useEffect(() => {
    if (auth.currentUser && !companyProfile && view !== "splash") {
      setView("splash");
    }

    const checkRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          setLoading(true);
          await processLogisticsGoogleUser(result.user);
        }
      } catch (err: any) {
        console.error("Logistics Google Redirect Error:", err);
      } finally {
        setLoading(false);
      }
    };
    checkRedirectResult();
  }, [companyProfile, view]);

  // Listen to both logistics deliveries and delivery orders in real-time
  React.useEffect(() => {
    if (view !== "dashboard" || !companyProfile) return;

    let deliveriesMap = new Map<string, DeliveryJob>();

    // 1. Subscribe to logistics_deliveries collection
    const unsubscribeDeliveries = onSnapshot(collection(db, "logistics_deliveries"), (snapshot) => {
      snapshot.forEach((d) => {
        const data = d.data();
        deliveriesMap.set(d.id, { id: d.id, ...data } as DeliveryJob);
      });
      setAllDeliveries(Array.from(deliveriesMap.values()));
    }, (error) => {
      console.error("Logistics deliveries subscription failed:", error);
    });

    // 2. Also subscribe to orders where deliveryType == 'delivery' to catch all dispatches
    const qOrders = query(
      collection(db, "orders"),
      where("deliveryType", "==", "delivery")
    );

    const unsubscribeOrders = onSnapshot(qOrders, (snapshot) => {
      snapshot.forEach((docSnap) => {
        const ord = docSnap.data();
        const orderId = docSnap.id;
        const jobId = `DLV_${orderId}`;

        if (!deliveriesMap.has(jobId)) {
          let mappedStatus: DeliveryJob["status"] = "pending";
          if (ord.status === "completed" || ord.status === "Order Delivered" || ord.status === "delivered") {
            mappedStatus = "delivered";
          } else if (ord.status === "cancelled") {
            mappedStatus = "cancelled";
          } else if (ord.status === "out_for_delivery" || ord.status === "Out For Delivery" || ord.status === "transit") {
            mappedStatus = "in_transit";
          } else if (ord.status === "picked_up" || ord.status === "Order Picked Up") {
            mappedStatus = "picked_up";
          } else if (ord.logisticsOfferStatus === "accepted" || (ord.logisticsId === companyProfile.id && ord.status === "accepted")) {
            mappedStatus = "accepted";
          }

          const synthesizedJob: DeliveryJob = {
            id: jobId,
            orderId: orderId,
            productName: ord.productName || "Campus Product",
            productImageUrl: ord.productImageUrl || ord.productImage,
            quantity: ord.quantity || 1,
            buyerId: ord.buyerId || "",
            buyerName: ord.buyerName || "Campus Buyer",
            buyerPhone: ord.buyerPhone || ord.phoneNumber || "",
            buyerAddress: ord.deliveryAddress || ord.address || "Campus Hostel/Department",
            sellerId: ord.sellerId || "",
            sellerName: ord.sellerName || "Campus Merchant",
            sellerPhone: ord.sellerPhone || ord.sellerPhoneNumber || ord.sellerContact || "",
            sellerAddress: ord.sellerAddress || "Campus Merchant Store",
            campus: ord.pickupSchool || ord.campus || "General Campus",
            status: mappedStatus,
            logisticsId: ord.logisticsId,
            logisticsName: ord.logisticsName,
            deliveryPrice: ord.deliveryFee || ord.logisticsDeliveryPrice || ord.deliveryPrice || companyProfile.baseDeliveryPrice || 500,
            createdAt: ord.createdAt || new Date().toISOString(),
            updatedAt: ord.updatedAt || new Date().toISOString()
          };

          deliveriesMap.set(jobId, synthesizedJob);
        } else {
          // If already in map, update status if changed in orders
          const existing = deliveriesMap.get(jobId)!;
          if (ord.logisticsOfferStatus === "accepted" && existing.status === "pending") {
            existing.status = "accepted";
            deliveriesMap.set(jobId, existing);
          }
        }
      });
      setAllDeliveries(Array.from(deliveriesMap.values()));
    }, (error) => {
      console.warn("Orders subscription for logistics:", error);
    });

    return () => {
      unsubscribeDeliveries();
      unsubscribeOrders();
    };
  }, [view, companyProfile]);

  // Filter lists based on company profile
  const availableJobs = React.useMemo(() => {
    if (!companyProfile) return [];
    return allDeliveries.filter((job) => {
      if (job.status !== "pending") return false;

      // 1. Direct offer to this company
      const isDirectOffer = 
        job.logisticsId === companyProfile.id || 
        (!!job.logisticsName && !!companyProfile.companyName && job.logisticsName.toLowerCase().trim() === companyProfile.companyName.toLowerCase().trim());
      
      if (isDirectOffer) return true;

      // 2. If filtering by covered campuses
      if (scopeCampusFilter === "covered" && companyProfile.coveredCampuses && companyProfile.coveredCampuses.length > 0) {
        const matchesCampus = companyProfile.coveredCampuses.some(
          c => c.toLowerCase().includes(job.campus?.toLowerCase() || "") || 
               (job.campus && job.campus.toLowerCase().includes(c.toLowerCase())) ||
               job.campus === "General" ||
               job.campus === "All Campuses"
        );
        return matchesCampus;
      }

      // Default: show all available campus jobs
      return true;
    });
  }, [allDeliveries, companyProfile, scopeCampusFilter]);

  const directOffers = React.useMemo(() => {
    if (!companyProfile) return [];
    return allDeliveries.filter((job) => 
      job.status === "pending" && 
      (job.logisticsId === companyProfile.id || 
       (!!job.logisticsName && !!companyProfile.companyName && job.logisticsName.toLowerCase().trim() === companyProfile.companyName.toLowerCase().trim()))
    );
  }, [allDeliveries, companyProfile]);

  const activeDeliveries = React.useMemo(() => {
    if (!companyProfile) return [];
    return allDeliveries.filter((job) => 
      (job.logisticsId === companyProfile.id || (!!job.logisticsName && !!companyProfile.companyName && job.logisticsName.toLowerCase().trim() === companyProfile.companyName.toLowerCase().trim())) && 
      ["accepted", "picked_up", "in_transit"].includes(job.status)
    );
  }, [allDeliveries, companyProfile]);

  const deliveryHistory = React.useMemo(() => {
    if (!companyProfile) return [];
    return allDeliveries.filter((job) => 
      (job.logisticsId === companyProfile.id || (!!job.logisticsName && !!companyProfile.companyName && job.logisticsName.toLowerCase().trim() === companyProfile.companyName.toLowerCase().trim())) && 
      ["delivered", "cancelled"].includes(job.status)
    );
  }, [allDeliveries, companyProfile]);

  const processLogisticsGoogleUser = async (user: any) => {
    // Check if user is already registered as a Buyer/Seller account
    const userDocSnap = await getDoc(doc(db, "users", user.uid));
    if (userDocSnap.exists() && userDocSnap.data()?.role !== "logistics") {
      await signOut(auth);
      setError("This account is registered as a Buyer or Seller. Logistics partners must use a separate email address.");
      setLoading(false);
      return;
    }

    // Check if logistics company profile exists
    const companyDoc = await getDoc(doc(db, "logistics_companies", user.uid));
    
    if (companyDoc.exists()) {
      const profile = companyDoc.data() as LogisticsCompany;
      setCompanyProfile(profile);
      setView("dashboard");
    } else {
      // Create new company profile using Google account details or filled form inputs
      const profile: LogisticsCompany = {
        id: user.uid,
        companyName: companyName.trim() || user.displayName || "Logistics Partner",
        rcNumber: rcNumber.trim() || `RC-${user.uid.slice(0, 8).toUpperCase()}`,
        email: user.email || "",
        phoneNumber: phoneNumber.trim() || user.phoneNumber || "",
        officeAddress: officeAddress.trim() || "Main Campus Office",
        vehicleTypes: selectedVehicles.length > 0 ? selectedVehicles : ["Bike / Motorcycle"],
        coveredCampuses: selectedCampuses.length > 0 ? selectedCampuses : ["University Main Campus"],
        baseDeliveryPrice: Number(basePrice) > 0 ? Number(basePrice) : 500,
        isVerified: true,
        isActive: true,
        createdAt: new Date().toISOString()
      };

      const referralCode = generateReferralCode(profile.companyName || user.displayName || "LOGISTICS");
      const referredBy = referralCodeInput.trim() || localStorage.getItem('referredBy');

      await setDoc(doc(db, "logistics_companies", user.uid), profile);

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        displayName: profile.companyName,
        username: profile.companyName.toLowerCase().replace(/[^a-z0-9]/g, "") + "_logistics",
        email: user.email,
        phoneNumber: profile.phoneNumber,
        role: "logistics",
        referralCode,
        referredBy: referredBy || "",
        referralEarnings: 0,
        referralCount: 0,
        isVerified: true,
        isSuspended: false,
        reportCount: 0,
        createdAt: new Date().toISOString(),
        businessName: profile.companyName,
        location: profile.officeAddress,
        state: "Logistics Partner"
      }, { merge: true });

      // If referred by someone, increment their referral count
      if (referredBy) {
        try {
          const referrersQ = query(collection(db, "users"), where("referralCode", "==", referredBy));
          const referrersSnap = await getDocs(referrersQ);
          if (!referrersSnap.empty) {
            const referrerDoc = referrersSnap.docs[0];
            const currentCount = referrerDoc.data().referralCount || 0;
            await updateDoc(referrerDoc.ref, { referralCount: currentCount + 1 });
          }
        } catch (refErr) {
          console.warn("Error processing referral in LogisticsHub:", refErr);
        }
      }
      localStorage.removeItem('referredBy');

      setCompanyProfile(profile);
      setView("dashboard");
    }
  };

  // Handle Google Auth (Login or Signup)
  const handleGoogleAuth = async () => {
    setError("");
    setLoading(true);
    try {
      let user = null;
      try {
        const result = await signInWithPopup(auth, googleProvider, browserPopupRedirectResolver);
        user = result.user;
      } catch (popupErr: any) {
        console.warn("Logistics Google popup failed/blocked, falling back to redirect:", popupErr);
        await signInWithRedirect(auth, googleProvider);
        return;
      }

      if (user) {
        await processLogisticsGoogleUser(user);
      }
    } catch (err: any) {
      const errorCode = err.code || "";
      if (errorCode === "auth/popup-closed-by-user" || errorCode === "auth/cancelled-popup-request") {
        setError("Sign-in cancelled.");
      } else {
        console.error("Google Auth error in LogisticsHub:", err);
        try {
          await signInWithRedirect(auth, googleProvider);
        } catch (redirectErr) {
          setError(getFirestoreErrorMessage(err) || "Failed to sign in with Google.");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      const user = userCredential.user;
      
      const userDocSnap = await getDoc(doc(db, "users", user.uid));
      if (userDocSnap.exists() && userDocSnap.data()?.role !== "logistics") {
        await signOut(auth);
        setError("This account is registered as a Buyer/Seller account. Please log in through the main user portal or use a dedicated logistics email.");
        setLoading(false);
        return;
      }

      const docSnap = await getDoc(doc(db, "logistics_companies", user.uid));
      if (!docSnap.exists()) {
        await signOut(auth);
        setError("This account is not registered as a Logistics Partner. Please register a new logistics account with a separate email.");
        setLoading(false);
        return;
      }

      const profile = docSnap.data() as LogisticsCompany;
      if (!profile.isVerified) {
        await signOut(auth);
        setError("Please register again and complete your email/phone number verification.");
        setLoading(false);
        return;
      }

      setCompanyProfile(profile);
      setView("dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to log in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Register Initiate (Triggers verification view)
  const handleRegisterInit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!companyName.trim()) return setError("Company Name is required.");
    if (!rcNumber.trim()) return setError("RC / Registration Number is required.");
    if (!email.trim()) return setError("Email address is required.");
    if (!phoneNumber.trim()) return setError("Phone number is required.");
    if (!officeAddress.trim()) return setError("Physical office address is required.");
    if (selectedVehicles.length === 0) return setError("Please select at least one vehicle type.");
    if (selectedCampuses.length === 0) return setError("Please select at least one campus you cover.");
    if (basePrice <= 0) return setError("Please enter a valid base delivery fee.");
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/?]).{6,}$/;
    if (!passwordRegex.test(password)) {
      return setError("Password must be at least 6 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.");
    }
    if (password !== confirmPassword) return setError("Passwords do not match.");

    setLoading(true);
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email.trim().toLowerCase()));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const existingData = snap.docs[0].data();
        if (existingData.role !== "logistics") {
          setError("This email address is already registered as a Buyer or Seller account. Logistics partners must use a separate email address.");
          setLoading(false);
          return;
        } else {
          setError("An account with this email address is already registered as a Logistics Partner. Please log in instead.");
          setLoading(false);
          return;
        }
      }
    } catch (checkErr) {
      console.warn("Email pre-check failed, proceeding to verification", checkErr);
    } finally {
      setLoading(false);
    }

    // Generate random OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otp);
    setView("verify");
  };

  // Handle OTP Verification and Final Account Creation
  const handleVerifyAndCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (verificationCode !== generatedOtp) {
      return setError("Invalid verification code. Please enter the code shown below.");
    }

    setLoading(true);
    try {
      // Create user in standard firebase auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      try {
        const actionCodeSettings = {
          url: window.location.origin,
          handleCodeInApp: false
        };
        await sendEmailVerification(user, actionCodeSettings);
        console.log(`[FIREBASE AUTH] Logistics signup verification email sent to ${email}`);
      } catch (evErr) {
        console.warn("Logistics sendEmailVerification notice:", evErr);
      }

      const profile: LogisticsCompany = {
        id: user.uid,
        companyName,
        rcNumber,
        email,
        phoneNumber,
        officeAddress,
        vehicleTypes: selectedVehicles,
        coveredCampuses: selectedCampuses,
        baseDeliveryPrice: Number(basePrice),
        isVerified: true,
        isActive: true,
        createdAt: new Date().toISOString()
      };

      // Save logistics company profile
      await setDoc(doc(db, "logistics_companies", user.uid), profile);

      const referralCode = generateReferralCode(companyName || "LOGISTICS");
      const referredBy = referralCodeInput.trim() || localStorage.getItem('referredBy');

      // Create a matching standard user record with a 'logistics' identifier
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        displayName: companyName,
        username: companyName.toLowerCase().replace(/[^a-z0-9]/g, "") + "_logistics",
        email: email,
        phoneNumber: phoneNumber,
        role: "logistics",
        referralCode,
        referredBy: referredBy || "",
        referralEarnings: 0,
        referralCount: 0,
        isVerified: true,
        isSuspended: false,
        reportCount: 0,
        createdAt: new Date().toISOString(),
        businessName: companyName,
        location: officeAddress,
        state: "Logistics Partner"
      });

      // If referred by someone, increment their referral count
      if (referredBy) {
        try {
          const referrersQ = query(collection(db, "users"), where("referralCode", "==", referredBy));
          const referrersSnap = await getDocs(referrersQ);
          if (!referrersSnap.empty) {
            const referrerDoc = referrersSnap.docs[0];
            const currentCount = referrerDoc.data().referralCount || 0;
            await updateDoc(referrerDoc.ref, { referralCount: currentCount + 1 });
          }
        } catch (refErr) {
          console.warn("Error processing referral in LogisticsHub:", refErr);
        }
      }
      localStorage.removeItem('referredBy');

      // Explicitly sign out the newly created user so they can log in cleanly on the Login screen
      await signOut(auth);

      setSuccessMsg("Account verified and created successfully! Please log in.");
      setView("login");
      
      // Clear forms
      setCompanyName("");
      setRcNumber("");
      setEmail("");
      setPhoneNumber("");
      setOfficeAddress("");
      setSelectedVehicles([]);
      setSelectedCampuses([]);
      setPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      console.error("Verification and creation error:", err);
      setError(err.message || "Failed to complete signup. Email might already be in use.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Accept Job
  const handleAcceptJob = async (jobId: string, customEta?: string) => {
    if (!companyProfile) return;
    setLoading(true);
    setError("");
    try {
      const timeline = customEta?.trim() || companyProfile.estimatedTurnaround || "1-3 Hours on Campus";
      const courierPrice = companyProfile.baseDeliveryPrice || 500;

      // Find job from list
      const jobItem = allDeliveries.find(j => j.id === jobId || j.orderId === jobId);
      const actualOrderId = jobItem?.orderId || jobId.replace("DLV_", "");

      // 1. Update / create logistics_deliveries doc with setDoc merge
      const deliveryDocId = jobId.startsWith("DLV_") ? jobId : `DLV_${actualOrderId}`;
      const jobDocRef = doc(db, "logistics_deliveries", deliveryDocId);
      await setDoc(jobDocRef, {
        orderId: actualOrderId,
        status: "accepted",
        logisticsId: companyProfile.id,
        logisticsName: companyProfile.companyName,
        logisticsPhone: companyProfile.phoneNumber,
        deliveryPrice: jobItem?.deliveryPrice || courierPrice,
        estimatedDeliveryTimeline: timeline,
        productName: jobItem?.productName || "Campus Order",
        buyerName: jobItem?.buyerName || "Buyer",
        buyerPhone: jobItem?.buyerPhone || "",
        buyerAddress: jobItem?.buyerAddress || "",
        sellerName: jobItem?.sellerName || orderData.sellerName || "Merchant",
        sellerPhone: jobItem?.sellerPhone || orderData.sellerPhone || orderData.sellerPhoneNumber || "",
        sellerAddress: jobItem?.sellerAddress || orderData.sellerAddress || "",
        sellerId: jobItem?.sellerId || orderData.sellerId || "",
        campus: jobItem?.campus || "Campus",
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // 2. Update standard orders doc
      const orderRef = doc(db, "orders", actualOrderId);
      const orderSnap = await getDoc(orderRef);
      if (orderSnap.exists()) {
        const orderData = orderSnap.data();
        const itemSubtotal = orderData.itemSubtotal || (orderData.totalPrice - (orderData.deliveryFee || 0));
        const finalDeliveryPrice = jobItem?.deliveryPrice || orderData.deliveryFee || courierPrice;
        const newTotalPrice = itemSubtotal + finalDeliveryPrice;

        await updateDoc(orderRef, {
          status: "accepted",
          logisticsOfferStatus: "accepted",
          logisticsId: companyProfile.id,
          logisticsName: companyProfile.companyName,
          logisticsPhone: companyProfile.phoneNumber,
          logisticsDeliveryPrice: finalDeliveryPrice,
          deliveryFee: finalDeliveryPrice,
          deliveryPrice: finalDeliveryPrice,
          itemSubtotal: itemSubtotal,
          totalPrice: newTotalPrice,
          logisticsEstimatedDeliveryTimeline: timeline,
          kwikRiderId: `CAMPUS-${companyProfile.companyName.toUpperCase().replace(/\s+/g, "-")}`,
          kwikTrackingUrl: "local_logistics",
          deliveredWorkNotes: `Accepted by dispatch: ${companyProfile.companyName} (${companyProfile.phoneNumber}) - Timeline: ${timeline} (Delivery Fee: ₦${finalDeliveryPrice.toLocaleString()})`,
          updatedAt: new Date().toISOString()
        });

        // 3. Notify the seller
        if (orderData.sellerId) {
          await addDoc(collection(db, "notifications"), {
            userId: orderData.sellerId,
            title: "Logistics Partner Confirmed 🚚",
            message: `Logistics company ${companyProfile.companyName} accepted your dispatch for order ${orderData.productName || "product"}. Estimated timeline: ${timeline}.`,
            type: "order",
            isRead: false,
            createdAt: new Date().toISOString()
          });
        }

        // 4. Notify the buyer
        if (orderData.buyerId) {
          await addDoc(collection(db, "notifications"), {
            userId: orderData.buyerId,
            title: "Courier Assigned to Your Order 🚚",
            message: `Campus Courier ${companyProfile.companyName} (${companyProfile.phoneNumber}) is handling delivery of ${orderData.productName || "your order"}. Estimated timeline: ${timeline}.`,
            type: "order",
            isRead: false,
            createdAt: new Date().toISOString()
          });
        }
      }

      setJobAcceptingId(null);
      setSuccessMsg(`Order accepted! Move to "Active Shipments" to update pickup and delivery progress.`);
      setTimeout(() => setSuccessMsg(""), 5000);
      setActiveTab("active-deliveries");
    } catch (err: any) {
      console.error("Failed to accept job:", err);
      setError(err.message || "Failed to accept job.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Decline Job
  const handleDeclineJob = async (jobId: string) => {
    if (!companyProfile) return;
    setLoading(true);
    try {
      const jobItem = allDeliveries.find(j => j.id === jobId || j.orderId === jobId);
      const actualOrderId = jobItem?.orderId || jobId.replace("DLV_", "");
      const deliveryDocId = jobId.startsWith("DLV_") ? jobId : `DLV_${actualOrderId}`;

      const jobRef = doc(db, "logistics_deliveries", deliveryDocId);
      await setDoc(jobRef, {
        status: "declined",
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // Also find the related order in standard orders and update its status
      const orderRef = doc(db, "orders", actualOrderId);
      const orderSnap = await getDoc(orderRef);
      if (orderSnap.exists()) {
        const orderData = orderSnap.data();
        await updateDoc(orderRef, {
          status: "declined_by_logistics",
          logisticsOfferStatus: "declined",
          deliveredWorkNotes: `Offer declined by logistics company: ${companyProfile.companyName} (${companyProfile.phoneNumber}). Please assign another courier.`,
          kwikRiderId: null,
          kwikTrackingUrl: null,
          updatedAt: new Date().toISOString()
        });

        // Notify the seller
        if (orderData.sellerId) {
          await addDoc(collection(db, "notifications"), {
            userId: orderData.sellerId,
            title: "Logistics Offer Declined",
            message: `Logistics company ${companyProfile.companyName} has declined your delivery offer for order of ${orderData.productName || "your product"}. Please assign another courier.`,
            type: "order",
            isRead: false,
            createdAt: new Date().toISOString()
          });
        }
      }
      setSuccessMsg("Delivery offer declined.");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      console.error(err);
      setError("Failed to decline job.");
    } finally {
      setLoading(false);
    }
  };

  // Update Active Delivery Status
  const handleUpdateStatus = async (jobId: string, currentStatus: string) => {
    if (!companyProfile) return;
    let nextStatus: "picked_up" | "in_transit" | "delivered" = "picked_up";
    let orderStatusLabel = "Order Picked Up";
    let notifTitle = "Package Picked Up from Merchant 📦";
    let notifMsg = `${companyProfile.companyName} has picked up your package from the merchant.`;

    if (currentStatus === "accepted") {
      nextStatus = "picked_up";
      orderStatusLabel = "Order Picked Up";
      notifTitle = "Package Picked Up from Merchant 📦";
      notifMsg = `${companyProfile.companyName} has picked up your package from the merchant.`;
    } else if (currentStatus === "picked_up") {
      nextStatus = "in_transit";
      orderStatusLabel = "Out For Delivery";
      notifTitle = "Rider Out For Delivery 🚀";
      notifMsg = `${companyProfile.companyName} is heading to your delivery location. Please have your delivery PIN ready!`;
    } else if (currentStatus === "in_transit") {
      nextStatus = "delivered";
      orderStatusLabel = "Order Delivered";
      notifTitle = "Package Delivered 🎉";
      notifMsg = `${companyProfile.companyName} has marked your package as delivered. Please confirm receipt and enter your OTP PIN.`;
    }

    setLoading(true);
    try {
      const jobItem = allDeliveries.find(j => j.id === jobId || j.orderId === jobId);
      const actualOrderId = jobItem?.orderId || jobId.replace("DLV_", "");
      const deliveryDocId = jobId.startsWith("DLV_") ? jobId : `DLV_${actualOrderId}`;

      const jobRef = doc(db, "logistics_deliveries", deliveryDocId);
      await setDoc(jobRef, {
        status: nextStatus,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // Also update standard order
      const orderRef = doc(db, "orders", actualOrderId);
      const orderSnap = await getDoc(orderRef);
      if (orderSnap.exists()) {
        const orderData = orderSnap.data();
        const updateData: any = {
          status: orderStatusLabel as any,
          updatedAt: new Date().toISOString()
        };
        if (nextStatus === "delivered") {
          updateData.deliveredAt = new Date().toISOString();
        }
        await updateDoc(orderRef, updateData);

        if (orderData.buyerId) {
          await addDoc(collection(db, "notifications"), {
            userId: orderData.buyerId,
            title: notifTitle,
            message: notifMsg,
            type: "order",
            isRead: false,
            createdAt: new Date().toISOString()
          });
        }
      }
      setSuccessMsg(`Status updated to: ${nextStatus.replace("_", " ").toUpperCase()}`);
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      console.error("Failed to update status:", err);
      setError("Failed to update delivery status.");
    } finally {
      setLoading(false);
    }
  };

  // Save Company Profile Changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyProfile || !auth.currentUser) return;

    if (!editCompanyName.trim()) {
      setError("Company name cannot be empty.");
      return;
    }

    if (editSelectedCampuses.length === 0) {
      setError("Please select at least one covered campus.");
      return;
    }

    if (editSelectedVehicles.length === 0) {
      setError("Please select at least one vehicle type.");
      return;
    }

    setSavingProfile(true);
    setError("");
    setProfileSuccessMsg("");

    try {
      const updatedProfile: LogisticsCompany = {
        ...companyProfile,
        companyName: editCompanyName.trim(),
        rcNumber: editRcNumber.trim(),
        phoneNumber: editPhoneNumber.trim(),
        whatsappNumber: editWhatsappNumber.trim(),
        officeAddress: editOfficeAddress.trim(),
        baseDeliveryPrice: Number(editBaseDeliveryPrice) || 500,
        estimatedTurnaround: editEstimatedTurnaround.trim() || "1-3 Hours on Campus",
        operatingHours: editOperatingHours.trim() || "8:00 AM - 8:00 PM",
        description: editDescription.trim(),
        vehicleTypes: editSelectedVehicles,
        coveredCampuses: editSelectedCampuses,
        bankName: editBankName.trim(),
        accountNumber: editAccountNumber.trim(),
        accountName: editAccountName.trim(),
        isActive: editIsActive,
        updatedAt: new Date().toISOString()
      };

      // 1. Update in logistics_companies
      await setDoc(doc(db, "logistics_companies", auth.currentUser.uid), updatedProfile, { merge: true });

      // 2. Update in users collection
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        displayName: editCompanyName.trim(),
        phoneNumber: editPhoneNumber.trim(),
        businessName: editCompanyName.trim(),
        location: editOfficeAddress.trim(),
        updatedAt: new Date().toISOString()
      });

      setCompanyProfile(updatedProfile);
      setIsEditingProfile(false);
      setProfileSuccessMsg("Company profile updated successfully!");
      setTimeout(() => setProfileSuccessMsg(""), 5000);
    } catch (err: any) {
      console.error("Failed to save profile:", err);
      setError(err.message || "Failed to save profile updates.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setCompanyProfile(null);
      setView("splash");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Toggle vehicle selection
  const handleToggleVehicle = (vehicle: string) => {
    if (selectedVehicles.includes(vehicle)) {
      setSelectedVehicles(selectedVehicles.filter(v => v !== vehicle));
    } else {
      setSelectedVehicles([...selectedVehicles, vehicle]);
    }
  };

  // Toggle campus selection
  const handleToggleCampus = (campus: string) => {
    if (selectedCampuses.includes(campus)) {
      setSelectedCampuses(selectedCampuses.filter(c => c !== campus));
    } else {
      setSelectedCampuses([...selectedCampuses, campus]);
    }
  };

  // Filter campuses
  const filteredCampuses = React.useMemo(() => {
    return NIGERIAN_CAMPUSES.filter(c => 
      c.toLowerCase().includes(campusSearch.toLowerCase())
    );
  }, [campusSearch]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 font-sans transition-colors duration-300 pb-24">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-orange-600 to-amber-500 py-6 px-6 text-white flex flex-wrap items-center justify-between gap-4 shadow-md animate-in fade-in slide-in-from-top-4 duration-300">
        <div className="flex items-center gap-3">
          <Logo showText={true} className="bg-white/10 p-2 rounded-2xl backdrop-blur-sm border border-white/20" />
          <span className="text-white/40 hidden sm:inline">|</span>
          <div className="flex items-center gap-2">
            <Truck className="w-7 h-7 text-white animate-bounce shrink-0" />
            <div>
              <h1 className="text-lg sm:text-xl font-black tracking-tight uppercase !text-white leading-tight">Shopiversity Logistics</h1>
              <p className="text-[11px] text-orange-100 font-medium">Campus Delivery Network Partner</p>
            </div>
          </div>
        </div>
        <button
          onClick={onBackToMarket}
          className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold transition-all border border-white/20 cursor-pointer shadow-sm"
        >
          Back to Marketplace
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-6">
        {/* Alerts / Error Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 rounded-2xl flex items-start gap-2.5 text-sm font-semibold">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 rounded-2xl flex items-start gap-2.5 text-sm font-semibold">
            <ShieldCheck className="w-5 h-5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* 1. SPLASH SCREEN */}
        {view === "splash" && (
          <div className="max-w-4xl mx-auto text-center py-12 px-4 space-y-8">
            <div className="space-y-3">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-orange-100 dark:bg-orange-950/30 text-orange-600 mb-2">
                <Truck className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-black text-slate-800 dark:text-zinc-100">Deliver and Earn on Campus</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
                Join our trusted student courier network. Deliver packages securely to buyers inside your university campus with real-time tracking and dispatch updates.
              </p>
            </div>

            {auth.currentUser && !companyProfile ? (
              <div className="max-w-md mx-auto bg-amber-50 dark:bg-amber-950/25 border border-amber-200 dark:border-amber-900/60 p-8 rounded-[2.5rem] shadow-sm text-center space-y-6">
                <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-3xl flex items-center justify-center text-amber-600 mx-auto">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-slate-800 dark:text-zinc-100 text-lg">Account Conflicted</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    You are currently signed in as a standard student user account. Standard student accounts cannot access logistics company operation tools directly. Please sign out first.
                  </p>
                </div>
                <div className="flex flex-col gap-2 pt-2">
                  <button
                    onClick={async () => {
                      setLoading(true);
                      try {
                        await signOut(auth);
                        setCompanyProfile(null);
                        setView("splash");
                      } catch (e) {
                        console.error(e);
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="w-full h-12 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-sm transition-all cursor-pointer border-none flex items-center justify-center gap-2 shadow-lg shadow-orange-500/10"
                  >
                    Sign Out of Student Account
                  </button>
                  <button
                    onClick={onBackToMarket}
                    className="w-full h-12 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 rounded-xl font-bold text-sm transition-all cursor-pointer border-none"
                  >
                    Back to Marketplace
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto pt-4">
                <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-slate-200/60 dark:border-zinc-800/60 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                  <div className="space-y-2 text-left mb-6">
                    <div className="w-10 h-10 rounded-full bg-orange-50 dark:bg-orange-950/20 flex items-center justify-center text-orange-600 mb-3">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-slate-800 dark:text-zinc-100 text-lg">Existing Partner</h3>
                    <p className="text-xs text-slate-400">Access your logistics fleet manager dashboard, track shipments, and request bank payouts.</p>
                  </div>
                  <button
                    onClick={() => setView("login")}
                    className="w-full h-12 bg-slate-900 dark:bg-zinc-800 hover:bg-orange-600 hover:dark:bg-orange-600 text-white rounded-xl font-bold text-sm transition-all cursor-pointer"
                  >
                    Log In to Fleet Manager
                  </button>
                </div>

                <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-slate-200/60 dark:border-zinc-800/60 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                  <div className="space-y-2 text-left mb-6">
                    <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center text-amber-600 mb-3">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-slate-800 dark:text-zinc-100 text-lg">New Logistics Company</h3>
                    <p className="text-xs text-slate-400">Register your dispatch company, define your coverage campuses, select vehicle types, and set base prices.</p>
                  </div>
                  <button
                    onClick={() => setView("signup")}
                    className="w-full h-12 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-orange-500/10 transition-all cursor-pointer"
                  >
                    Create Partner Account
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. LOGIN VIEW */}
        {view === "login" && (
          <div className="max-w-md mx-auto bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-slate-200/60 dark:border-zinc-800/60 shadow-sm mt-6">
            <div className="text-center space-y-1 mb-8">
              <h2 className="text-2xl font-black text-slate-800 dark:text-zinc-100">Log In Partner</h2>
              <p className="text-xs text-slate-400">Manage dispatch and deliver goods across campus</p>
            </div>

            {/* Google Sign In Option */}
            <div className="mb-6 space-y-4">
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={loading}
                className="w-full h-13 bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-750 text-slate-700 dark:text-zinc-200 border border-slate-200/80 dark:border-zinc-700 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-3 cursor-pointer shadow-sm hover:shadow-md"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google logo" />
                <span>Log In with Google</span>
              </button>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-200 dark:border-zinc-800 w-full"></div>
                <span className="bg-white dark:bg-zinc-900 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest absolute">or login with email</span>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="partner@logisticcompany.com"
                    className="w-full h-13 pl-12 pr-4 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-850 rounded-2xl outline-none focus:border-orange-500 text-sm font-medium transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(loginEmail || "");
                      setResetEmailSent(false);
                      setResetError("");
                      setShowForgotPassword(true);
                    }}
                    className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline cursor-pointer bg-transparent border-none p-0"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-13 pl-12 pr-12 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-850 rounded-2xl outline-none focus:border-orange-500 text-sm font-medium transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors cursor-pointer"
                  >
                    {showLoginPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-13 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-bold text-sm shadow-md shadow-orange-500/15 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Log In to Dashboard"}
              </button>
            </form>

            <div className="text-center mt-6">
              <p className="text-xs font-medium text-slate-400">
                Don't have a logistics account?{" "}
                <button onClick={() => setView("signup")} className="text-orange-600 hover:underline font-bold bg-transparent border-none cursor-pointer">
                  Register Company
                </button>
              </p>
            </div>
          </div>
        )}

        {/* 3. SIGNUP VIEW */}
        {view === "signup" && (
          <div className="max-w-2xl mx-auto bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-slate-200/60 dark:border-zinc-800/60 shadow-sm mt-6">
            <div className="text-center space-y-1 mb-8">
              <h2 className="text-2xl font-black text-slate-800 dark:text-zinc-100 font-sans">Register Logistics Company</h2>
              <p className="text-xs text-slate-400">Set up your delivery details to receive high-demand dispatch jobs</p>
            </div>

            {/* Google Sign Up & Referral Option */}
            <div className="mb-8 space-y-4 max-w-md mx-auto">
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Referral Code (Optional)</label>
                <div className="relative">
                  <Tag className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={referralCodeInput}
                    onChange={(e) => setReferralCodeInput(e.target.value)}
                    placeholder="e.g. REF123 (Enter code if invited)"
                    className="w-full h-11 pl-11 pr-4 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-800 rounded-xl outline-none focus:border-orange-500 text-xs font-semibold"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={loading}
                className="w-full h-13 bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-750 text-slate-700 dark:text-zinc-200 border border-slate-200/80 dark:border-zinc-700 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-3 cursor-pointer shadow-sm hover:shadow-md"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google logo" />
                <span>Register with Google</span>
              </button>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-200 dark:border-zinc-800 w-full"></div>
                <span className="bg-white dark:bg-zinc-900 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest absolute">or register company details manually</span>
              </div>
            </div>

            <form onSubmit={handleRegisterInit} className="space-y-6">
              {/* Row 1: Company Name & RC Number */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Company Name</label>
                  <div className="relative">
                    <Building className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. SwiftRun Campus Deliveries"
                      className="w-full h-13 pl-12 pr-4 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-850 rounded-2xl outline-none focus:border-orange-500 text-sm font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Business RC / CAC Number</label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={rcNumber}
                      onChange={(e) => setRcNumber(e.target.value)}
                      placeholder="e.g. RC1234567"
                      className="w-full h-13 pl-12 pr-4 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-850 rounded-2xl outline-none focus:border-orange-500 text-sm font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Email & Phone Number */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Corporate Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="info@swiftrun.com"
                      className="w-full h-13 pl-12 pr-4 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-850 rounded-2xl outline-none focus:border-orange-500 text-sm font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
                    <input
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="e.g. +234 812 345 6789"
                      className="w-full h-13 pl-12 pr-4 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-850 rounded-2xl outline-none focus:border-orange-500 text-sm font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Row 3: Office Address & Base Delivery Pricing */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Physical Office Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={officeAddress}
                      onChange={(e) => setOfficeAddress(e.target.value)}
                      placeholder="Block 2A, Student Union Plaza"
                      className="w-full h-13 pl-12 pr-4 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-850 rounded-2xl outline-none focus:border-orange-500 text-sm font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Base Delivery Fee (₦)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
                    <input
                      type="number"
                      required
                      value={basePrice}
                      onChange={(e) => setBasePrice(Number(e.target.value))}
                      placeholder="e.g. 500"
                      className="w-full h-13 pl-12 pr-4 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-850 rounded-2xl outline-none focus:border-orange-500 text-sm font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Vehicle Types Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 block">Vehicles in your Fleet</label>
                <div className="flex flex-wrap gap-2">
                  {["Bicycle", "Motorcycle", "Car", "Mini-Van", "Truck"].map((vehicle, idx) => {
                    const isSelected = selectedVehicles.includes(vehicle);
                    return (
                      <button
                        type="button"
                        key={`vehicle-opt-${vehicle}-${idx}`}
                        onClick={() => handleToggleVehicle(vehicle)}
                        className={cn(
                          "px-4 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer",
                          isSelected
                            ? "bg-orange-600 border-orange-600 text-white"
                            : "bg-slate-50 dark:bg-zinc-800/60 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-800"
                        )}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                        {vehicle}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Covered Campuses Selector */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Covered Campus Locations ({selectedCampuses.length})</label>
                  <span className="text-[10px] text-orange-600 font-bold bg-orange-50 dark:bg-orange-950/20 px-2 py-0.5 rounded-full">Select Covered Sites</span>
                </div>
                
                <div className="relative">
                  <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={campusSearch}
                    onChange={(e) => setCampusSearch(e.target.value)}
                    placeholder="Search Nigerian universities..."
                    className="w-full h-11 pl-10 pr-4 bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 rounded-xl outline-none focus:border-orange-500 text-xs font-semibold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto border border-slate-100 dark:border-zinc-800 p-3 rounded-2xl bg-slate-50/50 dark:bg-zinc-900/50">
                  {filteredCampuses.slice(0, 30).map((campus, idx) => {
                    const isSelected = selectedCampuses.includes(campus);
                    return (
                      <button
                        type="button"
                        key={`campus-opt-${campus}-${idx}`}
                        onClick={() => handleToggleCampus(campus)}
                        className={cn(
                          "p-2.5 rounded-xl text-left text-xs font-bold transition-all border flex items-center justify-between cursor-pointer",
                          isSelected
                            ? "bg-orange-50 dark:bg-orange-950/20 border-orange-500 text-orange-700 dark:text-orange-400"
                            : "bg-white dark:bg-zinc-900 border-slate-100 dark:border-zinc-850 text-slate-700 dark:text-zinc-300 hover:border-orange-300"
                        )}
                      >
                        <span className="truncate">{campus}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-orange-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Passwords */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
                    <input
                      type={showRegisterPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full h-13 pl-12 pr-12 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-850 rounded-2xl outline-none focus:border-orange-500 text-sm font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                      className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors cursor-pointer"
                    >
                      {showRegisterPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      className="w-full h-13 pl-12 pr-12 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-850 rounded-2xl outline-none focus:border-orange-500 text-sm font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-13 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-bold text-sm shadow-md shadow-orange-500/15 transition-all flex items-center justify-center cursor-pointer"
              >
                Proceed to Verification
              </button>
            </form>

            <div className="text-center mt-6">
              <p className="text-xs font-medium text-slate-400">
                Already registered?{" "}
                <button onClick={() => setView("login")} className="text-orange-600 hover:underline font-bold bg-transparent border-none cursor-pointer">
                  Log In Instead
                </button>
              </p>
            </div>
          </div>
        )}

        {/* 4. VERIFICATION SCREEN */}
        {view === "verify" && (
          <div className="max-w-md mx-auto bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-slate-200/60 dark:border-zinc-800/60 shadow-sm mt-6">
            <div className="text-center space-y-2 mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/20 text-amber-600">
                <ShieldCheck className="w-6 h-6 animate-pulse" />
              </div>
              <h2 className="text-xl font-black text-slate-800 dark:text-zinc-100">Verify Your Information</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                A verification PIN code was dispatched to your email <strong className="text-slate-700 dark:text-zinc-300">{email}</strong> and phone number.
              </p>
            </div>

            {/* Test PIN Code Helper block to make the app interactive and testable */}
            <div className="bg-orange-50/50 dark:bg-orange-950/10 border border-orange-200/50 dark:border-orange-900/50 rounded-2xl p-4 mb-6 text-center">
              <span className="text-[10px] font-black uppercase tracking-wider text-orange-600 block mb-1">Sandbox Testing OTP PIN</span>
              <strong className="text-2xl font-black text-orange-600 tracking-widest">{generatedOtp}</strong>
              <p className="text-[10px] text-slate-400 font-medium mt-1">Copy and insert this PIN below to complete verification.</p>
            </div>

            <form onSubmit={handleVerifyAndCreate} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 block text-center">Enter 6-Digit OTP Code</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="e.g. 123456"
                  className="w-full h-14 text-center tracking-widest text-2xl font-black bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-850 rounded-2xl outline-none focus:border-orange-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-13 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-bold text-sm shadow-md shadow-orange-500/15 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify & Complete Signup"}
              </button>
            </form>

            <button
              onClick={() => setView("signup")}
              className="w-full py-3 mt-4 text-slate-500 text-xs font-bold hover:text-slate-700 transition-colors bg-transparent border-none cursor-pointer"
            >
              Back to registration form
            </button>
          </div>
        )}

        {/* 5. LOGISTICS FLEET MANAGER DASHBOARD */}
        {view === "dashboard" && companyProfile && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mt-6">
            {/* Left Column: Stats Card and Navigation tabs */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-gradient-to-br from-slate-900 to-zinc-950 p-6 rounded-[2rem] text-white space-y-4 shadow-xl border border-slate-800">
                <div className="space-y-1">
                  <span className="text-[10px] font-black tracking-widest uppercase text-orange-400">Active Fleet Manager</span>
                  <h3 className="text-lg font-black tracking-tight truncate">{companyProfile.companyName}</h3>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Availability Status</p>
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 mt-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Active / Online
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setActiveTab("profile");
                        setIsEditingProfile(true);
                      }}
                      className="p-2 bg-white/10 hover:bg-orange-500 text-white rounded-xl transition-all cursor-pointer border-none text-[11px] font-bold flex items-center gap-1"
                      title="Edit Company Profile"
                    >
                      <Building className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button 
                      onClick={handleLogout}
                      className="p-2 bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-xl transition-all cursor-pointer border-none"
                      title="Log Out"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Tab Navigation Menu */}
              <div className="bg-white dark:bg-zinc-900 p-4 rounded-[2rem] border border-slate-200/60 dark:border-zinc-800/60 shadow-sm space-y-1.5">
                {[
                  { id: "available-jobs", label: `Available Jobs (${availableJobs.length})`, icon: Package },
                  { id: "active-deliveries", label: `Active Shipments (${activeDeliveries.length})`, icon: Truck },
                  { id: "history", label: "Completed Jobs", icon: Clock },
                  { id: "profile", label: "Company Fleet Profile", icon: Building }
                ].map((tab, idx) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={`logistics-tab-${tab.id}-${idx}`}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-bold tracking-tight transition-all text-left cursor-pointer border-none",
                        isActive
                          ? "bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400 border border-orange-500/30 font-extrabold shadow-sm"
                          : "text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-850"
                      )}
                    >
                      <tab.icon className="w-4 h-4 shrink-0" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Dynamic Subview Panel */}
            <div className="lg:col-span-3 space-y-6">
              {/* Slideshow Banner for Logistics Partners */}
              <DashboardSlideshow 
                role="logistics"
                onCtaClick={(slideId) => {
                  if (slideId === "logistics-active") {
                    setActiveTab("active-deliveries");
                  } else if (slideId === "logistics-earnings") {
                    setActiveTab("history");
                  } else if (slideId === "logistics-profile") {
                    setActiveTab("profile");
                  } else {
                    setActiveTab("available-jobs");
                  }
                }}
              />

              {directOffers.length > 0 && (
                <div className="p-5 bg-gradient-to-r from-orange-500/10 to-amber-500/10 dark:from-orange-950/20 dark:to-amber-950/20 border-2 border-orange-500/30 dark:border-orange-500/50 rounded-3xl animate-pulse">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-orange-500 text-white rounded-2xl shrink-0">
                      <Bell className="w-6 h-6" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <h4 className="text-sm font-black text-slate-800 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-2">
                        <span>Direct Logistics Contract Offers Pending!</span>
                        <span className="px-2 py-0.5 bg-orange-600 text-white rounded-full text-[9px] font-black">{directOffers.length} NEW</span>
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Dispatch contracts have been booked with your company specifically for delivery. Please accept or decline these requests to confirm availability.
                      </p>
                      {activeTab !== "available-jobs" && (
                        <div className="pt-2">
                          <button
                            onClick={() => setActiveTab("available-jobs")}
                            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                          >
                            Review Offers Now
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* SUBVIEW 1: AVAILABLE DELIVERY JOBS */}
              {activeTab === "available-jobs" && (
                <div className="space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-black text-slate-800 dark:text-zinc-100 flex items-center gap-2">
                        <span>Pending Campus Deliveries</span>
                        <span className="text-xs font-bold text-orange-600 bg-orange-50 dark:bg-orange-950/30 px-2.5 py-0.5 rounded-full border border-orange-200 dark:border-orange-900/50">
                          {availableJobs.length} Available
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500">Unassigned shipments needing dispatch on your campus network</p>
                    </div>

                    {/* Scope toggle filter */}
                    <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-zinc-800/80 rounded-2xl">
                      <button
                        type="button"
                        onClick={() => setScopeCampusFilter("all")}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer border-none",
                          scopeCampusFilter === "all"
                            ? "bg-white dark:bg-zinc-900 text-orange-600 shadow-xs"
                            : "text-slate-500 hover:text-slate-700 dark:text-zinc-400"
                        )}
                      >
                        All Campus Orders
                      </button>
                      <button
                        type="button"
                        onClick={() => setScopeCampusFilter("covered")}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer border-none",
                          scopeCampusFilter === "covered"
                            ? "bg-white dark:bg-zinc-900 text-orange-600 shadow-xs"
                            : "text-slate-500 hover:text-slate-700 dark:text-zinc-400"
                        )}
                      >
                        My Covered Campuses
                      </button>
                    </div>
                  </div>

                  {availableJobs.length === 0 ? (
                    <div className="bg-white dark:bg-zinc-900 border border-dashed border-slate-200 dark:border-zinc-800 rounded-[2.5rem] p-12 text-center space-y-3">
                      <div className="w-16 h-16 rounded-3xl bg-orange-50 dark:bg-orange-950/20 text-orange-600 flex items-center justify-center mx-auto">
                        <Package className="w-8 h-8" />
                      </div>
                      <h4 className="font-bold text-slate-700 dark:text-zinc-300">No unassigned orders right now</h4>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        {scopeCampusFilter === "covered"
                          ? "No pending orders found on your selected covered campuses. Try switching to 'All Campus Orders' or updating your covered campuses in your profile."
                          : "New orders will appear here automatically when sellers request campus delivery."}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {availableJobs.map((job, jIdx) => (
                        <div key={`avail-job-${job.id || jIdx}-${jIdx}`} className="bg-white dark:bg-zinc-900 border border-slate-200/70 dark:border-zinc-800/70 p-5 sm:p-6 rounded-[2rem] shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-zinc-850 pb-3">
                              <div className="space-y-1">
                                {job.logisticsId === companyProfile.id ? (
                                  <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-0.5 rounded-full">
                                    ⭐ Direct Offer to Your Company
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[9px] font-black text-orange-600 uppercase tracking-wider bg-orange-50 dark:bg-orange-950/30 px-2.5 py-0.5 rounded-full">
                                    🌐 Campus Order
                                  </span>
                                )}
                                <h4 className="font-black text-slate-800 dark:text-zinc-100 text-sm sm:text-base line-clamp-1">{job.productName} (x{job.quantity || 1})</h4>
                                <p className="text-[10px] font-bold text-slate-400">Order Ref: #{job.orderId.slice(-6).toUpperCase()} • Campus: {job.campus}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-[10px] font-bold text-slate-400 block uppercase">Fare Paid</span>
                                <span className="font-black text-orange-600 text-base">₦{job.deliveryPrice.toLocaleString()}</span>
                              </div>
                            </div>

                            {/* Journey details */}
                            <div className="space-y-2.5 text-xs">
                              <div className="flex gap-2.5 items-start p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-850/50">
                                <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-200 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">A</div>
                                <div className="space-y-0.5 min-w-0 flex-1">
                                  <div className="flex items-center justify-between">
                                    <p className="font-bold text-slate-500 uppercase tracking-wider text-[9px]">Pickup Location (Merchant)</p>
                                    {job.sellerPhone && (
                                      <a
                                        href={`tel:${job.sellerPhone}`}
                                        className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-600 dark:text-orange-400 hover:underline"
                                      >
                                        <Phone className="w-2.5 h-2.5" /> Call Seller ({job.sellerPhone})
                                      </a>
                                    )}
                                  </div>
                                  <p className="font-bold text-slate-800 dark:text-zinc-200 truncate">{job.sellerName} {job.sellerPhone ? `• ${job.sellerPhone}` : ""}</p>
                                  <p className="text-slate-400 text-[11px] truncate">{job.sellerAddress}</p>
                                </div>
                              </div>

                              <div className="flex gap-2.5 items-start p-2.5 rounded-xl bg-orange-50/50 dark:bg-orange-950/10 border border-orange-100/50 dark:border-orange-900/20">
                                <div className="w-5 h-5 rounded-full bg-orange-600 text-white flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">B</div>
                                <div className="space-y-0.5 min-w-0 flex-1">
                                  <div className="flex items-center justify-between">
                                    <p className="font-bold text-orange-600 uppercase tracking-wider text-[9px]">Dropoff Destination (Buyer)</p>
                                    {job.buyerPhone && (
                                      <a
                                        href={`tel:${job.buyerPhone}`}
                                        className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-600 hover:underline"
                                      >
                                        <Phone className="w-2.5 h-2.5" /> Call Buyer ({job.buyerPhone})
                                      </a>
                                    )}
                                  </div>
                                  <p className="font-bold text-slate-800 dark:text-zinc-200 truncate">{job.buyerName} {job.buyerPhone ? `• ${job.buyerPhone}` : ""}</p>
                                  <p className="text-slate-400 text-[11px] truncate">{job.buyerAddress}</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Quick ETA & Acceptance Section */}
                          <div className="pt-3 border-t border-slate-100 dark:border-zinc-850 space-y-2">
                            {jobAcceptingId === job.id ? (
                              <div className="space-y-2 bg-orange-50/80 dark:bg-orange-950/20 p-3 rounded-xl border border-orange-200 dark:border-orange-900">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">Estimated Delivery Turnaround:</span>
                                  <button
                                    type="button"
                                    onClick={() => setJobAcceptingId(null)}
                                    className="text-[10px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer bg-transparent border-none"
                                  >
                                    Cancel
                                  </button>
                                </div>
                                <div className="grid grid-cols-3 gap-1.5">
                                  {["30-45 Mins", "1-2 Hours", "Today by 5pm"].map((preset) => (
                                    <button
                                      key={preset}
                                      type="button"
                                      onClick={() => setJobEtaInput(preset)}
                                      className={cn(
                                        "py-1 px-1.5 rounded-lg text-[10px] font-bold transition-all border cursor-pointer",
                                        jobEtaInput === preset
                                          ? "bg-orange-600 text-white border-orange-600"
                                          : "bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-700"
                                      )}
                                    >
                                      {preset}
                                    </button>
                                  ))}
                                </div>
                                <input
                                  type="text"
                                  placeholder="Or enter custom ETA (e.g. 1 hour)"
                                  value={jobEtaInput}
                                  onChange={(e) => setJobEtaInput(e.target.value)}
                                  className="w-full h-8 px-2.5 text-xs bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg outline-none focus:border-orange-500"
                                />
                                <button
                                  type="button"
                                  disabled={loading}
                                  onClick={() => handleAcceptJob(job.id, jobEtaInput || companyProfile.estimatedTurnaround)}
                                  className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                                >
                                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" /> Confirm & Accept Delivery</>}
                                </button>
                              </div>
                            ) : job.logisticsId === companyProfile.id ? (
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setJobAcceptingId(job.id);
                                    setJobEtaInput(companyProfile.estimatedTurnaround || "1-3 Hours on Campus");
                                  }}
                                  className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                                >
                                  <Check className="w-4 h-4" />
                                  Accept Offer
                                </button>
                                <button
                                  type="button"
                                  disabled={loading}
                                  onClick={() => handleDeclineJob(job.id)}
                                  className="flex-1 h-11 bg-red-100 dark:bg-red-950/30 hover:bg-red-200 text-red-700 dark:text-red-400 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none"
                                >
                                  <X className="w-4 h-4" />
                                  Decline Offer
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setJobAcceptingId(job.id);
                                  setJobEtaInput(companyProfile.estimatedTurnaround || "1-3 Hours on Campus");
                                }}
                                className="w-full h-11 bg-slate-900 dark:bg-zinc-800 hover:bg-orange-600 hover:dark:bg-orange-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs border-none"
                              >
                                <Truck className="w-4 h-4" />
                                Accept Delivery Contract
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* SUBVIEW 2: ACTIVE DELIVERIES */}
              {activeTab === "active-deliveries" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-black text-slate-800 dark:text-zinc-100 flex items-center gap-2">
                        <span>Live Delivery Shipments</span>
                        <span className="text-xs font-bold text-orange-600 bg-orange-50 dark:bg-orange-950/30 px-2.5 py-0.5 rounded-full border border-orange-200 dark:border-orange-900/50">
                          {activeDeliveries.length} In Progress
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500">Track accepted orders and update current delivery status</p>
                    </div>
                  </div>

                  {activeDeliveries.length === 0 ? (
                    <div className="bg-white dark:bg-zinc-900 border border-dashed border-slate-200 dark:border-zinc-800 rounded-[2.5rem] p-12 text-center space-y-3">
                      <Truck className="w-16 h-16 text-slate-300 mx-auto animate-pulse" />
                      <h4 className="font-bold text-slate-700 dark:text-zinc-300">No active deliveries</h4>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">Accept unassigned contracts from the 'Available Jobs' tab to manage live deliveries.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activeDeliveries.map((job, aIdx) => (
                        <div key={`active-job-${job.id || aIdx}-${aIdx}`} className="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/60 p-6 rounded-[2.5rem] shadow-xs space-y-5">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-zinc-850 pb-4">
                            <div>
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 text-amber-500 rounded-full text-[10px] font-black uppercase tracking-wider mb-2">
                                <Clock className="w-3.5 h-3.5" />
                                {job.status.toUpperCase().replace("_", " ")}
                              </span>
                              <h4 className="text-base font-black text-slate-800 dark:text-zinc-100">{job.productName} (x{job.quantity || 1})</h4>
                              <p className="text-xs font-medium text-slate-400">Order Ref: #{job.orderId.slice(-6).toUpperCase()}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-slate-400 font-bold">Delivery Fare Paid</p>
                              <strong className="text-xl font-black text-slate-900 dark:text-zinc-100">₦{job.deliveryPrice.toLocaleString()}</strong>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-850/50">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Pickup Location (Seller)</span>
                                {job.sellerPhone && (
                                  <a
                                    href={`tel:${job.sellerPhone}`}
                                    className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-600 dark:text-orange-400 hover:underline"
                                  >
                                    <Phone className="w-3 h-3" /> Call Seller
                                  </a>
                                )}
                              </div>
                              <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                                {job.sellerName} ({job.campus}) {job.sellerPhone ? `• ${job.sellerPhone}` : ""}
                              </p>
                              <p className="text-xs text-slate-500 leading-relaxed">{job.sellerAddress}</p>
                            </div>

                            <div className="space-y-2 p-3.5 rounded-2xl bg-orange-50/50 dark:bg-orange-950/10 border border-orange-100/50 dark:border-orange-900/20">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-orange-600 uppercase tracking-wider">Destination (Buyer)</span>
                                {job.buyerPhone && (
                                  <a
                                    href={`tel:${job.buyerPhone}`}
                                    className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-600 hover:underline"
                                  >
                                    <Phone className="w-3 h-3" /> Call Buyer
                                  </a>
                                )}
                              </div>
                              <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                                {job.buyerName} {job.buyerPhone ? `(${job.buyerPhone})` : ""}
                              </p>
                              <p className="text-xs text-slate-500 leading-relaxed">{job.buyerAddress}</p>
                            </div>
                          </div>

                          {/* Status Stepper Progression Button */}
                          <div className="pt-3 border-t border-slate-100 dark:border-zinc-850 flex items-center justify-between flex-wrap gap-4">
                            <div className="flex gap-2 items-center">
                              <div className={cn("w-3 h-3 rounded-full transition-all", job.status === "accepted" ? "bg-amber-400 ring-4 ring-amber-400/20" : "bg-emerald-500")} />
                              <ArrowRight className="w-3 h-3 text-slate-300" />
                              <div className={cn("w-3 h-3 rounded-full transition-all", job.status === "picked_up" ? "bg-orange-500 ring-4 ring-orange-500/20" : job.status === "in_transit" || job.status === "delivered" ? "bg-emerald-500" : "bg-slate-300")} />
                              <ArrowRight className="w-3 h-3 text-slate-300" />
                              <div className={cn("w-3 h-3 rounded-full transition-all", job.status === "in_transit" ? "bg-blue-500 ring-4 ring-blue-500/20" : job.status === "delivered" ? "bg-emerald-500" : "bg-slate-300")} />
                            </div>

                            <button
                              type="button"
                              disabled={loading}
                              onClick={() => handleUpdateStatus(job.id, job.status)}
                              className="h-11 px-6 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md shadow-orange-500/10 cursor-pointer border-none"
                            >
                              {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  {job.status === "accepted" && "Confirm Package Picked Up"}
                                  {job.status === "picked_up" && "Mark Out for Delivery"}
                                  {job.status === "in_transit" && "Confirm Successful Delivery"}
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* SUBVIEW 3: DELIVERY HISTORY & EARNINGS */}
              {activeTab === "history" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-slate-200/60 dark:border-zinc-800/60 shadow-xs">
                      <p className="text-xs text-slate-400 font-bold uppercase">Total Settled Earnings</p>
                      <strong className="text-2xl font-black text-slate-800 dark:text-zinc-100 mt-1 block">
                        ₦{deliveryHistory
                          .filter(j => j.status === "delivered")
                          .reduce((sum, j) => sum + j.deliveryPrice, 0)
                          .toLocaleString()
                        }
                      </strong>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-slate-200/60 dark:border-zinc-800/60 shadow-xs">
                      <p className="text-xs text-slate-400 font-bold uppercase">Completed Shipments</p>
                      <strong className="text-2xl font-black text-slate-800 dark:text-zinc-100 mt-1 block">
                        {deliveryHistory.filter(j => j.status === "delivered").length} deliveries
                      </strong>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-slate-200/60 dark:border-zinc-800/60 shadow-xs">
                      <p className="text-xs text-slate-400 font-bold uppercase">Cancelled Shipments</p>
                      <strong className="text-2xl font-black text-slate-800 dark:text-zinc-100 mt-1 block">
                        {deliveryHistory.filter(j => j.status === "cancelled").length} jobs
                      </strong>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-black text-slate-800 dark:text-zinc-100">Delivery Shipment History</h3>
                    
                    {deliveryHistory.length === 0 ? (
                      <div className="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/60 rounded-[2rem] p-8 text-center text-slate-400 text-xs">
                        No previous delivery logs recorded.
                      </div>
                    ) : (
                      <div className="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/60 rounded-[2.5rem] overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50 dark:bg-zinc-850 text-[10px] font-black text-slate-400 uppercase border-b border-slate-100 dark:border-zinc-800">
                                <th className="px-6 py-4">Item Details</th>
                                <th className="px-6 py-4">Pickup / Buyer</th>
                                <th className="px-6 py-4">Fare Paid</th>
                                <th className="px-6 py-4">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-zinc-850">
                              {deliveryHistory.map((job, hIdx) => (
                                <tr key={`hist-job-${job.id || hIdx}-${hIdx}`} className="text-xs hover:bg-slate-50/50 dark:hover:bg-zinc-850/30 transition-colors">
                                  <td className="px-6 py-4">
                                    <p className="font-bold text-slate-800 dark:text-zinc-100">{job.productName}</p>
                                    <p className="text-[10px] text-slate-400 font-medium">Order: #{job.orderId.slice(-6).toUpperCase()}</p>
                                  </td>
                                  <td className="px-6 py-4">
                                    <p className="font-bold text-slate-700 dark:text-zinc-300">Pickup: {job.sellerName}</p>
                                    <p className="text-[10px] text-slate-400 font-medium">Buyer: {job.buyerName}</p>
                                  </td>
                                  <td className="px-6 py-4 font-black text-slate-800 dark:text-zinc-100">
                                    ₦{job.deliveryPrice.toLocaleString()}
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className={cn(
                                      "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider",
                                      job.status === "delivered" 
                                        ? "bg-emerald-500/10 text-emerald-500" 
                                        : "bg-red-500/10 text-red-500"
                                    )}>
                                      {job.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SUBVIEW 4: COMPANY PROFILE & PROFILE EDITOR */}
              {activeTab === "profile" && (
                <div className="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/60 p-6 sm:p-8 rounded-[2.5rem] shadow-xs space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-zinc-850 pb-6">
                    <div>
                      <h3 className="text-xl font-black text-slate-800 dark:text-zinc-100 flex items-center gap-2">
                        <Building className="w-5 h-5 text-orange-600" />
                        <span>Logistics Company Fleet Profile</span>
                      </h3>
                      <p className="text-xs text-slate-500">Manage dispatch pricing, fleet vehicles, campuses, and operating hours</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingProfile(!isEditingProfile);
                        setError("");
                        setProfileSuccessMsg("");
                      }}
                      className={cn(
                        "px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer border-none",
                        isEditingProfile
                          ? "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300"
                          : "bg-orange-600 hover:bg-orange-700 text-white shadow-md shadow-orange-500/15"
                      )}
                    >
                      {isEditingProfile ? (
                        <>
                          <X className="w-4 h-4" /> Cancel Editing
                        </>
                      ) : (
                        <>
                          <Edit3 className="w-4 h-4" /> Edit Company Profile
                        </>
                      )}
                    </button>
                  </div>

                  {profileSuccessMsg && (
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 rounded-2xl flex items-center gap-2 text-xs font-bold">
                      <CheckCircle className="w-4 h-4 shrink-0" />
                      <span>{profileSuccessMsg}</span>
                    </div>
                  )}

                  {!isEditingProfile ? (
                    /* Read-Only Profile View */
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Registered Company Name</span>
                          <p className="text-sm font-black text-slate-800 dark:text-zinc-200">{companyProfile.companyName}</p>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Business CAC / RC number</span>
                          <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">{companyProfile.rcNumber || "Not specified"}</p>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Operational Email Address</span>
                          <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">{companyProfile.email}</p>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Operational Phone Number</span>
                          <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">{companyProfile.phoneNumber}</p>
                        </div>

                        {companyProfile.whatsappNumber && (
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">WhatsApp Dispatch Line</span>
                            <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">{companyProfile.whatsappNumber}</p>
                          </div>
                        )}

                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Office Hub Address</span>
                          <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">{companyProfile.officeAddress}</p>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Default Base Delivery Price</span>
                          <p className="text-base font-black text-orange-600">₦{companyProfile.baseDeliveryPrice.toLocaleString()}</p>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Estimated Turnaround Timeline</span>
                          <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">{companyProfile.estimatedTurnaround || "1-3 Hours on Campus"}</p>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Operating Hours</span>
                          <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">{companyProfile.operatingHours || "8:00 AM - 8:00 PM"}</p>
                        </div>

                        {companyProfile.bankName && (
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Settlement Bank Account</span>
                            <p className="text-xs font-bold text-slate-700 dark:text-zinc-300">{companyProfile.bankName} - {companyProfile.accountNumber} ({companyProfile.accountName})</p>
                          </div>
                        )}
                      </div>

                      {companyProfile.description && (
                        <div className="space-y-1 pt-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">About Our Dispatch Service</span>
                          <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed bg-slate-50 dark:bg-zinc-850/50 p-4 rounded-2xl">{companyProfile.description}</p>
                        </div>
                      )}

                      <div className="space-y-2 pt-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Active Fleet Vehicle Coverage</span>
                        <div className="flex flex-wrap gap-2">
                          {companyProfile.vehicleTypes.map((vehicle, idx) => (
                            <span key={`${vehicle}-${idx}`} className="px-3 py-1.5 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-bold flex items-center gap-1.5">
                              <Truck className="w-3 h-3 text-orange-600" />
                              {vehicle}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2 pt-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Covered Campus Locations ({companyProfile.coveredCampuses.length})</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-slate-100 dark:border-zinc-800 p-4 rounded-2xl bg-slate-50/50 dark:bg-zinc-900/50">
                          {companyProfile.coveredCampuses.map((campus, idx) => (
                            <div key={`${campus}-${idx}`} className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-zinc-300">
                              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              <span className="truncate">{campus}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Interactive Profile Edit Form */
                    <form onSubmit={handleSaveProfile} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Company Name *</label>
                          <input
                            type="text"
                            required
                            value={editCompanyName}
                            onChange={(e) => setEditCompanyName(e.target.value)}
                            placeholder="e.g. UNILAG Speed Dispatch"
                            className="w-full h-11 px-3.5 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs outline-none focus:border-orange-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Business CAC / RC Number</label>
                          <input
                            type="text"
                            value={editRcNumber}
                            onChange={(e) => setEditRcNumber(e.target.value)}
                            placeholder="RC-12345678"
                            className="w-full h-11 px-3.5 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs outline-none focus:border-orange-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Dispatch Phone Number *</label>
                          <input
                            type="tel"
                            required
                            value={editPhoneNumber}
                            onChange={(e) => setEditPhoneNumber(e.target.value)}
                            placeholder="08012345678"
                            className="w-full h-11 px-3.5 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs outline-none focus:border-orange-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">WhatsApp Line for Buyers/Sellers</label>
                          <input
                            type="tel"
                            value={editWhatsappNumber}
                            onChange={(e) => setEditWhatsappNumber(e.target.value)}
                            placeholder="08012345678"
                            className="w-full h-11 px-3.5 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs outline-none focus:border-orange-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Office Hub / Base Address *</label>
                          <input
                            type="text"
                            required
                            value={editOfficeAddress}
                            onChange={(e) => setEditOfficeAddress(e.target.value)}
                            placeholder="e.g. Shop 4, New Hall Shopping Complex, UNILAG"
                            className="w-full h-11 px-3.5 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs outline-none focus:border-orange-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Base Delivery Fare (₦) *</label>
                          <input
                            type="number"
                            required
                            min={100}
                            step={50}
                            value={editBaseDeliveryPrice}
                            onChange={(e) => setEditBaseDeliveryPrice(Number(e.target.value))}
                            className="w-full h-11 px-3.5 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs outline-none focus:border-orange-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Estimated Turnaround Timeline</label>
                          <input
                            type="text"
                            value={editEstimatedTurnaround}
                            onChange={(e) => setEditEstimatedTurnaround(e.target.value)}
                            placeholder="e.g. 1-2 Hours on Campus"
                            className="w-full h-11 px-3.5 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs outline-none focus:border-orange-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Operating Hours</label>
                          <input
                            type="text"
                            value={editOperatingHours}
                            onChange={(e) => setEditOperatingHours(e.target.value)}
                            placeholder="e.g. 8:00 AM - 8:00 PM (Mon-Sat)"
                            className="w-full h-11 px-3.5 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs outline-none focus:border-orange-500"
                          />
                        </div>
                      </div>

                      {/* Fleet Vehicles Multi-Select */}
                      <div className="space-y-2 pt-2">
                        <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block">Fleet Vehicles Available *</label>
                        <div className="flex flex-wrap gap-2">
                          {["Bike / Motorcycle", "Bicycle", "Tricycle / Keke", "Car / Sedan", "Van / Bus", "Walking Courier"].map((v) => {
                            const isSelected = editSelectedVehicles.includes(v);
                            return (
                              <button
                                key={v}
                                type="button"
                                onClick={() => {
                                  if (isSelected) {
                                    setEditSelectedVehicles(editSelectedVehicles.filter(item => item !== v));
                                  } else {
                                    setEditSelectedVehicles([...editSelectedVehicles, v]);
                                  }
                                }}
                                className={cn(
                                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer flex items-center gap-1.5",
                                  isSelected
                                    ? "bg-orange-600 text-white border-orange-600 shadow-xs"
                                    : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-700"
                                )}
                              >
                                {isSelected ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                                {v}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Covered Campuses Selector */}
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Covered University Campuses ({editSelectedCampuses.length} Selected) *</label>
                          {editSelectedCampuses.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setEditSelectedCampuses([])}
                              className="text-[10px] text-red-500 hover:underline cursor-pointer bg-transparent border-none"
                            >
                              Clear All
                            </button>
                          )}
                        </div>

                        {/* Selected Campus Tags */}
                        {editSelectedCampuses.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 p-3 rounded-2xl bg-orange-50/50 dark:bg-orange-950/10 border border-orange-200/60 dark:border-orange-900/30 max-h-32 overflow-y-auto">
                            {editSelectedCampuses.map((c) => (
                              <span
                                key={c}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 rounded-lg text-[11px] font-bold shadow-2xs border border-orange-200/50 dark:border-zinc-700"
                              >
                                <span>{c}</span>
                                <button
                                  type="button"
                                  onClick={() => setEditSelectedCampuses(editSelectedCampuses.filter(item => item !== c))}
                                  className="text-slate-400 hover:text-red-500 cursor-pointer bg-transparent border-none p-0 ml-0.5"
                                >
                                  ✕
                                </button>
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Search & Add Campus */}
                        <div className="space-y-2">
                          <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                            <input
                              type="text"
                              value={profileCampusSearch}
                              onChange={(e) => setProfileCampusSearch(e.target.value)}
                              placeholder="Search campuses to add (e.g. UNILAG, UNIBEN, OAU)..."
                              className="w-full h-10 pl-9 pr-3.5 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs outline-none focus:border-orange-500"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-40 overflow-y-auto p-2 border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50/50 dark:bg-zinc-900/50">
                            {NIGERIAN_CAMPUSES.filter(c => c.toLowerCase().includes(profileCampusSearch.toLowerCase())).slice(0, 15).map((campus) => {
                              const isSelected = editSelectedCampuses.includes(campus);
                              return (
                                <button
                                  key={campus}
                                  type="button"
                                  onClick={() => {
                                    if (isSelected) {
                                      setEditSelectedCampuses(editSelectedCampuses.filter(c => c !== campus));
                                    } else {
                                      setEditSelectedCampuses([...editSelectedCampuses, campus]);
                                    }
                                  }}
                                  className={cn(
                                    "flex items-center justify-between p-2 rounded-lg text-left text-xs font-semibold transition-colors cursor-pointer border-none",
                                    isSelected
                                      ? "bg-orange-600 text-white font-bold"
                                      : "hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300"
                                  )}
                                >
                                  <span className="truncate">{campus}</span>
                                  {isSelected ? <Check className="w-3.5 h-3.5 shrink-0" /> : <Plus className="w-3.5 h-3.5 shrink-0 text-slate-400" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Bank Settlement Details */}
                      <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-zinc-850">
                        <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 block">Bank Settlement Account (For Daily Fare Payouts)</span>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <input
                            type="text"
                            value={editBankName}
                            onChange={(e) => setEditBankName(e.target.value)}
                            placeholder="Bank Name (e.g. GTBank)"
                            className="h-10 px-3 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs outline-none focus:border-orange-500"
                          />
                          <input
                            type="text"
                            maxLength={10}
                            value={editAccountNumber}
                            onChange={(e) => setEditAccountNumber(e.target.value.replace(/\D/g, ""))}
                            placeholder="10-Digit NUBAN Account Number"
                            className="h-10 px-3 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs outline-none focus:border-orange-500"
                          />
                          <input
                            type="text"
                            value={editAccountName}
                            onChange={(e) => setEditAccountName(e.target.value)}
                            placeholder="Account Holder Full Name"
                            className="h-10 px-3 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs outline-none focus:border-orange-500"
                          />
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-zinc-850">
                        <button
                          type="button"
                          onClick={() => setIsEditingProfile(false)}
                          className="px-5 h-11 rounded-xl text-xs font-bold text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer border-none"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={savingProfile}
                          className="px-6 h-11 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-orange-500/15 disabled:opacity-50 border-none"
                        >
                          {savingProfile ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" /> Saving Changes...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4" /> Save Company Profile
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Forgot Password Modal */}
        <AnimatePresence>
          {showForgotPassword && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 dark:border-zinc-800 space-y-5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-orange-100 dark:bg-orange-950/40 flex items-center justify-center text-orange-600 dark:text-orange-400">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Reset Password</h3>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Reset your logistics account password</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(false)}
                    className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 flex items-center justify-center text-slate-500 dark:text-zinc-400 transition-colors cursor-pointer text-sm font-bold"
                  >
                    ✕
                  </button>
                </div>

                {resetEmailSent ? (
                  <div className="space-y-4 text-center py-2">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">Reset Email Sent!</h4>
                      <p className="text-xs text-slate-600 dark:text-zinc-300 font-medium leading-relaxed">
                        We've sent a password reset link to <span className="font-bold text-slate-900 dark:text-white">{resetEmail}</span>. Please check your email inbox and follow the instructions to reset your password.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(false)}
                      className="w-full h-11 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-orange-500/15"
                    >
                      Back to Login
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handlePasswordReset} className="space-y-4 text-left">
                    <p className="text-xs text-slate-600 dark:text-zinc-300 font-medium leading-relaxed">
                      Enter your registered partner email address below, and we will send you a password reset link.
                    </p>

                    {resetError && (
                      <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-red-600 dark:text-red-400 text-xs font-semibold">
                        {resetError}
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300">Partner Email Address</label>
                      <input
                        type="email"
                        required
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="partner@logistics.com"
                        className="w-full h-11 px-3.5 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none text-xs transition-all"
                      />
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(false)}
                        className="flex-1 h-11 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 rounded-xl font-bold text-xs transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={resetLoading}
                        className="flex-1 h-11 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md shadow-orange-500/15"
                      >
                        {resetLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Reset Link"}
                      </button>
                    </div>
                  </form>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
