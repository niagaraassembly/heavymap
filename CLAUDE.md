# CLAUDE.md

Claude Code reads this file. The agent instructions for this repository live in [AGENTS.md](AGENTS.md) (pickup contract, lanes, Agent packet), [AGENTS-MCS.md](AGENTS-MCS.md) and [docs/for-agents/HARD-RULES.md](docs/for-agents/HARD-RULES.md). Read them first; they win over this file. HARD-RULES 3: publish/deploy tooling may be built and tested; public publish or deploy still needs Morgen's per-jurisdiction beta-gate sign-off (NA-269).

Read [the shared working agreement](heavymap-planning/WORKING-AGREEMENT.md) for concurrent tracks, scoped frontend authorization, task packets and contract-change ownership. PR #80 records the merged split plan; split execution and identifier migration require a separate assignment from Morgen.

## Process insights (standing rule)

Before finishing a session or PR, record reusable findings once with live-verified evidence. Atlas findings go to `Spreadsheets/19-process-insights.csv` with `PI-` IDs. Frontend findings use `heavymap-planning/frontend/19-process-insights.csv` with `HM-PI-` IDs; until that file exists, use the PR's Process insights section with the same columns. Never write frontend findings into Atlas sheet 19. Preserve reserved IDs and append-only etiquette. If unable to write, report findings in the final response for transfer. See [PROCESS-INSIGHTS.md](heavymap-planning/PROCESS-INSIGHTS.md).

Use `NA-` Linear prefixes, never `NIA-`.
