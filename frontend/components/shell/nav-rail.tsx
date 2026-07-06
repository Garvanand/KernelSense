"use client";

import React from "react";
import { motion } from "framer-motion";
import { useAccessLevel } from "@/lib/store/access-level";

export type View = "organism" | "memory" | "scheduler" | "incidents";

interface NavRailProps {
  activeView: View;
  onNavigate: (view: View) => void;
}

export function NavRail({ activeView, onNavigate }: NavRailProps) {
  const { level } = useAccessLevel();

  const views: { id: View; icon: React.ReactNode; label: string; color: string }[] = [
    {
      id: "organism",
      label: "System Organism",
      color: "var(--color-process)",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M2 12h2M20 12h2" />
        </svg>
      ),
    },
    {
      id: "memory",
      label: "Memory Terrain",
      color: "var(--color-memory)",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
          <rect x="9" y="9" width="6" height="6" />
          <line x1="9" y1="1" x2="9" y2="4" />
          <line x1="15" y1="1" x2="15" y2="4" />
          <line x1="9" y1="20" x2="9" y2="23" />
          <line x1="15" y1="20" x2="15" y2="23" />
          <line x1="20" y1="9" x2="23" y2="9" />
          <line x1="20" y1="14" x2="23" y2="14" />
          <line x1="1" y1="9" x2="4" y2="9" />
          <line x1="1" y1="14" x2="4" y2="14" />
        </svg>
      ),
    },
    {
      id: "scheduler",
      label: "CPU Topology",
      color: "var(--color-scheduler)",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
          <line x1="9" y1="9" x2="15" y2="15" />
          <line x1="15" y1="9" x2="9" y2="15" />
        </svg>
      ),
    },
    {
      id: "incidents",
      label: "Incident Theater",
      color: "var(--severity-critical)",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
    },
  ];

  return (
    <nav className="w-16 h-full border-r border-surface-border bg-void/50 backdrop-blur-xl flex flex-col items-center py-6 z-40 relative">
      <div className="mb-12">
        <div className="w-8 h-8 rounded-lg bg-process/20 border border-white/10 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full border border-process animate-breathe" />
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center space-y-6">
        {views.map((view) => {
          const isActive = activeView === view.id;
          return (
            <button
              key={view.id}
              onClick={() => onNavigate(view.id)}
              className="relative w-10 h-10 rounded-xl flex items-center justify-center group outline-none"
              title={view.label}
            >
              {/* Active Indicator */}
              {isActive && (
                <motion.div
                  layoutId="active-nav"
                  className="absolute inset-0 rounded-xl bg-white/10"
                  initial={false}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}

              {/* Icon */}
              <div
                className={`w-5 h-5 relative z-10 transition-colors duration-300 ${
                  isActive ? "text-white" : "text-white/30 group-hover:text-white/60"
                }`}
                style={{ color: isActive ? view.color : undefined }}
              >
                {view.icon}
              </div>

              {/* Subtle edge glow when active */}
              {isActive && (
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 rounded-r-full"
                  style={{ backgroundColor: view.color }}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-auto flex flex-col items-center space-y-4">
        <div className="text-2xs font-mono uppercase text-white/20 -rotate-90 origin-center whitespace-nowrap mb-6">
          Level: {level}
        </div>
      </div>
    </nav>
  );
}
