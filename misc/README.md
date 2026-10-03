# misc/

Material with no immediate role in the fresh HeavyMap layout. Nothing here was deleted; each item keeps its original relative path (`misc/<original path>`). Reference only: do not extend it as the product root.

| Path under `misc/` | What it is | Came from |
|---|---|---|
| `niagara-atlas/` | First prototype (Leaflet/OSM atlas, scripts, data, decision log such as D-13) | `origin/main` (was `niagara-atlas/`) |
| `docs/grok-bot-docs/`, `docs/pivot-from-paton.txt`, `planning-na-template.md` | Older notes | `origin/main` |
| `heavymap-planning/07, 10, 11, 12` (md) | Roster, joining concepts, ledger, authority-scale notes | `origin/main` |
| `heavymap-planning/02-…NOTES.md`, `06-mcs-doc-path-columns.md` | MCS notes | `origin/main` (root), path as in PR #57 |
| `heavymap-planning/13, 14, EPIC-01, EPIC-02, drafts/` | Catalog audit, fix list, epics, skill draft | PR #57 (`office/heavymap-tidy-root` @ 1f8e5b5) |
| `Spreadsheets/00, 02 (csv, xlsx), 07, 08, 09, 11, 15, 16, 17, 18` | Planning index, MCS dataset inventory, roster, catalog (4,079 rows), ledger, pilot join matrix, and the header templates for services/layers/quirks | `origin/main` (02 xlsx, 07, 08, 09, 11) and PR #57 (00, 02 csv, 15, 16, 17, 18) |
| `Spreadsheets/value-and-revenue.ods` | A business document that was already tracked on `main`; PR #57 untracks and ignores it. Moving it here does not make it private. | `origin/main` |
| `docs/data/`, `scripts/monroe_swis_crosswalk.py`, `tests/test_monroe_swis_crosswalk.py` | Monroe `countysbl` prefix / SWIS-name crosswalk (NIA-81). Run its tests with `python3 -m unittest discover -s misc/tests`. | PR #54 |
| `CONTRIBUTING.md`, `CODEOWNERS` | Human-contributor guide (contradicts `AGENTS-MCS.md` on MCS tracking) and CODEOWNERS with placeholder handles | PR #57 |
| `scripts/check_index_paths.py` | Checks paths in the planning index | PR #57 |

Why parked: the registry tables in `data/registry/` replace the 16/17/18 templates; sheets 07, 09, 11 and 15 become one-time import sources (planned `hm import-legacy`); the rest is prior art.
