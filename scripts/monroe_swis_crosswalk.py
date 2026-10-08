#!/usr/bin/env python3
"""Reproduce NIA-81 from owner-free Monroe ArcGIS aggregate queries."""

import argparse
import csv
import datetime as dt
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from collections import defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
ENDPOINT = "https://maps.monroecounty.gov/server/rest/services/Hosted/Parcels_Public/FeatureServer/0/query"
CACHE = ROOT / "local-data" / "monroe-swis-aggregates.json"
OUTPUT = ROOT / "docs" / "data" / "monroe-swis-crosswalk.csv"
GROUP_FIELDS = "SUBSTRING(countysbl,1,6),swis,CHAR_LENGTH(countysbl)"
STATS = json.dumps([{"statisticType": "count", "onStatisticField": "objectid", "outStatisticFieldName": "n"}])
HEADERS = ("countysbl_prefix", "monroe_swis_name", "row_count", "valid_sbl26_count",
           "invalid_length_count", "status", "code_meaning", "source_field", "source_endpoint",
           "retrieved_at_utc")


def request(params):
    url = ENDPOINT + "?" + urllib.parse.urlencode({**params, "f": "json"})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(url, timeout=30) as response:
                data = json.load(response)
            if "error" in data:
                raise RuntimeError(f"ArcGIS error: {data['error']}")
            return data
        except (urllib.error.URLError, TimeoutError) as error:
            if attempt == 2:
                raise RuntimeError("ArcGIS request failed after three attempts") from error
            time.sleep(2 * (attempt + 1))
    raise AssertionError("unreachable")


def count(where):
    data = request({"where": where, "returnCountOnly": "true"})
    if not isinstance(data.get("count"), int):
        raise ValueError(f"No count returned for {where}")
    return data["count"]


def fetch():
    # Only the two approved data fields are grouped; objectid is used for COUNT.
    groups = request({"where": "1=1", "returnGeometry": "false",
                      "outFields": "countysbl,swis",
                      "groupByFieldsForStatistics": GROUP_FIELDS,
                      "outStatistics": STATS})
    if groups.get("exceededTransferLimit"):
        raise ValueError("Grouped response truncated; refuse to generate crosswalk")
    return {
        "endpoint": ENDPOINT,
        "retrieved_at_utc": dt.datetime.now(dt.timezone.utc).isoformat(),
        "group_by": GROUP_FIELDS,
        "total_count": count("1=1"),
        "null_swis_count": count("swis IS NULL"),
        "null_countysbl_count": count("countysbl IS NULL"),
        "empty_countysbl_count": count("countysbl = ''"),
        "groups": [feature["attributes"] for feature in groups["features"]],
    }


def build(raw):
    if raw.get("endpoint") != ENDPOINT or raw.get("group_by") != GROUP_FIELDS:
        raise ValueError("Cache provenance does not match this query")
    pairs = defaultdict(lambda: [0, 0, 0])
    name_prefixes = defaultdict(set)
    prefix_names = defaultdict(set)
    length_counts = defaultdict(int)
    null_name = 0
    for attrs in raw["groups"]:
        prefix, name, length, n = attrs["EXPR_1"], attrs["swis"], attrs["EXPR_2"], attrs["n"]
        if not isinstance(n, int) or n <= 0 or not isinstance(length, int):
            raise ValueError("Invalid aggregate count or length")
        length_counts[length] += n
        if name is None:
            null_name += n
        pair = pairs[(prefix, name)]
        pair[0] += n
        if length == 26 and re.fullmatch(r"[0-9]{6}", prefix or ""):
            pair[1] += n
            if name is not None:
                name_prefixes[name].add(prefix)
                prefix_names[prefix].add(name)
        else:
            pair[2] += n
    if sum(length_counts.values()) != raw["total_count"]:
        raise ValueError("Grouped counts do not reconcile to total")
    if null_name != raw["null_swis_count"]:
        raise ValueError("Null swis counts do not reconcile")
    if length_counts.get(0, 0) < raw["empty_countysbl_count"] + raw["null_countysbl_count"]:
        raise ValueError("Empty key counts do not reconcile")
    if length_counts.get(26, 0) != sum(v[1] for v in pairs.values()):
        raise ValueError("26-character keys contain a nonnumeric prefix")
    rows = []
    for (prefix, name), (total, valid, invalid) in sorted(pairs.items(), key=lambda x: (x[0][1] or "", x[0][0])):
        if not valid or name is None:
            status = "unresolved"
        elif len(name_prefixes[name]) > 1 or len(prefix_names[prefix]) > 1:
            status = "ambiguous"
        else:
            status = "inferred_from_prefix"
        rows.append(dict(zip(HEADERS, (prefix, name or "", total, valid, invalid,
                                       status, "inferred_SWIS6_not_confirmed_by_Monroe_code_table",
                                       "Parcels_Public.countysbl + swis", ENDPOINT,
                                       raw["retrieved_at_utc"]))))
    return rows, length_counts, name_prefixes, prefix_names


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--cache", action="store_true", help="Rebuild from ignored local aggregate cache; no network")
    parser.add_argument("--dry-run", action="store_true", help="Show query and paths; make no requests or writes")
    args = parser.parse_args()
    if args.dry_run:
        print(f"GET {ENDPOINT}\nGroup by: {GROUP_FIELDS}\nCache: {CACHE}\nCSV: {OUTPUT}")
        return
    if args.cache:
        raw = json.loads(CACHE.read_text(encoding="utf-8"))
    else:
        raw = fetch()
        CACHE.parent.mkdir(parents=True, exist_ok=True)
        CACHE.write_text(json.dumps(raw, indent=2) + "\n", encoding="utf-8")
    rows, lengths, name_prefixes, prefix_names = build(raw)
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT.open("w", newline="", encoding="utf-8") as output:
        writer = csv.DictWriter(output, fieldnames=HEADERS, lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)
    print(f"Retrieved: {raw['retrieved_at_utc']}; total: {raw['total_count']}; grouped: {sum(lengths.values())}")
    print("Caveat: six-digit prefix as SWIS code is inferred from values, not confirmed by a Monroe code table.")
    print(f"Pairs: {len(rows)}; names: {len(name_prefixes)}; null swis: {raw['null_swis_count']}")
    print(f"Lengths: {dict(sorted(lengths.items()))}")
    print(f"Ambiguous names: { {k: sorted(v) for k, v in name_prefixes.items() if len(v) > 1} }")
    print(f"Ambiguous prefixes: { {k: sorted(v) for k, v in prefix_names.items() if len(v) > 1} }")
    print(f"Status counts (pairs): { {s: sum(r['status'] == s for r in rows) for s in ('inferred_from_prefix', 'ambiguous', 'unresolved')} }")
    print(f"Wrote {OUTPUT}")


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, RuntimeError, KeyError) as error:
        print(f"Refused: {error}", file=sys.stderr)
        sys.exit(1)
