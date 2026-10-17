"""CLI for the Hamilton HeavyMap ID registry.

Inputs are GeoJSON FeatureCollections already in the working CRS (EPSG:26917
for Hamilton). Pulled data stays in local-data/; nothing is published.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from heavymap.ids.config import HAMILTON, get_config
from heavymap.ids.geojson import load_feature_collection
from heavymap.ids.pipeline import PipelineError, run_registry


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="python3 -m heavymap.ids",
        description=(
            "Mint or reconcile HeavyMap IDs for a jurisdiction. "
            "Hamilton is the first geography. Default output is under "
            "local-data/heavymap-registry/hamilton (gitignored)."
        ),
    )
    parser.add_argument("--parcels", required=True, help="City parcel polygons GeoJSON")
    parser.add_argument("--npca", help="NPCA Assessment_Parcels_Test GeoJSON (ARN source)")
    parser.add_argument("--addresses", help="City address points GeoJSON")
    parser.add_argument("--buildings", help="City building polygons GeoJSON")
    parser.add_argument("--waste", help="Waste Collection by Address GeoJSON (unit cross-check)")
    parser.add_argument(
        "--config",
        default="hamilton",
        help="Registry config name (default: hamilton)",
    )
    parser.add_argument(
        "--registry-dir",
        default=None,
        help="Output directory (default: config.default_registry_dir)",
    )
    parser.add_argument("--run-id", default=None, help="Override run id")
    parser.add_argument(
        "--print-manifest",
        action="store_true",
        help="Print the run manifest JSON to stdout",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    try:
        config = get_config(args.config)
    except KeyError:
        print(f"error: unknown config {args.config!r}", file=sys.stderr)
        return 2
    registry_dir = Path(args.registry_dir or config.default_registry_dir)
    try:
        parcels = load_feature_collection(args.parcels, "city_parcels")
        npca = (
            load_feature_collection(args.npca, "npca_assessment_parcels_test")
            if args.npca
            else None
        )
        addresses = (
            load_feature_collection(args.addresses, "city_addresses")
            if args.addresses
            else None
        )
        buildings = (
            load_feature_collection(args.buildings, "city_buildings")
            if args.buildings
            else None
        )
        waste = (
            load_feature_collection(args.waste, "waste_by_address")
            if args.waste
            else None
        )
        _registry, manifest, dest = run_registry(
            parcels=parcels,
            npca=npca,
            addresses=addresses,
            buildings=buildings,
            waste=waste,
            config=config,
            registry_dir=registry_dir,
            run_id=args.run_id,
            config_name=args.config,
        )
    except (PipelineError, OSError, ValueError) as exc:
        code = getattr(exc, "code", type(exc).__name__)
        print(f"error: {code}: {exc}", file=sys.stderr)
        return 1
    print(f"wrote {dest}")
    if args.print_manifest:
        json.dump(manifest, sys.stdout, indent=2, sort_keys=True)
        sys.stdout.write("\n")
    else:
        counts = manifest["counts"]
        grades = manifest["arn_grades"]
        print(
            "active parcels={parcels_active} retired={parcels_retired} "
            "arn_links={arn_links} addresses={addresses_active} "
            "buildings={buildings_active}".format(**counts)
        )
        if grades:
            print("arn_grades " + " ".join(f"{k}={v}" for k, v in sorted(grades.items())))
    return 0


# Imported by tests; not used at runtime except to keep hamilton as default.
DEFAULT_CONFIG = HAMILTON
