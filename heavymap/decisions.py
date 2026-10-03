"""Append one field-level row to data/reviewed/review_decisions.csv (used by the review UI)."""

import re

from . import csvio, guard, ids, validate
from .apply import utc_now

LINEAR_RE = re.compile(r"^NIA-\d+$")


class DecisionError(ValueError):
    pass


def sanitize_text(text, limit=500):
    """Make free text safe for the CSV hygiene rules (no newline, no ';', trimmed, no formula start)."""
    text = re.sub(r"\s+", " ", (text or "").replace(";", ",")).strip()[:limit]
    return ("'" + text) if text[:1] in "=+@-" and text else text


def record_decision(schema, *, table, record_id, field, new_value, code, note, reviewer, linear_id, now=None):
    reviewer = (reviewer or "").strip()
    linear_id = (linear_id or "").strip().upper()
    if not LINEAR_RE.match(linear_id):
        raise DecisionError("A Linear issue id (NIA-<number>) is required")
    if not validate.REVIEWER_RE.match(reviewer):
        raise DecisionError("Reviewer must be a name or initials (2-40 characters)")
    if schema.is_agent_reviewer(reviewer):
        raise DecisionError("Only humans may record decisions")
    if code not in schema.decision_codes():
        raise DecisionError(f"Unknown decision code {code!r}")
    t = schema.tables.get(table)
    if t is None or t.stage not in ("registry", "inbox"):
        raise DecisionError(f"Unknown table {table!r}")
    if field not in t.editable:
        raise DecisionError(f"{table}.{field} is not editable")
    rec = next((r for r in schema.load_rows(table) if r[t.key] == record_id), None)
    if rec is None:
        raise DecisionError(f"{table} has no record {record_id!r}")
    current = rec[field]
    note = sanitize_text(note)
    new_value = (new_value or "").strip()
    if guard.owner_value_pattern(schema).search(note) or guard.owner_value_pattern(schema).search(new_value):
        raise DecisionError("Looks like an owner field with a value. Record owner field NAMES only, never values")
    value_codes = schema.controlled.get("value_applying_codes", [])
    if code in value_codes:
        if code == "A" and new_value == "":
            new_value = current
        if code == "E" and (new_value == "" or new_value == current):
            raise DecisionError("Edit needs a corrected value different from the current one")
        if code == "R" and new_value == "" and not note:
            raise DecisionError("Reject needs a new value or a note saying why")
        if new_value:
            bad = validate.check_value(schema, table, field, new_value)
            if bad:
                raise DecisionError(f"{field}: {bad}")
            refusal = guard.check_change(schema, table, record_id, field, new_value, reviewer)
            if refusal:
                raise DecisionError(f"Refused ({refusal}): see docs/for-agents/HARD-RULES.md")
    else:
        new_value = ""
        if not note:
            raise DecisionError(f"Decision {code} needs a note")
    row = {"decision_id": ids.decision_id(), "record_id": record_id, "table": table, "field": field,
           "old_value": current, "new_value": new_value, "decision_code": code, "note": note,
           "reviewer": reviewer, "timestamp": now or utc_now(), "linear_id": linear_id}
    csvio.append_row(schema.path("review_decisions"), schema.tables["review_decisions"].columns, row)
    return row
