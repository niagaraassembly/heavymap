"""Score formula v1.0 (a proposal, see docs/for-humans/GLOSSARY.md). Triage aid only; never approval."""


def total(schema, row):
    """Weighted 0-100 total, or '' when any heavy criterion is unmeasured (blank is not zero)."""
    f = schema.controlled["score_formula"]
    mx = f["max_component"]
    acc = 0.0
    for comp, weight in f["weights"].items():
        raw = row.get(comp, "")
        if raw == "":
            if weight >= f["blank_total_if_blank_weight_at_least"]:
                return ""
            continue
        acc += int(raw) / mx * weight
    return str(round(acc))
