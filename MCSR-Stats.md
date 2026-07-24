# MCSR Stats

### An all-in-one intelligence platform for competitive Minecraft speedrunning

---

## Introduction

Competitive Minecraft speedrunning — specifically the 1.16 Any% Random Seed Glitchless discipline that powers **MCSR Ranked** — has, over the last several years, grown from a hobbyist curiosity into a genuine esport. Thousands of runners queue head-to-head every day, an Elo ladder sorts them into tiers, and the very best complete a full run, from an empty world to a dead Ender Dragon, in under six minutes. Yet the tooling that surrounds this scene has always been scattered. A runner who wants to study their pacing opens one site; to compare a match timeline they open another; to look up the exact coordinates for a zero-cycle they dig through a spreadsheet or a static cheat-sheet page. Each tool is good at one thing and unaware of the others.

**MCSR Stats** is built on a single premise: that all of this belongs in one place, presented with the polish of a modern esports dashboard and powered by live data rather than screenshots and stale exports. It is a web application that unifies three things a serious runner actually needs — a live view of the global ladder, a deep analytical profile of any player, and a complete, interactive reference for the hardest execution tech in the game — into one coherent, fast, dark-themed interface. This essay walks through what the platform does, feature by feature, and explains the thinking behind the parts that are not obvious.

---

## Foundations: how it is built and why that matters

MCSR Stats is a Next.js 14 application written in strict TypeScript and styled entirely with Tailwind CSS. That much is unremarkable; what is deliberate is the discipline underneath it. The project carries **no charting library, no icon package, and no font dependency**. Every graph, every diagram, every tier badge, and the rotating three-dimensional player model are all hand-built from raw SVG and CSS. The result is a site that loads quickly, renders identically on every machine, and has almost no surface area for the kind of dependency rot that quietly breaks hobby projects a year after they are written.

The data is real. Rather than shipping a canned snapshot, the application talks directly to the official MCSR Ranked API on the server side, and it does so responsibly: each category of request is cached with a revalidation window tuned to how quickly that data actually changes — a couple of minutes for the live ladder, longer for individual match details that never change once recorded. This means the numbers on screen are the true, current standings of the season in progress, but a burst of visitors never translates into a burst of hammering against the upstream API.

Visually, the platform commits to a single identity: a charcoal-and-obsidian palette lit by a small set of vibrant accents — a diamond blue for the top of the ladder, an emerald green for personal bests and victories, and an End-portal teal that ties the whole thing together. A fixed sidebar anchors navigation, a subtle grid overlay gives the content area its terminal-like texture, and every interactive element responds with a smooth, consistent transition. The aim throughout is that the interface should feel less like a fan site and more like the broadcast graphics package of a professional tournament.

---

## Module one: the global leaderboards

The front door of MCSR Stats is the leaderboard, and it is really three leaderboards in one, switchable by a tab strip.

The **Season Elo** board is the canonical ranking: the current top of the competitive ladder, each runner shown with their rating, their season phase points, a diamond-shaped tier icon, and the flag of their country. The tier icon is not decorative — it encodes the runner's division on a six-rung ladder that climbs from Coal through Iron, Gold, Emerald, and Diamond up to Netherite, with the colour of the badge shifting accordingly. Columns are sortable on click, so the same data can be read by raw rating, by phase points, or by rank, and a search field filters the field down to a single name instantly.

The **Best Times** board answers a different question — not "who is winning matches" but "what are the fastest completions anyone has recorded this season." Crucially, each record is shown in context: alongside the time and the date, the board displays the seed's overworld spawn type and its bastion type, so a 5:42 on a Ruined Portal / Housing seed is legible as exactly the kind of run it was.

The **Weekly Race** board surfaces the rotating weekly seed everyone runs against the clock, a lighter-weight, more social corner of the ranked ecosystem. Across all three boards, every runner's name is a link: clicking it carries you directly into the analytical heart of the application.

---

## Module two: player analytics

If the leaderboard is the front door, player analytics is the reason to come inside. This is the flagship of MCSR Stats, and it is where the platform earns its name. Searching a runner — by exact nickname, with autocomplete drawn from the top of the ladder — assembles a complete, live dossier on that player, and the page remembers who you last looked at, so navigating away and back returns you to them rather than an empty search box. A back button is always there to return to the search screen deliberately.

### The identity banner and the living avatar

Every profile opens with an identity banner, and its centrepiece is a genuine three-dimensional render of the player's own Minecraft skin. This is not a flat avatar image; it is a real model — head, body, arms, and legs — textured with the player's actual skin and assembled entirely from CSS transforms, which the visitor can grab and rotate horizontally with the mouse. Beside it sit the essentials: the runner's flag and name, their tier, their global rank, current and peak Elo, season win–loss record and win rate, best streak, and hours played.

### The five headline metrics

Below the banner runs a row of five metric cards, each a distilled answer to a question a runner cares about.

The **Personal Best** is the obvious one — the fastest ranked completion of the season.

The **Average of Best** is more interesting, because it measures consistency rather than a single lucky run. By default it averages the faster half of a runner's recent completions, filtering out the noise of both their best seed and their worst. But it is configurable: a control lets you switch between that "Best" half, a specific number of runs you type in, or "All" of them — and asking for more runs than exist simply averages everything, exactly as you would expect.

The **Pace Rank** card is, quietly, the platform's most original idea, and it deserves the section it gets below.

The **Completions / Played** card shows how many of a runner's matches actually ended in a finished run versus a reset or forfeit, rendered as both a ratio and a progress bar — a direct read on reset discipline. The **Current Streak** card rounds out the row.

