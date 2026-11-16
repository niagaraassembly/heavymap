"""Build screened per-parcel dossier shards from registry, NPCA and overlay runs.

Inputs (all under local-data/, never in git):

- registry run: ``parcels.csv``, ``addresses.csv``, ``arn_links.csv``
- overlay run: ``overlay_links.csv`` and its ``MANIFEST.json``
- NPCA Assessment_Parcels_Test all-fields GeoJSON (roll number, MPAC street)
- NPCA Parcels_Cityview all-fields GeoJSON (MPAC property code)

Only ``schema.SOURCE_FIELDS`` are kept from the NPCA files, and every record
passes ``schema.screen_record`` before it is written.
"""

from __future__ import annotations

import csv
import datetime as _dt
import hashlib
import json
import os
import re
import sys
from collections import Counter, defaultdict
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Iterable, Iterator

from industrial_atlas.dossier.schema import SCHEMA_VERSION, assert_no_display_keys, pick, screen_detail, screen_record
from industrial_atlas.gaps import (
    context_from_record,
    is_placeholder_arn,
    load_ledger,
    manifest_ledger,
    parcel_gap_ids,
)

APT = "LYR-NPCA-ASSESSMENT-PARCELS-TEST"
CITYVIEW = "LYR-NPCA-PARCELS-CITYVIEW"
PARCEL = "LYR-HAM-PARCEL"
ADDRESSES = "LYR-HAM-ADDRESSES"

# Overlay layer ids written by older overlay runs, mapped to sheet 17 ids.
LAYER_ALIASES = {
    "LYR-NPCA-REGULATION-LANDS": "LYR-NPCA-APPROX-REGULATION-LANDS",
}

BASE_SOURCES: dict[str, dict[str, str]] = {
    PARCEL: {
        "title": "Hamilton Assessment Parcel",
        "publisher": "City of Hamilton",
        "endpoint": "https://services.arcgis.com/rYz782eMbySr2srL/arcgis/rest/services/Hamilton_Assessment_Parcel/FeatureServer/0",
        "role": "parcel polygon behind each HeavyMap parcel ID; area",
    },
    ADDRESSES: {
        "title": "Addresses",
        "publisher": "City of Hamilton",
        "endpoint": "https://services.arcgis.com/rYz782eMbySr2srL/arcgis/rest/services/Addresses/FeatureServer/1",
        "role": "civic address points linked to parcels by the registry",
    },
    APT: {
        "title": "Assessment_Parcels_Test",
        "publisher": "Niagara Peninsula Conservation Authority",
        "endpoint": "https://services1.arcgis.com/d0ZCwU7eGKVeNiEE/arcgis/rest/services/Assessment_Parcels_Test/FeatureServer/0",
        "role": "roll number (ARN) and MPAC street text; covers ~54% of City parcels",
    },
    CITYVIEW: {
        "title": "Parcels_Cityview",
        "publisher": "Niagara Peninsula Conservation Authority",
        "endpoint": "https://services1.arcgis.com/d0ZCwU7eGKVeNiEE/arcgis/rest/services/Parcels_Cityview/FeatureServer/0",
        "role": "MPAC property code by roll number; layer last edited 2020-02-27, code filled on ~2% of rows",
    },
}

# MPAC property code ranges (first digit). Family tokens only; wording is in the
# label register. The code itself is always shown as quoted.
PROPERTY_CODE_FAMILIES = (
    (100, 199, "vacant_land"),
    (200, 299, "farm"),
    (300, 399, "residential"),
    (400, 499, "commercial"),
    (500, 599, "industrial"),
    (600, 699, "institutional"),
    (700, 799, "special_and_exempt"),
)

ROLL_CONF = {
    "exact_1to1": "high",
    "one_to_many": "medium",
    "many_to_one": "medium",
    "placeholder": "low",
}
ADDRESS_CONF = {"pip": "high", "nearest_10m": "medium"}
ADDRESS_LINKED = ("pip", "nearest_10m")

