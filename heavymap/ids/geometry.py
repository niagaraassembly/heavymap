"""Stdlib geometry for the HeavyMap ID registry.

Tests use simple polygons (usually axis-aligned rectangles). Optional shapely
is used for general-polygon overlap when present; otherwise overlap of
non-rectangles is a deterministic raster of the overlapping bbox. Point-in-
polygon, area, translation, distance and fingerprints are always exact.
"""

from __future__ import annotations

import hashlib
import json
import math
from dataclasses import dataclass
from typing import Iterable, Sequence

try:
    from shapely.geometry import Polygon as ShapelyPolygon
except ImportError:  # pragma: no cover - optional extra
    ShapelyPolygon = None


Point = tuple[float, float]
Ring = tuple[Point, ...]


class GeometryError(ValueError):
    def __init__(self, code: str, detail: str = ""):
        self.code = code
        self.detail = detail
        super().__init__(code if not detail else f"{code}: {detail}")


def _close(ring: Sequence[Point]) -> list[Point]:
    pts = [(float(x), float(y)) for x, y in ring]
    if not pts:
        raise GeometryError("empty_ring")
    if pts[0] != pts[-1]:
        pts.append(pts[0])
    if len(pts) < 4:
        raise GeometryError("ring_too_short")
    return pts


def _open(ring: Sequence[Point]) -> list[Point]:
    pts = _close(ring)
    return pts[:-1]


def _signed_area(ring: Sequence[Point]) -> float:
    pts = _close(ring)
    total = 0.0
    for (x1, y1), (x2, y2) in zip(pts, pts[1:]):
        total += x1 * y2 - x2 * y1
    return total / 2.0


def _canonical_open_ring(ring: Sequence[Point], ndigits: int) -> tuple[Point, ...]:
    pts = [(round(x, ndigits), round(y, ndigits)) for x, y in _open(ring)]
    # Drop consecutive duplicates after rounding.
    cleaned: list[Point] = []
    for pt in pts:
        if not cleaned or cleaned[-1] != pt:
            cleaned.append(pt)
    if len(cleaned) >= 2 and cleaned[0] == cleaned[-1]:
        cleaned.pop()
    if not cleaned:
        return tuple()
    start = min(range(len(cleaned)), key=lambda i: cleaned[i])
    rotated = cleaned[start:] + cleaned[:start]
    if _signed_area(rotated) < 0:
        rotated = [rotated[0]] + list(reversed(rotated[1:]))
    return tuple(rotated)


@dataclass(frozen=True)
class Bounds:
    minx: float
    miny: float
    maxx: float
    maxy: float

    def intersects(self, other: "Bounds") -> bool:
        return not (
            self.maxx < other.minx
            or self.minx > other.maxx
            or self.maxy < other.miny
            or self.miny > other.maxy
        )

    def width(self) -> float:
        return self.maxx - self.minx

    def height(self) -> float:
        return self.maxy - self.miny


