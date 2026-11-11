/* HeavyMap's static basemap style for the Protomaps v4 tile schema.
 * Colours follow src/site/tokens.css (light). The map image doesn't change
 * with theme or mode (decision 40). */
const C = {
  land: "#f5f4ee",
  water: "#b7cfd2",
  waterLine: "#9fbcc0",
  park: "#d9e3d1",
  wood: "#cfdcc6",
  industrial: "#e6e2d8",
  building: "#e2e1d8",
  road: "#ffffff",
  roadCase: "#d3d8cf",
  minor: "#fbfaf6",
  rail: "#9aa79a",
  label: "#253f49",
  labelSoft: "#4f6963",
  water_label: "#4c7177",
};

export function hamiltonStyle(url) {
  const kind = (...k) => ["in", ["get", "kind"], ["literal", k]];
  return {
    version: 8,
    glyphs:
      "https://protomaps.github.io/basemaps-assets/fonts/{fontstack}/{range}.pbf",
    sources: {
      pm: { type: "vector", url, attribution: "© OpenStreetMap contributors" },
    },
    layers: [
      {
        id: "background",
        type: "background",
        paint: { "background-color": C.land },
      },
      {
        id: "earth",
        type: "fill",
        source: "pm",
        "source-layer": "earth",
        paint: { "fill-color": C.land },
      },
      {
        id: "industrial",
        type: "fill",
        source: "pm",
        "source-layer": "landuse",
        filter: kind("industrial", "railway", "brownfield"),
        paint: { "fill-color": C.industrial },
      },
      {
        id: "parks",
        type: "fill",
        source: "pm",
        "source-layer": "landuse",
        filter: kind(
          "park",
          "nature_reserve",
          "garden",
          "golf_course",
          "cemetery",
          "grass",
          "recreation_ground",
          "playground",
        ),
        paint: { "fill-color": C.park },
      },
      {
        id: "wood",
        type: "fill",
        source: "pm",
        "source-layer": "landuse",
        filter: kind("wood", "forest", "scrub", "wetland"),
        paint: { "fill-color": C.wood },
      },
      {
        id: "landcover",
        type: "fill",
        source: "pm",
        "source-layer": "landcover",
        filter: kind("forest", "grassland", "scrub"),
        paint: { "fill-color": C.wood, "fill-opacity": 0.6 },
      },
      {
        id: "water",
        type: "fill",
        source: "pm",
        "source-layer": "water",
        paint: { "fill-color": C.water },
      },
      {
        id: "water-edge",
        type: "line",
        source: "pm",
        "source-layer": "water",
        paint: { "line-color": C.waterLine, "line-width": 0.6 },
      },
      {
        id: "buildings",
        type: "fill",
        source: "pm",
        "source-layer": "buildings",
        paint: { "fill-color": C.building },
      },
      {
        id: "rail",
        type: "line",
        source: "pm",
        "source-layer": "roads",
        filter: kind("rail"),
        paint: {
          "line-color": C.rail,
          "line-width": 1,
          "line-dasharray": [3, 2],
        },
      },
      {
        id: "rail-transit",
        type: "line",
        source: "pm",
        "source-layer": "transit",
        filter: kind("rail"),
        paint: {
          "line-color": C.rail,
          "line-width": 1,
          "line-dasharray": [3, 2],
        },
      },
      {
        id: "minor-roads",
        type: "line",
        source: "pm",
        "source-layer": "roads",
        filter: kind("minor_road", "other"),
        paint: {
          "line-color": C.minor,
          "line-width": ["interpolate", ["linear"], ["zoom"], 12, 0.4, 16, 3],
        },
      },
      {
        id: "major-case",
        type: "line",
        source: "pm",
        "source-layer": "roads",
        filter: kind("major_road", "highway"),
        paint: {
          "line-color": C.roadCase,
          "line-width": ["interpolate", ["linear"], ["zoom"], 12, 1.6, 16, 7],
        },
      },
      {
        id: "major-roads",
        type: "line",
        source: "pm",
        "source-layer": "roads",
        filter: kind("major_road", "highway"),
        paint: {
          "line-color": C.road,
          "line-width": ["interpolate", ["linear"], ["zoom"], 12, 0.9, 16, 5],
        },
      },
      {
        id: "water-labels",
        type: "symbol",
        source: "pm",
        "source-layer": "water",
        filter: ["has", "name"],
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["Noto Sans Italic"],
          "text-size": 15,
          "text-letter-spacing": 0.08,
        },
        paint: { "text-color": C.water_label },
      },
      {
        id: "place-labels",
        type: "symbol",
        source: "pm",
        "source-layer": "places",
        filter: kind("neighbourhood", "macrohood", "locality"),
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["Noto Sans Medium"],
          "text-size": ["match", ["get", "kind"], "locality", 16, 12],
          "text-transform": "uppercase",
          "text-letter-spacing": 0.1,
          "text-max-width": 8,
        },
        paint: {
          "text-color": C.labelSoft,
          "text-halo-color": C.land,
          "text-halo-width": 1.5,
        },
      },
    ],
  };
}
