---
run: CR-001
type: working-paper
evidence_date: 2026-10-17
part: 2 of 2
---
EPIC 2 — Parcel Identity Spine and joins (part 2 of 2)
working-paper, spine, joins, pilots

> A working paper written on 2026-10-17, published nearly as written. Local file paths, private repository names and personal names have been removed.

## Conflicts with existing docs (d)

| Doc | Statement | Finding |
|---|---|---|
| `parcel-identity-spine.md` (Canada section and synthetic table) | Welland's open data had no parcel fabric; the Welland unit is at footprint grain with parcel PIN `not_in_coverage` | A public Welland parcel fabric exists, keyed by `Parcel_No`, outside the DCAT catalog. Parcel PIN would be `not_joined` or `observed`, not `not_in_coverage`, once admitted. |
| `parcel-identity-spine.md` (spine key illustration) | US local token shaped like a print key; municipality slug stays the county until a SWIS join names the city | Print keys are padded differently by layer; SBL20 is stable. For Rochester the SWIS join exists in `countysbl` (prefix `261400`), so `rochester` can be the slug. |
| `12` section 4 point 3 | Welland's "no parcel fabric" statement becomes out of date only if the NPCA layers are cleared | It is out of date regardless: the city serves its own fabric. |
| `10` section 7 question 5 | NPCA clearance decides whether the Welland wording is revisited | Same point. Question 5 still governs the MPAC-derived layer only. |
| `11` `LG-118`, `LG-054`, `LG-004`, `LG-097` | see above | Update wording and evidence level after the owner approves. Do not edit before then. |
| `07` roster, Rochester | catalog type `socrata`; DCAT licence field holds HTML | ArcGIS Hub; licence text points to `data.cityofrochester.gov/pages/terms` (page not read in full). |
| `07` roster, Rochester | 12 historical snapshots 1996-2024 | Live: 11 spatial snapshots 2014-2024 on `server2`, plus tabular snapshots 1996, 2000, 2004, 2008, 2012; the two float-stored tables cannot be joined by id. |
| `07` roster / `09` catalog, Rochester | "vacant property", permits and business datasets on the portal | Only a vacant-land layer (4,728) exists. No permits, violations or licences in the DCAT feed. |
| `09` catalog, Rochester vacant land | 4,730 records | 4,728 live. |
| `07` roster, Welland | origin server down 2026-08-22; use the Hub cache | Origin server answers today. |
| `07` roster, Welland | recommended as the test municipality "for method calibration" | Still true and stronger: two registers, a parcel fabric, an address point key and zoning. |
| `11` note on Welland licences | "licence records are not public" | Confirmed, and the aggregate table is empty today. |

## Proposed sub-issues for NIA-24 (e)

**None created.** For the owner to approve. G2 has no numbered acceptance checks in the Linear milestone text ("join keys and crosswalks demonstrated on a chosen pilot slice; fixtures merged"). The check labels below are this study's proposal: **G2-a** key mapping approved per pilot place; **G2-b** crosswalk demonstrated with graded exactness; **G2-c** refusals stamped correctly (`not_joined`, `not_in_coverage`, and `not_licensed` only for sources still refused on licence; MPAC is not one); **G2-d** fixtures merged (PR #13 or replacement); **G2-e** ledger and concepts reconciled with live reads.

- [ ] **Welland parcel fabric: licence and admission check** — find terms for `IMS_Parcels_Public_Cache`, ask the city if it is meant for public reuse, record a verdict. Lane: **claude**. Depends on: none. Supports **G2-c**.
- [ ] **Amend spine doc and fixtures for Welland parcel grain** — replace "no parcel fabric" wording; add a parcel-grain Welland fixture beside the footprint one. Lane: **cursor cloud**. Depends on: the item above and open decision 1. Supports **G2-d**.
- [ ] **Rochester spine key spec and fixture** — write the `hm:us:ny:rochester:parcel:{SBL20}` rule, the duplicate-id fold rule and a fixture using a real-shaped id. Lane: **cursor cloud**. Depends on: open decisions 2 and 3. Supports **G2-a**, **G2-d**.
- [ ] **Monroe swis crosswalk table** — build the 32-name to 6-digit-SWIS table from the `countysbl` prefixes (read-only, no owner fields) and check the 26 city-prefixed rows with null `swis`. Lane: **codex**. Depends on: none. Supports **G2-b**.
- [ ] **SBL and print-key normaliser with tests** — SBL20 validator, SWIS6+SBL20 composer, padded/unpadded print-key renderer; refuse float input. Lane: **codex**. Depends on: the two items above it in this list (crosswalk, key spec). Supports **G2-a**, **G2-b**.
- [ ] **Welland join harness** — read-only script that runs the six Welland joins (Parcel_No FK, AddId, centroid in parcel, centroid in zone, NEI address text, NEI spatial) on full populations with count queries and writes a join-rate CSV. Lane: **codex**. Depends on: none for the FKs; the licence check for any storing of results. Supports **G2-b**.
- [ ] **Welland address normaliser and register linkage measurement** — normalise abbreviations, ranges and units; measure NEI-to-civic and directory-to-civic hit rates; re-measure the documented 29% NEI-directory overlap. Lane: **cursor cloud**. Depends on: the join harness. Supports **G2-b**.
- [ ] **Spatial-join grading spec** — centroid vs representative point vs area overlap; rules for overlapping zoning, straddling footprints and one-to-many parcel-to-premises; what grade each earns. Lane: **claude**. Depends on: none. Supports **G2-b**.
- [ ] **Rochester historical id repair** — determine whether the 1996-2012 float-stored SBL tables can be rebuilt (address, house number, `SBL_ID` shape) and how much of `ParcelHistory` lineage covers changes; otherwise mark those years `not_joined`. Lane: **claude**. Depends on: none. Supports **G2-b**, **G2-c**.
- [ ] **Rochester permits, violations and business licences hunt** — search the Hub's linked services, Kiva web map layers, Monroe and NYS open data for any queryable source; else stamp `not_in_coverage`. Lane: **kiro**. Depends on: none. Supports **G2-c**.
- [ ] **Owner and PII field register for pilot layers** — machine-readable list of fields per layer (`OWNERNME1`, `PSTLADDRESS`, `PRIMARY_OWNER`, `Owner_Class`, `Comment`, directory contacts) with tier proposals under D-13; no values sampled. Lane: **copilot**. Depends on: none. Supports **G2-c**.
- [ ] **Ledger and concept reconciliation proposal** — draft the new ledger rows and concept gaps listed in section (c) as an appendable CSV and a diff of wording for `10`, `11`, `12`; edits land only after approval. Lane: **claude**. Depends on: open decisions 4 and 5. Supports **G2-e**.
- [ ] **Welland and Rochester roster and catalog corrections list** — list the row-level fixes to `07` and `09` (Hub vs Socrata, snapshot list, 4,728, origin server) for a later catalog task. Lane: **copilot**. Depends on: none. Supports **G2-e**.

