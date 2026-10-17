"""Load overlay GeoJSON and stream registry parcels. Identifying fields dropped."""

from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Iterator

from heavymap.ids.config import is_screened_field
from heavymap.overlays.config import OverlayLayerConfig, PropertyFilter
from heavymap.overlays.errors import OverlayError
from heavymap.overlays.geometry import (
    geom_from_geojson,
    looks_like_lonlat_bounds,
    repair_geometry,
    require_shapely,
)
from heavymap.overlays.labels import first_filled, render_label, stringify
from heavymap.overlays.models import LayerLoadStats, OverlayFeature, ParcelGeom


def _properties(raw: dict | None) -> dict[str, str]:
    out: dict[str, str] = {}
    for key, value in (raw or {}).items():
        name = str(key)
        if is_screened_field(name):
            continue
        out[name] = stringify(value)
    return out


def _passes_filter(props: dict[str, str], spec: PropertyFilter | None) -> bool:
    if spec is None or spec.todo or not spec.field or spec.field == "TODO":
        return True
    if not spec.exclude_values:
        return True
    value = props.get(spec.field, "").strip().casefold()
    excluded = {item.strip().casefold() for item in spec.exclude_values}
    return value not in excluded


def _pick_source_id(props: dict[str, str], fields: tuple[str, ...], index: int) -> str:
    for name in fields:
        value = props.get(name, "").strip()
        if value:
            return value
    return f"row-{index}"


def load_overlay_layer(
    path: str | Path,
    config: OverlayLayerConfig,
) -> tuple[list[OverlayFeature], LayerLoadStats]:
    """Load one overlay FeatureCollection already in the working CRS."""

    require_shapely()
    stats = LayerLoadStats(layer_id=config.layer_id, todos=list(config.todo_fields))
    raw = json.loads(Path(path).read_text(encoding="utf-8"))
    features = raw.get("features") if isinstance(raw, dict) else raw
    del raw
    if not isinstance(features, list):
        raise OverlayError("geojson_not_a_feature_collection", str(path))

    loaded: list[OverlayFeature] = []
    for index, feat in enumerate(features):
        stats.features_in += 1
        if not isinstance(feat, dict):
            stats.missing_geometry += 1
            continue
        geom = geom_from_geojson(feat.get("geometry"))
        if geom is None or geom.is_empty:
            stats.missing_geometry += 1
            continue
        geom, was_invalid = repair_geometry(geom)
        if was_invalid:
            stats.invalid_before += 1
            stats.repaired += 1
        if geom is None or geom.is_empty:
            stats.empty_after_repair += 1
            continue
        props = _properties(feat.get("properties"))
        if not _passes_filter(props, config.feature_filter):
            stats.filtered_out += 1
            continue
        class_value = first_filled(props, config.class_fields) or config.constant_class
        label = render_label(config.label_template, props) or config.label_template
        loaded.append(
            OverlayFeature(
                source_id=_pick_source_id(props, config.id_fields, index),
                geom=geom,
                area_m2=float(geom.area),
                class_value=class_value,
                quoted_label=label,
            )
        )
    stats.loaded = len(loaded)
    if looks_like_lonlat_bounds(f.geom for f in loaded):
        stats.skipped_lonlat = True
        raise OverlayError(
            "input_not_projected",
            f"{config.layer_id} coordinates look like lon/lat. Reproject to "
            f"{config.working_crs} before linking.",
        )
    return loaded, stats


def _assert_projected(geoms: list, label: str) -> None:
    if looks_like_lonlat_bounds(geoms):
        raise OverlayError(
            "input_not_projected",
            f"{label} coordinates look like lon/lat. Reproject to EPSG:26917 "
            "before linking.",
        )


def _parcel_id(row: dict[str, str]) -> str:
    return (row.get("heavymap_id") or row.get("hm_id") or "").strip()


def iter_parcel_chunks(
    path: str | Path,
    chunk_size: int,
) -> Iterator[list[ParcelGeom]]:
    """Yield active registry parcels (or GeoJSON) in chunks. Does not load all."""

    require_shapely()
    src = Path(path)
    if src.suffix.lower() in {".json", ".geojson"}:
        yield from _iter_geojson_parcels(src, chunk_size)
        return
    chunk: list[ParcelGeom] = []
    checked_crs = False
    with src.open(encoding="utf-8", newline="") as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            if row.get("status") and row["status"] != "active":
                continue
            hid = _parcel_id(row)
            raw_geom = row.get("geometry_json") or ""
            if not hid or not raw_geom:
                continue
            try:
                geom = geom_from_geojson(json.loads(raw_geom))
            except (json.JSONDecodeError, TypeError, ValueError):
                continue
            geom, _was_invalid = repair_geometry(geom)
            if geom is None or geom.is_empty:
                continue
            chunk.append(
                ParcelGeom(heavymap_id=hid, geom=geom, area_m2=float(geom.area))
            )
            if len(chunk) >= chunk_size:
                if not checked_crs:
                    _assert_projected([p.geom for p in chunk], "parcels")
                    checked_crs = True
                yield chunk
                chunk = []
    if chunk:
        if not checked_crs:
            _assert_projected([p.geom for p in chunk], "parcels")
        yield chunk


def _iter_geojson_parcels(path: Path, chunk_size: int) -> Iterator[list[ParcelGeom]]:
    raw = json.loads(path.read_text(encoding="utf-8"))
    features = raw.get("features") if isinstance(raw, dict) else raw
    del raw
    if not isinstance(features, list):
        raise OverlayError("geojson_not_a_feature_collection", str(path))
    chunk: list[ParcelGeom] = []
    checked_crs = False
    for index, feat in enumerate(features):
        if not isinstance(feat, dict):
            continue
        geom = geom_from_geojson(feat.get("geometry"))
        geom, _was_invalid = repair_geometry(geom)
        if geom is None or geom.is_empty:
            continue
        props = _properties(feat.get("properties"))
        hid = (
            props.get("heavymap_id")
            or props.get("hm_id")
            or _pick_source_id(props, ("heavymap_id", "hm_id"), index)
        )
        chunk.append(ParcelGeom(heavymap_id=hid, geom=geom, area_m2=float(geom.area)))
        if len(chunk) >= chunk_size:
            if not checked_crs:
                _assert_projected([p.geom for p in chunk], "parcels")
                checked_crs = True
            yield chunk
            chunk = []
    if chunk:
        if not checked_crs:
            _assert_projected([p.geom for p in chunk], "parcels")
        yield chunk


def resolve_layer_path(
    config: OverlayLayerConfig,
    overrides: dict[str, Path],
    data_root: Path | None,
) -> Path | None:
    if config.layer_id in overrides:
        return overrides[config.layer_id]
    if data_root and config.default_rel:
        candidate = Path(data_root) / config.default_rel
        if candidate.is_file():
            return candidate
    return None
