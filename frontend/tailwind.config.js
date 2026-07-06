/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        void: "var(--void)",
        "depth-1": "var(--depth-1)",
        "depth-2": "var(--depth-2)",
        "depth-3": "var(--depth-3)",
        // Subsystem semantic colors
        process: "var(--color-process)",
        memory: "var(--color-memory)",
        scheduler: "var(--color-scheduler)",
        network: "var(--color-network)",
        filesystem: "var(--color-filesystem)",
        ai: "var(--color-ai)",
        kernel: "var(--color-kernel)",
        // Severity
        normal: "var(--severity-normal)",
        elevated: "var(--severity-elevated)",
        warning: "var(--severity-warning)",
        critical: "var(--severity-critical)",
        prediction: "var(--severity-prediction)",
        // Surface
        surface: {
          DEFAULT: "var(--surface)",
          hover: "var(--surface-hover)",
          active: "var(--surface-active)",
          border: "var(--surface-border)",
        },
      },
      fontFamily: {
        sans: ["'Inter'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "'Fira Code'", "monospace"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
      },
      animation: {
        "fade-in": "fade-in 0.5s var(--ease-out-expo)",
        "slide-up": "slide-up 0.5s var(--ease-out-expo)",
        "slide-down": "slide-down 0.5s var(--ease-out-expo)",
        "slide-right": "slide-right 0.4s var(--ease-out-expo)",
        "scale-in": "scale-in 0.3s var(--ease-out-expo)",
        "pulse-subtle": "pulse-subtle 4s ease-in-out infinite",
        "spin-slow": "spin 8s linear infinite",
        "breathe": "breathe 4s ease-in-out infinite",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-down": {
          "0%": { opacity: "0", transform: "translateY(-16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-right": {
          "0%": { opacity: "0", transform: "translateX(-16px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "pulse-subtle": {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.8" },
        },
        "breathe": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.02)" },
        },
      },
      transitionTimingFunction: {
        "out-expo": "var(--ease-out-expo)",
        "in-out-expo": "var(--ease-in-out-expo)",
      },
      borderRadius: {
        "4xl": "2rem",
      },
    },
  },
  plugins: [],
};
