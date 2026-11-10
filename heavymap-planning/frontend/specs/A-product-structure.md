# Spec A: product structure and regional availability

Status: **draft for Morgen's review**, 2026-11-10. Local issue HM-003. Written against branch `heavymap-mainsite-v1` (commit 49957f8).
Depends on: [SPEC-PLAN.md](../SPEC-PLAN.md) section 3A, and the frontend v1 decisions recorded 2026-11-10 (`~/inbox/projects/heavymap/decisions/2026-11-10-frontend-v1-decisions.md`, copied into section 1 below).
Companion: [Spec B: content model](B-content-model.md). Spec B defines the terms used here (Desk, edition, item, region, geography).

Labels used in this document:
- **Decided**: Morgen chose it.
- **Proposed**: this draft recommends it and it needs acceptance.
- **Open**: deliberately left unresolved.

## 1. Decisions this spec builds on

| # | Decided (2026-11-10) |
| --- | --- |
| D1 | Clean paths, prebuilt as static pages. Hash routes are prototype-only. |
| D2 | The public name of a regional coverage unit is **Desk**. |
| D3 | Reader includes news, findings, documentation and editorials. News is the default view. |
| D4 | Reading alongside the map: split pane on desktop, bottom sheet on mobile (details in spec F). |
| D10 | `/read/<id>` is the canonical URL of every readable item. |
| D11 | One browser-local reading history covers every reading surface (details in spec C). |

From the earlier direction:
- Mapping is an equal partner to the Desks.
- Reporting and mapping availability are independent.
- Never offer dead or unpublished links.
- Theme country, Desk region, map geography and content language are four separate things.

## 2. Surfaces and their roles

Every public surface has one job and one source of truth.

| Surface | Job | Source of truth | Prototype reference |
| --- | --- | --- | --- |
| Home | Orients the visitor; leads with the latest news; offers a resume cue, the map strip and both Desks. | Catalogue + region registry + local history | `alternate.html#/` |
| Desk directory | Lists every Desk with a short coverage description and current capabilities. | Region registry | `#/desks` |
| Desk page | One region: latest edition, archive, coverage statement, its mapping status, follow/subscribe entry. | Region registry + editions | `#/desks/western-new-york` |
| Edition page | One dated newsletter issue, reproduced as a grouped list that links to its items. Not the canonical home of an item (D10). | Edition record | `#/editions/western-new-york/issue-one` |
| Item page | Canonical page for a news brief, finding, documentation piece or editorial. Shareable and indexable. | Item record | `#/read/IEVT-2026-000001` |
| Reader | A browsing workspace over the whole eligible library: filters, search, read state, resume. Opens items in a pane; doesn't own them. | Catalogue + local history | `#/reader` |
| Map workspace | Parcels, lenses and dossiers for one published geography. The site shrinks into the bottom dock. | Published map artifact (spec F) | `map.html`, iframe reveal |
| Subscribe and preferences | Follow or leave Desks by email. | Email provider (spec E) | round-two studies, illustrative only |
| About pages | What HeavyMap is, methodology, credits, licensing, coverage and limitations. | Documentation items + credits file | first design's credits view |
| Not found / unavailable | Honest dead end with a way back. | none | missing (falls back to home today) |

Rules:
1. **An edition never copies item text as a separate source.** It renders each item from the item record and links to `/read/<id>`. This keeps one version of every brief and one reading position (D10, D11).
2. **The Reader is a view, not a container.** Any item it shows also exists at `/read/<id>`. The Reader's address bar shows Reader state (section 5.3), and each item it displays carries a visible "permalink" to the canonical page.
3. **Documentation is content.** The public doc drafts in the project scope become documentation items with canonical `/read/<id>` pages: "What HeavyMap is", methodology, a guide to the parcel dossier, the CA/US glossary, FAQ, data licensing, and coverage and limitations. *Proposed:* `/about/` is a short hand-written index page that links to them, so About doesn't become a parallel document set.

## 3. Regions, Desks and geographies

### 3.1 Three separate concepts

