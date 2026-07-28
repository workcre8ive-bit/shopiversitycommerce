import React from "react";
import { auth, db } from "../firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut 
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
  EyeOff
} from "lucide-react";
import { NIGERIAN_CAMPUSES } from "../constants/campuses";
import { cn } from "../lib/utils";

interface LogisticsCompany {
  id: string;
  companyName: string;
  rcNumber: string;
  email: string;
  phoneNumber: string;
  officeAddress: string;
  vehicleTypes: string[];
  coveredCampuses: string[];
  baseDeliveryPrice: number;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
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

  // Dashboard Tab state
  const [activeTab, setActiveTab] = React.useState<"available-jobs" | "active-deliveries" | "history" | "profile">("available-jobs");

  // Database jobs lists
  const [allDeliveries, setAllDeliveries] = React.useState<DeliveryJob[]>([]);

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
  }, [companyProfile, view]);

  // Listen to logistics deliveries
  React.useEffect(() => {
    if (view !== "dashboard" || !companyProfile) return;

    const unsubscribe = onSnapshot(collection(db, "logistics_deliveries"), (snapshot) => {
      const list: DeliveryJob[] = [];
      snapshot.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as DeliveryJob);
      });
      setAllDeliveries(list);
    }, (error) => {
      console.error("Logistics deliveries subscription failed:", error);
    });

    return unsubscribe;
  }, [view, companyProfile]);

  // Filter lists based on company profile
  const availableJobs = React.useMemo(() => {
    if (!companyProfile) return [];
    return allDeliveries.filter(
      (job) => 
        job.status === "pending" && 
        (job.logisticsId === companyProfile.id || 
         (!job.logisticsId && companyProfile.coveredCampuses.includes(job.campus)))
    );
  }, [allDeliveries, companyProfile]);

  const directOffers = React.useMemo(() => {
    return availableJobs.filter((job) => job.logisticsId === companyProfile?.id);
  }, [availableJobs, companyProfile]);

  const activeDeliveries = React.useMemo(() => {
    if (!companyProfile) return [];
    return allDeliveries.filter(
      (job) => 
        job.logisticsId === companyProfile.id && 
        ["accepted", "picked_up", "in_transit"].includes(job.status)
    );
  }, [allDeliveries, companyProfile]);

  const deliveryHistory = React.useMemo(() => {
    if (!companyProfile) return [];
    return allDeliveries.filter(
      (job) => 
        job.logisticsId === companyProfile.id && 
        ["delivered", "cancelled"].includes(job.status)
    );
  }, [allDeliveries, companyProfile]);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      const user = userCredential.user;
      
      const docSnap = await getDoc(doc(db, "logistics_companies", user.uid));
      if (!docSnap.exists()) {
        await signOut(auth);
        setError("This account is not registered as a Logistics Partner. Please register a new logistics account.");
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
  const handleRegisterInit = (e: React.FormEvent) => {
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

      // Create a matching standard user record with a 'logistics' identifier
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        displayName: companyName,
        username: companyName.toLowerCase().replace(/[^a-z0-9]/g, "") + "_logistics",
        email: email,
        phoneNumber: phoneNumber,
        role: "seller", // keeps it compatible with standard sellers
        isVerified: true,
        isSuspended: false,
        reportCount: 0,
        createdAt: new Date().toISOString(),
        businessName: companyName,
        location: officeAddress,
        state: "Logistics Partner"
      });

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
  const handleAcceptJob = async (jobId: string) => {
    if (!companyProfile) return;
    setLoading(true);
    try {
      const jobRef = doc(db, "logistics_deliveries", jobId);
      await updateDoc(jobRef, {
        status: "accepted",
        logisticsId: companyProfile.id,
        logisticsName: companyProfile.companyName,
        updatedAt: new Date().toISOString()
      });

      // Also find the related order in standard orders and update its status
      const jobSnap = await getDoc(jobRef);
      if (jobSnap.exists()) {
        const jobData = jobSnap.data();
        const orderId = jobData.orderId;
        const orderRef = doc(db, "orders", orderId);
        const orderSnap = await getDoc(orderRef);
        if (orderSnap.exists()) {
          await updateDoc(orderRef, {
            status: "accepted",
            logisticsOfferStatus: "accepted",
            deliveredWorkNotes: `Accepted by dispatch: ${companyProfile.companyName} (${companyProfile.phoneNumber})`,
            updatedAt: new Date().toISOString()
          });
        }

        // Notify the seller
        await addDoc(collection(db, "notifications"), {
          userId: jobData.sellerId,
          title: "Logistics Offer Accepted",
          message: `Logistics company ${companyProfile.companyName} has accepted your delivery offer for order of ${jobData.productName || "your product"}! They are preparing for pickup.`,
          type: "order",
          isRead: false,
          createdAt: new Date().toISOString()
        });
      }
      setSuccessMsg("Job accepted successfully! Move to 'Active Deliveries' to handle progress.");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      console.error(err);
      setError("Failed to accept job.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Decline Job
  const handleDeclineJob = async (jobId: string) => {
    if (!companyProfile) return;
    setLoading(true);
    try {
      const jobRef = doc(db, "logistics_deliveries", jobId);
      await updateDoc(jobRef, {
        status: "declined",
        updatedAt: new Date().toISOString()
      });

      // Also find the related order in standard orders and update its status
      const jobSnap = await getDoc(jobRef);
      if (jobSnap.exists()) {
        const jobData = jobSnap.data();
        const orderId = jobData.orderId;
        const orderRef = doc(db, "orders", orderId);
        const orderSnap = await getDoc(orderRef);
        if (orderSnap.exists()) {
          await updateDoc(orderRef, {
            status: "declined_by_logistics",
            logisticsOfferStatus: "declined",
            deliveredWorkNotes: `Offer declined by logistics company: ${companyProfile.companyName} (${companyProfile.phoneNumber}). Please assign another courier.`,
            kwikRiderId: null, // Clear rider id so seller knows they can assign again
            kwikTrackingUrl: null,
            updatedAt: new Date().toISOString()
          });
        }

        // Notify the seller
        await addDoc(collection(db, "notifications"), {
          userId: jobData.sellerId,
          title: "Logistics Offer Declined",
          message: `Logistics company ${companyProfile.companyName} has declined your delivery offer for order of ${jobData.productName || "your product"}. Please assign another courier.`,
          type: "order",
          isRead: false,
          createdAt: new Date().toISOString()
        });
      }
      setSuccessMsg("Delivery offer declined successfully.");
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

    if (currentStatus === "accepted") {
      nextStatus = "picked_up";
      orderStatusLabel = "Order Picked Up";
    } else if (currentStatus === "picked_up") {
      nextStatus = "in_transit";
      orderStatusLabel = "Out For Delivery";
    } else if (currentStatus === "in_transit") {
      nextStatus = "delivered";
      orderStatusLabel = "Order Delivered";
    }

    setLoading(true);
    try {
      const jobRef = doc(db, "logistics_deliveries", jobId);
      await updateDoc(jobRef, {
        status: nextStatus,
        updatedAt: new Date().toISOString()
      });

      // Also update standard order
      const jobSnap = await getDoc(jobRef);
      if (jobSnap.exists()) {
        const orderId = jobSnap.data().orderId;
        const orderRef = doc(db, "orders", orderId);
        const orderSnap = await getDoc(orderRef);
        if (orderSnap.exists()) {
          const updateData: any = {
            status: orderStatusLabel as any,
            updatedAt: new Date().toISOString()
          };
          if (nextStatus === "delivered") {
            updateData.deliveredAt = new Date().toISOString();
          }
          await updateDoc(orderRef, updateData);
        }
      }
      setSuccessMsg(`Status updated to ${nextStatus.replace("_", " ")}!`);
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      console.error(err);
      setError("Failed to update delivery status.");
    } finally {
      setLoading(false);
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
      <div className="bg-gradient-to-r from-orange-600 to-amber-500 py-6 px-6 text-white flex items-center justify-between shadow-md animate-in fade-in slide-in-from-top-4 duration-300">
        <div className="flex items-center gap-3">
          <Truck className="w-8 h-8 text-white animate-bounce" />
          <div>
            <h1 className="text-xl font-black tracking-tight uppercase !text-white">Shopiversity Logistics</h1>
            <p className="text-xs text-orange-100 font-medium">Campus Delivery Network Partner</p>
          </div>
        </div>
        <button
          onClick={onBackToMarket}
          className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold transition-all border border-white/20 cursor-pointer"
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
                Join our trusted student courier network. Partner with registered campus retail merchants and deliver packages securely to buyers inside your university campus.
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
                    You are currently signed in as a student buyer or seller. A person registered as a buyer or seller cannot sign up or access logistics services until they sign out.
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
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Password</label>
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
                  {["Bicycle", "Motorcycle", "Car", "Mini-Van", "Truck"].map((vehicle) => {
                    const isSelected = selectedVehicles.includes(vehicle);
                    return (
                      <button
                        type="button"
                        key={vehicle}
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
                  {filteredCampuses.slice(0, 30).map((campus) => {
                    const isSelected = selectedCampuses.includes(campus);
                    return (
                      <button
                        type="button"
                        key={campus}
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
                  <button 
                    onClick={handleLogout}
                    className="p-2 bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-xl transition-all cursor-pointer border-none"
                    title="Log Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Tab Navigation Menu */}
              <div className="bg-white dark:bg-zinc-900 p-4 rounded-[2rem] border border-slate-200/60 dark:border-zinc-800/60 shadow-sm space-y-1.5">
                {[
                  { id: "available-jobs", label: `Available Jobs (${availableJobs.length})`, icon: Package },
                  { id: "active-deliveries", label: `Active Shipments (${activeDeliveries.length})`, icon: Truck },
                  { id: "history", label: "Completed Jobs", icon: Clock },
                  { id: "profile", label: "Company Fleet Profile", icon: Building }
                ].map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-bold tracking-tight transition-all text-left cursor-pointer border-none",
                        isActive
                          ? "bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400 border-l-4 border-orange-600"
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
                        Sellers have booked your company specifically for delivery. Please accept or decline these contracts to notify the sellers of your availability.
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
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-black text-slate-800 dark:text-zinc-100">Pending Campus Deliveries</h3>
                      <p className="text-xs text-slate-500">Unassigned shipments needing immediate dispatch on your registered campuses</p>
                    </div>
                    <span className="text-xs font-bold text-orange-600 bg-orange-50 dark:bg-orange-950/20 px-3 py-1 rounded-full">{availableJobs.length} Available</span>
                  </div>

                  {availableJobs.length === 0 ? (
                    <div className="bg-white dark:bg-zinc-900 border border-dashed border-slate-200 dark:border-zinc-800 rounded-[2.5rem] p-12 text-center">
                      <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                      <h4 className="font-bold text-slate-700 dark:text-zinc-300">No unassigned orders found</h4>
                      <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto">Sellers can request your dispatch riders when preparing client orders. Active jobs covering your campuses will display here.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {availableJobs.map((job) => (
                        <div key={job.id} className="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/60 p-6 rounded-[2rem] shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                          <div className="space-y-4">
                            <div className="flex items-start justify-between gap-4 border-b border-slate-50 dark:border-zinc-850 pb-3">
                              <div className="space-y-0.5">
                                {job.logisticsId === companyProfile.id ? (
                                  <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full mb-1">
                                    ⭐ Direct Offer to You
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[9px] font-black text-orange-500 uppercase tracking-wider bg-orange-50 dark:bg-orange-950/20 px-2 py-0.5 rounded-full mb-1">
                                    🌐 General Campus Job
                                  </span>
                                )}
                                <h4 className="font-black text-slate-800 dark:text-zinc-100 text-sm line-clamp-1">{job.productName}</h4>
                                <p className="text-[10px] font-bold text-slate-400">Order ID: #{job.orderId.slice(-6).toUpperCase()}</p>
                              </div>
                              <span className="font-black text-orange-600 text-base shrink-0">₦{job.deliveryPrice.toLocaleString()}</span>
                            </div>

                            {/* Journey Steps */}
                            <div className="space-y-3 pt-1">
                              <div className="flex gap-2.5 items-start">
                                <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">A</div>
                                <div className="space-y-0.5 text-xs">
                                  <p className="font-bold text-slate-500 uppercase tracking-wide text-[10px]">Pickup (Seller)</p>
                                  <p className="font-black text-slate-700 dark:text-zinc-300">{job.sellerName}</p>
                                  <p className="text-slate-400 text-[11px] truncate">{job.sellerAddress}</p>
                                </div>
                              </div>

                              <div className="flex gap-2.5 items-start">
                                <div className="w-5 h-5 rounded-full bg-orange-100 dark:bg-orange-950/20 text-orange-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">B</div>
                                <div className="space-y-0.5 text-xs">
                                  <p className="font-bold text-orange-500 uppercase tracking-wide text-[10px]">Deliver (Buyer)</p>
                                  <p className="font-black text-slate-700 dark:text-zinc-300">{job.buyerName}</p>
                                  <p className="text-slate-400 text-[11px] truncate">{job.buyerAddress}</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="mt-6 pt-4 border-t border-slate-50 dark:border-zinc-850">
                            {job.logisticsId === companyProfile.id ? (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleAcceptJob(job.id)}
                                  className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <Check className="w-4 h-4" />
                                  Accept Offer
                                </button>
                                <button
                                  onClick={() => handleDeclineJob(job.id)}
                                  className="flex-1 h-11 bg-red-100 dark:bg-red-950/30 hover:bg-red-200 text-red-700 dark:text-red-400 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <X className="w-4 h-4" />
                                  Decline Offer
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleAcceptJob(job.id)}
                                className="w-full h-11 bg-slate-900 dark:bg-zinc-850 hover:bg-orange-600 hover:dark:bg-orange-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
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
                      <h3 className="text-xl font-black text-slate-800 dark:text-zinc-100">Live Delivery Shipments</h3>
                      <p className="text-xs text-slate-500">Track accepted orders and update current delivery status</p>
                    </div>
                    <span className="text-xs font-bold text-orange-600 bg-orange-50 dark:bg-orange-950/20 px-3 py-1 rounded-full">{activeDeliveries.length} In Progress</span>
                  </div>

                  {activeDeliveries.length === 0 ? (
                    <div className="bg-white dark:bg-zinc-900 border border-dashed border-slate-200 dark:border-zinc-800 rounded-[2.5rem] p-12 text-center">
                      <Truck className="w-16 h-16 text-slate-300 mx-auto mb-4 animate-pulse" />
                      <h4 className="font-bold text-slate-700 dark:text-zinc-300">No active deliveries</h4>
                      <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto">Accept unassigned contracts from the 'Available Jobs' tab to manage live deliveries.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activeDeliveries.map((job) => (
                        <div key={job.id} className="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/60 p-6 rounded-[2.5rem] shadow-sm space-y-6">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-zinc-850 pb-4">
                            <div>
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 text-amber-500 rounded-full text-[10px] font-black uppercase tracking-wider mb-2">
                                <Clock className="w-3.5 h-3.5" />
                                {job.status.toUpperCase().replace("_", " ")}
                              </span>
                              <h4 className="text-base font-black text-slate-800 dark:text-zinc-100">{job.productName} (x{job.quantity})</h4>
                              <p className="text-xs font-medium text-slate-400">Order Ref: #{job.orderId.slice(-6).toUpperCase()}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-slate-400 font-bold">Delivery Fare Paid</p>
                              <strong className="text-xl font-black text-slate-900 dark:text-zinc-100">₦{job.deliveryPrice.toLocaleString()}</strong>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                              <div className="space-y-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Pickup Location (Seller)</span>
                                <p className="text-xs font-bold text-slate-700 dark:text-zinc-300">{job.sellerName} ({job.campus})</p>
                                <p className="text-xs text-slate-500 leading-relaxed">{job.sellerAddress}</p>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <div className="space-y-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Destination Location (Buyer)</span>
                                <p className="text-xs font-bold text-slate-700 dark:text-zinc-300">{job.buyerName} ({job.buyerPhone})</p>
                                <p className="text-xs text-slate-500 leading-relaxed">{job.buyerAddress}</p>
                              </div>
                            </div>
                          </div>

                          {/* Status Stepper Progression Button */}
                          <div className="pt-4 border-t border-slate-100 dark:border-zinc-850 flex items-center justify-between flex-wrap gap-4">
                            <div className="flex gap-1.5 items-center">
                              <div className={cn("w-2.5 h-2.5 rounded-full", job.status === "accepted" ? "bg-amber-400" : "bg-slate-300")} />
                              <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                              <div className={cn("w-2.5 h-2.5 rounded-full", job.status === "picked_up" ? "bg-orange-500" : "bg-slate-300")} />
                              <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                              <div className={cn("w-2.5 h-2.5 rounded-full", job.status === "in_transit" ? "bg-blue-500" : "bg-slate-300")} />
                            </div>

                            <button
                              onClick={() => handleUpdateStatus(job.id, job.status)}
                              className="h-11 px-6 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md shadow-orange-500/10 cursor-pointer"
                            >
                              {job.status === "accepted" && "Picked Up from Merchant"}
                              {job.status === "picked_up" && "Mark Out for Delivery"}
                              {job.status === "in_transit" && "Confirm Successful Delivery"}
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
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-slate-200/60 dark:border-zinc-800/60 shadow-sm">
                      <p className="text-xs text-slate-400 font-bold uppercase">Total Settled Earnings</p>
                      <strong className="text-2xl font-black text-slate-800 dark:text-zinc-100 mt-1 block">
                        ₦{deliveryHistory
                          .filter(j => j.status === "delivered")
                          .reduce((sum, j) => sum + j.deliveryPrice, 0)
                          .toLocaleString()
                        }
                      </strong>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-slate-200/60 dark:border-zinc-800/60 shadow-sm">
                      <p className="text-xs text-slate-400 font-bold uppercase">Completed Shipments</p>
                      <strong className="text-2xl font-black text-slate-800 dark:text-zinc-100 mt-1 block">
                        {deliveryHistory.filter(j => j.status === "delivered").length} deliveries
                      </strong>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-slate-200/60 dark:border-zinc-800/60 shadow-sm">
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
                                <th className="px-6 py-4">Seller/Buyer</th>
                                <th className="px-6 py-4">Fare Paid</th>
                                <th className="px-6 py-4">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-zinc-850">
                              {deliveryHistory.map((job) => (
                                <tr key={job.id} className="text-xs hover:bg-slate-50/50 dark:hover:bg-zinc-850/30 transition-colors">
                                  <td className="px-6 py-4">
                                    <p className="font-bold text-slate-800 dark:text-zinc-100">{job.productName}</p>
                                    <p className="text-[10px] text-slate-400 font-medium">Order: #{job.orderId.slice(-6).toUpperCase()}</p>
                                  </td>
                                  <td className="px-6 py-4">
                                    <p className="font-bold text-slate-700 dark:text-zinc-300">Seller: {job.sellerName}</p>
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

              {/* SUBVIEW 4: COMPANY PROFILE */}
              {activeTab === "profile" && (
                <div className="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/60 p-8 rounded-[2.5rem] shadow-sm space-y-6">
                  <div>
                    <h3 className="text-xl font-black text-slate-800 dark:text-zinc-100">Logistics Company Profile</h3>
                    <p className="text-xs text-slate-500">Fleet operational configurations and cover areas</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-zinc-850">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Registered Company Name</span>
                      <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">{companyProfile.companyName}</p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Business CAC / RC number</span>
                      <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">{companyProfile.rcNumber}</p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Operational Email Address</span>
                      <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">{companyProfile.email}</p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Operational Phone number</span>
                      <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">{companyProfile.phoneNumber}</p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Office Address</span>
                      <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">{companyProfile.officeAddress}</p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Default Base Delivery price</span>
                      <p className="text-sm font-bold text-orange-600">₦{companyProfile.baseDeliveryPrice.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Active Fleet Vehicle coverage</span>
                    <div className="flex flex-wrap gap-2">
                      {companyProfile.vehicleTypes.map((vehicle, idx) => (
                        <span key={`${vehicle}-${idx}`} className="px-3 py-1 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 rounded-lg text-xs font-bold">
                          {vehicle}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 pt-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Covered Campus Locations</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-slate-50 dark:border-zinc-850 p-4 rounded-2xl bg-slate-50/50 dark:bg-zinc-900/50">
                      {companyProfile.coveredCampuses.map((campus, idx) => (
                        <div key={`${campus}-${idx}`} className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-zinc-300">
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span>{campus}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
