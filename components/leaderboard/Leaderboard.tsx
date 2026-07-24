"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BoardsData, EloEntry } from "@/lib/api";
import { formatTime } from "@/lib/format";
import { flagEmoji, prettyEnum, tierForElo } from "@/lib/meta";
import { TierBadge } from "@/components/ui";

type Tab = "elo" | "times" | "weekly";
type EloSort = "rank" | "elo" | "phase";

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

function Th({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return (
    <th className={`px-4 py-3 font-mono text-[11px] font-semibold uppercase tracking-widest text-charcoal-300 ${className}`}>
      {children}
    </th>
  );
}

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
    <Link
      href={`/analytics?player=${encodeURIComponent(name)}`}
      className="group/name flex items-center gap-2.5 font-semibold text-white transition-colors duration-300 hover:text-accent-blue"
    >
      <TierBadge tier={tierForElo(elo)} />
      <span className="w-5 text-center">{flagEmoji(country) || "·"}</span>
      {name}
      <span className="text-[10px] uppercase tracking-wider text-charcoal-300 opacity-0 transition-opacity duration-300 group-hover/name:opacity-100">
        profile →
      </span>
    </Link>
  );
}

function RankCell({ rank }: { rank: number }) {
  return (
    <td className={`px-4 py-3 font-mono text-sm font-bold ${RANK_STYLES[rank] ?? "text-charcoal-300"}`}>
      #{rank}
    </td>
  );
}

export default function Leaderboard({ boards }: { boards: BoardsData }) {
  const [tab, setTab] = useState<Tab>("elo");
  const [query, setQuery] = useState("");
  const [eloSort, setEloSort] = useState<EloSort>("rank");
  const [sortDir, setSortDir] = useState<1 | -1>(1);

  const q = query.trim().toLowerCase();
  const match = (name: string) => q === "" || name.toLowerCase().includes(q);

  const eloRows = useMemo(() => {
    const valueOf = (e: EloEntry) =>
      eloSort === "rank" ? e.rank : eloSort === "elo" ? e.elo : e.phasePoint;
    return boards.elo
      .filter((e) => match(e.name))
      .sort((a, b) => (valueOf(a) - valueOf(b)) * sortDir);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boards.elo, q, eloSort, sortDir]);

  const timeRows = useMemo(
    () => boards.times.filter((e) => match(e.name)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [boards.times, q],
  );
  const weeklyRows = useMemo(
    () => boards.weekly.filter((e) => match(e.name)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [boards.weekly, q],
  );

  const handleEloSort = (k: EloSort) => {
    if (k === eloSort) setSortDir((d) => (d === 1 ? -1 : 1));
    else {
      setEloSort(k);
      setSortDir(k === "rank" ? 1 : -1);
    }
  };

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
            ends {new Date(boards.weeklyEndsAt * 1000).toISOString().slice(0, 10)}
          </span>
        )}

        <div className="relative ml-auto">
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
            className="w-56 rounded-lg border border-charcoal-500 bg-charcoal-700 py-2 pl-9 pr-3 text-sm text-white placeholder-charcoal-300 outline-none transition-all duration-300 focus:border-accent-blue/60 focus:shadow-glow-blue"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        {/* ── Season Elo ── */}
        {tab === "elo" && (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-charcoal-500/60 bg-charcoal-900/50">
                {(
                  [
                    ["rank", "Rank"],
                    [null, "Runner"],
                    ["elo", "Elo"],
                    ["phase", "Phase Pts"],
                  ] as [EloSort | null, string][]
                ).map(([key, label]) => (
                  <Th key={label}>
                    {key ? (
                      <button
                        onClick={() => handleEloSort(key)}
                        className={`inline-flex items-center gap-1 uppercase transition-colors duration-300 ${
                          eloSort === key ? "text-accent-blue" : "hover:text-white"
                        }`}
                      >
                        {label}
                        <span className={`text-[9px] ${eloSort === key ? "" : "opacity-0"}`}>
                          {sortDir === 1 ? "▲" : "▼"}
                        </span>
                      </button>
                    ) : (
                      label
                    )}
                  </Th>
                ))}
                <Th>Tier</Th>
              </tr>
            </thead>
            <tbody>
              {eloRows.map((e) => (
                <tr key={e.uuid} className="border-b border-charcoal-600/40 transition-all duration-300 hover:bg-accent-teal/10">
                  <RankCell rank={e.rank} />
                  <td className="px-4 py-3">
                    <RunnerCell name={e.name} country={e.country} elo={e.elo} />
                  </td>
                  <td className="px-4 py-3 font-mono text-sm font-bold text-white">{e.elo}</td>
                  <td className="px-4 py-3 font-mono text-sm text-charcoal-300">{e.phasePoint}</td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs" style={{ color: undefined }}>
                      {tierForElo(e.elo)}
                    </span>
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
                <Th className="w-20">Rank</Th>
                <Th>Runner</Th>
                <Th>Time</Th>
                <Th>Overworld</Th>
                <Th>Bastion</Th>
                <Th>Date</Th>
              </tr>
            </thead>
            <tbody>
              {timeRows.map((e) => (
                <tr key={`${e.rank}-${e.uuid}`} className="border-b border-charcoal-600/40 transition-all duration-300 hover:bg-accent-teal/10">
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
                <Th className="w-20">Rank</Th>
                <Th>Runner</Th>
                <Th>Time</Th>
                <Th>Elo</Th>
              </tr>
            </thead>
            <tbody>
              {weeklyRows.map((e) => (
                <tr key={`${e.rank}-${e.uuid}`} className="border-b border-charcoal-600/40 transition-all duration-300 hover:bg-accent-teal/10">
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
