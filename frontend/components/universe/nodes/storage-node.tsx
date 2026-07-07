"use client";

import React from "react";
import { Handle, Position } from "@xyflow/react";
import { useTelemetryStore } from "@/lib/store/telemetry-store";
import { motion } from "framer-motion";

export function StorageNode() {
  const io = useTelemetryStore((s) => s.io);

  return (
    <div className="bg-[#080a10]/90 backdrop-blur-md border border-slate-500/30 rounded-xl p-5 w-[300px] shadow-[0_0_30px_rgba(100,116,139,0.15)]">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-slate-500 border-none" />
      
      <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">VFS & Block I/O</h2>
      </div>

      <div className="space-y-4">
         <div className="flex justify-between items-center bg-black/40 border border-white/5 p-2 rounded">
            <span className="text-[10px] uppercase text-white/50">Disk Read</span>
            <span className="text-xs font-mono text-cyan-400">{(io?.read_bytes_sec || 0) / 1024 / 1024 > 1 ? ((io?.read_bytes_sec || 0) / 1024 / 1024).toFixed(1) + ' MB/s' : ((io?.read_bytes_sec || 0) / 1024).toFixed(0) + ' KB/s'}</span>
         </div>
         <div className="flex justify-between items-center bg-black/40 border border-white/5 p-2 rounded">
            <span className="text-[10px] uppercase text-white/50">Disk Write</span>
            <span className="text-xs font-mono text-orange-400">{(io?.write_bytes_sec || 0) / 1024 / 1024 > 1 ? ((io?.write_bytes_sec || 0) / 1024 / 1024).toFixed(1) + ' MB/s' : ((io?.write_bytes_sec || 0) / 1024).toFixed(0) + ' KB/s'}</span>
         </div>

         {/* Buffer Cache Visualization */}
         <div className="mt-2">
            <div className="text-[9px] uppercase text-white/40 mb-1">Buffer Cache Flush Queue</div>
            <div className="h-6 w-full flex border border-white/10 rounded overflow-hidden">
               {Array.from({ length: 20 }).map((_, i) => (
                  <motion.div 
                    key={i} 
                    className="flex-1 border-r border-white/5"
                    style={{ background: Math.random() > 0.7 ? "rgba(100,116,139,0.5)" : "transparent" }}
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1 + Math.random(), repeat: Infinity }}
                  />
               ))}
            </div>
         </div>
      </div>
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-slate-500 border-none" />
    </div>
  );
}
