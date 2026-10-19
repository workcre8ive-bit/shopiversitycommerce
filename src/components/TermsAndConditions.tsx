import React from "react";
import { 
  FileText, 
  ChevronLeft, 
  Shield, 
  Scale, 
  Lock, 
  Info, 
  Printer, 
  AlertTriangle, 
  CheckCircle2, 
  BadgeAlert,
  Building,
  Copyright
} from "lucide-react";

interface TermsAndConditionsProps {
  onBack: () => void;
  onNavigatePrivacy?: () => void;
  onNavigateRefund?: () => void;
  onNavigateCookies?: () => void;
}

export default function TermsAndConditions({ 
  onBack, 
  onNavigatePrivacy, 
  onNavigateRefund,
  onNavigateCookies 
}: TermsAndConditionsProps) {
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
          {onNavigatePrivacy && (
            <button
              onClick={onNavigatePrivacy}
              className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#ff6b00] outline-none"
            >
              Privacy Policy
            </button>
          )}
          {onNavigateRefund && (
            <button
              onClick={onNavigateRefund}
              className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#ff6b00] outline-none"
            >
              Refund Policy
            </button>
          )}
          <button
            onClick={handlePrint}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#ff6b00] outline-none"
            title="Print or Save PDF"
            aria-label="Print or save terms as PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/60">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Updated: October 2026</span>
          </div>
        </div>
      </div>

      {/* Main Title */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-50 dark:bg-orange-950/40 text-[#ff6b00] rounded-full text-xs font-bold tracking-wide border border-orange-200/70 dark:border-orange-800/60">
          <Scale className="w-4 h-4 text-[#ff6b00]" />
          <span>FCCPA 2018 & Nigerian E-Commerce Legal Framework</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white font-display tracking-tight">Terms & Conditions</h1>
        <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-medium text-sm sm:text-base leading-relaxed">
          Please read these Terms of Service carefully before accessing or using SHOPIVERSITY. By creating an account, browsing listings, or initiating a transaction, you agree to be bound by these rules.
        </p>
      </div>

      {/* 4 Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 p-7 rounded-[2rem] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="w-10 h-10 bg-orange-50 dark:bg-orange-950/30 rounded-2xl flex items-center justify-center text-[#ff6b00]">
            <Shield className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Platform Role & Intermediary Status</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
            SHOPIVERSITY operates as a peer-to-peer student marketplace and non-custodial escrow platform. We do not manufacture, stock, or directly retail physical merchant goods. Sellers are independent student merchants.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-7 rounded-[2rem] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="w-10 h-10 bg-orange-50 dark:bg-orange-950/30 rounded-2xl flex items-center justify-center text-[#ff6b00]">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">72-Hour Escrow Protection</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
            Buyer payments are securely held in escrow via Paystack until the buyer confirms satisfactory physical inspection, or until the 72-hour protection inspection countdown expires.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-7 rounded-[2rem] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="w-10 h-10 bg-orange-50 dark:bg-orange-950/30 rounded-2xl flex items-center justify-center text-[#ff6b00]">
            <Scale className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Authentic Listings & Verified Reviews</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
            Fabricated product reviews, fake testimonials, and misleading marketing claims are strictly banned. Only students with completed escrow purchases may submit star ratings and reviews.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-7 rounded-[2rem] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="w-10 h-10 bg-orange-50 dark:bg-orange-950/30 rounded-2xl flex items-center justify-center text-[#ff6b00]">
            <Copyright className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Copyright & Image Rights</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
            Sellers warrant that all uploaded listing photos belong to them or are properly licensed. Copyright infringement and unauthorized image theft will result in immediate listing takedown.
          </p>
        </div>
      </div>

      {/* Detailed Escrow, Delivery & Dispute Terms Container */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 sm:p-10 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-8 text-left">
        
        {/* Entity Info Box */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/70 dark:border-slate-800 text-xs space-y-1">
          <p><strong>Operating Entity:</strong> Shopiversity Technologies Ltd.</p>
          <p><strong>Jurisdiction:</strong> Federal Republic of Nigeria • Inquiries: <a href="mailto:tommzypolaris@gmail.com" className="font-bold text-[#ff6b00] underline">tommzypolaris@gmail.com</a></p>
          <p><strong>Compliance:</strong> Federal Competition and Consumer Protection Act (FCCPA 2018), Nigeria Data Protection Act (NDPA 2023).</p>
        </div>

        {/* Section 1 */}
        <section className="space-y-3">
          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-6 h-6 bg-[#ff6b00] text-white text-xs font-black flex items-center justify-center rounded-xl shrink-0">1</span>
            Escrow Mechanism & Payment Before Delivery
          </h3>
          <div className="space-y-2 pl-8 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
            <p>1.1. When an order is paid for, funds are locked in escrow via PCI-DSS certified gateway tokens. The merchant does not receive payout until the buyer taps "Confirm Delivery" or until the 72-hour inspection window elapses.</p>
            <p>1.2. Upon verified delivery confirmation, funds minus platform maintenance commission (5%) are disbursed to the merchant's linked Nigerian bank account.</p>
            <p>1.3. <strong>Strict Disablement of Open Direct Messaging:</strong> Open chat messaging is restricted to protect students from social engineering, phishing, and scam links. Order handovers and pickup codes are generated systematically in the interface.</p>
            <p>1.4. <strong>Prohibition of Off-Platform Payments:</strong> Transacting outside the app completely voids all 72-Hour Escrow Protection and refund guarantees. Off-platform payment requests will result in merchant suspension.</p>
          </div>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-6 h-6 bg-[#ff6b00] text-white text-xs font-black flex items-center justify-center rounded-xl shrink-0">2</span>
            72-Hour Buyer Protection & Inspection Window
          </h3>
          <div className="space-y-2 pl-8 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
            <p>2.1. The buyer holds <strong>72 continuous hours</strong> from the recorded handover time to test product functionality, verify clothing size/authenticity, or check device health.</p>
            <p>2.2. If the item is defective or missing, the buyer must tap "Raise Dispute / Request Refund". This immediately freezes escrow disbursement pending investigation.</p>
            <p>2.3. If no action is taken within 72 hours, the escrow automatically clears and releases payout to the merchant. All sales become final after 72 hours.</p>
          </div>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-6 h-6 bg-[#ff6b00] text-white text-xs font-black flex items-center justify-center rounded-xl shrink-0">3</span>
            Disputes, Evidence & Resolution Timeline
          </h3>
          <div className="space-y-2 pl-8 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
            <p>3.1. When a dispute is filed, the merchant is notified and granted <strong>24 to 48 hours</strong> to submit proof of dispatch, handover verification codes, or photographic evidence.</p>
            <p>3.2. If the merchant fails to provide valid proof or acknowledge the buyer within 48 hours, full escrow funds are returned to the buyer.</p>
            <p>3.3. SHOPIVERSITY compliance officers serve as neutral mediators in line with the FCCPA 2018 consumer standards.</p>
          </div>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-6 h-6 bg-[#ff6b00] text-white text-xs font-black flex items-center justify-center rounded-xl shrink-0">4</span>
            Prohibited Items & Marketplace Conduct
          </h3>
          <div className="space-y-2 pl-8 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
            <p>The following items and activities are strictly prohibited on SHOPIVERSITY:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Academic malpractice materials (leaked examination questions, forged transcripts, unoriginal thesis ghostwriting).</li>
              <li>Weapons, fireworks, hazardous chemicals, and illicit or prescription substances.</li>
              <li>Stolen goods, pirated intellectual property, or counterfeit electronics.</li>
              <li>Incentivized, automated, or fake product reviews.</li>
            </ul>
            <p>Violation results in immediate listing removal, account termination, and referral to university disciplinary committees or law enforcement where appropriate.</p>
          </div>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-6 h-6 bg-[#ff6b00] text-white text-xs font-black flex items-center justify-center rounded-xl shrink-0">5</span>
            Intellectual Property & Copyright Takedown (DMCA / IP Notice)
          </h3>
          <div className="space-y-2 pl-8 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
            <p>5.1. Sellers are solely responsible for ensuring that product photographs, graphic assets, and brand names used in their listings do not infringe on any third party's copyrights or registered trademarks.</p>
            <p>5.2. If you are a copyright or trademark owner and believe content on SHOPIVERSITY infringes your rights, please submit a notice to <a href="mailto:tommzypolaris@gmail.com" className="font-bold text-[#ff6b00] underline">tommzypolaris@gmail.com</a> with the listing URL, description of the work, and proof of rights. We investigate and remove infringing content within 24–48 hours.</p>
          </div>
        </section>

        {/* Section 6 */}
        <section className="space-y-3">
          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-6 h-6 bg-[#ff6b00] text-white text-xs font-black flex items-center justify-center rounded-xl shrink-0">6</span>
            Limitation of Liability & Disclaimer
          </h3>
          <div className="space-y-2 pl-8 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
            <p>6.1. SHOPIVERSITY provides a software marketplace venue and escrow facilitation service. We make no express warranties regarding merchant merchandise quality beyond enforcing our 72-hour escrow inspection and dispute resolution rules.</p>
            <p>6.2. Under no circumstances will SHOPIVERSITY Technologies Ltd. be liable for indirect, incidental, or consequential damages resulting from off-platform agreements between campus users.</p>
            <p>6.3. These terms are governed exclusively by the laws of the Federal Republic of Nigeria.</p>
          </div>
        </section>

        {/* Bottom Acknowledgment */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-xs text-slate-500 italic">
            By registering, buying, or selling on SHOPIVERSITY, you signify your full agreement to these Terms & Conditions.
          </p>
        </div>
      </div>
    </div>
  );
}
