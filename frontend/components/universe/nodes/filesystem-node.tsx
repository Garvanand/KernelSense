"use client";

import React from "react";
import { Handle, Position } from "@xyflow/react";
import { useTelemetryStore } from "@/lib/store/telemetry-store";
import { motion } from "framer-motion";

export function FileSystemNode() {
  const io = useTelemetryStore((s) => s.io);

  return (
    <div className="bg-[#080a10]/90 backdrop-blur-md border border-sky-500/30 rounded-xl p-5 w-[320px] shadow-[0_0_30px_rgba(14,165,233,0.15)]">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-sky-500 border-none" />
      
      <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
        <h2 className="text-sm font-bold text-sky-400 uppercase tracking-widest">File System (VFS)</h2>
      </div>

      <div className="flex gap-4">
         {/* File Descriptor Table */}
         <div className="flex-1">
            <div className="text-[9px] uppercase text-white/40 mb-1">Global FD Table</div>
            <div className="bg-black/40 border border-white/5 rounded p-2 text-[8px] font-mono text-white/50 space-y-1">
               <div className="flex justify-between"><span>fd: 0</span><span>/dev/null</span></div>
               <div className="flex justify-between"><span>fd: 1</span><span>stdout</span></div>
               <div className="flex justify-between"><span>fd: 2</span><span>stderr</span></div>
               <div className="flex justify-between"><span>fd: 3</span><span className="text-sky-400">/var/log/...</span></div>
               <div className="flex justify-between"><span>fd: 4</span><span className="text-sky-400">socket:[912]</span></div>
            </div>
         </div>
         
         {/* Inodes */}
         <div className="flex-1">
            <div className="text-[9px] uppercase text-white/40 mb-1">Inode Cache</div>
            <div className="grid grid-cols-3 gap-1">
               {Array.from({ length: 9 }).map((_, i) => (
                  <motion.div 
                     key={i}
                     className="aspect-square bg-sky-500/10 border border-sky-500/20 rounded flex items-center justify-center text-[7px] text-sky-300"
                     animate={{ backgroundColor: Math.random() > 0.8 ? "rgba(14,165,233,0.3)" : "rgba(14,165,233,0.1)" }}
                     transition={{ duration: 0.5 + Math.random(), repeat: Infinity }}
                  >
                     {Math.floor(Math.random() * 9999)}
                  </motion.div>
               ))}
            </div>
         </div>
      </div>
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-sky-500 border-none" />
    </div>
  );
}
