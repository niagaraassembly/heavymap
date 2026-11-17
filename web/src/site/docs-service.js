import { el } from "../dossier.js";
import { putLocalRecord, recordsFor, removeLocalRecord } from "../local-data.js";

const DEFAULT_SECTIONS = [
  "Vision and intended outcomes",
  "Site conditions",
  "Development concept",
  "Evidence and data",
  "Constraints, risks, and open questions",
  "Viability",
  "Decisions and next steps",
];
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
  const library = root.querySelector("[data-docs-library]");
  const list = root.querySelector("[data-docs-list]");
  const search = root.querySelector("[data-docs-search]");
  const projectFilter = root.querySelector("[data-docs-project-filter]");
  const count = root.querySelector("[data-docs-count]");
  const status = root.querySelector("[data-docs-status]");
  const detail = root.querySelector("[data-docs-detail]");
  const empty = root.querySelector("[data-docs-empty]");
  let docs = [];
  let selectedDocId = null;
  let activeDoc = null;
  let selectedSectionId = null;
  let editing = false;
  let saveTimer;

  const all = async () => {
    docs = (await recordsFor("documents")).sort((a, b) => String(b.updatedAt ?? "").localeCompare(String(a.updatedAt ?? "")));
    const projects = [...new Set(docs.map((doc) => doc.parcelKey).filter(Boolean))];
    projectFilter.replaceChildren(new Option("All site projects", "all"));
    for (const key of projects) projectFilter.append(new Option(key, key));
    renderList();
    if (selectedDocId) {
      const selected = docs.find((doc) => doc.id === selectedDocId);
      if (selected) open(selected, editing);
      else showEmpty();
    } else showEmpty();
  };

  function renderList() {
    const query = search.value.trim().toLowerCase();
    const project = projectFilter.value;
    const filtered = docs.filter((doc) => {
      const matches = `${doc.title} ${doc.template} ${doc.parcelKey} ${doc.sections.map((s) => s.title).join(" ")}`.toLowerCase().includes(query);
      return matches && (project === "all" || doc.parcelKey === project);
    });
    count.textContent = `${filtered.length} ${filtered.length === 1 ? "document" : "documents"}`;
    list.replaceChildren();
    if (!filtered.length) {
      const message = docs.length ? "No documents match these filters." : "Your site plans and project documents will live here.";
      list.append(el("p", message, "hm-docs-empty-copy"));
      return;
    }
    for (const doc of filtered) {
      const card = el("article", undefined, `hm-docs-card${selectedDocId === doc.id ? " is-current" : ""}`);
      const open = button("", () => openDocument(doc, false), "hm-docs-card-open");
      open.append(el("span", doc.template === "default-general" ? "SITE PLAN" : doc.template.toUpperCase(), "hm-docs-kicker"));
      open.append(el("strong", doc.title || "Untitled document"));
      open.append(el("span", doc.parcelKey || "No site project selected", "hm-docs-card-project"));
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

  function showEmpty() {
    activeDoc = null;
    selectedDocId = null;
    detail.replaceChildren();
    detail.append(empty);
    empty.hidden = false;
    library.classList.remove("is-writing");
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
    empty.hidden = true;
    library.classList.add("is-writing");
    detail.replaceChildren();
    const top = el("div", undefined, "hm-docs-editor-toolbar");
    top.append(button("← Library", showEmpty, "hm-docs-back"));
    const heading = el("div", undefined, "hm-docs-editor-title");
    heading.append(el("span", activeDoc.parcelKey || "Site project", "hm-docs-kicker"));
    const title = document.createElement("input");
    title.value = activeDoc.title || "Untitled document";
    title.maxLength = 180;
    title.disabled = !editing;
    title.setAttribute("aria-label", "Document title");
    title.addEventListener("input", () => { activeDoc.title = title.value; saveSoon(); });
    heading.append(title);
    top.append(heading);
    const state = el("span", editing ? "EDITING" : "READING", "hm-docs-mode");
    top.append(state, el("span", "Saved on this device", "hm-docs-save-status"));
    if (editing) top.append(button("Done", async () => { await persist(); editing = false; renderDocument(); }, "hm-docs-primary"));
    else top.append(button("Edit document", () => { editing = true; renderDocument(); }, "hm-docs-primary"));
    detail.append(top);

    const workspace = el("div", undefined, "hm-docs-editor-workspace");
    const outline = el("aside", undefined, "hm-docs-outline");
    const outlineHead = el("div", undefined, "hm-docs-outline-head");
    outlineHead.append(el("span", "DOCUMENT OUTLINE", "hm-docs-kicker"));
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
      body.append(el("p", "SITE PLAN · DEFAULT-GENERAL", "hm-docs-kicker"));
      if (editing) {
        const editor = document.createElement("textarea");
        editor.value = section.markdown ?? "";
        editor.placeholder = "Capture the thinking, evidence, and open questions for this section…\n\nUse Markdown for headings and lists.";
        editor.setAttribute("aria-label", `${section.title} content in Markdown`);
        editor.addEventListener("input", () => { section.markdown = editor.value; saveSoon(); });
        body.append(editor);
        const refs = (awaitFieldNotes(activeDoc.parcelKey));
        void refs.then((items) => {
          if (!editing || !items.length || !body.isConnected) return;
          const ref = document.createElement("select"); ref.setAttribute("aria-label", "Insert a saved parcel data note");
          ref.append(new Option("Insert a parcel data note…", ""));
          for (const item of items) ref.append(new Option(`${item.layer} · ${item.row} · ${item.field}`, item.id));
          ref.addEventListener("change", () => {
            const item = items.find((note) => note.id === ref.value); if (!item) return;
            section.markdown = `${section.markdown}${section.markdown ? "\n\n" : ""}> **${item.layer} · ${item.row} · ${item.field}**\n> ${item.text.replace(/\n/g, "\n> ")}`;
            renderDocument(); saveSoon();
          });
          const tools = body.querySelector(".hm-docs-reference-tools") ?? el("div", undefined, "hm-docs-reference-tools");
          tools.replaceChildren(ref, el("span", "Notes are private to this site project."));
          if (!tools.isConnected) body.append(tools);
        });
      } else {
        const reader = el("article", undefined, "hm-docs-markdown");
        markdown(reader, section.markdown);
        body.append(reader);
      }
    } else body.append(el("p", "Add a section to begin.", "hm-docs-empty-copy"));
    workspace.append(outline, body);
    detail.append(workspace);
  }

  async function awaitFieldNotes(parcelKey) {
    if (!parcelKey) return [];
    return (await recordsFor("field-notes")).filter((note) => note.parcelKey === parcelKey).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
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

  function openCreateDialog() {
    const dialog = root.querySelector("[data-docs-create-dialog]");
    const projects = root.querySelector("[data-docs-project]");
    const title = root.querySelector("[data-docs-new-title]");
    const feedback = root.querySelector("[data-docs-create-feedback]");
    const submit = root.querySelector("[data-docs-confirm-create]");
    void recordsFor("saved").then((saved) => {
      const parcelEntries = saved.filter((item) => item.kind === "parcel" && item.key);
      const known = new Map(parcelEntries.map((item) => [item.key, item.title || item.address || item.key]));
      for (const doc of docs) if (doc.parcelKey && !known.has(doc.parcelKey)) known.set(doc.parcelKey, doc.parcelKey);
      projects.replaceChildren(new Option("Choose a saved parcel…", ""));
      for (const [key, label] of known) projects.append(new Option(label, key));
      feedback.textContent = known.size ? "A site plan belongs to one parcel project." : "Save a parcel from the map first, then create its site plan here.";
      submit.disabled = known.size === 0;
    });
    title.value = "Site plan";
    dialog.showModal();
    projects.focus({ preventScroll: true });
  }

  root.querySelectorAll("[data-docs-create]").forEach((control) => control.addEventListener("click", openCreateDialog));
  root.querySelectorAll("[data-docs-create-close]").forEach((control) => control.addEventListener("click", () => root.querySelector("[data-docs-create-dialog]").close()));
  root.querySelector("[data-docs-confirm-create]").addEventListener("click", async (event) => {
    event.preventDefault();
    const parcelKey = root.querySelector("[data-docs-project]").value;
    if (!parcelKey) return;
    const now = new Date().toISOString();
    const doc = { id: uid(), parcelKey, title: root.querySelector("[data-docs-new-title]").value.trim() || "Site plan", template: "default-general", sections: DEFAULT_SECTIONS.map((title) => ({ id: uid(), title, parentId: null, markdown: "" })), createdAt: now, updatedAt: now };
    await putLocalRecord("documents", doc);
    root.querySelector("[data-docs-create-dialog]").close();
    await all();
    await openDocument(doc, true);
  });
  search.addEventListener("input", renderList);
  projectFilter.addEventListener("change", renderList);
  await all().catch((error) => { status.textContent = `Docs could not open: ${error.message}`; });
}
