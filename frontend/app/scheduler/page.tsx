"use client"

import React from 'react';
import useSWR from 'swr';
import { apiClient } from '@/lib/api-client';
import { useAccessLevel } from '@/lib/store/access-level';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import dynamic from 'next/dynamic';

const CoreHeatmap = dynamic(() => import('@/components/core-heatmap/core-heatmap').then(mod => mod.CoreHeatmap), { ssr: false });
const ContextSwitchStream = dynamic(() => import('@/components/context-switch-stream/context-switch-stream').then(mod => mod.ContextSwitchStream), { ssr: false });
const RunQueue = dynamic(() => import('@/components/run-queue/run-queue').then(mod => mod.RunQueue), { ssr: false });
const RawEventsStream = dynamic(() => import('@/components/scheduler/raw-events').then(mod => mod.RawEventsStream), { ssr: false });

// CoreUtilization is a type, so we can't dynamic import it. We'll import it normally using type import.
import type { CoreUtilization } from '@/components/core-heatmap/core-heatmap';

interface SchedulerResponse {
  timestamp: number;
  cores: CoreUtilization[];
  context_switch_rate: number;
  run_queue_latency_ms: number;
}

const fetcher = (url: string) => apiClient.get<SchedulerResponse>(url);

export default function SchedulerPage() {
  const { level } = useAccessLevel();
  // Poll every 1 second for live CPU feel
  const { data, error, isLoading } = useSWR('/scheduler', fetcher, { refreshInterval: 1000 });

  return (
    <div className="w-full h-screen flex flex-col bg-background relative overflow-y-auto">
      {/* Header NavBar */}
      <header className="h-14 border-b border-white/10 flex items-center justify-between px-6 bg-black/40 backdrop-blur-md z-10 sticky top-0">
        <div className="flex items-center space-x-4">
          <Link href="/" className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-semibold text-white tracking-tight">Scheduler & CPU Engine</h1>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-xs text-slate-400 font-mono">CLEARANCE</span>
          <Badge 
            variant={level === 'guest' ? 'ring3' : level === 'power' ? 'ring2' : level === 'kernel' ? 'ring0' : 'research'}
            className="uppercase shadow-none"
          >
            {level}
          </Badge>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-6 lg:p-12 max-w-7xl mx-auto w-full space-y-6 animate-fade-in">
        
        {error && (
          <div className="p-4 bg-ring0/10 border border-ring0/20 rounded-xl text-ring0">
            Failed to load scheduler telemetry.
          </div>
        )}

        {isLoading && !data && (
          <div className="text-slate-400 animate-pulse">Establishing connection to CPU scheduler...</div>
        )}

        {data && (
          <>
            <CoreHeatmap cores={data.cores} />

            <div className="grid lg:grid-cols-2 gap-6">
              <ContextSwitchStream rate={data.context_switch_rate} />
              <RunQueue latencyMs={data.run_queue_latency_ms} />
            </div>
            
            <RawEventsStream />
          </>
        )}
      </main>
    </div>
  );
}
