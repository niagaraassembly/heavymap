# Monroe municipality-name / `countysbl` prefix crosswalk (NIA-81)

This is an **observed, inferred crosswalk**, not a Monroe-issued SWIS code table. The six-digit `countysbl` prefix behaves like a SWIS code in the observed values, but **Monroe has not confirmed that meaning here**. In Monroe `Parcels_Public`, `swis` contains municipality **names** (or null). In the NYS statewide parcel layer, `SWIS` is a six-digit **code**. Do not compare those two fields directly; do not compare print keys across layers. This work does not query the statewide layer.

## Provenance and method

- Source: [Monroe County `Parcels_Public` FeatureServer layer](https://maps.monroecounty.gov/server/rest/services/Hosted/Parcels_Public/FeatureServer/0), public GET `query` endpoint.
- Retrieved: **2026-09-30 07:41:03 UTC**. Counts are a live-layer observation at that time, not a frozen release.
- Query: `SUBSTRING(countysbl,1,6), swis, CHAR_LENGTH(countysbl)` grouped with `COUNT(objectid)`, plus `returnCountOnly` checks for all rows, null `swis`, null `countysbl`, and empty `countysbl`. `returnGeometry=false`; only `countysbl` and `swis` were requested as data fields. No owner values, geometry, or parcel-level rows were read or retained.
- [Crosswalk CSV](monroe-swis-crosswalk.csv): one row per observed `(prefix, name)` pair. `row_count` includes every key length, while `valid_sbl26_count` counts only 26-character keys with a six-digit prefix. `invalid_length_count` records the remaining rows. A blank `monroe_swis_name` means source null; a blank prefix means empty `countysbl`. Each row repeats endpoint, field, retrieval time, and the unconfirmed-code caveat.
- Reproduce with `python3 scripts/monroe_swis_crosswalk.py` from the repository root. `--help` describes modes; `--dry-run` makes no request or write; `--cache` rebuilds from `local-data/monroe-swis-aggregates.json` without a request. The script refuses truncated or unreconciled aggregates. Raw aggregate responses stay in ignored `local-data/`.

## Full-population checks

| Check | Rows |
|---|---:|
| Layer count and grouped sum | 267,962 each |
| `countysbl` length 26 | 263,310 |
| Other lengths | 4,652 |
| Empty `countysbl` (length 0) | 40 |
| Null `countysbl` | 0 |
| Null `swis` | 544 |
| Observed `swis` values | 32, including null; 31 names |
| Observed prefix/name pairs | 66 |

Other key lengths: 17 (1), 20 (17), 21 (1), 22 (3), 23 (1,036), 24 (1,318), and 25 (2,236). A short key's prefix is descriptive only; it is **not joined**. This refusal covers 4,652 rows. It does not imply that those parcels do not exist.

## Join decision

`inferred_from_prefix` means the name has one six-digit prefix among valid 26-character keys and that prefix has one non-null name. These are candidate name-to-code mappings only; the meaning of the six digits remains inferred, not confirmed by a Monroe code table. `ambiguous` means a valid prefix has multiple names or a name has multiple valid prefixes. `unresolved` means null name or no valid 26-character key for that pair. No ambiguous or unresolved row supplies a join code. Even in an inferred pair, use only its `valid_sbl26_count` rows for a candidate parcel join; the `invalid_length_count` rows remain **not joined**.

| Pair status | Pairs | All rows | Valid 26-character rows | Invalid-length rows |
|---|---:|---:|---:|---:|
| `inferred_from_prefix` | 28 | 234,730 | 230,781 | 3,949 |
| `ambiguous` | 7 | 32,686 | 32,044 | 642 |
| `unresolved` | 31 | 546 | 485 | 61 |
| **Total** | **66** | **267,962** | **263,310** | **4,652** |

The unresolved set includes all **544 null-name rows**. Of these, 485 have 26-character keys and 59 have invalid-length keys. Two additional named rows have only short keys: `Town of Henrietta`/`263218` and `Town of Webster`/`050040`.

Three names have multiple valid prefixes: `Town of Henrietta` (`233200`, `263200`, `263201`), `Town of Sweden` (`265289`, `265489`), and `Town of Webster` (`263200`, `265489`). Two valid prefixes have multiple names: `263200` (Henrietta and Webster) and `265489` (Sweden and Webster). The observed minority pairs include Henrietta/`233200` (1), Henrietta/`263201` (1), Webster/`263200` (25), and Sweden/`265489` (2); these are not silently assigned to a majority name. The CSV gives every pair's count.

For Rochester, **64,655** rows have prefix `261400`: **64,629** have `swis = 'City of Rochester'` and **26** have null `swis`. All 26 null-name rows have 26-character keys, but their municipality name remains unresolved. Of the named Rochester rows, 64,085 have 26-character keys and 544 have shorter keys. The `261400` candidate code relationship is observed here and consistent with the pilot city-to-county SBL match; its SWIS-code meaning remains **inferred, not confirmed by a Monroe code table**.

No MCS cells were changed; target `dataset_id`: none. `niagara-atlas/` and the UK atlas are prior-art baselines only; neither supplied data for this table. MPAC remains `not_licensed`. No site or map is published by this work.
