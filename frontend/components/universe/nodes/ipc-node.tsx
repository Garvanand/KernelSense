"use client";

import React from "react";
import { Handle, Position } from "@xyflow/react";
import { motion } from "framer-motion";
import { useTelemetryStore } from "@/lib/store/telemetry-store";

export function IPCNode() {
  const incidents = useTelemetryStore((s) => s.incidents);
  const contention = incidents.filter(i => i.incident_type === "scheduler_contention");
  
  return (
    <div className="bg-[#080a10]/90 backdrop-blur-md border border-pink-500/30 rounded-xl p-5 w-[280px] shadow-[0_0_30px_rgba(236,72,153,0.15)]">
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-pink-500 border-none" />
      
      <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
        <h2 className="text-sm font-bold text-pink-400 uppercase tracking-widest">Inter-Process Comm</h2>
      </div>

      <div className="space-y-4">
         {/* Pipes */}
         <div>
            <div className="text-[9px] uppercase text-white/40 mb-1">Anonymous Pipes</div>
            <div className="flex items-center justify-between bg-black/40 border border-white/5 p-2 rounded">
                <div className="flex gap-1">
                   {Array.from({ length: 3 }).map((_, i) => (
                      <motion.div 
                         key={i}
                         className="w-8 h-2 rounded-full bg-pink-500/50"
                         animate={{ x: [0, 20, 0] }}
                         transition={{ duration: 2 + i, repeat: Infinity, ease: "linear" }}
                      />
                   ))}
                </div>
                <span className="text-[10px] font-mono text-pink-400">12 Active</span>
            </div>
         </div>
         
         {/* Shared Memory */}
         <div>
            <div className="text-[9px] uppercase text-white/40 mb-1">Shared Memory Segments</div>
            <div className="h-8 bg-black/40 border border-white/5 rounded relative overflow-hidden flex">
               <div className="flex-1 border-r border-white/10 bg-white/5 flex items-center justify-center text-[8px] text-white/30">shm_1</div>
               <div className="flex-1 border-r border-white/10 bg-white/5 flex items-center justify-center text-[8px] text-white/30">shm_2</div>
               <div className="flex-1 bg-white/5 flex items-center justify-center text-[8px] text-white/30">shm_3</div>
               {contention.length > 0 && (
                   <motion.div 
                      className="absolute inset-0 bg-red-500/20 border border-red-500/50"
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 1, repeat: Infinity }}
                   />
               )}
            </div>
         </div>
      </div>
      
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-pink-500 border-none" />
    </div>
  );
}
