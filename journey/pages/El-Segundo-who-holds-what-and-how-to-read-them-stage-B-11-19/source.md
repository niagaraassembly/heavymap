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
El Segundo: who holds what, and how to read them (stage B)
working-paper, el-segundo, publishers, stage-b, run-2

> Stage B of the El Segundo run: every body that holds a land or industry duty for the city, and how to read what each one publishes. Published as written.

Run CR-002, method v0.1, stage B: WU-03 (duty by tier grid) and WU-04 (channel fingerprinting). Written 2026-11-18 Eastern (live reads 2026-11-19 04:27 to 04:30 UTC). This is a census of **publishers and their doors**, not yet of datasets: stage C enumerates what each door holds.

**Evidence labels.** `live read` means the URL was fetched during this stage and the figure comes from the response. `search lead` means a web search pointed at it and it was not yet read live. Raw responses are kept locally and not published.

## 1. Headline findings

1. **The City publishes, but not on its website.** Both city domains (elsegundo.gov, elsegundo.org) refuse automated access (HTTP 403, live read). The City's GIS lives on ArcGIS Online: organisation `elsegundo.maps.arcgis.com`, services at `services9.arcgis.com/NtAn3q92p40X6z9O` (**73 services**, live read), and a Hub site, "City of El Segundo GIS Hub" (**55 catalogue items**, live read). The server holds more than the catalogue lists, as in Hamilton (pattern SP-010).
2. **Los Angeles County has two Hub front doors over largely one catalogue.** data.lacounty.gov lists 1,109 datasets and egis-lacounty.hub.arcgis.com lists 966; 950 identifiers are shared (live read). Same pattern as Brantford (SP-001). Many licence fields are raw HTML (SP-002 analogue).
3. **The county parcel layer can likely be narrowed to the city by attribute.** The Public Works parcel layer carries `AIN`, `APN`, `SitusCity`, `TaxRateCity`, `TaxRateArea` and use codes (field names, live read). Whether `SitusCity` matches the city limit is a stage C question.
4. **Infrastructure has rich, open, non-city holders.** The electric utility (Southern California Edison) publishes 47 datasets including substations, transmission circuits and grid hosting capacity (live read). Federal transport statistics publish the national rail network, ports and freight flows (142 datasets, live read). The state energy commission publishes power plants and transmission lines (202 datasets, live read).
5. **Some doors refuse automated access.** The state toxic-substances download page and the state water board's GeoTracker download page both return 403 (live read). The toxic-sites export is also published on the California State Geoportal, an official second door. The Sanitation Districts' maps page returns 403. FEMA's flood hazard service did not answer at all (connection failure, twice); to re-check.
6. **A same-name decoy:** a Colombian health agency layer, "Reclamos en Salud Segundo Semestre 2024" ("second half-year"), appears in an ArcGIS Online search for "El Segundo" (SP-003).
7. **A sensitive city layer:** `Target_Hazards` on the City's server looks like fire-department pre-planning for hazardous sites. Flagged sensitive (hold rule H6): not profiled, not published.

## 2. Duty by tier grid (WU-03)

Tiers: federal, state, regional (SCAG and special districts), county, city, special-purpose bodies and utilities.

| Duty | Holder(s) for El Segundo | Tier | Evidence |
|---|---|---|---|
| Parcel fabric and assessment | Los Angeles County Assessor (via county Public Works GIS and the county Hubs); city copies (`LACO_Parcels`, `COES_Parcels`); SCAG 2024 regional parcels | county, city, regional | live read (fields); search lead (SCAG parcels) |
| Address points | County address points (CAMS, county permitting map service); city `Address_Pnts_ElSegundo` | county, city | live read (layer names) |
| Building footprints | County building outlines 2017; city `Buildings_Outlines_2017_COES`; open footprint sets as fallbacks | county, city | live read (layer names) |
| Zoning | City (`Zoning`, `Zoning_Update`, `COES_zoning`); SCAG regional zoning compilation (`LDX` folder) | city, regional | live read |
| General Plan land use | City (`General_Plan`, `GeneralPlan`); SCAG general plan compilation | city, regional | live read |
| Specific plans | City (`Smoky_Hollow_Specific_Plan`, `COES_Downtown_Specific_Plan`, `COES_Specific_Plans`); SCAG specific plans | city, regional | live read |
| Building permits and development | City via OpenGov (`OpenGovBuilding`, `OpenGovLayers`, `OpenGovAddress_view`) and `Developments`; the county's permitting system covers unincorporated land only | city, county | live read (service names) |
| Business register | City `Businesses`, `Deep_Tech_Businesses` (Hub); business registration lists as documents (city site, refused) | city | live read (Hub titles); search lead (documents) |
| Floodplain | FEMA National Flood Hazard Layer | federal | not reached (connection failure) |
| Coastal zone | California Coastal Commission (coastal zone boundary, via the State Geoportal) | state | live read (Geoportal title) |
| Seismic hazard | California Geological Survey (liquefaction zones, fault zones, via the State Geoportal) | state | live read |
| Contaminated and cleanup sites | State Department of Toxic Substances Control (EnviroStor; download page 403, export on the Geoportal); State Water Board (GeoTracker; 403); US EPA (Facility Registry Service, CSV downloads page) | state, federal | live read |
| Air permits and emissions | South Coast Air Quality Management District (facility lookup page); state air board | regional, state | live read (page reachable) |
| Rail | Federal Railroad Administration and BTS (North American Rail Network lines and nodes, mileposts) | federal | live read |
| Highways and freight routes | Caltrans (80 datasets); FHWA Freight Analysis Framework network; city truck routes (municipal code, city site refused) | state, federal, city | live read |
| Ports | BTS principal ports; USACE port areas; Port of Los Angeles berth lines (City of Los Angeles open data, Socrata ids `fkp8-e2db`, `9r7y-tdse`) | federal, port | live read |
| Airport | Los Angeles World Airports (not yet fingerprinted); city `LAX_Noise_Contours` layers; FAA | special-purpose, city, federal | live read (city layers) |
| Electricity | Southern California Edison (substations, transmission circuits, integration capacity); state energy commission (transmission lines, power plants) | utility, state | live read |
| Gas and pipelines | Federal pipeline safety regulator's national pipeline map (public viewer only, documented, not re-read); gas utility (not fingerprinted); state oil and gas well records | federal, utility, state | not read |
| Water, sewer, storm | City `Utilities` service (to inspect in stage C, sensitivity check first); Sanitation Districts (page refused); regional water district (not checked) | city, special-purpose | partial |
| Transit | City copies of Metro and Beach Cities Transit routes and stops | regional, city | live read |
| Noise | City LAX noise contours and residential sound insulation layers | city | live read |
| Regional land use and growth | SCAG (`LDX` land data exchange folder among 26 service folders) | regional | live read |
| Census and labour | US Census Bureau (place GEOID 0622412) | federal | live read |
| Documents (General Plan text, zoning code, staff reports) | City document library (refused for automated access) | city | live read (403) |

