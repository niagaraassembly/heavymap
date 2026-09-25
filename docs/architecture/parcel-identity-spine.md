# Parcel Identity Spine

**Status:** architecture sketch, 2026-09-23. Linear **NIA-11**. Docs only.

## Purpose

The spine is how a piece of land is known. It produces the unit that the Context Band Ladder fills, that PCDP presents, and that the Claim & Refusal Contract is allowed to speak about.

A spine record has four jobs:

1. Give the unit a stable HeavyMap key that does not change when a publisher renames a field.
2. Say what geometry grain that key is (parcel polygon, footprint, or address point).
3. Record native keys beside it when a publisher has them, and record the join that attached each one.
4. Name the jurisdiction precisely enough that a coverage refusal is checkable.

The spine does not interpret use, constraint, activity, or a reading. Those are later bands.

## Non-goals

- Shipping join code, a unit index, or a database.
- Fetching municipal, provincial, state, or county layers.
- Treating MPAC, a New York owner name, or an address string as the HeavyMap key.
- Inventing one identifier that works on both sides of the border.
- Editing MCS rows, drawing Chrome, or publishing a site.
- Adding UK parcels or UK ports.

## How it relates to the other three

- **Context Band Ladder.** The identity band is the first rung. Later rungs attach only to a spine key. They do not create a second identity.
- **PCDP.** Minimum presentation is possible once a spine key, a grain, a jurisdiction, and an outline or point exist. Without those, there is nothing to show.
- **Claim & Refusal Contract.** A native key that did not join is a refusal (`not_joined` or `not_licensed` or `not_in_coverage`), stamped on the identity band. It is not a missing parcel.

## The HeavyMap key

Every unit in v1 gets one key of the form:

```text
hm:{country}:{region}:{jurisdiction}:{grain}:{local}
```

| Part | Meaning |
|---|---|
| `country` | `ca` or `us` |
| `region` | `on` or `ny` for v1 |
| `jurisdiction` | The publishing government the grain comes from, in a stable slug. For a Niagara Region lower-tier municipality, the slug is the lower tier (for example `welland`), not the word Niagara. |
| `grain` | `parcel`, `footprint`, or `address` |
| `local` | A unique token inside that jurisdiction and grain. Synthetic examples use a `SYN-` prefix. |

The key is HeavyMap’s. Publishers keep their own keys in `native_keys`. A native key is never silently promoted to the spine key, because municipal parcel identifiers, assessment roll numbers, New York SWIS/SBL print keys, `nei_id`, and street addresses fail in different ways and do not survive a border crossing.

A joining concept is a second handle for the job a native field does. The publisher’s field name stays on the claim. The closed catalog, the relation set, and `authority_scale` are in [ADR 0002](adr/0002-joining-concepts-and-terminology.md) and [vocab/joining-concepts.vocab.json](vocab/joining-concepts.vocab.json). Spine grain stays `parcel`, `footprint`, or `address`. Claim grain is a wider set and adds `register_unit`, `zone_polygon`, and `jurisdiction_aggregate`. The `nei_id` class is `premises_register_key`; `establishment_register_key` is an alias of that id. Two fields that share a concept still need their own join before either table can be linked.

## Grain

Grain is part of identity, because area and containment mean different things at each tier.

| Grain | When it is the unit |
|---|---|
| `parcel` | A publisher in v1 releases a parcel polygon HeavyMap is licensed to use, and the polygon is the thing the reader would point at. |
| `footprint` | Building outline is the best licensed geometry. There is no joined parcel polygon. |
| `address` | Only a point or a normalized address is licensed and joined. |

A municipality that publishes no parcel fabric still has units. Their grain is `footprint` or `address`, and the identity band says the parcel polygon is `not_in_coverage` or `not_licensed`. The unit is not dropped, and it is not drawn as a parcel.

One physical site may be knowable at more than one grain. v1 does not require those grains to be fused into a single polygon. If two keys refer to the same ground, each keeps its own key, and any link between them is a join with a method and a grade. An unfused pair is `not_joined`, which is a true description of the index.

## Canada — join and key problems

These are conceptual. Counts and field names below are prior-art observations in `niagara-atlas/`, not a claim that Beta has loaded the layers.

**No single public provincial parcel key.** Ontario’s assessment roll (MPAC) is the usual cross-municipality parcel identifier, and it is fee-based. For v1 that native key is `not_licensed` unless a later decision says otherwise. Assessed value travels with the same refusal. The refusal is about licence, not about whether the land has an assessment.

**Municipal fabrics are uneven inside Niagara-12.** Prior reconnaissance found public parcel polygons for some lower-tier cities (St. Catharines, Niagara Falls) and none for others (Welland’s open data had no parcel fabric; Hamilton’s open catalogue had no parcel layer). Haldimand, Norfolk, Brantford, and Brant are inside geography v1 and are not assumed to match either pattern. Until a layer is joined, those jurisdictions are `not_joined` at parcel grain, not “no industry” and not “no parcels in the world.”

