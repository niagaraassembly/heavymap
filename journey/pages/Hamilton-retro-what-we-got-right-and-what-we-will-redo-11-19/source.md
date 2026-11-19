---
type: retro
stage: G
run: CR-001
place: ca-on-3525005-hamilton
place_type: city
country: ca
subdivision: on
city: hamilton
method: pre-method
evidence_date: 2026-11-18
---
Hamilton retro: what we got right and what we will redo
expansion, hamilton, retro, lessons, run-1

> Hamilton was mapped before we had a method. Looking back, most of what we missed came from looking in one place.

## What worked
- **A spine first.** Minting stable identifiers before joining anything meant every later layer had somewhere solid to attach.
- **Labels instead of cleaning.** Slivers, placeholders and gaps were counted and shown, not hidden.
- **Small, fixed releases.** Every published file has a hash and never changes, so any view can be traced to its exact data.

## What we missed
- **Catalogue search is not enough.** The parcel layer we built on was missing from the catalogue. A second, independent sweep would have found it at once.
- **Licences came late.** Most admitted layers still had unclear licence status when they reached the map.
- **Infrastructure stopped at the city line.** Our freight pass found the City's layers and nothing from the port, railways, utilities or the province.
- **Layer numbers drift.** The positions of layers inside a map service change over time. We now record each service and layer by name, and re-check them.

## What changes
- Two independent sweeps for every city, with an estimate of how much is still hidden.
- Licences swept before profiling.
- The infrastructure family swept across every tier and every special-purpose body.
- Predictions written down before any search, then scored, so the method learns from each city.

## Returning to Hamilton
We will return to Hamilton for its port lands and terminals, rail sidings, yards and intermodal sites, provincial highways and truck routes, pipelines, power transmission and substations, gas, airport cargo, and warehousing.
