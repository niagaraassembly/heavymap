---
type: origin
place_type: region
country: ca
subdivision: on
evidence_date: 2026-08-28
---
Four days of field logs, August 2026
origins, hamilton, niagara, logs, prior-art

> The first Hamilton–Niagara atlas kept a raw log, appended as work happened. Four days of it show how the habits behind HeavyMap formed.

## 23 August: count to the server's number
Hamilton's catalogue was swept: 463 datasets, 336 with a live map service. Then a large download was counted by streaming through it. The first count came out one too high, because the marker for a feature also matched the marker for the whole collection. The fix produced a count two too high, because the overlap between chunks was longer than the marker and counted some features twice. The third attempt gave 221,518, exactly the server's own count. Since then every pull is checked against the count the server reports.

## 24 August: make the registry agree with itself
The list of sources had grown by hand. Some entries said "license", some "licence"; five polygon sources were missing records. The registry was normalised, and a test now fails if a source is used without a record.

## 27 August: try it somewhere else
A short spike tested the approach on Waterloo Region, which publishes 548 datasets through a shared catalogue, and on Rochester, New York, with its 2024 tax parcels. A technical report on parcel profiles was written the same day and checked line by line before it was saved. Two defects were caught: figures stated more precisely than their sources allowed, and three jurisdictions folded into one.

## 28 August: stop at a clean edge
The work paused with one plan finished and the next designed but not started, so nothing was half built. The log noted one thing left uncorrected in an append-only record, and said plainly that the longer it stood, the more it looked like the failure the log existed to prevent.
