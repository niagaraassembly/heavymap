# AGENTS.md

Pickup contract for agents working on HeavyMap. Read this before opening an issue or a pull request. Spreadsheet hygiene is in [AGENTS-MCS.md](AGENTS-MCS.md).

**Status:** agent pickup source of truth. Linear **NIA-13**. Docs only.

**Product:** HeavyMap — industrial intelligence for cross-border Niagara.
**Control plane:** Linear project Industrial Atlas (priority, status, Agent packets).
**Code source of truth:** this repository, `niagaraassembly/heavymap`.

Beta is the repository top level. `niagara-atlas/` is prior-art reference only.

## Four-concept frame

The product frame lives under [docs/architecture/](docs/architecture/README.md) (Linear **NIA-11**):

| Concept | Document |
|---|---|
| Parcel Identity Spine | [parcel-identity-spine.md](docs/architecture/parcel-identity-spine.md) |
| Context Band Ladder | [context-band-ladder.md](docs/architecture/context-band-ladder.md) |
| Parcel Context Display Protocol (PCDP) | [PCDP.md](docs/architecture/PCDP.md) |
| Claim & Refusal Contract | [claim-refusal-contract.md](docs/architecture/claim-refusal-contract.md) |

Under that frame, the Master Control Spreadsheet records which datasets exist, and D-5 names a dataset’s disposition: `ship`, `simplify`, `derive`, `tile`, or `link`. Neither is a fifth product name. The spreadsheet itself is outside this repo; see [AGENTS-MCS.md](AGENTS-MCS.md).

## Pickup

Work an issue only when all of these are true:

1. The issue carries the label `agent-ready`.
2. The issue carries your lane label: `agent:cloud`, `agent:claude`, `agent:copilot`, `agent:cursor`, or `agent:kiro`.
3. The description contains a complete Agent packet. When the work reads or writes dataset truth, it also contains an MCS contract block. Reprint that block from [AGENTS-MCS.md](AGENTS-MCS.md).

If any item is missing, comment on the issue and stop. Leave the scope as written. `agent-ready` is applied by Morgen or the Chief of Staff.

Prefer one Cloud Agent, plus follow-ups on that same run, for a documentary task. Cite the Linear ID (`NIA-…`) in the pull request body.

Ordinary HeavyMap work stays in Linear. Open a GitHub pull request for the change. A GitHub issue is not the tracker for that work.

## Lanes

| Actor | Lane | Does |
|---|---|---|
| Morgen | — | Decisions, merges, secrets |
| Chief of Staff | — | Routing, packet quality, `agent-ready` |
| Cursor Cloud Agent | `agent:cloud` | Documentary and multi-file investigation pull requests |
| Cursor interactive | `agent:cursor` | Ambiguous product calls with a human in the loop |
| Claude | `agent:claude` | Planning, normalize drafts, later UI |
| Copilot | `agent:copilot` | A gated packet turned into a draft pull request |
| Kiro | `agent:kiro` | Specialized process work |

Framework labels (`fw:pcdp`, `fw:spine`, `fw:bands`, `fw:claims`) and work-kind labels (`data-prep`, `protocol`, `docs`, `assessment`) name the packet. They do not replace `agent-ready` or the lane.

## Prior art

Cite `niagara-atlas/` and the UK atlas (`babbworks/atlas`) as baselines. The product root is the top level of this repository. UK geography is outside product scope. A UK capability pattern belongs in the MCS column `uk_analogue`, as described in [AGENTS-MCS.md](AGENTS-MCS.md).

## Publish and chrome

The public site stays unpublished until data is reconciled. UI chrome stays deferred. Architecture docs may still specify PCDP surfaces (`selection`, `dossier`, `share`, `export`) without shipping a map.

## Secrets

Never commit secrets, tokens, or credential files. If you find one, report the path and the type, and stop. A human revokes it.

## Agent packet

Linear packets use this shape:

```markdown
## Agent packet
- **Assignee agent:** Copilot | Cursor | Cloud Agent | Claude | Kiro | human
- **Lane label:** `agent:…`
- **Repo:** `niagaraassembly/heavymap` (paths: …)
- **Framework:** PCDP | Spine | Bands | Claims | (n/a)
- **Outcome:** …
- **Out of scope:** …
- **Acceptance checks:** …
- **Prior-art posture:** baseline-reference-only | allowed to modify code | docs-only
- **Links:** AGENTS-MCS.md, docs/architecture/, related issues
```
