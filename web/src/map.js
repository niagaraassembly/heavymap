import * as maplibregl from "maplibre-gl";
import { Protocol } from "pmtiles";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import {
  BASEMAP_SOURCE,
  GLYPHS_URL,
  GROUND,
  PARCEL_PAINT,
  basemapFlavor,
  basemapLayers,
  firstLabelLayerId,
} from "./basemap.js";

maplibregl.setWorkerUrl(workerUrl);
const protocol = new Protocol();
maplibregl.addProtocol("pmtiles", protocol.tile);

const STILL_BOUNDS = [
  [-79.91663604095358, 43.289999999999736],
  [-79.81336395904835, 43.289999999999736],
  [-79.81336395904835, 43.24299999999991],
  [-79.91663604095358, 43.24299999999991],
];
const STILL_BOUNDS_TALL = [
  [-79.90499999999948, 43.3020937227017],
  [-79.82499999999926, 43.3020937227017],
  [-79.82499999999926, 43.230894530018105],
  [-79.90499999999948, 43.230894530018105],
];

export class FieldMap {
  constructor({ onSelect, onStatus, tilesUrl, tileLayer, minZoom = 14, maxZoom = 16, basemap = null, flavor = "light", overlays = [], overlaysBase = null }) {
    this.basemap = basemap;
    this.flavor = basemapFlavor(flavor);
    this.onStatus = onStatus;
    this.tilesUrl = tilesUrl;
    this.tileLayer = tileLayer;
    this.overlays = overlays;
    this.overlaysBase = overlaysBase;
    this.overlayArchivesAdded = new Set();
    this.overlayVisibility = new Map();
    this.minZoom = minZoom;
    this.maxZoom = maxZoom;
    this.selectedKey = null;
    this.ready = false;
    this.parcelsVisible = true;
    this.map = new maplibregl.Map({
      container: "map",
      center: [-79.87, 43.275],
      zoom: 11.8,
      minZoom: 8,
      maxZoom: 18,
      attributionControl: false,
      style: {
        version: 8,
        glyphs: GLYPHS_URL,
        sources: {},
        layers: [{ id: "ground", type: "background", paint: { "background-color": GROUND[basemap ? this.flavor : "light"] } }],
      },
    });
    this.map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    this.map.on("load", () => {
      const map = this.map;
      const narrow = matchMedia("(max-width: 700px)").matches;
      map.addSource("hamilton-still", {
        type: "image",
        url: narrow ? "/map/hamilton-lower-city-tall.webp" : "/map/hamilton-lower-city-wide.webp",
        coordinates: narrow ? STILL_BOUNDS_TALL : STILL_BOUNDS,
      });
      map.addLayer({ id: "hamilton-still", type: "raster", source: "hamilton-still", paint: { "raster-opacity": 0.94 } });

      // Vector basemap over the still image; parcels go beneath its labels.
      // If it cannot be read, its layers are removed and the still remains.
      let beneathLabels;
      if (this.basemap) {
        const list = basemapLayers(this.flavor);
        map.addSource(BASEMAP_SOURCE, {
          type: "vector",
          url: `pmtiles://${this.basemap.url}`,
          maxzoom: this.basemap.maxZoom,
        });
        for (const layer of list) map.addLayer(layer);
        beneathLabels = firstLabelLayerId(list);
        if (this.flavor === "dark") map.setLayoutProperty("hamilton-still", "visibility", "none");
        const dropBasemap = (event) => {
          if (event.sourceId !== BASEMAP_SOURCE) return;
          map.off("error", dropBasemap);
          for (const layer of list) if (map.getLayer(layer.id)) map.removeLayer(layer.id);
          if (map.getSource(BASEMAP_SOURCE)) map.removeSource(BASEMAP_SOURCE);
          map.setLayoutProperty("hamilton-still", "visibility", "visible");
          map.setPaintProperty("ground", "background-color", GROUND.light);
          if (map.getLayer("parcels-fill")) {
            const still = PARCEL_PAINT.still;
            const selected = ["boolean", ["feature-state", "selected"], false];
            map.setPaintProperty("parcels-fill", "fill-color", ["case", selected, still.selFill, still.fill]);
            map.setPaintProperty("parcels-fill", "fill-opacity", ["case", selected, still.selFillOpacity, still.fillOpacity]);
            map.setPaintProperty("parcels-line", "line-color", ["case", selected, still.selLine, still.line]);
            map.setPaintProperty("parcels-line", "line-width", ["case", selected, 2.4, still.lineWidth]);
          }
          onStatus("The street basemap could not be loaded. The still image remains available.");
          const note = document.getElementById("map-display-note");
          if (note) note.textContent = "Still image fallback · parcel selection from zoom 14";
        };
        map.on("error", dropBasemap);
      }
      this.beneathLabels = beneathLabels;

      const paint = PARCEL_PAINT[this.basemap ? this.flavor : "still"];
      if (this.tilesUrl && this.tileLayer) {
        map.addSource("parcels", {
          type: "vector",
          url: `pmtiles://${this.tilesUrl}`,
          minzoom: this.minZoom,
          maxzoom: this.maxZoom,
          promoteId: "key",
        });
        map.addLayer({
          id: "parcels-fill",
          type: "fill",
          source: "parcels",
          "source-layer": this.tileLayer,
          minzoom: this.minZoom,
          paint: {
            "fill-color": ["case", ["boolean", ["feature-state", "selected"], false], paint.selFill, paint.fill],
            "fill-opacity": ["case", ["boolean", ["feature-state", "selected"], false], paint.selFillOpacity, paint.fillOpacity],
          },
        }, beneathLabels);
        map.addLayer({
          id: "parcels-line",
          type: "line",
          source: "parcels",
          "source-layer": this.tileLayer,
          minzoom: this.minZoom,
          paint: {
            "line-color": ["case", ["boolean", ["feature-state", "selected"], false], paint.selLine, paint.line],
            "line-width": ["case", ["boolean", ["feature-state", "selected"], false], 2.4, paint.lineWidth],
          },
        }, beneathLabels);
        map.on("click", "parcels-fill", (event) => {
          const feature = event.features?.[0];
          const key = feature?.properties?.key;
          if (typeof key === "string")
            onSelect({ id: key, key, geometry: feature.geometry ?? null }, map.getCanvas());
        });
        map.on("mouseenter", "parcels-fill", () => { map.getCanvas().style.cursor = "pointer"; });
        map.on("mouseleave", "parcels-fill", () => { map.getCanvas().style.cursor = ""; });
        map.on("error", (event) => {
          if (event.sourceId === BASEMAP_SOURCE) return;
          if (event.sourceId === "parcels" || event.error?.message?.includes("PMTiles"))
            onStatus("Hamilton parcel tiles could not be loaded. The still image remains available.");
        });
      }

      this.ready = true;
      for (const [id, show] of this.overlayVisibility) if (show) this.toggleOverlay(id, true);
      map.on("error", (event) => {
        if (event.sourceId?.startsWith("overlay-source-"))
          this.onStatus("This map layer could not be loaded. Check your connection and try again.");
      });
      this.toggleParcels(this.parcelsVisible);
      this.reportZoom();
      map.on("zoomend", () => this.reportZoom());
      onStatus(this.tilesUrl ? `Hamilton parcels · selectable from zoom ${this.minZoom}` : "Hamilton still image · parcel data unavailable");
    });
  }

