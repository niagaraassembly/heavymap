"""`hm status` data: table counts, lifecycle counts, decision states, gates."""

from . import apply as apply_mod, guard


def collect(schema):
    counts = {name: len(schema.load_rows(name)) for name in schema.tables}
    lifecycle = {s: 0 for s in schema.values("lifecycle_status")}
    for layer in schema.load_rows("layers"):
        lifecycle[layer["lifecycle_status"]] = lifecycle.get(layer["lifecycle_status"], 0) + 1
    items = apply_mod.plan(schema)
    gates = {r["gate_id"]: r["state"] for r in schema.load_rows("gates")}
    gates.setdefault("G6", "closed")
    flags = [i for i in items if i["status"] == "flag"]
    return {
        "tables": counts,
        "lifecycle": lifecycle,
        "decisions": apply_mod.summarize(items),
        "open_flags": [{k: i[k] for k in ("decision_id", "table", "record_id", "field", "code", "reviewer")} for i in flags],
        "gates": gates,
        "g6_open": guard.gate_open(schema, "G6"),
        "candidates_new": sum(1 for c in schema.load_rows("candidates") if c["status"] == "new"),
    }
