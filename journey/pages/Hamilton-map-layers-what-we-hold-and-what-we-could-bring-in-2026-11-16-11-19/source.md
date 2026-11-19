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
Hamilton map layers: what we hold and what we could bring in (2026-11-16)
working-paper, hamilton, map, layers, run-1

> A working paper written on 2026-11-16, published nearly as written. Local file paths, private repository names and personal names have been removed.

Purpose: ground the redesign of the map's layers panel in the data that exists. Sources read: `heavymap/Spreadsheets/02-dataset-inventory-v4.csv` (control sheet), `09-per-jurisdiction-dataset-catalog-counties.csv` (Hamilton catalogue), the overlay run manifest a local working copy, and the pulls and tiles under a local working copy on deb. Nothing was pulled or changed for this note.

## Numbers
- 480 datasets are catalogued for the City of Hamilton. Reviewed: 228 not relevant, 106 context only, 27 unclear, 119 relevant (of which 23 are admitted to the control sheet and 7 curated).
- 55 control-sheet rows touch Hamilton or Ontario. All are marked `publish_visibility = public`. **Licence clearance is recorded as "unclear" for 43 of the 55**; that column needs filling before a layer is shown (record the licence for provenance even where a hard rule already permits publication).
- 11 layers are already joined to all 166,745 parcels (the overlay run). Their facts are in the dossier today; none is drawn on the map.

## Tier 1: on the map now
| Layer | State |
|---|---|
| Parcels (166,745; key only; zoom 14 to 16) | Live |
| Street basemap (OpenStreetMap via Protomaps, light and dark) | Built on branch `web/hamilton-basemap`; archive not yet published |

## Tier 2: held, verified and already joined to parcels (geometry on disk; cheapest to draw)
| Layer | Source | Features | Group |
|---|---|---|---|
| Zoning by-law boundary | City of Hamilton | 11,860 | Planning |
| Secondary plan land use | City of Hamilton | 47,206 | Planning |
| Urban boundary | City of Hamilton | 1 | Planning |
| Rural boundary | City of Hamilton | 1 | Planning |
| Employment lands | City of Hamilton | 22 | Planning |
| Niagara Escarpment development control | City of Hamilton | 1 | Protected and regulated |
| Greenbelt designation | Ontario (LIO) | 9 | Protected and regulated |
| Niagara Escarpment Plan designation | Ontario (LIO) | 115 | Protected and regulated |
| HCA regulated areas | Hamilton Conservation Authority | 134 | Protected and regulated |
| NPCA approximate regulation lands | Niagara Peninsula CA | 271 | Protected and regulated |
| GRCA regulation limits | Grand River CA | 199 | Protected and regulated |

## Tier 3: pulled and on disk, not joined and not drawn
| Layer | Note |
|---|---|
| Buildings (City) | 108 MB source; an older 28.5 MB tile file exists (2026-10-17, old id field) |
| Addresses (City) | 129 MB of points; already used for the dossier's address list |
| Street centreline (City) | Superseded for display by the basemap; useful for address search |
| Parks (City) | Small; allowlist entry `nature-parks` already exists |
| Community boundaries, city boundary (City); municipal boundary (LIO) | Small; good for orientation and search |
| Niagara Escarpment Plan boundary (LIO) | Small |
| HCA managed forest 2017 | Small |
| Surface water quality (City) | Monitoring points |
| Waste collection by address (City) | Low value for this product |
| Older tiles: `zoning.pmtiles` 7.6 MB, `nature-frame.pmtiles` 0.7 MB | Built 2026-10-17 on the old schema; rebuild rather than reuse |

## Tier 4: admitted to the control sheet, not yet pulled
Most relevant to industrial land and investment:
- **Movement:** Hamilton railways; truck route network; trails; MTO controlled areas.
- **Activity on land:** development applications; building and demolition permits (2008 to present); vacant building registry; city-owned properties; licence registers (salvage yards, public garages, trades); businesses by employee count.
- **Planning:** existing land use primary blocks; Provincially Significant Employment Zones; older zoning (pre-rural).
- **Environment:** wetlands (City and provincial); natural heritage system; areas of natural and scientific interest; wooded areas; provincial parks; subwatersheds; conservation authority areas; NPCA regulated floodplain; Conservation Halton regulation limit; contours.
- **Infrastructure:** wastewater and combined-sewer catchments with water pressure districts.
- **Link only (not shipped):** Ontario brownfields environmental site registry.
- **OpenStreetMap themes already committed thin:** industrial land, rail corridors, brownfield and disused sites, industrial facilities.

## Tier 5: catalogued as relevant, not yet admitted
Business improvement areas; community improvement project areas; heritage properties; environmentally sensitive areas; rural settlement areas; airport; landfills and transfer stations; air monitoring sites; cooling towers; real estate sales; growth targets; the "SiteSelector" service. Water and sewer network layers (mains, valves, nodes, lift stations) are catalogued but flagged `infrastructure_ownership_attribute` and should stay out until reviewed.

## What stands between the data and the map
1. **Tile contract.** A release carries one tileset (`tiles-manifest.json` is singular) and the prepublish allowlist permits only `key` on parcel features. The allowlist already has entries for `buildings`, `nature-parks`, `nature-greenbelt` and `nature-conservation`, so more layers were anticipated; the manifest and layer catalogue need to carry several tilesets.
2. **Properties per layer.** Each thematic layer needs a short allowlist (for zoning: the zone code; for land use: the class) and label register entries for its classes.
3. **Licences.** Fill the 43 "unclear" clearances for whatever is chosen.
4. **Size.** Tier 2 is small except secondary plan land use and zoning; buildings is the heavy one (about 28 MB as tiles).

## Suggested waves
- **Wave 1 (no new pulls):** zoning, secondary plan land use, urban boundary, employment lands, Greenbelt, Niagara Escarpment Plan, conservation authority regulated areas (three sources shown as one group), parks.
- **Wave 2 (new pulls, high value for industrial readers):** railways, truck routes, Provincially Significant Employment Zones, development applications, building permits, vacant building registry, licensed salvage yards and garages, wetlands and natural heritage.
- **Wave 3:** buildings, existing land use, infrastructure catchments, business counts, heritage, improvement areas.

## Implication for the layers panel
The panel should be organised by theme, not as a flat list, and should be honest about state: **on the map**, **held (can be switched on once tiled)**, **planned**. Proposed groups: Base map (style), Parcels, Planning, Protected and regulated, Movement, Activity on land, Built form, Environment. Each layer row needs its source, date and a legend; a layer with classes (zoning, land use) needs a class legend that can be filtered.
