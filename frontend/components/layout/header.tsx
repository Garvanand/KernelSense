"use client";

import React, { useEffect, useState } from "react";
import { useAccessLevel, type AccessLevel } from "@/lib/store/access-level";
import { useTelemetryStore } from "@/lib/store/telemetry-store";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { level, setLevel } = useAccessLevel();
  const isConnected = useTelemetryStore((s) => s.isConnected);
  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("en-US", { hour12: false }));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  const levels: AccessLevel[] = ["guest", "power", "kernel", "research"];

  return (
    <header className="h-12 border-b border-white/5 flex items-center justify-between px-6 bg-[#080a10]/80 backdrop-blur-xl z-30 shrink-0">
      <div>
        <h1 className="text-sm font-bold text-white tracking-tight">{title}</h1>
        {subtitle && <p className="text-[10px] text-white/30">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {/* Connection indicator */}
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-green-400" : "bg-red-400"}`} />
          <span className="text-[10px] font-mono text-white/30">{isConnected ? "LIVE" : "OFFLINE"}</span>
        </div>

        {/* Clearance selector */}
        <div className="flex items-center gap-2 glass-subtle rounded-lg px-3 py-1.5">
          <span className="text-[9px] text-white/30 uppercase tracking-wider">Clearance</span>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value as AccessLevel)}
            className="bg-transparent text-[11px] font-bold text-cyan-400 uppercase outline-none cursor-pointer"
          >
            {levels.map((l) => (
              <option key={l} value={l} className="bg-[#0c0f18] text-white">{l}</option>
            ))}
          </select>
        </div>

        {/* Clock */}
        <div className="text-sm font-mono text-white/50 tabular-nums min-w-[70px] text-right">
          {time}
        </div>
      </div>
    </header>
  );
}
