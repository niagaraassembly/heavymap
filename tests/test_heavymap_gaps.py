"""Synthetic tests for the data-gaps ledger. No real rows, no owner values."""

from __future__ import annotations

import csv
import tempfile
import unittest
from pathlib import Path

from heavymap.gaps import (
    GAP_TYPES,
    LEDGER_COLUMNS,
    PUBLISH_PRIORITIES,
    LedgerError,
    ParcelGapContext,
    context_from_record,
    is_placeholder_arn,
    ledger_path,
    load_ledger,
    manifest_ledger,
    parcel_gap_ids,
    public_entry,
)

ROOT = Path(__file__).resolve().parents[1]
PI_PATH = ROOT / "Spreadsheets" / "19-process-insights.csv"


class PlaceholderArnTests(unittest.TestCase):
    def test_all_zeros_and_hyphens_are_placeholders(self):
        self.assertTrue(is_placeholder_arn("000000000000000"))
        self.assertTrue(is_placeholder_arn("000-000-000-000-000"))
        self.assertTrue(is_placeholder_arn("0"))
        self.assertTrue(is_placeholder_arn(0))  # type: ignore[arg-type]

    def test_real_rolls_are_not_placeholders(self):
        self.assertFalse(is_placeholder_arn("251800000000001"))
        self.assertFalse(is_placeholder_arn("261500000000001"))
        self.assertFalse(is_placeholder_arn("000012345678901"))
        self.assertFalse(is_placeholder_arn(""))
        self.assertFalse(is_placeholder_arn(None))
        self.assertFalse(is_placeholder_arn("ARN"))


class LedgerLoadTests(unittest.TestCase):
    def setUp(self):
        self.rows = load_ledger()
        self.by_id = {row["gap_id"]: row for row in self.rows}

    def test_seeded_rows_load_and_match_schema(self):
        self.assertEqual(len(self.rows), 12)
        self.assertEqual(list(self.by_id), [f"GAP-{i:04d}" for i in range(1, 13)])
        for row in self.rows:
            self.assertIn(row["gap_type"], GAP_TYPES)
            self.assertTrue(row["reason"])
            self.assertTrue(row["source_pi_ids"])
            self.assertIn(row["publish_priority"], PUBLISH_PRIORITIES)
            self.assertNotIn(";", row["reason"])
            self.assertNotIn("\n", row["reason"])

    def test_seeded_publish_priority_follows_section_4(self):
        must = {"GAP-0008", "GAP-0009"}
        for row in self.rows:
            expected = (
                "must_solve_before_publish"
                if row["gap_id"] in must
                else "label_and_ship"
            )
            self.assertEqual(row["publish_priority"], expected, row["gap_id"])

    def test_csv_columns_and_hygiene(self):
        with ledger_path().open(encoding="utf-8", newline="") as fh:
            reader = csv.DictReader(fh)
            self.assertEqual(reader.fieldnames, list(LEDGER_COLUMNS))
            for raw in reader:
                for value in raw.values():
                    self.assertNotIn(";", value)
                    self.assertNotIn("\n", value)
                    self.assertFalse(value[:1] in ("=", "+", "-", "@"))

    def test_cited_pi_ids_exist(self):
        with PI_PATH.open(encoding="utf-8", newline="") as fh:
            known = {row["insight_id"] for row in csv.DictReader(fh)}
        cited = {pi for row in self.rows for pi in row["source_pi_ids"]}
        missing = cited - known
        self.assertFalse(missing, missing)

    def test_withheld_is_manifest_only_and_names_the_field(self):
        owner = self.by_id["GAP-0008"]
        legal = self.by_id["GAP-0009"]
        self.assertEqual(owner["gap_type"], "withheld_screened")
        self.assertEqual(owner["field"], "Owner")
        self.assertEqual(legal["field"], "Legal_Txt")
        self.assertEqual(owner["parcel_attach"], ["manifest_only"])
        self.assertEqual(legal["parcel_attach"], ["manifest_only"])
        self.assertIn("withheld", owner["reason"].lower())
        self.assertIn("No values are shown", owner["reason"])
        public = public_entry(owner)
        self.assertNotIn("notes", public)
        self.assertEqual(set(public), set(public_entry(legal)))

    def test_placeholder_and_coverage_counts(self):
        ph = self.by_id["GAP-0005"]
        self.assertEqual(ph["gap_type"], "placeholder")
        self.assertEqual(ph["numerator"], 10)
        cov = self.by_id["GAP-0010"]
        self.assertEqual(cov["gap_type"], "not_in_coverage")
        self.assertEqual(cov["numerator"], 74276)
        self.assertEqual(cov["denominator"], 166745)
        self.assertEqual(cov["status"], "provisional")
        self.assertEqual(self.by_id["GAP-0011"]["numerator"], 29)
        self.assertEqual(self.by_id["GAP-0006"]["numerator"], 0)
        self.assertEqual(self.by_id["GAP-0002"]["numerator"], 1628)

    def test_manifest_omits_nothing_seeded_and_keeps_withheld(self):
        mf = manifest_ledger(self.rows)
        ids = [row["gap_id"] for row in mf["entries"]]
        self.assertEqual(ids, [f"GAP-{i:04d}" for i in range(1, 13)])
        self.assertEqual(mf["path"], "Spreadsheets/20-data-gaps-ledger.csv")

    def test_parcel_attach_never_copies_withheld(self):
        ctx = ParcelGapContext(
            coverage_status="has_arn",
            has_valid_arn=True,
            has_property_code=True,
            roll_flags=("placeholder",),
            overlay_layers=("LYR-HCA-REGULATED-AREAS",),
        )
        ids = parcel_gap_ids(ctx, self.rows)
        self.assertNotIn("GAP-0008", ids)
        self.assertNotIn("GAP-0009", ids)
        self.assertNotIn("GAP-0006", ids)
        self.assertNotIn("GAP-0007", ids)
        self.assertIn("GAP-0005", ids)
        self.assertIn("GAP-0012", ids)
        self.assertIn("GAP-0001", ids)

    def test_context_from_record(self):
        rec = {
            "coverage": {"status": "not_covered"},
            "roll": [],
            "overlays": {"rows": []},
        }
        self.assertEqual(
            parcel_gap_ids(context_from_record(rec), self.rows), ["GAP-0010"]
        )

    def test_unknown_type_is_refused(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "bad.csv"
            with path.open("w", encoding="utf-8", newline="") as fh:
                writer = csv.DictWriter(fh, fieldnames=list(LEDGER_COLUMNS))
                writer.writeheader()
                writer.writerow(
                    {
                        "gap_id": "GAP-9999",
                        "scope": "field",
                        "jurisdiction": "hamilton",
                        "layer_id": "L",
                        "field": "F",
                        "gap_type": "not_a_type",
                        "reason": "r",
                        "numerator": "",
                        "denominator": "",
                        "unit": "",
                        "evidence": "e",
                        "first_observed": "2026-10-17",
                        "source_pi_ids": "PI-0001",
                        "parcel_attach": "manifest_only",
                        "status": "open",
                        "publish_priority": "label_and_ship",
                        "notes": "",
                    }
                )
            with self.assertRaises(LedgerError):
                load_ledger(path)


if __name__ == "__main__":
    unittest.main()
