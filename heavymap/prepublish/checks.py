"""Walk a build output tree and run the four increment-1 checks."""

from __future__ import annotations

import csv
import gzip
import hashlib
import io
import json
from pathlib import Path
from typing import Any, Iterable, Mapping

from heavymap.dossier.schema import ScreeningError, screen_record
from heavymap.prepublish import config

PASS = "pass"
FAIL = "fail"
WARN = "warn"
SKIP = "skip"


class CheckError(ValueError):
    """A pre-publish check could not run."""


def _rel(root: Path, path: Path) -> str:
    return path.relative_to(root).as_posix()


def iter_files(root: Path) -> list[Path]:
    root = Path(root)
    if not root.is_dir():
        raise CheckError(f"output directory does not exist: {root}")
    return sorted(p for p in root.rglob("*") if p.is_file() and p.name != ".DS_Store")


def file_kind(rel: str) -> str:
    name = Path(rel).name
    parts = Path(rel).parts
    suffix = Path(rel).suffix.lower()
    if suffix == ".pmtiles":
        return "pmtiles"
    if "shards" in parts and suffix == ".json":
        return "dossier_shard"
    if name == "manifest.json":
        return "dossier_manifest"
    if name == "run-record.json":
        return "run_record"
    if suffix == ".ndjson":
        stem = Path(rel).stem
        if stem in config.TILE_PROPERTY_KEYS:
            return f"tile_{stem}"
        return "tile_ndjson"
    if suffix == ".csv":
        return "csv"
    if suffix in {".geojson", ".json"}:
        return "json"
    if suffix in config.TEXT_SUFFIXES:
        return "text"
    return "binary"


def gzip_size(data: bytes) -> int:
    buf = io.BytesIO()
    with gzip.GzipFile(fileobj=buf, mode="wb", mtime=0) as gz:
        gz.write(data)
    return len(buf.getvalue())


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _walk_keys(obj: Any, out: set[str]) -> None:
    if isinstance(obj, Mapping):
        for key, value in obj.items():
            out.add(str(key))
            _walk_keys(value, out)
    elif isinstance(obj, list):
        for item in obj:
            _walk_keys(item, out)


def _parse_text(path: Path) -> tuple[str, Any | None, list[str]]:
    """Return (text, parsed_json_or_rows, headers)."""

    text = path.read_text(encoding="utf-8")
    suffix = path.suffix.lower()
    if suffix == ".ndjson":
        rows = []
        for line in text.splitlines():
            if line.strip():
                rows.append(json.loads(line))
        return text, rows, []
    if suffix in {".json", ".geojson"}:
        return text, json.loads(text) if text.strip() else {}, []
    if suffix == ".csv":
        reader = csv.DictReader(io.StringIO(text))
        headers = list(reader.fieldnames or [])
        return text, list(reader), headers
    return text, None, []


def _leak_findings(
    root: Path,
    files: Iterable[Path],
    withheld_values: Iterable[str],
) -> list[dict[str, str]]:
    findings: list[dict[str, str]] = []
    values = [v for v in withheld_values if v]
    for path in files:
        rel = _rel(root, path)
        kind = file_kind(rel)
        raw = path.read_bytes()
        if kind == "pmtiles" or kind == "binary":
            for name in config.FORBIDDEN_FIELD_NAMES:
                if name.encode("utf-8") in raw:
                    findings.append(
                        {"path": rel, "kind": "field_name", "name": name}
                    )
            for value in values:
                if value.encode("utf-8") in raw:
                    findings.append(
                        {"path": rel, "kind": "value", "name": value}
                    )
            continue
        text, parsed, headers = _parse_text(path)
        keys: set[str] = set(headers)
        if parsed is not None:
            _walk_keys(parsed, keys)
        for name in keys:
            if name in config.FORBIDDEN_FIELD_NAMES:
                findings.append({"path": rel, "kind": "field_name", "name": name})
            if kind == "dossier_shard":
                low = name.lower()
                for part in config.DOSSIER_FORBIDDEN_KEY_PARTS:
                    if part in low:
                        findings.append(
                            {"path": rel, "kind": "forbidden_key_part", "name": name}
                        )
                        break
        for value in values:
            if value in text:
                findings.append({"path": rel, "kind": "value", "name": value})
    return findings


