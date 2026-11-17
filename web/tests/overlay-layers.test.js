import test from "node:test";
import assert from "node:assert/strict";
import { overlayLayerSpecs } from "../src/overlay-layers.js";

const set1Polygon = { id: "zoning", tile_layer: "zoning", min_zoom: 8, max_zoom: 14, color: "#bd663e" };
const typed = (id, geometry, extra = {}) => ({ id, tile_layer: id, geometry, min_zoom: 9, max_zoom: 15, color: "#123456", ...extra });

test("layer set 001 polygons keep fill and outline with maxzoom at the tile maximum", () => {
  const specs = overlayLayerSpecs(set1Polygon, "src");
  assert.deepEqual(specs.map((s) => s.type), ["fill", "line"]);
  assert.ok(specs.every((s) => s.maxzoom === 14 && s.minzoom === 8 && s["source-layer"] === "zoning"));
});

test("typed polygons keep drawing past their tile maximum by overzoom", () => {
  const specs = overlayLayerSpecs(typed("water-pressure-districts", "polygon", { min_zoom: 10, max_zoom: 16 }), "src");
  assert.deepEqual(specs.map((s) => s.type), ["fill", "line"]);
  assert.ok(specs.every((s) => s.maxzoom === 22));
});

test("lines draw as lines; truck routes split into full-time and dashed part-time layers", () => {
  const rail = overlayLayerSpecs(typed("railways", "line"), "src");
  assert.equal(rail.length, 1);
  assert.equal(rail[0].type, "line");
  assert.deepEqual(rail[0].paint["line-dasharray"], [3, 1.2]);
  const truck = overlayLayerSpecs(typed("truck-routes", "line"), "src");
  assert.deepEqual(truck.map((s) => s.id), ["overlay-truck-routes-line", "overlay-truck-routes-dash"]);
  assert.ok(truck[1].paint["line-dasharray"]);
  assert.ok(!truck[0].paint["line-dasharray"]);
});

test("points draw as circles; restricted structures are emphasised by the source's -1 flags", () => {
  const [s] = overlayLayerSpecs(typed("structures", "point"), "src");
  assert.equal(s.type, "circle");
  assert.equal(s.id, "overlay-structures-circle");
  assert.match(JSON.stringify(s.paint["circle-color"]), /HEIGHT_RESTRICTION/);
  const [other] = overlayLayerSpecs(typed("sewer-lift-stations", "point"), "src");
  assert.equal(other.paint["circle-color"], "#123456");
});

test("every overlay layer starts hidden", () => {
  for (const item of [set1Polygon, typed("truck-routes", "line"), typed("structures", "point")])
    for (const spec of overlayLayerSpecs(item, "src")) assert.equal(spec.layout.visibility, "none");
});
