# Synthetic parcel fixtures

These two JSON files are the Canadian and American walkthrough units from the architecture documents. They exist so vocabulary, a future normalize step, and UI can share the same fake units without waiting on a jurisdiction dig.

**Synthetic only.** They illustrate the Parcel Context Display Protocol. They are not observations of real land, not a parcel index, and not production data.

Do not publish them as real parcels. Do not treat the coordinates as a survey. Do not load them onto a public map as municipal or county data. Do not copy them into the Master Control Spreadsheet.

## Units

| File | Spine key | Grain |
|---|---|---|
| [`hm-ca-on-welland-footprint-SYN-0142.json`](hm-ca-on-welland-footprint-SYN-0142.json) | `hm:ca:on:welland:footprint:SYN-0142` | `footprint` |
| [`hm-us-ny-erie-parcel-SYN-999.json`](hm-us-ny-erie-parcel-SYN-999.json) | `hm:us:ny:erie:parcel:SYN-999.00-1-1.1` | `parcel` |

The American filename stops at `SYN-999`. The file body carries the full spine key, including the SBL local part `SYN-999.00-1-1.1`.

Each file is the **maximum** walkthrough snapshot. Every ladder rung is either a stamped claim or exactly one refusal reason. That snapshot still carries the minimum presentation: outline or polygon, spine key, grain, a jurisdiction sentence, and the refusals. Dates on stamps are illustrative placeholders. Nothing in this folder was fetched.

## Where the contract lives

Walkthrough prose, which these files follow:

- [Parcel Context Display Protocol](../../docs/architecture/PCDP.md)
- [Parcel Identity Spine](../../docs/architecture/parcel-identity-spine.md)
- [Context Band Ladder](../../docs/architecture/context-band-ladder.md)
- [Claim & Refusal Contract](../../docs/architecture/claim-refusal-contract.md)

Machine tokens, which these files do not extend:

- [docs/architecture/vocab/](../../docs/architecture/vocab/README.md)

Closed values used here are only those tokens: band order, rung status (`filled`, `refused`), surfaces (`dossier`, `share`, `export` on this maximum snapshot), refusal reasons (`not_in_coverage`, `not_licensed`, `not_joined`), evidence grades, join methods, assertion state `supported`, grain, and the two spine keys above. Reading identifier `floor_area_m2` is the illustrative identifier from the claims document. `coverage_ratio` appears only as a refused object. `employment_interval` is not listed, because the Canadian derived-readings rung is refused.

Linear **NIA-16**. No site publish, no live parcel fetch, no map UI, no spreadsheet edits.
