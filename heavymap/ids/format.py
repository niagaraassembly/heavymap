"""Opaque HeavyMap local tokens (Crockford ULID) and spine-key grammar.

Hamilton parcel, address and building IDs use a 26-character ULID as ``{local}``.
The ULID is the identifier. Geometry fingerprints and native keys (ARN,
OBJECTID, civic text) are matching aids, never the ID, and are never reused
once minted. See docs/architecture/adr/0003-heavymap-id-format.md.
"""

from __future__ import annotations

import os
import re
import time
from dataclasses import dataclass
from typing import Iterable

CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"
_CROCKFORD_SET = frozenset(CROCKFORD)
GRAINS = ("parcel", "footprint", "address")
COUNTRIES = ("ca", "us")
REGIONS = ("on", "ny")

# Vocab-compatible reading of the spine template. Hamilton minted locals are
# additionally constrained to a Crockford ULID (see is_ulid).
SPINE_KEY_RE = re.compile(
    r"^hm:(ca|us):(on|ny):([a-z0-9]+(?:-[a-z0-9]+)*):(parcel|footprint|address):([A-Za-z0-9][A-Za-z0-9._-]*)$"
)
ULID_RE = re.compile(r"^[0-9A-HJKMNP-TV-Z]{26}$")


class IdError(ValueError):
    """Refused identifier operation with a machine-readable ``code``."""

    def __init__(self, code: str, detail: str = ""):
        self.code = code
        self.detail = detail
        super().__init__(code if not detail else f"{code}: {detail}")


@dataclass(frozen=True)
class SpineKey:
    country: str
    region: str
    jurisdiction: str
    grain: str
    local: str

    def __str__(self) -> str:
        return (
            f"hm:{self.country}:{self.region}:{self.jurisdiction}"
            f":{self.grain}:{self.local}"
        )


def encode_ulid(time_ms: int, randomness: bytes) -> str:
    """Encode a 48-bit timestamp and 80-bit random into a 26-character ULID."""

    if not isinstance(time_ms, int) or time_ms < 0 or time_ms >= 2**48:
        raise IdError("ulid_time_out_of_range")
    if not isinstance(randomness, (bytes, bytearray)) or len(randomness) != 10:
        raise IdError("ulid_randomness_length")
    n = (time_ms << 80) | int.from_bytes(randomness, "big")
    chars = []
    for _ in range(26):
        chars.append(CROCKFORD[n & 31])
        n >>= 5
    if n:
        raise IdError("ulid_overflow")
    return "".join(reversed(chars))


def is_ulid(value: object) -> bool:
    return isinstance(value, str) and bool(ULID_RE.fullmatch(value))


def parse_ulid(value: object) -> str:
    if not isinstance(value, str) or not is_ulid(value):
        raise IdError("invalid_ulid")
    return value


def make_spine_key(
    country: str,
    region: str,
    jurisdiction: str,
    grain: str,
    local: str,
    *,
    require_ulid: bool = True,
) -> str:
    if country not in COUNTRIES:
        raise IdError("invalid_country")
    if region not in REGIONS:
        raise IdError("invalid_region")
    if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", jurisdiction or ""):
        raise IdError("invalid_jurisdiction")
    if grain not in GRAINS:
        raise IdError("invalid_grain")
    if require_ulid:
        parse_ulid(local)
    elif not isinstance(local, str) or ":" in local or not local:
        raise IdError("invalid_local")
    return str(
        SpineKey(
            country=country,
            region=region,
            jurisdiction=jurisdiction,
            grain=grain,
            local=local,
        )
    )


def parse_spine_key(value: object) -> SpineKey:
    if not isinstance(value, str):
        raise IdError("unsupported_type")
    match = SPINE_KEY_RE.fullmatch(value)
    if not match:
        raise IdError("invalid_spine_key")
    return SpineKey(*match.groups())


class IdFactory:
    """Mint ULIDs that are unique for the lifetime of this factory.

    Pass ``clock_ms`` and ``rng`` for deterministic tests. Production uses
    wall-clock milliseconds and ``os.urandom``. Retired IDs must be primed
    via ``used`` so they are never reissued.
    """

    def __init__(
        self,
        *,
        clock_ms: int | None = None,
        rng: object | None = None,
        used: Iterable[str] = (),
    ) -> None:
        self.clock_ms = clock_ms
        self.rng = rng
        self.used: set[str] = set(used)
        self._seq = 0

    def _time_ms(self) -> int:
        if self.clock_ms is None:
            return int(time.time() * 1000)
        return int(self.clock_ms) + self._seq

    def _randomness(self) -> bytes:
        if self.rng is None:
            return os.urandom(10)
        getrandbits = getattr(self.rng, "getrandbits", None)
        if getrandbits is None:
            raise IdError("invalid_rng")
        return bytes(getrandbits(8) for _ in range(10))

    def mint_local(self) -> str:
        for _ in range(1024):
            self._seq += 1
            local = encode_ulid(self._time_ms(), self._randomness())
            if local not in self.used:
                self.used.add(local)
                return local
        raise IdError("ulid_collision")

    def mint_key(
        self,
        country: str,
        region: str,
        jurisdiction: str,
        grain: str,
    ) -> str:
        return make_spine_key(
            country, region, jurisdiction, grain, self.mint_local()
        )

    def remember(self, locals_or_keys: Iterable[str]) -> None:
        for item in locals_or_keys:
            if item.startswith("hm:"):
                try:
                    parsed = parse_spine_key(item)
                except IdError:
                    continue
                self.used.add(parsed.local)
            elif is_ulid(item):
                self.used.add(item)
