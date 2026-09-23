# Parcel Context Display Protocol (PCDP)

**Status:** architecture sketch, 2026-09-23. Linear **NIA-11**. Docs only.

## Purpose

PCDP is the contract for how any spine unit is presented to a viewer, from the smallest honest picture to the fullest one the other three concepts allow.

A viewer should be able to answer three questions from any presentation:

1. Which unit is this, in which jurisdiction, at which geometry grain?
2. Which statements are stamped claims, and of what grade?
3. Which parts of the ladder are refused, and why?

If a presentation cannot answer those, it is below the minimum. If it answers them for every rung, it is at the maximum. Steps between are allowed. Skipping a refusal to look more complete is not.

## Non-goals

- Leaflet, basemaps, symbol design, panel layout, or any other chrome. Surfaces here are protocol roles, not screens.
- Fetching data or filling the two examples from live portals. Both walkthroughs are synthetic.
- Editing the Master Control Spreadsheet.
- Publishing a site, a share card, or an export file.
- Making the dossier the name of the architecture. The dossier is one surface that can carry a presentation.
- UK parcels, UK ports, or a claim that the UK atlas’s `property.html` is this protocol.

## How it relates to the other three

- **Parcel Identity Spine.** Defines the unit. PCDP will not present a polygon that has no spine key, and it will not present a key as a parcel when the grain is a footprint or an address.
- **Context Band Ladder.** Defines the order `identity` → `land_use` → `constraints` → `activity_registers` → `derived_readings` → `share_export`. PCDP does not reorder rungs and does not add a seventh.
- **Claim & Refusal Contract.** Defines grades, stamps, and the three refusal reasons. PCDP displays them. It does not soften them into “unknown” with no reason, and it does not turn a refusal into vacancy.

## Minimum presentation

The minimum is what a viewer gets as soon as a spine record exists, even when every later rung is refused.

In plain language, the minimum is:

- the outline or the point that is this unit
- the HeavyMap spine key
- the grain of that geometry
- one jurisdiction sentence a person can check against geography v1
- a list of what is not spoken for, naming each refused rung or native key and one reason: not in coverage, not licensed, or not joined

The minimum includes no score, no owner, no “vacant” or “available,” and no implication that a refused rung was inspected and found empty. A footprint is drawn as a footprint. A parcel is drawn as a parcel.

The minimum is allowed to be almost entirely refusals. That is still a valid presentation. It tells the truth that the key exists and that the rest of the ladder has not been earned.

## Maximum presentation

The maximum is the minimum plus every ladder rung, in order, each either filled or refused under the Claim & Refusal Contract.

In plain language, the maximum is:

- everything in the minimum
- land and use classifications that are actually joined, each named as zoning, designation, or property class
- constraints a source states, each attributed to its authority, unsummed
- activity-register rows joined to this key, dated, without an invented operating status
- derived readings whose inputs exist, labelled as readings, with method and original units
- a share/export packet that contains the same claims and the same refusals as the screen

The maximum is not “every dataset in the MCS.” It is every rung prepared data can fill for this key, and an explicit refusal for each rung it cannot fill. Two neighbouring parcels can both be at maximum and look different, because their publishers differ. That difference stays visible.

Anything short of the maximum is a partial presentation: some rungs filled, the others still listed with reasons. Partial is the normal case. It is not a defective minimum, and it is not a permission to hide the unfilled rungs.

## Surfaces

MCS Part 2 column `ui_surfaces` names which protocol surfaces may show a dataset. Tokens, `|`-separated:

| Token | Role |
|---|---|
| `selection` | The minimum: outline or point, key, jurisdiction, refusals. The thing a map selection must be able to say before any dossier opens. |
| `dossier` | The banded reading of one unit, from the current partial presentation up to the maximum. One surface among others. |
| `share` | A human-readable packet of the same claims and refusals. |
| `export` | A machine-readable packet of the same claims and refusals. |

The word dossier does not appear in `dossier_bands` as a band token. It appears here, as a surface. A dataset that may feed zoning onto the dossier and into export carries `ui_surfaces` of `dossier|export` and `dossier_bands` of `land_use`. A dataset that is only a selection outline carries `selection` and `identity`.

Share and export are the `share_export` rung made concrete. They are not a cleaner subset. If the dossier shows `constraints: not_joined`, the export contains that refusal too.

Chrome that might one day host these surfaces is unspecified. A future map can implement `selection` and `dossier` without this document naming a library.

## What every presentation carries

Regardless of surface:

- spine key and grain
- jurisdiction sentence
- for each visible claim: grade, value, stamp
- for each refusal: the object refused and exactly one of `not_in_coverage`, `not_licensed`, `not_joined`
- no silent gaps and no zero standing in for a missing quantity

`retrieved_on` and `observation_on` both show when both exist. A 2017 by-law fetched later is a current legal text with an old origin. A 2022 inventory fetched later is an observation aging in place. The presentation does not collapse those into “updated.”

## Walkthrough — one Canadian unit

**Synthetic.** Not an observation of a real property. Chosen so the Canadian spine problems are visible: footprint grain, no public parcel key in the illustration, regional employment id, unlicensed assessment.

**Spine key:** `hm:ca:on:welland:footprint:SYN-0142`  
**Jurisdiction:** City of Welland, a lower-tier municipality of Niagara Region, Ontario. Inside geography v1.  
**Grain:** footprint.

### Minimum (`selection`)

The viewer sees a building outline, not a lot line.

