# HeavyMap

Beta for this repository is the **top level**. Prior-art work (the original `niagara-atlas/` prototype, now under [`first-attempts/niagara-atlas/`](first-attempts/niagara-atlas/)) is reference only. It is not the product root.

How a parcel is known and shown is specified in [docs/architecture/](docs/architecture/README.md):

- Parcel Identity Spine
- Context Band Ladder
- Parcel Context Display Protocol (PCDP)
- Claim & Refusal Contract

These documents do not publish a site, do not fetch data, and do not change the Master Control Spreadsheet.

## For agents

Start from the repo. Linear project Industrial Atlas is the control plane. This repository is the code source of truth.

- [AGENTS.md](AGENTS.md) — pickup contract: `agent-ready` plus a matching lane (`agent:cloud`, `agent:claude`, and the other `agent:*` lanes)
- [AGENTS-MCS.md](AGENTS-MCS.md) — Master Control Spreadsheet hygiene. The workbook lives under Morgen’s `~/na/` (xlsx or csv). It is not in this repo.
