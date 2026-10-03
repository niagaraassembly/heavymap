# `hm` command contract

The command contract is the durable interface; who runs it (an agent, cron, a human) is replaceable. Run from the repo root:

```bash
./scripts/hm <command> [options]      # or: python3 -m heavymap <command> [options]
```

Python 3.9+, standard library only. Every command accepts `--root DIR` (repo root; default: found by walking up from the current directory) and `--json`.

## Exit codes

| Code | Meaning |
|---|---|
| 0 | Success. Nothing needs attention. |
| 1 | **Findings.** Validation or guard errors; `apply` met stale, refused or invalid decisions (or refused to write); an identifier was refused. Read the output, fix, re-run. |
| 2 | Usage or configuration error (bad arguments, cannot find the schema, destination not empty). |

Warnings never change the exit code.

## JSON output

With `--json` every command prints exactly one object:

```json
{"command": "validate", "ok": true, "exit_code": 0,
 "data": {"errors": 0, "warnings": 0, "tables": 14},
 "findings": [{"severity": "error", "code": "bad_value", "message": "...", "table": "quirks", "line": 2, "record": "Q-..."}]}
```

`ok` is `exit_code == 0`. `findings` holds validate/guard findings (empty for other commands). `data` is command-specific (below). Finding codes are stable and listed in the tables below.

## Commands that exist

### `hm validate`
Checks all 14 tables in `data/schema/table-schema.json`: file exists, exact ordered header, row width, UTF-8/LF/no BOM, cell hygiene, enums, patterns, dates, URLs, integers, required columns, unique keys, foreign keys, join `hits <= tested`, and every `review_decisions` row (valid code, human reviewer, editable field, existing record, valid new value, timestamp).
Finding codes: `missing_file`, `not_utf8`, `bom`, `crlf`, `header_mismatch`, `row_width`, `bad_value`, `required_blank`, `duplicate_key`, `hits_exceed_tested`, `fk_missing`, `bad_decision_code`, `bad_reviewer`, `agent_reviewer`, `bad_table`, `field_not_editable`, `record_missing`, `edit_without_value`, `bad_timestamp`; warning `grade_scale_undefined` (NIA-86 scale not defined).
`data`: `{errors, warnings, tables}`.

### `hm guard [--no-git]`
Enforces [HARD-RULES.md](HARD-RULES.md). `--no-git` skips the `git ls-files` checks (use only outside a checkout).
Finding codes: `tracked_local_path`, `oversize_file`, `gitignore_missing`, `owner_column`, `owner_value`, `g6_closed`, `deny_listed`, `deny_scored`; warning `git_unavailable`.
`data`: `{errors, g6_open}`.

### `hm apply [--write] [--dry-run]`
Turns `data/reviewed/review_decisions.csv` into registry changes. **Dry-run is the default**; `--write` is required to change files (`--dry-run` is accepted and wins over `--write`).

Semantics:
- Input is field-level and append-only. The **latest row per (table, record_id, field) wins**.
- Only fields in the table's `editable` list (see [TABLES.md](TABLES.md)) can change.
- `A` Confirm, `E` Edit/correct, `R` Reject apply `new_value`. **A corrected value on an `E` row is what lands in the registry.** `D`, `F`, `H`, `X`, `N` are recorded flags and never change a value. `E` needs a new value; `A` with a blank value is a pure confirmation.
- `old_value` must equal the registry value at apply time, otherwise the row is `stale` and is skipped (someone changed the record since the reviewer looked; review again).
- Policy checks run again: agent reviewer, `surfaced` while G6 is closed, `dormant`/`surfaced` by anyone but Morgen, deny-listed layers.
- Changing `layers.lifecycle_status` also stamps `status_changed_date` (date of the decision). Changing a `scores` component recomputes `total` (formula v1.0, proposal).
- `--write` first runs validation and aborts (exit 1, nothing written) if the data is invalid. Otherwise it writes the changed registry CSVs atomically and a manifest `data/runs/apply-<UTC>-<id>.json` listing consumed `decision_ids`, each change, and skipped rows. Commit the manifest with the registry change.

Item statuses (`data.summary` counts them): `pending` (would change), `applied` (registry already holds the value), `confirmed` (no value to apply), `flag` (D/F/H/X/N), `stale`, `refused` (reason is one of `agent_reviewer`, `g6_closed`, `promotion_morgen_only`, `deny_listed`), `invalid`.
Exit 1 if any item is `stale`, `refused` or `invalid`, or the write aborted; else 0 (pending items alone are not an error).
`data`: `{write, summary, applied, manifest, items[]}`.

### `hm ids ...`
Identifier helpers. Wraps `heavymap/ny_identifiers.py` (NIA-79) and the ID allocators ([ID-RULES.md](ID-RULES.md)).

| Command | Output |
|---|---|
| `hm ids check sbl20\|swis6\|swis_sbl_id VALUE` | exit 0 if valid; exit 1 with `data.refusal` (stable code such as `float_stored_input`, `wrong_length`, `swis_name_not_code`) if refused |
| `hm ids print-key SBL20 --style padded\|unpadded\|erie\|genesee\|chautauqua [--swis SWIS6]` | publisher-style print key (display only, never a join key) |
| `hm ids compose SWIS6 SBL20` | 26-character `swis_sbl_id` |
| `hm ids cand ENDPOINT` | `CAND-<8 hex>` for the canonical endpoint |
| `hm ids service JURISDICTION HOST_OR_NAME` / `hm ids layer SERVICE_ID LAYER_PATH` | `svc-...` / `lyr-...` slugs |
| `hm ids decision` | a new `DEC-<ULID>` |

`data`: `{value}` (or `{kind, value, valid}` for `check`). Values are text; pass identifiers as quoted strings.

### `hm status`
Row counts per table, layers per lifecycle status, decision states, open D/F/H/X/N flags, gates, candidates awaiting review. `data`: `{tables, lifecycle, decisions, open_flags, gates, g6_open, candidates_new}`.

### `hm review [--host 127.0.0.1|localhost] [--port 8765]`
Starts the localhost review UI and blocks until Ctrl+C. **Agents do not run this and never record decisions.** See [../for-humans/REVIEW-UI.md](../for-humans/REVIEW-UI.md).

### `hm demo DEST`
Creates a sandbox repo root at `DEST` (must be empty or absent) holding the schema and a few **synthetic** rows (reserved `.invalid` hosts, Linear id `NIA-999`) so the UI and `apply` can be tried without real data. Never use it inside the repo.

## Planned (not implemented; do not call, they do not exist)

`hm scan`, `hm add URL`, `hm pull`, `hm profile`, `hm quirks`, `hm jointest`, `hm score` (formula v1.0 exists as a function used by `apply`), `hm build` (workbooks, generated docs, status board), `hm followups`, `hm import-legacy`. Source: design analysis section 6.7 and [DATASET-ROUTINE.md](../routines/DATASET-ROUTINE.md). Until they exist, discovery, profiling and quirk logging are done by hand as described in [RUNBOOKS.md](RUNBOOKS.md) and land as reviewed PR rows.

## Environment

No network access, no third-party packages, no writes outside the repo root. `hm review` listens on 127.0.0.1 only.
