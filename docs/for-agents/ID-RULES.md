# ID rules

Principles: staging IDs are never sequential (parallel PRs cannot collide); canonical IDs are deterministic slugs; decision IDs are ULIDs; IDs are always **text** (never numbers - float-stored SBLs lose digits, see `docs/normalization/ny-sbl.md`).

| ID | Form | Allocated by | Where |
|---|---|---|---|
| `cand_id` | `CAND-` + 8 hex of SHA-256 over the canonical endpoint (lowercase scheme/host, no query, no trailing `/`) | `hm ids cand ENDPOINT` | `data/inbox/candidates.csv` |
| `service_id` | `svc-<jurisdiction>-<host-or-name>` | `hm ids service` | `services.csv` |
| `layer_id` | `lyr-<service slug>-<layer path slug>` (same endpoint, same id) | `hm ids layer` | `layers.csv` |
| `field_id` | `FLD-<layer slug>-<n or name>` | by hand, pattern checked | `fields.csv` |
| `rule_id` | `IDR-<layer slug>-<field>` | by hand, pattern checked | `identifier_rules.csv` |
| `quirk_id` | `Q-<layer short>-NN` (scoped sequence inside one layer; one slice owns a layer at a time) | by hand, pattern checked | `quirks.csv` |
| `join_id` | `JT-<layer short>-<spine key>-<method>-<YYYYMMDD>` | by hand | `join_tests.csv` |
| `score_id` | `SCR-<layer short>-v<formula>` | by hand | `scores.csv` |
| `claim_id` | `CLM-<layer short>-<fact>` | by hand | `claims.csv` |
| `deny_id` / `gate_id` | `DENY-<slug>` / `G<n>` | by hand | `deny_list.csv` / `gates.csv` |
| `run_id` | `RUN-<kind>-<YYYYMMDD>-<HHMM>-<jur>` | by hand | `scan_runs.csv`, `run_id` columns |
| `decision_id` | `DEC-<26-char ULID>` | the review UI (`hm ids decision` for a sample) | `review_decisions.csv` |
| Linear | `NIA-<number>` | Linear | `linear_id` columns |

Patterns are in `data/schema/table-schema.json` and enforced by `hm validate`; [TABLES.md](TABLES.md) lists them per column.

**Parcel identifiers** (New York) come only from `heavymap/ny_identifiers.py`: a 20-character `sbl20`, a 6-digit `swis6` (a municipality *name* is refused), and the 26-character `swis_sbl_id`. Inputs must be text; floats and bare integers are refused with a stable code. Print keys (`047.99-1-1`) are display attributes, never join keys. Sources and measured limits: `docs/normalization/ny-sbl-sources.md`, `docs/normalization/ny-sbl-real-data-evidence.md`. The Rochester local token decision is `docs/architecture/rochester-parcel-local-token.md`.

**Spine key** (unchanged): `hm:{country}:{region}:{jurisdiction}:{grain}:{local}`, see `docs/architecture/parcel-identity-spine.md`.

**Open:** whether a profiled layer maps to an MCS `dataset_id` and by what rule (`layers.mcs_dataset_id` stays blank until decided; DATASET-ROUTINE section 9).
