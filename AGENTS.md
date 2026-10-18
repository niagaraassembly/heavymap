# AGENTS.md

Pickup contract for agents working on HeavyMap. Read this before opening an issue or a pull request. Spreadsheet hygiene is in [AGENTS-MCS.md](AGENTS-MCS.md).

**Status:** agent pickup source of truth. Linear **NA-13**. Docs only.

**Product:** HeavyMap — industrial intelligence for cross-border Niagara.
**Control plane:** Linear projects Industrial Atlas (backend) and HeavyMap.com (frontend), with linked issues for shared dependencies.
**Code source of truth:** this repository, `niagaraassembly/heavymap`.

Beta is the repository top level. The original `niagara-atlas/` prototype is prior-art reference only; it is archived at [`first-attempts/niagara-atlas/`](first-attempts/niagara-atlas/).

## Concurrent frontend and Atlas work

Read [WORKING-AGREEMENT.md](heavymap-planning/WORKING-AGREEMENT.md) for task ownership, direct-assignment packets, contract-change review, acceptance evidence and the scoped frontend exception to deferred UI chrome. Frontend and already-authorized backend validation proceed concurrently. PR #80 remains paused. Frontend tasks use synthetic contract fixtures; real-data work stays on Deb. The hard rules and publication gate still apply.

## Process insights (standing rule)