@dataclass(frozen=True)
class Geometry:
    """A point, a single polygon, or a multipolygon in a projected CRS."""

    parts: tuple[Ring, ...]
    kind: str = "polygon"  # polygon | point

    @staticmethod
    def from_ring(ring: Sequence[Point]) -> "Geometry":
        return Geometry(parts=(tuple(_close(ring)),), kind="polygon")

    @staticmethod
    def from_rings(rings: Iterable[Sequence[Point]]) -> "Geometry":
        parts = tuple(tuple(_close(ring)) for ring in rings)
        if not parts:
            raise GeometryError("empty_geometry")
        return Geometry(parts=parts, kind="polygon")

    @staticmethod
    def point(x: float, y: float) -> "Geometry":
        return Geometry(parts=((float(x), float(y)),), kind="point")

    @staticmethod
    def box(x0: float, y0: float, x1: float, y1: float) -> "Geometry":
        minx, maxx = (x0, x1) if x0 <= x1 else (x1, x0)
        miny, maxy = (y0, y1) if y0 <= y1 else (y1, y0)
        return Geometry.from_ring(
            ((minx, miny), (maxx, miny), (maxx, maxy), (minx, maxy), (minx, miny))
        )

    def translate(self, dx: float, dy: float) -> "Geometry":
        if self.kind == "point":
            x, y = self.parts[0]
            return Geometry.point(x + dx, y + dy)
        parts = tuple(
            tuple((x + dx, y + dy) for x, y in ring) for ring in self.parts
        )
        return Geometry(parts=parts, kind="polygon")

    @property
    def x(self) -> float:
        if self.kind != "point":
            raise GeometryError("not_a_point")
        return self.parts[0][0]

    @property
    def y(self) -> float:
        if self.kind != "point":
            raise GeometryError("not_a_point")
        return self.parts[0][1]

    @property
    def bounds(self) -> Bounds:
        if self.kind == "point":
            x, y = self.parts[0]
            return Bounds(x, y, x, y)
        xs = [x for ring in self.parts for x, _ in ring]
        ys = [y for ring in self.parts for _, y in ring]
        return Bounds(min(xs), min(ys), max(xs), max(ys))

    @property
    def area(self) -> float:
        if self.kind == "point":
            return 0.0
        return sum(abs(_signed_area(ring)) for ring in self.parts)

    def contains_point(self, x: float, y: float) -> bool:
        if self.kind == "point":
            return self.x == x and self.y == y
        return any(_point_in_ring(x, y, ring) for ring in self.parts)

    def representative_point(self) -> Point:
        if self.kind == "point":
            return (self.x, self.y)
        ring = max(self.parts, key=lambda r: abs(_signed_area(r)))
        cx, cy = _ring_centroid(ring)
        if self.contains_point(cx, cy):
            return (cx, cy)
        b = self.bounds
        # Scan the bbox; first interior sample wins. Fine for test fixtures.
        for n in (5, 11, 21, 41):
            for i in range(n):
                for j in range(n):
                    x = b.minx + (i + 0.5) * b.width() / n
                    y = b.miny + (j + 0.5) * b.height() / n
                    if self.contains_point(x, y):
                        return (x, y)
        # Last resort: first vertex (still a matching aid, not an ID).
        return ring[0]

    def distance_to_point(self, x: float, y: float) -> float:
        if self.contains_point(x, y):
            return 0.0
        if self.kind == "point":
            return math.hypot(self.x - x, self.y - y)
        best = float("inf")
        for ring in self.parts:
            pts = _close(ring)
            for (ax, ay), (bx, by) in zip(pts, pts[1:]):
                best = min(best, _point_segment_distance(x, y, ax, ay, bx, by))
        return best

    def as_rect(self) -> Bounds | None:
        """Return bounds if this is a single axis-aligned rectangle."""

        if self.kind != "polygon" or len(self.parts) != 1:
            return None
        pts = _open(self.parts[0])
        if len(pts) != 4:
            return None
        xs = {p[0] for p in pts}
        ys = {p[1] for p in pts}
        if len(xs) != 2 or len(ys) != 2:
            return None
        b = self.bounds
        if abs(self.area - b.width() * b.height()) > 1e-9:
            return None
        return b

    def to_json(self) -> dict:
        if self.kind == "point":
            return {"type": "Point", "coordinates": [self.x, self.y]}
        if len(self.parts) == 1:
            return {
                "type": "Polygon",
                "coordinates": [[[x, y] for x, y in self.parts[0]]],
            }
        return {
            "type": "MultiPolygon",
            "coordinates": [[[[x, y] for x, y in ring]] for ring in self.parts],
        }

    @staticmethod
    def from_json(data: dict) -> "Geometry":
        kind = data.get("type")
        coords = data.get("coordinates")
        if kind == "Point":
            return Geometry.point(coords[0], coords[1])
        if kind == "Polygon":
            return Geometry.from_ring(tuple((c[0], c[1]) for c in coords[0]))
        if kind == "MultiPolygon":
            return Geometry.from_rings(
                tuple((c[0], c[1]) for c in poly[0]) for poly in coords
            )
        raise GeometryError("unsupported_geojson_type", str(kind))


