# Data-gaps ledger

**Status:** code and sheet, 2026-10-17. Linear **NA-27** (dossier / transparent view), with **NA-24** (registry placeholder ARNs). Synthetic tests only in git.

The ledger is the machine-readable list of what was absent from a source or withheld from view, and why. It feeds a fully transparent HeavyMap view mode: empty, stale, placeholder, contradictory, too-sparse or corrupted, screened, and out-of-coverage are named, not painted over. Overlay slivers are a display rule (**flag, never extinguish**, PI-0063), not a gap type.

This is plumbing under the four-concept frame. It is not a fifth product name. Absence on a ladder rung is still a Claim & Refusal [refusal reason](claim-refusal-contract.md). Gap types below are a finer honesty vocabulary for held data and for screened fields. They do not add a fourth refusal reason.

Inventory: [`Spreadsheets/20-data-gaps-ledger.csv`](../../Spreadsheets/20-data-gaps-ledger.csv) (source of truth). Loader: [`heavymap/gaps.py`](../../heavymap/gaps.py). Per-parcel ids travel on the [dossier](parcel-dossier.md) record; repeated text stays in the ledger and the dossier manifest.

## Record schema

One row is one gap. `gap_id` is the stable key (`GAP-` plus a zero-padded number). Never reuse.

| Field | Required | Meaning |
|---|---|---|
| `gap_id` | yes | `GAP-0001`. Take the next free number. |
| `scope` | yes | Grain of the finding. Closed set below. |
| `jurisdiction` | yes | Spine jurisdiction slug, e.g. `hamilton`, or `cross-cutting`. |
| `layer_id` | when known | Sheet-17 layer id. Several values joined with ` \| `. Blank if the object is not a layer (a missing field across a family). |
| `field` | when the finding is about a named source field | Native field **name** only. Never a value (HARD-RULES 2, D-13). Blank when the field does not exist in the source. |
| `gap_type` | yes | Closed set below. |
| `reason` | yes | Plain-language subtitle for the UI. One or two short sentences. No owner values, no row dumps. |
| `numerator` | when counted | Count of the interesting subset (filled, missing, flagged). Blank if not counted. `0` is allowed when a scan found none (HARD-RULES 8). |
| `denominator` | when counted | Population the numerator is of. |
| `unit` | when counted | What the counts are: `rows`, `parcels`, `registry_links`, `layers_checked`. |
| `evidence` | yes | Where the count or absence was verified: PI ids, quirks, docs, PRs. No values. |
| `first_observed` | yes | ISO date `YYYY-MM-DD`. |
| `source_pi_ids` | yes | `PI-` ids that back the row, ` \| `-separated. |
| `parcel_attach` | yes | How a dossier record may cite this `gap_id`. Closed tokens below. |
| `status` | yes | `open`, `provisional`, `actioned`, or `superseded`. |
| `notes` | no | Internal. Not UI copy. |

CSV format follows HARD-RULES: UTF-8, LF, RFC-4180 quoting, ISO dates, text ids, no formula-leading cells, no semicolons or newlines inside cells, multiple values separated with ` | `.

### `scope`

| Token | Use it when |
|---|---|
| `dataset` | The finding is about a publisher family or a missing object across layers. |
| `layer` | The finding is about one layer (vintage, coverage, a constant field). |
| `field` | The finding is about one native field (empty, sparse, withheld, lookalike). |
| `parcel` | The finding is one spine unit. Seeded Hamilton rows are layer or field counts, not individual parcel rows. |

### `gap_type`

| Token | Use it when |
|---|---|
| `empty` | The field exists and is blank (or equivalent) on the counted rows. |
| `sparse` | The field exists and is filled on only a small share of rows. |
| `stale` | The layer or field is a known-old vintage relative to other sources in use. |
| `placeholder` | A documented sentinel stands in for a real value (all-zero ARN, constant `0`). |
| `contradictory` | Two stamped sources can disagree. Both stay. This row names the risk or a counted clash. |
| `corrupted` | Values are unusable (wrong encoding, truncated keys, irreparable geometry). Not a sliver. |
| `withheld_screened` | The field exists in the pull and is screened at the publish/display boundary. See below. |
| `not_in_coverage` | The spine unit or the counted share sits outside what this source covers. Maps to PCDP `not_in_coverage`. |
| `not_present_in_source` | We looked, and the publisher does not carry that object or field. Lookalikes are named in `reason`. |

`corrupted` is in the closed set so a later row can use it. Overlay slivers are **not** `corrupted` and **not** a gap: they stay in `overlays.rows` with `sliver: true` (PI-0063).

### `parcel_attach`

The dossier record holds only `gap_id` strings. Tokens decide which parcels cite which rows. Several tokens on one row are OR, joined with ` | `.

| Token | The parcel cites this gap when |
|---|---|
| `manifest_only` | Never copied onto a parcel. Dataset, layer and field rows still appear in the dossier manifest. Use this for `withheld_screened` and for fields the dossier does not read. |
| `coverage=not_covered` | Coverage status is `not_covered`. |
| `coverage=in_coverage_unmatched` | Coverage status is `in_coverage_unmatched`. |
| `coverage=arn_invalid` | Coverage status is `arn_invalid`. |
| `roll_flag=placeholder` | A roll entry has `flag` `placeholder`. |
| `has_valid_arn` | At least one roll entry shows a Hamilton ARN. |
| `has_valid_arn+missing_property_code` | Has a Hamilton ARN and none of those rolls carry `property_code`. |
| `has_valid_arn+has_property_code` | Has a Hamilton ARN and at least one `property_code`. |
| `overlay=<layer_id>` | An overlay row on this parcel has that `layer` id. |

