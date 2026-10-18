"""Data-gaps ledger: schema, CSV load, placeholder ARNs, per-parcel attach.

The spreadsheet ``Spreadsheets/20-data-gaps-ledger.csv`` is the inventory.
This module is stdlib-only and imports neither dossier nor the ID registry
store, so both can use it. Docs: ``docs/architecture/data-gaps-ledger.md``.
"""

from __future__ import annotations

import csv
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable, Mapping

REPO_ROOT = Path(__file__).resolve().parents[1]
LEDGER_REL = Path("Spreadsheets/20-data-gaps-ledger.csv")

SCOPES = ("dataset", "layer", "field", "parcel")
GAP_TYPES = (
    "empty",
    "sparse",
    "stale",
    "placeholder",
    "contradictory",
    "corrupted",
    "withheld_screened",
    "not_in_coverage",
    "not_present_in_source",
)
STATUSES = ("open", "provisional", "actioned", "superseded")
MANIFEST_SCOPES = ("dataset", "layer", "field")

# Closed parcel_attach tokens. ``overlay=<layer_id>`` is prefix-matched.
ATTACH_EXACT = (
    "manifest_only",
    "coverage=not_covered",
    "coverage=in_coverage_unmatched",
    "coverage=arn_invalid",
    "roll_flag=placeholder",
    "has_valid_arn",
    "has_valid_arn+missing_property_code",
    "has_valid_arn+has_property_code",
)

PUBLISH_PRIORITIES = (
    "must_solve_before_publish",
    "label_and_ship",
    "later",
)

LEDGER_COLUMNS = (
    "gap_id",
    "scope",
    "jurisdiction",
    "layer_id",
    "field",
    "gap_type",
    "reason",
    "numerator",
    "denominator",
    "unit",
    "evidence",
    "first_observed",
    "source_pi_ids",
    "parcel_attach",
    "status",
    "publish_priority",
    "notes",
)

# Output keys that may appear in a dossier record or manifest entry derived
# from the ledger. Field *names* (Owner, Legal_Txt) may appear as *values*
# of ``field``. They must never become keys.
PUBLIC_ENTRY_KEYS = (
    "gap_id",
    "scope",
    "jurisdiction",
    "layer_id",
    "field",
    "gap_type",
    "reason",
    "numerator",
    "denominator",
    "unit",
    "evidence",
    "first_observed",
    "source_pi_ids",
    "parcel_attach",
    "status",
    "publish_priority",
)


class LedgerError(ValueError):
    """The gaps ledger CSV failed a schema check."""


def is_placeholder_arn(raw: str | None) -> bool:
    """True for all-zero roll numbers (the documented Hamilton sentinel).

    PI-0059 / Q-019: ``000000000000000`` on NPCA Assessment_Parcels_Test.
    Any non-empty digit string that is only zeros is treated the same, after
    stripping hyphens and spaces. A non-Hamilton prefix that still has real
    digits (Grimsby ``2615…``, Q-019) is not a placeholder.
    """

    if raw is None:
        return False
    digits = "".join(ch for ch in str(raw) if ch.isdigit())
    return bool(digits) and set(digits) == {"0"}


def _parse_int(raw: str) -> int | None:
    text = (raw or "").strip()
    if text == "":
        return None
    return int(text.replace(",", ""))


def _split_multi(raw: str) -> tuple[str, ...]:
    if not (raw or "").strip():
        return ()
    return tuple(part.strip() for part in raw.split("|") if part.strip())


def _check_attach(token: str) -> None:
    if token in ATTACH_EXACT:
        return
    if token.startswith("overlay=") and token.split("=", 1)[1]:
        return
    raise LedgerError(f"unknown parcel_attach token {token!r}")


def ledger_path(root: Path | None = None) -> Path:
    return (Path(root) if root is not None else REPO_ROOT) / LEDGER_REL


