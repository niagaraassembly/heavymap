# Spec B: content model, provenance and migration scope

Status: **draft for Morgen's review**, 2026-11-10. Local issue HM-004. Written against branch `heavymap-mainsite-v1` (commit 49957f8).
Depends on: [SPEC-PLAN.md](../SPEC-PLAN.md) section 3B; [Spec A](A-product-structure.md); the frontend v1 decisions recorded 2026-11-10 (D3, D9 to D11).
Authoritative constraints: [HARD-RULES](../../../docs/for-agents/HARD-RULES.md), in particular rules 2, 8 and 12, and [publish-visibility.md](../../../docs/architecture/publish-visibility.md).

Labels used in this document:
- **Decided**: Morgen chose it.
- **Proposed**: this draft recommends it and it needs acceptance.
- **Open**: deliberately left unresolved.

All values in examples come from the frozen WNY Issue One data in `web/src/editorial/issue-one.json` (source commit `9522b3e`) or are marked as placeholders. None are invented.

## 1. Entities

```
Region ──1:1 (v1)── Desk ──1:n── Edition ──n:m── Item ──1:n── SourceRef
   │                                               │
   └──1:n── MapGeography            Item ──n:m── Region  (an item may concern several)
                                    Item ──0:n── Correction
Asset (image) ──n:m── Desk | Edition | Item, with Credit
```

| Entity | Defined in | Identity |
| --- | --- | --- |
| Region, Desk, MapGeography | Spec A section 3; `content/regions.json` | region ID, e.g. `us-ny-western-new-york`; geography spine prefix, e.g. `hm:ca:on:hamilton` |
| Edition | here, section 3 | `<desk-slug>/<edition-slug>`, e.g. `western-new-york/issue-one` |
| Item | here, section 2 | item ID (section 2.1) |
| SourceRef | here, section 4 | `article_id` from the research system, e.g. `ART-2026-000027`, plus URL |
| Asset | here, section 6 | file path plus a credit record |

## 2. Items

### 2.1 Item types and IDs

Four **content types** (D3). They are types, not display labels: each has a different required field set. Labels are presentation and are defined once in a label table.

| Type key | Label | Author | ID form | Example |
| --- | --- | --- | --- | --- |
| `news` | News | Desk | the research system's event ID, kept unchanged | `IEVT-2026-000001` |
| `finding` | Finding | HeavyMap | **Proposed:** `HMF-YYYY-NNNNNN` | none exist yet |
| `documentation` | Documentation | HeavyMap | lower-case slug | `reading-the-evidence` |
| `editorial` | Editorial | named author or HeavyMap | **Proposed:** `HME-YYYY-NNNNNN` | none published |

Rules:
1. **Type keys are singular.** The prototype mixes `news` and `documentation` with `findings` and `editorials` (`reader-catalog.js` and `reader-state.js`). Implementation must normalise them, and the saved-state migration in spec C must map the old filter values across.
2. **IDs are permanent and never reused**, the same principle as ADR 0003. A withdrawn item keeps its ID and gets a tombstone (spec A section 4.4).
3. **News IDs come from upstream.** HeavyMap does not mint them, so a Desk item and its research record stay joinable.
4. **Documentation slugs lose the prototype's `hm-` prefix.** `hm-reading-the-evidence` becomes `reading-the-evidence`, giving `/read/reading-the-evidence/`. The prototype IDs were never published, so no redirect is needed. Spec C's state migration drops them as unknown IDs. *(Proposed.)*
5. **No classification axis doubles as a type.** "Explainer", "guide" and "analysis" are not types. If they're needed later, they become an optional `tags` list.

### 2.2 Common fields (every type)

