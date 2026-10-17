"""Synthetic fixtures for the parcel overlay linker. No real rows, no owner values."""

from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

from heavymap.overlays.config import (
    HAMILTON,
    OverlayLayerConfig,
    PropertyFilter,
    get_config,
)
from heavymap.overlays.errors import OverlayError
from heavymap.overlays.geometry import shapely_available
from heavymap.overlays.labels import first_filled, render_label
from heavymap.overlays.linker import is_sliver, link_layer

OX = 580000.0
OY = 4780000.0
ROOT = Path(__file__).resolve().parents[1]


def skip_without_shapely():
    return unittest.skipUnless(
        shapely_available(), "shapely 2 required for overlay geometry tests"
    )


def box_coords(x0, y0, x1, y1):
    return [
        [OX + x0, OY + y0],
        [OX + x1, OY + y0],
        [OX + x1, OY + y1],
        [OX + x0, OY + y1],
        [OX + x0, OY + y0],
    ]


def feature(fid, coords, **props):
    props = {"OBJECTID": fid, **props}
    return {
        "type": "Feature",
        "properties": props,
        "geometry": {"type": "Polygon", "coordinates": [coords]},
    }


def collection(features):
    return {"type": "FeatureCollection", "features": features}


def write_json(path: Path, payload: dict) -> Path:
    path.write_text(json.dumps(payload), encoding="utf-8")
    return path


class ConfigTests(unittest.TestCase):
    def test_hamilton_layers_cover_requested_set(self):
        ids = {lyr.layer_id for lyr in HAMILTON.layers}
        self.assertIn("LYR-HAM-ZONING", ids)
        self.assertIn("LYR-LIO-GREENBELT-DESIGNATION", ids)
        self.assertIn("LYR-LIO-NEP-DESIGNATION", ids)
        self.assertIn("LYR-HAM-NEP-DEVELOPMENT-CONTROL", ids)
        self.assertIn("LYR-NPCA-REGULATION-LANDS", ids)
        self.assertIn("LYR-HCA-REGULATED-AREAS", ids)
        self.assertIn("LYR-GRCA-REGULATION-LIMITS-WATERLOO", ids)
        self.assertIn("LYR-HAM-SECONDARY-PLAN-LAND-USE", ids)
        self.assertIn("LYR-HAM-EMPLOYMENT-LANDS", ids)
        self.assertIn("LYR-HAM-URBAN-BOUNDARY", ids)
        self.assertIn("LYR-HAM-RURAL-BOUNDARY", ids)

    def test_bands_are_ladder_tokens(self):
        allowed = {"land_use", "constraints"}
        for lyr in HAMILTON.layers:
            self.assertIn(lyr.band, allowed)
            self.assertEqual(lyr.working_crs, "EPSG:26917")

    def test_todos_filled_from_real_pulls(self):
        dca = HAMILTON.layer("LYR-HAM-NEP-DEVELOPMENT-CONTROL")
        self.assertFalse(dca.endpoint_todo)
        self.assertIn("PolicyPlanning/MapServer/10", dca.endpoint)
        self.assertEqual(dca.id_fields, ("OBJECTID",))
        self.assertEqual(dca.constant_class, "development_control")
        self.assertEqual(dca.todo_fields, ())
        secondary = HAMILTON.layer("LYR-HAM-SECONDARY-PLAN-LAND-USE")
        self.assertFalse(secondary.feature_filter.todo)
        self.assertEqual(secondary.feature_filter.field, "SEC_PLAN_NAME")
        self.assertEqual(len(secondary.feature_filter.exclude_values), 4)
        self.assertTrue(all(v.startswith("Retired - ") for v in secondary.feature_filter.exclude_values))
        self.assertEqual(secondary.class_fields, ("LANDUSE_CLASS",))
        self.assertEqual(secondary.id_fields, ("OBJECTID",))
        hca = HAMILTON.layer("LYR-HCA-REGULATED-AREAS")
        self.assertEqual(hca.id_fields, ("OID",))
        self.assertEqual(hca.class_fields, ())
        for lyr in HAMILTON.layers:
            self.assertFalse(any(t.startswith("TODO") and "dataset_id" not in t for t in lyr.todo_fields), lyr.layer_id)
            self.assertIn("-2026-10-17/", lyr.default_rel, lyr.layer_id)
            self.assertTrue(lyr.default_rel.endswith("-26917.geojson"), lyr.layer_id)

    def test_zoning_fields_come_from_profile(self):
        zoning = HAMILTON.layer("LYR-HAM-ZONING")
        self.assertEqual(zoning.catalog_row_ref, "C002")
        self.assertEqual(zoning.class_fields, ("ZONING_CODE",))
        self.assertIn("Q-015", zoning.quirks)
        self.assertIn("FeatureServer/1", zoning.endpoint)

    def test_get_config(self):
        self.assertIs(get_config("hamilton"), HAMILTON)
        with self.assertRaises(KeyError):
            get_config("welland")


