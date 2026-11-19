---
type: system
status: in use
place: ca-on-3525005-hamilton
place_type: city
country: ca
subdivision: on
city: hamilton
evidence_date: 2026-11-16
---
Drawing 166,745 parcels from static files
systems, map, tiles, hamilton, building

> Status: in use. The Hamilton map has no map server. Everything comes from static files, measured before we chose how to cut them.

## What we measured
We built the parcel tiles two ways and weighed the downtown tile at each zoom level.
- **Zoom 12 to 15, dropping parcels where they are dense:** 21.4 MB in all. The downtown tile weighed 450 KB at zoom 12, with 17,399 parcels in it.
- **Zoom 14 to 16, dropping nothing:** 23.4 MB in all. The downtown tile weighed 121 KB at zoom 14 and 4 KB at zoom 16.

Stripping the tiles down to just the parcel key barely helped. Properties were about 15 percent of the old file. Geometry is the cost.

## What we chose
- A still image of the lower city and harbourfront paints first, and stays as the fallback.
- Parcel outlines from zoom 14 to 16, every parcel kept, carrying only its key. No parcel selection below zoom 14, and the map says so.
- A self-hosted vector basemap from an OpenStreetMap extract, in light and dark. No dependence on third-party tile services.

## Facts on demand
A parcel's facts are not in the tiles. Selecting a parcel loads its record from small files split by the end of its key. A thousand-odd shards keep each request small.

## A lesson from hosting
One host compressed the tile archive on the fly for some browsers, then applied byte ranges to the compressed bytes, which breaks how tile archives are read. We record that kind of behaviour as a quirk before choosing where to host.
