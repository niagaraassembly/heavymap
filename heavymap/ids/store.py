"""Versioned CSV + MANIFEST persistence. Default location is under local-data/."""

from __future__ import annotations

import csv
import json
from pathlib import Path

from heavymap.ids.geometry import Geometry
from heavymap.ids.models import (
    AddressRecord,
    ArnLink,
    BuildingOverlap,
    BuildingRecord,
    LineageLink,
    ParcelRecord,
    Registry,
)

SCHEMA_VERSION = 1
CURRENT_NAME = "CURRENT"


def run_dir(root: Path, run_id: str) -> Path:
    return Path(root) / "runs" / run_id


def current_run_id(root: Path) -> str | None:
    pointer = Path(root) / CURRENT_NAME
    if not pointer.is_file():
        return None
    text = pointer.read_text(encoding="utf-8").strip()
    return text or None


def _write_csv(path: Path, fieldnames: list[str], rows: list[dict]) -> None:
    with path.open("w", encoding="utf-8", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=fieldnames, lineterminator="\n")
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


def _read_csv(path: Path) -> list[dict[str, str]]:
    if not path.is_file():
        return []
    with path.open(encoding="utf-8", newline="") as fh:
        return list(csv.DictReader(fh))


def _pipe(values: tuple[str, ...]) -> str:
    return " | ".join(values)


def _unpipe(value: str) -> tuple[str, ...]:
    if not value:
        return ()
    return tuple(part.strip() for part in value.split("|") if part.strip())


def _opt_float(value: str) -> float | None:
    if value == "":
        return None
    return float(value)


