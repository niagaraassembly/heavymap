"""Canonical JSON: Python must match the vectors generated with the JavaScript twin."""

from __future__ import annotations

import json
import unittest
from pathlib import Path

from industrial_atlas.dossier.canonical import CanonicalError, canonical_bytes, record_hash

VECTORS = json.loads((Path(__file__).parent / "canonical-vectors.json").read_text(encoding="utf-8"))["vectors"]


class CanonicalTests(unittest.TestCase):
    def test_vectors_match_the_javascript_twin(self):
        self.assertGreater(len(VECTORS), 30)
        for v in VECTORS:
            value = json.loads(v["input_json"])
            self.assertEqual(canonical_bytes(value).decode("utf-8"), v["canonical"], v["input_json"])
            self.assertEqual(record_hash(value), v["sha256"], v["input_json"])

    def test_refuses_what_json_cannot_say(self):
        for bad in (float("nan"), float("inf"), {1: "a"}, {"a": {1, 2}}, 2**60, b"x"):
            with self.assertRaises(CanonicalError, msg=repr(bad)):
                canonical_bytes(bad)

    def test_bool_is_not_a_number_and_order_is_independent(self):
        self.assertEqual(canonical_bytes({"b": True, "a": 1}), b'{"a":1,"b":true}')
        self.assertEqual(canonical_bytes({"a": 1, "b": True}), canonical_bytes({"b": True, "a": 1}))

    def test_keys_sort_by_code_point_not_utf16(self):
        # U+FFFF sorts before U+1F600 by code point; UTF-16 order would reverse them.
        self.assertEqual(canonical_bytes({"\U0001F600": 1, "￿": 2}).decode(), '{"￿":2,"\U0001F600":1}')


if __name__ == "__main__":
    unittest.main()
