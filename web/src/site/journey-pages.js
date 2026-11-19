/* /journey pages (D-088, D-093). Prerendered complete from local copies; journey.js then
 * loads the live Telegraph indexes and narrates it. */

import { escapeHtml as esc } from "../desk/escape.js";

export const JOURNEY_SECTIONS = [
  { key: "origins", name: "Origins", about: "Where HeavyMap came from: the UK atlas, the first Hamilton–Niagara attempt, and why we started again." },
  { key: "expansion", name: "Expansion", about: "Reports from each city run. Every run follows the same written method, and every run changes it a little." },
  { key: "systems", name: "Systems", about: "The machinery behind HeavyMap: the Assembly System, MAKE, Dispatch, Join, and the frameworks they rest on." },
];

const COMING = [
  ["Editorials", "Longer pieces on industry, place and making."],
  ["Building", "How the site and the map are made."],
  ["Data releases", "Each Industrial Atlas release and what changed."],
  ["Maps", "Versions of the map, city by city."],
  ["Decisions", "What we settled, and why."],
  ["Media", "Pictures, recordings and video from the work."],
  ["Repositories and docs", "Code and documentation, read in place."],
  ["Timeline", "Every milestone, in order."],
];

const entryHtml = (e, key) =>
  `<li class="jr-entry"><a class="jr-entry-title" href="${e.path ? `/journey/${esc(key)}/#${esc(e.path)}` : esc(e.url)}">${esc(e.title)}</a><div class="jr-meta">${esc(e.date)}${e.minutes ? ` · ${e.minutes} min` : ""}${e.tags.length ? ` · <span class="jr-tags">${esc(e.tags.join(", "))}</span>` : ""}</div>${e.excerpt ? `<p class="jr-excerpt">${esc(e.excerpt)}</p>` : ""}</li>`;

const boot = `<div class="jr-boot" data-journey-boot aria-live="polite"><heavy-element-loader mode="drift" transparent loading></heavy-element-loader><pre class="jr-boot-lines" data-boot-lines></pre></div>`;

function configScript(journey, section) {
  const sections = Object.fromEntries(
    JOURNEY_SECTIONS.map((s) => [s.key, { name: s.name, path: journey.collections[s.key]?.path ?? null, display: "list" }]),
  );
  for (const [key, col] of Object.entries(journey.collections)) {
    if (col.parent) sections[key] = { name: col.name, path: col.path, parent: col.parent, display: col.display || "list" };
  }
  const cfg = { section, sections, fallback: journey.fallback, built: new Date().toISOString().slice(0, 10) };
  return `<script type="application/json" id="hm-journey-config">${JSON.stringify(cfg).replace(/</g, "\\u003c")}</script>`;
}

export function journeyLanding(c) {
  const j = c.journey ?? { collections: {}, fallback: {} };
  const blocks = JOURNEY_SECTIONS.map((s) => {
    const entries = (j.fallback[s.key] ?? []).slice(0, 3);
    const n = (j.fallback[s.key] ?? []).length;
    return `<section class="jr-block" data-journey-block="${s.key}"><h2><a href="/journey/${s.key}/">${esc(s.name)}</a><small data-block-count>${n === 1 ? "1 post" : `${n} posts`}</small></h2><p>${esc(s.about)}</p><ul class="jr-entries" data-block-entries>${entries.map((e) => entryHtml(e, s.key)).join("") || '<li class="jr-empty">First posts on their way.</li>'}</ul></section>`;
  }).join("");
  const soon = COMING.map(([name, about]) => `<div class="jr-block jr-block--soon"><h2>${esc(name)}</h2><p>${esc(about)}</p></div>`).join("");
  return {
    path: "/journey/",
    title: "Journey",
    description: "Making HeavyMap, in the open: notes from building an industrial map of the world, one city at a time.",
    bodyClass: "hm-journey",
    main: `<div class="jr" data-journey>${boot}<h1>Making HeavyMap, in the open.</h1><p class="jr-lede">Notes from building an industrial map of the world, one city at a time. What we looked for, what we found, what we got wrong, and what we changed.</p><div class="jr-blocks">${blocks}</div><div class="jr-soon" aria-label="Coming sections">${soon}</div></div>${configScript(j, "journey")}`,
  };
}

/** Collections nested under a section (for example a run's field notes). */
const subCollections = (j) =>
  Object.entries(j.collections)
    .filter(([, col]) => col.parent)
    .map(([key, col]) => ({ key, ...col }));

const pathOf = (j, key) => {
  const col = j.collections[key];
  return col?.parent ? `/journey/${col.parent}/${key}/` : `/journey/${key}/`;
};

function listingPage(c, s, crumbs) {
  const j = c.journey ?? { collections: {}, fallback: {} };
  const subs = new Map(subCollections(j).map((x) => [x.path, x]));
  const entries = j.fallback[s.key] ?? [];
  const href = pathOf(j, s.key);
  const item = (e) => {
    const sub = e.path && subs.get(e.path);
    return sub
      ? `<li class="jr-entry jr-entry--collection"><a class="jr-entry-title" href="${pathOf(j, sub.key)}">${esc(e.title)}</a><div class="jr-meta"><span class="jr-kind">Collection</span></div>${e.excerpt ? `<p class="jr-excerpt">${esc(e.excerpt)}</p>` : ""}</li>`
      : entryHtml(e, s.key).replace(`/journey/${esc(s.key)}/#`, `${href}#`);
  };
  const stream = s.display === "stream";
  return {
    path: href,
    title: `${s.name} · Journey`,
    description: s.about,
    bodyClass: "hm-journey",
    main: `<div class="jr" data-journey>${boot}<p class="jr-crumb">${crumbs}</p><div data-section-view><h1>${esc(s.name)}</h1><p class="jr-lede">${esc(s.about)}</p><div class="jr-filters" data-journey-filters hidden><label class="hm-visually-hidden" for="jr-filter-text">Search ${esc(s.name)}</label><input id="jr-filter-text" type="search" maxlength="120" placeholder="Search titles, places, topics" data-filter-text><label class="hm-visually-hidden" for="jr-filter-tag">Topic or place</label><select id="jr-filter-tag" data-filter-tag></select><span data-section-count role="status"></span></div><p class="jr-display"><button type="button" class="jr-display-toggle" data-display-toggle hidden>${stream ? "Show as a list" : "Read as one page"}</button></p><ul class="jr-entries" data-section-entries>${entries.map(item).join("") || '<li class="jr-empty">First posts on their way.</li>'}</ul><div class="jr-stream" data-section-stream hidden></div></div><div data-post-view hidden></div></div>${configScript(j, s.key)}`,
  };
}

export function journeySection(c, s) {
  return listingPage(c, { ...s, display: "list" }, `<a href="/journey/">Journey</a> / ${esc(s.name)}`);
}

export function journeyCollection(c, col) {
  const parent = JOURNEY_SECTIONS.find((s) => s.key === col.parent);
  return listingPage(c, col, `<a href="/journey/">Journey</a> / <a href="/journey/${esc(col.parent)}/">${esc(parent?.name ?? col.parent)}</a> / ${esc(col.name)}`);
}

export const journeyPages = (c) => {
  const j = c.journey ?? { collections: {}, fallback: {} };
  return [
    journeyLanding(c),
    ...JOURNEY_SECTIONS.map((s) => journeySection(c, s)),
    ...subCollections(j).filter((x) => JOURNEY_SECTIONS.some((s) => s.key === x.parent)).map((x) => journeyCollection(c, x)),
  ];
};
