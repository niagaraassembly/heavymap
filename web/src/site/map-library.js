const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[char]));
const slug = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function renderSection(section, depth = 2) {
  const tag = depth > 2 ? "h3" : "h2";
  return `<section id="${esc(section.id)}"><${tag}>${esc(section.title)}</${tag}>${(section.body ?? []).map((paragraph) => `<p>${esc(paragraph)}</p>`).join("")}${section.links?.length ? `<ul class="hm-doc-links">${section.links.map((link) => `<li><a href="${esc(link.url)}" target="_blank" rel="noopener noreferrer">${esc(link.label)} ↗</a></li>`).join("")}</ul>` : ""}${(section.subsections ?? []).map((child) => renderSection(child, depth + 1)).join("")}</section>`;
}

function tocItems(sections) {
  return sections.map((section) => `<li><a href="#${esc(section.id)}">${esc(section.title)}</a>${section.subsections?.length ? `<ol>${tocItems(section.subsections)}</ol>` : ""}</li>`).join("");
}

function init() {
  const root = document.querySelector("[data-map-library]");
  if (!root) return;
  const list = document.getElementById("map-library-list");
  const more = document.getElementById("map-library-more");
  const count = document.getElementById("map-library-count");
  const range = document.getElementById("map-library-range");
  const search = document.getElementById("map-library-search");
  const city = document.getElementById("map-library-city");
  const topic = document.getElementById("map-library-topic");
  const kind = document.getElementById("map-library-kind");
  const viewer = document.getElementById("map-document-viewer");
  const toc = document.querySelector("#map-document-toc ol");
  const tocNav = document.getElementById("map-document-toc");
  const pageSize = 50;
  let docs = [];
  let filtered = [];
  let shown = pageSize;
  let selected = null;

  const fillFilter = (select, values) => {
    for (const value of [...new Set(values)].sort()) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      select.append(option);
    }
  };
  const setSelected = (doc, updateUrl = true, scroll = true) => {
    if (!doc) return;
    selected = doc;
    const sections = doc.sections ?? [];
    const body = viewer.querySelector(".hm-document-body");
    body.innerHTML = `<p class="eyebrow">${esc(doc.place)} · ${esc(doc.topic)} · ${esc(doc.kind)}</p><h1>${esc(doc.title)}</h1><p class="hm-document-summary">${esc(doc.summary)}</p><p class="hm-document-date">Updated ${esc(doc.date)} · Record ${esc(doc.id)}</p>${sections.map((section) => renderSection(section)).join("")}`;
    toc.innerHTML = tocItems(sections);
    tocNav.hidden = sections.length === 0;
    const position = document.getElementById("map-document-position");
    position.textContent = doc.kind;
    for (const button of list.querySelectorAll("[data-doc-id]"))
      button.setAttribute("aria-current", String(button.dataset.docId === doc.id));
    if (updateUrl) {
      const url = new URL(location.href);
      url.searchParams.set("doc", doc.id);
      history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    }
    if (scroll && matchMedia("(max-width: 700px)").matches)
      viewer.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const drawList = () => {
    const query = search.value.trim().toLowerCase();
    filtered = docs.filter((doc) => {
      const text = `${doc.title} ${doc.summary} ${doc.place} ${doc.topic} ${doc.kind} ${doc.id}`.toLowerCase();
      return (!query || text.includes(query)) &&
        (city.value === "all" || doc.place === city.value) &&
        (topic.value === "all" || doc.topic === topic.value) &&
        (kind.value === "all" || doc.kind === kind.value);
    });
    const page = filtered.slice(0, shown);
    list.innerHTML = page.map((doc) => `<li><button type="button" data-doc-id="${esc(doc.id)}" aria-current="${String(selected?.id === doc.id)}"><span class="hm-doc-kind">${esc(doc.kind)} · ${esc(doc.place)}</span><strong>${esc(doc.title)}</strong><span>${esc(doc.summary)}</span><time datetime="${esc(doc.date)}">${esc(doc.date)}</time></button></li>`).join("");
    list.querySelectorAll("[data-doc-id]").forEach((button) => button.addEventListener("click", () => {
      const doc = docs.find((item) => item.id === button.dataset.docId);
      setSelected(doc);
    }));
    count.textContent = `${filtered.length.toLocaleString("en-CA")} ${filtered.length === 1 ? "record" : "records"}`;
    range.textContent = filtered.length ? `Showing ${Math.min(shown, filtered.length).toLocaleString("en-CA")} of ${filtered.length.toLocaleString("en-CA")}` : "";
    more.hidden = shown >= filtered.length;
  };

  search.addEventListener("input", () => { shown = pageSize; drawList(); });
  for (const select of [city, topic, kind]) select.addEventListener("change", () => { shown = pageSize; drawList(); });
  more.addEventListener("click", () => { shown += pageSize; drawList(); });
  root.querySelectorAll("[data-library-print]").forEach((button) => button.addEventListener("click", () => window.print()));
  root.querySelectorAll("[data-library-copy]").forEach((button) => button.addEventListener("click", async () => {
    const url = new URL(location.href);
    if (selected) url.searchParams.set("doc", selected.id);
    try { await navigator.clipboard.writeText(url.href); button.textContent = "Copied"; }
    catch { button.textContent = url.href; }
  }));

  fetch("/map/data-methods/catalogue.json")
    .then((response) => { if (!response.ok) throw new Error("catalogue unavailable"); return response.json(); })
    .then((catalogue) => {
      docs = catalogue.documents ?? [];
      fillFilter(city, docs.map((doc) => doc.place));
      fillFilter(topic, docs.map((doc) => doc.topic));
      fillFilter(kind, docs.map((doc) => doc.kind));
      drawList();
      const requested = new URLSearchParams(location.search).get("doc");
      setSelected(docs.find((doc) => doc.id === requested) ?? docs[0], false, false);
    })
    .catch(() => { count.textContent = "The document catalogue could not be loaded."; });
}

init();
