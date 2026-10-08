"""Read-only NIA-79 analysis of local ID-only ArcGIS pulls.

The ignored JSON files must be produced with explicit identifier outFields.
This script has no network access and refuses files containing other fields.
"""
import collections
import json
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from heavymap.ny_identifiers import IdentifierRefusal, render_print_key, validate_sbl20


SOURCES = {
    "city": ("PARCELID", "PRINTKEY", "padded", {"OBJECTID", "PARCELID", "PRINTKEY"}),
    "city_2024": ("PARCELID", "PRINTKEY", "padded", {"OBJECTID", "PARCELID", "PRINTKEY"}),
    "monroe": ("countysbl", "printkey", "padded", {"objectid", "countysbl", "printkey", "swis"}),
    "monroe_full": ("countysbl", "printkey", "padded", {"objectid", "countysbl", "printkey", "swis"}),
    "monroe_city": ("countysbl", "printkey", "padded", {"objectid", "countysbl", "printkey", "swis"}),
    **{county: ("SBL", "PRINT_KEY", {"genesee": "genesee", "erie": "erie", "chautauqua": "chautauqua"}[county], {"OBJECTID", "SBL", "PRINT_KEY", "SWIS", "SWIS_SBL_ID", "COUNTY_NAME"}) for county in ("genesee", "erie", "chautauqua")},
}


def shape(value):
    if value is None:
        return "<null>"
    return "".join("9" if c.isdigit() else "A" if c.isalpha() else c for c in value)


def stamp(row, identifier, print_key):
    return f"OID={row.get('OBJECTID', row.get('objectid'))} ID={identifier!r} PRINT={print_key!r}"


