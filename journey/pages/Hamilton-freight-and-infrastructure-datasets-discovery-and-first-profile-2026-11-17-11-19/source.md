---
run: CR-001
place: ca-on-3525005-hamilton
place_type: city
country: ca
subdivision: on
city: hamilton
type: working-paper
evidence_date: 2026-11-17
---
Hamilton freight and infrastructure datasets: discovery and first profile (2026-11-17)
working-paper, hamilton, freight, infrastructure, run-1

> A working paper written on 2026-11-17, published nearly as written. Local file paths, private repository names and personal names have been removed.

**Owner decisions 2026-11-17:** show the water and sewer networks in HeavyMap (D-077, planning repo), keeping proximity distinct from service. Keep the coded fields (`RESTRICTED`, blank `TIME_OF_DAY`, `REDUCEDLOAD`, `TRUCK_ROUTE`) in use, shown as the source's codes marked "meaning not yet confirmed by the City", while the definitions are requested (BL-120).

Slice: Hamilton, family "context" (freight access and infrastructure). Linear is out of use (D-075); the Hamilton slice id NA-24 is cited for continuity. Routine: `heavymap-planning/DATASET-ROUTINE.md`, stages 1 to 3 for the first slice, stage 1 for the rest. No MCS edit, schema change, UI or publication.

**Evidence labels.** Every fact below was **live read on 2026-11-17** from the source URL given, unless marked *documented, not re-read*. Counts are server counts (`returnCountOnly`). Join results are `hits/tested`. Owner or identifying fields are named, never quoted. Raw pulls, scripts and summaries are local only: a local working copy (scripts `recon.py`, `recon2.py`, `measure.py`, `pull.py`, `join_test.py`; metadata in `raw/`) and the pull folders named in each section.

**Reading rules applied.** Annual all-vehicle counts are not truck volumes. Active permits and closures are temporary and are kept apart from durable infrastructure. A catchment, pressure district or nearby main says nothing about a parcel's connection or spare capacity.

## Prioritized shortlist

| # | Dataset | Publisher, service | Recommendation |
|---|---|---|---|
| 1 | Truck Route Network | City of Hamilton, AGOL `Truck_Route_Network/FeatureServer/5` | **Profile further: first slice.** Current (edited 2026-11-09); parcel adjacency tested 1,425/3,193 industrial-zoned parcels within 30 m |
| 2 | Bridges and culverts with height and weight restrictions | City, `spatialsolutions …/General/Traffic/MapServer/13` | **Profile further.** Answers the load and clearance question: posted height on 27 structures, weight limits on 13 |
| 3 | Average Daily Traffic Count | City, AGOL `Average_Daily_Traffic_Count/FeatureServer/39` | **Profile further** as segment context. All-vehicle annual counts, no geometry; located through the street centreline (1,682/1,716 GEO_IDs) |
| 4 | Traffic road segments (titled "Heavy Truck Traffic Route" in the Corridor Activities map) | City, `spatialsolutions …/General/Traffic/MapServer/9` | **Profile further, carefully.** Not a truck-volume layer: all-vehicle 24 h volumes (counts 2004 to 2020) plus older truck codes and an undocumented `REDUCEDLOAD` flag |
| 5 | Corridor Activities: overload and superload truck permits | City corridor-permits AGOL org (`services1 …/DkpbFZAaJs7sZX2x`) | **Defer as map context**; event data, nightly, temporary. Useful as evidence that a route carries heavy movements |
| 6 | Corridor Activities: closures, lane/sidewalk occupancy, municipal consents, access permits, maintenance, capital projects | Same org, plus spatialsolutions | **Defer.** Current-conditions layer, not parcel context. Municipal consents (1,125) mark where utilities are being worked on |
| 7 | Railways and railway crossings | City AGOL `Railways`; spatialsolutions `Traffic/MapServer/45` | **Profile further** (rail corridor adjacency, level crossings on access routes). Rail lines last edited 2023-10-22 |
| 8 | Water and sewer networks | City AGOL: Watermain, Water Valve/Node/Hydrant, Water Pressure District; Sewermain, Manhole, Node, Valve, Lift Station | **Profile further, with an owner decision on exposure.** Open City services, edited 2026-11-14; pipe size, material and install date. Proximity only, never connection or capacity |
| 9 | Traffic Collisions | City AGOL `Traffic Collisions` (table) | **Defer.** 134,136 rows 2008 to 2025, about 2,700 with a truck as vehicle 1; located by GEO_ID |
| 10 | Stormwater management facilities, watercourses | City AGOL | **Defer** to the environment family |
| 11 | Airport | City AGOL `Airport` | **Defer.** Five polygons (Hamilton International boundary and runway, three small fields); last edited 2023-10-03 |
| 12 | Port of Hamilton (HOPA) | Hamilton-Oshawa Port Authority | **Lead only, not checked.** No City layer found |
| — | McMaster "Enhanced water and sewer data" | McMaster University Library | **Blocked** for automated access (bot check). Not needed: the City publishes the networks openly |

