import React from "react";
import { motion } from "motion/react";
import { 
  ShieldCheck, 
  ChevronLeft, 
  Lock, 
  Eye, 
  UserCheck, 
  FileText, 
  AlertTriangle, 
  Database, 
  Trash2,
  CheckCircle2,
  Printer
} from "lucide-react";

interface PrivacyPolicyProps {
  onBack: () => void;
}

export default function PrivacyPolicy({ onBack }: PrivacyPolicyProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-24 font-sans text-slate-800 dark:text-slate-200">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors font-bold text-sm bg-white dark:bg-slate-900 px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs cursor-pointer active:scale-95"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
            title="Print or Save PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Policy
          </button>
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/60 dark:border-slate-800">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Effective: August 2026
            </span>
          </div>
        </div>
      </div>

      {/* Main Title & Intro Card */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-bold tracking-wide border border-emerald-200/70 dark:border-emerald-800/60">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Campus Data Protection & Confidentiality Standard</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white font-display tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed">
          SHOPIVERSITY is committed to safeguarding the personal identity, academic privacy, and payment security of all students and campus merchants on our platform.
        </p>
      </div>

      {/* Pillar Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Escrow Payment Security</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Card and payment credentials are encrypted via PCI-DSS certified gateways (Paystack/Flutterwave). SHOPIVERSITY never stores your raw CVV or banking credentials.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/40 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400">
            <UserCheck className="w-5 h-5" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">ID & Identity Traceability</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Student IDs, NIN, or BVN verification data are strictly used for verified campus identity and dispute evidence mediation, and are never shared publicly.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="w-10 h-10 bg-purple-50 dark:bg-purple-950/40 rounded-2xl flex items-center justify-center text-purple-600 dark:text-purple-400">
            <Eye className="w-5 h-5" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">No Off-Platform Spam or Sale</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            We do not sell, lease, or monetize student personal records. Direct messaging is disabled to prevent unsolicited off-platform solicitations and scamming.
          </p>
        </div>
      </div>

      {/* Comprehensive Sections Container */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 sm:p-10 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-8 text-left">
        
        {/* Section 1 */}
        <section className="space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-orange-600 text-white text-xs font-black rounded-xl flex items-center justify-center shrink-0">
              1
            </div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              Information We Collect
            </h2>
          </div>
          <div className="pl-9 space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            <p>
              To provide a safe, fraud-resistant campus marketplace, SHOPIVERSITY collects the following categories of information:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 pt-1">
              <li>
                <strong>Account Information:</strong> Full name, university email address, campus location/hostel, phone number, and encrypted authentication tokens.
              </li>
              <li>
                <strong>Identity Verification Documents:</strong> Student ID cards, matriculation numbers, or government identifiers submitted solely for seller verification and dispute investigation.
              </li>
              <li>
                <strong>Transaction & Escrow Data:</strong> Item purchased, purchase amount, payment timestamps, escrow transaction IDs, delivery pickup receipts, and handover codes.
              </li>
              <li>
                <strong>Merchant Banking Information:</strong> Verified bank account number and bank name used strictly to disburse approved seller withdrawals and earnings.
              </li>
            </ul>
          </div>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-orange-600 text-white text-xs font-black rounded-xl flex items-center justify-center shrink-0">
              2
            </div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              How Your Information Is Used
            </h2>
          </div>
          <div className="pl-9 space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            <p>We use your data strictly for legitimate operational and safety purposes:</p>
            <ul className="list-disc pl-5 space-y-1.5 pt-1">
              <li><strong>Escrow Settlement:</strong> Locking funds safely upon checkout and releasing payout to the seller upon verified delivery or expiration of the 72-hour protection window.</li>
              <li><strong>Dispute Resolution & Proof:</strong> Auditing package transfer records and verification IDs in the event a 72-hour buyer dispute or refund claim is filed.</li>
              <li><strong>Automated Notifications:</strong> Dispatching real-time email/SMS alerts via Brevo regarding order confirmations, courier assignments, and withdrawal processing.</li>
              <li><strong>Fraud Prevention:</strong> Identifying suspicious duplicate accounts, detecting off-platform circumvention, and blocking malicious actors.</li>
            </ul>
          </div>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-orange-600 text-white text-xs font-black rounded-xl flex items-center justify-center shrink-0">
              3
            </div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              Disablement of Direct Messaging & Anti-Scam Protection
            </h2>
          </div>
          <div className="pl-9 space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            <p>
              To protect students from phishing, social engineering, harassment, and unauthorized off-platform payment solicitations, SHOPIVERSITY does not permit open direct messaging between buyers and sellers.
            </p>
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200/70 dark:border-amber-900/40 text-amber-900 dark:text-amber-200 text-xs font-medium space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Zero-Trust Off-Platform Policy</span>
              </div>
              <p>
                All order updates, tracking steps, verification IDs, and refund workflows occur systematically within the audited user interface. Never share personal financial credentials or accept off-platform deals.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-orange-600 text-white text-xs font-black rounded-xl flex items-center justify-center shrink-0">
              4
            </div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              Data Retention & User Rights
            </h2>
          </div>
          <div className="pl-9 space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            <p>
              As a campus user, you maintain complete sovereignty over your profile information:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 pt-1">
              <li><strong>Account Hibernation:</strong> Temporarily freeze your account and hide all listings from marketplace view when studying for exams or on break.</li>
              <li><strong>Data Deletion & Erasure:</strong> Request permanent deletion of non-financial profile records once all active orders and escrow balances are fully resolved.</li>
              <li><strong>Audit Trail Access:</strong> View the complete security timestamp logs of every transaction and verification event on your orders at any time.</li>
            </ul>
          </div>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-orange-600 text-white text-xs font-black rounded-xl flex items-center justify-center shrink-0">
              5
            </div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              Contact Privacy & Compliance Team
            </h2>
          </div>
          <div className="pl-9 space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            <p>
              If you have any questions regarding how your data is handled or wish to submit a privacy inquiry, please visit our <strong>Customer Support</strong> section or email our designated compliance officer at <span className="font-mono text-orange-600 dark:text-orange-400 font-bold">privacy@shopiversity.edu</span>.
            </p>
          </div>
        </section>

        {/* Bottom Acknowledgment */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-500 italic">
            By registering, purchasing, or listing items on SHOPIVERSITY, you acknowledge that you have reviewed and agree to the data practices outlined in this Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
