#!/usr/bin/env python3
"""Prepare line-delimited GeoJSON (EPSG:4326) for the first Hamilton PMTiles build (2026-10-17).
Usage: prep_tiles_hamilton.py <layer> where layer is parcels | buildings | zoning | nature
Public fields only. Parcels carry heavymap_id (registry CURRENT run), ARN and grade. Never Owner or Legal_Txt
(those live only on NPCA Parcels_Cityview, which is not read here). Data stays local, never in git."""
import csv, datetime, json, os, sys
csv.field_size_limit(1 << 30)
L = '/fast/code/making/na/local-data'
REG = f'{L}/heavymap-registry/hamilton'
OUT = f'{L}/tiles/hamilton/2026-10-17/prep'
RUN = open(f'{REG}/CURRENT').read().strip()
SCREENED = {'Owner', 'OWNER', 'Legal_Txt', 'LEGAL_TXT', 'Creator', 'Editor'}  # identifying / staff account fields
def load(p): return json.load(open(f'{L}/{p}'))['features']
def iso(v):
    return datetime.datetime.fromtimestamp(v / 1000, datetime.timezone.utc).date().isoformat() if isinstance(v, (int, float)) else v
def write(name, rows):
    n = 0
    with open(f'{OUT}/{name}.ndjson', 'w') as o:
        for props, geom in rows:
            assert not (SCREENED & set(props)), 'screened field leaked'
            o.write(json.dumps({'type': 'Feature', 'properties': props, 'geometry': geom}, separators=(',', ':')) + '\n'); n += 1
    print('WROTE', name, n, flush=True)
def by_source(csvname, extra):
    m = {}
    with open(f'{REG}/runs/{RUN}/{csvname}', newline='') as f:
        for r in csv.DictReader(f):
            if r['status'] != 'active': continue
            for s in r['source_ids'].split(' | '): m[s.strip()] = (r['hm_id'], {k: r[k] for k in extra})
    return m
lay = sys.argv[1]
if lay == 'parcels':
    ids = by_source('parcels.csv', ['arn_grade', 'area_m2'])
    arns = {}
    with open(f'{REG}/runs/{RUN}/arn_links.csv', newline='') as f:
        for r in csv.DictReader(f): arns.setdefault(r['hm_id'], set()).add(r['arn'])
    seen, rows, miss = set(), [], 0
    for f in load('hamilton-city/assessment-parcel-hamilton-2026-10-17/assessment-parcel.geojson'):
        k = ids.get(str(f['properties']['OBJECTID']))
        if not k: miss += 1; continue
        hm, x = k
        if hm in seen: continue  # stacked duplicate geometry (alias), one feature per HeavyMap ID
        seen.add(hm); a = sorted(arns.get(hm, ()))
        p = {'heavymap_id': hm, 'arn_grade': x['arn_grade'], 'area_m2': round(float(x['area_m2']), 1), 'arn_count': len(a)}
        if a: p['arn'] = a[0]
        if len(a) > 1: p['arn_all'] = ' | '.join(a[:10])
        rows.append((p, f['geometry']))
    print('parcels unmatched source rows', miss)
    write('parcels', rows)
elif lay == 'buildings':
    ids = by_source('buildings.csv', ['parcel_hm_id', 'area_m2'])
    seen, rows = set(), []
    for f in load('hamilton-city/buildings-hamilton-2026-10-17/buildings.geojson'):
        k = ids.get(str(f['properties']['OBJECTID']))
        if not k or k[0] in seen: continue
        seen.add(k[0]); p = {'heavymap_id': k[0], 'area_m2': round(float(k[1]['area_m2']), 1)}
        if k[1]['parcel_hm_id']: p['parcel_heavymap_id'] = k[1]['parcel_hm_id']
        if f['properties'].get('NAME'): p['name'] = f['properties']['NAME']
        rows.append((p, f['geometry']))
    write('buildings', rows)
elif lay == 'zoning':
    drop = SCREENED | {'GlobalID', 'Shape__Area', 'Shape__Length', 'CreationDate', 'EditDate'}
    rows = []
    for f in load('hamilton-city/zoning-bylaw-boundary-hamilton-2026-10-17/zoning-bylaw-boundary.geojson'):
        p = {k: iso(v) if k.endswith('_DATE') else v for k, v in f['properties'].items() if k not in drop and v not in (None, '', ' ')}
        rows.append((p, f['geometry']))
    write('zoning', rows)
elif lay == 'nature':
    g = [({'designation': f['properties'].get('DESIGNATION')}, f['geometry'])
         for f in load('lio/greenbelt-designation-hamilton-2026-10-17/greenbelt-designation.geojson')]
    write('nature-greenbelt', g)
    c = [({'authority': 'HCA'}, f['geometry']) for f in load('hca/regulated-areas-hamilton-2026-10-17/regulated-areas.geojson')]
    c += [({'authority': 'NPCA'}, f['geometry']) for f in load('npca/approximate-regulation-lands-hamilton-2026-10-17/approximate-regulation-lands.geojson')]
    c += [({'authority': 'GRCA'}, f['geometry']) for f in load('grca/regulation-limits-hamilton-2026-10-17/grca_regulation_limits_hamilton_clipped.geojson')]
    write('nature-conservation', c)
    pk = [({k.lower(): v for k, v in f['properties'].items() if k in ('NAME', 'PARK_CLASS', 'TYPE') and v}, f['geometry'])
          for f in load('hamilton-city/parks-hamilton-2026-10-17/parks.geojson')]
    write('nature-parks', pk)