- **Region**: a named area HeavyMap reports on. It has a country and subdivision. Example: Western New York (US, NY).
- **Desk**: the editorial unit that covers one region and publishes editions and items about it. v1 has exactly one Desk per region, but the two stay separate concepts so that one never has to be renamed as the other.
- **Map geography**: an extent covered by a published map artifact, usually one jurisdiction. Example: City of Hamilton, `hm:ca:on:hamilton`, matching the spine-key prefix in `parcel-identity-spine.md`.

A region **contains** zero or more map geographies. Niagara–Brant contains Hamilton, but the Hamilton map is not "the Niagara–Brant map" and must never be labelled as covering Niagara–Brant.

Theme country (spec D) is none of these. A Canadian theme on a Western New York page is valid and changes nothing about coverage.

### 3.2 Region registry (proposed shape)

One hand-maintained file, `content/regions.json`, read by the build (spec B section 7). Desk IDs stay identical to the source site (`data/desks.json`), so migration and redirects map one to one.

```json
{
  "regions": [
    {
      "id": "us-ny-western-new-york",
      "slug": "western-new-york",
      "name": "Western New York",
      "country": "US",
      "subdivision": "US-NY",
      "coverage": "Reviewed news on investment, facilities, jobs and new ventures from the Niagara River to Syracuse.",
      "desk": { "status": "published", "since": "2026-10-10" },
      "geographies": []
    },
    {
      "id": "ca-on-niagara-brant",
      "slug": "niagara-brant",
      "name": "Niagara–Brant",
      "country": "CA",
      "subdivision": "CA-ON",
      "coverage": "Industrial economies across the Niagara Peninsula, Hamilton and Brantford.",
      "desk": { "status": "preparing", "since": null },
      "geographies": [
        { "id": "hm:ca:on:hamilton", "slug": "hamilton", "name": "City of Hamilton", "map": { "status": "preparing" } }
      ]
    }
  ]
}
```

The coverage sentences are copied from the source site's `desks.json`.

Niagara–Brant `desk.status` is shown as `preparing` because the source site lists the Desk with `data: null` and no editions. Confirm whether it counts as published, since its Desk page exists live on niagaraassembly.com. (**Open**, see A-Q2.)

### 3.3 Capability states (proposed vocabulary)

Each Desk and each map geography has its own status. This is a **frontend display vocabulary**. It is not the backend `publish_visibility` enum and not the beta-gate stages, though it is derived from them.

| State | Meaning | Public site shows | Links offered |
| --- | --- | --- | --- |
| `unknown` | No record. Treated as `none` and flagged by the build. | nothing | none |
| `none` | Not planned or not started. | nothing, or "not covered" in the directory | none |
| `preparing` | Work under way; no public output. | a plain "in preparation" note without dates | none to the capability itself |
| `preview` | Exists in preview builds only. | **only in preview builds** | preview links in preview builds only |
| `published` | Live and approved. | full entry | yes |
| `retired` | Was published, now withdrawn. | tombstone with explanation | archive only |

Rules:
1. **A map geography becomes `published` only after the per-jurisdiction beta gate's Stage B sign-off** (`BETA-GATE-HAMILTON.md` section 1; Morgen signs off on NA-269). The frontend never infers readiness from an artifact simply existing.
2. **No dates for `preparing`.** The "within a week" Hamilton expectation stays out of public copy (CLAUDE-HANDOFF).
3. **Desk and map statuses never imply each other.** A `published` Desk with `preparing` geographies is the normal case.
4. The build fails if a public page links to a capability that isn't `published` (section 6).

### 3.4 Matrix at v1 start (as known 2026-11-10)

| Region | Desk | Editions | Map geographies |
| --- | --- | --- | --- |
| Western New York | published (Issue One, 2026-10-10) | 1 known | none planned |
| Niagara–Brant | preparing (A-Q2) | 0 | Hamilton: preparing |

This matrix records known facts only. It makes no readiness claim.

## 4. Page states

### 4.1 Home

