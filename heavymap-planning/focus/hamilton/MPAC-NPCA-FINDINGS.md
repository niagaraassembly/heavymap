# MPAC / NPCA findings for Hamilton (2026-10-17)

The rules basis is HARD-RULES 2, 4 and 5 as amended in draft PR #61 (not merged). Pulls keep all fields, including owner and identifying fields. Raw data stays local. Identifying information is screened from public view at the publish boundary. Roll numbers, tax class and parcel civic addresses are public in Ontario; owner, legal description and personal info are screened.

## What existed before this pull
- **On disk:** no MPAC data for Hamilton. The only roll-number file held locally is St. Catharines `Parcel_Fabric_Public` (44,265 rows, `ROLL_NUMBER` 19-digit). See `mpac-data-inventory.csv`.
- **City of Hamilton:** publishes no roll number, property class or assessed value. `Hamilton_Assessment_Parcel` (166,828) is geometry only.

## NPCA Assessment Parcels: Hamilton pull
- **Source:** https://services1.arcgis.com/d0ZCwU7eGKVeNiEE/arcgis/rest/services/Assessment_Parcels_Test/FeatureServer/0
- **Clip:** Hamilton `City_Boundary/FeatureServer/13`. The server query used the boundary simplified about 50 m, then each parcel was re-tested against the exact boundary. Every candidate passed.
- **Pulled:** 2026-10-17 00:52 ET.
- **Stored (local only, outside git):** `/fast/code/making/na/local-data/npca/assessment-parcels-hamilton-2026-10-17/`
  - `npca_assessment_parcels_hamilton.geojson`
  - `raw/`: every page response, the layer metadata and the ids query
  - `PULL-SUMMARY.json`
- **Rows:** 90,306.
- **Fields** (first pull used explicit `outFields`; re-pulled with `outFields=*`, see the update section below): OBJECTID_1, ASSESSMENT, ARN, OBJECTID, ASSESSME_3, MPAC_STREE, MPAC_TAXAT, STREET_NAM, FULL_STREE, ABBR_STREE, STREET_NUM, STREET_N_1, STREET_TYP, DIRECTIONA, STREET_T_1, DIRECTIO_1, UNIT_IDENT, MUNICIPALI, GlobalID, Shape__Area.
  - This layer has no owner field. `Parcels_Cityview` (which has an owner field) was pulled afterwards with all fields; see below.
- **Coverage of Hamilton by area:** 36.2% of 1,148.8 km². By count, 90,306 parcels against 166,828 city parcels. Coverage is NPCA-watershed only, so the north and west of the city have none.
- **ARN format:**
  - `ARN` is 15 digits on all 90,306 rows. `ASSESSMENT` is 20 digits (ARN plus `00000`), all numeric.
  - The prefix `2518` (Hamilton) is on 90,296 rows. 9 rows have `0000…` and 1 has `2615`.
  - The 19-digit form is the first 19 characters of `ASSESSMENT`. 274 of those are duplicates (likely condo or multi-polygon parcels).
  - `MUNICIPALI`: 87,960 Hamilton (two spellings), 2,344 blank, 1 Burlington, 1 Grimsby.
- **Match to `Hamilton_Assessment_Parcel`:** random sample of 2,000, seed 42, EPSG:26917.
  - Reciprocal 1:1 by representative point (each parcel's point falls in exactly the other): 1,992 of 2,000 (99.6%).
  - Clean 1:1 with overlap ratio (IoU) of 0.9 or more: 575 of 2,000 (28.8%).
  - Reciprocal but IoU below 0.9: 1,417. One-way only: 5. Point in more than one parcel: 3.
  - IoU quantiles: p10 0.81, p25 0.85, p50 0.88, p75 0.91, p90 0.94.
  - **Reading:** the two fabrics are the same parcels (near-total reciprocal match), but there is a consistent geometric offset or generalisation difference. That keeps IoU under 0.9 for most pairs. Centroid-reciprocal matching is the usable join. The IoU threshold should be about 0.75 to 0.8, or the offset should be measured and corrected first.
- Conservation authority coverage and the GRCA trial pull: see `CONSERVATION-SOURCES.md`. Conservation Halton is a named gap (no open regulation-limit endpoint).

## Update 2026-10-17 ~02:00 ET: all-fields re-pull (Morgen: "pull in what we can and screen identifying information from public view")
- **`Assessment_Parcels_Test`, `outFields=*`:** `local-data/npca/assessment_parcels_test-hamilton-allfields-2026-10-17/`.
  - 90,306 rows, 22 fields: the earlier 20 plus Shape_Leng and Shape__Length.
  - Coverage: 36.2% of Hamilton by area.
  - `MPAC_TAXAT` is non-null on 87,962 rows.
  - Civic-address fields, **public** (Morgen 2026-10-17: "Yes, show addresses"): MPAC_STREE, STREET_NAM, FULL_STREE, ABBR_STREE, STREET_NUM, STREET_N_1, STREET_TYP, STREET_T_1, UNIT_IDENT, DIRECTIONA, DIRECTIO_1. This layer has no personal fields to screen.
  - The older folder `assessment-parcels-hamilton-2026-10-17/` is marked superseded in its PULL-SUMMARY.
- **`Parcels_Cityview`, `outFields=*`:** `local-data/npca/parcels_cityview-hamilton-allfields-2026-10-17/`.
  - 81,121 rows. Layer last edited 2020-02-27. Coverage: 34.8% of Hamilton by area.
  - 23 fields: OBJECTID_1, OBJECTID, APObjectID, ARN, Prime_Sub, Owner, Full_Stree, StreetName, StreetType, StreetDir, Qualifier, Unit, Municipali, PostalCode, Legal_Txt, PropCode, CentroidX, CentroidY, CentroidXd, CentroidYd, RoundedAre, Shape__Area, Shape__Length.
  - **Personal: `Owner`** (non-null on 80,012 rows). Never public.
  - Civic-address fields, **public**: Full_Stree, StreetName, StreetType, StreetDir, Unit, PostalCode (empty), Qualifier.
  - **Screened**: `Owner` and `Legal_Txt` (legal description, 1,562 non-null).
  - `PropCode` (MPAC property code, public) is non-null on only 1,628 Hamilton rows.
