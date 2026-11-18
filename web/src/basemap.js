/* Vector basemap for the map page: a self-hosted Protomaps extract
 * (OpenStreetMap data) styled with HeavyMap's map-view palettes.
 *
 * The basemap is context only. HeavyMap overlays keep their own colors and
 * remain fully opaque when the visitor changes basemap strength. */

import { layers, namedFlavor } from "@protomaps/basemaps";

export const BASEMAP_SOURCE = "basemap";
export const BASEMAP_FLAVORS = [
  "light", "white", "dark", "grayscale", "bright", "mono", "atlas", "survey", "toner", "terrain", "field-notes",
];
export const GLYPHS_URL = "/map/fonts/{fontstack}/{range}.pbf";

const COMMON_ROADS = {
  minor_service_casing: "#cbc7be",
  minor_casing: "#cbc7be",
  link_casing: "#c5bdad",
  major_casing_early: "#c5bdad",
  major_casing_late: "#c5bdad",
  highway_casing_early: "#bca989",
  highway_casing_late: "#bca989",
  minor_service: "#f7f6f2",
  minor_a: "#f7f6f2",
  minor_b: "#fffefa",
  link: "#fffefa",
  major: "#f4e4c6",
  highway: "#edc77f",
  roads_label_minor: "#59656a",
  roads_label_major: "#3f5057",
  roads_label_minor_halo: "#f7f5ef",
  roads_label_major_halo: "#f7f5ef",
};

