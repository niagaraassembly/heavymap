# Fast layer and data loading: evidence and a Hamilton approach for GitHub Pages
Read-only synthesis, 2026-10-17 ET. **[inference]** marks anything not measured or tried in our own work.

## 0. Flag first: a public site changes the data rules
Draft PR #61 lifts the MPAC/NPCA licence gate only "while heavymap.com is password-protected for limited viewing." A public GitHub Pages site with no password is outside that condition.

As written, the NPCA ARN parcels (90,306, with roll numbers) and anything else that is MPAC-derived should **not** ship to Pages. They can still be used build-side, for example to derive attributes, if Morgen allows that. PR #61's wording needs updating to match the Pages decision. G6 and the owner rule are unaffected.

## 1. Evidence by technique

| Technique | Where tried | What was measured | Outcome |
|---|---|---|---|
| **Disposition triage** (`ship` / `simplify` / `derive` / `tile` / `link`) | niagara-atlas `TECHNOLOGY-DECISIONS.md` D-5 (2026-08-23) | 4.91 GB across 200 layers. Two contour layers are 3.11 GB (63%). 5 files exceed 100 MB (3.51 GB). 163 of 200 layers fit in 162 MB. | Adopted. The weight sits in about 14 files. The rule: decide per layer, don't ship everything. |
| **Derive instead of ship** | D-5: contours collapsed to `elev_min/max`, `relief`, `slope_pct` per unit | 3.11 GB down to about 2.5 MB (about 1,200:1) across about 79k parcels | Adopted, but only as a design. Not shipped, because the atlas was never deployed with it. |
| **Filter at ingestion** | `first-attempts/niagara-atlas/scripts/fetch_hamilton.py` (zoning) | All 11,906 Hamilton zoning polygons with every attribute is a 71 MB file. Filtering to industrial/employment zones gives `data/hamilton-zoning-industrial.geojson` at 1.5 MB. | Shipped in niagara-atlas. The comment says 71 MB is "more than a browser should be asked to parse". |
| **Topology-aware simplification (mapshaper)** | D-6 plus `ENVIRONMENT.md`. Tested on 60 adjacent Welland zoning polygons. | Vertices 1,541 to about 557. mapshaper: 0 m² overlap. shapely per-geometry: 5.7 m² over 2 of 8 pairs. | Chosen for tiling layers. **Failure found:** `-simplify 10%` deleted 27 of 60 polygons. `keep-shapes` fixed it. Always assert feature count in equals feature count out. |
| **Simplify dense natural layers for display, keep precise build-side** | D-5 | Provincial NHS: 137 KB per feature (51 polygons). NES layer 63: 78 MB for 7,774 features. | Policy only. Expected the shipped atlas to be "low hundreds of MB". No post-simplification sizes recorded. |
| **PMTiles / vector tiles** | D-5 "What would change this", D-10, `ENVIRONMENT.md` (gdal2tiles vs `rio-mbtiles`/PMTiles), ADR 0001 (`tile` disposition kept), NA-30 ("storage and tile formats") | Nothing measured | **Never tried.** Named as the answer for any large layer displayed at full detail. Works on static hosting via HTTP range requests. The contour case would still exceed the 100 MB file limit. |
| **Raster tile pyramid with a zoom cap** | D-10 hillshade (NRCan MRDEM VRT, gdal2tiles) | Estimated z10–14 at about 2,700 PNGs, about 55 MB. z15 alone would add about 165 MB. | Estimate only, not built. Lesson: cap zooms and fall through to vector at high zoom. |
| **Lazy per-layer fetch on first toggle** | niagara-atlas `app.js` `activate()` (fetch on toggle, cached in `loaded[]`), `INTEGRATION.md` | Committed output about 37 MB (`OPERATIONS.md`). Largest shipped files: us-industrial-parcels 15.7 MB, us-facilities 6.3 MB, osm-rail 5.2 MB. | Shipped. Nothing loads until toggled. No browser timing recorded. |
| **Split a monolith into on-demand shards** | babbworks/atlas commit `f45fceb` (2026-06-10), "Split VOA data into per-area files" | `voa_industrial.json` (25 MB) split into 106 postcode-area files, about 243 KB average (largest 852 KB, smallest 84 B). Fetched only when a lookup needs that area. | Shipped. This is the clearest measured win in the UK atlas. It is a key-prefix shard, which suits address search. |
| **Lazy load of single datasets** | babbworks/atlas `voa_geo.js`, `fsa.js`, `epr.js` (fetch once, de-duplicated in-flight promise) | Whole `data/` dir is 34 MB | Shipped |
| **Marker clustering with chunked loading** | babbworks/atlas `map.js`, `fsa.js`, `epr.js`: `L.markerClusterGroup({maxClusterRadius 45–50, chunkedLoading:true})` | Not measured | Shipped for all point layers |
| **Zoom gate** | babbworks/atlas `map.js` `RUN_MIN_ZOOM = 10` (no query below z10); niagara-atlas `minZoom: 8` | Not measured | Shipped. Live queries (Overpass) only run at z10 and above. |
| **Live API by bounding box plus cache** | babbworks/atlas `overpass.js` (bbox query keyed by filters and bbox); INSPIRE through a Cloudflare Worker CORS proxy (`inspire-proxy/worker.js`) | Not measured | Shipped in the UK atlas. **Rejected for HeavyMap:** ADR 0001 says no Overpass extract or prefetch, and niagara-atlas `INTEGRATION.md` says "nothing in the browser talks to a public API". A Worker also breaks "no server". |
| **Streaming fetch (build side)** | D-4 amended | In-memory paging hit 4.7 GB RSS and was killed on Hamilton contours. Streaming to disk: 152 MB RSS. | Failed, then fixed. Standing rule: no stage holds a whole layer in memory. |
| **Compact JSON** | babbworks `process_voa.py`, `split_voa.py` (`separators=(',',':')`) | Not measured | Shipped |
| FlatGeobuf, tippecanoe, topojson, gzip/brotli | Only topojson is mentioned (D-6, rejected as "less mature"). Nothing else appears anywhere. | None | **Gap.** Never tried. |
| Basemap tiles | ADR 0001: configurable OSM tile URL, requested for the current view, no stored pyramid | None | Decided |

