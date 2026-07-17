"use client";

import React, { useEffect, useState } from "react";
import { EnterpriseDashboard } from "@/components/ui/enterprise-dashboard";
import { ShieldCheck } from "lucide-react";

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="w-screen h-screen bg-black text-[#00ff00] p-3 flex flex-col noise">
      <div className="w-full h-full flex flex-col border border-[#00ff00]/30 bg-black/95 shadow-[0_0_40px_rgba(0,255,0,0.08)]">
        <header className="border-b border-[#00ff00]/30 px-4 py-2 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
                <ShieldCheck size={24} />
                <div>
                    <h1 className="text-2xl font-mono font-bold tracking-widest leading-none">KERNEL_SENSE</h1>
                    <p className="text-[9px] uppercase tracking-[0.3em] opacity-60 mt-0.5">Predictive OS Observatory</p>
                </div>
            </div>
            <div className="text-right text-[10px] opacity-70">
                <div>AES-256-GCM // HKDF-SHA256 DERIVED KEYS</div>
                <div>FIRST-MESSAGE AUTH // PER-TOKEN RBAC</div>
            </div>
        </header>
        
        <main className="flex-1 overflow-hidden">
            <EnterpriseDashboard />
        </main>
      </div>
    </div>
  );
}
