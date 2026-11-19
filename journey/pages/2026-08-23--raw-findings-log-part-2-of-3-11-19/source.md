---
place_type: region
country: ca
subdivision: on
type: working-paper
evidence_date: 2026-10-03
part: 2 of 3
---
2026-08-23 — raw findings log (part 2 of 3)
working-paper, niagara, hamilton, log, prior-art

> A working paper written on 2026-10-03, published nearly as written. Local file paths, private repository names and personal names have been removed.

## §17 Fix round 1: Regenerated layer schema and guard

**Date:** 2026-08-23

**Raw changes:**

`atlas/scripts/normalize/departures.py`:
- Line 26-31: Renamed `SOURCE` to `SOURCE_TEMPLATE` and corrected field names:
  - `licence` → `license` (American spelling to match app.js at line 319)
  - Added `license_url`: "https://www.ontario.ca/page/open-government-licence-ontario"
  - Renamed `id` → `source_id` (avoids shadowing)
  - Removed duplicate `id` field
- Line 69: Changed `retrieved="2026-08-21"` → `retrieved_at="2026-08-21"` (to match app.js at line 310)
- Lines 75-99: Added `_compute_bbox()` function to compute `[min_lon, min_lat, max_lon, max_lat]` from feature geometries
- Lines 102-120: Updated `build()` to return a FeatureCollection with a top-level `atlas` metadata object:
  - `layer`: "departures"
  - `source`: "Niagara Region Employment Inventory"
  - `license`: "Open Government Licence 2.0 (Niagara Region)"
  - `attribution`: "Contains information licensed under OGL 2.0 - Niagara Region"
  - `freshness`: "HISTORICAL" (multi-year 2022 snapshot, per README.md freshness states)
  - `retrieved_at`: "2026-08-21"
  - `bbox`: computed from features, e.g. `[-79.623, 42.883, -78.944, 43.212]`
  - `feature_count`: 34 (matches actual feature count)

`atlas/tests/test_departures.py`:
- Line 46: Changed assertion from `src["licence"]` to `src["license"]`
- Line 47: Changed assertion from `src["id"]` to `src["source_id"]`
- Lines 50-62: Added `test_collection_has_atlas_metadata()` to verify:
  - Top-level `atlas` object exists
  - `feature_count` field equals actual feature count
  - `license` and `retrieved_at` fields present
  - `layer` equals "departures"
  - Feature count is between 5 and 40

`atlas/scripts/fetch_nei.py`:
- Lines 216-227: Added a guard at the top of `main()` that:
  - Prints an error message to stderr citing the address-keyed logic's 64 false positives
  - References atlas/logs/2026-08-23.md §14 for root cause
  - Returns exit code 1 (non-zero) to refuse execution
  - Leaves the file unmodified so its history is preserved

**Regeneration:**

Command: `cd atlas && .venv/bin/python -m scripts.normalize.departures`

Output: `wrote 34 departures to a local working copy

Feature count: 34 (unchanged from task 2 initial run; within required 5–40 range)

Bbox computed from features: `[-79.623, 42.883, -78.944, 43.212]`

**Test results:**

```
cd atlas && .venv/bin/python -m pytest tests/test_departures.py tests/test_normalize_nei.py -v
```

```
============================= test session starts ==============================
platform linux -- Python 3.11.2, pytest-9.1.1, pluggy-1.6.0
collected 10 items

tests/test_departures.py::test_industrial_sector_classification PASSED   [ 10%]
tests/test_departures.py::test_hopkins_is_not_a_departure PASSED         [ 20%]
tests/test_departures.py::test_no_departure_names_a_business_present_later PASSED [ 30%]
tests/test_departures.py::test_departure_count_is_plausible PASSED       [ 40%]
tests/test_departures.py::test_features_carry_provenance PASSED          [ 50%]
tests/test_departures.py::test_collection_has_atlas_metadata PASSED      [ 60%]
tests/test_normalize_nei.py::test_norm_props_lowercases_and_strips_underscores PASSED [ 70%]
tests/test_normalize_nei.py::test_every_edition_loads_with_ids PASSED    [ 80%]
tests/test_normalize_nei.py::test_editions_intersect_by_id PASSED        [ 90%]
tests/test_normalize_nei.py::test_hopkins_present_in_every_edition PASSED [100%]

