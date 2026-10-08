# 02 — Dataset inventory v4 NOTES

**Created:** 2026-09-23 (America/New_York)  
**Canonical files:** `02-dataset-inventory-v4.csv`, `02-dataset-inventory-v4.xlsx`  
**Schema:** `05-control-plane-column-schema.md`

## What changed from v3

1. Preserved all **82 v3 rows** and every existing v3 value in its matching column. No UK geographic rows were re-added.
2. Added optional `family_id` immediately after `dataset_id`; it is empty by default.
3. Inserted the 11-column doc-path block immediately after `repo` and before `notes`: `docs_dir_rel`, `normalize_doc_rel`, `field_map_doc_rel`, `decision_doc_rel`, `qa_doc_rel`, `tests_rel`, `raw_cache_rel`, `ship_artifact_rel`, `related_code_rel`, `linear_ids`, `doc_status`.
4. Set `doc_status=missing` for every row. All other new path/id columns are empty unless directly inferable.
5. Added only sparse obvious pointers: `1` `related_code_rel` value(s) from an explicit `.py` path and `9` `ship_artifact_rel` value(s) from a single unambiguous `data/...geojson` note on a `committed_thin` row.
6. Promoted stubs and gap rows receive no invented documentation paths. No folders were invented.
7. Rebuilt the workbook with the v3 visual language: blue Part 1 headers (including the new doc-path block), amber Part 2 headers, `dataset_id` + `working_name` frozen, Inventory + README sheets.

## Header and counts

- Total columns: **66** (`50` Part 1, 16 Part 2).
- Data rows: **82** (same as v3).
- Part 1 ends `... repo, docs_dir_rel, ..., doc_status, notes`; Part 2 starts `joins_with`.

## Fill policy

- Copy v3 cells by matching header name; do not reinterpret existing research fields.
- `family_id`, all doc paths, and `linear_ids` start blank.
- `doc_status` starts as `missing` honestly; agents update it only as documentation becomes trustworthy.
- `related_code_rel` is filled only for an explicit, obvious `.py` path in notes (kept below 15 rows).
- `ship_artifact_rel` is filled only when `ship_status=committed_thin` and notes contain one unambiguous `data/...geojson` path.
- Do not invent `docs_dir_rel` folders. Empty path means no dedicated doc exists yet.
