---
type: field-note
run: CR-001
place: ca-on-3525005-hamilton
place_type: city
country: ca
subdivision: on
city: hamilton
evidence_date: 2026-10-17
---
Field note: when the host compresses the map
expansion, field-note, hamilton, hosting, tiles, building

> A tile archive is read in pieces, by byte range. One host broke that for some browsers.

## What we saw
When a browser asked for compressed responses, the host compressed the tile archive on the fly and then applied the requested byte range to the compressed bytes. The pieces that came back were not the pieces asked for.

## What we do
We recorded it as a quirk of the host, compared alternatives before choosing where to serve the map. A range test on the deployed site, not just locally, is part of that choice.
