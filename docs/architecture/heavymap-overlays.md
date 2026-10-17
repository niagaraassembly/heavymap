# HeavyMap overlay linker (Hamilton first)

**Status:** code, 2026-10-17. Linear **NA-24**, **NA-27**, **NA-270**. Synthetic tests only in git.

Attaches every overlapping zone or designation to each HeavyMap parcel ID with area shares. The ID registry (`heavymap/ids/`, [heavymap-id-registry.md](heavymap-id-registry.md)) mints the parcel keys. This package does not mint IDs and does not publish.

Morgen’s decisions that this code follows:

- Store every intersecting zone (provisional). The dossier explains overlaps; this table does not simplify to a dominant class.
- Join Greenbelt designation, Niagara Escarpment Plan designation, and NEP Development Control Area to every parcel, with area shares (firm).
- Labels are source-quoted (`City zoning: M11`, `City class: Vacant Lands`). HeavyMap does not assert vacancy.

Nothing here is published. Pulled rows stay in `local-data/`.

## Output

Long-format CSV, one row per parcel × overlay feature intersection:

| Column | Meaning |
|---|---|
| `heavymap_id` | Registry parcel ID (`hm:ca:on:hamilton:parcel:{ULID}`) |
| `layer_id` | Overlay config id (`LYR-HAM-ZONING`, …) |
| `feature_source_id` | Source feature id (GlobalID, OGF_ID, OBJECTID, …) |
| `class` | Source class field, or a constant such as `urban` / `regulated` |
| `quoted_label` | Source-quoted label from the layer template |
| `area_m2` | Intersection area in the working CRS (EPSG:26917) |
| `parcel_share` | `area_m2 / parcel_area` |
| `feature_share` | `area_m2 / overlay_feature_area` |
| `sliver` | `y` when share **and** area are under the sliver caps; still kept |

Default sliver rule: `parcel_share < 0.01` **and** `area_m2 < 5`. Flagged, not dropped.

Working CRS is EPSG:26917, same as the registry. Lon/lat GeoJSON is refused.

## How it scales

- Overlay polygons for **one layer** sit in a shapely 2 `STRtree`. The tree is built once per layer, not once per chunk.
- Polygons with more than 256 vertices are cut into quadrant pieces once per layer, like PostGIS `ST_Subdivide`. The pieces partition the feature, so their summed intersections equal the whole-feature intersection. Pieces are prepared, so a parcel that sits inside a piece takes its own area without a GEOS overlay. The remaining pairs are intersected in one vectorised call per chunk.
- Registry parcels stream from `parcels.csv` in chunks (default 2,500). Peak RAM is one overlay layer plus one chunk, aimed well under 2 GB on a machine with about 3–4 GB free.
- Invalid geometries are repaired with `make_valid` (zoning: 72 invalid, 31 missing — Q-015). Counts go in the run manifest.
- Secondary-plan lot-cut polygons are **not** dissolved. Each lot polygon that overlaps a parcel is a row.

Requires **shapely 2**. The ID registry remains stdlib-only.

## Persistence

Configurable directory, default `local-data/heavymap-overlays/hamilton/` (gitignored):

```text
CURRENT
runs/<run_id>/
  MANIFEST.json
  overlay_links.csv
```

## CLI

```text
python3 -m heavymap.overlays \
  --registry-dir local-data/heavymap-registry/hamilton \
  --data-root local-data \
  --overlay LYR-HAM-ZONING=local-data/hamilton-city/zoning-bylaw-boundary-hamilton-2026-10-17/zoning-bylaw-boundary-26917.geojson
```

Equivalent: `python3 scripts/link_hamilton_overlays.py`. Missing layer paths are skipped unless `--require-all`. Inputs must already be in EPSG:26917.

This cloud VM cannot reach ArcGIS. Run the linker on the owner’s machine against local pulls. Never commit those files.

## Hamilton layers

