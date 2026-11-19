---
run: CR-002
place: us-ca-el-segundo
place_type: city
country: us
subdivision: ca
county: los-angeles
city: el-segundo
method: 0.1
stage: A
type: working-paper
evidence_date: 2026-11-18
---
Predictions for El Segundo, written before any search (CR-002)
working-paper, el-segundo, predictions, run-2

> Twenty-two predictions, one for each kind of public dataset, written down before any search for El Segundo. Published as written; they will be scored at the end of the run.

Written 2026-11-18 by the run's agent from prior knowledge only, after the Hamilton retro and before any search for El Segundo. Each prediction names the archetype, whether we expect it to exist, who we expect to hold it, the keys we expect, and a confidence from 0 to 1. After the run, each is scored: right, partly right or wrong, with what was actually found.

Why publish these first: a prediction written down before looking is a fair test. The misses will show where our picture of public data, built in Ontario and New York, does not carry over to California.

## The big expectation

In Ontario, the parcel fabric, the assessment roll, floodplain regulation and zoning sit with four different bodies. In Los Angeles County we expect the **county assessor** to hold parcels and assessed values together, **federal and state bodies** to hold floodplains, the coastal zone, highways and environmental registries, and the **city** to hold zoning, plans and permits, much of it in documents rather than datasets.

## Identity

### PR-001 · Parcel fabric (DA-001)

- **Exists:** yes
- **Expected holder:** Los Angeles County Assessor (county GIS open data); not the City
- **Expected keys:** AIN (assessor identification number)
- **Confidence:** 0.85
- **Notes:** Parcel fabric and roll in one county layer, unlike Ontario's split. City unlikely to publish its own fabric.

### PR-002 · Assessment roll (DA-002)

- **Exists:** partly
- **Expected holder:** Los Angeles County Assessor
- **Expected keys:** AIN
- **Confidence:** 0.6
- **Notes:** Assessed land and improvement values likely public on the parcel layer; personal information about property holders likely not in open bulk data. Prop 13 base-year values make value a weak signal of market value.

### PR-003 · Address points (DA-003)

- **Exists:** yes
- **Expected holder:** Los Angeles County (countywide address points)
- **Expected keys:** address id or composite address
- **Confidence:** 0.6
- **Notes:** Mailing city 'El Segundo' may not equal the city limit (ZIP 90245 spans neighbouring land).

### PR-004 · Building footprints (DA-004)

- **Exists:** yes
- **Expected holder:** Los Angeles County building outlines; Microsoft and OpenStreetMap as fallbacks
- **Expected keys:** building id
- **Confidence:** 0.75
- **Notes:** County imagery-derived products may carry licence limits for non-members; outlines themselves likely open.

## Planning

### PR-005 · Zoning (DA-005)

- **Exists:** yes
- **Expected holder:** City of El Segundo (city GIS or PDF zoning map); SCAG regional zoning compilation
- **Expected keys:** zone code
- **Confidence:** 0.6
- **Notes:** A GIS layer may not be public; the zoning map may exist only as PDF. SCAG's regional compilation is the likely fallback.

### PR-006 · Official plan designations (DA-006)

- **Exists:** yes
- **Expected holder:** City of El Segundo General Plan land use; SCAG general plan land use
- **Expected keys:** designation code
- **Confidence:** 0.65
- **Notes:** 'General Plan' is California's term for Ontario's Official Plan (synonym ledger).

### PR-007 · Secondary plans (DA-007)

- **Exists:** yes, as specific plans
- **Expected holder:** City of El Segundo
- **Expected keys:** plan name
- **Confidence:** 0.5
- **Notes:** Specific plans (for example for older industrial districts) likely PDFs only.

### PR-008 · Employment lands (DA-008)

- **Exists:** no, not under that name
- **Expected holder:** none expected
- **Expected keys:** none
- **Confidence:** 0.7
- **Notes:** No 'employment lands' layer expected; industrial signal from M zones, General Plan industrial designations and SCAG employment data.

### PR-009 · Urban and rural boundary (DA-009)

- **Exists:** no (not applicable)
- **Expected holder:** none expected
- **Expected keys:** none
- **Confidence:** 0.8
- **Notes:** Fully urbanised city; no urban/rural boundary in the Ontario sense.

## Constraint

### PR-010 · Regulated areas and floodplain (DA-010)

