/* Page bodies for every prebuilt URL (spec A section 5.1). Each takes the
 * loaded content (build/content-loader.mjs) and returns
 * { path, title, description, main, bodyClass?, after? }.
 *
 * Edition pages reproduce the original Issue One card and panels with the
 * vendored renderer in ../desk/wny.js (decision 25). Item pages and the rest
 * use HeavyMap's layout (spec B section 10.2). */

import { escapeHtml as esc, safeHttpUrl } from "../desk/escape.js";
import * as wny from "../desk/wny.js";
import { arrow } from "./layout.js";
import { SIGNUP } from "./signup-config.js";
import { MESSAGES } from "./signup.js";

const NA_ORIGIN = "https://niagaraassembly.com";
const ORIGINALS = {
  "western-new-york": `${NA_ORIGIN}/desks/us/ny/western-new-york/`,
  "niagara-brant": `${NA_ORIGIN}/desks/ca/on/niagara-brant/`,
  "western-new-york/issue-one": `${NA_ORIGIN}/desks/us/ny/western-new-york/issue/one/`,
};
/** Archival photograph for each Desk's panorama (credits: /about/credits/). */
const DESK_PHOTOS = {
  "western-new-york": {
    src: "/editorial/buffalo-grain-elevators.jpg",
    width: 669,
    height: 1000,
    alt: "Historic grain elevators along the Buffalo waterfront",
    caption: "Buffalo, New York · Archival regional photograph",
    portrait: true,
  },
  "niagara-brant": {
    src: "/editorial/hamilton-steel-mills.jpg",
    width: 1200,
    height: 900,
    alt: "Hamilton steel mills along the industrial waterfront",
    caption: "Hamilton, Ontario · Archival regional photograph",
    portrait: false,
  },
};
const METHODS_URL = `${NA_ORIGIN}/research/methods/news/`;

/** "10 October 2026", HeavyMap's long date (the edition keeps the original's AP style). */
export const longDate = (iso) =>
  iso
    ? new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(`${iso}T12:00:00Z`))
    : "";

const crumb = (parts) =>
  `<nav class="study-crumb" aria-label="Breadcrumb"><a href="/">HeavyMap</a>${parts
    .map(
      (p) =>
        `<span aria-hidden="true">/</span>${p.href ? `<a href="${esc(p.href)}">${esc(p.text)}</a>` : `<span aria-current="page">${esc(p.text)}</span>`}`,
    )
    .join("")}</nav>`;

/** A HeavyMap news item in the upstream shape the vendored renderer reads. */
export function toWny(item) {
  return {
    id: item.id,
    headline: item.title,
    note: item.summary,
    type: item.event_type,
    lane: item.lane,
    stage: item.stage,
    flags: item.flags,
    date: item.reported_on,
    place: item.place,
    county: item.county,
    districts: item.districts,
    amount: item.money?.amount ?? null,
    amount_type: item.money?.amount_type ?? null,
    ceiling_amount: item.money?.ceiling_amount ?? null,
    regional_amount: item.money?.regional_amount ?? null,
    currency: item.money?.currency ?? null,
    entity_id: item.entity?.id ?? null,
    entity_name: item.entity?.name ?? null,
    jobs_added: item.jobs?.added ?? null,
    jobs_lost: item.jobs?.lost ?? null,
    incentive: item.incentive,
    next_step: item.next_step,
    stage_history: item.stage_history,
    sources: item.sources,
    conflicts: item.conflicts,
    publish_status: "published",
  };
}

const regionOf = (c, id) => c.regions.find((r) => r.id === id);
const editionsOfDesk = (c, regionId) =>
  [...c.editions.values()]
    .filter((e) => e.desk === regionId)
    .sort((a, b) =>
      String(b.published_on).localeCompare(String(a.published_on)),
    );
const newsNewestFirst = (c) =>
  [...c.items.values()]
    .filter((i) => i.type === "news")
    .sort(
      (a, b) =>
        String(b.published_on).localeCompare(String(a.published_on)) ||
        String(b.reported_on).localeCompare(String(a.reported_on)) ||
        a.id.localeCompare(b.id),
    );
const editionHref = (key) => `/editions/${key}/`;
const stageChip = (item) =>
  item.stage
    ? ` <span class="stage">${esc(wny.STAGES[item.stage] ?? item.stage)}</span>`
    : "";

/** The stage key as swatches plus names, never colour words (spec D section 3, D-T2). */
const stageKey = () =>
  `<p class="corridor__key hm-stage-key"><span><span class="hm-swatch hm-swatch--done" aria-hidden="true"></span>Completed</span> <span><span class="hm-swatch hm-swatch--announced" aria-hidden="true"></span>Announced</span> <span><span class="hm-swatch hm-swatch--hollow" aria-hidden="true"></span>In development: not yet built or confirmed</span></p>`;

/* ---- home ---------------------------------------------------------------- */

