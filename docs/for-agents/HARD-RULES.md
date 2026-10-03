# Hard rules

These apply to every agent on every task. If following a task would break one, stop and report instead (see [RUNBOOKS.md](RUNBOOKS.md) section 7).

| # | Rule | Enforced by |
|---|---|---|
| 1 | **Pulled data never goes in git.** Raw pulls live in git-ignored `local-data/`; generated files in git-ignored `build/`. No tracked file over 2 MB outside `docs/` and `misc/`. | `hm guard` (`tracked_local_path`, `oversize_file`, `gitignore_missing`) |
| 2 | **No owner values, ever.** Record owner-bearing field **names** only (`fields.csv`, `layers.pii_owner_fields_names_only`). Never put an owner value in a table, doc, Linear comment, PR text or review note. Raw values may exist only inside `local-data/` on the machine that pulled them. | `hm guard` (`owner_column`, `owner_value`); the review UI refuses owner-looking text and masks it on display; the UI has no code path to `local-data/` |
| 3 | **Nothing is published or `surfaced` before gate G6.** A missing `gates.csv` row means closed. `dormant` and `surfaced` are set by Morgen only. There is no publish/deploy tooling in this repo; do not add any. | `hm guard` (`g6_closed`), `hm apply` and the UI refuse (`g6_closed`, `promotion_morgen_only`) |
| 4 | **MPAC is `not_licensed`.** Never pull or use it. Matching layers/candidates are forced to `not_used` with a blank score (a gate, not a low score). | built-in deny rule + `data/registry/deny_list.csv`; `hm guard` (`deny_listed`, `deny_scored`) |
| 5 | **NPCA-derived layers are not ingested.** Note them (candidate row, status `blocked` or `rejected`, reason), move on. | same deny rule |
| 6 | **Every output cites a Linear issue `NIA-xx`.** Registry rows, run rows, review decisions, PR bodies. | `hm validate` (`required_blank`, pattern `^NIA-\d+$`); the UI refuses a save without it |
| 7 | **Human review.** Agents never approve, never merge, never record review decisions. A decision's `reviewer` must be a human name; names starting with `agent`, `bot`, `grok`, `codex`, `claude`, `cursor`, `copilot`, `kiro`, `gpt`, `llm` are refused. All PRs are draft until a human reviews. | `hm validate` (`agent_reviewer`), `hm apply` and UI refuse. Reviewer identity is self-declared, so the real control is PR review by a human code owner (CODEOWNERS is parked in `misc/` with placeholder handles; see [open decisions](../for-humans/OPEN-DECISIONS.md)) |
| 8 | **Unknown stays unknown.** Blank is not zero, a blank decision is "unreviewed" not "rejected", a zero-result scan is valid. Do not invent values to fill a column. | convention; scores: blank heavy criterion gives a blank total |
| 9 | **Registry changes go through review decisions.** Change an existing value only by a reviewed decision plus `hm apply --write`. Do not hand-edit a registry value. (Adding brand-new rows is a reviewed PR until the planned importers exist.) | `hm apply` whitelist; PR review |
| 10 | **No workaround for gated sources.** Blocked or login-walled twice means mark `blocked` and skip. No tokens, no scraping around auth. | convention (DATASET-ROUTINE) |
| 11 | **No secrets in the repo.** If you find one, report the path and type, not the value, and stop. | convention (PICKUP-CONTRACT) |
| 12 | **UK geography is out of scope.** | PICKUP-CONTRACT |

CSV hygiene (checked by `hm validate`): UTF-8, LF line endings, RFC-4180 quoting, ISO dates (`YYYY-MM-DD`, review timestamps `YYYY-MM-DDTHH:MM:SSZ` in UTC), no `;` or newline inside a cell (use ` | ` between several values), no leading `= + @` or non-numeric `-`, IDs are text.
