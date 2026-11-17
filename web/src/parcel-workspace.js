/* Parcel workspace renderer (parcel-views design §5.4, BL-118).
 *
 * The third parcel level: the record at left, the work area at right,
 * inside the map window, extending to its bottom edge while open.
 * Renders from summariseRecord, like the card and drawer. Interface
 * chrome is literal, as the site does for chrome; every data word comes
 * from the summary, which itself resolves labels.
 *
 * Only Notes works in this build. The other workspace areas remain
 * visible without availability badges. Notes are device-only.
 */

import { el } from "./dossier.js";
import { copyLinkButton, disabledAction, thumbnail } from "./parcel-views.js";

const TABS = [
  { id: "notes", labelKey: "parcel.workspace.tab.notes", works: true },
  { id: "checklist", labelKey: "parcel.workspace.tab.checklist", works: false },
  { id: "lists", labelKey: "parcel.workspace.tab.lists", works: false },
  { id: "export", labelKey: "parcel.workspace.tab.export", works: false },
  { id: "docs", labelKey: "parcel.workspace.tab.docs", works: false },
  { id: "history", labelKey: "parcel.workspace.tab.history", works: false },
];

function formatNoteTime(at) {
  const d = new Date(at);
  if (Number.isNaN(d.getTime())) return at;
  return d.toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" });
}

/** One fact row: label, value, share bar; a click discloses its source,
 * join method and confidence in place. */
function factRow(labels, fact) {
  const row = el("div", undefined, "parcel-ws-fact");
  const button = el("button", undefined, "parcel-ws-fact-btn");
  button.setAttribute("aria-expanded", "false");
  button.append(el("span", fact.label, "parcel-ws-fact-label"));
  button.append(el("strong", fact.value));
  if (fact.sub) button.append(el("em", fact.sub));
  if (fact.share !== null && fact.share !== undefined) {
    const bar = el("span", undefined, "parcel-bar");
    const fill = el("span");
    fill.style.width = `${Math.min(100, Math.max(0, fact.share * 100))}%`;
    bar.append(fill);
    button.append(bar);
  }
  const src = el("div", undefined, "parcel-ws-fact-src");
  src.hidden = true;
  if (fact.provenance) {
    const parts = [
      `${labels.t("parcel.workspace.source")}: ${fact.provenance.sourceLabel}`,
    ];
    if (fact.provenance.joinText) {
      parts.push(`${labels.t("parcel.workspace.source.join")}: ${fact.provenance.joinText}`);
    }
    if (fact.provenance.confText) {
      parts.push(`${labels.t("parcel.workspace.source.confidence")}: ${fact.provenance.confText}`);
    }
    src.textContent = parts.join(" · ");
  } else {
    src.textContent = labels.t("dossier.provenance.not_yet_captured");
  }
  button.addEventListener("click", () => {
    const open = src.hidden;
    src.hidden = !open;
    button.setAttribute("aria-expanded", String(open));
  });
  row.append(button, src);
  return row;
}

/** One collapsible section with a count. Toggling updates the DOM in
 * place and reports back so the caller can remember it for the session. */
function section(labels, { id, label, count, open, onToggle, body }) {
  const sec = el("div", undefined, "parcel-ws-sec");
  sec.dataset.sec = id;
  const button = el("button", undefined, "parcel-ws-sec-btn");
  button.setAttribute("aria-expanded", String(open));
  button.append(el("i", open ? "▾" : "▸", "parcel-ws-caret"));
  button.append(el("span", label));
  button.append(el("em", String(count)));
  const content = el("div", undefined, "parcel-ws-sec-body");
  content.hidden = !open;
  content.append(body);
  button.addEventListener("click", () => {
    const next = content.hidden;
    content.hidden = !next;
    button.setAttribute("aria-expanded", String(next));
    button.querySelector(".parcel-ws-caret").textContent = next ? "▾" : "▸";
    onToggle(id, next);
  });
  sec.append(button, content);
  return sec;
}

function listItems(items, emptyText) {
  const list = el("ul", undefined, "parcel-ws-list");
  if (!items.length) list.append(el("li", emptyText));
  else for (const item of items) list.append(el("li", item));
  return list;
}

/** Addresses: the full list, with a filter box above 12 addresses and a
 * plain note when the detail record is unavailable. */
