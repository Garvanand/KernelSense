"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  Activity, Cpu, MemoryStick, Terminal, Server,
  ShieldCheck, Clock, Wifi, WifiOff, Lock
} from "lucide-react";

// ---- Types ----
interface SystemMetrics {
  cpu_user_percent: number;
  cpu_system_percent: number;
  cpu_idle_percent: number;
  mem_total_bytes: number;
  mem_used_bytes: number;
  mem_percent: number;
  net_bytes_sent: number;
  net_bytes_recv: number;
}

interface ProcessInfo {
  pid: number;
  name: string;
  cpu_percent: number;
  mem_rss_bytes: number;
  status: string;
}

interface SessionInfo {
  token: string;
  key: CryptoKey | null;
  algorithm: string;
}

// ---- AES-256-GCM Decryption via Web Crypto API ----
async function importAesKey(hexKey: string): Promise<CryptoKey> {
  const keyBytes = new Uint8Array(hexKey.match(/.{1,2}/g)!.map(b => parseInt(b, 16)));
  return crypto.subtle.importKey("raw", keyBytes, { name: "AES-GCM" }, false, ["decrypt"]);
}

function hexToBytes(hex: string): Uint8Array {
  return new Uint8Array(hex.match(/.{1,2}/g)!.map(b => parseInt(b, 16)));
}

async function decryptPayload(hexCiphertext: string, key: CryptoKey): Promise<any> {
  const raw = hexToBytes(hexCiphertext);
  const nonce = raw.slice(0, 12);     // 12-byte nonce
  const ciphertext = raw.slice(12);    // rest is ciphertext + GCM tag
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: nonce },
    key,
    ciphertext
  );
  const decoded = new TextDecoder().decode(plaintext);
  return JSON.parse(decoded);
}

// ---- Sparkline Component ----
function Sparkline({ data, color = "#00ff00", height = 40 }: { data: number[]; color?: string; height?: number }) {
  if (data.length < 2) return <div style={{ height }} />;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 300;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = height - ((v - min) / range) * (height - 4);
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" preserveAspectRatio="none">
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={points} />
      <polyline fill={`${color}20`} stroke="none"
        points={`0,${height} ${points} ${w},${height}`} />
    </svg>
  );
}

