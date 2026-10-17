"""Overlay layer configs. Hamilton first. Linear NA-24 / NA-27 / NA-270.

Field names and endpoints come from Spreadsheets/09 catalog,
Spreadsheets/17-layer-profile.csv, and
heavymap-planning/focus/hamilton/hamilton-dataset-groupings.csv.
Unknown names stay ``TODO`` (HARD-RULES 8). Nothing here is published.
"""

from __future__ import annotations

from dataclasses import dataclass

from heavymap.ids.config import HAMILTON as HAMILTON_REGISTRY

WORKING_CRS = HAMILTON_REGISTRY.working_crs  # EPSG:26917

# Context Band Ladder tokens (docs/architecture/context-band-ladder.md).
BAND_LAND_USE = "land_use"
BAND_CONSTRAINTS = "constraints"

DEFAULT_SLIVER_PARCEL_SHARE = 0.01  # 1%
DEFAULT_SLIVER_AREA_M2 = 5.0
DEFAULT_CHUNK_SIZE = 2500
DEFAULT_OVERLAY_DIR = "local-data/heavymap-overlays/hamilton"


@dataclass(frozen=True)
class PropertyFilter:
    """Drop overlay features whose field value is in ``exclude_values``.

    Secondary Plan Land Use still has four retired plans on the service
    (PI-0003). The four names were not recorded in catalog 09 or
    17-layer-profile, so ``todo`` stays True until a live REST read fills
    ``exclude_values``.
    """

    field: str
    exclude_values: tuple[str, ...] = ()
    todo: bool = False
    todo_note: str = ""


@dataclass(frozen=True)
class OverlayLayerConfig:
    """Generic per-layer overlay config."""

    layer_id: str
    catalog_row_ref: str
    source_name: str
    publisher: str
    endpoint: str
    default_rel: str
    id_fields: tuple[str, ...]
    class_fields: tuple[str, ...]
    label_fields: tuple[str, ...]
    label_template: str
    band: str
    working_crs: str = WORKING_CRS
    native_crs_note: str = ""
    constant_class: str = ""
    feature_filter: PropertyFilter | None = None
    todo_fields: tuple[str, ...] = ()
    notes: str = ""
    mcs_dataset_id: str = ""
    quirks: tuple[str, ...] = ()

    @property
    def endpoint_todo(self) -> bool:
        return not self.endpoint or self.endpoint.startswith("TODO")


@dataclass(frozen=True)
class OverlayRunConfig:
    name: str
    working_crs: str
    layers: tuple[OverlayLayerConfig, ...]
    sliver_parcel_share: float = DEFAULT_SLIVER_PARCEL_SHARE
    sliver_area_m2: float = DEFAULT_SLIVER_AREA_M2
    chunk_size: int = DEFAULT_CHUNK_SIZE
    default_overlay_dir: str = DEFAULT_OVERLAY_DIR
    default_registry_dir: str = HAMILTON_REGISTRY.default_registry_dir

    def layer(self, layer_id: str) -> OverlayLayerConfig:
        for item in self.layers:
            if item.layer_id == layer_id:
                return item
        raise KeyError(f"unknown_overlay_layer:{layer_id}")


# --- Hamilton layers -------------------------------------------------------
# Store every intersecting zone / designation with its area share (Morgen,
# provisional). Do not simplify to a dominant class in this table. The
# dossier explains overlaps (NA-27). Greenbelt, NEP designation and NEP
# Development Control Area are firm plan-overlay joins (DECISIONS.md).

