"use client";

import React, { useEffect, useRef } from "react";
import { useTelemetryStore } from "@/lib/store/telemetry-store";
import { useAccessLevel } from "@/lib/store/access-level";

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const wsRef = useRef<WebSocket | null>(null);
  const setTelemetry = useTelemetryStore((s) => s.setTelemetry);
  const setIsConnected = useTelemetryStore((s) => s.setIsConnected);
  const { level } = useAccessLevel();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    let ws: WebSocket;
    
    const connect = () => {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = process.env.NEXT_PUBLIC_API_URL?.replace("http://", "").replace("https://", "") || "localhost:8000/api/v1";
      const wsUrl = `${protocol}//${host}/ws/stream`;
      
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        console.log("WebSocket connected");
        // Optionally send auth/clearance level
        ws.send(JSON.stringify({ type: "auth", level }));
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.topic && message.data) {
            setTelemetry(message.topic, message.data);
          }
        } catch (e) {
          console.error("Failed to parse WS message", e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        console.log("WebSocket disconnected, reconnecting in 2s...");
        reconnectTimeoutRef.current = setTimeout(connect, 2000);
      };

      ws.onerror = (error) => {
        console.error("WebSocket error", error);
        ws.close();
      };
    };

    connect();

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (ws) ws.close();
    };
  }, [setTelemetry, setIsConnected, level]);

  return <>{children}</>;
}
