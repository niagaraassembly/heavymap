import "maplibre-gl/dist/maplibre-gl.css";
import "./style.css";
import { loadLabels } from "./labels.js";
import { createDossierLoader } from "./dossier-loader.js";
import { createAccessLoader, summariseAccess } from "./parcel-access.js";
import { summariseRecord } from "./parcel-summary.js";
import { parcelCardElement, parcelDrawerElement } from "./parcel-views.js";
import { parcelNotesDialogElement, parcelWorkspaceElement } from "./parcel-workspace.js";
import { createNotesStore, putLocalRecord, recordsFor, removeSavedPlace, savePlace } from "./local-data.js";
import { el } from "./dossier.js";
import { FieldMap } from "./map.js";
import { findBasemap } from "./basemap.js";
import { startTitleIntro } from "./brand/title-intro.js";
import {
  cityDevelopmentSheetElement,
  createHamiltonDevelopmentLoader,
  developmentRecordNote,
  developmentRecordSavedItem,
  developmentRecordsBrowserElement,
} from "./development-records.js";

const RELEASE_BASE = "/map/data/ca-on-hamilton/2026-11-16-d070/";
const PARCEL_GEOMETRY_CACHE = "heavymap.parcel-geometry-cache.v1";
// The street basemap is a separate artifact from the parcel release.
const MAP_LAYER_BASE = "/map/layers/ca-on-hamilton-map-layers/2026-11-17-layer-set-002/";
const DEVELOPMENT_BASE = "/map/data/ca-on-hamilton-development/2026-11-17-field-screen-v0.3/";
// Private portrait package (D-079): access and infrastructure measurements per parcel.
const ACCESS_BASE = "/map/data/ca-on-hamilton-access/2026-11-17-access-v0.1/";
const cardSlot = document.getElementById("parcel-card-slot");
const drawerSlot = document.getElementById("parcel-drawer-slot");
const workspaceSlot = document.getElementById("parcel-workspace-slot");
let selected = null;
let view = null;
let current = null;
let opener = null;
let loading = false;
let loadToken = 0;
let map;
let loader;
let developmentLoader;
let accessLoader;
let accessPinned = Promise.resolve({ ok: false });
let labels;
let manifestSources = null;
let notesStore = null;
let savedItems = [];
async function saveDevelopmentRecord(record) {
  const item = developmentRecordSavedItem(record);
  await putLocalRecord("saved", item);
  savedItems = [...savedItems.filter((entry) => entry.id !== item.id), item];
}
async function createDevelopmentRecordNote(record, text, parcelKey = null) {
  await putLocalRecord("field-notes", developmentRecordNote(record, text, parcelKey));
}
let savedFilter = "all";
let savedQuery = "";
/* Which workspace sections are open, remembered while moving between
 * parcels in the session (design §5.4). Set on the first workspace open:
 * Addresses open only when the parcel has more than one. */
let workspaceSections = null;
// The opening title sequence plays over the map while it loads; it leaves
// when both the sequence (or a skip) and the map are done.
const titleIntro = startTitleIntro(document.querySelector("[data-map-loading]"));
let mapLoadingFinished = false;

function finishMapLoading() {
  if (mapLoadingFinished) return;
  mapLoadingFinished = true;
  titleIntro.mapReady();
}

function status(text) {
  const barStatus = document.getElementById("map-bar-status");
  if (barStatus) barStatus.textContent = text;
}

function rememberGeometry(key, geometry) {
  if (!key || !geometry || !["Polygon", "MultiPolygon"].includes(geometry.type)) return;
  try {
    const value = JSON.stringify({ key, geometry });
    if (value.length < 450_000) localStorage.setItem(PARCEL_GEOMETRY_CACHE, value);
  } catch { /* the outline is an optional local convenience */ }
}

function rememberedGeometry(key) {
  try {
    const cached = JSON.parse(localStorage.getItem(PARCEL_GEOMETRY_CACHE) ?? "null");
    return cached?.key === key && ["Polygon", "MultiPolygon"].includes(cached.geometry?.type)
      ? cached.geometry
      : null;
  } catch { return null; }
}

function setLayersOpen(open, { restoreFocus = true } = {}) {
  const panel = document.getElementById("layers-panel");
  const toggle = document.getElementById("layers-toggle");
  const dialog = document.getElementById("layers-dialog");
  const backdrop = document.getElementById("layers-backdrop");
  panel.classList.toggle("is-collapsed", !open);
  toggle.setAttribute("aria-expanded", String(open));
  toggle.title = open ? "Map layers open" : "Open map layers";
  dialog.hidden = !open;
  backdrop.hidden = !open;
  if (open) document.getElementById("layers-search")?.focus({ preventScroll: true });
  else if (restoreFocus) toggle.focus({ preventScroll: true });
}

