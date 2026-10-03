# Review UI walkthrough

```bash
./scripts/hm review                     # real repo:  http://127.0.0.1:8765/
./scripts/hm --root /tmp/hm-demo review # sandbox:    make it first with ./scripts/hm demo /tmp/hm-demo
./scripts/hm review --port 8770         # another port if 8765 is busy
```

Open the printed address in a browser on the same computer. Stop with Ctrl+C. The page has no password because it only listens on `127.0.0.1` (your computer); `hm review` refuses any other address, and the server rejects requests whose `Host` or `Origin` is not local. Do not tunnel or expose it.

**The real registry is empty today**, so the real UI shows "No rows ... yet" on most screens. Use the demo sandbox to practise.

## What every screen shares

- **Top bar:** Status board · Inbox candidates · Layers · Quirks · Join tests · Scores · Use decisions.
- **Gate banner:** a red "Gate G6 is CLOSED" bar while G6 is closed (the default).
- **Provenance strip** at the top of each card: Linear issue, run id, dates, and clickable evidence URLs, so you always see where a fact came from.
- **One small form per editable field.** Each has: the new value (a dropdown for controlled values, text otherwise), a **decision code** (default `E` Edit), a note, your **reviewer** name and the **Linear issue** (`NIA-xx`). Buttons: **Save** (records what you chose) and **Confirm** (records code `A` with the value as it currently is). Your name and Linear id are remembered in a cookie after your first successful save.
- **Badges** next to a field show the latest decision for it: `E:pending` (saved, not yet applied), `E:applied`, `D:flag`, `E:stale`, `E:refused`.
- **A save does exactly one thing:** appends one line to `data/reviewed/review_decisions.csv`. The registry does not change until `hm apply --write`.
- A red "Not saved: ..." message means a rule stopped the save and nothing was written (missing Linear id, agent-looking reviewer name, a value that is not an allowed choice, `surfaced` while G6 is closed, owner-looking text...).

## Screens

1. **Status board.** Row counts, layers per lifecycle status, decision states (pending/applied/stale/...), open D/F/H/X/N flags, and the result of the checks.
2. **Inbox candidates.** Newly discovered services/layers (from scans), with publisher, endpoint and date. Editable: `status` (new, accepted, rejected, duplicate, blocked) and `notes`. Accepting only records your decision; creating the registry rows is a later (planned) import step. Deny-listed candidates cannot be accepted.
3. **Layers.** A list; click a layer for its **layer card**: identity, endpoint, counts, id analysis, CRS, lifecycle status (editable), grain (editable) and notes. Under it: the field register (names only; owner-bearing fields have a purple lock and are never shown with values), then that layer's identifier rules, quirks, join tests, score and use decision, each with its own forms.
4. **Quirks.** Every quirk: field, type, count, an example **id**, impact and proposed handling. Editable: type, impact, handling, status (open, blocking, accepted, resolved, wontfix, rejected).
5. **Join tests.** Layer × spine key × method with `hits` and `tested` and whether it was a sample or the full population, plus failure id samples. Editable: method, population, grade, notes. The grade scale (NIA-86) is not defined yet, so any short token is accepted and `hm validate` warns.
6. **Scores.** All eight components with bars, the weights, the stored total and the recomputed total. Blank means "not measured", not zero; a blank heavy criterion makes the total blank. You may override only the judgement components (coverage, openness) and add a reason. The score is a triage aid and never approves anything.
7. **Use decisions.** The recommendation and your final call: `use`, `not_used` or `needs_more`, plus licence status and risks. Deny-listed layers (MPAC, NPCA) cannot be set to `use` or `needs_more`.

## A worked example (sandbox)

1. `./scripts/hm demo /tmp/hm-demo && ./scripts/hm --root /tmp/hm-demo review`
2. Open **Quirks**, find `Q-syn-parcels-01`, field `handling`. Type a corrected value, keep code `E`, fill reviewer (`Dana`) and Linear (`NIA-999`), press **Save**. A blue message gives the new decision id; the field shows `E:pending`.
3. In another terminal: `./scripts/hm --root /tmp/hm-demo apply` lists it as `pending`; `apply --write` applies it.
4. Reload **Quirks**: the badge reads `E:applied` and the value is your corrected text.

## What the UI never shows

Owner values. The UI reads only the CSV tables named in `data/schema/table-schema.json`; it has no code path to `local-data/`, where any raw pulled rows would live. Owner-bearing fields appear as **names** with a lock, and any cell that looks like `OWNERNME1=...` is replaced by `[owner value withheld]`. It also refuses to save such text.
