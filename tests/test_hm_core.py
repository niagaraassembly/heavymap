import json
import subprocess
import unittest
from pathlib import Path

import hm_testlib as lib
from heavymap import apply as apply_mod
from heavymap import csvio, guard, ids, validate
from heavymap.findings import errors
from heavymap.schema import Schema

LAYER = "lyr-syn-example-parcels-0"
QUIRK = "Q-syn-parcels-01"


class RepoSchemaTest(unittest.TestCase):
    def test_committed_registry_is_header_only_and_valid(self):
        schema = Schema(lib.REPO)
        for name in ("services", "layers", "fields", "identifier_rules", "quirks", "join_tests",
                     "use_decisions", "scores", "claims", "deny_list", "gates"):
            self.assertEqual(schema.tables[name].stage, "registry")
        for name, table in schema.tables.items():
            header, rows = csvio.read_csv(schema.path(name))
            self.assertEqual(header, table.columns, name)
            self.assertEqual(rows, [], f"{name} should be header-only until real data is imported")
        self.assertEqual(errors(validate.validate(schema)), [])

    def test_editable_fields_exist_and_review_table_has_expected_columns(self):
        schema = Schema(lib.REPO)
        for t in schema.tables.values():
            self.assertTrue(set(t.editable) <= set(t.columns), t.name)
        self.assertEqual(schema.tables["review_decisions"].columns[1:], [
            "record_id", "table", "field", "old_value", "new_value", "decision_code", "note", "reviewer", "timestamp", "linear_id"])

    def test_cli_validate_and_guard_on_repo(self):
        code, out = lib.run_cli("validate", "--json")
        self.assertEqual(code, 0, out)
        self.assertTrue(json.loads(out)["ok"])
        code, out = lib.run_cli("guard", "--json")
        self.assertEqual(code, 0, out)


class ValidateTest(unittest.TestCase):
    def setUp(self):
        self.schema, self.tmp = lib.sandbox()

    def tearDown(self):
        lib.cleanup(self.tmp)

    def codes(self):
        return {f.code for f in errors(validate.validate(self.schema))}

    def test_synthetic_sandbox_is_valid(self):
        self.assertEqual(self.codes(), set())

    def test_bad_enum_semicolon_and_fk(self):
        lib.set_cell(self.schema, "layers", LAYER, "grain", "bogus")
        lib.set_cell(self.schema, "quirks", QUIRK, "handling", "a;b")
        lib.set_cell(self.schema, "join_tests", "JT-syn-parcels-sbl-identifier-20261001", "layer_id", "lyr-missing")
        self.assertTrue({"bad_value", "fk_missing"} <= self.codes())

    def test_hits_cannot_exceed_tested_and_linear_id_required(self):
        lib.set_cell(self.schema, "join_tests", "JT-syn-parcels-sbl-identifier-20261001", "hits", "31")
        lib.set_cell(self.schema, "layers", LAYER, "linear_id", "")
        self.assertTrue({"hits_exceed_tested", "required_blank"} <= self.codes())

    def test_duplicate_key_and_header_mismatch(self):
        t = self.schema.tables["quirks"]
        rows = csvio.clean_rows(self.schema.load("quirks")[1])
        csvio.write_csv(self.schema.path("quirks"), t.columns, rows + rows[:1])
        self.assertIn("duplicate_key", self.codes())
        self.schema.path("services").write_text("service_id,publisher\n", encoding="utf-8")
        self.assertIn("header_mismatch", self.codes())

    def test_decision_rows_are_checked(self):
        lib.add_decision(self.schema, record_id=QUIRK, table="quirks", field="count", new_value="9")  # not editable
        lib.add_decision(self.schema, record_id=QUIRK, table="quirks", field="status", new_value="open", reviewer="Codex bot")
        lib.add_decision(self.schema, record_id="Q-none-01", table="quirks", field="status", new_value="open")
        lib.add_decision(self.schema, record_id=QUIRK, table="quirks", field="status", new_value="nope")
        self.assertTrue({"field_not_editable", "agent_reviewer", "record_missing", "bad_value"} <= self.codes())


