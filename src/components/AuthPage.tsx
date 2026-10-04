import React from "react";
import { auth, db, googleProvider } from "../firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  updateEmail,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  deleteUser,
  browserPopupRedirectResolver,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult
} from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc, collection, addDoc, query, where, getDocs, deleteDoc } from "firebase/firestore";
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
  Home,
  Info,
  RefreshCw,
  Sparkles,
  Truck
} from "lucide-react";
import Logo from "./Logo";
import { cn, generateReferralCode } from "../lib/utils";
import { generateSmartUsername } from "../utils/accountCleanup";
import { UserProfile, Notification } from "../types";
import { handleFirestoreError, OperationType, getFirestoreErrorMessage } from "../lib/firebase-errors";
import { compressImage } from "../lib/imageUtils";
import AuthErrorModal, { AuthErrorModalProps } from "./AuthErrorModal";
import { SCHOOL_TYPES, NIGERIAN_SCHOOLS } from "../constants/schools";
import { NIGERIAN_STATES, STATE_CITIES } from "../constants/locations";
import TermsAndConditions from "./TermsAndConditions";
import PrivacyPolicy from "./PrivacyPolicy";
import campusMarketTrading from "../assets/images/campus_market_trading_1788161927669.jpg";
import campusDeliveryRider from "../assets/images/campus_delivery_rider_1788161947290.jpg";
import campusStudentFashion from "../assets/images/campus_student_fashion_1788161963031.jpg";
import campusFoodDelivery from "../assets/images/campus_food_delivery_1788161978183.jpg";
import campusAuthBg from "../assets/images/campus_auth_bg_1788161412388.jpg";

const BACKGROUND_IMAGES = [
  campusMarketTrading,
  campusDeliveryRider,
  campusStudentFashion,
  campusFoodDelivery,
  campusAuthBg
];

