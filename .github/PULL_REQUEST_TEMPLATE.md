<!-- Adapted from PR #58 (hm/fresh-foundation @ 15adec2) for the #57 layout; CLI/registry-specific parts deferred to a later code PR. -->
<!-- Draft PRs until a human has reviewed. Agents never merge. See AGENTS.md and CONTRIBUTING.md. -->
Linear: <!-- existing NA-… ID when applicable -->
Pulled data committed: none
MCS cells changed: none <!-- or name each dataset_id and summarize cells changed; see AGENTS-MCS.md -->

Track / owner / branch and base SHA:
Contract version / artifact or fixture reference:
Acceptance claim and evidence (fixture-complete / operationally validated / integrated / publication-approved):
Checks passed / failed / skipped / unrun and implications:
Dependencies (linked Linear issues) / next action:

Shared protocol: [WORKING-AGREEMENT.md](../heavymap-planning/WORKING-AGREEMENT.md). Before merging, verify whether the changed paths trigger publication and whether jurisdiction approval applies.

## What a human must review

## Checks

- [ ] No owner values, real personal data, secrets, or pulled data in this PR; owner field **names only** where needed.
- [ ] No owner or identifying values in any public output (tiles, site files, UI, exports); raw pulls with all fields stay in `local-data/` (HARD-RULES 1, 2).
- [ ] Pull rights and use or publication rights have been considered separately.
- [ ] Public publish or deploy still needs Morgen's per-jurisdiction beta-gate sign-off (NA-269); publish/deploy tooling may be built and tested (HARD-RULES 3).
- [ ] Process insights routed by track under WORKING-AGREEMENT.md: Atlas sheet 19, or frontend HM-PI entries in the PR until the frontend log exists, or none this session.
