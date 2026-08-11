import React from "react";
import { motion } from "motion/react";
import { FileText, ChevronLeft, Shield, Scale, Lock, Info } from "lucide-react";

interface TermsAndConditionsProps {
  onBack: () => void;
}

export default function TermsAndConditions({ onBack }: TermsAndConditionsProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors font-bold text-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-2xl">
          <FileText className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Last Updated: April 2024</span>
        </div>
      </div>

      <div className="text-center space-y-4">
        <h1 className="text-4xl font-black text-slate-900 dark:text-white font-display tracking-tight">Terms & Conditions</h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-medium">
          Please read these terms carefully before using SHOPIVERSITY. By using our platform, you agree to these rules.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
          <div className="w-12 h-12 bg-purple-50 dark:bg-purple-950/20 rounded-2xl flex items-center justify-center text-purple-600">
            <Shield className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">User Responsibility</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            Users are responsible for maintaining the confidentiality of their account. You must provide accurate information when signing up and listing products.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
          <div className="w-12 h-12 bg-purple-50 dark:bg-purple-950/20 rounded-2xl flex items-center justify-center text-purple-600">
            <Scale className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Marketplace Rules</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            SHOPIVERSITY is a platform for students. All transactions must be honest. Prohibited items include illegal goods, weapons, or anything that violates campus policies.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
          <div className="w-12 h-12 bg-purple-50 dark:bg-purple-950/20 rounded-2xl flex items-center justify-center text-purple-600">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Payments & Payouts</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            Online payments are held securely until delivery is confirmed. SHOPIVERSITY takes a 5% commission on all successful sales to maintain the platform.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
          <div className="w-12 h-12 bg-purple-50 dark:bg-purple-950/20 rounded-2xl flex items-center justify-center text-purple-600">
            <Info className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Dispute Resolution</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            In case of issues, SHOPIVERSITY provides a reporting system. We will mediate disputes based on evidence provided by both buyers and sellers.
          </p>
        </div>
      </div>

      <div className="bg-slate-900 dark:bg-white rounded-[2.5rem] p-10 text-white dark:text-slate-900 space-y-8">
        <h2 className="text-2xl font-bold font-display">SHOPIVERSITY Escrow, Delivery & Dispute Terms</h2>
        
        <div className="space-y-8 text-slate-300 dark:text-slate-600 text-sm leading-relaxed font-medium">
          <p className="border border-orange-500/30 px-4 py-3 bg-slate-800/50 dark:bg-slate-50 rounded-2xl font-bold">
            By buying or selling on SHOPIVERSITY, you agree to these terms.
          </p>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-white dark:text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 bg-purple-500 text-white text-[10px] flex items-center justify-center rounded-full shrink-0">1</span>
              Escrow & Payment Before Delivery
            </h3>
            <div className="space-y-2 pl-8">
              <p>1.1. When you pay for an item, SHOPIVERSITY holds your money in escrow. The seller will not receive payment until you confirm delivery.</p>
              <p>1.2. After you tap “Confirm Delivery” in the app, SHOPIVERSITY disburses payment to the seller within 24 hours, minus a 5% SHOPIVERSITY commission.</p>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-white dark:text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 bg-purple-500 text-white text-[10px] flex items-center justify-center rounded-full shrink-0">2</span>
              48-Hour Buyer Protection Window
            </h3>
            <div className="space-y-2 pl-8">
              <p>2.1. You have <strong>48 hours from the stated delivery time</strong> to inspect your order.</p>
              <p>2.2. Within 48 hours, you must either:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Tap <strong>“Confirm Delivery”</strong> &rarr; Seller gets paid. Case closed.</li>
                <li>Tap <strong>“Raise Dispute”</strong> &rarr; Funds stay in escrow while we investigate.</li>
              </ul>
              <p>2.3. If you do nothing for 48 hours, SHOPIVERSITY will automatically mark the order as “Delivered” and pay the seller. <strong>All sales are final after 48 hours.</strong></p>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-white dark:text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 bg-purple-500 text-white text-[10px] flex items-center justify-center rounded-full shrink-0">3</span>
              Disputes & Seller Response Time
            </h3>
            <div className="space-y-2 pl-8">
              <p>3.1. If you raise a dispute, the seller has <strong>24 hours from the time you complained</strong> to provide valid proof of delivery.</p>
              <p>3.2. <strong>Total timeline = 48 hours + 24 hours = 72 hours from the original delivery time.</strong> This is not an extra 72 hours after your complaint. If you complain at hour 47, the seller still only has until hour 72 to respond.</p>
              <p>3.3. <strong>Valid proof of delivery includes:</strong> A signed delivery note from you, OR logistics tracking confirmation showing “Delivered”. Timestamped photos are accepted only if the courier provides them.</p>
              <p>3.4. <strong>If seller provides valid proof within 72 hours:</strong> Order is confirmed. Seller is paid after your 48-hour protection window ends.</p>
              <p>3.5. <strong>If seller fails to respond or provide valid proof within 72 hours:</strong> You get a full refund from escrow. The seller receives a <em>warning strike</em>. A second offense will result in <em>account suspension</em>. SHOPIVERSITY is not liable.</p>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-white dark:text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 bg-purple-500 text-white text-[10px] flex items-center justify-center rounded-full shrink-0">4</span>
              Non-Delivery
            </h3>
            <div className="space-y-2 pl-8">
              <p>4.1. If the seller does not deliver within the stated delivery time <strong>AND</strong> you did not raise a dispute <strong>AND</strong> you did not tap “Delivered”, you will be refunded from escrow. The seller will not be paid.</p>
              <p>4.2. To be eligible for refund, you must take action in the app. Doing nothing does not guarantee automatic refund.</p>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-white dark:text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 bg-purple-500 text-white text-[10px] flex items-center justify-center rounded-full shrink-0">5</span>
              Logistics & Mandatory Partner Registration
            </h3>
            <div className="space-y-2 pl-8">
              <p>5.1. <strong>Registered SHOPIVERSITY Logistics Partners:</strong> To maintain escrow protection and buyer safety, all delivery dispatches must be assigned directly to verified Logistics Partners registered on the SHOPIVERSITY platform.</p>
              <p>5.2. <strong>Outsourced Delivery Company Registration:</strong> Unverified off-platform courier outsourcing is strictly prohibited for security and escrow integrity. If a seller wishes to utilize an external logistics company, courier agency, or student delivery rider, that courier company MUST register as an official Logistics Partner on SHOPIVERSITY according to our Terms & Conditions before taking custody of order dispatches.</p>
              <p>5.3. <strong>Courier Verification & Compliance:</strong> Registered courier partners must agree to platform tracking and escrow delivery confirmation rules. Sellers who attempt off-platform logistics dispatch without official registration risk order invalidation and account warnings.</p>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-white dark:text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 bg-purple-500 text-white text-[10px] flex items-center justify-center rounded-full shrink-0">6</span>
              Refunds & Fees
            </h3>
            <div className="space-y-2 pl-8">
              <p>6.1. Refunds due to seller or logistics fault are processed in full to your SHOPIVERSITY Wallet or bank.</p>
              <p>6.2. For all refunds, payment gateway charges of up to 3% may be deducted as these fees are non-refundable by Paystack/Flutterwave. SHOPIVERSITY does not profit from refunds.</p>
              <p>6.3. If you cancel after the seller has shipped, or for “change of mind” disputes, a 3% processing fee applies.</p>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-white dark:text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 bg-purple-500 text-white text-[10px] flex items-center justify-center rounded-full shrink-0">7</span>
              Payment on Delivery [POD] & Off-Platform Non-Payment Strike Policy
            </h3>
            <div className="space-y-2 pl-8">
              <p>7.1. <strong>For POD orders, payment must be made through the SHOPIVERSITY app when receiving the delivery.</strong></p>
              <p>7.2. If payment is made outside the app, SHOPIVERSITY will not accept any complaints of bad product, non-delivery by seller, or non-payment by buyer. <strong>SHOPIVERSITY is not responsible since there is no proof of payment on the app.</strong></p>
              <p>7.3. The “Delivered” button will not be activated for the buyer to confirm unless payment is made through the app.</p>
              <p>7.4. <strong>3-Day Payment & Offense Policy:</strong> If 3 days pass after the delivery time and payment was not made through SHOPIVERSITY, the seller will receive a <em>warning strike</em> message from the app. On the 2nd offense, the seller’s account will be <em>suspended</em>. Repeated offenses will result in a <em>permanent ban</em>.</p>
              <p>7.5. <strong>Buyers must report and refuse if a seller asks for payment outside the app.</strong> Using SHOPIVERSITY for payment protects you.</p>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-white dark:text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 bg-purple-500 text-white text-[10px] flex items-center justify-center rounded-full shrink-0">8</span>
              Account Verification & Fraud
            </h3>
            <div className="space-y-2 pl-8">
              <p>8.1. <strong>All users must verify their Student ID in their profile after login, and verify their email or phone number during sign up, to buy or sell on SHOPIVERSITY.</strong> There is no minimum amount — verification is required for all transactions.</p>
              <p>8.2. <strong>Your profile details including your ID upload are required for traceability.</strong> Accepted forms of ID include: BVN, PVC, Student ID Card, NIN, or any other valid government-issued personal identification.</p>
              <p>8.3. Providing false information, fraudulent disputes, requesting off-app payments, or failing to deliver after payment may result in suspension, permanent ban, and reporting to authorities.</p>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-white dark:text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 bg-purple-500 text-white text-[10px] flex items-center justify-center rounded-full shrink-0">9</span>
              Order Tracking & Product ID Verification
            </h3>
            <div className="space-y-2 pl-8">
              <p>9.1. <strong>Platform Status:</strong> SHOPIVERSITY acts solely as a marketplace platform facilitating transactions and is not a direct merchant.</p>
              <p>9.2. <strong>Verification:</strong> Buyers must thoroughly inspect and verify physical orders to their full satisfaction before providing confirmation in the app.</p>
              <p>9.3. <strong>Product ID Verification:</strong> Product ID verification is strictly mandatory before finalizing payment processing and completing files.</p>
              <p>9.4. <strong>Quality Responsibility:</strong> Sellers remain fully and solely responsible for the description, compliance, and custom quality of all products listed.</p>
              <p>9.5. <strong>Completion:</strong> Orders are only marked officially completed after successful escrow clearance and payment processing.</p>
              <p>9.6. <strong>Off-App Operations:</strong> If any seller requests payment outside the SHOPIVERSITY app, buyers should refuse immediately and report the user behavior. Payments made outside the SHOPIVERSITY platform are absolutely not protected by SHOPIVERSITY policies.</p>
              <p>9.7. <strong>Estimation:</strong> All system countdown timers for delivery and pickup are estimates only and do not represent exact arrival guarantees.</p>
            </div>
          </section>

          <div className="pt-8 border-t border-slate-800 dark:border-slate-100 text-center">
            <p className="italic text-xs">
              By using SHOPIVERSITY, you agree that SHOPIVERSITY is a venue. We hold funds for safety but are not responsible for the actions of users or third-party couriers outside our recommended partners.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
