"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTelemetryStore } from "@/lib/store/telemetry-store";
import { Bot, X, Sparkles, AlertTriangle } from "lucide-react";

export function AITutor() {
  const [isOpen, setIsOpen] = useState(false);
  const incidents = useTelemetryStore((s) => s.incidents);
  
  // Use the most recent incident as a teachable moment
  const activeIncident = incidents[0];

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        className="absolute top-6 right-6 z-50 w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.5)] border border-white/20 hover:scale-105 transition-transform"
        onClick={() => setIsOpen(true)}
        whileHover={{ rotate: 15 }}
      >
        <Bot size={24} className="text-white" />
        {activeIncident && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-black animate-ping" />
        )}
      </motion.button>

      {/* Slide-out Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute top-0 right-0 bottom-0 w-[400px] bg-[#080a10]/95 backdrop-blur-2xl border-l border-white/10 z-50 flex flex-col pointer-events-auto"
          >
            {/* Header */}
            <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 text-indigo-400">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">AI Professor</h3>
                  <p className="text-[10px] text-white/50 font-mono">KERNEL ANALYSIS ENGINE</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-white/50 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
              
              {/* Contextual Lesson based on active incident */}
              {activeIncident ? (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-red-400 mb-2">
                     <AlertTriangle size={14} />
                     <span className="text-[10px] font-bold uppercase tracking-wider">Teachable Moment: {activeIncident.incident_type}</span>
                  </div>
                  <h4 className="text-sm font-bold text-white mb-2">{activeIncident.message}</h4>
                  <p className="text-xs text-white/70 leading-relaxed mb-4">
                     In an operating system, {activeIncident.incident_type.replace('_', ' ')} occurs when the system cannot satisfy resource requests efficiently. 
                     Right now, I am observing <span className="text-cyan-400 font-mono">{activeIncident.pid || 'the system'}</span> struggling with this.
                  </p>
                  <div className="text-[10px] bg-black/50 p-2 rounded border border-white/5 font-mono text-white/50">
                     SUGGESTION: Analyze the Resource Allocation Graph in the Deadlock Node.
                  </div>
                </div>
              ) : (
                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4">
                   <h4 className="text-sm font-bold text-indigo-300 mb-2">System Operating Normally</h4>
                   <p className="text-xs text-white/70 leading-relaxed">
                      The scheduler is successfully multiplexing processes across the cores without starvation. Virtual memory fragmentation is low. 
                      Click on any node in the OS Universe to ask me a question about how it works under the hood.
                   </p>
                </div>
              )}

              {/* Chat Input Placeholder */}
              <div className="mt-auto">
                 <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Ask the Professor a question..." 
                      className="w-full bg-black/50 border border-white/10 rounded-lg pl-4 pr-10 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                    <button className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-indigo-400">
                       <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </button>
                 </div>
                 <div className="flex gap-2 mt-3 flex-wrap">
                    <span className="text-[9px] px-2 py-1 bg-white/5 border border-white/10 rounded-full text-white/50 hover:bg-white/10 cursor-pointer">Explain Context Switching</span>
                    <span className="text-[9px] px-2 py-1 bg-white/5 border border-white/10 rounded-full text-white/50 hover:bg-white/10 cursor-pointer">What is a Page Fault?</span>
                 </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
