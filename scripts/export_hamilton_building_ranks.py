#!/usr/bin/env python3
"""Export Hamilton building footprints with parcel links and per-parcel size ranks.

The source registry stays immutable. This writes a local shapefile package plus
CSV relationship tables from a pinned registry run. It uses only the standard
library so the export can be reproduced on Deb without a GIS runtime.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import json
import math
import pathlib
import struct
import zipfile
from collections import Counter, defaultdict
from datetime import datetime, timezone


DEFAULT_RUN = pathlib.Path(
    "/fast/code/making/na/local-data/heavymap-registry/hamilton/runs/"
    "20261017T0725Z-run2-ia1"
)
DEFAULT_OUTPUT = pathlib.Path(
    "/fast/code/making/na/local-data/heavymap-buildings/hamilton/2026-11-17-v1"
)
PRJ = (
    'PROJCS["NAD83 / UTM zone 17N",GEOGCS["NAD83",'
    'DATUM["North_American_Datum_1983",SPHEROID["GRS 1980",'
    '6378137,298.257222101]],PRIMEM["Greenwich",0],UNIT["degree",'
    '0.0174532925199433]],PROJECTION["Transverse_Mercator"],'
    'PARAMETER["latitude_of_origin",0],PARAMETER["central_meridian",-81],'
    'PARAMETER["scale_factor",0.9996],PARAMETER["false_easting",500000],'
    'PARAMETER["false_northing",0],UNIT["metre",1],AUTHORITY["EPSG","26917"]]'
)
DBF_FIELDS = [
    ("BUILD_ID", "C", 64, 0),
    ("PARCEL_ID", "C", 64, 0),
    ("BUILD_NO", "N", 8, 0),
    ("AREA_M2", "N", 18, 6),
    ("OVL_M2", "N", 18, 6),
    ("OVL_SHARE", "N", 10, 6),
    ("N_PARCELS", "N", 8, 0),
    ("TIE_SIZE", "N", 8, 0),
]


def sha256(path: pathlib.Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as src:
        for block in iter(lambda: src.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def write_csv(path: pathlib.Path, header: list[str], rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as dest:
        writer = csv.DictWriter(dest, fieldnames=header, lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)


def ring_area(ring: list[list[float]]) -> float:
    return sum(
        ring[i][0] * ring[(i + 1) % len(ring)][1]
        - ring[(i + 1) % len(ring)][0] * ring[i][1]
        for i in range(len(ring))
    ) / 2


def shape_rings(geometry: dict) -> list[list[list[float]]]:
    kind = geometry.get("type")
    coordinates = geometry.get("coordinates") or []
    polygons = [coordinates] if kind == "Polygon" else coordinates if kind == "MultiPolygon" else None
    if polygons is None:
        raise ValueError(f"expected Polygon or MultiPolygon, got {kind!r}")
    result = []
    for polygon in polygons:
        for index, raw_ring in enumerate(polygon):
            ring = [[float(point[0]), float(point[1])] for point in raw_ring]
            if len(ring) < 4 or ring[0] != ring[-1]:
                raise ValueError("polygon ring is short or open")
            area = ring_area(ring)
            # ESRI shapefiles encode shells clockwise and holes counter-clockwise.
            should_be_positive = index > 0
            if (area > 0) != should_be_positive:
                ring.reverse()
            result.append(ring)
    if not result:
        raise ValueError("empty polygon geometry")
    return result


def shp_header(file_length_words: int, bounds: tuple[float, float, float, float]) -> bytes:
    return struct.pack(">7i", 9994, 0, 0, 0, 0, 0, file_length_words) + struct.pack(
        "<2i8d", 1000, 5, *bounds, 0, 0, 0, 0
    )


def dbf_header(record_count: int) -> tuple[bytes, int]:
    header_length = 32 + 32 * len(DBF_FIELDS) + 1
    record_length = 1 + sum(field[2] for field in DBF_FIELDS)
    now = datetime.now(timezone.utc)
    header = bytearray(32)
    header[0] = 0x03
    header[1:4] = bytes((now.year - 1900, now.month, now.day))
    struct.pack_into("<IHH", header, 4, record_count, header_length, record_length)
    header[29] = 0x57
    descriptors = bytearray()
    for name, kind, width, decimals in DBF_FIELDS:
        field = bytearray(32)
        encoded_name = name.encode("ascii")[:10]
        field[: len(encoded_name)] = encoded_name
        field[11] = ord(kind)
        field[16] = width
        field[17] = decimals
        descriptors.extend(field)
    return bytes(header + descriptors + b"\r"), record_length


def dbf_value(value: object, kind: str, width: int, decimals: int) -> bytes:
    if value is None or value == "":
        return b" " * width
    if kind == "C":
        encoded = str(value).encode("ascii")
        if len(encoded) > width:
            raise ValueError(f"DBF text value is too wide: {value!r}")
        return encoded.ljust(width, b" ")
    if decimals:
        rendered = f"{float(value):.{decimals}f}"
    else:
        rendered = str(int(value))
    encoded = rendered.encode("ascii")
    if len(encoded) > width:
        raise ValueError(f"DBF numeric value is too wide: {rendered}")
    return encoded.rjust(width, b" ")


def write_shapefile(path: pathlib.Path, features: list[dict]) -> dict:
    path.parent.mkdir(parents=True, exist_ok=True)
    shp_path = path.with_suffix(".shp")
    shx_path = path.with_suffix(".shx")
    dbf_path = path.with_suffix(".dbf")
    bounds = [math.inf, math.inf, -math.inf, -math.inf]
    shape_records: list[tuple[int, int]] = []
    shp_offset_words = 50
    total_points = 0

    with shp_path.open("wb") as shp, shx_path.open("wb") as shx:
        shp.write(b"\0" * 100)
        shx.write(b"\0" * 100)
        for record_number, feature in enumerate(features, start=1):
            rings = shape_rings(feature["geometry"])
            flat = [point for ring in rings for point in ring]
            record_bounds = (
                min(point[0] for point in flat),
                min(point[1] for point in flat),
                max(point[0] for point in flat),
                max(point[1] for point in flat),
            )
            bounds[0] = min(bounds[0], record_bounds[0])
            bounds[1] = min(bounds[1], record_bounds[1])
            bounds[2] = max(bounds[2], record_bounds[2])
            bounds[3] = max(bounds[3], record_bounds[3])
            parts = []
            offset = 0
            for ring in rings:
                parts.append(offset)
                offset += len(ring)
            content = bytearray(struct.pack("<i4d2i", 5, *record_bounds, len(parts), len(flat)))
            content.extend(struct.pack(f"<{len(parts)}i", *parts))
            for x, y in flat:
                content.extend(struct.pack("<2d", x, y))
            content_words = len(content) // 2
            shp.write(struct.pack(">2i", record_number, content_words))
            shp.write(content)
            shx.write(struct.pack(">2i", shp_offset_words, content_words))
            shp_offset_words += 4 + content_words
            shape_records.append((record_number, content_words))
            total_points += len(flat)
        final_bounds = tuple(bounds)
        shp.seek(0)
        shp.write(shp_header(shp_offset_words, final_bounds))
        shx.seek(0)
        shx.write(shp_header(50 + 4 * len(shape_records), final_bounds))

    header, record_length = dbf_header(len(features))
    with dbf_path.open("wb") as dbf:
        dbf.write(header)
        for feature in features:
            attrs = feature["properties"]
            dbf.write(b" ")
            for name, kind, width, decimals in DBF_FIELDS:
                dbf.write(dbf_value(attrs.get(name), kind, width, decimals))
        dbf.write(b"\x1a")
    path.with_suffix(".prj").write_text(PRJ + "\n", encoding="ascii")
    path.with_suffix(".cpg").write_text("UTF-8\n", encoding="ascii")
    return {
        "feature_count": len(features),
        "point_count": total_points,
        "bounds_epsg26917": list(final_bounds),
        "dbf_record_length": record_length,
        "files": [shp_path, shx_path, dbf_path, path.with_suffix(".prj"), path.with_suffix(".cpg")],
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--registry-run", type=pathlib.Path, default=DEFAULT_RUN)
    parser.add_argument("--output", type=pathlib.Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    run_dir = args.registry_run.resolve()
    output = args.output.resolve()
    if output.exists() and any(output.iterdir()):
        raise SystemExit(f"output must be empty: {output}")
    output.mkdir(parents=True, exist_ok=True)
    buildings_path = run_dir / "buildings.csv"
    overlaps_path = run_dir / "building_overlaps.csv"
    if not buildings_path.is_file() or not overlaps_path.is_file():
        raise SystemExit("registry run must contain buildings.csv and building_overlaps.csv")

    buildings: dict[str, dict] = {}
    with buildings_path.open(encoding="utf-8", newline="") as src:
        for row in csv.DictReader(src):
            if row["status"] != "active":
                continue
            building_id = row["ia_id"]
            buildings[building_id] = {
                "building_id": building_id,
                "area_m2": float(row["area_m2"]),
                "stored_parcel_id": row["parcel_ia_id"],
                "geometry": json.loads(row["geometry_json"]),
            }

    best_overlap: dict[str, tuple[float, str]] = {}
    all_overlaps: list[dict] = []
    overlap_counts: Counter[str] = Counter()
    by_parcel: dict[str, list[str]] = defaultdict(list)
    declared_order_mismatches = 0
    nonpositive_overlap_rows = 0
    with overlaps_path.open(encoding="utf-8", newline="") as src:
        for row in csv.DictReader(src):
            building_id, parcel_id = row["building_ia_id"], row["parcel_ia_id"]
            if building_id not in buildings:
                raise ValueError(f"overlap refers to inactive/unknown building {building_id}")
            area = float(row["area_m2"])
            if area <= 0:
                nonpositive_overlap_rows += 1
                continue
            overlap_counts[building_id] += 1
            current = best_overlap.get(building_id)
            if current is None or (-area, parcel_id) < (-current[0], current[1]):
                best_overlap[building_id] = (area, parcel_id)
            all_overlaps.append({"building_id": building_id, "parcel_id": parcel_id, "area_m2": area})

    for building_id, best in best_overlap.items():
        buildings[building_id]["parcel_id"] = best[1]
        buildings[building_id]["primary_overlap_m2"] = best[0]
        by_parcel[best[1]].append(building_id)
    for building in buildings.values():
        if building["stored_parcel_id"] != building.get("parcel_id", ""):
            declared_order_mismatches += 1

    rank_rows: list[dict[str, str]] = []
    parcel_rows: list[dict[str, str]] = []
    tie_counts: dict[str, int] = {}
    for parcel_id, member_ids in by_parcel.items():
        member_ids.sort(key=lambda item: (-buildings[item]["area_m2"], item))
        sizes = Counter(buildings[item]["area_m2"] for item in member_ids)
        for rank, building_id in enumerate(member_ids, start=1):
            building = buildings[building_id]
            area = building["area_m2"]
            tie_count = sizes[area]
            tie_counts[building_id] = tie_count
            overlap = building["primary_overlap_m2"]
            rank_rows.append({
                "building_id": building_id,
                "parcel_id": parcel_id,
                "building_no": str(rank),
                "rank_scope": "parcel",
                "footprint_area_m2": f"{area:.6f}",
                "primary_overlap_area_m2": f"{overlap:.6f}",
                "primary_overlap_share": f"{overlap / area:.8f}" if area > 0 else "",
                "overlapping_parcel_count": str(overlap_counts[building_id]),
                "equal_area_tie_count": str(tie_count),
            })
        parcel_rows.append({
            "parcel_id": parcel_id,
            "building_count": str(len(member_ids)),
            "total_assigned_footprint_area_m2": f"{sum(buildings[item]['area_m2'] for item in member_ids):.6f}",
            "largest_building_area_m2": f"{buildings[member_ids[0]]['area_m2']:.6f}",
            "multi_parcel_building_count": str(sum(overlap_counts[item] > 1 for item in member_ids)),
        })

    linked_ids = set(best_overlap)
    for building_id, building in buildings.items():
        if building_id in linked_ids:
            continue
        rank_rows.append({
            "building_id": building_id,
            "parcel_id": "",
            "building_no": "",
            "rank_scope": "parcel",
            "footprint_area_m2": f"{building['area_m2']:.6f}",
            "primary_overlap_area_m2": "",
            "primary_overlap_share": "",
            "overlapping_parcel_count": "0",
            "equal_area_tie_count": "",
        })
    rank_rows.sort(key=lambda row: (row["parcel_id"] == "", row["parcel_id"], int(row["building_no"] or 0), row["building_id"]))
    parcel_rows.sort(key=lambda row: row["parcel_id"])
    all_overlaps.sort(key=lambda row: (row["building_id"], -row["area_m2"], row["parcel_id"]))

    rank_by_id = {row["building_id"]: row for row in rank_rows}
    write_csv(output / "building_parcel_ranks.csv", [
        "building_id", "parcel_id", "building_no", "rank_scope", "footprint_area_m2",
        "primary_overlap_area_m2", "primary_overlap_share", "overlapping_parcel_count", "equal_area_tie_count",
    ], rank_rows)
    overlap_rows = []
    for row in all_overlaps:
        base = buildings[row["building_id"]]["area_m2"]
        rank = rank_by_id[row["building_id"]]
        overlap_rows.append({
            "building_id": row["building_id"],
            "parcel_id": row["parcel_id"],
            "intersection_area_m2": f"{row['area_m2']:.6f}",
            "building_area_m2": f"{base:.6f}",
            "building_overlap_share": f"{row['area_m2'] / base:.8f}" if base > 0 else "",
            "is_primary_assignment": "true" if rank["parcel_id"] == row["parcel_id"] else "false",
            "building_no_on_primary_parcel": rank["building_no"] if rank["parcel_id"] == row["parcel_id"] else "",
        })
    write_csv(output / "building_parcel_overlaps.csv", [
        "building_id", "parcel_id", "intersection_area_m2", "building_area_m2",
        "building_overlap_share", "is_primary_assignment", "building_no_on_primary_parcel",
    ], overlap_rows)
    write_csv(output / "parcel_building_summary.csv", [
        "parcel_id", "building_count", "total_assigned_footprint_area_m2",
        "largest_building_area_m2", "multi_parcel_building_count",
    ], parcel_rows)

    features = []
    for building_id, building in buildings.items():
        rank = rank_by_id[building_id]
        features.append({
            "geometry": building["geometry"],
            "properties": {
                "BUILD_ID": building_id,
                "PARCEL_ID": rank["parcel_id"],
                "BUILD_NO": rank["building_no"],
                "AREA_M2": building["area_m2"],
                "OVL_M2": building.get("primary_overlap_m2"),
                "OVL_SHARE": float(rank["primary_overlap_share"]) if rank["primary_overlap_share"] else None,
                "N_PARCELS": overlap_counts[building_id],
                "TIE_SIZE": tie_counts.get(building_id),
            },
        })
    shape_info = write_shapefile(output / "hamilton_buildings_ranked", features)
    zip_path = output / "hamilton_buildings_ranked_shapefile.zip"
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
        for path in shape_info["files"]:
            archive.write(path, path.name)

    linked_count = len(linked_ids)
    multi_count = sum(count > 1 for count in overlap_counts.values())
    manifest = {
        "schema": "hamilton-building-footprint-parcel-rank/v1",
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "jurisdiction": "Hamilton, Ontario, Canada",
        "source": {
            "publisher": "City of Hamilton",
            "layer": "Buildings (FeatureServer/8)",
            "url": "https://services.arcgis.com/rYz782eMbySr2srL/arcgis/rest/services/Buildings/FeatureServer/8",
            "source_pull_date": "2026-10-17",
            "data_last_edit": "2026-10-06",
            "raw_feature_count": 214292,
            "metadata_url": "https://services.arcgis.com/rYz782eMbySr2srL/arcgis/rest/services/Buildings/FeatureServer/8/metadata?f=html&format=default",
        },
        "inputs": {
            "registry_run_id": "20261017T0725Z-run2-ia1",
            "buildings.csv": {"sha256": sha256(buildings_path), "active_rows_used": len(buildings)},
            "building_overlaps.csv": {"sha256": sha256(overlaps_path), "overlap_rows_used": len(all_overlaps)},
        },
        "processing": {
            "working_crs": "EPSG:26917",
            "primary_parcel_rule": "Parcel with the greatest positive footprint intersection area; ties resolve by lexical parcel_id.",
            "size_measure": "Full registered footprint polygon area in square metres, not floor area or gross floor area.",
            "building_number_rule": "Within each primary parcel, sort by full footprint area descending, then stable building_id ascending. Assign 1-based sequential building_no. Exact area ties are counted in equal_area_tie_count.",
            "building_id_rule": "Retain the stable Industrial Atlas footprint ID; building_no is a display rank and may change after a source refresh.",
            "secondary_links": "Every nonzero building-parcel intersection is retained in building_parcel_overlaps.csv, including the primary assignment flag.",
            "source_fields_screened": ["NAME", "OBJECTID", "Shape__Area", "Shape__Length", "source_ids"],
            "shape_fields": {name: {"type": kind, "width": width, "decimals": decimals} for name, kind, width, decimals in DBF_FIELDS},
        },
        "counts": {
            "active_footprints": len(buildings),
            "assigned_to_parcel": linked_count,
            "unassigned": len(buildings) - linked_count,
            "primary_assigned_parcels": len(by_parcel),
            "building_parcel_intersections": len(all_overlaps),
            "nonpositive_intersection_rows_ignored": nonpositive_overlap_rows,
            "footprints_intersecting_multiple_parcels": multi_count,
            "stored_primary_assignment_mismatches": declared_order_mismatches,
            "parcels_with_assigned_buildings": len(parcel_rows),
            "parcels_with_no_assigned_buildings": 166745 - len(parcel_rows),
        },
        "geometry": {**shape_info, "files": [path.name for path in shape_info["files"]]},
        "limitations": [
            "The source layer is digitized from aerial photography; most residential footprints are best-fit rectangles and smaller units such as sheds may be absent.",
            "Footprint area is not building floor area, gross floor area, height, occupancy, or current use.",
            "Buildings spanning parcels are assigned to one primary parcel by greatest overlap for ranking; all secondary intersections remain available in the overlap table.",
            "The assigned building number is local to the parcel and is not a persistent identity. Use building_id for cross-release references.",
            "The registry profile records one invalid polygon and seven duplicate geometry rows; geometries are retained as present in the registry and are not silently repaired or dropped.",
            "This is a local working export. It does not constitute publication or jurisdiction sign-off.",
        ],
    }
    (output / "README.md").write_text(
        "# Hamilton building footprints with parcel links and ranks\n\n"
        "This local package contains one stable-ID footprint per active registry building. "
        "Each linked footprint has a primary parcel chosen by greatest positive intersection area. "
        "Within that parcel, `building_no` is a one-based size rank: largest footprint first; exact ties "
        "are ordered by stable building ID and reported in `equal_area_tie_count`. `building_id` is the "
        "cross-release identity; the number is a display label and can change when the source changes.\n\n"
        "`hamilton_buildings_ranked_shapefile.zip` contains an EPSG:26917 polygon shapefile. "
        "`building_parcel_ranks.csv` contains one row per active footprint, including unassigned footprints. "
        "`building_parcel_overlaps.csv` preserves every nonzero parcel intersection, including secondary links. "
        "`parcel_building_summary.csv` gives assigned footprint counts and area totals per parcel.\n\n"
        "`AREA_M2` is plan-view polygon area, not floor area or gross floor area. The source was pulled "
        "2026-10-17; the service metadata records a 2026-10-06 data edit. Source labels and row IDs are "
        "screened from the export. See `manifest.json` for hashes, rules, counts, source metadata and limitations.\n",
        encoding="utf-8",
    )
    manifest["outputs"] = {}
    for path in sorted(p for p in output.iterdir() if p.is_file() and p.name != "manifest.json"):
        manifest["outputs"][path.name] = {"bytes": path.stat().st_size, "sha256": sha256(path)}
    (output / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(manifest["counts"], indent=2))
    print(f"Shapefile: {zip_path} ({zip_path.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
