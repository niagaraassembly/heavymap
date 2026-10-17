Adapted from PR #58 (hm/fresh-foundation @ 15adec2) for the #57 layout; CLI/registry-specific parts deferred to a later code PR.

# Hard rules

These apply to every agent on every task. If a task would break one, stop and report it. Follow root `AGENTS.md`, `AGENTS-MCS.md`, and `CONTRIBUTING.md`; dataset work follows `heavymap-planning/DATASET-ROUTINE.md`.

1. **Pulled data never goes in the repo.** Keep raw pulls local. Commit only the permitted documentation and sheet changes; never commit real personal data.
2. **No owner values, ever.** Owner and owner-name fields are dropped at pull time (explicit `outFields`, never `*`), so owner values never reach `local-data/`. Where a field cannot be excluded at query time, it is dropped before the file is written. This rule is unchanged by the licence amendment of 2026-10-17. Masking per D-13 still applies to anything already held: record owner-bearing field **names** only in sheets, docs, PRs, and comments, never values (`heavymap-planning/DATASET-ROUTINE.md`). D-13 itself ("retain, don't strip; mask at the presentation layer", `first-attempts/niagara-atlas/TECHNOLOGY-DECISIONS.md`) does not authorize publishing values.
3. **Nothing is surfaced or published before G6.** Treat G6 as closed until Morgen decides. Morgen decides whether a layer becomes `dormant` or `surfaced`; do not add publish or deploy tooling ahead of that decision.
4. **MPAC-derived data may be pulled and used.** Licences are not a gate while heavymap.com is password-protected for limited viewing (Morgen, 2026-10-17). Rule 2 still applies: no owner values. Revisit this rule before any public (unprotected) release.
5. **NPCA-derived layers may be ingested**, including NPCA's MPAC-derived assessment parcels, under rule 4 and with owner fields dropped at pull time (rule 2).
6. **Pull permission and use or publication permission are separate.** Check access before pulling. While rule 4 holds, licences do not gate pulling or password-protected use; record the licence anyway so a public release can be re-checked. See `heavymap-planning/DATASET-ROUTINE.md`.
7. **Human review.** Agents do not approve or merge their work. Use the `agent-ready`, lane, and packet rules in `AGENTS.md`; cite an existing Linear ID in a PR when applicable under `CONTRIBUTING.md`.
8. **Unknown stays unknown.** Blank is not zero, and a zero-result scan is valid. Do not invent values to fill a sheet.
9. **No workaround for gated sources.** If access is blocked or login-walled, mark it blocked and stop. No tokens or scraping around authentication.
10. **No secrets.** If one is found, report its path and type, never its value, and stop.
11. **UK geography is out of scope.** Follow `AGENTS.md` and `AGENTS-MCS.md` for the UK analogue convention.

For actual `Spreadsheets/` CSV edits, use UTF-8, LF line endings, RFC-4180 quoting, ISO dates (`YYYY-MM-DD`), text IDs, and no formula-leading cells. Do not put semicolons or newlines inside cells; separate multiple values with ` | `.
