import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  budgetReport,
  contrast,
  contrastProblems,
  launchProblems,
  mapProblems,
  publicHygiene,
  tokenBlocks,
} from "../build/checks.mjs";

const tmp = (files) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "hm-out-"));
  for (const [f, body] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(dir, f)), { recursive: true });
    fs.writeFileSync(path.join(dir, f), body);
  }
  return dir;
};

test("contrast matches WCAG: ink on paper is 10.11:1, rust on paper 4.51:1 (spec D section 2.1)", () => {
  assert.equal(contrast("#253f49", "#f5f4ee").toFixed(2), "10.11");
  assert.equal(contrast("#ae573b", "#f5f4ee").toFixed(2), "4.51");
});

test("token blocks are read per selector, comments ignored", () => {
  const b = tokenBlocks(
    ':root { --text: #111111; /* --x: #fff; */ }\n:root[data-mode="dark"] { --text: #eeeeee; }',
  );
  assert.deepEqual(b[":root"], { "--text": "#111111" });
  assert.equal(b[':root[data-mode="dark"]']["--text"], "#eeeeee");
});

test("a low-contrast text token fails, through var() aliases; UI tokens need only 3:1", () => {
  const vars = {
    "--surface": "#ffffff",
    "--surface-tint": "#ffffff",
    "--surface-raised": "#ffffff",
    "--text": "#999999",
    "--text-muted": "var(--text)",
    "--focus-ring": "#949494",
  };
  const p = contrastProblems([{ name: "t/light", vars }]);
  assert.ok(p.some((x) => x.startsWith("t/light: --text on --surface")));
  assert.ok(p.some((x) => x.startsWith("t/light: --text-muted on")));
  assert.ok(
    !p.some((x) => x.includes("--focus-ring")),
    "#949494 on white is 3.03:1, enough for UI",
  );
});

test("map introduction: Atlas identifiers and unpublished workspace pages fail (spec F 7.4)", () => {
  const dir = tmp({
    "map/index.html": "<p>hm:ca:on:hamilton:parcel:01X</p>",
    "map/hamilton/index.html": "x",
  });
  const p = mapProblems(dir, [
    {
      geographies: [
        {
          slug: "hamilton",
          name: "City of Hamilton",
          map: { status: "preparing" },
        },
      ],
    },
  ]);
  assert.equal(p.length, 2);
});

test("public builds reject tiles, preview banners and design themes", () => {
  const dir = tmp({
    "x.pmtiles": "",
    "index.html": "Preview · not public",
    "assets/a.css": ':root[data-theme="ca"]{}',
  });
  const p = publicHygiene(dir, { preview: false });
  assert.equal(p.length, 3);
  assert.equal(
    publicHygiene(tmp({ "index.html": "Preview · not public" }), {
      preview: true,
    }).length,
    0,
  );
});

test("budgets measure the embedded catalogue and the code, compressed", () => {
  const big = JSON.stringify({
    x: Array.from({ length: 40000 }, (_, i) => `item-${i}-${Math.random()}`),
  });
  const dir = tmp({
    "index.html": `<script type="application/json" id="hm-catalogue">${big}</script>`,
    "assets/a.js": "x",
  });
  const r = budgetReport(dir);
  assert.ok(r.problems.some((x) => x.startsWith("start-up data")));
});

test("launch gates: every theme published and the signup form configured (decision 36, spec E)", () => {
  const themes = {
    themes: [
      { id: "us", status: "published" },
      { id: "ca", status: "design" },
    ],
  };
  assert.equal(
    launchProblems({ themes, signup: { action: null, entries: {} } }).length,
    2,
  );
  assert.equal(
    launchProblems({
      themes: { themes: [{ id: "us", status: "published" }] },
      signup: { action: "https://x", entries: { a: "entry.1" } },
    }).length,
    0,
  );
});