## Open decisions for the owner

- [ ] 1. **Welland parcel fabric.** Admit `IMS_Parcels_Public_Cache` as the Welland parcel grain (licence text not found), or keep Welland at address and footprint grain until the city confirms?
- [ ] 2. **Rochester local token.** SBL20 (recommended) or print key?
- [ ] 3. **Rochester and Monroe slugs.** `rochester` for the city (recommended, because `countysbl` carries the SWIS) and a rule for other Monroe municipalities, or `monroe` for all until a SWIS table exists?
- [ ] 4. **Address-point id and footprint id.** New joining concepts, or map to existing ones (`civic_address`, `publisher_row_id`)?
- [ ] 5. **Ledger edits.** Approve appending new rows and correcting `LG-004`, `LG-054`, `LG-097`, `LG-118` in a later task?
- [ ] 6. **Welland footprint key.** Mint from geometry, or wait for a publisher id?
- [ ] 7. **Owner-bearing Rochester layers.** Prefer the live `Tax_Parcels_Open_Data` layer (no owner fields) over `TaxParcel2024` for the spine, and treat owner fields as D-13 presentation-tier?
- [ ] 8. **Welland `IMS_Parcels`.** Confirm it is not an ingest candidate (it carries `Owner_Class` and free-text fields).
- [ ] 9. **DataROC terms.** Read and record the terms page before any ingestion.
- [ ] 10. **Snapshot years.** How far back must Rochester snapshots join for G2 (2014-2024 join by `PARCELID`; earlier years do not)?

## Resume notes

- **What is done.** Phases 1 to 3 are complete. Three comments are on NIA-24. The two new files are in place and indexed.
- **Not read, for a later pass.** Welland Old Zoning (2,014 in the catalog), Environmental Protection and Control layers, Official Plan layers, `Base/Con_Zoning`, `CityView/CityView_Map`; the Region `Building_Footprints` Welland subset; Rochester overlay (26) and preservation (10) districts counts, `Kiva` layers, `Commercial_Corridor` data, `ROC_Zoning` layer 0; Monroe `swis` code table; the DataROC terms page; NYS layer `ROLL_YR` distinct values (the query timed out); NPCA layers (rule: not ingested).
- **Sample sizes.** Join ratios came from 12 to 45 records per test. Re-run on full populations with count queries before quoting a rate.
- **Method.** Field lists from `?f=json`; counts with `returnCountOnly=true`; distinct counts with `returnDistinctValues=true&returnCountOnly=true`; samples with `resultRecordCount<=5`. Statewide-layer queries are slow (30 to 60 seconds).
- **Endpoint quirks.** Welland `serverprod` (not `serverprodpub`) folders `Building` and `PropReports` return Token Required. `niagaraopendata.ca` CKAN API returned a Cloudflare challenge (403) on 2026-09-30; the Region ArcGIS service was used instead.
- **Rule reminders.** MPAC/NPCA data usable under HARD-RULES 4/5 (amended 2026-10-17, #61) (MPAC roll `not_joined` until a join is accepted); owner, legal description and personal info screened at publish. No owner values sampled. UK out of scope. Nothing published.
- **Files.** `heavymap-planning/EPIC-02-spine-and-joins.md` (this file); `Spreadsheets/15-pilot-join-matrix-welland-rochester.csv`; two rows appended to `Spreadsheets/00-PLANNING-INDEX.csv`.
