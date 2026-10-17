# HeavyMap v0 front end

## Vision (Morgen, 2026-10-17)

- Fun and delightful to explore, and it surprises with technical depth and honesty, without feeling expert-only.
- Small, legible subtitles and subtext in the dossier and tooltips. They present information with authority and make our classification, joining and confidence levels visible, in the spirit of the na-research regional news scan (Western New York issue 1), where items carry labels and comments.
- Source-quoted labels, e.g. "City class: Vacant Lands" or "Tax class confirmed: industrial". HeavyMap never asserts vacancy itself.
- New aesthetic: reuse function, not the look of either prototype. Inspired by Stadia's layers, including watercolour. We may get a Stadia API key again; suggest alternatives too.
- MapLibre + PMTiles, static hosting on GitHub Pages later. The site stays under about 300 MB, each file under 100 MB, and the startup payload is small.
- First view: Hamilton, Ontario framed by the Greenbelt and conservation layers, so the city appears encased by nature.
- Layout: the desktop split of top/bottom bars and left/right panels is undecided, so propose options. The parcel dossier likely pops out on the right. The clicked parcel re-centres in the remaining map space, and the view snaps back when the panel closes, if the user hasn't moved the map.
- The dossier shows every overlapping zone and designation with area shares, plus roll number and tax class where known.
- OpenStreetMap as a live public-input layer that surfaces competing claims about land, the way news items show competing claims.
- "Opportunity" is the core idea: enable action and investment, not just information. The opportunity score's spirit stays, but as a transparent, labelled breakdown of signals with source and confidence, not a single opaque number.
- Opportunity lenses: toggles that simplify the map into hybrid views. The first is vacant and underused land: vacant buildings or land, industrial or business parcels with unused outdoor space (a land-severance case), and rural land next to industrial land (a rezoning case).

## Scope and authority

Draft for Morgen's review, 2026-10-17. This prompt explicitly authorizes a written spec followed by a local synthetic prototype, overriding older frontend-deferral notes only for this scope. Related existing work: NA-32 (front end), NA-27 (dossier), NA-11 (PCDP), NA-17 (OSM substrate), NA-24 / NA-270 / NA-276 (Hamilton spine and alignment). No new Linear assignment is invented. No MCS cells or dataset truth change.

G6 remains closed. No publication, deployment tooling, Pages workflow, live municipal pulls, owner values, legal descriptions, personal information, or production data. Fixtures are invented geometry and records, visibly labelled on every surface. Civic addresses, roll aliases and tax classes are allowed in production under current HARD-RULES, but v0 uses unmistakably synthetic examples. A local server and a draft code PR are the only delivery surfaces.

Sources read: [prior-art glean](PRIOR-ART-GLEAN.md), archived [UK atlas](../../first-attempts/uk-atlas/README.md) and [Niagara atlas](../../first-attempts/niagara-atlas/README.md), [PCDP](../../docs/architecture/PCDP.md), [claim/refusal](../../docs/architecture/claim-refusal-contract.md), [ladder](../../docs/architecture/context-band-ladder.md), [Hamilton decisions](../focus/hamilton/DECISIONS.md), [loading evidence](../focus/hamilton/fast-loading-evidence.md), [spine pull](../focus/hamilton/SPINE-BASE-PULL-2026-10-17.md) and [groupings](../focus/hamilton/hamilton-dataset-groupings.md). The na-research news scan was described in the prompt but was not supplied or independently inspected.

Authority conflicts: loading evidence §0's MPAC restriction and groupings' drop-at-ingest guidance are superseded by HARD-RULES 2/4/5. Keep raw fields local, screen at display/build boundary. Geometry hashes are matching aids, not permanent identities. Use opaque registry keys and many-to-many roll aliases. The reported 54.0% citywide ARN attachment is a source-coverage finding, never a confidence score for a particular parcel. A centre-point zoning match cannot support area percentages. Production shares await accepted overlay joins and NA-276 alignment checks.

## Experience and layout alternatives

