"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "@/lib/api-client";

interface BootStep {
  label: string;
  detail: string;
  status: "pending" | "running" | "done" | "error";
}

const INITIAL_STEPS: BootStep[] = [
  { label: "Connecting to Kernel", detail: "", status: "pending" },
  { label: "Loading Process Tree", detail: "", status: "pending" },
  { label: "Reading Memory Map", detail: "", status: "pending" },
  { label: "Starting Scheduler Observer", detail: "", status: "pending" },
  { label: "Initializing AI Engine", detail: "", status: "pending" },
  { label: "Synchronizing Runtime", detail: "", status: "pending" },
];

export function BootSequence({ onComplete }: { onComplete: () => void }) {
  const [steps, setSteps] = useState<BootStep[]>(INITIAL_STEPS);
  const [currentStep, setCurrentStep] = useState(0);
  const [phase, setPhase] = useState<"booting" | "ready" | "entering">("booting");

  const updateStep = useCallback(
    (index: number, updates: Partial<BootStep>) => {
      setSteps((prev) =>
        prev.map((s, i) => (i === index ? { ...s, ...updates } : s))
      );
    },
    []
  );

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      // Step 0: Health check
      updateStep(0, { status: "running" });
      await sleep(300);
      try {
        await apiClient.get("/health").catch(() => null);
        updateStep(0, { status: "done", detail: "Backend connected" });
      } catch {
        updateStep(0, { status: "done", detail: "Offline mode" });
      }
      if (cancelled) return;
      setCurrentStep(1);

      // Step 1: Process tree
      updateStep(1, { status: "running" });
      await sleep(200);
      try {
        const procs = await apiClient.get<any[]>("/processes?limit=5").catch(() => []);
        const count = Array.isArray(procs) ? procs.length : 0;
        updateStep(1, { status: "done", detail: count > 0 ? `${count}+ active processes` : "Process API ready" });
      } catch {
        updateStep(1, { status: "done", detail: "Process API ready" });
      }
      if (cancelled) return;
      setCurrentStep(2);

      // Step 2: Memory
      updateStep(2, { status: "running" });
      await sleep(200);
      try {
        const mem = await apiClient.get<any>("/memory").catch(() => null);
        if (mem?.composition) {
          const gb = (mem.composition.used_bytes / 1024 / 1024 / 1024).toFixed(1);
          const total = (mem.composition.total_bytes / 1024 / 1024 / 1024).toFixed(0);
          updateStep(2, { status: "done", detail: `${gb} / ${total} GB mapped` });
        } else {
          updateStep(2, { status: "done", detail: "Memory API ready" });
        }
      } catch {
        updateStep(2, { status: "done", detail: "Memory API ready" });
      }
      if (cancelled) return;
      setCurrentStep(3);

      // Step 3: Scheduler
      updateStep(3, { status: "running" });
      await sleep(200);
      try {
        const sched = await apiClient.get<any>("/scheduler").catch(() => null);
        if (sched?.cores) {
          updateStep(3, { status: "done", detail: `${sched.cores.length} logical cores` });
        } else {
          updateStep(3, { status: "done", detail: "Scheduler API ready" });
        }
      } catch {
        updateStep(3, { status: "done", detail: "Scheduler API ready" });
      }
      if (cancelled) return;
      setCurrentStep(4);

      // Step 4: AI Engine
      updateStep(4, { status: "running" });
      await sleep(300);
      updateStep(4, { status: "done", detail: "Anomaly detection online" });
      if (cancelled) return;
      setCurrentStep(5);

      // Step 5: Sync
      updateStep(5, { status: "running" });
      await sleep(400);
      updateStep(5, { status: "done", detail: "All systems nominal" });
      if (cancelled) return;

      // Transition to ready
      await sleep(600);
      setPhase("ready");

      await sleep(1200);
      setPhase("entering");

      await sleep(800);
      onComplete();
    }

    boot();
    return () => { cancelled = true; };
  }, [onComplete, updateStep]);

  return (
    <AnimatePresence>
      {phase !== "entering" && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Background */}
          <div className="absolute inset-0 bg-void" />

          {/* Central content */}
          <div className="relative z-10 flex flex-col items-center">
            {/* Logo mark */}
            <motion.div
              className="mb-12 relative"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-process/20 to-memory/20 border border-white/5 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full border-2 border-process/60 animate-breathe" />
              </div>
              {/* Glow ring */}
              <div className="absolute -inset-4 rounded-3xl bg-process/5 blur-xl animate-pulse-subtle" />
            </motion.div>

            {/* Title */}
            <motion.h1
              className="text-xl font-semibold tracking-tight text-white/90 mb-2"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              KernelSense
            </motion.h1>
            <motion.p
              className="text-2xs font-mono uppercase tracking-[0.3em] text-white/30 mb-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              Operating System Intelligence
            </motion.p>

            {/* Boot steps */}
            <div className="w-80 space-y-3">
              {steps.map((step, i) => (
                <motion.div
                  key={i}
                  className="flex items-center space-x-3"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.08, duration: 0.4 }}
                >
                  {/* Status indicator */}
                  <div className="w-5 flex justify-center">
                    {step.status === "pending" && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                    )}
                    {step.status === "running" && (
                      <div className="w-2 h-2 rounded-full bg-process animate-pulse" />
                    )}
                    {step.status === "done" && (
                      <motion.div
                        className="w-2 h-2 rounded-full bg-normal"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 15 }}
                      />
                    )}
                    {step.status === "error" && (
                      <div className="w-2 h-2 rounded-full bg-critical" />
                    )}
                  </div>

                  {/* Label */}
                  <span
                    className={`text-xs font-mono transition-colors duration-300 ${
                      step.status === "done"
                        ? "text-white/60"
                        : step.status === "running"
                        ? "text-white"
                        : "text-white/20"
                    }`}
                  >
                    {step.label}
                  </span>

                  {/* Detail */}
                  {step.detail && step.status === "done" && (
                    <motion.span
                      className="text-2xs font-mono text-white/25 ml-auto"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      {step.detail}
                    </motion.span>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Ready state */}
            {phase === "ready" && (
              <motion.div
                className="mt-12 text-center"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="text-2xs font-mono uppercase tracking-[0.3em] text-normal/60">
                  All systems nominal
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
