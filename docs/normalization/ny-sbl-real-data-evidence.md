# NIA-79 real identifier evidence

Read 2026-09-30. The reproducible ID-only checker is `scripts/ny_identifier_real_check.py`. Its complete per-row failure list and **all distinct print-key shapes with counts and stamped ID examples** are in ignored `local-data/checkpoints/02-samples-and-failures.md`. This committed summary contains counts and a few small identifier-only shape examples, not raw pulls or owner fields. The source definitions and claim-status table are in [ny-sbl-sources.md](ny-sbl-sources.md).

## Pulls and coverage

Every pull used public ArcGIS `query` GET, `returnGeometry=false`, paging, and only explicit identifier fields. Raw responses are ignored under `local-data/pulls/`. No owner or mailing field was requested. The [city live](https://maps.cityofrochester.gov/server/rest/services/Open_Data/Tax_Parcels_Open_Data/FeatureServer/0), [city 2024](https://maps.cityofrochester.gov/server2/rest/services/Open_Data/TaxParcel2024/FeatureServer/0), [Monroe](https://maps.monroecounty.gov/server/rest/services/Hosted/Parcels_Public/FeatureServer/0), and [NYS statewide](https://services6.arcgis.com/EbVsqZ18sv1kVJ3k/arcgis/rest/services/NYS_Tax_Parcels_Public/FeatureServer/1) layer metadata supplied field names and page limits.

| Source | Layer rows | Checked | Pages and spread | Accepted SBL20 | Refused validation | Exact rendered print key | Render mismatch |
|---|---:|---:|---|---:|---:|---:|---:|
| Rochester live, `PARCELID` | 64,709 | 64,709 | all 13 pages | 64,707 | 2 | 64,695 | 12 |
| Rochester 2024, `PARCELID` | 64,828 | 64,828 | all 13 pages | 64,827 | 1 | 64,824 | 3 |
| Monroe full, `countysbl` after six-character prefix | 267,962 | 267,962 | all 134 pages | 263,183 | 4,779 | 262,786 | 397 |
| Monroe county-wide spread sample | 267,962 | 32,000 | 16 pages across offset range | 31,410 | 590 | 31,374 | 36 |
| Monroe `261400` subset | 64,655 | 64,655 | all 33 pages | 64,111 | 544 | 64,077 | 34 |
| NYS Genesee | 28,266 | 28,266 | all 29 pages | 28,043 | 223 | 28,029 | 14 |
| NYS Erie | 370,424 | 20,000 | 20 pages across offset range, 17 observed SWIS values | 19,936 | 64 | 19,924 | 12 |
| NYS Chautauqua, Niagara substitute | 88,396 | 8,000 | 8 pages across offset range, 11 observed SWIS values | 7,972 | 28 | 7,971 | 1 |

The statewide [Niagara count query](https://services6.arcgis.com/EbVsqZ18sv1kVJ3k/arcgis/rest/services/NYS_Tax_Parcels_Public/FeatureServer/1/query?f=json&where=COUNTY_NAME%20%3D%20%27Niagara%27&returnCountOnly=true) returned **0**. The [NYS layer description](https://gisservices.its.ny.gov/arcgis/rest/services/NYS_Tax_Parcels_Public/FeatureServer/1) lists contributing counties and omits Niagara. Niagara County's public REST [service root](https://gis.niagaracounty.com/arcgis/rest/services) and its `Hosted` and `NC_GIS` folders did not expose a county parcel service in this pass. Thus Niagara is **not available from the named statewide layer**, and no Niagara-specific print-key claim is made. Chautauqua supplies the 8,000-row substitute. This does not mean Niagara has no parcels.

## What the records establish

The [ORPTS PTF field layout](https://www.tax.ny.gov/pdf/ORPTS/ptf-standard-layout.pdf) explicitly gives 3+3+4+3+3+4 characters. The real shapes below support their concatenation in many 20-character values but also show short and malformed publisher values. A numeric-only SBL validator would wrongly refuse valid letter suffixes. Counted nonzero sublots / suffixes: city 2024 **8,204 / 803**, Monroe full **32,756 / 523** among accepted values, Genesee **11,428 / 514**, Erie sample **2,859 / 1,153**, and Chautauqua sample **1,156 / 111**. The 2024 city layer has **252** non-digit 20-character IDs; Genesee has **418**. `00300000010010000000` really prints `3.-1-1` in Genesee. A city value with suffix `HOME` prints with `/HOME`; a Chautauqua letter suffix uses a dot. These forms are in the small tests.

Observed distinct print-key shape counts: live city **42**, 2024 city **39**, Monroe full **97**, Genesee **110**, Erie sample **85**, Chautauqua sample **19**. The checker lists every shape, count, and one stamped example. Most common shapes are `999.99-9-99` in city (47,696), Monroe (187,171), and Chautauqua (5,411); `9.-9-99` in Genesee (4,736); and `99.99-9-99` in Erie (6,016). The literal shape count makes clear that “statewide unpadded” is too broad: Chautauqua keeps a three-digit section whole and `.00`, Erie drops leading whole zeroes but keeps `.00`, and Genesee can leave the subsection empty. Genesee `SWIS=180200` prints nonzero subsections with three digits; `182400` and `184289` use a two-digit numeric form. This is observed, not an ORPTS universal formatting mandate.

The [ORPTS SWIS definition](https://www.tax.ny.gov/pubs_and_bulls/orpts/tentasmtroll.htm) gives county / city-town / village digit pairs. All 28,266 Genesee rows have a `18` SWIS prefix; all 20,000 Erie rows have `14`; all 8,000 Chautauqua rows have `06`. These match the county headings in the [ORPTS SWIS code list](https://www.tax.ny.gov/pdf/publications/orpts/swis-codes.pdf). `SWIS_SBL_ID = SWIS + SBL` in all Genesee and Erie sampled rows and 7,972/8,000 Chautauqua rows; the other 28 have null SBL. This directly matches the [NYS GIS dictionary](https://gis.ny.gov/system/files/documents/2022/08/nys-tax-parcels-data-dictionary.pdf). The ORPTS list explicitly assigns `261400` to City of Rochester and separately lists `261500` as City of Rochester, County Roll. The code meaning for **261400** is therefore confirmed beyond NIA-81's earlier inferred label. NIA-81's name-to-code ambiguity remains: the full Monroe pull still contains minority prefixes such as `233200` and `050040`, and 40 empty composites. No crosswalk is minted here.

The city/county comparison is version-sensitive. For the live city layer, **64,047/64,709** distinct `PARCELID` values have a `261400` Monroe composite, and **all 64,047** share a print key. For City 2024, **63,908/64,825** distinct IDs have a county composite and **63,890** share a print key (18 print-key disagreements). This upgrades the 45/45 pilot without claiming complete population equality. The full 2024 city has **64,828 rows, 64,825 distinct IDs**: one SBL occurs four times. Full Monroe has **267,962 rows, 267,904 distinct `countysbl` values**: 20 repeated groups and 58 extra rows, of which 40 empty IDs contribute 39 extra rows. `inspect_ids` rejects those empty IDs and reports 19 valid duplicate groups without folding or choosing a polygon. This is consistent with NIA-80's one-key, `not_joined` geometry decision. In Genesee, 28,266 rows have 18,774 distinct bare SBLs, but only **2** duplicate `SWIS_SBL_ID` groups; bare SBL is not a county-wide join key.

## Every residual failure cause

The complete stamped row list is in checkpoint 02. Counts here are disjoint within each source; the Monroe spread and `261400` subset overlap the full Monroe population.

| Source | Validation refusals by code | Render disagreements by cause |
|---|---|---|
| City live | `wrong_length` 1; `invalid_character` 1 | 9 blank publisher print keys; 3 unusual lot/sublot values |
| City 2024 | `wrong_length` 1 | 3 unusual lot/sublot values |
| Monroe full | `wrong_length` 4,612; `invalid_character` 127; `empty_input` 40 | 361 blank publisher print keys; 33 lot/sublot differences; 3 subsection differences |
| Monroe spread sample | `wrong_length` 568; `invalid_character` 18; `empty_input` 4 | 36 differences, listed in checkpoint |
| Monroe `261400` subset | `wrong_length` 544 | 34 differences, listed in checkpoint |
| Genesee | `wrong_length` 223 (16-character SBLs) | 12 suffix/lot differences, including publisher `/.P` and a changed suffix letter; 2 block padding differences |
| Erie | `wrong_length` 64 (16-character SBLs) | 12 suffix/lot differences, including six expanded text suffixes and five case differences |
| Chautauqua | `unsupported_type` 28 (null SBL) | 1 lot-number disagreement |

The 16-character statewide strings are **real published identifiers**; the SBL20 validator refuses them because it cannot form a 20-character join ID without adding data. Monroe also has 17–19-character local parts and 127 punctuation-bearing composites. Those remain visible as source strings, with explicit refusal codes. A blank print key or a disagreement is never silently replaced in a source record by the computed rendering. Where the publisher disagrees, the stored publisher value remains the display value and the checker stamps a mismatch. A general formatter for those exceptions needs a publisher rule or a direct source-value lookup.

## Self-review: weakest assumptions

1. **The observed 20-character concatenation is stable across vintages.** A future ORPTS layout or a county record whose separately supplied fields do not concatenate in this order would disprove it.
2. **The Monroe padded profile covers its normal 20-character records.** A valid nonblank Monroe print key with a systematic alternative section width would disprove it; the three measured subsection disagreements already warn against 100% claims.
3. **Genesee's SWIS-specific subsection widths are stable.** A new `180200`, `182400`, or `184289` record printing the same raw subsection with the opposite width would disprove it; an unobserved Genesee SWIS with nonzero subsection is currently refused.
4. **A letter in the sublot or suffix is preserved as source text.** A publisher rule that expands or changes it, as seen in a few Erie values, disproves an exact renderer for that form; these rows are recorded as mismatches.
5. **The 20-character join contract should exclude short publisher SBLs.** An authoritative NYS key specification proving that a 16-character SBL can be joined to a 20-character one without adding or guessing digits would overturn the strict refusal.
6. **A repeated city PARCELID represents one identity.** A publisher-provided part identifier that defines separate parcels under the same 20-character string would require revisiting NIA-80's one-key policy; no geometry was read here.
7. **Offset-spread Erie and Chautauqua samples expose important municipality variants.** An unvisited SWIS or OBJECTID interval with a new print grammar would disprove that coverage; the scripts report only sampled parity for those counties.

## Open questions

- Niagara County's own public identifier layer and print-key convention remain unmeasured. The named statewide layer has zero Niagara rows.
- Are the 16-character statewide SBLs intentionally short local IDs, or truncated versions of a 20-character code? No authoritative source found; no padding rule was invented.
- Who owns the blank or contradictory publisher print keys, and should a future ingest use the source key or an explicitly stamped computed display fallback? This module keeps them separate.
- NIA-81 should cite the ORPTS `261400` assignment while retaining its unresolved minority name/prefix pairs. NIA-80's duplicate geometry policy remains a separate decision.

No MCS cells changed. MPAC remains `not_licensed`; NPCA-derived layers and UK geography were not ingested. `niagara-atlas/` and `babbworks/atlas` were prior-art baselines only.