- Key `hm:ca:on:welland:footprint:SYN-0142`
- City of Welland, Niagara Region, Ontario
- `share_export` is filled with this same selection: key, jurisdiction, and the refusals below. There is no fuller packet yet.
- Not spoken for:
  - parcel polygon — `not_in_coverage`
  - assessment roll and assessed value — `not_licensed`
  - `land_use` — `not_joined` until a zoning join is accepted
  - `constraints` — `not_joined`
  - `activity_registers` — `not_joined`
  - `derived_readings` — `not_in_coverage` (no parcel area in this illustration, so a coverage reading cannot be formed)

No occupancy headline. The maximum below is a later snapshot of the same key, after the zoning and NEI joins.

### Maximum (`dossier`, and the same content on `share` and `export`)

| Rung | What is shown |
|---|---|
| `identity` | Outline. Key. Grain `footprint`. Jurisdiction sentence. Native `nei_id SYN-8130` grade `joined`, method `identifier`. Parcel polygon refused `not_in_coverage`. MPAC roll refused `not_licensed`. |
| `land_use` | `L1 — Light Industrial` (synthetic), grade `joined`, method `point_in_polygon`, publisher City of Welland, licence named, `retrieved_on` and `observation_on` both shown. Assessed value still `not_licensed` inside this rung. |
| `constraints` | Refused. `not_joined`. The rung is present. It does not say “no constraints.” |
| `activity_registers` | Synthetic NEI row `SYN-8130`, grade `joined`, method `identifier`. Employment shown as the source band, for illustration `5–99`, grade `observed` on the band and `derived` only if `employment_interval` is also listed. No “departed,” no “operating today.” |
| `derived_readings` | `coverage_ratio` refused, `not_in_coverage`, because parcel area is refused. Displayed as refused, not as `0`. |
| `share_export` | The export lists every row in this table, including refusals. A share card that kept only “L1” and the NEI id would be under the minimum, even if it looked finished. |

A partial presentation is the same table with `land_use` still refused and the NEI row already filled, or the reverse. The refused rows stay.

## Walkthrough — one American unit

**Synthetic.** Not an observation of a real Erie County parcel. Chosen so the American spine problems are visible: public parcel grain, SBL native key, property class rather than zoning, county named while the municipal SWIS is unjoined, activity not inferred from land class.

**Spine key:** `hm:us:ny:erie:parcel:SYN-999.00-1-1.1`  
**Jurisdiction:** Erie County, New York. Inside geography v1. No city or town is named, because SWIS is `not_joined`.  
**Grain:** parcel.

### Minimum (`selection`)

The viewer sees a parcel polygon.

- Key `hm:us:ny:erie:parcel:SYN-999.00-1-1.1`
- Erie County, New York
- Native SBL `SYN-999.00-1-1.1` on the stamp of the parcel source (synthetic)
- `share_export` is filled with this selection and the refusals below.
- Not spoken for:
  - SWIS / municipality — `not_joined`
  - `land_use` — `not_joined` until property class is accepted
  - `constraints` — `not_in_coverage`
  - `activity_registers` — `not_joined`
  - `derived_readings` — `not_joined` until a floor-area field is accepted

Other v1 counties stay outside this key. The maximum below is a later snapshot, after property class and floor area are accepted.

### Maximum (`dossier`, `share`, `export`)

| Rung | What is shown |
|---|---|
| `identity` | Parcel polygon. Key. Grain `parcel`. “Erie County, New York.” SBL `SYN-999.00-1-1.1`, grade `observed`. SWIS refused `not_joined`. |
| `land_use` | Property class `710` (synthetic), grade `observed`. Stamp says this is an assessment class, not zoning and not NAICS. Zoning itself is not invented to fill the gap. |
| `constraints` | Refused. `not_in_coverage`. Not “unconstrained.” |
| `activity_registers` | Refused. `not_joined`. Not “inactive,” not “vacant.” |
| `derived_readings` | `floor_area_m2` grade `derived` from synthetic `20000` square feet. Stamp keeps square feet, states the conversion, and labels the result a reading. |
| `share_export` | The packet includes class `710`, the floor-area reading, and the refused constraints and activity rungs. It does not include an owner name. |

Side by side, the Canadian maximum has an activity row and no parcel, and the American maximum has a parcel and no activity row. Both are maximum presentations of different publishers. PCDP does not rebalance them.

## MCS naming on these illustrations

If a later inventory row were the synthetic Welland zoning layer, its Part 2 cells would be:

```text
dossier_bands: land_use
ui_surfaces:   selection|dossier|share|export
derived_readings:
```

`derived_readings` empty: the zoning layer feeds no reading.

If a later row were the synthetic Erie floor-area field:

```text
dossier_bands: derived_readings
ui_surfaces:   dossier|share|export
derived_readings: floor_area_m2
```

Those cells are examples of vocabulary only. This PR writes none of them into the spreadsheet.

## Prior art

- The dossier panel in `niagara-atlas/DOSSIER-TECHNICAL-REPORT.md` is a surface pattern: one unit, ordered bands, refusals kept on the panel, claims that can be disagreed with. PCDP is the protocol that surface has to obey. Beta does not promote “dossier” to the name of the whole product.
- `niagara-atlas/PUBLICATION-MODEL.md` treats a share card and a local note as presentation ideas taken from the UK atlas. PCDP keeps share/export as a ladder rung with the same claims and refusals. It does not specify `html2canvas`, accounts, or a notes module.
- `niagara-atlas/INTEGRATION.md` required uneven coverage to be shown. Minimum presentation is that requirement, stated as a contract instead of a map caption.

No public deployment follows from this document.