============================== 10 passed in 9.97s ==============================
```

All 10 tests pass: 6 from test_departures.py (including new test_collection_has_atlas_metadata), 4 from test_normalize_nei.py (pre-existing).

**Verification of the fix:**

Per-feature source block now carries:
- `"license"` (not `"licence"`) — will be read by app.js:319
- `"retrieved_at"` (not `"retrieved"`) — will be read by app.js:310
- `"license_url"` and other standard provenance fields

Top-level `atlas` metadata now carries:
- `"feature_count": 34` — will populate sidebar layer row count
- `"license"`, `"attribution"`, `"retrieved_at"` — supports provenance panel rendering

### Interpretation

The prior implementer followed the brief's code sample faithfully, which is why the schema defect propagated into the generated file. The brief's template used the old field names; this fix corrects the implementation to match what app.js actually reads.

The absence of a top-level `atlas` object explains why the app's sidebar never displayed a feature count for this layer while displaying counts for all others. The app looks for `collection.atlas.feature_count` (app.js line 193) and falls back to showing nothing when the key is missing — a silent failure rather than a crash.

The provenance panel (app.js:305-321) reads `source.retrieved_at` and `source.license` to render retrieval date and copyright notice. When the code emitted `retrieved` and `licence`, those lines were silently skipped (JavaScript `if (source.retrieved_at)` evaluates false when the key doesn't exist). Users never saw when the data was obtained or what the license was for this layer alone.

The guard on `fetch_nei.py` prevents accidental re-generation of the defective layer while preserving the file's history for audit. The address-keyed logic is not deleted, but execution is blocked with an informative error message.


---

## §18 Task 3: The address anchor index

**Date:** 2026-08-23

**Raw changes:**

Created `atlas/scripts/normalize/addresses.py` and `atlas/tests/test_addresses.py`
per task-3-brief.md, with one applied correction to the test threshold (see
Interpretation).

**Test command and full output:**

```
cd atlas && .venv/bin/python -m pytest tests/test_addresses.py -v -s
```

```
============================= test session starts ==============================
platform linux -- Python 3.11.2, pytest-9.1.1, pluggy-1.6.0
collected 5 items

tests/test_addresses.py::test_street_normalization_absorbs_type_words PASSED
tests/test_addresses.py::test_street_normalization_keeps_meaningful_names PASSED
tests/test_addresses.py::test_address_key_is_stable_across_restyling PASSED
tests/test_addresses.py::test_address_key_rejects_incomplete_input PASSED
tests/test_addresses.py::test_anchors_cover_all_twelve_lower_tier_municipalities OBSERVED anchor count: 349260
OBSERVED municipality strings: ['city of hamilton', 'county of brant', 'fort erie', 'grimsby', 'lincoln', 'niagara falls', 'niagara-on-the-lake', 'pelham', 'port colborne', 'regional municipality of halton', 'regional municipality of niagara', 'st. catharines', 'thorold', 'wainfleet', 'welland', 'wellington county', 'west lincoln']
PASSED