  reportZoom() {
    if (!this.tilesUrl) return;
    if (this.map.getZoom() < this.minZoom)
      this.onStatus(`Zoom in to level ${this.minZoom} to see and select Hamilton parcels.`);
    else if (this.map.getZoom() > this.maxZoom)
      this.onStatus(`Parcel tiles are available through zoom ${this.maxZoom}; closer views are enlarged.`);
    else this.onStatus("Select a parcel outline to open its verified dossier record.");
  }

  select(parcel) {
    if (!parcel?.id) return;
    if (this.selectedKey && this.ready && this.map.getSource("parcels"))
      this.map.setFeatureState({ source: "parcels", sourceLayer: this.tileLayer, id: this.selectedKey }, { selected: false });
    this.selectedKey = parcel.id;
    if (this.ready && this.map.getSource("parcels"))
      this.map.setFeatureState({ source: "parcels", sourceLayer: this.tileLayer, id: this.selectedKey }, { selected: true });
  }

  close() {
    if (this.selectedKey && this.ready && this.map.getSource("parcels"))
      this.map.setFeatureState({ source: "parcels", sourceLayer: this.tileLayer, id: this.selectedKey }, { selected: false });
    this.selectedKey = null;
  }

  toggleParcels(show) {
    this.parcelsVisible = show;
    if (!this.ready || !this.map.getLayer("parcels-fill")) return;
    for (const id of ["parcels-fill", "parcels-line"])
      this.map.setLayoutProperty(id, "visibility", show ? "visible" : "none");
  }

