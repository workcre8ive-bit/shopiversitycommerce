import React from "react";
import { ShieldCheck, HelpCircle, Heart, Store, FileText, ArrowRight, Sparkles, AlertCircle, Cookie, RotateCcw, Mail, MapPin } from "lucide-react";
import Logo from "./Logo";

interface FooterProps {
  setActiveTab: (tab: string) => void;
  activeTab: string;
  onOpenCookieSettings?: () => void;
}

export default function Footer({ setActiveTab, activeTab, onOpenCookieSettings }: FooterProps) {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 font-sans transition-colors duration-300 mt-12 w-full shrink-0">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8 pb-16 sm:pb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {/* Column 1: Brand & Real Business Details */}
          <div className="space-y-4 col-span-1 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2">
              <Logo showText={true} />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-medium max-w-sm">
              Shopiversity is the trusted, verified student-to-student marketplace. We enable campus entrepreneurs to build businesses, trade safely, and settle payments through audited escrow protection.
            </p>
            
            <div className="space-y-2 pt-1 text-xs text-slate-400 font-medium">
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#ff6b00] shrink-0 mt-0.5" />
                <span>Shopiversity Technologies Ltd. • Serving Universities Nationwide, Nigeria</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#ff6b00] shrink-0" />
                <a href="mailto:tommzypolaris@gmail.com" className="hover:text-white transition-colors underline">
                  tommzypolaris@gmail.com
                </a>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-black uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>Verified Student Escrow</span>
            </div>
          </div>

          {/* Column 2: Navigation Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-widest text-[#ff6b00]">
              Marketplace
            </h4>
            <ul className="space-y-2 text-xs font-bold">
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("market");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className={`hover:text-[#ff6b00] transition-colors bg-transparent border-none p-0 cursor-pointer text-left py-1 block ${
                    activeTab === "market" ? "text-[#ff6b00]" : "text-slate-400"
                  }`}
                >
                  Campus Marketplace
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("referrals");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className={`hover:text-[#ff6b00] transition-colors bg-transparent border-none p-0 cursor-pointer text-left py-1 block ${
                    activeTab === "referrals" ? "text-[#ff6b00]" : "text-slate-400"
                  }`}
                >
                  Ambassador Program
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("orders");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className={`hover:text-[#ff6b00] transition-colors bg-transparent border-none p-0 cursor-pointer text-left py-1 block ${
                    activeTab === "orders" ? "text-[#ff6b00]" : "text-slate-400"
                  }`}
                >
                  Transaction History & Orders
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("support");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className={`hover:text-[#ff6b00] transition-colors bg-transparent border-none p-0 cursor-pointer text-left py-1 block ${
                    activeTab === "support" ? "text-[#ff6b00]" : "text-slate-400"
                  }`}
                >
                  Help & Dispute Support Desk
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal, Privacy & Compliance */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-widest text-[#ff6b00]">
              Legal & Compliance
            </h4>
            <ul className="space-y-2 text-xs font-bold">
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("terms");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className={`hover:text-[#ff6b00] transition-colors bg-transparent border-none p-0 cursor-pointer text-left py-1 block ${
                    activeTab === "terms" ? "text-[#ff6b00]" : "text-slate-400"
                  }`}
                >
                  Terms & Conditions
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("privacy");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className={`hover:text-[#ff6b00] transition-colors bg-transparent border-none p-0 cursor-pointer text-left py-1 block ${
                    activeTab === "privacy" ? "text-[#ff6b00]" : "text-slate-400"
                  }`}
                >
                  Privacy Policy (NDPA Compliant)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("refund-policy");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className={`hover:text-[#ff6b00] transition-colors bg-transparent border-none p-0 cursor-pointer text-left py-1 block ${
                    activeTab === "refund-policy" ? "text-[#ff6b00]" : "text-slate-400"
                  }`}
                >
                  Refund & Return Policy (72h Escrow)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("cookies");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className={`hover:text-[#ff6b00] transition-colors bg-transparent border-none p-0 cursor-pointer text-left py-1 block ${
                    activeTab === "cookies" ? "text-[#ff6b00]" : "text-slate-400"
                  }`}
                >
                  Cookies & Storage Policy
                </button>
              </li>
              {onOpenCookieSettings && (
                <li>
                  <button
                    type="button"
                    onClick={onOpenCookieSettings}
                    className="text-slate-400 hover:text-[#ff6b00] transition-colors bg-transparent border-none p-0 cursor-pointer text-left py-1 flex items-center gap-1.5"
                  >
                    <Cookie className="w-3 h-3 text-[#ff6b00]" />
                    <span>Manage Cookie Preferences</span>
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Column 4: Protection Notice & Consumer Notice */}
          <div className="bg-slate-800/40 border border-slate-800 p-5 rounded-2xl space-y-3 col-span-1 sm:col-span-2 lg:col-span-1">
            <h4 className="text-xs font-black uppercase tracking-widest text-orange-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-orange-400 shrink-0" />
              <span>Escrow & Consumer Safety</span>
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">
              All transactions on Shopiversity are protected by our automated student escrow. Payment is released to sellers ONLY after verified delivery inspection or after the 72-hour protection window expires.
            </p>
            <div className="pt-2 border-t border-slate-700/50 text-[10px] text-slate-400 font-medium">
              Compliant with the Nigeria Data Protection Act (NDPA 2023) and FCCPC Consumer Protection Standards.
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Compliance */}
        <div className="mt-10 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-center sm:text-left gap-3">
          <p className="text-[11px] font-bold text-slate-500">
            &copy; 2026 Shopiversity Technologies Ltd. All rights reserved. Peer-to-peer campus escrow facilitator.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] font-bold text-slate-500">
            <span>Verified Student Purchases</span>
            <span>•</span>
            <span>PCI-DSS Paystack Tokenization</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              Made with <Heart className="w-3 h-3 text-red-500 fill-red-500 inline shrink-0" /> for Campus Creators.
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