FIELDS_UNAVAILABLE = {
    "tax_class": (
        "Not in either NPCA layer. Assessment_Parcels_Test MPAC_TAXAT holds the "
        "taxing municipality (HAMILTON CITY), not a tax class. Tax class is one "
        "possible input among several."
    ),
}

CONFIDENCE_WORDS = {
    "high": "one-to-one or point-in-polygon join on current sources",
    "medium": "join holds but is shared, nearest-within-10 m, or a coverage test",
    "low": "exact key match against a stale or sparsely filled source",
    "note": "Provisional words for the UI. Not the NA-86 exact/good/weak/refused scale (still open).",
}


def shard_key(ia_id: str) -> str:
    """Last two Crockford characters of the ULID (80-bit random part)."""

    return ia_id[-2:]


def property_code_family(code: str) -> str | None:
    if not code.isdigit():
        return None
    n = int(code)
    for lo, hi, name in PROPERTY_CODE_FAMILIES:
        if lo <= n <= hi:
            return name
    return None


def _clean(value: Any) -> str:
    if value is None:
        return ""
    text = str(value).strip()
    return "" if text.lower() in ("none", "null") else text


def _rows(path: Path) -> Iterator[dict[str, str]]:
    csv.field_size_limit(sys.maxsize)
    with open(path, newline="", encoding="utf-8") as fh:
        yield from csv.DictReader(fh)


def resolve_run(base: Path) -> Path:
    """``base`` may be a run dir, or a store dir with CURRENT + runs/."""

    base = Path(base)
    current = base / "CURRENT"
    if current.exists():
        return base / "runs" / current.read_text().strip()
    return base


@dataclass
class Inputs:
    registry_run: Path
    overlay_run: Path
    npca_apt: Path | None
    npca_cityview: Path | None


@dataclass
class Indexes:
    parcels: dict[str, tuple[float, str]] = field(default_factory=dict)
    addresses: dict[str, list[tuple[str, str, str]]] = field(default_factory=lambda: defaultdict(list))
    arn_links: dict[str, list[dict[str, str]]] = field(default_factory=lambda: defaultdict(list))
    arn_parcel_count: Counter = field(default_factory=Counter)
    apt: dict[str, tuple[str, str]] = field(default_factory=dict)
    cityview: dict[str, tuple[tuple[str, ...], str]] = field(default_factory=dict)
    overlays: dict[str, list[tuple]] = field(default_factory=lambda: defaultdict(list))
    slivers: Counter = field(default_factory=Counter)
    layer_order: dict[str, int] = field(default_factory=dict)
    overlay_manifest: dict[str, Any] = field(default_factory=dict)
    registry_manifest: dict[str, Any] = field(default_factory=dict)
    stats: Counter = field(default_factory=Counter)
    arn_re: Any = None
    gaps_ledger: list = field(default_factory=list)


def _split_civic(civic_key: str) -> tuple[str, str]:
    parts = (civic_key.split("|") + ["", "", "", ""])[:4]
    num, street, community, unit = (p.strip() for p in parts)
    text = " ".join(p for p in (num, street) if p)
    if community:
        text = f"{text}, {community}" if text else community
    return text, unit


def _civic_sort(civic_key: str) -> tuple:
    parts = (civic_key.split("|") + ["", "", "", ""])[:4]
    m = re.match(r"\d+", parts[0].strip())
    return (parts[1], int(m.group()) if m else 10**9, parts[0], parts[3])


