import { SplitData, SplitKey, SPLIT_ORDER } from "./types";

/**
 * Server-side client for the public MCSR Ranked API (docs.mcsrranked.com).
 * All fetches run in server components with Next revalidation caching, so
 * page loads share cached responses instead of hammering the rate limit.
 *
 * Resilience layer: on top of Next's per-path fetch cache, every successful
 * response is also stored in a process-wide "backup cache". If the upstream
 * later errors or rate-limits (e.g. a traffic spike during a major tournament
 * broadcast) AND Next's cache has expired, we serve the last-known-good value
 * instead of throwing. This module-level Map is the seam where a shared store
 * such as Redis would drop in for multi-instance deployments.
 */

const BASE = "https://api.mcsrranked.com";

interface BackupEntry {
  data: unknown;
  at: number;
}
const backupCache = new Map<string, BackupEntry>();
/** How long a stale backup entry is still worth serving on error (24h). */
const BACKUP_TTL_MS = 24 * 60 * 60 * 1000;

async function api<T>(path: string, revalidate: number): Promise<T> {
  try {
    const res = await fetch(`${BASE}${path}`, { next: { revalidate } });
    if (!res.ok) throw new Error(`MCSR API ${res.status} on ${path}`);
    const json = await res.json();
    if (json.status !== "success") {
      throw new Error(`MCSR API error on ${path}: ${json.data ?? json.status}`);
    }
    const data = json.data as T;
    backupCache.set(path, { data, at: Date.now() });
    return data;
  } catch (err) {
    const backup = backupCache.get(path);
    if (backup && Date.now() - backup.at < BACKUP_TTL_MS) {
      const ageS = Math.round((Date.now() - backup.at) / 1000);
      console.warn(
        `[mcsr] upstream failed for ${path}; serving backup cache (age ${ageS}s):`,
        err instanceof Error ? err.message : err,
      );
      return backup.data as T;
    }
    throw err;
  }
}

/* ── Raw API shapes (fields we consume) ───────────────────────────── */

interface RawUserLite {
  uuid: string;
  nickname: string;
  eloRate: number | null;
  eloRank: number | null;
  country: string | null;
}

interface RawSeed {
  overworld?: string | null;
  nether?: string | null;
  endTowers?: number[] | null;
}

interface RawMatch {
  id: number;
  type: number;
  date?: number | null;
  seed?: RawSeed | null;
  players: RawUserLite[];
  result: { uuid: string | null; time: number | null } | null;
  forfeited: boolean;
  decayed?: boolean;
  changes?: { uuid: string; change: number | null; eloRate: number | null }[];
}

interface RawMatchDetail extends RawMatch {
  timelines?: { uuid: string; time: number; type: string }[];
}

/** Shape served by /api/match/[id] and consumed by the detail modal. */
export interface MatchDetailData {
  id: number;
  date: number | null;
  forfeited: boolean;
  seed: { overworld: string | null; bastion: string | null };
  result: { uuid: string | null; time: number | null };
  players: {
    uuid: string;
    nickname: string;
    eloBefore: number | null;
    eloAfter: number | null;
    change: number | null;
  }[];
  timelines: { uuid: string; time: number; type: string }[];
}

/* ── Leaderboards (Module A) ──────────────────────────────────────── */

export interface EloEntry {
  rank: number;
  uuid: string;
  name: string;
  country: string | null;
  elo: number;
  phasePoint: number;
}

export interface TimeEntry {
  rank: number;
  uuid: string;
  name: string;
  country: string | null;
  elo: number | null;
  timeMs: number;
  dateSec: number | null;
  overworld: string | null;
  bastion: string | null;
}

export interface WeeklyEntry {
  rank: number;
  uuid: string;
  name: string;
  country: string | null;
  elo: number | null;
  timeMs: number;
}

export interface BoardsData {
  season: number | null;
  elo: EloEntry[];
  times: TimeEntry[];
  weekly: WeeklyEntry[];
  weeklyEndsAt: number | null;
  error: string | null;
}

