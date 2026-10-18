# Process insights

**Status:** living. Standing rule for every AI session and every human working on HeavyMap (Morgen, 2026-10-17).
**Atlas inventory:** [`Spreadsheets/19-process-insights.csv`](../Spreadsheets/19-process-insights.csv) (source of truth, append-only). Frontend uses `HM-PI-` and the destination/interim PR-report route in [WORKING-AGREEMENT.md](WORKING-AGREEMENT.md#insights-and-handoffs), with these same columns. This scoped routing supersedes references below to one shared inventory; do not duplicate findings across logs.

## Why this exists

HeavyMap will publish synthesized reports on what we discover while aggregating and processing data: which sources exist, which don't, where public data falls short, what the data quirks are, and what it costs to fill the gaps. That material comes out of the work done in each AI session (Claude Code, Codex, Cursor cloud and interactive agents, Copilot, Grok Bot, ChatGPT and others). If it stays in a chat transcript or a final message, it is lost. Every session therefore logs its insights in one inventory, with the evidence behind them.

## Insight, issue or decision?

| It is… | It goes to… |
|---|---|
| An observation or learning: a source found, a dead end ruled out, a data quirk, a method that works, an effort estimate, a gap, a licence note, a performance finding | **This inventory** (`Spreadsheets/19-process-insights.csv`) |
| Actionable work someone should do | A **Linear issue** (`NA-…`). Put its id in `linked_issue` on the insight row. |
| A choice Morgen has made or must make | The **decision log**: open questions in `heavymap-planning/OPEN-DECISIONS.md`, firm or provisional decisions in `DECISIONS.md` where it is kept. Do not decide open questions yourself. |

One finding can produce all three: log the insight, open or cite the issue, and raise the decision.

Layer-level quirks found during dataset profiling also go in `Spreadsheets/18-quirks-log.csv` per `DATASET-ROUTINE.md`. Log the insight here as well when it matters beyond that one layer or is worth reporting.

## Columns

| Column | Meaning |
|---|---|
| `insight_id` | `PI-` plus a zero-padded running number (`PI-0011`). Take the next free number. Never reuse. |
| `date` | Date the insight was found, `YYYY-MM-DD`. |
| `tool_session` | Who found it: `claude-code`, `codex`, `cursor-cloud`, `cursor`, `copilot`, `grok-bot`, `chatgpt`, `human`, or another short lower-case name. |
| `session_ref` | Branch, PR, agent run URL or Linear comment URL, if any. |
| `jurisdiction` | Short jurisdiction slug, e.g. `hamilton`, `welland`, `ca-on`, or `cross-cutting`. |
| `dataset_or_source` | The dataset, layer, service, server or document the insight is about. |
| `insight_type` | One of `source_found`, `dead_end`, `data_quirk`, `method`, `gap`, `effort_estimate`, `licence_note`, `performance`. Use one row per type. |
| `finding` | What was learned, in plain sentences. |
| `evidence` | What backs it, verified live where possible: URLs, counts, field names, last-edit dates and the date checked. Separate items with ` \| `. Never row values or owner values (HARD-RULES 2). |
| `implication` | What it means for HeavyMap: what to do, use or avoid. |
| `report_worthy` | `y` if it belongs in a published synthesized report, `n` if it is internal only. |
| `linked_issue` | Linear id (`NA-…`), or blank. Never `NIA-`. |
| `status` | `open`, `actioned` (the implication has been carried out) or `superseded` (name the replacing `insight_id` in a new row's evidence). |

CSV format follows `docs/for-agents/HARD-RULES.md`: UTF-8, LF, RFC-4180 quoting, ISO dates, no semicolons or newlines inside cells.

## Etiquette

- **Append only.** Add new rows at the end. Never delete or rewrite another session's row. The only edit allowed on an existing row is its `status` (to `actioned` or `superseded`) and, when it becomes known, its `linked_issue`.
- **Corrections are new rows.** If a finding turns out wrong, add a row with the correction and set the old row to `superseded`.
- **Evidence first.** Record what you checked and when. A dead end with its search scope ("checked all 1,697 layers") is as valuable as a find.
- **Blank is not zero** (HARD-RULES 8). Leave unknown cells blank.
- **Agents that cannot write to the repo** (no write access, chat-only sessions) put their insights in their final message under the heading `Process insights`, with the same fields, so a human or Grok Bot can log them.
- **Per-jurisdiction notes.** A focus folder may keep a quick `INSIGHTS.md` for scratch notes, but every insight in it must also be mirrored as a row in the CSV.
