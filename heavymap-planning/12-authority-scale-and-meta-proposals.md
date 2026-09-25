# 12 — Authority scale and meta-field proposals

**Linear:** [NIA-10](https://linear.app/niagaraassembly/issue/NIA-10/jurisdiction-roster-v1-exhaustive-ca-municipalities-us-countiesplaces) (extension comment `cea459e0`)
**Built:** 2026-09-25 · **Status:** **proposals only.** Nothing here edits the MCS, `docs/architecture/`, `vocab/`, or PR #13. Encoding is Cursor Agent 2's job, after Morgen skims `10` and `11`.
**Reads with:** `10-joining-concepts-v1.md` (concept IDs) and `11-synonym-parallel-ledger-v1.csv` (evidence).

## 0. Summary

| # | Question | Recommendation | Who decides |
|---|---|---|---|
| 1 | Do federal registers (NPRI, TRI, CBP…) need their own grouping on the parcel table? | **No.** Stamped claims under existing bands, plus an **`authority_scale`** on the stamp. UI may group or filter by scale *within* a band. | Morgen (confirm) |
| 2 | Which meta fields should claims/fixtures grow? | §2: `concept_id`, `native_field_name`, `native_value_raw`, `native_unit`, `ledger_id`, `display_label_key`, `facet`, `authority`, `authority_scale`, `claim_grain`, `access_tier`. | Cursor + Morgen |
| 3 | How are zeros and placeholders handled? | Source-level sentinel map; a sentinel becomes a refusal, never a number. | Morgen (confirm) |
| 4 | Should "roll number" and "MPAC assessment data" be one refusal? | **Split them, and re-examine both.** The key is openly published by several municipalities, and NPCA publicly serves an MPAC-derived parcel fabric (ARN, property code, owner) for its own area (all twelve Niagara municipalities plus parts of Hamilton and Haldimand) under a stated OGL v2 whose PDF is unreadable. | **Morgen** (licence check needed) |
| 5 | MCS `dossier_bands` still uses an older vocabulary | Mapping table in §5, for a later MCS schema task. `planning_policy_overlay` band placement: **decided 2026-09-25, `constraints`**; `history` and `servicing` still need a decision. | Morgen / CoS |

## 1. Federal grouping: band vs `authority_scale` vs both

### The three options

| Option | What it is | Verdict |
|---|---|---|
| A. A federal grouping on the parcel table | A dedicated group or rung for federal registers | **Reject.** The ladder is fixed at six rungs and PCDP "does not add a seventh". |
| B. Stamped claims under existing bands + `authority_scale` | Each federal claim sits on its natural band and carries a scale | **Recommend.** |
| C. Both | B plus a federal group | Reject: A adds nothing B lacks and reopens the ladder. |

### Why B

1. **Federal registers do not share a band.** NPRI and TRI facility records are `activity_registers`. FEMA NFHL flood zones are `constraints`. CBP and StatCan tables are **not parcel claims at all** (below). A single federal group would cut across three different kinds of fact.
2. **Scale cross-cuts bands.** `constraints` already holds a municipal floodplain limit, a regional conservation-authority limit, a provincial policy zone and a federal flood zone. The claims contract already asks each overlay to be "named by its authority". `authority_scale` is the structured form of that sentence.
3. **Presentation can still group.** A UI may sort or filter by scale within a band. That is a view over stamps, not a new data structure.

### Two things federal data forces

**(a) Aggregates are not parcel claims.** CBP (`ESTAB`, `EMP`, `PAYANN` by NAICS × county × size) and StatCan NAICS tables have no unit key and no unit rows. Recommendation: `jurisdiction_activity_aggregate` claims are **not** attached to spine units. They may serve as inputs to a coverage or register-agreement reading, or as a validation cross-check on NEI totals, and appear at the jurisdiction level only. Parcel-level refusal for that object: `not_in_coverage`.

**(b) Facility points need an accuracy-gated join.** No federal register shares an id with a parcel or NEI premises, so they join geometrically. TRI publishes its own accuracy fields (`pref_accuracy`, `pref_collect_meth`; on the sample row 150 and `UN`, unit not verified). NPRI does not: its 39 Geolocations columns have latitude, longitude and datum but no accuracy or method field, so a geometric join for NPRI has nothing to gate on and should default to `proximity` or `not_joined`. Proposal: `point_in_polygon` only when the source's stated accuracy is tighter than the parcel scale; otherwise `proximity` with the distance on the stamp, or `not_joined`. The threshold is undecided and belongs to the normalize ticket. This also keeps the rule "no operating-status inference" intact: a register point near a parcel never becomes "operating today".

### Definition of the five values

| `authority_scale` | Means | v1 examples |
|---|---|---|
| `municipal` | A single-tier or lower-tier municipality, or a US city/town/village | Welland zoning, Hamilton zoning, Brant parcels, Norfolk parcels, Rochester parcels, Buffalo |
| `regional` | Upper-tier or county-level government, or a watershed/conservation authority | Niagara Region (NEI, NES, NHS), NY **counties** (Erie, Monroe), NPCA |
| `provincial_or_state` | Province or state government or its agency | PSEZ, Greenbelt/NEP, NYS ORPTS roll data, NYS DEC registries, MPAC (provincial agency) |
| `federal` | Federal government | ECCC NPRI, EPA TRI, Census CBP, StatCan, FEMA NFHL |
| `cross_border_register` | A register spanning both countries under one schema and body | None in the v1 sources read. Candidates: Seaway/Great Lakes bodies (blocked in MCS). Keep the value but expect it to be rare. |

Cautions:

- **Attach the scale to the authority of the assertion, not the host portal.** The NYS Tax Parcels layer is *published* by NYS ITS but says parcel geometry was "incorporated as received from County Real Property Departments" and the attribute values come from ORPTS's roll. So one layer carries two authorities (`regional` for geometry, `provincial_or_state` for roll data). Hence the separate `authority` field in §2.
- **"County" is a false friend of tier.** Norfolk, Haldimand and Brant are **single-tier** Ontario counties (`municipal`). NY counties such as Erie are upper-tier governments (`regional`). Do not derive scale from the word "county".
- **OSM has no scale.** It is a crowdsourced source, not an authority. Leave the field absent rather than inventing a value.

## 2. Meta fields to add (proposals)

Levels use the fixtures' shape: a **claim** has `about`, `grade`, `assertion_state`, `value`, and a `stamp`.

| Field | Level | Purpose | Evidence that it is needed |
|---|---|---|---|
| `concept_id` | claim | Links the claim to a joining concept (`10`) without renaming the native field. | The fixtures show `nei_id` and `sbl` only by `name`. |
| `native_field_name` | claim | Verbatim publisher field, incl. casing and edition variant. Replaces the free `name` on native-key claims. | `NEI_ID` (2017–2019) vs `nei_id` (2022); a cross-year run returned zero because of it. |
| `native_value_raw` | claim | Value exactly as published before any normalisation (the atlas rule: the original never disappears). | Roll numbers appear in four renderings; Rochester `STATEDAREA` is a string '0.00'. |
| `native_unit` / `native_type` | claim | Unit and type as published (`sq ft`, `acres`, `string`, `integer`). | Monroe `propertyclass` is an integer, NYS `PROP_CLASS` a string; NYS `GFA` is sq ft, Niagara Falls `AREA_SQM` is m². |
| `ledger_id` | claim | Traceability to the ledger row that classified the native term (which carries `relation`). | `11` |
| `facet` | claim | Which part of the concept: `code`, `label`, `by_law_ref`, `print_form`… | Zone codes need their `by_law_ref` (Hamilton has eight parent by-laws). |
| `display_label_key` | vocabulary (not per claim) | A label key per concept and genre, e.g. `label.ca.zoning_district`, `label.neutral.assessment_roll_key`. | The genre rules in `10` §1. |
| `authority` | stamp | Named body that made the assertion (`County Real Property Dept.`, `NYS ORPTS`, `City of Welland`). | The NYS layer's two authorities. |
| `authority_scale` | stamp | One of the five values in §1. | §1 |
| `claim_grain` | claim | `parcel`, `footprint`, `address`, `register_unit`, `zone_polygon`, `jurisdiction_aggregate`. Makes it checkable that an aggregate never attaches to a unit. | CBP, Hamilton employee-band table. |
| `register_family` | claim (for `premises_register_key`) | `local_survey`, `local_directory`, `licence_register`, `regulatory`, `regulatory_cross_program`. | `nei_id` vs `tri_facility_id`. |
| `edition_label` | stamp | Named edition (e.g. `NEI 2019`) when field names or bands shift per edition. Complements `observation_on`. | NEI band field renamed twice. |
| `access_tier` | claim | D-13: presentation tier for a retained field (anonymous, authenticated, licensed). Values undecided. | `owner_of_record`, `owner_category` (PCDP v1 has no owner rung). |
| `is_register_quotation` | claim | True where a claim carries a register's own word (`closed`, `departed`…). Makes the quotation-only rule checkable. | NEI 2019 'Business Permanently Closed'; TRI `fac_closed_ind`. |

**Sketch** (illustrative only; not a fixture edit) for the Welland `nei_id` claim:

```json
{
  "about": "native key",
  "concept_id": "premises_register_key",
  "native_field_name": "nei_id",
  "native_value_raw": "SYN-8130",
  "register_family": "local_survey",
  "claim_grain": "register_unit",
  "grade": "joined",
  "stamp": { "authority": "Niagara Region", "authority_scale": "regional", "edition_label": "NEI 2022", "join_method": "identifier" }
}
```

## 3. Sentinels, zeros and placeholders

The claims contract forbids `0` where a quantity could not be computed. Several **publishers** already do exactly that, so refusal has to begin at ingest, not at display.

| Source field | Placeholder seen | Reality |
|---|---|---|
| NYS `SQ_FT` | `0` on every sampled Erie industrial row | Lot-area field left empty; floor area is in `GFA`. |
| NYS `ACRES` | `0` / `0.01` beside `CALC_ACRES` 11.59 | Placeholder or unit mismatch on a part-parcel row. |
| Rochester `STATEDAREA` | `'0.00'` | Unknown area. |
| NEI `secondarynaics` | `0` | Absent. |
| NEI 2017 `_z` | `-9999` | Absent. |
| NEI band | `'Undetermined'`, `'0 Employees'` | Unknown, or a stated zero. Cannot be told apart without the data dictionary. |

**Proposal:** a per-source **field map** (a normalize-step artifact, not a claim field) lists the sentinel values for each native field. A sentinel produces a **refusal** with reason `not_in_coverage` (the publisher does not release that object) rather than a number. Where a source also uses zero legitimately (a stated `0 Employees`), the field map must say so and route it to a claim. `lot_area_m2` and `floor_area_m2` must reject sentinel input rather than convert it.

## 4. Roll number and MPAC data: two objects, and one publicly served MPAC-derived layer

**Observation (live, 2026-09-25):**

*Municipal layers publishing the roll number*
- St. Catharines' open Parcel Fabric carries `ROLL_NUMBER` (19-digit).
- Norfolk's open Parcels layer carries `ROLLNUMFUL` plus three short forms.
- Haldimand's open `ParcelsOnlinePublic` carries `RollNumber` (15-digit).
- Brant's Parcels layer carries no roll number or other key beside a GlobalID.
- Niagara Falls' parcel table carries `pID`, no roll number.

*NPCA (Niagara Peninsula Conservation Authority) public ArcGIS Online services*
- **Assessment Parcels** (284,250 features) and **Parcels Cityview** (265,717) are described on the items as the Digital Assessment Parcel Fabric of the Ontario Parcel database: "areas defined by a boundary and an assessment roll number (ARN)... as determined by Municipal Property Assessment Corporation (MPAC)", tagged `MPAC`.
- Fields include `ARN` (15-digit), `ASSESSMENT` (20-digit), civic address parts and municipality; Parcels Cityview adds **`PropCode`** (3-digit MPAC property code, 218 distinct values), **`Owner`** and `Legal_Txt`. Neither layer has a value field.
- Coverage read from the layer (counts by municipality): all twelve Niagara municipalities in full, plus **part** of Hamilton (87,962 features), part of Haldimand (11,489), and only edge slivers of Brant (63) and Burlington (1). **Norfolk and Brantford are absent.** This corrects an earlier statement that it covered Brant and Burlington. About 11,788 features have a blank municipality.
- Both items name the **Open Government Licence v2** through a link to a PDF on `gis.npca.ca`. **That link returns 404**, so the licence text itself was not read, and whether NPCA may relicense MPAC-derived data is unverified.
- Owner values were deliberately not sampled.

**Licence investigation (2026-09-25; web sources plus ArcGIS item metadata; not legal advice).**

- **Where the data comes from.** The layers describe themselves as the Digital Assessment Parcel Fabric of **Ontario Parcel**: a dataset created in 2002 under a tripartite agreement among the Ministry of Natural Resources (now NDMNRF), MPAC and Teranet. MPAC maintains the assessment parcels, Teranet the ownership parcels (land registry), and the Ontario government the Crown parcels. It is distributed by Geospatial Ontario.
- **What the owner of that dataset says about use.** The LIO item calls it "**commercially licensed data with restricted usage**", "for non-commercial use". Eligible organizations (ministries, agencies, boards and commissions, indigenous communities, **conservation authorities**, non-profits) receive it at no cost by signing an *Ontario Parcel licensing agreement (MNR General List User Licence Agreement)*. "Corporations and for-profit entities should contact MPAC and Teranet." The Terms of Use also say the geometry is "an index of property locations, not a legal representation of property boundaries" and must not be used for legal purposes or for area, depth or frontage calculations. The licence agreement text itself was not found.
- **What MPAC says.** MPAC data can be used by municipalities "for planning purposes only", generally internal activity (land-use planning, tax billing and collection, consultation). Elsewhere the Ontario data catalogue records MPAC data as not public because of legal and contractual obligations. Roll numbers and property addresses are viewable free through MPAC's AboutMyProperty; owner names are personal information under MFIPPA. Neither source addresses a conservation authority republishing the fabric.
- **What NPCA did.** NPCA is an eligible licensee. Its two parcel layers are shared publicly in ArcGIS Online (Assessment Parcels: about 457 MB, 60,466 views; Cityview: about 216 MB), both modified 2026-05-29. **Neither appears among the 59 datasets on NPCA's own Open Data hub.** Fourteen of the 30 NPCA items listed, including the two parcel layers, point at the same OGL v2 PDF under a portal site-template path, which suggests a site-wide default licence link rather than a decision about MPAC-derived data. That PDF returns 404.
- **Reading.** Public access is not the same as a licence to reuse. NPCA can only grant rights it holds, and what it holds appears to be a non-commercial user licence from GEO. Whether HeavyMap qualifies as non-commercial is not a data question; it depends on HeavyMap's intended use.
- **Status: observed, not cleared.** Keep `not_licensed` for MPAC assessment data. Do not ingest the NPCA parcel layers.

**What the current text says.** `parcel-identity-spine.md`: "Ontario's assessment roll (MPAC) is the usual cross-municipality parcel identifier, and it is fee-based. For v1 that native key is `not_licensed`." It also records Welland and Hamilton as having no parcel fabric. The Welland fixture refuses "MPAC roll" as `not_licensed`, and its stamp note reads "The refusal is about licence, not about whether the land has an assessment". MCS v4 lists `npca_assessment_parcels` as `blocked`.

**Proposal.**

1. **Split the refusal object into two.**
   - **Roll-number key** (`assessment_roll_key`): where an open layer publishes it, it can be an `observed` native-key claim under that publisher's licence. Where it is absent (Brant, Niagara Falls in these layers), `not_in_coverage` for that layer.
   - **MPAC assessment data** (assessed value, property class): stays `not_licensed` **until the NPCA question below is settled**.
2. **Settle the NPCA question before anything is encoded.** The licence investigation above points away from clearance: the upstream dataset is commercially licensed, non-commercial recipients only, and the OGL link on NPCA's items looks like a template default whose PDF is dead. Recommended checks: (a) ask NPCA whether the two layers are intended for public reuse and under what terms; (b) ask Ontario Parcel (`ontarioparcel@ontario.ca`) whether HeavyMap's intended use is eligible, or MPAC and Teranet if it is commercial. Until then, treat NPCA rows as **observed, not cleared**, and keep `not_licensed` in the fixtures.
3. **If it were cleared (currently unlikely),** three statements in the current prose become out of date: MPAC roll `not_licensed` (roll key and, possibly, property class), "Welland's open data had no parcel fabric" and "Hamilton's open catalogue had no parcel layer" (NPCA covers both as assessment parcels, though not as a municipal-fabric publisher). Cursor Agent 2 would need a decision from Morgen on each.
4. **Owner (D-13):** `Owner` in an Ontario open-licence layer contradicts the earlier finding that Ontario layers carry no owner field. Retain and tier as D-13 says, and include this layer in the per-source legal check D-13 already asks for.
5. **MCS:** `npca_assessment_parcels` no longer matches what is live (public, not blocked). This is a proposal for a later MCS task, not an edit.

This changes the wording of existing contract sentences, so it needs Morgen's call and a licence check before any encoding.

## 5. Band vocabulary: MCS v4 vs the ladder

The ladder allows exactly six tokens in `dossier_bands`. MCS v4's column still holds an older vocabulary:

| Value in MCS v4 `dossier_bands` | Rows | Ladder token | Confidence |
|---|---:|---|---|
| (empty) | 13 | (leave, but see below) | n/a |
| `history\|land_use` | 12 | `land_use` + `history` needs a decision | **needs decision** |
| `land_use\|risk` | 11 | `land_use` + `risk`→`constraints` | likely |
| `environment\|risk` | 9 | `constraints` | likely |
| `business` | 8 | `activity_registers` | likely |
| `identity\|land_use` | 6 | already ladder tokens | ok |
| `identity` | 6 | ok | ok |
| `access` | 5 | `derived_readings` (the ladder doc says access distances are readings, not a rung) | likely |
| `readings` | 3 | `derived_readings` | likely |
| `land_use` | 2 | ok | ok |
| `servicing` | 2 | `constraints` or `derived_readings` | **needs decision** |
| `access\|risk` / `servicing\|risk` / `risk\|history` / `land_use\|business` / `identity\|business` | 1 each | combinations of the above | follow the row above |

Seven old tokens are outside the ladder: `history`, `risk`, `environment`, `business`, `access`, `readings`, `servicing`. The ladder's own rule: "Use only the six tokens." **No MCS cell is changed here.** This is input for a later MCS schema task (NIA-12 territory, out of scope).

`history` and `servicing` are the two that cannot be mapped without a decision. `history` covers building age, demolition permits and vacancy (`hamilton_buildings`, `hamilton_vacant_buildings`, `hamilton_building_demolition_permits`), which are register rows or readings rather than land-use. `servicing` covers wastewater catchments and combined-sewer overflows, which read as constraints or capacity readings.

**`planning_policy_overlay` placement.** PSEZ, growth-boundary flags, BOA and Brownfield CIP restrict or shape what is permitted, but they are policy rather than physical hazard. **Decided by Morgen 2026-09-25: `constraints`**, each named by authority (matches the ladder's "overlays and encumbrances a joined source states").

**Concept IDs in the MCS.** A later schema task could add a `joining_concept_ids` column to Part 2 so a dataset row declares which concepts its fields feed. Proposal only.

## 6. Notes for the Cursor encode (Agent 2)

Things seen while reading `docs/architecture/` at `main` (49893d0) and the PR #13 fixtures that the encoder should know. None is a defect in the prose; each is a place a ledger row now gives more precision.

1. **Erie fixture floor area.** The fixture uses a published `20000` sq ft. The real field is `GFA`, not `SQ_FT` (§3 and `LG-094`–`LG-096`). Any stamp `note` naming a native field should say `GFA`.
2. **Fixture `about: "native key"` claims** carry `name` only. See `native_field_name` and `concept_id` (§2).
3. **Welland "MPAC roll" refusal** may need splitting (§4).
4. **`assessment_property_class` label.** The Erie fixture already stamps class 710 as "an assessment class, not zoning, not NAICS". The ledger backs that up with live evidence: the 700-series, `USED_AS`, and Rochester's 'Industrial'/'C' disagree with one another.
5. **Vocab has no concept layer.** `pcdp.vocab.json` says its `derived_reading_identifiers` are illustrative and "not a closed catalog". A parallel `concepts` list (IDs from `10`) would fit the same pattern. `lot_area_m2` would be a fourth reading identifier.

## 7. Explicitly out of scope

- Editing the MCS, `07`, `08`, `09`, `docs/architecture/`, `vocab/`, or PR #13.
- Opening dig or normalize child tickets; the NIA-12 MCS handoff; the NIA-15 doc migration.
- Publishing a site, UI chrome, or label typography.
- Any composite or opaque score, including a "register-agreement" score (readings from `04-uk-capability-glean.md` stay deferred).
- Inventing MCS rows. **No new dataset rows are proposed.**
- Normalising values, minting spine keys, or choosing a canonical roll-number form.
- The access-tier mechanism itself (D-13 defers it).
- Cross-border unified keys (the spine already refuses to invent one).

## 8. Operational findings for the dig agent (read on 2026-09-25; nothing edited)

These matter to the roster and catalog, so they are recorded here rather than written into `07`/`08`/`09`:

1. **NPCA serves an MPAC-derived parcel fabric publicly** (§4). MCS row `npca_assessment_parcels` says `blocked`. Worth a proper dig, plus the licence question.
2. **Niagara County NY parcels** (`gis.niagaracounty.com … /NC_GIS/NC_GIS/FeatureServer/4`) returned `Token Required` (code 499) on two checks. The folder listing failed with an internal error: its ArcGIS component was refusing connections. Likely an outage. Re-check before treating the county's own server as the only route.
3. **Census CBP data queries** now redirect to `missing_key.html`; `variables.json` is still public. A key is needed for county queries.
4. **ECCC NPRI** is readable: the data mart page is a JavaScript app, but its real API is `data-donnees.az.ec.gc.ca/api` (`path_contents`, `file`), and the CSV files read with a Range header. Data files are large (Releases 375 MiB, Geolocations 13 MiB). A CKAN lookup on `open.canada.ca` resolves the package (`7f9d942b-…`) but lists only HTML views.
5. **FEMA NFHL** (`hazards.fema.gov …/NFHL/MapServer/28`) reset the connection on three paths. The fields were read from an ArcGIS Living Atlas mirror instead.
6. **NYS Building Footprints** service: layer `0` "not found" (the index moved).
7. **Haldimand Flood Hazard Limit** is layer **31**, not 0, and it is a polyline.
8. **Welland "business licences"**: the open item is counts by type and year; MCS `welland_business_licences` (blocked) is not it. Licence records are not public.
9. **Hamilton licence data** is three geometry-free tables (12, 578 and 654 rows), not a business inventory.
10. **PSEZ** shapefile is dated (identified 2019-12-20; file modified 2020-01-08) and holds nothing for Niagara Region.
11. **`INTEGRATION.md` §6** grouped `SQ_FT` with `GFA` as floor area. Live data says `SQ_FT` is lot area. (Corrected in the working tree, uncommitted.)

## 9. Ready for Cursor encode?

**Conditionally yes**, for §2 (meta fields), §3 (sentinels), the concept catalog, and the ledger rows marked `live_verified` (109 of 118; the other 9 are `documented`, and none are `unverified` or `catalog_only` after the second live pass). **Not yet** for:

- §4 (roll number, MPAC and NPCA): needs Morgen's decision and a licence check. This is now the largest open item, and it affects three sentences in the existing prose.
- The two unmappable old bands, `history` and `servicing` (§5); these concern the MCS, not Agent 2's first slice. (`planning_policy_overlay` is decided: `constraints`.)
- Pass1 sign-off on NIA-10 stays with Morgen.
