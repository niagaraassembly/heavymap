# Combined front-end prior-art glean

**Status:** living assessment. Linear **NA-32** (EPIC 10 — Front end and map experience), with **NA-27** (dossier assembly), **NA-11** (PCDP), **NA-17** (OSM substrate), **NA-285** / **NA-286** (UK atlas folder as process reference).
**Date:** 2026-10-17.
**Author:** Cursor Cloud Agent.
**MCS cells changed:** none.

A front-end reading of the two earlier prototypes HeavyMap will build from. This document records **function to keep**, **visual language not to reuse**, and **code that could be ported as pattern**. It does not implement a map, fetch data, or settle open aesthetic questions.

**Sources (code and notes only; no UK geography ingested):**

- `first-attempts/uk-atlas/` — UK Industrial Atlas, process reference after **NA-286** removed its data files. Original live repo: `babbworks/atlas`.
- `first-attempts/niagara-atlas/` — Hamilton–Niagara map prototype (Leaflet + committed GeoJSON).
- Product frame: `docs/architecture/` (**NA-11**). Hamilton first-view notes: `heavymap-planning/focus/hamilton/INSIGHTS.md`, `DECISIONS.md`, `fast-loading-evidence.md`.
- Earlier capability notes (do not duplicate): `docs/grok-bot-docs/04-uk-capability-glean.md`.

**Not in this document:** UK datasets, owner values, publish or deploy tooling, a chosen HeavyMap look.

---

## What the new front end is aiming at

Recorded so the glean is judged against the product, not against the prototypes as destinations.

- First geography: Hamilton, Ontario.
- Stack: MapLibre + PMTiles on GitHub Pages. Static. Whole site under about 300 MB. No file over 100 MB. Startup payload small.
- First view: Hamilton framed by Greenbelt and conservation layers ("encased by nature"). See `heavymap-planning/focus/hamilton/INSIGHTS.md` and PI-0011.
- Parcel dossier: every overlapping zone and designation, with area shares. Labels are source-quoted (`City class: Vacant Lands`, `Tax class confirmed: industrial`). HARD-RULES 12; `docs/architecture/claim-refusal-contract.md`.
- Identity that may be shown: roll number, tax class, civic address. Owner names and personal information are never shown (HARD-RULES 2 and 4).
- The owner’s judgement of the prototypes: the UK atlas dossier is the head start; the Niagara map was also good; the new build should look **different**. Keep function, not chrome.

PCDP (`docs/architecture/PCDP.md`) already says Leaflet, basemaps, symbol design and panel layout are **not** the protocol. Surfaces are `selection`, `dossier`, `share`, `export`. Chrome is deferred until G6. This glean is so the later chrome does not have to rediscover what the prototypes already proved.

---

## 1. UK Industrial Atlas (`first-attempts/uk-atlas/`)

### 1.1 Stack

Pure static SPA. No build step, no framework, no database (`README.md` lines 23–35, 39–54; `system/project-notes.md` lines 7–13).

| Piece | What it is |
|---|---|
| Pages | `index.html` (map shell), `property.html` (deep-link dossier), `property-map.html` (map-centric twin) |
| CSS | `styles.css` — IBM Plex Sans / IBM Plex Mono, cream paper (`#ece9e2`), dark header (`#1c1c1c`) |
| Orchestrator | `app.js` — `App` IIFE: state, filters, results, feature panel, search, URL hash, postcards |
| Map | `map.js` — `MapModule` IIFE: Leaflet 1.9.4, inset navigator, region overlay, MarkerCluster, Leaflet.Draw |
| Query | `overpass.js` — Overpass QL builder, 15-minute session cache, 1,000-element cap |
| Registers | `planning.js`, `companies.js`, `voa.js`, `voa_geo.js`, `fsa.js`, `epr.js`, `strategy_zones.js`, `inspire.js` |
| Score | `scoring.js` — OSM-tag opportunity 0–100 with confidence and named signals |
| Local proxy | `server.py` — Companies House Basic-auth proxy (key from env; hardcoded key was revoked, **NA-8**) |
| CORS worker | `inspire-proxy/worker.js` + `wrangler.toml` — HMLR INSPIRE through Cloudflare |
| ETL notes | `scripts/process_*.py`, `split_voa.py`, `geocode_voa.py`; `system/datasets.md` |

CDN scripts in `index.html` (lines 322–337): Leaflet, MarkerCluster, Leaflet.Draw, html2canvas. Fonts from Google Fonts.

### 1.2 Architecture

`README.md` lines 70–103 describe the split: `app.js` owns state; `map.js` owns Leaflet; `overpass.js` owns fetch. That split is the useful idea. The live-query part is not.

**Data loading (rejected for HeavyMap as a primary path).** At zoom ≥ 10 the user clicks Run Query. `app.js` `runQuery()` (lines 101–156) fires Overpass and optional Planning Data in parallel, then paints clustered markers. Cache key is `filters + bbox`, TTL 15 minutes, evicted stale (`overpass.js` lines 10–12, 115–120). Result cap 1,000; list display cap 300 (`app.js` lines 241–284).

**Tiling / format.** No vector tiles. Overlay registers that still exist as code expected static JSON shards (`voa.js` lines 4–7, 38–60: `data/voa/{AREA}.json`, in-flight promise de-duplicated). Those data files were removed (**NA-286**). The *shard-on-key-prefix* pattern remains.

**Map library.** Leaflet 1.9.4. OSM raster tiles plus Esri World Imagery (`map.js` `_buildBaseLayers()`, lines 101–116). Inset uses CartoDB light at maxZoom 8 (lines 200–201). UK bounds and minZoom 5 / maxZoom 19 / run-min zoom 10 (`map.js` lines 8–14, 533).

