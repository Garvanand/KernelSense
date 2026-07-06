"use client";

import React, { useEffect, useRef } from "react";
import { useTelemetryStore } from "@/lib/store/telemetry-store";

export function MemoryTerrain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const memory = useTelemetryStore((s) => s.memory);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let width = containerRef.current.clientWidth;
    let height = containerRef.current.clientHeight;
    
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    let animationFrameId: number;
    let time = 0;

    const render = () => {
      time += 0.01;

      // Clear
      ctx.fillStyle = "#05060a";
      ctx.fillRect(0, 0, width, height);

      const percent = memory?.composition?.percent || 10;
      
      // Draw memory waves (terrain)
      const numWaves = 4;
      for (let i = 0; i < numWaves; i++) {
        ctx.beginPath();
        ctx.moveTo(0, height);
        
        // Base height based on memory usage
        const baseHeight = height - (height * (percent / 100)) + (i * 20);

        for (let x = 0; x <= width; x += 10) {
          // Add sine waves for terrain texture
          const y = baseHeight 
                  + Math.sin(x * 0.01 + time + i) * 20 
                  + Math.sin(x * 0.005 - time) * 10;
          ctx.lineTo(x, y);
        }
        
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();

        // Fill with opacity to create layered depth
        ctx.fillStyle = `rgba(129, 140, 248, ${0.1 - (i * 0.02)})`;
        ctx.fill();
        
        // Top edge highlight
        ctx.strokeStyle = `rgba(129, 140, 248, ${0.4 - (i * 0.1)})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Draw "fragmentation" particles above the waves
      const numParticles = Math.floor(percent);
      for (let i = 0; i < numParticles; i++) {
          const x = (Math.sin(i * 133.7) * 0.5 + 0.5) * width;
          const baseY = height - (height * (percent / 100));
          const y = baseY - (Math.cos(i * 99.1 + time) * 0.5 + 0.5) * 100;
          
          ctx.fillStyle = "rgba(129, 140, 248, 0.5)";
          ctx.fillRect(x, y, 2, 2);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      width = containerRef.current?.clientWidth || 0;
      height = containerRef.current?.clientHeight || 0;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, [memory]);

  const gbUsed = memory?.composition ? (memory.composition.used_bytes / 1024 / 1024 / 1024).toFixed(1) : "0.0";
  const gbTotal = memory?.composition ? (memory.composition.total_bytes / 1024 / 1024 / 1024).toFixed(0) : "16";

  return (
    <div className="w-full h-full relative" ref={containerRef}>
      <canvas ref={canvasRef} className="absolute inset-0" />
      
      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none p-8 flex flex-col justify-between">
        <header>
          <h2 className="text-xl font-bold tracking-tight text-white mb-1">Memory Terrain</h2>
          <p className="text-sm text-white/40">Live topological map of heap fragmentation</p>
        </header>

        <div className="flex justify-between items-end">
          <div className="glass-subtle p-4 rounded-xl border-white/5 backdrop-blur-md">
            <div className="text-2xs font-mono uppercase text-white/30 mb-2">Usage Profile</div>
            <div className="flex space-x-6">
              <div>
                <div className="text-memory font-mono text-xl">{gbUsed} <span className="text-sm text-memory/50">GB</span></div>
                <div className="text-2xs font-mono text-white/40">Mapped Area</div>
              </div>
              <div>
                <div className="text-white font-mono text-xl">{gbTotal} <span className="text-sm text-white/50">GB</span></div>
                <div className="text-2xs font-mono text-white/40">Physical Space</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