**The Region is both a government and a publisher.** Niagara Region is the upper-tier municipality of twelve lower tiers, and it publishes regional layers such as the Niagara Employment Inventory. A spine key names the lower tier the geometry sits in. “Niagara” alone is not a jurisdiction slug. The glossary rule in `niagara-atlas/GLOSSARY.md` is the pattern: Niagara Region, the peninsula, and the study area are different claims.

**Activity joins are not parcel joins.** Where the NEI is the activity source, the stable native key on that register is `nei_id`. Address text drifts across editions; an identifier join is a stronger method than a normalized address. Hamilton publishes no comparable business inventory. That gap is `not_in_coverage` for the activity band. It does not mean the spine has no Hamilton units, and it does not mean employment is zero.

**Upper tier, single tier, county.** Hamilton, Haldimand, and Norfolk are single-tier. Brantford and Brant County are distinct. A join must name which of those governments published the geometry. Point-in-polygon against the wrong boundary is a bad join, not a small spelling issue.

## United States — join and key problems

**County parcel keys, not an ARN.** New York tax parcels are keyed by county geography plus a section-block-lot (SBL) print key, with SWIS identifying the municipality. That pair does not match an Ontario roll number. The HeavyMap key may be minted from a county parcel id; the SBL stays in `native_keys`.

**The state parcel layer is not the map of v1.** Prior reconnaissance of NYS Tax Parcels Public found Erie County present and Niagara County, New York absent from that service, with Niagara County publishing its own parcel layer. The other v1 counties — Chautauqua, Cattaraugus, Wyoming, Genesee, Orleans, Monroe — each need their own coverage stamp: state layer, county layer, or neither. A county missing from the state service still has land. The identity band says which layer was not in coverage or not joined.

**Property class is not a parcel id and not zoning.** The 700-series industrial class is an assessment classification. It may later fill `land_use`, with the stamp saying it is property class. It does not identify the parcel, and it does not stand in for a zoning by-law.

**No shared code across the border.** SWIS is New York’s. Ontario municipalities do not use it. Cross-border grouping, when it is warranted, is geometric, and the method is part of the stamp. v1 does not require a cross-border link to show either parcel.

**Units and owner fields.** New York area fields are often in square feet and acres. Canadian sources often use square metres. The spine stores the published unit on the native attribute. Conversion is a derived reading, not a quiet rewrite of the source. Public owner-name fields are out of presentation scope for this sketch; the spine does not need an owner to be complete.

## Geography v1 is the coverage fence

The jurisdiction list is fixed in [README.md](README.md). A spine key may be minted only inside that fence. A well-known industrial site outside it can be named in a note elsewhere; it is not given a v1 key. Halton and Burlington stay out of core unless a later lock moves them.

Inside the fence, missing data is still a key plus a refusal. Outside the fence, there is no key.

## The two synthetic units

Full presentations are in [PCDP.md](PCDP.md). The table is the spine at the **maximum** illustration, after the joins that PCDP’s maximum walkthrough accepts. PCDP’s minimum is the earlier moment: key, grain, jurisdiction, and refusals, before those joins.

| | Canadian illustration | American illustration |
|---|---|---|
| Spine key | `hm:ca:on:welland:footprint:SYN-0142` | `hm:us:ny:erie:parcel:SYN-999.00-1-1.1` |
| Why this grain | Illustration of a lower-tier city whose open data, in prior art, had no parcel fabric. Grain is the footprint. | Illustration of a v1 county where a public tax-parcel polygon is the pattern. Grain is the parcel. |
| Jurisdiction sentence | City of Welland, lower-tier municipality of Niagara Region, Ontario | Erie County, New York. The municipality slug stays `erie` until a SWIS join names a city or town. |
| Native keys | Parcel PIN: `not_in_coverage` (no fabric in the illustration). `nei_id`: `SYN-8130` joined by identifier. | SBL: `SYN-999.00-1-1.1`. SWIS: `not_joined`. |
| What the key refuses | MPAC roll number and assessed value: `not_licensed`. | Other v1 counties stay outside this key. Wyoming, Niagara County NY, and Monroe are unstated. |

The Welland footprint and the Erie parcel are both complete spine records. Completeness means the key, the grain, the jurisdiction, and the refusals are explicit.

## Prior art

Patterns, not the product root:

- `niagara-atlas/INTEGRATION.md` — one cross-border subject, separate ingestion, no shared municipal identifier, original attributes kept beside the normalized reading.
- `niagara-atlas/GLOSSARY.md` — Niagara Region versus the peninsula versus the study area.
- `niagara-atlas/us/DATA-SOURCES.md` — New York public parcel coverage is county-uneven; Ontario assessment is not the same public object.
- `niagara-atlas/DOSSIER-TECHNICAL-REPORT.md` — analysis units already existed at parcel, footprint, and address tiers, and a missing fabric was reported rather than dropped.

Beta does not inherit that folder’s study-area boundary. Geography v1 is the list in the architecture index, which is wider than the old Hamilton-plus-Niagara-Region study area and includes the named New York counties.
