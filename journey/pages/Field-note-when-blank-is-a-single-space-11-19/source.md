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
Field note: when blank is a single space
expansion, field-note, hamilton, fields, conventions

> Empty is not always empty.

## What we saw
On 4,051 matched parcels, blank street numbers and names were stored as a single space, not as nothing. A naive check would count them as filled.

## What we do
Text is stripped at ingest, and a blank is treated as missing. The count of affected rows is kept, so the cleaning can be checked.
