"use client";

import React from "react";
import { Handle, Position } from "@xyflow/react";
import { useTelemetryStore } from "@/lib/store/telemetry-store";
import { motion } from "framer-motion";

export function NetworkNode() {
  const network = useTelemetryStore((s) => s.network);

  return (
    <div className="bg-[#080a10]/90 backdrop-blur-md border border-emerald-500/30 rounded-xl p-5 w-[300px] shadow-[0_0_30px_rgba(16,185,129,0.15)]">
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-emerald-500 border-none" />
      
      <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
        <h2 className="text-sm font-bold text-emerald-400 uppercase tracking-widest">Network Stack</h2>
      </div>

      <div className="space-y-4">
         <div className="flex justify-between items-center bg-black/40 border border-white/5 p-2 rounded">
            <span className="text-[10px] uppercase text-white/50">Recv</span>
            <span className="text-xs font-mono text-emerald-400">{(network?.bytes_recv_sec || 0) / 1024 > 1024 ? ((network?.bytes_recv_sec || 0) / 1024 / 1024).toFixed(1) + ' MB/s' : ((network?.bytes_recv_sec || 0) / 1024).toFixed(0) + ' KB/s'}</span>
         </div>
         <div className="flex justify-between items-center bg-black/40 border border-white/5 p-2 rounded">
            <span className="text-[10px] uppercase text-white/50">Sent</span>
            <span className="text-xs font-mono text-emerald-400">{(network?.bytes_sent_sec || 0) / 1024 > 1024 ? ((network?.bytes_sent_sec || 0) / 1024 / 1024).toFixed(1) + ' MB/s' : ((network?.bytes_sent_sec || 0) / 1024).toFixed(0) + ' KB/s'}</span>
         </div>

         {/* Packets Visualization */}
         <div className="mt-2">
            <div className="text-[9px] uppercase text-white/40 mb-1">Packet Stream</div>
            <div className="h-6 w-full relative overflow-hidden bg-white/5 rounded border border-white/10">
               {Array.from({ length: 5 }).map((_, i) => (
                  <motion.div 
                    key={i} 
                    className="absolute top-0 bottom-0 w-2 bg-emerald-500/50"
                    initial={{ left: "-10%" }}
                    animate={{ left: "110%" }}
                    transition={{ duration: 1 + Math.random(), repeat: Infinity, ease: "linear", delay: Math.random() }}
                  />
               ))}
            </div>
         </div>
      </div>
      
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-emerald-500 border-none" />
    </div>
  );
}
