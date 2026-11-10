# Spec C: Reader and reading continuity

Status: **draft; open questions answered** (decisions 27–31), 2026-11-10. Local issue HM-005. Written against branch `heavymap-mainsite-v1`.
Depends on: [Spec A](A-product-structure.md) (surfaces, URLs, Reader query parameters in section 5.3); [Spec B](B-content-model.md) (item types, IDs, status, presentation in section 10); the frontend v1 decisions of 2026-11-10 (D9 to D12).
Reference implementation: `web/src/editorial/reader-state.js` (`heavymap-reader-v1`) and the Reader code in `alternate.js`. They are a starting point, not the contract.

Labels used in this document:
- **Decided**: Morgen chose it.
- **Proposed**: this draft recommends it and it needs acceptance.
- **Open**: deliberately left unresolved.

## 1. Decisions this spec builds on

| # | Decided (2026-11-10) |
| --- | --- |
| D9 | An item is **read** when the reader marks it read or reaches its end. Opening it updates only "last opened". |
| D10 | `/read/<id>/` is canonical; edition pages and the Reader show the same item, and progress is shared. |
| D11 | One browser-local reading history covers every reading surface: Reader, item pages and edition pages. |
| D12 | On mobile, the Reader library shows on entry and collapses to "Browse & filter" once an item is opened. |
| A 5.3 | Reader URL parameters `item`, `kind`, `region`, `q` are shareable view state. |
| B 2.1 | Type keys are singular: `news`, `finding`, `documentation`, `editorial`. |

Unchanged from the earlier direction:
- History is browser-local, with no account.
- It is separate from theme and subscription state.
- The cue stays subtle: "You left off with …".

## 2. Reading surfaces and what each records

| Surface | Records | Resume target |
| --- | --- | --- |
| Reader pane (`/reader/?item=`) | open, position, end reached, mark read/unread | the item, at its saved position |
| Item page (`/read/<id>/`) | open, position, end reached, mark read/unread | the item, at its saved position |
| Edition page (`/editions/<desk>/<edition>/`) | per card: seen, end reached; plus the **edition position** (last card in view) | the edition, at that card |
| Home | nothing; it **shows** the cue | none |
| Map workspace | nothing in v1 | none |

## 3. Reading events

| Event | Trigger | Effect |
| --- | --- | --- |
| `opened` | Item page or Reader pane shows the item's body. **Decided (27)** for edition cards: the card has been at least 50% visible for at least 2 seconds. | sets `lastOpened` |
| `progressed` | scroll settles (debounced, as the prototype does) | sets `position` (section 3.1) |
| `endReached` | the item's **end marker** (the prototype's `.reading-end`; on edition cards, the card's bottom edge) has been visible for at least 1 second | sets `readAt`, unless suppressed (section 3.2) |
| `markedRead` / `markedUnread` | explicit button | sets `readAt` or `unreadAt`; explicit actions always win |

**Why dwell thresholds.** A full edition page has every card open (spec B section 10.1). Without a dwell rule, flicking down the page would mark everything read. The thresholds are decided as a starting point and get tuned once the page is built (decision 27).

### 3.1 Position that survives layout changes

The prototype stores `scrollTop` as a fraction of its scroll container. That fraction means different things on the item page, the Reader pane and mobile. **Proposed:** store the position against the **article body**, not the scroll container:

```
position = { block: <index of the body block at the top of the viewport>, within: <0..1 through that block> }
```

Here a block is a section heading or paragraph group, or a fact/flag/source block on news (spec B section 10). Restoring scrolls that block into view in any layout. A news brief with no body blocks restores to the top. When the body has changed so that `block` no longer exists, restore to the start and do **not** show an error.

### 3.2 Read and unread

- `read` is true when `readAt` exists and is later than any `unreadAt`.
- **Marking unread suppresses automatic reading until the next visit.** After a reader marks an item unread, reaching the end again in the same page view doesn't re-mark it. A later `opened` lifts the suppression.
- A visit alone never marks an item read (D9). The library labels state "Read" only from `read`, never from `lastOpened`.

## 4. The resume cue

