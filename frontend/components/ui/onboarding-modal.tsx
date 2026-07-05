"use client"

import { useEffect, useState } from "react"
import { useAccessLevel } from "@/lib/store/access-level"

export function OnboardingModal() {
  const { hasSeenOnboarding, setHasSeenOnboarding } = useAccessLevel()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || hasSeenOnboarding) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg overflow-hidden rounded-xl border border-white/10 bg-black/50 p-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="h-3 w-3 rounded-full bg-blue-500 animate-pulse" />
          <h2 className="text-2xl font-bold tracking-tight text-white">Welcome to KernelSense</h2>
        </div>
        
        <p className="mb-4 text-sm leading-relaxed text-zinc-400">
          KernelSense is a deep OS telemetry engine. Rather than authenticating via passwords, we use a 
          <strong> Zero-Trust Clearance Model</strong>. 
        </p>

        <div className="mb-6 space-y-3">
          <div className="rounded-lg border border-white/5 bg-white/5 p-3">
            <h3 className="text-sm font-semibold text-white">1. Select your Clearance</h3>
            <p className="text-xs text-zinc-400 mt-1">Use the dropdown in the navigation bar to escalate your privileges from Guest to Kernel-level tracking.</p>
          </div>
          <div className="rounded-lg border border-white/5 bg-white/5 p-3">
            <h3 className="text-sm font-semibold text-white">2. Bounded Telemetry</h3>
            <p className="text-xs text-zinc-400 mt-1">KernelSense strictly reads metadata. We never inspect packet payloads or modify OS state.</p>
          </div>
          <div className="rounded-lg border border-white/5 bg-white/5 p-3">
            <h3 className="text-sm font-semibold text-white">3. Presentation Mode</h3>
            <p className="text-xs text-zinc-400 mt-1">You can toggle <strong>Demo Mode</strong> in the dashboard to inject simulated ML incident data.</p>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => setHasSeenOnboarding(true)}
            className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 active:scale-95"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  )
}
