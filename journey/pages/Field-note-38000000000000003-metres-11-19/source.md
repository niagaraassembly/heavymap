---
type: field-note
run: CR-001
place: ca-on-3525005-hamilton
place_type: city
country: ca
subdivision: on
city: hamilton
evidence_date: 2026-11-17
---
Field note: 3.8000000000000003 metres
expansion, field-note, hamilton, bridges, fields

> Posted bridge heights arrive with a computer's rounding noise.

## What we saw
Height values on restricted bridges print as numbers like 3.8000000000000003. The same layer stores yes as -1 and no as 0.

## What we do
Heights are rounded to a centimetre for display, with the raw value kept in the release. The -1 and 0 are mapped to true and false when the layer is prepared.
