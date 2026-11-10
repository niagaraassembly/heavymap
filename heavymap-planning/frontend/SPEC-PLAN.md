# HeavyMap frontend specification plan

Status: draft for Morgen's review. Authorized by “Write a spec plan?” in this session. Prepared 2026-11-10. This document plans the specifications; it does not finalize every proposed behaviour or authorize implementation, testing, migration, merge or publication.

Companion: [Claude handoff](CLAUDE-HANDOFF.md). Existing coordination: [working agreement](../WORKING-AGREEMENT.md). Preserve the user’s no-extra-testing/quota instruction until explicitly changed. Do not reconcile the dated backlog as part of this plan.

## 1. Outcome

Specify HeavyMap as the user-facing home for regional Desks, a unified Reader and a mapping workspace. Industrial Atlas remains the backend foundation. A region may have reporting before its mapping service is ready. HeavyMap must feel complete while those capabilities become available independently.

The selected second homepage and its related page studies are the visual starting point. Final specifications should clarify content, behaviour, interfaces and delivery without restarting aesthetic exploration.

## 2. Confirmed direction

- Retain the selected plain/base visual language: warm off-white, slate ink, restrained green/rust, serif headlines, precise small labels and geographic context.
- Retain the existing map, lenses and dossier work. The Desk pivot adds the surrounding product; it does not replace mapping.
- Start with Western New York and Niagara–Brant Desks. Hamilton is the first planned live mapping geography. No date or readiness is established by this plan.
- Reader is master access to eligible Desk and HeavyMap readable material. Default to news, with other material types available through filters.
- Exclude unrelated Niagara Assembly publications from the migrated library. Existing Desk material can be migrated deliberately.
- Use browser-local history to remember reading and offer a subtle resume cue. No account is required for this feature.
- Treat mapping as an equal partner. Use a map strip that can reveal the workspace while the site withdraws into a bottom bar, with a return to reading.
- Do not offer dead/unpublished application links. Reporting and mapping availability are independent.
- Keep the base appearance. Country-inspired themes are optional, including the Japanese-inspired study. Use a flag dropdown with accessible country names and always expose the two recent choices.
- USA and Canada are the initial theme choices; American/base is the fallback. Unobtrusive regional hints are desired; exact inference is unresolved. Explicit choice takes priority.
- Design first, then adapt the existing Kit/GitHub subscription approach. Readers must be able to follow or leave regional Desks independently; exact service semantics must be verified.

## 3. Specification package

Draft the following documents in dependency order. Names below are proposed deliverables, not files already written or new issue assignments. Keep shared terms and contracts consistent; do not create parallel backend schemas.

### A. Product structure and regional availability

Specify:

- Distinct roles of home, Desk directory, regional Desk, edition, individual reading page, Reader and map workspace.
- Navigation that preserves regional context without conflating theme country, Desk region, map geography or content language.
- A region/capability registry: stable region ID, display name, country/subdivision, coverage description, Desk relationship, eligible editions and independently available mapping destinations.
- How a Desk's coverage relates to one or more map geographies. Niagara–Brant contains Hamilton; it is not interchangeable with the Hamilton map extent.
- Availability and link eligibility. Separate unknown, not available, preparing and verified published capabilities; confirm final state vocabulary rather than assuming it is an accepted backend enum.
- First-visit, returning-reader, selected-region and map-not-yet-available home states.
- Final URL, breadcrumb and navigation policy, including not-found and unavailable routes. Current hashes are prototypes, not final canonical URL decisions.

Deliver: page/route inventory, navigation diagram, region/capability matrix and proposed canonical URL table. Identify which review-only links disappear from public navigation.

### B. Content model, provenance and migration scope

Specify:

- Stable IDs and relationships among Desk, edition, news item, finding, article, editorial and documentation. Resolve which are content types versus classifications or display labels.
- Eligibility for the HeavyMap catalogue: explicitly approved Desk material and HeavyMap publications. Do not import the source site's entire Reader index.
- Required and optional metadata: title, summary/body, content type, region(s), publisher/byline when known, edition membership, publication/update dates, source dates, stage, sources, corrections and publication status.
- Distinction between publication date, source/observation date and current project state. A historical source must not silently become a current claim.
- Preservation of source attribution, disagreement, unknown values, contract ceilings versus actual obligations and regional shares. Unknown is not zero.
- Preview/draft/publication eligibility. The sample editorial and guides do not become published merely because their layouts were approved.
- Edition ordering and complete-versus-selected reproduction; individual items must remain identifiable outside their edition.
- Content/photograph rights and attribution, source snapshots and editorial review responsibilities.
- A scoped migration manifest, per-item original URL, intended HeavyMap URL and redirect/cross-link decision. Retain original provenance.

