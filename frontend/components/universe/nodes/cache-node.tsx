"use client";

import React from "react";
import { Handle, Position } from "@xyflow/react";
import { useTelemetryStore } from "@/lib/store/telemetry-store";
import { motion } from "framer-motion";

export function CacheNode() {
  const systemMetrics = useTelemetryStore((s) => s.systemMetrics);
  const totalCpu = (systemMetrics?.cpu_user_percent || 0) + (systemMetrics?.cpu_system_percent || 0);
  return (
    <div className="bg-[#080a10]/90 backdrop-blur-md border border-yellow-500/30 rounded-xl p-5 w-[250px] shadow-[0_0_30px_rgba(234,179,8,0.15)]">
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-yellow-500 border-none" />
      
      <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
        <h2 className="text-sm font-bold text-yellow-400 uppercase tracking-widest">CPU Cache</h2>
      </div>

      <div className="space-y-4">
         {["L1", "L2", "L3"].map((level, i) => {
             // Base rates: L1 ~95%, L2 ~80%, L3 ~60%. Degrades slightly under heavy load.
             const baseHitRate = 95 - (i * 15);
             const penalty = totalCpu * 0.1 * (i + 1); // Higher levels suffer more penalty
             const hitRate = Math.max(20, Math.round(baseHitRate - penalty));
             
             return (
                 <div key={level} className="flex justify-between items-center bg-black/40 border border-white/5 p-2 rounded relative overflow-hidden">
                    <span className="text-[10px] font-bold text-white relative z-10">{level} Cache</span>
                    <span className="text-[10px] font-mono text-yellow-400 relative z-10">{hitRate}% HIT</span>
                    <motion.div 
                       className="absolute left-0 top-0 bottom-0 bg-yellow-500/10 z-0"
                       animate={{ width: `${hitRate}%` }}
                       transition={{ duration: 0.5, ease: "linear" }}
                    />
                 </div>
             );
         })}
      </div>
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-yellow-500 border-none" />
    </div>
  );
}
