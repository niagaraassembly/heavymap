# Hamilton base and key-join pull, profile and first spine check (2026-10-17 ET)

**Linear:** NA-24 (spine epic), NA-270 (data treatment), NA-276 (NPCA offset). **By:** Grok Bot on deb. Docs and stats only: no pulled rows and no owner values are in git.

Rows for these results are in `Spreadsheets/16-service-profile.csv` (3 services), `17-layer-profile.csv` (13 layers), `18-quirks-log.csv` (Q-001 to Q-019) and `19-process-insights.csv` (PI-0012 to PI-0020).

## Where the data and scripts are (deb, outside git)

- Data: `/fast/code/making/na/local-data/<source>/<dataset>-hamilton-2026-10-17/` with `<dataset>.geojson` (EPSG:4326, `outFields=*`), `PULL-SUMMARY.json` and `raw/layer_metadata.json`.
- Scripts in `/fast/code/making/na/local-data/scripts/`:
  - `pull_arcgis_layer.py` and `pull_hamilton_base.sh`: the pull.
  - `profile_hamilton_layers.py`: the layer profiles.
  - `spine_check_hamilton.py`: the spine check.
  - `join_checks_hamilton.py`: the candidate join checks.
  - `offset_cityview_check.py`: the Parcels_Cityview offset sample.
- Stats output: `/fast/code/making/na/local-data/hamilton-city/_profile-2026-10-17/`, holding `layer-profiles.json`, `spine-check.json`, `join-checks.json` and `offset-cityview.json`.
- Runtime: the 11 new pulls (about 1.0M features) took under 6 minutes with no retries. Each analysis step ran in under 2 minutes.

## Datasets

The groupings' Tier 0 (base, 9 rows) and Tier 1 (key-join, 4 rows) are shown here. Two Tier 0 rows are catalog duplicates (C010, C013). Zoning and Community Boundaries (Tier 2) were added because the spine track needs them.

| Row | Dataset | Source | Rows | Key field | Native CRS | Last edit | Status |
|---|---|---|---|---|---|---|---|
| C205 | City Boundary | City AGOL | 1 | OBJECTID | 26917 | 2023-10-03 | new pull |
| C358 | Hamilton Assessment Parcel | City AGOL | 166,828 | none (OBJECTID only) | 3857 | 2024-06-27 (data) | new pull, all fields |
| A01 | NPCA Assessment_Parcels_Test | NPCA AGOL | 90,306 | ARN (15) | 3857 | — | reused |
| — | NPCA Parcels_Cityview | NPCA AGOL | 81,121 | ARN (15 or 20) | 3857 | 2020-02-27 | reused |
| C004 | Addresses | City AGOL | 274,725 | none (composite address) | 26917 | 2026-10-16 | new pull |
| C003 | Buildings | City AGOL | 214,292 | none (OBJECTID only) | 26917 | 2026-10-06 | new pull |
| A25 | LIO Municipal boundary | LIO Open03/14 | 16 | MUNID, ASSESSMENT_CODE | 4269 | effective 2024-02-15 | new pull |
| C163 | Street Centreline | City AGOL | 19,855 | SEGID (unique) | 26917 | 2026-10-16 | new pull |
| C147 | Waste Collection by Address | City AGOL | 277,701 | FULL_ADDRESS | 26917 | 2026-10-10 | new pull |
| C170 | Surface Water Quality Program | City AGOL | 3,172 | UNITID (68 stations) | table | 2026-10-10 | new pull |
| C275 | HCA Managed Forest 2017 | NPCA AGOL | 23 | ROLL_NUMBER | 26917 | 2025-05-23 | new pull |
| C250 | MPAC land parcels | fee-based | — | ARN | — | — | not pullable (dead end) |
| C002 | Zoning By-law Boundary | City AGOL | 11,860 | GlobalID, ZONING_CODE | 3857 | 2026-10-10 | new pull (Tier 2) |
| C206 | Community Boundaries | City AGOL | 6 | COMMUNITY_NAME | 26917 | 2023-10-03 | new pull (Tier 2) |

GRCA regulation limits were already pulled and were not re-pulled.

## First spine check: City parcels vs NPCA ARN parcels

The check covers the full population of both layers, in EPSG:26917. The match is by representative point (point on surface) in both directions. The "overlap" set is the City parcels whose point lies within 5 m of an NPCA parcel. NPCA geometry was shifted by the measured median offset (dx +0.297 m, dy -0.939 m; NA-276).

| Measure | Raw | Shifted |
|---|---|---|
| NPCA parcels | 90,306 | 90,306 |
| City parcels in overlap | 92,490 | 92,481 |
| Reciprocal 1:1 pairs | 90,057 (99.72% of NPCA) | **90,102 (99.77%)** |
| IoU of 1:1 pairs, p10 / p50 / p90 | 0.817 / 0.875 / 0.938 | **0.999 / 1.000 / 1.000** |
| 1:1 pairs with IoU ≥ 0.9 | 25,402 | **89,837** |
| NPCA parcels with no City parcel | 25 | 13 |
| City parcels in overlap with no NPCA parcel | 43 | 31 |
| NPCA point inside 2 City parcels (stacked duplicates) | 46 | 46 |
| City parcels that get an ARN | 90,128 | 90,162 (54.0% of the city) |
| City parcels with more than one ARN | 122 | 101 |
| ARNs that span more than one City parcel | 141 | 141 |

