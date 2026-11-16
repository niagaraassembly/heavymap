/* Pure summary of one schema 2 Industrial Atlas parcel record for the
 * card and drawer (parcel-views design §5.5).
 *
 * No DOM and no wording of its own: every shown word comes through the
 * label lookup supplied by the caller. The record itself carries tokens
 * and provenance only.
 *
 * `sources` is the release manifest's `sources` map (the fourth, optional
 * argument). The "checked against" set is derived from it: every overlay
 * source in the manifest except the three Land layers, each marked inside
 * or not in from the parcel's own rows. Without it the checked set cannot
 * be known, so the summary says so instead of guessing.
 */

import { formatAreaShare } from "./contract.js";

/* The three Land layers of the D-070 release. Everything else the overlay
 * run covers is a checked layer; the set comes from the manifest, not a
 * list written here. */
const LAND_LAYERS = {
  zoning: "LYR-HAM-ZONING",
  planUse: "LYR-HAM-SECONDARY-PLAN-LAND-USE",
  boundary: ["LYR-HAM-URBAN-BOUNDARY", "LYR-HAM-RURAL-BOUNDARY"],
};
const LAND_LAYER_IDS = new Set([
  LAND_LAYERS.zoning,
  LAND_LAYERS.planUse,
  ...LAND_LAYERS.boundary,
]);

const label = (labels, key, params = {}, fallback = key) => {
  const result = labels?.lookup?.(key, params);
  return result && !result.missing ? result.text : fallback;
};

const STREET_ABBR = {
  STREET: "St",
  ST: "St",
  AVENUE: "Ave",
  AVE: "Ave",
  AV: "Ave",
  CRESCENT: "Cres",
  CRES: "Cres",
  ROAD: "Rd",
  RD: "Rd",
  DRIVE: "Dr",
  DR: "Dr",
  BOULEVARD: "Blvd",
  BLVD: "Blvd",
  LANE: "Ln",
  LN: "Ln",
  COURT: "Ct",
  CT: "Ct",
  PLACE: "Pl",
  PL: "Pl",
  PARKWAY: "Pkwy",
  PKWY: "Pkwy",
  HIGHWAY: "Hwy",
  HWY: "Hwy",
  TERRACE: "Ter",
  TER: "Ter",
  CIRCLE: "Cir",
  CIR: "Cir",
  SQUARE: "Sq",
  SQ: "Sq",
  TRAIL: "Trail",
  WAY: "Way",
};

function titleWord(word) {
  if (/^\d/.test(word)) return word;
  const upper = word.toUpperCase();
  if (STREET_ABBR[upper]) return STREET_ABBR[upper];
  if (/^[NSEW]$/.test(upper)) return upper;
  return upper.charAt(0) + upper.slice(1).toLowerCase();
}

/** "155 MOORE CRESCENT, ANCASTER" -> "155 Moore Cres, Ancaster". */
export function formatStreetTitle(text) {
  return String(text)
    .split(",")
    .map((part) =>
      part
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map(titleWord)
        .join(" "),
    )
    .join(", ");
}

