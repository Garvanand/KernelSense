"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useTelemetryStore } from "@/lib/store/telemetry-store";
import { Play, Pause, SkipBack, Clock } from "lucide-react";

export function TimelineDVR() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [timelinePosition, setTimelinePosition] = useState(100); // 100 = LIVE
  const history = useTelemetryStore((s) => s.history);
  
  const handleDrag = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setTimelinePosition(val);
    if (val < 100) {
      setIsPlaying(false);
      // In a real implementation, we would update the store to "paused" state 
      // and feed it the historical frame at (val / 100) * history.length
    } else {
      setIsPlaying(true);
    }
  };

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 w-[800px] pointer-events-auto">
      <div className="bg-[#080a10]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl flex flex-col gap-3">
        
        {/* Controls Header */}
        <div className="flex justify-between items-center px-2">
          <div className="flex items-center gap-3">
             <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-colors border border-white/10"
             >
                {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-1" />}
             </button>
             <button className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors border border-white/10">
                <SkipBack size={14} />
             </button>
             <div className="h-4 w-px bg-white/10 mx-1" />
             <div className="flex items-center gap-2 text-[11px] font-mono text-white/50">
               <Clock size={12} />
               <span>T-MINUS 00:00:00</span>
             </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              {isPlaying && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isPlaying ? 'bg-cyan-500' : 'bg-white/30'}`}></span>
            </span>
            <span className="text-[10px] font-bold tracking-widest" style={{ color: isPlaying ? 'var(--color-primary)' : 'rgba(255,255,255,0.3)' }}>
              {isPlaying ? 'LIVE TELEMETRY' : 'HISTORICAL REPLAY'}
            </span>
          </div>
        </div>

        {/* Scrubber Bar */}
        <div className="relative h-6 flex items-center group cursor-pointer px-2">
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={timelinePosition}
            onChange={handleDrag}
            className="w-full absolute z-10 opacity-0 cursor-pointer h-full"
          />
          
          {/* Base Track */}
          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden relative">
             {/* Progress Fill */}
             <div 
               className="absolute top-0 left-0 bottom-0 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full transition-all duration-75"
               style={{ width: `${timelinePosition}%` }}
             />
             
             {/* Density Graph Overlay (Mocked historical events) */}
             <div className="absolute inset-0 flex items-end opacity-40">
                {Array.from({ length: 50 }).map((_, i) => (
                   <div 
                     key={i} 
                     className="flex-1 bg-white/20 mx-[1px]" 
                     style={{ height: `${20 + Math.random() * 80}%` }}
                   />
                ))}
             </div>
          </div>
          
          {/* Playhead thumb */}
          <motion.div 
             className="absolute h-4 w-4 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)] pointer-events-none z-20 flex items-center justify-center"
             style={{ left: `calc(${timelinePosition}% - 8px)` }}
             layout
          >
             <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
          </motion.div>
        </div>

      </div>
    </div>
  );
}
