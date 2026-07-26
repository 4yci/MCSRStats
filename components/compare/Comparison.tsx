"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ProfileData } from "@/lib/api";
import { formatSegment, formatTime, winRate } from "@/lib/format";
import {
  flagEmoji,
  prettyEnum,
  SPLIT_META,
  TIER_COLORS,
  tierForElo,
} from "@/lib/meta";
import { SPLIT_ORDER } from "@/lib/types";
import { PageHeader, SeasonSelect, TierChip } from "@/components/ui";
import SkinViewer from "@/components/analytics/SkinViewer";
import MatchDetail from "@/components/analytics/MatchDetail";

const A_COLOR = "#00e5ff";
const B_COLOR = "#ffc400";

/* ── Runner picker ────────────────────────────────────────────────── */

function RunnerPicker({
  label,
  value,
  onChange,
  roster,
  color,
}: {
  label: string;
  value: string;
  onChange: (name: string) => void;
  roster: string[];
  color: string;
}) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return roster.filter((n) => n.toLowerCase().includes(q)).slice(0, 8);
  }, [query, roster]);

  return (
    <div className="relative flex-1">
      <div className="mb-1.5 flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-widest text-charcoal-300">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
        {label}
      </div>
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => e.key === "Enter" && onChange(query)}
        placeholder="Runner nickname…"
        className="w-full rounded-lg border border-charcoal-500 bg-charcoal-700 px-4 py-2.5 text-sm text-white placeholder-charcoal-300 outline-none transition-all duration-300 focus:border-accent-blue/60 focus:shadow-glow-blue"
      />
      {open && results.length > 0 && (
        <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-charcoal-500 bg-charcoal-850 shadow-2xl">
          {results.map((n) => (
            <button
              key={n}
              onMouseDown={() => {
                setQuery(n);
                onChange(n);
                setOpen(false);
              }}
              className="flex w-full items-center px-4 py-2 text-left text-sm font-semibold text-white transition-colors duration-200 hover:bg-accent-teal/15"
            >
              {n}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Runner header card ───────────────────────────────────────────── */

function RunnerHead({ profile, color }: { profile: ProfileData; color: string }) {
  const tier = tierForElo(profile.elo);
  const s = profile.season;
  const fallback = (
    <div
      className="flex h-[130px] w-20 shrink-0 items-center justify-center rounded-xl font-mono text-xl font-black text-black"
      style={{ backgroundColor: TIER_COLORS[tier] }}
    >
      {profile.name.slice(0, 2).toUpperCase()}
    </div>
  );
  return (
    <div className="flex items-center gap-4 border-t-2 pt-4" style={{ borderColor: color }}>
      <SkinViewer uuid={profile.uuid} fallback={fallback} />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="truncate text-xl font-bold text-white">
            {flagEmoji(profile.country)} {profile.name}
          </h2>
          <TierChip tier={tier} />
        </div>
        <div className="mt-1.5 space-y-1 font-mono text-xs text-charcoal-300">
          <div>
            Elo <span className="font-bold text-white">{profile.elo ?? "—"}</span>
            {profile.eloRank !== null && (
              <span className="text-charcoal-300"> · #{profile.eloRank} global</span>
            )}
          </div>
          <div>
            Season{" "}
            <span className="font-bold text-accent-green">{s.wins}W</span> /{" "}
            <span className="font-bold text-accent-red">{s.loses}L</span>{" "}
            ({winRate(s.wins, s.loses).toFixed(1)}%)
          </div>
          <div>
            PB <span className="font-bold text-accent-green">
              {s.pbMs !== null ? formatTime(s.pbMs) : "—"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Overlaid Elo trajectories ────────────────────────────────────── */

type EloWin = 30 | 60 | "all";

function fmtDay(sec: number): string {
  return new Date(sec * 1000).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function EloOverlay({ a, b }: { a: ProfileData; b: ProfileData }) {
  const [win, setWin] = useState<EloWin>(30);
  const [frac, setFrac] = useState<number | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const fullA = useMemo(
    () =>
      a.runs
        .filter((r) => r.eloAfter !== null && r.dateSec !== null)
        .map((r) => ({ date: r.dateSec as number, elo: r.eloAfter as number }))
        .reverse(),
    [a.runs],
  );
  const fullB = useMemo(
    () =>
      b.runs
        .filter((r) => r.eloAfter !== null && r.dateSec !== null)
        .map((r) => ({ date: r.dateSec as number, elo: r.eloAfter as number }))
        .reverse(),
    [b.runs],
  );
  const sa = win === "all" ? fullA : fullA.slice(-win);
  const sb = win === "all" ? fullB : fullB.slice(-win);

  if (sa.length < 2 || sb.length < 2) return null;

  const allElo = [...sa, ...sb].map((p) => p.elo);
  const minE = Math.min(...allElo);
  const maxE = Math.max(...allElo);
  const allDate = [...sa, ...sb].map((p) => p.date);
  const minD = Math.min(...allDate);
  const maxD = Math.max(...allDate);

  const W = 900;
  const H = 210;
  const padX = 10;
  const padT = 14;
  const padB = 10;
  const spanE = Math.max(1, maxE - minE);
  const spanD = Math.max(1, maxD - minD);
  const xAt = (d: number) => padX + ((d - minD) / spanD) * (W - padX * 2);
  const yAt = (e: number) => padT + (1 - (e - minE) / spanE) * (H - padT - padB);
  const pathOf = (s: { date: number; elo: number }[]) =>
    s.map((p, i) => `${i === 0 ? "M" : "L"}${xAt(p.date).toFixed(1)} ${yAt(p.elo).toFixed(1)}`).join(" ");

  const nearest = (s: { date: number; elo: number }[], d: number) =>
    s.reduce((best, p) => (Math.abs(p.date - d) < Math.abs(best.date - d) ? p : best), s[0]);
  const cursorDate = frac !== null ? minD + frac * spanD : null;
  const hpA = cursorDate !== null ? nearest(sa, cursorDate) : null;
  const hpB = cursorDate !== null ? nearest(sb, cursorDate) : null;

  const onMove = (e: React.MouseEvent) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    setFrac(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)));
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2 className="font-semibold text-white">Elo Trajectories</h2>
          <p className="text-xs text-charcoal-300">
            Both runners&apos; season ratings over the same time window — hover to compare.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 font-mono text-xs">
            <span className="flex items-center gap-1.5" style={{ color: A_COLOR }}>
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: A_COLOR }} />
              {a.name} {a.elo ?? ""}
            </span>
            <span className="flex items-center gap-1.5" style={{ color: B_COLOR }}>
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: B_COLOR }} />
              {b.name} {b.elo ?? ""}
            </span>
          </div>
          <div className="flex rounded-lg bg-charcoal-700 p-1">
            {([30, 60, "all"] as EloWin[]).map((w) => (
              <button
                key={w}
                onClick={() => {
                  setWin(w);
                  setFrac(null);
                }}
                className={`btn-tab px-3 text-xs ${
                  win === w ? "bg-accent-teal/30 text-accent-blue" : "text-charcoal-300 hover:text-white"
                }`}
              >
                {w === "all" ? "All" : w}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="p-5">
        <div ref={wrapRef} className="relative" onMouseMove={onMove} onMouseLeave={() => setFrac(null)}>
          {frac !== null && hpA && hpB && (
            <div
              className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-charcoal-400 bg-charcoal-850 px-3 py-2 shadow-xl"
              style={{ left: `${frac * 100}%`, top: -6 }}
            >
              <div className="whitespace-nowrap font-mono text-[11px] text-charcoal-300">{fmtDay(cursorDate!)}</div>
              <div className="whitespace-nowrap font-mono text-sm font-bold" style={{ color: A_COLOR }}>
                {a.name} {hpA.elo}
              </div>
              <div className="whitespace-nowrap font-mono text-sm font-bold" style={{ color: B_COLOR }}>
                {b.name} {hpB.elo}
              </div>
            </div>
          )}
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none">
            <line x1={padX} y1={yAt(maxE)} x2={W - padX} y2={yAt(maxE)} stroke="#26262f" strokeWidth={1} strokeDasharray="4 4" />
            <line x1={padX} y1={yAt(minE)} x2={W - padX} y2={yAt(minE)} stroke="#26262f" strokeWidth={1} strokeDasharray="4 4" />
            <text x={padX + 2} y={yAt(maxE) - 4} fill="#4a4a58" fontSize={11} fontFamily="monospace">{maxE}</text>
            <text x={padX + 2} y={yAt(minE) - 4} fill="#4a4a58" fontSize={11} fontFamily="monospace">{minE}</text>
            <path d={pathOf(sa)} fill="none" stroke={A_COLOR} strokeWidth={2} strokeLinejoin="round" />
            <path d={pathOf(sb)} fill="none" stroke={B_COLOR} strokeWidth={2} strokeLinejoin="round" />
            {frac !== null && hpA && hpB && (
              <>
                <line x1={xAt(cursorDate!)} y1={padT} x2={xAt(cursorDate!)} y2={H - padB} stroke="#ffffff" strokeWidth={1} strokeOpacity={0.35} />
                <circle cx={xAt(hpA.date)} cy={yAt(hpA.elo)} r={4.5} fill={A_COLOR} stroke="#0c0c0f" strokeWidth={1.5} />
                <circle cx={xAt(hpB.date)} cy={yAt(hpB.elo)} r={4.5} fill={B_COLOR} stroke="#0c0c0f" strokeWidth={1.5} />
              </>
            )}
            <circle cx={xAt(sa[sa.length - 1].date)} cy={yAt(sa[sa.length - 1].elo)} r={4} fill={A_COLOR} />
            <circle cx={xAt(sb[sb.length - 1].date)} cy={yAt(sb[sb.length - 1].elo)} r={4} fill={B_COLOR} />
          </svg>
        </div>
        <div className="mt-1 flex justify-between font-mono text-[10px] uppercase tracking-widest text-charcoal-300">
          <span>{fmtDay(minD)}</span>
          <span>{fmtDay(maxD)}</span>
        </div>
      </div>
    </div>
  );
}

/* ── Comparison dashboard ─────────────────────────────────────────── */

function Dashboard({
  a,
  b,
  onOpenMatch,
}: {
  a: ProfileData;
  b: ProfileData;
  onOpenMatch: (id: number) => void;
}) {
  // Head-to-head from A's match history vs B.
  const h2h = useMemo(() => {
    const nb = b.name.toLowerCase();
    const matches = a.runs.filter((r) => r.opponent.toLowerCase() === nb);
    let aw = 0;
    let bw = 0;
    let draws = 0;
    for (const r of matches) {
      if (r.draw) draws++;
      else if (r.won) aw++;
      else bw++;
    }
    return { matches, aw, bw, draws };
  }, [a.runs, b.name]);

  // Overlaid split averages.
  const splitRows = useMemo(() => {
    const am = new Map(a.splits?.map((s) => [s.key, s.avgMs]) ?? []);
    const bm = new Map(b.splits?.map((s) => [s.key, s.avgMs]) ?? []);
    const rows = SPLIT_ORDER.map((key) => ({
      key,
      a: am.get(key),
      b: bm.get(key),
    }));
    const maxSeg = Math.max(
      1,
      ...rows.flatMap((r) => [r.a ?? 0, r.b ?? 0]),
    );
    const aTotal = a.splits ? a.splits.reduce((s, d) => s + d.avgMs, 0) : null;
    const bTotal = b.splits ? b.splits.reduce((s, d) => s + d.avgMs, 0) : null;
    return { rows, maxSeg, aTotal, bTotal };
  }, [a.splits, b.splits]);

  return (
    <div className="animate-fadeSlideUp space-y-6">
      {/* Head-to-head banner */}
      <div className="panel px-6 py-5">
        <div className="mb-1 text-center font-mono text-[11px] uppercase tracking-[0.25em] text-charcoal-300">
          Head-to-Head Record
        </div>
        <div className="flex items-center justify-center gap-6">
          <span className="truncate text-right text-lg font-bold" style={{ color: A_COLOR }}>
            {a.name}
          </span>
          <span className="font-mono text-4xl font-black text-white">
            {h2h.aw} <span className="text-charcoal-300">–</span> {h2h.bw}
          </span>
          <span className="truncate text-left text-lg font-bold" style={{ color: B_COLOR }}>
            {b.name}
          </span>
        </div>
        <div className="mt-1 text-center text-xs text-charcoal-300">
          {h2h.matches.length > 0
            ? `${h2h.matches.length} direct match${h2h.matches.length === 1 ? "" : "es"} in loaded history${h2h.draws ? ` · ${h2h.draws} draw${h2h.draws === 1 ? "" : "s"}` : ""}`
            : "No direct ranked matches in the last 100 games of either runner"}
        </div>
      </div>

      {/* Runner heads */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="panel px-5 py-4">
          <RunnerHead profile={a} color={A_COLOR} />
        </div>
        <div className="panel px-5 py-4">
          <RunnerHead profile={b} color={B_COLOR} />
        </div>
      </div>

      {/* Elo trajectories */}
      <EloOverlay a={a} b={b} />

      {/* Split overlay */}
      <div className="panel">
        <div className="panel-header">
          <div>
            <h2 className="font-semibold text-white">Split Overlay &amp; Delta</h2>
            <p className="text-xs text-charcoal-300">
              Average phase pace, sampled from each runner&apos;s recent completions.
            </p>
          </div>
          <div className="flex items-center gap-4 font-mono text-xs">
            <span className="flex items-center gap-1.5" style={{ color: A_COLOR }}>
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: A_COLOR }} />
              {a.name}
            </span>
            <span className="flex items-center gap-1.5" style={{ color: B_COLOR }}>
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: B_COLOR }} />
              {b.name}
            </span>
          </div>
        </div>
        <div className="space-y-4 p-5">
          {a.splits === null || b.splits === null ? (
            <p className="py-6 text-center text-sm text-charcoal-300">
              Both runners need recent ranked completions with timeline data to overlay splits.
            </p>
          ) : (
            <>
              {splitRows.rows.map((row) => {
                const delta =
                  row.a !== undefined && row.b !== undefined ? row.a - row.b : null;
                return (
                  <div key={row.key}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: SPLIT_META[row.key].color }} />
                        <span className="text-sm font-semibold text-white">{SPLIT_META[row.key].label}</span>
                      </div>
                      {delta !== null && (
                        <span
                          className="font-mono text-xs font-bold"
                          style={{ color: delta <= 0 ? A_COLOR : B_COLOR }}
                        >
                          {delta === 0
                            ? "even"
                            : `${delta < 0 ? a.name : b.name} faster by ${formatSegment(Math.abs(delta))}`}
                        </span>
                      )}
                    </div>
                    {/* A bar */}
                    <div className="mb-1 flex items-center gap-2">
                      <div className="h-3.5 flex-1 overflow-hidden rounded-full bg-charcoal-700">
                        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${((row.a ?? 0) / splitRows.maxSeg) * 100}%`, backgroundColor: A_COLOR }} />
                      </div>
                      <span className="w-14 shrink-0 text-right font-mono text-xs text-white">
                        {row.a !== undefined ? formatSegment(row.a) : "—"}
                      </span>
                    </div>
                    {/* B bar */}
                    <div className="flex items-center gap-2">
                      <div className="h-3.5 flex-1 overflow-hidden rounded-full bg-charcoal-700">
                        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${((row.b ?? 0) / splitRows.maxSeg) * 100}%`, backgroundColor: B_COLOR }} />
                      </div>
                      <span className="w-14 shrink-0 text-right font-mono text-xs text-charcoal-300">
                        {row.b !== undefined ? formatSegment(row.b) : "—"}
                      </span>
                    </div>
                  </div>
                );
              })}
              {/* Totals */}
              {splitRows.aTotal !== null && splitRows.bTotal !== null && (
                <div className="flex items-center justify-between border-t border-charcoal-500/60 pt-4">
                  <span className="text-sm font-bold uppercase tracking-wide text-white">
                    Full Average Pace
                  </span>
                  <div className="flex items-center gap-4 font-mono text-sm font-bold">
                    <span style={{ color: A_COLOR }}>{formatTime(splitRows.aTotal, false)}</span>
                    <span className="text-charcoal-300">vs</span>
                    <span style={{ color: B_COLOR }}>{formatTime(splitRows.bTotal, false)}</span>
                    <span style={{ color: splitRows.aTotal <= splitRows.bTotal ? A_COLOR : B_COLOR }}>
                      Δ {formatSegment(Math.abs(splitRows.aTotal - splitRows.bTotal))}
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Direct matchups */}
      {h2h.matches.length > 0 && (
        <div className="panel overflow-hidden">
          <div className="panel-header">
            <h2 className="font-semibold text-white">Direct Matchups</h2>
            <span className="text-xs text-charcoal-300">click a match for its full timeline</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-charcoal-500/60">
                  {["Date", "Winner", "Time", "Seed", `${a.name} Elo`].map((h) => (
                    <th key={h} className="px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-charcoal-300">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {h2h.matches.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => onOpenMatch(r.id)}
                    className="cursor-pointer border-b border-charcoal-600/40 transition-colors duration-300 hover:bg-accent-teal/10"
                  >
                    <td className="px-4 py-2.5 font-mono text-xs text-charcoal-300">
                      {r.dateSec ? new Date(r.dateSec * 1000).toISOString().slice(0, 10) : "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      {r.draw ? (
                        <span className="chip border border-charcoal-500 bg-charcoal-700 text-charcoal-300">Draw</span>
                      ) : (
                        <span
                          className="font-semibold"
                          style={{ color: r.won ? A_COLOR : B_COLOR }}
                        >
                          {r.won ? a.name : b.name}
                          {r.forfeited ? " · FF" : ""}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-sm text-white">
                      {r.timeMs !== null && !r.forfeited ? formatTime(r.timeMs) : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-charcoal-300">
                      {prettyEnum(r.overworld)} · {prettyEnum(r.bastion)}
                    </td>
                    <td className={`px-4 py-2.5 font-mono text-xs font-bold ${(r.eloChange ?? 0) >= 0 ? "text-accent-green" : "text-accent-red"}`}>
                      {r.eloChange === null ? "—" : `${r.eloChange >= 0 ? "+" : ""}${r.eloChange}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Module root ──────────────────────────────────────────────────── */

export default function Comparison({
  a,
  b,
  roster,
  error,
  season = null,
  currentSeason = null,
}: {
  a?: ProfileData;
  b?: ProfileData;
  roster: string[];
  error?: string;
  season?: number | null;
  currentSeason?: number | null;
}) {
  const router = useRouter();
  const [nameA, setNameA] = useState(a?.name ?? "");
  const [nameB, setNameB] = useState(b?.name ?? "");
  const [openMatch, setOpenMatch] = useState<number | null>(null);

  const buildUrl = (na: string, nb: string, sn: number | null) => {
    const p = new URLSearchParams();
    if (na.trim()) p.set("a", na.trim());
    if (nb.trim()) p.set("b", nb.trim());
    if (sn) p.set("season", String(sn));
    return `/compare?${p.toString()}`;
  };

  const go = (na: string, nb: string) => {
    if (na.trim() && nb.trim()) router.push(buildUrl(na, nb, season));
  };

  return (
    <>
      <PageHeader
        title="Head-to-Head"
        subtitle="Compare two runners side by side — direct record, overlaid splits, and phase deltas."
      />

      {/* Pickers — raised above the content below so the autocomplete
          dropdown (trapped in this panel's backdrop-blur stacking context)
          renders over the dashboard / empty-state panel. */}
      <div className="panel relative z-30 mb-6 flex flex-wrap items-end gap-4 px-5 py-4">
        <RunnerPicker label="Runner A" value={nameA} onChange={setNameA} roster={roster} color={A_COLOR} />
        <RunnerPicker label="Runner B" value={nameB} onChange={setNameB} roster={roster} color={B_COLOR} />
        <button
          onClick={() => go(nameA, nameB)}
          disabled={!nameA.trim() || !nameB.trim()}
          className="rounded-lg bg-accent-teal/25 px-6 py-2.5 font-mono text-sm font-bold uppercase tracking-widest text-accent-blue transition-all duration-300 hover:bg-accent-teal/40 hover:shadow-glow-blue disabled:cursor-not-allowed disabled:opacity-40"
        >
          Compare →
        </button>
        <div className="pb-0.5">
          <SeasonSelect
            value={season}
            max={currentSeason}
            onChange={(sn) =>
              router.push(
                buildUrl(nameA, nameB, sn === currentSeason ? null : sn),
              )
            }
          />
        </div>
      </div>

      {error && (
        <div className="panel px-8 py-10 text-center text-sm text-accent-red">{error}</div>
      )}

      {a && b ? (
        <Dashboard a={a} b={b} onOpenMatch={setOpenMatch} />
      ) : (
        !error && (
          <div className="panel px-8 py-16 text-center">
            <h2 className="mb-2 text-lg font-semibold text-white">Pick two runners</h2>
            <p className="mx-auto max-w-md text-sm text-charcoal-300">
              Choose a runner for each side to see their head-to-head record, an
              overlay of their average splits, and the deltas between every phase.
            </p>
          </div>
        )
      )}

      {openMatch !== null && (
        <MatchDetail matchId={openMatch} onClose={() => setOpenMatch(null)} />
      )}
    </>
  );
}
