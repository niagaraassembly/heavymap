# PCDP vocabulary

Machine-readable tokens for the architecture in the parent folder. Linear **NIA-14** for the PCDP catalog. Linear **NIA-22** for the joining-concept catalog. The prose documents are the source of truth (Linear **NIA-11** for the four-concept frame; [ADR 0002](../adr/0002-joining-concepts-and-terminology.md) for joining concepts). If this tree and the prose disagree, change this tree to match the prose.

This folder does not fetch parcels, edit the Master Control Spreadsheet, draw UI, or publish a site.

## Normative

Closed sets. Later normalize steps, UI, and tests should load these instead of retyping them.

[pcdp.vocab.json](pcdp.vocab.json) is the annotated catalog. [pcdp.schema.json](pcdp.schema.json) locks that catalog and exports the same closed sets as JSON Schema `$defs` (`band`, `bandLadder`, `uiSurface`, `refusalReason`, `evidenceGrade`, `joinMethod`, `assertionState`, `spineKey`, and the smaller part enums).

Normative groups, all taken from the prose:

- Context Band Ladder, in order: `identity`, `land_use`, `constraints`, `activity_registers`, `derived_readings`, `share_export`
- Rung status: `filled`, `refused`
- UI surfaces: `selection`, `dossier`, `share`, `export`
- Refusal reasons: `not_in_coverage`, `not_licensed`, `not_joined`
- Evidence grades: `observed`, `joined`, `derived`, `refused`
- Join methods: `identifier`, `normalized_address`, `point_in_polygon`, `containment`, `proximity`, `overlap`
- Assertion states, when an assertion is filled: `supported`, `contested`, `refuted`
- Spine key grammar (`hm:{country}:{region}:{jurisdiction}:{grain}:{local}`) and the v1 part enums
- D-5 dataset dispositions: `ship`, `simplify`, `derive`, `tile`, `link`
- Geography v1 names, as the coverage fence. These are names, not spine-key slugs
- Register words that may appear only as a quotation
- Source-stamp field names

`dossier` is a surface. It is not a band. Evidence grade `refused`, rung status `refused`, and the assertion states are three different uses of the word. Dataset disposition `derive` is not evidence grade `derived`. The ladder token `derived_readings` belongs in `dossier_bands`; reading identifiers belong in the `derived_readings` column.

## Illustrative

Not a closed catalog. [pcdp.vocab.json](pcdp.vocab.json) sets `illustrative.closed_catalog` to `false`.

- Derived-reading identifiers from the claims document: `floor_area_m2`, `employment_interval`, `coverage_ratio`. A new identifier may be added when a reading is specified. The schema requires these three and does not treat the list as exhaustive.
- Spine key examples `hm:ca:on:welland:footprint:SYN-0142` and `hm:us:ny:erie:parcel:SYN-999.00-1-1.1` are the synthetic walkthrough units from the architecture. They show the grammar. They are not observations of real land and not a parcel index.

## Joining concepts

Sibling catalog for the terminology layer. It does not add keys to [pcdp.vocab.json](pcdp.vocab.json). [pcdp.schema.json](pcdp.schema.json) stays strict (`additionalProperties: false`).

[joining-concepts.vocab.json](joining-concepts.vocab.json) is the annotated catalog. [joining-concepts.schema.json](joining-concepts.schema.json) locks it and exports `$defs` for `relation`, `authorityScale`, `claimGrain`, `registerFamily`, `evidenceLevel`, and `joiningConceptId`.

Prose source of truth: [ADR 0002](../adr/0002-joining-concepts-and-terminology.md). Closed sets:

- Relation: `same`, `alias`, `near`, `false_friend`
- Authority scale: `municipal`, `regional`, `provincial_or_state`, `federal`, `cross_border_register`
- Claim grain: `parcel`, `footprint`, `address`, `register_unit`, `zone_polygon`, `jurisdiction_aggregate`
- Register family, on `premises_register_key`: `local_survey`, `local_directory`, `licence_register`, `regulatory`, `regulatory_cross_program`
- Ledger evidence level: `live_verified`, `documented`, `catalog_only`, `unverified`

All thirty concept ids from planning file 10 are in the catalog. `establishment_register_key` is an alias of `premises_register_key`, not a second id. `planning_policy_overlay` feeds `constraints`. `jurisdiction_activity_aggregate` does not attach to a spine unit.

`deferred.normative` is false. Default display genres and `lot_area_m2` as a named reading stay there. Claim-grain here is wider than spine-key grain. The token `regulatory` inside register family is not a ladder band.

## Check

From this directory, with [jsonschema](https://python-jsonschema.readthedocs.io/) available:

```bash
python -c "import json, jsonschema; jsonschema.Draft202012Validator.check_schema(json.load(open('pcdp.schema.json'))); jsonschema.validate(json.load(open('pcdp.vocab.json')), json.load(open('pcdp.schema.json')))"
```

```bash
python -c "import json, jsonschema; jsonschema.Draft202012Validator.check_schema(json.load(open('joining-concepts.schema.json'))); jsonschema.validate(json.load(open('joining-concepts.vocab.json')), json.load(open('joining-concepts.schema.json')))"
```
