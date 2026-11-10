# Spec G: delivery, accessibility and acceptance

Status: **draft for Morgen's review**, 2026-11-10. Local issue HM-010. Written against branch `heavymap-mainsite-v1`.
Depends on: specs [A](A-product-structure.md), [B](B-content-model.md), [C](C-reader-continuity.md), [D](D-visual-system-themes.md), [E](E-subscriptions.md) and [F](F-mapping-shell.md); decisions 1–61 (2026-11-10); `docs/for-agents/HARD-RULES.md` (rules 3 and 7); [`BETA-GATE-HAMILTON.md`](../../BETA-GATE-HAMILTON.md) sections 6–7; frontend backlog D1 and D6 ([`BACKLOG-DRAFT-2026-10-18.md`](../BACKLOG-DRAFT-2026-10-18.md)).

This spec delivers two things:
- a **release-readiness checklist** (section 9);
- a **future validation plan** (section 10).

It doesn't run that plan. Morgen lifted the testing restriction on 2026-11-10 ("focused checks OK"), so focused checks may run during implementation. Section 10 is the full pass before launch.

Labels used in this document:
- **Decided**: Morgen chose it.
- **Proposed**: this draft recommends it and it needs acceptance.
- **Open**: deliberately left unresolved.

## 1. Current hosting (re-inspected 2026-11-10, read-only)

Observed with `gh api` and `curl` on 2026-11-10. These are dated observations, not proof of the state at merge time. Recheck them before any merge or publication.

| Fact | Observed |
| --- | --- |
| Repository `niagaraassembly/heavymap` | **public** |
| `main` branch protection | **none** |
| GitHub Pages | `build_type: legacy`, source `main` at `/`, custom domain `heavymap.com` (and `www`), certificate approved until 2027-01-15 |
| HTTPS enforced | **false** |
| Custom 404 page | none |
| Workflows | only GitHub's automatic `pages-build-deployment` |
| What heavymap.com serves | the whole repository tree. For example, `/Spreadsheets/20-data-gaps-ledger.csv` and `/heavymap-planning/BETA-GATE-HAMILTON.md` both return 200 |
| Railway service `heavymap` (backlog D6) | **not re-inspected** in this session |

**Consequence: merging any branch into `main` publishes it at heavymap.com within minutes.** That includes this branch: `web/` source files, the planning specs and the prototype pages, served unbuilt and broken. The repository is already public, so nothing becomes visible that GitHub doesn't already show. But it would *serve* broken pages on the product domain. Section 4 closes this before the first merge.

## 2. Build

One command produces the public site from the content snapshot (spec B section 7.1). Proposed name: `npm run build:site`.

```
content/  (snapshot, SNAPSHOT.json)        web/src (selected design)        map inputs
     │                                           │                    (basemap extract; later
     ▼                                           ▼                     Atlas run + run record)
 1. load through the export-shaped loader   2. bundle (Vite)                │
     ▼                                           ▼                          ▼
 3. validate ───────────────────────────────────────────────────────────────────
     • vocabulary values against MAKE controlled-values (spec B section 4)
     • IDs, status, eligibility; no preview/draft in a public build (spec B section 5)
     • internal links, including "no links to unpublished capabilities" (spec A section 3.3)
     • the theme launch gate: all three themes `published` (decision 36)
     • the contrast check per theme and mode (spec D section 8)
     • the map checks (spec F section 7.4)
     • size budgets: data ≤ 50 KB, app ≤ 500 KB compressed (decision 56); files ≤ 100 MB; site ≤ 1 GB
     ▼
 4. generate prebuilt pages for every URL in spec A section 4, plus 404.html
     ▼
 5. dist-site/  +  build-record.json  (commit, snapshot hash, basemap extract hash, check results)
```

- **Fail closed.** Any check failure stops the build, and there is no "warn and continue" for public builds.
- **Prebuilt.** Every URL is a real file (decision 1), so a static host serves it without routing tricks.
- **The basemap extract and later Atlas tiles are build inputs, not committed to git.** This follows BETA-GATE section 7 for Atlas output. The basemap extract follows the same rule, and the build record pins its hash.

