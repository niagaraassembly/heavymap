# Jurisdiction roster v1 — CA municipalities + US counties/places

**Linear:** [NIA-10](https://linear.app/niagaraassembly/issue/NIA-10/jurisdiction-roster-v1-exhaustive-ca-municipalities-us-countiesplaces)
**Companion files:** `07-jurisdiction-roster-v1.csv` (32 jurisdiction rows) — the human summary and dig-priority queue; the CSV is the source of truth for tooling. `08-parcel-contextual-dataset-assessment.xlsx` (new, §8) carries per-dataset granular assessment and sourcing alternatives.
**Built:** 2026-09-23, updated same day with live-verified statewide-parcel-layer participation for six US counties. **Framework:** Spine (jurisdiction keys feed identity/joins).
**Prior-art posture:** baseline-reference-only. Rows marked "Baseline: <file>" are copied from evidence already gathered in `niagara-atlas/` recon docs and the MCS — re-verify before trusting after a few months, per those docs' own caution about unstable ArcGIS layer indices. Rows marked "NEW 2026-09-23 dig" are fresh for this ticket and are catalogue-existence confirmations (a live URL, a visible dataset list) rather than the field-level probes (record counts, live licence text) the Niagara-12 baseline passes did — that is the next lap of work, not this one.

---

## 1. Dig queue — undiscovered / thin CA municipalities (work this first)

Ordered by what's most likely to move the needle for the least additional recon effort.

| Priority | Jurisdiction | Why it's here | Next concrete step |
|---|---|---|---|
| ~~resolved~~ | ~~Brantford~~ | **FIELD-VERIFIED 2026-09-23 (Linear NIA-18).** `data-brantford.opendata.arcgis.com` and `brantfordopendata-brantford.hub.arcgis.com` are two Hub-site front-ends over the SAME ArcGIS Online org (`services.arcgis.com/aji2lCmjXt0KpGzI`) — not a canonical-vs-broken split. Live counts: Zoning Districts 1,906, Parcel Fabric 38,778, Building Footprints 36,862, Site Addresses 38,999. No owner-name field on any. | Licence page is a JS-rendered Hub app — text not machine-readable via curl, still only "refer to the portal" confirmed, not the verbatim terms. Low-priority follow-up. |
| ~~resolved~~ | ~~County of Brant~~ | **FIELD-VERIFIED 2026-09-23 (Linear NIA-18).** Live counts via `services1.arcgis.com/ZG34JIhRAfwP1ItJ`: Parcels 17,735, Zoning 6,520, Land Use Designation 19,231 (carries `Within_SAB`/`Within_BUA` growth-boundary flags), Building Footprint 23,161, Civic Addressing 19,361. **Licence is CC0** — public domain, the most permissive of any source in this roster. No owner-name field on any. `sm.brant.ca` MapServer is UNREACHABLE (connection failure, not 404) as of this check — not "two doors," only one currently works. | Re-check `sm.brant.ca` periodically in case it comes back; not urgent since the Hub items cover the same ground. |
| ~~resolved~~ | ~~Norfolk County~~ | **FIELD-VERIFIED 2026-09-23 (Linear NIA-18).** Live counts via `services1.arcgis.com/mSGV2hCLXHNsfQqK`: Parcels 33,831 (carries `ROLLNUM`/`ROLLNUMFUL` assessment-roll fields — a ready join key), Civic Addresses 35,121. No owner-name field on either. | Still no dataset isolating Port Dover specifically — see next row, this is expected and final, not a gap. |
| P1 | **Port Dover** (place, edge) | Not a real jurisdiction — an unincorporated community inside Norfolk County. Zero dedicated data possible by construction. | No portal dig needed. If Norfolk data is ingested, produce a Port Dover extract by spatial clip and document that it is derived, not sourced. |
| ~~P1~~ resolved | ~~Wyoming / Chautauqua / Genesee counties, NY~~ | **RESOLVED 2026-09-23 by live query** (not search-derived): all three ARE in the statewide `NYS_Tax_Parcels_Public/FeatureServer/1` layer — Wyoming 23,530 parcels (102 industrial), Chautauqua 88,396 (312 industrial), Genesee 28,266 (140 industrial). Genesee also has its own ArcGIS Hub — two independent sources. | No further dig needed for parcel geometry. Still open: licence text on each county's *own* viewer/Hub (secondary sources). The state layer's `PRIMARY_OWNER` field is present but per `niagara-atlas/TECHNOLOGY-DECISIONS.md` D-13, that's a retain-and-mask-at-presentation question, not a drop-at-ingest one. |
| **P1 — needs an alternative** | **Cattaraugus / Orleans counties, NY** | **CONFIRMED 2026-09-23 by live query** that both are ABSENT from the statewide layer (count=0, same pattern as Niagara). Cattaraugus's own portal is fee-based ($0.03–0.06/parcel); Orleans has no bulk source found at all. | See `08-parcel-contextual-dataset-assessment.xlsx` (new, §8 below) for alternative-sourcing candidates being tracked for both. |
| ~~resolved~~ | ~~Monroe County, NY~~ | **RESOLVED, with a correction.** An earlier pass this same day mistakenly identified `gishub-monroegis.hub.arcgis.com` as Monroe County NY's portal — it is actually **Monroe County, OHIO** (publisher field confirms it; bbox sits near -81°,39.7°, southeastern Ohio), a decoy of the same class as the existing `eaton-county-michigan-decoy` entry in `sources.json`. The real portal is `maps.monroecounty.gov`, a self-hosted ArcGIS Enterprise instance — `Parcels_Public` feature service, **267,962 parcels, including a county-wide `totalassessedvalue` field**, live-verified. | No further dig needed for parcel geometry. Worth a fuller pass on the rest of that server's folders (Planning, DOT, Health, Stormwater, etc.) for other contextual layers. |
| later | **Halton Region** | No dedicated regional-government portal found; the only Halton-branded Hub belongs to Conservation Halton (a separate conservation-authority body, not the region). Out-of-core per the ticket's geography lock. | Do not spend more dig budget here unless a specific source is needed. |
| ~~resolved~~ | ~~Burlington~~ | **RESOLVED 2026-09-25 (Linear NIA-21).** Direct `curl` against `opendata.burlington.ca` root returns live HTTP 403 — matches the original 2026-08-22 finding, not the 2026-09-23 directory-listing one (likely a stale search-engine-indexed subpath, not the live root). The 403 is real and current. Still out-of-core per geography lock. | No further action unless Burlington is pulled into core scope. |

## 2. Geography lock — coverage check against the ticket

- ✅ Niagara Region + all **12** lower-tier municipalities named explicitly (§3).
- ✅ Hamilton, Haldimand, Brantford, Brant, Norfolk (Port Dover) present, `in_v1` flagged honestly — Port Dover is `edge`, Brantford/Brant/Norfolk are `yes` but thin.
- ✅ Halton/Burlington present as `out` (out-of-core/later) per the ticket's instruction, not omitted.
- ✅ All **8** US v1 counties present (Chautauqua, Cattaraugus, Erie, Niagara, Wyoming, Genesee, Orleans, Monroe).
- ✅ Notable US municipal portals as place rows under their county: Buffalo (Erie), Niagara Falls NY (Niagara), Rochester (Monroe).
- No row was silently skipped — every named geography in the ticket has a row, even where the honest answer is "no portal found" (Port Colborne, Thorold, Grimsby, Pelham, Wainfleet, West Lincoln, Orleans County).

## 3. CA — Niagara-12 lower-tier, at a glance

| # | Municipality | Portal | Catalog | Priority |
|---|---|---|---|---|
| 1 | Niagara Falls (ON) | `open.niagarafalls.ca` | arcgis | P0 — richest publisher in the study area (329 datasets) |
| 2 | St. Catharines | `niagaraopendata.ca` org + own ArcGIS | arcgis | P0 — parcel-complete (44k parcels, 498 Employment-zoned) |
| 3 | Welland | `open.welland.ca` | arcgis | P0 — recommended engine test municipality |
| 4 | Fort Erie | `niagaraopendata.ca` org | ckan | P1 — nothing industrial |
| 5 | Lincoln | `niagaraopendata.ca` org | static | P1 — SHP-only, no REST |
| 6 | Niagara-on-the-Lake | `niagaraopendata.ca` org | ckan | P1 — 1 dataset, effectively absent |
| 7 | Port Colborne | none | none | P1 — no presence |
| 8 | Thorold | none | none | P1 — no presence |
| 9 | Grimsby | none | none | P1 — no presence |
| 10 | Pelham | none | none | P1 — no presence |
| 11 | Wainfleet | none | none | later — smallest NEI count (72) |
| 12 | West Lincoln | none | none | later — no presence |

All twelve are single-sourced-at-worst via Niagara Region's Consolidated NEI (98,065 business points, 2016–2022 editions) even where the municipality itself publishes nothing — see the CSV `notes` column for each row's 2022 NEI business count.

## 4. CA — single/upper-tier and the west-of-Niagara corridor

| Jurisdiction | Portal | Confidence |
|---|---|---|
| Hamilton | `open.hamilton.ca` | High — 463 datasets, field-verified counts |
| Haldimand County | `gis.haldimandcounty.ca` | High — 425 items, field-verified counts |
| Brantford | `data-brantford.opendata.arcgis.com` / `brantfordopendata-brantford.hub.arcgis.com` (same org) | **High** — 4 layers field-verified 2026-09-23, no owner PII |
| Brant County | `catalogue-brant.hub.arcgis.com` (Hub) — `sm.brant.ca` MapServer currently unreachable | **High** — 5 layers field-verified 2026-09-23, CC0 licence, no owner PII |
| Norfolk County | `data-norfolk.opendata.arcgis.com` | **High** — 2 layers field-verified 2026-09-23, no owner PII |
| Halton Region | none found (region itself) | Confirmed-thin, out-of-core |
| Burlington | `opendata.burlington.ca` | Unclear/possibly-changed, out-of-core |

## 5. US — eight v1 counties + notable places

| Jurisdiction | Portal | Catalog | Confidence |
|---|---|---|---|
| Erie County | `www3.erie.gov/gis` (ECIMS) | static | High — 370,424 parcels field-verified |
| ↳ Buffalo (place) | `data.buffalony.gov` | socrata | High — 51 own datasets, scanned |
| Niagara County | `gis.niagaracounty.com` | arcgis | High — 94,318 parcels field-verified |
| ↳ Niagara Falls NY (place) | none dedicated | none | Confirmed-thin |
| Monroe County | `maps.monroecounty.gov` (self-hosted ArcGIS Enterprise — **confirmed absent from the statewide layer**, count=0) | arcgis | **High** — corrected 2026-09-23 after an initial mis-identification (see §1); 267,962 parcels w/ assessed value, live-verified |
| ↳ Rochester (place) | `data.cityofrochester.gov` | socrata | **High — the best-evidenced jurisdiction in this entire roster** (parcel + assessed value + 12 historical snapshots 1996–2024) |
| Genesee County | statewide layer (28,266 parcels, 140 industrial) **+** own Hub `gis-data-cogeneseeny.hub.arcgis.com` | arcgis | **High** — verified live 2026-09-23, two independent sources |
| Wyoming County | statewide layer (23,530 parcels, 102 industrial) | arcgis | **High** — verified live 2026-09-23, resolves prior open question |
| Chautauqua County | statewide layer (88,396 parcels, 312 industrial) — supersedes the county's own viewer as primary route | arcgis | **High** — verified live 2026-09-23 |
| Cattaraugus County | `maps2.cattco.org/parcel` — **confirmed absent from statewide layer** (count=0) | arcgis | Medium — **fee-based** ($0.03–0.06/parcel); no free bulk alternative confirmed yet |
| Orleans County | none confirmed — **confirmed absent from statewide layer** (count=0) | unknown | Low — thinnest of the eight, no bulk parcel source found at all |

## 6. What this does *not* do (out of scope, per the ticket)

- No dataset fetching or normalization — this is a jurisdiction/portal-existence roster, not an ingestion pass.
- UK geography: not touched.
- No claim of completeness for licence text — every "NEW 2026-09-23 dig" row explicitly flags licence as unverified rather than assumed open, except where a live query (Wyoming/Chautauqua/Genesee/Cattaraugus/Orleans/Monroe parcel counts, §1/§5) upgraded it to verified.

## 7. MCS writeback (done 2026-09-23, second pass)

The four gap rows this ticket touches — `niagara_municipal_boundaries`, `brantford_brant_port_dover_gap`, `us_v1_counties_gap`, `burlington_halton_gap` — now have this roster's findings appended to their `notes` and `open_questions` columns in `02-dataset-inventory-v4.xlsx`, plus `NIA-10` added to `linear_ids`. (The lock file that initially held this file back turned out to be stale — no live LibreOffice session had it open — so the write went ahead; existing cell values were appended to, never overwritten, and sheet structure/frozen panes were verified intact after saving.) That workbook remains the **master record of datasets actually admitted into the project's working data collection** — this roster and the new assessment file (§8) are pre-admission triage, not a substitute for it.

## 8. New: per-dataset assessment spreadsheet (`08-parcel-contextual-dataset-assessment.xlsx`)

**Why a second file.** The roster above answers "does a portal exist for this jurisdiction?" It doesn't have room for the next question this ticket now also covers: for a *specific* dataset (a parcel layer, a zoning layer, an assessment-value table), what's actually usable, what are its quirks/gotchas, and — when the local government doesn't publish it or charges for it — what's the alternative? That's a different grain (dataset, not jurisdiction) and a different question (assessable/usable, not just present), so it gets its own file rather than more columns bolted onto the roster.

**Relationship to the MCS.** Nothing in this new file is "admitted" — it's a working scratchpad for evaluating candidates. A row only gets promoted into `02-dataset-inventory-v4.xlsx` once someone (Morgen/CoS or an agent with explicit sign-off) decides it should actually be ingested, per the MCS's own "do not mass-insert without a Morgen/CoS pass" rule.

**Sheets:**
1. **Dataset Assessment** — one row per specific dataset/access-point (not per jurisdiction), covering parcel, zoning, land-use, building-footprint, assessed-value, business-registry and environmental-constraint layers, with columns for access method, cost, licence, and a free-text quirks/gotchas field (e.g. "layer /0 is boundaries not parcels", "publishes every dataset twice, ingest the WGS 1984 variant only", "fee-based, $0.03–0.06/parcel").
2. **Alternatives & Workarounds** — candidate substitute sources for jurisdictions where the primary source is absent, thin, or fee-gated (Cattaraugus, Orleans, and the standing Ontario-wide MPAC/Teranet paywall), including third-party commercial parcel APIs, OSM as a last-resort footprint/landuse proxy, and direct FOIL/bulk-licence requests as an alternative to per-parcel API pricing. None of these are evaluated/approved yet — the sheet exists to track candidates, not endorse them.

This ticket (NIA-10) stays open to continue that assessment work rather than being closed on the roster alone — see the Linear comment for the current status note.

## 8b. `09-per-jurisdiction-dataset-catalog.xlsx` — now exhaustive, and a superset of the MCS

Evolved twice since first created. It now has four sheets:
- **Counties** (911 rows) and **Municipalities** (995 rows) — every discoverable dataset per jurisdiction, tagged `review_status`: `admitted_in_mcs` (58 rows — has a matching row in `02-dataset-inventory-v4.xlsx`), `curated_relevant` (78 rows — hand-picked as relevant, not yet in the MCS), or `discovered_unreviewed` (1,770 rows — pulled straight from each portal's own catalog API with no filtering at all).
- **Cross-Cutting Regional** (36 rows) — provincial/state/federal/cross-border datasets that don't belong to one jurisdiction (OSM, NPCA, Ontario PSEZ/Escarpment/Greenbelt, ECCC NPRI, NYS DEC/DOT, EPA TRI, etc.), plus explicitly-flagged **not-yet-probed** sources from the recon docs' own gap lists (Grand River CA, Hamilton CA, Transport Canada, CBSA, bridge authorities, Niagara District Airport, StatCan, Brock University, Indigenous governments, NYS Open Data, USDA NRCS, USGS) — so that thread of research stays visible rather than getting lost.
- **README** — explains the review_status convention and lists what's still not exhaustively enumerated (Erie County, Cattaraugus, Chautauqua, Wyoming, Orleans, Burlington, Halton — each with a reason).

**The MCS is now confirmed a subset of this file**: every one of its 82 rows was programmatically backfilled and matched (58 to a single jurisdiction, 24 to Cross-Cutting Regional) — verified the count sums to exactly 82, nothing dropped.

## 9. Resume notes for the next agent / quota window

- Update `dig_status` per row as you go (`not_started` → `in_progress` → `pass1_done` → `blocked`). Only `port_dover` is still `not_started`, and it may stay that way permanently (see §1).
- ~~The three P0 Ontario dig items (Brantford, Brant, Norfolk)~~ — **field-verified 2026-09-23, Linear NIA-18.** The equivalent US work is done for Wyoming/Chautauqua/Genesee (§1); Cattaraugus and Orleans need an alternative-sourcing decision instead (§8), not another portal search — tracked in Linear NIA-20.
- Burlington's status conflict (§1, §4) is worth a two-minute `curl` before anyone treats either the old 403 or this session's finding as current.
- Continue logging alternative-sourcing candidates and per-dataset quirks into `08-parcel-contextual-dataset-assessment.xlsx` as they're found; only promote a row into the master MCS once it's actually been decided to ingest that dataset.
