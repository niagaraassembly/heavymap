---
type: system
status: in use
evidence_date: 2026-11-16
---
Versioned data releases you can verify
systems, industrial-atlas, releases, building

> Status: in use. Every Industrial Atlas release is a fixed set of files with a hash for each one. It never changes after it is published.

## What a release holds
- **A manifest**, read first: the release name, counts, contract versions and the hash of the file list.
- **A file list** with the path, size and SHA-256 hash of every other file.
- **Records per parcel**, split into 1,024 small files by the last two characters of the parcel key, with fuller detail loaded on demand.
- **Provenance** for every source.

## Verifying one
1. Read the manifest. Hash the file list and compare.
2. For any file you use, compare its size and hash with the list.
3. A record's hash is the hash of its canonical JSON.

## Never edit, always add
A new source version or a new build is a new release, never an edit. The site points at one release by its full commit. If a check fails at build time, the previous release stays in place.

## The first ones
The first Hamilton release went out on 16 November, followed by map layer sets and three small development releases on 17 November. The first full Hamilton candidate weighed about 222 MiB, almost all of it parcel records, before anything was trimmed for the browser.
