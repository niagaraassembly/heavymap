"""Load GeoJSON FeatureCollections. Drop screened identifying fields."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from heavymap.ids.config import is_screened_field
from heavymap.ids.geometry import Geometry, GeometryError
from heavymap.ids.models import SourceFeature


def _stringify(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, float) and value.is_integer():
        return str(int(value))
    return str(value)


def _geometry_from_geojson(data: dict) -> Geometry:
    kind = data.get("type")
    coords = data.get("coordinates")
    if kind == "Point":
        return Geometry.point(float(coords[0]), float(coords[1]))
    if kind == "Polygon":
        if not coords:
            raise GeometryError("empty_geometry")
        return Geometry.from_ring(tuple((float(c[0]), float(c[1])) for c in coords[0]))
    if kind == "MultiPolygon":
        rings = []
        for poly in coords or []:
            if not poly:
                continue
            rings.append(tuple((float(c[0]), float(c[1])) for c in poly[0]))
        if not rings:
            raise GeometryError("empty_geometry")
        return Geometry.from_rings(rings)
    if kind == "MultiPoint":
        # Registry addresses are one point per feature; take the first.
        if not coords:
            raise GeometryError("empty_geometry")
        return Geometry.point(float(coords[0][0]), float(coords[0][1]))
    raise GeometryError("unsupported_geojson_type", str(kind))


def _source_id(properties: dict[str, str], fallback: str) -> str:
    for key in ("OBJECTID", "objectid", "FID", "fid", "SEGID"):
        if properties.get(key):
            return properties[key]
    return fallback


def load_feature_collection(
    path: str | Path,
    source_name: str,
) -> list[SourceFeature]:
    raw = json.loads(Path(path).read_text(encoding="utf-8"))
    features = raw.get("features") if isinstance(raw, dict) else raw
    if not isinstance(features, list):
        raise ValueError("geojson_not_a_feature_collection")
    out: list[SourceFeature] = []
    for index, feat in enumerate(features):
        if not isinstance(feat, dict):
            continue
        geom_data = feat.get("geometry")
        if not geom_data:
            continue
        try:
            geometry = _geometry_from_geojson(geom_data)
        except (GeometryError, TypeError, IndexError, ValueError):
            continue
        props_in = feat.get("properties") or {}
        props = {
            str(k): _stringify(v)
            for k, v in props_in.items()
            if not is_screened_field(str(k))
        }
        sid = _source_id(props, f"row-{index}")
        out.append(
            SourceFeature(
                source_id=sid,
                source_name=source_name,
                geometry=geometry,
                properties=props,
            )
        )
    return out
