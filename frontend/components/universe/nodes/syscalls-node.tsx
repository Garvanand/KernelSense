"use client";

import React from "react";
import { Handle, Position } from "@xyflow/react";
import { useTelemetryStore } from "@/lib/store/telemetry-store";
import { motion } from "framer-motion";

export function SyscallsNode() {
  const telemetry = useTelemetryStore((s) => s.system);

  return (
    <div className="bg-[#080a10]/90 backdrop-blur-md border border-fuchsia-500/30 rounded-xl p-5 w-[250px] shadow-[0_0_30px_rgba(217,70,239,0.15)]">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-fuchsia-500 border-none" />
      
      <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
        <h2 className="text-sm font-bold text-fuchsia-400 uppercase tracking-widest">System Calls</h2>
      </div>

      <div className="space-y-4">
         <div className="flex flex-col items-center justify-center p-4 bg-black/40 border border-white/5 rounded">
            <span className="text-[10px] uppercase text-white/50 mb-1">Context Switches</span>
            <span className="text-2xl font-mono text-fuchsia-400">
               {telemetry?.context_switches_sec?.toLocaleString() || "0"}
               <span className="text-[10px] ml-1 text-white/30">/s</span>
            </span>
         </div>
         
         <div className="text-[9px] uppercase text-white/40 mb-1 text-center">Kernel Traps</div>
         <div className="flex justify-center gap-1">
             {Array.from({ length: 15 }).map((_, i) => (
                <motion.div 
                   key={i}
                   className="w-2 h-2 rounded-full"
                   style={{ backgroundColor: Math.random() > 0.8 ? "rgba(217,70,239,0.8)" : "rgba(255,255,255,0.1)" }}
                   animate={{ opacity: [0.2, 1, 0.2] }}
                   transition={{ duration: 0.5 + Math.random(), repeat: Infinity }}
                />
             ))}
         </div>
      </div>
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-fuchsia-500 border-none" />
    </div>
  );
}