Deliver: example records for one Desk, edition, news brief and documentation item; a migration eligibility table; metadata rules; and the proposed catalogue build interface. Do not populate missing production facts by invention.

### C. Reader and reading continuity

Specify:

- News-first initial state, material/region/search/read filters and their interaction.
- How direct item links interact with active filters, empty results and unpublished/removed items.
- Previous/next ordering, edition sequence versus filtered library sequence, and explicit read/unread controls.
- Mobile library collapse/expand, reading width, scroll containers, keyboard/focus behaviour and clear return paths.
- Meaning of “last read” versus “last opened”; avoid claiming completion from a visit.
- Whether standalone article/edition reading also updates the homepage cue, and how its reading position maps to Reader's position.
- Versioned browser-local state, known-ID validation, relative progress, filter persistence, storage denial/quota/malformed/stale data, multi-tab behaviour and bounded history.
- Forget-history scope. It must not erase theme choices or subscription/account data as a side effect.
- What happens when saved content changes, is removed, or is no longer eligible.

Deliver: Reader state table, navigation/restore examples, storage schema proposal, and mobile interaction annotations. The current Reader implementation is a reference, not a complete cross-surface contract.

### D. Shared visual system and country themes

Specify:

- Base tokens: typography, colour, spacing, page widths, rules, controls, source labels, imagery, map chrome and responsive behaviour. Confirm final treatment of the inherited half-dot; it is not an established logo.
- Common shell across Desk, edition, article, Reader, subscription screens and map dock. Consolidate the older map header and new dock deliberately.
- Theme tokens versus invariant product structure. A theme must not alter facts, subscriptions, language, coverage, availability or evidence semantics.
- USA/base, Canada and Japan as initial design subjects; Canada's distinct appearance is not designed yet. A growing theme registry must allow future additions without route/content changes.
- Flag-and-name selector; accessible labels and an alternative to flag-only identification.
- Two recent choices, ordering, uniqueness, first-visit seeding and whether an inferred default counts as a choice.
- Explicit saved choice before any automatic suggestion. Specify the allowable regional hint, its uncertainty, fallback and failure handling.
- No precise-location request, tracking or third-party geolocation service by assumption. Any additional signal requires an explicit design/technical decision.
- Separate versioned theme history from reading state; avoid a distracting first-paint theme change where practical.
- Contrast, readable secondary labels, target sizes, reduced motion and reliable non-colour cues across themes.

Deliver: token map, selector states, theme/history precedence table and representative home/reading/map-dock comparisons. Do not replace the approved base with the Japan image study.

### E. Subscriptions and preference experience

After focused inspection of the existing niagaraassembly/site Kit/GitHub implementation, specify:

- Identity of each regional subscription and its relationship to provider forms/tags/segments or other confirmed primitives.
- New signup, existing subscriber, choosing multiple Desks, pending confirmation, confirmed, duplicate/invalid input, delivery failure and preference-entry states.
- Secure preference access, invalid/expired/reused links and what subscriber information the site may display.
- Save changes, leave one Desk, and leave all Desk email. Determine whether a Kit global unsubscribe affects other Niagara Assembly mail; do not promise independence without evidence.
- Whether a confirmation step is required by the existing setup and intended policy. Current confirmation pages illustrate a proposal, not a verified provider configuration.
- Preservation of existing subscriber choices/consent, migration between brands and handling pre-existing global suppressions.
- Idempotency, conflicting or repeated requests, failure/retry and truthful confirmation from actual resulting state.
- Credential boundaries, subscriber privacy, workflow visibility and prevention of emails/tokens appearing in public repos, browser bundles, logs or URLs.
- Browser-local theme/reading history remains independent from subscription state.

Deliver: confirmed provider/workflow capability inventory, user-flow/state diagrams, frontend/backend request/response proposals and migration requirements. Declare missing credentials by requirement only; never include values. No external writes or subscription mutations from merely drafting this specification.

### F. Mapping shell and reading integration

Specify:

- Home map strip, published-entry eligibility, preparatory introduction, unavailable geography and archive-only states.
- Reveal/return behaviour, animation and reduced-motion alternative; preserve page/Reader context and focus.
- Bottom-bar identity, active map geography, region switching, Reader access and return control.
- One selected pattern for reading alongside mapping: drawer, split pane or Reader overlay. Explain its desktop/mobile behaviour and effect on map viewport/camera padding.
- Distinguish geographic association from user-selected juxtaposition. Never imply an article refers to a selected parcel without an accepted relationship.
- Existing lens/dossier interaction and routing coexistence; avoid duplicating navigation and branding around the preserved application.
- Eligible screened artifact, producer revision, schema, jurisdiction, verified hashes and allowed display fields. Extend existing dossier/manifest/identifier contracts rather than inventing substitutes.
- Loading, missing/incompatible artifacts, failed tiles, retry and unsupported capability states; failed network loading must not become an evidence refusal or “nothing here.”
- Define startup/per-click budgets using accepted repository ceilings and resolve the outstanding meaning of startup payload. No whole-city performance claim from synthetic fixtures.

