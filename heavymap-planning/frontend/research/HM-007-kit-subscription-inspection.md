# HM-007: how Niagara Assembly subscriptions work today (read-only inspection)

Date: 2026-11-10. Source: `niagaraassembly/site` at `9522b3e`, read with `git show` (the working tree's uncommitted changes were not touched).
No API call was made, no credential was read, and no Kit data was fetched.

## Signup path

```
Desk page form (wny.js mountSignup)
  → Google Form (JOIN_ACTION, level fixed to "List")
  → Apps Script join.gs onFormSubmit (installable trigger on the response Sheet)
      ├─ creates a GitHub issue "Join: <name> (List)" in a private repo, with the name and email in the body
      └─ Kit v4: upsert subscriber through KIT_FORM_ID (double opt-in) and tag "na-list"
  → page shows "Subscribed. Check your inbox to confirm."
```

- Level tags: `na-list`, `na-member-regional`, `na-member-company`, `na-member-champion`. Other scripts use `na-board`, `na-expert` and `na-opensource`.
- `runSelfTest` fails if a tag doesn't already exist in Kit, so scripts never invent tags.
- Credentials (`KIT_API_KEY`, `KIT_FORM_ID`, `GITHUB_TOKEN`) live only in Apps Script Script Properties; `scripts/kit/kit.mjs` reads `KIT_API_KEY` or `~/.config/na/kit.env`.
- Failure handling: a Kit failure is logged, not surfaced (`tagQuietly_`). The reader still sees "Subscribed".

## Per-Desk choices

- The WNY form already has the per-Desk checkboxes (Western New York, Niagara Peninsula, One combined email). They are **disabled**, with the note "choices coming soon; for now you'll get every Niagara Assembly email".
- The selected topics are not sent; only name, email and `level: List` are.

## Sending

- `scripts/kit/kit.mjs draft <edition-dir> --tag <tag>` saves an edition email as a Kit **draft** (`send_at` always null). A person sends it from Kit.
- The WNY Issue One draft (broadcast 26352080, 2026-10-11) targeted **all subscribers**, not a Desk tag.
- The email uses Kit's "Text only" Classic template, which adds the unsubscribe link and postal address.

## Unsubscribe

- Only Kit's own footer link. That unsubscribes the person from the **whole Kit account**, which means every Niagara Assembly email.
- There is no per-Desk preference page and no tag-removal link.

## What decision 42 (per-Desk subscribe and unsubscribe) needs

1. **One Kit tag per Desk**, for example `hm-desk-western-new-york` and `hm-desk-niagara-brant`, created by hand first, since the scripts refuse to invent tags.
2. **Signup sends the chosen Desks**, and the backend tags each one.
3. **Each Desk's broadcast targets its Desk tag** (`kit.mjs draft --tag`), not all subscribers.
4. **Per-Desk unsubscribe that leaves the other Desk intact.** Kit's footer link is account-wide, so per-Desk unsubscribe needs one of:
   - a. a link in each email that removes only that Desk's tag (a Kit link that triggers tag removal, configured in Kit);
   - b. a HeavyMap `/preferences/` page backed by a small server function that verifies a signed link and changes tags. The static site can't hold the API key.
   - In both cases Kit's footer stays as the "unsubscribe from everything" route, which the law requires.
5. **A decision on existing subscribers:** which Desk tags `na-list` members get, if any.

## Observations to flag (not changed)

- Every signup creates a GitHub issue that contains the subscriber's name and email. For HeavyMap, this is personal data stored in an issue tracker (HARD-RULES 2 territory). Spec E should decide whether HeavyMap signups do the same.
- A Kit failure is invisible to the reader. Spec E should decide whether that's acceptable.
