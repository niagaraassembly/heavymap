# Hamilton development records in the map

Status: provisional frontend consumer for the Hamilton field-screen package 0.1. This is not a change to the shared parcel dossier contract.

## Presentation

- The compact parcel card shows a development-record count only when the pinned parcel indicator package links one or more records.
- Selecting that count opens the parcel workspace, where each linked issued-permit row is shown in full.
- The map tray opens a city development snapshot with citywide issuance/value/GFA and focus categories; its visible caveats cover overlapping category totals, the explicit-text taxonomy, current-status limits, and the known monthly reconciliation gap.
- The snapshot opens a searchable all-record browser, including the 174 records without a parcel link. Results are paged in groups of 30; an optional focus filter emphasizes industrial, commercial, logistics and multi-unit records.
- The workspace keeps exact source-reported building/work categories alongside the versioned derived sector/action tags. Unspecified and otherwise broad source wording remains visible as the source value.
- Permit month is the report month. The UI states that these records establish issuance in that month, not current permit or project status.
- Site location is shown across the viewer. Source-reported owner/builder names are included only for the industrial, logistics, commercial and multi-unit focus profile; the UI labels them as source-reported and not independently verified. Contact addresses are not part of the viewer projection.
- The dedicated `/development/` screen reads the complete published Hamilton record package, with search, focus filtering, and 30-record pagination. It is separate from the browser-local saved-items shelf.

## Pinned package

The frontend reads an immutable package at `/map/data/ca-on-hamilton-development/2026-11-17-field-screen-v0.1/`, pinned from the data repository at commit `d8643957acca66399c089c12fb43721869fdaa65`. `HM_DEVELOPMENT_RELEASE_DIR` supplies the screened package directory to the site build. The build verifies the public manifest, every output hash, and each file schema, then copies the package byte-for-byte. The package omits company-review metadata, contact addresses, permit descriptions, extraction paths, and residual-file paths. **Open task:** restore source-reported permit descriptions through extraction, versioned normalization, and the viewer allowlist; display the original wording beside derived labels. This requirement supersedes the earlier decision to omit descriptions. Hashes are checked during copy and again in the browser before use. Unsupported schemas or hash mismatches leave the parcel record usable without development data. Set `HM_SITE_OUT_DIR` to a private output location when building with real Hamilton rows so generated pages remain outside the repository checkout.

The parcel index loads with the map to provide compact counts. Full viewer rows load on the first parcel workspace or general browser request and are cached for the browser session. The aggregate snapshot loads when the city overview opens. Package schema 0.1 is a provisional frontend/backend handoff.

## Boundaries

This work only adds the optional consumer, presentation, and its prepublish schema allowlist. It does not change parcel matching, source retention, or taxonomy decisions. No source rows or production artifacts belong in this repository. A build with `HM_DEVELOPMENT_RELEASE_DIR` must use the private, screened package directory as input; the environment variable is not configured by default.
