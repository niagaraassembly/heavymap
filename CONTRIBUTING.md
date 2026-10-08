# Contributing to HeavyMap

HeavyMap is industrial intelligence for cross-border Niagara, built in the open. This file is for human contributors — humans opening issues, reviewing pull requests, or writing code or docs by hand. If you are an AI agent picking up work, read [AGENTS.md](AGENTS.md) first; its pickup contract (Linear labels, agent lanes) governs agent work and this file does not override it.

## Before you start

1. Read [docs/architecture/README.md](docs/architecture/README.md) — the four-concept product frame (Parcel Identity Spine, Context Band Ladder, PCDP, Claim & Refusal Contract). Nearly everything else in the product sits under this frame.
2. If your change touches a dataset (adds one, changes its status, changes what it feeds), read [AGENTS-MCS.md](AGENTS-MCS.md). The Master Control Spreadsheet is tracked in this repo under `Spreadsheets/` on purpose — when you edit the xlsx, update the matching CSV export in the same PR so reviewers can actually see what changed (GitHub doesn't render xlsx content, only the CSV shows as a table).
3. Prior-art code and docs (the original prototype, the UK atlas reference) live under [first-attempts/](first-attempts/) for citation only. Do not extend it as the product root.

## Two intake paths

- **Internal work** is tracked in the Linear project *Industrial Atlas* and follows the `agent-ready` + lane-label pickup contract in [AGENTS.md](AGENTS.md). That gate exists to keep AI agent lanes from picking up half-specified work — it is not a barrier aimed at human contributors.
- **External contributions** (an issue or PR from outside the core team) start as a GitHub issue or PR describing the problem and proposed change. A maintainer will confirm scope, or fold it into a Linear packet, before merge. If you're unsure whether something is in scope, open an issue first rather than a large PR.

## Making a change

- Keep pull requests scoped to one concern. For dataset work, prefer one `dataset_id` per PR unless the change is a genuine family.
- Cite the relevant Linear ID (`NIA-…`) in the PR body when one exists.
- If your PR changes any Master Control Spreadsheet cell, name the `dataset_id`(s) and summarize which cells changed, per [AGENTS-MCS.md](AGENTS-MCS.md). If it changes none, say so.
- Framework labels (`fw:pcdp`, `fw:spine`, `fw:bands`, `fw:claims`) and work-kind labels (`data-prep`, `protocol`, `docs`, `assessment`) describe a packet; they're informational on a human PR, not required.

## Scope boundaries

- UK geography is out of product scope. A UK capability pattern is a note in the MCS `uk_analogue` column, not a new geography row or dataset.
- The public site stays unpublished until data is reconciled. Don't add publish/deploy tooling ahead of that call.
- Geography v1 (the jurisdictions the product may currently speak about) is listed in [docs/architecture/README.md](docs/architecture/README.md). A name outside that list is `not_in_coverage` until an explicit lock adds it.

## Secrets and sensitive data

Never commit secrets, tokens, or credential files, or business-sensitive material that isn't meant for a public repo (market research, investor material, anything matching the repo's `.gitignore` business-docs patterns). The Master Control Spreadsheet is a deliberate exception to "keep data out of the repo" — it's tracked here on purpose for transparency and cross-machine sync — not a precedent for committing other private material. If you find a secret already committed, report the path and type in an issue and stop — a maintainer will revoke and scrub it, don't attempt that yourself.

## License

This project's license is being finalized — see the repository's `LICENSE` file for current status. By opening a pull request you agree your contribution may be distributed under whatever license the maintainers formally adopt for this repository.

## Questions

Open a GitHub issue, or check [AGENTS.md](AGENTS.md) for who holds decision authority on a given area.