/** A 15-digit Ontario roll number groups 4-3-3-5; anything else is shown as-is. */
export function formatArn(arn) {
  const digits = String(arn ?? "").replace(/\D/g, "");
  if (digits.length !== 15) return String(arn ?? "");
  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 10)} ${digits.slice(10)}`;
}

const round2 = (n) => Math.round(n * 100) / 100;

/** Square metres with hectares and acres, each to two decimals. */
export function formatArea(m2) {
  return { m2, ha: round2(m2 / 10000), acres: round2(m2 * 0.000247105) };
}

const shortKey = (key) => key.slice(-7);

function layerName(labels, layer) {
  return label(labels, `layers.${layer}.name`, {}, layer);
}

function landRow(labels, row) {
  const isBoundary = LAND_LAYERS.boundary.includes(row.layer);
  return {
    layer: row.layer,
    class: row.class,
    value: isBoundary
      ? label(labels, `parcel.setting.${row.class}`, {}, row.class)
      : row.class,
    share: row.share,
    shareText:
      row.share === 1
        ? label(labels, "parcel.share.whole", {}, "whole parcel")
        : formatAreaShare(row.share, row.area_m2),
    areaM2: row.area_m2,
  };
}

function sourceList(labels, entries) {
  const seen = new Map();
  for (const [id, paths] of entries) {
    if (!id) continue;
    const hit = seen.get(id) ?? { id, label: label(labels, `dossier.source.${id}`, {}, id), paths: [] };
    for (const p of paths) if (!hit.paths.includes(p)) hit.paths.push(p);
    seen.set(id, hit);
  }
  return [...seen.values()];
}

/**
 * Summarise one schema 2 core record and its optional detail record.
 * `labels` is the result of `createLabels`/`loadLabels`; `sources` is the
 * release manifest's `sources` map.
 */
export function summariseRecord(core, detail, labels, { sources } = {}) {
  if (!core || typeof core.key !== "string" || !core.key.startsWith("ia:")) {
    throw new TypeError("A schema 2 Industrial Atlas core record is required");
  }
  const key = core.key;
  const detailAddresses = detail?.addresses_full;
  const fullAddresses = detailAddresses ?? core.addresses.items;
  const addressesComplete = detailAddresses ? true : core.addresses.complete;
  const validRoll = core.roll.filter((item) => item.arn && item.flag !== "placeholder");
  const roll = validRoll[0] ?? null;

  const streetPart = (text) => String(text ?? "").split(",")[0].trim();
  const titleSource = roll?.roll_address ?? fullAddresses[0]?.text;
  const title = titleSource
    ? formatStreetTitle(streetPart(titleSource))
    : `${label(labels, "dossier.field.parcel", {}, "Parcel")} ${shortKey(key)}`;
  const locality = fullAddresses[0]?.text.includes(",")
    ? formatStreetTitle(fullAddresses[0].text.split(",").slice(1).join(",").trim())
    : null;
  const jurisdiction = label(labels, "dossier.jurisdiction.hamilton", {}, "City of Hamilton, Ontario");
  const addressCount = core.addresses.count;
  const subtitle = [
    locality,
    jurisdiction,
    addressCount > 1
      ? label(labels, "parcel.addresses_count", { n: addressCount }, `${addressCount} addresses`)
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const rows = core.overlays.rows;
  const slivers = rows.filter((row) => row.sliver);
  const whole = rows.filter((row) => !row.sliver);
  const byShare = (a, b) => b.share - a.share;
  const zoning = whole
    .filter((row) => row.layer === LAND_LAYERS.zoning)
    .sort(byShare)
    .map((row) => landRow(labels, row));
  const planUse = whole
    .filter((row) => row.layer === LAND_LAYERS.planUse)
    .sort(byShare)
    .map((row) => landRow(labels, row));
  const boundary = whole
    .filter((row) => LAND_LAYERS.boundary.includes(row.layer))
    .sort(byShare)
    .map((row) => landRow(labels, row));

  const checkedAgainst = [];
  let checkedAgainstIncomplete = false;
  if (sources && typeof sources === "object") {
    for (const [layer, entry] of Object.entries(sources)) {
      if (!entry || typeof entry !== "object" || !("band" in entry)) continue;
      if (LAND_LAYER_IDS.has(layer)) continue;
      checkedAgainst.push({
        layer,
        name: layerName(labels, layer),
        inside: rows.some((row) => row.layer === layer),
      });
    }
  } else {
    checkedAgainstIncomplete = true;
  }
  const firstRegulated = checkedAgainst.find((row) => row.inside) ?? null;

  const coverageText = label(
    labels,
    `states.coverage.${core.coverage.status}`,
    { n: validRoll.length },
    core.coverage.status,
  );

  const sourceEntries = [
    [core.area.src, ["/area/value"]],
    [core.coverage.src, ["/coverage/status"]],
    ...core.roll
      .map((item, i) => ({ item, i }))
      .filter(({ item }) => item.arn && item.flag !== "placeholder")
      .map(({ item, i }) => [item.src, [`/roll/${i}/arn`]]),
    [core.addresses.src, fullAddresses.map((_, i) => `/addresses/items/${i}`)],
    [core.overlays.src, rows.map((_, i) => `/overlays/rows/${i}`)],
  ];
  const sourcesSummary = sourceList(labels, sourceEntries);

  return {
    key,
    shortKey: shortKey(key),
    title,
    subtitle,
    area: formatArea(core.area.value),
    land: { zoning, planUse, boundary },
    setting: {
      boundary: boundary[0]?.class ?? null,
      boundaryText: boundary[0]?.value ?? label(labels, "parcel.none_found", {}, "None found"),
      regulated: firstRegulated,
      regulatedText: firstRegulated
        ? firstRegulated.name
        : label(labels, "parcel.setting.no_regulated", {}, "No regulated areas found"),
    },
    gaps: { count: core.gaps.length, ids: [...core.gaps] },
    coverage: { status: core.coverage.status, text: coverageText },
    roll: roll
      ? {
          arn: roll.arn,
          arnText: formatArn(roll.arn),
          match: roll.grade,
          matchText: label(labels, `dossier.grade.${roll.grade}`, {}, roll.grade),
        }
      : null,
    addresses: {
      count: addressCount,
      countText: label(labels, "parcel.addresses_count", { n: addressCount }, `${addressCount} addresses`),
      shown: fullAddresses.map((a) => ({ id: a.id, text: a.text })),
      complete: addressesComplete,
    },
    checkedAgainst,
    checkedAgainstIncomplete,
    attention: {
      gaps: { count: core.gaps.length, items: core.gaps.map((id) => ({ id })) },
      slivers: {
        count: slivers.length,
        items: slivers.map((row) => ({
          layer: row.layer,
          name: layerName(labels, row.layer),
          class: row.class,
          share: row.share,
          shareText: formatAreaShare(row.share, row.area_m2),
          areaM2: row.area_m2,
        })),
      },
      notYet: {
        count: 3,
        items: ["retrieved_on", "licence", "archive_reference"].map((field) => ({
          label: label(labels, `dossier.stamp.${field}`, {}, field.replaceAll("_", " ")),
          value: label(labels, "dossier.provenance.not_yet_captured", {}, "Not yet captured"),
        })),
      },
      sources: { count: sourcesSummary.length, items: sourcesSummary },
    },
  };
}