HAMILTON_LAYERS: tuple[OverlayLayerConfig, ...] = (
    OverlayLayerConfig(
        layer_id="LYR-HAM-ZONING",
        catalog_row_ref="C002",
        source_name="city_zoning",
        publisher="City of Hamilton",
        endpoint=(
            "https://services.arcgis.com/rYz782eMbySr2srL/arcgis/rest/services/"
            "Zoning_By_law_Boundary/FeatureServer/1"
        ),
        default_rel=(
            "hamilton-city/zoning-bylaw-boundary-hamilton-2026-10-17/"
            "zoning-26917.geojson"
        ),
        id_fields=("GlobalID", "OBJECTID"),
        class_fields=("ZONING_CODE",),
        label_fields=("ZONING_CODE", "ZONING_DESC"),
        label_template="City zoning: {ZONING_CODE}",
        band=BAND_LAND_USE,
        native_crs_note="Hosted EPSG:3857; analyse in EPSG:26917 (Q-003).",
        notes=(
            "17-layer-profile LYR-HAM-ZONING. Q-015: 72 invalid and 31 missing "
            "geometries. Store every intersecting zone (provisional). "
            "EXCEPTION1-3 / HOLDING1-3 are site modifiers, not a second class."
        ),
        mcs_dataset_id="hamilton_zoning_boundary",
        quirks=("Q-015", "Q-003"),
    ),
    OverlayLayerConfig(
        layer_id="LYR-LIO-GREENBELT-DESIGNATION",
        catalog_row_ref="C363",
        source_name="lio_greenbelt_designation",
        publisher="Ontario MNR (LIO)",
        endpoint=(
            "https://ws.lioservices.lrc.gov.on.ca/arcgis2/rest/services/"
            "LIO_OPEN_DATA/LIO_Open06/MapServer/15"
        ),
        default_rel="lio/greenbelt-designation-hamilton/designation-26917.geojson",
        id_fields=("OGF_ID", "OBJECTID"),
        class_fields=("DESIGNATION",),
        label_fields=("DESIGNATION",),
        label_template="Greenbelt designation: {DESIGNATION}",
        band=BAND_LAND_USE,
        native_crs_note="LIO; reproject to EPSG:26917 before linking.",
        notes=(
            "URL and DESIGNATION from groupings C363 (live REST 2026-10-17). "
            "No 17-layer-profile row. Catalog 09 has the outer boundary "
            "(Open06/17) but not this designation layer. Firm join with area "
            "share (DECISIONS.md plan overlays)."
        ),
        mcs_dataset_id="",
        todo_fields=("TODO MCS dataset_id — designation layer not on MCS",),
    ),
    OverlayLayerConfig(
        layer_id="LYR-LIO-NEP-DESIGNATION",
        catalog_row_ref="C364",
        source_name="lio_nep_designation",
        publisher="Ontario MNR (LIO) / NEC",
        endpoint=(
            "https://ws.lioservices.lrc.gov.on.ca/arcgis2/rest/services/"
            "LIO_OPEN_DATA/LIO_Open06/MapServer/26"
        ),
        default_rel="lio/nep-designation-hamilton/designation-26917.geojson",
        id_fields=("OGF_ID", "OBJECTID"),
        class_fields=("DESIGNATION",),
        label_fields=("DESIGNATION",),
        label_template="NEP designation: {DESIGNATION}",
        band=BAND_LAND_USE,
        native_crs_note="LIO; reproject to EPSG:26917 before linking.",
        notes=(
            "URL and DESIGNATION from groupings C364 (LIO Open06/26). "
            "Boundary is Open06/25 (A17). No 17-layer-profile row. Firm join "
            "with area share."
        ),
        mcs_dataset_id="",
        todo_fields=("TODO MCS dataset_id — NEP designation not a separate MCS row",),
    ),
    OverlayLayerConfig(
        layer_id="LYR-LIO-NEP-DEVELOPMENT-CONTROL",
        catalog_row_ref="",
        source_name="lio_nep_development_control",
        publisher="Niagara Escarpment Commission / Ontario MNR (LIO)",
        endpoint="TODO",
        default_rel="lio/nep-development-control-hamilton/dca-26917.geojson",
        id_fields=(),
        class_fields=(),
        label_fields=(),
        label_template="NEP Development Control Area",
        band=BAND_CONSTRAINTS,
        constant_class="development_control",
        native_crs_note="TODO native CRS once the endpoint is identified.",
        notes=(
            "Firm plan-overlay join (DECISIONS.md). Not found in catalog 09, "
            "17-layer-profile, or MCS. Do not guess an Open06 layer index."
        ),
        todo_fields=(
            "TODO endpoint URL",
            "TODO id field",
            "TODO class field",
            "TODO label field",
        ),
    ),
    OverlayLayerConfig(
        layer_id="LYR-NPCA-REGULATION-LANDS",
        catalog_row_ref="A09",
        source_name="npca_regulation_lands",
        publisher="Niagara Peninsula Conservation Authority",
        endpoint=(
            "https://services1.arcgis.com/d0ZCwU7eGKVeNiEE/arcgis/rest/services/"
            "NPCA_APPROXIMATE_REGULATION_LANDS/FeatureServer/0"
        ),
        default_rel="npca/regulation-lands-hamilton/regulation-26917.geojson",
        id_fields=("GlobalID", "OBJECTID", "TILENUMBER"),
        class_fields=(),
        label_fields=("TILENUMBER",),
        label_template="NPCA approximate regulation lands",
        band=BAND_CONSTRAINTS,
        constant_class="regulated",
        native_crs_note="NPCA hosted; reproject to EPSG:26917. Offset is not applied here.",
        notes=(
            "Almost attribute-free (LG-087). Absence is never 'clear'. "
            "Apply the NPCA metre shift only when matching NPCA parcel fabric, "
            "not this regulation overlay, until measured."
        ),
        mcs_dataset_id="npca_regulation_lands",
    ),
    OverlayLayerConfig(
        layer_id="LYR-HCA-REGULATED-AREAS",
        catalog_row_ref="C255",
        source_name="hca_regulated_areas",
        publisher="Hamilton Conservation Authority",
        endpoint=(
            "https://services1.arcgis.com/d0ZCwU7eGKVeNiEE/arcgis/rest/services/"
            "HCA_Regulated_Areas/FeatureServer/0"
        ),
        default_rel="hca/regulated-areas-hamilton/regulated-26917.geojson",
        id_fields=("OBJECTID", "GlobalID"),
        class_fields=("Version",),
        label_fields=("Version",),
        label_template="HCA regulated area",
        band=BAND_CONSTRAINTS,
        constant_class="regulated",
        native_crs_note="HCA; reproject to EPSG:26917.",
        notes="Groupings C255: Version is the only named attribute.",
        mcs_dataset_id="",
        todo_fields=("TODO confirm Version field name vs live REST",),
    ),
    OverlayLayerConfig(
        layer_id="LYR-GRCA-REGULATION-LIMITS-WATERLOO",
        catalog_row_ref="A10",
        source_name="grca_regulation_limits_waterloo",
        publisher="Grand River Conservation Authority (Region of Waterloo ITS-GIS copy)",
        endpoint=(
            "https://utility.arcgis.com/usrsvcs/servers/"
            "7816f003cfd74d6591ccc5023a62b230/rest/services/"
            "_GRCA_Regulatory/MapServer/2"
        ),
        default_rel="grca/regulation-limits-hamilton-2026-10-17/grca-26917.geojson",
        id_fields=("GlobalID", "OBJECTID", "REG_NUMBER"),
        class_fields=("GR_FEATURE",),
        label_fields=("GR_FEATURE", "MU_LTIER", "REG_NUMBER"),
        label_template="GRCA regulation limit: {GR_FEATURE}",
        band=BAND_CONSTRAINTS,
        native_crs_note="Native EPSG:26917 on the Waterloo proxy (CONSERVATION-SOURCES.md).",
        notes=(
            "Morgen: use the Waterloo-hosted GRCA copy. Conservation Halton "
            "has no open endpoint (named gap; not a layer here)."
        ),
        mcs_dataset_id="grca_regulation_limits_waterloo_copy",
    ),
    OverlayLayerConfig(
        layer_id="LYR-HAM-SECONDARY-PLAN-LAND-USE",
        catalog_row_ref="",
        source_name="city_secondary_plan_land_use",
        publisher="City of Hamilton",
        endpoint=(
            "https://spatialsolutions.hamilton.ca/webgis/rest/services/"
            "General/PolicyPlanning/MapServer/6"
        ),
        default_rel=(
            "hamilton-city/secondary-plan-land-use-hamilton/"
            "secondary-plan-26917.geojson"
        ),
        id_fields=("OBJECTID", "FID"),
        class_fields=(),
        label_fields=(),
        label_template="Secondary plan land use",
        band=BAND_LAND_USE,
        feature_filter=PropertyFilter(
            field="TODO",
            exclude_values=(),
            todo=True,
            todo_note=(
                "Four retired plans must be filtered (PI-0003, catalog 09). "
                "Plan-name field and the four names are not in 09 or "
                "17-layer-profile."
            ),
        ),
        native_crs_note="TODO native CRS; reproject to EPSG:26917.",
        notes=(
            "47,212 lot-cut polygons, 31 plans, 67 classes (live REST "
            "2026-10-17). Do not dissolve: the dossier lists every overlapping "
            "polygon (packet: don't simplify). Lot-cuts are features, not slivers "
            "to drop. MCS hamilton_secondary_plan_land_use."
        ),
        mcs_dataset_id="hamilton_secondary_plan_land_use",
        todo_fields=(
            "TODO class / designation field name",
            "TODO plan-name field for the retired-plan filter",
            "TODO four retired plan names",
            "TODO id field",
        ),
    ),
    OverlayLayerConfig(
        layer_id="LYR-HAM-EMPLOYMENT-LANDS",
        catalog_row_ref="C001",
        source_name="city_employment_lands",
        publisher="City of Hamilton",
        endpoint=(
            "https://services.arcgis.com/rYz782eMbySr2srL/arcgis/rest/services/"
            "Employment_Lands/FeatureServer/2"
        ),
        default_rel="hamilton-city/employment-lands-hamilton/employment-26917.geojson",
        id_fields=("OBJECTID", "GlobalID"),
        class_fields=("CATEGORY",),
        label_fields=("AREA_NAME", "CATEGORY"),
        label_template="City employment lands: {AREA_NAME}",
        band=BAND_LAND_USE,
        native_crs_note="City AGOL; reproject to EPSG:26917.",
        notes="22 district polygons. Partial proxy for UHOP E-1 employment designations.",
        mcs_dataset_id="hamilton_employment_lands",
    ),
    OverlayLayerConfig(
        layer_id="LYR-HAM-URBAN-BOUNDARY",
        catalog_row_ref="C164",
        source_name="city_urban_boundary",
        publisher="City of Hamilton",
        endpoint=(
            "https://services.arcgis.com/rYz782eMbySr2srL/arcgis/rest/services/"
            "Urban_Boundary/FeatureServer/6"
        ),
        default_rel="hamilton-city/urban-boundary-hamilton/urban-26917.geojson",
        id_fields=("OBJECTID",),
        class_fields=(),
        label_fields=(),
        label_template="City urban boundary",
        band=BAND_LAND_USE,
        constant_class="urban",
        native_crs_note="City AGOL; reproject to EPSG:26917.",
        notes="1 polygon, no attributes in groupings C164. Area share, not a centroid flag.",
        mcs_dataset_id="hamilton_urban_boundary",
    ),
    OverlayLayerConfig(
        layer_id="LYR-HAM-RURAL-BOUNDARY",
        catalog_row_ref="C151",
        source_name="city_rural_boundary",
        publisher="City of Hamilton",
        endpoint=(
            "https://services.arcgis.com/rYz782eMbySr2srL/arcgis/rest/services/"
            "Rural_Boundary/FeatureServer/9"
        ),
        default_rel="hamilton-city/rural-boundary-hamilton/rural-26917.geojson",
        id_fields=("OBJECTID",),
        class_fields=(),
        label_fields=(),
        label_template="City rural boundary",
        band=BAND_LAND_USE,
        constant_class="rural",
        native_crs_note="City AGOL; reproject to EPSG:26917.",
        notes="6 polygons, no attributes in groupings C151. Companion to C164.",
        mcs_dataset_id="",
    ),
)

HAMILTON = OverlayRunConfig(
    name="hamilton",
    working_crs=WORKING_CRS,
    layers=HAMILTON_LAYERS,
)

CONFIGS = {"hamilton": HAMILTON}


def get_config(name: str) -> OverlayRunConfig:
    try:
        return CONFIGS[name]
    except KeyError as exc:
        raise KeyError(f"unknown_overlay_config:{name}") from exc