## 1. First slice

### 1.1 Truck Route Network
- **Source:** https://services.arcgis.com/rYz782eMbySr2srL/ArcGIS/rest/services/Truck_Route_Network/FeatureServer/5 (service page: https://www.hamilton.ca/home-neighbourhood/getting-around/driving-traffic/truck-route-network). Access 2026-11-17, live read.
- **Shape:** 1,250 polylines, EPSG:26917, maxRecordCount 2000, query only. Data last edited **2026-11-09**.
- **Fields:** `OBJECTID`, `STREET_NAME`, `FUNCTIONAL_ROAD_CLASS`, `IS_TRUCK_ROUTE` (all "Yes"), `RECOMMENDATION` (one value on every row), `RESTRICTED` (No 1,140, Yes 108, null 2), `TIME_OF_DAY` (Full Time 1,157, Part Time 72, blank 21), `Shape__Length`.
- **Network:** 631 km: full time 597.9, part time 32.1, blank 1.2. `RESTRICTED = Yes` on 36.7 km.
- **Pull:** complete, 1,250/1,250, `truck-route-network-hamilton-2026-11-17/`.
- **Join (stage 6 evidence, spatial):** industrial-zoned parcels (largest zoning row an `M` zone covering at least half the parcel, overlay run 20261017-val2-ia1), shortest distance from parcel boundary to a route centreline: within 20 m **1,313/3,193**, 30 m **1,425/3,193**, 50 m 1,590/3,193, 100 m 1,974/3,193. Of the 30 m hits, 1,388 are nearest a full-time route, 31 part time, 6 unspecified. Method: `join_test.py`; boundary vertices sampled (about 60 per parcel).
- **Limits and risks:**
  - The service description still says "identified as part of the 2010 Truck Route Master Plan and updated in 2017". The City page describes a 2022 Master Plan Update, signage completed October 2023, and a restriction on trucks with more than four axles in parts of the lower city (*documented on the City page, read 2026-11-17*).
  - What `RESTRICTED` encodes (the axle rule, time limits, or something else) is not stated anywhere. Show the source value with "meaning not yet confirmed" until the City replies (BL-120).
  - Directional routes are not distinguishable in this layer.
  - There is no stable id, only `OBJECTID`.
  - Adjacency to a route is not access: driveways, medians and turn restrictions are unknown.
- **Use:** a dossier fact ("on or within 30 m of a full-time truck route") and a map layer.

### 1.2 Average Daily Traffic Count
- **Source:** https://services.arcgis.com/rYz782eMbySr2srL/ArcGIS/rest/services/Average_Daily_Traffic_Count/FeatureServer/39. Access 2026-11-17, live read.
- **Shape:** declared as points, but **all 2,350 rows have no geometry**, the `COORDINATES` field is empty, and the layer has no extent. Data last edited **2026-10-06**.
- **Fields:** `OBJECTID`, `GEO_ID`, `LOCATION_DESCRIPTION`, `AVERAGE_DAILY_TRAFFIC_COUNT` (7 to 89,108, mean 5,524), `COUNT_YEAR` (text, 2008 to 2024).
- **Grain:** one count per location per year. There are 1,716 locations; 426 have more than one year; there are no duplicate location-year pairs. Latest year per location: 791 in 2022 to 2024, 390 in 2008 to 2012.
- **Join:** `GEO_ID` matches the street centreline `SEGID` (pulled 2026-10-17) for **1,682/1,716**, and the traffic segments `SEGID_NEW` for **1,713/1,716**. So counts can be drawn on road segments and then related to parcels by frontage.
- **Pull:** complete, 2,350/2,350, `average-daily-traffic-count-hamilton-2026-11-17/`.
- **Limits:** all vehicles, not trucks. Counts are years apart between locations, so always show the count year. The layer cannot be drawn without the centreline join.

