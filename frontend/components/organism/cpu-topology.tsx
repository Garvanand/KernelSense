"use client";

import React, { useEffect, useRef } from "react";
import { useAccessLevel } from "@/lib/store/access-level";
import { useTelemetryStore } from "@/lib/store/telemetry-store";

export function CpuTopology() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scheduler = useTelemetryStore((s) => s.scheduler);
  const { level } = useAccessLevel();

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
    
    // Store particles for context switches
    const particles: {x: number, y: number, tx: number, ty: number, life: number}[] = [];

    const render = () => {
      time += 0.02;
      
      // Motion blur effect
      ctx.fillStyle = "rgba(5, 6, 10, 0.2)";
      ctx.fillRect(0, 0, width, height);

      const cores = scheduler?.cores || Array.from({length: 16}, (_, i) => ({ core_id: i, utilization_percent: 0 }));
      
      // Layout cores in a circle or a grid. Let's do a central topology.
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) * 0.3;
      
      const numCores = cores.length;
      
      // Draw cores
      const corePositions: {x: number, y: number}[] = [];
      
      cores.forEach((core: any, i: number) => {
          const angle = (i / numCores) * Math.PI * 2 - Math.PI / 2;
          const x = centerX + Math.cos(angle) * radius;
          const y = centerY + Math.sin(angle) * radius;
          corePositions.push({x, y});
          
          const util = core.utilization_percent / 100;
          
          // Core pulse based on utilization
          const pulse = 1 + Math.sin(time * 5 + i) * 0.1 * util;
          const coreRadius = 20 * pulse;
          
          // Color heat
          const r = Math.floor(251 * util + 50 * (1 - util));
          const g = Math.floor(146 * util + 211 * (1 - util));
          const b = Math.floor(60 * util + 238 * (1 - util));
          const color = `rgba(${r}, ${g}, ${b}, 0.8)`;
          
          // Draw connection to center (L3 Cache/Bus)
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.lineTo(x, y);
          ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.1 + util * 0.3})`;
          ctx.lineWidth = 1 + util * 2;
          ctx.stroke();
          
          // Draw core
          ctx.beginPath();
          ctx.arc(x, y, coreRadius, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
          
          // Draw core ID
          ctx.fillStyle = "rgba(255,255,255,0.8)";
          ctx.font = "10px monospace";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(`C${core.core_id}`, x, y);
      });
      
      // Draw Central Hub
      ctx.beginPath();
      ctx.arc(centerX, centerY, 30, 0, Math.PI * 2);
      ctx.fillStyle = "#111520";
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Simulate Context Switches as particles jumping between cores
      const rate = scheduler?.context_switch_rate || 0;
      if (Math.random() < Math.min(rate / 5000, 0.3) && corePositions.length > 1) {
          const c1 = Math.floor(Math.random() * numCores);
          let c2 = Math.floor(Math.random() * numCores);
          while (c2 === c1) c2 = Math.floor(Math.random() * numCores);
          
          particles.push({
              x: corePositions[c1].x, y: corePositions[c1].y,
              tx: corePositions[c2].x, ty: corePositions[c2].y,
              life: 1.0
          });
      }
      
      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.life -= 0.05;
          if (p.life <= 0) {
              particles.splice(i, 1);
              continue;
          }
          
          // Bezier curve interpolation
          const t = 1 - p.life;
          // Control point pulled toward center
          const cx = centerX;
          const cy = centerY;
          
          const px = (1 - t) * (1 - t) * p.x + 2 * (1 - t) * t * cx + t * t * p.tx;
          const py = (1 - t) * (1 - t) * p.y + 2 * (1 - t) * t * cy + t * t * p.ty;
          
          ctx.beginPath();
          ctx.arc(px, py, 2, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(251, 146, 60, 0.8)"; // Scheduler orange
          ctx.fill();
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
  }, [scheduler]);

  return (
    <div className="w-full h-full relative" ref={containerRef}>
      <canvas ref={canvasRef} className="absolute inset-0" />
      
      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none p-8 flex flex-col justify-between">
        <header>
          <h2 className="text-xl font-bold tracking-tight text-white mb-1">CPU Topology</h2>
          <p className="text-sm text-white/40">Multi-core utilization and context switch routing</p>
        </header>

        <div className="flex justify-between items-end">
          <div className="glass-subtle p-4 rounded-xl border-white/5 backdrop-blur-md">
            <div className="text-2xs font-mono uppercase text-white/30 mb-2">Metrics</div>
            <div className="flex space-x-6">
              <div>
                <div className="text-scheduler font-mono text-xl">{scheduler?.context_switch_rate?.toLocaleString() || 0}</div>
                <div className="text-2xs font-mono text-white/40">Ctx Switches /s</div>
              </div>
              {level !== "guest" && (
                <div>
                  <div className="text-white font-mono text-xl">{scheduler?.run_queue_latency_ms?.toFixed(1) || 0} <span className="text-sm text-white/50">ms</span></div>
                  <div className="text-2xs font-mono text-white/40">Run-Queue Latency</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