// ---- Format bytes ----
function fmtBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${(bytes / 1073741824).toFixed(2)} GB`;
}

// ---- Main Dashboard ----
export function EnterpriseDashboard() {
  const [session, setSession] = useState<SessionInfo>({ token: "", key: null, algorithm: "" });
  const [connected, setConnected] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [sysMetrics, setSysMetrics] = useState<SystemMetrics | null>(null);
  const [processes, setProcesses] = useState<ProcessInfo[]>([]);
  const [cpuHistory, setCpuHistory] = useState<number[]>([]);
  const [memHistory, setMemHistory] = useState<number[]>([]);
  const [decryptCount, setDecryptCount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<string>("");

  const logsEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Throttled update buffer
  const bufferRef = useRef<{ metrics: SystemMetrics | null; procs: ProcessInfo[] }>({ metrics: null, procs: [] });
  const rafRef = useRef<number>(0);
  const lastFlushRef = useRef<number>(0);

  const addLog = useCallback((msg: string) => {
    setLogs(prev => [...prev.slice(-149), `[${new Date().toISOString()}] ${msg}`]);
  }, []);

  // Phase 1: Acquire session (token + AES key)
  useEffect(() => {
    async function initSession() {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/v1/auth/session", { method: "POST" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const cryptoKey = await importAesKey(data.encryption.key_hex);
        setSession({ token: data.token, key: cryptoKey, algorithm: data.encryption.algorithm });
        addLog(`SESSION ESTABLISHED // ${data.encryption.algorithm} key loaded into Web Crypto API`);
      } catch (e) {
        addLog(`SESSION FAILED: ${e}. Running in offline mode.`);
      }
    }
    initSession();
  }, [addLog]);

  // Phase 2: Connect WebSocket with token auth
  useEffect(() => {
    if (!session.token || !session.key) return;

    const ws = new WebSocket(`ws://127.0.0.1:8000/api/v1/ws/stream?token=${encodeURIComponent(session.token)}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      addLog("SECURE WEBSOCKET AUTHENTICATED // Encrypted telemetry stream active");
    };

    ws.onmessage = async (event) => {
      const hexCiphertext = event.data;

      // Show real ciphertext prefix in audit log
      addLog(`RECV AES-GCM CIPHERTEXT: ${hexCiphertext.substring(0, 48)}…`);

      try {
        // REAL decryption using Web Crypto API
        const decrypted = await decryptPayload(hexCiphertext, session.key!);
        setDecryptCount(c => c + 1);
        
        const telemetry = decrypted.data;
        if (telemetry && telemetry.system_metrics) {
          const m = telemetry.system_metrics;
          bufferRef.current.metrics = m;
          
          const totalCpu = (m.cpu_user_percent || 0) + (m.cpu_system_percent || 0);
          setCpuHistory(prev => [...prev.slice(-59), totalCpu]);
          setMemHistory(prev => [...prev.slice(-59), m.mem_percent || 0]);
        }
        if (telemetry && telemetry.processes) {
          bufferRef.current.procs = telemetry.processes
            .sort((a: ProcessInfo, b: ProcessInfo) => b.cpu_percent - a.cpu_percent)
            .slice(0, 25);
        }
        
        // Throttle: flush buffer to React state max 2x/sec
        const now = performance.now();
        if (now - lastFlushRef.current > 500) {
          lastFlushRef.current = now;
          if (bufferRef.current.metrics) setSysMetrics({ ...bufferRef.current.metrics });
          if (bufferRef.current.procs.length) setProcesses([...bufferRef.current.procs]);
          setLastUpdate(new Date().toLocaleTimeString());
        }

        addLog(`DECRYPTED OK // ${telemetry?.processes?.length || 0} processes, crypto.subtle.decrypt verified`);
      } catch (e) {
        addLog(`DECRYPTION FAILED: ${e}`);
      }
    };

    ws.onerror = () => {
      addLog("WS CONNECTION ERROR");
      setConnected(false);
    };
    ws.onclose = () => {
      setConnected(false);
      addLog("WS DISCONNECTED");
    };

    return () => { ws.close(); };
  }, [session, addLog]);

  // Auto-scroll audit log
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const totalCpu = sysMetrics ? (sysMetrics.cpu_user_percent + sysMetrics.cpu_system_percent) : 0;
  const memPercent = sysMetrics?.mem_percent || 0;

  return (
    <div className="w-full h-full flex gap-3 text-[#00ff00] font-mono p-3">
      {/* LEFT: Metrics + Processes */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">

        {/* Status Bar */}
        <div className="flex items-center gap-4 text-[10px] border border-[#00ff00]/30 bg-black/80 px-3 py-2">
          <span className="flex items-center gap-1">
            {connected ? <Wifi size={12} /> : <WifiOff size={12} className="text-red-500" />}
            {connected ? "CONNECTED" : "OFFLINE"}
          </span>
          <span className="flex items-center gap-1"><Lock size={12} /> {session.algorithm || "PENDING"}</span>
          <span className="flex items-center gap-1"><ShieldCheck size={12} /> {decryptCount} frames decrypted</span>
          <span className="ml-auto opacity-50">{lastUpdate && `Last: ${lastUpdate}`}</span>
        </div>

        {/* System Resources */}
        <div className="border border-[#00ff00]/40 bg-black/80 p-4">
          <div className="flex items-center gap-2 mb-3 border-b border-[#00ff00]/30 pb-2">
            <Server size={16} />
            <h2 className="font-bold uppercase tracking-widest text-xs">Host Resource Utilization</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="flex items-center gap-1"><Cpu size={12} /> CPU</span>
                <span>{totalCpu.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-[#00ff00]/10 h-2 mb-2">
                <div className="h-full transition-all duration-500"
                  style={{ width: `${Math.min(totalCpu, 100)}%`, backgroundColor: totalCpu > 80 ? "#ff3333" : totalCpu > 50 ? "#ffaa00" : "#00ff00" }} />
              </div>
              <Sparkline data={cpuHistory} color={totalCpu > 80 ? "#ff3333" : "#00ff00"} />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="flex items-center gap-1"><MemoryStick size={12} /> Memory</span>
                <span>{memPercent.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-[#00ff00]/10 h-2 mb-2">
                <div className="h-full transition-all duration-500"
                  style={{ width: `${Math.min(memPercent, 100)}%`, backgroundColor: memPercent > 85 ? "#ff3333" : memPercent > 60 ? "#ffaa00" : "#00ff00" }} />
              </div>
              <Sparkline data={memHistory} color={memPercent > 85 ? "#ff3333" : "#00ff00"} />
            </div>
          </div>
          {sysMetrics && (
            <div className="grid grid-cols-4 gap-3 mt-3 text-[10px] border-t border-[#00ff00]/20 pt-2">
              <div>NET TX: {fmtBytes(sysMetrics.net_bytes_sent)}</div>
              <div>NET RX: {fmtBytes(sysMetrics.net_bytes_recv)}</div>
              <div>MEM USED: {fmtBytes(sysMetrics.mem_used_bytes)}</div>
              <div>MEM TOTAL: {fmtBytes(sysMetrics.mem_total_bytes)}</div>
            </div>
          )}
        </div>

        {/* Process Table */}
        <div className="flex-1 border border-[#00ff00]/40 bg-black/80 p-4 flex flex-col min-h-0">
          <div className="flex items-center gap-2 mb-3 border-b border-[#00ff00]/30 pb-2">
            <Activity size={16} />
            <h2 className="font-bold uppercase tracking-widest text-xs">Active Process Monitor</h2>
            <span className="ml-auto text-[10px] opacity-50">{processes.length} processes</span>
          </div>
          <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-black text-[#00ff00]/60 uppercase text-[10px]">
                <tr>
                  <th className="pb-2 pr-2">PID</th>
                  <th className="pb-2">Image</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2 text-right">CPU %</th>
                  <th className="pb-2 text-right">RSS</th>
                </tr>
              </thead>
              <tbody>
                {processes.map(p => (
                  <tr key={p.pid} className="border-b border-[#00ff00]/10 hover:bg-[#00ff00]/5">
                    <td className="py-1.5 pr-2 text-[#00ff00]/70">{p.pid}</td>
                    <td className="py-1.5">{p.name}</td>
                    <td className="py-1.5 text-[10px]">{p.status}</td>
                    <td className="py-1.5 text-right" style={{ color: p.cpu_percent > 50 ? "#ff3333" : p.cpu_percent > 20 ? "#ffaa00" : "#00ff00" }}>
                      {p.cpu_percent.toFixed(1)}
                    </td>
                    <td className="py-1.5 text-right text-[#00ff00]/70">{fmtBytes(p.mem_rss_bytes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* RIGHT: Audit Stream */}
      <div className="w-[350px] border border-[#00ff00]/40 bg-black/80 p-4 flex flex-col">
        <div className="flex items-center gap-2 mb-3 border-b border-[#00ff00]/30 pb-2">
          <Terminal size={16} />
          <h2 className="font-bold uppercase tracking-widest text-xs">Secure Audit Stream</h2>
          <span className="ml-auto animate-blink text-[#00ff00]">●</span>
        </div>
        <div className="flex-1 overflow-y-auto space-y-1 text-[9px] pr-1 custom-scrollbar leading-relaxed">
          {logs.map((log, i) => (
            <div key={i} className="break-all border-l-2 border-[#00ff00]/20 pl-2 py-0.5 hover:bg-[#00ff00]/5">
              {log}
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  );
}
