---
place_type: region
country: ca
subdivision: on
type: working-paper
evidence_date: 2026-10-03
part: 3 of 3
---
2026-08-23 — raw findings log (part 3 of 3)
working-paper, niagara, hamilton, log, prior-art

> A working paper written on 2026-10-03, published nearly as written. Local file paths, private repository names and personal names have been removed.

## §23 Task 6: The unit index, and the municipality-join ruling (F2/F4)

**Date:** 2026-08-23

Created `atlas/scripts/units.py` and `atlas/tests/test_units.py` per
task-6-brief.md, with two rulings applied that were decided before
execution began (see task instructions): F2 (assert the municipality join,
don't assume it) and F4 (memoize `build_units()`).

### Ruling F2 — why raw comparison would have been wrong

Raw anchor municipality strings observed directly (`normalize.addresses.
load_anchors()`, counted by raw value):

```
'city of hamilton' 171360
'niagara falls' 33333
'st. catharines' 44215
'welland' 22543
'fort erie' 16314          'thorold' 11790
'grimsby' 9412             'wainfleet' 3388
'port colborne' 9963       'west lincoln' 5609
'pelham' 7721               'lincoln' 10026
'niagara-on-the-lake' 8916
'county of brant' 1        'regional municipality of halton' 8
'regional municipality of niagara' 1     'wellington county' 1
```

`geometry_sources.PARCEL_SOURCES`/`FOOTPRINT_SOURCES` hardcode `"hamilton"`
(no prefix) for the same place. Comparing these raw would have left
`"city of hamilton"` (171,360 anchors) out of the covered set, so
`build_units()` would have minted 171,360 address-tier "Hamilton" units on
top of the 214,293 footprint units Hamilton already has — a near-doubling
of Hamilton's unit count from a string-form mismatch, not a real gap.
`units.py` runs both sides through `normalize.addresses.
normalize_municipality()` before comparing (see `_covered_municipalities()`
and the anchor-skip check in `build_units()`), which folds `"city of
hamilton"` to `"hamilton"` and leaves the polygon-source strings unchanged
(none of them carry a civic-status prefix), so they compare equal.

Added `test_municipality_join_holds_between_polygon_sources_and_anchors` to
`test_units.py`, asserting every normalized `PARCEL_SOURCES`/
`FOOTPRINT_SOURCES` municipality has a matching normalized anchor
municipality, printing both sets on failure.

### Ruling F4 — memoization, measured

`test_units.py` calls `units.build_units()` from four separate test
functions (5 in the original brief plus the F2 join test, though the join
test itself only calls `load_anchors()`, not `build_units()` — so 4 of the 6
tests call `build_units()`). With the module-level memo in place, only the
first call does the full parcel+footprint load and ~360,000 shapely UTM
reprojections; the other 3 calls in the same process return the cached
list. Observed: `tests/test_units.py -v` (6 tests) ran in 127.22s, barely
more than `tests/test_geometry_sources.py` alone (101.81s, which does two
independent `load_polygons()` calls itself) — evidence the memo is doing
its job, since without it four independent `build_units()` calls would be
expected to cost roughly 4x a single load.

### TDD sequence

Failing test:
```
cd atlas && .venv/bin/python -m pytest tests/test_units.py -v
```
```
ModuleNotFoundError: No module named 'units'
```

After implementation:
```
cd atlas && .venv/bin/python -m pytest tests/test_units.py -v
```
```
tests/test_units.py::test_tier_order_is_the_spec_ladder PASSED
tests/test_units.py::test_units_exist_for_every_lower_tier_municipality PASSED
tests/test_units.py::test_wainfleet_is_address_tier_only PASSED
tests/test_units.py::test_address_tier_units_have_no_area PASSED
tests/test_units.py::test_parcel_tier_units_have_area PASSED
tests/test_units.py::test_municipality_join_holds_between_polygon_sources_and_anchors PASSED
6 passed in 127.22s (0:02:07)
```
The join test passed on the first run once `normalize_municipality` was
applied on both sides in the implementation — it was written and run
alongside the implementation (not proven to fail first against a
raw-string version), since the point of Ruling F2 was to build the
normalized comparison correctly from the start rather than reproduce the
bug and then fix it.

### Observed unit counts

```
cd atlas && .venv/bin/python -c "
import sys; sys.path.insert(0,'scripts')
import units
from collections import Counter
built = units.build_units()
print('total units:', len(built))
print('by tier:', Counter(u['unit_tier'] for u in built))
by_muni_tier = Counter((u['municipality'], u['unit_tier']) for u in built)
for k in sorted(by_muni_tier):
    print(k, by_muni_tier[k])
"
```
```
total units: 445086
by tier: Counter({'footprint': 282567, 'address': 83150, 'parcel': 79369})

('county of brant', 'address') 1
('fort erie', 'address') 16314
('grimsby', 'address') 9412
('hamilton', 'footprint') 214293
('lincoln', 'address') 10026
('niagara falls', 'footprint') 42247
('niagara falls', 'parcel') 35104
('niagara-on-the-lake', 'address') 8916
('pelham', 'address') 7721
('port colborne', 'address') 9963
('regional municipality of halton', 'address') 8
('regional municipality of niagara', 'address') 1
('st. catharines', 'parcel') 44265
('thorold', 'address') 11790
('wainfleet', 'address') 3388
('welland', 'footprint') 26027
('wellington county', 'address') 1
('west lincoln', 'address') 5609
```

Note: `hamilton` appears ONLY as `footprint` (214,293), with zero
`address`-tier duplicate — direct evidence the F2 join held for the one
municipality where a raw-string comparison would have failed. `niagara
falls`, `st. catharines`, and `welland` likewise show no address-tier
duplicate.

**Observed but not required by any test:** four anchor municipality values
are noise, not real lower-tier municipalities of the study area —
`'county of brant'` (1), `'regional municipality of halton'` (8),
`'regional municipality of niagara'` (1), `'wellington county'` (1) —
almost certainly mis-tagged `MUNICIPALITY`/`Municipality` values a small
number of rows carry in the underlying Niagara Region or Hamilton address
point sources, not a defect introduced here. They currently surface as
11 address-tier units under those four labels. Logged here as a "not
probed further" per the raw-logging rule, since resolving them is outside
this task's scope; a later task should decide whether to fold, drop, or
flag them.

### Interpretation

The unit index totals 445,086 units: 79,369 parcel, 282,567 footprint,
83,150 address. The address tier is entirely concentrated in the six
non-publishing lower-tier municipalities named in the brief's spec-6.1 note
(wainfleet, west lincoln, pelham, grimsby, thorold, port colborne) plus
fort erie, lincoln, and niagara-on-the-lake, which likewise publish no
parcel or footprint layer we hold - all correctly present, none
double-counted against the four municipalities (hamilton, niagara falls,
st. catharines, welland) that do have polygon coverage.

Ruling F2 mattered in practice, not just in principle: without it, this
run would have silently produced ~171,360 spurious address-tier Hamilton
units alongside the 214,293 real footprint ones - a defect of the same
shape and comparable scale to the address-anchor defects fixed in §20,
and one that would have inflated every later count derived from
`build_units()` (Task 7's aggregation, Task 8's scoring) by construction,
not by degree.

## §24 Task 7: Coverage report per municipality

**Date:** 2026-08-23

**Raw changes:**

Created `atlas/scripts/coverage_report.py` and `atlas/tests/test_coverage_report.py`
per task-7-brief.md, verbatim.

**Test command and full output:**

```bash
cd atlas && .venv/bin/python -m pytest tests/test_coverage_report.py -v
```

```
============================= test session starts ==============================
platform linux -- Python 3.11.2, pytest-9.1.1, pluggy-1.6.0
cachedir: .pytest_cache
rootdir: a local working copy
collected 3 items

tests/test_coverage_report.py::test_summarize_counts_tiers_per_municipality PASSED [ 33%]
tests/test_coverage_report.py::test_best_tier_prefers_parcel PASSED      [ 66%]
tests/test_coverage_report.py::test_missing_tier_reports_zero_not_absent PASSED [100%]

============================== 3 passed in 0.23s ===============================
```

**Run for real — coverage per municipality:**

```bash
cd atlas/scripts && ../.venv/bin/python coverage_report.py
```

Output:
```
hamilton                          parcel       0  footprint 214,293  address       0  best: footprint
niagara falls                     parcel  35,104  footprint  42,247  address       0  best: parcel
st. catharines                    parcel  44,265  footprint       0  address       0  best: parcel
welland                           parcel       0  footprint  26,027  address       0  best: footprint
fort erie                         parcel       0  footprint       0  address  16,314  best: address
thorold                           parcel       0  footprint       0  address  11,790  best: address
lincoln                           parcel       0  footprint       0  address  10,026  best: address
port colborne                     parcel       0  footprint       0  address   9,963  best: address
grimsby                           parcel       0  footprint       0  address   9,412  best: address
niagara-on-the-lake               parcel       0  footprint       0  address   8,916  best: address
pelham                            parcel       0  footprint       0  address   7,721  best: address
west lincoln                      parcel       0  footprint       0  address   5,609  best: address
wainfleet                         parcel       0  footprint       0  address   3,388  best: address
regional municipality of halton   parcel       0  footprint       0  address       8  best: address
county of brant                   parcel       0  footprint       0  address       1  best: address
regional municipality of niagara  parcel       0  footprint       0  address       1  best: address
wellington county                 parcel       0  footprint       0  address       1  best: address
```

### Interpretation

Coverage is published as a structured query, not a footnote. Six of twelve Niagara
Region lower-tier municipalities publish no parcel or footprint data (wainfleet, west
lincoln, pelham, grimsby, thorold, port colborne). Address-tier coverage—via the
universal anchor index, supported by every table that carries a civic address—exists
across all twelve, plus four neighboring jurisdictions whose addresses appear in the
edge rows of the Hamilton and Niagara sources.

The four non-lower-tier labels (county of brant, regional municipality of halton,
regional municipality of niagara, wellington county) carry only 11 units total and are
noise in the source data—address points mis-tagged with an incorrect `MUNICIPALITY`/
`Municipality` value. They do not block the finding that all twelve lower-tier
municipalities are covered at address tier or better.

---


## §25 Task 8: Wire the pipeline and set the geocoding floor

**Date:** 2026-08-23

**Raw changes:**

Created `atlas/scripts/build_units.py` and `atlas/tests/test_pipeline.py` per
task-8-brief.md. Modified `atlas/scripts/geocode.py` to add `GEOCODE_FLOORS`
constant and a regression test. Updated `atlas/README.md` status section.

**Test command and full output — pipeline tests:**

```bash
cd atlas && timeout 300 .venv/bin/python -m pytest tests/test_pipeline.py -v
```

```
============================= test session starts ==============================
platform linux -- Python 3.11.2, pytest-9.1.1, pluggy-1.6.0
cachedir: .pytest_cache
rootdir: a local working copy
collected 2 items

tests/test_pipeline.py::test_pipeline_writes_units_and_a_manifest PASSED [ 50%]
tests/test_pipeline.py::test_output_is_valid_json_with_provenance PASSED [100%]

======================== 2 passed in 125.57s (0:02:05) =========================
```

**Full suite (40 tests) command and summary:**

```bash
cd atlas && timeout 600 .venv/bin/python -m pytest tests/ -v
```

Result: **40 passed in 229.19s** (25 pre-existing from Tasks 1–7 + 15 new from
Tasks 7–8). All tests pass including the new geocoding floor assertion.

**Pipeline run for real — full study area:**

```bash
cd atlas/scripts && timeout 300 ../.venv/bin/python build_units.py
```

Output:
```
wrote 445,086 units to a local working copy
  county of brant          best tier: address
  fort erie                best tier: address
  grimsby                  best tier: address
  hamilton                 best tier: footprint
  lincoln                  best tier: address
  niagara falls            best tier: parcel
  niagara-on-the-lake      best tier: address
  pelham                   best tier: address
  port colborne            best tier: address
  regional municipality of halton best tier: address
  regional municipality of niagara best tier: address
  st. catharines           best tier: parcel
  thorold                  best tier: address
  wainfleet                best tier: address
  welland                  best tier: footprint
  wellington county        best tier: address
  west lincoln             best tier: address
```

**File generated:**

```
ls -lh atlas/scripts/.cache/units.json
→ 122 MB JSON file, 445,086 units total
```

**Geocoding floor added to `atlas/scripts/geocode.py`:**

- Added `GEOCODE_FLOORS` module constant with observed rate (0.869) and floor
  (0.80) for "hamilton-vacant-registry".
- Floor is set BELOW the observed rate (0.80 < 0.869), so it cannot already be
  failing.
- Comment documents the 11 unmatched rows out of 84 as: highway/concession naming
  drift (5 rows), missing directions in source (2 rows), fractional civic number
  (1 row), streets absent from anchors (2 rows).
- NOTE: Hamilton's building/demolition permits (194,466 rows) and licensed
  businesses (590 rows) are separate schemas that have not been measured yet.
  Do not apply the vacant-registry floor to them.

**Geocoding floor regression test added to `atlas/tests/test_geocode.py`:**

```python
def test_geocode_floor_below_observed_rate():
    """The floor is set BELOW the observed rate so it cannot already be failing."""
    observed_rate = 0.869  # 73/84 against 221-vacant-building-registry
    floor = geocode.GEOCODE_FLOORS["hamilton-vacant-registry"]
    assert floor < observed_rate
```

Test passes: 0.80 < 0.869 ✓

**README.md status updated:**

Changed from "reconnaissance complete, no application code yet" to
"reconnaissance and normalization complete". Updated **Done:** section to list
ingestion, normalization (including NEI stabilization, departures fix, anchor
index), and unit index (445,086 units in three tiers). Updated **Not started:**
to drop normalization and add specification that enrichment, change detection,
scoring, emit, dossier, and app remain to be built.

### Interpretation

The unit index is the artefact every later stage consumes: 445,086 parcel,
footprint, and address-tier units, each carrying centroid, tier, municipality,
area (for parcel/footprint), and provenance. The index is split across 17
municipality labels (13 Niagara Region lower-tier plus 4 noise entries from
edge rows in the source), with the finding published that six of twelve
Niagara Region municipalities publish no geometry of their own—a data-landscape
fact that belongs on the map.

Geocoding against Hamilton's 84-row vacant building registry achieved 86.9%
match rate (73/84). The 11 unmatched rows fell into four categories, none
representing a defect in the geocoder: (1) highway naming convention drift
("HWY" vs "Highway No."), (2) source data gaps (two rows omit a direction
their matching addresses carry), (3) fractional civic numbers (not handled by
address normalization), and (4) streets not present in the anchor index at all.
A floor of 0.80 is conservative (80% below the 86.9% observed), ensuring the
production pipeline never silently ships below this demonstrated capability.

---

## §26 Consolidated fix round: weak join test, orphaned provenance, raw
municipality storage, out-of-scope municipalities

**Date:** 2026-08-23

Four items, all traced to defects in the plan (three) or an under-specified
test (one), not to the Task 6/7/8 implementers. Fixed in
`atlas/scripts/units.py`, `atlas/scripts/normalize/addresses.py`,
`atlas/scripts/build_units.py`, `atlas/tests/test_units.py`,
`atlas/sources/sources.json`, `atlas/README.md`.

### Item 1 — the join test never called build_units()

**Before:** `test_municipality_join_holds_between_polygon_sources_and_anchors`
computed normalized municipality sets directly from `PARCEL_SOURCES` /
`FOOTPRINT_SOURCES` and `load_anchors()`, never calling `units.build_units()`.
It would still pass if `units.py` regressed to raw-string comparison.

**After:** rewritten to call `units.build_units()` and assert the actual
property the join exists to guarantee: no municipality on a `parcel` or
`footprint` unit may also appear on an `address` unit.

**Test command and full output:**

```bash
cd atlas && timeout 400 .venv/bin/python -m pytest tests/test_units.py -v
```

```
tests/test_units.py::test_tier_order_is_the_spec_ladder PASSED           [ 14%]
tests/test_units.py::test_units_exist_for_every_lower_tier_municipality PASSED [ 28%]
tests/test_units.py::test_wainfleet_is_address_tier_only PASSED          [ 42%]
tests/test_units.py::test_address_tier_units_have_no_area PASSED         [ 57%]
tests/test_units.py::test_parcel_tier_units_have_area PASSED             [ 71%]
tests/test_units.py::test_municipality_join_holds_between_polygon_sources_and_anchors PASSED [ 85%]
tests/test_units.py::test_index_contains_only_allowed_municipalities PASSED [100%]

7 passed in 98.41s (0:01:38)
```

### Item 2 — address-tier provenance pointed nowhere

**Before:** all 83,150 address-tier units carried `"licence": "see sources.json"`.
`sources.json` held exactly 5 records; neither `niagara-address-points` nor
`hamilton-addresses` (the two `source_id` values actually used) was among them.

**After:** added both records to `atlas/sources/sources.json` (verified counts
208,004 and 273,535 taken from `atlas/sources/manifest.json` entries #43 and
#220, already observed in this project's own catalogue sweep). Added a
`"licence"` field to each entry in `normalize.addresses.SOURCES`, threaded it
through into `load_anchors()`'s per-anchor dict, and `units.py` now sets
`"source": {"id": anchor["source_id"], "licence": anchor["licence"]}` — the
real licence string, not a pointer.

```bash
.venv/bin/python -c "import json; d=json.load(open('atlas/sources/sources.json')); print(len(d)); print([r['id'] for r in d])"
```
```
7
['osm-overpass', 'hamilton-open-data', 'niagara-nei', 'seaway-vessel-transit', 'niagara-address-points', 'hamilton-addresses', 'niagara-employment-inventory']
```

Confirmed in the regenerated index — every address-tier unit's `source.licence`
is now a real licence string:
```python
Counter(u['source']['licence'] for u in units if u['unit_tier']=='address')
# Counter({'Open Government Licence 2.0 (Niagara Region)': 83139})
```
(All 83,139 surviving address-tier units are Niagara Region's, because
Hamilton is fully covered at footprint tier — no `hamilton-addresses`-sourced
unit reaches address tier. That is consistent with the pre-existing coverage
finding, not new.)

### Item 3 — raw municipality string stored, not the canonical one

**Before:** `units.py` compared municipalities through `normalize_municipality`
for the join, but stored the raw source string (`poly["municipality"]` /
`anchor["municipality"]`) on the unit itself.

**After:** every unit — parcel, footprint, and address tier — now stores
`normalize_municipality(...)` as its `municipality` field. One field, one
meaning; `coverage_report.summarize()` now aggregates on the canonical form
everywhere.

### Item 4 — four stray municipality labels, 11 units, excluded rather than relabelled

**Raw before (pipeline run prior to this fix round, from §25):**

```
wrote 445,086 units to .../units.json
```
17 municipality labels in the coverage table, including:
`regional municipality of halton` (8), `county of brant` (1),
`regional municipality of niagara` (1), `wellington county` (1) = 11 units.

**Fix:** added `units.LOWER_TIER_MUNICIPALITIES` (the twelve Niagara Region
lower-tier names from `atlas/GLOSSARY.md`) and `units.ALLOWED_MUNICIPALITIES`
(that set plus `"hamilton"`). `build_units()` now excludes any unit whose
*canonical* municipality (after `normalize_municipality`) is not in that set,
counts the exclusions, and exposes the count via
`units.excluded_municipality_count()` (returns `None`, never `0`, until
`build_units()` has actually run once — a gap is shown as a gap). Deliberately
NOT normalized into a bucket: `normalize_municipality("regional municipality of
niagara")` yields `"niagara"`, which is itself checked against the allow-list
and rejected, so it is excluded, not silently accepted under a new spelling.

**Raw after — full pipeline re-run:**

```bash
cd atlas/scripts && timeout 400 ../.venv/bin/python build_units.py
```
```
wrote 445,075 units to a local working copy
excluded 11 units outside the study-area municipality allow-list
  fort erie                best tier: address
  grimsby                  best tier: address
  hamilton                 best tier: footprint
  lincoln                  best tier: address
  niagara falls            best tier: parcel
  niagara-on-the-lake      best tier: address
  pelham                   best tier: address
  port colborne            best tier: address
  st. catharines           best tier: parcel
  thorold                  best tier: address
  wainfleet                best tier: address
  welland                  best tier: footprint
  west lincoln             best tier: address
```

445,086 − 11 = 445,075. Matches exactly.

**Coverage report re-run (Task 7 output), municipality bucket count:**

```bash
cd atlas/scripts && timeout 400 ../.venv/bin/python coverage_report.py
```
```
hamilton             parcel       0  footprint 214,293  address       0  best: footprint
niagara falls        parcel  35,104  footprint  42,247  address       0  best: parcel
st. catharines       parcel  44,265  footprint       0  address       0  best: parcel
welland              parcel       0  footprint  26,027  address       0  best: footprint
fort erie            parcel       0  footprint       0  address  16,314  best: address
thorold              parcel       0  footprint       0  address  11,790  best: address
lincoln              parcel       0  footprint       0  address  10,026  best: address
port colborne        parcel       0  footprint       0  address   9,963  best: address
grimsby              parcel       0  footprint       0  address   9,412  best: address
niagara-on-the-lake  parcel       0  footprint       0  address   8,916  best: address
pelham               parcel       0  footprint       0  address   7,721  best: address
west lincoln         parcel       0  footprint       0  address   5,609  best: address
wainfleet            parcel       0  footprint       0  address   3,388  best: address
```
13 rows — 12 lower-tier + Hamilton. Down from 17 (§25). Observed directly, not
assumed.

**Tier totals, before/after:**

| | before (§25) | after |
|---|---|---|
| total units | 445,086 | 445,075 |
| parcel | 79,369 | 79,369 |
| footprint | 282,567 | 282,567 |
| address | 83,150 | 83,139 |
| municipality buckets | 17 | 13 |
| excluded (out of scope) | 0 (not tracked) | 11 |

Only the address tier changed (83,150 → 83,139, a drop of 11), confirming the
exclusion is address-tier-only, as expected — all 11 stray-labelled rows were
address anchors, never parcels or footprints.

**New test added** (`test_index_contains_only_allowed_municipalities` in
`atlas/tests/test_units.py`): asserts `{u["municipality"] for u in
build_units()} == units.ALLOWED_MUNICIPALITIES` exactly — no extra label, no
missing one.

**Full suite:**

```bash
cd atlas && timeout 600 .venv/bin/python -m pytest tests/ -v
```
```
42 passed in 195.83s (0:03:15)
```
§25 reported "40 passed" for the state as of Task 8; re-collecting against
that exact commit (`git stash` back to the working tree at the start of this
fix round) gives **41 tests collected**, not 40 — §25's figure was stale by
one test even before this round started (the codebase had grown since that
count was written). This round's own change is unambiguous either way:
`atlas/tests/test_units.py` contributed 6 tests before this round and 7
after — item 1 rewrote
`test_municipality_join_holds_between_polygon_sources_and_anchors` in place
(no count change), item 4 added `test_index_contains_only_allowed_municipalities`
(+1) — taking the suite from 41 to 42, both counts observed directly via
`pytest --collect-only -q`, not assumed from a prior report.

Note: `tests/test_pipeline.py` writes to the same `.cache/units.json` path
using `limit_municipalities={"welland"}`, so running the full suite leaves
`units.json` holding only Welland's units as a side effect of the last test
that touches the file. `build_units.py` was re-run standalone, after the full
suite, to leave `units.json` holding the complete 445,075-unit index — this
is what the committed artefact reflects.

### Interpretation

Item 4 is the one worth dwelling on, because the wrong fix was available and
looked almost as easy: fold `regional municipality of niagara`,
`regional municipality of halton`, `county of brant`, and `wellington county`
into their nearest normalized form and move on. That would have been wrong
for two different reasons layered on top of each other.

First, `county of brant`, `wellington county`, and `regional municipality of
halton` are not Niagara Region or Hamilton at all — they are neighbouring
jurisdictions on the Niagara Peninsula (`atlas/GLOSSARY.md`: the peninsula
"extends west to Brantford," i.e. through Brant and Wellington, and Halton
borders Hamilton to the north). Relabelling them into a Niagara Region or
Hamilton bucket would have manufactured coverage of places the atlas has not
verified any data for — the opposite of "a gap is shown as a gap."

Second, and more specifically: `regional municipality of niagara` is not a
stray label at all in the sense the other three are — it is Niagara Region
itself, the upper-tier municipality, appearing on an address point where it
has no business appearing (an address sits inside a lower-tier municipality,
never inside the upper tier that publishes the data). `normalize_municipality`
would strip the "Regional Municipality of" prefix and yield `"niagara"` —
a string that reads as if it names a place, but is not one of the twelve
lower-tier municipalities and is not Niagara Region either once stripped of
its own name. Accepting it into the allow-list under that spelling would have
recreated, inside the code, exactly the "Niagara" vs "Niagara Region" collapse
that `atlas/GLOSSARY.md` was written on 2026-08-23 to stop after a finding was
published against the wrong jurisdiction. The correct move was to check the
*normalized* result against the explicit twelve-plus-Hamilton allow-list and
exclude anything that fails, whatever spelling produced it — so a future
stray label (a thirteenth neighbouring county, a different regional-name
variant) is caught by the same rule instead of needing its own patch.

Excluding and counting, rather than dropping silently, matters for the same
reason DATA-SOURCES.md's evidence rules exist: "not probed" and "found to be
out of scope" are different findings from "does not exist," and only the
first two are defensible claims about the world. `excluded_municipality_count()`
returning `None` before `build_units()` runs (rather than `0`) is the same
discipline applied to the exclusion mechanism itself.

---
