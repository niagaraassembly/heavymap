/* Copy the explicitly screened Hamilton permit viewer files into a versioned
 * static release. Internal review queues and source extracts are never copied. */

import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const RELEASE_ID = "2026-11-17-field-screen-v0.1";
const RELEASE_UNIT = "ca-on-hamilton-development";
const SOURCE_FILES = [
  "field_screen_manifest_v0.1.json",
  "viewer_development_records_v0.1.json",
  "parcel_development_indicators_v0.1.json",
  "city_development_snapshot_manifest_v0.1.json",
  "city_development_snapshot_v0.1.json",
];
const RELEASE_FILES = [
  "development_release_manifest.json",
  "viewer_development_records_v0.1.json",
  "parcel_development_indicators_v0.1.json",
  "city_development_snapshot_v0.1.json",
];

export function copyDevelopmentRelease({ sourceDir, outputDir }) {
  const source = path.resolve(sourceDir);
  const releasePath = path.posix.join("map/data", RELEASE_UNIT, RELEASE_ID);
  const destination = path.join(outputDir, ...releasePath.split("/"));
  const publicManifestPath = path.join(source, RELEASE_FILES[0]);
  if (fs.existsSync(publicManifestPath)) {
    const publicManifest = JSON.parse(fs.readFileSync(publicManifestPath, "utf8"));
    if (publicManifest.schema_version !== "hamilton-development-release-manifest/0.1.0" || publicManifest.jurisdiction !== "ca/on/hamilton")
      throw new Error("Hamilton public development release manifest is incompatible");
    const fileBytes = new Map();
    for (const name of RELEASE_FILES.slice(1)) {
      const bytes = fs.readFileSync(path.join(source, name));
      if (sha256(bytes) !== publicManifest.outputs?.[name])
        throw new Error(`Hamilton public development file failed hash verification: ${name}`);
      fileBytes.set(name, bytes);
    }
    const publicRecords = JSON.parse(fileBytes.get(RELEASE_FILES[1]).toString("utf8"));
    const indicators = JSON.parse(fileBytes.get(RELEASE_FILES[2]).toString("utf8"));
    const snapshot = JSON.parse(fileBytes.get(RELEASE_FILES[3]).toString("utf8"));
    if (publicRecords.schema_version !== "hamilton-development-viewer/0.1.0" || publicRecords.jurisdiction !== publicManifest.jurisdiction || publicRecords.record_count !== publicManifest.record_count || publicRecords.records?.length !== publicManifest.record_count)
      throw new Error("Hamilton public development records are incompatible");
    if (indicators.schema_version !== "hamilton-parcel-development-indicators/0.1.0" || indicators.jurisdiction !== publicManifest.jurisdiction)
      throw new Error("Hamilton public parcel indicators are incompatible");
    if (snapshot.schema_version !== "hamilton-city-development-snapshot/0.1.0" || snapshot.jurisdiction !== publicManifest.jurisdiction)
      throw new Error("Hamilton public city snapshot is incompatible");

    fs.mkdirSync(destination, { recursive: true });
    for (const name of RELEASE_FILES) fs.copyFileSync(path.join(source, name), path.join(destination, name));
    return {
      unit: RELEASE_UNIT,
      id: RELEASE_ID,
      path: releasePath,
      record_count: publicManifest.record_count,
      focus_record_count: publicManifest.focus_record_count,
    };
  }

  const manifestPath = path.join(source, SOURCE_FILES[0]);
  const manifestBytes = fs.readFileSync(manifestPath);
  const manifest = JSON.parse(manifestBytes.toString("utf8"));
  if (manifest.schema_version !== "hamilton-field-screen-manifest/0.1.0" || manifest.jurisdiction !== "ca/on/hamilton")
    throw new Error("Hamilton development viewer manifest is incompatible");
  const recordsBytes = fs.readFileSync(path.join(source, SOURCE_FILES[1]));
  if (sha256(recordsBytes) !== manifest.outputs?.[SOURCE_FILES[1]])
    throw new Error("Hamilton development viewer file failed hash verification");
  const recordsDoc = JSON.parse(recordsBytes.toString("utf8"));
  if (recordsDoc.schema_version !== "hamilton-development-viewer/0.1.0" || recordsDoc.jurisdiction !== manifest.jurisdiction || recordsDoc.record_count !== manifest.counts.records || !Array.isArray(recordsDoc.records) || recordsDoc.records.length !== recordsDoc.record_count)
    throw new Error("Hamilton development viewer rows are incompatible");
  const records = recordsDoc.records.map((record) => {
    const sourceEvidence = { ...record.source_evidence_ref };
    delete sourceEvidence.extracted_record_file;
    delete sourceEvidence.page_residuals_file;
    delete sourceEvidence.retention_status;
    return { ...record, source_evidence_ref: sourceEvidence };
  });
  const publicRecords = { ...recordsDoc, records };
  const recordsOut = Buffer.from(`${JSON.stringify(publicRecords)}\n`);

  const indicatorsName = SOURCE_FILES[2];
  const indicatorsBytes = fs.readFileSync(path.join(source, indicatorsName));
  if (sha256(indicatorsBytes) !== manifest.outputs?.[indicatorsName])
    throw new Error("Hamilton parcel indicators failed hash verification");
  const indicators = JSON.parse(indicatorsBytes.toString("utf8"));
  if (indicators.schema_version !== "hamilton-parcel-development-indicators/0.1.0" || indicators.jurisdiction !== manifest.jurisdiction)
    throw new Error("Hamilton parcel indicators are incompatible");

  const snapshotManifest = JSON.parse(fs.readFileSync(path.join(source, SOURCE_FILES[3]), "utf8"));
  if (snapshotManifest.schema_version !== "hamilton-city-development-snapshot-manifest/0.1.0" || snapshotManifest.jurisdiction !== manifest.jurisdiction)
    throw new Error("Hamilton city snapshot manifest is incompatible");
  const snapshotName = SOURCE_FILES[4];
  const snapshotBytes = fs.readFileSync(path.join(source, snapshotName));
  if (sha256(snapshotBytes) !== snapshotManifest.output?.[snapshotName])
    throw new Error("Hamilton city snapshot failed hash verification");
  const snapshot = JSON.parse(snapshotBytes.toString("utf8"));
  if (snapshot.schema_version !== "hamilton-city-development-snapshot/0.1.0" || snapshot.jurisdiction !== manifest.jurisdiction)
    throw new Error("Hamilton city snapshot is incompatible");

  const outputBytes = new Map([
    [RELEASE_FILES[1], recordsOut],
    [RELEASE_FILES[2], indicatorsBytes],
    [RELEASE_FILES[3], snapshotBytes],
  ]);
  const publicManifest = {
    schema_version: "hamilton-development-release-manifest/0.1.0",
    jurisdiction: manifest.jurisdiction,
    record_count: publicRecords.record_count,
    focus_record_count: manifest.counts.focus_records,
    linked_record_count: indicators.linked_record_count,
    unique_parcel_count: indicators.unique_parcel_count,
    outputs: Object.fromEntries([...outputBytes].map(([name, bytes]) => [name, sha256(bytes)])),
  };

  fs.mkdirSync(destination, { recursive: true });
  for (const [name, bytes] of outputBytes) fs.writeFileSync(path.join(destination, name), bytes);
  fs.writeFileSync(path.join(destination, RELEASE_FILES[0]), `${JSON.stringify(publicManifest, null, 2)}\n`);
  return {
    unit: RELEASE_UNIT,
    id: RELEASE_ID,
    path: releasePath,
    record_count: publicManifest.record_count,
    focus_record_count: publicManifest.focus_record_count,
  };
}
