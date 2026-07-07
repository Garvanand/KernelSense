"use client";

import React from "react";
import { Handle, Position } from "@xyflow/react";
import { useTelemetryStore } from "@/lib/store/telemetry-store";
import { motion } from "framer-motion";

export function SwapNode() {
  const memory = useTelemetryStore((s) => s.memory);
  const incidents = useTelemetryStore((s) => s.incidents);
  const thrashing = incidents.filter(i => i.incident_type === "leak_anomaly"); // mock thrashing incident

  return (
    <div className="bg-[#080a10]/90 backdrop-blur-md border border-purple-500/30 rounded-xl p-5 w-[240px] shadow-[0_0_30px_rgba(168,85,247,0.15)] relative overflow-hidden">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-purple-500 border-none" />
      
      <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
        <h2 className="text-sm font-bold text-purple-400 uppercase tracking-widest">Swap Space</h2>
      </div>

      <div className="space-y-4 relative z-10">
         <div className="text-[9px] uppercase text-white/40 text-center">Disk Paging Area</div>
         
         <div className="h-24 bg-black/40 border border-white/10 rounded flex flex-col justify-end overflow-hidden p-1 gap-0.5">
             {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex gap-0.5">
                    {Array.from({ length: 10 }).map((_, j) => {
                       const isUsed = Math.random() > 0.8;
                       return (
                          <div 
                             key={j}
                             className="flex-1 aspect-square rounded-[1px]"
                             style={{ background: isUsed ? "rgba(168,85,247,0.5)" : "rgba(255,255,255,0.02)" }}
                          />
                       )
                    })}
                </div>
             ))}
         </div>
      </div>
      
      {thrashing.length > 0 && (
         <motion.div 
            className="absolute inset-0 bg-red-500/10 border-2 border-red-500 z-20 pointer-events-none"
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.5, repeat: Infinity }}
         />
      )}
    </div>
  );
}
