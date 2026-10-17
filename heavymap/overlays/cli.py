"""CLI for the Hamilton parcel overlay linker.

Inputs are GeoJSON FeatureCollections already in EPSG:26917, plus a
registry parcels.csv. Pulled data stays in local-data/; nothing is published.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from heavymap.overlays.config import HAMILTON, get_config
from heavymap.overlays.errors import OverlayError
from heavymap.overlays.geometry import shapely_available
from heavymap.overlays.pipeline import run_overlays


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="python3 -m heavymap.overlays",
        description=(
            "Attach overlapping zones and designations to each HeavyMap parcel "
            "ID with area shares. Hamilton is the first geography. Default "
            "output is under local-data/heavymap-overlays/hamilton (gitignored)."
        ),
    )
    parser.add_argument(
        "--parcels",
        help="Registry parcels.csv or a GeoJSON FeatureCollection with heavymap_id",
    )
    parser.add_argument(
        "--registry-dir",
        default=None,
        help="Registry directory (uses CURRENT/parcels.csv when --parcels is omitted)",
    )
    parser.add_argument(
        "--data-root",
        default=None,
        help="local-data root used to resolve each layer's default_rel path",
    )
    parser.add_argument(
        "--overlay",
        action="append",
        default=[],
        metavar="LAYER_ID=PATH",
        help="Overlay GeoJSON for one layer_id (repeatable)",
    )
    parser.add_argument(
        "--layers",
        default=None,
        help="Comma-separated layer_ids (default: all configured layers)",
    )
    parser.add_argument(
        "--config",
        default="hamilton",
        help="Overlay config name (default: hamilton)",
    )
    parser.add_argument(
        "--out-dir",
        default=None,
        help="Output directory (default: config.default_overlay_dir)",
    )
    parser.add_argument("--run-id", default=None, help="Override run id")
    parser.add_argument(
        "--chunk-size",
        type=int,
        default=None,
        help="Parcel batch size (default: 2500)",
    )
    parser.add_argument(
        "--sliver-share",
        type=float,
        default=None,
        help="Sliver parcel-share cap (default: 0.01)",
    )
    parser.add_argument(
        "--sliver-area",
        type=float,
        default=None,
        help="Sliver area cap in m2 (default: 5)",
    )
    parser.add_argument(
        "--require-all",
        action="store_true",
        help="Fail if a requested layer has no input path",
    )
    parser.add_argument(
        "--print-manifest",
        action="store_true",
        help="Print the run manifest JSON to stdout",
    )
    return parser


def _parse_overlays(values: list[str]) -> dict[str, Path]:
    out: dict[str, Path] = {}
    for item in values:
        if "=" not in item:
            raise OverlayError(
                "overlay_flag",
                f"expected LAYER_ID=PATH, got {item!r}",
            )
        layer_id, path = item.split("=", 1)
        out[layer_id.strip()] = Path(path)
    return out


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    if not shapely_available():
        print(
            "error: shapely_required: install shapely 2 to run the overlay linker",
            file=sys.stderr,
        )
        return 2
    try:
        config = get_config(args.config)
    except KeyError:
        print(f"error: unknown config {args.config!r}", file=sys.stderr)
        return 2
    try:
        overlays = _parse_overlays(args.overlay)
        layer_ids = (
            [part.strip() for part in args.layers.split(",") if part.strip()]
            if args.layers
            else None
        )
        manifest, dest = run_overlays(
            config=config,
            parcels_path=Path(args.parcels) if args.parcels else None,
            registry_dir=Path(args.registry_dir) if args.registry_dir else None,
            overlay_paths=overlays,
            data_root=Path(args.data_root) if args.data_root else None,
            out_dir=Path(args.out_dir) if args.out_dir else Path(config.default_overlay_dir),
            run_id=args.run_id,
            layer_ids=layer_ids,
            chunk_size=args.chunk_size,
            sliver_share=args.sliver_share,
            sliver_area_m2=args.sliver_area,
            allow_missing=not args.require_all,
        )
    except (OverlayError, OSError, ValueError) as exc:
        code = getattr(exc, "code", type(exc).__name__)
        print(f"error: {code}: {exc}", file=sys.stderr)
        return 1
    print(f"wrote {dest}")
    if args.print_manifest:
        json.dump(manifest, sys.stdout, indent=2, sort_keys=True)
        sys.stdout.write("\n")
    else:
        counts = manifest["counts"]
        print(
            "parcels={parcels_seen} rows={link_rows} slivers={slivers} "
            "layers_run={layers_run} layers_skipped={layers_skipped}".format(**counts)
        )
    return 0


DEFAULT_CONFIG = HAMILTON
