import test from "node:test";
import assert from "node:assert/strict";
import { WORKSPACE_TABS } from "../src/parcel-workspace.js";

/* The tab bar is the one place the workspace says what works: exactly one
 * working tab, five greyed-out ones. Rendering (disabled, inert, no
 * "coming" text) is asserted by scripts/check-parcel-workspace.mjs in a
 * real browser, where the DOM exists. */

test("the work area has six tabs and only Notes works", () => {
  assert.equal(WORKSPACE_TABS.length, 6);
  assert.deepEqual(
    WORKSPACE_TABS.map((t) => t.id),
    ["notes", "checklist", "lists", "export", "docs", "history"],
  );
  assert.deepEqual(
    WORKSPACE_TABS.filter((t) => t.works).map((t) => t.id),
    ["notes"],
  );
  assert.deepEqual(
    WORKSPACE_TABS.filter((t) => !t.works).map((t) => t.id),
    ["checklist", "lists", "export", "docs", "history"],
  );
  for (const tab of WORKSPACE_TABS) {
    assert.equal(typeof tab.labelKey, "string");
    assert.ok(tab.labelKey.startsWith("parcel.workspace.tab."));
  }
});
