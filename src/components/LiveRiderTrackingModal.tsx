import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, MapPin, Phone, MessageSquare, Compass, Shield, Navigation, AlertCircle } from "lucide-react";

interface LiveRiderTrackingModalProps {
  order: any;
  progress: number;
  onClose: () => void;
}

export default function LiveRiderTrackingModal({ order, progress, onClose }: LiveRiderTrackingModalProps) {
  if (!order) return null;

  // Derive dynamic status and detail text based on progress percentage
  const getStatusDetails = (pct: number) => {
    if (pct < 25) {
      return {
        title: "Heading to Seller",
        desc: "Rider is navigating to the merchant's address to collect your parcel.",
        status: "preparing",
        accent: "text-amber-500 bg-amber-50 dark:bg-amber-950/20",
        barColor: "bg-amber-500"
      };
    } else if (pct < 45) {
      return {
        title: "Arrived at Pickup Spot",
        desc: "Rider is validating items and securing package in the logistics thermal bag.",
        status: "packing",
        accent: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20",
        barColor: "bg-indigo-500"
      };
    } else if (pct < 75) {
      return {
        title: "En Route to Destination",
        desc: "Parcel is in transit. Rider is moving swiftly through traffic to reach you.",
        status: "transit",
        accent: "text-blue-500 bg-blue-50 dark:bg-blue-900/20",
        barColor: "bg-brand-gradient"
      };
    } else if (pct < 95) {
      return {
        title: "Almost There!",
        desc: "Rider is less than 500m away. Please prepare to receive your shipment.",
        status: "nearby",
        accent: "text-purple-500 bg-purple-50 dark:bg-purple-950/20",
        barColor: "bg-purple-500"
      };
    } else {
      return {
        title: "Arrived at Doorstep",
        desc: "Rider has arrived! Present your visual Verification ID to accept parcel.",
        status: "arrived",
        accent: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20",
        barColor: "bg-emerald-500"
      };
    }
  };

  const currentStatusState = getStatusDetails(progress);

  // Simulated GPS route coordinate parameters for path mapping
  const pathCoordinates = [
    { x: 50, y: 150 },
    { x: 120, y: 110 },
    { x: 220, y: 160 },
    { x: 330, y: 90 },
    { x: 450, y: 150 }
  ];

  // Mathematically interpolate rider position along path segments based on progress
  const getRiderPositionAlongCoordinates = (pct: number) => {
    const segments = pathCoordinates.length - 1;
    const segmentWeight = 100 / segments;
    const currentSegmentIndex = Math.floor(pct / segmentWeight);
    const segmentPct = (pct % segmentWeight) / segmentWeight;

    if (currentSegmentIndex >= segments) {
      return pathCoordinates[segments];
    }

    const start = pathCoordinates[currentSegmentIndex];
    const end = pathCoordinates[currentSegmentIndex + 1];

    return {
      x: start.x + (end.x - start.x) * segmentPct,
      y: start.y + (end.y - start.y) * segmentPct
    };
  };

  const riderPos = getRiderPositionAlongCoordinates(progress);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg bg-white dark:bg-slate-950 rounded-[2.5rem] overflow-hidden border border-slate-100 dark:border-slate-800 shadow-2xl relative flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-900 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-orange-500/10 text-orange-600 rounded-xl">
                <Compass className="w-5 h-5 animate-spin-slow" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-bold">Logistics Hub</span>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Live Route Telemetry</h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl transition-all text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Interactive Simulated GPS Map Viewport */}
          <div className="bg-slate-50 dark:bg-slate-900/40 relative h-48 border-b border-slate-100 dark:border-slate-900 overflow-hidden select-none">
            {/* Soft grid decoration */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#334155_1px,transparent_1px),linear-gradient(to_bottom,#334155_1px,transparent_1px)] bg-[size:24px_24px] opacity-25" />

            <svg className="w-full h-full p-4" viewBox="0 0 500 240" preserveAspectRatio="xMidYMid meet">
              {/* Main Connecting Route Polylines */}
              <path
                d="M 50 150 L 120 110 L 220 160 L 330 90 L 450 150"
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="6"
                className="dark:stroke-slate-800"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Highlight completed path */}
              <path
                d="M 50 150 L 120 110 L 220 160 L 330 90 L 450 150"
                fill="none"
                stroke="url(#route-gradient)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="500"
                strokeDashoffset={500 - (progress / 100) * 500}
                className="transition-all duration-300"
              />

              {/* Path gradients */}
              <defs>
                <linearGradient id="route-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
              </defs>

              {/* Landmark Street Names Visual Hints */}
              <text x="80" y="80" className="text-[9px] fill-slate-300 dark:fill-slate-700 font-bold uppercase tracking-wider">Herbert Macaulay Way</text>
              <text x="260" y="210" className="text-[9px] fill-slate-300 dark:fill-slate-700 font-bold uppercase tracking-wider">Third Mainland Ramp</text>

              {/* Anchor A - Seller Shop Icon */}
              <g transform="translate(50, 150)">
                <circle r="16" fill="#a855f7" className="opacity-15" />
                <circle r="8" fill="#a855f7" className="stroke-white dark:stroke-slate-900 stroke-2" />
                <text y="-18" textAnchor="middle" className="text-[8px] font-black uppercase text-purple-500 fill-purple-500 tracking-widest bg-white">SHOP</text>
              </g>

              {/* Anchor B - Buyer Home Address */}
              <g transform="translate(450, 150)">
                <circle r="16" fill="#10b981" className="opacity-15 animate-ping" style={{ animationDuration: '3s' }} />
                <circle r="8" fill="#10b981" className="stroke-white dark:stroke-slate-900 stroke-2" />
                <text y="-18" textAnchor="middle" className="text-[8px] font-black uppercase text-emerald-500 fill-emerald-500 tracking-widest">HOME</text>
              </g>

              {/* Interactive Animated Motorbike Messenger Circle Marker */}
              <g transform={`translate(${riderPos.x}, ${riderPos.y})`} className="transition-all duration-500 ease-out">
                <circle r="22" fill="#3b82f6" className="opacity-20 animate-pulse" />
                <rect x="-14" y="-14" width="28" height="28" rx="8" className="fill-slate-950 stroke-white stroke-2 shadow-lg" />
                <text x="0" y="4" textAnchor="middle" className="text-sm">🏍️</text>
              </g>
            </svg>
          </div>

          {/* Core Status Block */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-900 bg-white dark:bg-slate-950">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <span className={`inline-block px-2.5 py-1 text-[8px] font-black uppercase tracking-wider rounded-lg mb-2 ${currentStatusState.accent}`}>
                  {currentStatusState.title}
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  {currentStatusState.desc}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-black text-slate-900 dark:text-white font-mono">{progress}% Complete</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">ETA: {Math.max(1, Math.ceil((100 - progress) / 5))} mins</p>
              </div>
            </div>

            {/* Premium Multi-step Visual Line Progress Bar */}
            <div className="relative h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ease-out ${currentStatusState.barColor}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Courier Card Details */}
          <div className="p-6 bg-slate-50/50 dark:bg-slate-900/15 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-slate-200 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-xl shadow-inner uppercase tracking-wider text-slate-500 font-black">
                {order.buyerName?.slice(0, 2) || "SB"}
              </div>
              <div className="flex-1 text-left">
                <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  {order.kwikRiderId?.startsWith("CAMPUS-") 
                    ? order.kwikRiderId.replace("CAMPUS-", "").replace(/-/g, " ") 
                    : order.kwikRiderId?.startsWith("OUTSOURCED-") 
                      ? order.kwikRiderId.replace("OUTSOURCED-", "").replace(/-/g, " ") 
                      : "Campus Dispatch Rider"}
                </p>
                <p className="text-[10px] text-slate-400 font-black tracking-widest font-mono uppercase mt-0.5">
                  STATUS: ON THE WAY • DISPATCH RIDER
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg text-[9px] font-extrabold text-amber-500">
                  ★ 4.8
                </div>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <a
                href="tel:+2348147204142"
                className="h-10 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <Phone className="w-3.5 h-3.5" />
                Call Courier
              </a>
              <button
                type="button"
                onClick={() => {
                  alert("Rider details matched! If you have dispatch questions, please raise a dispute or write to Support.");
                }}
                className="h-10 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-600 text-white dark:text-slate-950 font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Chat/Message
              </button>
            </div>
          </div>

          {/* Secure Trust Notice */}
          <div className="px-6 py-4 bg-slate-100/50 dark:bg-slate-900/30 text-center flex items-center justify-center gap-2 text-[9px] text-slate-400 font-bold uppercase tracking-widest border-t border-slate-100 dark:border-slate-900">
            <Shield className="w-3 h-3 text-emerald-500 shrink-0" />
            <span>Escrow protected by shopiversity systems</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
