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

/** Diamond-shaped tier icon with tier color. */
export function TierBadge({ tier, size = 18 }: { tier: Tier; size?: number }) {
  const color = TIER_COLORS[tier];
  return (
    <span className="inline-flex items-center gap-2" title={`${tier} tier`}>
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
        <path
          d="M12 2 L21 9 L12 22 L3 9 Z"
          fill={color}
          fillOpacity={0.22}
          stroke={color}
          strokeWidth={1.8}
          strokeLinejoin="round"
        />
        <path d="M7.5 9 L12 5.4 L16.5 9 L12 17 Z" fill={color} fillOpacity={0.65} />
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
