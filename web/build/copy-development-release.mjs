/* Copy the versioned Hamilton permit package into the static site. The source
 * package is hash-pinned; private extracts and review queues are never copied. */

import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const RELEASE_ID = "2026-11-17-field-screen-v0.3";
const RELEASE_UNIT = "ca-on-hamilton-development";
const RELEASE_FILES = [
  "development_release_manifest.json",
  "viewer_development_records_v0.2.json",
  "parcel_development_indicators_v0.2.json",
  "city_development_snapshot_v0.1.json",
  "city_development_mosaic_v0.1.geojson",
];

export function copyDevelopmentRelease({ sourceDir, outputDir }) {
  const source = path.resolve(sourceDir);
  const releasePath = path.posix.join("map/data", RELEASE_UNIT, RELEASE_ID);
  const destination = path.join(outputDir, ...releasePath.split("/"));
  const manifest = JSON.parse(fs.readFileSync(path.join(source, RELEASE_FILES[0]), "utf8"));
  if (manifest.schema_version !== "hamilton-development-release-manifest/0.3.0" || manifest.jurisdiction !== "ca/on/hamilton")
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
  const mosaic = JSON.parse(bytesByName.get(RELEASE_FILES[4]).toString("utf8"));
  if (records.schema_version !== "hamilton-development-viewer/0.2.0" || records.jurisdiction !== manifest.jurisdiction || records.record_count !== manifest.record_count || records.records?.length !== manifest.record_count)
    throw new Error("Hamilton public development records are incompatible");
  if (indicators.schema_version !== "hamilton-parcel-development-indicators/0.2.0" || indicators.jurisdiction !== manifest.jurisdiction)
    throw new Error("Hamilton public parcel indicators are incompatible");
  if (snapshot.schema_version !== "hamilton-city-development-snapshot/0.1.0" || snapshot.jurisdiction !== manifest.jurisdiction)
    throw new Error("Hamilton public city snapshot is incompatible");
  if (mosaic.type !== "FeatureCollection" || mosaic.metadata?.schema_version !== "hamilton-development-mosaic/0.1.0"
    || mosaic.metadata?.jurisdiction !== manifest.jurisdiction || mosaic.features?.length !== manifest.activity_mosaic?.cell_count
    || mosaic.metadata?.parcel_or_permit_identifiers_in_output !== false || mosaic.metadata?.owner_and_builder_contact_addresses_in_output !== false)
    throw new Error("Hamilton public development mosaic is incompatible or contains a non-aggregate location contract");
  for (const feature of mosaic.features) {
    if (feature.geometry?.type !== "Polygon" || !Object.hasOwn(feature.properties ?? {}, "a00"))
      throw new Error("Hamilton development mosaic has an invalid cell feature");
    for (const [key, value] of Object.entries(feature.properties)) {
      if (!/^(?:a\d{2}|f\d{2}|n|f)$/.test(key) || !Number.isInteger(value) || value < 0)
        throw new Error("Hamilton development mosaic contains a non-count property");
    }
  }

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