## 3. Channel fingerprints (WU-04)

| Publisher | Platform | How to enumerate | Live count | Access |
|---|---|---|---|---|
| City of El Segundo (GIS) | ArcGIS Online organisation and Hub | REST directory `services9.arcgis.com/NtAn3q92p40X6z9O/arcgis/rest/services?f=json`; Hub DCAT feed `coes-hub-ElSegundo.hub.arcgis.com/api/feed/dcat-us/1.1.json` | 73 services, 55 Hub items | open |
| City of El Segundo (website, documents) | CMS document library | none usable | n/a | 403 to automated clients |
| Los Angeles County | Two ArcGIS Hub sites over one organisation; Public Works and permitting ArcGIS Server | DCAT feeds of both Hubs; REST directories of `dpw.gis.lacounty.gov` and `permitting.gis.lacounty.gov` | 1,109 and 966 (950 shared); permitting service 56 layers | open |
| SCAG | ArcGIS Server | REST directory `maps.scag.ca.gov/scaggis/rest/services?f=json` | 26 folders, 12 root services | open |
| California State Geoportal | ArcGIS Hub | DCAT feed `gis.data.ca.gov/api/feed/dcat-us/1.1.json` | 4,019 datasets | open |
| California open data (CKAN) | CKAN | `data.ca.gov/api/3/action/organization_list`, `package_search` | 62 organisations | open |
| California Energy Commission | ArcGIS Hub | DCAT feed | 202 datasets | open |
| Caltrans | ArcGIS Hub | DCAT feed | 80 datasets | open |
| Southern California Edison | ArcGIS Hub (distribution resource plan portal) | DCAT feed `drpep-sce2.opendata.arcgis.com` | 47 datasets | open |
| BTS / NTAD | ArcGIS Hub | DCAT feed `geodata.bts.gov` | 142 datasets | open |
| City of Los Angeles (port data) | Socrata | Discovery API `data.lacity.org/api/catalog/v1` | berth line datasets found | open |
| US EPA FRS | download pages | state CSV files | page reachable | open |
| FEMA NFHL | ArcGIS Server | REST directory | not reached | connection failure |
| DTSC EnviroStor, Water Board GeoTracker | download pages | n/a | n/a | 403; EnviroStor export also on the Geoportal |
| LA County Sanitation Districts | website | n/a | n/a | 403 |
| South Coast AQMD | facility lookup | per-facility search, no bulk found yet | n/a | open page |
| Los Angeles World Airports, gas utility, regional water district | not yet fingerprinted | | | |

## 4. Exit test for stage B

"Every expected duty has a holder or a reason it has none." Met for 24 of 25 duties above. Not met: gas and pipelines (holders named, no door read). Carried to stage C with FEMA and the airport.

## 5. Patterns seen again, and new ones

- SP-001 (two Hub front doors over one organisation): seen again, Los Angeles County.
- SP-003 (same-name decoy): seen again, a Spanish-language layer matching "Segundo".
- SP-004 (portal root refuses access): seen again, the City's own domains, the Sanitation Districts, two state download pages.
- SP-010 (server holds more than the catalogue): seen again, 73 services against 55 Hub items.
- New candidate: **a city whose website refuses automated access while its ArcGIS Online organisation is open.** Search ArcGIS Online by name before concluding a city publishes nothing.
- New candidate: **California's investor-owned utilities publish grid hosting capacity, substations and circuits openly** (required by the state utilities commission). Look for the utility's distribution planning portal in every California city.
