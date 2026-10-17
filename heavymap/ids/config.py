"""Per-source geometric corrections and Hamilton registry defaults.

The NPCA translation is the 2026-10-17 full-population median
(City minus NPCA: dx +0.297 m, dy -0.939 m) recorded as Q-004 / NA-276.
It is applied in EPSG:26917 before matching. City fabric is the reference.
"""

from __future__ import annotations

from dataclasses import dataclass, field


SCREENED_FIELD_TOKENS = frozenset(
    {
        "owner",
        "ownernme1",
        "owner_name",
        "ownername",
        "primary_owner",
        "add_owner",
        "pstladdress",
        "mail_address",
        "mailaddr",
        "legal_txt",
        "legaltxt",
        "legal_description",
        "legaldesc",
    }
)


def is_screened_field(name: str) -> bool:
    """True when a source property must never be copied into the registry."""

    token = name.strip().lower().replace(" ", "_")
    if token in SCREENED_FIELD_TOKENS:
        return True
    if "owner" in token:
        return True
    return False


@dataclass(frozen=True)
class SourceCorrection:
    source_name: str
    layer_id: str
    dx_m: float
    dy_m: float
    note: str = ""


@dataclass(frozen=True)
class RegistryConfig:
    country: str
    region: str
    jurisdiction: str
    working_crs: str
    address_nearest_m: float = 10.0
    coverage_buffer_m: float = 5.0
    exact_iou: float = 0.9
    repull_iou: float = 0.9
    expected_arn_prefix: str = "2518"
    grid_cell_m: float = 100.0
    default_registry_dir: str = "local-data/heavymap-registry/hamilton"
    corrections: dict[str, SourceCorrection] = field(default_factory=dict)

    @property
    def place(self) -> tuple[str, str, str]:
        return (self.country, self.region, self.jurisdiction)

    def correction_for(self, source_name: str) -> SourceCorrection | None:
        return self.corrections.get(source_name)


HAMILTON = RegistryConfig(
    country="ca",
    region="on",
    jurisdiction="hamilton",
    working_crs="EPSG:26917",
    corrections={
        "city_parcels": SourceCorrection(
            source_name="city_parcels",
            layer_id="LYR-HAM-PARCEL",
            dx_m=0.0,
            dy_m=0.0,
            note="Reference fabric. No shift.",
        ),
        "npca_assessment_parcels_test": SourceCorrection(
            source_name="npca_assessment_parcels_test",
            layer_id="LYR-NPCA-ASSESSMENT-PARCELS-TEST",
            dx_m=0.297,
            dy_m=-0.939,
            note="Q-004 / NA-276. Apply before every match.",
        ),
        "npca_parcels_cityview": SourceCorrection(
            source_name="npca_parcels_cityview",
            layer_id="LYR-NPCA-PARCELS-CITYVIEW",
            dx_m=0.297,
            dy_m=-0.939,
            note="Same hosted offset as Assessment_Parcels_Test. Owner field not used.",
        ),
    },
)

CONFIGS = {"hamilton": HAMILTON}


def get_config(name: str) -> RegistryConfig:
    try:
        return CONFIGS[name]
    except KeyError as exc:
        raise KeyError(f"unknown_registry_config:{name}") from exc