def load_ledger(path: Path | None = None) -> list[dict[str, Any]]:
    """Load and validate the CSV. ``numerator`` / ``denominator`` become ints."""

    src = Path(path) if path is not None else ledger_path()
    with src.open(encoding="utf-8", newline="") as fh:
        reader = csv.DictReader(fh)
        if reader.fieldnames != list(LEDGER_COLUMNS):
            raise LedgerError(
                f"ledger columns {reader.fieldnames!r} != {list(LEDGER_COLUMNS)!r}"
            )
        rows = list(reader)

    seen: set[str] = set()
    out: list[dict[str, Any]] = []
    for i, raw in enumerate(rows, start=2):
        gap_id = (raw.get("gap_id") or "").strip()
        if not gap_id.startswith("GAP-"):
            raise LedgerError(f"line {i}: gap_id {gap_id!r} is not GAP-NNNN")
        if gap_id in seen:
            raise LedgerError(f"line {i}: duplicate gap_id {gap_id}")
        seen.add(gap_id)
        scope = (raw.get("scope") or "").strip()
        if scope not in SCOPES:
            raise LedgerError(f"line {i}: unknown scope {scope!r}")
        gap_type = (raw.get("gap_type") or "").strip()
        if gap_type not in GAP_TYPES:
            raise LedgerError(f"line {i}: unknown gap_type {gap_type!r}")
        status = (raw.get("status") or "").strip()
        if status not in STATUSES:
            raise LedgerError(f"line {i}: unknown status {status!r}")
        publish_priority = (raw.get("publish_priority") or "").strip()
        if publish_priority not in PUBLISH_PRIORITIES:
            raise LedgerError(
                f"line {i}: unknown publish_priority {publish_priority!r}"
            )
        reason = (raw.get("reason") or "").strip()
        if not reason:
            raise LedgerError(f"line {i}: reason is blank")
        attach_tokens = _split_multi(raw.get("parcel_attach") or "")
        if not attach_tokens:
            raise LedgerError(f"line {i}: parcel_attach is blank")
        for token in attach_tokens:
            _check_attach(token)
        if gap_type == "withheld_screened" and attach_tokens != ("manifest_only",):
            raise LedgerError(
                f"line {i}: withheld_screened must be manifest_only, not {attach_tokens}"
            )
        pi_ids = _split_multi(raw.get("source_pi_ids") or "")
        if not pi_ids:
            raise LedgerError(f"line {i}: source_pi_ids is blank")
        out.append(
            {
                "gap_id": gap_id,
                "scope": scope,
                "jurisdiction": (raw.get("jurisdiction") or "").strip(),
                "layer_id": (raw.get("layer_id") or "").strip(),
                "field": (raw.get("field") or "").strip(),
                "gap_type": gap_type,
                "reason": reason,
                "numerator": _parse_int(raw.get("numerator") or ""),
                "denominator": _parse_int(raw.get("denominator") or ""),
                "unit": (raw.get("unit") or "").strip(),
                "evidence": (raw.get("evidence") or "").strip(),
                "first_observed": (raw.get("first_observed") or "").strip(),
                "source_pi_ids": list(pi_ids),
                "parcel_attach": list(attach_tokens),
                "status": status,
                "publish_priority": publish_priority,
                "notes": (raw.get("notes") or "").strip(),
            }
        )
    return out


def public_entry(row: Mapping[str, Any]) -> dict[str, Any]:
    """Manifest shape: schema fields minus internal notes."""

    return {key: row[key] for key in PUBLIC_ENTRY_KEYS}


def manifest_ledger(rows: Iterable[Mapping[str, Any]] | None = None) -> dict[str, Any]:
    """Dataset, layer and field rows for the dossier manifest."""

    rows = list(rows) if rows is not None else load_ledger()
    entries = [public_entry(row) for row in rows if row["scope"] in MANIFEST_SCOPES]
    return {
        "schema": "docs/architecture/data-gaps-ledger.md",
        "path": str(LEDGER_REL).replace("\\", "/"),
        "gap_types": list(GAP_TYPES),
        "scopes": list(SCOPES),
        "note": (
            "Per-parcel records cite gap_id only. Copy lives here. "
            "withheld_screened names the field and the screening rule, never a value. "
            "Overlay slivers are flagged on overlay rows, not listed as gaps."
        ),
        "entries": entries,
    }


@dataclass(frozen=True)
class ParcelGapContext:
    coverage_status: str
    has_valid_arn: bool
    has_property_code: bool
    roll_flags: tuple[str, ...]
    overlay_layers: tuple[str, ...]


def context_from_record(record: Mapping[str, Any]) -> ParcelGapContext:
    rolls = list(record.get("roll") or [])
    overlays = (record.get("overlays") or {}).get("rows") or []
    return ParcelGapContext(
        coverage_status=str((record.get("coverage") or {}).get("status") or ""),
        has_valid_arn=any(r.get("arn") for r in rolls),
        has_property_code=any("property_code" in r for r in rolls),
        roll_flags=tuple(str(r.get("flag") or "") for r in rolls if r.get("flag")),
        overlay_layers=tuple(str(r.get("layer") or "") for r in overlays),
    )


def _token_matches(token: str, ctx: ParcelGapContext) -> bool:
    if token == "manifest_only":
        return False
    if token == "coverage=not_covered":
        return ctx.coverage_status == "not_covered"
    if token == "coverage=in_coverage_unmatched":
        return ctx.coverage_status == "in_coverage_unmatched"
    if token == "coverage=arn_invalid":
        return ctx.coverage_status == "arn_invalid"
    if token == "roll_flag=placeholder":
        return "placeholder" in ctx.roll_flags
    if token == "has_valid_arn":
        return ctx.has_valid_arn
    if token == "has_valid_arn+missing_property_code":
        return ctx.has_valid_arn and not ctx.has_property_code
    if token == "has_valid_arn+has_property_code":
        return ctx.has_valid_arn and ctx.has_property_code
    if token.startswith("overlay="):
        return token.split("=", 1)[1] in ctx.overlay_layers
    return False


def parcel_gap_ids(
    ctx: ParcelGapContext,
    rows: Iterable[Mapping[str, Any]] | None = None,
) -> list[str]:
    """Sorted gap_ids that apply to this parcel. No reason text."""

    rows = list(rows) if rows is not None else load_ledger()
    ids: list[str] = []
    for row in rows:
        if any(_token_matches(token, ctx) for token in row["parcel_attach"]):
            ids.append(row["gap_id"])
    return ids
