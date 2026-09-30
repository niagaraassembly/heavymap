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
| Rochester `PARCELID` is text SBL20; Monroe `countysbl = 261400 + PARCELID` in 45/45 pilot matches | **Pilot verified only.** Recheck on pulled rows; no publisher source proves this cross-service equality. |
| 6/4/6/4 storage split | **Verified field widths** by PTF layout; concatenation and every character still need data checks. |
| Six-digit prefix is a SWIS code | **Verified** by ORPTS list for `261400`, and SWIS+SBL semantics by NYS GIS dictionary. |
| `3.-1-1` Genesee shape | **Inferred** until a matching record is pulled. |
| Refuse nonzero suffix and fractional lot | **Contradicted as a general absence claim** by ORPTS examples; actual rendering needs data tests. |
| City/county padded, state unpadded | **Pilot observation only**; measure all available shapes and exceptions. |
| SBL20 always digits | **Unverified**; PTF fields are digit-filled but utility guidance allows a letter in some local suffixes. Measure public values. |

**Must confirm before hard-coding:** exact publisher print-key rendering by shape and source; treatment of ambiguous/missing values; whether any letter-bearing 20-character values occur in these layers. No authoritative statewide rule found for removing leading/trailing zeros or for every exception in public `PRINT_KEY` exports.
