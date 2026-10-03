# AGENTS.md

Entry point for AI agents working in `niagaraassembly/heavymap`. Everything you need is under [`docs/for-agents/`](docs/for-agents/README.md). Humans start at [`docs/for-humans/README.md`](docs/for-humans/README.md).

## Read in this order

1. [`docs/for-agents/HARD-RULES.md`](docs/for-agents/HARD-RULES.md) - the rules that are never negotiable.
2. [`docs/for-agents/PICKUP-CONTRACT.md`](docs/for-agents/PICKUP-CONTRACT.md) - when you may pick up work (`agent-ready` + your lane label + a complete Agent packet). This is the former root `AGENTS.md`, unchanged apart from paths.
3. [`docs/for-agents/COMMANDS.md`](docs/for-agents/COMMANDS.md) - the `hm` command contract: subcommands, exit codes, JSON output.
4. [`docs/for-agents/RUNBOOKS.md`](docs/for-agents/RUNBOOKS.md) - step by step, including what to do when a rule stops you.
5. [`docs/for-agents/ID-RULES.md`](docs/for-agents/ID-RULES.md), [`docs/for-agents/TABLES.md`](docs/for-agents/TABLES.md) - IDs and every table's columns.
6. [`docs/for-agents/AGENTS-MCS.md`](docs/for-agents/AGENTS-MCS.md) - Master Control Spreadsheet hygiene.

## The short version

- Cite a Linear issue (`NIA-xx`) on every PR, every registry row and every review decision.
- Open a **draft** PR. Never merge. Never approve your own work: only a human reviewer decides, in the review UI.
- Pulled data stays in git-ignored `local-data/`. Never commit it. Never record owner **values**, only field **names**.
- Nothing is published or `surfaced` before gate G6. MPAC is `not_licensed`. NPCA-derived layers are noted, not ingested.
- Check before every commit: `./scripts/hm validate && ./scripts/hm guard && python3 -m unittest discover -s tests`.

Folder map: [`docs/FOLDER-MAP.md`](docs/FOLDER-MAP.md). Prior art and parked material: [`misc/`](misc/) (reference only; not the product root).
