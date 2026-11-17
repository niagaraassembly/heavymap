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
DEFAULT_SOURCE_GEOJSON = pathlib.Path(
    "/fast/code/making/na/local-data/hamilton-city/"
    "buildings-hamilton-2026-10-17/buildings.geojson"
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
    ("EDGE_M", "N", 12, 3),
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


def point_segment_distance(point: list[float], a: list[float], b: list[float]) -> float:
    dx, dy = b[0] - a[0], b[1] - a[1]
    if dx == 0 and dy == 0:
        return math.hypot(point[0] - a[0], point[1] - a[1])
    t = max(0.0, min(1.0, ((point[0] - a[0]) * dx + (point[1] - a[1]) * dy) / (dx * dx + dy * dy)))
    return math.hypot(point[0] - (a[0] + t * dx), point[1] - (a[1] + t * dy))


def orientation(a: list[float], b: list[float], c: list[float]) -> float:
    return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])


def segments_intersect(a: list[float], b: list[float], c: list[float], d: list[float]) -> bool:
    o1, o2, o3, o4 = orientation(a, b, c), orientation(a, b, d), orientation(c, d, a), orientation(c, d, b)
    eps = 1e-10
    if ((o1 > eps and o2 < -eps) or (o1 < -eps and o2 > eps)) and ((o3 > eps and o4 < -eps) or (o3 < -eps and o4 > eps)):
        return True
    def on_segment(p: list[float], q: list[float], r: list[float]) -> bool:
        return min(p[0], r[0]) - eps <= q[0] <= max(p[0], r[0]) + eps and min(p[1], r[1]) - eps <= q[1] <= max(p[1], r[1]) + eps
    return (abs(o1) <= eps and on_segment(a, c, b)) or (abs(o2) <= eps and on_segment(a, d, b)) or (abs(o3) <= eps and on_segment(c, a, d)) or (abs(o4) <= eps and on_segment(c, b, d))


def polygon_boundary_distance(left: dict, right_rings: list[list[list[float]]]) -> float:
    left_rings = shape_rings(left)
    best = math.inf
    for left_ring in left_rings:
        for right_ring in right_rings:
            for i, a in enumerate(left_ring[:-1]):
                b = left_ring[i + 1]
                for j, c in enumerate(right_ring[:-1]):
                    d = right_ring[j + 1]
                    if segments_intersect(a, b, c, d):
                        return 0.0
                    best = min(best, point_segment_distance(a, c, d), point_segment_distance(b, c, d), point_segment_distance(c, a, b), point_segment_distance(d, a, b))
                    if best == 0:
                        return 0.0
    return best


def geometry_points(geometry: dict) -> list[list[float]]:
    points = []
    def visit(value: object) -> None:
        if isinstance(value, list) and len(value) >= 2 and all(isinstance(item, (int, float)) for item in value[:2]):
            points.append([float(value[0]), float(value[1])])
        elif isinstance(value, list):
            for child in value:
                visit(child)
    visit(geometry.get("coordinates", []))
    return points