### Pace Rank: comparing a player to the rank they deserve

Most analytics tools compare a runner against a single fixed "elite" baseline, which flatters no one and helps almost no one. MCSR Stats does something more useful. It maintains a table of the average split times of each rank on the ladder — what a typical Coal, Iron, Gold, Emerald, Diamond, or Netherite runner actually spends in each phase of the game — and it computes, from a player's own recent pace, the rank whose average completion their pace most closely resembles. That is their **Pace Rank**: the division their raw speed says they belong in, independent of the Elo that matchmaking has assigned them. A runner sitting in Gold by rating but posting Diamond-level times is told exactly that, and the split analytics below are then measured against the Diamond average rather than an unreachable ideal. It turns "you are slower than the best players in the world" into "here is precisely where you stand and what the next rung looks like."

### The Elo progression chart

A dedicated Elo section reconstructs the runner's rating over time from the Elo change recorded on every recent match, and draws it as a filled area chart. The view can be scoped to the last thirty or sixty matches or expanded to show everything on record, and hovering anywhere along the line raises a tooltip pinned to the nearest match, reporting its date, the resulting rating, and the exact points gained or lost. Summary tiles above the chart call out current and peak Elo, the net swing across the window, and the single biggest gain and loss — the shape of a season's momentum, readable at a glance.

### Phase and split analytics

Here the platform breaks a run into its seven canonical phases — the Overworld, the terrain crossing to the bastion, the bastion itself, the fortress, the blind travel, the stronghold navigation, and the dragon fight — using the checkpoint events embedded in real match timelines. The average time a runner spends in each phase is drawn both as a proportional bar across the length of a typical run and as a set of per-phase rows, each compared, in seconds, against the average of that runner's deserved Pace Rank. A companion table then widens the lens all the way: it lays the runner's phase times side by side with the average phase times of *every* rank at once, from Coal to Netherite, flagging with an arrow and a percentage wherever the runner is meaningfully faster or slower, and closing with a "Full Pace" row that totals the comparison into a single head-to-head against each division's complete average run.

### Recent matches and the match detail view

Finally, the profile lists the runner's recent ranked matches — fifteen by default, expandable to twenty-five, fifty, or a hundred — each row showing the opponent, the result, the finishing time, the seed, and the Elo change. Every row is clickable, and clicking one opens the platform's richest single view: a match detail modal, modelled on the timelines competitive runners already know from tools like Paceman. It centres cleanly over the page and lays the two competitors side by side, winner first, each with their rating before and after the match, a colour-coded pace bar, and a full vertical timeline of their run — nether enter, bastion, fortress, first rod, blind, stronghold, End enter, dragon death, finish — with the time differences between the two players called out at each shared checkpoint. A detail control lets the reader dial the timeline from just the major splits up through progressively finer events, all the way to every advancement the run recorded.

---

## Module three: the zero-cycle reference

The third pillar of MCSR Stats trades statistics for pure execution knowledge. The **zero-cycle** — killing the Ender Dragon in a single perch cycle by detonating beds or respawn anchors at frame-accurate positions — is the most demanding tech in the category, and getting it right depends on standing on exactly the correct block for the specific obsidian pillar you have pearled onto. The reference codifies the community's complete coordinate knowledge into an interactive table.

The ten pillars of the End, plus the special 1/8 straight-node case, are organised in a sidebar by size class — Small, Medium, Tall, and Special. Selecting a tower fills a table whose rows are standing heights and whose two columns are the front and back approach nodes. Each cell carries the full setup: the orientation, the exact player block coordinate to stand on, the bed coordinate, and, where they apply, a "bow" indicator and colour-coded warnings — for instance, that an anchor placed in the bed position will break the crystal. Where a height supports more than one setup, they stack within the cell; where a side has no setup, the cell reads plainly as unavailable. Orientation families are colour-keyed so that hybrid, offset, side, and straight setups are distinguishable at a glance, and a small line-up preview renders the selected pillar, the crystal, and your standing position in profile as you click through the heights. Beneath the table, a panel documents the four master dragon-pass nodes that every setup ultimately bridges toward, along with consistency tips drawn from the practice community. The data here is the real, current reference sheet — not an approximation — covering every tower, every viable standing height, and every offset variation.

---

## The threads that tie it together

Several ideas run through the whole application rather than living in any one module. The commitment to **live data** means the platform is never showing yesterday's ladder. The commitment to **deterministic, dependency-free rendering** means it looks and behaves the same everywhere and stays maintainable. The **Pace Rank concept** reframes every comparison on the site around a rank the runner can actually reach next, rather than an abstract ceiling. And a consistent set of small courtesies — the remembered last player, the exact-nickname search with suggestions, the sortable columns, the hover tooltips, the escape-to-close modal — add up to an interface that respects the time of the person using it.

---

## Conclusion

The MCSR ecosystem has never lacked for good individual tools; what it has lacked is a single, well-designed place that treats a runner's questions as connected rather than separate. **MCSR Stats** is an answer to that. It takes the live competitive ladder, a genuinely deep and original analytical profile for every player, and the complete execution reference for the game's hardest technique, and it presents them as one product with one visual language and one standard of polish. A runner can see where they rank, understand exactly how their pacing compares to the division above them, study any match down to the individual advancement, and pull up the precise coordinates for their next zero-cycle attempt — without ever leaving the site. That unification, delivered with the seriousness the scene has grown into, is the whole point.
