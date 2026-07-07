"use client";

import React from "react";
import { Handle, Position } from "@xyflow/react";
import { useTelemetryStore } from "@/lib/store/telemetry-store";
import { motion } from "framer-motion";

export function ProcessTreeNode() {
  const processes = useTelemetryStore((s) => s.processes);

  // Group processes by common names for a simplified tree view
  const topLevel = processes.filter(p => p.cpu_percent > 1).slice(0, 5);

  return (
    <div className="bg-[#080a10]/90 backdrop-blur-md border border-cyan-500/30 rounded-xl p-6 w-[350px] shadow-[0_0_30px_rgba(34,211,238,0.15)]">
      <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
        <h2 className="text-sm font-bold text-white uppercase tracking-widest">Process Genealogy</h2>
        <div className="text-[10px] font-mono text-cyan-400">
           {processes.length} LIVE
        </div>
      </div>

      <div className="relative pl-4 border-l border-white/10 space-y-4">
         {topLevel.map((p, idx) => (
            <motion.div 
               key={p.pid}
               className="relative"
               initial={{ opacity: 0, x: -10 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: idx * 0.1 }}
            >
               {/* Line connector */}
               <div className="absolute top-3 -left-4 w-4 h-px bg-white/20" />
               
               <div className="bg-black/40 border border-white/10 rounded p-2 flex items-center justify-between">
                  <div>
                     <div className="text-[11px] font-bold text-white">{p.name}</div>
                     <div className="text-[9px] text-white/40 font-mono">PID: {p.pid}</div>
                  </div>
                  <div className="text-[10px] font-mono" style={{ color: p.cpu_percent > 20 ? "var(--severity-warning)" : "var(--color-process)" }}>
                     {p.cpu_percent.toFixed(1)}%
                  </div>
               </div>
               
               {/* Children (mocked based on process count for visual) */}
               {p.num_threads && p.num_threads > 10 && (
                  <div className="pl-6 mt-2 relative border-l border-white/5 space-y-2">
                     <div className="absolute top-2 -left-px w-4 h-px bg-white/10" />
                     <div className="bg-black/20 border border-white/5 rounded px-2 py-1 text-[9px] text-white/50 inline-block">
                        +{p.num_threads} threads
                     </div>
                  </div>
               )}
            </motion.div>
         ))}
      </div>
      
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-cyan-500 border-none" />
    </div>
  );
}
