---
run: CR-002
place: us-ca-0622412-el-segundo
place_type: city
country: us
subdivision: ca
county: los-angeles
city: el-segundo
method: 0.2
stage: D
type: working-paper
evidence_date: 2026-11-19
---
Run log: El Segundo public data run
working-paper, el-segundo, run-log, run-2

> The run's own log, one line per step, published as written and updated as the run goes.

One line per step, newest last. Times are Eastern. Linear is out of use, so this log replaces its stage comments. Evidence labels follow the method's section 8: every fact has a URL and access date; `live read` or `documented, not re-read`.

## Setup

- **2026-11-18 23:18.** Run CR-002 opened. Method v0.1. Place id `us-ca-el-segundo` (provisional). Worktree and branch `cr-002-us-ca-el-segundo`. Working papers will be published on the Journey under "Working papers: El Segundo".

## Stage A: Prepare

- **2026-11-18 23:10. WU-01, Hamilton retro.** Completed. Four lessons recorded earlier today (LL-001 licences late, LL-002 one sweep is not enough, LL-003 layer indices drift, LL-004 infrastructure stopped at the city line). The 13 archetype rows marked "to backfill" are now filled from Hamilton's evidence; four stay "not checked in Hamilton" (development applications, industrial land inventory, contaminated sites, and the port).
- **2026-11-18 23:15. WU-02, predictions.** 22 predictions written, one per archetype (PR-001 to PR-022), **before any search for El Segundo**. Nothing about El Segundo was looked up in this session before this line. Average stated confidence 0.66. See `PREDICTIONS.md`.
- **Next.** Stage B: WU-03 duty by tier grid, then WU-04 channel fingerprinting, written to `PUBLISHERS.md`.

## Stage B: Map

- **2026-11-18 23:27.** Started WU-03 and WU-04. First searches and live reads. Web text treated as data; no injection signals met.
- **23:27.** Census gazetteer read live: El Segundo place GEOID **0622412**. Place folder renamed `us-ca-0622412-el-segundo`.
- **23:27.** FAIL RF-001. City website (elsegundo.gov) returns 403 to automated clients. Recorded, not worked around (SP-004).
- **23:28.** Los Angeles County: two Hub front doors, 1,109 and 966 datasets, 950 shared (SP-001). Parcel layer fields include `AIN`, `SitusCity`, `TaxRateCity`.
- **23:28.** State and federal catalogues read: State Geoportal 4,019 datasets, energy commission 202, BTS/NTAD 142, Caltrans 80. FAIL RF-004, RF-005. EnviroStor and GeoTracker download pages 403; EnviroStor export also on the Geoportal.
- **23:29.** Southern California Edison distribution planning hub: 47 datasets (substations, transmission circuits, hosting capacity). FAIL RF-003, RF-002. Sanitation Districts page 403. City's second domain (elsegundo.org) 403.
- **23:29.** ArcGIS Online search for "El Segundo": the City's GIS organisation found, with a Hub site. Decoy found: a Colombian "Segundo Semestre" layer (SP-003).
- **23:29.** City ArcGIS server: 73 services; City Hub: 55 items (SP-010 seen again). `Target_Hazards` flagged sensitive (H6, RF-009).
- **23:30.** FAIL RF-006. FEMA flood hazard service: connection failure twice. To re-check in stage C.
- **23:35.** `PUBLISHERS.md` written: 25 duties, holders and doors. Exit test met for 24 of 25 duties (gas and pipelines open: FAIL RF-007; airport, water and gas utility not fingerprinted: RF-008).
- **23:50.** Run failures register opened (owner request): every failure of this run gets an RF- row with kind, severity, revisit priority (P0 to P3, owner-adjustable), retry rule and status. Stage B failures are RF-001 to RF-009; Hamilton's carried-forward failures are RF-010 to RF-013.
- **23:55.** Method v0.2 adopted by the owner (MC-002, D-094): run failures register in every stage.

## Stage C: Enumerate

- **23:46.** Sweep A: every stage B door enumerated in full; 617 title-screened candidates across 9 publishers. Sample of 60 (seed 20261119): precision 0.43, about 267 relevant.
- **23:47.** Sweep B: 15 duty-driven searches, without consulting A. 24 distinct public datasets; documents, PDFs, commercial and restricted finds recorded separately.
- **23:48.** Overlap: 15 of B's 24 in A (two automatic matches corrected by hand). FAIL RF-015 to RF-019: five doors found only by B (Census, county planning server, air district portal and emissions, EPA risk management plans, GeoTracker without a second door).
- **23:48.** Capture–recapture: about 427 (Lincoln–Petersen), 418 (Chapman). Two sweeps hold roughly two thirds. Rough: B small, not fully independent.
- **23:49.** City boundary is a line, not a polygon (SP-013); closed into a polygon for filtering.
- **23:49.** County narrowing test on the assessor parcel layer: tax-rate city 5,459, all inside the boundary; situs city 5,091; 370 city parcels with blank situs (349 single space, 21 null). FAIL RF-020, resolved by using tax-rate city; lesson LL-005.
- **23:50.** Count sprints on 18 city services (parcels 5,499; zoning 440 to 460 in three versions; General Plan two versions; 109 oil wells; 23 developments).
- **23:58.** `STAGE-C.md`, `SWEEP-A.csv`, `SWEEP-B.csv` written. Exit test: sweeps and estimate done; discovery curve not yet flat (four new doors to enumerate in stage D).

## Stage D: Screen

- **2026-11-19 00:24.** Four new doors enumerated: county public GIS server (28 folders; Hazards has tsunami zones and floodplain copies), AQMD hub (47), Census TIGER, EPA risk management plans. About 8 to 10 new relevant layers: discovery slowing.
- **00:25.** RF-006 (FEMA) now has an official second door: the county's floodplain copies. FEMA itself still to retry.
- **00:25.** Licences read per publisher. FAIL RF-021: the state energy commission prohibits commercial use (owner decision). FAIL RF-022: no licence on any City Hub item. FAIL RF-023: County terms page renders only in a browser (SP-002). FAIL RF-024: AQMD and City of Los Angeles terms not yet read.
- **00:26.** Zoning and General Plan versions settled: `Zoning_Update` (edited 2026-03-06) is current; General Plan edited 2021-08-12. Industrial codes M-1, M-2, Smoky Hollow, CO and three specific plans (SP-014).
- **00:28.** Synonyms LG-119 to LG-126 added to the ledger.
- **00:30.** Screen of 633 candidates: 408 relevant by rule; hand sample of 40 gives precision 0.63 (FAIL RF-025, rule quality). 88 infrastructure-sensitive, 58 with possible personal fields.
- **00:32.** Catalogue written: `Spreadsheets/09-catalog-us-ca.csv`, 409 rows, the first per-state file. `STAGE-D.md` and `SCREEN.csv` written.
- **Next.** Stage E: profile and connect the priority slice (parcels, zoning, General Plan, specific plans, permits and developments, businesses, rail, truck routes, ports, airport, power, flood and hazards), build the join graph, and propose parcel associations.
