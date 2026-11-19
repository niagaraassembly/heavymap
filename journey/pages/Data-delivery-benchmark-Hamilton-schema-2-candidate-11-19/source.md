---
run: CR-001
place: ca-on-3525005-hamilton
place_type: city
country: ca
subdivision: on
city: hamilton
type: working-paper
evidence_date: 2026-11-16
---
Data delivery benchmark: Hamilton schema 2 candidate
working-paper, hamilton, hosting, releases, run-1

> A working paper written on 2026-11-16, published nearly as written. Local file paths, private repository names and personal names have been removed.

Date: 2026-11-16  
Scope: BL-045, before configuring a browser-facing release URL. This is a documented capability and size comparison; a deployed HTTP range/path smoke test remains outstanding. the owner authorized a pre-user public preview in D-071, and the selected data repo/release is now public.

## Candidate release size

The private release `ca-on-hamilton/2026-11-16-d070` contains 209,545,571 bytes of dossier data and a 23,446,297-byte parcel PMTiles archive: 232,991,868 bytes (about 222 MiB) before the small catalogue and site assets. This is one immutable release, not a projection of future release growth.

## Options

| Delivery path | Range / CORS | Size and access | Finding |
|---|---|---|---|
| Copy the selected release into the HeavyMap Pages build artifact at a versioned, same-origin path | PMTiles requires HTTP byte ranges. Protomaps documents GitHub Pages as a PMTiles host. Same-origin avoids cross-origin permission checks. A live response check is still required. | The candidate is about 222 MiB against GitHub Pages' 1 GiB published-site limit. It can be copied at build time without adding data rows or a binary archive to HeavyMap source history. The build would need authorized read access to the private data repo. | Best fit for D-036's existing direction to keep the data repo as source and pull the selected release into the HeavyMap Pages site, if the pre-launch smoke test passes. |
| Publish a separate Pages site from `industrial-atlas-data` | A separate origin requires CORS as well as range support. Protomaps says GitHub Pages can host PMTiles, but this candidate's cross-origin responses are not yet verified. | The repository is public by owner approval for this preview. Pages would add a separate origin and CORS boundary. | No advantage demonstrated for v1; adds a CORS and publication boundary. |
| Fetch GitHub Release assets directly from HeavyMap | Cross-origin redirect/range behavior and browser-readable CORS headers have not been measured for this private repo. | A browser viewer cannot use a private asset without credentials. Making the repository or asset public is a release action, gated by Stage A/B. | Not a viable current path; do not encode an asset URL. |
| Put the release in HeavyMap source or publish a separate object-storage host | Object storage can support byte ranges, but cross-origin delivery also requires configured CORS. | Adds data to the product repository or introduces a new service, credentials, configuration and cost surface without a demonstrated need at this size. | Not selected for this candidate. Revisit if site payload/bandwidth limits or deployment tests fail. |

## Recommendation and verification gate

Retain `industrial-atlas-data` as the immutable source of release truth. For a public HeavyMap build, copy only the selected release directory into the Pages artifact at a versioned same-origin path. Do not commit its rows or PMTiles file to HeavyMap source history. The data repository is public for the pre-user preview under D-071.

Before calling the preview complete, verify on the actual Pages endpoint:

1. `Range: bytes=0-16383` returns bytes that PMTiles can parse; test a later range too.
2. The returned `Content-Range` and `Content-Length` match the requested byte window and archive size.
3. The dossier manifest, `files.json`, selected shard, and parcel tile requests are readable at the same-origin versioned path.
4. The published artifact stays below 1 GiB and the expected audience can load it without credentials.

The preview is not a final launch declaration. The site workflow is manual and uses GitHub Actions (Pages settings report `build_type=workflow`; the source branch setting says `main`). The deploy workflow's `heavymap-public` environment approval remains required.

## Sources

- [Protomaps: Cloud Storage for PMTiles](https://docs.protomaps.com/pmtiles/cloud-storage) — HTTP range requirement, cross-origin CORS requirement, and GitHub Pages hosting note.
- [GitHub Docs: GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits) — published-site 1 GiB maximum and 100 GB/month soft bandwidth limit.
