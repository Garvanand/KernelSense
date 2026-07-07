"use client";

import React, { useEffect, useState } from "react";
import { Handle, Position } from "@xyflow/react";
import { useTelemetryStore } from "@/lib/store/telemetry-store";
import { motion, AnimatePresence } from "framer-motion";

export function DeadlockNode() {
  const incidents = useTelemetryStore((s) => s.incidents);
  const deadlocks = incidents.filter(i => i.incident_type === "scheduler_contention" || i.incident_type === "deadlock_risk");

  const [graphNodes, setGraphNodes] = useState<{ id: string; type: "process" | "resource"; x: number; y: number }[]>([]);
  const [graphEdges, setGraphEdges] = useState<{ source: string; target: string; type: "holds" | "waits" }[]>([]);

  // Synthesize a visual resource graph based on deadlock incidents for demonstration
  useEffect(() => {
    if (deadlocks.length > 0) {
      // Simulate a cycle
      setGraphNodes([
        { id: "P1", type: "process", x: 20, y: 80 },
        { id: "P2", type: "process", x: 220, y: 80 },
        { id: "R1", type: "resource", x: 120, y: 20 },
        { id: "R2", type: "resource", x: 120, y: 140 },
      ]);
      setGraphEdges([
        { source: "P1", target: "R1", type: "waits" },
        { source: "R1", target: "P2", type: "holds" },
        { source: "P2", target: "R2", type: "waits" },
        { source: "R2", target: "P1", type: "holds" },
      ]);
    } else {
      // Normal state
      setGraphNodes([
        { id: "P1", type: "process", x: 50, y: 80 },
        { id: "R1", type: "resource", x: 150, y: 80 },
      ]);
      setGraphEdges([
        { source: "R1", target: "P1", type: "holds" }
      ]);
    }
  }, [deadlocks.length]);

  return (
    <div className="bg-[#080a10]/90 backdrop-blur-md border border-orange-500/30 rounded-xl p-6 w-[350px] shadow-[0_0_30px_rgba(251,146,60,0.15)] relative">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-orange-500 border-none" />
      
      <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
        <h2 className="text-sm font-bold text-orange-400 uppercase tracking-widest">Deadlock Detector</h2>
        <div className="text-[10px] font-mono">
          {deadlocks.length > 0 ? (
            <span className="text-red-400 animate-pulse">CYCLE DETECTED</span>
          ) : (
            <span className="text-green-400">GRAPH ACYCLIC</span>
          )}
        </div>
      </div>

      <div className="relative h-[200px] bg-black/30 border border-white/5 rounded-lg overflow-hidden">
         {/* Draw Edges */}
         <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            <defs>
               <marker id="arrow-waits" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                 <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(239, 68, 68, 0.8)" />
               </marker>
               <marker id="arrow-holds" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                 <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(52, 211, 153, 0.8)" />
               </marker>
            </defs>
            {graphEdges.map((e, i) => {
               const sourceNode = graphNodes.find(n => n.id === e.source);
               const targetNode = graphNodes.find(n => n.id === e.target);
               if (!sourceNode || !targetNode) return null;
               
               const color = e.type === "waits" ? "rgba(239, 68, 68, 0.6)" : "rgba(52, 211, 153, 0.6)";
               const marker = e.type === "waits" ? "url(#arrow-waits)" : "url(#arrow-holds)";
               
               return (
                   <motion.line 
                      key={i}
                      x1={sourceNode.x + 20} y1={sourceNode.y + 20}
                      x2={targetNode.x + 20} y2={targetNode.y + 20}
                      stroke={color}
                      strokeWidth="2"
                      strokeDasharray={e.type === "waits" ? "4,4" : "none"}
                      markerEnd={marker}
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5 }}
                   />
               );
            })}
         </svg>
         
         {/* Draw Nodes */}
         {graphNodes.map(node => (
            <motion.div
               key={node.id}
               className="absolute w-10 h-10 -ml-5 -mt-5 flex items-center justify-center rounded-full text-[10px] font-bold z-10"
               style={{
                  left: node.x + 20,
                  top: node.y + 20,
                  backgroundColor: node.type === "process" ? "rgba(34, 211, 238, 0.1)" : "rgba(167, 139, 250, 0.1)",
                  border: `2px solid ${node.type === "process" ? "rgba(34, 211, 238, 0.8)" : "rgba(167, 139, 250, 0.8)"}`
               }}
               layout
            >
               {node.id}
            </motion.div>
         ))}
      </div>
      
      {deadlocks.length > 0 && (
         <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded text-[10px] text-red-400 font-mono">
            <strong>AI Analysis:</strong> Circular wait detected between Postgres (PID 1400) and Backup_Agent over IPC_Lock_A.
         </div>
      )}
    </div>
  );
}
