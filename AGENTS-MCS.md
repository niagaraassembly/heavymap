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
| Recon / licence check | `licence_clearance`, `last_verified`, `blocker`, `open_questions` |
| Ingest / cache pull | `ship_status` / `normalize_status`, `status_in_product`, `raw_cache_rel` |
| Normalize implementation | `normalize_status`, `etl_shape`, `join_keys_*`, `normalize_doc_rel`, `tests_rel`, `related_code_rel` |
| D-5 emit / thin ship | `disposition_d5`, `ship_artifact_rel`, `ship_status`, `cache_policy` |
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
- Read columns: <…>
- Update columns when done: <…>
- Docs: follow docs_dir_rel / normalize_doc_rel on the row; create stubs only if this packet says so
- Do not add UK geographic datasets; use uk_analogue for patterns only
- PR must name dataset_id and summarize MCS cells changed
```

## Doc layout suggestion (when a set earns its own docs)

```text
docs/datasets/<dataset_id>/
  README.md           # overview → linked from docs_dir_rel
  NORMALIZE.md        # → normalize_doc_rel
  FIELD-MAP.md        # → field_map_doc_rel
  QA.md               # → qa_doc_rel
```

Families may share one folder (`docs/datasets/nes_environmental/`) and set `family_id` later.

## Out of scope for random agents

- Marking Linear `agent-ready` (Chief of Staff / Morgen).  
- Publishing the public site (blocked until data reconciled).  
- Spawning parallel MCS schema forks.
