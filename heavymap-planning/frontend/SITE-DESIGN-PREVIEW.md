# HeavyMap editorial site design preview

Direct assignment: Morgen, 2026-11-10, this session. Track: HeavyMap frontend. Owner: Codex. Branch: `hm/desks-site-prototype`, base `9a1c773`. No new Linear issue or status is invented. Human review required; no merge or publication performed.

## Outcome and scope

Build the site container around regional Desks while retaining the map/lens/dossier work. Western New York Issue One provides realistic published content. Hamilton mapping is expected soon; show a genuine introduction, not a dead application link. Desk availability and map availability are independent. Kit, GitHub subscription workflows and backlog reconciliation are excluded.

The provisional design carries forward the HeavyMap field guide: slate ink, green and rust, serif headlines, source-aware small labels, quiet cartographic texture. This is a reviewable direction, not a settled design decision.

## Screens

- Home: regional intelligence introduction, two Desk cards, Issue One reading selection, Hamilton mapping preview and subscription entry.
- Directory and individual Desk pages: Western New York and Niagara–Brant, using the current names in the source site registry.
- Issue view: selected published reporting grouped as investment/industry, in-development and corridor news. Source links, original stages, notes and archival dates retained. Full original edition linked.
- Mapping introduction: Hamilton preparing for launch, no link to unpublished application. The synthetic local map remains at `web/map.html`; the editorial and map bundles are separate.
- Subscription selection and secure-link-request design: explicitly preview-only. No storage, requests or successful subscription claims.
- Approach and credits.

Hash routes allow a build preview without adding backend routing. A future launch should adopt the final public URL strategy separately. No public deployment workflow, settings, Kit API or production artifacts changed.

## Source provenance

Read-only source: `niagaraassembly/site` at `9522b3ebd3b4686fab99634bd0e710c883bd1b00`, cloned to `/workspace/site` for this assessment. It is not an application dependency and was not modified.

Editorial selection: `data/wny/issue-one.json`, Issue One published 2026-10-10, coverage 2026-09-28 through 2026-10-09. Nine selected stories are reproduced, with a link to the complete published edition. These are historical statements, not newly verified current project status. No contact lists, people registry or raw backend data is copied. No Niagara–Brant issue content is invented.

Two regional photographs reused from `assets/img/desks/` with original provenance in `assets/img/desks/credits.json`: Buffalo Grain Elevators (1), BriYYZ, CC BY-SA 2.0; Hamilton steel mills, THENEWMIKON8ER, CC BY 3.0. Source JPEGs retained; responsive display crops. Attribution, source links, licence links and archival context appear in the site credits. Photography illustrates regions, not the reported projects.

## Acceptance and evidence

- Frozen `npm ci` installation; no manifest or lockfile changes.
- Existing five fixture contract tests pass.
- Nine Chromium scenarios pass: five map scenarios plus four site scenarios covering reading/navigation/source details, unpublished mapping availability, preview-only subscriptions and mobile/keyboard navigation.
- Compiled preview smoke checks pass: home and issue reading, no map-engine requests from the editorial home, and the preserved map’s tile-ready state, selection and six-band dossier.
- Repository Python suite: 128 tests run, 17 skipped, no failures. Planning index: 89 rows, 71 distinct paths, 0 missing.
- Production multi-entry build passes. The existing MapLibre chunk-size warning remains confined to the mapping bundle; no production-scale performance claim.
- Desktop (1440 px) and mobile (390 px) screenshots inspected locally for home and issue layouts.
- No publication or real subscription connection tested or claimed. Firefox coverage remains unrun.

## Process insights for transfer

The frontend insights file does not yet exist. These unallocated findings are recorded here for the interim frontend report route; reserved HM-PI-0001 through HM-PI-0008 are not reused. Do not write them into Atlas sheet 19.

