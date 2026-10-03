# Runbooks

Commands assume the repo root and `./scripts/hm`. "Exists" and "planned" follow [COMMANDS.md](COMMANDS.md). All times in review rows are UTC.

## 1. Before you start any task

1. Confirm pickup per [PICKUP-CONTRACT.md](PICKUP-CONTRACT.md): label `agent-ready`, your `agent:*` lane label, a complete Agent packet. Missing something: comment on the Linear issue and stop.
2. Note the Linear issue (`NIA-xx`). You will need it in every row and in the PR.
3. Branch from current `origin/main` (never work on `main`, never reuse a checkout with someone else's uncommitted changes - use `git worktree add ../<name> -b <branch> origin/main`).
4. Read [HARD-RULES.md](HARD-RULES.md). Run `./scripts/hm status` to see the current state and that G6 is closed.

## 2. Add a discovered service or layer as an inbox candidate (manual; `hm scan`/`hm add` are planned)

1. Get the id: `./scripts/hm ids cand "https://host/arcgis/rest/services/Folder/Name/MapServer/0" --json`.
2. Check the deny rules by eye first: publisher or endpoint mentioning **MPAC** or **NPCA** (or org id `d0ZCwU7eGKVeNiEE`) is not ingested. Still record it, with `status` = `blocked` and a note, so it is not re-discovered.
3. Append one row to `data/inbox/candidates.csv`: `cand_id`, canonical `endpoint`, `publisher`, `jurisdiction`, `family`, `source_url`, `access_date` (ISO), `discovered_via`, `run_id`, `status` = `new` (or `blocked`), `linear_id`. Leave human decisions to the reviewer.
4. `./scripts/hm validate && ./scripts/hm guard`.
5. Commit, push, open a **draft** PR (section 6).

## 3. Propose registry rows (service, layer, fields, identifier rule, quirk, join test, claim, score, use recommendation)

Until the planned importers/profilers exist, new rows arrive as reviewed PR edits to the header-only CSVs in `data/registry/`.

1. Only after the slice is approved (DATASET-ROUTINE stage 0). Pulling is allowed only for approved slices; raw pulls go to `local-data/` only.
2. Follow the column rules in [TABLES.md](TABLES.md): ids as text, ISO dates, `evidence_urls` separated by ` | `, no `;`, no newlines, `linear_id` filled.
3. Owner-bearing fields: `fields.csv` row with `owner_flag` = `yes` and the field **name**; list names in `layers.pii_owner_fields_names_only`. Never sample or copy values.
4. Every fact worth citing gets a `claims.csv` row: URL, access date, `evidence_label` `live_read` or `documented_not_reread`, and a locator. Counts come from the server (`returnCountOnly`); samples are at most 5 records and never from owner or free-text fields; join results are `hits`/`tested` numbers with `population` `sample` or `full`.
5. Set `lifecycle_status` honestly: `catalogued`, `pulled`, `profiled`, `formatting_needed`, `format_resolved`, `spined`. **Never** `dormant` or `surfaced` (Morgen only; `surfaced` also needs G6). Use `use_decisions.use_decision` only as a recommendation: leave `needs_more`; the human decides.
6. `./scripts/hm validate && ./scripts/hm guard`, then section 6.

## 4. Apply reviewed decisions (usually a human does this, an agent may prepare it on a PR branch)

1. `git pull` the branch containing `data/reviewed/review_decisions.csv` rows saved by the reviewer.
2. `./scripts/hm validate` must be clean.
3. Dry-run: `./scripts/hm apply` (or `--json`). Read every `pending`; investigate every `stale`, `refused`, `invalid` (do not "fix" the decision file; append a new decision or tell the reviewer).
4. `./scripts/hm apply --write`. Re-run `./scripts/hm validate && ./scripts/hm guard`.
5. Commit the changed `data/registry/*.csv` **and** the new `data/runs/apply-*.json` manifest together, one commit, message citing the Linear id.

## 5. Record progress on Linear

Post a comment on the slice issue at each stage using the DATASET-ROUTINE header `Stage N / jurisdiction / family / layers touched / evidence URLs` and its stage line ([DATASET-ROUTINE.md](../routines/DATASET-ROUTINE.md) section 4). Counts, methods, ids and hashes only - never owner values. Roll-up comments by Grok Bot only.

## 6. Open the PR

1. `./scripts/hm validate && ./scripts/hm guard && python3 -m unittest discover -s tests` all exit 0. `git status` shows nothing under `local-data/` or `build/`.
2. Push the branch. Open a **draft** PR. Title says what a human must review. Body must contain: `Linear: NIA-xx`, what changed, "Pulled data committed: none", and whether any MCS cell changed (see [AGENTS-MCS.md](AGENTS-MCS.md)).
3. Do not merge. Do not mark ready for review on Morgen's behalf. Wait for a human.

## 7. When a rule stops you

| Situation | Do | Do not |
|---|---|---|
| Source needs a login/token, or is blocked twice | Set `blocked`, say why in notes, move on | Look for a workaround |
| Publisher/endpoint is MPAC or NPCA-derived | Candidate with `status` `blocked` or `rejected`; layer (if it exists) `not_used`; score blank | Pull, profile or score it |
| You see owner values (a name, a mailing address) in data | Stop. Report the table/file path and the field **name** to the human | Copy, quote, or describe the value anywhere |
| You find a secret | Report path and type, stop | Quote or "fix" it |
| `hm guard` reports `tracked_local_path` or `oversize_file` | `git rm --cached` the file, keep it in `local-data/`, re-run | Commit it anyway |
| A task asks you to publish, surface, approve or merge | Refuse and say who can | Do it |
| The scan finds nothing | Record the run with `status` `empty`; a zero result is valid | Pad it |
