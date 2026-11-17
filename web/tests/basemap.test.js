import test from "node:test";
import assert from "node:assert/strict";
import {
  BASEMAP_SOURCE,
  PARCEL_PAINT,
  basemapFlavor,
  basemapLayers,
  findBasemap,
  firstLabelLayerId,
} from "../src/basemap.js";

test("unknown flavors fall back to light", () => {
  assert.equal(basemapFlavor("dark"), "dark");
  assert.equal(basemapFlavor("neon"), "light");
  assert.equal(basemapFlavor(null), "light");
});

test("layers are prefixed, bound to the basemap source and need no sprite", () => {
  for (const flavor of ["light", "dark"]) {
    const list = basemapLayers(flavor);
    assert.ok(list.length > 40);
    for (const layer of list) {
      assert.ok(layer.id.startsWith("basemap-"), layer.id);
      if (layer.type !== "background") assert.equal(layer.source, BASEMAP_SOURCE);
      assert.equal(layer.layout?.["icon-image"], undefined, `${layer.id} still asks for an icon`);
    }
    const ids = list.map((layer) => layer.id);
    for (const dropped of ["basemap-pois", "basemap-roads_shields", "basemap-roads_oneway"])
      assert.ok(!ids.includes(dropped), dropped);
  }
});

test("light keeps the still image visible; dark paints its own ground", () => {
  assert.ok(!basemapLayers("light").some((layer) => layer.type === "background"));
  assert.ok(basemapLayers("dark").some((layer) => layer.type === "background"));
});

test("parcels can be placed beneath the first label layer", () => {
  const list = basemapLayers("light");
  const id = firstLabelLayerId(list);
  assert.equal(list.find((layer) => layer.id === id).type, "symbol");
});

test("every ground has a complete parcel paint", () => {
  for (const ground of ["still", "light", "dark"])
    for (const key of ["fill", "fillOpacity", "line", "lineWidth", "selFill", "selFillOpacity", "selLine"])
      assert.notEqual(PARCEL_PAINT[ground][key], undefined, `${ground}.${key}`);
});

test("findBasemap reads a descriptor and refuses anything doubtful", async () => {
  const ok = async () => ({ ok: true, json: async () => ({ file: "hamilton.pmtiles", max_zoom: 15 }) });
  assert.deepEqual(await findBasemap("/b/", ok), {
    url: "/b/hamilton.pmtiles",
    maxZoom: 15,
    attribution: "© OpenStreetMap",
  });
  const missing = async () => ({ ok: false });
  assert.equal(await findBasemap("/b/", missing), null);
  const escape = async () => ({ ok: true, json: async () => ({ file: "../other.pmtiles" }) });
  assert.equal(await findBasemap("/b/", escape), null);
  const remote = async () => ({ ok: true, json: async () => ({ file: "https://x.example/a.pmtiles" }) });
  assert.equal(await findBasemap("/b/", remote), null);
  const broken = async () => { throw new Error("offline"); };
  assert.equal(await findBasemap("/b/", broken), null);
});
