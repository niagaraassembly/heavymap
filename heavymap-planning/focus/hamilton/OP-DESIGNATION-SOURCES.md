# Hamilton Official Plan designation sources

Summary written 2026-10-17. The Claude branch `claude/modest-cannon-kols9r` was not on origin, so this records the reported findings from that search.

## Finding

There is **no public machine-readable citywide designation layer** for UHOP Schedule E-1 (Urban Land Use Designations) or RHOP Schedule D (Rural Land Use Designations).

- The City's internal GIS server (`itvpgisappint.hamilton.ca`) is not reachable from outside.
- Searched: 1,697 public layers, 594 ArcGIS Online services, McMaster, Mohawk, Waterloo, Hamilton Conservation Authority and Ontario GeoHub.

## Usable now

| Source | URL | Notes |
|---|---|---|
| Secondary Plan Land Use | https://spatialsolutions.hamilton.ca/webgis/rest/services/General/PolicyPlanning/MapServer/6 | 47,212 lot-cut polygons, 31 plans, 67 classes, last amended 2026-05-12. Filter out four retired plans. Plan names don't match the secondary plan boundary layer. Not on open.hamilton.ca. No licence stated (not a gate per HARD-RULES 6; record it for provenance). |
| PolicyPlanning MapServer (service) | https://spatialsolutions.hamilton.ca/webgis/rest/services/General/PolicyPlanning/MapServer | Parent service; layers catalogued separately. |
| Employment Lands | Employment_Lands/FeatureServer/2 (open.hamilton.ca) | 22 polygons, derived from Schedule E-1 employment designations. |
| Provincial overlays | LIO | Niagara Escarpment Plan, Greenbelt Plan, 2019 Provincially Significant Employment Zones. |

All three Hamilton rows are in the catalog (merged in PR #62).

## Fallback for the citywide designation

1. Ask the City for the internal E-1 / D designation layer.
2. Vector-extract the schedule PDFs. They are vector CorelDRAW exports, so polygons can be pulled out and georeferenced. Estimate: about 6–7 person-days.

The schedule PDFs carry a Teranet copyright notice. Under HARD-RULES 6 (licences don't gate) this doesn't block use, but record it for provenance.