============================== 5 passed in 6.84s ===============================
```

**Observed anchor count: 349,260** (raw address points: 481,539 total —
208,004 from Niagara Region's `043-address-points.geojson`, 273,535 from
Hamilton's `220-addresses.geojson`). Collapse from raw points to anchor keys:
27.5% (349,260 / 481,539), lower than the 46% collapse observed in the 2019
NEI (12,016 records -> 6,501 distinct address keys), because address points
are one row per civic address already, not per business tenant, so less
within-key duplication occurs at the source.

**Observed per-municipality anchor coverage** (by the `municipality` field
stored on each anchor, which is the raw source string lower-cased but not
further punctuation-stripped):

```
city of hamilton: 166646
st. catharines: 44173
niagara falls: 33333
welland: 22522
fort erie: 16280
thorold: 11560
lincoln: 10026
port colborne: 9925
grimsby: 9166
niagara-on-the-lake: 8914
pelham: 7710
west lincoln: 5606
wainfleet: 3388
regional municipality of halton: 8
county of brant: 1
regional municipality of niagara: 1
wellington county: 1
TOTAL: 349260
```

By source: `niagara-address-points` contributed 182,603 anchors (of 208,004
raw points, an 87.8% survival rate through keying); `hamilton-addresses`
contributed 166,657 (of 273,535 raw points, a 60.9% survival rate — Hamilton's
address file carries more units per building, which collapse to shared keys).

All twelve Niagara Region lower-tier municipalities are present. A handful of
addresses outside the study area (Halton, Brant, Wellington) also appear in
the Hamilton address file's edge rows and are harmless extras, not gaps.

Full suite regression check:

```
cd atlas && .venv/bin/python -m pytest tests/ -v
```
15 passed (5 new + 10 pre-existing from Tasks 1-2).

### Interpretation

**Deviation from task-3-brief.md, applied per explicit instruction at task
dispatch:** the brief's `test_anchors_cover_all_twelve_lower_tier_municipalities`
asserted `len(anchors) > 300_000`. That threshold was lowered to `> 150_000`
before implementation, reasoning that anchors are keyed on
`(number, street, municipality)`, so multiple units in one building collapse
to a single key, and the test's purpose is coverage of all twelve
municipalities, not a specific total. The measured count, 349,260, in fact
clears the original 300,000 bar too — the collapse from 481,539 raw points was
milder than the precedent (2019 NEI's 46%) suggested, because address points
already deduplicate per civic address at the source, unlike NEI's per-tenant
rows. The lowered threshold was the correct call to make *before* measuring
(the measurement could not be known in advance), and the result confirms the
anchor index comfortably covers the study area either way.

No municipality-name assertion failed, so no spelling correction was needed.
The source does spell one municipality "St. Catharines" with a period (visible
in the observed municipality-strings list above), but the test's expected set
does not include it, so this was moot for passing the test — noted here only
because the task dispatch specifically called it out as something to expect.

---

## §19 Task 4: Geocoder, and measured rate against the vacant building registry

**Date:** 2026-08-23

**Raw changes:**

Created `atlas/scripts/geocode.py` and `atlas/tests/test_geocode.py` per
task-4-brief.md, verbatim, no deviation in the committed modules.

**Test command and full output:**

```
cd atlas && .venv/bin/python -m pytest tests/test_geocode.py -v
```

```
============================= test session starts ==============================
platform linux -- Python 3.11.2, pytest-9.1.1, pluggy-1.6.0
collected 5 items

tests/test_geocode.py::test_matches_despite_street_restyling PASSED      [ 20%]
tests/test_geocode.py::test_unmatched_rows_are_kept_not_dropped PASSED   [ 40%]
tests/test_geocode.py::test_rate_floor_raises_below_threshold PASSED     [ 60%]
tests/test_geocode.py::test_rate_floor_passes_above_threshold PASSED     [ 80%]
tests/test_geocode.py::test_municipality_default_applies_when_field_absent PASSED [100%]

============================== 5 passed in 0.02s ===============================
```

Full suite regression check:

```
cd atlas && .venv/bin/python -m pytest tests/ -v
```
20 passed (5 new + 15 pre-existing from Tasks 1-3).

**Measurement against Hamilton's vacant building registry** — brief's Step 5
command, run exactly as specified (`municipality_default='Hamilton'`):

```
cd atlas && .venv/bin/python -c "
import sys; sys.path.insert(0,'scripts')
import json, re, geocode
from normalize import addresses
anchors = addresses.load_anchors()
rows = [f['properties'] for f in json.load(open('scripts/.cache/hamilton/221-vacant-building-registry.geojson'))['features']]
for r in rows:
    m = re.match(r'\s*(\S+)\s+(.*)', str(r.get('FOLDER_NAME') or ''))
    r['_n'], r['_s'] = (m.group(1), m.group(2)) if m else ('', '')
