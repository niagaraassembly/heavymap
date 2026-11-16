"""Token coverage (D-065): every token the dossier emits has an English label.

The mapping from a token to its label key is the contract in
drafts/wave-1/contract-label-lookup.md. Set HM_RELEASE_DIR to also check a real build.
"""

from __future__ import annotations

import json
import os
import tempfile
import unittest
from pathlib import Path

from heavymap.dossier.build import load_all, write_dossier

from test_heavymap_dossier import make_fixture

LABELS = Path(__file__).resolve().parents[1] / "labels"


def label_keys() -> set[str]:
    keys: set[str] = set()
    for p in LABELS.glob("*.en.json"):
        keys |= set(json.loads(p.read_text(encoding="utf-8"))["entries"])
    return keys


def required_keys(rec: dict) -> set[str]:
    """Label keys needed to show one core record."""

    need = {f"states.join.{rec['area']['join']}", f"dossier.source.{rec['area']['src']}"}
    cov = rec["coverage"]
    need |= {f"states.coverage.{cov['status']}", f"states.conf.{cov['conf']}"}
    for r in rec["roll"]:
        grade = "invalid" if r.get("flag") not in (None, "placeholder") else r["grade"]
        need |= {f"states.roll.{grade}", f"states.conf.{r['conf']}"}
        pc = r.get("property_code")
        if pc and pc.get("family"):
            need.add(f"dossier.property_code.family.{pc['family']}")
    need |= {"dossier.addresses"}
    for a in rec["addresses"]["items"]:
        need |= {f"states.join.{a['join']}", f"states.conf.{a['conf']}"}
    need |= {"dossier.overlays"}
    for o in rec["overlays"]["rows"]:
        need |= {f"layers.{o['layer']}.name", f"layers.{o['layer']}.row"}
    return need


class CoverageTests(unittest.TestCase):
    def test_fixture_tokens_have_labels(self):
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp) / "out"
            write_dossier(load_all(make_fixture(Path(tmp))), out, release_id="t")
            have = label_keys()
            for shard in (out / "shards").glob("*.json"):
                for rec in json.loads(shard.read_text())["records"].values():
                    self.assertFalse(required_keys(rec) - have, required_keys(rec) - have)

    @unittest.skipUnless(os.environ.get("HM_RELEASE_DIR"), "set HM_RELEASE_DIR to check a real build")
    def test_real_release_tokens_have_labels(self):
        have, missing = label_keys(), set()
        for shard in sorted((Path(os.environ["HM_RELEASE_DIR"]) / "shards").glob("*.json")):
            for rec in json.loads(shard.read_text())["records"].values():
                missing |= required_keys(rec) - have
        self.assertFalse(missing, missing)


if __name__ == "__main__":
    unittest.main()