Deliver: shell/dock state diagram, one annotated desktop/mobile integration pattern and a producer/consumer contract checklist. Do not implement the paused identifier rename or execute the repo split.

### G. Delivery, accessibility and acceptance

Specify:

- Editorial/catalogue build, map artifact pinning and deliberate publishing boundaries. Existing source/hosting configuration needs reinspection before merge/publication; dated observations are not current proof.
- Preview versus public environments, content visibility, original-site redirects and operational rollback.
- Accessibility acceptance: headings/landmarks, navigation, keyboard and focus, reading order, contrast, labels, motion, scrolling and assistive-technology behaviour.
- Browser/device and failure-state coverage proportional to the release scope.
- Functional acceptance tied to the chosen specifications, not broad repetitive suites. Keep content, frontend fixture, real-artifact integration and publication approval claims separate.
- Recovery and handoff: current working-tree preservation, reproducible installation/startup instructions and durable design evidence.

Deliver: release-readiness checklist and a future validation plan. **Do not execute that plan now**; user's no-extra-testing instruction remains active.

## 4. Decision register

These are unresolved or proposed details, not blockers to drafting the package:

| Decision | Already established | Still to settle |
| --- | --- | --- |
| Base aesthetic | Selected second design retained | Final logo/half-dot, fine typography and metadata sizes |
| Country themes | Optional flags; USA/Canada initial choices; USA fallback; Japan candidate; two recent selections | Canadian treatment, regional hint, distinct/recent ordering and first-visit seed semantics |
| Reader | Scoped library, news first, local resume | Type taxonomy, ordering, cross-surface progress and “read” semantics |
| Navigation | Desks, Reader and mapping have distinct roles | Canonical paths, redirects and final region-context controls |
| Map | Equal partner; strip reveal and bottom bar | Reading panel pattern, dock controls and real launch eligibility |
| Subscriptions | Multiple regional choices; per-Desk and all-email intent | Actual Kit primitives, suppression scope, confirmation and secure access |
| Content | Eligible Desk/HeavyMap material only | Full migration manifest, metadata and editorial approval |
| Performance | Accepted repository budgets apply | Startup scope and evidence for production acceptance |

Recommended defaults to present for acceptance: two most recent **distinct explicit** themes; USA/Canada as first-visit shortcuts; browser regional preference as a hint rather than location knowledge; explicit read marking; region availability driven by verified capability records; and independent content/Desk/theme/subscription identities. These are recommendations, not additional user decisions.

## 5. Drafting and implementation order

1. **Draft A and B together:** establish route/content/region terms and migration scope. Resolve only the questions needed for coherent examples.
2. **Draft C and D:** Reader, continuity, shared shell and themes using those terms. Retain approved page studies as visual references.
3. **Inspect existing Kit/GitHub mechanics read-only and draft E:** record what actually works before choosing an adaptation.
4. **Draft F against current Atlas interfaces:** settle one map/reading interaction and the real artifact boundary without changing backend contracts implicitly.
5. **Draft G and consolidate:** list remaining decisions, trace requirements to acceptance and obtain Morgen's review.
6. **After specification acceptance and a bounded assignment:** implement content/shell foundation, Reader/navigation, themes, provider-backed subscriptions and eligible mapping integration in reviewable increments. Exact task order should follow dependencies and urgency; this is not a replacement task-status board.
7. **Only when authorized:** perform the agreed focused validation, then obtain the existing per-jurisdiction/publication approvals before activation.

Existing prototype code is reusable evidence and a possible starting point. Do not assume it is a production architecture or rewrite it wholesale without a reason supported by the accepted specifications.

## 6. Completion criteria for the specification package

The package is ready for implementation planning when:

- Requirements distinguish confirmed direction, accepted follow-up decisions and remaining proposals.
- Every visible surface and transition has a named purpose and a defined source of truth.
- Content eligibility, regional availability and provider/artifact interfaces are explicit.
- Cross-surface reading and local theme/history behaviour are unambiguous, including reset/failure cases.
- Each acceptance criterion can be assessed without claiming unrun checks or confusing preview with publication.
- Existing contracts, source rights, subscriber protections and deployment gates remain intact.
- Morgen has reviewed unresolved product decisions; implementation scope is then assigned separately.

## 7. Handoff and present limits

Use CLAUDE-HANDOFF.md for file/route inventory, source provenance, uncommitted working-tree preservation, historical validation and current incomplete elements. There are no production Kit connections, theme system, real map/Reader integration or new publication changes in this plan. No code changes or tests/builds were performed to write it.
