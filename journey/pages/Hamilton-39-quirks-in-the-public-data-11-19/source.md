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
Hamilton: 39 quirks in the public data
expansion, hamilton, quirks, data-quality, run-1

> Every layer we profiled had something odd about it. We wrote down 39 of them, each with a count and what we do about it.

## Kinds of quirk
- **No stable identifier** on parcels, addresses and secondary plans. We mint our own.
- **Geometry problems:** stacked duplicate parcels, invalid shapes as served (205 of 271 rows in one regulated-areas layer), rows with no geometry at all.
- **Two maps that do not quite line up:** a consistent shift of about one metre between two parcel layers.
- **Fields that mean something else:** a field called "full street" that holds the street number; a layer titled "heavy truck traffic route" that holds all-vehicle counts.
- **Conventions:** blanks stored as a single space; yes and no stored as -1 and 0; dates stored as text; heights printed as 3.8000000000000003.
- **Stale or constant values:** a version field that is 0 on every row; metadata describing a plan two updates old.
- **Codes nobody has defined for us yet:** restriction and load codes on road layers. We show them marked "meaning not yet confirmed" and have asked the City.
- **Personal and business identifiers** in public layers: staff account names, company names, private rail spur names. These are screened at the point of publishing.

## Why write them down
A quirk found once and fixed silently will be found again by the next person, or the next city. Each one has a handling rule, so the fix is the same every time the layer is pulled. The short field notes in this section tell some of them one at a time.
