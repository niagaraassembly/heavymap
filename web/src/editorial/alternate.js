import "./site.css";
import "./alternate.css";
import { roundTwoRoute, bindRoundTwo } from "./round-two.js";
import { studyRoute, bindStudyControls } from "./page-studies.js";
import { catalogue, kindLabels } from "./reader-catalog.js";
import {
  STORAGE_KEY,
  freshState,
  loadState,
  saveState,
  filterItems,
} from "./reader-state.js";
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const arrow =
  '<svg class="arrow-icon" viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"><path d="M3 13 13 3M3 3h10v10" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>';
document.querySelectorAll(".alt-follow, .alt-footer a").forEach((link) => {
  link.innerHTML = link.innerHTML.replaceAll("↗", arrow);
});
const asset = (name) => `${import.meta.env.BASE_URL}editorial/${name}`;
const byId = (id) => catalogue.find((i) => i.id === id);
let storage;
try {
  storage = window.localStorage;
} catch {
  storage = null;
}
let state = loadState(storage, catalogue),
  storageWorks = !!storage;
const content = document.getElementById("alt-content");
let currentItem = null,
  scrollTimer,
  queryTimer,
  readerOpener = null,
  mapOpener = null,
  savedSiteY = 0;
const date = (d) =>
  d
    ? new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(`${d}T12:00:00Z`))
    : "Design preview";
const stage = (s) =>
  ({
    approved_plan: "Approved plan",
    announced: "Announced",
    completed: "Completed",
    application: "Application",
    award: "Award",
    intent: "Intent",
  })[s] || s;
