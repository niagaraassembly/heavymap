import test from "node:test";
import assert from "node:assert/strict";
import {
  headScript,
  pickTheme,
  resetTheme,
  resolveTheme,
  setMode,
} from "../src/site/theme.js";

const us = {
  id: "us",
  country: "US",
  name: "United States",
  modes: ["light", "dark"],
};
const ca = { id: "ca", country: "CA", name: "Canada", modes: ["light"] };
const jp = { id: "jp", country: "JP", name: "Japan", modes: ["light"] };
const all = [us, ca, jp];
const r = (stored, langs, dark = false, themes = all) =>
  resolveTheme(stored, langs, dark, themes, "us");

test("precedence: explicit choice, then a region subtag, then USA (spec D section 6)", () => {
  assert.deepEqual(r({ version: 1, choice: "jp" }, ["en-CA"]), {
    theme: "jp",
    mode: "light",
    source: "choice",
  });
  assert.equal(r(null, ["fr-CA", "en-US"]).theme, "ca");
  assert.equal(r(null, ["en-GB", "ja-JP"]).theme, "jp");
  assert.deepEqual(r(null, ["en-GB"]), {
    theme: "us",
    mode: "light",
    source: "default",
  });
});

test("a bare language is not a hint (decision 34)", () => {
  assert.equal(r(null, ["ja"]).source, "default");
  assert.equal(r(null, ["zh-Hant-TW"]).source, "default");
});

test("a theme missing from this build is ignored, whether chosen or hinted", () => {
  assert.equal(
    r({ version: 1, choice: "ca" }, ["en-CA"], false, [us]).theme,
    "us",
  );
});

test("mode follows the device unless set; dark only where the theme has it (decisions 32, 38, 39)", () => {
  assert.equal(r(null, [], true).mode, "dark");
  assert.equal(
    r({ version: 1, choice: "us", mode: "light" }, [], true).mode,
    "light",
  );
  assert.equal(r({ version: 1, choice: "ca", mode: "dark" }, []).mode, "light");
  assert.equal(r({ version: 1, choice: "us", mode: "dark" }, []).mode, "dark");
});

test("recent keeps two distinct explicit picks, newest first (decision 5)", () => {
  let s = pickTheme(null, "ca");
  s = pickTheme(s, "jp");
  s = pickTheme(s, "ca");
  assert.deepEqual(s.recent, ["ca", "jp"]);
  s = pickTheme(s, "us");
  assert.deepEqual(s.recent, ["us", "ca"]);
});

test("reset clears the choice but keeps recent and mode; mode survives theme picks", () => {
  const s = setMode(pickTheme(null, "jp"), "dark");
  assert.deepEqual(resetTheme(s), {
    version: 1,
    choice: null,
    recent: ["jp"],
    mode: "dark",
  });
  assert.equal(pickTheme(s, "us").mode, "dark");
});

test("the inline head script is self-contained and sets both attributes", () => {
  const html = headScript([us], "us");
  assert.match(html, /^<script>\(function\(\)\{/);
  assert.match(html, /data-theme/);
  assert.match(html, /data-mode/);
  assert.doesNotMatch(html, /import|export/);
});
