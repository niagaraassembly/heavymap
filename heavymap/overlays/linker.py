"""Intersect registry parcels with overlay polygons. Long-format area shares.

Every overlapping feature is kept (Morgen, provisional: store every zone;
dossier explains overlaps). Slivers are flagged, not dropped.
"""

from __future__ import annotations

from typing import Callable, Iterable, Iterator

from heavymap.overlays.config import (
    DEFAULT_SLIVER_AREA_M2,
    DEFAULT_SLIVER_PARCEL_SHARE,
)
from heavymap.overlays.geometry import (
    build_strtree,
    intersection_area,
    polygonal_parts,
    query_intersects,
    require_shapely,
)
from heavymap.overlays.models import OverlayFeature, ParcelGeom

LinkCallback = Callable[[dict[str, str]], None]


def is_sliver(
    area_m2: float,
    parcel_share: float,
    max_share: float = DEFAULT_SLIVER_PARCEL_SHARE,
    max_area_m2: float = DEFAULT_SLIVER_AREA_M2,
) -> bool:
    """True when the overlap is both under the share and under the area caps."""

    return area_m2 < max_area_m2 and parcel_share < max_share


def _share(part: float, whole: float) -> float:
    if whole <= 0:
        return 0.0
    return part / whole


# Overlay polygons with more vertices than this are cut into quadrant pieces
# once per layer (like PostGIS ST_Subdivide). Pieces partition the feature, so
# the summed piece intersections equal the whole-feature intersection, and each
# GEOS call works on a small piece instead of a city-sized polygon.
DEFAULT_MAX_PIECE_VERTICES = 256
_MAX_SPLIT_DEPTH = 12


def _subdivide(geom, max_vertices: int, depth: int = 0) -> list:
    import shapely
    from shapely.geometry import box

    if geom is None or geom.is_empty:
        return []
    if depth >= _MAX_SPLIT_DEPTH or shapely.get_num_coordinates(geom) <= max_vertices:
        return [geom]
    minx, miny, maxx, maxy = geom.bounds
    midx, midy = (minx + maxx) / 2.0, (miny + maxy) / 2.0
    out = []
    for cell in (
        box(minx, miny, midx, midy),
        box(midx, miny, maxx, midy),
        box(minx, midy, midx, maxy),
        box(midx, midy, maxx, maxy),
    ):
        part = polygonal_parts(geom.intersection(cell))
        if part is not None and not part.is_empty:
            out.extend(_subdivide(part, max_vertices, depth + 1))
    return out


class OverlayIndex:
    """Pieces of one overlay layer in a prepared STRtree. Built once per layer."""

    def __init__(self, overlays: list[OverlayFeature], max_piece_vertices: int = DEFAULT_MAX_PIECE_VERTICES):
        import numpy as np
        import shapely

        require_shapely()
        self.overlays = overlays
        pieces: list = []
        owner: list[int] = []
        for i, feat in enumerate(overlays):
            for piece in _subdivide(feat.geom, max_piece_vertices):
                pieces.append(piece)
                owner.append(i)
        self.pieces = np.array(pieces, dtype=object)
        self.owner = np.array(owner, dtype=np.int64)
        shapely.prepare(self.pieces)
        self.tree = build_strtree(list(self.pieces))

    @property
    def piece_count(self) -> int:
        return int(len(self.pieces))


def _pair_areas(parcel_geoms, piece_geoms):
    """Intersection areas for aligned arrays. Contained pairs skip the overlay."""

    import numpy as np
    import shapely

    areas = np.zeros(len(parcel_geoms), dtype=float)
    if not len(parcel_geoms):
        return areas
    inside = shapely.contains(piece_geoms, parcel_geoms)  # prepared pieces
    areas[inside] = shapely.area(parcel_geoms[inside])
    rest = ~inside
    if rest.any():
        try:
            areas[rest] = shapely.area(shapely.intersection(parcel_geoms[rest], piece_geoms[rest]))
        except Exception:
            idx = np.nonzero(rest)[0]
            for k in idx:  # GEOS failure on one pair: fall back pair by pair
                areas[k] = intersection_area(parcel_geoms[k], piece_geoms[k])
    return areas


