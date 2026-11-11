/* The Reader workspace (spec C section 5). The prebuilt page is a plain list
 * of links; this adds filters, the reading pane, previous/next, history and
 * the mobile library collapse. */

import { escapeHtml as esc } from "../desk/escape.js";
import { attachArticle, bindForget } from "./reading-surfaces.js";

const MOBILE = matchMedia("(max-width: 800px)");

export function mountReader(store, root) {
  const { R, catalogue } = store;
  const $ = (sel) => root.querySelector(sel);
  const list = $("#reader-list");
  const count = $("#library-count");
  const notice = $("[data-reader-notice]");
  const doc = $("[data-reader-document]");
  const pane = $("#reader-article");
  const scroller = $("#reader-scroll");
  const toggle = $("#reader-library-toggle");
  const library = $("#reader-library");
  const regionSel = $("#reader-region");
  const search = $("#reader-search");
  const unread = $("#reader-unread");
  const typeLabel = Object.fromEntries(
    [...root.querySelectorAll("[data-kind]")].map((b) => [
      b.dataset.kind,
      b.textContent,
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
  const matches = (it) => {
    if (filters.kind !== "all" && it.type !== filters.kind) return false;
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

  function renderList() {
    const items = visible();
    list.innerHTML = items
      .map((it) => {
        const ed = it.edition ? catalogue.editions[it.edition] : null;
        const read = R.isRead(store.state.items[it.id]);
        const sel = it.id === currentId;
        return `<li><a class="library-item${sel ? " selected" : ""}" href="/reader/?item=${encodeURIComponent(it.id)}" data-id="${esc(it.id)}"${sel ? ' aria-current="true"' : ""}><span>${esc(ed ? `${ed.deskName} · ${ed.title}` : "HeavyMap")}<i>${read ? "Read" : esc(typeLabel[it.type] ?? it.type)}</i></span><strong>${esc(it.title)}</strong></a></li>`;
      })
      .join("");
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
      notice.innerHTML = `This item isn't in your current filter · <button type="button" data-show-all>Show all</button>`;
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

  async function open(id, { focus = true } = {}) {
    detach();
    if (!store.byId.has(id)) {
      currentId = null;
      doc.hidden = true;
      renderNotice(
        catalogue.retired?.includes(id)
          ? "That item has been withdrawn."
          : "That item isn't in the library.",
      );
      return;
    }
    currentId = id;
    writeUrl();
    renderList();
    doc.hidden = false;
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
    if (currentId !== id) return; // another item was opened meanwhile
    if (!article) {
      pane.innerHTML = `<p>This story didn't load. <a href="/read/${encodeURIComponent(id)}/">Open its page</a>.</p>`;
      return;
    }
    article.querySelector(".study-crumb")?.remove();
    const h1 = article.querySelector("h1");
    if (h1) {
      const h2 = document.createElement("h2");
      h2.innerHTML = h1.innerHTML;
      h2.tabIndex = -1;
      h1.replaceWith(h2);
    }
    pane.replaceChildren(document.importNode(article, true));
    scroller.scrollTop = 0;
    const scrollEl = MOBILE.matches ? window : scroller;
    detach = attachArticle(store, pane.querySelector("article"), {
      via: "reader",
      scrollEl,
    });
    if (MOBILE.matches) setLibrary(false);
    if (focus)
      pane.querySelector("h2")?.focus({ preventScroll: !MOBILE.matches });
  }

  // Mobile: the library collapses once an item is open (D12).
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
  function step(d) {
    const items = visible();
    const i = items.findIndex((it) => it.id === currentId);
    if (items[i + d]) open(items[i + d].id, { focus: false });
  }
  doc.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (MOBILE.matches) setLibrary(true);
    list.querySelector(`a[data-id="${CSS.escape(currentId ?? "")}"]`)?.focus();
  });
  toggle.addEventListener("click", () => {
    const expand = toggle.getAttribute("aria-expanded") !== "true";
    setLibrary(expand);
    if (expand) list.querySelector('a[aria-current="true"]')?.focus();
  });
  MOBILE.addEventListener("change", () => {
    toggle.hidden = !MOBILE.matches;
    setLibrary(!currentId || !MOBILE.matches);
  });
  store.subscribe(() => {
    renderList();
  });

  /* start */
  for (const el of root.querySelectorAll("[data-reader-controls]"))
    el.hidden = false;
  toggle.hidden = !MOBILE.matches;
  if (!store.persistent)
    root.querySelector("[data-storage-note]").textContent =
      "Browser storage is unavailable. Reader works, but can't remember your place.";
  bindForget(store, root.querySelector(".reader-storage"));
  renderControls();
  renderList();
  const startId = params.get("item");
  if (startId) open(startId, { focus: false });
}
