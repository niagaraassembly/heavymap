# HeavyMap v0 — local field guide

The [spec](../heavymap-planning/frontend/V0-SPEC.md) was committed before prototype code. It records Morgen's vision, the later reopening of Overpass/selected OSM elements, layout alternatives, protocol mapping and questions. Related work: NA-32, NA-27, NA-11, NA-17. No MCS cells changed.

Everything on this map is invented: three parcel rectangles, source-role quotations, shares, roll aliases, addresses, nature and water shapes. The composition suggests Hamilton but is **not real parcel, Greenbelt, regulation or OSM geometry**. The names of the place and source roles are orientation labels, not observations. No downloaded municipal or personal data. No external tiles, keys, fonts, public API calls, proxy, telemetry or deployment tooling. G6 remains closed.

## Run locally

Use Node 22.12+ (or compatible Node 20.19+).

```sh
cd web
npm ci
npm run dev
```

Open the loopback URL Vite prints, normally `http://127.0.0.1:5173`. Use HTTP, not `file://`. `npm run build` compiles a local ignored `dist/`; `npm run preview` serves that build locally. These commands do not publish anything. Vite binds to loopback; do not expose this dev server publicly.

## Explore

- Choose a lens; open one of the numbered map buttons or “Places to begin” entries.
- Search the three fixtures by sample title, civic-address placeholder, spine key or roll alias.
- Read all six bands. Expand “Source & method” to see separate retrieval/observation dates, join methods, inputs and limitations.
- Toggle the synthetic nature, regulation and community layers. The latter does not claim to be live OSM. Both palette studies are local MapLibre fills, not Stadia tiles or actual watercolour artwork.
- The right dossier centres the selection in remaining space. Close/Escape restores the original view only if you have not navigated the map; switching parcels retains that original view. On small screens use “Explore lenses” and the bottom dossier.
- Save local JSON to inspect the same claims and refusals. URL hashes select a sample and reopen its dossier on reload; they do not yet preserve full camera/lens state.

## Code and fixture boundary

`src/fixtures.js` holds the complete synthetic evidence model and single layer registry. `src/dossier.js` renders claims/refusals with text nodes (no raw source HTML), and exports the same packet. `src/map.js` owns MapLibre, PMTiles and camera state. `src/app.js` owns controls and selection.

`npm run fixture` deterministically regenerates `public/synthetic-parcels.pmtiles` (768 bytes) from the three invented geometries. The small writer in `scripts/make-fixture.mjs` encodes one z8 MVT tile in PMTiles v3 with no compression. This writer is deliberately **not** a general-purpose GIS pipeline. Its one tile and handcrafted shares demonstrate protocol/interaction, not large-scale tiling or area-overlay accuracy. Nature/context fixtures remain tiny GeoJSON in the app. No real data may be added here.

The browser uses PMTiles range reads; local Vite supports 206. MapLibre 6's worker is bundled explicitly via a Vite worker URL so development and the compiled build do not depend on a missing sibling worker file. The app never treats HTTP failure as a parcel refusal or an empty source.

## Verify

```sh
npm test
npm run test:browser
npm run build
```

Playwright uses system `/usr/bin/chromium` when available; otherwise install its Chromium (`npx playwright install chromium`), or set `CHROMIUM_PATH`. Tests use a loopback Vite server and software WebGL flags for headless machines. In the repo root also run:

```sh
python3 -m unittest discover -s tests
python3 scripts/check_index_paths.py
```

See [VALIDATION.md](VALIDATION.md) for measured local results and limits. There is no deployment script or Pages workflow. Before any future real data build, use an explicit display-field allowlist across map, tooltip, dossier and export. Review the spec's open questions and G6 separately.
