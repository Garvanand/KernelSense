"use client"

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Clock } from 'lucide-react';

export function RunQueue({ latencyMs }: { latencyMs: number }) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [history, setHistory] = useState<{time: number, latency: number}[]>([]);
  
  useEffect(() => {
    setHistory(prev => {
      const now = Date.now();
      const next = [...prev, { time: now, latency: latencyMs }];
      // Keep last 30 data points
      if (next.length > 30) next.shift();
      return next;
    });
  }, [latencyMs]);

  useEffect(() => {
    if (!chartRef.current || history.length < 2) return;

    d3.select(chartRef.current).selectAll('*').remove();

    const margin = { top: 10, right: 10, bottom: 20, left: 30 };
    const width = chartRef.current.clientWidth - margin.left - margin.right;
    const height = 120 - margin.top - margin.bottom;

    const svg = d3.select(chartRef.current)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleTime()
      .domain(d3.extent(history, d => d.time) as [number, number])
      .range([0, width]);

    const maxLat = Math.max(d3.max(history, d => d.latency) || 0, 5.0);
    
    const y = d3.scaleLinear()
      .domain([0, maxLat * 1.2])
      .range([height, 0]);

    // Area fill
    const area = d3.area<any>()
      .x(d => x(d.time))
      .y0(height)
      .y1(d => y(d.latency))
      .curve(d3.curveMonotoneX);

    svg.append("path")
      .datum(history)
      .attr("fill", "var(--ring-1)")
      .attr("fill-opacity", 0.2)
      .attr("d", area);

    // Line
    const line = d3.line<any>()
      .x(d => x(d.time))
      .y(d => y(d.latency))
      .curve(d3.curveMonotoneX);

    svg.append('path')
      .datum(history)
      .attr('fill', 'none')
      .attr('stroke', 'var(--ring-1)')
      .attr('stroke-width', 2)
      .attr('d', line);

    // Axes
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(4).tickFormat(() => '')) // hide time text for clean UI
      .attr('color', 'rgba(255,255,255,0.2)');

    svg.append('g')
      .call(d3.axisLeft(y).ticks(3))
      .attr('color', 'rgba(255,255,255,0.2)')
      .attr('font-size', '10px');

  }, [history]);

  return (
    <div className="glass-panel p-6 rounded-2xl flex flex-col h-full">
      <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-4">
        <h2 className="text-lg font-bold text-white flex items-center">
          <Clock className="w-5 h-5 mr-2 text-ring1" />
          Run-Queue Latency
        </h2>
        <div className="text-right">
          <div className="text-2xl font-mono text-white font-bold">{latencyMs.toFixed(1)}</div>
          <div className="text-xs text-slate-400">ms average</div>
        </div>
      </div>
      
      <div className="flex-1 w-full" ref={chartRef} />
    </div>
  );
}
