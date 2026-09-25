# MCS — extra columns for per-dataset documentation paths

**Status:** proposed add-on to inventory v3 (2026-09-23)  
**Repo-relative root:** paths are relative to the repo (or `na/` working tree) root that Cursor / Claude / Copilot open — never absolute Deb paths.

## Why

Unique normalize / join / disposition work deserves **project docs next to code**. The Master Control Spreadsheet (MCS) should point agents at those files so Linear packets stay short: reprint a standard MCS block + `dataset_id` + which columns to update, and let the row carry folder-relative doc pointers.

## Recommended new columns (Part 1 band — presence / substantiation)

| Column | Type | Purpose |
|--------|------|---------|
| `docs_dir_rel` | path | Dataset (or family) documentation folder, e.g. `docs/datasets/nei/` or `niagara-atlas/docs/nei/` |
| `normalize_doc_rel` | path | How this set is normalized (steps, CRS, filters, keys) — the procedure agents extend |
| `field_map_doc_rel` | path | Source→canonical field map / schema notes |
| `decision_doc_rel` | path | Keep/rebuild/D-5/licence decisions for this set (or fragment id inside a shared DECISIONS.md `#nei`) |
| `qa_doc_rel` | path | QA / disagreement metrics / known failure modes |
| `tests_rel` | path | Automated tests (file or dir), e.g. `tests/test_nei_departures.py` |
| `raw_cache_rel` | path | Gitignored raw/cache location (document only; do not commit secrets) |
| `ship_artifact_rel` | path | Shipped thin artifact or manifest path under Beta / `data/` |
| `related_code_rel` | path | Primary module(s), e.g. `normalize/nei.py` |
| `linear_ids` | text | Related Linear issue ids (`NIA-12,NIA-15`) once they exist |
| `doc_status` | enum | `missing` \| `stub` \| `draft` \| `accepted` — whether normalize_doc is trustworthy yet |

Optional later (only if clutter stays low):

| Column | Purpose |
|--------|---------|
| `family_id` | Group rows that share one `docs_dir_rel` (e.g. `nes_environmental`) |
| `mcs_sheet` | If MCS splits across sheets/files later (`inventory` default) |

## Conventions

1. **Empty path = no dedicated doc yet** — agent may create stub under `docs_dir_rel` only if the Linear packet says so.  
2. Prefer **one folder per dataset_id or family**, not one giant wiki.  
3. Fragments OK: `docs/DECISIONS.md#d-n3-nei-multiyear`.  
4. Paths use `/`, repo-relative, no `~/`.  
5. When normalize work is unique, **require** `normalize_doc_rel` before marking `normalize_status=done`.

## Interaction with Linear packets

Packet reprints:

1. Short **MCS contract** (same every issue) — points at `docs/agents/MCS.md` (or `heavymap-planning/AGENTS-MCS.md` until promoted into `heavymap`).  
2. Target `dataset_id` + columns to read/update.  
3. Doc paths **from the row** (or “create stub at docs_dir_rel/…”).

Agents do **not** each get a private guidance file; they get Linear text + one shared MCS.md + paths on the row.
