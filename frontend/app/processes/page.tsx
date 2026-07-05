"use client"

import React, { useState } from 'react';
import dynamic from 'next/dynamic';

const ProcessTree = dynamic(() => import('@/components/process-tree/process-tree').then(mod => mod.ProcessTree), { ssr: false });
const ProcessDetail = dynamic(() => import('@/components/process-detail/process-detail').then(mod => mod.ProcessDetail), { ssr: false });

import { ProcessNodeData } from '@/components/process-tree/process-node';
import { useAccessLevel } from '@/lib/store/access-level';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ProcessesPage() {
  const [selectedProcess, setSelectedProcess] = useState<ProcessNodeData | null>(null);
  const { level } = useAccessLevel();

  return (
    <div className="w-full h-screen flex flex-col bg-background relative overflow-hidden">
      {/* Header NavBar */}
      <header className="h-14 border-b border-white/10 flex items-center justify-between px-6 bg-black/40 backdrop-blur-md z-10">
        <div className="flex items-center space-x-4">
          <Link href="/" className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-semibold text-white tracking-tight">Process Genealogy</h1>
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
      <main className="flex-1 relative">
        <ProcessTree onNodeClick={setSelectedProcess} />
        
        {selectedProcess && (
          <ProcessDetail 
            process={selectedProcess} 
            onClose={() => setSelectedProcess(null)} 
          />
        )}
      </main>
    </div>
  );
}