The first screen says **Hamilton / Land, with possibility.** Nature surrounds a quieter city. Water and the escarpment orient the reader before parcel detail. An always-visible “Synthetic local prototype” notice prevents a plausible map from becoming an accidental claim. Three numbered sample sites invite exploration; all are also keyboard-accessible buttons. No score leaderboard.

| Option | Arrangement | Benefit / cost | Review posture |
| --- | --- | --- | --- |
| A: floating field guide | Slim top identity/search bar, left 280px lens tray, right 410px dossier on selection, bottom legend and source status | Maximum map before selection, clear discovery; floating controls need careful collision handling | Local prototype default, provisional |
| B: top and bottom | Search and lens chips across top, bottom expandable evidence shelf, right dossier | Broad map for nature frame; less room for long lens explanations and two vertical reading paths | Compare at 1280px and tablet |
| C: workbench | Persistent 280px left layer browser, central map, persistent 410px right reading pane | Strong for repeated professional research; narrower map and more expert-feeling on arrival | Later analyst mode candidate |

Simple editable layout studies: [Excalidraw mockups and previews](mockups/README.md). These illustrate the three alternatives; no layout choice is locked by the drawings.

At ≤900px, the lens tray collapses behind a labelled button; a selected dossier becomes a bottom sheet with a close button and scrollable contents. At ≤540px it takes most of the height while leaving map context. Tap targets ≥44px; body text 15–16px, secondary text ≥12px with strong contrast, visible keyboard focus, reduced-motion support. No essential hover-only content. Escape closes the dossier; focus returns to the initiating control. Tooltips appear on hover/focus and have an equivalent persistent sample list.

Selection camera: save centre, zoom, bearing and pitch only when the first dossier opens. Fit the selected parcel into the remaining map rectangle with left/right/bottom padding measured from visible controls. Switching parcels retains that saved pre-dossier view. Mark the session moved only for user camera gestures, wheel, keyboard or navigation controls, never programmatic animations. Closing restores the saved view only if no user camera move occurred; otherwise retain the user's current view and remove padding without a jump. Resizes recompute padding. Respect reduced motion. Reopening starts a new session.

## Dossier anatomy: one renderer, six ordered bands

Header: sample label, civic-address placeholder, grain, jurisdiction, selected outline, permanent spine key. Small summary: “A source class, a geometric reading, and a disagreement worth checking.” All substantive content lives in the ordered bands below; do not invent the old eight-band ladder.

| Band | Content and interaction |
| --- | --- |
| `identity` | Key, parcel grain, Hamilton/Ontario, outline, civic address, roll aliases (possibly several), tax alias join method; explicit missing-native-key refusals |
| `land_use` | City existing-land-use quotation, tax/property class quotation, every intersecting zoning and designation record, exceptions/holdings, source-specific area share; designation is distinct from zoning and actual use |
| `constraints` | Greenbelt designation, NEP designation, Development Control Area and conservation regulation overlays, each authority named with independent area shares; gaps remain visible |
| `activity_registers` | Source-dated registers and community/OSM observations, independently attributed; competing records retained with `contested` state, refutations retained as `refuted` alongside original claims |
| `derived_readings` | Opportunity signal cards: measured quantity, inputs, formula, units, method, confidence rationale, limitations and next investigation; no combined total |
| `share_export` | Local JSON evidence packet containing the exact claims and refusals shown above; synthetic marker, timestamps, key and geometry grain travel with it. No public share/publish action |

Every claim has `observed`, `joined`, or `derived` grade and a stamp: source name, publisher, licence, original id if present, retrieved date and observation date separately. Joined claims also expose method; derived claims expose inputs, method and original units. Fixture stamps say explicitly that publishers/records are illustrative, not actual observations or licensed extracts. Evidence disclosure opens inline, never behind an account. Qualitative confidence is separate from evidence grade: a join method is not a probability. Until confidence thresholds are agreed, say “Illustrative confidence: review required” with the exact reason, not a percentage.

Refusal copy is both plain-language and precise: “Not joined — no accepted match for this parcel” (`not_joined`), “Outside held coverage — this object is not held for this unit” (`not_in_coverage`), “Not licensed — this source is not permitted for this use” (`not_licensed`). Use exactly one reason per refused object. A filled band may also have refused objects. Loading/failed requests are UI states, never parcel refusal reasons or empty-result claims. Never use zero, “clear”, “inactive”, “available” or HeavyMap-asserted “vacant” to stand in for absent inputs.

