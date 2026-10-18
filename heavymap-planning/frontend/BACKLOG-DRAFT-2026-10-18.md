> Working amendments (2026-10-18): [WORKING-AGREEMENT.md](../WORKING-AGREEMENT.md) and the living frontend handoff govern current coordination. This draft is not a task-status board. PR #80 remains paused; no task sequence here resumes the split. Historical deployment observations must be reverified for the changed paths before merging. Recommendations remain open decisions unless explicitly accepted.
>
> Reference for [HANDOFF-2026-10-18.md](HANDOFF-2026-10-18.md). Draft as written by HM Front on 2026-10-18; nothing here is created in Linear or sent to the HeavyMap bot.

# HeavyMap.com front-end backlog: DRAFT for Morgen (not created in Linear)

HM Front, 2026-10-18. Nothing here has been created or changed in Linear. Existing HeavyMap.com issues: NA-305, NA-308 (standing), NA-309, NA-310 (standing), NA-33…NA-42 (docs), NA-37 (attribution), NA-52. The front-end epic **NA-32 still sits on the Industrial Atlas project** (PR #80 §5.3 says to move it). Proposed: move NA-32 to HeavyMap.com and parent the new items below under it.

Legend: **Maps to** = existing issue, or **new**. **BE** = needs an Industrial Atlas contract item (see §3).

## 1. Backlog

| ID | Title | Goal (one line) | Acceptance criteria | Depends on | Maps to |
|---|---|---|---|---|---|
| HM-01 | Prepare PR #71 for review | Deliver bounded B1/S1-S5 repairs and a B2 publication assessment; Morgen decides merge independently of the paused split | B1 conflicts resolved (main's 02 xlsx kept, 09 xlsx hunk dropped); S1–S5 fixed; `npm test` + Playwright pass; Pages exposure handled per D1; Morgen merges | D1 | NA-32 (child) |
| HM-02 | Pages exposure guard | Stop merges to `main` from publishing the repo tree unreviewed | Either `_config.yml` excludes `web/` and mockups, or Pages source = GitHub Actions; verified by `curl` that `/web/` is not served; HTTPS enforced | D1 (Morgen sets repo setting) | new |
| HM-03 | Dossier v1 adapter + lazy shard loader | Render the real record without changing the six-band display | Manifest (~7 KB) loaded at startup; click fetches `shards/` + `id.slice(-2)` + `.json` once (in-flight dedupe, bounded LRU); adapter maps `area/coverage/roll/addresses/overlays/gaps` → six bands; `share` fraction handled; `schema` ≠ pinned version → refuse with a named state; synthetic shard fixture tests; per-click transfer measured | BE-1, BE-2, BE-13 | NA-32 (child) |
| HM-04 | Front-end screening and leak scan | Defence in depth behind the IA allowlist | Display and export allowlists (no generic `Object.entries` stamp dump, no whole-object export); `dist/` + bundled artifact scanned for withheld key tokens (`owner, legal, mail, postal, phone, email`) and IA sentinel values; fails the build | BE-1, NA-306 | new |
| HM-05 | Transparent view mode | Name every absence, defect and screening honestly, with a toggle for a "show me everything" view | All 9 gap types render with ledger `reason` + counts from `gaps_ledger` (percent computed from numerator/denominator); gap ≠ refusal mapping per data-gaps-ledger.md; placeholder ARN shown as "placeholder, not shown"; `not_in_coverage` tied to its source dataset; loading/HTTP failure are UI states, never gaps; a dataset-level transparency page lists manifest-only rows | BE-3 | new |
| HM-06 | Withheld and held-identifying-info indicators | Show that a dataset applies to a parcel but its values are held, without implying a value | Per D3: coverage-based signal ("this source applies here; identifying fields withheld"); `publish_visibility` states handled (`restricted` generic notice, `withheld` per `withheld_disclosure`, `internal_only` never mentioned, with no UI string for it); copy slot left for the purchase-funnel wording; tests prove no per-row fill hint | D3, D4, BE-4, BE-5 | new |
| HM-07 | Sliver display | Flag, never hide | Every overlay row rendered; slivers styled and grouped at the end of each layer with count ("11 links, 5 flagged as slivers"); `share 0 & m2>0` → "below 0.01%"; never dropped from tooltip, map or export; test on a fixture with slivers | BE-14 | new (or fold into HM-03) |
| HM-08 | Browser notice: Chrome optimal, Firefox in progress | Brief, non-alarming notice | Shows in Firefox (UA + failed-range detection), not in Chrome; dismissible, remembered; mentioned on the method/about page; copy reviewed by Morgen | — | **NA-305** |
| HM-09 | Run Records element v1 | Public "how this was made" from the screened run record | Renders run id, dates, inputs (ids, counts, hashes), code commit, S1–S12 with thresholds and pass/warn/fail, repeat-run agreement (byte/ID/metric); link to the full screened JSON; blanks shown as "not computed: reason", never 0 | BE-6 | **NA-308** (standing) |
| HM-10 | Addresses with no parcel list | Dedicated list of unparcelled addresses | Panel/lens lists `address_no_parcel` entries from the index; click locates on map; count matches S11 "none" in the run record; lazy-loaded (not in startup) | BE-7 | **NA-309** |
| HM-11 | Experience profiles, increment 1 | Lite vs full experience, auto-picked or user-chosen | Profile registry (layers, tile sets, dossier detail per profile); auto-detect (device memory / connection / WebGL) with UI switch; persisted choice; profile vocabulary drawn from back-end names | D2, BE-9 | **NA-310** (standing) |
| HM-12 | Size-budget check for the site bundle | Enforce the accepted §6 budgets on HM output | CI step measures compressed startup payload, per-click shard p95, each .pmtiles, total site; warn/fail thresholds per D2; report artifact | D2, BE-12 | new (links NA-306) |
| HM-13 | Deploy workflow, build-only | Build and test the Pages pipeline without publishing | GitHub Actions builds `web/` + pinned artifact into a Pages artifact and uploads it; **deploy job gated** by a `github-pages` environment with Morgen as required reviewer + NA-269 per-jurisdiction sign-off reference; no deploy on push; dry-run documented | HM-14, D1, NA-269 | new |
| HM-14 | Industrial Atlas artifact pin + verify | Consume a screened IA release reproducibly | Pin file (`industrial_atlas_repo, code_tag, artifact, schema_version, jurisdiction`); workflow verifies `meta.json` SHA-256s and schema_version; mismatch fails; rollback = pin revert | BE-10 | new |
| HM-15 | Web CI and cross-browser tests | Keep the front end tested in both browsers | Node contract tests + Playwright Chromium **and Firefox** projects in CI; a range-read test against a gzip-transcoding server reproduces `range_gzip`; README updated for the split | NA-305 | new |
| HM-16 | Attribution and licence footer/page | Credit every source and basemap | Attribution control on whenever external tiles are used; per-source licence from manifest `sources` | BE-2 | **NA-37** |
| HM-17 | Search (address / roll / key) | Find a parcel without loading the address set | Prefix-sharded index; initial index ≤ budget; result opens the dossier via HM-03 | BE-8 | new (NA-32 child) |
| HM-18 | HM-side split rewrite | Make `heavymap` a clean front-end repo | HM AGENTS.md/CLAUDE.md/README/CONTRIBUTING/PR template rewritten; "UI chrome stays deferred" removed; V0-SPEC links repointed at IA; HM-PI log created and wired into every agent doc; web/README checks updated | PR #80 approval, D5 | new (HeavyMap.com child of the split issue, PR #80 §7 step 2) |
| HM-19 | Layout and basemap decision record | Close V0-SPEC Q1–Q2 | Morgen picks layout A/B/C and the default basemap direction; recorded in V0-SPEC | Morgen | new (small) |
| HM-20 | Reader docs for the transparent view | Explain gaps, slivers, withheld, run records to humans | Coverage & limitations and the reader's guide cover the new UI elements | HM-05…HM-09 | **NA-38, NA-35** |

Current order: prepare HM-01 and assess HM-02 as D1 permits. Other frontend fixture/design tasks may proceed on explicit branches with scoped dependencies. HM-18 remains paused with #80 and is not a prerequisite for all frontend work. Already-authorized Atlas validation proceeds concurrently.

## 2. Decisions for Morgen (written in full)

**D1. PR #71 merge vs live GitHub Pages.** Today heavymap.com is GitHub's legacy branch build of `main` at `/`. Every merge publishes the whole repo tree (for example `https://heavymap.com/Spreadsheets/20-data-gaps-ledger.csv` is live). Merging #71 as-is would publicly serve `web/` source, the 768-byte synthetic tile file and three mockup PNGs at heavymap.com/web/…, and the page would be broken (it points at Vite source files). Options:
- **A.** Switch Pages source to "GitHub Actions" now, with no workflow yet. heavymap.com stops serving anything (today's README/docs mirror goes offline) until a signed-off deploy.
- **B. (recommended)** Keep the current branch build and add a root `_config.yml` that excludes `web/` and `heavymap-planning/frontend/mockups/`. Today's site is unchanged and #71 adds nothing public. Switch to A when the gated deploy workflow (HM-13) lands.
- **C.** Accept that the synthetic prototype source is served publicly on merge (every file is labelled synthetic).

**D2. What does "startup payload ≤ 50 KB compressed" (BETA-GATE §6, accepted) cover?** #71's measured first load is ~459 KB compressed: MapLibre JS 299 KB, map worker 145 KB, CSS 13 KB, HTML 1.5 KB. MapLibre alone is about 9× the budget. Options:
- **A. (recommended)** Data only: dossier manifest, gap ledger and first-view style/index JSON, with the 50 KB applying to these. Set a separate app-shell budget of ≤ 500 KB compressed (today's 459 KB passes).
- **B.** Everything on first paint, including the map engine. That requires a static HTML/CSS intro under 50 KB, with MapLibre lazy-loaded on first interaction. It is feasible, adds a visible "map loading" step, and fits a "lite" experience profile (NA-310).
- **C.** A as the default profile, and B as the lite profile under NA-310.

**D3. How a dossier signals held identifying information.** The ledger rule (data-gaps-ledger.md) keeps `withheld_screened` rows (Cityview `Owner`, `Legal_Txt`) manifest-only, "so a parcel list cannot imply that this unit has a withheld value". You decided on 2026-10-18 that dossiers will signal held identifying info. Options:
- **A. (recommended)** Coverage-based signal. Every parcel that a source dataset covers shows "This source carries owner-name and legal-description fields. HeavyMap withholds them." The signal comes from dataset coverage, not from whether that parcel's row is filled, so no per-parcel value is implied. It needs a small back-end "datasets that apply to this parcel" list (BE-4).
- **B.** Per-parcel "a withheld value exists for this parcel" flag. This reveals the fill pattern (80,012 of 81,121 Cityview rows have an owner name) and needs the ledger rule changed.
- **C.** Site-level transparency page only, nothing in the dossier. This doesn't meet your decision.
- Sub-question: until the purchase-funnel wording exists, ship neutral placeholder copy ("Identifying details are held and not shown publicly"), or hold the element back until the copy is written?

**D4. `withheld_disclosure` default** (open; interim `manifest_entry`). It decides whether a `withheld` dataset is named in public output ("this source applies here and is held back") or omitted entirely. HM-06 will build both paths behind the setting. The choice is yours: `manifest_entry` or `none`.

**D5. Front-end process-insight log (reconciled).** Use `HM-PI-` and `heavymap-planning/frontend/19-process-insights.csv`, with the same columns as Atlas sheet 19. Earlier alternatives `heavymap-planning/HM-PROCESS-INSIGHTS.csv` and `inventory/hm-19-process-insights.csv` are superseded. File creation is deferred; until it exists, report frontend insights in the PR for later transfer. This routing does not resume the split.

**D6. Railway service `heavymap`** (project heavy-map-v1-railway) auto-deploys `main` on every push. The latest deploy FAILED at 2026-10-18 10:26 EDT. It has no domain, so nothing is public. Options:
- **A. (recommended)** Disconnect or pause it until there is a server-side need (for example the authenticated restricted-sidecar endpoint).
- **B.** Leave it as it is.

**D7. HeavyMap.com Linear project description is stale.** It says "nothing from MPAC or NPCA-derived layers" (contradicts HARD-RULES 4/5), cites gates "G3 or G5" (now the per-jurisdiction beta gate, NA-269) and names "NIA-31". Proposed replacement for the Rules list:
> * Architecture docs win on any conflict; data contracts live in Industrial Atlas.
> * No public publish or deploy before Morgen's per-jurisdiction beta-gate sign-off (NA-269). Building and testing deploy tooling is allowed (HARD-RULES 3).
> * Owner names, owner mailing addresses, legal descriptions and other personal information are never shown or shipped. Roll numbers, MPAC property/tax class and civic addresses may be shown (HARD-RULES 2, 4, 5).
> * Every doc and UI element names its sources and licences.
> * Agents draft; Morgen (or the coordinating bot) merges.
Approve the text, and say whether you want me to apply it through the Linear connector.

Reversible items I'll decide myself unless you object: S1–S5 fixes in #71, the property-code fixture in place of tax class (V0-SPEC Q5 stays open for a real tax-class source), and the backlog numbering and order. Still open from V0-SPEC, not blocking: layout A/B/C, basemap direction (HM-19), OSM experiment choice (deferred, NA-304).

## 3. Back-end contract asks for HeavyMap (Industrial Atlas)

This is the initial interface dependency register, not a duplicate of Linear task status. As each ask is assigned, add its change owner, other-track reviewer, producer/consumer Linear links, contract/fixture reference, and exactly what waits. Existing HM references below are draft backlog IDs, not fabricated Linear issues. Agreement, implementation and consumer verification need evidence on the linked issues/PRs; an unassigned ask is not a backend promise. See the [working agreement](../WORKING-AGREEMENT.md#interface-dependencies) for blocking scope.

| ID | Ask | Why (HM item) |
|---|---|---|
| BE-1 | Publish the **tile feature property allowlist**: confirm the key is `heavymap_id`, and which minimal display props parcel PMTiles carry (for example a dominant source class for tooltip and lens, `sliver_count`) | HM-03, HM-04, lens filtering without a shard fetch |
| BE-2 | The manifest `sources` block should give, for each `src` layer id: publisher, licence, retrieved_on, source vintage/last-edit, `publish_visibility` | Stamps ("source · join · confidence") and attribution are built from `src` lookups (HM-03, HM-16) |
| BE-3 | `gaps_ledger` in the manifest should carry `gap_type, scope, layer_id, field, reason, numerator, denominator, unit, status, publish_priority`. Also fix or neutralise the **GAP-0010 reason "about 46 percent"**, because 74,276/166,745 = 44.5% | HM-05 computes percentages from counts |
| BE-4 | A coverage-based, value-free per-record list of the datasets that apply to the parcel (for example `applies: ["LYR-NPCA-PARCELS-CITYVIEW", …]`), or a documented rule that lets the UI derive it | D3 option A / HM-06. Today a Cityview-covered parcel with no PropCode has no Cityview trace on its record |
| BE-5 | Manifest shape for `publish_visibility`: how `restricted` is signalled (a generic count only?), and `withheld` under `manifest_entry` vs `none`. Confirm that `internal_only` never appears | HM-06 |
| BE-6 | Screened run-record JSON: schema + version, stable path in the artifact (for example `runs/index.json` + `runs/<run_id>.screened.json`), S1–S12 with thresholds and status, and blank-with-reason encoding | HM-09 (NA-308) |
| BE-7 | `address_no_parcel` index: file shape, sharding if large, fields (address id, civic text, point lon/lat, source dataset id, tag/reason), and the Hamilton count | HM-10 (NA-309) |
| BE-8 | Search index (address / roll / key prefix shards): back-end emitted? Shape and size | HM-17 |
| BE-9 | Meta-stamps for profiles: per-layer/tile-set bytes, feature counts, minzoom, and a profile/weight tag; per-dossier-field tier, if any | HM-11 (NA-310) |
| BE-10 | Artifact bundle: `meta.json` fields, SHA-256 list, release naming `hamilton-<date>-<run_id>`, and where tiles live (Release vs bucket) | HM-14 |
| BE-11 | `range_gzip`: if tiles move off Pages (bucket/CDN) to fix Firefox, that's an infra decision. Otherwise HM tries a non-compressed extension/MIME on Pages | HM-08, HM-15 |
| BE-12 | Report **per-shard compressed p95** in the run record / NA-306 size check. Median ~26 KB gzip is known; p95 against the 50 KB accepted budget is not | HM-12 |
| BE-13 | Closed enums I will code against: `coverage.status`, `roll[].grade`/`flag`, `conf` (`high/medium/low`), `join` tokens. Bump `SCHEMA_VERSION` on any change | HM-03 |
| BE-14 | Overlay rows: confirm `share` is a 0–1 fraction (4 dp), and whether boundary-only touches (0 m²) are emitted (V0-SPEC wants "touch only" labels) | HM-07 |
| BE-15 | Naming switch: if `hm:` or `heavymap_id` changes, give advance notice with a `SCHEMA_VERSION` bump and a timeline. HM centralises the key name (S4) | HM-03 |
| BE-16 | PR #80 corrections: §5.6 says Pages has no active deploy and that HARD-RULES 3 still needs relaxing. Both are stale: Pages is a live legacy build of `main` `/`, and rule 3 was relaxed 2026-10-18 (BETA-GATE Q7). §6.5 working assumption V conflicts with the HM-PI log decision. §2.11 #71 sheet hunks: confirm they replay onto IA | split execution |

## 4. Front-end process insights (HM-PI, to log once the log exists)

| id | type | insight | evidence |
|---|---|---|---|
| HM-PI-0001 | hosting | heavymap.com is GitHub's legacy branch build of `main` `/`, so every merge to `main` publishes the full repo tree. Front-end merges must consider Pages exposure until the source moves to Actions | `gh api repos/niagaraassembly/heavymap/pages` (build_type legacy, source main /, last build b524f3e 2026-10-18 10:27 EDT); `https://heavymap.com/Spreadsheets/20-data-gaps-ledger.csv` 200, checked 2026-10-18 |
| HM-PI-0002 | performance | The #71 production build is ~459 KB compressed (JS 299 KB, worker 145 KB, CSS 13 KB, HTML 1.5 KB). MapLibre alone exceeds the accepted 50 KB startup budget, so a 50 KB all-in first load requires lazy-loading the map engine | `vite build` + `gzip -9` on #71 head 1d74db5, 2026-10-18 |
| HM-PI-0003 | data_quirk | The dossier v1 `share` is a 0–1 fraction (4 dp). The #71 fixtures use percent. Slivers at share 0.0 with m2 > 0 must read "below 0.01%", never "0.0%" | parcel-dossier.md § Overlays and slivers; web/src/dossier.js l.47–55 |
| HM-PI-0004 | method | The #71 tile key is `id`, while the split contract names `heavymap_id`. Keep the key name and id prefix in one constant to absorb the pending Industrial Atlas rename | make-fixture.mjs l.33; map.js l.265, l.384; REPO-SPLIT.md §4.1 |
| HM-PI-0005 | method | The ledger's manifest-only rule for `withheld_screened` and the "dossiers signal held identifying info" decision fit together only through a coverage-based, value-free dataset-applies signal | data-gaps-ledger.md; BETA-GATE §5 / §9 Q6 |
| HM-PI-0006 | hosting | Railway service `heavymap` auto-deploys `main`. Its latest deploy failed 2026-10-18 10:26 EDT and it has no domain, so it is not public but rebuilds on every merge | Railway describe-service, 2026-10-18 |
| HM-PI-0007 | tooling | `gh` on the box plus `git fetch origin '+refs/pull/*/head:refs/remotes/pr/*'` and `git merge-tree --write-tree` give full read-only PR review and conflict detection without touching branches | session 2026-10-18 |
| HM-PI-0008 | gap | GAP-0010's reason text says "about 46 percent", but its own counts give 44.5%. The UI should compute percentages from numerator/denominator and never quote them from the text | Spreadsheets/20-data-gaps-ledger.csv GAP-0010 |
