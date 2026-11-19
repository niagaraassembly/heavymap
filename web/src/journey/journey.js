/* /journey: Telegraph content loaded live, with the page narrating its own assembly
 * (after Telepatch) beside the HeavyMap mark. The prerendered page is complete
 * without this script: it lists the local copies made at publish time (D-091). */

import "./journey.css";
import "../brand/heavy-element-loader.js";
import { getPage, nodeText, parseIndex, parsePost, readingMinutes, sanitize, telegraphPath } from "./telegraph.js";

const root = document.querySelector("[data-journey]");
const config = JSON.parse(document.getElementById("hm-journey-config")?.textContent || "{}");
const SECTIONS = config.sections || {};
const here = config.section; // "journey" on the landing page, else a section key

/* ---- narration ------------------------------------------------------------ */

const boot = root?.querySelector("[data-journey-boot]");
const lines = boot?.querySelector("[data-boot-lines]");
const mark = boot?.querySelector("heavy-element-loader");
const t0 = performance.now();
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
let seenBefore = false;
try { seenBefore = sessionStorage.getItem("hm-journey-boot") === "1"; sessionStorage.setItem("hm-journey-boot", "1"); } catch {}
const pause = (ms) => new Promise((r) => setTimeout(r, reduced || seenBefore ? 0 : ms));
const kb = (n) => (n < 1024 ? `${n} B` : `${(n / 1024).toFixed(1)} kB`);

async function say(label, text, cls = "") {
  if (!lines) return;
  const row = document.createElement("span");
  row.className = `jr-boot-line ${cls}`;
  const a = document.createElement("b"); a.textContent = label.padEnd(9, " ");
  row.append(a, document.createTextNode(text));
  lines.append(row);
  await pause(90);
}

async function done(summary) {
  await say("ready", `${summary} · ${Math.round(performance.now() - t0)} ms`, "is-ready");
  mark?.finish?.();
  if (!boot) return;
  setTimeout(() => boot.classList.add("is-folded"), reduced ? 0 : seenBefore ? 900 : 2600);
}

/* ---- rendering ------------------------------------------------------------ */

const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
};

/** Paths of every page in our collections, so links between posts stay inside /journey. */
const ownPaths = new Map();
const route = (href) => {
  const p = telegraphPath(href);
  return p && ownPaths.has(p) ? `/journey/${ownPaths.get(p)}/#${p}` : null;
};

function build(descriptors, parent) {
  for (const d of descriptors) {
    if (typeof d === "string") { parent.append(d); continue; }
    const e = document.createElement(d.tag);
    if (d.tag === "a") {
      e.href = d.href;
      if (!d.internal) { e.rel = "noopener"; e.target = "_blank"; }
    }
    if (d.tag === "img") { e.src = d.src; e.alt = ""; e.loading = "lazy"; e.referrerPolicy = "no-referrer"; }
    build(d.children || [], e);
    parent.append(e);
  }
}

function entryItem(entry, section) {
  const li = el("li", "jr-entry");
  const a = el("a", "jr-entry-title", entry.title);
  a.href = entry.path ? `/journey/${section}/#${entry.path}` : entry.url;
  const meta = el("div", "jr-meta");
  meta.append(entry.date || "");
  if (entry.minutes) meta.append(` · ${entry.minutes} min`);
  if (entry.tags.length) meta.append(" · ", el("span", "jr-tags", entry.tags.join(", ")));
  li.append(a, meta);
  if (entry.excerpt) li.append(el("p", "jr-excerpt", entry.excerpt));
  return li;
}

/* ---- loading collections -------------------------------------------------- */

async function loadIndex(key) {
  const c = SECTIONS[key];
  if (!c?.path) return { key, entries: config.fallback?.[key] ?? [], local: true };
  try {
    const { page, ms, bytes } = await getPage(c.path);
    const parsed = parseIndex(page.content);
    await say("index", `${c.name.toLowerCase()} · telegra.ph/${c.path} · ${ms} ms · ${kb(bytes)}`);
    for (const e of parsed.entries) if (e.path) ownPaths.set(e.path, key);
    return { key, entries: parsed.entries, intro: parsed.intro, local: false };
  } catch (err) {
    const entries = config.fallback?.[key] ?? [];
    await say("index", `${c.name.toLowerCase()} · telegra.ph unreachable · local copy (${entries.length})`, "is-warn");
    for (const e of entries) if (e.path) ownPaths.set(e.path, key);
    return { key, entries, local: true };
  }
}

async function landing() {
  await say("journey", `built ${config.built || ""} · ${Object.keys(SECTIONS).length} live sections`);
  const results = await Promise.all(Object.keys(SECTIONS).map(loadIndex));
  let total = 0;
  for (const r of results) {
    total += r.entries.length;
    const block = root.querySelector(`[data-journey-block="${r.key}"]`);
    if (!block) continue;
    const list = block.querySelector("[data-block-entries]");
    const count = block.querySelector("[data-block-count]");
    list.replaceChildren(...r.entries.slice(0, 3).map((e) => entryItem(e, r.key)));
    if (!r.entries.length) list.append(el("li", "jr-empty", "First posts on their way."));
    count.textContent = r.entries.length === 1 ? "1 post" : `${r.entries.length} posts`;
  }
  await done(`${total} posts`);
}

/* ---- a section ------------------------------------------------------------ */

let sectionEntries = [];

