"""Orchestrate an initial mint or a re-pull against a versioned registry."""

from __future__ import annotations

import datetime as dt
from collections import Counter
from pathlib import Path

from heavymap.ids.config import RegistryConfig
from heavymap.ids.format import IdFactory, is_ulid, parse_spine_key
from heavymap.ids.geometry import looks_like_lonlat
from heavymap.ids.models import Registry, SourceFeature
from heavymap.ids.registry import (
    attach_arns,
    link_addresses,
    mark_waste_coverage,
    overlap_buildings,
    reconcile_addresses,
    reconcile_buildings,
    reconcile_parcels,
)
from heavymap.ids.store import SCHEMA_VERSION, current_run_id, read_registry, write_registry


class PipelineError(ValueError):
    def __init__(self, code: str, detail: str = ""):
        self.code = code
        self.detail = detail
        super().__init__(code if not detail else f"{code}: {detail}")


def _new_run_id() -> str:
    return dt.datetime.now(dt.timezone.utc).strftime("%Y%m%dT%H%M%SZ")


def _assert_projected(features: list[SourceFeature], label: str) -> None:
    geoms = [f.geometry for f in features]
    if looks_like_lonlat(geoms):
        raise PipelineError(
            "input_not_projected",
            f"{label} coordinates look like lon/lat. Reproject to the working "
            "CRS (EPSG:26917 for Hamilton) before minting. The NPCA shift is "
            "in metres and degree coordinates would mint unstable IDs.",
        )


def _grade_counts(registry: Registry) -> dict[str, int]:
    return dict(Counter(p.arn_grade for p in registry.active_parcels()))


def _id_check(registry: Registry) -> None:
    seen: set[str] = set()
    for rec in (
        list(registry.parcels)
        + list(registry.addresses)
        + list(registry.buildings)
    ):
        key = parse_spine_key(rec.hm_id)
        if not is_ulid(key.local):
            raise PipelineError("non_ulid_minted", rec.hm_id)
        if rec.hm_id in seen:
            raise PipelineError("duplicate_hm_id", rec.hm_id)
        seen.add(rec.hm_id)


def run_registry(
    *,
    parcels: list[SourceFeature],
    config: RegistryConfig,
    registry_dir: Path,
    npca: list[SourceFeature] | None = None,
    addresses: list[SourceFeature] | None = None,
    buildings: list[SourceFeature] | None = None,
    waste: list[SourceFeature] | None = None,
    factory: IdFactory | None = None,
    run_id: str | None = None,
    config_name: str = "hamilton",
) -> tuple[Registry, dict, Path]:
    if not parcels:
        raise PipelineError("no_parcels")
    _assert_projected(parcels, "parcels")
    if npca:
        _assert_projected(npca, "npca")
    if buildings:
        _assert_projected(buildings, "buildings")

    root = Path(registry_dir)
    previous = read_registry(root)
    prev_run = current_run_id(root)
    this_run = run_id or _new_run_id()
    factory = factory or IdFactory()
    if previous is not None:
        factory.remember(p.hm_id for p in previous.parcels)
        factory.remember(a.hm_id for a in previous.addresses)
        factory.remember(b.hm_id for b in previous.buildings)

    parcel_recs, parcel_lineage = reconcile_parcels(
        previous.parcels if previous else [],
        parcels,
        factory,
        config,
        this_run,
    )
    if npca is not None:
        arn_links = attach_arns(parcel_recs, npca, config)
    elif previous is not None:
        active_ids = {p.hm_id for p in parcel_recs if p.status == "active"}
        old_grade = {p.hm_id: p.arn_grade for p in previous.parcels}
        for rec in parcel_recs:
            if rec.hm_id in old_grade:
                rec.arn_grade = old_grade[rec.hm_id]
        arn_links = [link for link in previous.arn_links if link.hm_id in active_ids]
    else:
        arn_links = []

    building_lineage: list = []
    if addresses is not None:
        address_recs = reconcile_addresses(
            previous.addresses if previous else [],
            addresses,
            factory,
            config,
            this_run,
        )
        link_addresses(address_recs, parcel_recs, config)
        if waste is not None:
            mark_waste_coverage(address_recs, waste)
    elif previous is not None:
        address_recs = list(previous.addresses)
        link_addresses(address_recs, parcel_recs, config)
    else:
        address_recs = []

    if buildings is not None:
        building_recs, building_lineage = reconcile_buildings(
            previous.buildings if previous else [],
            buildings,
            factory,
            config,
            this_run,
        )
        overlap_buildings(building_recs, parcel_recs)
    elif previous is not None:
        building_recs = list(previous.buildings)
        overlap_buildings(building_recs, parcel_recs)
    else:
        building_recs = []

    registry = Registry(
        config_name=config_name,
        run_id=this_run,
        parcels=parcel_recs,
        arn_links=arn_links,
        addresses=address_recs,
        buildings=building_recs,
        lineage=(previous.lineage if previous else [])
        + parcel_lineage
        + building_lineage,
        previous_run_id=prev_run,
    )
    _id_check(registry)

    corrections = []
    for corr in config.corrections.values():
        if corr.dx_m or corr.dy_m:
            corrections.append(
                {
                    "source_name": corr.source_name,
                    "layer_id": corr.layer_id,
                    "dx_m": corr.dx_m,
                    "dy_m": corr.dy_m,
                    "note": corr.note,
                }
            )
    manifest = {
        "schema_version": SCHEMA_VERSION,
        "linear": ["NA-24", "NA-270", "NA-276"],
        "config_name": config_name,
        "jurisdiction": config.jurisdiction,
        "working_crs": config.working_crs,
        "id_format": "hm:{country}:{region}:{jurisdiction}:{grain}:{crockford_ulid}",
        "run_id": this_run,
        "previous_run_id": prev_run,
        "registry_dir": str(root),
        "corrections_applied": corrections,
        "counts": {
            "parcel_features_in": len(parcels),
            "parcels_active": len(registry.active_parcels()),
            "parcels_retired": sum(1 for p in registry.parcels if p.status == "retired"),
            "arn_links": len(arn_links),
            "addresses_active": len(registry.active_addresses()),
            "buildings_active": len(registry.active_buildings()),
            "lineage_links": len(registry.lineage),
        },
        "arn_grades": _grade_counts(registry),
        "owner_fields_copied": False,
        "note": (
            "Real pulled rows stay in local-data/. This registry stores "
            "HeavyMap IDs, fingerprints, aliases and join grades only."
        ),
    }
    dest = write_registry(root, registry, manifest)
    return registry, manifest, dest
