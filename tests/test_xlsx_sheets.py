"""Round-trip checks for the stdlib xlsx helper. No network, no owner values."""

import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from xlsx_sheets import read_csv, read_workbook, write_csv, write_workbook  # noqa: E402


class XlsxSheetsTests(unittest.TestCase):
    def test_roundtrip_preserves_cells(self):
        sheets = {
            "README": [["title"], ["a note with | pipes"]],
            "Data": [["id", "name"], ["hamilton_parks", "Parks"], ["", "blank-id"]],
        }
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "t.xlsx"
            write_workbook(path, sheets)
            loaded = read_workbook(path)
        self.assertEqual(loaded["README"][0][0], "title")
        self.assertEqual(loaded["Data"][1][0], "hamilton_parks")
        self.assertEqual(loaded["Data"][1][1], "Parks")

    def test_csv_roundtrip(self):
        rows = [["a", "b"], ["1", "City class: Vacant Lands"]]
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "t.csv"
            write_csv(path, rows)
            loaded = read_csv(path)
        self.assertEqual(loaded, rows)


if __name__ == "__main__":
    unittest.main()
