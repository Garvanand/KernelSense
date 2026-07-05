# Contributing to KernelSense

We welcome contributions to KernelSense! Whether you're optimizing an eBPF probe or tweaking the glassmorphism CSS, here is how you can help.

## Development Setup

1. **Clone and Install**: Follow the instructions in the [README](./README.md) to set up both the Python backend and Next.js frontend.
2. **Database**: By default, KernelSense uses SQLite for ease of development. If you are touching heavy SQL aggregations, please test against PostgreSQL (you can override via `DATABASE_URL`).

## Architecture Overview

Please read the **[Developer Guide](./docs/DEVELOPER_GUIDE.md)** to understand how the decoupled background workers operate before submitting a Pull Request. **Crucially**: Never block the `TelemetryIngestWorker` with synchronous code.

## Submitting a Pull Request

1. **Create a Feature Branch**: Branch off `main` (e.g., `feature/ebpf-networking`).
2. **Write Tests**: If you are adding a new OS hook, write a unit test that utilizes a mocked data generator (see [TESTING.md](./docs/TESTING.md)). Do not write tests that require `sudo` or `CAP_SYS_ADMIN` in CI.
3. **Run Typecheck**: In `frontend/`, run `npm run build` or `npx tsc --noEmit` to ensure TypeScript compliance.
4. **Submit PR**: Provide a clear description of the problem solved. If it impacts the UI, please attach a screenshot.

## Code Style
- **Backend (Python)**: We follow standard PEP-8. Use `black` and `isort` for formatting.
- **Frontend (TSX)**: Use `prettier` and adhere to the ESLint rules defined in `package.json`. Use Tailwind utility classes directly in the JSX rather than creating new CSS variables unless absolutely necessary for the Glassmorphism tokens.