**Why this is a process reference, not a product seed.** ADR 0001 (`docs/architecture/adr/0001-osm-as-substrate.md`) already locks: OSM tiles as substrate, **no** Overpass extract or prefetch as the intelligence corpus. Niagara `INTEGRATION.md` line 8: “the browser never calls a public API.” HeavyMap’s Hamilton build is pre-tiled PMTiles, not live Overpass.

### 1.3 UI structure

Three-column shell (`index.html` lines 39–311; `styles.css` lines 22–144):

1. **Header (46 px, dark).** Brand mark + “Industrial Atlas UK”, three mode buttons (Workshops / Urban Mfg / Hidden Industry), Map / Satellite switch.
2. **Left sidebar (270 px, white).** Place search, Quick Areas presets, query filters, lifecycle filters, collapsible Planning Overlays and External Datasets, tools (Draw Area, VOA Gaps, Export CSV, Share Link), pinned Run Query dock.
3. **Map.** Full remaining width.
4. **Right sidebar (298 px).** Mutually exclusive panels: welcome, results, feature, analysis, gap, gap-detail (`app.js` `showPanel()`, lines 67–70).
5. **Mobile.** Two FABs toggle the sidebars (`index.html` lines 319–320).

Mode presets are named filter bundles (`app.js` lines 7–12). They are a product idea (named industrial modes), not a look.

### 1.4 Dossier / detail-panel patterns — the head start

Two surfaces, not one.

**A. In-map feature panel** (`app.js` `_showFeatureDetail()`, lines 291–406). Click a result or a marker. Right panel shows name, type badge, area, coordinates, the opportunity score with named `+/-` signals, collapsed OSM tags, outbound links (OSM, iD, Google Maps, Street View), then Property / Map / Card actions. After paint it asynchronously fills Companies House and VOA sections (`_loadCompanies` / `_loadVOA`, lines 404–405, 410+).

**B. Deep-link property page** (`property.html`). This is the dossier the owner means.

- Routed by hash `#node|way|relation/{id}` (`property.html` lines 471–487).
- `?from=` restores the atlas hash on the back link (lines 464–469).
- Fetches one OSM element, then renders: type / lifecycle / area badges, name, coordinates, `osm.org/{type}/{id}`, inset map, **Opportunity Score** with signals and a written disclaimer (“does not confirm vacancy”), quoted OSM tags as `key = value` rows, outbound source links, Street View, Open in Atlas, Full Map View (lines 358–461).
- **Notes module** is local-only: typed notes, Ctrl+Enter, “Save Page” clones the DOM, inlines `styles.css`, strips scripts, replaces the map with a placeholder, and downloads a standalone HTML file (lines 203–287). No account, no server.
- Sibling `property-map.html` is the same facts in a three-pane map layout (score left, map centre, tags + links right, identity footer).

What to take from this, functionally:

| Keep | Why |
|---|---|
| A **shareable URL that is the unit**, not the map state | PCDP `dossier` and `share` surfaces. HeavyMap would use a spine key, not an OSM id. |
| Source-quoted attributes as `key = value` (or `City class: …`) | HARD-RULES 12. The UK page already treats OSM tags as quotations. |
| Provenance links to the source object | OSM URL here; FeatureServer item + retrieval date + licence stamp on HeavyMap. |
| Written refusal of vacancy | `property.html` line 438; `scoring.js` lines 1–5. Keep the discipline, drop the score. |
| Local notes + save-as-standalone-HTML | `PUBLICATION-MODEL.md` §2.1 already cites this as pending local-first share. |
| Street View / ground-truth outbound | Cheap, honest. |
| Card / Map twins of the same claims | PCDP: share and export carry the same set as the screen. |

What not to take: the 0–100 opportunity number as the first thing on the page (`property.html` lines 419–438). HeavyMap’s lock is dossier-as-argument (`docs/architecture/context-band-ladder.md` lines 21–25; `04-uk-capability-glean.md` §C). If a reading appears later it is one optional chip with a formula, not the spine of the page.

### 1.5 Search

Nominatim place search, Great Britain only (`app.js` `_geocode()`, lines 864–873). Debounced suggestions, first hit zooms to z13. This is **town / postcode navigation**, not parcel or roll search. No spine key, no address-point shard, no tax class.

Quick Areas are hardcoded `GEO_PRESETS` in `map.js` (lines 45–54) plus buttons in `index.html` (lines 56–66). The *named industrial district* idea ports; the UK boxes do not.

### 1.6 Layer controls

Four families, all checkboxes:

1. **Query filters** — OSM tag bundles. Require Run Query. Not map layers in the GIS sense.
2. **Lifecycle** — abandoned / disused / vacant, with coloured pills (`index.html` lines 95–114). Vacant here is an OSM tag filter. HeavyMap must not reuse that as a product claim.
3. **Planning overlays** — England-only Planning Data types, fetched with the query, with an explicit coverage warning (`index.html` lines 160–162).
4. **External datasets** — FSA, EPR, strategy zones, INSPIRE (zoom 14+). Independent of the OSM query.

There is no single layer registry. Each overlay module paints its own Leaflet group. That is the brittle part (see §1.9).

### 1.7 Styling approach

Documented in `styles.css` lines 1–5: “Matter-of-fact, legible, functional.” In practice a finished visual system:

