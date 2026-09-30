"""Conservative New York parcel identifier helpers for NIA-79.

Inputs must be text. ``IdentifierRefusal.code`` is a stable, machine-readable
stamp; no helper repairs numbers that may have lost leading or trailing digits.
See docs/normalization/ny-sbl.md for the inferred print-key layout and limits.
"""

from dataclasses import dataclass
from typing import Iterable, Literal


class IdentifierRefusal(ValueError):
    """A refused identifier operation, with a machine-readable ``code``."""

    def __init__(self, code: str):
        self.code = code
        super().__init__(code)


def _digits(value: object, length: int, *, swis: bool = False) -> str:
    if isinstance(value, float):
        raise IdentifierRefusal("float_stored_input")
    if isinstance(value, str):
        if not value:
            raise IdentifierRefusal("empty_input")
        if swis and any(c.isalpha() for c in value):
            raise IdentifierRefusal("swis_name_not_code")
        if len(value) != length:
            raise IdentifierRefusal("wrong_length")
        if not value.isascii() or not value.isdecimal():
            raise IdentifierRefusal("non_digit")
        return value
    if isinstance(value, (int, bool)):
        raise IdentifierRefusal("bare_number_type")
    raise IdentifierRefusal("unsupported_type")


def validate_sbl20(value: object) -> str:
    """Return an unchanged 20-digit text SBL, or refuse it."""

    return _digits(value, 20)


def validate_swis6(value: object) -> str:
    """Return a six-digit code; municipality names are explicitly refused."""

    return _digits(value, 6, swis=True)


def compose_swis_sbl(swis6: object, sbl20: object) -> str:
    """Compose the 26-character comparison key from a SWIS code and SBL."""

    return validate_swis6(swis6) + validate_sbl20(sbl20)


def validate_swis_sbl_id(value: object) -> str:
    """Validate a precomposed 26-character code without changing it."""

    identifier = _digits(value, 26)
    validate_swis6(identifier[:6])
    validate_sbl20(identifier[6:])
    return identifier


def render_print_key(sbl20: object, style: Literal["padded", "unpadded"]) -> str:
    """Render the limited, inferred 6/4/6/4 SBL shape in a layer's style.

    This is a display operation. It must never be used as a cross-layer join.
    Nonzero suffixes and fractional lots are refused pending publisher evidence.
    """

    sbl = validate_sbl20(sbl20)
    if style not in ("padded", "unpadded"):
        raise IdentifierRefusal("unknown_print_style")
    section, block, lot, suffix = sbl[:6], sbl[6:10], sbl[10:16], sbl[16:]
    if suffix != "0000":
        raise IdentifierRefusal("unsupported_suffix")
    if lot[3:] != "000":
        raise IdentifierRefusal("unsupported_fractional_lot")
    whole = section[:3] if style == "padded" else str(int(section[:3]))
    fractional = section[3:].rstrip("0")
    # The statewide example '3.-1-1' retains the dot for an empty fraction.
    section_text = f"{whole}.{fractional}"
    return f"{section_text}-{int(block)}-{int(lot[:3])}"


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
