"use client";

import React, { useMemo } from "react";
import { Handle, Position } from "@xyflow/react";
import { motion } from "framer-motion";

export function InterruptsNode() {
  // Compute active IRQ slots once — stable across re-renders (no shimmer)
  const activeSlots = useMemo(
    () => Array.from({ length: 12 }).map(() => Math.random() > 0.7),
    []
  );

  return (
    <div className="bg-[#080a10]/90 backdrop-blur-md border border-rose-500/30 rounded-xl p-5 w-[250px] shadow-[0_0_30px_rgba(244,63,94,0.15)]">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-rose-500 border-none" />
      
      <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
        <h2 className="text-sm font-bold text-rose-400 uppercase tracking-widest">Hardware IRQs</h2>
      </div>

      <div className="space-y-3">
         <div className="text-[10px] uppercase text-white/50 mb-1">Interrupt Vector Table</div>
         <div className="grid grid-cols-4 gap-2">
             {activeSlots.map((isActive, i) => (
                <div key={i} className="relative aspect-square bg-black/40 border border-white/5 rounded flex items-center justify-center overflow-hidden">
                   <span className="text-[8px] text-white/30 font-mono absolute top-1 left-1">{i}</span>
                   {isActive && (
                      <motion.div 
                        className="absolute inset-0 bg-rose-500/40"
                        initial={{ opacity: 1 }}
                        animate={{ opacity: 0 }}
                        transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse", ease: "circOut" }}
                      />
                   )}
                </div>
             ))}
         </div>
      </div>
      
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-rose-500 border-none" />
    </div>
  );
}