def _ring_centroid(ring: Sequence[Point]) -> Point:
    pts = _close(ring)
    a = _signed_area(pts)
    if abs(a) < 1e-18:
        xs = [p[0] for p in pts[:-1]]
        ys = [p[1] for p in pts[:-1]]
        return (sum(xs) / len(xs), sum(ys) / len(ys))
    cx = cy = 0.0
    for (x1, y1), (x2, y2) in zip(pts, pts[1:]):
        cross = x1 * y2 - x2 * y1
        cx += (x1 + x2) * cross
        cy += (y1 + y2) * cross
    return (cx / (6 * a), cy / (6 * a))


def _point_in_ring(x: float, y: float, ring: Sequence[Point]) -> bool:
    pts = _close(ring)
    inside = False
    for (x1, y1), (x2, y2) in zip(pts, pts[1:]):
        if (y1 > y) != (y2 > y):
            t = (y - y1) / (y2 - y1) if y2 != y1 else 0.0
            xcross = x1 + t * (x2 - x1)
            if xcross == x:
                return True
            if x < xcross:
                inside = not inside
        elif y1 == y == y2 and (min(x1, x2) <= x <= max(x1, x2)):
            return True
    return inside


def _point_segment_distance(
    px: float, py: float, ax: float, ay: float, bx: float, by: float
) -> float:
    vx, vy = bx - ax, by - ay
    wx, wy = px - ax, py - ay
    c1 = vx * wx + vy * wy
    if c1 <= 0:
        return math.hypot(px - ax, py - ay)
    c2 = vx * vx + vy * vy
    if c2 <= c1:
        return math.hypot(px - bx, py - by)
    t = c1 / c2
    return math.hypot(px - (ax + t * vx), py - (ay + t * vy))


def geom_hash(geom: Geometry, ndigits: int = 3) -> str:
    """Stable hash of rounded, rotation-normalised rings. Duplicate detector."""

    if geom.kind == "point":
        payload = ["P", round(geom.x, ndigits), round(geom.y, ndigits)]
    else:
        rings = [_canonical_open_ring(ring, ndigits) for ring in geom.parts]
        rings.sort()
        payload = rings
    blob = json.dumps(payload, separators=(",", ":"))
    return hashlib.sha256(blob.encode("utf-8")).hexdigest()[:16]


def fingerprint(geom: Geometry, ndigits: int = 2) -> str:
    """Matching aid: rounded representative point plus area, in working CRS."""

    rx, ry = geom.representative_point()
    return f"{round(rx, ndigits)}:{round(ry, ndigits)}:{round(geom.area, ndigits)}"


def looks_like_lonlat(geoms: Sequence[Geometry]) -> bool:
    """True when every vertex sits in degree space on a small geographic bbox.

    A local metre grid of tens of metres at the origin is not treated as
    lon/lat (extent would exceed a few degrees). Hamilton UTM 17N eastings
    are ~5.8e5 and are never flagged.
    """

    if not geoms:
        return False
    minx = min(g.bounds.minx for g in geoms)
    maxx = max(g.bounds.maxx for g in geoms)
    miny = min(g.bounds.miny for g in geoms)
    maxy = max(g.bounds.maxy for g in geoms)
    if abs(minx) > 180 or abs(maxx) > 180 or abs(miny) > 90 or abs(maxy) > 90:
        return False
    return (maxx - minx) <= 5 and (maxy - miny) <= 5


def rect_intersection_area(a: Bounds, b: Bounds) -> float:
    x0 = max(a.minx, b.minx)
    x1 = min(a.maxx, b.maxx)
    y0 = max(a.miny, b.miny)
    y1 = min(a.maxy, b.maxy)
    if x1 <= x0 or y1 <= y0:
        return 0.0
    return (x1 - x0) * (y1 - y0)


