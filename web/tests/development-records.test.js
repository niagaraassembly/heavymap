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

test("public Hamilton package strips internal processing paths and loads linked records", async (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "hm-development-release-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const source = path.join(root, "source");
  const output = path.join(root, "output");
  fs.mkdirSync(source);

  const record = {
    development_record_id: "development-1",
    parcel_ids: ["parcel-1"],
    source_reported_names: { owner: "Example Industrial Ltd", builder: null },
    source_evidence_ref: {
      source_page: 1,
      source_record_id: "source-1",
      extracted_record_file: "private-extract.jsonl",
      page_residuals_file: "private-residuals.jsonl",
      retention_status: "internal",
    },
  };
  const records = json({
    schema_version: "hamilton-development-viewer/0.1.0",
    jurisdiction: "ca/on/hamilton",
    record_count: 1,
    records: [record],
  });
  const indicators = json({
    schema_version: "hamilton-parcel-development-indicators/0.1.0",
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
  fs.writeFileSync(path.join(source, "viewer_development_records_v0.1.json"), records);
  fs.writeFileSync(path.join(source, "parcel_development_indicators_v0.1.json"), indicators);
  fs.writeFileSync(path.join(source, "city_development_snapshot_v0.1.json"), snapshot);
  fs.writeFileSync(path.join(source, "field_screen_manifest_v0.1.json"), json({
    schema_version: "hamilton-field-screen-manifest/0.1.0",
    jurisdiction: "ca/on/hamilton",
    counts: { records: 1, focus_records: 1 },
    outputs: {
      "viewer_development_records_v0.1.json": hash(records),
      "parcel_development_indicators_v0.1.json": hash(indicators),
    },
  }));
  fs.writeFileSync(path.join(source, "city_development_snapshot_manifest_v0.1.json"), json({
    schema_version: "hamilton-city-development-snapshot-manifest/0.1.0",
    jurisdiction: "ca/on/hamilton",
    output: { "city_development_snapshot_v0.1.json": hash(snapshot) },
  }));

  const release = copyDevelopmentRelease({ sourceDir: source, outputDir: output });
  const packageDir = path.join(output, release.path);
  const publishedRecords = JSON.parse(fs.readFileSync(path.join(packageDir, "viewer_development_records_v0.1.json"), "utf8"));
  assert.deepEqual(publishedRecords.records[0].source_reported_names, record.source_reported_names);
  assert.deepEqual(publishedRecords.records[0].source_evidence_ref, {
    source_page: 1,
    source_record_id: "source-1",
  });
  assert.deepEqual(fs.readdirSync(packageDir).sort(), [
    "city_development_snapshot_v0.1.json",
    "development_release_manifest.json",
    "parcel_development_indicators_v0.1.json",
    "viewer_development_records_v0.1.json",
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
  assert.deepEqual(await loader.pin(), { ok: true, recordCount: 1, focusCount: 1 });
  const all = await loader.allRecords();
  assert.equal(all.records.length, 1);
  const linked = await loader.forParcel("parcel-1");
  assert.equal(linked.count, 1);
  assert.equal(linked.records[0].development_record_id, "development-1");
  const city = await loader.citySnapshot();
  assert.equal(city.snapshot.jurisdiction, "ca/on/hamilton");
});
