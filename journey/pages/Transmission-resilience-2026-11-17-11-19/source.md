---
status: designed
type: working-paper
evidence_date: 2026-11-18
---
Transmission resilience (2026-11-17)
working-paper, framework, performance, access

> A working paper written on 2026-11-18, published nearly as written. Local file paths, private repository names and personal names have been removed.

A permanent dimension of HeavyMap, separate from the state of any one dataset, layer or service. Decision: D-081 (affirmed by the owner). Working name; rename freely.

## 1. What it is

HeavyMap is maintained and improved, perpetually, at both ends of the transmission range:

- **Extremely low resolution**: HeavyMap still works over very weak or outdated channels: 2G, old phones and browsers, no JavaScript, a terminal, an agent that needs one fact quickly.
- **Very high resolution**: large, complete, high-fidelity versions for people and tools that can take them: full-resolution imagery and tiles, bulk downloads, offline packages.

The site most people see sits in the middle. The two ends are not afterthoughts of it; they are kept up as the data and services change.

**Starting focus** (the owner, 2026-11-17): the low end. Options for reaching HeavyMap through the browser or other tools that let weak or old ways of receiving data succeed, for example over 2G, or a CLI that answers humans and agents very quickly.

## 2. The ladder (proposed)

Each capability is described by the tiers it reaches. Tiers are views of the same releases, never separate truths.

| Tier | Name | Who and what | Shape | Target budget (proposed) |
|---|---|---|---|---|
| T0 | Signal | CLI, agents, scripts, `curl`, very old devices | One small text or JSON answer per question; stable URLs; no rendering | One request, under 5 KB, for one parcel or one story; under 1 s on broadband, under 3 s on 2G |
| T1 | Lite web | 2G, old browsers, data-saving users, no JavaScript | Server-rendered HTML; system fonts; no images unless asked; works with JS off and without ES modules | Under 50 KB per page; readable in under 3 s and complete in under 10 s on 2G |
| T2 | Standard web | Today's site | Current design | Tracked, not capped; regressions flagged (D-026 performance screen) |
| T3 | Rich | Wide screens, fast links | Full map, all layers, motion, 3D mark | No cap; must never be required for T0 to T2 |
| T4 | Heavy | Power users, offline, archives, partners | Bulk packages: whole-city tiles at high zoom, full-resolution imagery, complete public release archives | Size published with each package; resumable downloads |

2G reference profile used in measurements: 280 kbps down, 256 kbps up, 800 ms round trip (WebPageTest "2G").

## 3. Rules (proposed)

1. **Every new service or layer states its tiers at intake.** Alongside the performance screen (D-026, PO-08): which tiers it reaches, its T0/T1 form, or why it has none yet. A gap is recorded, not hidden.
2. **One release, many resolutions.** Low and high tiers are built from the same pinned releases, carry the same release ids and provenance, and say which release they show.
3. **Text before pixels.** What the map shows has a text equivalent: a parcel's facts, a layer's meaning, a story's evidence.
4. **Fast answers for agents.** Predictable URLs, small files, machine-readable JSON with plain-text options, and a short guide for agents. Speed is measured, not assumed.
5. **Budgets are checked.** Tier budgets are measured on every build; a regression is reported (and later blocks), like the app-size report under D-076.
6. **The high end is maintained too.** Heavy packages are kept current with releases, not produced once.
7. **The private/public line holds at every tier (D-079).** Low tiers answer one parcel at a time, exactly as the site does. No tier, and no bulk package, ships the compiled portrait set as a dataset. T4 bulk packages carry public Industrial Atlas data only, unless a later decision says otherwise.

## 4. Where HeavyMap stands today (measured 2026-11-17 on heavymap.com)

Desktop Chromium, cold cache. "Readable" = the page's main text has arrived; "settled" = loading finished.

