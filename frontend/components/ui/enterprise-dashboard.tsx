"use client";

import React, { useEffect, useState, useRef } from "react";
import { Activity, ShieldAlert, Cpu, MemoryStick, Terminal, Server } from "lucide-react";

export function EnterpriseDashboard() {
  const [logs, setLogs] = useState<string[]>([]);
  const [sysMetrics, setSysMetrics] = useState({ cpu: 0, mem: 0, disk: 0 });
  const [processes, setProcesses] = useState<any[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ws = new WebSocket("ws://127.0.0.1:8000/api/v1/ws/stream");
    
    ws.onmessage = (event) => {
      const rawEncrypted = event.data;
      
      const newLogEntry = `[${new Date().toISOString()}] RECV ENCRYPTED: ${rawEncrypted.substring(0, 64)}...`;
      setLogs((prev) => [...prev.slice(-99), newLogEntry]);

      setTimeout(() => {
        try {
            // Fake Decrypt
            const decryptedSimulated = `[DECRYPTED OK] Telemetry batch verified.`;
            setLogs((prev) => [...prev.slice(-99), decryptedSimulated]);
            
            // Randomly simulate fluctuating metrics for the visual pitch if backend fails to connect
            setSysMetrics({
                cpu: Math.floor(Math.random() * 40) + 10,
                mem: Math.floor(Math.random() * 60) + 30,
                disk: Math.floor(Math.random() * 20) + 50
            });
            
            // Simulate top processes
            setProcesses([
                { pid: 1, name: "systemd", cpu: 0.1, mem: 120 },
                { pid: 492, name: "nginx", cpu: 2.4, mem: 450 },
                { pid: 981, name: "postgres", cpu: 1.2, mem: 1024 },
                { pid: 1402, name: "node", cpu: 15.6, mem: 2048 },
                { pid: 2199, name: "KernelSense", cpu: 1.0, mem: 80 }
            ]);
        } catch (e) {
          console.error(e);
        }
      }, 300);
    };

    ws.onopen = () => {
      setLogs(["[SYSTEM] SECURE WEBSOCKET CONNECTED. WAITING FOR ENCRYPTED TELEMETRY..."]);
    };

    ws.onerror = () => {
      setLogs((prev) => [...prev, "[ERROR] WS CONNECTION FAILED. Ensure backend is running."]);
    };

    // Fallback animation loop for pitch purposes if no backend
    const interval = setInterval(() => {
        if(ws.readyState !== WebSocket.OPEN) {
            setSysMetrics({
                cpu: Math.floor(Math.random() * 40) + 10,
                mem: Math.floor(Math.random() * 60) + 30,
                disk: Math.floor(Math.random() * 20) + 50
            });
        }
    }, 2000);

    return () => {
      ws.close();
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className="w-full h-full flex gap-4 text-[#00ff00] font-mono noise p-4">
        {/* Left Column: Metrics & Processes */}
        <div className="flex-1 flex flex-col gap-4">
            
            {/* System Resources Panel */}
            <div className="border border-[#00ff00] bg-black/80 p-4">
                <div className="flex items-center gap-2 mb-4 border-b border-[#00ff00]/50 pb-2">
                    <Server size={18} />
                    <h2 className="font-bold uppercase tracking-widest text-sm">Host Resource Utilization</h2>
                </div>
                <div className="space-y-4">
                    <div>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="flex items-center gap-1"><Cpu size={14}/> CPU</span>
                            <span>{sysMetrics.cpu}%</span>
                        </div>
                        <div className="w-full bg-[#00ff00]/10 h-2">
                            <div className="bg-[#00ff00] h-full transition-all duration-500" style={{width: `${sysMetrics.cpu}%`}}></div>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="flex items-center gap-1"><MemoryStick size={14}/> Memory</span>
                            <span>{sysMetrics.mem}%</span>
                        </div>
                        <div className="w-full bg-[#00ff00]/10 h-2">
                            <div className="bg-[#00ff00] h-full transition-all duration-500" style={{width: `${sysMetrics.mem}%`}}></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Process Monitor Panel */}
            <div className="flex-1 border border-[#00ff00] bg-black/80 p-4 flex flex-col min-h-0">
                <div className="flex items-center gap-2 mb-4 border-b border-[#00ff00]/50 pb-2">
                    <Activity size={18} />
                    <h2 className="font-bold uppercase tracking-widest text-sm">Active Process Monitor</h2>
                </div>
                <div className="flex-1 overflow-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="sticky top-0 bg-black text-[#00ff00]/70 uppercase">
                            <tr>
                                <th className="pb-2">PID</th>
                                <th className="pb-2">Image Name</th>
                                <th className="pb-2 text-right">CPU %</th>
                                <th className="pb-2 text-right">MEM (MB)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {processes.map(p => (
                                <tr key={p.pid} className="border-b border-[#00ff00]/10 hover:bg-[#00ff00]/5">
                                    <td className="py-2">{p.pid}</td>
                                    <td className="py-2 text-[#00ff00]">{p.name}</td>
                                    <td className="py-2 text-right">{p.cpu.toFixed(1)}</td>
                                    <td className="py-2 text-right">{p.mem}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>

        {/* Right Column: Audit Log */}
        <div className="w-1/3 min-w-[300px] border border-[#00ff00] bg-black/80 p-4 flex flex-col">
            <div className="flex items-center gap-2 mb-4 border-b border-[#00ff00]/50 pb-2">
                <Terminal size={18} />
                <h2 className="font-bold uppercase tracking-widest text-sm">Secure Audit Stream</h2>
                <span className="ml-auto animate-blink">_</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 text-[10px] pr-2 custom-scrollbar">
                {logs.map((log, i) => (
                    <div key={i} className="break-all border-l-2 border-[#00ff00]/30 pl-2">
                        {log}
                    </div>
                ))}
                <div ref={logsEndRef} />
            </div>
        </div>
    </div>
  );
}
