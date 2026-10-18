# Publish visibility

**Status:** accepted 2026-10-18 (Morgen). Linear **NA-269**. Universal back-end setting. Not a fifth product name.

Every dataset carries a `publish_visibility` value in the dataset inventory (`Spreadsheets/02-dataset-inventory-v4.csv`). The build reads that value and emits only what the setting allows. This is a screening and shipping rule, not a licence ledger and not a UI copy guide.

## Values

| Value | Meaning |
|---|---|
| `public` | Default. Allowlisted fields may ship in public output. |
| `restricted` | The dataset was paid for, or licence permission is unconfirmed. Values do not ship in public output. |
| `withheld` | No values ship. Whether the dataset is named in public output is `withheld_disclosure`. |
| `internal_only` | Never shipped and never mentioned in public output. Used only for internal checks. |

`restricted` is the paid-or-unconfirmed-licence class. It is not the same as `withheld` (a screening choice on a known source) or `internal_only` (never mentioned).

Existing inventory rows were left `public` when this column was added. Agents do not reclassify a row to `restricted` unless a packet says so.

## Restricted list (not in git)

Public files may say that a restricted dataset list exists. They do not list the restricted datasets, their paid status, or their licence papers.

The list itself is gitignored:

- live file (local only): `Spreadsheets/restricted/RESTRICTED-DATASETS.csv`
- committed template (headers only): `Spreadsheets/restricted/RESTRICTED-DATASETS.template.csv`
- committed README: `Spreadsheets/restricted/README.md`

The live file is the place for dataset ids, restriction kind (`paid` or `unconfirmed_licence`) and provenance notes. No pulled rows, no licence keys, no secrets.

**Future private repo.** Restricted atlas data and the infrastructure that holds it are planned for a private `ia-restricted` repository. Until that exists, pinned restricted inputs stay in git-ignored `local-data/` on machines that are allowed to hold them (today: Deb). Cursor cloud VMs cannot see `local-data/` (it is off git) and cannot reach ArcGIS, so they cannot run a full jurisdiction rebuild or the repeat-run proofs.

## `withheld_disclosure` (open; interim default)

A second setting, `withheld_disclosure`, chooses whether a `withheld` dataset appears as a manifest-level gap entry (`manifest_entry`) or is omitted (`none`). Morgen has not closed this. **Interim default: `manifest_entry`**, marked interim. Do not treat the interim default as a decision.

## Field-level withholding

A `public` dataset can still have individual fields screened (owner names, owner mailing addresses, legal descriptions, other personal fields). Those fields are never read into public output (HARD-RULES 2, D-13). The data-gaps ledger names the field and the screening rule (`withheld_screened`); it does not carry values.

Dossiers will signal that identifying information is held. Wording is a front-end and business decision tied to logged-in and paid tiers. This document does not write that copy.

## Repo split (timing pending)

Keep the mechanism in this repository for now. Move the back end to an `industrial-atlas` repo as soon as practical, leaving `heavymap` (local and GitHub) dedicated to the front end. Timing is pending Morgen confirmation.
