/* ── Core domain types for MCSR Stats ─────────────────────────────── */

/** Ranked tier ladder, mirroring MCSR Ranked's divisions. */
export type Tier =
  | "Netherite"
  | "Diamond"
  | "Emerald"
  | "Gold"
  | "Iron"
  | "Coal";

/** Canonical run phases, boundaries matching MCSR Ranked timeline events. */
export type SplitKey =
  | "ow" // Overworld → story.enter_the_nether
  | "findBastion" // → nether.find_bastion
  | "bastion" // → nether.find_fortress
  | "fortress" // → projectelo.timeline.blind_travel
  | "blinding" // → story.follow_ender_eye (stronghold found)
  | "shNav" // → story.enter_the_end
  | "dragon"; // → dragon death / final time

export const SPLIT_ORDER: SplitKey[] = [
  "ow",
  "findBastion",
  "bastion",
  "fortress",
  "blinding",
  "shNav",
  "dragon",
];

export interface SplitMeta {
  key: SplitKey;
  label: string;
  short: string;
  description: string;
  /** Accent color token used across charts. */
  color: string;
}

/** Aggregated stats for one phase of a runner's game. */
export interface SplitData {
  key: SplitKey;
  /** Mean segment duration across sampled completions (ms). */
  avgMs: number;
  /** Fastest sampled segment (ms). */
  bestMs: number;
}

/* ── Practice-tool session tracking (Modules C, D, E) ─────────────── */

export type PracticeModule = "zero-cycle" | "gap-check" | "fsg";

export interface PracticeSession {
  id: string;
  module: PracticeModule;
  startedAt: number; // epoch ms
  attempts: number;
  /** 0–100. Meaning is module-specific (route accuracy, decision accuracy). */
  accuracyPct: number;
  /** Module-specific headline metric, ms (round time, decision time). */
  headlineMs: number;
  bestStreak: number;
}

/* ── Module D: Gap-Check ──────────────────────────────────────────── */

export type BastionType = "Bridge" | "Stables" | "Housing" | "Treasure";

export type SeedType =
  | "RUINED_PORTAL"
  | "DESERT_TEMPLE"
  | "VILLAGE"
  | "SHIPWRECK"
  | "BURIED_TREASURE"
  | "RANDOM";

export interface ChestSpot {
  id: string;
  x: number;
  y: number;
  label: string;
}

export interface GapCheckRound {
  layoutId: number;
  bastion: BastionType;
  seedType: SeedType;
  timeMs: number;
  accuracyPct: number;
  efficiencyPct: number;
  grade: "S" | "A" | "B" | "C";
}

/* ── Module E: FSG Evaluator ──────────────────────────────────────── */

export interface SeedFactor {
  label: string;
  /** Contribution to the meta score; positive = play-signal. */
  weight: number;
}

export interface FsgSeed {
  seed: string;
  spawnBiome: string;
  factors: SeedFactor[];
  /** 0–100 composite; meta says PLAY at >= 60. */
  metaScore: number;
}

export type FsgDecision = "play" | "reset" | "timeout";

export interface FsgRound {
  seed: FsgSeed;
  decision: FsgDecision;
  correct: boolean;
  decisionMs: number;
}
