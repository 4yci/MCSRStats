"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  sub: string;
  icon: JSX.Element;
}

const iconProps = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const NAV: NavItem[] = [
  {
    href: "/",
    label: "Leaderboards",
    sub: "Global rankings",
    icon: (
      <svg {...iconProps}>
        <path d="M8 21h8M12 17v4M7 4h10v6a5 5 0 0 1-10 0V4Z" />
        <path d="M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3" />
      </svg>
    ),
  },
  {
    href: "/analytics",
    label: "Player Analytics",
    sub: "Splits & pacing",
    icon: (
      <svg {...iconProps}>
        <path d="M4 20V10M10 20V4M16 20v-7M21 20H3" />
      </svg>
    ),
  },
  {
    href: "/compare",
    label: "Head-to-Head",
    sub: "Compare two runners",
    icon: (
      <svg {...iconProps}>
        <path d="M12 3v18M5 8l-3 4 3 4M19 8l3 4-3 4M8 12H2M22 12h-6" />
      </svg>
    ),
  },
];

function LogoMark() {
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-teal/20 text-accent-blue shadow-glow-blue transition-all duration-300 group-hover:bg-accent-teal/30">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2 21 9 12 22 3 9Z" fillOpacity={0.85} />
      </svg>
    </div>
  );
}

function Wordmark() {
  return (
    <div>
      <div className="font-mono text-sm font-bold tracking-[0.2em] text-white">
        MCSR<span className="text-accent-blue">·</span>STATS
      </div>
      <div className="text-[10px] uppercase tracking-widest text-charcoal-300">
        Ranked Intelligence
      </div>
    </div>
  );
}

export default function Sidebar({ season }: { season: number | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile top bar (hidden on desktop) */}
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center gap-3 border-b border-charcoal-500/60 bg-charcoal-900/95 px-4 backdrop-blur lg:hidden">
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-charcoal-500/60 text-charcoal-300 transition-colors duration-300 hover:text-accent-blue"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>
        <Link href="/" className="group flex items-center gap-2.5">
          <LogoMark />
          <Wordmark />
        </Link>
      </header>

      {/* Backdrop (mobile only, when drawer open) */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          aria-hidden
        />
      )}

      {/* Sidebar / drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-charcoal-500/60 bg-charcoal-900/95 backdrop-blur transition-transform duration-300 lg:z-40 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo row (+ close button on mobile) */}
        <div className="flex items-center justify-between border-b border-charcoal-500/60 px-5 py-5">
          <Link href="/" className="group flex items-center gap-3">
            <LogoMark />
            <Wordmark />
          </Link>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="text-charcoal-300 transition-colors duration-300 hover:text-white lg:hidden"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-300 ${
                  active
                    ? "bg-accent-teal/15 text-white"
                    : "text-charcoal-300 hover:bg-charcoal-600/60 hover:text-white"
                }`}
              >
                {active && (
                  <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-accent-blue shadow-glow-blue" />
                )}
                <span
                  className={`transition-colors duration-300 ${
                    active ? "text-accent-blue" : "group-hover:text-accent-blue"
                  }`}
                >
                  {item.icon}
                </span>
                <span>
                  <span className="block text-sm font-semibold leading-tight">
                    {item.label}
                  </span>
                  <span className="block text-[11px] text-charcoal-300">
                    {item.sub}
                  </span>
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Season footer */}
        <div className="border-t border-charcoal-500/60 px-5 py-4">
          <div className="font-mono text-[11px] uppercase tracking-widest text-charcoal-300">
            {season !== null ? `Season ${season}` : "MCSR Ranked"}
          </div>
          <div className="mt-2 text-[11px] text-charcoal-300">
            api.mcsrranked.com
          </div>
        </div>
      </aside>
    </>
  );
}
