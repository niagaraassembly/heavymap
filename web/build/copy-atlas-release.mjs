/* Copy one immutable Industrial Atlas release into the Pages artifact after
 * checking the release index and every listed file. */

import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const walkFiles = (dir, prefix = "") =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    const full = path.join(dir, entry.name);
    if (entry.isSymbolicLink())
      throw new Error(`Industrial Atlas release contains a symlink: ${rel}`);
    return entry.isDirectory() ? walkFiles(full, rel) : [rel];
  });

export function copyAtlasRelease({ sourceDir, outputDir }) {
  const source = path.resolve(sourceDir);
  const manifestBytes = fs.readFileSync(path.join(source, "manifest.json"));
  const filesBytes = fs.readFileSync(path.join(source, "files.json"));
  const manifest = JSON.parse(manifestBytes.toString("utf8"));
  const filesIndex = JSON.parse(filesBytes.toString("utf8"));

  if (manifest.schema !== 2 || filesIndex.schema !== 2)
    throw new Error("Industrial Atlas release must use dossier schema 2");
  if (sha256(filesBytes) !== manifest.files_sha256)
    throw new Error("Industrial Atlas files.json hash does not match manifest");
  if (!/^[a-z0-9-]+$/.test(manifest.release?.unit ?? ""))
    throw new Error("Industrial Atlas release unit is invalid");
  if (!/^\d{4}-\d{2}-\d{2}-d\d{3}$/.test(manifest.release?.id ?? ""))
    throw new Error("Industrial Atlas release id is invalid");
  if (!Array.isArray(filesIndex.files) || filesIndex.files.length !== manifest.file_count)
    throw new Error("Industrial Atlas release file count does not match manifest");

  const seen = new Set();
  const expectedRootFiles = new Set(["manifest.json", "files.json"]);
  for (const entry of filesIndex.files) {
    if (
      !entry ||
      typeof entry.path !== "string" ||
      !/^[A-Za-z0-9._/-]+$/.test(entry.path) ||
      path.posix.isAbsolute(entry.path) ||
      entry.path.split("/").some((part) => !part || part === "." || part === "..") ||
      !Number.isSafeInteger(entry.bytes) ||
      !/^[a-f0-9]{64}$/.test(entry.sha256) ||
      seen.has(entry.path)
    )
      throw new Error("Industrial Atlas files.json contains an invalid or duplicate entry");
    seen.add(entry.path);
    const file = path.join(source, ...entry.path.split("/"));
    const bytes = fs.readFileSync(file);
    if (bytes.length !== entry.bytes || sha256(bytes) !== entry.sha256)
      throw new Error(`Industrial Atlas release file failed verification: ${entry.path}`);
  }
  const actualFiles = new Set(walkFiles(source));
  for (const name of [...expectedRootFiles, ...seen]) {
    if (!actualFiles.has(name))
      throw new Error(`Industrial Atlas release file is missing: ${name}`);
    actualFiles.delete(name);
  }
  if (actualFiles.size)
    throw new Error(`Industrial Atlas release contains unindexed files: ${[...actualFiles].join(", ")}`);

  const releasePath = path.posix.join(
    "map/data",
    manifest.release.unit,
    manifest.release.id,
  );
  const destination = path.join(outputDir, ...releasePath.split("/"));
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.cpSync(source, destination, { recursive: true, errorOnExist: true });
  return {
    unit: manifest.release.unit,
    id: manifest.release.id,
    path: releasePath,
    files: filesIndex.files.length,
    files_sha256: manifest.files_sha256,
  };
}
