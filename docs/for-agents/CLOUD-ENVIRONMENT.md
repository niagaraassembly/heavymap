# Cursor cloud environment (E3 atlas)

Status: starter, 2026-10-16. The repo routines are still being decided, so this setup is deliberately thin.

| Piece | Value |
| --- | --- |
| Repos | `niagaraassembly/heavymap` only (industrial-atlas later, if it becomes a repo) |
| Build | `bash scripts/cloud-install.sh`: Python check, byte-compile, unit tests, planning-index path check. No installs (stdlib only), no data pulls |
| Start | `bash scripts/cloud-start.sh`: nothing (no server; nothing published before G6) |
| Network | set in `.cursor/environment.json`: `egressMode: network_settings_only` + `egressAllowlist` (GitHub hosts, PyPI); add open-data hosts there once named |
| Secrets | none |

## Open questions tied to routines still being decided

1. **Data pulls from a cloud agent.** `DATASET-ROUTINE.md` keeps pulls in local `local-data/`. A cloud VM is disposable, so profiling there loses the raw pull. Allow cloud profiling (record facts only, then discard), or keep pulls to deb/local agents?
2. **Open-data allowlist.** Which publisher hosts (ArcGIS servers, portals) go on the environment allowlist? Comes from `Spreadsheets/16-service-profile.csv` once services are profiled.
3. **Draft skill.** `heavymap-planning/drafts/dataset-routine-SKILL.md` is unregistered; `.agents/skills/heavymap-dataset-profiling` only points at it. Promote it once the routine is approved (and settle `defer` vs `needs_more`, OPEN-DECISIONS 1).
4. **MCS authority** (OPEN-DECISIONS 5): may cloud agents edit `Spreadsheets/*.csv` at all, or only propose?
5. **`hm/fresh-foundation` (12 commits, CLI `scripts/hm`, registry, more tests).** If it lands, `cloud-install.sh` should run its tests and any `requirements` it adds.
6. **CI.** There is no GitHub workflow; should the same checks run on PRs?
7. **Lane.** Cloud agents take `agent:cloud` issues only (AGENTS.md); confirm routing rule Industrial Atlas → E3 should require that label.