**Proposed rule:**
1. Take the most recent `opened` entry across all surfaces.
2. If it is an **item** that isn't read and is still eligible, the cue reads: "You left off with *{title}*. Continue reading →". It links to the surface last used: `/read/<id>/` or `/reader/?item=<id>`.
3. If it is an **edition position**, the cue reads: "You left off in *{Desk} {Edition}*. Continue →". It links to the edition at that card's anchor.
4. If the most recent item is already read, there is **no cue**. The home page doesn't suggest "next unread", to stay unobtrusive (decision 28).
5. Retired, removed or ineligible targets produce no cue. Their history entry is kept (section 7).

The cue includes **"Forget history"**, as in the prototype (section 6.4).

## 5. Reader behaviour

### 5.1 Filters

| Control | Values | Default |
| --- | --- | --- |
| Material | `news`, `finding`, `documentation`, `editorial`, `all` | `news` (D3) |
| Region | region slug, `heavymap`, `all` | `all` |
| Search | text, at most 120 characters, matching title, summary, publisher, place and entity | empty |
| Unread only | on/off | off |

**URL and saved filters (proposed): the URL wins for that view.**
1. Opening `/reader/` with parameters applies them but **doesn't save them**. A shared link never rewrites the recipient's preferences.
2. Changing any control saves the full filter set and updates the URL with `history.replaceState`.
3. Opening `/reader/` without parameters applies the saved filters.

### 5.2 Direct item links and filters

When `?item=` names an item that the current filters would hide:
- the item still opens in the pane;
- the library shows a line, "This item isn't in your current filter · Show all", which offers to clear the filters.

The filters are never cleared silently. (The prototype clears the "unread only" box; replace that behaviour.)

| `?item=` names | Result |
| --- | --- |
| a `published` item | opens |
| a `retired` item | the pane shows the tombstone (spec A section 4.4) |
| an unknown ID | Reader opens normally, with the notice "That item isn't in the library" |
| a `preview` item in a public build | treated as unknown |

### 5.3 Order and previous/next

- **Library order:** newest first, by `published_on`, then edition section order, then ID. *Decided (30).* The Reader is not an edition; it never claims edition order.
- **Previous/next** moves through the **currently filtered** library order and says so: "3 of 12 · News · Western New York".
- **Edition pages** have their own order (spec B section 3) and no previous/next across editions in v1.

### 5.4 Mobile (D12)

- **On entry:** the library is expanded.
- **When an item opens:** the library collapses to "Browse & filter"; focus moves to the article heading.
- **Toggle:** `aria-expanded` and `aria-controls` are kept, as in the prototype.
- **Reopening the library:** focus moves to the selected item in the list.
- **Scrolling:** one scroll container on mobile. The article scrolls with the page, not inside a nested pane, which avoids the nested-scroll issue in CLAUDE-HANDOFF item 8. The position rule in section 3.1 makes this layout-independent.

### 5.5 Keyboard and focus (desktop)

| Action | Result |
| --- | --- |
| Library item activation | opens the item and moves focus to the article heading |
| Previous/next | keeps focus on the button pressed |
| Escape from the article | returns focus to the selected library item |
| Mark read/unread | the button's label and pressed state both update, and the change is announced politely through the existing `role="status"` region |

## 6. Storage

### 6.1 Keys and separation

| Key | Owner | Spec |
| --- | --- | --- |
| `heavymap-reading-v2` | reading history and Reader filters | this spec |
| `heavymap-theme-v1` | theme choice and recent themes | spec D |
| (none) | subscriptions; never in localStorage | spec E |

HeavyMap never reads or writes Niagara Assembly's keys (`na-reader`, `na-theme`). This rule is carried over from the prototype.

### 6.2 Schema (proposed)

```json
{
  "version": 2,
  "items": {
    "IEVT-2026-000001": {
      "o": "2026-11-10T14:05Z",
      "p": { "block": 4, "within": 0.3 },
      "via": "read",
      "r": "2026-11-10T14:09Z",
      "u": null
    }
  },
  "editions": {
    "western-new-york/issue-one": { "o": "2026-11-10T13:50Z", "at": "IEVT-2026-000004" }
  },
  "last": { "kind": "item", "id": "IEVT-2026-000001" },
  "filters": { "kind": "news", "region": "all", "q": "", "unread": false }
}
```

