# Folder map

Status: **exists** (built and tested on `hm/fresh-foundation`), **planned** (described in the design but not built), **parked** (kept for reference).

```
heavymap/
├─ README.md  AGENTS.md                      exists  entry points (humans / agents)
├─ .gitignore                                exists  ignores /local-data/ /build/ *.tmp
├─ .github/PULL_REQUEST_TEMPLATE.md          exists  requires Linear id + "Pulled data committed: none"
│  └─ workflows/validate.yml                 planned CI: validate + tests only, never pulls data
├─ data/
│  ├─ schema/
│  │  ├─ table-schema.json                   exists  ordered headers, keys, FKs, editable whitelist, patterns
│  │  ├─ controlled-values.json              exists  decision codes, lifecycle, enums, deny rules, score formula v1.0
│  │  └─ id-rules.json                       planned (ID patterns live in table-schema.json today)
│  ├─ registry/        (canonical; header-only today; written by `hm apply` / reviewed PRs)
│  │  services  layers  fields  identifier_rules  quirks  join_tests
│  │  use_decisions  scores  claims  deny_list  gates              (.csv)      exists
│  │  jurisdictions.csv  sources.csv                               planned (from planning sheets 07 and 09)
│  ├─ inbox/candidates.csv                   exists  staging
│  │  probe_results.csv  profile_drafts.csv  quirk_candidates.csv  join_test_candidates.csv   planned
│  ├─ runs/
│  │  scan_runs.csv                           exists  header-only
│  │  apply-<UTC>-<id>.json                   exists  written by `hm apply --write`
│  │  pull_runs.csv  profile_runs.csv  followups.csv  intake.csv   planned
│  └─ reviewed/review_decisions.csv          exists  append-only, field-level, latest wins
├─ heavymap/                                 exists  Python package (stdlib only)
│  ├─ ny_identifiers.py                      exists  NIA-79 SBL/SWIS/print-key helpers (from PRs #53/#56)
│  ├─ ids.py  schema.py  csvio.py  findings.py   exists
│  ├─ validate.py  guard.py  apply.py  decisions.py  score.py  status.py  demo.py  cli.py  __main__.py   exists
│  └─ review/server.py                       exists  localhost review UI (server-rendered, no JavaScript)
├─ scripts/
│  ├─ hm                                     exists  launcher for the CLI
│  ├─ gen_table_docs.py                      exists  renders docs/for-agents/TABLES.md from the schema
│  └─ ny_identifier_real_check.py            exists  read-only check of local ID-only pulls (PR #56)
├─ tests/                                    exists  hm tests + NY identifier tests + Rochester fixture test
├─ fixtures/parcels/                         exists  synthetic Rochester parcel (PR #55)
├─ docs/
│  ├─ FOLDER-MAP.md                          (this file)
│  ├─ architecture/                          exists  product frame, ADRs, vocab (+ rochester-parcel-local-token.md, PR #55)
│  ├─ normalization/                         exists  NY SBL evidence docs (PRs #53/#56)
│  ├─ routines/DATASET-ROUTINE.md            exists  the routine (draft, from PR #57)
│  │  DATA-AUTHORITY.md  SCORING.md  REVIEW-DESK.md  SCHEDULING.md  prompts/        planned
│  ├─ for-agents/                            exists  AGENTS entry docs, command contract, hard rules, runbooks
│  ├─ for-humans/                            exists  overview, workflow, manual steps, UI walkthrough, glossary
│  ├─ datasets/<dataset_id>/                 planned generated evidence pages
│  └─ generated/                             planned catalog.md, coverage.md, status-board.md
├─ local-data/                               git-ignored  raw pulls (never committed)
├─ build/                                    git-ignored  generated workbooks, tmp, manifests with hashes
└─ misc/                                     parked  see misc/README.md
```

Where the old locations went: `AGENTS.md` → `docs/for-agents/PICKUP-CONTRACT.md`; `AGENTS-MCS.md` → `docs/for-agents/AGENTS-MCS.md`; `niagara-atlas/` → `misc/niagara-atlas/`; `heavymap-planning/` and `Spreadsheets/` → `misc/heavymap-planning/` and `misc/Spreadsheets/` (except `DATASET-ROUTINE.md` → `docs/routines/`).

Column-level detail for every table: [for-agents/TABLES.md](for-agents/TABLES.md). Plain-language folder guide: [for-humans/FOLDERS.md](for-humans/FOLDERS.md).