## 3. Environments and visibility

| Environment | Where | Content included | Banner |
| --- | --- | --- | --- |
| Local development | `npm run dev` on the reviewer's machine | everything, including synthetic fixtures | "Development" |
| **Preview** | **not hosted publicly** (proposed, G-Q1): a local `npm run build:site -- --preview`, or the CI artifact downloaded and opened locally | `published` + `preview`; themes with `design` status; the map workspace on synthetic fixtures | "Preview · not public" on every page |
| Public | heavymap.com, through the deploy job in section 4 | `published` only | none |

**Why preview isn't hosted.** Anything on GitHub Pages is public. A hosted preview of `preview` items or unapproved themes would be a publication, so it would need the same sign-off as launch.

## 4. Publishing boundary

**Proposed sequence:**
1. **Before the first merge of this branch** (backlog D1 option B):
   - add a root `_config.yml` that excludes `web/`, `content/` and `heavymap-planning/frontend/` from the legacy Pages build, so a merge changes nothing that heavymap.com serves;
   - add a `404.html` with no content. *(G-Q2.)*
2. **At launch** (D1 option A):
   - switch Pages to "GitHub Actions" as the source;
   - add a deploy workflow that runs **only on manual dispatch**, builds with `npm run build:site`, and deploys `dist-site/` through a GitHub **environment `heavymap-public` that requires Morgen's approval**;
   - enable "Enforce HTTPS" (G-Q3).
3. **Who presses the button:**
   - agents may write and test the workflow (HARD-RULES 3), but never dispatch it, approve it or merge it (HARD-RULES 7);
   - Morgen dispatches and approves each public deploy.
4. **Sign-off scope (G-Q4):**
   - HARD-RULES 3 requires Morgen's per-jurisdiction beta-gate sign-off (NA-269) for public publishing.
   - **Proposed:** the editorial launch (Desks, editions, Reader, documentation, the basemap-only `/map/`) needs **Morgen's launch approval**, recorded in the decisions file.
   - Each map geography's workspace needs that geography's **Stage B sign-off** on top.
5. **Railway (backlog D6):** re-inspect before launch. If it still auto-deploys `main` and fails, disable auto-deploy or record why it stays. It has no domain, so it isn't public.

### 4.1 Redirects and rollback

- **Redirects:** none from niagaraassembly.com for now (decision 15). Within heavymap.com there are none, because v1 is the first site. The legacy repository mirror stops being served when Pages switches to Actions in step 2.
- **Rollback:**
  - re-run the deploy workflow on the previous release tag; each public deploy is tagged `site-YYYY-MM-DD-N`, and Pages keeps the deployment history;
  - **content is retired, not deleted** (spec B section 5). A wrong item is fixed by retiring it or issuing a correction, then rebuilding, not by rolling back the whole site;
  - an emergency takedown is a one-commit `404.html`-only deploy, approved by Morgen like any deploy.

## 5. Accessibility acceptance

The target is **WCAG 2.2 AA**. Each line here is a check, not a guideline.

