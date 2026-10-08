# Rochester parcel local token

**Status:** recommendation for review, 2026-09-30. Linear **NIA-80**, under Epic 2 **NIA-24** (gate G2). Docs and one synthetic fixture. Not a locked rewrite of the spine illustration.

**MCS:** no cells changed. No `dataset_id`.

This note says how a City of Rochester parcel gets the `{local}` part of its HeavyMap key. It does not fetch parcels, sample owner names, edit the Master Control Spreadsheet, or publish a site. Publication waits on G6.

## Recommendation

Use the **20-character section-block-lot as text** (`SBL20`). On the city layer that string is `PARCELID`. Copy it unchanged into the local token.

```text
hm:us:ny:rochester:parcel:{SBL20}
```

Example of the **shape**, from the 2026-09-30 pilot (a real city id, cited as evidence, not loaded as a fixture row): city `PARCELID` `04762000010220000000`, padded print key `047.62-1-22`, Monroe `countysbl` `26140004762000010220000000`. The fixture in this repo uses a different 20-digit string so the file is not that parcel.

The print key stays a **display** native key. It is not `{local}`.

This copies the publisher’s digit string into `{local}` on purpose. The same characters remain in `native_keys` under the publisher’s field name (`PARCELID`). That is a named minting rule. It is not a silent promotion, and it does not promote the print key.

The Erie walkthrough in [parcel-identity-spine.md](parcel-identity-spine.md) still uses a print-key-shaped local (`SYN-999.00-1-1.1`). That illustration is not rewritten here. Rochester is the place the pilot showed the padding split.

## Why the print key is not the token

Print-key padding is a property of the layer, not of the land.

| Layer | Print-key shape | Parcel id beside it |
|---|---|---|
| City of Rochester (`PARCELID`, `PRINTKEY`) | padded, `047.62-1-22` | 20-character text |
| Monroe `Parcels_Public` (`printkey`) | padded, same city example | `countysbl`, 26 characters |
| NYS Tax Parcels Public (`PRINT_KEY`) | unpadded, `47.18-1-33`, and `3.-1-1` | `SBL` 20 characters; `SWIS_SBL_ID` 26 |

Consequences:

- A string compare of print keys across layers fails when one side keeps the leading zero and the other drops it (`047.62-1-22` versus `47.62-1-22`).
- Monroe `printkey` is not unique county-wide: 267,357 distinct values in 267,962 rows (pilot, 2026-09-30).
- City `PARCELID` is the same 20-character shape as the statewide `SBL`. The statewide layer has **0 features for Monroe** and **0 for Niagara County**. It cannot supply Rochester’s token. A `CITYTOWN_NAME` of Rochester on that layer is a name collision (Ulster County in the pilot), so the name is not a join.
- The 1996 and 2012 Rochester assessment tables store `SBL` / `SBL20` as a **floating-point number**. Digits are already gone (`4.62800001001e+18` in the pilot). Zero-padding does not repair them (0 matches in the pilot samples). Those vintages are `not_joined` by id. A float, an integer, or a scientific-notation string must not be cast into a token.

`SBL20` is text. Leading zeros are part of the token (`04762…` is not `4762…`).

## County composite

Compare New York parcels on **6-digit prefix + SBL20** (26 characters). Do not compare print keys across layers. Do not compare Monroe `swis` to statewide `SWIS`: Monroe’s field holds a **municipality name** (or null); the state’s field holds a **code**.

For the city, the pilot matched `countysbl` = `261400` + `PARCELID` on **45/45** samples, with the same padded print key on every hit. Monroe has 64,655 rows with that prefix: 64,629 with `swis` = `City of Rochester`, and 26 with null `swis`.

