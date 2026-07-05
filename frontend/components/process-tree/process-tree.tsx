"use client"

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import useSWR from 'swr';
import dagre from 'dagre';
import { apiClient } from '@/lib/api-client';
import ProcessNode, { ProcessNodeData } from './process-node';
import { useAccessLevel } from '@/lib/store/access-level';

const nodeTypes = {
  process: ProcessNode,
};

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 200;
const nodeHeight = 80;

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = direction === 'TB' ? 'top' : 'left' as any;
    node.sourcePosition = direction === 'TB' ? 'bottom' : 'right' as any;

    // We are shifting the dagre node position (anchor=center center) to the top left
    // so it matches the React Flow node anchor point (top left).
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };

    return node;
  });

  return { nodes: layoutedNodes, edges };
};

export interface ProcessTreeProps {
  onNodeClick: (nodeData: ProcessNodeData) => void;
}

const fetcher = (url: string) => apiClient.get<any[]>(url);

export function ProcessTree({ onNodeClick }: ProcessTreeProps) {
  const { level } = useAccessLevel();
  // Poll every 2 seconds
  const { data: processes, error, isLoading } = useSWR('/processes?limit=30', fetcher, { refreshInterval: 2000 });

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  // Track previous PIDs to handle animations
  const [prevPids, setPrevPids] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!processes) return;

    const currentPids = new Set<number>();
    
    const newNodes: Node<ProcessNodeData>[] = processes.map((p) => {
      currentPids.add(p.pid);
      return {
        id: p.pid.toString(),
        type: 'process',
        data: {
          ...p,
          isNew: !prevPids.has(p.pid) && prevPids.size > 0, // only animate new if it's not the first load
        },
        position: { x: 0, y: 0 }, // computed by dagre
      };
    });

    const newEdges: Edge[] = [];
    processes.forEach((p) => {
      if (p.ppid && currentPids.has(p.ppid)) {
        newEdges.push({
          id: `e${p.ppid}-${p.pid}`,
          source: p.ppid.toString(),
          target: p.pid.toString(),
          type: 'smoothstep',
          animated: true,
          style: { stroke: 'rgba(255, 255, 255, 0.2)', strokeWidth: 2 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: 'rgba(255, 255, 255, 0.2)',
          },
        });
      }
    });

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      newNodes,
      newEdges
    );

    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
    setPrevPids(currentPids);

  }, [processes]);

  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    onNodeClick(node.data);
  }, [onNodeClick]);

  if (error) return <div className="p-8 text-ring0">Failed to load processes. Is the backend running?</div>;
  if (isLoading && nodes.length === 0) return <div className="p-8 text-slate-400">Initializing Process Graph...</div>;

  return (
    <div className="w-full h-full min-h-[600px] relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        fitView
        className="bg-black/20"
      >
        <Background color="rgba(255,255,255,0.05)" gap={16} />
        <Controls className="!bg-black/60 !border-white/10 !fill-white" />
      </ReactFlow>
      
      {/* Legend */}
      <div className="absolute bottom-6 left-6 glass-panel p-4 rounded-xl text-xs space-y-2 pointer-events-none">
        <h4 className="font-semibold text-slate-200 mb-2 border-b border-white/10 pb-1">CPU Pressure</h4>
        <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-full bg-ring0 shadow-[0_0_10px_var(--ring-0-glow)]"></div><span>&gt; 80% (Critical)</span></div>
        <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-full bg-ring1 shadow-[0_0_10px_var(--ring-1-glow)]"></div><span>&gt; 40% (High)</span></div>
        <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-full bg-ring2 shadow-[0_0_10px_var(--ring-2-glow)]"></div><span>&gt; 10% (Elevated)</span></div>
        <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-full bg-ring3 shadow-[0_0_10px_var(--ring-3-glow)]"></div><span>&lt; 10% (Normal)</span></div>
      </div>
    </div>
  );
}
