# AGENTS-MCS.md

> **Moved, content unchanged except links.** Original root file. **Open conflict:** this file says the MCS workbook is *not* in the repo and must not be added; the parked `misc/CONTRIBUTING.md` (PR #57) says it *is* tracked under `Spreadsheets/`, and PR #57 does track `02-dataset-inventory-v4.csv` (now at `misc/Spreadsheets/`). Until Morgen decides, follow this file. See `../for-humans/OPEN-DECISIONS.md` (item 5).

How agents treat the Master Control Spreadsheet (MCS). This file is the in-repo guide. The workbook is not in this repository, and it is not checked in.

**Status:** guide only. Linear **NIA-13**. This document changes no MCS cells and names no `dataset_id`.

**Audience:** Cursor Cloud Agents, Claude, GitHub Copilot, Kiro, Codex, and humans driving Linear packets.
**Canonical copy:** Morgen’s local `~/na/` (`.xlsx` and/or `.csv`). The filename is Morgen’s; a current working name is the dataset-inventory workbook `02-dataset-inventory-v4.xlsx` (or the matching `.csv`). That path is on Morgen’s machine. It is not a path under `docs/`, `misc/niagara-atlas/`, or anywhere else in `heavymap`.

A Cloud Agent that cannot see `~/na/` leaves the workbook untouched. Comment on the issue and stop, unless the packet attached the rows to read. Do not reconstruct the sheet from memory, and do not add an xlsx or csv to this repo.

Codex touches the `~/na/` MCS only if the Agent packet says so and Deb has the copy. Otherwise it leaves the workbook untouched and reports back via the human.

## What the MCS is

One spreadsheet with two jobs:

1. **Presence register** — what each dataset is, its rights, its pipeline status, and its doc pointers.
2. **Utilization control plane** — which joins, dossier bands, UI surfaces, and derived readings that dataset may feed.

Part 2 headers used by the architecture docs are `dossier_bands`, `ui_surfaces`, and `derived_readings`. Definitions are in [docs/architecture/README.md](../architecture/README.md).

UK geographic datasets stay off the sheet. A UK capability pattern is a note in `uk_analogue` on an existing row. It is not a new geography row.

## When to write a row, and when to propose one

`dataset_id` is the stable key. Find that row before editing.

**Write** the existing row when the packet names that `dataset_id` and the work changes the truth about it. Update the columns in the hygiene table. Prefer one `dataset_id` per pull request unless the packet lists a family.

**Propose** a row when the `dataset_id` is missing, when a new column is needed, or when the header should be reordered or shortened. Say so on the Linear issue and wait. A new `dataset_id` is written only when the packet explicitly authorizes creating that id.

Leave Part 2 fields you did not evaluate as they are. Column deletes and header reorders wait for an explicit MCS schema task.

## Before you change data or code

1. Open the MCS under `~/na/`. Prefer the xlsx when you need frozen columns or header colors.
2. Read Part 1 for that `dataset_id`: `status_in_product`, `blocker`, `licence_clearance`, `disposition_d5`, and the doc-path columns.
3. Read Part 2 when the task touches joins, dossiers, UI, or math: `joins_with`, `dossier_bands`, `derived_readings`, `acceptance_tests`.
4. When `normalize_doc_rel` or `docs_dir_rel` point at files in this repo, read those files before changing normalize behaviour.

## Hygiene

When the work changes the truth about a dataset, update that same row:

| You did… | Update at least… |
|---|---|
| Recon / licence check | `licence_clearance`, `last_verified`, `blocker`, `open_questions` |
| Ingest / cache pull | `ship_status` / `normalize_status`, `status_in_product`, `raw_cache_rel` |
| Normalize implementation | `normalize_status`, `etl_shape`, `join_keys_*`, `normalize_doc_rel`, `tests_rel`, `related_code_rel` |
| D-5 emit / thin ship | `disposition_d5`, `ship_artifact_rel`, `ship_status`, `cache_policy` |
| New join or disagreement metric | `joins_with`, `join_method`, `conflict_with`, and the Part 2 readings |
| Dossier / UI wiring | `dossier_bands`, `map_layers`, `ui_surfaces`, `filter_dimensions` |
| Created docs | `docs_dir_rel`, `*_doc_rel`, `doc_status` |
| Finished a Linear issue | append the id to `linear_ids` |

A pull request that changes any MCS cell names each `dataset_id` and summarizes the cells. A pull request that changes none says so.

## MCS contract block

Reprint this into Linear Agent packets. Fill the angle brackets. Keep the spreadsheet on `~/na/`.

```text
### MCS contract (all agents)
- Master Control Spreadsheet: Morgen’s local ~/na/ (xlsx or csv). Not in the heavymap repo. Not checked in.
- Shared guide: AGENTS-MCS.md — read before read/write of MCS
- Target dataset_id(s): <ID or none>
- Read columns: <…>
- Update columns when done: <…>
- Docs: follow docs_dir_rel / normalize_doc_rel on the row; create stubs only if this packet says so
- Do not add UK geographic datasets; use uk_analogue for patterns only
- PR must name dataset_id and summarize MCS cells changed (or state that none changed)
```

## Docs a dataset earns

When a packet tells you to add docs for a dataset, use:

```text
docs/datasets/<dataset_id>/
  README.md           # overview → docs_dir_rel
  NORMALIZE.md        # → normalize_doc_rel
  FIELD-MAP.md        # → field_map_doc_rel
  QA.md               # → qa_doc_rel
```

Create that tree only when the packet says so. A family may later share one folder and set `family_id` on each row.

## Out of scope

- Marking Linear `agent-ready` (Morgen or Chief of Staff).
- Publishing the public site. Publication waits until data is reconciled.
- Checking the xlsx or csv into this repository.
- Adding UK geographic datasets.
- Starting a second MCS schema in parallel.