- IBM Plex Sans + IBM Plex Mono (Google Fonts).
- Cream ground `#ece9e2`, white sidebars, hairline `#d4d0c8` / `#ece9e4`, ink `#1a1a1a`.
- 46 px near-black header, small industrial SVG brand mark (repeated on `property.html` and `property-map.html`).
- Feature colours: workshop amber `#b35c00`, manufacturing navy `#1a3a5c`, industrial almost-black, warehouse grey, maker green, railway-arch indigo (`map.js` `FEATURE_STYLES`, lines 56–67).
- Lifecycle pills (abandoned / disused / vacant) as first-class chrome.
- Score numbers in IBM Plex Mono, large, colour-banded.

This is a complete aesthetic. **Do not reuse it.** Function (three columns, uppercase section heads, source-quoted mono rows, coverage warning) can be rebuilt in another language.

### 1.8 Performance techniques

| Technique | Where | Verdict for HeavyMap |
|---|---|---|
| Zoom gate before live query | `map.js` `RUN_MIN_ZOOM = 10`, `canRun()` line 533 | Keep the *gate* idea (minzoom per layer). Drop the live query. |
| Session cache 15 min / 60 entries | `overpass.js` lines 10–12 | Useful for any bbox API later. Not the Hamilton path. |
| Result caps 1,000 / 300 | `overpass.js` line 8; `app.js` line 242 | Honesty about truncation. Tiles replace the need. |
| MarkerCluster + `chunkedLoading` | `map.js` lines 473–478 | Point layers (permits, businesses) still need clustering or tiles. |
| VOA postcode-area shards | `voa.js` `_loadArea()` lines 38–60; `system/project-notes.md` implied by `split_voa.py` | **Best measured UK win.** `fast-loading-evidence.md` §1: 25 MB split into 106 files, ~243 KB average. Use for **address / roll search shards**, not as the map. |
| In-flight promise de-dupe | `voa.js` `_loading` | Port to any lazy JSON. |
| Compact JSON separators | `scripts/process_voa.py` (cited in `fast-loading-evidence.md`) | Fine for shards. |
| Leaflet.Draw rectangle analysis | `map.js` lines 261–288 | Park until the spine is stable (`04-uk-capability-glean.md` §B). |
| html2canvas postcards | `app.js` lines 945+ | Pattern to keep; visual design to redo. |
| Cloudflare Worker for INSPIRE | `inspire-proxy/` | Breaks “no server”. Drop. |
| Companies House via `server.py` | `server.py` lines 24–44 | Live API + Basic auth. Drop. Key leak is **NA-8**. |

No browser timing exists anywhere. `fast-loading-evidence.md` §2 already records that gap.

### 1.9 What worked vs what was brittle

**Worked**

- Interaction density on a static host: modes, filters, shareable hash, deep-link dossier, notes, cards.
- Hash state `v,f,m` (`app.js` `_saveURLState` / `_loadURLState`, lines 909–936) is the smallest shareable map state.
- Coverage warning for England-only planning (`index.html` lines 160–162) is the right honesty move for a cross-border product.
- Score disclaimer and “OSM tags only” keep the tool from claiming vacancy — even while the score itself is the wrong primary UX.
- Modular per-source JS files (`voa.js`, `epr.js`, …) are easy to reason about **if** each one is a register overlay, not the spine.

**Brittle**

- Live Overpass as inventory: public instance, 30 s timeout, 1,000 cap, patchy OSM outside a few cities (`system/project-notes.md` lines 33–39). Rejected by ADR 0001.
- Feature panel and `property.html` / `property-map.html` **duplicate** render logic (FEATURE_STYLES, `esc`, `fmtArea`, score block). Three copies of the same dossier.
- No layer registry: overlay toggles, fetch, and paint live in separate modules. A toggle can exist with no data (and after **NA-286**, most overlay JSON is gone).
- `server.py` + committed API key (since redacted) is a liability pattern. Do not recreate a hidden proxy for a static Pages site.
- Esri satellite “may 403” (`system/project-notes.md` line 38).
- Vacant / abandoned pills on OSM tags will be misread as HeavyMap claims if copied.
- `property.html` still live-fetches Overpass for a single id. A HeavyMap dossier must read a prebuilt fixture or tile attribute, not a third-party API at click time.

---

## 2. Niagara map prototype (`first-attempts/niagara-atlas/`)

### 2.1 Stack

Also a static Leaflet SPA, but the opposite data path: **pre-generated GeoJSON in `data/`, browser never talks to a public API** (`OPERATIONS.md` lines 6–8; `INTEGRATION.md` lines 59–80).

| Piece | What it is |
|---|---|
| Page | `index.html` — one application, both countries |
| CSS | `styles.css` — dark CARTO ground, full ui-monospace, amber = government / cyan = OSM |
| State | `app.js` — `LAYERS` table, region chips, PURPOSE/TYPE/SOURCE regroup, lazy fetch, detail panel |
| Map | `map.js` — `window.AtlasMap`: Leaflet 1.9.4, CARTO `dark_all`, style/point factories |
| Ingest | `scripts/fetch_*.py`, `normalize/`, `us/scripts/` — stdlib Python, cache gitignored |
| Decision record | `TECHNOLOGY-DECISIONS.md` D-1…D-13 |
| Dossier spec (not built) | `DOSSIER-TECHNICAL-REPORT.md` |

Leaflet is integrity-pinned (`index.html` lines 9–11, 67–71). No MarkerCluster, no Draw, no html2canvas, no framework.

### 2.2 Architecture

`map.js` lines 1–7 state the split: geographic rendering vs application state “change for different reasons.” `app.js` is the single source of truth for what exists (`LAYERS`, lines 16–188). Toggles, colours, credits and fetch paths are generated from that table so they cannot drift (`index.html` lines 31–34; `app.js` lines 16–18).

