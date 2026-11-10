import "./site.css";
import issue from "./issue-one.json" with { type: "json" };

const image = (name) => `${import.meta.env.BASE_URL}editorial/${name}`;
const arrowIcon =
  '<svg class="arrow-icon" viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"><path d="M3 13 13 3M3 3h10v10" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>';
const arrow = arrowIcon;
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const desks = [
  {
    id: "western-new-york",
    name: "Western New York",
    country: "United States",
    province: "New York",
    line: "From the Niagara River to Syracuse.",
    description:
      "Investment, facilities, jobs and new ventures. Read what is changing across the region, and what is still unconfirmed.",
    image: "buffalo-grain-elevators.jpg",
    caption: "Buffalo, New York",
    number: "01",
    published: true,
  },
  {
    id: "niagara-brant",
    name: "Niagara–Brant",
    country: "Canada",
    province: "Ontario",
    line: "The peninsula. The harbour. The hinterland.",
    description:
      "Industrial economies across the Niagara Peninsula, Hamilton and Brantford. A regional view across connected places.",
    image: "hamilton-steel-mills.jpg",
    caption: "Hamilton, Ontario · archival photograph",
    number: "02",
    published: false,
  },
];
// Desk and mapping availability are independent. Add only a verified, published
// production URL here when launch is approved. The synthetic map stays separate.
export const mapping = {
  name: "Hamilton, Ontario",
  status: "preparing",
  publishedUrl: null,
};
const publishedMapUrl = (() => {
  if (mapping.status !== "published" || !mapping.publishedUrl) return null;
  try {
    const url = new URL(mapping.publishedUrl);
    return url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
})();
const date = (d) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${d}T12:00:00Z`));
const label = (s) =>
  ({
    announced: "Announced",
    completed: "Completed",
    application: "Application",
    approved_plan: "Approved plan",
    award: "Award",
    intent: "Intent",
  })[s] || s;
const crumb = (text) =>
  `<p class="breadcrumb"><a href="#/">HeavyMap</a><span>/</span>${text}</p>`;
function card(d) {
  return `<article class="desk-card"><a class="desk-photo" href="#/desks/${d.id}" aria-label="Explore the ${d.name} Desk"><img src="${image(d.image)}" alt="${d.id === "western-new-york" ? "Historic grain elevators along the Buffalo waterfront" : "Steel mills on Hamilton’s industrial waterfront"}" loading="lazy" /><span class="photo-caption">${d.caption}</span><span class="desk-number">${d.number}</span></a><div class="desk-copy"><p class="eyebrow">${d.country} <span class="dot-separator">/</span> ${d.province}</p><h3><a href="#/desks/${d.id}">${d.name}</a></h3><p>${d.description}</p><div class="desk-card-bottom"><a class="text-link" href="#/desks/${d.id}">Explore the Desk ${arrow}</a><a class="subtle-link" href="#/subscribe?desk=${d.id}">Subscribe +</a></div></div></article>`;
}
function atlas() {
  return `<svg class="atlas-art" viewBox="0 0 640 430" role="img" aria-label="Illustrative regional landscape: a lake, contours and a network of connected places. Not a geographic map."><defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="#254850" stroke-opacity=".09" /></pattern></defs><path fill="#dfe5d8" d="M0 0H640V430H0z"/><path fill="#bfd5d7" d="M245 0H640V250L579 236 527 208 488 198 445 155 390 159 332 116 291 105z"/><g fill="none" stroke="#91a38b" stroke-width="1" opacity=".55"><path d="M-80 390Q45 110 200 165T420 300T710 325"/><path d="M-80 410Q45 130 200 185T420 320T710 345"/><path d="M-80 430Q45 150 200 205T420 340T710 365"/><path d="M-80 450Q45 170 200 225T420 360T710 385"/><path d="M-80 470Q45 190 200 245T420 380T710 405"/><path d="M-80 490Q45 210 200 265T420 400T710 425"/></g><path fill="url(#grid)" d="M0 0H640V430H0z"/><path d="M105 330L225 240 350 284 495 321" fill="none" stroke="#b96343" stroke-width="1.3" stroke-dasharray="5 5"/><g fill="#f8f7f0" stroke="#b96343" stroke-width="1.5"><circle cx="105" cy="330" r="6"/><circle cx="225" cy="240" r="6"/><circle cx="350" cy="284" r="6"/><circle cx="495" cy="321" r="6"/></g><g fill="#294953" font-family="Georgia,serif" font-size="16"><text x="70" y="362">Hamilton</text><text x="190" y="221">Niagara</text><text x="324" y="315">Buffalo</text><text x="462" y="351">Rochester</text><text x="432" y="92" font-style="italic" fill="#65848b">Lake Ontario</text></g><g stroke="#294953" fill="none" transform="translate(580 45)"><path d="M0 35V0L-5 10M0 0L5 10"/><path d="M-12 22H12" opacity=".5"/></g><text x="576" y="33" fill="#294953" font-size="10" font-family="sans-serif">N</text><text x="24" y="401" fill="#526b6c" font-size="10" letter-spacing="2" font-family="sans-serif">CONNECTED PLACES / A REGIONAL STUDY</text></svg>`;
}
function mapTeaser() {
  return `<section class="mapping-section" id="mapping"><div class="mapping-copy"><p class="eyebrow"><span class="status-dot amber"></span> Next on the map</p><h2>Read the region.<br /><em>Then explore the land.</em></h2><p>Move from regional stories to the places behind them. HeavyMap’s mapping workspace brings parcels, context and the evidence into view.</p><div class="mapping-availability"><span>First geography</span><strong>${esc(mapping.name)}</strong><span class="status-chip">${publishedMapUrl ? "Available now" : "Preparing for launch"}</span></div><a class="text-link" href="${publishedMapUrl ? esc(publishedMapUrl) : "#/mapping"}">${publishedMapUrl ? "Explore Hamilton" : "A look at what’s coming"} ${arrow}</a></div><div class="mapping-art">${atlas()}<span class="map-art-note">Illustrative landscape · not a live map</span></div></section>`;
}
function followBand() {
  return `<section class="follow-band"><div><p class="eyebrow">Good intelligence travels.</p><h2>Keep your regions close.</h2><p>Choose the Desks you want to follow. Read on the web, or receive the regional reporting by email.</p></div><a class="button button-light" href="#/subscribe">Choose your Desks ${arrow}</a></section>`;
}
function home() {
  return `<section class="hero"><div class="hero-copy"><p class="eyebrow"><span class="status-dot"></span> Regional intelligence, in perspective</p><h1>A closer reading<br />of <em>place.</em></h1><p class="hero-description">The stories shaping a region.<br />The land behind the story.</p><p class="hero-detail">Follow industry, investment and change through our regional Desks. Explore the geography with HeavyMap.</p><a class="button" href="#/desks">Find your Desk ${arrow}</a></div><div class="hero-art">${atlas()}<div class="art-index"><span>01 — A connected region</span><span>Reporting + geography</span></div></div></section><div class="edition-strip"><span class="eyebrow">From the Desks</span><a href="#/desks/western-new-york/issue-one"><span class="status-dot"></span> Western New York <span class="strip-muted">/ Issue One</span><strong>$49M for Buffalo R&D. A closure in Niagara Falls. A region in motion.</strong><span aria-hidden="true">→</span></a></div><section class="section desks-section"><div class="section-heading"><div><p class="eyebrow">Reporting, rooted in place</p><h2>The Desks<span class="count">02</span></h2></div><p>Each region has its own story.<br />A dedicated Desk follows the details.</p></div><div class="desk-grid">${desks.map(card).join("")}</div></section><section class="latest-section"><div class="latest-label"><p class="eyebrow">In the reading room</p><h2>Western<br />New York</h2><p>Issue One<br />10 October 2026</p><a class="text-link" href="#/desks/western-new-york/issue-one">Read the issue ${arrow}</a></div><div class="latest-stories">${issue.items
    .slice(0, 3)
    .map(
      (s, i) =>
        `<a class="story-row" href="#/desks/western-new-york/issue-one?story=${s.id}"><span class="story-index">0${i + 1}</span><div><p class="eyebrow">${esc(s.place)} <span class="stage">${label(s.stage)}</span></p><h3>${esc(s.headline)}</h3></div><span aria-hidden="true">↗</span></a>`,
    )
    .join("")}</div></section>${mapTeaser()}${followBand()}`;
}
function directory() {
  return `<section class="page-heading">${crumb("The Desks")}<p class="eyebrow">Two regions. A growing field of view.</p><h1>Find your <em>Desk.</em></h1><p class="page-intro">Regional reporting on investment, industry and change.<br />Choose the places you want to understand.</p></section><section class="section directory"><div class="desk-grid">${desks.map(card).join("")}</div><p class="source-note">Desk coverage and map availability are separate. A region can have a Desk before its mapping workspace is available.</p></section>${followBand()}`;
}
function deskPage(d) {
  return `<section class="desk-hero"><div>${crumb(`<a href="#/desks">The Desks</a><span>/</span>${d.name}`)}<p class="eyebrow">The ${d.province} Desk <span class="dot-separator">/</span> ${d.country}</p><h1>${d.name.replace("New York", "New<br />York")}</h1><p class="desk-line">${d.line}</p><p>${d.description}</p><a class="button" href="#/subscribe?desk=${d.id}">Follow this Desk ${arrow}</a></div><figure><img src="${image(d.image)}" alt="${d.caption}"/><figcaption>${d.caption} · <a href="#/credits">Photograph credits</a></figcaption></figure></section>${d.published ? `<section class="issue-feature"><div><p class="eyebrow">From the archive <span class="dot-separator">/</span> 10 October 2026</p><h2>Issue One</h2><p>${esc(issue.summary)}</p><p class="source-note">Coverage: ${issue.coverage}. This is an archived issue, not a current news update.</p><a class="button" href="#/desks/western-new-york/issue-one">Open the issue ${arrow}</a></div><aside><span class="big-number">01</span><p>Investment & industry<br />In development<br />Corridor news</p><span class="eyebrow">Sources. Stages. Open questions.</span></aside></section>` : `<section class="issue-feature"><div><p class="eyebrow">Across connected places</p><h2>A regional view,<br />across the border.</h2><p>The Niagara–Brant Desk follows the industrial economies of the Niagara Peninsula, Hamilton and Brantford.</p><p>No issue has been included for this Desk in this design preview. Explore the published Desk on Niagara Assembly.</p><a class="text-link" href="https://niagaraassembly.com/desks/ca/on/niagara-brant/">Visit the existing Desk ${arrow}</a></div><aside><span class="big-number">02</span><p>Niagara Peninsula<br />Hamilton<br />Brantford</p></aside></section>`}${d.id === "niagara-brant" ? mapTeaser() : ""}${followBand()}`;
}
function story(s) {
  return `<article class="issue-story" id="${s.id}"><div class="story-meta"><span>${esc(s.place)}</span><span>${date(s.date)}</span></div><div><span class="stage ${s.stage === "completed" ? "complete" : ""}">${label(s.stage)}</span><h3>${esc(s.headline)}</h3><p>${esc(s.note)}</p><details class="source-details"><summary>Sources & context <span>${s.sources.length.toString().padStart(2, "0")} ↗</span></summary><ul>${s.sources.map((source) => `<li><span>${esc(source.kind)} source</span><a href="${esc(source.url)}">${esc(source.title)} ↗</a><small>${esc(source.publisher)}</small></li>`).join("")}</ul></details></div></article>`;
}
function issuePage() {
  return `<div class="issue-page"><header class="issue-heading">${crumb('<a href="#/desks/western-new-york">Western New York</a><span>/</span>Issue One')}<p class="eyebrow">The Western New York Desk <span class="dot-separator">/</span> Archived edition</p><div class="issue-title"><h1>Industry moves.<br /><em>We look closer.</em></h1><div class="issue-seal"><span>Western New York</span><strong>01</strong><span>10 October 2026</span></div></div><p class="page-intro">Reviewed news from the Niagara River to Syracuse: who is investing, building, hiring and starting up.</p><div class="issue-masthead"><span>Issue One · Coverage ${issue.coverage}</span><a href="${issue.original}">Original Niagara Assembly edition ${arrow}</a></div></header><div class="issue-layout"><aside class="issue-toc"><p class="eyebrow">In this issue</p><a href="#/desks/western-new-york/issue-one?section=production">01 Investment & industry</a><a href="#/desks/western-new-york/issue-one?section=developing">02 In development</a><a href="#/desks/western-new-york/issue-one?section=corridor">03 Corridor news</a><div class="editor-note"><p class="eyebrow">A note on the reading</p><p>An announcement is not a completed project. A contract ceiling is not money spent. Each story keeps its stage and its open questions.</p></div><a class="text-link" href="#/subscribe?desk=western-new-york">Follow this Desk ${arrow}</a></aside><div class="issue-body"><p class="archive-note">Selected reporting from the published Issue One, 10 October 2026. Statements and project stages reflect that edition’s source dates; they have not been updated. The complete edition remains on Niagara Assembly.</p>${[
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
  ]
    .map(
      ([key, title, sub]) =>
        `<section id="section-${key}" class="issue-lane"><div class="lane-heading"><h2>${title}</h2><p>${sub}</p></div>${issue.items
          .filter((s) => s.lane === key)
          .map(story)
          .join("")}</section>`,
    )
    .join("")}</div></div></div>${followBand()}`;
}
function mappingPage() {
  return `<section class="page-heading">${crumb("Mapping")}<p class="eyebrow">Geographic intelligence <span class="dot-separator">/</span> Coming into view</p><h1>Land, with<br /><em>possibility.</em></h1><p class="page-intro">A workspace for exploring places, opening the evidence,<br />and deciding what deserves a closer look.</p></section>${mapTeaser()}<section class="section mapping-principles"><div><span class="eyebrow">01 / Explore</span><h3>A regional frame.</h3><p>Land, water, industry and natural constraints, seen together.</p></div><div><span class="eyebrow">02 / Investigate</span><h3>Open the dossier.</h3><p>Parcel context, source-quoted classifications and the methods behind a reading.</p></div><div><span class="eyebrow">03 / Understand</span><h3>Keep the evidence.</h3><p>See what is known, what is missing and where a claim comes from.</p></div></section><section class="launch-note"><span class="status-dot amber"></span><p><strong>Hamilton, Ontario is preparing for launch.</strong><br />The live workspace will appear here when it is published. In the meantime, explore the regional Desks.</p><a class="text-link" href="#/desks">Explore the Desks ${arrow}</a></section>`;
}
function subscribe(preferences = false, selected = "") {
  return `<section class="subscription-page">${crumb(preferences ? "Subscription preferences" : "Follow your regions")}<div class="subscription-layout"><div><p class="eyebrow">Your places. Your perspective.</p><h1>${preferences ? "Your Desks,<br /><em>your choice.</em>" : "Keep your<br />regions <em>close.</em>"}</h1><p class="page-intro">${preferences ? "Choose which regional reporting reaches your inbox." : "Follow one Desk or both. Regional reporting, delivered to your inbox."}</p><p>Western New York and Niagara–Brant are independent subscriptions. The design keeps leaving one Desk separate from leaving all email.</p><a class="text-link" href="${preferences ? "#/subscribe" : "#/preferences"}">${preferences ? "Choose Desks instead" : "Already subscribed? Manage your Desks"} ${arrow}</a></div><form id="desk-form" class="subscribe-form"><p class="form-preview"><span class="status-dot amber"></span> Design preview · No email is sent and no subscription changes are made.</p>${preferences ? `<h2>Find your subscriptions</h2><p>In the connected service, a secure email link will let you manage your choices without a password.</p>` : `<fieldset><legend>Choose your Desks</legend>${desks.map((d) => `<label class="desk-option"><input type="checkbox" name="desks" value="${d.id}" ${selected === d.id ? "checked" : ""}/><span><strong>${d.name}</strong><small>${d.province} · ${d.country}</small></span><span aria-hidden="true">↗</span></label>`).join("")}</fieldset>`}<label class="email-label" for="email">Your email address</label><input id="email" type="email" name="email" placeholder="you@example.com" autocomplete="email" required/><button class="button" type="submit">${preferences ? "Preview secure-link request" : "Preview my selection"} ${arrow}</button><p id="form-result" role="status" aria-live="polite"></p><small class="privacy-note">This preview does not transmit or save your email address. Subscription delivery will be connected separately.</small></form></div></section>`;
}
function about() {
  return `<section class="page-heading">${crumb("Our approach")}<p class="eyebrow">HeavyMap <span class="dot-separator">/</span> A Niagara Assembly product</p><h1>Context makes<br />a place <em>legible.</em></h1><p class="page-intro">Regional reporting and geographic intelligence,<br />with the evidence left in view.</p></section><section class="about-grid section"><div><h2>Two ways to look closer.</h2><p>The Desks follow regional investment, facilities, jobs and new ventures. The mapping workspace brings land and its context into view. A region’s reporting can be available before its map.</p><p>Reporting and mapping share an approach: keep sources close, show the limits, and help readers decide what deserves a closer look.</p><a class="text-link" href="#/desks">Meet the Desks ${arrow}</a></div><div><h3>Say what the source says.</h3><p>Distinguish announcements from completed projects. Keep company statements, public records and reporting attributed.</p><h3>Show the uncertainty.</h3><p>Conflicting figures and missing evidence stay visible. No total should hide a different kind of money or an unknown regional share.</p><h3>Keep the source close.</h3><p>Stories include source links and context. Mapping will carry that same discipline into the parcel dossier.</p></div></section>${followBand()}`;
}
function credits() {
  return `<section class="page-heading credits">${crumb("Credits")}<h1>Sources & <em>credits.</em></h1><h2>Editorial content</h2><p>Headlines and story notes are selected from <a href="${issue.original}">Western New York, Issue One</a>, published by Niagara Assembly on 10 October 2026. Source snapshot: niagaraassembly/site at <code>${issue.sourceCommit.slice(0, 7)}</code>. Original reporting sources remain linked beside each story. No new fact-check or status update is implied.</p><h2>Photography</h2><p><a href="https://commons.wikimedia.org/wiki/File:Buffalo_Grain_Elevators_(1)_(2082986406).jpg">Buffalo Grain Elevators (1)</a> — BriYYZ from Toronto, Canada, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC BY-SA 2.0</a>. Resized source JPEG from Niagara Assembly; displayed with a responsive crop. Photograph from 2007; regional atmosphere, not an image of a reported project.</p><p><a href="https://commons.wikimedia.org/wiki/File:Hamilton_steel_mills.JPG">Hamilton steel mills</a> — THENEWMIKON8ER at English Wikipedia, <a href="https://creativecommons.org/licenses/by/3.0/">CC BY 3.0</a>. Resized source JPEG from Niagara Assembly; displayed with a responsive crop. Archival image, uploaded in 2009.</p><h2>Landscape illustrations</h2><p>Original schematic illustrations for this HeavyMap design preview. They are not geographic data, parcel boundaries or a live mapping service.</p></section>`;
}
if (publishedMapUrl) document.querySelector(".nav-soon").hidden = true;
const content = document.getElementById("content");
document.querySelector(".skip-link").addEventListener("click", (event) => {
  event.preventDefault();
  content.focus();
  content.scrollIntoView({ block: "start" });
});
function render(initial = false) {
  const raw = location.hash.slice(1) || "/";
  const [path, search = ""] = raw.split("?");
  const params = new URLSearchParams(search);
  let html, title;
  const desk = desks.find((d) => path === `/desks/${d.id}`);
  if (path === "/") {
    html = home();
    title = "A closer reading of place";
  } else if (path === "/desks") {
    html = directory();
    title = "The Desks";
  } else if (desk) {
    html = deskPage(desk);
    title = `${desk.name} Desk`;
  } else if (path === "/desks/western-new-york/issue-one") {
    html = issuePage();
    title = "Western New York · Issue One";
  } else if (path === "/mapping") {
    html = mappingPage();
    title = "Mapping · Hamilton";
  } else if (path === "/subscribe" || path === "/preferences") {
    html = subscribe(path === "/preferences", params.get("desk"));
    title =
      path === "/preferences"
        ? "Subscription preferences"
        : "Follow your regions";
  } else if (path === "/about") {
    html = about();
    title = "Our approach";
  } else if (path === "/credits") {
    html = credits();
    title = "Sources & credits";
  } else {
    html = `<section class="page-heading"><p class="eyebrow">A different direction</p><h1>Let’s find your <em>place.</em></h1><p>This page isn’t part of the preview.</p><a class="button" href="#/">Back to HeavyMap →</a></section>`;
    title = "Page not found";
  }
  content.innerHTML = html.replaceAll("↗", arrowIcon);
  document.title = `HeavyMap · ${title}`;
  document.querySelectorAll("[data-nav]").forEach((a) => {
    if (path.startsWith(`/${a.dataset.nav}`))
      a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
  const form = document.getElementById("desk-form");
  if (form)
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const chosen = [
        ...form.querySelectorAll("input[name=desks]:checked"),
      ].map((c) => desks.find((d) => d.id === c.value).name);
      const out = document.getElementById("form-result");
      out.textContent =
        path === "/preferences"
          ? "Preview: a secure-link request would be sent here. No email was sent."
          : chosen.length
            ? `Your preview selection: ${chosen.join(" and ")}. Nothing has been sent or saved.`
            : "Choose at least one Desk to preview your selection.";
    });
  if (!initial) content.focus({ preventScroll: true });
  window.scrollTo(0, 0);
  const target =
    params.get("story") ||
    (params.get("section") ? `section-${params.get("section")}` : null);
  if (target)
    requestAnimationFrame(() =>
      document.getElementById(target)?.scrollIntoView({ block: "start" }),
    );
}
window.addEventListener("hashchange", () => render());
render(true);
