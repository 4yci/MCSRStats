# MCSR Stats

An all-in-one dashboard for competitive Minecraft speedrunning. It brings the live
ranked ladder, deep per-player analytics, head-to-head comparisons, and a complete
zero-cycle coordinate reference together in a single dark, esports-styled interface.

**Live site: https://mcsrstatistiques.vercel.app**

MCSR Ranked is the head-to-head speedrunning ladder where players race to complete
Minecraft from a fresh world to a dead Ender Dragon. MCSR Stats reads that
ecosystem's live data and turns it into something you can actually study — your
pacing, your consistency, where you stand, and how you compare.

---

## What you can do

### Leaderboards

Three live boards you can switch between:

- **Season Elo** — the top of the current ranked ladder, with each runner's tier,
  country, and rating. Columns are sortable and you can search for any name.
- **Best Times** — the fastest recorded completions this season, each shown with
  the seed it happened on (overworld spawn type and bastion type) and the date.
- **Weekly Race** — the standings for the rotating weekly-seed challenge.

Click any runner to open their full analytics profile.

### Player Analytics

A complete, live profile for any ranked player:

- **A rotating 3D render of the player's Minecraft skin** you can drag to spin.
- **Personal Best, win/loss record, win rate, best streak, peak Elo,** and playtime.
- **Average of Best** — a consistency metric that averages a runner's fastest
  completions. You can measure it over their best half, a specific number of runs,
  or all of them.
- **Pace Rank** — the rank a runner's *speed* actually deserves, worked out from
  how their pace compares to each rank's average. Someone stuck in Gold by rating
  but posting Diamond-level times is shown as exactly that.
- **Completions vs. games played,** with a finish-rate bar and current streak.
- **Elo progression** — a chart of the player's rating across recent matches, which
  you can scope to their last 30, 60, or all games, with the date shown on hover.
- **Phase and split analysis** — the average time spent in each of the seven phases
  of a run, compared against the pace of the rank they belong to, with a small tag
  on every split showing which rank *that particular split* is playing at.
- **Split comparison across all ranks** — your times laid side by side with the
  average for every rank (Coal through Netherite), so you can see at a glance where
  you're ahead and where you're behind.
- **Seed and bastion breakdown** — win rate and pace grouped by seed type, plus the
  specific split each seed type affects, so you can find which seeds you're
  strongest and weakest on.
- **Recent matches** you can expand and click into for a full timeline of the game.

### Head-to-Head

Pick any two runners and compare them directly:

- Their **head-to-head record** from games they've actually played against each other.
- Both runners' **Elo histories overlaid** on one chart.
- Their **average splits side by side**, with the time difference in every phase.
- A list of their **direct matchups**, each openable as a full match timeline.

### Zero-Cycle Reference

An interactive version of the community's zero-cycle coordinate sheet — the exact
positions used to kill the Ender Dragon in a single cycle. Pick any of the End's
towers and read the precise standing and bed coordinates for each height and
approach, along with the master dragon-pass nodes, offset setups, and a small
diagram of the line-up.

---

## How it works

- **Live data.** Everything is pulled in real time from the official MCSR Ranked
  API, so the standings, profiles, and match histories are always current.
- **Pace Rank and per-split ranking** are computed by comparing a runner's times
  against a table of each rank's average pace, phase by phase. This is what lets
  the site tell you that a single split is "Diamond level" even if your overall
  rank is lower.
- **Splits** are reconstructed from the real timeline of each match — the moments a
  runner enters the Nether, finds the bastion and fortress, goes blind, reaches the
  stronghold, and kills the dragon.
- **Everything is drawn by hand.** The charts, diagrams, and the 3D skin are built
  directly from SVG, CSS, and Canvas rather than heavy third-party libraries, which
  keeps the site fast and consistent. On lower-end phones the 3D skin automatically
  switches to a lighter 2D version.

---

## A note on how this was made

This website was designed and built with the help of AI. The concept, the data,
and the direction are human; a large amount of the code was written with an AI
assistant.

---

## Disclaimer

Unofficial community project — not affiliated with Mojang, Microsoft, or MCSR
Ranked. All player data belongs to its respective owners and is fetched live from
the public MCSR Ranked API. "Minecraft" is a trademark of Mojang Synergies AB.

---

## Support

MCSR Stats is free and ad-free. If you find it useful, you can support it through
[GitHub Sponsors](https://github.com/sponsors/4yci).