| Field | Required | Meaning |
| --- | --- | --- |
| `id` | yes | section 2.1 |
| `type` | yes | `news`, `finding`, `documentation` or `editorial` |
| `title` | yes | headline as published |
| `summary` | yes | one to three sentences; for news this is the Desk note |
| `body` | type-dependent | structured sections (`heading` and `text`) or Markdown; news briefs may have none |
| `regions` | yes | list of region IDs, or `["heavymap"]` for region-independent HeavyMap material |
| `publisher` | yes | `desk:<region-id>` or `heavymap` |
| `byline` | no | named author(s) **only when published with one**; never inferred |
| `status` | yes | publication status (section 5) |
| `published_on` | when published | date HeavyMap or the original Desk first published it |
| `updated_on` | no | date of the last substantive change; must have a matching `corrections` entry or `change_note` |
| `editions` | no | list of edition keys this item appears in |
| `sources` | news, finding: yes | list of SourceRef (section 4) |
| `corrections` | no | list of `{ date, text }`, append-only |
| `provenance` | migrated items: yes | section 8 |
| `assets` | no | asset IDs (section 6) |

### 2.3 Type-specific fields

**`news`**, taken from the existing Desk item shape in `issue-one.json`:

| Field | Required | Values / meaning |
| --- | --- | --- |
| `reported_on` | yes | date of the latest source used. This is `item.date` in the frozen data. It is **not** the publication date and **not** a statement about current project state. |
| `place` | yes, or `null` | place as reported, e.g. `Peabody Street, Buffalo`, `Rochester (buyer HQ)`. Unknown stays `null` (rule 8). |
| `stage` | yes | vocabulary owned by the research system and consumed as-is. Values seen: `intent`, `announced`, `application`, `approved_plan`, `award`, `completed`. |
| `lane` | yes | research-system vocabulary, consumed as-is. Values seen: `production`, `developing`, `corridor`. |

HeavyMap **does not redefine** `stage` or `lane`. Their authoritative definitions belong to the MAKE research system. Display labels for them are a frontend table. *Open (B-Q4):* where the authoritative vocabulary file lives, so the build can validate against it instead of against values seen.

**Upstream structured fields.** The full source record (`niagaraassembly/site` `data/wny/issue-one.json` at `9522b3e`, checked 2026-11-10) carries more than the prototype's frozen copy. *Proposed:* import these as upstream-owned, read-only fields and display them through label tables. HeavyMap does not edit them.

| Upstream field | Imported as | Values seen / use |
| --- | --- | --- |
| `type` | `event_type` (renamed, to avoid clashing with the item `type`) | `acquisition`, `facility_closure`, `facility_expansion`, `grant_or_incentive`, `major_contract`, `other_material_update` |
| `amount`, `amount_type`, `ceiling_amount`, `regional_amount`, `currency` | `money` group | `amount_type`: `award`, `grant`, `investment`, `obligated`, `proposed`, `transaction`. `null` stays `null`. A ceiling is never shown as spending. |
| `jobs_added`, `jobs_lost` | `jobs` group | `null` is unknown, not zero |
| `flags` | `flags` | e.g. `ceiling_not_obligation`, `conflict:<field>`, `gap:<field>`, `secondary_source`, `company_reported`, `identity_unresolved`, `not_wny_production`, `research_only`. These drive the source-aware labels. |
| `conflicts` | `conflicts` | per-field competing values with their source. Shown, never resolved by HeavyMap. |
| `stage_history` | `stage_history` | dated stages with source URL. Each entry is historical. |
| `county`, `districts`, `lng` (and any coordinates) | not imported in v1 | geographic association belongs to spec F; no map pins from news in v1 |
| `entity_id`, `entity_name` | `entity` | company or organisation reference |
| `people` (top-level table) | **not imported** | see B-Q7 |
| `publish_status`, `review_state` | checked at migration | only `approved`/`approved` items are eligible |

**`finding`**: a HeavyMap evidence reading from mapping work.

| Field | Required | Meaning |
| --- | --- | --- |
| `geographies` | yes | map geography IDs |
| `parcels` | no | HeavyMap spine keys (`hm:ca:on:hamilton:parcel:<ULID>`) that the finding **explicitly concerns**. This is the only accepted item-to-parcel relationship. Showing an item next to a parcel without it is juxtaposition (spec F). |
| `artifact` | yes | the published map artifact revision the finding was read from: producer revision and manifest hash |
| `claims` | yes | statements, each tied to a source or artifact field, following `claim-refusal-contract.md` |

