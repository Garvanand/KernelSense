"use client";

import React from "react";

interface ProgressBarProps {
  value: number; // 0-100
  color?: string;
  height?: number;
  showLabel?: boolean;
  label?: string;
}

export function ProgressBar({ value, color = "var(--color-process)", height = 6, showLabel, label }: ProgressBarProps) {
  const clampedValue = Math.max(0, Math.min(100, value));
  return (
    <div className="w-full">
      {(showLabel || label) && (
        <div className="flex justify-between mb-1">
          {label && <span className="text-[10px] text-white/40 uppercase tracking-wider">{label}</span>}
          {showLabel && <span className="text-[10px] font-mono text-white/50">{clampedValue.toFixed(1)}%</span>}
        </div>
      )}
      <div className="w-full rounded-full overflow-hidden" style={{ height, background: "rgba(255,255,255,0.05)" }}>
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${clampedValue}%`, background: color }}
        />
      </div>
    </div>
  );
}