def intersection_area(a: Geometry, b: Geometry) -> float:
    if a.kind == "point" or b.kind == "point":
        return 0.0
    if not a.bounds.intersects(b.bounds):
        return 0.0
    ra, rb = a.as_rect(), b.as_rect()
    if ra is not None and rb is not None:
        return rect_intersection_area(ra, rb)
    shapely_area = _shapely_intersection_area(a, b)
    if shapely_area is not None:
        return shapely_area
    return _raster_intersection_area(a, b)


def iou(a: Geometry, b: Geometry) -> float:
    inter = intersection_area(a, b)
    union = a.area + b.area - inter
    if union <= 0:
        return 0.0
    return inter / union


def _shapely_intersection_area(a: Geometry, b: Geometry) -> float | None:
    if ShapelyPolygon is None:
        return None
    try:
        sa = _to_shapely(a)
        sb = _to_shapely(b)
        if sa is None or sb is None:
            return None
        return float(sa.intersection(sb).area)
    except Exception:
        return None


def _to_shapely(geom: Geometry):
    polys = []
    for ring in geom.parts:
        poly = ShapelyPolygon(ring)
        if not poly.is_valid:
            poly = poly.buffer(0)
        polys.append(poly)
    if not polys:
        return None
    out = polys[0]
    for poly in polys[1:]:
        out = out.union(poly)
    return out


def _raster_intersection_area(a: Geometry, b: Geometry, max_cells: int = 400) -> float:
    x0 = max(a.bounds.minx, b.bounds.minx)
    x1 = min(a.bounds.maxx, b.bounds.maxx)
    y0 = max(a.bounds.miny, b.bounds.miny)
    y1 = min(a.bounds.maxy, b.bounds.maxy)
    if x1 <= x0 or y1 <= y0:
        return 0.0
    width = x1 - x0
    height = y1 - y0
    aspect = width / height if height else 1.0
    nx = max(1, int(math.sqrt(max_cells * max(aspect, 1e-9))))
    ny = max(1, int(max_cells / nx))
    dx = width / nx
    dy = height / ny
    hits = 0
    for i in range(nx):
        cx = x0 + (i + 0.5) * dx
        for j in range(ny):
            cy = y0 + (j + 0.5) * dy
            if a.contains_point(cx, cy) and b.contains_point(cx, cy):
                hits += 1
    return hits * dx * dy


class GridIndex:
    """BBox grid so point-in-polygon and overlap scans are not O(n*m)."""

    def __init__(self, cell_size: float = 100.0) -> None:
        if cell_size <= 0:
            raise GeometryError("invalid_cell_size")
        self.cell_size = cell_size
        self._cells: dict[tuple[int, int], list[str]] = {}
        self._bounds: dict[str, Bounds] = {}
        self._items: dict[str, object] = {}

    def insert(self, key: str, bounds: Bounds, item: object = None) -> None:
        cs = self.cell_size
        i0 = math.floor(bounds.minx / cs)
        i1 = math.floor(bounds.maxx / cs)
        j0 = math.floor(bounds.miny / cs)
        j1 = math.floor(bounds.maxy / cs)
        for i in range(i0, i1 + 1):
            for j in range(j0, j1 + 1):
                self._cells.setdefault((i, j), []).append(key)
        self._bounds[key] = bounds
        self._items[key] = item

    def _unique(self, keys: Iterable[str]) -> list[str]:
        seen: dict[str, None] = {}
        for key in keys:
            seen[key] = None
        return list(seen)

    def query_point(self, x: float, y: float) -> list[str]:
        i = math.floor(x / self.cell_size)
        j = math.floor(y / self.cell_size)
        return self._unique(self._cells.get((i, j), ()))

    def query_bbox(self, bounds: Bounds) -> list[str]:
        cs = self.cell_size
        i0 = math.floor(bounds.minx / cs)
        i1 = math.floor(bounds.maxx / cs)
        j0 = math.floor(bounds.miny / cs)
        j1 = math.floor(bounds.maxy / cs)
        keys: list[str] = []
        for i in range(i0, i1 + 1):
            for j in range(j0, j1 + 1):
                keys.extend(self._cells.get((i, j), ()))
        return self._unique(keys)

    def get(self, key: str) -> object:
        return self._items[key]
