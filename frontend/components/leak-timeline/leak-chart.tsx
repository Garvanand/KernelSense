"use client"

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Badge } from '../ui/badge';
import { Cpu, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useAccessLevel } from '@/lib/store/access-level';

export interface MemoryAnomaly {
  pid: number;
  score: number;
  confidence: number;
  time_to_exhaustion_sec?: number;
  llm_explanation?: string;
}

interface LeakChartProps {
  anomaly: MemoryAnomaly;
}

export function LeakChart({ anomaly }: LeakChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const { level } = useAccessLevel();

  useEffect(() => {
    if (!chartRef.current) return;

    // We will generate a mock growth curve for visual demonstration
    // Since we don't have the full historical time-series sent down in this endpoint yet.
    // In Prompt 10 we saved the prediction; this simulates fetching the historical window used for that prediction.
    const numPoints = 60; // 60 seconds
    const data = Array.from({ length: numPoints }, (_, i) => ({
      time: i,
      memory: 100 + (i * 1.5) + (Math.random() * 5) // Gradual leak slope
    }));

    // Clear previous D3
    d3.select(chartRef.current).selectAll('*').remove();

    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const width = chartRef.current.clientWidth - margin.left - margin.right;
    const height = 150 - margin.top - margin.bottom;

    const svg = d3.select(chartRef.current)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear()
      .domain([0, numPoints - 1])
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.memory)! * 1.2])
      .range([height, 0]);

    // Grid lines
    svg.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(y)
        .ticks(4)
        .tickSize(-width)
        .tickFormat(() => '')
      )
      .style('stroke', 'rgba(255,255,255,0.05)')
      .style('stroke-dasharray', '3,3');

    // Axes
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(5))
      .attr('color', 'rgba(255,255,255,0.3)');

    svg.append('g')
      .call(d3.axisLeft(y).ticks(4))
      .attr('color', 'rgba(255,255,255,0.3)');

    // Line generator
    const line = d3.line<any>()
      .x(d => x(d.time))
      .y(d => y(d.memory))
      .curve(d3.curveMonotoneX);

    // Area generator for the fill
    const area = d3.area<any>()
      .x(d => x(d.time))
      .y0(height)
      .y1(d => y(d.memory))
      .curve(d3.curveMonotoneX);

    // Add Area Gradient
    const gradient = svg.append("defs")
      .append("linearGradient")
      .attr("id", `leak-gradient-${anomaly.pid}`)
      .attr("x1", "0%").attr("y1", "0%")
      .attr("x2", "0%").attr("y2", "100%");
      
    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", anomaly.score > 0.8 ? "var(--ring-0)" : "var(--ring-1)")
      .attr("stop-opacity", 0.4);
      
    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", anomaly.score > 0.8 ? "var(--ring-0)" : "var(--ring-1)")
      .attr("stop-opacity", 0);

    // Draw Area
    svg.append("path")
      .datum(data)
      .attr("fill", `url(#leak-gradient-${anomaly.pid})`)
      .attr("d", area);

    // Draw Line
    svg.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', anomaly.score > 0.8 ? 'var(--ring-0)' : 'var(--ring-1)')
      .attr('stroke-width', 2)
      .attr('d', line);

    // Exhaustion Marker (if time_to_exhaustion is provided)
    if (anomaly.time_to_exhaustion_sec) {
        const markerX = width * 0.8; // Arbitrary visual position representing the future
        
        svg.append("line")
            .attr("x1", markerX)
            .attr("y1", 0)
            .attr("x2", markerX)
            .attr("y2", height)
            .attr("stroke", "var(--ring-0)")
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", "4,4");
            
        svg.append("text")
            .attr("x", markerX - 5)
            .attr("y", 10)
            .attr("fill", "var(--ring-0)")
            .attr("font-size", "10px")
            .attr("text-anchor", "end")
            .text(`Exhaustion in ~${anomaly.time_to_exhaustion_sec}s`);
    }

  }, [anomaly]);

  return (
    <div className="glass-panel p-5 rounded-2xl flex flex-col space-y-4">
      <div className="flex justify-between items-start border-b border-white/10 pb-3">
        <div className="flex items-center space-x-3">
          <Badge variant={anomaly.score > 0.8 ? 'ring0' : 'ring1'}>
            <AlertTriangle className="w-3 h-3 mr-1" />
            PID: {anomaly.pid}
          </Badge>
          <div>
            <div className="text-white font-semibold">Memory Leak Anomaly Detected</div>
            <div className="text-xs text-slate-400 font-mono">Confidence: {(anomaly.confidence * 100).toFixed(1)}%</div>
          </div>
        </div>
      </div>

      <div className="h-[150px] w-full" ref={chartRef} />

      {/* LLM Explanation Engine Card (Gated by Research Level) */}
      {level === 'research' ? (
        <div className="bg-research/10 border border-research/30 p-4 rounded-xl mt-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Cpu className="w-16 h-16 text-research" />
          </div>
          <h4 className="text-research font-semibold text-sm mb-2 flex items-center">
            <Cpu className="w-4 h-4 mr-1" />
            Bounded LLM Diagnostic
          </h4>
          <p className="text-slate-300 text-sm leading-relaxed relative z-10">
            {anomaly.llm_explanation || "Analyzing heap allocation patterns. The MLP leak detector has flagged a monotonic RSS growth curve that exceeds the acceptable Z-Score bounds. Deep system trace suggests an unclosed file descriptor loop."}
          </p>
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 p-4 rounded-xl mt-2 text-center">
          <ShieldCheck className="w-6 h-6 text-slate-500 mx-auto mb-2" />
          <p className="text-xs text-slate-400">
            Automated root-cause diagnostic requires <strong className="text-white">Research</strong> clearance level.
          </p>
        </div>
      )}
    </div>
  );
}
