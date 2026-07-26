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

/**
 * Per-rank icon shaped after the Minecraft item each division is named for —
 * a coal lump, ingots (iron/gold/netherite), and cut gems (emerald/diamond).
 * Original SVG art tinted with the app's tier colors.
 */
export function TierBadge({ tier, size = 18 }: { tier: Tier; size?: number }) {
  const c = TIER_COLORS[tier];
  const edge = "#0b0b0e";
  return (
    <span className="inline-flex items-center" title={`${tier} rank`}>
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
        {tier === "Coal" && (
          <g stroke={edge} strokeWidth={0.9} strokeLinejoin="round">
            <path d="M7 6h7a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V8a2 2 0 0 1 2-2z" fill={c} />
            <path d="M9 9l2 2-2 2M14 10l-1.5 2 1.5 2" fill="none" stroke={edge} strokeOpacity={0.5} strokeWidth={0.9} />
          </g>
        )}
        {(tier === "Iron" || tier === "Gold" || tier === "Netherite") && (
          <g stroke={edge} strokeWidth={0.8} strokeLinejoin="round">
            <path d="M4 11h16l-2 6H6z" fill={c} />
            <path d="M4 11l2-3h12l2 3z" fill={c} fillOpacity={0.6} />
          </g>
        )}
        {tier === "Emerald" && (
          <g stroke={edge} strokeWidth={0.8} strokeLinejoin="round">
            <path d="M12 2l7 5v10l-7 5-7-5V7z" fill={c} />
            <path d="M12 2l7 5-7 4-7-4z" fill={c} fillOpacity={0.55} />
          </g>
        )}
        {tier === "Diamond" && (
          <g stroke={edge} strokeWidth={0.8} strokeLinejoin="round">
            <path d="M5 9l3-4h8l3 4-7 11z" fill={c} />
            <path d="M5 9l3-4h8l3 4-7 3z" fill={c} fillOpacity={0.55} />
          </g>
        )}
      </svg>
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
