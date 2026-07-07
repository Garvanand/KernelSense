"use client";

import React from "react";
import { Handle, Position } from "@xyflow/react";
import { motion } from "framer-motion";

export function EnergyNode() {
  return (
    <div className="bg-[#080a10]/90 backdrop-blur-md border border-amber-500/30 rounded-xl p-5 w-[220px] shadow-[0_0_30px_rgba(245,158,11,0.15)]">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-amber-500 border-none" />
      
      <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
        <h2 className="text-sm font-bold text-amber-400 uppercase tracking-widest">Power & Thermals</h2>
      </div>

      <div className="space-y-4">
         <div className="flex justify-between items-center bg-black/40 border border-white/5 p-2 rounded">
            <span className="text-[10px] uppercase text-white/50">Package Temp</span>
            <motion.span 
               className="text-xs font-mono text-amber-400"
               animate={{ color: ["#fbbf24", "#f59e0b", "#fbbf24"] }}
               transition={{ duration: 2, repeat: Infinity }}
            >
               68°C
            </motion.span>
         </div>
         <div className="flex justify-between items-center bg-black/40 border border-white/5 p-2 rounded">
            <span className="text-[10px] uppercase text-white/50">Power Draw</span>
            <span className="text-xs font-mono text-amber-400">45.2 W</span>
         </div>
      </div>
    </div>
  );
}
