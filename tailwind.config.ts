import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      // Every palette entry resolves through a CSS variable, so switching
      // `data-theme` on <html> re-colors the whole app without touching a
      // single component class name. The `<alpha-value>` form keeps Tailwind's
      // opacity modifiers (bg-charcoal-900/50 etc.) working.
      colors: {
        charcoal: {
          950: "rgb(var(--c-950) / <alpha-value>)",
          900: "rgb(var(--c-900) / <alpha-value>)",
          850: "rgb(var(--c-850) / <alpha-value>)",
          800: "rgb(var(--c-800) / <alpha-value>)",
          700: "rgb(var(--c-700) / <alpha-value>)",
          600: "rgb(var(--c-600) / <alpha-value>)",
          500: "rgb(var(--c-500) / <alpha-value>)",
          400: "rgb(var(--c-400) / <alpha-value>)",
          300: "rgb(var(--c-300) / <alpha-value>)",
        },
        accent: {
          blue: "rgb(var(--a-blue) / <alpha-value>)",   // Diamond Blue
          green: "rgb(var(--a-green) / <alpha-value>)", // Emerald Green
          teal: "rgb(var(--a-teal) / <alpha-value>)",   // End Teal
          amber: "rgb(var(--a-amber) / <alpha-value>)",
          red: "rgb(var(--a-red) / <alpha-value>)",
          purple: "rgb(var(--a-purple) / <alpha-value>)",
        },
        // Remapped so `text-white` means "primary foreground" in both themes.
        white: "rgb(var(--fg) / <alpha-value>)",
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
