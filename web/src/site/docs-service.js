import { el } from "../dossier.js";
import { putLocalRecord, recordsFor, removeLocalRecord } from "../local-data.js";
import { createDossierLoader } from "../dossier-loader.js";
import { dataCatalog } from "../parcel-workspace-services.js";
import { loadLabels } from "../labels.js";
import { summariseRecord } from "../parcel-summary.js";
import {
  createHamiltonDevelopmentLoader,
  developmentRecordsBrowserElement,
} from "../development-records.js";

const RELEASE_BASE = "/map/data/ca-on-hamilton/2026-11-16-d070/";
const DEVELOPMENT_BASE = "/map/data/ca-on-hamilton-development/2026-11-17-field-screen-v0.3/";
const dossierLoader = createDossierLoader({ base: RELEASE_BASE });
const developmentLoader = createHamiltonDevelopmentLoader({ base: DEVELOPMENT_BASE });
let dossierPin;
let labelsPromise;

const TEMPLATES = [
  {
    id: "default-general", label: "General site plan", kind: "SITE PLAN",
    description: "A flexible home for the vision, site evidence, constraints, viability, and next steps.",
    title: "Site plan",
    sections: ["Vision and intended outcomes", "Site conditions", "Development concept", "Evidence and data", "Constraints, risks, and open questions", "Viability", "Decisions and next steps"],
  },
  {
    id: "site-brief", label: "One-page site brief", kind: "SITE BRIEF",
    description: "A concise snapshot of the opportunity, place, concept, and the questions that matter most.",
    title: "One-page site brief",
    sections: ["Opportunity at a glance", "The site", "Concept and intended outcomes", "Key evidence and constraints", "Open questions and next move"],
  },
  {
    id: "executive-summary", label: "Executive summary", kind: "EXECUTIVE SUMMARY",
    description: "A decision-ready overview for collaborators, advisors, or a future project package.",
    title: "Executive summary",
    sections: ["Purpose and recommendation", "Site and context", "Proposal", "Evidence and viability", "Key risks and decisions", "Immediate next steps"],
  },
  {
    id: "development-update", label: "Development update", kind: "PROJECT UPDATE",
    description: "Record what changed, what was learned, what is blocked, and what happens next.",
    title: "Development update",
    sections: ["Update at a glance", "Progress since last update", "Evidence and decisions", "Risks and blockers", "Upcoming milestones", "Help or decisions needed"],
  },
  {
    id: "due-diligence", label: "Due diligence", kind: "DUE DILIGENCE",
    description: "Organize investigations, source notes, findings, gaps, and follow-up for one parcel.",
    title: "Site due diligence",
    sections: ["Review scope", "Ownership and parcel basics", "Planning and approvals", "Built form and site conditions", "Infrastructure and environment", "Market and financial review", "Evidence register", "Open items and follow-up"],
  },
  {
    id: "funding-proposal", label: "Funding proposal", kind: "FUNDING PROPOSAL",
    description: "Shape a project case for a lender, grant, or funding partner; adapt the sections to fit.",
    title: "Project funding proposal",
    sections: ["Project summary", "Need and opportunity", "Site and development plan", "Outcomes and public benefit", "Budget and funding request", "Delivery plan and milestones", "Risks and mitigation", "Evidence and supporting materials"],
  },
];
const templateFor = (id) => TEMPLATES.find((template) => template.id === id) ?? TEMPLATES[0];
const savedParcelLabel = (item) => {
  const candidates = [item.address, item.title].filter((value) => typeof value === "string");
  const address = candidates.find((value) => value.trim() && !/^(saved hamilton parcel|parcel)$/i.test(value.trim()));
  return address?.trim() || item.key;
};
const OPTIONAL_SECTIONS = [
  "Market and demand", "Design and massing", "Infrastructure and servicing",
  "Approvals and permits", "Financial model", "Stakeholders and engagement",
  "Implementation and phasing", "Alternatives considered",
];
const uid = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

function button(label, action, className = "hm-docs-button") {
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
    const quote = /^\s*>\s?(.*)$/.exec(line);
    if (heading) { list = null; parent.append(el(`h${heading[1].length}`, heading[2])); }
    else if (bullet) {
      if (!list) { list = el("ul"); parent.append(list); }
      list.append(el("li", bullet[1]));
    } else if (quote) { list = null; parent.append(el("blockquote", quote[1])); }
    else if (line.trim()) { list = null; parent.append(el("p", line)); }
    else list = null;
  }
  if (!parent.childElementCount) parent.append(el("p", "Nothing in this section yet.", "hm-docs-empty-copy"));
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Recently updated" : `Updated ${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
}

