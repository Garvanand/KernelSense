"use client";

import React, { useEffect, useRef } from "react";
import { useTelemetryStore } from "@/lib/store/telemetry-store";
import { useAccessLevel } from "@/lib/store/access-level";
import { StatCard } from "@/components/ui/stat-card";
import { ProgressBar } from "@/components/ui/progress-bar";

export function OverviewView() {
  const processes = useTelemetryStore((s) => s.processes);
  const cores = useTelemetryStore((s) => s.cores);
  const memory = useTelemetryStore((s) => s.memory);
  const systemMetrics = useTelemetryStore((s) => s.systemMetrics);
  const contextSwitchRate = useTelemetryStore((s) => s.contextSwitchRate);
  const resourceHistory = useTelemetryStore((s) => s.resourceHistory);
  const incidents = useTelemetryStore((s) => s.incidents);
  const { level } = useAccessLevel();

  const avgCpu = cores.length > 0 ? (cores.reduce((a, c) => a + c.utilization_percent, 0) / cores.length) : 0;
  const memGB = memory ? (memory.used_bytes / 1024 / 1024 / 1024).toFixed(1) : "0.0";
  const memTotalGB = memory ? (memory.total_bytes / 1024 / 1024 / 1024).toFixed(0) : "0";

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto">
      {/* Row 1: Summary Cards */}
      <div className="grid grid-cols-5 gap-3">
        <StatCard label="CPU Usage" value={`${avgCpu.toFixed(0)}%`} color="var(--color-process)" subtext={`${cores.length} Cores`} />
        <StatCard label="Memory" value={`${memGB}`} unit={`/ ${memTotalGB} GB`} color="var(--color-memory)" subtext={`${memory?.percent?.toFixed(1) || 0}% used`} />
        <StatCard label="Processes" value={processes.length} color="var(--color-network)" subtext="Running" />
        <StatCard label="Ctx Switches" value={contextSwitchRate > 1000 ? `${(contextSwitchRate / 1000).toFixed(0)}K` : contextSwitchRate} unit="/s" color="var(--color-scheduler)" />
        <StatCard label="Incidents" value={incidents.length} color={incidents.length > 0 ? "var(--severity-critical)" : "var(--severity-normal)"} subtext={incidents.length > 0 ? "Active" : "None"} />
      </div>

      {/* Row 2: Core Matrix + Live Feed */}
      <div className="grid grid-cols-12 gap-3">
        {/* Core Matrix */}
        <div className="col-span-7 glass rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">CPU Core Matrix</h3>
              <p className="text-[10px] text-white/30">Real-time per-core utilization</p>
            </div>
            <div className="text-[10px] font-mono text-white/30">
              {systemMetrics?.cpu_freq_mhz ? `${(systemMetrics.cpu_freq_mhz / 1000).toFixed(1)} GHz` : ""}
            </div>
          </div>
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(cores.length, 8)}, 1fr)` }}>
            {cores.map((core) => {
              const u = core.utilization_percent;
              const color = u > 80 ? "var(--severity-critical)" : u > 50 ? "var(--severity-warning)" : "var(--color-process)";
              return (
                <div key={core.core_id} className="glass-subtle rounded-lg p-2 text-center">
                  <div className="text-[9px] font-bold text-white/50 mb-1">C{String(core.core_id + 1).padStart(2, "0")}</div>
                  <div className="text-sm font-bold font-mono tabular-nums" style={{ color }}>{u.toFixed(0)}%</div>
                  <ProgressBar value={u} color={color} height={3} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Event Feed */}
        <div className="col-span-5 glass rounded-xl p-4 flex flex-col">
          <div className="mb-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Live System Feed</h3>
            <p className="text-[10px] text-white/30">Real-time system events and alerts</p>
          </div>
          <LiveFeed />
        </div>
      </div>

      {/* Row 3: Resource Timeline */}
      <div className="glass rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Resource Timeline</h3>
            <p className="text-[10px] text-white/30">Historical performance visualization</p>
          </div>
          <div className="flex gap-4 text-[9px] font-mono">
            <span className="text-cyan-400">● CPU USAGE</span>
            <span className="text-indigo-400">● MEMORY</span>
            <span className="text-orange-400">● NETWORK I/O</span>
          </div>
        </div>
        <ResourceTimeline />
      </div>

      {/* Row 4: Active Processes + Memory Map + AI Insights */}
      <div className="grid grid-cols-12 gap-3">
        {/* Active Processes */}
        <div className="col-span-5 glass rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Active Processes</h3>
              <p className="text-[10px] text-white/30">Top resource consuming processes</p>
            </div>
          </div>
          <ProcessTable />
        </div>

        {/* Memory Map */}
        <div className="col-span-4 glass rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Memory Map</h3>
              <p className="text-[10px] text-white/30">Real-time memory allocation map</p>
            </div>
            <div className="text-xs font-mono text-indigo-400">
              {memGB} GB / {memTotalGB} GB
            </div>
          </div>
          <MemoryMapViz />
        </div>

        {/* AI Insights */}
        <div className="col-span-3 glass rounded-xl p-4 flex flex-col">
          <div className="mb-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">AI System Insights</h3>
            <p className="text-[10px] text-white/30">Powered by KernelSense AI</p>
          </div>
          <AIInsightsPanel />
        </div>
      </div>
    </div>
  );
}

// ---- Sub-components ----

function LiveFeed() {
  const processes = useTelemetryStore((s) => s.processes);
  const contextSwitchRate = useTelemetryStore((s) => s.contextSwitchRate);
  const lastUpdate = useTelemetryStore((s) => s.lastUpdate);
  const [events, setEvents] = React.useState<{ time: string; text: string; color: string }[]>([]);

  useEffect(() => {
    if (!lastUpdate) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-US", { hour12: false });
    
    // Generate events from real telemetry changes
    const newEvents: { time: string; text: string; color: string }[] = [];
    
    if (processes.length > 0) {
      const top = processes.reduce((a, b) => (a.cpu_percent > b.cpu_percent ? a : b), processes[0]);
      if (top.cpu_percent > 5) {
        newEvents.push({ time: timeStr, text: `High CPU: ${top.name} (${top.cpu_percent.toFixed(1)}%)`, color: "var(--color-process)" });
      }
    }
    
    if (contextSwitchRate > 10000) {
      newEvents.push({ time: timeStr, text: `Context switches: ${(contextSwitchRate / 1000).toFixed(0)}K/s`, color: "var(--color-scheduler)" });
    }

    if (newEvents.length > 0) {
      setEvents((prev) => [...newEvents, ...prev].slice(0, 15));
    }
  }, [lastUpdate, processes, contextSwitchRate]);

  return (
    <div className="flex-1 overflow-y-auto space-y-1 text-[10px] font-mono">
      {events.length === 0 ? (
        <div className="text-white/20 text-center py-4">Waiting for events...</div>
      ) : (
        events.map((e, i) => (
          <div key={i} className="flex gap-2 py-0.5">
            <span className="text-white/20 shrink-0">{e.time}</span>
            <span style={{ color: e.color }}>{e.text}</span>
          </div>
        ))
      )}
    </div>
  );
}

function ResourceTimeline() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const history = useTelemetryStore((s) => s.resourceHistory);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = containerRef.current.clientWidth;
    const h = 160;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    ctx.clearRect(0, 0, w, h);

    if (history.length < 2) {
      ctx.fillStyle = "rgba(255,255,255,0.1)";
      ctx.font = "11px monospace";
      ctx.textAlign = "center";
      ctx.fillText("Collecting data...", w / 2, h / 2);
      return;
    }

    // Draw grid lines
    for (let i = 0; i <= 4; i++) {
      const y = (h / 4) * i;
      ctx.strokeStyle = "rgba(255,255,255,0.03)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    const drawLine = (data: number[], color: string, maxVal: number) => {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.lineJoin = "round";
      data.forEach((val, i) => {
        const x = (i / (data.length - 1)) * w;
        const y = h - (val / maxVal) * h;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Fill under the line
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fillStyle = color.replace("1)", "0.05)");
      ctx.fill();
    };

    const cpuData = history.map((p) => p.cpu_user_percent + p.cpu_system_percent);
    const memData = history.map((p) => p.mem_percent);
    
    drawLine(cpuData, "rgba(34, 211, 238, 1)", 100);
    drawLine(memData, "rgba(129, 140, 248, 1)", 100);

  }, [history]);

  return (
    <div ref={containerRef} className="w-full">
      <canvas ref={canvasRef} />
    </div>
  );
}

function ProcessTable() {
  const processes = useTelemetryStore((s) => s.processes);
  
  const sorted = [...processes]
    .sort((a, b) => b.cpu_percent - a.cpu_percent)
    .slice(0, 12);

  return (
    <div className="overflow-y-auto max-h-[200px]">
      <table className="w-full text-[10px] font-mono">
        <thead>
          <tr className="text-white/30 uppercase tracking-wider border-b border-white/5">
            <th className="text-left py-1.5 font-medium">Process</th>
            <th className="text-right py-1.5 font-medium">PID</th>
            <th className="text-right py-1.5 font-medium">CPU %</th>
            <th className="text-right py-1.5 font-medium">Memory</th>
            <th className="text-right py-1.5 font-medium">Threads</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((p) => (
            <tr key={p.pid} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors">
              <td className="py-1.5 text-white/70 max-w-[100px] truncate">{p.name}</td>
              <td className="py-1.5 text-right text-white/40">{p.pid}</td>
              <td className="py-1.5 text-right" style={{ color: p.cpu_percent > 20 ? "var(--severity-warning)" : "var(--color-process)" }}>
                {p.cpu_percent.toFixed(1)}
              </td>
              <td className="py-1.5 text-right text-white/50">
                {p.mem_rss_bytes > 1024 * 1024 * 1024
                  ? `${(p.mem_rss_bytes / 1024 / 1024 / 1024).toFixed(1)} GB`
                  : `${(p.mem_rss_bytes / 1024 / 1024).toFixed(0)} MB`}
              </td>
              <td className="py-1.5 text-right text-white/40">{p.num_threads || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MemoryMapViz() {
  const memory = useTelemetryStore((s) => s.memory);
  if (!memory) return <div className="text-white/20 text-[10px] text-center py-4">Loading...</div>;

  const totalBlocks = 64;
  const usedBlocks = Math.round((memory.percent / 100) * totalBlocks);

  return (
    <div>
      <div className="grid grid-cols-8 gap-1 mb-3">
        {Array.from({ length: totalBlocks }, (_, i) => (
          <div
            key={i}
            className="aspect-square rounded-sm transition-colors duration-300"
            style={{
              background: i < usedBlocks
                ? `rgba(129, 140, 248, ${0.3 + (i / totalBlocks) * 0.5})`
                : "rgba(255,255,255,0.03)",
            }}
          />
        ))}
      </div>
      <div className="flex gap-4 text-[9px] font-mono text-white/30">
        <span><span className="inline-block w-2 h-2 rounded-sm bg-indigo-400/60 mr-1" />USED</span>
        <span><span className="inline-block w-2 h-2 rounded-sm bg-white/5 mr-1" />FREE</span>
      </div>
    </div>
  );
}

function AIInsightsPanel() {
  const memory = useTelemetryStore((s) => s.memory);
  const cores = useTelemetryStore((s) => s.cores);
  const incidents = useTelemetryStore((s) => s.incidents);

  const avgCpu = cores.length > 0 ? cores.reduce((a, c) => a + c.utilization_percent, 0) / cores.length : 0;
  const memPercent = memory?.percent || 0;
  
  const status = avgCpu < 50 && memPercent < 70 ? "Optimal" : avgCpu < 80 && memPercent < 85 ? "Moderate" : "Critical";
  const statusColor = status === "Optimal" ? "var(--severity-normal)" : status === "Moderate" ? "var(--severity-warning)" : "var(--severity-critical)";
  const anomalyScore = Math.min(100, Math.round(avgCpu * 0.3 + memPercent * 0.4 + incidents.length * 20));

  return (
    <div className="flex-1 space-y-3">
      <div className="glass-subtle rounded-lg p-3">
        <div className="text-[9px] text-white/30 mb-1">System Status</div>
        <div className="text-sm font-bold" style={{ color: statusColor }}>{status}</div>
      </div>
      <div className="glass-subtle rounded-lg p-3">
        <div className="text-[9px] text-white/30 mb-1">Anomaly Score</div>
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-bold font-mono text-white">{anomalyScore}</span>
          <span className="text-[10px] text-white/30">/100</span>
        </div>
      </div>
      <div className="glass-subtle rounded-lg p-3">
        <div className="text-[9px] text-white/30 mb-1">Prediction</div>
        <div className="text-[11px]" style={{ color: statusColor }}>
          {status === "Optimal" ? "No issues predicted" : status === "Moderate" ? "Monitor closely" : "Intervention recommended"}
        </div>
        <div className="text-[9px] text-white/20 mt-0.5">Next 24h</div>
      </div>
    </div>
  );
}
