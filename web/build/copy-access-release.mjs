/* Copy the parcel access package (private portrait store, D-079) into the
 * static site. Every shard is checked against the manifest before copying.
 * The site shows one parcel at a time; the package is not published as a
 * dataset anywhere else. */

import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
export const ACCESS_RELEASE_UNIT = "ca-on-hamilton-access";
export const ACCESS_RELEASE_ID = "2026-11-17-access-v0.1";
const SCHEMA = "heavymap-parcel-access/0.1.0";

export function copyAccessRelease({ sourceDir, outputDir }) {
  const source = path.resolve(sourceDir);
  const manifest = JSON.parse(fs.readFileSync(path.join(source, "access_manifest.json"), "utf8"));
  if (manifest.schema_version !== SCHEMA || manifest.jurisdiction !== "ca/on/hamilton")
    throw new Error("Parcel access manifest is incompatible");
  if (manifest.release?.id !== ACCESS_RELEASE_ID)
    throw new Error(`Parcel access release is ${manifest.release?.id}, expected ${ACCESS_RELEASE_ID}`);
  const releasePath = path.posix.join("map/data", ACCESS_RELEASE_UNIT, ACCESS_RELEASE_ID);
  const destination = path.join(outputDir, ...releasePath.split("/"));
  fs.mkdirSync(path.join(destination, "access"), { recursive: true });
  let shards = 0;
  for (const [suffix, expected] of Object.entries(manifest.shard_sha256)) {
    if (!/^[0-9A-Z]{2}$/.test(suffix)) throw new Error(`Unexpected access shard name ${suffix}`);
    const bytes = fs.readFileSync(path.join(source, "access", `${suffix}.json`));
    if (sha256(bytes) !== expected) throw new Error(`Parcel access shard ${suffix} failed hash verification`);
    fs.writeFileSync(path.join(destination, "access", `${suffix}.json`), bytes);
    shards += 1;
  }
  fs.copyFileSync(path.join(source, "access_manifest.json"), path.join(destination, "access_manifest.json"));
  return { unit: ACCESS_RELEASE_UNIT, id: ACCESS_RELEASE_ID, path: releasePath, record_count: manifest.record_count, shards };
}
