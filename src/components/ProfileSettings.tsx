import React from "react";
import { db } from "../firebase";
import { doc, updateDoc, collection, query, where, getDocs, deleteDoc, onSnapshot, orderBy, addDoc } from "firebase/firestore";
import { UserProfile } from "../types";
import { NIGERIAN_CAMPUSES } from "../constants/campuses";
import { SCHOOL_TYPES, NIGERIAN_SCHOOLS } from "../constants/schools";
import { NIGERIAN_STATES, STATE_CITIES } from "../constants/locations";
import { 
  User, 
  MessageCircle, 
  Save, 
  Loader2, 
  Upload,
  MapPin,
  Trash2,
  LogOut,
  Moon,
  Camera,
  CreditCard,
  Building,
  Hash,
  UserCheck,
  Settings,
  CheckCircle,
  Navigation,
  Globe,
  Phone,
  Search,
  ChevronDown,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  Shield,
  Wallet,
  ChevronLeft,
  School,
  AtSign,
  Sparkles,
  ArrowLeft
} from "lucide-react";
import { handleFirestoreError, OperationType, getFirestoreErrorMessage } from "../lib/firebase-errors";
import { compressImage } from "../lib/imageUtils";
import { auth } from "../firebase";
import { deleteUser, signOut } from "firebase/auth";
import { GoogleGenAI, Type } from "@google/genai";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";

const FALLBACK_BANKS = [
  { name: "Access Bank", code: "044" },
  { name: "Guaranty Trust Bank", code: "058" },
  { name: "Zenith Bank", code: "057" },
  { name: "United Bank for Africa", code: "033" },
  { name: "First Bank of Nigeria", code: "011" },
  { name: "Union Bank of Nigeria", code: "032" },
  { name: "Sterling Bank", code: "232" },
  { name: "Wema Bank", code: "035" },
  { name: "Fidelity Bank", code: "070" },
  { name: "Polaris Bank", code: "076" },
  { name: "Stanbic IBTC Bank", code: "221" },
  { name: "Keystone Bank", code: "082" },
  { name: "Ecobank Nigeria", code: "050" },
  { name: "First City Monument Bank", code: "214" },
  { name: "Jaiz Bank", code: "301" },
  { name: "Providus Bank", code: "101" },
  { name: "TAJ Bank", code: "302" },
  { name: "Globus Bank", code: "103" },
  { name: "OPay Digital Services (OPay)", code: "999992" },
  { name: "PalmPay", code: "999991" },
  { name: "Kuda Bank", code: "50211" },
  { name: "Moniepoint Microfinance Bank", code: "50515" },
  { name: "VFD Microfinance Bank", code: "566" },
  { name: "Other", code: "other" }
];

interface ProfileSettingsProps {
  user: UserProfile;
  onBack?: () => void;
  activeRole?: "buyer" | "seller";
}

