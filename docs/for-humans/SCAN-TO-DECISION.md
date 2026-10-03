# How a scan becomes a reviewed decision

```
 find        record         propose          you decide        apply          check
 ----        ------         -------          ----------        -----          -----
 agent/you   data/inbox/    data/registry/   review page       hm apply       hm validate
 finds a  -> candidates  -> rows in a PR  -> appends one    -> --write      -> hm guard
 service     .csv           (profile,        line per field    changes the    -> your PR review
             status=new     quirks, joins)   to review_        registry +     -> merge (you)
                                             decisions.csv     writes a
                                                               manifest
```

Today the first three steps are done by an agent (or by hand) editing CSV files in a PR, because the scanner, puller and profiler are **planned**. The last four steps work now.

## Step by step

1. **Find.** Someone spots a public service/layer (an ArcGIS REST layer, a data portal entry). The Linear issue for the slice is named (`NIA-xx`).
2. **Record as a candidate.** One row in `data/inbox/candidates.csv` with a hash id (`CAND-9f3a17c2`), the endpoint, publisher, jurisdiction, family (parcels, address, footprints, zoning...), the source URL and the date seen, `status = new`. If the publisher is MPAC or NPCA-derived the row is recorded as `blocked` instead: noted, not ingested.
3. **Slice approved.** A person approves a slice (about 15 to 25 layers for one place and family). Only then may anyone pull data, and the pulled files stay in `local-data/` on that computer.
4. **Profile.** The agent writes down small checkable facts into registry rows: service defaults, layer counts from the server, the id field and its quirks (leading zeros lost, padding, duplicates), encoding and CRS, owner-bearing field **names** (never values), how the layer joins to the parcel spine as `hits / tested`, and cited evidence rows with URL, date and "live read" or "documented, not re-read". These arrive as a draft PR. The agent only *recommends* a use decision.
5. **Review.** You run `hm review`, open the page, and go through candidates, a layer, its quirks, join test, score and use decision. For each field you either confirm it, correct it, reject it, or flag it (doubt, follow-up, hold, conflict, n/a). Each save is **one line** in `review_decisions.csv`: which record, which field, the old value, your new value, your decision code, a note, your name, the UTC time and the Linear issue.
6. **Apply.** `hm apply` (dry run) lists what would change. `hm apply --write` changes the registry, **using your corrected values**, and writes a manifest of exactly which decisions it consumed. Decisions that no longer match (someone changed the record since you looked, "stale") or that break a rule are skipped and listed.
7. **Check and merge.** `hm validate` and `hm guard` must pass. The PR is reviewed on GitHub (the diff is just CSV lines) and **you** merge. Agents never merge.

## What you can decide

| Code | Meaning | Changes the registry value? |
|---|---|---|
| A | Confirm | only if you typed a different value; "Confirm" keeps the current one |
| E | Edit / correct | yes, to your corrected value |
| R | Reject | yes if you give a value (for example a quirk status of `rejected`) |
| D | Retain with doubt | no, shown as an open flag |
| F | Follow-up research | no, open flag |
| H | Hold | no, open flag |
| X | Conflicting evidence | no, open flag |
| N | Not applicable | no |

A layer's *use decision* is `use`, `not_used` or `needs_more`. A high score never means "use": scores are a triage aid.

## Limits worth knowing

- You can edit only the fields marked editable ([TABLES.md](../for-agents/TABLES.md)). Gate flags and the deny list change only through a reviewed PR.
- You cannot set `surfaced` while gate G6 is closed, and only the reviewer named `Morgen` can set `dormant` or `surfaced`. The reviewer name is typed by you, so GitHub code-owner review is the real lock (see [open decisions](OPEN-DECISIONS.md)).
- Clearing a field to blank through a decision is not supported (an Edit needs a value).