function renderList() {
  const list = root.querySelector("[data-section-entries]");
  if (!list) return;
  const q = (root.querySelector("[data-filter-text]")?.value || "").trim().toLowerCase();
  const tag = root.querySelector("[data-filter-tag]")?.value || "";
  const shown = sectionEntries.filter((e) =>
    (!tag || e.tags.includes(tag)) &&
    (!q || `${e.title} ${e.excerpt} ${e.tags.join(" ")}`.toLowerCase().includes(q)));
  list.replaceChildren(...shown.map((e) => entryItem(e, here)));
  if (!shown.length) list.append(el("li", "jr-empty", sectionEntries.length ? "Nothing matches those filters." : "First posts on their way."));
  const count = root.querySelector("[data-section-count]");
  if (count) count.textContent = shown.length === sectionEntries.length ? `${shown.length} posts` : `${shown.length} of ${sectionEntries.length} posts`;
}

function mountFilters() {
  const select = root.querySelector("[data-filter-tag]");
  if (select) {
    const tags = [...new Set(sectionEntries.flatMap((e) => e.tags))].filter((t) => t !== here).sort();
    select.replaceChildren(el("option", null, "All topics and places"), ...tags.map((t) => { const o = el("option", null, t); o.value = t; return o; }));
    select.firstChild.value = "";
  }
  root.querySelector("[data-journey-filters]")?.removeAttribute("hidden");
  root.querySelector("[data-filter-text]")?.addEventListener("input", renderList);
  select?.addEventListener("change", renderList);
}

async function section() {
  await say("journey", `${SECTIONS[here]?.name ?? here} · built ${config.built || ""}`);
  const r = await loadIndex(here);
  sectionEntries = r.entries;
  mountFilters();
  renderList();
  await done(`${r.entries.length} posts`);
  window.addEventListener("hashchange", showPost);
  showPost();
}

/* ---- a post --------------------------------------------------------------- */

async function showPost() {
  const path = decodeURIComponent(location.hash.slice(1));
  const listView = root.querySelector("[data-section-view]");
  const postView = root.querySelector("[data-post-view]");
  if (!path) { listView.hidden = false; postView.hidden = true; document.title = `${SECTIONS[here]?.name} · Journey · HeavyMap`; return; }
  listView.hidden = true; postView.hidden = false;
  postView.replaceChildren(el("p", "jr-meta", "Loading…"));
  let page;
  try {
    const t = performance.now();
    ({ page } = await getPage(path));
    postView.dataset.ms = String(Math.round(performance.now() - t));
  } catch {
    const local = (config.fallback?.[here] ?? []).find((e) => e.path === path);
    postView.replaceChildren(el("p", "jr-meta", "This post could not be loaded from Telegraph just now."));
    if (local) { const a = el("a", null, "Open it on telegra.ph"); a.href = local.url; postView.append(a); }
    return;
  }
  const post = parsePost(page.content);
  const article = el("article", "jr-post");
  if (post.tags.length) article.append(el("div", "jr-post-tags", post.tags.join(" · ")));
  article.append(el("h1", null, page.title));
  if (post.intro) { const bq = el("blockquote", "jr-standfirst"); build(sanitize(post.intro.children, { route }), bq); article.append(bq); }
  if (post.sections.length > 1) {
    const toc = el("nav", "jr-toc"); toc.setAttribute("aria-label", "Contents");
    toc.append(el("span", "jr-toc-label", "Contents"));
    const ol = el("ol");
    post.sections.forEach((s, i) => { const a = el("a", null, s.text); a.href = `#${path}`; a.dataset.section = String(i); ol.append(el("li")); ol.lastChild.append(a); });
    toc.append(ol); article.append(toc);
    toc.addEventListener("click", (ev) => {
      const a = ev.target.closest("a[data-section]");
      if (!a) return;
      ev.preventDefault();
      article.querySelectorAll(".jr-body h3")[Number(a.dataset.section)]?.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
    });
  }
  const body = el("div", "jr-body");
  build(sanitize(post.body, { route }), body);
  article.append(body);
  const about = el("div", "jr-about");
  const c = post.colophon;
  const bits = [c.type, c.run && `run ${c.run}`, c.stage && `stage ${c.stage}`, c.method && `method v${c.method}`].filter(Boolean);
  if (bits.length) about.append(el("span", null, bits.join(" · ")));
  const line = el("span");
  line.append(`${readingMinutes(post.body)} min · ${page.views ?? 0} views · loaded in ${postView.dataset.ms} ms · `);
  const tg = el("a", null, "Also on telegra.ph"); tg.href = page.url; tg.rel = "noopener"; tg.target = "_blank";
  line.append(tg);
  about.append(line);
  article.append(about);
  const i = sectionEntries.findIndex((e) => e.path === path);
  const nav = el("nav", "jr-pn"); nav.setAttribute("aria-label", "More in this section");
  const newer = sectionEntries[i - 1], older = sectionEntries[i + 1];
  const back = el("a", null, `← All ${SECTIONS[here]?.name ?? ""}`); back.href = `/journey/${here}/`;
  nav.append(back);
  if (older) { const a = el("a", null, `Earlier: ${older.title}`); a.href = `#${older.path}`; nav.append(a); }
  if (newer) { const a = el("a", null, `Next: ${newer.title}`); a.href = `#${newer.path}`; nav.append(a); }
  article.append(nav);
  postView.replaceChildren(article);
  document.title = `${page.title} · Journey · HeavyMap`;
  window.scrollTo(0, 0);
}

if (root) {
  root.classList.add("is-live");
  (here === "journey" ? landing() : section()).catch(async (err) => {
    await say("error", String(err?.message || err), "is-warn");
    mark?.finish?.();
  });
}

export { nodeText };
