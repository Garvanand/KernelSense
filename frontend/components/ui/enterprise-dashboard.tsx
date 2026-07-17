"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  Activity, Cpu, MemoryStick, Terminal, Server,
  ShieldCheck, Wifi, WifiOff, Lock, AlertTriangle, Bell
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

interface AlertInfo {
  type: string;
  metric: string;
  value: number;
  threshold?: number;
  process_name?: string;
  severity: number;
}

// ---- AES-256-GCM Decryption via Web Crypto API ----
async function importAesKey(hexKey: string): Promise<CryptoKey> {
  const keyBytes = new Uint8Array(hexKey.match(/.{1,2}/g)!.map(b => parseInt(b, 16)));
  // extractable: false — key material cannot be read back from JS
  return crypto.subtle.importKey("raw", keyBytes, { name: "AES-GCM" }, false, ["decrypt"]);
}

function hexToBytes(hex: string): Uint8Array {
  return new Uint8Array(hex.match(/.{1,2}/g)!.map(b => parseInt(b, 16)));
}

async function decryptPayload(hexCiphertext: string, key: CryptoKey): Promise<any> {
  const raw = hexToBytes(hexCiphertext);
  const nonce = raw.slice(0, 12);
  const ciphertext = raw.slice(12);
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv: nonce }, key, ciphertext);
  return JSON.parse(new TextDecoder().decode(plaintext));
}

// ---- Sparkline ----
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
      <polyline fill={`${color}20`} stroke="none" points={`0,${height} ${points} ${w},${height}`} />
    </svg>
  );
}