The home page is assembled from three independent inputs, each of which can be missing:

| Input | Present | Absent |
| --- | --- | --- |
| Latest news (catalogue) | Lead story + recent briefs | "First edition coming" panel; never fake items |
| Local history (spec C) | "You left off with …" line, linking to `/read/<id>` | Line omitted; no placeholder |
| Published map geography | Map strip with live reveal | Map strip shows the preparatory introduction ("Mapping: Hamilton in preparation"), with no reveal and no link into `/map/` |

**Proposed:** use the same layout on a first visit and a return visit, adding only the resume line for returning readers. Don't build a separate welcome page.

### 4.2 Desk page

- Shows the latest edition, the archive, coverage, mapping status per geography (section 3.3) and a follow entry (spec E).
- **No editions yet** (Niagara–Brant today): coverage statement plus "Editions will appear here." While the Desk exists only on niagaraassembly.com, include a cross-link to its existing page. Never invent an edition.

### 4.3 Item page

Covered in spec B (fields) and spec C (state). Structural rules:
- **Breadcrumbs:** Desk › Edition › item when the item belongs to an edition; Desk › item otherwise; HeavyMap › Documentation › item for HeavyMap-authored material.
- **"Open in Reader"** goes to `/reader/?item=<id>`.
- **"Also in"** lists the editions that contain the item.

### 4.4 Unavailable, retired and not found

| Case | Response |
| --- | --- |
| Unknown path | `/404.html` (static host 404) with links to home, Desks and Reader. |
| Known item ID whose status became `retired` | Tombstone at `/read/<id>/`: title, retirement date, a short reason when one is recorded, and any replacement link. The page stays, so shared links and saved reading history don't break silently. |
| Map geography not `published` | `/map/<slug>/` is not generated; the 404 applies. |
| Reader opened with an unknown `?item=` | Reader opens normally with a quiet "That item isn't in the library" notice. Saved state is dropped as in the prototype's known-ID check. |

## 5. URLs

### 5.1 Canonical URL table (proposed)

All pages are prebuilt (D1) and served as directory indexes with trailing slashes.

| Path | Page | Notes |
| --- | --- | --- |
| `/` | Home | |
| `/desks/` | Desk directory | |
| `/desks/<desk-slug>/` | Desk page | `western-new-york`, `niagara-brant` |
| `/editions/<desk-slug>/<edition-slug>/` | Edition | `issue-one`; keeps the prototype's shape |
| `/read/<item-id>/` | Item page (canonical, D10) | ID as defined in spec B, e.g. `IEVT-2026-000001`, `reading-the-evidence` |
| `/reader/` | Reader workspace | client-side state in query (section 5.3) |
| `/map/` | Map landing | lists published geographies; only generated once one exists |
| `/map/<geography-slug>/` | Map workspace | `hamilton`; deep-link parameters belong to spec F |
| `/subscribe/` and `/preferences/` | Subscription flow | paths for later steps and secure-link handling belong to spec E; **no subscriber tokens in paths** |
| `/about/` | About index | links to documentation items |
| `/about/credits/` | Photo and data credits | |
| `/404.html` | Not found | |

Rules:
1. **Lower-case ASCII slugs**, hyphenated. The two exceptions are item IDs and map geography IDs, which keep their defined case (spec B).
2. **Flat Desk URLs.** Desk slugs drop the source site's `/us/ny/` nesting. Country and subdivision appear on the page, not in the URL. This keeps URLs short and avoids implying a hierarchy HeavyMap doesn't navigate by. *(Proposed; see A-Q1.)*
3. **One canonical URL per item.** Every other surface uses `<link rel="canonical">` or simply links to it.
4. **Theme is never in a URL.** It lives only in local storage (spec D).

### 5.2 Review-only pages

`/studies/…`, `/compare/` and the first-design `index.html` are **not built into the public site**. The build drops them from public output and keeps them in preview builds. The review links in the footer go with them (CLAUDE-HANDOFF item 6, issue HM-012).

### 5.3 Reader query parameters