def equivalent_duplicate_geometry(left: dict, right: dict) -> bool:
    if left.get("type") != right.get("type"):
        return False
    left_points, right_points = geometry_points(left), geometry_points(right)
    if len(left_points) != len(right_points):
        return False
    # Source duplicates can differ by sub-millimetre decimal rounding. The
    # conservative degree conversion keeps the allowed coordinate difference
    # below one centimetre anywhere in Hamilton.
    return all(max(abs(a[0] - b[0]), abs(a[1] - b[1])) * 111320 <= 0.01 for a, b in zip(left_points, right_points))


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
    parser.add_argument("--source-geojson", type=pathlib.Path, default=DEFAULT_SOURCE_GEOJSON)
    parser.add_argument("--resume", action="store_true", help="Reuse this package directory's validated edge-distance cache and overwrite generated outputs")
    args = parser.parse_args()
    run_dir = args.registry_run.resolve()
    output = args.output.resolve()
    if output.exists() and any(output.iterdir()) and not args.resume:
        raise SystemExit(f"output must be empty: {output}")
    output.mkdir(parents=True, exist_ok=True)
    buildings_path = run_dir / "buildings.csv"
    overlaps_path = run_dir / "building_overlaps.csv"
    parcels_path = run_dir / "parcels.csv"
    if not buildings_path.is_file() or not overlaps_path.is_file() or not parcels_path.is_file():
        raise SystemExit("registry run must contain buildings.csv, building_overlaps.csv, and parcels.csv")

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
                "source_id": row["source_ids"],
            }
    print(f"Loaded {len(buildings):,} active building registry rows", flush=True)

    parcels: dict[str, dict] = {}
    with parcels_path.open(encoding="utf-8", newline="") as src:
        for row in csv.DictReader(src):
            if row["status"] == "active":
                parcels[row["ia_id"]] = {
                    "area_m2": float(row["area_m2"]),
                    "geometry": json.loads(row["geometry_json"]),
                }
    print(f"Loaded {len(parcels):,} active parcel geometries", flush=True)

    best_overlap: dict[str, tuple[float, str]] = {}
    all_overlaps: list[dict] = []
    overlap_counts: Counter[str] = Counter()
    parcel_intersection_counts: Counter[str] = Counter()
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
            parcel_intersection_counts[parcel_id] += 1
            current = best_overlap.get(building_id)
            if current is None or (-area, parcel_id) < (-current[0], current[1]):
                best_overlap[building_id] = (area, parcel_id)
            all_overlaps.append({"building_id": building_id, "parcel_id": parcel_id, "area_m2": area})
    print(f"Read {len(all_overlaps):,} positive building-parcel intersections", flush=True)

    for building_id, best in best_overlap.items():
        buildings[building_id]["parcel_id"] = best[1]
        buildings[building_id]["primary_overlap_m2"] = best[0]
        by_parcel[best[1]].append(building_id)

    edge_cache = output / "building_edge_distances.csv"
    edge_distances: dict[str, float] = {}
    if args.resume and edge_cache.is_file():
        with edge_cache.open(encoding="utf-8", newline="") as src:
            edge_distances = {row["building_id"]: float(row["edge_distance_m"]) for row in csv.DictReader(src)}
        if set(edge_distances) != set(best_overlap):
            raise ValueError("saved edge-distance cache does not match the current assigned building set")
        print(f"Reused {len(edge_distances):,} cached building-to-parcel boundary distances", flush=True)
    else:
        parcel_boundary_rings = {
            parcel_id: shape_rings(parcels[parcel_id]["geometry"])
            for parcel_id in by_parcel
        }
        for parcel_id, member_ids in by_parcel.items():
            for building_id in member_ids:
                if buildings[building_id]["area_m2"] > parcels[parcel_id]["area_m2"]:
                    # With a positive registered intersection, a footprint
                    # larger than the entire parcel either crosses or covers
                    # its boundary; its polygon area therefore reaches that line.
                    edge_distances[building_id] = 0.0
                else:
                    edge_distances[building_id] = polygon_boundary_distance(
                        buildings[building_id]["geometry"], parcel_boundary_rings[parcel_id]
                    )
        write_csv(edge_cache, ["building_id", "edge_distance_m"], [
            {"building_id": building_id, "edge_distance_m": f"{distance:.6f}"}
            for building_id, distance in sorted(edge_distances.items())
        ])
        print(f"Measured and cached {len(edge_distances):,} building-to-parcel boundary distances", flush=True)
    for building in buildings.values():
        if building["stored_parcel_id"] != building.get("parcel_id", ""):
            declared_order_mismatches += 1

    rank_rows: list[dict[str, str]] = []
    parcel_rows: list[dict[str, str]] = []
    parcel_facts: dict[str, dict] = {}
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
        sizes = sorted(buildings[item]["area_m2"] for item in member_ids)
        distances = sorted(edge_distances[item] for item in member_ids)
        parcel_facts[parcel_id] = {
            "parcel_area_m2": round(parcels[parcel_id]["area_m2"], 3),
            "assigned_building_count": len(member_ids),
            "intersecting_building_count": parcel_intersection_counts[parcel_id],
            "multi_parcel_building_count": sum(overlap_counts[item] > 1 for item in member_ids),
            "assigned_footprint_area_sum_m2": round(sum(sizes), 3),
            "median_footprint_area_m2": round(sizes[(len(sizes) - 1) // 2], 3),
            "largest_footprint_area_m2": round(sizes[-1], 3),
            "nearest_building_edge_m": round(distances[0], 3),
            "median_building_edge_distance_m": round(distances[(len(distances) - 1) // 2], 3),
            "buildings_within_1m_of_parcel_edge": sum(distance <= 1 for distance in distances),
            "buildings_within_3m_of_parcel_edge": sum(distance <= 3 for distance in distances),
            "buildings_within_5m_of_parcel_edge": sum(distance <= 5 for distance in distances),
        }

    for parcel_id, parcel in parcels.items():
        parcel_facts.setdefault(parcel_id, {
            "parcel_area_m2": round(parcel["area_m2"], 3),
            "assigned_building_count": 0,
            "intersecting_building_count": parcel_intersection_counts[parcel_id],
            "multi_parcel_building_count": 0,
            "assigned_footprint_area_sum_m2": 0,
            "median_footprint_area_m2": None,
            "largest_footprint_area_m2": None,
            "nearest_building_edge_m": None,
            "median_building_edge_distance_m": None,
            "buildings_within_1m_of_parcel_edge": 0,
            "buildings_within_3m_of_parcel_edge": 0,
            "buildings_within_5m_of_parcel_edge": 0,
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

    # Keep map geometry in a separate, screened WGS84 stream. Numeric parcel
    # facts are sharded by the final ULID character for small on-demand loads.
    source_path = args.source_geojson.resolve()
    if not source_path.is_file():
        raise SystemExit(f"source GeoJSON not found: {source_path}")
    oid_to_building = {
        source_id.strip(): building_id
        for building_id, row in buildings.items()
        for source_id in row["source_id"].split("|")
    }
    source_doc = json.loads(source_path.read_text(encoding="utf-8"))
    mapped_source_ids: set[str] = set()
    source_geometries: dict[str, dict] = {}
    duplicate_source_rows_skipped = 0
    ranked_ndjson = output / "hamilton_buildings_ranked_wgs84.ndjson"
    with ranked_ndjson.open("w", encoding="utf-8") as dest:
        for feature in source_doc.get("features", []):
            props = feature.get("properties") or {}
            building_id = oid_to_building.get(str(props.get("OBJECTID", "")))
            if not building_id or not feature.get("geometry"):
                continue
            if building_id in mapped_source_ids:
                if not equivalent_duplicate_geometry(source_geometries[building_id], feature["geometry"]):
                    raise ValueError(f"duplicate source OBJECTID rows differ geometrically for {building_id}")
                duplicate_source_rows_skipped += 1
                continue
            mapped_source_ids.add(building_id)
            source_geometries[building_id] = feature["geometry"]
            row = rank_by_id[building_id]
            safe = {
                "BUILD_ID": building_id,
                "PARCEL_ID": row["parcel_id"] or None,
                "BUILD_NO": int(row["building_no"]) if row["building_no"] else None,
                "AREA_M2": round(buildings[building_id]["area_m2"], 3),
                "OVL_M2": round(buildings[building_id]["primary_overlap_m2"], 3) if row["parcel_id"] else None,
                "N_PARCELS": overlap_counts[building_id],
                "EDGE_M": round(edge_distances[building_id], 3) if building_id in edge_distances else None,
            }
            dest.write(json.dumps({"type":"Feature","geometry":feature["geometry"],"properties":safe},separators=(",",":")) + "\n")
    if mapped_source_ids != set(buildings):
        raise ValueError(f"source-ID crosswalk mismatch: mapped {len(mapped_source_ids)} of {len(buildings)} active registry buildings")
    print(f"Wrote {len(mapped_source_ids):,} screened WGS84 map features; skipped {duplicate_source_rows_skipped:,} duplicate source rows", flush=True)

    facts_dir = output / "parcel-building-facts"
    facts_dir.mkdir(exist_ok=True)
    facts_by_suffix: dict[str, dict] = defaultdict(dict)
    for parcel_id, facts in parcel_facts.items():
        facts_by_suffix[parcel_id[-2:].lower()][parcel_id] = facts
    for suffix, rows in facts_by_suffix.items():
        (facts_dir / f"{suffix}.json").write_text(json.dumps(rows,separators=(",",":"))+"\n",encoding="utf-8")
    (output / "parcel-building-facts-index.json").write_text(json.dumps({
        "schema": 1,
        "source_date": "2026-10-17",
        "method": "Greatest-positive-intersection parcel assignment; footprint area from registered plan-view polygons; minimum distance from footprint area to the parcel boundary line, in EPSG:26917 metres.",
        "shards": sorted(facts_by_suffix),
        "parcel_count": len(parcel_facts),
        "definitions": {
            "assigned_footprint_area_sum_m2": "Sum of whole plan-view areas for footprints assigned to this parcel; not parcel coverage, because overlaps may double-count.",
            "edge_distance": "Minimum distance from the assigned building footprint polygon to the parcel boundary line. A boundary that touches, crosses, or lies inside the footprint has distance 0 m.",
            "intersecting_building_count": "Count of all footprints with a positive registered intersection on the parcel, including secondary overlaps; assigned size and edge-distance summaries use primary assignments only.",
        },
    },indent=2)+"\n",encoding="utf-8")

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
                "EDGE_M": edge_distances.get(building_id),
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
            "parcels.csv": {"sha256": sha256(parcels_path), "active_rows_used": len(parcels)},
            "source_geojson": {"sha256": sha256(source_path), "feature_count": len(source_doc.get("features", [])), "path": str(source_path)},
        },
        "processing": {
            "working_crs": "EPSG:26917",
            "primary_parcel_rule": "Parcel with the greatest positive footprint intersection area; ties resolve by lexical parcel_id.",
            "size_measure": "Full registered footprint polygon area in square metres, not floor area or gross floor area.",
            "building_number_rule": "Within each primary parcel, sort by full footprint area descending, then stable building_id ascending. Assign 1-based sequential building_no. Exact area ties are counted in equal_area_tie_count.",
            "building_id_rule": "Retain the stable Industrial Atlas footprint ID; building_no is a display rank and may change after a source refresh.",
            "secondary_links": "Every nonzero building-parcel intersection is retained in building_parcel_overlaps.csv, including the primary assignment flag.",
            "parcel_facts": "All active parcel IDs have a row, including zero-building parcels. Size uses full plan-view area; edge distance is the minimum polygon-boundary distance in EPSG:26917 metres, where touch/cross is 0 m.",
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
            "active_parcels": len(parcels),
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
            "This package supports the owner-authorized public layer-set-003 release. City source data remains as supplied and is not a legal boundary determination.",
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
        "`parcel_building_summary.csv` gives assigned footprint counts and area totals per parcel. "
        "`parcel-building-facts-index.json` and its two-character ULID-suffix shards provide modal facts for all active parcels, "
        "including footprint size and building-to-parcel-edge distance. `hamilton_buildings_ranked_wgs84.ndjson` "
        "is the screened WGS84 stream for interactive tiles.\n\n"
        "`AREA_M2` is plan-view polygon area, not floor area or gross floor area. The source was pulled "
        "2026-10-17; the service metadata records a 2026-10-06 data edit. Source labels and row IDs are "
        "screened from the export. See `manifest.json` for hashes, rules, counts, source metadata and limitations.\n",
        encoding="utf-8",
    )
    manifest["outputs"] = {}
    for path in sorted(p for p in output.rglob("*") if p.is_file() and p.name != "manifest.json"):
        manifest["outputs"][path.relative_to(output).as_posix()] = {"bytes": path.stat().st_size, "sha256": sha256(path)}
    (output / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(manifest["counts"], indent=2))
    print(f"Shapefile: {zip_path} ({zip_path.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