export function home(c) {
  const news = newsNewestFirst(c);
  const [lead, ...rest] = news;
  const leadEd = lead && c.editions.get(lead.editions?.[0]);
  const leadDesk = leadEd && regionOf(c, leadEd.desk);
  const fromDesks = lead
    ? `<div class="news-layout"><article class="lead-story"><a class="lead-image" href="/read/${esc(lead.id)}/"><img src="/editorial/buffalo-grain-elevators.jpg" alt="Buffalo grain elevators, archival regional photograph" width="669" height="1000"><span>${esc(leadDesk?.name ?? "")} / ${esc(leadEd?.title ?? "")}</span></a><p class="eyebrow">${esc(lead.place ?? "")}${stageChip(lead)}</p><h3><a href="/read/${esc(lead.id)}/">${esc(lead.title)}</a></h3><p>${esc(lead.summary)}</p><a class="text-link" href="/read/${esc(lead.id)}/">Read the story ${arrow}</a><p class="archive-date">From ${esc(leadEd?.title ?? "")} · ${esc(longDate(lead.published_on))}</p></article><div class="news-side">${rest
        .slice(0, 3)
        .map(
          (s, i) =>
            `<article class="dispatch"><span class="dispatch-number">0${i + 2}</span><div><p class="eyebrow">${esc(s.place ?? "")}${stageChip(s)}</p><h3><a href="/read/${esc(s.id)}/">${esc(s.title)}</a></h3><p>${esc(s.summary)}</p><a class="text-link" href="/reader/?item=${encodeURIComponent(s.id)}">Read in Reader ${arrow}</a></div></article>`,
        )
        .join("")}</div></div>`
    : `<p class="study-empty">The first edition is coming. Stories appear here once they're published.</p>`;
  const desks = c.regions
    .map(
      (r, i) =>
        `<article><span class="eyebrow">0${i + 1} / ${esc(r.country === "US" ? "New York, United States" : "Ontario, Canada")}</span><h3>${esc(r.name)}</h3><p>${esc(r.coverage)}</p><div><a class="text-link" href="/desks/${esc(r.slug)}/">Read the Desk ${arrow}</a><a href="/subscribe/?desk=${esc(r.slug)}">Subscribe +</a></div></article>`,
    )
    .join("");
  return {
    path: "/",
    title: "",
    description:
      "Regional reporting on industry and investment, with the evidence in view.",
    main: `<section class="edition-top"><div><span class="eyebrow">The regional edition</span><h1>Places change.<br><em>Keep a closer eye.</em></h1></div><p>Industry, investment and the land behind them. Regional reporting and geographic intelligence, with the evidence left in view.</p></section><div class="return-line" data-resume hidden></div><section class="map-strip" aria-labelledby="map-strip-title"><img class="map-strip-image" src="/map/hamilton-lower-city-wide.webp" width="2000" height="1250" alt="" loading="lazy"><div class="map-strip-copy"><p class="eyebrow">A different view of the region</p><h2 id="map-strip-title">The geography<br>behind the story.</h2></div><a class="map-peek" href="/map/"><span><strong>Hamilton, Ontario</strong><small>In preparation · About the map</small></span><span class="map-peek-arrow" aria-hidden="true">↗</span></a></section><section class="alt-news-section"><div class="alt-section-head"><div><p class="eyebrow">On the record</p><h2>From the Desks</h2></div><a class="text-link" href="/reader/">All news in Reader ${arrow}</a></div>${fromDesks}</section><section class="alt-region-section" id="desks"><div class="alt-section-head"><div><p class="eyebrow">Choose your field of view</p><h2>Your regional Desks</h2></div><a class="text-link" href="/subscribe/">Follow one or both ${arrow}</a></div><div class="region-pair">${desks}</div></section>`,
  };
}

/* ---- desks --------------------------------------------------------------- */

export function deskDirectory(c) {
  const list = c.regions
    .map((r) => {
      const latest = editionsOfDesk(c, r.id)[0];
      return `<article><h2><a href="/desks/${esc(r.slug)}/">${esc(r.name)}</a></h2><p>${esc(r.coverage)}</p><p class="eyebrow">${latest ? `Latest: ${esc(latest.title)} · ${esc(longDate(latest.published_on))}` : "Editions will appear here"}</p></article>`;
    })
    .join("");
  return {
    path: "/desks/",
    title: "The Desks",
    description:
      "HeavyMap's regional Desks: Western New York and Niagara–Brant.",
    main: `<section class="study-directory study-wrap">${crumb([{ text: "The Desks" }])}<div class="study-title-row"><div><p class="eyebrow">Reporting, rooted in place</p><h1>Find your <em>region.</em></h1></div><p>Two Desks, with independent coverage.</p></div><div class="study-region-grid hm-desk-list">${list}</div></section>`,
  };
}

const MAP_STATUS_WORDS = {
  preparing: "in preparation",
  preview: "in preview",
  published: "open",
};

