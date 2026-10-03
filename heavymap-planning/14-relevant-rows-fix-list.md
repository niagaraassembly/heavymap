# Relevant rows fix list, 2026-09-30

This is the actionable subset of the catalog audit (`13-catalog-audit-2026-09-30.md`). It covers only rows whose review_status is admitted_in_mcs, curated_relevant or reviewed_relevant, plus the shifted-value rows that are listed regardless of status. The workbook `09-per-jurisdiction-dataset-catalog.xlsx` was read from a copy in /tmp and was not changed. No network calls were made, so every flag is a file check. Row numbers are Excel row numbers (header is row 1).

The full list is in `14-relevant-rows-fix-list.csv`, one line per row. The gap_current_values column shows the current cell values behind each gap. The dataset_id column is the workbook's dataset_id (Cross-Cutting) or mcs_dataset_id (Counties, Municipalities), and is blank on most rows because most rows do not carry one.

## Counts

- Relevant rows in total: 1195 (Counties 560, Municipalities 260, Cross-Cutting Regional 375).
- Relevant rows with at least one gap: 1091 (91.3% of relevant rows). Rows in the CSV: 1091 (0 shifted-value rows outside the relevant statuses, so the two sets are identical here; both shifted rows are curated_relevant).
- Relevant rows with no gap: 104.

Rows per gap type (a row with several gaps counts once under each):

| Gap | Rows |
|---|---|
| (a) licence blank or not stated/unclear | 938 |
| (b) sensitivity_flag problem | 137 |
| (c) granularity blank/unspecified or linear_network with point-type title | 579 |
| (d) domain_primary blank/Unclassified or domain_confidence blank | 116 |
| (e) no usable public_url | 227 |
| (f) shifted-value rows | 2 |
| access_method = unknown | 232 |

Sub-counts:

| Detail | Rows |
|---|---|
| (a) licence blank | 474 |
| (a) licence says not stated, unclear, unknown, not confirmed or similar | 464 |
| (b) sensitivity_flag blank | 7 |
| (b) sensitivity_flag none on a parcel_or_property row | 36 |
| (b) sensitivity_flag outside the documented vocabulary (infrastructure_ownership_attribute or business_operator_identifier) | 94 |
| (c) granularity blank | 46 |
| (c) granularity unspecified | 441 |
| (c) linear_network with a point-type title | 92 |
| (d) domain_primary blank or Unclassified, domain_confidence filled | 70 |
| (d) domain_primary blank or Unclassified, and domain_confidence blank | 46 |
| (e) public_url is only a web page or portal landing URL | 152 |
| (e) public_url is a fragment, not a full http(s) URL (for example "Buildings/FeatureServer/8" or "open.welland.ca") | 57 |
| (e) both public_url and catalogue_url blank | 18 |

The (f) count is the two Counties rows 913 and 914 (Norfolk Parcels and Civic Addresses). No other row with misaligned values was found: I checked domain_confidence, granularity and temporal_nature against their vocabularies on every row of Counties and Municipalities, and domain_tags against those vocabularies. Both shifted rows are curated_relevant. Their values from domain_tags to sensitivity_flag sit one column to the left of the headers, and the domain_primary cell is blank. After the shift, row 913 becomes a parcel_or_property row with sensitivity_flag none, which would then fall under (b) parcel-none review.

Note on (e): a "machine endpoint" is judged from the URL text (FeatureServer, MapServer, /rest/, /resource/, /api/, /query, or a data-file extension). It is a heuristic. Rows where public_url is only a fragment are counted separately above because the endpoint is often visible in the fragment, but the URL is not usable as written.

Fix kinds (per row, taking the hardest gap on the row): mechanical 10, review 443, live_recheck 638. Because most rows have several gaps, few rows are mechanical from start to finish. Counted per suggestion, the CSV contains these row-derived fixes:

- access->rest_bulk: 192 rows
- point_facility for point-titled linear rows: 92 rows
- expand partial URL: 57 rows
- granularity from category: 45 rows

The access_method suggestion (rest_bulk or socrata) rests on the URL pattern and is a suggestion to confirm, not a checked fact. Licence gaps are never filled in by the CSV because the row does not say what the licence is.

## Rows by jurisdiction (top 15)

Jurisdiction is jurisdiction_id for Counties and Municipalities and "cross-cutting: geography_coverage" for the Cross-Cutting Regional sheet. "Relevant rows" is all relevant rows for that jurisdiction; "Rows with a gap" is the CSV rows for it.

