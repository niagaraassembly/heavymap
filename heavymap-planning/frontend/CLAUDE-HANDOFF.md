# HeavyMap frontend — handoff to Claude

> **Repository preservation update:** The frontend source, planning/handoff documents and all available review images are being preserved on `hm/desks-site-prototype` for review. Images now have durable copies under `design-reviews/` beside this file. Earlier uncommitted/temporary-only statements describe the pre-push handoff; use the branch/PR status for the current revision. No merge or publication is authorized.

Prepared 2026-11-10 from this Codex session. Read this before doing more work. This is a continuation briefing, not a specification plan or publication approval.

## User instructions that must survive handoff

- **Industrial Atlas is the backend. HeavyMap is the user-facing product.** The current repo still contains both; the documented split has not been authorized for execution here.
- The user selected the **second homepage and related page styles**. Preserve the original mapping/lens/dossier work. The newsletter pivot adds the surrounding site; it does not cancel mapping.
- The two Desks are **Western New York** and **Niagara–Brant**. Desk/newsletter coverage may precede mapping coverage. Hamilton live mapping was expected within roughly a week of this conversation; do not turn that expectation into a verified launch or fixed date.
- Reader is the master doorway into readable Desk and HeavyMap material: news first, plus findings, editorials and documentation. **Exclude unrelated Niagara Assembly publications** from the migrated catalogue.
- Browser-local history is authorized for last item, reading position, filters and read status. A subtle “you left off with…” line is preferred. Do not confuse it with subscription/account state.
- Mapping is an equal partner. The user suggested a map strip that reveals the workspace while the editorial surface lowers into a bottom bar.
- Attend to **site design before Kit/GitHub backend mechanics**. The existing newsletter subscription implementation is in niagaraassembly/site; mechanics/workflows have not been investigated or copied in this task.
- **Do not reconcile the dated backlog yet. Do not create the spec plan yet.** User wanted page-style review first, then would authorize planning.
- **Latest instruction: no extra testing.** User has about 16% weekly quota remaining and wants a Claude handoff. Respect that instruction unless explicitly changed. Do not launch broad tests, browser runs, screenshots, builds or speculative investigations automatically.
- No publication/deployment/merge authorized. No messages sent to other agents or external services. This handoff is a file for the user to pass on, not a dispatch to Claude.

## Workspace and preservation

Repo `/workspace/heavymap`; branch `hm/desks-site-prototype`, based on main `9a1c773`. Work from this session is **uncommitted**, including numerous untracked files. Do not reset, clean, reclone over it or switch away without preserving it. A fresh clone or branch checkout alone will not contain the work. Transfer the whole working tree or explicitly preserve a patch plus all untracked assets before changing machines. No PR opened or pushed.

Read root AGENTS.md and heavymap-planning/WORKING-AGREEMENT.md. This work is directly assigned by Morgen; no new Linear issue has been invented. Backend/data restrictions and publication gates still apply. Source repository `/workspace/site` was cloned read-only for reference at `9522b3ebd3b4686fab99634bd0e710c883bd1b00`; it was not modified. Do not access heavymap-restricted.

## Selected implementation and files

Everything is under `web/`, using the existing Vite project. No dependencies or lockfiles were changed.

