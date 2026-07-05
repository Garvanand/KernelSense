"use client"

import { LevelSelector } from "@/components/ui/level-selector"
import { useAccessLevel } from "@/lib/store/access-level"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function LandingPage() {
  const { level } = useAccessLevel()
  const router = useRouter()

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 relative overflow-hidden">
      
      {/* Abstract Background Elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-ring0-glow rounded-full mix-blend-screen filter blur-[100px] animate-pulse-slow opacity-30" />
      <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-ring3-glow rounded-full mix-blend-screen filter blur-[120px] animate-pulse-slow opacity-20" />

      <div className="z-10 max-w-4xl w-full space-y-12 animate-fade-in text-center">
        
        <div className="space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-4">
            <span className="w-2 h-2 rounded-full bg-ring2 animate-pulse" />
            <span className="text-xs font-mono text-slate-300">SYSTEM.ONLINE</span>
          </div>
          <h1 className="text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white to-slate-500">
            KernelSense
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Select your access clearance. Higher tiers unlock deeper OS introspection and ML-driven contention forecasting.
          </p>
        </div>

        <LevelSelector />

        <div className="pt-8 animate-slide-up">
          <Button 
            size="lg" 
            variant="glass"
            className="w-full md:w-auto min-w-[200px]"
            onClick={() => router.push("/dashboard")}
          >
            INITIALIZE SEQUENCE
          </Button>
          <p className="mt-4 text-xs font-mono text-slate-500">
            CURRENT CLEARANCE: <span className="uppercase text-white">{level}</span>
          </p>
        </div>

      </div>
    </main>
  )
}
