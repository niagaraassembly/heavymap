"""Mint, attach and reconcile HeavyMap IDs.

Parcel IDs are minted from distinct City geometries. ARN, civic keys and
footprint hashes are matching aids. Splits and merges mint new IDs and
record lineage; IDs are never reused.
"""

from __future__ import annotations

from collections import defaultdict

from heavymap.ids.config import RegistryConfig
from heavymap.ids.format import IdFactory
from heavymap.ids.geometry import (
    Bounds,
    Geometry,
    GridIndex,
    fingerprint,
    geom_hash,
    intersection_area,
    iou,
)
from heavymap.ids.models import (
    AddressRecord,
    ArnLink,
    BuildingOverlap,
    BuildingRecord,
    LineageLink,
    ParcelRecord,
    SourceFeature,
)


def apply_correction(
    features: list[SourceFeature], config: RegistryConfig
) -> list[SourceFeature]:
    if not features:
        return []
    source_name = features[0].source_name
    corr = config.correction_for(source_name)
    if corr is None or (corr.dx_m == 0 and corr.dy_m == 0):
        return features
    out = []
    for feat in features:
        out.append(
            SourceFeature(
                source_id=feat.source_id,
                source_name=feat.source_name,
                geometry=feat.geometry.translate(corr.dx_m, corr.dy_m),
                properties=feat.properties,
            )
        )
    return out


def _parcel_sort_key(geom: Geometry, source_ids: tuple[str, ...]) -> tuple:
    rx, ry = geom.representative_point()
    return (round(rx, 6), round(ry, 6), geom_hash(geom), source_ids)


def _group_duplicate_polygons(
    features: list[SourceFeature],
) -> list[tuple[Geometry, tuple[str, ...]]]:
    groups: dict[str, list[SourceFeature]] = {}
    order: list[str] = []
    for feat in features:
        key = geom_hash(feat.geometry)
        if key not in groups:
            groups[key] = []
            order.append(key)
        groups[key].append(feat)
    grouped = []
    for key in order:
        members = groups[key]
        aliases = tuple(sorted({m.source_id for m in members}))
        grouped.append((members[0].geometry, aliases))
    grouped.sort(key=lambda item: _parcel_sort_key(item[0], item[1]))
    return grouped


def mint_parcels(
    features: list[SourceFeature],
    factory: IdFactory,
    config: RegistryConfig,
    run_id: str,
) -> list[ParcelRecord]:
    country, region, jurisdiction = config.place
    records = []
    for geom, aliases in _group_duplicate_polygons(features):
        rx, ry = geom.representative_point()
        b = geom.bounds
        records.append(
            ParcelRecord(
                hm_id=factory.mint_key(country, region, jurisdiction, "parcel"),
                status="active",
                geom_hash=geom_hash(geom),
                fingerprint=fingerprint(geom),
                area_m2=geom.area,
                rep_x=rx,
                rep_y=ry,
                minx=b.minx,
                miny=b.miny,
                maxx=b.maxx,
                maxy=b.maxy,
                source_ids=aliases,
                arn_grade="",
                minted_run=run_id,
                retired_run=None,
                geometry=geom,
            )
        )
    return records


def _index_parcels(
    parcels: list[ParcelRecord], cell_size: float
) -> GridIndex:
    index = GridIndex(cell_size=cell_size)
    for parcel in parcels:
        if parcel.status != "active":
            continue
        index.insert(
            parcel.hm_id,
            parcel.geometry.bounds,
            parcel,
        )
    return index


def _index_features(
    features: list[SourceFeature], cell_size: float
) -> GridIndex:
    index = GridIndex(cell_size=cell_size)
    for feat in features:
        index.insert(feat.source_id, feat.geometry.bounds, feat)
    return index


def _normalise_arn(raw: str, expected_prefix: str) -> tuple[str, str]:
    digits = "".join(ch for ch in (raw or "") if ch.isdigit())
    if len(digits) >= 15:
        arn = digits[:15]
    else:
        arn = digits
    notes = ""
    if arn and expected_prefix and not arn.startswith(expected_prefix):
        notes = "non_city_prefix"
    return arn, notes


