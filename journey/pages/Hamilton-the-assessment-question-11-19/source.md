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
Hamilton: the assessment question
expansion, hamilton, assessment, parcels, run-1

> Who owns a parcel, how it is classed and what it is worth are the facts people ask for first. In Ontario they are the hardest to get.

## Where the facts live
Ontario's property assessment is held by a provincial corporation, which sells its data. The City of Hamilton's parcel layer is geometry only: no roll number, no property class, no assessed value.

## What is public
The Niagara Peninsula Conservation Authority publishes parcel layers for its watershed with assessment roll numbers. They cover about 36 percent of Hamilton by area. The north and west of the city are outside the watershed and have none.

## What we found in them
- **No tax class.** One field looked like a class but holds the taxing municipality.
- **Property codes on 1,628 of 81,121 rows**, last edited in 2020, and sometimes at odds with current zoning.
- **Postal codes empty on every row.**
- **Ten placeholder roll numbers** made of zeros, and one from a neighbouring town.
- **An owner-name field and a legal-description field** on one layer. We record that the fields exist. Their values are withheld from public view, and none appear anywhere we publish.

## How we use them
Roll numbers attach to the City's parcels as attributes, never as the key. One roll number can sit on up to 49 polygons, typically condominiums. Every gap above is written into a ledger with its count, so the map can say "not in coverage" or "not published" instead of leaving a blank.
