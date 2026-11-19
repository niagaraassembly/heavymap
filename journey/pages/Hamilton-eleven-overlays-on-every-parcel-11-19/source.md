---
type: stage-report
stage: E
run: CR-001
place: ca-on-3525005-hamilton
place_type: city
country: ca
subdivision: on
city: hamilton
method: pre-method
evidence_date: 2026-10-18
---
Hamilton: eleven overlays on every parcel
expansion, hamilton, overlays, planning, run-1

> Zoning, plans, protected land and regulated areas all live in separate layers. We cut each one to the city and measured how much of every parcel it covers.

## The layers
Each layer was pulled with all its fields, clipped to the City boundary, and repaired where the geometry was invalid:

- Greenbelt designation (provincial)
- Niagara Escarpment Plan designations and plan boundary (provincial)
- Niagara Escarpment development control (City)
- Hamilton Conservation Authority regulated areas
- Niagara Peninsula Conservation Authority approximate regulation lands
- Secondary plan land use: 47,206 polygons
- Employment lands: 22 areas covering 48.5 square kilometres
- Urban boundary and rural boundary
- Parks

## How a parcel gets linked
For every parcel and every overlay we measure the share of the parcel's area that the overlay covers. That gave **644,398 parcel-to-feature links**, about 3.9 per parcel.

## Slivers
150,610 of those links are slivers: tiny overlaps where two layers drawn by different hands do not quite line up. They are flagged and kept, never dropped. A reader can see that a parcel touches a regulated area by a few square metres, and judge that for themselves.

## The checks
A beta gate agreed on 18 October sets the checks every city must pass, with thresholds written down: one-to-one parcel matching, overlap quality, unmatched counts, placeholders, coverage, offset, identifier stability, overlay coverage, slivers, address and building linkage, and row-count drift between pulls. The same checks apply to every jurisdiction. Only the thresholds may differ, and any difference is recorded.

## What came next
The same night the first local map tiles were built from these layers, and tested for loading parcel by parcel from static files.
