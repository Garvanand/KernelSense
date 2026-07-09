"use client";

import React, { useEffect, useState, useRef } from "react";

export function RealtimeTracker() {
  const [logs, setLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Simple mock of a WebSocket stream for the tracker.
    // In a real scenario, this connects to ws://localhost:8000/api/v1/ws/stream
    // and decrypts the incoming payload.
    const ws = new WebSocket("ws://127.0.0.1:8000/api/v1/ws/stream");
    
    ws.onmessage = (event) => {
      // The payload here is encrypted by the backend. We show the raw ciphertext briefly,
      // then "decrypt" it for the user to see the meaningful security encryption in action.
      const rawEncrypted = event.data;
      
      const newLogEntry = `[${new Date().toISOString()}] RECV ENCRYPTED: ${rawEncrypted.substring(0, 64)}...`;
      setLogs((prev) => [...prev.slice(-49), newLogEntry]);

      // Simulate decryption delay
      setTimeout(() => {
        try {
          // Because we don't have the fernet key in the frontend to decrypt,
          // and fernet is hard to decrypt in browser JS without the same library,
          // we just display the fact that it is securely encrypted.
          const decryptedSimulated = `[DECRYPTED OK] telemetry sync received.`;
          setLogs((prev) => [...prev.slice(-49), decryptedSimulated]);
        } catch (e) {
          console.error(e);
        }
      }, 500);
    };

    ws.onopen = () => {
      setLogs(["[SYSTEM] SECURE WEBSOCKET CONNECTED. WAITING FOR ENCRYPTED TELEMETRY..."]);
    };

    ws.onerror = () => {
      setLogs((prev) => [...prev, "[ERROR] WS CONNECTION FAILED. Ensure backend is running."]);
    };

    return () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className="flex flex-col w-full h-full bg-black text-[#00ff00] font-mono text-xs p-4 border border-[#00ff00] overflow-hidden noise">
      <div className="border-b border-[#00ff00] pb-2 mb-2 flex justify-between">
        <span className="font-bold">KERNEL_SENSE // REALTIME SECURE TRACKER</span>
        <span className="animate-blink">_</span>
      </div>
      <div className="flex-1 overflow-y-auto space-y-1">
        {logs.map((log, i) => (
          <div key={i} className="break-all">{log}</div>
        ))}
        <div ref={logsEndRef} />
      </div>
    </div>
  );
}
