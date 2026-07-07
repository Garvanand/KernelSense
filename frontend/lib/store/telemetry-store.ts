import { create } from "zustand";

export interface ProcessData {
  pid: number;
  ppid?: number;
  name: string;
  status?: string;
  cpu_percent: number;
  mem_rss_bytes: number;
  mem_vms_bytes?: number;
  num_threads?: number;
  io_read_bytes?: number;
  io_write_bytes?: number;
  create_time?: number;
}

export interface CoreData {
  core_id: number;
  utilization_percent: number;
}

export interface SystemMetricsData {
  cpu_percent: number[];
  cpu_user_percent: number;
  cpu_system_percent: number;
  cpu_idle_percent: number;
  cpu_freq_mhz: number;
  mem_total_bytes: number;
  mem_used_bytes: number;
  mem_percent: number;
  disk_read_bytes: number;
  disk_write_bytes: number;
  net_bytes_sent: number;
  net_bytes_recv: number;
  linux_ebpf_context_switches?: number;
  windows_etw_context_switches?: number;
}

export interface ResourceHistoryPoint {
  timestamp: number;
  cpu_user_percent: number;
  cpu_system_percent: number;
  mem_percent: number;
  disk_read_bytes: number;
  disk_write_bytes: number;
  net_bytes_sent: number;
  net_bytes_recv: number;
}

export interface TelemetryState {
  processes: ProcessData[];
  systemMetrics: SystemMetricsData | null;
  cores: CoreData[];
  contextSwitchRate: number;
  memory: {
    total_bytes: number;
    used_bytes: number;
    percent: number;
  } | null;
  incidents: any[];
  resourceHistory: ResourceHistoryPoint[];
  isConnected: boolean;
  lastUpdate: number;
  
  // DVR
  dvrBuffer: any[];
  activeFrameIndex: number | null;
  
  setTelemetry: (topic: string, data: any) => void;
  setIsConnected: (connected: boolean) => void;
  fetchDVRBuffer: () => Promise<void>;
  setActiveFrame: (index: number | null) => void;
}

const MAX_HISTORY = 200;

export const useTelemetryStore = create<TelemetryState>((set, get) => ({
  processes: [],
  systemMetrics: null,
  cores: [],
  contextSwitchRate: 0,
  memory: null,
  incidents: [],
  resourceHistory: [],
  isConnected: false,
  lastUpdate: 0,
  
  dvrBuffer: [],
  activeFrameIndex: null,

  setTelemetry: (topic, data) => set((state) => {
    if (topic === "telemetry") {
      const sm = data.system_metrics;
      const newPoint: ResourceHistoryPoint | null = sm ? {
        timestamp: data.timestamp || Date.now() / 1000,
        cpu_user_percent: sm.cpu_user_percent || 0,
        cpu_system_percent: sm.cpu_system_percent || 0,
        mem_percent: sm.mem_percent || 0,
        disk_read_bytes: sm.disk_read_bytes || 0,
        disk_write_bytes: sm.disk_write_bytes || 0,
        net_bytes_sent: sm.net_bytes_sent || 0,
        net_bytes_recv: sm.net_bytes_recv || 0,
      } : null;

      const history = newPoint 
        ? [...state.resourceHistory, newPoint].slice(-MAX_HISTORY) 
        : state.resourceHistory;
        
      // Keep adding to DVR buffer in background
      const dvrBuffer = [...state.dvrBuffer, data].slice(-300);

      // If we are in historical mode (DVR), don't update the active view
      if (state.activeFrameIndex !== null) {
         return {
           ...state,
           resourceHistory: history,
           dvrBuffer: dvrBuffer,
         };
      }

      return {
        ...state,
        processes: data.processes || state.processes,
        systemMetrics: sm || state.systemMetrics,
        cores: sm?.cpu_percent 
          ? sm.cpu_percent.map((util: number, i: number) => ({ core_id: i, utilization_percent: util })) 
          : state.cores,
        contextSwitchRate: sm?.linux_ebpf_context_switches || sm?.windows_etw_context_switches || state.contextSwitchRate,
        memory: sm ? {
          total_bytes: sm.mem_total_bytes || 0,
          used_bytes: sm.mem_used_bytes || 0,
          percent: sm.mem_percent || 0,
        } : state.memory,
        resourceHistory: history,
        dvrBuffer: dvrBuffer,
        lastUpdate: Date.now(),
      };
    } else if (topic === "incidents") {
      return { ...state, incidents: data };
    }
    return state;
  }),
  
  setIsConnected: (connected) => set({ isConnected: connected }),
  
  fetchDVRBuffer: async () => {
     try {
        const res = await fetch("http://localhost:8000/api/v1/dvr/history?minutes=5");
        if (res.ok) {
           const data = await res.json();
           set({ dvrBuffer: data });
        }
     } catch (e) {
        console.error("Failed to fetch DVR history", e);
     }
  },
  
  setActiveFrame: (index) => {
     const state = get();
     if (index === null) {
        set({ activeFrameIndex: null });
        return;
     }
     
     if (index >= 0 && index < state.dvrBuffer.length) {
        const frame = state.dvrBuffer[index];
        const sm = frame.system_metrics;
        
        set({
           activeFrameIndex: index,
           processes: frame.processes || [],
           systemMetrics: sm || null,
           cores: sm?.cpu_percent 
             ? sm.cpu_percent.map((util: number, i: number) => ({ core_id: i, utilization_percent: util })) 
             : [],
           contextSwitchRate: sm?.linux_ebpf_context_switches || sm?.windows_etw_context_switches || 0,
           memory: sm ? {
             total_bytes: sm.mem_total_bytes || 0,
             used_bytes: sm.mem_used_bytes || 0,
             percent: sm.mem_percent || 0,
           } : null,
        });
     }
  }
}));