**Data loading.** Lazy on first checkbox (`app.js` `activate()`, lines 343–379). `fetch(spec.file)` → `AtlasMap.buildLayer` → cache in `loaded[id]`. A layer switched off mid-fetch does not reappear (lines 369–371). Failure marks the row `is-failed`, unchecks the box, and does **not** render empty (file header, lines 10–12). Default-on layers (employment land, OSM land, US parcels, NEI departures, OSM places) load at startup.

**Tiling / format.** Committed GeoJSON FeatureCollections with an `atlas` metadata block (source, licence, freshness, retrieved_at, feature_count). Measured sizes on this checkout (2026-10-17):

| File | Size |
|---|---|
| `data/us-industrial-parcels.geojson` | 15 MB |
| `data/us-facilities.geojson` | 6.0 MB |
| `data/osm-rail.geojson` | 5.0 MB |
| `data/hamilton-rail.geojson` | 3.0 MB |
| `data/hamilton-truck-routes.geojson` | 2.1 MB |
| `data/osm-places.geojson` | 1.7 MB |
| `data/hamilton-zoning-industrial.geojson` | 1.5 MB |
| `data/osm-land.geojson` | 1.4 MB |
| others | < 0.5 MB each |

`app.js` line 6 says “~16 MB across eight files”; `OPERATIONS.md` line 24 says “~37 MB of committed output.” Both are the same idea: filter and emit a thin ship. The 15 MB US parcels file is the largest thing either prototype asked a browser to parse. Hamilton identity layers are an order of magnitude larger as raw GeoJSON (`fast-loading-evidence.md` §3: addresses 322 MB, buildings 138 MB, city parcels 71 MB, zoning 65 MB). GeoJSON-at-toggle does not survive Hamilton.

**Map library.** Leaflet. CARTO dark basemap (`map.js` lines 30–39). Centre `[43.15, -79.55]`, zoom 10, minZoom 8, maxBounds around the peninsula (lines 11–28). Scale bar metric. No satellite switch.

**Ingest-side performance (not front-end, but it shaped the map).** D-4 streaming fetch after a 4.7 GB RSS kill (`TECHNOLOGY-DECISIONS.md` lines 71–87). D-5 disposition taxonomy `ship | simplify | derive | tile | link` (lines 91–167) — this is now MCS `disposition_d5`. D-6 mapshaper + `keep-shapes` after `-simplify 10%` deleted 27 of 60 polygons (lines 199–200). Filter-at-ingest: full Hamilton zoning “71 MB… more than a browser should be asked to parse” → industrial/employment only, 1.5 MB (`scripts/fetch_hamilton.py` lines 62–70).

### 2.3 UI structure

Three-column CSS grid (`styles.css` `.shell`, lines 46–55): 268 px left, map, 330 px right; light 28 px topbar spanning all columns (`index.html` lines 18–23; `styles.css` lines 327–355).

**Left panel.** Brand, PURPOSE / TYPE / SOURCE tabs, “Filter layers” search, ONT / WNY / Both sides chips, grouped layer rows with colour swatch + freshness badge, “What this is” note, region-specific coverage note, licence footer.

**Map.** Loading pill at top centre.

**Right panel.** Detail or empty prompt (“Select anything on the map to see what it is and where the information came from.”).

**Mobile** (`styles.css` lines 423–432): stacks to four rows, map 62 vh. No FABs. Usable, not elegant.

One application for both countries (`INTEGRATION.md` lines 39–41). Region is a **filter**, not a second app (`app.js` lines 223–228, 432–433).

### 2.4 Dossier / detail-panel patterns

The shipped UI is a **selection panel**, not the eight-band dossier.

`app.js` `showDetail()` (lines 284–339) on click:

1. Title = `properties.name` or “Unnamed feature”.
2. Kind line = layer · dataset.
3. Classification tags from `properties.categories`.
4. **Source block always:** publisher name, dataset, source-updated date, retrieved_at, freshness badge, licence, “View at source” link (lines 300–329). Comment: “the difference between an atlas and a picture.”
5. **Source attributes, verbatim**, first 40 keys (`kvTable`, lines 268–282, 331–338). OSM tags or original attributes. Interpretation stays separate from the quotation.

Map click on empty canvas resets to the empty prompt (`app.js` lines 597–603).

What this already does well, and PCDP still wants:

- Provenance is not optional.
- Raw source attributes are quoted, not rewritten.
- A failed layer says “unavailable”, it does not paint as empty land (`app.js` lines 10–12, 373–377; `styles.css` lines 250–251).
- Coverage notes are per region and name the publishing gap (`app.js` `REGIONS[].note`, lines 195–218; `index.html` lines 42–47).

What it does **not** do (the dossier still to build):

- No spine key, no grain, no jurisdiction sentence.
- No Context Band Ladder order (`identity` → `land_use` → `constraints` → …).
- No refusals. Missing bands are omitted, which `DOSSIER-TECHNICAL-REPORT.md` lines 51–54 already forbids: “absence of a band would be indistinguishable from absence of the condition.”
- No area-share overlaps. Niagara paints one feature’s properties; it does not explain every intersecting zone.
- No share/export packet.
- Owner names were stripped at US ingest (`app.js` lines 216–217: “Owner names are removed at ingestion”). That contradicts D-13 (`TECHNOLOGY-DECISIONS.md` lines 426–466: retain at ingest, mask at presentation). HeavyMap follows D-13 + HARD-RULES 2: pull all fields locally, screen owner/personal info at the publish boundary. Do not copy the “strip at ingest” comment into product code.

