"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { MatchDetailData } from "@/lib/api";
import { formatTime } from "@/lib/format";
import { prettyEnum } from "@/lib/meta";

/* ── Event catalog: label, detail level, chip color ────────────────
   Levels: 0 = Low, 1 = Med, 2 = High, 3 = All (unknown types land here) */

const EVENTS: Record<string, { label: string; level: 0 | 1 | 2; color?: string }> = {
  "story.enter_the_nether": { label: "nether enter", level: 0, color: "#ff5252" },
  "nether.find_bastion": { label: "bastion", level: 0, color: "#ff9100" },
  "nether.find_fortress": { label: "fortress", level: 0, color: "#ffc400" },
  "projectelo.timeline.blind_travel": { label: "blind", level: 0, color: "#b388ff" },
  "story.follow_ender_eye": { label: "stronghold", level: 0, color: "#00e5ff" },
  "story.enter_the_end": { label: "end enter", level: 0, color: "#008080" },
  "projectelo.timeline.dragon_death": { label: "dragon death", level: 0, color: "#00e676" },
  "projectelo.timeline.death": { label: "death", level: 0, color: "#ff5252" },
  "projectelo.timeline.reset": { label: "reset", level: 0, color: "#ffc400" },
  "end.kill_dragon": { label: "kill dragon", level: 1, color: "#00e676" },
  "nether.obtain_blaze_rod": { label: "first rod", level: 1, color: "#b388ff" },
  "nether.loot_bastion": { label: "bastion loot", level: 1 },
  "nether.obtain_crying_obsidian": { label: "crying obsidian", level: 1 },
  "story.form_obsidian": { label: "obsidian", level: 1 },
  "story.lava_bucket": { label: "lava bucket", level: 2 },
  "story.mine_diamond": { label: "diamond", level: 2 },
  "story.smelt_iron": { label: "smelt iron", level: 2 },
  "story.iron_tools": { label: "iron tools", level: 2 },
  "story.mine_stone": { label: "stone", level: 2 },
  "nether.distract_piglin": { label: "piglin barter", level: 2 },
  "adventure.kill_a_mob": { label: "mob kill", level: 2 },
  "adventure.shoot_arrow": { label: "arrow hit", level: 2 },
};

const LEVELS = ["Low", "Med", "High", "All"] as const;

function eventInfo(type: string) {
  const known = EVENTS[type];
  if (known) return known;
  const label = type.split(".").pop()!.replace(/_/g, " ");
  return { label, level: 3 as const, color: undefined };
}

interface Row {
  time: number;
  label: string;
  color: string | null;
  level: number;
  type: string;
  occurrence: number;
}

function buildRows(
  detail: MatchDetailData,
  uuid: string,
  maxLevel: number,
): Row[] {
  const mine = detail.timelines
    .filter((t) => t.uuid === uuid)
    .sort((a, b) => a.time - b.time);
  const counts = new Map<string, number>();
  const rows: Row[] = [];
  for (const e of mine) {
    const info = eventInfo(e.type);
    if (info.level > maxLevel) continue;
    const n = (counts.get(info.label) ?? 0) + 1;
    counts.set(info.label, n);
    rows.push({
      time: e.time,
      label: n > 1 ? `${info.label} ${n}` : info.label,
      color: info.color ?? null,
      level: info.level,
      type: e.type,
      occurrence: n,
    });
  }
  // Terminal entry from the match result.
  if (detail.result.time !== null) {
    const won = detail.result.uuid === uuid;
    rows.push({
      time: detail.result.time,
      label: won ? "finish" : detail.forfeited ? "forfeit" : "loss",
      color: won ? "#00e676" : "#ff5252",
      level: 0,
      type: "terminal",
      occurrence: 1,
    });
  }
  return rows;
}

/** Segmented pace bar from a player's Low-level checkpoints. */
function PhaseBar({ detail, uuid }: { detail: MatchDetailData; uuid: string }) {
  const rows = buildRows(detail, uuid, 0);
  const end =
    detail.result.time ?? (rows.length ? rows[rows.length - 1].time : 1);
  let prev = 0;
  return (
    <div className="flex h-3 w-full overflow-hidden rounded-full bg-charcoal-700">
      {rows.map((r, i) => {
        const w = Math.max(0, ((r.time - prev) / end) * 100);
        prev = r.time;
        return (
          <div
            key={i}
            title={`${r.label} — ${formatTime(r.time, false)}`}
            style={{ width: `${w}%`, backgroundColor: r.color ?? "#33333e" }}
            className="h-full"
          />
        );
      })}
    </div>
  );
}