export default function AuthPage({ 
  initialNeedsProfile = false,
  initialMode,
  initialRole,
  onModeChange,
  onGoToMarket,
  onNavigateToLogistics
}: { 
  initialNeedsProfile?: boolean;
  initialMode?: "login" | "signup";
  initialRole?: "buyer" | "seller";
  onModeChange?: (mode: "login" | "signup") => void;
  onGoToMarket?: () => void;
  onNavigateToLogistics?: () => void;
}) {
  const handleGoToMarket = () => {
    if (onGoToMarket) {
      onGoToMarket();
    } else {
      window.location.href = "/";
    }
  };

  const [isLogin, setIsLogin] = React.useState(
    initialNeedsProfile ? false : (initialMode ? initialMode === "login" : true)
  );

  const switchAuthMode = (loginMode: boolean) => {
    setIsLogin(loginMode);
    setStep(1);
    setError("");
    setFieldErrors({});
    if (onModeChange) {
      onModeChange(loginMode ? "login" : "signup");
    }
  };
  const [role, setRole] = React.useState<"buyer" | "seller">(initialRole || "buyer");

  React.useEffect(() => {
    if (initialRole) {
      setRole(initialRole);
    }
  }, [initialRole]);
  const [step, setStep] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [currentBgIndex, setCurrentBgIndex] = React.useState(0);
  const [errorPopup, setErrorPopup] = React.useState<{
    isOpen: boolean;
    type: "logistics_mismatch" | "buyer_seller_mismatch" | "email_in_use" | "generic";
    title: string;
    message: string;
    email?: string;
    primaryActionLabel?: string;
    onPrimaryAction?: () => void;
  } | null>(null);

  // Synchronize mode if prop changes
  React.useEffect(() => {
    if (!initialNeedsProfile && initialMode) {
      setIsLogin(initialMode === "login");
      setStep(1);
      setError("");
      setFieldErrors({});
    }
  }, [initialMode, initialNeedsProfile]);

  // Background picture rotation every 3.5 seconds
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBgIndex((prev) => (prev + 1) % BACKGROUND_IMAGES.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  React.useEffect(() => {
    if (initialNeedsProfile) {
      setIsLogin(false);
      
      if (auth.currentUser) {
        setFullName(auth.currentUser.displayName || "");
        setEmail(auth.currentUser.email || "");
        setUsername(generateSmartUsername(auth.currentUser.displayName || "User"));
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
  const [showPrivacyPage, setShowPrivacyPage] = React.useState(false);
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
      const actionCodeSettings = {
        url: window.location.origin,
        handleCodeInApp: false
      };
      // Send official password reset email directly via Firebase
      await sendPasswordResetEmail(auth, resetEmail.trim(), actionCodeSettings);
      setResetEmailSent(true);
    } catch (err: any) {
      console.error("Password reset error:", err);
      if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
        // Show success message to prevent account enumeration
        setResetEmailSent(true);
      } else if (err.code === "auth/invalid-email") {
        setResetError("Please enter a valid email address.");
      } else if (err.code === "auth/too-many-requests") {
        setResetError("Too many password reset requests. Please wait a minute and try again.");
      } else if (err.code === "auth/network-request-failed") {
        setResetError("Network error. Please check your internet connection and try again.");
      } else {
        setResetError("Failed to send password reset email. Please check your network and try again.");
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
  const [confirmationResult, setConfirmationResult] = React.useState<ConfirmationResult | null>(null);
  const [verificationInput, setVerificationInput] = React.useState("");
  const [isEmailVerified, setIsEmailVerified] = React.useState(false);
  const [resendingCode, setResendingCode] = React.useState(false);
  const [isGoogleSellerVerifying, setIsGoogleSellerVerifying] = React.useState(false);
  const [showChangeEmail, setShowChangeEmail] = React.useState(false);
  const [newEmailInput, setNewEmailInput] = React.useState("");

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

    // Process redirect result if user returned from Google signInWithRedirect (e.g. Safari / mobile)
    const checkRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          setLoading(true);
          await processGoogleUser(result.user);
        }
      } catch (err: any) {
        console.error("Google Redirect Result Error:", err);
      } finally {
        setLoading(false);
      }
    };
    checkRedirectResult();
  }, []);

  const generateUsername = () => {
    const candidateName = fullName.trim() || `${firstName} ${lastName}`.trim();
    if (!candidateName) {
      setFieldErrors(prev => ({ 
        ...prev, 
        fullName: "Please enter your full name first to generate your 6-character username." 
      }));
      return;
    }
    const newUsername = generateSmartUsername(candidateName);
    setUsername(newUsername);
    setFieldErrors(prev => {
      const nextErrors = { ...prev };
      delete nextErrors.fullName;
      delete nextErrors.username;
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
        const cleanEmail = email.trim().toLowerCase();
        
        // Pre-check: Check if this email is a logistics partner account
        if (cleanEmail) {
          try {
            const logCompanyQ = query(collection(db, "logistics_companies"), where("email", "==", cleanEmail));
            const logCompanySnap = await getDocs(logCompanyQ);
            const logUserQ = query(collection(db, "users"), where("email", "==", cleanEmail), where("role", "==", "logistics"));
            const logUserSnap = await getDocs(logUserQ);

            if (!logCompanySnap.empty || !logUserSnap.empty) {
              setErrorPopup({
                isOpen: true,
                type: "logistics_mismatch",
                title: "Logistics Partner Account Detected",
                message: `The email address "${cleanEmail}" is registered as an official Campus Logistics Partner account. This portal is strictly for Buyers and Sellers. Please sign in through the Campus Logistics Hub, or use a separate email address.`,
                email: cleanEmail,
                primaryActionLabel: "Go to Campus Logistics Hub",
                onPrimaryAction: () => {
                  if (onNavigateToLogistics) {
                    onNavigateToLogistics();
                  } else {
                    handleGoToMarket();
                  }
                }
              });
              setLoading(false);
              return;
            }
          } catch (preCheckErr) {
            console.warn("Logistics email pre-check notice:", preCheckErr);
          }
        }

        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          const user = userCredential.user;
          const userDoc = await getDoc(doc(db, "users", user.uid));
          const logisticsDoc = await getDoc(doc(db, "logistics_companies", user.uid));
          
          if (logisticsDoc.exists() || (userDoc.exists() && (userDoc.data()?.role === "logistics" || userDoc.data()?.state === "Logistics Partner"))) {
            await signOut(auth);
            setErrorPopup({
              isOpen: true,
              type: "logistics_mismatch",
              title: "Logistics Partner Account Detected",
              message: `The email address "${user.email || cleanEmail}" is registered as an official Campus Logistics Partner account. It cannot be used to sign in as a Buyer or Seller. Please use the Campus Logistics Hub to access your fleet operations.`,
              email: user.email || cleanEmail,
              primaryActionLabel: "Go to Campus Logistics Hub",
              onPrimaryAction: () => {
                if (onNavigateToLogistics) {
                  onNavigateToLogistics();
                } else {
                  handleGoToMarket();
                }
              }
            });
            setError("This email address is registered as a Logistics Partner account. Please use the Logistics Hub to log in.");
            setLoading(false);
            return;
          }

          if (userDoc.exists()) {
            const userData = userDoc.data();
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
          } else {
            // Firebase Auth succeeded, but the database profile was deleted or missing from Firestore
            setErrorPopup({
              isOpen: true,
              type: "profile_missing",
              title: "Account Exists but Profile Missing",
              message: `Your login credentials for "${user.email || cleanEmail}" are valid in Firebase Authentication, but your database profile was deleted. Would you like to restore your marketplace profile, or permanently delete the login credentials to register fresh?`,
              email: user.email || cleanEmail,
              primaryActionLabel: "Restore / Recreate Profile",
              onPrimaryAction: async () => {
                try {
                  const defaultProfile: UserProfile = {
                    uid: user.uid,
                    displayName: user.displayName || (user.email ? user.email.split("@")[0] : "User"),
                    username: ((user.displayName || user.email?.split("@")[0] || "user").replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "user") + Math.floor(100 + Math.random() * 900),
                    email: (user.email || cleanEmail).toLowerCase(),
                    phoneNumber: user.phoneNumber || "",
                    gender: "other",
                    role: "both",
                    activeRole: "buyer",
                    referralCode: generateReferralCode(user.displayName || "USER"),
                    referredBy: "",
                    referralEarnings: 0,
                    referralCount: 0,
                    schoolType: "",
                    schoolName: "",
                    state: "",
                    city: "",
                    deliveryAddress: "",
                    isVerified: user.emailVerified || false,
                    isSuspended: false,
                    reportCount: 0,
                    createdAt: new Date().toISOString(),
                    verificationIdUrl: "",
                    profileCompleted: false
                  };
                  await setDoc(doc(db, "users", user.uid), defaultProfile);
                  setErrorPopup(prev => ({ ...prev, isOpen: false }));
                  setError("Profile restored successfully! Welcome back to SHOPIVERSITY.");
                } catch (rErr: any) {
                  console.error("Failed to restore profile:", rErr);
                  setError("Failed to restore profile. Please check your internet connection.");
                }
              },
              secondaryActionLabel: "Delete Account & Register Fresh",
              onSecondaryAction: async () => {
                try {
                  await deleteUser(user);
                  setError("Lingering authentication account removed from Firebase. You can now register fresh.");
                } catch (delErr: any) {
                  console.warn("User delete notice:", delErr);
                  await signOut(auth);
                  setError("Session cleared. Please sign up to create your new account.");
                }
                setErrorPopup(prev => ({ ...prev, isOpen: false }));
                switchAuthMode(false);
              }
            });
            setLoading(false);
            return;
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
        const cleanEmail = email.trim().toLowerCase();
        
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
            if (cleanPhone.startsWith("0")) {
              if (cleanPhone.length !== 11) {
                errors.phone = "Nigerian phone number starting with 0 must be 11 digits (e.g. 08012345678).";
              } else if (!/^0[789]\d{9}$/.test(cleanPhone)) {
                errors.phone = "Please enter a valid Nigerian phone number (e.g. 080..., 070..., 090...).";
              }
            } else {
              if (cleanPhone.length !== 10) {
                errors.phone = "Nigerian phone number without 0 must be 10 digits (e.g. 8012345678).";
              } else if (!/^[789]\d{9}$/.test(cleanPhone)) {
                errors.phone = "Please enter a valid Nigerian phone number (e.g. 80..., 70..., 90...).";
              }
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

          // Check 1: Is this email already registered as a Logistics Partner?
          try {
            const logCompanyQ = query(collection(db, "logistics_companies"), where("email", "==", cleanEmail));
            const logCompanySnap = await getDocs(logCompanyQ);
            const logUserQ = query(collection(db, "users"), where("email", "==", cleanEmail), where("role", "==", "logistics"));
            const logUserSnap = await getDocs(logUserQ);

            if (!logCompanySnap.empty || !logUserSnap.empty) {
              setErrorPopup({
                isOpen: true,
                type: "logistics_mismatch",
                title: "Email Reserved for Logistics",
                message: `The email address "${cleanEmail}" is already registered as an active Campus Logistics Partner. It cannot be used to register a Buyer or Seller account. Please access the Logistics Hub or register with a different personal email address.`,
                email: cleanEmail,
                primaryActionLabel: "Go to Campus Logistics Hub",
                onPrimaryAction: () => {
                  if (onNavigateToLogistics) {
                    onNavigateToLogistics();
                  } else {
                    handleGoToMarket();
                  }
                }
              });
              setLoading(false);
              return;
            }

            // Check 2: Pre-check logistics conflict only (do not block user signup prematurely)
          } catch (preCheckErr) {
            console.warn("Signup email pre-check notice:", preCheckErr);
          }
        }

        if (!firebaseUser) {
          try {
            const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
            firebaseUser = userCredential.user;
            await updateProfile(firebaseUser, { displayName: fullName });

            try {
              const actionCodeSettings = {
                url: window.location.origin,
                handleCodeInApp: false
              };
              await sendEmailVerification(firebaseUser, actionCodeSettings);
              console.log(`[FIREBASE AUTH] Verification email dispatched directly to ${email}`);
            } catch (evErr) {
              console.warn("sendEmailVerification notice:", evErr);
            }
          } catch (createErr: any) {
            if (createErr.code === "auth/email-already-in-use" || createErr.message?.includes("email-already-in-use")) {
              // Check if account was deleted from Firebase Firestore and lingering in Auth
              const existingUserQ = query(collection(db, "users"), where("email", "==", cleanEmail));
              const existingUserSnap = await getDocs(existingUserQ);

              if (existingUserSnap.empty) {
                // The profile document is MISSING in Firestore, but account exists in Firebase Auth!
                // Try to authenticate with the password the user just entered to restore their profile
                try {
                  const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
                  firebaseUser = cred.user;
                  if (fullName) {
                    await updateProfile(firebaseUser, { displayName: fullName });
                  }
                  console.log(`[AUTH RECOVERY] Authenticated orphaned user ${firebaseUser.uid}. Recreating Firestore profile...`);
                } catch (pwErr) {
                  // Password didn't match the existing auth account. Offer sign in or password reset via Firebase.
                  setErrorPopup({
                    isOpen: true,
                    type: "profile_missing",
                    title: "Account Exists but Profile Missing",
                    message: `An account with "${cleanEmail}" exists in Firebase Authentication, but its database profile was deleted. Please sign in with your password to restore your profile, or send a password reset link to ${cleanEmail}.`,
                    email: cleanEmail,
                    primaryActionLabel: "Sign In to Restore Profile",
                    onPrimaryAction: () => {
                      switchAuthMode(true);
                    },
                    secondaryActionLabel: "Send Reset Link via Firebase",
                    onSecondaryAction: async () => {
                      try {
                        await sendPasswordResetEmail(auth, cleanEmail, { url: window.location.origin, handleCodeInApp: false });
                        setError(`Password reset link sent to ${cleanEmail} via Firebase! Please check your email.`);
                      } catch (e: any) {
                        setError(e.message || "Failed to send reset link via Firebase.");
                      }
                      setErrorPopup(prev => ({ ...prev, isOpen: false }));
                    }
                  });
                  setLoading(false);
                  return;
                }
              } else {
                // Active profile document exists in Firestore as well. Genuine existing account.
                setErrorPopup({
                  isOpen: true,
                  type: "email_in_use",
                  title: "Email Already Registered",
                  message: `The email address "${cleanEmail}" is already registered on SHOPIVERSITY. You cannot create a duplicate account with this email. Please sign in to your existing account.`,
                  email: cleanEmail,
                  primaryActionLabel: "Switch to Sign In",
                  onPrimaryAction: () => {
                    switchAuthMode(true);
                  },
                  secondaryActionLabel: "Reset Password via Firebase",
                  onSecondaryAction: async () => {
                    try {
                      await sendPasswordResetEmail(auth, cleanEmail, { url: window.location.origin, handleCodeInApp: false });
                      setError(`Password reset link sent to ${cleanEmail} via Firebase! Please check your email.`);
                    } catch (e: any) {
                      setError(e.message || "Failed to send reset link via Firebase.");
                    }
                    setErrorPopup(prev => ({ ...prev, isOpen: false }));
                  }
                });
                setLoading(false);
                return;
              }
            } else {
              throw createErr;
            }
          }
        }

        // Clean up any stale or orphaned documents matching this email with a different UID
        try {
          const staleDocs = await getDocs(query(collection(db, "users"), where("email", "==", cleanEmail)));
          for (const sDoc of staleDocs.docs) {
            if (sDoc.id !== firebaseUser.uid) {
              await deleteDoc(sDoc.ref).catch(() => {});
            }
          }
        } catch (cleanupErr) {
          console.warn("Stale docs cleanup notice:", cleanupErr);
        }

        const referralCode = generateReferralCode(fullName || firebaseUser.displayName || "USER");
        const referredBy = referralCodeInput || localStorage.getItem('referredBy');

        const userProfile: UserProfile = {
          uid: firebaseUser.uid,
          displayName: fullName || firebaseUser.displayName || "User",
          username: username.toLowerCase(),
          email: firebaseUser.email || email.trim().toLowerCase(),
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

        localStorage.removeItem('referredBy');
        
        // Directly transition to Check Email Verification Screen
        setIsVerifyingEmail(true);
        setIsVerificationChoice(false);
        setError("");
        return;
      }
    } catch (err: any) {
      setError(getFirestoreErrorMessage(err));
      handleFirestoreError(err, isLogin ? OperationType.GET : OperationType.WRITE, `users/${auth.currentUser?.uid || 'new-user'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckVerifiedStatus = async () => {
    setLoading(true);
    setError("");
    try {
      if (auth.currentUser) {
        await auth.currentUser.reload();
        if (auth.currentUser.emailVerified) {
          try {
            await updateDoc(doc(db, "users", auth.currentUser.uid), { isVerified: true });
          } catch (uErr) {
            console.warn("User doc update notice:", uErr);
          }
          await signOut(auth);
          setIsVerifyingEmail(false);
          setIsLogin(true);
          setError("Email verified successfully! Please log in with your credentials to access your dashboard.");
          return;
        }
      }
      setError(`Email is not verified yet. Please open the verification email sent to ${email || auth.currentUser?.email || 'your email'}, click the verification link, then tap 'I Have Verified'.`);
    } catch (err: any) {
      console.error("Verification check error:", err);
      setError("Unable to reload account status. Please check your network connection or click 'Resend Verification Email'.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerificationEmail = async () => {
    const currentAuthUser = auth.currentUser;
    if (!currentAuthUser) {
      setError("No active user session found. If you created an account, please try logging in.");
      return;
    }
    setResendingCode(true);
    setError("");
    try {
      const actionCodeSettings = {
        url: window.location.origin,
        handleCodeInApp: false
      };
      await sendEmailVerification(currentAuthUser, actionCodeSettings);
      setError(`Verification link resent to ${currentAuthUser.email}! Please check your inbox and spam folder.`);
    } catch (err: any) {
      console.error("Resend verification email error:", err);
      if (err.code === "auth/too-many-requests") {
        setError("Too many email requests. Please wait 1 minute before requesting another email.");
      } else {
        setError("Failed to resend verification email. Please try again in a few moments.");
      }
    } finally {
      setResendingCode(false);
    }
  };

  const handleChangeEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newEmailInput.trim().toLowerCase();
    if (!trimmed) {
      setError("Please enter a valid new email address.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setError("Please enter a valid email address format.");
      return;
    }
    const currentAuthUser = auth.currentUser;
    if (!currentAuthUser) {
      setError("Session lost. Please log in to change your email address.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await updateEmail(currentAuthUser, trimmed);
      try {
        await updateDoc(doc(db, "users", currentAuthUser.uid), { email: trimmed });
      } catch (uErr) {
        console.warn("Firestore email update notice:", uErr);
      }
      setEmail(trimmed);
      const actionCodeSettings = {
        url: window.location.origin,
        handleCodeInApp: false
      };
      await sendEmailVerification(currentAuthUser, actionCodeSettings);
      setShowChangeEmail(false);
      setNewEmailInput("");
      setError(`Email updated to ${trimmed}! A new verification link has been sent.`);
    } catch (err: any) {
      console.error("Change email error:", err);
      if (err.code === "auth/requires-recent-login") {
        setError("For security, please sign out and log in again before changing your email.");
      } else if (err.code === "auth/email-already-in-use") {
        setError("This email address is already registered to another account.");
      } else {
        setError(err.message || "Failed to update email address.");
      }
    } finally {
      setLoading(false);
    }
  };

  const getRecaptchaVerifier = () => {
    if ((window as any).recaptchaVerifier) {
      return (window as any).recaptchaVerifier;
    }
    const verifier = new RecaptchaVerifier(auth, "recaptcha-container", {
      size: "invisible",
      callback: () => {
        // reCAPTCHA solved
      },
      "expired-callback": () => {
        setError("reCAPTCHA verification expired. Please try requesting the code again.");
      }
    });
    (window as any).recaptchaVerifier = verifier;
    return verifier;
  };

  const handleSendEmailCode = async () => {
    setLoading(true);
    setError("");
    const targetEmail = email.trim();

    try {
      let currentAuthUser = auth.currentUser;
      if (!currentAuthUser) {
        const userCredential = await createUserWithEmailAndPassword(auth, targetEmail, password);
        currentAuthUser = userCredential.user;
        await updateProfile(currentAuthUser, { displayName: fullName });
      }

      const actionCodeSettings = {
        url: window.location.origin,
        handleCodeInApp: false
      };
      await sendEmailVerification(currentAuthUser, actionCodeSettings);

      const referralCode = generateReferralCode(fullName || "USER");
      const referredBy = referralCodeInput || localStorage.getItem("referredBy");
      const userProfile: UserProfile = {
        uid: currentAuthUser.uid,
        displayName: fullName,
        username: username.toLowerCase(),
        email: targetEmail.toLowerCase(),
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
      await setDoc(doc(db, "users", currentAuthUser.uid), userProfile);

      setVerificationMethod("email");
      setIsVerifyingEmail(true);
      setIsVerificationChoice(false);
      setError(`A verification link has been sent directly to ${targetEmail} via Firebase. Please check your inbox and tap 'I Have Verified'.`);
    } catch (err: any) {
      console.error("Firebase sendEmailVerification error:", err);
      setError(getFirestoreErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSendPhoneCode = async () => {
    setLoading(true);
    setError("");

    const rawDigits = phone.replace(/\D/g, "");
    if (!rawDigits || rawDigits.length < 7) {
      setError("Please enter a valid phone number to receive your SMS code.");
      setLoading(false);
      return;
    }

    const fullPhoneNumber = phonePrefix === "+234" && rawDigits.startsWith("0")
      ? `+234${rawDigits.slice(1)}`
      : `${phonePrefix}${rawDigits}`;

    try {
      const appVerifier = getRecaptchaVerifier();
      console.log(`[FIREBASE SMS] Dispatching phone authentication SMS to ${fullPhoneNumber} via Firebase...`);
      const confirmation = await signInWithPhoneNumber(auth, fullPhoneNumber, appVerifier);
      setConfirmationResult(confirmation);
      setVerificationMethod("phone");
      setIsVerifyingPhone(true);
      setIsVerificationChoice(false);
      setError(`Firebase SMS sent to ${fullPhoneNumber}! Enter the 6-digit code received via SMS.`);
    } catch (err: any) {
      console.error("Firebase Phone Auth Error:", err);
      if ((window as any).recaptchaVerifier) {
        try {
          (window as any).recaptchaVerifier.clear();
          (window as any).recaptchaVerifier = null;
        } catch (e) {}
      }
      if (err.code === "auth/invalid-phone-number") {
        setError("Invalid phone number format. Please ensure your country code and phone number are correct.");
      } else if (err.code === "auth/too-many-requests" || err.code === "auth/quota-exceeded") {
        setError("Too many SMS verification requests. Please try again later or use Email Verification.");
      } else if (err.code === "auth/captcha-check-failed") {
        setError("reCAPTCHA verification failed. Please try again.");
      } else {
        setError(err.message || "Failed to send SMS code via Firebase. Please try again or use Email Verification.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPhoneCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!confirmationResult) {
      setError("No pending SMS verification found. Please request a new verification code.");
      setLoading(false);
      return;
    }

    if (!verificationInput || verificationInput.trim().length !== 6) {
      setError("Please enter the 6-digit code sent to your phone via SMS.");
      setLoading(false);
      return;
    }

    try {
      const userCredential = await confirmationResult.confirm(verificationInput.trim());
      const firebaseUser = userCredential.user;

      if (fullName) {
        await updateProfile(firebaseUser, { displayName: fullName });
      }

      const referralCode = generateReferralCode(fullName || "USER");
      const referredBy = referralCodeInput || localStorage.getItem("referredBy");

      const userProfile: UserProfile = {
        uid: firebaseUser.uid,
        displayName: fullName || "User",
        username: username.toLowerCase(),
        email: email ? email.toLowerCase() : (firebaseUser.email || ""),
        phoneNumber: firebaseUser.phoneNumber || `${phonePrefix}${phone}`,
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
        isVerified: true, 
        isSuspended: false,
        reportCount: 0,
        createdAt: new Date().toISOString(),
        verificationIdUrl: verificationIdUrl || "",
        profileCompleted: false 
      };

      await setDoc(doc(db, "users", firebaseUser.uid), userProfile);

      if (referredBy) {
        const referrersQ = query(collection(db, "users"), where("referralCode", "==", referredBy));
        const referrersSnap = await getDocs(referrersQ);
        if (!referrersSnap.empty) {
          const referrerDoc = referrersSnap.docs[0];
          const currentCount = referrerDoc.data().referralCount || 0;
          await updateDoc(referrerDoc.ref, { referralCount: currentCount + 1 });
        }
      }

      localStorage.removeItem("referredBy");

      const welcomeNotification: Notification = {
        id: crypto.randomUUID(),
        userId: firebaseUser.uid,
        title: "Welcome to SHOPIVERSITY!",
        message: `Hi ${fullName}, welcome to SHOPIVERSITY! Your phone number has been verified via Firebase SMS.`,
        type: "welcome",
        isRead: false,
        createdAt: new Date().toISOString()
      };
      await addDoc(collection(db, "notifications"), welcomeNotification);

      setIsVerificationSuccess(true);
      setIsVerifyingPhone(false);
    } catch (err: any) {
      console.error("Firebase SMS Verification Error:", err);
      if (err.code === "auth/invalid-verification-code") {
        setError("Invalid SMS verification code. Please check the code sent to your phone and try again.");
      } else if (err.code === "auth/code-expired") {
        setError("The SMS verification code has expired. Please request a new code.");
      } else {
        setError(err.message || "Failed to verify SMS code with Firebase. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (verificationMethod === "phone") {
      await handleSendPhoneCode();
    } else {
      await handleResendVerificationEmail();
    }
  };

  const processGoogleUser = async (user: any) => {
    // Check if user is registered as a Logistics partner
    const cleanGoogleEmail = (user.email || "").toLowerCase();
    const logisticsCompanyDoc = await getDoc(doc(db, "logistics_companies", user.uid));
    const userDoc = await getDoc(doc(db, "users", user.uid));
    let isLogisticsEmail = false;

    if (!logisticsCompanyDoc.exists() && cleanGoogleEmail) {
      try {
        const logCompanyQ = query(collection(db, "logistics_companies"), where("email", "==", cleanGoogleEmail));
        const logCompanySnap = await getDocs(logCompanyQ);
        const logUserQ = query(collection(db, "users"), where("email", "==", cleanGoogleEmail), where("role", "==", "logistics"));
        const logUserSnap = await getDocs(logUserQ);
        if (!logCompanySnap.empty || !logUserSnap.empty) {
          isLogisticsEmail = true;
        }
      } catch (e) {
        console.warn("Google logistics check notice:", e);
      }
    }

    if (logisticsCompanyDoc.exists() || isLogisticsEmail || (userDoc.exists() && (userDoc.data()?.role === "logistics" || userDoc.data()?.state === "Logistics Partner"))) {
      await signOut(auth);
      setErrorPopup({
        isOpen: true,
        type: "logistics_mismatch",
        title: "Logistics Partner Account Detected",
        message: `This Google account (${user.email}) is registered as a Campus Logistics Fleet Partner. Buyers and Sellers must use a separate personal account. Please access the Campus Logistics Hub to manage your fleet operations.`,
        email: user.email,
        primaryActionLabel: "Go to Campus Logistics Hub",
        onPrimaryAction: () => {
          if (onNavigateToLogistics) {
            onNavigateToLogistics();
          } else {
            handleGoToMarket();
          }
        }
      });
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
        username: generateSmartUsername(user.displayName || "User"),
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
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      let user = null;
      try {
        const result = await signInWithPopup(auth, googleProvider, browserPopupRedirectResolver);
        user = result.user;
      } catch (popupErr: any) {
        console.warn("Google popup failed or blocked, attempting redirect fallback:", popupErr);
        // Fallback to signInWithRedirect for Safari, mobile browsers, or blocked popups
        await signInWithRedirect(auth, googleProvider);
        return;
      }

      if (user) {
        await processGoogleUser(user);
      }
    } catch (err: any) {
      const errorCode = err.code || "";
      const errorMessage = err.message || "";
      
      if (errorCode === "auth/popup-closed-by-user" || errorCode === "auth/cancelled-popup-request") {
        setError("");
      } else {
        console.error("Google Sign-In Error:", err);
        try {
          // Ultimate fallback to redirect if popup fails for any other reason
          await signInWithRedirect(auth, googleProvider);
        } catch (redirectErr: any) {
          setError("Google Sign-In failed. Please ensure popups/redirects are allowed or try signing in with email.");
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
        const base64 = await compressImage(file, 1200, 1200, 0.88);
        
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
          setIdVerificationError(result.reason || "Unable to verify document. Please ensure you upload a clear government or student ID card.");
          setVerificationIdUrl("");
        }
      } catch (error) {
        console.error("Error verifying ID:", error);
        setIdVerificationError("Failed to process ID photo. Please upload a clear image of your document.");
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
        <TermsAndConditions 
          onBack={() => setShowTermsPage(false)} 
          onNavigatePrivacy={() => {
            setShowTermsPage(false);
            setShowPrivacyPage(true);
          }}
        />
      </div>
    );
  }

  if (showPrivacyPage) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 p-6 overflow-y-auto">
        <PrivacyPolicy onBack={() => setShowPrivacyPage(false)} />
      </div>
    );
  }

  return (
    <div className="relative min-h-full min-h-[calc(100vh-65px)] w-full flex-1 flex flex-col items-center justify-center p-4 sm:p-6 sm:py-10 font-sans select-none overflow-x-hidden bg-zinc-950">
      {/* High-Quality Rotating Campus Activity Backgrounds - Fixed full coverage */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        {BACKGROUND_IMAGES.map((img, idx) => {
          const isActive = idx === currentBgIndex;
          return (
            <div
              key={`auth-bg-slide-${idx}`}
              className={cn(
                "absolute inset-0 transition-opacity ease-in-out",
                isActive ? "opacity-100 scale-100" : "opacity-0 scale-100"
              )}
              style={{
                transitionProperty: "opacity",
                transitionDuration: "1000ms"
              }}
            >
              <img
                src={img}
                alt="Campus Marketplace"
                className="w-full h-full object-cover object-center filter brightness-[0.88] dark:brightness-[0.60] contrast-[1.05] saturate-[1.1]"
                referrerPolicy="no-referrer"
              />
            </div>
          );
        })}
        {/* Subtle, balanced dark overlay keeping photographic background crisp while ensuring zero white background bleed */}
        <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-[1.5px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 15, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-[425px] relative z-10 my-4"
      >
        {/* Header Title (Single unified branding without duplicate logo) */}
        <div className="flex flex-col items-center mb-5 shrink-0 justify-center space-y-1.5 text-center">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-md">
            {isLogin ? "Welcome Back" : "Join Shopiversity"}
          </h2>
          <p className="text-xs font-semibold text-white/90 drop-shadow-sm">
            The Campus Marketplace for Nigerian Universities
          </p>
        </div>

        {/* Auth Card with Glassmorphic Elevation */}
        <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl rounded-3xl border border-white/60 dark:border-zinc-750/80 p-4 sm:p-6 md:p-8 shadow-2xl ring-1 ring-black/5 dark:ring-white/5">
          <div id="recaptcha-container" className="my-1 flex justify-center"></div>
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
            ) : isVerifyingEmail ? (
              <motion.div 
                key="verify-email"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-5 text-center font-sans"
              >
                <div className="flex flex-col items-center justify-center pt-2">
                  <div className="w-14 h-14 bg-gradient-to-tr from-purple-600 to-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-purple-500/30 mb-3 ring-4 ring-purple-100 dark:ring-purple-900/40 animate-pulse">
                    <Mail className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-zinc-100 leading-tight">
                    Check your email to verify
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-zinc-300 mt-1.5 max-w-sm mx-auto leading-relaxed">
                    We sent a verification link to <br />
                    <span className="font-extrabold text-purple-700 dark:text-purple-400 break-all underline decoration-purple-300">
                      {email || auth.currentUser?.email}
                    </span>
                  </p>
                </div>

                {error && (
                  <div className={cn(
                    "p-3.5 border rounded-xl text-xs leading-relaxed font-semibold text-left transition-all",
                    error.toLowerCase().includes("verified successfully") || error.toLowerCase().includes("resent") || error.toLowerCase().includes("updated")
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300" 
                      : "bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300"
                  )}>
                    <p className="flex items-start gap-2">
                      {error.toLowerCase().includes("verified successfully") ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      )}
                      <span>{error}</span>
                    </p>
                  </div>
                )}

                <div className="space-y-2.5 pt-1">
                  {/* Open Gmail Link */}
                  <a 
                    href="https://mail.google.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full h-11 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-100 font-bold rounded-xl flex items-center justify-center gap-2 text-xs border border-slate-200 dark:border-zinc-700 transition-all touch-manipulation select-none active:scale-95 shadow-sm"
                  >
                    <Mail className="w-4 h-4 text-red-500" />
                    <span>Open Gmail / Mail App ↗</span>
                  </a>

                  {/* Primary: I Have Verified */}
                  <button 
                    type="button"
                    onClick={handleCheckVerifiedStatus}
                    disabled={loading}
                    className="w-full h-12 bg-gradient-to-b from-[#ffd814] to-[#f7ca00] hover:brightness-95 active:scale-95 text-zinc-950 font-bold rounded-xl border border-[#a88734] transition-all text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer touch-manipulation select-none z-20 disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin text-zinc-950" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-emerald-800" />
                        <span>I Have Verified</span>
                      </>
                    )}
                  </button>

                  {/* Secondary: Resend Verification Email */}
                  <button 
                    type="button"
                    onClick={handleResendVerificationEmail}
                    disabled={resendingCode || loading}
                    className="w-full h-11 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200 font-bold rounded-xl border border-slate-300 dark:border-zinc-700 transition-all text-xs shadow-sm flex items-center justify-center gap-2 cursor-pointer touch-manipulation select-none z-20 disabled:opacity-50"
                  >
                    {resendingCode ? (
                      <Loader2 className="w-4 h-4 animate-spin text-slate-700" />
                    ) : (
                      <RefreshCw className="w-4 h-4 text-purple-600" />
                    )}
                    <span>Resend Verification Email</span>
                  </button>

                  {/* Change Email Toggle / Form */}
                  {!showChangeEmail ? (
                    <button 
                      type="button"
                      onClick={() => {
                        setShowChangeEmail(true);
                        setNewEmailInput(email || auth.currentUser?.email || "");
                      }}
                      className="text-xs font-bold text-purple-700 dark:text-purple-400 hover:underline cursor-pointer pt-1 block mx-auto touch-manipulation"
                    >
                      Wrong email address? Change Email
                    </button>
                  ) : (
                    <form onSubmit={handleChangeEmailSubmit} className="mt-2 p-3 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl space-y-2 text-left animate-fadeIn">
                      <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300">
                        Enter Correct Email Address
                      </label>
                      <input 
                        type="email"
                        required
                        placeholder="e.g. correctemail@gmail.com"
                        value={newEmailInput}
                        onChange={(e) => setNewEmailInput(e.target.value)}
                        className="w-full h-10 px-3 bg-white dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-purple-500"
                      />
                      <div className="flex gap-2 pt-1">
                        <button 
                          type="submit"
                          disabled={loading}
                          className="flex-1 h-9 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-xs transition-all touch-manipulation cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Update & Resend"}
                        </button>
                        <button 
                          type="button"
                          onClick={() => setShowChangeEmail(false)}
                          className="px-3 h-9 bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold rounded-lg text-xs cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Go to Login Link */}
                  <div className="pt-2">
                    <button 
                      type="button"
                      onClick={async () => {
                        try { await signOut(auth); } catch (e) {}
                        setIsVerifyingEmail(false);
                        setIsLogin(true);
                      }}
                      className="text-xs font-bold text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:underline cursor-pointer touch-manipulation"
                    >
                      Already verified? Go to Log In
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : isVerifyingPhone ? (
              <motion.div 
                key="verify-phone"
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
                      Check your phone for SMS
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 leading-normal">
                      Firebase SMS sent to <span className="font-bold text-slate-900 dark:text-zinc-200">
                        {phonePrefix === "+234" && phone.startsWith("0") ? `+234${phone.replace(/\D/g, "").slice(1)}` : `${phonePrefix}${phone}`}
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

                <form onSubmit={handleVerifyPhoneCode} className="space-y-4 text-left font-sans">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-900 dark:text-zinc-350">Enter 6-Digit SMS Code</label>
                    <input 
                      required
                      type="text"
                      maxLength={6}
                      placeholder="• • • • • •"
                      value={verificationInput}
                      onChange={(e) => setVerificationInput(e.target.value.replace(/\D/g, ""))}
                      className="w-full h-11 px-3 bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none text-center text-xl font-black tracking-[0.3em]"
                    />
                  </div>

                  <div className="pt-2 flex flex-col gap-2">
                    <button 
                      type="submit"
                      disabled={loading || verificationInput.length !== 6}
                      className="w-full h-11 bg-gradient-to-r from-[#ff6b00] to-[#ff8c00] hover:from-[#ea6200] hover:to-[#ff7b00] text-white font-bold rounded-xl transition-all text-xs shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span>Verify SMS & Activate Account</span>
                      )}
                    </button>
                    
                    <button 
                      type="button"
                      onClick={handleSendPhoneCode}
                      disabled={loading}
                      className="text-xs font-bold text-[#ff6b00] hover:underline"
                    >
                      {loading ? "Sending SMS via Firebase..." : "Didn't receive code? Resend SMS via Firebase"}
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

                {/* Responsive Mobile-First Sign In / Sign Up Mode Switcher */}
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-zinc-800/90 rounded-xl mb-4 border border-slate-200/70 dark:border-zinc-700/70">
                  <button
                    type="button"
                    onClick={() => switchAuthMode(true)}
                    className={cn(
                      "min-h-[40px] sm:min-h-[38px] py-2 px-3 rounded-lg text-xs sm:text-[13px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation select-none whitespace-nowrap active:scale-95",
                      isLogin
                        ? "bg-white dark:bg-zinc-900 text-[#ff6b00] shadow-sm border border-slate-200/80 dark:border-zinc-700"
                        : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
                    )}
                  >
                    <span>Sign In</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => switchAuthMode(false)}
                    className={cn(
                      "min-h-[40px] sm:min-h-[38px] py-2 px-3 rounded-lg text-xs sm:text-[13px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation select-none whitespace-nowrap active:scale-95",
                      !isLogin
                        ? "bg-[#ff6b00] text-white shadow-sm"
                        : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
                    )}
                  >
                    <span>Sign Up</span>
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2 mb-4">
                  <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                    {isLogin ? "Sign-In" : "Create Account"}
                  </h1>
                  <button
                    type="button"
                    onClick={handleGoToMarket}
                    className="min-h-[34px] flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-all bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded-lg cursor-pointer touch-manipulation active:scale-95 whitespace-nowrap shrink-0"
                    title="Back to Home Page"
                    id="back-to-home-auth-header"
                  >
                    <Home className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    <span className="font-bold text-[11px]">Home</span>
                  </button>
                </div>

                {/* Buyer/Seller Selection (Only for SignUp) */}
                {!isLogin && (
                  <div className="mb-4 space-y-1.5">
                    <span className="block text-xs font-bold text-zinc-800 dark:text-zinc-300">
                      I want to register as a:
                    </span>
                    <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-zinc-800 rounded-xl">
                      <button 
                        type="button"
                        onClick={() => setRole("buyer")}
                        className={cn(
                          "min-h-[38px] py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation active:scale-95 whitespace-nowrap",
                          role === "buyer" 
                            ? "bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-zinc-800" 
                            : "text-slate-500 hover:text-slate-800 dark:hover:text-zinc-205"
                        )}
                      >
                        <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                        <span>Customer / Buyer</span>
                      </button>
                      <button 
                        type="button"
                        onClick={() => setRole("seller")}
                        className={cn(
                          "min-h-[38px] py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation active:scale-95 whitespace-nowrap",
                          role === "seller" 
                            ? "bg-white dark:bg-zinc-700 text-slate-905 dark:text-white shadow-sm border border-slate-202 dark:border-zinc-808" 
                            : "text-slate-500 hover:text-slate-800 dark:hover:text-zinc-205"
                        )}
                      >
                        <Store className="w-3.5 h-3.5 shrink-0" />
                        <span>Seller</span>
                      </button>
                    </div>
                    {onNavigateToLogistics && (
                      <div className="pt-1 text-center">
                        <button
                          type="button"
                          onClick={onNavigateToLogistics}
                          className="text-[11px] font-semibold text-orange-600 dark:text-orange-400 hover:underline inline-flex items-center justify-center gap-1 mx-auto bg-transparent border-none cursor-pointer"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Register as a Logistics Fleet Partner instead</span>
                        </button>
                      </div>
                    )}
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
                          <label className="block text-xs font-bold text-zinc-850 dark:text-zinc-205">
                            Username <span className="text-[10px] font-normal text-slate-500 dark:text-zinc-400">(6 chars)</span>
                          </label>
                          <div className="flex gap-1.5">
                            <input 
                              type="text" 
                              required
                              placeholder="e.g. ayo482" 
                              value={username} 
                              maxLength={6}
                              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 6))} 
                              className={cn(
                                "flex-1 h-[34px] px-3 bg-white dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-[#9333ea] focus:ring-1 focus:ring-[#9333ea] outline-none text-[13px] shadow-sm transition-all",
                                fieldErrors.username && "border-red-500"
                              )}
                            />
                            <button 
                              type="button"
                              onClick={generateUsername}
                              title="Generate 6-character username based on your name"
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
                          <div className="flex gap-2">
                            <select 
                              value={phonePrefix}
                              onChange={(e) => setPhonePrefix(e.target.value)}
                              className="w-28 h-10 px-2.5 bg-slate-50 dark:bg-zinc-850 border border-slate-300 dark:border-zinc-700 rounded-xl text-xs font-bold text-slate-800 dark:text-zinc-100 focus:border-[#ff6b00] shadow-sm cursor-pointer transition-all"
                            >
                              <option className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100" value="+234">🇳🇬 +234</option>
                              <option className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100" value="+233">🇬🇭 +233</option>
                              <option className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100" value="+254">🇰🇪 +254</option>
                              <option className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100" value="+27">🇿🇦 +27</option>
                              <option className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100" value="+44">🇬🇧 +44</option>
                              <option className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100" value="+1">🇺🇸 +1</option>
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
                                "flex-1 h-10 px-3 bg-white dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-[#ff6b00] focus:ring-1 focus:ring-[#ff6b00] outline-none text-[13px] shadow-sm transition-all font-medium",
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
                      className="w-full min-h-[44px] sm:min-h-[42px] py-2.5 px-4 bg-gradient-to-b from-[#ffd814] to-[#f7ca00] hover:brightness-95 active:scale-[0.98] text-zinc-950 font-bold rounded-xl border border-[#a88734] transition-all text-xs sm:text-sm shadow-sm flex items-center justify-center gap-2 cursor-pointer touch-manipulation select-none whitespace-nowrap disabled:opacity-50"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
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
                      className="text-[#0066c0] hover:underline hover:text-[#c45500] font-sans border-none bg-transparent cursor-pointer p-0 font-bold"
                    >
                      Conditions of Use & Terms
                    </button>
                    {" "}and{" "}
                    <button 
                      type="button"
                      onClick={() => setShowPrivacyPage(true)}
                      className="text-[#0066c0] hover:underline hover:text-[#c45500] font-sans border-none bg-transparent cursor-pointer p-0 font-bold"
                    >
                      Privacy Policy
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
                    className="w-full min-h-[44px] sm:min-h-[42px] py-2.5 px-4 bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-100 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2.5 hover:bg-slate-50 dark:hover:bg-zinc-750 active:scale-[0.98] transition-all shadow-sm cursor-pointer touch-manipulation select-none whitespace-nowrap disabled:opacity-50"
                  >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4 shrink-0" alt="Google logo" />
                    <span>Continue with Google</span>
                  </button>
                </div>

                {/* Switcher Option styled precisely like Amazon's Create/Sign-In buttons */}
                <div className="mt-6 pt-5 border-t border-slate-200 dark:border-zinc-800 text-center space-y-3">
                  <p className="text-[12px] text-slate-805 dark:text-zinc-300 font-medium">
                    {isLogin ? "New to SHOPIVERSITY?" : "Already have an account?"}
                  </p>
                  
                  <button 
                    type="button"
                    onClick={() => switchAuthMode(!isLogin)}
                    className="w-full min-h-[42px] sm:min-h-[40px] py-2 px-4 bg-gradient-to-b from-[#fafafa] to-[#f4f4f4] hover:from-[#f4f4f4] hover:to-[#e7e7e7] dark:from-[#3a3a3a] dark:to-[#2e2e2e] dark:hover:from-[#2e2e2e] dark:hover:to-[#222222] border border-slate-300 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer touch-manipulation select-none active:scale-[0.98] whitespace-nowrap"
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
                      <h4 className="text-slate-900 dark:text-white font-bold mb-1">2. 72-Hour Protection</h4>
                      <p>You have 72 hours from delivery to inspect your order. After 72 hours without a dispute, all sales are final and escrow is paid to the seller.</p>
                    </section>
                    <section>
                      <h4 className="text-slate-900 dark:text-white font-bold mb-1">3. Dispute Resolution</h4>
                      <p>Raise disputes within 72 hours. Sellers must provide proof of delivery within 24 to 48 hours of the complaint.</p>
                    </section>
                    <section>
                      <h4 className="text-slate-900 dark:text-white font-bold mb-1">4. Payment Security & Off-App Policy</h4>
                      <p>Always pay through the SHOPIVERSITY app. If 3 days pass after delivery time and payment was not made through SHOPIVERSITY, the seller receives a <strong>warning strike</strong> message. On the 2nd offense, the seller's account is <strong>suspended</strong>, and repeated offenses result in a <strong>permanent ban</strong>.</p>
                    </section>
                    <section>
                      <h4 className="text-slate-900 dark:text-white font-bold mb-1">5. Mandatory Logistics Registration</h4>
                      <p>All courier companies, student riders, or outsourced delivery services MUST register as an official Logistics Partner on SHOPIVERSITY according to our Terms & Conditions before taking custody of dispatches.</p>
                    </section>
                    <section>
                      <h4 className="text-slate-900 dark:text-white font-bold mb-1">6. Profile & ID Verification</h4>
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

          {/* Auth Error Popup Modal */}
          {errorPopup && (
            <AuthErrorModal
              isOpen={errorPopup.isOpen}
              onClose={() => setErrorPopup(null)}
              type={errorPopup.type}
              title={errorPopup.title}
              message={errorPopup.message}
              email={errorPopup.email}
              primaryActionLabel={errorPopup.primaryActionLabel}
              onPrimaryAction={errorPopup.onPrimaryAction}
            />
          )}
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
          {[1, 2, 3, 4].map((level, idx) => (
            <div
              key={`auth-pw-level-${level}-${idx}`}
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