Findings must obey:
- **Rule 2:** no identifying fields.
- **Rule 12:** no unsupported vacancy claims; source classes are quoted and attributed.
- **The beta gate:** a finding about a geography can't be `published` before that geography is.

**`documentation`**: `body` is required, and `updated_on` is strongly recommended because docs change.

**`editorial`**:
- `body` is required.
- `byline` is required: a named person or "HeavyMap".
- `editorial_note` is optional and states its relationship to the news it discusses.
- Editorials are always labelled as opinion or analysis wherever they are shown.

## 3. Editions

| Field | Required | Meaning |
| --- | --- | --- |
| `key` | yes | `<desk-slug>/<edition-slug>` |
| `desk` | yes | region ID |
| `title` | yes | e.g. `Issue One` |
| `published_on` | yes | e.g. `2026-10-10` |
| `coverage` | yes | `{ from, to }`, e.g. 2026-09-28 to 2026-10-09 |
| `summary` | yes | edition summary as published |
| `sections` | yes | ordered `{ key, heading, items: [item IDs] }` |
| `complete` | yes | `true` only when **every** item of the original edition is migrated. Otherwise `false`, and the page says it is a partial reproduction and links to the original. |
| `original_url` | migrated: yes | e.g. `https://niagaraassembly.com/desks/us/ny/western-new-york/issue/one/` |
| `status` | yes | publication status (section 5) |

Rules:
- **Edition order is editorial.** The Reader's order (spec C) is separate and must not reorder an edition page.
- **An item keeps its identity outside its edition.** It must read correctly on its own page without the edition's introduction.

## 4. Sources

A SourceRef records the source as cited at publication time:

| Field | Required | Example |
| --- | --- | --- |
| `article_id` | yes when the research system has one | `ART-2026-000027` |
| `title` | yes | as published by the source |
| `publisher` | yes | `Governor Kathy Hochul newsroom` |
| `url` | yes | original URL |
| `kind` | yes | `primary`, `company` or `secondary` (values seen; research-system vocabulary) |
| `published_on` | no | the source's own date, when known |
| `snapshot` | no | archived copy reference; **Open (B-Q5)** |

Rules:
1. **Keep disagreement visible.** When sources differ (spokespeople, figures, names), the item's summary or body says so. The model does not collapse sources into one value.
2. **Money stays typed.** Investment, acquisition price, grant, tax credit and contract ceiling are different things. A ceiling isn't spending. An unknown local share stays unknown. The upstream `money` group already types these (section 2.3), so HeavyMap displays them as typed and never sums across `amount_type`s.
3. **Historical, not current.** A source's date describes when it was true. Pages show `reported_on` and the source dates. The UI never phrases a news item's `stage` as current status ("is under construction") unless a later item says so.

## 5. Publication status

| Status | Built into | Visible in Reader | Indexable |
| --- | --- | --- | --- |
| `draft` | nowhere | no | no |
| `preview` | preview builds only | preview only, labelled "Preview" | no (`noindex`) |
| `published` | public and preview builds | yes | yes |
| `retired` | public: tombstone only | no | no |

Rules:
1. **Approving a layout doesn't publish its content.** The two documentation samples stay `preview` until the text itself is approved. The editorial sample (`editorial-study`) stays `draft` and is not catalogued at all, as today.
2. **Separate from dataset `publish_visibility`.** That backend setting controls which **data fields** ship. Item status controls whether **an editorial item** ships. A finding needs both: `published` status, and only fields that `publish_visibility` and screening allow.
3. **Moving to `published` is a human approval.** Agents may prepare items, not publish them (HARD-RULES 7).

## 6. Assets and credits

