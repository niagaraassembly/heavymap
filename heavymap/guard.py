"""`hm guard`: hard-rule enforcement, plus ``check_change`` which apply and the review UI share.

Rules enforced (docs/for-agents/HARD-RULES.md):
  * local-data/ and build/ never tracked in git; no tracked file over the size cap outside docs/ and misc/
  * no owner-named columns and no owner values in committed tables
  * nothing surfaced while gate G6 is closed (a missing gate row means closed)
  * MPAC (not_licensed) and NPCA-derived endpoints/publishers are forced to not_used, unscored
  * only humans decide; dormant/surfaced are Morgen-only
"""

import re
import subprocess

from .findings import Finding


# -- deny list -------------------------------------------------------------------
def deny_rules(schema):
    rules = [dict(r) for r in schema.controlled.get("hard_deny", [])]
    for row in schema.load_rows("deny_list"):
        rules.append({"deny_id": row["deny_id"], "match_type": row["match_type"], "pattern": row["pattern"],
                      "reason": row["reason"], "forced_use_decision": row["forced_use_decision"] or "not_used",
                      "forced_lifecycle": row["forced_lifecycle"] or "not_used"})
    return rules


def deny_matches(rules, **texts):
    """texts: publisher=, endpoint=, layer_name=. Return rules that match any applicable text."""
    hits = []
    for rule in rules:
        targets = list(texts.values()) if rule["match_type"] == "any" else [texts.get(rule["match_type"], "")]
        try:
            rx = re.compile(rule["pattern"], re.I)
        except re.error:
            continue
        if any(rx.search(t or "") for t in targets):
            hits.append(rule)
    return hits


def layer_deny_hits(schema, layer, services=None, rules=None):
    rules = rules if rules is not None else deny_rules(schema)
    services = services if services is not None else {r["service_id"]: r for r in schema.load_rows("services")}
    svc = services.get(layer.get("service_id", ""), {})
    return deny_matches(rules, publisher=svc.get("publisher", ""), endpoint=layer.get("endpoint", ""),
                        layer_name=layer.get("layer_name", ""))


def gate_open(schema, gate_id):
    for row in schema.load_rows("gates"):
        if row["gate_id"] == gate_id:
            return row["state"] == "open"
    return False  # missing row = closed


# -- shared change policy ---------------------------------------------------------
def check_change(schema, table, record_id, field, new_value, reviewer):
    """Return a refusal code (str) if this change must not be made, else None."""
    if schema.is_agent_reviewer(reviewer):
        return "agent_reviewer"
    if table == "layers" and field == "lifecycle_status":
        if new_value in schema.values("promotion_statuses") and reviewer.strip().lower() not in schema.values("promotion_reviewers"):
            return "promotion_morgen_only"
        if new_value == "surfaced" and not gate_open(schema, "G6"):
            return "g6_closed"
        layer = next((r for r in schema.load_rows("layers") if r["layer_id"] == record_id), None)
        if layer and layer_deny_hits(schema, layer) and new_value not in ("not_used", "blocked", "catalogued"):
            return "deny_listed"
    if table == "use_decisions" and field == "use_decision" and new_value in ("use", "needs_more"):
        layer = next((r for r in schema.load_rows("layers") if r["layer_id"] == record_id), None)
        if layer and layer_deny_hits(schema, layer):
            return "deny_listed"
    if table == "candidates" and field == "status" and new_value == "accepted":
        cand = next((r for r in schema.load_rows("candidates") if r["cand_id"] == record_id), None)
        if cand and deny_matches(deny_rules(schema), publisher=cand["publisher"], endpoint=cand["endpoint"], layer_name=cand["layer_name_hint"]):
            return "deny_listed"
    return None


# -- owner policy ------------------------------------------------------------------
def owner_regexes(schema):
    return [re.compile(p, re.I) for p in schema.controlled.get("owner_field_name_patterns", [])]


def owner_value_pattern(schema):
    """Matches 'OWNERNME1=SMITH' / 'owner: x' style name-with-value text."""
    names = r"(?:ownernme\w*|owner\w*|primary_?owner|pstladdress|mail(?:ing)?_?addr\w*)"
    return re.compile(r"(?i)\b" + names + r"\s*[:=]\s*(?=\S)[^|,]*")


