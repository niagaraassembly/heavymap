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

- Overlay polygons for **one layer** sit in a shapely 2 `STRtree`.
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
  --overlay LYR-HAM-ZONING=local-data/hamilton-city/zoning-bylaw-boundary-hamilton-2026-10-17/zoning-26917.geojson
```

Equivalent: `python3 scripts/link_hamilton_overlays.py`. Missing layer paths are skipped unless `--require-all`. Inputs must already be in EPSG:26917.

This cloud VM cannot reach ArcGIS. Run the linker on the owner’s machine against local pulls. Never commit those files.

## Hamilton layers

See `heavymap/overlays/config.py`. Field names come from catalog 09, 17-layer-profile, and `hamilton-dataset-groupings.csv`. Unknown names are `TODO` (HARD-RULES 8), including NEP Development Control Area (no catalog row) and Secondary Plan Land Use class / retired-plan names (PI-0003). Conservation Halton has no open regulation layer; it is a named gap, not a config row.

## Tests

`python3 -m unittest tests.test_heavymap_overlays -v`

Synthetic metre-space boxes only. No real Hamilton rows in git. Overlay tests skip if shapely is not installed.
