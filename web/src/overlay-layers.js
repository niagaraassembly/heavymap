/** MapLibre layers for one map-release overlay. Polygon layers (and any
 * layer without a stated geometry, as in layer set 001) keep their original
 * fill and outline with maxzoom = the tile maximum. Line and point layers
 * (layer set 002) draw as lines and circles and keep drawing past their tile
 * maximum by overzoom. Styling is HeavyMap's; the release carries the source
 * values (D-078). */
export function overlayLayerSpecs(item, sourceId) {
  const color = item.color || "#557a78";
  const geometry = item.geometry ?? "polygon";
  const base = {
    source: sourceId, "source-layer": item.tile_layer,
    minzoom: item.min_zoom, maxzoom: geometry === "polygon" && !item.geometry ? item.max_zoom : 22,
    layout: { visibility: "none" },
  };
  if (geometry === "point") {
    // Height- or weight-restricted structures (-1 in the source) stand out.
    const restricted = ["any", ["==", ["get", "HEIGHT_RESTRICTION"], -1], ["==", ["get", "WEIGHT_RESTRICTED"], -1]];
    const isStructures = item.id === "structures";
    return [{
      ...base, id: `overlay-${item.id}-circle`, type: "circle",
      paint: {
        "circle-color": isStructures ? ["case", restricted, "#c4471f", "#8c97a0"] : color,
        "circle-radius": isStructures
          ? ["case", restricted, ["interpolate", ["linear"], ["zoom"], 11, 3.5, 16, 7], ["interpolate", ["linear"], ["zoom"], 11, 1.5, 16, 3.5]]
          : ["interpolate", ["linear"], ["zoom"], 10, 2, 16, 5],
        "circle-stroke-color": "#ffffff", "circle-stroke-width": 1, "circle-opacity": 0.92,
      },
    }];
  }
  if (geometry === "line") {
    const paint = {
      "line-color": color,
      "line-width": ["interpolate", ["linear"], ["zoom"], 9, 1, 14, 2.4, 16, 3.6],
      "line-opacity": 0.88,
    };
    const layout = { ...base.layout, "line-cap": "butt", "line-join": "round" };
    if (item.id === "railways") paint["line-dasharray"] = [3, 1.2];
    if (item.id === "truck-routes") {
      // Part-time routes dashed (the code is the source's own value). Two
      // filtered layers: a per-feature dash pattern is not reliably supported.
      const partTime = ["==", ["get", "TIME_OF_DAY"], "Part Time"];
      return [
        { ...base, id: `overlay-${item.id}-line`, type: "line", layout, paint, filter: ["!", partTime] },
        { ...base, id: `overlay-${item.id}-dash`, type: "line", layout, paint: { ...paint, "line-dasharray": [2, 1.5] }, filter: partTime },
      ];
    }
    return [{ ...base, id: `overlay-${item.id}-line`, type: "line", layout, paint }];
  }
  return [
    { ...base, id: `overlay-${item.id}-fill`, type: "fill", paint: { "fill-color": color, "fill-opacity": 0.20 } },
    { ...base, id: `overlay-${item.id}-line`, type: "line", paint: { "line-color": color, "line-width": 1.2, "line-opacity": 0.86 } },
  ];
}
