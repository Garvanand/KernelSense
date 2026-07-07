"use client";

import React from "react";
import { Handle, Position } from "@xyflow/react";
import { motion } from "framer-motion";

export function CacheNode() {
  return (
    <div className="bg-[#080a10]/90 backdrop-blur-md border border-yellow-500/30 rounded-xl p-5 w-[250px] shadow-[0_0_30px_rgba(234,179,8,0.15)]">
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-yellow-500 border-none" />
      
      <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
        <h2 className="text-sm font-bold text-yellow-400 uppercase tracking-widest">CPU Cache</h2>
      </div>

      <div className="space-y-4">
         {["L1", "L2", "L3"].map((level, i) => (
             <div key={level} className="flex justify-between items-center bg-black/40 border border-white/5 p-2 rounded relative overflow-hidden">
                <span className="text-[10px] font-bold text-white relative z-10">{level} Cache</span>
                <span className="text-[10px] font-mono text-yellow-400 relative z-10">{98 - (i * 12)}% HIT</span>
                <motion.div 
                   className="absolute left-0 top-0 bottom-0 bg-yellow-500/10 z-0"
                   initial={{ width: "0%" }}
                   animate={{ width: `${98 - (i * 12)}%` }}
                   transition={{ duration: 1 }}
                />
             </div>
         ))}
      </div>
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-yellow-500 border-none" />
    </div>
  );
}
