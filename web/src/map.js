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
import { overlayLayerSpecs } from "./overlay-layers.js";

maplibregl.setWorkerUrl(workerUrl);
const protocol = new Protocol();
maplibregl.addProtocol("pmtiles", protocol.tile);

function pmtilesUrl(url) {
  return `pmtiles://${new URL(url, window.location.href).href}`;
}

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
  constructor({ onSelect, onStatus, onReady, tilesUrl, tileLayer, minZoom = 14, maxZoom = 16, basemap = null, flavor = "light", overlays = [], overlaysBase = null, developmentOverviewUrl = null }) {
    this.basemap = basemap;
    this.flavor = basemapFlavor(flavor);
    this.onStatus = onStatus;
    this.onReady = onReady;
    this.tilesUrl = tilesUrl;
    this.tileLayer = tileLayer;
    this.overlays = overlays;
    this.overlaysBase = overlaysBase;
    this.developmentOverviewUrl = developmentOverviewUrl;
    this.developmentOverviewAdded = false;
    this.developmentOverviewVisible = false;
    this.developmentMonths = [];
    this.developmentFrom = null;
    this.developmentTo = null;
    this.overlayArchivesAdded = new Set();
    this.overlayVisibility = new Map();
    this.minZoom = minZoom;
    this.maxZoom = maxZoom;
    this.selectedKey = null;
    this.developmentKeys = new Set();
    this.ready = false;
    this.parcelsVisible = true;
    this.map = new maplibregl.Map({
      container: "map",
      center: [-79.88, 43.27],
      zoom: 10.9,
      minZoom: 8,
      maxZoom: 18,
      attributionControl: false,
      style: {
        version: 8,
        glyphs: GLYPHS_URL,
        sources: {},
        layers: [{ id: "ground", type: "background", paint: { "background-color": GROUND[basemap ? this.flavor : "white"] } }],
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
          url: pmtilesUrl(this.basemap.url),
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
          map.setPaintProperty("ground", "background-color", GROUND.white);
          if (map.getLayer("parcels-fill")) {
            const still = PARCEL_PAINT.still;
            const selected = ["boolean", ["feature-state", "selected"], false];
            const development = ["boolean", ["feature-state", "developmentActivity"], false];
            map.setPaintProperty("parcels-fill", "fill-color", ["case", selected, still.selFill, development, "#e1a957", still.fill]);
            map.setPaintProperty("parcels-fill", "fill-opacity", ["case", selected, still.selFillOpacity, development, 0.42, still.fillOpacity]);
            map.setPaintProperty("parcels-line", "line-color", ["case", selected, still.selLine, development, "#a65316", still.line]);
            map.setPaintProperty("parcels-line", "line-width", ["case", selected, 2.4, development, 1.7, still.lineWidth]);
          }
          console.error("HeavyMap street basemap failed to load", event.error);
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
          url: pmtilesUrl(this.tilesUrl),
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
            "fill-color": ["case", ["boolean", ["feature-state", "selected"], false], paint.selFill, ["boolean", ["feature-state", "developmentActivity"], false], "#e1a957", paint.fill],
            "fill-opacity": ["case", ["boolean", ["feature-state", "selected"], false], paint.selFillOpacity, ["boolean", ["feature-state", "developmentActivity"], false], 0.42, paint.fillOpacity],
          },
        }, beneathLabels);
        map.addLayer({
          id: "parcels-line",
          type: "line",
          source: "parcels",
          "source-layer": this.tileLayer,
          minzoom: this.minZoom,
          paint: {
            "line-color": ["case", ["boolean", ["feature-state", "selected"], false], paint.selLine, ["boolean", ["feature-state", "developmentActivity"], false], "#a65316", paint.line],
            "line-width": ["case", ["boolean", ["feature-state", "selected"], false], 2.4, ["boolean", ["feature-state", "developmentActivity"], false], 1.7, paint.lineWidth],
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
          if (event.sourceId === "parcels" || event.error?.message?.includes("PMTiles")) {
            console.error("HeavyMap parcel tiles failed to load", event.error);
            onStatus("Hamilton parcel tiles could not be loaded. The still image remains available.");
          }
        });
      }

      this.ready = true;
      for (const [id, show] of this.overlayVisibility) if (show) this.toggleOverlay(id, true);
      if (this.developmentKeys.size) {
        this.applyDevelopmentFeatureState();
        this.setDevelopmentOverviewVisible(true);
      }
      map.on("error", (event) => {
        if (event.sourceId?.startsWith("overlay-source-"))
          this.onStatus("This map layer could not be loaded. Check your connection and try again.");
        if (event.sourceId === "development-overview")
          this.onStatus("The citywide development mosaic could not be loaded. Parcel highlights remain available at zoom 14+.");
      });
      this.toggleParcels(this.parcelsVisible);
      this.reportZoom();
      map.on("zoomend", () => this.reportZoom());
      onStatus(this.tilesUrl ? `Hamilton parcels · selectable from zoom ${this.minZoom}` : "Hamilton still image · parcel data unavailable");
      map.once("idle", () => this.onReady?.());
    });
  }

  reportZoom() {
    if (!this.tilesUrl) return;
    if (this.developmentOverviewVisible && this.map.getZoom() >= 8 && this.map.getZoom() < this.minZoom) {
      this.onStatus(`Development activity · citywide mosaic at zoom 8–13 · parcel highlights from zoom ${this.minZoom}.`);
      return;
    }
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

  setDevelopmentActivityParcels(parcelKeys) {
    if (this.ready && this.map.getSource("parcels")) {
      for (const key of this.developmentKeys)
        this.map.setFeatureState({ source: "parcels", sourceLayer: this.tileLayer, id: key }, { developmentActivity: false });
    }
    this.developmentKeys = new Set(parcelKeys);
    if (this.ready && this.map.getSource("parcels")) this.applyDevelopmentFeatureState();
    this.setDevelopmentOverviewVisible(this.developmentKeys.size > 0);
  }

  setDevelopmentActivityRange(months, from, to) {
    this.developmentMonths = months;
    this.developmentFrom = from;
    this.developmentTo = to;
    this.updateDevelopmentOverviewStyle();
  }

  setDevelopmentOverviewVisible(visible) {
    this.developmentOverviewVisible = visible;
    if (!this.ready || !this.developmentOverviewUrl) return;
    this.ensureDevelopmentOverview();
    for (const id of ["development-overview-all", "development-overview-focus", "development-overview-line", "development-overview-count"])
      if (this.map.getLayer(id)) this.map.setLayoutProperty(id, "visibility", visible ? "visible" : "none");
    this.reportZoom();
  }

  ensureDevelopmentOverview() {
    if (this.developmentOverviewAdded || !this.ready || !this.developmentOverviewUrl) return;
    this.map.addSource("development-overview", { type: "geojson", data: this.developmentOverviewUrl });
    const before = this.map.getLayer("parcels-fill") ? "parcels-fill" : undefined;
    const visibility = this.developmentOverviewVisible ? "visible" : "none";
    this.map.addLayer({
      id: "development-overview-all", type: "fill", source: "development-overview",
      minzoom: 8, maxzoom: this.minZoom,
      paint: { "fill-color": "#e3b55e", "fill-opacity": 0.30 },
      layout: { visibility },
    }, before);
    this.map.addLayer({
      id: "development-overview-focus", type: "fill", source: "development-overview",
      minzoom: 8, maxzoom: this.minZoom,
      paint: { "fill-color": "#b85c24", "fill-opacity": 0.52 },
      layout: { visibility },
    }, before);
    this.map.addLayer({
      id: "development-overview-line", type: "line", source: "development-overview",
      minzoom: 8, maxzoom: this.minZoom,
      paint: { "line-color": "#a84f1c", "line-width": 0.55, "line-opacity": 0.55 },
      layout: { visibility },
    }, before);
    this.map.addLayer({
      id: "development-overview-count", type: "symbol", source: "development-overview",
      minzoom: 12, maxzoom: this.minZoom,
      layout: {
        visibility,
        "text-field": "",
        "text-font": ["Noto Sans Medium"],
        "text-size": 10,
        "text-allow-overlap": false,
      },
      paint: { "text-color": "#64300f", "text-halo-color": "#fff7e8", "text-halo-width": 1 },
    }, before);
    this.map.on("click", "development-overview-all", (event) => {
      const properties = event.features?.[0]?.properties;
      if (!properties) return;
      const indices = this.developmentMonthIndexes();
      const count = (prefix) => indices.reduce((sum, index) => sum + Number(properties[`${prefix}${String(index).padStart(2, "0")}`] ?? 0), 0);
      const total = count("a");
      const focus = count("f");
      const months = this.developmentFrom && this.developmentTo ? `${this.developmentFrom} to ${this.developmentTo}` : "selected report months";
      new maplibregl.Popup({ closeButton: false, closeOnClick: true })
        .setLngLat(event.lngLat)
        .setText(`${total.toLocaleString("en-CA")} permit records · ${focus.toLocaleString("en-CA")} industrial, commercial, logistics, or multi-unit residential · ${months}. Aggregated area; not an exact project location.`)
        .addTo(this.map);
    });
    this.map.on("mouseenter", "development-overview-all", () => { this.map.getCanvas().style.cursor = "pointer"; });
    this.map.on("mouseleave", "development-overview-all", () => { this.map.getCanvas().style.cursor = ""; });
    this.developmentOverviewAdded = true;
    this.updateDevelopmentOverviewStyle();
  }

  developmentMonthIndexes() {
    const start = this.developmentMonths.indexOf(this.developmentFrom);
    const end = this.developmentMonths.indexOf(this.developmentTo);
    return start < 0 || end < start
      ? []
      : this.developmentMonths.slice(start, end + 1).map((_, offset) => start + offset);
  }

  updateDevelopmentOverviewStyle() {
    if (!this.developmentOverviewAdded) return;
    const months = this.developmentMonthIndexes();
    const sum = (prefix) => months.length
      ? ["+", ...months.map((index) => ["get", `${prefix}${String(index).padStart(2, "0")}`])]
      : ["literal", 0];
    const all = sum("a");
    const focus = sum("f");
    this.map.setPaintProperty("development-overview-all", "fill-color", [
      "interpolate", ["linear"], all,
      0, "#f4ead4", 1, "#f1d18e", 5, "#e5af56", 15, "#cf7b36", 40, "#a84f1b",
    ]);
    this.map.setPaintProperty("development-overview-all", "fill-opacity", [
      "interpolate", ["linear"], all, 0, 0, 1, 0.24, 8, 0.46, 30, 0.68,
    ]);
    this.map.setPaintProperty("development-overview-focus", "fill-color", [
      "interpolate", ["linear"], focus,
      0, "#b85c24", 1, "#e6a054", 4, "#d47732", 12, "#b94c1d", 30, "#802f16",
    ]);
    this.map.setPaintProperty("development-overview-focus", "fill-opacity", [
      "interpolate", ["linear"], focus, 0, 0, 1, 0.42, 8, 0.65, 30, 0.82,
    ]);
    this.map.setFilter("development-overview-focus", [">", focus, 0]);
    this.map.setFilter("development-overview-count", [">", focus, 0]);
    this.map.setLayoutProperty("development-overview-count", "text-field", ["to-string", focus]);
  }

  applyDevelopmentFeatureState() {
    const source = "parcels";
    if (!this.map.getSource(source)) return;
    for (const key of this.developmentKeys)
      this.map.setFeatureState({ source, sourceLayer: this.tileLayer, id: key }, { developmentActivity: true });
  }

  toggleOverlay(id, show) {
    this.overlayVisibility.set(id, show);
    if (!this.ready) return;
    const layer = this.overlays.find((item) => item.id === id);
    if (!layer) return;
    const archive = layer.file.split("/").at(-1).replace(/\.pmtiles$/, "");
    const sourceId = `overlay-source-${archive}`;
    if (!this.overlayArchivesAdded.has(archive)) {
      const members = this.overlays.filter((candidate) => candidate.file === layer.file);
      // The archive's real zoom range: from the lowest layer minimum to the
      // highest layer maximum (layer set 001 archives keep their 6-14 source).
      const typed = members.some((item) => item.geometry);
      this.map.addSource(sourceId, {
        type: "vector",
        url: pmtilesUrl(`${this.overlaysBase}${layer.file}`),
        minzoom: typed ? Math.min(...members.map((item) => item.min_zoom)) : 6,
        maxzoom: typed ? Math.max(...members.map((item) => item.max_zoom)) : 14,
      });
      const before = this.beneathLabels && this.map.getLayer(this.beneathLabels) ? this.beneathLabels : undefined;
      for (const item of members) {
        for (const spec of overlayLayerSpecs(item, sourceId)) this.map.addLayer(spec, before);
        if (item.id === "building-footprints") {
          const fillId = "overlay-building-footprints-fill";
          this.map.on("click", fillId, (event) => {
            const properties = event.features?.[0]?.properties ?? {};
            const content = document.createElement("div");
            content.className = "building-footprint-popup";
            const title = document.createElement("strong");
            title.textContent = properties.BUILD_NO == null ? "Unassigned building footprint" : `Building ${properties.BUILD_NO}`;
            content.append(title);
            const area = properties.AREA_M2 == null ? NaN : Number(properties.AREA_M2);
            const edge = properties.EDGE_M == null ? NaN : Number(properties.EDGE_M);
            const values = [
              ["Footprint area", Number.isFinite(area) ? `${area.toLocaleString("en-CA")} m²` : "Not available"],
              ["Nearest parcel edge", Number.isFinite(edge) ? `${edge.toLocaleString("en-CA")} m` : "Not available"],
              ["Building ID", properties.BUILD_ID ?? "Not available"],
              ["Primary parcel", properties.PARCEL_ID ?? "Not assigned"],
            ];
            for (const [label, value] of values) {
              const row = document.createElement("p");
              const name = document.createElement("span");
              name.textContent = `${label}: `;
              const itemValue = document.createElement("b");
              itemValue.textContent = String(value);
              row.append(name, itemValue);
              content.append(row);
            }
            new maplibregl.Popup({ closeButton: true, maxWidth: "320px" })
              .setLngLat(event.lngLat)
              .setDOMContent(content)
              .addTo(this.map);
          });
          this.map.on("mouseenter", fillId, () => { this.map.getCanvas().style.cursor = "pointer"; });
          this.map.on("mouseleave", fillId, () => { this.map.getCanvas().style.cursor = ""; });
        }
      }
      this.overlayArchivesAdded.add(archive);
    }
    for (const suffix of ["fill", "line", "dash", "circle"])
      if (this.map.getLayer(`overlay-${id}-${suffix}`))
        this.map.setLayoutProperty(`overlay-${id}-${suffix}`, "visibility", show ? "visible" : "none");
  }

  /** Ease the parcel into the visible area above a bottom panel: the
   * parcel's centre lands in the viewport left after the panel (and the
   * open tray, on desktop) is padded out. A deep link has no geometry,
   * so the map does not move for it. */
  focusParcel(geometry, bottomPadding) {
    if (!this.ready || !geometry) return;
    const rings = geometry.type === "Polygon"
      ? [geometry.coordinates?.[0]]
      : geometry.type === "MultiPolygon"
        ? geometry.coordinates?.map((polygon) => polygon?.[0])
        : [];
    const usableRings = rings.filter((ring) => ring?.length);
    if (!usableRings.length) return;
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const ring of usableRings) for (const [x, y] of ring) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tray = document.getElementById("tray");
    const trayVisible = tray && getComputedStyle(tray).display !== "none";
    this.map.fitBounds([[minX, minY], [maxX, maxY]], {
      padding: {
        top: 16,
        left: trayVisible ? tray.getBoundingClientRect().width + 32 : 16,
        right: 16,
        bottom: bottomPadding,
      },
      maxZoom: this.maxZoom,
      duration: reduce ? 0 : 300,
    });
  }

  home() {
    this.map.easeTo({ center: [-79.88, 43.27], zoom: 10.9, padding: { top: 0, left: 0, right: 0, bottom: 0 }, duration: 300 });
  }

  resize() { this.map.resize(); }
}
