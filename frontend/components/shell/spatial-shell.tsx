"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NavRail, type View } from "./nav-rail";
import { CommandPalette } from "./command-palette";

interface SpatialShellProps {
  children: (activeView: View) => React.ReactNode;
}

export function SpatialShell({ children }: SpatialShellProps) {
  const [activeView, setActiveView] = useState<View>("organism");
  const [cmdOpen, setCmdOpen] = useState(false);

  // Keyboard shortcut for command palette
  React.useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdOpen((v) => !v);
      }
      if (e.key === "Escape") {
        setCmdOpen(false);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const handleNavigate = useCallback((view: View) => {
    setActiveView(view);
    setCmdOpen(false);
  }, []);

  return (
    <div className="h-screen w-screen flex overflow-hidden">
      {/* Navigation Rail — left edge */}
      <NavRail activeView={activeView} onNavigate={handleNavigate} />

      {/* Main Viewport — crossfade between views */}
      <main className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            {children(activeView)}
          </motion.div>
        </AnimatePresence>

        {/* Command palette hint */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30">
          <button
            onClick={() => setCmdOpen(true)}
            className="glass-subtle px-4 py-2 rounded-xl flex items-center space-x-3 text-white/30 hover:text-white/50 transition-colors cursor-pointer group"
          >
            <svg className="w-3.5 h-3.5 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <span className="text-2xs font-mono">Search or command</span>
            <kbd className="text-2xs font-mono px-1.5 py-0.5 rounded bg-white/5 border border-white/5">
              ⌘K
            </kbd>
          </button>
        </div>
      </main>

      {/* Command Palette overlay */}
      <CommandPalette
        isOpen={cmdOpen}
        onClose={() => setCmdOpen(false)}
        onNavigate={handleNavigate}
      />
    </div>
  );
}