def attach_arns(
    parcels: list[ParcelRecord],
    npca_features: list[SourceFeature],
    config: RegistryConfig,
) -> list[ArnLink]:
    """Attach ARN by representative-point containment after correction."""

    active = [p for p in parcels if p.status == "active"]
    if not active or not npca_features:
        return []
    npca = apply_correction(npca_features, config)
    pindex = _index_parcels(active, config.grid_cell_m)
    nindex = _index_features(npca, config.grid_cell_m)
    parcels_by_id = {p.hm_id: p for p in active}

    city_to_npca: dict[str, list[SourceFeature]] = defaultdict(list)
    npca_to_city: dict[str, list[ParcelRecord]] = defaultdict(list)

    for parcel in active:
        rx, ry = parcel.rep_x, parcel.rep_y
        for sid in nindex.query_point(rx, ry):
            feat: SourceFeature = nindex.get(sid)  # type: ignore[assignment]
            if feat.geometry.contains_point(rx, ry):
                city_to_npca[parcel.hm_id].append(feat)

    for feat in npca:
        rx, ry = feat.geometry.representative_point()
        for hid in pindex.query_point(rx, ry):
            parcel = parcels_by_id[hid]
            if parcel.geometry.contains_point(rx, ry):
                npca_to_city[feat.source_id].append(parcel)

    pair_keys: dict[tuple[str, str, str], SourceFeature] = {}
    for hid, feats in city_to_npca.items():
        for feat in feats:
            pair_keys[(hid, feat.source_id, feat.properties.get("ARN", ""))] = feat
    npca_by_id = {f.source_id: f for f in npca}
    for sid, recs in npca_to_city.items():
        feat = npca_by_id[sid]
        for parcel in recs:
            pair_keys[
                (parcel.hm_id, feat.source_id, feat.properties.get("ARN", ""))
            ] = feat

    raw_links: list[ArnLink] = []
    for (hid, sid, raw_arn), feat in pair_keys.items():
        arn, notes = _normalise_arn(raw_arn, config.expected_arn_prefix)
        if not arn:
            continue
        parcel = parcels_by_id[hid]
        link_iou = iou(parcel.geometry, feat.geometry)
        raw_links.append(
            ArnLink(
                hm_id=hid,
                arn=arn,
                npca_source_id=sid,
                grade="",
                iou=round(link_iou, 6),
                method="representative_point",
                notes=notes,
            )
        )

    city_arns: dict[str, set[str]] = defaultdict(set)
    arn_cities: dict[str, set[str]] = defaultdict(set)
    for link in raw_links:
        city_arns[link.hm_id].add(link.arn)
        arn_cities[link.arn].add(link.hm_id)

    graded: list[ArnLink] = []
    for link in raw_links:
        n_arns = len(city_arns[link.hm_id])
        n_cities = len(arn_cities[link.arn])
        if n_arns > 1:
            grade = "many_to_one"
        elif n_cities > 1:
            grade = "one_to_many"
        else:
            grade = "exact_1to1"
        graded.append(
            ArnLink(
                hm_id=link.hm_id,
                arn=link.arn,
                npca_source_id=link.npca_source_id,
                grade=grade,
                iou=link.iou,
                method=link.method,
                notes=link.notes,
            )
        )

    parcel_grade: dict[str, str] = {}
    for hid, arns in city_arns.items():
        n_arns = len(arns)
        if n_arns > 1:
            parcel_grade[hid] = "many_to_one"
        else:
            arn = next(iter(arns))
            parcel_grade[hid] = (
                "one_to_many" if len(arn_cities[arn]) > 1 else "exact_1to1"
            )

    for parcel in active:
        if parcel.hm_id in parcel_grade:
            parcel.arn_grade = parcel_grade[parcel.hm_id]
            continue
        nearest = _nearest_npca_distance(
            parcel, npca, nindex, config.coverage_buffer_m
        )
        if nearest is None or nearest > config.coverage_buffer_m:
            parcel.arn_grade = "not_in_coverage"
        else:
            parcel.arn_grade = "unmatched"
    return graded


