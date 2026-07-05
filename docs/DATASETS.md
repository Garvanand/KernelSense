# KernelSense Pretraining Datasets

> **IMPORTANT**: The primary source of data for KernelSense in production is **live, localized personal telemetry** collected from the user's own machine. The datasets listed here are exclusively for offline pretraining and bootstrapping the AI models (forecasting, anomaly detection) before they are fine-tuned on the user's specific system.

This document serves as the provenance record for all public corpora used during the pretraining phase.

## 1. LTTng Reference Traces
- **Source**: [lttng/lttng-ref-traces (GitHub)](https://github.com/lttng/lttng-ref-traces)
- **License**: MIT License
- **Purpose**: Trace format familiarity, scheduler modeling, and basic synthetic process behavior testing.
- **Refresh Cadence**: Static / Infrequent (Updated per LTTng release).
- **Format**: Common Trace Format (CTF).
- **Status**: Verified & Downloaded.

## 2. Kernel Function Time Measurement Dataset
- **Source**: [Zenodo Record 14679675](https://zenodo.org/records/14679675)
- **License**: CC BY 4.0
- **Purpose**: Establishing baselines for kernel function execution times (e.g., system calls like `getdents`) for anomaly detection.
- **Refresh Cadence**: Static (Academic release).
- **Format**: CSV.
- **Status**: Verified & Downloaded.

## 3. Google Cluster Traces (2019)
- **Source**: [Google Cluster Data (GitHub/BigQuery)](https://github.com/google/cluster-data)
- **License**: CC BY 4.0
- **Purpose**: Pretraining the LSTM forecasting models on real-world resource saturation and job scheduling dynamics.
- **Refresh Cadence**: Static (Released 2019).
- **Format**: BigQuery Tables / CSV schemas.
- **Status**: Validated schema. Full dataset requires BigQuery authentication.

## 4. Alibaba Cluster Trace (2018)
- **Source**: [alibaba/clusterdata (GitHub)](https://github.com/alibaba/clusterdata)
- **License**: Apache 2.0 (as specified in specific version repositories) / CC0.
- **Purpose**: Multi-resource contention and Graph Neural Network (GNN) task dependency pretraining.
- **Refresh Cadence**: Static.
- **Format**: CSV.
- **Status**: Validated license. Full dataset requires external storage access.

## Local Samples
Small, verified samples of the LTTng and Zenodo datasets have been downloaded via `scripts/download_pretraining_datasets.py` and are stored locally in `backend/tests/fixtures/pretraining/` to ensure the AI pipeline has immediate mock data to test against without fetching terabytes of remote data.