| date | tool_session | session_ref | jurisdiction | dataset_or_source | insight_type | finding | evidence | implication | report_worthy | linked_issue | status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-11-10 | codex | hm/desks-site-prototype | cross-cutting | niagaraassembly/site Desk registry | method | The source registry names the two Desks Western New York and Niagara–Brant. Only Western New York Issue One is registered there. | Source revision 9522b3e, data/desks.json and data/wny/issue-one.json read this session | Keep Desk presence independent of issue and mapping availability. | n | | actioned |
| 2026-11-10 | codex | hm/desks-site-prototype | cross-cutting | web multi-entry build | performance | A separate editorial entry avoids loading MapLibre for readers browsing Desks. | Vite production build emits separate site and map JS/CSS entries; browser checks pass | Preserve entry separation as the mapping application becomes available. | n | | actioned |

Suggested skill improvement: add editorial source/photograph provenance and independent Desk/map availability guidance to a future frontend skill. The existing parcel-frame skill is deliberately narrower than this task.

## Alternate: the regional edition and Reader

Follow-up direct assignment: build a second approach without replacing the first. Reader should cover Desks and HeavyMap material, default to news, remember a reader's place locally, and exclude Niagara Assembly's unrelated publications. A map strip should reveal the workspace while the site withdraws into a bottom bar.

Implementation: `web/alternate.html`, with its own module and styles. First design remains at `web/index.html`. The alternate is editorial-first, with a lead story, three shorter dispatches, a map strip, Reader entry and compact regional directory. No backlog reconciliation or subscription-backend work.

Reader investigation: read `niagaraassembly/site/assets/js/reader.js`, `assets/css/reader.css`, and its catalogue contract at source revision `9522b3e`. Existing patterns include lazy panel loading, publication filtering, previous/next, manual/elapsed-time read flags, namespaced browser storage, storage-failure fallback, source links and frozen Desk editions. The alternate adapts the reading patterns to a full workspace with material/region/search/unread filters; it does not copy the entire publication index, import arbitrary pages, or automatically mark an item read after a timer. Read status is explicit.

Catalogue: nine selected published Desk news records, plus two HeavyMap-authored documentation studies explicitly labelled preview, not published. Findings/editorials and the unmigrated Niagara–Brant corpus have empty states. Complete catalogue migration/build tooling remains unimplemented; do not describe this as the full published library.

Browser history: `heavymap-reader-v1` stores known catalogue IDs, bounded relative scroll position, explicit read status and filters. It never imports or overwrites `na-reader`, email, or subscription state. A returning homepage shows a resume link only when a valid last item exists. Forgetting history clears this key and returns to the edition; storage denial or malformed data does not block reading. State is browser-local, not account synchronization.

Map reveal: the map strip and header Mapping button instantiate the existing synthetic map only when requested. The editorial veneer moves down and a bottom dock provides Return to reading. Page position and focus restore; Escape also closes the preview. Reduced motion is respected. The live Hamilton utility is neither claimed published nor linked. A later production migration should replace the synthetic iframe only after the real destination is verified and authorized.

Validation: nine Node tests pass, including scope, storage validation/failure and combined filters. Five new Chromium scenarios cover catalogue filters and empty states, item/scroll/filter resume and scoped forgetting, search/unread/storage denial, synthetic map reveal/return, and mobile overflow/keyboard navigation. An initial mobile library-width overflow was corrected with a minimum-width constraint and the affected five scenarios rerun successfully. Original nine site/map browser scenarios also passed during this change. Production multi-entry build passes; the existing large map-engine bundle warning remains. Desktop/mobile home and Reader screenshots inspected locally.

Additional process insights for the interim frontend report route (IDs not allocated):

| date | tool_session | session_ref | jurisdiction | dataset_or_source | insight_type | finding | evidence | implication | report_worthy | linked_issue | status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-11-10 | codex | hm/desks-site-prototype | cross-cutting | site Reader and HeavyMap catalogue | method | The source Reader imports a site-wide publication catalogue; HeavyMap requires explicit catalogue inclusion to avoid importing unrelated Niagara Assembly publications. | site/assets/js/reader.js at 9522b3e inspected, HeavyMap catalogue scope tests and browser filters pass | Keep Desk and HeavyMap publication eligibility explicit when implementing the production catalogue builder. | n | | actioned |
| 2026-11-10 | codex | hm/desks-site-prototype | cross-cutting | HeavyMap Reader local state | method | Last-item and relative-scroll restore work with material/region filters, while forgetting clears only HeavyMap's storage key. | Chromium resume/scroll/filter test and preservation of a separate na-reader key pass | Treat browser-local reading state separately from subscriptions and any future account state. | n | | actioned |