class LabelTests(unittest.TestCase):
    def test_source_quoted_template(self):
        self.assertEqual(
            render_label("City class: {PRIMARY_LA}", {"PRIMARY_LA": "Vacant Lands"}),
            "City class: Vacant Lands",
        )
        self.assertEqual(
            render_label("City zoning: {ZONING_CODE}", {"ZONING_CODE": "M11"}),
            "City zoning: M11",
        )

    def test_missing_placeholder_stays_empty_not_invented(self):
        self.assertEqual(render_label("City zoning: {ZONING_CODE}", {}), "City zoning:")
        self.assertEqual(first_filled({}, ("ZONING_CODE",)), "")

    def test_sliver_rule_requires_both_caps(self):
        self.assertTrue(is_sliver(1.0, 0.001))
        self.assertFalse(is_sliver(10.0, 0.001))  # area too large
        self.assertFalse(is_sliver(1.0, 0.5))  # share too large


@skip_without_shapely()
class LinkerShareTests(unittest.TestCase):
    def setUp(self):
        from heavymap.overlays.io import load_overlay_layer
        from heavymap.overlays.models import ParcelGeom
        from shapely.geometry import Polygon

        self.load_overlay_layer = load_overlay_layer
        self.ParcelGeom = ParcelGeom
        self.Polygon = Polygon

    def _parcel(self, hid, x0, y0, x1, y1):
        geom = self.Polygon(box_coords(x0, y0, x1, y1))
        return self.ParcelGeom(heavymap_id=hid, geom=geom, area_m2=float(geom.area))

    def _layer(self, tmp, features, **kwargs):
        cfg = OverlayLayerConfig(
            layer_id="LYR-TEST",
            catalog_row_ref="",
            source_name="test",
            publisher="test",
            endpoint="https://example.invalid/test",
            default_rel="",
            id_fields=("OBJECTID",),
            class_fields=("CLASS",),
            label_fields=("CLASS",),
            label_template="City class: {CLASS}",
            band="land_use",
            **kwargs,
        )
        path = write_json(Path(tmp) / "ov.geojson", collection(features))
        feats, stats = self.load_overlay_layer(path, cfg)
        return feats, stats, cfg

    def test_half_overlap_shares(self):
        with tempfile.TemporaryDirectory() as tmp:
            feats, _stats, _cfg = self._layer(
                tmp,
                [feature(1, box_coords(0, 0, 10, 5), CLASS="A")],
            )
            rows = link_layer([self._parcel("hm:p1", 0, 0, 10, 10)], feats, "LYR-TEST")
        self.assertEqual(len(rows), 1)
        self.assertAlmostEqual(float(rows[0]["area_m2"]), 50.0, places=4)
        self.assertAlmostEqual(float(rows[0]["parcel_share"]), 0.5, places=6)
        self.assertAlmostEqual(float(rows[0]["feature_share"]), 1.0, places=6)
        self.assertEqual(rows[0]["class"], "A")
        self.assertEqual(rows[0]["quoted_label"], "City class: A")
        self.assertEqual(rows[0]["sliver"], "n")

    def test_sliver_flagged_not_dropped(self):
        with tempfile.TemporaryDirectory() as tmp:
            feats, _stats, _cfg = self._layer(
                tmp,
                [feature(1, box_coords(0, 0, 1, 1), CLASS="edge")],
            )
            rows = link_layer(
                [self._parcel("hm:p1", 0, 0, 100, 100)], feats, "LYR-TEST"
            )
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["sliver"], "y")
        self.assertLess(float(rows[0]["parcel_share"]), 0.01)
        self.assertLess(float(rows[0]["area_m2"]), 5.0)

    def test_strtree_pairs_two_parcels_to_the_right_features(self):
        with tempfile.TemporaryDirectory() as tmp:
            feats, _stats, _cfg = self._layer(
                tmp,
                [
                    feature(1, box_coords(0, 0, 10, 10), CLASS="left"),
                    feature(2, box_coords(50, 0, 60, 10), CLASS="right"),
                ],
            )
            rows = link_layer(
                [
                    self._parcel("hm:left", 1, 1, 2, 2),
                    self._parcel("hm:right", 51, 1, 52, 2),
                ],
                feats,
                "LYR-TEST",
            )
        by_id = {r["heavymap_id"]: r["class"] for r in rows}
        self.assertEqual(by_id, {"hm:left": "left", "hm:right": "right"})

    def test_multi_overlap_keeps_every_zone(self):
        with tempfile.TemporaryDirectory() as tmp:
            feats, _stats, _cfg = self._layer(
                tmp,
                [
                    feature(1, box_coords(0, 0, 6, 10), CLASS="M1"),
                    feature(2, box_coords(4, 0, 10, 10), CLASS="M2"),
                ],
            )
            rows = link_layer([self._parcel("hm:p1", 0, 0, 10, 10)], feats, "LYR-TEST")
        classes = sorted(r["class"] for r in rows)
        self.assertEqual(classes, ["M1", "M2"])
        self.assertEqual(len(rows), 2)

    def test_invalid_geometry_repaired_and_counted(self):
        bowtie = [
            [OX, OY],
            [OX + 10, OY + 10],
            [OX, OY + 10],
            [OX + 10, OY],
            [OX, OY],
        ]
        with tempfile.TemporaryDirectory() as tmp:
            feats, stats, _cfg = self._layer(
                tmp,
                [
                    {
                        "type": "Feature",
                        "properties": {"OBJECTID": 1, "CLASS": "fixed"},
                        "geometry": {"type": "Polygon", "coordinates": [bowtie]},
                    },
                    {
                        "type": "Feature",
                        "properties": {"OBJECTID": 2, "CLASS": "gone"},
                        "geometry": None,
                    },
                ],
            )
        self.assertEqual(stats.invalid_before, 1)
        self.assertEqual(stats.repaired, 1)
        self.assertEqual(stats.missing_geometry, 1)
        self.assertEqual(len(feats), 1)
        rows = link_layer([self._parcel("hm:p1", 0, 0, 10, 10)], feats, "LYR-TEST")
        self.assertEqual(len(rows), 1)
        self.assertGreater(float(rows[0]["area_m2"]), 0)

    def test_retired_plan_filter(self):
        filt = PropertyFilter(
            field="PLAN_NAME",
            exclude_values=("Retired Alpha", "Retired Beta"),
            todo=False,
        )
        with tempfile.TemporaryDirectory() as tmp:
            feats, stats, _cfg = self._layer(
                tmp,
                [
                    feature(1, box_coords(0, 0, 10, 10), CLASS="Live", PLAN_NAME="West Harbour"),
                    feature(2, box_coords(0, 0, 10, 10), CLASS="Old", PLAN_NAME="Retired Alpha"),
                ],
                feature_filter=filt,
            )
        self.assertEqual(stats.filtered_out, 1)
        self.assertEqual([f.class_value for f in feats], ["Live"])

    def test_todo_filter_is_a_noop(self):
        filt = PropertyFilter(field="TODO", exclude_values=(), todo=True)
        with tempfile.TemporaryDirectory() as tmp:
            feats, stats, _cfg = self._layer(
                tmp,
                [feature(1, box_coords(0, 0, 10, 10), CLASS="A", PLAN_NAME="Retired Alpha")],
                feature_filter=filt,
            )
        self.assertEqual(stats.filtered_out, 0)
        self.assertEqual(len(feats), 1)

    def test_lot_cut_polygons_are_not_dissolved(self):
        with tempfile.TemporaryDirectory() as tmp:
            feats, _stats, _cfg = self._layer(
                tmp,
                [
                    feature(1, box_coords(0, 0, 5, 10), CLASS="Mixed Use"),
                    feature(2, box_coords(5, 0, 10, 10), CLASS="Mixed Use"),
                ],
            )
            rows = link_layer([self._parcel("hm:p1", 0, 0, 10, 10)], feats, "LYR-TEST")
        self.assertEqual(len(rows), 2)
        self.assertEqual({r["feature_source_id"] for r in rows}, {"1", "2"})
        self.assertTrue(all(r["class"] == "Mixed Use" for r in rows))

    def test_screened_owner_field_is_not_copied_into_class(self):
        with tempfile.TemporaryDirectory() as tmp:
            feats, _stats, _cfg = self._layer(
                tmp,
                [
                    feature(
                        1,
                        box_coords(0, 0, 10, 10),
                        CLASS="M1",
                        Owner="MUST-NOT-BE-COPIED",
                    )
                ],
            )
        self.assertEqual(feats[0].class_value, "M1")
        rows = link_layer([self._parcel("hm:p1", 0, 0, 10, 10)], feats, "LYR-TEST")
        blob = json.dumps(rows)
        self.assertNotIn("MUST-NOT-BE-COPIED", blob)

    def test_lonlat_overlay_is_refused(self):
        cfg = OverlayLayerConfig(
            layer_id="LYR-TEST",
            catalog_row_ref="",
            source_name="test",
            publisher="test",
            endpoint="https://example.invalid/test",
            default_rel="",
            id_fields=("OBJECTID",),
            class_fields=("CLASS",),
            label_fields=("CLASS",),
            label_template="City class: {CLASS}",
            band="land_use",
        )
        payload = collection(
            [
                {
                    "type": "Feature",
                    "properties": {"OBJECTID": 1, "CLASS": "A"},
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [
                            [
                                [-80.05, 43.21],
                                [-79.95, 43.21],
                                [-79.95, 43.29],
                                [-80.05, 43.29],
                                [-80.05, 43.21],
                            ]
                        ],
                    },
                }
            ]
        )
        with tempfile.TemporaryDirectory() as tmp:
            path = write_json(Path(tmp) / "ll.geojson", payload)
            with self.assertRaises(OverlayError) as caught:
                self.load_overlay_layer(path, cfg)
            self.assertEqual(caught.exception.code, "input_not_projected")


