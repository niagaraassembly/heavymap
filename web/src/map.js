import * as maplibregl from "maplibre-gl";
import { Protocol } from "pmtiles";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
maplibregl.setWorkerUrl(workerUrl);
import { featureCollection, matchesLens } from "./fixtures.js";
const protocol = new Protocol();
maplibregl.addProtocol("pmtiles", protocol.tile);
const polygon = (coordinates) => ({
  type: "Feature",
  properties: {},
  geometry: { type: "Polygon", coordinates: [coordinates] },
});
const collection = (features) => ({ type: "FeatureCollection", features });
// Hand-drawn composition only. These are not Hamilton/nature boundaries.
const nature = collection([
  polygon([
    [-80.16, 43.12],
    [-80.12, 43.37],
    [-79.94, 43.39],
    [-79.88, 43.32],
    [-80.04, 43.28],
    [-80.03, 43.17],
    [-79.94, 43.09],
    [-80.16, 43.12],
  ]),
  polygon([
    [-80.03, 43.15],
    [-79.88, 43.2],
    [-79.72, 43.15],
    [-79.64, 43.07],
    [-79.87, 43.06],
    [-80.03, 43.15],
  ]),
  polygon([
    [-79.79, 43.25],
    [-79.65, 43.26],
    [-79.61, 43.2],
    [-79.71, 43.19],
    [-79.79, 43.25],
  ]),
]);
const water = collection([
  polygon([
    [-79.96, 43.42],
    [-79.45, 43.42],
    [-79.45, 43.23],
    [-79.7, 43.26],
    [-79.77, 43.3],
    [-79.85, 43.28],
    [-79.91, 43.32],
    [-79.96, 43.42],
  ]),
]);
const regulation = collection([
  polygon([
    [-80.07, 43.28],
    [-79.99, 43.3],
    [-79.92, 43.22],
    [-79.95, 43.16],
    [-80.03, 43.17],
    [-80.07, 43.28],
  ]),
]);
const roads = collection(
  Array.from({ length: 8 }, (_, i) => ({
    type: "Feature",
    properties: {},
    geometry: {
      type: "LineString",
      coordinates: [
        [-80.07 + i * 0.04, 43.13],
        [-79.97 + i * 0.04, 43.31],
      ],
    },
  })).concat(
    Array.from({ length: 7 }, (_, i) => ({
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: [
          [-80.11, 43.14 + i * 0.025],
          [-79.69, 43.14 + i * 0.025],
        ],
      },
    })),
  ),
);
const community = collection([
  polygon([
    [-79.93, 43.242],
    [-79.89, 43.242],
    [-79.89, 43.267],
    [-79.93, 43.267],
    [-79.93, 43.242],
  ]),
]);
export class FieldMap {
  constructor(parcels, onSelect, onHover, onStatus) {
    this.parcels = parcels;
    this.onStatus = onStatus;
    this.ready = false;
    this.saved = null;
    this.userMoved = false;
    this.lens = "all";
    this.visible = { nature: true, regulation: true, community: false };
    this.palette = "field";
    this.map = new maplibregl.Map({
      container: "map",
      center: [-79.91, 43.235],
      zoom: 10.35,
      minZoom: 8,
      maxZoom: 16,
      attributionControl: false,
      style: {
        version: 8,
        sources: {},
        layers: [
          {
            id: "ground",
            type: "background",
            paint: { "background-color": "#eaf0ef" },
          },
        ],
      },
    });
    this.map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "bottom-right",
    );
    this.map.on("movestart", (e) => {
      if (e.originalEvent && this.saved) this.userMoved = true;
    });
    // Keyboard and navigation buttons can trigger camera changes without originalEvent.
    const canvas = this.map.getCanvas();
    canvas.addEventListener("keydown", (e) => {
      if (
        [
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
          "+",
          "-",
          "=",
        ].includes(e.key) &&
        this.saved
      )
        this.userMoved = true;
    });
    document
      .querySelector(".maplibregl-ctrl-group")
      .addEventListener("click", () => {
        if (this.saved) this.userMoved = true;
      });
    this.map.on("error", (e) => {
      if (e.sourceId === "parcels" || e.error?.message?.includes("PMTiles"))
        onStatus(
          "Local parcel tiles failed. Sample dossiers remain available. Reload to retry.",
        );
    });
    this.map.on("load", () => {
      const m = this.map;
      for (const [id, data] of Object.entries({
        nature,
        water,
        regulation,
        roads,
        community,
        selected: collection([]),
      }))
        m.addSource(id, { type: "geojson", data });
      m.addLayer({
        id: "nature",
        type: "fill",
        source: "nature",
        paint: { "fill-color": "#bad1b6", "fill-opacity": 0.7 },
      });
      m.addLayer({
        id: "water",
        type: "fill",
        source: "water",
        paint: { "fill-color": "#b5d7df" },
      });
      m.addLayer({
        id: "regulation",
        type: "fill",
        source: "regulation",
        paint: { "fill-color": "#779c8d", "fill-opacity": 0.17 },
      });
      m.addLayer({
        id: "regulation-line",
        type: "line",
        source: "regulation",
        paint: {
          "line-color": "#618574",
          "line-width": 1.5,
          "line-dasharray": [3, 3],
        },
      });
      m.addLayer({
        id: "roads",
        type: "line",
        source: "roads",
        paint: {
          "line-color": "#fff",
          "line-width": 1.5,
          "line-opacity": 0.65,
        },
      });
      m.addSource("parcels", {
        type: "vector",
        url: `pmtiles://${new URL("synthetic-parcels.pmtiles", document.baseURI).href}`,
      });
      m.addLayer({
        id: "parcels",
        type: "fill",
        source: "parcels",
        "source-layer": "parcels",
        paint: { "fill-color": "#c17254", "fill-opacity": 0.42 },
      });
      m.addLayer({
        id: "parcel-lines",
        type: "line",
        source: "parcels",
        "source-layer": "parcels",
        paint: { "line-color": "#9c4d35", "line-width": 2 },
      });
      m.addLayer({
        id: "community",
        type: "line",
        source: "community",
        layout: { visibility: "none" },
        paint: {
          "line-color": "#796094",
          "line-width": 3,
          "line-dasharray": [2, 2],
        },
      });
      m.addLayer({
        id: "selected",
        type: "line",
        source: "selected",
        paint: { "line-color": "#153b4b", "line-width": 4 },
      });
      this.markers = parcels.map((p) => {
        const b = document.createElement("button");
        b.className = "parcel-marker";
        b.textContent = p.short;
        b.setAttribute("aria-label", `Open sample ${p.short}: ${p.name}`);
        b.addEventListener("click", () => onSelect(p, b));
        b.addEventListener("mouseenter", () => onHover(p, b));
        b.addEventListener("focus", () => onHover(p, b));
        b.addEventListener("mouseleave", () => onHover(null));
        b.addEventListener("blur", () => onHover(null));
        return {
          parcel: p,
          marker: new maplibregl.Marker({ element: b })
            .setLngLat(p.center)
            .addTo(m),
          button: b,
        };
      });
      m.on("click", "parcels", (e) => {
        const p = parcels.find((p) => p.id === e.features[0].properties.id);
        if (p) onSelect(p, canvas);
      });
      m.on("mouseenter", "parcels", () => {
        canvas.style.cursor = "pointer";
      });
      m.on("mouseleave", "parcels", () => {
        canvas.style.cursor = "";
      });
      for (const [text, position, kind] of [
        ["Hamilton", [-79.86, 43.265], "city-label"],
        ["Lake Ontario", [-79.72, 43.345], "water-label"],
        ["Nature frame · schematic", [-80.055, 43.31], "nature-label"],
        ["Escarpment study", [-79.8, 43.14], "nature-label"],
      ]) {
        const label = document.createElement("span");
        label.className = `place-label ${kind}`;
        label.textContent = text;
        new maplibregl.Marker({ element: label }).setLngLat(position).addTo(m);
      }
      this.ready = true;
      this.setLens(this.lens);
      for (const [id, show] of Object.entries(this.visible))
        this.toggle(id, show);
      this.setPalette(this.palette);
      if (this.pending) {
        const p = this.pending;
        this.pending = null;
        this.select(p);
      }
      onStatus("Local synthetic PMTiles · no live data");
    });
  }
  padding() {
    const tray = document.getElementById("tray");
    const panel = document.getElementById("dossier");
    const desktop = innerWidth > 900;
    return {
      top: 30,
      left: desktop ? Math.ceil(tray.getBoundingClientRect().right) + 20 : 20,
      right:
        desktop && !panel.hidden
          ? Math.ceil(panel.getBoundingClientRect().width) + 36
          : 30,
      bottom: desktop
        ? 65
        : !panel.hidden
          ? Math.ceil(panel.getBoundingClientRect().height) + 25
          : 85,
    };
  }
  select(parcel) {
    this.selected = parcel;
    if (!this.ready) {
      this.pending = parcel;
      return;
    }
    const m = this.map;
    m.stop();
    if (!this.saved) {
      this.saved = {
        center: m.getCenter().toArray(),
        zoom: m.getZoom(),
        bearing: m.getBearing(),
        pitch: m.getPitch(),
      };
      this.userMoved = false;
    }
    m.getSource("selected").setData(featureCollection([parcel]));
    const r = parcel.geometry.coordinates[0];
    const bounds = new maplibregl.LngLatBounds();
    r.forEach((p) => bounds.extend(p));
    m.fitBounds(bounds, {
      padding: this.padding(),
      maxZoom: 12.8,
      duration: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? 0
        : 650,
    });
    this.refreshMarkers();
  }
  close() {
    this.pending = null;
    this.selected = null;
    if (!this.ready) return;
    this.map.stop();
    this.map.getSource("selected").setData(collection([]));
    if (this.saved && !this.userMoved)
      this.map.easeTo({
        ...this.saved,
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
        duration: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? 0
          : 500,
      });
    else {
      const center = this.map.getCenter();
      this.map.setPadding({ top: 0, right: 0, bottom: 0, left: 0 });
      this.map.setCenter(center);
    }
    this.saved = null;
    this.refreshMarkers();
  }
  refreshMarkers() {
    this.markers?.forEach(({ parcel, button }) => {
      button.hidden =
        !matchesLens(parcel, this.lens) && parcel.id !== this.selected?.id;
      button.classList.toggle("active", parcel.id === this.selected?.id);
    });
  }
  setLens(lens) {
    this.lens = lens;
    if (!this.ready) return;
    const filter =
      lens === "all"
        ? null
        : [
            "any",
            ["==", ["get", "lens"], lens],
            ["==", ["get", "id"], this.selected?.id || ""],
          ];
    for (const id of ["parcels", "parcel-lines"])
      this.map.setFilter(id, filter);
    this.refreshMarkers();
  }
  toggle(id, show) {
    this.visible[id] = show;
    if (!this.ready) return;
    for (const layer of id === "regulation"
      ? ["regulation", "regulation-line"]
      : [id])
      this.map.setLayoutProperty(
        layer,
        "visibility",
        show ? "visible" : "none",
      );
  }
  setPalette(palette) {
    this.palette = palette;
    if (!this.ready) return;
    const wash = palette === "wash";
    this.map.setPaintProperty(
      "ground",
      "background-color",
      wash ? "#eef0e5" : "#eaf0ef",
    );
    this.map.setPaintProperty(
      "nature",
      "fill-color",
      wash ? "#a3bd9f" : "#bad1b6",
    );
    this.map.setPaintProperty("nature", "fill-opacity", wash ? 0.48 : 0.7);
    this.map.setPaintProperty(
      "water",
      "fill-color",
      wash ? "#b4cdd7" : "#b5d7df",
    );
  }
  home() {
    if (this.saved) this.userMoved = true;
    this.map.easeTo({
      center: [-79.91, 43.235],
      zoom: 10.35,
      padding: { top: 0, left: 0, right: 0, bottom: 0 },
      duration: 300,
    });
  }
  resize() {
    this.map.resize();
    if (this.selected && !this.userMoved) this.select(this.selected);
  }
}
