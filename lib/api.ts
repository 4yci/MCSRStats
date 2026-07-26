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
  /** Season shown on the Elo board (null = current). */
  eloSeason: number | null;
  /** Season shown on Best Times — a number, or "all" for all-time. */
  timesSeason: number | "all" | null;
  elo: EloEntry[];
  times: TimeEntry[];
  weekly: WeeklyEntry[];
  /** Which weekly race is displayed, and the newest available week. */
  weekId: number | null;
  latestWeekId: number | null;
  weeklyEndsAt: number | null;
  error: string | null;
}

const seasonQ = (season?: number) =>
  season ? `?season=${season}` : "";

interface RawWeekly {
  id?: number;
  endsAt: number | null;
  leaderboard: { rank: number; time: number; player: RawUserLite }[];
}

/**
 * Each board is scoped independently:
 *  - Elo board  → a season
 *  - Best Times → a season, or all-time
 *  - Weekly     → a specific week id (weeks are not seasons)
 */
export async function fetchBoards(opts: {
  eloSeason?: number;
  timesSeason?: number | "all";
  weekId?: number;
} = {}): Promise<BoardsData> {
  const { eloSeason, timesSeason, weekId } = opts;
  const eloQ = seasonQ(eloSeason);
  // "all" means omit the season param entirely (record-leaderboard defaults to all-time).
  const timesQ =
    timesSeason === "all" || timesSeason === undefined
      ? ""
      : `?season=${timesSeason}`;

  const [eloRes, timesRes, weeklyRes] = await Promise.allSettled([
    api<{
      season: { number: number };
      users: (RawUserLite & {
        seasonResult?: { phasePoint?: number; eloRate?: number; eloRank?: number };
      })[];
    }>(`/leaderboard${eloQ}`, 120),
    api<
      {
        rank: number;
        time: number;
        date: number | null;
        user: RawUserLite;
        seed?: RawSeed | null;
      }[]
    >(`/record-leaderboard${timesQ}`, 300),
    api<RawWeekly>(weekId ? `/weekly-race/${weekId}` : "/weekly-race", 300),
  ]);

  const boards: BoardsData = {
    eloSeason: eloSeason ?? null,
    timesSeason: timesSeason ?? null,
    elo: [],
    times: [],
    weekly: [],
    weekId: null,
    latestWeekId: null,
    weeklyEndsAt: null,
    error: null,
  };

  if (eloRes.status === "fulfilled") {
    boards.elo = eloRes.value.users.map((u, i) => {
      // For a PAST season the live `eloRate`/`eloRank` fields are the player's
      // CURRENT values (often null) — the season's real placement lives in
      // `seasonResult`. Preferring it is what makes season switching work.
      const sr = u.seasonResult;
      const elo = eloSeason ? sr?.eloRate ?? u.eloRate ?? 0 : u.eloRate ?? 0;
      const rank = eloSeason ? sr?.eloRank ?? i + 1 : u.eloRank ?? i + 1;
      return {
        rank,
        uuid: u.uuid,
        name: u.nickname,
        country: u.country,
        elo,
        phasePoint: sr?.phasePoint ?? 0,
      };
    });
    // Past-season payloads aren't always pre-sorted by that season's rating.
    boards.elo.sort((a, b) => a.rank - b.rank);
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
    const w = weeklyRes.value;
    boards.weeklyEndsAt = w.endsAt;
    boards.weekId = w.id ?? weekId ?? null;
    boards.weekly = w.leaderboard.map((e) => ({
      rank: e.rank,
      uuid: e.player.uuid,
      name: e.player.nickname,
      country: e.player.country,
      elo: e.player.eloRate,
      timeMs: e.time,
    }));
  }

  // Newest week id — needed to build the week dropdown when viewing an old week.
  if (weekId) {
    try {
      const live = await api<RawWeekly>("/weekly-race", 300);
      boards.latestWeekId = live.id ?? null;
    } catch {
      boards.latestWeekId = weekId;
    }
  } else {
    boards.latestWeekId = boards.weekId;
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
  /** True for private-room (type 3) matches. */
  private: boolean;
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
  /** Death stats from sampled match timelines. */
  deaths: { sampled: number; withDeath: number; total: number };
  /** Death rate per seed sub-type (overworld / bastion). */
  deathByType: Record<
    "overworld" | "bastion",
    Record<string, { runs: number; withDeath: number; deaths: number }>
  >;
  /** The season these numbers are for, and whether private rooms are folded in. */
  requestedSeason: number | null;
  includesPrivate: boolean;
  /** How many recent matches were sampled for splits/deaths. */
  sampleSize: number;
}

export interface SplitSample {
  matchId: number;
  overworld: string | null;
  bastion: string | null;
  /** Only phases that qualify (see qualifiedSegments) are present. */
  segments: Partial<Record<SplitKey, number>>;
  /** Deaths recorded in this run (0 = clean run). */
  deaths: number;
  completed: boolean;
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

const LAST_CP = CHECKPOINTS.length - 1;

/**
 * Per-phase segments that are trustworthy enough to average.
 *
 * A phase only counts once the runner clearly moved past it — specifically when
 * they reached the checkpoint TWO phases later (so a bastion split needs a
 * fortress and a blind, a blinding split needs the dragon, etc). Near the end of
 * the run there is no "two later", so those phases require a completion. Every
 * phase of a completed run always counts.
 *
 * Runs that were abandoned mid-phase therefore contribute their solid early
 * splits without polluting the averages with the phase they quit in.
 */
function qualifiedSegments(
  events: { time: number; type: string }[],
  finalTimeMs: number | null,
  completed: boolean,
): Partial<Record<SplitKey, number>> {
  const at = new Map<string, number>();
  for (const e of events) {
    const prev = at.get(e.type);
    if (prev === undefined || e.time < prev) at.set(e.type, e.time);
  }

  // Cumulative time at each checkpoint; null where never reached.
  const cum: (number | null)[] = CHECKPOINTS.map((cp) => {
    let t = at.get(cp.type);
    if (t === undefined && cp.key === "dragon") {
      t = at.get("end.kill_dragon") ?? (completed ? finalTimeMs ?? undefined : undefined);
    }
    return t ?? null;
  });

  const segs: Partial<Record<SplitKey, number>> = {};
  for (let i = 0; i <= LAST_CP; i++) {
    const end = cum[i];
    const start = i === 0 ? 0 : cum[i - 1];
    if (end === null || start === null || end < start) continue;

    // Needs the checkpoint two phases later — or a completion when that would
    // run past the end of the run.
    const needIdx = i + 2;
    const qualifies =
      completed || (needIdx <= LAST_CP && cum[needIdx] !== null);
    if (!qualifies) continue;

    segs[CHECKPOINTS[i].key] = end - start;
  }
  return segs;
}

const num = (v: unknown): number => (typeof v === "number" ? v : 0);

export async function fetchProfile(
  name: string,
  opts: {
    season?: number;
    includePrivate?: boolean;
    /** How many recent matches to pull timelines from (splits + deaths). */
    sampleSize?: number;
  } = {},
): Promise<{ ok: true; data: ProfileData } | { ok: false; error: string }> {
  const { season, includePrivate = false } = opts;
  const sampleSize = Math.min(500, Math.max(5, opts.sampleSize ?? 20));
  const sq = seasonQ(season);
  const seasonMatchQ = season ? `&season=${season}` : "";

  let user: any;
  try {
    user = await api<any>(`/users/${encodeURIComponent(name.trim())}${sq}`, 60);
  } catch (e) {
    return {
      ok: false,
      error: `No player named “${name}” — usernames are exact (try the leaderboard).`,
    };
  }

  const me = user.uuid as string;

  // The API caps a match page at 100, so walk backwards with the `before`
  // cursor until we have enough history for the requested sample size.
  const wanted = Math.max(100, sampleSize);
  const fetchHistory = async (type: 2 | 3): Promise<RawMatch[]> => {
    const out: RawMatch[] = [];
    let before: number | null = null;
    while (out.length < wanted) {
      const cursor: string = before ? `&before=${before}` : "";
      let page: RawMatch[];
      try {
        page = await api<RawMatch[]>(
          `/users/${me}/matches?count=100&type=${type}${seasonMatchQ}${cursor}`,
          120,
        );
      } catch {
        break;
      }
      if (!page.length) break;
      out.push(...page);
      const oldest = page[page.length - 1]?.id;
      if (!oldest || oldest === before) break;
      before = oldest;
      if (page.length < 100) break; // reached the end of their history
    }
    return out;
  };

  const histories = await Promise.allSettled([
    fetchHistory(2),
    ...(includePrivate ? [fetchHistory(3)] : []),
  ]);
  let matches: RawMatch[] = [];
  for (const r of histories) {
    if (r.status === "fulfilled") matches = matches.concat(r.value);
  }
  // `before` pages can overlap at the boundary — keep one row per match id.
  matches = Array.from(new Map(matches.map((m) => [m.id, m])).values());

  const usable = matches.filter((m) => !m.decayed);
  usable.sort((a, b) => (b.date ?? 0) - (a.date ?? 0)); // newest first
  const runs: RunRow[] = usable.map((m) => {
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
      opponent: opp?.nickname ?? (m.type === 3 ? "Private room" : "—"),
      won,
      draw: !m.result?.uuid,
      forfeited: m.forfeited,
      timeMs: m.result?.time ?? null,
      eloChange: ch?.change ?? null,
      eloAfter,
      overworld: m.seed?.overworld ?? null,
      bastion: m.seed?.nether ?? null,
      private: m.type === 3,
    };
  });

  const completedWins = runs.filter(
    (r) => r.won && !r.forfeited && r.timeMs !== null,
  );

  // Sample the most recent matches' timelines for splits and deaths. Requests go
  // out in batches so a large sample size doesn't open hundreds of sockets at once.
  const sampled = runs.slice(0, sampleSize);
  const BATCH = 25;
  const details: PromiseSettledResult<RawMatchDetail>[] = [];
  for (let i = 0; i < sampled.length; i += BATCH) {
    const chunk = sampled.slice(i, i + BATCH);
    details.push(
      ...(await Promise.allSettled(
        chunk.map((r) => api<RawMatchDetail>(`/matches/${r.id}`, 600)),
      )),
    );
  }

  let deathSampled = 0;
  let deathWith = 0;
  let deathTotal = 0;
  /** Deaths per seed sub-type, for per-bastion / per-overworld death rates. */
  const deathByType: Record<
    "overworld" | "bastion",
    Record<string, { runs: number; withDeath: number; deaths: number }>
  > = { overworld: {}, bastion: {} };

  const splitSamples: SplitSample[] = [];
  details.forEach((d, i) => {
    if (d.status !== "fulfilled") return;
    deathSampled++;
    const mine = (d.value.timelines ?? []).filter((t) => t.uuid === me);
    const nDeath = mine.filter(
      (t) => t.type === "projectelo.timeline.death",
    ).length;
    if (nDeath > 0) deathWith++;
    deathTotal += nDeath;

    for (const field of ["overworld", "bastion"] as const) {
      const key = sampled[i][field];
      if (!key) continue;
      const bucket = (deathByType[field][key] ??= {
        runs: 0,
        withDeath: 0,
        deaths: 0,
      });
      bucket.runs++;
      if (nDeath > 0) bucket.withDeath++;
      bucket.deaths += nDeath;
    }

    const row = sampled[i];
    const completed =
      row.won && !row.forfeited && (d.value.result?.time ?? null) !== null;
    const segs = qualifiedSegments(mine, d.value.result?.time ?? null, completed);
    if (Object.keys(segs).length > 0) {
      splitSamples.push({
        matchId: row.id,
        overworld: row.overworld,
        bastion: row.bastion,
        segments: segs,
        deaths: nDeath,
        completed,
      });
    }
  });

  // Best 4/5 average per phase — trims the slowest fifth as outliers — plus the
  // match id the fastest segment came from (for click-through). Each phase is
  // averaged over however many runs qualified for THAT phase.
  const splits: SplitData[] | null =
    splitSamples.length === 0
      ? null
      : SPLIT_ORDER.map((key) => {
          const rows = splitSamples
            .filter((s) => s.segments[key] !== undefined)
            .map((s) => ({ v: s.segments[key] as number, id: s.matchId }))
            .sort((a, b) => a.v - b.v);
          if (rows.length === 0) {
            return { key, avgMs: 0, bestMs: 0, bestMatchId: null };
          }
          const keep = Math.max(1, Math.ceil(rows.length * 0.8));
          const best = rows.slice(0, keep);
          return {
            key,
            avgMs: Math.round(best.reduce((a, b) => a + b.v, 0) / best.length),
            bestMs: rows[0].v,
            bestMatchId: rows[0].id,
          };
        });

  const s = user.statistics?.season ?? {};
  const t = user.statistics?.total ?? {};
  const sr = user.seasonResult ?? {};
  const data: ProfileData = {
    uuid: me,
    name: user.nickname,
    country: user.country ?? null,
    // For a past season, use that season's result rating rather than live Elo.
    elo: season != null ? (sr.eloRate ?? null) : (user.eloRate ?? null),
    eloRank: season != null ? (sr.eloRank ?? null) : (user.eloRank ?? null),
    peakElo: typeof sr.highest === "number" ? sr.highest : null,
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
    completionTimes: completedWins.map((r) => r.timeMs!),
    runs,
    splits,
    sampledRuns: splitSamples.length,
    splitSamples,
    deaths: { sampled: deathSampled, withDeath: deathWith, total: deathTotal },
    deathByType,
    requestedSeason: season ?? null,
    includesPrivate: includePrivate,
    sampleSize,
  };
  return { ok: true, data };
}
