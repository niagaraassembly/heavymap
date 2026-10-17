"""Load and sanity-check PCDP vocab/schema. Stdlib only."""

import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VOCAB = ROOT / "docs" / "architecture" / "vocab" / "pcdp.vocab.json"
SCHEMA = ROOT / "docs" / "architecture" / "vocab" / "pcdp.schema.json"


class PcdpVocabTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.vocab = json.loads(VOCAB.read_text(encoding="utf-8"))
        cls.schema = json.loads(SCHEMA.read_text(encoding="utf-8"))

    def test_linear_ids_use_na_prefix(self):
        self.assertEqual(self.vocab["linear"], "NA-14")
        self.assertEqual(self.vocab["prose_linear"], "NA-11")
        self.assertEqual(self.schema["properties"]["linear"]["const"], "NA-14")
        self.assertEqual(self.schema["properties"]["prose_linear"]["const"], "NA-11")

    def test_vacant_rule_allows_quoted_source_class(self):
        rule = self.vocab["normative"]["register_quotation_only"]["rule"]
        self.assertIn("must not assert on its own that land is vacant", rule)
        self.assertIn("City class: Vacant Lands", rule)
        self.assertIn("Tax class confirmed: industrial", rule)
        self.assertIn("does not relax MPAC not_licensed", rule)
        self.assertEqual(
            self.vocab["normative"]["register_quotation_only"]["words"],
            ["vacant", "empty", "available", "closed", "departed"],
        )

    def test_json_is_object(self):
        self.assertEqual(self.vocab["id"], "pcdp-vocabulary")
        self.assertEqual(self.schema["$id"], "pcdp.schema.json")


if __name__ == "__main__":
    unittest.main()