- `alternate.html`: **selected second direction**, header/footer and map dock.
- `index.html`, `src/editorial/site.js`, `site.css`: first design, retained for comparison. Some subscription/credits links from the second design still point there; migrate them deliberately later.
- `map.html` plus original `src/app.js`, `map.js`, `dossier.js`, `fixtures.js`: preserved synthetic mapping prototype. Original app logic was not redesigned. Its browser tests were pointed at `/map.html` instead of `/`.
- `src/editorial/alternate.js`, `alternate.css`: editorial homepage, Reader workspace, local history cue, actual synthetic iframe reveal/return, and route integration.
- `reader-catalog.js`: deliberately scoped catalogue, nine historical WNY briefs plus two unpublished HeavyMap documentation samples. Not the entire production library.
- `reader-state.js`: `heavymap-reader-v1`, known-ID validation, bounded progress, filter/read state, safe storage fallback. Does not touch Niagara Assembly's `na-reader` key.
- `issue-one.json`: curated source headline/note/stage/source records, frozen from published WNY Issue One. No new status verification implied.
- `public/editorial/`: two licensed archival regional photographs, credited in the first design's credits view. They illustrate regions, not individual projects.
- `page-studies.js`, `page-studies.css`: first review round—Desk directory, both regional pages, edition layout, standalone briefs, documentation and editorial samples.
- `round-two.js`, `round-two.css`: **latest, unverified** design states for signup/confirmation/preferences/regional-vs-all unsubscribe, map/Reader layout specimen, and review hub. No actual email/subscription actions.
- `vite.config.js`: builds three entries, index/alternate/map. No deployment configuration added.

Visual direction: warm off-white, slate text, green/rust accents, serif headlines, restrained geographic illustration and source-aware labels. User liked the results. The little rust half-dot is inherited `◒`, rotated, from the map prototype—not an established logo or identified outside inspiration. User asked about it but did not ask to remove or replace it.

## Routes to review

All following hashes belong to `alternate.html`:

- `#/`: selected editorial homepage.
- `#/reader`: actual Reader with news/type/region/search/unread controls, local resume, explicit read status and scoped forgetting.
- `#/desks`: directory.
- `#/desks/western-new-york`: populated Desk, archive and independent mapping status.
- `#/desks/niagara-brant`: editions not migrated; honest empty state and link to existing Desk. Hamilton synthetic preview is available, not a live-service claim.
- `#/editions/western-new-york/issue-one`: grouped edition layout using nine selected briefs, linked to complete original.
- `#/read/IEVT-2026-000001`: news brief; other catalogue news IDs also resolve.
- `#/read/hm-reading-the-evidence`: documentation study; same content available in Reader.
- `#/read/editorial-study`: expressly unpublished sample, not added to the published Reader catalogue.
- `#/studies`: first-round review gallery, six page types.
- `#/studies/round-two`: latest round's review hub.
- `#/studies/round-two/subscribe`, `/confirm`, `/manage`, `/saved`, `/leave-desk`, `/leave-all`, `/mapping`: design states. Prefix each with `#/studies/round-two` as appropriate.

Round-two changes made under the no-extra-testing instruction:

1. Added the above review screens. All forms are preview-only; email is neither saved nor sent. Confirmation copy explicitly says no operation occurred. No Kit API, GitHub Action, account or secure-link backend is implemented.
2. Added a mobile Browse & filter button to actual Reader; it collapses the library to leave more room for reading. It does not change stored filter data.
3. Added a map-plus-reading-panel **layout specimen**, with before-launch, future-live and other-region availability examples. The actual already-tested synthetic reveal is retained. Reading alongside the real map is not implemented or verified; do not describe the specimen as functional integration.
4. Added a Round two footer link. The existing first-round gallery remains.

## Validation: separate historical evidence from this latest state

**Before the latest round-two edits:** nine Node tests and nineteen Chromium scenarios passed. Desktop/mobile page studies were checked at 1440/390/360 px; compiled Desk→edition→brief path, source links and clipboard fallback were checked. Production builds passed; the pre-existing large MapLibre chunk warning remained. Original Python suite previously ran 128 tests with 17 skips and no failures; the planning index then showed 89 rows, 71 paths, zero missing. These are prior results, not fresh claims for the round-two tree.

**Latest round-two edits: no tests, build, lint, formatter, browser run or screenshot pass performed**, per user's quota instruction. They may contain integration or layout errors. No new readiness claim. Do not repeat old “all checks pass” as if it validates this state. Firefox has not been run. No production-scale map throughput, hosted range/CORS, real data integration, Kit delivery or new-task restoration was established.

Screenshots from earlier work, if the same machine still exists:

