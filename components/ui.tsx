import { ReactNode } from "react";
import { Tier } from "@/lib/types";
import { TIER_COLORS } from "@/lib/meta";

export function PageHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          {title}
        </h1>
        <p className="mt-1 text-sm text-charcoal-300">{subtitle}</p>
      </div>
      {right}
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  accent = "text-white",
  glow = false,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  accent?: string;
  glow?: boolean;
}) {
  return (
    <div
      className={`panel px-5 py-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-charcoal-400 ${
        glow ? "hover:shadow-glow-blue" : ""
      }`}
    >
      <div className="font-mono text-[11px] font-semibold uppercase tracking-widest text-charcoal-300">
        {label}
      </div>
      <div className={`mt-1.5 font-mono text-2xl font-bold ${accent}`}>
        {value}
      </div>
      {sub && <div className="mt-1 text-xs text-charcoal-300">{sub}</div>}
    </div>
  );
}

/* ── Rank icons ────────────────────────────────────────────────────
   The real MCSR Ranked rank badges live in /public/ranks/<rank>.png.
   A tinted diamond is drawn underneath as a cheap fallback, so a missing
   or failed image degrades gracefully instead of showing a broken icon. */

/** Filename each rank looks for under /public/ranks/ (lowercase tier name). */
const TIER_TEXTURE: Record<Tier, string> = {
  Coal: "coal",
  Iron: "iron",
  Gold: "gold",
  Emerald: "emerald",
  Diamond: "diamond",
  Netherite: "netherite",
};

export function TierBadge({ tier, size = 18 }: { tier: Tier; size?: number }) {
  const c = TIER_COLORS[tier];
  return (
    <span
      className="relative inline-block shrink-0 align-middle"
      style={{ width: size, height: size }}
      title={`${tier} rank`}
    >
      {/* Fallback: simple tinted diamond, hidden behind the texture. */}
      <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden>
        <path d="M8 1.5 14.5 8 8 14.5 1.5 8Z" fill={c} fillOpacity={0.55} stroke={c} strokeWidth={1.2} strokeLinejoin="round" />
      </svg>
      <span
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(/ranks/${TIER_TEXTURE[tier]}.png)`,
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          // Smooth on purpose: the badge art is high-res and scaled DOWN.
        }}
      />
    </span>
  );
}

export function TierChip({ tier }: { tier: Tier }) {
  const color = TIER_COLORS[tier];
  return (
    <span
      className="chip border"
      style={{ color, borderColor: `${color}55`, backgroundColor: `${color}14` }}
    >
      <TierBadge tier={tier} size={12} />
      {tier}
    </span>
  );
}

/** Season picker shared by every section (leaderboard, analytics, compare). */
export function SeasonSelect({
  value,
  max,
  onChange,
}: {
  /** Currently-viewed season; null = current. */
  value: number | null;
  /** Latest season number. */
  max: number | null;
  onChange: (season: number) => void;
}) {
  if (!max) return null;
  const cur = value ?? max;
  const opts = Array.from({ length: max }, (_, i) => max - i); // max..1
  return (
    <label className="flex items-center gap-2 rounded-lg border border-charcoal-500 bg-charcoal-700 px-3 py-1.5">
      <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-charcoal-300">
        Season
      </span>
      <select
        value={cur}
        onChange={(e) => onChange(Number(e.target.value))}
        className="cursor-pointer bg-transparent font-mono text-sm font-bold text-white outline-none"
      >
        {opts.map((s) => (
          <option key={s} value={s} className="bg-charcoal-800 text-white">
            {s}
            {s === max ? " · current" : ""}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Bar({
  pct,
  color,
  height = 6,
}: {
  pct: number;
  color: string;
  height?: number;
}) {
  return (
    <div
      className="w-full overflow-hidden rounded-full bg-charcoal-600"
      style={{ height }}
    >
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{ width: `${Math.min(100, Math.max(0, pct))}%`, backgroundColor: color }}
      />
    </div>
  );
}
