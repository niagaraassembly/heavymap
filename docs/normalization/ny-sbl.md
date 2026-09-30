# New York SBL text normaliser (NIA-79)

This small Python 3.11 module is at `heavymap/ny_identifiers.py`. It uses only the standard library and never fetches data. Examples in tests are synthetic identifier strings shaped after the NIA-79 pilot findings; there are no owner fields or live rows.

```python
from heavymap.ny_identifiers import (
    IdentifierRefusal, compose_swis_sbl, inspect_ids,
    render_print_key, validate_sbl20, validate_swis6,
    validate_swis_sbl_id,
)

sbl = validate_sbl20("04762000010220000000")
join_id = compose_swis_sbl("261400", sbl)  # 26140004762000010220000000
print_key = render_print_key(sbl, "padded")  # 047.62-1-22
report = inspect_ids([sbl, sbl], "sbl20")  # duplicate positions (0, 1)
```

All accepted identifiers remain text, including leading zeroes. `validate_swis_sbl_id` checks an existing 26-character value. For cross-layer comparison, use **SWIS6 + SBL20** only. There is deliberately no print-key equality or parsing function. The proposed Rochester spine key is `hm:us:ny:rochester:parcel:{SBL20}`; this module does not mint keys or resolve duplicate rows. Native `PARCELID`, `countysbl`, and `PRINTKEY` values remain separate source attributes in any later pipeline.

`inspect_ids(values, kind)` accepts `sbl20` or `swis_sbl_id`. It reports every occurrence of repeated valid IDs using zero-based input positions and separately reports invalid rows with refusal codes. It does not pick or fold a winner; that policy belongs to NIA-80. A repeated SBL20 across two SWIS codes is not a duplicate composite ID.

## Refusal stamps

Functions raise `IdentifierRefusal`, whose `code` is machine-readable. `inspect_ids` returns the same codes in `BatchReport.rejected`. These are **NIA-79 input-validation codes**, newly defined here. They are distinct from the architecture's claim refusals (`not_joined`, `not_in_coverage`, `not_licensed`), which describe the status of a source or join.

| Code | Meaning |
|---|---|
| `float_stored_input` | Python float, including a damaged legacy SBL/SBL20 value; never cast or zero-pad |
| `bare_number_type` | Integer or boolean supplied where text is required |
| `empty_input` | Empty string |
| `wrong_length` | Text length is not 20 for SBL, 6 for SWIS, or 26 for the composite |
| `non_digit` | Text contains anything other than ASCII digits |
| `unsupported_type` | Other type, including null |
| `swis_name_not_code` | Municipality name supplied to the SWIS6 code validator |
| `unknown_print_style` | Style is not `padded` or `unpadded` |
| `unsupported_suffix` | Nonzero final four SBL characters; rendering is not established |
| `unsupported_fractional_lot` | Nonzero final three characters of the six-character lot; rendering is not established |
| `unknown_identifier_kind` | Batch kind is not `sbl20` or `swis_sbl_id` |

A scientific-notation **string** is also refused (length or non-digit), never parsed. The 1996/2012 floating-point assessment fields cannot be repaired by padding; retain a refusal rather than inventing a join.

## Print-key inference and limits

The pilot examples support a provisional 20-character split of `section[6] + block[4] + lot[6] + suffix[4]`. The section appears to split `whole[3] + fraction[3]`; trailing fractional zeroes are removed. The block is rendered as an integer. For the supported lot shape, its first three digits render as an integer and the final three are zero. A zero suffix is omitted. This reproduces `04762000010220000000` → `047.62-1-22` in the city/county padded style and `04718000010330000000` → `47.18-1-33` in the statewide unpadded style. With a synthetic `00300000010010000000`, the unpadded renderer produces the observed shape `3.-1-1`; the exact source SBL for the observed Genesee key was not supplied, so that case does not verify the split.

The padded style keeps the three-digit section whole; unpadded drops its leading zeroes. Both styles keep the section dot even when its fraction is empty. The renderers are display helpers, not authoritative publisher formatters. Nonzero suffixes and fractional lots are refused because the provided examples do not establish their punctuation or padding. Other section/block edge cases and the interpretation of each subfield need publisher confirmation before a general formatter is claimed.

Monroe's `swis` attribute contains municipality **names**, such as `City of Rochester`, while statewide `SWIS` is a six-digit code. Names cannot enter `compose_swis_sbl`; a name-to-code crosswalk belongs to NIA-81. The Monroe `countysbl` prefix `261400` matches the Rochester pilot values, but its interpretation as an official SWIS code is **inferred from values, not confirmed by a Monroe code table**. Keep that caveat with any later use of the prefix. The supplied pilot counts and match rates are observations from Morgen's 2026-09-30 study, not a verification performed by this module.

Run the tests with `python3 -m unittest discover -s tests -v`. No MCS cells or `dataset_id` values were changed. The `niagara-atlas/` and UK atlas (`babbworks/atlas`) are prior-art baselines only; this implementation adds no geography or dataset to either.