| Field | Required | Example (from SITE-DESIGN-PREVIEW.md) |
| --- | --- | --- |
| `id` | yes | `buffalo-grain-elevators` |
| `file` | yes | `web/public/editorial/buffalo-grain-elevators.jpg` |
| `title` / `alt` | yes | descriptive alt text |
| `creator` | yes | `BriYYZ` |
| `licence` | yes | `CC BY-SA 2.0`, with a licence URL |
| `source_url` | yes | original page |
| `role` | yes | `regional-illustration`; it illustrates the region, **not** the reported project |

The second current asset is `hamilton-steel-mills` (THENEWMIKON8ER, CC BY 3.0).

The build fails on any asset without a complete credit, and `/about/credits/` is generated from these records. Original provenance stays in the source site's `assets/img/desks/credits.json`.

## 7. Catalogue build interface (proposed)

**Inputs**, in the heavymap frontend repo, as text, reviewed by PR:

```
content/
  regions.json                  spec A §3.2
  editions/<desk>/<edition>.json
  items/<type>/<id>.json        one file per item (Markdown body allowed via `body_md`)
  assets/credits.json
  vocab/labels.json             display labels for type, stage, lane and source kind
```

**Build steps** (`npm run build:content`; Node, no new dependencies unless agreed):
1. Validate every file against a JSON Schema per entity: required fields, ID forms, known region IDs, known edition references and known vocabulary values.
2. Check referential integrity: edition items exist; item `editions` match edition sections; assets credited.
3. Filter by environment: **public** = `published` plus `retired` tombstones; **preview** = also `preview`.
4. Emit:
   - `catalogue.json`: the Reader index, with summary fields only and bodies loaded per item.
   - The static pages for spec A section 5.1.
   - `known-ids.json`: every item ID ever published, including retired ones, for spec C's state validation.
5. Run the link check (spec A section 6).

**Out:** no crawling or import from niagaraassembly.com at build time. Migration (section 8) is a one-off, reviewed conversion into `content/`.

*Open (B-Q1):* whether `content/` lives in the heavymap frontend repo (proposed) or comes from MAKE as a pinned export.

## 8. Migration scope

### 8.1 Eligibility

| Material | Eligible | Notes |
| --- | --- | --- |
| WNY Desk editions and their items | **yes** | starting with Issue One |
| Niagara–Brant Desk editions | yes, when they exist | none exist; never invent |
| HeavyMap documentation drafts (project scope list) | yes, as `preview` until approved | "What HeavyMap is", methodology, dossier guide, CA/US glossary (`docs/for-humans/GLOSSARY.md` exists), FAQ, licensing, coverage and limitations |
| Other Niagara Assembly publications (magazines, unrelated Reader items) | **no** | excluded by direction |
| Desk photos | yes, with credits | two current assets |

### 8.2 Provenance on migrated records

```json
"provenance": {
  "original_url": "https://niagaraassembly.com/desks/us/ny/western-new-york/issue/one/",
  "source_repo": "niagaraassembly/site",
  "source_commit": "9522b3ebd3b4686fab99634bd0e710c883bd1b00",
  "source_path": "data/wny/issue-one.json",
  "migrated_on": "YYYY-MM-DD"
}
```

### 8.3 Migration manifest

The manifest is one CSV with one row per migrated record: `kind, id, original_url, heavymap_url, source_commit, source_path, complete, redirect_decision, reviewed_by`.

Current known state (checked 2026-11-10 against `niagaraassembly/site` at `9522b3e`):
- **Issue One has 10 items**, `IEVT-2026-000001` to `IEVT-2026-000010`, all `publish_status: approved`. Its upstream issue ID is `WNY-2026-001`; keep it as the edition's `upstream_id`.
- The prototype includes 9 and **omits `IEVT-2026-000009`** (a research award to a named individual, flagged `research_only` and `not_wny_production`). The reason for leaving it out isn't recorded. See B-Q7.
- `redirect_decision` stays `open` until A-Q3 is answered.

## 9. Example records

**News**, built from `issue-one.json` as frozen:

