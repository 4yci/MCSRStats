"use client";

import { useCallback, useEffect, useState } from "react";

/** What the user picked. "system" follows the OS setting live. */
type ThemePref = "dark" | "light" | "system";
export const THEME_KEY = "mcsr:theme";

const ORDER: ThemePref[] = ["dark", "light", "system"];

const LABEL: Record<ThemePref, string> = {
  dark: "Dark",
  light: "Light",
  system: "System",
};

const prefersLight = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-color-scheme: light)").matches;

const resolve = (p: ThemePref) =>
  p === "system" ? (prefersLight() ? "light" : "dark") : p;

export default function ThemeToggle() {
  const [pref, setPref] = useState<ThemePref>("dark");
  const [ready, setReady] = useState(false);

  // Adopt whatever the pre-paint script already decided.
  useEffect(() => {
    const attr = document.documentElement.getAttribute(
      "data-theme-pref",
    ) as ThemePref | null;
    setPref(attr === "light" || attr === "system" ? attr : "dark");
    setReady(true);
  }, []);

  const apply = useCallback((next: ThemePref) => {
    setPref(next);
    const root = document.documentElement;
    root.setAttribute("data-theme-pref", next);
    root.setAttribute("data-theme", resolve(next));
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* private mode — the choice just won't persist */
    }
  }, []);

  // While on "system", track OS changes as they happen.
  useEffect(() => {
    if (pref !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const sync = () =>
      document.documentElement.setAttribute(
        "data-theme",
        mq.matches ? "light" : "dark",
      );
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [pref]);

  const next = ORDER[(ORDER.indexOf(pref) + 1) % ORDER.length];

  return (
    <button
      onClick={() => apply(next)}
      aria-label={`Theme: ${LABEL[pref]}. Switch to ${LABEL[next]}.`}
      title={`Theme: ${LABEL[pref]} — click for ${LABEL[next]}`}
      className="flex h-[38px] w-[38px] items-center justify-center rounded-lg border border-charcoal-500/60 bg-charcoal-800/80 text-charcoal-300 backdrop-blur transition-all duration-300 hover:border-accent-blue/50 hover:text-accent-blue"
    >
      {/* Nothing until mounted, so the icon never contradicts the theme. */}
      {ready && pref === "dark" && (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
        </svg>
      )}
      {ready && pref === "light" && (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      )}
      {ready && pref === "system" && (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2.5" y="4" width="19" height="12.5" rx="2" />
          <path d="M8.5 20.5h7M12 16.5v4" />
        </svg>
      )}
    </button>
  );
}