### Area shares

Production numerator = area of accepted parcel/source intersection; denominator = full parcel area, both in EPSG:26917. Retain numerator m², denominator m², source feature id, geometry vintage and transform. Show every intersection, including small slivers and boundary-only touches (label those “touch only”, 0m²); never hide behind dominant-zone colour. Round to 0.1% for UI, preserve raw precision in evidence/export. Distinguish “below 0.1%” from no intersection. Aggregate duplicate pieces within one source record before display. List uncovered area for a complete partition only when coverage is known; it is not an invented zone. Overlapping designations/constraint families are independent and must not be summed to 100%. Tie in dominant colour: deterministic source-id order, disclose tie. Invalid/offset/unaccepted overlays refuse shares rather than pretend centroid matches are area evidence. Prototype shares are manually constructed synthetic illustrations, not GIS results.

## Tooltip and subtitle language

Three compact lines: **Sample 01 · parcel** / `City class: “Vacant Lands”` / `Joined · illustrative overlap · review required`. Dossier subtitles expand the same vocabulary, with sentence case and ordinary language. Attribute the classification in the label itself, not only the footer. Use quoted original values alongside normalized labels. Example: `Tax class confirmed: “industrial”` has a subtitle explaining that this is an assessment classification, not verification of present activity. The word “confirmed” is provisional pending Morgen's wording review.

Use quiet slate text, purple for community input, rust for investigative signals, forest for nature; grade and state also use words/icons so colour is never the only cue. News-scan influence means an item has a label, a comment, and a source. It does not mean mimic a publication's aesthetic or invent editorial certainty. Avoid “high potential”, “ripe for redevelopment”, and vacancy-like shorthand.

## Opportunity lens model

A lens is a named view recipe: visible source layers + eligible signal predicates + contextual overlays + explanatory legend. It changes emphasis, not the evidence or the parcel identity. Keep context faintly visible; selected parcels remain visible even if a lens would hide them. Layer controls are independent of lens filtering. A registry owns labels, colours, source status, minzoom and loading state. It must not silently turn a failed fetch into an empty layer.

First family: **Vacant & underused — evidence to investigate**. The name describes an investigation lens, not a conclusion. Three sub-lenses (and an “All signals” reset):

1. **Source-recorded vacancy.** Include only an attributed Existing Land Use “Vacant Lands” class or Vacant Building Registry record with accepted join. Preserve date and every competing observation. A building entry is not proof of a whole vacant parcel. No match means no conclusion.
2. **Outdoor-space investigation.** Industrial/business source class plus footprint coverage reading. Production candidate threshold is open; v0's synthetic illustration uses ≤25% building coverage solely to demonstrate the filter. `1 − union(clipped building footprints) / parcel area` describes non-building area, not unused space: it can include loading yards, access, parking, setbacks or wetlands. Severance feasibility is refused without frontage/access/services/planning review. No numeric suitability score.
3. **Rural / industrial edge.** Rural classification plus shared-boundary adjacency to an industrial-classified parcel. Prototype is an illustrative recipe; production tolerance and minimum boundary length remain open. Distinguish true adjacency from proximity, show method and distance where relevant. It is a rezoning investigation, never entitlement or a prediction of approval. Greenbelt/NEP/conservation overlays stay visible.

Each card has “Why it appears”, “What this cannot tell us” and “Next check”. Next checks may be verify source date, inspect servicing/frontage, review by-law and consult planning. No contact-owner feature. No inferred vacancy from missing footprints or registers. Missing inputs exclude a candidate with a visible explanation, never a negative judgement about that land.

### OSM: competing public claims and bounded live options

Owner intent is a live public-input view. **Follow-up from Morgen, 2026-10-17 (verbatim):** "i no longer want to rule out using some aspects of Overpass or particular elements from open street amp". Overpass and selected OSM elements are therefore in scope for evaluation. This supersedes the prior-art glean's blanket rejection as a v0 design constraint. ADR 0001 and Niagara integration still describe the older architecture; an implementation should explicitly record how an adopted query mode changes that architecture rather than silently treating the older prohibition as current owner intent.

