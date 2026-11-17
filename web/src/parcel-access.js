/* Access and services for one parcel, from the private portrait package
 * (D-079): per-parcel measurements, one shard per click, hash-verified.
 *
 * The package carries metres, ids and the City's source values (D-078).
 * All wording here is HeavyMap's, and it keeps nearness distinct from
 * service: a main near a parcel is not a connection or capacity, and a
 * traffic count is all vehicles, not trucks. */

import { sha256Hex } from "./hash.js";

const MANIFEST = "access_manifest.json";
const SCHEMA = "heavymap-parcel-access/0.1.0";
const DEFAULT_FETCH = async (url) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: ${response.status}`);
  return new Uint8Array(await response.arrayBuffer());
};
const parse = (bytes) => JSON.parse(new TextDecoder().decode(bytes));

export function createAccessLoader({ base, fetchBytes = DEFAULT_FETCH, onReport = () => {} }) {
  const root = base.endsWith("/") ? base : `${base}/`;
  let manifest = null;
  const shards = new Map();

  async function pin() {
    try {
      const doc = parse(await fetchBytes(`${root}${MANIFEST}`));
      if (doc.schema_version !== SCHEMA || doc.jurisdiction !== "ca/on/hamilton" || typeof doc.shard_sha256 !== "object")
        throw new Error("Unsupported parcel access package.");
      manifest = doc;
      return { ok: true, recordCount: doc.record_count, release: doc.release };
    } catch (error) {
      manifest = null;
      onReport({ kind: "access_package_unavailable", detail: String(error) });
      return { ok: false, reason: "unavailable" };
    }
  }

  async function forParcel(key) {
    if (!manifest) return { ok: false, reason: "not_pinned" };
    const suffix = String(key).slice(-2);
    const expected = manifest.shard_sha256[suffix];
    if (!expected) return { ok: false, reason: "no_shard" };
    try {
      if (!shards.has(suffix)) {
        const bytes = await fetchBytes(`${root}access/${suffix}.json`);
        if (await sha256Hex(bytes) !== expected) throw new Error(`access shard ${suffix} failed hash verification`);
        const doc = parse(bytes);
        if (doc.schema_version !== SCHEMA || doc.shard !== suffix) throw new Error(`access shard ${suffix} is incompatible`);
        shards.set(suffix, doc.records);
      }
      const record = shards.get(suffix)[key];
      return record ? { ok: true, record, release: manifest.release } : { ok: false, reason: "no_record" };
    } catch (error) {
      onReport({ kind: "access_shard_unavailable", detail: String(error) });
      return { ok: false, reason: "unavailable" };
    }
  }

  return { pin, forParcel, get manifest() { return manifest; } };
}

export function formatDistance(m) {
  if (m === undefined || m === null) return null;
  if (m < 1) return "0 m";
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(m < 10000 ? 1 : 0)} km`;
}

const SEWER_SUBTYPE = { SANITARY: "sanitary", STORM: "storm", COMBINED: "combined", FORCE: "force main" };
const TIME_OF_DAY = { "Full Time": "full-time route", "Part Time": "part-time route" };

/** Rows for the drawer tile and the workspace record. Each row:
 * {id, label, value, sub, share: null, provenance}. Missing measurements say
 * so plainly instead of disappearing. */
