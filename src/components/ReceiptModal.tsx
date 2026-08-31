import React, { useState } from "react";
import { Order } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { X, Download, ShieldCheck, Printer, CheckCircle2, Info, Mail, Loader2, Check, Send } from "lucide-react";

interface ReceiptModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
}

export default function ReceiptModal({ order, isOpen, onClose }: ReceiptModalProps) {
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSentSuccess, setEmailSentSuccess] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [showEmailPrompt, setShowEmailPrompt] = useState(false);

  if (!order) return null;

  const handleSendEmail = async () => {
    const targetEmail = (emailInput || (order as any).buyerEmail || "").trim();
    if (!targetEmail) {
      setShowEmailPrompt(true);
      return;
    }

    setIsSendingEmail(true);
    try {
      const res = await fetch("/api/send-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.uniqueOrderId || order.id,
          recipientEmail: targetEmail,
          recipientName: order.buyerName,
          order
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to dispatch receipt");

      setEmailSentSuccess(true);
      setShowEmailPrompt(false);
      setTimeout(() => setEmailSentSuccess(false), 4000);
    } catch (err: any) {
      alert("Email Dispatch Error: " + err.message);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const divider = "==================================================";
    const subDivider = "--------------------------------------------------";
    const asciiText = `
${divider}
               SHOPIVERSITY COMMERCE
               CAMPUZLY ESCROW RECEIPT
${divider}
Order ID:    ${order.uniqueOrderId || order.id}
             [Term 1.1: Traced via Escrow Reference Ledger]
Product ID:  ${order.uniqueProductId || order.productId || "N/A"}
             [Term 9.3: Mandated Unique Code Verified]
Date/Time:   ${new Date(order.createdAt).toLocaleString()}
             [Term 2.1: 48hr Protection Window Active]
Fulfillment: ${(order.deliveryType || "pickup").toUpperCase()}
             [Term 5.1: Subject to Campus Logistic SLA & Estimates]
Payment:     ${(order.paymentStatus || "paid").toUpperCase()}
             [Term 7.1: Transacted Securely via In-App Gateways]
${subDivider}
BUYER:       ${order.buyerName}
             [Term 8.1: Verified Student ID Traceability]
SELLER:      ${order.sellerName || "Shopiversity Merchant"}
             [Term 8.2: Verified Campus Merchant Profile]
${subDivider}
ITEM DESCRIPTION:
Product:     ${order.productName}
Quantity:    ${order.quantity} x
Price:       ₦${order.totalPrice.toLocaleString()}

${subDivider}
SUBTOTAL:    ₦${order.totalPrice.toLocaleString()}
PLATFORM FEE: ₦0.00
TOTAL PAID:  ₦${order.totalPrice.toLocaleString()}
             [Term 1.2: Funds disbursed after fulfillment validation]

${divider}
   SECURITY DISCLOSURE: KEEP THIS OFFICIAL DIGITAL
   RECEIPT FOR ANY SUBSEQUENT ESCROW INTERVENTIONS.
       THANK YOU FOR SUPPORTING CAMPUS MERCHANTS!
==================================================
`;
    const blob = new Blob([asciiText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Shopiversity_Receipt_${order.uniqueOrderId || order.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6 print:p-0">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm print:hidden"
          />

          {/* Modal Content container representing the Thermal Ticket */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            className="relative w-full max-w-md bg-[#faf8f5] dark:bg-[#faf8f5] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-stone-200 text-stone-800 print:shadow-none print:border-none print:rounded-none print:max-w-full print:bg-white print:text-black font-mono text-xs"
          >
            {/* Action Buttons (Hidden on print) */}
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2 print:hidden">
              <button
                onClick={handleSendEmail}
                disabled={isSendingEmail}
                className="p-2.5 bg-white/95 rounded-xl text-stone-700 hover:text-orange-600 transition-all border border-stone-200 active:scale-95 shadow-sm flex items-center gap-1.5"
                title="Send Receipt to Email via Brevo"
              >
                {isSendingEmail ? (
                  <Loader2 className="w-4 h-4 animate-spin text-orange-600" />
                ) : emailSentSuccess ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Mail className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={handlePrint}
                className="p-2.5 bg-white/95 rounded-xl text-stone-700 hover:text-stone-900 transition-all border border-stone-200 active:scale-95 shadow-sm"
                title="Print Receipt"
              >
                <Printer className="w-4 h-4" />
              </button>
              <button
                onClick={handleDownload}
                className="p-2.5 bg-white/95 rounded-xl text-stone-700 hover:text-stone-900 transition-all border border-stone-200 active:scale-95 shadow-sm"
                title="Download Receipt"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-2.5 bg-white/95 rounded-xl text-stone-500 hover:text-red-500 transition-all border border-stone-200 active:scale-95 shadow-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrolling thermal receipt body */}
            <div className="overflow-y-auto max-h-[85vh] p-6 sm:p-8 print:max-h-none print:p-0 relative bg-[#fcfbf9] border-b-8 border-dashed border-stone-300">
              
              {/* Faded Watermark background */}
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.05] pointer-events-none select-none overflow-hidden print:opacity-[0.06]">
                <p className="text-[12vw] font-black uppercase tracking-[0.25em] transform -rotate-12 whitespace-nowrap font-sans text-stone-900">
                  CAMPUZLY
                </p>
              </div>

              <div className="relative space-y-5 z-10 text-[11px]">
                {/* Store Header */}
                <div className="text-center space-y-1">
                  <div className="inline-flex p-2 bg-indigo-50 text-indigo-700 rounded-2xl mb-1">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-black tracking-tight font-sans text-stone-900 uppercase">SHOPIVERSITY</h2>
                  <p className="text-[8px] font-black text-stone-500 uppercase tracking-widest leading-none">Official Escrow Transaction receipt</p>
                  <p className="text-[10px] text-stone-300">------------------------------------------------</p>
                </div>

                {/* Identification block */}
                <div className="space-y-3 pb-3 border-b border-stone-200">
                  <div className="space-y-0.5">
                    <div className="flex justify-between">
                      <span className="text-stone-500">ORDER ID:</span>
                      <span className="font-bold text-stone-900 select-all font-mono">{order.uniqueOrderId || order.id || "N/A"}</span>
                    </div>
                    <span className="text-[8px] text-indigo-600 block text-right font-sans font-bold uppercase tracking-wider">
                      [Term 1.1] Escrow Reference Ledger
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex justify-between">
                      <span className="text-stone-500">PRODUCT ID:</span>
                      <span className="font-bold text-stone-900 select-all font-mono">{order.uniqueProductId || order.productId || "N/A"}</span>
                    </div>
                    <span className="text-[8px] text-indigo-600 block text-right font-sans font-bold uppercase tracking-wider">
                      [Term 9.3] Unique Verification ID Verified
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex justify-between">
                      <span className="text-stone-500">DATE & TIME:</span>
                      <span className="font-bold text-stone-900">{new Date(order.createdAt).toLocaleString()}</span>
                    </div>
                    <span className="text-[8px] text-indigo-600 block text-right font-sans font-bold uppercase tracking-wider">
                      [Term 2.1] 48-Hour Protection Starts From Here
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex justify-between">
                      <span className="text-stone-500">FULFILLMENT:</span>
                      <span className="font-bold uppercase text-stone-900">{order.deliveryType || "pickup"}</span>
                    </div>
                    <span className="text-[8px] text-indigo-600 block text-right font-sans font-bold uppercase tracking-wider">
                      [Term 5.1/9.7] Subject to Campus Logistics SLA
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex justify-between">
                      <span className="text-stone-500">PAYMENT SECURED:</span>
                      <span className="font-bold text-emerald-600 uppercase">₦{(order.totalPrice || 0).toLocaleString()}</span>
                    </div>
                    <span className="text-[8px] text-indigo-600 block text-right font-sans font-bold uppercase tracking-wider">
                      [Term 7.1] Transacted Safely via Secure Gateway
                    </span>
                  </div>
                </div>

                {/* Counterparties */}
                <div className="space-y-2 pb-3 border-b border-stone-200">
                  <div className="space-y-0.5">
                    <div className="flex justify-between">
                      <span className="text-stone-500">BUYER PROFILE:</span>
                      <span className="font-bold whitespace-nowrap text-stone-900">{order.buyerName}</span>
                    </div>
                    <span className="text-[8px] text-indigo-600 block text-right font-sans font-bold uppercase tracking-wider">
                      [Term 8.1] Student ID Verified & Authenticated
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex justify-between">
                      <span className="text-stone-500">SELLER PROFILE:</span>
                      <span className="font-bold whitespace-nowrap text-stone-900">{order.sellerName || "Campus Merchant"}</span>
                    </div>
                    <span className="text-[8px] text-indigo-600 block text-right font-sans font-bold uppercase tracking-wider">
                      [Term 8.2] Fully Verified Active Student Merchant
                    </span>
                  </div>
                </div>

                {/* Items & Fees */}
                <div className="space-y-2 pb-3 border-b border-stone-200">
                  <div className="flex justify-between font-bold text-stone-900 text-[11px] tracking-tight">
                    <span>ITEM DESCRIPTION</span>
                    <span>PRICE</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-stone-950">
                      <span className="font-sans font-black text-stone-900 text-xs">{order.productName}</span>
                      <span className="font-bold text-stone-900">₦{order.totalPrice.toLocaleString()}</span>
                    </div>
                    <div className="text-stone-500 font-mono text-[9px] flex justify-between">
                      <span>Quantity Ordered: {order.quantity}x</span>
                      <span>₦{order.totalPrice.toLocaleString()}</span>
                    </div>
                    {order.ticketTierName && (
                      <div className="text-indigo-600 font-sans text-[9px] uppercase tracking-wider font-bold">
                        Ticket Tier: {order.ticketTierName}
                      </div>
                    )}
                    {order.menuItemName && (
                      <div className="text-indigo-600 font-sans text-[9px] uppercase tracking-wider font-bold">
                        Package Plan: {order.menuItemName}
                      </div>
                    )}
                  </div>
                </div>

                {/* Final Total */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between font-bold text-stone-600">
                    <span>SUBTOTAL</span>
                    <span>₦{order.totalPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-stone-600">
                    <span>PLATFORM TRANSACTION FEE</span>
                    <span>₦0.00</span>
                  </div>
                  <div className="text-[10px] text-stone-300 text-center">------------------------------------------------</div>
                  <div className="space-y-1">
                    <div className="flex justify-between font-black text-stone-950 text-sm">
                      <span>TOTAL PAID Escrow</span>
                      <span>₦{order.totalPrice.toLocaleString()}</span>
                    </div>
                    <span className="text-[8px] text-indigo-600 block text-right font-sans font-bold uppercase tracking-wider">
                      [Term 1.2] Escrow released to seller after buyer confirms safety
                    </span>
                  </div>
                </div>

                {/* Verified Footer */}
                <div className="pt-4 space-y-3 text-center">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full font-sans font-extrabold border border-emerald-100 text-[9px] uppercase tracking-wider">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    Verified Escape Escrow Block
                  </div>
                  <p className="text-[8px] text-stone-400 font-sans leading-normal uppercase font-bold tracking-widest">
                    THis is an official campus receipt.<br/>Keep it stored for your safety.
                  </p>
                  <p className="text-[8px] text-stone-500 uppercase tracking-widest font-black italic">
                    * Powered by Campuzly Escrow System *
                  </p>
                </div>
              </div>
            </div>

            {/* Email Prompt Bar if recipient email is needed */}
            {showEmailPrompt && (
              <div className="p-3 bg-orange-50 border-t border-orange-200 flex items-center gap-2 print:hidden">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Enter email to receive receipt..."
                  className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-orange-200 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500 font-sans"
                />
                <button
                  onClick={handleSendEmail}
                  disabled={isSendingEmail}
                  className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold font-sans uppercase tracking-wider flex items-center gap-1 shrink-0"
                >
                  {isSendingEmail ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                  Send
                </button>
              </div>
            )}

            {/* Download/Print/Email controls for quick mobile action */}
            <div className="p-4 bg-stone-100 border-t border-stone-200 sm:flex sm:justify-between items-center print:hidden">
              <span className="text-[9px] text-stone-500 uppercase font-black tracking-widest block sm:inline mb-2 sm:mb-0">
                {emailSentSuccess ? "✅ Receipt Dispatched to Inbox" : "Safe Campus Marketplace"}
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setShowEmailPrompt(!showEmailPrompt)}
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-orange-600 text-white rounded-xl text-[10px] font-bold hover:bg-orange-700 transition-colors uppercase tracking-wider"
                >
                  <Mail className="w-3 h-3" />
                  Email Receipt
                </button>
                <button
                  onClick={handleDownload}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-[10px] font-bold hover:bg-indigo-700 transition-colors uppercase tracking-wider"
                >
                  <Download className="w-3 h-3" />
                  Save File
                </button>
                <button
                  onClick={handlePrint}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 bg-stone-200 text-stone-800 rounded-xl text-[10px] font-bold hover:bg-stone-300 transition-colors uppercase tracking-wider"
                >
                  <Printer className="w-3 h-3" />
                  Print Out
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
