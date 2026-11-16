#!/usr/bin/env python3
"""Prepare key-only Hamilton parcel features from a pinned IA registry run.

The source geometry remains in local-data. The output contains only the schema 2
parcel key and geometry; no roll numbers, source ids, or other attributes.
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import re
from pathlib import Path


ID_PATTERN = re.compile(r"^ia:ca:on:hamilton:parcel:[0-9A-HJKMNP-TV-Z]{26}$")
DEFAULT_RUN = "20261017T0725Z-run2-ia1"
DEFAULT_SOURCE = (
    "hamilton-city/assessment-parcel-hamilton-2026-10-17/"
    "assessment-parcel.geojson"
)


def parse_args() -> argparse.Namespace:
    data_root = Path(os.environ.get("NA_LOCAL_DATA", Path.home() / "na/local-data"))
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--registry-run",
        type=Path,
        default=data_root / "heavymap-registry/hamilton/runs" / DEFAULT_RUN,
    )
    parser.add_argument("--source", type=Path, default=data_root / DEFAULT_SOURCE)
    parser.add_argument("--output", type=Path, required=True)
    return parser.parse_args()


def active_keys_by_source(path: Path) -> tuple[dict[str, str], set[str]]:
    by_source: dict[str, str] = {}
    keys: set[str] = set()
    with (path / "parcels.csv").open(newline="", encoding="utf-8") as stream:
        for row in csv.DictReader(stream):
            if row.get("status") != "active":
                continue
            key = row.get("ia_id", "")
            if not ID_PATTERN.fullmatch(key):
                raise ValueError("registry run contains a non-schema-2 Hamilton parcel key")
            keys.add(key)
            for source_id in row.get("source_ids", "").split(" | "):
                source_id = source_id.strip()
                if source_id:
                    prior = by_source.setdefault(source_id, key)
                    if prior != key:
                        raise ValueError("registry run maps one source feature to multiple parcel keys")
    if not keys:
        raise ValueError("registry run has no active Hamilton parcel keys")
    return by_source, keys


def main() -> int:
    args = parse_args()
    if not args.registry_run.is_dir() or not args.source.is_file():
        raise FileNotFoundError("pinned registry run or Hamilton parcel geometry is missing")

    by_source, expected_keys = active_keys_by_source(args.registry_run)
    document = json.loads(args.source.read_text(encoding="utf-8"))
    seen: set[str] = set()
    unmatched = 0
    duplicate_geometry = 0
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("w", encoding="utf-8", newline="") as output:
        for feature in document.get("features", []):
            source_id = str((feature.get("properties") or {}).get("OBJECTID", ""))
            key = by_source.get(source_id)
            if key is None:
                unmatched += 1
                continue
            if key in seen:
                duplicate_geometry += 1
                continue
            geometry = feature.get("geometry")
            if not geometry:
                raise ValueError("a matched parcel feature has no geometry")
            seen.add(key)
            output.write(
                json.dumps(
                    {
                        "type": "Feature",
                        "properties": {"key": key},
                        "geometry": geometry,
                    },
                    ensure_ascii=False,
                    separators=(",", ":"),
                )
                + "\n"
            )

    missing = expected_keys - seen
    if missing:
        args.output.unlink(missing_ok=True)
        raise ValueError(f"{len(missing)} active registry keys had no source geometry")

    print(
        json.dumps(
            {
                "registry_run": args.registry_run.name,
                "active_registry_keys": len(expected_keys),
                "matched_features": len(seen),
                "unmatched_source_features": unmatched,
                "duplicate_geometry_rows": duplicate_geometry,
                "output_bytes": args.output.stat().st_size,
            },
            sort_keys=True,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
