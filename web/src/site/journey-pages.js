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

const STAGES = ["A", "B", "C", "D", "E", "F", "G"];
const STAGE_NAMES = { A: "Prepare", B: "Map", C: "Enumerate", D: "Screen", E: "Connect", F: "Value", G: "Learn" };
const longDay = (iso) => {
  try { return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Toronto" }); } catch { return ""; }
};
const typeLabel = (t) => (t || "post").replace(/-/g, " ");

function feature(f, lead) {
  const p = f.post;
  const visual = f.image
    ? `<figure class="jr-feature-visual jr-feature-visual--photo"><img src="${esc(f.image)}" alt="${esc(f.alt || "")}" loading="${lead ? "eager" : "lazy"}"><figcaption>${esc(f.credit || "")}</figcaption></figure>`
    : f.stat
      ? `<div class="jr-feature-visual jr-feature-visual--stat" aria-hidden="true"><span class="jr-stat">${esc(f.stat)}</span><span class="jr-stat-label">${esc(f.statLabel || "")}</span></div>`
      : "";
  const sectionName = JOURNEY_SECTIONS.find((s) => s.key === p.section)?.name ?? p.section;
  return `<article class="jr-feature${lead ? " jr-feature--lead" : ""}">${visual}<div class="jr-feature-text"><p class="jr-kicker">${esc(sectionName)} · ${esc(typeLabel(p.type))}${p.run ? ` · run ${esc(p.run.replace("CR-00", ""))}` : ""}</p><h${lead ? 2 : 3} class="jr-feature-title"><a href="${esc(p.site)}">${esc(p.title)}</a></h${lead ? 2 : 3}>${p.excerpt ? `<p class="jr-feature-dek">${esc(p.excerpt)}</p>` : ""}<p class="jr-meta">${esc(longDay(p.created))}${p.minutes ? ` · ${p.minutes} min read` : ""}</p></div></article>`;
}

function runStrip(j) {
  return (j.runs ?? []).map((r) => {
    const at = STAGES.indexOf(r.stage);
    const pills = STAGES.map((s, i) => `<li class="${i < at || r.status !== "running" && i <= at ? "is-done" : i === at ? "is-now" : ""}" title="Stage ${s}: ${STAGE_NAMES[s]}"><b>${s}</b> ${STAGE_NAMES[s]}</li>`).join("");
    const href = j.collections[r.collection]?.parent ? `/journey/${j.collections[r.collection].parent}/${r.collection}/` : "/journey/expansion/";
    return `<a class="jr-run${r.status === "running" ? " is-running" : ""}" href="${href}"><span class="jr-run-status">${r.status === "running" ? "Now running" : "Earlier run"}</span><span class="jr-run-name">${esc(r.name)}</span><span class="jr-run-context">${esc(r.context || "")} · method ${esc(r.method || "")}</span><ol class="jr-run-stages" aria-label="Stages">${pills}</ol></a>`;
  }).join("");
}

export function journeyLanding(c) {
  const j = c.journey ?? { collections: {}, fallback: {}, featured: [], runs: [], counts: {} };
  const [lead, ...rest] = j.featured ?? [];
  const bands = JOURNEY_SECTIONS.map((s, i) => {
    const all = j.fallback[s.key] ?? [];
    const subs = Object.entries(j.collections).filter(([, col]) => col.parent === s.key);
    const subPaths = new Set(subs.map(([, col]) => col.path));
    const posts = all.filter((e) => !subPaths.has(e.path));
    const chips = subs.map(([key, col]) => {
      const n = (j.fallback[key] ?? []).length;
      return `<a class="jr-chip" href="/journey/${esc(s.key)}/${esc(key)}/" data-chip-path="${esc(col.path)}"><span>${esc(col.name)}</span><small data-chip-count>${n}</small></a>`;
    }).join("");
    return `<section class="jr-band" data-journey-block="${s.key}"><header class="jr-band-head"><p class="jr-band-number">${String(i + 1).padStart(2, "0")}</p><div><h2 class="jr-band-title"><a href="/journey/${s.key}/">${esc(s.name)}</a></h2><p class="jr-band-about">${esc(s.about)}</p></div><p class="jr-band-more"><a href="/journey/${s.key}/">All of ${esc(s.name)} <span aria-hidden="true">→</span></a><small data-block-count>${posts.length} posts</small></p></header><ul class="jr-band-entries" data-block-entries>${posts.slice(0, 3).map((e) => entryHtml(e, s.key)).join("") || '<li class="jr-empty">First posts on their way.</li>'}</ul>${chips ? `<nav class="jr-chips" aria-label="Collections in ${esc(s.name)}">${chips}</nav>` : ""}</section>`;
  }).join("");
  const soon = COMING.map(([name]) => `<li>${esc(name)}</li>`).join("");
  const counts = j.counts ?? {};
  return {
    path: "/journey/",
    title: "Journey",
    description: "Making HeavyMap, in the open: notes from building an industrial map of the world, one city at a time.",
    bodyClass: "hm-journey hm-journey-landing",
    main: `<div class="jr jr--wide" data-journey><header class="jr-masthead"><p class="jr-kicker">The HeavyMap Journey</p><h1 class="jr-masthead-title">Making HeavyMap, in the open.</h1><p class="jr-masthead-dek">Notes from building an industrial map of the world, one city at a time. What we looked for, what we found, what we got wrong, and what we changed.</p><p class="jr-issue-line"><span data-issue-posts>${counts.posts ?? 0} pieces</span> · ${JOURNEY_SECTIONS.length} sections · ${counts.collections ?? 0} collections · updated as we work</p>${boot}</header>${lead ? `<div class="jr-front">${feature(lead, true)}<div class="jr-front-side">${rest.map((f) => feature(f, false)).join("")}</div></div>` : ""}${(j.runs ?? []).length ? `<section class="jr-runs" aria-label="City runs"><h2 class="jr-section-label">City runs</h2><div class="jr-runs-list">${runStrip(j)}</div></section>` : ""}${bands}<footer class="jr-coming"><h2 class="jr-section-label">Coming to the Journey</h2><ul>${soon}</ul></footer></div>${configScript(j, "journey")}`,
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