def write_registry(root: Path, registry: Registry, manifest: dict) -> Path:
    dest = run_dir(root, registry.run_id)
    dest.mkdir(parents=True, exist_ok=True)
    _write_csv(
        dest / "parcels.csv",
        [
            "hm_id",
            "status",
            "geom_hash",
            "fingerprint",
            "area_m2",
            "rep_x",
            "rep_y",
            "minx",
            "miny",
            "maxx",
            "maxy",
            "source_ids",
            "arn_grade",
            "minted_run",
            "retired_run",
            "geometry_json",
        ],
        [
            {
                "hm_id": p.hm_id,
                "status": p.status,
                "geom_hash": p.geom_hash,
                "fingerprint": p.fingerprint,
                "area_m2": f"{p.area_m2:.6f}",
                "rep_x": f"{p.rep_x:.6f}",
                "rep_y": f"{p.rep_y:.6f}",
                "minx": f"{p.minx:.6f}",
                "miny": f"{p.miny:.6f}",
                "maxx": f"{p.maxx:.6f}",
                "maxy": f"{p.maxy:.6f}",
                "source_ids": _pipe(p.source_ids),
                "arn_grade": p.arn_grade,
                "minted_run": p.minted_run,
                "retired_run": p.retired_run or "",
                "geometry_json": json.dumps(p.geometry.to_json(), separators=(",", ":")),
            }
            for p in registry.parcels
        ],
    )
    _write_csv(
        dest / "arn_links.csv",
        ["hm_id", "arn", "npca_source_id", "grade", "iou", "method", "notes"],
        [
            {
                "hm_id": link.hm_id,
                "arn": link.arn,
                "npca_source_id": link.npca_source_id,
                "grade": link.grade,
                "iou": "" if link.iou is None else f"{link.iou:.6f}",
                "method": link.method,
                "notes": link.notes,
            }
            for link in registry.arn_links
        ],
    )
    _write_csv(
        dest / "addresses.csv",
        [
            "hm_id",
            "civic_key",
            "source_ids",
            "x",
            "y",
            "parcel_hm_id",
            "link_method",
            "status",
            "minted_run",
            "retired_run",
            "waste_seen",
        ],
        [
            {
                "hm_id": rec.hm_id,
                "civic_key": rec.civic_key,
                "source_ids": _pipe(rec.source_ids),
                "x": f"{rec.x:.6f}",
                "y": f"{rec.y:.6f}",
                "parcel_hm_id": rec.parcel_hm_id or "",
                "link_method": rec.link_method,
                "status": rec.status,
                "minted_run": rec.minted_run,
                "retired_run": rec.retired_run or "",
                "waste_seen": rec.waste_seen,
            }
            for rec in registry.addresses
        ],
    )
    overlaps = [
        ov for b in registry.buildings for ov in b.overlaps
    ]
    _write_csv(
        dest / "buildings.csv",
        [
            "hm_id",
            "geom_hash",
            "fingerprint",
            "area_m2",
            "parcel_hm_id",
            "source_ids",
            "status",
            "minted_run",
            "retired_run",
            "geometry_json",
        ],
        [
            {
                "hm_id": b.hm_id,
                "geom_hash": b.geom_hash,
                "fingerprint": b.fingerprint,
                "area_m2": f"{b.area_m2:.6f}",
                "parcel_hm_id": b.parcel_hm_id or "",
                "source_ids": _pipe(b.source_ids),
                "status": b.status,
                "minted_run": b.minted_run,
                "retired_run": b.retired_run or "",
                "geometry_json": json.dumps(b.geometry.to_json(), separators=(",", ":")),
            }
            for b in registry.buildings
        ],
    )
    _write_csv(
        dest / "building_overlaps.csv",
        ["building_hm_id", "parcel_hm_id", "area_m2"],
        [
            {
                "building_hm_id": ov.building_hm_id,
                "parcel_hm_id": ov.parcel_hm_id,
                "area_m2": f"{ov.area_m2:.6f}",
            }
            for ov in overlaps
        ],
    )
    _write_csv(
        dest / "lineage.csv",
        ["from_id", "to_id", "relation", "run_id"],
        [
            {
                "from_id": link.from_id,
                "to_id": link.to_id,
                "relation": link.relation,
                "run_id": link.run_id,
            }
            for link in registry.lineage
        ],
    )
    (dest / "MANIFEST.json").write_text(
        json.dumps(manifest, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    (Path(root) / CURRENT_NAME).write_text(registry.run_id + "\n", encoding="utf-8")
    return dest


def read_registry(root: Path, run_id: str | None = None) -> Registry | None:
    rid = run_id or current_run_id(root)
    if not rid:
        return None
    dest = run_dir(root, rid)
    if not dest.is_dir():
        return None
    manifest = json.loads((dest / "MANIFEST.json").read_text(encoding="utf-8"))
    parcels = []
    for row in _read_csv(dest / "parcels.csv"):
        geom = Geometry.from_json(json.loads(row["geometry_json"]))
        parcels.append(
            ParcelRecord(
                hm_id=row["hm_id"],
                status=row["status"],
                geom_hash=row["geom_hash"],
                fingerprint=row["fingerprint"],
                area_m2=float(row["area_m2"]),
                rep_x=float(row["rep_x"]),
                rep_y=float(row["rep_y"]),
                minx=float(row["minx"]),
                miny=float(row["miny"]),
                maxx=float(row["maxx"]),
                maxy=float(row["maxy"]),
                source_ids=_unpipe(row["source_ids"]),
                arn_grade=row["arn_grade"],
                minted_run=row["minted_run"],
                retired_run=row["retired_run"] or None,
                geometry=geom,
            )
        )
    arn_links = [
        ArnLink(
            hm_id=row["hm_id"],
            arn=row["arn"],
            npca_source_id=row["npca_source_id"],
            grade=row["grade"],
            iou=_opt_float(row["iou"]),
            method=row["method"],
            notes=row.get("notes", ""),
        )
        for row in _read_csv(dest / "arn_links.csv")
    ]
    addresses = [
        AddressRecord(
            hm_id=row["hm_id"],
            civic_key=row["civic_key"],
            source_ids=_unpipe(row["source_ids"]),
            x=float(row["x"]),
            y=float(row["y"]),
            parcel_hm_id=row["parcel_hm_id"] or None,
            link_method=row["link_method"],
            status=row["status"],
            minted_run=row["minted_run"],
            retired_run=row["retired_run"] or None,
            waste_seen=row.get("waste_seen", ""),
        )
        for row in _read_csv(dest / "addresses.csv")
    ]
    ov_by_building: dict[str, list[BuildingOverlap]] = {}
    for row in _read_csv(dest / "building_overlaps.csv"):
        ov_by_building.setdefault(row["building_hm_id"], []).append(
            BuildingOverlap(
                building_hm_id=row["building_hm_id"],
                parcel_hm_id=row["parcel_hm_id"],
                area_m2=float(row["area_m2"]),
            )
        )
    buildings = [
        BuildingRecord(
            hm_id=row["hm_id"],
            geom_hash=row["geom_hash"],
            fingerprint=row["fingerprint"],
            area_m2=float(row["area_m2"]),
            parcel_hm_id=row["parcel_hm_id"] or None,
            source_ids=_unpipe(row["source_ids"]),
            status=row["status"],
            minted_run=row["minted_run"],
            retired_run=row["retired_run"] or None,
            geometry=Geometry.from_json(json.loads(row["geometry_json"])),
            overlaps=tuple(ov_by_building.get(row["hm_id"], ())),
        )
        for row in _read_csv(dest / "buildings.csv")
    ]
    lineage = [
        LineageLink(
            from_id=row["from_id"],
            to_id=row["to_id"],
            relation=row["relation"],
            run_id=row["run_id"],
        )
        for row in _read_csv(dest / "lineage.csv")
    ]
    return Registry(
        config_name=manifest.get("config_name", "hamilton"),
        run_id=rid,
        parcels=parcels,
        arn_links=arn_links,
        addresses=addresses,
        buildings=buildings,
        lineage=lineage,
        previous_run_id=manifest.get("previous_run_id"),
    )