- **Exists:** yes
- **Expected holder:** FEMA (National Flood Hazard Layer); California Coastal Commission (coastal zone boundary)
- **Expected keys:** none
- **Confidence:** 0.8
- **Notes:** No conservation authorities in California; floodplain is federal, coastal regulation is state.

### PR-011 · Greenbelt and escarpment controls (DA-011)

- **Exists:** no (not applicable)
- **Expected holder:** none expected
- **Expected keys:** none
- **Confidence:** 0.8
- **Notes:** No greenbelt or escarpment controls; the coastal zone is the nearest analogue.

## Activity

### PR-012 · Building permits (DA-012)

- **Exists:** uncertain
- **Expected holder:** City of El Segundo (permit system, possibly not open data)
- **Expected keys:** permit number, address, AIN
- **Confidence:** 0.45
- **Notes:** County Building and Safety covers unincorporated land only. A city permit portal may exist without a bulk dataset.

### PR-013 · Development applications (DA-013)

- **Exists:** uncertain
- **Expected holder:** City of El Segundo planning (agendas, PDFs)
- **Expected keys:** file number, address
- **Confidence:** 0.4
- **Notes:** Likely documents, not a dataset.

## Infrastructure

### PR-014 · Rail lines and sidings (DA-014)

- **Exists:** yes
- **Expected holder:** Federal (North American Rail Network, NTAD); rail operators; Los Angeles County
- **Expected keys:** segment id
- **Confidence:** 0.8
- **Notes:** A freight line runs near the city's industrial south; sidings and spurs may only be in operator or OSM data.

### PR-015 · Truck routes and highways (DA-015)

- **Exists:** yes
- **Expected holder:** Caltrans (state highways, truck network); City (truck routes, likely in municipal code)
- **Expected keys:** route id, segment id
- **Confidence:** 0.75
- **Notes:** State layers likely open; city truck routes 0.4, probably text in the municipal code.

### PR-016 · Water, sewer, stormwater (DA-016)

- **Exists:** unlikely public
- **Expected holder:** City and private utilities
- **Expected keys:** asset id
- **Confidence:** 0.3
- **Notes:** Water, sewer and storm networks unlikely in open GIS for security reasons; refinery and utility pipelines likely restricted.

### PR-017 · Ports and airports (DA-017)

- **Exists:** yes
- **Expected holder:** Los Angeles World Airports (LAX boundary); FAA; Port of Los Angeles and Port of Long Beach
- **Expected keys:** none
- **Confidence:** 0.85
- **Notes:** LAX adjoins the city; ports about 20 km south.

## Economy

### PR-018 · Business directory or licences (DA-018)

- **Exists:** uncertain
- **Expected holder:** City of El Segundo (business licences)
- **Expected keys:** business name, address
- **Confidence:** 0.4
- **Notes:** Some California cities publish active business licences as open data; El Segundo unknown.

### PR-019 · Industrial land inventory or vacancy (DA-019)

- **Exists:** no parcel-level inventory
- **Expected holder:** SCAG, county economic development (reports)
- **Expected keys:** none
- **Confidence:** 0.3
- **Notes:** Industrial land supply likely in reports, not parcel data.

## Environment

### PR-020 · Contaminated sites and environmental registries (DA-020)

- **Exists:** yes
- **Expected holder:** California DTSC (EnviroStor), State Water Board (GeoTracker), US EPA (FRS, TRI), South Coast AQMD
- **Expected keys:** site id, facility id
- **Confidence:** 0.9
- **Notes:** A large refinery and aerospace sites make environmental registries rich here.

## Population

### PR-021 · Census areas and labour data (DA-021)

- **Exists:** yes
- **Expected holder:** US Census Bureau (ACS, TIGER)
- **Expected keys:** GEOID
- **Confidence:** 0.95
- **Notes:** Place, tract and block group geography.

## Documents

### PR-022 · By-law schedules, plans, council reports (DA-022)

- **Exists:** yes
- **Expected holder:** City of El Segundo (General Plan, zoning code, specific plans, council reports)
- **Expected keys:** references
- **Confidence:** 0.9
- **Notes:** Many facts likely only in documents.

## Problems we expect

- **City versus mailing city.** County records filtered by a city name field will not match the city limit exactly; the ZIP code and postal city cover neighbouring land.
- **Licence limits on county imagery products** for anyone who is not a member of the county's imagery consortium.
- **Documents, not datasets,** for zoning detail, specific plans, permits and development applications.
- **Restricted infrastructure:** utilities and pipelines withheld for security.
- **Whole-county downloads:** some county layers will only be offered as one file for all 88 cities.
