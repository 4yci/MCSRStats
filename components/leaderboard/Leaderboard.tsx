"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BoardsData } from "@/lib/api";
import { formatTime } from "@/lib/format";
import { flagEmoji, prettyEnum, TIER_COLORS, tierForElo } from "@/lib/meta";
import { SeasonSelect, TierBadge } from "@/components/ui";

type Tab = "elo" | "times" | "weekly";

const TABS: { id: Tab; label: string }[] = [
  { id: "elo", label: "Season Elo" },
  { id: "times", label: "Best Times" },
  { id: "weekly", label: "Weekly Race" },
];

const RANK_STYLES: Record<number, string> = {
  1: "text-accent-blue drop-shadow-[0_0_8px_rgba(0,229,255,0.6)]",
  2: "text-accent-green",
  3: "text-accent-amber",
};

/** Default sort per tab: which column, ascending (rank) or the metric. */
const DEFAULT_SORT: Record<Tab, string> = {
  elo: "rank",
  times: "rank",
  weekly: "rank",
};

function RunnerCell({
  name,
  country,
  elo,
}: {
  name: string;
  country: string | null;
  elo: number | null;
}) {
  return (
    <span className="flex items-center gap-2.5 font-semibold text-white">
      <TierBadge tier={tierForElo(elo)} />
      <span className="w-5 text-center">{flagEmoji(country) || "·"}</span>
      <span className="group-hover:text-accent-blue">{name}</span>
    </span>
  );
}

