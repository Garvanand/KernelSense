import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { cn } from '@/lib/utils';
import { Cpu, MemoryStick } from 'lucide-react';

export type ProcessNodeData = {
  pid: number;
  name: string;
  cpu_percent: number;
  mem_rss_bytes: number;
  ppid?: number;
  num_threads?: number;
  io_read_bytes?: number;
  io_write_bytes?: number;
  num_fds?: number;
  open_files?: any;
  sockets?: any;
  permissions?: any;
  isNew?: boolean;
  isExiting?: boolean;
};

const ProcessNode = ({ data }: NodeProps<ProcessNodeData>) => {
  // Determine color intensity based on CPU
  const cpu = data.cpu_percent || 0;
  let intensityClass = 'border-white/10 bg-white/5 text-slate-300';
  let glowClass = '';

  if (cpu > 80) {
    intensityClass = 'border-ring0 bg-ring0/10 text-ring0';
    glowClass = 'shadow-[0_0_15px_var(--ring-0-glow)]';
  } else if (cpu > 40) {
    intensityClass = 'border-ring1 bg-ring1/10 text-ring1';
    glowClass = 'shadow-[0_0_15px_var(--ring-1-glow)]';
  } else if (cpu > 10) {
    intensityClass = 'border-ring2 bg-ring2/10 text-ring2';
    glowClass = 'shadow-[0_0_10px_var(--ring-2-glow)]';
  } else if (cpu > 2) {
    intensityClass = 'border-ring3 bg-ring3/10 text-ring3';
    glowClass = 'shadow-[0_0_5px_var(--ring-3-glow)]';
  }

  return (
    <div
      className={cn(
        'min-w-[160px] px-4 py-3 rounded-xl border backdrop-blur-md transition-all duration-500',
        intensityClass,
        glowClass,
        data.isNew ? 'animate-fade-in scale-100' : '',
        data.isExiting ? 'opacity-0 scale-95' : 'opacity-100'
      )}
    >
      <Handle type="target" position={Position.Top} className="!bg-white/20 !border-0 !w-3 !h-3" />
      
      <div className="flex flex-col space-y-2">
        <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-1">
          <span className="font-semibold truncate max-w-[100px] text-white" title={data.name}>
            {data.name}
          </span>
          <span className="text-xs font-mono bg-black/40 px-1.5 py-0.5 rounded">
            {data.pid}
          </span>
        </div>
        
        <div className="flex justify-between items-center text-xs space-x-4">
          <div className="flex items-center space-x-1">
            <Cpu className="w-3 h-3" />
            <span className="font-mono">{cpu.toFixed(1)}%</span>
          </div>
          <div className="flex items-center space-x-1">
            <MemoryStick className="w-3 h-3" />
            <span className="font-mono">{(data.mem_rss_bytes / 1024 / 1024).toFixed(0)}M</span>
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-white/20 !border-0 !w-3 !h-3" />
    </div>
  );
};

export default memo(ProcessNode);
