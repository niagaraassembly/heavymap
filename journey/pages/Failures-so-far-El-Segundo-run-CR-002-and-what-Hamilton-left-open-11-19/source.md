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
Failures so far: El Segundo run (CR-002), and what Hamilton left open
working-paper, el-segundo, failures, run-2

> What did not work in the El Segundo run so far, and what Hamilton left open: refusals, timeouts and gaps, each with a priority for the runs that follow. Published as written.

Every step of a run that did not get what it went for is written down the moment it happens, with what was tried, what came back, how much it cost (severity 1 to 5), how much the next runs should focus on it (revisit priority P0 to P3, which the owner changes as priorities shift), how to retry without ever working around a refusal, and its status. Generated from the run failures register.

## El Segundo run

### RF-020 · method miss · County parcel narrowing by address city

- **Stage:** C · **severity:** 4 · **revisit priority:** P0 · **status:** resolved
- **Tried:** SitusCity filter (https://dpw.gis.lacounty.gov/dpw/rest/services/GIS_Web_Services/MapServer/2)
- **Result:** misses 370 unaddressed city parcels (likely industrial); tax-rate city catches all 5,459
- **What it affects:** parcels (spine)
- **Retry rule:** Always narrow county parcels by tax-rate city or geometry, never by situs city. Avoided in this run (found by test).
- **Resolution:** Tax-rate city adopted for the El Segundo slice; lesson LL-005.

### RF-001 · refused · City of El Segundo website (elsegundo.gov)

- **Stage:** B · **severity:** 3 · **revisit priority:** P1 · **status:** open
- **Tried:** GET of the city maps page and the root (https://www.elsegundo.gov/)
- **Result:** HTTP 403 to an automated client
- **What it affects:** zoning text, municipal code, truck routes, documents, business registration lists
- **Retry rule:** Never circumvent. A human may read it in a browser; ask the city for a data contact or bulk files.

### RF-006 · unreachable · FEMA National Flood Hazard Layer service

- **Stage:** B · **severity:** 3 · **revisit priority:** P1 · **status:** open
- **Tried:** GET ?f=json, two hosts, 2 attempts, 40 s timeout (https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer)
- **Result:** connection failure (no HTTP response)
- **What it affects:** floodplain (DA-010)
- **Retry rule:** Retry in stage C; then look for the NFHL on ArcGIS Online or the State Geoportal.

### RF-007 · not read · Gas and pipeline holders (federal pipeline map, gas utility, state oil and gas)

- **Stage:** B · **severity:** 3 · **revisit priority:** P1 · **status:** open
- **Tried:** named from knowledge, no door read
- **Result:** stage B exit test not met for this duty
- **What it affects:** gas and pipelines (DA-016 family)
- **Retry rule:** Read the doors in stage C; the federal pipeline map is restricted beyond a public viewer, so record that rather than seek access.

### RF-017 · method miss · South Coast AQMD GIS open data portal and annual emissions inquiry

- **Stage:** C · **severity:** 3 · **revisit priority:** P1 · **status:** open
- **Tried:** stage B read only the facility lookup page (https://www.aqmd.gov/online-services/gis-open-data)
- **Result:** door missing from sweep A
- **What it affects:** air permits, emissions
- **Retry rule:** Fingerprint the portal in stage D; check bulk export terms.

### RF-002 · refused · City of El Segundo document library (elsegundo.org)

- **Stage:** B · **severity:** 2 · **revisit priority:** P2 · **status:** open
- **Tried:** GET of a zoning map PDF (https://elsegundo.org/home/showpublisheddocument/4888/637789661500370000)
- **Result:** HTTP 403
- **What it affects:** zoning map PDF, General Plan map PDF
- **Retry rule:** Never circumvent. Same as the main site.

### RF-003 · refused · LA County Sanitation Districts maps and GIS page

- **Stage:** B · **severity:** 2 · **revisit priority:** P2 · **status:** open
- **Tried:** GET (https://www.lacsd.org/about-us/who-we-are/maps-and-gis)
- **Result:** HTTP 403
- **What it affects:** trunk sewers, treatment plants (servicing)
- **Retry rule:** Never circumvent. Check for an ArcGIS Online organisation (SP-011); the district boundary service is on ArcGIS Online.

### RF-005 · refused · State Water Board GeoTracker data download page

- **Stage:** B · **severity:** 2 · **revisit priority:** P2 · **status:** open
- **Tried:** GET (https://geotracker.waterboards.ca.gov/data_download)
- **Result:** HTTP 403
- **What it affects:** leaking tanks, cleanup sites
- **Retry rule:** Never circumvent. Look for a Water Boards export on the State Geoportal (389 Water Boards datasets there).

### RF-008 · not fingerprinted · Los Angeles World Airports; regional water district; gas utility

- **Stage:** B · **severity:** 2 · **revisit priority:** P2 · **status:** open
- **Tried:** not attempted in stage B
- **Result:** coverage gap
- **What it affects:** airport, water
- **Retry rule:** Fingerprint in stage C.

### RF-015 · method miss · US Census Bureau (TIGER/Line, place and tract geography)

- **Stage:** C · **severity:** 2 · **revisit priority:** P2 · **status:** open
- **Tried:** not enumerated in stage B; found by sweep B (https://catalog.data.gov/dataset/tiger-line-shapefile-current-county-los-angeles-county-ca-all-lines)
- **Result:** door missing from sweep A
- **What it affects:** rail (TIGER lines), census, boundaries
- **Retry rule:** Add the Census to the standing door list for every US city.

### RF-016 · method miss · Los Angeles County Regional Planning GIS server (public.gis.lacounty.gov)

- **Stage:** C · **severity:** 2 · **revisit priority:** P2 · **status:** open
- **Tried:** county Hubs enumerated, this server not (https://public.gis.lacounty.gov/arcgis/rest/services/DRP/GP2035_SUPPLEMENTAL/MapServer/6)
- **Result:** door missing from sweep A
- **What it affects:** rail, planning context
- **Retry rule:** Enumerate every county ArcGIS Server REST root, not only the Hubs.

### RF-018 · method miss · US EPA Risk Management Plan facilities

- **Stage:** C · **severity:** 2 · **revisit priority:** P2 · **status:** open
- **Tried:** EPA read only for FRS
- **Result:** door missing from sweep A
- **What it affects:** hazardous processes
- **Retry rule:** Add RMP and TRI to the EPA door; note RMP's public access limits.

### RF-019 · unreachable · Water Boards GeoTracker (no bulk door found yet)

- **Stage:** C · **severity:** 2 · **revisit priority:** P2 · **status:** open
- **Tried:** download page 403 (RF-005); Geoportal searched by title (https://geotracker.waterboards.ca.gov/data_download)
- **Result:** no official second door found
- **What it affects:** leaking tanks, cleanup sites
- **Retry rule:** Search the 389 Water Boards Geoportal items by content, not only title.

### RF-014 · tool error · Journey publishing tool, local-path cleaning and home-path check

- **Stage:** B · **severity:** 2 · **revisit priority:** P3 · **status:** resolved
- **Tried:** publish working papers
- **Result:** web addresses with a home-directory path segment were cut short in two published papers (Hamilton freight study, El Segundo failures page)
- **What it affects:** published evidence URLs
- **Retry rule:** Rules now match only paths standing on their own; every published source scanned for the damage pattern.
- **Resolution:** Both papers corrected in place; scan finds no other damaged addresses.

### RF-004 · refused · DTSC EnviroStor data download page

- **Stage:** B · **severity:** 1 · **revisit priority:** P3 · **status:** workaround official
- **Tried:** GET (https://www.envirostor.dtsc.ca.gov/public/data_download)
- **Result:** HTTP 403
- **What it affects:** contaminated and cleanup sites
- **Retry rule:** Use the official export on the California State Geoportal; re-check the page later.
- **Resolution:** EnviroStor export listed on the State Geoportal (official second door, not circumvention).

### RF-009 · held sensitive · City service Target_Hazards

- **Stage:** B · **severity:** 1 · **revisit priority:** P3 · **status:** accepted
- **Tried:** listed only (https://services9.arcgis.com/NtAn3q92p40X6z9O/arcgis/rest/services)
- **Result:** held under H6 (likely fire pre-plan for hazardous sites)
- **What it affects:** none for HeavyMap
- **Retry rule:** Do not profile or publish; owner may decide otherwise.
- **Resolution:** Held by policy.

## Carried forward from Hamilton

### RF-012 · coverage gap · Port of Hamilton, rail operators, provincial highways, pipelines, transmission, gas

- **Stage:** B · **severity:** 4 · **revisit priority:** P1 · **status:** open
- **Tried:** not swept (city layers only)
- **Result:** infrastructure stopped at the city line
- **What it affects:** rail, ports, highways, utilities
- **Retry rule:** Re-sweep the infrastructure family across all tiers (BL-138).

### RF-011 · licence unclear · 43 of 55 admitted Hamilton and Ontario layers

- **Stage:** D · **severity:** 3 · **revisit priority:** P1 · **status:** open
- **Tried:** licence column left unclear
- **Result:** licence unknown at publish time
- **What it affects:** all admitted layers
- **Retry rule:** Licence sweep (WU-09) before profiling; fill the 43.

### RF-010 · method miss · City of Hamilton assessment parcel layer missing from the catalogue

- **Stage:** C · **severity:** 4 · **revisit priority:** P3 · **status:** resolved
- **Tried:** catalogue search
- **Result:** found only by a web check
- **What it affects:** parcel fabric (spine)
- **Retry rule:** Two independent sweeps every run (now WU-05).
- **Resolution:** Method v0.1 requires two sweeps.

### RF-013 · unreachable · Brant County own map server (sm.brant.ca), noted in the roster

- **Stage:** E · **severity:** 1 · **revisit priority:** P3 · **status:** workaround official
- **Tried:** GET (https://sm.brant.ca/arcgis/rest/services/PublicData/CountyOfBrantGIS/MapServer)
- **Result:** connection failure
- **What it affects:** Brant County layers (Hub copies used)
- **Retry rule:** Re-check before assuming it is gone.
- **Resolution:** Hub items on ArcGIS Online used.
