"use client"

import * as React from "react"
import { useAccessLevel, AccessLevel } from "@/lib/store/access-level"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Shield, Cpu, Microscope } from "lucide-react"

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
    <div className="grid gap-6 md:grid-cols-3">
      {levels.map((l) => (
        <Card 
          key={l.id}
          className={cn(
            "cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:bg-white/10",
            level === l.id ? `border-${l.colorClass.split("-")[1]} ${l.glowClass} bg-white/5` : "border-white/5"
          )}
          onClick={() => setLevel(l.id)}
        >
          <CardHeader className="space-y-4">
            <div className={cn("p-3 rounded-xl w-fit bg-white/5", level === l.id ? l.colorClass : "text-slate-400")}>
              <l.icon className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <CardTitle className={level === l.id ? l.colorClass : "text-slate-200"}>
                {l.title}
              </CardTitle>
              <CardDescription>{l.description}</CardDescription>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  )
}