export async function mountDocsService(root) {
  if (!root) return;
  if (root.dataset.docsService !== "docs") return mountGlobalService(root, root.dataset.docsService);
  const library = root.querySelector("[data-docs-library]");
  const list = root.querySelector("[data-docs-list]");
  const search = root.querySelector("[data-docs-search]");
  const typeFilters = root.querySelector("[data-docs-type-filters]");
  const browser = root.querySelector("[data-docs-browser]");
  const headerNew = document.querySelector("[data-docs-create]");
  const headerActions = document.querySelector("[data-docs-header-editor]");
  const projectFilter = root.querySelector("[data-docs-project-filter]");
  const templateSelect = root.querySelector("[data-docs-template]");
  const templateDescription = root.querySelector("[data-docs-template-description]");
  const count = root.querySelector("[data-docs-count]");
  const status = root.querySelector("[data-docs-status]");
  const detail = root.querySelector("[data-docs-detail]");
  const overview = el("div", undefined, "hm-docs-home-overview");
  const overviewCopy = el("div", undefined, "hm-docs-home-copy");
  overviewCopy.append(el("p", "PROJECT WORKSPACE", "hm-notes-eyebrow"), el("h1", "Documents"),
    el("p", "Shape a site vision, collect its evidence, and keep decisions connected to the place."));
  const overviewStats = el("div", undefined, "hm-docs-home-stats");
  const homeMetric = (label) => { const node = el("div", undefined, "hm-docs-home-metric"); node.append(el("strong", "0"), el("span", label)); return node; };
  const documentMetric = homeMetric("DOCUMENTS");
  const projectMetric = homeMetric("SITE PROJECTS");
  const recentMetric = homeMetric("UPDATED THIS WEEK");
  overviewStats.append(documentMetric, projectMetric, recentMetric);
  overview.append(overviewCopy, overviewStats);
  browser.prepend(overview);
  let docs = [];
  let parcelLabels = new Map();
  let parcelEntries = [];
  let selectedDocId = null;
  let activeDoc = null;
  let selectedSectionId = null;
  let editing = false;
  let saveTimer;
  let selectedType = "all";

  const all = async () => {
    const [documentRecords, saved] = await Promise.all([recordsFor("documents"), recordsFor("saved")]);
    parcelEntries = saved.filter((item) => item.kind === "parcel" && item.key);
    parcelLabels = new Map(parcelEntries.map((item) => [item.key, savedParcelLabel(item)]));
    docs = documentRecords.map(normalizeDocument).sort((a, b) => String(b.updatedAt ?? "").localeCompare(String(a.updatedAt ?? "")));
    const keys = [...new Set([...parcelEntries.map((item) => item.key), ...docs.flatMap((doc) => doc.parcelKeys)])];
    await Promise.all(keys.filter((key) => parcelLabels.get(key) === key || /^(saved hamilton parcel|parcel)$/i.test(parcelLabels.get(key) ?? ""))
      .map(async (key) => {
        try {
          const pin = dossierLoader.release ? { ok: true, manifest: null } : await (dossierPin ??= dossierLoader.pin());
          if (!pin.ok) return;
          const [core, detail, labels] = await Promise.all([
            dossierLoader.core(key), dossierLoader.detail(key),
            labelsPromise ??= loadLabels({ base: "/labels/", locales: ["en"] }),
          ]);
          if (core.ok) parcelLabels.set(key, summariseRecord(core.record, detail.ok ? detail.record : null, labels, { sources: pin.manifest?.sources }).title);
        } catch { /* The saved parcel key remains a usable label if its release is unavailable. */ }
      }));
    const projects = [...new Set(docs.flatMap((doc) => doc.parcelKeys))];
    documentMetric.querySelector("strong").textContent = String(docs.length);
    projectMetric.querySelector("strong").textContent = String(projects.length);
    recentMetric.querySelector("strong").textContent = String(docs.filter((doc) => Date.now() - new Date(doc.updatedAt ?? doc.createdAt ?? 0).getTime() < 7 * 86400000).length);
    projectFilter.replaceChildren(new Option("All site projects", "all"));
    for (const key of projects) projectFilter.append(new Option(parcelLabels.get(key) || key, key));
    renderTypeFilters();
    renderList();
    if (selectedDocId) {
      const selected = docs.find((doc) => doc.id === selectedDocId);
      if (selected) open(selected, editing);
      else showEmpty();
    } else showEmpty();
  };

  function normalizeDocument(doc) {
    const parcelKeys = [...new Set((Array.isArray(doc.parcelKeys) && doc.parcelKeys.length ? doc.parcelKeys : [doc.parcelKey]).filter(Boolean))];
    return { ...doc, parcelKeys, parcelKey: doc.parcelKey || parcelKeys[0] || "" };
  }

  function parcelSummary(doc) {
    return doc.parcelKeys.map((key) => parcelLabels.get(key) || key).join(" · ") || "No site project selected";
  }

  function renderList() {
    const query = search.value.trim().toLowerCase();
    const project = projectFilter.value;
    const filtered = docs.filter((doc) => {
      const matches = `${doc.title} ${doc.template} ${doc.parcelKeys.join(" ")} ${parcelSummary(doc)} ${doc.sections.map((s) => s.title).join(" ")}`.toLowerCase().includes(query);
      return matches && (selectedType === "all" || doc.template === selectedType) && (project === "all" || doc.parcelKeys.includes(project));
    });
    count.textContent = `${filtered.length} ${filtered.length === 1 ? "document" : "documents"}`;
    list.replaceChildren();
    if (!filtered.length) {
      const empty = el("section", undefined, "hm-docs-empty-state hm-docs-home-empty");
      const hasDocuments = docs.length > 0;
      empty.append(el("span", "▤", "hm-docs-empty-mark"),
        el("p", hasDocuments ? "NO MATCHES" : "A CLEAR PLACE TO THINK", "hm-docs-kicker"),
        el("h2", hasDocuments ? "No documents in this view." : "Give the project a place to take shape."),
        el("p", hasDocuments ? "Adjust the search or project filters to find the document you need." : "Start with a site plan, brief, due diligence review, or project update. Each document stays linked to its parcel and can gather notes on the data that shapes the decision."));
      if (hasDocuments) {
        const clear = button("Clear filters", () => { search.value = ""; projectFilter.value = "all"; selectedType = "all"; renderTypeFilters(); renderList(); }, "hm-docs-quiet-button");
        empty.append(clear);
      } else if (parcelEntries.length) {
        const create = button("＋ Create a site document", () => headerNew.click(), "hm-docs-primary");
        empty.append(create, el("p", "Choose one parcel to start; add related properties as the project grows.", "hm-docs-empty-foot"));
      } else {
        const map = el("a", "Save a parcel on the map", "hm-docs-primary"); map.href = "/map/"; empty.append(map);
        empty.append(el("p", "Once a parcel is saved, create its first document here.", "hm-docs-empty-foot"));
      }
      list.append(empty);
      return;
    }
    for (const doc of filtered) {
      const card = el("article", undefined, `hm-docs-card${selectedDocId === doc.id ? " is-current" : ""}`);
      const open = button("", () => openDocument(doc, false), "hm-docs-card-open");
      open.append(el("span", templateFor(doc.template).kind, "hm-docs-kicker"));
      open.append(el("strong", doc.title || "Untitled document"));
      open.append(el("span", parcelSummary(doc), "hm-docs-card-project"));
      open.append(el("small", `${doc.sections?.length ?? 0} sections · ${formatDate(doc.updatedAt)}`));
      const actions = el("div", undefined, "hm-docs-card-actions");
      actions.append(button("Edit", () => openDocument(doc, true), "hm-docs-quiet-button"));
      actions.append(button("Delete", async () => {
        if (!confirm(`Delete “${doc.title}”? This cannot be undone.`)) return;
        await removeLocalRecord("documents", doc.id);
        if (selectedDocId === doc.id) { selectedDocId = null; activeDoc = null; showEmpty(); }
        await all();
      }, "hm-docs-quiet-button"));
      card.append(open, actions);
      list.append(card);
    }
  }

  function renderTypeFilters() {
    typeFilters.replaceChildren();
    const kinds = [{ id: "all", label: "All documents" }, ...TEMPLATES.map(({ id, label }) => ({ id, label }))];
    for (const kind of kinds) {
      const amount = kind.id === "all" ? docs.length : docs.filter((doc) => doc.template === kind.id).length;
      const filter = button("", () => { selectedType = kind.id; renderTypeFilters(); renderList(); }, `hm-docs-type-filter${selectedType === kind.id ? " is-active" : ""}`);
      filter.setAttribute("aria-pressed", String(selectedType === kind.id));
      filter.append(el("span", kind.label), el("small", String(amount)));
      typeFilters.append(filter);
    }
  }

  function showEmpty() {
    activeDoc = null;
    selectedDocId = null;
    detail.replaceChildren();
    detail.hidden = true;
    browser.hidden = false;
    library.classList.remove("is-writing");
    headerNew.hidden = false;
    headerActions.hidden = true;
    headerActions.replaceChildren();
    renderList();
  }

  async function openDocument(doc, edit) {
    activeDoc = structuredClone(doc);
    selectedDocId = doc.id;
    selectedSectionId = activeDoc.sections?.[0]?.id ?? null;
    editing = edit;
    renderDocument();
    renderList();
  }

  function saveSoon() {
    status.textContent = "Saving…";
    clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      if (!activeDoc) return;
      activeDoc.updatedAt = new Date().toISOString();
      try {
        await putLocalRecord("documents", activeDoc);
        status.textContent = "Saved on this device";
        docs = docs.map((doc) => doc.id === activeDoc.id ? structuredClone(activeDoc) : doc)
          .sort((a, b) => String(b.updatedAt ?? "").localeCompare(String(a.updatedAt ?? "")));
        renderList();
      } catch (error) {
        status.textContent = `Could not save: ${error.message}`;
      }
    }, 450);
  }

  function renderDocument() {
    if (!activeDoc) return showEmpty();
    library.classList.add("is-writing");
    browser.hidden = true;
    detail.hidden = false;
    detail.replaceChildren();
    headerNew.hidden = true;
    headerActions.hidden = false;
    headerActions.replaceChildren();
    const state = el("span", editing ? "EDITING" : "READING", "hm-docs-mode");
    const back = button("←", showEmpty, "hm-docs-back");
    back.setAttribute("aria-label", "Back to document library");
    back.title = "Back to document library";
    headerActions.append(back, state, el("span", "Saved on this device", "hm-docs-save-status"));
    if (editing) headerActions.append(button("Done", async () => { await persist(); editing = false; renderDocument(); }, "hm-docs-primary"));
    else headerActions.append(button("Edit document", () => { editing = true; renderDocument(); }, "hm-docs-primary"));

    const workspace = el("div", undefined, "hm-docs-editor-workspace");
    const outline = el("aside", undefined, "hm-docs-outline");
    const outlineHead = el("div", undefined, "hm-docs-outline-head");
    const propertyBlock = el("div", undefined, "hm-docs-property-block");
    propertyBlock.append(el("span", activeDoc.parcelKeys.length > 1 ? "LINKED PROPERTIES" : "FOCUSED PARCEL", "hm-docs-kicker"));
    const propertyList = el("div", undefined, "hm-docs-property-list");
    for (const key of activeDoc.parcelKeys) {
      const property = el("div", undefined, "hm-docs-property-item");
      const address = el("span", parcelLabels.get(key) || key, "hm-docs-active-address");
      address.title = key;
      property.append(address);
      if (editing && activeDoc.parcelKeys.length > 1) {
        const remove = button("×", () => {
        activeDoc.parcelKeys = activeDoc.parcelKeys.filter((item) => item !== key);
        activeDoc.parcelKey = activeDoc.parcelKeys[0];
        saveSoon(); renderDocument();
        }, "hm-docs-property-remove");
        remove.setAttribute("aria-label", `Unlink ${parcelLabels.get(key) || key}`);
        remove.title = "Unlink this parcel";
        property.append(remove);
      }
      propertyList.append(property);
    }
    propertyBlock.append(propertyList);
    propertyBlock.append(el("p", "Document content is shared across these properties.", "hm-docs-property-scope"));
    if (editing) {
      const addParcel = document.createElement("select");
      addParcel.setAttribute("aria-label", "Link another parcel to this document");
      addParcel.append(new Option("＋ Link another parcel…", ""));
      for (const item of parcelEntries.filter((entry) => !activeDoc.parcelKeys.includes(entry.key))) addParcel.append(new Option(savedParcelLabel(item), item.key));
      addParcel.addEventListener("change", () => {
        if (!addParcel.value) return;
        activeDoc.parcelKeys = [...activeDoc.parcelKeys, addParcel.value];
        saveSoon(); renderDocument();
      });
      propertyBlock.append(addParcel);
    }
    outlineHead.append(propertyBlock);
    const title = document.createElement("input");
    title.className = "hm-docs-outline-title";
    title.value = activeDoc.title || "Untitled document";
    title.maxLength = 180;
    title.disabled = !editing;
    title.setAttribute("aria-label", "Document title");
    title.addEventListener("input", () => { activeDoc.title = title.value; saveSoon(); });
    outlineHead.append(title);
    if (editing) {
      const addOptional = document.createElement("select");
      addOptional.setAttribute("aria-label", "Add an optional section");
      addOptional.append(new Option("＋ Add section", ""));
      for (const name of OPTIONAL_SECTIONS.filter((name) => !activeDoc.sections.some((section) => section.title === name))) addOptional.append(new Option(name, name));
      addOptional.addEventListener("change", () => {
        if (!addOptional.value) return;
        const section = { id: uid(), title: addOptional.value, parentId: null, markdown: "" };
        activeDoc.sections.push(section); selectedSectionId = section.id; saveSoon(); renderDocument();
      });
      outlineHead.append(addOptional);
    }
    outline.append(outlineHead);
    for (const section of activeDoc.sections ?? []) {
      const row = el("div", undefined, `hm-docs-outline-row${section.parentId ? " is-child" : ""}`);
      const pick = button(section.title, () => { selectedSectionId = section.id; renderDocument(); }, `hm-docs-outline-link${selectedSectionId === section.id ? " is-selected" : ""}`);
      row.append(pick);
      if (editing) {
        row.append(button("+", () => {
          const child = { id: uid(), title: "New subsection", parentId: section.id, markdown: "" };
          activeDoc.sections.splice(activeDoc.sections.indexOf(section) + 1, 0, child); selectedSectionId = child.id; saveSoon(); renderDocument();
        }, "hm-docs-icon-button"));
        row.append(button("−", () => {
          if (!confirm(`Delete “${section.title}” and any subsections?`)) return;
          const doomed = new Set([section.id]);
          let changed = true;
          while (changed) { changed = false; for (const item of activeDoc.sections) if (item.parentId && doomed.has(item.parentId) && !doomed.has(item.id)) { doomed.add(item.id); changed = true; } }
          activeDoc.sections = activeDoc.sections.filter((item) => !doomed.has(item.id));
          selectedSectionId = activeDoc.sections[0]?.id ?? null; saveSoon(); renderDocument();
        }, "hm-docs-icon-button"));
      }
      outline.append(row);
    }
    const body = el("section", undefined, "hm-docs-writing-pane");
    const section = activeDoc.sections.find((item) => item.id === selectedSectionId);
    if (section) {
      const sectionTitle = document.createElement("input");
      sectionTitle.value = section.title; sectionTitle.disabled = !editing; sectionTitle.maxLength = 180;
      sectionTitle.setAttribute("aria-label", "Section title");
      sectionTitle.addEventListener("change", () => { section.title = sectionTitle.value.trim() || section.title; saveSoon(); renderDocument(); });
      body.append(sectionTitle);
      body.append(el("p", `${templateFor(activeDoc.template).kind} · SITE PROJECT`, "hm-docs-kicker"));
      if (editing) {
        const editor = document.createElement("textarea");
        editor.value = section.markdown ?? "";
        editor.placeholder = "Capture the thinking, evidence, and open questions for this section…\n\nUse Markdown for headings and lists.";
        editor.setAttribute("aria-label", `${section.title} content in Markdown`);
        editor.addEventListener("input", () => { section.markdown = editor.value; saveSoon(); });
        body.append(editor);
        const refs = awaitFieldNotes(activeDoc.parcelKeys);
        void refs.then((items) => {
          if (!editing || !items.length || !body.isConnected) return;
          const ref = document.createElement("select"); ref.setAttribute("aria-label", "Insert a saved parcel data note");
          ref.append(new Option("Insert a parcel data note…", ""));
          for (const item of items) ref.append(new Option(`${parcelLabels.get(item.parcelKey) || item.parcelKey} · ${item.layer} · ${item.row} · ${item.field}`, item.id));
          ref.addEventListener("change", () => {
            const item = items.find((note) => note.id === ref.value); if (!item) return;
            section.markdown = `${section.markdown}${section.markdown ? "\n\n" : ""}> **${parcelLabels.get(item.parcelKey) || item.parcelKey} · ${item.layer} · ${item.row} · ${item.field}**\n> ${item.text.replace(/\n/g, "\n> ")}`;
            renderDocument(); saveSoon();
          });
          const tools = body.querySelector(".hm-docs-reference-tools") ?? el("div", undefined, "hm-docs-reference-tools");
          tools.replaceChildren(ref, el("span", "Field comments stay attached to their parcel and data field."));
          if (!tools.isConnected) body.append(tools);
        });
        body.append(makeDocumentFieldNotesPanel(body));
      } else {
        const reader = el("article", undefined, "hm-docs-markdown");
        markdown(reader, section.markdown);
        body.append(reader);
      }
    } else body.append(el("p", "Add a section to begin.", "hm-docs-empty-copy"));
    workspace.append(outline, body);
    detail.append(workspace);
  }

  async function awaitFieldNotes(parcelKeys) {
    if (!parcelKeys?.length) return [];
    return (await recordsFor("field-notes")).filter((note) => parcelKeys.includes(note.parcelKey)).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  }

  function makeDocumentFieldNotesPanel(body) {
    const panel = el("details", undefined, "hm-docs-field-browser");
    panel.append(el("summary", "Comment on parcel data"));
    panel.append(el("p", "Choose a linked parcel, then browse its layers, rows, and fields. The comment will be saved to both this document and that parcel.", "hm-docs-field-intro"));
    const parcelSelect = document.createElement("select"); parcelSelect.setAttribute("aria-label", "Parcel for this field comment");
    for (const key of activeDoc.parcelKeys) parcelSelect.append(new Option(parcelLabels.get(key) || key, key));
    const layerSelect = document.createElement("select"); layerSelect.setAttribute("aria-label", "Data layer");
    const rowSearch = document.createElement("input"); rowSearch.type = "search"; rowSearch.placeholder = "Filter rows"; rowSearch.setAttribute("aria-label", "Filter data rows");
    const rowSelect = document.createElement("select"); rowSelect.setAttribute("aria-label", "Data row");
    const fieldSelect = document.createElement("select"); fieldSelect.setAttribute("aria-label", "Data field");
    const value = el("p", "Select a field to see its source value.", "hm-docs-field-value");
    const note = document.createElement("textarea"); note.rows = 3; note.maxLength = 5000; note.placeholder = "Comment on this field…"; note.setAttribute("aria-label", "Comment on this data field");
    const feedback = el("p", "", "hm-docs-field-feedback");
    const save = button("Save field comment", async () => {
      const catalog = panel.catalog ?? [];
      const row = catalog.find((item) => item.id === rowSelect.value);
      const field = row?.fields[Number(fieldSelect.value)];
      const text = note.value.trim();
      if (!field || !text) { feedback.textContent = "Choose a field and write a comment first."; return; }
      const parcelKey = parcelSelect.value;
      const annotation = { id: uid(), parcelKey, documentId: activeDoc.id, anchorType: "parcel-field", layer: row.layer, row: row.label, field: field.path, value: field.value, text, createdAt: new Date().toISOString() };
      await putLocalRecord("field-notes", annotation);
      const section = activeDoc.sections.find((item) => item.id === selectedSectionId);
      if (section) {
        section.markdown = `${section.markdown}${section.markdown ? "\n\n" : ""}> **${parcelLabels.get(parcelKey) || parcelKey} · ${row.layer} · ${row.label} · ${field.path}**\n> ${text.replace(/\n/g, "\n> ")}`;
        const editor = body.querySelector("textarea[aria-label$='content in Markdown']");
        if (editor) editor.value = section.markdown;
      }
      note.value = ""; feedback.textContent = "Field comment saved."; saveSoon();
    }, "hm-docs-primary");
    panel.append(parcelSelect, layerSelect, rowSearch, rowSelect, fieldSelect, value, note, save, feedback);
    let catalog = [];
    panel.catalog = catalog;
    function updateRows() {
      const query = rowSearch.value.trim().toLowerCase();
      const matches = catalog.filter((item) => item.layer === layerSelect.value && `${item.label} ${item.id}`.toLowerCase().includes(query));
      rowSelect.replaceChildren(...matches.map((item) => new Option(item.label, item.id)));
      updateFields();
    }
    function updateFields() {
      const row = catalog.find((item) => item.id === rowSelect.value);
      fieldSelect.replaceChildren(...(row?.fields ?? []).map((item, index) => new Option(`${item.label}: ${item.value}`, String(index))));
      const field = row?.fields[Number(fieldSelect.value)];
      value.textContent = field ? `${field.path} · ${field.value}` : "No fields in this row.";
    }
    async function loadParcel() {
      layerSelect.replaceChildren(new Option("Loading parcel data…", "")); rowSelect.replaceChildren(); fieldSelect.replaceChildren();
      let pin = dossierLoader.release ? { ok: true } : await (dossierPin ??= dossierLoader.pin());
      if (!pin.ok) { feedback.textContent = "The parcel data release is unavailable right now."; catalog = []; return; }
      const key = parcelSelect.value;
      const [core, detail] = await Promise.all([dossierLoader.core(key), dossierLoader.detail(key)]);
      if (!core.ok) { feedback.textContent = "This parcel is not in the current data release."; catalog = []; layerSelect.replaceChildren(new Option("No layers available", "")); return; }
      catalog = dataCatalog({ core: core.record, detail: detail.ok ? detail.record : null });
      panel.catalog = catalog;
      const layers = [...new Set(catalog.map((item) => item.layer))];
      layerSelect.replaceChildren(...layers.map((layer) => new Option(layer, layer)));
      if (!layers.length) feedback.textContent = "This parcel release has no field inventory available yet.";
      else { feedback.textContent = ""; layerSelect.value = layers[0]; updateRows(); }
    }
    layerSelect.addEventListener("change", updateRows); rowSearch.addEventListener("input", updateRows); rowSelect.addEventListener("change", updateFields); fieldSelect.addEventListener("change", updateFields); parcelSelect.addEventListener("change", () => void loadParcel());
    panel.addEventListener("toggle", () => { if (panel.open) void loadParcel(); }, { once: true });
    return panel;
  }

  async function persist() {
    if (!activeDoc) return;
    activeDoc.updatedAt = new Date().toISOString();
    await putLocalRecord("documents", activeDoc);
    status.textContent = "Saved on this device";
    docs = docs.map((doc) => doc.id === activeDoc.id ? structuredClone(activeDoc) : doc)
      .sort((a, b) => String(b.updatedAt ?? "").localeCompare(String(a.updatedAt ?? "")));
    renderList();
  }

  function savedCategory(item) {
    const kind = item.kind ?? item.type ?? "parcel";
    if (kind === "parcel") return "Parcel";
    if (["news", "story", "article", "editorial"].includes(kind)) return "News";
    if (["development", "development-record", "development_record", "development-records"].includes(kind)) return "Development";
    return "Other";
  }

  function openCreateDialog() {
    const dialog = root.querySelector("[data-docs-create-dialog]");
    const projects = root.querySelector("[data-docs-project]");
    const parcelId = root.querySelector("[data-docs-parcel-id]");
    const title = root.querySelector("[data-docs-new-title]");
    templateSelect.replaceChildren(...TEMPLATES.map((template) => new Option(template.label, template.id)));
    templateSelect.value = "default-general";
    templateDescription.textContent = templateFor(templateSelect.value).description;
    parcelId.textContent = "";
    parcelId.hidden = true;
    const feedback = root.querySelector("[data-docs-create-feedback]");
    const submit = root.querySelector("[data-docs-confirm-create]");
    void recordsFor("saved").then((saved) => {
      const parcelEntries = saved.filter((item) => item.kind === "parcel" && item.key);
      const known = new Map(parcelEntries.map((item) => [item.key, savedParcelLabel(item)]));
      for (const doc of docs) for (const key of doc.parcelKeys) if (key && !known.has(key)) known.set(key, parcelLabels.get(key) || key);
      projects.replaceChildren(new Option("Choose a saved parcel…", ""));
      for (const [key, label] of known) projects.append(new Option(label, key));
      feedback.textContent = known.size ? "Start with a focused parcel; link more properties from the document sidebar." : "Save a parcel from the map first, then create its site plan here.";
      submit.disabled = known.size === 0;
    });
    title.value = templateFor(templateSelect.value).title;
    dialog.showModal();
    projects.focus({ preventScroll: true });
  }

  document.querySelectorAll("[data-docs-create]").forEach((control) => control.addEventListener("click", openCreateDialog));
  root.querySelector("[data-docs-project]").addEventListener("change", (event) => {
    const parcelId = root.querySelector("[data-docs-parcel-id]");
    parcelId.textContent = event.currentTarget.value ? `Parcel ID · ${event.currentTarget.value}` : "";
    parcelId.hidden = !event.currentTarget.value;
  });
  templateSelect.addEventListener("change", () => {
    const template = templateFor(templateSelect.value);
    templateDescription.textContent = template.description;
    root.querySelector("[data-docs-new-title]").value = template.title;
  });
  root.querySelectorAll("[data-docs-create-close]").forEach((control) => control.addEventListener("click", () => root.querySelector("[data-docs-create-dialog]").close()));
  root.querySelector("[data-docs-confirm-create]").addEventListener("click", async (event) => {
    event.preventDefault();
    const parcelKey = root.querySelector("[data-docs-project]").value;
    if (!parcelKey) return;
    const now = new Date().toISOString();
    const template = templateFor(templateSelect.value);
    const doc = { id: uid(), parcelKey, parcelKeys: [parcelKey], title: root.querySelector("[data-docs-new-title]").value.trim() || template.title, template: template.id, sections: template.sections.map((title) => ({ id: uid(), title, parentId: null, markdown: "" })), createdAt: now, updatedAt: now };
    await putLocalRecord("documents", doc);
    root.querySelector("[data-docs-create-dialog]").close();
    await all();
    await openDocument(doc, true);
  });
  search.addEventListener("input", renderList);
  projectFilter.addEventListener("change", renderList);
  await all().catch((error) => { status.textContent = `Docs could not open: ${error.message}`; });
}

