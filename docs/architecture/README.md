# HeavyMap architecture

Documentary source of truth for the four-concept product frame. Tracked as Linear **NIA-11**. This tree specifies the contract. It does not implement a map, fetch municipal data, edit the Master Control Spreadsheet (MCS), or publish a site.

Beta is the repository top level. [`niagara-atlas/`](../../niagara-atlas/) and the UK atlas (`babbworks/atlas`) are baseline references. Cite their patterns. Do not extend them as the product root, and do not add UK geography.

## The four concepts

| Concept | Document | Role |
|---|---|---|
| Parcel Identity Spine | [parcel-identity-spine.md](parcel-identity-spine.md) | How a piece of land is known: stable key, geometry grain, joins, CA/US asymmetry. Produces the unit PCDP consumes. |
| Context Band Ladder | [context-band-ladder.md](context-band-ladder.md) | Ordered bands a unit may carry. A band may be empty only by an explicit refusal. |
| Parcel Context Display Protocol (PCDP) | [PCDP.md](PCDP.md) | Minimum-to-maximum contract for how any parcel is presented. The dossier is one surface. |
| Claim & Refusal Contract | [claim-refusal-contract.md](claim-refusal-contract.md) | Every assertion needs an evidence grade and a source stamp. Absence is a named refusal. |

Machine-readable tokens for these contracts are in [vocab/](vocab/README.md).

Plumbing that is not a fifth product name:

- **MCS** — which datasets exist and which bands, surfaces, and readings they may feed.
- **D-5** — disposition of a dataset: `ship`, `simplify`, `derive`, `tile`, or `link`.
- **Joining concepts** — the job a published field does, so native names can share a job or keep a lookalike apart. Closed catalog: [adr/0002-joining-concepts-and-terminology.md](adr/0002-joining-concepts-and-terminology.md).

## Platform decisions

Accepted records. Each one locks a platform choice beside the four concepts. A platform decision is not a fifth product name.

| Decision | Document |
|---|---|
| OSM (or an equivalent tile service) is the visual map substrate. No bulk OSM prefetch as the parcel or intelligence corpus. | [adr/0001-osm-as-substrate.md](adr/0001-osm-as-substrate.md) (Linear **NIA-17**) |
| Joining concepts sit above native field names. Relation, authority scale, claim grain, register family, and the thirty concept ids are closed sets. | [adr/0002-joining-concepts-and-terminology.md](adr/0002-joining-concepts-and-terminology.md) (Linear **NIA-22**) |

## Geography v1

The spine may speak about these jurisdictions. A name outside this list is `not_in_coverage` until a later lock adds it. Halton and Burlington are out of core for v1.

**Canada — Niagara corridor toward Brantford / Brant / Port Dover:**

- Niagara Region and its twelve lower-tier municipalities: St. Catharines, Niagara Falls, Welland, Fort Erie, Port Colborne, Thorold, Grimsby, Lincoln, Niagara-on-the-Lake, Pelham, Wainfleet, West Lincoln
- City of Hamilton
- Haldimand County
- Norfolk County (including Port Dover)
- Brantford and Brant County

**United States — counties:**

Chautauqua, Cattaraugus, Erie, Niagara, Wyoming, Genesee, Orleans, Monroe.

## MCS Part 2 vocabulary

This PR does not edit the spreadsheet. Dataset rows name architecture objects with these Part 2 headers:

| Column | Holds | Defined in |
|---|---|---|
| `dossier_bands` | Ladder band tokens this dataset may fill, in ladder order, `\|`-separated. | [context-band-ladder.md](context-band-ladder.md) |
| `ui_surfaces` | PCDP surface tokens allowed to show it: `selection`, `dossier`, `share`, `export`. | [PCDP.md](PCDP.md) |
| `derived_readings` | Reading identifiers this dataset may feed. Empty means the dataset feeds no reading. | [claim-refusal-contract.md](claim-refusal-contract.md) |

The column `dossier_bands` keeps the MCS header. In product language the bands belong to the ladder, and `dossier` is only the surface token inside `ui_surfaces`.

## Worked parcels

PCDP walks two **synthetic** units, one Canadian and one American. The other three documents reuse those identities. They are illustrations of the contract, not observations of real land.
