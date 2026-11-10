import { test } from "node:test";
import assert from "node:assert/strict";
import {
  freshState,
  loadState,
  saveState,
  filterItems,
  STORAGE_KEY,
} from "../src/editorial/reader-state.js";
import { catalogue } from "../src/editorial/reader-catalog.js";
const sample = [
  {
    id: "a",
    kind: "news",
    region: "western-new-york",
    title: "Factory expansion",
    summary: "New investment",
    publication: "Western New York",
  },
  {
    id: "b",
    kind: "documentation",
    region: "heavymap",
    title: "Reading sources",
    summary: "A method guide",
    publication: "HeavyMap",
  },
];
test("Reader catalogue admits only Desk and HeavyMap material, with news and preview guides distinguished", () => {
  assert.ok(catalogue.every((i) => ["desks", "heavymap"].includes(i.scope)));
  assert.equal(catalogue.filter((i) => i.kind === "news").length, 9);
  assert.ok(
    catalogue
      .filter((i) => i.kind === "documentation")
      .every((i) => i.status === "preview"),
  );
  assert.equal(new Set(catalogue.map((i) => i.id)).size, catalogue.length);
});
test("stored state is constrained to known entries, bounded progress and valid filters", () => {
  const storage = {
    getItem: () =>
      JSON.stringify({
        version: 1,
        current: "not-in-catalogue",
        read: ["a", "foreign", "a"],
        progress: { a: 4, b: -2, foreign: 0.9 },
        filters: {
          kind: "invented",
          region: "foreign",
          query: "x".repeat(200),
          unreadOnly: "yes",
        },
      }),
  };
  const state = loadState(storage, sample);
  assert.equal(state.current, null);
  assert.deepEqual(state.read, ["a"]);
  assert.deepEqual(state.progress, { a: 1, b: 0 });
  assert.equal(state.filters.kind, "news");
  assert.equal(state.filters.region, "all");
  assert.equal(state.filters.query.length, 120);
  assert.equal(state.filters.unreadOnly, false);
});
test("storage failure falls back without losing the current reading session", () => {
  assert.deepEqual(
    loadState(
      {
        getItem() {
          throw Error("blocked");
        },
      },
      sample,
    ),
    freshState(),
  );
  assert.equal(
    saveState(
      {
        setItem() {
          throw Error("quota");
        },
      },
      freshState(),
    ),
    false,
  );
  const written = [];
  assert.equal(
    saveState(
      { setItem: (key, value) => written.push([key, value]) },
      freshState(),
    ),
    true,
  );
  assert.equal(written[0][0], STORAGE_KEY);
});
test("material, region, search and unread filters compose without importing other publications", () => {
  const state = freshState();
  assert.deepEqual(
    filterItems(sample, state).map((i) => i.id),
    ["a"],
  );
  state.filters.kind = "all";
  state.filters.query = "sources";
  assert.deepEqual(
    filterItems(sample, state).map((i) => i.id),
    ["b"],
  );
  state.filters.region = "western-new-york";
  assert.equal(filterItems(sample, state).length, 0);
  state.filters.query = "";
  state.read = ["a"];
  state.filters.unreadOnly = true;
  assert.equal(filterItems(sample, state).length, 0);
});