@skip_without_shapely()
class PipelineCliTests(unittest.TestCase):
    def test_cli_writes_manifest_and_long_table(self):
        parcels = collection(
            [
                {
                    "type": "Feature",
                    "properties": {"heavymap_id": "hm:ca:on:hamilton:parcel:SYNTEST000000000000000001"},
                    "geometry": {"type": "Polygon", "coordinates": [box_coords(0, 0, 10, 10)]},
                }
            ]
        )
        zoning = collection(
            [
                feature(1, box_coords(0, 0, 10, 5), ZONING_CODE="M11", ZONING_DESC="Industrial"),
                feature(2, box_coords(0, 5, 10, 10), ZONING_CODE="M2"),
            ]
        )
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            parcels_path = write_json(tmp_path / "parcels.geojson", parcels)
            zoning_path = write_json(tmp_path / "zoning.geojson", zoning)
            out = tmp_path / "overlays"
            proc = subprocess.run(
                [
                    sys.executable,
                    "-m",
                    "heavymap.overlays",
                    "--parcels",
                    str(parcels_path),
                    "--overlay",
                    f"LYR-HAM-ZONING={zoning_path}",
                    "--layers",
                    "LYR-HAM-ZONING",
                    "--out-dir",
                    str(out),
                    "--run-id",
                    "test-run",
                    "--chunk-size",
                    "1",
                    "--print-manifest",
                ],
                cwd=str(ROOT),
                capture_output=True,
                text=True,
                check=False,
            )
            self.assertEqual(proc.returncode, 0, proc.stderr)
            dest = out / "runs" / "test-run"
            self.assertTrue((dest / "overlay_links.csv").is_file())
            self.assertTrue((dest / "MANIFEST.json").is_file())
            self.assertEqual((out / "CURRENT").read_text(encoding="utf-8").strip(), "test-run")
            text = (dest / "overlay_links.csv").read_text(encoding="utf-8")
            self.assertIn("heavymap_id", text)
            self.assertIn("M11", text)
            self.assertIn("M2", text)
            self.assertIn("City zoning:", text)
            self.assertNotIn("MUST-NOT", text)
            manifest = json.loads((dest / "MANIFEST.json").read_text(encoding="utf-8"))
            self.assertEqual(manifest["counts"]["link_rows"], 2)
            self.assertEqual(manifest["layers"][0]["status"], "ok")

    def test_chunk_size_does_not_change_row_set(self):
        from heavymap.overlays.config import HAMILTON as CFG
        from heavymap.overlays.pipeline import run_overlays

        parcels = collection(
            [
                {
                    "type": "Feature",
                    "properties": {"heavymap_id": f"hm:p{i}"},
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [box_coords(i * 20, 0, i * 20 + 10, 10)],
                    },
                }
                for i in range(5)
            ]
        )
        zoning = collection(
            [feature(1, box_coords(0, 0, 200, 10), ZONING_CODE="D")]
        )
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            parcels_path = write_json(tmp_path / "parcels.geojson", parcels)
            zoning_path = write_json(tmp_path / "zoning.geojson", zoning)
            rows = []
            for chunk, run in ((1, "c1"), (10, "c10")):
                manifest, dest = run_overlays(
                    config=CFG,
                    parcels_path=parcels_path,
                    overlay_paths={"LYR-HAM-ZONING": zoning_path},
                    out_dir=tmp_path / "out",
                    run_id=run,
                    layer_ids=["LYR-HAM-ZONING"],
                    chunk_size=chunk,
                )
                text = (dest / "overlay_links.csv").read_text(encoding="utf-8")
                body = tuple(sorted(line for line in text.splitlines()[1:] if line))
                rows.append((manifest["counts"]["link_rows"], body))
            self.assertEqual(rows[0][0], 5)
            self.assertEqual(rows[0], rows[1])


