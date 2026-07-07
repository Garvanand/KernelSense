"use client";

import React, { useState } from "react";
import { Sidebar, type DashboardView } from "./sidebar";
import { Header } from "./header";

const VIEW_META: Record<DashboardView, { title: string; subtitle: string }> = {
  overview: { title: "SYSTEM OVERVIEW", subtitle: "Real-time operating system telemetry and AI-powered insights" },
  processes: { title: "PROCESS MAP", subtitle: "Active process tree and resource consumption" },
  cpu: { title: "CPU ENGINE", subtitle: "Per-core utilization and context switch topology" },
  memory: { title: "MEMORY CORE", subtitle: "Heap allocation, fragmentation, and leak detection" },
  scheduler: { title: "SCHEDULER", subtitle: "Run-queue latency and context switch event stream" },
  incidents: { title: "INCIDENTS", subtitle: "AI-detected anomalies and root-cause investigation" },
  ai: { title: "AI INSIGHTS", subtitle: "Machine learning pipeline status and predictions" },
  settings: { title: "SETTINGS", subtitle: "Access control and system configuration" },
};

interface DashboardShellProps {
  children: (view: DashboardView) => React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const [activeView, setActiveView] = useState<DashboardView>("overview");
  const meta = VIEW_META[activeView];

  return (
    <div className="h-screen w-screen flex overflow-hidden">
      <Sidebar activeView={activeView} onNavigate={setActiveView} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={meta.title} subtitle={meta.subtitle} />
        <main className="flex-1 overflow-y-auto p-4">
          {children(activeView)}
        </main>
      </div>
    </div>
  );
}
