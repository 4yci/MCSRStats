import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        charcoal: {
          950: "#08080a",
          900: "#0c0c0f",
          850: "#101014",
          800: "#121212",
          700: "#17171c",
          600: "#1d1d24",
          500: "#26262f",
          400: "#33333e",
          300: "#4a4a58",
        },
        accent: {
          blue: "#00e5ff",   // Diamond Blue — top ranks
          green: "#00e676",  // Emerald Green — PBs / wins
          teal: "#008080",   // End Teal
          amber: "#ffc400",
          red: "#ff5252",
          purple: "#b388ff",
        },
      },
      fontFamily: {
        mono: [
          "JetBrains Mono",
          "SFMono-Regular",
          "Menlo",
          "Consolas",
          "monospace",
        ],
      },
      boxShadow: {
        "glow-blue": "0 0 18px -2px rgba(0,229,255,0.45)",
        "glow-green": "0 0 18px -2px rgba(0,230,118,0.45)",
        "glow-red": "0 0 18px -2px rgba(255,82,82,0.45)",
        "inner-edge": "inset 0 1px 0 0 rgba(255,255,255,0.04)",
      },
      keyframes: {
        pulseBeat: {
          "0%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.12)", opacity: "0.85" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        fadeSlideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        pulseBeat: "pulseBeat 0.18s ease-out",
        fadeSlideUp: "fadeSlideUp 0.3s ease-out both",
      },
    },
  },
  plugins: [],
};
export default config;