const PALETTES = {
  bright: {
    base: "white",
    colors: {
      background: "#f4f5f2", earth: "#edece5", water: "#a8ccd5",
      park_a: "#c0d2bb", park_b: "#a7c59f", wood_a: "#b7cdb1", wood_b: "#9fbd96",
      industrial: "#d5dfe1", buildings: "#d7d6d1", boundaries: "#9da79f",
      railway: "#9b8b78", ...COMMON_ROADS,
    },
    ground: "#f4f5f2",
    parcel: "bright",
    keepStill: false,
  },
  dark: {
    base: "dark",
    colors: {
      background: "#1b252b", earth: "#263138", water: "#214c58",
      park_a: "#304439", park_b: "#3b5945", wood_a: "#2b4034", wood_b: "#395543",
      industrial: "#343b3c", buildings: "#394247", boundaries: "#718087",
      railway: "#ac8b5e", minor_service_casing: "#3b484d", minor_casing: "#3f4b50",
      link_casing: "#586367", major_casing_early: "#596367", major_casing_late: "#596367",
      highway_casing_early: "#7b6d55", highway_casing_late: "#7b6d55",
      minor_service: "#3b474c", minor_a: "#414d52", minor_b: "#4d5a5e", link: "#59656a",
      major: "#d5b979", highway: "#f0c56f", roads_label_minor: "#b6c0c2",
      roads_label_major: "#e3e6e4", roads_label_minor_halo: "#263138", roads_label_major_halo: "#263138",
      city_label: "#e0e5e5", city_label_halo: "#263138", subplace_label: "#bdc7c8",
      subplace_label_halo: "#263138", address_label: "#c5cecf", address_label_halo: "#263138",
    },
    ground: "#1b252b",
    parcel: "dark",
    keepStill: false,
  },
  mono: {
    base: "grayscale",
    colors: {
      background: "#e7e7e4", earth: "#e2e2df", water: "#c2c9cb",
      park_a: "#d4d7d2", park_b: "#c7cbc6", wood_a: "#d0d4cf", wood_b: "#c3c9c3",
      industrial: "#d1d1ce", buildings: "#d8d8d5", boundaries: "#858986",
      minor_service_casing: "#b5b5b1", minor_casing: "#b5b5b1", link_casing: "#a5a5a0",
      major_casing_early: "#a2a29d", major_casing_late: "#a2a29d", highway_casing_early: "#8c8c87",
      highway_casing_late: "#8c8c87", minor_service: "#f1f1ee", minor_a: "#f5f5f2",
      minor_b: "#ffffff", link: "#ffffff", major: "#fafaf8", highway: "#ffffff",
      railway: "#747875", roads_label_minor: "#676b69", roads_label_major: "#343938",
      roads_label_minor_halo: "#e7e7e4", roads_label_major_halo: "#e7e7e4",
      city_label: "#303534", city_label_halo: "#e7e7e4", subplace_label: "#555a58",
      subplace_label_halo: "#e7e7e4", address_label: "#676b69", address_label_halo: "#e7e7e4",
    },
    ground: "#e7e7e4",
    parcel: "mono",
    keepStill: false,
  },
  atlas: {
    base: "light",
    colors: {
      background: "#e9e6da", earth: "#e3ddcc", water: "#71b5c2",
      park_a: "#afc998", park_b: "#91b77d", wood_a: "#9dbb88", wood_b: "#80a96e",
      industrial: "#c7d4d5", buildings: "#d0cfc5", boundaries: "#8d998c",
      railway: "#806f5c", ...COMMON_ROADS, major: "#e8d4a7", highway: "#e8b75e",
      roads_label_minor: "#59675f", roads_label_major: "#344e4d",
      roads_label_minor_halo: "#e9e6da", roads_label_major_halo: "#e9e6da",
      city_label: "#304a4b", city_label_halo: "#e9e6da", subplace_label: "#5a675f",
      subplace_label_halo: "#e9e6da", address_label: "#56615c", address_label_halo: "#e9e6da",
    },
    ground: "#e9e6da",
    parcel: "atlas",
    keepStill: false,
  },
  survey: {
    base: "light",
    colors: {
      background: "#f4f1e8", earth: "#f2eee4", water: "#b4d4dc",
      park_a: "#bdd0bd", park_b: "#a5c3a7", wood_a: "#a9c2aa", wood_b: "#91b39a",
      industrial: "#d4dfe1", buildings: "#d8d4ca", boundaries: "#858a83",
      railway: "#74685a", ...COMMON_ROADS, major: "#f3d28f", highway: "#e7ab50",
      major_casing_early: "#b9aa8b", major_casing_late: "#b9aa8b", highway_casing_early: "#b39a70",
      highway_casing_late: "#b39a70", roads_label_minor: "#586169", roads_label_major: "#313f4a",
      roads_label_minor_halo: "#f4f1e8", roads_label_major_halo: "#f4f1e8",
      city_label: "#303f49", city_label_halo: "#f4f1e8", subplace_label: "#5d666a",
      subplace_label_halo: "#f4f1e8", address_label: "#596166", address_label_halo: "#f4f1e8",
    },
    ground: "#f4f1e8",
    parcel: "survey",
    keepStill: false,
  },
  toner: {
    base: "grayscale",
    colors: {
      background: "#f2f2ef", earth: "#eeeeeb", water: "#c9cdce",
      park_a: "#e2e2df", park_b: "#d7d7d4", wood_a: "#ddddda", wood_b: "#d1d1ce",
      industrial: "#dededb", buildings: "#d4d4d1", boundaries: "#616462",
      railway: "#424644", minor_service_casing: "#bdbdb9", minor_casing: "#b5b5b1",
      link_casing: "#9f9f9b", major_casing_early: "#91918d", major_casing_late: "#91918d",
      highway_casing_early: "#737572", highway_casing_late: "#737572", minor_service: "#e5e5e2",
      minor_a: "#fafaf8", minor_b: "#ffffff", link: "#ffffff", major: "#ffffff", highway: "#ffffff",
      roads_label_minor: "#595c5a", roads_label_major: "#222524",
      roads_label_minor_halo: "#f2f2ef", roads_label_major_halo: "#f2f2ef",
      city_label: "#202322", city_label_halo: "#f2f2ef", subplace_label: "#4d504e",
      subplace_label_halo: "#f2f2ef", address_label: "#4d504e", address_label_halo: "#f2f2ef",
    },
    ground: "#f2f2ef",
    parcel: "toner",
    keepStill: false,
  },
  terrain: {
    base: "light",
    colors: {
      background: "#e5e5d7", earth: "#e5dcc1", water: "#6da8b1",
      park_a: "#a8bd88", park_b: "#8cae6e", wood_a: "#91ad76", wood_b: "#789b63",
      scrub_a: "#b7c49a", scrub_b: "#a3b883",
      industrial: "#c5c9b7", buildings: "#c9c5b4", boundaries: "#818d73",
      railway: "#796955", ...COMMON_ROADS, major: "#e4c581", highway: "#d9a84e",
      roads_label_minor: "#566153", roads_label_major: "#34483b",
      roads_label_minor_halo: "#e5e5d7", roads_label_major_halo: "#e5e5d7",
      city_label: "#33463b", city_label_halo: "#e5e5d7", subplace_label: "#5e6854",
      subplace_label_halo: "#e5e5d7", address_label: "#59634f", address_label_halo: "#e5e5d7",
      landcover: {
        grassland: "rgba(183, 198, 139, 1)", barren: "rgba(224, 211, 170, 1)",
        urban_area: "rgba(215, 208, 188, 1)", farmland: "rgba(216, 207, 146, 1)",
        glacier: "rgba(240, 239, 220, 1)", scrub: "rgba(190, 197, 142, 1)", forest: "rgba(145, 173, 118, 1)",
      },
    },
    ground: "#e5e5d7",
    parcel: "terrain",
    keepStill: false,
  },
  "field-notes": {
    base: "light",
    colors: {
      background: "#eee6d7", earth: "#f0e9db", water: "#9fbec4",
      park_a: "#b7c5a7", park_b: "#a2b995", wood_a: "#a8bb99", wood_b: "#90a980",
      industrial: "#d1c7b4", buildings: "#d7cfbf", boundaries: "#796f61",
      railway: "#745a49", minor_service_casing: "#c7baa6", minor_casing: "#c4b7a3",
      link_casing: "#b3a58f", major_casing_early: "#b3a58f", major_casing_late: "#b3a58f",
      highway_casing_early: "#9b8060", highway_casing_late: "#9b8060",
      minor_service: "#f4eee3", minor_a: "#f6f0e5", minor_b: "#fbf7ed", link: "#fbf7ed",
      major: "#e7d4b2", highway: "#d9b67e", roads_label_minor: "#675c50",
      roads_label_major: "#40372f", roads_label_minor_halo: "#eee6d7", roads_label_major_halo: "#eee6d7",
      city_label: "#42392f", city_label_halo: "#eee6d7", subplace_label: "#6d6151",
      subplace_label_halo: "#eee6d7", address_label: "#655a4d", address_label_halo: "#eee6d7",
    },
    ground: "#eee6d7",
    parcel: "field-notes",
    keepStill: false,
  },
  /* Retain the old transparent-light flavor for bookmarked legacy URLs. */
  light: { base: "light", colors: {}, ground: "#eaf0ef", parcel: "light", keepStill: true },
};

