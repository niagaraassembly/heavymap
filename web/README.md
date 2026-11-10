# HeavyMap site design preview

The Vite entry page now previews the HeavyMap editorial container: home, Desks directory, Western New York and Niagara–Brant pages, an Issue One reading view, Hamilton mapping introduction, subscription selection/preferences, approach and credits.

Run `npm ci` then `npm run dev` from `/workspace/heavymap/web`. The root is the editorial site; `/map.html` preserves the original synthetic mapping prototype. The editorial site deliberately does not link to that unpublished application. No public deployment is configured or performed.

Routing uses local hash paths (`#/desks`, `#/desks/western-new-york/issue-one`, `#/mapping`, `#/subscribe`). Both editorial and map entries are included in `npm run build`; their JavaScript and CSS are separate, so the site does not load MapLibre.

Subscription forms are labelled design previews. They validate an email and demonstrate independent Desk choices, but do not store email, send requests, change subscriptions, or claim a subscription was completed. Kit/GitHub integration is deferred.

Content and photography come from the published Niagara Assembly site; source revision, dates, archive scope and image attribution are recorded in the credits view and `../heavymap-planning/frontend/SITE-DESIGN-PREVIEW.md`. This is a selection of nine stories, not a replacement for the full original edition. No Niagara–Brant issue is invented. The landscape art is explicitly schematic.

Checks: `npm test`, `npm run test:browser`, `npm run build`. Browser tests cover the existing map plus the editorial navigation, source disclosures, subscription preview, mobile overflow and keyboard entry.

---

# HeavyMap v0 — local field guide

The [spec](../heavymap-planning/frontend/V0-SPEC.md) was committed before prototype code. It records Morgen's vision, the later reopening of Overpass/selected OSM elements, layout alternatives, protocol mapping and questions. Related work: NA-32, NA-27, NA-11, NA-17. No MCS cells changed.

Everything on this map is invented: three parcel rectangles, source-role quotations, shares, roll aliases, addresses, nature and water shapes. The composition suggests Hamilton but is **not real parcel, Greenbelt, regulation or OSM geometry**. The names of the place and source roles are orientation labels, not observations. No downloaded municipal or personal data. No external tiles, keys, fonts, public API calls, proxy, telemetry or deployment tooling. Hamilton Stage B is not signed off (NA-269/NA-321). Building and testing deploy tooling is allowed; publication is separately approved.

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

See [VALIDATION.md](VALIDATION.md) for measured local results and limits. There is no deployment script or Pages workflow. Before any future real data build, use an explicit display-field allowlist across map, tooltip, dossier and export. Review the spec's open questions and Hamilton Stage B separately.

## Alternate editorial design

`alternate.html` preserves the first design at `index.html` and adds an editorial homepage, a full Reader workspace, and a map-strip reveal experiment. Reader starts with news, filters by material/region/search/read status, and remembers the last item and relative reading position in the namespaced `heavymap-reader-v1` browser key. It never reads Niagara Assembly's `na-reader` history or stores email. History can be forgotten; blocked/malformed storage falls back safely.

The preview catalogue deliberately includes only the selected Desk reporting plus two explicitly labelled HeavyMap documentation studies. It does not import Niagara Assembly's general publications. Findings/editorials and Niagara–Brant have honest empty states until eligible content is migrated.

The map-strip interaction reveals the existing synthetic map, with an explicit preview label and a bottom bar that returns to the previous page position. This is not a published Hamilton service. The map iframe loads only on request. Reader is adapted from patterns inspected in `niagaraassembly/site/assets/js/reader.js`; the actual publication migration and catalogue build pipeline remain separate work.

## Page styles for review

The selected second design now includes `alternate.html#/studies`, a review gallery for dedicated regional Desk pages, a complete edition layout using selected Issue One content, individual news briefs, and clearly unpublished documentation/editorial samples. Desktop and mobile examples use the same header, typography, colours and source-aware labels. Desk, edition, standalone reading and Reader routes connect without switching to the first design. The footer's Page studies link is a review aid, not a production navigation decision. No specification plan or publishing changes are included.
