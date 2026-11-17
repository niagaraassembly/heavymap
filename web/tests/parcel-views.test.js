import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createLabels } from "../src/labels.js";
import {
  formatArn,
  formatArea,
  formatStreetTitle,
  summariseRecord,
} from "../src/parcel-summary.js";

const LABELS_DIR = path.resolve(import.meta.dirname, "../../labels");

/** Labels as the site loads them, straight from labels/*.en.json. */
function testLabels() {
  const entries = { en: {} };
  for (const file of fs.readdirSync(LABELS_DIR).filter((n) => n.endsWith(".en.json"))) {
    const doc = JSON.parse(fs.readFileSync(path.join(LABELS_DIR, file), "utf8"));
    Object.assign(entries.en, doc.entries);
  }
  return createLabels({ entries });
}

/** Manifest overlay sources for the D-070 release (band-carrying entries only). */
const SOURCES = {
  "LYR-HAM-PARCEL": { title: "Hamilton Assessment Parcel" },
  "LYR-HAM-ADDRESSES": { title: "Addresses" },
  "LYR-NPCA-ASSESSMENT-PARCELS-TEST": { title: "Assessment_Parcels_Test" },
  "LYR-HAM-ZONING": { band: "land_use" },
  "LYR-LIO-GREENBELT-DESIGNATION": { band: "land_use" },
  "LYR-LIO-NEP-DESIGNATION": { band: "land_use" },
  "LYR-HAM-NEP-DEVELOPMENT-CONTROL": { band: "constraints" },
  "LYR-NPCA-APPROX-REGULATION-LANDS": { band: "constraints" },
  "LYR-HCA-REGULATED-AREAS": { band: "constraints" },
  "LYR-GRCA-REGULATION-LIMITS-WATERLOO": { band: "constraints" },
  "LYR-HAM-SECONDARY-PLAN-LAND-USE": { band: "land_use" },
  "LYR-HAM-EMPLOYMENT-LANDS": { band: "land_use" },
  "LYR-HAM-URBAN-BOUNDARY": { band: "land_use" },
  "LYR-HAM-RURAL-BOUNDARY": { band: "land_use" },
};

const KEY = "ia:ca:on:hamilton:parcel:01M54B6GD9XTMCH94PJVGFN000";

function typicalCore(overrides = {}) {
  return {
    key: KEY,
    area: { value: 608.3, unit: "m2", crs: "EPSG:26917", src: "LYR-HAM-PARCEL", join: "registry_geometry", conf: "high" },
    coverage: { status: "has_arn", provisional: false, grade: "exact_1to1", src: "LYR-NPCA-ASSESSMENT-PARCELS-TEST", join: "exact_1to1", conf: "high" },
    roll: [
      { arn: "251814032071153", grade: "exact_1to1", method: "representative_point", iou: 0.9987, src: "LYR-NPCA-ASSESSMENT-PARCELS-TEST", join: "exact_1to1", conf: "high", roll_address: "155 MOORE CRES" },
    ],
    addresses: {
      src: "LYR-HAM-ADDRESSES",
      join: "point_in_polygon",
      count: 1,
      complete: true,
      items: [
        { id: "ia:ca:on:hamilton:address:01M54B89ZR50ESQFJTBEW03A59", text: "155 MOORE CRESCENT, ANCASTER", unit: "", join: "pip", conf: "high" },
      ],
    },
    overlays: {
      src: "heavymap-overlays:20261017-val2-ia1",
      join: "area_share",
      row_count: 3,
      rows: [
        { layer: "LYR-HAM-ZONING", class: "R4-394", share: 1.0, area_m2: 608.3 },
        { layer: "LYR-HAM-SECONDARY-PLAN-LAND-USE", class: "Low Density Residential 1", share: 0.9985, area_m2: 607.4 },
        { layer: "LYR-HAM-URBAN-BOUNDARY", class: "urban", share: 1.0, area_m2: 608.3 },
      ],
      sliver_count: 0,
    },
    gaps: ["GAP-0001", "GAP-0002"],
    ...overrides,
  };
}

const typicalDetail = {
  addresses_full: [
    { id: "ia:ca:on:hamilton:address:01M54B89ZR50ESQFJTBEW03A59", text: "155 MOORE CRESCENT, ANCASTER", unit: "", join: "pip", conf: "high" },
  ],
  feature_ids: {},
};

const summarise = (core, detail = typicalDetail, sources = SOURCES) =>
  summariseRecord(core, detail, testLabels(), { sources });

