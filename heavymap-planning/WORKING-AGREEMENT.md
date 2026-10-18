# HeavyMap and Industrial Atlas working agreement

Accepted direction: Morgen, 2026-10-18. This documentation change records the concurrent working arrangement. It does not approve a merge, publication, repository split, or any open product decision.

## Scope and authority

HeavyMap.com and Industrial Atlas are independent work tracks in the existing repository. PR #80 remains paused: do not move files, create split repositories, or rename packages or wire identifiers without a separate assignment from Morgen.

[HARD-RULES](../docs/for-agents/HARD-RULES.md) remains authoritative for data, screening, review and publication. Existing architecture contracts define data meaning. This agreement governs task coordination and the scoped frontend exceptions below. Recommendations in dated reviews and backlog snapshots are not accepted decisions.

Reconciled instructions must precede work affected by an instruction conflict. Already-authorized backend validation can continue while the documentation PR is prepared. Neither documentation nor #71 is a blanket prerequisite for the Hamilton batch.

## Responsibilities and records

| | HeavyMap frontend | Industrial Atlas backend |
|---|---|---|
| Owns | Map interaction, dossier presentation, lenses, search, responsive layout, accessibility and browser performance | Sources, profiling, identifiers, joins, overlays, screening, provenance, gaps, dossier generation and artifacts |
| Develops against | Contract-shaped synthetic fixtures, then pinned screened artifacts | Local datasets on Deb and controlled portable fixtures |
| Evidence | Builds, screenshots, browser checks and transfer measurements | Input identities, commands, run records, quality checks, hashes and reproduction comparisons |

GitHub owns code, specifications, decisions and reproducible instructions. Linked Linear issues own task priority, ownership, dependencies and status. PRs hold changes and review evidence; run records hold operational evidence. Handoffs are short entry points. Record consequential chat decisions in the relevant durable location.

Each task has one implementation owner and one branch or worktree. Other agents may review; they do not concurrently write that worktree. Assign Codex, Claude Code or Cursor per task and execution needs, not as permanent subsystem owners. ChatGPT may coordinate and review. No new environment is required merely to change tools.

## Task packet and report

Record: track; existing issue and outcome; owner; branch/worktree and base SHA; allowed scope and exclusions; environment/data; contract version; acceptance checks; evidence; dependencies; next action and handoff recipient. Refresh branch/PR state at task start.

Normal autonomous issue pickup retains AGENTS.md's agent-ready, lane and packet requirements. For this round, an explicit assignment from Morgen can supply the bounded packet in the PR/task record, citing the existing Linear issue where applicable. It does not mark an issue agent-ready, authorize unrelated work, or permit creating/updating Linear records without instruction. If essential scope or acceptance information is missing, prepare the packet before dependent implementation.

Report: completed result; PR and head SHA; checks passed/failed/skipped/unrun with implications; evidence; exact blocker; decisions needed; next action. A reviewer assesses against the task's acceptance checks. Morgen retains merge decisions.

## Scoped frontend instructions

The older "UI chrome stays deferred" wording does not apply to explicitly assigned HeavyMap frontend tasks. Initial repair scope is #71's B1 and S1-S5; B2 requires the pre-merge publication check below. Adapter, full gap/sliver behavior and responsive enhancements are separate follow-on tasks, not implicit additions to #71.

Frontend tasks may edit assigned web/ and frontend documentation/fixture paths. They do not change the Atlas pipeline, dataset sheets or real inputs. An explicitly assigned conflict resolution may preserve/append existing documentation/index/insight rows as described in #71's review; it does not authorize dataset-truth changes. Shared contract changes require the ownership/review procedure below.

Synthetic fixtures must be invented, labelled synthetic and conform to the stated contract. Small explicitly approved source/test fixtures such as #71's synthetic tile are distinct from production outputs. Do not commit pulled rows, real identifying values, production tiles/shards, dist/, local-data/, or raw real-data screenshots/logs. Real-data validation stays on Deb under the current arrangement. Any evidence leaving Deb must be screened under HARD-RULES, including paths in run records. Do not access heavymap-restricted.

## Contract index and change ownership

Extend these existing specifications; do not create a competing schema:

