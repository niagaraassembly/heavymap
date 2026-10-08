# 04 — UK atlas capability glean

**Created:** 2026-09-22 (America/New_York)  
**Purpose:** Capture **capability types and calculations** the UK Industrial Atlas (`babbworks/atlas`) achieved that Niagara/HeavyMap has **not yet implemented** or only thinly noted in arch/design.  
**Not a dataset inventory.** Do not ingest UK geography.  
**Sources:** `_src_UK-ATLAS-INVENTORY.md` (site PR#7 cache), `_src_TECHNOLOGY-DECISIONS.md`, `_src_PUBLICATION-MODEL.md`, `_src_DATA-SOURCES.md` / `_src_us_DATA-SOURCES.md`, `00-operating-model-and-architecture.md`, `01-data-status-and-work-plan-draft.md`. No separate UK `datasets.md` cache on disk — inventory § covers `system/datasets.md`.

---

## Framing (what HeavyMap already decided)

From operating model + publication model (already noted, not gaps):

- Prefer **dossier-as-argument** (claims + evidence + refusal) over opaque UK-style single scores.  
- UK share cards / notes / `property.html` cited as prior art for local-first share.  
- Per-source modules (`voa.js`, `epr.js`, …) and VOA shard pattern cited as ETL inspiration.  
- OSM as shared base experience; live Overpass-as-primary-inventory is **rejected** once authoritative layers exist.

This glean focuses on **patterns still missing as product behaviour or derived readings**, even where the *idea* is mentioned once in a doc.

---

## A. Data-type analogues to seek in NA sources

Capability the UK shipped or designed → what to hunt in CA/US open data (not UK copies).

| UK capability / module | What it did | NA analogue to seek | Niagara/HeavyMap status |
|---|---|---|---|
| **Companies House panel** (`companies.js` + `server.py` proxy) | Live company search by postcode/name; SIC industrial highlight; officers on top actives | ON corporate profile / business number joins; US SOS / SAM where open; **NEI + Welland Directory + Hamilton licence registers** as the honest substitutes | NEI / OSM places / Welland Directory in inventory; **no live company-intelligence panel**; CH itself is out-of-geo |
| **VOA non-domestic ratings** (`voa.js` + postcode shards; `voa_geo.js`) | Rateable value, use description, floorspace-ish signal by postcode; industrial filter | **MPAC = dead end (CA)**; **NYS Tax Parcels AV + GFA**; Buffalo assessment roll; Rochester spike method (improvement/total under-occupancy) | US AV path partially inventoried; **no “rates gap” UX**; CA floorspace mainly NEI indoor GFA |
| **VOA Gap Finder** (`voa_geo.js` + `app.js` Gap Finder) | Register postcodes vs OSM industrial within ~60 m → unmatched “gaps” | **NEI / Directory / DEC / NPRI vs OSM industrial land** disagreement map; Welland NEI↔Directory ~29% already measured offline | Offline disagreement noted; **no interactive gap-finder mode** |
| **NHLE heritage** (designed, not fully wired) | Listed fabric constraint near sites | Designated Heritage Properties (RGN + munis + Hamilton) | In candidates ★★★; **omitted from curated inventory** (see `03`) |
| **HMLR INSPIRE title polygons** | Freehold title boundaries at high zoom | Municipal / NYS **parcel fabric** (already spine strategy); no CA title API | Parcel spine in inventory for NF/STC/US; **MPAC closed** |
| **Planning Data API** (`planning.js`) | Live designations + applications by bbox; scoring deltas | Municipal development applications / permits / OP & zoning (static pulls) | Permits/apps partially in inventory; **no live bbox planning API module** |
| **EA EPR + FSA** (`epr.js`, `fsa.js`) | Permit / food-industry activity overlays, sector colour, inactive fade | **NPRI**, **NYS DEC registries**, **EPA TRI** (inventory); food premises if a NA open hygiene API appears | Datasets inventoried; **no clustered permit overlay module with inactive styling** |
| **Strategy zones** (`strategy_zones.js` + hand GeoJSON) | Hand-curated freeport / investment / strategy polygons | PSEZ, Strategic Locations for Investment, CIP / BOA / Employment Generator CIP | Mostly in inventory; **no typed strategy-zone style language in UI** |
| **BRES employment** (designed only) | Area employment choropleth | Census labour / CBP 2022 (inventory); Hamilton/NF census tables in candidates | CBP shipped thin; **no employment choropleth product** |

---

## B. UI / interaction patterns

| UK pattern | Detail | HeavyMap / Niagara note | Gap? |
|---|---|---|---|
| **Mode presets** | workshop-explorer / urban-manufacturing / hidden-industry filter bundles | Filters→OSM tags mentioned in arch; no named industrial modes | **Gap** — define dossier-first modes (e.g. expand / redevelop / logistics) without copying OSM-only filters |
| **Draw-area analysis panel** | Leaflet.Draw rectangle → aggregate analysis | Not in niagara-atlas shipped UI; not in arch as a M0 feature | **Gap** — useful for corridor selection; park until unit spine stable |
| **Inset navigator map** | Second Leaflet + viewport rect sync | Not noted for HeavyMap chrome | **Park** — nice-to-have navigation |
| **Named region + industrial district presets** | Click-to-zoom UK regions / GEO_PRESETS | Geography v1 is cross-border counties — needs NA preset list | **Gap** — ship CA/US presets (not UK boxes) |
| **External layer toggles** | FSA / EPR / strategy / INSPIRE checkboxes | Publication/atlas layers TBD; thin `data/*` committed without toggle taxonomy | **Gap** — layer taxonomy aligned to `atlas_role` |
| **URL hash state** | view + filters + mode shareable | Explicitly noted as UK keep in arch §10 | **Noted, not implemented** in HeavyMap Beta |
| **Planning coverage warning** | Soft warning when viewport outside data jurisdiction | Highly relevant cross-border (CA vs NY licence/data holes) | **Gap** — “no NEI / no AV / no NPCA licence” viewport honesty |
| **Clustered markers + lifecycle styling** | Abandoned/disused faded; EPR inactive faded | OSM disused labelling exists in data naming; no product styling system documented for Beta | **Partial** |
| **Feature panel multi-register cards** | CH + VOA + planning chips on one feature | Dossier bands with provenance are the chosen replacement | **Not a gap to copy** — implement as dossier sections, not CH/VOA cards |
| **Mobile FAB sidebars** | Small-screen chrome | Not specified for Beta | Park |

---

## C. Calculations / derived readings

UK `scoring.js` is **OSM-probabilistic opportunity 0–100** with confidence. HeavyMap product lock: **dossier readings, not opaque scorecard**. Still glean the *calculation kinds*:

| UK calculation | Inputs (UK) | Suggested NA dossier reading (non-score) | Status |
|---|---|---|---|
| Tag baseline + area from polygon | OSM tags, geom area | Unit area / building coverage ratio from footprints × parcels | Footprints in inventory; **ratio reading not specified** |
| Lifecycle boosts / activity penalties | OSM lifecycle tags | NEI departures; dual-epoch footprints; vacant registry; BOA/CIP | Departures shipped; **no unified lifecycle reading** |
| Spatial context radii (100/250/500 m) | Nearby loaded OSM elements | Nearby NEI employment, rail, truck AADT class, NPCA flag, heritage | **Not designed** as a reading set |
| Planning designation deltas | Listed, Article 4, brownfield, flood, etc. | Contained-in: flood/reg, NHS/NES, Greenbelt/NEP, PSEZ, zoning industrial, ag land, MTO buffer, heritage | Containment principle in D-5; **no named delta catalogue** |
| Confidence from tag richness | OSM completeness | Confidence from **register agreement** (NEI↔Directory↔OSM↔DEC) + geometry provenance | Disagreement measured once (Welland); **no confidence field on dossiers** |
| Gap distance (VOA↔OSM ≤60 m) | Geocoded ratings vs OSM | Gap between business register and landuse / parcels | **Gap** |
| Postcode-exact company filter | CH + postcode | Address-join exact / fuzzy match rates (Hamilton permits, Welland Directory) | Handling notes demand match-rate reporting; **not a product metric yet** |
| Slope / relief (Niagara D-5, not UK) | Contours → elev/slope | Already decided — **implement**; UK did not have this | NA advantage — ship |

**Do not port:** single 0–100 “opportunity score” as the primary intelligence UX (arch already rejects). If a score appears later, it must be one optional derived chip with full formula disclosure — not the dossier spine.

---

## D. Share / dossier patterns

| UK pattern | Detail | HeavyMap note | Gap? |
|---|---|---|---|
| **`property.html` deep-link dossier** | Fetch by OSM id; score; notes; Street View; printable | Product = rich per-parcel dossiers; niagara-atlas dossier “not fully built”; site PR publication model cites this | **Core gap** — deep-link unit dossier is v1 intelligence |
| **`property-map.html` sibling** | Map-centric twin | Optional | Park |
| **Postcard / minimal card + html2canvas PNG** | Shareable image card | PUBLICATION-MODEL §2.1 explicitly cites UK | **Noted, not built** |
| **Web Share API** | When available | Cited with postcard | **Noted, not built** |
| **CSV export of results** | id, type, score, lifecycle, osm_url, … | Not in Beta plan as first surface | Park behind dossier; prefer claim CSV later |
| **Hash “Share Link”** | Restores view/filters | Noted in arch | **Noted, not built** |
| **Local notes on property page** | Save-as-standalone HTML discussed in publication model | Local-first notes are a keep | **Designed, not implemented** |
| **Street View outbound** | External ground truth | Trivial; good dossier affordance | **Gap (cheap)** |
| **Provenance links to source object** | OSM URL in UI/CSV | Extend to FeatureServer item + retrieval date + licence stamp | Ledger/provenance culture strong in docs; **UI stamp pattern missing** |

---

## E. What *not* to glean as capability debt

- Committing API keys / `server.py` Basic auth pattern (UK inventory critical liability).  
- Live Overpass-at-browse as primary inventory once NEI/parcels exist.  
- England-only planning coverage assumptions.  
- Hand-maintained UK strategy_zones.geojson content (keep the *typed overlay* idea; use PSEZ/CIP/BOA).  
- Opaque vacancy claims from OSM absence (UK scoring.js explicitly non-claims vacancy — keep that discipline).

---

## Draft titles for future Linear issues

*(Do not create issues — titles only for parent / Morgen.)*

1. **Dossier derived readings v0 — containment deltas, register-agreement confidence, and lifecycle signals (no opaque opportunity score)**  
2. **Parcel dossier deep-link + share card — `property.html` analogue with provenance stamps, hash URL state, and Street View outbound**

Optional later (if parent wants a third):  
3. **Register↔landuse gap-finder mode (NEI/Directory/DEC vs OSM industrial) — NA replacement for VOA Gap Finder**

---

## Honesty

UK atlas is a **small static SPA** with impressive interaction density on thin data. HeavyMap’s bottleneck is **authoritative cross-border data + dossier honesty**, not missing Leaflet widgets. Highest leverage glean is: **(1) named derived readings with confidence**, **(2) deep-link dossier + share**, **(3) gap-finder / coverage warnings** — not re-implementing CH/VOA/INSPIRE.