| Jurisdiction | Relevant rows | Rows with a gap | a | b | c | d | e | f | access |
|---|---|---|---|---|---|---|---|---|---|
| cross-cutting: New York State (statewide unless noted) | 203 | 203 | 203 | 21 | 203 | 60 | 0 | 0 | 0 |
| monroe_county_ny | 184 | 184 | 179 | 54 | 41 | 4 | 7 | 0 | 0 |
| haldimand_county | 147 | 147 | 147 | 1 | 87 | 0 | 4 | 0 | 0 |
| hamilton | 110 | 110 | 102 | 8 | 50 | 0 | 32 | 0 | 88 |
| niagara_falls_on | 97 | 97 | 85 | 15 | 29 | 0 | 20 | 0 | 78 |
| rochester_ny | 64 | 64 | 64 | 11 | 21 | 0 | 22 | 0 | 43 |
| niagara_region | 46 | 45 | 30 | 0 | 29 | 0 | 23 | 0 | 0 |
| welland | 39 | 39 | 25 | 1 | 10 | 0 | 12 | 0 | 21 |
| cross-cutting: Grand River watershed | 32 | 32 | 32 | 1 | 0 | 0 | 0 | 0 | 0 |
| buffalo_ny | 20 | 20 | 17 | 1 | 17 | 0 | 3 | 0 | 0 |
| brant_county | 14 | 12 | 9 | 1 | 8 | 0 | 4 | 0 | 0 |
| brantford | 11 | 11 | 5 | 2 | 3 | 0 | 6 | 0 | 0 |
| erie_county_ny | 9 | 9 | 1 | 1 | 5 | 4 | 9 | 0 | 0 |
| st_catharines | 9 | 9 | 2 | 6 | 2 | 0 | 7 | 0 | 0 |
| niagara_county_ny | 8 | 8 | 3 | 1 | 5 | 4 | 7 | 0 | 0 |

Jurisdictions beyond the top 15: 39, holding 101 gap rows.

## Where the gaps cluster

Publisher clusters are read from the host name in public_url (or catalogue_url when public_url is blank).

- Licence (a): top hosts are data.ny.gov (206), maps.monroecounty.gov (178), gis.haldimandcounty.ca (147), services.arcgis.com (81). Of the licence-unconfirmed rows, the wording "not stated -- NY state open data terms presumed" and "not stated -- same server as Parcels_Public, licenceInfo blank" account for most (see licence text in the CSV).
- Granularity (c): data.ny.gov (203), gis.haldimandcounty.ca (87), maps.monroecounty.gov (37), services.arcgis.com (34).
- Sensitivity (b): maps.monroecounty.gov (53), data.ny.gov (21), services9.arcgis.com (13), services.arcgis.com (9).
- Domain (d): data.ny.gov (60), sdmdataaccess.nrcs.usda.gov (32), ftp.maps.canada.ca (7), prd-tnm.s3.amazonaws.com (7).
- No usable URL (e): sdmdataaccess.nrcs.usda.gov (40), niagaraopendata.ca (27), (no url) (18), data.cityofrochester.gov (16).
- access_method unknown: services.arcgis.com (76), services9.arcgis.com (71), maps.cityofrochester.gov (22), arcgisweb.welland.ca (20).
- Most common gap combinations: a;c = 267 rows; a = 237 rows; a;access = 114 rows; a;c;d = 58 rows; e = 50 rows; a;c;access = 49 rows.

## Suggested order of work

Effort figures below are rows per batch, computed from the CSV. I have not timed any of it.

1. Shifted rows (f): 2 rows (Counties 913 and 914). Move the values one column right and choose a domain_primary. Smallest batch, and it unblocks any code reading those columns.
2. Mechanical fixes: 10 rows where the fix is fully determined by the row (suggested_fix_kind = mechanical). Plus the mechanical parts of mixed rows: access_method from the URL pattern (192 rows) and granularity from category (45 rows). No relevant row has a blank or Unclassified domain_primary together with a usable relevance_match, so domain_primary cannot be filled mechanically. These can be applied by a script and then reviewed as a diff.
3. Partial URLs (e, fragment): 57 rows. The hosts are already named in the row (Hamilton, Niagara Falls, Welland, Haldimand and others), so the full endpoint can usually be rebuilt from the service path; confirm live.
4. Review by publisher, one publisher at a time so one look at the portal settles many rows: Monroe County (maps.monroecounty.gov) licence and sensitivity, Haldimand (gis.haldimandcounty.ca) licence and granularity, data.ny.gov licence and granularity for the cross-cutting NYS rows, Hamilton and Niagara Falls DCAT rows. The counts per host are in the cluster list above.
5. Sensitivity (b): 137 rows. 94 are out-of-vocabulary values that need a vocabulary decision first (add the two values to the README or remap), which then closes them in bulk; 36 are parcel rows marked none, which need a field-level look for owner names; 7 are blank.
6. Live re-check (needs the portals): 638 rows are tagged live_recheck, mainly blank licences (474 rows) and landing-page URLs. Do these last, in batches by portal.
7. Domain (d): 116 rows. None can be filled from the row itself, so a person has to pick the domain_primary (and domain_confidence where blank).

## Caveats

- The vocabulary for sensitivity_flag used here is the README list plus none; infrastructure_ownership_attribute and business_operator_identifier are treated as outside the vocabulary, as in the audit. The audit also lists industrial_siting_and_land_assessment, but it only appears on the two shifted rows, which are listed under (f).
- The point-feature check on linear_network titles uses the words node, junction, hydrant, valve, point, station, inlet and outlet (the audit also used inlet and outlet).
- Licence text that only describes a fee or a custom licence was treated as filled. Licence text was flagged when it says not stated, unclear, unknown, not confirmed, not established, n/a, or blank in the feed.