def _nearest_npca_distance(
    parcel: ParcelRecord,
    npca: list[SourceFeature],
    nindex: GridIndex,
    max_distance: float,
) -> float | None:
    """Distance from the parcel's representative point to the nearest NPCA
    parcel, searched only within ``max_distance``. ``None`` means none that
    close. (A full scan here was O(parcels x NPCA) for the ~74k Hamilton
    parcels outside NPCA coverage.)"""

    if not npca:
        return None
    rx, ry = parcel.rep_x, parcel.rep_y
    keys = nindex.query_bbox(
        Bounds(rx - max_distance, ry - max_distance, rx + max_distance, ry + max_distance)
    )
    best = None
    for key in keys:
        feat: SourceFeature = nindex.get(key)  # type: ignore[assignment]
        b = feat.geometry.bounds
        if (
            rx < b.minx - max_distance
            or rx > b.maxx + max_distance
            or ry < b.miny - max_distance
            or ry > b.maxy + max_distance
        ):
            continue
        d = feat.geometry.distance_to_point(rx, ry)
        if best is None or d < best:
            best = d
    return best


def civic_key(number: str, street: str, community: str, unit: str) -> str:
    def norm(value: str) -> str:
        return " ".join((value or "").strip().upper().split())

    return "|".join(
        (norm(number), norm(street), norm(community), norm(unit))
    )


def civic_key_from_properties(props: dict[str, str]) -> str:
    number = (
        props.get("NUMBER_COMPLETE")
        or props.get("NUMBER")
        or props.get("STREET_NUM")
        or props.get("STREET_NUMBER")  # Waste Collection by Address
        or ""
    )
    street = (
        props.get("FULL_STREET_NAME")
        or props.get("STREET_NAME")
        or props.get("FULL_STREE")
        or ""
    )
    community = props.get("COMMUNITY") or props.get("COMMUNITY_NAME") or ""
    unit = (
        props.get("UNIT_NUMBER_COMPLETE")
        or props.get("UNIT")
        or props.get("UNIT_NUMBER")
        or ""
    )
    return civic_key(number, street, community, unit)


def mint_addresses(
    features: list[SourceFeature],
    factory: IdFactory,
    config: RegistryConfig,
    run_id: str,
) -> list[AddressRecord]:
    country, region, jurisdiction = config.place
    groups: dict[str, list[SourceFeature]] = {}
    order: list[str] = []
    for feat in features:
        key = civic_key_from_properties(feat.properties)
        if not key.strip("|"):
            continue
        if key not in groups:
            groups[key] = []
            order.append(key)
        groups[key].append(feat)
    records = []
    for key in sorted(order):
        members = groups[key]
        xs = [m.geometry.x for m in members]
        ys = [m.geometry.y for m in members]
        records.append(
            AddressRecord(
                hm_id=factory.mint_key(country, region, jurisdiction, "address"),
                civic_key=key,
                source_ids=tuple(sorted({m.source_id for m in members})),
                x=sum(xs) / len(xs),
                y=sum(ys) / len(ys),
                parcel_hm_id=None,
                link_method="",
                status="active",
                minted_run=run_id,
                retired_run=None,
            )
        )
    return records