def load_registry(idx: Indexes, run: Path) -> None:
    mf = run / "MANIFEST.json"
    if mf.exists():
        idx.registry_manifest = json.loads(mf.read_text())
    for row in _rows(run / "parcels.csv"):
        if row.get("status", "active") != "active":
            continue
        idx.parcels[row["ia_id"]] = (float(row["area_m2"] or 0.0), row.get("arn_grade", ""))
    for row in _rows(run / "addresses.csv"):
        pid = row.get("parcel_ia_id", "")
        if not pid or row.get("status", "active") != "active":
            continue
        if row.get("link_method") not in ADDRESS_LINKED:
            continue
        idx.addresses[pid].append((row["ia_id"], row["civic_key"], row["link_method"]))
    for row in _rows(run / "arn_links.csv"):
        link = {k: row.get(k, "") for k in ("arn", "npca_source_id", "grade", "iou", "method", "notes")}
        idx.arn_links[row["ia_id"]].append(link)
        if link["arn"] and not is_placeholder_arn(link["arn"]):
            idx.arn_parcel_count[link["arn"]] += 1


def _features(path: Path) -> Iterable[dict[str, Any]]:
    with open(path, encoding="utf-8") as fh:
        data = json.load(fh)
    feats = data.get("features", [])
    del data
    for feat in feats:
        yield feat.get("properties") or {}


def load_apt(idx: Indexes, path: Path) -> None:
    for props in _features(path):
        row = pick(props, APT)
        sid = _clean(row["OBJECTID_1"])
        if sid.endswith(".0"):
            sid = sid[:-2]
        if sid:
            idx.apt[sid] = (_clean(row["ARN"]), _clean(row["MPAC_STREE"]))


def load_cityview(idx: Indexes, path: Path, arn_re: re.Pattern) -> None:
    exact: dict[str, set[str]] = defaultdict(set)
    prefix: dict[str, set[str]] = defaultdict(set)
    for props in _features(path):
        row = pick(props, CITYVIEW)
        arn = _clean(row["ARN"])
        code = _clean(row["PropCode"])
        if len(arn) == 15 and arn_re.fullmatch(arn):
            exact[arn].add(code)
        elif len(arn) == 20 and arn_re.fullmatch(arn[:15]):
            prefix[arn[:15]].add(code)
    for arn, codes in prefix.items():
        if arn not in exact:
            idx.cityview[arn] = (tuple(sorted(c for c in codes if c)), "arn_prefix15")
    for arn, codes in exact.items():
        idx.cityview[arn] = (tuple(sorted(c for c in codes if c)), "arn_exact")


def load_overlays(idx: Indexes, run: Path) -> None:
    mf = run / "MANIFEST.json"
    if mf.exists():
        idx.overlay_manifest = json.loads(mf.read_text())
        for i, layer in enumerate(idx.overlay_manifest.get("layers", [])):
            lid = LAYER_ALIASES.get(layer["layer_id"], layer["layer_id"])
            idx.layer_order[lid] = i
    for row in _rows(run / "overlay_links.csv"):
        pid = row["ia_id"]
        sliver = row.get("sliver", "").strip().lower() in ("y", "yes", "true", "1")
        if sliver:
            idx.slivers[pid] += 1
            idx.stats["overlay_slivers"] += 1
        lid = LAYER_ALIASES.get(row["layer_id"], row["layer_id"])
        if lid != row["layer_id"]:
            idx.stats["overlay_layer_id_aliased"] += 1
        idx.overlays[pid].append(
            (
                lid,
                row.get("class", ""),
                row.get("quoted_label", ""),
                round(float(row.get("parcel_share") or 0.0), 4),
                round(float(row.get("area_m2") or 0.0), 1),
                row.get("feature_source_id", ""),
                sliver,
            )
        )
        idx.stats["overlay_rows"] += 1


def load_all(inputs: Inputs, arn_prefix: str = "2518") -> Indexes:
    idx = Indexes()
    arn_re = re.compile(rf"^{re.escape(arn_prefix)}\d{{{15 - len(arn_prefix)}}}$")
    load_registry(idx, inputs.registry_run)
    if inputs.npca_apt:
        load_apt(idx, inputs.npca_apt)
    if inputs.npca_cityview:
        load_cityview(idx, inputs.npca_cityview, arn_re)
    load_overlays(idx, inputs.overlay_run)
    idx.arn_re = arn_re
    idx.gaps_ledger = load_ledger()
    return idx