### 1.3 Traffic road segments ("Heavy Truck Traffic Route")
- **Source:** https://spatialsolutions.hamilton.ca/webgis/rest/services/General/Traffic/MapServer/9 (layer name "Traffic - Streets"; titled "Heavy Truck Traffic Route" in the Corridor Activities map). Access 2026-11-17, live read.
- **Shape:** 21,062 polylines, EPSG:3857, map and query capability, no edit-tracking dates exposed.
- **Fields (selection):**
  - **Ids:** `SEGID_NEW` (unique, no nulls), `SEGID_ORG` (2,021 null).
  - **Road:** `CATEGORY`, `SPEED_LIMIT`, `ONE_WAY`.
  - **Volumes:** `VOLUME_24HR` plus a directional pair, and `VOLUME_STAT` (method or source code).
  - **Truck and load:** `TRUCK_ROUTE` (F 3,122, P 219, D 16, X 16,347, null 1,358) and `REDUCEDLOAD` (Y 1,436, Z 11, X 14,546, null 5,069).
  - **Dates and status:** `COUNT_DATE` (2004 to 2020), `TRF_CHK` (2020 or null), `CURRENT_STATUS` (Active 17,682, For Review 2,278, Retired 807, other 295).
- **How it compares with 1.1:** active `TRUCK_ROUTE = F` covers 839.6 km, against 597.9 km full time in the current network. The difference is unexplained: possibly divided roads counted per carriageway, or the pre-2022 network.
  - **This is not a duplicate. It is an older, different product.** Use 1.1 for truck routes.
- **Volumes:** 16,176 segments have a 24-hour volume above zero. This is all-vehicle traffic, mostly estimated or modelled (`VOLUME_STAT` codes such as MS2FLOW5), not truck counts.
- **REDUCEDLOAD:** "Y" on 796.6 km of active segments. No documentation was found. It may mark seasonal reduced-load roads, but **that is unconfirmed**. Keep the field, show the raw code marked "meaning not yet confirmed", and do not describe it as a load restriction until the City confirms (BL-120).
- **Pull:** complete, 21,062/21,062 (outSR 4326), `traffic-segments-heavy-truck-traffic-route-hamilton-2026-11-17/`.

### 1.4 Corridor Activities map
- **Map item:** https://www.arcgis.com/home/item.html?id=6a332e4af32f423ab951689fd89ddd5e, owner account SSS_Coordinator, created 2019-09-18, **item modified 2026-01-09**.
  - Its description says the data is "updated on a nightly basis" from Municipal Consents, Road Occupancy Permits, Temporary Road Closures, Road Excavation Permits and capital projects.
  - The licence text is a City "as is" disclaimer.
- **Freshness:** the item's date reflects edits to the map, not the data. Layer data dates confirm nightly updates.

| Layer (service) | Geometry | Count | Data last edit | Date range in data | Personal-like fields (names) |
|---|---|---|---|---|---|
| Active Overload Truck Permits | line | 36 | 2026-11-16 | moves 2026-03-09 to 2027-05-07 | `Company_Name` |
| Active SuperLoad Truck Permits | line | 1 | 2026-11-04 | move 2026-11-30 to 2026-12-04 | `Company_Name` |
| Active Temporary Full Road Closure Permit | line | 9 | 2026-11-17 | 2026-02-16 to 2028-11-30 | `Project_Name` |
| Active Temporary Lane and Sidewalk Occupancy Permits | point | 42 | 2026-11-17 | 2024-03-25 to 2028-10-27 | none |
| Active Utility Temporary Lane and Sidewalk Occupancy Approvals | point | 40 | 2026-11-17 | 2026-08-31 to 2027-01-29 | `Company_Name` |
| Active Municipal Consents Utility Permits | line | 1,125 | 2026-11-17 | approved 2020-12-08 to 2026-11-16 | `Utility_Company_Name`, `Project_Name` |
| Active Access Permits | point | 7 | 2026-10-29 | none | none |
| Active Film Permits | point | 5 | 2026-11-17 | 2026-11-16 to 2026-11-27 | none |
| Maintenance Works (spatialsolutions) | line | 6,343 | not exposed | completed 2023-05-09 to 2026-11-16 | `CONTRACTORS` |
| Current Linear Projects (spatialsolutions) | line | 44 | not exposed | est. start 2022-10-01 to 2026-12-01 | `PROJECT_NAME`, `CONTRACTORS` |
| Current Point Projects (spatialsolutions) | multipoint | 13 | not exposed | est. end to 2030-11-29 | `PROJECT_NAME`, `CONTRACTORS` |
| Heavy Truck Traffic Route | see 1.3 | | | | |
| Ward Boundaries | reference | | | | |