class IdsTest(unittest.TestCase):
    def test_ids_wrap_ny_identifiers_and_allocators(self):
        self.assertEqual(ids.validate_sbl20("04799000010010000000"), "04799000010010000000")
        with self.assertRaises(ids.IdentifierRefusal) as ctx:
            ids.validate_sbl20(4799000010010000000)
        self.assertEqual(ctx.exception.code, "bare_number_type")
        a = ids.cand_id("HTTPS://GIS.Example.invalid/arcgis/rest/services/")
        self.assertEqual(a, ids.cand_id("https://gis.example.invalid/arcgis/rest/services"))
        self.assertRegex(a, r"^CAND-[0-9a-f]{8}$")
        self.assertEqual(ids.layer_id("svc-ca-on-welland-arcgisweb", "Base/IMS_Parcels/0"), "lyr-ca-on-welland-arcgisweb-base-ims-parcels-0")
        self.assertRegex(ids.decision_id(), r"^DEC-[0-9A-HJKMNP-TV-Z]{26}$")
        self.assertNotEqual(ids.decision_id(), ids.decision_id())

    def test_cli_ids(self):
        code, out = lib.run_cli("ids", "check", "sbl20", "04799000010010000000", "--json")
        self.assertEqual((code, json.loads(out)["data"]["valid"]), (0, True))
        code, out = lib.run_cli("ids", "check", "swis6", "Monroe", "--json")
        self.assertEqual(code, 1)
        self.assertEqual(json.loads(out)["data"]["refusal"], "swis_name_not_code")
        code, out = lib.run_cli("ids", "print-key", "04799000010010000000", "--style", "padded", "--json")
        self.assertEqual(code, 0)
        self.assertEqual(json.loads(out)["data"]["value"], "047.99-1-1")


class GuardTest(unittest.TestCase):
    def setUp(self):
        self.schema, self.tmp = lib.sandbox()

    def tearDown(self):
        lib.cleanup(self.tmp)

    def codes(self, **kw):
        return {f.code for f in errors(guard.guard(self.schema, use_git=False, **kw))}

    def test_clean_sandbox_passes_and_g6_defaults_closed(self):
        self.assertEqual(self.codes(), set())
        self.assertFalse(guard.gate_open(self.schema, "G6"))

    def test_surfaced_needs_g6(self):
        lib.set_cell(self.schema, "layers", LAYER, "lifecycle_status", "surfaced")
        self.assertIn("g6_closed", self.codes())

    def test_mpac_and_npca_are_forced_not_used_and_unscored(self):
        lib.set_cell(self.schema, "layers", "lyr-syn-mpac-roll-0", "lifecycle_status", "profiled")
        self.assertIn("deny_listed", self.codes())
        hits = guard.deny_matches(guard.deny_rules(self.schema), publisher="NPCA export", endpoint="https://x/d0ZCwU7eGKVeNiEE")
        self.assertEqual([h["deny_id"] for h in hits], ["NPCA"])
        self.assertEqual(guard.deny_matches(guard.deny_rules(self.schema), publisher="Impact Ontario"), [])  # word boundary

    def test_owner_column_and_value_are_violations(self):
        lib.set_cell(self.schema, "claims", "CLM-syn-parcels-recordcount", "value_summary", "OWNERNME1=SMITH")
        self.assertIn("owner_value", self.codes())
        # names alone are fine
        lib.set_cell(self.schema, "claims", "CLM-syn-parcels-recordcount", "value_summary", "owner field OWNERNME1 present")
        self.assertNotIn("owner_value", self.codes())
        self.assertEqual(guard.scrub_owner(self.schema, "x OWNERNME1: DOE y"), "x [owner value withheld]")

    def test_tracked_local_data_and_big_files(self):
        root = self.schema.root
        subprocess.run(["git", "init", "-q"], cwd=root, check=True)
        (root / "local-data").mkdir()
        (root / "local-data" / "pull.json").write_text("{}", encoding="utf-8")
        (root / "data" / "big.csv").write_bytes(b"x" * 2_100_000)
        subprocess.run(["git", "add", "-f", "local-data/pull.json", "data/big.csv"], cwd=root, check=True)
        found = {f.code for f in errors(guard.guard(self.schema))}
        self.assertTrue({"tracked_local_path", "oversize_file"} <= found)

    def test_gitignore_must_list_local_data_and_build(self):
        (self.schema.root / ".gitignore").write_text("", encoding="utf-8")
        self.assertIn("gitignore_missing", self.codes())


