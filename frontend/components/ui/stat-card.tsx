"use client";

import React from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  color?: string;
  icon?: React.ReactNode;
  subtext?: string;
}

export function StatCard({ label, value, unit, color = "var(--color-process)", icon, subtext }: StatCardProps) {
  return (
    <div className="glass rounded-xl p-4 flex flex-col justify-between min-h-[100px]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/40">{label}</span>
        {icon && <div className="w-4 h-4 text-white/30">{icon}</div>}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold font-mono tabular-nums" style={{ color }}>{value}</span>
        {unit && <span className="text-xs text-white/40 font-mono">{unit}</span>}
      </div>
      {subtext && <span className="text-[10px] text-white/30 mt-1">{subtext}</span>}
    </div>
  );
}