def link_addresses(
    addresses: list[AddressRecord],
    parcels: list[ParcelRecord],
    config: RegistryConfig,
) -> None:
    active = [p for p in parcels if p.status == "active"]
    if not active:
        for rec in addresses:
            if rec.status == "active":
                rec.link_method = "unmatched"
        return
    pindex = _index_parcels(active, config.grid_cell_m)
    by_id = {p.hm_id: p for p in active}
    for rec in addresses:
        if rec.status != "active":
            continue
        hits = []
        for hid in pindex.query_point(rec.x, rec.y):
            parcel = by_id[hid]
            if parcel.geometry.contains_point(rec.x, rec.y):
                hits.append(parcel)
        if len(hits) == 1:
            rec.parcel_hm_id = hits[0].hm_id
            rec.link_method = "pip"
            continue
        if len(hits) > 1:
            rec.parcel_hm_id = None
            rec.link_method = "pip_ambiguous"
            continue
        nearest = None
        nearest_d = None
        r = config.address_nearest_m
        for hid in pindex.query_bbox(Bounds(rec.x - r, rec.y - r, rec.x + r, rec.y + r)):
            parcel = by_id[hid]
            d = parcel.geometry.distance_to_point(rec.x, rec.y)
            if nearest_d is None or d < nearest_d:
                nearest, nearest_d = parcel, d
        if nearest is not None and nearest_d is not None and nearest_d <= config.address_nearest_m:
            rec.parcel_hm_id = nearest.hm_id
            rec.link_method = "nearest_10m"
        else:
            rec.parcel_hm_id = None
            rec.link_method = "unmatched"


def mark_waste_coverage(
    addresses: list[AddressRecord], waste_features: list[SourceFeature]
) -> None:
    waste_keys = {
        civic_key_from_properties(feat.properties) for feat in waste_features
    }
    waste_keys.discard("|||")
    for rec in addresses:
        if rec.status != "active":
            continue
        rec.waste_seen = "y" if rec.civic_key in waste_keys else "n"


def mint_buildings(
    features: list[SourceFeature],
    factory: IdFactory,
    config: RegistryConfig,
    run_id: str,
) -> list[BuildingRecord]:
    country, region, jurisdiction = config.place
    records = []
    for geom, aliases in _group_duplicate_polygons(features):
        records.append(
            BuildingRecord(
                hm_id=factory.mint_key(country, region, jurisdiction, "footprint"),
                geom_hash=geom_hash(geom),
                fingerprint=fingerprint(geom),
                area_m2=geom.area,
                parcel_hm_id=None,
                source_ids=aliases,
                status="active",
                minted_run=run_id,
                retired_run=None,
                geometry=geom,
            )
        )
    records.sort(key=lambda b: (round(b.geometry.bounds.minx, 6), b.geom_hash))
    return records


def overlap_buildings(
    buildings: list[BuildingRecord],
    parcels: list[ParcelRecord],
    min_list_area: float = 0.0,
) -> list[BuildingOverlap]:
    active_p = [p for p in parcels if p.status == "active"]
    pindex = _index_parcels(active_p, cell_size=100.0) if active_p else GridIndex()
    by_id = {p.hm_id: p for p in active_p}
    all_overlaps: list[BuildingOverlap] = []
    for building in buildings:
        if building.status != "active":
            continue
        found: list[BuildingOverlap] = []
        for hid in pindex.query_bbox(building.geometry.bounds):
            parcel = by_id[hid]
            area = intersection_area(building.geometry, parcel.geometry)
            if area > min_list_area:
                found.append(
                    BuildingOverlap(
                        building_hm_id=building.hm_id,
                        parcel_hm_id=parcel.hm_id,
                        area_m2=round(area, 6),
                    )
                )
        found.sort(key=lambda row: (-row.area_m2, row.parcel_hm_id))
        building.overlaps = tuple(found)
        building.parcel_hm_id = found[0].parcel_hm_id if found else None
        all_overlaps.extend(found)
    return all_overlaps


