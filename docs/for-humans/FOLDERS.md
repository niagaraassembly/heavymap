# What each folder is

Tree with status: [../FOLDER-MAP.md](../FOLDER-MAP.md).

| Folder | In plain words | Edit it? |
|---|---|---|
| `data/schema/` | The rulebook: the exact columns of every table and the allowed values. Everything else (checks, apply, the review page, the table docs) reads from here. | By PR only; then run `python3 scripts/gen_table_docs.py`. |
| `data/registry/` | **The truth.** One CSV per kind of fact: services, layers, fields, identifier rules, quirks, join tests, use decisions, scores, claims, deny list, gates. Currently header-only. | Existing values: via review + `hm apply`. New rows: reviewed PR. |
| `data/inbox/` | Staging: candidates found by scans. Nothing here is approved. | Agents add rows; you set `status` in the review page. |
| `data/runs/` | Records of runs (`scan_runs.csv`) and the manifests `hm apply --write` produces. | Agents/commands add; do not edit. |
| `data/reviewed/` | `review_decisions.csv`: your decisions, append-only. | Only through the review page. |
| `heavymap/` | The Python package behind `hm` (ids, schema, validate, apply, guard, review UI). Also holds the New York identifier helpers (`ny_identifiers.py`). | Code review. |
| `scripts/` | `hm` (launcher), `gen_table_docs.py`, and `ny_identifier_real_check.py` (a read-only check of local ID-only pulls). | Code review. |
| `tests/` | The automated tests (no network, no real data). | Code review. |
| `fixtures/` | Synthetic parcel records used by tests and documentation (no real data). | Rarely. |
| `docs/architecture/` | The product frame: Parcel Identity Spine, Context Band Ladder, PCDP, Claim & Refusal Contract, decision records, vocabularies. | By PR; code-owner review. |
| `docs/normalization/` | Evidence docs for NY identifier rules (NIA-79). The model for how to write up a verified finding. | By PR. |
| `docs/routines/` | How work is done: `DATASET-ROUTINE.md`. | By PR. |
| `docs/for-agents/` · `docs/for-humans/` | Instructions for agents · for people. | By PR. |
| `.github/` | Pull request template. (CI workflow is planned.) | By PR. |
| `local-data/` | **Not in git.** Where pulled raw data would live on one computer. Created when needed. | Never commit. |
| `build/` | **Not in git.** Generated workbooks and temp files. | Never commit. |
| `misc/` | Everything that has no role in the new design yet: the first Niagara atlas prototype, old planning sheets and docs, the Monroe crosswalk (NIA-81), parked CONTRIBUTING/CODEOWNERS. Original relative paths are kept beneath it. Nothing was deleted. | Reference only. |