export function deskPage(c, region) {
  const eds = editionsOfDesk(c, region.id);
  const [latest, ...older] = eds;
  const original = ORIGINALS[region.slug];
  const latestHtml = latest
    ? `<section class="hm-desk-latest"><p class="eyebrow">Latest edition</p><h2><a href="${editionHref(latest.key)}">${esc(latest.title)}</a></h2><p>${esc(latest.summary)}</p><p class="archive-date">${esc(longDate(latest.published_on))} · ${latest.items.length} stories</p><a class="text-link" href="${editionHref(latest.key)}">Read the edition ${arrow}</a></section>`
    : `<section class="hm-desk-latest"><p class="eyebrow">Editions</p><h2>Editions will appear here.</h2>${original ? `<p>Until then, this Desk's reporting is on <a href="${esc(original)}">niagaraassembly.com</a>.</p>` : ""}</section>`;
  const archive = older.length
    ? `<section class="hm-desk-archive"><h2>Earlier editions</h2><ul>${older.map((e) => `<li><a href="${editionHref(e.key)}">${esc(e.title)}</a> · ${esc(longDate(e.published_on))}</li>`).join("")}</ul></section>`
    : "";
  const maps = region.geographies.length
    ? `<section class="hm-desk-maps"><h2>Mapping</h2><ul>${region.geographies.map((g) => `<li>${esc(g.name)}: ${esc(MAP_STATUS_WORDS[g.map.status] ?? "not yet mapped")}. <a href="/map/">About the map</a></li>`).join("")}</ul></section>`
    : "";
  const photo = DESK_PHOTOS[region.slug];
  const panorama = photo
    ? `<figure class="desk-panorama${photo.portrait ? " desk-panorama--portrait" : ""}"><img src="${photo.src}" alt="${esc(photo.alt)}" width="${photo.width}" height="${photo.height}"><figcaption><span>${esc(photo.caption)}</span><a href="/about/credits/">Photograph credits</a></figcaption></figure>`
    : "";
  return {
    path: `/desks/${region.slug}/`,
    title: `${region.name} Desk`,
    description: region.coverage,
    main: `<section class="study-desk study-wrap"><div class="study-topline">${crumb([{ text: "The Desks", href: "/desks/" }, { text: region.name }])}</div><header class="desk-masthead"><p class="eyebrow">The ${esc(region.name)} Desk</p><div><h1>${esc(region.name)}</h1><a class="desk-follow-link" href="/subscribe/?desk=${esc(region.slug)}">Follow this Desk ${arrow}</a></div><p class="hm-coverage">${esc(region.coverage)}</p></header>${panorama}${latestHtml}${archive}${maps}<section class="hm-desk-signup" aria-labelledby="desk-signup-title"><h2 id="desk-signup-title">Get each ${esc(region.name)} edition by email.</h2>${signupForm(c, { desk: region.slug, id: "desk-signup" })}</section></section>`,
  };
}

/* ---- edition: the original Issue One, in full ---------------------------- */