function updateLayerLibrary() {
  const content = document.getElementById("layers-content");
  const query = document.getElementById("layers-search").value.trim().toLowerCase();
  const filter = document.querySelector("[data-layer-filter][aria-pressed='true']")?.dataset.layerFilter ?? "all";
  const groups = [...content.querySelectorAll(".layer-group")];
  const inputs = [...content.querySelectorAll(".layer input[type='checkbox']")];
  let visibleCount = 0;

  for (const group of groups) {
    const category = group.dataset.layerGroup;
    const labels = [...group.querySelectorAll(".layer")];
    const categoryMatch = filter === "all" || filter === "on" || filter === category;
    let groupCount = category === "basemap" && categoryMatch ? 1 : 0;
    for (const label of labels) {
      const input = label.querySelector("input[type='checkbox']");
      const textMatch = !query || label.textContent.toLowerCase().includes(query);
      const activeMatch = filter !== "on" || input.checked;
      label.hidden = !categoryMatch || !textMatch || !activeMatch;
      if (!label.hidden) groupCount++;
    }
    const queryMatch = !query || group.textContent.toLowerCase().includes(query);
    const hasVisibleLayer = labels.length ? groupCount > 0 : category === "basemap" && queryMatch;
    group.hidden = !categoryMatch || !queryMatch || !hasVisibleLayer;
    if (!group.hidden) visibleCount += groupCount;
  }

  const totalCount = inputs.length + 1;
  const activeCount = inputs.filter((input) => input.checked).length + 1;
  document.querySelector("[data-layer-count-for='all']").textContent = String(totalCount);
  document.querySelector("[data-layer-count-for='on']").textContent = String(activeCount);
  for (const category of ["planning", "protected", "parks", "development"]) {
    const count = content.querySelectorAll(`[data-layer-group='${category}'] .layer input[type='checkbox']`).length;
    const counter = document.querySelector(`[data-layer-count-for='${category}']`);
    if (counter) counter.textContent = String(count);
  }
  document.getElementById("layers-result-count").textContent = query || filter !== "all"
    ? `${visibleCount} ${visibleCount === 1 ? "layer" : "layers"} shown`
    : `${totalCount} layers · ${activeCount} on the map`;
}

function syncSaveButton() {
  const button = document.querySelector("[data-save-parcel]");
  const saved = Boolean(current && savedItems.some((item) => item.key === current.key && (item.kind ?? "parcel") === "parcel"));
  if (button) {
    button.removeAttribute("aria-pressed");
    button.title = saved ? "Saved items · selected parcel is saved" : "Saved items";
    button.setAttribute("aria-label", button.title);
  }
  document.querySelectorAll("[data-parcel-save]").forEach((action) => {
    action.textContent = saved ? "★ Saved" : "☆ Save";
    action.setAttribute("aria-pressed", String(saved));
  });
}

async function toggleSaveCurrentParcel() {
  if (!current) {
    status("Open a parcel record before saving it.");
    return;
  }
  try {
    const saved = savedItems.some((item) => item.key === current.key && (item.kind ?? "parcel") === "parcel");
    if (saved) {
      await removeSavedPlace(current.key);
      savedItems = savedItems.filter((item) => item.key !== current.key);
    } else {
      const place = {
        id: current.key,
        kind: "parcel",
        key: current.key,
        title: current.summary.title,
        subtitle: current.summary.subtitle,
        releaseId: current.releaseId ?? "",
        savedAt: new Date().toISOString(),
      };
      await savePlace(place);
      savedItems = [place, ...savedItems.filter((item) => item.id !== place.id)];
    }
    syncSaveButton();
    status(saved ? "Parcel removed from saved items on this device." : "Parcel saved on this device.");
    if (document.getElementById("parcel-save-dialog")?.open) renderSaveDialog();
  } catch {
    status("This device could not save the parcel. Check browser storage and try again.");
  }
}

function openNoteService() {
  if (!current) {
    status("Open a parcel record before adding a note.");
    return;
  }
  const dialog = document.getElementById("parcel-notes-dialog");
  dialog.replaceChildren(parcelNotesDialogElement(current.summary, labels, {
    notesStore,
    releaseId: current.releaseId,
    onClose: () => dialog.close(),
  }));
  if (!dialog.open) dialog.showModal();
  dialog.querySelector("textarea")?.focus({ preventScroll: true });
}

function savedItemCategory(item) {
  const kind = item.kind ?? item.type ?? "parcel";
  if (kind === "parcel") return "parcel";
  if (["news", "story", "article", "editorial"].includes(kind)) return "news";
  if (["development", "development-record", "development_record", "development-records"].includes(kind)) return "development";
  return "other";
}

async function hydrateLegacyParcelTitles() {
  if (!loader || !labels) return;
  const legacy = savedItems.filter((item) => savedItemCategory(item) === "parcel" && item.key && (!item.title || item.title === "Saved Hamilton parcel"));
  await Promise.all(legacy.map(async (item) => {
    const result = await loader.core(item.key);
    if (!result.ok) return;
    const summary = summariseRecord(result.record, null, labels, { sources: manifestSources });
    const updated = { ...item, title: summary.title, subtitle: summary.subtitle };
    try {
      await savePlace(updated);
      savedItems = savedItems.map((saved) => saved.id === item.id ? updated : saved);
    } catch {
      // The address can still be shown for this session if the browser store is read-only.
      savedItems = savedItems.map((saved) => saved.id === item.id ? updated : saved);
    }
  }));
}

