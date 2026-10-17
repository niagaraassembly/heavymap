# Hamilton overlay pulls and first PMTiles build (2026-10-17)

Owner issue: NA-24. Built on deb by Grok Bot. This is a local build only. Nothing is published or deployed: HARD-RULES rule 3 holds until G6. Tiles, prep files and pulls live in git-ignored `local-data/`. This file records statistics, commands and budgets only. It contains no data values beyond class names.

## A. Overlay pulls

For each layer: all fields (`outFields=*`), an envelope query on the City extent, then intersection with `City_Boundary/FeatureServer/13`.

- **Script:** `local-data/scripts/pull_hamilton_overlays.sh`. It calls `pull_arcgis_layer.py`, then `clip_to_hamilton.py`.
- **Outputs per pull directory:**
  - `<dataset>.geojson` (EPSG:4326, clipped)
  - `<dataset>-26917.geojson` (EPSG:26917, clipped; the input for the overlay linker)
  - `raw/<dataset>-bbox.geojson` (unclipped)
  - `PULL-SUMMARY.json`, with clip statistics

| Dataset (local-data path) | Endpoint | Server ids in extent | Rows in Hamilton | Cut at boundary | Invalid geometries fixed | Area km² |
|---|---|---|---|---|---|---|
| lio/greenbelt-designation | LIO_Open06/MapServer/15 | 20 | 9 | 5 | 0 | 887.49 |
| lio/nep-designation | LIO_Open06/MapServer/26 | 197 | 115 | 23 | 0 | 125.84 |
| lio/nep-plan-boundary | LIO_Open06/MapServer/25 | 1 | 1 | 1 | 0 | 125.84 |
| hamilton-city/nep-development-control | spatialsolutions PolicyPlanning/MapServer/10 | 1 | 1 | 1 | 0 | 92.22 |
| hca/regulated-areas | HCA_Regulated_Areas/FeatureServer/0 | 137 | 134 | 1 | 4 | 149.47 |
| npca/approximate-regulation-lands | NPCA_APPROXIMATE_REGULATION_LANDS/FeatureServer/0 | 443 | 271 | 40 | 205 | 52.97 |
| hamilton-city/secondary-plan-land-use | spatialsolutions PolicyPlanning/MapServer/6 | 47,206 of 47,212 | 47,206 | 166 | 10 | 83.77 |
| hamilton-city/employment-lands | Employment_Lands/FeatureServer/2 | 22 | 22 | 3 | 1 | 48.50 |
| hamilton-city/urban-boundary | Urban_Boundary/FeatureServer/6 | 1 | 1 | 1 | 1 | 260.90 |
| hamilton-city/rural-boundary | Rural_Boundary/FeatureServer/9 | 1 | 1 | 1 | 1 | 887.90 |
| hamilton-city/parks | Parks_OD/FeatureServer/6 | 633 | 633 | 11 | 0 | 27.86 |

**Reused without a new pull:**
- GRCA regulation limits (`grca/regulation-limits-hamilton-2026-10-17`, 199 rows). Its 26917 copy is `regulation-limits-26917.geojson`.
- Zoning C002 (`hamilton-city/zoning-bylaw-boundary-hamilton-2026-10-17`, 11,860 rows). Its 26917 copy is `zoning-bylaw-boundary-26917.geojson`.

**Notes on the pulls:**
- **NEP Development Control Area:** LIO does not publish it. None of LIO_Open01–10 has the layer, and Ontario GeoHub links only the Source Protection atlas viewer. The NEC's own copy is a feature collection embedded in a web map, not a service. The City republishes it as `PolicyPlanning/MapServer/10` ("NEC NEP Development Control", 13 parts province-wide, fields OBJECTID | PART | AREA_HA), and that is the source used here. One part intersects Hamilton.
- **Secondary Plan Land Use:**
  - 6 of the 47,212 rows have null geometry, so the envelope query does not return them.
  - `ID` is null on every row, so the row key is `OBJECTID`. The class field is `LANDUSE_CLASS` and the plan field is `SEC_PLAN_NAME`.
  - 4 plan names start with `Retired - `: Greensville, Downtown Hamilton, Clappisons Corner and Lower Spencer Creek.
- **HCA Regulated Areas:** `Version` is 0 on all 134 rows, and there is no class field.
- **Employment Lands:** `CATEGORY` values carry a leading space on 14 of 22 rows (for example ` Business Park` and `Business Park` both occur).
- **NPCA regulation lands:** 205 of 271 rows are invalid as served (fixed with make_valid). The 26917 copy is 48.5 MB for 271 rows, because the vertices are very dense.
- **Urban and Rural Boundary:** the two areas sum to 1,148.8 km², the City area.

## B. First PMTiles build

**Tools:**
- tippecanoe 2.53.0, from the Debian trixie package. There is no sudo on deb, so the package was extracted with `apt-get download` and `dpkg -x` into `local-data/tools/` and symlinked into `~/.local/bin`. The deb's sha256 starts b929ec1c.
- go-pmtiles 1.31.2, from the GitHub release binary (tgz sha256 starts 3ed7dbf4).

**Scripts** (committed in `scripts/tiles/`):
- `prep_tiles_hamilton.py <layer>` writes EPSG:4326 line-delimited GeoJSON with public fields only.
- `build_tiles_hamilton.sh [layer]` runs tippecanoe.
- `range_http_server.py` is a local Range test server bound to 127.0.0.1. It is not deploy tooling.

**Output:** `local-data/tiles/hamilton/2026-10-17/*.pmtiles`.

