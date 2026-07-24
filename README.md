# MCSR Nexus — Ranked Intelligence

All-in-one Minecraft Speedrunning (MCSR) Ranked platform: **live** leaderboards
and player analytics from the official MCSR Ranked API, plus native practice
tools (zero-cycle coordinate reference, bastion gap-check drills, FSG seed
evaluation) in a single dark esports dashboard.

## Stack

- **Next.js 14 (App Router)** + **TypeScript** (strict)
- **Tailwind CSS 3** — custom charcoal/diamond-blue/emerald/end-teal theme
- Zero runtime dependencies beyond React — charts are hand-built SVG/CSS
- **Live data** from `api.mcsrranked.com`, fetched server-side with Next
  revalidation caching (60–600 s per endpoint) to respect API rate limits

## Run it

```bash
npm install
npm run dev   # → http://localhost:3000
```

## Map

| Route         | Module                                                        |
| ------------- | ------------------------------------------------------------- |
| `/`           | A — Live leaderboards: Season Elo (top 150), Best Times (with seed context), Weekly Race |
| `/analytics`  | B — Live player profiles: PB, **Average of Best ½**, completions vs played, phase splits averaged from real match timelines, recent matches with Elo deltas |
| `/zero-cycle` | C — Real zero-cycle coordinate reference: tower-by-tower standing heights + block coords, the 4 master dragon pass nodes, side/offset setups, 1/8 nodes |
| `/gap-check`  | D — Seed-preference chooser (bastion type, max time, min rank) → memory-routing drill on type-specific bastion boards: accuracy %, route efficiency %, S/A/B/C grades |
| `/fsg`        | E — 3-second reset-or-play drill with weighted seed quality scoring and meta feedback |

Key files: API client + adapters in [lib/api.ts](lib/api.ts), domain types in
[lib/types.ts](lib/types.ts), tier ladder / split metadata in
[lib/meta.ts](lib/meta.ts), theme in [tailwind.config.ts](tailwind.config.ts).

Split boundaries map to real MCSR timeline events: `story.enter_the_nether` →
`nether.find_bastion` → `nether.find_fortress` →
`projectelo.timeline.blind_travel` → `story.enter_the_end` → dragon death.
