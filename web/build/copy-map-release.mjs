/* Copy the separately versioned Hamilton map layer artifact after verifying
 * every published byte against its file index. */
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const filesUnder = (dir, prefix = "") => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
  const full = path.join(dir, entry.name);
  if (entry.isSymbolicLink()) throw new Error(`Map layer release contains a symlink: ${rel}`);
  return entry.isDirectory() ? filesUnder(full, rel) : [rel];
});

export function copyMapRelease({ sourceDir, outputDir }) {
  const source = path.resolve(sourceDir);
  const manifest = JSON.parse(fs.readFileSync(path.join(source, "manifest.json"), "utf8"));
  const indexBytes = fs.readFileSync(path.join(source, "files.json"));
  const index = JSON.parse(indexBytes.toString("utf8"));
  if (manifest.schema !== 1 || index.schema !== 1 || !Array.isArray(index.files))
    throw new Error("Map layer release schema is invalid");
  if (!/^[a-z0-9-]+$/.test(manifest.release?.unit ?? "") || !/^[a-z0-9-]+$/.test(manifest.release?.id ?? ""))
    throw new Error("Map layer release identity is invalid");
  const listed = new Set();
  for (const entry of index.files) {
    if (!entry || typeof entry.path !== "string" || !/^[A-Za-z0-9._/-]+$/.test(entry.path) ||
      path.posix.isAbsolute(entry.path) || entry.path.split("/").some((part) => !part || part === "." || part === "..") ||
      !Number.isSafeInteger(entry.bytes) || !/^[a-f0-9]{64}$/.test(entry.sha256) || listed.has(entry.path))
      throw new Error("Map layer files.json contains an invalid or duplicate entry");
    const bytes = fs.readFileSync(path.join(source, ...entry.path.split("/")));
    if (bytes.length !== entry.bytes || sha256(bytes) !== entry.sha256)
      throw new Error(`Map layer release file failed verification: ${entry.path}`);
    if (entry.path.endsWith(".pmtiles") && entry.bytes > 100_000_000)
      throw new Error(`Map layer PMTiles exceeds the 100 MB budget: ${entry.path}`);
    listed.add(entry.path);
  }
  const actual = new Set(filesUnder(source));
  for (const name of new Set(["manifest.json", "files.json", ...listed])) {
    if (!actual.has(name)) throw new Error(`Map layer release file is missing: ${name}`);
    actual.delete(name);
  }
  if (actual.size) throw new Error(`Map layer release contains unindexed files: ${[...actual].join(", ")}`);
  const root = path.posix.join("map/layers", manifest.release.unit, manifest.release.id);
  const dest = path.join(outputDir, ...root.split("/"));
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.cpSync(source, dest, { recursive: true, errorOnExist: true });
  return { manifest, path: root };
}
