"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const DONATE = [
  {
    label: "GitHub Sponsors",
    href: "https://github.com/sponsors/4yci",
    color: "#00e676",
    icon: "M12 21s-7-4.35-9.5-8.5C1 9.5 2.5 6 6 6c2 0 3 1 6 4 3-3 4-4 6-4 3.5 0 5 3.5 3.5 6.5C19 16.65 12 21 12 21Z",
  },
] as const;

const FEATURES = [
  ["Live Leaderboards", "Season Elo, best times, and the weekly race."],
  ["Player Analytics", "PB, Pace Rank, splits, Elo history, seed breakdowns."],
  ["Head-to-Head", "Direct record, overlaid Elo, and split deltas."],
  ["Zero-Cycle Reference", "Real coordinates for every End tower."],
] as const;

function Modal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="animate-fadeSlideUp flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-charcoal-400 bg-charcoal-850 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-charcoal-500/60 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-teal/20 text-accent-blue">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2 21 9 12 22 3 9Z" fillOpacity={0.85} />
              </svg>
            </div>
            <div>
              <div className="font-mono text-sm font-bold tracking-[0.2em] text-white">
                MCSR<span className="text-accent-blue">·</span>STATS
              </div>
              <div className="text-[10px] uppercase tracking-widest text-charcoal-300">
                Ranked Intelligence
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg px-2.5 py-1 font-mono text-lg text-charcoal-300 transition-colors duration-300 hover:bg-charcoal-600 hover:text-white"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6 overflow-y-auto px-6 py-5">
          {/* About */}
          <section>
            <p className="text-sm leading-relaxed text-charcoal-300">
              <span className="font-semibold text-white">MCSR Stats</span> is an
              all-in-one dashboard for competitive Minecraft speedrunning — live
              leaderboards, deep player analytics, head-to-head comparisons, and a
              complete zero-cycle coordinate reference, all in one place.
            </p>
          </section>

          {/* Features */}
          <section>
            <div className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-widest text-charcoal-300">
              What&apos;s inside
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {FEATURES.map(([title, desc]) => (
                <div key={title} className="rounded-lg border border-charcoal-500/60 bg-charcoal-900/60 p-3">
                  <div className="text-sm font-semibold text-white">{title}</div>
                  <div className="mt-0.5 text-xs text-charcoal-300">{desc}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Data & credits */}
          <section>
            <div className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-widest text-charcoal-300">
              Data &amp; credits
            </div>
            <ul className="space-y-1.5 text-xs leading-relaxed text-charcoal-300">
              <li className="flex gap-2">
                <span className="text-accent-blue">▸</span>
                Live data from the official{" "}
                <a href="https://mcsrranked.com" target="_blank" rel="noopener noreferrer" className="text-accent-blue hover:underline">
                  MCSR Ranked
                </a>{" "}
                API.
              </li>
              <li className="flex gap-2">
                <span className="text-accent-blue">▸</span>
                Player skins rendered via mc-heads.net.
              </li>
              <li className="flex gap-2">
                <span className="text-accent-blue">▸</span>
                Built with Next.js &amp; TypeScript — charts and the 3D skin are
                hand-built, no heavy libraries.
              </li>
            </ul>
            <p className="mt-3 rounded-lg border border-charcoal-500/60 bg-charcoal-900/60 p-3 text-[11px] leading-relaxed text-charcoal-300">
              Unofficial community project — not affiliated with Mojang, Microsoft,
              or MCSR Ranked. All player data belongs to its respective owners.
            </p>
          </section>

          {/* Donation */}
          <section>
            <div className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-widest text-charcoal-300">
              Support the project
            </div>
            <p className="mb-3 text-xs leading-relaxed text-charcoal-300">
              MCSR Stats is free and ad-free. If it&apos;s useful to you, a small
              tip helps cover the API and hosting costs.
            </p>
            <div className="flex flex-col gap-2">
              {DONATE.map((d) => (
                <a
                  key={d.label}
                  href={d.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-lg border px-3 py-3 text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5"
                  style={{ color: d.color, borderColor: `${d.color}55`, backgroundColor: `${d.color}12` }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d={d.icon} />
                  </svg>
                  {d.label}
                </a>
              ))}
            </div>
          </section>
        </div>

        <div className="border-t border-charcoal-500/60 px-6 py-3 text-center font-mono text-[10px] uppercase tracking-widest text-charcoal-300">
          MCSR Stats · v1.0 · Season data live
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default function InfoButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed right-3 top-2.5 z-30 flex items-center gap-2 rounded-lg border border-charcoal-500/60 bg-charcoal-800/80 px-3.5 py-2 text-sm font-semibold text-charcoal-300 backdrop-blur transition-all duration-300 hover:border-accent-blue/50 hover:text-accent-blue hover:shadow-glow-blue lg:right-6 lg:top-5"
        aria-label="About MCSR Stats"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 16v-4M12 8h.01" />
        </svg>
        Info
      </button>
      {open && <Modal onClose={() => setOpen(false)} />}
    </>
  );
}