def _allowlist_for(kind: str) -> frozenset[str] | None:
    if kind == "dossier_shard":
        return config.DOSSIER_SHARD_ENVELOPE | config.DOSSIER_RECORD_KEYS
    if kind == "dossier_manifest":
        return config.DOSSIER_MANIFEST_KEYS
    if kind == "run_record":
        return config.RUN_RECORD_KEYS
    if kind.startswith("tile_"):
        stem = kind[len("tile_") :]
        return config.TILE_PROPERTY_KEYS.get(stem, frozenset())
    if kind in {"pmtiles", "binary"}:
        return None
    return frozenset()


def _allowlist_findings(root: Path, files: Iterable[Path]) -> list[dict[str, str]]:
    findings: list[dict[str, str]] = []
    for path in files:
        rel = _rel(root, path)
        kind = file_kind(rel)
        allowed = _allowlist_for(kind)
        if allowed is None:
            continue
        if kind in {"csv", "json", "text", "tile_ndjson"} and not allowed:
            findings.append(
                {
                    "path": rel,
                    "kind": "unknown_output",
                    "name": kind,
                }
            )
            continue
        if kind == "dossier_shard":
            payload = json.loads(path.read_text(encoding="utf-8"))
            extra = set(payload) - config.DOSSIER_SHARD_ENVELOPE
            for name in sorted(extra):
                findings.append({"path": rel, "kind": "unknown_field", "name": name})
            records = payload.get("records", {})
            if not isinstance(records, Mapping):
                findings.append(
                    {"path": rel, "kind": "unknown_field", "name": "records"}
                )
                continue
            for rec in records.values():
                try:
                    screen_record(rec)
                except ScreeningError as exc:
                    findings.append(
                        {"path": rel, "kind": "unknown_field", "name": str(exc)}
                    )
            continue
        keys: set[str] = set()
        _text, parsed, headers = _parse_text(path)
        keys.update(headers)
        if kind.startswith("tile_") and isinstance(parsed, list):
            for row in parsed:
                props = row.get("properties", row) if isinstance(row, Mapping) else {}
                if isinstance(props, Mapping):
                    keys.update(str(k) for k in props)
        elif kind in {"dossier_manifest", "run_record"} and isinstance(parsed, Mapping):
            # Value maps (counts, coverage, metrics) are data, not schema fields.
            keys.update(str(k) for k in parsed)
        elif parsed is not None:
            _walk_keys(parsed, keys)
        for name in sorted(keys - allowed):
            findings.append({"path": rel, "kind": "unknown_field", "name": name})
    return findings


def _percentile(values: list[int], pct: float) -> int:
    if not values:
        return 0
    ordered = sorted(values)
    if len(ordered) == 1:
        return ordered[0]
    rank = (len(ordered) - 1) * pct / 100.0
    lo = int(rank)
    hi = min(lo + 1, len(ordered) - 1)
    frac = rank - lo
    return int(ordered[lo] * (1 - frac) + ordered[hi] * frac)


def _size_findings(
    root: Path,
    files: Iterable[Path],
    budgets: Mapping[str, Mapping[str, int]],
) -> tuple[list[dict[str, Any]], list[dict[str, Any]], dict[str, Any]]:
    fails: list[dict[str, Any]] = []
    warns: list[dict[str, Any]] = []
    shard_sizes: list[int] = []
    total = 0
    measured: dict[str, Any] = {"files": []}

    def _judge(metric: str, path: str, value: int) -> None:
        budget = budgets[metric]
        row = {"path": path, "metric": metric, "bytes": value, "fail": budget["fail"]}
        if value > budget["fail"]:
            fails.append(row)
        elif value > budget["warn"]:
            warns.append({**row, "warn": budget["warn"]})

    for path in files:
        rel = _rel(root, path)
        kind = file_kind(rel)
        data = path.read_bytes()
        total += len(data)
        entry: dict[str, Any] = {"path": rel, "bytes": len(data), "kind": kind}
        if kind == "pmtiles":
            _judge("pmtiles_bytes", rel, len(data))
        elif Path(rel).name in config.STARTUP_NAMES:
            compressed = gzip_size(data)
            entry["compressed_bytes"] = compressed
            _judge("startup_compressed_bytes", rel, compressed)
        elif kind == "dossier_shard":
            compressed = gzip_size(data)
            entry["compressed_bytes"] = compressed
            shard_sizes.append(compressed)
            _judge("shard_compressed_bytes", rel, compressed)
        measured["files"].append(entry)

    measured["total_bytes"] = total
    measured["shard_p95_compressed_bytes"] = _percentile(shard_sizes, 95)
    _judge("total_bytes", ".", total)
    if shard_sizes:
        _judge("shard_compressed_bytes", "shards (p95)", measured["shard_p95_compressed_bytes"])
    return fails, warns, measured


