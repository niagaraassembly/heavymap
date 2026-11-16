/* Loader for dossier releases, schema 2 (contract: seam-contract-dossier.md).
 *
 *   pin()           fetch manifest.json and files.json, check files.json against
 *                   the manifest, and only then replace the current release.
 *                   A failed check keeps the previous pin (D-066).
 *   core(key)       the core record for a parcel key, from its shard.
 *   detail(key)     the detail record (full address list, source feature ids).
 *
 * Every shard and detail file is checked against files.json before it is
 * parsed. Failures return {ok:false, reason} and call onReport; nothing throws
 * into the interface. Fetching is injected so the loader runs in tests. */

import { sha256Hex } from "./hash.js";

export const SUPPORTED_SCHEMA = 2;

const defaultFetchBytes = async (url) => {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url}: ${r.status}`);
  return new Uint8Array(await r.arrayBuffer());
};
const parse = (bytes) => JSON.parse(new TextDecoder().decode(bytes));
const shardOf = (key) => key.slice(-2);

export function createDossierLoader({ base, fetchBytes = defaultFetchBytes, onReport = () => {} }) {
  const root = base.endsWith("/") ? base : base + "/";
  let current = null; // {manifest, files: Map(path -> {bytes, sha256})}
  const cache = new Map(); // path -> parsed JSON

  async function pin() {
    try {
      const manifestBytes = await fetchBytes(root + "manifest.json");
      const manifest = parse(manifestBytes);
      if (manifest.schema !== SUPPORTED_SCHEMA) {
        onReport({ kind: "unsupported_schema", schema: manifest.schema });
        return { ok: false, reason: "unsupported_schema" };
      }
      const filesBytes = await fetchBytes(root + "files.json");
      if ((await sha256Hex(filesBytes)) !== manifest.files_sha256) {
        onReport({ kind: "files_hash_mismatch" });
        return { ok: false, reason: "hash_mismatch" };
      }
      const files = new Map(parse(filesBytes).files.map((f) => [f.path, f]));
      current = { manifest, files };
      cache.clear();
      return { ok: true, release: manifest.release, manifest };
    } catch (e) {
      onReport({ kind: "pin_failed", detail: String(e) });
      return { ok: false, reason: "unavailable" };
    }
  }

  async function file(path) {
    if (!current) return { ok: false, reason: "not_pinned" };
    if (cache.has(path)) return { ok: true, doc: cache.get(path) };
    const listed = current.files.get(path);
    if (!listed) return { ok: false, reason: "not_in_release" };
    let bytes;
    try {
      bytes = await fetchBytes(root + path);
    } catch (e) {
      onReport({ kind: "file_unavailable", path, detail: String(e) });
      return { ok: false, reason: "unavailable" };
    }
    if (bytes.length !== listed.bytes || (await sha256Hex(bytes)) !== listed.sha256) {
      onReport({ kind: "file_hash_mismatch", path });
      return { ok: false, reason: "hash_mismatch" };
    }
    const doc = parse(bytes);
    cache.set(path, doc);
    return { ok: true, doc };
  }

  async function record(folder, key) {
    const f = await file(`${folder}/${shardOf(key)}.json`);
    if (!f.ok) return f;
    const rec = f.doc.records?.[key];
    if (!rec) return { ok: false, reason: "not_in_release" };
    return { ok: true, record: rec, release: current.manifest.release };
  }

  return {
    pin,
    core: (key) => record("shards", key),
    detail: (key) => record("detail", key),
    asset: file,
    get release() {
      return current?.manifest.release ?? null;
    },
  };
}
