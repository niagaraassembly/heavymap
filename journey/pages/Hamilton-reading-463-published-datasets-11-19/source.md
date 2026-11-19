---
type: stage-report
stage: C
run: CR-001
place: ca-on-3525005-hamilton
place_type: city
country: ca
subdivision: on
city: hamilton
method: pre-method
evidence_date: 2026-10-17
---
Hamilton: reading 463 published datasets
expansion, hamilton, catalogue, run-1

> Hamilton publishes hundreds of datasets. About 300 turned out to be usable layers, and the one we needed most was not in the catalogue at all.

## The first sweep
On 23 August 2026 we read the City of Hamilton's whole open data catalogue: 463 datasets, 336 of them with a live map service behind them. Licences were mostly clear at the catalogue level: 391 datasets under the City of Hamilton Open Data Licence, 68 with none stated. The catalogue's theme field was no help as a taxonomy. Almost everything was simply "geospatial".

## Coverage, row by row
In October a coverage study pulled together every catalogue row touching Hamilton, including Ontario-wide and Canada-wide layers: 606 rows. Then each was screened.
- 237 were not relevant to industrial land and were set aside, but kept.
- A web check found 27 more that the catalogues had missed.
- 19 were duplicates, 62 were viewers, PDFs or web pages with no data behind them, and 11 belonged to other places.
- That left **304 usable Hamilton data layers**.

## Sorting by what each layer can join to
We grouped the layers by the role they play in connecting data to parcels:

- **Tier 0, the base (9 rows).** Parcels, addresses, buildings, the city boundary.
- **Tier 1, joins by identifier (4 rows).** Almost empty, because Hamilton publishes no shared parcel identifier.
- **Tier 2, joins by location (81 rows).** Zoning, plans, regulated areas.
- **Tier 3, context to display (76 rows).**
- **Tier 4, registers without geometry (19 rows).** Matched by address.
- **Tier 5, statistics (134 rows).** Area-level figures, not parcel-level.

## What we learned
- **The catalogue is not the whole publisher.** The City's assessment parcel layer, the base of everything that followed, was found by a web check, not by searching the catalogue. Every city run now uses two independent sweeps.
- **Licences need checking early.** Catalogue-level licences looked tidy, but when we later listed the layers on the map, 43 of 55 still had an unclear licence for the specific use. We now sweep licences before profiling.
- **Zero is a result.** A missing business register or parcel identifier is a finding about the city, and it is written down as one.