res = geocode.geocode(rows, '_n', '_s', None, anchors, municipality_default='Hamilton')
print(f'vacant registry geocoded {res[\"rate\"]:.1%} of {len(rows)} rows')
"
```

Output:
```
vacant registry geocoded 0.0% of 84 rows
```

**OBSERVED: 0.0% (0 matched / 84 total)**, using the brief's code exactly as
written.

**Diagnostic follow-up** (not part of the committed deliverable; run only to
determine whether 0.0% reflects a real geocoding limitation or a defect in
the one-off measurement script itself — required by "every count is observed,
never assumed", since shipping a 0.0% figure without understanding it would
itself be an unexamined assumption):

Root cause traced by direct key inspection:
```
key with default Hamilton:       90|webster|hamilton         -> not in anchors
key with City of Hamilton:       90|webster|cityofhamilton   -> IS in anchors
```
Hamilton's own address source (`220-addresses.geojson`) records `MUNICIPALITY`
as `"City of Hamilton"` for 273,524 of its 273,535 rows (checked directly:
`Counter({'City of Hamilton': 273524, 'Regional Municipality of Halton': 8,
'County of Brant': 1, 'Regional Municipality of Niagara': 1,
'Wellington County': 1})`). `address_key`'s municipality normalization strips
only non-alpha characters, so `"City of Hamilton"` and `"Hamilton"` normalize
to different strings (`cityofhamilton` vs `hamilton`) and never collide. The
brief's Step 5 script passes `municipality_default='Hamilton'`, which cannot
match anything keyed under `cityofhamilton`. **The 0.0% is an artifact of
this string mismatch between the ad hoc script and the real source
convention, not a demonstrated inability to geocode Hamilton addresses.**

Re-running with `municipality_default='City of Hamilton'` (the source's own
convention) instead:
```
diagnostic: matched 27 unmatched 57 rate 0.32142857142857145
```
**32.1% (27/84).** Inspecting the 57 remaining unmatched rows shows a second,
independent limitation: many `FOLDER_NAME` values carry a directional suffix
after the street type, e.g. `"708 RYMAL RD E"`, `"172 RYMAL RD W"`,
`"16 STONE CHURCH RD E"`. `normalize_street` only ever drops the single
*trailing* type word, so `"rymal rd e"` keeps all three tokens (`"e"` is not a
type word, so `"rd"` never reaches the trailing position where it would be
dropped), while the corresponding anchor's street reduces to `"rymal"`
(`StreetName` + `StreetType`, with no direction concatenated at all in
`addresses.py`'s `SOURCES` config). These rows can never key-match as the
code is currently written.

### Interpretation

No floor was set, per instruction — Task 8 chooses it from this measurement.

Two independently observed numbers are relevant to that choice, and neither
should be discarded:

1. **0.0%** — the literal output of the brief's Step 5 script, unmodified.
2. **32.1%** — the same computation with the municipality default corrected
   to match Hamilton's actual `MUNICIPALITY` convention, which is the more
   honest measure of the geocoder's real capability against this table today.

Even the corrected 32.1% is suppressed by the unhandled directional-suffix
case, so the true reachable ceiling for this specific table, with the current
`normalize_street`/`SOURCES` implementation, is somewhere above 32.1% but was
not separately measured (fixing it would mean invalidating `SOURCES` or
`normalize_street` as given in the brief, which was out of scope for this
task).

This is flagged as a concern for whoever picks the Task 8 floor: a naive
reading of "measure the real rate" against the brief's own script would
report 0.0% and could lead to a floor of 0 (meaningless) or a conclusion that
geocoding is broken (false) or a fixation on the vacant registry as
un-geocodable (also false — Hamilton building permits and licensed
businesses, which use the same `220-addresses.geojson`-derived anchors, were
not similarly checked here and may not carry the same `MUNICIPALITY` field
naming trap since they are separate source tables with their own schemas).
The underlying committed `geocode.py` and `addresses.py` are unmodified and
match their briefs exactly; this finding concerns only the one-off
measurement script's hardcoded default and a real, separate limitation in
directional-suffix handling.

---

## §20 Fix round 1: three design defects in the address anchor index (Task 3 brief)

**Date:** 2026-08-23

These are corrections to the *brief's original design* (task-3-brief.md),
not to the previous implementer's work — task-3-4-report.md shows they built
exactly what the brief specified. Three defects found on review; all three
fixed in `atlas/scripts/normalize/addresses.py`, tests added to
`atlas/tests/test_addresses.py`.

### Defect 1 — directional suffixes dropped (correctness bug)

Raw before/after, `address_key("77", "Burlington Street East", "City of
Hamilton")` vs `address_key("77", "Burlington Street West", "City of
Hamilton")`:

```
BEFORE: both -> 77|burlington|cityofhamilton        (SAME key — collapsed)
AFTER:  east -> 77|burlington e|hamilton
        west -> 77|burlington w|hamilton             (DIFFERENT keys)
```

Verified against the cache that civic number 77 exists on Burlington Street
in both directions (19 numbers do, checked directly against
`.cache/hamilton/220-addresses.geojson`: `['77','71','68','80','78','45',
'17','73','35','15', ...]`). Also confirmed both Hamilton's
`STREET_SUFFIX_DIRECTION` (26,272 East / 19,212 South / 18,672 West / 18,470
North / 190,909 None) and Niagara Region's `StreetDir` (2,403 North / 2,208
West / 1,901 South / 1,416 East / 200,076 None) fields exist and carry
matching cardinal values, so both sources in `SOURCES` gained a `dir_field`
entry (`STREET_SUFFIX_DIRECTION`, `StreetDir`) concatenated onto the street
string alongside the existing `type_field`.

