"""Synthetic fixtures for NA-306 increment 1. No real rows or owner values."""

from __future__ import annotations

import io
import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from contextlib import redirect_stdout
from pathlib import Path

from heavymap.dossier.schema import SCHEMA_VERSION
from heavymap.prepublish.checks import run_checks
from heavymap.prepublish.cli import main

ROOT = Path(__file__).resolve().parents[1]
PFX = "hm:ca:on:hamilton:parcel:01M54B6G6TGKK2T9HZECVVHX"
P_ONE = PFX + "A0"
P_TWO = PFX[:-1] + "Z" + "A0"  # same shard as P_ONE (last two characters)
SENTINELS = (
    "ZZOWNER SENTINEL HOLDINGS",
    "99 MAILING SENTINEL LANE",
    "PLAN SENTINEL LOT 7 LEGAL",
)


def _record(hm_id: str) -> dict:
    return {
        "key": hm_id,
        "area": {"value": 1.0, "unit": "m2", "crs": "EPSG:26917", "src": "s", "join": "j", "conf": "high"},
        "coverage": {
            "status": "has_arn",
            "provisional": False,
            "grade": "g",
            "src": "s",
            "join": "j",
            "conf": "c",
        },
        "roll": [
            {
                "arn": "251899900000100",
                "grade": "g",
                "method": "m",
                "iou": 1.0,
                "flag": "ok",
                "roll_address": "1 INDUSTRIAL DR",
                "src": "s",
                "join": "j",
                "conf": "c",
            }
        ],
        "addresses": {"src": "s", "join": "j", "count": 0, "complete": True, "items": []},
        "overlays": {"src": "s", "join": "j", "row_count": 0, "rows": [], "sliver_count": 0},
        "gaps": [],
    }


def _detail(hm_id: str) -> dict:
    return {"addresses_full": [], "feature_ids": {"/overlays/rows/0": "75"}}


def write_clean_tree(base: Path) -> Path:
    out = base / "out"
    shards = out / "shards"
    shards.mkdir(parents=True)
    payload = {
        "schema": SCHEMA_VERSION,
        "jurisdiction": "hamilton",
        "shard": "A0",
        "records": {P_ONE: _record(P_ONE), P_TWO: _record(P_TWO)},
    }
    (shards / "A0.json").write_text(json.dumps(payload), encoding="utf-8")
    detail_dir = out / "detail"
    detail_dir.mkdir()
    detail_payload = {**payload, "records": {P_ONE: _detail(P_ONE), P_TWO: _detail(P_TWO)}}
    (detail_dir / "A0.json").write_text(json.dumps(detail_payload), encoding="utf-8")
    (out / "files.json").write_text(json.dumps({"schema": SCHEMA_VERSION, "files": []}), encoding="utf-8")
    manifest = {
        "schema": SCHEMA_VERSION,
        "jurisdiction": "hamilton",
        "shard_key": {"rule": "last two", "path": "shards/{key}.json", "count": 1},
        "counts": {"records": 2},
        "coverage": {"has_arn": 2},
        "sizes_bytes": {"total": 1, "min": 1, "median": 1, "max": 1},
        "screening": "allowlist",
        "inputs": {"registry_run": "r2", "overlay_run": "o1"},
        "code_commit": "deadbeef",
    }
    (out / "manifest.json").write_text(json.dumps(manifest), encoding="utf-8")
    (out / "run-record.json").write_text(
        json.dumps(
            {
                "run_id": "01TEST",
                "run_kind": "production",
                "jurisdiction": "hamilton",
                "code_commit": "deadbeef",
                "metrics": {"S1": 1.0},
                "outputs": [{"path": "manifest.json", "sha256": "abc"}],
            }
        ),
        encoding="utf-8",
    )
    ndjson = out / "tiles"
    ndjson.mkdir()
    feature = {
        "type": "Feature",
        "properties": {
            "heavymap_id": P_ONE,
            "arn_grade": "exact_1to1",
            "area_m2": 1.0,
            "arn_count": 1,
            "arn": "251899900000100",
        },
        "geometry": {"type": "Point", "coordinates": [0, 0]},
    }
    (ndjson / "parcels.ndjson").write_text(json.dumps(feature) + "\n", encoding="utf-8")
    (ndjson / "tiny.pmtiles").write_bytes(b"PMTiles\x00synthetic")
    return out


class PrepublishTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.base = Path(self.tmp.name)
        self.out = write_clean_tree(self.base)

    def tearDown(self):
        self.tmp.cleanup()

    def test_detail_file_with_unknown_field_or_display_key_fails(self):
        path = self.out / "detail" / "A0.json"
        payload = json.loads(path.read_text())
        payload["records"][P_ONE]["label"] = "display text"
        path.write_text(json.dumps(payload), encoding="utf-8")
        report = run_checks(self.out, reference=None, withheld_values=SENTINELS)
        self.assertEqual(report["checks"]["allowlist"]["status"], "fail")
        self.assertFalse(report["ok"])

    def test_record_id_containing_a_forbidden_substring_is_not_a_field_name(self):
        # ULIDs are random; one can spell "NAME". It is a record id, not a field.
        odd = PFX[:-8] + "NAMEXXXX" + "A0"
        for sub in ("shards", "detail"):
            path = self.out / sub / "A0.json"
            payload = json.loads(path.read_text())
            payload["records"][odd] = payload["records"].pop(P_ONE)
            if sub == "shards":
                payload["records"][odd]["key"] = odd
            path.write_text(json.dumps(payload), encoding="utf-8")
        report = run_checks(self.out, reference=None, withheld_values=SENTINELS)
        self.assertEqual(report["checks"]["leak"]["status"], "pass", report["checks"]["leak"])

    def test_malformed_record_id_is_not_exempt(self):
        # A key that is not a ULID id cannot hide a forbidden field name.
        for sub in ("shards", "detail"):
            path = self.out / sub / "A0.json"
            payload = json.loads(path.read_text())
            payload["records"]["owner"] = payload["records"].pop(P_ONE)
            path.write_text(json.dumps(payload), encoding="utf-8")
        report = run_checks(self.out, reference=None, withheld_values=SENTINELS)
        self.assertEqual(report["checks"]["leak"]["status"], "fail")
        kinds = {f["kind"] for f in report["checks"]["leak"]["findings"]}
        self.assertIn("bad_record_id", kinds)

    def test_record_key_must_match_map_key_and_shard(self):
        path = self.out / "shards" / "A0.json"
        payload = json.loads(path.read_text())
        payload["records"][P_ONE]["key"] = P_TWO  # disagrees with its map key
        path.write_text(json.dumps(payload), encoding="utf-8")
        report = run_checks(self.out, reference=None, withheld_values=SENTINELS)
        self.assertEqual(report["checks"]["leak"]["status"], "fail")

    def test_clean_tree_passes_with_reference(self):
        reference = self.base / "ref"
        shutil.copytree(self.out, reference)
        report = run_checks(
            self.out,
            reference=reference,
            withheld_values=SENTINELS,
        )
        self.assertTrue(report["ok"])
        for name in ("leak", "allowlist", "size", "reproducibility"):
            self.assertIn(report["checks"][name]["status"], {"pass", "warn"})

    def test_seeded_owner_field_fails_leak(self):
        payload = json.loads((self.out / "shards" / "A0.json").read_text())
        payload["records"][P_ONE]["Owner"] = SENTINELS[0]
        (self.out / "shards" / "A0.json").write_text(json.dumps(payload), encoding="utf-8")
        report = run_checks(self.out, withheld_values=SENTINELS)
        self.assertFalse(report["ok"])
        self.assertEqual(report["checks"]["leak"]["status"], "fail")
        kinds = {row["kind"] for row in report["checks"]["leak"]["findings"]}
        self.assertTrue({"field_name", "value"} & kinds)

    def test_seeded_sentinel_value_fails_leak(self):
        text = (self.out / "manifest.json").read_text(encoding="utf-8")
        (self.out / "manifest.json").write_text(
            text[:-1] + f', "note": "{SENTINELS[2]}"}}',
            encoding="utf-8",
        )
        report = run_checks(self.out, withheld_values=SENTINELS)
        self.assertEqual(report["checks"]["leak"]["status"], "fail")
        self.assertTrue(
            any(row["kind"] == "value" for row in report["checks"]["leak"]["findings"])
        )

    def test_unknown_field_fails_allowlist(self):
        payload = json.loads((self.out / "shards" / "A0.json").read_text())
        payload["records"][P_ONE]["secret_extra"] = "x"
        (self.out / "shards" / "A0.json").write_text(json.dumps(payload), encoding="utf-8")
        report = run_checks(self.out)
        self.assertEqual(report["checks"]["allowlist"]["status"], "fail")

    def test_unknown_file_kind_fails_closed(self):
        (self.out / "mystery.csv").write_text("alpha,beta\n1,2\n", encoding="utf-8")
        report = run_checks(self.out)
        self.assertEqual(report["checks"]["allowlist"]["status"], "fail")
        self.assertTrue(
            any(row["kind"] == "unknown_output" for row in report["checks"]["allowlist"]["findings"])
        )

    def test_oversize_shard_fails_budget(self):
        tiny = {
            "startup_compressed_bytes": {"warn": 10, "fail": 20},
            "shard_compressed_bytes": {"warn": 10, "fail": 20},
            "pmtiles_bytes": {"warn": 100, "fail": 200},
            "total_bytes": {"warn": 1000, "fail": 2000},
        }
        report = run_checks(self.out, budgets=tiny)
        self.assertEqual(report["checks"]["size"]["status"], "fail")

    def test_mutated_tree_fails_reproducibility(self):
        reference = self.base / "ref"
        shutil.copytree(self.out, reference)
        changed = json.loads((self.out / "manifest.json").read_text())
        changed["counts"] = {"records": 99}
        (self.out / "manifest.json").write_text(json.dumps(changed), encoding="utf-8")
        report = run_checks(self.out, reference=reference)
        self.assertEqual(report["checks"]["reproducibility"]["status"], "fail")
        kinds = {row["kind"] for row in report["checks"]["reproducibility"]["findings"]}
        self.assertTrue({"byte_mismatch", "metric_mismatch"} & kinds)

    def test_missing_reference_is_skip_not_fail(self):
        report = run_checks(self.out)
        self.assertEqual(report["checks"]["reproducibility"]["status"], "skip")
        self.assertTrue(report["ok"])

    def test_require_reference_fails_when_omitted(self):
        report = run_checks(self.out, require_reference=True)
        self.assertEqual(report["checks"]["reproducibility"]["status"], "fail")
        self.assertFalse(report["ok"])

    def test_cli_writes_report_and_fails_on_leak(self):
        payload = json.loads((self.out / "shards" / "A0.json").read_text())
        payload["records"][P_ONE]["Owner"] = SENTINELS[0]
        (self.out / "shards" / "A0.json").write_text(json.dumps(payload), encoding="utf-8")
        values = self.base / "values.txt"
        values.write_text(SENTINELS[0] + "\n", encoding="utf-8")
        report_path = self.base / "report.json"
        buf = io.StringIO()
        with redirect_stdout(buf):
            code = main([str(self.out), "--withheld-values", str(values), "--report", str(report_path)])
        self.assertEqual(code, 1)
        saved = json.loads(report_path.read_text(encoding="utf-8"))
        self.assertFalse(saved["ok"])
        self.assertEqual(saved["checks"]["leak"]["status"], "fail")

    def test_module_entrypoint(self):
        reference = self.base / "ref"
        shutil.copytree(self.out, reference)
        proc = subprocess.run(
            [
                sys.executable,
                "-m",
                "heavymap.prepublish",
                str(self.out),
                "--reference",
                str(reference),
            ],
            cwd=ROOT,
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertEqual(proc.returncode, 0, proc.stderr)
        report = json.loads(proc.stdout)
        self.assertTrue(report["ok"])


if __name__ == "__main__":
    unittest.main()