class ApplyTest(unittest.TestCase):
    def setUp(self):
        self.schema, self.tmp = lib.sandbox()

    def tearDown(self):
        lib.cleanup(self.tmp)

    def statuses(self):
        return {(i["table"], i["field"]): i["status"] for i in apply_mod.plan(self.schema)}

    def test_dry_run_changes_nothing_and_write_applies_once(self):
        lib.add_decision(self.schema, record_id=QUIRK, table="quirks", field="status", old_value="open", new_value="accepted")
        before = self.schema.path("quirks").read_text()
        res = apply_mod.apply(self.schema, write=False)
        self.assertEqual(res["summary"], {"pending": 1})
        self.assertEqual(before, self.schema.path("quirks").read_text())
        res = apply_mod.apply(self.schema, write=True)
        self.assertEqual(res["applied"], 1)
        self.assertEqual(lib.get_cell(self.schema, "quirks", QUIRK, "status"), "accepted")
        self.assertTrue((self.schema.root / res["manifest"]).is_file())
        self.assertEqual(apply_mod.apply(self.schema, write=True)["applied"], 0)  # idempotent
        self.assertEqual(self.statuses()[("quirks", "status")], "applied")

    def test_latest_row_wins_and_corrected_value_is_honored(self):
        lib.add_decision(self.schema, record_id=QUIRK, table="quirks", field="handling", old_value="read as text | refuse float input", new_value="first try")
        lib.add_decision(self.schema, record_id=QUIRK, table="quirks", field="handling", old_value="read as text | refuse float input", new_value="corrected by reviewer")
        apply_mod.apply(self.schema, write=True)
        self.assertEqual(lib.get_cell(self.schema, "quirks", QUIRK, "handling"), "corrected by reviewer")

    def test_stale_old_value_is_not_applied(self):
        lib.add_decision(self.schema, record_id=QUIRK, table="quirks", field="status", old_value="blocking", new_value="resolved")
        res = apply_mod.apply(self.schema, write=True)
        self.assertEqual((res["applied"], res["summary"]), (0, {"stale": 1}))
        self.assertEqual(lib.get_cell(self.schema, "quirks", QUIRK, "status"), "open")

    def test_flag_codes_do_not_change_values(self):
        for code in "DFHXN":
            lib.add_decision(self.schema, record_id=QUIRK, table="quirks", field="status", old_value="open", new_value="resolved", decision_code=code)
        apply_mod.apply(self.schema, write=True)
        self.assertEqual(lib.get_cell(self.schema, "quirks", QUIRK, "status"), "open")
        self.assertEqual(self.statuses()[("quirks", "status")], "flag")

    def test_policy_refusals(self):
        # surfaced while G6 is closed, promotion by a non-promoter, agent reviewer, use on a deny-listed layer
        lib.add_decision(self.schema, record_id=LAYER, table="layers", field="lifecycle_status", old_value="profiled", new_value="surfaced", reviewer="Morgen")
        lib.add_decision(self.schema, record_id="lyr-syn-mpac-roll-0", table="layers", field="lifecycle_status", old_value="not_used", new_value="profiled")
        lib.add_decision(self.schema, record_id=QUIRK, table="quirks", field="status", old_value="open", new_value="resolved", reviewer="Codex")
        res = apply_mod.apply(self.schema, write=True)
        self.assertEqual(res["applied"], 0)
        reasons = {i["reason"] for i in res["items"] if i["status"] == "refused"}
        self.assertEqual(reasons, {"g6_closed", "deny_listed", "agent_reviewer"})
        lib.add_decision(self.schema, record_id=LAYER, table="layers", field="lifecycle_status", old_value="profiled", new_value="dormant", reviewer="Dana")
        self.assertEqual(guard.check_change(self.schema, "layers", LAYER, "lifecycle_status", "dormant", "Dana"), "promotion_morgen_only")
        self.assertIsNone(guard.check_change(self.schema, "layers", LAYER, "lifecycle_status", "dormant", "Morgen"))

    def test_lifecycle_change_stamps_date_and_score_total_recomputes(self):
        lib.add_decision(self.schema, record_id=LAYER, table="layers", field="lifecycle_status", old_value="profiled", new_value="spined", timestamp="2026-10-03T12:00:00Z")
        lib.add_decision(self.schema, record_id="SCR-syn-parcels-v1.0", table="scores", field="c_openness", old_value="1", new_value="3")
        apply_mod.apply(self.schema, write=True)
        self.assertEqual(lib.get_cell(self.schema, "layers", LAYER, "status_changed_date"), "2026-10-03")
        self.assertEqual(lib.get_cell(self.schema, "scores", "SCR-syn-parcels-v1.0", "total"), "85")

    def test_blank_heavy_criterion_gives_blank_total(self):
        from heavymap import score
        row = {"c_joinability": "3", "c_coverage": "", "c_grain": "3", "c_openness": "3"}
        self.assertEqual(score.total(self.schema, row), "")

    def test_write_aborts_when_validation_fails(self):
        lib.add_decision(self.schema, record_id=QUIRK, table="quirks", field="status", old_value="open", new_value="accepted")
        lib.set_cell(self.schema, "layers", LAYER, "grain", "bogus")
        res = apply_mod.apply(self.schema, write=True)
        self.assertEqual(res["applied"], 0)
        self.assertIn("aborted", res)

    def test_cli_apply_exit_codes(self):
        lib.add_decision(self.schema, record_id=QUIRK, table="quirks", field="status", old_value="open", new_value="accepted")
        code, out = lib.run_cli("apply", "--json", root=self.schema.root)
        self.assertEqual(code, 0)
        self.assertEqual(json.loads(out)["data"]["write"], False)
        self.assertEqual(lib.get_cell(self.schema, "quirks", QUIRK, "status"), "open")
        code, _ = lib.run_cli("apply", "--write", root=self.schema.root)
        self.assertEqual(code, 0)
        self.assertEqual(lib.get_cell(self.schema, "quirks", QUIRK, "status"), "accepted")
        lib.add_decision(self.schema, record_id=QUIRK, table="quirks", field="status", old_value="open", new_value="wontfix")
        code, _ = lib.run_cli("apply", root=self.schema.root)
        self.assertEqual(code, 1)  # stale


if __name__ == "__main__":
    unittest.main()
