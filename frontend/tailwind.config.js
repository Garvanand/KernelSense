/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        void: "#000000",
        "depth-1": "#050505",
        "depth-2": "#0a0a0a",
        "depth-3": "#111111",
        // Subsystem semantic colors - all stark terminal green/cyan
        process: "#00ff00",
        memory: "#00cc00",
        scheduler: "#33ff33",
        network: "#00ffcc",
        filesystem: "#00cccc",
        ai: "#0099ff",
        kernel: "#ff0033",
        // Severity
        normal: "#00ff00",
        elevated: "#ffff00",
        warning: "#ff9900",
        critical: "#ff0000",
        prediction: "#00ffff",
        // Surface
        surface: {
          DEFAULT: "rgba(0, 255, 0, 0.05)",
          hover: "rgba(0, 255, 0, 0.1)",
          active: "rgba(0, 255, 0, 0.2)",
          border: "rgba(0, 255, 0, 0.4)",
        },
      },
      fontFamily: {
        sans: ["'JetBrains Mono'", "monospace"], // Force monospace
        mono: ["'JetBrains Mono'", "monospace"],
      },
      animation: {
        "fade-in": "fade-in 0.1s linear",
        "blink": "blink 1s step-end infinite",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "blink": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
      },
    },
  },
  plugins: [],
};
