import issue from "./issue-one.json" with { type: "json" };
import { catalogue } from "./reader-catalog.js";
import "./page-studies.css";

const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const arrow =
  '<svg class="arrow-icon" viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"><path d="M3 13 13 3M3 3h10v10" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>';
const asset = (name) => `${import.meta.env.BASE_URL}editorial/${name}`;
const dated = (d) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${d}T12:00:00Z`));
const labels = {
  announced: "Announced",
  completed: "Completed",
  application: "Application",
  approved_plan: "Approved plan",
  award: "Award",
  intent: "Intent",
};
const crumb = (parts) =>
  `<nav class="study-crumb" aria-label="Breadcrumb"><a href="#/">HeavyMap</a>${parts.map((p) => `<span aria-hidden="true">/</span>${p.href ? `<a href="${p.href}">${esc(p.text)}</a>` : `<span aria-current="page">${esc(p.text)}</span>`}`).join("")}</nav>`;
const regions = [
  {
    id: "western-new-york",
    name: "Western New York",
    subtitle: "New York / United States",
    number: "01",
    image: "buffalo-grain-elevators.jpg",
    imageAlt: "Historic grain elevators along the Buffalo waterfront",
    caption: "Buffalo, New York · Archival regional photograph",
    line: "From the Niagara River to Syracuse.",
    description:
      "Investment, facilities, jobs and new ventures. The stories shaping Western New York, with their sources and open questions in view.",
    coverage:
      "From the Niagara River to Syracuse; Lake Ontario south to the Pennsylvania border.",
  },
  {
    id: "niagara-brant",
    name: "Niagara–Brant",
    subtitle: "Ontario / Canada",
    number: "02",
    image: "hamilton-steel-mills.jpg",
    imageAlt: "Hamilton steel mills along the industrial waterfront",
    caption: "Hamilton, Ontario · Archival regional photograph",
    line: "The peninsula. The harbour. The hinterland.",
    description:
      "The industrial economies of the Niagara Peninsula, Hamilton and Brantford. A regional reading of places connected by land, water and work.",
    coverage: "Niagara Peninsula, Hamilton and Brantford.",
  },
];
function regionSwitcher(active) {
  return `<details class="region-switch"><summary>Change Desk <span aria-hidden="true">⌄</span></summary><div>${regions.map((d) => `<a href="#/desks/${d.id}" ${d.id === active ? 'aria-current="page"' : ""}>${d.name} ${arrow}</a>`).join("")}</div></details>`;
}
function follow(region) {
  return `<section class="study-follow"><div><p class="eyebrow">Stay with the region</p><h2>${region ? "Keep " + region + " close." : "A wider field of view."}</h2><p>Read on the web. Choose the regional Desks you want to receive by email.</p></div><a class="button" href="index.html#/subscribe${region ? "?desk=" + regions.find((r) => r.name === region)?.id : ""}">Choose your Desks ${arrow}</a></section>`;
}
function cards(items, { compact = false } = {}) {
  return items
    .map(
      (item, i) =>
        `<article class="study-dispatch ${compact ? "compact" : ""}"><span class="study-order">${String(i + 1).padStart(2, "0")}</span><div><p class="eyebrow">${esc(item.place || item.publication)} ${item.stage ? `<span class="stage">${labels[item.stage]}</span>` : ""}</p><h3><a href="#/read/${item.id}">${esc(item.title)}</a></h3><p>${esc(item.summary)}</p><a class="text-link" href="#/read/${item.id}">Read the brief ${arrow}</a></div></article>`,
    )
    .join("");
}
export function deskDirectory() {
  return `<section class="study-directory study-wrap">${crumb([{ text: "The Desks" }])}<div class="study-title-row"><div><p class="eyebrow">Reporting, rooted in place</p><h1>Find your <em>region.</em></h1></div><p>Two Desks, with independent coverage. <br />Read the reporting. Explore the places behind it.</p></div><div class="study-region-grid">${regions.map((d) => `<article><a href="#/desks/${d.id}" class="study-region-image"><img src="${asset(d.image)}" alt="${d.imageAlt}"/><span>Desk ${d.number}</span></a><p class="eyebrow">${d.subtitle}</p><h2><a href="#/desks/${d.id}">${d.name}</a></h2><p>${d.description}</p><div><a class="text-link" href="#/desks/${d.id}">Open the Desk ${arrow}</a><a class="study-small-link" href="index.html#/subscribe?desk=${d.id}">Follow +</a></div></article>`).join("")}</div></section>${follow()}`;
}
export function deskPage(id) {
  const d = regions.find((r) => r.id === id);
  if (!d) return null;
  const wny = id === "western-new-york";
  return `<section class="study-desk study-wrap"><div class="study-topline">${crumb([{ text: "The Desks", href: "#/desks" }, { text: d.name }])}${regionSwitcher(id)}</div><header class="desk-masthead"><p class="eyebrow">The ${d.name} Desk <span class="dot-separator">/</span> ${d.subtitle}</p><div><h1>${d.name}</h1><a class="desk-follow-link" href="index.html#/subscribe?desk=${id}">Follow this Desk ${arrow}</a></div><p>${d.line}</p></header><figure class="desk-panorama"><img src="${asset(d.image)}" alt="${d.imageAlt}"/><figcaption><span>${d.caption}</span><a href="index.html#/credits">Photograph credits</a></figcaption></figure><div class="desk-front-grid"><div>${wny ? `<section class="desk-edition"><div class="edition-kicker"><span class="eyebrow">An edition to start with</span><span>01 / 10 October 2026</span></div><h2>A region<br /><em>in motion.</em></h2><p class="desk-edition-summary">${esc(issue.summary)}</p><div class="edition-actions"><a class="button" href="#/editions/western-new-york/issue-one">Read Issue One ${arrow}</a><a class="text-link" href="#/reader?region=western-new-york">Browse in Reader ${arrow}</a></div><p class="study-note">Archived reporting · Coverage ${issue.coverage}. This design uses a selection of nine briefs from the original edition.</p></section><section class="desk-recent"><div class="study-section-title"><h2>From the record</h2><span class="eyebrow">Issue One selections</span></div>${cards(catalogue.filter((i) => i.kind === "news").slice(0, 3), { compact: true })}</section><section class="desk-archive"><div class="study-section-title"><h2>The editions</h2><span class="eyebrow">Included in this preview</span></div><a class="archive-row" href="#/editions/western-new-york/issue-one"><span>01</span><div><h3>Issue One</h3><p>Investment, industry and the questions behind the announcements.</p></div><span>10 October 2026</span>${arrow}</a></section>` : `<section class="desk-introduction"><p class="eyebrow">Across connected places</p><h2>A regional story<br /><em>across the border.</em></h2><p>${d.description}</p><p>The Desk has an existing home on Niagara Assembly. Its editions have not been brought into this HeavyMap design preview yet.</p><a class="button" href="https://niagaraassembly.com/desks/ca/on/niagara-brant/">Read the existing Desk ${arrow}</a></section><section class="desk-empty-archive"><span class="empty-edition-number">—</span><div><h2>Room for the next edition.</h2><p>This is where migrated and newly published editions will appear. No publication date or sample issue has been invented.</p></div></section><section class="region-connections"><p class="eyebrow">In the meantime</p><h2>Look across the river.</h2><p>Western New York Issue One offers a reading of the neighbouring region, from the Niagara River to Syracuse.</p><a class="text-link" href="#/editions/western-new-york/issue-one">Read Western New York ${arrow}</a></section>`}</div><aside class="desk-rail"><p class="eyebrow">Desk notes</p><div><span>Coverage</span><p>${d.coverage}</p></div><div><span>On the web</span><p>${wny ? "Issue One selections available here." : "The existing Desk remains available on Niagara Assembly."}</p></div><div><span>Mapping</span><p>${wny ? "A Western New York workspace is not available in this preview." : "Hamilton is the first planned mapping geography. Its live workspace is preparing for launch."}</p>${!wny ? '<button type="button" class="text-link" data-open-map>Preview the map transition ↗</button>' : ""}</div><div class="desk-reader-note"><span>Reader</span><p>Read one story at a time. Filter by region and pick up where you left off.</p><a class="text-link" href="#/reader?region=${id}">Open Reader ${arrow}</a></div></aside></div></section>${follow(d.name)}`;
}
const lanes = [
  [
    "production",
    "Investment & industry",
    "Direct investment, contracts and closures.",
  ],
  [
    "developing",
    "In development",
    "Plans and applications, not yet built or confirmed.",
  ],
  [
    "corridor",
    "Corridor news",
    "Regional developments, kept apart from production totals.",
  ],
];
export function editionPage() {
  const news = catalogue.filter((i) => i.kind === "news");
  return `<div class="study-edition study-wrap">${crumb([{ text: "Western New York", href: "#/desks/western-new-york" }, { text: "Issue One" }])}<header class="edition-masthead"><p class="eyebrow">The Western New York Desk <span class="dot-separator">/</span> Archived edition</p><div class="edition-title-line"><div><h1>Issue <em>One.</em></h1><p class="edition-subtitle">A region in motion.</p></div><div class="edition-date-stamp"><span>October</span><strong>10</strong><span>2026</span></div></div><p class="edition-standfirst">Reviewed news from the Niagara River to Syracuse: <br />who is investing, building, hiring and starting up.</p><div class="edition-meta-row"><span>Coverage ${issue.coverage}</span><a class="text-link" href="#/reader?region=western-new-york">Read in Reader ${arrow}</a><button type="button" class="study-copy" data-copy-page>Copy edition link ${arrow}</button></div></header><p class="edition-archive-label">Design selection from the published Issue One: nine briefs, retaining their original dates and source notes. This is historical reporting, not an update on current project status. <a href="${issue.original}">Read the complete original edition ↗</a></p><div class="edition-reading-layout"><aside class="edition-contents"><p class="eyebrow">In this edition</p>${lanes.map(([key, title], i) => `<a href="#/editions/western-new-york/issue-one?section=${key}"><span>0${i + 1}</span>${title}</a>`).join("")}<div><p class="eyebrow">How to read it</p><p>An announcement is not a completed project. A ceiling is not money spent. Open questions stay beside the story.</p><a class="text-link" href="#/read/hm-reading-the-evidence">A guide to the evidence ${arrow}</a></div><p id="copy-status" role="status"></p></aside><div><section class="edition-opening"><p class="eyebrow">The opening view</p><p>${esc(issue.summary)}</p></section>${lanes
    .map(
      ([key, title, sub], index) =>
        `<section class="edition-lane" id="study-${key}"><div class="edition-lane-heading"><span>0${index + 1}</span><div><h2>${title}</h2><p>${sub}</p></div></div>${issue.items
          .filter((i) => i.lane === key)
          .map((i) => {
            const item = catalogue.find((n) => n.id === i.id);
            return `<article class="edition-brief" id="brief-${item.id}"><p class="eyebrow">${esc(item.place)} <span class="stage">${labels[item.stage]}</span></p><h3><a href="#/read/${item.id}">${esc(item.title)}</a></h3><p>${esc(item.summary)}</p><div><span>${dated(item.date)} <span aria-hidden="true">·</span> ${item.sources.length} sources</span><a class="text-link" href="#/read/${item.id}">Open the brief ${arrow}</a><a class="study-icon-link" href="#/reader?item=${item.id}" aria-label="Read ${esc(item.title)} in Reader">Reader ${arrow}</a></div></article>`;
          })
          .join("")}</section>`,
    )
    .join(
      "",
    )}<section class="edition-endnote"><p class="eyebrow">End of this selection</p><h2>Stay with the region.</h2><p>The story continues beyond an announcement. Keep the sources close and the questions open.</p><a class="text-link" href="#/desks/western-new-york">Back to the Desk ${arrow}</a></section></div></div></div>${follow("Western New York")}`;
}
const editorial = {
  id: "editorial-study",
  title: "A headline is a beginning, not a conclusion.",
  summary:
    "To understand a region, follow what happens after the announcement—and keep a place for what remains unknown.",
  sections: [
    {
      heading: "The moment and the movement",
      text: "A regional news item captures a moment: a facility is proposed, a contract is awarded, an investor names a place. The longer story is movement. It involves decisions, dates and changes that rarely fit inside a single announcement.",
    },
    {
      heading: "Different kinds of evidence",
      text: "An official announcement, a company statement and a local report may describe the same event from different positions. Reading them together is useful precisely because they are not interchangeable. A source label should make that distinction easier to see.",
    },
    {
      heading: "The place behind the figure",
      text: "A dollar figure can be clear while its local meaning is not. A contract may span more than one location. An acquisition can involve a regional company without establishing where production takes place. The regional question remains: what does this tell us about this place?",
    },
    {
      heading: "Leave room for the next question",
      text: "A useful reading does not need to finish every argument. It should make the next question visible: what was actually committed, which geography is involved, and what evidence would change the interpretation? That is a more durable starting point than a confident conclusion built from an incomplete record.",
    },
  ],
};
const sectionId = (index) => `reading-section-${index + 1}`;
function sourceList(item) {
  return `<section class="standalone-sources" id="study-sources"><p class="eyebrow">The evidence behind the brief</p><h2>Sources & context</h2>${item.sources.map((s, i) => `<a href="${esc(s.url)}"><span class="source-sequence">${String(i + 1).padStart(2, "0")}</span><div><span class="eyebrow">${esc(s.kind)} source <span class="dot-separator">/</span> ${esc(s.publisher)}</span><strong>${esc(s.title)}</strong></div>${arrow}</a>`).join("")}</section>`;
}
export function readingPage(id) {
  const item = catalogue.find((i) => i.id === id);
  const study = id === "editorial-study";
  if (!item && !study) return null;
  const entry = study ? editorial : item;
  const news = item?.kind === "news";
  const documentation = item?.kind === "documentation";
  const type = news
    ? "News brief"
    : documentation
      ? "Reader’s guide"
      : "Editorial";
  const title = entry.title;
  const related = catalogue
    .filter((i) =>
      news
        ? i.kind === "news" && i.id !== id
        : i.kind === "documentation" && i.id !== id,
    )
    .slice(0, 2);
  return `<div class="standalone-reading study-wrap">${crumb([{ text: news ? "Western New York" : documentation ? "Reader" : "Page studies", href: news ? "#/desks/western-new-york" : documentation ? "#/reader" : "#/studies" }, { text: type }])}<header class="standalone-heading"><p class="eyebrow">${news ? 'Western New York <span class="dot-separator">/</span> Issue One' : documentation ? 'HeavyMap <span class="dot-separator">/</span> Documentation study' : 'HeavyMap <span class="dot-separator">/</span> Editorial study'}</p>${news ? `<span class="stage">${labels[item.stage]}</span>` : ""}<h1>${esc(title)}</h1><p class="standalone-deck">${esc(entry.summary)}</p><div class="standalone-byline"><span>${news ? "Niagara Assembly · Western New York Desk" : "HeavyMap · Unpublished design sample"}</span><span>${news ? "Edition published 10 October 2026" : "No publication date assigned"}</span><button type="button" class="study-copy" data-copy-page>Copy page link ${arrow}</button></div></header><div class="standalone-layout"><aside class="reading-margin">${news ? `<p class="eyebrow">The record</p><dl><dt>Place</dt><dd>${esc(item.place)}</dd><dt>Source date</dt><dd>${dated(item.date)}</dd><dt>Stage at that date</dt><dd>${labels[item.stage]}</dd><dt>Sources</dt><dd>${item.sources.length} linked records</dd></dl><a class="text-link" href="#/reader?item=${id}">Open in Reader ${arrow}</a><a class="text-link" href="#/editions/western-new-york/issue-one">Back to the edition ${arrow}</a>` : `<p class="eyebrow">On this page</p><nav aria-label="Article sections">${entry.sections.map((s, i) => `<a href="#/read/${id}?section=${sectionId(i)}"><span>0${i + 1}</span>${esc(s.heading)}</a>`).join("")}</nav>${documentation ? `<a class="text-link" href="#/reader?item=${id}">Open in Reader ${arrow}</a>` : ""}`}<p id="copy-status" role="status"></p></aside><article class="standalone-body">${news ? `<p class="reading-context-label">Archived reporting · This brief retains its original source dates. It does not establish the project’s current status.</p><aside class="reading-pullnote"><span class="eyebrow">Keep the distinction</span><p>${item.stage === "application" ? "An application is not an approved or under-construction project." : item.stage === "announced" ? "An announced investment is a stated plan, not evidence that the project has been completed." : item.stage === "completed" ? "A completed transaction does not, by itself, establish where production takes place." : "Read the stated stage alongside the dated sources. It should not stand in for a current project update."}</p></aside>${sourceList(item)}<section class="publication-record"><h2>Publication record</h2><p>Originally included in Western New York Issue One, published by Niagara Assembly on 10 October 2026. This prototype reproduces selected reporting for design review; it adds no new reporting or correction.</p><a class="text-link" href="${issue.original}">Read the original edition ${arrow}</a></section>` : `<p class="reading-context-label">${documentation ? "Documentation design study" : "Editorial layout and sample copy"} · Unpublished. Presented for design review, not as a finished publication.</p>${entry.sections.map((s, i) => `<section id="study-${sectionId(i)}"><span class="reading-section-number">0${i + 1}</span><h2>${esc(s.heading)}</h2><p>${esc(s.text)}</p>${study && i === 1 ? "<blockquote>The source is part of the story.<br />So is what it cannot tell us.</blockquote>" : ""}</section>`).join("")}<section class="publication-record"><h2>About this ${documentation ? "guide" : "study"}</h2><p>${documentation ? "This guide demonstrates a longer documentation page: an on-page contents list, numbered sections and a link into Reader." : "This sample demonstrates the editorial hierarchy, a pull quote and a concluding note. No named author, publication date or published editorial has been fabricated."}</p><a class="text-link" href="${documentation ? "#/reader?item=" + id : "#/studies"}">${documentation ? "Continue in Reader" : "Back to the page studies"} ${arrow}</a></section>`}</article></div><section class="reading-related"><div class="study-section-title"><h2>${news ? "Stay with the edition" : "Read alongside"}</h2><span class="eyebrow">A different angle</span></div><div>${related.map((r) => `<a href="#/read/${r.id}"><span class="eyebrow">${r.kind === "news" ? "Western New York / Issue One" : "HeavyMap / Documentation study"}</span><h3>${esc(r.title)}</h3>${arrow}</a>`).join("")}</div></section></div>${follow(news ? "Western New York" : undefined)}`;
}
export function reviewGallery() {
  return `<section class="study-gallery study-wrap">${crumb([{ text: "Page studies" }])}<p class="eyebrow">Design review / Round one</p><h1>A place for<br /><em>every reading.</em></h1><p class="study-gallery-intro">Regional Desks, a complete edition layout, and individual reading pages. These extend the chosen second design. They are studies for your comments; the specification plan comes later.</p><div class="gallery-grid">${[
    [
      "01",
      "Western New York Desk",
      "A populated regional front page: an edition, recent briefs, archive and coverage notes.",
      "#/desks/western-new-york",
    ],
    [
      "02",
      "Niagara–Brant Desk",
      "A lighter front page with honest edition availability and a Hamilton mapping preview.",
      "#/desks/niagara-brant",
    ],
    [
      "03",
      "Issue One",
      "An edition you can read as a whole, with grouped stories and links into Reader.",
      "#/editions/western-new-york/issue-one",
    ],
    [
      "04",
      "Individual news brief",
      "A direct reading URL, source provenance, a publication record and related material.",
      "#/read/IEVT-2026-000001",
    ],
    [
      "05",
      "Documentation",
      "Longer reading with numbered sections, a contents list and a Reader connection.",
      "#/read/hm-reading-the-evidence",
    ],
    [
      "06",
      "Editorial study",
      "An unpublished sample to review the long-form hierarchy, pull quote and closing note.",
      "#/read/editorial-study",
    ],
  ]
    .map(
      ([number, title, description, href]) =>
        `<a href="${href}"><span class="eyebrow">${number} / Page study</span><h2>${title}</h2><p>${description}</p><span class="text-link">Open the study ${arrow}</span></a>`,
    )
    .join(
      "",
    )}</div><aside class="review-questions"><p class="eyebrow">Questions to review</p><h2>Does each surface have a clear job?</h2><p>Consider the Desk as a regional front door, the edition as a complete reading sequence, and Reader as the filterable library. Does the distinction feel useful? Are source notes and uncertainty visible enough without overwhelming the reading?</p></aside></section>`;
}
export function studyRoute(path) {
  if (path === "/desks") return { html: deskDirectory(), title: "The Desks" };
  if (path.startsWith("/desks/")) {
    const id = path.slice("/desks/".length);
    const html = deskPage(id);
    return html
      ? { html, title: regions.find((r) => r.id === id).name + " Desk" }
      : null;
  }
  if (path === "/editions/western-new-york/issue-one")
    return { html: editionPage(), title: "Western New York · Issue One" };
  if (path.startsWith("/read/")) {
    const id = path.slice("/read/".length);
    const html = readingPage(id);
    return html
      ? { html, title: (catalogue.find((i) => i.id === id) || editorial).title }
      : null;
  }
  if (path === "/studies")
    return { html: reviewGallery(), title: "Page studies · Round one" };
  return null;
}
export function bindStudyControls() {
  document.querySelectorAll("[data-copy-page]").forEach((button) =>
    button.addEventListener("click", async () => {
      const status = document.getElementById("copy-status");
      try {
        await navigator.clipboard.writeText(location.href);
        if (status) status.textContent = "Page link copied.";
      } catch {
        if (status)
          status.textContent =
            "Copy the page address from your browser to share this preview.";
      }
    }),
  );
}
