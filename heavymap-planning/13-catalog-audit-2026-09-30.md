# Catalog audit, 2026-09-30

## Introduction

This is a read-only data-quality audit of `09-per-jurisdiction-dataset-catalog.xlsx` (README says v9). A copy was taken to /tmp and read with openpyxl in read-only mode. The original workbook and all other existing files were not changed. No network calls were made, so every check is a file check. Anything that needs the live portals is marked "live re-check" in the fix plan.

Sheets and row counts (header excluded): Counties 1226, Municipalities 1004, Cross-Cutting Regional 1849. Total 4079 dataset rows. The README v9 note says the catalog total is 4,020 rows; the sheets hold 4079, which is 59 more.

Counties and Municipalities have 25 columns; Cross-Cutting Regional has 21 (it has dataset_id, working_name, coverage_codes, geography_coverage, status_in_product and priority_band instead of the jurisdiction, country, format, record_count, last_verified, mcs_dataset_id and relevance_match columns).

The check produced 9591 problem flags on 3799 distinct rows (3799 of 4079 rows, 93.1%). Flags are per cell and per rule, so one row can carry several. Some flags are heuristics (marked "candidate" or "heuristic") and will include false positives. Every flag is listed in `13-catalog-audit-2026-09-30-problems.csv`.

Row numbers in this report and in the CSV are Excel row numbers (header is row 1, first data row is row 2).

### Method notes and assumptions

- The README does not list the 16 domain_primary values by name. The 16 names were taken from the data: the values used in the workbook other than "Unclassified" number exactly 16. "Unclassified" is used 1552 times and is treated as an undocumented 17th value.
- sensitivity_flag = 'none' and access_method = 'none' are legitimate documented values and are counted as filled. All other blank, null, 'nan', 'None', 'n/a' and whitespace-only cells count as blank. Cells holding the string 'nan' or 'None' in any column: 0 found. Cells holding 'n/a': record_count 4 (Counties) and 7 (Municipalities); licence 2 and 7; alternative_access 1 (Counties).
- temporal_nature = 'none' appears on 2 Counties rows (both are the shifted rows). It is not in the README vocabulary, which only lists the allowed values for the other columns; the temporal_nature vocabulary used here (unspecified, dated_snapshot, current_ongoing, historical_static, annual_recurring) was taken from the data.
- The README-described relevance rule: relevance_match on reviewed_not_relevant rows is filled on 722 rows. The README does not say it must be blank there, so this is reported here as an observation and not flagged as a problem.
- Mojibake check: searched for the patterns â€, Ã, Â, U+FFFD and private-use glyphs, and for stray question marks inside text. No classic UTF-8 mojibake found. 4 cells contain the private-use glyph U+F0B7 (a Word bullet). Question marks inside URLs are normal query strings and were ignored. Question marks inside free text (58 cells, mostly Cross-Cutting descriptions) were sampled by eye and looked like ordinary punctuation or URL query fragments in prose, not corruption. Real curly quotes and dashes (211 cells) are correctly encoded.
- Workbook opened read-only from a copy, so dates read as text exactly as stored.

## Per-column results

Fill % is the share of cells that are not blank under the rule above. "Issue cells" is the number of problem flags attached to that column in the CSV, all rules combined. Verdict is "complete" when fill is at least 98% and issue cells are under 1% of rows, otherwise "needs work". Columns with legitimately optional content (for example alternative_access, domain_tags) are judged on issues only and noted.

| Sheet | Column | Fill % | Blank cells | Distinct values | Issue cells | Verdict |
|---|---|---|---|---|---|---|
| Counties | jurisdiction_id | 100.0 | 0 | 14 | 0 | complete |
| Counties | jurisdiction_name | 100.0 | 0 | 22 | 25 | needs work |
| Counties | country | 100.0 | 0 | 2 | 0 | complete |
| Counties | dataset_name | 100.0 | 0 | 1196 | 3 | complete |
| Counties | category | 100.0 | 0 | 14 | 24 | needs work |
| Counties | description | 33.7 | 813 | 396 | 12 | complete (optional) |
| Counties | format | 99.9 | 1 | 25 | 19 | needs work |
| Counties | public_url | 99.1 | 11 | 1154 | 362 | needs work |
| Counties | access_method | 100.0 | 0 | 11 | 452 | needs work |
| Counties | alternative_access | 1.1 | 1212 | 16 | 0 | complete (optional) |
| Counties | record_count | 30.1 | 857 | 237 | 102 | needs work |
| Counties | licence | 32.1 | 832 | 24 | 474 | needs work |
| Counties | last_verified | 96.9 | 38 | 6 | 1226 | needs work |
| Counties | source_of_finding | 100.0 | 0 | 65 | 0 | complete |
| Counties | review_status | 100.0 | 0 | 7 | 13 | needs work |
| Counties | mcs_dataset_id | 3.1 | 1188 | 39 | 2 | complete (optional) |
| Counties | relevance_match | 62.5 | 460 | 355 | 276 | needs work |
| Counties | domain_primary | 97.2 | 34 | 18 | 277 | needs work |
| Counties | domain_tags | 6.0 | 1152 | 19 | 2 | complete (optional) |
| Counties | domain_confidence | 97.4 | 32 | 6 | 66 | needs work |
| Counties | granularity | 97.4 | 32 | 10 | 291 | needs work |
| Counties | temporal_nature | 97.2 | 34 | 7 | 34 | needs work |
| Counties | sensitivity_flag | 100.0 | 0 | 8 | 71 | needs work |
| Counties | suggested_use_case | 81.5 | 227 | 48 | 0 | complete (optional) |
| Counties | catalogue_url | 84.2 | 194 | 752 | 1 | complete (optional) |
| Municipalities | jurisdiction_id | 100.0 | 0 | 17 | 0 | complete |
| Municipalities | jurisdiction_name | 100.0 | 0 | 17 | 0 | complete |
| Municipalities | country | 100.0 | 0 | 2 | 0 | complete |
| Municipalities | dataset_name | 100.0 | 0 | 996 | 5 | complete |
| Municipalities | category | 100.0 | 0 | 13 | 142 | needs work |
| Municipalities | description | 6.0 | 944 | 54 | 7 | complete (optional) |
| Municipalities | format | 100.0 | 0 | 19 | 12 | needs work |
| Municipalities | public_url | 99.4 | 6 | 964 | 359 | needs work |
| Municipalities | access_method | 100.0 | 0 | 11 | 756 | needs work |
| Municipalities | alternative_access | 0.3 | 1001 | 4 | 0 | complete (optional) |
| Municipalities | record_count | 16.9 | 834 | 109 | 41 | needs work |
| Municipalities | licence | 4.8 | 956 | 14 | 216 | needs work |
| Municipalities | last_verified | 98.1 | 19 | 6 | 1004 | needs work |
| Municipalities | source_of_finding | 100.0 | 0 | 36 | 0 | complete |
| Municipalities | review_status | 100.0 | 0 | 6 | 0 | complete |
| Municipalities | mcs_dataset_id | 2.2 | 982 | 21 | 0 | complete (optional) |
| Municipalities | relevance_match | 85.0 | 151 | 275 | 19 | needs work |
| Municipalities | domain_primary | 100.0 | 0 | 17 | 277 | needs work |
| Municipalities | domain_tags | 7.5 | 929 | 15 | 0 | complete (optional) |
| Municipalities | domain_confidence | 100.0 | 0 | 3 | 0 | complete |
| Municipalities | granularity | 100.0 | 0 | 8 | 99 | needs work |
| Municipalities | temporal_nature | 100.0 | 0 | 5 | 0 | complete |
| Municipalities | sensitivity_flag | 100.0 | 0 | 7 | 36 | needs work |
| Municipalities | suggested_use_case | 73.7 | 264 | 43 | 0 | complete (optional) |
| Municipalities | catalogue_url | 78.9 | 212 | 788 | 0 | complete (optional) |
| Cross-Cutting Regional | dataset_id | 100.0 | 0 | 1844 | 5 | complete |
| Cross-Cutting Regional | working_name | 100.0 | 0 | 1832 | 18 | complete |
| Cross-Cutting Regional | category | 100.0 | 0 | 9 | 0 | complete |
| Cross-Cutting Regional | description | 98.9 | 21 | 1189 | 897 | needs work |
| Cross-Cutting Regional | coverage_codes | 99.8 | 4 | 23 | 4 | complete |
| Cross-Cutting Regional | geography_coverage | 100.0 | 0 | 37 | 0 | complete |
| Cross-Cutting Regional | public_url | 99.9 | 1 | 1832 | 43 | needs work |
| Cross-Cutting Regional | access_method | 100.0 | 0 | 11 | 5 | complete |
| Cross-Cutting Regional | licence | 100.0 | 0 | 18 | 277 | needs work |
| Cross-Cutting Regional | status_in_product | 100.0 | 0 | 9 | 0 | complete |
| Cross-Cutting Regional | priority_band | 99.2 | 14 | 4 | 14 | complete |
| Cross-Cutting Regional | review_status | 100.0 | 0 | 6 | 1 | complete |
| Cross-Cutting Regional | source_of_finding | 100.0 | 0 | 17 | 0 | complete |
| Cross-Cutting Regional | domain_primary | 99.2 | 14 | 13 | 1297 | needs work |
| Cross-Cutting Regional | domain_tags | 0.4 | 1841 | 9 | 1 | complete (optional) |
| Cross-Cutting Regional | domain_confidence | 99.2 | 14 | 4 | 28 | needs work |
| Cross-Cutting Regional | granularity | 99.2 | 14 | 8 | 247 | needs work |
| Cross-Cutting Regional | temporal_nature | 99.2 | 14 | 6 | 14 | complete |
| Cross-Cutting Regional | sensitivity_flag | 99.6 | 7 | 6 | 32 | needs work |
| Cross-Cutting Regional | suggested_use_case | 99.1 | 17 | 16 | 0 | complete |
| Cross-Cutting Regional | catalogue_url | 98.2 | 33 | 1729 | 0 | complete |