function relTime(dateSec: number | null): string {
  if (!dateSec) return "";
  const d = Math.floor(Date.now() / 1000 - dateSec);
  if (d < 3600) return `${Math.max(1, Math.floor(d / 60))}m ago`;
  if (d < 86_400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86_400)}d ago`;
}

function fmtDelta(ms: number): string {
  return `${ms < 0 ? "-" : "+"}${formatTime(Math.abs(ms), false)}`;
}

/* ── Modal ────────────────────────────────────────────────────────── */

export default function MatchDetail({
  matchId,
  onClose,
}: {
  matchId: number;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<MatchDetailData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [level, setLevel] = useState(1); // Med

  useEffect(() => {
    let alive = true;
    fetch(`/api/match/${matchId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`${r.status}`))))
      .then((d) => alive && setDetail(d))
      .catch(() => alive && setError("Couldn't load match detail."));
    return () => {
      alive = false;
    };
  }, [matchId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Winner first, like the reference layout.
  const players = useMemo(() => {
    if (!detail) return [];
    return [...detail.players].sort((a, b) => {
      const aw = detail.result.uuid === a.uuid ? 0 : 1;
      const bw = detail.result.uuid === b.uuid ? 0 : 1;
      return aw - bw;
    });
  }, [detail]);

  const columns = useMemo(
    () =>
      detail
        ? players.map((p) => buildRows(detail, p.uuid, level))
        : [],
    [detail, players, level],
  );

  /** Delta vs the other player for shared Low checkpoints (left column only). */
  const deltaFor = (row: Row): number | null => {
    if (row.level !== 0 || row.type === "terminal" || columns.length < 2) return null;
    const other = columns[1].find(
      (r) => r.type === row.type && r.occurrence === row.occurrence,
    );
    return other ? row.time - other.time : null;
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="animate-fadeSlideUp flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-charcoal-400 bg-charcoal-850 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {error && (
          <div className="p-10 text-center text-sm text-accent-red">{error}</div>
        )}
        {!detail && !error && (
          <div className="p-10 text-center font-mono text-sm text-charcoal-300">
            loading match…
          </div>
        )}

        {detail && (
          <>
            {/* Header */}
            <div className="flex flex-wrap items-center gap-3 border-b border-charcoal-500/60 px-5 py-4">
              <span className="font-mono text-2xl font-black text-white">
                {detail.result.time !== null ? formatTime(detail.result.time) : "—"}
              </span>
              <span className="text-xs text-charcoal-300">· {relTime(detail.date)}</span>
              <span className="chip border border-accent-purple/40 bg-accent-purple/10 text-accent-purple">
                {prettyEnum(detail.seed.overworld)}
              </span>
              <span className="chip border border-accent-amber/40 bg-accent-amber/10 text-accent-amber">
                {prettyEnum(detail.seed.bastion)} Bastion
              </span>
              <button
                onClick={onClose}
                className="ml-auto rounded-lg px-2.5 py-1 font-mono text-lg text-charcoal-300 transition-colors duration-300 hover:bg-charcoal-600 hover:text-white"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto">
              {/* Phase bars */}
              <div className="space-y-2 border-b border-charcoal-500/60 px-5 py-4">
                {players.map((p) => (
                  <div key={p.uuid} className="flex items-center gap-3">
                    <span className="w-7 shrink-0 rounded bg-charcoal-600 py-0.5 text-center font-mono text-[10px] font-bold text-white">
                      {p.nickname.slice(0, 2).toUpperCase()}
                    </span>
                    <PhaseBar detail={detail} uuid={p.uuid} />
                  </div>
                ))}
              </div>

              {/* Player columns */}
              <div className="grid gap-6 px-5 py-4 sm:grid-cols-2">
                {players.map((p, pi) => {
                  const winner = detail.result.uuid === p.uuid;
                  return (
                    <div key={p.uuid}>
                      <div className="mb-1 flex items-center gap-2.5">
                        <span className="text-lg font-bold text-white">{p.nickname}</span>
                        {winner && (
                          <span className="chip border border-accent-green/40 bg-accent-green/15 text-accent-green">
                            Winner
                          </span>
                        )}
                      </div>
                      <div
                        className={`mb-4 font-mono text-sm font-bold ${
                          (p.change ?? 0) >= 0 ? "text-accent-green" : "text-accent-red"
                        }`}
                      >
                        {p.eloBefore !== null && p.eloAfter !== null
                          ? `${p.eloBefore} → ${p.eloAfter} elo (${p.change! >= 0 ? "+" : ""}${p.change})`
                          : "elo —"}
                      </div>

                      <div className="space-y-1.5">
                        {columns[pi]?.map((r, i) => {
                          const delta = pi === 0 ? deltaFor(r) : null;
                          return (
                            <div key={i} className="flex items-center gap-2.5">
                              <span
                                className="min-w-[3.6rem] rounded-full px-2.5 py-0.5 text-center font-mono text-xs font-bold"
                                style={{
                                  backgroundColor: r.color ? `${r.color}2b` : "#1d1d24",
                                  color: r.color ?? "#c8c8d4",
                                }}
                              >
                                {formatTime(r.time, false)}
                              </span>
                              {delta !== null && Math.abs(delta) >= 1000 && (
                                <span
                                  className={`font-mono text-xs font-bold ${
                                    delta < 0 ? "text-accent-green" : "text-accent-amber"
                                  }`}
                                >
                                  {fmtDelta(delta)}
                                </span>
                              )}
                              <span className="text-sm text-charcoal-300">{r.label}</span>
                            </div>
                          );
                        })}
                        {columns[pi]?.length === 0 && (
                          <p className="text-xs text-charcoal-300">No timeline events.</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer: detail level */}
            <div className="flex items-center justify-end gap-3 border-t border-charcoal-500/60 px-5 py-3">
              <span className="font-mono text-[11px] uppercase tracking-widest text-charcoal-300">
                Detail:
              </span>
              <div className="flex rounded-lg bg-charcoal-700 p-1">
                {LEVELS.map((l, i) => (
                  <button
                    key={l}
                    onClick={() => setLevel(i)}
                    className={`btn-tab px-3 text-xs ${
                      level === i
                        ? "bg-accent-teal/30 text-accent-blue"
                        : "text-charcoal-300 hover:text-white"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
