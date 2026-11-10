/* Loads content/ through the export-shaped interface (spec B section 7.1):
 * read manifest.json, verify each record's SHA-256, parse, then validate
 * values against the pinned MAKE vocabulary and HeavyMap's labels.
 * Every problem is collected, and the build fails closed on any of them. */

import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export class ContentError extends Error {
  constructor(problems) {
    super(
      `content/ has ${problems.length} problem(s):\n- ${problems.join("\n- ")}`,
    );
    this.problems = problems;
  }
}

const ITEM_TYPES = ["news", "finding", "documentation", "editorial"];
const STATUSES = ["draft", "preview", "published", "retired"];

export function loadContent(dir, { includePreview = false } = {}) {
  const problems = [];
  const manifest = JSON.parse(
    fs.readFileSync(path.join(dir, "manifest.json"), "utf8"),
  );
  if (manifest.schema !== 1)
    throw new ContentError([
      `manifest schema ${manifest.schema} is not supported`,
    ]);

  const listed = new Set();
  const byKind = {};
  for (const rec of manifest.records) {
    listed.add(rec.path);
    let buf;
    try {
      buf = fs.readFileSync(path.join(dir, rec.path));
    } catch {
      problems.push(`${rec.path}: listed in the manifest but missing`);
      continue;
    }
    const actual = createHash("sha256").update(buf).digest("hex");
    if (actual !== rec.sha256) {
      problems.push(
        `${rec.path}: hash does not match the manifest (rerun build/content-manifest.mjs after a reviewed edit)`,
      );
      continue;
    }
    (byKind[rec.kind] ??= []).push({ path: rec.path, data: JSON.parse(buf) });
  }
  const one = (kind) => byKind[kind]?.[0]?.data;
  const regions = one("regions")?.regions ?? [];
  const themes = one("themes");
  const vocab = one("vocab");
  const labels = one("labels");
  if (!vocab || !labels || !regions.length || !themes) {
    throw new ContentError([
      ...problems,
      "manifest must list regions, themes, vocab and labels",
    ]);
  }

  const items = new Map();
  for (const { path: p, data } of byKind.item ?? []) {
    if (items.has(data.id)) problems.push(`${p}: duplicate item id ${data.id}`);
    items.set(data.id, data);
  }
  const editions = new Map(
    (byKind.edition ?? []).map(({ data }) => [data.key, data]),
  );

  for (const item of items.values())
    problems.push(...validateItem(item, { vocab, labels, regions }));
  for (const ed of editions.values())
    problems.push(...validateEdition(ed, { items, regions }));
  if (problems.length) throw new ContentError(problems);

  const visible = (s) =>
    s === "published" || (includePreview && s === "preview");
  return {
    regions,
    themes,
    vocab,
    labels,
    snapshot: one("snapshot") ?? null,
    items: new Map([...items].filter(([, it]) => visible(it.status))),
    retired: new Map([...items].filter(([, it]) => it.status === "retired")),
    editions: new Map([...editions].filter(([, ed]) => visible(ed.status))),
  };
}

/** Problems with one item, as strings naming the item and field. */
export function validateItem(item, { vocab, labels, regions }) {
  const out = [];
  const at = (field, msg) =>
    out.push(`${item.id ?? "(no id)"} ${field}: ${msg}`);
  const inVocab = (field, value, list, labelTable) => {
    if (value == null) return;
    if (!list.includes(value))
      at(field, `"${value}" is not in MAKE controlled-values`);
    else if (labelTable && !(value in labelTable))
      at(field, `"${value}" has no label in labels.json`);
  };
  for (const f of [
    "id",
    "type",
    "title",
    "summary",
    "regions",
    "publisher",
    "status",
  ]) {
    if (item[f] == null || item[f] === "") at(f, "required");
  }
  if (!ITEM_TYPES.includes(item.type))
    at("type", `"${item.type}" is not an item type`);
  if (!STATUSES.includes(item.status))
    at("status", `"${item.status}" is not a status`);
  if (item.status === "published" && !item.published_on)
    at("published_on", "required when published");
  const regionIds = new Set(regions.map((r) => r.id));
  for (const r of item.regions ?? [])
    if (r !== "heavymap" && !regionIds.has(r))
      at("regions", `unknown region ${r}`);

  if (item.type === "news") {
    if (!/^IEVT-\d{4}-\d{6}$/.test(item.id))
      at("id", "news IDs are upstream IEVT-YYYY-NNNNNN");
    if (!item.reported_on) at("reported_on", "required");
    inVocab("stage", item.stage, vocab.stages, labels.stages);
    inVocab("lane", item.lane, vocab.lanes, labels.lanes);
    if (item.lane === "excluded")
      at("lane", "excluded never reaches public pages");
    inVocab(
      "event_type",
      item.event_type,
      vocab.event_types,
      labels.event_types,
    );
    inVocab(
      "money.amount_type",
      item.money?.amount_type,
      vocab.amount_types,
      labels.amount_types,
    );
    inVocab(
      "incentive.type",
      item.incentive?.type,
      vocab.incentive_types,
      labels.incentive_types,
    );
    for (const fl of item.flags ?? [])
      inVocab("flags", fl.type, vocab.flag_types, labels.flags);
    if (!item.sources?.length) at("sources", "news needs at least one source");
    for (const s of item.sources ?? []) {
      if (s.kind != null && !(s.kind in labels.source_kinds))
        at("sources.kind", `"${s.kind}" has no label`);
    }
  }
  return out;
}

export function validateEdition(ed, { items, regions }) {
  const out = [];
  const at = (msg) => out.push(`edition ${ed.key}: ${msg}`);
  if (!regions.some((r) => r.id === ed.desk)) at(`unknown desk ${ed.desk}`);
  for (const id of ed.items ?? []) {
    const it = items.get(id);
    if (!it) at(`item ${id} is not in content/items`);
    else if (!(it.editions ?? []).includes(ed.key))
      at(`item ${id} does not list this edition`);
    else if (ed.status === "published" && it.status !== "published")
      at(`item ${id} is ${it.status} in a published edition`);
  }
  for (const m of ed.mentions ?? []) {
    for (const ev of m.events)
      if (!ed.items.includes(ev))
        at(`mention ${m.name} points outside the edition (${ev})`);
  }
  return out;
}
