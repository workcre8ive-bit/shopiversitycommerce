import React from "react";
import { 
  HeartHandshake, 
  MessageSquare, 
  Mail, 
  User, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Send, 
  ShieldCheck, 
  Clock, 
  AlertCircle,
  ArrowLeft,
  ThumbsUp,
  MessageCircle,
  Loader2,
  Lock,
  FileText
} from "lucide-react";
import { UserProfile } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { db, auth } from "../firebase";
import { collection, addDoc } from "firebase/firestore";
import { handleFirestoreError, OperationType } from "../lib/firebase-errors";

interface SupportPageProps {
  user: UserProfile | null;
  onBack?: () => void;
  mode?: "support" | "feedback";
}

export default function SupportPage({ user, onBack, mode = "support" }: SupportPageProps) {
  const [senderName, setSenderName] = React.useState(user?.displayName || "");
  const [selectedCategory, setSelectedCategory] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [medium] = React.useState<"email">("email");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [expandedFaq, setExpandedFaq] = React.useState<number | null>(null);

  const supportEmail = "shopiversitycommerce@gmail.com";

  React.useEffect(() => {
    if (user?.displayName) {
      setSenderName(user.displayName);
    }
  }, [user]);

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formattedMsg = `Subject: ${subject}\n\nMessage:\n${message}\n\nSender: ${senderName || "Guest user"} (${user?.email || "No email provided"})`;

    try {
      // 1. Write to database
      const currentUid = auth.currentUser?.uid || user?.uid || "guest";
      const currentEmail = auth.currentUser?.email || user?.email || "guest@shopiversity.com";
      
      const ticketData = {
        userId: currentUid,
        userEmail: currentEmail,
        userName: senderName || user?.displayName || "Guest user",
        category: selectedCategory || (mode === "support" ? "Support Inquiry" : "Feedback"),
        mode,
        medium: "email",
        subject: subject || selectedCategory || "General Inquiry",
        message,
        status: "open",
        createdAt: new Date().toISOString()
      };
      await addDoc(collection(db, "supportTickets"), ticketData);

      // 2. Open in email client
      const mailto = `mailto:${supportEmail}?subject=${encodeURIComponent(`[SHOPIVERSITY ${mode === "support" ? "Support" : "Feedback"}] ${subject}`)}&body=${encodeURIComponent(formattedMsg)}`;
      window.open(mailto, "_blank");

      setSubmitted(true);
      setSubject("");
      setSelectedCategory("");
      setMessage("");
    } catch (err: any) {
      console.error("Error submitting ticket:", err);
      setError("Failed to process your request. Please try again.");
      handleFirestoreError(err, OperationType.WRITE, "supportTickets");
    } finally {
      setIsSubmitting(false);
    }
  };

  const faqs = [
    {
      q: "How does SHOPIVERSITY Escrow protect me?",
      a: "When you purchase an item, your funds are safely held in escrow. They are only released to the vendor after you confirm delivery or after 48 hours pass without any disputes."
    },
    {
      q: "What should I do if my order is not delivered?",
      a: "Go to the Orders tab and tap 'Raise Dispute'. This freezes the escrow funds immediately and alerts the moderator team to mediate."
    },
    {
      q: "Can I pay vendors outside the app?",
      a: "No! Payments made offline/outside the app are strictly not protected and violate our security guidelines. Always use the secure app payment portal to ensure escrow protection."
    },
    {
      q: "How do I verify my Student ID?",
      a: "Go to Settings, scroll down to the Student Verification section, fill in your details, and submit pictures of your ID for rapid validation."
    },
    {
      q: "How do I withdraw my earnings as a seller?",
      a: "Sellers can link their bank account securely under the 'Earnings & Payouts' tab (or section in Dashboard) and request payouts. All withdrawals are processed within 24 to 48 hours after validation."
    },
    {
      q: "What is the strike system and how does it work?",
      a: "To maintain campus trust, any user who violates listing policies, receives authenticated scam complaints, or attempts off-platform trades will receive strikes. Accumulating 3 strikes results in a permanent system suspension."
    },
    {
      q: "Can I sell digital services or only physical goods?",
      a: "You can sell both! The SHOPIVERSITY marketplace has categories for customized physical materials, student tech/academic services, custom event tickets, and lifestyle needs."
    },
    {
      q: "Are community events and ticket purchases secure?",
      a: "Yes! All digital and physical tickets purchased directly through the Live Events page and Event Planner section are processed via our secure escrow system, protecting students from gate ticket fraud."
    },
    {
      q: "Who mediates in case of disputes between buyer and seller?",
      a: "The SHOPIVERSITY moderator team acts as an unbiased mediator. We review transaction histories, chat records, and any uploaded pictures or delivery confirmations to issue fair refunds or release frozen escrow funds of verified events and trades."
    }
  ];

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 pb-20 px-4">
        {onBack && (
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors group border-none bg-transparent cursor-pointer outline-none"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-black uppercase tracking-widest">Back to Market</span>
          </button>
        )}
        <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 p-10 rounded-[2.5rem] shadow-xl text-center space-y-6">
          <div className="w-16 h-16 bg-orange-100 dark:bg-orange-950/20 text-orange-600 rounded-3xl flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Authentication Required</h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              You must be signed in to access customer support, report an issue, or suggest app advancements. Please sign in or create an account to proceed.
            </p>
          </div>
          <div className="flex justify-center">
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('switch-tab', { detail: 'settings' }));
              }}
              className="px-6 h-12 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-orange-500/10 cursor-pointer border-none"
            >
              Sign In / Register
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 px-4">
      {onBack && (
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-black uppercase tracking-widest">Back to Market</span>
        </button>
      )}
      
      {/* Header Banner */}
      <div className="bg-brand-gradient p-8 sm:p-10 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md">
            {mode === "support" ? (
              <>
                <HeartHandshake className="w-3.5 h-3.5" />
                Customer Support Hub
              </>
            ) : (
              <>
                <ThumbsUp className="w-3.5 h-3.5" />
                Feedback & Advancements
              </>
            )}
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-black italic tracking-tighter leading-tight !text-white">
            {mode === "support" ? "Report an issue or task" : "Suggest App Advancements"}
          </h1>
          
          <p className="text-purple-100 font-medium text-sm sm:text-base max-w-xl">
            {mode === "support" 
              ? "For any customer or vendor problem about the app, transaction safety, payment errors, listings, or other inquiries."
              : "Tell us how we can introduce new features, improve the User Experience, or make SHOPIVERSITY more convenient for everyone."
            }
          </p>
        </div>
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl opacity-40 pointer-events-none" />
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 sm:p-10 rounded-[2.5rem] shadow-xl space-y-8">
        {submitted ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-10 space-y-6"
          >
            <div className="w-20 h-20 bg-purple-50 dark:bg-purple-950/20 text-purple-600 rounded-3xl flex items-center justify-center mx-auto">
              <Send className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Requirement Dispatched!</h3>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Your request details have been opened in your Email Client. Thank you!
              </p>
            </div>
            <button 
              onClick={() => setSubmitted(false)}
              className="px-8 py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all"
            >
              Submit Another Inquiry
            </button>
          </motion.div>
        ) : (
          <form onSubmit={handleAction} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-950/10 border border-red-100 dark:border-red-900/20 rounded-xl text-red-600 dark:text-red-400 text-xs font-bold leading-relaxed">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Your Full Name</label>
              <input 
                type="text"
                required
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-850 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-purple-500 transition-all font-bold text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                {mode === "support" ? "Support Category" : "Feedback Category"}
              </label>
              <select
                required
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  if (e.target.value !== "others") {
                    setSubject(e.target.value);
                  } else {
                    setSubject("");
                  }
                }}
                className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-850 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-purple-500 transition-all font-bold text-sm text-slate-900 dark:text-white cursor-pointer"
              >
                <option value="" disabled>-- Select a category --</option>
                {mode === "support" ? (
                  <>
                    <option value="Order & Delivery Issue">Order & Delivery Issue</option>
                    <option value="Escrow Dispute or Refund">Escrow Dispute or Refund</option>
                    <option value="Payment Receipt / Failure Notice">Payment Receipt / Failure Notice</option>
                    <option value="Vendor Listing Issue">Vendor Listing Issue</option>
                    <option value="Student ID Verification Inquiry">Student ID Verification Inquiry</option>
                    <option value="Report Suspicious Activity / Fraud">Report Suspicious Activity / Fraud</option>
                    <option value="others">Others (Specify below)</option>
                  </>
                ) : (
                  <>
                    <option value="Feature Suggestion / Enhancement Request">Feature Suggestion / Enhancement Request</option>
                    <option value="UI/UX Design & Theme Customization">UI/UX Design & Theme Customization</option>
                    <option value="Payout & Balances Simplification">Payout & Balances Simplification</option>
                    <option value="Community Events feedback">Community Events Feedback</option>
                    <option value="Security or Privacy suggestion">Security or Privacy Suggestion</option>
                    <option value="General Praise / Review">General Praise / Review</option>
                    <option value="others">Others (Specify below)</option>
                  </>
                )}
              </select>
            </div>

            <AnimatePresence>
              {selectedCategory === "others" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-2 overflow-hidden"
                >
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Specify Your Own Subject</label>
                  <input 
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Enter your custom subject manually"
                    className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-850 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-purple-500 transition-all font-bold text-sm text-slate-900 dark:text-white"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Detailed Message</label>
              <textarea 
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                placeholder={mode === "support" ? "What app issue or problem did you experience? Provide as much detail as possible..." : "What is your amazing suggestion to make SHOPIVERSITY better? Be descriptive!"}
                className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-850 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-purple-500 transition-all font-bold text-sm text-slate-900 dark:text-white resize-none"
              />
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4.5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 active:scale-95 text-white shadow-lg bg-purple-600 hover:bg-purple-700 hover:shadow-purple-600/10"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  Open in Mail Client
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Conditionally render FAQs ONLY on support mode */}
      {mode === "support" && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight italic">Frequently Answered Clear Questions</h2>
            <p className="text-sm text-slate-400 font-medium">Find answers to urgent campus questions instantly.</p>
          </div>
          
          <div className="space-y-3">
            {faqs.map((f, i) => {
              const isOpen = expandedFaq === i;
              return (
                <div 
                  key={`faq-${i}`}
                  className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden transition-all shadow-sm"
                >
                  <button
                    onClick={() => setExpandedFaq(isOpen ? null : i)}
                    className="w-full flex items-center justify-between p-5 text-left font-bold text-slate-800 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors"
                  >
                    <span>{f.q}</span>
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="p-5 pt-0 border-t border-slate-50 dark:border-slate-850 text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                          {f.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
