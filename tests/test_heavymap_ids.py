"""Synthetic fixtures for the HeavyMap ID registry. No real rows, no owner values."""

from __future__ import annotations

import json
import re
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from random import Random

from heavymap.ids.config import HAMILTON, is_screened_field
from heavymap.ids.format import (
    IdFactory,
    encode_ulid,
    is_ulid,
    make_spine_key,
    parse_spine_key,
)
from heavymap.ids.geojson import load_feature_collection
from heavymap.ids.geometry import Geometry, fingerprint, geom_hash, looks_like_lonlat
from heavymap.ids.models import SourceFeature
from heavymap.ids.pipeline import run_registry
from heavymap.ids.registry import (
    apply_correction,
    attach_arns,
    link_addresses,
    mint_addresses,
    mint_buildings,
    mint_parcels,
    overlap_buildings,
    reconcile_parcels,
)
from heavymap.ids.store import read_registry

OX = 580000.0
OY = 4780000.0
ROOT = Path(__file__).resolve().parents[1]


def F(source_name, source_id, geom, **props):
    return SourceFeature(
        source_id=str(source_id),
        source_name=source_name,
        geometry=geom,
        properties={k: str(v) for k, v in props.items()},
    )


def box(x0, y0, x1, y1):
    return Geometry.box(OX + x0, OY + y0, OX + x1, OY + y1)


def pt(x, y):
    return Geometry.point(OX + x, OY + y)


def factory():
    return IdFactory(clock_ms=1_700_000_000_000, rng=Random(0))


class FormatTests(unittest.TestCase):
    def test_ulid_round_trip_shape_and_crockford(self):
        local = encode_ulid(0, bytes(10))
        self.assertEqual(len(local), 26)
        self.assertTrue(is_ulid(local))
        self.assertEqual(local, "0" * 26)
        minted = factory().mint_local()
        self.assertTrue(is_ulid(minted))
        key = make_spine_key("ca", "on", "hamilton", "parcel", minted)
        parsed = parse_spine_key(key)
        self.assertEqual(parsed.jurisdiction, "hamilton")
        self.assertEqual(parsed.grain, "parcel")
        self.assertEqual(parsed.local, minted)
        vocab_re = (
            r"^hm:(ca|us):(on|ny):([a-z0-9]+(?:-[a-z0-9]+)*)"
            r":(parcel|footprint|address):([A-Za-z0-9][A-Za-z0-9._-]*)$"
        )
        self.assertRegex(key, vocab_re)

    def test_ids_never_reuse_locals_from_used_set(self):
        fac = factory()
        first = fac.mint_local()
        fac2 = IdFactory(clock_ms=1_700_000_000_000, rng=Random(0), used={first})
        second = fac2.mint_local()
        self.assertNotEqual(first, second)


class DuplicateAndMintTests(unittest.TestCase):
    def test_stacked_duplicate_geometries_collapse_with_aliases(self):
        geom = box(0, 0, 10, 10)
        features = [
            F("city_parcels", "11", geom),
            F("city_parcels", "12", geom),
            F("city_parcels", "20", box(20, 0, 30, 10)),
        ]
        recs = mint_parcels(features, factory(), HAMILTON, "run-a")
        self.assertEqual(len(recs), 2)
        stacked = next(r for r in recs if r.source_ids == ("11", "12"))
        self.assertEqual(stacked.geom_hash, geom_hash(geom))
        self.assertTrue(stacked.hm_id.startswith("hm:ca:on:hamilton:parcel:"))
        self.assertEqual(len({r.hm_id for r in recs}), 2)