See `heavymap/overlays/config.py`. Field names come from catalog 09, 17-layer-profile, `hamilton-dataset-groupings.csv` and the live REST reads made on 2026-10-17 (see `heavymap-planning/focus/hamilton/TILES-BUILD-2026-10-17.md`):

- **NEP Development Control Area:** `PolicyPlanning/MapServer/10`, the City's republication of the NEC layer. LIO does not publish it (Q-020). The id is `OBJECTID`, the label uses `PART`, and the class is the constant `development_control`.
- **Secondary Plan Land Use:**
  - class `LANDUSE_CLASS`, plan name `SEC_PLAN_NAME`, id `OBJECTID` (`ID` is always null, Q-024)
  - four retired plans are filtered: `Retired - Greensville`, `Retired - Downtown Hamilton`, `Retired - Clappisons Corner` and `Retired - Lower Spencer Creek` (Q-025)
- **HCA Regulated Areas:** the id field is `OID`. `Version` is 0 on every row, so the class is the constant `regulated` (Q-021).
- **Default input paths:** each `default_rel` names the real deb pull (`<source>/<dataset>-hamilton-2026-10-17/<dataset>-26917.geojson`), so `--data-root local-data` finds all 11 layers.

Conservation Halton has no open regulation layer. It is a named gap, not a config row.

## Validation on real Hamilton data (2026-10-17, deb)

The CLI was run against the CURRENT registry run (166,745 active parcels) and the 11 EPSG:26917 overlay pulls, with shapely 2.2.

| Layer | Features loaded | Link rows | Slivers | Parcels with a non-sliver row |
|---|---|---|---|---|
| LYR-HAM-ZONING | 11,829 (31 null geometries, 72 repaired) | 229,937 | 51,961 | 165,793 |
| LYR-LIO-GREENBELT-DESIGNATION | 9 | 41,941 | 64 | 41,758 |
| LYR-LIO-NEP-DESIGNATION | 115 | 25,549 | 130 | 23,185 |
| LYR-HAM-NEP-DEVELOPMENT-CONTROL | 1 | 3,186 | 434 | 2,752 |
| LYR-NPCA-APPROX-REGULATION-LANDS (written as LYR-NPCA-REGULATION-LANDS in run 20261017-val2; renamed to the sheet 17 id) | 271 | 3,612 | 84 | 2,361 |
| LYR-HCA-REGULATED-AREAS | 134 | 12,123 | 207 | 11,722 |
| LYR-GRCA-REGULATION-LIMITS-WATERLOO | 199 | 1,193 | 32 | 834 |
| LYR-HAM-SECONDARY-PLAN-LAND-USE | 46,149 (1,056 retired filtered) | 155,721 | 96,636 | 54,358 |
| LYR-HAM-EMPLOYMENT-LANDS | 22 | 3,706 | 390 | 3,308 |
| LYR-HAM-URBAN-BOUNDARY | 1 | 151,910 | 105 | 151,805 |
| LYR-HAM-RURAL-BOUNDARY | 1 | 15,520 | 567 | 14,953 |
| **Total** | | **644,398** | **150,610** | |

**Coverage.** 166,729 of 166,745 parcels have at least one overlay row. The other 16 fall outside both the urban and the rural boundary, which together equal the City boundary.

**Slivers.** Most slivers come from edges: zoning and lot-cut boundaries do not follow the parcel fabric exactly. Secondary-plan lot-cuts give 62% of that layer's rows as slivers. They are flagged, not dropped.

**Runtime and memory.**
- The first run, with the tree rebuilt per chunk and whole-polygon intersections, took 861 s wall at 345 MB peak RSS.
- After the subdivide, prepared-piece and vectorised changes, it took 184 s at 395 MB.
- The two runs gave the same 644,398 (parcel, layer, feature) keys and identical class, label and sliver values. The largest area difference was 1.0e-6 m².
- Most of the remaining time is parsing parcel geometry_json once per layer.

## Tests

`python3 -m unittest tests.test_heavymap_overlays -v`

Synthetic metre-space boxes only. No real Hamilton rows in git. Overlay tests skip if shapely is not installed.