async function mountGlobalService(root, service) {
  const rail = root.querySelector("[data-service-rail]");
  const content = root.querySelector("[data-service-content]");
  const status = root.querySelector("[data-service-status]");
  if (!rail || !content) return;
  if (service === "notes") return mountNotesLibrary({ rail, content, status });
  if (service === "development") return mountDevelopmentLibrary({ rail, content, status });
  return mountSavedLibrary({ rail, content, status, developmentOnly: service === "development" });
}

async function mountDevelopmentLibrary({ rail, content, status }) {
  rail.replaceChildren();
  const loading = el("p", "Loading the verified Hamilton permit collection…", "hm-development-page-status");
  content.replaceChildren(loading);
  if (status) status.textContent = "Loading the published Hamilton permit records.";

  const packageResult = await developmentLoader.pin();
  if (!packageResult.ok) {
    loading.textContent = "The published Hamilton permit collection is unavailable. Please try again later.";
    if (status) status.textContent = "Hamilton permit records could not be loaded.";
    return;
  }
  const recordsResult = await developmentLoader.allRecords();
  if (!recordsResult.ok) {
    loading.textContent = "The published Hamilton permit records failed verification and could not be displayed.";
    if (status) status.textContent = "Hamilton permit records failed verification.";
    return;
  }

  const browser = developmentRecordsBrowserElement(recordsResult.records, { sidebarTarget: rail });
  browser.classList.add("hm-development-browser-page");
  content.replaceChildren(browser);
  if (status) status.textContent = `${recordsResult.records.length.toLocaleString("en-CA")} published Hamilton permit records are ready.`;
}