def link_indexed(
    parcels: list[ParcelGeom],
    index: OverlayIndex,
    layer_id: str,
    *,
    sliver_share: float = DEFAULT_SLIVER_PARCEL_SHARE,
    sliver_area_m2: float = DEFAULT_SLIVER_AREA_M2,
) -> Iterator[dict[str, str]]:
    """Yield long-format rows for one parcel chunk against a prebuilt index."""

    import numpy as np

    if not parcels or not index.piece_count:
        return
    parcel_geoms = np.array([p.geom for p in parcels], dtype=object)
    pairs = query_intersects(index.tree, list(parcel_geoms))
    if not pairs:
        return
    piece_ix = np.fromiter((t for t, _q in pairs), dtype=np.int64, count=len(pairs))
    parcel_ix = np.fromiter((q for _t, q in pairs), dtype=np.int64, count=len(pairs))
    areas = _pair_areas(parcel_geoms[parcel_ix], index.pieces[piece_ix])
    totals: dict[tuple[int, int], float] = {}
    for q, f, a in zip(parcel_ix.tolist(), index.owner[piece_ix].tolist(), areas.tolist()):
        totals[(q, f)] = totals.get((q, f), 0.0) + a
    for (q, f) in sorted(totals):
        area = totals[(q, f)]
        if area <= 0:
            continue
        parcel = parcels[q]
        feat = index.overlays[f]
        parcel_share = _share(area, parcel.area_m2)
        feature_share = _share(area, feat.area_m2)
        sliver = is_sliver(area, parcel_share, sliver_share, sliver_area_m2)
        yield {
            "heavymap_id": parcel.heavymap_id,
            "layer_id": layer_id,
            "feature_source_id": feat.source_id,
            "class": feat.class_value,
            "quoted_label": feat.quoted_label,
            "area_m2": f"{area:.6f}",
            "parcel_share": f"{parcel_share:.8f}",
            "feature_share": f"{feature_share:.8f}",
            "sliver": "y" if sliver else "n",
        }


def link_pairs(
    parcels: list[ParcelGeom],
    overlays: list[OverlayFeature],
    layer_id: str,
    *,
    sliver_share: float = DEFAULT_SLIVER_PARCEL_SHARE,
    sliver_area_m2: float = DEFAULT_SLIVER_AREA_M2,
    max_piece_vertices: int = DEFAULT_MAX_PIECE_VERTICES,
) -> Iterator[dict[str, str]]:
    """Yield long-format rows for one parcel chunk against one overlay layer."""

    require_shapely()
    if not parcels or not overlays:
        return
    index = OverlayIndex(overlays, max_piece_vertices)
    yield from link_indexed(
        parcels, index, layer_id, sliver_share=sliver_share, sliver_area_m2=sliver_area_m2
    )


def link_layer(
    parcels: Iterable[ParcelGeom],
    overlays: list[OverlayFeature],
    layer_id: str,
    *,
    sliver_share: float = DEFAULT_SLIVER_PARCEL_SHARE,
    sliver_area_m2: float = DEFAULT_SLIVER_AREA_M2,
) -> list[dict[str, str]]:
    """Collect all rows (tests). Production writes through ``link_chunks``."""

    return list(
        link_pairs(
            list(parcels),
            overlays,
            layer_id,
            sliver_share=sliver_share,
            sliver_area_m2=sliver_area_m2,
        )
    )


def link_chunks(
    chunks: Iterable[list[ParcelGeom]],
    overlays: list[OverlayFeature],
    layer_id: str,
    emit: LinkCallback,
    *,
    sliver_share: float = DEFAULT_SLIVER_PARCEL_SHARE,
    sliver_area_m2: float = DEFAULT_SLIVER_AREA_M2,
    max_piece_vertices: int = DEFAULT_MAX_PIECE_VERTICES,
) -> dict[str, int]:
    """Stream parcel chunks; call ``emit`` per row. The overlay index is built once."""

    rows = 0
    slivers = 0
    parcels_seen = 0
    if not overlays:
        return {"parcels_seen": 0, "link_rows": 0, "slivers": 0, "overlay_pieces": 0}
    index = OverlayIndex(overlays, max_piece_vertices)
    for chunk in chunks:
        parcels_seen += len(chunk)
        for row in link_indexed(
            chunk,
            index,
            layer_id,
            sliver_share=sliver_share,
            sliver_area_m2=sliver_area_m2,
        ):
            emit(row)
            rows += 1
            if row["sliver"] == "y":
                slivers += 1
    return {
        "parcels_seen": parcels_seen,
        "link_rows": rows,
        "slivers": slivers,
        "overlay_pieces": index.piece_count,
    }
