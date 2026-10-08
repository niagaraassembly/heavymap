# Context Band Ladder

**Status:** architecture sketch, 2026-09-23. Linear **NIA-11**. Docs only.

## Purpose

The ladder is the ordered list of context a spine unit may carry. PCDP presents the ladder from a minimum honest subset to the full ordered list. The Claim & Refusal Contract decides what is allowed to appear inside a band.

Order is fixed:

1. `identity`
2. `land_use`
3. `constraints`
4. `activity_registers`
5. `derived_readings`
6. `share_export`

A later band may use an earlier one. It may not be shown as if it were the same kind of fact. A zoning code, a flood overlay, a licence register, and a coverage ratio are four rungs, even when they are drawn in one dossier.

## Non-goals

- Designing panels, typography, or Leaflet layers. Chrome is deferred. The ladder is not a wireframe.
- Requiring every band to be full before any parcel can be shown. Empty bands are allowed.
- Collapsing the six rungs into one score.
- Treating the older eight-band dossier sketch in `first-attempts/niagara-atlas/` as this ladder. That panel is prior art.
- Editing MCS cells. This document only names the tokens the `dossier_bands` column should use.

## How it relates to the other three

- **Parcel Identity Spine.** Supplies the unit and fills the `identity` rung: key, grain, jurisdiction, outline or point, native keys, and identity-level refusals.
- **PCDP.** Minimum presentation is the identity rung plus an explicit list of rungs not spoken for. Maximum presentation is all six rungs, in this order, each filled or refused.
- **Claim & Refusal Contract.** A rung is empty only as a refusal with a reason. A rung is filled only with stamped claims. “Empty” never means vacant, idle, unconstrained, or unlicensed-as-a-fact-about-the-business.

## The rungs

| Order | Token | What may sit here | What must not sit here |
|---|---|---|---|
| 1 | `identity` | Spine key, grain, jurisdiction, geometry handle, native keys, identity refusals | Use, risk, activity, scores |
| 2 | `land_use` | Designation, zoning, property class, or other published land classification, each labelled as which vocabulary it is | A NAICS code pretending to be a by-law; a by-law pretending to be a New York property class |
| 3 | `constraints` | Overlays and encumbrances a joined source states (flood, heritage, environmental, easement, and similar), each named by authority | A sum of unrelated overlays into one “constraint score”; a missing overlay shown as “clear” |
| 4 | `activity_registers` | Registers of activity placed on this key: employment inventory, permits, licences, facility registrations | An inference that a business is operating, closed, or failing |
| 5 | `derived_readings` | Named readings computed from earlier rungs, each with inputs and method | Raw source fields copied forward; a composite of every reading |
| 6 | `share_export` | The packet a reader can take away: the same claims and the same refusals, on the `share` and `export` surfaces | A postcard that drops refusals to look complete |

Bands render in this order whenever more than the minimum is shown. Share/export is last because it packages the others. It is not a second copy of the facts with weaker rules.

The ladder stays these six tokens. Federal registers are claims on the band they already belong to, with an authority scale, and they do not add a rung. Planning-policy overlays (`planning_policy_overlay`) feed `constraints`, each named by its authority. See [ADR 0002](adr/0002-joining-concepts-and-terminology.md).

## Empty bands without lying

Each rung on a presented unit has one of two statuses:

| Status | Meaning |
|---|---|
| `filled` | At least one claim that passes the Claim & Refusal Contract. |
| `refused` | No claim. Exactly one reason: `not_in_coverage`, `not_licensed`, or `not_joined`. |

A refused rung stays in the order. Omitting it would look like “nothing of that kind is true here.” Vacancy, emptiness, availability, and a numeric zero are claims about the land. They are not synonyms for refusal.

Two different negatives:

- **Refused rung.** HeavyMap cannot speak. Example: no constraint layer is joined, so `constraints` is `not_joined`. The reader is not told the site is unconstrained.
- **Filled negative.** A joined source states an absence inside its own coverage. Example: a joined zoning layer’s overlay table has no heritage designation for this key, and the stamp says so. That is an observation about that layer, quoted, not a refusal of the whole rung.