function save() {
  storageWorks = saveState(storage, state);
  if (!storageWorks) {
    const note = document.querySelector(".reader-storage p");
    if (note)
      note.textContent =
        "Browser storage is unavailable. Reader works, but cannot remember your place.";
  }
}
function book() {
  return '<svg width="19" height="19" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 4v13M10 4C7 2 4 2 2 3v12c3-1 5-1 8 2 3-3 5-3 8-2V3c-2-1-5-1-8 1Z" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>';
}
function landscape() {
  return `<svg viewBox="0 0 1400 310" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Schematic Hamilton landscape, not geographic data"><defs><pattern id="alt-grid" width="45" height="45" patternUnits="userSpaceOnUse"><path d="M45 0H0V45" fill="none" stroke="#416761" stroke-opacity=".12"/></pattern></defs><path fill="#dce3d4" d="M0 0H1400V310H0z"/><path fill="#b7d2d5" d="M400 0h1000v170l-150-30-160 20-110-42-130 13-105-67-120 1-92-32z"/><g fill="none" stroke="#9dab8e" stroke-width="1.3" opacity=".7"><path d="M-40 290Q220 42 460 190T880 225T1460 270"/><path d="M-40 310Q220 62 460 210T880 245T1460 290"/><path d="M-40 330Q220 82 460 230T880 265T1460 310"/><path d="M-40 350Q220 102 460 250T880 285T1460 330"/></g><path fill="url(#alt-grid)" d="M0 0H1400V310H0z"/><path d="m130 260 170-120 150 35 180 40" stroke="#a86746" stroke-dasharray="5 6" fill="none"/><g fill="#f5f4ee" stroke="#a86746"><circle cx="300" cy="140" r="5"/><circle cx="450" cy="175" r="5"/><circle cx="630" cy="215" r="5"/></g><g font-family="Georgia,serif" fill="#4f6963" font-size="17"><text x="284" y="122">Hamilton</text><text x="428" y="204">Niagara</text><text x="607" y="244">Buffalo</text><text x="1060" y="68" font-style="italic" fill="#6d9297">Lake Ontario</text></g></svg>`;
}
function resumeLine() {
  const item = byId(state.current);
  return item
    ? `<div class="return-line"><span class="status-dot"></span><p>You left off with <a href="#/reader?item=${encodeURIComponent(item.id)}">${esc(item.title)}</a>.</p><a class="return-action" href="#/reader?item=${encodeURIComponent(item.id)}">Continue reading ${arrow}</a><button type="button" data-forget>Forget history</button></div>`
    : `<div class="return-line"><span class="status-dot"></span><p>Two regional Desks. One place to look closer.</p><a class="return-action" href="#/reader">Open Reader ${arrow}</a></div>`;
}
function home() {
  const lead = catalogue[0];
  return `<section class="edition-top"><div><span class="eyebrow">The regional edition</span><h1>Places change.<br /><em>Keep a closer eye.</em></h1></div><p>Industry, investment and the land behind them. <br />Regional reporting and geographic intelligence, <br />with the evidence left in view.</p></section>${resumeLine()}<section class="map-strip" aria-labelledby="map-strip-title">${landscape()}<div class="map-strip-copy"><p class="eyebrow">A different view of the region</p><h2 id="map-strip-title">The geography<br />behind the story.</h2></div><button type="button" class="map-peek" data-open-map><span><strong>Hamilton, Ontario</strong><small>Preparing for launch · Synthetic interaction preview</small></span><span class="map-peek-arrow" aria-hidden="true">↗</span></button></section><div class="strip-key"><span>Illustrative landscape · Not a live map</span><span>Read the region. Explore the land.</span></div><section class="alt-news-section"><div class="alt-section-head"><div><p class="eyebrow">On the record</p><h2>From the Desks</h2></div><a class="text-link" href="#/reader">All news in Reader ${arrow}</a></div><div class="news-layout"><article class="lead-story"><a class="lead-image" href="#/read/${lead.id}"><img src="${asset("buffalo-grain-elevators.jpg")}" alt="Buffalo grain elevators, archival regional photograph"/><span>Western New York / Issue One</span></a><p class="eyebrow">Buffalo, New York <span class="stage">Announced</span></p><h3><a href="#/read/${lead.id}">${esc(lead.title)}</a></h3><p>${esc(lead.summary)}</p><a class="text-link" href="#/read/${lead.id}">Read the finding ${arrow}</a><p class="archive-date">From Issue One · 10 October 2026 · Historical reporting</p></article><div class="news-side">${catalogue
    .slice(1, 4)
    .map(
      (s, i) =>
        `<article class="dispatch"><span class="dispatch-number">0${i + 2}</span><div><p class="eyebrow">${esc(s.place)} <span class="stage">${stage(s.stage)}</span></p><h3><a href="#/read/${s.id}">${esc(s.title)}</a></h3><p>${esc(s.summary)}</p><a class="text-link" href="#/reader?item=${s.id}" data-reader-launch>Read in Reader ${arrow}</a></div></article>`,
    )
    .join(
      "",
    )}</div></div></section><section class="reader-invitation"><div class="reader-symbol">${book()}</div><div><p class="eyebrow">One Reader. A wider field of view.</p><h2>Follow a story.<br /><em>Stay with the evidence.</em></h2><p>News first. Findings, editorials and documentation when you want to go deeper. Filter by region or material, and pick up where you left off.</p></div><div><a class="button" href="#/reader">Open Reader ${arrow}</a><span>Reading history stays in this browser.<br />No account needed.</span></div></section><section class="alt-region-section" id="desks"><div class="alt-section-head"><div><p class="eyebrow">Choose your field of view</p><h2>Your regional Desks</h2></div><a class="text-link" href="index.html#/subscribe">Follow one or both ${arrow}</a></div><div class="region-pair"><article><span class="eyebrow">01 / New York, United States</span><h3>Western New York</h3><p>From the Niagara River to Syracuse. Investment, facilities, jobs and new ventures.</p><div><a class="text-link" href="#/desks/western-new-york">Read the Desk ${arrow}</a><a href="index.html#/subscribe?desk=western-new-york">Subscribe +</a></div></article><article><span class="eyebrow">02 / Ontario, Canada</span><h3>Niagara–Brant</h3><p>The Niagara Peninsula, Hamilton and Brantford. Industrial economies across connected places.</p><div><a class="text-link" href="#/desks/niagara-brant">Explore the Desk ${arrow}</a><a href="index.html#/subscribe?desk=niagara-brant">Subscribe +</a></div></article></div></section>`;
}
function readerShell() {
  return `<section class="reader-page"><header class="reader-heading"><div><p class="eyebrow">A single door into HeavyMap</p><h1>Reader<span class="count">${catalogue.length.toString().padStart(2, "0")}</span></h1></div><p>News, findings, editorials and documentation.<br />Your place is remembered in this browser only.</p><a class="text-link" href="#/">Back to the edition ${arrow}</a></header><div class="reader-types" role="group" aria-label="Material type">${["news", "findings", "editorials", "documentation", "all"].map((k) => `<button type="button" data-kind="${k}" aria-pressed="${state.filters.kind === k}">${kindLabels[k]}</button>`).join("")}</div><button type="button" class="reader-library-toggle" id="reader-library-toggle" aria-expanded="true" aria-controls="reader-library">Browse & filter <span aria-hidden="true">−</span></button><div class="reader-workspace"><aside id="reader-library" class="reader-library" aria-label="Reader library"><div class="reader-filter-row"><label for="reader-region">Region</label><select id="reader-region"><option value="all">All regions</option><option value="western-new-york">Western New York</option><option value="niagara-brant">Niagara–Brant</option><option value="heavymap">HeavyMap</option></select></div><label class="sr-only" for="reader-search">Search readable material</label><input id="reader-search" type="search" placeholder="Search the material…" value="${esc(state.filters.query)}"/><label class="unread-option"><input id="unread-only" type="checkbox" ${state.filters.unreadOnly ? "checked" : ""}/> Unread only</label><div class="library-count" id="library-count" role="status"></div><div id="reader-list" class="reader-list"></div><div class="reader-storage"><p>${storageWorks ? "Your place and filters stay on this device." : "Browser storage is unavailable. Reader works, but cannot remember your place."}</p><button type="button" data-forget>Forget reading history</button></div></aside><div class="reader-document"><div class="document-navigation"><button type="button" id="reader-prev" aria-label="Previous item">← Previous</button><span id="reader-position"></span><button type="button" id="reader-next" aria-label="Next item">Next →</button></div><div id="reader-scroll" class="reader-scroll" tabindex="0" aria-label="Reading pane"><article id="reader-article"></article></div><div class="document-bottom"><span id="reading-progress">Your place is saved as you scroll</span><button type="button" id="mark-read">Mark as read</button></div></div></div></section>`;
}
function article(item) {
  return `<div class="article-from"><span>${esc(item.publication)}</span><span>${kindLabels[item.kind]}</span></div><p class="eyebrow">${item.status === "preview" ? "HeavyMap documentation · Design preview, not a published edition" : `Issue One <span class="dot-separator">/</span> ${date(item.date)} · Archived reporting`}</p>${item.stage ? `<span class="stage">${stage(item.stage)}</span>` : ""}<h2>${esc(item.title)}</h2>${item.place ? `<p class="article-place">${esc(item.place)}</p>` : ""}<p class="reader-lede">${esc(item.summary)}</p>${item.sections ? item.sections.map((s) => `<section><h3>${esc(s.heading)}</h3><p>${esc(s.text)}</p></section>`).join("") : `<aside class="reader-context"><p class="eyebrow">Read in context</p><p>This finding was published in Western New York Issue One on 10 October 2026. Its statements and project stage reflect that edition’s sources, not a current status update.</p></aside><section class="reader-sources"><h3>Sources & context</h3>${item.sources.map((s) => `<a href="${esc(s.url)}"><span>${esc(s.kind)} source · ${esc(s.publisher)}</span><strong>${esc(s.title)} ${arrow}</strong></a>`).join("")}</section><a class="text-link" href="#/editions/western-new-york/issue-one">Read the edition ${arrow}</a>`}<div class="reading-end"><span></span><p>Keep the source close. Keep the questions open.</p></div>`;
}
function rememberProgress() {
  if (!currentItem) return;
  const el = document.getElementById("reader-scroll");
  if (!el) return;
  const max = el.scrollHeight - el.clientHeight;
  state.progress[currentItem.id] =
    max > 0 ? Math.max(0, Math.min(1, el.scrollTop / max)) : 0;
  save();
}
function resultList() {
  return filterItems(catalogue, state);
}
function updateList() {
  const items = resultList();
  document
    .querySelectorAll("[data-kind]")
    .forEach((b) =>
      b.setAttribute(
        "aria-pressed",
        String(b.dataset.kind === state.filters.kind),
      ),
    );
  document.getElementById("library-count").textContent =
    `${items.length} ${items.length === 1 ? "item" : "items"}${state.filters.unreadOnly ? " · unread" : ""}`;
  document.getElementById("reader-list").innerHTML = items.length
    ? items
        .map(
          (item) =>
            `<button type="button" data-item="${item.id}" class="library-item ${currentItem?.id === item.id ? "selected" : ""}" ${currentItem?.id === item.id ? 'aria-current="true"' : ""}><span>${esc(item.publication)}<i>${state.read.includes(item.id) ? "Read" : item.status === "preview" ? "Preview" : "News"}</i></span><strong>${esc(item.title)}</strong><small>${date(item.date)}</small></button>`,
        )
        .join("")
    : `<div class="library-empty"><p>No material matches.</p><button type="button" id="reset-filters">Reset filters</button></div>`;
  document
    .querySelectorAll("[data-item]")
    .forEach((b) =>
      b.addEventListener("click", () => showItem(byId(b.dataset.item))),
    );
  document.getElementById("reset-filters")?.addEventListener("click", () => {
    rememberProgress();
    state.filters = freshState().filters;
    document.getElementById("reader-region").value = "all";
    document.getElementById("reader-search").value = "";
    document.getElementById("unread-only").checked = false;
    applyFilters();
  });
  updateNavigation();
}
function updateNavigation() {
  const list = resultList(),
    index = list.findIndex((i) => i.id === currentItem?.id);
  document.getElementById("reader-position").textContent =
    index >= 0 ? `${index + 1} / ${list.length}` : "No selection";
  document.getElementById("reader-prev").disabled = index <= 0;
  document.getElementById("reader-next").disabled =
    index < 0 || index >= list.length - 1;
  document.getElementById("mark-read").disabled = !currentItem;
  document.getElementById("mark-read").textContent =
    currentItem && state.read.includes(currentItem.id)
      ? "Mark as unread"
      : "Mark as read";
}
function showEmpty() {
  currentItem = null;
  document.getElementById("reader-article").innerHTML =
    `<div class="reader-empty"><p class="eyebrow">Room to grow</p><h2>${state.filters.region === "niagara-brant" ? "The Niagara–Brant Desk." : state.filters.kind === "editorials" ? "Editorials, in time." : state.filters.kind === "findings" ? "A place for findings." : "A different field of view."}</h2><p>${state.filters.region === "niagara-brant" ? "No Niagara–Brant material has been migrated into this preview. The Desk already has a home on Niagara Assembly." : "There is no matching material in this preview. News is drawn from the published Western New York Issue One; the two HeavyMap guides are labelled design previews."}</p>${state.filters.region === "niagara-brant" ? '<a class="text-link" href="https://niagaraassembly.com/desks/ca/on/niagara-brant/">Visit the existing Desk ↗</a>' : '<button type="button" class="button" id="show-news">Back to news →</button>'}</div>`;
  document.getElementById("show-news")?.addEventListener("click", () => {
    state.filters = freshState().filters;
    document.getElementById("reader-region").value = "all";
    document.getElementById("reader-search").value = "";
    document.getElementById("unread-only").checked = false;
    applyFilters();
  });
  document.getElementById("reading-progress").textContent = "No item selected";
  updateNavigation();
}
function showItem(item, { rememberPrevious = true } = {}) {
  if (rememberPrevious) rememberProgress();
  if (!item) {
    showEmpty();
    updateList();
    return;
  }
  currentItem = item;
  state.current = item.id;
  save();
  document.getElementById("reader-article").innerHTML = article(item);
  history.replaceState(
    null,
    "",
    `#/reader?item=${encodeURIComponent(item.id)}`,
  );
  const scroll = document.getElementById("reader-scroll");
  const ratio = state.progress[item.id] || 0;
  requestAnimationFrame(() => {
    if (currentItem?.id !== item.id) return;
    scroll.scrollTop =
      ratio * Math.max(0, scroll.scrollHeight - scroll.clientHeight);
    document.getElementById("reading-progress").textContent =
      ratio > 0
        ? `Resumed at ${Math.round(ratio * 100)}%`
        : "Your place is saved as you scroll";
  });
  updateList();
}
function applyFilters() {
  rememberProgress();
  save();
  const results = resultList();
  showItem(results.find((i) => i.id === currentItem?.id) || results[0], {
    rememberPrevious: false,
  });
}
function initReader(params) {
  const direct = byId(params.get("item"));
  if (
    params.has("region") &&
    ["western-new-york", "niagara-brant", "heavymap"].includes(
      params.get("region"),
    )
  ) {
    state.filters.region = params.get("region");
    state.filters.query = "";
  }
  if (direct && !resultList().some((i) => i.id === direct.id)) {
    state.filters = {
      kind: direct.kind,
      region: "all",
      query: "",
      unreadOnly: false,
    };
  }
  content.innerHTML = readerShell();
  document.getElementById("reader-library-toggle").addEventListener("click", (event) => {
    const collapsed = document.querySelector(".reader-page").classList.toggle("library-collapsed");
    event.currentTarget.setAttribute("aria-expanded", String(!collapsed));
    event.currentTarget.innerHTML = `Browse & filter <span aria-hidden="true">${collapsed ? "+" : "−"}</span>`;
  });
  document.getElementById("reader-region").value = state.filters.region;
  document.querySelectorAll("[data-kind]").forEach((b) =>
    b.addEventListener("click", () => {
      state.filters.kind = b.dataset.kind;
      applyFilters();
    }),
  );
  document.getElementById("reader-region").addEventListener("change", (e) => {
    state.filters.region = e.target.value;
    applyFilters();
  });
  document.getElementById("reader-search").addEventListener("input", (e) => {
    clearTimeout(queryTimer);
    state.filters.query = e.target.value;
    queryTimer = setTimeout(applyFilters, 120);
  });
  document.getElementById("unread-only").addEventListener("change", (e) => {
    state.filters.unreadOnly = e.target.checked;
    applyFilters();
  });
  document.getElementById("reader-scroll").addEventListener(
    "scroll",
    () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        rememberProgress();
        const progress = state.progress[currentItem?.id] || 0;
        document.getElementById("reading-progress").textContent =
          `${Math.round(progress * 100)}% · Saved in this browser`;
      }, 150);
    },
    { passive: true },
  );
  for (const [id, dir] of [
    ["reader-prev", -1],
    ["reader-next", 1],
  ])
    document.getElementById(id).addEventListener("click", () => {
      const results = resultList(),
        index = results.findIndex((i) => i.id === currentItem?.id);
      if (results[index + dir]) showItem(results[index + dir]);
    });
  document.getElementById("mark-read").addEventListener("click", () => {
    if (!currentItem) return;
    const id = currentItem.id;
    state.read = state.read.includes(id)
      ? state.read.filter((x) => x !== id)
      : [...state.read, id];
    save();
    if (state.filters.unreadOnly) applyFilters();
    else updateList();
  });
  showItem(
    direct ||
      resultList().find((i) => i.id === state.current) ||
      resultList()[0],
    { rememberPrevious: false },
  );
  bindForget();
}
function bindForget() {
  document.querySelectorAll("[data-forget]").forEach((b) =>
    b.addEventListener("click", () => {
      clearTimeout(scrollTimer);
      state = freshState();
      try {
        storage?.removeItem(STORAGE_KEY);
      } catch {}
      currentItem = null;
      if (location.hash.startsWith("#/reader")) {
        location.hash = "#/";
      } else render();
    }),
  );
}
function render(initial = false) {
  clearTimeout(queryTimer);
  clearTimeout(scrollTimer);
  rememberProgress();
  currentItem = null;
  const [path, query = ""] = (location.hash.slice(1) || "/").split("?");
  const study = roundTwoRoute(path) || studyRoute(path);
  if (path === "/reader") {
    initReader(new URLSearchParams(query));
    document.title = "HeavyMap · Reader";
  } else if (study) {
    content.innerHTML = study.html.replaceAll("↗", arrow);
    document.title = `HeavyMap · ${study.title}`;
    bindStudyControls();
    bindRoundTwo();
    const section = new URLSearchParams(query).get("section");
    if (section)
      requestAnimationFrame(() =>
        document
          .getElementById(`study-${section}`)
          ?.scrollIntoView({ block: "start" }),
      );
  } else {
    content.innerHTML = home().replaceAll("↗", arrow);
    bindForget();
    document.title = "HeavyMap · The regional edition";
  }
  bindMapButtons();
  if (!initial) content.focus({ preventScroll: true });
  window.scrollTo(0, 0);
  document
    .querySelector(".reader-nav")
    .setAttribute("aria-current", path === "/reader" ? "page" : "false");
}
function bindMapButtons() {
  document.querySelectorAll("[data-open-map]").forEach((b) => {
    b.onclick = () => openMap(b);
  });
}
function openMap(opener) {
  mapOpener = opener;
  savedSiteY = scrollY;
  rememberProgress();
  const stage = document.getElementById("map-stage");
  stage.hidden = false;
  stage.innerHTML =
    '<iframe title="Synthetic Hamilton map — interaction study" src="map.html"></iframe>';
  const frame = stage.querySelector("iframe");
  frame.addEventListener("load", () => {
    frame.contentWindow?.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMap();
    });
  });
  document.getElementById("map-dock").hidden = false;
  document.body.classList.add("is-map-open");
  document.getElementById("site-veneer").inert = true;
  document.getElementById("return-to-site").focus({ preventScroll: true });
}
function closeMap() {
  document.body.classList.remove("is-map-open");
  document.getElementById("site-veneer").inert = false;
  document.getElementById("map-stage").hidden = true;
  document.getElementById("map-stage").replaceChildren();
  document.getElementById("map-dock").hidden = true;
  window.scrollTo(0, savedSiteY);
  mapOpener?.focus({ preventScroll: true });
}
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && document.body.classList.contains("is-map-open"))
    closeMap();
});
document.getElementById("return-to-site").addEventListener("click", closeMap);
document.querySelector(".skip-link").addEventListener("click", (e) => {
  e.preventDefault();
  content.focus();
});
window.addEventListener("hashchange", () => render());
window.addEventListener("pagehide", () => {
  clearTimeout(scrollTimer);
  rememberProgress();
});
window.addEventListener("storage", (e) => {
  if (e.key === STORAGE_KEY) {
    state = loadState(storage, catalogue);
    if (!location.hash.startsWith("#/reader")) render();
  }
});
render(true);