The **specified** dossier is `DOSSIER-TECHNICAL-REPORT.md` (2026-08-27). Eight bands: SUBJECT, ASSERTION (optional), REGULATORY, PHYSICAL, CONSTRAINT, ACCESS, NEIGHBOURS, HISTORY, EVIDENCE. Reader contract: attributed, dated, bounded, refusable (lines 33–45). Worked example is a verification story (Hopkins Steel, Welland) where the dossier caught a false departure claim. Context Band Ladder later **replaced** those eight names with six tokens (`docs/architecture/context-band-ladder.md` lines 24–25: “Treating the older eight-band dossier sketch… as this ladder” is a non-goal). Keep the contract (attributed / dated / bounded / refusable, bands render even when empty). Do not keep the eight names.

### 2.5 Search

`app.js` lines 437–446: an `<input type="search">` that filters **layer names** in the left panel (`matchesFilter`, lines 386–390). There is no place geocoder, no address search, no roll / SBL / parcel search. Selecting a feature is click-on-map only.

This is the largest functional hole relative to the Hamilton brief. HeavyMap search must hit civic address, roll number, and spine key (`NA-32` sub-issue list).

### 2.6 Layer controls

This is Niagara’s strongest front-end idea.

- **One `LAYERS` table** drives the list, the paint, and the credits.
- Each row: checkbox, swatch (`--swatch` CSS variable), label, source, freshness badge, optional “both sides”.
- Rows are **built once and reused** (`app.js` lines 392–394, 467–469, 550–552). Re-render moves nodes; it does not destroy checkbox state or feature counts.
- **Three regroupings** of the same twelve layers (`VIEWS`, lines 229–236): PURPOSE (theme: what is allowed / here now / available / how it connects), TYPE (land, places, infrastructure), SOURCE (publisher). Default is PURPOSE because that is the newcomer question (`app.js` lines 223–228).
- **Region chips** ONT / WNY / Both sides filter rows and fitBounds (`applyRegion`, lines 398–411). OSM layers are `region: 'BOTH'` and stay one dataset (`app.js` lines 190–194).
- Groups collapse; live count is `on / total` (lines 531–545).
- Failed fetch is a row state, not a silent empty map.

For Hamilton, PURPOSE still maps cleanly onto first-view vs dossier overlays: nature frame and city outline on at start; zoning, parcels, registers behind a toggle and a minzoom.

### 2.7 Styling approach

`styles.css` lines 1–14 declare the language: “deliberately not a consumer map… dark ground, restrained hues, monospace throughout… drawings and infrastructure rather than places to visit.” Palette:

- `--bg #12141a`, `--panel #171a21`, `--ink #e6e9ef`
- `--gov #e8a33d` municipal, `--osm #4fc3d9` OSM, `--rail #f05e5e` (brightest thing on the map), `--accent #9ae66e`
- Full `ui-monospace` stack, 13 px, letter-spacing on uppercase chrome
- Light `#e8e6e1` topbar as “the edge of the instrument” (`styles.css` lines 323–326)

Colour is doing semantic work (gov vs OSM). That *function* (authority family readable at a glance) should survive. The dark-instrument look should not. The owner asked for a different aesthetic; copying CARTO dark + monospace would be repeating Niagara, not gleaning it.

### 2.8 Performance techniques

| Technique | Where | Verdict for HeavyMap |
|---|---|---|
| Lazy fetch on first toggle | `app.js` `activate()` 343–379 | Keep. Startup = nature frame + city outline only (`fast-loading-evidence.md` §4.4). |
| Do not render a failed layer as empty | `app.js` 10–12, 373–377 | Keep. This is a claim-refusal rule in UI form. |
| Filter at ingest | `fetch_hamilton.py` 62–70 | Keep for any `ship` GeoJSON. Hamilton parcels/buildings still need `tile`. |
| D-5 `ship/simplify/derive/tile/link` | `TECHNOLOGY-DECISIONS.md` 110–120 | Already product language. Hamilton identity layers are `tile` (PMTiles). |
| D-6 mapshaper + feature-count assert | `TECHNOLOGY-DECISIONS.md` 199–200 | Required for the nature-frame simplify. |
| Row reuse (no innerHTML wipe) | `app.js` 467–469 | Keep. |
| Integrity-pinned Leaflet | `index.html` 67–71 | Keep the habit for MapLibre / pmtiles JS. |
| Committed GeoJSON in git | `data/*.geojson` | **Drop.** HARD-RULES 1: pulled data never in the repo. Niagara’s 37 MB `data/` is prior art, not a path. |
| Whole-collection `L.geoJSON` | `map.js` `buildLayer()` 77–92 | Fine at 1–15 MB. Will not survive 90k–270k Hamilton features. |
| No clustering | — | Point layers will need tiles or clusters. |

### 2.9 What worked vs what was brittle

**Worked**

- One map, two countries, region as filter. The product argument is the border.
- Layer registry as the only list. Toggles cannot lie about what is drawn.
- Provenance on every selection. Freshness is a badge, not implied (`styles.css` lines 235–248).
- Coverage notes that name the publishing gap instead of smoothing it (`README.md` lines 74–79; `app.js` 203–207). Hamilton-without-NEI vs Niagara-with-NEI is shown, not averaged.
- Semantic colour (gov vs OSM) and rail as the bright connector.
- Left-panel regrouping without refetch.
- D-5 / D-6 / D-13 as written decisions the new front end can implement rather than rediscover.
- The specified (unbuilt) dossier’s refusal rule and the Hopkins verification story.

**Brittle**

