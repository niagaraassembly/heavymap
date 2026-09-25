# Claim & Refusal Contract

**Status:** architecture sketch, 2026-09-23. Linear **NIA-11**. Docs only.

## Purpose

The contract is the rule for anything the ladder says about a spine unit. A presentation may assert a fact only with an evidence grade and a source stamp. Where it cannot assert, it records a refusal. Silence is not a value.

The contract exists because a gap that looks like a measurement will be read as a fact about land and about the people on it. The Hamilton–Niagara prior art already hit this: a missing employment denominator rendered as zero reads as an empty site.

## Non-goals

- Implementing refutation jobs, score formulas, or a claim database.
- Publishing owner names, “available,” “failing,” or “vacant” as product language.
- Deciding licence negotiations with MPAC or any other vendor.
- Editing MCS. The `derived_readings` header is named here so later rows use it consistently.
- Treating a UK atlas score module as Beta’s reading catalog.

## How it relates to the other three

- **Parcel Identity Spine.** Identity facts are claims too. “This key is a Welland footprint” needs a stamp. “No parcel polygon is joined” is a refusal on that same band, not a blank geometry class.
- **Context Band Ladder.** Each rung is either filled with claims under this contract or marked `refused` with one reason. The ladder does not have a third, silent state.
- **PCDP.** Minimum presentation shows identity claims and the refusal list. Maximum presentation shows every claim and every refusal. Share and export carry the same set. A dossier that hides refusals has broken the protocol.

## Evidence grades

Every filled value has one grade:

| Grade | Plain meaning |
|---|---|
| `observed` | Copied from a source and normalised. Not interpreted. “The by-law text says L1.” |
| `joined` | An observed value placed on this spine key by a named join method. The method is part of the stamp. |
| `derived` | Computed from named inputs by a named method. A reading, not a new observation. |
| `refused` | No assertion. A reason code is required. There is no grade that means “probably empty.” |

`joined` is not more true than `observed`. It records an extra step that can be wrong. A point-in-polygon zoning code is `joined`. The by-law’s own polygon id, if HeavyMap ever held it as the unit itself, would be `observed`.

Join methods, carried on the stamp when the grade is `joined`. Names follow the prior-art set; this sketch does not re-specify tolerances:

| Method token | Reader takeaway |
|---|---|
| `identifier` | The source’s own id matched. |
| `normalized_address` | Address text matched after normalisation. Some rows of that table will have failed. |
| `point_in_polygon` | A point of this unit fell inside a published polygon. |
| `containment` | Geometry of this unit sits inside the source geometry. |
| `proximity` | Nearest feature under a stated distance. The distance is not access. |
| `overlap` | Area overlap above a stated threshold. |

## Source stamp

A stamp is the smallest set of fields that lets someone else find the same record.

| Field | Required |
|---|---|
| `source_name` | Yes |
| `publisher` | Yes |
| `licence` | Yes. If the refusal is `not_licensed`, the stamp names the product that was not used. |
| `original_id` | Yes when the source has one. |
| `retrieved_on` | Yes for anything HeavyMap holds. The date the file was obtained. |
| `observation_on` | Yes. The date the source’s fact refers to. A by-law adopted in 2017 and retrieved in 2026 keeps both dates. |
| `join_method` | Yes when grade is `joined`. |
| `inputs` and `method` | Yes when grade is `derived`. |
| `note` | When a trap matters (layer index, unit of measure, address restyling). |

The original published value survives next to any normalised one. A New York floor area stays in the published square feet on the stamp even if a reading also states square metres.

## Joining concepts

A claim may carry a joining-concept id beside the publisher’s field name. The id names the job. The field name stays as published. The concept does not add a ladder band.

The closed sets for relation, authority scale, claim grain, register family, and ledger evidence level, and the thirty concept ids, are in [ADR 0002](adr/0002-joining-concepts-and-terminology.md). Federal registers stay on the bands they already belong to, and carry an authority scale when a later slice writes that field. The source-stamp table above is unchanged. Counts for a whole jurisdiction (`jurisdiction_activity_aggregate`) are not claims about a spine unit. Parcel-level refusal for that object is `not_in_coverage`.

## Refusal reasons

A refusal uses exactly one of:

| Reason | Use it when |
|---|---|
| `not_in_coverage` | The layer, jurisdiction, or vintage is outside what v1 holds, or the responsible publisher does not release that object. Geography outside the v1 list is this reason. A city with no public parcel fabric is this reason for parcel grain. |
| `not_licensed` | A source exists and HeavyMap is not allowed to use it. Ontario assessment via MPAC is the standing example. |
| `not_joined` | A usable source is in hand, or is expected in the joined set, and this key has no accepted join yet. |

One reason only. If a layer is both unlicensed and unjoined, `not_licensed` wins: there is nothing to join. If a layer was never in the v1 set, `not_in_coverage` wins: do not imply a join is the remaining step.

Words that may appear only as a quotation of a register, with grade `observed` or `joined` and a stamp:

- vacant
- empty
- available
- closed
- departed

Without that quotation they are forbidden, including as friendly summaries of a refusal. “Not joined” is not “vacant.” “Not licensed” is not “unassessed.” “Not in coverage” is not “no industrial activity.”

Also forbidden:

- The number `0` where the quantity could not be computed. The value is refused, and the reason says which input was missing.
- Dropping a rung so the panel looks shorter.
- A single composite score that mixes a physical measure, a time series, and an evidence grade.
- Upgrading a derived reading to an observation because the number looks precise.
- Inferring that a business operates today because an older register listed it.

