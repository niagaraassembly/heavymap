# CLAUDE.md

Claude Code reads this file. The agent instructions for this repository live in [AGENTS.md](AGENTS.md) (pickup contract, lanes, Agent packet), [AGENTS-MCS.md](AGENTS-MCS.md) and [docs/for-agents/HARD-RULES.md](docs/for-agents/HARD-RULES.md). Read them first; they win over this file. HARD-RULES 3: publish/deploy tooling may be built and tested; public publish or deploy still needs Morgen's per-jurisdiction beta-gate sign-off (NA-269).

Read [the shared working agreement](heavymap-planning/WORKING-AGREEMENT.md) for concurrent tracks, scoped frontend authorization, task packets and contract-change ownership. PR #80 remains paused. Frontend insight routing follows that agreement; the Atlas destination below applies to backend findings only.

## Process insights (standing rule)

Before finishing any session or PR, append your process insights (sources found, dead ends ruled out, data quirks, method findings, effort estimates, gaps, licence notes) as new rows in `Spreadsheets/19-process-insights.csv`, with live-verified evidence (URLs, counts, dates checked). Append only. Columns and etiquette: [heavymap-planning/PROCESS-INSIGHTS.md](heavymap-planning/PROCESS-INSIGHTS.md). If you were told not to commit, still write the rows to the file and say so in your final message. If you cannot write to the repo, list the insights in your final message under the heading **Process insights**.

Use `NA-` Linear prefixes, never `NIA-`.