### Defect 2 — trailing direction blocked the type-word drop

Raw before/after, `normalize_street`:

```
BEFORE: "RYMAL RD E"      -> "rymal rd e"    (type word "rd" survives)
        "RYMAL RD"        -> "rymal"
AFTER:  "RYMAL RD E"      -> "rymal e"
        "Rymal Road East" -> "rymal e"        (SAME as above)
        "Rymal Road"      -> "rymal"          (DIFFERENT from both)
```

Fix: `normalize_street` now pops a trailing direction token FIRST (long or
short form, normalized to one letter via a new `DIRECTIONS` map), then
applies the existing trailing-type-word drop to what remains, then
re-appends the normalized direction. All four cardinals checked both ways
(`N`/`North`, `S`/`South`, `E`/`East`, `W`/`West`) — all round-trip to the
same key.

### Defect 3 — municipality strings did not match between sources

Raw before/after, municipality component of `address_key("90", "Webster",
<muni>)`:

```
BEFORE: "Hamilton"          -> muni "hamilton"
        "City of Hamilton"  -> muni "cityofhamilton"   (did not match)
AFTER:  "Hamilton"          -> muni "hamilton"
        "City of Hamilton"  -> muni "hamilton"          (matches)
        "CITY OF HAMILTON"  -> muni "hamilton"          (matches)
```

Fix: new `normalize_municipality()` strips a LEADING civic-status prefix
(`city|town|township|village|municipality|county|region|regional
municipality`, each requiring a following "of") before `address_key` strips
non-letters. Checked directly against the four Niagara Region names named in
the task: `normalize_municipality` leaves `"St. Catharines"`, `"Niagara
Falls"`, `"Niagara-on-the-Lake"`, `"West Lincoln"` byte-for-byte unchanged
(lower-cased only) because none of them begin with a civic-status word
followed by "of". `"Wellington County"` (status word trailing, not leading)
is also left alone, correctly, since only leading forms are in scope.

### Anchor count

```
OLD: 349,260 anchors (from 481,539 raw address points: 208,004 Niagara Region + 273,535 Hamilton)
NEW: 354,601 anchors
```
Command: `cd atlas && .venv/bin/python -m pytest tests/test_addresses.py -v -s`
(the `test_anchors_cover_all_twelve_lower_tier_municipalities` test prints
`OBSERVED anchor count: 354601`). The rise (+5,341) is defect 1's fix taking
effect: E/W/N/S variants that previously collapsed onto one key now split
into distinct keys, so the true count of distinct places goes up, not down.

### Geocoding rate — Hamilton vacant building registry (84 rows)

Ran the brief's Step 5 measurement script exactly as originally written
(`municipality_default='Hamilton'`, unchanged from Task 4):

```
cd atlas && .venv/bin/python -c "
import sys; sys.path.insert(0,'scripts')
import json, re, geocode
from normalize import addresses
anchors = addresses.load_anchors()
rows = [f['properties'] for f in json.load(open('scripts/.cache/hamilton/221-vacant-building-registry.geojson'))['features']]
for r in rows:
    m = re.match(r'\s*(\S+)\s+(.*)', str(r.get('FOLDER_NAME') or ''))
    r['_n'], r['_s'] = (m.group(1), m.group(2)) if m else ('', '')
res = geocode.geocode(rows, '_n', '_s', None, anchors, municipality_default='Hamilton')
print(f'vacant registry geocoded {res[\"rate\"]:.1%} of {len(rows)} rows ({len(res[\"matched\"])} matched, {len(res[\"unmatched\"])} unmatched)')
"
```