```json
{
  "id": "IEVT-2026-000001",
  "type": "news",
  "title": "Solstice to invest $49M expanding Buffalo R&D center",
  "summary": "Solstice will invest $49M to expand its Buffalo R&D center, adding 12 jobs, with up to $1.4M in state Excelsior tax credits. The governor's and company's announcements quote different spokespeople and name forms.",
  "regions": ["us-ny-western-new-york"],
  "publisher": "desk:us-ny-western-new-york",
  "status": "published",
  "published_on": "2026-10-10",
  "reported_on": "2026-10-09",
  "place": "Peabody Street, Buffalo",
  "stage": "announced",
  "lane": "production",
  "editions": ["western-new-york/issue-one"],
  "sources": [
    { "article_id": "ART-2026-000027", "title": "Governor Hochul Announces Solstice Advanced Materials to Expand in Buffalo", "publisher": "Governor Kathy Hochul newsroom", "url": "https://www.governor.ny.gov/news/governor-hochul-announces-solstice-advanced-materials-expand-buffalo", "kind": "primary" },
    { "article_id": "ART-2026-000028", "title": "Solstice Announces $49 Million Investment to Expand Research and Development Capabilities in Buffalo, New York", "publisher": "PR Newswire", "url": "https://finance.yahoo.com/technology/articles/solstice-announces-49-million-investment-153200194.html", "kind": "company" }
  ],
  "provenance": { "original_url": "https://niagaraassembly.com/desks/us/ny/western-new-york/issue/one/", "source_repo": "niagaraassembly/site", "source_commit": "9522b3ebd3b4686fab99634bd0e710c883bd1b00", "source_path": "data/wny/issue-one.json", "migrated_on": null }
}
```

`published_on` is the edition's date. Whether the brief appeared earlier anywhere else is unknown. `migrated_on` stays `null` until a migration is actually run.

**Edition:**

```json
{
  "key": "western-new-york/issue-one",
  "desk": "us-ny-western-new-york",
  "title": "Issue One",
  "published_on": "2026-10-10",
  "coverage": { "from": "2026-09-28", "to": "2026-10-09" },
  "summary": "Issue One covers Western New York investment and industry news from Sept. 28 to Oct. 9, 2026. …",
  "sections": [ { "key": "<from original>", "heading": "<from original>", "items": ["IEVT-2026-000001", "…"] } ],
  "complete": false,
  "original_url": "https://niagaraassembly.com/desks/us/ny/western-new-york/issue/one/",
  "status": "published"
}
```

Section keys and headings must be taken from the original edition during migration. They are placeholders here.

**Documentation:**

```json
{
  "id": "reading-the-evidence",
  "type": "documentation",
  "title": "Reading the evidence",
  "summary": "A short guide to source labels, project stages and the questions that remain open.",
  "regions": ["heavymap"],
  "publisher": "heavymap",
  "status": "preview",
  "body": [ { "heading": "An announcement is a stage, not an outcome.", "text": "…" } ]
}
```

## 10. Open questions for Morgen

| ID | Question | Proposed answer |
| --- | --- | --- |
| B-Q1 | Where do `content/` files live? | heavymap frontend repo, reviewed by PR |
| B-Q2 | Finding and editorial ID forms | `HMF-YYYY-NNNNNN` and `HME-YYYY-NNNNNN`; documentation uses slugs |
| B-Q3 | Should news briefs carry a byline? | No byline unless the original published one; the publisher is the Desk |
| B-Q4 | Where is the authoritative `stage` / `lane` / source `kind` vocabulary? | Point the build at the MAKE research-system definition; ask MAKE's owner |
| B-Q5 | Should sources be archived (snapshots) at publication? | Desirable; defer to after v1 unless the research system already stores them |
| B-Q6 | Should Issue One be migrated in full before launch (`complete: true`), or launched as the nine selected items? | Migrate in full; partial editions confuse redirects |
| B-Q7 | Is `IEVT-2026-000009` (a named researcher's grant) eligible, and should the upstream `people` table ever be imported? HARD-RULES 2 screens "personal names on grant or registry tables"; this is published editorial text, not a data table, but it is close to that line. | Include the item as published text; never import `people` as structured data; Morgen to confirm |
