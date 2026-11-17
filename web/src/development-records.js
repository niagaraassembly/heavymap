/* Hamilton permit viewer adapter for the versioned Atlas field-screen package.
 * This is a provisional consumer of viewer package 0.1; it does not alter the
 * parcel dossier contract. The package is pinned by hashes in its manifest. */

import { sha256Hex } from "./hash.js";
import { el } from "./dossier.js";

const RECORDS_FILE = "viewer_development_records_v0.1.json";
const INDICATORS_FILE = "parcel_development_indicators_v0.1.json";
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
      if (doc.schema_version !== "hamilton-development-release-manifest/0.1.0" || doc.jurisdiction !== "ca/on/hamilton")
        throw new Error("Unsupported Hamilton development package.");
      manifest = doc;
      const indicatorBytes = await fetchBytes(`${root}${INDICATORS_FILE}`);
      if (await sha256Hex(indicatorBytes) !== doc.outputs[INDICATORS_FILE])
        throw new Error("Hamilton parcel indicators failed hash verification.");
      indicators = parse(indicatorBytes);
      if (indicators.schema_version !== "hamilton-parcel-development-indicators/0.1.0" || indicators.jurisdiction !== doc.jurisdiction)
        throw new Error("Hamilton parcel indicators have an incompatible schema.");
      return { ok: true, recordCount: doc.record_count, focusCount: doc.focus_record_count };
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
      if (doc.schema_version !== "hamilton-development-viewer/0.1.0" || doc.jurisdiction !== manifest.jurisdiction || doc.record_count !== manifest.record_count || !Array.isArray(doc.records) || doc.records.length !== doc.record_count)
          throw new Error("Hamilton development records have an incompatible schema.");
        records = [...doc.records].sort((a, b) =>
          String(b.report_month).localeCompare(String(a.report_month)) ||
          String(b.permit_number).localeCompare(String(a.permit_number), "en", { numeric: true }),
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

function permitCard(record) {
  const card = el("article", undefined, "hm-development-record");
  const header = el("header", undefined, "hm-development-record-head");
  header.append(el("h4", record.permit_number || "Permit record"));
  header.append(el("time", record.report_month || ""));
  card.append(header);
  if (record.site_location) card.append(el("p", record.site_location, "hm-development-site"));
  const facts = el("dl", undefined, "hm-development-facts");
  const viewerValue = (value) => value === null || value === undefined || value === ""
    ? "No value in the screened viewer field"
    : String(value);
  for (const [label, value] of [
    ["Building type · source", viewerValue(record.source_reported_building_type)],
    ["Work type · source", viewerValue(record.source_reported_work_type)],
    ["Sector · derived", displayTags(record, "derived_sector_tags")],
    ["Action · derived", displayTags(record, "derived_action_tags")],
    ["Construction value · source", viewerValue(record.construction_value)],
    ["Building GFA · source", viewerValue(record.building_gfa)],
  ]) {
    if (value === null || value === undefined || value === "") continue;
    const valueCell = el("dd", String(value));
    if (label === "Building type · source" || label === "Work type · source")
      valueCell.classList.add("hm-development-source-value");
    facts.append(el("dt", label), valueCell);
  }
  card.append(facts);
  const names = record.source_reported_names;
  const shownNames = names && [names.owner, names.builder].filter(Boolean);
  if (shownNames?.length) {
    card.append(el("p", `Source-reported names; not independently verified: ${shownNames.join(" · ")}`, "hm-development-names"));
  }
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

export function developmentRecordsBrowserElement(records, { onBack, onClose } = {}) {
  const panel = el("section", undefined, "hm-development-browser");
  const head = el("header", undefined, "hm-development-browser-head");
  const titles = el("div");
  titles.append(el("p", "HAMILTON · MONTHLY PERMIT AUDITS", "hm-map-dialog-eyebrow"));
  titles.append(el("h2", "Development records", "hm-map-dialog-title"));
  const back = el("button", "← Snapshot", "hm-development-browser-back");
  back.type = "button";
  back.addEventListener("click", onBack);
  const close = el("button", "×", "hm-map-dialog-close");
  close.type = "button";
  close.setAttribute("aria-label", "Close development records");
  close.addEventListener("click", onClose);
  const actions = el("div", undefined, "hm-development-browser-actions");
  actions.append(back, close);
  head.append(titles, actions);
  panel.append(head);

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
  panel.append(controls);

  const resultStatus = el("p", "", "hm-development-browser-status");
  resultStatus.setAttribute("role", "status");
  panel.append(resultStatus);
  const list = el("div", undefined, "hm-development-browser-list");
  panel.append(list);
  const paging = el("div", undefined, "hm-development-browser-paging");
  const previous = el("button", "← Previous", "hm-development-page");
  const next = el("button", "Next →", "hm-development-page");
  previous.type = next.type = "button";
  const position = el("span");
  paging.append(previous, position, next);
  panel.append(paging);

  const pageSize = 30;
  let page = 0;
  function update() {
    const query = search.value.trim().toLocaleLowerCase();
    const focusOnly = filter.value === "focus";
    const matches = records.filter((record) => {
      if (focusOnly && record.display_profile !== "focus_with_source_reported_names") return false;
      if (!query) return true;
      return [
        record.permit_number,
        record.site_location,
        record.source_reported_building_type,
        record.source_reported_work_type,
        record.source_reported_names?.owner,
        record.source_reported_names?.builder,
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
    for (const record of matches.slice(page * pageSize, (page + 1) * pageSize)) {
      const details = el("details", undefined, "hm-development-browser-item");
      const summary = el("summary");
      summary.append(el("strong", record.permit_number || "Permit record"));
      summary.append(el("span", [record.report_month, record.site_location].filter(Boolean).join(" · ")));
      details.append(summary, permitCard(record));
      list.append(details);
    }
  }
  search.addEventListener("input", () => { page = 0; update(); });
  filter.addEventListener("change", () => { page = 0; update(); });
  previous.addEventListener("click", () => { page--; update(); });
  next.addEventListener("click", () => { page++; update(); });
  update();
  return panel;
}
