---
type: origin
place_type: region
country: ca
subdivision: on
evidence_date: 2026-08-28
---
The first Hamilton–Niagara atlas
origins, hamilton, niagara, prior-art

> In August 2026 we set out to map the physical industrial economy of Hamilton and the Niagara Peninsula. We built the foundations and stopped before drawing a single map.

## The question
Not "where are the businesses?" but "what does the physical industrial economy of Hamilton–Niagara actually look like?" Where things are made, repaired, stored and moved, and how rail, road, port and land fit together.

## What the reconnaissance found
- The twelve Niagara municipalities do not run twelve portals. Most publish through one shared catalogue: 11 organizations and 534 datasets.
- The City of Niagara Falls published more open data than the Region itself: 329 datasets against 99.
- St. Catharines was parcel-complete: 44,265 parcels, with 498 designated for employment.
- Welland's own hub listed about four times as many datasets as the shared catalogue.
- Hamilton published 463 datasets, 214,293 buildings and 11,931 zoning polygons, but no business inventory. Niagara published 98,065 business records.

That last point shaped everything. Niagara could be mapped business by business, Hamilton only by land and buildings. A map that hid this would make Hamilton look less industrial than it is.

## What got built
Every source was checked against its live endpoint, with counts, fields and licences. Hamilton and Niagara parcels, buildings, addresses and business records were cached and normalised into one unit index: 445,075 parcels, building footprints and address points, each carrying where it came from.

## The rules
- Never fabricate data. A gap is shown as a gap.
- Never assume a business is still operating because an old list names it.
- Provenance travels with every feature.
- Observation and inference are different kinds of claim.
- Respect licences, rate limits and robots rules.

## Two mistakes caught in time
A technical report on parcel profiles was checked before it was committed. It had stated figures more precisely than the sources allowed, and it had folded three jurisdictions into one. Both were corrected. The habit of checking every cited figure against its source stayed.

## Why it stopped
On 28 August the work was paused at a clean boundary, to write down the general principles it was producing. Three weeks later it restarted as HeavyMap, with Hamilton as the first city.
