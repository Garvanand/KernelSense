# Telemetry Collection Performance

- **Platform**: Windows
- **Average collection latency**: 13839.87ms
- **Estimated CPU Overhead (1Hz)**: 1383.99%
- **Status**: FAIL (Exceeds budget)

## Deep OS Telemetry Collection (Prompt 9)
- **Platform**: Windows
- **Average latency (with deep fields)**: 49456.11ms
- **Estimated CPU Overhead (1Hz)**: 4945.61%
- **Note**: Polling deep fields (open files, sockets) drastically increases latency, proving the necessity of the access-level model to restrict this to POWER/RESEARCH tiers.

## Database Ingest Soak Test (Prompt 8)
- **Simulated Throughput**: 5.0 samples/sec
- **Buffer Flush Size**: 10 samples
- **Memory Growth (Leaks)**: 13.77 MB
- **Status**: FAIL (Memory Leak Detected)
