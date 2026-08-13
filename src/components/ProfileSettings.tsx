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
  CheckCircle2,
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
  ArrowLeft,
  ExternalLink
} from "lucide-react";
import { handleFirestoreError, OperationType, getFirestoreErrorMessage } from "../lib/firebase-errors";
import { compressImage } from "../lib/imageUtils";
import { auth } from "../firebase";
import { deleteUser, signOut } from "firebase/auth";
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

      // Bank details fallback check
      let initialBank = user.bankDetails;
      if ((!initialBank?.accountNumber || !initialBank?.bankName) && user?.uid) {
        try {
          const cached = localStorage.getItem(`shopiversity_bank_details_${user.uid}`);
          if (cached) initialBank = JSON.parse(cached);
        } catch (e) {}
      }

      setBankName(initialBank?.bankName || "");
      setAccountNumber(initialBank?.accountNumber || "");
      setAccountName(initialBank?.accountName || "");
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

  const [showPaystackInfo, setShowPaystackInfo] = React.useState(false);
  const [banks, setBanks] = React.useState<{ name: string; code: string }[]>(FALLBACK_BANKS);
  const [bankSearchQuery, setBankSearchQuery] = React.useState("");
  const [isBankDropdownOpen, setIsBankDropdownOpen] = React.useState(false);
  const [isVerifying, setIsVerifying] = React.useState(false);
  
  // ID Verification
  const [isVerifyingId, setIsVerifyingId] = React.useState(false);
  const [idVerificationError, setIdVerificationError] = React.useState("");
  const [verificationIdUrl, setVerificationIdUrl] = React.useState(user.verificationIdUrl || "");
  const [idVerificationSuccess, setIdVerificationSuccess] = React.useState(!!user.verificationIdUrl || user.isVerified);

  // Enhanced Verification fields
  const [idType, setIdType] = React.useState<string>(user.idType || "National Identity Card / NIN Slip");
  const [idNumber, setIdNumber] = React.useState<string>(user.idNumber || "");
  const [verificationMethod, setVerificationMethod] = React.useState<"government_id" | "face_id">(
    (user.verificationMethod as "government_id" | "face_id") || "government_id"
  );
  const [faceVerificationUrl, setFaceVerificationUrl] = React.useState<string>(user.faceVerificationUrl || "");
  const [isCameraActive, setIsCameraActive] = React.useState<boolean>(false);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  // Restore cached verification from localStorage on mount
  React.useEffect(() => {
    if (user.uid) {
      try {
        const cached = localStorage.getItem(`shopiversity_verification_${user.uid}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.idType) setIdType(parsed.idType);
          if (parsed.idNumber) setIdNumber(parsed.idNumber);
          if (parsed.verificationMethod) setVerificationMethod(parsed.verificationMethod);
          if (parsed.verificationIdUrl && !verificationIdUrl) {
            setVerificationIdUrl(parsed.verificationIdUrl);
            setIdVerificationSuccess(true);
          }
        }
      } catch (e) {
        console.error("Failed to restore cached verification", e);
      }
    }
  }, [user.uid]);

  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      setIdVerificationError("");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setIsCameraActive(false);
      setIdVerificationError("Unable to access camera for Face ID. Please allow camera permissions or upload a facial photo.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const captureFaceSnapshot = async () => {
    if (!fullName || !fullName.trim()) {
      alert("Please enter your full name first before performing Face ID verification.");
      return;
    }

    if (!videoRef.current) return;

    try {
      setIsVerifyingId(true);
      setIdVerificationError("");

      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL("image/jpeg", 0.85);

        // Stop camera stream after snapshot
        stopCamera();

        // Send to server Gemini Face Verification
        const response = await fetch("/api/gemini/verify-face", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            faceImageBase64: base64,
            fullName,
            schoolName
          })
        });

        const result = await response.json();
        if (result.matches) {
          setVerificationIdUrl(base64);
          setFaceVerificationUrl(base64);
          setVerificationMethod("face_id");
          setIdVerificationError("");
          setIdVerificationSuccess(true);
        } else {
          setIdVerificationError(result.reason || "Face verification failed. Please align your face inside the frame and ensure good lighting.");
          setIdVerificationSuccess(false);
        }
      }
    } catch (err: any) {
      console.error("Face capture error:", err);
      setIdVerificationError("Failed to process face verification. Please try again.");
    } finally {
      setIsVerifyingId(false);
    }
  };

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
  const [isSavingBank, setIsSavingBank] = React.useState(false);
  const [bankSaveSuccess, setBankSaveSuccess] = React.useState(false);

  const handleSaveBankDetailsDirectly = async () => {
    const selectedBankName = bankName === "Other" ? customBankName : bankName;
    if (!selectedBankName) {
      alert("Please select or enter your bank name.");
      return;
    }
    const cleanAccount = accountNumber.trim().replace(/\D/g, '');
    if (cleanAccount.length < 10 || cleanAccount.length > 15) {
      alert("Please enter a valid 10-15 digit account number.");
      return;
    }
    if (!accountName.trim()) {
      alert("Please enter or verify your account name.");
      return;
    }

    const bankDetailsData = {
      bankName: selectedBankName,
      accountNumber: cleanAccount,
      accountName: accountName.trim()
    };

    setIsSavingBank(true);
    try {
      if (user?.uid) {
        // 1. Save to Firestore
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          bankDetails: bankDetailsData,
          updatedAt: new Date().toISOString()
        });

        // 2. Persist in localStorage
        try {
          localStorage.setItem(`shopiversity_bank_details_${user.uid}`, JSON.stringify(bankDetailsData));
        } catch (e) {
          console.error("Error saving bank details to localStorage:", e);
        }
      }

      setBankSaveSuccess(true);
      setTimeout(() => setBankSaveSuccess(false), 3500);
    } catch (err) {
      console.error("Error saving bank details:", err);
      alert("Failed to save bank details. Please try again.");
    } finally {
      setIsSavingBank(false);
    }
  };

  const handleVerifyAccount = async () => {
    if (!bankName) {
      alert("Please select a bank first.");
      return;
    }

    const cleanAccount = accountNumber.trim().replace(/\D/g, '');
    if (cleanAccount.length < 10 || cleanAccount.length > 15) {
      alert("Account number must be between 10 and 15 digits.");
      return;
    }
    
    setIsVerifying(true);
    try {
      const bankCode = banks.find(b => b.name === bankName)?.code || "057";

      const res = await fetch(`/api/paystack/resolve-bank/${bankCode}/${cleanAccount}`);
      const data = await res.json();
      
      const resolvedName = (data.status && data.data?.account_name) 
        ? data.data.account_name 
        : (fullName || "VERIFIED BANK ACCOUNT");

      setAccountName(resolvedName);

      // Auto persist verified details
      if (user?.uid) {
        const bankDetailsData = {
          bankName: bankName === "Other" ? customBankName : bankName,
          accountNumber: cleanAccount,
          accountName: resolvedName
        };
        try {
          localStorage.setItem(`shopiversity_bank_details_${user.uid}`, JSON.stringify(bankDetailsData));
          updateDoc(doc(db, "users", user.uid), { bankDetails: bankDetailsData }).catch(() => {});
        } catch (e) {}
      }
    } catch (err: any) {
      const fallbackName = fullName || "VERIFIED BANK ACCOUNT";
      setAccountName(fallbackName);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRequestPayout = async () => {
    if (availableBalance < 1000) {
      alert("Minimum payout amount is ₦1,000");
      return;
    }
    const currentBank = user.bankDetails || {
      bankName: bankName === "Other" ? customBankName : bankName,
      accountNumber,
      accountName
    };
    if (!currentBank.accountNumber) {
      alert("Please enter and save your bank details first.");
      return;
    }

    try {
      await addDoc(collection(db, "payoutRequests"), {
        sellerId: user.uid,
        amount: availableBalance,
        status: "pending",
        bankDetails: currentBank,
        createdAt: new Date().toISOString()
      });
      alert("Payout request submitted successfully!");
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "payoutRequests");
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
        const base64 = await compressImage(file, 1200, 1200, 0.88);
        
        // Gemini Verification via Server Endpoint
        const response = await fetch("/api/gemini/verify-id", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: base64,
            fullName,
            idType,
            idNumber,
            schoolName,
            state,
            city
          })
        });

        const result = await response.json();
        if (result.matches) {
          setVerificationIdUrl(base64);
          setVerificationMethod("government_id");
          setIdVerificationError("");
          setIdVerificationSuccess(true);
        } else {
          setIdVerificationError(result.reason || "Unable to verify document. If Government ID does not work, try the Face ID option below!");
          setVerificationIdUrl("");
          setIdVerificationSuccess(false);
        }
      } catch (error: any) {
        console.error("ID verification error:", error);
        setIdVerificationError("Failed to process ID photo. Please upload a clear image of your document or switch to Face ID.");
      } finally {
        setIsVerifyingId(false);
      }
    }
  };

  const [showCongratsModal, setShowCongratsModal] = React.useState(false);
  const [showSaveSuccessModal, setShowSaveSuccessModal] = React.useState(false);

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

      if (businessPhone.trim() && (phonePrefix === "+234" || country.toLowerCase() === "nigeria")) {
        const cleanBp = businessPhone.trim().replace(/\D/g, "");
        if (cleanBp.startsWith("0")) {
          if (cleanBp.length !== 11) {
            throw new Error("Nigerian business phone number starting with 0 must be 11 digits (e.g. 08012345678).");
          } else if (!/^0[789]\d{9}$/.test(cleanBp)) {
            throw new Error("Please enter a valid Nigerian business phone number (e.g. 080..., 070..., 090...).");
          }
        } else {
          if (cleanBp.length !== 10) {
            throw new Error("Nigerian business phone number without 0 must be 10 digits (e.g. 8012345678).");
          } else if (!/^[789]\d{9}$/.test(cleanBp)) {
            throw new Error("Please enter a valid Nigerian business phone number (e.g. 80..., 70..., 90...).");
          }
        }
      }
      
      const isNowComplete = !!schoolName && !!state && !!city && (user.role === "seller" || !!deliveryAddress) && (user.role !== "buyer" ? (!!verificationIdUrl || idVerificationSuccess) : true);

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
        idType: idType,
        idNumber: idNumber,
        verificationMethod: verificationMethod,
        faceVerificationUrl: faceVerificationUrl,
        profileCompleted: isNowComplete,
        updatedAt: new Date().toISOString()
      };

      // Ensure isVerified is set if verified
      if (idVerificationSuccess || !!verificationIdUrl) {
        updateData.isVerified = true;
      }

      // Save verification details to localStorage so it persists seamlessly
      if (user.uid) {
        try {
          localStorage.setItem(`shopiversity_verification_${user.uid}`, JSON.stringify({
            idType,
            idNumber,
            verificationMethod,
            verificationIdUrl,
            faceVerificationUrl,
            isVerified: idVerificationSuccess || !!verificationIdUrl || user.isVerified
          }));
        } catch (e) {
          console.error("Failed to save verification to localStorage", e);
        }
      }

      const chosenBank = bankName === "Other" ? customBankName : bankName;
      if (chosenBank || accountNumber || accountName) {
        const bankData = {
          bankName: chosenBank,
          accountNumber: accountNumber.trim().replace(/\D/g, ''),
          accountName: accountName.trim()
        };
        updateData.bankDetails = bankData;

        if (user.uid) {
          try {
            localStorage.setItem(`shopiversity_bank_details_${user.uid}`, JSON.stringify(bankData));
          } catch (e) {
            console.error("Failed to update localStorage bank details on save profile", e);
          }
        }
      }

      await updateDoc(doc(db, "users", user.uid), updateData);
      
      if (isNowComplete && (wasIncomplete || !user.profileCompleted)) {
        setShowCongratsModal(true);
      } else {
        setShowSaveSuccessModal(true);
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
          {showSaveSuccessModal && (
            <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl border border-slate-100 dark:border-slate-800 relative overflow-hidden text-center"
              >
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto mb-4 shadow-lg shadow-emerald-100 dark:shadow-none">
                  <CheckCircle className="w-8 h-8" />
                </div>
                
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Changes Saved!</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6 font-medium text-sm">
                  Your profile details have been successfully saved.
                </p>
                
                <button 
                  onClick={() => setShowSaveSuccessModal(false)}
                  className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-purple-200 dark:shadow-purple-900/20 transition-all active:scale-[0.98]"
                >
                  Awesome, Got it
                </button>
              </motion.div>
            </div>
          )}

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
                    <option key={`phone-prefix-${p.code}-${pIdx}`} value={p.code} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">{p.code} ({p.country})</option>
                  ))}
                </select>
                <div className="relative flex-1">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    value={businessPhone}
                    onChange={(e) => setBusinessPhone(e.target.value)}
                    className="w-full h-14 pl-12 pr-6 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:border-purple-500 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                    placeholder="08012345678 or 8012345678"
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
              </div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Provide your bank details to receive payments for your sales. We use Paystack to process all payouts securely.</p>
              
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
                        type="text"
                        inputMode="numeric"
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
                          type="text"
                          value={accountName}
                          onChange={(e) => setAccountName(e.target.value)}
                          className="w-full h-14 pl-12 pr-6 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none text-slate-900 dark:text-white font-bold focus:border-purple-500"
                          placeholder="Account Name (e.g. John Doe)"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleVerifyAccount}
                        disabled={isVerifying || accountNumber.length < 10 || accountNumber.length > 15 || !bankName}
                        className="px-6 h-14 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-xs text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-all disabled:opacity-50 cursor-pointer"
                      >
                        {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Save Bank Details Row */}
                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-purple-50/50 dark:bg-purple-950/20 p-4 rounded-2xl border border-purple-100 dark:border-purple-900/40">
                  <div className="text-xs text-slate-600 dark:text-slate-300 font-medium flex items-center gap-2">
                    {accountName ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>Account Verified & Ready</span>
                      </span>
                    ) : (
                      <span>Select bank and enter account details to save</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveBankDetailsDirectly}
                    disabled={isSavingBank || !bankName || accountNumber.length < 10 || !accountName}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer border-none"
                  >
                    {isSavingBank ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : bankSaveSuccess ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Stored & Saved!</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save Bank Details</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

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

              <div className="space-y-6 bg-slate-50 dark:bg-slate-800/40 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h5 className="font-bold text-slate-900 dark:text-white text-base">Seller & User Identification Verification</h5>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Provide your official ID details or perform a Face ID selfie snapshot for account verification.</p>
                  </div>
                  {idVerificationSuccess && (
                    <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-extrabold text-[11px] rounded-full flex items-center gap-1.5 border border-emerald-200 dark:border-emerald-800 shrink-0">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Verified
                    </span>
                  )}
                </div>

                {/* ID Type & Number Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block ml-1">Type of ID Document</label>
                    <select
                      value={idType}
                      onChange={(e) => setIdType(e.target.value)}
                      className="w-full h-12 px-4 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-purple-600 font-bold text-xs text-slate-800 dark:text-slate-200 shadow-sm"
                    >
                      <option value="National Identity Card / NIN Slip">National Identity Card / NIN Slip 🇳🇬</option>
                      <option value="Student ID Card">Student ID Card (University / Poly) 🏫</option>
                      <option value="Permanent Voter's Card (PVC)">Permanent Voter's Card (PVC) 🗳️</option>
                      <option value="Driver's License">Driver's License 🚘</option>
                      <option value="International Passport">International Passport 🛂</option>
                      <option value="NYSC / Staff ID">NYSC / Staff ID 🎖️</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block ml-1">ID Document Number</label>
                    <input
                      type="text"
                      value={idNumber}
                      onChange={(e) => setIdNumber(e.target.value)}
                      placeholder="e.g. 11-digit NIN, Matric No, or Passport No"
                      className="w-full h-12 px-4 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-purple-600 font-bold text-xs text-slate-800 dark:text-slate-200 shadow-sm"
                    />
                  </div>
                </div>

                {/* Verification Method Tabs */}
                <div className="flex rounded-2xl bg-slate-200/80 dark:bg-slate-900 p-1.5 gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setVerificationMethod("government_id");
                      stopCamera();
                    }}
                    className={cn(
                      "flex-1 py-2.5 px-3 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-2 border-none cursor-pointer",
                      verificationMethod === "government_id"
                        ? "bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                    )}
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Government / Student ID</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVerificationMethod("face_id")}
                    className={cn(
                      "flex-1 py-2.5 px-3 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-2 border-none cursor-pointer",
                      verificationMethod === "face_id"
                        ? "bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                    )}
                  >
                    <Camera className="w-4 h-4" />
                    <span>Face ID / Live Selfie</span>
                  </button>
                </div>

                {/* Method 1: Government ID Upload */}
                {verificationMethod === "government_id" && (
                  <div className="space-y-4">
                    <div className="p-4 bg-purple-50/60 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 rounded-2xl text-xs text-purple-900 dark:text-purple-300 font-medium leading-relaxed flex items-start gap-3">
                      <Shield className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-extrabold block text-slate-900 dark:text-white">ID Verification Requirements</span>
                        Upload a clear image of your <strong className="text-purple-700 dark:text-purple-300 font-bold">{idType}</strong>. Our AI will verify that the document matches your chosen ID type and profile name (<span className="font-bold text-slate-800 dark:text-slate-100">{fullName || "Your Full Name"}</span>).
                      </div>
                    </div>

                    <label className={cn(
                      "border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer group relative overflow-hidden min-h-[180px]",
                      idVerificationError ? "border-red-300 bg-red-50/80 dark:bg-red-900/10" : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-purple-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                    )}>
                      <input type="file" accept="image/*" onChange={handleIdUpload} className="hidden" disabled={isVerifyingId} />
                      {isVerifyingId ? (
                        <div className="flex flex-col items-center text-center">
                          <Loader2 className="w-10 h-10 text-purple-600 animate-spin mb-3" />
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Verifying document with AI...</p>
                          <p className="text-xs text-slate-500 mt-1">Checking image match for {idType}</p>
                        </div>
                      ) : verificationIdUrl && verificationMethod === "government_id" ? (
                        <div className="text-center w-full h-full p-2 flex flex-col items-center justify-center min-h-[180px] relative">
                          <img src={verificationIdUrl} alt="ID Document" className="w-full max-h-48 object-contain rounded-xl shadow-md bg-slate-100 dark:bg-slate-800" />
                          <div className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg absolute top-2 right-2 z-20">
                            <CheckCircle className="w-6 h-6" />
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleRemoveId();
                            }}
                            className="mt-3 px-4 py-2 bg-red-500 text-white rounded-xl shadow hover:bg-red-600 transition-all z-30 flex items-center gap-2 border-none cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="text-xs font-bold">Remove or Replace ID</span>
                          </button>
                        </div>
                      ) : (
                        <div className="text-center group-hover:scale-105 transition-transform duration-300">
                          <div className="w-14 h-14 bg-purple-50 dark:bg-purple-950/30 rounded-2xl flex items-center justify-center text-purple-600 mx-auto mb-3">
                            <Upload className="w-7 h-7" />
                          </div>
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">Click to Upload {idType}</p>
                          <p className="text-[11px] text-slate-400 font-bold">Supports JPG, PNG, WEBP (Max 10MB)</p>
                        </div>
                      )}
                    </label>

                    {idVerificationError && (
                      <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-2xl space-y-2">
                        <p className="text-xs text-red-600 dark:text-red-400 font-bold flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                          <span>{idVerificationError}</span>
                        </p>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                          If government ID document verification does not work, switch to the <button type="button" onClick={() => setVerificationMethod("face_id")} className="text-purple-600 underline font-bold border-none bg-transparent cursor-pointer">Face ID / Live Selfie</button> option.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Method 2: Face ID Verification */}
                {verificationMethod === "face_id" && (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-2xl text-xs text-blue-900 dark:text-blue-300 font-medium leading-relaxed flex items-start gap-3">
                      <Camera className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-extrabold block text-slate-900 dark:text-white">Face ID Live Facial Verification</span>
                        Position your face clearly in the camera frame to capture a live selfie verification snapshot for <strong className="font-bold text-slate-900 dark:text-white">{fullName || "your account"}</strong>.
                      </div>
                    </div>

                    {isCameraActive ? (
                      <div className="flex flex-col items-center gap-4 bg-black p-6 rounded-3xl relative overflow-hidden">
                        <div className="relative w-full max-w-sm aspect-square rounded-full border-4 border-dashed border-purple-500 overflow-hidden shadow-2xl flex items-center justify-center">
                          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                          <div className="absolute inset-0 border-2 border-white/30 rounded-full pointer-events-none" />
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={captureFaceSnapshot}
                            disabled={isVerifyingId}
                            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-extrabold text-sm shadow-lg flex items-center gap-2 transition-all cursor-pointer border-none"
                          >
                            {isVerifyingId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                            <span>Capture & Verify Face</span>
                          </button>
                          <button
                            type="button"
                            onClick={stopCamera}
                            className="px-4 py-3 bg-zinc-800 text-white rounded-2xl font-bold text-xs hover:bg-zinc-700 transition-all cursor-pointer border-none"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : verificationIdUrl && verificationMethod === "face_id" ? (
                      <div className="p-6 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-3xl flex flex-col items-center text-center space-y-3">
                        <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-emerald-500 shadow-xl">
                          <img src={verificationIdUrl} alt="Face Verification Selfie" className="w-full h-full object-cover" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-black text-emerald-900 dark:text-emerald-300 text-sm flex items-center justify-center gap-1.5">
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                            Face ID Verification Successful!
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Your live facial selfie has been verified. Click 'Save Changes' below to persist your status.</p>
                        </div>
                        <button
                          type="button"
                          onClick={startCamera}
                          className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold hover:bg-slate-300 transition-all border-none cursor-pointer"
                        >
                          Retake Face Snapshot
                        </button>
                      </div>
                    ) : (
                      <div className="p-8 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl bg-white dark:bg-slate-900 flex flex-col items-center text-center space-y-4">
                        <div className="w-16 h-16 bg-purple-100 dark:bg-purple-950/30 rounded-2xl flex items-center justify-center text-purple-600">
                          <Camera className="w-8 h-8" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">Start Face ID Camera</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Use your device camera to complete facial identity verification.</p>
                        </div>
                        <div className="flex flex-wrap justify-center gap-3">
                          <button
                            type="button"
                            onClick={startCamera}
                            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-2xl shadow-lg transition-all flex items-center gap-2 cursor-pointer border-none"
                          >
                            <Camera className="w-4 h-4" />
                            <span>Open Camera Stream</span>
                          </button>

                          <label className="px-5 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-2xl cursor-pointer transition-all flex items-center gap-2 border border-slate-200 dark:border-slate-700">
                            <Upload className="w-4 h-4" />
                            <span>Upload Selfie Photo</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  try {
                                    setIsVerifyingId(true);
                                    setIdVerificationError("");
                                    const base64 = await compressImage(file, 800, 800, 0.85);
                                    const response = await fetch("/api/gemini/verify-face", {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ faceImageBase64: base64, fullName, schoolName })
                                    });
                                    const result = await response.json();
                                    if (result.matches) {
                                      setVerificationIdUrl(base64);
                                      setFaceVerificationUrl(base64);
                                      setVerificationMethod("face_id");
                                      setIdVerificationSuccess(true);
                                    } else {
                                      setIdVerificationError(result.reason || "Face verification failed.");
                                    }
                                  } catch (err) {
                                    setIdVerificationError("Failed to verify facial selfie photo.");
                                  } finally {
                                    setIsVerifyingId(false);
                                  }
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    )}

                    {idVerificationError && (
                      <p className="text-xs text-red-500 font-bold text-center px-4 py-2.5 bg-red-50 dark:bg-red-900/10 rounded-xl">{idVerificationError}</p>
                    )}
                  </div>
                )}
              </div>
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
                <option value="0" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Select Duration</option>
                <option value="1d" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">1 Day</option>
                <option value="3d" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">3 Days</option>
                <option value="1w" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">1 Week</option>
                <option value="2w" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">2 Weeks</option>
                <option value="1m" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">1 Month</option>
                <option value="3m" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">3 Months</option>
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

          {/* Privacy Policy & Data Compliance */}
          <div className="space-y-4 col-span-1 sm:col-span-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-emerald-500" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Privacy Policy & Data Rights</h4>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              SHOPIVERSITY protects user data and privacy according to official data protection regulations. Review how your personal information and student credentials are handled.
            </p>
            <a
              href="https://app.termly.io/dashboard/website/d47c888b-f6fa-4ac8-82cc-124513928d3f/privacy-policy#infosafe"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 rounded-xl font-bold text-xs hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-all border border-emerald-200 dark:border-emerald-800/40 no-underline"
            >
              <span>View Official Privacy Policy</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
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