const FLAVOR_ALIASES = { white: "bright", grayscale: "mono" };

/* Ground colour shown before tiles arrive and outside the extract. */
export const GROUND = Object.fromEntries(
  Object.entries(PALETTES).map(([name, palette]) => [name, palette.ground]),
);

/* Parcel paint over each ground. The basemap stays subordinate to HeavyMap's
 * analytical overlays, which do not respond to the intensity control. */
export const PARCEL_PAINT = {
  still: { fill: "#c17254", fillOpacity: 0.24, line: "#9c4d35", lineWidth: 1.15, selFill: "#a25138", selFillOpacity: 0.72, selLine: "#713c2c" },
  light: { fill: "#c17254", fillOpacity: 0.07, line: "#a25138", lineWidth: 0.8, selFill: "#a25138", selFillOpacity: 0.55, selLine: "#713c2c" },
  bright: { fill: "#c17254", fillOpacity: 0.08, line: "#93452f", lineWidth: 1, selFill: "#a25138", selFillOpacity: 0.58, selLine: "#713c2c" },
  dark: { fill: "#f0b54a", fillOpacity: 0.05, line: "#d9a23f", lineWidth: 0.7, selFill: "#f0b54a", selFillOpacity: 0.5, selLine: "#ffd98a" },
  mono: { fill: "#555555", fillOpacity: 0.08, line: "#4b504e", lineWidth: 0.9, selFill: "#555555", selFillOpacity: 0.54, selLine: "#303030" },
  atlas: { fill: "#b2643d", fillOpacity: 0.08, line: "#904b32", lineWidth: 0.95, selFill: "#a25138", selFillOpacity: 0.58, selLine: "#713c2c" },
  survey: { fill: "#ae5b36", fillOpacity: 0.08, line: "#8c432c", lineWidth: 0.95, selFill: "#a25138", selFillOpacity: 0.58, selLine: "#713c2c" },
  toner: { fill: "#565a58", fillOpacity: 0.08, line: "#484c4a", lineWidth: 0.9, selFill: "#3c403e", selFillOpacity: 0.55, selLine: "#202322" },
  terrain: { fill: "#9b5c37", fillOpacity: 0.08, line: "#7d492e", lineWidth: 0.95, selFill: "#8b4d2c", selFillOpacity: 0.58, selLine: "#633b26" },
  "field-notes": { fill: "#a85d39", fillOpacity: 0.08, line: "#7d4933", lineWidth: 0.95, selFill: "#91462e", selFillOpacity: 0.58, selLine: "#633729" },
};

