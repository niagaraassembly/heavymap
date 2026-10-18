# Repo split plan: `heavymap` → `industrial-atlas` + `heavymap`

**Status:** reviewable plan. Section 6 decisions recorded 2026-10-18. No files moved, no repo created, no merge, no rename performed.
**Date:** 2026-10-18.
**Approved to plan now:** Morgen, 2026-10-18. BETA-GATE §9 item 10 (split) is decided; this document is the execution plan, not the execution.
**Linear:** Industrial Atlas = back end after the split. HeavyMap.com = front end + human-facing documentation after the split. Closest existing issue: [NA-269](https://linear.app/niagaraassembly/issue/NA-269/define-g6-and-a-staged-pilot-publish-gate). There is no dedicated Linear packet for the split itself.
**Repos today:** public `niagaraassembly/heavymap` (created 2026-09-21, must stay public: GitHub Pages / account cannot make it private). Private `niagaraassembly/heavymap-restricted` exists (created 2026-10-18, empty, unused). `niagaraassembly/industrial-atlas` does not exist yet and will be **public**. Future private `ia-restricted` remains the concept for restricted back-end data (not created in this split).
**This PR does not:** create the new repo, move or delete files, land PR #71, rewrite git history, rename the Python package or `hm:` ids, or change Linear projects.

Inventory taken from `main` at `b524f3e` (PR #79, beta-gate decisions) plus the open draft PR [#71](https://github.com/niagaraassembly/heavymap/pull/71) on `codex/heavymap-v0-frontend`.

---

## 1. Split boundary

| After the split | Holds |
|---|---|
| **NEW `niagaraassembly/industrial-atlas`** | Universal back end / data foundation. Dataset catalog and inventory sheets, pull / normalise / spine / registry / overlay / dossier-build Python (`heavymap/` package and scripts), tests for those, data-gaps ledger, run records, back-end ADRs and architecture, `DATASET-ROUTINE`, beta-gate / publish-visibility / restricted mechanism, Industrial Atlas-side process insights. Documented as a universal foundation: no HeavyMap UI, lens, or UX particulars. |
| **`niagaraassembly/heavymap`** | Front end only. The v0 MapLibre / PMTiles site (PR #71 `web/` on `codex/heavymap-v0-frontend`), HeavyMap product / UX docs (PCDP display protocol, lenses, front-end notices), front-end Linear project docs. GitHub Pages and `CNAME` (`heavymap.com`) stay here. |
| **Linear Industrial Atlas** | Back-end issues, packets, and MCS / pipeline work. |
| **Linear HeavyMap.com** | Front-end + documentation issues (NA-32 and the public-site docs already listed there; NA-305 / NA-308 / NA-309 / NA-310 already sit here). |
| **Off git, shared** | Deb `local-data/` at `/fast/code/making/na/local-data/`. Serves both public repos. Never committed. |
| **Private `niagaraassembly/heavymap-restricted`** | Exists, empty, unused. For secretive / proprietary **front-end** code and info the heavymap site may draw on. Not the back-end restricted store. |
| **Future private `ia-restricted`** | Restricted **back-end** data and operator notes. Not created in this split. Restricted material is split by **field**, not by dataset (see §4.4 and §6.1). |

The four-concept frame is split by role, not copied wholesale:

| Concept | Canonical home | Why |
|---|---|---|
| Parcel Identity Spine | `industrial-atlas` | How a unit is known and joined. Pipeline contract. |
| Context Band Ladder | `industrial-atlas` | What a unit may carry. Data contract the front end consumes. |
| Claim & Refusal Contract | `industrial-atlas` | Evidence grades, stamps, refusal reasons. Universal. |
| Parcel Context Display Protocol (PCDP) | `heavymap` | How a unit is presented (`selection`, `dossier`, `share`, `export`). Product / UX. |

`industrial-atlas` may keep a one-paragraph pointer to PCDP in `heavymap` so a back-end author knows the display protocol exists. It must not specify lenses, chrome, basemap brands, or panel layout. `heavymap` may keep a one-paragraph pointer to spine / bands / claims in `industrial-atlas`. It must not specify pull, mint, overlay, or dossier-build procedures.

---

## 2. File and folder table

Destination values:

- `industrial-atlas` — move (with history; see §5). After the move, delete from `heavymap` in a later execution PR, not this one.
- `heavymap` — stay. After the split this is the front-end repo.
- `both/copy` — each repo keeps a copy, then rewrite so the copy is in-scope only. Do not leave HeavyMap UI / lens / UX text in the `industrial-atlas` copy.
- `delete` — do not take into either product tree (or drop one of a duplicate pair after the surviving copy is placed). Prior-art citation may still name the old path.

`On main` is `yes` unless marked `PR #71 only`.

### 2.1 Top-level paths

| Path | Destination | Reason |
|---|---|---|
| `AGENTS.md` | both/copy | Pickup contract applies in both repos. Rewrite each copy: Industrial Atlas packets name `industrial-atlas`; HeavyMap packets name `heavymap` and the HeavyMap.com project. Strip lens / UX from the IA copy. |
| `AGENTS-MCS.md` | industrial-atlas | MCS is dataset truth. After the split, `~/na/` still stays off git; this guide moves with the catalog and pipeline. |
| `CLAUDE.md` | both/copy | Thin pointer at `AGENTS.md` plus the process-insights rule. Each copy points at that repo's paths. |
| `CODEOWNERS` | both/copy | Placeholder owners today. Duplicate, then point IA at architecture / MCS / pipeline paths and HM at `web/` / PCDP / Pages. |
| `CONTRIBUTING.md` | both/copy | Human intake. IA copy: datasets, MCS, Linear Industrial Atlas. HM copy: front end, Pages, Linear HeavyMap.com. Fix the MCS-location sentence (it currently contradicts `AGENTS-MCS.md`; that contradiction is OPEN-DECISIONS 5 and is not settled here). |
| `CNAME` | heavymap | `heavymap.com`. GitHub Pages stays on this repo. |
| `LICENSE` | both/copy | File is absent on `main` today. Create the same license on both repos when Morgen finalises it (`CONTRIBUTING.md` already points at `LICENSE`). |
| `README.md` | both/copy | Rewrite. IA README: universal data foundation, no map chrome. HM README: the public site and PCDP, pointing at IA for data. |
| `.gitignore` | both/copy | Both need `local-data/`. IA keeps spreadsheet lock-file and UK-data ignores. HM adds `web/node_modules/` and build output (PR #71 already has `web/.gitignore`). |
| `.agents/` | (see §2.7) | Skills split by lane. |
| `.cursor/` | (see §2.7) | Environment and rules split. |
| `.github/` | (see §2.7) | Templates and Copilot pointers, rewritten per repo. |
| `docs/` | (see §2.2) | Mixed. Split file by file. |
| `first-attempts/` | (see §2.8) | Prior-art baseline for both products. |
| `fixtures/` | industrial-atlas | Synthetic spine / identifier fixtures (`SYN-` ids). No UI. |
| `heavymap/` | industrial-atlas | The Python pipeline package (ids, overlays, dossier, gaps, NY identifiers). Full Industrial Atlas rename is decided (§6.2) and listed in the rename map; not performed in this PR. |
| `heavymap-planning/` | (see §2.3) | Mostly IA. `frontend/` stays on HM. |
| `scripts/` | (see §2.5) | All current scripts are pipeline or cloud-install for Python. IA. |
| `Spreadsheets/` | (see §2.4) | Catalog, inventory, gaps, insights. IA. At execution the folder is renamed to `inventory/` with file numbers kept (§6.3). |
| `tests/` | (see §2.6) | Current tests are Python pipeline / vocab. Most IA. PCDP vocab test follows PCDP to HM. |
| `web/` | heavymap | MapLibre / PMTiles v0 site. **PR #71 only; not on `main`.** |

### 2.2 `docs/`

| Path | Destination | Reason |
|---|---|---|
| `docs/architecture/README.md` | both/copy | Index of the four concepts. IA copy lists spine, bands, claims, plumbing (MCS, D-5, joining concepts, gaps) and points at HM for PCDP. HM copy lists PCDP and points at IA for the other three. Strip geography-v1 implementation notes that are pipeline-only from the HM copy if they duplicate IA. |
| `docs/architecture/parcel-identity-spine.md` | industrial-atlas | Spine grammar and joins. |
| `docs/architecture/context-band-ladder.md` | industrial-atlas | Band tokens the dossier build emits. Strip any panel / Leaflet wording (already marked non-goal). |
| `docs/architecture/PCDP.md` | heavymap | Display protocol. Surfaces, min-to-max presentation. |
| `docs/architecture/claim-refusal-contract.md` | industrial-atlas | Grades, stamps, refusal reasons. Strip the sentence that UI naming for surfaced source classes will be refined later, or move that sentence to an HM notice doc. |
| `docs/architecture/parcel-dossier.md` | industrial-atlas | Dossier **build** contract (inputs, screening allowlist, shard rule, manifest). See §3 for UI-copy and "front end already has `heavymap_id`" sentences to strip. |
| `docs/architecture/data-gaps-ledger.md` | industrial-atlas | Gap record schema. Public ledger. |
| `docs/architecture/publish-visibility.md` | industrial-atlas | `publish_visibility` wording (PR #79). Update for field-level restricted sidecars (§4.4) at execution; do not specify heavymap.com chrome. |
| `docs/architecture/heavymap-id-registry.md` | industrial-atlas | Mint / attach / reconcile operator notes. |
| `docs/architecture/heavymap-overlays.md` | industrial-atlas | Overlay linker operator notes. |
| `docs/architecture/rochester-parcel-local-token.md` | industrial-atlas | Spine key for Rochester. |
| `docs/architecture/adr/0001-osm-as-substrate.md` | both/copy | Decision 1 (configurable OSM tiles as visual floor) is HM. Decision 2 (no bulk OSM prefetch into the intelligence corpus) is IA. Split the ADR or keep a short shared record with those two sentences and no basemap-brand / layout talk in the IA copy. |
| `docs/architecture/adr/0002-joining-concepts-and-terminology.md` | industrial-atlas | Closed joining-concept catalog. |
| `docs/architecture/adr/0003-heavymap-id-format.md` | industrial-atlas | Opaque Crockford ULID as `{local}` token. Title says "heavymap-id"; rename in IA if the package is renamed (§6.2). |
| `docs/architecture/vocab/README.md` | both/copy | Points at joining-concepts (IA) and pcdp (HM). |
| `docs/architecture/vocab/joining-concepts.vocab.json` | industrial-atlas | Machine tokens for joins. |
| `docs/architecture/vocab/joining-concepts.schema.json` | industrial-atlas | Schema for the joining vocab. |
| `docs/architecture/vocab/pcdp.vocab.json` | heavymap | Machine tokens for display. |
| `docs/architecture/vocab/pcdp.schema.json` | heavymap | Schema for the PCDP vocab. |
| `docs/data/README-monroe-swis-crosswalk.md` | industrial-atlas | Identifier crosswalk. |
| `docs/data/monroe-swis-crosswalk.csv` | industrial-atlas | Crosswalk table. |
| `docs/normalization/ny-sbl.md` | industrial-atlas | NY identifier rules. |
| `docs/normalization/ny-sbl-sources.md` | industrial-atlas | Sources for those rules. |
| `docs/normalization/ny-sbl-real-data-evidence.md` | industrial-atlas | Evidence notes (no row values). |
| `docs/for-agents/HARD-RULES.md` | both/copy | Rules 1–11 are universal. Rule 12 (vacancy display / UI naming) is a HeavyMap presentation rule: keep the full rule on HM; IA copy keeps "do not assert vacancy" as a claim rule and drops UI-copy examples. |
| `docs/for-agents/CLOUD-ENVIRONMENT.md` | both/copy | Already names `industrial-atlas` as a later second repo. IA copy: E3-style Python install. HM copy: Node / Vite / Playwright for `web/`. Update the repo list in both (see §5.5). |
| `docs/for-humans/GLOSSARY.md` | both/copy | Terms span pipeline and product. IA copy: service, pull, spine, join, licence, MPAC/NPCA, D-13. HM copy: claim, G6-as-user-facing-status, dossier-as-surface, refusal as shown to a reader. |
| `docs/02-dataset-inventory-v4-NOTES.md` | industrial-atlas | MCS notes. Byte-identical to `heavymap-planning/02-dataset-inventory-v4-NOTES.md` (checked 2026-10-18). Keep one copy under IA planning; see the `delete` row for the duplicate. |
| `docs/04-uk-capability-glean.md` | industrial-atlas | UK *capability* pattern notes (not UK geography). Byte-identical to `docs/grok-bot-docs/04-uk-capability-glean.md`. Keep one IA copy. |
| `docs/06-mcs-doc-path-columns.md` | industrial-atlas | MCS column notes. Differs from `heavymap-planning/06-mcs-doc-path-columns.md`. Keep the planning copy as canonical unless a later pass diffs them; do not invent a merge here. |
| `docs/grok-bot-docs/04-uk-capability-glean.md` | delete | Duplicate of `docs/04-uk-capability-glean.md`. After the surviving IA copy is placed, drop this path. |
| `docs/pivot-from-paton.txt` | heavymap | Company-origin note, not pipeline. Not an IA foundation doc. |

### 2.3 `heavymap-planning/`

There is **no** `heavymap-planning/00-PLANNING-INDEX.csv`. The living index is `Spreadsheets/00-PLANNING-INDEX.csv` (see `scripts/check_index_paths.py`). After the split this file lives at `inventory/00-PLANNING-INDEX.csv` on IA. This plan is added to the current path.

| Path | Destination | Reason |
|---|---|---|
| `heavymap-planning/REPO-SPLIT.md` | both/copy | This document. After execution, IA keeps the back-end half of the record; HM keeps a short "we consume IA artifacts" pointer plus the execution date. |
| `heavymap-planning/DATASET-ROUTINE.md` | industrial-atlas | Discovery / profile / harmonise routine. |
| `heavymap-planning/BETA-GATE-HAMILTON.md` | industrial-atlas | Universal gate, checks, run records, publish visibility. See §3 for front-end sentences to strip (browser notice, site size as a Pages concern, "how they appear on heavymap.com"). |
| `heavymap-planning/PROCESS-INSIGHTS.md` | both/copy | Standing rule. After the split the two copies name different logs and prefixes (§6.5): IA `inventory/19-process-insights.csv` (`PI-`); HM `heavymap-planning/frontend/19-process-insights.csv` (`HM-PI-`). |
| `heavymap-planning/OPEN-DECISIONS.md` | both/copy | Split the list. IA keeps 1–7 (defer vs needs_more, MCS vs layer, D-13, join grade, MCS location, G6-as-data-gate, score formula). HM does not inherit those. New HM open questions live in the v0 spec / HeavyMap.com issues. Do not settle any of them here. |
| `heavymap-planning/EPIC-01-source-catalog.md` | industrial-atlas | Source catalog epic. |
| `heavymap-planning/EPIC-02-spine-and-joins.md` | industrial-atlas | Spine epic. |
| `heavymap-planning/02-dataset-inventory-v4-NOTES.md` | industrial-atlas | Canonical MCS notes (see duplicate in `docs/`). |
| `heavymap-planning/06-mcs-doc-path-columns.md` | industrial-atlas | MCS path columns (differs from `docs/06`). |
| `heavymap-planning/07-jurisdiction-roster-v1.md` | industrial-atlas | Roster narrative. |
| `heavymap-planning/10-joining-concepts-v1.md` | industrial-atlas | Joining-concepts draft. |
| `heavymap-planning/11-synonym-parallel-ledger-v1.md` | industrial-atlas | Ledger narrative. |
| `heavymap-planning/12-authority-scale-and-meta-proposals.md` | industrial-atlas | Authority scale / `access_tier`. See §3 for the UI-grouping sentence to strip. |
| `heavymap-planning/13-catalog-audit-2026-09-30.md` | industrial-atlas | Catalog audit. |
| `heavymap-planning/13-catalog-audit-2026-09-30-problems.csv` | industrial-atlas | Audit rows. |
| `heavymap-planning/14-relevant-rows-fix-list.md` | industrial-atlas | Fix list narrative. |
| `heavymap-planning/14-relevant-rows-fix-list.csv` | industrial-atlas | Fix list rows. |
| `heavymap-planning/drafts/dataset-routine-SKILL.md` | industrial-atlas | Unregistered skill draft. |
| `heavymap-planning/focus/hamilton/` (whole tree) | industrial-atlas | Hamilton pull, tiles, conservation, OP, MPAC/NPCA findings, dataset CSVs. Pipeline notes. See §3 for `INSIGHTS.md` first-view / "encased by nature" (that line is HM). |
| `heavymap-planning/frontend/PRIOR-ART-GLEAN.md` | heavymap | Front-end glean (NA-32). |
| `heavymap-planning/frontend/V0-SPEC.md` | heavymap | v0 vision, layouts, lenses. **PR #71 only.** |
| `heavymap-planning/frontend/mockups/` | heavymap | Excalidraw / PNG / SVG layout studies. **PR #71 only.** |

### 2.4 `Spreadsheets/` (becomes `inventory/` at execution)

All current sheets are back-end inventory. Folder rename `Spreadsheets/` → `inventory/` is decided (§6.3); file numbers stay. This table uses today's paths. Front-end-only insight rows already in sheet 19 stay there as historical `PI-` rows (append-only). New front-end insights go to the HM log with prefix `HM-PI-` (§6.5).

| Path | Destination | Reason |
|---|---|---|
| `Spreadsheets/00-PLANNING-INDEX.csv` | industrial-atlas | Index of planning docs. Becomes `inventory/00-PLANNING-INDEX.csv`. HM gets a new, short front-end index after the split. |
| `Spreadsheets/02-dataset-inventory-v4.csv` | industrial-atlas | MCS CSV (source of truth in-repo). |
| `Spreadsheets/02-dataset-inventory-v4-readme.csv` | industrial-atlas | MCS README sheet. |
| `Spreadsheets/02-dataset-inventory-v4.xlsx` | industrial-atlas | Regenerated workbook. |
| `Spreadsheets/07-jurisdiction-roster-v1.csv` | industrial-atlas | Jurisdiction roster. |
| `Spreadsheets/08-parcel-contextual-dataset-assessment.xlsx` | industrial-atlas | Scratch assessment. |
| `Spreadsheets/09-per-jurisdiction-dataset-catalog.xlsx` | industrial-atlas | Regenerated catalog. |
| `Spreadsheets/09-per-jurisdiction-dataset-catalog-counties.csv` | industrial-atlas | Catalog counties. |
| `Spreadsheets/09-per-jurisdiction-dataset-catalog-municipalities.csv` | industrial-atlas | Catalog municipalities. |
| `Spreadsheets/09-per-jurisdiction-dataset-catalog-cross-cutting.csv` | industrial-atlas | Catalog cross-cutting. |
| `Spreadsheets/09-per-jurisdiction-dataset-catalog-readme.csv` | industrial-atlas | Catalog README. |
| `Spreadsheets/11-synonym-parallel-ledger-v1.csv` | industrial-atlas | Synonym ledger. |
| `Spreadsheets/15-pilot-join-matrix-welland-rochester.csv` | industrial-atlas | Pilot joins. |
| `Spreadsheets/16-service-profile.csv` | industrial-atlas | Service profile. |
| `Spreadsheets/17-layer-profile.csv` | industrial-atlas | Layer profile. |
| `Spreadsheets/18-quirks-log.csv` | industrial-atlas | Quirks. |
| `Spreadsheets/19-process-insights.csv` | industrial-atlas | Back-end insights only after the split (`PI-`). Becomes `inventory/19-process-insights.csv`. See §6.5. |
| `Spreadsheets/20-data-gaps-ledger.csv` | industrial-atlas | Public gap ledger. |
| `Spreadsheets/21-issue-class-register.csv` | industrial-atlas | Class register (PR #79). |
| `Spreadsheets/restricted/README.md` | industrial-atlas | Restricted-list mechanism. Live CSV stays gitignored. |
| `Spreadsheets/restricted/RESTRICTED-DATASETS.template.csv` | industrial-atlas | Headers-only template. |
| `Spreadsheets/drafts/16-service-profile.PASS2-DRAFT.csv` | industrial-atlas | Draft. |
| `Spreadsheets/drafts/17-layer-profile.PASS2-DRAFT.csv` | industrial-atlas | Draft. |
| `Spreadsheets/drafts/17-layer-profile.PASS2-EVIDENCE.csv` | industrial-atlas | Draft. |
| `Spreadsheets/drafts/PASS2-CONFLICTS.csv` | industrial-atlas | Draft. |

### 2.5 `scripts/`

| Path | Destination | Reason |
|---|---|---|
| `scripts/check_index_paths.py` | industrial-atlas | Validates the planning index. Update the path constant to `inventory/00-PLANNING-INDEX.csv` at the folder rename. HM will need its own path check if it keeps a front-end index. |
| `scripts/cloud-install.sh` | both/copy | IA copy: Python compile + unittest + index check. HM copy: `web/` install + contract / browser tests (once #71 lands). |
| `scripts/cloud-start.sh` | both/copy | IA: nothing to start. HM: optional local Vite, still nothing published before the gate. |
| `scripts/link_hamilton_overlays.py` | industrial-atlas | Overlay CLI wrapper. |
| `scripts/mint_hamilton_registry.py` | industrial-atlas | Registry CLI wrapper. |
| `scripts/monroe_swis_crosswalk.py` | industrial-atlas | Crosswalk builder. |
| `scripts/ny_identifier_real_check.py` | industrial-atlas | Identifier check (local-data only). |
| `scripts/rebuild_spreadsheet_workbooks.py` | industrial-atlas | xlsx from CSV. |
| `scripts/xlsx_sheets.py` | industrial-atlas | Stdlib xlsx helper. |
| `scripts/tiles/prep_tiles_hamilton.py` | industrial-atlas | Public-field NDJSON prep. Writes `local-data/` only. |
| `scripts/tiles/build_tiles_hamilton.sh` | industrial-atlas | tippecanoe PMTiles build. |
| `scripts/tiles/range_http_server.py` | industrial-atlas | Local Range-request test server. Not Pages deploy. |

### 2.6 `tests/`

| Path | Destination | Reason |
|---|---|---|
| `tests/test_heavymap_ids.py` | industrial-atlas | Registry. |
| `tests/test_heavymap_overlays.py` | industrial-atlas | Overlay linker. |
| `tests/test_heavymap_dossier.py` | industrial-atlas | Dossier build and screening. |
| `tests/test_heavymap_gaps.py` | industrial-atlas | Ledger loader. |
| `tests/test_ny_identifiers.py` | industrial-atlas | NY identifiers. |
| `tests/test_monroe_swis_crosswalk.py` | industrial-atlas | Crosswalk. |
| `tests/test_rochester_spine_fixture.py` | industrial-atlas | Rochester fixture. |
| `tests/test_hamilton_catalog_write.py` | industrial-atlas | Catalog write. |
| `tests/test_xlsx_sheets.py` | industrial-atlas | xlsx helper. |
| `tests/test_issue_class_register.py` | industrial-atlas | Sheet 21 register (PR #79). |
| `tests/test_pcdp_vocab.py` | heavymap | Loads `docs/architecture/vocab/pcdp.*.json`. Follows PCDP. After the split, HM may keep this as a small Python check or rewrite it in Node next to `web/tests/contract.test.js` (PR #71). |

### 2.7 Agent-docs, Cursor, GitHub, skills

| Path | Destination | Reason |
|---|---|---|
| `AGENTS.md` | both/copy | See §2.1. |
| `AGENTS-MCS.md` | industrial-atlas | See §2.1. |
| `CLAUDE.md` | both/copy | See §2.1. |
| `docs/for-agents/HARD-RULES.md` | both/copy | See §2.2. |
| `.cursor/rules/hard-rules.mdc` | both/copy | Pointer at HARD-RULES. |
| `.cursor/rules/planning-and-sheets.mdc` | industrial-atlas | Sheets, MCS, `DATASET-ROUTINE`. |
| `.cursor/rules/architecture.mdc` | both/copy | Today it names the four concepts and `heavymap/` Python. IA copy: spine / bands / claims + Python package. HM copy: PCDP + `web/`. |
| `.cursor/environment.json` | both/copy | Today: one repo, E3 Python. After the split the Cursor environment **repo list** must include both repositories (§5.5). IA env keeps the Python install. HM env adds Node. |
| `.cursor/settings.json` | both/copy | Linear plugin on. Harmless in both. |
| `.github/copilot-instructions.md` | both/copy | Pointer at `AGENTS.md` / HARD-RULES / insights path. Rewrite paths per repo. |
| `.github/PULL_REQUEST_TEMPLATE.md` | both/copy | IA template keeps MCS + pulled-data checks. HM template keeps no-owner / no-publish and drops MCS cells unless a front-end PR truly touches them (it should not). |
| `.agents/skills/heavymap-dataset-profiling/` | industrial-atlas | Dataset profiling. Rename later if the IA product name should appear in the skill name. |
| `.agents/skills/heavymap-pcdp/` | both/copy | Today it spans identifiers (IA) and PCDP (HM). Split: IA skill = spine / identifiers / fixtures; HM skill = PCDP surfaces / lenses / notices. |
| `.agents/skills/untrusted-web-text/` | both/copy | Generic. Same file in both. |

### 2.8 `first-attempts/` (prior art)

Prior-art baseline only. Not the product root. UK geography stays out of product scope.

| Path | Destination | Reason |
|---|---|---|
| `first-attempts/niagara-atlas/` (docs, `scripts/`, `tests/`, recon, `TECHNOLOGY-DECISIONS.md`, ledgers) | industrial-atlas | Pipeline / recon / D-13 prior art. |
| `first-attempts/niagara-atlas/` (`index.html`, `app.js`, `map.js`, `styles.css`, `candidates.html`, `package.json`) | heavymap | UI prior art for the glean (NA-32). |
| `first-attempts/niagara-atlas/data/*.geojson` and `*.json` | both/copy as prior-art only | Still tracked (HARD-RULES 1 exception for this archived tree). Must not be copied into product `web/` or IA `local-data` as if they were current pulls. Do not delete in this plan; a later hygiene issue can drop them from both trees if Morgen wants the exception closed. |
| `first-attempts/uk-atlas/` (app, property page, map, styles, `system/`) | heavymap | Front-end process reference (NA-286 already removed UK data files). |
| `first-attempts/uk-atlas/scripts/` | industrial-atlas | Capability-pattern scripts only. No UK geography ingest. |
| `first-attempts/uk-atlas/CNAME` | delete | Old Pages host for the UK prototype. Do not publish. |

Practical execution: copy the whole `first-attempts/` tree into both repos (it is 101 tracked files), then delete the out-of-scope half from each. Cheaper than a file-by-file `filter-repo` on this archive.

### 2.9 `heavymap/` Python package (all `industrial-atlas`)

| Path | Destination | Reason |
|---|---|---|
| `heavymap/__init__.py` | industrial-atlas | Package root. Rename is §6.2. |
| `heavymap/ny_identifiers.py` | industrial-atlas | NY identifier helpers. |
| `heavymap/gaps.py` | industrial-atlas | Ledger loader. |
| `heavymap/ids/` | industrial-atlas | Registry. |
| `heavymap/overlays/` | industrial-atlas | Overlay linker. |
| `heavymap/dossier/` | industrial-atlas | Dossier build, schema, screening. This **is** the interface the front end consumes (§4). |

### 2.10 `fixtures/` (all `industrial-atlas`)

| Path | Destination | Reason |
|---|---|---|
| `fixtures/ids/README.md` | industrial-atlas | ID fixtures. |
| `fixtures/parcels/README.md` | industrial-atlas | Parcel fixtures. |
| `fixtures/parcels/hm-us-ny-rochester-parcel-SYN-04799.json` | industrial-atlas | Synthetic Rochester unit. |

### 2.11 PR #71 only (stay on `heavymap`)

These are not on `main`. They stay on `codex/heavymap-v0-frontend` and land in `heavymap` only. They are never candidates for `industrial-atlas`.

| Path | Destination | Reason |
|---|---|---|
| `web/` (app, map, dossier, fixtures, Vite, Playwright, synthetic PMTiles) | heavymap | v0 site. |
| `heavymap-planning/frontend/V0-SPEC.md` | heavymap | Lenses, layouts, budgets. |
| `heavymap-planning/frontend/mockups/` | heavymap | Layout studies. |
| `#71` edits to `Spreadsheets/00-PLANNING-INDEX.csv` and `Spreadsheets/19-process-insights.csv` | industrial-atlas (the sheets) + heavymap (the FE insight rows, if split) | Rebase after this plan PR. Insight ids PI-0070..0077 are reserved for that branch. Do not reuse them here. |

### 2.12 Counts

Unique path keys from §2.1–2.11. Reprint rows in §2.7 (the same `AGENTS.md` listed twice, and so on) are counted once. Annotated first-attempts / `focus/hamilton` rows that the simple path regex missed are included. The PCDP skill folder and its `SKILL.md` count as one `both/copy` path. `both/copy` is not double-counted as a move.

| Destination | Unique paths on `main` | Paths PR #71 only |
|---|---|---|
| `industrial-atlas` | 101 | 0 |
| `heavymap` | 9 | 3 (`web/`, `V0-SPEC.md`, `mockups/`) |
| `both/copy` | 27 | 0 |
| `delete` | 2 | 0 |
| **Total classified** | **139** | **3** |

How the 101 / 9 / 27 / 2 break down:

- `industrial-atlas` 101 = previous 96 plus PR #79 paths `docs/architecture/publish-visibility.md`, `Spreadsheets/21-issue-class-register.csv`, `Spreadsheets/restricted/README.md`, `Spreadsheets/restricted/RESTRICTED-DATASETS.template.csv`, `tests/test_issue_class_register.py`.
- `heavymap` 9 on `main` = `CNAME`, `PCDP.md`, two PCDP vocab files, `docs/pivot-from-paton.txt`, `test_pcdp_vocab.py`, `PRIOR-ART-GLEAN.md`, niagara-atlas UI half, uk-atlas UI half. After #71 lands, `web/` becomes the bulk of `heavymap`.
- `both/copy` 27 = 26 agent / architecture / install copies + `first-attempts/niagara-atlas/data/` as prior-art only.
- `delete` 2 = duplicate `docs/grok-bot-docs/04-uk-capability-glean.md` and `first-attempts/uk-atlas/CNAME`.

---

## 3. Mixed files (split or rewrite)

These files are in-scope for one destination but currently mention the other product. Rewrite at execution, not in this PR. Strip lists are exhaustive for the current text; if a later commit adds more mix, strip that too.

| Path | Lands in | Strip or move |
|---|---|---|
| `docs/architecture/README.md` | both/copy | IA copy: drop PCDP surface tokens as a product tour; keep `ui_surfaces` only as an MCS column the pipeline may fill. HM copy: drop MCS Part 2 plumbing and D-5. |
| `docs/architecture/parcel-dossier.md` | industrial-atlas | Strip "the v0 front end reads when a parcel is clicked", "matching the UI copy style (classification · join · confidence)", "The front end already has `heavymap_id` from the clicked PMTiles feature", "The UI may style or group slivers", and the raw-vs-v0-spec byte-budget comparison that belongs in the HM v0 spec. Keep shard rule, schema, screening, and size facts the **build** must meet (those are IA budgets; HM has its own transfer budgets). |
| `docs/architecture/claim-refusal-contract.md` | industrial-atlas | Move "UI naming for surfaced source classes will be refined later" to an HM notice. Keep quoted-source-class rule as a claim rule. |
| `docs/architecture/context-band-ladder.md` | industrial-atlas | Already marks chrome as a non-goal. Leave that. Do not add lens names. |
| `docs/architecture/PCDP.md` | heavymap | Keep. It already refuses Leaflet / basemap / chrome. Do not move pull or mint procedure here. |
| `docs/architecture/adr/0001-osm-as-substrate.md` | both/copy | IA copy keeps "no bulk OSM prefetch as corpus". HM copy keeps "configurable tile endpoint as visual floor". Drop UK-atlas / Leaflet tour from the IA copy. |
| `docs/architecture/data-gaps-ledger.md` | industrial-atlas | "the front end loads once" → "the public consumer loads `gaps_ledger` from the manifest once". No panel talk. |
| `heavymap-planning/BETA-GATE-HAMILTON.md` | industrial-atlas | Strip §8 browser notice (NA-305 is HM). Strip "How they appear on heavymap.com is front-end work" as anything more than one sentence pointing at HeavyMap.com. Keep §6 size budgets that apply to **artifacts** (shard ≤ 50 KB p95, each `.pmtiles` ≤ 100 MB). Move "startup payload ≤ 50 KB" and "total site ≤ 1 GB (GitHub Pages)" to HM, because those are site-bundle rules. Section 9 items 1–9 and 10 are decided in PR #79 (item 5 remains open with interim `manifest_entry`); do not re-ask them. |
| `heavymap-planning/12-authority-scale-and-meta-proposals.md` | industrial-atlas | Strip "UI may group or filter by scale *within* a band" as a requirement. IA records `authority_scale` on the stamp. Grouping is HM. |
| `heavymap-planning/focus/hamilton/INSIGHTS.md` | industrial-atlas (data lines) / heavymap (first-view line) | The 2026-10-17 "encased by nature" first-view line is HM (already mirrored as PI-0011 and in PRIOR-ART-GLEAN). Data lines stay IA. |
| `heavymap-planning/focus/hamilton/DECISIONS.md` | industrial-atlas | Any provisional "map colour by dominant zone" row is HM; leave it listed as a pointer, do not specify palette. |
| `heavymap-planning/OPEN-DECISIONS.md` | both/copy | See §2.3. Do not settle. |
| `docs/for-agents/HARD-RULES.md` | both/copy | See §2.2. IA must not talk about "UI naming". |
| `docs/for-agents/CLOUD-ENVIRONMENT.md` | both/copy | Split the open questions: data pulls / allowlist / MCS / `hm/fresh-foundation` stay IA. HM gets Node install and Pages questions. |
| `AGENTS.md` | both/copy | IA: four-concept list without "lenses". HM: PCDP / lenses / notices, no MCS write-path. Each names its Linear project and repo. |
| `AGENTS-MCS.md` | industrial-atlas | `ui_surfaces` / `dossier_bands` stay as MCS columns the pipeline fills. Do not describe panel layout. |
| `README.md` | both/copy | Today it is a HeavyMap product blurb that also names the four concepts. Split as in §2.1. |
| `CONTRIBUTING.md` | both/copy | IA: datasets. HM: site. |
| `.cursor/rules/architecture.mdc` | both/copy | See §2.7. |
| `.agents/skills/heavymap-pcdp/SKILL.md` | both/copy | Split identifiers vs display. |
| `Spreadsheets/19-process-insights.csv` | industrial-atlas | Append-only. Do not rewrite old front-end rows. After the split, new HM sessions log `HM-PI-` rows on heavymap (§6.5). |
| `heavymap/dossier/schema.py` | industrial-atlas | Code stays IA. Confidence words (`high` / `medium` / `low`) are currently labelled "Provisional UI words" in `parcel-dossier.md`. Keep them as **schema enums the build emits**. HM may display different reader copy later; it must not require a schema change to do that. |

Unmerged branch `hm/fresh-foundation` (`15adec2`) is back-end CLI / registry work named in `CLOUD-ENVIRONMENT.md` question 5. It is an IA follow-up, not an HM branch. Do not fold it into `heavymap` as part of the split.

---

## 4. Interface / contract between the repos

Build outputs are **never committed to git** (HARD-RULES 1; BETA-GATE §7; `parcel-dossier.md`). `heavymap` therefore cannot `git submodule` a data path. It consumes a **versioned, screened artifact bundle** produced by an `industrial-atlas` run.

### 4.1 What IA emits (Hamilton today, pattern for every jurisdiction)

From `docs/architecture/parcel-dossier.md`, `scripts/tiles/`, and BETA-GATE §3 / §7. Paths are under gitignored `local-data/` on Deb:

| Artifact | Path pattern | Consumer use |
|---|---|---|
| Parcel / overlay PMTiles | `local-data/tiles/hamilton/<date>/*.pmtiles` | MapLibre source. Feature properties include `heavymap_id`. |
| Dossier manifest | `local-data/dossier/hamilton/<date>/manifest.json` | Startup load. Schema, shard rule, counts, sources, `gaps_ledger`, `fields_unavailable`. About 7 KB today. |
| Dossier shards | `local-data/dossier/hamilton/<date>/shards/{KK}.json` | One fetch on click. `KK` = last two characters of `heavymap_id`. `{"schema":1,"jurisdiction":"hamilton","shard":"KK","records":{...}}`. |
| Screened run record | proposed `local-data/runs/<run_id>.screened.json` | Proof of work (NA-308). Run id, dates, input hashes, `code_commit`, S1–S12, output hashes, repeat diffs. No owner values, no Deb home / owner-identifying machine paths. |
| Public gap ledger snapshot | copy of sheet 20 rows referenced by `gaps_ledger` | Transparent view. Names and rationale, never withheld values. |

`heavymap/dossier/schema.py` already pins `SCHEMA_VERSION = 1`. That integer is part of the contract. A breaking schema change increments it and requires a coordinated HM pin bump.

Tile feature contract the map relies on (minimum):

- `heavymap_id` (string, `hm:ca:on:hamilton:parcel:<ULID>`)
- geometry in the shared CRS floor (ADR 0001 follow-up; EPSG table still open)
- only allowlisted public fields (HARD-RULES 2 / 4)

HM must not parse owner, legal, mail, or other withheld keys. IA leak tests fail the build if those keys appear.

### 4.2 What HM consumes at deploy time

Recommended pin file on `heavymap` (new, at execution; not in this PR):

```json
{
  "industrial_atlas_repo": "niagaraassembly/industrial-atlas",
  "code_tag": "v0.1.0",
  "artifact": "hamilton-2026-10-17-<run_id>",
  "schema_version": 1,
  "jurisdiction": "hamilton"
}
```

Deploy (GitHub Pages on `heavymap`):

1. Read the pin.
2. Download the named GitHub Release (or object-store object) from `industrial-atlas`.
3. Verify `meta.json` (`code_tag`, `run_id`, `schema_version`, output SHA-256s) against the pin.
4. Copy `tiles/`, `dossier/manifest.json`, `dossier/shards/`, and the screened run record into the Pages artifact.
5. Publish Pages. No pipeline Python on the HM runner. No `local-data/` on the HM runner.

### 4.3 Why a tag checkout of `industrial-atlas` is not enough

Checking out `industrial-atlas` at a tag gives **code**, not tiles or shards. Those are produced on a machine that has `local-data/` (Deb today). A cloud checkout cannot rebuild Hamilton. So:

| Option | What it is | Consequence |
|---|---|---|
| **A. Recommended: IA GitHub Release (or public bucket) of screened artifacts, HM pins the release name** | Deb (or a self-hosted runner with `local-data/`) runs the pipeline, screens, uploads `hamilton-<date>-<run_id>`. | Pages stays static. History never holds data. Pin is reviewable in HM PRs. Works if IA is public **or** if the artifact host is public while the repo is private. |
| **B. HM Actions checks out IA at a tag and builds** | Needs the raw pulls on the runner. | Either commit data (forbidden) or attach a persistent data volume to GitHub-hosted runners (not available) or a self-hosted runner that is just Deb under another name. Still need a pin. Worse than A. |
| **C. Deb rsyncs into the HM Pages branch** | Manual copy of binaries onto `gh-pages`. | Binaries land in git history. Screening mistakes become permanent. Reject. |
| **D. Submodule of a data repo** | A third repo of artifacts. | Same as A with extra moving parts, unless Morgen wants a dedicated `ia-artifacts` later. Not required for v0. |

Versioning layers (all of them, not one):

1. **IA code tag** (`v0.1.0`) — Python package and schemas.
2. **Run id** (ULID) — one production build plus its repeat runs.
3. **Artifact name** (`hamilton-<date>-<run_id>`) — the files HM downloads.
4. **HM pin commit** — which artifact the live site uses.

A site rollback is a pin revert. An IA schema bump without an HM pin bump must not deploy.

### 4.4 Restricted data (field split, not dataset split)

Decided 2026-10-18. Design of the join endpoint is **deferred**. Record the rule so later work does not split whole datasets into a private repo.

- **Public `industrial-atlas`** holds code, public inventory sheets, the gap ledger, and screened run records. A `.gitignore` list (today `Spreadsheets/restricted/RESTRICTED-DATASETS.csv`; after the folder rename `inventory/restricted/RESTRICTED-DATASETS.csv`) tracks files and folders that are **not** pushed to the public IA repo for now, because some nuanced decisions are not ready to be public.
- **Restricted datasets are split by field, not by dataset.** The public layer (ID, geometry, allowlisted public attributes) ships in the public artifact. Restricted fields live in a **restricted sidecar** keyed by the same public ID (`ia_id` after the rename, `heavymap_id` until then). The sidecar is not in git.
- **Private storage, not git.** Restricted field values stay in `/fast/code/making/na/local-data/` and, when a git home is needed for operator notes or infra, in the future private `ia-restricted` repo. They never ship in the public artifact bundle and never sit in `heavymap` Pages files.
- **Display join is server-side and authenticated.** A static GitHub Pages site cannot hold tokens (HARD-RULES 10). Restricted fields are joined for display only through a later authenticated endpoint. That endpoint is not designed in this plan.
- **`niagaraassembly/heavymap-restricted`** is a separate, already-created private repo for secretive / proprietary **front-end** code and info the site may draw on. It is empty and unused. It is not a substitute for `ia-restricted` and it is not a place to put raw parcel owner fields.

---

## 5. Migration mechanics

### 5.1 History: `git filter-repo` for the new repo; delete-commit on `heavymap`

**Recommendation:** create `industrial-atlas` with `git filter-repo` (or `git-filter-repo`) from a mirror of `heavymap`, keeping the IA paths in §2. Then, on `heavymap`, delete those paths in one ordinary commit. Do **not** rewrite `heavymap` history.

Why this and not the alternatives:

| Option | Consequence |
|---|---|
| **IA via `filter-repo`; HM via delete-commit (recommended)** | IA blame and log for pipeline files are preserved (new SHAs, as filter-repo always rewrites). HM SHAs stay valid. PR #71, existing review comments, and GitHub issue commit links keep working. HM git still *contains* the old pipeline files in history (acceptable: they were already public). |
| Rewrite both histories with `filter-repo` | Cleaner HM tree, no pipeline files in HM history. Breaks every SHA, including PR #71's five commits and `mergeable_state: dirty` rebase. Every open review comment on those SHAs goes stale. Only do this if Morgen wants a scrub *and* #71 is landed or abandoned first. |
| `git subtree split` per top-level folder | Needs one split per root and a stitch. Worse than `filter-repo --paths-from-file` for this many roots. |
| Fresh copy, no history | Fast, loses blame on 259 files. Reject for IA. Acceptable only for `first-attempts/` if Morgen prefers a snapshot. |

`filter-repo` path list is the union of every `industrial-atlas` and `both/copy` row in §2. After the filter, rewrite the `both/copy` files as in §3 before the first IA commit on GitHub.

Do not run `filter-repo` in this PR. Execution sequence is §7.

### 5.2 Open PRs

| PR | Action |
|---|---|
| [#71](https://github.com/niagaraassembly/heavymap/pull/71) `codex/heavymap-v0-frontend` | **Stays on `heavymap`. Land it first (Morgen, §6.4 option E), then delete IA paths.** Still draft; dirty vs `main`. Its reserved insight ids are PI-0070..0077. Front-end insight rows that land with #71 are later copied or re-logged as `HM-PI-` on heavymap if they are UX findings; do not rewrite the reserved `PI-` numbers. Do not close #71 as part of creating IA. |
| [#80](https://github.com/niagaraassembly/heavymap/pull/80) (this plan) | Documentary. Merge before execution. |
| No other open PRs that must move | Back-end branches such as `hm/fresh-foundation` wait for IA. |

Unmerged **branches** that are back-end (`hm/fresh-foundation`, various `cursor/*` already merged or stale) are not moved automatically. `hm/fresh-foundation` should be rebased onto IA after that repo exists, or left and cited.

### 5.3 Linear and GitHub issue references

- Linear ids stay `NA-…`. Do not invent `NIA-` or a new prefix.
- Do not rewrite old commit messages or old PR bodies.
- After the split, new Industrial Atlas packets name repo `niagaraassembly/industrial-atlas`. New HeavyMap.com packets name `niagaraassembly/heavymap`.
- Move (or recreate) front-end epics that still sit on the Industrial Atlas project: **NA-32** (EPIC 10 — Front end and map experience) is still on Industrial Atlas today and should live on HeavyMap.com. NA-305, NA-308, NA-309, NA-310 are already on HeavyMap.com.
- GitHub issues on `heavymap` (36 open as of the 2026-10-18 repo payload) stay there unless Morgen wants a new IA tracker. Cross-link; do not bulk-migrate in the first execution pass.
- CODEOWNERS placeholders stay placeholders until Morgen fills handles.

### 5.4 Deb local paths

| Path | After the split |
|---|---|
| `/fast/code/making/na/heavymap` | Front-end checkout. |
| `/fast/code/making/na/industrial-atlas` | New sibling checkout (created at execution). |
| `/fast/code/making/na/local-data/` | Unchanged. Off git. Shared by both. Registry, overlays, tiles, dossier, runs stay here. |

Scripts that default to `../local-data` keep working if both checkouts sit next to `local-data/` as they do today (`heavymap` and a new `industrial-atlas` as siblings under `/fast/code/making/na/`). Do not put Deb owner names or home directories in docs.

### 5.5 Cursor environment repo list

`.cursor/environment.json` and `docs/for-agents/CLOUD-ENVIRONMENT.md` currently list `niagaraassembly/heavymap` only and already say "industrial-atlas later, if it becomes a repo". At execution:

1. Add `niagaraassembly/industrial-atlas` to the environment repo list.
2. Keep E3 Python install on the IA checkout.
3. Add a Node install / `web/` test path on the HM checkout (after #71).
4. Egress allowlist stays GitHub + PyPI until open-data hosts are named from sheet 16 (IA question, already open).

### 5.6 GitHub Pages

Stays on `heavymap`. `CNAME` is `heavymap.com`. There is no `.github/workflows` on `main` today. HARD-RULES rule 3 (PR #79) now allows building and testing publish or deploy tooling; actually publishing still needs Morgen's per-jurisdiction sign-off. The Pages download-of-pinned-artifact workflow is therefore allowed to be written on HM at execution. IA does not get Pages. `heavymap` cannot be made private (Pages / account constraint).

---

## 6. Decisions (Morgen, 2026-10-18)

These replace the open-question write-up in the first revision of this document. Options that were not chosen are kept only as history in git. **Do not execute the split or the rename from this PR.**

### 6.1 Visibility — DECIDED

- **`niagaraassembly/heavymap` stays PUBLIC.** Necessity: it is the GitHub Pages site, and the account cannot make that repo private.
- **`niagaraassembly/heavymap-restricted` exists** (created 2026-10-18, private, empty, unused). It is for secretive / proprietary **code and info the heavymap site may draw on**. It is not the back-end restricted store and it is not a place for raw owner-field values.
- **`industrial-atlas` will be PUBLIC.** The `.gitignore` list of files and folders tracks what is not pushed there for now, because some nuanced decisions are not ready to be public (today: `Spreadsheets/restricted/RESTRICTED-DATASETS.csv`; after §6.3, `inventory/restricted/RESTRICTED-DATASETS.csv`).
- **Keep the future `ia-restricted` concept** for restricted **back-end** data and infrastructure. It is not created in this split.
- **Restricted datasets are split by FIELD, not by dataset.** Public layer plus a restricted sidecar keyed by the same public ID. Restricted fields live in private storage (not git) and are joined for display only through a later **server-side authenticated endpoint**. A static Pages site cannot hold tokens. That endpoint design is **deferred**. See §4.4.

### 6.2 Package and ID naming — DECIDED option L, rename not performed

Full rename to Industrial Atlas naming. Morgen will review the table in §6.2.1 before anyone changes code. Proposed on-the-wire prefix is `ia:` and proposed JSON field is `ia_id`. Those two cells are the ones most worth a red-pen; everything else follows from them.

Do not change `hm:` or `heavymap_id` until that table is accepted.

### 6.2.1 Rename map (pending review)

Do not perform this rename in this PR or in the first `filter-repo` push. Apply it as a follow-up commit on `industrial-atlas` (and a coordinated pin bump on `heavymap`) after Morgen marks the table accepted or edits the "Proposed new" column.

Blast-radius key: **code** = Python package / tests / scripts; **schema** = dossier / tile / overlay JSON contract (`SCHEMA_VERSION` bump, HM pin bump); **registry** = already-minted Hamilton IDs on Deb `local-data/` (ULIDs kept); **docs** = architecture, ADRs, glossary, operator notes; **agents** = AGENTS.md, skills, cloud-install.

| # | Kind | Old name | Proposed new | Blast radius |
|---|---|---|---|---|
| R1 | Python package directory | `heavymap/` | `industrial_atlas/` | **code.** Every import, `compileall`, and `python3 -m` path. |
| R2 | Python import | `import heavymap` / `from heavymap…` | `import industrial_atlas` / `from industrial_atlas…` | **code.** `heavymap/ids`, `overlays`, `dossier`, `gaps.py`, `ny_identifiers.py`, all `tests/test_heavymap_*.py`. |
| R3 | Module run — registry | `python3 -m heavymap.ids` | `python3 -m industrial_atlas.ids` | **code, docs.** `scripts/mint_hamilton_registry.py`, `heavymap-id-registry.md`, ADR 0003. |
| R4 | Module run — overlays | `python3 -m heavymap.overlays` | `python3 -m industrial_atlas.overlays` | **code, docs.** `scripts/link_hamilton_overlays.py`, `heavymap-overlays.md`. |
| R5 | Module run — dossier | `python3 -m heavymap.dossier` | `python3 -m industrial_atlas.dossier` | **code, docs.** `parcel-dossier.md`. |
| R6 | ID prefix | `hm:` (`hm:{country}:{region}:{jurisdiction}:{grain}:{local}`) | `ia:` (`ia:{country}:{region}:{jurisdiction}:{grain}:{local}`) | **schema, registry, docs, agents.** `heavymap/ids/format.py` `SPINE_KEY_RE` and `SpineKey.__str__`; PCDP vocab `spine_key.template` / `regex`; every synthetic example (`hm:ca:on:welland:…`, `hm:us:ny:…`); tile and dossier strings. **Proposed, pending review.** |
| R7 | Dossier / tile field | `heavymap_id` | `ia_id` | **schema.** `heavymap/dossier/schema.py` `RECORD_SPEC`; overlay CSV header; `scripts/tiles/prep_tiles_hamilton.py`; shard record keys; MapLibre feature property the #71 front end reads. **Proposed, pending review.** |
| R8 | Overlay alias field | `hm_id` (read fallback in `heavymap/overlays/io.py`) | drop after migration, or read-only fallback to `ia_id` for one release | **code.** Small. Keep the fallback only if old overlay CSVs must still load. |
| R9 | SCHEMA_VERSION (dossier, registry store, overlays) | `1` | `2` | **schema.** Breaking. HM pin must require `schema_version: 2`. Old shard files are not readable without a translator. Do not bump until R6 and R7 are applied. |
| R10 | Already-minted registry IDs | `hm:ca:on:hamilton:{grain}:{ULID}` | `ia:ca:on:hamilton:{grain}:{ULID}` | **registry.** Keep the ULID `{local}` bytes unchanged. One migration run rewrites the prefix on every active and retired row, writes `legacy_hm_id` as an alias, and does not mint new ULIDs. Hamilton today: 166,745 parcel IDs plus address and footprint IDs in `local-data/heavymap-registry/hamilton/`. Re-pull reconcile must treat `legacy_hm_id` as a match key for one cycle. |
| R11 | ADR 0003 title and path | `docs/architecture/adr/0003-heavymap-id-format.md` — "Opaque ULID local token for the HeavyMap ID" | `docs/architecture/adr/0003-industrial-atlas-id-format.md` — "Opaque ULID local token for the Industrial Atlas ID" | **docs.** Add a one-line stub at the old path pointing at the new file so old links do not 404. |
| R12 | Registry operator doc | `docs/architecture/heavymap-id-registry.md` | `docs/architecture/industrial-atlas-id-registry.md` | **docs.** Same stub-at-old-path pattern. |
| R13 | Overlay operator doc | `docs/architecture/heavymap-overlays.md` | `docs/architecture/industrial-atlas-overlays.md` | **docs.** Same stub-at-old-path pattern. |
| R14 | Test module names | `tests/test_heavymap_ids.py`, `test_heavymap_overlays.py`, `test_heavymap_dossier.py`, `test_heavymap_gaps.py` | `tests/test_industrial_atlas_ids.py`, `test_industrial_atlas_overlays.py`, `test_industrial_atlas_dossier.py`, `test_industrial_atlas_gaps.py` | **code.** `unittest discover` follows the new names. Other tests (`test_ny_identifiers.py`, `test_issue_class_register.py`) keep their names unless they import `heavymap`. |
| R15 | Glossary term | HeavyMap ID / HeavyMap spine key | Industrial Atlas ID / Industrial Atlas spine key | **docs.** `docs/for-humans/GLOSSARY.md` (HM copy may say "the ID the map receives from Industrial Atlas, field `ia_id`"). IA copy owns the grammar. |
| R16 | Deb registry root | `local-data/heavymap-registry/` | `local-data/ia-registry/` | **registry.** Rename on Deb in the same migration run as R10. Update operator notes. Off git. |
| R17 | Deb overlay root | `local-data/heavymap-overlays/` | `local-data/ia-overlays/` | **registry.** Same as R16. |
| R18 | Fixture filename | `fixtures/parcels/hm-us-ny-rochester-parcel-SYN-04799.json` | `fixtures/parcels/ia-us-ny-rochester-parcel-SYN-04799.json` | **code, docs.** Update `test_rochester_spine_fixture.py` and the fixture README. |
| R19 | Dataset-profiling skill | `.agents/skills/heavymap-dataset-profiling/` | `.agents/skills/ia-dataset-profiling/` | **agents.** IA repo only. |
| R20 | PCDP skill | `.agents/skills/heavymap-pcdp/` | split: IA `.agents/skills/ia-spine/`; HM keeps `.agents/skills/heavymap-pcdp/` for display only | **agents.** Identifier half moves; display half stays on heavymap under the product name. |
| R21 | Cloud environment display name | `E3 atlas (heavymap)` in `.cursor/environment.json` | `E3 atlas (industrial-atlas)` on the IA checkout; HM checkout may say `E3 site (heavymap)` | **agents.** |
| R22 | Planning folder (optional, same decision family) | `heavymap-planning/` (IA half) | `ia-planning/` | **docs, agents.** Only the IA copy. HM keeps `heavymap-planning/frontend/`. Not required for the Python rename to land; listed so Morgen can accept or defer. |
| R23 | Product / Pages names that do **not** change | repo `heavymap`, site `heavymap.com`, Linear project HeavyMap.com, `#71` `web/` | keep | Front-end product name is HeavyMap. The foundation name is Industrial Atlas. |

Rows R6, R7, R9 and R10 are one coordinated cut. Doing R1–R5 without them leaves `import industrial_atlas` emitting `hm:` strings, which is option M and was rejected.

### 6.3 Sheet folder — DECIDED

Rename `Spreadsheets/` → `inventory/`. **Keep file numbers** (`00`, `02`, `07`–`09`, `11`, `15`–`21`, plus `restricted/`). Update `scripts/check_index_paths.py`, `AGENTS.md`, `AGENTS-MCS.md`, `.cursor/rules/planning-and-sheets.mdc`, the dataset-profiling skill, `.gitignore` (`inventory/restricted/RESTRICTED-DATASETS.csv`), and every index `doc_path`. Do not renumber.

### 6.4 PR #71 timing — DECIDED option E

Land #71 on `heavymap` first, then delete IA paths. See §5.2 and §7 step 3.

### 6.5 Process insights — DECIDED, two logs

Back-end and front-end insights are logged **separately**. Agents must do this without being told per issue. Exact replacement lines to write at execution (not in this PR) follow. Until the split, this repo still has one log at `Spreadsheets/19-process-insights.csv` with `PI-` (this session included).

| After the split | Path | Prefix |
|---|---|---|
| industrial-atlas (back end) | `inventory/19-process-insights.csv` | `PI-` |
| heavymap (front end) | `heavymap-planning/frontend/19-process-insights.csv` | `HM-PI-` |

Create the HM file at execution with the same columns as today's sheet 19. Start `HM-PI-0001`. Do not reuse `PI-` on heavymap. Do not write lens / layout / browser / Pages / PCDP-chrome findings into the IA log. Do not write pull / spine / licence / gap-ledger findings into the HM log. Historical front-end rows already in `PI-` (for example PI-0011, PI-0021, PI-0022) stay in the IA file (append-only).

#### Lines to add — `industrial-atlas`

**`AGENTS.md`** — replace the current Process insights section with:

```markdown
## Process insights (standing rule)

Before finishing any session or pull request, every agent appends its back-end process insights (sources found, dead ends ruled out, data quirks, method findings, effort estimates, gaps, licence notes) as new rows in [`inventory/19-process-insights.csv`](inventory/19-process-insights.csv), with live-verified evidence (URLs, counts, dates checked). Insight ids use the prefix `PI-` plus a zero-padded number. Never write front-end insights (lenses, layout, browser, Pages, PCDP chrome) here; those belong in `niagaraassembly/heavymap` as `HM-PI-` rows. Append only; never edit another session's row except its `status` or `linked_issue`. Agents that cannot write to the repo report them in the final message under the heading **Process insights**. Columns and etiquette: [heavymap-planning/PROCESS-INSIGHTS.md](heavymap-planning/PROCESS-INSIGHTS.md) (or `ia-planning/PROCESS-INSIGHTS.md` if that folder rename is accepted).
```

**`CLAUDE.md`** — replace the Process insights paragraph with:

```markdown
## Process insights (standing rule)

Before finishing any session or PR, append back-end process insights as new rows in `inventory/19-process-insights.csv`, prefix `PI-`, with live-verified evidence. Append only. Never log front-end (lens, layout, browser, Pages, PCDP chrome) insights here; those go to `niagaraassembly/heavymap` as `HM-PI-`. Columns and etiquette: [heavymap-planning/PROCESS-INSIGHTS.md](heavymap-planning/PROCESS-INSIGHTS.md). If you were told not to commit, still write the rows and say so. If you cannot write to the repo, list them in your final message under the heading **Process insights**.
```

**`.cursor/rules/hard-rules.mdc`** — replace the Process insights sentence with:

```text
Process insights (standing rule): before finishing any session or PR, append back-end process insights as rows in `inventory/19-process-insights.csv` (prefix `PI-`) with live-verified evidence. Never write front-end insights here (`HM-PI-` belongs in niagaraassembly/heavymap). See `heavymap-planning/PROCESS-INSIGHTS.md`. If you cannot write to the repo, list them in your final message under the heading `Process insights`.
```

**`.cursor/rules/planning-and-sheets.mdc`** — replace the last sentence with:

```text
Process insights go in `inventory/19-process-insights.csv` (prefix `PI-`, append only; see `heavymap-planning/PROCESS-INSIGHTS.md`). Front-end insights are `HM-PI-` rows in `niagaraassembly/heavymap` and must not be written here.
```

**`.github/copilot-instructions.md`** — replace the Process insights paragraph with:

```markdown
**Process insights (standing rule):** before finishing any session or PR, append back-end process insights as new rows in `inventory/19-process-insights.csv` (prefix `PI-`), with live-verified evidence. Append only. Never log front-end insights here; those are `HM-PI-` rows in `niagaraassembly/heavymap`. See [heavymap-planning/PROCESS-INSIGHTS.md](../heavymap-planning/PROCESS-INSIGHTS.md). If you cannot write to the repo, list them in your final message under the heading **Process insights**.
```

**`.github/PULL_REQUEST_TEMPLATE.md`** — replace the process-insights checkbox with:

```markdown
- [ ] Back-end process insights logged in `inventory/19-process-insights.csv` (prefix `PI-`: sources found, dead ends, data quirks, methods, effort estimates, gaps), or none this session. Front-end insights were not written here.
```

#### Lines to add — `heavymap`

**`AGENTS.md`** — replace the current Process insights section with:

```markdown
## Process insights (standing rule)

Before finishing any session or pull request, every agent appends its front-end process insights (UX, lenses, layout, browser, Pages, PCDP chrome, notices) as new rows in [`heavymap-planning/frontend/19-process-insights.csv`](heavymap-planning/frontend/19-process-insights.csv), with live-verified evidence. Insight ids use the prefix `HM-PI-` plus a zero-padded number (`HM-PI-0001`). Never write back-end insights (pulls, spine, joins, licences, gap ledger, run records) here; those belong in `niagaraassembly/industrial-atlas` as `PI-` rows. Append only; never edit another session's row except its `status` or `linked_issue`. Agents that cannot write to the repo report them in the final message under the heading **Process insights**. Columns and etiquette: [heavymap-planning/PROCESS-INSIGHTS.md](heavymap-planning/PROCESS-INSIGHTS.md).
```

**`CLAUDE.md`** — replace the Process insights paragraph with:

```markdown
## Process insights (standing rule)

Before finishing any session or PR, append front-end process insights as new rows in `heavymap-planning/frontend/19-process-insights.csv`, prefix `HM-PI-`, with live-verified evidence. Append only. Never log back-end (pull, spine, licence, gap ledger) insights here; those go to `niagaraassembly/industrial-atlas` as `PI-`. Columns and etiquette: [heavymap-planning/PROCESS-INSIGHTS.md](heavymap-planning/PROCESS-INSIGHTS.md). If you were told not to commit, still write the rows and say so. If you cannot write to the repo, list them in your final message under the heading **Process insights**.
```

**`.cursor/rules/hard-rules.mdc`** — replace the Process insights sentence with:

```text
Process insights (standing rule): before finishing any session or PR, append front-end process insights as rows in `heavymap-planning/frontend/19-process-insights.csv` (prefix `HM-PI-`) with live-verified evidence. Never write back-end insights here (`PI-` belongs in niagaraassembly/industrial-atlas). See `heavymap-planning/PROCESS-INSIGHTS.md`. If you cannot write to the repo, list them in your final message under the heading `Process insights`.
```

**`.cursor/rules/` (HM planning rule, new or edited)** — include:

```text
Front-end process insights go in `heavymap-planning/frontend/19-process-insights.csv` (prefix `HM-PI-`, append only; see `heavymap-planning/PROCESS-INSIGHTS.md`). Back-end insights are `PI-` rows in `niagaraassembly/industrial-atlas` and must not be written here.
```

**`.github/copilot-instructions.md`** — replace the Process insights paragraph with:

```markdown
**Process insights (standing rule):** before finishing any session or PR, append front-end process insights as new rows in `heavymap-planning/frontend/19-process-insights.csv` (prefix `HM-PI-`), with live-verified evidence. Append only. Never log back-end insights here; those are `PI-` rows in `niagaraassembly/industrial-atlas`. See [heavymap-planning/PROCESS-INSIGHTS.md](../heavymap-planning/PROCESS-INSIGHTS.md). If you cannot write to the repo, list them in your final message under the heading **Process insights**.
```

**`.github/PULL_REQUEST_TEMPLATE.md`** — replace the process-insights checkbox with:

```markdown
- [ ] Front-end process insights logged in `heavymap-planning/frontend/19-process-insights.csv` (prefix `HM-PI-`: UX, lenses, layout, browser, Pages, PCDP chrome), or none this session. Back-end insights were not written here.
```

Create `heavymap-planning/frontend/19-process-insights.csv` at execution with the same header as today's sheet 19. Create or rewrite `heavymap-planning/PROCESS-INSIGHTS.md` on HM so `insight_id` is documented as `HM-PI-` plus a zero-padded number.

### 6.6 Cursor environment — NOT ANSWERED (interim X)

**Interim working assumption: option X** — one Cursor environment listing both public repos (`heavymap` and, once created, `industrial-atlas`). The install script branches on repo name. Split to two environments (Y) only if Morgen later says so or the HM Node install becomes heavy. `heavymap-restricted` stays out of the default environment list until it has files.

### 6.7 Questions this plan does not re-open

`heavymap-planning/OPEN-DECISIONS.md` items 1–5 and 7 remain Morgen's (`defer` vs `needs_more`; MCS `dataset_id` vs layer `layer_id`; D-13 / future private ingest; NIA-86 join grade scale; MCS location conflict; score formula). OPEN-DECISIONS item 6 (G6 / HARD-RULES 3) was decided in PR #79: tooling may be built and tested; public publish still needs per-jurisdiction sign-off.

BETA-GATE §9 items **1–9 and 10 were DECIDED and merged in PR #79** (`b524f3e`). Only item **5 (`withheld_disclosure`) remains open**, with interim default `manifest_entry`. Do not re-ask items 1–4 or 6–10. Item 10's "timing pending" sentence in that merge is superseded by this plan: the split is planned now and executed only after Morgen accepts this document including the rename map.

---

## 7. Execution sequence (after this plan is approved)

Do not start these steps from this PR. Agents never merge. Morgen (or a later packet) runs or assigns each step.

1. **Morgen accepts or edits the rename map (§6.2.1).** Visibility, folder rename, #71 timing, and two insight logs are already decided. §6.6 stays interim X until answered.
2. **Create a dedicated Linear issue** on Industrial Atlas for the mechanical split, with an Agent packet and an MCS contract that says no MCS cells change. Child issue on HeavyMap.com for the HM-side delete, `HM-PI-` log, and doc rewrite.
3. **Land PR #71 on `heavymap` first** (§6.4 option E). Keep PI-0070..0077 on that branch.
4. **Freeze `heavymap` `main` briefly.** No mixed BE/FE PRs during the cut.
5. **Create public `niagaraassembly/industrial-atlas`.** Mirror `heavymap` locally, `git filter-repo --paths-from-file ia-paths.txt` using every `industrial-atlas` and `both/copy` path in §2. Push the filtered history. Do not add a README through the GitHub UI. Apply the public `.gitignore` so not-ready files are not pushed.
6. **Rewrite `both/copy` files on IA** per §3. Install the IA process-insights lines from §6.5. Rename `Spreadsheets/` → `inventory/` (§6.3). Do **not** apply the §6.2.1 rename inside `filter-repo`; that is a follow-up commit after Morgen accepts the table.
7. **On `heavymap`, one delete-commit** removing every `industrial-atlas` path. Install the HM process-insights lines from §6.5 and create `heavymap-planning/frontend/19-process-insights.csv`. Keep `CNAME`. Add a short README that points at `industrial-atlas` for data.
8. **Create `/fast/code/making/na/industrial-atlas`** on Deb next to `heavymap`. Leave `/fast/code/making/na/local-data/` where it is. Point IA scripts at `../local-data` as today.
9. **Add the HM pin file and a Pages download step** (HARD-RULES 3 now allows the tooling; public deploy still needs sign-off). Produce the first artifact from Deb; do not commit it. Restricted fields stay out of the artifact (§4.4).
10. **Update the Cursor environment repo list** to include both public repos (interim §6.6 option X). Do not add `heavymap-restricted` until it has files. Split `cloud-install.sh` per §2.5.
11. **Retarget Linear:** Industrial Atlas description says `industrial-atlas` is code SoT for the foundation; HeavyMap.com description says `heavymap` is the site. Move NA-32 to HeavyMap.com. New packets name the correct repo.
12. **CODEOWNERS / Copilot / CLAUDE.md / skills** rewritten in both repos using the §6.5 lines. Register the IA dataset-profiling skill; register a thinner HM PCDP skill.
13. **After Morgen accepts §6.2.1:** rename commit on IA (R1–R22 as accepted), registry prefix migration on Deb (R10, ULIDs kept), `SCHEMA_VERSION` 2, HM pin bump and `#71` field rename `heavymap_id` → `ia_id`.
14. **Verify:** IA `python3 -m unittest discover -s tests` and `python3 scripts/check_index_paths.py` (path `inventory/`). HM `#71` tests (`web/` contract + browser). No pulled data in either public git tree. No owner values in the first IA Release.
15. **Morgen reviews both trees and the first pin.** Only then is the split considered done. This plan PR stays documentary.

---

## 8. What this PR did

- Added this file and recorded Morgen's 2026-10-18 §6 decisions (visibility, option L rename map pending review, `inventory/` folder rename, land #71 first, separate `PI-` / `HM-PI-` logs, interim one Cursor environment).
- Added a row to `Spreadsheets/00-PLANNING-INDEX.csv` (there is no `heavymap-planning/00-PLANNING-INDEX.csv`).
- Appended process insights PI-0091..PI-0111 (PI-0070..0077 reserved for PR #71; PI-0081..0090 are PR #79).
- Rebased onto `main` at `b524f3e` (PR #79).
- Ran `python3 scripts/check_index_paths.py`.
- Did not create `industrial-atlas`, move files, rename the package or `hm:` ids, or merge.
