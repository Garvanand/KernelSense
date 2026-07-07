"use client";

import React from "react";
import { useTelemetryStore } from "@/lib/store/telemetry-store";
import { useAccessLevel } from "@/lib/store/access-level";

export type DashboardView = "overview" | "processes" | "cpu" | "memory" | "scheduler" | "incidents" | "ai" | "settings";

interface SidebarProps {
  activeView: DashboardView;
  onNavigate: (view: DashboardView) => void;
}

const NAV_ITEMS: { id: DashboardView; label: string; icon: string }[] = [
  { id: "overview", label: "OVERVIEW", icon: "◎" },
  { id: "processes", label: "PROCESS MAP", icon: "⊞" },
  { id: "cpu", label: "CPU ENGINE", icon: "⊡" },
  { id: "memory", label: "MEMORY CORE", icon: "▦" },
  { id: "scheduler", label: "SCHEDULER", icon: "⟳" },
  { id: "incidents", label: "INCIDENTS", icon: "⚠" },
  { id: "ai", label: "AI INSIGHTS", icon: "◈" },
  { id: "settings", label: "SETTINGS", icon: "⚙" },
];

export function Sidebar({ activeView, onNavigate }: SidebarProps) {
  const isConnected = useTelemetryStore((s) => s.isConnected);
  const memory = useTelemetryStore((s) => s.memory);
  const cores = useTelemetryStore((s) => s.cores);
  const processes = useTelemetryStore((s) => s.processes);
  const { level } = useAccessLevel();

  // Compute a simple health score (higher is better)
  const avgCpu = cores.length > 0 ? cores.reduce((a, c) => a + c.utilization_percent, 0) / cores.length : 0;
  const memPercent = memory?.percent || 0;
  const healthScore = Math.max(0, Math.min(100, Math.round(100 - (avgCpu * 0.4 + memPercent * 0.6))));
  const healthColor = healthScore > 70 ? "var(--severity-normal)" : healthScore > 40 ? "var(--severity-warning)" : "var(--severity-critical)";
  const healthLabel = healthScore > 70 ? "EXCELLENT" : healthScore > 40 ? "MODERATE" : "CRITICAL";

  return (
    <aside className="w-52 h-full flex flex-col border-r border-white/5 bg-[#080a10]/90 backdrop-blur-xl z-40 select-none">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-cyan-500/30 to-indigo-500/30 border border-white/10 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          </div>
          <div>
            <div className="text-sm font-bold text-white tracking-tight">KernelSense OS</div>
            <div className="text-[9px] text-white/30 uppercase tracking-[0.15em]">Live System Intelligence</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all duration-200 group ${
                isActive
                  ? "bg-white/10 text-white"
                  : "text-white/40 hover:text-white/70 hover:bg-white/5"
              }`}
            >
              <span className="text-xs w-4 text-center opacity-60">{item.icon}</span>
              <span className="text-[11px] font-semibold tracking-wide">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* System Status Panel */}
      <div className="px-3 pb-4 space-y-3">
        <div className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/30 px-1">System Status</div>
        
        {/* Health Score Circle */}
        <div className="flex items-center gap-3 px-1">
          <div className="relative w-12 h-12">
            <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
              <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
              <circle
                cx="24" cy="24" r="20" fill="none"
                stroke={healthColor}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${healthScore * 1.256} 999`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold font-mono" style={{ color: healthColor }}>{healthScore}</span>
            </div>
          </div>
          <div>
            <div className="text-[9px] text-white/40 uppercase tracking-wider">Health Score</div>
            <div className="text-xs font-bold" style={{ color: healthColor }}>{healthLabel}</div>
          </div>
        </div>

        {/* Mini stats */}
        <div className="space-y-1.5 px-1 text-[10px] font-mono text-white/40">
          <div className="flex justify-between">
            <span>PROCESSES</span>
            <span className="text-white/60">{processes.length}</span>
          </div>
          <div className="flex justify-between">
            <span>CORES</span>
            <span className="text-white/60">{cores.length}</span>
          </div>
          <div className="flex justify-between">
            <span>CLEARANCE</span>
            <span className="text-white/60 uppercase">{level}</span>
          </div>
        </div>

        {/* Connection indicator */}
        <div className="flex items-center gap-2 px-1">
          <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-green-400 animate-pulse" : "bg-red-400"}`} />
          <span className="text-[9px] font-mono text-white/30">{isConnected ? "SYSTEM SECURE" : "DISCONNECTED"}</span>
        </div>
      </div>
    </aside>
  );
}
