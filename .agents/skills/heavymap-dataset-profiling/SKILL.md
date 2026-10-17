---
name: heavymap-dataset-profiling
description: Use when discovering, profiling or harmonizing a jurisdiction's datasets for HeavyMap (service profile, layer profile, quirks log, spine-join test). Not for publishing or MCS edits.
---

# HeavyMap dataset profiling

Pointer only. The routine is still being decided: follow `heavymap-planning/DATASET-ROUTINE.md` (DRAFT; the doc wins) and the fuller draft skill in `heavymap-planning/drafts/dataset-routine-SKILL.md`. When that draft is registered, this file should be replaced by it.

- Sheets: `Spreadsheets/16-service-profile.csv`, `17-layer-profile.csv`, `18-quirks-log.csv`; baseline `15-pilot-join-matrix-welland-rochester.csv`.
- Pulled data goes to git-ignored `local-data/` only. In a cloud agent it is lost when the VM ends: record facts (counts, id quirks, CRS, encoding), never the rows.
- Owner fields: names only (D-13). MPAC `not_licensed`. NPCA-derived: note, don't ingest. Gated source: mark blocked, stop.
- Cite the Linear slice issue (`NIA-…`) in the PR. Agents never merge.