def _property_code(codes: tuple[str, ...], join: str) -> dict[str, Any] | None:
    if not codes:
        return None
    code = "/".join(codes)
    families = {property_code_family(c) for c in codes}
    family = families.pop() if len(families) == 1 else None
    return {
        "code": code,
        "family": family,
        "src": CITYVIEW,
        "join": join,
        "conf": "low",
    }


def _roll_entries(idx: Indexes, links: list[dict[str, str]], arn_re: re.Pattern) -> list[dict[str, Any]]:
    out = []
    n_links = len(links)
    for link in sorted(links, key=lambda l: l["arn"]):
        arn = link["arn"]
        grade = link["grade"]
        placeholder = is_placeholder_arn(arn) or "placeholder" in (link.get("notes") or "")
        valid = bool(arn_re.fullmatch(arn)) and not placeholder
        if placeholder:
            grade = "placeholder"
        entry: dict[str, Any] = {
            "arn": arn if valid else None,
            "grade": grade,
            "method": link["method"] or "representative_point",
            "iou": round(float(link["iou"] or 0.0), 4),
            "src": APT,
            "join": grade,
            "conf": ROLL_CONF.get(grade, "low"),
        }
        if placeholder:
            entry["flag"] = "placeholder"
            entry["conf"] = "low"
        elif not valid:
            entry["flag"] = link["notes"] or "invalid_arn"
            entry["conf"] = "low"
        elif grade == "one_to_many":
            # The count the old label spelled out; the wording is now a label template.
            entry["other_parcels"] = idx.arn_parcel_count[arn] - 1
        apt = idx.apt.get(link["npca_source_id"])
        if apt and apt[1]:
            entry["roll_address"] = apt[1]
        if valid:
            cv = idx.cityview.get(arn)
            if cv:
                pc = _property_code(cv[0], cv[1])
                if pc:
                    entry["property_code"] = pc
        out.append(entry)
    return out


def _coverage(grade: str, rolls: list[dict[str, Any]]) -> dict[str, Any]:
    valid = [r for r in rolls if r.get("arn")]
    if valid:
        best = "high" if any(r["conf"] == "high" for r in valid) else "medium"
        return {
            "status": "has_arn",
            "provisional": False,
            "grade": grade,
            "src": APT,
            "join": grade,
            "conf": best,
        }
    if rolls:
        return {
            "status": "arn_invalid",
            "provisional": False,
            "grade": grade,
            "src": APT,
            "join": grade,
            "conf": "low",
        }
    if grade == "unmatched":
        return {
            "status": "in_coverage_unmatched",
            "provisional": True,
            "grade": grade,
            "src": APT,
            "join": "representative_point",
            "conf": "medium",
        }
    return {
        "status": "not_covered",
        "provisional": True,
        "grade": grade or "not_in_coverage",
        "src": APT,
        "join": "coverage_test_5m",
        "conf": "medium",
    }


