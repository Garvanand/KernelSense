"use client"

import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { apiClient } from '@/lib/api-client';
import { useAccessLevel } from '@/lib/store/access-level';
import { Terminal, Lock } from 'lucide-react';

interface RawEvent {
  id: number;
  timestamp: number;
  event_type: string;
  value: number;
}

const fetcher = (url: string) => apiClient.get<RawEvent[]>(url);

export function RawEventsStream() {
  const { level } = useAccessLevel();
  const isAuthorized = level === 'kernel' || level === 'research';
  
  // Only poll if authorized to avoid spamming 403s
  const { data, error } = useSWR(isAuthorized ? '/scheduler/events' : null, fetcher, { 
    refreshInterval: 1000 
  });

  if (!isAuthorized) {
    return (
      <div className="glass-panel p-6 rounded-2xl h-64 flex flex-col items-center justify-center text-center">
        <Lock className="w-8 h-8 text-slate-500 mb-3" />
        <h3 className="text-white font-semibold mb-1">Telemetry Locked</h3>
        <p className="text-sm text-slate-400 max-w-md">
          Raw eBPF scheduler event tracing requires <strong className="text-ring0">Kernel</strong> or <strong className="text-research">Research</strong> clearance level to prevent side-channel leakage.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-panel p-6 rounded-2xl flex flex-col h-96">
      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
        <h2 className="text-lg font-bold text-white flex items-center">
          <Terminal className="w-5 h-5 mr-2 text-ring0" />
          Raw Scheduler Telemetry
        </h2>
        <div className="text-xs text-ring0 font-mono flex items-center">
          <div className="w-2 h-2 rounded-full bg-ring0 shadow-[0_0_8px_var(--ring-0-glow)] mr-2 animate-pulse" />
          LIVE TRACE
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto bg-black/40 rounded-lg border border-white/5 p-4 font-mono text-xs">
        {error ? (
          <div className="text-ring0">Error fetching raw telemetry stream.</div>
        ) : !data ? (
          <div className="text-slate-500">Connecting to eBPF hooks...</div>
        ) : (
          <div className="space-y-1">
            {data.map((ev) => (
              <div key={`${ev.id}-${ev.timestamp}`} className="flex items-center space-x-4 text-slate-300 hover:bg-white/5 p-1 rounded transition-colors">
                <span className="text-slate-500 w-24">{(ev.timestamp % 1000).toFixed(4)}</span>
                <span className={
                  ev.event_type === 'context_switch' ? 'text-ring2 w-32' : 
                  ev.event_type === 'migration' ? 'text-ring1 w-32' : 'text-slate-300 w-32'
                }>
                  [{ev.event_type.toUpperCase()}]
                </span>
                <span className="text-white flex-1">VAL: {ev.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