- GeoJSON-in-repo as the ship format. Hits GitHub’s 100 MB file limit and the browser parse budget long before Hamilton parcels exist. `fast-loading-evidence.md` already names PMTiles as the untried escape hatch.
- Detail panel is a property dump. It will not carry area shares, quoted classes, or refusals without a rewrite. Do not “grow” `showDetail()` into PCDP — replace it.
- No parcel / address / roll search.
- No URL state. A selection cannot be shared.
- Owner-strip-at-ingest in the US parcels comment vs D-13 retain-and-mask. Follow HARD-RULES 2.
- `REGIONS[].note` for Ontario still says “Parcel data is not public in Ontario: MPAC charges for it” (`app.js` lines 205–206). That sentence is stale after HARD-RULES 4 (2026-10-17). Do not copy it.
- Mobile stack is a first cut (62 vh map). Not a design system.
- README status still says “the Leaflet application… remain to be built” (`README.md` lines 61–62) while `index.html` + `app.js` exist. Docs drifted from the shipped UI.

---

## 3. Side-by-side comparison

| Topic | UK atlas | Niagara map | HeavyMap (locked or aimed) |
|---|---|---|---|
| Host | Static, GitHub Pages / any static host | Static, designed for Pages | GitHub Pages, public, no password (`focus/hamilton/DECISIONS.md`) |
| Library | Leaflet 1.9.4 + Cluster + Draw | Leaflet 1.9.4 only | **MapLibre GL + PMTiles** (this brief; D-5 `tile`) |
| Intelligence load | Live Overpass + optional APIs | Prebuilt GeoJSON, lazy fetch | Prebuilt **tiles + shards**. No Overpass corpus (ADR 0001) |
| Startup | Shell + OSM tiles; query is user-fired | Default-on GeoJSON (~several MB) | Nature frame + city outline, small |
| Shell | Header + left filters + map + right panels | Light topbar + left layers + map + right detail | Unspecified chrome; three-column *function* is proven |
| Search | Nominatim place / postcode | Filter layer names | Address, roll, spine key, jurisdiction (**NA-32**) |
| Layer control | Filter checkboxes + overlay modules | `LAYERS` registry, PURPOSE/TYPE/SOURCE, region chips | Registry + first-view stack + minzoom |
| Selection | Marker → feature panel | Click feature → provenance dump | PCDP `selection` (key, grain, jurisdiction, refusals) |
| Dossier | `property.html` deep link + notes + save HTML | Specified in `DOSSIER-TECHNICAL-REPORT.md`, **not built** | PCDP `dossier`, six ladder bands, area shares, quoted classes |
| Share | URL hash `v,f,m`; postcard PNG; standalone HTML | None | Hash + share/export with same claims and refusals |
| Score | 0–100 opportunity + confidence | None in UI; docs reject opaque scores | No opaque score. Optional named readings only |
| Honesty | England-only planning warning; vacancy disclaimer | Per-region coverage note; failed layer ≠ empty | Claim & Refusal; quoted source classes; no invented vacancy |
| Identity shown | OSM tags, including whatever OSM has | Feature name + raw attributes; US owners stripped at ingest | Roll, tax class, civic address. Never owner / personal info |
| Aesthetic | Cream paper, IBM Plex, dark header, brand mark | CARTO dark, full mono, amber/cyan, light topbar | **Different from both** (owner) |
| Mobile | FAB sidebars | Stacked grid | Unspecified |
| Secrets / APIs | CH proxy, INSPIRE worker | Census key in env only; browser is static | No proxy, no committed keys, no pulled data in git |
| Largest shipped browser file | Overlay JSON (removed); VOA shards were ~852 KB max | 15 MB GeoJSON | Hard cap 100 MB/file; target tiles 10–40 MB (`fast-loading-evidence.md`) |

---

## 4. Recommendations

### 4.1 Carry forward (function)

**From the UK dossier — the head start**

1. **Deep-link unit page** as the PCDP `dossier` surface. Hash or path is the spine key. `?from=` (or equivalent) returns to map state. See `property.html` lines 464–487.
2. **Source-quoted fields**, not rewritten labels. UK `key = value` tag rows become Hamilton `City class: Vacant Lands` and `Tax class confirmed: industrial`.
3. **Local-first notes and save-as-standalone-HTML** (`property.html` 203–287). Already promised in Niagara `PUBLICATION-MODEL.md` §2.1.
4. **Shareable map hash** (`v` / filters / mode) (`app.js` 909–936). Add selected spine key.
5. **Coverage warning** when the viewport is outside a register (UK planning warning → “no NEI / no AV / nature layer not joined”).
6. **Outbound ground truth** (Street View, source record). Cheap.
7. **Postcard / share card as a later `share` surface**, same claims as the dossier, new visual language.
8. **Named modes** as filter bundles (workshop-explorer analogue → e.g. expand / redevelop / logistics) — park until G3/G4, but keep the idea. Do not bind modes to OSM tags.
9. **Key-prefix shards** for address / roll lookup (`voa.js` `_loadArea`). This is the UK pattern Hamilton search should steal.

**From the Niagara map — the strengths**

1. **Layer registry as the only list.** One table paints toggles, colours, freshness, credits (`app.js` `LAYERS`).
2. **Lazy activate + failed-layer honesty.** Nothing beyond the first view at startup. A broken layer says so.
3. **Provenance on every selection** (source, retrieved_at, licence, raw attributes). This is the minimum `selection` panel.
4. **PURPOSE / TYPE / SOURCE regroup** without refetch. PURPOSE as default.
5. **Region as filter, one map.** When geography grows past Hamilton, do not fork the app.
6. **Per-region coverage notes** that name the publishing gap. Rewrite the stale MPAC sentence; keep the device.
7. **Semantic colour for authority family** (government vs OSM vs derived). Recolour; keep the job.
8. **D-5 dispositions and D-6 simplify-with-count-assert** for the nature frame.
9. **D-13 / HARD-RULES 2 masking at presentation**, not strip-at-ingest. Niagara’s *principle* (D-13), not its US-parcels *practice*.
10. **Specified dossier contract** from `DOSSIER-TECHNICAL-REPORT.md` §1.1 (attributed, dated, bounded, refusable) mapped onto the six PCDP bands, including empty bands shown as refusals.
11. **Filter-at-ingest** when anything still ships as GeoJSON (industrial zoning 71 MB → 1.5 MB).

