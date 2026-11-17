/* Hamilton permit viewer adapter for the versioned Atlas field-screen package.
 * This is a provisional consumer of viewer package 0.2; it does not alter the
 * parcel dossier contract. The package is pinned by hashes in its manifest. */

import { sha256Hex } from "./hash.js";
import { el } from "./dossier.js";

const RECORDS_FILE = "viewer_development_records_v0.2.json";
const INDICATORS_FILE = "parcel_development_indicators_v0.2.json";
const SNAPSHOT_FILE = "city_development_snapshot_v0.1.json";
const MANIFEST_FILE = "development_release_manifest.json";
const DEFAULT_FETCH = async (url) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: ${response.status}`);
  return new Uint8Array(await response.arrayBuffer());
};
const parse = (bytes) => JSON.parse(new TextDecoder().decode(bytes));

export function createHamiltonDevelopmentLoader({
  base,
  fetchBytes = DEFAULT_FETCH,
  onReport = () => {},
}) {
  const root = base.endsWith("/") ? base : `${base}/`;
  let indicators = null;
  let records = null;
  let manifest = null;
  let snapshot = null;

  async function pin() {
    try {
      const bytes = await fetchBytes(`${root}${MANIFEST_FILE}`);
      const doc = parse(bytes);
      if (!new Set(["hamilton-development-release-manifest/0.2.0", "hamilton-development-release-manifest/0.3.0"]).has(doc.schema_version) || doc.jurisdiction !== "ca/on/hamilton")
        throw new Error("Unsupported Hamilton development package.");
      manifest = doc;
      const indicatorBytes = await fetchBytes(`${root}${INDICATORS_FILE}`);
      if (await sha256Hex(indicatorBytes) !== doc.outputs[INDICATORS_FILE])
        throw new Error("Hamilton parcel indicators failed hash verification.");
      indicators = parse(indicatorBytes);
      if (indicators.schema_version !== "hamilton-parcel-development-indicators/0.2.0" || indicators.jurisdiction !== doc.jurisdiction)
        throw new Error("Hamilton parcel indicators have an incompatible schema.");
      const result = {
        ok: true,
        recordCount: doc.record_count,
        focusCount: doc.focus_record_count,
        reportMonths: doc.report_months ?? [],
      };
      if (doc.activity_mosaic) result.activityMosaic = doc.activity_mosaic;
      return result;
    } catch (error) {
      manifest = null;
      indicators = null;
      onReport({ kind: "development_package_unavailable", detail: String(error) });
      return { ok: false, reason: "unavailable" };
    }
  }

  async function allRecords() {
    if (!manifest || !indicators) return { ok: false, reason: "not_pinned" };
    if (!records) {
      try {
        const bytes = await fetchBytes(`${root}${RECORDS_FILE}`);
        if (await sha256Hex(bytes) !== manifest.outputs[RECORDS_FILE])
          throw new Error("Hamilton development records failed hash verification.");
        const doc = parse(bytes);
        if (doc.schema_version !== "hamilton-development-viewer/0.2.0" || doc.jurisdiction !== manifest.jurisdiction || doc.record_count !== manifest.record_count || !Array.isArray(doc.records) || doc.records.length !== doc.record_count)
          throw new Error("Hamilton development records have an incompatible schema.");
        records = [...doc.records].sort((a, b) =>
          String(b.report_month).localeCompare(String(a.report_month)) ||
          String(b.source_fields?.permit_number?.value ?? "").localeCompare(String(a.source_fields?.permit_number?.value ?? ""), "en", { numeric: true }),
        );
      } catch (error) {
        onReport({ kind: "development_records_unavailable", detail: String(error) });
        return { ok: false, reason: "unavailable" };
      }
    }
    return { ok: true, records };
  }

  async function citySnapshot() {
    if (snapshot) return { ok: true, snapshot };
    if (!manifest) return { ok: false, reason: "not_pinned" };
    try {
      const bytes = await fetchBytes(`${root}${SNAPSHOT_FILE}`);
      if (await sha256Hex(bytes) !== manifest?.outputs?.[SNAPSHOT_FILE])
        throw new Error("Hamilton city snapshot failed hash verification.");
      const doc = parse(bytes);
      if (doc.schema_version !== "hamilton-city-development-snapshot/0.1.0" || doc.jurisdiction !== manifest.jurisdiction)
        throw new Error("Hamilton city snapshot has an incompatible schema.");
      snapshot = doc;
      return { ok: true, snapshot };
    } catch (error) {
      onReport({ kind: "development_snapshot_unavailable", detail: String(error) });
      return { ok: false, reason: "unavailable" };
    }
  }

  async function forParcel(parcelKey) {
    const link = indicators?.parcels?.[parcelKey];
    if (!link) return { ok: true, count: 0, records: [] };
    const result = await allRecords();
    if (!result.ok) return { ...result, count: link.development_record_count };
    const ids = new Set(link.development_record_ids);
    return {
      ok: true,
      count: link.development_record_count,
      records: result.records.filter((record) => ids.has(record.development_record_id)),
    };
  }

  function countForParcel(parcelKey) {
    return indicators?.parcels?.[parcelKey]?.development_record_count ?? 0;
  }

  return { pin, allRecords, citySnapshot, forParcel, countForParcel };
}

function displayTags(record, field) {
  return (record[field] ?? []).map((tag) => tag.label ?? tag.tag ?? String(tag)).join(" · ");
}
const FOCUS_SECTORS = new Set([
  "industrial", "light_industrial", "warehouse_logistics", "commercial",
  "commercial_retail", "commercial_office_professional", "commercial_hospitality_food",
  "residential_multi_unit",
]);
const permitNumber = (record) => record.source_fields?.permit_number?.value;
const uid = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
export const developmentRecordKey = (record) => `development-record:${record.development_record_id ?? permitNumber(record) ?? "unknown"}`;

export function developmentRecordSavedItem(record) {
  const sourceFields = record.source_fields ?? {};
  const key = developmentRecordKey(record);
  const address = sourceFields.location_text?.value ?? "Location not available";
  const sector = displayTags(record, "derived_sector_tags");
  return {
    id: key,
    kind: "development",
    key,
    title: permitNumber(record) || "Development permit",
    address,
    subtitle: [record.report_month, sector].filter(Boolean).join(" · "),
    source: "City of Hamilton building permit records",
    url: `/development/?record=${encodeURIComponent(record.development_record_id ?? permitNumber(record) ?? "")}`,
    savedAt: new Date().toISOString(),
  };
}

export function developmentRecordNote(record, text, parcelKey = null) {
  const sourceFields = record.source_fields ?? {};
  return {
    id: `development-note:${record.development_record_id ?? permitNumber(record) ?? uid()}:${uid()}`,
    parcelKey: parcelKey ?? record.parcel_ids?.[0] ?? null,
    developmentRecordId: record.development_record_id ?? null,
    layer: "Development records",
    row: sourceFields.location_text?.value ?? permitNumber(record) ?? "Permit record",
    field: permitNumber(record) ?? "Permit note",
    text: text.trim(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function createDevelopmentRecordDialog({ savedRecordIds = new Set(), onSaveRecord, onCreateNote } = {}) {
  const dialog = document.createElement("dialog");
  dialog.className = "hm-development-record-dialog";
  dialog.setAttribute("aria-label", "Permit record details");
  const open = (record, trigger) => {
    const sourceFields = record.source_fields ?? {};
    const sourceValue = (key) => sourceFields[key]?.value;
    const permit = permitNumber(record) || "Permit record";
    const key = developmentRecordKey(record);
    const detail = el("article", undefined, "hm-development-record-detail");
    const header = el("header", undefined, "hm-development-record-detail-head");
    const heading = el("div", undefined, "hm-development-record-detail-title");
    const title = el("h2", permit);
    title.id = `hm-development-record-detail-title-${uid()}`;
    const month = el("time", record.report_month || "Report month not stated");
    if (record.report_month) month.dateTime = record.report_month;
    heading.append(title, month);
    const tools = el("div", undefined, "hm-development-record-detail-actions");
    const save = el("button", savedRecordIds.has(key) ? "✓ Saved" : "☆ Save", "hm-development-action hm-development-action-save");
    save.type = "button";
    save.disabled = savedRecordIds.has(key) || !onSaveRecord;
    save.setAttribute("aria-label", savedRecordIds.has(key) ? `Saved ${permit}` : `Save ${permit}`);
    save.addEventListener("click", async () => {
      save.disabled = true;
      try {
        await onSaveRecord?.(record);
        savedRecordIds.add(key);
        save.textContent = "✓ Saved";
        save.setAttribute("aria-label", `Saved ${permit}`);
      } catch {
        save.disabled = false;
        feedback.textContent = "Could not save this permit on this device.";
      }
    });
    const noteToggle = el("button", "＋ Note", "hm-development-action");
    noteToggle.type = "button";
    noteToggle.disabled = !onCreateNote;
    const dismiss = el("button", "×", "hm-map-dialog-close");
    dismiss.type = "button";
    dismiss.setAttribute("aria-label", "Close permit details");
    dismiss.addEventListener("click", () => dialog.close());
    tools.append(save, noteToggle, dismiss);
    header.append(heading, tools);

    const site = el("section", undefined, "hm-development-record-detail-site");
    site.append(el("span", "Site location"), el("strong", sourceValue("location_text") || "Location not available"));
    const metrics = el("div", undefined, "hm-development-record-detail-metrics");
    const rawMoney = sourceValue("construction_value");
    const moneyValue = rawMoney === null || rawMoney === undefined || rawMoney === ""
      ? "Not reported" : new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(Number(rawMoney));
    const rawGfa = sourceValue("building_gfa");
    const gfaValue = rawGfa === null || rawGfa === undefined || rawGfa === "" ? "Not reported" : `${Number(rawGfa).toLocaleString("en-CA")} m²`;
    for (const [label, value] of [["Reported construction value", moneyValue], ["Building area", gfaValue]]) {
      const metric = el("div", undefined, "hm-development-record-detail-metric");
      metric.append(el("span", label), el("strong", value));
      metrics.append(metric);
    }

    const facts = el("section", undefined, "hm-development-record-detail-section");
    facts.append(el("h3", "Permit details"));
    const factList = el("dl", undefined, "hm-development-record-detail-facts");
    const fieldLabels = {
      item_number: "Item number", permit_number: "Permit number", location_text: "Project location", area: "Area",
      building_type: "Building type", building_gfa: "Building GFA", work_type: "Work type", construction_value: "Construction value",
      permit_description: "Project description", owner_organization_name: "Owner name", builder_organization_name: "Builder name",
    };
    const primaryFields = ["permit_description", "building_type", "work_type", "owner_organization_name", "builder_organization_name"];
    for (const keyName of primaryFields) {
      const field = sourceFields[keyName];
      if (!field || field.value === null || field.value === undefined || field.value === "") continue;
      factList.append(el("dt", fieldLabels[keyName] ?? keyName.replaceAll("_", " ")), el("dd", String(field.value)));
    }
    facts.append(factList);

    const classification = el("section", undefined, "hm-development-record-detail-section");
    classification.append(el("h3", "Classification"));
    const tags = el("div", undefined, "hm-development-record-detail-tags");
    for (const [label, values] of [["Sector", record.derived_sector_tags], ["Action", record.derived_action_tags]]) {
      for (const value of values ?? []) {
        const tag = value?.label ?? value?.tag ?? value;
        tags.append(el("span", `${label} · ${String(tag).replaceAll("_", " ")}`, "hm-development-record-tag"));
      }
    }
    if (tags.childElementCount) classification.append(tags);

    const secondary = document.createElement("details");
    secondary.className = "hm-development-record-secondary";
    secondary.append(el("summary", "Source fields and record notes"));
    const sourceFacts = el("dl", undefined, "hm-development-record-detail-facts hm-development-record-source-facts");
    for (const [keyName, field] of Object.entries(sourceFields)) {
      const value = field.value === null || field.value === undefined || field.value === "" ? `Not reported · ${field.status ?? "status unavailable"}` : String(field.value);
      const valueCell = el("dd", value);
      const sourceNotes = [field.status && field.status !== "observed" ? `Field status: ${field.status}` : null,
        field.source_text && field.source_text !== String(field.value ?? "") ? `Source text: ${field.source_text}` : null,
        ...Object.entries(field).filter(([metadataKey, metadataValue]) => !["value", "status", "source_text"].includes(metadataKey) && metadataValue !== null && metadataValue !== "").map(([metadataKey, metadataValue]) => `${metadataKey.replaceAll("_", " ")}: ${String(metadataValue)}`)];
      for (const note of sourceNotes.filter(Boolean)) valueCell.append(el("small", note));
      sourceFacts.append(el("dt", fieldLabels[keyName] ?? keyName.replaceAll("_", " ")), valueCell);
    }
    secondary.append(sourceFacts);
    const provenance = el("p", [
      "Contact addresses are withheld. Source-reported values have not been independently verified; issue month does not establish current project status.",
      record.source_evidence_ref?.source_page ? `Monthly permit report, page ${record.source_evidence_ref.source_page}.` : null,
      `Classification ${record.classification_status || "not stated"} · taxonomy ${record.taxonomy_version || "not stated"}.`,
    ].filter(Boolean).join(" "), "hm-development-record-provenance");
    secondary.append(provenance);

    const noteForm = el("form", undefined, "hm-development-record-note-form");
    noteForm.hidden = true;
    const noteInput = document.createElement("textarea");
    noteInput.maxLength = 5000;
    noteInput.rows = 2;
    noteInput.placeholder = "Add a note about this permit…";
    noteInput.setAttribute("aria-label", "Note about this permit");
    const noteSave = el("button", "Save note", "hm-development-action hm-development-action-save");
    noteSave.type = "submit";
    const feedback = el("span", "", "hm-development-record-feedback");
    noteForm.append(noteInput, noteSave, feedback);
    noteToggle.addEventListener("click", () => {
      noteForm.hidden = !noteForm.hidden;
      if (!noteForm.hidden) noteInput.focus({ preventScroll: true });
    });
    noteForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!noteInput.value.trim()) { feedback.textContent = "Write a note first."; return; }
      noteSave.disabled = true;
      try {
        await onCreateNote?.(record, noteInput.value.trim());
        noteInput.value = "";
        feedback.textContent = "Note saved on this device.";
      } catch { feedback.textContent = "Could not save this note on this device."; }
      finally { noteSave.disabled = false; }
    });

    detail.append(header, site, metrics, facts, classification, secondary, noteForm);
    dialog.setAttribute("aria-labelledby", title.id);
    dialog.replaceChildren(detail);
    dialog.showModal();
    dismiss.focus({ preventScroll: true });
    dialog.addEventListener("close", () => { if (trigger?.isConnected) trigger.focus({ preventScroll: true }); }, { once: true });
  };
  dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
  return { dialog, open };
}

export function developmentCountAction(count, onOpen) {
  if (!count) return null;
  const button = el("button", `${count} development ${count === 1 ? "record" : "records"}`, "hm-development-count");
  button.type = "button";
  button.setAttribute("aria-label", `Open ${count} development ${count === 1 ? "record" : "records"} for this parcel`);
  button.addEventListener("click", onOpen);
  return button;
}

export function developmentRecordsSection(records, {
  count = records.length,
  loading = false,
  savedRecordIds = new Set(),
  onSaveRecord,
  onCreateNote,
} = {}) {
  const section = el("section", undefined, "hm-development-section");
  const head = el("header", undefined, "hm-development-section-head");
  const title = el("h3", "Development activity");
  title.id = "hm-development-title";
  head.append(title);
  head.append(el("span", `${count} ${count === 1 ? "record" : "records"}`));
  section.append(head);
  if (loading) section.append(el("p", "Loading development records…", "hm-development-empty"));
  else if (!records.length) section.append(el("p", count ? "The linked records could not be loaded." : "No linked development records in this collection.", "hm-development-empty"));
  else {
    const toolbar = el("div", undefined, "hm-development-record-filter-bar");
    const search = document.createElement("input");
    search.type = "search";
    search.placeholder = "Filter permits, descriptions, owners…";
    search.setAttribute("aria-label", "Filter linked development permits");
    const month = document.createElement("select");
    month.setAttribute("aria-label", "Filter permits by report month");
    month.append(new Option("All months", "all"));
    [...new Set(records.map((record) => record.report_month).filter(Boolean))].sort().reverse().forEach((value) => month.append(new Option(value, value)));
    const category = document.createElement("select");
    category.setAttribute("aria-label", "Filter permits by category");
    category.append(new Option("All categories", "all"));
    for (const [value, label] of categoryDefinitions) category.append(new Option(label, value));
    toolbar.append(search, month, category);
    section.append(toolbar);
    const resultStatus = el("p", "", "hm-development-record-filter-status");
    resultStatus.setAttribute("role", "status");
    section.append(resultStatus);
    const list = el("div", undefined, "hm-development-compact-list");
    section.append(list);
    const more = el("button", "Show more records", "hm-development-show-more");
    more.type = "button";
    section.append(more);
    const { dialog, open } = createDevelopmentRecordDialog({ savedRecordIds, onSaveRecord, onCreateNote });
    section.append(dialog);
    let visibleCount = 8;
    const render = () => {
      const query = search.value.trim().toLocaleLowerCase();
      const matches = records.filter((record) => {
        if (month.value !== "all" && record.report_month !== month.value) return false;
        if (!recordMatchesCategory(record, category.value)) return false;
        const searchable = [
          ...Object.values(record.source_fields ?? {}).flatMap((field) => [field.value, field.source_text]),
          ...(record.derived_sector_tags ?? []).map((tag) => tag.label ?? tag.tag ?? tag),
          ...(record.derived_action_tags ?? []).map((tag) => tag.label ?? tag.tag ?? tag),
        ].join(" ").toLocaleLowerCase();
        return !query || searchable.includes(query);
      });
      resultStatus.textContent = `${matches.length.toLocaleString("en-CA")} of ${count.toLocaleString("en-CA")} records`;
      const shown = matches.slice(0, visibleCount);
      list.replaceChildren();
      for (const record of shown) {
        const fields = record.source_fields ?? {};
        const key = developmentRecordKey(record);
        const card = el("article", undefined, "hm-development-compact-card");
        const identity = el("div", undefined, "hm-development-compact-identity");
        const top = el("div", undefined, "hm-development-compact-title");
        top.append(el("strong", permitNumber(record) || "Permit record"), el("time", record.report_month || "—"));
        identity.append(top, el("span", fields.location_text?.value || "Location not available"));
        const description = fields.permit_description?.value || fields.work_type?.value;
        if (description) identity.append(el("p", String(description), "hm-development-compact-description"));
        const meta = el("span", [
          fields.construction_value?.value !== null && fields.construction_value?.value !== undefined && fields.construction_value?.value !== ""
            ? money(fields.construction_value.value) : null,
          displayTags(record, "derived_sector_tags"),
        ].filter(Boolean).join(" · "), "hm-development-compact-meta");
        identity.append(meta);
        const actions = el("div", undefined, "hm-development-compact-actions");
        const save = el("button", savedRecordIds.has(key) ? "✓" : "☆", "hm-development-icon-action");
        save.type = "button";
        save.disabled = savedRecordIds.has(key) || !onSaveRecord;
        save.setAttribute("aria-label", savedRecordIds.has(key) ? `Saved ${permitNumber(record)}` : `Save ${permitNumber(record)}`);
        save.title = savedRecordIds.has(key) ? "Saved" : "Save permit";
        save.addEventListener("click", async () => {
          save.disabled = true;
          try {
            await onSaveRecord?.(record);
            savedRecordIds.add(key);
            save.textContent = "✓";
            save.setAttribute("aria-label", `Saved ${permitNumber(record)}`);
            save.title = "Saved";
          } catch { save.disabled = false; }
        });
        const detail = el("button", "↗", "hm-development-icon-action");
        detail.type = "button";
        detail.setAttribute("aria-haspopup", "dialog");
        detail.setAttribute("aria-label", `Open full record for ${permitNumber(record)}`);
        detail.title = "Open full record";
        detail.addEventListener("click", () => open(record, detail));
        actions.append(save, detail);
        card.append(identity, actions);
        list.append(card);
      }
      if (!matches.length) list.append(el("p", "No records match these filters.", "hm-development-empty"));
      more.hidden = visibleCount >= matches.length;
      more.textContent = `Show ${Math.min(12, matches.length - visibleCount)} more records`;
    };
    search.addEventListener("input", () => { visibleCount = 8; render(); });
    month.addEventListener("change", () => { visibleCount = 8; render(); });
    category.addEventListener("change", () => { visibleCount = 8; render(); });
    more.addEventListener("click", () => { visibleCount += 12; render(); });
    render();
  }
  return section;
}

const number = (value) => Number(value ?? 0).toLocaleString("en-CA");
const money = (value) => new Intl.NumberFormat("en-CA", {
  style: "currency", currency: "CAD", maximumFractionDigits: 0,
}).format(Number(value ?? 0));
const area = (value) => `${Number(value ?? 0).toLocaleString("en-CA", { maximumFractionDigits: 0 })} m²`;
const categoryDefinitions = [
  ["industrial", "Industrial"],
  ["logistics", "Logistics"],
  ["commercial", "Commercial"],
  ["multi_unit_residential", "Multi-unit residential"],
  ["residential_all", "Residential"],
];
function sumMonthly(monthly, first, last) {
  const rows = monthly.filter((row) => row.report_month >= first && row.report_month <= last);
  const sum = (items) => items.reduce((total, item) => total + Number(item ?? 0), 0);
  const totalFor = (key) => ({
    unique_permits: sum(rows.map((row) => row[key]?.unique_permits)),
    reported_construction_value_cad_sum: sum(rows.map((row) => row[key]?.reported_construction_value_cad_sum)),
    reported_building_gfa_m2_sum: sum(rows.map((row) => row[key]?.reported_building_gfa_m2_sum)),
  });
  return {
    citywide: {
      unique_permits: sum(rows.map((row) => row.citywide.unique_permits)),
      reported_construction_value_cad_sum: sum(rows.map((row) => row.citywide.reported_construction_value_cad_sum)),
      reported_building_gfa_m2_sum: sum(rows.map((row) => row.citywide.reported_building_gfa_m2_sum)),
    },
    categories: Object.fromEntries(categoryDefinitions.map(([key]) => [key, totalFor(key)])),
  };
}
function recordMatchesCategory(record, category) {
  if (category === "all") return true;
  const tags = (record.derived_sector_tags ?? []).map((tag) => String(tag?.tag ?? tag?.label ?? tag));
  if (category === "industrial") return tags.includes("industrial") || tags.includes("light_industrial");
  if (category === "logistics") return tags.some((tag) => tag === "logistics" || tag === "warehouse_logistics");
  if (category === "commercial") return tags.some((tag) => tag.startsWith("commercial"));
  if (category === "multi_unit_residential") return tags.includes("residential_multi_unit") || tags.includes("multi_unit_residential");
  if (category === "residential_all") return tags.some((tag) => tag.startsWith("residential"));
  return false;
}

export function cityDevelopmentSheetElement(snapshot, { onBrowse } = {}) {
  const panel = el("section", undefined, "hm-development-sheet");
  const header = el("header", undefined, "hm-development-sheet-head");
  const titles = el("div");
  titles.append(el("p", "HAMILTON · PERMIT DIGESTS", "hm-map-dialog-eyebrow"));
  titles.append(el("h2", "Development at a glance", "hm-map-dialog-title"));
  titles.append(el("p", `${snapshot.coverage.first_report_month} to ${snapshot.coverage.last_report_month} · ${number(snapshot.coverage.monthly_report_count)} monthly reports`, "hm-development-sheet-range"));
  const close = el("button", "×", "hm-map-dialog-close");
  close.type = "button";
  close.setAttribute("aria-label", "Close development overview");
  close.addEventListener("click", () => panel.closest("dialog")?.close());
  header.append(titles, close);
  panel.append(header);

  const totals = snapshot.citywide_totals;
  const stats = el("div", undefined, "hm-development-city-stats");
  for (const [label, value, note] of [
    ["Permits issued", number(totals.unique_permits), "All collected permit rows"],
    ["Reported value", money(totals.reported_construction_value_cad_sum), `${number(totals.permits_with_reported_construction_value)} permits with value`],
    ["Measured building area", area(totals.reported_building_gfa_m2_sum), `${number(totals.permits_with_measured_building_gfa)} permits with measured GFA`],
  ]) {
    const card = el("article", undefined, "hm-development-city-stat");
    card.append(el("p", label));
    card.append(el("strong", value));
    card.append(el("small", note));
    stats.append(card);
  }
  panel.append(stats);

  const categories = el("section", undefined, "hm-development-city-categories");
  categories.append(el("h3", "Building activity in focus"));
  const table = el("div", undefined, "hm-development-city-table");
  for (const [key, title] of [
    ["industrial", "Industrial"],
    ["logistics", "Logistics"],
    ["commercial", "Commercial"],
    ["multi_unit_residential", "Multi-unit residential"],
  ]) {
    const row = snapshot.category_totals[key];
    const line = el("div", undefined, "hm-development-city-row");
    line.append(el("strong", title));
    line.append(el("span", `${number(row.unique_permits)} permits`));
    line.append(el("span", money(row.reported_construction_value_cad_sum)));
    line.append(el("span", area(row.reported_building_gfa_m2_sum)));
    table.append(line);
  }
  categories.append(table);
  categories.append(el("p", snapshot.interpretation.light_industrial, "hm-development-caveat"));
  panel.append(categories);
  const caveats = [
    `Taxonomy ${snapshot.taxonomy_version} is provisional and based on reviewed explicit-text candidates.`,
    snapshot.interpretation.category_counts_overlap ? "Category counts overlap and should not be added together." : "Category counts are separate.",
    "Reported value is permit value, not realized investment. Monthly digests show issuance, not whether permits or projects are currently open, active, under construction, or complete.",
    snapshot.known_source_reconciliation?.open_issue,
    snapshot.known_source_reconciliation?.reports_without_aggregate_summary
      ? `${number(snapshot.known_source_reconciliation.reports_without_aggregate_summary)} early monthly reports have no aggregate summary for count reconciliation.`
      : null,
  ].filter(Boolean).join(" ");
  panel.append(el("p", caveats, "hm-development-city-note"));

  const latest = snapshot.monthly.at(-1);
  if (latest) panel.append(el("p", `Latest report month: ${latest.report_month} · ${number(latest.citywide.unique_permits)} permits issued`, "hm-development-sheet-latest"));
  if (onBrowse) {
    const browse = el("button", "Browse permit records →", "hm-development-browse-open");
    browse.type = "button";
    browse.addEventListener("click", onBrowse);
    panel.append(browse);
  }
  return panel;
}

export function developmentRecordsBrowserElement(records, { onBack, onClose, sidebarTarget, snapshot, savedRecordIds: savedIds = [], onSaveRecord, onCreateNote } = {}) {
  const isDashboard = Boolean(sidebarTarget && snapshot?.monthly?.length);
  const panel = el("section", undefined, "hm-development-browser");
  panel.setAttribute("aria-label", "Hamilton development records");
  const sidebar = sidebarTarget ?? el("aside", undefined, "hm-development-browser-sidebar");
  const actions = el("div", undefined, "hm-development-browser-actions");
  if (onBack) {
    const back = el("button", "← Snapshot", "hm-development-browser-back");
    back.type = "button";
    back.addEventListener("click", onBack);
    actions.append(back);
  }
  if (onClose) {
    const close = el("button", "×", "hm-map-dialog-close");
    close.type = "button";
    close.setAttribute("aria-label", "Close development records");
    close.addEventListener("click", onClose);
    actions.append(close);
  }
  if (actions.childElementCount) sidebar.append(actions);

  const controls = el("div", undefined, "hm-development-browser-controls");
  const search = el("input");
  search.type = "search";
  search.placeholder = "Search permits, streets, businesses, or project descriptions";
  search.setAttribute("aria-label", "Search Hamilton permit records");
  const filter = el("select");
  filter.setAttribute("aria-label", "Filter by development category");
  const filterOptions = isDashboard
    ? [["all", "All categories"], ...categoryDefinitions.map(([key, label]) => [key, label])]
    : [["all", "All permit records"], ["focus", "Industrial, commercial, logistics & multi-unit"]];
  for (const [value, label] of filterOptions) {
    const option = el("option", label);
    option.value = value;
    filter.append(option);
  }
  controls.append(search, filter);

  const resultStatus = el("p", "", "hm-development-browser-status");
  resultStatus.setAttribute("role", "status");
  const source = el("a", "City of Hamilton open data ↗", "hm-development-browser-source");
  source.href = "https://open.hamilton.ca/";
  source.target = "_blank";
  source.rel = "noopener noreferrer";
  sidebar.append(source);

  const main = el("div", undefined, "hm-development-browser-main");
  let citySelect = null;
  let fromMonth = null;
  let toMonth = null;
  let periodSelect = null;
  let categoryCards = [];
  if (isDashboard) {
    const dashboard = el("section", undefined, "hm-development-dashboard");
    dashboard.setAttribute("aria-label", "Hamilton development totals");
    const dashboardHeading = el("h1", "Hamilton permit activity", "hm-visually-hidden");
    dashboard.append(dashboardHeading);
    const dashboardFilters = el("div", undefined, "hm-development-dashboard-filters");
    const labeledControl = (label, control, className = "") => {
      const wrap = el("label", label, `hm-development-dashboard-field ${className}`.trim());
      wrap.append(control);
      return wrap;
    };
    citySelect = el("select");
    citySelect.setAttribute("aria-label", "City or region");
    const placeOption = el("option", "Hamilton, Ontario");
    placeOption.value = snapshot.jurisdiction ?? "ca/on/hamilton";
    citySelect.append(placeOption);
    citySelect.id = "hm-development-place";
    periodSelect = el("select");
    periodSelect.setAttribute("aria-label", "Time period");
    for (const [value, label] of [
      ["all", "All reporting months"], ["last12", "Latest 12 months"], ["2026", "2026"], ["2025", "2025"], ["custom", "Custom range"],
    ]) {
      const option = el("option", label);
      option.value = value;
      periodSelect.append(option);
    }
    fromMonth = el("input");
    fromMonth.type = "month";
    fromMonth.setAttribute("aria-label", "Start report month");
    toMonth = el("input");
    toMonth.type = "month";
    toMonth.setAttribute("aria-label", "End report month");
    fromMonth.value = snapshot.coverage.first_report_month;
    toMonth.value = snapshot.coverage.last_report_month;
    periodSelect.id = "hm-development-period";
    const range = el("div", undefined, "hm-development-month-range");
    range.append(fromMonth, el("span", "to"), toMonth);
    const totalsToggle = el("button", "Hide totals", "hm-development-dashboard-toggle");
    totalsToggle.type = "button";
    totalsToggle.setAttribute("aria-expanded", "true");
    totalsToggle.setAttribute("aria-controls", "hm-development-dashboard-summary");
    dashboardFilters.append(
      labeledControl("City / region", citySelect),
      labeledControl("Report period", periodSelect),
      labeledControl("From · to", range, "hm-development-dashboard-range"),
    );
    // On the full page the filters live in the left rail, so the main column
    // is totals and permits only. The totals toggle stays with the totals.
    const totalsBar = el("div", undefined, "hm-development-dashboard-totals-bar");
    totalsBar.append(el("h2", "Permit activity", "hm-development-dashboard-title"), totalsToggle);
    dashboard.append(totalsBar);

    const summary = el("div", undefined, "hm-development-dashboard-summary");
    summary.id = "hm-development-dashboard-summary";
    const metrics = el("div", undefined, "hm-development-dashboard-metrics");
    for (const [key, label] of [["permits", "Permits issued"], ["value", "Reported construction value"], ["gfa", "Measured building area"]]) {
      const card = el("article", undefined, "hm-development-dashboard-metric");
      card.append(el("span", label), el("strong", "—"));
      card.dataset.metric = key;
      metrics.append(card);
    }
    summary.append(metrics);

    const categories = el("div", undefined, "hm-development-dashboard-categories");
    categoryCards = categoryDefinitions.map(([key, label]) => {
      const card = el("button", undefined, "hm-development-category-card");
      card.type = "button";
      card.dataset.category = key;
      card.setAttribute("aria-pressed", "false");
      card.append(el("span", label), el("strong", "—"), el("small", "permits"), el("span", "—", "hm-development-category-value"));
      card.addEventListener("click", () => {
        filter.value = filter.value === key ? "all" : key;
        visibleCount = 48;
        update();
      });
      categories.append(card);
      return card;
    });
    summary.append(categories);
    summary.append(el("p", "Category totals can overlap. Reported permit values are not realized investment, and issue dates do not show current project status.", "hm-development-dashboard-note"));
    dashboard.append(summary);
    totalsToggle.addEventListener("click", () => {
      summary.hidden = !summary.hidden;
      totalsToggle.textContent = summary.hidden ? "Show totals" : "Hide totals";
      totalsToggle.setAttribute("aria-expanded", String(!summary.hidden));
    });
    main.append(dashboard);

    search.placeholder = "Permits, streets, businesses…";
    const railFilters = el("div", undefined, "hm-development-rail-filters");
    railFilters.append(
      el("p", "DEVELOPMENT", "hm-docs-kicker"),
      dashboardFilters,
      labeledControl("Search", search),
      labeledControl("Category", filter),
      resultStatus,
    );
    sidebarTarget.replaceChildren(railFilters, source);
  } else {
    search.placeholder = "Permit, site, source type, or name";
    search.setAttribute("aria-label", "Search all Hamilton development records");
    sidebar.append(controls, resultStatus);
  }
  const list = el("div", undefined, "hm-development-browser-list");
  main.append(list);
  const paging = el("div", undefined, "hm-development-browser-paging");
  const previous = el("button", "← Previous", "hm-development-page");
  const next = el("button", "Next →", "hm-development-page");
  previous.type = next.type = "button";
  const position = el("span");
  if (isDashboard) {
    next.textContent = "Load 48 more permits";
    paging.append(next);
  } else paging.append(previous, position, next);
  main.append(paging);
  if (sidebarTarget) panel.append(main);
  else panel.append(sidebar, main);

  const savedRecordIds = savedIds instanceof Set ? savedIds : new Set(savedIds);
  const { dialog: recordDialog, open: openRecord } = createDevelopmentRecordDialog({
    savedRecordIds,
    onSaveRecord,
    onCreateNote,
  });
  panel.append(recordDialog);

  const pageSize = 50;
  let page = 0;
  let visibleCount = 48;
  let pendingRecordId = new URLSearchParams(globalThis.location?.search ?? "").get("record");
  function update() {
    if (pendingRecordId) {
      const target = records.find((record) => record.development_record_id === pendingRecordId || permitNumber(record) === pendingRecordId);
      if (target && permitNumber(target)) search.value = permitNumber(target);
    }
    const query = search.value.trim().toLocaleLowerCase();
    const first = fromMonth?.value || snapshot?.coverage?.first_report_month || "0000-00";
    const last = toMonth?.value || snapshot?.coverage?.last_report_month || "9999-99";
    const matches = records.filter((record) => {
      if (isDashboard && (record.report_month < first || record.report_month > last)) return false;
      if (isDashboard && !recordMatchesCategory(record, filter.value)) return false;
      if (!isDashboard && filter.value === "focus" && !(record.derived_sector_tags ?? []).some((tag) => FOCUS_SECTORS.has(tag.tag ?? tag.label ?? tag))) return false;
      if (!query) return true;
      return [
        ...Object.values(record.source_fields ?? {}).flatMap((field) => [field.value, field.source_text]),
        ...(record.derived_sector_tags ?? []).map((tag) => tag?.label ?? tag?.tag ?? tag),
        ...(record.derived_action_tags ?? []).map((tag) => tag?.label ?? tag?.tag ?? tag),
      ].some((value) => String(value ?? "").toLocaleLowerCase().includes(query));
    });
    if (isDashboard) {
      const aggregate = first === snapshot.coverage.first_report_month && last === snapshot.coverage.last_report_month
        ? { citywide: snapshot.citywide_totals, categories: snapshot.category_totals }
        : sumMonthly(snapshot.monthly, first, last);
      const metricValues = {
        permits: number(aggregate.citywide.unique_permits),
        value: money(aggregate.citywide.reported_construction_value_cad_sum),
        gfa: area(aggregate.citywide.reported_building_gfa_m2_sum),
      };
      for (const [key, value] of Object.entries(metricValues)) {
        const target = main.querySelector(`[data-metric="${key}"] strong`);
        if (target) target.textContent = value;
      }
      for (const card of categoryCards) {
        const key = card.dataset.category;
        const total = aggregate.categories[key] ?? {};
        card.querySelector("strong").textContent = number(total.unique_permits);
        card.querySelector(".hm-development-category-value").textContent = money(total.reported_construction_value_cad_sum);
        card.setAttribute("aria-pressed", String(filter.value === key));
        card.classList.toggle("is-active", filter.value === key);
      }
      const shown = Math.min(visibleCount, matches.length);
      resultStatus.textContent = `${number(matches.length)} matching permits · showing ${number(shown)}`;
      next.textContent = matches.length > visibleCount ? `Load ${Math.min(48, matches.length - visibleCount)} more permits` : "All matching permits shown";
      next.disabled = matches.length <= visibleCount;
      paging.hidden = matches.length <= visibleCount;
    } else {
      const pageCount = Math.max(1, Math.ceil(matches.length / pageSize));
      page = Math.min(page, pageCount - 1);
      resultStatus.textContent = `${number(matches.length)} ${matches.length === 1 ? "record" : "records"} · showing ${matches.length ? page * pageSize + 1 : 0}–${Math.min((page + 1) * pageSize, matches.length)}`;
      position.textContent = `Page ${page + 1} of ${pageCount}`;
      previous.disabled = page === 0;
      next.disabled = page + 1 >= pageCount;
    }
    list.replaceChildren();
    if (pendingRecordId) {
      const targetIndex = matches.findIndex((record) => record.development_record_id === pendingRecordId || permitNumber(record) === pendingRecordId);
      if (targetIndex >= 0) {
        if (isDashboard) visibleCount = Math.max(visibleCount, targetIndex + 1);
        else page = Math.floor(targetIndex / pageSize);
      }
    }
    const pageRecords = isDashboard
      ? matches.slice(0, visibleCount)
      : matches.slice(page * pageSize, (page + 1) * pageSize);
    if (!pageRecords.length) list.append(el("p", "No permit records match these search and filter settings.", "hm-development-browser-empty"));
    for (const record of pageRecords) {
      const row = el("article", undefined, "hm-development-browser-item");
      const identity = el("span", undefined, "hm-development-browser-item-identity");
      identity.append(el("strong", permitNumber(record) || "Permit record"), el("span", record.source_fields?.location_text?.value || "Location not available"));
      const description = record.source_fields?.permit_description?.value || record.source_fields?.work_type?.value;
      if (description) identity.append(el("span", String(description), "hm-development-browser-item-description"));
      const meta = el("span", undefined, "hm-development-browser-item-meta");
      meta.append(el("time", record.report_month || "—"));
      const value = record.source_fields?.construction_value?.value;
      if (value !== null && value !== undefined && value !== "") meta.append(el("span", new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(Number(value))));
      const tags = [...(record.derived_sector_tags ?? []), ...(record.derived_action_tags ?? [])].slice(0, 4);
      const tagLine = el("span", tags.map((tag) => String(tag?.label ?? tag?.tag ?? tag).replaceAll("_", " ")).join(" · "), "hm-development-browser-item-tags");
      row.append(identity, meta);
      if (tags.length) row.append(tagLine);
      const actions = el("div", undefined, "hm-development-browser-item-actions");
      const savedKey = developmentRecordKey(record);
      const save = el("button", savedRecordIds.has(savedKey) ? "✓" : "☆", "hm-development-icon-action");
      save.type = "button";
      save.disabled = savedRecordIds.has(savedKey) || !onSaveRecord;
      save.title = savedRecordIds.has(savedKey) ? "Saved" : "Save permit";
      save.setAttribute("aria-label", savedRecordIds.has(savedKey) ? `Saved ${permitNumber(record)}` : `Save ${permitNumber(record)}`);
      save.addEventListener("click", async () => {
        save.disabled = true;
        try {
          await onSaveRecord?.(record);
          savedRecordIds.add(savedKey);
          save.textContent = "✓";
          save.title = "Saved";
          save.setAttribute("aria-label", `Saved ${permitNumber(record)}`);
        } catch { save.disabled = false; }
      });
      const open = el("button", "↗", "hm-development-icon-action");
      open.type = "button";
      open.setAttribute("aria-haspopup", "dialog");
      open.setAttribute("aria-label", `Open full record for ${permitNumber(record)}`);
      open.dataset.recordId = record.development_record_id ?? permitNumber(record) ?? "";
      open.title = "Open full record";
      open.addEventListener("click", () => openRecord(record, open));
      actions.append(save, open);
      row.append(actions);
      list.append(row);
    }
    if (pendingRecordId) {
      const target = records.find((record) => record.development_record_id === pendingRecordId || permitNumber(record) === pendingRecordId);
      if (target) {
        const button = [...list.querySelectorAll("[data-record-id]")].find((candidate) => candidate.dataset.recordId === (target.development_record_id ?? permitNumber(target) ?? ""));
        if (button) {
          pendingRecordId = null;
          const show = () => openRecord(target, button);
          if (globalThis.requestAnimationFrame) requestAnimationFrame(show);
          else setTimeout(show, 0);
        }
      }
    }
  }
  search.addEventListener("input", () => { page = 0; visibleCount = 48; update(); });
  filter.addEventListener("change", () => { page = 0; visibleCount = 48; update(); });
  previous.addEventListener("click", () => { page--; update(); });
  next.addEventListener("click", () => {
    if (isDashboard) visibleCount += 48;
    else page++;
    update();
  });
  if (isDashboard) {
    const setRange = (first, last) => {
      fromMonth.value = first;
      toMonth.value = last;
      visibleCount = 48;
      update();
    };
    periodSelect.addEventListener("change", () => {
      const months = snapshot.monthly.map((row) => row.report_month);
      if (periodSelect.value === "all") setRange(snapshot.coverage.first_report_month, snapshot.coverage.last_report_month);
      else if (periodSelect.value === "last12") setRange(months[Math.max(0, months.length - 12)], months.at(-1));
      else if (["2025", "2026"].includes(periodSelect.value)) {
        const yearMonths = months.filter((month) => month.startsWith(periodSelect.value));
        setRange(yearMonths[0] ?? snapshot.coverage.first_report_month, yearMonths.at(-1) ?? snapshot.coverage.last_report_month);
      } else update();
    });
    for (const input of [fromMonth, toMonth]) input.addEventListener("change", () => {
      periodSelect.value = "custom";
      visibleCount = 48;
      update();
    });
    citySelect.addEventListener("change", update);
  }
  update();
  panel.refreshSavedRecords = () => update();
  return panel;
}
