/* Loads the Journey's local records (journey/ at the repo root) for the prerender:
 * the section base pages (collections.json) and, from the local copies of each base page,
 * the entries to show when Telegraph cannot be reached or JavaScript is off (D-091). */

import fs from "node:fs";
import path from "node:path";
import { parseIndex } from "../src/journey/telegraph.js";

export function loadJourney(dir) {
  const read = (p) => {
    try { return JSON.parse(fs.readFileSync(path.join(dir, p), "utf8")); } catch { return null; }
  };
  const collections = read("collections.json") ?? {};
  const fallback = {};
  for (const [key, c] of Object.entries(collections)) {
    if (key === "journey") continue;
    const page = read(path.join("pages", c.path, "page.json"));
    fallback[key] = page ? parseIndex(page.content).entries : [];
  }
  return { collections, fallback };
}