def reconcile_parcels(
    previous: list[ParcelRecord],
    new_features: list[SourceFeature],
    factory: IdFactory,
    config: RegistryConfig,
    run_id: str,
) -> tuple[list[ParcelRecord], list[LineageLink]]:
    """Match by geom_hash/fingerprint, then IoU >= repull_iou.

    Unmatched 1:1 below the threshold is a replacement (new ID + lineage).
    One-to-many is a split; many-to-one is a merge. IDs are never reused.
    """

    factory.remember(r.hm_id for r in previous)
    grouped = _group_duplicate_polygons(new_features)
    if not previous:
        minted = mint_parcels(new_features, factory, config, run_id)
        return minted, []

    old_active = [p for p in previous if p.status == "active"]
    retired = [p for p in previous if p.status != "active"]
    by_hash = {p.geom_hash: p for p in old_active}
    by_fp = {p.fingerprint: p for p in old_active}

    new_units: list[tuple[Geometry, tuple[str, ...]]] = grouped
    matched_old: set[str] = set()
    matched_new: set[int] = set()
    kept: list[ParcelRecord] = []
    lineage: list[LineageLink] = []

    # Pass 1: exact geometry hash, then fingerprint.
    for i, (geom, aliases) in enumerate(new_units):
        h = geom_hash(geom)
        fp = fingerprint(geom)
        old = by_hash.get(h) or by_fp.get(fp)
        if old is None or old.hm_id in matched_old:
            continue
        matched_old.add(old.hm_id)
        matched_new.add(i)
        rx, ry = geom.representative_point()
        b = geom.bounds
        kept.append(
            ParcelRecord(
                hm_id=old.hm_id,
                status="active",
                geom_hash=h,
                fingerprint=fp,
                area_m2=geom.area,
                rep_x=rx,
                rep_y=ry,
                minx=b.minx,
                miny=b.miny,
                maxx=b.maxx,
                maxy=b.maxy,
                source_ids=aliases,
                arn_grade="",
                minted_run=old.minted_run,
                retired_run=None,
                geometry=geom,
            )
        )

    remaining_old = [p for p in old_active if p.hm_id not in matched_old]
    remaining_new = [
        (i, geom, aliases)
        for i, (geom, aliases) in enumerate(new_units)
        if i not in matched_new
    ]

    # Pass 2: unique IoU >= threshold.
    old_index = _index_parcels(remaining_old, config.grid_cell_m)
    iou_pairs: list[tuple[float, int, str]] = []
    for i, geom, aliases in remaining_new:
        best: list[tuple[float, str]] = []
        for hid in old_index.query_bbox(geom.bounds):
            old = old_index.get(hid)
            if not isinstance(old, ParcelRecord):
                continue
            score = iou(geom, old.geometry)
            if score >= config.repull_iou:
                best.append((score, old.hm_id))
        if len(best) == 1:
            iou_pairs.append((best[0][0], i, best[0][1]))

    used_old = set()
    used_new = set()
    remaining_by_id = {p.hm_id: p for p in remaining_old}
    iou_pairs.sort(reverse=True)
    for _score, i, hid in iou_pairs:
        if i in used_new or hid in used_old:
            continue
        geom, aliases = new_units[i]
        old = remaining_by_id[hid]
        used_old.add(hid)
        used_new.add(i)
        matched_old.add(hid)
        matched_new.add(i)
        rx, ry = geom.representative_point()
        b = geom.bounds
        kept.append(
            ParcelRecord(
                hm_id=old.hm_id,
                status="active",
                geom_hash=geom_hash(geom),
                fingerprint=fingerprint(geom),
                area_m2=geom.area,
                rep_x=rx,
                rep_y=ry,
                minx=b.minx,
                miny=b.miny,
                maxx=b.maxx,
                maxy=b.maxy,
                source_ids=aliases,
                arn_grade="",
                minted_run=old.minted_run,
                retired_run=None,
                geometry=geom,
            )
        )

    remaining_old = [p for p in old_active if p.hm_id not in matched_old]
    remaining_new = [
        (i, geom, aliases)
        for i, (geom, aliases) in enumerate(new_units)
        if i not in matched_new
    ]

    # Overlap graph for splits / merges / replacements.
    overlaps: dict[int, list[tuple[float, ParcelRecord]]] = defaultdict(list)
    old_to_new: dict[str, list[int]] = defaultdict(list)
    remaining_index = _index_parcels(remaining_old, config.grid_cell_m)
    for i, geom, aliases in remaining_new:
        for hid in remaining_index.query_bbox(geom.bounds):
            old = remaining_index.get(hid)
            if not isinstance(old, ParcelRecord):
                continue
            inter = intersection_area(geom, old.geometry)
            if inter <= 0:
                continue
            overlaps[i].append((inter, old))
            old_to_new[old.hm_id].append(i)

    consumed_new: set[int] = set()
    consumed_old: set[str] = set()
    newly: list[ParcelRecord] = []

    def _mint(geom: Geometry, aliases: tuple[str, ...]) -> ParcelRecord:
        country, region, jurisdiction = config.place
        rx, ry = geom.representative_point()
        b = geom.bounds
        rec = ParcelRecord(
            hm_id=factory.mint_key(country, region, jurisdiction, "parcel"),
            status="active",
            geom_hash=geom_hash(geom),
            fingerprint=fingerprint(geom),
            area_m2=geom.area,
            rep_x=rx,
            rep_y=ry,
            minx=b.minx,
            miny=b.miny,
            maxx=b.maxx,
            maxy=b.maxy,
            source_ids=aliases,
            arn_grade="",
            minted_run=run_id,
            retired_run=None,
            geometry=geom,
        )
        newly.append(rec)
        return rec

    # Splits: one old -> two or more remaining new.
    for old in remaining_old:
        children = [
            i
            for i in old_to_new.get(old.hm_id, ())
            if i not in consumed_new
        ]
        unique_children = []
        for i in children:
            # Prefer splits where this old is the dominant overlap for the new.
            partners = overlaps[i]
            partners.sort(key=lambda row: -row[0])
            if partners and partners[0][1].hm_id == old.hm_id:
                unique_children.append(i)
        if len(unique_children) >= 2:
            consumed_old.add(old.hm_id)
            for i in unique_children:
                geom, aliases = new_units[i]
                child = _mint(geom, aliases)
                consumed_new.add(i)
                lineage.append(
                    LineageLink(
                        from_id=old.hm_id,
                        to_id=child.hm_id,
                        relation="split_into",
                        run_id=run_id,
                    )
                )

    # Merges: one new -> two or more remaining old.
    for i, geom, aliases in remaining_new:
        if i in consumed_new:
            continue
        parents = [
            old
            for _inter, old in overlaps.get(i, ())
            if old.hm_id not in consumed_old
        ]
        # Keep olds that have this new as their only remaining child.
        exclusive = []
        for old in parents:
            still = [
                j
                for j in old_to_new.get(old.hm_id, ())
                if j not in consumed_new or j == i
            ]
            if still == [i] or (i in still and len(still) == 1):
                exclusive.append(old)
        if len(exclusive) >= 2:
            child = _mint(geom, aliases)
            consumed_new.add(i)
            for old in exclusive:
                consumed_old.add(old.hm_id)
                lineage.append(
                    LineageLink(
                        from_id=old.hm_id,
                        to_id=child.hm_id,
                        relation="merged_from",
                        run_id=run_id,
                    )
                )

    # 1:1 remainder: replacement (new ID, lineage, never reuse).
    for i, geom, aliases in remaining_new:
        if i in consumed_new:
            continue
        partners = [
            old
            for _inter, old in overlaps.get(i, ())
            if old.hm_id not in consumed_old
        ]
        child = _mint(geom, aliases)
        consumed_new.add(i)
        if len(partners) == 1:
            consumed_old.add(partners[0].hm_id)
            lineage.append(
                LineageLink(
                    from_id=partners[0].hm_id,
                    to_id=child.hm_id,
                    relation="replaced_by",
                    run_id=run_id,
                )
            )

    retired_now = []
    kept_now = {p.hm_id for p in kept}
    for old in old_active:
        if old.hm_id in matched_old:
            continue
        if old.hm_id in consumed_old or old.hm_id not in kept_now:
            retired_now.append(old.retire(run_id))

    # Old actives that were kept by match should not also appear retired.
    kept_ids = {p.hm_id for p in kept}
    new_ids = {p.hm_id for p in newly}
    retired_now = [
        p for p in retired_now if p.hm_id not in kept_ids and p.hm_id not in new_ids
    ]
    return retired + retired_now + kept + newly, lineage