def _collect_ids(root: Path, files: Iterable[Path]) -> set[str]:
    ids: set[str] = set()
    for path in files:
        if file_kind(_rel(root, path)) != "dossier_shard":
            continue
        payload = json.loads(path.read_text(encoding="utf-8"))
        records = payload.get("records", {})
        if isinstance(records, Mapping):
            ids.update(str(k) for k in records)
    return ids


def _collect_metrics(root: Path) -> dict[str, Any] | None:
    manifest = root / "manifest.json"
    if not manifest.is_file():
        return None
    payload = json.loads(manifest.read_text(encoding="utf-8"))
    out = {}
    for key in ("counts", "coverage", "gap_counts"):
        if key in payload:
            out[key] = payload[key]
    return out or None


def _repro_findings(
    output: Path,
    reference: Path | None,
    explained: set[str],
    require_reference: bool,
) -> tuple[str, list[dict[str, str]], dict[str, Any]]:
    if reference is None:
        reason = "no reference tree"
        if require_reference:
            return FAIL, [{"path": ".", "kind": "missing_reference", "name": reason}], {}
        return SKIP, [], {"reason": reason}

    reference = Path(reference)
    if not reference.is_dir():
        return FAIL, [{"path": str(reference), "kind": "missing_reference", "name": "missing"}], {}

    out_files = {_rel(output, p): p for p in iter_files(output)}
    ref_files = {_rel(reference, p): p for p in iter_files(reference)}
    findings: list[dict[str, str]] = []
    hashes = {"output": {}, "reference": {}}

    for rel in sorted(set(out_files) | set(ref_files)):
        if rel in explained:
            continue
        if rel not in out_files:
            findings.append({"path": rel, "kind": "missing_in_output", "name": rel})
            continue
        if rel not in ref_files:
            findings.append({"path": rel, "kind": "extra_in_output", "name": rel})
            continue
        out_hash = sha256_bytes(out_files[rel].read_bytes())
        ref_hash = sha256_bytes(ref_files[rel].read_bytes())
        hashes["output"][rel] = out_hash
        hashes["reference"][rel] = ref_hash
        if out_hash != ref_hash:
            findings.append({"path": rel, "kind": "byte_mismatch", "name": rel})

    out_ids = _collect_ids(output, out_files.values())
    ref_ids = _collect_ids(reference, ref_files.values())
    if out_ids != ref_ids:
        findings.append(
            {
                "path": "shards",
                "kind": "id_mismatch",
                "name": f"output={len(out_ids)} reference={len(ref_ids)}",
            }
        )
    out_metrics = _collect_metrics(output)
    ref_metrics = _collect_metrics(reference)
    if out_metrics is not None and ref_metrics is not None and out_metrics != ref_metrics:
        findings.append({"path": "manifest.json", "kind": "metric_mismatch", "name": "counts"})

    status = FAIL if findings else PASS
    return status, findings, hashes


def run_checks(
    output: Path,
    reference: Path | None = None,
    withheld_values: Iterable[str] = (),
    explained: Iterable[str] = (),
    require_reference: bool = False,
    budgets: Mapping[str, Mapping[str, int]] | None = None,
) -> dict[str, Any]:
    """Run all four increment-1 checks. Returns a machine-readable report."""

    output = Path(output)
    files = iter_files(output)
    used_budgets = dict(config.SIZE_BUDGETS)
    if budgets:
        used_budgets.update(budgets)

    leak = _leak_findings(output, files, withheld_values)
    allow = _allowlist_findings(output, files)
    size_fails, size_warns, size_measured = _size_findings(output, files, used_budgets)
    repro_status, repro_findings, repro_extra = _repro_findings(
        output, reference, set(explained), require_reference
    )

    checks = {
        "leak": {
            "status": FAIL if leak else PASS,
            "findings": leak,
        },
        "allowlist": {
            "status": FAIL if allow else PASS,
            "findings": allow,
        },
        "size": {
            "status": FAIL if size_fails else (WARN if size_warns else PASS),
            "findings": size_fails,
            "warnings": size_warns,
            "measured": size_measured,
        },
        "reproducibility": {
            "status": repro_status,
            "findings": repro_findings,
            **repro_extra,
        },
    }
    statuses = [row["status"] for row in checks.values()]
    ok = all(status in {PASS, WARN, SKIP} for status in statuses)
    return {
        "ok": ok,
        "output": str(output),
        "file_count": len(files),
        "checks": checks,
    }
