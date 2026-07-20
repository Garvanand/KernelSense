"use client";

import React, { useMemo } from "react";
import { Handle, Position } from "@xyflow/react";
import { useTelemetryStore } from "@/lib/store/telemetry-store";
import { motion } from "framer-motion";

export function StorageNode() {
  const io = useTelemetryStore((s) => s.io);

  // Derive buffer cache fill from write throughput — high writes = more dirty cache pages
  // Normalize: 100 MB/s = fully filled
  const writeBytesPerSec = io?.write_bytes_sec ?? 0;
  const readBytesPerSec = io?.read_bytes_sec ?? 0;
  const fillRatio = Math.min(1, writeBytesPerSec / (100 * 1024 * 1024));

  // Stable animation durations — computed once per mount
  const animDurations = useMemo(
    () => Array.from({ length: 20 }).map(() => 1 + Math.random() * 0.8),
    []
  );

  return (
    <div className="bg-[#080a10]/90 backdrop-blur-md border border-slate-500/30 rounded-xl p-5 w-[300px] shadow-[0_0_30px_rgba(100,116,139,0.15)]">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-slate-500 border-none" />
      
      <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">VFS & Block I/O</h2>
      </div>

      <div className="space-y-4">
         <div className="flex justify-between items-center bg-black/40 border border-white/5 p-2 rounded">
            <span className="text-[10px] uppercase text-white/50">Disk Read</span>
            <span className="text-xs font-mono text-cyan-400">{readBytesPerSec / 1024 / 1024 > 1 ? (readBytesPerSec / 1024 / 1024).toFixed(1) + ' MB/s' : (readBytesPerSec / 1024).toFixed(0) + ' KB/s'}</span>
         </div>
         <div className="flex justify-between items-center bg-black/40 border border-white/5 p-2 rounded">
            <span className="text-[10px] uppercase text-white/50">Disk Write</span>
            <span className="text-xs font-mono text-orange-400">{writeBytesPerSec / 1024 / 1024 > 1 ? (writeBytesPerSec / 1024 / 1024).toFixed(1) + ' MB/s' : (writeBytesPerSec / 1024).toFixed(0) + ' KB/s'}</span>
         </div>

         {/* Buffer Cache Visualization — fill derived from write throughput */}
         <div className="mt-2">
            <div className="text-[9px] uppercase text-white/40 mb-1">Buffer Cache Flush Queue</div>
            <div className="h-6 w-full flex border border-white/10 rounded overflow-hidden">
               {animDurations.map((dur, i) => {
                 // Each slot is "dirty" (filled) if it falls within the fill ratio
                 const isDirty = (i / 20) < fillRatio + 0.05;
                 return (
                   <motion.div 
                     key={i} 
                     className="flex-1 border-r border-white/5"
                     style={{ background: isDirty ? "rgba(100,116,139,0.5)" : "transparent" }}
                     animate={{ opacity: isDirty ? [0.5, 1, 0.5] : 0.2 }}
                     transition={{ duration: dur, repeat: Infinity }}
                   />
                 );
               })}
            </div>
         </div>
      </div>
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-slate-500 border-none" />
    </div>
  );
}
