"use client"

import React from 'react';
import { Cpu } from 'lucide-react';
import { motion } from 'framer-motion';

export interface CoreUtilization {
  core_id: number;
  utilization_percent: number;
}

export function CoreHeatmap({ cores }: { cores: CoreUtilization[] }) {
  return (
    <div className="glass-panel p-6 rounded-2xl">
      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
        <h2 className="text-lg font-bold text-white flex items-center">
          <Cpu className="w-5 h-5 mr-2 text-ring1" />
          Per-Core Utilization Heatmap
        </h2>
        <div className="text-xs text-slate-400 font-mono">16 Logical Cores</div>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-8 gap-4">
        {cores.map((core) => {
          // Map utilization to visual intensity
          let bgClass = 'bg-white/5 border-white/10';
          let glowClass = '';

          if (core.utilization_percent > 85) {
            bgClass = 'bg-ring0/80 border-ring0 text-white';
            glowClass = 'shadow-[0_0_20px_var(--ring-0-glow)]';
          } else if (core.utilization_percent > 60) {
            bgClass = 'bg-ring1/80 border-ring1 text-white';
            glowClass = 'shadow-[0_0_15px_var(--ring-1-glow)]';
          } else if (core.utilization_percent > 30) {
            bgClass = 'bg-ring2/60 border-ring2 text-white';
            glowClass = 'shadow-[0_0_10px_var(--ring-2-glow)]';
          } else if (core.utilization_percent > 5) {
            bgClass = 'bg-ring3/40 border-ring3 text-white';
            glowClass = '';
          }

          return (
            <motion.div
              key={core.core_id}
              layout
              className={`relative flex flex-col items-center justify-center p-3 rounded-xl border backdrop-blur-sm transition-colors duration-500 ${bgClass} ${glowClass}`}
            >
              <span className="text-[10px] text-slate-300 font-mono absolute top-1 left-2 opacity-50">
                CPU{core.core_id}
              </span>
              <span className="text-sm font-bold mt-2">
                {core.utilization_percent.toFixed(0)}%
              </span>
            </motion.div>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="flex justify-end space-x-4 mt-6 text-xs text-slate-400">
        <div className="flex items-center"><div className="w-2 h-2 rounded-full bg-white/10 mr-1" /> Idle</div>
        <div className="flex items-center"><div className="w-2 h-2 rounded-full bg-ring3/40 mr-1" /> Low</div>
        <div className="flex items-center"><div className="w-2 h-2 rounded-full bg-ring2/60 mr-1" /> Med</div>
        <div className="flex items-center"><div className="w-2 h-2 rounded-full bg-ring1/80 mr-1 shadow-[0_0_5px_var(--ring-1-glow)]" /> High</div>
        <div className="flex items-center"><div className="w-2 h-2 rounded-full bg-ring0/80 mr-1 shadow-[0_0_5px_var(--ring-0-glow)]" /> Pinned</div>
      </div>
    </div>
  );
}