def scrub_owner(schema, text):
    """Display filter: withhold anything that looks like an owner field with a value."""
    return owner_value_pattern(schema).sub("[owner value withheld]", text)


# -- repo scan ---------------------------------------------------------------------
def tracked_files(root):
    try:
        out = subprocess.run(["git", "ls-files", "-z"], cwd=root, capture_output=True, check=True).stdout
    except (OSError, subprocess.CalledProcessError):
        return None
    return [p for p in out.decode("utf-8").split("\0") if p]


def guard(schema, use_git=True):
    findings = []
    root = schema.root
    ctl = schema.controlled

    if use_git:
        files = tracked_files(root)
        if files is None:
            findings.append(Finding("warning", "git_unavailable", "not a git checkout; tracked-file checks skipped"))
        else:
            for rel in files:
                if rel.startswith(("local-data/", "build/")):
                    findings.append(Finding("error", "tracked_local_path", f"{rel} is tracked but local-data/ and build/ must never be in git"))
                    continue
                if rel.startswith(tuple(ctl.get("size_cap_exempt_prefixes", []))):
                    continue
                p = root / rel
                if p.is_file() and p.stat().st_size > ctl.get("size_cap_bytes", 2000000):
                    findings.append(Finding("error", "oversize_file", f"{rel} is {p.stat().st_size} bytes (cap {ctl['size_cap_bytes']}); pulled data belongs in local-data/"))
    gi = root / ".gitignore"
    ignored = gi.read_text(encoding="utf-8").splitlines() if gi.is_file() else []
    for need in ("/local-data/", "/build/"):
        if not any(line.strip() in (need, need.lstrip("/")) for line in ignored):
            findings.append(Finding("error", "gitignore_missing", f".gitignore must contain {need}"))

    owner_rx = owner_regexes(schema)
    value_rx = owner_value_pattern(schema)
    for table in schema.tables.values():
        for col in table.columns:
            if col not in ctl.get("owner_column_allowlist", []) and any(rx.search(col) for rx in owner_rx):
                findings.append(Finding("error", "owner_column", f"column {col!r} looks like an owner field; tables hold owner field NAMES in fields.field_name only", table.name))
        try:
            rows = schema.load(table.name)[1]
        except FileNotFoundError:
            continue
        for row in rows:
            for col in table.columns:
                if value_rx.search(row.get(col, "")):
                    findings.append(Finding("error", "owner_value", f"{col} contains an owner field with a value; record field names only", table.name, row["__line__"], row.get(table.key, "")))

    layers = schema.load_rows("layers")
    services = {r["service_id"]: r for r in schema.load_rows("services")}
    rules = deny_rules(schema)
    uses = {r["layer_id"]: r for r in schema.load_rows("use_decisions")}
    scores = {}
    for r in schema.load_rows("scores"):
        scores.setdefault(r["layer_id"], []).append(r)
    g6 = gate_open(schema, "G6")
    for layer in layers:
        lid = layer["layer_id"]
        if layer["lifecycle_status"] == "surfaced" and not g6:
            findings.append(Finding("error", "g6_closed", "layer is surfaced but gate G6 is closed", "layers", 0, lid))
        hits = layer_deny_hits(schema, layer, services, rules)
        if hits:
            why = ", ".join(h["reason"] for h in hits)
            if layer["lifecycle_status"] != "not_used":
                findings.append(Finding("error", "deny_listed", f"matches deny rule ({why}) so lifecycle_status must be not_used", "layers", 0, lid))
            if lid in uses and uses[lid]["use_decision"] != "not_used":
                findings.append(Finding("error", "deny_listed", f"matches deny rule ({why}) so use_decision must be not_used", "use_decisions", 0, lid))
            if any(s["total"] for s in scores.get(lid, [])):
                findings.append(Finding("error", "deny_scored", f"matches deny rule ({why}) so score must be blank (a gate, not a low score)", "scores", 0, lid))
    for cand in schema.load_rows("candidates"):
        if cand["status"] == "accepted" and deny_matches(rules, publisher=cand["publisher"], endpoint=cand["endpoint"], layer_name=cand["layer_name_hint"]):
            findings.append(Finding("error", "deny_listed", "accepted candidate matches a deny rule", "candidates", 0, cand["cand_id"]))
    return findings