  toggleOverlay(id, show) {
    this.overlayVisibility.set(id, show);
    if (!this.ready) return;
    const layer = this.overlays.find((item) => item.id === id);
    if (!layer) return;
    const archive = layer.file.split("/").at(-1).replace(/\.pmtiles$/, "");
    const sourceId = `overlay-source-${archive}`;
    if (!this.overlayArchivesAdded.has(archive)) {
      this.map.addSource(sourceId, {
        type: "vector",
        url: `pmtiles://${this.overlaysBase}${layer.file}`,
        minzoom: 6,
        maxzoom: 14,
      });
      const before = this.beneathLabels && this.map.getLayer(this.beneathLabels) ? this.beneathLabels : undefined;
      for (const item of this.overlays.filter((candidate) => candidate.file === layer.file)) {
        const color = item.color || "#557a78";
        this.map.addLayer({
          id: `overlay-${item.id}-fill`, type: "fill", source: sourceId, "source-layer": item.tile_layer,
          minzoom: item.min_zoom, maxzoom: item.max_zoom,
          layout: { visibility: "none" },
          paint: { "fill-color": color, "fill-opacity": 0.20 },
        }, before);
        this.map.addLayer({
          id: `overlay-${item.id}-line`, type: "line", source: sourceId, "source-layer": item.tile_layer,
          minzoom: item.min_zoom, maxzoom: item.max_zoom,
          layout: { visibility: "none" },
          paint: { "line-color": color, "line-width": 1.2, "line-opacity": 0.86 },
        }, before);
      }
      this.overlayArchivesAdded.add(archive);
    }
    for (const suffix of ["fill", "line"])
      if (this.map.getLayer(`overlay-${id}-${suffix}`))
        this.map.setLayoutProperty(`overlay-${id}-${suffix}`, "visibility", show ? "visible" : "none");
  }

  /** Ease the parcel into the visible area above a bottom panel: the
   * parcel's centre lands in the viewport left after the panel (and the
   * open tray, on desktop) is padded out. A deep link has no geometry,
   * so the map does not move for it. */
  focusParcel(geometry, bottomPadding) {
    if (!this.ready || !geometry) return;
    const ring =
      geometry.type === "Polygon"
        ? geometry.coordinates?.[0]
        : geometry.type === "MultiPolygon"
          ? geometry.coordinates?.[0]?.[0]
          : null;
    if (!ring || !ring.length) return;
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const [x, y] of ring) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tray = document.getElementById("tray");
    const trayVisible = tray && getComputedStyle(tray).display !== "none";
    this.map.easeTo({
      center: [(minX + maxX) / 2, (minY + maxY) / 2],
      padding: {
        top: 16,
        left: trayVisible ? tray.getBoundingClientRect().width + 32 : 16,
        right: 16,
        bottom: bottomPadding,
      },
      duration: reduce ? 0 : 300,
    });
  }

  home() {
    this.map.easeTo({ center: [-79.87, 43.275], zoom: 11.8, padding: { top: 0, left: 0, right: 0, bottom: 0 }, duration: 300 });
  }

  resize() { this.map.resize(); }
}