For Atlas findings, use `Spreadsheets/19-process-insights.csv` with `PI-` IDs. Frontend findings use the destination and interim PR-report route in [WORKING-AGREEMENT.md](heavymap-planning/WORKING-AGREEMENT.md#insights-and-handoffs), overriding the shared-sheet destination below for frontend work only.

Before finishing any session or pull request, every agent appends its process insights (sources found, dead ends ruled out, data quirks, method findings, effort estimates, gaps, licence notes) as new rows in [`Spreadsheets/19-process-insights.csv`](Spreadsheets/19-process-insights.csv), with live-verified evidence (URLs, counts, dates checked). The rows feed HeavyMap's published synthesized reports, so log dead ends and search scope too. Append only; never edit another session's row except its `status` or `linked_issue`. Agents that cannot write to the repo report them in their final message under the heading **Process insights** so a human or Grok Bot can log them. Columns, the insight / issue / decision split and etiquette: [heavymap-planning/PROCESS-INSIGHTS.md](heavymap-planning/PROCESS-INSIGHTS.md).

## Four-concept frame

The product frame lives under [docs/architecture/](docs/architecture/README.md) (Linear **NA-11**):

| Concept | Document |
|---|---|
| Parcel Identity Spine | [parcel-identity-spine.md](docs/architecture/parcel-identity-spine.md) |
| Context Band Ladder | [context-band-ladder.md](docs/architecture/context-band-ladder.md) |
| Parcel Context Display Protocol (PCDP) | [PCDP.md](docs/architecture/PCDP.md) |
| Claim & Refusal Contract | [claim-refusal-contract.md](docs/architecture/claim-refusal-contract.md) |

Under that frame, the Master Control Spreadsheet records which datasets exist, and D-5 names a dataset’s disposition: `ship`, `simplify`, `derive`, `tile`, or `link`. Neither is a fifth product name. The spreadsheet itself is outside this repo; see [AGENTS-MCS.md](AGENTS-MCS.md).

## Pickup

For autonomous issue pickup, work an issue only when all of these are true. Explicit bounded assignments from Morgen for the concurrent round follow the packet exception in [WORKING-AGREEMENT.md](heavymap-planning/WORKING-AGREEMENT.md#task-packet-and-report):

1. The issue carries the label `agent-ready`.
2. The issue carries your lane label: `agent:cloud`, `agent:claude`, `agent:copilot`, `agent:cursor`, `agent:kiro`, or `agent:codex`.
3. The description contains a complete Agent packet. When the work reads or writes dataset truth, it also contains an MCS contract block. Reprint that block from [AGENTS-MCS.md](AGENTS-MCS.md).

If any item is missing, comment on the issue and stop. Leave the scope as written. `agent-ready` is applied by Morgen or the Chief of Staff.

Prefer one Cloud Agent, plus follow-ups on that same run, for a documentary task. Cite the Linear ID (`NA-…`) in the pull request body.

Ordinary HeavyMap work stays in Linear. Open a GitHub pull request for the change. A GitHub issue is not the tracker for that work.

## Lanes

| Actor | Lane | Does |
|---|---|---|
| Morgen | — | Decisions, merges, secrets |
| Chief of Staff | — | Routing, packet quality, `agent-ready` |
| Cursor Cloud Agent | `agent:cloud` | Documentary and multi-file investigation pull requests |
| Cursor interactive | `agent:cursor` | Ambiguous product calls with a human in the loop |
| Claude Code | `agent:claude` | Assigned implementation or independent review in either track, within environment/data constraints |
| Copilot | `agent:copilot` | A gated packet turned into a draft pull request |
| Kiro | `agent:kiro` | Specialized process work |
| Codex (Deb or cloud, according to task inputs) | `agent:codex` | Individual research/writing tasks as well as technical coding tasks; for unattended CLI runs use `</dev/null`; output returned via files/PR/Linear comment by a human or Deb-side session; coding tasks return as a branch/PR for human review (works on a branch and opens or hands back a PR; never merges) |

Codex may not reach Linear directly, so the human (or Deb-side session) posts its pickup and result comments. It names its Linear issue where applicable and returns the assigned branch or draft PR. It does not send messages or change Linear without instruction, and never merges. It takes individual research/writing tasks as well as technical coding tasks. For coding tasks, Codex works on a branch and opens or hands back a PR for review; it never merges. Coding tasks return as a branch/PR for human review.

Framework labels (`fw:pcdp`, `fw:spine`, `fw:bands`, `fw:claims`) and work-kind labels (`data-prep`, `protocol`, `docs`, `assessment`) name the packet. They do not replace `agent-ready` or the lane.

## Prior art

Cite `first-attempts/niagara-atlas/` and the UK atlas (`babbworks/atlas`) as baselines. The product root is the top level of this repository. UK geography is outside product scope. A UK capability pattern belongs in the MCS column `uk_analogue`, as described in [AGENTS-MCS.md](AGENTS-MCS.md).

## Publish and chrome

The public site stays unpublished until Morgen signs off the jurisdiction's beta gate (NA-269). Building and testing publish or deploy tooling is allowed (HARD-RULES 3). Explicitly assigned HeavyMap frontend work may build UI against synthetic contract fixtures under [WORKING-AGREEMENT.md](heavymap-planning/WORKING-AGREEMENT.md). This is not permission to publish. Before merging, verify whether the changed paths trigger publication and whether jurisdiction approval applies.

## Secrets

Never commit secrets, tokens, or credential files. If you find one, report the path and the type, and stop. A human revokes it.

## Agent packet

Linear packets use this shape:

```markdown
## Agent packet
- **Assignee agent:** Copilot | Cursor | Cloud Agent | Claude | Kiro | Codex | human
- **Lane label:** `agent:…`
- **Repo:** `niagaraassembly/heavymap` (paths: …)
- **Framework:** PCDP | Spine | Bands | Claims | (n/a)
- **Outcome:** …
- **Out of scope:** …
- **Acceptance checks:** …
- **Prior-art posture:** baseline-reference-only | allowed to modify code | docs-only
- **Links:** AGENTS-MCS.md, docs/architecture/, related issues
```

## Cursor Cloud specific instructions

- Environment E3 (atlas): `.cursor/environment.json` runs `scripts/cloud-install.sh` (Python check, byte-compile, `python3 -m unittest discover -s tests`, `python3 scripts/check_index_paths.py`) and `scripts/cloud-start.sh` (nothing to start). Stdlib only; nothing to install.
- Before an Atlas PR: run the two checks above. For frontend tasks, run the assigned web checks against the branch actually containing `web/`; report unavailable checks. Route insights by track (see Process insights above). Never pull data into the repo; the VM is disposable, so record facts not rows.
- Skills in `.agents/skills/`: `heavymap-pcdp`, `heavymap-dataset-profiling`, `untrusted-web-text`. Rules in `.cursor/rules/`.
- Setup notes and open questions: [docs/for-agents/CLOUD-ENVIRONMENT.md](docs/for-agents/CLOUD-ENVIRONMENT.md).

Skills: for multi-step or repeated work, use a matching skill from `.agents/skills/` or the cross-repo index (`ai-authored/skills/INDEX.md` in machine-flows); afterwards propose a new skill or an edit. One-off asks skip this.
