"""Budgets, forbidden names and per-output allowlists for increment 1.

Size fail levels are the accepted Hamilton budgets (BETA-GATE-HAMILTON.md §6).
Warn levels are 80% of fail. Adding an emitted field means editing the
allowlist here, in review.
"""

from __future__ import annotations

from industrial_atlas.dossier.schema import DETAIL_SPEC, FORBIDDEN_KEY_PARTS, spec_keys

# Exact field names that must never appear as keys or CSV headers.
# Building and park ``name`` is a public feature label, not an owner field.
FORBIDDEN_FIELD_NAMES = frozenset(
    {
        "Owner",
        "OWNER",
        "Legal_Txt",
        "LEGAL_TXT",
        "PostalCode",
        "MAILING_ADDR",
        "MAILING_ADDRESS",
        "OwnerMail",
        "owner_name",
        "owner_mailing",
        "Creator",
        "Editor",
    }
)

# Dossier output keys still refuse these substrings (schema.audit_spec).
DOSSIER_FORBIDDEN_KEY_PARTS = FORBIDDEN_KEY_PARTS

# Accepted fail levels. Warn at 80%.
SIZE_BUDGETS = {
    "startup_compressed_bytes": {"warn": 40_960, "fail": 51_200},
    "shard_compressed_bytes": {"warn": 40_960, "fail": 51_200},
    "detail_compressed_bytes": {"warn": 40_960, "fail": 51_200},
    "pmtiles_bytes": {"warn": 83_886_080, "fail": 104_857_600},
    "total_bytes": {"warn": 858_993_459, "fail": 1_073_741_824},
}

STARTUP_NAMES = frozenset({"manifest.json", "startup.json", "index.json"})

DOSSIER_SHARD_ENVELOPE = frozenset({"schema", "jurisdiction", "shard", "records"})

DOSSIER_RECORD_KEYS = frozenset(spec_keys())

# Schema 2 side files (contract: seam-contract-dossier.md). Detail records are
# screened like core records; the other files are checked by their top-level keys.
DOSSIER_DETAIL_KEYS = frozenset(spec_keys(DETAIL_SPEC))
DOSSIER_FILES_KEYS = frozenset({"schema", "files"})
DOSSIER_PROVENANCE_KEYS = frozenset(
    {"schema", "sources", "layer_aliases", "fields_unavailable", "not_yet_captured"}
)
DOSSIER_LABEL_SEED_KEYS = frozenset({"schema", "confidence_words"})

DOSSIER_MANIFEST_KEYS = frozenset(
    {
        "schema",
        "jurisdiction",
        "shard_key",
        "rule",
        "path",
        "alphabet",
        "count",
        "counts",
        "coverage",
        "coverage_note",
        "sizes_bytes",
        "total",
        "min",
        "median",
        "max",
        "core_addresses",
        "contract_revisions",
        "release",
        "files_sha256",
        "file_count",
        "detail_path",
        "detail_total",
        "sliver_rule",
        "sliver_policy",
        "layer_aliases",
        "sources",
        "title",
        "publisher",
        "endpoint",
        "role",
        "band",
        "catalog_row_ref",
        "former_layer_id",
        "property_code_families",
        "from",
        "to",
        "family",
        "gaps_ledger",
        "gap_id",
        "gap_type",
        "field",
        "notes",
        "publish_priority",
        "gap_counts",
        "screening",
        "inputs",
        "registry_run",
        "overlay_run",
        "stats",
        "generated_at",
        "code_commit",
        "run_id",
    }
)

TILE_PROPERTY_KEYS = {
    # CN-03: only the schema 2 record key is carried by parcel features.
    "parcels": frozenset({"key"}),
    "buildings": frozenset(
        {"ia_id", "area_m2", "parcel_ia_id", "name"}
    ),
    "nature-parks": frozenset({"name", "park_class", "type"}),
    "nature-greenbelt": frozenset({"designation"}),
    "nature-conservation": frozenset({"authority"}),
}

TILES_MANIFEST_KEYS = frozenset(
    {
        "schema_version", "min_zoom", "max_zoom", "bounds", "tile_format",
        "generated_at", "source_refs", "sha256", "bytes", "tile_layer",
        "registry_run", "feature_count", "tool", "processing",
    }
)

LAYER_CATALOGUE_KEYS = frozenset(
    {
        "schema_version", "layers", "id", "role", "geometry", "source",
        "default_visible", "tile_layer", "coverage", "state", "order",
    }
)

RUN_RECORD_KEYS = frozenset(
    {
        "run_id",
        "run_kind",
        "jurisdiction",
        "code_commit",
        "dirty_tree",
        "metrics",
        "outputs",
        "path",
        "sha256",
        "ids",
        "heavymap_ids",
        "comparison",
        "outcome",
        "explained",
    }
)

# Hamilton monthly permit viewer package. Names are intentionally a public
# source-reported field on the user's approved industrial/commercial/logistics/
# multi-unit profile; contact addresses and description fields are excluded.
DEVELOPMENT_RELEASE_MANIFEST_KEYS = frozenset(
    {
        "schema_version", "jurisdiction", "record_count", "focus_record_count",
        "linked_record_count", "unique_parcel_count", "outputs",
        "viewer_development_records_v0.1.json",
        "parcel_development_indicators_v0.1.json",
        "city_development_snapshot_v0.1.json",
    }
)
DEVELOPMENT_RECORD_KEYS = frozenset(
    {
        "schema_version", "jurisdiction", "record_count", "records",
        "development_record_id", "permit_number", "report_month", "site_location",
        "source_reported_building_type", "source_reported_work_type",
        "source_reported_names", "owner", "builder", "label", "derived_sector_tags",
        "derived_action_tags", "taxonomy_version", "classification_status",
        "display_profile", "activity_basis", "construction_value", "building_gfa",
        "parcel_ids", "source_evidence_ref", "source_page", "source_record_id",
    }
)
DEVELOPMENT_INDICATOR_KEYS = frozenset(
    {
        "schema_version", "jurisdiction", "relationship", "linked_record_count",
        "unique_parcel_count", "unresolved_records", "address_only_matches",
        "excluded_from_parcel_indicators", "parcels", "development_record_count",
        "development_record_ids",
    }
)
DEVELOPMENT_SNAPSHOT_KEYS = frozenset(
    {
        "aggregate_reports_matching", "aggregate_reports_with_mismatch", "categories",
        "category_counts_overlap", "category_measures_overlap", "category_totals",
        "citywide", "citywide_totals", "commercial", "coverage", "current_status",
        "first_report_month", "industrial", "interpretation", "jurisdiction",
        "known_source_reconciliation", "last_report_month", "light_industrial",
        "logistics", "monthly", "monthly_report_count", "multi_unit_residential",
        "observed_building_gfa_unparsed", "observed_construction_value_unparsed",
        "open_issue", "permit_record_count", "permits_with_measured_building_gfa",
        "permits_with_reported_construction_value", "record_grain", "report_month",
        "reported_building_gfa_m2_sum", "reported_construction_value_cad_sum",
        "reports_without_aggregate_summary", "residential", "residential_all",
        "schema_version", "snapshot_status", "taxonomy_version",
        "unique_citywide_permit_count_is_separate", "unique_permits", "value_and_gfa",
        "without_reviewed_sector_tag",
    }
)

TEXT_SUFFIXES = frozenset(
    {".json", ".ndjson", ".csv", ".txt", ".md", ".geojson", ".html"}
)