**From both, aligned with Hamilton decisions**

- First view = Greenbelt + conservation / natural layers + city outline (`INSIGHTS.md`; `DECISIONS.md` plan overlays with **area share** on every parcel).
- Map colour by dominant zone; dossier lists every intersecting zone and its share (`DECISIONS.md` provisional multi-zone row).
- Integrity-pin vendor JS. Configurable OSM tile URL (ADR 0001). No OSM feature corpus.

### 4.2 Drop

- Leaflet as the product map library (replaced by MapLibre + PMTiles).
- Live Overpass / Nominatim / Planning Data / Companies House in the browser as inventory.
- `server.py` and any hidden API proxy; `inspire-proxy` Worker.
- `scoring.js` opportunity 0–100 as primary UX (keep “does not confirm vacancy” as a writing rule).
- OSM vacant / abandoned pills as product language.
- Committed GeoJSON FeatureCollections under git (`niagara-atlas/data/`).
- Strip-owner-at-ingest.
- Growing Niagara `showDetail()` until it is a dossier. Replace it.
- UK `property.html` live Overpass fetch. Dossier reads prebuilt claims.
- Duplicate dossier implementations (feature panel vs property vs property-map). One renderer, two surfaces (`selection` vs `dossier`).
- England / UK geography, Quick Areas boxes, CH/VOA/EPR/FSA/INSPIRE content.
- Niagara’s stale “MPAC charges for it” coverage copy.

### 4.3 Aesthetic elements **not** to reuse

The owner asked for a different look. These are the finished visual signatures. Using them would read as a reskin of a prototype, not a new product.

**Do not reuse from the UK atlas**

- IBM Plex Sans / IBM Plex Mono pairing and Google Fonts pull.
- Cream paper ground `#ece9e2` + white sidebars + `#d4d0c8` hairlines.
- 46 px near-black header and the industrial SVG brand mark (the “shard” icon on `index.html` 21–25, repeated on both property pages).
- Workshop-amber / manufacturing-navy / maker-green feature palette as a copied system.
- Lifecycle pill chrome (ABANDONED / DISUSED / VACANT).
- Large colour-banded score numerals as the visual hero of the dossier.
- Leaflet.Draw red dashed rectangle and the inset “Navigate UK” control as chrome (the *function* of a locator can return later in another form).

**Do not reuse from the Niagara map**

- CARTO `dark_all` as the default basemap (the *reason* — keep contrast for land/rail — can be met another way).
- Full-UI monospace, 0.13–0.16 em uppercase tracking, “instrument panel” voice.
- Amber-gov / cyan-OSM / red-rail / green-accent hex set (`styles.css` 16–31).
- Light `#e8e6e1` 28 px topbar with `@NiagaraAssembly` as identity chrome.
- Dark-panel `#12141a` / `#171a21` stack.

**What may be rebuilt without copying the look**

- Three-column working layout (filters | map | dossier).
- Uppercase section labels and source-quoted mono *rows* (a typesetting job, not a font lock).
- Colour meaning “this family of authority”, assigned in a new palette.
- Freshness / refusal / coverage as first-class labels.
- A first view that is quiet enough for Greenbelt and water to read as a frame.

---

## 5. Reusable code candidates

Port **patterns and small helpers**, not files as-is. Leaflet calls, UK geography, and visual CSS do not move. Paths are in this repo.

| Candidate | Path | What to take | What to rewrite |
|---|---|---|---|
| Deep-link dossier shell | `first-attempts/uk-atlas/property.html` | Hash route, `?from=` return, notes, save-as-HTML, `esc()`, section order (identity → quotations → outbound links → footer disclaimer) | OSM fetch, score block, IBM Plex / cream CSS, brand mark |
| Map-centric twin | `first-attempts/uk-atlas/property-map.html` | Same facts, different surface (PCDP `dossier` vs a map-heavy reading) | All styling; score hero |
| Hash state | `first-attempts/uk-atlas/app.js` 909–936 | `v=lat,lng,z` + filter + mode `history.replaceState` | Add spine key; drop Overpass filters |
| Feature-panel composition | `first-attempts/uk-atlas/app.js` 291–406 | Badge + quoted tags + outbound links + async register sections | Score; CH/VOA; `innerHTML` (use DOM like Niagara) |
| Shard loader | `first-attempts/uk-atlas/voa.js` 9–61 | `_cache` / `_loading` / `_failed`, key-prefix file, normalise | VOA schema; point at address/roll shards |
| HTML escape + area format | `property.html` 191–201; `app.js` `_esc` / `_fmtArea` | Tiny, tested-in-use helpers | None of the CSS |
| Coverage warning node | `first-attempts/uk-atlas/index.html` 160–162 | Copy pattern: hidden until viewport leaves coverage | England-only text |
| Layer registry + lazy activate | `first-attempts/niagara-atlas/app.js` 19–188, 343–379, 467–575 | `LAYERS` table, `activate()`, row reuse, PURPOSE/TYPE/SOURCE, region chips | File paths; GeoJSON `L.geoJSON`; stale MPAC note |
| Selection / provenance panel | `first-attempts/niagara-atlas/app.js` 266–339 | `kvTable`, always-on source block, raw attributes | Band ladder, refusals, area shares; stop at ~40 keys by policy not by accident |
| Map module split | `first-attempts/niagara-atlas/map.js` | `init` / `buildLayer` / `add` / `remove` / `focus`; click reports, does not interpret | Leaflet → MapLibre; CARTO dark |
| Failed-layer CSS states | `first-attempts/niagara-atlas/styles.css` 250–251 | `is-loading` / `is-failed` copy | Colours |
| Filter-at-ingest | `first-attempts/niagara-atlas/scripts/fetch_hamilton.py` 62–70 | Keep-fields + filter_pattern | Output PMTiles, not GeoJSON in git |
| D-5 / D-6 / D-13 text | `first-attempts/niagara-atlas/TECHNOLOGY-DECISIONS.md` 91–200, 426–466 | Disposition, simplify assert, mask-at-presentation | Already being followed in HARD-RULES; do not re-litigate |
| Specified dossier contract | `first-attempts/niagara-atlas/DOSSIER-TECHNICAL-REPORT.md` 15–77 | Attributed / dated / bounded / refusable; empty bands still render | Eight band names → six PCDP tokens |
| Nature-frame + PMTiles plan | `heavymap-planning/focus/hamilton/fast-loading-evidence.md` §4 | First experiment (tippecanoe sizes, Pages range requests, TTFB) | Not code; it is the build brief |

