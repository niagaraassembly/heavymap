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
const notesIcon = '<svg width="17" height="17" viewBox="0 0 20 20" aria-hidden="true"><path d="m4 14.8-.7 2.9 2.9-.7L17 6.2 13.8 3zM12.8 4l3.2 3.2" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const savedIcon = '<svg width="17" height="17" viewBox="0 0 20 20" aria-hidden="true"><path d="M5 3.5h10v14l-5-3.4-5 3.4z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>';
const developmentIcon = '<svg width="17" height="17" viewBox="0 0 20 20" aria-hidden="true"><path d="M3 17V7l4 2V5l5 3V3h5v14H3Zm3-3h1m2 0h1m2 0h1m2 0h1" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/></svg>';

/* Reader, Docs and the map live in the service icons on the left, so the right side keeps only site pages. */
const NAV = [
  { href: "/about/", label: "About", section: "about" },
  { href: "/desks/", label: "Desks", section: "desks" },
  { href: "/journey/", label: "Journey", section: "journey" },
];

const accountButton = (className = "hm-map-service hm-map-profile") =>
  `<button class="${className}" type="button" data-local-account-open aria-haspopup="dialog" aria-controls="hm-local-account" aria-label="Your data" title="Manage your local data"><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="6.5" r="3.2" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M3.5 17c1-3.5 3.5-5 6.5-5s5.5 1.5 6.5 5" fill="none" stroke="currentColor" stroke-width="1.2"/></svg></button>`;
const accountDialog = `<dialog class="hm-local-account" id="hm-local-account" aria-labelledby="hm-local-account-title"><div class="hm-local-account-head"><h2 id="hm-local-account-title">Your data</h2><button type="button" class="hm-local-account-close" data-local-account-close aria-label="Close">×</button></div><p class="hm-local-account-status" data-local-account-status role="status" aria-live="polite">Loading your local data…</p><ul class="hm-local-data-list" data-local-data-list></ul></dialog>`;

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
  return `<header class="alt-header"><a class="wordmark" href="/"><span class="wordmark-type"><span class="wordmark-heavy">Heavy</span><span class="wordmark-map">Map</span></span><img class="wordmark-mark" src="/heavy-element-mark.png" alt=""></a>${serviceTabs(current)}<nav aria-label="Main navigation">${links}</nav><a class="alt-follow" href="/subscribe/"${current === "subscribe" ? ' aria-current="page"' : ""}>Follow your regions</a>${themePicker(themes)}${accountButton("hm-account-button")}</header>${accountDialog}`;
}

