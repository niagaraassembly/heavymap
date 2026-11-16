import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { canonicalString, recordHash, CanonicalError } from "../src/canonical.js";

const { vectors } = JSON.parse(
  fs.readFileSync(fileURLToPath(new URL("../../tests/canonical-vectors.json", import.meta.url)), "utf8"),
);

test("every vector reproduces its canonical string and hash", async () => {
  assert.ok(vectors.length > 30);
  for (const v of vectors) {
    const value = JSON.parse(v.input_json);
    assert.equal(canonicalString(value), v.canonical, v.input_json);
    assert.equal(await recordHash(value), v.sha256, v.input_json);
  }
});

test("key order of the input does not matter", () => {
  assert.equal(canonicalString({ b: 1, a: 2 }), canonicalString({ a: 2, b: 1 }));
});

test("keys sort by code point, not UTF-16 unit", () => {
  assert.equal(canonicalString({ "\u{1F600}": 1, "￿": 2 }), '{"￿":2,"\u{1F600}":1}');
});

test("refuses NaN, infinity and unsupported types", () => {
  for (const bad of [NaN, Infinity, undefined, () => 1, 10n]) {
    assert.throws(() => canonicalString(bad), CanonicalError);
  }
});
