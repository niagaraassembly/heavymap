---
type: stage-report
stage: F
run: CR-001
place: ca-on-3525005-hamilton
place_type: city
country: ca
subdivision: on
city: hamilton
method: pre-method
evidence_date: 2026-10-18
---
Hamilton: the gaps we wrote down
expansion, hamilton, gaps, run-1

> A blank on a map can mean many things. We give each gap a type and a count, so a reader knows which kind of blank they are looking at.

## Kinds of gap
- **Not present in the source.** The field does not exist anywhere we looked, such as a tax class.
- **Sparse.** The field exists but is mostly empty: property codes on 1,628 of 81,121 rows.
- **Stale.** A snapshot last edited in 2020.
- **Contradictory.** Old property codes that disagree with current zoning.
- **Placeholder.** Values that stand in for nothing, such as roll numbers of all zeros on 10 parcels.
- **Empty.** A postal code column blank on every row.
- **Withheld.** Some source data carries personal information about property holders. It exists, and we keep it from public view. No values are shown.
- **Not in coverage.** About 46 percent of City parcels, 74,276 of 166,745, sit outside the area where roll numbers are published.

## Why types matter
"No data" is not one thing. A parcel outside a watershed and a field withheld for privacy both show a blank, for different reasons. The ledger keeps the reason, the count and the source, and the map can show the right words.

## Gaps close only by rule
Each gap has a closing rule. A new source, a re-pull or an answer from the publisher can close it, and nothing closes on its own.
