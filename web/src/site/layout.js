/* The shared page frame for every prebuilt page (spec A section 6): head,
 * header, footer. Pure string rendering, used by build/prerender.mjs. */

import { escapeHtml as esc } from "../desk/escape.js";
import { headScript } from "./theme.js";

export const SITE_ORIGIN = "https://heavymap.com";

export const arrow =
  '<svg class="arrow-icon" viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"><path d="M3 13 13 3M3 3h10v10" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>';

export const bookIcon =
  '<svg width="17" height="17" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 4v13M10 4C7 2 4 2 2 3v12c3-1 5-1 8 2 3-3 5-3 8-2V3c-2-1-5-1-8 1Z" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>';

const NAV = [
  { href: "/desks/", label: "Desks", section: "desks" },
  { href: "/reader/", label: "Reader", section: "reader", icon: bookIcon },
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
  return `<header class="alt-header"><a class="wordmark" href="/">HeavyMap<span aria-hidden="true">◒</span></a><span class="alt-header-caption">A closer reading of place.</span><nav aria-label="Main navigation">${links}</nav>${themePicker(themes)}<a class="alt-follow" href="/subscribe/"${current === "subscribe" ? ' aria-current="page"' : ""}>Follow your regions</a></header>`;
}

/** Prebuilt picker markup; hidden until theme-picker.js enhances it (spec D section 5). */
function themePicker(themes) {
  return `<div class="hm-theme" data-theme-picker data-themes="${esc(JSON.stringify(themes))}" hidden><button type="button" class="hm-theme-button" data-theme-button aria-haspopup="listbox" aria-expanded="false" aria-controls="hm-theme-panel"><span data-theme-name>United States</span> <span aria-hidden="true">▾</span></button><div class="hm-theme-panel" id="hm-theme-panel" data-theme-panel hidden><ul role="listbox" tabindex="-1" aria-label="Site theme"></ul><fieldset class="hm-theme-modes" data-theme-modes><legend>Light or dark</legend><label><input type="radio" name="hm-mode" value="light"> Light</label><label><input type="radio" name="hm-mode" value="dark"> Dark</label><label><input type="radio" name="hm-mode" value="auto"> Automatic</label></fieldset><p class="hm-theme-note" data-theme-only-light hidden>This theme has a light look only.</p><p class="hm-theme-note">Themes change the look only.</p><button type="button" class="hm-theme-reset" data-theme-reset>Reset to automatic</button><p class="hm-visually-hidden" role="status"></p></div></div>`;
}

function footer(regions) {
  const desks = regions
    .map((r) => `<a href="/desks/${esc(r.slug)}/">${esc(r.name)}</a>`)
    .join("");
  return `<footer class="alt-footer"><div><a class="wordmark" href="/">HeavyMap<span aria-hidden="true">◒</span></a><p>Regional reporting. Geographic intelligence.</p></div><nav aria-label="Footer"><a href="/about/">About</a><a href="/about/credits/">Credits</a><a href="/reader/">Reader</a><a href="/preferences/">Email preferences</a>${desks}</nav></footer>`;
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
 * @param {string} [o.after]     HTML after the footer (the map dock)
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
<title>${esc(title)}</title>
<meta name="description" content="${esc(o.description)}">
${canonical}${o.path === "/404.html" ? '<meta name="robots" content="noindex">' : ""}
${css}${js}
</head>
<body class="alternate ${esc(o.bodyClass ?? "")}">
${banner}<a class="skip-link" href="#content">Skip to content</a>
${header(o.path, o.themes)}
<main id="content" tabindex="-1">${o.main}</main>
${footer(o.regions)}${o.after ?? ""}
</body>
</html>
`;
}
