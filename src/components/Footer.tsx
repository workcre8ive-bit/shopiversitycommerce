import React from "react";
import { ShieldCheck, HelpCircle, Heart, Store, FileText, ArrowRight, Sparkles, AlertCircle } from "lucide-react";
import Logo from "./Logo";

interface FooterProps {
  setActiveTab: (tab: string) => void;
  activeTab: string;
}

export default function Footer({ setActiveTab, activeTab }: FooterProps) {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 font-sans transition-colors duration-300 mt-12">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {/* Column 1: Brand & Description */}
          <div className="space-y-4 col-span-1 md:col-span-1">
            <div className="flex items-center gap-2">
              <Logo showText={true} />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Shopiversity is the trusted, secure student-to-student marketplace. We enable campus entrepreneurs to build businesses, monetize skills, and trade safely within an academic ecosystem.
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-black uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Student Escrow
            </div>
          </div>

          {/* Column 2: Navigation Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-widest text-[#ff6b00]">
              Explore
            </h4>
            <ul className="space-y-2 text-xs font-bold">
              <li>
                <button
                  onClick={() => {
                    setActiveTab("market");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className={`hover:text-[#ff6b00] transition-colors bg-transparent border-none p-0 cursor-pointer ${
                    activeTab === "market" ? "text-[#ff6b00]" : "text-slate-400"
                  }`}
                >
                  Campus Marketplace
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setActiveTab("referrals");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className={`hover:text-[#ff6b00] transition-colors bg-transparent border-none p-0 cursor-pointer ${
                    activeTab === "referrals" ? "text-[#ff6b00]" : "text-slate-400"
                  }`}
                >
                  Ambassador Program
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setActiveTab("history");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className={`hover:text-[#ff6b00] transition-colors bg-transparent border-none p-0 cursor-pointer ${
                    activeTab === "history" ? "text-[#ff6b00]" : "text-slate-400"
                  }`}
                >
                  Transaction History
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Safety & Trust */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-widest text-[#ff6b00]">
              Trust & Support
            </h4>
            <ul className="space-y-2 text-xs font-bold">
              <li>
                <button
                  onClick={() => {
                    setActiveTab("support");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className={`hover:text-[#ff6b00] transition-colors bg-transparent border-none p-0 cursor-pointer ${
                    activeTab === "support" ? "text-[#ff6b00]" : "text-slate-400"
                  }`}
                >
                  Help & Support Center
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setActiveTab("terms");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className={`hover:text-[#ff6b00] transition-colors bg-transparent border-none p-0 cursor-pointer ${
                    activeTab === "terms" ? "text-[#ff6b00]" : "text-slate-400"
                  }`}
                >
                  Terms & Conditions
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Protection Notice */}
          <div className="bg-slate-800/40 border border-slate-800 p-5 rounded-2xl space-y-3">
            <h4 className="text-xs font-black uppercase tracking-widest text-orange-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-orange-400" />
              Escrow Protection
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">
              All purchases on Shopiversity are protected by our automatic student escrow system. Funds are released to the seller ONLY after both the buyer and seller verify successful delivery.
            </p>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] font-bold text-slate-500">
            &copy; 2026 Shopiversity. All rights reserved. Trade with peace of mind.
          </p>
          <p className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
            Made with <Heart className="w-3 h-3 text-red-500 fill-red-500" /> for Campus Creators.
          </p>
        </div>
      </div>
    </footer>
  );
}
