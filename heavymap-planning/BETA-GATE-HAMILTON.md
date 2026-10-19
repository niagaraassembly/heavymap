# Beta gate: Hamilton (merged G5 + G6, staged, per jurisdiction)

**Status:** accepted 2026-10-18 (Morgen). **Linear:** NA-269 (gate definition), NA-29 (reconciliation epic), NA-306 (pre-publish check subsystem), NA-305 (browser notice), NA-304 (OSM, deferred), NA-308 (run-record UI, standing), NA-309 (addresses with no parcel), NA-310 (experience profiles, standing).
**Scope:** the City of Hamilton, Ontario, the first jurisdiction to open. Section 9 records Morgen's 2026-10-18 decisions. Thresholds, gate rules and size budgets in sections 2, 3 and 6 are ACCEPTED.

## 1. What the gate is

- **One staged beta gate, for now.** G5 ("reconciled") and G6 ("publish") are merged into one gate with two stages (Morgen, 2026-10-18). They may split again after beta.
  - **Stage A: reconciled.** Spine, joins, labelling, screening and reproducibility checks pass for the jurisdiction (sections 2 to 5).
  - **Stage B: publishable.** Pre-publish checks pass on the actual build output, the deploy path works, and Morgen signs off (sections 6 to 8).
- **Per jurisdiction.** Each jurisdiction opens on its own checklist. Hamilton does not wait for Niagara, Western New York or any other area. A later jurisdiction reuses this document as a template.
- **"Reconciled" means observed and labelled, not made clean.** Every known conflict, gap, sliver and contradiction is detected, classified, counted and labelled. Nothing is extinguished from view to make the data look tidier. Some classes are flagged as must-solve before publishing (section 4).
- **Back end versus front end.** The checks, metrics, run records and labels are universal back-end work (Industrial Atlas). How they appear on heavymap.com is front-end work (HeavyMap.com project) and is out of scope here, apart from naming what must be surfaced.
- **Repo split (plan recorded in PR #80; execution separately assigned).** Keep everything in this repo during concurrent work. Do not create the new repository, move paths or rename identifiers without a separate bounded assignment. Frontend repair and backend validation proceed independently of migration timing.

## 2. Standardized spine and join checks

Each check runs on every build. Each one writes a value into the run record (section 3). The same definitions apply to every jurisdiction. Only the thresholds may differ, and any difference must be written down.

Notation: *City parcels* = the authoritative parcel fabric (for Hamilton, the City parcel layer the registry mints from). *Attribute fabric* = a second parcel fabric joined for identifiers (for Hamilton, NPCA `Assessment_Parcels_Test` for ARN).

| # | Metric | How it is computed | Hamilton today (2026-10-17 run) | Threshold (ACCEPTED 2026-10-18) |
|---|---|---|---|---|
| S1 | One-to-one rate | Reciprocal representative-point matches between City parcels and the attribute fabric, after the offset is applied. Divided by attribute-fabric parcels in the overlap set. | 90,102 pairs, 99.77% | warn below 99.5%, fail below 99.0% |
| S2 | One-to-one quality | Overlap ratio (IoU) of S1 pairs: p10, p50, p90, and the count with IoU ≥ 0.9. | p10 0.999, p50 1.000, p90 1.000; 89,837 at ≥ 0.9 | fail if p10 < 0.95 |
| S3 | One-to-many and many-to-one | Count of City parcels linked to more than one identifier, and identifiers linked to more than one City parcel. Placeholders are excluded (see S5). | Recorded in registry `arn_links`; recount after the batched re-run | reported, no fail level; every case has a grade |
| S4 | Unmatched | City parcels in the overlap set with no identifier, and attribute-fabric parcels with no City parcel. | Recount after the batched re-run | ≤ 0.5% each, every one labelled |
| S5 | Placeholder count | Identifier values that are sentinels (for ARN, all zeros). Graded `placeholder`, never `one_to_many`. | 10 links (GAP-0005) | any count passes as long as all are flagged; 0 unflagged |
| S6 | Not in coverage | City parcels outside the attribute fabric's footprint. Graded `not_in_coverage`, tied to the dataset that defines the coverage. | 74,276 of 166,745 (GAP-0010) | Labelled, no fail level (coverage is a fact about the source) |
| S7 | Offset applied | The measured translation between fabrics (median dx, dy), its spread (IQR) and the sample size. The build fails if the offset in use differs from the offset measured on this pull by more than a tolerance. | dx +0.297 m, dy −0.939 m, IQR < 3 mm (Q-004, NA-276) | tolerance 0.05 m; IQR ≤ 0.01 m |
| S8 | ID stability across runs | Between this run and the previous registry: kept, `replaced_by`, `split_into`, `merged_from`, newly minted, retired. On an unchanged input, every ID must be kept. | Synthetic test passes; first real repeat pending | Unchanged input: 100% kept (hard). Changed input: reported |
| S9 | Overlay link coverage | For each overlay layer (zoning, OP designations, conservation and so on): the share of City parcels with at least one link, plus layers present with zero links. | 644,398 links over all parcels | every layer has ≥ 1 link or a gap entry explaining why not |
| S10 | Sliver counts | Links whose area share falls under the sliver rule, per layer. Flagged, never dropped. | 150,610 of 644,398 flagged | Reported, no fail level (flag, never extinguish) |
| S11 | Address and footprint linkage | Addresses inside exactly one parcel, more than one, or none. Footprints the same way. | 273,955 addresses, 214,287 buildings registered | reported; "none" cases labelled |
| S12 | Row-count drift | Rows per source layer against the previous pull. | First baseline 2026-10-17 | warn at > 2% change, explain at > 5% |

Notes on accepted thresholds (Morgen, 2026-10-18):

- **S9.** The 644,398 figure is parcel-to-overlay-feature links (about 3.9 per City parcel on 166,745 parcels, including 150,610 slivers), not a parcel count. PI-0063.
- **S11.** Addresses with no parcel must carry a stable tag (for example `address_no_parcel`, with source dataset ids) and an index so the UI can list them. Front-end element: Linear NA-309.
- **S12.** Row-count drift is how we tell a publisher change from a broken pull (truncated download, paging failure, swapped layer). A warn or explain is not automatically a fail; the explanation must say which of those it is.

A check that cannot be computed writes a blank with a reason, never a zero (HARD-RULES 8).

## 3. Professional practice: independent repeat runs as proofs of work

- **Runs 1, 2 and 3.** Run 1 is the production build. Run 2 and run 3 are independent repeats:
  - a fresh environment (new clone, clean virtual environment from the lock file, empty output directory);
  - the same pinned inputs (the raw pulls under `local-data/`, identified by hash, not re-downloaded);
  - the same code commit.
- **Where they run (DECIDED 2026-10-18).** Run 2 and run 3 on Deb. Run 3 in a fresh isolated container on Deb. Cursor cloud VMs cannot run the repeats until the pinned inputs live in private storage (for example the planned `ia-restricted` repo): `local-data/` is off git, and ArcGIS is not reachable from Cursor.
- **Comparison at three levels.**
  1. *Byte level:* SHA-256 of every output file. Expected to match wherever the writer is deterministic. Any file that cannot be deterministic (for example, archives with embedded timestamps) is listed with a reason.
  2. *ID level:* the sets of HeavyMap IDs, aliases, lineage and identifier grades are identical.
  3. *Metric level:* every metric in section 2 matches exactly.
- **Run record.** Every run writes one JSON record:
  - `run_id` (ULID), `run_kind` (`production`, `repeat-2`, `repeat-3`), `jurisdiction`, start and end times (UTC);
  - inputs: each source `dataset_id` or `layer_id`, retrieval time, row count and SHA-256;
  - `code_commit`, a dirty-tree flag, lock-file hash;
  - environment: machine label, OS, Python and key library versions;
  - the metrics from section 2;
  - output files with their hashes;
  - diffs against the reference run at the byte, ID and metric levels, with the outcome (`identical`, `explained`, `failed`).
- **Where they live.** Run records belong to Industrial Atlas (the universal back end), under `local-data/runs/` at first. The **full run record, screened** (no personal fields, no local paths that reveal the machine owner) is public with each build so heavymap.com can show "how this was made": the run dates, the checks and their values, and the repeat agreement. They serve both general users and technical reviewers. Front-end element: standing issue NA-308 (`Elements of Run Records`). Linear label `standing` marks near-permanent maintenance-class issues.
- **Gate rule (ACCEPTED 2026-10-18).** Stage A needs at least one repeat run that is identical at the ID and metric levels. Run 3 is required before the first public release of a jurisdiction and recommended after any change to the registry or linker.

## 4. Labelling: every known conflict observed and labelled

- **One taxonomy, 1:1 with the tracking sheets.** Each class of issue has one label code. Each code maps to exactly one class in the tracking CSVs:
  - `Spreadsheets/20-data-gaps-ledger.csv`, column `gap_type` (today: `not_present_in_source`, `sparse`, `stale`, `contradictory`, `placeholder`, `empty`, `withheld_screened`, `not_in_coverage`);
  - `Spreadsheets/18-quirks-log.csv`, column `quirk_type` (for example `offset`, `duplicate_id`, `invalid_geometry`, `retired_values`, `range_gzip`);
  - `Spreadsheets/19-process-insights.csv`, column `insight_type` (`gap`, `data_quirk` and so on, linked through `source_pi_ids`).
  A new class gets a code, a plain-language definition and a sheet home before it is used. A label with no sheet home fails the build.
- **Gap labels are permanent.** They stay their own set, separate from claim-refusal reasons, with a documented mapping between the two (decided 2026-10-17).
- **`publish_priority`.** Each class, and optionally each ledger row that overrides its class, carries one of:
  - `must_solve_before_publish`: the jurisdiction does not open until it is solved or explicitly downgraded by Morgen;
  - `label_and_ship`: shown honestly with its label at publish;
  - `later`: tracked, not a publish concern.
- **Schema (applied 2026-10-18).** Sheet 20 has a `publish_priority` column after `status`. The 1:1 mapping lives in `Spreadsheets/21-issue-class-register.csv` (`class_code`, `sheet`, `source_column`, `source_value`, `definition`, `publish_priority`, `notes`). Accepted first values for Hamilton:

| Class | Example | `publish_priority` |
|---|---|---|
| `withheld_screened` | Owner, `Legal_Txt` | `must_solve_before_publish` (meaning screening must be proven, not that the data is shown) |
| `placeholder` | ARN all zeros | `label_and_ship` |
| `not_in_coverage` | 74,276 parcels outside NPCA ARN coverage | `label_and_ship` |
| `stale`, `sparse` | 2020 `PropCode` | `label_and_ship` |
| `contradictory` | `PropCode` vs current zoning (count pending) | `label_and_ship` |
| `empty`, `not_present_in_source` | `PostalCode`, tax class | `label_and_ship` |
| `offset` (quirk) | NPCA 0.984 m shift | `label_and_ship` (already measured and corrected; S7 stays as the guard) |
| `range_gzip` (quirk) | Firefox + GitHub Pages | `label_and_ship` (browser notice, NA-305) |

- **Gate rule (ACCEPTED 2026-10-18).** Stage A passes only when every open ledger and quirk row has a class, a count (or a blank with a reason) and a `publish_priority`, and there are no open `must_solve_before_publish` rows.

## 5. Screening: dataset-origin visibility

- **Every value carries its origin.** Each coverage status and attribute value in the build carries the source `dataset_id` or `layer_id` it came from. Coverage and non-coverage (for example `not_in_coverage` for ARN) are tied to the dataset that defines that coverage, not to the parcel in the abstract.
- **Per-dataset publish visibility (DECIDED 2026-10-18).** `publish_visibility` lives in the dataset inventory (`Spreadsheets/02-dataset-inventory-v4.csv`). Closed values:
  - `public` (the default): allowlisted fields ship;
  - `restricted`: paid-for, or licence permission is unconfirmed. Public files may carry only a brief mention that a restricted dataset list exists. The list itself is gitignored (`Spreadsheets/restricted/RESTRICTED-DATASETS.csv`). A committed README and headers-only template stay in git. Plan: a future private `ia-restricted` repo houses restricted atlas data and infrastructure. Universal wording: [docs/architecture/publish-visibility.md](../docs/architecture/publish-visibility.md).
  - `withheld`: no values ship; the dataset appears only as a manifest-level gap entry ("this source applies here and is held back"), or not at all, per `withheld_disclosure`;
  - `internal_only`: never shipped, never mentioned in public output, used only for internal checks.
- **`withheld_disclosure` (open; interim default).** Not decided. Interim default is `manifest_entry`, marked interim, until Morgen chooses `manifest_entry` or `none`.
- **Applied by allowlist at build time.** The build reads the settings and emits only allowlisted fields from `public` datasets. Withheld fields (owner names, owner mailing addresses, legal descriptions, other personal fields) are never read into public output. A test fails the build on any leak.
- **Field-level withholding inside a public dataset** (for example `Owner` and `Legal_Txt` in Cityview) stays at the dataset level for now: one manifest entry, no per-parcel hint of a value. **DECIDED 2026-10-18:** dossiers will signal that identifying information is held. Wording is tied to logged-in and paid tiers (front-end and business). That copy is not written here.
- Everything not screened by these settings is public. Screening is the exception, and every screening choice is written down.

## 6. Pre-publish checks (incremental, NA-306)

Run over every output file of the build, fail closed:

1. **Leak test:** no withheld field names or known withheld values in any output.
2. **Schema and allowlist:** every emitted field is allowlisted for that output.
3. **Size budgets (ACCEPTED 2026-10-18):** startup payload ≤ 50 KB compressed; per-click dossier shard ≤ 50 KB compressed (p95); each `.pmtiles` ≤ 100 MB; total site ≤ 1 GB (the GitHub Pages limit). Accepted, and flagged as an ongoing optimization need. Future experience profiles that need meta-stamping of back-end elements: standing issue NA-310.
4. **Reproducibility:** the repeat-run comparison from section 3.

Later increments: licence and attribution presence, gap-ledger completeness, a cross-browser smoke test, a load test, link checks.

## 7. Build output shipping

- Tiles and dossier files are **generated from local data at deploy time** and published as build artifacts (for example, a Pages deployment artifact). They are **not committed to git**.
- Why: the repo stays small and reviewable; data never sits in git history (so a later screening change cannot leave old values behind in history); every deploy is traceable to a run record and code commit; and large binaries avoid git's size limits.
- **HARD-RULES rule 3 (DECIDED 2026-10-18):** building and testing publish or deploy tooling is allowed now. Actually publishing or deploying publicly still requires Morgen's per-jurisdiction sign-off on this beta gate (NA-269).

## 8. Browser notice and sign-off

- **Browser notice (NA-305):** v0 tells users that Chrome is optimal and Firefox support is in progress. The GitHub Pages gzip problem (PMTiles issue #584) is parked.
- **Sign-off:** Morgen signs off each stage per jurisdiction, recorded on NA-269 with the run IDs of the production run and the repeat runs.

## 9. Decisions for Morgen (2026-10-18)

| # | Question | Outcome |
|---|---|---|
| 1 | Accept or adjust each PROPOSED threshold in sections 2, 3 and 6. | **DECIDED 2026-10-18.** All S1–S12 thresholds, the repeat-run gate rule and the size budgets are ACCEPTED. Notes: (a) S9 644,398 is overlay links, not parcels; (b) S11 none-cases need a stable tag and an index (NA-309); (c) S12 drift distinguishes publisher change from a broken pull; (d) size budgets accepted, optimization ongoing (NA-310). |
| 2 | Add `publish_priority` to sheet 20, and create the class register (sheet 21)? | **DECIDED 2026-10-18.** Applied. |
| 3 | Confirm the suggested `publish_priority` values in section 4. | **DECIDED 2026-10-18.** Accepted except NPCA `offset`: `label_and_ship` (already measured and corrected; S7 stays as the guard). |
| 4 | Where `publish_visibility` lives: inventory or class register. | **DECIDED 2026-10-18.** Dataset inventory. Values: `public` / `restricted` / `withheld` / `internal_only`. `restricted` = paid or unconfirmed licence. Restricted list is gitignored; public files mention only that the list exists. Future private `ia-restricted` repo. |
| 5 | The `withheld_disclosure` default: `manifest_entry` or `none`. | **OPEN.** Interim default `manifest_entry`, marked interim. Section 4 does not imply a close. |
| 6 | Whether, and how, a parcel dossier signals held identifying information. | **DECIDED 2026-10-18.** Yes, dossiers will signal held identifying information. Wording is tied to logged-in and paid tiers (front-end and business). |
| 7 | Relax HARD-RULES rule 3 so the deploy pipeline can be built before the gate opens. | **DECIDED 2026-10-18.** Tooling may be built and tested. Public publish or deploy still needs Morgen's per-jurisdiction sign-off (NA-269). |
| 8 | Is run 3 required on a different machine, or is a fresh container on Deb enough? | **DECIDED 2026-10-18.** Run 2 and run 3 on Deb. Run 3 in a fresh isolated container on Deb. Cursor VMs cannot run it until inputs live in private storage. |
| 9 | How much of the run record is public. | **DECIDED 2026-10-18.** Full run record, screened. Front-end element: standing issue NA-308. Linear label `standing` marks near-permanent maintenance-class issues. |
| 10 | When to split universal back-end publishing into a separate `industrial-atlas` repo. | **DECIDED in principle 2026-10-18, timing pending Morgen confirmation.** Keep everything in this repo for now. Move the back end to `industrial-atlas` as soon as practical, leaving `heavymap` (local and GitHub) dedicated to the front end. |