Evaluate three complementary paths: (1) a selected OSM node/way/relation lookup with object version, timestamp and source link, (2) a user-triggered bounded viewport query at a minimum zoom with an explicit result cap, timeout, cache and freshness label, (3) dated snapshots or a view-scoped community tile provider for dependable broad context. Keep selected-element lookup separate from parcel-spine joins. Never infer occupancy from missing tags, a timeout, a truncated response or an absent object. Live results need an explicit field allowlist at the presentation boundary so owner/contact/person tags cannot leak into tooltips, dossiers or exports.

Display community quotations independently alongside municipal claims. Never silently overwrite a municipal class or promote OSM to authoritative parcel identity. A newer public claim is a separate dated record, possibly contested; refutations retain both records. No automatic OSM edits, no background bulk prefetch, and no unbounded public-instance dependency. Show coverage, query extent, age, truncation and failures. Respect provider policies and ODbL attribution/derivative obligations. Choose instance/provider, refresh cadence, cache limits and moderation/refutation workflow before enabling live requests. A static frontend may use an approved CORS endpoint; do not add a hidden proxy by default.

The local prototype still demonstrates synthetic OSM-style quotations and a contested example, with no Overpass calls or live-data claims. That is a fixture boundary for this prototype, not a rejection of live OSM. The next experiment can compare selected-element lookups and bounded queries against snapshots without committing real data or exposing personal tags.

## Basemap and visual direction

New visual direction: mist-white controls, ink-blue type, muted blue water, sage nature washes, terracotta investigative outlines and violet public claims. System sans for readable controls, a restrained serif only for editorial place headings; no copied IBM Plex/cream or dark monospace dashboard. Nature receives the large shapes; parcel detail comes forward on demand. No satellite preload.

MapLibre is the renderer; PMTiles provides range-read local/static archives, not a basemap vendor. Basemap options remain reviewable:

| Option | Use | Constraint / next check |
| --- | --- | --- |
| Stadia Alidade Smooth + Stamen Watercolor | Smooth for working mode, watercolour for opening/exploration | Key/account and terms required for deployment. Watercolour raster labels cannot be restyled; keep an evidence-friendly alternative. Confirm attribution, quotas and contrast |
| MapTiler Streets / basic style | Hosted OSM-derived vector alternative | Browser-visible restricted key, provider terms and quota review; do not commit a key |
| Protomaps regional PMTiles + custom MapLibre style | Strong control over quiet roads/water/labels and hosting footprint | Regional basemap adds storage, fonts/sprites and attribution obligations; measure before choosing |
| OSM raster service | Configurable ADR-compatible substrate fallback | Use a provider permitting expected use, honour attribution/cache policy; public standard tiles are not an unlimited production CDN |
| Local synthetic style | Current prototype: no external tiles/fonts/keys, nature and water fixtures plus sample parcels | Schematic Hamilton composition, not a navigable municipal map or real Greenbelt boundary. “Watercolour study” is a local soft palette, not Stadia Watercolor |

Opening production extent: Hamilton municipal envelope with Greenbelt/NEP/woodlands, parks, escarpment, water and authority regulation layers. Distinguish regulation from natural cover. Conservation Halton is a named coverage gap, not a hole meaning unregulated. Use Waterloo-hosted GRCA copy with provenance per Hamilton decisions. Greenbelt/NEP/Development Control are also parcel-level constraint claims, not merely decorative layers. Citywide Official Plan designation is a named gap; Secondary Plans and Employment Lands must not be relabelled citywide OP coverage.

## Data, tile and loading budgets

These are proposed acceptance ceilings, not measured production performance. Site <300MB total, every file <100MB (decimal bytes), reject ≥100MB. Aim ≤250MB to leave revision headroom. No real data enters this PR. Publication/range tests on Pages wait for G6; local HTTP range tests can run now.