Issue cells with a column name that is not a header (2 rows): SHIFTED_COLUMNS, recorded under "domain_tags..suggested_use_case". Also recorded under real column names: MCS_DATASET_NOT_IN_CATALOG is on the MCS sheet (1). These are not in the table above.

## Low-cardinality columns: distinct values and counts

### Counties

- **jurisdiction_id**: hamilton = 473; monroe_county_ny = 276; haldimand_county = 227; niagara_region = 123; brant_county = 38; norfolk_county = 28; niagara_county_ny = 14; genesee_county_ny = 11; erie_county_ny = 9; chautauqua_county_ny = 7; cattaraugus_county_ny = 6; wyoming_county_ny = 6; orleans_county_ny = 6; halton_region = 2
- **country**: CA = 891; US = 335
- **category**: other = 786; environmental_constraint = 102; transportation = 91; boundary = 80; business_registry = 33; soils = 32; assessed_value = 26; building_footprint = 24; zoning = 17; parcel = 14; address = 11; land_use = 8; parcel + environmental_constraint = 1; parcel + assessed_value = 1
- **access_method**: rest_bulk = 573; unknown = 452; ckan = 98; other = 40; file = 34; blocked = 19; web_viewer_only = 5; rest = 2; none = 1; fee_purchase = 1; dcat = 1
- **alternative_access**: (blank) = 1211; discovery via CKAN niagaraopendata.ca = 1; also own MapServer at sm.brant.ca/arcgis/rest/services/PublicData/Coun = 1; n/a = 1; county's own ECIMS site (www3.erie.gov/gis) also offers a free annual  = 1; consider a direct bulk-licence request to the county's own RP office i = 1; check for an SDG bulk/API tier (see 08-...xlsx Alternatives sheet) = 1; found via portal item search (sharing/rest/search?q=parcel), not the o = 1; Query: SELECT ... FROM mapunit/component WHERE areasymbol='NY029' -- s = 1; Query: SELECT ... FROM mapunit/component WHERE areasymbol='NY664' -- s = 1; Query: SELECT ... FROM mapunit/component WHERE areasymbol='NY013' -- s = 1; Query: SELECT ... FROM mapunit/component WHERE areasymbol='NY009' -- s = 1; Query: SELECT ... FROM mapunit/component WHERE areasymbol='NY121' -- s = 1; Query: SELECT ... FROM mapunit/component WHERE areasymbol='NY037' -- s = 1; Query: SELECT ... FROM mapunit/component WHERE areasymbol='NY073' -- s = 1; Query: SELECT ... FROM mapunit/component WHERE areasymbol='NY055' -- s = 1
- **last_verified**: 2026-09-23 = 794; 2026-09-25 = 355; (blank) = 38; 2026-08-18/22/23 (prior recon) = 20; 2026-09-23 (this session) = 18; 2026-09-25 (access regression found) = 1
- **review_status**: reviewed_relevant = 477; reviewed_not_relevant = 377; reviewed_context = 208; reviewed_unclear = 68; curated_relevant = 47; admitted_in_mcs = 36; discovered_unreviewed = 13
- **domain_primary**: Infrastructure & Utility Networks = 228; Unclassified = 193; Property, Land Use & Zoning = 179; Environment, Ecosystem & Natural Hazards = 141; Transportation, Mobility & Traffic Operations = 87; Recreation, Culture & Public Amenities = 76; Financial, Fiscal & Taxation = 49; Demographics & Population = 41; (blank) = 34; Business, Employment & Economic Development = 28; Public Safety & Emergency Services = 28; Health & Human Services = 27; Governance & Civic Participation = 27; Social Vulnerability, Equity & Poverty = 21; Education & Institutions = 19; Meta / Portal / Administrative Reference = 18; Municipal Administration & Corporate Performance = 16; Heritage, Historic & Archaeological = 14
- **domain_tags**: (blank) = 1152; Governance & Civic Participation = 15; Recreation, Culture & Public Amenities = 14; Business, Employment & Economic Development = 7; Financial, Fiscal & Taxation = 6; Environment, Ecosystem & Natural Hazards = 5; Heritage, Historic & Archaeological = 4; Demographics & Population = 4; Education & Institutions = 4; Meta / Portal / Administrative Reference = 3; Business, Employment & Economic Development, Financial, Fiscal & Taxat = 2; Transportation, Mobility & Traffic Operations = 2; high = 2; Transportation, Mobility & Traffic Operations, Education & Institution = 1; Environment, Ecosystem & Natural Hazards, Financial, Fiscal & Taxation = 1; Financial, Fiscal & Taxation, Heritage, Historic & Archaeological = 1; Social Vulnerability, Equity & Poverty = 1; Municipal Administration & Corporate Performance = 1; Heritage, Historic & Archaeological, Recreation, Culture & Public Amen = 1
- **domain_confidence**: high = 471; medium = 451; low = 270; (blank) = 32; parcel_or_property = 1; point_facility = 1
- **granularity**: unspecified = 533; area_or_zone = 300; linear_network = 219; point_facility = 60; jurisdiction_aggregate = 46; (blank) = 32; building_or_structure = 16; parcel_or_property = 15; entity_or_person_level = 3; current_ongoing = 2
- **temporal_nature**: unspecified = 804; current_ongoing = 265; dated_snapshot = 106; (blank) = 32; historical_static = 15; annual_recurring = 2; none = 2
- **sensitivity_flag**: none = 1102; infrastructure_ownership_attribute = 36; individual_health_or_social_data = 27; business_operator_identifier = 24; vulnerable_population_data = 21; property_ownership_pii = 12; employee_hr_data = 2; industrial_siting_and_land_assessment = 2

### Municipalities

- **jurisdiction_id**: niagara_falls_on = 358; rochester_ny = 271; welland = 185; buffalo_ny = 106; brantford = 22; fort_erie = 21; st_catharines = 16; lincoln = 14; notl = 3; port_colborne = 1; thorold = 1; grimsby = 1; pelham = 1; wainfleet = 1; west_lincoln = 1; burlington = 1; niagara_falls_ny = 1
- **jurisdiction_name**: City of Niagara Falls (ON) = 358; City of Rochester = 271; City of Welland = 185; City of Buffalo = 106; City of Brantford = 22; Town of Fort Erie = 21; City of St. Catharines = 16; Town of Lincoln = 14; Town of Niagara-on-the-Lake = 3; City of Port Colborne = 1; City of Thorold = 1; Town of Grimsby = 1; Town of Pelham = 1; Township of Wainfleet = 1; Township of West Lincoln = 1; City of Burlington = 1; City of Niagara Falls (NY) = 1
- **country**: CA = 626; US = 378
- **category**: other = 565; assessed_value = 146; transportation = 100; zoning = 40; business_registry = 33; parcel = 31; boundary = 23; building_footprint = 22; environmental_constraint = 21; land_use = 14; address = 7; building_footprint + transportation = 1; parcel + assessed_value = 1
- **format**: ArcGIS GeoServices REST API = 646; Web Page = 165; Socrata SODA API (JSON; .csv/.geojson also usually work) = 103; file = 21; KML = 13; geojson = 11; - = 9; SHP = 7; geojson/rest = 6; CSV = 6; PDF = 6; csv/json = 3; JPEG = 2; table = 1; shp = 1; directory listing = 1; rest/geojson = 1; derived = 1; RSS = 1
- **access_method**: unknown = 756; socrata = 97; ckan = 45; rest_bulk = 34; blocked = 23; file = 18; rest = 12; web_viewer_only = 8; none = 7; static = 3; derived = 1
- **alternative_access**: (blank) = 1001; opendata.arcgis.com/api/v3/datasets/{itemId}_{layer}/downloads/data ca = 1; www.burlington.ca/opendata (main page) = 1; served by niagara_county_ny row = 1
- **licence**: (blank) = 949; attribution_ok = 22; n/a = 7; OGL 2.0 (Niagara Falls) = 5; OGL 2.0 (Welland) = 4; Municipal Open Data Licence (JS-rendered page, verbatim text not read) = 4; OGL 2.0 (Corp. of the City of St. Catharines) = 3; varies = 3; same custom licence = 2; CC-BY 4.0 / OGL 2.0 (Fort Erie) = 1; OGL 2.0 (Lincoln) = 1; unknown = 1; not established = 1; DCAT licence field contains HTML -- needs a human look = 1
- **last_verified**: 2026-09-23 = 810; 2026-09-25 = 146; 2026-08-18/22/23 (prior recon) = 24; (blank) = 19; 2026-09-23 (this session) = 4; 2026-08-27 (prior recon) = 1
- **review_status**: reviewed_not_relevant = 392; reviewed_context = 256; reviewed_relevant = 205; reviewed_unclear = 96; curated_relevant = 33; admitted_in_mcs = 22
- **domain_primary**: Unclassified = 264; Property, Land Use & Zoning = 202; Demographics & Population = 145; Transportation, Mobility & Traffic Operations = 111; Recreation, Culture & Public Amenities = 54; Financial, Fiscal & Taxation = 50; Environment, Ecosystem & Natural Hazards = 30; Governance & Civic Participation = 25; Meta / Portal / Administrative Reference = 22; Business, Employment & Economic Development = 20; Infrastructure & Utility Networks = 18; Heritage, Historic & Archaeological = 17; Municipal Administration & Corporate Performance = 10; Education & Institutions = 10; Social Vulnerability, Equity & Poverty = 10; Health & Human Services = 9; Public Safety & Emergency Services = 7
- **domain_tags**: (blank) = 929; Financial, Fiscal & Taxation = 20; Environment, Ecosystem & Natural Hazards = 11; Recreation, Culture & Public Amenities = 7; Business, Employment & Economic Development = 6; Governance & Civic Participation = 6; Demographics & Population = 6; Meta / Portal / Administrative Reference = 6; Transportation, Mobility & Traffic Operations = 5; Education & Institutions = 3; Heritage, Historic & Archaeological = 1; Demographics & Population, Education & Institutions = 1; Municipal Administration & Corporate Performance = 1; Education & Institutions, Meta / Portal / Administrative Reference = 1; Social Vulnerability, Equity & Poverty = 1
- **domain_confidence**: medium = 467; low = 345; high = 192
- **granularity**: unspecified = 507; jurisdiction_aggregate = 181; area_or_zone = 128; linear_network = 96; parcel_or_property = 36; point_facility = 26; building_or_structure = 20; entity_or_person_level = 10
- **temporal_nature**: unspecified = 577; dated_snapshot = 288; historical_static = 126; current_ongoing = 12; annual_recurring = 1
- **sensitivity_flag**: none = 957; property_ownership_pii = 13; infrastructure_ownership_attribute = 11; vulnerable_population_data = 10; individual_health_or_social_data = 9; protected_class_business_data = 2; employee_hr_data = 2

