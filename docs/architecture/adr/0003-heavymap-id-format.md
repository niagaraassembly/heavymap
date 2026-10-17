# ADR 0003 — Opaque ULID local token for the HeavyMap ID

**Status:** proposed for review, 2026-10-17. Linear **NA-24** (Epic 2, Parcel Identity Spine). Hamilton is the first geography. Code in `heavymap/ids/`. Tests use synthetic fixtures only.

**MCS:** no cells changed. No `dataset_id`.

This record chooses the `{local}` part of the spine key for jurisdictions that have no stable public parcel identifier, starting with the City of Hamilton. It does not fetch parcels, copy owner values, edit the Master Control Spreadsheet, or publish a site. Publication waits on G6.

## Context

The spine key grammar is already locked in [parcel-identity-spine.md](../parcel-identity-spine.md):

```text
hm:{country}:{region}:{jurisdiction}:{grain}:{local}
```

`{local}` must be unique inside that jurisdiction and grain. Native keys stay in `native_keys`. A native key is never silently promoted to the spine key.

Hamilton’s City parcel fabric (layer profile `LYR-HAM-PARCEL`, 166,828 polygons, 2026-10-17) publishes no parcel identifier. The only field is `OBJECTID`, a service row id. Addresses and buildings are the same (Q-002, Q-011). 83 stacked duplicate geometries share a shape (Q-001). NPCA Assessment_Parcels_Test carries a 15-digit ARN on 90,306 polygons, covering about 54% of City parcels after a constant shift (Q-004 / NA-276), with 275 reused ARNs and 189 NPCA polygons that each cover several City parcels (Q-006, Q-007).

The owner will attach arbitrary outside-world and user data to parcels soon after publishing. The ID therefore has to be:

1. **Permanent** — it survives a re-pull, a publisher field rename, and a later overlay.
2. **Opaque** — it does not encode geometry, an ARN, an address, or `OBJECTID`.
3. **Never reused** — a split, a merge, or a deletion retires the old ID; a new unit gets a new ID; the retired string is not issued again.

Geometry fingerprints (rounded representative point plus area, EPSG:26917) and roll numbers are matching aids only. That decision is already **firm** in `heavymap-planning/focus/hamilton/DECISIONS.md` (2026-10-17, identity).

Rochester is a different case: [rochester-parcel-local-token.md](../rochester-parcel-local-token.md) (NA-80) recommends copying the 20-character text SBL into `{local}` because that publisher *has* a stable public id. Hamilton does not. This ADR does not rewrite Rochester.

## Decision

1. **Mint `{local}` as a Crockford Base32 ULID** (26 characters, 128 bits: 48-bit millisecond time + 80-bit randomness). The full parcel id is:

   ```text
   hm:ca:on:hamilton:parcel:{ULID}
   ```

   Address and building (footprint) grains use the same local form:

   ```text
   hm:ca:on:hamilton:address:{ULID}
   hm:ca:on:hamilton:footprint:{ULID}
   ```

2. **One parcel ID per distinct City geometry.** Stacked duplicate polygons collapse to one ID. Source `OBJECTID` values are aliases, not the ID (Q-001).

3. **IDs are never reused.** The registry keeps retired rows. The minting factory is primed with every previously issued local token. Splits and merges mint new IDs and write lineage (`split_into`, `merged_from`). A 1:1 redraw with IoU below 0.9 is `replaced_by` (new ID, parent retired).

4. **Matching aids stay beside the ID.** Fingerprint and `geom_hash` are how a re-pull finds the same unit (hash first, then IoU ≥ 0.9). ARN is an attached attribute with match grades `exact_1to1`, `one_to_many`, `many_to_one`, `unmatched`, and `not_in_coverage`. It is never `{local}`.

5. **The registry is a versioned CSV set plus a `MANIFEST.json`**, defaulting to gitignored `local-data/heavymap-registry/hamilton/`. Parquet is not required for v1 (stdlib only). The path is configurable.

## Why ULID, not UUID or a content hash

| Option | Permanent | Opaque | Never reuse | Sortable in dumps | Collision | Notes |
|---|---|---|---|---|---|---|
| Crockford ULID | yes | yes (no geometry or ARN in the string) | yes, if the issued set is retained | yes (time prefix) | 80 random bits | 26 characters, no `I L O U`, URL-safe |
| UUID v4 | yes | yes | yes, same caveat | no | 122 random bits | 36 characters with hyphens; dumps shuffle |
| Hash of geometry | until the shape moves | no — the land is in the ID | a resurvey would mint a new id *and* look like the old land | n/a | hash size | Contradicts “fingerprint is a matching aid” |
| ARN / roll number | no — 46% of Hamilton has none; 275 NPCA rows reuse an ARN | no | reused in source | n/a | n/a | Matching aid only (firm) |
| `OBJECTID` | no — service row id | no | reused on republish | n/a | n/a | Alias only |

ULID is the smallest token that is opaque, lexicographically time-ordered (useful in run directories and lineage CSVs), and Crockford-encoded so humans reading logs do not mix `0`/`O` or `1`/`I`. The time prefix is minting time, not a fact about the land; it is not a vintage claim.

A content hash would make the ID change when the City redraws a boundary by a metre, which is the opposite of what the owner needs when attaching outside data.

## Consequences

- Hamilton spine keys will not be reconstructible from an ARN, an address, or a downloaded `OBJECTID`. Lookups go through the registry.
- Re-pulls must run the reconciliation rule in `heavymap/ids/registry.py`. They must not mint a fresh ULID for a parcel that already matched.
- Tests inject a clock and RNG so ULID *format* is checked without depending on wall time. Production uses `os.urandom` and wall-clock milliseconds.
- Vocab `spine_key.regex` already allows this local form (`[A-Za-z0-9][A-Za-z0-9._-]*`). Synthetic `SYN-` illustrations (Welland, Erie) stay as illustrations.
- NA-86 (spatial-join grading `exact` / `good` / `weak` / `refused`) is **not** closed here. Registry grades `exact_1to1` / `one_to_many` / `many_to_one` / `unmatched` / `not_in_coverage` are the attachment vocabulary from the 2026-10-17 spine check. Mapping them onto NA-86 is an open decision.

## Non-goals

This record does not mint Rochester or Welland locals, choose a Parquet emitter, pull Hamilton layers into git, surface a map, or decide how the remaining ~46% of Hamilton parcels get an ARN (`not_in_coverage` until another roll source is admitted).

## Code

| Piece | Path |
|---|---|
| Format and factory | `heavymap/ids/format.py` |
| Corrections (NPCA shift) | `heavymap/ids/config.py` |
| Mint, attach, reconcile | `heavymap/ids/registry.py` |
| CLI | `python3 -m heavymap.ids` and `scripts/mint_hamilton_registry.py` |
| Tests | `tests/test_heavymap_ids.py` |
| Operator notes | [heavymap-id-registry.md](../heavymap-id-registry.md) |
