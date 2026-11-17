import { el } from "./dossier.js";
import { putLocalRecord, removeLocalRecord, workspaceRecords } from "./local-data.js";

const OPTIONS = [
  "Market and demand", "Design and massing", "Infrastructure and servicing",
  "Approvals and permits", "Financial model", "Stakeholders and engagement",
  "Implementation and phasing", "Alternatives considered",
];
const DEFAULT_SECTIONS = [
  "Vision and intended outcomes", "Site conditions", "Development concept",
  "Evidence and data", "Constraints, risks, and open questions", "Viability",
  "Decisions and next steps",
];
const uid = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
const valueText = (value) => {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

function button(label, action, className = "parcel-btn") {
  const node = el("button", label, className);
  node.type = "button";
  node.addEventListener("click", action);
  return node;
}

function markdown(parent, source) {
  parent.replaceChildren();
  let list = null;
  for (const line of String(source ?? "").split("\n")) {
    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    const bullet = /^\s*[-*+]\s+(.+)$/.exec(line);
    if (heading) {
      list = null;
      parent.append(el(`h${heading[1].length}`, heading[2]));
    } else if (bullet) {
      if (!list) { list = el("ul"); parent.append(list); }
      list.append(el("li", bullet[1]));
    } else if (line.trim()) {
      list = null;
      parent.append(el("p", line));
    } else list = null;
  }
}

function checklistPane(parcelKey) {
  const pane = el("div", undefined, "parcel-ws-service parcel-ws-checklists");
  const status = el("p", "On this device · attached to this parcel", "parcel-ws-ondevice");
  const heading = el("div", undefined, "parcel-ws-service-head");
  heading.append(el("h3", "Site review checklist"));
  const add = button("＋ Add item", async () => {
    const label = input.value.trim();
    if (!label) return;
    await putLocalRecord("checklists", { id: uid(), parcelKey, label, done: false, createdAt: new Date().toISOString() });
    input.value = "";
    await render();
  }, "parcel-btn parcel-btn-pri");
  heading.append(add);
  const input = document.createElement("input");
  input.type = "text";
  input.maxLength = 180;
  input.placeholder = "Add a review item";
  input.setAttribute("aria-label", "New checklist item");
  input.addEventListener("keydown", (event) => { if (event.key === "Enter") add.click(); });
  const list = el("ul", undefined, "parcel-ws-task-list");
  pane.append(status, heading, input, list);
  async function render() {
    const rows = (await workspaceRecords("checklists", parcelKey)).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    list.replaceChildren();
    if (!rows.length) list.append(el("li", "Add the first item for this site review.", "parcel-ws-empty"));
    for (const item of rows) {
      const li = el("li", undefined, "parcel-ws-task");
      const check = document.createElement("input");
      check.type = "checkbox";
      check.checked = Boolean(item.done);
      check.setAttribute("aria-label", `Complete ${item.label}`);
      check.addEventListener("change", async () => { await putLocalRecord("checklists", { ...item, done: check.checked }); li.classList.toggle("is-done", check.checked); });
      li.append(check, el("span", item.label));
      li.append(button("Delete", async () => { if (confirm(`Delete “${item.label}”?`)) { await removeLocalRecord("checklists", item.id); await render(); } }, "parcel-mini"));
      if (check.checked) li.classList.add("is-done");
      list.append(li);
    }
  }
  void render();
  return pane;
}

function listsPane(parcelKey) {
  const pane = el("div", undefined, "parcel-ws-service parcel-ws-lists");
  const status = el("p", "Planning lists stay on this device and are attached to this parcel.", "parcel-ws-ondevice");
  const controls = el("div", undefined, "parcel-ws-inline-form");
  const name = document.createElement("input");
  name.type = "text"; name.maxLength = 100; name.placeholder = "Name a list"; name.setAttribute("aria-label", "List name");
  const create = button("＋ New list", async () => {
    const title = name.value.trim(); if (!title) return;
    await putLocalRecord("lists", { id: uid(), parcelKey, title, items: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    name.value = ""; await render();
  }, "parcel-btn parcel-btn-pri");
  name.addEventListener("keydown", (event) => { if (event.key === "Enter") create.click(); });
  controls.append(name, create);
  const list = el("div", undefined, "parcel-ws-list-cards");
  pane.append(status, controls, list);
  async function render() {
    const records = (await workspaceRecords("lists", parcelKey)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    list.replaceChildren();
    if (!records.length) list.append(el("p", "Create a list for ideas, questions, options, or follow-up.", "parcel-ws-empty"));
    for (const record of records) {
      const card = el("section", undefined, "parcel-ws-list-card");
      const head = el("div", undefined, "parcel-ws-service-head");
      const title = document.createElement("input"); title.value = record.title; title.maxLength = 100; title.setAttribute("aria-label", "List title");
      title.addEventListener("change", async () => { record.title = title.value.trim() || record.title; record.updatedAt = new Date().toISOString(); await putLocalRecord("lists", record); });
      head.append(title, button("Delete list", async () => { if (confirm(`Delete “${record.title}” and its items?`)) { await removeLocalRecord("lists", record.id); await render(); } }, "parcel-mini"));
      const items = el("ul", undefined, "parcel-ws-task-list");
      for (const item of record.items) {
        const row = el("li", undefined, "parcel-ws-task");
        row.append(el("span", item.text));
        row.append(button("Delete", async () => { record.items = record.items.filter((x) => x.id !== item.id); record.updatedAt = new Date().toISOString(); await putLocalRecord("lists", record); await render(); }, "parcel-mini"));
        items.append(row);
      }
      const form = el("div", undefined, "parcel-ws-inline-form");
      const itemInput = document.createElement("input"); itemInput.type = "text"; itemInput.maxLength = 500; itemInput.placeholder = "Add an item"; itemInput.setAttribute("aria-label", `Add item to ${record.title}`);
      const add = button("＋", async () => { const text = itemInput.value.trim(); if (!text) return; record.items.push({ id: uid(), text }); record.updatedAt = new Date().toISOString(); await putLocalRecord("lists", record); await render(); }, "parcel-btn parcel-btn-pri");
      itemInput.addEventListener("keydown", (event) => { if (event.key === "Enter") add.click(); });
      form.append(itemInput, add); card.append(head, items, form); list.append(card);
    }
  }
  void render();
  return pane;
}

function dataCatalog(records) {
  const rows = new Map();
  function visit(value, path, layer = "Parcel record", row = "Parcel") {
    if (Array.isArray(value)) {
      value.forEach((item, index) => visit(item, `${path}[${index + 1}]`, layer, `${path.split(".").at(-1)} ${index + 1}`));
    } else if (value && typeof value === "object") {
      const nextLayer = typeof value.src === "string" ? value.src : typeof value.layer === "string" ? value.layer : layer;
      const nextRow = value.fid ?? value.arn ?? value.id ?? value.key ?? value.name ?? value.class ?? row;
      for (const [key, item] of Object.entries(value)) visit(item, path ? `${path}.${key}` : key, nextLayer, String(nextRow));
    } else {
      const id = `${layer}::${row}`;
      if (!rows.has(id)) rows.set(id, { id, layer, label: row, fields: [] });
      rows.get(id).fields.push({ path, label: path.split(".").at(-1).replace(/\[\d+\]/g, ""), value: valueText(value) });
    }
  }
  for (const [name, value] of Object.entries(records ?? {})) visit(value, name, name, name);
  return [...rows.values()].sort((a, b) => a.layer.localeCompare(b.layer) || a.label.localeCompare(b.label));
}

function fieldNotesPane(parcelKey, sourceRecords, docState) {
  const pane = el("section", undefined, "parcel-ws-field-browser");
  pane.append(el("h3", "Data notes"), el("p", "Choose a source layer, find a row, then comment on any available field. Notes are private to this parcel project.", "parcel-ws-ondevice"));
  const catalog = dataCatalog(sourceRecords);
  const layerSelect = document.createElement("select"); layerSelect.setAttribute("aria-label", "Data layer");
  const rowSearch = document.createElement("input"); rowSearch.type = "search"; rowSearch.placeholder = "Filter rows"; rowSearch.setAttribute("aria-label", "Filter data rows");
  const rowSelect = document.createElement("select"); rowSelect.setAttribute("aria-label", "Data row");
  const fieldSelect = document.createElement("select"); fieldSelect.setAttribute("aria-label", "Data field");
  const value = el("p", "Select a field to see its source value.", "parcel-ws-field-value");
  const note = document.createElement("textarea"); note.rows = 3; note.maxLength = 5000; note.placeholder = "Comment on this field…"; note.setAttribute("aria-label", "Comment on this data field");
  const save = button("Save field note", async () => {
    const row = catalog.find((item) => item.id === rowSelect.value);
    const field = row?.fields[Number(fieldSelect.value)];
    const text = note.value.trim(); if (!row || !field || !text) return;
    const annotation = { id: uid(), parcelKey, layer: row.layer, row: row.label, field: field.path, value: field.value, text, createdAt: new Date().toISOString() };
    await putLocalRecord("field-notes", annotation); note.value = ""; await renderNotes();
    docState.setReference?.(annotation);
  }, "parcel-btn parcel-btn-pri");
  const notes = el("div", undefined, "parcel-ws-field-notes");
  const rowWrap = el("div", undefined, "parcel-ws-field-row");
  rowWrap.append(rowSearch, rowSelect);
  pane.append(layerSelect, rowWrap, fieldSelect, value, note, save, notes);
  const layers = [...new Set(catalog.map((item) => item.layer))];
  for (const layer of layers) layerSelect.append(new Option(layer, layer));
  function updateRows() {
    const query = rowSearch.value.trim().toLowerCase();
    const matches = catalog.filter((item) => item.layer === layerSelect.value && `${item.label} ${item.id}`.toLowerCase().includes(query));
    rowSelect.replaceChildren(...matches.map((item) => new Option(item.label, item.id)));
    updateFields();
  }
  function updateFields() {
    const row = catalog.find((item) => item.id === rowSelect.value);
    fieldSelect.replaceChildren(...(row?.fields ?? []).map((item, index) => new Option(`${item.label}: ${item.value}`, String(index))));
    const field = row?.fields[Number(fieldSelect.value)]; value.textContent = field ? `${field.path} · ${field.value}` : "No fields in this row.";
  }
  layerSelect.addEventListener("change", updateRows); rowSearch.addEventListener("input", updateRows); rowSelect.addEventListener("change", updateFields); fieldSelect.addEventListener("change", updateFields);
  async function renderNotes() {
    const existing = (await workspaceRecords("field-notes", parcelKey)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    notes.replaceChildren();
    for (const item of existing) {
      const card = el("article", undefined, "parcel-ws-field-note");
      card.append(el("strong", `${item.layer} · ${item.row}`), el("small", item.field), el("p", item.text));
      card.append(button("Delete", async () => { if (confirm("Delete this field note?")) { await removeLocalRecord("field-notes", item.id); await renderNotes(); } }, "parcel-mini"));
      notes.append(card);
    }
  }
  if (layers.length) { layerSelect.value = layers[0]; updateRows(); }
  else pane.append(el("p", "This parcel release has no field inventory available yet.", "parcel-ws-empty"));
  void renderNotes();
  return pane;
}

function documentsPane(parcelKey, sourceRecords) {
  const pane = el("div", undefined, "parcel-ws-service parcel-ws-docs");
  const listView = el("div", undefined, "parcel-ws-doc-list-view");
  const listHead = el("div", undefined, "parcel-ws-service-head");
  listHead.append(el("h3", "Docs"));
  const create = button("＋ New document", async () => {
    const now = new Date().toISOString();
    const doc = { id: uid(), parcelKey, title: "Untitled site plan", template: "default-general", sections: DEFAULT_SECTIONS.map((title) => ({ id: uid(), title, parentId: null, markdown: "" })), createdAt: now, updatedAt: now };
    await putLocalRecord("documents", doc); await open(doc, true); await renderList();
  }, "parcel-btn parcel-btn-pri");
  listHead.append(create);
  const list = el("div", undefined, "parcel-ws-doc-list");
  listView.append(listHead, el("p", "Documents stay on this device and are attached to this parcel.", "parcel-ws-ondevice"), list);
  pane.append(listView);
  let activeDoc = null; let selectedId = null; let editing = false;
  async function renderList() {
    const docs = (await workspaceRecords("documents", parcelKey)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    list.replaceChildren();
    if (!docs.length) list.append(el("p", "No documents yet. Start with the default-general site plan.", "parcel-ws-empty"));
    for (const doc of docs) {
      const card = el("article", undefined, "parcel-ws-doc-card");
      const title = button(doc.title, () => { void open(doc, false); }, "parcel-ws-doc-open");
      card.append(title, el("small", `${doc.template} · ${doc.sections.length} sections`));
      const actions = el("div", undefined, "parcel-ws-inline-form");
      actions.append(button("Edit", () => { void open(doc, true); }, "parcel-mini"));
      actions.append(button("Delete", async () => { if (confirm(`Delete “${doc.title}”?`)) { await removeLocalRecord("documents", doc.id); await renderList(); } }, "parcel-mini"));
      card.append(actions); list.append(card);
    }
  }
  async function open(doc, edit) {
    activeDoc = structuredClone(doc); editing = edit; selectedId = activeDoc.sections[0]?.id ?? null; renderDocument();
  }
  function renderDocument() {
    listView.hidden = true;
    let screen = pane.querySelector(".parcel-ws-docscreen");
    if (!screen) { screen = el("div", undefined, "parcel-ws-docscreen"); pane.append(screen); }
    screen.replaceChildren();
    const sidebar = el("aside", undefined, "parcel-ws-doc-outline");
    const body = el("div", undefined, "parcel-ws-doc-body");
    const top = el("div", undefined, "parcel-ws-doc-toolbar");
    top.append(button("← Docs", () => { activeDoc = null; screen.remove(); listView.hidden = false; void renderList(); }, "parcel-mini"));
    const title = document.createElement("input"); title.value = activeDoc.title; title.setAttribute("aria-label", "Document title"); title.maxLength = 180;
    title.disabled = !editing;
    title.addEventListener("change", () => { activeDoc.title = title.value.trim() || activeDoc.title; void saveDoc(); });
    top.append(title, el("span", editing ? "Editing" : "Reading", "parcel-ws-doc-mode"));
    if (!editing) top.append(button("Edit", () => { editing = true; renderDocument(); }, "parcel-btn parcel-btn-pri"));
    screen.append(top);
    const outlineHead = el("div", undefined, "parcel-ws-service-head"); outlineHead.append(el("h3", "Sections"));
    const addSection = document.createElement("select"); addSection.setAttribute("aria-label", "Add optional section");
    addSection.append(new Option("＋ Add section", ""));
    for (const option of OPTIONS.filter((item) => !activeDoc.sections.some((section) => section.title === item))) addSection.append(new Option(option, option));
    addSection.disabled = !editing;
    addSection.addEventListener("change", () => { if (!addSection.value) return; const item = { id: uid(), title: addSection.value, parentId: null, markdown: "" }; activeDoc.sections.push(item); selectedId = item.id; void saveDoc(); renderDocument(); });
    outlineHead.append(addSection); sidebar.append(outlineHead);
    for (const section of activeDoc.sections) {
      if (section.parentId && !activeDoc.sections.some((item) => item.id === section.parentId)) section.parentId = null;
      const row = el("div", undefined, `parcel-ws-outline-row${section.parentId ? " is-child" : ""}`);
      const pick = button(section.title, () => { selectedId = section.id; renderDocument(); }, `parcel-ws-outline-select${selectedId === section.id ? " is-active" : ""}`);
      row.append(pick);
      if (editing) {
        row.append(button("＋", () => { const item = { id: uid(), title: "New subsection", parentId: section.id, markdown: "" }; activeDoc.sections.splice(activeDoc.sections.indexOf(section) + 1, 0, item); selectedId = item.id; void saveDoc(); renderDocument(); }, "parcel-mini"));
        row.append(button("−", () => { if (confirm(`Delete “${section.title}” and its subsections?`)) { const ids = new Set([section.id]); let changed = true; while (changed) { changed = false; for (const item of activeDoc.sections) if (item.parentId && ids.has(item.parentId) && !ids.has(item.id)) { ids.add(item.id); changed = true; } } activeDoc.sections = activeDoc.sections.filter((item) => !ids.has(item.id)); selectedId = activeDoc.sections[0]?.id ?? null; void saveDoc(); renderDocument(); } }, "parcel-mini"));
      }
      sidebar.append(row);
    }
    if (editing) sidebar.append(button("＋ Add subsection", () => { const item = { id: uid(), title: "New subsection", parentId: selectedId, markdown: "" }; activeDoc.sections.push(item); selectedId = item.id; void saveDoc(); renderDocument(); }, "parcel-mini"));
    const selected = activeDoc.sections.find((item) => item.id === selectedId);
    if (selected) {
      const sectionTitle = document.createElement("input"); sectionTitle.value = selected.title; sectionTitle.disabled = !editing; sectionTitle.setAttribute("aria-label", "Section title");
      sectionTitle.addEventListener("change", () => { selected.title = sectionTitle.value.trim() || selected.title; void saveDoc(); renderDocument(); });
      body.append(sectionTitle);
      if (editing) {
        const editor = document.createElement("textarea"); editor.className = "parcel-ws-markdown-editor"; editor.value = selected.markdown; editor.placeholder = "Write this section in Markdown…"; editor.setAttribute("aria-label", `${selected.title} Markdown`);
        editor.addEventListener("input", () => { selected.markdown = editor.value; scheduleSave(); });
        body.append(editor, el("p", "Markdown: use # headings, paragraphs, and - bullets.", "parcel-ws-ondevice"));
      } else {
        const reader = el("article", undefined, "parcel-ws-markdown-reader"); markdown(reader, selected.markdown); body.append(reader);
      }
    } else body.append(el("p", "Add a section to begin.", "parcel-ws-empty"));
    const sourcePanel = fieldNotesPane(parcelKey, sourceRecords, { setReference: (item) => {
      const selectedSection = activeDoc.sections.find((section) => section.id === selectedId);
      if (!selectedSection || !editing) return;
      selectedSection.markdown = `${selectedSection.markdown}${selectedSection.markdown ? "\n\n" : ""}> **Data note:** ${item.layer} · ${item.row} · ${item.field}\n> ${item.text.replace(/\n/g, "\n> ")}`;
      void saveDoc(); renderDocument();
    }});
    const dataToggle = button("Data notes · browse parcel fields", () => { sourcePanel.hidden = !sourcePanel.hidden; }, "parcel-mini");
    sourcePanel.hidden = true;
    body.append(dataToggle, sourcePanel);
    screen.append(sidebar, body);
  }
  let saveTimer;
  function scheduleSave() { clearTimeout(saveTimer); saveTimer = setTimeout(() => void saveDoc(), 500); }
  async function saveDoc() { if (!activeDoc) return; activeDoc.updatedAt = new Date().toISOString(); await putLocalRecord("documents", activeDoc); }
  void renderList();
  return pane;
}

export function createWorkspaceServices({ summary, sourceRecords = {} }) {
  return {
    checklist: checklistPane(summary.key),
    lists: listsPane(summary.key),
    docs: documentsPane(summary.key, sourceRecords),
  };
}