### Cross-Cutting Regional

- **category**: other = 1679; environmental_constraint = 75; business_registry = 61; transportation = 22; parcel = 5; building_footprint = 3; buildings = 2; land_use = 1; assessed_value = 1
- **access_method**: socrata = 1625; rest_bulk = 95; static = 64; file = 26; rest = 16; blocked = 11; unknown = 5; derived = 2; ckan = 2; web_viewer_only = 2; arcgis = 1
- **licence**: not stated -- NY state open data terms presumed = 1631; Open Government Licence - Canada = 69; not stated -- needs a direct check = 49; <p><a target='_blank' href='https://conservationhamiltonca-my.sharepoi = 16; US Government public domain = 16; <p><a target='_blank' href='https://gis.conservationhalton.net/doc/ope = 14; CC-BY 4.0 = 13; attribution_ok = 9; unclear = 8; Public Domain (USGS) = 7; sharealike = 4; unknown = 4; forbidden_republish = 2; not confirmed -- needs a direct check = 2; Open, attribution (per NYS Tax Parcels Public umbrella) = 2; not stated -- NY state open data terms presumed, not confirmed = 1; not stated = 1; <p><a style='background-color:rgb(255, 255, 255); border:0px solid cur = 1
- **status_in_product**: candidate = 1807; discovered = 14; not_probed = 9; shipped = 6; blocked = 4; recon_done = 3; ingested = 3; gap = 2; not_probed -- consultation required, not a routine dig target = 1
- **priority_band**: later = 1745; P1 = 77; (blank) = 14; P0 = 13
- **review_status**: reviewed_not_relevant = 713; reviewed_unclear = 470; reviewed_relevant = 352; reviewed_context = 290; admitted_in_mcs = 23; not_probed = 1
- **source_of_finding**: Full exhaustive catalog pull, 2026-09-25 (NIA-21 follow-up) -- Socrata = 1628; Full enumeration, 2026-09-25 (NIA-21 follow-up, after initial recon-de = 94; Full exhaustive pull, 2026-09-25 (StatCan Canadian Business Counts, al = 59; Second sweep, 2026-09-25 (systematic bare-service-root check across wh = 15; item2_bulk_unpack_2026-09-25 = 14; Live dig, 2026-09-25 (NIA-21) = 13; MCS backfill 2026-09-23 (covers: (broad/provincial/federal -- no speci = 8; MCS backfill 2026-09-23 (covers: erie_county_ny, hamilton, niagara_cou = 4; MCS backfill 2026-09-23 (covers: erie_county_ny, niagara_region) = 4; Live TNMAccess API query, 2026-09-25 (NIA-21 follow-up, USGS dig) = 3; MCS backfill 2026-09-23 (covers: niagara_region) = 1; MCS backfill 2026-09-23 (covers: brant_county, brantford, haldimand_co = 1; MCS backfill 2026-09-23 (covers: welland) = 1; MCS backfill 2026-09-23 (covers: hamilton, niagara_falls_on) = 1; MCS backfill 2026-09-23 (covers: brant_county, brantford) = 1; MCS backfill 2026-09-23 (covers: monroe_county_ny, niagara_region) = 1; MCS backfill 2026-09-23 (covers: lincoln, niagara_region) = 1
- **domain_primary**: Unclassified = 1095; Meta / Portal / Administrative Reference = 226; Infrastructure & Utility Networks = 119; Environment, Ecosystem & Natural Hazards = 114; Business, Employment & Economic Development = 98; Demographics & Population = 70; Transportation, Mobility & Traffic Operations = 57; Heritage, Historic & Archaeological = 18; Property, Land Use & Zoning = 16; Financial, Fiscal & Taxation = 15; (blank) = 14; Recreation, Culture & Public Amenities = 6; Governance & Civic Participation = 1
- **domain_tags**: (blank) = 1841; Business, Employment & Economic Development = 1; Environment, Ecosystem & Natural Hazards, Financial, Fiscal & Taxation = 1; Financial, Fiscal & Taxation = 1; Business, Employment & Economic Development, Financial, Fiscal & Taxat = 1; Demographics & Population = 1; Financial, Fiscal & Taxation, Meta / Portal / Administrative Reference = 1; Heritage, Historic & Archaeological = 1; Property, Land Use & Zoning = 1
- **domain_confidence**: low = 1070; medium = 672; high = 93; (blank) = 14
- **granularity**: unspecified = 1647; area_or_zone = 98; jurisdiction_aggregate = 63; linear_network = 16; (blank) = 14; parcel_or_property = 4; point_facility = 4; building_or_structure = 3
- **temporal_nature**: unspecified = 1654; current_ongoing = 106; dated_snapshot = 60; (blank) = 14; historical_static = 13; annual_recurring = 2
- **sensitivity_flag**: none = 1814; business_operator_identifier = 20; (blank) = 7; property_ownership_pii = 4; infrastructure_ownership_attribute = 3; protected_class_business_data = 1
- **suggested_use_case**: general_reference_or_portal_metadata = 1632; environmental_risk_and_constraint_assessment = 104; economic_development_and_business_intelligence = 64; (blank) = 17; heritage_and_cultural_resource_management = 13; industrial_siting_and_land_assessment = 6; infrastructure_capacity_planning = 3; transportation_and_mobility_planning = 2; industrial_siting_and_land_assessment, economic_development_and_busine = 1; industrial_siting_and_land_assessment, environmental_risk_and_constrai = 1; industrial_siting_and_land_assessment, municipal_finance_and_taxation_ = 1; industrial_siting_and_land_assessment, economic_development_and_busine = 1; economic_development_and_business_intelligence, demographic_and_labour = 1; industrial_siting_and_land_assessment, municipal_finance_and_taxation_ = 1; municipal_finance_and_taxation_analysis, industrial_siting_and_land_as = 1; municipal_finance_and_taxation_analysis = 1

Values outside the documented vocabulary, by column and value:

- Counties, sensitivity_flag, 'infrastructure_ownership_attribute': 36 rows
- Counties, sensitivity_flag, 'business_operator_identifier': 24 rows
- Cross-Cutting Regional, sensitivity_flag, 'business_operator_identifier': 20 rows
- Municipalities, sensitivity_flag, 'infrastructure_ownership_attribute': 11 rows
- Cross-Cutting Regional, sensitivity_flag, 'infrastructure_ownership_attribute': 3 rows
- Counties, granularity, 'current_ongoing': 2 rows
- Counties, sensitivity_flag, 'industrial_siting_and_land_assessment': 2 rows
- Counties, domain_tags, 'high': 2 rows
- Counties, domain_confidence, 'parcel_or_property': 1 rows
- Counties, domain_confidence, 'point_facility': 1 rows

casing inconsistencies (same value, different case) found only in the Counties and Municipalities format column: Counties 'geojson'/'GeoJSON'; Counties 'rest'/'REST'; Counties 'CSV'/'csv'; Municipalities 'shp'/'SHP'. Total 30 cells flagged as the minority casing.

## Cross-check against the MCS (02-dataset-inventory-v4.xlsx, sheet Inventory)

- MCS datasets: 82 (all dataset_id values are unique).
- Catalog rows marked admitted_in_mcs: Counties 36, Municipalities 22, Cross-Cutting Regional 23, total 81.
- MCS ids found via mcs_dataset_id on the Counties and Municipalities sheets: 58. MCS ids found as dataset_id on Cross-Cutting Regional: 23. Total matched 81 of 82.
- Every admitted_in_mcs row has a matching MCS dataset_id: 0 admitted rows without a match. Every mcs_dataset_id value exists in the MCS: 0 unknown ids.
- Not matched: `nys_building_footprints` (status_in_product candidate, ship_status not_started). The catalog has the two layer rows `nys_building_footprints_0` (reviewed_context) and `nys_building_footprints_1` (reviewed_relevant) but no row with the parent id.
- 2 Counties rows carry an mcs_dataset_id but are reviewed_not_relevant (rows 65 and 74, both labelled DUPLICATE in the name).
- 1 id (`welland_op_schedule_b`) is used by 3 Municipalities rows, which is plausible for a multi-layer dataset.

## Requested logical checks, direct answers

- reviewed_* rows with blank domain_primary or granularity: 48 rows (Counties 32 domain_primary-blank reviewed_relevant rows plus 2 curated_relevant Norfolk rows with blank domain_primary; Cross-Cutting 14). All are reviewed_relevant or curated_relevant.
- sensitivity_flag blank on parcel_or_property rows: 0 blank cells (all 55 parcel_or_property rows have a value). 36 of them carry sensitivity_flag = none (Counties 9, Municipalities 25, Cross-Cutting 2); listed as a review item.
- admitted_in_mcs rows lacking a matching MCS dataset_id: 0.
- rows with a title but no jurisdiction or publisher: 0 on Counties and Municipalities (jurisdiction_id and jurisdiction_name are never blank). Cross-Cutting has no publisher column; source_of_finding is never blank and geography_coverage is never blank, but coverage_codes is blank on 4 rows.
- licence blank on relevant rows: 474 (Counties 262, Municipalities 212). A further 461 relevant rows say not stated, unclear, unknown or not confirmed.
- domain_confidence outside range: the vocabulary is high, medium, low (text, not numeric). Out of range values: 2 (Counties, the shifted rows 913 and 914, which hold parcel_or_property and point_facility). Blank: Counties 32, Cross-Cutting 14.
- negative record counts: 0. Absurdly large record counts (over 1 billion): 0. Zero: 3. Numbers stored as text: 42. Text that contains a number: 26. Non-numeric text: 72.
  Largest integer record_count on Counties is 12408912.
- public_url that is only a web page when catalogue_url is missing: 248 rows have format = Web Page and a blank catalogue_url (of 258 Web Page rows). An additional 258 rows look like landing pages by URL pattern (heuristic).
- README says 51 rows have a catalogue_url but no public_url. In the file, 0 rows have that shape. 18 rows have neither URL and 0 have only a catalogue_url. So the README statement does not match the sheets.
- duplicated public_url within a sheet: 114 rows (many are shared roots or portal home pages that may be fine; 2 rows are exact repeats). Duplicate rows within a jurisdiction (same name and URL): 2. Same URL appearing on more than one sheet or jurisdiction: 12 distinct URLs.

## Top problems, ranked by count

Notes on reading the ranking: items 1 to 3 are structural (rules that hit many rows at once). Fix type is one of: mechanical (script can fix from the file alone), review (needs a person to decide), live re-check (needs the portal or service).

### 1. DATE_STORED_AS_TEXT (2105 flags)

- What: last_verified holds ISO dates as text strings (YYYY-MM-DD), not date cells.
- By sheet: Counties 1149, Municipalities 956.
- Examples:
  - Counties, row 16, "ParcelsOnlinePublic" (last_verified)
  - Counties, row 1131, "BOE: Assembly" (last_verified)
  - Municipalities, row 1005, "Niagara-on-the-Lake Council Elected Officials 2019" (last_verified)

### 2. DOMAIN_UNCLASSIFIED (1552 flags)

- What: domain_primary = 'Unclassified', a 17th value that the README's 16-value vocabulary does not list.
- By sheet: Counties 193, Municipalities 264, Cross-Cutting 1095.
- Examples:
  - Counties, row 85, "Water and Wastewater" (domain_primary)
  - Cross-Cutting Regional, row 985, "Oil and Gas Annual Production: Beginning 2001" (domain_primary)
  - Municipalities, row 1005, "Niagara-on-the-Lake Council Elected Officials 2019" (domain_primary)

### 3. ACCESS_METHOD_UNKNOWN (1213 flags)

- What: access_method = 'unknown' on a row that has a URL.
- By sheet: Counties 452, Municipalities 756, Cross-Cutting 5.
- Examples:
  - Counties, row 72, "Burlington / Halton Region open data" (access_method)
  - Municipalities, row 208, "Niagara Falls Community Services" (access_method)
  - Municipalities, row 831, "City Quadrants Boundaries- Neighborhood Service Center Service Areas" (access_method)

### 4. DESCRIPTION_LIKELY_TRUNCATED (734 flags)

- What: description is exactly 250 characters and does not end in sentence punctuation (cut off mid-word).
- By sheet: Cross-Cutting 734.
- Examples:
  - Cross-Cutting Regional, row 139, "Commissioned NYS Notaries Public" (description)
  - Cross-Cutting Regional, row 901, "Empire State Child Credit Study by Filing Status: Beginning 2017" (description)
  - Cross-Cutting Regional, row 1762, "MTA Subway General Orders: Beginning 2019" (description)

### 5. RELEVANT_ROW_LICENCE_BLANK (474 flags)

- What: licence is blank on a row marked admitted_in_mcs, curated_relevant or reviewed_relevant.
- By sheet: Counties 262, Municipalities 212.
- Examples:
  - Counties, row 33, "(none found for the regional government itself)" (licence)
  - Counties, row 868, "Storm_TURFDRAIN_Junction" (licence)
  - Municipalities, row 1004, "City of Rochester Zoning, Preservation, and Overlay Districts: Zoning Districts" (licence)

### 6. RELEVANT_ROW_LICENCE_UNCONFIRMED (461 flags)

- What: licence says 'not stated', 'unclear', 'unknown' or 'not confirmed' on a relevant row.
- By sheet: Counties 211, Municipalities 4, Cross-Cutting 246.
- Examples:
  - Counties, row 14, "Zones (Zoning)" (licence)
  - Cross-Cutting Regional, row 56, "GRCA: Conservation Area Boundary" (licence)
  - Municipalities, row 32, "Commercial Sales / Property Sales" (licence)

### 7. RELEVANT_ROW_GRANULARITY_UNSPECIFIED (441 flags)

- What: granularity = 'unspecified' on a relevant row.
- By sheet: Counties 126, Municipalities 98, Cross-Cutting 217.
- Examples:
  - Counties, row 2, "Consolidated NEI (Niagara Employment Inventory)" (granularity)
  - Cross-Cutting Regional, row 816, "Unemployment Insurance Initial Claims By Region By Month: Beginning 2003" (granularity)
  - Municipalities, row 999, "Welland Official Plan Schedule B: Official Plan Schedule B" (granularity)

### 8. BLANK_REQUIRED (271 flags)

- What: required field blank (see column breakdown; includes domain_primary, granularity, domain_confidence, temporal_nature, last_verified, priority_band, coverage_codes, format, access_method).
- By sheet: Counties 171, Municipalities 19, Cross-Cutting 81.
- Examples:
  - Counties, row 47, "Hamilton Employment Lands" (last_verified)
  - Counties, row 1215, "USDA SSURGO muaggatt (NY037)" (domain_primary)
  - Municipalities, row 53, "Niagara Escarpment Plan (NEP) layers" (last_verified)

### 9. PUBLIC_URL_LOOKS_LIKE_LANDING_PAGE (258 flags)

- What: public_url is a web page, portal home page or note text rather than a machine endpoint (heuristic: no FeatureServer, MapServer, /rest/, /resource/, or file extension in the URL).
- By sheet: Counties 139, Municipalities 107, Cross-Cutting 12.
- Examples:
  - Counties, row 2, "Consolidated NEI (Niagara Employment Inventory)" (public_url)
  - Counties, row 1214, "USDA SSURGO cointerp (NY037)" (public_url)
  - Municipalities, row 888, "Aquatic Species at Risk Maps (Beamsville, Vineland,  Campden, Tintern)" (public_url)

### 10. PUBLIC_URL_IS_WEB_PAGE (258 flags)

- What: format = 'Web Page' and public_url holds that page (README says this was fixed, about 1,700 rows; these remain).
- By sheet: Counties 93, Municipalities 165.
- Examples:
  - Counties, row 103, "Cool Places" (public_url)
  - Municipalities, row 369, "Niagara Falls Job Postings" (public_url)
  - Municipalities, row 1004, "City of Rochester Zoning, Preservation, and Overlay Districts: Zoning Districts" (public_url)

### 11. REVIEWED_ROW_NO_RELEVANCE_MATCH (251 flags)

- What: reviewed_relevant or reviewed_context row with blank relevance_match.
- By sheet: Counties 251.
- Examples:
  - Counties, row 915, "Planning/CDBG_Low_Mod_Upper_Quartile" (relevance_match)
  - Counties, row 1071, "Sewer: Spencerport" (relevance_match)
  - Counties, row 1223, "USDA SSURGO muaggatt (NY055)" (relevance_match)

### 12. LEADING_TRAILING_WHITESPACE (198 flags)

- What: leading or trailing whitespace in a text cell.
- By sheet: Counties 38, Municipalities 31, Cross-Cutting 129.
- Examples:
  - Counties, row 93, "Food Safety Inspections Special Event" (relevance_match)
  - Cross-Cutting Regional, row 739, "New York State Parks Concession Contracts" (description)
  - Municipalities, row 903, "richmond owners" (description)

### 13. CATEGORY_ASSESSED_VALUE_BUT_DOMAIN_DIFFERS (166 flags)

- What: category = assessed_value but domain_primary is demographic, health, environment, transport or unclassified.
- By sheet: Counties 24, Municipalities 142.
- Examples:
  - Counties, row 90, "COVID19 Case Counts by Census Tract" (category)
  - Municipalities, row 388, "Niagara Falls 2021 Census - Place of Work Status" (category)
  - Municipalities, row 948, "census vs permit (rep, gc)" (category)

### 14. REVIEWED_ROW_MISSING_TAXONOMY (140 flags)

- What: reviewed row with blank domain_primary, granularity or domain_confidence (3 cells per row).
- By sheet: Counties 98, Cross-Cutting 42.
- Examples:
  - Counties, row 913, "Parcels" (domain_primary)
  - Counties, row 1214, "USDA SSURGO cointerp (NY037)" (domain_confidence)
  - Cross-Cutting Regional, row 1850, "USGS National Structures Dataset NY: Structure Point" (domain_confidence)

### 15. DOMAIN_KEYWORD_MISMATCH_CANDIDATE (133 flags)

- What: title keyword suggests a different domain than domain_primary (heuristic, many will be fine).
- By sheet: Counties 16, Municipalities 6, Cross-Cutting 111.
- Examples:
  - Counties, row 6, "NES / Natural Heritage series (Wetlands, Woodlands, Watercourses, Shoreline)" (domain_primary)
  - Cross-Cutting Regional, row 630, "Eastbound Tunnel and Bridge Traffic Monthly Volume, Port Authority of NY NJ:  Be" (domain_primary)
  - Municipalities, row 949, "Rail Properties True Tax" (domain_primary)

### 16. DUPLICATE_PUBLIC_URL (114 flags)

- What: same public_url on more than one row of the same sheet.
- By sheet: Counties 62, Municipalities 35, Cross-Cutting 17.
- Examples:
  - Counties, row 5, "Strategic Locations for Investment" (public_url)
  - Counties, row 1219, "USDA SSURGO muaggatt (NY073)" (public_url)
  - Municipalities, row 1004, "City of Rochester Zoning, Preservation, and Overlay Districts: Zoning Districts" (public_url)

### 17. OUTSIDE_VOCAB (102 flags)

- What: value outside the documented vocabulary (see detail: sensitivity_flag values infrastructure_ownership_attribute and business_operator_identifier, and shifted values).
- By sheet: Counties 68, Municipalities 11, Cross-Cutting 23.
- Examples:
  - Counties, row 146, "Water Valve" (sensitivity_flag)
  - Counties, row 1079, "Sewer: Village of Pittsford Sanitary Nodes" (sensitivity_flag)
  - Municipalities, row 771, "City of Rochester Tax Parcel Records: Open Data" (sensitivity_flag)

### 18. GRANULARITY_LINEAR_BUT_TITLE_SUGGESTS_POINT (96 flags)

- What: granularity = linear_network but the title names node, junction, inlet, outlet, hydrant or valve (point features).
- By sheet: Counties 96.
- Examples:
  - Counties, row 735, "Water_BREAK_Junction" (granularity)
  - Counties, row 873, "Water_HOSEBIB_Junction" (granularity)
  - Counties, row 1189, "Sewer: Sweden Storm Nodes" (granularity)

### 19. RECORD_COUNT_NON_NUMERIC_TEXT (72 flags)

- What: record_count holds text such as 'not pulled', 'n/a', 'not counted'.
- By sheet: Counties 60, Municipalities 12.
- Examples:
  - Counties, row 4, "Municipal Boundaries (Niagara-12)" (record_count)
  - Counties, row 937, "Base_Layers/Town_Boundaries" (record_count)
  - Municipalities, row 34, "(none dedicated)" (record_count)

### 20. RELEVANT_ROW_DOMAIN_UNCLASSIFIED (70 flags)

- What: relevant row with domain_primary = 'Unclassified'.
- By sheet: Municipalities 7, Cross-Cutting 63.
- Examples:
  - Cross-Cutting Regional, row 14, "Hamilton Contours / Niagara Falls 1m Contours" (domain_primary)
  - Cross-Cutting Regional, row 858, "Electric Generation By Wind, GWh Line Graph: Beginning 1980" (domain_primary)
  - Municipalities, row 34, "(none dedicated)" (domain_primary)

### 21. DATE_TEXT_WITH_ANNOTATION_OR_RANGE (68 flags)

- What: last_verified is a range or carries a note, e.g. '2026-09-23 (this session)'.
- By sheet: Counties 39, Municipalities 29.
- Examples:
  - Counties, row 2, "Consolidated NEI (Niagara Employment Inventory)" (last_verified)
  - Counties, row 42, "NYS Tax Parcels Public (Wyoming filter)" (last_verified)
  - Municipalities, row 34, "(none dedicated)" (last_verified)

### 22. URL_NOT_HTTP (63 flags)

- What: url cell is not an http(s) URL (missing scheme, or a note such as "ArcGIS org services1.arcgis.com/...").
- By sheet: Counties 27, Municipalities 27, Cross-Cutting 9.
- Examples:
  - Counties, row 4, "Municipal Boundaries (Niagara-12)" (public_url)
  - Cross-Cutting Regional, row 15, "NRCan MRDEM hillshade (display)" (public_url)
  - Municipalities, row 34, "(none dedicated)" (public_url)

### 23. HTML_MARKUP_IN_TEXT (63 flags)

- What: HTML tags in licence or description text copied from portal metadata.
- By sheet: Counties 1, Cross-Cutting 62.
- Examples:
  - Counties, row 689, "RNSSegmentsBudget2024" (licence)
  - Cross-Cutting Regional, row 103, "HCA: SWP: Highly Vulnerable Aquifer" (description)
  - Cross-Cutting Regional, row 118, "HCA: HCA Subwatersheds" (licence)

### 24. PUBLIC_URL_EQUALS_CATALOGUE_URL (47 flags)

- What: public_url and catalogue_url are identical.
- By sheet: Counties 27, Municipalities 19, Cross-Cutting 1.
- Examples:
  - Counties, row 110, "Road Condition Ratings" (public_url)
  - Counties, row 681, "Niagara Region Road Closures and Lane Restrictions" (public_url)
  - Municipalities, row 888, "Aquatic Species at Risk Maps (Beamsville, Vineland,  Campden, Tintern)" (public_url)

### 25. NUMBER_STORED_AS_TEXT (42 flags)

- What: record_count numbers stored as text strings.
- By sheet: Counties 21, Municipalities 21.
- Examples:
  - Counties, row 3, "Address Points" (record_count)
  - Municipalities, row 2, "Property Parcels" (record_count)
  - Municipalities, row 906, "Licensed Contractors: General Contractors" (record_count)

### 26. PARCEL_ROW_SENSITIVITY_NONE_NEEDS_REVIEW (36 flags)

- What: granularity = parcel_or_property but sensitivity_flag = 'none'.
- By sheet: Counties 9, Municipalities 25, Cross-Cutting 2.
- Examples:
  - Counties, row 16, "ParcelsOnlinePublic" (sensitivity_flag)
  - Municipalities, row 43, "St. Catharines Parcel Fabric Public" (sensitivity_flag)
  - Municipalities, row 847, "City of Brantford Parcel Fabric" (sensitivity_flag)

### 27. FORMAT_CASING_INCONSISTENT (30 flags)

- What: same format value in different casing (geojson vs GeoJSON, csv vs CSV, rest vs REST, shp vs SHP).
- By sheet: Counties 18, Municipalities 12.
- Examples:
  - Counties, row 8, "Zoning By-law Boundary" (format)
  - Counties, row 647, "Employment Search Agencies" (format)
  - Municipalities, row 15, "Zoning Information + 2 CIP boundary sets" (format)

### 28. RECORD_COUNT_TEXT_WITH_NUMBER (26 flags)

- What: record_count holds a number inside text, e.g. '98,065 records (2016-2022 editions)'.
- By sheet: Counties 19, Municipalities 7.
- Examples:
  - Counties, row 2, "Consolidated NEI (Niagara Employment Inventory)" (record_count)
  - Counties, row 964, "USDA SSURGO Soil Survey (NY013)" (record_count)
  - Municipalities, row 33, "TaxParcel2024 (+ 11 historical snapshots back to 1996)" (record_count)

### 29. INCONSISTENT_JURISDICTION_NAME (25 flags)

- What: same jurisdiction_id with different jurisdiction_name, e.g. 'Erie' vs 'Erie County'.
- By sheet: Counties 25.
- Examples:
  - Counties, row 39, "NYS Tax Parcels Public (Chautauqua filter)" (jurisdiction_name)
  - Counties, row 1195, "USDA SSURGO muaggatt (NY029)" (jurisdiction_name)
  - Counties, row 1223, "USDA SSURGO muaggatt (NY055)" (jurisdiction_name)

### 30. NO_PUBLIC_URL_AND_NO_CATALOGUE_URL (18 flags)

- What: both public_url and catalogue_url blank.
- By sheet: Counties 11, Municipalities 6, Cross-Cutting 1.
- Examples:
  - Counties, row 73, "Niagara San SPS Catchments" (public_url)
  - Counties, row 83, "Hamilton licence registers (salvage/garages/trades)" (public_url)
  - Municipalities, row 22, "(no presence)" (public_url)

### 31. DUPLICATE_WORKING_NAME (17 flags)

- What: same working_name on more than one row with a different dataset_id.
- By sheet: Cross-Cutting 17.
- Examples:
  - Cross-Cutting Regional, row 516, "Traffic Tickets Issued: Four Year Window" (working_name)
  - Cross-Cutting Regional, row 638, "State of New York Mortgage Agency (SONYMA) Loans Purchased: Beginning 2004" (working_name)
  - Cross-Cutting Regional, row 1718, "Upstate Primary Airport Hub Enplanements: Beginning 1997" (working_name)

### 32. ROW_NOT_YET_REVIEWED (14 flags)

- What: review_status = discovered_unreviewed or not_probed.
- By sheet: Counties 13, Cross-Cutting 1.
- Examples:
  - Counties, row 919, "Planning/CTST_Intersections" (review_status)
  - Counties, row 926, "LiDAR/Topography (Topography)" (review_status)
  - Cross-Cutting Regional, row 32, "Six Nations of the Grand River / Mississaugas of the Credit First Nation" (review_status)

### 33. URL_CONTAINS_SPACE (7 flags)

- What: URL text followed by a space and a remark.
- By sheet: Counties 4, Cross-Cutting 3.
- Examples:
  - Counties, row 7, "Employment Lands" (public_url)
  - Counties, row 72, "Burlington / Halton Region open data" (public_url)
  - Cross-Cutting Regional, row 23, "US v1 counties beyond Erie/Niagara (Chautauqua Cattaraugus Wyoming Genesee Orlea" (public_url)

### 34. CATEGORY_PARCEL_BUT_GRANULARITY_DIFFERS (6 flags)

- What: category starts with parcel but granularity is not parcel_or_property.
- By sheet: Counties 3, Municipalities 1, Cross-Cutting 2.
- Examples:
  - Counties, row 78, "Designated Heritage Properties (RGN)" (granularity)
  - Cross-Cutting Regional, row 9, "Haldimand County Zones & Building Footprints" (granularity)
  - Municipalities, row 41, "Niagara Falls City Owned Property" (granularity)

### 35. DUPLICATE_DATASET_ID (5 flags)

- What: dataset_id used by two different datasets (ids of the form hca_4&sublayer=0, truncated so two layers collide).
- By sheet: Cross-Cutting 5.
- Examples:
  - Cross-Cutting Regional, row 89, "HCA: HCA Contours 1m" (dataset_id)
  - Cross-Cutting Regional, row 113, "HCA: HCA Monitoring Stations Water Resources" (dataset_id)
  - Cross-Cutting Regional, row 118, "HCA: HCA Subwatersheds" (dataset_id)

### 36. MOJIBAKE_OR_QUESTION_MARK (4 flags)

- What: private-use glyph or broken-encoding character in text.
- By sheet: Cross-Cutting 4.
- Examples:
  - Cross-Cutting Regional, row 516, "Traffic Tickets Issued: Four Year Window" (description)
  - Cross-Cutting Regional, row 756, "Traffic Tickets Issued, Number of Tickets by Licensing State and Violation" (description)
  - Cross-Cutting Regional, row 782, "Traffic Tickets Issued, Number of Tickets Issued by Year, Month, Day of Week, an" (description)

### 37. ZERO_RECORD_COUNT (3 flags)

- What: record_count = 0.
- By sheet: Counties 2, Municipalities 1.
- Examples:
  - Counties, row 917, "DES/Fiber_Optic_Viewer" (record_count)
  - Counties, row 1054, "Sewer: Hilton Storm Inlets" (record_count)
  - Municipalities, row 461, "Welland Business Licenses" (record_count)

### 38. MCS_ID_ON_NON_ADMITTED_ROW (2 flags)

- What: mcs_dataset_id set on a row that is not admitted_in_mcs.
- By sheet: Counties 2.
- Examples:
  - Counties, row 65, "Niagara Regional Road Traffic Volumes (AADT) (DUPLICATE of row 595, same CKAN pa" (mcs_dataset_id)
  - Counties, row 74, "Niagara Combined Sewage Overflows (DUPLICATE of row 592, same CKAN package)" (mcs_dataset_id)

### 39. DUPLICATE_ROW_WITHIN_JURISDICTION (2 flags)

- What: same name and URL repeated inside a jurisdiction.
- By sheet: Counties 2.
- Examples:
  - Counties, row 913, "Parcels" (dataset_name)
  - Counties, row 914, "Civic Addresses" (dataset_name)

### 40. SHIFTED_COLUMNS (2 flags)

- What: values sit in the wrong columns (domain_confidence holds granularity, granularity holds temporal_nature, sensitivity_flag holds a use case).
- By sheet: Counties 2.
- Examples:
  - Counties, row 913, "Parcels" (domain_tags..suggested_use_case)
  - Counties, row 914, "Civic Addresses" (domain_tags..suggested_use_case)

### 41. TAG_DUPLICATES_PRIMARY (1 flags)

- What: domain_tags repeats domain_primary.
- By sheet: Cross-Cutting 1.
- Examples:
  - Cross-Cutting Regional, row 31, "Brock University open datasets (SUPERSEDED - see brock_dataset_1..12 rows)" (domain_tags)

### 42. MCS_DATASET_NOT_IN_CATALOG (1 flags)

- What: MCS dataset_id has no row in the catalog.
- By sheet: MCS Inventory 1.
- Examples:
  - MCS Inventory, row 63, "NYS Building Footprints" (dataset_id)

## Fix plan

Grouped by fix type. Counts are flags, not rows.

### Mechanical (a script can fix from the workbook alone)

- **DATE_STORED_AS_TEXT** (2105): Convert to real date cells or keep ISO text by policy; document the choice in the README.
- **LEADING_TRAILING_WHITESPACE** (198): Strip the cells. No meaning is lost.
- **CATEGORY_ASSESSED_VALUE_BUT_DOMAIN_DIFFERS** (166): The old category looks assigned by default to census and report rows. Re-derive category from domain_primary, or drop category.
- **RECORD_COUNT_NON_NUMERIC_TEXT** (72): Blank the cell and record the reason in a status column, or keep a documented sentinel. Real counts need a live query.
- **DATE_TEXT_WITH_ANNOTATION_OR_RANGE** (68): Split into last_verified (date) and a note column.
- **HTML_MARKUP_IN_TEXT** (63): Strip tags and keep link text and href in a separate field.
- **NUMBER_STORED_AS_TEXT** (42): Convert to integers.
- **FORMAT_CASING_INCONSISTENT** (30): Normalise casing.
- **RECORD_COUNT_TEXT_WITH_NUMBER** (26): Parse the leading number into record_count and move the remark to a note column.
- **INCONSISTENT_JURISDICTION_NAME** (25): Normalise to the majority name.
- **URL_CONTAINS_SPACE** (7): Split the remark off into a note column.
- **DUPLICATE_DATASET_ID** (5): Give each layer a unique id by adding the real sublayer or layer number. 10 rows are involved (each id is used twice).
- **MOJIBAKE_OR_QUESTION_MARK** (4): Replace with the intended bullet or remove.
- **DUPLICATE_ROW_WITHIN_JURISDICTION** (2): Delete the later row after confirming (Norfolk Parcels and Civic Addresses are repeated).
- **SHIFTED_COLUMNS** (2): Shift the cells right by one or two positions and fill domain_primary.
- **TAG_DUPLICATES_PRIMARY** (1): Remove the duplicate tag.

### Needs review (a person decides)

- **DOMAIN_UNCLASSIFIED** (1552): Decide whether Unclassified is an allowed value and document it. Then batch-classify by title keywords and review the rest by hand. Most rows are reviewed_not_relevant or reviewed_unclear, so priority is the relevant ones (see next item).
- **RELEVANT_ROW_GRANULARITY_UNSPECIFIED** (441): Mostly classifiable from title and layer geometry type (Point, Polyline, Polygon). The geometry type needs a live metadata call for certainty; title rules cover part of it.
- **REVIEWED_ROW_NO_RELEVANCE_MATCH** (251): Mostly Monroe County layers. Fill relevance_match from the rule or keyword that admitted them, or state in the README that blank is allowed for bulk layers.
- **REVIEWED_ROW_MISSING_TAXONOMY** (140): Classify the 48 rows (32 USDA SSURGO rows on Counties, 14 NRWN and USGS rows on Cross-Cutting, 2 Norfolk rows). Two Norfolk rows also have values shifted left; see the shifted-columns item.
- **DOMAIN_KEYWORD_MISMATCH_CANDIDATE** (133): Human review of the list. Many hits are legitimate, for example Natural Heritage System layers belong in Environment, and Canadian Business Counts title contains "census".
- **DUPLICATE_PUBLIC_URL** (114): Shared service root or portal home is fine when each row is a different layer or table. Rows that share a bare root need the layer number added (live check), and true duplicates should be merged.
- **OUTSIDE_VOCAB** (102): Either add the two sensitivity values to the README vocabulary (they are used consistently, so this is a documentation gap) or remap them. Fix shifted rows mechanically.
- **GRANULARITY_LINEAR_BUT_TITLE_SUGGESTS_POINT** (96): Likely a copy of the parent service granularity. Needs geometry type from the layer (live) or a title rule. Affects Haldimand and Monroe utility layers.
- **RELEVANT_ROW_DOMAIN_UNCLASSIFIED** (70): Classify by hand. These are the highest-value rows among the unclassified ones.
- **PARCEL_ROW_SENSITIVITY_NONE_NEEDS_REVIEW** (36): Check whether the source exposes owner names or mailing addresses; other parcel rows use property_ownership_pii. The blank check you asked for found 0 blank cells; the concern is the none value.
- **DUPLICATE_WORKING_NAME** (17): Mostly the same NYS dataset listed twice under different ids. Merge or document.
- **ROW_NOT_YET_REVIEWED** (14): Finish the review pass for these rows.
- **CATEGORY_PARCEL_BUT_GRANULARITY_DIFFERS** (6): Check each row.
- **MCS_ID_ON_NON_ADMITTED_ROW** (2): Both rows are labelled DUPLICATE in the name; clear the id or mark them admitted.
- **MCS_DATASET_NOT_IN_CATALOG** (1): The catalog has the layer rows nys_building_footprints_0 and _1 instead of the parent id. Decide whether to add a parent row or map the MCS id to them. This breaks the README claim that the catalog is a provable superset of the MCS.

### Needs live re-check (portal or service query)

- **ACCESS_METHOD_UNKNOWN** (1213): Probe each endpoint once (HTTP HEAD or a f=json metadata call) and set rest_bulk, socrata, ckan, file or web_viewer_only. Needs network, so it is out of scope for this audit. Partly mechanical: URLs containing FeatureServer or MapServer imply rest_bulk.
- **DESCRIPTION_LIKELY_TRUNCATED** (734): Re-pull the full description from the Socrata or portal metadata. The original text is not in the workbook. Until then mark as truncated.
- **RELEVANT_ROW_LICENCE_BLANK** (474): Fill from the portal licence or terms page. Haldimand has 142 of the Counties flags and Hamilton 89; a server-wide or portal-wide answer would clear most of each group once the terms page is checked live.
- **RELEVANT_ROW_LICENCE_UNCONFIRMED** (461): Needs a live check of the publisher terms. Presumed NY open data terms can be recorded as a single documented default only if the owner agrees.
- **PUBLIC_URL_EQUALS_CATALOGUE_URL** (47): Means no machine endpoint has been found. Needs a live look at the portal feed.
- **NO_PUBLIC_URL_AND_NO_CATALOGUE_URL** (18): Find the source URL. The README says 51 rows legitimately have only a catalogue_url; none of these rows is of that kind.
- **ZERO_RECORD_COUNT** (3): Check whether the layer is empty or the count failed.

### Mixed (part mechanical, part review or live)

- **BLANK_REQUIRED** (271): Taxonomy blanks: fill by review (same rules as the other rows of the same source). last_verified blanks: stamp the date of the pass that created the row if the log shows it, otherwise live re-check.
- **PUBLIC_URL_LOOKS_LIKE_LANDING_PAGE** (258): Move the page URL to catalogue_url where that cell is empty. Finding the real endpoint needs a live look at the portal feed.
- **PUBLIC_URL_IS_WEB_PAGE** (258): Mechanical part: copy public_url to catalogue_url where it is empty. Real endpoint recovery needs a live look at the portal feed (Hamilton and Rochester hub pages).
- **URL_NOT_HTTP** (63): Scheme-less host/path strings: prepend https:// (mechanical, but confirm). Free-text notes: move to alternative_access and find the URL (live).

Suggested order of work:

1. Mechanical clean-up in one script on a copy of the workbook: strip whitespace, normalise format casing and jurisdiction names, convert numbers stored as text, split annotated dates and record counts, fix the 2 shifted Norfolk rows, make dataset_ids unique, strip HTML from licence and description, remove the exact duplicate Norfolk rows after confirming.
2. Decide vocabulary policy: whether Unclassified, infrastructure_ownership_attribute, business_operator_identifier and temporal_nature = none are allowed, and record that in the README. This removes about 1654 flags at once.
3. Review the relevant rows first: 70 relevant rows classed Unclassified, 441 with granularity unspecified, 48 reviewed rows with blank taxonomy, 935 with licence blank or unconfirmed.
4. One live pass over the remaining URLs: resolve access_method unknown, recover machine endpoints for Web Page rows, re-pull truncated descriptions, fill licences.
5. Correct the README counts (total rows, 51 catalogue-only rows, superset claim) once the above is done.

## Random sample judgement (15 rows per sheet, seed 20260930)

Each sampled row was printed with its key columns and judged by reading them together. The notes below say whether the columns make sense together. Flags in brackets are the audit codes on that row.


### Counties

- Row 47, "Hamilton Employment Lands" ['BLANK_REQUIRED', 'PUBLIC_URL_LOOKS_LIKE_LANDING_PAGE', 'RELEVANT_ROW_GRANULARITY_UNSPECIFIED']: Makes sense. Employment lands matches Business domain. granularity unspecified is weak for a polygon layer.
- Row 56, "Niagara Consolidated NEI" ['BLANK_REQUIRED', 'PUBLIC_URL_LOOKS_LIKE_LANDING_PAGE', 'RELEVANT_ROW_GRANULARITY_UNSPECIFIED']: Makes sense. Business inventory matches Business domain; domain_confidence low looks too low for an admitted dataset.
- Row 83, "Hamilton licence registers (salvage/garages/trades" ['BLANK_REQUIRED', 'NO_PUBLIC_URL_AND_NO_CATALOGUE_URL', 'RELEVANT_ROW_GRANULARITY_UNSPECIFIED', 'RELEVANT_ROW_LICENCE_UNCONFIRMED']: Partly. Admitted and relevant but no URL at all and licence unclear.
- Row 104, "Residential Waste Diversion" ['ACCESS_METHOD_UNKNOWN', 'DATE_STORED_AS_TEXT', 'DOMAIN_UNCLASSIFIED']: Reasonable for not_relevant; Unclassified domain and unknown access_method add no information.
- Row 457, "City Boundary" ['ACCESS_METHOD_UNKNOWN', 'DATE_STORED_AS_TEXT']: Questionable. City Boundary is tagged Property, Land Use & Zoning; Governance or boundary reference would fit better.
- Row 568, "Brant in Bloom" ['DATE_STORED_AS_TEXT', 'DOMAIN_UNCLASSIFIED', 'PUBLIC_URL_LOOKS_LIKE_LANDING_PAGE']: Fine. Brant in Bloom is a StoryMap, not relevant, Unclassified is acceptable.
- Row 632, "NES Other Woodlands" ['DATE_STORED_AS_TEXT', 'RELEVANT_ROW_GRANULARITY_UNSPECIFIED', 'RELEVANT_ROW_LICENCE_BLANK']: Makes sense. NES woodlands in Environment. Licence blank, granularity unspecified though it is a polygon layer.
- Row 832, "Storm_OUTLET_Junction" ['DATE_STORED_AS_TEXT', 'GRANULARITY_LINEAR_BUT_TITLE_SUGGESTS_POINT', 'RELEVANT_ROW_LICENCE_BLANK']: Mismatch. Storm outlet junction is a point feature but granularity is linear_network.
- Row 859, "Water_INTAKE_Junction" ['DATE_STORED_AS_TEXT', 'GRANULARITY_LINEAR_BUT_TITLE_SUGGESTS_POINT', 'RELEVANT_ROW_LICENCE_BLANK']: Mismatch. Water intake junction is a point feature but granularity is linear_network.
- Row 882, "Secondary Plan Area" ['DATE_STORED_AS_TEXT', 'RELEVANT_ROW_LICENCE_BLANK']: Makes sense. Secondary Plan Area is a polygon layer, Property domain and area_or_zone. Licence blank.
- Row 949, "Parks/Zoo_Animal_Points" ['DATE_STORED_AS_TEXT', 'RECORD_COUNT_NON_NUMERIC_TEXT']: Makes sense. Zoo animal points in Recreation with point_facility. record_count is not pulled.
- Row 958, "Utilities/PrintingTools" ['DATE_STORED_AS_TEXT', 'RECORD_COUNT_NON_NUMERIC_TEXT']: Makes sense. Printing tools in Meta domain.
- Row 1029, "Sewer: Brockport Sewer Nodes" ['DATE_STORED_AS_TEXT', 'GRANULARITY_LINEAR_BUT_TITLE_SUGGESTS_POINT', 'OUTSIDE_VOCAB', 'RELEVANT_ROW_LICENCE_UNCONFIRMED', 'REVIEWED_ROW_NO_RELEVANCE_MATCH']: Mostly. Sewer nodes are points, granularity linear_network is wrong. sensitivity_flag value is undocumented. relevance_match blank.
- Row 1162, "Education: College Building Names" ['DATE_STORED_AS_TEXT']: Makes sense. College building names in Education.
- Row 1198, "USDA SSURGO cointerp (NY664)" ['BLANK_REQUIRED', 'DATE_STORED_AS_TEXT', 'DUPLICATE_PUBLIC_URL', 'INCONSISTENT_JURISDICTION_NAME', 'PUBLIC_URL_LOOKS_LIKE_LANDING_PAGE', 'REVIEWED_ROW_MISSING_TAXONOMY', 'REVIEWED_ROW_NO_RELEVANCE_MATCH']: Incomplete. USDA SSURGO cointerp row reviewed_relevant but domain, granularity and confidence are all blank, and jurisdiction_name is Erie-style short name.

### Municipalities

- Row 68, "Niagara Falls International Bridge" ['ACCESS_METHOD_UNKNOWN', 'DATE_STORED_AS_TEXT']: Reasonable. International bridge in Infrastructure; access_method unknown.
- Row 80, "Niagara Falls Streetscape Improvement CIP Area 202" ['DATE_STORED_AS_TEXT', 'LEADING_TRAILING_WHITESPACE', 'RELEVANT_ROW_LICENCE_BLANK']: Makes sense. CIP area as polygon zone. access_method web_viewer_only while URL is a FeatureServer, worth a check.
- Row 88, "Niagara Falls Cemetery Plots WGS 1984" ['ACCESS_METHOD_UNKNOWN', 'DATE_STORED_AS_TEXT']: Mismatch risk. Cemetery plots as Recreation, Culture and Public Amenities is plausible; category other.
- Row 183, "Niagara Falls Official Plan Special Policy Areas W" ['ACCESS_METHOD_UNKNOWN', 'DATE_STORED_AS_TEXT', 'RELEVANT_ROW_LICENCE_BLANK']: Makes sense. Official Plan policy areas in Property domain.
- Row 331, "Niagara Falls 2025 Tree Giveaway WGS 1984" ['ACCESS_METHOD_UNKNOWN', 'DATE_STORED_AS_TEXT', 'DOMAIN_UNCLASSIFIED']: Fine for not_relevant; Unclassified.
- Row 359, "Niagara Falls Heritage Property Viewer" ['ACCESS_METHOD_UNKNOWN', 'DATE_STORED_AS_TEXT', 'PUBLIC_URL_LOOKS_LIKE_LANDING_PAGE', 'RELEVANT_ROW_GRANULARITY_UNSPECIFIED', 'RELEVANT_ROW_LICENCE_BLANK']: Makes sense. Heritage viewer in Heritage domain. The URL is an ArcGIS experience page, not a data endpoint.
- Row 386, "Niagara Falls 2021 Census - Pre Admission Experien" ['ACCESS_METHOD_UNKNOWN', 'CATEGORY_ASSESSED_VALUE_BUT_DOMAIN_DIFFERS', 'DATE_STORED_AS_TEXT']: Category does not fit. A census item has category assessed_value while domain is Demographics (correct). The category is the stale one.
- Row 511, "2016 Household and Dwelling Characteristics by Cen" ['ACCESS_METHOD_UNKNOWN', 'CATEGORY_ASSESSED_VALUE_BUT_DOMAIN_DIFFERS', 'DATE_STORED_AS_TEXT']: Category does not fit. A census tract household table has category assessed_value; domain Demographics is right.
- Row 547, "2016 Family Characteristics by Census Tract" ['ACCESS_METHOD_UNKNOWN', 'CATEGORY_ASSESSED_VALUE_BUT_DOMAIN_DIFFERS', 'DATE_STORED_AS_TEXT']: Same pattern: category assessed_value on a census table.
- Row 630, "City of Buffalo's Open Data Portal" ['ACCESS_METHOD_UNKNOWN', 'DATE_STORED_AS_TEXT', 'DOMAIN_UNCLASSIFIED', 'PUBLIC_URL_LOOKS_LIKE_LANDING_PAGE']: Wrong jurisdiction. City of Buffalo portal row sits under rochester_ny, with category transportation and format ArcGIS REST; it is a portal home page.
- Row 692, "Rochester Economic Mobility Cohort Evaluation Repo" ['ACCESS_METHOD_UNKNOWN', 'CATEGORY_ASSESSED_VALUE_BUT_DOMAIN_DIFFERS', 'DATE_STORED_AS_TEXT', 'DOMAIN_UNCLASSIFIED', 'PUBLIC_URL_IS_WEB_PAGE']: Category assessed_value on a Rochester report; Unclassified. Weak.
- Row 810, "Rochester Master Bike Plan" ['ACCESS_METHOD_UNKNOWN', 'DATE_STORED_AS_TEXT', 'PUBLIC_URL_IS_WEB_PAGE']: Makes sense. Bike plan in Transportation, format Web Page, not relevant.
- Row 864, "Fort Erie Soccer Fields" ['DATE_STORED_AS_TEXT']: Makes sense. Soccer fields in Recreation.
- Row 889, "Niagara-on-the-Lake Council Elected Officials" ['DATE_STORED_AS_TEXT', 'DOMAIN_UNCLASSIFIED']: Fine. Council officials Unclassified; could be Governance & Civic Participation, which exists in the vocabulary.
- Row 948, "census vs permit (rep, gc)" ['CATEGORY_ASSESSED_VALUE_BUT_DOMAIN_DIFFERS', 'DATE_STORED_AS_TEXT']: Makes sense. Census vs permit in Demographics aggregate; category assessed_value again is stale.

### Cross-Cutting Regional

- Row 16, "NYS Tax Parcels Public (Erie industrial)" []: Makes sense. Tax parcels, parcel granularity, ownership PII flagged. Clean.
- Row 96, "HCA: SWP: Wellhead Protection Area" ['HTML_MARKUP_IN_TEXT']: Makes sense. Wellhead protection area in Environment; licence cell holds an HTML anchor.
- Row 207, "Breeding Bird Atlases" ['DESCRIPTION_LIKELY_TRUNCATED', 'DOMAIN_UNCLASSIFIED']: Makes sense as context. Breeding Bird Atlases Unclassified though Environment fits; description truncated; duplicated name with another row.
- Row 499, "Turnstile Usage Data for Brooklyn-Manhattan Transi" ['DESCRIPTION_LIKELY_TRUNCATED']: Makes sense. Turnstile usage in Transportation. Description truncated.
- Row 572, "New York Codes, Rules and Regulations (NYCRR) - Un" ['DOMAIN_UNCLASSIFIED', 'LEADING_TRAILING_WHITESPACE']: Makes sense. Regulations list Unclassified is fine.
- Row 827, "DART (Department Application Review and Tracking) " ['DOMAIN_UNCLASSIFIED']: Fine. Unclassified unclear row.
- Row 912, "List of Current Party and Charter Boat License Hol" ['DESCRIPTION_LIKELY_TRUNCATED', 'DOMAIN_UNCLASSIFIED']: Fine. Licence holders list Unclassified; description truncated.
- Row 1037, "Watchable Wildlife Sites" ['DOMAIN_UNCLASSIFIED']: Domain Unclassified while Watchable Wildlife Sites fits Environment or Recreation.
- Row 1050, "Supplemental Security Income (SSI) Living Arrangem" []: Makes sense. SSI living arrangements in Demographics; Social Vulnerability could also fit.
- Row 1117, "Public Parking Counts at Port Authority of NY NJ A" ['DESCRIPTION_LIKELY_TRUNCATED', 'RELEVANT_ROW_GRANULARITY_UNSPECIFIED', 'RELEVANT_ROW_LICENCE_UNCONFIRMED']: Weak. Public parking counts at a Port Authority (NY/NJ) are far from the study area but marked reviewed_relevant; domain Infrastructure plausible.
- Row 1604, "MTA NYCT Paratransit Drop-off On-Time Performance:" ['DESCRIPTION_LIKELY_TRUNCATED']: Makes sense. MTA paratransit in Transportation, but context only.
- Row 1631, "Labor Market Regions" ['DESCRIPTION_LIKELY_TRUNCATED', 'DOMAIN_UNCLASSIFIED', 'DUPLICATE_WORKING_NAME', 'RELEVANT_ROW_DOMAIN_UNCLASSIFIED', 'RELEVANT_ROW_GRANULARITY_UNSPECIFIED', 'RELEVANT_ROW_LICENCE_UNCONFIRMED']: Weak. Labor Market Regions is reviewed_relevant but Unclassified, granularity unspecified, licence only presumed. Duplicated name.
- Row 1781, "Canadian Business Counts, with employees, June 202" []: Makes sense. Business counts in Business domain, jurisdiction_aggregate.
- Row 1807, "Canadian Business Counts, with employees, census m" ['DOMAIN_KEYWORD_MISMATCH_CANDIDATE']: Makes sense. Flag is a false positive (title contains the word census).
- Row 1840, "NRWN Ontario: Marker Post" ['BLANK_REQUIRED', 'DUPLICATE_PUBLIC_URL', 'REVIEWED_ROW_MISSING_TAXONOMY']: Incomplete. NRWN Marker Post is reviewed_relevant with domain, granularity, confidence, temporal and priority all blank; status discovered.

Sample verdict: the sample rows mostly make sense at the domain level. The recurring mismatches are granularity on point-like utility layers, stale category values (assessed_value on census tables), and the Buffalo portal row under Rochester. Sample sizes are small, so treat these as pointers and not as rates.

## Other observations

- Row 630 on Municipalities: "City of Buffalo's Open Data Portal" is filed under rochester_ny. Jurisdiction mislabel, found by reading the sample; a title-versus-jurisdiction scan (city names in titles) found 7 Municipalities rows (including row 630) and 9 Counties rows whose title names a different place. Many are arguable or correct (Monroe County titles under rochester_ny, Welland Canal under niagara_region, Buffalo and Rochester items under their counties). Those are candidates only and are not in the CSV.
- Counties row 4 and similar: public_url is the text "ArcGIS org services1.arcgis.com/WxiLK82TWf8W3O3f", a description of a service, not a URL.
- Cross-Cutting Regional has 14 rows (NRWN Ontario and USGS NTD and Structures) with status discovered that are marked reviewed_relevant but have no taxonomy and no priority_band.
- Haldimand County has 227 rows; 220 have a blank licence. Monroe County has 226 rows whose licence reads "not stated -- same server as Parcels_Public, licenceInfo blank there too". One documented answer per publisher would clear most licence flags.

## Files

- Report: /home/mp/na/heavymap/heavymap-planning/13-catalog-audit-2026-09-30.md
- Problem rows: /home/mp/na/heavymap/heavymap-planning/13-catalog-audit-2026-09-30-problems.csv (UTF-8, columns sheet, row_number, jurisdiction, title, column, problem)