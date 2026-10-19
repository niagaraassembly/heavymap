"""Synthetic fixtures for the parcel dossier. No real rows, no real owner values.

The sentinel strings below stand in for owner names, mailing addresses and
legal descriptions. The tests assert they never reach an output byte.
"""

from __future__ import annotations

import csv
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

from heavymap.dossier.build import (
    Inputs,
    audit_output,
    load_all,
    property_code_family,
    shard_key,
    write_dossier,
)
from heavymap.dossier.schema import (
    FORBIDDEN_KEY_PARTS,
    SOURCE_FIELDS,
    ScreeningError,
    pick,
    screen_record,
    spec_keys,
)

ROOT = Path(__file__).resolve().parents[1]
PFX = "hm:ca:on:hamilton:parcel:01M54B6G6TGKK2T9HZECVVHX"
P_EXACT = PFX + "A0"
P_NOCOV = PFX + "B1"
P_MANY = PFX + "C2"
P_BAD = PFX + "D3"
P_UNM = PFX + "E4"
ADDR = "hm:ca:on:hamilton:address:01M54B88M4NA9TX2THA3VQFM"

SENTINELS = (
    "ZZOWNER SENTINEL HOLDINGS",
    "99 MAILING SENTINEL LANE",
    "PLAN SENTINEL LOT 7 LEGAL",
    "Z9Z 9Z9",
    "MAILSENTINEL@EXAMPLE.TEST",
)


