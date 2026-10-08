"""Small identifier-only shape fixtures; no owner fields or raw row dumps."""

import unittest

from heavymap.ny_identifiers import (
    BatchReport,
    Duplicate,
    IdentifierRefusal,
    RejectedRow,
    compose_swis_sbl,
    inspect_ids,
    render_print_key,
    validate_sbl20,
    validate_swis6,
    validate_swis_sbl_id,
)


CITY = "04762000010220000000"
ERIE = "04718000010330000000"
GENESEE_SHAPE = "00300000010010000000"


class IdentifierTests(unittest.TestCase):
    def assert_refusal(self, code, call, *args):
        with self.assertRaises(IdentifierRefusal) as caught:
            call(*args)
        self.assertEqual(caught.exception.code, code)

    def test_text_and_leading_zero_preserved(self):
        self.assertEqual(validate_sbl20(CITY), CITY)
        self.assertEqual(validate_swis6("001400"), "001400")
        self.assertEqual(compose_swis_sbl("261400", CITY), "261400" + CITY)
        self.assertEqual(validate_swis_sbl_id("261400" + CITY), "261400" + CITY)

    def test_print_key_examples_and_style(self):
        self.assertEqual(render_print_key(CITY, "padded"), "047.62-1-22")
        self.assertEqual(render_print_key(ERIE, "unpadded"), "47.18-1-33")
        self.assertEqual(render_print_key(ERIE, "padded"), "047.18-1-33")
        self.assertEqual(render_print_key(GENESEE_SHAPE, "unpadded"), "3.-1-1")
        self.assertEqual(render_print_key(GENESEE_SHAPE, "padded"), "003.00-1-1")

    def test_invalid_identifier_stamps(self):
        for value, code in (
            ("", "empty_input"),
            ("0" * 19, "wrong_length"),
            ("0" * 19 + "-", "invalid_character"),
            ("0" * 19 + "٣", "invalid_character"),
            ("A" + "0" * 19, "unsupported_sbl_shape"),
            (123456789, "bare_number_type"),
            (None, "unsupported_type"),
        ):
            with self.subTest(value=value):
                self.assert_refusal(code, validate_sbl20, value)
        self.assert_refusal("wrong_length", validate_swis_sbl_id, CITY)
        self.assertEqual(validate_swis_sbl_id("261400" + CITY[:-1] + "A"), "261400" + CITY[:-1] + "A")

    def test_float_stored_trap_rows_are_never_coerced(self):
        # Models the damaged 1996 SBL and 2012 SBL20 storage type.
        for damaged in (4.62800001001e18, 4.76200001022e18):
            with self.subTest(damaged=damaged):
                self.assert_refusal("float_stored_input", validate_sbl20, damaged)
                self.assert_refusal("float_stored_input", compose_swis_sbl, "261400", damaged)
                self.assert_refusal("float_stored_input", render_print_key, damaged, "padded")
        self.assert_refusal("float_stored_input", validate_swis6, 261400.0)

    def test_name_is_not_a_swis_code(self):
        self.assert_refusal("swis_name_not_code", validate_swis6, "City of Rochester")
        self.assert_refusal("swis_name_not_code", compose_swis_sbl, "City of Rochester", CITY)
        self.assert_refusal("bare_number_type", validate_swis6, 261400)

    def test_real_sublot_suffix_and_county_styles(self):
        self.assertEqual(render_print_key("04628000010050040000", "padded"), "046.28-1-5.004")
        self.assertEqual(render_print_key("04761000010030020101", "padded"), "047.61-1-3.002/101")
        self.assertEqual(render_print_key("0612900003017000HOME", "padded"), "061.29-3-17./HOME")
        self.assertEqual(render_print_key("00300000010010000000", "genesee"), "3.-1-1")
        self.assertEqual(render_print_key("08404000010240000000", "genesee", swis6="180200"), "84.040-1-24")
        self.assertEqual(render_print_key("01300700010100000000", "genesee", swis6="182400"), "13.07-1-10")
        self.assertEqual(render_print_key("04719000010222000000", "erie"), "47.19-1-22.2")
        self.assertEqual(render_print_key("13100000030020010000", "chautauqua"), "131.00-3-2.1")
        self.assertEqual(render_print_key("2970240002013001000D", "chautauqua"), "297.24-2-13.1.D")
        self.assert_refusal("unknown_section_rendering", render_print_key, "08404000010240000000", "genesee")
        self.assert_refusal("unknown_print_style", render_print_key, CITY, "county")

    def test_duplicate_report_preserves_all_positions_and_refusals(self):
        self.assertEqual(
            inspect_ids([CITY, ERIE, CITY, 4.62800001001e18, CITY], "sbl20"),
            BatchReport((Duplicate(CITY, (0, 2, 4)),), (RejectedRow(3, "float_stored_input"),)),
        )
        self.assertEqual(
            inspect_ids(["261400" + CITY, "145601" + CITY, "261400" + CITY], "swis_sbl_id"),
            BatchReport((Duplicate("261400" + CITY, (0, 2)),), ()),
        )
        self.assert_refusal("unknown_identifier_kind", inspect_ids, [], "print_key")


if __name__ == "__main__":
    unittest.main()
