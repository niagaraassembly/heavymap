"""`hm apply`: turn review_decisions rows into registry changes.

* Field-level, append-only input; the latest row per (table, record_id, field) wins.
* Only fields in the schema ``editable`` whitelist can change.
* Codes A (confirm), E (edit/correct) and R (reject) apply ``new_value``; the corrected value of an E row
  is what lands in the registry. D, F, H, X, N are recorded flags and never change a value.
* ``old_value`` must equal the registry value at apply time, otherwise the row is ``stale``
  (someone changed it since the reviewer looked) and is left for a new review.
* Dry-run by default; ``write=True`` rewrites registry CSVs atomically and writes a manifest under data/runs/.
"""

import json
from datetime import datetime, timezone

from . import csvio, guard, ids, score, validate
from .findings import errors

APPLYING_STATUSES = ("pending",)


def utc_now():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def latest_decisions(schema):
    """Return {(table, record_id, field): row} for well-formed rows, last row wins."""
    try:
        header, rows = schema.load("review_decisions")
    except FileNotFoundError:
        return {}
    width = len(schema.tables["review_decisions"].columns)
    latest = {}
    for r in rows:
        if r["__width__"] != width:
            continue
        latest[(r["table"], r["record_id"], r["field"])] = {k: v for k, v in r.items() if not k.startswith("__")}
    return latest


def plan(schema):
    """Classify every latest decision. Returns a list of dict items (see keys below)."""
    codes = schema.decision_codes()
    value_codes = set(schema.controlled.get("value_applying_codes", []))
    registry = {}
    items = []
    for (table, record_id, fld), d in latest_decisions(schema).items():
        item = {"decision_id": d["decision_id"], "table": table, "record_id": record_id, "field": fld,
                "code": d["decision_code"], "old_value": d["old_value"], "new_value": d["new_value"],
                "reviewer": d["reviewer"], "timestamp": d["timestamp"], "linear_id": d["linear_id"],
                "status": "", "reason": "", "current": ""}
        items.append(item)

        def mark(status, reason=""):
            item["status"], item["reason"] = status, reason

        t = schema.tables.get(table)
        if d["decision_code"] not in codes:
            mark("invalid", "unknown decision_code"); continue
        if t is None or t.stage not in ("registry", "inbox"):
            mark("invalid", "unknown or non-editable table"); continue
        if fld not in t.editable:
            mark("invalid", "field not in editable whitelist"); continue
        if schema.is_agent_reviewer(d["reviewer"]):
            mark("refused", "agent_reviewer"); continue
        if table not in registry:
            registry[table] = {r[t.key]: r for r in schema.load_rows(table)}
        rec = registry[table].get(record_id)
        if rec is None:
            mark("invalid", "record not found"); continue
        item["current"] = rec[fld]
        if d["decision_code"] not in value_codes:
            mark("flag", f"{d['decision_code']} recorded, no value change"); continue
        if d["decision_code"] == "E" and d["new_value"] == "":
            mark("invalid", "E needs new_value"); continue
        if d["new_value"] == "":
            mark("confirmed", "no value to apply"); continue
        bad = validate.check_value(schema, table, fld, d["new_value"])
        if bad:
            mark("invalid", bad); continue
        if rec[fld] == d["new_value"]:
            mark("applied", "registry already holds new_value"); continue
        if d["old_value"] != rec[fld]:
            mark("stale", f"registry now holds {rec[fld]!r}, reviewer saw {d['old_value']!r}; re-review"); continue
        refusal = guard.check_change(schema, table, record_id, fld, d["new_value"], d["reviewer"])
        if refusal:
            mark("refused", refusal); continue
        mark("pending")
    return items


def summarize(items):
    out = {}
    for it in items:
        out[it["status"]] = out.get(it["status"], 0) + 1
    return out


def apply(schema, write=False):
    """Plan, and if ``write`` also apply. Returns a result dict; never raises on bad rows."""
    pre = errors(validate.validate(schema))
    items = plan(schema)
    result = {"write": write, "summary": summarize(items), "items": items, "manifest": None, "applied": 0,
              "validation_errors": [f.as_dict() for f in pre]}
    pending = [it for it in items if it["status"] == "pending"]
    if not write:
        return result
    if pre:
        result["aborted"] = "registry/decisions fail validation; fix before applying"
        return result
    touched = {}
    changes = []
    for it in pending:
        t = schema.tables[it["table"]]
        if it["table"] not in touched:
            touched[it["table"]] = schema.load(it["table"])[1]
        rows = touched[it["table"]]
        row = next(r for r in rows if r[t.key] == it["record_id"])
        row[it["field"]] = it["new_value"]
        if it["table"] == "layers" and it["field"] == "lifecycle_status" and "status_changed_date" in row:
            row["status_changed_date"] = it["timestamp"][:10]
        if it["table"] == "scores":
            row["total"] = score.total(schema, row)
        changes.append({"decision_id": it["decision_id"], "table": it["table"], "record_id": it["record_id"],
                        "field": it["field"], "old_value": it["old_value"], "new_value": it["new_value"],
                        "decision_code": it["code"], "reviewer": it["reviewer"], "linear_id": it["linear_id"]})
    for name, rows in touched.items():
        csvio.write_csv(schema.path(name), schema.tables[name].columns, csvio.clean_rows(rows))
    result["applied"] = len(changes)
    if changes:
        stamp = utc_now()
        manifest = {"applied_at": stamp, "schema_version": schema.version, "decision_ids": [c["decision_id"] for c in changes],
                    "changes": changes, "skipped": [{k: it[k] for k in ("decision_id", "status", "reason")} for it in items if it["status"] in ("stale", "refused", "invalid")]}
        rel = f"data/runs/apply-{stamp.replace(':', '').replace('-', '')}-{ids.ulid()[-6:]}.json"
        (schema.root / rel).write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
        result["manifest"] = rel
    return result
