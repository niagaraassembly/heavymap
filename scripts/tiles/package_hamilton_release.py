#!/usr/bin/env python3
"""Add verified D-070 parcel tiles to one schema 2 Hamilton release directory."""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import os
import re
import shutil
import subprocess
from pathlib import Path
from typing import Any


KEY_PATTERN = re.compile(r"^ia:ca:on:hamilton:parcel:[0-9A-HJKMNP-TV-Z]{26}$")
SOURCE_REF = "LYR-HAM-PARCEL"


def dump(value: Any) -> bytes:
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"), sort_keys=False).encode("utf-8")


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def run_json(command: list[str]) -> dict[str, Any]:
    return json.loads(subprocess.check_output(command, text=True))


def ndjson_keys(path: Path) -> set[str]:
    keys: set[str] = set()
    with path.open(encoding="utf-8") as stream:
        for line in stream:
            feature = json.loads(line)
            props = feature.get("properties")
            key = props.get("key") if isinstance(props, dict) else None
            if set(props or {}) != {"key"} or not isinstance(key, str) or not KEY_PATTERN.fullmatch(key):
                raise ValueError("parcel tile input contains a non-key property or invalid parcel key")
            if key in keys:
                raise ValueError("parcel tile input contains a duplicate parcel key")
            keys.add(key)
    return keys


def release_keys(root: Path) -> set[str]:
    found: set[str] = set()
    for path in sorted((root / "shards").glob("*.json")):
        payload = json.loads(path.read_text(encoding="utf-8"))
        records = payload.get("records")
        if not isinstance(records, dict):
            raise ValueError("schema 2 shard is missing its records object")
        found.update(records)
    return found


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--release-dir", type=Path, required=True)
    parser.add_argument("--pmtiles", type=Path, required=True)
    parser.add_argument("--source-ndjson", type=Path, required=True)
    parser.add_argument("--registry-run", required=True)
    parser.add_argument("--pmtiles-command", default=os.environ.get("PMTILES", "pmtiles"))
    args = parser.parse_args()

    root = args.release_dir
    manifest_path = root / "manifest.json"
    files_path = root / "files.json"
    if not manifest_path.is_file() or not files_path.is_file():
        raise FileNotFoundError("release directory must be a completed schema 2 dossier build")
    if not args.pmtiles.is_file() or not args.source_ndjson.is_file():
        raise FileNotFoundError("PMTiles or its checked key-only source input is missing")

    pmtiles = args.pmtiles_command
    subprocess.run([pmtiles, "verify", str(args.pmtiles)], check=True, stdout=subprocess.DEVNULL)
    header = run_json([pmtiles, "show", "--header-json", str(args.pmtiles)])
    metadata = run_json([pmtiles, "show", "--metadata", str(args.pmtiles)])
    tile_layers = metadata.get("vector_layers", [])
    if header.get("tile_type") != "mvt" or (header.get("minzoom"), header.get("maxzoom")) != (14, 16):
        raise ValueError("PMTiles header does not match D-070's vector and zoom contract")
    if len(tile_layers) != 1 or tile_layers[0].get("id") != "parcels":
        raise ValueError("PMTiles must contain exactly the parcels vector layer")
    fields = tile_layers[0].get("fields", {})
    if set(fields) != {"key"}:
        raise ValueError("PMTiles layer properties are not key-only")
    if fields.get("key") != "String":
        raise ValueError("PMTiles parcel key must be encoded as a string")

    source_keys = ndjson_keys(args.source_ndjson)
    dossier_manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    dossier_ids = release_keys(root)
    if source_keys != dossier_ids:
        raise ValueError("parcel tile keys and schema 2 dossier keys differ")
    expected_count = dossier_manifest.get("counts", {}).get("records")
    stats = metadata.get("tilestats", {}).get("layers", [])
    tile_count = stats[0].get("count") if len(stats) == 1 else None
    if tile_count is not None and tile_count != len(source_keys):
        raise ValueError("PMTiles feature count does not match the checked parcel input")
    if expected_count != len(source_keys):
        raise ValueError("schema 2 record count does not match the checked parcel input")

    tile_dir = root / "tiles"
    tile_dir.mkdir(parents=True, exist_ok=True)
    tile_path = tile_dir / "parcels.pmtiles"
    if tile_path.exists() or (tile_dir / "tiles-manifest.json").exists() or (tile_dir / "layers.json").exists():
        raise FileExistsError("refusing to mutate an existing tile release")
    shutil.copyfile(args.pmtiles, tile_path)
    tile_manifest = {
        "schema_version": 1,
        "min_zoom": header["minzoom"],
        "max_zoom": header["maxzoom"],
        "bounds": header["bounds"],
        "tile_format": "pbf",
        "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
        "source_refs": [SOURCE_REF],
        "sha256": sha256_file(tile_path),
        "bytes": tile_path.stat().st_size,
        "tile_layer": "parcels",
        "registry_run": args.registry_run,
        "feature_count": len(source_keys),
        "tool": metadata.get("generator", ""),
        "processing": "key-only; z14-z16; no feature or tile-size dropping; shared borders; simplification 2; no tiny-polygon reduction",
    }
    layers = {
        "schema_version": 1,
        "layers": [
            {
                "id": SOURCE_REF,
                "role": "parcel",
                "geometry": "polygon",
                "source": SOURCE_REF,
                "default_visible": True,
                "tile_layer": "parcels",
                "coverage": "ca-on-hamilton",
                "state": "provisional",
                "order": 1,
            }
        ],
    }
    (tile_dir / "tiles-manifest.json").write_bytes(dump(tile_manifest))
    (tile_dir / "layers.json").write_bytes(dump(layers))

    entries = []
    for path in sorted(p for p in root.rglob("*") if p.is_file() and p.name not in {"files.json", "manifest.json"}):
        rel = path.relative_to(root).as_posix()
        entries.append({"path": rel, "bytes": path.stat().st_size, "sha256": sha256_file(path)})
    files_doc = {"schema": dossier_manifest["schema"], "files": entries}
    files_bytes = dump(files_doc)
    files_path.write_bytes(files_bytes)
    dossier_manifest.setdefault("contract_revisions", {})["tiles"] = "0.1"
    dossier_manifest["files_sha256"] = hashlib.sha256(files_bytes).hexdigest()
    dossier_manifest["file_count"] = len(entries)
    manifest_path.write_bytes(dump(dossier_manifest))

    print(
        json.dumps(
            {
                "release_id": dossier_manifest.get("release", {}).get("id"),
                "dossier_records": len(dossier_ids),
                "tile_features": len(source_keys),
                "tile_bytes": tile_path.stat().st_size,
                "tile_sha256": tile_manifest["sha256"],
                "manifest_files": len(entries),
            },
            sort_keys=True,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
