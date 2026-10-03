"""Evidence-based New York parcel identifier helpers for NIA-79.

Inputs must be text. ``IdentifierRefusal.code`` is a stable, machine-readable
stamp; no helper repairs numbers that may have lost leading or trailing digits.
See docs/normalization/ny-sbl-real-data-evidence.md for coverage and limits.
"""

from dataclasses import dataclass
from typing import Iterable, Literal


class IdentifierRefusal(ValueError):
    """A refused identifier operation, with a machine-readable ``code``."""

    def __init__(self, code: str):
        self.code = code
        super().__init__(code)


def _text(value: object, length: int, *, swis: bool = False) -> str:
    if isinstance(value, float):
        raise IdentifierRefusal("float_stored_input")
    if isinstance(value, str):
        if not value:
            raise IdentifierRefusal("empty_input")
        if swis and any(c.isalpha() for c in value):
            raise IdentifierRefusal("swis_name_not_code")
        if len(value) != length:
            raise IdentifierRefusal("wrong_length")
        if not value.isascii() or not value.isalnum():
            raise IdentifierRefusal("invalid_character")
        if swis and not value.isdecimal():
            raise IdentifierRefusal("non_digit")
        return value
    if isinstance(value, (int, bool)):
        raise IdentifierRefusal("bare_number_type")
    raise IdentifierRefusal("unsupported_type")


def validate_sbl20(value: object) -> str:
    """Return an unchanged 20-character SBL, or refuse it.

    The numeric section/block/lot and alphanumeric sublot/suffix are observed.
    """

    identifier = _text(value, 20)
    if not identifier[:13].isdecimal():
        raise IdentifierRefusal("unsupported_sbl_shape")
    return identifier


def validate_swis6(value: object) -> str:
    """Return a six-digit code; municipality names are explicitly refused."""

    return _text(value, 6, swis=True)


def compose_swis_sbl(swis6: object, sbl20: object) -> str:
    """Compose the 26-character comparison key from a SWIS code and SBL."""

    return validate_swis6(swis6) + validate_sbl20(sbl20)


def validate_swis_sbl_id(value: object) -> str:
    """Validate a precomposed 26-character code without changing it."""

    identifier = _text(value, 26)
    validate_swis6(identifier[:6])
    validate_sbl20(identifier[6:])
    return identifier


def render_print_key(
    sbl20: object,
    style: Literal["padded", "unpadded", "erie", "genesee", "chautauqua"],
    *,
    swis6: object = None,
) -> str:
    """Render observed publisher conventions for a 20-character SBL.

    ``padded`` is Rochester/Monroe; ``erie`` is Erie's statewide form.
    ``unpadded`` preserves the narrow pilot convention for compatibility.
    Genesee needs
    SWIS for nonzero subsection because two municipalities print it differently.
    Print keys are display attributes, never cross-layer join keys.
    """

    sbl = validate_sbl20(sbl20)
    if style not in ("padded", "unpadded", "erie", "genesee", "chautauqua"):
        raise IdentifierRefusal("unknown_print_style")
    section, block, lot, sublot, suffix = sbl[:6], sbl[6:10], sbl[10:13], sbl[13:16], sbl[16:]
    if not (section.isdecimal() and block.isdecimal() and lot.isdecimal()):
        raise IdentifierRefusal("unsupported_print_components")
    if swis6 is not None:
        swis6 = validate_swis6(swis6)
    whole = section[:3] if style in ("padded", "chautauqua") else str(int(section[:3]))
    raw_fraction = section[3:]
    if style == "genesee":
        if raw_fraction == "000":
            fractional = ""
        elif swis6 == "180200":
            fractional = raw_fraction
        elif swis6 in ("182400", "184289"):
            fractional = str(int(raw_fraction)).zfill(2)
        else:
            raise IdentifierRefusal("unknown_section_rendering")
    elif style == "chautauqua":
        fractional = str(int(raw_fraction)).zfill(2)
    elif style == "unpadded" and raw_fraction == "000":
        fractional = ""
    else:
        fractional = raw_fraction[:2] if raw_fraction[2] == "0" else raw_fraction
    block_text = block if style == "padded" and block == "0000" else str(int(block))
    lot_text = lot if style == "padded" and block == "0000" and lot == "000" else str(int(lot))
    if sublot == "000":
        sublot_text = ""
    elif style == "padded":
        sublot_text = sublot.rstrip("0")
    elif style == "chautauqua":
        sublot_text = sublot.lstrip("0") or "0"
    else:
        sublot_text = sublot.lstrip("0").rstrip("0") or "0"
    suffix_text = suffix.lstrip("0") if suffix != "0000" else ""
    rendered = f"{whole}.{fractional}-{block_text}-{lot_text}"
    if sublot_text or suffix_text:
        rendered += "." + sublot_text
    if suffix_text:
        rendered += ("." if style == "chautauqua" else "/") + suffix_text
    return rendered


@dataclass(frozen=True)
class Duplicate:
    identifier: str
    row_indexes: tuple[int, ...]


@dataclass(frozen=True)
class RejectedRow:
    row_index: int
    code: str


@dataclass(frozen=True)
class BatchReport:
    duplicates: tuple[Duplicate, ...]
    rejected: tuple[RejectedRow, ...]


def inspect_ids(values: Iterable[object], kind: Literal["sbl20", "swis_sbl_id"]) -> BatchReport:
    """Report repeated IDs and bad rows without deduplicating or choosing a winner.

    Row indexes are zero-based input positions. Duplicate groups are ordered by
    first appearance, and each group contains every occurrence of that ID.
    """

    if kind == "sbl20":
        validator = validate_sbl20
    elif kind == "swis_sbl_id":
        validator = validate_swis_sbl_id
    else:
        raise IdentifierRefusal("unknown_identifier_kind")
    positions: dict[str, list[int]] = {}
    rejected = []
    for index, value in enumerate(values):
        try:
            identifier = validator(value)
        except IdentifierRefusal as exc:
            rejected.append(RejectedRow(index, exc.code))
        else:
            positions.setdefault(identifier, []).append(index)
    duplicates = tuple(
        Duplicate(identifier, tuple(indexes))
        for identifier, indexes in positions.items()
        if len(indexes) > 1
    )
    return BatchReport(duplicates, tuple(rejected))