async function mountSavedLibrary({ rail, content, status, developmentOnly }) {
  let items = await recordsFor("saved");
  let selected = developmentOnly ? "Development" : "All";
  let query = "";
  let savedScope = "all";
  let developmentScope = "all";
  const developmentFacets = { stage: "all", place: "all", sector: "all" };
  const collectionsKey = "heavymap.saved-collections.v1";
  const readCollections = () => {
    try {
      const value = JSON.parse(localStorage.getItem(collectionsKey) ?? "[]");
      return Array.isArray(value) ? value.filter((item) => item && typeof item.id === "string" && typeof item.name === "string") : [];
    } catch { return []; }
  };
  let collections = readCollections();
  const writeCollections = () => {
    try { localStorage.setItem(collectionsKey, JSON.stringify(collections)); }
    catch { if (status) status.textContent = "Collections could not be saved on this device."; }
  };
  const categories = developmentOnly ? ["Development"] : ["All", "Parcel", "News", "Development", "Other"];
  const title = developmentOnly ? "Development records" : "Saved items";
  const parcelLabels = new Map(items.filter((item) => item.kind === "parcel" && item.key).map((item) => [item.key, savedParcelLabel(item)]));
  await Promise.all([...parcelLabels].filter(([key, label]) => key === label || /^(saved hamilton parcel|parcel)$/i.test(label))
    .map(async ([key]) => {
      try {
        const pin = dossierLoader.release ? { ok: true, manifest: null } : await (dossierPin ??= dossierLoader.pin());
        if (!pin.ok) return;
        const [core, detail, labels] = await Promise.all([
          dossierLoader.core(key), dossierLoader.detail(key),
          labelsPromise ??= loadLabels({ base: "/labels/", locales: ["en"] }),
        ]);
        if (core.ok) parcelLabels.set(key, summariseRecord(core.record, detail.ok ? detail.record : null, labels, { sources: pin.manifest?.sources }).title);
      } catch { /* Keep the parcel key as a readable fallback if local details are unavailable. */ }
    }));
  const search = document.createElement("input");
  search.type = "search";
  search.placeholder = developmentOnly ? "Search development records" : "Search saved items";
  search.setAttribute("aria-label", search.placeholder);
  const searchLabel = el("label", undefined, "hm-docs-search");
  searchLabel.append(el("span", "⌕"), search);
  const categoryNav = el("nav", undefined, "hm-docs-type-filters");
  categoryNav.setAttribute("aria-label", "Saved item categories");
  const railSummary = el("div", undefined, "hm-saved-rail-summary");
  railSummary.append(el("strong", "0"), el("span", developmentOnly ? "records tracked" : "saved to your library"));
  const railViews = el("nav", undefined, developmentOnly ? "hm-dev-views" : "hm-saved-views");
  railViews.setAttribute("aria-label", developmentOnly ? "Development record views" : "Saved library views");
  const railDetail = el("div", undefined, developmentOnly ? "hm-dev-facets" : "hm-saved-collections");
  const collectionForm = document.createElement("form");
  collectionForm.className = "hm-saved-collection-form";
  collectionForm.hidden = true;
  const collectionName = document.createElement("input");
  collectionName.type = "text";
  collectionName.maxLength = 48;
  collectionName.placeholder = "Collection name";
  collectionName.setAttribute("aria-label", "New collection name");
  const collectionCreate = button("Create", () => {}, "hm-docs-primary");
  collectionCreate.type = "submit";
  collectionForm.append(collectionName, collectionCreate);
  collectionForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = collectionName.value.trim();
    if (!name) { collectionName.focus(); return; }
    const existing = collections.find((item) => item.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      savedScope = existing.id;
      if (status) status.textContent = "That collection already exists.";
    } else {
      const collection = { id: uid(), name, createdAt: new Date().toISOString() };
      collections = [...collections, collection];
      writeCollections();
      savedScope = collection.id;
      if (status) status.textContent = `“${name}” collection created on this device.`;
    }
    collectionName.value = "";
    collectionForm.hidden = true;
    render();
  });
  const addCollection = button("＋ New collection", () => {
    collectionForm.hidden = !collectionForm.hidden;
    if (!collectionForm.hidden) collectionName.focus();
  }, "hm-saved-create-collection");
  const railKicker = el("p", developmentOnly ? "DEVELOPMENT PORTFOLIO" : "SAVED LIBRARY", "hm-docs-kicker");
  rail.replaceChildren(railKicker, railSummary, railViews, railDetail);
  if (!developmentOnly) rail.append(addCollection, collectionForm,
    el("p", "Collections are private to this browser and never remove a saved item.", "hm-saved-rail-note"));

  const list = el("div", undefined, "hm-global-record-list");
  const heading = el("div", undefined, "hm-global-page-heading");
  const headingCopy = el("div", undefined, "hm-saved-heading-copy");
  headingCopy.append(el("p", developmentOnly ? "PROJECT INTELLIGENCE" : "YOUR HEAVYMAP LIBRARY", "hm-notes-eyebrow"), el("h1", developmentOnly ? "Development records" : "Saved items"),
    el("p", developmentOnly ? "Keep the applications and records that matter close to their sites." : "A personal shelf for parcels, reporting, and development activity."));
  heading.append(headingCopy);
  const overview = el("div", undefined, "hm-saved-overview");
  const countMetric = (label) => { const node = el("div", undefined, "hm-notes-metric"); node.append(el("strong", "0"), el("span", label)); return node; };
  const totalMetric = countMetric(developmentOnly ? "DEVELOPMENT RECORDS" : "SAVED ITEMS");
  const siteMetric = countMetric("SITE PARCELS");
  const newsMetric = countMetric(developmentOnly ? "WITH A SOURCE" : "NEWS & RECORDS");
  overview.append(totalMetric, siteMetric, newsMetric);
  const toolbar = el("div", undefined, "hm-saved-toolbar");
  if (developmentOnly) categoryNav.hidden = true;
  toolbar.append(categoryNav, searchLabel);
  content.replaceChildren(heading, overview, toolbar, list);

  const category = (item) => {
    const kind = item.kind ?? item.type ?? "parcel";
    if (kind === "parcel") return "Parcel";
    if (["news", "story", "article", "editorial"].includes(kind)) return "News";
    if (["development", "development-record", "development_record", "development-records"].includes(kind)) return "Development";
    return "Other";
  };
  const dateFor = (item) => {
    const date = new Date(item.savedAt ?? item.updatedAt ?? item.createdAt ?? 0);
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
  };
  const recentCutoff = () => Date.now() - 30 * 86400000;
  const fieldValue = (item, keys) => {
    const containers = [item, item?.metadata, item?.project, item?.details].filter(Boolean);
    for (const source of containers) for (const key of keys) {
      const value = source[key];
      if ((typeof value === "string" || typeof value === "number") && String(value).trim()) return String(value).trim();
      if (value && typeof value === "object") {
        const nested = value.name ?? value.label ?? value.value;
        if ((typeof nested === "string" || typeof nested === "number") && String(nested).trim()) return String(nested).trim();
      }
    }
    return "";
  };
  const siteKeyFor = (item) => item.parcelKey ?? item.siteParcelKey ?? item.siteKey ?? item.parcel?.key ?? "";
  const placeFor = (item) => fieldValue(item, ["municipality", "city", "town", "community", "region", "location", "place"])
    || (siteKeyFor(item) ? parcelLabels.get(siteKeyFor(item)) || "" : "");
  const developmentRecords = () => items.filter((item) => category(item) === "Development");
  const developmentFacetValues = (kind) => {
    const keys = kind === "stage"
      ? ["stage", "status", "lifecycleStage", "projectStage", "approvalStatus", "planningStatus"]
      : kind === "place"
        ? ["municipality", "city", "town", "community", "region", "location", "place"]
        : ["sector", "industry", "industrySector", "projectType", "developmentType", "category"];
    const values = new Map();
    for (const item of developmentRecords()) {
      const value = kind === "place" ? placeFor(item) : fieldValue(item, keys);
      if (value) values.set(value, (values.get(value) ?? 0) + 1);
    }
    return [...values].sort(([a], [b]) => a.localeCompare(b));
  };
  const viewButton = (label, count, active, action, className = "hm-saved-view") => {
    const node = button("", action, `${className}${active ? " is-active" : ""}`);
    node.setAttribute("aria-pressed", String(active));
    node.append(el("span", label), el("small", String(count)));
    return node;
  };
  const renderSidebar = () => {
    railSummary.querySelector("strong").textContent = String(developmentOnly ? developmentRecords().length : items.length);
    railViews.replaceChildren();
    if (developmentOnly) {
      const records = developmentRecords();
      const linked = records.filter((item) => Boolean(siteKeyFor(item))).length;
      const recent = records.filter((item) => dateFor(item) >= recentCutoff()).length;
      railViews.append(
        viewButton("All records", records.length, developmentScope === "all", () => { developmentScope = "all"; render(); }, "hm-dev-view"),
        viewButton("Recently saved", recent, developmentScope === "recent", () => { developmentScope = "recent"; render(); }, "hm-dev-view"),
        viewButton("Linked to a site", linked, developmentScope === "linked", () => { developmentScope = "linked"; render(); }, "hm-dev-view"),
      );
      railDetail.replaceChildren();
      let facetCount = 0;
      for (const [kind, label] of [["stage", "STAGE"], ["place", "PLACE"], ["sector", "SECTOR"]]) {
        const values = developmentFacetValues(kind);
        if (!values.length) continue;
        facetCount++;
        const group = el("section", undefined, "hm-dev-facet");
        group.append(el("p", label, "hm-notes-rail-label"));
        const all = viewButton("All", records.length, developmentFacets[kind] === "all", () => { developmentFacets[kind] = "all"; render(); }, "hm-dev-facet-option");
        group.append(all);
        for (const [value, count] of values.slice(0, 12)) {
          group.append(viewButton(value, count, developmentFacets[kind] === value, () => { developmentFacets[kind] = value; render(); }, "hm-dev-facet-option"));
        }
        if (values.length > 12) group.append(el("p", `Showing 12 of ${values.length}; refine the main search to find more.`, "hm-dev-facet-note"));
        railDetail.append(group);
      }
      if (!facetCount) railDetail.append(el("p", records.length
        ? "Stage, place, and sector filters will appear when saved records include those details."
        : "Your saved development records will appear here. Available stage, place, and sector details will become filters.", "hm-dev-facet-empty"));
      return;
    }

    const recent = items.filter((item) => dateFor(item) >= recentCutoff()).length;
    const uncollected = items.filter((item) => !Array.isArray(item.collectionIds) || item.collectionIds.length === 0).length;
    railViews.append(
      viewButton("All saved", items.length, savedScope === "all", () => { savedScope = "all"; render(); }),
      viewButton("Recently saved", recent, savedScope === "recent", () => { savedScope = "recent"; render(); }),
      viewButton("No collection", uncollected, savedScope === "uncollected", () => { savedScope = "uncollected"; render(); }),
    );
    railDetail.replaceChildren(el("p", "COLLECTIONS", "hm-notes-rail-label"));
    if (!collections.length) railDetail.append(el("p", "Create a collection for a site visit, project, or follow-up thread.", "hm-saved-collection-empty"));
    for (const collection of collections) {
      const count = items.filter((item) => item.collectionIds?.includes(collection.id)).length;
      railDetail.append(viewButton(collection.name, count, savedScope === collection.id, () => { savedScope = collection.id; render(); }));
    }
  };
  const render = () => {
    renderSidebar();
    categoryNav.replaceChildren();
    for (const name of categories) {
      const count = name === "All" ? items.length : items.filter((item) => category(item) === name).length;
      const filter = button("", () => { selected = name; render(); }, `hm-docs-type-filter${selected === name ? " is-active" : ""}`);
      filter.setAttribute("aria-pressed", String(selected === name));
      filter.append(el("span", name === "All" ? "All saved" : name), el("small", String(count)));
      categoryNav.append(filter);
    }
    const parcelCount = new Set(items.filter((item) => category(item) === "Parcel").map((item) => item.key).filter(Boolean)).size;
    const newsAndDevelopment = items.filter((item) => ["News", "Development"].includes(category(item))).length;
    totalMetric.querySelector("strong").textContent = String(developmentOnly ? items.filter((item) => category(item) === "Development").length : items.length);
    siteMetric.querySelector("strong").textContent = String(developmentOnly
      ? new Set(developmentRecords().map(siteKeyFor).filter(Boolean)).size
      : parcelCount);
    newsMetric.querySelector("strong").textContent = String(developmentOnly
      ? developmentRecords().filter((item) => item.source || item.sourceUrl || item.publisher || item.sources?.length).length
      : newsAndDevelopment);
    list.replaceChildren();
    const scopedItems = developmentOnly ? developmentRecords().filter((item) => {
      if (developmentScope === "recent" && dateFor(item) < recentCutoff()) return false;
      if (developmentScope === "linked" && !siteKeyFor(item)) return false;
      for (const [kind, keys] of Object.entries(developmentFacets)) {
        if (keys === "all") continue;
        const value = kind === "place" ? placeFor(item) : fieldValue(item, kind === "stage"
          ? ["stage", "status", "lifecycleStage", "projectStage", "approvalStatus", "planningStatus"]
          : ["sector", "industry", "industrySector", "projectType", "developmentType", "category"]);
        if (value !== keys) return false;
      }
      return true;
    }) : items.filter((item) => savedScope === "all"
      || savedScope === "recent" && dateFor(item) >= recentCutoff()
      || savedScope === "uncollected" && (!Array.isArray(item.collectionIds) || item.collectionIds.length === 0)
      || collections.some((collection) => collection.id === savedScope && item.collectionIds?.includes(collection.id)));
    const shown = scopedItems.filter((item) => (developmentOnly || selected === "All" || category(item) === selected)
      && `${item.title ?? ""} ${item.subtitle ?? ""} ${item.address ?? ""} ${item.key ?? ""} ${item.id ?? ""} ${parcelLabels.get(item.key) ?? ""} ${fieldValue(item, ["stage", "status", "lifecycleStage", "projectStage", "approvalStatus", "planningStatus", "sector", "industry", "industrySector", "projectType", "developmentType", "municipality", "city", "town", "region", "location"])} ${placeFor(item)}`.toLowerCase().includes(query));
    if (!shown.length) {
      const empty = el("section", undefined, "hm-saved-empty");
      const isSearch = query || items.length;
      empty.append(el("span", developmentOnly ? "⌂" : "✳", "hm-notes-empty-mark"),
        el("p", isSearch ? "NO MATCHES" : developmentOnly ? "DEVELOPMENT LIBRARY" : "YOUR SAVED LIBRARY", "hm-notes-eyebrow"),
        el("h2", isSearch ? `No ${title.toLowerCase()} in this view.` : developmentOnly ? "Keep important records close to the site." : "Keep the things you want to come back to."),
        el("p", isSearch ? "Try another search or filter to find what you saved." : developmentOnly ? "Development records you save will be gathered here with their site context." : "Save parcels from the map, reporting from Reader, and development records as you explore. They will be collected here."));
      if (!isSearch) {
        const links = el("div", undefined, "hm-saved-empty-actions");
        const map = el("a", "Explore parcels", "hm-docs-primary"); map.href = "/map/"; links.append(map);
        if (!developmentOnly) { const reader = el("a", "Browse Reader", "hm-docs-quiet-button"); reader.href = "/reader/"; links.append(reader); }
        empty.append(links);
      } else {
        empty.append(button("Clear search and filters", () => { selected = developmentOnly ? "Development" : "All"; query = ""; search.value = ""; render(); }, "hm-docs-quiet-button"));
      }
      list.append(empty);
      return;
    }
    for (const item of shown) {
      const kind = category(item);
      const row = el("article", undefined, "hm-docs-saved-row hm-saved-card");
      const href = kind === "Parcel" && item.key ? `/map/#parcel=${encodeURIComponent(item.key)}` : item.url;
      let open;
      try {
        const safeHref = href ? new URL(href, location.origin) : null;
        if (safeHref && ["http:", "https:"].includes(safeHref.protocol)) { open = el("a", undefined, "hm-docs-saved-open"); open.href = safeHref.href; }
      } catch { /* Invalid saved links remain readable without navigation. */ }
      open ??= el("div", undefined, "hm-docs-saved-open");
      open.classList.add("hm-saved-entry");
      open.append(el("span", kind.toUpperCase(), "hm-docs-saved-kind"), el("strong", item.address || (kind === "Parcel" ? parcelLabels.get(item.key) : "") || item.title || item.key || "Saved item"), el("small", item.subtitle || (kind === "Parcel" ? item.key : item.source || item.publisher || "")));
      const when = item.savedAt ? new Date(item.savedAt) : null;
      if (when && !Number.isNaN(when.getTime())) {
        const time = el("time", when.toLocaleDateString(undefined, { month: "short", day: "numeric" }), "hm-saved-date");
        time.dateTime = when.toISOString();
        row.append(open, time);
      } else row.append(open);
      const tools = el("div", undefined, "hm-saved-card-tools");
      if (!developmentOnly) {
        const organize = document.createElement("details");
        organize.className = "hm-saved-organize";
        const summary = document.createElement("summary");
        summary.textContent = "Organize";
        organize.append(summary);
        const menu = el("div", undefined, "hm-saved-organize-menu");
        if (!collections.length) menu.append(el("p", "Create a collection in the sidebar, then add this item here.", "hm-saved-organize-empty"));
        for (const collection of collections) {
          const label = el("label", undefined, "hm-saved-organize-option");
          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.checked = Array.isArray(item.collectionIds) && item.collectionIds.includes(collection.id);
          label.append(checkbox, el("span", collection.name));
          checkbox.addEventListener("change", async () => {
            const memberships = new Set(Array.isArray(item.collectionIds) ? item.collectionIds : []);
            if (checkbox.checked) memberships.add(collection.id);
            else memberships.delete(collection.id);
            item.collectionIds = [...memberships];
            try {
              await putLocalRecord("saved", item);
              if (status) status.textContent = checkbox.checked
                ? `Added to “${collection.name}” on this device.`
                : `Removed from “${collection.name}” on this device.`;
              render();
            } catch { if (status) status.textContent = "Collection membership could not be saved on this device."; }
          });
          menu.append(label);
        }
        organize.append(menu);
        tools.append(organize);
      }
      const remove = button("Remove", async () => {
        await removeLocalRecord("saved", item.id);
        items = items.filter((entry) => entry.id !== item.id);
        if (status) status.textContent = "Saved item removed on this device";
        render();
      }, "hm-docs-quiet-button");
      tools.append(remove);
      row.append(tools);
      list.append(row);
    }
  };
  search.addEventListener("input", () => { query = search.value.trim().toLowerCase(); render(); });
  render();
}