export function editionPage(c, ed) {
  const region = regionOf(c, ed.desk);
  const items = wny.byNewest(ed.items.map((id) => toWny(c.items.get(id))));
  const lanes = wny.LANES.map((lane) => {
    const inLane = items.filter((i) => i.lane === lane.id);
    if (!inLane.length) return "";
    const banner = {
      production: "Direct investment, contracts and closures.",
      developing:
        "Announced plans and applications: not yet built or confirmed.",
      corridor:
        "Regional news, not counted in production or investment totals.",
    }[lane.id];
    return `<section class="wny-lane" data-wny-lane="${lane.id}"><h2>${esc(lane.label)}</h2><p class="wny-lane__banner">${banner}</p><ul class="issue-list wny-cards">${inLane.map(wny.renderItem).join("")}</ul></section>`;
  }).join("");
  const panel = (
    key,
    title,
    banner,
    html,
    cls = "wny-money",
    listCls = "wny-money__list",
  ) =>
    html
      ? `<section class="${cls}" data-wny="${key}"><h2>${title}</h2><p class="wny-lane__banner">${banner}</p><ul class="${listCls}">${html}</ul></section>`
      : "";
  const money = wny.investmentLines(items).length
    ? `<section class="wny-money" data-wny="money"><h2>Dollar figures</h2><p class="wny-lane__banner">Amounts stated in this issue’s stories, grouped by kind of money.<br>Contract ceilings are left out.</p><ul class="wny-cells">${wny.renderMoneyCells(wny.moneyCells(items))}</ul><p class="wny-cells__note">Each figure is its own kind of money.</p>${(() => {
        const eq = wny.renderRegionEquation(wny.regionEquation(items));
        return eq ? `<div class="wny-eq">${eq}</div>` : "";
      })()}<ul class="wny-money__groups">${wny.renderInvestments(wny.investmentLines(items), { linkBase: "" })}</ul></section>`
    : "";
  const mentions = (ed.mentions ?? []).map((m) => ({
    ...m,
    role: m.role ?? "",
    organization: m.organization ?? "",
  }));
  const districts = wny.storiesByDistrict(items);
  const span = wny.coverageText(ed.coverage.start, ed.coverage.end);
  const original = ORIGINALS[ed.key];
  return {
    path: editionHref(ed.key),
    title: `${region.name} — ${ed.title}`,
    description: ed.summary,
    bodyClass: "hm-edition",
    main: `<div class="study-edition study-wrap">${crumb([{ text: region.name, href: `/desks/${region.slug}/` }, { text: ed.title }])}<header class="edition-masthead"><p class="eyebrow">The ${esc(region.name)} Desk</p><h1>${esc(ed.title)}</h1><p class="issue-stamp">${esc([wny.apDate(ed.published_on), span ? `News from ${span}` : ""].filter(Boolean).join(" · "))}</p></header>
<div class="hm-desk-publication" data-edition="${esc(ed.key)}">
<p class="wny-lede">${esc(ed.summary)}</p>
<p class="issue-intro">Reviewed news from the Niagara River to Syracuse: who is investing, building, hiring and starting up. Every story has passed Niagara Assembly’s source review, and each one carries our reading of it: how far along it is, and what is still unconfirmed.</p>
<p class="wny-source">Read about the <a href="${METHODS_URL}">news research methods</a>.${original ? ` First published on <a href="${esc(original)}">niagaraassembly.com</a>.` : ""}</p>
${stageKey()}
<details class="wny-allbar"><summary>All articles in this issue <span class="wny-allbar__count">${items.length} ${items.length === 1 ? "article" : "articles"}</span></summary><ul class="issue-list">${items.map(wny.renderCompact).join("")}</ul></details>
${panel("coming", "Coming up", "Dated next steps in this issue’s stories, soonest first.", wny.renderComingUp(items))}
${money}
${panel("jobs", "Jobs", "Job figures as the sources state them. Where they disagree, the story shows each one.", wny.renderJobs(items))}
${panel("support", "Public support", "Tax credits and other public awards tied to these stories. Kept apart from the dollar figures.", wny.renderIncentives(items))}
${lanes}
${panel("mentions", "Mentions", "People named in this issue’s stories, with the role and organization the sources give.", wny.renderMentions(mentions), "wny-companies", "wny-company-list")}
${districts.length ? `<section class="wny-companies" data-wny="districts"><h2>By district</h2><p class="wny-lane__banner">Districts covering the places in this issue’s stories, matched by town rather than exact address. <a href="${METHODS_URL}#districts">How districts are matched</a>.</p><ul class="wny-districts">${wny.renderDistricts(districts)}</ul></section>` : ""}
<p class="wny-method">How this news is found, checked and approved: <a href="${METHODS_URL}">news research methods</a>.</p>
<section class="hm-edition-signup" aria-labelledby="edition-signup-title"><h2 id="edition-signup-title">Get each ${esc(region.name)} edition by email.</h2>${signupForm(c, { desk: region.slug, id: "edition-signup" })}</section>
</div></div>`,
  };
}

/* ---- item page: same information, HeavyMap layout ------------------------ */

const money = (item) => {
  const m = item.money ?? {};
  const rows = [];
  const amount = wny.formatAmount(m.amount, m.currency);
  if (amount)
    rows.push([
      "Amount",
      `${amount}${m.amount_type ? ` · ${c_words(m.amount_type)}` : ""}`,
    ]);
  const ceiling = wny.formatAmount(m.ceiling_amount, m.currency);
  if (ceiling)
    rows.push([
      "Contract ceiling",
      `${ceiling} (not money committed or spent)`,
    ]);
  return rows;
};
const c_words = (s) => wny.words(s);

function itemFacts(item) {
  const rows = [...money(item)];
  if (item.jobs?.added != null)
    rows.push(["Jobs added", String(item.jobs.added)]);
  if (item.jobs?.lost != null) rows.push(["Jobs lost", String(item.jobs.lost)]);
  if (item.incentive)
    rows.push([
      "Public support",
      wny.incentiveText(item.incentive, item.money?.currency),
    ]);
  if (item.next_step?.text)
    rows.push([
      "Next step",
      `${item.next_step.text}${item.next_step.date ? ` (${wny.partialDate(item.next_step.date)})` : ""}`,
    ]);
  if (item.county) rows.push(["County", item.county]);
  const districts = wny.districtText(item.districts);
  if (districts) rows.push(["Districts", districts]);
  if (!rows.length) return "";
  return `<dl class="hm-facts">${rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>`;
}

function itemHistory(item) {
  if (!item.stage_history?.length) return "";
  return `<section class="hm-stage-history"><h2>Stage history</h2><ol>${item.stage_history
    .map((h) => {
      const url = safeHttpUrl(h.url);
      const label = esc(wny.STAGES[h.stage] ?? h.stage);
      return `<li>${esc(wny.partialDate(h.date))}: ${url ? `<a href="${esc(url)}" rel="noopener">${label}</a>` : label}</li>`;
    })
    .join("")}</ol></section>`;
}