def build_record_pair(idx: Indexes, ia_id: str, core_addresses: int = 5) -> tuple[dict[str, Any], dict[str, Any]]:
    """Return (core record, detail record) for one parcel (schema 2)."""

    area, grade = idx.parcels[ia_id]
    arn_re = idx.arn_re
    rolls = _roll_entries(idx, idx.arn_links.get(ia_id, []), arn_re)

    addrs = sorted(idx.addresses.get(ia_id, []), key=lambda a: _civic_sort(a[1]))
    all_addresses = []
    for aid, civic, method in addrs:
        text, unit = _split_civic(civic)
        all_addresses.append(
            {"id": aid, "text": text, "unit": unit, "join": method, "conf": ADDRESS_CONF.get(method, "low")}
        )
    n_addr = len(all_addresses)

    rows = sorted(
        idx.overlays.get(ia_id, []),
        key=lambda r: (idx.layer_order.get(r[0], 999), -r[3], r[1]),
    )
    slivers = idx.slivers.get(ia_id, 0)
    overlay_rows = []
    feature_ids: dict[str, str] = {}
    for i, r in enumerate(rows):
        item = {"layer": r[0], "class": r[1], "share": r[3], "area_m2": r[4]}
        if r[6]:
            item["sliver"] = True
        overlay_rows.append(item)
        if r[5]:
            feature_ids[f"/overlays/rows/{i}"] = str(r[5])
    run_id = idx.overlay_manifest.get("run_id", "")

    record = {
        "key": ia_id,
        "area": {
            "value": round(area, 1),
            "unit": "m2",
            "crs": "EPSG:26917",
            "src": PARCEL,
            "join": "registry_geometry",
            "conf": "high",
        },
        "coverage": _coverage(grade, rolls),
        "roll": rolls,
        "addresses": {
            "src": ADDRESSES,
            "join": "point_in_polygon",
            "count": n_addr,
            "complete": n_addr <= core_addresses,
            "items": all_addresses[:core_addresses],
        },
        "overlays": {
            "src": f"heavymap-overlays:{run_id}" if run_id else "heavymap-overlays",
            "join": "area_share",
            "row_count": len(overlay_rows),
            "rows": overlay_rows,
            "sliver_count": slivers,
        },
    }
    record["gaps"] = parcel_gap_ids(context_from_record(record), idx.gaps_ledger)
    detail = {"addresses_full": all_addresses, "feature_ids": feature_ids}
    return dict(screen_record(record)), dict(screen_detail(detail))


def build_record(idx: Indexes, ia_id: str, core_addresses: int = 5) -> dict[str, Any]:
    """The core record only (see ``build_record_pair``)."""

    return build_record_pair(idx, ia_id, core_addresses)[0]


def _dump(obj: Any) -> bytes:
    return json.dumps(obj, ensure_ascii=False, separators=(",", ":"), sort_keys=False).encode("utf-8")


