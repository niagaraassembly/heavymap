---
run: CR-002
place: us-ca-0622412-el-segundo
place_type: city
country: us
subdivision: ca
county: los-angeles
city: el-segundo
method: 0.1
stage: B
type: working-paper
evidence_date: 2026-11-18
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
- **23:27.** City website (elsegundo.gov) returns 403 to automated clients. Recorded, not worked around (SP-004).
- **23:28.** Los Angeles County: two Hub front doors, 1,109 and 966 datasets, 950 shared (SP-001). Parcel layer fields include `AIN`, `SitusCity`, `TaxRateCity`.
- **23:28.** State and federal catalogues read: State Geoportal 4,019 datasets, energy commission 202, BTS/NTAD 142, Caltrans 80. EnviroStor and GeoTracker download pages 403; EnviroStor export also on the Geoportal.
- **23:29.** Southern California Edison distribution planning hub: 47 datasets (substations, transmission circuits, hosting capacity). Sanitation Districts page 403. City's second domain (elsegundo.org) 403.
- **23:29.** ArcGIS Online search for "El Segundo": the City's GIS organisation found, with a Hub site. Decoy found: a Colombian "Segundo Semestre" layer (SP-003).
- **23:29.** City ArcGIS server: 73 services; City Hub: 55 items (SP-010 seen again). `Target_Hazards` flagged sensitive (H6).
- **23:30.** FEMA flood hazard service: connection failure twice. To re-check in stage C.
- **23:35.** `PUBLISHERS.md` written: 25 duties, holders and doors. Exit test met for 24 of 25 duties (gas and pipelines open).
- **Next.** Stage C: two independent sweeps (A: every door above, enumerated; B: duty-driven search without looking at A), capture–recapture estimate, count sprints, and the county narrowing test.
