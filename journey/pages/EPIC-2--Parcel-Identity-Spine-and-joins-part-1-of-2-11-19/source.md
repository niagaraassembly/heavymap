---
run: CR-001
type: working-paper
evidence_date: 2026-10-17
part: 1 of 2
---
EPIC 2 — Parcel Identity Spine and joins (part 1 of 2)
working-paper, spine, joins, pilots

> A working paper written on 2026-10-17, published nearly as written. Local file paths, private repository names and personal names have been removed.

**Drafted:** 2026-09-30 from a read-only pilot study of Welland and Rochester. This is a living doc: update the tables, tick the boxes as work lands, and update the matching row in `../Spreadsheets/00-PLANNING-INDEX.csv`.
**Companion data:** `../Spreadsheets/15-pilot-join-matrix-welland-rochester.csv` (one row per dataset, 33 rows).

## What this epic is

How a unit of land or a premises is identified in each place, and how the datasets in that place join to each other. The spine key grammar is in `../docs/architecture/parcel-identity-spine.md`. The joining concepts are in `10`, the ledger in `11` (`.md` and `.csv`), the authority and MPAC proposals in `12`. This doc records what a live read of two pilot places says about all of them.

**Rules kept in this study.** Public HTTP GET only (ArcGIS REST `?f=json`, DCAT `data.json`, count and small sample queries with at most 5 records). No bulk download. No keys or logins. No owner-name values read anywhere. MPAC roll stayed `not_licensed` and NPCA-derived MPAC parcel layers were not ingested at the time of this study; superseded by HARD-RULES 4/5 (amended 2026-10-17, #61): MPAC/NPCA data may be pulled, used and published, identifying fields screened at publish. Prior recon is a baseline, not truth. UK is out of scope. Nothing is published. No existing file, workbook or Linear issue was changed.

**Evidence labels.** Every count and field below was read live on **2026-09-30** unless the row says "documented, not re-read". Sample-based join results are stated as `hits/tested` and are indicative, not rates.

## Pilot choice

| | Welland (Ontario, CA) | Rochester (Monroe County, NY, US) |
|---|---|---|
| Why | Roster `07` marks it the engine test municipality. Two independent business registers (city directory and Niagara NEI). | Roster `07` marks it the best-evidenced US place: parcels with assessed value, annual snapshots. |
| Grain the spine expects | footprint or address (per spine doc) | parcel |
| Grain the live read supports | **parcel** (found), address, footprint | parcel, address, footprint |
| Publishers involved | City of Welland; Niagara Region (NEI, address, footprints, heritage) | City of Rochester; Monroe County; NYS ITS (statewide layer, does not cover Monroe) |
| Cross-border | none required by v1 | none required by v1 |

## Status

| Item | State | Note |
|---|---|---|
| Phase 1, Welland live study | done 2026-09-30 | 11 city datasets and 4 Region layers read; NPCA noted only |
| Phase 2, Rochester live study | done 2026-09-30 | 15 city, 1 county, 1 state layer read; DCAT scanned for permits and licences |
| Phase 3, synthesis | done 2026-09-30 | this doc; sub-issues are proposed, none created |
| Linear comments on NIA-24 | 3 posted | one per phase |
| Sub-issues | **proposed, unticked** | for the owner to approve; see checklist |
| G2 | not met | needs the owner decisions below, then fixtures merged (PR #13 or replacement) |

## Welland — findings (live 2026-09-30)

**Headline.** Welland has a public parcel fabric, `Parcel_No`-keyed, that no catalog lists. `open.welland.ca/data.json` has 72 datasets and none is a parcel fabric. The layer sits in the city's own ArcGIS Server folder `Base`, which is reachable without a token. The spine doc, `07`, `11` (LG-118), `12` section 4 and the Welland fixture all say Welland has no parcel fabric. That statement is out of date for the live server, and it is independent of the NPCA question. Licence text for the layer was not found, so admission is a the owner decision.

| Dataset | Endpoint (under `arcgisweb.welland.ca/serverprodpub/rest/services/` unless noted) | Geometry | Records | Candidate identifier fields | Flags |
|---|---|---|---|---|---|
| Parcels public cache | `Base/IMS_Parcels_Public_Cache/MapServer/0` | polygon | 23,541 | `Parcel_No` (unique int, 10 to 96,293); `Subdiv_Lot_No`, `Subdiv_Block_No`, `Subdiv_Plan_No`; `Address`, `Range` (1,506 null) | no owner, no ARN; licence not found; not in DCAT |
| IMS parcels (sibling) | `Base/IMS_Parcels/MapServer/0`, `Base/Parcels_NoOwners/MapServer/0` | polygon | 23,541 each | `Parcel_No`; `Civic_Nos`; `Municipality_Id` (`CoW`); `Street_Name_Id` | `Owner_Class`; free-text `Comment` and `Research` not sampled (possible PII); the "NoOwners" name still carries `Owner_Class` |
| Civic address points | `OpenData/OPENDATA_Civic_Addresses_Active/MapServer/0` | point | 22,461 | `AddId` (22,461 distinct); `Address` (22,448 distinct); `Civic_No`, `Suffix`, `StName` | none |
| Building footprints | `OpenData/OPENDATA_Active_Building_Footprints/MapServer/0` | polygon | 26,027 | `AddId` (2,214 null; 16,847 distinct); `Address` (2,289 null) | no building id |
| Current zoning | `OpenData/OPENDATA_Consolidated_Zoning/MapServer/2` | polygon | 1,981 | `Zoning` (139 distinct, 4 null); `ZoneCat`, `ZoneCatSym`, `ZoneDesc`; no id | 73 polygons with an industrial `ZoneCat` |
| Business directory | `OpenData/OPENDATA_Business_Layers/MapServer/2` (table), `/0` (871 points) | none / point | 923 | `ID` (923 distinct); `Address` (11 null); `SectorDescription` | phone, fax, email, website fields present, not sampled |
| Heritage parcels | `OpenData/OPENDATA_Heritage_Parcels/MapServer/0` | polygon | 31 | `Parcel_No` (30 distinct); `Bylaw_No`; `Year_Desig` | none |
| Site plans | `OpenData/OPENDATA_Plan_SitePlans_Parcels/MapServer/0` | polygon | 721 | `Parcel_No` (411 distinct, 0 null); `CivicAddr`; `MajorUse` | none |
| Building permits pre-May 2019 | `OpenData/OPENDATA_Building_Permits_Pre_May_2019/MapServer/1` | none (table) | 8,862 | `PermitID`, `PermitNo` (both 8,862 distinct); `parcelno` (52 null); `Address`; `GrossAreaSqFt` | 206 rows with an Industrial `UseCategory`; later permits need a token |
| Business licences, type by year | `OpenData/OPENDATA_Business_License_Type_Year/MapServer/1` | none | **0** | `id`, `Description`, `Year`, `Bus_count` | aggregate only, and empty today |
| CityView build permits parcels | `serverprod/.../Building/CityView_BuildPermits_Parcels/MapServer/4` | unknown | not read | not read | listed in DCAT; **Token Required** |
| Niagara Consolidated NEI | `services1.arcgis.com/WxiLK82TWf8W3O3f/arcgis/rest/services/OpenData_Consolidated_NEI_Opendata/FeatureServer/45` | point | 98,065; Welland 9,741 over 8 editions (2016-2019, 2022-2025); 1,299 each in 2022 and 2025; 1,605 distinct `nei_id` in Welland | `nei_id` (no nulls) + `Year`; `municipality`; `businessstreetnumber`, `businessstreetname`, `businessunit`; `primarynaics`; `indoorgfa`; `sizerangeemployees` | `businessname`, `businesswebsite`; no ARN or MPAC field; `indoorgfa` is 0 or null on some Welland rows (4,007 above 0, 304 null) |
| Region address points | same service, `OpenData_Address_Points/FeatureServer/43` | point | 208,079; Welland 24,412 | `GSmartID` (no nulls); `Full_StreetNo`, `StreetName`, `Unit`, `Municipality` | none |
| Region building footprints | `OpenData_Building_Footprints/FeatureServer/38` | polygon | 225,999 | `UniqueID`, `GlobalID` | no municipality field; Welland subset not measured |
| Region heritage points | `OpenData_Designated_Heritage_Properties/FeatureServer/35` | point | 318; Welland 27 | none | Welland polygons are 31 vs 27 points here; not reconciled |
| NPCA Assessment Parcels and Cityview | `services1.arcgis.com/d0ZCwU7eGKVeNiEE` | polygon | 284,250 and 265,717 | `ARN`, `ASSESSMENT`, `PropCode`, `Owner` | **documented, not re-read.** MPAC-derived. Not ingested. |

**Coordinate system.** The Welland layers read (parcels, footprints, zoning, civic points) report EPSG:26917. The Region NEI was requested with `outSR=26917` for the spatial tests.

## Rochester — findings (live 2026-09-30)

**Headline.** The city parcel id is a 20-character SBL. Monroe County's `countysbl` is the same 20 characters with a 6-digit prefix (`261400` for the city). The statewide layer has the same 26-character composite (`SWIS_SBL_ID`) but has 0 features for Monroe. Print keys are zero-padded in the city and county layers and unpadded in the statewide layer.

| Layer | Endpoint | Geometry | Records | Identifier fields | Flags |
|---|---|---|---|---|---|
| City `TaxParcel2024` | `maps.cityofrochester.gov/server2/rest/services/Open_Data/TaxParcel2024/FeatureServer/0` | polygon | 64,828 | `PARCELID` (20 chars; 64,825 distinct); `PRINTKEY` (64,825 distinct); `SITEADDRESS`; `CLASSCD`; `BISZONING` (1,067 null) | `OWNERNME1`, `PSTLADDRESS` present, not sampled; class 7xx: 365 (710: 361) |
| City snapshots 2014-2023 | `server2/.../TaxParcel{year}/FeatureServer/0` | polygon | 65,923; 65,794; 65,784; 65,486; 65,351; 65,211; 65,076; 65,002; 64,920; 64,826 | `PARCELID`, `PRINTKEY` (fields read for 2018-2024) | owner fields as above |
| City tax parcels open data (live) | `maps.cityofrochester.gov/server/rest/services/Open_Data/Tax_Parcels_Open_Data/FeatureServer/0` | polygon | 64,709 | `PARCELID`, `PRINTKEY` | **no owner fields** |
| City vacant land | `server/.../Tax_Parcels_Vacant_Land_Open_Data/FeatureServer/3` | polygon | 4,728 (catalog says 4,730) | `PARCELID`, `PRINTKEY` | owner fields present |
| City owned land | `server/.../Tax_Parcels_City_Owned_Land_Open_Data/FeatureServer/4` | polygon | 2,976 | `PARCELID`, `PRINTKEY` | owner fields present |
| City housing inventory | `server/.../NBD/Housing_Inventory/FeatureServer/0` | polygon | 3,387 | `SBL` (20), `GISSBL` (10-char variant), `PRINTKEY` | none seen |
| Address parcels lookup | `server/.../App_PropertyInformation/Address_Parcels_Lookup/FeatureServer/0` | point | 134,137 | `AddressPointID` (`MONR...`), `NYSStreetID`, `PARCELID` (164 null), `PRINTKEY` | owner fields present |
| Tax parcel centroids | `server/.../Geodata/TaxParcel_Centroids/FeatureServer/0` | point | 64,709 | `PARCELID` (0 null) | owner fields present |
| Building footprints (live) | `server/.../Open_Data/Building_Footprint_Open_Data/FeatureServer/0` | polygon | 98,449 | `OBJECTID`, `GlobalID`; no parcel id, no address | `DEMOLISHED_TF`, `DATE_DEMOLISHED` |
| Zoning districts | `server/.../Zoning_Districts_Open_Data/FeatureServer/0` | polygon | 421 | `LABEL` (74 distinct), `CATEGORY` (13, includes Industrial) | none |
| Development ready sites | `server/.../NBD/Development_Ready_Sites/FeatureServer/1` | polygon | 10 | `SBL_1` (print-key text, may list several) | personal fields present (withheld) |
| 311 case data | `services2.arcgis.com/yoz1ZtATTCokO9nU/arcgis/rest/services/311_Case_Data/FeatureServer/0` | point | 51,721 | none usable | no address number, no parcel id |
| Assessment tables 1996, 2012 | same org: `Fixed_Assessment_Snapshot_1996`, `City_of_Rochester_Tax_Parcel_Records_Snapshot_2012` | none | 68,279; 66,254 | `SBL`, `SBL20` stored as floating point | see joins: not joinable by id |
| Parcel lineage | same org: `ParcelHistory/FeatureServer/0` | polygon | 788 | `PARCELID`, `NewSBL`, `Split_Merge` | `OWNERNME1` present |
| Monroe `Parcels_Public` | `maps.monroecounty.gov/server/rest/services/Hosted/Parcels_Public/FeatureServer/0` | polygon | 267,962 | `countysbl` (26 chars; 267,904 distinct); `printkey` (267,357 distinct); `swis` (municipality **name**, 32 distinct, 544 null); `rollyear` (2026 sampled) | no owner field; class 7xx: 868 |
| NYS Tax Parcels Public | `services6.arcgis.com/EbVsqZ18sv1kVJ3k/arcgis/rest/services/NYS_Tax_Parcels_Public/FeatureServer/1` | polygon | 3,827,530 over 38 counties | `SBL` (20), `PRINT_KEY`, `SWIS` (6-digit), `SWIS_SBL_ID` (26), `MUNI_PARCEL_ID`, `ROLL_YR`, `SPATIAL_YR` | `PRIMARY_OWNER`, `ADD_OWNER`, `MAIL_*` present, not sampled. Monroe 0, Niagara 0. Erie 370,424; Genesee 28,266; Chautauqua 88,396; Wyoming 23,530. |

**Not in the catalog.** `data.cityofrochester.gov` is an ArcGIS Hub (its `/resource/` path redirects to `hub.arcgis.com/legacy`), not Socrata. Its DCAT feed has 281 entries and 267 distinct titles. None is a permits, code violations, certificate-of-occupancy or business-licence dataset. Related: 311 Case Data, Code Enforcement Inspector Areas, Kiva business locations (a web map; no queryable layer found), Commercial Corridor Business Data (a web app). The ArcGIS Online org `services2.arcgis.com/yoz1ZtATTCokO9nU` lists 134 services; none matches permit, violation or licence names.

## Recommended spine key mapping (a)

Grammar: `hm:{country}:{region}:{jurisdiction}:{grain}:{local}`. Native keys stay in `native_keys`. These are proposals for the owner to approve; nothing is encoded.

| Place and grain | Proposed key | Source field | Normalisation | Native keys kept |
|---|---|---|---|---|
| Welland, parcel | `hm:ca:on:welland:parcel:{Parcel_No}` e.g. `hm:ca:on:welland:parcel:11205` | `IMS_Parcels_Public_Cache.Parcel_No` | integer as text, no zero padding | `parcel_no` |
| Welland, address | `hm:ca:on:welland:address:{AddId}` | `OPENDATA_Civic_Addresses_Active.AddId` | integer as text | `add_id`; Region `GSmartID` is a separate key, not the same id |
| Welland, footprint | **no native key.** Options: (1) mint from a stable content hash of geometry, (2) do not mint until the publisher supplies an id. `AddId` is not unique per footprint (26,027 rows, 16,847 distinct non-null values). | none | none | `add_id` as a foreign key only |
| Welland, premises (activity) | not a spine unit. `nei_id` joins to the spine by address or spatial method and stays a native key on the activity band. | `nei_id` + `Year` | integer; use the lowercase name for all editions | `nei_id`; directory `ID` |
| Rochester, parcel | `hm:us:ny:rochester:parcel:{SBL20}` e.g. `hm:us:ny:rochester:parcel:04762000010220000000` | City `PARCELID` | keep the 20 characters as text; never store as a number (the 1996 and 2012 tables show the damage) | `printkey` (padded `047.62-1-22`); Monroe `countysbl` (26 chars); `swis` = `261400` (inferred) |
| Rochester, address | `hm:us:ny:rochester:address:{AddressPointID}` | `Address_Parcels_Lookup.AddressPointID` | text as published (`MONR208416`) | `NYSStreetID`; `PARCELID` FK |
| Rochester, footprint | `hm:us:ny:rochester:footprint:{GlobalID}` | `Building_Footprint_Open_Data.GlobalID` | lower-case, braces stripped (proposal; not tested) | none |
| Other Monroe municipalities (later) | `hm:us:ny:{municipality-slug}:parcel:{SBL20}` or the county slug; see open decision 3 | `countysbl` minus its 6-digit prefix | prefix goes to a `swis` native key after a name-to-code table exists | `countysbl` |

**Why the Rochester local token is the 20-character SBL and not the print key.** The spine doc's illustration uses a print-key-shaped local (`SYN-999.00-1-1.1`). Print keys are padded differently in each layer (`047.62-1-22` city and county, `47.18-1-33` and `3.-1-1` statewide), and Monroe `printkey` has 267,357 distinct values in 267,962 rows. The SBL20 has the same shape in all three layers and has 3 fewer distinct values than rows in the city layer (64,825 of 64,828). A print key can be derived from it for display. This departs from the illustration and is flagged as an open decision.

**Normalisation rules that the reads support.**
1. New York: compare on `SWIS6 + SBL20` (26 chars). Never compare print keys across layers. Never compare `swis` between Monroe (names) and the statewide layer (codes).
2. New York: `SBL20` is text. Leading zeros matter (`04762...`), and the float-stored tables cannot be repaired by padding.
3. New York duplicates: 64,828 city rows vs 64,825 distinct `PARCELID`; 267,962 Monroe rows vs 267,904 distinct `countysbl`. Decide how to fold repeated ids (multi-part parcel or condo) before minting.
4. Ontario: `Parcel_No` is a municipal id, not an ARN. Do not label it "roll number". No ARN is published in any open Welland layer.
5. Ontario: the Region publishes `municipality` as `Niagara on the Lake` and `St Catharines`; the slug is minted separately (`niagara-on-the-lake`, `st-catharines`).

## Joins matrix (b)

Exactness scale: **exact** (shared identifier, tested); **exact-if-present** (shared identifier with nulls or misses); **fuzzy-spatial**; **fuzzy-text**; **impossible** (no shared key and no reliable geometry or text). Ratios are `hits/tested` from small samples.

### Welland

| From | To | Method | Exactness | Result and known failure modes |
|---|---|---|---|---|
| Heritage parcels | Parcels | `Parcel_No` = `Parcel_No` | exact-if-present | 17/20; misses undiagnosed (11680, 20199, 14391 not in the fabric) |
| Site plans | Parcels | `Parcel_No` = `Parcel_No` | exact-if-present | 25/30 |
| Permits (pre-May 2019) | Parcels | `parcelno` = `Parcel_No` | exact-if-present | 23/30; 52 permits have null `parcelno`; address text is upper-case and abbreviated (`LEA CRES`) so it is a poor fallback |
| Footprints | Civic points | `AddId` = `AddId` | exact-if-present | 29/30 with identical address text; 2,214 footprints have null `AddId` |
| Footprints | Parcels | centroid in polygon | fuzzy-spatial | 18/18 in exactly one parcel; multi-parcel or straddling footprints untested |
| Footprints | Zoning | centroid in polygon | fuzzy-spatial | 18/18 in one polygon; zoning polygons overlap and have nulls (800 Niagara Street returned two, one null) |
| Civic points | Parcels | none by id; spatial or address text | fuzzy | parcel `Address` can be a range (`800-816 Niagara Street`), so text equality fails; 1,506 parcels have null address |
| NEI | Civic points | address text (`businessstreetnumber` + `businessstreetname`) | fuzzy-text | 27/30 case-insensitive; misses like `14 King Street`, `815 Ontario Street` (city has Ontario Road) and a double space |
| NEI | Parcels | point in polygon | fuzzy-spatial | 15/15 landed in a parcel; 4 of the 15 premises share one parcel (`800-816 Niagara Street`), so parcel to premises is one to many |
| NEI | Zoning | point in polygon | fuzzy-spatial | 15/15 landed in a polygon; some return two |
| NEI | Business directory | none | impossible | no shared key; documented offline agreement about 29% (not re-read) |
| Business directory | Civic points | address text | fuzzy-text | 11/15; misses `Unit 6`, `46-185`, `St.` |
| Business directory | Parcels | point in polygon (871 points) | fuzzy-spatial | not tested |
| NEI (any edition) | NEI (other edition) | `nei_id` (+ `Year`) | exact | consolidated layer uses one lowercase name for all 8 editions; the earlier `NEI_ID` casing trap is absent here |
| Region address points | City civic points | none | impossible by id | `GSmartID` vs `AddId`; 24,412 vs 22,461 Welland points |
| Region footprints | City footprints | spatial | fuzzy-spatial | not tested; no municipality field on the Region layer |
| Region heritage points | City heritage parcels | address text | fuzzy-text | 27 points vs 31 polygons; not tested |
| Business licences | anything | none | impossible | table has 0 rows |
| NPCA parcels | anything | none attempted | not ingested by rule | documented only |

### Rochester

| From | To | Method | Exactness | Result and known failure modes |
|---|---|---|---|---|
| City parcels 2024 | Monroe `Parcels_Public` | `countysbl` = `261400` + `PARCELID` | exact | 45/45, print key identical in all 45; Monroe has 64,655 rows with the prefix and 26 city-prefixed rows have null `swis` |
| City parcels 2024 | City parcels (other year) | `PARCELID` | exact if the parcel did not split or merge | counts vary 64,826 to 65,923; lineage table covers only 788 changes |
| City parcels 2024 | City open-data parcels (live) | `PARCELID` | expected exact, not tested | 64,828 vs 64,709 rows |
| Address lookup | City parcels | `PARCELID` | exact-if-present | 21/21; 164 lookup rows have null `PARCELID`; many addresses per parcel |
| Housing inventory | City parcels | `SBL` = `PARCELID` | exact-if-present | 14/15; `GISSBL` is a different 10-char form |
| Vacant land, city owned, centroids | City parcels | `PARCELID` | expected exact, not tested | derived from the same parcel service family |
| Development ready sites | City parcels | parse `SBL_1` then match `PRINTKEY` | fuzzy-text | free text, may list several parcels separated by semicolons |
| Footprints | City parcels | centroid in polygon | fuzzy-spatial | 10/10 in one parcel; footprints carry no id or address |
| Footprints | Zoning districts | centroid in polygon | fuzzy-spatial | 10/10 in one polygon |
| City parcels | Zoning districts | `BISZONING` = `LABEL` | fuzzy-text | 92 distinct `BISZONING` vs 74 distinct `LABEL`; forms differ (`C1` vs `C-1`, `CCD`, `IPD`, `URD` variants). Use spatial, and keep `BISZONING` as a snapshot-vintage attribute. |
| City parcels | 311 case data | none | impossible by id | no address number or parcel id on 311 |
| Assessment tables 1996-2012 | City parcels 2024 | `SBL`/`SBL20` | **impossible by id** | stored as floating point (`4.62800001001e+18`); 0/5 and 0/12 matched after zero-padding; needs address plus house number or a rebuild rule |
| Monroe `Parcels_Public` | NYS Tax Parcels Public | `SWIS` + `SBL` | impossible for Monroe | 0 Monroe features in the state layer; Monroe `swis` holds names |
| Any Rochester layer | permits, violations, licences | none | not in coverage | no such dataset in the DCAT feed |
| NYS statewide, Erie and others | each other | `SWIS_SBL_ID` | exact within a county | not a pilot layer; Erie sample verified the 26-char shape |

## Concepts and ledger rows: confirmed, contradicted, missing (c)

**Confirmed live 2026-09-30**
- `LG-006`, `LG-007` City `PARCELID` (20 chars) and padded `PRINTKEY`.
- `LG-004` Monroe `countysbl` is 26 chars. **Upgrade the equivalence note:** for city parcels, `countysbl` = `261400` + `PARCELID` in 45/45 tests. `LG-004`'s relation `near` could become `same` for the city rows.
- `LG-002`, `LG-005`, `LG-007` Padding: city and Monroe padded (`047.62-1-22`); state unpadded (`47.18-1-33`, `3.-1-1`).
- `LG-020` Monroe `swis` holds names: 32 distinct names, 544 null.
- `LG-001`, `LG-003` State `SBL` (20) and `SWIS_SBL_ID` (26): Erie sample `145601` + `04718000010330000000`.
- `LG-030`, `LG-031` `nei_id` is present, no nulls, in all 8 consolidated editions under one lowercase name.
- `LG-032` Welland directory `ID`: 923 distinct; still no shared key with the NEI.
- `LG-057` Welland `Zoning` has a null-attribute polygon: 4 null.
- `LG-064` Rochester `BISZONING` exists and is null on 1,067; its vocabulary differs from the zoning layer `LABEL`.
- `LG-093` Region heritage: 318 points (27 in Welland).
- `LG-094` Erie 700-series: 1,159 parcels (denominator re-read; `GFA` count not re-read).
- `LG-079` Monroe 267,962 parcels.
- `LG-072` Monroe `propertyclass` integer; 868 in the 700-series.

**Evidence upgrades (documented to live)**
- `LG-097` `indoorgfa` is present in the consolidated NEI field list. Welland rows: 4,007 above 0, 304 null, the rest 0.

**Contradicted or out of date**
- `LG-118` says the Welland heritage polygons are "the only parcel-shaped geometry Welland's open data offers" and that `Parcel_No` values were not read. `Parcel_No` values were read and join to a 23,541-parcel public fabric (17/20).
- `LG-054` says Welland licences are counts by type and year. The table has **0 rows** today.
- `LG-042`, `LG-048` fine as written; values not re-sampled.
- The roster `07` describes Rochester as `socrata`: it is an ArcGIS Hub.
- The roster `07` says the Welland origin server was down on 2026-08-22: it answers today.

**Missing from the ledger and the concept list**
- Address-point id: Welland `AddId`, Rochester `AddressPointID` and `NYSStreetID`, Region `GSmartID` (in the ledger only as a row id trap, `LG-016`). `civic_address` covers text, not the id. Candidate new concept, or a rule that says which existing concept it maps to.
- Permit register key and its parcel foreign key: `PermitID`, `PermitNo`, `parcelno`. Closest concept is `regulatory_activity_register`; no row.
- Footprint or building id: Region `UniqueID`, Rochester `GlobalID`. `publisher_row_id` would swallow both; decide.
- Parcel foreign key on overlay and event layers: `Parcel_No` on heritage and site plans. `parcel_gis_key` fits; no rows.
- Split and merge lineage: `NewSBL`, `Split_Merge`.
- SBL stored as a float (`SBL`, `SBL20` in the 1996 and 2012 tables): a trap row on `assessment_roll_key`.
- `SBL_1` free text with several parcels; `GISSBL` 10-char variant.
- `Municipality_Id` (`CoW`) on Welland IMS parcels.
- Owner-class fields: `Owner_Class` (Welland), `OWNERSHIPCODE` (Rochester) next to `owner_category`.
