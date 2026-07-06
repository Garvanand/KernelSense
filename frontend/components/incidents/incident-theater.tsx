"use client";

import React, { useEffect, useState } from "react";
import { useAccessLevel } from "@/lib/store/access-level";
import { useTelemetryStore } from "@/lib/store/telemetry-store";
import { motion, AnimatePresence } from "framer-motion";
import { DEMO_INCIDENTS } from "@/lib/demo-data";

export function IncidentTheater() {
  const { level, demoMode } = useAccessLevel();
  const rawIncidents = useTelemetryStore((s) => s.incidents);
  const incidents = demoMode ? DEMO_INCIDENTS : (rawIncidents || []);
  
  const [selectedIncident, setSelectedIncident] = useState<any>(null);

  // Auto-select most critical
  useEffect(() => {
    if (incidents.length > 0 && !selectedIncident) {
      const sorted = [...incidents].sort((a, b) => b.severity_score - a.severity_score);
      setSelectedIncident(sorted[0]);
    }
  }, [incidents, selectedIncident]);

  return (
    <div className="w-full h-full relative p-12 flex items-center justify-center">
      {/* Background ambient light based on incident severity */}
      <AnimatePresence>
        {selectedIncident && (
          <motion.div
            key={`ambient-${selectedIncident.id}`}
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          >
            <div className={`absolute top-1/4 left-1/4 w-[40rem] h-[40rem] rounded-full mix-blend-screen filter blur-[100px] opacity-20 ${
              selectedIncident.severity_score > 0.9 ? 'bg-critical' : 'bg-warning'
            }`} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-5xl z-10 grid grid-cols-12 gap-8">
        
        {/* Left Col: Incident List */}
        <div className="col-span-4 space-y-4 max-h-[80vh] overflow-y-auto pr-4">
          <h2 className="text-xl font-bold tracking-tight text-white mb-6">Active Anomalies</h2>
          
          {incidents.length === 0 ? (
            <div className="text-normal/60 font-mono text-sm p-4 border border-normal/20 bg-normal/5 rounded-xl">
              [SYSTEM_HEALTHY] No active anomalies detected.
            </div>
          ) : (
            incidents.map((incident) => {
              const isActive = selectedIncident?.id === incident.id;
              const isCritical = incident.severity_score > 0.9;
              return (
                <button
                  key={incident.id}
                  onClick={() => setSelectedIncident(incident)}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-300 relative overflow-hidden group ${
                    isActive 
                      ? isCritical ? 'bg-critical/10 border-critical/50' : 'bg-warning/10 border-warning/50' 
                      : 'glass-subtle hover:bg-white/5'
                  }`}
                >
                  {isActive && (
                    <motion.div layoutId="incident-selector" className={`absolute inset-0 opacity-10 ${isCritical ? 'bg-critical' : 'bg-warning'}`} />
                  )}
                  <div className="flex justify-between items-start mb-2 relative z-10">
                    <div className="text-sm font-bold text-white uppercase">
                      {incident.incident_type.replace('_', ' ')}
                    </div>
                    <div className={`text-xs font-mono px-2 py-0.5 rounded ${isCritical ? 'bg-critical text-white' : 'bg-warning/20 text-warning'}`}>
                      {incident.severity_score.toFixed(2)}
                    </div>
                  </div>
                  <div className="text-xs text-white/50 font-mono relative z-10">
                    {incident.entity_type}: {incident.entity_id}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Right Col: Deep Investigation */}
        <div className="col-span-8">
          <AnimatePresence mode="wait">
            {selectedIncident ? (
              <motion.div
                key={selectedIncident.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="glass p-8 rounded-2xl h-full border-t-0"
                style={{ 
                  borderTop: `4px solid ${selectedIncident.severity_score > 0.9 ? 'var(--severity-critical)' : 'var(--severity-warning)'}` 
                }}
              >
                <div className="text-xs font-mono text-white/40 mb-8 uppercase tracking-widest flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-3 animate-pulse ${selectedIncident.severity_score > 0.9 ? 'bg-critical' : 'bg-warning'}`} />
                  System Investigation
                </div>

                <div className="space-y-8">
                  {/* Entity Context */}
                  <div>
                    <h3 className="text-sm font-semibold text-white/60 mb-2">Target Entity</h3>
                    <div className="font-mono text-lg text-white">
                      {selectedIncident.entity_type} <span className="text-white/30 ml-2">[{selectedIncident.entity_id}]</span>
                    </div>
                  </div>

                  {/* AI Diagnostic */}
                  <div>
                    <h3 className="text-sm font-semibold text-ai mb-2 flex items-center">
                      <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                      Bounded LLM Diagnostic
                    </h3>
                    
                    {level === "guest" ? (
                      <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-white/40 italic text-sm">
                        Diagnostic locked. Requires Power or Research clearance.
                      </div>
                    ) : selectedIncident.explanation ? (
                      <div className="p-5 rounded-xl bg-ai/5 border border-ai/20 text-white/90 text-sm leading-relaxed">
                        {selectedIncident.explanation.diagnostic}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-white/40 text-sm">
                        Generating diagnostic...
                      </div>
                    )}
                  </div>

                  {/* Remediation */}
                  {level !== "guest" && selectedIncident.explanation && (
                    <div>
                      <h3 className="text-sm font-semibold text-white/60 mb-2">Recommended Action</h3>
                      <div className="p-4 rounded-xl border border-white/10 bg-black/40 text-white font-mono text-xs">
                        {selectedIncident.explanation.recommended_action}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex items-center justify-center text-white/20 font-mono text-sm">
                Select an anomaly to investigate
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
