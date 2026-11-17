/* The Reader (spec C section 5), laid out as a service page: filters in the
 * left rail, story cards in the main window, and one story at a time in a
 * dialog over the workspace. The prebuilt page is a plain list of story
 * links; this adds the filters, the dialog, previous/next and history.
 *
 * The dialog shows the story's own prebuilt article (/read/<id>/), sorted
 * into two columns so a laptop shows the whole story without scrolling:
 * heading, summary and facts on the left; the longer evidence sections
 * (what is unconfirmed, stage history, sources) as tabs on the right. */

import { escapeHtml as esc } from "../desk/escape.js";
import { attachArticle, bindForget } from "./reading-surfaces.js";

const MOBILE = matchMedia("(max-width: 800px)");

// The article sections that become tabs, in reading order.
const TABS = [
  { selector: ".hm-open-questions", label: "Unconfirmed", count: "li" },
  { selector: ".hm-stage-history", label: "Stage history", count: "li" },
  { selector: ".standalone-sources", label: "Sources", count: ":scope > a, :scope > div" },
];

const longDate = (iso) => {
  const d = new Date(`${String(iso).slice(0, 10)}T12:00:00Z`);
  return Number.isNaN(d.getTime())
    ? String(iso ?? "")
    : d.toLocaleDateString("en-CA", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
};

export function mountReader(store, root) {
  const { R, catalogue } = store;
  const $ = (sel) => root.querySelector(sel);
  const list = $("#reader-list");
  const count = $("#library-count");
  const heading = $("[data-news-heading]");
  const notice = $("[data-reader-notice]");
  const dialog = $("[data-reader-document]");
  const pane = $("#reader-article");
  const scroller = $("#reader-scroll");
  const pageLink = $("#reader-page-link");
  const toggle = $("#reader-library-toggle");
  const library = $("#reader-library");
  const regionSel = $("#reader-region");
  const search = $("#reader-search");
  const unread = $("#reader-unread");
  const typeLabel = Object.fromEntries(
    [...root.querySelectorAll("[data-kind]")].map((b) => [
      b.dataset.kind,
      b.querySelector("span")?.textContent ?? b.textContent,
    ]),
  );
  const regionName = Object.fromEntries(
    catalogue.regions.map((r) => [r.slug, r.name]),
  );
  regionName.heavymap = "HeavyMap";
  const slugs = catalogue.regions.map((r) => r.slug);
  const editionOrder = (it) =>
    it.edition
      ? (catalogue.editions[it.edition]?.items ?? []).indexOf(it.id)
      : 0;

  // URL wins for this view and is not saved; otherwise saved filters (spec C section 5.1).
  const params = new URLSearchParams(location.search);
  const urlHasFilters = ["kind", "region", "q"].some((k) => params.has(k));
  let filters = urlHasFilters
    ? R.normaliseFilters(
        {
          kind: params.get("kind") ?? "news",
          region: params.get("region") ?? "all",
          q: params.get("q") ?? "",
          unread: false,
        },
        slugs,
      )
    : { ...store.state.filters };
  let currentId = null;
  let detach = () => {};

  // Newest first, then edition order, then ID (decision 30).
  const ordered = [...catalogue.items].sort(
    (a, b) =>
      String(b.published_on).localeCompare(String(a.published_on)) ||
      editionOrder(a) - editionOrder(b) ||
      a.id.localeCompare(b.id),
  );
  // Everything except the kind: used for the per-kind counts in the rail.
  const matchesOthers = (it) => {
    if (filters.region !== "all" && !it.regions.includes(filters.region))
      return false;
    if (filters.unread && R.isRead(store.state.items[it.id])) return false;
    const q = filters.q.trim().toLocaleLowerCase();
    return (
      !q ||
      [it.title, it.summary, it.publisher, it.place, it.entity]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase()
        .includes(q)
    );
  };
  const matches = (it) =>
    (filters.kind === "all" || it.type === filters.kind) && matchesOthers(it);
  const visible = () => ordered.filter(matches);

  function writeUrl() {
    const p = new URLSearchParams();
    if (filters.kind !== "news") p.set("kind", filters.kind);
    if (filters.region !== "all") p.set("region", filters.region);
    if (filters.q) p.set("q", filters.q);
    if (currentId) p.set("item", currentId);
    history.replaceState(
      null,
      "",
      `${location.pathname}${p.size ? `?${p}` : ""}`,
    );
  }

  function setFilters(next) {
    filters = R.normaliseFilters({ ...filters, ...next }, slugs);
    store.update((s) => {
      s.filters = { ...filters };
    });
    writeUrl();
    renderControls();
    renderList();
  }

  function renderControls() {
    for (const b of root.querySelectorAll("[data-kind]"))
      b.setAttribute("aria-pressed", String(b.dataset.kind === filters.kind));
    regionSel.value = filters.region;
    if (document.activeElement !== search) search.value = filters.q;
    unread.checked = filters.unread;
  }

  function card(it) {
    const ed = it.edition ? catalogue.editions[it.edition] : null;
    const read = R.isRead(store.state.items[it.id]);
    const sel = it.id === currentId;
    const foot = [longDate(it.published_on), it.place, it.entity]
      .filter(Boolean)
      .join(" · ");
    return `<li><a class="hm-news-card library-item${read ? " is-read" : ""}${sel ? " selected" : ""}" href="/read/${encodeURIComponent(it.id)}/" data-id="${esc(it.id)}"${sel ? ' aria-current="true"' : ""}><span class="hm-news-card-eyebrow">${esc(ed ? `${ed.deskName} · ${ed.title}` : "HeavyMap")}<i>${read ? "Read" : esc(typeLabel[it.type] ?? it.type)}</i></span><strong>${esc(it.title)}</strong>${it.summary ? `<p>${esc(it.summary)}</p>` : ""}${foot ? `<small>${esc(foot)}</small>` : ""}</a></li>`;
  }

  function renderList() {
    const items = visible();
    list.innerHTML = items.map(card).join("");
    const others = ordered.filter(matchesOthers);
    for (const b of root.querySelectorAll("[data-kind]")) {
      const n =
        b.dataset.kind === "all"
          ? others.length
          : others.filter((it) => it.type === b.dataset.kind).length;
      b.querySelector("[data-kind-count]").textContent = String(n);
    }
    heading.textContent = [
      filters.kind === "all" ? "All stories" : typeLabel[filters.kind],
      filters.region !== "all" ? regionName[filters.region] : null,
    ]
      .filter(Boolean)
      .join(" · ");
    count.textContent = items.length
      ? `${items.length} ${items.length === 1 ? "item" : "items"}`
      : "Nothing matches these filters.";
    renderNotice();
    renderNavigation();
  }

  function renderNotice(text) {
    if (text) {
      notice.innerHTML = text;
    } else if (
      currentId &&
      store.byId.has(currentId) &&
      !visible().some((i) => i.id === currentId)
    ) {
      notice.innerHTML = `The open story isn't in your current filter · <button type="button" data-show-all>Show all</button>`;
    } else {
      notice.innerHTML = "";
    }
    notice.hidden = !notice.innerHTML;
    notice
      .querySelector("[data-show-all]")
      ?.addEventListener("click", () =>
        setFilters({ ...R.DEFAULT_FILTERS, kind: "all" }),
      );
  }

  function renderNavigation() {
    const items = visible();
    const i = items.findIndex((it) => it.id === currentId);
    const where = [
      typeLabel[filters.kind] ?? "All",
      filters.region !== "all" ? regionName[filters.region] : null,
    ]
      .filter(Boolean)
      .join(" · ");
    $("#reader-position").textContent =
      i === -1 ? "" : `${i + 1} of ${items.length} · ${where}`;
    $("#reader-prev").disabled = i <= 0;
    $("#reader-next").disabled = i === -1 || i >= items.length - 1;
  }

  /** Sort the prebuilt article into the dialog's two columns and tabs. */
  function layoutArticle(article) {
    article.classList.add("hm-news-article");
    article.classList.remove("study-wrap");
    article.querySelector(".study-crumb")?.remove();
    article.querySelector(".hm-item-tools")?.remove(); // "Open in Reader": we are here
    const h1 = article.querySelector("h1");
    if (h1) {
      const h2 = document.createElement("h2");
      h2.innerHTML = h1.innerHTML;
      h2.tabIndex = -1;
      h2.id = "hm-news-story-title";
      h1.replaceWith(h2);
    }
    // Find the evidence sections before the body moves into the lead column.
    const found = TABS.map((t) => ({ ...t, section: article.querySelector(t.selector) }))
      .filter((t) => t.section);
    const lead = document.createElement("div");
    lead.className = "hm-news-article-lead";
    const head = article.querySelector(".standalone-heading");
    const body = article.querySelector(".hm-reading-body");
    if (head) lead.append(head);
    if (body) lead.append(body);
    const evidence = document.createElement("div");
    evidence.className = "hm-news-article-evidence";
    if (found.length) {
      const tablist = document.createElement("div");
      tablist.className = "hm-news-tabs";
      tablist.setAttribute("role", "tablist");
      tablist.setAttribute("aria-label", "Story evidence");
      evidence.append(tablist);
      const tabs = found.map((t, i) => {
        const tab = document.createElement("button");
        tab.type = "button";
        tab.className = "hm-news-tab";
        tab.id = `hm-news-tab-${i}`;
        tab.setAttribute("role", "tab");
        tab.setAttribute("aria-controls", `hm-news-panel-${i}`);
        const n = t.section.querySelectorAll(t.count).length;
        tab.innerHTML = `${esc(t.label)}${n ? ` <small>${n}</small>` : ""}`;
        const panel = document.createElement("div");
        panel.className = "hm-news-panel";
        panel.id = `hm-news-panel-${i}`;
        panel.setAttribute("role", "tabpanel");
        panel.setAttribute("aria-labelledby", tab.id);
        panel.tabIndex = 0;
        // The tab names the section, so its own heading and eyebrow go.
        t.section.querySelector(":scope > h2")?.remove();
        t.section.querySelector(":scope > .eyebrow")?.remove();
        panel.append(t.section);
        tablist.append(tab);
        evidence.append(panel);
        return { tab, panel };
      });
      const select = (i, focus) => {
        tabs.forEach(({ tab, panel }, j) => {
          tab.setAttribute("aria-selected", String(i === j));
          tab.tabIndex = i === j ? 0 : -1;
          panel.hidden = i !== j;
        });
        if (focus) tabs[i].tab.focus();
      };
      tabs.forEach(({ tab }, i) => {
        tab.addEventListener("click", () => select(i, false));
        tab.addEventListener("keydown", (e) => {
          const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
          if (!step) return;
          e.preventDefault();
          select((i + step + tabs.length) % tabs.length, true);
        });
      });
      select(0, false);
    } else article.classList.add("hm-news-article--single");
    article.append(lead, evidence);
    return article;
  }

  async function open(id, { focus = true } = {}) {
    detach();
    if (!store.byId.has(id)) {
      close({ silent: true });
      renderNotice(
        catalogue.retired?.includes(id)
          ? "That story has been withdrawn."
          : "That story isn't in the library.",
      );
      return;
    }
    currentId = id;
    writeUrl();
    renderList();
    pageLink.href = `/read/${encodeURIComponent(id)}/`;
    if (!dialog.open) dialog.showModal();
    pane.innerHTML = `<p class="library-count">Loading…</p>`;
    let article = null;
    try {
      const res = await fetch(`/read/${encodeURIComponent(id)}/`);
      if (!res.ok) throw new Error(String(res.status));
      article = new DOMParser()
        .parseFromString(await res.text(), "text/html")
        .querySelector("article[data-item-id]");
    } catch {
      article = null;
    }
    if (currentId !== id) return; // another story was opened meanwhile
    if (!article) {
      pane.innerHTML = `<p>This story didn't load. <a href="/read/${encodeURIComponent(id)}/">Open its page</a>.</p>`;
      return;
    }
    pane.replaceChildren(layoutArticle(document.importNode(article, true)));
    dialog.setAttribute("aria-labelledby", "hm-news-story-title");
    scroller.scrollTop = 0;
    detach = attachArticle(store, pane.querySelector("article"), {
      via: "reader",
      scrollEl: scroller,
    });
    if (focus) pane.querySelector("h2")?.focus({ preventScroll: true });
  }

  function close({ silent = false } = {}) {
    detach();
    detach = () => {};
    const was = currentId;
    currentId = null;
    if (dialog.open) dialog.close();
    pane.replaceChildren();
    writeUrl();
    renderList();
    if (!silent && was)
      list.querySelector(`a[data-id="${CSS.escape(was)}"]`)?.focus();
  }

  // Mobile: the filters fold away behind a toggle above the cards.
  function setLibrary(expanded) {
    toggle.setAttribute("aria-expanded", String(expanded));
    toggle.querySelector("span").textContent = expanded ? "−" : "+";
    library.hidden = MOBILE.matches && !expanded;
  }

  /* events */
  for (const b of root.querySelectorAll("[data-kind]"))
    b.addEventListener("click", () => setFilters({ kind: b.dataset.kind }));
  regionSel.addEventListener("change", () =>
    setFilters({ region: regionSel.value }),
  );
  search.addEventListener("input", () => setFilters({ q: search.value }));
  unread.addEventListener("change", () =>
    setFilters({ unread: unread.checked }),
  );
  list.addEventListener("click", (e) => {
    const a = e.target.closest("a[data-id]");
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    open(a.dataset.id);
  });
  $("#reader-prev").addEventListener("click", () => step(-1));
  $("#reader-next").addEventListener("click", () => step(1));
  $("#reader-close").addEventListener("click", () => close());
  function step(d) {
    const items = visible();
    const i = items.findIndex((it) => it.id === currentId);
    if (items[i + d]) open(items[i + d].id, { focus: false });
  }
  dialog.addEventListener("cancel", (e) => {
    e.preventDefault(); // Escape: close through our own path (URL, focus)
    close();
  });
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) close(); // the backdrop around the panel
  });
  toggle.addEventListener("click", () => {
    setLibrary(toggle.getAttribute("aria-expanded") !== "true");
  });
  MOBILE.addEventListener("change", () => {
    toggle.hidden = !MOBILE.matches;
    setLibrary(!MOBILE.matches);
  });
  store.subscribe(() => {
    renderList();
  });

  /* start */
  for (const el of root.querySelectorAll("[data-reader-controls]"))
    el.hidden = false;
  toggle.hidden = !MOBILE.matches;
  setLibrary(!MOBILE.matches);
  if (!store.persistent)
    root.querySelector("[data-storage-note]").textContent =
      "Browser storage is unavailable. Reader works, but can't remember your place.";
  bindForget(store, root.querySelector(".reader-storage"));
  renderControls();
  renderList();
  const startId = params.get("item");
  if (startId) open(startId, { focus: false });
}
