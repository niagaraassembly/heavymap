# Repo split plan: `heavymap` → `industrial-atlas` + `heavymap`

**Status:** reviewable plan. No files moved, no repo created, no merge.
**Date:** 2026-10-18.
**Approved to plan now:** Morgen, 2026-10-18. This answers BETA-GATE question 10 ("When to split universal back-end publishing into a separate `industrial-atlas` repo") by writing the split, not by executing it.
**Linear:** Industrial Atlas = back end after the split. HeavyMap.com = front end + human-facing documentation after the split. Closest existing issue: [NA-269](https://linear.app/niagaraassembly/issue/NA-269/define-g6-and-a-staged-pilot-publish-gate) (gate Q10). There is no dedicated Linear packet for the split itself.
**Repo today:** public `niagaraassembly/heavymap` (created 2026-09-21). `niagaraassembly/industrial-atlas` does not exist (org search 2026-10-18 returned only `heavymap`).
**This PR does not:** create the new repo, move or delete files, land PR #71, rewrite git history, or change Linear projects.

Inventory taken from `main` at `a6f24b9` (merge of PR #78, beta-gate Hamilton) plus the open draft PR [#71](https://github.com/niagaraassembly/heavymap/pull/71) on `codex/heavymap-v0-frontend` (33 files, `mergeable_state: dirty`). Tracked files on `main`: 259.

---

## 1. Split boundary

| After the split | Holds |
|---|---|
| **NEW `niagaraassembly/industrial-atlas`** | Universal back end / data foundation. Dataset catalog and inventory sheets, pull / normalise / spine / registry / overlay / dossier-build Python (`heavymap/` package and scripts), tests for those, data-gaps ledger, run records, back-end ADRs and architecture, `DATASET-ROUTINE`, beta-gate / publish-visibility / restricted mechanism, Industrial Atlas-side process insights. Documented as a universal foundation: no HeavyMap UI, lens, or UX particulars. |
| **`niagaraassembly/heavymap`** | Front end only. The v0 MapLibre / PMTiles site (PR #71 `web/` on `codex/heavymap-v0-frontend`), HeavyMap product / UX docs (PCDP display protocol, lenses, front-end notices), front-end Linear project docs. GitHub Pages and `CNAME` (`heavymap.com`) stay here. |
| **Linear Industrial Atlas** | Back-end issues, packets, and MCS / pipeline work. |
| **Linear HeavyMap.com** | Front-end + documentation issues (NA-32 and the public-site docs already listed there; NA-305 / NA-308 / NA-309 / NA-310 already sit here). |
| **Off git, shared** | Deb `local-data/` at `/fast/code/making/na/local-data/`. Serves both repos. Never committed. A future private `ia-restricted` is for restricted raw / withheld material that must not live in a public git repo; it is not created in this split. |

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
| `heavymap/` | industrial-atlas | The Python pipeline package (ids, overlays, dossier, gaps, NY identifiers). Name of the package is an open question (§6.2). |
| `heavymap-planning/` | (see §2.3) | Mostly IA. `frontend/` stays on HM. |
| `scripts/` | (see §2.5) | All current scripts are pipeline or cloud-install for Python. IA. |
| `Spreadsheets/` | (see §2.4) | Catalog, inventory, gaps, insights. IA. Sheet numbering is an open question (§6.3). |
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

There is **no** `heavymap-planning/00-PLANNING-INDEX.csv`. The living index is `Spreadsheets/00-PLANNING-INDEX.csv` (see `scripts/check_index_paths.py`). This plan is added to that file.

| Path | Destination | Reason |
|---|---|---|
| `heavymap-planning/REPO-SPLIT.md` | both/copy | This document. After execution, IA keeps the back-end half of the record; HM keeps a short "we consume IA artifacts" pointer plus the execution date. |
| `heavymap-planning/DATASET-ROUTINE.md` | industrial-atlas | Discovery / profile / harmonise routine. |
| `heavymap-planning/BETA-GATE-HAMILTON.md` | industrial-atlas | Universal gate, checks, run records, publish visibility. See §3 for front-end sentences to strip (browser notice, site size as a Pages concern, "how they appear on heavymap.com"). |
| `heavymap-planning/PROCESS-INSIGHTS.md` | both/copy | Standing rule. IA copy: data insights inventory. HM copy: front-end insight inventory (or a thin pointer if Morgen keeps one sheet; see §6.5). |
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

### 2.4 `Spreadsheets/`

All current sheets are back-end inventory. Process-insights rows that are front-end-only (for example PI-0021, PI-0022, PI-0011) stay in the IA inventory as historical findings and may be mirrored later on HM if Morgen wants a front-end sheet (open question §6.5). Sheet *numbers* are an open question (§6.3); this table uses today's names.

| Path | Destination | Reason |
|---|---|---|
| `Spreadsheets/00-PLANNING-INDEX.csv` | industrial-atlas | Index of planning docs. HM gets a new, short index of front-end docs after the split (not this file with IA rows left in place). |
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
| `Spreadsheets/19-process-insights.csv` | industrial-atlas | Data / method insights that feed published reports. Front-end-only rows are not deleted (append-only). See §6.5. |
| `Spreadsheets/20-data-gaps-ledger.csv` | industrial-atlas | Public gap ledger. |
| `Spreadsheets/drafts/16-service-profile.PASS2-DRAFT.csv` | industrial-atlas | Draft. |
| `Spreadsheets/drafts/17-layer-profile.PASS2-DRAFT.csv` | industrial-atlas | Draft. |
| `Spreadsheets/drafts/17-layer-profile.PASS2-EVIDENCE.csv` | industrial-atlas | Draft. |
| `Spreadsheets/drafts/PASS2-CONFLICTS.csv` | industrial-atlas | Draft. |

### 2.5 `scripts/`

| Path | Destination | Reason |
|---|---|---|
| `scripts/check_index_paths.py` | industrial-atlas | Validates `Spreadsheets/00-PLANNING-INDEX.csv`. HM will need its own path check if it keeps a front-end index. |
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
| `industrial-atlas` | 96 | 0 |
| `heavymap` | 9 | 3 (`web/`, `V0-SPEC.md`, `mockups/`) |
| `both/copy` | 27 | 0 |
| `delete` | 2 | 0 |
| **Total classified** | **134** | **3** |

How the 96 / 9 / 27 / 2 break down:

- `industrial-atlas` 96 = 93 simple-path rows + `heavymap-planning/focus/hamilton/` + `first-attempts/niagara-atlas/` pipeline half + `first-attempts/uk-atlas/scripts/`.
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
| `heavymap-planning/BETA-GATE-HAMILTON.md` | industrial-atlas | Strip §8 browser notice (NA-305 is HM). Strip "How they appear on heavymap.com is front-end work" as anything more than one sentence pointing at HeavyMap.com. Keep §6 size budgets that apply to **artifacts** (shard ≤ 50 KB p95, each `.pmtiles` ≤ 100 MB). Move "startup payload ≤ 50 KB" and "total site ≤ 1 GB (GitHub Pages)" to HM, because those are site-bundle rules. Q10 of §9 is answered by this plan; do not re-ask it. |
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
| `Spreadsheets/19-process-insights.csv` | industrial-atlas | Append-only. Do not rewrite old front-end rows. New HM sessions log to the place Morgen picks in §6.5. |
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

### 4.4 Restricted data

Public IA (if Morgen chooses public, §6.1) holds code, sheets, gap ledger, and *screened* run records. Raw pulls, owner fields, and `internal_only` / `withheld` datasets stay in `/fast/code/making/na/local-data/` and, later, in a private `ia-restricted` if Morgen wants git for those operator notes. They never ship in the artifact bundle.

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
| [#71](https://github.com/niagaraassembly/heavymap/pull/71) `codex/heavymap-v0-frontend` | **Stays on `heavymap`.** Land it on `heavymap` (still draft; dirty vs `main`) either before or after the delete-commit. If after, rebase onto post-delete `main`; the `web/` and `heavymap-planning/frontend/` files do not collide with IA paths. Its reserved insight ids are PI-0070..0077. Do not close it as part of creating IA. |
| No other open PRs (list 2026-10-18) | None to migrate. |

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

Stays on `heavymap`. `CNAME` is `heavymap.com`. There is no `.github/workflows` on `main` today; the Pages workflow is added on HM at execution (BETA-GATE still needs HARD-RULES 3 relaxed before a deploy pipeline is built — that remains Morgen's, OPEN-DECISIONS 6 / BETA-GATE Q7). IA does not get Pages.

---

## 6. Open questions for Morgen

Do not treat a recommendation in this section as a decision. Each question is written in full.

### 6.1 Should `niagaraassembly/industrial-atlas` be public or private?

**Context.** `heavymap` is public. Run records (screened) and the data-gaps ledger are meant to be public proofs of work (BETA-GATE §3, NA-308, sheet 20). Restricted and identifying material is *not* meant to live in that git repo. A future private `ia-restricted` is the planned home for withheld / internal-only operator material. Raw pulls already stay in `local-data/` off git.

**Option P — public `industrial-atlas` (lean this way unless Morgen objects).** Anyone can read the catalog, the gap ledger, the pipeline code, and (once Releases exist) the screened artifact bundles. That matches "built in the open" in `CONTRIBUTING.md` and makes the HM pin download simple (no token). Consequence: every IA commit is world-readable, so HARD-RULES and the screening allowlist become the only wall. A leaked owner value in a commit is a public leak. `ia-restricted` must exist before anyone is tempted to commit withheld notes "just for operators" into the public tree.

**Option Q — private `industrial-atlas`.** Pipeline code and sheets are org-only. Consequence: the public proofs (gap ledger, screened run records) need a *second* publishing path or they vanish from public view. HM Pages cannot download a private Release without a token in Actions. That token is a secret (HARD-RULES 10). A public artifact bucket or a thin public `ia-public` repo then has to be invented anyway. Private also blocks outside reviewers from reading the foundation.

**Option R — public `industrial-atlas` for code and sheets, artifacts on a public bucket, private `ia-restricted` for withheld operator notes.** Same as P plus an explicit third home. Consequence: three places to look; clearest rights boundary.

**This plan's working assumption for later steps:** P, with `ia-restricted` created only when there is withheld material that must be in git. Artifacts as GitHub Releases on the public IA repo. Confirm or replace this before execution step 1.

### 6.2 Should the Python package stay `heavymap` or be renamed (for example `industrial_atlas`)?

**Context.** On disk the package is `heavymap/` (`python3 -m heavymap.dossier`, `heavymap.ids`, `heavymap.overlays`). ADR 0003 and the registry docs say "HeavyMap ID". After the split, HeavyMap is the front-end product name and Industrial Atlas is the foundation name. Import paths appear in scripts, tests, operator notes, and Deb muscle memory.

**Option K — keep the package name `heavymap`.** Zero import churn. Consequence: the back-end repo is `industrial-atlas` but `import heavymap` still reads as the product. New contributors will put UI code in the Python package. Docs will keep saying "HeavyMap ID" for a ULID minted by Industrial Atlas.

**Option L — rename to `industrial_atlas` (or `ia`).** Matches the repo and Linear project. Consequence: every `python3 -m heavymap.*` wrapper, every test import, ADR 0003's title, `heavymap_id` in the dossier schema, and the `hm:` ID prefix become a coordinated rename. Changing `heavymap_id` / `hm:` is a **schema break** (`SCHEMA_VERSION` bump) and forces an HM pin bump. That is much larger than a Python package rename.

**Option M — rename the Python package to `industrial_atlas`, keep the public id string `heavymap_id` / `hm:` as a stable on-the-wire name.** Imports change; the artifact contract does not. Consequence: mid-size code edit, no HM schema break, names disagree on purpose (documented).

**This plan's working assumption:** M if Morgen wants the repo and the package to share a name; K if execution should be mechanical. Do not change `hm:` or `heavymap_id` in the first split.

### 6.3 Should `Spreadsheets/` sheet numbering be kept?

**Context.** Sheets are numbered `00`, `02`, `07`–`09`, `11`, `15`–`20` with gaps (`01`, `03`–`06`, `10`, `12`–`14` are planning-doc numbers, not sheets). Agents and the planning index cite those numbers. BETA-GATE proposes a possible sheet 21 (class register). Process insights are sheet 19.

**Option S — keep the numbers.** Zero churn. Consequence: IA inherits an odd sequence and the "HeavyMap planning" mental model. New IA-only sheets continue the series (`21`, `22`, …).

**Option T — renumber to a dense IA series.** Pretty. Consequence: every Linear packet, every `00-PLANNING-INDEX.csv` row, every narrative cite (`sheet 20`, `catalog 09`) breaks. Historical PRs become misleading. Reject unless Morgen wants a one-time encyclopedia rewrite.

**Option U — keep numbers, rename the folder** (for example `inventory/` or `ledgers/`) **without changing file prefixes.** Mild clarity. Consequence: path updates in `AGENTS.md`, `check_index_paths.py`, and the dataset-profiling skill; file names stay stable.

**This plan's working assumption:** S. Folder name `Spreadsheets/` can stay or become `inventory/` later; do not renumber in the first split.

### 6.4 When should PR #71 land relative to the delete-commit?

**Option E — land #71 on `heavymap` first, then delete IA paths.** Front-end files exist on `main` before the tree is cut. Consequence: one rebase of #71 onto current `main` (it is already dirty). Split delete-commit is then a pure removal of IA paths.

**Option F — delete IA paths on `heavymap` first, then rebase #71.** Also works: #71's `web/` and `frontend/` files do not sit on IA paths. Consequence: #71's incidental edits to `Spreadsheets/00-PLANNING-INDEX.csv` and `Spreadsheets/19-process-insights.csv` will conflict, because those files are gone from HM. Those hunks must be replayed onto IA instead.

**This plan's working assumption:** E. Land (or at least rebase and isolate) #71 before the HM delete-commit, and replay its sheet hunks onto IA if they are still needed.

### 6.5 Where do front-end process insights go after the split?

**Context.** The standing rule writes every session into `Spreadsheets/19-process-insights.csv`, and that inventory is meant to feed published synthesized reports about sources and gaps. Some rows are front-end method findings (PI-0021 UK dossier shape, PI-0022 Niagara LAYERS table, PI-0011 first-view stack).

**Option V — one IA sheet, all insights.** Reports stay in one place. Consequence: HM agents need write access to IA or they dump insights in the PR text for a human to log (already allowed when a session cannot write the repo).

**Option W — IA keeps sheet 19 for data; HM starts `Spreadsheets/19-process-insights.csv` or a front-end-only file for UX / lens / browser findings.** Consequence: two append-only logs; published reports must say which sheet they read. PI numbers would collide if both keep `PI-` unless HM uses a different prefix (for example `HM-PI-`).

**This plan's working assumption:** V for v0 (one public insights inventory, in IA), with HM sessions that cannot write IA reporting under **Process insights** in the PR, as `PROCESS-INSIGHTS.md` already allows.

### 6.6 One Cursor environment or two?

**Option X — one environment listing both repos.** Matches how Deb already has sibling checkouts. Consequence: install script must detect which repo it is in, or run both installs.

**Option Y — two environments (E3 atlas for IA, a new E4 site for HM).** Cleaner installs. Consequence: two dashboards to keep in sync; agents must be told which environment an issue uses.

**This plan's working assumption:** X at first, with the install script branching on repo name; split to Y if the HM Node install becomes heavy.

### 6.7 Already-open questions this plan does not touch

`heavymap-planning/OPEN-DECISIONS.md` items 1–7 remain Morgen's: `defer` vs `needs_more`; MCS `dataset_id` vs layer `layer_id`; D-13 / future private ingest; NIA-86 join grade scale; MCS location conflict (`AGENTS-MCS.md` vs `CONTRIBUTING.md`); G6 / HARD-RULES 3 deploy-pipeline relaxation; score formula. BETA-GATE §9 items 1–9 remain open. This plan only answers BETA-GATE §9 item 10 (when to split): **now, as a planned execution after Morgen reviews this document and §6.1–6.6.**

---

## 7. Execution sequence (after this plan is approved)

Do not start these steps from this PR. Agents never merge. Morgen (or a later packet) runs or assigns each step.

1. **Morgen answers §6.1–6.6** (visibility, package name, sheet numbers, #71 timing, insights home, Cursor env). Record the answers in `DECISIONS.md` / Linear, not by editing OPEN-DECISIONS in passing.
2. **Create a dedicated Linear issue** on Industrial Atlas for the mechanical split, with an Agent packet and an MCS contract that says no MCS cells change. Child issue on HeavyMap.com for the HM-side delete and doc rewrite.
3. **Land or isolate PR #71 on `heavymap`** (preferred: land, §6.4 option E). Keep PI-0070..0077 on that branch.
4. **Freeze `heavymap` `main` briefly.** No mixed BE/FE PRs during the cut.
5. **Mirror `heavymap` locally.** `git clone --mirror` then `git filter-repo --paths-from-file ia-paths.txt` using every `industrial-atlas` and `both/copy` path in §2. Create empty GitHub repo `niagaraassembly/industrial-atlas` at the visibility from §6.1. Push the filtered history. Do not add a README through the GitHub UI (that forks history).
6. **Rewrite `both/copy` files on IA** per §3 so the first IA commits on GitHub have no lens, layout, or heavymap.com chrome. Rename the Python package only if §6.2 says so, in a follow-up commit, not inside `filter-repo`.
7. **On `heavymap`, one delete-commit** removing every `industrial-atlas` path. Leave `both/copy` files and rewrite them per §3 (PCDP stays; MCS guide goes). Keep `CNAME`. Add a short README that points at `industrial-atlas` for data.
8. **Create `/fast/code/making/na/industrial-atlas`** on Deb next to `heavymap`. Leave `/fast/code/making/na/local-data/` where it is. Point IA scripts at `../local-data` as today.
9. **Add the HM pin file and a Pages download step** (after HARD-RULES 3 is relaxed). Produce the first artifact from Deb; do not commit it.
10. **Update Cursor environment repo list** to include both repos. Split `cloud-install.sh` per §2.5.
11. **Retarget Linear:** Industrial Atlas description says `industrial-atlas` is code SoT for the foundation; HeavyMap.com description says `heavymap` is the site. Move NA-32 to HeavyMap.com. New packets name the correct repo.
12. **CODEOWNERS / Copilot / CLAUDE.md / skills** rewritten in both repos. Register the IA dataset-profiling skill; register a thinner HM PCDP skill.
13. **Verify:** IA `python3 -m unittest discover -s tests` and `python3 scripts/check_index_paths.py`. HM `#71` tests (`web/` contract + browser). No pulled data in either git tree. No owner values in the first IA Release.
14. **Morgen reviews both trees and the first pin.** Only then is the split considered done. This plan PR stays documentary.

---

## 8. What this PR did

- Added this file.
- Added a row to `Spreadsheets/00-PLANNING-INDEX.csv` (there is no `heavymap-planning/00-PLANNING-INDEX.csv`).
- Appended process insights starting at PI-0091 (PI-0070..0077 reserved for PR #71).
- Ran `python3 scripts/check_index_paths.py`.
- Did not create `industrial-atlas`, move files, or merge.
