"use client";

import { useEffect, useState } from "react";

type Theme = "dark" | "light";
export const THEME_KEY = "mcsr:theme";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [ready, setReady] = useState(false);

  // Adopt whatever the pre-paint script already applied to <html>.
  useEffect(() => {
    const current =
      (document.documentElement.getAttribute("data-theme") as Theme | null) ??
      "dark";
    setTheme(current);
    setReady(true);
  }, []);

  const apply = (next: Theme) => {
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* private mode — theme just won't persist */
    }
  };

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => apply(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Light theme" : "Dark theme"}
      className="flex h-[38px] w-[38px] items-center justify-center rounded-lg border border-charcoal-500/60 bg-charcoal-800/80 text-charcoal-300 backdrop-blur transition-all duration-300 hover:border-accent-blue/50 hover:text-accent-blue"
    >
      {/* Render nothing until mounted so the icon never contradicts the theme */}
      {ready &&
        (isDark ? (
          // Moon — currently dark, click for light
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
          </svg>
        ) : (
          // Sun — currently light, click for dark
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </svg>
        ))}
    </button>
  );
}