function renderSaveDialog() {
  const dialog = document.getElementById("parcel-save-dialog");
  const panel = el("section", undefined, "hm-map-dialog-panel hm-save-dialog-panel");
  const head = el("header", undefined, "hm-map-dialog-head");
  const titleBlock = el("div", undefined, "hm-map-dialog-title-block");
  titleBlock.append(el("p", "ON THIS DEVICE", "hm-map-dialog-eyebrow"));
  titleBlock.append(el("h2", "Saved items", "hm-map-dialog-title"));
  titleBlock.append(el("p", "Parcels, news, and development records you keep on this device.", "hm-map-dialog-subtitle"));
  const close = el("button", "×", "hm-map-dialog-close");
  close.type = "button";
  close.setAttribute("aria-label", "Close saved items");
  close.addEventListener("click", () => dialog.close());
  head.append(titleBlock, close);

  const body = el("div", undefined, "hm-map-dialog-body hm-save-dialog-body");
  if (current) {
    const saved = savedItems.some((item) => item.key === current.key && (item.kind ?? "parcel") === "parcel");
    const selected = el("section", undefined, "hm-save-selected");
    selected.append(el("p", saved ? "This parcel is saved" : "Selected parcel", "hm-save-kicker"));
    selected.append(el("h3", current.summary.title, "hm-save-title"));
    selected.append(el("p", current.summary.subtitle, "hm-save-subtitle"));
    const action = el("button", saved ? "Remove from saved items" : "Save this parcel", "parcel-btn parcel-btn-pri");
    action.type = "button";
    action.addEventListener("click", () => void toggleSaveCurrentParcel());
    selected.append(action);
    body.append(selected);
  } else {
    body.append(el("p", "Select a parcel on the map to save it here.", "hm-save-empty-hint"));
  }

  const categories = [
    { id: "all", title: "All" },
    { id: "parcel", title: "Parcel" },
    { id: "news", title: "News" },
    { id: "development", title: "Development" },
    { id: "other", title: "Other" },
  ];
  const filters = el("nav", undefined, "hm-save-filters");
  filters.setAttribute("aria-label", "Filter saved items");
  for (const category of categories) {
    const button = el("button", category.title, "hm-save-filter");
    button.type = "button";
    button.setAttribute("aria-pressed", String(savedFilter === category.id));
    button.addEventListener("click", () => {
      savedFilter = category.id;
      renderSaveDialog();
      dialog.querySelector(`[data-save-filter="${category.id}"]`)?.focus({ preventScroll: true });
    });
    button.dataset.saveFilter = category.id;
    filters.append(button);
  }
  const search = el("label", undefined, "hm-save-search");
  search.append(el("span", "⌕", "hm-save-search-icon"));
  const searchInput = el("input");
  searchInput.type = "search";
  searchInput.placeholder = "Search saved items";
  searchInput.setAttribute("aria-label", "Search saved items");
  searchInput.value = savedQuery;
  search.append(searchInput);
  filters.append(search);
  const categoryItems = savedFilter === "all" ? savedItems : savedItems.filter((item) => savedItemCategory(item) === savedFilter);
  const filtered = categoryItems.filter((item) => !savedQuery || [item.title, item.subtitle, item.key, item.id].filter(Boolean).join(" ").toLocaleLowerCase().includes(savedQuery));
  const list = el("ul", undefined, "hm-save-list");
  let emptyMessage = null;
  if (!categoryItems.length) {
    emptyMessage = el("li", savedFilter === "all" ? "Saved items will appear here." : `Saved ${savedFilter === "parcel" ? "parcels" : `${savedFilter} items`} will appear here.`, "hm-save-list-empty");
    list.append(emptyMessage);
  }
  for (const item of filtered) {
      const row = el("li", undefined, "hm-save-list-row");
      row.classList.add("hm-save-item-card");
      row.dataset.search = [item.title, item.subtitle, item.key, item.id].filter(Boolean).join(" ").toLocaleLowerCase();
      const open = savedItemCategory(item) === "parcel"
        ? el("button", undefined, "hm-save-place-open")
        : el(item.url ? "a" : "div", undefined, "hm-save-place-open");
      if (item.url) open.href = item.url;
      if (open.tagName === "BUTTON") {
        open.type = "button";
        open.addEventListener("click", () => {
          dialog.close();
          void openParcel({ id: item.key }, null, "drawer");
        });
      }
      open.append(el("strong", item.title || (savedItemCategory(item) === "parcel" ? `Parcel ${String(item.key ?? item.id).slice(-7)}` : "Saved item")));
      const detail = item.subtitle || (savedItemCategory(item) === "parcel" ? "Hamilton parcel" : "");
      if (detail) open.append(el("span", detail));
      const remove = el("button", "Remove", "hm-save-remove");
      remove.type = "button";
      remove.addEventListener("click", async () => {
        try {
          await removeSavedPlace(item.id);
          savedItems = savedItems.filter((saved) => saved.id !== item.id);
          syncSaveButton();
          renderSaveDialog();
        } catch {
          status("This device could not remove the saved item.");
        }
      });
      row.append(open, remove);
      list.append(row);
  }
  const noResults = el("li", "No saved items match your search.", "hm-save-list-empty");
  noResults.hidden = !savedQuery || filtered.length > 0;
  list.append(noResults);
  searchInput.addEventListener("input", () => {
    savedQuery = searchInput.value.trim().toLocaleLowerCase();
    let visibleCount = 0;
    for (const row of list.querySelectorAll(".hm-save-item-card")) {
      row.hidden = Boolean(savedQuery) && !row.dataset.search.includes(savedQuery);
      if (!row.hidden) visibleCount++;
    }
    if (emptyMessage) emptyMessage.hidden = Boolean(savedQuery);
    noResults.hidden = !savedQuery || visibleCount > 0;
  });
  body.append(filters, list);
  panel.append(head, body);
  dialog.replaceChildren(panel);
}

