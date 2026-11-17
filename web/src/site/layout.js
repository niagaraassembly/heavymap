/* The shared page frame for every prebuilt page (spec A section 6): head,
 * header, footer. Pure string rendering, used by build/prerender.mjs. */

import { escapeHtml as esc } from "../desk/escape.js";
import { headScript } from "./theme.js";

export const SITE_ORIGIN = "https://heavymap.com";

export const arrow =
  '<svg class="arrow-icon" viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"><path d="M3 13 13 3M3 3h10v10" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>';

export const bookIcon =
  '<svg width="17" height="17" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 4v13M10 4C7 2 4 2 2 3v12c3-1 5-1 8 2 3-3 5-3 8-2V3c-2-1-5-1-8 1Z" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>';

export const docsIcon =
  '<svg width="17" height="17" viewBox="0 0 20 20" aria-hidden="true"><path d="M5 2.8h7l3.4 3.4v11H5zM12 2.8v3.8h3.4M7.7 10h5.1M7.7 12.8h5.1M7.7 15.5h3.4" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/></svg>';
export const mapIcon =
  '<svg width="17" height="17" viewBox="0 0 20 20" aria-hidden="true"><path d="m2.5 4.5 5-2 5 2 5-2v13l-5 2-5-2-5 2zM7.5 2.5v13M12.5 4.5v13" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>';

const NAV = [
  { href: "/desks/", label: "Desks", section: "desks" },
  { href: "/reader/", label: "Reader", section: "reader", icon: bookIcon },
  { href: "/docs/", label: "Docs", section: "docs", icon: docsIcon },
  { href: "/map/", label: "Map", section: "map" },
];

/** `/a/b/` -> "a": which header item a path belongs to. */
const sectionOf = (path) =>
  path.split("/")[1] === "editions" || path.split("/")[1] === "read"
    ? "desks"
    : path.split("/")[1];

function header(path, themes) {
  const current = sectionOf(path);
  const links = NAV.map(
    (n) =>
      `<a href="${n.href}"${n.section === current ? ' aria-current="page"' : ""}${n.icon ? ' class="reader-nav"' : ""}>${n.icon ?? ""}${n.label}</a>`,
  ).join("");
  return `<header class="alt-header"><a class="wordmark" href="/">HeavyMap<img class="wordmark-mark" src="/heavy-element-mark.png" alt=""></a><nav aria-label="Main navigation">${links}</nav><a class="alt-follow" href="/subscribe/"${current === "subscribe" ? ' aria-current="page"' : ""}>Follow your regions</a>${themePicker(themes)}</header>`;
}

/* Map status words, as in pages.js: the selector names a place with its status. */
const MAP_STATUS_WORDS = {
  preparing: "in preparation",
  preview: "in preview",
  published: "open",
};

/**
 * The /map/ header keeps the brand, site menu, reader shortcut, and place selector.
 */
