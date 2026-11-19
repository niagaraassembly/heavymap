---
run: CR-001
place: ca-on-3525005-hamilton
place_type: city
country: ca
subdivision: on
city: hamilton
type: working-paper
evidence_date: 2026-11-16
---
Tile source options for the v1 Hamilton map (2026-11-16)
working-paper, hamilton, map, tiles, run-1

> A working paper written on 2026-11-16, published nearly as written. Local file paths, private repository names and personal names have been removed.

Status: review with measurements and a recommendation. The decision is yours (proposed as D-070). Measurements were taken on 2026-11-16 from the 2026-10-17 Hamilton data.

## What v1 needs
A viewer opens the Hamilton map, sees where things are, clicks a parcel, and gets its dossier (selection feedback within 100 ms, D-068). The map must work from static files, show where its background came from, and let a viewer know why a parcel cannot be selected. Parcel tiles carry the record key only (contract CN-03).

## What we have
| Asset | State |
|---|---|
| Still render of the lower city and harbourfront (decision 67): two WebP images (2000x1250 and 900x1100) with a provenance record | Exists and is live in the site. Cannot select a parcel. Source: Protomaps build 20261109 of OpenStreetMap. |
| `parcels.pmtiles` (2026-10-17) | 25.3 MB, zoom 12 to 15, 2,216 tiles. Properties: `heavymap_id` (old name), `arn`, `arn_all`, `arn_count`, `arn_grade`, `area_m2`. Stale: old id field and more properties than the contract allows. |
| `zoning.pmtiles` 7.9 MB, `buildings.pmtiles` 29.9 MB, `nature-frame.pmtiles` 0.7 MB | Exist. Not in the v1 contract. |
| Tooling | tippecanoe 2.53, go-pmtiles 1.31, MapLibre and the `pmtiles` JS package are already in the site. `scripts/tiles/` rebuilds from source GeoJSON and the registry. |

## Measurements
| Build (key-only, 166,745 parcels) | File | Downtown tile at z12 / z13 / z14 / z15 / z16 (gzipped) | Features in that tile |
|---|---|---|---|
| Existing options, z12 to z15, parcels dropped when dense | 21.4 MB | 450 KB / 444 KB / 121 KB / 26 KB / n/a | 17,399 / 16,071 / 3,852 / 704 |
| z14 to z16, nothing dropped | 23.4 MB | n/a / n/a / 121 KB / 26 KB / 4 KB | 3,852 / 704 / 86 |

1. **Key-only barely shrinks the tiles.** Properties were about 15% of the old file. Geometry is the cost.
2. **Parcels are dropped at z12 and z13.** tippecanoe reported keeping "the sparsest 65.85%" of features. The z14 tile holds 3,852 parcels in both builds, so z14 and above are complete. Clicking at z12 or z13 would miss parcels without saying so.
3. **A z12 tile is 450 KB**, large for first interaction. At z14 it is 121 KB.
4. **The basemap source is not re-fetchable.** An extract from Protomaps build 20261109 returned HTTP 404 on 2026-11-16; daily builds are not kept. The still render's provenance record points at a source that no longer exists, so any basemap must be archived by us (D-033) at the time it is taken.

## Options
| | A. Still render only | B. Vector parcel tiles, own data | C. B plus self-hosted vector basemap | D. Third-party hosted tiles |
|---|---|---|---|---|
| What the viewer gets | A fixed picture of the lower city | Pan, zoom and click any parcel in Hamilton, on a plain background | The same on a background with roads, water and labels | The same as C |
| Parcel selection | No | Yes, from z14 | Yes, from z14 | Yes |
| Size to ship | 2 images, small (live) | 23 MB PMTiles (z14 to z16) | B plus an extract of tens of MB (estimate; not measured because the source 404s) | Parcel file only |
| Static hosting | Yes | Yes (range requests) | Yes | Depends on someone else |
| Provenance and archive | Source no longer fetchable | Ours, fully recorded | Archive the extract when taken | No archive; terms may change |
| Risk | Not "the actual map" | No context around the parcels; low zoom | Larger payload; basemap and parcel alignment | A dependency we do not control; conflicts with D-033 and our transparency principle |
| Effort | Done | Small (rebuild with the contract schema) | Medium (extract, archive, style) | Small, and we should not choose it |

## Recommendation
**Do B now and C next; keep A as the first paint. Do not use D.**

1. **Keep the still render** as the instant first paint and as the fallback when tiles fail (contract failure table). Record its dead source URL in its provenance file.
2. **Build parcel tiles from the migrated ia runs** with the key as the only property, zoom 14 to 16, nothing dropped (23.4 MB; the build takes about 30 seconds). Drop `arn` and the other properties; the shard has them.
3. **Below z14, do not offer parcel selection.** Show the zoning and nature tiles we already have (they carry no parcel-level selection) and a plain message: "Zoom in to select a parcel". Wording goes to the label register. This is honest about why a click does nothing.
4. **Add the basemap (C) before launch if time allows**, taken from a current Protomaps build and archived in `industrial-atlas-data` with its date, licence (ODbL attribution) and checksum the day it is extracted. Without it the map is parcels on a blank ground, which is workable for a first release but weak for orientation.
5. **Hosting:** put tiles in `industrial-atlas-data` under the release, listed in `files.json` with their hashes. 23 MB per tile build is fine for a handful of releases in git; revisit if releases become frequent.

## Current status (2026-11-16)

the owner affirmed D-070: keep the still render as first paint/fallback; use key-only parcel tiles at z14–16 with no parcels dropped; begin selection at z14; add a self-hosted basemap next. The parcel release and tile manifest are live on `industrial-atlas-data` (`ca-on-hamilton/2026-11-16-d070`); HeavyMap parcel clicks are live.

The required Protomaps extract has been archived locally on deb at a local working copy (25,368,361 bytes; SHA-256 `38d2d0e13e62… (SHA-256, shortened)`) with `PROVENANCE.md`. It is not yet in `industrial-atlas-data`; style comparison and release packaging remain (BL-114, BL-116).

## Next work

- Compare light and high-contrast dark treatments; the latter is captured separately in EX-062.
- Transfer the archive to the data-repo work area before continuing on another machine, or fetch a fresh dated extract and record its provenance.
- Package the archive and self-hosted style assets in a versioned data release, preserving ODbL attribution.
- Keep the still render as first paint/fallback and wire the basemap into HeavyMap after release packaging.
- Refine the low-zoom prompt and test selection latency on a mid-range phone (BL-089).
- Building tiles remain out of the current contract; revisit only if they are added to scope.