@skip_without_shapely()
class RealDataRegressionTests(unittest.TestCase):
    """Regressions from the 2026-10-17 deb validation (synthetic geometry only)."""

    def setUp(self):
        from heavymap.overlays.models import OverlayFeature, ParcelGeom
        from shapely.geometry import Point, Polygon

        self.OverlayFeature = OverlayFeature
        self.ParcelGeom = ParcelGeom
        self.Point = Point
        self.Polygon = Polygon

    def _parcel(self, hid, x0, y0, x1, y1):
        geom = self.Polygon(box_coords(x0, y0, x1, y1))
        return self.ParcelGeom(heavymap_id=hid, geom=geom, area_m2=float(geom.area))

    def _big_feature(self):
        # A 4,000-vertex disc stands in for a city-sized Greenbelt polygon.
        geom = self.Point(OX + 500, OY + 500).buffer(400, quad_segs=1000)
        return self.OverlayFeature(source_id="big", geom=geom, area_m2=float(geom.area), class_value="GB", quoted_label="GB")

    def _parcels(self):
        out = []
        for i in range(0, 1000, 40):
            for j in range(0, 1000, 40):
                out.append(self._parcel(f"hm:{i}:{j}", i, j, i + 35, j + 35))
        return out

    def test_subdivided_areas_equal_whole_feature_areas(self):
        from heavymap.overlays.linker import link_pairs

        feat = self._big_feature()
        parcels = self._parcels()
        whole = list(link_pairs(parcels, [feat], "LYR-TEST", max_piece_vertices=10**9))
        split = list(link_pairs(parcels, [feat], "LYR-TEST", max_piece_vertices=16))
        self.assertGreater(len(whole), 300)
        self.assertEqual([r["heavymap_id"] for r in whole], [r["heavymap_id"] for r in split])
        for a, b in zip(whole, split):
            self.assertAlmostEqual(float(a["area_m2"]), float(b["area_m2"]), places=4)
            self.assertEqual(a["sliver"], b["sliver"])
        self.assertEqual(len({r["feature_source_id"] for r in split}), 1)

    def test_index_built_once_per_layer_and_pieces_reported(self):
        from heavymap.overlays.linker import link_chunks

        feat = self._big_feature()
        parcels = self._parcels()
        rows = []
        counts = link_chunks([parcels[:300], parcels[300:]], [feat], "LYR-TEST", rows.append, max_piece_vertices=64)
        self.assertGreater(counts["overlay_pieces"], 1)
        self.assertEqual(counts["link_rows"], len(rows))
        self.assertEqual(counts["parcels_seen"], len(parcels))

    def test_contained_parcel_gets_full_area(self):
        from heavymap.overlays.linker import link_pairs

        rows = list(link_pairs([self._parcel("hm:in", 480, 480, 520, 520)], [self._big_feature()], "LYR-TEST"))
        self.assertEqual(len(rows), 1)
        self.assertAlmostEqual(float(rows[0]["parcel_share"]), 1.0, places=9)

    def test_constant_field_is_not_used_as_class(self):
        from heavymap.overlays.io import load_overlay_layer

        hca = HAMILTON.layer("LYR-HCA-REGULATED-AREAS")
        with tempfile.TemporaryDirectory() as tmp:
            fc = collection([
                {"type": "Feature", "properties": {"OID": 7, "Version": 0},
                 "geometry": {"type": "Polygon", "coordinates": [box_coords(0, 0, 10, 10)]}},
            ])
            path = write_json(Path(tmp) / "hca.geojson", fc)
            feats, _stats = load_overlay_layer(path, hca)
        self.assertEqual(feats[0].class_value, "regulated")
        self.assertEqual(feats[0].source_id, "7")

    def test_retired_secondary_plans_filtered_by_config(self):
        from heavymap.overlays.io import load_overlay_layer

        cfg = HAMILTON.layer("LYR-HAM-SECONDARY-PLAN-LAND-USE")
        with tempfile.TemporaryDirectory() as tmp:
            fc = collection([
                feature(1, box_coords(0, 0, 10, 10), SEC_PLAN_NAME="Retired - Greensville", LANDUSE_CLASS="Residential"),
                feature(2, box_coords(0, 0, 10, 10), SEC_PLAN_NAME="Binbrook Village", LANDUSE_CLASS="Residential"),
            ])
            path = write_json(Path(tmp) / "spl.geojson", fc)
            feats, stats = load_overlay_layer(path, cfg)
        self.assertEqual(stats.filtered_out, 1)
        self.assertEqual([f.source_id for f in feats], ["2"])
        self.assertEqual(feats[0].class_value, "Residential")
        self.assertEqual(feats[0].quoted_label, "Secondary plan (Binbrook Village): Residential")


if __name__ == "__main__":
    unittest.main()
