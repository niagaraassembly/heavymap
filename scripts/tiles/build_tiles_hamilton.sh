#!/usr/bin/env bash
# First Hamilton PMTiles build, 2026-10-17. Inputs: prep/*.ndjson (EPSG:4326) from prep_tiles_hamilton.py.
# tippecanoe 2.53.0 (Debian trixie package, extracted without root) and go-pmtiles 1.31.2.
# Memory: at most 2 threads and temp files on /fast, so peak RSS stays well under deb's ~3-4 GB free.
set -eu
T=${TIPPECANOE:-$HOME/.local/bin/tippecanoe}
D=/fast/code/making/na/local-data/tiles/hamilton/2026-10-17; P=$D/prep; TMP=$D/tmp; mkdir -p $TMP
W="/tmp/hmgeo/bin/python /fast/code/making/na/local-data/scripts/timed.py"
export TIPPECANOE_MAX_THREADS=2
C="--force --read-parallel --temporary-directory=$TMP --no-progress-indicator"
build() { echo "BUILD $1"; $W "$T" $C -o "$D/$1.pmtiles" "${@:2}"; }
case "${1:-all}" in all|parcels) build parcels -n "Hamilton parcels (HeavyMap)" -l parcels -Z12 -z15 \
  --detect-shared-borders --simplification=2 --no-tiny-polygon-reduction --drop-densest-as-needed --extend-zooms-if-still-dropping \
  $P/parcels.ndjson ;; esac
case "${1:-all}" in all|buildings) build buildings -n "Hamilton buildings (HeavyMap)" -l buildings -Z13 -z15 \
  --simplification=2 --drop-densest-as-needed --extend-zooms-if-still-dropping $P/buildings.ndjson ;; esac
case "${1:-all}" in all|zoning) build zoning -n "Hamilton zoning by-law (C002)" -l zoning -Z10 -z15 \
  --detect-shared-borders --simplification=4 --coalesce-densest-as-needed --extend-zooms-if-still-dropping $P/zoning.ndjson ;; esac
case "${1:-all}" in all|nature) build nature-frame -n "Hamilton nature frame" -Z6 -z13 \
  --simplification=10 --detect-shared-borders --coalesce-smallest-as-needed --maximum-tile-bytes=300000 \
  -L greenbelt:$P/nature-greenbelt.ndjson -L conservation:$P/nature-conservation.ndjson -L parks:$P/nature-parks.ndjson ;; esac
rmdir $TMP 2>/dev/null || true
ls -la $D/*.pmtiles
