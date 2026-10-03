# ADR 0002 — Joining concepts and terminology

**Status:** accepted for the Slice 1 decisions in this record, 2026-09-25. Linear **NIA-22**. Docs only.

Items under [Deferred](#deferred) are outside this acceptance.

## Context

Linear **NIA-10** placed three planning artifacts on `main`. This record encodes the locked terminology from those artifacts. It does not reopen the dig.

| Input | Role here |
|---|---|
| [misc/heavymap-planning/10-joining-concepts-v1.md](../../../misc/heavymap-planning/10-joining-concepts-v1.md) | Thirty concept IDs, ground rules, and the two decisions Morgen locked on 2026-09-25 |
| [misc/heavymap-planning/11-synonym-parallel-ledger-v1.md](../../../misc/heavymap-planning/11-synonym-parallel-ledger-v1.md) and [11-synonym-parallel-ledger-v1.csv](../../../misc/Spreadsheets/11-synonym-parallel-ledger-v1.csv) | Relation set, evidence levels, and the ledger the concepts are checked against |
| [misc/heavymap-planning/12-authority-scale-and-meta-proposals.md](../../../misc/heavymap-planning/12-authority-scale-and-meta-proposals.md) | Context for authority scale and for what this slice leaves alone |

The product frame stays the four concepts in [docs/architecture/](../README.md):

| Concept | Document |
|---|---|
| Parcel Identity Spine | [parcel-identity-spine.md](../parcel-identity-spine.md) |
| Context Band Ladder | [context-band-ladder.md](../context-band-ladder.md) |
| Parcel Context Display Protocol (PCDP) | [PCDP.md](../PCDP.md) |
| Claim & Refusal Contract | [claim-refusal-contract.md](../claim-refusal-contract.md) |

A **joining concept** is a stable HeavyMap id for the job a field does. Fields with different native names can share a concept. Fields that only look alike can keep different concepts. The claim keeps the publisher’s field name and value. The concept id is an extra handle.

At encode time the ledger has 118 rows (`LG-001` through `LG-118`). Relation counts are `same` 65, `alias` 15, `near` 28, `false_friend` 10. Evidence counts are `live_verified` 109, `documented` 9, `catalog_only` 0, `unverified` 0. Twenty-nine concepts have at least one row. `constraint_overlay` is the family parent and has none.

Planning file 10 §6 leaves later readings from the UK capability glean (containment deltas, register-agreement confidence, gap distance) for another ticket. This record does not import them. UK geography stays out of product scope.

## Decision

1. **Joining concepts sit above native names.** A concept id does not rename a publisher field, does not replace a spine key, and is not itself a band, a reading identifier, or a stamp field. Concept unity means “same job”. It does not mean two tables share a key. `nei_id` and Welland’s business-directory `ID` both serve `premises_register_key`, and they still do not join to each other.
2. **Relation is a closed set of four:** `same`, `alias`, `near`, `false_friend`. The relation is measured against the concept’s anchor term, not as a free row-to-row score. `same` is the same job with identical or trivial wording. `alias` is the same job in different words. `near` overlaps and is never silently equated in a calculation. `false_friend` looks like one concept and belongs to another; the row’s concept id is the job it actually does.
3. **`authority_scale` is a closed set of five:** `municipal`, `regional`, `provincial_or_state`, `federal`, `cross_border_register`. Scale attaches to the authority of the assertion, not to the portal that hosts the file. “County” does not decide the scale: single-tier Ontario counties are `municipal`; New York counties are `regional`. OSM has no scale; leave the field absent. `cross_border_register` stays in the set. No v1 source read for this slice used it.
4. **Federal data is stamped claims on the existing bands, plus `authority_scale`.** The ladder stays six rungs. There is no seventh band and no federal group on the parcel table. NPRI and TRI facility records are `activity_registers`. A federal flood zone is `constraints`. Census and statistical tables that have no unit key are not parcel claims (decision 7). The five scale values are closed here. Writing `authority_scale` onto the source stamp waits with the other planning-file 12 §2 fields.
5. **The premises-level register key is `premises_register_key`.** Morgen locked that name on 2026-09-25. The extension comment’s working name `establishment_register_key` remains an alias so older references still resolve. “Establishment” stays free for the Census CBP count, which is a false friend and belongs to `jurisdiction_activity_aggregate`.
6. **`planning_policy_overlay` feeds `constraints`.** Morgen locked that band on 2026-09-25. Each claim is named by its authority. The overlay is policy that shapes what is permitted. It is still an overlay on the constraints rung, beside flood, heritage, and natural heritage.
7. **Aggregates are not parcel claims.** `jurisdiction_activity_aggregate` uses claim grain `jurisdiction_aggregate` and does not attach to a spine unit. Parcel-level refusal for that object is `not_in_coverage`. Aggregates may attach to a jurisdiction through `statistical_geography_code`.
8. **Closed enums for later slices** are `claim_grain` (`parcel`, `footprint`, `address`, `register_unit`, `zone_polygon`, `jurisdiction_aggregate`), `register_family` (`local_survey`, `local_directory`, `licence_register`, `regulatory`, `regulatory_cross_program`), and ledger `evidence_level` (`live_verified`, `documented`, `catalog_only`, `unverified`). `claim_grain` is wider than spine-key grain. Spine grain stays `parcel`, `footprint`, and `address`. `register_family` facets `premises_register_key`. The token `regulatory` in that family is not a ladder band. `catalog_only` and `unverified` stay in the evidence set even though the v1 ledger has zero such rows.
9. **The machine catalog** is [joining-concepts.vocab.json](../vocab/joining-concepts.vocab.json), locked by [joining-concepts.schema.json](../vocab/joining-concepts.schema.json). It lists all thirty concept ids from planning file 10. Prose in this ADR wins if the catalog and this record disagree.

Overlay concepts use claim grain `zone_polygon`. Planning file 10 also records polyline and point layers (a flood hazard limit, heritage points). Those layers need a stated distance or side rule. `point_in_polygon` is the wrong method for a line or a point.

`publisher_row_id` is in the catalog so system ids (`OBJECTID`, `GlobalID`, `FID`, and the like) are not used as keys. It feeds no band.

`owner_of_record` and `owner_category` are in the catalog under the presentation tier (D-13). PCDP v1 has no owner rung, so they feed no band. This slice does not read owner values.

## Deferred

These stay as recorded in the planning files. This slice does not make them normative and does not encode them into fixtures or the MCS.

| Item | Where it stands |
|---|---|
| Default display genres | Planning file 10 §1 and §7 item 2. Recommendations only. Morgen has not confirmed them. |
| `lot_area_m2` as a named reading | Proposed in planning file 10 §6. The PCDP reading list stays `floor_area_m2`, `employment_interval`, and `coverage_ratio`. `lot_area_published` is a concept id for the published input. |
| Claim and stamp meta from planning file 12 §2 | `concept_id`, native field and value, `ledger_id`, `facet`, `authority`, `authority_scale` on the stamp, `claim_grain` on the claim, `register_family` on the claim, `edition_label`, `access_tier`, `is_register_quotation`, and `display_label_key`. The enums above are closed here. The fields are not added to the source-stamp table or to fixtures. |
| Sentinels from planning file 12 §3 | A per-source sentinel map is a later normalize artifact. A sentinel is not encoded as a claim field here. |
| Fixture bumps | `fixtures/parcels/` and PR #13 stay as they are, including any Erie floor-area note. |
| NPCA / MPAC licence clearance | Planning file 12 §4. MPAC assessment data stays `not_licensed`. NPCA parcel layers are not ingested. |
| MCS `history` and `servicing` | Planning file 12 §5. No MCS cell changes. No `dataset_id` is named because none is edited. |

## Consequences

- Later normalize steps, UI, and tests load `relation`, `authority_scale`, `claim_grain`, `register_family`, `evidence_level`, and the thirty concept ids from the sibling catalog instead of retyping them.
- Family ids in the catalog (`unit_identity`, `activity_register`, `land_use_and_assessment`, `constraint_overlays`, `derived_reading_input`, `presentation_tier`) group concepts. They are not band tokens. The band token for registers stays `activity_registers`.
- [pcdp.vocab.json](../vocab/pcdp.vocab.json) keeps the ladder, surfaces, grades, spine key, and the three illustrative readings. This slice does not add a band or a reading identifier there.
- The source-stamp field list in the Claim & Refusal Contract is unchanged. `authority_scale` is the closed set a later slice will use when it adds the field.
- A missing overlay is still `not_joined` or `not_in_coverage`. Absence is not “clear”.
- MCS is unchanged.

## Non-goals

This record does not edit fixtures, the Master Control Spreadsheet, `02-dataset-inventory*`, or planning files `07` / `08` / `09`. It does not ingest NPCA parcels, sample owner fields, publish a site, draw UI, or implement normalize. It does not add a seventh band, a federal parcel-table group, or a cross-border master key.
