---
name: dataset-profiling
description: Use this when discovering, pulling, profiling and harmonizing a jurisdiction's map/geographic datasets for HeavyMap (service profile, layer profile, quirks log, spine-join test, lifecycle status). Not for publishing or MCS edits.
---

# Dataset profiling (HeavyMap)

DRAFT. Not registered. Mirrors `heavymap-planning/DATASET-ROUTINE.md`; if they differ, the doc wins.

## Inputs

- Jurisdiction (for example Welland, Rochester/Monroe)
- Layer family: parcels, address, footprints, zoning, permits/business, context
- Linear slice issue ID (and parent epic)
- Catalog row refs from `Spreadsheets/09-per-jurisdiction-dataset-catalog.xlsx`

## Ground rules

- Pulling needs no licence confirmation. Licence and use are decided later (`not_used` or a use decision).
- Pulled data goes in git-ignored `local-data/`. Never commit it.
- Owner fields: record field names only, never values (D-13).
- MPAC is `not_licensed`. NPCA-derived layers are not ingested.
- Nothing is published before G6.
- New files only. Do not edit the MCS, existing docs or existing CSVs. No secrets.
- Slice size is 15 to 25 layers, per jurisdiction, service first. Order: parcels, address, footprints, zoning, permits/business, context. Priority: Welland, Rochester/Monroe, then other P0.
- Evidence contract: source URL and access date per fact, `live read` vs `documented, not re-read`, server counts, samples of at most 5 records, `hits/tested` for joins, conflicts side by side, unknown stays unknown.

## Phases

| Stage | Do | Output | Status after |
|---|---|---|---|
| 0 Slice plan | List layers, lanes, order | Slice plan | none |
| 1 Discover and catalog | Profile the service once, list its layers | Row in `16-service-profile.csv`, rows in `17-layer-profile.csv` | `catalogued` |
| 2 Pull | Page through the layer into `local-data/` | Counts match the server | `pulled` |
| 3 Profile | Fill id, encoding, date, CRS, null and owner-name columns | Complete layer row | `profiled` |
| 4 Quirks log | One row per quirk in `18-quirks-log.csv` | Quirk ids on the layer row | `formatting_needed` (if blocking) |
| 5 Harmonize | Apply and re-test each handling | Quirks resolved with counts | `format_resolved` |
| 6 Verify | Join to the spine, grade it (NIA-86) | Evidence write-up in the NIA-79 style | `spined` |
| 7 Use decision | Recommend use, `not_used` or defer | Recommendation comment | Morgen decides |
| 8 Promote | Morgen only | | `dormant` or `surfaced` (not before G6) |

## Linear rule

Post your own comment on the slice issue at every stage. Header: `Stage N / jurisdiction / family / layers / evidence URLs`, then the stage line from the doc. Do not create issues unless the packet says so. Grok Bot posts roll-ups only.

## Standard columns

- Service: `16-service-profile.csv` (19 columns, key `service_id`).
- Layer: `17-layer-profile.csv` (42 columns, key `layer_id`, inherits from service via `service_id` and `inherits_from_service`; a layer value overrides).
- Quirks: `18-quirks-log.csv` (12 columns, key `quirk_id`).
- Format: UTF-8, no BOM, LF, RFC-4180 quoting, dates `YYYY-MM-DD`, no `;` in cells (use ` | `).
- Keep ids as text. Never store an id as a number.

## Status model

`catalogued` -> `pulled` -> `profiled` -> `formatting_needed` -> `format_resolved` -> `spined` -> `dormant` -> `surfaced`. A layer with no quirks goes `profiled` to `spined`. Side states: `blocked` (agent sets, Morgen clears) and `not_used`.

| Who | May move |
|---|---|
| Agents | `catalogued` to `spined`, and `blocked`. Log every move in Linear. |
| Morgen | `dormant`, `surfaced`, `not_used` (agents set `not_used` only where MPAC or NPCA forces it) |

`spined` records `spine_join_method` (exact, fuzzy, spatial) and `spine_join_grade` (NIA-86).
