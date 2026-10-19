# Coordination review: HeavyMap and Industrial Atlas

**Status:** snapshot for sharing. Findings and proposed corrections only. This document does not merge, publish, split the repository, or edit Linear.
**Reviewed:** 2026-10-18 against draft [PR #82](https://github.com/niagaraassembly/heavymap/pull/82) (stacked on [PR #81](https://github.com/niagaraassembly/heavymap/pull/81)) and repository rules then on `main` at `b524f3e`.
**Packaged:** 2026-10-19 so the review can be shared. Linear was not re-audited for this packaging.
**Linear:** NA-32, NA-269.
**MCS cells changed:** none.
**Pulled data committed:** none.

After this review was written, [PR #80](https://github.com/niagaraassembly/heavymap/pull/80) landed the split **plan** document on `main` (`6333e55`, `heavymap-planning/REPO-SPLIT.md`). That is the plan, not execution. The review’s recommendation still stands: keep the split paused; do not move files, create `industrial-atlas`, or rename packages or wire identifiers without a separate assignment from Morgen.

---

Merging #81 or #82 onto `main` would republish the repo tree to heavymap.com. That is not Hamilton publication approval. The rest of the setup mostly matches the concurrent-tracks intent, but older Linear gates, leftover repo rules, and a few #82 edits still contradict it.

Linear was not edited during the review. Another agent was updating those projects at the same time.

## Publication check (before any merge)

GitHub Pages for `niagaraassembly/heavymap`, checked 2026-10-18 via the Pages API:

- `build_type`: **legacy**
- `source`: **`main` / `/`**
- `cname`: **heavymap.com**
- `public`: true
- `https_enforced`: **false**
- Latest successful build at review time: `main` at `b524f3e` (2026-10-18 14:27 UTC)

There is no `_config.yml` and no Pages workflow. A merge to `main` rebuilds the whole tree. #82 currently targets #81’s branch (`hm-front/handoff-2026-10-18`), so merging #82 as stacked does **not** publish. Retargeting or merging either PR to `main` **does**.

#82’s changed paths are agent/planning docs (`AGENTS.md`, `HARD-RULES.md`, `heavymap-planning/*`, PR template, index CSV). They are not `web/`, tiles, or dossiers. They would still become public URLs on heavymap.com after a `main` Pages rebuild.

**Jurisdiction approval does not apply to this docs-only rebuild as Hamilton Stage B.** NA-269 is Done as *gate definition* (PR #79), not as Stage B sign-off. HARD-RULES 3 still applies: public product publish needs Morgen’s per-jurisdiction sign-off. D1 (how merges relate to live Pages) is still open. Railway `heavymap` auto-deploy of `main` (D6) was not re-verified in the review.

HTTP GET to heavymap.com from the review environment returned 403; HTTPS handshake failed. Public HTML was not inspected. Use the Pages API, not a homepage screenshot, as merge evidence.

**Proposed correction:** Keep both PRs draft. Do not retarget to `main` until Morgen decides D1. Record the Pages API evidence above in the PR, and say explicitly: docs-tree republish ≠ Hamilton approval.

The later merge of #80’s plan document to `main` is itself a Pages rebuild of `heavymap-planning/REPO-SPLIT.md`. That does not execute the split and does not approve Hamilton.

## What already matches the intended agreement

PR #82 and the 2026-10-18 Linear project texts largely agree with the requested split of labor:

- Concurrent tracks in one repo; **PR #80 execution paused**
- HeavyMap.com: synthetic-fixture UI
- Industrial Atlas: production, provenance, Deb validation
- Linear issues own status/scope/ownership; GitHub owns code/policy
- BE-1…16 kept as an interface register, not a second status board
- Fixture-complete / operationally validated / integrated / publication-approved treated as separate claims
- Documentation conflicts block only affected work
- Morgen keeps merge, split, and publication decisions

## Findings

### 1. Contradictory older guidance still live

These will beat #82 for any agent on `main` or on unamended Linear issues:

| Source | Conflict |
|---|---|
| `README.md` (not in #82) | “Linear project Industrial Atlas is the control plane.” |
| `AGENTS-MCS.md` (not in #82) | “Publication waits until data is reconciled.” Older than the per-jurisdiction gate. |
| `CONTRIBUTING.md` on `main` | “Don’t add publish/deploy tooling.” #82 fixes this; `main` does not. |
| `AGENTS.md` on `main` | “UI chrome stays deferred.” |
| `heavymap-planning/BETA-GATE-HAMILTON.md` Q10 | Split “as soon as practical.” That is stronger than paused. |
| `OPEN-DECISIONS.md` #6 | Split timing still “remaining.” |
| Linear **NA-32** | Still on Industrial Atlas, Backlog. “UI chrome stays deferred. FE-0 after G2; full UI after G3.” |
| Linear Decision log (body below the 2026-10-18 header) | Locked: “MPAC stays `not_licensed`; do not ingest NPCA”; “Nothing publishes until data is reconciled; UI chrome deferred.” That contradicts HARD-RULES 4/5 and the concurrent-UI exception. |
| Linear Roadmap (body below the header) | “G5 before G6”; “UI chrome stays deferred”; `NIA-` prefixes throughout. |
| #81 STOP list | “Do not edit the Linear project description.” That STOP is already superseded by the Linear update in progress; #82 still lists **D7 as open**. |
| #80 §6.4 | “Land #71 first” as a **split sequence**. #82 correctly detaches #71 from the split, but does not say it amends §6.4. |
| `docs/architecture/README.md` and several planning docs | Still `NIA-` identifiers. Pickup rule is `NA-` only. |

#82 itself still contradicts its own insight routing: it adds a frontend-exception paragraph, then leaves the standing rule “every agent appends to `Spreadsheets/19-process-insights.csv`” in `AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md`, and `.cursor/rules/hard-rules.mdc`.

### 2. Duplicated or split status

- **NA-32** remains the frontend epic on Industrial Atlas; HeavyMap.com already holds NA-305/308/309/310. Two homes for one track.
- **G\* Linear milestones** still exist and still compute percentages from issue Done-ness, while project text now says percentages are not sign-off. Both are visible.
- **BACKLOG-DRAFT HM-01…HM-20** still look like a board even with the new disclaimer. No child issues exist for the bounded #71 repair.
- **Linear pickup doc** now duplicates `WORKING-AGREEMENT.md` + `AGENTS.md`. Fine as a pointer; dangerous if it drifts.
- **Untitled empty Linear document** is still a resource on Industrial Atlas.
- **D7** is being executed in Linear while #82 still calls the description an open decision.
- Project **status updates** at review time were still Oct 15 (HeavyMap.com, docs-only) and Sep 23 (Atlas). Descriptions were rewritten at 18:31 UTC; dated updates were not present then.

### 3. Unsupported readiness claims

- **G6 — publish = 100%.** NA-269 Done means the **gate was defined**, not that Hamilton (or any jurisdiction) is publication-approved. The milestone name/description still read as a release gate.
- **G4 — dossier v0 = 100%.** NA-27 (backend dossier assembly) is Done. The milestone text still requires dossiers “assembled **and rendered**.” Rendering is HeavyMap, and #71 is unmerged.
- **G2 = 100%** while **NA-16** (CA/Welland synthetic fixture) is Backlog. The milestone text still lists NA-16 as the CA fixture check. `main` has a US fixture only.
- **G1** still cites **NIA-10**. NA-10 is In Progress; G1 at 50% is at least not “done,” but the old id is wrong.
- Atlas **target date remains 2026-09-30.** The new description calls that historical; the field still implies a missed delivery.
- HeavyMap.com still has the **Docs** label and no outcome milestones, so it looks like a documentation project rather than the frontend track.
- #81/#82 snapshot “117 tests, 17 skipped” is labelled historical in the Atlas handoff; keep it that way. It is not current Hamilton evidence.

### 4. Unnecessary or risky process

- **HARD-RULES 7** now points at a “bounded-assignment route” that skips `agent-ready` for “this round.” That is a standing-rule change for a temporary round. Keep `agent-ready` as default; put the Morgen-assignment exception only in the working agreement, with an expiry.
- **PR template** adds six extra fields to every PR. The acceptance-claim line is the part that matters. The rest belongs in the working agreement, not the template.
- **Shared “record tool/session/SHA/contract version on every issue”** is heavy for docs-only children. Require that packet only for implementation/handoff issues.
- Creating `heavymap-planning/frontend/19-process-insights.csv` is correctly deferred (paused split). Do not also leave agents writing HM-PI rows into Atlas sheet 19.

### 5. Fixture vs operational vs integration vs publication

Keep these four claims separate; current artifacts blur 2–4:

| Claim | Current facts | Must not be inferred from |
|---|---|---|
| **Fixture-complete** | US synthetic fixture on `main`; CA fixture (NA-16) not done; #71 prototype is a separate frontend fixture, conflicting, Playwright unrun | G2 100% |
| **Operationally validated** | Hamilton batch + fresh-container repeat is assigned, not evidenced in this review; 117/17 is historical | NA-306 Backlog; NA-269 Done |
| **Integrated** | No pinned screened artifact named for HeavyMap consumption | Dossier schema existing; BE-1…16 drafted |
| **Publication-approved** | Stage B closed until Morgen signs NA-269 for Hamilton; Pages already publishes `main` | G6 100%; successful build; docs-only PR |

#71 stays bounded to B1 + S1–S5 plus a B2 **assessment**. Adapter / gap / sliver / responsive work must stay separate. That part of #82 is right.

## Proposed corrections

Do these on Linear (by the agent already there) and in #82/#81. Do not reopen the split.

### Linear (HeavyMap.com)

1. Add outcome milestones, not dates: **#71 fixture repair reviewable**; **Pages/D1 assessment** (not approval); **first pinned Atlas artifact integration**; **Hamilton publication** (empty until Stage B sign-off).
2. Move or dual-home **NA-32** onto HeavyMap.com. Rewrite it: synthetic UI may proceed now; chrome deferral does not apply to assigned frontend tasks; G2/G3 are not start gates for fixture UI.
3. Cut one bounded child for the #71 repair (B1, S1–S5, B2 assessment, no merge). Point at `codex/heavymap-v0-frontend` and current conflict SHA.
4. Drop or replace the **Docs** project label. Keep public-docs issues, but the project is the frontend track.
5. Mark **D7 done** in the handoff once the live description is accepted. Do not leave it as an open product decision.
6. Post a **dated project update**: health, #71/#81/#82 evidence, exact blockers (D1, merge authority), next issue. The Oct 15 update is stale.
7. On NA-308/NA-309, state the wait exactly: UI waits for a screened run-record example / `address_no_parcel` index; Atlas validation does **not** wait for those UIs.

### Linear (Industrial Atlas)

1. Rename/restate gates so percentages cannot look like sign-off: **G6 = gate defined** (or retire it); add **Hamilton Stage A** and **Hamilton Stage B (Morgen sign-off)** at 0% until run IDs exist.
2. Set **G2** off 100% until NA-16 is done, or change the exit test to “US fixture only.”
3. Set **G4** off 100%, or split “backend dossier generated” from “rendered in HeavyMap.”
4. Clear the **2026-09-30** target date.
5. Amend Decision log / Roadmap **locked rows**, do not only prepend a header. Fix MPAC/NPCA, G5-before-G6, UI deferral, and `NIA-` → `NA-`.
6. Remove or archive the **untitled empty document**.
7. Post a dated update: Hamilton batch proceeds; split execution paused; #82 is instruction-only and unmerged.
8. Keep NA-269 Done for *definition*. Record Stage A/B sign-off as comments/fields on NA-269 or a new child, never as G6 progress.

### GitHub (#82, and #81 where stacked)

1. Update **`README.md`**: two Linear projects; this repo remains the single code SoT; split paused.
2. Update **`AGENTS-MCS.md`** publication line to HARD-RULES 3 / NA-269 Stage B, not “until data is reconciled.”
3. Make insight routing **replace** the standing sheet-19 paragraph for frontend work; do not append an exception above an unchanged rule.
4. Keep the Morgen-assignment exception out of HARD-RULES 7.
5. In the frontend handoff: **D7 executed in Linear**; **D1/D6 still open**; **#80 §6.4 amended** (prepare #71, do not treat landing it as split step 1); retire #81’s “do not edit Linear” STOP.
6. Soften BETA-GATE / OPEN-DECISIONS split wording to **paused until Morgen reopens execution**. Do not say “as soon as practical.”
7. Shrink the PR template to: track, Linear id, acceptance claim (one of the four), checks, publication-path check.
8. Before any `main` merge, paste the Pages API result above and Morgen’s D1 answer. Agents still do not merge.

### Dependencies rule (apply everywhere)

Write the wait in one clause: “X waits for Y; Z does not.” Examples already implied but not consistently applied:

- Frontend fixture work does not wait for Hamilton repeats.
- Hamilton repeats do not wait for #71 or #82.
- Real-data integration waits for a named screened artifact (run id, schema, hashes).
- Public product release waits for NA-269 Stage B for that jurisdiction.
- Instruction-conflict work waits only if that conflict touches the assigned paths.

## Process insights from the review session

Logged in `Spreadsheets/19-process-insights.csv` when this snapshot is committed (PI-0112 onwards):

1. Pages config is live-verified as legacy `main`/`/`; HTTP GET to heavymap.com from the review environment returned 403, HTTPS handshake failed, so public HTML was not inspected. Use the API, not a homepage screenshot, as merge evidence.
2. Linear project descriptions/resources were already rewritten at 18:31 UTC while status updates, milestones, and NA-32 were not. Mid-update inconsistency is real, not just stale docs.
3. G6 100% is an artifact of NA-269 (definition) sitting on a milestone named “publish.” That is the highest-risk false-readiness signal in the current setup.