**Unconfirmed.** Reading `261400` as a SWIS code is **inferred from the values**, not from a Monroe code table. Keep the six digits as a native prefix. Do not stamp them as an official SWIS code until a code table says so. The same caveat is in the NIA-81 crosswalk (PR #54, not required for this note). That crosswalk marks `261400` + `City of Rochester` as `inferred_from_prefix` and leaves the 26 null-name rows unresolved.

A null `swis` on a `261400` county row does not mint a second municipality and does not, by itself, mint `rochester`. If the same 20 characters exist on the city layer, the city row is what mints the key and the county row joins to it. A `261400` row with no city match stays `not_joined`.

## Slug

`rochester` is the recommended jurisdiction slug for **city-published** parcel polygons. The spine slug is the publishing government of the grain. The City of Rochester publishes `PARCELID`. Monroe County is the geography-v1 county name and the publisher of `countysbl`, which stays a native key.

This does **not** assign slugs to other Monroe municipalities. Their prefixes are a separate crosswalk, and the code meaning is still inferred. A single `monroe` slug for every town would hide the city publisher. Whether those other municipalities wait, or use `monroe` until a confirmed code table exists, is an open decision (Epic 2 decision 3). This note mints no `hm:us:ny:monroe:…` key.

## Native keys that stay

| Published field | Retained as | Role |
|---|---|---|
| `PARCELID` / `SBL` | 20-character digit text | Source of `{local}`. Also kept under its own field name. |
| `PRINTKEY` / `printkey` | text, city/county padded form | Display only. |
| Statewide `PRINT_KEY` | text, unpadded, when a row exists | Not a join key. Monroe has no statewide row. |
| `countysbl` | 26-character digit text | County composite. Join key against `prefix + SBL20`. |
| `swis` | municipality name, as published | Not compared to a code. |
| Six-digit `countysbl` prefix | 6-character digit text | Candidate code only. Meaning inferred. |
| `GISSBL` | 10-character variant | Not equal to `SBL20`. Not the token. |
| `SBL_1` | free text, sometimes several parcels | Not the token. A later parse is a fuzzy join, not a mint. |

Housing-inventory `SBL` matched city `PARCELID` on 14/15 pilot samples. Where that field is the same 20-character text, it is the same token, not a second one.

## Duplicate rows, before a key is minted

City `TaxParcel2024`: 64,828 rows, 64,825 distinct `PARCELID`. Monroe: 267,962 rows, 267,904 distinct `countysbl`. Fold the **key** before minting. Do not fold by picking a polygon.

1. Accept only a 20-character ASCII digit string. Leading zeros stay. A float, an int, a bool, null, an empty string, a scientific-notation string, or any other length or non-digit does not mint. The source row is `not_joined`. Do not repair it.
2. Group city rows by that exact string. One group mints one key, `hm:us:ny:rochester:parcel:{SBL20}`.
3. Do not append a part suffix, an `OBJECTID`, or a row index to `{local}`. A second key would change when the extract’s order changed.
4. One row in the group: that polygon may be the outline.
5. More than one row in the group: still one key. Do not choose a winning polygon. The outline is `not_joined` until a later rule says the parts are one multipolygon or several units. The key exists either way.
6. County duplicates follow the same rule on the 26-character composite. A county composite mints a `rochester` key only by joining to a city `SBL20` that already minted under the rules above.

NIA-79 (`heavymap/ny_identifiers.py` on PR #53) can report repeated ids and refuse a float. It does not choose a winner. This note is that policy. This change does not import that module. The duplicate-geometry question (condo or multi-part polygon versus two units) stays open.

## Refusals on this key

| Object | Reason | What not to conclude |
|---|---|---|
| 1996 and 2012 float-stored `SBL` / `SBL20` | `not_joined` | That the parcel had no earlier assessment |
| NYS statewide parcel layer for Monroe | `not_in_coverage` | That the county has no parcels |
| Official SWIS code for prefix `261400` | `not_joined` | That the six digits are a confirmed code |
| Permits, violations, licences | `not_in_coverage` | That no activity exists |
| MPAC roll and assessed value | `not_licensed` | That the land is unassessed |

Owner-of-record fields (`OWNERNME1`, `PSTLADDRESS`, statewide `PRIMARY_OWNER`, `ADD_OWNER`, `MAIL_*`) are out of this token. They are not read, not stored on the fixture, and not required for the key. Masking at presentation follows D-13. Which Rochester layer is the ingest source (the owner-bearing snapshot versus the live open-data layer that has no owner fields) is Epic 2 decision 7, and it does not change `{local}`.

Snapshots **2014–2024** join on `PARCELID` when the parcel was not split or merged. How far back G2 requires that join is Epic 2 decision 10. Years stored as floats do not join by id.

## Fixture

[fixtures/parcels/hm-us-ny-rochester-parcel-SYN-04799.json](../../fixtures/parcels/hm-us-ny-rochester-parcel-SYN-04799.json)

Synthetic. Not a pulled row. The local token is `04799000010010000000` (leading zero kept). Padded display print key `047.99-1-1`. Unpadded contrast `47.99-1-1` is stored only to show why print keys are not compared. County composite `26140004799000010010000000`. All three identifiers are JSON strings. The file follows the NIA-16 parcel-fixture shape (PR #13): ladder order, stamped claims, one refusal reason each. Those NIA-16 files are not copied onto this branch.

## Still open

- **Decision 2.** Adopt `SBL20` as `{local}` (this recommendation), or keep a print-key local as in the Erie illustration.
- **Decision 3.** `rochester` for the city (this recommendation) and a later rule for other Monroe municipalities, or `monroe` for all until a SWIS table is confirmed.
- **Prefix meaning.** `261400` as SWIS is inferred, not confirmed.
- **Duplicate geometry.** One key per `SBL20` is the rule above. Multipolygon versus several units is not decided.
- **26 null-`swis` county rows** with prefix `261400` stay unresolved unless a city `PARCELID` matches.
- DataROC terms were not read (Epic 2 decision 9). Nothing here admits a layer for publish.

## References

- Spine grammar: [parcel-identity-spine.md](parcel-identity-spine.md). Vocabulary: [vocab/](vocab/README.md). Claim refusals: [claim-refusal-contract.md](claim-refusal-contract.md).
- Pilot evidence: Epic 2 study, Rochester section and joins matrix, read live 2026-09-30. Sample ratios are hits/tested, not population rates.
- NIA-79 normaliser, PR #53: `heavymap/ny_identifiers.py`, described in `docs/normalization/ny-sbl.md` on that branch. Referenced, not duplicated, and not required to be merged.
- NIA-81 SWIS crosswalk, PR #54: `docs/data/README-monroe-swis-crosswalk.md` on that branch. Same caveat on the prefix. Not required to be merged.
- Prior art only: `niagara-atlas/`, UK atlas (`babbworks/atlas`). No UK geography.