| Interface | Authoritative reference |
|---|---|
| Dossier, manifest, suffix shards, share fractions and screening | [parcel-dossier.md](../docs/architecture/parcel-dossier.md) |
| Gap vocabulary and parcel attachment | [data-gaps-ledger.md](../docs/architecture/data-gaps-ledger.md) |
| Dataset publication eligibility | [publish-visibility.md](../docs/architecture/publish-visibility.md) |
| Identifiers | [ID registry](../docs/architecture/heavymap-id-registry.md) and [ID format ADR](../docs/architecture/adr/0003-heavymap-id-format.md) |
| Display and refusal semantics | [PCDP](../docs/architecture/PCDP.md) and [claim/refusal](../docs/architecture/claim-refusal-contract.md) |
| Run records, screening, size and shipping acceptance | [Hamilton beta gate](BETA-GATE-HAMILTON.md), especially sections 3, 5-7 |

Assign one change owner per shared change. That owner prepares the proposal, identifies affected consumers, obtains a named reviewer from the other track, and records the outcome before changing the supported contract. Review does not authorize a merge or close a decision reserved for Morgen.

Name the supported contract version and representative fixture cases. Cover ordinary records, coverage absences, placeholders, slivers, truncation, screened fields and incompatible schemas. A missing capability may be explored with an explicitly provisional fixture; it is not an agreed backend promise. Breaking changes need a schema/version change, affected-consumer list and migration task; retain the previous supported interface during migration where practical. Do not implement PR #80's pending naming changes.

Integration identifies the artifact/run, jurisdiction, producer code revision, schema version and verified hashes. Pin that artifact rather than silently following the newest output. Artifact delivery details remain an interface ask until agreed and implemented.

## Interface dependencies

[Frontend backlog section 3](frontend/BACKLOG-DRAFT-2026-10-18.md#3-back-end-contract-asks-for-heavymap-industrial-atlas) is the initial BE-1 through BE-16 interface register. Add interface detail and links there rather than another task-status board. Linked Linear issues are authoritative for task status. Do not invent issue links or treat drafted asks as accepted.

For each agreed change, record its change owner, other-track reviewer, producer/consumer issue links, contract/fixture reference and exactly what waits. Agreement, implementation and consumer verification each require evidence in the linked issues/PRs.

| Dependency | Blocks |
|---|---|
| Missing optional field | Only the feature using it |
| Unsettled meaning | Final production behavior for that meaning; explicit fixture exploration may continue |
| Missing screened artifact | Real-data integration |
| Failed reproduction check | The relevant operational acceptance claim |
| Unapproved jurisdiction gate | Public release |

## Acceptance and publication

Keep these claims separate: frontend fixture-complete; backend fixture-tested; operationally validated; integrated; approved for publication. Each claim identifies its revision, inputs and evidence. Skips and unrun checks are not passes.

Frontend fixture acceptance needs a build, applicable interaction/browser checks and visual evidence. Backend operational acceptance needs pinned input hashes, commands, code/environment identities, outputs, and byte/ID/metric comparisons required by the beta gate. Integration checks the actual pinned artifact in HeavyMap. The existing jurisdiction gate alone defines release approval.

**Before merging, verify whether the changed paths trigger publication and whether jurisdiction approval applies.** Record the current configuration and evidence for the specific change. Historical Pages/Railway observations are snapshots, not proof of present behavior. Do not infer approval from a successful build, integration run or documentation-only diff. Agents never merge. Pages/Railway changes and public publication require their existing authorization.

## Insights and handoffs

Atlas keeps Spreadsheets/19-process-insights.csv with PI- IDs. HeavyMap uses the HM-PI- prefix and the single destination heavymap-planning/frontend/19-process-insights.csv, with the same columns. Alternate paths in earlier D5 text are superseded. File creation is not performed here; until it exists, record frontend insights in the PR's Process insights section for later transfer. Do not put HM-PI rows into the Atlas log. Existing reservations remain; check current IDs before allocating.

Log reusable discoveries once, with evidence; cross-link findings relevant to both tracks. Routine narration belongs in the task report. See [PROCESS-INSIGHTS.md](PROCESS-INSIGHTS.md) for columns and append-only etiquette.

The [frontend handoff](frontend/HANDOFF-2026-10-18.md) and [Atlas handoff](atlas/HANDOFF-2026-10-18.md) each state objective, references, active tasks, constraints, evidence and next action. Neither requires the other chat. Use a brief checkpoint when handing off work or reconciling contract/integration changes; no additional status system is required.
