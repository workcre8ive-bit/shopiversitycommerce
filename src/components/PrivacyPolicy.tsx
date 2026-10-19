import React from "react";
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
  Printer,
  Server,
  Mail,
  Scale
} from "lucide-react";

interface PrivacyPolicyProps {
  onBack: () => void;
  onNavigateTerms?: () => void;
  onNavigateCookies?: () => void;
}

export default function PrivacyPolicy({ onBack, onNavigateTerms, onNavigateCookies }: PrivacyPolicyProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-24 font-sans text-slate-800 dark:text-slate-200">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          aria-label="Go back to previous screen"
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors font-bold text-sm bg-white dark:bg-slate-900 px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs cursor-pointer active:scale-95 focus-visible:ring-2 focus-visible:ring-[#ff6b00] outline-none"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
        <div className="flex items-center gap-2">
          {onNavigateTerms && (
            <button
              onClick={onNavigateTerms}
              className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#ff6b00] outline-none"
            >
              Terms of Service
            </button>
          )}
          {onNavigateCookies && (
            <button
              onClick={onNavigateCookies}
              className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#ff6b00] outline-none"
            >
              Cookie Policy
            </button>
          )}
          <button
            onClick={handlePrint}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#ff6b00] outline-none"
            title="Print or Save PDF"
            aria-label="Print or save privacy policy as PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/60 dark:border-slate-800">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Updated: October 2026
            </span>
          </div>
        </div>
      </div>

      {/* Main Title & Intro Card */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-bold tracking-wide border border-emerald-200/70 dark:border-emerald-800/60">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Nigeria Data Protection Act (NDPA 2023) Compliant</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white font-display tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed">
          SHOPIVERSITY Technologies Ltd. is committed to safeguarding the personal identity, student records, and escrow payment privacy of every campus buyer and merchant. We practice strict data minimization.
        </p>
      </div>

      {/* Core Privacy Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Escrow Payment Security</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
            Card and payment credentials are encrypted via PCI-DSS Level 1 certified gateways (Paystack). SHOPIVERSITY never receives or stores your raw card CVV or banking passwords.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/40 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400">
            <UserCheck className="w-5 h-5" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Data Minimization Principle</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
            We collect strictly what is essential to verify student status, execute campus drop-offs, and route bank payouts. We never sell or harvest browsing habits.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="w-10 h-10 bg-purple-50 dark:bg-purple-950/40 rounded-2xl flex items-center justify-center text-purple-600 dark:text-purple-400">
            <Eye className="w-5 h-5" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Zero Third-Party Ad Pixels</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
            We do not embed third-party surveillance ad networks (such as Meta pixel or data brokers). Direct messaging is systematically gated to protect against scamming.
          </p>
        </div>
      </div>

      {/* Comprehensive Sections Container */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 sm:p-10 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-8 text-left">
        
        {/* Section 1: Necessary Data Only */}
        <section className="space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[#ff6b00] text-white text-xs font-black rounded-xl flex items-center justify-center shrink-0">
              1
            </div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              Information We Collect & Why (Strict Data Minimization)
            </h2>
          </div>
          <div className="pl-9 space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            <p>
              Under the Nigeria Data Protection Act (NDPA 2023), we limit data collection strictly to what is necessary for contract execution, dispute mediation, and student fraud prevention:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 pt-1">
              <li>
                <strong>Account Credentials:</strong> Full name, verified mobile telephone number, campus location/hostel, password hash, and Firebase authentication tokens.
              </li>
              <li>
                <strong>Student Identity Verification:</strong> Student ID card, matriculation number, or national identification (NIN/BVN verification via regulated APIs) submitted exclusively to unlock seller status and prevent marketplace impersonation.
              </li>
              <li>
                <strong>Escrow Transaction Logs:</strong> Item details, transaction reference numbers, 6-digit delivery confirmation PINs, timestamped order receipts, and courier handover records.
              </li>
              <li>
                <strong>Settlement Banking Details:</strong> 10-digit NUBAN account number and Nigerian bank code, utilized strictly to disburse approved seller balances via Paystack subaccounts.
              </li>
            </ul>
          </div>
        </section>

        {/* Section 2: Third-Party Embeds & Sub-Processors */}
        <section className="space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[#ff6b00] text-white text-xs font-black rounded-xl flex items-center justify-center shrink-0">
              2
            </div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              Third-Party Integrations & Sub-Processors Disclosed
            </h2>
          </div>
          <div className="pl-9 space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            <p>
              We disclose all third-party services that process data on behalf of SHOPIVERSITY:
            </p>
            <div className="space-y-2.5 pt-1">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-1">
                <span className="font-bold text-slate-900 dark:text-white text-xs block">
                  • Paystack Payments Ltd. (PCI-DSS Level 1 Processor)
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Processes all card payments, direct bank transfers, and automated subaccount merchant payouts. Payment card details are never stored on Shopiversity servers.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-1">
                <span className="font-bold text-slate-900 dark:text-white text-xs block">
                  • Google Cloud & Firebase (Database & Auth Infrastructure)
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Provides ISO 27001 / SOC 2 compliant database hosting (Firestore) and encrypted user credentials storage.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-1">
                <span className="font-bold text-slate-900 dark:text-white text-xs block">
                  • Brevo (Transactional Email & SMS Gateway)
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Sends automated order notifications, courier assignments, and security one-time codes (OTPs).
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Tracking & Telemetry */}
        <section className="space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[#ff6b00] text-white text-xs font-black rounded-xl flex items-center justify-center shrink-0">
              3
            </div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              Tracking & Diagnostics Policy
            </h2>
          </div>
          <div className="pl-9 space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            <p>
              SHOPIVERSITY does not track users across other websites or sell device identifiers. We collect minimal, aggregated performance telemetry (e.g. page rendering times and API failure rates) to troubleshoot connectivity issues on campus networks. You may opt out of non-essential performance tracking through our <em>Cookie & Storage Preferences</em> modal at any time.
            </p>
          </div>
        </section>

        {/* Section 4: User Rights Under NDPA 2023 */}
        <section className="space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[#ff6b00] text-white text-xs font-black rounded-xl flex items-center justify-center shrink-0">
              4
            </div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              Your Rights (Access, Correction & Deletion)
            </h2>
          </div>
          <div className="pl-9 space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            <p>
              Under Nigerian data protection law, you hold the following non-negotiable rights:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 pt-1">
              <li><strong>Right to Rectification:</strong> Edit your name, campus address, phone number, and banking details directly inside your profile settings.</li>
              <li><strong>Right to Account Hibernation:</strong> Temporarily pause your listings and hide your storefront while studying for semester exams.</li>
              <li><strong>Right to Erasure (Account Deletion):</strong> Request the permanent deletion of your profile and non-financial data once all pending orders and escrow balances have been settled.</li>
              <li><strong>Right to Audit Logs:</strong> Access the tamper-proof delivery timestamp records associated with any completed transaction.</li>
            </ul>
          </div>
        </section>

        {/* Section 5: Real Business & Contact Info */}
        <section className="space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[#ff6b00] text-white text-xs font-black rounded-xl flex items-center justify-center shrink-0">
              5
            </div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              Data Controller & Compliance Officer Contact
            </h2>
          </div>
          <div className="pl-9 space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            <p>
              This platform is operated by <strong>Shopiversity Technologies Ltd.</strong>
            </p>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
              <p><strong>Entity:</strong> Shopiversity Technologies Ltd.</p>
              <p><strong>Campus Operations Hub:</strong> Serving Federal, State & Private University Campuses Nationwide, Nigeria</p>
              <p><strong>Official Inquiries & DPO Email:</strong>{" "}
                <a href="mailto:tommzypolaris@gmail.com" className="font-bold text-[#ff6b00] hover:underline">
                  tommzypolaris@gmail.com
                </a>
              </p>
              <p><strong>Response Timeframe:</strong> Privacy inquiries and data subject requests are responded to within 48 business hours.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
