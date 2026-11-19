/* /journey: Telegraph content loaded live, with the page narrating its own assembly
 * (after Telepatch) beside the HeavyMap mark. The prerendered page is complete
 * without this script: it lists the local copies made at publish time (D-091).
 *
 * Collections have a display mode: "list" (default) or "stream" (every post in full,
 * one after another, each still a post of its own at its own address). */

import "./journey.css";
import "../brand/heavy-element-loader.js";
import { getPage, parseIndex, parsePost, readingMinutes, sanitize, telegraphPath } from "./telegraph.js";

const root = document.querySelector("[data-journey]");
const config = JSON.parse(document.getElementById("hm-journey-config")?.textContent || "{}");
const SECTIONS = config.sections || {};
const here = config.section; // "journey" on the landing page, else a section or collection key
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Site address of a section or collection page. */
const pageOf = (key) => {
  const s = SECTIONS[key];
  return s?.parent ? `/journey/${s.parent}/${key}/` : `/journey/${key}/`;
};
/** Telegraph path of a collection's base page -> its key. */
const collectionByPath = new Map(Object.entries(SECTIONS).filter(([, s]) => s.path).map(([k, s]) => [s.path, k]));

/* ---- narration ------------------------------------------------------------ */

const boot = root?.querySelector("[data-journey-boot]");
const lines = boot?.querySelector("[data-boot-lines]");
const mark = boot?.querySelector("heavy-element-loader");
const t0 = performance.now();
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
  if (boot) setTimeout(() => boot.classList.add("is-folded"), reduced ? 0 : seenBefore ? 900 : 2600);
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
  if (p && collectionByPath.has(p)) return pageOf(collectionByPath.get(p));
  return p && ownPaths.has(p) ? `${pageOf(ownPaths.get(p))}#${p}` : null;
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

function entryItem(entry, key) {
  const sub = entry.path && collectionByPath.get(entry.path);
  const li = el("li", sub ? "jr-entry jr-entry--collection" : "jr-entry");
  const a = el("a", "jr-entry-title", entry.title);
  a.href = sub ? pageOf(sub) : entry.path ? `${pageOf(key)}#${entry.path}` : entry.url;
  const meta = el("div", "jr-meta");
  if (sub) meta.append(el("span", "jr-kind", SECTIONS[sub]?.display === "stream" ? "Collection · read as one page" : "Collection"));
  else {
    meta.append(entry.date || "");
    if (entry.minutes) meta.append(` · ${entry.minutes} min`);
  }
  const tags = entry.tags.filter((t) => t !== "collection");
  if (tags.length) meta.append(" · ", el("span", "jr-tags", tags.join(", ")));
  li.append(a, meta);
  if (entry.excerpt) li.append(el("p", "jr-excerpt", entry.excerpt));
  return li;
}

/** One post's article: tags, title, standfirst, contents, body, about line. */
function article(page, path, { standalone = true, ms = 0 } = {}) {
  const post = parsePost(page.content);
  const art = el("article", standalone ? "jr-post" : "jr-post jr-post--inline");
  art.id = `post-${path}`;
  if (post.tags.length) art.append(el("div", "jr-post-tags", post.tags.join(" · ")));
  const h = el(standalone ? "h1" : "h2", standalone ? null : "jr-stream-title");
  if (standalone) h.textContent = page.title;
  else { const a = el("a", null, page.title); a.href = `#${path}`; h.append(a); }
  art.append(h);
  if (post.intro) { const bq = el("blockquote", "jr-standfirst"); build(sanitize(post.intro.children, { route }), bq); art.append(bq); }
  if (standalone && post.sections.length > 1) {
    const toc = el("nav", "jr-toc"); toc.setAttribute("aria-label", "Contents");
    toc.append(el("span", "jr-toc-label", "Contents"));
    const ol = el("ol");
    post.sections.forEach((s, i) => { const a = el("a", null, s.text); a.href = `#${path}`; a.dataset.section = String(i); const li = el("li"); li.append(a); ol.append(li); });
    toc.append(ol); art.append(toc);
    toc.addEventListener("click", (ev) => {
      const a = ev.target.closest("a[data-section]");
      if (!a) return;
      ev.preventDefault();
      art.querySelectorAll(".jr-body h3")[Number(a.dataset.section)]?.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
    });
  }
  const body = el("div", "jr-body");
  build(sanitize(post.body, { route }), body);
  art.append(body);
  const about = el("div", "jr-about");
  const c = post.colophon;
  const bits = [c.type, c.run && `run ${c.run}`, c.stage && `stage ${c.stage}`, c.method && `method ${c.method}`, c.status && `status: ${c.status}`].filter(Boolean);
  if (bits.length) about.append(el("span", null, bits.join(" · ")));
  const line = el("span");
  line.append(`${readingMinutes(post.body)} min · ${page.views ?? 0} views${ms ? ` · loaded in ${ms} ms` : ""} · `);
  const tg = el("a", null, "Also on telegra.ph"); tg.href = page.url; tg.rel = "noopener"; tg.target = "_blank";
  line.append(tg);
  if (!standalone) { line.append(" · "); const own = el("a", null, "Open on its own"); own.href = `#${path}`; line.append(own); }
  about.append(line);
  art.append(about);
  return art;
}