**One-to-many (shifted):**
- 189 NPCA parcels each contain the points of 2 or more City parcels, 2,538 City parcels in all. Here the City fabric is finer than NPCA's.
- In the other direction, 275 NPCA rows reuse an ARN; one ARN sits on 49 polygons.

**Offset source:**
- Over the 90,102 pairs, the offset is constant: the interquartile range is under 3 mm on both axes.
- Parcels_Cityview shows the same offset (5,000-row sample).
- NPCA's own stored `CentroidX` and `CentroidY` (UTM metres) sit +0.30 m and -0.93 m from its served geometry. So the NPCA attribute values agree with the City, and the shift enters in NPCA's hosted geometry. The City fabric should be the reference.

## Other candidate joins

| Join | Result |
|---|---|
| Address point → City parcel | 273,509 in exactly 1 parcel, 356 in none (median 7 m away), 860 in 2–3 stacked parcels. 2,991 parcels have no address. |
| Building rep point → City parcel | 213,676 in exactly 1 parcel, 522 in none. 21,307 footprints overlap 2 or more parcels by more than 1 m². 20,416 parcels have no building. |
| NPCA civic address → City address on the same parcel | 84,387 of 88,167 exact (95.7%), plain upper-case. 4,051 NPCA parcels have a blank address. |
| Waste Collection → Addresses (number + street + community + unit) | 271,875 of 277,701 exact. 275,466 match without the unit. |
| Parcel rep point → Zoning | 165,766 in exactly 1 zone, 1,061 in none, 1 in 2 |
| Parcel rep point → Community / City Boundary | 166,708 inside, 120 outside |
| Managed forest ROLL_NUMBER → NPCA ARN | 8 of 23 (hyphens stripped). 19 of 23 start 2518. |
| Parcels_Cityview ARN → Assessment_Parcels_Test ARN | 80,244 of 80,801 distinct |
| Address street name → Centreline STREET_NAME_COMPLETE | 4,215 of 4,233 names (274,591 of 274,725 rows) |
| ARN prefix → LIO ASSESSMENT_CODE | Hamilton is 2518 (MUNID 25005). 90,296 of 90,306 NPCA ARN start 2518. |

## Top quirks

The full list is Q-001 to Q-019 in `18-quirks-log.csv`.

1. **No stable IDs** on the City's parcels, addresses or buildings: OBJECTID only (Q-002, Q-011). The parcel layer carries no attributes at all.
2. **NPCA offset of 0.984 m**, constant across the city (Q-004). The fix is a translation; no reprojection is needed.
3. **Grain mismatch:** 189 NPCA parcels cover 2,538 City parcels (Q-007), and 275 duplicate ARN rows (Q-006). ARN is an attribute, not a key.
4. **Stacked duplicate City parcels:** 83 rows (Q-001).
5. **Storage CRS mix:** parcels and zoning are hosted in EPSG:3857, the other City layers in 26917 (Q-003).
6. **Cityview `Full_Stree` holds the street number** (Q-010). NPCA text blanks are a single space (Q-008).
7. **Zoning geometry:** 31 null and 72 invalid shapes (Q-015).

## Recommended next steps for the HeavyMap ID registry

1. **Mint parcel IDs from the City fabric.** Use one `hm:ca:on:hamilton:parcel:<id>` per distinct City parcel geometry. Collapse the 83 stacked duplicates, keeping their OBJECTIDs as aliases. Use an opaque, permanent ID. Store a geometry fingerprint (rounded rep point plus area, in 26917) only as a matching aid for later re-pulls.
2. **Register NPCA as an aligned source.** Record the translation (+0.297, -0.939 m) as a per-source transform in the registry, applied before every match. Attach ARN as a many-to-many attribute, with grades:
   - `exact`: reciprocal 1:1 with IoU of at least 0.9.
   - `one_to_many`: the 189 NPCA parcels covering several City parcels.
   - `unmatched`.
3. **Mint address IDs** from Addresses: one per number + street + community + unit, with points grouped under the civic address. Link each to its parcel by point-in-polygon, falling back to the nearest parcel within 10 m. Use Waste Collection as a cross-check of unit coverage.
4. **Mint building IDs** from a footprint fingerprint. Link each building to the parcel of largest overlap, and keep the overlap list for the 21,307 that cross parcel lines.
5. **Define the re-pull reconciliation rule.** On a fresh pull, match new geometry to registry IDs by fingerprint, then by IoU of at least 0.9. Splits and merges get new IDs plus lineage links. Never reuse an ID.
6. **Fill the ARN gap for the 46% of parcels outside NPCA coverage** (north and west Hamilton). Options: another MPAC-derived open layer (Conservation Halton or GRCA side), or a decision to carry `not_in_coverage` refusals.
7. **Write the registry and spine as a code PR** with tests, in `heavymap/` (stdlib plus an optional shapely extra). Run it as a Claude Code or Codex task, using these scripts as the reference implementation.
