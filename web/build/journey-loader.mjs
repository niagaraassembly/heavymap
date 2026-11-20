/* Loads the Journey's local records (journey/ at the repo root) for the prerender:
 * the section base pages (collections.json), the entries to show when Telegraph cannot be
 * reached or JavaScript is off, and the landing page's features and running city runs (D-091). */

import fs from "node:fs";
import path from "node:path";
import { parseIndex, parsePost, nodeText } from "../src/journey/telegraph.js";

/** Minimal RFC 4180 reader (quoted fields, doubled quotes, newlines inside quotes). */
export function parseCsv(text) {
  const rows = [];
  let row = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (ch !== "\r") field += ch;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const [head, ...body] = rows;
  return body.filter((r) => r.length > 1).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ""])));
}

export function loadJourney(dir) {
  const read = (p) => {
    try { return JSON.parse(fs.readFileSync(path.join(dir, p), "utf8")); } catch { return null; }
  };
  const collections = read("collections.json") ?? {};
  let register = [];
  try { register = parseCsv(fs.readFileSync(path.join(dir, "register.csv"), "utf8")); } catch { /* none yet */ }
  const fallback = {};
  for (const [key, c] of Object.entries(collections)) {
    if (key === "journey") continue;
    const page = read(path.join("pages", c.path, "page.json"));
    fallback[key] = page ? parseIndex(page.content).entries : [];
  }
  // Posts by path, with what a feature card needs.
  const posts = new Map();
  for (const r of register.filter((x) => x.kind === "post" && x.status !== "wiped")) {
    const page = read(path.join("pages", r.telegraph_path, "page.json"));
    const parsed = page ? parsePost(page.content) : null;
    posts.set(r.telegraph_path, {
      path: r.telegraph_path,
      title: r.title,
      site: r.site_path,
      section: r.section,
      type: parsed?.colophon.type || r.type,
      run: r.run_id,
      stage: r.stage || parsed?.colophon.stage || "",
      minutes: Number(r.read_minutes) || 0,
      created: r.created_at,
      excerpt: parsed?.intro ? nodeText(parsed.intro).trim() : "",
    });
  }
  // The home page rolls forward automatically: newest registered posts enter and
  // older posts leave. The collections.journey.featured list is reserved for a
  // future pinning control and does not affect this recent-article row.
  const recent = [...posts.values()]
    .sort((a, b) => (b.created || "").localeCompare(a.created || "") || a.title.localeCompare(b.title))
    .slice(0, 6);
  // Runs: every run with a working-papers or field-notes collection; latest stage reached.
  const runs = (collections.journey?.runs ?? []).map((run) => {
    const done = [...posts.values()].filter((p) => p.run === run.id && p.stage).map((p) => p.stage).sort();
    return { ...run, stage: run.stage || done.at(-1) || "A" };
  });
  const counts = { posts: posts.size, sections: 3, collections: Object.values(collections).filter((c) => c.parent).length };
  return { collections, fallback, recent, runs, counts };
}
