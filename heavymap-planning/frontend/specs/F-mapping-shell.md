# Spec F: mapping shell and reading alongside the map

Status: **draft; questions partly answered** (decisions 54–57), 2026-11-10. Local issues HM-009 (shell) and HM-018 (map introduction). Written against branch `heavymap-mainsite-v1`.
Depends on: [Spec A](A-product-structure.md) (sections 3.3 capability states, 7.1 map introduction); [Spec C](C-reader-continuity.md) (reading position, Reader URL); [Spec D](D-visual-system-themes.md) (invariant 5: map data styling doesn't change with theme or mode; decision 40); decisions D4 (split pane / bottom sheet) and 17 (v1 map introduction).
Backend contracts this spec consumes, without changing them:
- [`docs/architecture/parcel-dossier.md`](../../../docs/architecture/parcel-dossier.md) (record schema v1, shards, manifest);
- [`claim-refusal-contract.md`](../../../docs/architecture/claim-refusal-contract.md) (grades and refusals);
- [`publish-visibility.md`](../../../docs/architecture/publish-visibility.md);
- [`heavymap-id-registry.md`](../../../docs/architecture/heavymap-id-registry.md);
- [`BETA-GATE-HAMILTON.md`](../../BETA-GATE-HAMILTON.md) section 6 (accepted size budgets).

Reference implementation: `web/map.html` with `src/app.js`, `map.js` and `dossier.js` (the synthetic Hamilton prototype), and `openMap`/`closeMap` in `src/editorial/alternate.js` (the iframe reveal plus the dock). They are a starting point, not the contract.

Labels used in this document:
- **Decided**: Morgen chose it.
- **Proposed**: this draft recommends it and it needs acceptance.
- **Open**: deliberately left unresolved.

## 1. Two stages of the map

| Stage | When | What `/map/` is | Atlas data |
| --- | --- | --- | --- |
| **v1: introduction** | at launch (decision 17) | a static, basemap-only view of Hamilton with a modal story about HeavyMap | **none** |
| **Workspace** | per geography, once that geography is `published` after its Stage B sign-off (HARD-RULES 3, NA-269) | the lens and dossier application, at `/map/<geography>/` (for example `/map/hamilton/`) | the screened artifacts in section 7 |

Most of this spec (sections 4 to 8) covers the workspace, so that it's ready when sign-off comes. **Nothing in sections 4 to 8 ships publicly in v1.** It may be built and shown in preview builds using synthetic fixtures, which are labelled as synthetic.

## 2. v1 map introduction (`/map/`)

```
┌────────────────────────────────────────────────────────────────────┐
│ HeavyMap◒   Desks  Reader  Map  About              [theme ▾] [Subscribe] │  ← shared header (spec A)
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│   pannable Hamilton basemap (no parcels, no lenses, nothing clickable) │
│        ┌──────────────────────────────────────────┐                │
│        │  The map behind the news                 │ ← modal story  │
│        │  …what HeavyMap's workspace will show…   │   (dialog)     │
│        │  Hamilton is in preparation.             │                │
│        │  [Read the latest editions]  [Close]     │                │
│        └──────────────────────────────────────────┘                │
│                                                © OpenStreetMap contributors │
├────────────────────────────────────────────────────────────────────┤
│ HeavyMap◒  Hamilton, Ontario · basemap only · in preparation   [Back to reading ↑] │  ← dock
└────────────────────────────────────────────────────────────────────┘
```

- **Basemap (decided, 54): a pannable vector basemap.**
  - MapLibre GL JS `6.14.0` with `pmtiles` `4.3.0`, the versions the prototype already pins.
  - *Proposed (F-Q7):* a **self-hosted Protomaps basemap extract** for the Hamilton bounding box, cut with `pmtiles extract` from a dated Protomaps build. It's OpenStreetMap-derived (ADR 0001), served from the site's own origin with no third-party tile service, and well under the 100 MB per-file budget. The build records the build date and the SHA-256.
  - **Bounded:** `maxBounds` set to Hamilton plus a margin, and zoom limited to about 9–16, so the map can't wander off into an empty world.
  - **Nothing clickable:** no hover, click, tooltip or feature query. Readers can pan and zoom only, with keyboard pan and zoom through MapLibre's handlers.
  - **The map is decorative for assistive technology.** The canvas has `aria-label="Basemap of Hamilton, Ontario. No HeavyMap data is shown."`, and the modal and dock carry the content.
  - **Load order:** the HTML, header, dock and modal render first. MapLibre and the basemap load in parallel behind the modal. The app code is about 450 KB compressed, within the 500 KB app-shell budget (decision 56).
  - **No WebGL:** a pre-rendered static image of the same view is shown instead, with the same attribution.
- **Attribution:** "© OpenStreetMap contributors" stays visible on the map, and is also listed in `/about/credits/` (spec B section 6).
- **Modal story:**
  - It's a `<dialog>` opened on page load. Focus goes to its heading, and Escape and Close both dismiss it.
  - Once closed, it stays closed for the session (`sessionStorage`, wrapped in try/catch). It can be reopened from the dock ("About the map").
  - Copy: Claude drafts and Morgen edits (decision 55); the draft is in section 2.1. It must not promise a date (spec A section 7.1), and must not use "available", "vacant" or "failing" as HeavyMap's own words (claim-refusal contract non-goals).
- **Dock in v1:** wordmark, then "Hamilton, Ontario · basemap only · in preparation", then "About the map" and "Back to reading ↑" (section 3.3).
- **No parcel data, no Atlas identifiers, no lens names.** The page source contains none of them. The section 7.4 build check enforces this.
- **Dark mode:** the basemap style doesn't change (decision 40). The header, dock and modal follow the theme and mode.

### 2.1 Modal story: draft copy (for Morgen to edit)

> **The map behind the news**
>
> HeavyMap's Desks report what is being built, bought, funded and closed across Western New York and Niagara–Brant. The map is where that reporting will meet the land itself.
>
> We are preparing a working map of Hamilton, Ontario, parcel by parcel. For each parcel it will show what public records say, where each fact comes from, how it was matched to the land, and where the records are silent or disagree. When a source can't support a statement, the map will say so rather than guess.
>
> It isn't open yet. Each place opens only after its data has been checked and screened, and we'll announce it in the Desk editions.
>
> Until then, this is Hamilton as OpenStreetMap draws it. Move around; nothing here is HeavyMap data yet.
>
> [Read the latest editions]  [Close]

Notes on the draft:
- "parcel by parcel" and "where the records are silent or disagree" describe the dossier's coverage, gaps and refusals without naming internal terms.
- It makes no date promise and doesn't use "vacant", "available" or "failing".
- "we'll announce it in the Desk editions" implies an edition will carry the announcement. Delete it if that isn't intended.

## 3. The shell: header, dock and reveal

### 3.1 One shell, no duplicate chrome

The prototype has two sets of chrome when the map is open:
- the map app's own top bar (wordmark, "Hamilton, Ontario / Field guide 001", "Synthetic local prototype");
- the site's bottom dock.

**Proposed:** the map pages use **the shared site header** (spec A section 6) and **one dock**. The map app's own top bar is removed. Its geography label moves into the dock, and its prototype label goes into the preview banner (spec G).

### 3.2 Opening the map

| From | Action | Result |
| --- | --- | --- |
| Header "Map" | link | navigates to `/map/` (v1) or the geography index (workspace stage) |
| Home map strip | link | the same, with the reveal (section 3.4) |
| Desk or item page "See on map" | **not built** (decision 57: no connections between items and the map yet) | n/a |

The map is a **page**, not an iframe overlay on top of the reading page. The prototype's iframe pattern is replaced, because:
- an iframe keeps two documents, two focus scopes and two scroll positions alive;
- separate pages make the map's URL shareable and its loading measurable on its own.

### 3.3 "Back to reading"

- If the reader came from a HeavyMap page in this tab, `history.back()` returns them there. The browser restores the scroll position; spec C's position covers items.
- If they arrived directly, for example from a shared link, it goes to `/`.
- The label stays "Back to reading ↑" either way.

### 3.4 The reveal

The handoff described a map strip that reveals the workspace, with the editorial page lowering into the bottom bar.

- **Proposed:** a **cross-document view transition**. The home map strip and the map page share a `view-transition-name`, so the strip grows into the map while the header shrinks into the dock. It's progressive enhancement: browsers without cross-document view transitions simply navigate.
- **Reduced motion:** with `prefers-reduced-motion: reduce`, there's no transition at all; the page swaps instantly.
- **Duration:** at most 400 ms. Nothing animates on its own after load.

### 3.5 Dock states

```
                      ┌──────────────┐
         header Map / │   reading    │  (site pages, no dock)
         map strip    └──────┬───────┘
                             ▼
┌────────────────────────────────────────────────────┐
│ intro (v1)          "basemap only · in preparation" │──Back to reading──► reading
└────────────────────────────────────────────────────┘
        (once a geography is published)
                             ▼
┌───────────────┐  pick item / "Read alongside"   ┌──────────────────────┐
│  workspace    │ ───────────────────────────────►│ workspace + reading  │
│  <geography>  │ ◄─────────────── close pane ────│ (split / sheet, §5)  │
└──────┬────────┘                                 └──────────────────────┘
       │ geography not published / artifact missing / load failed
       ▼
┌──────────────────────────────────┐
│ unavailable · error (section 8)   │──Retry / Back to reading──►
└──────────────────────────────────┘
```

| State | Dock text | Dock actions |
| --- | --- | --- |
| intro | "Hamilton, Ontario · basemap only · in preparation" | About the map · Back to reading |
| workspace | "<Geography> · <artifact date>" | Geography ▾ (if more than one is published) · Reader · Back to reading |
| workspace + reading | the same, plus "Reading: <title>" | Close reading · Back to reading |
| unavailable | "<Geography> · not yet published" | Back to reading |
| error | "Map didn't load" | Retry · Back to reading |

The dock is a `<nav aria-label="Map">`. In the reading-alongside layout it stays at least 44 px tall on touch layouts (spec D section 8).

## 4. Workspace (when a geography is published)

- **URL:** `/map/<geography>/`. Its view state goes in the query string: `?focus=<heavymap_id>&lens=<lens>&read=<item id>`. Like Reader URLs, these are shareable and not saved (spec C section 5.1).
- **Keep the prototype's app logic:** lenses, context layers, search, the dossier panel, tooltips, the "flag, never extinguish" treatment of slivers, refusal copy. The prototype was not redesigned, and its interaction model stays. Only the chrome changes (section 3.1).
- **Geography switching:** the dock lists only `published` geographies (spec A registry). With one geography, there's no switcher.
- **The identifier rename stays paused.** The workspace reads `heavymap_id` with the `hm:ca:on:hamilton:parcel:` prefix as it exists today (`src/contract.js`), and doesn't implement the rename or carry out the repo split.

## 5. Reading alongside the map (decision D4: split pane / bottom sheet)

| Layout | Pattern | Map camera |
| --- | --- | --- |
| Desktop (at least 960 px) | **split pane**: the map on the left, a reading pane on the right, 40% wide (min 380 px, max 560 px), with a resizable divider (keyboard: arrow keys in steps of 5%) | MapLibre `padding.right` = pane width, so a focused parcel centres in the visible map |
| Mobile | **bottom sheet** with three snap points: peek (96 px, title only), half (50% of the viewport), full (100% minus the dock) | `padding.bottom` = the sheet's current height. At full, the map is hidden from assistive technology (`inert`) |

- **What the pane shows:** the same item rendering as the Reader pane (spec B section 10, "in HeavyMap's layout"), with Mark read/unread, position saving and the end marker. Spec C applies unchanged, and `via` records `reader`.
- **Opening:** from the dock's Reader control only. The dossier never offers a reading link (decision 57).
- **Focus:** opening moves focus to the article heading. Closing returns focus to the control that opened it. Escape closes the sheet or pane first, then the dossier, and never leaves the page.
- **Scrolling:** one scroll container per region (map, pane). On mobile, the sheet scrolls inside itself only when it's at full.

## 6. No connections between items and the map (decision 57)

**Decided:** for now, news and other items have **no connection** to the map. That rules out:
- "See on map" links from Desk, edition or item pages;
- "Read alongside" links from a dossier;
- highlighting an area because an item mentions it;
- any statement in a dossier about an item, or in an item about a parcel.

What stays, because the reader makes the choice: the Reader pane alongside the map (section 5). The pane header says "Reading", and the map and dossier don't react to what is open in it. This is juxtaposition, not association.

**For when connections are reconsidered** (not in scope now), keep the principle: an item may be linked to a parcel only through an accepted relationship that names that parcel's `heavymap_id`, approved through MAKE. A place or district mention is never enough to point at a parcel.

## 7. Producer–consumer contract (the checklist the workspace build runs)

The workspace consumes screened Atlas artifacts. It extends the existing dossier, manifest and identifier contracts and doesn't invent substitutes.

### 7.1 What the build pins

| Item | Source | Checked at build |
| --- | --- | --- |
| Jurisdiction | `manifest.json` `jurisdiction` | matches a `published` geography in `content/regions.json` |
| Producer run | dossier output folder date and run id; overlay run id (for example `20261017-val2`); registry `CURRENT` | recorded in the build's `map-artifacts.json` |
| Producer revision | the industrial-atlas commit that produced the run | recorded; the build fails if it's missing |
| Schema | dossier record schema `1`; shard `{"schema":1,…}` | the build refuses an unknown schema |
| Hashes | SHA-256 of `manifest.json`, each shard and each `.pmtiles` | verified at build against a run record; **open: who writes the run record** (F-Q4) |
| Allowed fields | `RECORD_SPEC` in `heavymap/dossier/schema.py` | the frontend reads only those keys; an extra key fails the build, not the page |
| Visibility | `publish_visibility` per dataset (`publish-visibility.md`) | `withheld` datasets follow `withheld_disclosure` (backlog D4, still open); the build fails while D4 is unset |
| Held identifying information | backlog D3 (coverage-based signal is the recommendation) | **open**; until it's decided, the dossier shows no held-information element |
| Gap ledger | `manifest.gaps_ledger` | every `gaps` id resolves; `withheld_screened` rows never appear on a parcel |
| Pre-publish | `python3 -m heavymap.prepublish` (NA-306) | it must pass on the exact output being deployed |

### 7.2 Runtime reads

- **On start:** `manifest.json` (about 7 KB), the style, and the first-view tile header.
- **On click:** `shards/<last two characters of heavymap_id>.json`, cached per shard.
- **No other data request.** Search uses the prefix-sharded index (backlog HM-17) once it exists. Until then, search is limited to the loaded tile features.

### 7.3 What the frontend never does

- It never fills in a refused value, shows "0" for unknown (HARD-RULES 8), or uses "vacant", "available" or "failing" as its own words (HARD-RULES 12, claim-refusal contract).
- It never drops a sliver row (parcel-dossier "flag, never extinguish").
- It never shows a field outside `RECORD_SPEC`, even if one appears in a shard. The build check is the first line, and the renderer allowlist is the second.

### 7.4 Build checks

- **v1 introduction:** the `/map/` output contains no `heavymap_id`, `hm:` identifier, lens name or Atlas layer id.
- **Workspace:** the build doesn't generate `/map/<geography>/` unless that geography is `published` (spec A section 3.3 rule 1) and the section 7.1 checks pass.

## 8. Loading, failure and unavailable states

A network failure must never look like evidence: never "nothing here", never a refusal.

| Case | What the reader sees | Never shown |
| --- | --- | --- |
| Tiles loading | the basemap or skeleton plus "Loading map…" in the `role="status"` region | n/a |
| A tile request fails | "Some map tiles didn't load. [Retry]"; parcels already drawn stay | empty-area styling |
| `manifest.json` fails or has an incompatible schema | the dock error state: "The map didn't load. [Retry] · Back to reading" | the lens list with zero counts |
| A shard fails | the dossier shows "Couldn't load this parcel's notes. [Retry]" | refusal copy, "No data" |
| A shard loads but has no record for the ID | "This parcel isn't in this map edition" (the artifact mismatch is logged) | a blank dossier |
| WebGL unavailable | "This map needs a browser with WebGL. Editions and the Reader work without it." with links | a broken canvas |
| Geography not published | the dock's unavailable state; no tiles requested | a map of nowhere |

Retry uses exponential backoff for tiles, which MapLibre handles itself, and is a manual button for the manifest and shards.

## 9. Size budgets

Accepted (BETA-GATE section 6, 2026-10-18):
- startup payload ≤ 50 KB compressed;
- per-click dossier shard ≤ 50 KB compressed (p95);
- each `.pmtiles` ≤ 100 MB;
- total site ≤ 1 GB.

**Still open (backlog D2, F-Q5): what "startup payload" covers.** The prototype's first load is about 459 KB compressed, of which MapLibre is 299 KB plus a 145 KB worker. Options from the backlog:
- **A (recommended there):** the 50 KB covers data only (manifest, gap ledger, first-view style and index). A separate app-shell budget of ≤ 500 KB compressed covers the code.
- **B:** 50 KB covers everything on first paint. That needs a light intro, with MapLibre loaded on first interaction.
- **C:** A as the default and B as a "lite" profile (NA-310).

**Decided (56): option A.**
- The 50 KB covers start-up **data**: the manifest, gap ledger and first-view style and index.
- App code has its own budget of ≤ 500 KB compressed.
- In the v1 introduction the start-up data is the basemap style plus the PMTiles header and first-view tiles, and both budgets apply to it.

**No whole-city performance claims from synthetic fixtures.** Budget checks run on the real Hamilton output on deb before Stage B.

## 10. Work this implies (for implementation planning, not yet assigned)

| ID | Work |
| --- | --- |
| F-T1 | `/map/` introduction page: Hamilton basemap extract, bounded pannable map, static no-WebGL fallback, modal story, v1 dock |
| F-T2 | Shared header and dock on map pages; remove the map app's own top bar |
| F-T3 | Cross-document view transition with a reduced-motion bypass |
| F-T4 | Workspace page `/map/<geography>/` with query view state (preview builds only) |
| F-T5 | Split pane and bottom sheet with camera padding |
| F-T6 | Section 7 build checks and `map-artifacts.json` |
| F-T7 | Section 8 failure states |

## 11. Answers and open questions

| ID | Question | Status |
| --- | --- | --- |
| F-Q1 | v1 basemap | **Decided (54):** a pannable vector basemap with nothing clickable |
| F-Q2 | Modal story copy | **Decided (55):** Claude drafts (section 2.1) and Morgen edits |
| F-Q3 | Item–map associations | **Superseded (57):** no connections between items and the map for now |
| F-Q4 | Who writes the run record with artifact hashes? | **Open.** Proposed: the Atlas run on deb writes it; the frontend only verifies |
| F-Q5 | Startup payload meaning (backlog D2) | **Decided (56):** option A, data ≤ 50 KB plus app ≤ 500 KB |
| F-Q6 | Cross-document view transition for the reveal | **Open.** Proposed: yes, as progressive enhancement |
| F-Q7 | Basemap source | **Open.** Proposed: a self-hosted Protomaps extract for Hamilton |
