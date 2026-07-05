"use client"

import React from 'react';
import useSWR from 'swr';
import { apiClient } from '@/lib/api-client';
import { MemoryBlocks, MemoryComposition } from '@/components/memory-map/memory-blocks';
import { LeakChart, MemoryAnomaly } from '@/components/leak-timeline/leak-chart';
import { useAccessLevel } from '@/lib/store/access-level';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

interface MemoryResponse {
  composition: MemoryComposition;
  anomalies: MemoryAnomaly[];
}

const fetcher = (url: string) => apiClient.get<MemoryResponse>(url);

export default function MemoryPage() {
  const { level } = useAccessLevel();
  // Poll every 2 seconds
  const { data, error, isLoading } = useSWR('/memory', fetcher, { refreshInterval: 2000 });

  return (
    <div className="w-full h-screen flex flex-col bg-background relative overflow-y-auto">
      {/* Header NavBar */}
      <header className="h-14 border-b border-white/10 flex items-center justify-between px-6 bg-black/40 backdrop-blur-md z-10 sticky top-0">
        <div className="flex items-center space-x-4">
          <Link href="/" className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-semibold text-white tracking-tight">Memory Intelligence</h1>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-xs text-slate-400 font-mono">CLEARANCE</span>
          <Badge 
            variant={level === 'guest' ? 'ring3' : level === 'power' ? 'ring2' : 'research'}
            className="uppercase shadow-none"
          >
            {level}
          </Badge>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-6 lg:p-12 max-w-7xl mx-auto w-full space-y-8 animate-fade-in">
        
        {error && (
          <div className="p-4 bg-ring0/10 border border-ring0/20 rounded-xl text-ring0">
            Failed to load memory telemetry. Ensure the KernelSense backend is running.
          </div>
        )}

        {isLoading && !data && (
          <div className="text-slate-400 animate-pulse">Establishing connection to memory subsystem...</div>
        )}

        {data && (
          <>
            <MemoryBlocks data={data.composition} />

            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white mb-4">Active Leak Anomalies</h3>
              
              {data.anomalies.length === 0 ? (
                <div className="glass-panel p-8 rounded-2xl flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-ring3/20 flex items-center justify-center border border-ring3/30 shadow-[0_0_15px_var(--ring-3-glow)]">
                    <CheckCircle2 className="w-6 h-6 text-ring3" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium">Memory Stable</h4>
                    <p className="text-sm text-slate-400">No anomalous heap growth curves detected in the current snapshot.</p>
                  </div>
                </div>
              ) : (
                <div className="grid gap-6 lg:grid-cols-2">
                  {data.anomalies.map((anomaly) => (
                    <LeakChart key={anomaly.pid} anomaly={anomaly} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
