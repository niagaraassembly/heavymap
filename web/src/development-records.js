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
      return {
        ok: true,
        recordCount: doc.record_count,
        focusCount: doc.focus_record_count,
        reportMonths: doc.report_months ?? [],
        activityMosaic: doc.activity_mosaic ?? null,
      };
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

function permitCard(record) {
  const card = el("article", undefined, "hm-development-record");
  const header = el("header", undefined, "hm-development-record-head");
  header.append(el("h4", permitNumber(record) || "Permit record"));
  header.append(el("time", record.report_month || ""));
  card.append(header);
  const sourceFields = record.source_fields ?? {};
  const fieldLabels = {
    item_number: "Item number · source",
    permit_number: "Permit number · source",
    location_text: "Project location · source",
    area: "Area · source",
    building_type: "Building type · source",
    building_gfa: "Building GFA · source",
    work_type: "Work type · source",
    construction_value: "Construction value · source",
    permit_description: "Permit description · source",
    owner_organization_name: "Owner name · source",
    builder_organization_name: "Builder name · source",
  };
  const facts = el("dl", undefined, "hm-development-facts");
  for (const [key, field] of Object.entries(sourceFields)) {
    const label = fieldLabels[key] ?? key.replaceAll("_", " ");
    const value = field.value === null || field.value === undefined || field.value === ""
      ? `No value · ${field.status ?? "status unavailable"}`
      : String(field.value);
    const valueCell = el("dd", value);
    valueCell.classList.add("hm-development-source-value");
    if (field.status && field.status !== "observed")
      valueCell.append(el("small", `Field status: ${field.status}`, "hm-development-field-status"));
    if (field.source_text && field.source_text !== String(field.value ?? ""))
      valueCell.append(el("small", `Source text: ${field.source_text}`, "hm-development-field-source-text"));
    for (const [metadataKey, metadataValue] of Object.entries(field)) {
      if (["value", "status", "source_text"].includes(metadataKey) || metadataValue === null || metadataValue === "") continue;
      const label = metadataKey.replaceAll("_", " ");
      valueCell.append(el("small", `${label}: ${String(metadataValue)}`, "hm-development-field-source-text"));
    }
    facts.append(el("dt", label), valueCell);
  }
  facts.append(
    el("dt", "Sector · derived"), el("dd", displayTags(record, "derived_sector_tags") || "No derived sector tag"),
    el("dt", "Action · derived"), el("dd", displayTags(record, "derived_action_tags") || "No derived action tag"),
  );
  card.append(facts);
  card.append(el("p", "Owner and builder contact addresses are withheld. Names and permit fields are source-reported and not independently verified.", "hm-development-provenance"));
  card.append(el("p", `Classification ${record.classification_status} · taxonomy ${record.taxonomy_version} · ${record.activity_basis}`, "hm-development-provenance"));
  if (record.source_evidence_ref?.source_page) {
    card.append(el("p", `Source evidence: monthly permit audit, page ${record.source_evidence_ref.source_page}`, "hm-development-provenance"));
  }
  return card;
}

export function developmentCountAction(count, onOpen) {
  if (!count) return null;
  const button = el("button", `${count} development ${count === 1 ? "record" : "records"}`, "hm-development-count");
  button.type = "button";
  button.setAttribute("aria-label", `Open ${count} development ${count === 1 ? "record" : "records"} for this parcel`);
  button.addEventListener("click", onOpen);
  return button;
}

export function developmentRecordsSection(records, { count = records.length, loading = false } = {}) {
  const section = el("section", undefined, "hm-development-section");
  const head = el("header", undefined, "hm-development-section-head");
  const title = el("h3", "Development activity");
  title.id = "hm-development-title";
  head.append(title);
  head.append(el("span", `${count} ${count === 1 ? "record" : "records"}`));
  section.append(head);
  section.append(el("p", "Monthly issued-permit records. These summaries do not establish current permit or project status.", "hm-development-caveat"));
  if (loading) section.append(el("p", "Loading development records…", "hm-development-empty"));
  else if (!records.length) section.append(el("p", count ? "The linked records could not be loaded." : "No linked development records in this collection.", "hm-development-empty"));
  else records.forEach((record) => section.append(permitCard(record)));
  return section;
}

const number = (value) => Number(value ?? 0).toLocaleString("en-CA");
const money = (value) => new Intl.NumberFormat("en-CA", {
  style: "currency", currency: "CAD", maximumFractionDigits: 0,
}).format(Number(value ?? 0));
const area = (value) => `${Number(value ?? 0).toLocaleString("en-CA", { maximumFractionDigits: 0 })} m²`;

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

