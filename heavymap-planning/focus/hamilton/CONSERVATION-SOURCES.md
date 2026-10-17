# Conservation authority sources for Hamilton (2026-10-17)

Hamilton is split across four conservation authorities: HCA, NPCA, GRCA and Conservation Halton (CH). The City's dissolved CA watershed layers name each parcel's regulator.

| CA | Regulation-limit source | Status |
|---|---|---|
| HCA | HCA open data (Regulated Areas) | catalogued, reviewed_context |
| NPCA | NPCA ArcGIS Online | catalogued |
| GRCA | Region of Waterloo ITS-GIS proxy: `_GRCA_Regulatory/MapServer/2` | **trial pull done, see below** |
| Conservation Halton | **no open endpoint found** | **named gap.** Options: request the layer from CH, or give CH-area parcels a named refusal |

## GRCA trial pull
- **Source:** https://utility.arcgis.com/usrsvcs/servers/7816f003cfd74d6591ccc5023a62b230/rest/services/_GRCA_Regulatory/MapServer/2. "Regulation Limits (GRCA)", Ontario Regulation 150/06. The copyright text says GRCA; the service is hosted by Region of Waterloo ITS-GIS. Native CRS is EPSG:26917.
- **Clip:** Hamilton `City_Boundary/FeatureServer/13`. Envelope query, then exact intersection and clip.
- **Pulled:** 2026-10-17 01:47 ET.
- **Stored (local, outside git):** `/fast/code/making/na/local-data/grca/regulation-limits-hamilton-2026-10-17/`
  - `grca_regulation_limits_hamilton_clipped.geojson` (EPSG:4326, 6.4 MB)
  - `raw/`
  - `PULL-SUMMARY.json`
- **Features:**
  - 199 intersect Hamilton, all `GR_FEATURE = REGULATION LIMIT`.
  - By `MU_LTIER`: 187 City of Hamilton, 9 County of Brant, 3 North Dumfries. The neighbour polygons straddle the boundary and are clipped.
  - The layer has 188 features tagged Hamilton in total; one of them does not touch the boundary.
- **Fields:** OBJECTID, MU_UTIER, MU_LTIER, GR_FEATURE, REG_NUMBER, CREATION_DATE, LAST_REVISION_DATE, crcValue, GlobalID. There are no owner or personal fields. The script now uses `outFields=*` (all fields); the stored pull already holds every field.
- **Coverage:** 49.37 km² regulated, or 4.3% of Hamilton's 1,148.8 km² (regulated area only, not the whole GRCA watershed).
- **Vintage:** CREATION_DATE 2006-04-20; LAST_REVISION_DATE 2026-06-28 on all features. The layer has no editingInfo.
- **Caveat:** Esri rings were assembled into polygons by symmetric difference. Spot-check holes before relying on exact areas.