function addressesBody(summary, labels) {
  const wrap = el("div");
  if (!summary.addresses.complete) {
    wrap.append(
      el(
        "p",
        labels.t("parcel.addresses.partial", {
          shown: summary.addresses.shown.length,
          count: summary.addresses.count,
        }),
        "parcel-ws-partial",
      ),
    );
  }
  const list = listItems(
    summary.addresses.shown.map((a) => a.text),
    labels.t("parcel.none_found"),
  );
  if (summary.addresses.count > 12) {
    const filter = document.createElement("input");
    filter.type = "search";
    filter.className = "parcel-ws-filter";
    filter.placeholder = labels.t("parcel.workspace.addresses.filter");
    filter.setAttribute("aria-label", labels.t("parcel.workspace.addresses.filter"));
    const countLine = el("p", "", "parcel-ws-filter-count");
    filter.addEventListener("input", () => {
      const q = filter.value.trim().toLowerCase();
      let shown = 0;
      for (const li of list.children) {
        const hit = !q || li.textContent.toLowerCase().includes(q);
        li.hidden = !hit;
        if (hit) shown++;
      }
      countLine.textContent = q
        ? labels.t("parcel.workspace.addresses.filtered", {
            shown,
            count: summary.addresses.shown.length,
          })
        : "";
    });
    wrap.append(filter, countLine);
  }
  wrap.append(list);
  return wrap;
}

/** The Notes pane: compose, list, delete, and the device-only line. */
function notesPane(summary, labels, notesStore, releaseId, onCountChange) {
  const pane = el("div", undefined, "parcel-ws-notes");
  pane.append(el("p", labels.t("parcel.workspace.notes.on_device"), "parcel-ws-ondevice"));
  const compose = el("div", undefined, "parcel-ws-compose");
  const area = document.createElement("textarea");
  area.rows = 3;
  area.placeholder = labels.t("parcel.workspace.notes.placeholder");
  area.setAttribute("aria-label", labels.t("parcel.workspace.notes.write"));
  const add = el("button", undefined, "parcel-btn parcel-btn-pri");
  add.append(el("span", labels.t("parcel.workspace.notes.add")));
  const row = el("div", undefined, "parcel-ws-compose-row");
  row.append(add);
  compose.append(area, row);
  pane.append(compose);
  const list = el("ul", undefined, "parcel-ws-note-list");
  const empty = el("p", labels.t("parcel.workspace.notes.empty"), "parcel-ws-empty");
  pane.append(list, empty);

  function renderList() {
    const notes = notesStore.notesFor(summary.key);
    list.replaceChildren();
    for (const note of notes) {
      const li = el("li", undefined, "parcel-ws-note");
      li.append(el("p", note.text));
      const meta = el("small");
      meta.append(document.createTextNode(formatNoteTime(note.at)));
      meta.append(document.createTextNode(" · "));
      const del = el("button", labels.t("parcel.workspace.notes.delete"), "parcel-mini");
      del.addEventListener("click", () => {
        notesStore.remove(note.id);
        renderList();
      });
      meta.append(del);
      li.append(meta);
      list.append(li);
    }
    empty.hidden = notes.length > 0;
    onCountChange(notes.length);
  }
  add.addEventListener("click", () => {
    const note = notesStore.add({ key: summary.key, releaseId, text: area.value });
    if (note) {
      area.value = "";
      renderList();
      area.focus();
    }
  });
  renderList();
  return pane;
}

/** The right-hand work area: six tabs, only Notes working. */
function workArea(summary, labels, notesStore, releaseId, initialTab) {
  const work = el("div", undefined, "parcel-ws-work");
  const tablist = el("div", undefined, "parcel-ws-tabs");
  tablist.setAttribute("role", "tablist");
  const panes = new Map();
  let notesCount = null;
  let activeTab = initialTab;
  let selectTab = null;

  for (const tab of TABS) {
    const button = el("button", undefined, "parcel-ws-tab");
    button.setAttribute("role", "tab");
    button.dataset.parcelTab = tab.id;
    button.setAttribute("aria-selected", String(tab.id === activeTab));
    button.append(el("span", labels.t(tab.labelKey)));
    if (tab.id === "notes") {
      notesCount = el("em", "0", "parcel-ws-tab-count");
      button.append(notesCount);
    }
    button.addEventListener("click", () => selectTab(tab.id));
    tablist.append(button);
  }
  work.append(tablist);

  const notes = notesPane(summary, labels, notesStore, releaseId, (n) => {
    if (notesCount) notesCount.textContent = String(n);
  });
  panes.set("notes", notes);
  for (const tab of TABS.filter((t) => !t.works)) {
    const pane = el("div", undefined, "parcel-ws-coming-pane");
    pane.append(el("p", labels.t(tab.labelKey)));
    panes.set(tab.id, pane);
  }
  for (const [id, pane] of panes) {
    pane.hidden = id !== activeTab;
    work.append(pane);
  }
  selectTab = (id) => {
    activeTab = id;
    for (const [tabId, pane] of panes) pane.hidden = tabId !== id;
    [...tablist.children].forEach((button, i) => {
      button.setAttribute("aria-selected", String(TABS[i].id === id));
    });
  };
  return { work, selectTab };
}

