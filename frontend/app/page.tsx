"use client";

import React, { useEffect, useState } from "react";
import { RealtimeTracker } from "@/components/ui/realtime-tracker";

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="w-screen h-screen bg-black text-[#00ff00] p-8 flex flex-col items-center justify-center noise">
      <div className="max-w-6xl w-full h-full flex flex-col border-2 border-[#00ff00] p-4 bg-black/80 backdrop-blur-sm shadow-[0_0_20px_rgba(0,255,0,0.2)]">
        <header className="mb-6 border-b-2 border-[#00ff00] pb-4 flex items-center justify-between">
            <div>
                <h1 className="text-4xl font-mono font-bold tracking-widest">KERNEL_SENSE</h1>
                <p className="text-xs uppercase tracking-[0.4em] opacity-80 mt-1">Classified telemetry stream</p>
            </div>
            <div className="text-right">
                <div className="animate-blink bg-[#00ff00] text-black px-2 py-1 font-bold text-sm inline-block">SECURE LINK ACTIVE</div>
                <div className="text-[10px] mt-2">ENCRYPTION: AES-FERNET 256</div>
            </div>
        </header>
        
        <main className="flex-1 flex flex-col lg:flex-row gap-4 overflow-hidden">
            <div className="flex-1 overflow-hidden">
                <RealtimeTracker />
            </div>
        </main>
      </div>
    </div>
  );
}
