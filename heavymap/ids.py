"""ID helpers. NY parcel identifier rules live in :mod:`heavymap.ny_identifiers` and are re-exported.

Principles (docs/for-agents/ID-RULES.md): staging IDs are hash based and never sequential, canonical
IDs are deterministic slugs, decision IDs are ULIDs, IDs are always text.
"""

import hashlib
import os
import re
import time
from urllib.parse import urlsplit

from .ny_identifiers import (  # noqa: F401  (re-exported)
    IdentifierRefusal,
    compose_swis_sbl,
    inspect_ids,
    render_print_key,
    validate_sbl20,
    validate_swis6,
    validate_swis_sbl_id,
)

_CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"
SLUG_RE = re.compile(r"[^a-z0-9]+")


def slug(text):
    return SLUG_RE.sub("-", text.lower()).strip("-")


def canonical_endpoint(url):
    """Lowercase scheme and host, drop query, fragment and trailing slash."""
    parts = urlsplit(url.strip())
    if parts.scheme not in ("http", "https") or not parts.netloc:
        raise ValueError("endpoint must be an http(s) URL")
    return f"{parts.scheme.lower()}://{parts.netloc.lower()}{parts.path.rstrip('/')}"


def cand_id(endpoint):
    """CAND-<8 hex> from the canonical endpoint: the same endpoint always gets the same id."""
    digest = hashlib.sha256(canonical_endpoint(endpoint).encode("utf-8")).hexdigest()
    return "CAND-" + digest[:8]


def service_id(jurisdiction, host_or_name):
    return "svc-" + slug(jurisdiction) + "-" + slug(host_or_name)


def layer_id(service, layer_path):
    base = service[4:] if service.startswith("svc-") else slug(service)
    return "lyr-" + base + "-" + slug(layer_path)


def ulid(now_ms=None):
    """26-char Crockford ULID (48-bit ms timestamp + 80 random bits)."""
    ms = int(time.time() * 1000) if now_ms is None else now_ms
    value = (ms << 80) | int.from_bytes(os.urandom(10), "big")
    chars = []
    for _ in range(26):
        chars.append(_CROCKFORD[value & 31])
        value >>= 5
    return "".join(reversed(chars))


def decision_id(now_ms=None):
    return "DEC-" + ulid(now_ms)