**Fields per layer (public fields only):**
- **parcels:** heavymap_id (registry CURRENT run `20261017T0725Z-run2`), arn (first), arn_all (when more than one), arn_count, arn_grade, area_m2. Duplicate stacked geometries become one feature per HeavyMap ID. `Owner` and `Legal_Txt` exist only on NPCA Parcels_Cityview, which the prep never reads, and the prep asserts that no screened field name is present.
- **buildings:** heavymap_id, parcel_heavymap_id, name (City building name, when present), area_m2.
- **zoning:** all C002 attributes except Creator | Editor | GlobalID | Shape__Area | Shape__Length | CreationDate | EditDate. `*_DATE` fields become ISO dates.
- **nature-frame:** three layers:
  - greenbelt (`designation`)
  - conservation (`authority`: HCA | NPCA | GRCA, the regulation limits)
  - parks (`name` | `park_class` | `type`)

| File | Features in | Zooms | Size | Tiles | Build wall / peak RSS |
|---|---|---|---|---|---|
| parcels.pmtiles | 166,745 | z12–15 | 25.3 MB | 2,217 | 32 s / 257 MB |
| buildings.pmtiles | 214,287 | z13–15 | 29.9 MB | 2,018 | 29 s / 175 MB |
| zoning.pmtiles | 11,829 (31 null geometries skipped) | z10–15 | 7.9 MB | 2,166 | 14 s / 110 MB |
| nature-frame.pmtiles | 1,246 (9 + 604 + 633) | z6–13 | 0.72 MB | 195 | 10 s / 187 MB |
| **Total** | | | **63.8 MB** | | |

All files are well under the 100 MB per-file target, the total is well under 300 MB, and the nature frame is far under its 3 MB startup budget. Prep took 5–14 s per layer, with a peak of 749 MB (buildings).

**Completeness at maximum zoom** (counted by decoding with tippecanoe-decode):
- **Parcels:**
  - 166,743 of 166,745 HeavyMap IDs at z15.
  - The 2 missing are sub-square-metre slivers that vanish at tile precision.
  - At z12 the densest tiles keep only the sparsest features, so 55,664 IDs appear; z14 has 166,742.
- **Buildings:** 214,278 of 214,287 at z15, and 135,804 at z13.

Overzooming past z15 is left to the client.

**Commands** (from `build_tiles_hamilton.sh`):
- **Common flags:** `TIPPECANOE_MAX_THREADS=2 tippecanoe --force --read-parallel --temporary-directory=<tiles>/tmp --no-progress-indicator`
- **parcels:** `-l parcels -Z12 -z15 --detect-shared-borders --simplification=2 --no-tiny-polygon-reduction --drop-densest-as-needed --extend-zooms-if-still-dropping`
- **buildings:** `-l buildings -Z13 -z15 --simplification=2 --drop-densest-as-needed --extend-zooms-if-still-dropping`
- **zoning:** `-l zoning -Z10 -z15 --detect-shared-borders --simplification=4 --coalesce-densest-as-needed --extend-zooms-if-still-dropping`
- **nature-frame:** `-Z6 -z13 --simplification=10 --detect-shared-borders --coalesce-smallest-as-needed --maximum-tile-bytes=300000 -L greenbelt:… -L conservation:… -L parks:…`

**Memory:** deb had about 2.3 GB free (about 5.4 GB available) during the build. The two-thread cap and temp files on `/fast` kept tippecanoe under 260 MB, so builds can run alongside other work. Tile size stays at the default 500 KB cap. The largest parcel tiles at z12–13 downtown drop to the sparsest 25–81% of features to fit, and a z13 parcel tile in the core is about 450 KB.

**Budget notes for later:**
- The parcel string pool (heavymap_id plus ARN) is about 10.7 MB of the 25 MB.
- If parcels must start at z11, expect about 35 MB.
- Address points (274k) are not built yet. Expect about 15–25 MB at z14–15.

## C. Range-request tests

**Local, both passed:**
- `range_http_server.py` returned `206 Partial Content` with `Content-Range: bytes 0-126/25327712`, and the body started with the `PMTiles` magic. `pmtiles show parcels.pmtiles --bucket=http://127.0.0.1:8731` read the header and directory over HTTP ranges.
- `pmtiles serve` served z13 tiles from all four archives (HTTP 200, application/x-protobuf).

**GitHub Pages** (existing public sites only; no site, workflow or deploy tooling was created):
- **Range is honoured.**
  - `Accept-Encoding: identity` returned 206 with a correct `Content-Range`:
    - pages.github.com
    - heavymap.com (this repo's existing CNAME)
    - a binary at protomaps.github.io/basemaps-assets
    - the bdon.github.io range-bug repro object (5 MB offset)
  - A real `.pmtiles` on the Pages origin (demotiles.maplibre.org/pmtiles/vector/world.pmtiles, via `--resolve` to 185.199.108.153) returned 206 `bytes 0-126/3829650` with the PMTiles magic.
- **Breaks when the client accepts gzip.** Firefox sends `Accept-Encoding: gzip, deflate, br, zstd, identity`, and Pages then compresses `application/octet-stream`, `.pmtiles` included, and applies the range to the compressed representation:
  - **world.pmtiles:** `content-encoding: gzip`, `content-range: bytes 0-126/3748416`, and the body starts with `1f8b` instead of `PMTiles`.
  - **bdon repro:** the 5 MB-offset range returns 416 with `bytes */5183`.

  This is the open protomaps/PMTiles#584 issue, still reproducible on 2026-10-17. Chrome and Safari send `identity`, so they work. Known workaround, not tested here: name archives `.pmtiles.gz`, or host them on a non-transforming store. Decide this at G6.
