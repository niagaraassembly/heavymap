"""Dossier record schema, source-field allowlists and the screening check.

Screening is an allowlist, not a denylist:

1. ``SOURCE_FIELDS`` names the only properties read from each pulled source
   file. Everything else (Owner, Legal_Txt, PostalCode, mailing fields, any
   field added upstream later) is dropped inside the loader, before a record
   is built.
2. ``RECORD_SPEC`` is the only shape a record may take. ``screen_record``
   walks every record before it is written and raises ``ScreeningError`` on
   any key that is not in the spec, or on a value of the wrong kind.

Adding an output field means editing ``RECORD_SPEC`` here, in review.
"""

from __future__ import annotations

from typing import Any, Mapping

SCHEMA_VERSION = 1

# Source properties the dossier may read. Nothing else leaves the loader.
SOURCE_FIELDS: dict[str, tuple[str, ...]] = {
    # NPCA Assessment_Parcels_Test: row id, roll number, MPAC street text.
    "LYR-NPCA-ASSESSMENT-PARCELS-TEST": ("OBJECTID_1", "ARN", "MPAC_STREE"),
    # NPCA Parcels_Cityview: roll number and MPAC property code only.
    "LYR-NPCA-PARCELS-CITYVIEW": ("ARN", "PropCode"),
}

# Leaf kinds.
STR = "str"
NUM = "num"
INT = "int"
BOOL = "bool"
STR_OR_NULL = "str?"


def _list(spec: Any) -> tuple[str, Any]:
    return ("list", spec)


PROVENANCE = {
    "src": STR,
    "join": STR,
    "conf": STR,
    "label": STR,
}

PROPERTY_CODE_SPEC = {
    **PROVENANCE,
    "code": STR,
    "family": STR_OR_NULL,
}

ROLL_SPEC = {
    **PROVENANCE,
    "arn": STR_OR_NULL,
    "grade": STR,
    "method": STR,
    "iou": NUM,
    "flag": STR,
    "roll_address": STR,
    "property_code": PROPERTY_CODE_SPEC,
}

ADDRESS_SPEC = {
    "id": STR,
    "text": STR,
    "unit": STR,
    "join": STR,
    "conf": STR,
}

OVERLAY_SPEC = {
    "layer": STR,
    "class": STR,
    "label": STR,
    "share": NUM,
    "m2": NUM,
    "fid": STR,
    "sliver": BOOL,
}

RECORD_SPEC: dict[str, Any] = {
    "heavymap_id": STR,
    "area": {**PROVENANCE, "m2": NUM},
    "coverage": {**PROVENANCE, "status": STR, "provisional": BOOL, "grade": STR},
    "roll": _list(ROLL_SPEC),
    "addresses": {
        "src": STR,
        "join": STR,
        "label": STR,
        "count": INT,
        "truncated": BOOL,
        "shown": _list(ADDRESS_SPEC),
    },
    "overlays": {
        "src": STR,
        "join": STR,
        "label": STR,
        "rows": _list(OVERLAY_SPEC),
        "sliver_count": INT,
    },
}

REQUIRED_KEYS = ("heavymap_id", "area", "coverage", "roll", "addresses", "overlays")

# Substrings that must never appear in an output key or an allowlisted source
# field. ``audit_spec`` runs at import, so a careless edit fails loudly.
FORBIDDEN_KEY_PARTS = ("owner", "legal", "mail", "postal", "name", "phone", "email")


class ScreeningError(ValueError):
    """A record failed the output allowlist."""


def _kind_ok(kind: str, value: Any) -> bool:
    if kind == STR:
        return isinstance(value, str)
    if kind == STR_OR_NULL:
        return value is None or isinstance(value, str)
    if kind == BOOL:
        return isinstance(value, bool)
    if kind == INT:
        return isinstance(value, int) and not isinstance(value, bool)
    if kind == NUM:
        return isinstance(value, (int, float)) and not isinstance(value, bool)
    return False


def _walk(value: Any, spec: Any, path: str) -> None:
    if isinstance(spec, dict):
        if not isinstance(value, Mapping):
            raise ScreeningError(f"{path}: expected object")
        for key, sub in value.items():
            if key not in spec:
                raise ScreeningError(f"{path}.{key}: key not in output allowlist")
            _walk(sub, spec[key], f"{path}.{key}")
        return
    if isinstance(spec, tuple) and spec and spec[0] == "list":
        if not isinstance(value, list):
            raise ScreeningError(f"{path}: expected list")
        for i, item in enumerate(value):
            _walk(item, spec[1], f"{path}[{i}]")
        return
    if not _kind_ok(spec, value):
        raise ScreeningError(f"{path}: value kind not allowed ({type(value).__name__})")


def screen_record(record: Mapping[str, Any]) -> Mapping[str, Any]:
    """Raise ``ScreeningError`` unless ``record`` fits ``RECORD_SPEC``."""

    if not isinstance(record, Mapping):
        raise ScreeningError("record: expected object")
    for key in REQUIRED_KEYS:
        if key not in record:
            raise ScreeningError(f"record.{key}: required key missing")
    _walk(record, RECORD_SPEC, "record")
    return record


def spec_keys(spec: Any = None) -> set[str]:
    """Every key name that may appear anywhere in an output record."""

    spec = RECORD_SPEC if spec is None else spec
    out: set[str] = set()
    if isinstance(spec, dict):
        for key, sub in spec.items():
            out.add(key)
            out |= spec_keys(sub)
    elif isinstance(spec, tuple) and spec and spec[0] == "list":
        out |= spec_keys(spec[1])
    return out


def audit_spec() -> None:
    for key in spec_keys():
        low = key.lower()
        for part in FORBIDDEN_KEY_PARTS:
            if part in low:
                raise ScreeningError(f"output allowlist key {key!r} contains {part!r}")
    for layer, fields in SOURCE_FIELDS.items():
        for field in fields:
            low = field.lower()
            for part in FORBIDDEN_KEY_PARTS:
                if part in low:
                    raise ScreeningError(f"{layer} source field {field!r} contains {part!r}")


def pick(properties: Mapping[str, Any], layer_id: str) -> dict[str, Any]:
    """Keep only the allowlisted source properties for ``layer_id``."""

    allowed = SOURCE_FIELDS[layer_id]
    return {k: properties.get(k) for k in allowed}


audit_spec()
