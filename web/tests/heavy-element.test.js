import test from "node:test";
import assert from "node:assert/strict";
import { buildModel, ease, span } from "../src/brand/heavy-element-3d.js";
import geometry from "../src/brand/heavy-element-geometry.js";

// The loader module defines a custom element; give it the minimum it needs in Node.
globalThis.HTMLElement ??= class {};
const { loaderFrame, finishFrame } = await import("../src/brand/heavy-element-loader.js");

test("the recovered geometry has the mark's parts", () => {
  assert.ok(geometry.node.r > 10);
  assert.equal(geometry.rays.length, 25);
  assert.equal(geometry.fragments.length, 36);
});

test("every ray and fragment gets a 3D position, and depth 0 is the flat logo", () => {
  const model = buildModel(geometry);
  assert.equal(model.rays.length, geometry.rays.length);
  for (const ray of model.rays) for (const p of [ray.a, ray.b]) assert.ok(p.every(Number.isFinite));
  // front view: x and y equal the source positions relative to the node
  const scale = 2 / Math.max(geometry.width, geometry.height);
  const first = geometry.rays[0];
  assert.ok(Math.abs(model.rays[0].a[0] - (first.x1 - geometry.node.x) * scale) < 1e-9);
});

test("the same seed gives the same depths, another seed differs", () => {
  const a = buildModel(geometry, { seed: 7 }), b = buildModel(geometry, { seed: 7 }), c = buildModel(geometry, { seed: 8 });
  assert.deepEqual(a.rays.map((r) => r.b[2]), b.rays.map((r) => r.b[2]));
  assert.notDeepEqual(a.rays.map((r) => r.b[2]), c.rays.map((r) => r.b[2]));
});

test("spin mode locks flat at the end of each spin and repeats", () => {
  for (const t of [1.5, 2.5, 1.5 + 2.6]) {
    const f = loaderFrame("spin", t);
    assert.ok(f.depth < 1e-6, `depth at ${t}`);
    assert.ok(Math.abs(f.yaw) < 1e-6, `yaw at ${t}`);
  }
  assert.ok(loaderFrame("spin", 0.3).depth === 1);
});

test("drift mode never flattens until finished, and finishing ends flat at the front", () => {
  for (const t of [0, 1, 7.3]) assert.equal(loaderFrame("drift", t).depth, 1);
  const end = finishFrame(loaderFrame("drift", 3.1), 1);
  assert.equal(end.depth, 0);
  assert.equal(end.yaw, 0);
  assert.equal(end.pitch, 0);
});

test("easing helpers stay within their range", () => {
  assert.equal(span(5, 0, 10), 0.5);
  assert.equal(span(-1, 0, 10), 0);
  assert.equal(ease.outCubic(1), 1);
  assert.equal(ease.inOutCubic(0), 0);
});