- `/tmp/heavymap-alternate-home.png`, `-reader.png`, `-map.png`, `-returning.png`, `-mobile.png`, `-reader-mobile.png` (full paths share prefix `/tmp/heavymap-alternate`).
- `/tmp/heavymap-review-round1/overview.png`, `western-new-york.png`, `niagara-brant.png`, `edition.png`, `news-brief.png`, `documentation.png`, `editorial.png`, and mobile variants for WNY/edition/brief/docs/editorial.
- There are **no round-two screenshots**. Temporary screenshots may not survive a machine transfer.

## Source and publication truth

WNY Issue One was published on Niagara Assembly on **10 October 2026**, covering 28 September–9 October. Its notes describe historical source dates, not current project status. Preserve source disagreements, stage distinctions, contract ceiling vs obligations, unknown production locations and regional shares. Do not invent Niagara–Brant editions or new authorship/correction history. The sample editorial/docs are labelled unpublished. Photo source/licence details and earlier provenance are in SITE-DESIGN-PREVIEW.md and the existing credits view.

The source Reader was inspected in `/workspace/site/assets/js/reader.js`, `assets/css/reader.css`; it uses a site-wide publication catalogue and local read state. HeavyMap's prototype adapts its patterns, not the entire catalogue. Its own scope rules must persist in the eventual build process.

## What to do next, conserving quota

1. Read this briefing and inspect only files needed for the user's next direction. Do not rerun completed exploration.
2. Present/clarify round-two design states and collect comments. Be candid that they are not newly validated. Avoid another large implementation round unless requested.
3. Wait for explicit authorization before a specification plan. Once given, cover information architecture, catalogue eligibility/content types, regional availability, Reader URL/state behaviour, subscription semantics, map/reading integration, source provenance and publication boundaries. Do not silently decide unresolved product choices.
4. Only after design direction and planning authorization, investigate the existing Kit/GitHub subscription setup. Reuse proven mechanics after checking per-Desk vs global unsubscribe, existing subscriber migration, confirmation and secure preferences. Never request secret values in chat.
5. Preserve existing user work and hand back a reviewable branch/PR when requested; never merge or publish.

Open decisions: final logo; display term “Desk”; which article types enter Reader and whether sample guides become actual publications; production URL strategy (hash routing is prototype-only); Reader library behaviour on small screens; precise signup/confirmation wording; Kit's regional/global unsubscribe semantics; whether reading alongside mapping should be a drawer, split pane or Reader overlay; actual Hamilton launch eligibility and source artifact; accepted meaning of startup payload budget. Avoid reopening decisions already recorded in authoritative repository contracts.

## Process insight for transfer

Latest round-two work establishes only design intent, not runtime evidence. The reusable constraint is to distinguish previewed account/subscription states from actual subscriber data, and to carry forward the no-extra-testing quota instruction explicitly. No new empirical performance or functional finding was claimed. Frontend insights belong to the HM-PI destination/interim report route, not Atlas sheet 19. Prior discoveries and validation are already recorded in SITE-DESIGN-PREVIEW.md; do not duplicate them.

### Subsequent screenshot request

After the no-extra-testing instruction, the user explicitly asked to see the new images. Captured only the subscription, preferences, mapping-layout and collapsed mobile Reader screens from the existing development server. Files: `/tmp/heavymap-review-round2/subscriptions.png`, `preferences.png`, `mapping.png`, `reader-mobile.png`. No tests or build run. This supersedes the earlier statement that round-two screenshots do not exist; it does not establish complete validation.

## Latest product direction: optional country themes

Morgen's subsequent decision supersedes any suggestion to replace the selected design with the Japanese-inspired image study:

