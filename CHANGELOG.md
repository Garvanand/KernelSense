# KernelSense Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2026-07-06
### Added
- **Final Polish**: Performance optimizations to Next.js dynamic rendering and FastAPI in-memory caching to prevent database locks.
- **End-to-End Tests**: Pytest pipelines for testing the AI evaluation engine without requiring heavy SQL inserts.

## [0.9.0] - 2026-07-05
### Added
- **Incident Engine**: Asynchronous ML worker that processes raw `Prediction` tables into escalated `Incident` reports.
- **Bounded LLM**: Integrated strict, JSON-schema validated root-cause explanations using an abstracted LLM interface with aggressive local caching.

## [0.8.0] - 2026-07-04
### Added
- **Scheduler Engine**: Built a 16-core CPU heatmap and aggregated context-switch event stream for the Next.js frontend.
- **Memory Intelligence**: D3.js leak charts visualizing PyTorch monotonic growth predictions.

## [0.7.0] - 2026-07-03
### Added
- **Zero-Trust Access API**: Middleware enforcing Guest, Power User, Kernel, and Research clearance levels for API endpoints.
- **AI Models**: Integrated the core PyTorch logic (LSTM forecasting and GNN process graphs).

## [0.5.0] - 2026-07-02
### Added
- **FastAPI Foundation**: SQLAlchemy 2.0 async integration with Timescale-style schema definitions.
- **Telemetry Ingest Worker**: Base `psutil` ingestion script capturing processes, CPU, memory, and IO at 1Hz.

## [0.1.0] - 2026-07-01
### Added
- Initial project scaffolding and Architecture Decision Records (ADRs).