**Linear:** NA-17 (OSM substrate ADR) and NA-30 (EPIC 8, "Year-0 on free Cloudflare + GitHub, storage and tile formats") name the topic. No comment or issue records a performance measurement.

## 2. Gaps
- **No browser-side measurement anywhere.** There are no parse or render timings, no frame rates and no time-to-first-paint figures. The only data points are file sizes and one anecdote ("71 MB is more than a browser should parse").
- **PMTiles, tippecanoe and FlatGeobuf were never built or tested,** although D-5 names PMTiles as the escape hatch.
- **No post-simplification size figures** for the dense nature layers.
- **Not verified:** that GitHub Pages serves HTTP range requests reliably for PMTiles, and how its compression and CDN caching behave with a `.pmtiles` file. **[inference: widely reported to work; verify with a test file before committing to it]**
- No prior work shipped anything near Hamilton's scale. The largest shipped layer was 15.7 MB of GeoJSON.

## 3. Hamilton layer sizes on hand (raw GeoJSON, deb caches)
| Layer | Features | Raw GeoJSON |
|---|---:|---:|
| Addresses (`220`) | 274,725 | 322 MB |
| Buildings (`219`) | 214,292 | 138 MB |
| Hamilton_Assessment_Parcel (geometry only, 2026-10-17 pull) | 166,828 | 71 MB |
| NPCA ARN parcels (Hamilton) | 90,306 | 95 MB (**do not ship publicly**, see §0) |
| Zoning By-law (`202`) | 11,860 | 65 MB (71 MB with all attributes) |
| Watercourse (`258`) / Waterbodies (`257`) | n/a | 48 MB / 23 MB |
| Street centreline (`246`) | n/a | 27 MB |
| Greenbelt, NEP, HCA regulated areas, ESA, Escarpment | small counts, very dense vertices | not yet pulled for Hamilton; NHS reference is 137 KB per feature |

Five of these exceed or approach GitHub's 100 MB per-file limit as raw GeoJSON. None is reasonable to parse whole in a browser **[inference, consistent with the 71 MB note]**.

## 4. Recommendation: Hamilton on GitHub Pages (static, no server, no password)
1. **Vector tiles as single PMTiles files for the three dense identity layers**, built with tippecanoe, read with MapLibre GL plus the `pmtiles` protocol.
   - One file per layer, so each stays under 100 MB: `parcels.pmtiles`, `buildings.pmtiles`, `zoning.pmtiles`.
   - Parcels and buildings at z13–16; zoning at z10–16 with `ZONING_CODE` only plus a small id.
   - **[inference]** Expected sizes are roughly 10–40 MB each. Tippecanoe drops coordinates, and attributes are minimal. Measure this, because it's the first experiment to run.
   - This follows D-5's own `tile` answer. The repo has no evidence for or against it in practice.
2. **Addresses are not drawn; they are sharded for search.** Use the babbworks `f45fceb` pattern: per-street-prefix or per-ward JSON shards, each about 100–300 KB, fetched on lookup. Optionally show address points as a z16+ tile layer inside the buildings PMTiles.
3. **Nature frame (Morgen's "encased by nature" first view).**
   - Greenbelt, NEP designation, HCA regulated area, ESA, escarpment and watercourse go through mapshaper `-simplify keep-shapes`, with a feature-count assertion (the D-6 lesson).
   - Ship one small low-zoom GeoJSON or topojson, under about 2–3 MB total, that loads at startup for the opening view.
   - Put a detailed PMTiles at z12 and above for close inspection.
4. **Lazy loading and zoom gates everywhere** (niagara-atlas `activate()`, babbworks `RUN_MIN_ZOOM`):
   - Nothing beyond the nature frame and the city outline loads at start.
   - Each layer has a minzoom.
   - Points such as permits and businesses are clustered, or drawn as a tile layer.
5. **Derive, don't ship, analysis-only data** (D-5): contours, NPCA ARN and similar collapse to per-parcel attributes inside the parcel tiles. Even then, MPAC-derived attributes stay off the public site under §0.
6. **Budget:** under about 300 MB for the whole Hamilton site and every file under 100 MB, against GitHub's 1 GB site limit **[inference from the sizes above]**. Basemap stays a configurable OSM tile URL (ADR 0001); OSM data itself is not stored.
7. **First experiment, before building anything else:**
   - Run tippecanoe on buildings and parcels and record PMTiles size per zoom.
   - Serve the files from a test Pages repo and confirm range requests work.
   - Record time to first paint on a mid laptop and a phone.
   - This closes the main gap: no browser measurement exists.