Output:
```
vacant registry geocoded 86.9% of 84 rows (73 matched, 11 unmatched)
```

```
OLD: 0.0% (0/84) as originally scripted; 32.1% (27/84) after manually
     correcting only the municipality_default string (Task 4, §19).
NEW: 86.9% (73/84), using the SAME script and the SAME 'Hamilton' default
     the brief originally specified — no change to geocode.py or to the
     measurement script was needed, because address_key itself now
     normalizes the municipality string.
```

Cross-check: re-running the identical computation with
`municipality_default='City of Hamilton'` instead gives the identical
73/84, 86.9% — confirming defect 3 is fully resolved (the two forms now key
alike, so which one a caller passes no longer matters).

**Diagnosis of the remaining 11 unmatched rows** (rate is not low, but
diagnosed per instruction rather than left unexplained):

```
1126 HWY 8            -- address points spell this "Highway No. 5"/"Highway No. 8"-style; "HWY" is not expanded
7185 DICKENSON RD      -- FOLDER_NAME omits direction; matching address point is "Dickenson Road West" (has a real direction the registry row doesn't record)
7149 WHITE CHURCH RD   -- same pattern: matching point is "White Church Road East"; FOLDER_NAME carries no direction
658 HWY 8              -- highway-naming mismatch, as above
781 HWY 5 W            -- highway-naming mismatch, as above
365 HWY 8              -- highway-naming mismatch, as above
28 KING ST E 1/2       -- fractional civic number ("1/2") is not a directional or type token; normalize_street cannot parse it as a direction suffix
325 GREEN MOUNTAIN RD  -- not found under this name in address points at this number (checked directly; no match)
584 HWY 8              -- highway-naming mismatch, as above
1541 FIDDLERS GREEN RD -- zero address points contain "Fiddlers Green" as a street name at all
468 10TH CON RD E      -- concession-road abbreviation ("CON") vs address points' "Concession N" naming; not a type or direction word in TYPE_WORDS/DIRECTIONS
```

Two real, distinct residual patterns, neither a defect-1/2/3 issue:
(a) highway and concession-road naming conventions differ between the
registry's free-text `FOLDER_NAME` ("HWY 8", "10TH CON RD") and the address
points' structured naming ("Highway No. 8", "Concession N") — no shared
abbreviation table exists for these; (b) a few registry rows are missing a
direction that the matching address point actually carries (the registry's
source data is under-specified, not wrong), so a Hamilton-side fix cannot
close this gap — the registry itself would need better source data.

Per instruction, no rate floor is set here — Task 8 makes that call from
this measurement.

### Test command and full output

