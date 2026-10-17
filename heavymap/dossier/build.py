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
import json
import os
import re
import sys
from collections import Counter, defaultdict
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Iterable, Iterator

from heavymap.dossier.schema import SCHEMA_VERSION, pick, screen_record
from heavymap.gaps import (
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

# MPAC property code ranges (first digit). Used only to name the family of a
# source code; the code itself is always shown as quoted.
PROPERTY_CODE_FAMILIES = (
    (100, 199, "Vacant land"),
    (200, 299, "Farm"),
    (300, 399, "Residential"),
    (400, 499, "Commercial"),
    (500, 599, "Industrial"),
    (600, 699, "Institutional"),
    (700, 799, "Special and exempt"),
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


def shard_key(heavymap_id: str) -> str:
    """Last two Crockford characters of the ULID (80-bit random part)."""

    return heavymap_id[-2:]


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
        idx.parcels[row["hm_id"]] = (float(row["area_m2"] or 0.0), row.get("arn_grade", ""))
    for row in _rows(run / "addresses.csv"):
        pid = row.get("parcel_hm_id", "")
        if not pid or row.get("status", "active") != "active":
            continue
        if row.get("link_method") not in ADDRESS_LINKED:
            continue
        idx.addresses[pid].append((row["hm_id"], row["civic_key"], row["link_method"]))
    for row in _rows(run / "arn_links.csv"):
        link = {k: row.get(k, "") for k in ("arn", "npca_source_id", "grade", "iou", "method", "notes")}
        idx.arn_links[row["hm_id"]].append(link)
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
        pid = row["heavymap_id"]
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
    fam_txt = f" ({family} range)" if family else ""
    return {
        "code": code,
        "family": family,
        "src": CITYVIEW,
        "join": join,
        "conf": "low",
        "label": f"NPCA Cityview PropCode: {code}{fam_txt}; layer last edited 2020",
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
            entry["label"] = "NPCA roll value is a placeholder, not a Hamilton roll number"
        elif not valid:
            entry["flag"] = link["notes"] or "invalid_arn"
            entry["conf"] = "low"
            entry["label"] = "NPCA roll value is not a Hamilton roll number; not shown"
        elif grade == "one_to_many":
            others = idx.arn_parcel_count[arn] - 1
            entry["label"] = f"NPCA roll {arn}, also on {others} other City parcel(s)"
        elif grade == "many_to_one":
            entry["label"] = f"NPCA roll {arn}, one of {n_links} rolls on this parcel"
        else:
            entry["label"] = f"NPCA roll {arn}, one-to-one parcel match"
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
        n = len(valid)
        return {
            "status": "has_arn",
            "provisional": False,
            "grade": grade,
            "src": APT,
            "join": grade,
            "conf": best,
            "label": f"NPCA roll data: {n} roll number{'s' if n != 1 else ''}",
        }
    if rolls:
        return {
            "status": "arn_invalid",
            "provisional": False,
            "grade": grade,
            "src": APT,
            "join": grade,
            "conf": "low",
            "label": "NPCA roll value is a placeholder, not a Hamilton roll number",
        }
    if grade == "unmatched":
        return {
            "status": "in_coverage_unmatched",
            "provisional": True,
            "grade": grade,
            "src": APT,
            "join": "representative_point",
            "conf": "medium",
            "label": "Inside NPCA roll coverage, no roll number attached",
        }
    return {
        "status": "not_covered",
        "provisional": True,
        "grade": grade or "not_in_coverage",
        "src": APT,
        "join": "coverage_test_5m",
        "conf": "medium",
        "label": "Not covered by NPCA roll data (provisional)",
    }


def build_record(idx: Indexes, hm_id: str, max_addresses: int = 25) -> dict[str, Any]:
    area, grade = idx.parcels[hm_id]
    arn_re = idx.arn_re
    rolls = _roll_entries(idx, idx.arn_links.get(hm_id, []), arn_re)

    addrs = sorted(idx.addresses.get(hm_id, []), key=lambda a: _civic_sort(a[1]))
    shown = []
    for aid, civic, method in addrs[:max_addresses]:
        text, unit = _split_civic(civic)
        shown.append(
            {"id": aid, "text": text, "unit": unit, "join": method, "conf": ADDRESS_CONF.get(method, "low")}
        )
    n_addr = len(addrs)

    rows = sorted(
        idx.overlays.get(hm_id, []),
        key=lambda r: (idx.layer_order.get(r[0], 999), -r[3], r[1]),
    )
    slivers = idx.slivers.get(hm_id, 0)
    overlay_rows = []
    for r in rows:
        item = {"layer": r[0], "class": r[1], "label": r[2], "share": r[3], "m2": r[4], "fid": r[5]}
        if r[6]:
            item["sliver"] = True
        overlay_rows.append(item)
    sliver_txt = f", {slivers} flagged as sliver{'s' if slivers != 1 else ''}" if slivers else ""
    run_id = idx.overlay_manifest.get("run_id", "")

    record = {
        "heavymap_id": hm_id,
        "area": {
            "m2": round(area, 1),
            "src": PARCEL,
            "join": "registry_geometry",
            "conf": "high",
            "label": "Area of the City parcel polygon (EPSG:26917)",
        },
        "coverage": _coverage(grade, rolls),
        "roll": rolls,
        "addresses": {
            "src": ADDRESSES,
            "join": "point_in_polygon",
            "label": f"{n_addr} City address point{'s' if n_addr != 1 else ''} in this parcel",
            "count": n_addr,
            "truncated": n_addr > max_addresses,
            "shown": shown,
        },
        "overlays": {
            "src": f"heavymap-overlays:{run_id}" if run_id else "heavymap-overlays",
            "join": "area_share",
            "label": f"{len(overlay_rows)} zone or designation link{'s' if len(overlay_rows) != 1 else ''}{sliver_txt}",
            "rows": overlay_rows,
            "sliver_count": slivers,
        },
    }
    record["gaps"] = parcel_gap_ids(context_from_record(record), idx.gaps_ledger)
    return dict(screen_record(record))


def _dump(obj: Any) -> bytes:
    return json.dumps(obj, ensure_ascii=False, separators=(",", ":"), sort_keys=False).encode("utf-8")


def write_dossier(
    idx: Indexes,
    out_dir: Path,
    jurisdiction: str = "hamilton",
    max_addresses: int = 25,
    extra_manifest: dict[str, Any] | None = None,
) -> dict[str, Any]:
    out_dir = Path(out_dir)
    shard_dir = out_dir / "shards"
    shard_dir.mkdir(parents=True, exist_ok=True)
    by_shard: dict[str, list[str]] = defaultdict(list)
    for hm_id in idx.parcels:
        by_shard[shard_key(hm_id)].append(hm_id)

    coverage = Counter()
    sizes: dict[str, int] = {}
    counts = Counter()
    gap_counts: Counter = Counter()
    sample_ids: dict[str, str] = {}
    for key in sorted(by_shard):
        records = {}
        for hm_id in sorted(by_shard[key]):
            rec = build_record(idx, hm_id, max_addresses)
            records[hm_id] = rec
            coverage[rec["coverage"]["status"]] += 1
            counts["records"] += 1
            counts["addresses_linked"] += rec["addresses"]["count"]
            counts["addresses_shown"] += len(rec["addresses"]["shown"])
            counts["overlay_rows"] += len(rec["overlays"]["rows"])
            counts["sliver_rows_flagged"] += rec["overlays"]["sliver_count"]
            if rec["addresses"]["truncated"]:
                counts["address_lists_truncated"] += 1
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
        payload = {
            "schema": SCHEMA_VERSION,
            "jurisdiction": jurisdiction,
            "shard": key,
            "records": records,
        }
        data = _dump(payload)
        tmp = shard_dir / f"{key}.json.tmp"
        tmp.write_bytes(data)
        os.replace(tmp, shard_dir / f"{key}.json")
        sizes[key] = len(data)

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

    size_list = sorted(sizes.values())
    manifest = {
        "schema": SCHEMA_VERSION,
        "jurisdiction": jurisdiction,
        "shard_key": {
            "rule": "last two characters of heavymap_id (Crockford ULID random part)",
            "path": "shards/{key}.json",
            "alphabet": "0123456789ABCDEFGHJKMNPQRSTVWXYZ",
            "count": len(sizes),
        },
        "counts": dict(counts),
        "coverage": dict(coverage),
        "coverage_note": "not_covered and in_coverage_unmatched are provisional pending Morgen's decision on the ~46% of parcels outside NPCA roll data.",
        "sizes_bytes": {
            "total": sum(size_list),
            "min": size_list[0] if size_list else 0,
            "median": size_list[len(size_list) // 2] if size_list else 0,
            "max": size_list[-1] if size_list else 0,
        },
        "max_addresses_shown": max_addresses,
        "sliver_rule": idx.overlay_manifest.get("sliver", {}),
        "sliver_policy": (
            "Flag, never extinguish. Every overlay link is in rows; slivers carry "
            "sliver=true (absent means not a sliver) and are counted in sliver_count."
        ),
        "layer_aliases": LAYER_ALIASES,
        "sources": sources,
        "property_code_families": [
            {"from": lo, "to": hi, "family": name} for lo, hi, name in PROPERTY_CODE_FAMILIES
        ],
        "confidence_words": CONFIDENCE_WORDS,
        "fields_unavailable": FIELDS_UNAVAILABLE,
        "gaps_ledger": manifest_ledger(idx.gaps_ledger),
        "gap_counts": dict(gap_counts),
        "screening": (
            "Output keys come from heavymap/dossier/schema.py RECORD_SPEC (allowlist). "
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
    (out_dir / "manifest.json").write_bytes(
        json.dumps(manifest, ensure_ascii=False, indent=1).encode("utf-8")
    )
    manifest["_shard_sizes"] = sizes
    return manifest


def audit_output(out_dir: Path) -> int:
    """Re-read every shard and re-screen every record. Returns records checked."""

    n = 0
    for path in sorted((Path(out_dir) / "shards").glob("*.json")):
        payload = json.loads(path.read_text(encoding="utf-8"))
        if set(payload) != {"schema", "jurisdiction", "shard", "records"}:
            raise ValueError(f"{path.name}: unexpected envelope keys")
        for hm_id, rec in payload["records"].items():
            if rec.get("heavymap_id") != hm_id or shard_key(hm_id) != payload["shard"]:
                raise ValueError(f"{path.name}: id/shard mismatch for {hm_id}")
            screen_record(rec)
            n += 1
    return n
