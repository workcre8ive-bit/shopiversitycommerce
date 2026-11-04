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
  Truck,
  Camera,
  Scan,
  ShieldCheck
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
  onNavigateToLogistics,
  onVerificationScreenChange
}: { 
  initialNeedsProfile?: boolean;
  initialMode?: "login" | "signup";
  initialRole?: "buyer" | "seller";
  onModeChange?: (mode: "login" | "signup") => void;
  onGoToMarket?: () => void;
  onNavigateToLogistics?: () => void;
  onVerificationScreenChange?: (isVerifying: boolean) => void;
}) {
  const handleGoToMarket = () => {
    if (onVerificationScreenChange) {
      onVerificationScreenChange(false);
    }
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
  const [businessName, setBusinessName] = React.useState("");
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
  const [agreedToTerms, setAgreedToTerms] = React.useState(false);
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

      // 1. Dispatch branded password reset security code email via Brevo
      const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
      try {
        await fetch("/api/send-password-reset", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: resetEmail.trim(),
            code: resetCode,
            resetLink: `${window.location.origin}/?tab=auth&mode=login`
          })
        });
        console.log(`[BREVO RESET] Password reset code dispatched via Brevo to ${resetEmail.trim()}`);
      } catch (brevoErr) {
        console.warn("Brevo password reset dispatch notice:", brevoErr);
      }

      // 2. Also send standard Firebase password reset link
      try {
        await sendPasswordResetEmail(auth, resetEmail.trim(), actionCodeSettings);
      } catch (fbErr: any) {
        console.warn("Firebase password reset notice:", fbErr);
      }

      setResetEmailSent(true);
    } catch (err: any) {
      console.error("Password reset error:", err);
      if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
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
  
  // Verification & Brevo Engine states
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

  // OTP Verification States
  const [preferredVerificationChannel, setPreferredVerificationChannel] = React.useState<"email" | "phone">("email");
  const [sentOtpCode, setSentOtpCode] = React.useState<string>("");
  const [enteredOtpCode, setEnteredOtpCode] = React.useState<string>("");
  const [verifyingOtp, setVerifyingOtp] = React.useState<boolean>(false);
  const [resendCooldown, setResendCooldown] = React.useState<number>(0);
  const [otpSentVia, setOtpSentVia] = React.useState<"brevo" | "fallback">("brevo");
  const [brevoNotice, setBrevoNotice] = React.useState<string>("");

  // Countdown timer for resending verification code
  React.useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // School details
  const [schoolType, setSchoolType] = React.useState("");
  const [schoolName, setSchoolName] = React.useState("");
  const [schoolSearch, setSchoolSearch] = React.useState("");
  const [isSchoolDropdownOpen, setIsSchoolDropdownOpen] = React.useState(false);

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
          const isDedicatedLogisticsUser = userDoc.exists() && (userDoc.data()?.role === "logistics" || userDoc.data()?.state === "Logistics Partner") && userDoc.data()?.role !== "buyer" && userDoc.data()?.role !== "seller" && userDoc.data()?.role !== "both";
          
          if (isDedicatedLogisticsUser) {
            setErrorPopup({
              isOpen: true,
              type: "logistics_mismatch",
              title: "Logistics Partner Account Detected",
              message: `The email address "${user.email || cleanEmail}" is registered as a Campus Logistics Partner account. Would you like to proceed to your Logistics Hub operations?`,
              email: user.email || cleanEmail,
              primaryActionLabel: "Go to Campus Logistics Hub",
              onPrimaryAction: () => {
                if (onNavigateToLogistics) {
                  onNavigateToLogistics();
                } else {
                  handleGoToMarket();
                }
              },
              secondaryActionLabel: "Sign Out",
              onSecondaryAction: async () => {
                await signOut(auth);
                setErrorPopup(prev => ({ ...prev, isOpen: false }));
              }
            });
            setError("This email address is registered as a Logistics Partner account. Please use the Logistics Hub to access your fleet operations.");
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

            // User sign-in: if account is not verified, require verification immediately
            if (!userData.isVerified && !user.emailVerified && userData.role !== "admin") {
              const targetEmail = (userData.email || user.email || cleanEmail).trim().toLowerCase();
              const targetPhone = (userData.phoneNumber || phone || "").trim();

              setEmail(targetEmail);
              if (targetPhone) setPhone(targetPhone);
              setFullName(userData.displayName || "");

              if (targetPhone && targetPhone.length >= 7) {
                setIsVerificationChoice(true);
              } else {
                await handleSendEmailCode();
              }

              if (onVerificationScreenChange) {
                onVerificationScreenChange(true);
              }
              setLoading(false);
              return;
            }

            // Successful authentication: navigate into the platform immediately
            handleGoToMarket();
            return;
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
                    role: "buyer",
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
          
          if (role === "seller" && !businessName.trim()) {
            errors.businessName = "Business name is required for Vendor registration";
          }

          if (!email.trim()) {
            errors.email = "Email is required";
          } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email.trim())) {
              errors.email = "Please enter a valid email address.";
            }
          }

          if (!password) {
            errors.password = "Password is required";
          } else {
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/?]).{6,}$/;
            if (!passwordRegex.test(password)) {
              errors.password = "Password must be at least 6 characters long and contain uppercase, lowercase, number, and special character.";
            }
          }

          // Validate passwords match
          if (password !== confirmPassword) {
            errors.confirmPassword = "Passwords do not match.";
          }

          // Validate terms agreement
          if (!agreedToTerms) {
            errors.terms = "Please read and accept the Conditions of Use & Terms and Privacy Policy to continue.";
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
            const initialDisplayName = role === "seller" ? businessName.trim() : email.trim().split("@")[0];
            await updateProfile(firebaseUser, { displayName: initialDisplayName });

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

        const effectiveName = role === "seller" ? (businessName.trim() || "Vendor") : (email.trim().split("@")[0] || "Customer");
        const effectiveUsername = generateSmartUsername(effectiveName);
        const referralCode = generateReferralCode(effectiveName || "USER");
        const referredBy = referralCodeInput || localStorage.getItem('referredBy');

        const userProfile: UserProfile = {
          uid: firebaseUser.uid,
          displayName: effectiveName,
          businessName: role === "seller" ? businessName.trim() : "",
          username: effectiveUsername,
          email: firebaseUser.email || email.trim().toLowerCase(),
          phoneNumber: "",
          gender: gender,
          role: role === "seller" ? "seller" : "buyer",
          activeRole: role === "seller" ? "seller" : "buyer",
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
        
        // Add welcome notification for new user
        try {
          const welcomeNotification: Notification = {
            id: crypto.randomUUID(),
            userId: firebaseUser.uid,
            title: "Welcome to SHOPIVERSITY! 🎉",
            message: `Hi ${effectiveName}, your account has been successfully created. Welcome to your campus marketplace!`,
            type: "welcome",
            isRead: false,
            createdAt: new Date().toISOString()
          };
          await addDoc(collection(db, "notifications"), welcomeNotification);
        } catch (notifErr) {
          console.warn("Welcome notification notice:", notifErr);
        }

        // Direct Email Verification (No Phone SMS Verification)
                  // Email Verification
          const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
          let fallbackCode = "";
          let isLive = false;
          let noticeMessage = "";

          try {
            console.log(`[SIGNUP EMAIL] Dispatching email verification to ${cleanEmail}`);
            const vRes = await fetch("/api/send-verification", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: cleanEmail,
                code: verificationCode,
                userName: fullName || username
              })
            });
            const vData = await vRes.json();
            if (vData.sent) {
              isLive = true;
              noticeMessage = `Verification code sent to ${cleanEmail}!`;
            } else {
              fallbackCode = vData.code || verificationCode;
              noticeMessage = vData.notice || "Verification code generated.";
            }
          } catch (vErr) {
            console.warn("Email verification API dispatch notice:", vErr);
            fallbackCode = verificationCode;
          }

          setSentOtpCode(verificationCode);
          setEnteredOtpCode(fallbackCode || "");
          setOtpSentVia(isLive ? "brevo" : "fallback");
          setBrevoNotice(noticeMessage);
          setVerificationMethod("email");
          setIsVerifyingEmail(true);
          setIsVerifyingPhone(false);
          setIsVerificationChoice(false);
          setResendCooldown(30);
          setError("");
          if (onVerificationScreenChange) {
            onVerificationScreenChange(true);
          }
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
          setIsVerifyingEmail(false);
          if (onVerificationScreenChange) {
            onVerificationScreenChange(false);
          }
          if (onGoToMarket) {
            onGoToMarket();
          }
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
    const targetEmail = (email || currentAuthUser?.email || "").trim().toLowerCase();
    if (!targetEmail) {
      setError("No email address found to resend verification code.");
      return;
    }
    setResendingCode(true);
    setError("");
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();

    try {
      const vRes = await fetch("/api/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: targetEmail,
          code: newCode,
          userName: fullName || username || currentAuthUser?.displayName || "Student"
        })
      });
      const vData = await vRes.json();
      setSentOtpCode(newCode);
      if (vData.sent) {
        setOtpSentVia("brevo");
        setError(`Fresh 6-digit verification code dispatched to ${targetEmail} via Brevo!`);
      } else {
        setOtpSentVia("fallback");
        setEnteredOtpCode(vData.code || newCode);
        setError(`New verification code: ${vData.code || newCode} (Brevo setup mode)`);
      }
      setResendCooldown(30);

      // Also trigger Firebase link in parallel
      if (currentAuthUser) {
        try {
          await sendEmailVerification(currentAuthUser, { url: window.location.origin, handleCodeInApp: false });
        } catch (e) {}
      }
    } catch (err: any) {
      console.error("Resend Brevo verification error:", err);
      setError("Failed to resend verification email. Please try again in a moment.");
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

      // Dispatch Brevo verification to new email
      const newCode = Math.floor(100000 + Math.random() * 900000).toString();
      try {
        const vRes = await fetch("/api/send-verification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: trimmed,
            code: newCode,
            userName: fullName || username || currentAuthUser.displayName || "Student"
          })
        });
        const vData = await vRes.json();
        setSentOtpCode(newCode);
        if (vData.fallback && vData.code) {
          setEnteredOtpCode(vData.code);
        }
      } catch (bErr) {
        console.warn("Brevo new email dispatch notice:", bErr);
      }

      setShowChangeEmail(false);
      setNewEmailInput("");
      setResendCooldown(30);
      setError(`Email updated to ${trimmed}! Verification code dispatched via Brevo.`);
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
    const targetEmail = (email || auth.currentUser?.email || "").trim().toLowerCase();

    try {
      let currentAuthUser = auth.currentUser;
      if (!currentAuthUser && email && password) {
        const userCredential = await createUserWithEmailAndPassword(auth, targetEmail, password);
        currentAuthUser = userCredential.user;
        if (fullName) {
          await updateProfile(currentAuthUser, { displayName: fullName });
        }
      }

      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      let fallbackCode = "";
      let isBrevoLive = false;

      const vRes = await fetch("/api/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: targetEmail,
          code: verificationCode,
          userName: fullName || username || currentAuthUser?.displayName || "Student"
        })
      });
      const vData = await vRes.json();
      if (vData.sent) {
        isBrevoLive = true;
      }
      if (vData.fallback && vData.code) {
        fallbackCode = vData.code;
      }

      setSentOtpCode(verificationCode);
      setEnteredOtpCode(fallbackCode || "");
      setOtpSentVia(isBrevoLive ? "brevo" : "fallback");
      setVerificationMethod("email");
      setIsVerifyingEmail(true);
      setIsVerifyingPhone(false);
      setIsVerificationChoice(false);
      setResendCooldown(30);
      if (onVerificationScreenChange) {
        onVerificationScreenChange(true);
      }
    } catch (err: any) {
      console.error("Brevo send-verification error:", err);
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

    const phoneCode = Math.floor(100000 + Math.random() * 900000).toString();

    try {
      console.log(`[BREVO SMS] Dispatching phone SMS verification to ${fullPhoneNumber}...`);
      const pRes = await fetch("/api/send-phone-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: fullPhoneNumber,
          code: phoneCode,
          userName: fullName || username || "Student"
        })
      });
      const pData = await pRes.json();

      setSentOtpCode(phoneCode);
      setEnteredOtpCode(pData.fallback && pData.code ? pData.code : "");
      setOtpSentVia(pData.sent ? "brevo" : "fallback");
      setVerificationMethod("phone");
      setIsVerifyingPhone(true);
      setIsVerifyingEmail(false);
      setIsVerificationChoice(false);
      setResendCooldown(30);

      if (pData.sent) {
        setError(`SMS verification code delivered to ${fullPhoneNumber} via Brevo! Enter the 6-digit code.`);
      } else {
        setError(`SMS verification code: ${pData.code || phoneCode} (Brevo test/setup mode)`);
      }
    } catch (err: any) {
      console.error("Brevo phone auth dispatch error:", err);
      setError("Could not dispatch SMS. Falling back to Email verification.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtpCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const codeToVerify = (enteredOtpCode || verificationInput).trim();
    if (codeToVerify.length !== 6) {
      setError("Please enter the full 6-digit verification code.");
      return;
    }

    setVerifyingOtp(true);
    setLoading(true);
    setError("");

    const targetEmail = (email || auth.currentUser?.email || "").trim().toLowerCase();
    const rawDigits = phone.replace(/\D/g, "");
    const fullPhoneNumber = phonePrefix === "+234" && rawDigits.startsWith("0")
      ? `+234${rawDigits.slice(1)}`
      : `${phonePrefix}${rawDigits}`;

    const identifier = verificationMethod === "phone" ? fullPhoneNumber : targetEmail;

    try {
      let isCodeValid = false;

      // 1. Verify via server verification store
      try {
        const verifyRes = await fetch("/api/verify-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            identifier,
            code: codeToVerify
          })
        });
        const vData = await verifyRes.json();
        if (vData.success && vData.verified) {
          isCodeValid = true;
        }
      } catch (apiErr) {
        console.warn("Verify code API notice:", apiErr);
      }

      // 2. Fallback check with sentOtpCode if server network or test mode
      if (!isCodeValid && sentOtpCode && sentOtpCode === codeToVerify) {
        isCodeValid = true;
      }

      if (!isCodeValid) {
        setError("Invalid or expired 6-digit verification code. Please check and try again.");
        setVerifyingOtp(false);
        setLoading(false);
        return;
      }

      // Success! Update Firestore profile
      const currentUid = auth.currentUser?.uid;
      if (currentUid) {
        try {
          await updateDoc(doc(db, "users", currentUid), {
            isVerified: true,
            emailVerified: true
          });
        } catch (uErr) {
          console.warn("User doc verification update notice:", uErr);
        }
      }

      setIsVerificationSuccess(true);
      setError("");

      setTimeout(() => {
        setIsVerifyingEmail(false);
        setIsVerifyingPhone(false);
        setIsVerificationChoice(false);
        if (onVerificationScreenChange) {
          onVerificationScreenChange(false);
        }
        handleGoToMarket();
      }, 1200);
    } catch (err: any) {
      console.error("Verification error:", err);
      setError("Failed to verify code. Please try again.");
    } finally {
      setVerifyingOtp(false);
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

    const isDedicatedLogisticsUser = userDoc.exists() && (userDoc.data()?.role === "logistics" || userDoc.data()?.state === "Logistics Partner") && userDoc.data()?.role !== "buyer" && userDoc.data()?.role !== "seller" && userDoc.data()?.role !== "both";

    if (isDedicatedLogisticsUser) {
      setErrorPopup({
        isOpen: true,
        type: "logistics_mismatch",
        title: "Logistics Partner Account Detected",
        message: `This Google account (${user.email}) is registered as a Campus Logistics Fleet Partner. Would you like to proceed to the Campus Logistics Hub?`,
        email: user.email,
        primaryActionLabel: "Go to Campus Logistics Hub",
        onPrimaryAction: () => {
          if (onNavigateToLogistics) {
            onNavigateToLogistics();
          } else {
            handleGoToMarket();
          }
        },
        secondaryActionLabel: "Sign Out",
        onSecondaryAction: async () => {
          await signOut(auth);
          setErrorPopup(prev => ({ ...prev, isOpen: false }));
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
        role: role === "seller" ? "seller" : "buyer",
        activeRole: role === "seller" ? "seller" : "buyer",
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
        handleGoToMarket();
        return;
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

      // Existing verified user logged in via Google: proceed directly to market
      handleGoToMarket();
      return;
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
            role: sandboxRole === "buyer" ? "buyer" : "seller",
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

  // Live ID Document Scanner State & Methods
  const [isIdScannerOpen, setIsIdScannerOpen] = React.useState(false);
  const scannerVideoRef = React.useRef<HTMLVideoElement | null>(null);
  const scannerStreamRef = React.useRef<MediaStream | null>(null);
  const [isScanningLive, setIsScanningLive] = React.useState(false);
  const [scannerError, setScannerError] = React.useState("");

  const startIdScanner = async () => {
    setScannerError("");
    setIsIdScannerOpen(true);
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        setScannerError("Camera streaming is not supported on this browser. Please upload your ID file instead.");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      scannerStreamRef.current = stream;
      if (scannerVideoRef.current) {
        scannerVideoRef.current.srcObject = stream;
        scannerVideoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.warn("Scanner camera access notice:", err);
      setScannerError("Camera permission was denied or unavailable. Please upload a clear photo of your ID.");
    }
  };

  const stopIdScanner = () => {
    if (scannerStreamRef.current) {
      scannerStreamRef.current.getTracks().forEach(track => track.stop());
      scannerStreamRef.current = null;
    }
    setIsIdScannerOpen(false);
    setIsScanningLive(false);
  };

  const captureAndScanIdDocument = async () => {
    if (!scannerVideoRef.current) return;
    setIsScanningLive(true);
    setScannerError("");
    try {
      const video = scannerVideoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context failed");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64 = canvas.toDataURL("image/jpeg", 0.88);

      // Call server Gemini ID verification
      const res = await fetch("/api/gemini/verify-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64,
          fullName: fullName || auth.currentUser?.displayName || "Student Seller",
          schoolName: schoolName || "Campus",
          state,
          city
        })
      });
      const result = await res.json();
      if (result.matches) {
        setVerificationIdUrl(base64);
        setIdVerificationError("");
        stopIdScanner();
      } else {
        setScannerError(result.reason || "Could not read ID card. Please ensure the card is in focus, well lit, and fully inside the frame.");
      }
    } catch (err: any) {
      console.error("ID Scan error:", err);
      setScannerError("Failed to scan document. Please hold steady and try again or upload a photo.");
    } finally {
      setIsScanningLive(false);
    }
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
                    setIsVerificationSuccess(false);
                    setIsVerificationChoice(false);
                    setIsVerifyingEmail(false);
                    setIsVerifyingPhone(false);
                    handleGoToMarket();
                  }}
                  className="w-full h-11 bg-brand-gradient text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 border-none"
                >
                  Continue to Marketplace →
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
                  
                  {/* ID Scanner & Upload */}
                  <div className="space-y-2 text-left">
                    <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest ml-1 font-sans">
                      Official ID Verification (Required for Sellers)
                    </label>

                    {isIdScannerOpen ? (
                      <div className="bg-black p-3.5 rounded-2xl border-2 border-orange-500 space-y-3">
                        <div className="flex items-center justify-between text-white text-xs font-bold px-1">
                          <span className="flex items-center gap-1.5 text-orange-400">
                            <Scan className="w-4 h-4 animate-pulse" />
                            Live ID Card Scanner
                          </span>
                          <button
                            type="button"
                            onClick={stopIdScanner}
                            className="text-[11px] text-slate-400 hover:text-white bg-white/10 px-2 py-0.5 rounded cursor-pointer border-none"
                          >
                            Close
                          </button>
                        </div>

                        {/* Camera Viewfinder */}
                        <div className="relative w-full aspect-[16/10] bg-black rounded-xl overflow-hidden shadow-inner flex items-center justify-center border border-white/20">
                          <video ref={scannerVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />

                          {/* Bounding Box Frame */}
                          <div className="absolute inset-3 border-2 border-dashed border-white/60 rounded-xl pointer-events-none flex flex-col justify-between p-2">
                            <div className="flex justify-between">
                              <div className="w-4 h-4 border-t-2 border-l-2 border-orange-500 rounded-tl" />
                              <div className="w-4 h-4 border-t-2 border-r-2 border-orange-500 rounded-tr" />
                            </div>

                            <p className="text-[10px] text-white font-bold text-center bg-black/60 px-2 py-0.5 rounded-full mx-auto self-center">
                              Fit ID Card in Box
                            </p>

                            <div className="flex justify-between">
                              <div className="w-4 h-4 border-b-2 border-l-2 border-orange-500 rounded-bl" />
                              <div className="w-4 h-4 border-b-2 border-r-2 border-orange-500 rounded-br" />
                            </div>

                            {/* Animated Laser Line */}
                            <motion.div
                              animate={{ y: ["0%", "100%", "0%"] }}
                              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                              className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_8px_rgba(239,68,68,0.9)] pointer-events-none"
                            />
                          </div>
                        </div>

                        {scannerError && (
                          <p className="text-[11px] text-red-400 font-bold px-1">{scannerError}</p>
                        )}

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={captureAndScanIdDocument}
                            disabled={isScanningLive}
                            className="flex-1 h-9 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none disabled:opacity-50"
                          >
                            {isScanningLive ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Scanning with AI...</span>
                              </>
                            ) : (
                              <>
                                <Camera className="w-3.5 h-3.5" />
                                <span>Capture &amp; Scan ID</span>
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={stopIdScanner}
                            className="px-3 h-9 bg-white/10 text-white rounded-lg text-xs font-bold border-none cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={startIdScanner}
                            disabled={isVerifyingId}
                            className="h-9 px-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer border-none shadow-xs"
                          >
                            <Scan className="w-3.5 h-3.5" />
                            <span>Scan with Camera</span>
                          </button>

                          <label className="h-9 px-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200 dark:border-zinc-700">
                            <Upload className="w-3.5 h-3.5 text-orange-600" />
                            <span>Upload File</span>
                            <input type="file" accept="image/*" onChange={handleIdUpload} className="hidden" disabled={isVerifyingId} />
                          </label>
                        </div>

                        {/* ID Upload & Preview Box */}
                        <div className={cn(
                          "border border-dashed rounded-lg p-3.5 flex flex-col items-center justify-center transition-colors relative overflow-hidden",
                          idVerificationError ? "border-red-300 bg-red-50 dark:bg-red-900/10" : "border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/20"
                        )}>
                          {isVerifyingId ? (
                            <div className="flex flex-col items-center text-center py-2">
                              <Loader2 className="w-7 h-7 text-orange-500 animate-spin mb-1.5" />
                              <p className="text-xs font-bold text-slate-600 dark:text-zinc-300">Scanning ID with AI...</p>
                            </div>
                          ) : verificationIdUrl ? (
                            <div className="text-center w-full py-1">
                              <img src={verificationIdUrl} alt="ID Preview" className="h-24 mx-auto object-contain rounded shadow-xs mb-1" />
                              <div className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>ID Document Verified Successfully</span>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-2 text-slate-500 dark:text-zinc-400">
                              <Scan className="w-6 h-6 mx-auto mb-1 text-slate-400" />
                              <p className="text-xs font-medium">Use "Scan with Camera" or upload a clear card photo</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {idVerificationError && (
                      <p className="text-[10px] text-red-500 font-bold px-1 leading-snug">{idVerificationError}</p>
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
                    <p className="text-xs text-slate-500 dark:text-zinc-400">Choose your preferred verification method</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <button 
                    onClick={handleSendEmailCode}
                    disabled={loading}
                    className="p-4 bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-800 rounded-2xl hover:border-orange-500 transition-all flex items-center gap-3 text-left w-full group cursor-pointer"
                  >
                    <div className="w-10 h-10 bg-white dark:bg-zinc-900 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-orange-500 transition-colors border border-slate-200 dark:border-zinc-700 shadow-sm shrink-0">
                      <Mail className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-slate-900 dark:text-zinc-100">Email Verification</p>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300">Email OTP</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 truncate">{email}</p>
                    </div>
                  </button>

                  <button 
                    onClick={handleSendPhoneCode}
                    disabled={loading}
                    className="p-4 bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-800 rounded-2xl hover:border-emerald-500 transition-all flex items-center gap-3 text-left w-full group cursor-pointer"
                  >
                    <div className="w-10 h-10 bg-white dark:bg-zinc-900 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-emerald-500 transition-colors border border-slate-200 dark:border-zinc-700 shadow-sm shrink-0">
                      <Phone className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-slate-900 dark:text-zinc-100">Phone SMS Verification</p>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">SMS OTP</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 font-mono">{phonePrefix}{phone}</p>
                    </div>
                  </button>
                </div>

                <div className="pt-2 flex items-center justify-start text-xs">
                  <button 
                    type="button"
                    onClick={() => setIsVerificationChoice(false)}
                    className="text-slate-500 hover:underline"
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
                {/* Instant Verification Channel Switcher */}
                

                {/* Header Badge */}
                <div className="flex flex-col items-center justify-center pt-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 text-[11px] font-black uppercase tracking-wider border border-orange-200 dark:border-orange-800 mb-3 shadow-sm">
                    <Mail className="w-3.5 h-3.5 text-orange-600" />
                    Official Email Security Verification
                  </div>

                  <div className="w-14 h-14 bg-gradient-to-tr from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-500/25 mb-3 ring-4 ring-orange-100 dark:ring-orange-950/40 animate-pulse">
                    <Mail className="w-7 h-7" />
                  </div>

                  <h3 className="text-xl font-black text-slate-900 dark:text-zinc-100 leading-tight">
                    Verify Your Email Address
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-zinc-300 mt-1.5 max-w-sm mx-auto leading-relaxed">
                    We sent a 6-digit confirmation code to: <br />
                    <span className="font-extrabold text-orange-600 dark:text-orange-400 break-all text-sm">
                      {email || auth.currentUser?.email}
                    </span>
                  </p>
                </div>

                {/* Verification Code Helper Banner */}
                {otpSentVia === "fallback" && (
                  <div className="p-3.5 bg-orange-50/80 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/60 rounded-2xl text-left space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-extrabold text-orange-950 dark:text-orange-200 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-orange-600" />
                        Verification PIN Ready
                      </span>
                    </div>
                    <p className="text-[11px] text-orange-900 dark:text-orange-300 leading-relaxed">
                      Your 6-digit verification code is ready. Use the button below to auto-fill or enter manually:
                    </p>
                    <div className="flex items-center justify-between bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-orange-200 dark:border-orange-700 shadow-sm">
                      <span className="font-mono text-xl font-black tracking-widest text-orange-600">
                        {sentOtpCode || "123456"}
                      </span>
                      <button
                        type="button"
                        onClick={() => setEnteredOtpCode(sentOtpCode || "123456")}
                        className="px-3 py-1 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold cursor-pointer transition-all shadow"
                      >
                        Auto-Fill Code
                      </button>
                    </div>
                  </div>
                )}

                {/* Status / Error Toast */}
                {error && (
                  <div className={cn(
                    "p-3.5 border rounded-xl text-xs leading-relaxed font-semibold text-left transition-all",
                    error.toLowerCase().includes("verified") || error.toLowerCase().includes("resent") || error.toLowerCase().includes("dispatched")
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300" 
                      : "bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300"
                  )}>
                    <p className="flex items-start gap-2">
                      {error.toLowerCase().includes("verified") ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      )}
                      <span>{error}</span>
                    </p>
                  </div>
                )}

                {/* 6-Digit Code Input Form */}
                <form onSubmit={handleVerifyOtpCode} className="space-y-4">
                  <div className="space-y-2 text-left">
                    <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider text-center">
                      Enter 6-Digit Verification Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={enteredOtpCode}
                      onChange={(e) => setEnteredOtpCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="• • • • • •"
                      className="w-full h-14 bg-slate-50 dark:bg-zinc-900 border-2 border-slate-300 dark:border-zinc-700 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-2xl text-center text-2xl font-mono font-black tracking-[0.4em] text-slate-900 dark:text-white outline-none transition-all shadow-inner"
                    />
                  </div>

                  {isVerificationSuccess ? (
                    <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center justify-center gap-2 animate-in zoom-in-95">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span>Email Verified Successfully! Entering marketplace...</span>
                    </div>
                  ) : (
                    <button
                      type="submit"
                      disabled={verifyingOtp || enteredOtpCode.length !== 6}
                      className="w-full h-12 bg-orange-600 hover:bg-orange-500 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-lg shadow-orange-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {verifyingOtp ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Verifying Code...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Verify Code &amp; Complete Signup
                        </>
                      )}
                    </button>
                  )}
                </form>

                {/* Action Buttons */}
                <div className="space-y-2.5 pt-1">
                  {/* Resend Verification Code */}
                  <button 
                    type="button"
                    onClick={handleResendVerificationEmail}
                    disabled={resendingCode || resendCooldown > 0}
                    className="w-full h-11 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200 font-bold rounded-xl border border-slate-300 dark:border-zinc-700 transition-all text-xs shadow-sm flex items-center justify-center gap-2 cursor-pointer touch-manipulation disabled:opacity-50"
                  >
                    {resendingCode ? (
                      <Loader2 className="w-4 h-4 animate-spin text-slate-700" />
                    ) : (
                      <RefreshCw className="w-4 h-4 text-orange-600" />
                    )}
                    <span>
                      {resendCooldown > 0 ? `Resend Code in ${resendCooldown}s` : "Resend Code"}
                    </span>
                  </button>

                  {/* Switch to Phone Verification */}
                  <button 
                    type="button"
                    onClick={handleSendPhoneCode}
                    disabled={loading}
                    className="w-full h-11 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-100 font-bold rounded-xl flex items-center justify-center gap-2 text-xs border border-slate-200 dark:border-zinc-700 transition-all cursor-pointer"
                  >
                    <Phone className="w-4 h-4 text-emerald-600" />
                    <span>Verify via Phone SMS Instead</span>
                  </button>


                  {/* Change Email Toggle / Form */}
                  {!showChangeEmail ? (
                    <button 
                      type="button"
                      onClick={() => {
                        setShowChangeEmail(true);
                        setNewEmailInput(email || auth.currentUser?.email || "");
                      }}
                      className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline cursor-pointer pt-1 block mx-auto touch-manipulation"
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
                        className="w-full h-10 px-3 bg-white dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-orange-500"
                      />
                      <div className="flex gap-2 pt-1">
                        <button 
                          type="submit"
                          disabled={loading}
                          className="flex-1 h-9 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg text-xs transition-all touch-manipulation cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Update & Send Code"}
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
                </div>
              </motion.div>
            ) : isVerifyingPhone ? (
              <motion.div 
                key="verify-phone"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-5 text-center font-sans"
              >
                {/* Instant Verification Channel Switcher */}
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-zinc-800/90 rounded-xl mb-3 border border-slate-200/70 dark:border-zinc-700/70">
                  <button
                    type="button"
                    onClick={handleSendEmailCode}
                    disabled={loading}
                    className="min-h-[36px] py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 cursor-pointer touch-manipulation transition-all"
                  >
                    <Mail className="w-3.5 h-3.5 text-orange-600" />
                    <span>Switch to Email</span>
                  </button>
                  <div className="min-h-[36px] py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 bg-white dark:bg-zinc-900 text-emerald-600 shadow-sm border border-slate-200/80 dark:border-zinc-700 select-none">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Phone SMS</span>
                  </div>
                </div>

                {/* Header Badge */}
                <div className="flex flex-col items-center justify-center pt-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[11px] font-black uppercase tracking-wider border border-emerald-200 dark:border-emerald-800 mb-3 shadow-sm">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    Official Phone SMS Verification
                  </div>

                  <div className="w-14 h-14 bg-gradient-to-tr from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/25 mb-3 ring-4 ring-emerald-100 dark:ring-emerald-950/40 animate-pulse">
                    <Phone className="w-7 h-7" />
                  </div>

                  <h3 className="text-xl font-black text-slate-900 dark:text-zinc-100 leading-tight">
                    Check Your Phone for SMS
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-zinc-300 mt-1.5 max-w-sm mx-auto leading-relaxed">
                    We dispatched a 6-digit verification SMS code to: <br />
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                      {phonePrefix === "+234" && phone.startsWith("0") ? `+234${phone.replace(/\D/g, "").slice(1)}` : `${phonePrefix}${phone}`}
                    </span>
                  </p>
                </div>

                {/* Verification Code Helper Banner */}
                {otpSentVia === "fallback" && (
                  <div className="p-3.5 bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl text-left space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-extrabold text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        SMS Code Ready
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-900 dark:text-emerald-300 leading-relaxed">
                      Your 6-digit SMS verification code is ready. Auto-fill or enter manually below:
                    </p>
                    <div className="flex items-center justify-between bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-emerald-200 dark:border-emerald-700 shadow-sm">
                      <span className="font-mono text-xl font-black tracking-widest text-emerald-600">
                        {sentOtpCode || "123456"}
                      </span>
                      <button
                        type="button"
                        onClick={() => setEnteredOtpCode(sentOtpCode || "123456")}
                        className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer transition-all shadow"
                      >
                        Auto-Fill Code
                      </button>
                    </div>
                  </div>
                )}

                {/* Status / Error Toast */}
                {error && (
                  <div className={cn(
                    "p-3.5 border rounded-xl text-xs leading-relaxed font-semibold text-left transition-all",
                    error.toLowerCase().includes("verified") || error.toLowerCase().includes("sent") || error.toLowerCase().includes("delivered")
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300" 
                      : "bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300"
                  )}>
                    <p className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </p>
                  </div>
                )}

                {/* 6-Digit Code Input Form */}
                <form onSubmit={handleVerifyOtpCode} className="space-y-4">
                  <div className="space-y-2 text-left">
                    <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider text-center">
                      Enter 6-Digit SMS Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={enteredOtpCode}
                      onChange={(e) => setEnteredOtpCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="• • • • • •"
                      className="w-full h-14 bg-slate-50 dark:bg-zinc-900 border-2 border-slate-300 dark:border-zinc-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-2xl text-center text-2xl font-mono font-black tracking-[0.4em] text-slate-900 dark:text-white outline-none transition-all shadow-inner"
                    />
                  </div>

                  {isVerificationSuccess ? (
                    <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center justify-center gap-2 animate-in zoom-in-95">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span>Phone SMS Verified Successfully! Entering marketplace...</span>
                    </div>
                  ) : (
                    <button
                      type="submit"
                      disabled={verifyingOtp || enteredOtpCode.length !== 6}
                      className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {verifyingOtp ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Verifying SMS Code...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Verify SMS &amp; Activate Account
                        </>
                      )}
                    </button>
                  )}
                </form>

                {/* Action Buttons */}
                <div className="space-y-2.5 pt-1">
                  {/* Resend SMS Button */}
                  <button 
                    type="button"
                    onClick={handleSendPhoneCode}
                    disabled={loading || resendCooldown > 0}
                    className="w-full h-11 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200 font-bold rounded-xl border border-slate-300 dark:border-zinc-700 transition-all text-xs shadow-sm flex items-center justify-center gap-2 cursor-pointer touch-manipulation disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-slate-700" />
                    ) : (
                      <RefreshCw className="w-4 h-4 text-emerald-600" />
                    )}
                    <span>
                      {resendCooldown > 0 ? `Resend SMS in ${resendCooldown}s` : "Resend SMS"}
                    </span>
                  </button>

                  {/* Switch to Email Verification */}
                  <button 
                    type="button"
                    onClick={() => {
                      setIsVerifyingPhone(false);
                      setIsVerifyingEmail(true);
                      setVerificationMethod("email");
                    }}
                    className="w-full h-11 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-100 font-bold rounded-xl flex items-center justify-center gap-2 text-xs border border-slate-200 dark:border-zinc-700 transition-all cursor-pointer"
                  >
                    <Mail className="w-4 h-4 text-orange-600" />
                    <span>Switch to Email Verification</span>
                  </button>
                </div>
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
                  <div className="flex items-center gap-1.5 shrink-0">
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
                            : "text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200"
                        )}
                      >
                        <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                        <span>Customer</span>
                      </button>
                      <button 
                        type="button"
                        onClick={() => setRole("seller")}
                        className={cn(
                          "min-h-[38px] py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation active:scale-95 whitespace-nowrap",
                          role === "seller" 
                            ? "bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-zinc-800" 
                            : "text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200"
                        )}
                      >
                        <Store className="w-3.5 h-3.5 shrink-0" />
                        <span>Vendor</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium px-1 leading-relaxed">
                      💡 <strong>Note:</strong> Each account is strictly dedicated to either Customer or Vendor. If you need both, please register separate accounts using different email addresses.
                    </p>
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
                        {role === "seller" && (
                          <Input 
                            label="Business Name"
                            type="text" 
                            placeholder="e.g. Ade Tech Hub or Campus Treats" 
                            value={businessName} 
                            onChange={setBusinessName} 
                            required 
                            error={fieldErrors.businessName}
                          />
                        )}

                        <Input 
                          label="Email"
                          type="email" 
                          placeholder="name@example.com" 
                          value={email} 
                          onChange={setEmail} 
                          required 
                          error={fieldErrors.email}
                        />

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
                          label="Confirm Password"
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
                    <div className="pt-2 text-left">
                      <label className="flex items-start gap-2.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={agreedToTerms}
                          onChange={(e) => {
                            setAgreedToTerms(e.target.checked);
                            if (fieldErrors.terms) {
                              setFieldErrors(prev => {
                                const next = { ...prev };
                                delete next.terms;
                                return next;
                              });
                            }
                          }}
                          className="mt-0.5 w-4 h-4 rounded border-slate-300 dark:border-zinc-700 text-[#ff6b00] focus:ring-[#ff6b00] cursor-pointer shrink-0"
                          required
                        />
                        <span className="text-[11px] text-slate-600 dark:text-zinc-300 leading-normal font-medium">
                          I agree to the{" "}
                          <button 
                            type="button"
                            onClick={() => setShowTermsPage(true)}
                            className="text-[#ff6b00] dark:text-[#ff7f1a] hover:underline font-bold border-none bg-transparent cursor-pointer p-0"
                          >
                            Conditions of Use & Terms
                          </button>
                          , 72-Hour Escrow Protection Rules, and acknowledge the{" "}
                          <button 
                            type="button"
                            onClick={() => setShowPrivacyPage(true)}
                            className="text-[#ff6b00] dark:text-[#ff7f1a] hover:underline font-bold border-none bg-transparent cursor-pointer p-0"
                          >
                            Privacy Policy
                          </button>
                          . <span className="text-red-500 font-bold">*</span>
                        </span>
                      </label>
                      {fieldErrors.terms && (
                        <p className="text-[10px] font-bold text-red-500 mt-1 pl-6.5">{fieldErrors.terms}</p>
                      )}
                    </div>
                  )}

                  <div className="pt-2">
                    <button 
                      type="submit"
                      disabled={loading || isVerifyingId}
                      className="w-full min-h-[44px] sm:min-h-[42px] py-2.5 px-4 bg-gradient-to-b from-[#ffd814] to-[#f7ca00] hover:brightness-95 active:scale-[0.98] text-zinc-950 font-bold rounded-xl border border-[#a88734] transition-all text-xs sm:text-sm shadow-sm flex items-center justify-center gap-2 cursor-pointer touch-manipulation select-none whitespace-nowrap disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[#ff6b00] outline-none"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span>{isLogin ? "Sign In Securely" : "Agree & Create Account"}</span>
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
                    <div className="pt-2 flex flex-col items-center gap-1.5">
                      <button 
                        type="button"
                        onClick={handleGoToMarket}
                        className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline cursor-pointer"
                      >
                        You're signed in as {auth.currentUser.email || "current user"} — Enter Marketplace →
                      </button>
                      <button 
                        type="button"
                        onClick={async () => {
                          try { await signOut(auth); } catch (e) {}
                          setIsLogin(true);
                        }}
                        className="text-[11px] font-medium text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 hover:underline cursor-pointer"
                      >
                        Sign into a different account
                      </button>
                    </div>
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
                        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 text-[10px] font-black uppercase tracking-wider mb-1">
                          <Sparkles className="w-3 h-3 text-orange-500" />
                          Powered by Brevo
                        </div>
                        <h4 className="text-base font-bold text-slate-900 dark:text-white">Reset Email Dispatched!</h4>
                        <p className="text-xs text-slate-600 dark:text-zinc-300 font-medium leading-relaxed">
                          We've sent a branded password reset email with a 6-digit security code and secure password change link to <span className="font-bold text-slate-900 dark:text-white break-all">{resetEmail}</span> via Brevo.
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
                        Enter your registered email address below. We'll send you a password reset link and 6-digit security code directly via Brevo.
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
