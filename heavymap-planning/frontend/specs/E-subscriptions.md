# Spec E: subscriptions and preferences

Status: **draft; open questions answered** (decisions 42–53), 2026-11-10. Local issue HM-008. Written against branch `heavymap-mainsite-v1`.
Depends on: [Spec A](A-product-structure.md) (`/subscribe/`, `/preferences/`, Desk registry); [Spec C](C-reader-continuity.md) section 6.1 (no subscription state in browser storage); the inspection of the current setup, [`../research/HM-007-kit-subscription-inspection.md`](../research/HM-007-kit-subscription-inspection.md); decisions 42–49 (2026-11-10).
The round-two subscription screens in the prototype are illustrative only and aren't part of this contract.

Labels used in this document:
- **Decided**: Morgen chose it.
- **Proposed**: this draft recommends it and it needs acceptance.
- **Open**: deliberately left unresolved.

## 1. Decisions this spec builds on

| # | Decided (2026-11-10) |
| --- | --- |
| 42 | Readers subscribe and unsubscribe **per Desk**. |
| 43 | Per-Desk unsubscribe uses a tag-removal link in each email, set up in Kit. Kit's footer link stays as "unsubscribe from everything". |
| 44 | Same Kit account as Niagara Assembly, with one tag per Desk. |
| 45 | Every `na-list` subscriber gets both Desk tags at launch. |
| 46 | Each signup still creates a private GitHub issue. |
| 47 | No combined email in v1. |
| 48 | Signup goes Google Form → Apps Script → Kit, with a Desks question. |
| 49 | A daily check lists failed Kit tagging. |

## 2. Moving parts

```
HeavyMap page (Desk, edition, /subscribe/)
  form: Name, Email, Desks [x] Western New York  [x] Niagara–Brant
    │ POST (no-cors), same as today
    ▼
Google Form (HeavyMap signup)  ──►  response Sheet
    │ installable onFormSubmit trigger
    ▼
Apps Script heavymap-join.gs
    ├─ private GitHub issue  "HeavyMap signup: <name> (<Desks>)"          (decision 46)
    └─ Kit v4: upsert through the double-opt-in form, then tag each chosen Desk
                                                       │
Kit account (shared with Niagara Assembly)             ▼
   tags  hm-desk-western-new-york   hm-desk-niagara-brant
   per-Desk broadcast  ──►  "Stop <Desk> emails" link  → removes that Desk's tag only
                       └─►  Kit footer "Unsubscribe"   → leaves the whole account
```

The browser stores nothing about subscriptions (spec C section 6.1). Signup state lives in Kit, plus the Sheet and the private issue.

## 3. Kit setup (done by a person in Kit, before launch)

| Item | Value | Notes |
| --- | --- | --- |
| Desk tags | `hm-desk-western-new-york`, `hm-desk-niagara-brant` | The tag is `hm-desk-<desk slug>` from `content/regions.json`. A new Desk adds a tag. Created by hand: the scripts refuse to invent tags. |
| Double-opt-in form | the existing `KIT_FORM_ID`, or a HeavyMap one (E-Q9) | Kit's confirmation email is the opt-in step. |
| Per-Desk stop link | one per Desk; clicking it removes that Desk's tag and shows a confirmation page | **To verify against Kit's docs before building.** The likely mechanism is a link trigger in Kit's automations. The library docs service was unavailable in this session. |
| Migration | bulk-add both Desk tags to everyone tagged `na-list` (decision 45) | Done in Kit on launch day, after the tags exist. |

Agents don't do any of this. It needs the Kit account and changes who receives email (HARD-RULES 3 and 7).

## 4. Signup

### 4.1 Form

| Field | Rule |
| --- | --- |
| Name | required, as today |
| Email | required; same check as today (`name@example.com` pattern) |
| Desks | checkboxes, one per `published` Desk with a subscription capability (spec A capability states). **At least one.** On a Desk or edition page, that Desk starts ticked. On `/subscribe/`, none is ticked. |

- No "combined email" box (decision 47).
- No hidden level: this form is only for the mailing list. Membership levels stay on Niagara Assembly's own form.

### 4.2 Messages

These reuse today's wording wherever it exists, and the status line uses `role="status"`:

| State | Text |
| --- | --- |
| missing name | "Add your name." |
| bad email | "Add an email address, like name@example.com." |
| no Desk | "Choose at least one Desk." *(new)* |
| sending | "Subscribing…" |
| done | "Subscribed. Check your inbox to confirm." |
| network error | "That didn't go through. Check your connection and try again." |

