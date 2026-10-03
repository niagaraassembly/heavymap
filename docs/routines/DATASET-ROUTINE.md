# Dataset routine — discover, profile, harmonize

> **Fresh-foundation note (hm/fresh-foundation).** This is the unmodified DATASET-ROUTINE draft from PR #57 (`office/heavymap-tidy-root`, commit 1f8e5b5), moved here from `heavymap-planning/`. In the fresh layout the three templates it calls `Spreadsheets/16`, `17` and `18` are the header-only registry tables `data/registry/services.csv`, `layers.csv` and `quirks.csv` (see `data/schema/table-schema.json`), the old CSV and xlsx planning sheets live under `misc/Spreadsheets/`, and the other planning docs under `misc/heavymap-planning/`. The stage list below is still the reference for what each stage means; which stages `hm` supports today is in `docs/for-agents/COMMANDS.md`. Section 9 open questions are unchanged and still open.

**Status:** DRAFT, living doc. Proposed by Grok Bot 2026-10-03 for Morgen's review. Not yet owned by a Linear issue (`owner_issue` is `proposed` in the planning index). Modelled on the `na-research` Sector Research routine: slice the work, record every fact with its source, gate each step, and keep review decisions with Morgen.

HeavyMap has a large source catalog and a small number of datasets that anyone has actually opened. This routine turns catalog rows into profiled, harmonized, join-tested layers, one slice at a time. It is built on the EPIC-02 pilot (`EPIC-02-spine-and-joins.md`), which showed that the useful facts are small and checkable: record count, id field and its quirks, encoding, CRS, and how the layer joins to the parcel spine. Agents do the reading and write it down. Morgen decides what is used and what is shown.

