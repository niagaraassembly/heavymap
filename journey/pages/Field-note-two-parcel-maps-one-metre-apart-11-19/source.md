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
Field note: two parcel maps, one metre apart
expansion, field-note, hamilton, parcels, geometry

> The City's parcels and the conservation authority's parcels describe the same land, about a metre apart.

## What we saw
The conservation authority's parcels sit 0.297 metres west and 0.939 metres north of the City's, consistently: just under a metre in all. Before correcting for it, the median overlap between matching parcels was 0.875. After shifting by that amount, it was 1.000.

## What we do
We measure the shift on every pull and apply it before joining. If the measured shift moves beyond a tolerance, the build fails rather than quietly joining misaligned parcels.