`withheld_screened` rows must use `manifest_only`. Putting them on a parcel would read as “this parcel has a withheld owner,” which implies a value.

## `withheld_screened` without revealing values

A `withheld_screened` row states **that a named field exists** in a named source and **why it is not shown**. It does not state a value, a fill pattern that identifies a person, or that any one parcel’s row is populated.

Allowed on the row:

- field **name** (`Owner`, `Legal_Txt`)
- layer id and publisher
- a count of non-null rows, if it was already logged as a count (PI-0064)
- the rule: HARD-RULES 2, D-13, dossier source allowlist

Forbidden on the row, in the manifest, and in any dossier byte:

- owner names, mailing addresses, legal-description text, contact details
- an output key whose name contains `owner`, `legal`, `mail`, `postal`, `name`, `phone` or `email`

The dossier still does not **read** those fields (`SOURCE_FIELDS` in [`heavymap/dossier/schema.py`](../../heavymap/dossier/schema.py)). The ledger records their existence so the transparent view can say “this source has an owner-name field, and HeavyMap withholds it,” without the loader ever passing a value through.

`PostalCode` on Cityview is a different type (`empty`): the field exists and is blank on every row (PI-0064). It is also excluded from `SOURCE_FIELDS` because the key contains `postal`. That row is `manifest_only`.

## How it is wired

1. **Sheet 20** is the inventory. Agents append rows. They do not rewrite another session’s row except `status`.
2. **`heavymap.gaps.load_ledger`** reads the CSV at import-safe path `Spreadsheets/20-data-gaps-ledger.csv`. Unknown `gap_type`, `scope` or `parcel_attach` tokens fail the load.
3. **Dossier manifest** includes every row whose `scope` is `dataset`, `layer` or `field`, under `gaps_ledger`. That is the dataset/layer-level ledger the front end loads once.
4. **Each dossier record** has `gaps`: a list of `gap_id` strings, sorted, for tokens that match that parcel. The UI looks up copy from the manifest. Do not copy `reason` onto the record.
5. **Registry** (`heavymap/ids`) classifies placeholder ARNs **before** grouping by ARN, so all-zero values are `placeholder` rather than `one_to_many`. That grade feeds `roll_flag=placeholder` and ledger type `placeholder`. Re-running a registry does not change existing `heavymap_id` values (geometry reconcile is unchanged).

## Relation to Claim & Refusal

| Gap type | Refusal reason, if any |
|---|---|
| `not_in_coverage` | `not_in_coverage` |
| `not_present_in_source` | `not_in_coverage` when the publisher does not release the object |
| `empty`, `sparse`, `stale`, `placeholder`, `contradictory`, `corrupted` | Not a refusal of a rung. The source is in hand. The honest view names the defect. |
| `withheld_screened` | Not a refusal. The field is held locally and screened at display. |

Do not expand the closed refusal set here. That is Morgen’s call (OPEN-DECISIONS, NA-86).

## Seed (2026-10-17)

Twelve rows, Hamilton, verified against PRs #74 and #75 and PI-0056..PI-0064 plus the quirks and focus notes they cite. This cloud VM cannot reach ArcGIS. Counts are from those already-logged reads, not a new pull.

| gap_id | type | What it names |
|---|---|---|
| GAP-0001 | `not_present_in_source` | NPCA has no tax class field. `MPAC_TAXAT` is taxing municipality (PI-0057). |
| GAP-0002 | `sparse` | Cityview `PropCode` filled on 1,628 of 81,121 rows (PI-0057). |
| GAP-0003 | `stale` | Cityview last edited 2020-02-27 (PI-0058, PR #74). |
| GAP-0004 | `contradictory` | Those codes can disagree with current zoning. Not a measured per-parcel clash (PI-0058). |
| GAP-0005 | `placeholder` | 10 registry links with all-zero ARN, previously graded `one_to_many` (PI-0059). 9 NPCA source rows start `0000` (Q-019). |
| GAP-0006 | `empty` | Cityview `PostalCode` empty on every row (PI-0064). |
| GAP-0007 | `not_present_in_source` | No owner mailing-address field on either NPCA layer (PI-0064). |
| GAP-0008 | `withheld_screened` | Cityview `Owner` exists and is withheld. Names only, no values (PI-0064, HARD-RULES 2). |
| GAP-0009 | `withheld_screened` | Cityview `Legal_Txt` exists and is withheld (PI-0064). |
| GAP-0010 | `not_in_coverage` | 74,276 of 166,745 Hamilton parcels outside NPCA roll coverage, provisional (PR #74, registry run 2). |
| GAP-0011 | `empty` | 29 parcels inside NPCA coverage with no roll number (PR #74, registry `unmatched`). |
| GAP-0012 | `placeholder` | HCA `Version` is 0 on all 134 Hamilton rows (Q-021, PI-0063’s overlay stack). |

## Tests

`tests/test_heavymap_gaps.py` loads the real CSV, checks enums and PI citations, and checks that `withheld_screened` never attaches to a parcel. Dossier tests assert compact `gaps` lists and a manifest ledger. Registry tests assert placeholder ARNs are not graded `one_to_many` and that a second run keeps the same `heavymap_id` values.
