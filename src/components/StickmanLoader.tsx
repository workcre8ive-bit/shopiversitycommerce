import React from "react";
import { motion } from "motion/react";

export default function StickmanLoader() {
  return (
    <div className="flex flex-col items-center justify-center p-6 bg-transparent select-none">
      {/* Sleek, professional standard loader spinner */}
      <div className="relative flex items-center justify-center">
        {/* Outer glowing pulsing ring */}
        <motion.div
          animate={{
            scale: [1, 1.12, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute w-20 h-20 rounded-full bg-[#ff6b00]/10 dark:bg-[#ff6b00]/5 blur-md"
        />
        
        {/* Clean, normal spinning gradient arc */}
        <div className="w-16 h-16 rounded-full border-4 border-slate-100 dark:border-zinc-850/50" />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute w-16 h-16 rounded-full border-4 border-[#ff6b00] border-t-transparent"
        />
      </div>
      
      {/* Clean, modern, professional loading subtitle */}
      <motion.p
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        className="text-[11px] text-slate-400 dark:text-zinc-500 font-extrabold uppercase tracking-widest mt-6"
      >
        Connecting Safely...
      </motion.p>
    </div>
  );
}
