"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAccessLevel, AccessLevel } from "@/lib/store/access-level";
import { View } from "./nav-rail";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: View) => void;
}

export function CommandPalette({ isOpen, onClose, onNavigate }: CommandPaletteProps) {
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { level, setLevel, demoMode, setDemoMode } = useAccessLevel();

  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  const commands = [
    {
      group: "Navigation",
      items: [
        { label: "Go to System Organism", action: () => handleAction(() => onNavigate("organism")) },
        { label: "Go to Memory Terrain", action: () => handleAction(() => onNavigate("memory")) },
        { label: "Go to CPU Topology", action: () => handleAction(() => onNavigate("scheduler")) },
        { label: "Go to Incident Theater", action: () => handleAction(() => onNavigate("incidents")) },
      ],
    },
    {
      group: "System State",
      items: [
        { label: demoMode ? "Disable Demo Mode" : "Enable Demo Mode (Simulate Incidents)", action: () => handleAction(() => setDemoMode(!demoMode)) },
      ],
    },
    {
      group: "Clearance Level",
      items: (["guest", "power", "kernel", "research"] as AccessLevel[]).map((l) => ({
        label: `Switch to ${l.charAt(0).toUpperCase() + l.slice(1)} Level`,
        action: () => handleAction(() => setLevel(l)),
      })),
    },
  ];

  const filteredCommands = commands.map((g) => ({
    ...g,
    items: g.items.filter((item) =>
      item.label.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Palette */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="relative w-full max-w-2xl bg-void border border-surface-border rounded-2xl shadow-2xl overflow-hidden glass"
      >
        <div className="flex items-center px-4 py-4 border-b border-surface-border">
          <svg className="w-5 h-5 text-white/40 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/30 text-lg font-sans"
            placeholder="Search processes, navigate, or run commands..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
            }}
          />
          <kbd className="text-2xs font-mono px-2 py-1 rounded bg-white/5 border border-white/10 text-white/40 ml-4">
            ESC
          </kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {filteredCommands.length === 0 ? (
            <div className="py-12 text-center text-white/30 text-sm">
              No results found for "{search}"
            </div>
          ) : (
            filteredCommands.map((group) => (
              <div key={group.group} className="mb-4 last:mb-0">
                <div className="px-3 py-2 text-xs font-semibold text-white/30 uppercase tracking-wider">
                  {group.group}
                </div>
                {group.items.map((item, i) => (
                  <button
                    key={i}
                    onClick={item.action}
                    className="w-full text-left px-3 py-3 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-lg flex items-center justify-between group transition-colors"
                  >
                    <span>{item.label}</span>
                    <span className="opacity-0 group-hover:opacity-100 text-white/30 text-xs">↵</span>
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
