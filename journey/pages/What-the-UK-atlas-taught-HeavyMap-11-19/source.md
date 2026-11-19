---
type: origin
evidence_date: 2026-11-18
---
What the UK atlas taught HeavyMap
origins, uk, lessons, prior-art

> We went through the UK atlas module by module and asked what each one would look like with North American public data. Some ideas carried over directly. Some had no equivalent at all.

## Evidence instead of scores
The UK atlas ranked places with one opportunity score. HeavyMap does not. Each parcel gets a profile that states what is known, where it came from, and what is not known. A reader can follow the argument rather than trust a number.

## OpenStreetMap as a base, not an inventory
Live OpenStreetMap queries were the whole of the UK atlas. In HeavyMap they are a shared background. Once a city publishes authoritative layers for parcels, zoning and buildings, those come first.

## One module per source
Each UK data source had its own small module that fetched, cleaned and drew it. That pattern carried straight into how HeavyMap prepares each dataset: one routine per layer, with its own profile and quirks.

## The analogues we went looking for
- **Company registers.** The UK panel searched a national company register. In Ontario and New York the closest open equivalents are business inventories such as Niagara's employment inventory and municipal business directories.
- **Rating records.** The UK's non-domestic ratings had no open twin in Ontario, where assessment data is held by a provincial corporation and sold. New York's statewide tax parcels, with assessed values, came closest.
- **The gap finder.** Comparing a business register with mapped industrial land became a general idea: two registers that should agree, measured where they do not. In Welland, the business directory and the regional inventory disagree by about 29 percent.
- **Heritage, planning and permits.** Each has local equivalents, scattered across municipal, regional and provincial publishers.

## What did not carry over
UK geography itself. HeavyMap does not ingest UK data. The atlas lives on as prior art: a record of what was tried, what worked and what readers asked for.
