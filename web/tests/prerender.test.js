import test from "node:test";
import assert from "node:assert/strict";
import {
  brokenLinks,
  fileFor,
  renderSite,
  STATIC_DIRS,
} from "../build/prerender.mjs";

const pages = renderSite();
const byPath = new Map(pages.map((p) => [p.path, p]));

test("every URL in spec A's table is generated, one file per URL", () => {
  for (const path of [
    "/",
    "/desks/",
    "/desks/western-new-york/",
    "/desks/niagara-brant/",
    "/editions/western-new-york/issue-one/",
    "/reader/",
    "/map/",
    "/subscribe/",
    "/preferences/",
    "/about/",
    "/about/credits/",
    "/404.html",
  ]) {
    assert.ok(byPath.has(path), `missing ${path}`);
  }
  for (let n = 1; n <= 10; n++)
    assert.ok(byPath.has(`/read/IEVT-2026-${String(n).padStart(6, "0")}/`));
  assert.equal(fileFor("/"), "index.html");
  assert.equal(fileFor("/read/x/"), "read/x/index.html");
  assert.equal(fileFor("/404.html"), "404.html");
});

test("no map workspace page is generated while Hamilton is preparing", () => {
  assert.ok(!pages.some((p) => p.path.startsWith("/map/hamilton")));
});

test("the edition reproduces all ten original cards and every panel", () => {
  const html = byPath.get("/editions/western-new-york/issue-one/").html;
  assert.equal(
    (html.match(/<li class="issue-list__item wny-item" id="wny-/g) ?? [])
      .length,
    10,
  );
  for (const panel of [
    "coming",
    "money",
    "jobs",
    "support",
    "mentions",
    "districts",
  ])
    assert.match(html, new RegExp(`data-wny="${panel}"`));
  assert.match(html, /href="\/read\/IEVT-2026-000009\/"/);
  assert.doesNotMatch(html, /Green: completed|Yellow: announced/);
});

test("the link check catches a link to a page that isn't generated", () => {
  const fake = [
    { path: "/", html: '<a href="/desks/">x</a><a href="/nowhere/">y</a>' },
    { path: "/desks/", html: "" },
  ];
  assert.deepEqual(brokenLinks(fake), ["/ -> /nowhere/"]);
});

test("only the editorial photos ship as static files, never prototype fixtures", () => {
  assert.deepEqual(STATIC_DIRS, ["editorial", "map", "flags"]);
  assert.ok(!pages.some((p) => /pmtiles|synthetic/i.test(p.html)));
});
