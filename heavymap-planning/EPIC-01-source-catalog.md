# EPIC 1 — Source catalog and coverage

**Linear:** [NIA-23](https://linear.app/niagaraassembly/issue/NIA-23/epic-1-source-catalog-and-coverage) · **Gate:** G1, pass1 catalog signed off by Morgen · **Owner:** Morgen
**Drafted:** 2026-09-30 by Chief of Staff from the files in this folder. This is a living doc: update the tables and tick the boxes as work lands, and update the matching row in `00-PLANNING-INDEX.csv`.

## What this epic is

The full list of datasets by jurisdiction and layer family, with access method, format, refresh rate, licence and gaps. Prior recon and the MCS are baselines, not a backlog. UK is capability glean only. No NPCA-derived or MPAC-derived parcel layers.

**Geography v1.** Canada: Niagara Region and its 12 lower-tier municipalities, Hamilton, Haldimand, Norfolk (Port Dover), Brantford, Brant. United States: Chautauqua, Cattaraugus, Erie, Niagara, Wyoming, Genesee, Orleans, Monroe. Halton and Burlington are out of core.

## Where things stand

- The roster covers 32 jurisdictions. 31 are at `pass1_done`; only Port Dover is `not_started`, and it may stay that way because it has no data of its own.
- The dataset catalog has 4,020 rows across counties, municipalities and cross-cutting regional sources. The MCS (82 rows) is a verified subset of it.
- Nothing beyond those original 82 rows has been promoted into the MCS. Promotion is one dataset at a time with a Morgen review.
- Pass1 sign-off on NIA-10 is the G1 gate and it is Morgen's call.

## Issues in this epic

- [ ] **NIA-10** Jurisdiction roster v1 (In Progress). Roster and catalog are built. Left: Morgen's pass1 sign-off, then close or fold into this doc.
- [x] **NIA-18** Field-verify Brantford, Brant, Norfolk (Done 2026-09-23)
- [x] **NIA-19** Monroe County folder drill (Done 2026-09-23)
- [x] **NIA-21** Probe untouched dig targets plus Burlington recheck (Done 2026-09-25)
- [ ] **NIA-12** Fold dig findings into MCS coverage and gap rows (Backlog). The four gap rows already had roster notes appended on 2026-09-23. Left: decide whether that covers it, or what else the handoff needs after sign-off.
- [ ] **NIA-20** Catalog backlog (Backlog, Low). See the checklist below. Items 7 and 8 look already done by NIA-21 and the issue text is stale.

## Canada — jurisdiction status

| Jurisdiction | Tier | In v1 | Catalog | Dig | Band | Note |
|---|---|---|---|---|---|---|
| Niagara Region | region | yes | arcgis | pass1_done | P0 | Source of the Consolidated NEI covering all 12 municipalities. |
| Town of Fort Erie | lower-tier | yes | ckan | pass1_done | P1 | Nothing industrial published. |
| Town of Grimsby | lower-tier | yes | none | pass1_done | P1 | No portal; covered only via regional NEI. |
| Town of Lincoln | lower-tier | yes | static | pass1_done | P1 | Shapefile-only, no REST service. |
| City of Niagara Falls (ON) | lower-tier | yes | arcgis | pass1_done | P0 | Richest CA publisher (329 datasets). |
| Town of Niagara-on-the-Lake | lower-tier | yes | ckan | pass1_done | P1 | One dataset; effectively absent. |
| Town of Pelham | lower-tier | yes | none | pass1_done | P1 | No portal; covered only via regional NEI. |
| City of Port Colborne | lower-tier | yes | none | pass1_done | P1 | No portal; covered only via regional NEI. |
| City of St. Catharines | lower-tier | yes | arcgis | pass1_done | P0 | Parcel-complete (about 44k parcels). |
| City of Thorold | lower-tier | yes | none | pass1_done | P1 | No portal; covered only via regional NEI. |
| Township of Wainfleet | lower-tier | yes | none | pass1_done | later | No portal; smallest NEI count. |
| City of Welland | lower-tier | yes | arcgis | pass1_done | P0 | Suggested engine-test municipality. |
| Township of West Lincoln | lower-tier | yes | none | pass1_done | later | No portal; covered only via regional NEI. |
| City of Hamilton | single-tier | yes | arcgis | pass1_done | P0 | 463 datasets, field-verified. |
| Haldimand County | single-tier | yes | arcgis | pass1_done | P0 | 425 items, field-verified. |
| City of Brantford | single-tier | yes | arcgis | pass1_done | P0 | Field-verified (NIA-18); licence page is JS-rendered, verbatim terms not captured. |
| County of Brant | county | yes | arcgis | pass1_done | P0 | Field-verified (NIA-18); CC0; `sm.brant.ca` currently unreachable. |
| Norfolk County | single-tier | yes | arcgis | pass1_done | P0 | Field-verified (NIA-18); parcels carry roll-number join key. |
| Port Dover | place | edge | none | not_started | later | Not a jurisdiction; derive by spatial clip of Norfolk data. |
| Regional Municipality of Halton | region | out | unknown | pass1_done | later | Out of core; no regional portal. |
| City of Burlington | lower-tier | out | static | pass1_done | later | Out of core; live 403 confirmed (NIA-21). |

## United States — jurisdiction status

| Jurisdiction | Tier | In v1 | Catalog | Dig | Band | Note |
|---|---|---|---|---|---|---|
| Erie County | county | yes | static | pass1_done | P0 | 370k parcels field-verified. |
| City of Buffalo | place | yes | socrata | pass1_done | P0 | 51 own datasets scanned. |
| Niagara County | county | yes | arcgis | pass1_done | P0 | 94k parcels; some services return Token Required on re-check. |
| City of Niagara Falls (NY) | place | yes | none | pass1_done | P1 | No dedicated portal. |
| Chautauqua County | county | yes | arcgis | pass1_done | P1 | In NYS statewide parcel layer. |
| Cattaraugus County | county | yes | arcgis | pass1_done | P1 | Not in statewide layer; own portal is fee-based. Sourcing decision open (NIA-20 #4). |
| Wyoming County | county | yes | arcgis | pass1_done | P1 | In NYS statewide parcel layer. |
| Genesee County | county | yes | arcgis | pass1_done | P1 | Statewide layer plus own Hub. |
| Orleans County | county | yes | unknown | pass1_done | P1 | Not in statewide layer; no bulk source found. Sourcing decision open (NIA-20 #5). |
| Monroe County | county | yes | arcgis | pass1_done | P0 | 268k parcels with assessed value; folder drill done (NIA-19). |
| City of Rochester | place | yes | socrata | pass1_done | P0 | Best-evidenced jurisdiction; 12 historical snapshots. |

## NIA-20 backlog, restated

Items 7 and 8 are covered by NIA-21 (Done). Row counts in items 2 and 3 predate the v8 and v9 catalog updates, so recount before working them.

- [ ] 1. Owner-PII field check for Genesee Hub parcels, Haldimand `ParcelsOnlinePublic`, Brant `Parcels`, Norfolk `Parcels` (a NIA-18 note says none of Brantford, Brant and Norfolk carry an owner-name field; confirm the rest)
- [ ] 2. Field-verify the `reviewed_relevant` rows in the catalog
- [ ] 3. Manual review of the `reviewed_unclear` rows
- [ ] 4. Cattaraugus: flat bulk licence versus per-parcel fee (needs a call to the county)
- [ ] 5. Orleans: does Beacon/SDG offer a bulk or API tier
- [ ] 6. Ontario-wide MPAC parcel ownership: accept the gap or pursue a paid route (Morgen decision)
- [x] 7. Untouched dig targets (done under NIA-21)
- [x] 8. Burlington status recheck (done under NIA-21)
- [ ] 9. MCS promotion pass, one dataset at a time
- [ ] 10. Apply the join-method taxonomy (J1 to J6) to datasets found in the new catalog

## Open decisions for Morgen

- [ ] Pass1 sign-off on the roster (closes G1).
- [ ] Sourcing route for Cattaraugus and Orleans parcels (see `08` alternatives sheet: statewide layer, county GIS, Regrid, FOIL, Beacon bulk check, OSM proxy).
- [ ] Ontario parcel ownership: accept the MPAC gap for v1?
- [ ] NPCA's MPAC-derived parcel fabric: does its OGL v2 statement actually cover HeavyMap's use? (`12` section 4, and question 5 in `10`.)
- [ ] Whether NIA-10 is closed at sign-off, with follow-on work living under this epic.

## Suggested next steps

1. Morgen signs off pass1 (or lists what is missing).
2. Close NIA-10; keep NIA-12, NIA-20 open under this epic.
3. Pick the pilot jurisdictions that will prove G2 and G3 (Welland and Rochester are the best evidenced, per `07`).
4. Start NIA-20 items 1 and 10 first, since both should precede any ingestion decision.

## Files this epic draws on

| File | Kind | What it holds |
|---|---|---|
| `07-jurisdiction-roster-v1.csv` and `.md` | roster | 32 jurisdictions, portals, dig status. The CSV is the source of truth for tooling. |
| `08-parcel-contextual-dataset-assessment.xlsx` | assessment | Per-dataset quirks and sourcing alternatives |
| `09-per-jurisdiction-dataset-catalog.xlsx` | catalog | Exhaustive per-jurisdiction dataset catalog (4,020 rows) |
| `../Spreadsheets/02-dataset-inventory-v4.xlsx` | MCS | Master record of admitted datasets |
| `10`, `11`, `12` in this folder | planning | Joining concepts, synonym ledger, authority scale proposals |