function itemFlags(item) {
  if (!item.flags?.length && !item.conflicts?.length) return "";
  const flags = (item.flags ?? []).map((f) => {
    const t = wny.flagText(f);
    return `<li class="wny-flag wny-flag--${esc(t.tone)}">${esc(t.text)}</li>`;
  });
  const conflicts = (item.conflicts ?? []).map(
    (cf) =>
      `<li><strong>${esc(wny.words(cf.field))}:</strong> ${(cf.values ?? [])
        .map((v) => {
          const url = safeHttpUrl(v.url);
          return `${esc(v.value)} (${url ? `<a href="${esc(url)}" rel="noopener">${esc(v.source)}</a>` : esc(v.source)})`;
        })
        .join("; ")}</li>`,
  );
  return `<section class="hm-open-questions"><h2>What is unconfirmed</h2>${flags.length ? `<ul class="wny-flags">${flags.join("")}</ul>` : ""}${conflicts.length ? `<h3>Where sources disagree</h3><ul class="hm-conflicts">${conflicts.join("")}</ul>` : ""}</section>`;
}

function itemSources(item) {
  if (!item.sources?.length) return "";
  return `<section class="standalone-sources" id="sources"><p class="eyebrow">The evidence behind the story</p><h2>Sources</h2>${item.sources
    .map((s, i) => {
      const url = safeHttpUrl(s.url);
      const kind = wny.SOURCE_KINDS[s.kind] ?? "";
      const inner = `<span class="source-sequence">${String(i + 1).padStart(2, "0")}</span><div><span class="eyebrow">${esc(s.publisher ?? "")}${kind ? ` <span class="dot-separator">/</span> ${esc(kind)}` : ""}</span><strong>${esc(s.title ?? s.publisher ?? "Source")}</strong></div>`;
      return url
        ? `<a href="${esc(url)}" rel="noopener">${inner}</a>`
        : `<div>${inner}</div>`;
    })
    .join("")}</section>`;
}

export function itemPage(c, item) {
  const eds = (item.editions ?? [])
    .map((k) => c.editions.get(k))
    .filter(Boolean);
  const ed = eds[0];
  const region = ed ? regionOf(c, ed.desk) : regionOf(c, item.regions?.[0]);
  const parts = region
    ? [{ text: region.name, href: `/desks/${region.slug}/` }]
    : [];
  if (ed)
    parts.push({
      text: ed.title,
      href: `${editionHref(ed.key)}#wny-${item.id}`,
    });
  parts.push({ text: c.labels.types[item.type] ?? item.type });
  const meta = [
    wny.typeLabel(item.event_type),
    item.reported_on ? `Reported ${longDate(item.reported_on)}` : "",
    item.place,
    item.entity?.name,
  ]
    .filter(Boolean)
    .map(esc)
    .join(" · ");
  const alsoIn = eds.length
    ? `<p class="hm-also-in">In ${eds.map((e) => `<a href="${editionHref(e.key)}">${esc(regionOf(c, e.desk)?.name ?? "")} ${esc(e.title)}</a>`).join(", ")}</p>`
    : "";
  return {
    path: `/read/${item.id}/`,
    title: item.title,
    description: item.summary,
    main: `<article class="standalone-reading study-wrap" data-item-id="${esc(item.id)}">${crumb(parts)}<header class="standalone-heading"><p class="eyebrow">${esc(region?.name ?? "HeavyMap")}${ed ? ` <span class="dot-separator">/</span> ${esc(ed.title)}` : ""}${stageChip(item)}</p><h1>${esc(item.title)}</h1><p class="hm-item-meta">${meta}</p><div class="hm-reading-tools" data-reading-tools hidden><button type="button" data-mark-read aria-pressed="false">Mark as read</button><button type="button" data-remove-history>Remove from history</button><p class="hm-updated" data-updated hidden>Updated since you read it</p><p class="hm-visually-hidden" role="status" data-reading-status></p></div></header><div class="hm-reading-body"><p class="standalone-summary">${esc(item.summary)}</p>${itemFacts(item)}${itemFlags(item)}${itemHistory(item)}${itemSources(item)}<p class="hm-item-tools"><a class="text-link" href="/reader/?item=${encodeURIComponent(item.id)}">Open in Reader ${arrow}</a></p>${alsoIn}<p class="hm-provenance">First published ${esc(longDate(item.published_on))}${ed ? ` in ${esc(region?.name ?? "")} ${esc(ed.title)}` : ""}. Story notes are as published; no later status update is implied.</p><span class="reading-end" aria-hidden="true"></span></div></article>`,
  };
}

