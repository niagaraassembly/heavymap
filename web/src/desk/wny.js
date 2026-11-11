/* Vendored from niagaraassembly/site assets/js/wny.js at 9522b3e
 * (lines 15-525, 971-974, 987-1162, 1220-1238): the pure rendering of the original
 * Issue One card and panels (decision 25: edition pages mirror the original).
 * HeavyMap changes, all marked "HeavyMap:":
 *   - labels come from content/vocab/labels.json (one source with the build check);
 *   - headlines link to /read/<id>/ (decision 25), not to the first source;
 *   - district names are plain text (the original linked to an All-articles filter page HeavyMap doesn't have);
 *   - the sign-up import is dropped (spec E replaces it).
 * DOM mounting, the ticker, county band and corridor SVG were not copied. */
import { escapeHtml, safeHttpUrl } from './escape.js';
/* HeavyMap: labels from content/vocab/labels.json; sign-up import dropped. */
import labels from '../../../content/vocab/labels.json' with { type: 'json' };

export const RECENT_LIMIT = 5;
export const PUBLISHABLE = new Set(['approved', 'published']);

/* Sections, by lane, in page order. The front page's section headings must
   match these labels (tested); lane "excluded" has no section and never
   renders. */
export const LANES = labels.lane_order.map((id) => ({ id, label: labels.lanes[id] })); // HeavyMap

export const STAGES = labels.stages; // HeavyMap

/* Flag types: a short name (filters; the methods page uses the same names)
   and one fixed sentence (story cards). {d} is the flag's detail in words. */
export const FLAGS = labels.flags; // HeavyMap

const TYPE_LABELS = labels.event_types; // HeavyMap

export const SOURCE_KINDS = labels.source_kinds; // HeavyMap

/* The corridor runs from the Niagara River to Syracuse, west to east.
   Longitudes are the line's ends; towns are the ticks drawn on it.
   Niagara Falls is not labelled: it is 0.17° from Buffalo, and the two
   names collide at every width. Its stories are still marked. */
export const CORRIDOR = {
  west: -79.1,
  east: -76.0,
  towns: [
    { name: 'Buffalo', lng: -78.88 },
    { name: 'Rochester', lng: -77.61 },
    { name: 'Syracuse', lng: -76.15 },
  ],
};

export const words = (snake) => String(snake ?? '').replace(/_/g, ' ').trim();

export function typeLabel(type) {
  return TYPE_LABELS[type] ?? 'Update';
}

export function laneOf(item) {
  return LANES.some((l) => l.id === item.lane) ? item.lane : null;
}

/** Approved or published, in a known lane. Anything else stays off the page. */
export function publishable(items) {
  return (items ?? []).filter((item) => PUBLISHABLE.has(item.publish_status) && laneOf(item));
}

/** Newest first; items sharing a date keep their order in the data. */
export function byNewest(items) {
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => String(b.item.date ?? '').localeCompare(String(a.item.date ?? '')) || a.index - b.index)
    .map(({ item }) => item);
}

/** The reader's sentence for one flag; unknown types fall back to their own words. */
export function flagText(flag) {
  const rule = FLAGS[flag.type];
  const d = words(flag.detail);
  if (!rule) return { tone: 'plain', text: words(flag.type) };
  const text = rule.text
    .replace('{d}', d)
    .replace('{D}', d.charAt(0).toUpperCase() + d.slice(1));
  return { tone: rule.tone, text };
}

/** Figures for the money list: production items with a stated amount.
    amount is money committed or stated; a contract ceiling is a separate
    field (ceiling_amount) and never enters the list or a total. */
export function moneyLines(items) {
  return items.filter((i) => i.lane === 'production' && formatAmount(i.amount, i.currency));
}

/* Kinds of money, from na-research's amount_type. Kinds are totalled
   separately and never added together: a purchase price is not money spent
   in the region, and a reported award is not money committed. An unknown
   amount_type falls into "Other amounts" rather than vanishing. */
export const MONEY_KINDS = [
  { id: 'investment', label: 'Investment', types: ['investment'] },
  /* Kept apart (na-research, 2026-10-10): obligated is government money
     committed; award is the value a company reports, e.g. SRC's $37M. */
  { id: 'committed', label: 'Contracts: money committed', types: ['obligated'] },
  { id: 'awards', label: 'Awards as reported', types: ['award'] },
  { id: 'deals', label: 'Deals', types: ['transaction'] },
  { id: 'grants', label: 'Grants', types: ['grant'] },
  { id: 'proposed', label: 'Proposed', types: ['proposed'] },
  { id: 'charges', label: 'Charges', types: ['charge'] },
  { id: 'other', label: 'Other amounts', types: [] },
];

