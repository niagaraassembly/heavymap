import "maplibre-gl/dist/maplibre-gl.css";
import "./style.css";
import { loadLabels } from "./labels.js";
import { createDossierLoader } from "./dossier-loader.js";
import { summariseRecord } from "./parcel-summary.js";
import { parcelCardElement, parcelDrawerElement } from "./parcel-views.js";
import { parcelWorkspaceElement } from "./parcel-workspace.js";
import { createNotesStore } from "./parcel-notes.js";
import { el } from "./dossier.js";
import { FieldMap } from "./map.js";
import { findBasemap } from "./basemap.js";

const RELEASE_BASE = "/map/data/ca-on-hamilton/2026-11-16-d070/";
// The street basemap is a separate artifact from the parcel release.
const BASEMAP_BASE = "/map/basemap/ca-on-hamilton/20261116/";
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
/* Which workspace sections are open, remembered while moving between
 * parcels in the session (design §5.4). Set on the first workspace open:
 * Addresses open only when the parcel has more than one. */
let workspaceSections = null;

function status(text) {
  document.getElementById("map-status").textContent = text;
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
  document.getElementById("tray").classList.remove("mobile-open");
  document.getElementById("tray-toggle").setAttribute("aria-expanded", "false");
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
  let notesStorage = null;
  try {
    notesStorage = window.localStorage;
  } catch {
    notesStorage = null;
  }
  notesStore = createNotesStore(notesStorage);
  const labelsPromise = loadLabels({ base: "/labels/", locales: ["en"] });
  loader = createDossierLoader({ base: RELEASE_BASE });
  const pin = await loader.pin();
  const tileResult = pin.ok ? await loader.asset("tiles/tiles-manifest.json") : { ok: false };
  const layerResult = pin.ok ? await loader.asset("tiles/layers.json") : { ok: false };
  labels = await labelsPromise;
  manifestSources = pin.ok ? pin.manifest?.sources ?? null : null;

  const tileManifest = tileResult.ok ? tileResult.doc : null;
  const parcelLayer = layerResult.ok
    ? layerResult.doc.layers?.find((layer) => layer.role === "parcel" && layer.default_visible)
    : null;
  const tilesReady = Boolean(
    pin.ok && tileManifest && parcelLayer && parcelLayer.tile_layer === tileManifest.tile_layer,
  );
  const basemap = await findBasemap(BASEMAP_BASE);
  if (basemap) {
    // The page ships with still-image wording; correct it when the vector
    // basemap is in use. OpenStreetMap attribution is a licence condition.
    const credit = document.querySelector(".hm-map-context span:nth-child(2)");
    if (credit?.firstChild?.nodeType === Node.TEXT_NODE) credit.firstChild.textContent = "Map data © ";
    const note = document.querySelector(".honesty");
    if (note) note.textContent = "Street basemap · parcel selection from zoom 14";
  }
  map = new FieldMap({
    basemap,
    // Comparison aid while the style is chosen: /map/?basemap=dark
    flavor: new URLSearchParams(location.search).get("basemap") ?? "light",
    onSelect: (parcel, trigger) => void openParcel(parcel, trigger, view ?? "card"),
    onStatus: status,
    tilesUrl: tilesReady ? `${RELEASE_BASE}tiles/parcels.pmtiles` : null,
    tileLayer: tilesReady ? tileManifest.tile_layer : null,
    minZoom: tilesReady ? tileManifest.min_zoom : 14,
    maxZoom: tilesReady ? tileManifest.max_zoom : 16,
  });

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
  document.getElementById("home").addEventListener("click", () => map.home());
  document.getElementById("tray-toggle").addEventListener("click", (event) => {
    const open = document.getElementById("tray").classList.toggle("mobile-open");
    event.currentTarget.setAttribute("aria-expanded", String(open));
  });
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