class OffsetCorrectionTests(unittest.TestCase):
    def test_npca_shift_turns_a_miss_into_a_hit(self):
        city = [F("city_parcels", "1", box(0, 0, 0.4, 0.4))]
        # Served NPCA is the city geometry minus the measured City-minus-NPCA
        # vector, so it sits 0.297 m west and 0.939 m north of the city box.
        served = box(0, 0, 0.4, 0.4).translate(-0.297, 0.939)
        npca = [
            F(
                "npca_assessment_parcels_test",
                "n1",
                served,
                ARN="251800000000001",
            )
        ]
        parcels = mint_parcels(city, factory(), HAMILTON, "run-a")
        unshifted = attach_arns(
            mint_parcels(city, factory(), HAMILTON, "run-b"),
            [
                F(
                    "city_parcels",
                    "n1",
                    served,
                    ARN="251800000000001",
                )
            ],
            HAMILTON,
        )
        self.assertEqual(unshifted, [])
        self.assertEqual(parcels[0].arn_grade, "")
        shifted = apply_correction(npca, HAMILTON)
        self.assertAlmostEqual(shifted[0].geometry.bounds.minx, city[0].geometry.bounds.minx, places=9)
        links = attach_arns(parcels, npca, HAMILTON)
        self.assertEqual(len(links), 1)
        self.assertEqual(links[0].grade, "exact_1to1")
        self.assertEqual(parcels[0].arn_grade, "exact_1to1")
        self.assertGreaterEqual(links[0].iou, 0.9)


class GradeTests(unittest.TestCase):
    def test_grade_assignment_exact_one_to_many_many_to_one_unmatched_coverage(self):
        city = [
            F("city_parcels", "exact", box(0, 0, 10, 10)),
            F("city_parcels", "left", box(30, 0, 39, 10)),
            F("city_parcels", "right", box(41, 0, 50, 10)),
            F("city_parcels", "host", box(70, 0, 90, 20)),
            F("city_parcels", "near", box(10.2, 0, 16.2, 10)),
            F("city_parcels", "far", box(200, 0, 210, 10)),
        ]
        npca = [
            F(
                "npca_assessment_parcels_test",
                "n-exact",
                box(0, 0, 10, 10),
                ARN="251800000000001",
            ),
            F(
                "npca_assessment_parcels_test",
                "n-wide",
                box(30, 0, 50, 10),
                ARN="251800000000002",
            ),
            F(
                "npca_assessment_parcels_test",
                "n-a",
                box(70, 0, 78, 8),
                ARN="251800000000003",
            ),
            F(
                "npca_assessment_parcels_test",
                "n-b",
                box(82, 12, 90, 20),
                ARN="251800000000004",
            ),
        ]
        parcels = mint_parcels(city, factory(), HAMILTON, "run-a")
        attach_arns(parcels, npca, HAMILTON)
        grades = {p.source_ids[0]: p.arn_grade for p in parcels}
        self.assertEqual(grades["exact"], "exact_1to1")
        self.assertEqual(grades["left"], "one_to_many")
        self.assertEqual(grades["right"], "one_to_many")
        self.assertEqual(grades["host"], "many_to_one")
        self.assertEqual(grades["near"], "unmatched")
        self.assertEqual(grades["far"], "not_in_coverage")