def reconcile_addresses(
    previous: list[AddressRecord],
    new_features: list[SourceFeature],
    factory: IdFactory,
    config: RegistryConfig,
    run_id: str,
) -> list[AddressRecord]:
    factory.remember(r.hm_id for r in previous)
    minted = mint_addresses(new_features, factory, config, run_id)
    if not previous:
        return minted
    prev_by_key = {
        rec.civic_key: rec for rec in previous if rec.status == "active"
    }
    used_ids = set()
    out: list[AddressRecord] = [rec for rec in previous if rec.status != "active"]
    seen_keys = set()
    reminted: list[AddressRecord] = []
    for rec in minted:
        seen_keys.add(rec.civic_key)
        old = prev_by_key.get(rec.civic_key)
        if old is not None:
            used_ids.add(old.hm_id)
            reminted.append(
                AddressRecord(
                    hm_id=old.hm_id,
                    civic_key=rec.civic_key,
                    source_ids=rec.source_ids,
                    x=rec.x,
                    y=rec.y,
                    parcel_hm_id=None,
                    link_method="",
                    status="active",
                    minted_run=old.minted_run,
                    retired_run=None,
                )
            )
        else:
            reminted.append(rec)
    for old in previous:
        if old.status != "active":
            continue
        if old.civic_key not in seen_keys:
            out.append(
                AddressRecord(
                    hm_id=old.hm_id,
                    civic_key=old.civic_key,
                    source_ids=old.source_ids,
                    x=old.x,
                    y=old.y,
                    parcel_hm_id=None,
                    link_method=old.link_method,
                    status="retired",
                    minted_run=old.minted_run,
                    retired_run=run_id,
                    waste_seen=old.waste_seen,
                )
            )
    return out + reminted


