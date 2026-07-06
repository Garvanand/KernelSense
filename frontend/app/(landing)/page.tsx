"use client"

import { LevelSelector } from "@/components/ui/level-selector"
import { useAccessLevel } from "@/lib/store/access-level"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"

export default function LandingPage() {
  const { level } = useAccessLevel()
  const router = useRouter()

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 relative overflow-hidden">
      
      {/* Abstract Background Elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-ring0-glow rounded-full mix-blend-screen filter blur-[100px] animate-pulse-slow opacity-30" />
      <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-ring3-glow rounded-full mix-blend-screen filter blur-[120px] animate-pulse-slow opacity-20" />

      <div className="z-10 max-w-5xl w-full space-y-16 animate-fade-in text-center">
        
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="space-y-6"
        >
          <div className="inline-flex items-center space-x-3 px-4 py-1.5 rounded-full border border-white/10 bg-black/40 backdrop-blur-xl shadow-inner shadow-white/5 mb-4">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ring2 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-ring2"></span>
            </span>
            <span className="text-xs font-mono font-bold tracking-widest text-slate-300">SYSTEM.ONLINE</span>
          </div>
          <h1 className="text-6xl md:text-7xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-white via-slate-200 to-slate-600 drop-shadow-sm">
            KernelSense
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed">
            Select your access clearance. Higher tiers unlock deeper OS introspection and ML-driven contention forecasting.
          </p>
        </motion.div>

        <LevelSelector />

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="pt-8"
        >
          <Button 
            size="lg" 
            variant="glass"
            className="w-full md:w-auto min-w-[240px] h-14 text-sm font-bold tracking-widest group"
            onClick={() => router.push("/dashboard")}
          >
            INITIALIZE SEQUENCE
            <span className="ml-2 inline-block transition-transform group-hover:translate-x-1">→</span>
          </Button>
          <div className="mt-6 flex items-center justify-center space-x-2">
            <span className="text-xs font-mono text-slate-500 tracking-wider">CURRENT CLEARANCE:</span>
            <span className="text-xs font-mono font-bold uppercase text-white bg-white/10 px-2 py-0.5 rounded">{level}</span>
          </div>
        </motion.div>

      </div>
    </main>
  )
}
