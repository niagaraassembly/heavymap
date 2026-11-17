import "maplibre-gl/dist/maplibre-gl.css";
import "./style.css";
import { loadLabels } from "./labels.js";
import { createDossierLoader } from "./dossier-loader.js";
import { summariseRecord } from "./parcel-summary.js";
import { parcelCardElement, parcelDrawerElement } from "./parcel-views.js";
import { parcelWorkspaceElement } from "./parcel-workspace.js";
import { createNotesStore } from "./local-data.js";
import { el } from "./dossier.js";
import { FieldMap } from "./map.js";
import { findBasemap } from "./basemap.js";

const RELEASE_BASE = "/map/data/ca-on-hamilton/2026-11-16-d070/";
// The street basemap is a separate artifact from the parcel release.
const MAP_LAYER_BASE = "/map/layers/ca-on-hamilton-map-layers/2026-11-16-layer-set-001/";
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
let labels;
let manifestSources = null;
let notesStore = null;
const SAVED_PARCELS_KEY = "heavymap.saved-parcel-keys.v1";
/* Which workspace sections are open, remembered while moving between
 * parcels in the session (design §5.4). Set on the first workspace open:
 * Addresses open only when the parcel has more than one. */
let workspaceSections = null;

function status(text) {
  const barStatus = document.getElementById("map-bar-status");
  if (barStatus) barStatus.textContent = text;
}

function readSavedParcelKeys(storage) {
  try {
    storage ??= window.localStorage;
    const keys = JSON.parse(storage.getItem(SAVED_PARCELS_KEY) ?? "[]");
    return Array.isArray(keys) ? keys.filter((key) => typeof key === "string") : [];
  } catch {
    return [];
  }
}

function syncSaveButton() {
  const button = document.querySelector("[data-save-parcel]");
  if (!button) return;
  const saved = Boolean(current && readSavedParcelKeys().includes(current.key));
  button.setAttribute("aria-pressed", String(saved));
  button.title = saved ? "Remove parcel from saved places" : "Save selected parcel";
  button.setAttribute("aria-label", button.title);
}

function toggleSaveCurrentParcel() {
  if (!current) {
    status("Open a parcel record before saving it.");
    return;
  }
  try {
    const storage = window.localStorage;
    const keys = readSavedParcelKeys(storage);
    const saved = keys.includes(current.key);
    const next = saved ? keys.filter((key) => key !== current.key) : [...keys, current.key];
    storage.setItem(SAVED_PARCELS_KEY, JSON.stringify(next));
    syncSaveButton();
    status(saved ? "Parcel removed from saved places on this device." : "Parcel saved on this device.");
  } catch {
    status("Browser storage is unavailable; this parcel could not be saved.");
  }
}

