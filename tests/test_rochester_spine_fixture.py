"""Schema checks for the synthetic Rochester spine fixture. No network, no owner values."""

import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FIXTURE = ROOT / "fixtures" / "parcels" / "hm-us-ny-rochester-parcel-SYN-04799.json"
SPEC = ROOT / "docs" / "architecture" / "rochester-parcel-local-token.md"
SCHEMA = ROOT / "docs" / "architecture" / "vocab" / "pcdp.schema.json"
VOCAB = ROOT / "docs" / "architecture" / "vocab" / "pcdp.vocab.json"

SBL20 = "04799000010010000000"
PREFIX = "261400"
COUNTY = PREFIX + SBL20
PADDED = "047.99-1-1"
UNPADDED = "47.99-1-1"
SPINE = f"hm:us:ny:rochester:parcel:{SBL20}"
PILOT_CITY_ID = "04762000010220000000"
BANDS = [
    "identity",
    "land_use",
    "constraints",
    "activity_registers",
    "derived_readings",
    "share_export",
]
REFUSALS = {"not_in_coverage", "not_licensed", "not_joined"}
OWNER_KEYS = {
    "owner",
    "owner_name",
    "ownernme1",
    "pstladdress",
    "primary_owner",
    "add_owner",
    "mail_addr",
    "mail_address",
}


def walk_keys(value):
    if isinstance(value, dict):
        for key, item in value.items():
            yield key
            yield from walk_keys(item)
    elif isinstance(value, list):
        for item in value:
            yield from walk_keys(item)


class RochesterFixtureTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.fixture = json.loads(FIXTURE.read_text(encoding="utf-8"))
        cls.schema = json.loads(SCHEMA.read_text(encoding="utf-8"))
        cls.vocab = json.loads(VOCAB.read_text(encoding="utf-8"))

    def test_spine_key_matches_vocabulary_grammar(self):
        pattern = self.schema["$defs"]["spineKey"]["pattern"]
        self.assertRegex(self.fixture["spine_key"], pattern)
        self.assertEqual(self.fixture["spine_key"], SPINE)
        local = SPINE.rsplit(":", 1)[1]
        self.assertEqual(local, SBL20)
        self.assertRegex(local, r"^[0-9]{20}$")
        self.assertTrue(local.startswith("0"))
        self.assertNotIn(PILOT_CITY_ID, FIXTURE.read_text(encoding="utf-8"))

    def test_identifiers_are_text_and_compose(self):
        native = self.fixture["native_keys"]
        for name in (
            "sbl20",
            "printkey_padded",
            "printkey_unpadded_not_for_join",
            "countysbl",
            "swis_prefix_candidate",
            "swis_name_as_published",
        ):
            self.assertIsInstance(native[name], str, name)
        self.assertEqual(native["sbl20"], SBL20)
        self.assertEqual(native["printkey_padded"], PADDED)
        self.assertEqual(native["printkey_unpadded_not_for_join"], UNPADDED)
        self.assertNotEqual(native["printkey_padded"], native["printkey_unpadded_not_for_join"])
        self.assertEqual(native["swis_prefix_candidate"], PREFIX)
        self.assertEqual(len(native["countysbl"]), 26)
        self.assertEqual(native["countysbl"], COUNTY)
        self.assertTrue(native["countysbl"].isdigit())
        self.assertNotIsInstance(native["sbl20"], (int, float))

    def test_duplicate_fold_mints_one_key(self):
        fold = self.fixture["duplicate_fold"]
        self.assertTrue(fold["not_a_second_spine_unit"])
        self.assertEqual(fold["sbl20"], SBL20)
        self.assertGreater(len(fold["source_rows"]), 1)
        self.assertEqual(fold["minted_spine_keys"], [SPINE])
        self.assertEqual(fold["outline"], "not_joined")
        self.assertNotIn("-a", fold["minted_spine_keys"][0])

    def test_ladder_grades_and_refusals(self):
        grades = {item["token"] for item in self.vocab["normative"]["evidence_grades"]["tokens"]}
        reasons = {item["token"] for item in self.vocab["normative"]["refusal_reasons"]["tokens"]}
        self.assertEqual(reasons, REFUSALS)
        bands = self.fixture["bands"]
        self.assertEqual([band["band"] for band in bands], BANDS)
        saw_mpac = False
        saw_float = False
        saw_swis = False
        saw_state = False
        for band in bands:
            self.assertIn(band["status"], ("filled", "refused"))
            for claim in band["claims"]:
                self.assertIn(claim["grade"], grades - {"refused"})
                self.assertIn(claim["assertion_state"], ("supported", "contested", "refuted"))
                stamp = claim["stamp"]
                for field in ("source_name", "publisher", "licence"):
                    self.assertTrue(stamp.get(field))
            for refusal in band["refusals"]:
                self.assertEqual(refusal["grade"], "refused")
                self.assertIn(refusal["reason"], REFUSALS)
                self.assertTrue(refusal.get("must_not_conclude"))
            if band["band"] == "identity":
                names = [claim.get("name") for claim in band["claims"]]
                self.assertEqual(names.count("sbl20"), 1)
                sbl_claim = next(claim for claim in band["claims"] if claim.get("name") == "sbl20")
                self.assertIsInstance(sbl_claim["value"], str)
                self.assertEqual(sbl_claim["value"], SBL20)
                objects = [refusal["object"] for refusal in band["refusals"]]
                saw_mpac = any("MPAC" in obj for obj in objects)
                saw_float = any("float-stored" in obj for obj in objects)
                saw_swis = any(refusal["reason"] == "not_joined" and "SWIS" in refusal["object"] for refusal in band["refusals"])
                saw_state = any(refusal["reason"] == "not_in_coverage" and "statewide" in refusal["object"] for refusal in band["refusals"])
                for refusal in band["refusals"]:
                    if "MPAC" in refusal["object"]:
                        self.assertEqual(refusal["reason"], "not_licensed")
                    if "float-stored" in refusal["object"]:
                        self.assertEqual(refusal["reason"], "not_joined")
        self.assertTrue(saw_mpac)
        self.assertTrue(saw_float)
        self.assertTrue(saw_swis)
        self.assertTrue(saw_state)

    def test_no_owner_fields(self):
        keys = {key.lower() for key in walk_keys(self.fixture)}
        self.assertTrue(OWNER_KEYS.isdisjoint(keys))

    def test_spec_records_recommendation_and_unconfirmed_prefix(self):
        text = SPEC.read_text(encoding="utf-8")
        self.assertIn("hm:us:ny:rochester:parcel:{SBL20}", text)
        self.assertIn("inferred", text.lower())
        self.assertIn("not confirmed", text.lower())
        self.assertIn(SBL20, text)
        self.assertIn("No `dataset_id`", text)
        self.assertIn("no cells changed", text)


if __name__ == "__main__":
    unittest.main()