async function openSaveService() {
  const dialog = document.getElementById("parcel-save-dialog");
  try {
    savedItems = await recordsFor("saved");
    syncSaveButton();
  } catch {
    status("Saved items are unavailable in this browser.");
  }
  renderSaveDialog();
  if (!dialog.open) dialog.showModal();
  dialog.querySelector(".hm-map-dialog-close")?.focus({ preventScroll: true });
  void hydrateLegacyParcelTitles().then(() => {
    if (dialog.open) renderSaveDialog();
  });
}

function updateLocation(key, level) {
  const url = key
    ? `#parcel=${encodeURIComponent(key)}${level === "card" ? "&view=card" : level === "workspace" ? "&view=work" : ""}`
    : location.pathname + location.search;
  history.replaceState(null, "", url);
}

/** Trap Tab inside the workspace while it is open (design §5.1). The
 * listener lives on the workspace element, so it goes away with it. */
function trapFocus(workspace) {
  workspace.addEventListener("keydown", (event) => {
    if (event.key !== "Tab") return;
    const focusable = [...workspace.querySelectorAll(
      "button:not([disabled]), textarea, input, a[href], [tabindex]:not([tabindex='-1'])",
    )].filter((n) => n.getClientRects().length > 0);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus({ preventScroll: true });
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus({ preventScroll: true });
    }
  });
}

function renderLevel(level, tab = "notes") {
  const { summary, releaseId, geometry, sourceRecords } = current;
  document.body.classList.remove("has-parcel-card", "has-parcel-drawer", "has-parcel-workspace");
  if (level === "card") {
    drawerSlot.replaceChildren();
    drawerSlot.hidden = true;
    workspaceSlot.replaceChildren();
    workspaceSlot.hidden = true;
    cardSlot.replaceChildren(
      parcelCardElement(summary, labels, {
        geometry,
        developmentCount: current.developmentCount ?? 0,
        onOpenDevelopment: () => {
          updateLocation(current.key, "workspace");
          renderLevel("workspace", "notes");
        },
        onSave: () => void toggleSaveCurrentParcel(),
        onOpenRecord: () => {
          view = "drawer";
          updateLocation(current.key);
          renderLevel("drawer");
        },
        onClose: closeAll,
      }),
    );
    cardSlot.hidden = false;
    document.body.classList.add("has-parcel-card");
    cardSlot.querySelector(".parcel-go")?.focus({ preventScroll: true });
  } else if (level === "drawer") {
    cardSlot.replaceChildren();
    cardSlot.hidden = true;
    workspaceSlot.replaceChildren();
    workspaceSlot.hidden = true;
    drawerSlot.replaceChildren(
      parcelDrawerElement(summary, labels, {
        geometry,
        releaseId,
        developmentCount: current.developmentCount ?? 0,
        onOpenDevelopment: () => {
          updateLocation(current.key, "workspace");
          renderLevel("workspace", "notes");
        },
        // BL-107: no feedback target is configured yet, so Report a
        // problem stays hidden.
        feedbackUrl: null,
        onClose: stepBack,
        onSave: () => void toggleSaveCurrentParcel(),
        onOpenNotes: openNoteService,
        onOpenWorkspace: (initialTab) => {
          updateLocation(current.key, "workspace");
          renderLevel("workspace", initialTab);
        },
      }),
    );
    drawerSlot.hidden = false;
    document.body.classList.add("has-parcel-drawer");
    drawerSlot.querySelector(".parcel-btn:not([disabled])")?.focus({ preventScroll: true });
  } else {
    cardSlot.replaceChildren();
    cardSlot.hidden = true;
    drawerSlot.replaceChildren();
    drawerSlot.hidden = true;
    if (!workspaceSections) {
      workspaceSections = new Set(summary.addresses.count > 1 ? ["addresses"] : []);
    }
    const workspace = parcelWorkspaceElement(summary, labels, {
      geometry,
      releaseId,
      developmentCount: current.developmentCount ?? 0,
      developmentRecords: current.developmentRecords ?? [],
      developmentLoading: Boolean(current.developmentLoading),
      savedDevelopmentRecordIds: savedItems.filter((item) => item.kind === "development").map((item) => item.key ?? item.id),
      onSaveDevelopmentRecord: saveDevelopmentRecord,
      onCreateDevelopmentNote: (record, text) => createDevelopmentRecordNote(record, text, current?.key ?? null),
      notesStore,
      sourceRecords,
      onSave: () => void toggleSaveCurrentParcel(),
      initialTab: tab,
      openSections: workspaceSections,
      onToggleSection: (id, open) => {
        if (open) workspaceSections.add(id);
        else workspaceSections.delete(id);
      },
      onBackToMap: () => {
        updateLocation(current.key);
        renderLevel("drawer");
      },
      onClose: stepBack,
    });
    trapFocus(workspace);
    workspaceSlot.replaceChildren(workspace);
    workspaceSlot.hidden = false;
    document.body.classList.add("has-parcel-workspace");
    workspace.querySelector(".parcel-btn:not([disabled])")?.focus({ preventScroll: true });
    if ((current.developmentCount ?? 0) > 0 && !current.developmentRecordsLoaded && !current.developmentLoading && developmentLoader) {
      current.developmentLoading = true;
      void developmentLoader.forParcel(current.key).then((result) => {
        if (current?.key !== summary.key) return;
        current.developmentLoading = false;
        current.developmentRecordsLoaded = true;
        current.developmentRecords = result.ok ? result.records : [];
        if (view === "workspace") renderLevel("workspace", tab);
      });
    }
  }
  view = level;
  syncSaveButton();
  // A parcel clicked on the map eases into the visible area above the
  // panel; a deep link carries no location, so the map does not move.
  // The workspace fills the map window, so there is nothing to ease to.
  if (geometry && level !== "workspace") {
    const panel = level === "card" ? cardSlot.firstElementChild : drawerSlot.firstElementChild;
    map.focusParcel(geometry, (panel?.offsetHeight ?? 0) + 16);
  }
}