- **Retain the plain/base look already developed and selected.** The Japanese-inspired rendering is an optional future theme, not a replacement or a new default.
- Country-inspired looks will form a growing set of user-selectable site themes. Use a **country-flag dropdown**, with readable country names as well as flags for clarity/accessibility.
- Japan is one proposed theme in that set. The generated image is a visual reference only; no Japanese-theme code or theme system has been implemented.
- User intent is to infer an appropriate regional look unobtrusively, otherwise fall back to **USA/American look as the default**, with USA and Canada as the initial choices. The exact regional signal and the distinct Canadian treatment are not specified. Browser language/region can be a hint, not proof of a person's location; do not silently introduce precise geolocation, permission prompts, tracking, or a third-party location service as an implementation assumption.
- Explicit user selection should take precedence over any inferred suggestion. Treat country here as **visual theme**, independently of Desk subscriptions, editorial coverage, map geography and language.
- **Always display the two most recent theme selections** for convenient switching. Suggested interpretation for implementation review: two most recent distinct country themes, stored locally; seed USA and Canada when no selection history exists. Exact ordering/first-visit behaviour can be confirmed when specifying the control.
- Persist theme choice/history separately from Reader history and subscription data. Forgetting reading history should not reset a chosen theme unless the user asks for that broader action.

This update records direction only. No theme dropdown, region detection, theme persistence, new tests, builds or publication changes were made. The earlier quota/no-extra-testing instruction and requirement to obtain authorization before the specification plan still apply.

Japanese visual reference, if the same workspace survives: `/workspace/generated_images/exec-b3faa3c8-8c73-40cc-a3bb-3899f4854058.png` (homepage and brief side by side). It was generated from existing screenshots, not rendered from changed application code.

## Completeness checklist for continuation

### Working prototype features, not production completion

The selected homepage, Desk/edition/brief layouts, Reader filters and browser-local resume, and synthetic map reveal have implementations. Earlier validation is listed above. Latest round-two screens/control changes were not comprehensively validated; subsequent screenshot capture was visual presentation only. None of this establishes live Hamilton mapping, a production subscription service, or a published migration.

### Incomplete elements to carry forward explicitly

1. **Subscriptions:** confirmation, saved preferences and unsubscribe pages are illustrative states. No real secure-link flow, subscriber lookup, email confirmation, Kit connection, regional/global unsubscribe handling, migration of existing subscribers, or GitHub workflow integration. Signup choices are not a subscriber record. Existing Kit/GitHub mechanics still need focused inspection after design/spec authorization.
2. **Mapping shell:** the functional reveal embeds the original synthetic application in an iframe. It retains the old top header plus the new bottom bar; their final consolidation is unresolved. The side-by-side map/Reader screen is a layout specimen, not an implemented reading drawer. Bottom-bar Reader/region controls in that specimen are descriptive, not functional controls. No accepted parcel↔article linking, live screened artifact, published map destination, or region-wide coverage mechanism has been integrated.
3. **Themes:** flag dropdown, optional Japan theme, Canadian treatment, recent-two history and inference are entirely unimplemented. Confirm whether recent means two distinct explicit selections, how first visits are seeded, whether inferred defaults count toward history, and what regional hint is acceptable. Do not implement a precise-location request or external service by assumption.
4. **Reader catalogue:** only nine selected WNY briefs and two unpublished guide samples are indexed. Full original Issue One, subsequent editions, Niagara–Brant content and eligible HeavyMap findings/editorials/docs require deliberate migration and a catalogue-generation process. The sample editorial page is intentionally outside the published catalogue. No automatic site-wide crawling/import from Niagara Assembly. Define news vs finding vs article vs editorial vs documentation before final filters and labels become schema commitments.
5. **Reading state across surfaces:** current persistence is implemented for the Reader pane. Standalone article/edition pages do not have equivalent document-scroll persistence or a synchronized cross-surface reading-position contract. Decide whether their visits should update the homepage resume cue, how their progress relates to Reader progress, and how an edition sequence differs from its individual briefs. Do not imply every reading surface already resumes.
6. **URLs and navigation:** hash routing is a prototype choice. Final canonical URLs, share behaviour, redirects from migrated Niagara Assembly Desk URLs, back/forward behaviour and cross-entry navigation need specification. Some subscription/preferences/credits links still leave the selected second shell for first-design pages. The footer includes review-only Page studies/Round two/Compare links; they are not final public navigation. Unknown alternate routes currently fall back to the homepage rather than a dedicated not-found view.
7. **Publication metadata:** authorship, update dates, corrections, issue membership, historical vs current source status and source provenance need an agreed content model. Do not invent missing values. Editorial sample copy is not approved published editorial material. An edition-layout selection of nine stories is not the complete original issue.
8. **Visual/accessibility finish:** logo/half-dot remains undecided. Reading sizes, small metadata labels, contrast, source disclosure prominence, mobile nested scrolling, theme contrast, focus restoration and motion are not a completed accessibility audit. Prior browser scenarios establish only their named interactions; no Firefox coverage, production phone-performance claim or comprehensive accessibility conformance claim.
9. **Failure and lifecycle states:** production loading/error/retry, expired or invalid preference links, pending confirmation, unavailable sources, empty regions and storage persistence failures need coherent final treatments. Some empty/storage states exist in Reader, but this is not complete coverage of the whole product.
10. **Operational delivery:** no production deployment/publishing change, domain transition, automatic content build, release pin, rollback procedure, live data acceptance or new-task restoration has been completed. Preserve repository publication gates and obtain the appropriate authorization before activation.

