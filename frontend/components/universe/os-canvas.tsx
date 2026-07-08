"use client";

import React, { useCallback } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { SchedulerNode } from "./nodes/scheduler-node";
import { MemoryNode } from "./nodes/memory-node";
import { ProcessTreeNode } from "./nodes/process-tree-node";
import { DeadlockNode } from "./nodes/deadlock-node";
import { StorageNode } from "./nodes/storage-node";
import { NetworkNode } from "./nodes/network-node";
import { SyscallsNode } from "./nodes/syscalls-node";
import { InterruptsNode } from "./nodes/interrupts-node";
import { CacheNode } from "./nodes/cache-node";
import { ContextSwitchNode } from "./nodes/context-switch-node";
import { IPCNode } from "./nodes/ipc-node";
import { FileSystemNode } from "./nodes/filesystem-node";
import { GPUNode } from "./nodes/gpu-node";
import { EnergyNode } from "./nodes/energy-node";
import { SwapNode } from "./nodes/swap-node";
import { TimelineDVR } from "./ui/timeline-dvr";
import { AITutor } from "./ui/ai-tutor";

const nodeTypes = {
  scheduler: SchedulerNode,
  memory: MemoryNode,
  "process-tree": ProcessTreeNode,
  deadlock: DeadlockNode,
  storage: StorageNode,
  network: NetworkNode,
  syscalls: SyscallsNode,
  interrupts: InterruptsNode,
  cache: CacheNode,
  "context-switch": ContextSwitchNode,
  ipc: IPCNode,
  filesystem: FileSystemNode,
  gpu: GPUNode,
  energy: EnergyNode,
  swap: SwapNode,
};

// Symmetrical Tiered Architecture Layout (User Space -> Kernel -> Hardware)
// X-axis symmetry: 0 is center, steps of 450
const initialNodes = [
  // --- TOP TIER: User Space & Networking (Y = -600) ---
  { id: "network", type: "network", position: { x: -450, y: -600 }, data: {} },
  { id: "process-tree", type: "process-tree", position: { x: 0, y: -600 }, data: {} },
  { id: "ipc", type: "ipc", position: { x: 450, y: -600 }, data: {} },
  
  // --- MIDDLE TIER: Kernel Core (Y = -150) ---
  { id: "filesystem", type: "filesystem", position: { x: -900, y: -150 }, data: {} },
  { id: "syscalls", type: "syscalls", position: { x: -450, y: -150 }, data: {} },
  { id: "scheduler", type: "scheduler", position: { x: 0, y: -150 }, data: {} },
  { id: "context-switch", type: "context-switch", position: { x: 450, y: -150 }, data: {} },
  { id: "deadlock", type: "deadlock", position: { x: 900, y: -150 }, data: {} },
  
  // --- BOTTOM TIER: Hardware & Memory (Y = 300) ---
  { id: "interrupts", type: "interrupts", position: { x: -1350, y: 300 }, data: {} },
  { id: "storage", type: "storage", position: { x: -900, y: 300 }, data: {} },
  { id: "cache", type: "cache", position: { x: -450, y: 300 }, data: {} },
  { id: "memory", type: "memory", position: { x: 0, y: 300 }, data: {} },
  { id: "swap", type: "swap", position: { x: 450, y: 300 }, data: {} },
  { id: "gpu", type: "gpu", position: { x: 900, y: 300 }, data: {} },
  { id: "energy", type: "energy", position: { x: 1350, y: 300 }, data: {} },
];

const initialEdges = [
  // User Space -> Kernel Space (Downwards)
  { id: "e-net-sched", source: "network", target: "scheduler", animated: true, style: { stroke: "rgba(16,185,129,0.5)" } },
  { id: "e-tree-sched", source: "process-tree", target: "scheduler", animated: true, style: { stroke: "var(--color-process)", strokeWidth: 2 } },
  { id: "e-tree-ipc", source: "process-tree", target: "ipc", animated: true, style: { stroke: "var(--color-process)" } },
  
  // Kernel Internal (Horizontal/Diagonal)
  { id: "e-sys-sched", source: "syscalls", target: "scheduler", animated: true, style: { stroke: "rgba(217,70,239,0.5)" } },
  { id: "e-sched-cs", source: "scheduler", target: "context-switch", animated: true, style: { stroke: "var(--color-scheduler)", strokeWidth: 2 } },
  { id: "e-sched-deadlock", source: "scheduler", target: "deadlock", animated: true, style: { stroke: "rgba(251,146,60,0.5)" } },
  
  // Kernel Space -> Hardware Space (Downwards)
  { id: "e-fs-storage", source: "filesystem", target: "storage", animated: true, style: { stroke: "rgba(14,165,233,0.5)", strokeWidth: 2 } },
  { id: "e-sched-mem", source: "scheduler", target: "memory", animated: true, style: { stroke: "var(--color-memory)", strokeWidth: 2 } },
  { id: "e-mem-swap", source: "memory", target: "swap", animated: true, style: { stroke: "rgba(168,85,247,0.5)", strokeWidth: 2 } },
  
  // Hardware Internal (Upwards/Diagonal to Kernel)
  { id: "e-cache-mem", source: "cache", target: "memory", animated: true, style: { stroke: "rgba(234,179,8,0.5)" } },
  { id: "e-int-sched", source: "interrupts", target: "scheduler", animated: true, style: { stroke: "rgba(244,63,94,0.5)" } },
  { id: "e-energy-gpu", source: "energy", target: "gpu", animated: true, style: { stroke: "rgba(245,158,11,0.5)" } },
];

export default function OSUniverseCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: any) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  return (
    <div className="w-full h-full void-gradient relative noise overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        className="dark"
        minZoom={0.1}
        maxZoom={4}
      >
        <Controls showInteractive={false} className="bg-[#080a10]/80 backdrop-blur-xl border border-white/10 fill-white rounded-xl overflow-hidden shadow-2xl" />
        <MiniMap 
          nodeColor={(n) => {
            if (n.id === 'scheduler') return '#22d3ee';
            if (n.id === 'memory') return '#818cf8';
            if (n.id === 'deadlock') return '#fb923c';
            return 'rgba(255,255,255,0.1)';
          }} 
          maskColor="rgba(0,0,0,0.6)" 
          className="bg-[#080a10]/50 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl" 
        />
        {/* Deep starfield-like background */}
        <Background 
           variant={BackgroundVariant.Dots} 
           gap={32} 
           size={1.5} 
           color="rgba(255,255,255,0.06)" 
           style={{ backgroundColor: 'transparent' }}
        />
        <Background 
           variant={BackgroundVariant.Dots} 
           gap={120} 
           size={2} 
           color="rgba(255,255,255,0.03)" 
           style={{ backgroundColor: 'transparent' }}
        />
      </ReactFlow>
      
      {/* Title Overlay */}
      <div className="absolute top-8 left-8 z-10 select-none pointer-events-none">
        <div className="flex items-center gap-3 mb-1">
           <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
           <h1 className="text-3xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-white/90 to-white/30 drop-shadow-lg">
             KernelSense
           </h1>
        </div>
        <p className="text-[10px] text-cyan-400/80 font-mono uppercase tracking-[0.3em] font-medium ml-5 drop-shadow">
           Operating System Digital Twin
        </p>
      </div>
      
      <AITutor />
      <TimelineDVR />
    </div>
  );
}