/** The workspace: record at left, work area at right (design §5.4). */
export function parcelWorkspaceElement(summary, labels, {
  geometry,
  releaseId,
  notesStore,
  initialTab = "notes",
  openSections,
  onToggleSection,
  onBackToMap,
  onClose,
}) {
  const ws = el("section", undefined, "parcel-workspace");
  ws.setAttribute("role", "region");
  ws.setAttribute("aria-label", "Parcel workspace");
  ws.dataset.mobilePane = "record";

  const head = el("div", undefined, "parcel-ws-head");
  head.append(thumbnail(geometry));
  const titles = el("div", undefined, "parcel-ws-titles");
  const crumb = ["Hamilton"];
  if (summary.locality) crumb.push(summary.locality);
  crumb.push(labels.t("dossier.field.parcel"));
  titles.append(el("div", crumb.join(" › "), "parcel-ws-crumb"));
  titles.append(el("h2", summary.title, "parcel-title"));
  titles.append(el("p", summary.subtitle, "parcel-sub"));
  head.append(titles);

  const actions = el("div", undefined, "parcel-actions");
  actions.append(disabledAction("☆ Save"));
  actions.append(disabledAction("⤓ Export"));
  actions.append(copyLinkButton(summary));
  const back = el("button", undefined, "parcel-btn");
  back.append(el("span", labels.t("parcel.workspace.back")));
  back.addEventListener("click", onBackToMap);
  actions.append(back);
  const close = el("button", "✕", "parcel-btn-ico");
  close.setAttribute("aria-label", "Close workspace");
  close.addEventListener("click", onClose);
  actions.append(close);
  head.append(actions);
  ws.append(head);

  const mobileSwitch = el("div", undefined, "parcel-ws-switch");
  const recordSwitch = el("button", labels.t("parcel.workspace.pane.record"), "parcel-ws-switch-btn");
  const notesSwitch = el("button", labels.t("parcel.workspace.tab.notes"), "parcel-ws-switch-btn");
  recordSwitch.setAttribute("aria-pressed", "true");
  notesSwitch.setAttribute("aria-pressed", "false");
  mobileSwitch.append(recordSwitch, notesSwitch);
  ws.append(mobileSwitch);

  const cols = el("div", undefined, "parcel-ws-cols");
  const record = el("div", undefined, "parcel-ws-record");
  for (const fact of summary.facts) record.append(factRow(labels, fact));
  const sections = [
    {
      id: "addresses",
      label: labels.t("parcel.identity.addresses"),
      count: summary.addresses.count,
      body: addressesBody(summary, labels),
    },
    {
      id: "slivers",
      label: labels.t("parcel.attention.slivers"),
      count: summary.attention.slivers.count,
      body: listItems(
        summary.attention.slivers.items.map((s) => `${s.name}: ${s.class} — ${s.shareText}`),
        labels.t("parcel.none_found"),
      ),
    },
    {
      id: "gaps",
      label: labels.t("parcel.attention.gaps"),
      count: summary.attention.gaps.count,
      body: listItems(
        summary.attention.gaps.items.map((g) => g.id),
        labels.t("parcel.none_found"),
      ),
    },
    {
      id: "not_yet",
      label: labels.t("parcel.attention.not_yet"),
      count: summary.attention.notYet.count,
      body: listItems(
        summary.attention.notYet.items.map((n) => `${n.label}: ${n.value}`),
        labels.t("parcel.none_found"),
      ),
    },
    {
      id: "sources",
      label: labels.t("parcel.attention.sources"),
      count: summary.attention.sources.count,
      body: listItems(
        summary.attention.sources.items.map((s) => `${s.label} — ${s.paths.join(", ")}`),
        labels.t("parcel.none_found"),
      ),
    },
  ];
  for (const sec of sections) {
    record.append(
      section(labels, {
        ...sec,
        open: openSections.has(sec.id),
        onToggle: onToggleSection,
      }),
    );
  }
  cols.append(record);

  const { work, selectTab } = workArea(summary, labels, notesStore, releaseId, initialTab);
  cols.append(work);
  ws.append(cols);

  recordSwitch.addEventListener("click", () => {
    ws.dataset.mobilePane = "record";
    recordSwitch.setAttribute("aria-pressed", "true");
    notesSwitch.setAttribute("aria-pressed", "false");
  });
  notesSwitch.addEventListener("click", () => {
    ws.dataset.mobilePane = "notes";
    recordSwitch.setAttribute("aria-pressed", "false");
    notesSwitch.setAttribute("aria-pressed", "true");
    selectTab("notes");
  });
  return ws;
}
