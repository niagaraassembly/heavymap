import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PMTiles } from "pmtiles";
import { parcels, bands, packet, matchesLens } from "../src/fixtures.js";
test("each fixture carries six ordered bands and honest stamps or named refusals", () => {
  for (const p of parcels) {
    assert.equal(p.synthetic, true);
    assert.match(p.id, /SYN-/);
    assert.deepEqual(Object.keys(p.bands), bands);
    for (const band of bands) {
      const b = p.bands[band];
      assert.ok(b.claims.length + b.refusals.length > 0);
      for (const c of b.claims) {
        assert.ok(["observed", "joined", "derived"].includes(c.grade));
        for (const f of [
          "source_name",
          "publisher",
          "licence",
          "original_id",
          "retrieved_on",
          "observation_on",
        ])
          assert.ok(c.stamp[f], f);
        if (c.grade === "joined") assert.ok(c.stamp.join_method);
        if (c.grade === "derived") {
          assert.ok(c.stamp.inputs);
          assert.ok(c.stamp.method);
        }
        if (c.share !== undefined) assert.ok(c.share >= 0 && c.share <= 1);
      }
      for (const r of b.refusals)
        assert.ok(
          ["not_joined", "not_in_coverage", "not_licensed"].includes(r.reason),
        );
    }
    assert.deepEqual(packet(p).bands, p.bands);
    assert.equal(packet(p).synthetic, true);
  }
});
test("lens membership does not infer an unmeasured reading", () => {
  for (const id of ["source", "outdoor", "edge"])
    assert.equal(parcels.filter((p) => matchesLens(p, id)).length, 1);
  assert.equal(parcels.filter((p) => matchesLens(p, "all")).length, 3);
  assert.equal(parcels[0].bands.derived_readings.claims.length, 0);
  assert.ok(
    parcels[1].bands.derived_readings.claims[0].comment.includes(
      "not measured unused space",
    ),
  );
});
test("synthetic PMTiles archive contains an actual MVT tile with expected bounds", async () => {
  const bytes = readFileSync(
    new URL("../public/synthetic-parcels.pmtiles", import.meta.url),
  );
  const archive = new PMTiles({
    getKey: () => "synthetic-test",
    getBytes: async (o, n) => ({
      data: bytes.buffer.slice(
        bytes.byteOffset + o,
        bytes.byteOffset + Math.min(bytes.length, o + n),
      ),
    }),
  });
  const header = await archive.getHeader();
  assert.equal(header.tileType, 1);
  assert.equal(header.numAddressedTiles, 1);
  assert.equal(header.minZoom, 8);
  assert.ok((await archive.getZxy(8, 71, 93)).data.byteLength > 100);
  assert.equal(await archive.getZxy(8, 70, 93), undefined);
  assert.equal((await archive.getMetadata()).vector_layers[0].id, "parcels");
  assert.equal(
    (await archive.getMetadata()).vector_layers[0].fields.heavymap_id,
    "String",
  );
  assert.equal(
    (await archive.getMetadata()).vector_layers[0].fields.id,
    undefined,
  );
});

test("wire IDs agree across GeoJSON and tile metadata", async () => {
  const { ID_FIELD, ID_PREFIX } = await import("../src/contract.js");
  const { featureCollection } = await import("../src/fixtures.js");
  for (const feature of featureCollection(parcels).features) {
    assert.ok(feature.properties[ID_FIELD].startsWith(ID_PREFIX));
    assert.equal(feature.properties.id, undefined);
  }
});
test("area-share formatting preserves fraction units and small nonzero areas", async () => {
  const { formatAreaShare } = await import("../src/contract.js");
  assert.equal(formatAreaShare(0.72), "72.0%");
  assert.equal(formatAreaShare(1), "100.0%");
  assert.equal(formatAreaShare(0), "0%");
  assert.equal(formatAreaShare(0, 0.2), "below 0.01%");
  assert.equal(formatAreaShare(0.00005), "below 0.01%");
  assert.equal(formatAreaShare(0.0005), "below 0.1%");
  assert.equal(formatAreaShare(0.001), "0.1%");
  assert.throws(() => formatAreaShare(72), RangeError);
  assert.throws(() => formatAreaShare(NaN), RangeError);
});
