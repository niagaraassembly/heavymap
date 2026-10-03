"""`hm demo DIR`: create a sandbox repo root with SYNTHETIC rows so the review UI can be tried.

Nothing here is real data. Identifiers come from docs/architecture/rochester-parcel-local-token.md's
synthetic fixture; endpoints use the reserved .invalid TLD.
"""

import shutil
from pathlib import Path

from . import csvio
from .schema import Schema

SBL20 = "04799000010010000000"


def _row(columns, **kw):
    return {c: kw.get(c, "") for c in columns}


def build(src_root, dest):
    dest = Path(dest)
    for rel in ("data/schema/table-schema.json", "data/schema/controlled-values.json"):
        (dest / rel).parent.mkdir(parents=True, exist_ok=True)
        shutil.copy(Path(src_root) / rel, dest / rel)
    (dest / ".gitignore").write_text("/local-data/\n/build/\n", encoding="utf-8")
    s = Schema(dest)
    for name, t in s.tables.items():
        csvio.write_csv(s.path(name), t.columns, [])

    def put(table, **kw):
        t = s.tables[table]
        header, rows = csvio.read_csv(s.path(table)) if s.path(table).exists() else (t.columns, [])
        rows = csvio.clean_rows(rows)
        rows.append(_row(t.columns, **kw))
        csvio.write_csv(s.path(table), t.columns, rows)

    L = "NIA-999"
    put("services", service_id="svc-syn-example", publisher="Example County GIS (synthetic)", jurisdiction="syn-example",
        base_url="https://gis.example.invalid/arcgis/rest/services", access_method="arcgis_rest", auth_required="no",
        paging_limit="1000", default_crs_epsg="26918", profile_status="profiled", last_checked="2026-10-01", run_id="RUN-demo-1", linear_id=L,
        notes="SYNTHETIC demo row")
    put("services", service_id="svc-syn-mpac", publisher="MPAC (synthetic denied publisher)", jurisdiction="syn-example",
        base_url="https://mpac.example.invalid/rest", access_method="api", auth_required="yes", linear_id=L, notes="SYNTHETIC: shows the MPAC deny rule")
    put("layers", layer_id="lyr-syn-example-parcels-0", service_id="svc-syn-example", layer_name="Parcels (synthetic)",
        endpoint="https://gis.example.invalid/arcgis/rest/services/Parcels/MapServer/0", lifecycle_status="profiled",
        status_changed_date="2026-10-01", record_count="1200", distinct_id_count="1200", geometry_type="polygon", grain="parcel",
        id_field="SBL", id_type="text", id_length="20", id_charset="digits", id_null_count="0", id_dup_count="0",
        id_pattern_examples=SBL20, crs_epsg="26918", pii_owner_fields_names_only="OWNERNME1 | PSTLADDRESS", join_keys_to_spine="SBL",
        run_id="RUN-demo-1", evidence_urls="https://gis.example.invalid/arcgis/rest/services/Parcels/MapServer/0", linear_id=L,
        notes="SYNTHETIC demo layer")
    put("layers", layer_id="lyr-syn-mpac-roll-0", service_id="svc-syn-mpac", layer_name="Roll (synthetic)",
        endpoint="https://mpac.example.invalid/rest/roll/0", lifecycle_status="not_used", status_changed_date="2026-10-01", linear_id=L,
        notes="SYNTHETIC: MPAC is not_licensed")
    for i, (n, role, flag) in enumerate([("SBL", "id", "no"), ("OWNERNME1", "owner", "yes"), ("PSTLADDRESS", "owner", "yes"), ("Shape", "geometry", "no")], 1):
        put("fields", field_id=f"FLD-syn-example-parcels-0-{i}", layer_id="lyr-syn-example-parcels-0", field_name=n, role=role, owner_flag=flag, linear_id=L)
    put("identifier_rules", rule_id="IDR-syn-example-parcels-0-sbl", layer_id="lyr-syn-example-parcels-0", id_field="SBL", id_kind="sbl20",
        pattern="^[0-9]{13}[0-9A-Z]{7}$", length="20", float_trap="yes", normaliser="heavymap.ny_identifiers.validate_sbl20",
        is_join_key="yes", status="proposed", linear_id=L)
    put("quirks", quirk_id="Q-syn-parcels-01", layer_id="lyr-syn-example-parcels-0", field="SBL", quirk_type="float_stored_id",
        count="3", example_id=SBL20, impact="leading zeros lost when stored as number", handling="read as text | refuse float input",
        status="open", found_date="2026-10-01", run_id="RUN-demo-1", linear_id=L)
    put("quirks", quirk_id="Q-syn-parcels-02", layer_id="lyr-syn-example-parcels-0", field="Comment", quirk_type="free_text_risk",
        count="12", impact="may hold personal data", handling="never sample", status="open", found_date="2026-10-01", linear_id=L)
    put("join_tests", join_id="JT-syn-parcels-sbl-identifier-20261001", layer_id="lyr-syn-example-parcels-0",
        spine_key="hm:us:ny:syn:parcel:{sbl20}", method="identifier", population="sample", hits="29", tested="30",
        failure_id_samples="04799000010010000009", test_date="2026-10-01", run_id="RUN-demo-1", linear_id=L)
    put("use_decisions", layer_id="lyr-syn-example-parcels-0", use_decision="needs_more", licence_status="unknown", risks="licence text not found",
        linear_id=L)
    put("scores", score_id="SCR-syn-parcels-v1.0", layer_id="lyr-syn-example-parcels-0", formula_version="1.0", c_joinability="3",
        c_coverage="2", c_grain="3", c_freshness="2", c_openness="1", c_quality="2", c_uniqueness="2", c_effort="3",
        total="75", computed_at="2026-10-01", basis="demo components", linear_id=L)
    put("claims", claim_id="CLM-syn-parcels-recordcount", layer_id="lyr-syn-example-parcels-0", fact="record_count=1200",
        value_summary="server returnCountOnly 1200", source_url="https://gis.example.invalid/arcgis/rest/services/Parcels/MapServer/0",
        access_date="2026-10-01", evidence_label="live_read", locator="returnCountOnly", linear_id=L)
    put("candidates", cand_id="CAND-9f3a17c2", endpoint="https://gis.example.invalid/arcgis/rest/services/Zoning/MapServer/0",
        publisher="Example County GIS (synthetic)", jurisdiction="syn-example", family="zoning", layer_name_hint="Zoning (synthetic)",
        source_url="https://gis.example.invalid/arcgis/rest/services", access_date="2026-10-01", discovered_via="demo", run_id="RUN-demo-1",
        status="new", linear_id=L)
    put("scan_runs", run_id="RUN-scan-20261001-0900-syn", kind="scan", trigger="manual", jurisdiction="syn-example", agent="demo",
        workflow_version="1.0", services_probed="2", candidates_added="1", status="ok", linear_id=L)
    return s
