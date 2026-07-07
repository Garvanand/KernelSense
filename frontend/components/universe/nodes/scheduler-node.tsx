"use client";

import React, { useEffect, useState } from "react";
import { Handle, Position } from "@xyflow/react";
import { useTelemetryStore } from "@/lib/store/telemetry-store";
import { motion, AnimatePresence } from "framer-motion";

export function SchedulerNode() {
  const processes = useTelemetryStore((s) => s.processes);
  const cores = useTelemetryStore((s) => s.cores);

  // Group processes by status heuristics for visual queues
  const running = processes.filter(p => p.cpu_percent > 1);
  const ready = processes.filter(p => p.cpu_percent <= 1 && p.cpu_percent > 0);
  const blocked = processes.filter(p => p.cpu_percent === 0);

  return (
    <div className="bg-[#080a10]/90 backdrop-blur-md border border-cyan-500/30 rounded-xl p-6 w-[500px] shadow-[0_0_30px_rgba(34,211,238,0.15)]">
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-cyan-500 border-none" />
      
      <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-2">
        <h2 className="text-sm font-bold text-cyan-400 uppercase tracking-widest">CPU Scheduler</h2>
        <div className="text-[10px] font-mono text-white/50">{cores.length} CORES ACTIVE</div>
      </div>

      <div className="flex gap-4">
        {/* Queues */}
        <div className="flex-1 space-y-4">
          <Queue label="Ready Queue" items={ready} color="var(--severity-normal)" maxDisplay={5} />
          <Queue label="Wait/Blocked" items={blocked} color="var(--severity-warning)" maxDisplay={5} />
        </div>

        {/* CPU Cores (Execution) */}
        <div className="flex-1 border-l border-white/10 pl-4 space-y-3">
          <div className="text-[10px] uppercase text-white/40 tracking-wider">Execution Pipeline</div>
          {cores.slice(0, 4).map((core, idx) => {
            const runningProc = running[idx] || null;
            return (
              <div key={core.core_id} className="bg-black/50 border border-white/5 rounded-lg p-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[9px] text-white/50">Core {core.core_id}</span>
                  <span className="text-[9px] text-cyan-400 font-mono">{core.utilization_percent.toFixed(0)}%</span>
                </div>
                <div className="h-8 rounded bg-white/5 flex items-center justify-center border border-white/5 relative overflow-hidden">
                  <AnimatePresence mode="popLayout">
                    {runningProc ? (
                      <motion.div
                        key={runningProc.pid}
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 50, opacity: 0 }}
                        className="text-[10px] font-bold text-white z-10"
                      >
                        {runningProc.name}
                      </motion.div>
                    ) : (
                      <div className="text-[9px] text-white/20">IDLE</div>
                    )}
                  </AnimatePresence>
                  
                  {/* Activity pulse */}
                  {runningProc && (
                     <motion.div 
                       className="absolute inset-0 bg-cyan-500/20"
                       animate={{ opacity: [0.1, 0.4, 0.1] }}
                       transition={{ duration: 1.5 - (core.utilization_percent / 100), repeat: Infinity }}
                     />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-indigo-500 border-none" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="w-3 h-3 bg-orange-500 border-none" />
    </div>
  );
}

function Queue({ label, items, color, maxDisplay }: { label: string; items: any[]; color: string; maxDisplay: number }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-[10px] uppercase text-white/40 tracking-wider">{label}</span>
        <span className="text-[9px] font-mono text-white/30">{items.length}</span>
      </div>
      <div className="bg-black/30 border border-white/5 rounded-lg p-2 min-h-[40px] flex flex-wrap gap-1.5">
        <AnimatePresence>
          {items.slice(0, maxDisplay).map(p => (
            <motion.div
              key={p.pid}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              layout
              className="text-[9px] font-mono px-1.5 py-0.5 rounded border"
              style={{ borderColor: color, color: color, backgroundColor: `${color}1A` }}
            >
              {p.pid}
            </motion.div>
          ))}
          {items.length > maxDisplay && (
            <div className="text-[9px] text-white/30 px-1 py-0.5">+{items.length - maxDisplay}</div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
