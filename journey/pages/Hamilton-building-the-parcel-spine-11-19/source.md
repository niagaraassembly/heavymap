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
evidence_date: 2026-10-17
---
Hamilton: building the parcel spine
expansion, hamilton, parcels, spine, run-1

> Every fact on the map hangs from a parcel. Hamilton's parcels came with no identifier, so we had to make one that lasts.

## The problem
The City publishes 166,828 parcel polygons with nothing to identify them except a row number that can change on any update. Hamilton does not publish assessment roll numbers, property classes or assessed values. In Ontario those belong to the provincial assessment corporation and are sold, not published.

## The fix
- **Identifiers minted from the parcels themselves.** Each parcel gets a stable, opaque HeavyMap identifier, kept in a registry. When the City updates its parcels, the registry records what was kept, split, merged, replaced or retired. On an unchanged input every identifier must survive.
- **Roll numbers where they exist.** The Niagara Peninsula Conservation Authority publishes assessment parcels with 15-digit roll numbers for its watershed: 90,306 parcels covering 36.2 percent of Hamilton by area. Matching them to City parcels by a point inside each shape, in both directions, gave 90,102 one-to-one pairs, a 99.77 percent rate. The shapes agree almost exactly: in 90 percent of pairs the overlap is better than 0.999.
- **A measured offset.** The two parcel sets are shifted against each other by a small, consistent distance. We measure it on every pull and the build fails if it moves.

## What hangs from the spine
274,725 address points and 214,292 building footprints were pulled the same day. In the registry, 273,955 addresses and 214,287 buildings are linked to parcels. About a million features were pulled in under six minutes.

## What is not covered
74,276 parcels lie outside the conservation authority's watershed, so they have no roll number from that source. They are labelled "not in coverage", tied to the dataset that defines the coverage. Ten roll numbers are placeholders made of zeros. They are flagged, not treated as real links.

## The rule underneath
"Reconciled" means observed and labelled, not made clean. Every conflict, gap and sliver is counted and labelled. Nothing is removed to make the data look tidier.