- **Overload and superload permits** carry a free-text route description, permit type (single trip 20, project 16) and times. They show real heavy movements, for example port and rail-yard origins. Company names are business names, but keep them out of public output until reviewed.
- A separate older City service, "Temporary Road Closures" (AGOL), holds one record from 2026-02-06. Use the Corridor layer instead.
- Recommendation: do not join these to parcels as durable facts. If used, show them as a dated "current activity" map layer with the data date visible.

## 2. Load restrictions and utility networks: obtainable and worth pursuing?

**Bridge and culvert restrictions: yes, obtainable now.**
- **Source:** https://spatialsolutions.hamilton.ca/webgis/rest/services/General/Traffic/MapServer/13 ("Traffic Bridges"). Access 2026-11-17, live read. 446 points.
- **Structure types:** culvert 244, bridge 170, railway grade crossing 27, pedestrian bridge 4, tunnel 1.
- **Restriction fields:**
  - `HEIGHT_RESTRICTION` (−1 = yes on 27), `POSTED_HEIGHT` (27), `MEASURED_HEIGHT`, `LOW_CLEARANCE_MARKS`, `NARROW_STRUCTURE_SIGN`.
  - `WEIGHT_RESTRICTED` (−1 = yes on 13), `MAXWEIGHT_TONNE` (11), `MAXWEIGHT_PER_AXLE`, `WEIGHTREV_DATE` (2005 to 2017).
  - `YEAR_BUILT`, `REVIEWED_DATE` (one value: 2022-06-09), `MOD_DATE` (to 2025-07-29).
- **Fields to keep internal:** `GIS_USER` (staff account names; never expose) and `OWNER_CATEGORY` (empty).
- **AGOL "Bridges" layer:** 450 points, edited 2026-11-14, but only an id, names, community, ward and category; no restrictions. **Use the MapServer layer.**
- **Worth it:** yes. A low or weight-limited structure on a parcel's likely route is a real freight constraint. Join method: nearest route segment or structure; never a parcel attribute directly.
- **Seasonal or reduced-load roads:** no clear source yet. The only candidate is the undocumented `REDUCEDLOAD` flag in 1.3. Ask the City (Transportation Operations) what Y, Z and X mean before using it.

**Detailed water and sewer networks: obtainable now; exposure needs an owner decision.**
- **Sources** (City AGOL, all edited 2026-11-14, access 2026-11-17, live read):

| Layer | Count |
|---|---|
| Watermain | 38,357 |
| Water Valve | 24,488 |
| Water Node | 18,327 |
| Water Hydrant | 14,217 |
| Water Pressure District | 28 |
| Sewermain | 54,209 |
| Sewer Manhole | 48,906 |
| Sewer Node | 3,686 |
| Sewer Lift Station | 96 |
| Sewer Valve | 163 |

- **Fields:**
  - **Water mains:** `PIPETYPE`, `INSTDATE`, `OWN` (HA 38,348, PR 8), `PRESZONE`, `WAT_SIZE`.
  - **Sewer mains:** `PIPETYPE` (RCP, VCP, PVC …), `SUBTYPE`, `PIPEDIAM`, `PIPEHT`, `INSTDATE`, `OWN` (HA 54,089, PR 94).
  - No personal fields.
