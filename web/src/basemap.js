/* Vector basemap for the map page: a self-hosted Protomaps extract
 * (OpenStreetMap data) styled with the Protomaps basemap layers.
 *
 * Kept apart from map.js so the parcel work and the basemap work do not
 * collide. Nothing here is clickable: the basemap is context only. */

import { layers, namedFlavor } from "@protomaps/basemaps";

export const BASEMAP_SOURCE = "basemap";
export const BASEMAP_FLAVORS = ["white", "dark", "grayscale"];
export const GLYPHS_URL = "/map/fonts/{fontstack}/{range}.pbf";

/* Ground colour shown before tiles arrive and outside the extract. */
export const GROUND = { white: "#f7f7f4", dark: "#1b1f22", grayscale: "#eeeeec" };

/* Parcel paint over each ground. On the still image parcels carry a
 * visible fill; over a real basemap they are mostly outline so streets
 * and blocks stay readable, and only the selected parcel is filled. */
export const PARCEL_PAINT = {
  still: { fill: "#c17254", fillOpacity: 0.24, line: "#9c4d35", lineWidth: 1.15, selFill: "#a25138", selFillOpacity: 0.72, selLine: "#713c2c" },
  light: { fill: "#c17254", fillOpacity: 0.07, line: "#a25138", lineWidth: 0.8, selFill: "#a25138", selFillOpacity: 0.55, selLine: "#713c2c" },
  white: { fill: "#c17254", fillOpacity: 0.08, line: "#93452f", lineWidth: 1, selFill: "#a25138", selFillOpacity: 0.58, selLine: "#713c2c" },
  dark: { fill: "#f0b54a", fillOpacity: 0.05, line: "#d9a23f", lineWidth: 0.7, selFill: "#f0b54a", selFillOpacity: 0.5, selLine: "#ffd98a" },
  grayscale: { fill: "#777777", fillOpacity: 0.08, line: "#555555", lineWidth: 0.9, selFill: "#555555", selFillOpacity: 0.54, selLine: "#303030" },
};

/* These layers draw only sprite icons (one-way arrows, highway shields,
 * points of interest). No sprite sheet is shipped, so they are left out. */
const ICON_ONLY = new Set(["roads_oneway", "roads_shields", "pois"]);

export function basemapFlavor(value) {
  // Keep existing shared links working while making the clearer white style
  // the default for new visits.
  if (value === "light") return "white";
  return BASEMAP_FLAVORS.includes(value) ? value : "white";
}

/** MapLibre layers for one flavor, ids prefixed `basemap-`.
 * Each flavor supplies its own background, so the low contrast still image
 * remains only as a fallback if the vector archive fails to load. */
export function basemapLayers(flavor) {
  const name = basemapFlavor(flavor);
  return layers(BASEMAP_SOURCE, namedFlavor(name), { lang: "en" })
    .filter((layer) => !ICON_ONLY.has(layer.id))
    .map((layer) => {
      const next = { ...layer, id: `basemap-${layer.id}` };
      if (layer.layout && "icon-image" in layer.layout) {
        const { "icon-image": _icon, ...layout } = layer.layout;
        next.layout = layout;
      }
      return next;
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