A rung can be `filled` and still carry a separate refusal for something that rung does not have. The Welland illustration below fills `land_use` with a synthetic zoning claim and refuses assessed value as `not_licensed` inside the same rung.

Minimum presentation does not draw six panels. It still accounts for every rung: identity is shown, and every rung without a claim is named in the “not spoken for” list with its reason. Maximum presentation shows the six rungs in order.

## MCS column `dossier_bands`

Part 2 column `dossier_bands` lists the ladder tokens a **dataset** may fill. Tokens are the six names in the table above, separated by `|`, written in ladder order. A zoning layer might carry:

```text
land_use|constraints
```

Rules for the cell:

- Use only the six tokens. Do not invent `regulatory`, `physical`, `neighbours`, or `dossier` as band names. Those words belong to prior-art panels or to the `dossier` surface.
- List a token only if the dataset can actually put a stamped claim on that rung.
- Leave the cell empty only when the dataset feeds no band. Do not write `none` in a way that could be read as a parcel with no context.
- The header stays `dossier_bands` because that is the MCS name. The product noun for the list is the Context Band Ladder.

The column describes datasets. A parcel’s refused rung is a PCDP fact, not a blank MCS cell.

## The two synthetic units as ladders

Illustrations only, at the **maximum** snapshot defined in [PCDP.md](PCDP.md). Values are not observations. Stamps are abbreviated; grade and stamp rules are in the claims document. The minimum snapshot is identity plus a refusal for every rung that has no claim yet.

### `hm:ca:on:welland:footprint:SYN-0142`

| Rung | Status | Illustration |
|---|---|---|
| `identity` | filled | Footprint key in the City of Welland, Niagara Region, Ontario. Parcel polygon `not_in_coverage`. MPAC roll `not_licensed`. |
| `land_use` | filled, with a refusal beside it | Synthetic zoning “L1 — Light Industrial”, joined by point-in-polygon. Assessed value `not_licensed`. |
| `constraints` | refused | `not_joined`. |
| `activity_registers` | filled | Synthetic NEI row `nei_id SYN-8130`, joined by identifier. Employment stays an interval if the source gave a band. No departure claim. |
| `derived_readings` | refused | `not_in_coverage` for a coverage ratio: the illustration has no parcel area to divide by. The reading is absent. It is not zero. |
| `share_export` | filled | Packet repeats the rows above, including both refusals. |

### `hm:us:ny:erie:parcel:SYN-999.00-1-1.1`

| Rung | Status | Illustration |
|---|---|---|
| `identity` | filled | Parcel key in Erie County, New York. SBL `SYN-999.00-1-1.1`. SWIS `not_joined`, so no city or town is named. |
| `land_use` | filled | Synthetic property class `710`, labelled property class, not zoning and not NAICS. |
| `constraints` | refused | `not_in_coverage`. No constraint layer is held for this key in the illustration. |
| `activity_registers` | refused | `not_joined`. Permit or facility points are not attached. This is not “no activity”. |
| `derived_readings` | filled | Synthetic reading `floor_area_m2`, derived from a published square-foot figure. Original square feet remain on the stamp. |
| `share_export` | filled | Packet includes the property-class claim, the reading, and the refused rungs. |

An empty-looking American activity rung and an empty-looking Canadian constraints rung are both refusals. They are allowed. They are not vacancies.

## Prior art

`first-attempts/niagara-atlas/DOSSIER-TECHNICAL-REPORT.md` drew a fixed panel (subject, assertion, regulatory, physical, constraint, access, neighbours, history, evidence) and required unavailable bands to stay visible. That is the right instinct and the wrong noun list for Beta.

PCDP keeps the instinct: order is stable, and a missing rung is shown as missing. The Beta ladder is the six tokens above, so MCS `dossier_bands` has one vocabulary across Canadian and American datasets. Assertion state lives in the Claim & Refusal Contract, not in its own rung. Access distances and neighbour mixes, if they are built later, are `derived_readings` with methods, not extra rungs.
