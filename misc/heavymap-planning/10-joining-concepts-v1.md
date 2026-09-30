# 10 — HeavyMap joining concepts v1

**Linear:** [NIA-10](https://linear.app/niagaraassembly/issue/NIA-10/jurisdiction-roster-v1-exhaustive-ca-municipalities-us-countiesplaces) (extension comment `cea459e0`, Agent 1 pickup)
**Built:** 2026-09-25 (revised the same day after a second live-read pass: 30 concepts, ledger at 118 rows) · **Framework:** Spine + Context Band Ladder vocabulary · **Status:** planning artifact, proposals only
**Companions:** `11-synonym-parallel-ledger-v1.csv` / `.md` (the rows that use these IDs) · `12-authority-scale-and-meta-proposals.md` (what to add to claims/fixtures)
**Inputs:** `07`, `08`, `09` (this ticket) · MCS v4 + `AGENTS-MCS.md` (read-only) · `docs/architecture/` and `docs/architecture/vocab/` on `niagaraassembly/heavymap` `main` (49893d0) · PR #13 fixtures · live schema reads on 2026-09-25 (see §8)

A **joining concept** is a stable HeavyMap ID for *the job a field does*, so fields with different native names can be united, and fields with the same name can be kept apart. Native names are never renamed away: the claim keeps the publisher's field name and value (see `12`), and the concept ID is an extra handle.

## 1. Ground rules

1. **Concept unity is not joinability.** `nei_id` (Niagara NEI) and Welland's Business Directory `ID` are both premises-level register keys, so they share `premises_register_key`. They still share no key with each other, so no join between the two registers exists. A concept says "same job", never "these two tables can be joined".
2. **A concept is not a band, a reading, or a stamp field.**
   - *Band* (`identity` … `share_export`) says where a claim sits on the ladder. A concept lists the bands it may feed.
   - *Reading identifier* (`floor_area_m2`, `coverage_ratio`, `employment_interval`) is the name of a computed value. Concepts here name the **published inputs** (`floor_area_published`, `lot_area_published`, `employment_size_band`), which live on the stamp of a reading, never as a copied raw field on the `derived_readings` rung (claims contract).
   - *Stamp fields* (`observation_on` …) are separate. One concept, `assessment_roll_context`, is stamp-adjacent (its year maps to `observation_on`) and says so.
3. **IDs** are lowercase snake_case, ASCII, stable. Renaming needs an `aliases:` line in this file. A concept ID is never reused for a different job.
4. **Families** group concepts for grouping in a UI or a filter. A family has a parent ID only where one is useful (`constraint_overlay`). Families are not bands.
5. **Same word, different concept is allowed and expected.** The ledger records those as `false_friend` rows.
6. **Grain** here means what a claim under the concept attaches to: `parcel`, `footprint`, `address`, `register_unit` (a premises or facility record), `zone_polygon` (an overlay/zone that attaches to a unit by `point_in_polygon`, `containment` or `overlap`), `jurisdiction_aggregate` (counts for a whole county or city: **cannot attach to a spine unit**).

### Display-genre recommendation (documentation only; the user-selectable rule is a later product decision)

Each concept carries three labels and one default: `label_ca`, `label_us`, `label_neutral`, `default_genre`.

| Situation | Default label shown | Native term shown? |
|---|---|---|
| Relation `same` or `alias`, CA-comparable | Canadian label (`ca`) | In the stamp or tooltip |
| Relation `near` | Canadian label if comparable (`ca`), otherwise US (`us`) | **Beside the label, always** |
| Relation `false_friend` | Neutral HeavyMap label (`neutral`) | **Beside the label, always. Never relabelled into the other genre** |
| US-only concept (no Canadian counterpart held) | US label (`us`) | In the stamp |
| **Label collision**: the Canadian label is itself a false friend in the other genre | Neutral label (`neutral`) | Beside the label |

The collision case is real: `assessment_roll_key` would be "Roll number" in a Canadian genre, and in New York "roll" means the annual assessment roll, not a parcel identifier. Its default is therefore `neutral`.

## 2. Coverage against the ticket's acceptance list

| Required by the extension comment | Concept ID(s) |
|---|---|
| cadastral / unit key | `assessment_roll_key`, `parcel_gis_key` (+ `assessing_unit_code`) |
| establishment / register key | `premises_register_key` |
| zoning or land-use code | `zoning_district` (+ `zoning_site_modifier`, `official_plan_designation`) |
| assessment / property-class code | `assessment_property_class` (+ `assessment_use_descriptor`, `assessed_value`, `assessment_roll_context`) |
| environmental / constraint overlay family | `constraint_overlay` → `flood_hazard_overlay`, `natural_heritage_overlay`, `heritage_designation_overlay`, `planning_policy_overlay` |
| federal activity register family | `regulatory_activity_register` (facets by authority scale), `jurisdiction_activity_aggregate` |
| one derived-reading family | `floor_area_published`, `lot_area_published` → readings `floor_area_m2`, `lot_area_m2`, `coverage_ratio` (§6) |

## 3. Catalog

Format per concept: definition · bands it may feed · grain · labels · anchor and example native fields · watch-list · refusal hook. "Live" means the field list or values were read on 2026-09-25; details are in the ledger.

### Family A — Unit identity (band `identity`)

#### `assessment_roll_key`
- **Definition:** the key under which a parcel appears on a jurisdiction's assessment roll or tax map.
- **Bands / grain:** `identity` (native key) · `parcel`.
- **Labels:** ca "Roll number" · us "SBL / print key" · neutral "Assessment roll parcel ID" · **default `neutral`** (label collision, §1).
- **Anchor and examples:** NY `SBL` (20-char), `PRINT_KEY` (47.18-1-33), `SWIS_SBL_ID`; Monroe `countysbl` (26-digit), `printkey`; Rochester `PARCELID`, `PRINTKEY`; Ontario roll number (MPAC's **ARN**): St. Catharines `ROLL_NUMBER` (19-digit), Norfolk `ROLLNUMFUL` (19) plus three short forms, Haldimand `RollNumber` (15), NPCA `ARN` (15) and `ASSESSMENT` (20).
- **Watch:** one key appears in several renderings (Norfolk publishes four in one layer; across Ontario sources the roll number now appears at 11, 15, 19 and 20 digits). Print-key zero-padding is county-specific. Cross-county string equality is not a join. Normalisation belongs to the normalize step, not to the ledger.
- **Refusal hook:** Brant's parcel layer carries no roll number at all, so `not_in_coverage` there. See `12` §4: the roll number is openly published by several municipalities, and **NPCA publishes an MPAC-derived parcel fabric with ARN for its own area (all twelve Niagara municipalities plus parts of Hamilton and Haldimand)**, even though the spine treats MPAC data as `not_licensed`.

#### `parcel_gis_key`
- **Definition:** a publisher's GIS-side identifier for a parcel polygon, used to join that publisher's own parcel, land-use and zoning layers.
- **Bands / grain:** `identity` · `parcel`. **Labels:** ca "Parcel GIS ID" · us "Municipal parcel ID" · neutral "Publisher parcel ID" · default `neutral`.
- **Anchor and examples:** St. Catharines `PROPGISID` (shared by parcel, landuse and zoning layers), Niagara Falls `pID`, NYS `MUNI_PARCEL_ID` (present, unsampled).
- **Watch:** not the roll number; not a system row id. A parcel row may carry both (St. Catharines does).
- **Refusal hook:** Welland and Hamilton publish no parcel fabric (spine doc), so the unit stays `footprint` or `address` grain.

#### `assessing_unit_code`
- **Definition:** the code of the assessing municipality that accompanies a roll key.
- **Bands / grain:** `identity` · attribute of a parcel. **Labels:** us "SWIS" · ca none held · neutral "Assessing unit code" · default `us`.
- **Anchor and examples:** NYS `SWIS` (6-digit, 145601), `CITYTOWN_SWIS`.
- **Watch:** New York's only. No shared code with Ontario (INTEGRATION.md); cross-border grouping is geometric. Whether an Ontario roll-number prefix encodes the municipality is **not verified**.
- **Refusal hook:** `not_joined` until a SWIS join names a city or town (matches the Erie fixture).

#### `municipality_label`
- **Definition:** the municipality named as text on a record. Not a key.
- **Anchor and examples:** NEI `municipality` ('St Catharines'), NYS `MUNI_NAME`, Welland Directory `City`. Monroe's field named `swis` belongs here, not to `assessing_unit_code` (it holds names).
- **Watch:** spelling drift; NPCA writes 'CITY OF NIAGARA FALLS' where NEI writes 'Niagara Falls'. Map to the spine jurisdiction slug (`st-catharines`), never mint the slug from the label.

#### `statistical_geography_code`
- **Definition:** a government statistical-geography code carried on a record, used to attach census-style aggregates to a jurisdiction. Not a parcel or facility key.
- **Bands / grain:** none as a parcel claim. Jurisdiction-level context only. **Labels:** ca "Census subdivision ID" · us "County FIPS" · neutral "Statistical geography code" · default `neutral` (the unit levels differ).
- **Anchor and examples:** NPRI `Census Division (CD) Unique ID` and `Census Sub Division (CSD) Unique ID` (`same` anchor, live); TRI `state_county_fips_code` (36029 for Erie) and CBP `STATE`/`COUNTY`/`GEO_ID` (`near`: a county is upper-tier, a CSD is roughly a municipality).
- **Watch:** this is how aggregates such as CBP and StatCan tables connect to anything: through a jurisdiction, never a unit. It does not make a parcel claim.

#### `civic_address`
- **Definition:** street address text or split parts for a unit.
- **Grain:** `address`. **Join method:** `normalized_address`, the weakest method; the contract already prefers `identifier`.
- **Anchor and examples:** NEI `businessstreetnumber` + `businessstreetname` + `businessunit`; NYS `PARCEL_ADDR`, `LOC_*`; Monroe `parceladdress*`; Rochester `SITEADDRESS`; Haldimand `StreetAddress`.
- **Watch:** restyling ('2 Broadway' → '2 Broadway Street') created false departures in the NEI analysis.

#### `legal_description`
- **Definition:** lot / concession / plan or lot-township-range text describing a parcel legally.
- **Anchor and examples:** Haldimand `Legal1`..`Legal8` (contents unsampled); Monroe `description1`..`description3` ('Lot 100 Twp 1 Sh Rng'); NPCA `Legal_Txt`; NPRI `Physical Land Survey Description` (a route from a facility row to a lot, if parsed).
- **Watch:** Haldimand's `LegalAddress` looks like an address but belongs here. Not a use description.

#### `parcel_fabric_flag`
- **Definition:** a publisher's record-type or lifecycle flag on a parcel-fabric row.
- **Anchor and examples:** Brant `PARCELCLASS` (only value observed: 'LAND'), Haldimand `Status` ('Existing').
- **Watch:** **never displayed as a class or use.** Brant's `PARCELCLASS` is the CA↔NY false friend of NY `PROP_CLASS`.

#### `publisher_row_id`
- **Definition:** system row identifiers (`OBJECTID`, `GlobalID`, `FID`, `Obj_id`, NEI `GSmartID`). **Excluded from joins.** Listed so they are not mistaken for keys.

### Family B — Activity registers (bands `identity` for the native key, `activity_registers` for the row)

#### `premises_register_key`
- **Aliases:** `establishment_register_key` (superseded working name).
- **Definition:** a publisher's stable key for one **premises-level record** in an activity register: a local employment survey, a business directory or licence register, or a regulatory facility registry.
- **Bands / grain:** `identity` (native key claim, grade `joined`, method `identifier`) and `activity_registers` (the row) · `register_unit`.
- **Facets (`register_family`):** `local_survey` (NEI), `local_directory` (Welland), `licence_register` (Hamilton, unprobed), `regulatory` (TRI, NPRI, DEC), `regulatory_cross_program` (EPA FRS).
- **Labels:** ca "Establishment ID" · us "Facility ID" · neutral "Register premises ID" · default `ca` for local registers, per-row `us`/`ca` for regulatory facets.
- **Anchor and examples:** `nei_id` (2022) / `NEI_ID` (2017–2019); Welland `ID`; Hamilton `LICENSE_NUMBER` (licence-level, `near`: three licence tables with no geometry); `tri_facility_id`; `epa_registry_id` / `frs_id`; NPRI `NPRI ID / ID INRP` (bilingual header cell, keep whole); NYS DEC `DEC_ID`, `CBSNO`, `PBSNO`, `SITE_ID`, `AUTHORIZATION_NUMBER` (five registries, five key names).
- **Watch:**
  - `nei_id` keys a **premises, not a business**: 544 ids kept the id and changed name between 2019 and 2022, against 121 departures. **Named `premises_register_key` (decided by Morgen, 2026-09-25).** The extension comment's working name `establishment_register_key` is kept as an **alias** so older references still resolve. The name matters because "establishment" is exactly the word Census CBP uses for a count, not a key (see the CBP false friend below).
  - Edition drift: `NEI_ID` → `nei_id`; a first departures run returned zero because of the casing.
  - Register keys never join across registers (NEI ↔ Welland ↔ TRI share nothing).
  - **CBP `ESTAB` is a false friend.** It is a count of establishments by NAICS × county × size class, with no key and no unit rows. It belongs to `jurisdiction_activity_aggregate`.
- **Refusal hook:** Hamilton publishes no comparable business inventory: `not_in_coverage` for the register, not "zero employment".

#### `industry_classification`
- **Definition:** an industry code and its title attached to a register row.
- **Bands / grain:** `activity_registers` · `register_unit`. **Labels:** ca "NAICS" · us "NAICS" · neutral "Industry classification" · default `ca`.
- **Anchor and examples:** NEI `primarynaics`, `industry` (title), `primarysector`; CBP `NAICS2017`; NPRI `NAICS / Code SCIAN` (bilingual header; NAICS 4 and 6 in the single-year tables); Welland `SectorDescription` (free text, `near`).
- **Watch:** never equated with `zoning_district` or `assessment_property_class` (a 710 parcel is not evidence of NAICS 31–33). NAICS edition per source vintage is not stated. `secondarynaics` = 0 means "absent".

#### `employment_size_band`
- **Definition:** a published employment range for a register row.
- **Bands / grain:** `activity_registers` · `register_unit`; feeds reading `employment_interval`. **Default `ca`.**
- **Anchor and examples:** NEI `sizerangeemployees` (2022), `EmployeeSizeRange` (2019), `SizeRange_Employees` (2017–2018). Near-neighbours: Welland `FullTime`/`PartTime`/`Seasonal` (counts, not a band); Hamilton `NUM_1_4`…`NUM_500_PLUS` (aggregate); CBP `EMPSZES`/`EMP` (aggregate).
- **Watch:** the 2019 band field also holds 'Business Permanently Closed' (a status quote: **register-quotation-only**) and 2017 holds 'Undetermined' (a refusal-like value). Band edges differ by source. Aggregates cannot attach to a unit.

#### `regulatory_activity_register`
- **Definition:** a regulator's or licensing body's register of facilities or licences, with the facts in it (releases, permits, licence status, closure indicator).
- **Bands / grain:** `activity_registers` · `register_unit`. **Facets by authority scale:** municipal (Hamilton licence tables), provincial/state (DEC registries), federal (NPRI, TRI).
- **Anchor and examples:** TRI `fac_closed_ind`, `pref_latitude/longitude`, `pref_accuracy`; NPRI per-facility, per-substance release/disposal/transfer quantities with a `Units` column, plus `Latitude/Longitude/Datum`; DEC and Hamilton expiry dates (`EXPIRATION`, `EXPIRY_DATE`).
- **Watch:** it corroborates large sites; it is not a register of industry. `fac_closed_ind` and NEI's 'Business Permanently Closed' are quotation-only words, and an expiry date is not a closure. Facility points join to parcels geometrically, and the regulator's own accuracy field should gate that (`12` §1): **TRI has one; NPRI's 39 Geolocations columns have none.** Never sum quantities across substances or units.

#### `jurisdiction_activity_aggregate`
- **Definition:** counts or statistics for a whole jurisdiction.
- **Grain:** `jurisdiction_aggregate`: **not a claim about any spine unit.**
- **Anchor and examples:** CBP 2022, StatCan NAICS tables, Hamilton Businesses by Employee Count, **Welland Business Licenses** (`id`, `Description`, `Year`, `Bus_count`: licence counts by type and year, not licence records).
- **Refusal hook:** at parcel level the object is `not_in_coverage`. They attach to a jurisdiction through `statistical_geography_code`, and can feed a reading or a coverage check (`12` §1).

### Family C — Land use and assessment (band `land_use`)

#### `zoning_district`
- **Definition:** the zone a by-law assigns to land, with its code, label and category.
- **Bands / grain:** `land_use` · `zone_polygon`. **Facets:** `code`, `label`, `category`, **`by_law_ref` (required for comparability)**.
- **Labels:** ca "Zoning" · us "Zoning district" · neutral "Zoning district" · default `ca`.
- **Anchor and examples:** Welland `Zoning` + `ZoneCat`/`ZoneCatSym`/`ZoneDesc`; Hamilton `ZONING_CODE`/`ZONING_DESC` + `PARENT_BY_LAW_NUMBER`/`BY_LAW_NUMBER`; Brant `ZONING`/`STATUS`; Niagara County NY `ZoneCode`; Rochester `BISZONING` (`near`: stored on an assessment snapshot).
- **Watch:** a zone code means nothing without its by-law (Hamilton has eight parent by-laws; Niagara Falls unions four). Welland packs holding, zone and exception in one string (`H-RH-111`). Null-attribute polygons are gaps. "Industrial" here is a use regime: false friend of NY `PROP_CLASS` 700–799. The NYS statewide parcel layer holds no zoning.

#### `zoning_site_modifier`
- **Definition:** an exception or holding provision attached to a zone.
- **Anchor and examples:** Hamilton `EXCEPTION1..3`, `HOLDING1..3` (each with by-law and URL).
- **Watch:** rides with the zoning claim; it is not a separate rung. Where a publisher packs it into the code (Welland), the normalize step must split it.

#### `official_plan_designation`
- **Definition:** a land-use designation from an official plan: policy, not regulation.
- **Labels:** ca "Designation" · us none held · default `ca`. Uses the ladder's own word ("Designation, zoning, property class").
- **Anchor and examples:** Niagara Falls `DESIGNAT`; Brant `OP_Designation` (+ `Within_SAB`, `Within_BUA`); St. Catharines `DISTRICT_LANDUSE_DESIGNATION` / `GENERAL_LANDUSE_DESIGNATION`; Welland OP Schedule B `Adopted_OP`, `Other_Use`, `SiteSpec`.
- **Watch:** never presented as zoning. `SiteSpec` is `near` to `zoning_site_modifier`.

#### `assessment_property_class`
- **Definition:** the assessor's classification of a property for taxation.
- **Bands / grain:** `land_use` (stamped as "property class, not zoning, not NAICS") · `parcel`. **Labels:** ca "Property code" (MPAC's `PropCode`) · us "Property class" · neutral "Assessment property class" · **default `neutral`** (changed from `us` after the second live pass: an Ontario code is now observed, but the two code tables are not comparable code-for-code).
- **Anchor and examples:** NYS `PROP_CLASS` (string 710), Monroe `propertyclass` (integer 710), Rochester `CLASSCD`/`CLASSDSCRP`; coarse near-neighbours Rochester `PROPERTYTYPE`/`RESCOM`; Ontario NPCA Parcels Cityview `PropCode` (3-digit MPAC code, 218 distinct values; code table not read).
- **Watch:** same code, different label text across publishers (710 'Manufacture' vs 'Manufacturer'). Rochester's rows read `PROPERTYTYPE` 'Industrial' and RESCOM 'C' together. Brant `PARCELCLASS` is a false friend. The NPCA layer's licence is unverified (`12` §4).

#### `assessment_use_descriptor`
- **Definition:** the assessor's building-use code inside a class.
- **Anchor and examples:** NYS `USED_AS_CODE`/`USED_AS_DESC` (F09 'Light mfg', F03 'Dstr wrhouse', E02 'Walk-up off' all seen on class 710).
- **Watch:** class and use can disagree inside one record, so a class 710 parcel is not necessarily a manufacturing building.

#### `assessed_value`
- **Definition:** a monetary value on the assessment roll, with facets `assessed`, `land`, `taxable`, `market_estimate`.
- **Bands:** `land_use` (claim or refusal beside the class, as in the Welland fixture). **Default `us`** (Ontario's is `not_licensed`).
- **Anchor and examples:** NYS `TOTAL_AV`/`LAND_AV`; Monroe `totalassessedvalue`; Rochester `CURRENT_TOTAL_VALUE`.
- **Watch:** `FULL_MARKET_VAL` and `CURRENT_TAXABLE_VALUE` are `near`, not assessed value. Keep apart in any calculation.

#### `assessment_roll_context`
- **Definition:** the roll's year and section. Stamp-adjacent: the year maps to `observation_on`.
- **Anchor and examples:** NYS `ROLL_YR` (2025), `SPATIAL_YR`; Monroe `rollyear` (2026); `ROLL_SECTION` (code) / `rollsection` (label 'Taxable').
- **Watch:** neighbouring counties carry different roll years. The geometry year and the roll year are two dates and both must survive. **"Roll" is the false friend of Ontario "roll number".**

### Family D — Constraint overlays (band `constraints`)

#### `constraint_overlay` (family parent; no rows of its own)
- **Definition:** an overlay or encumbrance a joined source states, named by its authority and never summed. Grain is usually `zone_polygon` (join by `point_in_polygon`, `containment` or `overlap` with a stated threshold), but **the read layers show three geometries**: polygons (NPCA, FEMA, PSEZ, BOA), a **polyline hazard limit** (Haldimand Flood Hazard Limit) and **points** (Niagara heritage). Lines and points need a stated distance or side rule, not `point_in_polygon`.
- **Watch:** a **filled negative** is allowed only inside a layer's own coverage; a missing overlay is `not_joined` or `not_in_coverage`, never "clear". NPCA says its floodplain layer is not an exhaustive inventory, so absence there proves nothing. One HeavyMap concept spans many services, one per publisher/family (NES publishes one service per family, keyed by `series_cod`).

Children (each row names its authority; `authority_scale` is proposed in `12`):

- **`flood_hazard_overlay`**: FEMA NFHL zones (`FLD_ZONE`, `SFHA_TF`; read from a mirror), NPCA regulation lands (2,537) and regulated floodplain (1,316; almost attribute-free), Haldimand Flood Hazard Limit (polyline with `Elevation`, `Uprush`, layer id 31).
- **`natural_heritage_overlay`**: Niagara NES series (`series_cod`, `layername`), NHS, wetlands and woodlands.
- **`heritage_designation_overlay`**: Niagara Designated Heritage Properties (318 **points**: `SITE_NAME`, `ADDRESS`, `MUNICIPALITY`), Welland Designated Heritage Parcels (31 polygons with `Parcel_No`).
- **`planning_policy_overlay`**: PSEZ (31 polygons Ontario-wide, dated 2019/2020; Hamilton 3, Brantford 2, Haldimand 1, none in Niagara Region), growth-boundary flags (Brant `Within_SAB`/`Within_BUA`), NY BOA (`BOA_Name`, `Date_des`), Niagara Falls Brownfield CIP (three attributes). **Band: `constraints`** (decided by Morgen, 2026-09-25), each claim named by its authority. "Brownfield" is a four-way false friend across BOA, CIP, Ontario RSC and OSM.

### Family E — Derived-reading inputs (feed band `derived_readings`; never copied forward as raw fields)

#### `floor_area_published`
- **Definition:** a published building floor area, in the source's unit.
- **Anchor and examples:** NYS **`GFA`** (integer sq ft; populated on 1,046 of 1,159 Erie 700-series parcels); NEI `indoorgfa` (premises indoor area, unit unstated: `near`; absent from the 2022 CSV header read this pass).
- **Watch:** **`SQFT_LIVING` and Monroe `squarefeetlivingarea` are habitable residential area** (false friend, null on industrial rows). Monroe offers no GFA. NYS **`SQ_FT` is lot area** (`lot_area_published`), even though INTEGRATION.md groups it with floor area.

#### `lot_area_published`
- **Definition:** a published parcel/lot area (acres, sq ft or m²), assessor-stated or geometry-computed.
- **Anchor and examples:** NYS `ACRES` (assessor) vs `CALC_ACRES` (geometry), `SQ_FT`; Monroe `acres`; Norfolk `Acres`; Rochester `STATEDAREA`; Niagara Falls `AREA_SQM`.
- **Watch:** zero is used as "unknown" (`SQ_FT` = 0, `STATEDAREA` '0.00', `ACRES` 0.01 beside `CALC_ACRES` 11.59). A zero is never carried forward as a quantity (`12` §3).

### Family F — Presentation-tier (D-13)

#### `owner_of_record`
- **Definition:** owner name and mailing fields on an assessment record.
- **Watch:** per **D-13**: retain at ingest, decide tier at presentation. Public record in NY under Real Property Tax Law. PCDP v1 has no owner rung and the fixtures carry none, so no ledger row sets a band. Examples: NYS `PRIMARY_OWNER`, `ADD_OWNER`, `MAIL_*`; Rochester `OWNERNME1`; **NPCA Parcels Cityview `Owner`** (field present, values deliberately not sampled). Per 08, the Ontario *municipal* layers checked carry no owner field, and the Ontario municipal parcel layers read here (Norfolk, Haldimand, Brant, St. Catharines, Niagara Falls) showed none. The NPCA layer is the exception, which makes its licence question (`12` §4) a D-13 question too.

#### `owner_category`
- **Definition:** a non-identifying owner-type code. NYS `OWNER_TYPE` (value '8' on every sampled Erie row; meaning **not verified**). Candidate for an earlier tier than the name.

## 4. Concept-to-concept relations

| Pair | Relation | Note |
|---|---|---|
| `premises_register_key` (local) ↔ `premises_register_key` (regulatory) | `near` | Same job, different registers, no shared key. |
| `zoning_district` ↔ `assessment_property_class` | **different concepts, false-friend pair** | "Industrial" appears in both and means a use regime vs an assessed class. |
| `official_plan_designation` ↔ `zoning_district` | different concepts | Policy vs regulation. |
| `zoning_site_modifier` ↔ `official_plan_designation` (`SiteSpec`) | `near` | Plan-level vs by-law-level exception. |
| `assessed_value` (assessed) ↔ `assessed_value` (market, taxable) | `near` | Facets of one concept; not interchangeable. |
| `floor_area_published` ↔ `lot_area_published` | different concepts | NYS `SQ_FT` sits on the lot side. |
| `assessment_roll_key` ↔ `assessment_roll_context` | different concepts | The "roll" false friend. |
| `flood_hazard_overlay` (FEMA zone) ↔ (NPCA regulation limit) | `near` | Hazard zone vs regulatory limit. |

## 5. Deliberately not concepts

- **Owner *name* as a ladder object.** Handled as tiering (D-13), not a rung.
- **Sector or "industrial" scores.** No composite or opaque scores; readings only.
- **Cross-border unified key.** The spine already refuses to invent one.
- **CBP `ESTAB` as a register key.** False friend, filed under aggregate.

## 6. Reading identifiers (illustrative catalog, not closed)

| Reading | Inputs (concepts) | Notes / refusal |
|---|---|---|
| `floor_area_m2` (existing) | `floor_area_published` | Keep source unit on the stamp. `not_in_coverage` when none published (Monroe, Ontario municipalities in this dig). |
| `coverage_ratio` (existing) | footprint area, `lot_area_m2` | Never `0`: refuse with the missing input's reason. |
| `employment_interval` (existing) | `employment_size_band` | Carry the band as a range; not a point value. |
| **`lot_area_m2` (proposed new)** | `lot_area_published` | Needed as the denominator of `coverage_ratio`. Reject sentinel zeros (see `12` §3). |

Other readings from `04-uk-capability-glean.md` (containment deltas, register-agreement confidence, gap distance) are deliberately left for a later ticket.

## 7. Open questions for Morgen

1. ~~Keep `establishment_register_key`, or rename to `premises_register_key`?~~ **Decided 2026-09-25: `premises_register_key`**, with the old name kept as an alias.
2. Confirm the default genres: `assessment_roll_key`, `parcel_gis_key`, `assessment_property_class` (**changed from `us`**) and `statistical_geography_code` default to `neutral`; `assessed_value` to `us`; everything else `ca`.
3. ~~`planning_policy_overlay` band~~ **Decided 2026-09-25: `constraints`.**
4. Is `lot_area_m2` welcome as a named reading?
5. **NPCA's public MPAC-derived parcel fabric** (`12` §4): does OGL v2 as stated on the item actually cover HeavyMap's use? This decides whether the "MPAC roll `not_licensed`" wording, and the "no parcel fabric" statements for Welland and Hamilton, are revisited.

## 8. Evidence and method

- **Live reads, 2026-09-25**, public read-only endpoints, no keys, in two passes. Pass 1: ArcGIS REST `?f=json` field lists and a few value samples for NYS Tax Parcels Public, Monroe `Parcels_Public`, Rochester `TaxParcel2024`, Norfolk, Haldimand, Brant, St. Catharines, Niagara Falls, Welland, Hamilton, NES; NEI 2017/2019/2022 CSV headers via HTTP Range; EPA Envirofacts `tri_facility`; Census CBP `variables.json`. Pass 2: Hamilton licence tables, Welland licence and heritage layers, NYS DEC registries, BOA and Brownfield CIP, Niagara heritage, Haldimand flood limit (layer 31), NPCA's ArcGIS Online services (fields, counts, item metadata), the PSEZ shapefile (DBF read), FEMA flood zones via an ArcGIS Living Atlas mirror, and NPRI via the ECCC data mart's real API (`data-donnees.az.ec.gc.ca/api`, found in the page's JavaScript bundle; CSV headers by Range). Raw responses were kept in the session scratchpad, not in the repo.
- **Still not read:** the MPAC product itself (not held); FEMA's authoritative host (`hazards.fema.gov` reset the connection on three paths); the NPCA licence PDF (the item's link returns 404); Niagara County NY parcels (still `Token Required` on a re-check); CBP data queries (need an API key); NYS Building Footprints layer 0 (index moved); NPCA owner values (deliberately not sampled) and the MPAC property-code table. The ledger now has no `unverified` or `catalog_only` rows; the remaining `documented` rows are repo-doc evidence not re-read live.
- **Documented, not re-read:** NEI cross-year behaviour (`niagara-atlas/logs/2026-08-23.md`), D-13, `INTEGRATION.md` crosswalk, MCS v4 rows, `07`/`08`/`09` (read-only, not edited).
- **Not edited:** MCS, `07`, `08`, `09`, `docs/`, PR #13, the Linear ticket state.
