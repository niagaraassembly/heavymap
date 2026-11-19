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
Stage D: screening what El Segundo's public data is worth using (CR-002)
working-paper, el-segundo, screening, licences, stage-d, run-2

> Stage D of the El Segundo run: which of the city's public datasets are relevant, what each publisher's licence allows, which layers are sensitive, and which zoning and General Plan layers are current. Published as written.

Run CR-002, method v0.2, stage D: enumerate the doors stage C added, then screen every candidate for relevance, licence (WU-09) and sensitivity, and gather the local terms (WU-08). Live reads 2026-11-19 05:24 to 05:27 UTC. Full screen: `SCREEN.csv`. Catalogue rows: `Spreadsheets/09-catalog-us-ca.csv` (the first per-state catalogue file).

## 1. The doors stage C added

- **Los Angeles County public GIS server** (`public.gis.lacounty.gov`): 28 folders. Regional Planning holds 35 services (among them biotech and biomedical companies, landlocked parcels, renewable energy projects, Green Zones layers). The county's dynamic Hazards service holds 18 layers, including **tsunami inundation zones** and the county's own copies of the **100- and 500-year floodplains**: an official second door while FEMA's own service stays unreachable.
- **South Coast AQMD open data hub** (`data-scaqmd-online.opendata.arcgis.com`): 47 items, including modelled residential air-toxics cancer risk on a grid (the MATES study).
- **US Census TIGER** and **EPA risk management plans**: reachable.

These four doors add about 8 to 10 relevant layers against roughly 276 already held: discovery is slowing but has not stopped.

## 2. Relevance

633 candidates screened by written rules (duty, exclusion words, coverage hints): **408 relevant**, 54 context, 171 not relevant. A hand check of 40 relevant rows (seed 1119) found 25 truly relevant: **precision 0.63**, so about 255 relevant layers, consistent with stage C's estimate of 267. The rules let through county layers for unincorporated areas and other places (county sewer mains, wildfire damage inspections, landlocked parcels). Hand-checked rows are marked in the catalogue; the rest say `screened_by_rule`.

Relevant layers by duty: electricity 55, roads and trucks 43, parcels 36, rail 34, oil and gas 26, buildings 21, flood 20, businesses 19, ports 19, zoning 18, water and sewer 16, contaminated sites 16, permits and development 15, airport 13, seismic 11, air 10, General Plan 9, specific plans 8, coastal 8, noise 6, addresses 5.

## 3. Licences (WU-09)

| Publisher | Licence as found | Status |
|---|---|---|
| City of El Segundo (Hub, 55 items) | none stated on any item | unclear |
| Los Angeles County | "for informational purposes" disclaimer; terms page renders only in a browser | unclear |
| SCAG | preliminary data, consult each jurisdiction | unclear |
| California Energy Commission | conditions of use **prohibit commercial or profit-making use** | **restricted** |
| Southern California Edison | none on 39 of 47; accuracy disclaimer on 8 | unclear |
| BTS/NTAD, US Census, US EPA | US government work, not copyrighted | open |
| Caltrans, State Geoportal | CC BY 4.0 on some items, disclaimers on others | per item |
| South Coast AQMD, City of Los Angeles | terms page linked, not yet read in full | to read |

Of the 408 relevant layers: 191 unclear, 91 per item, 80 open, 37 restricted, 9 to read. The restricted energy commission layers (power plants, transmission lines, substations) are not recorded as usable; that needs the owner's decision (RF-021). Federal infrastructure layers are the likely alternative.

## 4. Sensitivity

- **Infrastructure (88 layers):** substations, transmission and subtransmission circuits, pipelines, wells, refinery boundaries, hazardous facilities. Rule: show existence and distance to a parcel; never compile vulnerability detail (H6).
- **Personal fields possible (58 layers):** business, permit and assessor layers. Rule: field names only; screen owner and contact fields at publish (H1).
- **Held:** the City's `Target_Hazards` service (H6), as in stage B.

## 5. Which zoning and General Plan are current

The City's server carries three zoning services and two General Plan services (pattern SP-014).

- **Zoning:** `Zoning_Update`, last edited **2026-03-06**, matching the City's "Zoning Map 2026 (Updated March 2026)". 440 polygons, 34 codes. Current.
- **General Plan:** `General_Plan`, last edited 2021-08-12, field `ESGPLANAME`, 30 designations.

Industrial land in the City's own terms: zones **M-1 Light Manufacturing** (11 polygons) and **M-2 Heavy Manufacturing** (2), **Smoky Hollow East and West** (20 and 18), **CO Corporate Office** (11), and the corporate campus, south campus and aviation specific plans; General Plan **LIGHT INDUSTRIAL** (13), **HEAVY INDUSTRIAL** (3), **SMOKY HOLLOW** (38). The name field writes "HeavyManufacturing" without a space, and P-F appears both as a code and as a name.

## 6. Local terms (WU-08)

Eight rows added to the synonym ledger (LG-119 to LG-126): AIN and APN (parallel to Ontario's roll number), tax-rate city (the reliable city filter), situs city (a false friend for selecting a city), General Plan (Ontario's Official Plan), Specific Plan (secondary plan), M-1 and M-2, Smoky Hollow (the nearest parallel to Hamilton's employment lands), and tax rate area.

## 7. Exit test for stage D

Every find has relevance, a licence status (or "unclear") and a sensitivity flag: yes, by rule, with a measured precision. Open: the energy commission licence (owner decision), the City and County terms (a human read), and the AQMD and City of Los Angeles terms.