async function openParcel(parcel, trigger, level = "card") {
  if (!loader || !labels) {
    status("The Hamilton data release is unavailable; the still image remains available.");
    return;
  }
  if (selected?.id === parcel.id && view === level && current) return;
  if (parcel.geometry) rememberGeometry(parcel.id, parcel.geometry);
  const token = ++loadToken;
  loading = true;
  selected = parcel;
  opener = trigger || opener;
  setLayersOpen(false, { restoreFocus: false });
  map.select(parcel);
  status("Loading verified parcel record…");
  const coreResult = await loader.core(parcel.id);
  if (token !== loadToken) {
    loading = false;
    return;
  }
  if (!coreResult.ok) {
    loading = false;
    closeAll();
    status("The selected key is not available in the pinned Hamilton release.");
    return;
  }
  const detailResult = await loader.detail(parcel.id);
  if (token !== loadToken) {
    loading = false;
    return;
  }
  // Access and services: optional; the parcel opens without it.
  const accessResult = (await accessPinned).ok && accessLoader ? await accessLoader.forParcel(parcel.id) : { ok: false };
  if (token !== loadToken) {
    loading = false;
    return;
  }
  loading = false;
  const summary = summariseRecord(
    coreResult.record,
    detailResult.ok ? detailResult.record : null,
    labels,
    { sources: manifestSources },
  );
  summary.access = accessResult.ok ? summariseAccess(accessResult.record, labels) : null;
  current = {
    key: parcel.id,
    summary,
    releaseId: coreResult.release.id,
    geometry: parcel.geometry ?? rememberedGeometry(parcel.id),
    sourceRecords: { core: coreResult.record, detail: detailResult.ok ? detailResult.record : null },
    developmentCount: developmentLoader?.countForParcel(parcel.id) ?? 0,
    developmentRecords: [],
    developmentRecordsLoaded: false,
    developmentLoading: false,
  };
  updateLocation(parcel.id, level);
  renderLevel(level);
  status(`Verified parcel record · release ${coreResult.release.id}`);
}

function stepBack() {
  if (loading) {
    closeAll();
    return;
  }
  if (view === "workspace" && current) {
    updateLocation(current.key);
    renderLevel("drawer");
  } else if (view === "drawer" && current) {
    updateLocation(current.key, "card");
    renderLevel("card");
  } else if (view === "card") {
    closeAll();
  }
}

function closeAll() {
  if (!selected && !view) return;
  loadToken++;
  loading = false;
  selected = null;
  current = null;
  view = null;
  cardSlot.replaceChildren();
  cardSlot.hidden = true;
  drawerSlot.replaceChildren();
  drawerSlot.hidden = true;
  workspaceSlot.replaceChildren();
  workspaceSlot.hidden = true;
  document.body.classList.remove("has-parcel-card", "has-parcel-drawer", "has-parcel-workspace");
  for (const id of ["parcel-save-dialog", "parcel-notes-dialog"]) {
    const dialog = document.getElementById(id);
    if (dialog?.open) dialog.close();
  }
  setLayersOpen(false, { restoreFocus: false });
  syncSaveButton();
  map.close();
  updateLocation(null);
  if (opener?.isConnected && !opener.hidden) opener.focus({ preventScroll: true });
  else (document.getElementById("hm-map-search") ?? document.getElementById("search"))?.focus({ preventScroll: true });
}

function parcelKey(value) {
  const key = value.trim();
  return key.startsWith("ia:ca:on:hamilton:parcel:") ? key : null;
}

function search() {
  const input = document.getElementById("hm-map-search") ?? document.getElementById("search");
  const key = parcelKey(input.value);
  const list = document.getElementById("samples");
  list.replaceChildren();
  if (!key) {
    document.getElementById("result-count").textContent = "";
    document.getElementById("search-status").textContent =
      "Select a parcel on the map, or paste a full Hamilton parcel key.";
    return;
  }
  const button = el("button", undefined, "sample");
  button.append(el("span", "↗", "sample-number"), el("span", key), el("span", "›", "sample-arrow"));
  button.addEventListener("click", () => openParcel({ id: key }, button, "drawer"));
  list.append(button);
  document.getElementById("result-count").textContent = "1 key";
  document.getElementById("search-status").textContent = "Open this release record.";
}

