"""Canonical JSON for record hashes (contract: seam-contract-dossier.md section 5).

Follows RFC 8785 (JSON Canonicalization Scheme) for the value types the dossier
uses: objects with string keys sorted by Unicode code point, no whitespace,
strings escaped minimally, and numbers written as ECMAScript ``Number`` would
write them (so ``1.0`` is ``1`` and ``1e-05`` is ``0.00001``). The JavaScript
twin is ``web/src/canonical.js``; ``tests/canonical-vectors.json`` pins both.

NaN, infinities, and non-JSON types are refused.
"""

from __future__ import annotations

import hashlib
import json
import math
from typing import Any


class CanonicalError(ValueError):
    pass


def _number(x: float | int) -> str:
    if isinstance(x, bool):
        raise CanonicalError("bool is not a number")
    if isinstance(x, int):
        if abs(x) > 2**53:
            raise CanonicalError("integer outside the exact range of a JavaScript number")
        return str(x)
    if not math.isfinite(x):
        raise CanonicalError("NaN and infinity are not JSON")
    if x == 0:
        return "0"  # also -0.0
    sign = "-" if x < 0 else ""
    # Shortest round-trip digits and exponent from repr, then ECMAScript layout.
    mantissa, _, exp = repr(abs(x)).partition("e")
    int_part, _, frac = mantissa.partition(".")
    digits = (int_part + frac).lstrip("0")
    point = len(int_part) + (int(exp) if exp else 0)
    # Position of the decimal point relative to ``digits`` after stripping leading zeros.
    stripped = len(int_part + frac) - len((int_part + frac).lstrip("0"))
    point -= stripped
    digits = digits.rstrip("0") or "0"
    k, n = len(digits), point  # value = 0.digits * 10**n
    if k <= n <= 21:
        out = digits + "0" * (n - k)
    elif 0 < n <= 21:
        out = digits[:n] + "." + digits[n:]
    elif -6 < n <= 0:
        out = "0." + "0" * (-n) + digits
    else:
        e = n - 1
        es = ("+" if e >= 0 else "-") + str(abs(e))
        out = digits[0] + ("." + digits[1:] if k > 1 else "") + "e" + es
    return sign + out


def _string(s: str) -> str:
    # json.dumps with ensure_ascii=False escapes exactly: quote, backslash,
    # \b \f \n \r \t and other control characters as \u00xx (lowercase hex),
    # which is what RFC 8785 requires.
    return json.dumps(s, ensure_ascii=False)


def _encode(v: Any, out: list[str]) -> None:
    if v is None:
        out.append("null")
    elif v is True:
        out.append("true")
    elif v is False:
        out.append("false")
    elif isinstance(v, (int, float)):
        out.append(_number(v))
    elif isinstance(v, str):
        out.append(_string(v))
    elif isinstance(v, (list, tuple)):
        out.append("[")
        for i, item in enumerate(v):
            if i:
                out.append(",")
            _encode(item, out)
        out.append("]")
    elif isinstance(v, dict):
        for k in v:
            if not isinstance(k, str):
                raise CanonicalError("object keys must be strings")
        out.append("{")
        # Sort by code point (Python str comparison); JavaScript must not use
        # its default UTF-16 order for astral characters.
        for i, k in enumerate(sorted(v)):
            if i:
                out.append(",")
            out.append(_string(k))
            out.append(":")
            _encode(v[k], out)
        out.append("}")
    else:
        raise CanonicalError(f"unsupported type {type(v).__name__}")


def canonical_bytes(value: Any) -> bytes:
    out: list[str] = []
    _encode(value, out)
    return "".join(out).encode("utf-8")


def record_hash(value: Any) -> str:
    """``sha256:<hex>`` of the canonical bytes of a core record."""

    return "sha256:" + hashlib.sha256(canonical_bytes(value)).hexdigest()
