/* Copy the versioned Hamilton permit package into the static site. The source
 * package is hash-pinned; private extracts and review queues are never copied. */

import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const RELEASE_ID = "2026-11-17-field-screen-v0.2";
const RELEASE_UNIT = "ca-on-hamilton-development";
const RELEASE_FILES = [
  "development_release_manifest.json",
  "viewer_development_records_v0.2.json",
  "parcel_development_indicators_v0.2.json",
  "city_development_snapshot_v0.1.json",
];

export function copyDevelopmentRelease({ sourceDir, outputDir }) {
  const source = path.resolve(sourceDir);
  const releasePath = path.posix.join("map/data", RELEASE_UNIT, RELEASE_ID);
  const destination = path.join(outputDir, ...releasePath.split("/"));
  const manifest = JSON.parse(fs.readFileSync(path.join(source, RELEASE_FILES[0]), "utf8"));
  if (manifest.schema_version !== "hamilton-development-release-manifest/0.2.0" || manifest.jurisdiction !== "ca/on/hamilton")
    throw new Error("Hamilton public development release manifest is incompatible");
  const bytesByName = new Map();
  for (const name of RELEASE_FILES.slice(1)) {
    const bytes = fs.readFileSync(path.join(source, name));
    if (sha256(bytes) !== manifest.outputs?.[name])
      throw new Error(`Hamilton public development file failed hash verification: ${name}`);
    bytesByName.set(name, bytes);
  }
  const records = JSON.parse(bytesByName.get(RELEASE_FILES[1]).toString("utf8"));
  const indicators = JSON.parse(bytesByName.get(RELEASE_FILES[2]).toString("utf8"));
  const snapshot = JSON.parse(bytesByName.get(RELEASE_FILES[3]).toString("utf8"));
  if (records.schema_version !== "hamilton-development-viewer/0.2.0" || records.jurisdiction !== manifest.jurisdiction || records.record_count !== manifest.record_count || records.records?.length !== manifest.record_count)
    throw new Error("Hamilton public development records are incompatible");
  if (indicators.schema_version !== "hamilton-parcel-development-indicators/0.2.0" || indicators.jurisdiction !== manifest.jurisdiction)
    throw new Error("Hamilton public parcel indicators are incompatible");
  if (snapshot.schema_version !== "hamilton-city-development-snapshot/0.1.0" || snapshot.jurisdiction !== manifest.jurisdiction)
    throw new Error("Hamilton public city snapshot is incompatible");

  fs.mkdirSync(destination, { recursive: true });
  for (const name of RELEASE_FILES) fs.copyFileSync(path.join(source, name), path.join(destination, name));
  return {
    unit: RELEASE_UNIT,
    id: RELEASE_ID,
    path: releasePath,
    record_count: manifest.record_count,
    focus_record_count: manifest.focus_record_count,
  };
}