For write-ups at the verify stage, model them on the NIA-79 evidence docs: `docs/normalization/ny-sbl-sources.md` and `docs/normalization/ny-sbl-real-data-evidence.md` (on PR #56).

## 1. Purpose and rules

| Rule | Detail |
|---|---|
| Purpose | Produce, per layer: a profile, a quirks log, a harmonization result, a spine-join grade, and a use decision. |
| Pull needs no licence confirmation | Pulling is for profiling only. Licence and use are decided later (`not_used` or a use decision). |
| Pulled data stays local | Raw pulls live in git-ignored `local-data/`, never in git. |
| Owner fields | Masked per D-13. Record field names only, never values. |
| MPAC | `not_licensed`. Nothing from it is pulled or used. |
| NPCA-derived layers | Not ingested. Note them, move on. |
| Publication | Nothing is published before G6. |
| Repo hygiene | Docs and CSVs only on a branch and PR. No MCS edits, no secrets, no UK datasets. |

## 2. Inputs

| Input | Example | Notes |
|---|---|---|
| Jurisdiction | Welland; Rochester/Monroe | From roster `07`. |
| Layer family | parcels; address; footprints; zoning; permits/business; context | Fixed order, see Batching. |
| Linear IDs | slice issue, parent epic, any NIA-86 grading issue | Every output cites one. |
| Catalog rows | `09-per-jurisdiction-dataset-catalog.xlsx` row refs | Written to `catalog_row_ref`. |
| Prior recon | `15-pilot-join-matrix-welland-rochester.csv` | A baseline, not truth. |

## 3. Service-vs-layer model

Profile each publisher service once. Layers inherit service defaults and override only where they differ.

| | Service profile (`16-service-profile.csv`) | Layer profile (`17-layer-profile.csv`) |
|---|---|---|
| Unit | one ArcGIS server, portal or API | one layer or table |
| Holds | base URL, access method, auth, paging limit, default encoding and CRS, licence text, reliability | counts, id analysis, geometry, dates, nulls, owner field names, spine join, use decision |
| Key | `service_id` | `layer_id`, with `service_id` and `inherits_from_service` |
| Overrides | n/a | a layer value wins; say why in `notes` |
| Quirks | service-wide quirks go in `notes` | per-field quirks go in `18-quirks-log.csv` |

## 3a. Files

| File | Holds |
|---|---|
| `Spreadsheets/16-service-profile.csv` | One row per service |
| `Spreadsheets/17-layer-profile.csv` | One row per layer |
| `Spreadsheets/18-quirks-log.csv` | One row per quirk (`Q-NNN`) |
| `heavymap-planning/drafts/dataset-routine-SKILL.md` | Skill draft, not registered |

CSV format: UTF-8, no BOM, LF, RFC-4180 quoting, dates `YYYY-MM-DD`, no `;` inside a cell (use ` | `), no owner values.

## 4. Stages

Linear comment rule: **the agent doing a step posts its own comment on the slice issue at every step.** Grok Bot posts only roll-ups. Every comment uses the header `Stage N / jurisdiction / family / layers touched / evidence URLs`, then the stage line below.

| Stage | Name | Output | Gate | Comment template (after the header) |
|---|---|---|---|---|
| 0 | Slice plan | Slice list: jurisdiction, family, 15-25 layers, lane per layer | Morgen or Chief of Staff approves the slice | `Planned: <n> layers / <services> / lanes / order / out of scope` |
| 1 | Discover and catalog | Service profile row; layer rows at `catalogued` | Every layer has an endpoint, a catalog row ref and a live check | `Found: <n> services, <n> layers. New vs catalog: <n>. Not reachable: <list>` |
| 2 | Pull | Files in `local-data/`; rows to `pulled` | Pulled count equals the server count, or the gap is explained | `Pulled: <layer> <n>/<n> records, method, paging, size. Failures: <list>` |
| 3 | Profile | Layer profile filled; rows to `profiled` | All id, encoding, date, CRS, null and owner-name columns filled, with no owner values | `Profiled: <layer> id <field> <n> distinct / <n> null / <n> dup; encoding; CRS; owner fields (names only)` |
| 4 | Quirks log | Rows in `18-quirks-log.csv`; layers with open quirks to `formatting_needed` | Each quirk has a type, count, example id and proposed handling | `Quirks: <n> new (<ids>). Blocking: <ids>. Example: <id>` |
| 5 | Harmonize | Handling applied in a script or doc; rows to `format_resolved` | Each quirk is `resolved`, `accepted` or `wontfix`, with a re-run count | `Resolved: <ids>. Method: <how>. Before/after counts` |
| 6 | Verify | Join test against the spine; method (exact, fuzzy, spatial) and grade (NIA-86); rows to `spined` | `hits/tested` stated, with the sample or full population named; evidence write-up in the NIA-79 style | `Spine join: <layer> -> <spine key> <method> <grade> <hits>/<tested>. Evidence: <url>` |
| 7 | Use decision | Recommendation: use, `not_used` or defer; licence status noted | Morgen records the decision | `Recommend: <use / not_used / defer>. Licence: <found / not found>. Risks: <list>` |
| 8 | Promote | `dormant`, then `surfaced` | Morgen's call. `surfaced` is not allowed before G6 | `Promoted: <layer> to <status> by Morgen on <date>` |

## 5. Lifecycle statuses

Stored in `17-layer-profile.csv` `lifecycle_status`, with `status_changed_date`.

| Status | Meaning | Enters at | Moved by |
|---|---|---|---|
| `catalogued` | Found and recorded. Not pulled. | Stage 1 | Agent |
| `pulled` | Data is in `local-data/`. | Stage 2 | Agent |
| `profiled` | Profile columns filled. | Stage 3 | Agent |
| `formatting_needed` | Open quirks block use. | Stage 4 | Agent |
| `format_resolved` | Every blocking quirk is handled. | Stage 5 | Agent |
| `spined` | Joined to the spine, with `spine_join_method` (exact, fuzzy, spatial) and `spine_join_grade` (NIA-86). | Stage 6 | Agent |
| `dormant` | In the live map, not shown to users. | Stage 8 | **Morgen** |
| `surfaced` | Visible to users. **Not before G6.** | Stage 8 | **Morgen** |
| `blocked` | Side state. Cannot proceed; reason and unblocker named. | Any stage | Agent sets, Morgen clears |
| `not_used` | Side state. Will not be used (licence, MPAC, NPCA, no value). | Any stage | Morgen. Agent sets it only where a rule forces it (MPAC, NPCA) |

A layer with no quirks goes from `profiled` to `spined`. Agents log every status move in a Linear comment.

## 6. Batching

The catalog has about 4,079 rows. 1,195 are relevant. Work per jurisdiction, at service level first.

| Item | Rule |
|---|---|
| Priority places | Welland, then Rochester/Monroe, then other P0 places |
| Family order | parcels, address, footprints, zoning, permits/business, context |
| Slice size | 15 to 25 layers. One slice, one Linear issue |
| Service first | Profile the service, then its layers in family order |

## 7. Agent lanes

| Agent | Use for |
|---|---|
| Claude | Slice plans, profiles, grading, roll-up review |
| Claude Code | Hunts and scripted profiling in a clone |
| Cursor Cloud | Multi-file documentary and fixture PRs |
| Codex | Runs on deb with `</dev/null`, in a writable clone |
| Copilot | Gated, bounded packets (for example field registers) |
| Kiro | Unavailable |

## 8. Briefs

Every brief must include the Evidence and research contract. Draft contents (confirm with Morgen):

1. Source URL and access date for every fact.
2. Label each fact `live read` or `documented, not re-read`.
3. Counts come from the server (`returnCountOnly`), samples are at most 5 records, and join results are stated as `hits/tested`.
4. Prior recon is a baseline. Show conflicts side by side.
5. No owner values. No keys, logins or bulk scraping beyond the pull stage.
6. Unknown stays unknown. A zero result is valid.

## 9. Open questions

- [ ] MCS child-table relationship: is `17-layer-profile.csv` a child of the MCS, and how does it key to `dataset_id`?
- [ ] `dataset_id` assignment rule for profiled layers. `mcs_dataset_id` stays blank until decided.
- [ ] Catalog total: 4,020 (README v9, EPIC-01) vs 4,079 rows (audit `13`).
- [ ] Is a validator script wanted (header, enums, no `;`, status order)?
- [ ] Add `local-data/` to `.gitignore`? It is not listed there today.

## 10. Refinement log

| Date | Change | By |
|---|---|---|
| 2026-10-03 | First draft with CSV templates and skill draft | Grok Bot |
