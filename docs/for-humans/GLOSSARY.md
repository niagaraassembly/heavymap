Adapted from PR #58 (hm/fresh-foundation @ 15adec2) for the #57 layout; CLI/registry-specific parts deferred to a later code PR.

# Glossary

| Term | Meaning here |
|---|---|
| **Service / layer** | A publisher's server (service) and one dataset on it (layer). Layers inherit service defaults; see `heavymap-planning/DATASET-ROUTINE.md`. |
| **Pull** | Downloading a layer for an approved profiling slice. Permission to pull is separate from permission to use or publish. Pulled data stays local and out of the repo. |
| **Profile** | Small checkable facts about a layer: count, ID field, encoding, CRS, nulls, owner field names, and spine join. |
| **Quirk** | A data oddity that affects joining, such as lost leading zeros, padding differences, or duplicates. |
| **Grain** | What one row is: parcel, footprint, address point, zone polygon, register unit, or jurisdiction aggregate. |
| **Spine** | The shared parcel identity key that layers join to. See `docs/architecture/parcel-identity-spine.md`. |
| **Join test** | A test against a spine key: method, hits, tested count, and sample or full population. |
| **SBL / SWIS / print key** | New York parcel identifiers: the 20-character SBL (section-block-lot), the 6-digit SWIS municipality code, and the human-formatted print key (display only). Background in the New York paragraphs of `docs/architecture/parcel-identity-spine.md`; normalisation rules arrive with PRs #53/#56 (`docs/normalization/ny-sbl.md`). |
| **Licence status** | Whether use rights are established, restricted, absent, or unknown. Pull access alone does not establish use or publication rights. |
| **Claim** | A cited fact with its source, access date, and a clear account of what was read. See `docs/architecture/claim-refusal-contract.md`. |
| **MPAC** | Ontario assessment data. `not_licensed`: never pulled or used. |
| **NPCA-derived** | Layers derived from NPCA data: noted, not ingested. |
| **G6** | The publication gate. Until Morgen decides it is open, nothing may be surfaced or published. |
| **D-13** | Owner-field decision in `first-attempts/niagara-atlas/TECHNOLOGY-DECISIONS.md`. Record owner-bearing field **names only**, never values, in sheets, docs, PRs, or comments. The proposed presentation tiers do not authorize publishing owner values. |
| **Linear ID (NIA-xx)** | An existing Linear issue ID, cited in a PR when applicable under `CONTRIBUTING.md`. Agent pickup follows `AGENTS.md`. |
| **Draft PR** | A pull request awaiting human review. Agents never merge; see `AGENTS.md`. |
