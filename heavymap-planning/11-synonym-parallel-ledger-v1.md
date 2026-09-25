# 11 — Synonym and parallel ledger v1

**Linear:** [NIA-10](https://linear.app/niagaraassembly/issue/NIA-10/jurisdiction-roster-v1-exhaustive-ca-municipalities-us-countiesplaces) (extension comment `cea459e0`)
**Built:** 2026-09-25 (revised the same day after a second live-read pass) · **Source of truth:** `11-synonym-parallel-ledger-v1.csv` (118 rows). This file explains it and pulls out the rows a reader most needs. Ledger ids are stable across the revision: the second pass replaced rows in place and appended `LG-105`–`LG-118`.
**Concept IDs:** defined in `10-joining-concepts-v1.md`. Every `joining_concept_id` in the CSV appears there.

## 1. What a row says

| Column | Meaning |
|---|---|
| `ledger_id` | Stable row id (`LG-001`…). |
| `native_term` | The publisher's field name, verbatim, including casing (`NEI_ID` ≠ `nei_id`). Where a field was not read, the term is written in parentheses. |
| `jurisdiction_or_source` | Publisher and layer. |
| `joining_concept_id` | The concept this term **actually serves**. |
| `relation` | Closed set below. |
| `display_genre_default` | `ca`, `us` or `neutral` (recommendation only). |
| `notes` | Traps, sample values, why the relation was chosen. |
| `facet` | Which part of the concept this term covers (`print_form`, `full_19`, `code`, …). |
| `counterpart_ids` | The row(s) this term is compared with or likely to be confused with. |
| `evidence_level` | `live_verified`, `documented`, `catalog_only`, `unverified`. |
| `evidence_ref` | Endpoint and date, or the doc/MCS row relied on. |
| `observed_on` | 2026-09-25 for the live reads. |

### Relation, precisely

The relation is measured **against the concept's anchor term** (the row marked as the anchor in its notes, or the first `same` row), not row-to-row:

- **`same`**: substantively the same job, and the wording is identical or a trivial variant. Example: `printkey` (Monroe) vs `PRINT_KEY` (NYS); `NEI_ID` vs `nei_id`.
- **`alias`**: different words, same job. Example: `ROLL_NUMBER` (St. Catharines) for the roll-key concept that NY calls `SBL`; Welland's `ID` for `nei_id`.
- **`near`**: close or overlapping. **Never silently equated in a calculation.** Example: `FULL_MARKET_VAL` vs `TOTAL_AV`.
- **`false_friend`**: the word or appearance suggests one concept, the substance is another. The row's `joining_concept_id` is the concept it **truly** belongs to, and `counterpart_ids` names the term it will be mistaken for. Example: Monroe's `swis` looks like NYS `SWIS` but holds names.

Two rules of the ledger:

- **Concept unity ≠ joinability.** Two `premises_register_key` rows (`nei_id`, Welland `ID`) are not joinable to each other.
- **Genre follows relation.** `false_friend` rows are always `neutral`. Where the CA label would itself be a false friend in the other genre (roll number ↔ NY roll), the default is `neutral` too. Details in `10` §1.

## 2. Shape of the ledger

| | Count |
|---|---:|
| Rows | 118 |
| `same` / `alias` / `near` / `false_friend` | 65 / 15 / 28 / 10 |
| Evidence: `live_verified` / `documented` / `catalog_only` / `unverified` | **109 / 9 / 0 / 0** |
| Default genre: `ca` / `us` / `neutral` | 63 / 28 / 27 |
| Concepts with at least one row | 29 of 30 (the family parent `constraint_overlay` is deliberately row-free) |

## 3. Acceptance checks, answered

- **≥1 CA↔NY `false_friend`:** several, all live-read. `LG-017` Brant `PARCELCLASS` vs NY `PROP_CLASS` · `LG-065` Ontario "Industrial" zoning vs NY "industrial" class · `LG-084` NY "roll" vs Ontario "roll number" · `LG-043` `PROP_CLASS` 700-series vs NAICS · `LG-091`/`LG-092` "Brownfield" (BOA vs CIP).
- **≥1 `alias` or `same` for `nei_id`-class keys:** `LG-031` `NEI_ID` (`same`, casing), `LG-032` Welland `ID` (`alias`), and `near` rows for the Hamilton licence key `LG-033` and the regulators `LG-034`, `LG-035`, `LG-036`, `LG-038`.

## 4. The `nei_id` class, side by side

| Ledger | Term | Register | Relation | What differs |
|---|---|---|---|---|
| `LG-030` | `nei_id` | Niagara NEI 2022 | anchor (`same`) | Premises key. Integer. |
| `LG-031` | `NEI_ID` | NEI 2017–2019 | `same` | Casing only; caused a zero-departure false result. |
| `LG-032` | `ID` | Welland Business Directory | `alias` | Different register; no shared key with NEI. |
| `LG-033` | `LICENSE_NUMBER` | Hamilton licence tables (12 / 578 / 654 rows) | `near` | Licence-level, not premises-level; no geometry, so address text only. |
| `LG-034` | `tri_facility_id` | EPA TRI | `near` | Regulatory registration, not a survey. |
| `LG-035` | `epa_registry_id` / `frs_id` | EPA TRI | `near` | Cross-program key; one of the two was null on the first sample row. |
| `LG-036` | `NPRI ID / ID INRP` | ECCC NPRI | `near` | Bilingual header cell; keep the whole string. |
| `LG-038` | `DEC_ID` / `CBSNO` / `PBSNO` / `SITE_ID` / `AUTHORIZATION_NUMBER` | NYS DEC registries | `near` | Five registries, five key names. |
| `LG-037` | `ESTAB` | Census CBP | **`false_friend`** | A count, not a key. Filed under `jurisdiction_activity_aggregate`. |

Two facts about this class worth carrying into any encoding:

1. **`nei_id` is a premises key.** Between the 2019 and 2022 editions, 544 ids kept the id and changed business name; 121 departed. Only the identifier join is safe.
2. **The edition renames fields under you.** Id: `NEI_ID` → `nei_id`. Band: `SizeRange_Employees` (2017–2018) → `EmployeeSizeRange` (2019) → `sizerangeemployees` (2022). The same premises (`GSmartID` 11327946, 'Fort Erie · 1 Stop Computer Repair') appears in the 2017 and 2019 files; `GSmartID` is absent in 2022 (`GlobalID` instead).

## 5. Watch-list of traps found in this dig (all live-read on 2026-09-25 unless noted)

**Same field name, different substance**
- `swis`: NYS code `145601` vs Monroe names ('Town of Greece') (`LG-019`, `LG-020`).
- `SQ_FT`: **lot area**, not floor area. 0 on every sampled Erie industrial row and populated on 73 of 1,159 Erie 700-series parcels. Floor area is `GFA` (1,046 of 1,159). `INTEGRATION.md` groups "SQ_FT, GFA" as floor area, which is wrong for `SQ_FT` (`LG-094`–`LG-096`).
- `PARCELCLASS` (Brant): value `LAND` only. A fabric flag, not a class (`LG-017`).
- `ACRES` vs `CALC_ACRES`: assessor-stated vs geometry-computed. One roll-section-8 row read 0.01 vs 11.59.

**One key, many renderings**
- Norfolk publishes four renderings of the roll number in one layer: 19-digit, 15-digit (= 19 minus trailing `0000`), 11-digit, and `007-18300`. Haldimand uses 15-digit; St. Catharines 19-digit.
- Print keys: Erie `47.18-1-33`, Monroe `046.02-3-5.2`, Rochester `047.62-1-22`. Padding is county-specific.
- Monroe `countysbl` is 26 digits vs NYS `SBL` 20; equivalence not verified.

**Zero or a placeholder standing in for "unknown"**
- `SQ_FT` = 0, Rochester `STATEDAREA` '0.00', NEI `secondarynaics` = 0, NEI 2017 `_z` = -9999, NEI band 'Undetermined' / '0 Employees'.

**Register words that must be quotations only**
- NEI 2019 band 'Business Permanently Closed'; TRI `fac_closed_ind`. An expiry date (DEC `EXPIRATION`, Hamilton `EXPIRY_DATE`) is not a closure (`LG-117`).

**Found in the second live pass**
- **NPCA republishes an MPAC-derived parcel fabric** with `ARN`, `PropCode` and an `Owner` field: 284,250 and 265,717 parcels covering all twelve Niagara municipalities plus parts of Hamilton and Haldimand (Brant and Burlington are edge slivers only) (`LG-105`–`LG-110`, `LG-075`, `LG-107`). The item names the Open Government Licence v2, but the linked licence PDF returns 404 and the upstream MPAC terms are unverified (`12` §4).
- **One roll number, four widths:** 11, 15, 19 and 20 digits across Norfolk, Haldimand, St. Catharines and NPCA.
- **Welland's "business licences" are counts only** (`id`, `Description`, `Year`, `Bus_count`), so the licence *records* are not public (`LG-054`).
- **Hamilton's licence data is three geometry-free tables**, not the business inventory the spine says is missing (`LG-033`).
- **NPRI carries StatCan census-division and subdivision ids on each facility**, TRI carries county FIPS, and CBP is keyed by county: aggregates attach to a jurisdiction through these codes, never to a parcel (`LG-113`–`LG-115`). NPRI's 39 Geolocations columns include no accuracy field, unlike TRI (`LG-116`).
- **Overlay geometries differ:** Haldimand's flood hazard limit is a polyline (`LG-086`), Niagara's heritage list is 318 points (`LG-093`), and NPCA's floodplain is described by its publisher as not exhaustive (`LG-087`).
- **PSEZ is dated:** 31 polygons Ontario-wide, identified 2019-12-20, file modified 2020-01-08, with Hamilton, Brantford and Haldimand but nothing in Niagara Region (`LG-090`).

**Class, use and zoning are three things**
- On class 710 parcels the `USED_AS` code varied: 'Light mfg', 'Dstr wrhouse' and 'Walk-up off' all occurred. Rochester rows read PROPERTYTYPE 'Industrial' with RESCOM 'C'. Rochester's 710 label is 'Manufacturer', Monroe's 'Manufacture'.
- Hamilton zone codes are meaningless without the parent by-law (eight of them). Welland packs holding, zone and exception into one string (`H-RH-111`).

## 6. Rows to re-verify or complete

| Level | Ledger rows | What is missing |
|---|---|---|
| `unverified` | none | All four earlier rows were read in the second pass. |
| `catalog_only` | none | All nine earlier rows were read in the second pass. |
| `documented` | `LG-012`, `LG-023`, `LG-030`, `LG-043`, `LG-056`, `LG-063`, `LG-065`, `LG-081`, `LG-097` | Repo docs (NEI cross-year analysis, INTEGRATION.md, 08) or a closed product (MPAC), not re-read live. |

Caveats that survive the second pass, even on `live_verified` rows:

- **`LG-088` FEMA** was read from an ArcGIS Living Atlas mirror, not the authoritative host (which reset the connection on three paths).
- **`LG-063` Niagara County `ZoneCode`** is still `documented`: the server returned `Token Required` again on a re-check.
- **`LG-075` `PropCode`** values were read but MPAC's code table was not, so the meanings are unverified.
- **`LG-105`–`LG-110`** (NPCA): field lists, counts and item metadata were read. Owner values were deliberately not sampled, and the licence PDF the item links to returns 404.
- **`LG-097` `indoorgfa`** should be confirmed against the consolidated NEI, since the 2022 CSV header read has no such column.

## 7. Not in this ledger

- No `native_term` is mapped to a band. Bands live in `10` (per concept) and the fixtures.
- No values are normalised. The ledger is about names and jobs.
- No MCS cells are touched. Proposals are in `12`.
