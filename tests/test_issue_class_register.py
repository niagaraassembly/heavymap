"""Sheet 21 class register: existing classes, confirmed priorities, no values."""

from __future__ import annotations

import csv
import unittest
from pathlib import Path

from heavymap.gaps import PUBLISH_PRIORITIES

ROOT = Path(__file__).resolve().parents[1]
SHEET21 = ROOT / "Spreadsheets" / "21-issue-class-register.csv"
SHEET18 = ROOT / "Spreadsheets" / "18-quirks-log.csv"
SHEET19 = ROOT / "Spreadsheets" / "19-process-insights.csv"
SHEET20 = ROOT / "Spreadsheets" / "20-data-gaps-ledger.csv"

COLUMNS = (
    "class_code",
    "sheet",
    "source_column",
    "source_value",
    "definition",
    "publish_priority",
    "notes",
)


def _rows(path: Path) -> list[dict[str, str]]:
    with path.open(encoding="utf-8", newline="") as fh:
        return list(csv.DictReader(fh))


class IssueClassRegisterTests(unittest.TestCase):
    def setUp(self):
        self.rows = _rows(SHEET21)

    def test_columns_and_hygiene(self):
        with SHEET21.open(encoding="utf-8", newline="") as fh:
            reader = csv.DictReader(fh)
            self.assertEqual(reader.fieldnames, list(COLUMNS))
        for row in self.rows:
            for value in row.values():
                self.assertNotIn(";", value)
                self.assertNotIn("\n", value)
                self.assertFalse(value[:1] in ("=", "+", "@"))
            if row["publish_priority"]:
                self.assertIn(row["publish_priority"], PUBLISH_PRIORITIES)

    def test_covers_existing_classes_only(self):
        by_sheet = {
            "18": {r["source_value"] for r in self.rows if r["sheet"] == "18"},
            "19": {r["source_value"] for r in self.rows if r["sheet"] == "19"},
            "20": {r["source_value"] for r in self.rows if r["sheet"] == "20"},
        }
        self.assertEqual(by_sheet["18"], {r["quirk_type"] for r in _rows(SHEET18)})
        self.assertEqual(by_sheet["19"], {r["insight_type"] for r in _rows(SHEET19)})
        self.assertEqual(by_sheet["20"], {r["gap_type"] for r in _rows(SHEET20)})
        codes = [r["class_code"] for r in self.rows]
        self.assertEqual(len(codes), len(set(codes)))

    def test_accepted_priorities(self):
        by_code = {r["class_code"]: r for r in self.rows}
        self.assertEqual(
            by_code["gap.withheld_screened"]["publish_priority"],
            "must_solve_before_publish",
        )
        self.assertEqual(by_code["quirk.offset"]["publish_priority"], "label_and_ship")
        self.assertEqual(by_code["quirk.range_gzip"]["publish_priority"], "label_and_ship")
        for token in (
            "placeholder",
            "not_in_coverage",
            "stale",
            "sparse",
            "contradictory",
            "empty",
            "not_present_in_source",
        ):
            self.assertEqual(by_code[f"gap.{token}"]["publish_priority"], "label_and_ship")
        self.assertEqual(by_code["insight.method"]["publish_priority"], "")


if __name__ == "__main__":
    unittest.main()