test("street titles: title case with the street type abbreviated", () => {
  assert.equal(formatStreetTitle("155 MOORE CRESCENT, ANCASTER"), "155 Moore Cres, Ancaster");
  assert.equal(formatStreetTitle("155 MOORE CRES"), "155 Moore Cres");
  assert.equal(formatStreetTitle("110 STONEY BROOK DRIVE"), "110 Stoney Brook Dr");
  assert.equal(formatStreetTitle("100 MAIN STREET WEST"), "100 Main St West");
  assert.equal(formatStreetTitle("2 KING STREET EAST, DUNDAS"), "2 King St East, Dundas");
});

test("roll numbers group 4-3-3-5", () => {
  assert.equal(formatArn("251814032071153"), "2518 140 320 71153");
  assert.equal(formatArn(""), "");
});

test("area converts to hectares and acres", () => {
  assert.deepEqual(formatArea(8440), { m2: 8440, ha: 0.84, acres: 2.09 });
  assert.deepEqual(formatArea(608.3), { m2: 608.3, ha: 0.06, acres: 0.15 });
});

test("typical parcel: title from the roll address, card facts, drawer tiles", () => {
  const s = summarise(typicalCore());
  assert.equal(s.key, KEY);
  assert.equal(s.title, "155 Moore Cres");
  assert.equal(s.subtitle, "Ancaster · City of Hamilton, Ontario");
  assert.deepEqual(s.area, { m2: 608.3, ha: 0.06, acres: 0.15 });
  assert.equal(s.land.zoning[0].class, "R4-394");
  assert.equal(s.land.zoning[0].shareText, "whole parcel");
  assert.equal(s.land.planUse[0].class, "Low Density Residential 1");
  assert.equal(s.land.planUse[0].shareText, "99.9%");
  assert.equal(s.setting.boundary, "urban");
  assert.equal(s.setting.boundaryText, "Urban area");
  assert.equal(s.setting.regulated, null);
  assert.equal(s.setting.regulatedText, "No regulated areas found");
  assert.equal(s.gaps.count, 2);
  assert.deepEqual(s.gaps.ids, ["GAP-0001", "GAP-0002"]);
  assert.equal(s.roll.arnText, "2518 140 320 71153");
  assert.equal(s.roll.matchText, "One-to-one match");
  assert.equal(s.addresses.count, 1);
  assert.equal(s.addresses.countText, "1 address");
  assert.equal(s.addresses.shown[0].text, "155 MOORE CRESCENT, ANCASTER");
  assert.equal(s.checkedAgainst.length, 7);
  assert.ok(s.checkedAgainst.every((row) => row.inside === false));
  assert.deepEqual(
    s.checkedAgainst.map((row) => row.layer),
    [
      "LYR-LIO-GREENBELT-DESIGNATION",
      "LYR-LIO-NEP-DESIGNATION",
      "LYR-HAM-NEP-DEVELOPMENT-CONTROL",
      "LYR-NPCA-APPROX-REGULATION-LANDS",
      "LYR-HCA-REGULATED-AREAS",
      "LYR-GRCA-REGULATION-LIMITS-WATERLOO",
      "LYR-HAM-EMPLOYMENT-LANDS",
    ],
  );
  assert.equal(s.attention.gaps.count, 2);
  assert.equal(s.attention.slivers.count, 0);
  assert.equal(s.attention.notYet.count, 3);
  assert.equal(s.attention.sources.count, 4);
});

test("no address: title falls back to Parcel plus the short key", () => {
  const core = typicalCore({
    roll: [],
    coverage: { status: "has_arn", provisional: false, grade: "exact_1to1", src: "LYR-NPCA-ASSESSMENT-PARCELS-TEST", join: "exact_1to1", conf: "high" },
    addresses: { src: "LYR-HAM-ADDRESSES", join: "point_in_polygon", count: 0, complete: true, items: [] },
  });
  const s = summarise(core, { addresses_full: [], feature_ids: {} });
  assert.equal(s.title, "Parcel VGFN000");
  assert.equal(s.subtitle, "City of Hamilton, Ontario");
  assert.equal(s.addresses.count, 0);
  assert.equal(s.addresses.countText, "0 addresses");
});

test("not covered by the roll: no roll number, coverage text stands in", () => {
  const core = typicalCore({
    coverage: { status: "not_covered", provisional: true, grade: "not_in_coverage", src: "LYR-NPCA-ASSESSMENT-PARCELS-TEST", join: "not_in_coverage", conf: "high" },
    roll: [],
    gaps: ["GAP-0010"],
  });
  const s = summarise(core);
  assert.equal(s.roll, null);
  assert.equal(s.coverage.status, "not_covered");
  assert.equal(s.coverage.text, "Not covered by NPCA roll data (provisional)");
  assert.equal(s.title, "155 Moore Cres");
  assert.deepEqual(s.gaps.ids, ["GAP-0010"]);
});

