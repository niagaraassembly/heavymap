# Restricted datasets

A **restricted** dataset was paid for, or its licence permission is unconfirmed. That is a `publish_visibility` value on the dataset inventory. Universal wording: [docs/architecture/publish-visibility.md](../../docs/architecture/publish-visibility.md).

Public files may mention that this list exists. They do not name the restricted datasets.

## Files

| Path | In git? | Role |
|---|---|---|
| `RESTRICTED-DATASETS.template.csv` | yes | Headers only. Copy this to start a local list. |
| `RESTRICTED-DATASETS.csv` | no (gitignored) | Live list. Headers match the template. No real entries are committed. |
| this README | yes | This page. |

Do not commit `RESTRICTED-DATASETS.csv`. Do not put pulled rows, licence keys, tokens or secrets in this folder.

## Future private repo

Restricted atlas data and the infrastructure that holds it are planned for a private `ia-restricted` repository. Until that exists, pinned restricted inputs stay in git-ignored `local-data/` on machines allowed to hold them. Cursor cloud VMs do not have those inputs.

## Columns (template)

| Column | Meaning |
|---|---|
| `dataset_id` | Inventory key. Same id as sheet 02. |
| `working_name` | Short name. |
| `restriction_kind` | `paid` or `unconfirmed_licence`. |
| `licence_status` | Short status word. Not a licence text dump. |
| `acquired` | ISO date if known, else blank. |
| `rights_note` | Provenance only. No keys, no prices required. |
| `linked_issue` | Linear `NA-…` if any. |
| `notes` | Internal. |
