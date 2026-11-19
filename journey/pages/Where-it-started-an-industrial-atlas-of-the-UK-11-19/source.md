---
type: origin
place_type: country
evidence_date: 2026-11-18
---
Where it started: an industrial atlas of the UK
origins, uk, openstreetmap, prior-art

> Before HeavyMap there was a small map for finding workshops, factories and productive land in Britain. It taught us what a map of industry has to do.

## What it was
Industrial Atlas UK was a single-page web map. Most maps are built for navigation, shopping and tourism. This one was built for people who make things: manufacturers looking for space, researchers studying productive land, economic development staff and planners.

It ran entirely in the browser. There was no server, no database and no account. It asked OpenStreetMap, through the Overpass API, for industrial buildings, industrial land, craft workshops and railway arches inside the current view, and drew the results as clustered points and outlines.

## What it could do
- Thirteen filters across buildings, land use, crafts and lifecycle tags such as disused or abandoned.
- A simple opportunity score built only from OpenStreetMap tags and nearby context.
- Draw a box and get a summary of what is inside it.
- Share a view as a link: position, zoom and filters all lived in the address.
- Export a postcard image of the current view.
- Quick jumps to well-known industrial districts.

Later modules reached past OpenStreetMap: a company register panel, non-domestic rating records with a "gap finder" that compared them with mapped industrial buildings, environmental permits, food business registrations, planning designations and hand-drawn strategy zones.

## What it could not do
OpenStreetMap's industrial coverage was patchy outside London, Birmingham, Sheffield and Manchester. It had nothing on ownership or tenancy, and no history of changes of use. A score built from map tags could look precise while resting on whatever volunteers happened to have mapped.

## Why it matters now
The UK atlas showed that people want this kind of map, and that a map built only from crowd-sourced tags cannot carry the weight. HeavyMap keeps OpenStreetMap as a shared base, but builds on authoritative public datasets, and shows its evidence instead of a single score. The UK data files were removed in October; the code and notes remain as a reference.