- **Licence:** City open data portal terms; read the published licence page before use. Licence text is *not yet confirmed per layer*.
- **McMaster record:** https://library.mcmaster.ca/maps/geospatial/enhanced-water-and-sewer-data-city-hamilton returned an automated bot check. **Blocked.** It is not needed, since the City layers cover the same asset classes.
- **Worth it:** yes for context ("water main of 300 mm along the frontage, installed 1974"; "nearest sewer lift station"). Proximity is not service: a main along a frontage does not mean the parcel is connected or that capacity exists.
- **Sensitivity:** the MCS catalogue flags these layers `infrastructure_ownership_attribute`. **Owner decision 2026-11-17 (D-077): show them**, with proximity worded distinctly from service.
- **Existing work:** sanitary, combined-overflow and treatment-plant catchments and subwatersheds were pulled on 2026-11-16 (`LOCAL-DATA-REGISTER-2026-11-16.csv`). Keep catchment membership separate from pipe proximity.

## 3. Other candidates found (stage 1 only)
- **Railways** (City AGOL): 1,692 lines; categories railway line 1,301, tunnel 83, bridge 72; last edited 2023-10-22; no owner or operator field.
- **Railway crossings** (`Traffic/MapServer/45`): 353 points; types level 141, private level 73, tunnel 70, bridge 65. `TRACK_OWNER`, `XING_OWNER` and `TRACK_SPUR_NAME` name railway companies and spurs (business names; review before public use). Inspection dates run 2021 to 2022.
- **Traffic Collisions** (City AGOL table): 134,136 rows, 2008 to 2025, edited 2026-06-26. Located by `GEO_ID` and `LOCATIONTYPE` (intersection 76,888, segment 57,238). Driver age is grouped.
  - Prefer it to the spatialsolutions "TES Collisions" layer (128,169 points), which records `DRIVER_*_AGE` and `DRIVER_*_SEX` and should not be used.
- **Safety features:** Traffic Signals 693, Pedestrian Crossovers 215, Traffic Speed Humps 859, Community Safety Zones 72 (two copies, both edited 2026-11). Useful as street character, not as parcel facts.
- **Stormwater Management Facilities** (148 polygons) and **Watercourse** (11,252 lines): environment family.
- **Airport:** 5 polygons, edited 2023-10-03.
- **Port:** not found in City services. HOPA is a separate federal authority; a lead only.

## 4. Proposed next steps
1. **Truck Route Network:** profile stage 6 fully with a reviewed sample of the 30 m hits, and ask the City what `RESTRICTED` and the blank `TIME_OF_DAY` mean.
2. **Bridges:** pull and profile the restriction layer; relate structures to truck-route and centreline segments.
3. **Traffic counts:** build the `GEO_ID` to centreline link as a derived segment table, showing count year with every value.
4. **Code definitions (BL-120):** ask the City what `RESTRICTED`, blank `TIME_OF_DAY`, `REDUCEDLOAD` and `TRUCK_ROUTE` mean. Meanwhile keep the fields, shown as unconfirmed codes.
5. **Water and sewer:** approved for display (D-077). Pull and profile next.
6. **Corridor permits:** decide whether a dated "current activity" layer belongs in HeavyMap at all.

## 5. Round 2: bridges, utilities, traffic counts, rail (2026-11-17)

**Pulls (all complete, server count = pulled, native EPSG:26917, local only, folders `<name>-hamilton-2026-11-17/` in a local working copy):**

| Layer | Pulled |
|---|---|
| traffic-bridges | 446/446 |
| railways | 1,692/1,692 |
| railway-crossings | 353/353 |
| watermain | 38,357/38,357 |
| water-valve | 24,488/24,488 |
| water-node | 18,327/18,327 |
| water-hydrant | 14,217/14,217 |
| water-pressure-district | 28/28 |
| sewermain | 54,209/54,209 |
| sewer-manhole | 48,906/48,906 |
| sewer-node | 3,686/3,686 |
| sewer-valve | 163/163 |
| sewer-lift-station | 96/96 |

**Reference:** OpenStreetMap railway ways (rail with yard, siding and spur service values; 1,111 ways; OSM data timestamp 2026-07-24) from an Overpass mirror (the main server was at capacity), in `osm-railways-hamilton-2026-11-17/`. © OpenStreetMap contributors, ODbL. Used only to check currency.