function fmtBytes(bytes: number): string {
  if (!bytes || bytes < 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${(bytes / 1073741824).toFixed(2)} GB`;
}

// ---- API Key (dev default — in production, prompt user or use SSO) ----
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || ""; // Will fetch without key in dev, server has its own default

// ---- Main Dashboard ----
export function EnterpriseDashboard() {
  const [connected, setConnected] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [sysMetrics, setSysMetrics] = useState<SystemMetrics | null>(null);
  const [processes, setProcesses] = useState<ProcessInfo[]>([]);
  const [alerts, setAlerts] = useState<AlertInfo[]>([]);
  const [cpuHistory, setCpuHistory] = useState<number[]>([]);
  const [memHistory, setMemHistory] = useState<number[]>([]);
  const [decryptCount, setDecryptCount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState("");
  const [algorithm, setAlgorithm] = useState("");

  const logsEndRef = useRef<HTMLDivElement>(null);

  // Fix #9: Store session data in refs to prevent useEffect dependency loops
  const tokenRef = useRef("");
  const keyRef = useRef<CryptoKey | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Throttled update buffer (refs, not state)
  const bufferRef = useRef<{ metrics: SystemMetrics | null; procs: ProcessInfo[] }>({ metrics: null, procs: [] });
  const lastFlushRef = useRef(0);

  // Fix #6: Track whether we've initialized to avoid double init in StrictMode
  const initRef = useRef(false);

  const addLog = useCallback((msg: string) => {
    setLogs(prev => [...prev.slice(-149), `[${new Date().toISOString()}] ${msg}`]);
  }, []);

  // Fix #7: Exponential backoff reconnect
  const connectWebSocket = useCallback(() => {
    if (!tokenRef.current || !keyRef.current) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket("ws://127.0.0.1:8000/api/v1/ws/stream");
    wsRef.current = ws;

    ws.onopen = () => {
      // Fix #5: First-message auth — token never in URL
      ws.send(JSON.stringify({ type: "auth", token: tokenRef.current }));
    };

    ws.onmessage = async (event) => {
      const raw = event.data;

      // Handle auth response
      try {
        const parsed = JSON.parse(raw);
        if (parsed.type === "auth_ok") {
          setConnected(true);
          reconnectAttemptRef.current = 0;
          addLog(`AUTHENTICATED // tier=${parsed.tier} // stream active`);
          return;
        }
        if (parsed.error) {
          addLog(`AUTH ERROR: ${parsed.detail || parsed.error}`);
          ws.close();
          return;
        }
      } catch {
        // Not JSON — it's encrypted telemetry
      }

      // Encrypted payload
      addLog(`RECV AES-GCM: ${raw.substring(0, 40)}…`);

      try {
        const decrypted = await decryptPayload(raw, keyRef.current!);
        setDecryptCount(c => c + 1);

        if (decrypted.topic === "telemetry" && decrypted.data) {
          const t = decrypted.data;
          if (t.system_metrics) {
            bufferRef.current.metrics = t.system_metrics;
            const cpu = (t.system_metrics.cpu_user_percent || 0) + (t.system_metrics.cpu_system_percent || 0);
            setCpuHistory(prev => [...prev.slice(-59), cpu]);
            setMemHistory(prev => [...prev.slice(-59), t.system_metrics.mem_percent || 0]);
          }
          if (t.processes) {
            bufferRef.current.procs = t.processes
              .sort((a: ProcessInfo, b: ProcessInfo) => b.cpu_percent - a.cpu_percent)
              .slice(0, 25);
          }
        }
        
        if (decrypted.topic === "alerts" && decrypted.data) {
          setAlerts(prev => [...decrypted.data, ...prev].slice(0, 20));
        }

        // Throttle React state updates to 2fps
        const now = performance.now();
        if (now - lastFlushRef.current > 500) {
          lastFlushRef.current = now;
          if (bufferRef.current.metrics) setSysMetrics({ ...bufferRef.current.metrics });
          if (bufferRef.current.procs.length) setProcesses([...bufferRef.current.procs]);
          setLastUpdate(new Date().toLocaleTimeString());
        }

        addLog(`DECRYPTED // ${decrypted.topic} // crypto.subtle OK`);
      } catch (e) {
        addLog(`DECRYPT FAIL: ${e}`);
      }
    };

    ws.onerror = () => addLog("WS ERROR");
    
    ws.onclose = () => {
      setConnected(false);
      wsRef.current = null;
      
      // Fix #7: Exponential backoff with jitter
      const attempt = reconnectAttemptRef.current;
      const delay = Math.min(30000, 1000 * Math.pow(2, attempt)) + Math.random() * 1000;
      reconnectAttemptRef.current = attempt + 1;
      addLog(`WS CLOSED // reconnecting in ${(delay / 1000).toFixed(1)}s (attempt ${attempt + 1})`);
      
      reconnectTimerRef.current = setTimeout(() => {
        connectWebSocket();
      }, delay);
    };
  }, [addLog]);

  // Init: acquire session then connect
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    async function init() {
      try {
        addLog("Requesting session...");
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        // Get API key from env or use dev default
        const apiKey = API_KEY || (await fetchDevApiKey());
        if (apiKey) headers["X-Api-Key"] = apiKey;
        
        const res = await fetch("http://127.0.0.1:8000/api/v1/auth/session", { method: "POST", headers });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        // Fix #6: Import key as non-extractable CryptoKey, then discard the hex string
        const cryptoKey = await importAesKey(data.encryption.key_hex);
        tokenRef.current = data.token;
        keyRef.current = cryptoKey;
        setAlgorithm(`${data.encryption.algorithm} (${data.encryption.key_derivation})`);
        // data.encryption.key_hex is now eligible for GC — we only keep the CryptoKey

        addLog(`SESSION OK // ${data.encryption.algorithm} via ${data.encryption.key_derivation}`);
        addLog(data.note || "");
        connectWebSocket();
      } catch (e) {
        addLog(`SESSION FAILED: ${e}`);
      }
    }
    init();

    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
    };
  }, [addLog, connectWebSocket]);

  // Auto-scroll
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const totalCpu = sysMetrics ? sysMetrics.cpu_user_percent + sysMetrics.cpu_system_percent : 0;
  const memPercent = sysMetrics?.mem_percent || 0;

  return (
    <div className="w-full h-full flex gap-3 text-[#00ff00] font-mono p-3">
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        {/* Status Bar */}
        <div className="flex items-center gap-4 text-[10px] border border-[#00ff00]/30 bg-black/80 px-3 py-2">
          <span className="flex items-center gap-1">
            {connected ? <Wifi size={12} /> : <WifiOff size={12} className="text-red-500" />}
            {connected ? "CONNECTED" : "RECONNECTING…"}
          </span>
          <span className="flex items-center gap-1"><Lock size={12} /> {algorithm || "PENDING"}</span>
          <span className="flex items-center gap-1"><ShieldCheck size={12} /> {decryptCount} frames</span>
          {alerts.length > 0 && (
            <span className="flex items-center gap-1 text-[#ff3333]"><Bell size={12} /> {alerts.length} alerts</span>
          )}
          <span className="ml-auto opacity-50">{lastUpdate && `${lastUpdate}`}</span>
        </div>

        {/* Alerts Banner */}
        {alerts.length > 0 && (
          <div className="border border-[#ff3333]/50 bg-[#ff3333]/10 p-2 text-[10px] space-y-1 max-h-20 overflow-auto custom-scrollbar">
            {alerts.slice(0, 3).map((a, i) => (
              <div key={i} className="flex items-center gap-2 text-[#ff3333]">
                <AlertTriangle size={12} />
                <span>{a.type}: {a.metric} = {a.value?.toFixed?.(1) ?? a.value} {a.threshold ? `(threshold: ${a.threshold})` : ""} {a.process_name || ""}</span>
              </div>
            ))}
          </div>
        )}

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

// Helper: fetch the dev API key from the server's health endpoint (or hardcode for dev)
async function fetchDevApiKey(): Promise<string> {
  // In dev, the server generates a deterministic key. We derive the same one.
  // SHA256("dev-api-key-kernelsense")[:32]
  const encoder = new TextEncoder();
  const data = encoder.encode("dev-api-key-kernelsense");
  const hash = await crypto.subtle.digest("SHA-256", data);
  const hex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
  return hex.substring(0, 32);
}