## Page styles, review round one

Direct assignment: Morgen accepted the second homepage and related page styles, then authorized the proposed review rounds. This round implements regional Desks, an edition layout and standalone reading pages before any specification plan. No backend changes, publication, backlog reconciliation or production content migration.

Review entry: `web/alternate.html#/studies`, also linked as Page studies in the footer. Individual routes:

- `#/desks`: regional directory in the selected second style.
- `#/desks/western-new-york`: populated Desk, dated edition feature, three briefs, one-row edition archive, coverage and independent map availability.
- `#/desks/niagara-brant`: lighter Desk, no invented issue/date, link to the existing published Desk and a labelled Hamilton synthetic map-transition preview.
- `#/editions/western-new-york/issue-one`: a complete edition *layout*, using the already approved selection of nine historical Issue One briefs; explicitly not the entire original issue. Grouped sections, contents navigation and links to standalone briefs and Reader. The complete original remains linked.
- `#/read/IEVT-2026-000001` and the other included news IDs: individual brief pages with the source note once, separate source/edition dates, stage, source links, publication record, copy-link action and related reading.
- `#/read/hm-reading-the-evidence`: documentation study, numbered sections and on-page contents, with the same item available in Reader.
- `#/read/editorial-study`: clearly unpublished editorial sample to assess longer-form typography, pull quote, byline placement, contents and a closing note. No named author, publication date or correction history invented. Kept outside the published Reader catalogue.

The first homepage remains available for comparison. The second homepage now directs Desk links to dedicated Desk pages and headlines to their standalone briefs; explicit Reader controls remain. Reader's edition link returns to the second-style edition instead of the first design.

Review questions: Is the Desk front door sufficiently different from Reader's filtered library? Does an edition remain pleasant to read as a whole? Are source provenance and uncertainty prominent without dominating? Are headline scale, body text and image prominence comfortable on mobile?

Validation: nine Node tests and nineteen Chromium scenarios passed, including five new page-study scenarios. Views checked at 1440, 390 and 360 px for horizontal overflow and headings. Cross-page reading paths, region switch, edition and article section navigation, explicit preview/archival labels and copy-link behavior tested. Production build passes with only the existing map-engine chunk-size warning. Seven desktop and five mobile screenshots captured under `/tmp/heavymap-review-round1/`; screenshot references are task-local review evidence, not published URLs. Firefox remains unrun. No spec plan has been created.

Process insight for the interim frontend report route (ID unallocated): 2026-11-10, codex, hm/desks-site-prototype, cross-cutting, HeavyMap reading surfaces, method: dedicated Desk, edition and standalone brief routes can coexist with the scoped Reader without importing the first design's page chrome. Evidence: nineteen browser scenarios pass, including Desk→edition→brief→Reader→edition and mobile width checks. Implication: keep regional navigation, edition sequence and cross-publication filtering distinct when specifying the final information architecture. report_worthy=n, linked_issue blank, status=actioned.

## Lean second-round continuation and handoff

User authorized the second review round but explicitly requested **no extra testing**, noting about 16% weekly quota remaining and the need for a Claude handoff. Added round-two design-state routes for signup, proposed confirmation, preferences, leaving one Desk vs all Desk email, a map/reading layout specimen and availability comparison. Added an unverified mobile Reader library-collapse control. No subscription backend or publication changes.

No tests, builds, browser checks, screenshots, formatter or lint pass were run for these latest changes. Earlier passing results above must not be represented as validation of the new round-two tree. See `CLAUDE-HANDOFF.md` for the complete continuation context, routes, remaining limitations and instructions. No specification plan created.

## Country-theme direction, recorded after image study

Morgen retained the selected plain/base aesthetic. The Japanese-inspired image study is a reference for one optional future country theme in a growing set. A country-flag dropdown will select looks; show readable names alongside flags and always expose the two recent selections. USA and Canada are initial choices, with the American/base look as fallback. Unobtrusive regional inference is desired, but its technical signal is undecided and must not be presented as reliable location knowledge. Explicit choice takes priority. Full decision and unresolved first-visit/history details are in CLAUDE-HANDOFF.md. No theme code or testing added.
