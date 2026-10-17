"""Source-quoted overlay labels (HARD-RULES 12, Claim & Refusal Contract).

A source class is copied into a quoted string such as
``City class: Vacant Lands``. HeavyMap does not assert vacancy, availability,
or a simplified zone of its own.
"""

from __future__ import annotations

from typing import Mapping


class _BlankMap(dict):
    def __missing__(self, key: str) -> str:
        return ""


def stringify(value: object) -> str:
    if value is None:
        return ""
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, float) and value.is_integer():
        return str(int(value))
    text = str(value).strip()
    if text.lower() in ("none", "null"):
        return ""
    return text


def first_filled(properties: Mapping[str, str], fields: tuple[str, ...]) -> str:
    for name in fields:
        value = stringify(properties.get(name, ""))
        if value:
            return value
    return ""


def render_label(template: str, properties: Mapping[str, str]) -> str:
    """Fill ``{FIELD}`` placeholders from source properties. Missing → empty."""

    filled = {key: stringify(value) for key, value in properties.items()}
    text = template.format_map(_BlankMap(filled)).strip()
    while "  " in text:
        text = text.replace("  ", " ")
    return text.replace(" :", ":").strip(" —;,").strip()