test("several zoning classes: largest first, the rest behind +N more", () => {
  const core = typicalCore({
    overlays: {
      src: "heavymap-overlays:20261017-val2-ia1",
      join: "area_share",
      row_count: 5,
      rows: [
        { layer: "LYR-HAM-ZONING", class: "C2", share: 0.5, area_m2: 304.15 },
        { layer: "LYR-HAM-ZONING", class: "R4-394", share: 0.3, area_m2: 182.49 },
        { layer: "LYR-HAM-ZONING", class: "M1", share: 0.2, area_m2: 121.66 },
        { layer: "LYR-HAM-SECONDARY-PLAN-LAND-USE", class: "Commercial", share: 0.6, area_m2: 364.98 },
        { layer: "LYR-HAM-SECONDARY-PLAN-LAND-USE", class: "Mixed Use", share: 0.4, area_m2: 243.32 },
        { layer: "LYR-HAM-URBAN-BOUNDARY", class: "urban", share: 1.0, area_m2: 608.3 },
      ],
      sliver_count: 0,
    },
  });
  const s = summarise(core);
  assert.deepEqual(s.land.zoning.map((r) => r.class), ["C2", "R4-394", "M1"]);
  assert.equal(s.land.zoning[0].shareText, "50.0%");
  assert.deepEqual(s.land.planUse.map((r) => r.class), ["Commercial", "Mixed Use"]);
});

test("slivers are separated from the land rows into minor overlaps", () => {
  const core = typicalCore({
    overlays: {
      src: "heavymap-overlays:20261017-val2-ia1",
      join: "area_share",
      row_count: 4,
      rows: [
        { layer: "LYR-HAM-ZONING", class: "R4-394", share: 1.0, area_m2: 608.3 },
        { layer: "LYR-HAM-SECONDARY-PLAN-LAND-USE", class: "Low Density Residential 1", share: 0.9985, area_m2: 607.4 },
        { layer: "LYR-HAM-URBAN-BOUNDARY", class: "urban", share: 1.0, area_m2: 608.3 },
        { layer: "LYR-HCA-REGULATED-AREAS", class: "Regulated", share: 0.0004, area_m2: 0.24, sliver: true },
      ],
      sliver_count: 1,
    },
  });
  const s = summarise(core);
  assert.equal(s.land.planUse.length, 1);
  assert.equal(s.attention.slivers.count, 1);
  assert.equal(s.attention.slivers.items[0].layer, "LYR-HCA-REGULATED-AREAS");
  assert.equal(s.attention.slivers.items[0].shareText, "below 0.1%");
  // A sliver-only intersection still counts as inside for the checked layer.
  const hca = s.checkedAgainst.find((row) => row.layer === "LYR-HCA-REGULATED-AREAS");
  assert.equal(hca.inside, true);
  assert.equal(s.setting.regulated.layer, "LYR-HCA-REGULATED-AREAS");
});

test("900+ addresses: the full list survives, the card counts them", () => {
  const items = Array.from({ length: 947 }, (_, i) => ({
    id: `ia:ca:on:hamilton:address:01M54B89ZR50ESQFJTBEW${String(i).padStart(5, "0")}`,
    text: `${100 + i} MAIN STREET WEST, HAMILTON`,
    unit: "",
    join: "pip",
    conf: "high",
  }));
  const core = typicalCore({
    addresses: { src: "LYR-HAM-ADDRESSES", join: "point_in_polygon", count: 947, complete: false, items: items.slice(0, 5) },
  });
  const s = summarise(core, { addresses_full: items, feature_ids: {} });
  assert.equal(s.addresses.count, 947);
  assert.equal(s.addresses.countText, "947 addresses");
  assert.equal(s.addresses.shown.length, 947);
  assert.equal(s.addresses.complete, true);
  assert.equal(s.subtitle, "Hamilton · City of Hamilton, Ontario · 947 addresses");
  assert.equal(s.title, "155 Moore Cres");
});

test("without a detail record the core address list is partial, and says so", () => {
  const core = typicalCore({
    addresses: { src: "LYR-HAM-ADDRESSES", join: "point_in_polygon", count: 63, complete: false, items: [] },
  });
  const s = summarise(core, null);
  assert.equal(s.addresses.count, 63);
  assert.equal(s.addresses.shown.length, 0);
  assert.equal(s.addresses.complete, false);
});

test("a record with no overlay rows names the absence plainly", () => {
  const core = typicalCore({
    overlays: { src: "heavymap-overlays:20261017-val2-ia1", join: "area_share", row_count: 0, rows: [], sliver_count: 0 },
  });
  const s = summarise(core);
  assert.equal(s.land.zoning.length, 0);
  assert.equal(s.land.planUse.length, 0);
  assert.equal(s.setting.boundary, null);
  assert.equal(s.setting.boundaryText, "None found");
  assert.equal(s.setting.regulatedText, "No regulated areas found");
  assert.ok(s.checkedAgainst.every((row) => row.inside === false));
});

