"""In-memory records for the HeavyMap ID registry."""

from __future__ import annotations

from dataclasses import dataclass, field, replace
from typing import Literal

from heavymap.ids.geometry import Geometry

ParcelStatus = Literal["active", "retired"]
ArnGrade = Literal[
    "exact_1to1",
    "one_to_many",
    "many_to_one",
    "placeholder",
    "unmatched",
    "not_in_coverage",
    "",
]
LineageRelation = Literal[
    "split_into",
    "merged_from",
    "replaced_by",
    "same_as",
]


@dataclass
class SourceFeature:
    source_id: str
    source_name: str
    geometry: Geometry
    properties: dict[str, str] = field(default_factory=dict)


@dataclass
class ParcelRecord:
    hm_id: str
    status: str
    geom_hash: str
    fingerprint: str
    area_m2: float
    rep_x: float
    rep_y: float
    minx: float
    miny: float
    maxx: float
    maxy: float
    source_ids: tuple[str, ...]
    arn_grade: str
    minted_run: str
    retired_run: str | None
    geometry: Geometry

    def retire(self, run_id: str) -> "ParcelRecord":
        return replace(self, status="retired", retired_run=run_id)


@dataclass
class ArnLink:
    hm_id: str
    arn: str
    npca_source_id: str
    grade: str
    iou: float | None
    method: str
    notes: str = ""


@dataclass
class AddressRecord:
    hm_id: str
    civic_key: str
    source_ids: tuple[str, ...]
    x: float
    y: float
    parcel_hm_id: str | None
    link_method: str
    status: str
    minted_run: str
    retired_run: str | None
    waste_seen: str = ""


@dataclass
class BuildingOverlap:
    building_hm_id: str
    parcel_hm_id: str
    area_m2: float


@dataclass
class BuildingRecord:
    hm_id: str
    geom_hash: str
    fingerprint: str
    area_m2: float
    parcel_hm_id: str | None
    source_ids: tuple[str, ...]
    status: str
    minted_run: str
    retired_run: str | None
    geometry: Geometry
    overlaps: tuple[BuildingOverlap, ...] = ()

    def retire(self, run_id: str) -> "BuildingRecord":
        return replace(self, status="retired", retired_run=run_id, overlaps=())


@dataclass
class LineageLink:
    from_id: str
    to_id: str
    relation: str
    run_id: str


@dataclass
class Registry:
    config_name: str
    run_id: str
    parcels: list[ParcelRecord]
    arn_links: list[ArnLink]
    addresses: list[AddressRecord]
    buildings: list[BuildingRecord]
    lineage: list[LineageLink]
    previous_run_id: str | None = None

    def active_parcels(self) -> list[ParcelRecord]:
        return [p for p in self.parcels if p.status == "active"]

    def active_addresses(self) -> list[AddressRecord]:
        return [a for a in self.addresses if a.status == "active"]

    def active_buildings(self) -> list[BuildingRecord]:
        return [b for b in self.buildings if b.status == "active"]
