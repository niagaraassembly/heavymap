#!/usr/bin/env node
/* Writes labels/index.json: every labels/<domain>.<locale>.json with its SHA-256.
 * Run after editing any label file:  node build/labels-index.mjs  (add --check to verify only). */
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const LABELS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../labels");

export function buildIndex(dir = LABELS_DIR) {
  const files = fs
    .readdirSync(dir)
    .filter((n) => /^[a-z]+\.[a-z]{2}\.json$/.test(n))
    .sort()
    .map((n) => {
      const [domain, locale] = n.split(".");
      return { path: n, domain, locale, sha256: createHash("sha256").update(fs.readFileSync(path.join(dir, n))).digest("hex") };
    });
  return { schema: 1, files };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const next = JSON.stringify(buildIndex(), null, 1) + "\n";
  const file = path.join(LABELS_DIR, "index.json");
  if (process.argv.includes("--check")) {
    const same = fs.existsSync(file) && fs.readFileSync(file, "utf8") === next;
    if (!same) { console.error("labels/index.json is out of date: run node build/labels-index.mjs"); process.exit(1); }
  } else fs.writeFileSync(file, next);
}
