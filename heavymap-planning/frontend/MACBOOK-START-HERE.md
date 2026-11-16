# MacBook: Niagara Assembly workspace entry point

Prepared 2026-11-10. This file recommends a working arrangement; it does not install services, configure synchronization, authorize publication or transfer write authority.

## Recommended layout

Use `~/Developer/niagaraassembly/` for checkouts, with separate sibling `inbox/` and `local-data/` folders. Do not create new clones under `~/na`. Keep project source, downloaded data and review bundles distinguishable. The earlier HeavyMap ZIP is a working-tree transfer, not a replacement for current repositories.

## Repository map

| Repository | Role | Start here |
| --- | --- | --- |
| niagaraassembly/heavymap | Selected frontend source, product contracts and design work | AGENTS.md; heavymap-planning/frontend/CLAUDE-HANDOFF.md; SPEC-PLAN.md |
| niagaraassembly/make | Maintained research/service components after NA-388 | Current README and agent instructions; discover owning component and installation contracts there |
| niagaraassembly/service-data | Private readable exports, research originals and explicit checkpoints | README.md; manifests/data-products.json |
| niagaraassembly/publish | Retained website/publication source after the research reorganization | Current README and owning publication instructions |
| niagaraassembly/site | Existing Niagara Assembly site and legacy Desk/Reader/Kit references | AGENTS.md; assets/js/reader.js; data/desks.json |
| niagaraassembly/na-research | Historical research, original packet/review context and pending PRs | README.md; recent PRs #181 and #183; research/routines/DELIVERY-2026-W44.md |

The roles of make/publish are recorded by na-research PR #183; inspect their current instructions before assuming entry points or installing anything. na-research is not the maintained implementation master. Industrial Atlas remains a separate backend/data owner; do not assume its full GIS data moved into service-data.

## First setup and ordinary refresh

Use existing GitHub authentication. If access fails, inspect the specific failure before requesting new credentials; never put tokens into this document or chat.

For a missing checkout, use `gh repo clone niagaraassembly/REPO ~/Developer/niagaraassembly/REPO`. For example:

    mkdir -p ~/Developer/niagaraassembly
    gh repo clone niagaraassembly/service-data ~/Developer/niagaraassembly/service-data

Clone the repos needed for the task; the first four are the principal source/data destinations. site and na-research are useful migration/reference checkouts. Git history and explicit data checkpoints are separate concerns.

At the start of a session, for relevant existing checkouts:

    git -C CHECKOUT status --short
    git -C CHECKOUT branch --show-current
    git -C CHECKOUT fetch origin --prune
    git -C CHECKOUT log -1 --format='%h %cs %s'

Fetching refreshes remote references, not the checked-out files. A clean local default-branch checkout can then use `git pull --ff-only`. If local work exists or the branch diverges, report it and preserve it; do not reset, clean, auto-stash, switch branches or overwrite a working tree to force a refresh. A feature branch should be reconciled deliberately rather than bulk-pulled by a generic updater.

For a task on an open PR, inspect/fetch its actual head. The default branch alone may not contain the relevant new data or implementation. Record the PR and revision used. Do not assume a successful fetch made a data product current.

## Data discovery and freshness

In service-data, read `manifests/data-products.json` first. Known paths as of this briefing:

- `exports/legacy-views/production-intel/`: production mirrors.
- `exports/legacy-views/approved-isolated-join-intel/`: approved isolated Join bay, explicitly NOT merged into production.
- `exports/legacy-views/operator-2026-11-07/manifest.json`: selected operator views and their provenance.
- `originals/research/`: retained research originals.
- `snapshots/2026-11-05-v2.json` plus `objects/`: historical native checkpoint and content-addressed bytes.

Read timestamps, source revisions, hashes and review state before using any product. These dated paths are discovery examples, not a permanent claim of freshness. Native service-owned stores remain authoritative on their designated writer; GitHub exports/checkpoints are not bidirectional database sync. Restored checkpoints are inspection replicas unless explicit authority says otherwise.

For news issues, distinguish packet arrival, reviewed records, approved isolated changes, production promotion, editorial selection and publication. At last inspection, both exported issue registers still listed only WNY Issue One as published. WNY Issue Two/Niagara–Brant Issue One material exists as research/prepared review material; do not label all of it publication-ready.

If newer accepted data exists on the writer but not in GitHub, the missing step is a fresh service-owned export/checkpoint—not another MacBook pull. Ask the owning service/operator for the exact product, freshness window and approved export. Do not mirror live databases or bulk copy native directories into a second writable store. A read-only authenticated service endpoint may be useful later, but needs its actual access contract and approved connectivity first.

## Preserve the current HeavyMap handoff

The supplied `heavymap-claude-handoff-2026-11-10.zip` contains uncommitted/untracked work absent from the remote. Read its START-HERE.md before overlaying anything. Do not apply TRACKED-CHANGES.patch after already overlaying the supplied files. Preserve both local and handoff work when reconciling.

Country themes are direction only; the base second design is selected. The newer SPEC-PLAN.md is a draft plan, not an implementation/publication authorization. The no-extra-testing quota instruction still applies until changed.

## Standing instruction to the MacBook agent

Before asking Morgen where something lives:

1. Read the relevant repository README/AGENTS and the HeavyMap handoff when working on that frontend.
2. Fetch the relevant repos, identify local changes and report which revisions/PRs are actually being used.
3. Discover data via service-data manifests and inspect its timestamp and approval state.
4. Name any missing/unexported/native-only data precisely. Do not guess that a historical mirror is current or promote it by copying it.
5. Keep a short session note: source revisions, data products/as-of dates, unresolved access/freshness gaps, and outputs changed. Do not repeatedly redo repository archaeology.

No automatic tests, builds, scans, timers, merges, sends or publication are authorized by this startup brief.

## Small improvements to make this fluid

Recommended follow-up decisions, not completed infrastructure:

- Assign one canonical owner-maintained workspace/repository registry in the existing MAKE/service-discovery home; avoid competing lists across projects. This file is a bootstrap copy until then.
- Have each data producer publish a small current-product manifest with observed/generated time, source revision, review/publication status, schema and hash. Define expected freshness per product rather than calling every export “live.”
- Provide a read-only “refresh/status” helper that fetches repos and reports drift/freshness, without mutating dirty branches or running expensive checks. Add periodic fetching only if requested; avoid automatic pulls/merges.
- Make accepted service changes trigger or require the corresponding approved export/update, so MacBook access does not depend on a person remembering where the newest local data sits.
- Separate GitHub access readiness from access to native services. Set up native-service connectivity only when a specific task needs it.

## Frontend is now available on GitHub

The earlier uncommitted frontend work, all design review images and the newer briefing/spec/data-location notes are now committed on `niagaraassembly/heavymap` branch `hm/desks-site-prototype`, draft PR https://github.com/niagaraassembly/heavymap/pull/85. Fetch this branch or PR for the latest continuation, rather than relying on the older transfer ZIP. Preserve any existing MacBook changes before checkout/reconciliation. No merge or publication has been performed.