function mapHeader(regions) {
  const geos = regions.flatMap((r) =>
    (r.geographies ?? []).map((g) => ({ ...g, region: r.name })),
  );
  const current = geos[0];
  const options = geos
    .map(
      (g) =>
        `<li><span${g === current ? ' aria-current="true"' : ""}>${esc(g.name)} · ${esc(g.region)}</span><small>Map ${esc(MAP_STATUS_WORDS[g.map.status] ?? "not yet mapped")}</small></li>`,
    )
    .join("");
  return `<header class="alt-header alt-header--map">
    <a class="wordmark" href="/">HeavyMap<img class="wordmark-mark" src="/heavy-element-mark.png" alt=""></a>
    <div class="hm-site-menu" data-site-menu>
      <button type="button" class="hm-site-menu-toggle" data-site-menu-toggle aria-label="Open site menu" aria-haspopup="true" aria-expanded="false" aria-controls="hm-site-menu-panel"><span aria-hidden="true">▾</span></button>
      <div class="hm-site-menu-panel" id="hm-site-menu-panel" data-site-menu-panel hidden><ul><li><a href="/desks/">Desks</a></li><li><a href="/desks/western-new-york/">Western New York</a></li><li><a href="/desks/niagara-brant/">Niagara–Brant</a></li><li><a href="/reader/">Reader</a></li><li><a href="/map/" aria-current="page">Map</a></li><li><a href="/about/">About</a></li><li><a href="/about/credits/">Credits</a></li><li><a href="/preferences/">Email preferences</a></li></ul></div>
    </div>
    <div class="hm-map-utilities" data-map-utilities>
      <a class="hm-map-service" href="/reader/" aria-label="Reader" title="Reader">${bookIcon}</a>
      <a class="hm-map-service" href="/docs/" aria-label="Docs" title="Docs">${docsIcon}</a>
      <button class="hm-map-service" type="button" data-save-parcel aria-label="Saved items" title="Saved items" aria-haspopup="dialog" aria-controls="parcel-save-dialog"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 3.5h10v14l-5-3.4-5 3.4z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg></button>
      <button class="hm-map-service" type="button" data-note-parcel aria-label="Parcel notes" title="Add a note" aria-haspopup="dialog" aria-controls="parcel-notes-dialog"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m4 14.8-.7 2.9 2.9-.7L17 6.2 13.8 3zM12.8 4l3.2 3.2" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      <button class="hm-map-service" type="button" data-search-toggle aria-label="Search parcels" title="Search parcels"><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.3" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="m12.5 12.5 4 4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></button>
      <button class="hm-map-service hm-map-profile" type="button" data-local-account-open aria-haspopup="dialog" aria-controls="hm-local-account" aria-label="Your data" title="Manage your local data"><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="6.5" r="3.2" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M3.5 17c1-3.5 3.5-5 6.5-5s5.5 1.5 6.5 5" fill="none" stroke="currentColor" stroke-width="1.2"/></svg></button>
      <div class="hm-map-searchbox" data-map-searchbox hidden><label class="hm-visually-hidden" for="hm-map-search">Find a Hamilton parcel by key</label><input id="hm-map-search" type="search" placeholder="Paste parcel key" title="Open a Hamilton parcel record"><button type="button" data-search-close aria-label="Close search">×</button></div>
    </div>
    <div class="hm-map-header-spacer"></div>
    <div class="hm-place" data-place-selector><button type="button" class="hm-place-button" data-place-button aria-haspopup="true" aria-expanded="false" aria-controls="hm-place-panel"><span>${current ? `${esc(current.name)} · ${esc(current.region)}` : "No place yet"}</span> <span aria-hidden="true">▾</span></button><div class="hm-place-panel" id="hm-place-panel" data-place-panel hidden><ul>${options}</ul><p><a href="/about/">About HeavyMap</a></p><p><a href="/desks/">Desks &amp; places</a></p></div></div>
  </header><dialog class="hm-local-account" id="hm-local-account" aria-labelledby="hm-local-account-title"><div class="hm-local-account-head"><h2 id="hm-local-account-title">Your data</h2><button type="button" class="hm-local-account-close" data-local-account-close aria-label="Close">×</button></div><p class="hm-local-account-status" data-local-account-status role="status" aria-live="polite">Loading your local data…</p><ul class="hm-local-data-list" data-local-data-list></ul></dialog>`;
}

/** Prebuilt picker markup; hidden until theme-picker.js enhances it (spec D section 5). The button shows the flag only; the name is in the panel and the button's accessible name. */
function themePicker(themes) {
  return `<div class="hm-theme" data-theme-picker data-themes="${esc(JSON.stringify(themes))}" hidden><button type="button" class="hm-theme-button" data-theme-button aria-haspopup="listbox" aria-expanded="false" aria-controls="hm-theme-panel"><img class="hm-flag" data-theme-flag src="/flags/us.svg" alt="" height="12"> <span aria-hidden="true">▾</span></button><div class="hm-theme-panel" id="hm-theme-panel" data-theme-panel hidden><ul role="listbox" tabindex="-1" aria-label="Site theme"></ul><fieldset class="hm-theme-modes" data-theme-modes><legend>Light or dark</legend><label><input type="radio" name="hm-mode" value="light"> Light</label><label><input type="radio" name="hm-mode" value="dark"> Dark</label><label><input type="radio" name="hm-mode" value="auto"> Automatic</label></fieldset><p class="hm-theme-note" data-theme-only-light hidden>This theme has a light look only.</p><p class="hm-theme-note">Themes change the look only.</p><button type="button" class="hm-theme-reset" data-theme-reset>Reset to automatic</button><p class="hm-visually-hidden" role="status"></p></div></div>`;
}