class AddressAndBuildingTests(unittest.TestCase):
    def test_address_pip_and_ten_metre_fallback(self):
        parcels = mint_parcels(
            [F("city_parcels", "1", box(0, 0, 10, 10))],
            factory(),
            HAMILTON,
            "run-a",
        )
        hid = parcels[0].hm_id
        addrs = mint_addresses(
            [
                F(
                    "city_addresses",
                    "a1",
                    pt(5, 5),
                    NUMBER_COMPLETE="10",
                    FULL_STREET_NAME="SYN STREET",
                    COMMUNITY="SYN",
                    UNIT_NUMBER_COMPLETE="1",
                ),
                F(
                    "city_addresses",
                    "a2",
                    pt(10 + 7, 5),
                    NUMBER_COMPLETE="11",
                    FULL_STREET_NAME="SYN STREET",
                    COMMUNITY="SYN",
                    UNIT_NUMBER_COMPLETE="",
                ),
                F(
                    "city_addresses",
                    "a3",
                    pt(10 + 15, 5),
                    NUMBER_COMPLETE="12",
                    FULL_STREET_NAME="SYN STREET",
                    COMMUNITY="SYN",
                    UNIT_NUMBER_COMPLETE="",
                ),
                F(
                    "city_addresses",
                    "a1b",
                    pt(5.1, 5.1),
                    NUMBER_COMPLETE="10",
                    FULL_STREET_NAME="SYN STREET",
                    COMMUNITY="SYN",
                    UNIT_NUMBER_COMPLETE="1",
                ),
            ],
            factory(),
            HAMILTON,
            "run-a",
        )
        self.assertEqual(len(addrs), 3)
        stacked = next(a for a in addrs if a.civic_key.endswith("|1"))
        self.assertEqual(stacked.source_ids, ("a1", "a1b"))
        link_addresses(addrs, parcels, HAMILTON)
        by_num = {a.civic_key.split("|")[0]: a for a in addrs}
        self.assertEqual(by_num["10"].link_method, "pip")
        self.assertEqual(by_num["10"].parcel_hm_id, hid)
        self.assertEqual(by_num["11"].link_method, "nearest_10m")
        self.assertEqual(by_num["11"].parcel_hm_id, hid)
        self.assertEqual(by_num["12"].link_method, "unmatched")
        self.assertIsNone(by_num["12"].parcel_hm_id)

    def test_building_largest_overlap_keeps_full_list(self):
        parcels = mint_parcels(
            [
                F("city_parcels", "p1", box(0, 0, 10, 10)),
                F("city_parcels", "p2", box(10, 0, 20, 10)),
            ],
            factory(),
            HAMILTON,
            "run-a",
        )
        buildings = mint_buildings(
            [F("city_buildings", "b1", box(2, 2, 17, 8))],
            factory(),
            HAMILTON,
            "run-a",
        )
        overlap_buildings(buildings, parcels)
        self.assertEqual(len(buildings[0].overlaps), 2)
        areas = {ov.parcel_hm_id: ov.area_m2 for ov in buildings[0].overlaps}
        self.assertEqual(buildings[0].parcel_hm_id, max(areas, key=areas.get))
        self.assertGreater(max(areas.values()), min(areas.values()))


class ReconcileTests(unittest.TestCase):
    def test_repull_stability_same_geometry_keeps_id(self):
        features = [F("city_parcels", "1", box(0, 0, 10, 10))]
        fac = factory()
        first, _lin = reconcile_parcels([], features, fac, HAMILTON, "run-1")
        second, lin = reconcile_parcels(first, features, fac, HAMILTON, "run-2")
        self.assertEqual(first[0].hm_id, second[0].hm_id)
        self.assertEqual(lin, [])
        self.assertEqual(second[0].status, "active")

    def test_fingerprint_then_iou_keeps_id_for_small_redraw(self):
        original = [F("city_parcels", "1", box(0, 0, 10, 10))]
        # 0.2 m inset on one side: IoU still high.
        redrawn = [F("city_parcels", "1", box(0, 0, 9.95, 10))]
        fac = factory()
        first, _ = reconcile_parcels([], original, fac, HAMILTON, "run-1")
        second, lin = reconcile_parcels(first, redrawn, fac, HAMILTON, "run-2")
        self.assertEqual(first[0].hm_id, second[0].hm_id)
        self.assertNotEqual(first[0].fingerprint, second[0].fingerprint)
        self.assertEqual(lin, [])

    def test_split_mints_new_ids_with_lineage_and_never_reuses_parent(self):
        parent = [F("city_parcels", "1", box(0, 0, 20, 10))]
        children = [
            F("city_parcels", "2", box(0, 0, 10, 10)),
            F("city_parcels", "3", box(10, 0, 20, 10)),
        ]
        fac = factory()
        first, _ = reconcile_parcels([], parent, fac, HAMILTON, "run-1")
        parent_id = first[0].hm_id
        second, lin = reconcile_parcels(first, children, fac, HAMILTON, "run-2")
        active = [p for p in second if p.status == "active"]
        retired = [p for p in second if p.status == "retired"]
        self.assertEqual(len(active), 2)
        self.assertEqual(len(retired), 1)
        self.assertEqual(retired[0].hm_id, parent_id)
        self.assertEqual({link.relation for link in lin}, {"split_into"})
        self.assertTrue(all(link.from_id == parent_id for link in lin))
        self.assertNotIn(parent_id, {p.hm_id for p in active})
        extra, _ = reconcile_parcels(
            second, children + [F("city_parcels", "9", box(50, 0, 60, 10))], fac, HAMILTON, "run-3"
        )
        parent_local = parse_spine_key(parent_id).local
        active_locals = [
            parse_spine_key(p.hm_id).local
            for p in extra
            if p.status == "active"
        ]
        self.assertNotIn(parent_local, active_locals)
        all_locals = [parse_spine_key(p.hm_id).local for p in extra]
        self.assertEqual(all_locals.count(parent_local), 1)

    def test_merge_mints_new_id_and_retires_parents(self):
        parents = [
            F("city_parcels", "1", box(0, 0, 10, 10)),
            F("city_parcels", "2", box(10, 0, 20, 10)),
        ]
        merged = [F("city_parcels", "3", box(0, 0, 20, 10))]
        fac = factory()
        first, _ = reconcile_parcels([], parents, fac, HAMILTON, "run-1")
        parent_ids = {p.hm_id for p in first}
        second, lin = reconcile_parcels(first, merged, fac, HAMILTON, "run-2")
        active = [p for p in second if p.status == "active"]
        retired = [p for p in second if p.status == "retired"]
        self.assertEqual(len(active), 1)
        self.assertEqual(len(retired), 2)
        self.assertEqual({link.relation for link in lin}, {"merged_from"})
        self.assertEqual({link.from_id for link in lin}, parent_ids)
        self.assertNotIn(active[0].hm_id, parent_ids)


