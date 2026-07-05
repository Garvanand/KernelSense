import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Kernel Ring colors
        ring0: { // Red (Kernel/Admin)
          DEFAULT: "var(--ring-0)",
          glow: "var(--ring-0-glow)",
        },
        ring1: { // Orange (Drivers/System)
          DEFAULT: "var(--ring-1)",
          glow: "var(--ring-1-glow)",
        },
        ring2: { // Cyan (Power User)
          DEFAULT: "var(--ring-2)",
          glow: "var(--ring-2-glow)",
        },
        ring3: { // Blue (User/Guest)
          DEFAULT: "var(--ring-3)",
          glow: "var(--ring-3-glow)",
        },
        research: { // Purple (Research Mode)
          DEFAULT: "var(--ring-research)",
          glow: "var(--ring-research-glow)",
        },
        surface: {
          DEFAULT: "var(--surface)",
          hover: "var(--surface-hover)",
          active: "var(--surface-active)",
          border: "var(--surface-border)",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-fira-code)", "monospace"],
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow-pulse": "glow-pulse 3s ease-in-out infinite alternate",
        "slide-up": "slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "fade-in": "fade-in 0.3s ease-out",
      },
      keyframes: {
        "glow-pulse": {
          "0%": { opacity: "0.5", filter: "blur(8px)" },
          "100%": { opacity: "1", filter: "blur(12px)" },
        },
        "slide-up": {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
