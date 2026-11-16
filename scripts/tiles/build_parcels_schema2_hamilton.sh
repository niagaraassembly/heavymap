#!/usr/bin/env bash
# Build D-070's Hamilton schema 2 parcel tiles from a pinned migrated IA run.
set -euo pipefail

if [[ $# -ne 2 ]]; then
  echo "usage: $0 <output-dir> <work-dir>" >&2
  exit 2
fi

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
DATA_ROOT=${NA_LOCAL_DATA:-"$HOME/na/local-data"}
REGISTRY_RUN=${NA_REGISTRY_RUN:-"$DATA_ROOT/heavymap-registry/hamilton/runs/20261017T0725Z-run2-ia1"}
OUT_DIR=$1
WORK_DIR=$2
TIPPECANOE=${TIPPECANOE:-tippecanoe}
PMTILES=${PMTILES:-pmtiles}

mkdir -p "$OUT_DIR" "$WORK_DIR/tippecanoe"
python3 "$SCRIPT_DIR/prep_parcels_schema2_hamilton.py" \
  --registry-run "$REGISTRY_RUN" \
  --source "$DATA_ROOT/hamilton-city/assessment-parcel-hamilton-2026-10-17/assessment-parcel.geojson" \
  --output "$WORK_DIR/parcels.ndjson"

"$TIPPECANOE" \
  --force \
  --read-parallel \
  --no-progress-indicator \
  --temporary-directory="$WORK_DIR/tippecanoe" \
  --name="Hamilton parcels (Industrial Atlas)" \
  --layer=parcels \
  --minimum-zoom=14 \
  --maximum-zoom=16 \
  --include=key \
  --detect-shared-borders \
  --simplification=2 \
  --no-tiny-polygon-reduction \
  --no-feature-limit \
  --no-tile-size-limit \
  --output="$OUT_DIR/parcels.pmtiles" \
  "$WORK_DIR/parcels.ndjson"

"$PMTILES" verify "$OUT_DIR/parcels.pmtiles"
"$PMTILES" show --header-json "$OUT_DIR/parcels.pmtiles" | python3 -c '
import json, sys
h = json.load(sys.stdin)
assert h["tile_type"] == "mvt", h["tile_type"]
assert (h["minzoom"], h["maxzoom"]) == (14, 16), (h["minzoom"], h["maxzoom"])
print(json.dumps({"tile_type": h["tile_type"], "minzoom": h["minzoom"], "maxzoom": h["maxzoom"], "bounds": h["bounds"]}, sort_keys=True))
'
