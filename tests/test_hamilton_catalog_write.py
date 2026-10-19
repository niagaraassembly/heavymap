"""Hamilton A01-A27 catalog and inventory write. No network, no owner values."""

import csv
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT / "scripts") not in sys.path:
    sys.path.insert(0, str(ROOT / "scripts"))

from xlsx_sheets import read_workbook  # noqa: E402
COUNTIES = ROOT / "Spreadsheets" / "09-per-jurisdiction-dataset-catalog-counties.csv"
CC = ROOT / "Spreadsheets" / "09-per-jurisdiction-dataset-catalog-cross-cutting.csv"
INV = ROOT / "Spreadsheets" / "02-dataset-inventory-v4.csv"

NEW_INV = {
    "hamilton_existing_land_use",
    "hamilton_zoning_ped_legacy",
    "hamilton_parks",
    "hamilton_trails",
    "hamilton_wetlands",
    "hamilton_conservation_authority_areas",
    "hamilton_subwatersheds",
    "grca_regulation_limits_waterloo_copy",
    "conservation_halton_regulation_limit",
    "lio_greenbelt_outer_boundary",
    "lio_natural_heritage_system",
    "lio_greenbelt_specialty_crop",
    "lio_greenbelt_towns_villages",
    "lio_greenbelt_hamlets",
    "lio_nep_area_boundary",
    "lio_nep_policy_areas",
    "lio_nep_minor_urban_centres",
    "lio_wetlands",
    "lio_ansi",
    "lio_wooded_areas",
    "lio_provincial_parks",
    "lio_conservation_authority_admin",
    "lio_municipal_boundary",
    "lio_ontario_trails_network",
    "hca_trails",
}
UPDATED_INV = {"npca_assessment_parcels", "npca_regulation_lands"}


def _rows(path: Path):
    with path.open(encoding="utf-8", newline="") as fh:
        return list(csv.DictReader(fh))


class HamiltonCatalogWriteTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.counties = _rows(COUNTIES)
        cls.cc = _rows(CC)
        cls.inv = _rows(INV)

    def test_inventory_has_new_and_updated_ids(self):
        ids = {row["dataset_id"] for row in self.inv}
        self.assertTrue(NEW_INV.issubset(ids), NEW_INV - ids)
        self.assertTrue(UPDATED_INV.issubset(ids))

    def test_conservation_halton_is_named_gap(self):
        row = next(r for r in self.inv if r["dataset_id"] == "conservation_halton_regulation_limit")
        self.assertEqual(row["status_in_product"], "not_found")
        self.assertIn("named gap", row["notes"])
        self.assertEqual(row["evidence_grade"], "inferred")

    def test_grca_waterloo_copy_is_trial_pull(self):
        row = next(r for r in self.inv if r["dataset_id"] == "grca_regulation_limits_waterloo_copy")
        self.assertIn("trial-pulled", row["notes"])
        self.assertIn("utility.arcgis.com", row["source_url"])

    def test_parks_trails_readmitted(self):
        parks = [
            r
            for r in self.counties
            if r["jurisdiction_id"] == "hamilton" and r["dataset_name"] == "Parks"
        ]
        trails = [
            r
            for r in self.counties
            if r["jurisdiction_id"] == "hamilton" and r["dataset_name"] == "Trails"
        ]
        self.assertEqual(len(parks), 1)
        self.assertEqual(parks[0]["review_status"], "admitted_in_mcs")
        self.assertEqual(parks[0]["mcs_dataset_id"], "hamilton_parks")
        self.assertEqual(trails[0]["review_status"], "admitted_in_mcs")

    def test_hca_trails_readmitted(self):
        row = next(r for r in self.cc if r["dataset_id"] == "hca_trails")
        self.assertEqual(row["review_status"], "admitted_in_mcs")

    def test_no_owner_values_or_local_fast_paths(self):
        blob = "\n".join(
            "|".join(row.values())
            for table in (self.counties, self.cc, self.inv)
            for row in table
            if row.get("dataset_id") in NEW_INV | UPDATED_INV
            or row.get("mcs_dataset_id") in NEW_INV
        )
        self.assertNotIn("/fast/code", blob)
        self.assertNotIn("OWNER_VALUE", blob)

    def test_npca_assessment_allowed_by_rule(self):
        row = next(r for r in self.inv if r["dataset_id"] == "npca_assessment_parcels")
        self.assertNotEqual(row["status_in_product"], "blocked")
        self.assertIn("HARD-RULES 4/5", row["notes"])
        self.assertNotIn("not ingested", row["notes"])

    def test_catalog_has_all_hamilton_write_ids(self):
        county_ids = {row["mcs_dataset_id"] for row in self.counties}
        cc_ids = {row["dataset_id"] for row in self.cc}
        catalog_ids = county_ids | cc_ids
        self.assertTrue(NEW_INV.issubset(catalog_ids), NEW_INV - catalog_ids)
        self.assertTrue(UPDATED_INV.issubset(catalog_ids), UPDATED_INV - catalog_ids)

    def test_inventory_publish_visibility_default_public(self):
        self.assertIn("publish_visibility", self.inv[0])
        values = {row["publish_visibility"] for row in self.inv}
        self.assertEqual(values, {"public"})

    def test_inventory_column_width_matches_header(self):
        with INV.open(encoding="utf-8", newline="") as fh:
            rows = list(csv.reader(fh))
        width = len(rows[0])
        self.assertGreater(width, 40)
        bad = [i + 1 for i, row in enumerate(rows) if len(row) != width]
        self.assertEqual(bad, [], f"inventory rows with wrong width: {bad[:10]}")

    def test_new_inventory_rows_use_na_not_nia(self):
        for row in self.inv:
            if row["dataset_id"] in NEW_INV | UPDATED_INV:
                blob = "|".join(row.values())
                self.assertNotIn("NIA-", blob, row["dataset_id"])

    def test_generated_workbooks_contain_new_ids(self):
        catalog = read_workbook(ROOT / "Spreadsheets" / "09-per-jurisdiction-dataset-catalog.xlsx")
        inventory = read_workbook(ROOT / "Spreadsheets" / "02-dataset-inventory-v4.xlsx")
        self.assertEqual(
            set(catalog),
            {"README", "Counties", "Municipalities", "Cross-Cutting Regional"},
        )
        self.assertEqual(set(inventory), {"Inventory", "README"})
        catalog_blob = "\n".join(
            "|".join(row) for sheet in catalog.values() for row in sheet
        )
        inv_blob = "\n".join("|".join(row) for row in inventory["Inventory"])
        for dataset_id in NEW_INV | UPDATED_INV:
            self.assertIn(dataset_id, catalog_blob, dataset_id)
            self.assertIn(dataset_id, inv_blob, dataset_id)
        self.assertIn("not_found", inv_blob)
        self.assertIn("Vacant Lands", catalog_blob)
        self.assertIn("source class", catalog_blob.lower())


if __name__ == "__main__":
    unittest.main()
