---
run: CR-001
type: working-paper
evidence_date: 2026-10-17
part: 2 of 2
---
10 — HeavyMap joining concepts v1 (part 2 of 2)
working-paper, joins, concepts

> A working paper written on 2026-10-17, published nearly as written. Local file paths, private repository names and personal names have been removed.

## 6. Reading identifiers (illustrative catalog, not closed)

| Reading | Inputs (concepts) | Notes / refusal |
|---|---|---|
| `floor_area_m2` (existing) | `floor_area_published` | Keep source unit on the stamp. `not_in_coverage` when none published (Monroe, Ontario municipalities in this dig). |
| `coverage_ratio` (existing) | footprint area, `lot_area_m2` | Never `0`: refuse with the missing input's reason. |
| `employment_interval` (existing) | `employment_size_band` | Carry the band as a range; not a point value. |
| **`lot_area_m2` (proposed new)** | `lot_area_published` | Needed as the denominator of `coverage_ratio`. Reject sentinel zeros (see `12` §3). |

Other readings from `04-uk-capability-glean.md` (containment deltas, register-agreement confidence, gap distance) are deliberately left for a later ticket.

## 7. Open questions for the owner

1. ~~Keep `establishment_register_key`, or rename to `premises_register_key`?~~ **Decided 2026-09-25: `premises_register_key`**, with the old name kept as an alias.
2. Confirm the default genres: `assessment_roll_key`, `parcel_gis_key`, `assessment_property_class` (**changed from `us`**) and `statistical_geography_code` default to `neutral`; `assessed_value` to `us`; everything else `ca`.
3. ~~`planning_policy_overlay` band~~ **Decided 2026-09-25: `constraints`.**
4. Is `lot_area_m2` welcome as a named reading?
5. **NPCA's public MPAC-derived parcel fabric** (`12` §4): does OGL v2 as stated on the item actually cover HeavyMap's use? Resolved 2026-10-17 by HARD-RULES 4/5 (amended 2026-10-17, #61): licences don't gate, so the MPAC roll is no longer `not_licensed`; the "no parcel fabric" statements for Welland and Hamilton should be revisited.

## 8. Evidence and method

- **Live reads, 2026-09-25**, public read-only endpoints, no keys, in two passes. Pass 1: ArcGIS REST `?f=json` field lists and a few value samples for NYS Tax Parcels Public, Monroe `Parcels_Public`, Rochester `TaxParcel2024`, Norfolk, Haldimand, Brant, St. Catharines, Niagara Falls, Welland, Hamilton, NES; NEI 2017/2019/2022 CSV headers via HTTP Range; EPA Envirofacts `tri_facility`; Census CBP `variables.json`. Pass 2: Hamilton licence tables, Welland licence and heritage layers, NYS DEC registries, BOA and Brownfield CIP, Niagara heritage, Haldimand flood limit (layer 31), NPCA's ArcGIS Online services (fields, counts, item metadata), the PSEZ shapefile (DBF read), FEMA flood zones via an ArcGIS Living Atlas mirror, and NPRI via the ECCC data mart's real API (`data-donnees.az.ec.gc.ca/api`, found in the page's JavaScript bundle; CSV headers by Range). Raw responses were kept in the session scratchpad, not in the repo.
- **Still not read:** the MPAC product itself (not held); FEMA's authoritative host (`hazards.fema.gov` reset the connection on three paths); the NPCA licence PDF (the item's link returns 404); Niagara County NY parcels (still `Token Required` on a re-check); CBP data queries (need an API key); NYS Building Footprints layer 0 (index moved); NPCA owner values (deliberately not sampled) and the MPAC property-code table. The ledger now has no `unverified` or `catalog_only` rows; the remaining `documented` rows are repo-doc evidence not re-read live.
- **Documented, not re-read:** NEI cross-year behaviour (`niagara-atlas/logs/2026-08-23.md`), D-13, `INTEGRATION.md` crosswalk, MCS v4 rows, `07`/`08`/`09` (read-only, not edited).
- **Not edited:** MCS, `07`, `08`, `09`, `docs/`, PR #13, the Linear ticket state.