/* ---- loading collections -------------------------------------------------- */

async function loadIndex(key) {
  const c = SECTIONS[key];
  if (!c?.path) return { key, entries: config.fallback?.[key] ?? [], local: true };
  try {
    const { page, ms, bytes } = await getPage(c.path);
    const parsed = parseIndex(page.content);
    await say("index", `${c.name.toLowerCase()} · telegra.ph/${c.path} · ${ms} ms · ${kb(bytes)}`);
    for (const e of parsed.entries) if (e.path && !collectionByPath.has(e.path)) ownPaths.set(e.path, key);
    return { key, entries: parsed.entries, intro: parsed.intro, local: false };
  } catch {
    const entries = config.fallback?.[key] ?? [];
    await say("index", `${c.name.toLowerCase()} · telegra.ph unreachable · local copy (${entries.length})`, "is-warn");
    for (const e of entries) if (e.path && !collectionByPath.has(e.path)) ownPaths.set(e.path, key);
    return { key, entries, local: true };
  }
}

const countLabel = (entries) => {
  const posts = entries.filter((e) => !collectionByPath.has(e.path)).length;
  const subs = entries.length - posts;
  return [posts && `${posts} ${posts === 1 ? "post" : "posts"}`, subs && `${subs} ${subs === 1 ? "collection" : "collections"}`].filter(Boolean).join(" · ") || "0 posts";
};

async function landing() {
  const top = Object.keys(SECTIONS).filter((k) => !SECTIONS[k].parent);
  await say("journey", `built ${config.built || ""} · ${top.length} live sections`);
  const results = await Promise.all(top.map(loadIndex));
  let total = 0;
  for (const r of results) {
    total += r.entries.length;
    const block = root.querySelector(`[data-journey-block="${r.key}"]`);
    if (!block) continue;
    block.querySelector("[data-block-entries]").replaceChildren(...r.entries.slice(0, 3).map((e) => entryItem(e, r.key)));
    if (!r.entries.length) block.querySelector("[data-block-entries]").append(el("li", "jr-empty", "First posts on their way."));
    block.querySelector("[data-block-count]").textContent = countLabel(r.entries);
  }
  await done(`${total} entries`);
}

/* ---- a section or collection --------------------------------------------- */

let sectionEntries = [];
const postEntries = () => sectionEntries.filter((e) => e.path && !collectionByPath.has(e.path));
const display = () => {
  let mode = SECTIONS[here]?.display || "list";
  try { mode = localStorage.getItem(`hm-journey-display-${here}`) || mode; } catch {}
  return mode;
};

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
  if (count) count.textContent = shown.length === sectionEntries.length ? countLabel(sectionEntries) : `${shown.length} of ${sectionEntries.length}`;
}

/** Stream: every post in full, loaded in order as the reader scrolls toward it. */
function renderStream() {
  const stream = root.querySelector("[data-section-stream]");
  if (!stream) return;
  const posts = postEntries();
  stream.replaceChildren(...posts.map((e) => {
    const slot = el("section", "jr-stream-slot");
    slot.dataset.path = e.path;
    const h = el("h2", "jr-stream-title"); const a = el("a", null, e.title); a.href = `#${e.path}`; h.append(a);
    slot.append(h, el("p", "jr-meta", `${e.date}${e.minutes ? ` · ${e.minutes} min` : ""} · loading…`));
    return slot;
  }));
  let queue = Promise.resolve();
  const load = (slot) => {
    queue = queue.then(async () => {
      if (slot.dataset.loaded) return;
      slot.dataset.loaded = "1";
      try {
        const { page, ms } = await getPage(slot.dataset.path);
        slot.replaceChildren(article(page, slot.dataset.path, { standalone: false, ms }));
      } catch {
        slot.querySelector(".jr-meta").textContent = "Could not load this note just now. Open it on its own to retry.";
      }
    });
  };
  const io = "IntersectionObserver" in window
    ? new IntersectionObserver((xs) => xs.forEach((x) => { if (x.isIntersecting) { io.unobserve(x.target); load(x.target); } }), { rootMargin: "800px 0px" })
    : null;
  stream.querySelectorAll(".jr-stream-slot").forEach((s) => (io ? io.observe(s) : load(s)));
}

