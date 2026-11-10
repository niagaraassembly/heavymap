#!/usr/bin/env node
/* Writes content/manifest.json: every content file with its kind and SHA-256,
 * in the shape the future MAKE/Publish export will take (spec B section 7.1).
 * Run after any hand edit to content/ or a new snapshot. */

import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
export const CONTENT_DIR = path.join(root, "content");

/** Which kind a content file is, from its path; null for files the manifest skips. */
export function kindOf(rel) {
  if (rel === "manifest.json") return null;
  if (rel === "SNAPSHOT.json") return "snapshot";
  if (rel === "regions.json") return "regions";
  if (rel === "themes.json") return "themes";
  if (rel === "vocab/controlled-values.json") return "vocab";
  if (rel === "vocab/labels.json") return "labels";
  if (/^items\/[^/]+\.json$/.test(rel)) return "item";
  if (/^editions\/[^/]+\/[^/]+\.json$/.test(rel)) return "edition";
  throw new Error(`content/${rel}: no manifest kind for this path`);
}

function walk(dir, base = dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    return e.isDirectory()
      ? walk(full, base)
      : [path.relative(base, full).split(path.sep).join("/")];
  });
}

export function buildManifest(dir = CONTENT_DIR) {
  const records = walk(dir)
    .filter((rel) => !rel.startsWith(".") && rel.endsWith(".json"))
    .map((rel) => ({ rel, kind: kindOf(rel) }))
    .filter((r) => r.kind)
    .sort((a, b) => a.rel.localeCompare(b.rel))
    .map(({ rel, kind }) => ({
      kind,
      path: rel,
      sha256: createHash("sha256")
        .update(fs.readFileSync(path.join(dir, rel)))
        .digest("hex"),
    }));
  return { schema: 1, records };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const manifest = buildManifest();
  fs.writeFileSync(
    path.join(CONTENT_DIR, "manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n",
  );
  console.log(`manifest: ${manifest.records.length} records`);
}
