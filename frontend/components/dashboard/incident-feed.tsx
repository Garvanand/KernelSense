"use client"

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Terminal, Cpu, HardDrive } from 'lucide-react';
import { Badge } from '../ui/badge';
import { useAccessLevel } from '@/lib/store/access-level';
import { cn } from '@/lib/utils';

export interface IncidentExplanation {
  diagnostic: string;
  recommended_action: string;
}

export interface Incident {
  id: number;
  timestamp: number;
  entity_type: string;
  entity_id: string;
  incident_type: string;
  severity_score: number;
  explanation: IncidentExplanation | null;
}

export function IncidentFeed({ incidents }: { incidents: Incident[] }) {
  const { level } = useAccessLevel();
  
  if (incidents.length === 0) {
    return (
      <div className="glass-panel p-12 rounded-2xl flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-ring3/20 flex items-center justify-center border border-ring3/30 shadow-[0_0_20px_var(--ring-3-glow)] mb-4">
          <ShieldAlert className="w-8 h-8 text-ring3" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">System Healthy</h3>
        <p className="text-slate-400">No active incidents detected across process, memory, or scheduler subsystems.</p>
      </div>
    );
  }

  return (
    <motion.div 
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: { staggerChildren: 0.15 }
        }
      }}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <AnimatePresence>
        {incidents.map((incident) => {
          const isCritical = incident.severity_score > 0.9;
          const borderClass = isCritical ? 'border-ring0/50' : 'border-ring1/50';
          const bgClass = isCritical ? 'bg-ring0/10' : 'bg-ring1/10';
          const iconColor = isCritical ? 'text-ring0' : 'text-ring1';
          const shadowClass = isCritical ? 'shadow-[0_0_15px_var(--ring-0-glow)]' : 'shadow-[0_0_10px_var(--ring-1-glow)]';

          return (
            <motion.div
              key={incident.id}
              layout
              variants={{
                hidden: { opacity: 0, y: 30, scale: 0.95 },
                show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", bounce: 0.3 } }
              }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
              className={`glass-panel p-8 rounded-3xl border ${borderClass} ${bgClass} ${shadowClass} relative overflow-hidden group hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-shadow duration-500`}
            >
              {/* Subtle accent light */}
              <div className={cn("absolute top-0 right-0 w-64 h-64 bg-current opacity-[0.03] rounded-full blur-[50px] pointer-events-none group-hover:opacity-[0.06] transition-opacity duration-500", iconColor)} />

              <div className="flex justify-between items-start mb-6 border-b border-white/5 pb-6 relative z-10">
                <div className="flex items-center space-x-3">
                  {incident.incident_type === 'leak_anomaly' ? (
                    <HardDrive className={`w-6 h-6 ${iconColor}`} />
                  ) : incident.incident_type === 'forecasting' ? (
                    <Cpu className={`w-6 h-6 ${iconColor}`} />
                  ) : (
                    <Terminal className={`w-6 h-6 ${iconColor}`} />
                  )}
                  <div>
                    <h3 className="text-lg font-bold text-white capitalize">
                      {incident.incident_type.replace('_', ' ')}
                    </h3>
                    <div className="text-xs text-slate-400 font-mono">
                      Target: {incident.entity_type} [{incident.entity_id}]
                    </div>
                  </div>
                </div>
                <Badge variant={isCritical ? 'ring0' : 'ring1'}>
                  Score: {incident.severity_score.toFixed(2)}
                </Badge>
              </div>

              {incident.explanation ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-300 mb-1 flex items-center">
                      <Terminal className="w-4 h-4 mr-2" />
                      LLM Diagnostic
                    </h4>
                    <p className="text-sm text-slate-200 leading-relaxed bg-black/40 p-3 rounded-lg border border-white/5">
                      {incident.explanation.diagnostic}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-300 mb-1 flex items-center">
                      <ShieldAlert className="w-4 h-4 mr-2" />
                      Recommended Action
                    </h4>
                    <p className="text-sm text-white leading-relaxed bg-ring2/20 p-3 rounded-lg border border-ring2/30">
                      {incident.explanation.recommended_action}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-400 italic bg-black/40 p-3 rounded-lg border border-white/5 text-center">
                  Automated LLM root-cause analysis is restricted. Elevate to <strong className="text-white">Power</strong>, <strong className="text-white">Kernel</strong>, or <strong className="text-white">Research</strong> clearance to view diagnostics.
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
}
