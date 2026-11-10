# Spec F: mapping shell and reading alongside the map

Status: **draft for Morgen's review**, 2026-11-10. Local issues HM-009 (shell) and HM-018 (map introduction). Written against branch `heavymap-mainsite-v1`.
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
│   static Hamilton basemap (no parcels, no lenses)                  │
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

- **Basemap (F-Q1):** *proposed:* a **pre-rendered static image** of Hamilton, built from an OpenStreetMap-derived basemap (ADR 0001) at build time, served as AVIF/WebP with a PNG fallback, at two sizes (desktop and mobile) through `srcset`. No map engine loads on this page. The alternative is a pannable vector basemap (MapLibre plus a PMTiles basemap). That costs about 450 KB compressed (HM-PI-0002) for a page with nothing to click.
- **Attribution:** "© OpenStreetMap contributors" stays visible on the image, and is also listed in `/about/credits/` (spec B section 6).
- **Modal story:**
  - It's a `<dialog>` opened on page load. Focus goes to its heading, and Escape and Close both dismiss it.
  - Once closed, it stays closed for the session (`sessionStorage`, wrapped in try/catch). It can be reopened from the dock ("About the map").
  - Copy is owned by Morgen (F-Q2). It must not promise a date (spec A section 7.1), and must not use "available", "vacant" or "failing" as HeavyMap's own words (claim-refusal contract non-goals).
- **Dock in v1:** wordmark, then "Hamilton, Ontario · basemap only · in preparation", then "About the map" and "Back to reading ↑" (section 3.3).
- **No parcel data, no Atlas identifiers, no lens names.** The page source contains none of them. The section 7.4 build check enforces this.
- **Dark mode:** the image doesn't change (decision 40). The header, dock and modal follow the theme and mode.

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
| Desk or item page "See on map" (workspace stage only, and only with an accepted relationship, section 6) | link | `/map/<geography>/?focus=<heavymap_id>` |

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
- **Opening:** from the dock's Reader control, or from a "Read alongside" link in the dossier when a relationship exists (section 6).
- **Focus:** opening moves focus to the article heading. Closing returns focus to the control that opened it. Escape closes the sheet or pane first, then the dossier, and never leaves the page.
- **Scrolling:** one scroll container per region (map, pane). On mobile, the sheet scrolls inside itself only when it's at full.

## 6. Geographic association versus the reader's own juxtaposition

Two different things can put an article next to a parcel, and the interface must never blur them.

| | **Association** | **Juxtaposition** |
| --- | --- | --- |
| What it means | the item **is about** this place, through an accepted relationship in the content (spec B: `place`, `county`/`districts`, or a future `parcels: [heavymap_id]` field approved through MAKE) | the reader opened an item while looking at a parcel |
| Shown as | "This story concerns <place>" with its source, plus a "See on map" link | no link between them; the pane header says "Reading" and the dossier says nothing about the article |
| Map styling | may highlight the associated area (a district, not a parcel, unless the relationship names the parcel) | nothing highlighted |

**Rules:**
1. An article is never linked to a **parcel** unless an accepted relationship names that parcel's `heavymap_id`. A place name or district association highlights the district, not the parcels in it.
2. Reading an item while a dossier is open adds no statement to the dossier, and the dossier adds none to the item.
3. **Proposed (F-Q3):** v1 content has no parcel-level relationships, so the workspace stage at first shows **district-level associations only**.

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

**How the v1 intro relates:** with a static image (F-Q1), `/map/` loads no map engine. It fits option B's spirit today (HTML, CSS and the shared JS under 50 KB, with the image counted separately). The decision matters only for the workspace stage.

**No whole-city performance claims from synthetic fixtures.** Budget checks run on the real Hamilton output on deb before Stage B.

## 10. Work this implies (for implementation planning, not yet assigned)

| ID | Work |
| --- | --- |
| F-T1 | `/map/` introduction page: static basemap render step, modal story, v1 dock |
| F-T2 | Shared header and dock on map pages; remove the map app's own top bar |
| F-T3 | Cross-document view transition with a reduced-motion bypass |
| F-T4 | Workspace page `/map/<geography>/` with query view state (preview builds only) |
| F-T5 | Split pane and bottom sheet with camera padding |
| F-T6 | Section 7 build checks and `map-artifacts.json` |
| F-T7 | Section 8 failure states |

## 11. Open questions for Morgen

| ID | Question | Proposed answer |
| --- | --- | --- |
| F-Q1 | v1 basemap: a static image, or a pannable vector basemap? | A static image (no map engine on `/map/` in v1) |
| F-Q2 | Who writes the modal story copy? | Morgen, or a draft by Claude for Morgen to edit |
| F-Q3 | Workspace associations: district level only until parcel relationships are approved in MAKE? | Yes |
| F-Q4 | Who writes the run record with the artifact hashes that the build verifies? | The Atlas dossier/prepublish run on deb writes it next to the output; the frontend only verifies |
| F-Q5 | Backlog D2: what does "startup payload ≤ 50 KB" cover? | Option A: data only, plus a ≤ 500 KB app-shell budget |
| F-Q6 | Reveal: is a cross-document view transition acceptable as progressive enhancement (some browsers simply navigate)? | Yes |
