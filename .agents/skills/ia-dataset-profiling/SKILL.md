---
name: heavymap-dataset-profiling
description: Use when discovering, profiling or harmonizing a jurisdiction's datasets for HeavyMap (service profile, layer profile, quirks log, spine-join test). Not for publishing or MCS edits.
---

# HeavyMap dataset profiling

Pointer only. The routine is still being decided: follow `heavymap-planning/DATASET-ROUTINE.md` (DRAFT; the doc wins) and the fuller draft skill in `heavymap-planning/drafts/dataset-routine-SKILL.md`. When that draft is registered, this file should be replaced by it.

- Sheets: `Spreadsheets/16-service-profile.csv`, `17-layer-profile.csv`, `18-quirks-log.csv`; baseline `15-pilot-join-matrix-welland-rochester.csv`.
- Pulled data goes to git-ignored `local-data/` only. In a cloud agent it is lost when the VM ends: record facts (counts, id quirks, CRS, encoding), never the rows.
- Pull all fields; owner and identifying values never in sheets, docs or public output (HARD-RULES 2, D-13). MPAC- and NPCA-derived data may be used (HARD-RULES 4, 5). Gated source: mark blocked, stop.
- Before finishing, append process insights (sources found, dead ends, quirks, methods, effort, gaps) to `Spreadsheets/19-process-insights.csv` (see `heavymap-planning/PROCESS-INSIGHTS.md`).
- Cite the Linear slice issue (`NA-…`) in the PR. Agents never merge.
