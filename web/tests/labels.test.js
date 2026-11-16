import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { LABELS_DIR, buildIndex } from "../build/labels-index.mjs";
import { createLabels, loadLabels } from "../src/labels.js";

const fromDir = (dir) => async (url) => new Uint8Array(fs.readFileSync(path.join(dir, url.replace(/^labels\//, ""))));
const E = (text, status = "approved") => ({ text, status });

test("lookup fills params, picks plural forms, and reports a missing parameter", () => {
  const reports = [];
  const l = createLabels({
    entries: { en: { a: E({ one: "{n} item", other: "{n} items" }), b: E("hello {who}") } },
    onReport: (r) => reports.push(r),
  });
  assert.equal(l.t("a", { n: 1 }), "1 item");
  assert.equal(l.t("a", { n: 2 }), "2 items");
  assert.equal(l.t("b", {}), "hello {who}");
  assert.equal(reports[0].kind, "label_param_missing");
});

test("a missing key shows the key and is reported", () => {
  const reports = [];
  const l = createLabels({ entries: { en: {} }, onReport: (r) => reports.push(r) });
  assert.deepEqual(l.lookup("x.y"), { text: "x.y", fallback: false, missing: true });
  assert.equal(reports[0].kind, "label_missing");
});

test("a locale entry is used only when reviewed or approved; otherwise English, marked as fallback", () => {
  const entries = { en: { k: E("English", "draft") }, fr: { k: E("Français", "draft") } };
  const l = createLabels({ entries, locale: "fr" });
  assert.deepEqual(l.lookup("k"), { text: "English", fallback: true, missing: false });
  entries.fr.k.status = "reviewed";
  assert.equal(l.lookup("k").text, "Français");
  assert.equal(l.lookup("k").fallback, false);
});

test("loadLabels verifies every file against labels/index.json", async () => {
  const labels = await loadLabels({ fetchBytes: fromDir(LABELS_DIR) });
  assert.equal(labels.t("states.coverage.not_covered"), "Not covered by NPCA roll data (provisional)");
  assert.equal(labels.t("states.coverage.has_arn", { n: 2 }), "NPCA roll data: 2 roll numbers");
});

test("a tampered label file is refused and reported, other files still load", async () => {
  const reports = [];
  const base = fromDir(LABELS_DIR);
  const labels = await loadLabels({
    fetchBytes: async (u) => {
      const b = await base(u);
      return u.endsWith("states.en.json") ? new TextEncoder().encode(new TextDecoder().decode(b) + " ") : b;
    },
    onReport: (r) => reports.push(r),
  });
  assert.equal(reports[0].kind, "labels_file_unavailable");
  assert.equal(labels.has("states.coverage.not_covered"), false);
  assert.equal(labels.has("layers.LYR-HAM-ZONING.name"), true);
});

test("the committed index is current", () => {
  const onDisk = JSON.parse(fs.readFileSync(path.join(LABELS_DIR, "index.json"), "utf8"));
  assert.deepEqual(onDisk, buildIndex());
});

test("every entry has text, a status and no empty wording", () => {
  for (const f of buildIndex().files) {
    const doc = JSON.parse(fs.readFileSync(path.join(LABELS_DIR, f.path), "utf8"));
    for (const [k, e] of Object.entries(doc.entries)) {
      const texts = typeof e.text === "object" ? Object.values(e.text) : [e.text];
      assert.ok(texts.length && texts.every((t) => typeof t === "string" && t.trim()), k);
      assert.ok(["draft", "reviewed", "approved"].includes(e.status), k);
    }
  }
});