export function moneyKind(item) {
  return (MONEY_KINDS.find((k) => k.types.includes(item.amount_type)) ?? MONEY_KINDS.at(-1)).id;
}

/** The money list grouped by kind, in MONEY_KINDS order, empty kinds left out. */
export function moneyGroups(lines) {
  return MONEY_KINDS.map((kind) => ({ ...kind, lines: lines.filter((i) => moneyKind(i) === kind.id) }))
    .filter((group) => group.lines.length);
}

/* Stages whose amounts are coloured: done (green) and only announced
   (dark yellow). Every other stage stays in ink. */
export const AMOUNT_TONES = { completed: 'done', announced: 'announced' };

const toneClass = (stage) => (AMOUNT_TONES[stage] ? ` wny-amount--${AMOUNT_TONES[stage]}` : '');

/** Sum of the money list, one total per currency (never mixed). */
export function moneyTotals(lines) {
  const totals = new Map();
  for (const i of lines) {
    const currency = i.currency || 'USD';
    totals.set(currency, (totals.get(currency) ?? 0) + Number(i.amount));
  }
  return [...totals].map(([currency, amount]) => ({ currency, amount }));
}

/** Each currency's total split by stage, stages in vocabulary order. */
export function moneyByStage(lines) {
  return moneyTotals(lines).map(({ currency, amount }) => {
    const parts = Object.keys(STAGES).concat('').map((stage) => ({
      stage,
      amount: lines.filter((i) => (i.currency || 'USD') === currency && (i.stage || '') === stage)
        .reduce((sum, i) => sum + Number(i.amount), 0),
    })).filter((part) => part.amount > 0);
    return { currency, amount, parts };
  });
}

/** Position along the corridor, 0 (Niagara River) to 1 (Syracuse); null if off the line. */
export function corridorPosition(lng, corridor = CORRIDOR) {
  if (typeof lng !== 'number' || Number.isNaN(lng)) return null;
  if (lng < corridor.west || lng > corridor.east) return null;
  return (lng - corridor.west) / (corridor.east - corridor.west);
}

/** "$49M", "$20.7B", "C$500K". Empty when there is no amount. */
export function formatAmount(amount, currency) {
  const n = Number(amount);
  if (!amount || !Number.isFinite(n) || n <= 0) return '';
  const symbol = currency === 'CAD' ? 'C$' : currency === 'USD' || !currency ? '$' : `${currency} `;
  const [div, suffix] = n >= 1e9 ? [1e9, 'B'] : n >= 1e6 ? [1e6, 'M'] : n >= 1e3 ? [1e3, 'K'] : [1, ''];
  const value = n / div;
  return `${symbol}${Number.isInteger(value) ? value : value.toFixed(1).replace(/\.0$/, '')}${suffix}`;
}

