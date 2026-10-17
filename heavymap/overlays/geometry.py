"""Shapely 2 geometry helpers for overlay linking.

Required extra: shapely >= 2 (STRtree, make_valid). The ID registry stays
stdlib-only; this package is the spatial join that needs a real geometry
engine at Hamilton scale.
"""

from __future__ import annotations

from typing import Any, Iterable

from heavymap.overlays.errors import OverlayError

try:
    from shapely import STRtree, make_valid
    from shapely.geometry import shape
except ImportError as exc:  # pragma: no cover - optional extra
    STRtree = None  # type: ignore[assignment]
    make_valid = None  # type: ignore[assignment]
    shape = None  # type: ignore[assignment]
    _SHAPELY_IMPORT_ERROR = exc
else:
    _SHAPELY_IMPORT_ERROR = None


def shapely_available() -> bool:
    return _SHAPELY_IMPORT_ERROR is None


def require_shapely() -> None:
    if _SHAPELY_IMPORT_ERROR is not None:
        raise OverlayError(
            "shapely_required",
            "heavymap.overlays needs shapely 2 (STRtree and make_valid). "
            "Install shapely on the machine that runs the linker "
            f"(import error: {_SHAPELY_IMPORT_ERROR}).",
        )


def geom_from_geojson(data: dict | None) -> Any:
    require_shapely()
    if not data or not data.get("type"):
        return None
    try:
        return shape(data)
    except Exception:
        return None


def looks_like_lonlat_bounds(geoms: Iterable[Any]) -> bool:
    """True when every vertex sits in degree space on a small geographic bbox."""

    items = [g for g in geoms if g is not None and not g.is_empty]
    if not items:
        return False
    minx = min(g.bounds[0] for g in items)
    miny = min(g.bounds[1] for g in items)
    maxx = max(g.bounds[2] for g in items)
    maxy = max(g.bounds[3] for g in items)
    if abs(minx) > 180 or abs(maxx) > 180 or abs(miny) > 90 or abs(maxy) > 90:
        return False
    return (maxx - minx) <= 5 and (maxy - miny) <= 5


def polygonal_parts(geom: Any) -> Any | None:
    """Keep polygon / multipolygon parts after make_valid (drop lines, points)."""

    require_shapely()
    if geom is None or geom.is_empty:
        return None
    kind = geom.geom_type
    if kind in ("Polygon", "MultiPolygon"):
        return geom
    if kind == "GeometryCollection":
        parts = [polygonal_parts(part) for part in geom.geoms]
        parts = [p for p in parts if p is not None and not p.is_empty]
        if not parts:
            return None
        out = parts[0]
        for extra in parts[1:]:
            out = out.union(extra)
        return None if out.is_empty else out
    return None


def repair_geometry(geom: Any) -> tuple[Any | None, bool]:
    """Return (polygonal geometry or None, was_invalid_before_repair)."""

    require_shapely()
    if geom is None or geom.is_empty:
        return None, False
    was_invalid = not geom.is_valid
    if was_invalid:
        geom = make_valid(geom)
    geom = polygonal_parts(geom)
    if geom is None or geom.is_empty:
        return None, was_invalid
    return geom, was_invalid


def build_strtree(geoms: list[Any]) -> Any:
    require_shapely()
    return STRtree(geoms)


def query_intersects(tree: Any, geoms: list[Any]) -> list[tuple[int, int]]:
    """Pairs of (tree_index, query_index) for intersecting candidates."""

    require_shapely()
    if not geoms:
        return []
    hits = tree.query(geoms, predicate="intersects")
    if hits is None:
        return []
    size = getattr(hits, "size", len(hits))
    if size == 0:
        return []
    ndim = getattr(hits, "ndim", 1)
    if ndim == 1:
        # Single query geometry: 1-D array of tree indexes.
        return [(int(i), 0) for i in hits]
    # shapely 2.2 bulk query: row 0 = query indexes, row 1 = tree indexes.
    query_ix = hits[0]
    tree_ix = hits[1]
    return [(int(t), int(q)) for t, q in zip(tree_ix, query_ix)]


def intersection_area(a: Any, b: Any) -> float:
    require_shapely()
    try:
        inter = a.intersection(b)
    except Exception:
        return 0.0
    if inter is None or inter.is_empty:
        return 0.0
    return float(inter.area)
