import React from "react";
import { 
  Copy, 
  Users, 
  DollarSign, 
  ExternalLink, 
  Share2, 
  TrendingUp, 
  Gift, 
  ShieldAlert, 
  Check, 
  ArrowLeft, 
  Eye, 
  EyeOff,
  Building,
  CreditCard,
  ArrowUpRight,
  Loader2,
  Wallet,
  CheckCircle,
  Clock,
  XCircle,
  QrCode,
  Download
} from "lucide-react";
import { UserProfile } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { db } from "../firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc, increment } from "firebase/firestore";
import { cn } from "../lib/utils";

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
  { name: "Kuda Bank", code: "50211" }
];

interface ReferralDashboardProps {
  user: UserProfile | null;
  onBack?: () => void;
}

export default function ReferralDashboard({ user, onBack }: ReferralDashboardProps) {
  const [copied, setCopied] = React.useState(false);
  const [isCodeVisible, setIsCodeVisible] = React.useState(false);
  const [referredUsers, setReferredUsers] = React.useState<UserProfile[]>([]);
  const referralLink = typeof window !== "undefined" ? `${window.location.origin}/?ref=${user?.referralCode}` : "";
  const [showQRCode, setShowQRCode] = React.useState(false);
  const [downloadingQR, setDownloadingQR] = React.useState(false);

  const qrImageUrl = React.useMemo(() => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(referralLink)}`;
  }, [referralLink]);

  const handleDownloadQR = async () => {
    if (downloadingQR) return;
    setDownloadingQR(true);
    try {
      const response = await fetch(qrImageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `referral_qr_${user?.referralCode || "code"}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download QR code image directly, trying fallback:", err);
      window.open(qrImageUrl, "_blank");
    } finally {
      setDownloadingQR(false);
    }
  };

  // Cashout State
  const [showCashoutForm, setShowCashoutForm] = React.useState(false);
  const [bankName, setBankName] = React.useState("");
  const [accountNumber, setAccountNumber] = React.useState("");
  const [accountName, setAccountName] = React.useState("");
  const [bankSearchQuery, setBankSearchQuery] = React.useState("");
  const [showBankDropdown, setShowBankDropdown] = React.useState(false);
  
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [isSubmittingCashout, setIsSubmittingCashout] = React.useState(false);
  const [banks, setBanks] = React.useState<{ name: string; code: string }[]>(FALLBACK_BANKS);
  const [payoutHistory, setPayoutHistory] = React.useState<any[]>([]);
  const [showHistory, setShowHistory] = React.useState(false);

  // Listen to referred friends
  React.useEffect(() => {
    if (!user?.referralCode) return;

    const q = query(
      collection(db, "users"),
      where("referredBy", "==", user.referralCode)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
      setReferredUsers(users);
    }, (err) => {
      console.error("Error fetching referred users:", err);
    });

    return () => unsubscribe();
  }, [user?.referralCode]);

  // Fetch banks from Paystack API
  React.useEffect(() => {
    const fetchBanks = async () => {
      try {
        const res = await fetch("/api/paystack/banks");
        const data = await res.json();
        if (data && data.status && Array.isArray(data.data)) {
          const formatted = data.data.map((b: any) => ({ name: b.name, code: b.code }));
          setBanks(formatted);
        }
      } catch (err) {
        console.error("Error fetching banks, using fallbacks:", err);
      }
    };
    fetchBanks();
  }, []);

  // Listen to Referral Cashout History
  React.useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, "payoutRequests"),
      where("sellerId", "==", user.uid),
      where("payoutType", "==", "referral")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const history = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      history.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setPayoutHistory(history);
    }, (err) => {
      console.error("Error fetching payout history:", err);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Automatically resolve account name
  React.useEffect(() => {
    const resolveAccount = async () => {
      if (accountNumber.length === 10 && bankName) {
        setIsVerifying(true);
        try {
          const bankCode = banks.find(b => b.name === bankName)?.code;
          if (bankCode) {
            const res = await fetch(`/api/paystack/resolve-bank/${bankCode}/${accountNumber}`);
            const data = await res.json();
            if (data.status) {
              setAccountName(data.data.account_name);
            } else {
              setAccountName("");
            }
          }
        } catch (err) {
          console.error("Error resolving bank details:", err);
          setAccountName("");
        } finally {
          setIsVerifying(false);
        }
      } else {
        setAccountName("");
      }
    };

    resolveAccount();
  }, [accountNumber, bankName, banks]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCashoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;

    const withdrawable = user.referralWalletBalance || 0;
    if (withdrawable < 1000) {
      alert("You can only cashout when your referral balance is ₦1,000 or more.");
      return;
    }

    if (!bankName) {
      alert("Please select a bank.");
      return;
    }

    if (!accountNumber || accountNumber.length < 10) {
      alert("Please enter a valid account number.");
      return;
    }

    if (!accountName) {
      alert("Please verify your account details. Account name must be resolved before proceeding.");
      return;
    }

    setIsSubmittingCashout(true);
    try {
      // 1. Deduct referral balance from user's document
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        referralWalletBalance: increment(-withdrawable)
      });

      // 2. Submit payoutRequest
      await addDoc(collection(db, "payoutRequests"), {
        sellerId: user.uid,
        sellerName: user.displayName || "Referrer",
        amount: withdrawable,
        status: "pending",
        payoutType: "referral",
        bankDetails: {
          bankName,
          accountNumber,
          accountName
        },
        createdAt: new Date().toISOString()
      });

      // 3. Add Notification
      await addDoc(collection(db, "notifications"), {
        userId: user.uid,
        title: "Referral Cashout Submitted! 💸",
        message: `Your referral cashout request for ₦${withdrawable.toLocaleString()} is processing.`,
        type: "payout",
        isRead: false,
        createdAt: new Date().toISOString()
      });

      alert(`Cashout request of ₦${withdrawable.toLocaleString()} submitted successfully!`);
      setShowCashoutForm(false);
      setAccountNumber("");
      setAccountName("");
      setBankName("");
    } catch (err) {
      console.error("Cashout request submission error:", err);
      alert("Failed to request cashout. Please try again.");
    } finally {
      setIsSubmittingCashout(false);
    }
  };

  const filteredBanks = banks.filter(b => 
    b.name.toLowerCase().includes(bankSearchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-black text-slate-900 dark:text-white italic tracking-tighter">Referral Program</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Earn passive income by inviting your campus friends</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Referral Stats */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-8 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center text-purple-600">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Commission Rate</p>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">1.3% <span className="text-sm font-medium text-slate-500">of platform fee</span></h3>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Referrals</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">{user?.referralCount || 0}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Earnings</p>
                <p className="text-2xl font-black text-emerald-600 tracking-tighter">₦{(user?.referralEarnings || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
             <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-800/30 flex items-start gap-3">
                <Gift className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                <p className="text-xs font-medium text-emerald-800 dark:text-emerald-400 leading-relaxed">
                  Earn passive commissions on every successful purchase your referred friends make on the platform.
                </p>
             </div>
          </div>
        </div>

        {/* Referral Wallet & Cashout */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-purple-600" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Referral Balance</span>
              </div>
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider",
                (user?.referralWalletBalance || 0) >= 1000 
                  ? "bg-emerald-100 text-emerald-700" 
                  : "bg-amber-100 text-amber-700"
              )}>
                {(user?.referralWalletBalance || 0) >= 1000 ? "Ready to Cashout" : "Min ₦1,000"}
              </span>
            </div>

            <div className="space-y-1">
              <p className="text-3xl font-black text-slate-950 dark:text-white tracking-tighter">
                ₦{(user?.referralWalletBalance || 0).toLocaleString()}
              </p>
              <p className="text-xs text-slate-500 font-medium leading-normal">
                This balance can be withdrawn directly to any local bank account of your choice.
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            {showCashoutForm ? (
              <button
                onClick={() => setShowCashoutForm(false)}
                className="w-full py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black text-xs uppercase tracking-wider rounded-2xl hover:bg-slate-200 transition-all"
              >
                Cancel Cashout
              </button>
            ) : (
              <button
                onClick={() => setShowCashoutForm(true)}
                disabled={(user?.referralWalletBalance || 0) < 1000}
                className={cn(
                  "w-full py-3.5 font-black text-xs uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 disabled:scale-100",
                  (user?.referralWalletBalance || 0) >= 1000
                    ? "bg-purple-600 hover:bg-purple-700 hover:shadow-purple-600/20 text-white"
                    : "bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none"
                )}
              >
                <CreditCard className="w-4 h-4" />
                {(user?.referralWalletBalance || 0) >= 1000 ? "Cashout Now" : "Cashout (Min ₦1,000)"}
              </button>
            )}

            {payoutHistory.length > 0 && (
              <button
                onClick={() => setShowBankDropdown(false) || setShowCashoutForm(false) || setShowHistory(!showHistory)}
                className="w-full py-2.5 border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all text-slate-500"
              >
                {showHistory ? "Hide Cashout History" : `View Cashout History (${payoutHistory.length})`}
              </button>
            )}
          </div>
        </div>

        {/* Share Section */}
        <div className="bg-brand-gradient rounded-[2.5rem] p-8 text-white relative overflow-hidden group flex flex-col justify-between">
          <div className="relative z-10 space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md mb-4">
                <Share2 className="w-3 h-3" />
                Share Your Link
              </div>
              <h3 className="text-2xl font-black italic tracking-tighter !text-white">Spread the word</h3>
              <p className="text-purple-100 font-medium text-xs leading-relaxed">Every new user who joins using your link contributes to your passive income earnings.</p>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 flex flex-col gap-1.5">
                <p className="text-[9px] font-black uppercase tracking-widest opacity-70">Referral Link</p>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-mono truncate opacity-90">{referralLink}</span>
                  <button 
                    onClick={() => copyToClipboard(referralLink)}
                    className="p-1.5 bg-white text-purple-600 rounded-lg hover:scale-110 active:scale-95 transition-all shrink-0 flex items-center gap-1"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              
              <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 flex flex-col gap-1.5">
                <p className="text-[9px] font-black uppercase tracking-widest opacity-70">Unique Code</p>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-lg font-black font-mono tracking-tighter">
                    {isCodeVisible ? (user?.referralCode || "---") : "••••••"}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => setIsCodeVisible(!isCodeVisible)}
                      className="p-1.5 bg-white/20 text-white rounded-lg hover:bg-white hover:text-purple-600 transition-all"
                    >
                      {isCodeVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button 
                      onClick={() => copyToClipboard(user?.referralCode || "")}
                      className="p-1.5 bg-white text-purple-600 rounded-lg hover:scale-110 active:scale-95 transition-all shrink-0 flex items-center"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* QR Code Segment for Easy Campus Sharing */}
              <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 flex flex-col gap-2 transition-all">
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-black uppercase tracking-widest opacity-70 flex items-center gap-1.5">
                    <QrCode className="w-3 h-3 text-white" />
                    <span>Campus QR Code</span>
                  </p>
                  <button
                    onClick={() => setShowQRCode(!showQRCode)}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/20 hover:bg-white hover:text-purple-600 transition-all cursor-pointer"
                  >
                    {showQRCode ? "Hide QR" : "Show QR"}
                  </button>
                </div>

                {showQRCode && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-3 bg-white text-slate-900 p-4 rounded-xl shadow-inner mt-1 text-center"
                  >
                    <p className="text-[10px] font-black tracking-tight text-slate-500 uppercase leading-none">
                      Scan to Register on Campus
                    </p>
                    <div className="relative w-36 h-36 bg-slate-50 rounded-lg flex items-center justify-center p-2 border border-slate-100">
                      <img 
                        src={qrImageUrl} 
                        alt="Referral QR Code" 
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <button
                      onClick={handleDownloadQR}
                      disabled={downloadingQR}
                      className="w-full h-8 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                    >
                      {downloadingQR ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Download className="w-3 h-3" />
                      )}
                      <span>Download PNG</span>
                    </button>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
          
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-white/20 transition-all duration-1000 pointer-events-none" />
        </div>
      </div>

      {/* Cashout and History Section (Expandable UI) */}
      <AnimatePresence mode="wait">
        {showCashoutForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-purple-600" />
                <h3 className="text-xl font-black italic tracking-tighter text-slate-900 dark:text-white">Cashout Details</h3>
              </div>

              <form onSubmit={handleCashoutSubmit} className="space-y-4 max-w-xl">
                {/* Bank Selector */}
                <div className="space-y-2 relative">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Bank</label>
                  <button
                    type="button"
                    onClick={() => setShowBankDropdown(!showBankDropdown)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800 text-left rounded-2xl border border-slate-150 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300"
                  >
                    <span>{bankName || "Choose your bank"}</span>
                    <Building className="w-4 h-4 text-slate-400" />
                  </button>

                  {showBankDropdown && (
                    <div className="absolute z-20 left-0 right-0 mt-2 p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl space-y-3 max-h-60 overflow-y-auto">
                      <input
                        type="text"
                        placeholder="Search bank name..."
                        value={bankSearchQuery}
                        onChange={(e) => setBankSearchQuery(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-150 dark:border-slate-700 text-xs font-semibold"
                      />
                      <div className="space-y-1">
                        {filteredBanks.map((b, idx) => (
                          <button
                            key={`${b.code}-${idx}`}
                            type="button"
                            onClick={() => {
                              setBankName(b.name);
                              setShowBankDropdown(false);
                            }}
                            className={cn(
                              "w-full text-left px-3 py-2 text-xs font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors",
                              bankName === b.name ? "bg-purple-50 text-purple-600 dark:bg-purple-950/20" : "text-slate-600 dark:text-slate-400"
                            )}
                          >
                            {b.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Account Number */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Number (NUBAN)</label>
                  <input
                    type="text"
                    pattern="[0-9]*"
                    maxLength={10}
                    placeholder="Enter 10-digit NUBAN"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-150 dark:border-slate-700 text-sm font-semibold"
                  />
                </div>

                {/* Account Name Display */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Name</label>
                  <div className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 min-h-[50px] flex items-center justify-between text-sm font-bold">
                    {isVerifying ? (
                      <div className="flex items-center gap-2 text-slate-400">
                        <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                        <span>Resolving Bank details...</span>
                      </div>
                    ) : accountName ? (
                      <span className="text-slate-900 dark:text-white uppercase tracking-tight">{accountName}</span>
                    ) : (
                      <span className="text-slate-400">Enter bank & account number to resolve name</span>
                    )}
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSubmittingCashout || isVerifying || !accountName || !bankName || accountNumber.length < 10}
                  className="w-full sm:w-auto px-8 py-3.5 bg-purple-600 text-white hover:bg-purple-700 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-purple-600/10 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:bg-slate-100 dark:disabled:bg-slate-800/80 disabled:text-slate-400 disabled:shadow-none"
                >
                  {isSubmittingCashout ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing Payout...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Request Withdrawal of ₦{(user?.referralWalletBalance || 0).toLocaleString()}
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        )}

        {showHistory && payoutHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-4">
              <h3 className="text-lg font-black text-slate-900 dark:text-white italic tracking-tighter">Cashout History</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {payoutHistory.map((p, idx) => (
                  <div key={`ref-payout-item-${p.id || ""}-${idx}`} className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl flex items-center justify-between shadow-sm">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-900 dark:text-white">₦{p.amount.toLocaleString()}</span>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider",
                          p.status === "paid" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/10" :
                          p.status === "approved" ? "bg-blue-50 text-blue-600 dark:bg-blue-900/10" :
                          p.status === "rejected" ? "bg-red-50 text-red-600 dark:bg-red-900/10" :
                          "bg-amber-50 text-amber-600 dark:bg-amber-900/10"
                        )}>
                          {p.status}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        <p>{p.bankDetails?.bankName} ({p.bankDetails?.accountNumber?.slice(-4)})</p>
                        <p>{new Date(p.createdAt).toLocaleDateString()}</p>
                      </div>
                      {p.rejectionReason && (
                        <p className="text-[10px] text-red-500 font-bold bg-red-50 dark:bg-red-950/20 p-2 rounded-xl">
                          Reason: {p.rejectionReason}
                        </p>
                      )}
                    </div>
                    <div>
                      {p.status === "paid" ? (
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                      ) : p.status === "rejected" ? (
                        <XCircle className="w-5 h-5 text-red-500" />
                      ) : (
                        <Clock className="w-5 h-5 text-amber-500 animate-pulse" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fraud Prevention Notice */}
      <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 flex items-start gap-4">
        <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-xs">Anti-Fraud Protection</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
            Self-referrals, duplicate accounts, and other fraudulent activities are strictly prohibited. 
            Accounts found violating these terms will be suspended and earnings forfeited.
          </p>
        </div>
      </div>

      {/* Referred Users List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black text-slate-900 dark:text-white italic tracking-tighter">Referred Friends</h3>
          <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full">
            {referredUsers.length} Friends
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-50 dark:border-slate-800">
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">User Details</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date Joined</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {referredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-8 py-12 text-center text-slate-400 text-sm font-medium">
                      No referred users found yet. Start sharing!
                    </td>
                  </tr>
                ) : (
                  referredUsers.map((refUser, idx) => (
                    <tr key={`${refUser.uid || ""}-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 font-bold uppercase">
                            {refUser.displayName?.charAt(0) || <Users className="w-5 h-5" />}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">{refUser.displayName || "New User"}</span>
                            <span className="text-[10px] text-slate-400">{refUser.schoolName || "Pending Profile"}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-xs font-medium text-slate-500">
                          {refUser.createdAt ? new Date(refUser.createdAt).toLocaleDateString() : "---"}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <div className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                          refUser.hasMadePurchase 
                            ? "bg-emerald-100 text-emerald-600" 
                            : "bg-blue-100 text-blue-600"
                        )}>
                          {refUser.hasMadePurchase ? "💰 Commission Paid" : "✅ Registered"}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="space-y-6">
        <h3 className="text-xl font-black text-slate-900 dark:text-white italic tracking-tighter">How it works</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { step: "01", title: "Invite Friends", desc: "Share your unique link or code with your campus mates." },
            { step: "02", title: "They Register", desc: "When they sign up and start shopping on Campuzly." },
            { step: "03", title: "Earn Forever", desc: "Get 1.3% of the platform fee on every single purchase they make." }
          ].map((item) => (
            <div key={item.step} className="p-6 bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-800 relative group overflow-hidden">
              <span className="text-4xl font-black text-slate-100 dark:text-slate-700/50 absolute top-4 right-6 group-hover:text-purple-100 dark:group-hover:text-purple-900/20 transition-colors">{item.step}</span>
              <h4 className="font-black text-slate-900 dark:text-white mb-2">{item.title}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
