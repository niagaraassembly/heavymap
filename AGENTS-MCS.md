<<<<<<< HEAD
# Agent guide — Master Control Spreadsheet (MCS)

**Audience:** Cursor Cloud Agents, Claude, GitHub Copilot, and humans driving Linear packets.  
**Canonical local copy (Morgen):** under the `na/` working tree (path Morgen chooses — often `heavymap-planning/02-dataset-inventory-v4.xlsx` or `heavymap-planning/02-dataset-inventory-v4.csv`, or a promoted `docs/mcs/` copy inside `niagaraassembly/heavymap`).  
**Chief of Staff** may only have chat attachments / box copies; **assume local agents can read/write the `na/` file.**

## What the MCS is

One spreadsheet that is both:

1. **Presence register** — what each dataset is, rights, pipeline status, doc pointers.  
2. **Utilization / generative control plane** — joins, dossier bands, UI surfaces, derived readings, agent hooks.

UK geographic datasets are **out**. UK *capability* patterns live in `04-uk-capability-glean.md` / future Linear issues — link via `uk_analogue`, do not re-add UK rows.

## Before you touch data or code

1. Open the MCS (xlsx or csv). Prefer xlsx if you need frozen columns / header colors.  
2. Find the row by `dataset_id` (stable key). If missing, **stop** and ask / open an issue — do not invent rows casually.  
3. Read Part 1 status fields: `status_in_product`, `blocker`, `licence_clearance`, `disposition_d5`, doc path columns.  
4. Read Part 2 if your task touches joins, dossiers, UI, or math: `joins_with`, `dossier_bands`, `derived_readings`, `acceptance_tests`.  
5. If `normalize_doc_rel` / `docs_dir_rel` point at files, **read them** before changing normalize behaviour.

## Writing back to the MCS (required hygiene)

When your work changes truth about a dataset, update the **same row**:

| You did… | Update at least… |
|----------|------------------|
=======
# AGENTS-MCS.md

How agents treat the Master Control Spreadsheet (MCS). This file is the in-repo guide. The workbook is not in this repository, and it is not checked in.

**Status:** guide only. Linear **NIA-13**. This document changes no MCS cells and names no `dataset_id`.

**Audience:** Cursor Cloud Agents, Claude, GitHub Copilot, Kiro, and humans driving Linear packets.
**Canonical copy:** Morgen’s local `~/na/` (`.xlsx` and/or `.csv`). The filename is Morgen’s; a current working name is the dataset-inventory workbook `02-dataset-inventory-v4.xlsx` (or the matching `.csv`). That path is on Morgen’s machine. It is not a path under `docs/`, `niagara-atlas/`, or anywhere else in `heavymap`.

A Cloud Agent that cannot see `~/na/` leaves the workbook untouched. Comment on the issue and stop, unless the packet attached the rows to read. Do not reconstruct the sheet from memory, and do not add an xlsx or csv to this repo.

## What the MCS is

One spreadsheet with two jobs:

1. **Presence register** — what each dataset is, its rights, its pipeline status, and its doc pointers.
2. **Utilization control plane** — which joins, dossier bands, UI surfaces, and derived readings that dataset may feed.

Part 2 headers used by the architecture docs are `dossier_bands`, `ui_surfaces`, and `derived_readings`. Definitions are in [docs/architecture/README.md](docs/architecture/README.md).

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
>>>>>>> origin/main
| Recon / licence check | `licence_clearance`, `last_verified`, `blocker`, `open_questions` |
| Ingest / cache pull | `ship_status` / `normalize_status`, `status_in_product`, `raw_cache_rel` |
| Normalize implementation | `normalize_status`, `etl_shape`, `join_keys_*`, `normalize_doc_rel`, `tests_rel`, `related_code_rel` |
| D-5 emit / thin ship | `disposition_d5`, `ship_artifact_rel`, `ship_status`, `cache_policy` |
<<<<<<< HEAD
| New join or disagreement metric | `joins_with`, `join_method`, `conflict_with`, Part 2 readings |
| Dossier / UI wiring | `dossier_bands`, `map_layers`, `ui_surfaces`, `filter_dimensions` |
| Created docs | `docs_dir_rel`, `*_doc_rel`, `doc_status` |
| Finished a Linear issue | append id to `linear_ids` |

Rules:

- Do **not** delete columns or reorder the header without an explicit MCS schema task.  
- Do **not** blank Part 2 research fields you did not evaluate.  
- Prefer editing **one dataset_id per PR/issue** unless the packet lists a family.  
- Cite `dataset_id` in the PR body and Linear comment.

## Linear packet — reprint this MCS contract block

Copy into Agent packets (adjust path if MCS moves into `heavymap/docs/`):

```text
### MCS contract (all agents)
- Master Control Spreadsheet: <RELATIVE_PATH_TO_XLSX_OR_CSV>
- Shared guide: AGENTS-MCS.md (this file) — read before read/write of MCS
- Target dataset_id(s): <ID>
=======
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
>>>>>>> origin/main
- Read columns: <…>
- Update columns when done: <…>
- Docs: follow docs_dir_rel / normalize_doc_rel on the row; create stubs only if this packet says so
- Do not add UK geographic datasets; use uk_analogue for patterns only
<<<<<<< HEAD
- PR must name dataset_id and summarize MCS cells changed
```

## Doc layout suggestion (when a set earns its own docs)

```text
docs/datasets/<dataset_id>/
  README.md           # overview → linked from docs_dir_rel
=======
- PR must name dataset_id and summarize MCS cells changed (or state that none changed)
```

## Docs a dataset earns

When a packet tells you to add docs for a dataset, use:

```text
docs/datasets/<dataset_id>/
  README.md           # overview → docs_dir_rel
>>>>>>> origin/main
  NORMALIZE.md        # → normalize_doc_rel
  FIELD-MAP.md        # → field_map_doc_rel
  QA.md               # → qa_doc_rel
```

<<<<<<< HEAD
Families may share one folder (`docs/datasets/nes_environmental/`) and set `family_id` later.

## Out of scope for random agents

- Marking Linear `agent-ready` (Chief of Staff / Morgen).  
- Publishing the public site (blocked until data reconciled).  
- Spawning parallel MCS schema forks.
=======
Create that tree only when the packet says so. A family may later share one folder and set `family_id` on each row.

## Out of scope

- Marking Linear `agent-ready` (Morgen or Chief of Staff).
- Publishing the public site. Publication waits until data is reconciled.
- Checking the xlsx or csv into this repository.
- Adding UK geographic datasets.
- Starting a second MCS schema in parallel.
>>>>>>> origin/main