class PipelineStoreTests(unittest.TestCase):
    def test_pipeline_writes_versioned_csv_and_round_trips(self):
        parcels = [F("city_parcels", "1", box(0, 0, 10, 10))]
        npca = [
            F(
                "npca_assessment_parcels_test",
                "n1",
                box(0, 0, 10, 10),
                ARN="251800000000001",
            )
        ]
        addresses = [
            F(
                "city_addresses",
                "a1",
                pt(4, 4),
                NUMBER_COMPLETE="1",
                FULL_STREET_NAME="SYN ROAD",
                COMMUNITY="SYN",
                UNIT_NUMBER_COMPLETE="",
            )
        ]
        buildings = [F("city_buildings", "b1", box(1, 1, 4, 4))]
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp) / "reg"
            _reg, manifest, dest = run_registry(
                parcels=parcels,
                npca=npca,
                addresses=addresses,
                buildings=buildings,
                config=HAMILTON,
                registry_dir=root,
                factory=factory(),
                run_id="20261017T000000Z",
            )
            self.assertTrue((dest / "MANIFEST.json").is_file())
            self.assertTrue((dest / "parcels.csv").is_file())
            self.assertEqual(manifest["schema_version"], 1)
            self.assertEqual(manifest["owner_fields_copied"], False)
            loaded = read_registry(root)
            self.assertIsNotNone(loaded)
            self.assertEqual(len(loaded.active_parcels()), 1)
            self.assertEqual(loaded.active_parcels()[0].arn_grade, "exact_1to1")
            self.assertEqual(loaded.active_addresses()[0].link_method, "pip")
            self.assertEqual(len(loaded.active_buildings()[0].overlaps), 1)

    def test_cli_on_synthetic_geojson_drops_owner_field(self):
        payload = {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "properties": {
                        "OBJECTID": 1,
                        "Owner": "MUST-NOT-BE-COPIED",
                        "Legal_Txt": "MUST-NOT-BE-COPIED",
                    },
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [
                            [
                                [OX, OY],
                                [OX + 10, OY],
                                [OX + 10, OY + 10],
                                [OX, OY + 10],
                                [OX, OY],
                            ]
                        ],
                    },
                }
            ],
        }
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            geo = tmp_path / "parcels.geojson"
            geo.write_text(json.dumps(payload), encoding="utf-8")
            loaded = load_feature_collection(geo, "city_parcels")
            self.assertEqual(len(loaded), 1)
            self.assertNotIn("Owner", loaded[0].properties)
            self.assertNotIn("Legal_Txt", loaded[0].properties)
            self.assertTrue(is_screened_field("Owner"))
            out = tmp_path / "registry"
            proc = subprocess.run(
                [
                    sys.executable,
                    "-m",
                    "heavymap.ids",
                    "--parcels",
                    str(geo),
                    "--registry-dir",
                    str(out),
                    "--run-id",
                    "cli-test",
                    "--print-manifest",
                ],
                cwd=str(ROOT),
                capture_output=True,
                text=True,
                check=False,
            )
            self.assertEqual(proc.returncode, 0, proc.stderr)
            self.assertIn("cli-test", proc.stdout)
            self.assertNotIn("MUST-NOT-BE-COPIED", proc.stdout)
            written = (out / "runs" / "cli-test" / "parcels.csv").read_text(encoding="utf-8")
            self.assertNotIn("MUST-NOT-BE-COPIED", written)
            self.assertIn("hm:ca:on:hamilton:parcel:", written)

    def test_second_run_without_optional_layers_keeps_attachments(self):
        parcels = [F("city_parcels", "1", box(0, 0, 10, 10))]
        npca = [
            F(
                "npca_assessment_parcels_test",
                "n1",
                box(0, 0, 10, 10),
                ARN="251800000000001",
            )
        ]
        addresses = [
            F(
                "city_addresses",
                "a1",
                pt(4, 4),
                NUMBER_COMPLETE="1",
                FULL_STREET_NAME="SYN ROAD",
                COMMUNITY="SYN",
                UNIT_NUMBER_COMPLETE="",
            )
        ]
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp) / "reg"
            run_registry(
                parcels=parcels,
                npca=npca,
                addresses=addresses,
                config=HAMILTON,
                registry_dir=root,
                factory=factory(),
                run_id="run-1",
            )
            _reg, manifest, _dest = run_registry(
                parcels=parcels,
                config=HAMILTON,
                registry_dir=root,
                factory=factory(),
                run_id="run-2",
            )
            loaded = read_registry(root)
            self.assertEqual(len(loaded.active_parcels()), 1)
            self.assertEqual(loaded.active_parcels()[0].arn_grade, "exact_1to1")
            self.assertEqual(len(loaded.active_addresses()), 1)
            self.assertEqual(loaded.active_addresses()[0].link_method, "pip")
            self.assertEqual(manifest["previous_run_id"], "run-1")

    def test_lonlat_input_is_refused(self):
        lonlat = [
            F(
                "city_parcels",
                "1",
                Geometry.box(-80.0, 43.2, -79.9, 43.3),
            )
        ]
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaises(Exception) as caught:
                run_registry(
                    parcels=lonlat,
                    config=HAMILTON,
                    registry_dir=Path(tmp),
                    factory=factory(),
                    run_id="bad-crs",
                )
            self.assertEqual(caught.exception.code, "input_not_projected")

    def test_degree_detector_accepts_utm(self):
        self.assertFalse(looks_like_lonlat([box(0, 0, 10, 10)]))
        self.assertTrue(
            looks_like_lonlat([Geometry.box(-80.05, 43.21, -79.95, 43.29)])
        )


class FingerprintAidTests(unittest.TestCase):
    def test_fingerprint_is_not_the_id(self):
        geom = box(0, 0, 10, 10)
        recs = mint_parcels([F("city_parcels", "1", geom)], factory(), HAMILTON, "r")
        self.assertNotEqual(recs[0].hm_id.split(":")[-1], recs[0].fingerprint)
        self.assertNotEqual(recs[0].hm_id.split(":")[-1], recs[0].geom_hash)
        self.assertEqual(recs[0].fingerprint, fingerprint(geom))


if __name__ == "__main__":
    unittest.main()