function serviceTabs(current = "") {
  const links = [
    ["/map/", "Parcel map", mapIcon, "map"],
    ["/reader/", "Reader", bookIcon, "reader"],
    ["/notes/", "Notes", notesIcon, "notes"],
    ["/saved/", "Saved items", savedIcon, "saved"],
    ["/development/", "Development", developmentIcon, "development"],
    ["/docs/", "Docs", docsIcon, "docs"],
  ];
  return `<nav class="hm-service-tabs" aria-label="HeavyMap services">${links.map(([href,label,icon,service]) => `<a class="hm-map-service" href="${href}" aria-label="${label}" title="${label}"${current === service ? ' aria-current="page"' : ""}>${icon}</a>`).join("")}</nav>`;
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
/** The city/region selector, shared by the map and every service bar; it sits just left of the account icon. */
function placeSelector(regions = []) {
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
  return `<div class="hm-place" data-place-selector><button type="button" class="hm-place-button" data-place-button aria-haspopup="true" aria-expanded="false" aria-controls="hm-place-panel"><span class="hm-place-label">${current ? `${esc(current.name)} · ${esc(current.region)}` : "No place yet"}</span> <span aria-hidden="true">▾</span></button><div class="hm-place-panel" id="hm-place-panel" data-place-panel hidden><ul>${options}</ul><p><a href="/about/">About HeavyMap</a></p><p><a href="/desks/">Desks &amp; places</a></p></div></div>`;
}

const searchIcon = '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.3" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="m12.5 12.5 4 4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';

/**
 * The /map/ header: brand, service icons, a divider, the parcel search (always open on wide
 * screens; an icon that takes over the bar on phones), then the place selector and account icon.
 */
function mapHeader(regions) {
  return `<header class="alt-header alt-header--map">
    <a class="wordmark" href="/"><span class="wordmark-type"><span class="wordmark-heavy">Heavy</span><span class="wordmark-map">Map</span></span><img class="wordmark-mark" src="/heavy-element-mark.png" alt=""></a>
    ${serviceTabs("map")}
    <span class="hm-bar-divider" aria-hidden="true"></span>
    <div class="hm-map-utilities" data-map-utilities>
      <button class="hm-map-service hm-map-search-toggle" type="button" data-search-toggle aria-label="Search parcels" title="Search parcels">${searchIcon}</button>
      <div class="hm-map-searchbox" data-map-searchbox><span class="hm-map-searchbox-icon">${searchIcon}</span><label class="hm-visually-hidden" for="hm-map-search">Find a Hamilton parcel by key</label><input id="hm-map-search" type="search" placeholder="Search parcels · paste a parcel key" title="Open a Hamilton parcel record"><button type="button" data-search-close aria-label="Close search">×</button></div>
    </div>
    <div class="hm-map-header-spacer"></div>
    ${placeSelector(regions)}
    ${accountButton()}
  </header>${accountDialog}`;
}

/** Prebuilt picker markup; hidden until theme-picker.js enhances it (spec D section 5). The button shows the flag only; the name is in the panel and the button's accessible name. */
function themePicker(themes) {
  return `<div class="hm-theme" data-theme-picker data-themes="${esc(JSON.stringify(themes))}" hidden><button type="button" class="hm-theme-button" data-theme-button aria-haspopup="listbox" aria-expanded="false" aria-controls="hm-theme-panel"><img class="hm-flag" data-theme-flag src="/flags/us.svg" alt="" height="12"> <span aria-hidden="true">▾</span></button><div class="hm-theme-panel" id="hm-theme-panel" data-theme-panel hidden><ul role="listbox" tabindex="-1" aria-label="Site theme"></ul><fieldset class="hm-theme-modes" data-theme-modes><legend>Light or dark</legend><label><input type="radio" name="hm-mode" value="light"> Light</label><label><input type="radio" name="hm-mode" value="dark"> Dark</label><label><input type="radio" name="hm-mode" value="auto"> Automatic</label></fieldset><p class="hm-theme-note" data-theme-only-light hidden>This theme has a light look only.</p><p class="hm-theme-note">Themes change the look only.</p><button type="button" class="hm-theme-reset" data-theme-reset>Reset to automatic</button><p class="hm-visually-hidden" role="status"></p></div></div>`;
}

function footer(regions) {
  const desks = regions
    .map((r) => `<a href="/desks/${esc(r.slug)}/">${esc(r.name)}</a>`)
    .join("");
  return `<footer class="alt-footer"><div><a class="wordmark" href="/"><span class="wordmark-type"><span class="wordmark-heavy">Heavy</span><span class="wordmark-map">Map</span></span><img class="wordmark-mark" src="/heavy-element-mark.png" alt=""></a><p>Regional reporting. Industrial Intelligence.</p></div><nav aria-label="Footer"><a href="/about/">About</a><a href="/about/credits/">Credits</a><a href="/reader/">Reader</a><a href="/preferences/">Email preferences</a>${desks}</nav></footer>`;
}

/* Social marks (24px grid, currentColor). */
const SOCIAL_ICONS = {
  x: '<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>',
  github: '<path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>',
  instagram: '<rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.4" cy="6.6" r="1.25"/>',
  facebook: '<path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z"/>',
  linkedin: '<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.85 1.637-1.75 3.37-1.75 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125zM7.119 20.452H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>',
};
const socialLink = ([icon, href, label]) =>
  `<a href="${href}" rel="me noopener" aria-label="${label}" title="${label}"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">${SOCIAL_ICONS[icon]}</svg></a>`;
const BABB_SOCIAL = [
  ["x", "https://x.com/babbworks", "Babb on X"],
  ["github", "https://github.com/babbworks", "Babb on GitHub"],
  ["instagram", "https://www.instagram.com/babbworks/", "Babb on Instagram"],
  ["facebook", "https://www.facebook.com/babbworks", "Babb on Facebook"],
  ["linkedin", "https://www.linkedin.com/company/babbworks/", "Babb on LinkedIn"],
];
const HEAVYMAP_X = ["x", "https://x.com/heavymapdotcom", "HeavyMap on X"];

/** Home only: title and links sit in the sky of an industrial landscape, above the works.
 * The photo's sky fades into the page surface (styles.css, "Home footer"). */
function homeFooter(regions) {
  const wordmark = `<a class="wordmark" href="/"><span class="wordmark-type"><span class="wordmark-heavy">Heavy</span><span class="wordmark-map">Map</span></span><img class="wordmark-mark" src="/heavy-element-mark.png" alt=""></a>`;
  const column = (heading, links) =>
    `<section><h2>${heading}</h2><ul>${links.map(([href, text]) => `<li><a href="${href}">${text}</a></li>`).join("")}</ul></section>`;
  const desks = regions.map((r) => [`/desks/${esc(r.slug)}/`, esc(r.name)]);
  return `<footer class="alt-footer hm-home-footer"><div class="hm-home-footer-top"><div class="hm-home-footer-brand">${wordmark}<p>Regional reporting. Industrial Intelligence.</p><a class="hm-home-footer-handle" href="${HEAVYMAP_X[1]}" rel="me noopener"><svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">${SOCIAL_ICONS.x}</svg>@heavymapdotcom</a></div><nav class="hm-home-footer-columns" aria-label="Footer">${column("Read", [["/reader/", "Reader"], ["/desks/", "The Desks"], ["/subscribe/", "Follow your regions"]])}${column("Desks", desks)}${column("HeavyMap", [["/map/", "Parcel map"], ["/about/", "About"], ["/about/credits/", "Credits"], ["/preferences/", "Email preferences"]])}</nav></div><div class="hm-home-footer-bottom"><div class="hm-home-footer-maker"><span>Product by Babb</span><nav class="hm-home-footer-social" aria-label="Babb elsewhere">${BABB_SOCIAL.map(socialLink).join("")}</nav></div><span>HeavyMap © ${new Date().getFullYear()}</span></div></footer>`;
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
${o.path === "/map/" ? mapHeader(o.regions) : mainService(o.path) ? docsHeader({ ...o.themes, service: o.path.slice(1, -1), regions: o.regions }) : header(o.path, o.themes)}
<main id="content" tabindex="-1">${o.main}</main>
${o.catalogue ? `<script type="application/json" id="hm-catalogue">${JSON.stringify(o.catalogue).replace(/</g, "\\u003c")}</script>` : ""}
${mainService(o.path) ? serviceBottom(o.themes, o.regions, o.path) : `${o.path === "/" ? homeFooter(o.regions) : footer(o.regions)}${o.path === "/map/" ? (o.after ?? "").replace("<!-- map-theme-picker -->", themePicker(o.themes)) : o.after ?? ""}`}
</body>
</html>
`;
}

const MAIN_SERVICES = new Set(["/reader/", "/notes/", "/saved/", "/development/", "/docs/"]);
const mainService = (path) => MAIN_SERVICES.has(path);

function docsHeader(options) {
  const create = options.service === "docs" ? '<div class="hm-docs-head-right"><button type="button" class="hm-docs-primary hm-docs-new" data-docs-create aria-label="New document"><span aria-hidden="true">＋</span><span class="hm-docs-new-label">New document</span></button><div class="hm-docs-head-actions" data-docs-header-editor hidden></div></div>' : "";
  return `<header class="alt-header alt-header--docs"><a class="wordmark" href="/"><span class="wordmark-type"><span class="wordmark-heavy">Heavy</span><span class="wordmark-map">Map</span></span><img class="wordmark-mark" src="/heavy-element-mark.png" alt=""></a>${serviceTabs(options.service)}${create}${placeSelector(options.regions)}${accountButton()}</header>${accountDialog}`;
}

function serviceBottom(themes, regions, currentPath) {
  const services = [
    ["/map/", "Parcel map", "Explore parcels, layers, and place."],
    ["/reader/", "Reader", "Regional reporting, together by place."],
    ["/notes/", "Notes", "A field journal for site observations."],
    ["/saved/", "Saved items", "Your saved parcels, stories, and records."],
    ["/development/", "Development", "A focused shelf for development records."],
    ["/docs/", "Documents", "Plans and working documents for a site."],
  ];
  const serviceLinks = services.map(([href, label, description]) =>
    `<a class="hm-directory-service" href="${href}"${href === currentPath ? ' aria-current="page"' : ""}><span>${label}</span><small>${description}</small></a>`,
  ).join("");
  const deskLinks = regions.map((region) =>
    `<a class="hm-directory-desk" href="/desks/${esc(region.slug)}/">${esc(region.name)}<span aria-hidden="true">↗</span></a>`,
  ).join("");
  const directory = `<div class="hm-directory-scrim" data-directory-scrim hidden><section class="hm-directory-panel" id="hm-site-directory" role="dialog" aria-modal="true" aria-labelledby="hm-directory-title" tabindex="-1"><div class="hm-directory-topline"><p class="hm-directory-kicker">HEAVYMAP · SITE DIRECTORY</p><button class="hm-directory-close" type="button" data-directory-close aria-label="Close site directory">×</button></div><div class="hm-directory-heading"><h2 id="hm-directory-title">A way through the map.</h2><p>Reporting, place, and the work around it—gathered in one place.</p></div><div class="hm-directory-columns"><section class="hm-directory-section" aria-labelledby="hm-directory-services"><h3 id="hm-directory-services">Services</h3><nav class="hm-directory-services" aria-label="HeavyMap services">${serviceLinks}</nav></section><section class="hm-directory-section" aria-labelledby="hm-directory-desks"><h3 id="hm-directory-desks">Regional desks</h3><nav class="hm-directory-desks" aria-label="Regional desks">${deskLinks}</nav><div class="hm-directory-footer-links"><a href="/subscribe/">Follow your regions</a><a href="/about/">About HeavyMap</a><a href="/about/credits/">Credits</a><a href="/preferences/">Email preferences</a></div></section></div><div class="hm-directory-foot"><a class="wordmark" href="/"><span class="wordmark-type"><span class="wordmark-heavy">Heavy</span><span class="wordmark-map">Map</span></span><img class="wordmark-mark" src="/heavy-element-mark.png" alt=""></a><span>Regional reporting. Industrial Intelligence.</span><a href="/map/">Return to the parcel map ${mapIcon}</a></div></section></div>`;
  return `${directory}<div class="hm-docs-bottom-bar"><a class="hm-service-return-map" href="/map/" aria-label="Open the parcel map" title="Open the parcel map">${mapIcon}<span>Open map</span></a><span class="hm-service-bottom-context">LOCAL WORKSPACE</span><span class="hm-docs-bottom-spacer"></span><button class="hm-directory-toggle" type="button" data-directory-toggle aria-label="Open site directory" aria-haspopup="dialog" aria-expanded="false" aria-controls="hm-site-directory" title="Open site directory"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 15V5m0 0L5.5 9.5M10 5l4.5 4.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>${themePicker(themes)}</div>`;
}
