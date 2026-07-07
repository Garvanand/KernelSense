"use client";

import React from "react";
import { Handle, Position } from "@xyflow/react";
import { motion } from "framer-motion";

export function GPUNode() {
  return (
    <div className="bg-[#080a10]/90 backdrop-blur-md border border-lime-500/30 rounded-xl p-5 w-[260px] shadow-[0_0_30px_rgba(132,204,22,0.15)]">
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-lime-500 border-none" />
      
      <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
        <h2 className="text-sm font-bold text-lime-400 uppercase tracking-widest">Graphics (GPU)</h2>
      </div>

      <div className="space-y-4">
         {/* Compute Cores */}
         <div>
             <div className="text-[9px] uppercase text-white/40 mb-1">Compute Utilization</div>
             <div className="flex items-center gap-2">
                <div className="flex-1 bg-black/40 h-2 rounded-full overflow-hidden">
                   <motion.div 
                     className="h-full bg-lime-500"
                     animate={{ width: ["15%", "45%", "25%"] }}
                     transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                   />
                </div>
                <span className="text-[10px] font-mono text-lime-400 w-8 text-right">32%</span>
             </div>
         </div>

         {/* VRAM */}
         <div>
             <div className="text-[9px] uppercase text-white/40 mb-1">VRAM Allocation</div>
             <div className="grid grid-cols-8 gap-0.5 border border-white/10 rounded p-1">
                 {Array.from({ length: 24 }).map((_, i) => (
                    <motion.div 
                       key={i}
                       className="aspect-square bg-lime-500/20"
                       animate={{ opacity: i < 14 ? 1 : 0.2 }}
                    />
                 ))}
             </div>
         </div>
      </div>
      
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-lime-500 border-none" />
    </div>
  );
}