def reconcile_buildings(
    previous: list[BuildingRecord],
    new_features: list[SourceFeature],
    factory: IdFactory,
    config: RegistryConfig,
    run_id: str,
) -> tuple[list[BuildingRecord], list[LineageLink]]:
    """Reuse parcel reconcile by mapping through a thin adapter."""

    fake_prev = [
        ParcelRecord(
            hm_id=b.hm_id,
            status=b.status,
            geom_hash=b.geom_hash,
            fingerprint=b.fingerprint,
            area_m2=b.area_m2,
            rep_x=b.geometry.representative_point()[0],
            rep_y=b.geometry.representative_point()[1],
            minx=b.geometry.bounds.minx,
            miny=b.geometry.bounds.miny,
            maxx=b.geometry.bounds.maxx,
            maxy=b.geometry.bounds.maxy,
            source_ids=b.source_ids,
            arn_grade="",
            minted_run=b.minted_run,
            retired_run=b.retired_run,
            geometry=b.geometry,
        )
        for b in previous
    ]
    # Temporarily mint footprint keys via a wrapper factory.
    wrapped = _GrainFactory(factory, "footprint")
    recs, lineage = reconcile_parcels(
        fake_prev, new_features, wrapped, config, run_id
    )
    buildings = [
        BuildingRecord(
            hm_id=p.hm_id,
            geom_hash=p.geom_hash,
            fingerprint=p.fingerprint,
            area_m2=p.area_m2,
            parcel_hm_id=None,
            source_ids=p.source_ids,
            status=p.status,
            minted_run=p.minted_run,
            retired_run=p.retired_run,
            geometry=p.geometry,
        )
        for p in recs
    ]
    return buildings, lineage


class _GrainFactory:
    """IdFactory that forces a grain when minting through parcel reconcile."""

    def __init__(self, inner: IdFactory, grain: str) -> None:
        self.inner = inner
        self.grain = grain
        self.used = inner.used

    def remember(self, locals_or_keys) -> None:
        self.inner.remember(locals_or_keys)

    def mint_key(self, country, region, jurisdiction, _grain) -> str:
        return self.inner.mint_key(country, region, jurisdiction, self.grain)