function footer(regions) {
  const desks = regions
    .map((r) => `<a href="/desks/${esc(r.slug)}/">${esc(r.name)}</a>`)
    .join("");
  return `<footer class="alt-footer"><div><a class="wordmark" href="/">HeavyMap<img class="wordmark-mark" src="/heavy-element-mark.png" alt=""></a><p>Regional reporting. Geographic intelligence.</p></div><nav aria-label="Footer"><a href="/about/">About</a><a href="/about/credits/">Credits</a><a href="/reader/">Reader</a><a href="/preferences/">Email preferences</a>${desks}</nav></footer>`;
}

/**
 * A full HTML document.
 * @param {object} o
 * @param {string} o.path        canonical path, e.g. "/read/IEVT-2026-000001/"
 * @param {string} o.title       page title, without the site name
 * @param {string} o.description meta description
 * @param {string} o.main        HTML inside <main>
 * @param {object[]} o.regions   content regions, for the footer
 * @param {object} o.assets      { css: string[], js: string[] } paths relative to this page
 * @param {string} [o.bodyClass]
 * @param {string} [o.after]     HTML after the footer (the map's compact bottom bar)
 * @param {boolean} [o.preview]  preview build banner (spec D section 3)
 * @param {object[]} o.themes    themes available in this build: { id, country, name, modes }
 * @param {string} o.defaultTheme
 */
export function renderPage(o) {
  const title = o.title ? `${o.title} · HeavyMap` : "HeavyMap";
  const canonical =
    o.path === "/404.html"
      ? ""
      : `<link rel="canonical" href="${SITE_ORIGIN}${esc(o.path)}">`;
  const css = o.assets.css
    .map((href) => `<link rel="stylesheet" href="${esc(href)}">`)
    .join("");
  const js = o.assets.js
    .map((src) => `<script type="module" src="${esc(src)}"></script>`)
    .join("");
  const banner = o.preview
    ? '<p class="preview-banner" role="note">Preview · not public</p>'
    : "";
  return `<!doctype html>
<html lang="en" data-theme="us">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
${headScript(o.themes, o.defaultTheme)}
<meta name="theme-color" content="#f5f4ee">
<link rel="icon" type="image/png" href="/heavy-element-favicon.png">
<title>${esc(title)}</title>
<meta name="description" content="${esc(o.description)}">
${canonical}${o.path === "/404.html" ? '<meta name="robots" content="noindex">' : ""}
${css}${js}
</head>
<body class="alternate ${esc(o.bodyClass ?? "")}">
${banner}<a class="skip-link" href="#content">Skip to content</a>
${o.path === "/map/" ? mapHeader(o.regions) : o.path === "/docs/" ? docsHeader(o.themes) : header(o.path, o.themes)}
<main id="content" tabindex="-1">${o.main}</main>
${o.catalogue ? `<script type="application/json" id="hm-catalogue">${JSON.stringify(o.catalogue).replace(/</g, "\\u003c")}</script>` : ""}
${o.path === "/docs/" ? (o.after ?? "").replace("<!-- docs-theme-picker -->", themePicker(o.themes)) : `${footer(o.regions)}${o.path === "/map/" ? (o.after ?? "").replace("<!-- map-theme-picker -->", themePicker(o.themes)) : o.after ?? ""}`}
</body>
</html>
`;
}

function docsHeader(themes) {
  return `<header class="alt-header alt-header--docs"><a class="wordmark" href="/"><span>HeavyMap</span><img class="wordmark-mark" src="/heavy-element-mark.png" alt=""></a><nav aria-label="Services"><a class="hm-map-service" href="/map/" aria-label="Map" title="Map">${mapIcon}</a><a class="hm-map-service" href="/reader/" aria-label="Reader" title="Reader">${bookIcon}</a><a class="hm-map-service" href="/docs/" aria-label="Docs" title="Docs" aria-current="page">${docsIcon}</a></nav><span class="hm-docs-header-label">Docs</span></header>`;
}
