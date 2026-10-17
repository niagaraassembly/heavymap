# Focus: City of Hamilton (first illuminated geography)

**Purpose.** A working view of everything HeavyMap knows about Hamilton, kept in one place while Hamilton is the active pilot.

**Not the source of truth.** Every file here is regenerated from the main files: catalog `Spreadsheets/09-…xlsx`, the MCS on `~/na/`, the sheets 14–18 drafts and the planning docs. Edit those, not these. Regenerate when they change.

**Lifecycle.** This folder is archived when Hamilton graduates (passes its gates and is promoted). New insights go to `INSIGHTS.md`.

## Files
- `hamilton-datasets.csv`: 369 rows. All catalog rows touching Hamilton (city plus Ontario- and Canada-wide), plus sources the web check found missing. Excludes `reviewed_not_relevant`. Generated from the 2026-10-16 coverage research (`hamilton-dataset-coverage.csv`).
- `hamilton-datasets-not-relevant.csv`: the 237 `reviewed_not_relevant` rows, kept separately.
- `mpac-data-inventory.csv`: MPAC data held versus only identified (2026-10-17).
- `MPAC-NPCA-FINDINGS.md`: MPAC findings and the NPCA Assessment Parcels pull for Hamilton (2026-10-17).
- `SPINE-BASE-PULL-2026-10-17.md`: Tier 0/1 pull, layer profiles, first spine check and ID registry next steps (2026-10-17).
- ID registry (not in this folder): `docs/architecture/adr/0003-heavymap-id-format.md`, `docs/architecture/heavymap-id-registry.md`, code in `heavymap/ids/`.
- `INSIGHTS.md`: one line per insight, in the form `date | source | band/view | insight`.
- Decisions: `DECISIONS.md` (firm/provisional log). Insights: `INSIGHTS.md`.