The form posts with `no-cors`, so the browser can't see whether Apps Script or Kit succeeded. "Subscribed" means the Google Form received the signup. Section 6 covers what happens when Kit fails.

### 4.3 Apps Script

- **Decided (51): a separate `heavymap-join.gs`** on its own Google Form and response Sheet. Niagara Assembly's `join.gs` and its tags stay untouched. It reuses `_shared.gs` (`createIssue_`, `kitUpsertAndTag_`, `findKitTag_`).
- **Desks question:** a checkbox question titled `Desks` whose option values are the Desk slugs. The script maps each slug to `hm-desk-<slug>`, ignores unknown slugs and logs them.
- **Self-test:** `runSelfTest` fails if any Desk tag is missing in Kit, as today.
- **GitHub issue (decision 46):** title `HeavyMap signup: <name> (<Desk names>)`, body as in `buildJoinBody`, label `heavymap-signup`. It goes **only to the existing private repo**. The issue contains personal data, so it must never be mirrored, quoted in public commits or copied to public trackers.

### 4.4 Re-subscribing

Signing up again with the same email upserts the subscriber and adds the chosen Desk tags. Tags already present stay. The form never removes a tag, so a signup for Niagara–Brant doesn't drop Western New York.

## 5. Sending and unsubscribing

- **One broadcast per Desk edition**, drafted with `scripts/kit/kit.mjs draft <edition-dir> --tag hm-desk-<slug>`. That is a change from Issue One, which went to all subscribers. A person reads and sends the draft in Kit, as today.
- **Every Desk email carries, above Kit's footer:**
  "You get this because you follow the <Desk> Desk on HeavyMap. [Stop <Desk> emails] · [Choose your Desks]"
  - "Stop <Desk> emails" is the per-Desk stop link (section 3).
  - "Choose your Desks" goes to `/preferences/`.
- **Kit's footer link** stays and means "leave every Niagara Assembly and HeavyMap email". That's an account-wide unsubscribe, which the law requires to be present.
- **`/preferences/` in v1** is a static page and stores nothing:
  - it explains the two routes;
  - it lists each Desk with a short signup form to add it;
  - to stop a Desk, it points to the link in that Desk's emails.

  A self-service tick-box page would need a server function and signed links, so it waits until after v1.

## 6. Failure check (decision 49)

- **What:** a time-driven Apps Script trigger runs daily. It lists Sheet rows from the past 7 days whose Kit tagging failed, compared against Kit's tag membership, and opens or updates **one** private GitHub issue, "HeavyMap signup: Kit failures", with the affected email addresses.
- **When:** daily, at 08:00 ET (decision 53).
- **Recording:** it's a scheduled job, so when it's created, add it to `~/machine-flows/inventory/schedules/jobs.csv`. It runs in Google, not on a host.
- **Fixing:** a person retags the subscriber in Kit and closes the entry. The script never retries silently into Kit.

## 7. Launch steps (for spec G)

1. Create the Desk tags and per-Desk stop links in Kit (section 3).
2. Create the HeavyMap Google Form and Sheet, install `heavymap-join.gs`, set Script Properties (by Morgen; agents never handle the values), and run `runSelfTest`.
3. Bulk-tag `na-list` subscribers for both Desks (decision 45).
4. Enable the Desk checkboxes on the site.
5. Send one test signup per Desk, then confirm the private issue, the Kit tags and the confirmation email.
6. Install the daily failure check and record it.

## 8. Accessibility

- The Desks checkboxes sit in a `fieldset` with a `legend` "Desks to follow". The "at least one" error is tied to the fieldset with `aria-describedby`, and focus moves to the first checkbox.
- Errors are announced through the status line. Focus moves to the first invalid field.
- Checkbox and button targets are at least 24 × 24 px, and 44 px tall on touch layouts (spec D section 8).

## 9. Answers (Morgen, 2026-11-10)

| ID | Question | Decision |
| --- | --- | --- |
| E-Q8 | Sender | "HeavyMap", using the existing sending address (50) |
| E-Q9 | Form | A separate HeavyMap Google Form, Sheet and `heavymap-join.gs` (51) |
| E-Q10 | Pitch copy | "Get each <Desk> edition by email." (52) |
| E-Q11 | Failure check time | 08:00 ET daily (53) |
