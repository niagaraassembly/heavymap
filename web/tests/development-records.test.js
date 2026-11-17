import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { copyDevelopmentRelease } from "../build/copy-development-release.mjs";
import { createHamiltonDevelopmentLoader } from "../src/development-records.js";

const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const json = (value) => Buffer.from(`${JSON.stringify(value)}\n`);

test("public Hamilton v0.3 package retains permit fields without contact addresses and loads linked records", async (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "hm-development-release-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const source = path.join(root, "source");
  const output = path.join(root, "output");
  fs.mkdirSync(source);

  const record = {
    development_record_id: "development-1",
    parcel_ids: ["parcel-1"],
    report_month: "2026-09",
    source_fields: {
      permit_number: { value: "P-1", source_text: "P-1", status: "observed" },
      permit_description: { value: "Construction unspecified", source_text: "Construction unspecified", status: "observed" },
      owner_organization_name: { value: "Example Industrial Ltd", source_text: "Example Industrial Ltd", status: "observed" },
    },
    withheld_source_fields: ["owner_address", "builder_address"],
    source_evidence_ref: {
      source_page: 1,
      source_record_id: "source-1",
    },
  };
  const records = json({
    schema_version: "hamilton-development-viewer/0.2.0",
    jurisdiction: "ca/on/hamilton",
    record_count: 1,
    records: [record],
  });
  const indicators = json({
    schema_version: "hamilton-parcel-development-indicators/0.2.0",
    jurisdiction: "ca/on/hamilton",
    relationship: "development_record_to_parcel",
    linked_record_count: 1,
    unique_parcel_count: 1,
    parcels: { "parcel-1": { development_record_count: 1, development_record_ids: ["development-1"] } },
  });
  const snapshot = json({
    schema_version: "hamilton-city-development-snapshot/0.1.0",
    jurisdiction: "ca/on/hamilton",
    monthly: [],
  });
  // Release v0.3 adds an aggregate activity mosaic: counts per grid cell only.
  const mosaic = json({
    type: "FeatureCollection",
    metadata: {
      schema_version: "hamilton-development-mosaic/0.1.0",
      jurisdiction: "ca/on/hamilton",
      parcel_or_permit_identifiers_in_output: false,
      owner_and_builder_contact_addresses_in_output: false,
    },
    features: [{
      type: "Feature",
      geometry: { type: "Polygon", coordinates: [[[-79.9, 43.2], [-79.89, 43.2], [-79.89, 43.21], [-79.9, 43.2]]] },
      properties: { a00: 1, n: 1 },
    }],
  });
  fs.writeFileSync(path.join(source, "city_development_mosaic_v0.1.geojson"), mosaic);
  fs.writeFileSync(path.join(source, "viewer_development_records_v0.2.json"), records);
  fs.writeFileSync(path.join(source, "parcel_development_indicators_v0.2.json"), indicators);
  fs.writeFileSync(path.join(source, "city_development_snapshot_v0.1.json"), snapshot);
  fs.writeFileSync(path.join(source, "development_release_manifest.json"), json({
    schema_version: "hamilton-development-release-manifest/0.3.0",
    jurisdiction: "ca/on/hamilton",
    record_count: 1,
    focus_record_count: 1,
    report_months: ["2026-09"],
    activity_mosaic: { cell_count: 1 },
    outputs: {
      "city_development_mosaic_v0.1.geojson": hash(mosaic),
      "viewer_development_records_v0.2.json": hash(records),
      "parcel_development_indicators_v0.2.json": hash(indicators),
      "city_development_snapshot_v0.1.json": hash(snapshot),
    },
  }));

  const release = copyDevelopmentRelease({ sourceDir: source, outputDir: output });
  const packageDir = path.join(output, release.path);
  const publishedRecords = JSON.parse(fs.readFileSync(path.join(packageDir, "viewer_development_records_v0.2.json"), "utf8"));
  assert.deepEqual(publishedRecords.records[0].source_fields, record.source_fields);
  assert.deepEqual(publishedRecords.records[0].withheld_source_fields, ["owner_address", "builder_address"]);
  assert.deepEqual(fs.readdirSync(packageDir).sort(), [
    "city_development_mosaic_v0.1.geojson",
    "city_development_snapshot_v0.1.json",
    "development_release_manifest.json",
    "parcel_development_indicators_v0.2.json",
    "viewer_development_records_v0.2.json",
  ]);

  const deployedOutput = path.join(root, "deployed-site");
  copyDevelopmentRelease({ sourceDir: packageDir, outputDir: deployedOutput });
  const deployedPackage = path.join(deployedOutput, release.path);
  assert.deepEqual(fs.readdirSync(deployedPackage).sort(), fs.readdirSync(packageDir).sort());
  for (const file of fs.readdirSync(packageDir)) {
    assert.equal(
      hash(fs.readFileSync(path.join(deployedPackage, file))),
      hash(fs.readFileSync(path.join(packageDir, file))),
    );
  }

  const loader = createHamiltonDevelopmentLoader({
    base: "https://example.test/development/",
    fetchBytes: async (url) => new Uint8Array(fs.readFileSync(path.join(deployedPackage, path.basename(url)))),
  });
  assert.deepEqual(await loader.pin(), { ok: true, recordCount: 1, focusCount: 1, reportMonths: ["2026-09"], activityMosaic: { cell_count: 1 } });
  const all = await loader.allRecords();
  assert.equal(all.records.length, 1);
  const linked = await loader.forParcel("parcel-1");
  assert.equal(linked.count, 1);
  assert.equal(linked.records[0].development_record_id, "development-1");
  const city = await loader.citySnapshot();
  assert.equal(city.snapshot.jurisdiction, "ca/on/hamilton");
});
