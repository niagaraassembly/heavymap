# HeavyMap for humans

This repo answers one question over and over: **"which public datasets may HeavyMap use, and what do we know about each one?"** Agents do the reading and write down checkable facts. You decide. The files are plain CSV so you can open them in LibreOffice or read the diff on GitHub.

## The idea in five lines

1. **CSV is the truth.** The tables in `data/registry/` are the record. Spreadsheets (xlsx) are only ever generated views (planned), never edited as truth.
2. **Agents propose, you decide.** Agent output lands in `data/inbox/` (staging). Nothing an agent writes counts as approved.
3. **Decisions are append-only.** Every click you make in the review page adds one line to `data/reviewed/review_decisions.csv`. Nothing is overwritten; the latest line for a field wins; the earlier ones stay as history.
4. **`hm apply` moves the registry.** Only that command turns your decisions into changed registry values, and it shows a dry run first.
5. **Hard rules are checked by machine.** No pulled data in git, no owner names/addresses, nothing published before gate G6, MPAC not licensed, NPCA not ingested, a Linear issue on everything. `hm guard` fails loudly if any is broken.

## Read next

| You want to... | Read |
|---|---|
| see how a scan becomes a reviewed decision | [SCAN-TO-DECISION.md](SCAN-TO-DECISION.md) |
| do the git and shell steps by hand | [MANUAL-STEPS.md](MANUAL-STEPS.md) |
| use the review page | [REVIEW-UI.md](REVIEW-UI.md) |
| look up a word (lifecycle, quirk, grade, G6...) | [GLOSSARY.md](GLOSSARY.md) |
| know what each folder is | [FOLDERS.md](FOLDERS.md) and the tree in [../FOLDER-MAP.md](../FOLDER-MAP.md) |
| see what is undecided or unfinished | [OPEN-DECISIONS.md](OPEN-DECISIONS.md) |
| see what agents are told | [../for-agents/README.md](../for-agents/README.md) |

## What works today, and what does not

**Exists and tested:** the table definitions and header-only CSVs, `hm validate`, `hm guard`, `hm apply` (dry-run first), `hm ids`, `hm status`, `hm demo`, and `hm review` (the localhost page). **Planned, not built:** `hm scan`, `hm add`, `hm pull`, `hm profile`, `hm quirks`, `hm jointest`, `hm build` (workbooks, generated docs), `hm import-legacy` (loading the old planning sheets), a CI workflow, and branch protection / CODEOWNERS. The registry is **empty on purpose** until real, reviewed rows are added.

You need Python 3.9 or newer and git. Nothing else is installed.
