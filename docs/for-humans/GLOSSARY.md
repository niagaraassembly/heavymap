# Glossary

| Term | Meaning here |
|---|---|
| **Registry** | The canonical CSV tables in `data/registry/`. Changed only by `hm apply` (existing values) or a reviewed PR (new rows). |
| **Inbox** | Staging tables in `data/inbox/`: what agents found, not yet accepted. |
| **Review decision** | One appended line in `data/reviewed/review_decisions.csv`: one field of one record. Latest per field wins. |
| **Decision code** | A Confirm · E Edit/correct · R Reject · D Doubt · F Follow-up · H Hold · X Conflicting evidence · N Not applicable. A/E/R can change a value; the rest are flags. |
| **Apply** | `hm apply`: copy the latest decisions into the registry (dry run by default). |
| **Stale** | A decision whose `old_value` no longer matches the registry. Skipped; needs a fresh review. |
| **Service / layer** | A publisher's server (service) and one dataset on it (layer). Layers inherit service defaults. |
| **Lifecycle status** | `catalogued` → `pulled` → `profiled` → `formatting_needed` → `format_resolved` → `spined` → `dormant` → `surfaced`; side states `blocked` and `not_used`. `dormant`/`surfaced` are Morgen's call; `surfaced` needs G6. |
| **Pull** | Downloading a layer into `local-data/` for profiling only (planned command; allowed only for an approved slice). Pulling is not a licence decision. |
| **Profile** | The small checkable facts about a layer: count, id field, encoding, CRS, nulls, owner field names, spine join. |
| **Quirk** | A data oddity that affects joining, e.g. an id stored as a number that lost leading zeros (`float_stored_id`), padding differences, duplicates. |
| **Grain** | What one row is: parcel, footprint, address point, zone polygon, register unit, jurisdiction aggregate. |
| **Spine** | The parcel identity spine: the shared key (`hm:{country}:{region}:{jurisdiction}:{grain}:{local}`) layers join to. See `docs/architecture/parcel-identity-spine.md`. |
| **Join test** | A test of a layer against a spine key: method, `hits`, `tested`, sample or full population. |
| **Grade** | Quality label of a join, per the NIA-86 scale, which is **not defined in the repo yet**. |
| **SBL / SWIS / print key** | New York parcel identifiers: 20-character SBL, 6-digit SWIS municipality code, and the human-formatted print key (display only). Rules in `docs/normalization/ny-sbl.md`. |
| **Score** | Eight criteria scored 0 to 3 with weights (formula v1.0, a **proposal**, to be calibrated on the Welland/Rochester pilot). Blank = unmeasured. Triage aid only. |
| **Use decision** | `use`, `not_used`, or `needs_more` (the routine's older word is `defer`; see open decisions). |
| **Licence status** | found, not_found, restricted, not_licensed, unknown. |
| **Claim** | A cited fact: value summary, URL, access date, `live_read` or `documented_not_reread`, locator. |
| **Deny list** | Rules that force a layer to `not_used`: built in for MPAC and NPCA, extensible in `deny_list.csv`. |
| **MPAC** | Ontario assessment data. `not_licensed`: never pulled or used. |
| **NPCA-derived** | Layers derived from NPCA data: noted, not ingested. |
| **G6** | The publication gate. While closed (default), nothing may be surfaced or published. What opens it is not defined in the repo. |
| **D-13** | Decision on owner fields: retain at ingest, mask at presentation (`misc/niagara-atlas/TECHNOLOGY-DECISIONS.md`). Here that means: owner field **names** in tables and UI; any raw values live only in `local-data/`. |
| **MCS** | Master Control Spreadsheet (dataset inventory). Status in this repo is an open decision. |
| **Linear ID (NIA-xx)** | The Linear issue every output must cite. |
| **Local-data / build** | Git-ignored folders for pulled data and generated files. |
| **Manifest** | JSON written by `hm apply --write` listing the decisions it consumed and each change. |
| **Draft PR** | A pull request that cannot be merged until marked ready. All HeavyMap PRs are human-reviewed; agents never merge. |