### Suggested next conversation, not an authorized spec plan

Ask Morgen only for the remaining choices that materially affect the specification: theme inference/history semantics; the desired relationship between Desk, edition and Reader; map/reading layout; subscription confirmation and per-Desk semantics after checking existing mechanics. The user has accepted the overall second visual direction—do not restart a broad aesthetic exploration or reopen the earlier backlog. Do not mistake layout approval for approval of generated editorial copy, every proposed interaction detail, backend mechanics or publication.

Latest map screenshots, if available: `/tmp/heavymap-review-round2/loaded-map-bottom-bar.png` and `loaded-map-dossier-bottom-bar.png`. They show the real synthetic iframe reveal, including the remaining duplicate top/bottom branding; they are not screenshots of the map-plus-Reader layout specimen.

No new empirical findings are claimed in this checklist. It consolidates known implementation boundaries for handoff and does not allocate new issues or authorize further tests.

## Latest authorization: specification plan drafted

Morgen subsequently asked “Write a spec plan?” A draft is now at `SPEC-PLAN.md` beside this briefing. This supersedes earlier statements that no spec plan has been created or authorized. The draft organizes confirmed direction, proposed specification documents, open decisions, dependency order and completion criteria. It does not finalize all specifications or authorize implementation/publication. No code changes, tests or builds were performed for this planning request; the no-extra-testing/quota constraint remains.

## MacBook source and data discovery

See `MACBOOK-START-HERE.md` for the subsequently prepared bootstrap brief: current repo ownership, safe fetch/refresh, service-data manifests, native-writer authority, and news research versus publication state. The newer research PR #183 records maintained components in make, originals/exports in service-data and retained website source in publish. The earlier frontend ZIP does not include these subsequently written notes or the newer issue datasets. The bootstrap recommends a canonical maintained discovery registry and producer-owned fresh exports; it does not claim those automation improvements are already installed.

## Unpublished news material: GitHub location clarification

Current discovery starts in `niagaraassembly/service-data`: `originals/research/`, `exports/legacy-views/production-intel/`, `exports/legacy-views/approved-isolated-join-intel/`, and explicit `snapshots/` plus `objects/`. Approved isolated Join data is not production-merged. GitHub mirrors/checkpoints may lag the native writer's review/store data.

`niagaraassembly/na-research` preserves packet/candidate/review history and weekly PR context, notably PR #181 (WNY Issue Two/Niagara–Brant Issue One preparation), #175/#180 (weekly research), and #183 (ownership transfer). Historic paths include `research/news/packets/<week>/<region-id>/`, `research/news/inbox/`, and `research/news/reviewed/`. These are not all automatically publication-approved.

`make` owns maintained processing implementations; `site`, `publish` and `heavymap` are site/publication sources, not the complete unpublished inventory. At inspection only WNY Issue One appeared as published in the exported issue registers. No finalized newer edition selection or up-to-the-minute native completeness is claimed. None of the unpublished research datasets was copied into this frontend branch.
