"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useAccessLevel } from "@/lib/store/access-level";
import { useTelemetryStore } from "@/lib/store/telemetry-store";

// Mock AI insights for research mode
const INSIGHTS = [
  "Sub-system entropy stabilized",
  "Anomaly predicted in next 4ms",
  "Process cluster isolation complete",
  "Memory boundaries enforced",
  "eBPF trace hooks active"
];

const fetcher = (url: string) => apiClient.get<any[]>(url);

interface Node {
  id: string;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  angle: number;
  distance: number;
  targetAngle: number;
  targetDistance: number;
}

export function SystemOrganism() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const processes = useTelemetryStore((s) => s.processes);
  const [insightIndex, setInsightIndex] = useState(0);
  const { level } = useAccessLevel();

  // Cycle insights
  useEffect(() => {
    if (level !== "research") return;
    const interval = setInterval(() => {
      setInsightIndex((i) => (i + 1) % INSIGHTS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [level]);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current || !processes) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let width = containerRef.current.clientWidth;
    let height = containerRef.current.clientHeight;
    
    // High DPI display support
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    // Map processes to orbital nodes
    const nodes: Node[] = processes.map((p, i) => {
      // Memory determines size (radius 2 to 8)
      const r = Math.max(2, Math.min(8, (p.mem_rss_bytes || 0) / 1024 / 1024 / 10));
      // CPU determines color intensity and orbit speed (not implemented fully here, just visual)
      const isHot = (p.cpu_percent || 0) > 20;
      
      const angle = Math.random() * Math.PI * 2;
      // Distance from center based on index + some randomness, keeping it organic
      const distance = 80 + (i * 2) + (Math.random() * 40);

      return {
        id: p.pid.toString(),
        name: p.name,
        x: width / 2 + Math.cos(angle) * distance,
        y: height / 2 + Math.sin(angle) * distance,
        vx: 0,
        vy: 0,
        radius: r,
        color: isHot ? "rgba(239, 68, 68, 0.8)" : "rgba(34, 211, 238, 0.6)",
        angle,
        distance,
        targetAngle: angle,
        targetDistance: distance,
      };
    });

    let animationFrameId: number;
    let time = 0;

    const render = () => {
      time += 0.005; // Global time for breathing

      // Clear with void color (opaque for performance)
      ctx.fillStyle = "#05060a";
      ctx.fillRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;

      // Draw the central kernel core
      const coreRadius = 40 + Math.sin(time * 5) * 2; // Breathing pulse
      
      // Core glow
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 150);
      gradient.addColorStop(0, "rgba(248, 113, 113, 0.15)");
      gradient.addColorStop(1, "transparent");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Core center
      ctx.beginPath();
      ctx.arc(centerX, centerY, coreRadius, 0, Math.PI * 2);
      ctx.fillStyle = "#0c0f18";
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(248, 113, 113, 0.5)";
      ctx.stroke();

      // Inner core pulse
      ctx.beginPath();
      ctx.arc(centerX, centerY, 20 + Math.sin(time * 10) * 5, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(248, 113, 113, 0.1)";
      ctx.fill();

      // Draw nodes and connecting lines
      nodes.forEach((node, i) => {
        // Orbit
        node.angle += 0.002 + (node.radius * 0.0001); // Smaller nodes orbit slightly differently
        
        // Add some breathing to the distance
        const currentDist = node.distance + Math.sin(time * 2 + i) * 10;
        
        node.x = centerX + Math.cos(node.angle) * currentDist;
        node.y = centerY + Math.sin(node.angle) * currentDist;

        // Draw connections to nearby nodes (very faint) to create a web
        if (i % 3 === 0) { // Connect every 3rd node to center to avoid clutter
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(node.x, node.y);
            ctx.strokeStyle = "rgba(255,255,255,0.02)";
            ctx.lineWidth = 0.5;
            ctx.stroke();
        }

        // Draw node
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    // Handle resize
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
  }, [processes]);

  return (
    <div className="w-full h-full relative" ref={containerRef}>
      <canvas ref={canvasRef} className="absolute inset-0" />
      
      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none p-8 flex flex-col justify-between">
        <header>
          <h2 className="text-xl font-bold tracking-tight text-white mb-1">Process Galaxy</h2>
          <p className="text-sm text-white/40">Real-time force-directed topology</p>
        </header>

        <div className="flex justify-between items-end">
          <div className="glass-subtle p-4 rounded-xl border-white/5 backdrop-blur-md">
            <div className="text-2xs font-mono uppercase text-white/30 mb-2">Metrics</div>
            <div className="flex space-x-6">
              <div>
                <div className="text-white font-mono text-xl">{processes?.length || 0}</div>
                <div className="text-2xs font-mono text-white/40">Active Nodes</div>
              </div>
              <div>
                <div className="text-white font-mono text-xl">{level === "guest" ? "Ring 3" : "Ring 0"}</div>
                <div className="text-2xs font-mono text-white/40">Visibility</div>
              </div>
            </div>
          </div>

          {level === "research" && (
            <motion.div 
              key={insightIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-ai font-mono text-xs max-w-xs text-right"
            >
              [AI_CORE] {INSIGHTS[insightIndex]}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
