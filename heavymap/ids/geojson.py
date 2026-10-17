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
    if kind in ("Polygon", "MultiPolygon"):
        # Holes are kept: a point in a courtyard parcel's hole is not inside it.
        return Geometry.from_json({"type": kind, "coordinates": coords})
    if kind == "MultiPoint":
        # Registry addresses are one point per feature; take the first.
        if not coords:
            raise GeometryError("empty_geometry")
        return Geometry.point(float(coords[0][0]), float(coords[0][1]))
    raise GeometryError("unsupported_geojson_type", str(kind))


SOURCE_ID_FIELDS = ("OBJECTID", "objectid", "OBJECTID_1", "FID", "fid", "SEGID", "GlobalID")


def _pick_source_id_field(rows: list[dict[str, str]]) -> str | None:
    """First candidate id field that is filled and unique on every row.

    NPCA Assessment_Parcels_Test carries OBJECTID=0 on 2,344 rows, so a fixed
    OBJECTID choice would merge distinct parcels; OBJECTID_1 is unique there.
    """

    for key in SOURCE_ID_FIELDS:
        values = [r.get(key, "") for r in rows]
        if all(values) and len(set(values)) == len(values):
            return key
    return None


def load_feature_collection(
    path: str | Path,
    source_name: str,
) -> list[SourceFeature]:
    raw = json.loads(Path(path).read_text(encoding="utf-8"))
    features = raw.get("features") if isinstance(raw, dict) else raw
    if not isinstance(features, list):
        raise ValueError("geojson_not_a_feature_collection")
    parsed: list[tuple[int, Geometry, dict[str, str]]] = []
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
        parsed.append((index, geometry, props))
    id_field = _pick_source_id_field([props for _i, _g, props in parsed])
    out: list[SourceFeature] = []
    for index, geometry, props in parsed:
        sid = props[id_field] if id_field else f"row-{index}"
        out.append(
            SourceFeature(
                source_id=sid,
                source_name=source_name,
                geometry=geometry,
                properties=props,
            )
        )
    return out
