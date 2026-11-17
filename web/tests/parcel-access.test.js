import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createAccessLoader, formatDistance, summariseAccess } from "../src/parcel-access.js";

const KEY = "ia:ca:on:hamilton:parcel:01M54B6G7SMYHNYPP6EQDEXS7Q";
const record = {
  truck_route_m: 12.4, truck_route_time: "Full Time", rail_m: 44, watermain_m: 8.2, watermain_mm: 300,
  watermain_installed: 1974, sewermain_m: 11, sewermain_mm: 450, sewermain_subtype: "SANITARY",
  lift_station_m: 1234, pressure_district: "7", counted_street_m: 15, counted_street_adt: 14200, counted_street_year: 2023,
};

function pkg(records, { tamper = false } = {}) {
  const shard = JSON.stringify({ schema_version: "heavymap-parcel-access/0.1.0", shard: KEY.slice(-2), records });
  const bytes = new TextEncoder().encode(shard);
  const manifest = {
    schema_version: "heavymap-parcel-access/0.1.0", jurisdiction: "ca/on/hamilton", record_count: 1,
    release: { unit: "ca-on-hamilton-access", id: "test" },
    shard_sha256: { [KEY.slice(-2)]: tamper ? "0".repeat(64) : createHash("sha256").update(bytes).digest("hex") },
  };
  return async (url) => {
    if (url.endsWith("access_manifest.json")) return new TextEncoder().encode(JSON.stringify(manifest));
    if (url.endsWith(`access/${KEY.slice(-2)}.json`)) return bytes;
    throw new Error("404");
  };
}

test("distances read as metres or kilometres", () => {
  assert.equal(formatDistance(12.4), "12 m");
  assert.equal(formatDistance(1234), "1.2 km");
  assert.equal(formatDistance(23456), "23 km");
  assert.equal(formatDistance(undefined), null);
});

test("loader verifies the shard hash and returns the record", async () => {
  const loader = createAccessLoader({ base: "/x/", fetchBytes: pkg({ [KEY]: record }) });
  assert.equal((await loader.pin()).ok, true);
  const hit = await loader.forParcel(KEY);
  assert.equal(hit.ok, true);
  assert.equal(hit.record.watermain_mm, 300);
  const missing = await loader.forParcel(KEY.slice(0, -2) + "ZZ");
  assert.equal(missing.ok, false);
});

test("a tampered shard is refused", async () => {
  const reports = [];
  const loader = createAccessLoader({ base: "/x/", fetchBytes: pkg({ [KEY]: record }, { tamper: true }), onReport: (r) => reports.push(r) });
  await loader.pin();
  const result = await loader.forParcel(KEY);
  assert.equal(result.ok, false);
  assert.equal(reports[0].kind, "access_shard_unavailable");
});

test("rows keep nearness distinct from service and counts distinct from trucks", () => {
  const { rows, caveat } = summariseAccess(record, null);
  const byId = Object.fromEntries(rows.map((r) => [r.id, r]));
  assert.equal(byId.truck_route.value, "12 m");
  assert.equal(byId.truck_route.sub, "full-time route");
  assert.equal(byId.watermain.value, "300 mm");
  assert.match(byId.watermain.sub, /8 m from boundary · installed 1974/);
  assert.equal(byId.sewermain.value, "450 mm sanitary");
  assert.equal(byId.traffic.value, "14,200 vehicles a day");
  assert.match(byId.traffic.sub, /all vehicles, 2023 count/);
  assert.match(byId.rail.sub, /not rail service/);
  assert.match(caveat, /Near is not connected/);
  assert.match(caveat, /not trucks/);
});

test("missing measurements say so instead of disappearing", () => {
  const { rows } = summariseAccess({ lift_station_m: 20601 }, null);
  const byId = Object.fromEntries(rows.map((r) => [r.id, r]));
  assert.equal(byId.watermain.value, "None within 1.0 km");
  assert.equal(byId.truck_route.value, "None within 2.0 km");
  assert.equal(byId.traffic.value, "No count within 60 m");
  assert.equal(byId.lift_station.value, "21 km");
  assert.ok(!("pressure_district" in byId));
});