function route() {
  const params = new URLSearchParams(location.hash.slice(1));
  const key = params.get("parcel");
  if (!key) {
    if (selected) closeAll();
    return;
  }
  const fullKey = parcelKey(key);
  // A deep link opens the drawer; view=card opens the card, view=work
  // the workspace (BL-118).
  if (fullKey) {
    const level = params.get("view") === "card" ? "card" : params.get("view") === "work" ? "workspace" : "drawer";
    void openParcel({ id: fullKey, geometry: rememberedGeometry(fullKey) }, null, level);
  } else status("This is not a Hamilton parcel key.");
}

async function start() {
  try {
    notesStore = await createNotesStore();
    savedItems = await recordsFor("saved");
  } catch (error) {
    status(`Local notes are unavailable: ${error.message}`);
    notesStore = {
      available: false,
      notesFor: async () => [],
      add: async () => { throw new Error("IndexedDB is unavailable."); },
      remove: async () => { throw new Error("IndexedDB is unavailable."); },
    };
    savedItems = [];
  }
  const labelsPromise = loadLabels({ base: "/labels/", locales: ["en"] });
  loader = createDossierLoader({ base: RELEASE_BASE });
  accessLoader = createAccessLoader({ base: ACCESS_BASE });
  accessPinned = accessLoader.pin();
  developmentLoader = createHamiltonDevelopmentLoader({ base: DEVELOPMENT_BASE });
  const developmentPackage = await developmentLoader.pin();
  const developmentButton = document.getElementById("development-overview-open");
  if (developmentPackage.ok && developmentButton) developmentButton.hidden = false;
  developmentButton?.addEventListener("click", async (event) => {
    const button = event.currentTarget;
    const dialog = document.getElementById("development-overview-dialog");
    button.disabled = true;
    status("Loading Hamilton development snapshot…");
    const result = await developmentLoader.citySnapshot();
    button.disabled = false;
    if (!result.ok) {
      status("The Hamilton development snapshot is unavailable.");
      return;
    }
    const snapshot = result.snapshot;
    const showSnapshot = () => {
      dialog.classList.remove("hm-development-browser-open");
      dialog.setAttribute("aria-label", "Hamilton development at a glance");
      dialog.replaceChildren(cityDevelopmentSheetElement(snapshot, {
        onBrowse: async () => {
          status("Loading all Hamilton permit records…");
          const records = await developmentLoader.allRecords();
          if (!records.ok) {
            status("Hamilton permit records are unavailable.");
            return;
          }
          dialog.replaceChildren(developmentRecordsBrowserElement(records.records, {
            onBack: showSnapshot,
            onClose: () => dialog.close(),
            savedRecordIds: savedItems.filter((item) => item.kind === "development").map((item) => item.key ?? item.id),
            onSaveRecord: saveDevelopmentRecord,
            onCreateNote: (record, text) => createDevelopmentRecordNote(record, text),
          }));
          dialog.classList.add("hm-development-browser-open");
          dialog.setAttribute("aria-label", "Hamilton development records");
          status(`${records.records.length.toLocaleString("en-CA")} Hamilton permit records ready`);
        },
      }));
    };
    showSnapshot();
    dialog.showModal();
    status(`${result.snapshot.coverage.monthly_report_count} monthly permit reports · latest ${result.snapshot.coverage.last_report_month}`);
  });
  const pin = await loader.pin();
  const tileResult = pin.ok ? await loader.asset("tiles/tiles-manifest.json") : { ok: false };
  const layerResult = pin.ok ? await loader.asset("tiles/layers.json") : { ok: false };
  let mapLayerManifest = null;
  try {
    const response = await fetch(`${MAP_LAYER_BASE}manifest.json`);
    if (response.ok) {
      const doc = await response.json();
      if (doc.schema === 1 && Array.isArray(doc.layers) && doc.basemap?.file)
        mapLayerManifest = doc;
    }
  } catch {
    // The map keeps its still image and parcel behavior if optional context is unavailable.
  }
  labels = await labelsPromise;
  manifestSources = pin.ok ? pin.manifest?.sources ?? null : null;

  const tileManifest = tileResult.ok ? tileResult.doc : null;
  const parcelLayer = layerResult.ok
    ? layerResult.doc.layers?.find((layer) => layer.role === "parcel" && layer.default_visible)
    : null;
  const tilesReady = Boolean(
    pin.ok && tileManifest && parcelLayer && parcelLayer.tile_layer === tileManifest.tile_layer,
  );
  const basemap = mapLayerManifest ? await findBasemap(MAP_LAYER_BASE) : null;
  if (basemap) {
    const note = document.getElementById("map-display-note");
    if (note) note.textContent = "Street basemap · parcel selection from zoom 14";
  }
  const requestedBasemapFlavor = new URLSearchParams(location.search).get("basemap");
  const basemapFlavor = ["dark", "grayscale"].includes(requestedBasemapFlavor) ? requestedBasemapFlavor : "white";
  map = new FieldMap({
    basemap,
    overlays: mapLayerManifest?.layers ?? [],
    overlaysBase: MAP_LAYER_BASE,
    developmentOverviewUrl: `${DEVELOPMENT_BASE}city_development_mosaic_v0.1.geojson`,
    // Style preference can be shared in a URL, e.g. /map/?basemap=dark.
    flavor: basemapFlavor,
    onSelect: (parcel, trigger) => void openParcel(parcel, trigger, view ?? "card"),
    onStatus: status,
    onReady: finishMapLoading,
    tilesUrl: tilesReady ? `${RELEASE_BASE}tiles/parcels.pmtiles` : null,
    tileLayer: tilesReady ? tileManifest.tile_layer : null,
    minZoom: tilesReady ? tileManifest.min_zoom : 14,
    maxZoom: tilesReady ? tileManifest.max_zoom : 16,
  });

  document.body.classList.toggle("basemap-dark", basemapFlavor === "dark");
  for (const flavor of ["white", "dark", "grayscale"]) {
    const button = document.getElementById(`basemap-${flavor}`);
    button.setAttribute("aria-pressed", String(flavor === basemapFlavor));
    button.disabled = !basemap;
    button.addEventListener("click", () => {
      const params = new URLSearchParams(location.search);
      if (flavor === "white") params.delete("basemap");
      else params.set("basemap", flavor);
      const query = params.toString();
      location.search = query ? `?${query}` : "";
    });
  }

  if (tilesReady) {
    document.getElementById("parcel-count").textContent =
      `${tileManifest.feature_count.toLocaleString("en-CA")} parcels`;
    document.getElementById("search-status").textContent =
      "Select a parcel outline at zoom 14+, or paste a full parcel key.";
  } else {
    document.getElementById("parcel-count").textContent = "Unavailable";
    status("Hamilton parcel data could not be verified. The still image remains available.");
  }

  const checkbox = document.getElementById("parcels-visible");
  checkbox.addEventListener("change", () => map.toggleParcels(checkbox.checked));
  const developmentToggle = document.getElementById("development-activity-visible");
  const developmentFrom = document.getElementById("development-period-from");
  const developmentTo = document.getElementById("development-period-to");
  const developmentPeriodStatus = document.getElementById("development-period-status");
  const developmentMonths = developmentPackage.ok ? developmentPackage.reportMonths : [];
  if (developmentMonths.length) {
    developmentFrom.min = developmentTo.min = developmentMonths[0];
    developmentFrom.max = developmentTo.max = developmentMonths.at(-1);
    developmentFrom.value = developmentMonths[0];
    developmentTo.value = developmentMonths.at(-1);
    developmentFrom.disabled = developmentTo.disabled = false;
    developmentToggle.disabled = false;
    developmentPeriodStatus.textContent = `${developmentMonths[0]} to ${developmentMonths.at(-1)} · issued-permit records · ${developmentPackage.activityMosaic?.cell_count?.toLocaleString("en-CA") ?? "Citywide"} citywide cells`;
  } else {
    developmentPeriodStatus.textContent = "Development records are unavailable.";
  }
  let developmentRecords = null;
  let developmentRecordsPromise = null;
  const updateDevelopmentActivity = async () => {
    if (!developmentToggle.checked) {
      map.setDevelopmentActivityParcels([]);
      updateLayerLibrary();
      return;
    }
    if (developmentFrom.value && developmentTo.value && developmentFrom.value > developmentTo.value) {
      developmentPeriodStatus.textContent = "Choose a start month on or before the end month.";
      map.setDevelopmentActivityParcels([]);
      return;
    }
    developmentPeriodStatus.textContent = "Loading linked permit records…";
    developmentToggle.disabled = true;
    if (!developmentRecords) {
      developmentRecordsPromise ??= developmentLoader.allRecords();
      const result = await developmentRecordsPromise;
      developmentRecords = result.ok ? result.records : null;
      developmentRecordsPromise = null;
    }
    developmentToggle.disabled = false;
    if (!developmentRecords) {
      developmentPeriodStatus.textContent = "Development permit records could not be loaded.";
      developmentToggle.checked = false;
      map.setDevelopmentActivityParcels([]);
      updateLayerLibrary();
      return;
    }
    const matches = developmentRecords.filter((record) =>
      record.parcel_ids?.length
      && (!developmentFrom.value || record.report_month >= developmentFrom.value)
      && (!developmentTo.value || record.report_month <= developmentTo.value),
    );
    const parcelKeys = new Set(matches.flatMap((record) => record.parcel_ids));
    map.setDevelopmentActivityParcels(parcelKeys);
    map.setDevelopmentActivityRange(developmentMonths, developmentFrom.value, developmentTo.value);
    const locationless = developmentPackage.activityMosaic?.records_without_usable_parcel_location ?? 0;
    developmentPeriodStatus.textContent = `${matches.length.toLocaleString("en-CA")} permits · ${parcelKeys.size.toLocaleString("en-CA")} parcels · ${developmentFrom.value} to ${developmentTo.value} · ${locationless.toLocaleString("en-CA")} records in the full release lack a mappable parcel location and remain in the viewer`;
    updateLayerLibrary();
  };
  developmentToggle.addEventListener("change", () => void updateDevelopmentActivity());
  developmentFrom.addEventListener("change", () => { if (developmentToggle.checked) void updateDevelopmentActivity(); });
  developmentTo.addEventListener("change", () => { if (developmentToggle.checked) void updateDevelopmentActivity(); });
  const thematic = document.getElementById("thematic-layers");
  if (mapLayerManifest) {
    // Sections follow the release's groups, in manifest order; titles are HeavyMap wording.
    const titles = { planning: "Planning", protected: "Protected and regulated", parks: "Parks", freight: "Freight and access", utilities: "Water and sewer" };
    const sections = [...new Set(mapLayerManifest.layers.map((layer) => layer.group))].map((key) => ({
      key, title: titles[key] ?? key,
      ids: mapLayerManifest.layers.filter((layer) => layer.group === key).map((layer) => layer.id),
    }));
    thematic.replaceChildren();
    for (const section of sections) {
      const layers = section.ids.map((id) => mapLayerManifest.layers.find((layer) => layer.id === id)).filter(Boolean);
      if (!layers.length) continue;
      const group = document.createElement("div");
      group.className = "layer-group thematic-layer-group";
      group.dataset.layerGroup = section.key;
      const heading = document.createElement("h3");
      heading.textContent = section.title;
      group.append(heading);
      for (const layer of layers) {
        const label = document.createElement("label");
        label.className = "layer thematic-layer";
        const input = document.createElement("input");
        input.type = "checkbox";
        input.checked = false;
        input.setAttribute("aria-label", `Show ${layer.label}`);
        input.addEventListener("change", () => {
          map.toggleOverlay(layer.id, input.checked);
          updateLayerLibrary();
        });
        const text = document.createElement("span");
        const title = document.createElement("strong");
        title.textContent = layer.label;
        const details = document.createElement("small");
        const zoom = layer.geometry
          ? `visible from z${layer.min_zoom} · source z${layer.min_zoom}–${layer.max_zoom}`
          : `visible z${layer.min_zoom}–${layer.max_zoom}`;
        details.textContent = `${layer.source} · ${layer.feature_count.toLocaleString("en-CA")} features · ${layer.source_date} · ${zoom}`;
        text.append(title, details);
        label.append(input, text);
        group.append(label);
      }
      thematic.append(group);
    }
  } else {
    thematic.textContent = "Thematic map layers are unavailable.";
  }
  updateLayerLibrary();
  const searchInput = document.getElementById("hm-map-search") ?? document.getElementById("search");
  searchInput.addEventListener("input", search);
  searchInput.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    search();
    document.querySelector("#samples button")?.click();
  });
  document.getElementById("search-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    search();
    document.querySelector("#samples button")?.click();
  });
  const layersPanel = document.getElementById("layers-panel");
  for (const eventName of ["pointerdown", "click"]) {
    layersPanel.addEventListener(eventName, (event) => event.stopPropagation());
  }
  const layersDialog = document.getElementById("layers-dialog");
  document.getElementById("layers-toggle").addEventListener("click", () => setLayersOpen(true));
  document.querySelector("[data-layers-close]")?.addEventListener("click", () => setLayersOpen(false));
  document.getElementById("layers-backdrop").addEventListener("click", () => setLayersOpen(false, { restoreFocus: false }));
  document.addEventListener("click", (event) => {
    if (!layersPanel.classList.contains("is-collapsed") && !layersPanel.contains(event.target))
      setLayersOpen(false, { restoreFocus: false });
  });
  document.getElementById("layers-search").addEventListener("input", updateLayerLibrary);
  document.getElementById("layers-categories").addEventListener("click", (event) => {
    const button = event.target.closest("[data-layer-filter]");
    if (!button) return;
    for (const item of event.currentTarget.querySelectorAll("[data-layer-filter]"))
      item.setAttribute("aria-pressed", String(item === button));
    updateLayerLibrary();
  });
  layersDialog.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      setLayersOpen(false);
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = [...layersDialog.querySelectorAll("button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex='-1'])")]
      .filter((item) => !item.hidden && item.getClientRects().length > 0);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (document.getElementById("parcel-save-dialog")?.open || document.getElementById("parcel-notes-dialog")?.open) return;
    if (!layersPanel.classList.contains("is-collapsed")) setLayersOpen(false);
    else stepBack();
  });
  document.getElementById("parcels-visible").addEventListener("change", updateLayerLibrary);
  document.querySelector("[data-save-parcel]")?.addEventListener("click", openSaveService);
  document.querySelector("[data-note-parcel]")?.addEventListener("click", openNoteService);
  for (const id of ["parcel-save-dialog", "parcel-notes-dialog"]) {
    const dialog = document.getElementById(id);
    dialog?.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
  }
  syncSaveButton();
  let resizeTimer;
  addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => map.resize(), 150);
  });
  addEventListener("hashchange", route);
  route();
  if (import.meta.env.DEV) window.__heavymap = { map: map.map, controller: map };
}

void start().catch((error) => {
  console.error("HeavyMap could not initialize", error);
  status("The map could not be initialized. Please refresh to try again.");
  finishMapLoading();
});
