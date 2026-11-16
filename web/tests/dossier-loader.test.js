import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createDossierLoader } from "../src/dossier-loader.js";
import { sha256Hex } from "../src/hash.js";

const enc = (o) => new TextEncoder().encode(JSON.stringify(o));
const sha = (b) => createHash("sha256").update(b).digest("hex");
const KEY = "ia:ca:on:hamilton:parcel:01ARZ3NDEKTSV4RRFFQ69G5FAV"; // shard "AV"
const record = { key: KEY, area: { value: 1, unit: "m2", crs: "EPSG:26917", src: "s", join: "j", conf: "high" } };

/** An in-memory release: Map(path -> bytes). */
function release({ schema = 2 } = {}) {
  const files = new Map();
  const put = (p, o) => files.set(p, enc(o));
  put("shards/AV.json", { schema, jurisdiction: "hamilton", shard: "AV", records: { [KEY]: record } });
  put("detail/AV.json", { schema, jurisdiction: "hamilton", shard: "AV", records: { [KEY]: { addresses_full: [], feature_ids: {} } } });
  const list = [...files].map(([p, b]) => ({ path: p, bytes: b.length, sha256: sha(b) }));
  const filesBytes = enc({ schema, files: list });
  files.set("files.json", filesBytes);
  files.set("manifest.json", enc({ schema, release: { unit: "ca-on-hamilton", id: "t1" }, files_sha256: sha(filesBytes) }));
  return files;
}
const loaderFor = (files, reports = []) =>
  createDossierLoader({
    base: "r/",
    fetchBytes: async (url) => {
      const b = files.get(url.replace(/^r\//, ""));
      if (!b) throw new Error("404 " + url);
      return b;
    },
    onReport: (r) => reports.push(r),
  });

test("pin, then core and detail load and verify", async () => {
  const l = loaderFor(release());
  const p = await l.pin();
  assert.equal(p.ok, true);
  assert.deepEqual(l.release, { unit: "ca-on-hamilton", id: "t1" });
  const c = await l.core(KEY);
  assert.equal(c.ok, true);
  assert.equal(c.record.key, KEY);
  assert.equal((await l.detail(KEY)).ok, true);
});

test("a tampered shard is refused as hash_mismatch and reported", async () => {
  const files = release();
  files.set("shards/AV.json", new Uint8Array([...files.get("shards/AV.json"), 32]));
  const reports = [];
  const l = loaderFor(files, reports);
  await l.pin();
  assert.deepEqual(await l.core(KEY), { ok: false, reason: "hash_mismatch" });
  assert.equal(reports.at(-1).kind, "file_hash_mismatch");
  assert.equal((await l.detail(KEY)).ok, true, "detail is independent of the failed shard");
});

test("a missing shard file is unavailable, not a crash", async () => {
  const files = release();
  files.delete("shards/AV.json");
  const l = loaderFor(files);
  await l.pin();
  assert.deepEqual(await l.core(KEY), { ok: false, reason: "unavailable" });
});

test("a key that is not in its shard, or a shard not in the release, is not_in_release", async () => {
  const l = loaderFor(release());
  await l.pin();
  assert.deepEqual(await l.core("ia:ca:on:hamilton:parcel:01ARZ3NDEKTSV4RRFFQ69G5FAW"), { ok: false, reason: "not_in_release" });
  assert.deepEqual(await l.core("ia:ca:on:hamilton:parcel:01ARZ3NDEKTSV4RRFFQ69G5F00"), { ok: false, reason: "not_in_release" });
});

test("a files.json that does not match the manifest is not pinned, and the previous pin is kept", async () => {
  const good = release();
  const l = loaderFor(good);
  assert.equal((await l.pin()).ok, true);
  const bad = release();
  bad.set("files.json", new Uint8Array([...bad.get("files.json"), 32]));
  // same loader, new network state: swap what the fetch returns
  const reports = [];
  const l2 = createDossierLoader({ base: "r/", fetchBytes: async (u) => (l2.__bad ? bad : good).get(u.replace(/^r\//, "")), onReport: (r) => reports.push(r) });
  assert.equal((await l2.pin()).ok, true);
  l2.__bad = true;
  assert.deepEqual(await l2.pin(), { ok: false, reason: "hash_mismatch" });
  assert.equal(l2.release.id, "t1", "previous release still pinned");
  assert.equal((await l2.core(KEY)).ok, true, "and still serves from the previous pin");
});

test("an unknown schema major is rejected", async () => {
  const l = loaderFor(release({ schema: 3 }));
  assert.deepEqual(await l.pin(), { ok: false, reason: "unsupported_schema" });
  assert.equal(l.release, null);
});

test("nothing loads before a pin", async () => {
  const l = loaderFor(release());
  assert.deepEqual(await l.core(KEY), { ok: false, reason: "not_pinned" });
});

// Real Hamilton build (set HM_RELEASE_DIR to a directory written by `python3 -m industrial_atlas.dossier`).
const REAL = process.env.HM_RELEASE_DIR;
test("real Hamilton release: pin, then every sampled record loads and hashes", { skip: !REAL }, async () => {
  const l = createDossierLoader({ base: "r/", fetchBytes: async (u) => new Uint8Array(fs.readFileSync(path.join(REAL, u.replace(/^r\//, "")))) });
  const p = await l.pin();
  assert.equal(p.ok, true, JSON.stringify(p));
  const shards = fs.readdirSync(path.join(REAL, "shards")).filter((n) => n.endsWith(".json")).sort().filter((_, i) => i % 64 === 0);
  let n = 0;
  for (const s of shards) {
    const keys = Object.keys(JSON.parse(fs.readFileSync(path.join(REAL, "shards", s), "utf8")).records).slice(0, 5);
    for (const k of keys) {
      const c = await l.core(k), d = await l.detail(k);
      assert.ok(c.ok && d.ok, k);
      assert.equal(c.record.key, k);
      assert.equal(d.record.addresses_full.length, c.record.addresses.count);
      n++;
    }
  }
  assert.ok(n >= 50);
  assert.equal(await sha256Hex(new Uint8Array(fs.readFileSync(path.join(REAL, "files.json")))), p.manifest.files_sha256);
});
