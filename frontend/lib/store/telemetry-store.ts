import { create } from "zustand";

export interface TelemetryState {
  processes: any[];
  memory: any | null;
  scheduler: any | null;
  incidents: any[];
  isConnected: boolean;
  setTelemetry: (topic: string, data: any) => void;
  setIsConnected: (connected: boolean) => void;
}

export const useTelemetryStore = create<TelemetryState>((set) => ({
  processes: [],
  memory: null,
  scheduler: null,
  incidents: [],
  isConnected: false,
  setTelemetry: (topic, data) => set((state) => {
    if (topic === "telemetry") {
      // Unpack telemetry payload
      return {
        ...state,
        processes: data.processes || state.processes,
        memory: data.system_metrics ? { 
            composition: {
                total_bytes: data.system_metrics.mem_total_bytes,
                used_bytes: data.system_metrics.mem_used_bytes,
                percent: data.system_metrics.mem_percent
            } 
        } : state.memory,
        scheduler: data.system_metrics ? {
            context_switch_rate: data.system_metrics.linux_ebpf_context_switches || 0,
            run_queue_latency_ms: 0,
            cores: Array.from({length: 16}, (_, i) => ({ core_id: i, utilization_percent: data.system_metrics.cpu_user_percent / 16 }))
        } : state.scheduler
      };
    } else if (topic === "incidents") {
      return { ...state, incidents: data };
    }
    return state;
  }),
  setIsConnected: (connected) => set({ isConnected: connected }),
}));