**Method:** `measure2.py` (local). Outputs are measurement tables in `_freight-recon-2026-11-17/derived/`: distances in metres, ids and source attributes, with no thresholds or labels applied (proposed D-078). The population is the 3,193 active industrial-zoned parcels used in 1.1. Distances run from parcel boundary vertices (about 60 per parcel).

### 5.1 Bridges, culverts and grade separations with restrictions
- **Restricted structures:** 40 of 446: 27 height-restricted, 13 weight-restricted, none both. By type: bridge 28, railway grade separation 11, pedestrian bridge 1.
- **Posted heights:** 3.3 to 4.4 m.
- **Link to streets:** each structure was joined to its nearest street centreline segment: **439/446 within 15 m** (`bridge-segment-links.csv`).
- **On truck routes:** 11 of the 40 restricted structures lie within 15 m of a truck route, all full-time routes. Eight are low clearances of 4.0 to 4.4 m posted (one measured 4.25 m against 4.1 posted); three are weight limits of 27, 51 and 54 t.
- **Use:** a route-level constraint ("the nearest truck route passes under a 4.1 m posted structure"), never a parcel attribute.
- **Quirks:** heights carry floating-point artefacts (Q-035); flags use −1/0 (Q-036); `GIS_USER` holds staff account names (Q-037, never expose).

### 5.2 Water and sewer networks (show, per D-077)
- **Frontage proximity, boundary to main (`parcel-utility-measurements.csv`):**
  - Watermain within 30 m: **2,937/3,193**.
  - Sewer main within 30 m: **2,816/3,193**.
  - No watermain within 300 m: 129. No sewer main within 300 m: 227.
- **Pressure district:** assigned by representative point for 3,055/3,193.
- **Nearest-main attributes:**
  - Watermain `WAT_SIZE`: 150 (815), 200 (738), 300 (727), 400 (299), up to 1200.
  - Sewer `PIPEDIAM`: 300 (643), 375 (410), 450 (262), 600 (241), up to 900+.
  - Also `PIPETYPE`, `SUBTYPE`, `INSTDATE`, and `OWN` (HA = City, PR = private).
  - The table also holds the distance to the nearest of 96 sewer lift stations.
- **Reading rule:** a main near the frontage is not a service connection, and its size is not available capacity. The sewer `SUBTYPE` distinguishes sanitary, storm and combined; check it before any wording.
- **Quirk:** `INSTDATE` is text in YYYYMMDD form (Q-038).

### 5.3 Traffic counts on street segments
- **Count table:** `adt-by-centreline-segment.csv` lists each counted segment with its latest year, latest count, number of years counted and all counts. 1,716 segments, 1,682 present in the centreline.
- **Coverage of the truck network:** **185.9 of 631.2 km** of truck routes fall on a counted segment (midpoint within 12 m).
- **Latest count year on those routes (km):** 2008 to 2012 → 39.8; 2014 to 2018 → 19.4; 2019 → 31.8; 2020 to 2022 → 34.7; 2023 → 42.2; 2024 → 18.0.
- **Use:** "latest all-vehicle count on the fronting segment, and its year", never as truck volume. Most truck routes have no count at all.

### 5.4 Rail
- **Currency against OpenStreetMap:**
  - Of 386.0 km of City rail, **359.9 km (93%)** lies within 25 m of OSM rail.
  - Of 386.8 km of OSM rail near the City data, **349.5 km (90%)** lies within 25 m of City rail.
  - The City layer (edited 2023-10-22) is broadly current. The roughly 10% differences are worth a reviewed look (sidings and yards are likely candidates).
- **Industrial parcels within 50 m of a surface railway:** **719/3,193** (tunnels excluded; `parcel-rail-distance.csv`).
- **Level crossings:** 214 (public and private at-grade). 73 of them lie within 15 m of a truck route: at-grade rail on a freight route.
- **Crossing fields:** `TRACK_OWNER`, `XING_OWNER` and `TRACK_SPUR_NAME` name railway companies and private spurs (Q-039; business names, review before public use). The spur names could identify rail-served industrial sites, a strong freight signal to profile next.

### 5.5 Where these outputs belong (proposed, D-078 in the planning repo)
The four derived tables are measurements (distances, ids, source attributes) and fit Industrial Atlas releases. Any wording such as "fronts a truck route", "rail-served" or "low bridge on route" is HeavyMap's judgement over them. Nothing here is released yet.