export function tombstone(c, item) {
  return {
    path: `/read/${item.id}/`,
    title: `${item.title} (withdrawn)`,
    description: "This item has been withdrawn.",
    main: `<article class="standalone-reading study-wrap">${crumb([{ text: "Withdrawn item" }])}<h1>${esc(item.title)}</h1><p>This item was withdrawn${item.retired_on ? ` on ${esc(longDate(item.retired_on))}` : ""}.${item.retired_reason ? ` ${esc(item.retired_reason)}` : ""}</p>${item.replaced_by ? `<p><a href="/read/${esc(item.replaced_by)}/">Read the replacement</a></p>` : ""}</article>`,
  };
}

/* ---- Reader shell: a working list without JavaScript; spec C adds the rest */

export function readerPage(c) {
  const list = newsNewestFirst(c)
    .map((i) => {
      const ed = c.editions.get(i.editions?.[0]);
      return `<li><a class="library-item" href="/read/${esc(i.id)}/" data-id="${esc(i.id)}"><span>${esc(ed ? `${regionOf(c, ed.desk)?.name} · ${ed.title}` : "HeavyMap")}<i>${esc(c.labels.types[i.type])}</i></span><strong>${esc(i.title)}</strong><small>${esc(longDate(i.published_on))}</small></a></li>`;
    })
    .join("");
  const kinds = ["news", "finding", "documentation", "editorial", "all"];
  const kindLabel = { ...c.labels.types, all: "All" };
  const regionOptions = [
    `<option value="all">All regions</option>`,
    ...c.regions.map(
      (r) => `<option value="${esc(r.slug)}">${esc(r.name)}</option>`,
    ),
    `<option value="heavymap">HeavyMap</option>`,
  ].join("");
  return {
    path: "/reader/",
    title: "Reader",
    description:
      "Every HeavyMap story in one place, with your place kept in this browser.",
    bodyClass: "hm-reader",
    main: `<section class="reader-page study-wrap" data-reader><header class="reader-heading"><div><p class="eyebrow">A single door into HeavyMap</p><h1>Reader</h1></div><p>News first; findings, editorials and documentation when you want to go deeper. Your place is remembered in this browser only.</p></header><div class="reader-types" role="group" aria-label="Material" data-reader-controls hidden>${kinds.map((k) => `<button type="button" data-kind="${k}" aria-pressed="false">${esc(kindLabel[k])}</button>`).join("")}</div><button type="button" class="reader-library-toggle" id="reader-library-toggle" aria-expanded="true" aria-controls="reader-library" hidden>Browse &amp; filter <span aria-hidden="true">−</span></button><div class="reader-workspace"><aside id="reader-library" class="reader-library" aria-label="Reader library"><div data-reader-controls hidden><div class="reader-filter-row"><label for="reader-region">Region</label><select id="reader-region">${regionOptions}</select></div><label class="hm-visually-hidden" for="reader-search">Search the library</label><input id="reader-search" type="search" maxlength="120" placeholder="Search the library…" autocomplete="off"><label class="unread-option"><input id="reader-unread" type="checkbox"> Unread only</label></div><p class="hm-reader-notice" data-reader-notice hidden></p><div class="library-count" id="library-count" role="status"></div><ol id="reader-list" class="reader-list">${list}</ol><div class="reader-storage" data-reader-controls hidden><p data-storage-note>Your place and filters stay on this device.</p><button type="button" data-forget>Forget reading history</button><div data-forget-confirm hidden><p>Forget what you've read on this device? Your theme stays as it is.</p><button type="button" data-forget-yes>Forget</button> <button type="button" data-forget-no>Cancel</button></div></div></aside><div class="reader-document" data-reader-document><div class="document-navigation" hidden><button type="button" id="reader-prev">← Previous</button><span id="reader-position"></span><button type="button" id="reader-next">Next →</button></div><div id="reader-scroll" class="reader-scroll" tabindex="-1" aria-label="Reading pane"><div id="reader-article"><div class="reader-empty"><p class="eyebrow">Start here</p><h2>Choose a story from the list.</h2><p class="reader-lede">News first; findings, editorials and documentation when you want to go deeper. Your place is remembered in this browser only.</p></div></div></div></div></div></section>`,
  };
}

/* ---- map introduction (decision 17, spec F section 2) -------------------- */