| Parameter | Values | Meaning |
| --- | --- | --- |
| `item` | item ID | item open in the pane |
| `kind` | `news` (default), `finding`, `documentation`, `editorial`, `all` | material filter |
| `region` | region slug, `heavymap`, `all` | region filter |
| `q` | text, at most 120 characters | search |

- The query string is **shareable view state**, not stored state. A shared Reader URL opens the same view, but it never writes into the recipient's saved history until they act.
- How URL parameters and saved filters combine is spec C's job; the proposed default is that **the URL wins**.

### 5.4 Redirects from niagaraassembly.com

| Original | Target | Status |
| --- | --- | --- |
| `/desks/us/ny/western-new-york/` | `heavymap.com/desks/western-new-york/` | Open (A-Q3) |
| `/desks/us/ny/western-new-york/issue/one/` | `heavymap.com/editions/western-new-york/issue-one/` | Open (A-Q3) |
| `/desks/us/ny/western-new-york/issue/one/sources/` | Edition page, sources section | Open (A-Q3) |
| `/desks/ca/on/niagara-brant/` | `heavymap.com/desks/niagara-brant/` | Open (A-Q3) |
| `/desks/us/ny/`, `/desks/ca/on/` | `heavymap.com/desks/` | Open (A-Q3) |

Whether these become permanent redirects or stay as published pages with cross-links is a publication decision for niagaraassembly/site. It isn't decided by this spec. Either way, migrated items keep their original URL in `provenance.original_url` (spec B).

## 6. Navigation

**Header**, every page except the map workspace:
- Wordmark with the ◒ interim mark (D8), linking to `/`
- Desks
- Reader
- Map: present only if at least one geography is `published`. Otherwise the header shows nothing, and the home strip carries the preparatory note.
- Follow (subscribe)
- Theme selector (spec D)

**Map workspace:** the header shrinks into the bottom dock: region and geography, Reader, back to site (D4, spec F). The duplicate legacy map header goes when spec F's shell is built.

**Footer:**
- About
- Methodology
- Credits
- Licensing
- Coverage and limitations
- Desks list

There are no review links in the footer.

**Build-time link check (required):** fail the public build on any internal link to a page not generated, to a capability that isn't `published`, or to an item that isn't `published`. This is how the "no dead or unpublished links" rule is enforced, rather than by review.

```
          ┌──────── header: Desks · Reader · Map* · Follow · Theme ────────┐
  Home ───┼─► Desk directory ─► Desk page ─► Edition ─► Item (/read/<id>)  │
   │      │                        │                      ▲                │
   │      └─► Reader (/reader/?item=…) ───── permalink ───┘                │
   │                                                                       │
   └─► map strip ─► Map workspace (/map/<geo>/) ⇄ dock: Reader · ← site    │
                                     * only when a geography is published
```

## 7. Open questions for Morgen

| ID | Question | Proposed answer |
| --- | --- | --- |
| A-Q1 | Flat Desk URLs (`/desks/western-new-york/`) or the source site's nested ones (`/desks/us/ny/western-new-york/`)? | Flat |
| A-Q2 | Is Niagara–Brant's Desk `published` (its page exists on niagaraassembly.com) or `preparing` (no editions)? | `published` Desk with zero editions, so the Desk page is public with an empty archive |
| A-Q3 | Should niagaraassembly.com Desk URLs redirect to heavymap.com, or keep their pages and cross-link? | Redirect once heavymap.com is live and the edition is migrated in full; until then, cross-link |
| A-Q4 | Should `/about/` be a hand-written index over documentation items, or a separate set of pages? | Index over items |
| A-Q5 | When no geography is published, should the header omit Map entirely or show it greyed with "in preparation"? | Omit; the home strip carries the note |

## 8. Out of scope here

- Field definitions: spec B.
- Reader state and history schema: spec C.
- Theme tokens: spec D.
- Subscription paths and tokens: spec E.
- Map deep links, camera and pane behaviour: spec F.
- Hosting and redirect mechanics: spec G.