Item entry fields:

| Field | Meaning |
| --- | --- |
| `o` | last opened |
| `p` | position (section 3.1) |
| `via` | surface last used: `read`, `reader` or `edition` |
| `r` | `readAt` |
| `u` | `unreadAt` |

Timestamps are kept to the minute. They are local, never sent anywhere, and only precise enough for ordering.

### 6.3 Validation, bounds and failure

| Case | Behaviour |
| --- | --- |
| Unknown version or malformed JSON | start fresh; never throw; leave the theme key untouched |
| Item ID not in `known-ids.json` (spec B section 7) | drop the entry |
| Item ID retired | keep the entry; exclude it from the cue and the library |
| More than 500 item entries | drop the oldest by `o`, keeping read entries last; edition entries are capped at 50 |
| Storage unavailable or throwing | keep state in memory for the page view; show the existing notice "Browser storage is unavailable…" |
| Quota exceeded on write | prune to 250 entries and retry once; otherwise behave as unavailable |
| Another tab writes (`storage` event) | merge per item: latest `o` wins, and `r`/`u` follow section 3.2; each write reads, modifies and then writes |

### 6.4 Forgetting

- **"Forget reading history"** removes `heavymap-reading-v2` entirely, including saved filters. It never touches the theme key or anything subscription-related. *Proposed* confirmation copy: "Forget what you've read on this device? Your theme stays as it is."
- **Per-item removal** is offered in v1 (decision 29):
  - each library entry that has history gets a "Remove from history" control in its overflow menu, and the item page gets the same control next to Mark read/unread;
  - removal deletes that item's entry (`o`, `p`, `via`, `r`, `u`); if `last` points to it, `last` is cleared, so the cue disappears;
  - it removes the item from *history*, not from the library: the item stays listed, as unread;
  - no confirmation dialog; the `role="status"` region announces "Removed from your history" with an Undo action for the rest of the page view;
  - edition positions are removed only by "Forget reading history".

### 6.5 Migration from the prototype (`heavymap-reader-v1`)

1. Read v1 once.
2. Map its fields:
   - `current` becomes `last`;
   - `progress[id]` (a fraction) becomes `p: { block: 0, within: 0 }`; the old fraction can't be mapped safely, so the item restarts at the top;
   - `read[]` becomes `r` set to the migration time;
   - filter `kind` maps `findings` to `finding` and `editorials` to `editorial`.
3. Drop unknown IDs. The prototype's `hm-` documentation IDs fall away (spec B section 2.1 rule 4).
4. Write v2 and delete v1.

The prototype was never public, so this migration exists mainly for reviewers.

## 7. Content that changes

| Change | Effect on history |
| --- | --- |
| `updated_on` later than the reader's `r` | the library and item page show a quiet "Updated since you read it" line. `r` stays. *Decided (31).* |
| Item retired | entry kept and hidden; any cue pointing to it disappears |
| Item body restructured | the position falls back to the start (section 3.1) |
| Item removed from the catalogue without a tombstone | not allowed; spec B section 5 requires retirement, not deletion |

## 8. Acceptance (to be planned under spec G)

These are the behaviours a focused check must show. They aren't a test plan:
- Every row in sections 3, 5.2 and 6.3.
- A shared Reader URL leaves the recipient's saved filters unchanged.
- "Forget" leaves the theme unchanged.
- Removing one item clears its entry and any cue pointing to it, and Undo restores it.
- Fast scrolling through an edition doesn't mark cards read.
- An item opened on `/read/` and later in the Reader resumes at the same block.

## 9. Answers (Morgen, 2026-11-10)

| ID | Question | Decision |
| --- | --- | --- |
| C-Q1 | Edition dwell thresholds | 50% visible for 2 s = opened; bottom edge for 1 s = read; tune later (27) |
| C-Q2 | Cue when the last item is read | No cue (28) |
| C-Q3 | Per-item history removal | **Yes**, alongside "Forget reading history" (29; section 6.4) |
| C-Q4 | Library order | Newest first by publication date, edition order as tie-break (30) |
| C-Q5 | "Updated since you read it" | Yes, quietly; the item stays read (31) |