export async function fetchBoards(): Promise<BoardsData> {
  const [eloRes, timesRes, weeklyRes] = await Promise.allSettled([
    api<{
      season: { number: number };
      users: (RawUserLite & { seasonResult?: { phasePoint?: number } })[];
    }>("/leaderboard", 120),
    api<
      {
        rank: number;
        time: number;
        date: number | null;
        user: RawUserLite;
        seed?: RawSeed | null;
      }[]
    >("/record-leaderboard", 300),
    api<{
      endsAt: number | null;
      leaderboard: { rank: number; time: number; player: RawUserLite }[];
    }>("/weekly-race", 300),
  ]);

  const boards: BoardsData = {
    season: null,
    elo: [],
    times: [],
    weekly: [],
    weeklyEndsAt: null,
    error: null,
  };

  if (eloRes.status === "fulfilled") {
    boards.season = eloRes.value.season.number;
    boards.elo = eloRes.value.users.map((u, i) => ({
      rank: u.eloRank ?? i + 1,
      uuid: u.uuid,
      name: u.nickname,
      country: u.country,
      elo: u.eloRate ?? 0,
      phasePoint: u.seasonResult?.phasePoint ?? 0,
    }));
  }
  if (timesRes.status === "fulfilled") {
    boards.times = timesRes.value.map((r) => ({
      rank: r.rank,
      uuid: r.user.uuid,
      name: r.user.nickname,
      country: r.user.country,
      elo: r.user.eloRate,
      timeMs: r.time,
      dateSec: r.date ?? null,
      overworld: r.seed?.overworld ?? null,
      bastion: r.seed?.nether ?? null,
    }));
  }
  if (weeklyRes.status === "fulfilled") {
    boards.weeklyEndsAt = weeklyRes.value.endsAt;
    boards.weekly = weeklyRes.value.leaderboard.map((e) => ({
      rank: e.rank,
      uuid: e.player.uuid,
      name: e.player.nickname,
      country: e.player.country,
      elo: e.player.eloRate,
      timeMs: e.time,
    }));
  }

  if (!boards.elo.length && !boards.times.length && !boards.weekly.length) {
    const reason =
      eloRes.status === "rejected" ? String(eloRes.reason) : "unknown";
    boards.error = `MCSR Ranked API unreachable (${reason})`;
  }
  return boards;
}

/** Nicknames for client-side search suggestions (top-150 by elo). */
export async function fetchRoster(): Promise<string[]> {
  try {
    const data = await api<{ users: RawUserLite[] }>("/leaderboard", 300);
    return data.users.map((u) => u.nickname);
  } catch {
    return [];
  }
}

/** Current season number for the sidebar (cached, null on failure). */
export async function fetchSeasonNumber(): Promise<number | null> {
  try {
    const data = await api<{ season: { number: number } }>("/leaderboard", 300);
    return data.season.number;
  } catch {
    return null;
  }
}

/* ── Player profile (Module B) ────────────────────────────────────── */

export interface RunRow {
  id: number;
  dateSec: number | null;
  opponent: string;
  won: boolean;
  draw: boolean;
  forfeited: boolean;
  /** Winner's completion time; null on forfeits/draws. */
  timeMs: number | null;
  eloChange: number | null;
  /** Player's Elo rating after this match; null if unknown. */
  eloAfter: number | null;
  overworld: string | null;
  bastion: string | null;
}

export interface ProfileData {
  uuid: string;
  name: string;
  country: string | null;
  elo: number | null;
  eloRank: number | null;
  peakElo: number | null;
  season: {
    pbMs: number | null;
    wins: number;
    loses: number;
    completions: number;
    playedMatches: number;
    forfeits: number;
    currentStreak: number;
    bestStreak: number;
    playtimeMs: number;
  };
  lifetimeCompletions: number;
  lifetimeMatches: number;
  /** The player's own ranked completion times (wins), newest-first. */
  completionTimes: number[];
  runs: RunRow[];
  /** Averaged phase splits from sampled match timelines; null if none. */
  splits: SplitData[] | null;
  sampledRuns: number;
  /** Per-sampled-completion phase segments tagged with seed sub-types, so
   *  the client can break down any split by overworld / bastion type. */
  splitSamples: SplitSample[];
}

export interface SplitSample {
  overworld: string | null;
  bastion: string | null;
  segments: Record<SplitKey, number>;
}

const CHECKPOINTS: { key: SplitKey; type: string }[] = [
  { key: "ow", type: "story.enter_the_nether" },
  { key: "findBastion", type: "nether.find_bastion" },
  { key: "bastion", type: "nether.find_fortress" },
  { key: "fortress", type: "projectelo.timeline.blind_travel" },
  { key: "blinding", type: "story.follow_ender_eye" },
  { key: "shNav", type: "story.enter_the_end" },
  { key: "dragon", type: "projectelo.timeline.dragon_death" },
];

/** Cumulative checkpoint times → per-phase segments; null if incomplete. */
function segmentsFromTimeline(
  events: { time: number; type: string }[],
  finalTimeMs: number | null,
): Record<SplitKey, number> | null {
  const at = new Map<string, number>();
  for (const e of events) {
    const prev = at.get(e.type);
    if (prev === undefined || e.time < prev) at.set(e.type, e.time);
  }
  const cum: number[] = [];
  for (const cp of CHECKPOINTS) {
    let t = at.get(cp.type);
    if (t === undefined && cp.key === "dragon") {
      t = at.get("end.kill_dragon") ?? finalTimeMs ?? undefined;
    }
    if (t === undefined) return null;
    cum.push(t);
  }
  const segs = {} as Record<SplitKey, number>;
  let prev = 0;
  for (let i = 0; i < CHECKPOINTS.length; i++) {
    const seg = cum[i] - prev;
    if (seg < 0) return null;
    segs[CHECKPOINTS[i].key] = seg;
    prev = cum[i];
  }
  return segs;
}

