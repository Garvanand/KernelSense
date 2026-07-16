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
    <div className="w-screen h-screen bg-black text-[#00ff00] p-4 flex flex-col items-center justify-center noise">
      <div className="max-w-7xl w-full h-full flex flex-col border border-[#00ff00]/50 p-2 bg-black/90 backdrop-blur-sm shadow-[0_0_30px_rgba(0,255,0,0.1)]">
        <header className="mb-4 border-b border-[#00ff00]/50 pb-2 px-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <ShieldCheck size={28} />
                <div>
                    <h1 className="text-3xl font-mono font-bold tracking-widest leading-none">KERNEL_SENSE</h1>
                    <p className="text-[10px] uppercase tracking-[0.3em] opacity-80 mt-1">Enterprise Telemetry Platform</p>
                </div>
            </div>
            <div className="text-right">
                <div className="animate-blink bg-[#00ff00]/20 text-[#00ff00] border border-[#00ff00] px-3 py-1 font-bold text-xs inline-block">SECURE LINK ACTIVE</div>
                <div className="text-[10px] mt-1 opacity-70">ENCRYPTION: AES-FERNET 256 // ADAPTIVE POLLING: ENABLED</div>
            </div>
        </header>
        
        <main className="flex-1 overflow-hidden">
            <EnterpriseDashboard />
        </main>
      </div>
    </div>
  );
}
