"""Budgets, forbidden names and per-output allowlists for increment 1.

Size fail levels are the accepted Hamilton budgets (BETA-GATE-HAMILTON.md §6).
Warn levels are 80% of fail. Adding an emitted field means editing the
allowlist here, in review.
"""

from __future__ import annotations

from heavymap.dossier.schema import FORBIDDEN_KEY_PARTS, spec_keys

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
    "pmtiles_bytes": {"warn": 83_886_080, "fail": 104_857_600},
    "total_bytes": {"warn": 858_993_459, "fail": 1_073_741_824},
}

STARTUP_NAMES = frozenset({"manifest.json", "startup.json", "index.json"})

DOSSIER_SHARD_ENVELOPE = frozenset({"schema", "jurisdiction", "shard", "records"})

DOSSIER_RECORD_KEYS = frozenset(spec_keys())

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
        "max_addresses_shown",
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
        "confidence_words",
        "fields_unavailable",
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
    "parcels": frozenset(
        {"heavymap_id", "arn_grade", "area_m2", "arn_count", "arn", "arn_all"}
    ),
    "buildings": frozenset(
        {"heavymap_id", "area_m2", "parcel_heavymap_id", "name"}
    ),
    "nature-parks": frozenset({"name", "park_class", "type"}),
    "nature-greenbelt": frozenset({"designation"}),
    "nature-conservation": frozenset({"authority"}),
}

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

TEXT_SUFFIXES = frozenset(
    {".json", ".ndjson", ".csv", ".txt", ".md", ".geojson", ".html"}
)