async function mountNotesLibrary({ rail, content, status }) {
  const [initialNotes, saved, docs] = await Promise.all([recordsFor("field-notes"), recordsFor("saved"), recordsFor("documents")]);
  let notes = initialNotes.sort((a, b) => String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")));
  const parcels = new Map(saved.filter((item) => item.kind === "parcel" && item.key).map((item) => [item.key, savedParcelLabel(item)]));
  for (const doc of docs) {
    const keys = Array.isArray(doc.parcelKeys) && doc.parcelKeys.length ? doc.parcelKeys : [doc.parcelKey];
    for (const key of keys) if (key && !parcels.has(key)) parcels.set(key, key);
  }
  for (const note of notes) if (note.parcelKey && !parcels.has(note.parcelKey)) parcels.set(note.parcelKey, note.parcelKey);
  await Promise.all([...parcels].filter(([key, label]) => label === key || /^(saved hamilton parcel|parcel)$/i.test(label))
    .map(async ([key]) => {
      try {
        const pin = dossierLoader.release ? { ok: true, manifest: null } : await (dossierPin ??= dossierLoader.pin());
        if (!pin.ok) return;
        const [core, detail, labels] = await Promise.all([
          dossierLoader.core(key), dossierLoader.detail(key),
          labelsPromise ??= loadLabels({ base: "/labels/", locales: ["en"] }),
        ]);
        if (core.ok) parcels.set(key, summariseRecord(core.record, detail.ok ? detail.record : null, labels, { sources: pin.manifest?.sources }).title);
      } catch { /* Keep the saved project key visible if local parcel details are unavailable. */ }
    }));
  let query = "";
  let scope = "all";
  let composerOpen = false;
  const search = document.createElement("input");
  search.type = "search";
  search.placeholder = "Search notes";
  search.setAttribute("aria-label", "Search notes");
  const searchLabel = el("label", undefined, "hm-docs-search");
  searchLabel.append(el("span", "⌕"), search);
  const navigation = el("nav", undefined, "hm-notes-navigation");
  navigation.setAttribute("aria-label", "Notes library");
  const projectList = el("div", undefined, "hm-notes-project-list");
  const allButton = button("", () => { scope = "all"; render(); }, "hm-notes-nav-item");
  const recentButton = button("", () => { scope = "recent"; render(); }, "hm-notes-nav-item");
  allButton.dataset.notesScope = "all";
  recentButton.dataset.notesScope = "recent";
  navigation.append(el("p", "LIBRARY", "hm-notes-rail-label"), allButton, recentButton,
    el("p", "SITE PROJECTS", "hm-notes-rail-label hm-notes-project-label"), projectList);
  rail.replaceChildren(el("p", "NOTES", "hm-docs-kicker"), searchLabel, navigation,
    el("p", "Notes are saved in this browser and stay attached to their site project.", "hm-notes-rail-footnote"));
  const heading = el("div", undefined, "hm-global-page-heading");
  const headingCopy = el("div", undefined, "hm-notes-heading-copy");
  headingCopy.append(el("p", "FIELD JOURNAL", "hm-notes-eyebrow"), el("h1", "Notes"),
    el("p", "Observations, decisions, and data annotations across your site projects."));
  const newNote = button("＋ New note", () => {
    composerOpen = !composerOpen;
    scope = "all";
    render();
    compose.hidden = !composerOpen;
    newNote.setAttribute("aria-expanded", String(composerOpen));
    if (composerOpen) { parcel.focus(); compose.scrollIntoView({ block: "nearest", behavior: "smooth" }); }
  }, "hm-docs-primary hm-notes-new-note");
  newNote.disabled = parcels.size === 0;
  if (newNote.disabled) newNote.title = "Save a parcel on the map to start a site project";
  newNote.setAttribute("aria-expanded", "false");
  heading.append(headingCopy, newNote);
  const overview = el("div", undefined, "hm-notes-overview");
  const metric = (label) => { const node = el("div", undefined, "hm-notes-metric"); node.append(el("strong", "0"), el("span", label)); return node; };
  const noteMetric = metric("NOTES");
  const projectMetric = metric("SITE PROJECTS");
  const latestMetric = metric("LATEST NOTE");
  overview.append(noteMetric, projectMetric, latestMetric);
  const compose = el("form", undefined, "hm-global-note-compose");
  compose.hidden = true;
  compose.setAttribute("aria-label", "Write a parcel note");
  const composeHead = el("div", undefined, "hm-notes-compose-head");
  composeHead.append(el("div", undefined), button("×", () => {
    composerOpen = false; compose.hidden = true; newNote.setAttribute("aria-expanded", "false");
  }, "hm-notes-close"));
  composeHead.firstChild.append(el("h2", "Capture a note"), el("p", "Keep a quick observation or longer thought with its site."));
  const parcel = document.createElement("select");
  parcel.required = true;
  parcel.setAttribute("aria-label", "Site project for this note");
  parcel.append(new Option(parcels.size ? "Choose a site project…" : "Save a parcel to create a project…", ""));
  for (const [key, label] of parcels) parcel.append(new Option(label, key));
  const noteInput = document.createElement("textarea");
  noteInput.maxLength = 12000;
  noteInput.placeholder = "What did you notice? Capture context, a decision, or a question…";
  noteInput.required = true;
  noteInput.setAttribute("aria-label", "New parcel note");
  const parcelField = el("label", "SITE PROJECT", "hm-notes-field-label");
  parcelField.append(parcel);
  const noteField = el("label", "YOUR NOTE", "hm-notes-field-label hm-notes-note-field");
  noteField.append(noteInput);
  const composeActions = el("div", undefined, "hm-notes-compose-actions");
  const cancel = button("Cancel", () => {
    composerOpen = false; compose.hidden = true; newNote.setAttribute("aria-expanded", "false");
  }, "hm-docs-quiet-button");
  const save = el("button", "Save note", "hm-docs-primary");
  save.type = "submit";
  composeActions.append(cancel, save);
  compose.append(composeHead, parcelField, noteField, composeActions);
  compose.addEventListener("submit", async (event) => {
    event.preventDefault();
    const text = noteInput.value.trim();
    if (!parcel.value || !text) { status.textContent = "Choose a site project and write a note first"; return; }
    const address = parcels.get(parcel.value) || parcel.value;
    const now = new Date().toISOString();
    const record = { id: uid(), parcelKey: parcel.value, layer: "Project", row: address, field: "General note", text, createdAt: now, updatedAt: now };
    await putLocalRecord("field-notes", record);
    notes.unshift(record);
    scope = "all";
    noteInput.value = "";
    composerOpen = false;
    compose.hidden = true;
    newNote.setAttribute("aria-expanded", "false");
    status.textContent = "Note saved on this device";
    render();
  });
  const list = el("div", undefined, "hm-notes-feed");
  const feedHead = el("div", undefined, "hm-notes-feed-head");
  const feedTitle = el("h2", "All notes");
  const feedCount = el("span", "0 notes", "hm-notes-feed-count");
  feedHead.append(feedTitle, feedCount);
  content.replaceChildren(heading, overview, compose, feedHead, list);
  const render = () => {
    const recentNotes = notes.filter((note) => Date.now() - new Date(note.createdAt ?? 0).getTime() < 7 * 86400000);
    const projectCounts = new Map();
    for (const note of notes) if (note.parcelKey) projectCounts.set(note.parcelKey, (projectCounts.get(note.parcelKey) ?? 0) + 1);
    allButton.replaceChildren(el("span", "All notes"), el("small", String(notes.length)));
    recentButton.replaceChildren(el("span", "Recent"), el("small", String(recentNotes.length)));
    allButton.classList.toggle("is-active", scope === "all");
    recentButton.classList.toggle("is-active", scope === "recent");
    allButton.setAttribute("aria-pressed", String(scope === "all"));
    recentButton.setAttribute("aria-pressed", String(scope === "recent"));
    projectList.replaceChildren();
    const projectKeys = [...new Set([...parcels.keys(), ...projectCounts.keys()])];
    if (!projectKeys.length) projectList.append(el("p", "Your parcel projects will appear here.", "hm-notes-project-empty"));
    for (const key of projectKeys) {
      const projectButton = button("", () => { scope = key; render(); }, "hm-notes-nav-item hm-notes-project-item");
      projectButton.classList.toggle("is-active", scope === key);
      projectButton.setAttribute("aria-pressed", String(scope === key));
      projectButton.append(el("span", parcels.get(key) || key), el("small", String(projectCounts.get(key) ?? 0)));
      projectList.append(projectButton);
    }
    noteMetric.querySelector("strong").textContent = String(notes.length);
    projectMetric.querySelector("strong").textContent = String(projectCounts.size);
    const latestDate = new Date(notes[0]?.createdAt ?? notes[0]?.updatedAt ?? "");
    latestMetric.querySelector("strong").textContent = notes.length && !Number.isNaN(latestDate.getTime())
      ? latestDate.toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "—";
    const activeProject = parcels.get(scope) || "";
    feedTitle.textContent = scope === "recent" ? "Recent notes" : activeProject || "All notes";
    const visible = notes.filter((note) => (scope === "all" || (scope === "recent" ? recentNotes.includes(note) : note.parcelKey === scope))
      && `${note.text ?? ""} ${note.layer ?? ""} ${note.row ?? ""} ${note.field ?? ""} ${note.value ?? ""} ${note.anchorType ?? ""} ${parcels.get(note.parcelKey) ?? ""}`.toLowerCase().includes(query));
    feedCount.textContent = `${visible.length} ${visible.length === 1 ? "note" : "notes"}`;
    list.replaceChildren();
    if (!visible.length) {
      const empty = el("section", undefined, "hm-notes-empty");
      empty.append(el("span", "✳", "hm-notes-empty-mark"), el("p", notes.length ? "NOTHING MATCHED" : "YOUR FIELD JOURNAL", "hm-notes-eyebrow"),
        el("h3", notes.length ? "No notes in this view" : "Make space for the details that matter."),
        el("p", notes.length ? "Try another project or clear your search." : "Add observations here, or annotate layers and fields from a parcel workspace. Your notes will stay connected to the site."));
      if (!notes.length && !parcels.size) {
        const mapLink = el("a", "Open the map", "hm-docs-quiet-button hm-notes-map-link");
        mapLink.href = "/map/";
        empty.append(mapLink);
      } else if (!notes.length) {
        const start = button("＋ Write the first note", () => { composerOpen = true; compose.hidden = false; newNote.setAttribute("aria-expanded", "true"); parcel.focus(); }, "hm-docs-primary");
        empty.append(start);
      }
      list.append(empty);
      return;
    }
    for (const note of visible) {
      const card = el("article", undefined, "hm-docs-note-card hm-global-note-card");
      const head = el("div", undefined, "hm-notes-card-head");
      const projectLink = el("a", parcels.get(note.parcelKey) || "Site project", "hm-notes-card-project");
      projectLink.href = note.parcelKey ? `/map/#parcel=${encodeURIComponent(note.parcelKey)}` : "/map/";
      const date = new Date(note.createdAt ?? note.updatedAt ?? "");
      const time = el("time", Number.isNaN(date.getTime()) ? "Recently" : date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }), "hm-notes-card-date");
      if (!Number.isNaN(date.getTime())) time.dateTime = date.toISOString();
      const context = el("div", undefined, "hm-notes-card-context");
      const annotation = note.anchorType === "parcel-field";
      context.append(el("span", annotation ? "DATA ANNOTATION" : "PROJECT NOTE", "hm-notes-context-type"));
      const detail = [note.layer, note.row, note.field].filter(Boolean).filter((value, index, values) => index === 0 || value !== values[index - 1]).join(" / ");
      if (detail) context.append(el("span", detail, "hm-notes-context-detail"));
      head.append(projectLink, time);
      const body = el("div", undefined, "hm-notes-card-body");
      body.append(context, el("p", note.text));
      if (annotation && note.value) body.append(el("p", `Recorded value: ${note.value}`, "hm-notes-card-value"));
      head.append(button("Delete", async () => {
        if (!confirm("Delete this note?")) return;
        await removeLocalRecord("field-notes", note.id);
        notes = notes.filter((entry) => entry.id !== note.id);
        render();
      }, "hm-docs-quiet-button"));
      card.append(head, body);
      list.append(card);
    }
  };
  search.addEventListener("input", () => { query = search.value.trim().toLowerCase(); render(); });
  render();
}
