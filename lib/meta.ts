import { SplitKey, SplitMeta, Tier } from "./types";

/* ── Split metadata — 7 phases matching the community split table ──── */

export const SPLIT_META: Record<SplitKey, SplitMeta> = {
  ow: {
    key: "ow",
    label: "Overworld",
    short: "OW",
    description: "Spawn to Nether enter: wood, iron, lava portal.",
    color: "#ff5252",
  },
  findBastion: {
    key: "findBastion",
    label: "Terrain to Bastion",
    short: "TERRAIN",
    description: "Nether terrain read and travel to the bastion.",
    color: "#ff9100",
  },
  bastion: {
    key: "bastion",
    label: "Bastion",
    short: "BASTION",
    description: "Bastion routing — gold, pearls, gap-checks — through fortress arrival.",
    color: "#ffc400",
  },
  fortress: {
    key: "fortress",
    label: "Fortress",
    short: "FORT",
    description: "Blaze rods through the blind exit portal.",
    color: "#b388ff",
  },
  blinding: {
    key: "blinding",
    label: "Blinding",
    short: "BLIND",
    description: "Blind travel and eye throws until the stronghold is found.",
    color: "#00e5ff",
  },
  shNav: {
    key: "shNav",
    label: "Nav",
    short: "NAV",
    description: "Stronghold navigation to the portal room and End entry.",
    color: "#008080",
  },
  dragon: {
    key: "dragon",
    label: "Dragon",
    short: "DRAGON",
    description: "From End entry to dragon death — one-cycle / zero-cycle execution.",
    color: "#00e676",
  },
};

/* ── Ranked tier ladder ───────────────────────────────────────────── */

export function tierForElo(elo: number | null): Tier {
  if (elo === null) return "Coal";
  if (elo >= 2000) return "Netherite";
  if (elo >= 1500) return "Diamond";
  if (elo >= 1200) return "Emerald";
  if (elo >= 900) return "Gold";
  if (elo >= 600) return "Iron";
  return "Coal";
}

export const TIER_COLORS: Record<Tier, string> = {
  Netherite: "#b388ff",
  Diamond: "#00e5ff",
  Emerald: "#00e676",
  Gold: "#ffc400",
  Iron: "#c0c4cc",
  Coal: "#6b7280",
};

/** Slowest → fastest, i.e. ladder order. */
export const TIER_ORDER: Tier[] = [
  "Coal",
  "Iron",
  "Gold",
  "Emerald",
  "Diamond",
  "Netherite",
];

/* ── Average split times per rank (community reference table, ms) ─── */

export const RANK_SPLITS: Record<Tier, Record<SplitKey, number>> = {
  Coal: {
    ow: 360_000, findBastion: 120_000, bastion: 646_000, fortress: 301_000,
    blinding: 528_000, shNav: 331_000, dragon: 361_000,
  },
  Iron: {
    ow: 262_000, findBastion: 90_000, bastion: 486_000, fortress: 216_000,
    blinding: 332_000, shNav: 195_000, dragon: 216_000,
  },
  Gold: {
    ow: 169_000, findBastion: 54_000, bastion: 276_000, fortress: 147_000,
    blinding: 163_000, shNav: 97_000, dragon: 109_000,
  },
  Emerald: {
    ow: 162_000, findBastion: 50_000, bastion: 255_000, fortress: 146_000,
    blinding: 163_000, shNav: 72_000, dragon: 110_000,
  },
  Diamond: {
    ow: 125_000, findBastion: 42_000, bastion: 197_000, fortress: 114_000,
    blinding: 120_000, shNav: 47_000, dragon: 85_000,
  },
  Netherite: {
    ow: 109_000, findBastion: 37_000, bastion: 171_000, fortress: 93_000,
    blinding: 100_000, shNav: 41_000, dragon: 59_000,
  },
};

/** Total average completion time for a rank (sum of its split averages). */
export function rankTotalMs(tier: Tier): number {
  return Object.values(RANK_SPLITS[tier]).reduce((a, b) => a + b, 0);
}

/**
 * The rank a single phase time reads as: the tier whose average for THAT
 * phase is closest to `ms`. A player can be Iron overall yet post a
 * Gold-level bastion split — this surfaces that per-split.
 */
export function tierForSplit(phase: SplitKey, ms: number): Tier {
  let best: Tier = "Coal";
  let bestDiff = Infinity;
  for (const t of TIER_ORDER) {
    const diff = Math.abs(RANK_SPLITS[t][phase] - ms);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = t;
    }
  }
  return best;
}

/**
 * The rank a runner's average pace "deserves": the tier whose average
 * completion time is closest to the player's average.
 */
export function deservedTier(playerAvgTotalMs: number): Tier {
  let best: Tier = "Coal";
  let bestDiff = Infinity;
  for (const t of TIER_ORDER) {
    const diff = Math.abs(rankTotalMs(t) - playerAvgTotalMs);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = t;
    }
  }
  return best;
}

/* ── Misc display helpers ─────────────────────────────────────────── */

/** ISO-3166 alpha-2 → flag emoji ("gb" → 🇬🇧). Empty string when unknown. */
export function flagEmoji(cc?: string | null): string {
  if (!cc || cc.length !== 2) return "";
  return String.fromCodePoint(
    ...cc.toUpperCase().split("").map((c) => 0x1f1a5 + c.charCodeAt(0)),
  );
}

/** "RUINED_PORTAL" → "Ruined Portal" */
export function prettyEnum(s?: string | null): string {
  if (!s) return "—";
  return s
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
