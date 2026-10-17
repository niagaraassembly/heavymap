# Hamilton parcel dossier

**Status:** code, 2026-10-17. Linear **NA-27** (dossier), with NA-24 (registry) and NA-270 (treatment). Synthetic tests only in git. Output stays in `local-data/` until G6 opens (NA-269).

The dossier is the per-parcel lookup the v0 front end reads when a parcel is clicked. There is one record per active HeavyMap parcel ID. Every field says where it came from, how it was joined, how sure we are, and quotes the source in a short label, matching the UI copy style (classification · join · confidence).

```
python3 -m heavymap.dossier --data-root ../local-data \
  --out-dir ../local-data/dossier/hamilton/2026-10-17
```

## Inputs

| Input | Layer id | What is read |
|---|---|---|
| Registry run (`heavymap-registry/hamilton/CURRENT`) | LYR-HAM-PARCEL, LYR-HAM-ADDRESSES | `parcels.csv` (id, status, area, ARN grade), `addresses.csv` (address id, civic key, link method), `arn_links.csv` |
| Overlay run (`heavymap-overlays/hamilton/CURRENT`) | eleven overlay layers | `overlay_links.csv` and `MANIFEST.json` |
| NPCA Assessment_Parcels_Test all-fields pull | LYR-NPCA-ASSESSMENT-PARCELS-TEST | `OBJECTID_1`, `ARN`, `MPAC_STREE` only |
| NPCA Parcels_Cityview all-fields pull | LYR-NPCA-PARCELS-CITYVIEW | `ARN`, `PropCode` only |

## Screening (allowlist, not denylist)

Owner names, owner mailing addresses, `Legal_Txt` / legal descriptions and any other personal information never appear in the output. Two allowlists in [`heavymap/dossier/schema.py`](../../heavymap/dossier/schema.py) enforce this:

1. **`SOURCE_FIELDS`** names the only properties read from each NPCA file. The loader keeps those keys and drops the rest of each feature at once. A field added upstream later is dropped too, without anyone listing it.
2. **`RECORD_SPEC`** is the only shape a record may take. `screen_record` walks every record before it is written. It raises `ScreeningError` on any key not in the spec, at any depth, or a value of the wrong kind (for example an object where a string label belongs). After writing, `audit_output` reads every shard back and screens every record again.

`audit_spec` runs at import and refuses any spec key or allowlisted source field containing `owner`, `legal`, `mail`, `postal`, `name`, `phone` or `email`. The tests feed fixtures with sentinel owner, mailing, legal, postal and email values. They assert that no sentinel reaches any output byte and that injected keys are refused.

Public in Ontario and shown: roll number (ARN), MPAC property code, civic addresses (City address points and NPCA MPAC street text).

## Record schema (v1)

```json
{
 "heavymap_id": "hm:ca:on:hamilton:parcel:<ULID>",
 "area":     {"m2": 146779.9, "src": "LYR-HAM-PARCEL", "join": "registry_geometry", "conf": "high", "label": "..."},
 "coverage": {"status": "has_arn", "provisional": false, "grade": "exact_1to1", "src": "...", "join": "...", "conf": "...", "label": "..."},
 "roll": [{"arn": "2518xxxxxxxxxxx", "grade": "exact_1to1", "method": "representative_point", "iou": 0.9994,
           "src": "LYR-NPCA-ASSESSMENT-PARCELS-TEST", "join": "exact_1to1", "conf": "high", "label": "...",
           "roll_address": "<MPAC street text>",
           "property_code": {"code": "590", "family": "Industrial", "src": "LYR-NPCA-PARCELS-CITYVIEW",
                             "join": "arn_exact", "conf": "low", "label": "..."}}],
 "addresses": {"src": "LYR-HAM-ADDRESSES", "join": "point_in_polygon", "label": "...", "count": 3, "truncated": false,
               "shown": [{"id": "hm:ca:on:hamilton:address:<ULID>", "text": "<number> <STREET>, <COMMUNITY>", "unit": "", "join": "pip", "conf": "high"}]},
 "overlays": {"src": "heavymap-overlays:<run>", "join": "area_share", "label": "...", "sliver_count": 5,
              "rows": [{"layer": "LYR-HAM-ZONING", "class": "AA", "label": "City zoning: AA", "share": 0.8524, "m2": 125108.7, "fid": "<overlay feature id>"}]}
}
```

### Coverage status

| status | When | provisional |
|---|---|---|
| `has_arn` | at least one valid Hamilton ARN (`2518` + 11 digits) attached | no |
| `not_covered` | registry grade `not_in_coverage` (more than 5 m from any NPCA polygon) | **yes**, pending Morgen's decision on the ~46% outside NPCA roll data |
| `in_coverage_unmatched` | inside NPCA coverage, no ARN attached | yes |
| `arn_invalid` | only placeholder values attached (`000000000000000`, flag `non_city_prefix`); the value is not shown | no |

