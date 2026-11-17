import "maplibre-gl/dist/maplibre-gl.css";
import "./style.css";
import { loadLabels } from "./labels.js";
import { createDossierLoader } from "./dossier-loader.js";
import { el, renderSchema2DossierFromLoader } from "./dossier.js";
import { FieldMap } from "./map.js";
import { findBasemap } from "./basemap.js";

const RELEASE_BASE = "/map/data/ca-on-hamilton/2026-11-16-d070/";
// The street basemap is a separate artifact from the parcel release.
const BASEMAP_BASE = "/map/basemap/ca-on-hamilton/20261116/";
const panel = document.getElementById("dossier");
let selected = null;
let opener = null;
let map;
let loader;
let labels;

function status(text) {
  document.getElementById("map-status").textContent = text;
}

function dossierMessage(text) {
  const body = document.getElementById("dossier-body");
  body.replaceChildren(el("p", text, "subtext"));
}

function updateLocation(key) {
  const url = key
    ? `#parcel=${encodeURIComponent(key)}`
    : location.pathname + location.search;
  history.replaceState(null, "", url);
}

async function openParcel(parcel, trigger) {
  if (!loader || !labels) {
    status("The Hamilton data release is unavailable; the still image remains available.");
    return;
  }
  selected = parcel;
  opener = trigger || opener;
  panel.hidden = false;
  document.body.classList.add("has-dossier");
  document.getElementById("tray").classList.remove("mobile-open");
  document.getElementById("tray-toggle").setAttribute("aria-expanded", "false");
  dossierMessage("Loading verified parcel record…");
  map.select(parcel);
  updateLocation(parcel.id);
  const result = await renderSchema2DossierFromLoader(
    loader,
    parcel.id,
    labels,
    document.getElementById("dossier-body"),
  );
  if (!result.ok) {
    dossierMessage(`This parcel record could not be verified (${result.reason}).`);
    status("The selected key is not available in the pinned Hamilton release.");
  } else {
    document.getElementById("dossier-body").scrollTop = 0;
    status(`Verified parcel record · release ${result.release.id}`);
  }
  document.getElementById("close").focus({ preventScroll: true });
}

function close() {
  if (!selected) return;
  panel.hidden = true;
  document.body.classList.remove("has-dossier");
  selected = null;
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
  button.addEventListener("click", () => openParcel({ id: key }, button));
  list.append(button);
  document.getElementById("result-count").textContent = "1 key";
  document.getElementById("search-status").textContent = "Open this release record.";
}

function route() {
  const key = new URLSearchParams(location.hash.slice(1)).get("parcel");
  if (!key) {
    if (selected) close();
    return;
  }
  const fullKey = parcelKey(key);
  if (fullKey) void openParcel({ id: fullKey });
  else status("This is not a Hamilton parcel key.");
}

async function start() {
  const labelsPromise = loadLabels({ base: "/labels/", locales: ["en"] });
  loader = createDossierLoader({ base: RELEASE_BASE });
  const pin = await loader.pin();
  const tileResult = pin.ok ? await loader.asset("tiles/tiles-manifest.json") : { ok: false };
  const layerResult = pin.ok ? await loader.asset("tiles/layers.json") : { ok: false };
  labels = await labelsPromise;

  const tileManifest = tileResult.ok ? tileResult.doc : null;
  const parcelLayer = layerResult.ok
    ? layerResult.doc.layers?.find((layer) => layer.role === "parcel" && layer.default_visible)
    : null;
  const tilesReady = Boolean(
    pin.ok && tileManifest && parcelLayer && parcelLayer.tile_layer === tileManifest.tile_layer,
  );
  const basemap = await findBasemap(BASEMAP_BASE);
  map = new FieldMap({
    basemap,
    // Comparison aid while the style is chosen: /map/?basemap=dark
    flavor: new URLSearchParams(location.search).get("basemap") ?? "light",
    onSelect: (parcel, trigger) => void openParcel(parcel, trigger),
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
  document.getElementById("close").addEventListener("click", close);
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") close(); });
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
