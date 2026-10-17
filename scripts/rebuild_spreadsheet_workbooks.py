#!/usr/bin/env python3
"""Regenerate Spreadsheets/*.xlsx from their authoritative CSV twins.

Stdlib only. Run from anywhere:
  python3 scripts/rebuild_spreadsheet_workbooks.py
"""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT / "scripts"))

from xlsx_sheets import read_csv, write_workbook  # noqa: E402

SPREADSHEETS = ROOT / "Spreadsheets"

CATALOG_SHEETS = [
    ("README", "09-per-jurisdiction-dataset-catalog-readme.csv"),
    ("Counties", "09-per-jurisdiction-dataset-catalog-counties.csv"),
    ("Municipalities", "09-per-jurisdiction-dataset-catalog-municipalities.csv"),
    ("Cross-Cutting Regional", "09-per-jurisdiction-dataset-catalog-cross-cutting.csv"),
]

INVENTORY_SHEETS = [
    ("Inventory", "02-dataset-inventory-v4.csv"),
    ("README", "02-dataset-inventory-v4-readme.csv"),
]


def _require(path: Path) -> list[list[str]]:
    if not path.is_file():
        raise SystemExit(f"missing authoritative CSV: {path.relative_to(ROOT)}")
    return read_csv(path)


def rebuild_catalog() -> Path:
    sheets = {name: _require(SPREADSHEETS / csv_name) for name, csv_name in CATALOG_SHEETS}
    out = SPREADSHEETS / "09-per-jurisdiction-dataset-catalog.xlsx"
    write_workbook(out, sheets)
    return out


def rebuild_inventory() -> Path:
    sheets = {name: _require(SPREADSHEETS / csv_name) for name, csv_name in INVENTORY_SHEETS}
    out = SPREADSHEETS / "02-dataset-inventory-v4.xlsx"
    write_workbook(out, sheets)
    return out


def main() -> int:
    catalog = rebuild_catalog()
    inventory = rebuild_inventory()
    print(f"wrote {catalog.relative_to(ROOT)}")
    print(f"wrote {inventory.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
