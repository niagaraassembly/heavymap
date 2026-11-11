/* Render page for build/map/render-hamilton.mjs. Not shipped: it draws the
 * Hamilton lower city and waterfront once, from a dated Protomaps build
 * (OpenStreetMap data), with HeavyMap's colours, so the site can serve a
 * still image (decision 67). Parameters come from the query string. */
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Protocol } from "pmtiles";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import { hamiltonStyle } from "./style.js";

maplibregl.setWorkerUrl(workerUrl);
const protocol = new Protocol();
maplibregl.addProtocol("pmtiles", protocol.tile);

const q = new URLSearchParams(location.search);
const bounds = JSON.parse(q.get("bounds"));
const map = new maplibregl.Map({
  container: "map",
  style: hamiltonStyle(`pmtiles://${location.origin}${q.get("archive")}`),
  bounds,
  fitBoundsOptions: { padding: 0 },
  interactive: false,
  attributionControl: false,
  canvasContextAttributes: { preserveDrawingBuffer: true, antialias: true },
  fadeDuration: 0,
});
map.once("idle", () => {
  window.__rendered = {
    webp: map.getCanvas().toDataURL("image/webp", 0.86),
    center: map.getCenter().toArray(),
    zoom: map.getZoom(),
    bounds: map.getBounds().toArray(),
  };
});
map.on("error", (e) => {
  window.__renderError = String(e.error?.message ?? e);
});