export default function ProfileSettings({ user, onBack, activeRole }: ProfileSettingsProps) {
  const displayRole = activeRole || user.role || "buyer";
  const [fullName, setFullName] = React.useState(user.displayName);
  const [username, setUsername] = React.useState(user.username || "");
  const [businessName, setBusinessName] = React.useState(user.businessName || user.storefrontSettings?.businessName || "");
  const [location, setLocation] = React.useState(user.location || "");
  const [schoolType, setSchoolType] = React.useState(user.schoolType || "");
  const [schoolName, setSchoolName] = React.useState(user.schoolName || "");
  const [country, setCountry] = React.useState(user.country || "Nigeria");
  const [state, setState] = React.useState(user.state || "");
  const [city, setCity] = React.useState(user.city || "");
  const [stateSearch, setStateSearch] = React.useState("");
  const [isStateDropdownOpen, setIsStateDropdownOpen] = React.useState(false);
  const [citySearch, setCitySearch] = React.useState("");
  const [isCityDropdownOpen, setIsCityDropdownOpen] = React.useState(false);
  const [deliveryAddress, setDeliveryAddress] = React.useState(user.deliveryAddress || "");
  const [deliveryLocations, setDeliveryLocations] = React.useState(user.deliveryLocations || "");
  const [businessPhone, setBusinessPhone] = React.useState(user.businessPhoneNumber || "");
  const [phonePrefix, setPhonePrefix] = React.useState("+234");
  const [gender, setGender] = React.useState(user.gender || "");
  const [photoURL, setPhotoURL] = React.useState(user.photoURL || "");
  const [activeSection, setActiveSection] = React.useState<"personal" | "campus" | "payment" | "security">("personal");

  React.useEffect(() => {
    if (displayRole === "buyer" && activeSection === "payment") {
      setActiveSection("personal");
    }
  }, [displayRole, activeSection]);
  
  const prevUserRef = React.useRef(user);
  
  React.useEffect(() => {
    const prev = prevUserRef.current;
    
    if (user.uid !== prev.uid) {
      setFullName(user.displayName);
      setUsername(user.username || "");
      setBusinessName(user.businessName || user.storefrontSettings?.businessName || "");
      setLocation(user.location || "");
      setSchoolType(user.schoolType || "");
      setSchoolName(user.schoolName || "");
      setCountry(user.country || "Nigeria");
      setState(user.state || "");
      setCity(user.city || "");
      setDeliveryAddress(user.deliveryAddress || "");
      setDeliveryLocations(user.deliveryLocations || "");
      setBusinessPhone(user.businessPhoneNumber || "");
      setGender(user.gender || "");
      setPhotoURL(user.photoURL || "");
      setBankName(user.bankDetails?.bankName || "");
      setAccountNumber(user.bankDetails?.accountNumber || "");
      setAccountName(user.bankDetails?.accountName || "");
    } else {
      if (user.displayName !== prev.displayName) setFullName(user.displayName);
      if (user.username !== prev.username) setUsername(user.username || "");
      if (user.businessName !== prev.businessName || user.storefrontSettings?.businessName !== prev.storefrontSettings?.businessName) {
        setBusinessName(user.businessName || user.storefrontSettings?.businessName || "");
      }
      if (user.location !== prev.location) setLocation(user.location || "");
      if (user.schoolType !== prev.schoolType) setSchoolType(user.schoolType || "");
      if (user.schoolName !== prev.schoolName) setSchoolName(user.schoolName || "");
      if (user.country !== prev.country) setCountry(user.country || "Nigeria");
      if (user.state !== prev.state) setState(user.state || "");
      if (user.city !== prev.city) setCity(user.city || "");
      if (user.deliveryAddress !== prev.deliveryAddress) setDeliveryAddress(user.deliveryAddress || "");
      if (user.deliveryLocations !== prev.deliveryLocations) setDeliveryLocations(user.deliveryLocations || "");
      if (user.businessPhoneNumber !== prev.businessPhoneNumber) setBusinessPhone(user.businessPhoneNumber || "");
      if (user.gender !== prev.gender) setGender(user.gender || "");
      if (user.photoURL !== prev.photoURL) setPhotoURL(user.photoURL || "");
      if (user.verificationIdUrl !== prev.verificationIdUrl) {
        setVerificationIdUrl(user.verificationIdUrl || "");
        if (user.verificationIdUrl) {
          setIdVerificationSuccess(true);
        }
      }
      
      if (user.bankDetails?.bankName !== prev.bankDetails?.bankName) setBankName(user.bankDetails?.bankName || "");
      if (user.bankDetails?.accountNumber !== prev.bankDetails?.accountNumber) setAccountNumber(user.bankDetails?.accountNumber || "");
      if (user.bankDetails?.accountName !== prev.bankDetails?.accountName) setAccountName(user.bankDetails?.accountName || "");
    }
    
    prevUserRef.current = user;
  }, [user]);

  const [schoolSearch, setSchoolSearch] = React.useState("");
  const [isSchoolDropdownOpen, setIsSchoolDropdownOpen] = React.useState(false);
  
  // Seller Payment
  const [bankName, setBankName] = React.useState(user.bankDetails?.bankName || "");
  const [customBankName, setCustomBankName] = React.useState("");
  const [accountNumber, setAccountNumber] = React.useState(user.bankDetails?.accountNumber || "");
  const [accountName, setAccountName] = React.useState(user.bankDetails?.accountName || "");
  const [paystackConnected, setPaystackConnected] = React.useState(user.paystackConnected || false);

  // Use platform account as default if seller hasn't set one
  React.useEffect(() => {
    if (user.role === "seller" && !user.bankDetails?.accountNumber && !accountNumber) {
      setBankName("OPAY DIGITAL SERVICES LIMITED (OPAY)");
      setAccountNumber("7044371385");
      setAccountName("FASHINA MICHEAL");
    }
  }, [user.role, user.bankDetails?.accountNumber]);

  React.useEffect(() => {
    setPaystackConnected(user.paystackConnected || false);
  }, [user.paystackConnected]);

  const [showPaystackInfo, setShowPaystackInfo] = React.useState(false);
  const [isConnectingPaystack, setIsConnectingPaystack] = React.useState(false);
  const [banks, setBanks] = React.useState<{ name: string; code: string }[]>(FALLBACK_BANKS);
  const [bankSearchQuery, setBankSearchQuery] = React.useState("");
  const [isBankDropdownOpen, setIsBankDropdownOpen] = React.useState(false);
  const [isVerifying, setIsVerifying] = React.useState(false);
  
  // ID Verification
  const [isVerifyingId, setIsVerifyingId] = React.useState(false);
  const [idVerificationError, setIdVerificationError] = React.useState("");
  const [verificationIdUrl, setVerificationIdUrl] = React.useState(user.verificationIdUrl || "");
  const [idVerificationSuccess, setIdVerificationSuccess] = React.useState(false);

  const [earnings, setEarnings] = React.useState(0);
  const [pendingEarnings, setPendingEarnings] = React.useState(0);
  const [payoutRequests, setPayoutRequests] = React.useState<any[]>([]);

  React.useEffect(() => {
    const fetchBanks = async () => {
      try {
        const res = await fetch("/api/paystack/banks");
        if (!res.ok) {
          const text = await res.text();
          console.error(`Bank fetch failed with status ${res.status}: ${text.substring(0, 100)}...`);
          return;
        }
        const data = await res.json();
        if (data.status) {
          setBanks(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch banks", err);
      }
    };
    fetchBanks();
  }, []);

  React.useEffect(() => {
    if (user.role === 'seller') {
      const ordersQuery = query(collection(db, "orders"), where("sellerId", "==", user.uid), where("status", "==", "delivered"));
      const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
        const total = snapshot.docs.reduce((acc, doc) => acc + (doc.data().sellerEarnings || 0), 0);
        setEarnings(total);
      }, (error) => {
        console.error("Profile settings orders subscription failed:", error);
      });

      const payoutsQuery = query(collection(db, "payoutRequests"), where("sellerId", "==", user.uid), orderBy("createdAt", "desc"));
      const unsubscribePayouts = onSnapshot(payoutsQuery, (snapshot) => {
        const payouts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPayoutRequests(payouts);
      }, (error) => {
        console.error("Profile settings payouts subscription failed:", error);
      });

      const pendingOrdersQuery = query(collection(db, "orders"), where("sellerId", "==", user.uid), where("status", "==", "pending"));
      const unsubscribePending = onSnapshot(pendingOrdersQuery, (snapshot) => {
        const total = snapshot.docs.reduce((acc, doc) => acc + (doc.data().sellerEarnings || 0), 0);
        setPendingEarnings(total);
      }, (error) => {
        console.error("Profile settings pending earnings subscription failed:", error);
      });

      return () => {
        unsubscribeOrders();
        unsubscribePayouts();
        unsubscribePending();
      };
    }
  }, [user.uid, user.role]);

  const availableBalance = earnings - payoutRequests.reduce((acc, p) => (p.status !== 'rejected' ? acc + p.amount : acc), 0);

  const PHONE_PREFIXES = [
    { code: "+234", country: "Nigeria" },
    { code: "+1", country: "USA/Canada" },
    { code: "+44", country: "UK" },
    { code: "+233", country: "Ghana" },
    { code: "+254", country: "Kenya" },
    { code: "+27", country: "South Africa" }
  ];

  const bankDetailsRef = React.useRef<HTMLDivElement>(null);

    const handleVerifyAccount = async () => {
      if (!bankName) {
        alert("Please select a bank first.");
        return;
      }

      if (accountNumber.length < 10 || accountNumber.length > 15) {
        alert("Account number must be between 10 and 15 digits.");
        return;
      }

      // Paystack resolve only works for 10-digit NUBAN for most banks
      if (accountNumber.length !== 10 && bankName !== "Other") {
        alert("Bank verification (NUBAN) typically requires exactly 10 digits. If your account number is different, please ensure it is correct or select 'Other' if it's a special account type.");
      }
      
      setIsVerifying(true);
      try {
        const bankCode = banks.find(b => b.name === bankName)?.code;
        if (!bankCode && bankName !== "Other") throw new Error("Bank code not found");

        if (bankName === "Other") {
          setIsVerifying(false);
          alert("Verification is not available for 'Other' banks. Please ensure your details are correct.");
          return;
        }

        const res = await fetch(`/api/paystack/resolve-bank/${bankCode}/${accountNumber}`);
        const data = await res.json();
        
        if (data.status) {
          setAccountName(data.data.account_name);
        } else {
          setAccountName("");
          // Handle specific validation error from Paystack
          const errorMsg = data.error?.includes("validation_error") 
            ? "Invalid account format. Most banks require exactly 10 digits for verification."
            : data.error || "Account verification failed. Please check the account number and bank.";
          alert(errorMsg);
        }
      } catch (err: any) {
      setAccountName("");
      alert(err.message || "Verification failed. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRequestPayout = async () => {
    if (availableBalance < 1000) {
      alert("Minimum payout amount is ₦1,000");
      return;
    }
    if (!paystackConnected) {
      alert("Please connect your bank account first");
      return;
    }

    try {
      await addDoc(collection(db, "payoutRequests"), {
        sellerId: user.uid,
        amount: availableBalance,
        status: "pending",
        bankDetails: user.bankDetails,
        createdAt: new Date().toISOString()
      });
      alert("Payout request submitted successfully!");
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "payoutRequests");
    }
  };

  const handleConnectPaystack = async () => {
    if (!accountNumber || !bankName || !accountName) {
      alert("Please verify your bank details first.");
      return;
    }
    if (accountNumber.length < 10 || accountNumber.length > 15) {
      alert("Account number must be between 10 and 15 digits.");
      return;
    }
    setIsConnectingPaystack(true);
    try {
      const selectedBankName = bankName === "Other" ? customBankName : bankName;
      const res = await fetch("/api/paystack/connect-recipient", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId: user.uid,
          bankName: selectedBankName,
          accountNumber,
          accountName
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        try {
          await updateDoc(doc(db, "users", user.uid), {
            paystackConnected: true,
            recipientCode: data.recipientCode,
            bankDetails: data.bankDetails
          });
        } catch (dbErr) {
          console.warn("Could not write profile update client-side (may already be updated by server):", dbErr);
        }
        setPaystackConnected(true);
        alert("Successfully connected your bank via Paystack! Transfer recipient created.");
      } else {
        throw new Error(data.error || "Failed to create transfer recipient");
      }
    } catch (error: any) {
      alert(error.message || "Failed to connect bank details via Paystack.");
    } finally {
      setIsConnectingPaystack(false);
    }
  };

  const handleDisconnectPaystack = async () => {
    if (!confirm("Are you sure you want to disconnect your bank account? This will remove your saved payout details.")) return;
    
    setIsConnectingPaystack(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        paystackConnected: false,
        bankDetails: null
      });
      setPaystackConnected(false);
      setBankName("");
      setAccountNumber("");
      setAccountName("");
      alert("Bank account disconnected successfully.");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setIsConnectingPaystack(false);
    }
  };

  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [hibernateLoading, setHibernateLoading] = React.useState(false);
  const [deleteLoading, setDeleteLoading] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [showHibernateConfirm, setShowHibernateConfirm] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState("");
  const [isDetectingLocation, setIsDetectingLocation] = React.useState(false);
  const [hibernateDuration, setHibernateDuration] = React.useState("0");

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const data = await response.json();
        if (data.display_name) {
          setLocation(data.display_name);
        } else {
          setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        }
      } catch (error) {
        setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      } finally {
        setIsDetectingLocation(false);
      }
    }, (error) => {
      console.error("Geolocation error:", error);
      alert("Unable to retrieve your location. Please ensure location permissions are granted.");
      setIsDetectingLocation(false);
    });
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await compressImage(file, 400, 400, 0.6);
        setPhotoURL(base64);
      } catch (error) {
        console.error("Error compressing photo:", error);
      }
    }
  };

  const handleIdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!fullName || !fullName.trim()) {
        alert("Please enter your full name first so we can verify it against your ID.");
        return;
      }
      
      setIsVerifyingId(true);
      setIdVerificationError("");
      try {
        const base64 = await compressImage(file, 800, 800, 0.7);
        
        // Gemini Verification
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const prompt = `This is an identity card (Student ID, National ID, or Driver's License). 
        You are a cautious but fair identity verification assistant for SHOPIVERSITY, a student marketplace.
        
        Verify if the information on this ID matches the following profile:
        - Full Name: "${fullName}"
        - School/Institution: "${schoolName}"
        - State: "${state}"
        - City: "${city}"

        Verification Criteria:
        1. Name Match: The name on the ID must be substantially similar to "${fullName}". 
           - Allow for middle names appearing or missing.
           - Allow for common abbreviations or shortening (e.g., "Samuel" vs "Sam").
           - Allow for different ordering (Surname first vs Surname last).
           - BE LENIENT as long as it's clearly the same person.
        2. Visual Integrity: The document should look like a valid ID card.
        3. Institution/Location: If it's a student ID, check for "${schoolName}". If it's a government ID, it should be from Nigeria or consistent with a resident in "${state}, ${city}".
        
        Return the result in JSON format.`;
        
        const response = await ai.models.generateContent({
          model: "gemini-flash-latest",
          contents: {
            parts: [
              { inlineData: { data: base64.split(',')[1], mimeType: "image/jpeg" } },
              { text: prompt }
            ]
          },
          config: { 
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                matches: { type: Type.BOOLEAN },
                nameOnId: { type: Type.STRING },
                reason: { type: Type.STRING }
              },
              required: ["matches", "nameOnId", "reason"]
            }
          }
        });
        
        const result = JSON.parse(response.text.trim().replace(/```json|```/g, ""));
        if (result.matches) {
          setVerificationIdUrl(base64);
          setIdVerificationError("");
          setIdVerificationSuccess(true);
        } else {
          setIdVerificationError(`Verification failed: ${result.reason || "The information on the ID does not appear to match your profile details."}`);
          setVerificationIdUrl("");
          setIdVerificationSuccess(false);
        }
      } catch (error: any) {
        console.error("ID verification error:", error);
        setIdVerificationError("An error occurred during verification. Please ensure the image is clear and try again.");
      } finally {
        setIsVerifyingId(false);
      }
    }
  };

  const [showCongratsModal, setShowCongratsModal] = React.useState(false);

  const handleRemoveId = async () => {
    if (!verificationIdUrl) return;
    
    if (confirm("Are you sure you want to remove your ID? This will unverify your account and may restrict your access to buy or sell.")) {
      try {
        setLoading(true);
        const updateData: any = {
          verificationIdUrl: "",
          isVerified: false,
          profileCompleted: false,
          updatedAt: new Date().toISOString()
        };
        
        await updateDoc(doc(db, "users", user.uid), updateData);
        setVerificationIdUrl("");
        setIdVerificationSuccess(false);
        alert("ID removed successfully. Your account is now unverified.");
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleUsePlatformAccount = () => {
    setBankName("OPAY DIGITAL SERVICES LIMITED (OPAY)");
    setAccountNumber("7044371385");
    setAccountName("FASHINA MICHEAL");
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    // Check if profile was incomplete before this update
    const wasIncomplete = !user.schoolName || !user.state || !user.city || (user.role !== "seller" && !user.deliveryAddress) || (user.role !== "buyer" && !user.verificationIdUrl);
    
    try {
      if (!username.trim()) {
        throw new Error("Username is required.");
      }
      
      const isNowComplete = !!schoolName && !!state && !!city && (user.role === "seller" || !!deliveryAddress) && (user.role !== "buyer" ? !!verificationIdUrl : true);

      const updateData: any = {
        displayName: fullName,
        username: username,
        businessName: businessName,
        storefrontSettings: {
          ...(user.storefrontSettings || {
            theme: "minimal",
            primaryColor: "#4f46e5",
            bannerHeight: "medium"
          }),
          businessName: businessName
        },
        location: location,
        schoolType: schoolType,
        schoolName: schoolName,
        country: country,
        state: state,
        city: city,
        deliveryAddress: deliveryAddress,
        deliveryLocations: deliveryLocations,
        businessPhoneNumber: businessPhone,
        gender: gender,
        photoURL: photoURL,
        verificationIdUrl: verificationIdUrl,
        profileCompleted: isNowComplete,
        updatedAt: new Date().toISOString()
      };

      // Only include isVerified if it's changing to true
      if (idVerificationSuccess && !user.isVerified) {
        updateData.isVerified = true;
      }

      if (user.role === "seller") {
        updateData.bankDetails = {
          bankName: bankName === "Other" ? customBankName : bankName,
          accountNumber,
          accountName
        };
        updateData.paystackConnected = paystackConnected;
      }

      await updateDoc(doc(db, "users", user.uid), updateData);
      
      if (isNowComplete && (wasIncomplete || !user.profileCompleted)) {
        setShowCongratsModal(true);
      } else {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (error) {
      setError(getFirestoreErrorMessage(error));
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setLoading(false);
    }
  };

  const handleHibernate = async () => {
    if (hibernateDuration === "0") return;
    setHibernateLoading(true);
    try {
      const now = new Date();
      let until = new Date();
      const value = parseInt(hibernateDuration);
      
      if (hibernateDuration.includes("d")) until.setDate(now.getDate() + value);
      else if (hibernateDuration.includes("w")) until.setDate(now.getDate() + value * 7);
      else if (hibernateDuration.includes("m")) until.setMonth(now.getMonth() + value);

      await updateDoc(doc(db, "users", user.uid), {
        hibernatedUntil: until.toISOString()
      });

      // Also mark products as inactive if seller
      if (user.role === "seller") {
        const productsQ = query(collection(db, "products"), where("sellerId", "==", user.uid));
        const productsSnap = await getDocs(productsQ);
        const updatePromises = productsSnap.docs.map(productDoc => updateDoc(productDoc.ref, { isHibernated: true }));
        await Promise.all(updatePromises);
      }

      alert(`Account hibernated until ${until.toLocaleDateString()}. You will be signed out.`);
      await signOut(auth);
    } catch (error) {
      setError(getFirestoreErrorMessage(error));
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setHibernateLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    setDeleteError("");
    try {
      const firebaseUser = auth.currentUser;
      if (firebaseUser) {
        const uid = user.uid;

        // 1. Delete user's products
        const productsQ = query(collection(db, "products"), where("sellerId", "==", uid));
        const productsSnap = await getDocs(productsQ);
        for (const d of productsSnap.docs) {
          try {
            await deleteDoc(d.ref);
          } catch (e) {
            console.error("Error deleting product:", d.id, e);
          }
        }

        // 2. Delete user's orders (as buyer or seller)
        const buyerOrdersQ = query(collection(db, "orders"), where("buyerId", "==", uid));
        const sellerOrdersQ = query(collection(db, "orders"), where("sellerId", "==", uid));
        const [buyerOrdersSnap, sellerOrdersSnap] = await Promise.all([getDocs(buyerOrdersQ), getDocs(sellerOrdersQ)]);
        for (const d of buyerOrdersSnap.docs) {
          try {
            await deleteDoc(d.ref);
          } catch (e) {
            console.error("Error deleting buyer order:", d.id, e);
          }
        }
        for (const d of sellerOrdersSnap.docs) {
          try {
            await deleteDoc(d.ref);
          } catch (e) {
            console.error("Error deleting seller order:", d.id, e);
          }
        }

        // 3. Delete notifications
        const notificationsQ = query(collection(db, "notifications"), where("userId", "==", uid));
        const notificationsSnap = await getDocs(notificationsQ);
        for (const d of notificationsSnap.docs) {
          try {
            await deleteDoc(d.ref);
          } catch (e) {
            console.error("Error deleting notification:", d.id, e);
          }
        }

        // 4. Delete payout requests
        const payoutQ = query(collection(db, "payoutRequests"), where("sellerId", "==", uid));
        const payoutSnap = await getDocs(payoutQ);
        for (const d of payoutSnap.docs) {
          try {
            await deleteDoc(d.ref);
          } catch (e) {
            console.error("Error deleting payout request:", d.id, e);
          }
        }

        // 5. Delete reviews (by buyer or on seller's products)
        const buyerReviewsQ = query(collection(db, "reviews"), where("buyerId", "==", uid));
        const buyerReviewsSnap = await getDocs(buyerReviewsQ);
        for (const d of buyerReviewsSnap.docs) {
          try {
            await deleteDoc(d.ref);
          } catch (e) {
            console.error("Error deleting buyer review:", d.id, e);
          }
        }
        
        for (const productDoc of productsSnap.docs) {
          const productReviewsQ = query(collection(db, "reviews"), where("productId", "==", productDoc.id));
          const productReviewsSnap = await getDocs(productReviewsQ);
          for (const d of productReviewsSnap.docs) {
            try {
              await deleteDoc(d.ref);
            } catch (e) {
              console.error("Error deleting product review:", d.id, e);
            }
          }
        }

        // 6. Delete reports
        const reporterReportsQ = query(collection(db, "reports"), where("reporterId", "==", uid));
        const vendorReportsQ = query(collection(db, "reports"), where("vendorId", "==", uid));
        const [repSnap, venSnap] = await Promise.all([getDocs(reporterReportsQ), getDocs(vendorReportsQ)]);
        for (const d of repSnap.docs) {
          try {
            await deleteDoc(d.ref);
          } catch (e) {
            console.error("Error deleting reporter report:", d.id, e);
          }
        }
        for (const d of venSnap.docs) {
          try {
            await deleteDoc(d.ref);
          } catch (e) {
            console.error("Error deleting vendor report:", d.id, e);
          }
        }

        // 7. Delete user document
        await deleteDoc(doc(db, "users", uid));

        // 8. Delete from Firebase Auth
        await deleteUser(firebaseUser);
        alert("Account and all associated data deleted successfully.");
      }
    } catch (error: any) {
      console.error("Delete account error:", error);
      if (error.code === "auth/requires-recent-login") {
        setDeleteError("For security reasons, please sign out and sign back in before deleting your account.");
      } else {
        setDeleteError(getFirestoreErrorMessage(error));
      }
      handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredSchools = NIGERIAN_SCHOOLS.filter(s => 
    (!schoolType || s.type === schoolType) &&
    s.name.toLowerCase().includes(schoolSearch.toLowerCase())
  );

  const importantFields = [
    fullName, user.username, user.email, user.phoneNumber, 
    schoolName, location, 
    country, city, businessPhone, photoURL
  ];
  const filledCount = importantFields.filter(f => !!f).length;
  const totalFields = importantFields.length;

  const getVerificationStatus = () => {
    const isProfileEmpty = !fullName && !user.username && !schoolName && !location && !deliveryAddress;
    
    if (user.isVerified) return { label: "Verified", color: "text-emerald-600 bg-emerald-50", icon: ShieldCheck, tag: "verified" };
    if (idVerificationSuccess && !user.isVerified) return { label: "Verification Pending Save", color: "text-amber-600 bg-amber-50", icon: ShieldAlert, tag: "pending_save" };
    
    const isComplete = !!fullName && !!user.username && !!schoolName && !!location && (user.role === "seller" || !!deliveryAddress) && (user.role !== "buyer" ? !!verificationIdUrl : true);
    
    if (isProfileEmpty) return { label: "Unverified", color: "text-red-600 bg-red-50", icon: Shield, tag: "unverified" };
    if (!isComplete) return { label: "Pending Verification", color: "text-amber-600 bg-amber-50", icon: ShieldAlert, tag: "incomplete" };
    
    return { label: "Verified", color: "text-emerald-600 bg-emerald-50", icon: ShieldCheck, tag: "verified" };
  };

  const status = getVerificationStatus();

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-20">
      <div className="flex items-center gap-4">
        {onBack && (
          <button 
            onClick={onBack}
            className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:scale-105 transition-all text-slate-600 dark:text-slate-400 group"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </button>
        )}
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white italic tracking-tighter">Profile Settings</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Manage your personal information and preferences</p>
        </div>
      </div>
      
      {/* Profile Header */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-8 shadow-sm flex flex-col sm:flex-row items-center gap-6">
        <div className="flex flex-col items-center gap-4">
          <label className="w-24 h-24 rounded-[2rem] bg-slate-100 dark:bg-slate-800 overflow-hidden relative group cursor-pointer flex-shrink-0 shadow-lg border-2 border-white dark:border-slate-700">
            <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
            <img 
              src={photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
              alt={user.displayName}
              className="w-full h-full object-cover transition-transform group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="text-white w-6 h-6" />
            </div>
          </label>
          <div className="flex gap-2">
            <label className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-950/20 text-slate-500 hover:text-purple-600 transition-all border border-slate-200 dark:border-slate-700 shadow-sm" title="Take a photo">
              <input type="file" accept="image/*" capture="user" onChange={handlePhotoChange} className="hidden" />
              <Camera className="w-4 h-4" />
            </label>
            <label className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-950/20 text-slate-500 hover:text-purple-600 transition-all border border-slate-200 dark:border-slate-700 shadow-sm" title="Choose from files">
              <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
              <Upload className="w-4 h-4" />
            </label>
          </div>
        </div>
        <div className="flex-grow text-center sm:text-left">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{user.displayName}</h3>
            <div className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider w-fit mx-auto sm:mx-0",
              status.color
            )}>
              <status.icon className="w-3 h-3" />
              {status.label}
              {status.tag === "verified" && <CheckCircle className="w-3 h-3 fill-current" />}
            </div>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium">@{user.username}</p>
          <div className="mt-3 flex flex-wrap justify-center sm:justify-start gap-2">
            <span className="text-[10px] font-bold text-purple-600 bg-purple-50 dark:bg-purple-950/20 px-2 py-1 rounded-lg uppercase tracking-wider">
              {user.role}
            </span>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg uppercase tracking-wider">
              Profile {Math.round((filledCount / totalFields) * 100)}% Complete
            </span>
            {user.strikeCount !== undefined && user.strikeCount > 0 && (
              <span className="text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-900/10 px-2 py-1 rounded-lg uppercase tracking-wider flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {user.strikeCount} {user.strikeCount === 1 ? 'Strike' : 'Strikes'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-50 dark:bg-slate-800/25 rounded-2xl border border-slate-100 dark:border-slate-800/80">
        {[
          { id: "personal", label: "Personal Info", icon: User },
          { id: "campus", label: "Campus & Delivery", icon: School },
          ...(displayRole === "seller" ? [{ id: "payment", label: "Banking & Payout", icon: CreditCard }] : []),
          { id: "security", label: "Account & Safety", icon: Settings },
        ].map((tab) => {
          const IconComponent = tab.icon;
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSection(tab.id as any)}
              className={cn(
                "flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all duration-300",
                isActive 
                  ? "bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-500 shadow-sm border border-slate-100 dark:border-slate-700/50" 
                  : "text-slate-500 dark:text-slate-400 hover:text-purple-500 dark:hover:text-purple-400 bg-transparent"
              )}
            >
              <IconComponent className={cn("w-4 h-4", isActive ? "text-purple-500" : "text-slate-400")} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Settings Form */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-8 shadow-sm">
        <AnimatePresence>
          {showCongratsModal && (
            <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-800 relative overflow-hidden"
              >
                {/* Decorative Background */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-500/5 rounded-full -ml-12 -mb-12" />

                <div className="relative z-10 text-center">
                  <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/20 rounded-3xl flex items-center justify-center text-emerald-600 mx-auto mb-6 shadow-lg shadow-emerald-100 dark:shadow-none">
                    <Sparkles className="w-10 h-10" />
                  </div>
                  
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Congratulations 🎉</h3>
                  <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium">
                    {displayRole === "seller" 
                      ? "You have successfully completed your profile. Now you can list your products and reach more students!"
                      : "You have successfully completed your profile and verified your identity. You can now start shopping!"}
                  </p>
                  
                  <button 
                    onClick={() => {
                      setShowCongratsModal(false);
                    }}
                    className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-emerald-200 dark:shadow-emerald-900/20 hover:bg-emerald-700 transition-all active:scale-[0.98]"
                  >
                    {displayRole === "seller" ? "Start Listing Products" : "Start Shopping"}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        <form onSubmit={handleUpdate} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl text-red-600 dark:text-red-400 text-xs font-bold">
              {error}
            </div>
          )}
          {success && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl text-emerald-600 dark:text-emerald-400 text-xs font-bold">
              Profile updated successfully!
            </div>
          )}

          {activeSection === "personal" && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-200 uppercase tracking-widest ml-1">Email Address (Read-only)</label>
                <div className="relative">
                  <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="email"
                    value={user.email}
                    readOnly
                    className="w-full h-14 pl-12 pr-6 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none transition-all text-slate-500 dark:text-slate-300 cursor-not-allowed italic font-medium"
                  />
                </div>
              </div>

              {(displayRole === "seller" || displayRole === "both" || displayRole === "admin") && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-200 uppercase tracking-widest ml-1">Business / Store Name</label>
                  <div className="relative">
                    <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Acme Hair Dressing, Mama Cass, Apple Shop"
                      className="w-full h-14 pl-12 pr-6 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:border-purple-500 outline-none transition-all text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-200 uppercase tracking-widest ml-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full h-14 pl-12 pr-6 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:border-purple-500 outline-none transition-all text-slate-900 dark:text-white"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-200 uppercase tracking-widest ml-1">Username</label>
              <div className="relative">
                <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full h-14 pl-12 pr-6 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:border-purple-500 outline-none transition-all text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-200 uppercase tracking-widest ml-1">Gender</label>
            <div className="grid grid-cols-3 gap-2">
              {["male", "female", "other"].map((g, gIdx) => (
                <button
                  key={`gender-${g}-${gIdx}`}
                  type="button"
                  onClick={() => setGender(g as any)}
                  className={cn(
                    "h-14 rounded-2xl text-xs font-bold capitalize transition-all border",
                    gender === g 
                      ? "bg-purple-600 text-white border-purple-600 shadow-md" 
                      : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-purple-200"
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-200 uppercase tracking-widest ml-1">Business Phone</label>
              <div className="flex gap-2">
                <select 
                  value={phonePrefix}
                  onChange={(e) => setPhonePrefix(e.target.value)}
                  className="w-24 h-14 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:bg-white dark:focus:bg-slate-900 outline-none transition-all text-slate-900 dark:text-white text-xs font-bold"
                >
                  {PHONE_PREFIXES.map((p, pIdx) => (
                    <option key={`phone-prefix-${p.code}-${pIdx}`} value={p.code} className="bg-white dark:bg-slate-900">{p.code} ({p.country})</option>
                  ))}
                </select>
                <div className="relative flex-1">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    value={businessPhone}
                    onChange={(e) => setBusinessPhone(e.target.value)}
                    className="w-full h-14 pl-12 pr-6 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:border-purple-500 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                    placeholder="8012345678"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-200 uppercase tracking-widest ml-1">Country</label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full h-14 pl-12 pr-6 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:border-purple-500 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                  placeholder="e.g. Nigeria"
                />
              </div>
            </div>
            <div className="space-y-2 relative">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-200 uppercase tracking-widest ml-1">State</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <button
                  type="button"
                  onClick={() => setIsStateDropdownOpen(!isStateDropdownOpen)}
                  className="w-full h-14 pl-12 pr-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:border-purple-500 outline-none transition-all text-left font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between"
                >
                  <span className="truncate">{state || "Select State"}</span>
                  <ChevronDown className={cn("w-5 h-5 text-slate-400 transition-transform", isStateDropdownOpen && "rotate-180")} />
                </button>
              </div>

              <AnimatePresence>
                {isStateDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-[140]" onClick={() => setIsStateDropdownOpen(false)} />
                    <motion.div
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       exit={{ opacity: 0, y: 10 }}
                       className="absolute left-0 right-0 top-full mt-2 z-[150] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-80"
                    >
                      <div className="p-4 border-b border-slate-50 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input 
                            type="text"
                            placeholder="Search states..."
                            value={stateSearch}
                            onChange={(e) => setStateSearch(e.target.value)}
                            className="w-full h-10 pl-9 pr-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:border-purple-500 outline-none transition-all"
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="overflow-y-auto flex-1">
                        {NIGERIAN_STATES.filter(s => s.toLowerCase().includes(stateSearch.toLowerCase())).map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => {
                              setState(s);
                              setCity("");
                              setIsStateDropdownOpen(false);
                              setStateSearch("");
                            }}
                            className={cn(
                              "w-full px-6 py-4 text-left text-sm font-bold transition-all hover:bg-slate-50 dark:hover:bg-slate-800",
                              state === s ? "text-purple-600 bg-purple-50 dark:bg-purple-950/10" : "text-slate-600 dark:text-slate-400"
                            )}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            <div className="space-y-2 relative">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-200 uppercase tracking-widest ml-1">City</label>
              <div className="relative">
                <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <button
                  type="button"
                  disabled={!state}
                  onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
                  className="w-full h-14 pl-12 pr-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:border-purple-500 outline-none transition-all text-left font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between disabled:opacity-50"
                >
                  <span className="truncate">{city || (state ? "Select City" : "Select State First")}</span>
                  <ChevronDown className={cn("w-5 h-5 text-slate-400 transition-transform", isCityDropdownOpen && "rotate-180")} />
                </button>
              </div>

              <AnimatePresence>
                {isCityDropdownOpen && state && (
                  <>
                    <div className="fixed inset-0 z-[140]" onClick={() => setIsCityDropdownOpen(false)} />
                    <motion.div
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       exit={{ opacity: 0, y: 10 }}
                       className="absolute left-0 right-0 top-full mt-2 z-[150] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-80"
                    >
                      <div className="p-4 border-b border-slate-50 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input 
                            type="text"
                            placeholder="Search cities..."
                            value={citySearch}
                            onChange={(e) => setCitySearch(e.target.value)}
                            className="w-full h-10 pl-9 pr-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:border-purple-500 outline-none transition-all"
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="overflow-y-auto flex-1">
                        {STATE_CITIES[state]?.filter(c => c.toLowerCase().includes(citySearch.toLowerCase())).map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => {
                              setCity(c);
                              setIsCityDropdownOpen(false);
                              setCitySearch("");
                            }}
                            className={cn(
                              "w-full px-6 py-4 text-left text-sm font-bold transition-all hover:bg-slate-50 dark:hover:bg-slate-800",
                              city === c ? "text-purple-600 bg-purple-50 dark:bg-purple-950/10" : "text-slate-600 dark:text-slate-400"
                            )}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-200 uppercase tracking-widest ml-1">Location</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full h-14 pl-12 pr-16 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:border-purple-500 outline-none transition-all text-slate-900 dark:text-white"
                placeholder="Your city or specific location"
              />
              <button
                type="button"
                onClick={handleGetLocation}
                disabled={isDetectingLocation}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-all shadow-sm disabled:opacity-50"
                title="Get current location"
              >
                {isDetectingLocation ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeSection === "campus" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-200 uppercase tracking-widest ml-1">
                {displayRole === "seller" ? "Shop/Business Address" : "Delivery Address"}
              </label>
              <div className="relative">
                <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full h-14 pl-12 pr-6 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:border-purple-500 outline-none transition-all text-slate-900 dark:text-white font-bold placeholder:text-slate-400"
                  placeholder={displayRole === "seller" ? "Enter your shop or business address" : "Enter your full home delivery address"}
                />
              </div>
            </div>

            {displayRole === "seller" && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-200 uppercase tracking-widest ml-1">
                  States & Places you deliver to
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
                  <textarea 
                    value={deliveryLocations}
                    onChange={(e) => setDeliveryLocations(e.target.value)}
                    className="w-full min-h-[56px] pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:border-purple-500 outline-none transition-all text-slate-900 dark:text-white resize-none font-bold"
                    placeholder="e.g. Lagos (Ikeja, Yaba), Abuja, etc."
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2 relative">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-200 uppercase tracking-widest ml-1">Tertiary Institution Type</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SCHOOL_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setSchoolType(type);
                    setSchoolName("");
                  }}
                  className={cn(
                    "h-14 rounded-2xl text-[10px] font-bold capitalize transition-all border",
                    schoolType === type 
                      ? "bg-purple-600 text-white border-purple-600 shadow-md" 
                      : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-purple-200"
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 relative">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-200 uppercase tracking-widest ml-1">School</label>
            <div className="relative">
              <School className={cn("absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors", schoolType ? "text-slate-400" : "text-slate-200 dark:text-slate-700")} />
              <button
                type="button"
                disabled={!schoolType}
                onClick={() => setIsSchoolDropdownOpen(!isSchoolDropdownOpen)}
                className={cn(
                  "w-full h-14 pl-12 pr-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none transition-all text-left font-bold flex items-center justify-between",
                  schoolType 
                    ? "focus:bg-white dark:focus:bg-slate-900 focus:border-purple-500 text-slate-700 dark:text-slate-300" 
                    : "opacity-50 cursor-not-allowed text-slate-400 dark:text-slate-600"
                )}
              >
                <span className="truncate">
                  {!schoolType ? "Select Institution Type first" : (schoolName || "Select your school")}
                </span>
                <ChevronDown className={cn("w-5 h-5 text-slate-400 transition-transform", isSchoolDropdownOpen && "rotate-180")} />
              </button>
            </div>

            <AnimatePresence>
              {isSchoolDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-[140]" onClick={() => setIsSchoolDropdownOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute left-0 right-0 top-full mt-2 z-[150] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-80"
                  >
                    <div className="p-4 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                          autoFocus
                          placeholder="Search school..."
                          value={schoolSearch}
                          onChange={(e) => setSchoolSearch(e.target.value)}
                          className="w-full h-10 pl-10 pr-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:border-purple-500 outline-none transition-all text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                    <div className="overflow-y-auto flex-grow">
                      {filteredSchools.length > 0 ? (
                        filteredSchools.map((s, idx) => (
                          <button
                            key={`${s.name}-${s.state}-${s.ownership}-${idx}`}
                            type="button"
                            onClick={() => {
                              setSchoolName(s.name);
                              setIsSchoolDropdownOpen(false);
                            }}
                            className={cn(
                              "w-full px-6 py-4 text-left text-sm font-bold transition-colors hover:bg-purple-50 dark:hover:bg-purple-950/20",
                              schoolName === s.name ? "text-purple-600 bg-purple-50/50 dark:bg-purple-950/20" : "text-slate-600 dark:text-slate-400"
                            )}
                          >
                            <div className="flex flex-col">
                              <span>{s.name}</span>
                              <span className="text-[10px] text-slate-400 font-medium">{s.state} State • {s.ownership}</span>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="px-6 py-8 text-center">
                          <AlertCircle className="w-8 h-8 text-slate-200 dark:text-slate-800 mx-auto mb-2" />
                          <p className="text-xs font-bold text-slate-400 dark:text-slate-500">No schools found</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

        </div>
      )}

      {activeSection === "payment" && displayRole === "seller" && (
        <div className="space-y-6">
            <div ref={bankDetailsRef} className={cn(
              "pt-8 border-t border-slate-100 dark:border-slate-800 space-y-6 transition-all duration-500 rounded-3xl p-6",
              showPaystackInfo && "bg-purple-50/50 dark:bg-purple-950/10 ring-2 ring-purple-200 dark:ring-purple-900/30"
            )}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-purple-600" />
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white">Payment Details</h4>
                </div>
                {paystackConnected ? (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-2xl border border-emerald-100 dark:border-emerald-800/50">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Paystack Connected</span>
                    </div>
                    <button 
                      type="button"
                      onClick={handleDisconnectPaystack}
                      disabled={isConnectingPaystack}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl font-bold text-xs hover:bg-red-600 transition-all shadow-lg shadow-red-100 dark:shadow-red-900/20 disabled:opacity-50"
                    >
                      {isConnectingPaystack ? <Loader2 className="w-3 h-3 animate-spin" /> : <LogOut className="w-3 h-3" />}
                      Disconnect Account
                    </button>
                  </div>
                ) : (
                  <button 
                    type="button"
                    onClick={handleConnectPaystack}
                    disabled={isConnectingPaystack}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl font-bold text-xs hover:bg-purple-700 transition-all shadow-lg shadow-purple-100 dark:shadow-purple-900/20 disabled:opacity-50"
                  >
                    {isConnectingPaystack ? <Loader2 className="w-3 h-3 animate-spin" /> : "Connect Paystack"}
                  </button>
                )}
              </div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Provide your bank details to receive payments for your sales. We use Paystack to process all payouts securely.</p>
              
              <div className="flex flex-col gap-4 p-4 bg-purple-50 dark:bg-purple-950/10 border border-purple-100 dark:border-purple-900/20 rounded-2xl">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold text-purple-700 dark:text-purple-400 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Recommended Platform Account
                  </h5>
                  <button
                    type="button"
                    onClick={handleUsePlatformAccount}
                    className="text-[10px] font-bold text-purple-600 hover:text-purple-700 underline"
                  >
                    Use this account
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4 text-[10px]">
                  <div>
                    <p className="text-slate-400 uppercase tracking-widest mb-0.5">Account Number</p>
                    <p className="font-bold text-slate-700 dark:text-slate-200">7044371385</p>
                  </div>
                  <div>
                    <p className="text-slate-400 uppercase tracking-widest mb-0.5">Bank</p>
                    <p className="font-bold text-slate-700 dark:text-slate-200">OPay</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-slate-400 uppercase tracking-widest mb-0.5">Account Name</p>
                    <p className="font-bold text-slate-700 dark:text-slate-200">FASHINA MICHEAL</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 rounded-2xl">
                <h5 className="text-xs font-bold text-blue-700 dark:text-blue-400 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  How Payouts Work
                </h5>
                <ul className="text-[10px] text-blue-600 dark:text-blue-300 space-y-1 list-disc ml-4 font-medium">
                  <li>When a buyer pays online, SHOPIVERSITY holds the funds securely.</li>
                  <li>Once the buyer confirms delivery, the funds are added to your "Net Earnings".</li>
                  <li>You can request a payout from your Dashboard once you have a balance.</li>
                  <li>Payouts are processed within 24-48 hours to your connected bank account.</li>
                  <li>SHOPIVERSITY takes a small 5% commission to maintain the platform.</li>
                </ul>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-200 uppercase tracking-widest ml-1">Bank Name</label>
                  <div className="relative">
                    <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <div 
                      onClick={() => setIsBankDropdownOpen(!isBankDropdownOpen)}
                      className="w-full h-14 pl-12 pr-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center cursor-pointer hover:bg-white dark:hover:bg-slate-900 transition-all"
                    >
                      <span className={cn("text-sm font-bold", bankName ? "text-slate-900 dark:text-white" : "text-slate-400")}>
                        {bankName || "Select Bank"}
                      </span>
                    </div>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                    
                    <AnimatePresence>
                      {isBankDropdownOpen && (
                        <>
                          <div className="fixed inset-0 z-[90]" onClick={() => setIsBankDropdownOpen(false)} />
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute z-[100] left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden"
                          >
                            <div className="p-3 border-b border-slate-100 dark:border-slate-800">
                              <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input 
                                  autoFocus
                                  type="text"
                                  placeholder="Search bank..."
                                  value={bankSearchQuery}
                                  onChange={(e) => setBankSearchQuery(e.target.value)}
                                  className="w-full h-10 pl-10 pr-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-purple-500"
                                />
                              </div>
                            </div>
                            <div className="max-h-60 overflow-y-auto">
                              {banks.filter(b => b.name.toLowerCase().includes(bankSearchQuery.toLowerCase())).length === 0 ? (
                                <div className="p-4 text-center text-xs text-slate-400">No banks found</div>
                              ) : (
                                banks.filter(b => b.name.toLowerCase().includes(bankSearchQuery.toLowerCase())).map((bank, index) => (
                                  <div 
                                    key={`${bank.code}-${index}`}
                                    onClick={() => {
                                      setBankName(bank.name);
                                      setIsBankDropdownOpen(false);
                                      setBankSearchQuery("");
                                      setAccountName("");
                                    }}
                                    className="px-4 py-3 hover:bg-purple-50 dark:hover:bg-purple-950/20 cursor-pointer text-sm font-bold text-slate-700 dark:text-slate-300 transition-colors"
                                  >
                                    {bank.name}
                                  </div>
                                ))
                              )}
                            </div>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                  {bankName === "Other" && (
                    <input 
                      value={customBankName}
                      onChange={(e) => setCustomBankName(e.target.value)}
                      className="w-full h-14 px-6 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:border-purple-500 outline-none transition-all text-slate-900 dark:text-white font-bold"
                      placeholder="Enter bank name"
                    />
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-200 uppercase tracking-widest ml-1">Account Number</label>
                    <div className="relative">
                      <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input 
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 15))}
                        className={cn(
                          "w-full h-14 pl-12 pr-6 bg-slate-50 dark:bg-slate-800 border rounded-2xl focus:bg-white dark:focus:bg-slate-900 outline-none transition-all text-slate-900 dark:text-white",
                          accountNumber.length > 0 && (accountNumber.length < 10 || accountNumber.length > 15) && bankName !== "Other" ? "border-red-500" : "border-slate-200 dark:border-slate-700 focus:border-purple-500"
                        )}
                        placeholder="10-15 digits"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-200 uppercase tracking-widest ml-1">Account Name</label>
                    <div className="relative flex gap-2">
                      <div className="relative flex-1">
                        <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input 
                          readOnly
                          value={accountName}
                          className="w-full h-14 pl-12 pr-6 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none text-slate-900 dark:text-white font-bold"
                          placeholder="Verify to see name"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleVerifyAccount}
                        disabled={isVerifying || accountNumber.length < 10 || accountNumber.length > 15 || !bankName || bankName === "Other"}
                        className="px-6 h-14 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-xs text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-all disabled:opacity-50"
                      >
                        {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {paystackConnected && (
                <div className="pt-8 border-t border-slate-100 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Wallet className="w-5 h-5 text-purple-600" />
                      <h4 className="text-lg font-bold text-slate-900 dark:text-white">Earnings & Payouts</h4>
                    </div>
                    <div className="text-right flex gap-6">
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending</p>
                        <p className="text-sm font-bold text-slate-400">₦{pendingEarnings.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Available</p>
                        <p className="text-xl font-black text-purple-600">₦{availableBalance.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRequestPayout}
                    disabled={availableBalance < 1000}
                    className="w-full h-14 bg-brand-gradient text-white rounded-2xl font-bold text-lg shadow-lg shadow-purple-100 dark:shadow-purple-950/10 hover:shadow-purple-200 hover:-translate-y-0.5 transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    Request Payout
                  </button>

                  {payoutRequests.length > 0 && (
                    <div className="space-y-3">
                      <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Recent Requests</h5>
                      <div className="space-y-2">
                        {payoutRequests.slice(0, 3).map((request, reqIdx) => (
                          <div key={`payout-req-${request.id || reqIdx}-${reqIdx}`} className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-between">
                            <div>
                              <p className="text-sm font-bold text-slate-900 dark:text-white">₦{request.amount.toLocaleString()}</p>
                              <p className="text-[10px] text-slate-500">{new Date(request.createdAt).toLocaleDateString()}</p>
                            </div>
                            <span className={cn(
                              "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                              request.status === "pending" ? "bg-amber-50 text-amber-600" :
                              request.status === "paid" ? "bg-emerald-50 text-emerald-600" :
                              "bg-red-50 text-red-600"
                            )}>
                              {request.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeSection === "security" && (
            <div className="space-y-6">
              {displayRole !== "buyer" && (
            <div className="pt-8 border-t border-slate-100 dark:border-slate-800 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-950/20 rounded-xl flex items-center justify-center text-purple-600">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">Account Verification</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Verify your identity with an official ID to unlock all features</p>
                </div>
              </div>

              {user.isVerified ? (
              <div className="space-y-4">
                <div className="p-6 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 rounded-3xl flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center text-emerald-600">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-emerald-900 dark:text-emerald-400 font-mono">Verified Account</p>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-300 font-medium tracking-tight">Your identity has been confirmed via your ID card.</p>
                  </div>
                  <label className="p-2 bg-white dark:bg-slate-800 rounded-xl cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-950/20 text-slate-500 hover:text-purple-600 transition-all border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-2" title="Re-upload ID">
                    <input type="file" accept="image/*" onChange={handleIdUpload} className="hidden" />
                    <Upload className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Re-upload</span>
                  </label>
                </div>
                {verificationIdUrl && (
                  <div className="relative w-full h-48 rounded-2xl overflow-hidden shadow-inner bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <img src={verificationIdUrl} alt="Verified ID" className="w-full h-full object-contain" />
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-6 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-3xl">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/20 rounded-xl flex items-center justify-center text-amber-600 flex-shrink-0">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h5 className={cn(
                        "text-sm font-bold",
                        idVerificationSuccess ? "text-emerald-900 dark:text-emerald-400" : "text-amber-900 dark:text-amber-400"
                      )}>
                        {idVerificationSuccess ? "Verification Successful!" : "Not Verified Yet"}
                      </h5>
                      <p className={cn(
                        "text-[10px] font-medium leading-relaxed uppercase tracking-widest",
                        idVerificationSuccess ? "text-emerald-600 dark:text-emerald-300" : "text-amber-600 dark:text-amber-300"
                      )}>
                        {idVerificationSuccess 
                          ? "ID verified locally. Click 'Save Changes' below to finalize." 
                          : (displayRole === "seller" 
                            ? "You must verify your ID card before you can list products." 
                            : "You must verify your ID card before you can purchase products.")
                        }
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className={cn(
                      "border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer group relative overflow-hidden",
                      idVerificationError ? "border-red-200 bg-red-50 dark:bg-red-900/10" : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-purple-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                    )}>
                      <input type="file" accept="image/*" onChange={handleIdUpload} className="hidden" disabled={isVerifyingId} />
                      {isVerifyingId ? (
                        <div className="flex flex-col items-center text-center">
                          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mb-4" />
                          <p className="text-sm font-bold text-slate-600 dark:text-slate-400">Verifying your ID...</p>
                        </div>
                      ) : verificationIdUrl ? (
                        <div className="text-center w-full h-full p-4 flex flex-col items-center justify-center min-h-[200px]">
                          <img src={verificationIdUrl} alt="ID card" className="absolute inset-0 w-full h-full object-contain bg-slate-50 dark:bg-slate-900 shadow-inner" />
                          <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg absolute -top-4 -right-4 z-20">
                            <CheckCircle className="w-6 h-6" />
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleRemoveId();
                            }}
                            className="absolute bottom-4 right-4 p-2 bg-red-500 text-white rounded-xl shadow-lg hover:bg-red-600 transition-all z-30 flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Remove ID</span>
                          </button>
                        </div>
                      ) : (
                        <div className="text-center group-hover:scale-105 transition-transform duration-300">
                          <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-300 dark:text-slate-600 group-hover:text-purple-500 group-hover:bg-purple-50 dark:group-hover:bg-purple-950/20 mx-auto mb-4 transition-all">
                            <Upload className="w-8 h-8" />
                          </div>
                          <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-1">Upload Student/Gov ID</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Supports JPG, PNG, WEBP</p>
                        </div>
                      )}
                    </label>
                    {idVerificationError && (
                      <p className="text-xs text-red-500 font-bold text-center px-4 py-2 bg-red-50 dark:bg-red-900/10 rounded-xl">{idVerificationError}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          )}
        </div>
      )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full h-16 bg-brand-gradient text-white rounded-2xl font-bold text-lg shadow-lg shadow-purple-200/50 hover:shadow-purple-300/50 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Save className="w-5 h-5" /> Save Changes</>}
          </button>
        </form>
      </div>
      {/* Account Management */}
      {activeSection === "security" && (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-8 shadow-sm space-y-8 transition-colors">
        <div className="flex items-center gap-3">
          <Settings className="w-5 h-5 text-slate-400" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Account Management</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {/* Hibernate */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Moon className="w-5 h-5 text-blue-500" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Hibernate Account</h4>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Temporarily disable your account. You won't be able to sign in until the duration ends.</p>
            <div className="flex gap-2">
              <select 
                value={hibernateDuration}
                onChange={(e) => setHibernateDuration(e.target.value)}
                className="flex-1 h-12 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:border-blue-500 transition-all text-slate-900 dark:text-white"
              >
                <option value="0" className="bg-white dark:bg-slate-900">Select Duration</option>
                <option value="1d" className="bg-white dark:bg-slate-900">1 Day</option>
                <option value="3d" className="bg-white dark:bg-slate-900">3 Days</option>
                <option value="1w" className="bg-white dark:bg-slate-900">1 Week</option>
                <option value="2w" className="bg-white dark:bg-slate-900">2 Weeks</option>
                <option value="1m" className="bg-white dark:bg-slate-900">1 Month</option>
                <option value="3m" className="bg-white dark:bg-slate-900">3 Months</option>
              </select>
              <button
                onClick={() => setShowHibernateConfirm(true)}
                disabled={hibernateLoading || hibernateDuration === "0"}
                className="px-6 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all disabled:opacity-50"
              >
                {hibernateLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Hibernate"}
              </button>
            </div>
          </div>

          {/* Hibernate Confirmation Modal */}
          <AnimatePresence>
            {showHibernateConfirm && (
              <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-800 transition-colors"
                >
                  <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-500 mx-auto mb-6">
                    <Moon className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white text-center mb-2">Hibernate Account?</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6 leading-relaxed">
                    Your account and products will be hidden until the hibernation period ends. 
                    You will be signed out immediately.
                  </p>

                  <div className="flex gap-3">
                    <button 
                      onClick={() => setShowHibernateConfirm(false)}
                      disabled={hibernateLoading}
                      className="flex-1 py-4 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-all disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleHibernate}
                      disabled={hibernateLoading}
                      className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 dark:shadow-blue-900/20 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {hibernateLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Hibernate"}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Delete */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Trash2 className="w-5 h-5 text-red-500" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Delete Account</h4>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Permanently remove your account and all associated data from SHOPIVERSITY.</p>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deleteLoading}
              className="w-full h-12 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-xl font-bold text-sm hover:bg-red-100 dark:hover:bg-red-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete Permanently"}
            </button>
          </div>

          {/* Sign Out */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <LogOut className="w-5 h-5 text-purple-600" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Sign Out</h4>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Securely sign out of your SHOPIVERSITY account on this device.</p>
            <button
              onClick={() => signOut(auth)}
              className="w-full h-12 bg-purple-50 dark:bg-purple-950/10 text-purple-600 rounded-xl font-bold text-sm hover:bg-purple-100 dark:hover:bg-purple-950/20 transition-all flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out Now
            </button>
          </div>
        </div>

          {/* Delete Confirmation Modal */}
          <AnimatePresence>
            {showDeleteConfirm && (
              <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-800 transition-colors"
                >
                  <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center text-red-600 dark:text-red-500 mx-auto mb-6">
                    <Trash2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white text-center mb-2">Delete Account?</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6 leading-relaxed">
                    This action is <span className="text-red-600 font-bold">permanent</span>. 
                    All your products, orders, reviews, and profile data will be erased forever.
                  </p>

                  {deleteError && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl text-red-600 dark:text-red-400 text-xs font-bold">
                      {deleteError}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button 
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeleteError("");
                      }}
                      disabled={deleteLoading}
                      className="flex-1 py-4 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-all disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleDeleteAccount}
                      disabled={deleteLoading}
                      className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-bold text-sm hover:bg-red-700 transition-all shadow-lg shadow-red-100 dark:shadow-red-900/20 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
