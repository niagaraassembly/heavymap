#!/usr/bin/env python3
"""Fail if any doc_path in Spreadsheets/00-PLANNING-INDEX.csv does not exist.

Stdlib only. Run from anywhere:  python3 scripts/check_index_paths.py
Exit code 0 when every doc_path resolves to a file in the repository, 1 otherwise.
"""
import csv
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
INDEX = REPO_ROOT / "Spreadsheets" / "00-PLANNING-INDEX.csv"


def main() -> int:
    if not INDEX.is_file():
        print(f"ERROR: index not found: {INDEX.relative_to(REPO_ROOT)}")
        return 1
    with INDEX.open(newline="", encoding="utf-8") as fh:
        rows = list(csv.DictReader(fh))
    if rows and "doc_path" not in rows[0]:
        print("ERROR: index has no doc_path column")
        return 1
    missing = []
    checked = set()
    for line_no, row in enumerate(rows, start=2):  # header is line 1
        path = (row.get("doc_path") or "").strip()
        if not path:
            missing.append((line_no, "(empty doc_path)"))
            continue
        checked.add(path)
        if not (REPO_ROOT / path).is_file():
            missing.append((line_no, path))
    for line_no, path in missing:
        print(f"MISSING  line {line_no}: {path}")
    print(f"{len(rows)} rows, {len(checked)} distinct doc_path values, {len(missing)} missing")
    return 1 if missing else 0


if __name__ == "__main__":
    sys.exit(main())
