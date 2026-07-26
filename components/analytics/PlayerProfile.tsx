"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ProfileData } from "@/lib/api";
import { formatSegment, formatSigned, formatTime, winRate } from "@/lib/format";
import {
  deservedTier,
  flagEmoji,
  prettyEnum,
  RANK_SPLITS,
  rankTotalMs,
  SPLIT_META,
  TIER_COLORS,
  TIER_ORDER,
  tierForElo,
  tierForSplit,
} from "@/lib/meta";
import { SplitData, SplitKey, SPLIT_ORDER, Tier } from "@/lib/types";
import { Bar, PageHeader, SeasonSelect, StatCard, TierChip } from "@/components/ui";
import MatchDetail from "./MatchDetail";
import SkinViewer from "./SkinViewer";

const LAST_PLAYER_KEY = "mcsr:lastPlayer";

/* ── Search box with roster autocomplete ──────────────────────────── */

function PlayerSearch({
  roster,
  compact = false,
}: {
  roster: string[];
  compact?: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return roster.filter((n) => n.toLowerCase().includes(q)).slice(0, 8);
  }, [query, roster]);

  const go = (name: string) => {
    if (!name.trim()) return;
    setOpen(false);
    router.push(`/analytics?player=${encodeURIComponent(name.trim())}`);
  };

  return (
    <div className={`relative ${compact ? "w-72" : "mx-auto w-full max-w-xl"}`}>
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => e.key === "Enter" && go(query)}
        placeholder="Exact username"
        className={`w-full rounded-xl border border-charcoal-500 bg-charcoal-700 text-white placeholder-charcoal-300 outline-none transition-all duration-300 focus:border-accent-blue/60 focus:shadow-glow-blue ${
          compact ? "px-4 py-2 text-sm" : "px-5 py-3.5"
        }`}
      />
      {open && results.length > 0 && (
        <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-charcoal-500 bg-charcoal-850 shadow-2xl">
          {results.map((n) => (
            <button
              key={n}
              onMouseDown={() => go(n)}
              className="flex w-full items-center px-4 py-2.5 text-left font-semibold text-white transition-colors duration-200 hover:bg-accent-teal/15"
            >
              {n}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Rank badge for an individual split time ──────────────────────── */

/**
 * Shows which rank a single split time reads as. A runner sitting in Iron
 * overall can still post a Gold-level bastion split — this labels that.
 */
function SplitRankChip({ phase, ms }: { phase: SplitKey; ms: number }) {
  const tier = tierForSplit(phase, ms);
  const c = TIER_COLORS[tier];
  return (
    <span
      className="chip border"
      style={{ color: c, borderColor: `${c}55`, backgroundColor: `${c}14` }}
      title={`${formatSegment(ms)} reads as ${tier}-level pace for ${SPLIT_META[phase].label} (${tier} average ${formatSegment(RANK_SPLITS[tier][phase])})`}
    >
      {tier}
    </span>
  );
}

/* ── Split chart vs deserved-rank averages ────────────────────────── */

function SplitChart({
  profile,
  paceTier,
  splits,
  usedRuns,
  onOpenMatch,
  avgMode,
}: {
  profile: ProfileData;
  paceTier: Tier | null;
  splits: SplitData[] | null;
  usedRuns: number;
  onOpenMatch: (id: number) => void;
  avgMode: SplitAvgMode;
}) {
  const [hovered, setHovered] = useState<SplitKey | null>(null);

  const totalAvg = useMemo(
    () => (splits ? splits.reduce((s, d) => s + d.avgMs, 0) : 0),
    [splits],
  );

  if (!splits || !paceTier) {
    return (
      <div className="panel px-6 py-10 text-center">
        <h2 className="mb-1 font-semibold text-white">Phase & Split Analytics</h2>
        <p className="text-sm text-charcoal-300">
          No recent ranked completions with timeline data — splits appear once
          this runner finishes ranked seeds.
        </p>
      </div>
    );
  }

  const ref = RANK_SPLITS[paceTier];
  const tierColor = TIER_COLORS[paceTier];
  const maxSeg = Math.max(
    ...splits.map((d) => Math.max(d.avgMs, ref[d.key])),
  );

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2 className="font-semibold text-white">Phase & Split Analytics</h2>
          <p className="text-xs text-charcoal-300">
            {avgMode === "best45" ? "Best 4/5" : "All"} of {usedRuns} sampled run
            {usedRuns === 1 ? "" : "s"} — each phase counts a run only once it was
            cleared by two more splits — compared against the{" "}
            <span className="font-semibold" style={{ color: tierColor }}>
              {paceTier}
            </span>{" "}
            rank average.
          </p>
        </div>
        <span className="font-mono text-xs text-charcoal-300">
          avg completion{" "}
          <span className="font-bold text-white">{formatTime(totalAvg)}</span>
        </span>
      </div>

      <div className="p-5">
        {/* Cumulative run timeline — stacked bar */}
        <div className="mb-1 flex h-9 w-full overflow-hidden rounded-lg">
          {splits.map((d) => {
            const meta = SPLIT_META[d.key];
            const dim = hovered !== null && hovered !== d.key;
            return (
              <div
                key={d.key}
                onMouseEnter={() => setHovered(d.key)}
                onMouseLeave={() => setHovered(null)}
                className="group relative flex cursor-pointer items-center justify-center transition-all duration-300"
                style={{
                  width: `${(d.avgMs / totalAvg) * 100}%`,
                  backgroundColor: meta.color,
                  opacity: dim ? 0.25 : 0.85,
                }}
                title={`${meta.label}: ${formatSegment(d.avgMs)}`}
              >
                <span className="select-none font-mono text-[9px] font-bold text-black/70">
                  {meta.short}
                </span>
              </div>
            );
          })}
        </div>
        <div className="mb-6 flex justify-between font-mono text-[10px] text-charcoal-300">
          <span>0:00</span>
          <span>{formatTime(totalAvg, false)}</span>
        </div>

        {/* Per-phase comparison rows */}
        <div className="space-y-3">
          {splits.map((d) => {
            const meta = SPLIT_META[d.key];
            const active = hovered === d.key;
            const delta = d.avgMs - ref[d.key];
            return (
              <div
                key={d.key}
                onMouseEnter={() => setHovered(d.key)}
                onMouseLeave={() => setHovered(null)}
                className={`rounded-lg border px-4 py-3 transition-all duration-300 ${
                  active
                    ? "border-charcoal-400 bg-charcoal-700/80"
                    : "border-transparent bg-charcoal-700/30"
                }`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: meta.color }} />
                    <span className="text-sm font-semibold text-white">{meta.label}</span>
                    {active && (
                      <span className="animate-fadeSlideUp text-xs text-charcoal-300">
                        {meta.description}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 font-mono text-xs">
                    <span className="text-charcoal-300">
                      best{" "}
                      {d.bestMatchId ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenMatch(d.bestMatchId!);
                          }}
                          title="Open the match this split came from"
                          className="font-bold text-accent-green underline decoration-dotted underline-offset-2 transition-colors duration-300 hover:text-white"
                        >
                          {formatSegment(d.bestMs)}
                        </button>
                      ) : (
                        <span className="font-bold text-accent-green">{formatSegment(d.bestMs)}</span>
                      )}
                    </span>
                    <span className="flex items-center gap-1.5 text-charcoal-300">
                      avg <span className="font-bold text-white">{formatSegment(d.avgMs)}</span>
                      <SplitRankChip phase={d.key} ms={d.avgMs} />
                    </span>
                    <span className={delta <= 0 ? "text-accent-green" : "text-accent-red"}>
                      {delta <= 0 ? "" : "+"}
                      {(delta / 1000).toFixed(1)}s vs {paceTier}
                    </span>
                  </div>
                </div>
                <div className="relative">
                  <Bar pct={(d.avgMs / maxSeg) * 100} color={meta.color} height={8} />
                  <div
                    className="absolute top-1/2 h-4 w-0.5 -translate-y-1/2"
                    style={{ left: `${(ref[d.key] / maxSeg) * 100}%`, backgroundColor: tierColor }}
                    title={`${paceTier} average: ${formatSegment(ref[d.key])}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-right font-mono text-[10px] uppercase tracking-widest text-charcoal-300">
          │ tick = <span style={{ color: tierColor }}>{paceTier}</span> rank average
        </p>
      </div>
    </div>
  );
}

/* ── Split comparison across all ranks ────────────────────────────── */

function RankComparisonTable({ splits }: { splits: SplitData[] | null }) {
  const mine = useMemo(() => {
    const m = new Map<SplitKey, number>();
    splits?.forEach((s) => m.set(s.key, s.avgMs));
    return m;
  }, [splits]);
  const youTotal = useMemo(
    () => (splits ? splits.reduce((sum, s) => sum + s.avgMs, 0) : null),
    [splits],
  );

  return (
    <div className="panel overflow-hidden">
      <div className="panel-header">
        <div>
          <h2 className="font-mono text-sm font-bold uppercase tracking-[0.25em] text-accent-blue">
            Split Comparison Across All Ranks
          </h2>
          <p className="mt-1 font-mono text-[11px] text-charcoal-300">
            <span className="text-accent-green">▲</span> = you are faster ·{" "}
            <span className="text-accent-red">▼</span> = you are slower (&gt;5% diff shown)
          </p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-charcoal-500/60 bg-charcoal-900/50">
              <th className="px-4 py-3 font-mono text-[11px] font-semibold uppercase tracking-widest text-charcoal-300">
                Split
              </th>
              <th className="px-4 py-3 font-mono text-[11px] font-semibold uppercase tracking-widest text-accent-blue">
                You
              </th>
              {TIER_ORDER.map((t) => (
                <th
                  key={t}
                  className="px-4 py-3 font-mono text-[11px] font-semibold uppercase tracking-widest"
                  style={{ color: TIER_COLORS[t] }}
                >
                  {t}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SPLIT_ORDER.map((key) => {
              const you = mine.get(key);
              return (
                <tr key={key} className="border-b border-charcoal-600/40 transition-colors duration-300 hover:bg-charcoal-700/40">
                  <td className="px-4 py-3 text-sm font-semibold text-white">
                    {SPLIT_META[key].label}
                  </td>
                  <td className="px-4 py-3 font-mono text-sm font-bold text-accent-blue">
                    {you !== undefined ? formatTime(you, false) : "—"}
                  </td>
                  {TIER_ORDER.map((t) => {
                    const rank = RANK_SPLITS[t][key];
                    let badge: JSX.Element | null = null;
                    if (you !== undefined) {
                      const faster = you < rank;
                      const pct = faster
                        ? ((rank - you) / rank) * 100
                        : ((you - rank) / rank) * 100;
                      if (pct > 5) {
                        badge = (
                          <span
                            className={`ml-1.5 font-mono text-[11px] font-bold ${
                              faster ? "text-accent-green" : "text-accent-red"
                            }`}
                          >
                            {faster ? "▲" : "▼"}
                            {Math.round(pct)}%
                          </span>
                        );
                      }
                    }
                    return (
                      <td key={t} className="whitespace-nowrap px-4 py-3 font-mono text-sm" style={{ color: TIER_COLORS[t] }}>
                        {formatTime(rank, false)}
                        {badge}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            {/* Full-run average pace total */}
            <tr className="border-t-2 border-charcoal-400 bg-charcoal-900/40">
              <td className="px-4 py-3.5 text-sm font-bold uppercase tracking-wide text-white">
                Full Pace
              </td>
              <td className="px-4 py-3.5 font-mono text-sm font-black text-accent-blue">
                {youTotal !== null ? formatTime(youTotal, false) : "—"}
              </td>
              {TIER_ORDER.map((t) => {
                const total = rankTotalMs(t);
                let badge: JSX.Element | null = null;
                if (youTotal !== null) {
                  const faster = youTotal < total;
                  const pct = faster
                    ? ((total - youTotal) / total) * 100
                    : ((youTotal - total) / total) * 100;
                  if (pct > 5) {
                    badge = (
                      <span
                        className={`ml-1.5 font-mono text-[11px] font-bold ${
                          faster ? "text-accent-green" : "text-accent-red"
                        }`}
                      >
                        {faster ? "▲" : "▼"}
                        {Math.round(pct)}%
                      </span>
                    );
                  }
                }
                return (
                  <td key={t} className="whitespace-nowrap px-4 py-3.5 font-mono text-sm font-bold" style={{ color: TIER_COLORS[t] }}>
                    {formatTime(total, false)}
                    {badge}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Recent matches (clickable, 15/25/50/100) ─────────────────────── */

const MATCH_COUNTS = [15, 25, 50, 100];

function RecentMatches({
  profile,
  onOpen,
}: {
  profile: ProfileData;
  onOpen: (id: number) => void;
}) {
  const [count, setCount] = useState(15);
  const recent = profile.runs.slice(0, count);
  const pb = profile.season.pbMs;

  return (
    <div className="panel overflow-hidden">
      <div className="panel-header">
        <div>
          <h2 className="font-semibold text-white">Recent Ranked Matches</h2>
          <p className="text-xs text-charcoal-300">click a match for its full timeline</p>
        </div>
        <div className="flex rounded-lg bg-charcoal-700 p-1">
          {MATCH_COUNTS.map((c) => (
            <button
              key={c}
              onClick={() => setCount(c)}
              className={`btn-tab px-3 text-xs ${
                count === c
                  ? "bg-accent-teal/30 text-accent-blue"
                  : "text-charcoal-300 hover:text-white"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-charcoal-500/60">
              {["Date", "Opponent", "Result", "Time", "Seed", "Elo"].map((h) => (
                <th key={h} className="px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-charcoal-300">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recent.map((r) => (
              <tr
                key={r.id}
                onClick={() => onOpen(r.id)}
                className="cursor-pointer border-b border-charcoal-600/40 transition-colors duration-300 hover:bg-accent-teal/10"
              >
                <td className="px-4 py-2.5 font-mono text-xs text-charcoal-300">
                  {r.dateSec ? new Date(r.dateSec * 1000).toISOString().slice(0, 10) : "—"}
                </td>
                <td className="px-4 py-2.5 text-sm font-semibold text-white">{r.opponent}</td>
                <td className="px-4 py-2.5">
                  {r.draw ? (
                    <span className="chip border border-charcoal-500 bg-charcoal-700 text-charcoal-300">Draw</span>
                  ) : r.won ? (
                    <span className="chip border border-accent-green/40 bg-accent-green/10 text-accent-green">
                      Win{r.forfeited ? " · FF" : ""}
                    </span>
                  ) : (
                    <span className="chip border border-accent-red/40 bg-accent-red/10 text-accent-red">
                      Loss{r.forfeited ? " · FF" : ""}
                    </span>
                  )}
                </td>
                <td className="px-4 py-2.5 font-mono text-sm">
                  {r.won && !r.forfeited && r.timeMs !== null ? (
                    <span className={r.timeMs === pb ? "font-bold text-accent-green" : "font-bold text-white"}>
                      {formatTime(r.timeMs)}
                      {r.timeMs === pb && (
                        <span className="ml-1.5 chip border border-accent-green/40 bg-accent-green/10 text-accent-green">PB</span>
                      )}
                    </span>
                  ) : (
                    <span className="text-charcoal-300">—</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-xs text-charcoal-300">
                  {prettyEnum(r.overworld)} · {prettyEnum(r.bastion)}
                </td>
                <td className={`px-4 py-2.5 font-mono text-xs font-bold ${
                  (r.eloChange ?? 0) >= 0 ? "text-accent-green" : "text-accent-red"
                }`}>
                  {r.eloChange === null ? "—" : formatSigned(r.eloChange)}
                </td>
              </tr>
            ))}
            {recent.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-charcoal-300">
                  No recent ranked matches.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Elo progression section ──────────────────────────────────────── */

type EloWindow = 30 | 60 | "all";

function fmtDate(sec: number | null): string {
  if (!sec) return "—";
  const d = new Date(sec * 1000);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function EloSection({ profile }: { profile: ProfileData }) {
  const [win, setWin] = useState<EloWindow>(30);
  const [hover, setHover] = useState<number | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // Chronological post-match ratings (API returns newest-first).
  const full = useMemo(
    () =>
      profile.runs
        .filter((r) => r.eloAfter !== null)
        .map((r) => ({ elo: r.eloAfter as number, change: r.eloChange ?? 0, date: r.dateSec }))
        .reverse(),
    [profile.runs],
  );

  const series = useMemo(
    () => (win === "all" ? full : full.slice(-win)),
    [full, win],
  );

  if (full.length < 2) return null;

  const elos = series.map((p) => p.elo);
  const min = Math.min(...elos);
  const max = Math.max(...elos);
  const start = elos[0];
  const cur = profile.elo ?? elos[elos.length - 1];
  const net = cur - start;
  const peak = Math.max(max, profile.peakElo ?? -Infinity);
  const biggestGain = Math.max(...series.map((p) => p.change));
  const biggestLoss = Math.min(...series.map((p) => p.change));

  const W = 900;
  const H = 210;
  const padX = 10;
  const padT = 14;
  const padB = 10;
  const span = Math.max(1, max - min);
  const n = series.length;
  const xAt = (i: number) => padX + (n === 1 ? 0.5 : i / (n - 1)) * (W - padX * 2);
  const yAt = (e: number) => padT + (1 - (e - min) / span) * (H - padT - padB);
  const line = series
    .map((p, i) => `${i === 0 ? "M" : "L"}${xAt(i).toFixed(1)} ${yAt(p.elo).toFixed(1)}`)
    .join(" ");
  const area = `${line} L${xAt(n - 1).toFixed(1)} ${H - padB} L${xAt(0).toFixed(1)} ${H - padB} Z`;
  const up = net >= 0;
  const stroke = up ? "#00e676" : "#ff5252";

  const onMove = (e: React.MouseEvent) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const frac = (e.clientX - rect.left) / rect.width;
    setHover(Math.max(0, Math.min(n - 1, Math.round(frac * (n - 1)))));
  };

  const chip = (label: string, value: string, color: string) => (
    <div className="rounded-lg border border-charcoal-500/60 bg-charcoal-900/60 px-3.5 py-2">
      <div className="font-mono text-[10px] uppercase tracking-widest text-charcoal-300">{label}</div>
      <div className="mt-0.5 font-mono text-lg font-bold" style={{ color }}>{value}</div>
    </div>
  );

  const hp = hover !== null ? series[hover] : null;
  const hoverPct = hover !== null && n > 1 ? (hover / (n - 1)) * 100 : 0;

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2 className="font-semibold text-white">Elo Progression</h2>
          <p className="text-xs text-charcoal-300">
            Rating after each ranked match this season — hover for the date.
          </p>
        </div>
        <div className="flex rounded-lg bg-charcoal-700 p-1">
          {([30, 60, "all"] as EloWindow[]).map((w) => (
            <button
              key={w}
              onClick={() => {
                setWin(w);
                setHover(null);
              }}
              className={`btn-tab px-3 text-xs ${
                win === w
                  ? "bg-accent-teal/30 text-accent-blue"
                  : "text-charcoal-300 hover:text-white"
              }`}
            >
              {w === "all" ? "All" : w}
            </button>
          ))}
        </div>
      </div>
      <div className="p-5">
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {chip("Current", `${cur}`, "#ffffff")}
          {chip("Season Peak", `${peak}`, "#00e5ff")}
          {chip("Net (window)", `${net >= 0 ? "+" : ""}${net}`, up ? "#00e676" : "#ff5252")}
          {chip("Biggest Gain", `+${biggestGain}`, "#00e676")}
          {chip("Biggest Loss", `${biggestLoss}`, "#ff5252")}
        </div>

        <div
          ref={wrapRef}
          className="relative"
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
        >
          {/* Tooltip */}
          {hp && (
            <div
              className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-charcoal-400 bg-charcoal-850 px-3 py-2 shadow-xl"
              style={{ left: `${hoverPct}%`, top: -6 }}
            >
              <div className="whitespace-nowrap font-mono text-[11px] text-charcoal-300">
                {fmtDate(hp.date)}
              </div>
              <div className="whitespace-nowrap font-mono text-sm font-bold text-white">
                {hp.elo}{" "}
                <span className={hp.change >= 0 ? "text-accent-green" : "text-accent-red"}>
                  ({hp.change >= 0 ? "+" : ""}{hp.change})
                </span>
              </div>
            </div>
          )}
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="eloFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={stroke} stopOpacity={0.28} />
                <stop offset="100%" stopColor={stroke} stopOpacity={0} />
              </linearGradient>
            </defs>
            {/* min/max gridlines */}
            <line x1={padX} y1={yAt(max)} x2={W - padX} y2={yAt(max)} stroke="#26262f" strokeWidth={1} strokeDasharray="4 4" />
            <line x1={padX} y1={yAt(min)} x2={W - padX} y2={yAt(min)} stroke="#26262f" strokeWidth={1} strokeDasharray="4 4" />
            <text x={padX + 2} y={yAt(max) - 4} fill="#4a4a58" fontSize={11} fontFamily="monospace">{max}</text>
            <text x={padX + 2} y={yAt(min) - 4} fill="#4a4a58" fontSize={11} fontFamily="monospace">{min}</text>
            <path d={area} fill="url(#eloFill)" />
            <path d={line} fill="none" stroke={stroke} strokeWidth={2} strokeLinejoin="round" />
            {/* hover guide */}
            {hover !== null && (
              <>
                <line x1={xAt(hover)} y1={padT} x2={xAt(hover)} y2={H - padB} stroke="#00e5ff" strokeWidth={1} strokeOpacity={0.5} />
                <circle cx={xAt(hover)} cy={yAt(series[hover].elo)} r={5} fill="#00e5ff" stroke="#0c0c0f" strokeWidth={1.5} />
              </>
            )}
            <circle cx={xAt(n - 1)} cy={yAt(elos[n - 1])} r={4} fill={stroke} />
          </svg>
        </div>
        <div className="mt-1 flex justify-between font-mono text-[10px] uppercase tracking-widest text-charcoal-300">
          <span>← older ({series.length} shown)</span>
          <span>most recent →</span>
        </div>
      </div>
    </div>
  );
}

/* ── Seed & bastion micro-analytics ───────────────────────────────── */

interface SeedBucket {
  key: string;
  played: number;
  wins: number;
  losses: number;
  forfeits: number;
  times: number[];
}

function bucketize(
  runs: ProfileData["runs"],
  field: "overworld" | "bastion",
): SeedBucket[] {
  const map = new Map<string, SeedBucket>();
  for (const r of runs) {
    const k = r[field];
    if (!k) continue;
    let b = map.get(k);
    if (!b) {
      b = { key: k, played: 0, wins: 0, losses: 0, forfeits: 0, times: [] };
      map.set(k, b);
    }
    b.played++;
    if (r.forfeited) b.forfeits++;
    if (!r.draw) {
      if (r.won) b.wins++;
      else b.losses++;
    }
    if (r.won && !r.forfeited && r.timeMs !== null) b.times.push(r.timeMs);
  }
  return Array.from(map.values()).sort((a, b) => b.played - a.played);
}

const winPct = (b: SeedBucket) =>
  b.wins + b.losses === 0 ? 0 : (b.wins / (b.wins + b.losses)) * 100;
/**
 * Color from the ROUNDED value, so a displayed "56%" is always the same color
 * in every table (previously 55.4 showed "55%" amber while 55.6 showed "56%"
 * green, which read as inconsistent between the overworld and bastion tabs).
 */
const wpColor = (p: number) => {
  const r = Math.round(p);
  return r >= 55 ? "#00e676" : r >= 45 ? "#ffc400" : "#ff5252";
};

function SeedTable({
  buckets,
  splitCol,
  splitAvg,
  splitPhase,
  deathStats,
}: {
  buckets: SeedBucket[];
  /** Header label for the seed-specific split column. */
  splitCol: string;
  /** type key → { avgMs, n } of that seed type's relevant phase split. */
  splitAvg: Map<string, { avgMs: number; n: number }>;
  /** Which phase that column measures — drives the rank badge. */
  splitPhase: SplitKey;
  /** type key → death counts from the sampled runs. */
  deathStats: Record<string, { runs: number; withDeath: number; deaths: number }>;
}) {
  // Strongest / weakest need a minimum sample to be meaningful.
  const eligible = buckets.filter((b) => b.wins + b.losses >= 3);
  const best = eligible.length
    ? eligible.reduce((a, b) => (winPct(b) >= winPct(a) ? b : a))
    : null;
  const worst = eligible.length
    ? eligible.reduce((a, b) => (winPct(b) <= winPct(a) ? b : a))
    : null;

  if (buckets.length === 0) {
    return <p className="px-4 py-8 text-center text-sm text-charcoal-300">No seed data in loaded matches.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-charcoal-500/60">
            {["Type", "Played", "Win %", "Death Rate", splitCol, "Avg Finish", "Best"].map((h) => (
              <th key={h} className="px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-charcoal-300">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {buckets.map((b) => {
            const p = winPct(b);
            const avg = b.times.length ? b.times.reduce((s, t) => s + t, 0) / b.times.length : null;
            const bestT = b.times.length ? Math.min(...b.times) : null;
            return (
              <tr key={b.key} className="border-b border-charcoal-600/40 transition-colors duration-300 hover:bg-charcoal-700/40">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{prettyEnum(b.key)}</span>
                    {best === b && eligible.length > 1 && (
                      <span className="chip border border-accent-green/40 bg-accent-green/10 text-accent-green">▲ best</span>
                    )}
                    {worst === b && best !== b && eligible.length > 1 && (
                      <span className="chip border border-accent-red/40 bg-accent-red/10 text-accent-red">▼ worst</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-sm text-charcoal-300">
                  {b.played}
                  <span className="ml-1.5 text-xs">
                    (<span className="text-accent-green">{b.wins}</span>–<span className="text-accent-red">{b.losses}</span>)
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-charcoal-600">
                      <div className="h-full rounded-full" style={{ width: `${p}%`, backgroundColor: wpColor(p) }} />
                    </div>
                    <span className="font-mono text-xs" style={{ color: wpColor(p) }}>{p.toFixed(0)}%</span>
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-sm">
                  {(() => {
                    const ds = deathStats[b.key];
                    if (!ds || ds.runs === 0)
                      return <span className="text-charcoal-300">—</span>;
                    const rate = (ds.withDeath / ds.runs) * 100;
                    const col =
                      rate <= 10 ? "#00e676" : rate <= 30 ? "#ffc400" : "#ff5252";
                    return (
                      <span style={{ color: col }}>
                        {rate.toFixed(0)}%
                        <span className="ml-1 text-[10px] text-charcoal-300">
                          n{ds.runs}
                        </span>
                      </span>
                    );
                  })()}
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-sm text-accent-blue">
                  {splitAvg.has(b.key) ? (
                    <div className="flex flex-col items-start gap-1">
                      <span>
                        {formatSegment(splitAvg.get(b.key)!.avgMs)}
                        <span className="ml-1 text-[10px] text-charcoal-300">
                          n{splitAvg.get(b.key)!.n}
                        </span>
                      </span>
                      <SplitRankChip phase={splitPhase} ms={splitAvg.get(b.key)!.avgMs} />
                    </div>
                  ) : (
                    <span className="text-charcoal-300">—</span>
                  )}
                </td>
                <td className="px-4 py-3 font-mono text-sm text-white">
                  {avg !== null ? formatTime(avg) : "—"}
                </td>
                <td className="px-4 py-3 font-mono text-sm text-accent-green">
                  {bestT !== null ? formatTime(bestT) : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Average a specific phase split per seed sub-type from sampled timelines. */
function splitByType(
  samples: ProfileData["splitSamples"],
  field: "overworld" | "bastion",
  phase: SplitKey,
): Map<string, { avgMs: number; n: number }> {
  const acc = new Map<string, { sum: number; n: number }>();
  for (const s of samples) {
    const k = s[field];
    const v = s.segments[phase];
    if (!k || v === undefined) continue; // phase didn't qualify in this run
    const e = acc.get(k) ?? { sum: 0, n: 0 };
    e.sum += v;
    e.n += 1;
    acc.set(k, e);
  }
  const out = new Map<string, { avgMs: number; n: number }>();
  acc.forEach((v, k) => out.set(k, { avgMs: v.sum / v.n, n: v.n }));
  return out;
}

function SeedBreakdown({ profile }: { profile: ProfileData }) {
  const [tab, setTab] = useState<"overworld" | "bastion">("overworld");
  const overworld = useMemo(() => bucketize(profile.runs, "overworld"), [profile.runs]);
  const bastion = useMemo(() => bucketize(profile.runs, "bastion"), [profile.runs]);

  // Each seed type influences one phase: overworld → the Overworld split,
  // bastion → the Bastion split. Averaged from sampled match timelines.
  const owSplit = useMemo(
    () => splitByType(profile.splitSamples, "overworld", "ow"),
    [profile.splitSamples],
  );
  const bastionSplit = useMemo(
    () => splitByType(profile.splitSamples, "bastion", "bastion"),
    [profile.splitSamples],
  );

  const buckets = tab === "overworld" ? overworld : bastion;
  const splitAvg = tab === "overworld" ? owSplit : bastionSplit;
  const splitCol = tab === "overworld" ? "Avg OW Split" : "Avg Bastion Split";
  const splitPhase: SplitKey = tab === "overworld" ? "ow" : "bastion";
  const deathStats = profile.deathByType?.[tab] ?? {};

  return (
    <div className="panel overflow-hidden">
      <div className="panel-header">
        <div>
          <h2 className="font-semibold text-white">Seed &amp; Bastion Breakdown</h2>
          <p className="text-xs text-charcoal-300">
            Win rate, pace, and the{" "}
            <span className="text-accent-blue">
              {tab === "overworld" ? "Overworld" : "Bastion"} split
            </span>{" "}
            by seed sub-type across the last {profile.runs.length} matches
            <span className="text-charcoal-300"> (split from {profile.sampledRuns} sampled runs)</span>.
          </p>
        </div>
        <div className="flex rounded-lg bg-charcoal-700 p-1">
          {(["overworld", "bastion"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`btn-tab px-3 text-xs capitalize ${
                tab === t ? "bg-accent-teal/30 text-accent-blue" : "text-charcoal-300 hover:text-white"
              }`}
            >
              {t === "overworld" ? "Overworld" : "Bastion"}
            </button>
          ))}
        </div>
      </div>
      <SeedTable
        buckets={buckets}
        splitCol={splitCol}
        splitAvg={splitAvg}
        splitPhase={splitPhase}
        deathStats={deathStats}
      />
    </div>
  );
}

/* ── Death breakdown donut ────────────────────────────────────────── */

function DeathDonut({ profile }: { profile: ProfileData }) {
  const [hover, setHover] = useState<"clean" | "died" | null>(null);
  const d = profile.deaths;
  if (!d || d.sampled === 0) return null;

  const died = d.withDeath;
  const clean = Math.max(0, d.sampled - died);
  const diedPct = (died / d.sampled) * 100;
  const cleanPct = 100 - diedPct;

  // Donut geometry: one circle, two dash-offset arcs.
  const R = 54;
  const C = 2 * Math.PI * R;
  const diedLen = (diedPct / 100) * C;

  const seg = (
    key: "clean" | "died",
    color: string,
    dash: number,
    offset: number,
  ) => (
    <circle
      cx="70" cy="70" r={R}
      fill="none"
      stroke={color}
      strokeWidth={hover === key ? 20 : 16}
      strokeDasharray={`${dash} ${C - dash}`}
      strokeDashoffset={offset}
      transform="rotate(-90 70 70)"
      className="cursor-pointer transition-all duration-200"
      onMouseEnter={() => setHover(key)}
      onMouseLeave={() => setHover(null)}
      onClick={() => setHover(hover === key ? null : key)}
    />
  );

  const center =
    hover === "died"
      ? { big: `${diedPct.toFixed(0)}%`, small: `${died} run${died === 1 ? "" : "s"} with a death`, color: "#ff5252" }
      : hover === "clean"
        ? { big: `${cleanPct.toFixed(0)}%`, small: `${clean} clean run${clean === 1 ? "" : "s"}`, color: "#00e676" }
        : { big: `${diedPct.toFixed(0)}%`, small: "of runs had a death", color: "#ff5252" };

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2 className="font-semibold text-white">Deaths</h2>
          <p className="text-xs text-charcoal-300">
            Across the last {d.sampled} sampled runs — hover or tap a segment.
          </p>
        </div>
        <span className="chip border border-accent-red/40 bg-accent-red/10 text-accent-red">
          {d.total} total death{d.total === 1 ? "" : "s"}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-6 p-5">
        <div className="relative" style={{ width: 140, height: 140 }}>
          <svg viewBox="0 0 140 140" width={140} height={140}>
            <circle cx="70" cy="70" r={R} fill="none" stroke="#1d1d24" strokeWidth={16} />
            {seg("died", "#ff5252", diedLen, 0)}
            {seg("clean", "#00e676", C - diedLen, -diedLen)}
          </svg>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="font-mono text-2xl font-black" style={{ color: center.color }}>
              {center.big}
            </span>
            <span className="mt-0.5 max-w-[110px] text-[10px] leading-tight text-charcoal-300">
              {center.small}
            </span>
          </div>
        </div>
        <div className="space-y-2.5">
          <div className="flex items-center gap-2.5">
            <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: "#00e676" }} />
            <span className="text-sm text-white">Clean runs</span>
            <span className="font-mono text-sm text-charcoal-300">
              {clean} · {cleanPct.toFixed(0)}%
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: "#ff5252" }} />
            <span className="text-sm text-white">Runs with a death</span>
            <span className="font-mono text-sm text-charcoal-300">
              {died} · {diedPct.toFixed(0)}%
            </span>
          </div>
          <div className="border-t border-charcoal-500/60 pt-2.5 font-mono text-xs text-charcoal-300">
            avg{" "}
            <span className="font-bold text-white">
              {(d.total / d.sampled).toFixed(2)}
            </span>{" "}
            deaths per run
          </div>
        </div>
      </div>
    </div>
  );
}

/** Which slice of a phase's qualifying runs feeds the average. */
type SplitAvgMode = "best45" | "all";

/** Recompute per-phase splits from samples, optionally death-free. */
function splitsFromSamples(
  samples: ProfileData["splitSamples"],
  excludeDeaths: boolean,
  mode: SplitAvgMode,
): { splits: SplitData[] | null; used: number } {
  const rows = excludeDeaths ? samples.filter((s) => s.deaths === 0) : samples;
  if (rows.length === 0) return { splits: null, used: 0 };
  const splits = SPLIT_ORDER.map((key) => {
    // Each phase only averages the runs that qualified for that phase.
    const vals = rows
      .filter((s) => s.segments[key] !== undefined)
      .map((s) => ({ v: s.segments[key] as number, id: s.matchId }))
      .sort((a, b) => a.v - b.v);
    if (vals.length === 0) {
      return { key, avgMs: 0, bestMs: 0, bestMatchId: null };
    }
    // "best45" trims the slowest fifth as outliers; "all" keeps everything.
    const keep =
      mode === "all" ? vals.length : Math.max(1, Math.ceil(vals.length * 0.8));
    const best = vals.slice(0, keep);
    return {
      key,
      avgMs: Math.round(best.reduce((a, b) => a + b.v, 0) / best.length),
      bestMs: vals[0].v,
      bestMatchId: vals[0].id,
    };
  });
  return { splits, used: rows.length };
}

/* ── Profile ──────────────────────────────────────────────────────── */

type AvgMode = "threeQuarter" | "n" | "all";

function Profile({
  profile,
  currentSeason,
}: {
  profile: ProfileData;
  currentSeason: number | null;
}) {
  const router = useRouter();
  const s = profile.season;
  const [avgMode, setAvgMode] = useState<AvgMode>("threeQuarter");
  const [avgN, setAvgN] = useState(100);
  const [openMatch, setOpenMatch] = useState<number | null>(null);
  const [excludeDeaths, setExcludeDeaths] = useState(false);
  const [splitAvgMode, setSplitAvgMode] = useState<SplitAvgMode>("all");

  // Remember the last viewed player so returning to /analytics restores it.
  useEffect(() => {
    try {
      localStorage.setItem(LAST_PLAYER_KEY, profile.name);
    } catch {
      /* ignore storage errors */
    }
  }, [profile.name]);

  /** Re-request this profile with different server-side options. */
  const setParam = (patch: Record<string, string | null>) => {
    const p = new URLSearchParams();
    p.set("player", profile.name);
    if (profile.requestedSeason) p.set("season", String(profile.requestedSeason));
    if (profile.includesPrivate) p.set("private", "1");
    if (profile.sampleSize !== 100) p.set("samples", String(profile.sampleSize));
    for (const [k, v] of Object.entries(patch)) {
      if (v === null) p.delete(k);
      else p.set(k, v);
    }
    router.push(`/analytics?${p.toString()}`);
  };

  const sorted = useMemo(
    () => [...profile.completionTimes].sort((a, b) => a - b),
    [profile.completionTimes],
  );

  // "Average of Best …" — window is the best 3/4 (default), a chosen N, or all
  // completions. N larger than the pool simply behaves like "all".
  const avgWindow = useMemo(() => {
    if (sorted.length === 0) return 0;
    if (avgMode === "threeQuarter")
      return Math.max(1, Math.ceil((sorted.length * 3) / 4));
    if (avgMode === "all") return sorted.length;
    return Math.max(1, Math.min(avgN, sorted.length));
  }, [avgMode, avgN, sorted.length]);

  const avgBestMs = useMemo(() => {
    if (sorted.length === 0) return null;
    const slice = sorted.slice(0, avgWindow);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  }, [sorted, avgWindow]);

  // Splits recomputed client-side so pace can include or exclude runs with deaths.
  const { splits: effSplits, used: usedRuns } = useMemo(
    () =>
      splitsFromSamples(profile.splitSamples ?? [], excludeDeaths, splitAvgMode),
    [profile.splitSamples, excludeDeaths, splitAvgMode],
  );

  // Pace rank: the tier whose average completion time is closest to the
  // player's average pace (from sampled split timelines).
  const paceTotalMs = useMemo(
    () => (effSplits ? effSplits.reduce((sum, d) => sum + d.avgMs, 0) : null),
    [effSplits],
  );
  const paceTier = useMemo(
    () => (paceTotalMs !== null ? deservedTier(paceTotalMs) : null),
    [paceTotalMs],
  );

  const wr = winRate(s.wins, s.loses);
  const completionRate =
    s.playedMatches > 0 ? (s.completions / s.playedMatches) * 100 : 0;
  const tier = tierForElo(profile.elo);
  const tierColor = TIER_COLORS[tier];

  const fallbackAvatar = (
    <div
      className="flex h-[150px] w-24 shrink-0 items-center justify-center rounded-xl font-mono text-2xl font-black text-black"
      style={{ backgroundColor: tierColor, boxShadow: `0 0 24px -4px ${tierColor}88` }}
    >
      {profile.name.slice(0, 2).toUpperCase()}
    </div>
  );

  return (
    <div className="animate-fadeSlideUp space-y-6">
      {/* Back to search */}
      <button
        onClick={() => router.push("/analytics?menu=1")}
        className="group flex items-center gap-2 text-sm font-semibold text-charcoal-300 transition-colors duration-300 hover:text-accent-blue"
      >
        <span className="transition-transform duration-300 group-hover:-translate-x-0.5">←</span>
        Back to search
      </button>

      {/* Identity banner */}
      <div className="panel flex flex-wrap items-center gap-5 px-6 py-5">
        <SkinViewer uuid={profile.uuid} fallback={fallbackAvatar} />
        <div className="min-w-[260px] flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-white">
              {flagEmoji(profile.country)} {profile.name}
            </h1>
            <TierChip tier={tier} />
            {profile.eloRank !== null && (
              <span className="chip border border-accent-blue/40 bg-accent-blue/10 text-accent-blue">
                #{profile.eloRank} global
              </span>
            )}
          </div>

          {/* Key figures as labelled tiles — easier to scan than one long line */}
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {[
              { k: "Elo", v: profile.elo ?? "—", c: "text-white" },
              { k: "Peak", v: profile.peakElo ?? "—", c: "text-accent-blue" },
              { k: "Record", v: `${s.wins}W / ${s.loses}L`, c: "text-white" },
              { k: "Win rate", v: `${wr.toFixed(1)}%`, c: "text-accent-green" },
              { k: "Playtime", v: `${(s.playtimeMs / 3_600_000).toFixed(0)}h`, c: "text-white" },
            ].map((x) => (
              <div
                key={x.k}
                className="rounded-lg border border-charcoal-500/60 bg-charcoal-900/50 px-3 py-2"
              >
                <div className="font-mono text-[10px] uppercase tracking-widest text-charcoal-300">
                  {x.k}
                </div>
                <div className={`mt-0.5 font-mono text-sm font-bold ${x.c}`}>{x.v}</div>
              </div>
            ))}
          </div>

          <div className="mt-2 font-mono text-[10px] uppercase tracking-widest text-charcoal-300">
            drag the skin to rotate
          </div>
        </div>
      </div>

      {/* View controls */}
      <div className="panel flex flex-wrap items-center gap-3 px-5 py-3">
        <SeasonSelect
          value={profile.requestedSeason}
          max={currentSeason}
          onChange={(sn) =>
            setParam({ season: sn === currentSeason ? null : String(sn) })
          }
        />

        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-charcoal-500 bg-charcoal-700 px-3 py-2 text-sm text-charcoal-300 transition-colors duration-300 hover:text-white">
          <input
            type="checkbox"
            checked={profile.includesPrivate}
            onChange={(e) => setParam({ private: e.target.checked ? "1" : null })}
            className="h-3.5 w-3.5 accent-[#00e5ff]"
          />
          Include private rooms
        </label>

        <label className="flex items-center gap-2 rounded-lg border border-charcoal-500 bg-charcoal-700 px-3 py-1.5">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-charcoal-300">
            Sample
          </span>
          <select
            value={profile.sampleSize}
            onChange={(e) => setParam({ samples: e.target.value })}
            className="cursor-pointer bg-transparent font-mono text-sm font-bold text-white outline-none"
            title="How many recent matches to read timelines from"
          >
            {[20, 50, 100, 500].map((n) => (
              <option key={n} value={n} className="bg-charcoal-800">
                {n} runs
              </option>
            ))}
          </select>
        </label>

        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-charcoal-500 bg-charcoal-700 px-3 py-2 text-sm text-charcoal-300 transition-colors duration-300 hover:text-white">
          <input
            type="checkbox"
            checked={excludeDeaths}
            onChange={(e) => setExcludeDeaths(e.target.checked)}
            className="h-3.5 w-3.5 accent-[#00e676]"
          />
          Exclude runs with deaths
        </label>

        {profile.includesPrivate && (
          <span className="chip border border-accent-purple/40 bg-accent-purple/10 text-accent-purple">
            private rooms included
          </span>
        )}
      </div>

      {/* Top-line metrics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard
          label="Personal Best"
          value={s.pbMs !== null ? formatTime(s.pbMs) : "—"}
          sub="fastest ranked completion this season"
          accent="text-accent-green"
          glow
        />
        <StatCard
          label="Average of Best"
          value={avgBestMs !== null ? formatTime(avgBestMs) : "—"}
          accent="text-accent-blue"
          glow
          sub={
            <div className="mt-1">
              <div className="flex items-center gap-1">
                {(["threeQuarter", "n", "all"] as AvgMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setAvgMode(m)}
                    className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase transition-all duration-300 ${
                      avgMode === m
                        ? "bg-accent-teal/30 text-accent-blue"
                        : "bg-charcoal-600 text-charcoal-300 hover:text-white"
                    }`}
                  >
                    {m === "threeQuarter" ? "Best ¾" : m === "n" ? "N" : "All"}
                  </button>
                ))}
                {avgMode === "n" && (
                  <input
                    type="number"
                    min={1}
                    value={avgN}
                    onChange={(e) => setAvgN(Math.max(1, Number(e.target.value) || 1))}
                    className="w-12 rounded border border-charcoal-500 bg-charcoal-700 px-1 py-0.5 font-mono text-[10px] text-white outline-none focus:border-accent-blue/60"
                  />
                )}
              </div>
              <span className="mt-1 block">
                {avgMode === "all"
                  ? `all ${sorted.length} completions`
                  : `best ${avgWindow} of last ${sorted.length}`}
              </span>
            </div>
          }
        />
        <StatCard
          label="Pace Rank"
          value={
            paceTier ? (
              <span className="text-xl" style={{ color: TIER_COLORS[paceTier] }}>
                {paceTier}
              </span>
            ) : (
              "—"
            )
          }
          glow
          sub={
            paceTier && paceTotalMs !== null ? (
              <>
                avg pace{" "}
                <span className="font-mono text-white">{formatTime(paceTotalMs, false)}</span>{" "}
                vs {paceTier} avg{" "}
                <span className="font-mono text-white">
                  {formatTime(rankTotalMs(paceTier), false)}
                </span>
              </>
            ) : (
              "needs recent completions"
            )
          }
        />
        <StatCard
          label="Completions / Played"
          glow
          value={
            <>
              <span className="text-accent-green">{s.completions}</span>
              <span className="text-base text-charcoal-300"> / </span>
              <span className="text-white">{s.playedMatches}</span>
            </>
          }
          sub={
            <div className="mt-1.5">
              <Bar pct={completionRate} color="#00e676" />
              <span className="mt-1 block">
                {completionRate.toFixed(1)}% finished · {s.forfeits} forfeits ·{" "}
                {profile.lifetimeCompletions.toLocaleString()} lifetime
              </span>
            </div>
          }
        />
        <StatCard
          label="Current Streak"
          glow
          value={s.currentStreak > 0 ? `${s.currentStreak}` : "—"}
          sub={`season best ${s.bestStreak}`}
          accent="text-accent-amber"
        />
      </div>

      <EloSection profile={profile} />

      {/* How each phase average is computed */}
      <div className="panel flex flex-wrap items-center gap-3 px-5 py-3">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-charcoal-300">
          Split average
        </span>
        <div className="flex rounded-lg bg-charcoal-700 p-1">
          {([
            ["best45", "Best 4/5"],
            ["all", "All"],
          ] as [SplitAvgMode, string][]).map(([m, label]) => (
            <button
              key={m}
              onClick={() => setSplitAvgMode(m)}
              className={`btn-tab px-4 text-xs ${
                splitAvgMode === m
                  ? "bg-accent-teal/30 text-accent-blue"
                  : "text-charcoal-300 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="text-xs text-charcoal-300">
          {splitAvgMode === "best45"
            ? "Trims the slowest fifth of each phase, so one bad run doesn't skew the pace."
            : "Averages every qualifying run, outliers included."}
        </span>
      </div>

      <SplitChart
        profile={profile}
        paceTier={paceTier}
        splits={effSplits}
        usedRuns={usedRuns}
        onOpenMatch={setOpenMatch}
        avgMode={splitAvgMode}
      />
      <DeathDonut profile={profile} />
      <RankComparisonTable splits={effSplits} />
      <SeedBreakdown profile={profile} />
      <RecentMatches profile={profile} onOpen={setOpenMatch} />

      {openMatch !== null && (
        <MatchDetail matchId={openMatch} onClose={() => setOpenMatch(null)} />
      )}
    </div>
  );
}

/* ── Module root ──────────────────────────────────────────────────── */

export default function PlayerAnalytics({
  profile,
  error,
  roster,
  forceMenu = false,
  currentSeason = null,
}: {
  profile?: ProfileData;
  error?: string;
  roster: string[];
  forceMenu?: boolean;
  currentSeason?: number | null;
}) {
  const router = useRouter();
  const [restoring, setRestoring] = useState(false);

  // No player in the URL: unless the search menu was explicitly requested,
  // restore the last player viewed this session.
  useEffect(() => {
    // Reached a terminal state (profile shown, error, or menu forced) — the
    // restore placeholder should never linger past these.
    if (profile || error || forceMenu) {
      setRestoring(false);
      return;
    }
    let last: string | null = null;
    try {
      last = localStorage.getItem(LAST_PLAYER_KEY);
    } catch {
      /* ignore */
    }
    if (last) {
      setRestoring(true);
      router.replace(`/analytics?player=${encodeURIComponent(last)}`);
    }
  }, [profile, error, forceMenu, router]);

  if (!profile && restoring) {
    return (
      <div className="panel animate-fadeSlideUp px-8 py-16 text-center font-mono text-sm text-charcoal-300">
        restoring last runner…
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Player Analytics"
        subtitle="Live MCSR Ranked deep-dive — pacing, consistency, and split efficiency for any runner."
        right={profile ? <PlayerSearch compact roster={roster} /> : undefined}
      />
      {profile ? (
        <Profile profile={profile} currentSeason={currentSeason} />
      ) : (
        <div className="panel animate-fadeSlideUp px-8 py-16 text-center">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-teal/15 text-accent-blue">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </div>
          <h2 className="mb-2 text-lg font-semibold text-white">
            {error ? "Runner not found" : "Find a runner"}
          </h2>
          <p className="mx-auto mb-6 max-w-md text-sm text-charcoal-300">
            {error ??
              "Search any MCSR Ranked player — PB, configurable Average of Best, pace rank, and per-phase splits pulled live from their match history."}
          </p>
          <PlayerSearch roster={roster} />
          {roster.length > 0 && (
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {roster.slice(0, 5).map((n) => (
                <a
                  key={n}
                  href={`/analytics?player=${encodeURIComponent(n)}`}
                  className="chip border border-charcoal-500 bg-charcoal-700 text-charcoal-300 transition-all duration-300 hover:border-accent-blue/50 hover:text-accent-blue"
                >
                  {n}
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