`not_covered` corresponds to the PCDP refusal reason `not_in_coverage` for the roll object.

### Confidence words

Provisional UI words, not the NA-86 `exact` / `good` / `weak` / `refused` scale (still open):

- `high`: one-to-one ARN match, point-in-polygon address, registry geometry.
- `medium`: ARN shared across City parcels (`one_to_many`) or several ARNs on one parcel (`many_to_one`); nearest address within 10 m; coverage test.
- `low`: exact ARN match against a stale or sparsely filled source (Cityview PropCode, last edited 2020); placeholder ARNs.

### Property code

Cityview `PropCode` joins by exact 15-digit ARN (`arn_exact`). If only a 20-digit Cityview ARN exists, it joins on its first 15 digits (`arn_prefix15`). The code is quoted as given. `family` names the MPAC range (1xx vacant land, 2xx farm, 3xx residential, 4xx commercial, 5xx industrial, 6xx institutional, 7xx special and exempt). The family is a range lookup, not a HeavyMap classification.

**Tax class is not available.** Neither NPCA layer carries an MPAC tax class. `MPAC_TAXAT` holds the taxing municipality (`HAMILTON CITY`). The manifest lists this under `fields_unavailable`.

### Addresses

Only registry links `pip` and `nearest_10m` are attached. `pip_ambiguous` and `unmatched` addresses stay off every parcel. The list is sorted by street, then house number, and capped at 25 (`--max-addresses`). `count` is always the full total, and `truncated` says whether the list was cut.

### Overlays and slivers

Every non-sliver overlay link is shown, in overlay-manifest layer order, largest share first. Sliver rows use the overlay rule: share under 1% of the parcel **and** under 5 m². They are left out of `rows` but counted in `sliver_count`. The label says how many are hidden. Note that the v0 spec draft (PR #71) asks to show every intersection, including slivers; this build follows the dossier brief, and `sliver_count` keeps the count honest. `share` is rounded to 4 decimals and `m2` to 0.1 m². A row with `share` 0.0 and `m2` > 0 is "below 0.01%", not absent.

Layer ids follow sheet 17. Overlay run `20261017-val2` wrote `LYR-NPCA-REGULATION-LANDS`. The dossier maps it to `LYR-NPCA-APPROX-REGULATION-LANDS` (`LAYER_ALIASES`), and the overlay config now emits the sheet 17 id.

## Output format and why

```
local-data/dossier/hamilton/<date>/
  manifest.json          # ~7 KB: schema, shard rule, counts, sources, confidence words, unavailable fields
  shards/{KK}.json       # 1,024 files, KK = last two characters of the heavymap_id
```

Each shard is `{"schema":1,"jurisdiction":"hamilton","shard":"KK","records":{"<heavymap_id>": {...}}}`.

- **Key-hash sharding by ULID suffix.** The last two characters come from the ULID's 80-bit random part, so 166,745 parcels spread evenly: 120 to about 200 per shard. The front end already has `heavymap_id` from the clicked PMTiles feature. It fetches `shards/` + `id.slice(-2)` + `.json` with no index and no hash code in JS. One click is one small request, cached per shard.
- **Not tile-aligned.** Parcels cross tile edges, and a tile scheme would tie the dossier to one PMTiles zoom and rebuild. Key shards are stable across tile rebuilds.
- **Not one file.** One file is about 250 MB. Two-character prefixes of a ULID are all `01` (the timestamp part), which is why the suffix is used.
- **Startup payload** is `manifest.json` only (about 7 KB). Shards load on click.

2026-10-17 run: 251,972,087 bytes raw in total (min 183 KB, median 245 KB, max 325 KB per shard). Gzip brings the total to about 24 MB, roughly 23 KB per shard, which is what GitHub Pages sends. Every file is far under the 100 MB limit. The raw median sits right at the v0 spec's 250 KB-per-response target, and the raw total is over its 40 MB dossier allocation (the transfer size is under both). If raw storage matters for G6, the next step is dictionary-encoding the repeated provenance strings and source feature ids into the manifest. Do not commit shards to git (history bloat); publish them as a Pages build artifact once G6 allows.

Runtime on deb: about 41 s end to end (13 s load, 18 s build and write, 10 s re-audit). Peak RSS was 798 MB, mostly the two NPCA GeoJSON parses. Stdlib only.

## Tests

`tests/test_heavymap_dossier.py`: screening (spec keys, source allowlist, injected keys at any depth, wrong value kinds), sentinel leak scan over every output byte, coverage split, roll provenance, the 20-digit ARN prefix join, address cap, sliver hiding and counting, the layer id alias, and the CLI end to end.
