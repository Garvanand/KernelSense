"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTelemetryStore } from "@/lib/store/telemetry-store";
import { Play, Pause, SkipBack, Clock, RefreshCw } from "lucide-react";

export function TimelineDVR() {
  const dvrBuffer = useTelemetryStore((s) => s.dvrBuffer);
  const activeFrameIndex = useTelemetryStore((s) => s.activeFrameIndex);
  const fetchDVRBuffer = useTelemetryStore((s) => s.fetchDVRBuffer);
  const setActiveFrame = useTelemetryStore((s) => s.setActiveFrame);
  
  const [isPlaying, setIsPlaying] = useState(true);
  const [timelinePosition, setTimelinePosition] = useState(100); 

  useEffect(() => {
    fetchDVRBuffer();
  }, []);

  // Sync internal slider state with the store
  useEffect(() => {
     if (dvrBuffer.length === 0) return;
     
     if (activeFrameIndex === null) {
        setIsPlaying(true);
        setTimelinePosition(100);
     } else {
        setIsPlaying(false);
        setTimelinePosition((activeFrameIndex / (dvrBuffer.length - 1)) * 100);
     }
  }, [activeFrameIndex, dvrBuffer.length]);

  const handleDrag = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setTimelinePosition(val);
    
    if (dvrBuffer.length === 0) return;
    
    if (val === 100) {
      setIsPlaying(true);
      setActiveFrame(null);
    } else {
      setIsPlaying(false);
      // Map 0-100% to buffer index
      const targetIndex = Math.floor((val / 100) * (dvrBuffer.length - 1));
      setActiveFrame(targetIndex);
    }
  };
  
  const handleResume = () => {
     setActiveFrame(null);
     setIsPlaying(true);
  }

  // Format time display
  let timeDisplay = "T-MINUS 00:00:00";
  if (activeFrameIndex !== null && dvrBuffer.length > 0 && dvrBuffer[activeFrameIndex]) {
     const frame = dvrBuffer[activeFrameIndex];
     const date = new Date(frame.timestamp * 1000);
     timeDisplay = date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second:'2-digit', fractionalSecondDigits: 2 });
  }

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 w-[800px] pointer-events-auto">
      <div className="bg-[#080a10]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl flex flex-col gap-3">
        
        {/* Controls Header */}
        <div className="flex justify-between items-center px-2">
          <div className="flex items-center gap-3">
             <button 
                onClick={handleResume}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-colors border border-white/10"
             >
                {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-1" />}
             </button>
             <button 
                onClick={fetchDVRBuffer}
                title="Fetch Latest History from DB"
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors border border-white/10"
             >
                <RefreshCw size={14} />
             </button>
             <div className="h-4 w-px bg-white/10 mx-1" />
             <div className="flex items-center gap-2 text-[11px] font-mono text-white/50">
               <Clock size={12} />
               <span>{isPlaying ? 'LIVE' : timeDisplay}</span>
             </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              {isPlaying && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isPlaying ? 'bg-cyan-500' : 'bg-red-500'}`}></span>
            </span>
            <span className="text-[10px] font-bold tracking-widest" style={{ color: isPlaying ? 'var(--color-primary)' : '#ef4444' }}>
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
               className="absolute top-0 left-0 bottom-0 rounded-full transition-all duration-75"
               style={{ 
                  width: `${timelinePosition}%`,
                  background: isPlaying ? 'linear-gradient(to right, #6366f1, #06b6d4)' : '#ef4444'
               }}
             />
             
             {/* Density Graph Overlay */}
             <div className="absolute inset-0 flex items-end opacity-40">
                {Array.from({ length: 100 }).map((_, i) => {
                   // Map i to index in dvrBuffer
                   let h = 20;
                   if (dvrBuffer.length > 0) {
                      const idx = Math.floor((i / 100) * (dvrBuffer.length - 1));
                      const frame = dvrBuffer[idx];
                      if (frame && frame.system_metrics) {
                          h = Math.max(10, (frame.system_metrics.cpu_user_percent + frame.system_metrics.cpu_system_percent));
                      }
                   }
                   return (
                     <div 
                       key={i} 
                       className="flex-1 bg-white/20 mx-[1px]" 
                       style={{ height: `${h}%` }}
                     />
                   )
                })}
             </div>
          </div>
          
          {/* Playhead thumb */}
          <motion.div 
             className="absolute h-4 w-4 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)] pointer-events-none z-20 flex items-center justify-center"
             style={{ left: `calc(${timelinePosition}% - 8px)` }}
             layout
          >
             <div className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-cyan-500' : 'bg-red-500'}`} />
          </motion.div>
        </div>

      </div>
    </div>
  );
}