export function developmentRecordsBrowserElement(records, { onBack, onClose, sidebarTarget } = {}) {
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
  search.placeholder = "Permit, site, source type, or name";
  search.setAttribute("aria-label", "Search all Hamilton development records");
  const filter = el("select");
  filter.setAttribute("aria-label", "Filter development records");
  for (const [value, label] of [["all", "All permit records"], ["focus", "Industrial, commercial, logistics & multi-unit"]]) {
    const option = el("option", label);
    option.value = value;
    filter.append(option);
  }
  controls.append(search, filter);
  sidebar.append(controls);

  const resultStatus = el("p", "", "hm-development-browser-status");
  resultStatus.setAttribute("role", "status");
  sidebar.append(resultStatus);
  const source = el("a", "City of Hamilton open data ↗", "hm-development-browser-source");
  source.href = "https://open.hamilton.ca/";
  source.target = "_blank";
  source.rel = "noopener noreferrer";
  sidebar.append(source);

  const main = el("div", undefined, "hm-development-browser-main");
  const list = el("div", undefined, "hm-development-browser-list");
  main.append(list);
  const paging = el("div", undefined, "hm-development-browser-paging");
  const previous = el("button", "← Previous", "hm-development-page");
  const next = el("button", "Next →", "hm-development-page");
  previous.type = next.type = "button";
  const position = el("span");
  paging.append(previous, position, next);
  main.append(paging);
  if (sidebarTarget) panel.append(main);
  else panel.append(sidebar, main);

  const recordDialog = document.createElement("dialog");
  recordDialog.className = "hm-development-record-dialog";
  recordDialog.setAttribute("aria-label", "Permit record details");
  panel.append(recordDialog);

  const openRecord = (record, trigger) => {
    const sourceFields = record.source_fields ?? {};
    const sourceValue = (key) => sourceFields[key]?.value;
    const permit = sourceValue("permit_number");
    const detail = el("article", undefined, "hm-development-record-detail");
    const header = el("header", undefined, "hm-development-record-detail-head");
    const heading = el("div", undefined, "hm-development-record-detail-title");
    const title = el("h2", permit || "Permit record");
    title.id = "hm-development-record-detail-title";
    const month = el("time", record.report_month || "Report month not stated");
    if (record.report_month) month.dateTime = record.report_month;
    heading.append(title, month);
    const dismiss = el("button", "×", "hm-map-dialog-close");
    dismiss.type = "button";
    dismiss.setAttribute("aria-label", "Close permit details");
    dismiss.addEventListener("click", () => recordDialog.close());
    header.append(heading, dismiss);

    const site = el("section", undefined, "hm-development-record-detail-site");
    site.append(el("span", "SITE LOCATION"), el("strong", sourceValue("location_text") || "Location not available"));
    const metrics = el("div", undefined, "hm-development-record-detail-metrics");
    const rawMoney = sourceValue("construction_value");
    const moneyValue = rawMoney === null || rawMoney === undefined || rawMoney === ""
      ? "Not reported"
      : new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(Number(rawMoney));
    const rawGfa = sourceValue("building_gfa");
    const gfaValue = rawGfa === null || rawGfa === undefined || rawGfa === ""
      ? "Not reported"
      : `${Number(rawGfa).toLocaleString("en-CA")} m²`;
    for (const [label, value] of [["Reported construction value", moneyValue], ["Building area", gfaValue]]) {
      const metric = el("div", undefined, "hm-development-record-detail-metric");
      metric.append(el("span", label), el("strong", value));
      metrics.append(metric);
    }

    const facts = el("section", undefined, "hm-development-record-detail-section");
    facts.append(el("h3", "Permit details"));
    const factList = el("dl", undefined, "hm-development-record-detail-facts");
    const fieldLabels = {
      item_number: "Item number · source", permit_number: "Permit number · source",
      location_text: "Project location · source", area: "Area · source",
      building_type: "Building type · source", building_gfa: "Building GFA · source",
      work_type: "Work type · source", construction_value: "Construction value · source",
      permit_description: "Permit description · source",
      owner_organization_name: "Owner name · source", builder_organization_name: "Builder name · source",
    };
    for (const [key, field] of Object.entries(sourceFields)) {
      const value = field.value === null || field.value === undefined || field.value === ""
        ? `Not reported · ${field.status ?? "status unavailable"}`
        : String(field.value);
      const valueCell = el("dd", value);
      if (field.status && field.status !== "observed")
        valueCell.append(el("small", `Field status: ${field.status}`, "hm-development-field-status"));
      if (field.source_text && field.source_text !== String(field.value ?? ""))
        valueCell.append(el("small", `Source text: ${field.source_text}`, "hm-development-field-source-text"));
      for (const [metadataKey, metadataValue] of Object.entries(field)) {
        if (["value", "status", "source_text"].includes(metadataKey) || metadataValue === null || metadataValue === "") continue;
        valueCell.append(el("small", `${metadataKey.replaceAll("_", " ")}: ${String(metadataValue)}`, "hm-development-field-source-text"));
      }
      factList.append(el("dt", fieldLabels[key] ?? key.replaceAll("_", " "), "hm-development-source-label"), valueCell);
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
    if (!tags.childElementCount) tags.append(el("span", "No derived tags", "hm-development-record-tag is-muted"));
    classification.append(tags);

    const provenance = el("section", undefined, "hm-development-record-detail-provenance");
    provenance.append(el("span", "Source-reported values are reproduced as published and have not been independently verified."));
    provenance.append(el("span", record.activity_basis || "Permit issued in report month; current status unknown."));
    provenance.append(el("span", "Owner and builder contact addresses are withheld."));
    if (record.source_evidence_ref?.source_page) provenance.append(el("span", `Source evidence · monthly permit report, page ${record.source_evidence_ref.source_page}`));
    provenance.append(el("span", `Classification: ${record.classification_status || "not stated"} · Taxonomy: ${record.taxonomy_version || "not stated"}`));

    detail.append(header, site, metrics, facts, classification);
    detail.append(provenance);
    recordDialog.setAttribute("aria-labelledby", title.id);
    recordDialog.replaceChildren(detail);
    recordDialog.showModal();
    dismiss.focus({ preventScroll: true });
    recordDialog.addEventListener("close", () => {
      if (trigger.isConnected) trigger.focus({ preventScroll: true });
    }, { once: true });
  };
  recordDialog.addEventListener("click", (event) => {
    if (event.target === recordDialog) recordDialog.close();
  });

  const pageSize = 50;
  let page = 0;
  function update() {
    const query = search.value.trim().toLocaleLowerCase();
    const focusOnly = filter.value === "focus";
    const matches = records.filter((record) => {
      if (focusOnly && !(record.derived_sector_tags ?? []).some((tag) => FOCUS_SECTORS.has(tag.tag ?? tag.label ?? tag))) return false;
      if (!query) return true;
      return [
        ...Object.values(record.source_fields ?? {}).flatMap((field) => [field.value, field.source_text]),
        ...record.derived_sector_tags,
        ...record.derived_action_tags,
      ].some((value) => String(value ?? "").toLocaleLowerCase().includes(query));
    });
    const pageCount = Math.max(1, Math.ceil(matches.length / pageSize));
    page = Math.min(page, pageCount - 1);
    resultStatus.textContent = `${number(matches.length)} ${matches.length === 1 ? "record" : "records"} · showing ${matches.length ? page * pageSize + 1 : 0}–${Math.min((page + 1) * pageSize, matches.length)}`;
    position.textContent = `Page ${page + 1} of ${pageCount}`;
    previous.disabled = page === 0;
    next.disabled = page + 1 >= pageCount;
    list.replaceChildren();
    const pageRecords = matches.slice(page * pageSize, (page + 1) * pageSize);
    if (!pageRecords.length) list.append(el("p", "No permit records match these search and filter settings.", "hm-development-browser-empty"));
    for (const record of pageRecords) {
      const row = el("button", undefined, "hm-development-browser-item");
      row.type = "button";
      row.setAttribute("aria-haspopup", "dialog");
      const identity = el("span", undefined, "hm-development-browser-item-identity");
      identity.append(el("strong", permitNumber(record) || "Permit record"), el("span", record.source_fields?.location_text?.value || "Location not available"));
      const meta = el("span", undefined, "hm-development-browser-item-meta");
      meta.append(el("time", record.report_month || "—"));
      const value = record.source_fields?.construction_value?.value;
      if (value !== null && value !== undefined && value !== "") meta.append(el("span", new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(Number(value))));
      const tags = [...(record.derived_sector_tags ?? []), ...(record.derived_action_tags ?? [])].slice(0, 4);
      const tagLine = el("span", tags.map((tag) => String(tag?.label ?? tag?.tag ?? tag).replaceAll("_", " ")).join(" · "), "hm-development-browser-item-tags");
      row.append(identity, meta);
      if (tags.length) row.append(tagLine);
      row.addEventListener("click", () => openRecord(record, row));
      list.append(row);
    }
  }
  search.addEventListener("input", () => { page = 0; update(); });
  filter.addEventListener("change", () => { page = 0; update(); });
  previous.addEventListener("click", () => { page--; update(); });
  next.addEventListener("click", () => { page++; update(); });
  update();
  return panel;
}