**Do not port:** `scoring.js` as a product module; `overpass.js` as inventory; `companies.js` + `server.py`; `inspire-proxy/`; either `styles.css`; Niagara `data/*.geojson`.

---

## 6. Open questions for the owner

These are aesthetic and UX calls. They are not decided here. Existing locks (HARD-RULES, PCDP, ADR 0001, Hamilton `DECISIONS.md` firm rows) still apply.

1. **Visual language.** If both prototype looks are out, what is the third? (Paper + ink, a light working map, a muted satellite hybrid, something else.) Any reference sites or print atlases?
2. **Basemap.** ADR 0001 locks a configurable OSM tile URL, not a style. Default: a light positional sheet, a muted dark sheet that is *not* CARTO `dark_all`, or satellite-under-nature-frame for the first view only?
3. **Dossier chrome.** UK is a **separate page** (`property.html`). Niagara specified a **sidebar**. PCDP allows both. First Hamilton ship: docked panel, full page, or panel that can pop to a page?
4. **First-view layer stack.** Greenbelt + conservation on (PI-0011). Which other layers are on before the first click — city outline only, employment lands, water, NEP Development Control, HCA regulated area? How much is allowed to load before first paint?
5. **Dominant-zone colouring.** `DECISIONS.md` provisional: colour by dominant zone, dossier explains the rest. Confirm, and say whether the map tooltip may show the runner-up share or only the dossier.
6. **Search box contents.** Typeahead over civic address, roll number, spine key — all three from the first ship, or address first?
7. **Roll number on the public dossier.** HARD-RULES 4 allows it. `DECISIONS.md` had a provisional lean toward tax class only, then a firm “roll numbers and tax class public.” Confirm the first-view copy: show ARN, show tax class, or both.
8. **Quoted-class wording.** HARD-RULES 12 examples are display patterns, not final copy. Lock the two strings (`City class: …`, `Tax class confirmed: …`) or treat them as placeholders?
9. **Share card.** Keep UK’s three formats (detailed / square / 16:9) as a later `share` surface, or one format? Local notes in v0 or after G6?
10. **Layer regrouping.** Keep Niagara’s PURPOSE / TYPE / SOURCE tabs for Hamilton, or one PURPOSE list until the layer count grows?
11. **Typeface.** If IBM Plex and ui-monospace are both out, is there a house face, or is that part of question 1?
12. **Mobile.** UK FABs vs Niagara stack vs “desktop first until G6”? **NA-32** defers chrome.

Related open product questions that this glean must not settle: `heavymap-planning/OPEN-DECISIONS.md` (G6, D-13 private ingest, MCS location). `NA-269` is the G6 definition issue. Nothing here is a publish path.

---

## Related documents

| Document | Role |
|---|---|
| `docs/architecture/PCDP.md` | Surfaces and min→max presentation |
| `docs/architecture/context-band-ladder.md` | Six bands; eight-band Niagara sketch is prior art |
| `docs/architecture/claim-refusal-contract.md` | Quoted vacancy; no invented empty |
| `docs/architecture/adr/0001-osm-as-substrate.md` | Tile floor; no Overpass corpus |
| `docs/grok-bot-docs/04-uk-capability-glean.md` | UK *capability* gaps (readings, gap-finder), not chrome |
| `heavymap-planning/focus/hamilton/fast-loading-evidence.md` | Pages budget, PMTiles experiment |
| `heavymap-planning/focus/hamilton/DECISIONS.md` | Hamilton locks this glean assumes |
| `first-attempts/niagara-atlas/DOSSIER-TECHNICAL-REPORT.md` | Unbuilt dossier contract |
| `first-attempts/niagara-atlas/TECHNOLOGY-DECISIONS.md` | D-5, D-6, D-13 |
| `first-attempts/uk-atlas/system/project-notes.md` | UK stack and limits |

---

## Honesty

Both prototypes are small static SPAs. The UK one is interaction-dense on thin, live OSM. The Niagara one is honesty-dense on thin, prebuilt GeoJSON. HeavyMap’s constraint is Hamilton-scale authoritative data on a 300 MB Pages budget, plus a dossier that can explain overlaps without claiming vacancy. The highest-leverage carry-overs are the **UK deep-link dossier (minus the score)** and the **Niagara layer registry + provenance + coverage notes (minus the look and the GeoJSON ship)**. The look is a blank sheet on purpose.