function openNoteService() {
  if (!current) {
    status("Open a parcel record before adding a note.");
    return;
  }
  if (view !== "workspace") {
    updateLocation(current.key, "workspace");
    renderLevel("workspace", "notes");
  }
  workspaceSlot.querySelector('[data-parcel-tab="notes"]')?.click();
  workspaceSlot.querySelector("textarea")?.focus({ preventScroll: true });
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
  const { summary, releaseId, geometry } = current;
  document.body.classList.remove("has-parcel-card", "has-parcel-drawer", "has-parcel-workspace");
  if (level === "card") {
    drawerSlot.replaceChildren();
    drawerSlot.hidden = true;
    workspaceSlot.replaceChildren();
    workspaceSlot.hidden = true;
    cardSlot.replaceChildren(
      parcelCardElement(summary, labels, {
        geometry,
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
        // BL-107: no feedback target is configured yet, so Report a
        // problem stays hidden.
        feedbackUrl: null,
        onClose: stepBack,
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
      notesStore,
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
  }
  view = level;
  syncSaveButton();
  // A parcel clicked on the map eases into the visible area above the
  // panel; a deep link carries no location, so the map does not move.
  // The workspace fills the map window, so there is nothing to ease to.
  if (geometry && level !== "workspace") {
    const panel = level === "card" ? cardSlot.firstElementChild : drawerSlot.firstElementChild;
    map.focusParcel(geometry, (panel?.offsetHeight ?? 0) + 64 + 16);
  }
}

async function openParcel(parcel, trigger, level = "card") {
  if (!loader || !labels) {
    status("The Hamilton data release is unavailable; the still image remains available.");
    return;
  }
  if (selected?.id === parcel.id && view === level && current) return;
  const token = ++loadToken;
  loading = true;
  selected = parcel;
  opener = trigger || opener;
  const layersPanel = document.getElementById("layers-panel");
  layersPanel.classList.add("is-collapsed");
  document.getElementById("layers-toggle").setAttribute("aria-expanded", "false");
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
  loading = false;
  current = {
    key: parcel.id,
    summary: summariseRecord(
      coreResult.record,
      detailResult.ok ? detailResult.record : null,
      labels,
      { sources: manifestSources },
    ),
    releaseId: coreResult.release.id,
    geometry: parcel.geometry ?? null,
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
  document.getElementById("layers-panel").classList.add("is-collapsed");
  document.getElementById("layers-toggle").setAttribute("aria-expanded", "false");
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
    void openParcel({ id: fullKey }, null, level);
  } else status("This is not a Hamilton parcel key.");
}

async function start() {
  try {
    notesStore = await createNotesStore();
  } catch (error) {
    status(`Local notes are unavailable: ${error.message}`);
    notesStore = {
      available: false,
      notesFor: async () => [],
      add: async () => { throw new Error("IndexedDB is unavailable."); },
      remove: async () => { throw new Error("IndexedDB is unavailable."); },
    };
  }
  const labelsPromise = loadLabels({ base: "/labels/", locales: ["en"] });
  loader = createDossierLoader({ base: RELEASE_BASE });
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
  map = new FieldMap({
    basemap,
    overlays: mapLayerManifest?.layers ?? [],
    overlaysBase: MAP_LAYER_BASE,
    // Comparison aid while the style is chosen: /map/?basemap=dark
    flavor: new URLSearchParams(location.search).get("basemap") ?? "light",
    onSelect: (parcel, trigger) => void openParcel(parcel, trigger, view ?? "card"),
    onStatus: status,
    tilesUrl: tilesReady ? `${RELEASE_BASE}tiles/parcels.pmtiles` : null,
    tileLayer: tilesReady ? tileManifest.tile_layer : null,
    minZoom: tilesReady ? tileManifest.min_zoom : 14,
    maxZoom: tilesReady ? tileManifest.max_zoom : 16,
  });

  const basemapFlavor = basemap && new URLSearchParams(location.search).get("basemap") === "dark" ? "dark" : "light";
  document.body.classList.toggle("basemap-dark", basemapFlavor === "dark");
  for (const flavor of ["light", "dark"]) {
    const button = document.getElementById(`basemap-${flavor}`);
    button.setAttribute("aria-pressed", String(flavor === basemapFlavor));
    if (flavor === "dark") button.disabled = !basemap;
    button.addEventListener("click", () => {
      const params = new URLSearchParams(location.search);
      if (flavor === "light") params.delete("basemap");
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
  const thematic = document.getElementById("thematic-layers");
  if (mapLayerManifest) {
    const sections = [
      { title: "Planning", ids: ["zoning", "secondary-plan-land-use", "urban-boundary", "rural-boundary", "employment-lands"] },
      { title: "Protected and regulated", ids: ["greenbelt", "niagara-escarpment-plan", "conservation-hca", "conservation-npca", "conservation-grca"] },
      { title: "Parks", ids: ["parks"] },
    ];
    thematic.replaceChildren();
    for (const section of sections) {
      const layers = section.ids.map((id) => mapLayerManifest.layers.find((layer) => layer.id === id)).filter(Boolean);
      if (!layers.length) continue;
      const group = document.createElement("div");
      group.className = "layer-group";
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
        input.addEventListener("change", () => map.toggleOverlay(layer.id, input.checked));
        const text = document.createElement("span");
        const title = document.createElement("strong");
        title.textContent = layer.label;
        const details = document.createElement("small");
        details.textContent = `${layer.source} · ${layer.feature_count.toLocaleString("en-CA")} features · ${layer.source_date}`;
        text.append(title, details);
        label.append(input, text);
        group.append(label);
      }
      thematic.append(group);
    }
  } else {
    thematic.textContent = "Thematic map layers are unavailable.";
  }
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
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") stepBack(); });
  const layersPanel = document.getElementById("layers-panel");
  for (const eventName of ["pointerdown", "click"]) {
    layersPanel.addEventListener(eventName, (event) => event.stopPropagation());
  }
  document.getElementById("layers-toggle").addEventListener("click", (event) => {
    const expanded = event.currentTarget.getAttribute("aria-expanded") !== "true";
    event.currentTarget.setAttribute("aria-expanded", String(expanded));
    event.currentTarget.title = expanded ? "Collapse map layers" : "Expand map layers";
    layersPanel.classList.toggle("is-collapsed", !expanded);
  });
  document.querySelector("[data-save-parcel]")?.addEventListener("click", toggleSaveCurrentParcel);
  document.querySelector("[data-note-parcel]")?.addEventListener("click", openNoteService);
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

void start();
