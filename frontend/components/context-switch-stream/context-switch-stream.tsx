"use client"

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shuffle } from 'lucide-react';

export function ContextSwitchStream({ rate }: { rate: number }) {
  // Rather than rendering thousands of DOM elements per second (which crashes the browser),
  // we aggregate the rate and render visual "blocks" or "pulses" representing volume.
  
  // A visual scale: 1 block = 100 context switches.
  // We cap the maximum blocks rendered to avoid DOM bloat (e.g. max 50 blocks per cycle).
  const blockCount = Math.min(Math.ceil(rate / 100), 50);
  
  const [blocks, setBlocks] = useState<number[]>([]);

  useEffect(() => {
    // Generate new unique keys for the blocks to trigger layout animations
    const newBlocks = Array.from({ length: blockCount }, (_, i) => Date.now() + i);
    setBlocks(newBlocks);
  }, [rate, blockCount]);

  return (
    <div className="glass-panel p-6 rounded-2xl flex flex-col h-full overflow-hidden relative">
      <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-4 z-10 relative">
        <h2 className="text-lg font-bold text-white flex items-center">
          <Shuffle className="w-5 h-5 mr-2 text-ring2" />
          Context Switches
        </h2>
        <div className="text-right">
          <div className="text-2xl font-mono text-white font-bold">{rate.toLocaleString()}</div>
          <div className="text-xs text-slate-400">switches / sec</div>
        </div>
      </div>

      <div className="flex-1 relative">
        <p className="text-xs text-slate-400 mb-4 z-10 relative">
          Rendering intelligently aggregated visual stream to maintain frame rates. 1 block ≈ 100 switches.
        </p>
        
        <div className="flex flex-wrap gap-1 content-start w-full h-[120px] overflow-hidden">
          <AnimatePresence>
            {blocks.map((id) => (
              <motion.div
                key={id}
                initial={{ opacity: 0, scale: 0, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5, y: 20 }}
                transition={{ duration: 0.4, type: 'spring' }}
                className="w-3 h-3 bg-ring2/60 rounded-sm border border-ring2/80 shadow-[0_0_8px_var(--ring-2-glow)]"
              />
            ))}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Visual fade out at the bottom to make the stream look like it's cascading */}
      <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
    </div>
  );
}
