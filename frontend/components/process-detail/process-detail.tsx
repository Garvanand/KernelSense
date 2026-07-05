import React from 'react';
import { ProcessNodeData } from '../process-tree/process-node';
import { X, Activity, HardDrive, Network, Key, Cpu, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { useAccessLevel } from '@/lib/store/access-level';

interface ProcessDetailProps {
  process: ProcessNodeData | null;
  onClose: () => void;
}

export function ProcessDetail({ process, onClose }: ProcessDetailProps) {
  const { level } = useAccessLevel();
  
  if (!process) return null;

  return (
    <div className="absolute top-0 right-0 h-full w-96 glass-panel border-l border-t-0 border-b-0 border-r-0 border-white/10 p-6 overflow-y-auto animate-slide-up bg-black/60 z-50 shadow-[-10px_0_30px_rgba(0,0,0,0.5)] text-sm">
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="space-y-6 mt-4">
        {/* Header */}
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <h2 className="text-xl font-bold text-white truncate" title={process.name}>
              {process.name}
            </h2>
            <Badge variant="outline" className="font-mono">{process.pid}</Badge>
          </div>
          <div className="flex items-center space-x-2 text-slate-400 font-mono text-xs">
            <span>PPID: {process.ppid || 'N/A'}</span>
            <span>•</span>
            <span>Threads: {process.num_threads || 'N/A'}</span>
          </div>
        </div>

        {/* Resources */}
        <div className="space-y-3">
          <h3 className="flex items-center text-slate-300 font-semibold border-b border-white/10 pb-1">
            <Activity className="w-4 h-4 mr-2" />
            Resource Utilization
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 p-3 rounded-lg border border-white/5">
              <div className="text-slate-400 text-xs mb-1">CPU Usage</div>
              <div className="font-mono text-lg text-white">{process.cpu_percent?.toFixed(1)}%</div>
            </div>
            <div className="bg-white/5 p-3 rounded-lg border border-white/5">
              <div className="text-slate-400 text-xs mb-1">Memory (RSS)</div>
              <div className="font-mono text-lg text-white">{((process.mem_rss_bytes || 0) / 1024 / 1024).toFixed(1)} MB</div>
            </div>
          </div>
          {level !== 'guest' && (
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                <div className="text-slate-400 text-xs mb-1">Disk Read</div>
                <div className="font-mono text-white">{((process.io_read_bytes || 0) / 1024 / 1024).toFixed(1)} MB</div>
              </div>
              <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                <div className="text-slate-400 text-xs mb-1">Disk Write</div>
                <div className="font-mono text-white">{((process.io_write_bytes || 0) / 1024 / 1024).toFixed(1)} MB</div>
              </div>
            </div>
          )}
        </div>

        {/* Deep OS Hooks (Power/Research Only) */}
        {level !== 'guest' && (
          <>
            <div className="space-y-3">
              <h3 className="flex items-center text-slate-300 font-semibold border-b border-white/10 pb-1">
                <HardDrive className="w-4 h-4 mr-2" />
                File Descriptors ({process.num_fds || 0})
              </h3>
              {process.open_files ? (
                <div className="bg-black/40 border border-white/10 rounded-lg p-3 max-h-40 overflow-y-auto">
                  <pre className="font-mono text-xs text-slate-300">
                    {JSON.stringify(process.open_files, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic">No open files detected or permission denied.</div>
              )}
            </div>

            <div className="space-y-3">
              <h3 className="flex items-center text-slate-300 font-semibold border-b border-white/10 pb-1">
                <Network className="w-4 h-4 mr-2" />
                Network Sockets
              </h3>
              {process.sockets ? (
                <div className="bg-black/40 border border-white/10 rounded-lg p-3 max-h-40 overflow-y-auto">
                  <pre className="font-mono text-xs text-slate-300">
                    {JSON.stringify(process.sockets, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic">No active sockets detected.</div>
              )}
            </div>

            <div className="space-y-3">
              <h3 className="flex items-center text-slate-300 font-semibold border-b border-white/10 pb-1">
                <Key className="w-4 h-4 mr-2" />
                Permissions & Context
              </h3>
              {process.permissions ? (
                <div className="bg-black/40 border border-white/10 rounded-lg p-3 max-h-40 overflow-y-auto">
                  <pre className="font-mono text-xs text-slate-300">
                    {JSON.stringify(process.permissions, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic">Permission metadata unavailable.</div>
              )}
            </div>
          </>
        )}

        {level === 'guest' && (
          <div className="mt-8 p-4 bg-ring3/10 border border-ring3/20 rounded-xl text-center">
            <Users className="w-6 h-6 mx-auto mb-2 text-ring3" />
            <p className="text-xs text-slate-300">
              Deep OS inspection (Files, Sockets, Permissions) requires <strong className="text-white">Power User</strong> or <strong className="text-white">Research</strong> clearance.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