export function summariseAccess(record, labels) {
  if (!record) return null;
  const t = (key, params, fallback) => {
    const text = labels?.t ? labels.t(key, params) : null;
    return text && text !== key ? text : fallback;
  };
  const source = (sourceText) => ({
    sourceLabel: sourceText,
    joinText: t("parcel.access.method", {}, "Shortest distance from the parcel boundary"),
    confText: "",
  });
  const none = (m) => t("parcel.access.none_within", { distance: formatDistance(m) }, `None within ${formatDistance(m)}`);
  const rows = [];

  rows.push({
    id: "truck_route",
    label: t("parcel.access.truck_route", {}, "Truck route"),
    value: formatDistance(record.truck_route_m) ?? none(2000),
    sub: TIME_OF_DAY[record.truck_route_time] ?? "",
    share: null,
    provenance: source("City of Hamilton Truck Route Network"),
  });
  rows.push({
    id: "rail",
    label: t("parcel.access.rail", {}, "Railway"),
    value: formatDistance(record.rail_m) ?? none(3000),
    sub: record.rail_m !== undefined ? t("parcel.access.rail_sub", {}, "surface line, not rail service") : "",
    share: null,
    provenance: source("City of Hamilton Railways"),
  });
  const waterParts = [
    record.watermain_m !== undefined ? t("parcel.access.from_boundary", { distance: formatDistance(record.watermain_m) }, `${formatDistance(record.watermain_m)} from boundary`) : null,
    record.watermain_installed ? t("parcel.access.installed", { year: record.watermain_installed }, `installed ${record.watermain_installed}`) : null,
  ].filter(Boolean);
  rows.push({
    id: "watermain",
    label: t("parcel.access.watermain", {}, "Nearest water main"),
    value: record.watermain_m === undefined ? none(1000) : record.watermain_mm ? `${record.watermain_mm} mm` : formatDistance(record.watermain_m),
    sub: waterParts.join(" · "),
    share: null,
    provenance: source("City of Hamilton Watermain"),
  });
  const sewerKind = SEWER_SUBTYPE[record.sewermain_subtype] ?? "";
  const sewerParts = [
    record.sewermain_m !== undefined ? t("parcel.access.from_boundary", { distance: formatDistance(record.sewermain_m) }, `${formatDistance(record.sewermain_m)} from boundary`) : null,
    record.sewermain_installed ? t("parcel.access.installed", { year: record.sewermain_installed }, `installed ${record.sewermain_installed}`) : null,
  ].filter(Boolean);
  rows.push({
    id: "sewermain",
    label: t("parcel.access.sewermain", {}, "Nearest sewer main"),
    value: record.sewermain_m === undefined
      ? none(1000)
      : [record.sewermain_mm ? `${record.sewermain_mm} mm` : formatDistance(record.sewermain_m), sewerKind].filter(Boolean).join(" "),
    sub: sewerParts.join(" · "),
    share: null,
    provenance: source("City of Hamilton Sewermain"),
  });
  rows.push({
    id: "lift_station",
    label: t("parcel.access.lift_station", {}, "Nearest sewer lift station"),
    value: formatDistance(record.lift_station_m) ?? none(25000),
    sub: "",
    share: null,
    provenance: source("City of Hamilton Sewer Lift Station"),
  });
  if (record.pressure_district) {
    rows.push({
      id: "pressure_district",
      label: t("parcel.access.pressure_district", {}, "Water pressure district"),
      value: record.pressure_district,
      sub: "",
      share: null,
      provenance: { ...source("City of Hamilton Water Pressure District"), joinText: t("parcel.access.method_point", {}, "Parcel point inside the district") },
    });
  }
  rows.push({
    id: "traffic",
    label: t("parcel.access.traffic", {}, "Traffic on nearest counted street"),
    value: record.counted_street_adt !== undefined
      ? t("parcel.access.traffic_value", { n: record.counted_street_adt.toLocaleString("en-CA") }, `${record.counted_street_adt.toLocaleString("en-CA")} vehicles a day`)
      : t("parcel.access.no_count", {}, "No count within 60 m"),
    sub: record.counted_street_adt !== undefined
      ? t("parcel.access.traffic_sub", { year: record.counted_street_year, distance: formatDistance(record.counted_street_m) }, `all vehicles, ${record.counted_street_year} count · ${formatDistance(record.counted_street_m)} away`)
      : "",
    share: null,
    provenance: { ...source("City of Hamilton Average Daily Traffic Count"), joinText: t("parcel.access.method_count", {}, "Nearest counted street segment within 60 m of the boundary") },
  });

  return {
    rows,
    caveat: t("parcel.access.caveat", {}, "Distances are measured from the parcel boundary. Near is not connected or served, and pipe size is not spare capacity. Counts are all vehicles, not trucks."),
  };
}
