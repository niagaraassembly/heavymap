---
run: CR-001
place: ca-on-3525005-hamilton
place_type: city
country: ca
subdivision: on
city: hamilton
type: working-paper
evidence_date: 2026-11-17
---
Hamilton building footprints: parcel links and size ranks
working-paper, hamilton, buildings, run-1

> A working paper written on 2026-11-17, published nearly as written. Local file paths, private repository names and personal names have been removed.

**Status:** published in the owner-authorized live map release; source data and full relationship tables remain local.

**Public data pin:** Industrial Atlas data commit `e3ab71d32660 (commit, shortened)`, map-layer set `2026-11-17-layer-set-003`.

## Deliverables

The full generated package is stored outside Git at a local working copy.

- `hamilton_buildings_ranked_shapefile.zip`: EPSG:26917 polygon shapefile with one feature per active registered footprint.
- `building_parcel_ranks.csv`: one row per active footprint, including the 383 with no positive parcel intersection.
- `building_parcel_overlaps.csv`: all 259,407 positive building–parcel intersections and the primary assignment flag.
- `parcel_building_summary.csv`: assigned footprint counts, summed plan-view area, largest footprint, and multi-parcel count by primary parcel.
- `hamilton_buildings_ranked_wgs84.ndjson`: screened map features for the public vector-tile release; includes numeric `AREA_M2`, stable `BUILD_ID`, parcel rank, overlap count and parcel-edge distance.
- `parcel-building-facts-index.json` and `parcel-building-facts/*.json`: all-active-parcel modal facts, sharded by the final two stable parcel-ID characters for on-demand loading.
- `manifest.json`: source/input hashes, output hashes, processing rules, feature counts and limitations.
- Reproducer: `scripts/export_hamilton_building_ranks.py`.

## Method and identity

The source is the City of Hamilton Buildings FeatureServer layer 8, pulled 2026-10-17; its metadata records a 2026-10-06 data edit. Processing uses the immutable registry run `20261017T0725Z-run2-ia1` in EPSG:26917. The five inactive source rows are excluded; all 214,287 active registered footprints are retained.

Each footprint is assigned to the parcel with the greatest positive polygon-intersection area. Exact overlap-area ties resolve by lexical parcel ID. Every other positive parcel intersection stays in the overlap table. Six zero-area rows in the registry overlap input are ignored, not treated as parcel links. The selected parcel agrees with the registry's stored primary assignment for all 213,904 linked footprints.

Within each primary parcel, `building_no` is assigned from 1 upward by full footprint area descending, then stable `building_id` ascending. Equal area groups are reported by `equal_area_tie_count`. `building_id` remains the durable cross-release identity; `building_no` is a convenient rank that can change when geometry or parcel membership changes. The rank scope is one parcel. Site-wide ranks require a separately defined site grouping.

`footprint_area_m2` / shapefile `AREA_M2` is continuous plan-view polygon area, so it supports numeric size filtering. It is not floor area, gross floor area, building height, occupancy or current use. The shapefile also includes `BUILD_ID`, `PARCEL_ID`, `BUILD_NO`, primary overlap area/share, the count of intersected parcels, and the equal-size tie count. Source `NAME`, OID, and source geometry fields are screened out.

For the parcel modal and map popup, the derivation also records the minimum distance from each assigned building footprint to its primary parcel boundary line. EPSG:26917 metre coordinates are used; touching, crossing, or a parcel boundary inside a footprint has distance zero. Parcel summaries expose nearest and median building-edge distance, buildings within 3 m, largest and median footprint size, assigned whole-footprint area sum, and the count of all intersecting footprints. Whole-footprint area sum is explicitly not parcel coverage. Parcels without assigned footprints receive zero counts and null size/distance statistics.

## Population and quality notes

- 214,287 active footprints; 213,904 assigned to 146,307 parcels; 383 remain unassigned.
- 259,407 positive building–parcel intersections; 33,485 footprints intersect more than one parcel.
- 146,307 parcels have at least one primary-assigned footprint; 20,438 of the 166,745 registry parcels do not.
- One invalid polygon and seven duplicate geometry rows were noted in the source profile. This export preserves registered geometry without silently repairing or removing it.
- The City describes footprints as digitized from aerial imagery; most residential outlines are best-fit rectangles, and small structures such as sheds may be absent.

The numbers support parcel-level discovery and size filtering. They do not establish that an unassigned parcel has no building, or that an outline represents a separate occupied building. Individual-building stories and documentation can use the stable footprint ID later, with the source and geometric limitations shown alongside it.

## Evidence

- City layer: https://services.arcgis.com/rYz782eMbySr2srL/arcgis/rest/services/Buildings/FeatureServer/8
- City layer metadata: https://services.arcgis.com/rYz782eMbySr2srL/arcgis/rest/services/Buildings/FeatureServer/8/metadata?f=html&format=default
- Local input run and output checksums/counts: `manifest.json` in the local package.
- Prior profile and multi-parcel quirk: `Spreadsheets/17-layer-profile.csv` (`LYR-HAM-BUILDINGS`) and `Spreadsheets/18-quirks-log.csv` (`Q-014`).
