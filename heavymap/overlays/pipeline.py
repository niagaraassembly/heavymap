"""Run an overlay link: one overlay layer at a time, parcels streamed."""

from __future__ import annotations

import csv
import datetime as dt
import json
from pathlib import Path

from heavymap.ids.store import CURRENT_NAME, current_run_id
from heavymap.overlays.config import OverlayLayerConfig, OverlayRunConfig
from heavymap.overlays.errors import OverlayError
from heavymap.overlays.geometry import require_shapely
from heavymap.overlays.io import (
    iter_parcel_chunks,
    load_overlay_layer,
    resolve_layer_path,
)
from heavymap.overlays.linker import link_chunks
from heavymap.overlays.models import LINK_FIELDS

SCHEMA_VERSION = 1


def _new_run_id() -> str:
    return dt.datetime.now(dt.timezone.utc).strftime("%Y%m%dT%H%M%SZ")


def _registry_parcels_csv(registry_dir: Path) -> Path:
    rid = current_run_id(registry_dir)
    if not rid:
        raise OverlayError(
            "no_registry",
            f"no CURRENT pointer under {registry_dir}. Mint IDs first "
            "(python3 -m heavymap.ids).",
        )
    path = registry_dir / "runs" / rid / "parcels.csv"
    if not path.is_file():
        raise OverlayError("registry_parcels_missing", str(path))
    return path


def run_overlays(
    *,
    config: OverlayRunConfig,
    parcels_path: Path | None = None,
    registry_dir: Path | None = None,
    overlay_paths: dict[str, Path] | None = None,
    data_root: Path | None = None,
    out_dir: Path | None = None,
    run_id: str | None = None,
    layer_ids: list[str] | None = None,
    chunk_size: int | None = None,
    sliver_share: float | None = None,
    sliver_area_m2: float | None = None,
    allow_missing: bool = True,
) -> tuple[dict, Path]:
    """Link configured overlay layers to registry parcels. Writes local-data only."""

    require_shapely()
    root = Path(out_dir or config.default_overlay_dir)
    this_run = run_id or _new_run_id()
    dest = root / "runs" / this_run
    dest.mkdir(parents=True, exist_ok=True)

    if parcels_path is None:
        if registry_dir is None:
            registry_dir = Path(config.default_registry_dir)
        parcels_path = _registry_parcels_csv(Path(registry_dir))
    parcels_path = Path(parcels_path)
    if not parcels_path.is_file():
        raise OverlayError("parcels_missing", str(parcels_path))

    wanted = set(layer_ids) if layer_ids else {lyr.layer_id for lyr in config.layers}
    layers = [lyr for lyr in config.layers if lyr.layer_id in wanted]
    if layer_ids:
        missing_ids = [lid for lid in layer_ids if all(lyr.layer_id != lid for lyr in config.layers)]
        if missing_ids:
            raise OverlayError("unknown_overlay_layer", ", ".join(missing_ids))

    chunk = chunk_size or config.chunk_size
    share_cap = config.sliver_parcel_share if sliver_share is None else sliver_share
    area_cap = config.sliver_area_m2 if sliver_area_m2 is None else sliver_area_m2
    overrides = overlay_paths or {}

    out_csv = dest / "overlay_links.csv"
    layer_reports: list[dict] = []
    total_rows = 0
    total_slivers = 0
    parcels_seen = 0

    with out_csv.open("w", encoding="utf-8", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=LINK_FIELDS, lineterminator="\n")
        writer.writeheader()

        for lyr in layers:
            report = _run_one_layer(
                lyr,
                parcels_path=parcels_path,
                overrides=overrides,
                data_root=data_root,
                writer=writer,
                chunk_size=chunk,
                sliver_share=share_cap,
                sliver_area_m2=area_cap,
                allow_missing=allow_missing,
            )
            layer_reports.append(report)
            total_rows += int(report.get("link_rows") or 0)
            total_slivers += int(report.get("slivers") or 0)
            parcels_seen = max(parcels_seen, int(report.get("parcels_seen") or 0))

    manifest = {
        "schema_version": SCHEMA_VERSION,
        "linear": ["NA-24", "NA-27", "NA-270"],
        "config_name": config.name,
        "working_crs": config.working_crs,
        "run_id": this_run,
        "parcels_path": str(parcels_path),
        "registry_run_id": current_run_id(Path(registry_dir)) if registry_dir else "",
        "chunk_size": chunk,
        "sliver": {
            "max_parcel_share": share_cap,
            "max_area_m2": area_cap,
            "rule": "flag when parcel_share < max_parcel_share AND area_m2 < max_area_m2; never drop",
        },
        "counts": {
            "parcels_seen": parcels_seen,
            "link_rows": total_rows,
            "slivers": total_slivers,
            "layers_configured": len(layers),
            "layers_run": sum(1 for r in layer_reports if r.get("status") == "ok"),
            "layers_skipped": sum(1 for r in layer_reports if r.get("status") != "ok"),
        },
        "layers": layer_reports,
        "output": "overlay_links.csv",
        "owner_fields_copied": False,
        "note": (
            "Real pulled rows stay in local-data/. This table stores HeavyMap "
            "IDs, overlay feature ids, source-quoted labels and area shares only. "
            "Every intersecting zone is kept. Nothing is published."
        ),
    }
    (dest / "MANIFEST.json").write_text(
        json.dumps(manifest, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    (root / CURRENT_NAME).write_text(this_run + "\n", encoding="utf-8")
    return manifest, dest


def _run_one_layer(
    lyr: OverlayLayerConfig,
    *,
    parcels_path: Path,
    overrides: dict[str, Path],
    data_root: Path | None,
    writer: csv.DictWriter,
    chunk_size: int,
    sliver_share: float,
    sliver_area_m2: float,
    allow_missing: bool,
) -> dict:
    path = resolve_layer_path(lyr, overrides, data_root)
    base = {
        "layer_id": lyr.layer_id,
        "catalog_row_ref": lyr.catalog_row_ref,
        "band": lyr.band,
        "endpoint": lyr.endpoint,
        "todo_fields": list(lyr.todo_fields),
        "endpoint_todo": lyr.endpoint_todo,
    }
    if path is None:
        if not allow_missing:
            raise OverlayError("overlay_missing", lyr.layer_id)
        return {
            **base,
            "status": "skipped_missing_input",
            "path": "",
            "link_rows": 0,
            "slivers": 0,
            "parcels_seen": 0,
        }
    features, stats = load_overlay_layer(path, lyr)
    counts = link_chunks(
        iter_parcel_chunks(parcels_path, chunk_size),
        features,
        lyr.layer_id,
        writer.writerow,
        sliver_share=sliver_share,
        sliver_area_m2=sliver_area_m2,
    )
    # Drop the overlay list before the next layer.
    del features
    return {
        **base,
        "status": "ok",
        "path": str(path),
        **stats.as_dict(),
        **counts,
    }