```
cd atlas && .venv/bin/python -m pytest tests/ -v
```
```
============================= test session starts ==============================
platform linux -- Python 3.11.2, pytest-9.1.1, pluggy-1.6.0
collected 25 items

tests/test_addresses.py::test_street_normalization_absorbs_type_words PASSED [  4%]
tests/test_addresses.py::test_street_normalization_keeps_meaningful_names PASSED [  8%]
tests/test_addresses.py::test_address_key_is_stable_across_restyling PASSED [ 12%]
tests/test_addresses.py::test_address_key_rejects_incomplete_input PASSED [ 16%]
tests/test_addresses.py::test_anchors_cover_all_twelve_lower_tier_municipalities PASSED [ 20%]
tests/test_addresses.py::test_trailing_direction_still_drops_the_type_word PASSED [ 24%]
tests/test_addresses.py::test_all_four_cardinal_directions_round_trip PASSED [ 28%]
tests/test_addresses.py::test_municipality_civic_status_prefix_is_absorbed PASSED [ 32%]
tests/test_addresses.py::test_municipality_normalization_does_not_damage_niagara_names PASSED [ 36%]
tests/test_addresses.py::test_directional_streets_produce_distinct_present_anchors PASSED [ 40%]
tests/test_departures.py::test_industrial_sector_classification PASSED   [ 44%]
tests/test_departures.py::test_hopkins_is_not_a_departure PASSED         [ 48%]
tests/test_departures.py::test_no_departure_names_a_business_present_later PASSED [ 52%]
tests/test_departures.py::test_departure_count_is_plausible PASSED       [ 56%]
tests/test_departures.py::test_features_carry_provenance PASSED          [ 60%]
tests/test_departures.py::test_collection_has_atlas_metadata PASSED      [ 64%]
tests/test_geocode.py::test_matches_despite_street_restyling PASSED      [ 68%]
tests/test_geocode.py::test_unmatched_rows_are_kept_not_dropped PASSED   [ 72%]
tests/test_geocode.py::test_rate_floor_raises_below_threshold PASSED     [ 76%]
tests/test_geocode.py::test_rate_floor_passes_above_threshold PASSED     [ 80%]
tests/test_geocode.py::test_municipality_default_applies_when_field_absent PASSED [ 84%]
tests/test_normalize_nei.py::test_norm_props_lowercases_and_strips_underscores PASSED [ 88%]
tests/test_normalize_nei.py::test_every_edition_loads_with_ids PASSED    [ 92%]
tests/test_normalize_nei.py::test_editions_intersect_by_id PASSED        [ 96%]
tests/test_normalize_nei.py::test_hopkins_present_in_every_edition PASSED [100%]

============================== 25 passed in 30.88s ==============================
```
25 passed (10 in test_addresses.py — 5 pre-existing + 5 new — plus 15
pre-existing across test_departures.py, test_geocode.py,
test_normalize_nei.py). No test outside test_addresses.py was modified.

### Interpretation

