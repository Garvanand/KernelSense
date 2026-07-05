export const DEMO_INCIDENTS = [
  {
    id: 99991,
    timestamp: Date.now(),
    entity_type: "process",
    entity_id: "PID: 4211",
    incident_type: "leak_anomaly",
    severity_score: 0.98,
    explanation: {
      diagnostic: "Multiple rogue Python processes are monopolizing heap space with rapid monotonic growth, likely due to an unreferenced array expansion loop in a data pipeline.",
      recommended_action: "Restart the offending python workers (PIDs 4211, 4212) or apply a strict memory cgroup limit to prevent kernel OOM-killer invocation."
    }
  },
  {
    id: 99992,
    timestamp: Date.now() - 60000,
    entity_type: "system",
    entity_id: "core_0",
    incident_type: "scheduler_contention",
    severity_score: 0.89,
    explanation: {
      diagnostic: "A Postgres writer process (PID 1400) is holding an exclusive IPC lock, causing a cascading run-queue blockage for 3 reader threads.",
      recommended_action: "Investigate the Postgres writer query for long-running transactions and consider terminating PID 1400 if the lock is stalled."
    }
  }
];

export const DEMO_PROCESSES = [
  { pid: 1, name: "systemd", cpu_percent: 0.1, memory_rss: 12000000 },
  { pid: 1400, name: "postgres", cpu_percent: 4.5, memory_rss: 800000000 },
  { pid: 1410, name: "postgres", cpu_percent: 0.0, memory_rss: 40000000 },
  { pid: 4211, name: "python", cpu_percent: 98.5, memory_rss: 4200000000 },
  { pid: 4212, name: "python", cpu_percent: 97.2, memory_rss: 3800000000 },
];