def _write_csv(path: Path, header: list[str], rows: list[list]) -> None:
    with open(path, "w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(header)
        w.writerows(rows)


def _fc(props: list[dict]) -> dict:
    return {
        "type": "FeatureCollection",
        "features": [
            {"type": "Feature", "geometry": {"type": "Point", "coordinates": [0, 0]}, "properties": p}
            for p in props
        ],
    }


def make_fixture(base: Path) -> Inputs:
    reg = base / "heavymap-registry/hamilton"
    run = reg / "runs/r2"
    run.mkdir(parents=True)
    (reg / "CURRENT").write_text("r2\n")
    (run / "MANIFEST.json").write_text(json.dumps({"run_id": "r2"}))
    _write_csv(
        run / "parcels.csv",
        ["hm_id", "status", "geom_hash", "fingerprint", "area_m2", "arn_grade", "geometry_json"],
        [
            [P_EXACT, "active", "h1", "f1", "1200.456", "exact_1to1", '{"type":"Polygon"}'],
            [P_NOCOV, "active", "h2", "f2", "800", "not_in_coverage", "{}"],
            [P_MANY, "active", "h3", "f3", "5000", "many_to_one", "{}"],
            [P_BAD, "active", "h4", "f4", "300", "one_to_many", "{}"],
            [P_UNM, "active", "h5", "f5", "310", "unmatched", "{}"],
            [PFX + "F5", "retired", "h6", "f6", "10", "exact_1to1", "{}"],
        ],
    )
    addr_rows = [
        [ADDR + "0T", "12|MAIN STREET WEST|HAMILTON|", P_EXACT, "pip", "active"],
        [ADDR + "1T", "10|MAIN STREET WEST|HAMILTON|", P_EXACT, "nearest_10m", "active"],
        [ADDR + "2T", "5|KING STREET|DUNDAS|", "", "unmatched", "active"],
        [ADDR + "3T", "7|KING STREET|DUNDAS|", P_NOCOV, "pip_ambiguous", "active"],
    ]
    for i in range(30):
        addr_rows.append([ADDR + f"{i:02d}"[-2:].replace("0", "Z") + "M", f"{i + 1}|INDUSTRIAL DRIVE|STONEY CREEK|{i}", P_MANY, "pip", "active"])
    _write_csv(run / "addresses.csv", ["hm_id", "civic_key", "parcel_hm_id", "link_method", "status"], addr_rows)
    _write_csv(
        run / "arn_links.csv",
        ["hm_id", "arn", "npca_source_id", "grade", "iou", "method", "notes"],
        [
            [P_EXACT, "251899900000100", "11", "exact_1to1", "0.99998", "representative_point", ""],
            [P_MANY, "251899900000200", "12", "many_to_one", "0.7", "representative_point", ""],
            [P_MANY, "251899900000300", "13", "many_to_one", "0.2", "representative_point", ""],
            [P_BAD, "000000000000000", "14", "one_to_many", "0.99", "representative_point", "non_city_prefix"],
        ],
    )

    ov = base / "heavymap-overlays/hamilton"
    orun = ov / "runs/v2"
    orun.mkdir(parents=True)
    (ov / "CURRENT").write_text("v2")
    (orun / "MANIFEST.json").write_text(
        json.dumps(
            {
                "run_id": "v2",
                "sliver": {"max_area_m2": 5.0, "max_parcel_share": 0.01},
                "layers": [
                    {"layer_id": "LYR-HAM-ZONING", "band": "land_use", "endpoint": "https://example.test/z", "catalog_row_ref": "C002"},
                    {"layer_id": "LYR-NPCA-REGULATION-LANDS", "band": "constraints", "endpoint": "https://example.test/r", "catalog_row_ref": "A09"},
                ],
            }
        )
    )
    _write_csv(
        orun / "overlay_links.csv",
        ["heavymap_id", "layer_id", "feature_source_id", "class", "quoted_label", "area_m2", "parcel_share", "feature_share", "sliver"],
        [
            [P_EXACT, "LYR-HAM-ZONING", "z1", "C5", "City zoning: C5", "1180.0", "0.98300", "0.1", "n"],
            [P_EXACT, "LYR-HAM-ZONING", "z2", "P7", "City zoning: P7", "1.5", "0.00120", "0.0", "y"],
            [P_EXACT, "LYR-NPCA-REGULATION-LANDS", "r1", "", "NPCA approximate regulation lands", "200.0", "0.16660", "0.01", "n"],
            [P_MANY, "LYR-HAM-ZONING", "z3", "M2", "City zoning: M2", "5000", "1.0", "0.5", "n"],
            [P_MANY, "LYR-HAM-ZONING", "z4", "M3", "City zoning: M3", "0.1", "0.00002", "0.0", "y"],
            [P_MANY, "LYR-HAM-ZONING", "z5", "C1", "City zoning: C1", "0.2", "0.00004", "0.0", "y"],
            [P_UNM, "LYR-HCA-REGULATED-AREAS", "h1", "regulated", "HCA regulated area", "100", "0.32", "0.01", "n"],
        ],
    )

    apt = base / "apt.geojson"
    apt.write_text(
        json.dumps(
            _fc(
                [
                    {"OBJECTID_1": 11, "ARN": "251899900000100", "MPAC_STREE": "12 MAIN ST W", "Owner": SENTINELS[0], "MAILING_ADDR": SENTINELS[1]},
                    {"OBJECTID_1": 12, "ARN": "251899900000200", "MPAC_STREE": "1 INDUSTRIAL DR", "Legal_Txt": SENTINELS[2]},
                    {"OBJECTID_1": 13, "ARN": "251899900000300", "MPAC_STREE": " "},
                    {"OBJECTID_1": 14, "ARN": "000000000000000", "MPAC_STREE": "NOWHERE"},
                ]
            )
        )
    )
    cv = base / "cityview.geojson"
    cv.write_text(
        json.dumps(
            _fc(
                [
                    {"ARN": "251899900000100", "PropCode": " ", "Owner": SENTINELS[0], "Legal_Txt": SENTINELS[2], "PostalCode": SENTINELS[3]},
                    {"ARN": "25189990000020000000", "PropCode": "520", "Owner": SENTINELS[0], "Email": SENTINELS[4]},
                    {"ARN": "251899900000300", "PropCode": "410", "Owner": SENTINELS[0]},
                ]
            )
        )
    )
    return Inputs(run, orun, apt, cv)


def _walk_keys(obj, out: set[str]) -> None:
    if isinstance(obj, dict):
        for k, v in obj.items():
            out.add(k)
            _walk_keys(v, out)
    elif isinstance(obj, list):
        for v in obj:
            _walk_keys(v, out)


class ScreeningTests(unittest.TestCase):
    def test_spec_has_no_owner_or_legal_keys(self):
        for key in spec_keys():
            for part in FORBIDDEN_KEY_PARTS:
                self.assertNotIn(part, key.lower(), key)

    def test_source_allowlist_excludes_identifying_fields(self):
        for fields in SOURCE_FIELDS.values():
            for bad in ("Owner", "Legal_Txt", "PostalCode", "MAILING_ADDR"):
                self.assertNotIn(bad, fields)

    def test_pick_drops_everything_not_allowlisted(self):
        row = pick({"ARN": "1", "PropCode": "301", "Owner": SENTINELS[0], "Legal_Txt": SENTINELS[2]}, "LYR-NPCA-PARCELS-CITYVIEW")
        self.assertEqual(set(row), {"ARN", "PropCode"})

    def _ok_record(self):
        return {
            "heavymap_id": P_EXACT,
            "area": {"m2": 1.0, "src": "s", "join": "j", "conf": "high", "label": "l"},
            "coverage": {"status": "has_arn", "provisional": False, "grade": "g", "src": "s", "join": "j", "conf": "c", "label": "l"},
            "roll": [{"arn": "2518", "grade": "g", "method": "m", "iou": 1.0, "src": "s", "join": "j", "conf": "c", "label": "l"}],
            "addresses": {"src": "s", "join": "j", "label": "l", "count": 0, "truncated": False, "shown": []},
            "overlays": {"src": "s", "join": "j", "label": "l", "rows": [], "sliver_count": 0},
            "gaps": [],
        }

    def test_screen_accepts_allowlisted_record(self):
        screen_record(self._ok_record())

    def test_screen_rejects_unknown_keys_anywhere(self):
        rec = self._ok_record()
        rec["owner"] = SENTINELS[0]
        with self.assertRaises(ScreeningError):
            screen_record(rec)
        rec = self._ok_record()
        rec["roll"][0]["Legal_Txt"] = SENTINELS[2]
        with self.assertRaises(ScreeningError):
            screen_record(rec)
        rec = self._ok_record()
        rec["addresses"]["shown"].append({"id": "a", "text": "t", "unit": "", "join": "pip", "conf": "high", "mailing": SENTINELS[1]})
        with self.assertRaises(ScreeningError):
            screen_record(rec)

    def test_screen_rejects_nested_object_in_leaf(self):
        rec = self._ok_record()
        rec["area"]["label"] = {"Owner": SENTINELS[0]}
        with self.assertRaises(ScreeningError):
            screen_record(rec)

    def test_screen_requires_core_keys(self):
        rec = self._ok_record()
        del rec["coverage"]
        with self.assertRaises(ScreeningError):
            screen_record(rec)
        rec = self._ok_record()
        del rec["gaps"]
        with self.assertRaises(ScreeningError):
            screen_record(rec)


class BuildTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.base = Path(self.tmp.name)
        self.inputs = make_fixture(self.base)
        self.out = self.base / "out"
        idx = load_all(self.inputs)
        self.manifest = write_dossier(idx, self.out, max_addresses=25)
        self.records = {}
        for path in (self.out / "shards").glob("*.json"):
            self.records.update(json.loads(path.read_text())["records"])

    def tearDown(self):
        self.tmp.cleanup()

    def test_no_sentinel_or_forbidden_key_in_any_output_byte(self):
        files = list(self.out.rglob("*.json"))
        self.assertTrue(files)
        for path in files:
            text = path.read_text(encoding="utf-8")
            for s in SENTINELS:
                self.assertNotIn(s, text, f"{s} leaked into {path.name}")
            keys: set[str] = set()
            if path.parent.name == "shards":
                for rec in json.loads(text)["records"].values():
                    _walk_keys(rec, keys)
                for k in keys:
                    for part in FORBIDDEN_KEY_PARTS:
                        self.assertNotIn(part, k.lower())
        self.assertEqual(audit_output(self.out), 5)

    def test_one_record_per_active_parcel(self):
        self.assertEqual(set(self.records), {P_EXACT, P_NOCOV, P_MANY, P_BAD, P_UNM})
        for hm_id, rec in self.records.items():
            path = self.out / "shards" / f"{shard_key(hm_id)}.json"
            self.assertIn(hm_id, json.loads(path.read_text())["records"])

    def test_coverage_split(self):
        st = {k: r["coverage"]["status"] for k, r in self.records.items()}
        self.assertEqual(st[P_EXACT], "has_arn")
        self.assertEqual(st[P_MANY], "has_arn")
        self.assertEqual(st[P_NOCOV], "not_covered")
        self.assertTrue(self.records[P_NOCOV]["coverage"]["provisional"])
        self.assertEqual(st[P_BAD], "arn_invalid")
        self.assertEqual(st[P_UNM], "in_coverage_unmatched")
        self.assertEqual(self.manifest["coverage"]["has_arn"], 2)

    def test_roll_provenance_and_property_code(self):
        r = self.records[P_EXACT]["roll"][0]
        self.assertEqual(r["arn"], "251899900000100")
        self.assertEqual(r["join"], "exact_1to1")
        self.assertEqual(r["conf"], "high")
        self.assertEqual(r["src"], "LYR-NPCA-ASSESSMENT-PARCELS-TEST")
        self.assertEqual(r["roll_address"], "12 MAIN ST W")
        self.assertNotIn("property_code", r)  # blank PropCode
        many = self.records[P_MANY]["roll"]
        self.assertEqual(len(many), 2)
        self.assertEqual(many[0]["property_code"]["code"], "520")
        self.assertEqual(many[0]["property_code"]["join"], "arn_prefix15")
        self.assertEqual(many[0]["property_code"]["family"], "Industrial")
        self.assertEqual(many[1]["property_code"]["join"], "arn_exact")
        self.assertNotIn("roll_address", many[1])  # blank MPAC street
        bad = self.records[P_BAD]["roll"][0]
        self.assertIsNone(bad["arn"])
        self.assertEqual(bad["flag"], "placeholder")
        self.assertEqual(bad["grade"], "placeholder")

    def test_addresses(self):
        a = self.records[P_EXACT]["addresses"]
        self.assertEqual(a["count"], 2)
        self.assertEqual([x["text"] for x in a["shown"]], ["10 MAIN STREET WEST, HAMILTON", "12 MAIN STREET WEST, HAMILTON"])
        self.assertEqual(a["shown"][0]["conf"], "medium")
        self.assertEqual(self.records[P_NOCOV]["addresses"]["count"], 0)  # pip_ambiguous not linked
        m = self.records[P_MANY]["addresses"]
        self.assertEqual(m["count"], 30)
        self.assertTrue(m["truncated"])
        self.assertEqual(len(m["shown"]), 25)

    def test_overlays_slivers_flagged_never_dropped_and_alias(self):
        o = self.records[P_EXACT]["overlays"]
        self.assertEqual(o["sliver_count"], 1)
        layers = [r["layer"] for r in o["rows"]]
        self.assertEqual(layers, ["LYR-HAM-ZONING", "LYR-HAM-ZONING", "LYR-NPCA-APPROX-REGULATION-LANDS"])
        by_class = {r["class"]: r for r in o["rows"]}
        self.assertIs(by_class["P7"].get("sliver"), True)
        self.assertNotIn("sliver", by_class["C5"])
        self.assertIn("1 flagged as sliver", o["label"])
        many = self.records[P_MANY]["overlays"]
        self.assertEqual(many["sliver_count"], 2)
        self.assertEqual(len(many["rows"]), 3)
        self.assertEqual(sum(1 for r in many["rows"] if r.get("sliver")), many["sliver_count"])
        # every input link row appears in output
        total = sum(len(r["overlays"]["rows"]) for r in self.records.values())
        self.assertEqual(total, 7)
        self.assertIn("LYR-NPCA-APPROX-REGULATION-LANDS", self.manifest["sources"])
        self.assertNotIn("LYR-NPCA-REGULATION-LANDS", self.manifest["sources"])

    def test_screen_refuses_non_bool_sliver(self):
        rec = dict(self.records[P_EXACT])
        rec["overlays"] = dict(rec["overlays"])
        rec["overlays"]["rows"] = [dict(rec["overlays"]["rows"][0], sliver="y")]
        with self.assertRaises(ScreeningError):
            screen_record(rec)

    def test_area(self):
        self.assertEqual(self.records[P_EXACT]["area"]["m2"], 1200.5)

    def test_gaps_cite_ledger_ids_not_copy(self):
        withheld = {"GAP-0008", "GAP-0009", "GAP-0006", "GAP-0007"}
        for rec in self.records.values():
            self.assertIsInstance(rec["gaps"], list)
            self.assertEqual(rec["gaps"], sorted(rec["gaps"]))
            for gid in rec["gaps"]:
                self.assertRegex(gid, r"^GAP-\d{4}$")
            self.assertTrue(withheld.isdisjoint(rec["gaps"]), rec["gaps"])
        exact = self.records[P_EXACT]["gaps"]
        self.assertIn("GAP-0001", exact)
        self.assertIn("GAP-0002", exact)
        self.assertNotIn("GAP-0003", exact)
        self.assertEqual(self.records[P_NOCOV]["gaps"], ["GAP-0010"])
        self.assertEqual(self.records[P_BAD]["gaps"], ["GAP-0005"])
        unm = self.records[P_UNM]["gaps"]
        self.assertIn("GAP-0011", unm)
        self.assertIn("GAP-0012", unm)
        many = self.records[P_MANY]["gaps"]
        self.assertIn("GAP-0001", many)
        self.assertIn("GAP-0003", many)
        self.assertIn("GAP-0004", many)
        self.assertNotIn("GAP-0002", many)
        ledger = self.manifest["gaps_ledger"]
        ids = {row["gap_id"] for row in ledger["entries"]}
        self.assertTrue({"GAP-0001", "GAP-0008", "GAP-0010"} <= ids)
        owner_row = next(r for r in ledger["entries"] if r["gap_id"] == "GAP-0008")
        self.assertEqual(owner_row["gap_type"], "withheld_screened")
        self.assertEqual(owner_row["field"], "Owner")
        self.assertNotIn("notes", owner_row)
        for s in SENTINELS:
            self.assertNotIn(s, owner_row["reason"])
        self.assertEqual(self.manifest["gap_counts"]["GAP-0010"], 1)
        self.assertEqual(self.manifest["gap_counts"]["GAP-0005"], 1)


class HelperTests(unittest.TestCase):
    def test_property_code_family(self):
        self.assertEqual(property_code_family("301"), "Residential")
        self.assertEqual(property_code_family("100"), "Vacant land")
        self.assertIsNone(property_code_family("X"))
        self.assertIsNone(property_code_family("950"))

    def test_shard_key(self):
        self.assertEqual(shard_key(P_EXACT), "A0")


class CliTests(unittest.TestCase):
    def test_cli_end_to_end(self):
        with tempfile.TemporaryDirectory() as tmp:
            base = Path(tmp)
            inputs = make_fixture(base)
            out = base / "dossier"
            proc = subprocess.run(
                [
                    sys.executable, "-m", "heavymap.dossier",
                    "--data-root", str(base),
                    "--npca-apt", str(inputs.npca_apt),
                    "--npca-cityview", str(inputs.npca_cityview),
                    "--out-dir", str(out),
                ],
                cwd=ROOT, capture_output=True, text=True,
            )
            self.assertEqual(proc.returncode, 0, proc.stderr)
            summary = json.loads(proc.stdout)
            self.assertEqual(summary["records"], 5)
            self.assertEqual(summary["audited"], 5)
            self.assertTrue((out / "manifest.json").exists())

    def test_cli_refuses_missing_inputs(self):
        with tempfile.TemporaryDirectory() as tmp:
            proc = subprocess.run(
                [sys.executable, "-m", "heavymap.dossier", "--data-root", tmp],
                cwd=ROOT, capture_output=True, text=True,
            )
            self.assertEqual(proc.returncode, 2)


if __name__ == "__main__":
    unittest.main()