export default function Leaderboard({
  boards,
  currentSeason,
}: {
  boards: BoardsData;
  currentSeason: number | null;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("elo");
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<string>("rank");
  const [sortDir, setSortDir] = useState<1 | -1>(1);

  // Reset sort when switching tabs.
  useEffect(() => {
    setSortKey(DEFAULT_SORT[tab]);
    setSortDir(1);
  }, [tab]);

  const q = query.trim().toLowerCase();
  const match = (name: string) => q === "" || name.toLowerCase().includes(q);

  const toggleSort = (k: string) => {
    if (k === sortKey) setSortDir((d) => (d === 1 ? -1 : 1));
    else {
      setSortKey(k);
      setSortDir(k === "rank" ? 1 : -1);
    }
  };

  const openProfile = (name: string) =>
    router.push(`/analytics?player=${encodeURIComponent(name)}`);

  /** Each board keeps its own scope in the URL, so switching one never
   *  silently re-scopes the others. */
  const buildUrl = (patch: Record<string, string | null>) => {
    const p = new URLSearchParams();
    if (boards.eloSeason) p.set("season", String(boards.eloSeason));
    if (boards.timesSeason === "all") p.set("times", "all");
    else if (typeof boards.timesSeason === "number")
      p.set("times", String(boards.timesSeason));
    if (boards.weekId && boards.weekId !== boards.latestWeekId)
      p.set("week", String(boards.weekId));
    for (const [k, v] of Object.entries(patch)) {
      if (v === null) p.delete(k);
      else p.set(k, v);
    }
    const q = p.toString();
    return q ? `/?${q}` : "/";
  };

  const goEloSeason = (s: number) =>
    router.push(buildUrl({ season: s === currentSeason ? null : String(s) }));
  const goTimes = (v: string) => router.push(buildUrl({ times: v }));
  const goWeek = (id: number) =>
    router.push(
      buildUrl({ week: id === boards.latestWeekId ? null : String(id) }),
    );

  const sortBy = <T,>(rows: T[], valueOf: (r: T) => number) =>
    [...rows].sort((a, b) => (valueOf(a) - valueOf(b)) * sortDir);

  const eloRows = useMemo(() => {
    const filtered = boards.elo.filter((e) => match(e.name));
    const valueOf = (e: (typeof boards.elo)[number]) =>
      sortKey === "elo" ? e.elo : sortKey === "phase" ? e.phasePoint : e.rank;
    return sortBy(filtered, valueOf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boards.elo, q, sortKey, sortDir]);

  const timeRows = useMemo(() => {
    const filtered = boards.times.filter((e) => match(e.name));
    const valueOf = (e: (typeof boards.times)[number]) =>
      sortKey === "time" ? e.timeMs : sortKey === "date" ? e.dateSec ?? 0 : e.rank;
    return sortBy(filtered, valueOf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boards.times, q, sortKey, sortDir]);

  const weeklyRows = useMemo(() => {
    const filtered = boards.weekly.filter((e) => match(e.name));
    const valueOf = (e: (typeof boards.weekly)[number]) =>
      sortKey === "time" ? e.timeMs : sortKey === "elo" ? e.elo ?? 0 : e.rank;
    return sortBy(filtered, valueOf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boards.weekly, q, sortKey, sortDir]);

  const SortableTh = ({
    col,
    label,
    className = "",
  }: {
    col: string;
    label: string;
    className?: string;
  }) => (
    <th className={`px-4 py-3 ${className}`}>
      <button
        onClick={() => toggleSort(col)}
        className={`inline-flex items-center gap-1 font-mono text-[11px] font-semibold uppercase tracking-widest transition-colors duration-300 ${
          sortKey === col ? "text-accent-blue" : "text-charcoal-300 hover:text-white"
        }`}
      >
        {label}
        <span className={`text-[9px] ${sortKey === col ? "" : "opacity-0"}`}>
          {sortDir === 1 ? "▲" : "▼"}
        </span>
      </button>
    </th>
  );

  const PlainTh = ({ label }: { label: string }) => (
    <th className="px-4 py-3 font-mono text-[11px] font-semibold uppercase tracking-widest text-charcoal-300">
      {label}
    </th>
  );

  const rowClass =
    "group cursor-pointer border-b border-charcoal-600/40 transition-colors duration-300 hover:bg-accent-teal/10";

  const RankCell = ({ rank }: { rank: number }) => (
    <td className={`px-4 py-3 font-mono text-sm font-bold ${RANK_STYLES[rank] ?? "text-charcoal-300"}`}>
      #{rank}
    </td>
  );

  if (boards.error) {
    return (
      <div className="panel px-8 py-14 text-center">
        <h2 className="mb-2 text-lg font-semibold text-accent-red">Live data unavailable</h2>
        <p className="mx-auto max-w-md text-sm text-charcoal-300">{boards.error}</p>
      </div>
    );
  }

  const empty = (
    <tr>
      <td colSpan={7} className="px-4 py-12 text-center text-sm text-charcoal-300">
        No runners match — clear the search.
      </td>
    </tr>
  );

  return (
    <div className="panel animate-fadeSlideUp overflow-hidden">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 border-b border-charcoal-500/60 px-5 py-4">
        <div className="flex rounded-lg bg-charcoal-700 p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`btn-tab ${
                tab === t.id
                  ? "bg-accent-teal/30 text-accent-blue shadow-glow-blue"
                  : "text-charcoal-300 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "weekly" && boards.weeklyEndsAt && (
          <span className="chip border border-accent-amber/40 bg-accent-amber/10 text-accent-amber">
            ended {new Date(boards.weeklyEndsAt * 1000).toISOString().slice(0, 10)}
          </span>
        )}

        <div className="ml-auto flex items-center gap-3">
          {/* Each board carries its own scope control. */}
          {tab === "elo" && (
            <SeasonSelect
              value={boards.eloSeason}
              max={currentSeason}
              onChange={goEloSeason}
            />
          )}

          {tab === "times" && currentSeason && (
            <label className="flex items-center gap-2 rounded-lg border border-charcoal-500 bg-charcoal-700 px-3 py-1.5">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-charcoal-300">
                Records
              </span>
              <select
                value={
                  boards.timesSeason === "all"
                    ? "all"
                    : String(boards.timesSeason ?? currentSeason)
                }
                onChange={(e) => goTimes(e.target.value)}
                className="cursor-pointer bg-transparent font-mono text-sm font-bold text-white outline-none"
              >
                <option value="all" className="bg-charcoal-800">
                  All time
                </option>
                {Array.from({ length: currentSeason }, (_, i) => currentSeason - i).map(
                  (s) => (
                    <option key={s} value={s} className="bg-charcoal-800">
                      Season {s}
                      {s === currentSeason ? " · current" : ""}
                    </option>
                  ),
                )}
              </select>
            </label>
          )}

          {tab === "weekly" && boards.latestWeekId && (
            <label className="flex items-center gap-2 rounded-lg border border-charcoal-500 bg-charcoal-700 px-3 py-1.5">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-charcoal-300">
                Week
              </span>
              <select
                value={boards.weekId ?? boards.latestWeekId}
                onChange={(e) => goWeek(Number(e.target.value))}
                className="cursor-pointer bg-transparent font-mono text-sm font-bold text-white outline-none"
              >
                {Array.from(
                  { length: boards.latestWeekId },
                  (_, i) => boards.latestWeekId! - i,
                ).map((w) => (
                  <option key={w} value={w} className="bg-charcoal-800">
                    #{w}
                    {w === boards.latestWeekId ? " · current" : ""}
                  </option>
                ))}
              </select>
            </label>
          )}
          <div className="relative">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-300"
              width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search runner…"
              className="w-44 rounded-lg border border-charcoal-500 bg-charcoal-700 py-2 pl-9 pr-3 text-sm text-white placeholder-charcoal-300 outline-none transition-all duration-300 focus:border-accent-blue/60 focus:shadow-glow-blue sm:w-56"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        {/* ── Season Elo ── */}
        {tab === "elo" && (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-charcoal-500/60 bg-charcoal-900/50">
                <SortableTh col="rank" label="#" className="w-16" />
                <PlainTh label="Runner" />
                <SortableTh col="elo" label="Elo" />
                <SortableTh col="phase" label="Phase Points" />
                <PlainTh label="Rank" />
              </tr>
            </thead>
            <tbody>
              {eloRows.map((e) => (
                <tr key={e.uuid} className={rowClass} onClick={() => openProfile(e.name)}>
                  <RankCell rank={e.rank} />
                  <td className="px-4 py-3">
                    <RunnerCell name={e.name} country={e.country} elo={e.elo} />
                  </td>
                  <td className="px-4 py-3 font-mono text-sm font-bold text-white">{e.elo}</td>
                  <td className="px-4 py-3 font-mono text-sm text-charcoal-300">{e.phasePoint}</td>
                  <td className="px-4 py-3 font-mono text-xs font-semibold" style={{ color: TIER_COLORS[tierForElo(e.elo)] }}>
                    {tierForElo(e.elo)}
                  </td>
                </tr>
              ))}
              {eloRows.length === 0 && empty}
            </tbody>
          </table>
        )}

        {/* ── Best Times ── */}
        {tab === "times" && (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-charcoal-500/60 bg-charcoal-900/50">
                <SortableTh col="rank" label="#" className="w-16" />
                <PlainTh label="Runner" />
                <SortableTh col="time" label="Time" />
                <PlainTh label="Overworld" />
                <PlainTh label="Bastion" />
                <SortableTh col="date" label="Date" />
              </tr>
            </thead>
            <tbody>
              {timeRows.map((e) => (
                <tr key={`${e.rank}-${e.uuid}`} className={rowClass} onClick={() => openProfile(e.name)}>
                  <RankCell rank={e.rank} />
                  <td className="px-4 py-3">
                    <RunnerCell name={e.name} country={e.country} elo={e.elo} />
                  </td>
                  <td className="px-4 py-3 font-mono text-sm font-bold text-accent-green">
                    {formatTime(e.timeMs)}
                  </td>
                  <td className="px-4 py-3 text-xs text-charcoal-300">{prettyEnum(e.overworld)}</td>
                  <td className="px-4 py-3 text-xs text-charcoal-300">{prettyEnum(e.bastion)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-charcoal-300">
                    {e.dateSec ? new Date(e.dateSec * 1000).toISOString().slice(0, 10) : "—"}
                  </td>
                </tr>
              ))}
              {timeRows.length === 0 && empty}
            </tbody>
          </table>
        )}

        {/* ── Weekly Race ── */}
        {tab === "weekly" && (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-charcoal-500/60 bg-charcoal-900/50">
                <SortableTh col="rank" label="#" className="w-16" />
                <PlainTh label="Runner" />
                <SortableTh col="time" label="Time" />
                <SortableTh col="elo" label="Elo" />
              </tr>
            </thead>
            <tbody>
              {weeklyRows.map((e) => (
                <tr key={`${e.rank}-${e.uuid}`} className={rowClass} onClick={() => openProfile(e.name)}>
                  <RankCell rank={e.rank} />
                  <td className="px-4 py-3">
                    <RunnerCell name={e.name} country={e.country} elo={e.elo} />
                  </td>
                  <td className="px-4 py-3 font-mono text-sm font-bold text-accent-green">
                    {formatTime(e.timeMs)}
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-charcoal-300">{e.elo ?? "—"}</td>
                </tr>
              ))}
              {weeklyRows.length === 0 && empty}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
