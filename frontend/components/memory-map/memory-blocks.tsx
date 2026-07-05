"use client"

import React from 'react';
import { motion } from 'framer-motion';

export interface MemoryComposition {
  total_bytes: number;
  used_bytes: number;
  free_bytes: number;
  percent: number;
}

export function MemoryBlocks({ data }: { data: MemoryComposition }) {
  // We represent the 16GB RAM as a grid of 16 blocks (1GB each)
  const totalBlocks = 16;
  const usedBlocksCount = Math.ceil((data.percent / 100) * totalBlocks);

  return (
    <div className="glass-panel p-6 rounded-2xl flex flex-col space-y-6">
      <div className="flex justify-between items-end border-b border-white/10 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white">System Memory Pressure</h2>
          <p className="text-sm text-slate-400">Total physical memory mapped to 1GB sector blocks.</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-mono text-white font-bold">{data.percent.toFixed(1)}%</div>
          <div className="text-xs text-slate-400">
            {(data.used_bytes / 1024 / 1024 / 1024).toFixed(1)} GB / {(data.total_bytes / 1024 / 1024 / 1024).toFixed(1)} GB
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
        {Array.from({ length: totalBlocks }).map((_, i) => {
          const isUsed = i < usedBlocksCount;
          // As pressure increases (used > 12 blocks / 75%), we shift color to critical Ring0 Red
          const isCritical = data.percent > 75;
          const isWarning = data.percent > 50;

          let colorClass = 'bg-white/5 border-white/10'; // Free
          let glowClass = '';

          if (isUsed) {
            if (isCritical) {
              colorClass = 'bg-ring0 border-ring0 text-white';
              glowClass = 'shadow-[0_0_15px_var(--ring-0-glow)]';
            } else if (isWarning) {
              colorClass = 'bg-ring1 border-ring1 text-white';
              glowClass = 'shadow-[0_0_15px_var(--ring-1-glow)]';
            } else {
              colorClass = 'bg-ring3 border-ring3 text-white';
              glowClass = 'shadow-[0_0_10px_var(--ring-3-glow)]';
            }
          }

          return (
            <motion.div
              key={i}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                backgroundColor: isUsed ? (isCritical ? 'var(--ring-0)' : isWarning ? 'var(--ring-1)' : 'var(--ring-3)') : 'rgba(255,255,255,0.05)',
              }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 20,
                delay: i * 0.02
              }}
              className={`h-12 rounded-md border backdrop-blur-sm ${glowClass}`}
            />
          );
        })}
      </div>
    </div>
  );
}