export function formatDate(iso) {
  const d = new Date(`${iso}T12:00:00`);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

/** Companies named in approved items, most-mentioned first, then by name. */
export function companiesInNews(items, entities) {
  const byId = new Map((entities ?? []).map((e) => [e.id, e]));
  const counts = new Map();
  for (const item of items) {
    if (!item.entity_id) continue;
    counts.set(item.entity_id, (counts.get(item.entity_id) ?? 0) + 1);
  }
  return [...counts]
    .map(([id, count]) => ({ ...(byId.get(id) ?? { id, name: items.find((i) => i.entity_id === id)?.entity_name }), count,
      first: items.find((i) => i.entity_id === id)?.id }))
    .filter((e) => e.name)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/* ---- rendering ------------------------------------------------------------ */

export const firstSource = (item) =>
  (item.sources ?? []).map((s) => ({ ...s, url: safeHttpUrl(s.url) })).find((s) => s.url);

function titleHtml(item) {
  // HeavyMap: the headline opens the item page (decision 25); sources stay listed on the card.
  return `<a class="issue-list__title" href="/read/${encodeURIComponent(item.id)}/">${escapeHtml(item.headline)}</a>`;
}

function metaHtml(item) {
  return [typeLabel(item.type), formatDate(item.date), item.place, item.entity_name]
    .filter(Boolean).map(escapeHtml).join(' · ');
}

function stageHtml(item) {
  const label = STAGES[item.stage];
  return label ? `<span class="wny-stage">${escapeHtml(label)}</span>` : '';
}

function flagsHtml(item) {
  const flags = (item.flags ?? []).map(flagText);
  const chips = flags.filter((f) => f.tone !== 'plain');
  const plain = flags.filter((f) => f.tone === 'plain');
  return (chips.length
    ? `<ul class="wny-flags">${chips.map((f) =>
      `<li class="wny-flag wny-flag--${f.tone}">${escapeHtml(f.text)}</li>`).join('')}</ul>`
    : '')
    + (plain.length
      ? `<p class="wny-flags__plain">${plain.map((f) => escapeHtml(f.text.replace(/\.?$/, '.'))).join(' ')}</p>`
      : '');
}

function conflictsHtml(item) {
  return (item.conflicts ?? []).map((c) => {
    const rows = (c.values ?? []).map((v) => {
      const url = safeHttpUrl(v.url);
      const source = v.source
        ? (url ? `<a href="${escapeHtml(url)}" rel="noopener">${escapeHtml(v.source)}</a>` : escapeHtml(v.source))
        : 'source not named';
      return `<li><span class="wny-conflict__value">${escapeHtml(v.value)}</span>`
        + `<span class="wny-conflict__source">${source}</span></li>`;
    });
    return rows.length
      ? `<div class="wny-conflict"><p class="wny-conflict__head">Sources disagree on ${escapeHtml(words(c.field))}</p><ul>${rows.join('')}</ul></div>`
      : '';
  }).join('');
}

function sourcesHtml(item) {
  const links = (item.sources ?? []).map((s) => {
    const url = safeHttpUrl(s.url);
    const name = s.publisher || s.title || 'Source';
    const kind = SOURCE_KINDS[s.kind] ? ` (${SOURCE_KINDS[s.kind]})` : '';
    return (url ? `<a href="${escapeHtml(url)}" rel="noopener">${escapeHtml(name)}</a>` : escapeHtml(name)) + escapeHtml(kind);
  });
  return links.length ? `<p class="wny-item__via">${links.length > 1 ? 'Sources' : 'Source'}: ${links.join('; ')}</p>` : '';
}

/** "2027" / "June 2027" / "Oct. 31, 2026" from YYYY, YYYY-MM or YYYY-MM-DD. */
export function partialDate(value) {
  const v = String(value ?? '');
  if (/^\d{4}$/.test(v)) return v;
  const m = v.match(/^(\d{4})-(\d{2})$/);
  if (m) return `${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][Number(m[2]) - 1] ?? ''} ${m[1]}`.trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? apDate(v) : '';
}

/* Legislative districts, from Census lines for the places a story names. */
const CHAMBERS = [
  { id: 'congress', label: 'Congress', name: (d) => `NY-${d}` },
  { id: 'senate', label: 'State Senate', name: (d) => `Senate ${d}` },
  { id: 'assembly', label: 'Assembly', name: (d) => `Assembly ${d}` },
];

/** "NY-26 · Senate 63, 61 · Assembly 149, 141 (Buffalo)". */
export function districtText(districts) {
  if (!districts) return '';
  const parts = CHAMBERS.filter((c) => districts[c.id]?.length)
    .map((c) => (c.id === 'congress'
      ? districts[c.id].map(c.name).join(', ')
      : `${c.label === 'State Senate' ? 'Senate' : 'Assembly'} ${districts[c.id].join(', ')}`));
  return parts.length ? `${parts.join(' · ')} (${(districts.places ?? []).join(', ')})` : '';
}

/** Filter values like "assembly:135" for every district a story touches. */
export function districtKeys(item) {
  return CHAMBERS.flatMap((c) => (item.districts?.[c.id] ?? []).map((d) => `${c.id}:${d}`));
}

/** Districts with stories, by chamber, in district-number order. */
export function storiesByDistrict(items) {
  return CHAMBERS.map((c) => {
    const by = new Map();
    for (const item of items) {
      for (const d of item.districts?.[c.id] ?? []) {
        const list = by.get(d) ?? [];
        list.push(item);
        by.set(d, list);
      }
    }
    const districts = [...by].sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([d, list]) => ({ key: `${c.id}:${d}`, name: c.name(d), items: list }));
    return { id: c.id, label: c.label, districts };
  }).filter((c) => c.districts.length);
}

/** One line per chamber: the districts active in the issue, each linking to
    All articles filtered to that district. */
export function renderDistricts(chambers) {
  // HeavyMap: plain names; the original linked to an All-articles filter page.
  return chambers.map((c) =>
    `<li class="wny-districts__row"><span class="wny-districts__chamber">${escapeHtml(c.label)}</span>`
    + `<span class="wny-districts__names">${c.districts.map((d) =>
      escapeHtml(d.name.replace(/^(Senate|Assembly) /, ''))).join(' · ')}</span></li>`).join('');
}

export function incentiveText(inc, currency) {
  return [formatAmount(inc.amount, currency), words(inc.type), inc.program ? `(${inc.program})` : '']
    .filter(Boolean).join(' ');
}

/** Jobs, public support, next step and stage history, where the research has them. */
function factsHtml(item) {
  const rows = [];
  const jobs = [
    item.jobs_added != null ? `${item.jobs_added} added` : '',
    item.jobs_lost != null ? `${item.jobs_lost} lost` : '',
  ].filter(Boolean).join(', ');
  if (jobs) rows.push(['Jobs', escapeHtml(jobs)]);
  if (item.incentive) rows.push(['Public support', escapeHtml(incentiveText(item.incentive, item.currency))]);
  if (item.next_step?.text) {
    rows.push(['Next', escapeHtml([item.next_step.text, partialDate(item.next_step.date)].filter(Boolean).join(', '))]);
  }
  const districts = districtText(item.districts);
  if (districts) rows.push(['Districts', escapeHtml(districts)]);
  const steps = (item.stage_history ?? []).filter((h) => STAGES[h.stage]);
  if (steps.length) {
    rows.push(['Stage', steps.map((h) => escapeHtml([STAGES[h.stage], apDate(h.date)].filter(Boolean).join(' '))).join(' → ')]);
  }
  return rows.length
    ? `<dl class="wny-facts">${rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>`
    : '';
}

/** Dated next steps, soonest first. */
export function comingUp(items) {
  return items.filter((i) => i.next_step?.text && partialDate(i.next_step.date))
    .sort((a, b) => a.next_step.date.localeCompare(b.next_step.date) || a.id.localeCompare(b.id));
}

export function renderComingUp(items) {
  return comingUp(items).map((i) =>
    `<li class="wny-money__line" data-item="${escapeHtml(i.id)}">`
    + `<span class="wny-coming__date">${escapeHtml(partialDate(i.next_step.date))}</span>`
    + `<a class="wny-money__what" href="#wny-${escapeHtml(i.id)}">${escapeHtml(i.next_step.text)}</a>`
    + `<span class="wny-money__meta">${[i.entity_name, i.place].filter(Boolean).map(escapeHtml).join(' · ')}</span></li>`).join('');
}

/** Stated job figures, and stories where sources disagree on jobs. */
export function jobLines(items) {
  return items.filter((i) => i.jobs_added != null || i.jobs_lost != null
    || (i.flags ?? []).some((f) => f.type === 'conflict' && /^jobs_(added|lost)$/.test(f.detail)));
}

export function renderJobs(items) {
  return jobLines(items).map((i) => {
    const figure = i.jobs_added != null ? `+${i.jobs_added}` : i.jobs_lost != null ? `−${i.jobs_lost}` : 'Disputed';
    const tone = i.jobs_added != null ? ' wny-amount--done' : '';
    const what = i.jobs_added != null || i.jobs_lost != null ? i.headline : `${i.headline}: sources disagree on jobs`;
    return `<li class="wny-money__line" data-item="${escapeHtml(i.id)}">`
      + `<span class="wny-money__amount${tone}">${escapeHtml(figure)}</span>`
      + `<a class="wny-money__what" href="#wny-${escapeHtml(i.id)}">${escapeHtml(what)}</a>`
      + `<span class="wny-money__meta">${[STAGES[i.stage], i.place].filter(Boolean).map(escapeHtml).join(' · ')}</span></li>`;
  }).join('');
}

/** Public incentives; never added to the dollar figures, never summed. */
export function renderIncentives(items) {
  return items.filter((i) => i.incentive).map((i) =>
    `<li class="wny-money__line" data-item="${escapeHtml(i.id)}">`
    + `<span class="wny-money__amount">${escapeHtml(formatAmount(i.incentive.amount, i.currency) || '—')}</span>`
    + `<a class="wny-money__what" href="#wny-${escapeHtml(i.id)}">${escapeHtml(i.incentive.program || i.headline)}</a>`
    + `<span class="wny-money__meta">${[words(i.incentive.type), i.entity_name].filter(Boolean).map(escapeHtml).join(' · ')}</span></li>`).join('');
}

/** A full story card: stage, meta, headline, explainer, flags, conflicts, sources. */
export function renderItem(item) {
  const amount = formatAmount(item.amount, item.currency);
  const ceiling = formatAmount(item.ceiling_amount, item.currency);
  const money = amount || ceiling
    ? `<span class="wny-item__money">`
      + (amount ? `<span class="wny-item__amount${toneClass(item.stage)}">${escapeHtml(amount)}</span>`
        + (item.amount_type ? `<span class="wny-item__kind">${escapeHtml(words(item.amount_type))}</span>` : '') : '')
      + (ceiling ? `<span class="wny-item__ceiling">Contract ceiling ${escapeHtml(ceiling)}</span>` : '')
      + '</span>'
    : '';
  return `<li class="issue-list__item wny-item" id="wny-${escapeHtml(item.id)}" data-item="${escapeHtml(item.id)}">`
    + `<p class="wny-item__top">${stageHtml(item)}${money}</p>`
    + titleHtml(item)
    + `<p class="issue-list__meta">${metaHtml(item)}</p>`
    + (item.note ? `<p class="wny-item__note">${escapeHtml(item.note)}</p>` : '')
    + factsHtml(item)
    + flagsHtml(item)
    + conflictsHtml(item)
    + sourcesHtml(item)
    + `<p class="wny-item__tools"><button type="button" class="wny-filters__clear" data-copy-link="wny-${escapeHtml(item.id)}">Copy link</button></p>`
    + '</li>';
}

/** A one-line index entry, for Recent. No id, so it never duplicates the full card's. */
export function renderCompact(item) {
  return `<li class="issue-list__item wny-item wny-item--compact" data-item="${escapeHtml(item.id)}">`
    + titleHtml(item)
    + `<p class="issue-list__meta">${[STAGES[item.stage] ? escapeHtml(STAGES[item.stage]) : '', metaHtml(item)].filter(Boolean).join(' · ')}</p></li>`;
}

export function renderMoney(items) {
  return items.map((i) =>
    `<li class="wny-money__line" data-item="${escapeHtml(i.id)}">`
    + `<span class="wny-money__amount${toneClass(i.stage)}">${escapeHtml(formatAmount(i.amount, i.currency))}</span>`
    + `<a class="wny-money__what" href="#wny-${escapeHtml(i.id)}">${escapeHtml(i.headline)}</a>`
    + `<span class="wny-money__meta">${[STAGES[i.stage], words(i.amount_type), i.place].filter(Boolean).map(escapeHtml).join(' · ')}</span></li>`
  ).join('');
}

/** One line: each stage's subtotal in its colour, then the total. */
export function renderMoneyTotal(lines, label = 'Total of stated amounts') {
  const sums = moneyByStage(lines).map(({ currency, amount, parts }) => {
    const pieces = parts.map((part) =>
      `<span class="wny-money__part"><b class="wny-money__sum${toneClass(part.stage)}">${escapeHtml(formatAmount(part.amount, currency))}</b>`
      + ` ${escapeHtml((STAGES[part.stage] ?? 'other').toLowerCase())}</span>`);
    return pieces.join(' + ')
      + (parts.length > 1 ? ` = <b class="wny-money__sum">${escapeHtml(formatAmount(amount, currency))}</b>` : '');
  });
  return `<span class="wny-money__label">${escapeHtml(label)}</span>`
    + `<span class="wny-money__sums">${sums.join(' · ')}</span>`;
}

/** Each kind: a heading, its lines, and (for two or more) its own total. */
export function renderMoneyGroups(lines) {
  return moneyGroups(lines).map((group) =>
    `<li class="wny-money__group"><h3 class="wny-money__kind">${escapeHtml(group.label)}</h3>`
    + `<ul class="wny-money__list">${renderMoney(group.lines)}</ul>`
    + (group.lines.length > 1
      ? `<p class="wny-money__line wny-money__total">${renderMoneyTotal(group.lines, `${group.label} total`)}</p>`
      : '')
    + '</li>').join('');
}

/* Where an organisation is based (na-research hq_region). Outside capital
   is part of the story, so the list is grouped by it; blank stays blank. */
export const HQ_GROUPS = [
  { id: 'wny', label: 'Based in the region' },
  { id: 'ontario', label: 'Based in Ontario' },
  { id: 'elsewhere', label: 'Based outside the region' },
  { id: '', label: 'Headquarters not stated' },
];

function companyLine(c) {
  /* The organisation's website when the research has one; otherwise its
     story on this page, so every name leads somewhere. */
  const url = safeHttpUrl(c.website);
  const href = url ?? (c.first ? `#wny-${c.first}` : null);
  const name = href
    ? `<a href="${escapeHtml(href)}"${url ? ' rel="noopener"' : ''}>${escapeHtml(c.name)}</a>`
    : escapeHtml(c.name);
  return `<li class="wny-company"><span class="wny-company__name">${name}</span>`
    + `<span class="wny-company__meta">${[c.city, String(c.count)].filter(Boolean).map(escapeHtml).join(' · ')}</span></li>`;
}

export function renderCompanies(companies) {
  return companies.map(companyLine).join('');
}

/** The list grouped by home region; empty groups are left out. */
export function renderCompanyGroups(companies) {
  return HQ_GROUPS.map((g) => {
    const inGroup = companies.filter((c) => (HQ_GROUPS.some((x) => x.id === c.hq_region) ? c.hq_region : '') === g.id);
    return inGroup.length
      ? `<li class="wny-company-group"><h3 class="wny-money__kind">${escapeHtml(g.label)}</h3>`
        + `<ul class="wny-company-list">${inGroup.map(companyLine).join('')}</ul></li>`
      : '';
  }).join('');
}

/* ---- mentions -------------------------------------------------------------- */

/** People named in the issue's stories, from intel/event_people.csv via the
    export. Only people on a published story are listed; one entry per name
    and organisation, with every story they appear in. */
export function mentionsFor(people, items) {
  const shown = new Set(items.map((i) => i.id));
  const byKey = new Map();
  for (const p of people ?? []) {
    if (!p.name || !shown.has(p.event_id)) continue;
    const key = `${p.name}|${p.organization ?? ''}`;
    const entry = byKey.get(key) ?? { name: p.name, role: p.role ?? '', organization: p.organization ?? '', events: [] };
    entry.events.push(p.event_id);
    byKey.set(key, entry);
  }
  return [...byKey.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function renderMentions(mentions) {
  return mentions.map((m) =>
    `<li class="wny-company"><span class="wny-company__name">${m.events?.[0]
      ? `<a href="#wny-${escapeHtml(m.events[0])}">${escapeHtml(m.name)}</a>` : escapeHtml(m.name)}</span>`
    + `<span class="wny-company__meta">${[m.role, m.organization].filter(Boolean).map(escapeHtml).join(', ')}</span></li>`
  ).join('');
}


/** Every published item with a stated amount, newest first. */
export function investmentLines(items) {
  return byNewest(items.filter((i) => formatAmount(i.amount, i.currency)));
}

/* ---- money at a glance: one cell per kind, and one equation ----------------- */

/* What each kind's figure is, in a reader's words. */
const KIND_CAPTIONS = {
  investment: 'Investment', committed: 'Contract money committed', awards: 'Award, as the company reports it',
  deals: 'Purchase price', grants: 'Grant', proposed: 'Proposed spending', charges: 'Charge', other: 'Other amount',
};
const NOT_COUNTED_WHY = { corridor: 'corridor news', developing: 'in development' };

/** One cell per kind present: the counted sum (investment and industry
    stories only), or, when nothing in the kind counts, its listed sum marked
    as not counted. A cell takes a stage tone when all its counted lines share one. */
export function moneyCells(items) {
  return moneyGroups(investmentLines(items)).map((group) => {
    const counted = group.lines.filter((i) => i.lane === 'production');
    const use = counted.length ? counted : group.lines;
    const currency = use[0].currency || 'USD';
    const amount = use.reduce((sum, i) => sum + Number(i.amount), 0);
    const tones = new Set(counted.map((i) => AMOUNT_TONES[i.stage] ?? ''));
    const stages = [...new Set(counted.map((i) => STAGES[i.stage]).filter(Boolean))];
    const why = [...new Set(group.lines.map((i) => NOT_COUNTED_WHY[i.lane]).filter(Boolean))];
    return {
      kind: group.id,
      value: formatAmount(amount, currency),
      tone: counted.length && tones.size === 1 ? [...tones][0] : '',
      counted: counted.length > 0,
      caption: KIND_CAPTIONS[group.id] ?? group.label,
      detail: counted.length ? stages.join(', ').toLowerCase() : `not counted${why.length ? `: ${why.join(', ')}` : ''}`,
    };
  });
}

export function renderMoneyCells(cells) {
  return cells.map((c) =>
    `<li class="wny-cell${c.counted ? '' : ' wny-cell--muted'}">`
    + `<span class="wny-cell__value${c.tone ? ` wny-amount--${c.tone}` : ''}">${escapeHtml(c.value)}</span>`
    + `<span class="wny-cell__caption">${escapeHtml(c.caption)}</span>`
    + `<span class="wny-cell__detail">${escapeHtml(c.detail)}</span></li>`).join('');
}

/* The kinds that are money for work in the region. Purchase prices and
   reported awards are headline values, not spending here, so they stay out. */
export const REGION_KINDS = ['investment', 'committed'];

/** "Money tied to work in the region": announced investment and committed
    contract money from investment-and-industry stories. An amount whose
    regional share is undisclosed is left out of the sum and named beneath it
    (counting the whole of it would count work outside the region); when the
    research records a regional_amount, that amount is used instead. */
export function regionEquation(items) {
  const lines = investmentLines(items)
    .filter((i) => i.lane === 'production' && REGION_KINDS.includes(moneyKind(i)))
    .sort((a, b) => REGION_KINDS.indexOf(moneyKind(a)) - REGION_KINDS.indexOf(moneyKind(b)));
  const undisclosed = (i) => i.regional_amount == null && (i.flags ?? []).some((f) => f.type === 'gap' && f.detail === 'regional_share');
  const terms = lines.filter((i) => !undisclosed(i));
  const left = lines.filter(undisclosed);
  if (!terms.length || terms.length + left.length < 2) return null;
  const currencies = new Set(lines.map((i) => i.currency || 'USD'));
  if (currencies.size > 1) return null;  // never add across currencies
  const value = (i) => Number(i.regional_amount ?? i.amount);
  const currency = [...currencies][0];
  return {
    terms: terms.map((i) => ({ id: i.id, value: formatAmount(value(i), currency), kind: moneyKind(i), tone: AMOUNT_TONES[i.stage] ?? '' })),
    total: formatAmount(terms.reduce((sum, i) => sum + value(i), 0), currency),
    left: left.map((i) => ({ id: i.id, value: formatAmount(i.amount, currency), place: i.place })),
    secondary: lines.some((i) => (i.flags ?? []).some((f) => f.type === 'secondary_source')),
  };
}

const TERM_WORDS = { investment: 'announced investment', committed: 'committed contract money' };

/** "a" or "an" for an amount as it is said aloud: "an $11.2M" (eleven),
    "an $8M", "an $18.9M", "a $1.4M", "a $110M". */
export function articleFor(amount) {
  const digits = String(amount).replace(/^[^\d]*/, '').split('.')[0];
  if (digits.startsWith('8')) return 'an';
  return digits.length === 2 && (digits === '11' || digits === '18') ? 'an' : 'a';
}

export function renderRegionEquation(eq) {
  if (!eq) return '';
  /* Consecutive terms of one kind share a single label after the last. */
  const parts = eq.terms.map((t, i) => {
    const next = eq.terms[i + 1];
    const label = !next || next.kind !== t.kind ? ` <span class="wny-eq__kind">${escapeHtml(TERM_WORDS[t.kind])}</span>` : '';
    return `<a class="wny-eq__term${t.tone ? ` wny-amount--${t.tone}` : ''}" href="#wny-${escapeHtml(t.id)}">${escapeHtml(t.value)}</a>${label}`;
  });
  const left = eq.left.map((l) =>
    `an undisclosed share of ${articleFor(l.value)} <a href="#wny-${escapeHtml(l.id)}">${escapeHtml(l.value)} contract</a>${l.place ? ` (${escapeHtml(l.place)})` : ''}`);
  return `<p class="wny-eq__title">Announced investment and committed contract money tied to work in the region</p>`
    + `<p class="wny-eq__line">${parts.join(' + ')} = <b class="wny-eq__total">${escapeHtml(eq.total)}</b></p>`
    + (left.length ? `<p class="wny-eq__plus">plus ${left.join(', and ')}</p>` : '')
    + (eq.secondary ? '<p class="wny-eq__note">Contract amounts come from a secondary listing; the original notice wasn’t accessed.</p>' : '');
}

/** Every money list, by kind. Each kind ends with its own total line, always:
    it counts investment-and-industry stories only (the data owner's rule),
    says how many other lines it leaves out, and is never added to another
    kind. A kind with nothing countable says so instead of showing $0. */
export function renderInvestments(lines, { linkBase = '/desks/us/ny/western-new-york/posts/' } = {}) {
  return moneyGroups(lines).map((group) => {
    const counted = group.lines.filter((i) => i.lane === 'production');
    const left = group.lines.length - counted.length;
    const rows = group.lines.map((i) =>
      `<li class="wny-money__line" data-item="${escapeHtml(i.id)}">`
      + `<span class="wny-money__amount${toneClass(i.stage)}">${escapeHtml(formatAmount(i.amount, i.currency))}</span>`
      + `<a class="wny-money__what" href="${escapeHtml(linkBase)}#wny-${escapeHtml(i.id)}">${escapeHtml(i.headline)}</a>`
      + `<span class="wny-money__meta">${[STAGES[i.stage], words(i.amount_type), i.place,
        i.lane === 'production' ? '' : LANES.find((l) => l.id === i.lane)?.label,
        formatAmount(i.ceiling_amount, i.currency) ? `ceiling ${formatAmount(i.ceiling_amount, i.currency)}` : '']
        .filter(Boolean).map(escapeHtml).join(' · ')}</span></li>`).join('');
    const note = left ? `${left} ${left === 1 ? 'line' : 'lines'} from other sections not counted` : '';
    const total = counted.length
      ? `<p class="wny-money__line wny-money__total">${renderMoneyTotal(counted, `${group.label} total`)}`
        + (note ? `<span class="wny-money__meta">${escapeHtml(note)}</span>` : '') + '</p>'
      : `<p class="wny-money__line wny-money__total"><span class="wny-money__label">${escapeHtml(group.label)} total</span>`
        + `<span class="wny-money__sums">Not totalled: in-development and corridor news are listed, not counted</span></p>`;
    return `<li class="wny-money__group"><h3 class="wny-money__kind">${escapeHtml(group.label)}</h3>`
      + `<ul class="wny-money__list">${rows}</ul>${total}</li>`;
  }).join('');
}

export async function mountInvestments(root = document) {
  const list = root.querySelector('[data-wny="investments"]');
  const form = root.querySelector('[data-wny="filters"]');
  const count = root.querySelector('[data-wny="count"]');
  const none = root.querySelector('[data-wny="no-match"]');
  let data;
  try {
    data = await loadData();
  } catch (err) {
    console.error('wny.json failed to load', err);
    show(root.querySelector('[data-wny="error"]'));
    return;
  }
  const lines = investmentLines(publishable(data.items));
  updated(root, data);
  if (!lines.length) {
    show(root.querySelector('[data-wny="empty"]'));
    return;
  }
  const params = new URLSearchParams(location.search);
  let state = Object.fromEntries(INVEST_KEYS.map((k) => [k, params.get(k) ?? '']));
  const options = investmentOptions(lines);
  for (const key of ['kind', 'stage', 'lane']) fillSelect(form.elements[key], options[key], state[key]);
  state = { ...state, kind: form.elements.kind.value, stage: form.elements.stage.value, lane: form.elements.lane.value };
  form.elements.q.value = state.q;
  show(form);

  const render = () => {
    const shown = filterInvestments(lines, state);
    list.innerHTML = renderInvestments(shown);
    list.hidden = !shown.length;
    none.hidden = shown.length > 0;
    const active = INVEST_KEYS.some((k) => state[k]);
    count.textContent = active
      ? `Showing ${shown.length} of ${lines.length} dollar figures`
      : `${lines.length} dollar figures`;
    count.hidden = false;
    form.querySelector('[data-wny="clear"]').hidden = !active;
    window.NASketch?.redraw();
  };
  const apply = () => {
    state = Object.fromEntries(INVEST_KEYS.map((k) => [k, String(form.elements[k].value).trim()]));
    const qs = new URLSearchParams(Object.entries(state).filter(([, v]) => v)).toString();
    history.replaceState(null, '', `${location.pathname}${qs ? `?${qs}` : ''}`);
    render();
  };
  form.addEventListener('submit', (e) => e.preventDefault());
  form.addEventListener('input', apply);
  form.addEventListener('change', apply);
  for (const button of [form.querySelector('[data-wny="clear"]'), none.querySelector('button')]) {
    button?.addEventListener('click', () => { form.reset(); apply(); form.elements.q.focus(); });
  }
  render();
}

const AP_MONTHS = ['Jan.', 'Feb.', 'March', 'April', 'May', 'June', 'July', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.'];

/** "Oct. 10, 2026": AP style, matching the coverage dates. */
export function apDate(iso) {
  const x = new Date(`${iso}T12:00:00`);
  return Number.isNaN(x.getTime()) ? '' : `${AP_MONTHS[x.getMonth()]} ${x.getDate()}, ${x.getFullYear()}`;
}

/** "Sept. 28 to Oct. 9, 2026" (AP-style months, year once when shared). */
export function coverageText(start, end) {
  const d = (iso) => new Date(`${iso}T12:00:00`);
  const a = d(start), b = d(end);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return '';
  const md = (x) => `${AP_MONTHS[x.getMonth()]} ${x.getDate()}`;
  return a.getFullYear() === b.getFullYear()
    ? `${md(a)} to ${md(b)}, ${b.getFullYear()}`
    : `${md(a)}, ${a.getFullYear()} to ${md(b)}, ${b.getFullYear()}`;
}

