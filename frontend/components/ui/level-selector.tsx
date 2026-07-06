"use client"

import * as React from "react"
import { useAccessLevel, AccessLevel } from "@/lib/store/access-level"
import { cn } from "@/lib/utils"
import { Shield, Cpu, Microscope } from "lucide-react"
import { motion } from "framer-motion"

const levels: {
  id: AccessLevel
  title: string
  description: string
  icon: React.ElementType
  colorClass: string
  glowClass: string
}[] = [
  {
    id: "guest",
    title: "Guest",
    description: "Read-only overview. Basic process stats and resource utilization without deep hooks.",
    icon: Shield,
    colorClass: "text-ring3",
    glowClass: "shadow-[0_0_15px_var(--ring-3-glow)]",
  },
  {
    id: "power",
    title: "Power User",
    description: "Deep observability. Access open files, socket connections, and process ancestry trees.",
    icon: Cpu,
    colorClass: "text-ring2",
    glowClass: "shadow-[0_0_15px_var(--ring-2-glow)]",
  },
  {
    id: "research",
    title: "Research",
    description: "AI-enabled. Unlocks anomaly detection, ML forecasting, and process contention graphs.",
    icon: Microscope,
    colorClass: "text-research",
    glowClass: "shadow-[0_0_15px_var(--ring-research-glow)]",
  }
]

export function LevelSelector() {
  const { level, setLevel } = useAccessLevel()

  return (
    <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
      {levels.map((l, idx) => (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1, duration: 0.5, ease: "easeOut" }}
          key={l.id}
          className={cn(
            "relative cursor-pointer transition-all duration-500 overflow-hidden rounded-2xl border",
            level === l.id 
              ? `border-${l.colorClass.split("-")[1]} ${l.glowClass} bg-white/10 scale-105 z-10` 
              : "border-white/5 bg-black/40 hover:bg-white/5 hover:border-white/10 hover:scale-[1.02]"
          )}
          onClick={() => setLevel(l.id)}
        >
          {/* Animated Background Gradient on Selection */}
          {level === l.id && (
            <motion.div 
              layoutId="activeGlow"
              className={cn("absolute inset-0 opacity-20", `bg-${l.colorClass.split("-")[1]}`)}
              initial={false}
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}

          <div className="relative p-6 space-y-6 z-20">
            <div className={cn("p-4 rounded-xl w-fit bg-white/5 backdrop-blur-md shadow-inner shadow-white/10 transition-colors duration-300", level === l.id ? l.colorClass : "text-slate-400")}>
              <l.icon className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className={cn("text-xl font-bold tracking-tight transition-colors duration-300", level === l.id ? l.colorClass : "text-slate-200")}>
                {l.title}
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed font-medium">
                {l.description}
              </p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
