"""In-memory overlay records."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass
class OverlayFeature:
    source_id: str
    geom: Any
    area_m2: float
    class_value: str
    quoted_label: str


@dataclass
class ParcelGeom:
    heavymap_id: str
    geom: Any
    area_m2: float


@dataclass
class LayerLoadStats:
    layer_id: str
    features_in: int = 0
    missing_geometry: int = 0
    invalid_before: int = 0
    repaired: int = 0
    empty_after_repair: int = 0
    filtered_out: int = 0
    loaded: int = 0
    skipped_lonlat: bool = False
    todos: list[str] = field(default_factory=list)

    def as_dict(self) -> dict:
        return {
            "layer_id": self.layer_id,
            "features_in": self.features_in,
            "missing_geometry": self.missing_geometry,
            "invalid_before": self.invalid_before,
            "repaired": self.repaired,
            "empty_after_repair": self.empty_after_repair,
            "filtered_out": self.filtered_out,
            "loaded": self.loaded,
            "todos": list(self.todos),
        }


LINK_FIELDS = [
    "heavymap_id",
    "layer_id",
    "feature_source_id",
    "class",
    "quoted_label",
    "area_m2",
    "parcel_share",
    "feature_share",
    "sliver",
]