def _sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _write_file(path: Path, data: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(path.name + ".tmp")
    tmp.write_bytes(data)
    os.replace(tmp, path)


def write_dossier(
    idx: Indexes,
    out_dir: Path,
    jurisdiction: str = "hamilton",
    core_addresses: int = 5,
    extra_manifest: dict[str, Any] | None = None,
    release_unit: str = "ca-on-hamilton",
    release_id: str | None = None,
) -> dict[str, Any]:
    """Write a schema 2 release: shards/, detail/, provenance/, files.json, manifest.json.

    Contract: drafts/wave-1/seam-contract-dossier.md in heavymap-restricted.
    """

    out_dir = Path(out_dir)
    files: list[dict[str, Any]] = []

    def emit(rel: str, data: bytes) -> None:
        _write_file(out_dir / rel, data)
        files.append({"path": rel, "bytes": len(data), "sha256": _sha256(data)})

    by_shard: dict[str, list[str]] = defaultdict(list)
    for ia_id in idx.parcels:
        by_shard[shard_key(ia_id)].append(ia_id)

    coverage = Counter()
    sizes: dict[str, int] = {}
    detail_sizes: dict[str, int] = {}
    counts = Counter()
    gap_counts: Counter = Counter()
    for key in sorted(by_shard):
        records, details = {}, {}
        for ia_id in sorted(by_shard[key]):
            rec, det = build_record_pair(idx, ia_id, core_addresses)
            records[ia_id] = rec
            details[ia_id] = det
            coverage[rec["coverage"]["status"]] += 1
            counts["records"] += 1
            counts["addresses_linked"] += rec["addresses"]["count"]
            counts["addresses_in_core"] += len(rec["addresses"]["items"])
            counts["overlay_rows"] += len(rec["overlays"]["rows"])
            counts["sliver_rows_flagged"] += rec["overlays"]["sliver_count"]
            if not rec["addresses"]["complete"]:
                counts["address_lists_beyond_core"] += 1
            if not rec["overlays"]["rows"]:
                counts["parcels_without_overlay_rows"] += 1
            for r in rec["roll"]:
                if "property_code" in r:
                    counts["rolls_with_property_code"] += 1
                if r.get("arn") is None:
                    counts["rolls_flagged_invalid"] += 1
                if r.get("flag") == "placeholder":
                    counts["rolls_flagged_placeholder"] += 1
            for gid in rec["gaps"]:
                gap_counts[gid] += 1
            if rec["gaps"]:
                counts["parcels_with_gaps"] += 1
        envelope = {"schema": SCHEMA_VERSION, "jurisdiction": jurisdiction, "shard": key}
        core = _dump({**envelope, "records": records})
        emit(f"shards/{key}.json", core)
        sizes[key] = len(core)
        det_bytes = _dump({**envelope, "records": details})
        emit(f"detail/{key}.json", det_bytes)
        detail_sizes[key] = len(det_bytes)

    sources = {k: dict(v) for k, v in BASE_SOURCES.items()}
    for layer in idx.overlay_manifest.get("layers", []):
        lid = LAYER_ALIASES.get(layer["layer_id"], layer["layer_id"])
        sources[lid] = {
            "band": layer.get("band", ""),
            "endpoint": layer.get("endpoint", ""),
            "catalog_row_ref": layer.get("catalog_row_ref", ""),
            "role": "overlay zone or designation linked by area share",
        }
        if lid != layer["layer_id"]:
            sources[lid]["former_layer_id"] = layer["layer_id"]

    # Provenance detail (loaded when a viewer opens the provenance view). Retrieval
    # date, licence and archive reference are not captured by this builder yet (BL-099).
    emit(
        "provenance/sources.json",
        _dump(
            {
                "schema": SCHEMA_VERSION,
                "sources": sources,
                "layer_aliases": LAYER_ALIASES,
                "fields_unavailable": FIELDS_UNAVAILABLE,
                "not_yet_captured": ["captured_at", "captured_version", "archive_ref", "licence", "processing_steps"],
            }
        ),
    )
    # Seed for the label register (wording that used to sit in the manifest).
    emit("label-seed.json", _dump({"schema": SCHEMA_VERSION, "confidence_words": CONFIDENCE_WORDS}))

    files.sort(key=lambda f: f["path"])
    files_bytes = _dump({"schema": SCHEMA_VERSION, "files": files})
    _write_file(out_dir / "files.json", files_bytes)

    size_list = sorted(sizes.values())
    release = {
        "unit": release_unit,
        "id": release_id or _dt.date.today().isoformat(),
    }
    manifest = {
        "schema": SCHEMA_VERSION,
        "contract_revisions": {"dossier": "0.1"},
        "release": release,
        "jurisdiction": jurisdiction,
        "shard_key": {
            "rule": "last two characters of key (Crockford ULID random part)",
            "path": "shards/{key}.json",
            "detail_path": "detail/{key}.json",
            "alphabet": "0123456789ABCDEFGHJKMNPQRSTVWXYZ",
            "count": len(sizes),
        },
        "files_sha256": _sha256(files_bytes),
        "file_count": len(files),
        "counts": dict(counts),
        "coverage": dict(coverage),
        "coverage_note": "not_covered and in_coverage_unmatched are provisional pending Morgen's decision on the ~46% of parcels outside NPCA roll data.",
        "sizes_bytes": {
            "total": sum(size_list),
            "min": size_list[0] if size_list else 0,
            "median": size_list[len(size_list) // 2] if size_list else 0,
            "max": size_list[-1] if size_list else 0,
            "detail_total": sum(detail_sizes.values()),
        },
        "core_addresses": core_addresses,
        "sliver_rule": idx.overlay_manifest.get("sliver", {}),
        "sliver_policy": (
            "Flag, never extinguish. Every overlay link is in rows; slivers carry "
            "sliver=true (absent means not a sliver) and are counted in sliver_count."
        ),
        "sources": {
            k: {x: v[x] for x in ("title", "publisher", "band") if x in v} for k, v in sources.items()
        },
        "property_code_families": [
            {"from": lo, "to": hi, "family": name} for lo, hi, name in PROPERTY_CODE_FAMILIES
        ],
        "gaps_ledger": manifest_ledger(idx.gaps_ledger),
        "gap_counts": dict(gap_counts),
        "screening": (
            "Output keys come from industrial_atlas/dossier/schema.py RECORD_SPEC and DETAIL_SPEC (allowlists). "
            "Only SOURCE_FIELDS are read from NPCA files. Owner names, mailing addresses "
            "and legal descriptions are never read past the loader or written."
        ),
        "inputs": {
            "registry_run": idx.registry_manifest.get("run_id", ""),
            "overlay_run": idx.overlay_manifest.get("run_id", ""),
        },
        "stats": {k: v for k, v in idx.stats.items() if v},
    }
    if extra_manifest:
        manifest.update(extra_manifest)
    _write_file(out_dir / "manifest.json", json.dumps(manifest, ensure_ascii=False, indent=1).encode("utf-8"))
    manifest["_shard_sizes"] = sizes
    return manifest


def audit_output(out_dir: Path) -> int:
    """Re-verify a written release. Returns records checked.

    Checks: the manifest hash of files.json; every file's hash; every core record
    re-screened; no display keys; each record in the shard its key names; detail
    present for every record; counts match the manifest.
    """

    out_dir = Path(out_dir)
    manifest = json.loads((out_dir / "manifest.json").read_text(encoding="utf-8"))
    files_bytes = (out_dir / "files.json").read_bytes()
    if _sha256(files_bytes) != manifest.get("files_sha256"):
        raise ValueError("files.json does not match manifest files_sha256")
    listed = json.loads(files_bytes)["files"]
    for entry in listed:
        data = (out_dir / entry["path"]).read_bytes()
        if len(data) != entry["bytes"] or _sha256(data) != entry["sha256"]:
            raise ValueError(f"{entry['path']}: hash or size mismatch")
    on_disk = {
        str(p.relative_to(out_dir))
        for sub in ("shards", "detail", "provenance")
        for p in (out_dir / sub).glob("*.json")
    } | {"label-seed.json"}
    if on_disk != {e["path"] for e in listed}:
        raise ValueError("files.json does not list exactly the files on disk")

    n = 0
    envelope = {"schema", "jurisdiction", "shard", "records"}
    for path in sorted((out_dir / "shards").glob("*.json")):
        payload = json.loads(path.read_text(encoding="utf-8"))
        detail = json.loads((out_dir / "detail" / path.name).read_text(encoding="utf-8"))
        if set(payload) != envelope or set(detail) != envelope:
            raise ValueError(f"{path.name}: unexpected envelope keys")
        if set(detail["records"]) != set(payload["records"]):
            raise ValueError(f"{path.name}: detail records differ from core records")
        for ia_id, rec in payload["records"].items():
            if rec.get("key") != ia_id or shard_key(ia_id) != payload["shard"]:
                raise ValueError(f"{path.name}: key/shard mismatch for {ia_id}")
            screen_record(rec)
            screen_detail(detail["records"][ia_id])
            full = detail["records"][ia_id]["addresses_full"]
            if len(full) != rec["addresses"]["count"]:
                raise ValueError(f"{path.name}: address count mismatch for {ia_id}")
            if rec["addresses"]["items"] != full[: len(rec["addresses"]["items"])]:
                raise ValueError(f"{path.name}: core addresses are not a prefix of the full list for {ia_id}")
            n += 1
    assert_no_display_keys(manifest, "manifest")
    if n != manifest["counts"].get("records", 0):
        raise ValueError("record count does not match manifest")
    return n