| Area | Accepted when |
| --- | --- |
| Landmarks and headings | Every page has one `<h1>`, `header`/`nav`/`main`/`footer` landmarks, and heading levels that don't skip. The map dock is a labelled `nav`. |
| Skip link | "Skip to content" is the first focusable element, and it moves focus to `main` (this replaces the prototype's `preventDefault` handler with a real target). |
| Navigation | The header works by keyboard, the current page has `aria-current`, and the theme selector follows the listbox pattern (spec D section 5). |
| Keyboard and focus | Every control is reachable in reading order, the focus ring meets 3:1 in every theme and mode, and there's no keyboard trap. The modal, sheet and pane return focus (specs C section 5.5 and F section 5). |
| Reading order | The DOM order matches the visual order on edition cards (spec B section 10.1) and in the Reader at every breakpoint. |
| Contrast | The build check passes (spec D section 8) for every theme and mode, including dark USA. |
| Labels | Every form field has a visible label. The Desk checkboxes sit in a fieldset with a legend (spec E section 8). Icon-only buttons have names. |
| Motion | No autoplay. The ticker (if kept) is pausable. With reduced motion, view transitions and theme switches are instant (specs D and F). |
| Scrolling | No nested scroll traps on mobile (spec C section 5.4). The page reflows at 320 px without horizontal scrolling, apart from the map canvas. |
| Assistive technology | Status messages use `role="status"`. The map canvas is labelled as decorative in v1 (spec F section 2). The ◒ mark is `aria-hidden`. |
| Language | `lang="en"` everywhere. Themes never change it (spec D invariant 4). |

## 6. Browser and device coverage (proportional to v1)

| Target | Why |
| --- | --- |
| Chrome and Edge (latest), Firefox (latest), Safari (latest macOS) | desktop reading |
| Safari iOS (latest), Chrome Android (latest) | mobile reading and the `/map/` basemap |
| Widths 1440, 1024, 390, 360 px | as already used for the earlier page studies |
| One mid-range Android phone | `/map/` WebGL and the 500 KB app budget in real conditions |
| No WebGL (forced) | the static fallback on `/map/` (spec F section 2) |
| Storage blocked (private mode) | the Reader, history and theme keep working in memory (spec C section 6.3) |

**Failure states to cover:**
- offline after load;
- the basemap fails to load;
- the signup network fails (spec E section 4.2);
- an unknown `?item=` (spec C section 5.2);
- a retired item, which shows its tombstone.

## 7. Functional acceptance (tied to the specs)

Each spec's acceptance list is the functional contract. No broad repeated suites beyond these.

| Spec | Acceptance source |
| --- | --- |
| A | every URL in section 4 builds and resolves; 404 page; no links to unpublished capabilities; `/map/hamilton/` is not generated |
| B | Issue One's 10 items present and complete, and match the original card's revealed details (section 10); Mentions only on published Desk news; vocabulary values valid |
| C | section 8's list |
| D | contrast check; no flash on first paint; hint precedence; recent themes; dark USA only |
| E | one test signup per Desk on the real flow (section 7 of spec E), done by Morgen; the per-Desk stop link removes only that Desk |
| F | basemap pans and zooms within bounds and nothing is clickable; no Atlas strings in the `/map/` output; failure copy never reads as evidence; no item–map connections (decision 57) |

### 7.1 Four kinds of evidence, kept apart

Results are reported under one of these headings and are never merged into a single "passed":

1. **Content:** the snapshot's items, fields and vocabulary are correct against the approved export.
2. **Frontend on fixtures:** the behaviour is correct on synthetic or snapshot data.
3. **Real-artifact integration:** the map works on real Atlas output. That's not in v1, and it belongs to each geography's Stage B.
4. **Publication approval:** Morgen's recorded approval. No test result substitutes for it.

## 8. Recovery and handoff

- **Working state:**
  - everything is committed on `heavymap-mainsite-v1` in `~/work/heavymap-mainsite-v1` (local, not pushed);
  - the issues list is in `~/inbox/projects/heavymap/working/issues/`;
  - decisions are in `~/inbox/projects/heavymap/decisions/2026-11-10-frontend-v1-decisions.md`.
- **Install and start** (to be written into `web/README.md` with F-T and D-T work): `cd web && npm ci && npm run dev`, then open the printed local URL. Node v23 is used on macbook1; the engines field will be pinned when the build script lands.
- **Design evidence:** the handoff's screenshots were in `/tmp` on the earlier machine and aren't durable. **Proposed (G-Q5):** keep review screenshots in `heavymap-planning/frontend/evidence/<date>/` as small WebP files, with a README naming what each one shows and which commit it came from.
- **Process insights:** frontend findings go in the PR's Process insights section with `HM-PI-` IDs until `heavymap-planning/frontend/19-process-insights.csv` exists (CLAUDE.md). One is already waiting: the prototype's frozen `issue-one.json` dropped `IEVT-2026-000009` and most structured fields.

## 9. Release-readiness checklist

The launch is ready when every box is ticked. **[M]** means only Morgen can tick it.

**Content**
- [ ] WNY Issue One snapshot: 10 items, complete (decision 23)
- [ ] WNY Issue Two and Niagara–Brant Issue One: approved, service-owned export received (HM-015) **[M]**
- [ ] Source kinds confirmed (HM-016, decision 41)
- [ ] Credits page lists OpenStreetMap, Protomaps and the flag sources

**Design**
- [ ] Canada and Japan designs approved, and their status set to `published` (HM-014, decision 36) **[M]**
- [ ] Dark USA theme done (HM-019)
- [ ] Map modal copy final (decision 55) **[M]**

**Subscriptions** (spec E section 7)
- [ ] Kit tags and per-Desk stop links created; the stop-link mechanism verified in Kit **[M]**
- [ ] HeavyMap Google Form, Sheet and `heavymap-join.gs` installed, Script Properties set, `runSelfTest` passes **[M]**
- [ ] Daily failure check installed and recorded in `inventory/schedules/jobs.csv`
- [ ] `na-list` bulk-tagged for both Desks, on launch day **[M]**

**Build and hosting**
- [ ] `npm run build:site` passes every section 2 check on the launch commit
- [ ] `_config.yml` exclusion merged before the first merge of this branch (section 4 step 1)
- [ ] Deploy workflow with the `heavymap-public` environment and required approval
- [ ] Hosting facts in section 1 re-inspected within 24 hours of launch
- [ ] Railway checked (backlog D6)

**Validation**
- [ ] Section 10 pass completed; results reported under the four headings in section 7.1

**Approval**
- [ ] Launch approval recorded in the decisions file (G-Q4) **[M]**
- [ ] Pages source switched to Actions, HTTPS enforced, deploy dispatched and approved **[M]**

## 10. Future validation plan (not run now)

1. **Unit:**
   - the loader and validators (vocabulary, IDs, eligibility, links);
   - reading-state merge and migration (spec C section 6);
   - theme precedence (spec D section 6);
   - the contrast calculator.
2. **Build:** run `build:site` against the snapshot and assert the URL inventory, the 404 page, the absence of preview content and the budgets.
3. **Browser (Playwright, already in `web/`):**
   - one scenario per row in spec C section 8;
   - theme and mode without flash;
   - signup form states with the network stubbed;
   - `/map/` bounds, no-WebGL fallback and failure copy;
   - mobile Reader collapse.
4. **Accessibility:** axe on every page template in each theme and mode, plus a manual keyboard pass and one screen-reader pass (VoiceOver macOS and iOS) over the section 5 table.
5. **Devices:** the section 6 matrix, once, on the launch candidate.
6. **Real flows (Morgen):** subscription test signups (spec E section 7 step 5), and the deploy dry run to a fresh tag before the real one.

## 11. Open questions for Morgen

| ID | Question | Proposed answer |
| --- | --- | --- |
| G-Q1 | Preview hosting | No hosted preview. Previews are local builds or downloaded CI artifacts, because anything on Pages is public |
| G-Q2 | Before the first merge of this branch, add the `_config.yml` exclusion (backlog D1 option B)? | Yes. It keeps heavymap.com unchanged until launch |
| G-Q3 | Enforce HTTPS on heavymap.com (currently off) | Yes, at launch. It could be turned on now, since it only redirects http to https |
| G-Q4 | Does the editorial launch (with no Atlas data) need the NA-269 beta-gate sign-off, or a separate launch approval? | A separate launch approval by Morgen. Stage B applies per map geography |
| G-Q5 | Store review screenshots in the repository (`heavymap-planning/frontend/evidence/`)? | Yes, small WebP files with a README |