export function mapIntro() {
  // Decision 67: a still map of Hamilton's lower city and harbourfront, rendered once from OpenStreetMap data.
  return {
    path: "/map/",
    title: "The map",
    description:
      "HeavyMap's map of Hamilton, Ontario, in preparation: the lower city and harbourfront.",
    bodyClass: "hm-map-intro",
    main: `<figure class="hm-map-figure"><picture><source media="(max-width: 700px)" srcset="/map/hamilton-lower-city-tall.webp" width="900" height="1100"><img src="/map/hamilton-lower-city-wide.webp" width="2000" height="1250" alt="Map of Hamilton's lower city and harbourfront: the west harbour and Bayfront Park, the North End and its piers, downtown, Strathcona, Durand and Corktown below the escarpment, and the industrial bayfront to the east. No HeavyMap data is shown."></picture><figcaption><span>Hamilton, Ontario · lower city and harbourfront</span><span>© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a></span></figcaption></figure><section class="hm-map-story" aria-labelledby="map-story-title"><h1 id="map-story-title">The map behind the news</h1><p>HeavyMap's Desks report what is being built, bought, funded and closed across Western New York and Niagara–Brant. The map is where that reporting will meet the land itself.</p><p>We are preparing a working map of Hamilton, Ontario, parcel by parcel. For each parcel it will show what public records say, where each fact comes from, how it was matched to the land, and where the records are silent or disagree. When a source can't support a statement, the map will say so rather than guess.</p><p>It isn't open yet. Each place opens only after its data has been checked and screened.</p><p>Until then, this is Hamilton's lower city and harbourfront as OpenStreetMap draws it. Nothing on it is HeavyMap data yet.</p><p><a class="button" href="/desks/">Read the latest editions ${arrow}</a></p></section>`,
    after: `<nav class="map-dock" aria-label="Map"><span class="wordmark">HeavyMap<span aria-hidden="true">◒</span></span><div><strong>Hamilton, Ontario</strong><span>Lower city and harbourfront · in preparation</span></div><a href="/" data-back-to-reading>Back to reading ↑</a></nav>`,
  };
}

/* ---- per-Desk signup form (spec E section 4) ------------------------------ */

/** With a configured form, inputs carry the Google entry ids so it also posts without JavaScript. */
export function signupForm(
  c,
  { desk = null, id = "signup", config = SIGNUP } = {},
) {
  const on = Boolean(config.action);
  const n = (field) => (on ? config.entries[field] : field);
  const desks = c.regions.filter((r) => r.desk.status === "published");
  const boxes = desks
    .map(
      (r) =>
        `<label><input type="checkbox" name="${esc(n("desks"))}" value="${esc(r.slug)}" data-field="desk"${r.slug === desk ? " checked data-default" : ""}${on ? "" : " disabled"}> ${esc(r.name)}</label>`,
    )
    .join("");
  return `<form class="hm-signup" data-signup id="${esc(id)}"${on ? ` action="${esc(config.action)}" method="post" target="_blank"` : ""} novalidate><fieldset class="hm-signup-desks" data-desk-boxes><legend>Desks to follow</legend>${boxes}</fieldset><label for="${esc(id)}-name">Name</label><input id="${esc(id)}-name" name="${esc(n("name"))}" data-field="name" autocomplete="name" required${on ? "" : " disabled"}><label for="${esc(id)}-email">Email</label><input id="${esc(id)}-email" name="${esc(n("email"))}" data-field="email" type="email" autocomplete="email" required${on ? "" : " disabled"}><button type="submit" class="button"${on ? "" : " disabled"}>Subscribe</button><p class="hm-signup-status" role="status">${on ? "" : esc(MESSAGES.closed)}</p><p class="hm-signup-note">Each Desk sends its own edition. Every email has a link to stop that Desk only.</p></form>`;
}

/* ---- subscriptions (spec E) ------------------------------------------------ */

export function subscribePage(c) {
  const desksList = `<ul class="hm-subscribe-desks">${c.regions
    .filter((r) => r.desk.status === "published")
    .map(
      (r) =>
        `<li><h2>${esc(r.name)}</h2><p>Get each ${esc(r.name)} edition by email.</p></li>`,
    )
    .join("")}</ul>`;
  return {
    path: "/subscribe/",
    title: "Follow your regions",
    description: "Get each Desk's editions by email, one Desk at a time.",
    main: `<section class="study-wrap hm-subscribe">${crumb([{ text: "Follow your regions" }])}<h1>Follow your <em>regions.</em></h1><p>Each Desk sends its own edition. Follow one or both; you can stop either one at any time from its emails.</p>${desksList}${signupForm(c, { id: "signup" })}</section>`,
  };
}

export function preferencesPage(c) {
  return {
    path: "/preferences/",
    title: "Email preferences",
    description: "How to choose which Desk emails you get.",
    main: `<section class="study-wrap hm-preferences">${crumb([{ text: "Email preferences" }])}<h1>Your Desks, <em>your choice.</em></h1><h2>Stop one Desk</h2><p>Every Desk email has a “Stop &lt;Desk&gt; emails” link above the footer. It stops that Desk only; your other Desk stays as it is.</p><h2>Stop everything</h2><p>The “Unsubscribe” link at the very bottom of any email stops every HeavyMap and Niagara Assembly email.</p><h2>Add a Desk</h2><ul>${c.regions.map((r) => `<li><a href="/subscribe/?desk=${esc(r.slug)}">Follow ${esc(r.name)}</a></li>`).join("")}</ul><p>HeavyMap stores nothing about your subscriptions in this browser.</p></section>`,
  };
}

/* ---- about ----------------------------------------------------------------- */