/* These layers draw only sprite icons (one-way arrows, highway shields,
 * points of interest). No sprite sheet is shipped, so they are left out. */
const ICON_ONLY = new Set(["roads_oneway", "roads_shields", "pois"]);

export function basemapFlavor(value) {
  if (!BASEMAP_FLAVORS.includes(value)) return "light";
  return FLAVOR_ALIASES[value] ?? value;
}

export function clampBasemapIntensity(value) {
  const intensity = Number(value);
  if (!Number.isFinite(intensity)) return 1;
  return Math.max(0.45, Math.min(1, intensity));
}

export function basemapKeepsStill(flavor) {
  return PALETTES[basemapFlavor(flavor)].keepStill;
}

function flavorFor(name) {
  const palette = PALETTES[name];
  return { ...namedFlavor(palette.base), ...palette.colors };
}

function opacityProperty(type) {
  return {
    fill: "fill-opacity",
    line: "line-opacity",
    symbol: "text-opacity",
    circle: "circle-opacity",
    raster: "raster-opacity",
    "fill-extrusion": "fill-extrusion-opacity",
    heatmap: "heatmap-opacity",
  }[type];
}

function withIntensity(layer, intensity) {
  if (layer.type === "background") return layer;
  const property = opacityProperty(layer.type);
  if (!property) return layer;
  const value = layer.paint?.[property] ?? 1;
  const paint = { ...layer.paint, [property]: intensity === 1 ? value : ["*", value, intensity] };
  if (layer.type === "symbol" && layer.paint?.["icon-opacity"] !== undefined)
    paint["icon-opacity"] = intensity === 1 ? layer.paint["icon-opacity"] : ["*", layer.paint["icon-opacity"], intensity];
  return { ...layer, paint };
}

/** MapLibre layers for one style, ids prefixed `basemap-`. */
export function basemapLayers(flavor, intensity = 1) {
  const name = basemapFlavor(flavor);
  const palette = PALETTES[name];
  return layers(BASEMAP_SOURCE, flavorFor(name), { lang: "en" })
    .filter((layer) => !ICON_ONLY.has(layer.id))
    .filter((layer) => !(palette.keepStill && layer.type === "background"))
    .map((layer) => {
      const next = { ...layer, id: `basemap-${layer.id}` };
      if (layer.layout && "icon-image" in layer.layout) {
        const { "icon-image": _icon, ...layout } = layer.layout;
        next.layout = layout;
      }
      return withIntensity(next, clampBasemapIntensity(intensity));
    });
}

/** Id of the first label layer, so parcels can be drawn beneath labels. */
export function firstLabelLayerId(list) {
  return list.find((layer) => layer.type === "symbol")?.id;
}

/** Read the basemap descriptor published beside the archive.
 * Returns null when there is none, so the map keeps the still image. */
export async function findBasemap(base, fetchImpl = fetch) {
  try {
    const response = await fetchImpl(`${base}basemap.json`);
    if (!response.ok) return null;
    const doc = await response.json();
    const parts = typeof doc?.file === "string" ? doc.file.split("/") : [];
    const safeArchivePath =
      parts.length > 0 &&
      parts.every((part) => part !== "" && part !== "." && part !== ".." && /^[a-z0-9._-]+$/.test(part)) &&
      parts.at(-1).endsWith(".pmtiles");
    if (!safeArchivePath) return null;
    return {
      url: `${base}${doc.file}`,
      maxZoom: Number.isInteger(doc.max_zoom) ? doc.max_zoom : 15,
      attribution: typeof doc.attribution === "string" ? doc.attribution : "© OpenStreetMap",
    };
  } catch {
    return null;
  }
}
