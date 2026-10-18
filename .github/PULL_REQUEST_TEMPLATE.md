<!-- Adapted from PR #58 (hm/fresh-foundation @ 15adec2) for the #57 layout; CLI/registry-specific parts deferred to a later code PR. -->
<!-- Draft PRs until a human has reviewed. Agents never merge. See AGENTS.md and CONTRIBUTING.md. -->
Linear: <!-- existing NA-… ID when applicable -->
Pulled data committed: none
MCS cells changed: none <!-- or name each dataset_id and summarize cells changed; see AGENTS-MCS.md -->

## What a human must review

## Checks

- [ ] No owner values, real personal data, secrets, or pulled data in this PR; owner field **names only** where needed.
- [ ] No owner or identifying values in any public output (tiles, site files, UI, exports); raw pulls with all fields stay in `local-data/` (HARD-RULES 1, 2).
- [ ] Pull rights and use or publication rights have been considered separately.
- [ ] Public publish or deploy still needs Morgen's per-jurisdiction beta-gate sign-off (NA-269); publish/deploy tooling may be built and tested (HARD-RULES 3).
- [ ] Process insights logged in `Spreadsheets/19-process-insights.csv` (sources found, dead ends, data quirks, methods, effort estimates, gaps), or none this session.
