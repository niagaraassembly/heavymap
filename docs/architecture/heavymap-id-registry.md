# HeavyMap ID registry (Hamilton first)

**Status:** code, 2026-10-17. Linear **NA-24**, with NA-270 (treatment) and NA-276 (NPCA offset). Synthetic tests only in git.

How a City of Hamilton parcel (and its addresses and buildings) gets a permanent HeavyMap ID. The ID format is [ADR 0003](adr/0003-heavymap-id-format.md). The spine grammar is [parcel-identity-spine.md](parcel-identity-spine.md). Findings that drove the rules are [SPINE-BASE-PULL-2026-10-17.md](../../heavymap-planning/focus/hamilton/SPINE-BASE-PULL-2026-10-17.md) and quirks Q-001–Q-019.

Nothing here is published. Pulled rows stay in `local-data/`. Owner and other identifying field **names** may appear in config denylists; values are dropped on load and never written to the registry.

## What gets minted

| Grain | Spine key | Source | Collapse rule |
|---|---|---|---|
| parcel | `hm:ca:on:hamilton:parcel:{ULID}` | City Assessment Parcel polygons | one ID per distinct geometry; `OBJECTID`s become aliases |
| address | `hm:ca:on:hamilton:address:{ULID}` | City Addresses | one ID per `number\|street\|community\|unit`; several points share it |
| footprint | `hm:ca:on:hamilton:footprint:{ULID}` | City Buildings | one ID per distinct footprint; overlap list kept |

ARN is **not** minted. It is attached to a parcel ID with a grade.

## Matching aids (never the ID)

- **`geom_hash`** — SHA-256 prefix of rounded, rotation-normalised rings. Detects the 83 stacked City duplicates (Q-001) and exact re-pulls.
- **`fingerprint`** — `{rep_x:.2f}:{rep_y:.2f}:{area:.2f}` in EPSG:26917. Second-chance re-pull key.
- **ARN** — 15-digit roll number from NPCA Assessment_Parcels_Test, after the Q-004 shift.

## Geometric correction

Per-source translation, applied **before** matching, in the working CRS (EPSG:26917):

| Source | dx_m | dy_m |
|---|---|---|
| City parcels, addresses, buildings | 0 | 0 |
| `npca_assessment_parcels_test` | +0.297 | −0.939 |
| `npca_parcels_cityview` (same hosted offset; Owner field not used) | +0.297 | −0.939 |

City fabric is the reference (PI-0013). Inputs must already be in EPSG:26917. Lon/lat GeoJSON is refused so the metre shift cannot be applied to degrees.

## ARN grades

Assigned to each City parcel when an NPCA layer is supplied. Reciprocal representative-point containment, then rolled up by ARN.

| Grade | Meaning |
|---|---|
| `exact_1to1` | this parcel and this ARN point at each other only |
| `one_to_many` | this ARN also attaches to other City parcels (City grain is finer) |
| `many_to_one` | this City parcel holds more than one ARN |
| `unmatched` | inside or within 5 m of NPCA coverage, no attachment |
| `not_in_coverage` | farther than 5 m from any NPCA polygon (~46% of the city) |

These are registry attachment grades. They are not the NA-86 `exact` / `good` / `weak` / `refused` scale (still open).

Parcels_Cityview is a secondary, stale ARN source. This code path does not load it by default, and it will not copy `Owner` or `Legal_Txt` if someone passes that file.

## Addresses and buildings

- Address → parcel: point-in-polygon. If the point is in no parcel, nearest parcel within 10 m. If it is in two distinct parcels, `pip_ambiguous` and no link (stacked duplicates have already collapsed).
- Building → parcel: largest intersection area. The full overlap list is stored. Waste Collection by Address is an optional unit-coverage cross-check (`waste_seen` = `y`/`n`), not an ID source.

## Re-pull

1. Match active registry rows by `geom_hash`, then by `fingerprint`, then by unique IoU ≥ 0.9. Those keep their ID.
2. Remaining one-old-to-many-new with overlap: **split** — new IDs, `split_into` lineage, parent retired.
3. Remaining many-old-to-one-new: **merge** — new ID, `merged_from` lineage, parents retired.
4. Remaining 1:1 below 0.9 IoU: **replaced_by** — new ID, parent retired.
5. Remaining new shapes mint new IDs. Remaining old rows retire. Retired locals stay in the issued set.

Address IDs persist by civic key. Building IDs use the same polygon reconcile rule at footprint grain.

## Persistence

Configurable directory, default `local-data/heavymap-registry/hamilton/` (gitignored):

```text
CURRENT                         # run id of the latest write
runs/<run_id>/
  MANIFEST.json
  parcels.csv
  arn_links.csv
  addresses.csv
  buildings.csv
  building_overlaps.csv
  lineage.csv
```

CSV is the v1 store so the cloud environment stays stdlib-only. Parquet can be an extra later; it is not required to mint.

## CLI

GeoJSON FeatureCollections, already in EPSG:26917:

```text
python3 -m heavymap.ids \
  --parcels local-data/hamilton-city/assessment-parcel-hamilton-2026-10-17/parcels-26917.geojson \
  --npca local-data/npca/assessment_parcels_test-hamilton-allfields-2026-10-17/parcels-26917.geojson \
  --addresses local-data/hamilton-city/addresses-hamilton-2026-10-17/addresses-26917.geojson \
  --buildings local-data/hamilton-city/buildings-hamilton-2026-10-17/buildings-26917.geojson \
  --registry-dir local-data/heavymap-registry/hamilton
```

Equivalent: `python3 scripts/mint_hamilton_registry.py` with the same flags. A second run against the same `--registry-dir` reconciles. The run manifest is `runs/<run_id>/MANIFEST.json`.

Identifying properties are stripped on load. Do not pass NPCA Parcels_Cityview as a way to get owner names into the registry; the denylist drops them anyway.

## Tests

`python3 -m unittest tests.test_heavymap_ids -v`

Synthetic metre-space boxes only. No real Hamilton rows in git.
