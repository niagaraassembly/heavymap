# Synthetic parcel fixtures

**Synthetic only.** These files illustrate a spine key. They are not observations of real land, not a parcel index, and not production data.

Do not publish them as real parcels. Do not treat the coordinates as a survey. Do not load them onto a public map as municipal or county data. Do not copy them into the Master Control Spreadsheet. Do not store an owner name.

The NIA-16 walkthrough units (Welland footprint `SYN-0142`, Erie parcel `SYN-999.00-1-1.1`) live on PR #13 and are not copied into this folder. This file follows that shape: maximum snapshot, ladder order, stamped claims, one refusal reason each, vocabulary tokens only.

## Units

| File | Spine key | Grain | Linear |
|---|---|---|---|
| [`hm-us-ny-rochester-parcel-SYN-04799.json`](hm-us-ny-rochester-parcel-SYN-04799.json) | `hm:us:ny:rochester:parcel:04799000010010000000` | `parcel` | **NIA-80** |

The filename stops at `SYN-04799`. The body carries the full spine key. `{local}` is a 20-character digit string, not a `SYN-` prefix: the recommendation under test is that the permanent token is the text SBL. Synthetic-ness is the file flag.

Identifiers in the file are JSON strings: `SBL20` `04799000010010000000` (leading zero kept), padded print key `047.99-1-1`, county composite `26140004799000010010000000`. The unpadded string `47.99-1-1` is present only as a non-join contrast. A float is not used as an id.

## Where the contract lives

- [Rochester parcel local token](../../docs/architecture/rochester-parcel-local-token.md)
- [Parcel Identity Spine](../../docs/architecture/parcel-identity-spine.md)
- [Parcel Context Display Protocol](../../docs/architecture/PCDP.md)
- [Context Band Ladder](../../docs/architecture/context-band-ladder.md)
- [Claim & Refusal Contract](../../docs/architecture/claim-refusal-contract.md)
- [Vocabulary](../../docs/architecture/vocab/README.md)

Check: `python3 -m unittest tests.test_rochester_spine_fixture -v`

No site publish, no live parcel fetch, no map UI, no spreadsheet edits.