function applyDisplay() {
  const mode = display();
  const stream = mode === "stream";
  root.querySelector("[data-section-entries]").hidden = stream;
  root.querySelector("[data-section-stream]").hidden = !stream;
  root.querySelector("[data-journey-filters]")?.toggleAttribute("hidden", stream);
  const toggle = root.querySelector("[data-display-toggle]");
  if (toggle) {
    toggle.hidden = !postEntries().length;
    toggle.textContent = stream ? "Show as a list" : "Read as one page";
  }
  if (stream && !root.querySelector("[data-section-stream]").childElementCount) renderStream();
}

function mountControls() {
  const select = root.querySelector("[data-filter-tag]");
  if (select) {
    const tags = [...new Set(sectionEntries.flatMap((e) => e.tags))].filter((t) => t !== here && t !== "collection").sort();
    const all = el("option", null, "All topics and places"); all.value = "";
    select.replaceChildren(all, ...tags.map((t) => { const o = el("option", null, t); o.value = t; return o; }));
  }
  root.querySelector("[data-journey-filters]")?.removeAttribute("hidden");
  root.querySelector("[data-filter-text]")?.addEventListener("input", renderList);
  select?.addEventListener("change", renderList);
  root.querySelector("[data-display-toggle]")?.addEventListener("click", () => {
    const next = display() === "stream" ? "list" : "stream";
    try { localStorage.setItem(`hm-journey-display-${here}`, next); } catch {}
    applyDisplay();
  });
}

async function section() {
  await say("journey", `${SECTIONS[here]?.name ?? here} · built ${config.built || ""}`);
  const r = await loadIndex(here);
  sectionEntries = r.entries;
  mountControls();
  renderList();
  applyDisplay();
  await done(countLabel(r.entries));
  window.addEventListener("hashchange", showPost);
  showPost();
}

/* ---- one post on its own -------------------------------------------------- */

async function showPost() {
  const path = decodeURIComponent(location.hash.slice(1));
  const listView = root.querySelector("[data-section-view]");
  const postView = root.querySelector("[data-post-view]");
  if (!path) { listView.hidden = false; postView.hidden = true; document.title = `${SECTIONS[here]?.name} · Journey · HeavyMap`; return; }
  listView.hidden = true; postView.hidden = false;
  // Only pages listed in this page's own index render here; any other Telegraph path
  // in the hash would otherwise show someone else's page under heavymap.com.
  if (!postEntries().some((e) => e.path === path)) {
    const back = el("a", null, `All of ${SECTIONS[here]?.name ?? "this section"}`);
    back.href = pageOf(here);
    postView.replaceChildren(el("p", "jr-meta", "This post is not part of this section."), back);
    document.title = "Not found · Journey · HeavyMap";
    return;
  }
  postView.replaceChildren(el("p", "jr-meta", "Loading…"));
  let page, ms;
  try {
    const t = performance.now();
    ({ page } = await getPage(path));
    ms = Math.round(performance.now() - t);
  } catch {
    const local = postEntries().find((e) => e.path === path);
    postView.replaceChildren(el("p", "jr-meta", "This post could not be loaded from Telegraph just now."));
    if (local) { const a = el("a", null, "Open it on telegra.ph"); a.href = local.url; postView.append(a); }
    return;
  }
  const art = article(page, path, { standalone: true, ms });
  const posts = postEntries();
  const i = posts.findIndex((e) => e.path === path);
  const nav = el("nav", "jr-pn"); nav.setAttribute("aria-label", "More here");
  const back = el("a", null, `← All of ${SECTIONS[here]?.name ?? ""}`); back.href = pageOf(here);
  nav.append(back);
  const newer = posts[i - 1], older = posts[i + 1];
  if (older) { const a = el("a", null, `Earlier: ${older.title}`); a.href = `#${older.path}`; nav.append(a); }
  if (newer) { const a = el("a", null, `Next: ${newer.title}`); a.href = `#${newer.path}`; nav.append(a); }
  art.append(nav);
  postView.replaceChildren(art);
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
