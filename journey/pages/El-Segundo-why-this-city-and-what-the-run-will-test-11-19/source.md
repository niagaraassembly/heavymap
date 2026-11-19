---
run: CR-002
place: us-ca-el-segundo
place_type: city
country: us
subdivision: ca
county: los-angeles
city: el-segundo
method: 0.1
stage: A
type: working-paper
evidence_date: 2026-11-18
---
El Segundo: why this city, and what the run will test
working-paper, el-segundo, los-angeles-county, run-2

> The place file for HeavyMap's second city run, published as written when the run opened on 18 November 2026.

**Place id:** `us-ca-el-segundo` (provisional until the Geographical Register has a municipality tier; register change RC-009). Parent: Los Angeles County, FIPS 06037. El Segundo's own place code is to be read from the Census gazetteer.

**Why El Segundo.** A small coastal city of about 14 square kilometres in Los Angeles County, beside Los Angeles International Airport, with a large oil refinery and a long aerospace history. It is HeavyMap's first city outside Ontario and New York, and the first test of the public data discovery method (v0.1) from the start.

**Scanning status.** Registered for Industrial Atlas scanning. Desk status: no (not a MAKE news region), per D-085.

**What this folder holds.** Lasting knowledge about the place (this README, publishers, join graph, insights) at the top; each run in `runs/`.

## Runs

| Run | Started | Method | Status | Folder |
|---|---|---|---|---|
| CR-002 | 2026-11-18 | v0.1 | Stage A in progress | `runs/CR-002-2026-11-18-public-data-run/` |

## Run goals beyond the method

1. **County narrowing.** Most data for El Segundo is likely held by Los Angeles County. For every county dataset, record whether it can be narrowed to the city at the source (by an attribute filter, a spatial filter, both, or not at all), how many records the city slice has against the whole, and whether an attribute filter and a spatial filter agree. Lessons from this decide when to pull a county dataset whole.
2. **Infrastructure across every tier.** Port, rail operators, state highways, airport, pipelines and utilities are swept from the start (lesson LL-004), not only the city's own layers.
3. **Working papers in public.** Every working document of this run is published on the HeavyMap Journey nearly as written, after the hold check.
