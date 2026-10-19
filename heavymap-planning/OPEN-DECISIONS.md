Adapted from PR #58 (hm/fresh-foundation @ 15adec2) for the #57 layout; CLI/registry-specific parts deferred to a later code PR.

# Open decisions

These questions remain for Morgen. Existing policy in `AGENTS.md`, `AGENTS-MCS.md`, `CONTRIBUTING.md`, and `heavymap-planning/DATASET-ROUTINE.md` still applies while they are open.

1. **`defer` vs `needs_more`.** Stage 7 of `heavymap-planning/DATASET-ROUTINE.md` says `defer`; the proposed vocabulary says `needs_more`. Choose one term before changing the routine or sheets.
2. **MCS `dataset_id` vs layer `layer_id`.** Is one MCS dataset a layer or a family? Define how `Spreadsheets/17-layer-profile.csv` relates to the MCS and when its dataset reference is filled. Do not infer the mapping.
3. **D-13 and owner fields.** `first-attempts/niagara-atlas/TECHNOLOGY-DECISIONS.md` proposes retaining owner data at ingest and later presentation tiers; the current `heavymap-planning/DATASET-ROUTINE.md` records field **names only**. Confirm how any future private ingest would work. Until then, put no owner values or real personal data in docs, sheets, PRs, or comments, and publish none.
4. **NIA-86 join grade scale.** `heavymap-planning/DATASET-ROUTINE.md` calls for a grade, but the thresholds and denominators need a decision. Define them before treating grades as comparable.
5. **MCS location conflict.** Root `AGENTS-MCS.md` says the workbook is outside the repo; root `CONTRIBUTING.md` says the matching workbook and CSV are tracked under `Spreadsheets/`. Decide the authority and edit process for the existing sheets. Do not relocate them or replace the MCS with another authority here.
6. **G6.** Decided 2026-10-18: G5 and G6 are merged into one staged per-jurisdiction beta gate (Stage A reconciled, Stage B publishable). Public publish or deploy still needs Morgen's sign-off on NA-269. Publish/deploy tooling may be built and tested (HARD-RULES 3). Details: `heavymap-planning/BETA-GATE-HAMILTON.md`. PR #80 records the migration plan; execution and naming changes need a separate assignment from Morgen. Preparing or merging frontend work does not execute the split.
7. **Score formula.** PR #58 proposed v1.0 weights (joinability 25, coverage 15, openness 15, …) in its unmerged `data/schema/controlled-values.json`. They need calibration on the Welland/Rochester pilot in `Spreadsheets/15-pilot-join-matrix-welland-rochester.csv`. Decide whether to use weighted totals or keep component assessments only; blank remains unmeasured.
