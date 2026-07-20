"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// Dynamically import to avoid SSR issues with ReactFlow
const OSUniverseCanvas = dynamic(
  () => import("@/components/universe/os-canvas"),
  { ssr: false, loading: () => (
    <div className="w-screen h-screen bg-[#03050d] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-3 h-3 rounded-full bg-cyan-400 animate-ping" />
        <p className="text-[10px] text-white/30 font-mono uppercase tracking-[0.3em]">Initializing OS Digital Twin...</p>
      </div>
    </div>
  )}
);

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return (
    <div className="w-screen h-screen bg-[#03050d]" />
  );

  return (
    <div className="w-screen h-screen bg-[#03050d] overflow-hidden">
      <OSUniverseCanvas />
    </div>
  );
}
