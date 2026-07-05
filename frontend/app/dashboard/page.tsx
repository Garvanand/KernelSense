"use client"

import React from 'react';
import useSWR from 'swr';
import { apiClient } from '@/lib/api-client';
import { useAccessLevel } from '@/lib/store/access-level';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Activity } from 'lucide-react';
import Link from 'next/link';

import { IncidentFeed, Incident } from '@/components/dashboard/incident-feed';

const fetcher = (url: string) => apiClient.get<Incident[]>(url);

export default function DashboardPage() {
  const { level } = useAccessLevel();
  // Poll every 3 seconds for incident engine evaluation
  const { data: incidents, error, isLoading } = useSWR('/incidents', fetcher, { refreshInterval: 3000 });

  return (
    <div className="w-full h-screen flex flex-col bg-background relative overflow-y-auto">
      {/* Header NavBar */}
      <header className="h-14 border-b border-white/10 flex items-center justify-between px-6 bg-black/40 backdrop-blur-md z-10 sticky top-0">
        <div className="flex items-center space-x-4">
          <Link href="/" className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-semibold text-white tracking-tight flex items-center">
            <Activity className="w-5 h-5 mr-2 text-ring1" />
            System Health Dashboard
          </h1>
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
      <main className="flex-1 p-6 lg:p-12 max-w-4xl mx-auto w-full space-y-8 animate-fade-in">
        
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Incident Engine</h2>
          <p className="text-slate-400">
            Real-time aggregation of forecasting, memory, and scheduler anomalies. Verified incidents trigger bounded LLM root-cause analysis based on your clearance level.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-ring0/10 border border-ring0/20 rounded-xl text-ring0">
            Failed to fetch incidents. Ensure the Incident Engine background worker is running.
          </div>
        )}

        {isLoading && !incidents && (
          <div className="text-slate-400 animate-pulse">Querying AI Engine...</div>
        )}

        {incidents && (
          <IncidentFeed incidents={incidents} />
        )}
      </main>
    </div>
  );
}