def run():
    lines = ["# NIA-79 real input check", "", "ID-only pulls; all failures below are stamped with source OID and identifier strings.", ""]
    all_rows = {}
    for name, (id_field, print_field, style, allowed) in SOURCES.items():
        path = Path("local-data/pulls") / f"{name}.json"
        if not path.exists():
            lines += [f"## {name}", "", "Pull unavailable.", ""]
            continue
        data = json.loads(path.read_text())
        assert set(data["fields"]) <= allowed
        assert all(set(row) <= allowed for row in data["rows"])
        rows = data["rows"]
        all_rows[name] = rows
        outcomes = collections.Counter()
        lengths = collections.Counter()
        charsets = collections.Counter()
        shapes = collections.Counter()
        shape_examples = {}
        specials = collections.Counter()
        prefixes = collections.Counter()
        swis_checks = collections.Counter()
        swis_counties = collections.Counter()
        swis_last_pair = collections.Counter()
        id_counts = collections.Counter()
        failures = collections.defaultdict(list)
        print_by_id = collections.defaultdict(set)
        composite_ids = collections.Counter()
        for row in rows:
            original = row.get(id_field)
            key = row.get(print_field)
            sbl = original[6:] if name.startswith("monroe") and isinstance(original, str) and len(original) >= 6 else original
            lengths["null" if sbl is None else len(str(sbl))] += 1
            charsets["null" if sbl is None else "digits" if isinstance(sbl, str) and sbl.isascii() and sbl.isdecimal() else "other"] += 1
            shp = shape(key)
            shapes[shp] += 1
            shape_examples.setdefault(shp, stamp(row, original, key))
            if original is not None:
                id_counts[original] += 1
            if name.startswith("monroe") and isinstance(original, str):
                prefixes[original[:6]] += 1
            if name in ("genesee", "erie", "chautauqua"):
                composite = row.get("SWIS_SBL_ID")
                composite_ids[composite] += 1
                swis = row.get("SWIS")
                if isinstance(swis, str):
                    swis_counties[swis[:2]] += 1
                    swis_last_pair[swis[-2:]] += 1
                swis_checks["composite_matches" if isinstance(composite, str) and composite == str(swis) + str(sbl) else "composite_mismatch"] += 1
                print_by_id[(swis, sbl)].add(key)
            try:
                validated = validate_sbl20(sbl)
                outcomes["accepted"] += 1
                if validated[13:16] != "000":
                    specials["nonzero_sublot"] += 1
                if validated[16:] != "0000":
                    specials["nonzero_suffix"] += 1
                if validated[:3] == "000":
                    specials["zero_section"] += 1
                try:
                    rendered = render_print_key(validated, style, swis6=row.get("SWIS") if name == "genesee" else None)
                except IdentifierRefusal as exc:
                    reason = "render_refused:" + exc.code
                else:
                    if rendered == key:
                        outcomes["identical"] += 1
                        continue
                    reason = "mismatch"
                outcomes[reason] += 1
                failures[reason].append(stamp(row, original, key) + (f" RENDER={rendered!r}" if reason == "mismatch" else ""))
            except IdentifierRefusal as exc:
                reason = "validate_refused:" + exc.code
                outcomes[reason] += 1
                failures[reason].append(stamp(row, original, key))
        duplicates = {key: n for key, n in id_counts.items() if n > 1}
        lines += [f"## {name}", "", f"Source: {data['source']}; where `{data['where']}`; layer count {data['count']}; checked {len(rows)} across {len(data['offsets'])} pages.", "", f"Outcomes: {dict(outcomes)}", "", f"SBL lengths: {dict(lengths)}; charset: {dict(charsets)}; cases: {dict(specials)}.", "", f"Unique IDs {len(id_counts)}; duplicate groups {len(duplicates)}; extra duplicate rows {sum(n-1 for n in duplicates.values() if n>1)}. State composite duplicate groups {sum(n>1 for n in composite_ids.values())}; extra rows {sum(n-1 for n in composite_ids.values() if n>1)}.", "", f"SWIS prefixes: {dict(prefixes)}; statewide composite relation: {dict(swis_checks)}; state SWIS county pairs: {dict(swis_counties)}; last pairs: {dict(swis_last_pair)}; conflicting print keys per composite: {sum(len(v)>1 for v in print_by_id.values())}.", "", "Print-key shapes (all):", ""]
        lines += [f"- `{shp}`: {n}; {shape_examples[shp]}" for shp, n in shapes.most_common()]
        lines += ["", "All failures by cause:", ""]
        for reason, examples in failures.items():
            lines += [f"### {reason} ({len(examples)})", ""]
            lines += [f"- {example}" for example in examples]
            lines.append("")
        if not failures:
            lines += ["None.", ""]
    if "city" in all_rows and "monroe_city" in all_rows:
        city = collections.defaultdict(set)
        county = collections.defaultdict(set)
        for row in all_rows["city"]:
            city[row["PARCELID"]].add(row["PRINTKEY"])
        for row in all_rows["monroe_city"]:
            county[row["countysbl"]].add(row["printkey"])
        matched = sum("261400" + key in county for key in city if isinstance(key, str))
        same_print = sum(bool(values & county.get("261400" + key, set())) for key, values in city.items() if isinstance(key, str))
        lines += ["## City and county comparison", "", f"City distinct IDs {len(city)}; `261400` composite hits {matched}; equal print keys {same_print}; missing {len(city)-matched}.", ""]
    if "city_2024" in all_rows and "monroe_city" in all_rows:
        city = collections.defaultdict(set)
        county = collections.defaultdict(set)
        for row in all_rows["city_2024"]:
            city[row["PARCELID"]].add(row["PRINTKEY"])
        for row in all_rows["monroe_city"]:
            county[row["countysbl"]].add(row["printkey"])
        matched = sum("261400" + key in county for key in city if isinstance(key, str))
        same_print = sum(bool(values & county.get("261400" + key, set())) for key, values in city.items() if isinstance(key, str))
        lines += ["## City 2024 and county comparison", "", f"City distinct IDs {len(city)}; `261400` composite hits {matched}; equal print keys {same_print}; missing {len(city)-matched}.", ""]
    return "\n".join(lines)


if __name__ == "__main__":
    report = run()
    if len(sys.argv) > 1:
        Path(sys.argv[1]).write_text(report)
    else:
        print(report)
