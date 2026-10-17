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


def link_pairs(
    parcels: list[ParcelGeom],
    overlays: list[OverlayFeature],
    layer_id: str,
    *,
    sliver_share: float = DEFAULT_SLIVER_PARCEL_SHARE,
    sliver_area_m2: float = DEFAULT_SLIVER_AREA_M2,
) -> Iterator[dict[str, str]]:
    """Yield long-format rows for one parcel chunk against one overlay layer."""

    require_shapely()
    if not parcels or not overlays:
        return
    tree = build_strtree([feat.geom for feat in overlays])
    pairs = query_intersects(tree, [p.geom for p in parcels])
    seen: set[tuple[str, str]] = set()
    for tree_i, parcel_i in pairs:
        parcel = parcels[parcel_i]
        feat = overlays[tree_i]
        key = (parcel.heavymap_id, feat.source_id)
        if key in seen:
            continue
        seen.add(key)
        area = intersection_area(parcel.geom, feat.geom)
        if area <= 0:
            continue
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
) -> dict[str, int]:
    """Stream parcel chunks; call ``emit`` per row. Overlay list stays in RAM."""

    rows = 0
    slivers = 0
    parcels_seen = 0
    if not overlays:
        return {"parcels_seen": 0, "link_rows": 0, "slivers": 0}
    for chunk in chunks:
        parcels_seen += len(chunk)
        for row in link_pairs(
            chunk,
            overlays,
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
    }