test("workspace facts: one row per record fact, each with its provenance", () => {
  const s = summarise(typicalCore());
  assert.equal(s.locality, "Ancaster");
  assert.deepEqual(
    s.facts.map((f) => f.id),
    ["area", "roll", "zoning", "plan_use", "boundary", "constraints"],
  );
  const area = s.facts[0];
  assert.equal(area.label, "Area");
  assert.equal(area.value, "608.3 m²");
  assert.equal(area.sub, "0.06 ha · 0.15 acres");
  assert.equal(area.provenance.source, "LYR-HAM-PARCEL");
  assert.equal(area.provenance.sourceLabel, "Hamilton Assessment Parcel (City of Hamilton)");
  assert.equal(area.provenance.joinText, "Area of the City parcel polygon (EPSG:26917)");
  assert.equal(area.provenance.confText, "one-to-one or point-in-polygon join on current sources");
  const roll = s.facts[1];
  assert.equal(roll.value, "2518 140 320 71153");
  assert.equal(roll.sub, "One-to-one match");
  assert.equal(roll.provenance.source, "LYR-NPCA-ASSESSMENT-PARCELS-TEST");
  assert.equal(roll.provenance.joinText, "exact one-to-one roll match");
  const zoning = s.facts[2];
  assert.equal(zoning.value, "R4-394");
  assert.equal(zoning.sub, "whole parcel");
  assert.equal(zoning.share, 1);
  assert.equal(zoning.provenance.joinText, "share of parcel area");
  assert.equal(zoning.provenance.confText, "");
  const constraints = s.facts[5];
  assert.equal(constraints.value, "None found in the 7 regulation layers checked");
  assert.equal(constraints.sub, "");
});

test("workspace facts: a regulated parcel names the layer that contains it", () => {
  const core = typicalCore({
    overlays: {
      src: "heavymap-overlays:20261017-val2-ia1",
      join: "area_share",
      row_count: 4,
      rows: [
        { layer: "LYR-HAM-ZONING", class: "R4-394", share: 1.0, area_m2: 608.3 },
        { layer: "LYR-HAM-SECONDARY-PLAN-LAND-USE", class: "Low Density Residential 1", share: 0.9985, area_m2: 607.4 },
        { layer: "LYR-HAM-URBAN-BOUNDARY", class: "urban", share: 1.0, area_m2: 608.3 },
        { layer: "LYR-HCA-REGULATED-AREAS", class: "Regulated", share: 0.0004, area_m2: 0.24, sliver: true },
      ],
      sliver_count: 1,
    },
  });
  const s = summarise(core);
  const constraints = s.facts.find((f) => f.id === "constraints");
  assert.equal(constraints.value, "HCA regulated area");
  assert.equal(constraints.sub, "inside");
});

test("workspace facts: no roll number, the coverage text stands in with its provenance", () => {
  const core = typicalCore({
    coverage: { status: "not_covered", provisional: true, grade: "not_in_coverage", src: "LYR-NPCA-ASSESSMENT-PARCELS-TEST", join: "not_in_coverage", conf: "high" },
    roll: [],
    gaps: ["GAP-0010"],
  });
  const s = summarise(core);
  const roll = s.facts.find((f) => f.id === "roll");
  assert.equal(roll.value, "Not covered by NPCA roll data (provisional)");
  assert.equal(roll.provenance.source, "LYR-NPCA-ASSESSMENT-PARCELS-TEST");
});

test("no address: the workspace has no locality for the breadcrumb", () => {
  const core = typicalCore({
    roll: [],
    coverage: { status: "has_arn", provisional: false, grade: "exact_1to1", src: "LYR-NPCA-ASSESSMENT-PARCELS-TEST", join: "exact_1to1", conf: "high" },
    addresses: { src: "LYR-HAM-ADDRESSES", join: "point_in_polygon", count: 0, complete: true, items: [] },
  });
  const s = summarise(core, { addresses_full: [], feature_ids: {} });
  assert.equal(s.locality, null);
});

test("checked-against needs the manifest sources; without them it says so", () => {
  const s = summariseRecord(typicalCore(), typicalDetail, testLabels());
  assert.deepEqual(s.checkedAgainst, []);
  assert.equal(s.checkedAgainstIncomplete, true);
});

test("a bad core record is refused, not rendered", () => {
  assert.throws(() => summariseRecord(null, null, testLabels()), TypeError);
  assert.throws(() => summariseRecord({ key: "hm:old" }, null, testLabels()), TypeError);
});
