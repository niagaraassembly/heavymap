"""`hm validate`: header, hygiene, enums, patterns, keys, foreign keys, review_decisions rules."""

import re
from datetime import datetime

from . import csvio
from .findings import Finding

GRADE_TOKEN = re.compile(r"^[A-Za-z0-9_-]{1,16}$")
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
URL_RE = re.compile(r"^https?://[^\s;]+$")
INT_RE = re.compile(r"^\d+$")
REVIEWER_RE = re.compile(r"^[A-Za-z][A-Za-z0-9 ._-]{1,39}$")


def check_cell_hygiene(value):
    """Return an error string for a cell that breaks the CSV hygiene rules, else None."""
    if "\n" in value or "\r" in value:
        return "newline inside a cell"
    if ";" in value:
        return "';' inside a cell (use ' | ' for multiple values)"
    if value != value.strip():
        return "leading or trailing whitespace"
    if value and (value[0] in "=+@" or (value[0] == "-" and not re.match(r"^-\d", value))):
        return "cell starts with a spreadsheet formula character"
    return None


def check_value(schema, table, column, value):
    """Validate one value against its column's enum/pattern/type. Blank is allowed here."""
    if value == "":
        return None
    msg = check_cell_hygiene(value)
    if msg:
        return msg
    t = schema.tables[table]
    enum = schema.enum_for(table, column)
    if enum is not None and value not in enum:
        return f"{value!r} is not one of {enum}"
    pat = schema.pattern_for(table, column)
    if pat and not pat.search(value):
        return f"{value!r} does not match {pat.pattern}"
    if column in t.dates and not DATE_RE.match(value) and not re.match(r"^\d{4}-\d{2}-\d{2}T[\d:]+Z$", value):
        return f"{value!r} is not an ISO date"
    if column in t.urls and not all(URL_RE.match(part.strip()) for part in value.split(" | ")):
        return f"{value!r} is not an http(s) URL"
    if column in t.ints and not INT_RE.match(value):
        return f"{value!r} is not a non-negative integer"
    if table == "join_tests" and column == "grade" and not GRADE_TOKEN.match(value):
        return f"{value!r} is not a valid grade token"
    if table == "scores" and column.startswith("c_") and value not in ("0", "1", "2", "3"):
        return f"{value!r} must be 0, 1, 2 or 3 (blank = unmeasured)"
    return None


def validate(schema):
    findings = []
    data = {}
    for table in schema.tables.values():
        path = schema.path(table.name)
        try:
            header, rows = csvio.read_csv(path)
        except FileNotFoundError:
            findings.append(Finding("error", "missing_file", f"{table.path} does not exist", table.name))
            continue
        except UnicodeDecodeError:
            findings.append(Finding("error", "not_utf8", f"{table.path} is not UTF-8", table.name))
            continue
        raw = path.read_bytes()
        if raw.startswith(b"\xef\xbb\xbf"):
            findings.append(Finding("error", "bom", "file starts with a BOM", table.name, 1))
        if b"\r" in raw:
            findings.append(Finding("error", "crlf", "file contains CR characters (use LF)", table.name))
        if header != table.columns:
            findings.append(Finding("error", "header_mismatch",
                                    f"header differs from data/schema/table-schema.json: {header} != {table.columns}",
                                    table.name, 1))
            continue
        data[table.name] = rows
        seen = {}
        for row in rows:
            line = row["__line__"]
            rec = row.get(table.key, "")
            if row["__width__"] != len(table.columns):
                findings.append(Finding("error", "row_width", f"{row['__width__']} cells, expected {len(table.columns)}", table.name, line, rec))
                continue
            for col in table.columns:
                val = row[col]
                err = check_value(schema, table.name, col, val)
                if err:
                    findings.append(Finding("error", "bad_value", f"{col}: {err}", table.name, line, rec))
            for col in table.required:
                if row[col] == "":
                    findings.append(Finding("error", "required_blank", f"{col} is required", table.name, line, rec))
            if rec:
                if rec in seen:
                    findings.append(Finding("error", "duplicate_key", f"{table.key}={rec!r} also on line {seen[rec]}", table.name, line, rec))
                seen[rec] = line
            if table.name == "join_tests" and row["hits"].isdigit() and row["tested"].isdigit() and int(row["hits"]) > int(row["tested"]):
                findings.append(Finding("error", "hits_exceed_tested", "hits > tested", table.name, line, rec))
            if table.name == "join_tests" and row["grade"]:
                findings.append(Finding("warning", "grade_scale_undefined", "NIA-86 grade scale is not defined; grade accepted as a free token", table.name, line, rec))
    _foreign_keys(schema, data, findings)
    if "review_decisions" in data:
        findings.extend(validate_decisions(schema, data))
    return findings


def _foreign_keys(schema, data, findings):
    for table in schema.tables.values():
        for col, target in table.fk.items():
            tname, tcol = target.split(".")
            if table.name not in data or tname not in data:
                continue
            valid = {r[tcol] for r in data[tname]}
            for row in data[table.name]:
                if row.get(col) and row[col] not in valid:
                    findings.append(Finding("error", "fk_missing", f"{col}={row[col]!r} not found in {target}", table.name, row["__line__"], row.get(table.key, "")))


def validate_decisions(schema, data):
    findings = []
    codes = schema.decision_codes()
    value_codes = set(schema.controlled.get("value_applying_codes", []))
    for row in data["review_decisions"]:
        if row["__width__"] != len(schema.tables["review_decisions"].columns):
            continue
        line, rec = row["__line__"], row["decision_id"]

        def err(code, msg):
            findings.append(Finding("error", code, msg, "review_decisions", line, rec))

        table = row["table"]
        if row["decision_code"] not in codes:
            err("bad_decision_code", f"decision_code {row['decision_code']!r} not in {sorted(codes)}")
        if not REVIEWER_RE.match(row["reviewer"]):
            err("bad_reviewer", f"reviewer {row['reviewer']!r} is not a valid name or initials")
        elif schema.is_agent_reviewer(row["reviewer"]):
            err("agent_reviewer", f"reviewer {row['reviewer']!r} looks like an agent; only humans may decide")
        if table not in schema.tables or schema.tables[table].stage not in ("registry", "inbox"):
            err("bad_table", f"table {table!r} is not a registry or inbox table")
            continue
        t = schema.tables[table]
        if row["field"] not in t.editable:
            err("field_not_editable", f"{table}.{row['field']} is not in the editable whitelist {t.editable}")
            continue
        keys = {r[t.key] for r in data.get(table, [])}
        if row["record_id"] not in keys:
            err("record_missing", f"{table} has no record {row['record_id']!r}")
        if row["decision_code"] == "E" and row["new_value"] == "":
            err("edit_without_value", "decision E needs a new_value")
        if row["decision_code"] in value_codes and row["new_value"]:
            bad = check_value(schema, table, row["field"], row["new_value"])
            if bad:
                err("bad_value", f"new_value: {bad}")
        try:
            datetime.strptime(row["timestamp"], "%Y-%m-%dT%H:%M:%SZ")
        except ValueError:
            err("bad_timestamp", f"timestamp {row['timestamp']!r} is not YYYY-MM-DDTHH:MM:SSZ")
    return findings