| Page | Broadband: transfer | 2G: readable | 2G: settled | Works without JavaScript |
|---|---|---|---|---|
| Home | 1,060 KB, 16 requests | 1.2 s | 31 s | Yes (stories and links) |
| Reader | 600 KB, 13 requests | 2.2 s | 17 s | Yes (story list) |
| Story page | 600 KB, 13 requests | 1.1 s | 17 s | Yes |
| Docs | 600 KB, 13 requests | 1.1 s | 17 s | Shell only (local tool) |
| Map | 1,740 KB, 38 requests | n/a | 69 s to the map | No (77 characters of chrome) |

What the bytes are on a story page (the story itself is 6 KB of HTML):

| Item | Transfer |
|---|---|
| Favicon `heavy-element-favicon.png` (512×512, 16-bit) | 182 KB |
| Mark image `heavy-element-mark.png` | 121 KB |
| Wordmark fonts (Cantarell 700 and 800 as OTF) plus IBM Plex | about 200 KB |
| Site script and stylesheet | 45 KB + 39 KB |

Map extras: app script 319 KB, home map image 190 KB, development indicators 129 KB, release file list 96 KB, basemap and layers.

Parcel lookup from published files (what a CLI or agent can do today): the manifest (3 KB) gives the shard rule, then one shard (about 20 KB gzipped, 181 parcels) holds the record (about 1 KB). Two requests, about 23 KB, for 1 KB of answer. There is no address-to-parcel lookup without loading the map.

Reading: the prerendered pages already put text first, so the editorial side is close to T1 once fixed costs are cut. The map has no T0 or T1 form yet, and agents have no small, direct parcel answer.

## 5. First steps (backlog, proposed order)

| Id | Step | Tier | Why first |
|---|---|---|---|
| BL-124 | Cut fixed page costs: favicon to a few KB, mark as small SVG or WebP, wordmark fonts subset to WOFF2 (or system fallback in T1) | T1, T2 | About 500 KB off every page for little work; story pages drop from about 600 KB toward 100 KB |
| BL-125 | Agent and CLI access, read-only: one small JSON (and plain text) answer per parcel and per story, an address-to-parcel lookup index, and an agent guide (`llms.txt`-style) describing them | T0 | The CLI goal; respects D-079 (one parcel per answer) |
| BL-126 | A `heavymap` command-line client over BL-125: look up a parcel by key or address, list stories, print text or JSON | T0 | Proves the T0 path end to end; usable by people and agents |
| BL-127 | Lite web tier: a no-JS, no-font, image-free mode (and a text parcel page) that meets the T1 budget on 2G and in old browsers | T1 | Gives the map a text form |
| BL-128 | Tier budgets in the build: measure each tier's sizes on every build and report regressions; a 2G and old-browser check in the test set | All | Keeps it perpetual rather than a one-off cleanup |
| BL-129 | Heavy tier inventory: which high-resolution packages to offer (tiles at high zoom, imagery, public release archives), their sizes and update rhythm | T4 | Keeps the high end on the books from the start |

Related, already recorded: roadmap stage ST-6 "Reach" (offline and tiered delivery for extreme channels, now superseded in timing by D-081: this starts now and never ends), S-024 offline cache (candidate), performance opportunities PO-01 to PO-08.

Experiments: BL-130 browser SQL over the city (DuckDB-Wasm over a public parcels Parquet file; T3 in the browser, T0 through the `duckdb` CLI), brief in `docs/2026-11-18-experiment-browser-sql.md`.
Ideas and insights for map loading and questions (techniques catalogue, shared edges, FlatGeobuf, question templates): `docs/2026-11-18-map-loading-and-questions-ideas.md` (DOC-108).

## 6. Open questions

- Name: "transmission resilience" for now.
- Hosting: T0 and T1 as static files on GitHub Pages (166,745 parcel files is feasible but large), or a small server later. Static first keeps the current deploy model.
- Should T0 answers be plain text by default with JSON on request, or the reverse? Agents favour JSON; people at a terminal favour text.
- Which old browsers to support at T1 (no ES modules, no CSS grid)?
- T4: which packages are public (IA data) and which, if any, are commercial.
