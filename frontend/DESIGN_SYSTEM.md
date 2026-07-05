# KernelSense Design System

## Core Aesthetic: Dark Glassmorphism & The Kernel Rings

KernelSense visualizes deeply technical operating system metrics. The aesthetic is designed to feel highly advanced, performant, and "close to the metal". We achieve this through a dark mode base heavily leaning on **Glassmorphism**, colored by a strict **Kernel Ring** hierarchy.

### 1. The Kernel Ring Hierarchy (Colors)

We map the CPU protection rings directly to semantic colors. These colors govern badges, buttons, borders, and glowing accents based on the selected access level.

- **Ring 3 (User / Guest)**: Blue (`#3B82F6`) — Safe, standard user space.
- **Ring 2 (Power User)**: Cyan (`#06B6D4`) — Elevated, broader visibility.
- **Ring 1 (Drivers / System)**: Orange (`#F97316`) — System services, hardware interaction.
- **Ring 0 (Kernel / Admin)**: Red (`#EF4444`) — Unrestricted, absolute power.
- **Research Mode**: Purple (`#8B5CF6`) — AI insights, telemetry dumps.

### 2. Glassmorphism Recipe

We avoid flat, opaque components. Cards, panels, and dropdowns should feel like frosted glass layered over a dark background.

**The Recipe (Tailwind Utilities):**
- **Background**: `bg-black/40` or `bg-slate-900/40` (translucent).
- **Backdrop Blur**: `backdrop-blur-xl` or `backdrop-blur-md`.
- **Borders**: 1px subtle borders `border border-white/10` to define edges.
- **Inner Shadow/Glow**: `shadow-inner shadow-white/5`.

*Example Card*: 
```html
<div class="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
  Content
</div>
```

### 3. Typography

- **Sans Serif (Inter)**: Clean, highly legible UI text. Used for all general text, buttons, and headers.
- **Monospace (Fira Code or JetBrains Mono)**: Used exclusively for data points, PIDs, raw telemetry, and JSON outputs to reinforce the technical nature of the app.

### 4. Motion & Micro-animations

- **State Changes**: Smooth `ease-in-out` transitions (150-300ms).
- **Hover States**: Slight upward translation (`-translate-y-1`) with an increased glow/shadow effect.
- **Loading/Waiting**: Slow, deliberate pulses (`animate-pulse-slow`) instead of frantic spinners.

### 5. Access Level Selector (The "Login")

Because KernelSense runs locally, we don't have traditional Auth. The "Login" is an Access Level Selector.
When a user selects an access level, the UI globally shifts its glowing accents to match the Ring Color. (e.g., Selecting Ring 0 makes the active elements glow Red).
