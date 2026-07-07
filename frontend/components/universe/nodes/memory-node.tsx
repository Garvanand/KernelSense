"use client";

import React from "react";
import { Handle, Position } from "@xyflow/react";
import { useTelemetryStore } from "@/lib/store/telemetry-store";
import { motion } from "framer-motion";

export function MemoryNode() {
  const memory = useTelemetryStore((s) => s.memory);
  const incidents = useTelemetryStore((s) => s.incidents);

  const percent = memory?.percent || 0;
  const isWarning = percent > 75;
  const isCritical = percent > 90;
  
  // Find memory leaks
  const leakIncidents = incidents.filter(i => i.incident_type === "leak_anomaly");

  return (
    <div className="bg-[#080a10]/90 backdrop-blur-md border border-indigo-500/30 rounded-xl p-6 w-[600px] shadow-[0_0_30px_rgba(129,140,248,0.15)]">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-indigo-500 border-none" />
      
      <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-2">
        <h2 className="text-sm font-bold text-indigo-400 uppercase tracking-widest">Memory Management Unit</h2>
        <div className="text-[10px] font-mono" style={{ color: isCritical ? "var(--severity-critical)" : isWarning ? "var(--severity-warning)" : "white" }}>
           {percent.toFixed(1)}% SATURATION
        </div>
      </div>

      <div className="flex gap-6">
        {/* Virtual Memory Space */}
        <div className="flex-1">
          <div className="text-[10px] uppercase text-white/40 tracking-wider mb-2 text-center">Virtual Space</div>
          <div className="border border-white/10 rounded-lg p-2 bg-black/30 h-48 flex flex-col gap-1 overflow-hidden relative">
             <div className="flex-1 bg-white/5 border border-white/5 rounded text-[8px] flex items-center justify-center text-white/30">Stack</div>
             <div className="flex-1 bg-white/5 border border-white/5 rounded text-[8px] flex items-center justify-center text-white/30">Heap</div>
             <div className="flex-1 bg-white/5 border border-white/5 rounded text-[8px] flex items-center justify-center text-white/30">BSS / Data</div>
             <div className="flex-1 bg-white/5 border border-white/5 rounded text-[8px] flex items-center justify-center text-white/30">Text (Code)</div>
             
             {/* Leak Animation overlay */}
             {leakIncidents.length > 0 && (
                 <motion.div 
                   className="absolute top-1/4 left-0 right-0 h-1/2 bg-red-500/20 mix-blend-screen"
                   animate={{ opacity: [0, 0.5, 0], scaleY: [1, 1.2, 1] }}
                   transition={{ duration: 2, repeat: Infinity }}
                 >
                     <div className="absolute inset-0 flex items-center justify-center">
                         <span className="text-[8px] font-bold text-red-400 rotate-[-15deg] uppercase">Anomaly Detected</span>
                     </div>
                 </motion.div>
             )}
          </div>
        </div>

        {/* Page Table / TLB */}
        <div className="w-32 flex flex-col items-center justify-center relative">
           <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 border-l border-dashed border-white/20 w-px -z-10" />
           <div className="bg-[#111520] border border-white/10 rounded px-3 py-2 text-center shadow-lg relative">
              <div className="text-[8px] uppercase text-white/40 mb-1">Translation</div>
              <div className="text-[10px] font-bold text-white">Page Table</div>
              
              <motion.div 
                 className="absolute -left-12 top-1/2 w-8 h-px bg-indigo-500"
                 animate={{ opacity: [0, 1, 0], x: [0, 20, 0] }}
                 transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
              <motion.div 
                 className="absolute -right-12 top-1/2 w-8 h-px bg-indigo-500"
                 animate={{ opacity: [0, 1, 0], x: [0, 20, 0] }}
                 transition={{ duration: 1.5, repeat: Infinity, ease: "linear", delay: 0.75 }}
              />
           </div>
           
           <div className="mt-8 bg-[#111520] border border-white/10 rounded px-3 py-2 text-center shadow-lg">
              <div className="text-[8px] uppercase text-white/40 mb-1">Cache</div>
              <div className="text-[10px] font-bold text-indigo-400">TLB</div>
           </div>
        </div>

        {/* Physical Frames */}
        <div className="flex-1">
          <div className="text-[10px] uppercase text-white/40 tracking-wider mb-2 text-center">Physical RAM</div>
          <div className="grid grid-cols-6 gap-1 p-2 bg-black/30 border border-white/10 rounded-lg h-48 content-start">
             {Array.from({ length: 48 }).map((_, i) => {
                 const isUsed = i < Math.floor((percent / 100) * 48);
                 return (
                     <div 
                        key={i} 
                        className="aspect-square rounded-[2px]"
                        style={{ 
                            background: isUsed ? `rgba(129,140,248, ${0.4 + (Math.random() * 0.4)})` : 'rgba(255,255,255,0.05)',
                            border: isUsed ? '1px solid rgba(129,140,248,0.5)' : 'none'
                        }}
                     />
                 );
             })}
          </div>
        </div>
      </div>
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-orange-500 border-none" />
    </div>
  );
}
