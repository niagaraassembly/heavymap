"""CLI for the Hamilton parcel dossier.

Reads the current registry and overlay runs plus the NPCA all-fields pulls
from local-data/ and writes screened JSON shards to
local-data/dossier/hamilton/<date>/. Nothing here publishes anything.
"""

from __future__ import annotations

import argparse
import datetime as _dt
import json
import resource
import sys
import time
from pathlib import Path

from heavymap.dossier.build import Inputs, audit_output, load_all, resolve_run, write_dossier

NPCA_APT_REL = (
    "npca/assessment_parcels_test-hamilton-allfields-2026-10-17/"
    "assessment_parcels_test_hamilton_allfields.geojson"
)
NPCA_CITYVIEW_REL = (
    "npca/parcels_cityview-hamilton-allfields-2026-10-17/"
    "parcels_cityview_hamilton_allfields.geojson"
)


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="python3 -m heavymap.dossier",
        description=(
            "Build one screened dossier record per HeavyMap parcel ID. Output "
            "keys come from an allowlist; owner and legal fields are never written."
        ),
    )
    p.add_argument("--data-root", default="../local-data", help="local-data root (default: ../local-data)")
    p.add_argument("--registry-dir", default=None, help="Registry store or run dir (default: <data-root>/heavymap-registry/hamilton)")
    p.add_argument("--overlay-dir", default=None, help="Overlay store or run dir (default: <data-root>/heavymap-overlays/hamilton)")
    p.add_argument("--npca-apt", default=None, help="NPCA Assessment_Parcels_Test GeoJSON")
    p.add_argument("--npca-cityview", default=None, help="NPCA Parcels_Cityview GeoJSON")
    p.add_argument("--no-npca", action="store_true", help="Skip both NPCA files (roll data from registry only)")
    p.add_argument("--out-dir", default=None, help="Output dir (default: <data-root>/dossier/hamilton/<today>)")
    p.add_argument("--max-addresses", type=int, default=25, help="Addresses listed per parcel (count is always full)")
    return p


def _peak_mb() -> float:
    return resource.getrusage(resource.RUSAGE_SELF).ru_maxrss / 1024.0


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    root = Path(args.data_root)
    registry = resolve_run(Path(args.registry_dir) if args.registry_dir else root / "heavymap-registry/hamilton")
    overlays = resolve_run(Path(args.overlay_dir) if args.overlay_dir else root / "heavymap-overlays/hamilton")
    apt = cv = None
    if not args.no_npca:
        apt = Path(args.npca_apt) if args.npca_apt else root / NPCA_APT_REL
        cv = Path(args.npca_cityview) if args.npca_cityview else root / NPCA_CITYVIEW_REL
        for path in (apt, cv):
            if not path.exists():
                print(f"missing input: {path}", file=sys.stderr)
                return 2
    for path in (registry / "parcels.csv", overlays / "overlay_links.csv"):
        if not path.exists():
            print(f"missing input: {path}", file=sys.stderr)
            return 2
    out = Path(args.out_dir) if args.out_dir else root / "dossier/hamilton" / _dt.date.today().isoformat()

    t0 = time.monotonic()
    idx = load_all(Inputs(registry, overlays, apt, cv))
    t_load = time.monotonic() - t0
    manifest = write_dossier(
        idx,
        out,
        max_addresses=args.max_addresses,
        extra_manifest={"generated_at": _dt.datetime.now().astimezone().isoformat(timespec="seconds")},
    )
    t_write = time.monotonic() - t0 - t_load
    checked = audit_output(out)
    elapsed = time.monotonic() - t0
    summary = {
        "out_dir": str(out),
        "records": manifest["counts"].get("records", 0),
        "audited": checked,
        "coverage": manifest["coverage"],
        "counts": manifest["counts"],
        "sizes_bytes": manifest["sizes_bytes"],
        "shards": manifest["shard_key"]["count"],
        "seconds": {"load": round(t_load, 1), "build_write": round(t_write, 1), "total": round(elapsed, 1)},
        "peak_rss_mb": round(_peak_mb(), 1),
    }
    print(json.dumps(summary, indent=1))
    return 0
