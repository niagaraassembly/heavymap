# ADR 0001 — OSM as map substrate

**Status:** accepted, 2026-09-23. Linear **NIA-17**. Docs only.

Year-0 map floor for HeavyMap. Planning already agreed this. The record locks it. It does not implement a map.

## Context

The product frame is the four concepts in [docs/architecture/](../README.md):

| Concept | Document |
|---|---|
| Parcel Identity Spine | [parcel-identity-spine.md](../parcel-identity-spine.md) |
| Context Band Ladder | [context-band-ladder.md](../context-band-ladder.md) |
| Parcel Context Display Protocol (PCDP) | [PCDP.md](../PCDP.md) |
| Claim & Refusal Contract | [claim-refusal-contract.md](../claim-refusal-contract.md) |

That frame says what a unit is, which bands it may carry, how it is presented, and when a statement is a stamped claim or a named refusal. A viewer still needs a visual floor under an outline or a point: roads, water, and place names. Planning locked that floor as configurable map tiles.

The UK atlas (`babbworks/atlas`) is the baseline reference for a live OSM map. [`first-attempts/niagara-atlas/README.md`](../../../first-attempts/niagara-atlas/README.md) describes it as a Leaflet + OSM application, and [`first-attempts/niagara-atlas/map.js`](../../../first-attempts/niagara-atlas/map.js) keeps the same habit: a tile URL, requested for the view, with OpenStreetMap attribution. Learn that pattern. The product root stays the top of this repository. UK code and UK geography stay out of product paths.

Parcel intelligence is a separate store. It comes from licensed and open municipal and industrial sources, joined on the Spine and registered in the Master Control Spreadsheet (MCS).

Spine geometry and the tile floor need one shared coordinate reference so a unit can be drawn on the substrate. This note names that **shared CRS floor**. The EPSG table is a follow-up.

## Decision

1. **Tiles.** Year-0 uses a configurable OpenStreetMap tile endpoint, or an equivalent service, as the visual substrate. The endpoint is configuration.
2. **Corpus.** HeavyMap does not bulk-download or prefetch OSM, and does not scrape OSM features into the parcel or intelligence database.
3. **Intelligence.** Bands on a spine unit are filled from licensed and open municipal and industrial sources through the Spine and MCS.
4. **CRS.** The map and the spine share a CRS floor. This ADR does not choose EPSG codes.

OSM is not an MCS dataset row for parcel intelligence. No `dataset_id` is created or edited here.

## Consequences

- **No bulk OSM prefetch.** There is no Overpass extract, no committed OSM feature cache, and no stored OSM tile pyramid treated as HeavyMap’s land database. When a map exists, tiles are requested for the current view.
- Swapping the tile URL later leaves the Spine, the ladder, PCDP, and the Claim & Refusal Contract unchanged. The substrate sits under presentation. It is neither a ladder band nor a claim.
- Tile labels and outlines are display. A statement about a unit still needs an evidence grade and a source stamp from a joined municipal or industrial source.
- D-5’s `tile` disposition stays available for datasets HeavyMap holds. It does not admit OSM as the intelligence corpus.
- The shared CRS floor is a requirement. The EPSG table waits for a follow-up.
- MCS is unchanged.

## Non-goals

This record does not implement Leaflet or other map chrome, choose a commercial tiles vendor, fetch municipal data, edit MCS, do UK basemap work, or publish a site.
