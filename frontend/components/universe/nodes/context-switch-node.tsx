"use client";

import React from "react";
import { Handle, Position } from "@xyflow/react";
import { motion, AnimatePresence } from "framer-motion";

export function ContextSwitchNode() {
  // A visual representation of the context switch micro-state
  return (
    <div className="bg-[#080a10]/90 backdrop-blur-md border border-cyan-500/30 rounded-xl p-5 w-[250px] shadow-[0_0_30px_rgba(34,211,238,0.15)] relative overflow-hidden">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-cyan-500 border-none" />
      
      <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
        <h2 className="text-sm font-bold text-cyan-400 uppercase tracking-widest">Context Switch</h2>
      </div>

      <div className="space-y-2">
         {["Save Registers", "Save Stack Pointer", "Save Program Counter", "Flush TLB", "Load Next PCB", "Restore Registers", "Resume"].map((step, i) => (
             <div key={i} className="flex items-center gap-3">
                 <div className="w-1.5 h-1.5 rounded-full bg-white/20 relative">
                    <motion.div 
                       className="absolute inset-0 rounded-full bg-cyan-400"
                       animate={{ opacity: [0, 1, 0] }}
                       transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.1, ease: "linear" }}
                    />
                 </div>
                 <span className="text-[9px] uppercase text-white/50 font-mono tracking-wider">{step}</span>
             </div>
         ))}
      </div>
    </div>
  );
}