When two stamped records disagree, both stay, grades and stamps intact, and the assertion is `contested`. When a later check knocks down an assertion, the state is `refuted` and both the assertion and the refutation remain visible. Deleting the contested line would hide the disagreement. Allowed assertion states are `supported`, `contested`, and `refuted`. A refusal is not one of those states. Most units will have no assertion beyond their observed attributes, and that is a normal filled ladder, not a thin one.

## Derived readings and the MCS column

A derived reading is grade `derived`. It names its inputs, its method, and its unit. It lives on the `derived_readings` rung. If an input is refused, the reading is refused with that input’s reason. Confidence does not fill a refused reading.

MCS Part 2 column `derived_readings` is a **dataset** field. It lists reading identifiers that dataset is allowed to feed, `|`-separated. It uses reading names, not ladder tokens. The ladder token `derived_readings` must not be written into this column; that token belongs in `dossier_bands`.

An empty `derived_readings` cell means “this dataset feeds no reading.” It does not describe a parcel, and it must not be copied onto a unit as vacancy.

Illustrative reading identifiers, not a closed catalog:

| Identifier | Kind of method | Typical refusal |
|---|---|---|
| `floor_area_m2` | Convert published floor area to square metres; keep the source unit on the stamp | `not_in_coverage` when no floor area was published |
| `employment_interval` | Carry a published employment band as a range | `not_in_coverage` where no employment register exists |
| `coverage_ratio` | Building footprint area divided by parcel area | `not_in_coverage` or `not_licensed` when parcel area is missing; never `0` |

A new identifier may be added when a reading is specified. It needs a method someone can re-read. It does not need a UI.

## The two synthetic units

These are the same illustrations as in [PCDP.md](PCDP.md). They show the contract, not real parcels.

### Canadian — `hm:ca:on:welland:footprint:SYN-0142`

**Filled claim, grade `joined`.**

- Rung: `land_use`
- Value: `L1 — Light Industrial` (synthetic)
- Stamp: publisher City of Welland; source name illustrative current zoning by-law; licence Open Government Licence; `original_id` `SYN-ZONE-L1`; `join_method` `point_in_polygon`; `retrieved_on` and `observation_on` both marked illustrative, and not the same kind of date if a real by-law is later joined.
- Note: zoning text is not an employment fact.

**Filled claim, grade `joined`, weaker method available and rejected.**

- Rung: `activity_registers`
- Value: NEI `nei_id SYN-8130` present on this footprint (synthetic)
- Stamp: `join_method` `identifier`
- The illustration does **not** also join on the street string. Prior art showed address restyling producing false departures. No departure assertion is made. Employment, if shown, is the source band as a range (`employment_interval`), grade `derived` only after the observed band is on the stamp.

**Refusals on the same unit.**

| Object | Reason | What a reader must not conclude |
|---|---|---|
| Parcel polygon | `not_in_coverage` | That Welland has no lot here |
| MPAC roll and assessed value | `not_licensed` | That the land is unassessed |
| `constraints` rung | `not_joined` | That the site is unconstrained |
| `coverage_ratio` | `not_in_coverage` | That coverage is zero |

### American — `hm:us:ny:erie:parcel:SYN-999.00-1-1.1`

**Filled claim, grade `observed`.**

- Rung: `land_use`
- Value: property class `710` (synthetic)
- Stamp: publisher NYS or Erie County parcel layer, named when a real extract exists; licence the public parcel licence of that layer; `original_id` SBL `SYN-999.00-1-1.1`; `observation_on` the roll year of that extract.
- Note on the stamp: property class is an assessment code. It is not a zoning by-law and not NAICS. Those vocabularies stay unasserted.

**Filled reading, grade `derived`.**

- Rung: `derived_readings`
- Identifier: `floor_area_m2`
- Inputs: published floor area `20000` square feet (synthetic)
- Method: multiply by `0.092903`
- Result labelled square metres, with the square-foot input still on the stamp
- This number is a reading. It does not say the building is fully used.

**Refusals on the same unit.**

| Object | Reason | What a reader must not conclude |
|---|---|---|
| SWIS / city or town name | `not_joined` | That the parcel is “county land” with no municipality |
| `constraints` rung | `not_in_coverage` | That no overlay applies in the world |
| `activity_registers` rung | `not_joined` | That the site is inactive or vacant |

Owner name is not a v1 ladder object, so the presentation has no owner field and no fourth refusal code. A later decision that allows an owner claim has to bring it in with a grade and a stamp.

The American activity refusal and the Canadian constraints refusal are the same kind of event in the contract: a named inability to speak. The land-use claims beside them are a different kind of event, and they do not fill the refused rungs by implication. A manufacturing property class does not prove a permit. A light-industrial zone does not prove a tenant.

## Prior art

- `niagara-atlas/DOSSIER-TECHNICAL-REPORT.md` — attributed, dated, bounded, refusable; null is not zero; contested records both stay; “vacant” reserved for a register’s own word. Those rules are the pattern this contract keeps.
- `niagara-atlas/README.md` — provenance travels with the feature; observation is not inference; a derived score is an indicator.
- `niagara-atlas/INTEGRATION.md` — uneven coverage across Hamilton, Niagara Region, Erie, and Niagara County NY is a publishing fact. The map’s job is to say so.
- UK atlas (`babbworks/atlas`) — derived indicators live in a scoring step separate from source modules. Beta may copy that separation. It does not copy UK geographies, UK ports, or UK scores.
