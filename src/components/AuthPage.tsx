import React from "react";
import { auth, db, googleProvider } from "../firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  browserPopupRedirectResolver
} from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc, collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { motion, AnimatePresence } from "motion/react";
import { 
  User, 
  Mail, 
  Lock, 
  Phone, 
  AtSign, 
  CheckCircle2,
  Search,
  Building,
  Navigation,
  Upload,
  ArrowRight,
  ArrowLeft,
  ChevronLeft,
  ChevronDown,
  MapPin,
  Store,
  ShoppingBag,
  Eye,
  EyeOff,
  XCircle,
  Loader2,
  FileText,
  Users,
  Home
} from "lucide-react";
import Logo from "./Logo";
import { cn, generateReferralCode } from "../lib/utils";
import { UserProfile, Notification } from "../types";
import { handleFirestoreError, OperationType, getFirestoreErrorMessage } from "../lib/firebase-errors";
import { compressImage } from "../lib/imageUtils";
import { SCHOOL_TYPES, NIGERIAN_SCHOOLS } from "../constants/schools";
import { NIGERIAN_STATES, STATE_CITIES } from "../constants/locations";
import TermsAndConditions from "./TermsAndConditions";

export default function AuthPage({ initialNeedsProfile = false }: { initialNeedsProfile?: boolean }) {
  const [isLogin, setIsLogin] = React.useState(!initialNeedsProfile);
  const [role, setRole] = React.useState<"buyer" | "seller">("buyer");
  const [step, setStep] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (initialNeedsProfile) {
      setIsLogin(false);
      setError("Your account exists but your profile is missing. Please complete the form below to continue.");
      
      if (auth.currentUser) {
        setFullName(auth.currentUser.displayName || "");
        setEmail(auth.currentUser.email || "");
        if (auth.currentUser.email) {
          const prefix = auth.currentUser.email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
          setUsername(`${prefix}${Math.floor(1000 + Math.random() * 9000)}`);
        }
      }
    }
  }, [initialNeedsProfile]);

  // Form fields
  const [fullName, setFullName] = React.useState("");
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");

  React.useEffect(() => {
    if (firstName || lastName) {
      setFullName(`${firstName} ${lastName}`.trim());
    }
  }, [firstName, lastName]);
  const [username, setUsername] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [state, setState] = React.useState("");
  const [city, setCity] = React.useState("");
  const [stateSearch, setStateSearch] = React.useState("");
  const [isStateDropdownOpen, setIsStateDropdownOpen] = React.useState(false);
  const [deliveryAddress, setDeliveryAddress] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [phonePrefix, setPhonePrefix] = React.useState("+234");
  const [gender, setGender] = React.useState<"male" | "female" | "other">("male");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [signupSuccess, setSignupSuccess] = React.useState(false);
  const [showTerms, setShowTerms] = React.useState(false);
  const [showTermsPage, setShowTermsPage] = React.useState(false);
  const [isVerifyingId, setIsVerifyingId] = React.useState(false);
  const [idVerificationError, setIdVerificationError] = React.useState("");

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
      await sendPasswordResetEmail(auth, resetEmail.trim());
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
  
  // Verification states
  const [isVerifyingEmail, setIsVerifyingEmail] = React.useState(false);
  const [isVerifyingPhone, setIsVerifyingPhone] = React.useState(false);
  const [isVerificationChoice, setIsVerificationChoice] = React.useState(false);
  const [isVerificationSuccess, setIsVerificationSuccess] = React.useState(false);
  const [verificationMethod, setVerificationMethod] = React.useState<"email" | "phone" | null>(null);
  const [generatedCode, setGeneratedCode] = React.useState("");
  const [verificationInput, setVerificationInput] = React.useState("");
  const [isEmailVerified, setIsEmailVerified] = React.useState(false);
  const [resendingCode, setResendingCode] = React.useState(false);
  const [isGoogleSellerVerifying, setIsGoogleSellerVerifying] = React.useState(false);

  // School details
  const [schoolType, setSchoolType] = React.useState("");
  const [schoolName, setSchoolName] = React.useState("");
  const [schoolSearch, setSchoolSearch] = React.useState("");
  const [isSchoolDropdownOpen, setIsSchoolDropdownOpen] = React.useState(false);
  const [detectedLocation, setDetectedLocation] = React.useState<string | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = React.useState(false);

  // Vendor specific
  const [sellerType, setSellerType] = React.useState<"goods" | "services" | "both">("goods");
  const [verificationIdUrl, setVerificationIdUrl] = React.useState("");
  const [referralCodeInput, setReferralCodeInput] = React.useState("");

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      setIsLogin(false);
      localStorage.setItem('referredBy', ref);
      setReferralCodeInput(ref);
    } else {
      const storedRef = localStorage.getItem('referredBy');
      if (storedRef) setReferralCodeInput(storedRef);
      else setReferralCodeInput("");
    }
  }, []);

  const generateUsername = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setFieldErrors(prev => ({ ...prev, email: "Please enter a valid email address first to generate a username." }));
      return;
    }
    const emailPrefix = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const newUsername = `${emailPrefix}${randomNum}`;
    setUsername(newUsername);
    setFieldErrors(prev => {
      const nextErrors = { ...prev };
      delete nextErrors.email;
      return nextErrors;
    });
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setLoading(true);

    try {
      if (isLogin) {
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          const user = userCredential.user;
          const userDoc = await getDoc(doc(db, "users", user.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.role === "logistics") {
              await signOut(auth);
              setError("This email address is registered as a Logistics Partner account. Please use the Logistics Hub to log in, or sign up with a separate email for Buyer/Seller access.");
              setLoading(false);
              return;
            }
            if (userData.isSuspended) {
              await signOut(auth);
              setError("Your account has been suspended for violating SHOPIVERSITY terms. Please contact support if you believe this is a mistake.");
              setLoading(false);
              return;
            }
            if (userData.strikeCount >= 3) {
              await signOut(auth);
              setError("Your account has been permanently suspended due to receiving 3 strikes. Please contact support.");
              setLoading(false);
              return;
            }
          }
        } catch (err: any) {
          if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
            setFieldErrors({ auth: "Invalid email or password. Please try again." });
          } else if (err.code === "auth/invalid-email") {
            setFieldErrors({ email: "Invalid email format." });
          } else {
            setError(getFirestoreErrorMessage(err));
            handleFirestoreError(err, OperationType.GET, "users/login");
          }
        }
      } else {
        // If we are in "needsProfile" mode, we might already be logged in (e.g. via Google or if account creation succeeded but profile failed)
        let firebaseUser = auth.currentUser;
        
        if (!firebaseUser) {
          // Validate fields
          const errors: Record<string, string> = {};
          
          if (!fullName.trim()) errors.fullName = "Full name is required";
          if (!username.trim()) errors.username = "Username is required";
          if (!email.trim()) errors.email = "Email is required";
          if (!phone.trim()) {
            errors.phone = "Phone number is required";
          } else if (phonePrefix === "+234") {
            const cleanPhone = phone.replace(/\D/g, "");
            if (cleanPhone.length !== 11) {
              errors.phone = "Nigerian phone number must be 11 digits (e.g. 08012345678).";
            } else if (!cleanPhone.startsWith("0")) {
              errors.phone = "Nigerian 11-digit phone number must start with 0 (e.g. 08012345678).";
            }
          }
          if (!password) errors.password = "Password is required";

          // Validate passwords match
          if (password !== confirmPassword) {
            errors.confirmPassword = "Passwords do not match.";
          }

          // Validate username (no symbols or spaces)
          const usernameRegex = /^[a-zA-Z0-9]+$/;
          if (username && !usernameRegex.test(username)) {
            errors.username = "Username must only contain letters and numbers (no spaces or symbols).";
          }

          // Validate email format
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (email && !emailRegex.test(email)) {
            errors.email = "Please enter a valid email address.";
          }

          // Validate password strength
          const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/?]).{6,}$/;
          if (password && !passwordRegex.test(password)) {
            errors.password = "Password must be at least 6 characters long and contain uppercase, lowercase, number, and special character.";
          }

          if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            setLoading(false);
            return;
          }
        }

        // If we already have a user (e.g. profile missing case), we don't need verification choice again
    if (firebaseUser) {
      const referralCode = generateReferralCode(fullName || firebaseUser.displayName || "USER");
      const referredBy = referralCodeInput || localStorage.getItem('referredBy');

          const userProfile: UserProfile = {
            uid: firebaseUser.uid,
            displayName: fullName || firebaseUser.displayName || "User",
            username: username.toLowerCase(),
            email: firebaseUser.email || email.toLowerCase(),
            phoneNumber: phonePrefix === "+234" && phone.startsWith("0") ? `+234${phone.replace(/\D/g, "").slice(1)}` : `${phonePrefix}${phone}`,
            gender: gender,
            role: role === "seller" ? "both" : "buyer",
            activeRole: role,
            referralCode,
            referredBy: referredBy || "",
            referralEarnings: 0,
            referralCount: 0,
            schoolType: "", 
            schoolName: "", 
            state: "", 
            city: "", 
            deliveryAddress: "", 
            isVerified: false, 
            isSuspended: false,
            reportCount: 0,
            createdAt: new Date().toISOString(),
            verificationIdUrl: verificationIdUrl || "",
            profileCompleted: false 
          };
          await setDoc(doc(db, "users", firebaseUser.uid), userProfile);
          
          // If referred by someone, increment their referral count
          if (referredBy) {
            const referrersQ = query(collection(db, "users"), where("referralCode", "==", referredBy));
            const referrersSnap = await getDocs(referrersQ);
            if (!referrersSnap.empty) {
              const referrerDoc = referrersSnap.docs[0];
              const currentCount = referrerDoc.data().referralCount || 0;
              await updateDoc(referrerDoc.ref, { referralCount: currentCount + 1 });
            }
          }
          
          // Sign out after account creation
          await signOut(auth);
          localStorage.removeItem('referredBy');
          
          setIsVerificationSuccess(true);
          return;
        }

        // Go to verification choice
        setIsVerificationChoice(true);
      }
    } catch (err: any) {
      setError(getFirestoreErrorMessage(err));
      handleFirestoreError(err, isLogin ? OperationType.GET : OperationType.WRITE, `users/${auth.currentUser?.uid || 'new-user'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (verificationInput !== generatedCode) {
      setError("Invalid verification code. Please check your email and try again.");
      setLoading(false);
      return;
    }

    try {
      const referralCode = generateReferralCode(fullName);
      const referredBy = referralCodeInput || localStorage.getItem('referredBy');
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      await updateProfile(firebaseUser, { displayName: fullName });

      try {
        await sendEmailVerification(firebaseUser);
        console.log(`[FIREBASE AUTH] Verification email dispatched directly to ${email}`);
      } catch (evErr) {
        console.warn("sendEmailVerification notice:", evErr);
      }

      const userProfile: UserProfile = {
        uid: firebaseUser.uid,
        displayName: fullName,
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        phoneNumber: `${phonePrefix}${phone}`,
        gender: gender,
        role: role === "seller" ? "both" : "buyer",
        activeRole: role,
        referralCode,
        referredBy: referredBy || "",
        referralEarnings: 0,
        referralCount: 0,
        schoolType: "", 
        schoolName: "", 
        state: "", 
        city: "", 
        deliveryAddress: "", 
        isVerified: false, 
        isSuspended: false,
        reportCount: 0,
        createdAt: new Date().toISOString(),
        verificationIdUrl: verificationIdUrl || "",
        profileCompleted: false 
      };

      await setDoc(doc(db, "users", firebaseUser.uid), userProfile);
      
      // If referred by someone, increment their referral count
      if (referredBy) {
        const referrersQ = query(collection(db, "users"), where("referralCode", "==", referredBy));
        const referrersSnap = await getDocs(referrersQ);
        if (!referrersSnap.empty) {
          const referrerDoc = referrersSnap.docs[0];
          const currentCount = referrerDoc.data().referralCount || 0;
          await updateDoc(referrerDoc.ref, { referralCount: currentCount + 1 });
        }
      }

      localStorage.removeItem('referredBy');

      // Send welcome notification
      const welcomeNotification: Notification = {
        id: crypto.randomUUID(),
        userId: firebaseUser.uid,
        title: "Welcome to SHOPIVERSITY!",
        message: `Hi ${fullName}, welcome to SHOPIVERSITY! Your account is verified. Please log in to continue.`,
        type: "welcome",
        isRead: false,
        createdAt: new Date().toISOString()
      };
      await addDoc(collection(db, "notifications"), welcomeNotification);

      // Mandatory sign out - users must login after manual verification
      await signOut(auth);

      setIsVerificationSuccess(true);
      setIsVerifyingEmail(false);
      setIsVerifyingPhone(false);
      setLoading(false);
    } catch (err: any) {
      setError(getFirestoreErrorMessage(err));
      handleFirestoreError(err, OperationType.WRITE, `users/new-user`);
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmailCode = async () => {
    setLoading(true);
    setError("");
    const targetEmail = email.trim();
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(code);

    try {
      const response = await fetch("/api/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, code }),
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to send verification code");
      }
      
      setError(`A 6-digit verification code has been sent directly to ${targetEmail}. Please check your inbox and spam folder.`);
      setIsVerifyingEmail(true);
      setIsVerificationChoice(false);
    } catch (err: any) {
      setError(`Failed to send verification code: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSendPhoneCode = async () => {
    setLoading(true);
    setError("");
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(code);

    try {
      setError(`Verification code sent to ${phonePrefix}${phone}.`);
      setIsVerifyingPhone(true);
      setIsVerificationChoice(false);
    } catch (err: any) {
      setError(`Failed to send SMS: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResendingCode(true);
    setError("");
    const targetEmail = email.trim();
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(code);

    try {
      const response = await fetch("/api/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, code }),
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to resend code");
      }
      
      setError(`A new 6-digit verification code has been sent directly to ${targetEmail}.`);
    } catch (err: any) {
      setError(`Failed to resend code: ${err.message}`);
    } finally {
      setResendingCode(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider, browserPopupRedirectResolver);
      const user = result.user;

      // Check if user is registered as a Logistics partner
      const logisticsCompanyDoc = await getDoc(doc(db, "logistics_companies", user.uid));
      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (logisticsCompanyDoc.exists() || (userDoc.exists() && userDoc.data()?.role === "logistics")) {
        await signOut(auth);
        setError("This account is registered as a Logistics Partner. Sellers and Buyers must use a separate account.");
        setLoading(false);
        return;
      }

      if (!userDoc.exists()) {
        const referralCode = generateReferralCode(user.displayName || "USER");
        const referredBy = referralCodeInput || localStorage.getItem('referredBy');
        
        const userProfile: UserProfile = {
          uid: user.uid,
          displayName: user.displayName || "Anonymous",
          username: (user.email?.split("@")[0] || "user") + Math.floor(Math.random() * 1000),
          email: user.email || "",
          phoneNumber: user.phoneNumber || "",
          role: role === "seller" ? "both" : "buyer",
          activeRole: role,
          referralCode,
          referredBy: referredBy || "",
          referralEarnings: 0,
          referralCount: 0,
          isVerified: false, // All users start unverified now
          isSuspended: false,
          reportCount: 0,
          createdAt: new Date().toISOString(),
          verificationIdUrl: "",
          profileCompleted: false,
          schoolType: "",
          schoolName: "",
          state: "",
          city: "",
          deliveryAddress: "",
          deliveryLocations: "",
          gender: "other"
        };
        await setDoc(doc(db, "users", user.uid), userProfile);
        
        // If referred by someone, increment their referral count
        if (referredBy) {
          const referrersQ = query(collection(db, "users"), where("referralCode", "==", referredBy));
          const referrersSnap = await getDocs(referrersQ);
          if (!referrersSnap.empty) {
            const referrerDoc = referrersSnap.docs[0];
            const currentCount = referrerDoc.data().referralCount || 0;
            await updateDoc(referrerDoc.ref, { referralCount: currentCount + 1 });
          }
        }
        
        localStorage.removeItem('referredBy');
        
        // If buyer, skip ID verification and set as verified
        if (role === "buyer") {
          await updateDoc(doc(db, "users", user.uid), {
            isVerified: true
          });
          setIsVerificationChoice(false);
          setIsVerifyingEmail(false);
          setIsVerifyingPhone(false);
        } else {
          // Sellers need verification
          setIsVerificationChoice(false);
          setIsVerifyingEmail(false);
          setIsVerifyingPhone(false);
          setFullName(user.displayName || ""); // Pre-fill name from Google
          setIsGoogleSellerVerifying(true);
        }
      } else {
        const profile = userDoc.data() as UserProfile;
        if (profile.isSuspended) {
          await signOut(auth);
          setError("Your account has been suspended for violating SHOPIVERSITY terms.");
          setLoading(false);
          return;
        }
        if (profile.strikeCount >= 3) {
          await signOut(auth);
          setError("Your account has been permanently suspended due to receiving 3 strikes.");
          setLoading(false);
          return;
        }
        // Only force ID verification on sign-in for Sellers who aren't verified
        if (!profile.isVerified && profile.role === "seller") {
          setFullName(profile.displayName);
          setIsGoogleSellerVerifying(true);
          setLoading(false);
          return;
        }
      }
    } catch (err: any) {
      const errorCode = err.code || "";
      const errorMessage = err.message || "";
      
      if (errorCode === "auth/popup-closed-by-user" || errorCode === "auth/cancelled-popup-request") {
        // User closed the popup or navigation was cancelled, don't show an error
        setError("");
      } else {
        console.error("Google Sign-In Error Full Object:", err);
        if (errorCode === "auth/popup-blocked") {
          setError("Sign-in popup was blocked by your browser. Please allow popups or click 'Open in New Tab' at the top right.");
        } else if (errorCode === "auth/internal-error") {
          setError("Google Sign-In popup internal error (often caused by iframe security constraints). Please click 'Open in New Tab' at the top right of the screen to sign in, or try again.");
        } else if (errorCode.includes("network-request-failed") || errorMessage.toLowerCase().includes("network error") || errorMessage.toLowerCase().includes("failed to fetch")) {
          setError("Network Error: Connection to Google Auth servers failed. 1. Disable ad-blockers/VPNs. 2. If using Safari, try Chrome. 3. CRITICAL: Tap 'Open in New Tab' at the top right of the screen; login often fails inside the app preview window due to browser security constraints.");
        } else if (errorCode === "auth/blocked-at-iframe" || errorMessage.includes("blocked-at-iframe")) {
          setError("Sign-in blocked inside this view. Please click 'Open in New Tab' at the top right to sign in safely.");
        } else {
          setError(errorMessage || "An unexpected error occurred during Google Sign-In.");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSandboxLogin = async (sandboxRole: "buyer" | "seller" | "rider") => {
    setError("");
    setLoading(true);

    let targetEmail = "";
    const targetPassword = "DemoPassword123!";
    let targetName = "";
    let targetUsername = "";
    let targetPhone = "";

    if (sandboxRole === "buyer") {
      targetEmail = "buyer.demo@shopiversity.edu";
      targetName = "Emeka Buyer (Demo Student)";
      targetUsername = "demo_student";
      targetPhone = "+2348011223344";
    } else if (sandboxRole === "seller") {
      targetEmail = "seller.demo@shopiversity.edu";
      targetName = "Chioma Merchant (Demo Vendor)";
      targetUsername = "demo_vendor";
      targetPhone = "+2348055667788";
    } else if (sandboxRole === "rider") {
      targetEmail = "logistics.demo@shopiversity.edu";
      targetName = "Kwik Campus Logistics (Demo Partner)";
      targetUsername = "demo_logistics";
      targetPhone = "+2348099887766";
    }

    try {
      // 1. Try to sign in first
      try {
        await signInWithEmailAndPassword(auth, targetEmail, targetPassword);
      } catch (err: any) {
        // 2. If user doesn't exist, create them
        if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential" || err.message?.includes("USER_NOT_FOUND") || err.message?.includes("invalid-credential")) {
          const userCredential = await createUserWithEmailAndPassword(auth, targetEmail, targetPassword);
          const firebaseUser = userCredential.user;
          await updateProfile(firebaseUser, { displayName: targetName });

          const referralCode = generateReferralCode(targetName);

          const userProfile: UserProfile = {
            uid: firebaseUser.uid,
            displayName: targetName,
            username: targetUsername,
            email: targetEmail,
            phoneNumber: targetPhone,
            gender: "male",
            role: sandboxRole === "buyer" ? "buyer" : "both",
            activeRole: sandboxRole === "buyer" ? "buyer" : "seller",
            referralCode,
            referredBy: "",
            referralEarnings: 0,
            referralCount: 0,
            schoolType: "University",
            schoolName: "University of Ibadan",
            state: "Oyo",
            city: "Ibadan",
            deliveryAddress: sandboxRole === "buyer" ? "Block B, Room 12, Mellanby Hall, UI" : "UI Student Union Building, Shop 4",
            isVerified: true,
            isSuspended: false,
            reportCount: 0,
            createdAt: new Date().toISOString(),
            verificationIdUrl: "",
            profileCompleted: true
          };

          await setDoc(doc(db, "users", firebaseUser.uid), userProfile);

          // If rider, also create logistics company profile
          if (sandboxRole === "rider") {
            const logisticsProfile = {
              uid: firebaseUser.uid,
              companyName: targetName,
              rcNumber: "RC-DEMO-12345",
              email: targetEmail,
              phoneNumber: targetPhone,
              officeAddress: "UI Student Union Building, Room 10",
              vehicles: ["Bicycle", "Motorcycle"],
              campuses: ["University of Ibadan"],
              createdAt: new Date().toISOString(),
              isVerified: true
            };
            await setDoc(doc(db, "logistics_companies", firebaseUser.uid), logisticsProfile);
          }

          // Let's seed a sample product if they are a vendor to make the demo active and exciting!
          if (sandboxRole === "seller") {
            await addDoc(collection(db, "products"), {
              name: "MacBook Pro M2 16GB",
              description: "Extremely clean MacBook Pro M2, 16GB RAM, 512GB SSD. Perfect for computer science or engineering students. 10/10 condition.",
              price: 850000,
              originalPrice: 1200000,
              category: "Electronics",
              type: "good",
              condition: "used_like_new",
              images: ["https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=800"],
              sellerId: firebaseUser.uid,
              sellerName: targetName,
              campus: "University of Ibadan",
              schoolName: "University of Ibadan",
              isVerified: true,
              views: 42,
              likes: 12,
              createdAt: new Date().toISOString(),
              isHibernated: false,
              stock: 1
            });

            await addDoc(collection(db, "products"), {
              name: "Academic Research & Thesis Tutoring",
              description: "Personalized assistance for writing your undergraduate thesis, research proposals, data analysis (SPSS/R), and citation formatting.",
              price: 15000,
              category: "Academic Research",
              type: "service",
              images: ["https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=800"],
              sellerId: firebaseUser.uid,
              sellerName: targetName,
              campus: "University of Ibadan",
              schoolName: "University of Ibadan",
              isVerified: true,
              views: 110,
              likes: 38,
              createdAt: new Date().toISOString(),
              isHibernated: false,
              hourlyRate: 15000
            });
          }
        } else {
          throw err;
        }
      }
    } catch (err: any) {
      setError(`Sandbox login failed: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleIdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!fullName.trim()) {
        setError("Please enter your full name first so we can verify it against your ID.");
        return;
      }
      
      setIsVerifyingId(true);
      setIdVerificationError("");
      try {
        const base64 = await compressImage(file, 800, 800, 0.7);
        
        // Gemini Verification via Server Endpoint
        const response = await fetch("/api/gemini/verify-id", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: base64,
            fullName,
            schoolName,
            state,
            city
          })
        });

        const result = await response.json();
        if (result.matches) {
          setVerificationIdUrl(base64);
          setIdVerificationError("");
        } else {
          setIdVerificationError(`Verification failed: ${result.reason || "The information on the ID does not appear to match your profile details."}`);
          setVerificationIdUrl("");
        }
      } catch (error) {
        console.error("Error verifying ID:", error);
        setIdVerificationError("Failed to verify ID. Please ensure the image is clear and try again.");
      } finally {
        setIsVerifyingId(false);
      }
    }
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const data = await response.json();
        if (data.display_name) {
          setDetectedLocation(data.display_name);
        } else {
          setDetectedLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        }
      } catch (error) {
        setDetectedLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      } finally {
        setIsDetectingLocation(false);
      }
    }, (error) => {
      console.error("Geolocation error:", error);
      setError("Unable to retrieve your location. Please ensure location permissions are granted for school verification.");
      setIsDetectingLocation(false);
    });
  };

  const filteredSchools = NIGERIAN_SCHOOLS.filter(s => 
    (!schoolType || s.type === schoolType) &&
    s.name.toLowerCase().includes(schoolSearch.toLowerCase())
  );

  const getPasswordStrength = (pass: string) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score++;
    if (/\d/.test(pass)) score++;
    if (/[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pass)) score++;
    return score;
  };

  if (showTermsPage) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 p-6 overflow-y-auto">
        <TermsAndConditions onBack={() => setShowTermsPage(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-955 flex flex-col items-center justify-center p-4 sm:p-6 transition-colors duration-300 font-sans select-none">
      {/* Home Link */}
      <div className="fixed top-6 left-6 z-[100]">
        <button 
          onClick={() => window.location.href = "/"}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-800 rounded shadow-sm hover:border-slate-400 text-slate-705 dark:text-zinc-300 font-medium text-xs cursor-pointer transition-colors"
        >
          <Home className="w-4 h-4 text-slate-500" />
          <span>Home</span>
        </button>
      </div>
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[380px]"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-5 shrink-0 justify-center">
          <Logo className="scale-110" />
        </div>

        {/* Auth Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-[8px] border border-slate-300 dark:border-zinc-800 p-6 sm:p-7 shadow-sm">
          <AnimatePresence mode="popLayout">

            {isVerificationSuccess ? (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-5 py-4"
              >
                <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/30 rounded-full flex items-center justify-center mx-auto text-emerald-500 shadow-inner">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-zinc-100">Account Verified!</h3>
                  <p className="text-xs text-slate-505 dark:text-zinc-400 leading-normal">
                    Welcome to SHOPIVERSITY! Your account has been securely created and verified successfully.
                  </p>
                </div>
                <button 
                  onClick={() => {
                    setIsLogin(true);
                    setIsVerificationSuccess(false);
                    setIsVerificationChoice(false);
                    setIsVerifyingEmail(false);
                    setIsVerifyingPhone(false);
                    setPassword("");
                    setConfirmPassword("");
                  }}
                  className="w-full h-9 bg-purple-600 hover:bg-purple-700 text-white rounded font-medium text-xs shadow transition-all cursor-pointer"
                >
                  Continue to Login
                </button>
              </motion.div>
            ) : isGoogleSellerVerifying ? (
              <motion.div 
                key="google-verify"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                <div className="space-y-1 text-left">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-100 leading-tight">Account Identification</h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 leading-normal">Please verify your identity with a Student or Government ID to start trading on SHOPIVERSITY</p>
                </div>

                <div className="space-y-3.5">
                  {/* Name Input */}
                  <div className="space-y-1 text-left">
                    <label className="text-xs font-bold text-slate-900 dark:text-zinc-300">Full Name</label>
                    <input 
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full h-9 px-3 bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none text-[13px] font-sans"
                    />
                  </div>
                  
                  {/* ID Upload */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest ml-1 font-sans">ID Card Verification</label>
                    <label className={cn(
                      "border border-dashed rounded-sm p-5 flex flex-col items-center justify-center transition-colors cursor-pointer group relative overflow-hidden",
                      idVerificationError ? "border-red-300 bg-red-50 dark:bg-red-900/10" : "border-slate-305 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-805/20 hover:bg-slate-100/50 dark:hover:bg-zinc-800"
                    )}>
                      <input type="file" accept="image/*" onChange={handleIdUpload} className="hidden" disabled={isVerifyingId} />
                      {isVerifyingId ? (
                        <div className="flex flex-col items-center text-center py-2">
                          <Loader2 className="w-8 h-8 text-orange-500 animate-spin mb-2" />
                          <p className="text-xs font-bold text-slate-600 dark:text-zinc-405">Verifying ID with Gemini...</p>
                        </div>
                      ) : verificationIdUrl ? (
                        <>
                          <img src={verificationIdUrl} alt="ID Preview" className="absolute inset-0 w-full h-full object-cover opacity-15" />
                          <CheckCircle2 className="w-6 h-6 text-emerald-500 mb-1 relative z-10" />
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-404 relative z-10">ID Verified Successfully</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-6 h-6 text-slate-400 dark:text-slate-505 group-hover:text-orange-500 transition-colors mb-1.5" />
                          <span className="text-xs font-bold text-slate-600 dark:text-zinc-400">Upload Student ID / Gov Card</span>
                        </>
                      )}
                    </label>
                    {idVerificationError && (
                      <p className="text-[10px] text-red-500 font-bold mt-1 px-1 leading-snug">{idVerificationError}</p>
                    )}
                  </div>
                </div>

                <div className="pt-3 gap-2 flex flex-col">
                  <button 
                    onClick={async () => {
                      if (!verificationIdUrl) {
                        setError("Please upload and verify your ID first.");
                        return;
                      }
                      setLoading(true);
                      try {
                        await updateDoc(doc(db, "users", auth.currentUser!.uid), {
                          isVerified: true,
                          displayName: fullName,
                          verificationIdUrl: verificationIdUrl
                        });
                        setIsGoogleSellerVerifying(false);
                        setIsVerificationSuccess(true);
                      } catch (err) {
                        setError("Failed to complete verification. Please try again.");
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading || !verificationIdUrl || isVerifyingId}
                    className="w-full h-9 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded font-bold text-xs shadow transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Complete Verification"}
                  </button>

                  <button 
                    onClick={async () => {
                      await signOut(auth);
                      setIsGoogleSellerVerifying(false);
                    }}
                    className="text-xs text-[#0066c0] hover:underline cursor-pointer"
                  >
                    Cancel & Sign Out
                  </button>
                </div>
              </motion.div>
            ) : isVerificationChoice ? (
              <motion.div 
                key="choice"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-3 mb-4">
                  <button 
                    onClick={() => setIsVerificationChoice(false)}
                    className="p-1.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded hover:brightness-90 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4 text-slate-600 dark:text-zinc-400" />
                  </button>
                  <div className="text-left space-y-0.5">
                    <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">Verify your SHOPIVERSITY account</h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-404">Choose your verification method</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <button 
                    onClick={handleSendEmailCode}
                    disabled={loading}
                    className="p-4 bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-800 rounded-2xl hover:border-orange-500 transition-all flex items-center gap-3 text-left w-full group cursor-pointer"
                  >
                    <div className="w-[36px] h-[36px] bg-white dark:bg-zinc-900 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-orange-500 transition-colors border border-slate-200 dark:border-zinc-700">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-zinc-100">Email Verification</p>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400">{email}</p>
                    </div>
                  </button>

                  <button 
                    onClick={handleSendPhoneCode}
                    disabled={loading}
                    className="p-4 bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-800 rounded-2xl hover:border-orange-500 transition-all flex items-center gap-3 text-left w-full group cursor-pointer"
                  >
                    <div className="w-[36px] h-[36px] bg-white dark:bg-zinc-900 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-orange-500 transition-colors border border-slate-200 dark:border-zinc-700">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-zinc-100">Phone Verification</p>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400">{phonePrefix}{phone}</p>
                    </div>
                  </button>
                </div>

                <div className="pt-2 text-center">
                  <button 
                    type="button"
                    onClick={() => setIsVerificationChoice(false)}
                    className="text-xs text-[#0066c0] hover:underline"
                  >
                    Back to Sign Up
                  </button>
                </div>
              </motion.div>
            ) : isVerifyingEmail || isVerifyingPhone ? (
              <motion.div 
                key="verify"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-3 mb-4">
                  <button 
                    onClick={() => {
                      setIsVerifyingEmail(false);
                      setIsVerifyingPhone(false);
                    }}
                    className="p-1.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded hover:brightness-95"
                  >
                    <ArrowLeft className="w-4 h-4 text-slate-600 dark:text-zinc-400" />
                  </button>
                  <div className="text-left space-y-0.5">
                    <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                      {isVerifyingEmail ? "Check your email" : "Check your phone"}
                    </h3>
                    <p className="text-xs text-slate-505 dark:text-zinc-400 leading-normal">
                      Code sent to <span className="font-bold text-slate-900 dark:text-zinc-200">
                        {isVerifyingEmail ? email : `${phonePrefix}${phone}`}
                      </span>
                    </p>
                  </div>
                </div>

                {error && (
                  <div className={cn(
                    "p-3 border rounded text-xs leading-normal font-semibold",
                    error.includes("sent") ? "bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900" : "bg-red-50 border-red-100 text-red-700 dark:bg-red-950/20 dark:border-red-900"
                  )}>
                    {error}
                  </div>
                )}

                <form onSubmit={handleVerifyCode} className="space-y-4 text-left font-sans">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-900 dark:text-zinc-350">Enter Verification Code</label>
                    <input 
                      required
                      type="text"
                      maxLength={6}
                      placeholder="6-digit code"
                      value={verificationInput}
                      onChange={(e) => setVerificationInput(e.target.value.replace(/\D/g, ""))}
                      className="w-full h-11 px-3 bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none text-center text-xl font-black tracking-[0.3em]"
                    />
                  </div>

                  <div className="pt-2 flex flex-col gap-2">
                    <button 
                      type="submit"
                      disabled={loading || verificationInput.length !== 6}
                      className="w-full h-9 bg-gradient-to-b from-[#ffd814] to-[#f7ca00] hover:brightness-95 active:brightness-90 text-zinc-950 font-bold rounded-lg border border-[#a88734] transition-all text-xs font-semibold shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span>Verify & Create Account</span>
                      )}
                    </button>
                    
                    <button 
                      type="button"
                      onClick={isVerifyingEmail ? handleResendCode : handleSendPhoneCode}
                      disabled={resendingCode || loading}
                      className="text-xs font-bold text-[#0066c0] hover:underline"
                    >
                      {resendingCode ? "Sending Code..." : "Didn't receive code? Resend"}
                    </button>

                    <button 
                      type="button"
                      onClick={() => {
                        setIsVerifyingEmail(false);
                        setIsVerifyingPhone(false);
                        setIsVerificationChoice(true);
                        setVerificationInput("");
                      }}
                      className="text-xs text-slate-500 dark:text-zinc-400 hover:underline"
                    >
                      Change Verification Method
                    </button>
                  </div>
                </form>
              </motion.div>
            ) : (
              <div className="font-sans text-left">
                {signupSuccess && (
                  <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded text-emerald-800 dark:text-emerald-400 text-xs font-semibold leading-relaxed flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <p>Account created! Redirecting to login...</p>
                  </div>
                )}

                {error && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-150 dark:border-red-900/40 rounded text-red-705 dark:text-red-400 text-xs font-semibold leading-relaxed">
                    <p>{error}</p>
                  </div>
                )}

                <div className="flex items-center justify-between mb-5">
                  <h1 className="text-2xl font-normal text-zinc-900 dark:text-zinc-100 leading-tight">
                    {isLogin ? "Sign-In" : "Create Account"}
                  </h1>
                  <button
                    type="button"
                    onClick={() => window.location.href = "/"}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded-md cursor-pointer"
                    title="Back to Home Page"
                    id="back-to-home-auth-header"
                  >
                    <Home className="w-3.5 h-3.5 text-zinc-500" />
                    <span className="font-bold text-[11px]">Home</span>
                  </button>
                </div>

                {/* Buyer/Seller Selection (Only for SignUp) */}
                {!isLogin && (
                  <div className="mb-4 space-y-1">
                    <span className="block text-xs font-bold text-zinc-800 dark:text-zinc-300">
                      I want to register as a:
                    </span>
                    <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-zinc-800 rounded">
                      <button 
                        type="button"
                        onClick={() => setRole("buyer")}
                        className={cn(
                          "py-1.5 px-3 rounded text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                          role === "buyer" 
                            ? "bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-zinc-800" 
                            : "text-slate-500 hover:text-slate-800 dark:hover:text-zinc-205"
                        )}
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        Buyer
                      </button>
                      <button 
                        type="button"
                        onClick={() => setRole("seller")}
                        className={cn(
                          "py-1.5 px-3 rounded text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                          role === "seller" 
                            ? "bg-white dark:bg-zinc-700 text-slate-905 dark:text-white shadow-sm border border-slate-202 dark:border-zinc-808" 
                            : "text-slate-500 hover:text-slate-800 dark:hover:text-zinc-205"
                        )}
                      >
                        <Store className="w-3.5 h-3.5" />
                        Seller
                      </button>
                    </div>
                  </div>
                )}

                <form onSubmit={handleAuth} className="space-y-3.5">
                  <AnimatePresence mode="wait">
                    {isLogin ? (
                      <motion.div 
                        key="login"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-3.5"
                      >
                        <Input 
                          label="Email"
                          type="email" 
                          placeholder="Name@example.com"
                          value={email} 
                          onChange={setEmail} 
                          required 
                          error={fieldErrors.email || fieldErrors.auth}
                        />
                        
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <label className="block text-xs font-bold text-zinc-850 dark:text-zinc-205">Password</label>
                            <button
                              type="button"
                              onClick={() => {
                                setResetEmail(email || "");
                                setResetEmailSent(false);
                                setResetError("");
                                setShowForgotPassword(true);
                              }}
                              className="text-[11px] text-[#0066c0] dark:text-purple-400 hover:underline cursor-pointer bg-transparent border-none p-0 outline-none font-medium"
                            >
                              Forgot your password?
                            </button>
                          </div>
                          <Input 
                            type="password" 
                            placeholder="At least 6 characters"
                            value={password} 
                            onChange={setPassword} 
                            required 
                            error={fieldErrors.password || fieldErrors.auth}
                          />
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div 
                        key="signup"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-3.5"
                      >
                        <Input 
                          label="Your name"
                          type="text" 
                          placeholder="First and last name" 
                          value={fullName} 
                          onChange={setFullName} 
                          required 
                          error={fieldErrors.fullName}
                        />

                        <div className="space-y-1 text-left">
                          <label className="block text-xs font-bold text-zinc-850 dark:text-zinc-205">Username</label>
                          <div className="flex gap-1.5">
                            <input 
                              type="text" 
                              required
                              placeholder="Choose username" 
                              value={username} 
                              onChange={(e) => setUsername(e.target.value)} 
                              className={cn(
                                "flex-1 h-[34px] px-3 bg-white dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-[#9333ea] focus:ring-1 focus:ring-[#9333ea] outline-none text-[13px] shadow-sm transition-all",
                                fieldErrors.username && "border-red-500"
                              )}
                            />
                            <button 
                              type="button"
                              onClick={generateUsername}
                              className="h-[34px] px-2.5 bg-gradient-to-b from-[#f7dfa5] to-[#f0c14b] dark:from-[#353535] dark:to-[#222222] border border-[#a88734] dark:border-zinc-700 text-slate-900 dark:text-zinc-200 text-[11px] font-bold rounded shadow-sm hover:brightness-95 transition-all outline-none cursor-pointer"
                            >
                              Generate
                            </button>
                          </div>
                          {fieldErrors.username && (
                            <p className="text-[10px] font-bold text-red-500 mt-0.5">{fieldErrors.username}</p>
                          )}
                        </div>

                        <Input 
                          label="Email"
                          type="email" 
                          placeholder="Name@example.com" 
                          value={email} 
                          onChange={setEmail} 
                          required 
                          error={fieldErrors.email}
                        />
                        
                        <div className="space-y-1 text-left">
                          <label className="block text-xs font-bold text-zinc-850 dark:text-zinc-205">Mobile Number (Active)</label>
                          <div className="flex gap-1.5">
                            <select 
                              value={phonePrefix}
                              onChange={(e) => setPhonePrefix(e.target.value)}
                              className="w-20 h-[34px] px-1.5 bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded text-xs font-semibold text-slate-700 dark:text-zinc-200 focus:border-[#9333ea]"
                            >
                              <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" value="+234">🇳🇬 +234</option>
                              <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" value="+233">🇬🇭 +233</option>
                              <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" value="+254">🇰🇪 +254</option>
                              <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" value="+27">🇿🇦 +27</option>
                              <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" value="+44">🇬🇧 +44</option>
                              <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" value="+1">🇺🇸 +1</option>
                            </select>
                            <input 
                              required
                              type="tel"
                              value={phone}
                              maxLength={phonePrefix === "+234" ? 11 : 15}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (phonePrefix === "+234") {
                                  setPhone(val.replace(/\D/g, ""));
                                } else {
                                  setPhone(val);
                                }
                              }}
                              className={cn(
                                "flex-1 h-[34px] px-3 bg-white dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-[#9333ea] focus:ring-1 focus:ring-[#9333ea] outline-none text-[13px] shadow-sm transition-all",
                                fieldErrors.phone && "border-red-500"
                              )}
                              placeholder={phonePrefix === "+234" ? "08012345678" : "8012345678"}
                            />
                          </div>
                          {fieldErrors.phone && (
                            <p className="text-[10px] font-bold text-red-500 mt-0.5">{fieldErrors.phone}</p>
                          )}
                        </div>

                        <Input 
                          label="Password"
                          type="password" 
                          placeholder="At least 6 characters" 
                          value={password} 
                          onChange={setPassword} 
                          required 
                          error={fieldErrors.password}
                          strength={getPasswordStrength(password)}
                        />
                        
                        <Input 
                          label="Re-enter password"
                          type="password" 
                          placeholder="Confirm password" 
                          value={confirmPassword} 
                          onChange={setConfirmPassword} 
                          required 
                          error={fieldErrors.confirmPassword}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {!isLogin && (
                    <div className="pt-1.5">
                      <Input 
                        label="Referral Code (Optional)"
                        type="text" 
                        placeholder="Invite code" 
                        value={referralCodeInput} 
                        onChange={setReferralCodeInput}
                      />
                    </div>
                  )}

                  <div className="pt-2">
                    <button 
                      type="submit"
                      disabled={loading || isVerifyingId}
                      className="w-full h-9 bg-gradient-to-b from-[#ffd814] to-[#f7ca00] hover:brightness-95 active:brightness-90 text-zinc-950 font-bold rounded-lg border border-[#a88734] transition-all text-xs font-semibold shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span>{isLogin ? "Sign-In" : "Create Account"}</span>
                      )}
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-normal mt-3">
                    By continuing, you agree to SHOPIVERSITY's{" "}
                    <button 
                      type="button"
                      onClick={() => setShowTermsPage(true)}
                      className="text-[#0066c0] hover:underline hover:text-[#c45500] font-sans"
                    >
                      Conditions of Use
                    </button>{" "}
                    and{" "}
                    <button 
                      type="button"
                      onClick={() => setShowTermsPage(true)}
                      className="text-[#0066c0] hover:underline hover:text-[#c45500] font-sans"
                    >
                      Privacy Notice
                    </button>.
                  </p>
                </form>

                {/* Google Sign In Option */}
                <div className="mt-5">
                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-slate-200 dark:border-zinc-800"></div>
                    <span className="flex-shrink mx-3 text-[11px] text-slate-400 uppercase tracking-wider font-bold">Or</span>
                    <div className="flex-grow border-t border-slate-200 dark:border-zinc-800"></div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="w-full h-9 bg-white dark:bg-zinc-800 border border-slate-350 dark:border-zinc-700 text-slate-700 dark:text-zinc-100 rounded text-xs font-semibold flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-zinc-750 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-[15px] h-[15px]" alt="Google logo" />
                    <span>Continue with Google</span>
                  </button>
                </div>

                {/* Switcher Option styled precisely like Amazon's Create/Sign-In buttons */}
                <div className="mt-6 pt-5 border-t border-slate-200 dark:border-zinc-800 text-center space-y-3">
                  <p className="text-[12px] text-slate-805 dark:text-zinc-300 font-medium">
                    {isLogin ? "New to SHOPIVERSITY?" : "Already have an account?"}
                  </p>
                  
                  <button 
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setStep(1);
                      setError("");
                      setFieldErrors({});
                    }}
                    className="w-full h-[34px] bg-gradient-to-b from-[#fafafa] to-[#f4f4f4] hover:from-[#f4f4f4] hover:to-[#e7e7e7] dark:from-[#3a3a3a] dark:to-[#2e2e2e] dark:hover:from-[#2e2e2e] dark:hover:to-[#222222] border border-slate-350 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 rounded text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    {isLogin ? "Create your SHOPIVERSITY account" : "Sign-In with existing account"}
                  </button>

                  {auth.currentUser && (
                    <button 
                      onClick={() => signOut(auth)}
                      className="mt-3 block w-full text-[11px] font-bold text-red-500 hover:underline hover:text-red-600 transition-colors cursor-pointer"
                    >
                      Trouble logging in? Sign Out & Try Again
                    </button>
                  )}
                </div>
              </div>
            )}
          </AnimatePresence>

          {/* Forgot Password Modal */}
          <AnimatePresence>
            {showForgotPassword && (
              <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
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
                        <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Forgot your account password?</p>
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
                          We've sent a password reset link to <span className="font-bold text-slate-900 dark:text-white">{resetEmail}</span>. Please check your email inbox (and spam folder) and follow the instructions to reset your password.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(false)}
                        className="w-full h-11 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-orange-500/15"
                      >
                        Back to Sign In
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handlePasswordReset} className="space-y-4 text-left">
                      <p className="text-xs text-slate-600 dark:text-zinc-300 font-medium leading-relaxed">
                        Enter your registered email address below, and we will send you a secure link to reset your account password.
                      </p>

                      {resetError && (
                        <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-red-600 dark:text-red-400 text-xs font-semibold">
                          {resetError}
                        </div>
                      )}

                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300">Account Email Address</label>
                        <input
                          type="email"
                          required
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          placeholder="name@example.com"
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

          {/* Terms & Conditions Modal */}
          <AnimatePresence>
            {showTerms && (
              <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 max-w-lg w-full shadow-2xl border border-slate-100 dark:border-slate-800 max-h-[80vh] flex flex-col"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Terms & Conditions</h3>
                    <button 
                      onClick={() => setShowTerms(false)}
                      className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                      <XCircle className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-2 space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed custom-scrollbar text-left">
                    <p className="text-[10px] italic bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border-l-2 border-purple-500">
                      By buying or selling on SHOPIVERSITY, you agree to these terms.
                    </p>
                    <section>
                      <h4 className="text-slate-900 dark:text-white font-bold mb-1">1. Escrow & Payment</h4>
                      <p>SHOPIVERSITY holds your money in escrow. Sellers receive payment after you confirm delivery, minus a 5% commission.</p>
                    </section>
                    <section>
                      <h4 className="text-slate-900 dark:text-white font-bold mb-1">2. 48-Hour Protection</h4>
                      <p>You have 48 hours from delivery to inspect your order. After 48 hours, all sales are final.</p>
                    </section>
                    <section>
                      <h4 className="text-slate-900 dark:text-white font-bold mb-1">3. Dispute Resolution</h4>
                      <p>Raise disputes within 48 hours. Sellers must provide proof of delivery within 24 hours of the complaint.</p>
                    </section>
                    <section>
                      <h4 className="text-slate-900 dark:text-white font-bold mb-1">4. Payment Security</h4>
                      <p>Always pay through the SHOPIVERSITY app. Off-app payments are NOT protected or supported.</p>
                    </section>
                    <section>
                      <h4 className="text-slate-900 dark:text-white font-bold mb-1">5. Verification</h4>
                      <p>All users must verify their Student ID and account details to ensure traceability and community safety.</p>
                    </section>
                  </div>

                  <button 
                    onClick={() => setShowTerms(false)}
                    className="mt-8 w-full py-4 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 dark:hover:bg-slate-700 transition-all"
                  >
                    I Understand
                  </button>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

function Input({ label, type, value, onChange, className, error, strength, rightElement, ...props }: any) {
  const [showPassword, setShowPassword] = React.useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className="space-y-1 w-full text-left font-sans">
      {label && (
        <label className="block text-xs font-bold text-zinc-850 dark:text-zinc-205">
          {label}
        </label>
      )}
      <div className="relative">
        <input 
          {...props}
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "w-full h-[34px] px-3 bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none text-[13px] shadow-sm transition-all",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500/10",
            className
          )}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors p-1"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
        {rightElement && (
          <div className="absolute right-1 top-1/2 -translate-y-1/2">
            {rightElement}
          </div>
        )}
      </div>

      {isPassword && strength !== undefined && value.length > 0 && (
        <div className="flex gap-1 h-0.5 mt-1 px-0.5">
          {[1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className={cn(
                "flex-1 rounded-sm transition-colors duration-550",
                level <= strength 
                  ? strength <= 1 ? "bg-red-500" : strength <= 2 ? "bg-amber-500" : strength <= 3 ? "bg-blue-500" : "bg-emerald-500"
                  : "bg-slate-200 dark:bg-zinc-800"
              )}
            />
          ))}
        </div>
      )}

      {error && (
        <p className="text-[10px] font-bold text-red-500 mt-0.5 flex items-center gap-1">
          <XCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
}
