# NIA-79: New York identifier sources (research checkpoint)

Read before implementation on 2026-09-30. These are publisher definitions; record-level claims are tested separately in [ny-sbl-real-data-evidence.md](ny-sbl-real-data-evidence.md).

| Source | Publisher statement and consequence |
|---|---|
| [ORPTS PTF standard layout](https://www.tax.ny.gov/pdf/ORPTS/ptf-standard-layout.pdf) | Defines separate text fields of section 3, subsection 3, block 4, lot 3, sublot 3, suffix 4 characters. Their lengths total 20. Defines SWIS as six-digit text and PRINT KEY as a separate 30-character text field. Confirms the 6/4/6/4 grouping **as a field-length inference from explicit fields**, not a universal print-key punctuation algorithm. |
| [ORPTS Assessor's Manual, commercial parcel identification](https://www.tax.ny.gov/pdf/publications/orpts/manuals/comm_manual_published.pdf) | Tax map number is a 20-character parcel identifier derived from section-block-lot; SWIS is a six-character numeric jurisdiction identifier. Confirms text width, not every allowed character in every county export. |
| [ORPTS tax mapping guide](https://www.tax.ny.gov/research/property/assess/gis/taxmap/guide/index.htm) | Map numbers have section, block and lot; sections can have decimal subdivisions and a split lot gains a suffix. Example `10.16-1-24`. Contradicts the assumption that suffixes cannot be real. |
| [ORPTS utility SBL format](https://www.tax.ny.gov/research/property/valuation/ucars/sbl.htm) | Explicit `ABB.CCC-DDDD-XXX.YYY-ZZZZ` pseudo-SBL format for utility parcels, including nonzero sublot and suffix, possibly an alphanumeric final suffix character in some local libraries. This describes utility pseudo-SBLs and cannot by itself establish every public parcel renderer. |
| [ORPTS assessment roll overview](https://www.tax.ny.gov/pubs_and_bulls/orpts/tentasmtroll.htm) and [RPS V4 glossary](https://www.tax.ny.gov/research/property/assess/rps/support/glossary.htm) | SWIS digits 1–2 = county, 3–4 = city or town, 5–6 = village if any. This confirms the structure, with municipality exceptions and county-roll codes to be checked against the code list. |
| [ORPTS SWIS municipal reference list](https://www.tax.ny.gov/pdf/publications/orpts/swis-codes.pdf) | Lists `261400` as City of Rochester and `261500` as City of Rochester, County Roll. Thus the Monroe prefix is an official SWIS code; do not collapse the two codes. List dated 2019, so current assignment needs live confirmation. |
| [NYS tax parcels data dictionary](https://gis.ny.gov/system/files/documents/2022/08/nys-tax-parcels-data-dictionary.pdf) | `SWIS_SBL_ID` concatenates SWIS and SBL, and multipart geometry may repeat that ID. `SWIS_PRINT_KEY_ID` concatenates SWIS and PRINT_KEY. Confirms the composite semantics and that duplicate polygons are possible. |
| [NYS standardized tax parcel dictionary](https://gis.ny.gov/standardized-tax-parcel-data-dictionary) | Publisher's current field dictionary; SBL, print key, and SWIS are distinct fields. The dictionary does not state a single universal print-key formatting rule. |
| [ORPTS RP-5217 transfer FAQ](https://www.tax.ny.gov/pit/property/new-homebuyers/rp5217-qanda.htm) | The six-digit SWIS code is not part of the printed tax-map identifier. |
| [ORPTS tax bill examples](https://www.tax.ny.gov/pit/property/star/sample-tax-bills.htm) | Tax map number is also called SBL or print key in bill-facing usage. The same terms do not imply identical storage formats. |

## Verified / inferred / must confirm before building

| Pilot claim | Status after publisher research |
|---|---|
| Rochester `PARCELID` is text SBL20; Monroe `countysbl = 261400 + PARCELID` in 45/45 pilot matches | **Measured beyond pilot:** live city 64,047/64,709 distinct IDs join to a `261400` county composite with equal print key; 2024 city 63,908/64,825 join and 63,890 have equal print keys. Different vintages explain why neither population is 100%; see [real-data evidence](ny-sbl-real-data-evidence.md). |
| 6/4/6/4 storage split | **Verified field widths** by PTF layout; concatenation and every character still need data checks. |
| Six-digit prefix is a SWIS code | **Verified** by ORPTS list for `261400`, and SWIS+SBL semantics by NYS GIS dictionary. |
| `3.-1-1` Genesee shape | **Verified:** `00300000010010000000` has `3.-1-1` in the Genesee pull. |
| Refuse nonzero suffix and fractional lot | **Contradicted:** 8,204 sublots and 803 suffixes in 2024 city; 11,428 sublots and 514 suffixes in Genesee. Common punctuation is implemented; residual publisher exceptions are counted in the evidence document. |
| City/county padded, state unpadded | **Contradicted as a universal layer rule:** Rochester/Monroe use a three-digit section whole; Erie unpads it; Genesee has two subsection precisions keyed by SWIS; Chautauqua keeps three digits and two fraction digits. See per-source match counts. |
| SBL20 always digits | **Contradicted:** 252 city 2024 identifiers and 418 Genesee identifiers contain non-digit characters, mostly letter suffixes; malformed punctuation and short values also occur. |

**Must confirm before expanding beyond measured forms:** treatment of short `SBL` values and malformed composites as join IDs; source exceptions where `PRINT_KEY` disagrees with a deterministic rendering; the Niagara County publisher's own identifier format. No authoritative statewide rule was found for removing leading/trailing zeros or for every exception in public `PRINT_KEY` exports.
