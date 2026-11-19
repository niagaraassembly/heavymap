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
evidence_date: 2026-11-17
---
Hamilton: ranking building footprints within parcels
expansion, hamilton, buildings, parcels, run-1

> Which is the biggest building on this parcel, and does it cross the line? Simple questions, with careful answers.

## The method
Each of the City's building footprints is assigned to the parcel it overlaps most. Exact ties go to a fixed order, so the result is the same every time. Within each parcel, buildings are numbered from the largest footprint down.

## The numbers
- **259,407 positive overlaps** between buildings and parcels, all kept in an overlap table.
- **383 footprints** touch no parcel at all, and are listed rather than dropped.
- 21,307 footprints overlap two or more parcels by more than a square metre.

## What the area means
Footprint area is the plan-view area of the outline. It supports filtering by size. It is not floor area, height, occupancy or current use, and the map does not call it any of those.

## On the map
Ranked buildings show on the Hamilton map with their area, their rank within the parcel and their distance from the parcel edge. Each parcel's building facts load on demand, in small files split by the end of the parcel's identifier.
