import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildManifest } from "../build/content-manifest.mjs";
import { ContentError, loadContent } from "../build/content-loader.mjs";

const CONTENT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../content",
);
const ITEM = "items/IEVT-2026-000001.json";

/** A scratch copy of content/ with `edit(dir)` applied and the manifest rebuilt. */
function variant(edit, { rehash = true } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "hm-content-"));
  fs.cpSync(CONTENT, dir, { recursive: true });
  edit(dir);
  if (rehash)
    fs.writeFileSync(
      path.join(dir, "manifest.json"),
      JSON.stringify(buildManifest(dir)),
    );
  return dir;
}
const patchJson = (dir, rel, fn) => {
  const file = path.join(dir, rel);
  fs.writeFileSync(
    file,
    JSON.stringify(fn(JSON.parse(fs.readFileSync(file, "utf8")))),
  );
};
const problemsOf = (dir) => {
  try {
    loadContent(dir);
  } catch (e) {
    if (e instanceof ContentError) return e.problems;
    throw e;
  }
  return [];
};

test("the committed snapshot loads: Issue One complete with all ten items", () => {
  const c = loadContent(CONTENT);
  const ed = c.editions.get("western-new-york/issue-one");
  assert.equal(ed.items.length, 10);
  assert.ok(c.items.has("IEVT-2026-000009"));
  assert.equal(ed.complete, true);
});

test("an edit without a manifest rebuild fails on the hash", () => {
  const dir = variant(
    (d) => patchJson(d, ITEM, (it) => ({ ...it, title: "Edited" })),
    { rehash: false },
  );
  assert.match(problemsOf(dir).join("\n"), /hash does not match/);
});

test("values outside the MAKE vocabulary fail, with the item and field named", () => {
  const dir = variant((d) =>
    patchJson(d, ITEM, (it) => ({
      ...it,
      stage: "rumoured",
      flags: [{ type: "maybe" }],
    })),
  );
  const p = problemsOf(dir).join("\n");
  assert.match(p, /IEVT-2026-000001 stage: "rumoured" is not in MAKE/);
  assert.match(p, /IEVT-2026-000001 flags: "maybe" is not in MAKE/);
});

test("lane excluded never loads", () => {
  const dir = variant((d) =>
    patchJson(d, ITEM, (it) => ({ ...it, lane: "excluded" })),
  );
  assert.match(
    problemsOf(dir).join("\n"),
    /excluded never reaches public pages/,
  );
});

test("a preview item in a published edition fails; preview items are hidden from public loads", () => {
  const dir = variant((d) =>
    patchJson(d, ITEM, (it) => ({ ...it, status: "preview" })),
  );
  assert.match(problemsOf(dir).join("\n"), /is preview in a published edition/);
});

test("a mention pointing outside its edition fails", () => {
  const dir = variant((d) =>
    patchJson(d, "editions/western-new-york/issue-one.json", (ed) => ({
      ...ed,
      mentions: [{ name: "X", events: ["IEVT-2099-000001"], sources: [] }],
    })),
  );
  assert.match(problemsOf(dir).join("\n"), /points outside the edition/);
});
