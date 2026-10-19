import React from "react";
import { 
  ChevronLeft, 
  RotateCcw, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  HelpCircle, 
  FileText,
  Printer,
  Scale,
  BadgeAlert
} from "lucide-react";

interface RefundPolicyProps {
  onBack: () => void;
  onNavigateSupport?: () => void;
}

export default function RefundPolicy({ onBack, onNavigateSupport }: RefundPolicyProps) {
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
          {onNavigateSupport && (
            <button
              onClick={onNavigateSupport}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-orange-50 dark:bg-orange-950/40 text-[#ff6b00] hover:bg-orange-100 rounded-xl text-xs font-bold transition-all cursor-pointer border border-orange-200/60 dark:border-orange-900/50 focus-visible:ring-2 focus-visible:ring-[#ff6b00] outline-none"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              Contact Support
            </button>
          )}
          <button
            onClick={handlePrint}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#ff6b00] outline-none"
            title="Print or Save PDF"
            aria-label="Print or save refund policy as PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/60 dark:border-slate-800">
            <RotateCcw className="w-3.5 h-3.5 text-[#ff6b00]" />
            <span className="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Updated: October 2026
            </span>
          </div>
        </div>
      </div>

      {/* Main Title & Intro Card */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 rounded-full text-xs font-bold tracking-wide border border-emerald-200/70 dark:border-emerald-800/60">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>72-Hour Campus Escrow Guarantee & Dispute Standard</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white font-display tracking-tight">
          Refund & Return Policy
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed">
          SHOPIVERSITY operates an audited escrow protection system under Nigerian consumer protection standards. When you purchase on SHOPIVERSITY, the seller is not paid until you inspect and verify your order.
        </p>
      </div>

      {/* 3 Step Escrow Timeline */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="w-10 h-10 bg-amber-50 dark:bg-amber-950/40 rounded-2xl flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">1. 72-Hour Inspection</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            From the moment your campus courier delivers or you meet for physical pickup, you have exactly 72 hours to inspect and test the item.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="w-10 h-10 bg-purple-50 dark:bg-purple-950/40 rounded-2xl flex items-center justify-center text-purple-600 dark:text-purple-400">
            <Scale className="w-5 h-5" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">2. Dispute Freeze</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            If the item is broken or not as described, tap "Raise Dispute". Payout is immediately frozen in escrow and the seller has 24–48 hours to respond.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">3. Prompt Refund</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            If the seller fails to deliver or cannot resolve the issue, full escrow funds are returned to your account via your original payment method.
          </p>
        </div>
      </div>

      {/* Main Sections */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 sm:p-10 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-8 text-left">
        
        {/* Section 1: Eligible vs Ineligible */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[#ff6b00] text-white text-xs font-black rounded-xl flex items-center justify-center shrink-0">
              1
            </div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              Eligibility for Refunds
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-9">
            <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200/60 dark:border-emerald-800/40 space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Eligible Situations</span>
              </h4>
              <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1.5 list-disc pl-4">
                <li>Item never delivered by seller or courier.</li>
                <li>Item is materially different from product photos and description.</li>
                <li>Item is defective, damaged in transit, or non-functional.</li>
                <li>Wrong size, color, or variant sent without buyer consent.</li>
                <li>Seller cancels the order prior to dispatch.</li>
              </ul>
            </div>

            <div className="p-4 bg-rose-50/60 dark:bg-rose-950/30 rounded-2xl border border-rose-200/60 dark:border-rose-800/40 space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                <BadgeAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span>Ineligible Situations</span>
              </h4>
              <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1.5 list-disc pl-4">
                <li>Disputes raised after the 72-hour window has expired.</li>
                <li>Payments made outside the SHOPIVERSITY app (voids protection).</li>
                <li>Perishable food items after physical handover confirmation.</li>
                <li>Digital vouchers or event tickets once verified and used.</li>
                <li>Damages caused by improper buyer handling or alteration.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 2: How to Request a Refund */}
        <section className="space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[#ff6b00] text-white text-xs font-black rounded-xl flex items-center justify-center shrink-0">
              2
            </div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              How to File a Refund or Dispute
            </h2>
          </div>
          <div className="pl-9 space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                <strong>Go to Orders:</strong> Navigate to your <em>Transaction History / Orders</em> tab in the SHOPIVERSITY app.
              </li>
              <li>
                <strong>Select Order:</strong> Locate the specific order within 72 hours of delivery and click <em>"Raise Dispute / Request Refund"</em>.
              </li>
              <li>
                <strong>Provide Evidence:</strong> Submit clear photos or video showing the defect, package condition, and describe what went wrong.
              </li>
              <li>
                <strong>Seller Response Period:</strong> The merchant has 24 to 48 hours to offer a replacement, repair, or accept the refund.
              </li>
              <li>
                <strong>Mediation & Resolution:</strong> If the dispute is unresolved, the SHOPIVERSITY Support team audits the case and releases the funds accordingly.
              </li>
            </ol>
          </div>
        </section>

        {/* Section 3: Processing Timeframes & Fees */}
        <section className="space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[#ff6b00] text-white text-xs font-black rounded-xl flex items-center justify-center shrink-0">
              3
            </div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              Refund Processing Times & Payment Gateway Fees
            </h2>
          </div>
          <div className="pl-9 space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            <p>
              Once a refund is approved by our compliance team:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 pt-1">
              <li>
                <strong>Paystack Card / Bank Reversal:</strong> Approved refunds are sent back to your original payment card or Nigerian bank account within <strong>3 to 5 business days</strong> depending on your issuing bank.
              </li>
              <li>
                <strong>Gateway Processing Notice:</strong> Standard third-party payment gateway transaction fees (Paystack / Flutterwave) are non-refundable as they are charged directly by the interbank switch. SHOPIVERSITY charges zero platform fees on refunded orders.
              </li>
            </ul>
          </div>
        </section>

        {/* Section 4: Return Shipping */}
        <section className="space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[#ff6b00] text-white text-xs font-black rounded-xl flex items-center justify-center shrink-0">
              4
            </div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              Physical Return Logistics
            </h2>
          </div>
          <div className="pl-9 space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            <p>
              Where physical return of an item is required (e.g. incorrect apparel size or electronics):
            </p>
            <ul className="list-disc pl-5 space-y-1.5 pt-1">
              <li>
                <strong>Seller Error:</strong> If the seller sent an incorrect or defective item, the seller is responsible for campus return logistics or pickup.
              </li>
              <li>
                <strong>Safe Handover:</strong> Hand the item back to an official campus courier or meet at a designated university security post. Both parties must confirm handover in the app to close the dispute.
              </li>
            </ul>
          </div>
        </section>

        {/* Section 5: Off-Platform Warning */}
        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200/70 dark:border-amber-900/40 text-amber-900 dark:text-amber-200 text-xs font-medium space-y-1">
          <div className="flex items-center gap-1.5 font-bold">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Crucial Buyer Protection Notice</span>
          </div>
          <p>
            Never agree to pay sellers or delivery riders outside the SHOPIVERSITY app. External bank transfers, cash payments without in-app confirmation, and private arrangements automatically void all 72-Hour Escrow Protection and refund eligibility.
          </p>
        </div>

        {/* Section 6: Contact */}
        <section className="space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[#ff6b00] text-white text-xs font-black rounded-xl flex items-center justify-center shrink-0">
              5
            </div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              Support & Dispute Escalation
            </h2>
          </div>
          <div className="pl-9 space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            <p>
              Have questions regarding an active dispute? Reach out to our Dispute Resolution Desk at{" "}
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
