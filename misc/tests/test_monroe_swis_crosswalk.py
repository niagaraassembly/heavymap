import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from monroe_swis_crosswalk import ENDPOINT, GROUP_FIELDS, build


class CrosswalkTest(unittest.TestCase):
    def test_ambiguous_null_and_short_keys_refuse_join(self):
        groups = [
            {"EXPR_1": "261400", "swis": "City of Rochester", "EXPR_2": 26, "n": 3},
            {"EXPR_1": "261400", "swis": None, "EXPR_2": 26, "n": 1},
            {"EXPR_1": "263200", "swis": "Town of Henrietta", "EXPR_2": 26, "n": 2},
            {"EXPR_1": "263200", "swis": "Town of Webster", "EXPR_2": 26, "n": 1},
            {"EXPR_1": "265489", "swis": "Town of Webster", "EXPR_2": 26, "n": 4},
            {"EXPR_1": "050040", "swis": "Town of Webster", "EXPR_2": 17, "n": 1},
            {"EXPR_1": "", "swis": None, "EXPR_2": 0, "n": 1},
        ]
        raw = {"endpoint": ENDPOINT, "group_by": GROUP_FIELDS,
               "retrieved_at_utc": "2026-09-30T00:00:00+00:00", "groups": groups,
               "total_count": 13, "null_swis_count": 2,
               "empty_countysbl_count": 1, "null_countysbl_count": 0}
        rows, lengths, _, _ = build(raw)
        by_pair = {(r["countysbl_prefix"], r["monroe_swis_name"]): r for r in rows}
        self.assertEqual(sum(lengths.values()), 13)
        self.assertEqual(by_pair[("261400", "City of Rochester")]["status"], "inferred_from_prefix")
        self.assertEqual(by_pair[("261400", "")]["status"], "unresolved")
        self.assertEqual(by_pair[("263200", "Town of Henrietta")]["status"], "ambiguous")
        self.assertEqual(by_pair[("263200", "Town of Webster")]["status"], "ambiguous")
        self.assertEqual(by_pair[("265489", "Town of Webster")]["status"], "ambiguous")
        self.assertEqual(by_pair[("050040", "Town of Webster")]["status"], "unresolved")
        self.assertEqual(by_pair[("050040", "Town of Webster")]["invalid_length_count"], 1)

    def test_rejects_incomplete_aggregates(self):
        raw = {"endpoint": ENDPOINT, "group_by": GROUP_FIELDS,
               "retrieved_at_utc": "2026-09-30T00:00:00+00:00",
               "groups": [{"EXPR_1": "261400", "swis": "City of Rochester", "EXPR_2": 26, "n": 1}],
               "total_count": 2, "null_swis_count": 0,
               "empty_countysbl_count": 0, "null_countysbl_count": 0}
        with self.assertRaisesRegex(ValueError, "do not reconcile"):
            build(raw)


if __name__ == "__main__":
    unittest.main()
