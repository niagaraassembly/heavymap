# Local v0 validation — 2026-10-17

This is synthetic interaction evidence, not a Hamilton-scale performance benchmark or G6 approval.

- Repository: 31 Python tests passed, planning index check passed with no missing paths.
- Fixture contract tests passed: six ordered bands, required claim stamps, derived inputs/methods, explicit refusal codes, complete evidence packet, lens membership, and a readable PMTiles/MVT archive.
- Five Chromium browser scenarios passed: exploration/search/style/layers/deep links/export; conditional camera restore across parcel switching and user zoom; direct user pan and centring between panels; 390×844 keyboard/mobile/reduced-motion/invalid-key handling; 206 range reads and failed archive handling.
- Export download was parsed and checked for all six bands and retained refusals. Community quotations and municipal records remain separate. No raw HTML rendering of fixture values.
- Visual inspection at 1440×1000 and 390×844: desktop opening, right dossier, mobile bottom sheet. View is schematic, not a representation of real land boundaries.
- Patched dependencies: MapLibre 6.14.0, PMTiles 4.3.0, Vite 7.3.7. `npm audit` reported zero known vulnerabilities on the checked lockfile. MapLibre's ESM worker needs explicit Vite `?worker&url` bundling; otherwise development renders chrome while source loading stalls.
- The archive is **768 bytes**, one z8 tile containing three invented polygons. Local `Range: bytes=0-126` returned 206, Content-Range and exactly 127 bytes. This does not establish GitHub Pages range behavior.

Measured compiled artifacts (decimal bytes, local build): HTML 2,955; CSS 94,048; main JS approximately 1,090,000; worker 506,242; archive 768. Approximately **1.70MB uncompressed**, approximately **461KB gzip** including the worker. These are artifact compression measurements, not network timings or guaranteed host compression. Fixture-record additions may move the last few bytes. Vite warns about engine bundle chunks over 500KB; no whole-city JSON is loaded. No external basemap/fonts/assets are requested by the prototype. The production budget remains under 300MB total and under 100MB per file.

Production limits remain untested: real parcel overlays and confidence calibration, accepted identity registry joins, address shards, detailed nature simplification, real city tile counts, mid-range phone timing, hosted range/CORS/cache behavior, Stadia/alternative provider terms, OSM/Overpass mode and refresh policy. The local watercolour option is a palette study, not Stadia Watercolor.

Not implemented: live Overpass/OSM, public sharing, accounts, notes, real municipal data, persistent camera/lens URLs or a standalone dossier page. Overpass and selected elements remain valid future options per Morgen's follow-up. No deploy workflow or publish command was added.