export function aboutPage(c) {
  const docs = [...c.items.values()].filter((i) => i.type === "documentation");
  return {
    path: "/about/",
    title: "About",
    description: "What HeavyMap is and how it works.",
    main: `<section class="study-wrap hm-about">${crumb([{ text: "About" }])}<h1>About <em>HeavyMap.</em></h1><p>HeavyMap follows industry and investment across Western New York and Niagara–Brant. Its regional Desks publish reviewed news with the sources, stages and open questions left in view, and its map of Hamilton is in preparation.</p>${docs.length ? `<h2>Documentation</h2><ul>${docs.map((d) => `<li><a href="/read/${esc(d.id)}/">${esc(d.title)}</a></li>`).join("")}</ul>` : ""}<p><a href="/about/credits/">Sources and credits</a></p></section>`,
  };
}

export function creditsPage(c) {
  const snap = c.snapshot?.inputs?.find(
    (i) => i.repo === "niagaraassembly/site",
  );
  return {
    path: "/about/credits/",
    title: "Sources and credits",
    description:
      "Where HeavyMap's reporting, photographs and map data come from.",
    main: `<section class="study-wrap page-heading credits">${crumb([{ text: "About", href: "/about/" }, { text: "Credits" }])}<h1>Sources &amp; <em>credits.</em></h1><h2>Editorial content</h2><p>Western New York Issue One was first published by Niagara Assembly's Western New York Desk on 10 October 2026${snap ? ` (source snapshot: niagaraassembly/site at <code>${esc(snap.commit.slice(0, 7))}</code>)` : ""}. Each story links its original sources.</p><h2>Photography</h2><p><a href="https://commons.wikimedia.org/wiki/File:Buffalo_Grain_Elevators_(1)_(2082986406).jpg">Buffalo Grain Elevators (1)</a>, BriYYZ from Toronto, Canada, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC BY-SA 2.0</a>. Photograph from 2007; regional atmosphere, not an image of a reported project.</p><p><a href="https://commons.wikimedia.org/wiki/File:Hamilton_steel_mills.JPG">Hamilton steel mills</a>, THENEWMIKON8ER at English Wikipedia, <a href="https://creativecommons.org/licenses/by/3.0/">CC BY 3.0</a>. Archival image, uploaded in 2009.</p><h2>Flags</h2><p>The theme picker's flags are drawn by HeavyMap from each flag's official specification: the United States (Executive Order 10834), Canada (the National Flag of Canada's specifications; leaf geometry as in the public-domain Wikimedia Commons file) and Japan (Act on National Flag and Anthem, 1999). National flags are public-domain symbols.</p><h2>Map</h2><p>Map data © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>, available under the Open Database License. The Hamilton map image was drawn by HeavyMap from <a href="https://protomaps.com">Protomaps</a>’ build of that data dated 9 November 2026.</p></section>`,
  };
}

export function notFound() {
  return {
    path: "/404.html",
    title: "Not found",
    description: "This page doesn't exist.",
    main: `<section class="study-wrap hm-not-found"><h1>Not <em>found.</em></h1><p>This page doesn't exist, or it has moved.</p><ul><li><a href="/">Home</a></li><li><a href="/desks/">The Desks</a></li><li><a href="/reader/">Reader</a></li></ul></section>`,
  };
}

/** The small catalogue the client needs for history, the cue and the Reader. */
export function clientCatalogue(c) {
  const slugOf = (id) => regionOf(c, id)?.slug ?? "heavymap";
  return {
    regions: c.regions.map((r) => ({ slug: r.slug, name: r.name })),
    editions: Object.fromEntries(
      [...c.editions.values()].map((e) => [
        e.key,
        {
          title: e.title,
          deskName: regionOf(c, e.desk)?.name ?? "",
          href: editionHref(e.key),
          items: e.items,
        },
      ]),
    ),
    items: [...c.items.values()].map((i) => ({
      id: i.id,
      type: i.type,
      title: i.title,
      summary: i.summary,
      regions: (i.regions ?? []).map((r) =>
        r === "heavymap" ? "heavymap" : slugOf(r),
      ),
      place: i.place ?? null,
      entity: i.entity?.name ?? null,
      publisher:
        i.sources
          ?.map((s) => s.publisher)
          .filter(Boolean)
          .join(" ") ?? "",
      published_on: i.published_on,
      updated_on: i.updated_on ?? null,
      edition: i.editions?.[0] ?? null,
    })),
    retired: [...c.retired.keys()],
  };
}

/** Every page of the public site, in URL-table order (spec A section 5.1). */
export function allPages(c) {
  return [
    home(c),
    deskDirectory(c),
    ...c.regions
      .filter((r) => r.desk.status === "published")
      .map((r) => deskPage(c, r)),
    ...[...c.editions.values()].map((ed) => editionPage(c, ed)),
    ...[...c.items.values()].map((it) => itemPage(c, it)),
    ...[...c.retired.values()].map((it) => tombstone(c, it)),
    readerPage(c),
    mapIntro(c),
    subscribePage(c),
    preferencesPage(c),
    aboutPage(c),
    creditsPage(c),
    notFound(c),
  ];
}
