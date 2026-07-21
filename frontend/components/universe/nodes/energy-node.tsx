"use client";

import React from "react";
import { Handle, Position } from "@xyflow/react";
import { useTelemetryStore } from "@/lib/store/telemetry-store";
import { motion } from "framer-motion";

export function EnergyNode() {
  const systemMetrics = useTelemetryStore((s) => s.systemMetrics);

  // Derive estimated power and temp from actual system load since hardware sensors are OS-dependent
  const cpuUser = systemMetrics?.cpu_user_percent || 0;
  const cpuSys = systemMetrics?.cpu_system_percent || 0;
  const totalCpu = cpuUser + cpuSys;
  
  // Base 40C, + up to 50C based on load
  const estimatedTemp = Math.round(40 + (totalCpu * 0.5));
  // Base 15W, + up to 80W based on load
  const estimatedPower = (15 + (totalCpu * 0.8)).toFixed(1);
  
  // Real freq if available
  const cpuFreq = systemMetrics?.cpu_freq_mhz;

  return (
    <div className="bg-[#080a10]/90 backdrop-blur-md border border-amber-500/30 rounded-xl p-5 w-[220px] shadow-[0_0_30px_rgba(245,158,11,0.15)]">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-amber-500 border-none" />
      
      <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
        <h2 className="text-sm font-bold text-amber-400 uppercase tracking-widest">Power & Thermals</h2>
      </div>

      <div className="space-y-4">
         <div className="flex justify-between items-center bg-black/40 border border-white/5 p-2 rounded">
            <span className="text-[10px] uppercase text-white/50">Package Temp</span>
            <span className="text-xs font-mono text-amber-400">
               {estimatedTemp}°C <span className="text-[8px] text-white/30 ml-1">(est)</span>
            </span>
         </div>
         <div className="flex justify-between items-center bg-black/40 border border-white/5 p-2 rounded">
            <span className="text-[10px] uppercase text-white/50">Power Draw</span>
            <span className="text-xs font-mono text-amber-400">
               {estimatedPower} W <span className="text-[8px] text-white/30 ml-1">(est)</span>
            </span>
         </div>
         {cpuFreq ? (
             <div className="flex justify-between items-center bg-black/40 border border-white/5 p-2 rounded">
                <span className="text-[10px] uppercase text-white/50">CPU Freq</span>
                <span className="text-xs font-mono text-amber-400">{Math.round(cpuFreq)} MHz</span>
             </div>
         ) : null}
      </div>
    </div>
  );
}