**Why defect 1 was a correctness bug, not a match-rate bug.** Defects 2 and
3 only ever produce false NEGATIVES: a real match fails to happen, and the
row is correctly reported as unmatched, visible, and auditable (per
`geocode.py`'s contract that unmatched rows are kept, never dropped).
Defect 1 is different in kind — it produces a false POSITIVE that is
invisible at the geocoding layer. "77 Burlington Street East" and "77
Burlington Street West" are two different buildings roughly two kilometres
apart in Hamilton's lower city, but before this fix they keyed to the exact
same anchor, so ANY address-bearing record naming one would silently
geocode — successfully, with a matched status and a real lon/lat — to the
other's location. A 100% "match" for such a row is wrong, not merely
unconfirmed. Because the geocoder has no way to know two different real
places were asked for and one anchor was returned, this class of error
cannot be caught by a rate measurement at all: the row shows up as
"matched," inflating confidence in exactly the join that the whole atlas
depends on, while quietly misplacing evidence on the map. That is why it
is graded the most serious of the three: defects 2 and 3 hide evidence,
lose only true; defect 1 also hides a wrong location behind an apparently
successful match.

The anchor-count rise from 349,260 to 354,601 is the direct, expected
fingerprint of this fix: previously-collapsed E/W/N/S street pairs now
resolve to the distinct places they always were, so the "correct" anchor
count was always higher than what was measured under the original design —
the earlier number was not merely conservative, it undercounted the true
number of distinct addressable places in the study area by conflating some
of them.

The jump in geocoding rate on the vacant registry (0.0% -> 32.1% -> 86.9%)
tracks the three fixes but should not be read as "defect 1 tripled the
rate" — the registry's 84 `FOLDER_NAME` values include several directional
streets (`RYMAL RD E/W`, `STONE CHURCH RD E`), so most of the jump from
32.1% to 86.9% is defects 1+2 acting together (a directional street cannot
match at all until both the anchor carries its direction AND
`normalize_street` can parse a directional query string), while the jump
from 0.0% to 32.1% was defect 3 alone (documented already in §19). No
single one of the three fixes could have been skipped and still reached
86.9%: dropping the direction fix leaves directional streets permanently
unmatchable regardless of municipality handling, and dropping the
municipality fix leaves every Hamilton row unmatched regardless of street
handling.

---

## §21 Correction to §20: the Burlington Street distance was wrong

**Date:** 2026-08-23

§20's Interpretation section states that "77 Burlington Street East" and
"77 Burlington Street West" are "two different buildings roughly two
kilometres apart in Hamilton's lower city." That figure was not computed —
it was an eyeballed guess. It is wrong.

**Computed distance**, using the two Burlington Street coordinates actually
present in `atlas/scripts/.cache/hamilton/220-addresses.geojson` —
`[-79.8583589, 43.2721852]` (east) and `[-79.8655445, 43.2719834]` (west):

```
cd atlas && .venv/bin/python -c "
from pyproj import Transformer
from shapely.geometry import Point
from shapely.ops import transform as shp_transform
t = Transformer.from_crs('EPSG:4326','EPSG:32617', always_xy=True).transform
a = shp_transform(t, Point(-79.8583589, 43.2721852))
b = shp_transform(t, Point(-79.8655445, 43.2719834))
print(a.distance(b))
"
```
Output: `583.5872473353091` (metres), i.e. the two points are **about 0.58 km
apart**, computed in EPSG:32617 (UTM 17N) per the project's area/distance
rule — not "roughly two kilometres" as §20 stated.

### Interpretation

The wrong figure was an unverified estimate that made it into an
Interpretation section without being computed from the coordinates on hand.
The correct figure, ~0.58 km, does not change the finding §20 was making:
the two addresses are still genuinely distinct places (different streets by
direction, not the same building), so collapsing them to one anchor was
still a real correctness bug producing a false-positive geocode. Only the
distance-apart figure was wrong; the defect, its diagnosis, and its fix in
§20 are unaffected. §20 itself is left unedited, per the append-only rule —
this entry is the correction of record.

---

## §22 Task 5: Parcel and footprint normalizers

**Date:** 2026-08-23

Created `atlas/scripts/normalize/geometry_sources.py` and
`atlas/tests/test_geometry_sources.py` per task-5-brief.md, verbatim as
specified (no deviation).

### TDD sequence

Failing test (before implementation existed):
```
cd atlas && .venv/bin/python -m pytest tests/test_geometry_sources.py -v
```
```
ImportError: cannot import name 'geometry_sources' from 'normalize'
(a local working copy)
1 error in 0.16s
```

After implementation:
```
cd atlas && .venv/bin/python -m pytest tests/test_geometry_sources.py -v
```
```
tests/test_geometry_sources.py::test_area_matches_publisher_precomputed_figure PASSED
tests/test_geometry_sources.py::test_parcels_load_with_tier_and_area PASSED
tests/test_geometry_sources.py::test_footprints_load_with_tier PASSED
tests/test_geometry_sources.py::test_every_polygon_carries_provenance PASSED
4 passed in 101.81s
```

### Observed counts

```
cd atlas && .venv/bin/python -c "
import sys; sys.path.insert(0,'scripts')
from normalize import geometry_sources as gs
from collections import Counter
parcels = gs.load_polygons(gs.PARCEL_SOURCES)
prints = gs.load_polygons(gs.FOOTPRINT_SOURCES)
print('parcels total:', len(parcels))
print('parcels by municipality:', Counter(p['municipality'] for p in parcels))
print('footprints total:', len(prints))
print('footprints by municipality:', Counter(p['municipality'] for p in prints))
"
```
```
parcels total: 79369
parcels by municipality: Counter({'st. catharines': 44265, 'niagara falls': 35104})
footprints total: 282567
footprints by municipality: Counter({'hamilton': 214293, 'niagara falls': 42247, 'welland': 26027})
```
(Command run twice; both runs took ~85-100s, dominated by the ~360,000
shapely UTM re-projections across parcels + footprints.)

### Interpretation

The median-error test against Welland's own `GeometrySTArea` passed on the
first run at well under the 0.001 (0.1%) threshold — consistent with the
brief's note that this has already been hand-verified once at 0.0000%
median/p95 relative error. This is strong independent confirmation that
EPSG:32617 is the right projection choice for this study area and that
`area_m2()` is computing area correctly, not merely passing a loose
tolerance.

`municipality` on each polygon is a hardcoded lowercase string in the
source descriptors (`"niagara falls"`, `"st. catharines"`, `"welland"`,
`"hamilton"`) - none carry a civic-status prefix, unlike some anchor
municipality strings (see Task 6, §23, on the join between this module and
`normalize.addresses`).

---
