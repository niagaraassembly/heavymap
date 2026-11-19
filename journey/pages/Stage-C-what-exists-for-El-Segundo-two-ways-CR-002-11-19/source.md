---
run: CR-002
place: us-ca-0622412-el-segundo
place_type: city
country: us
subdivision: ca
county: los-angeles
city: el-segundo
method: 0.2
stage: C
type: working-paper
evidence_date: 2026-11-18
---
Stage C: what exists for El Segundo, two ways (CR-002)
working-paper, el-segundo, enumeration, stage-c, run-2

> Stage C of the El Segundo run: two independent sweeps for the city's public data, an estimate of how much is still hidden, record counts, and a test of whether county data can be narrowed to one city at the source. Published as written.

Run CR-002, method v0.2, stage C: WU-05 (two independent sweeps and a capture–recapture estimate) and WU-07 (count sprints), plus the run's own goal: can county datasets be narrowed to the city at the source? Live reads 2026-11-19 04:46 to 04:51 UTC. Raw responses kept locally, not published. Lists: `SWEEP-A.csv`, `SWEEP-B.csv`.

## 1. Sweep A: every door from stage B, enumerated

Every publisher door found in stage B was listed in full (REST directories, Hub DCAT feeds, Socrata discovery, the county permitting server) and screened by title against the 25 duties. The city's REST services and Hub items were merged by name, the county's two Hubs by identifier, and layers covering only unincorporated county land were set aside (3). The city's `Target_Hazards` service was excluded (held, H6).

- **617 candidates** across 9 publishers: State Geoportal 239, Los Angeles County 158, energy commission 62, BTS/NTAD 47, City of El Segundo 36, Caltrans 29, Southern California Edison 23, SCAG 16, Port of Los Angeles 7.
- Title screening is loose by design. On a fixed random sample of 60 (seed 20261119), **26 were relevant data layers covering El Segundo**: precision 0.43, so sweep A holds about **267 relevant datasets**. Examples of noise: grouse hunting zones, time zones, a defaulted property tax layer matched by "fault".

## 2. Sweep B: one search per duty, without looking at A

Fifteen duty-driven web searches (parcels; zoning and General Plan; permits; flood and coastal zone; contaminated sites; rail; truck routes; pipelines; electricity; airport; businesses; sewer and storm; seismic; air; specific plans). Results were sorted into machine-readable public datasets (counted), documents and PDFs, commercial lists, and restricted data (recorded, not counted).

- **24 distinct datasets** found by sweep B.
- **15 of them were also in sweep A** (two automatic matches were corrected by hand: one false match, one true match with the wrong evidence).
- **9 were found only by B**: Sanitation Districts parcels with a 2022 roll; the county General Plan 2035 freight and passenger rail layer; Census TIGER/Line for Los Angeles County (railroads); energy commission electric substations; refinery boundaries (publisher not yet identified); the air district's annual emissions inquiry and its GIS open data portal; US EPA risk management plan facilities; the Water Boards' GeoTracker.
- Most of B's extra finds sit behind doors stage B never enumerated: the Census, the county planning department's server, the air district's portal, EPA's risk management plans. Each is a failure row (RF-015 to RF-019).
- Also met in B and not counted: city PDFs (zoning map, General Plan map, cumulative projects list, Smoky Hollow Specific Plan), a state pipeline database held internally by the State Fire Marshal, utility statements that substation detail can be sensitive, and commercial lists (business directories, a deep tech map).

## 3. Capture–recapture estimate

With n1 = 267 (sweep A, precision-adjusted), n2 = 24 and m = 15:

- Lincoln–Petersen: 267 × 24 ÷ 15 ≈ **427** relevant datasets.
- Chapman (less biased for small samples): (268 × 25 ÷ 16) − 1 ≈ **418**.

So the two sweeps together hold about 276 of an estimated 420, roughly **two thirds**. The estimate is rough: sweep B is small, leans towards infrastructure and hazards, and was not fully independent (stage B had already shown the doors). Its main use is the list of what A missed, and why.

## 4. Can county data be narrowed to the city? (run goal)

Tested on the county assessor's parcel layer (Public Works GIS, `GIS_Web_Services/MapServer/2`), live counts:

| Filter | Parcels |
|---|---|
| Whole county | 2,433,681 |
| `TaxRateCity` = EL SEGUNDO | 5,459 |
| `SitusCity` = EL SEGUNDO | 5,091 |
| Intersects the city boundary | 5,483 |
| Wholly inside the city boundary | 5,450 |
| Tax-rate city EL SEGUNDO and inside the boundary | 5,459 of 5,459 |
| Situs city EL SEGUNDO and inside the boundary | 5,089 of 5,091 |

Findings:

1. **Narrowing at the source works** for this layer, by attribute and by geometry. El Segundo is 0.22% of the county's parcels; no county-wide download is needed.
2. **Filter by tax-rate city, not by situs city.** 370 parcels in the city have no situs address: 349 store a single space for blank (the same convention as Hamilton's quirk Q-008) and 21 are empty. These are the parcels most likely to be refinery, rail, utility and large industrial land. A filter on the address city drops exactly the land HeavyMap cares about most.
3. **The postal city spills over the city limit**, slightly: 2 parcels with an El Segundo situs address are in the City of Los Angeles (prediction PR-003 expected this).
4. **The city's own boundary is published as a line, not a polygon** (one closed LineString of 249 points). It had to be closed into a polygon before it could filter anything.

## 5. Count sprints (WU-07), City of El Segundo services

| Service | Records |
|---|---|
| City parcels (`COES_Parcels`) | 5,499 |
| City copy of county parcels (`LACO_Parcels`) | 14,162 (extends beyond the city) |
| Zoning (`Zoning`, `Zoning_Update`, `COES_zoning`) | 460, 440, 441 |
| General Plan (`General_Plan`, `GeneralPlan`) | 441, 453 |
| Specific plans (`COES_Specific_Plans`; Smoky Hollow) | 77; 42 |
| Developments | 23 |
| Address points | 9,137 |
| Building outlines (service named 2017, layer named 2020) | 7,967 |
| OpenGov building records (standalone; in the OpenGov layer set) | 7,320; 16,930 |
| Oil wells (in the OpenGov layer set) | 109 |
| Deep tech businesses (two layers) | 50; 35 |
| Utilities | 9 |
| LAX noise contours (latest quarter) | 3 |
| Street centreline | 881 |

Notes: several versions of zoning and the General Plan coexist, and the city parcel count (5,499) is 40 higher than the county's tax-rate city count (5,459). Stage D decides which version is current; stage E profiles the priority slice.

## 6. Exit test for stage C

Two sweeps done: yes. Capture–recapture estimate reported: yes. Discovery curve flat on main channels: not yet; four doors found by sweep B are still to enumerate in stage D.
