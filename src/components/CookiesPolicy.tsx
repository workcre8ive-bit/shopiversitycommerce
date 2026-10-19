import React from "react";
import { motion } from "motion/react";
import { 
  Cookie, 
  ChevronLeft, 
  ShieldCheck, 
  Settings, 
  CheckCircle2, 
  Lock, 
  Eye, 
  Database, 
  Printer,
  Sliders
} from "lucide-react";

interface CookiesPolicyProps {
  onBack: () => void;
  onOpenCookieSettings?: () => void;
}

export default function CookiesPolicy({ onBack, onOpenCookieSettings }: CookiesPolicyProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-24 font-sans text-slate-800 dark:text-slate-200">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          aria-label="Go back to previous page"
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors font-bold text-sm bg-white dark:bg-slate-900 px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs cursor-pointer active:scale-95 focus-visible:ring-2 focus-visible:ring-[#ff6b00] outline-none"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
        <div className="flex items-center gap-2">
          {onOpenCookieSettings && (
            <button
              onClick={onOpenCookieSettings}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-orange-50 dark:bg-orange-950/40 text-[#ff6b00] hover:bg-orange-100 rounded-xl text-xs font-bold transition-all cursor-pointer border border-orange-200/60 dark:border-orange-900/50 focus-visible:ring-2 focus-visible:ring-[#ff6b00] outline-none"
            >
              <Sliders className="w-3.5 h-3.5" />
              Manage Preferences
            </button>
          )}
          <button
            onClick={handlePrint}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#ff6b00] outline-none"
            title="Print or Save PDF"
            aria-label="Print or save cookies policy as PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/60 dark:border-slate-800">
            <Cookie className="w-3.5 h-3.5 text-[#ff6b00]" />
            <span className="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Updated: October 2026
            </span>
          </div>
        </div>
      </div>

      {/* Main Title & Intro Card */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 rounded-full text-xs font-bold tracking-wide border border-amber-200/70 dark:border-amber-800/60">
          <Cookie className="w-4 h-4 text-[#ff6b00]" />
          <span>Transparent Storage & Privacy Standards</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white font-display tracking-tight">
          Cookies & Local Storage Policy
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed">
          SHOPIVERSITY respects your privacy. We use minimal, privacy-first cookies and browser storage technologies strictly to operate our campus marketplace, secure escrow payments, and remember your preferences. We do not sell your personal data or utilize intrusive third-party cross-site advertising trackers.
        </p>
      </div>

      {/* Core Cookie Categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Lock className="w-5 h-5" />
          </div>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Strictly Necessary</h3>
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-full">
              Always Active
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Essential for account authentication (Firebase Auth), CSRF protection, shopping cart preservation, and secure Paystack escrow checkout. The site cannot function without these.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/40 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Settings className="w-5 h-5" />
          </div>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Functional Preferences</h3>
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-full">
              Optional
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Stores your chosen university/campus filter, dark/light theme mode, and audio notification preferences so you don't need to reconfigure them each visit.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="w-10 h-10 bg-purple-50 dark:bg-purple-950/40 rounded-2xl flex items-center justify-center text-purple-600 dark:text-purple-400">
            <Eye className="w-5 h-5" />
          </div>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Performance & Error</h3>
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 rounded-full">
              Opt-In
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Aggregated, anonymous telemetry used to diagnose slow network calls, page render speeds, and resolve bugs to maintain platform stability for campus students.
          </p>
        </div>
      </div>

      {/* Detailed Policy Sections */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 sm:p-10 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-8 text-left">
        
        {/* Section 1: What Are Cookies */}
        <section className="space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[#ff6b00] text-white text-xs font-black rounded-xl flex items-center justify-center shrink-0">
              1
            </div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              What Are Cookies and Local Storage?
            </h2>
          </div>
          <div className="pl-9 space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            <p>
              Cookies are small data files stored on your device by your web browser when you visit websites. Local Storage (HTML5 Web Storage) is a modern, secure browser storage mechanism that allows web applications to store operational state locally on your device without transmitting it over every network request.
            </p>
            <p>
              SHOPIVERSITY uses Local Storage primarily for maintaining your active session tokens, saved cart selections, and campus preferences, guaranteeing fast load times even on slow campus Wi-Fi networks.
            </p>
          </div>
        </section>

        {/* Section 2: Exact Storage Items Table */}
        <section className="space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[#ff6b00] text-white text-xs font-black rounded-xl flex items-center justify-center shrink-0">
              2
            </div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              Storage Keys & Purpose Breakdown
            </h2>
          </div>
          <div className="pl-9 space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed overflow-x-auto">
            <table className="w-full text-left border-collapse border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800/80 text-[11px] uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  <th className="p-3 border-b border-slate-200 dark:border-slate-800">Key / Cookie Name</th>
                  <th className="p-3 border-b border-slate-200 dark:border-slate-800">Category</th>
                  <th className="p-3 border-b border-slate-200 dark:border-slate-800">Purpose</th>
                  <th className="p-3 border-b border-slate-200 dark:border-slate-800">Lifespan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                <tr>
                  <td className="p-3 font-mono text-[11px] font-bold text-slate-900 dark:text-white">firebase:authUser:*</td>
                  <td className="p-3"><span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-full text-[10px] font-bold">Necessary</span></td>
                  <td className="p-3">Maintains authenticated student session tokens securely.</td>
                  <td className="p-3">Persistent until logout</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-[11px] font-bold text-slate-900 dark:text-white">shopiversity_cookie_consent</td>
                  <td className="p-3"><span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-full text-[10px] font-bold">Necessary</span></td>
                  <td className="p-3">Records your cookie choices and consent timestamp.</td>
                  <td className="p-3">1 Year</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-[11px] font-bold text-slate-900 dark:text-white">shopiversity_cart_*</td>
                  <td className="p-3"><span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-full text-[10px] font-bold">Necessary</span></td>
                  <td className="p-3">Saves items added to cart across browser refreshes.</td>
                  <td className="p-3">Persistent / cleared on checkout</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-[11px] font-bold text-slate-900 dark:text-white">shopiversity_theme</td>
                  <td className="p-3"><span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-full text-[10px] font-bold">Functional</span></td>
                  <td className="p-3">Remembers your dark/light display preference.</td>
                  <td className="p-3">Persistent</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-[11px] font-bold text-slate-900 dark:text-white">shopiversity_selected_school</td>
                  <td className="p-3"><span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-full text-[10px] font-bold">Functional</span></td>
                  <td className="p-3">Filters products by your selected university campus.</td>
                  <td className="p-3">Persistent</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 3: Third Party Embeds */}
        <section className="space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[#ff6b00] text-white text-xs font-black rounded-xl flex items-center justify-center shrink-0">
              3
            </div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              Third-Party Services & Integrations
            </h2>
          </div>
          <div className="pl-9 space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            <p>
              To process payments, ensure verified student identity, and host real-time product catalogs, SHOPIVERSITY works with trusted third-party technical providers:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 pt-1">
              <li>
                <strong>Paystack Payments (PCI-DSS Level 1 Certified):</strong> When you initiate online escrow payments, Paystack securely tokenizes credit/debit cards and bank transfers. SHOPIVERSITY never receives or stores your raw card details.
              </li>
              <li>
                <strong>Google Firebase:</strong> Used for secure cloud database hosting (Firestore) and multi-factor student authentication under Google Cloud security standards.
              </li>
              <li>
                <strong>Brevo (formerly Sendinblue):</strong> Transactional email service used solely to deliver one-time verification passwords (OTPs), order confirmations, and delivery receipts.
              </li>
            </ul>
          </div>
        </section>

        {/* Section 4: Managing and Withdrawing Consent */}
        <section className="space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[#ff6b00] text-white text-xs font-black rounded-xl flex items-center justify-center shrink-0">
              4
            </div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              How to Control or Withdraw Your Consent
            </h2>
          </div>
          <div className="pl-9 space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            <p>
              You can adjust or revoke your cookie choices at any time:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 pt-1">
              <li>
                <strong>On-Site Settings:</strong> Click the "Manage Preferences" button at the top of this policy or tap "Cookie Preferences" in the footer to modify your settings.
              </li>
              <li>
                <strong>Browser Controls:</strong> You can block or delete cookies in your browser settings (Chrome, Safari, Firefox, Edge). Note that blocking Strictly Necessary cookies will prevent you from signing in or checking out.
              </li>
            </ul>
          </div>
        </section>

        {/* Section 5: Contact */}
        <section className="space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[#ff6b00] text-white text-xs font-black rounded-xl flex items-center justify-center shrink-0">
              5
            </div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              Questions & Compliance Inquiries
            </h2>
          </div>
          <div className="pl-9 space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            <p>
              For questions regarding our use of cookies or local storage, contact our Data Protection Liaison at{" "}
              <a href="mailto:tommzypolaris@gmail.com" className="font-bold text-[#ff6b00] hover:underline">
                tommzypolaris@gmail.com
              </a>.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
