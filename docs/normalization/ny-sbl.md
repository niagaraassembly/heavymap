# New York SBL text normaliser (NIA-79)

`heavymap/ny_identifiers.py` is a standard-library helper for comparing NY parcel identifiers as text and rendering observed print-key conventions. Its [source notes](ny-sbl-sources.md) cite ORPTS and NYS GIS definitions; [real-data evidence](ny-sbl-real-data-evidence.md) states the measured coverage and residual disagreements. The module makes no network requests.

The ORPTS PTF layout gives `section[3] + subsection[3] + block[4] + lot[3] + sublot[3] + suffix[4]` (20 characters). `validate_sbl20` accepts a 20-character ASCII alphanumeric string with numeric first 13 characters. Real sublots and suffixes contain letters, so digit-only validation was wrong. Leading zeros and case are preserved. Shorter SBLs occur in the public layers, but this strict **SBL20** validator does not pad them or claim they form a 20-character join key. A float, integer, boolean, null, punctuation-bearing value, or unsupported width is refused with a code.

`validate_swis6` requires six digits. ORPTS defines the pairs as county, city/town, and village; its code list identifies `261400` as City of Rochester and `261500` as its separate County Roll code. `compose_swis_sbl` and `validate_swis_sbl_id` use 6+20 characters. Monroe's `swis` field holds municipality names, so it cannot enter either helper without an explicit name-to-code crosswalk. `countysbl` remains a source attribute; malformed or short values do not become a composite by padding. Print keys are for display, never cross-layer joins.

## Print-key styles

`render_print_key(sbl20, style, *, swis6=None)` renders observed common forms. It does not replace the publisher's own print key when available.

| Style | Measured source | Key differences |
|---|---|---|
| `padded` | Rochester city and Monroe county | Three-digit section whole; subsection at least two digits; sublot keeps leading zeros and trims trailing zeros; suffix uses `/`. |
| `erie` | Statewide Erie | Unpadded section whole, at least two subsection digits including `00`; sublot trims leading/trailing zeros; suffix uses `/`. |
| `genesee` | Statewide Genesee | Unpadded section whole, empty subsection after the dot for `000`; nonzero subsection needs `swis6`: `180200` keeps all three digits, while `182400` and `184289` display two-digit numeric form. Without a supported SWIS, refusal is `unknown_section_rendering`. |
| `chautauqua` | Statewide Chautauqua | Three-digit section whole, two-digit numeric subsection, numeric sublot without left padding, dot before suffix. |
| `unpadded` | Compatibility with the two pilot examples | An unpadded whole and empty fraction for `000`. It is not a general statewide style; use the named county style for measured parity. |

Examples from ID-only pulls: `04628000010050040000` → `046.28-1-5.004` (`padded`); `04761000010030020101` → `047.61-1-3.002/101`; `0612900003017000HOME` → `061.29-3-17./HOME`; `00300000010010000000` → `3.-1-1` (`genesee`); `13100000030020010000` → `131.00-3-2.1` (`chautauqua`). Publisher exceptions and blank print keys still exist and are counted in the evidence document.

## Refusal stamps and duplicate reporting

`IdentifierRefusal.code` is an input or rendering stamp, separate from architecture claim refusals such as `not_joined`. Current codes are `float_stored_input`, `bare_number_type`, `unsupported_type`, `empty_input`, `wrong_length`, `invalid_character`, `unsupported_sbl_shape`, `non_digit` (SWIS only), `swis_name_not_code`, `unknown_print_style`, `unsupported_print_components`, `unknown_section_rendering`, and `unknown_identifier_kind`. A scientific-notation string is refused, never parsed. The 1996/2012 float-stored Rochester assessment fields cannot be repaired by padding.

`inspect_ids(values, kind)` reports every occurrence of repeated valid IDs with zero-based input positions and separately reports rejected rows with the refusal code. It never folds rows or chooses a polygon. Under NIA-80, a repeated City `PARCELID` mints **one** key; its outline remains `not_joined` until geometry is resolved. No part suffix is minted. The 2024 city layer has one four-row duplicate group; full Monroe has 20 duplicate `countysbl` groups, including 40 empty values. The empty values are rejected before duplicate reporting, so `inspect_ids` reports 19 valid county groups on that population.

Run `python3 -m unittest discover -s tests -v </dev/null`. No MCS cells were changed. `misc/niagara-atlas/` and `babbworks/atlas` are prior-art baselines only.