const num = (v: unknown): number => (typeof v === "number" ? v : 0);

export async function fetchProfile(
  name: string,
): Promise<{ ok: true; data: ProfileData } | { ok: false; error: string }> {
  let user: any;
  try {
    user = await api<any>(`/users/${encodeURIComponent(name.trim())}`, 60);
  } catch (e) {
    return {
      ok: false,
      error: `No ranked player named “${name}” — nicknames are exact (try the leaderboard).`,
    };
  }

  let matches: RawMatch[] = [];
  try {
    matches = await api<RawMatch[]>(
      `/users/${user.uuid}/matches?count=100&type=2`,
      120,
    );
  } catch {
    /* profile still renders without match history */
  }

  const me = user.uuid as string;
  const ranked = matches.filter((m) => m.type === 2 && !m.decayed);
  const runs: RunRow[] = ranked.map((m) => {
    const opp = m.players.find((p) => p.uuid !== me);
    const won = m.result?.uuid === me;
    const ch = m.changes?.find((c) => c.uuid === me);
    // changes[].eloRate is the PRE-match rating; after = eloRate + change.
    const eloAfter =
      ch && typeof ch.eloRate === "number" && typeof ch.change === "number"
        ? ch.eloRate + ch.change
        : null;
    return {
      id: m.id,
      dateSec: m.date ?? null,
      opponent: opp?.nickname ?? "—",
      won,
      draw: !m.result?.uuid,
      forfeited: m.forfeited,
      timeMs: m.result?.time ?? null,
      eloChange: ch?.change ?? null,
      eloAfter,
      overworld: m.seed?.overworld ?? null,
      bastion: m.seed?.nether ?? null,
    };
  });

  const completedWins = runs.filter(
    (r) => r.won && !r.forfeited && r.timeMs !== null,
  );

  // Sample recent completions' timelines for split averages (bounded fan-out).
  // Sampling enough to break splits down by seed sub-type while staying cached.
  const sampled = completedWins.slice(0, 20);
  const details = await Promise.allSettled(
    sampled.map((r) => api<RawMatchDetail>(`/matches/${r.id}`, 600)),
  );
  const perRunSegments: Record<SplitKey, number>[] = [];
  const splitSamples: SplitSample[] = [];
  details.forEach((d, i) => {
    if (d.status !== "fulfilled") return;
    const mine = (d.value.timelines ?? []).filter((t) => t.uuid === me);
    const segs = segmentsFromTimeline(mine, d.value.result?.time ?? null);
    if (!segs) return;
    perRunSegments.push(segs);
    splitSamples.push({
      overworld: sampled[i].overworld,
      bastion: sampled[i].bastion,
      segments: segs,
    });
  });
  const splits: SplitData[] | null =
    perRunSegments.length === 0
      ? null
      : SPLIT_ORDER.map((key) => {
          const vals = perRunSegments.map((s) => s[key]);
          return {
            key,
            avgMs: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
            bestMs: Math.min(...vals),
          };
        });

  const s = user.statistics?.season ?? {};
  const t = user.statistics?.total ?? {};
  const data: ProfileData = {
    uuid: me,
    name: user.nickname,
    country: user.country ?? null,
    elo: user.eloRate ?? null,
    eloRank: user.eloRank ?? null,
    peakElo:
      typeof user.seasonResult?.highest === "number"
        ? user.seasonResult.highest
        : null,
    season: {
      pbMs: s.bestTime?.ranked ?? null,
      wins: num(s.wins?.ranked),
      loses: num(s.loses?.ranked),
      completions: num(s.completions?.ranked),
      playedMatches: num(s.playedMatches?.ranked),
      forfeits: num(s.forfeits?.ranked),
      currentStreak: num(s.currentWinStreak?.ranked),
      bestStreak: num(s.highestWinStreak?.ranked),
      playtimeMs: num(s.playtime?.ranked),
    },
    lifetimeCompletions: num(t.completions?.ranked),
    lifetimeMatches: num(t.playedMatches?.ranked),
    completionTimes: completedWins.map((r) => r.timeMs!) ,
    runs,
    splits,
    sampledRuns: perRunSegments.length,
    splitSamples,
  };
  return { ok: true, data };
}