| Asset class | Proposed ceiling / strategy |
| --- | --- |
| Initial app HTML/CSS/JS and map engine | ≤1.5MB compressed transfer; no remote fonts; production build measured |
| First-view simplified nature + city frame | ≤1MB compressed, progressive; fine detail deferred |
| Initial total including visible tiles | ≤3MB cold transfer target, excluding optional basemap variance documented separately |
| Parcel / building / zoning archives | Planning allocations 40 / 35 / 30MB; each shard <80MB target, absolute <100MB |
| Nature detail / water / regulation / policy tiles | 45MB combined planning allocation, simplify for display only |
| Dossier and search shards | 40MB allocation; each response ≤250KB target, initial search index ≤50KB |
| Other overlays, assets and reserve | 60MB; total allocation 250MB |

Parcels/buildings z13+, zoning z10+, detailed nature z12+ as initial hypotheses. Use low-zoom generalized nature, topology-aware keep-shapes simplification and feature-count checks. All analytical overlays use precise build-side geometry, never simplified display tiles. Parcel tiles carry stable key and minimal display fields; detailed claims load by key shard, deduplicated in flight and cached with bounded memory. Search uses address/roll/key prefix shards, not 322MB addresses. Never send raw attribute dictionaries: allowlist display fields after screening, including exports and tooltips.

PMTiles archives should be partitioned by layer or geographic shard if measured size requires it. Do not rely on Git LFS for eventual Pages. Record archive bytes, max tile bytes, zooms, feature counts and attribution. Validate local Range → 206, Content-Range and partial length; eventual hosting CORS/cache/range verification is a separate post-G6 task. No test Pages repository now.

Performance acceptance to measure later on a mid-range laptop and phone with stated network: first useful nature map ≤3s, selected dossier shell ≤150ms, cached record ≤300ms, cold record ≤1s, no long-task whole-city JSON parse. These are goals; synthetic fixture timing cannot validate Hamilton-scale throughput. Failed layer loading has retry and a named status. Dataset absence and HTTP failure remain separate.

## Local prototype acceptance and handoff

Write this spec before code. Prototype in new top-level `web/`, separate map rendering, fixture model and dossier renderer. Use MapLibre and register PMTiles protocol; exercise it against a tiny locally generated synthetic vector archive. Make no real geographic extract. Include three selectable fictional parcels demonstrating quoted classes, split zoning/designations with independent shares, unknown roll, missing bands, competing claims, and investigative signals. One renderer/export payload preserves the same evidence and refusals. Provide lens toggles, nature/community layers, two local palette studies, sample search, navigation, conditional camera restore and responsive dossier. Keep all fixtures conspicuously synthetic.

Verify fixture contract, export parity, lens eligibility, local range requests and browser interactions including keyboard, small-screen overflow, layer toggles, switching selection, close without movement versus close after pan/zoom, missing/failed archive, invalid URL selection, reduced motion. Run repository Python tests and index path check. Record measured local sizes separately from proposed production budgets. A draft PR is review only. No merge, public posts, deployment or real data.

## Questions for Morgen

1. Layout A, B or C? Is a bottom sheet acceptable on mobile, and should the left tray collapse once a dossier opens?
2. Which default basemap direction: quiet vector or watercolour exploration? Is Stadia access returning, and which alternative should be costed?
3. Which OSM experiment first: selected-element lookup, bounded user-triggered Overpass query, or community tiles/snapshots? Overpass is now an option. What refresh, cache, truncation and refutation policy should govern it?
4. Approve the lens names and evidence-first breakdown? What coverage threshold and adjacency rule should be evaluated for production, without implying severance or rezoning feasibility?
5. Keep “Tax class confirmed” or prefer “Tax class (assessment)” to avoid implying a present-use confirmation? Roll aliases and civic addresses are permitted already; how prominent should they be?
6. Which initial source layers and accepted overlay joins are ready for dossier claims? How should citywide OP and Conservation Halton gaps be worded? Do not infer G6 readiness from this prototype.
7. Should local notes or a standalone readable dossier follow the JSON packet, and should a separate deep-link page be in the next iteration? All surfaces must preserve refusals.
8. Who records the G6 decision and production confidence thresholds? These stay open in the existing decision log; this spec does not settle them.
