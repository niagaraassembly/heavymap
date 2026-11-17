/* Parcel card and drawer renderers (parcel-views design §5.2, §5.3).
 *
 * Both levels render from summariseRecord. Interface chrome ("Open
 * record", "Copy link", "coming") is literal, as the site does for chrome;
 * every data word comes from the summary, which itself resolves labels.
 *
 * Phase 1 (BL-117): Save, Note, Export and Open workspace are shown
 * disabled with "coming" — the workspace is BL-118. Report a problem
 * appears only when a feedback target is configured (BL-107); there is
 * none yet, so it is hidden.
 *
 * Phase 2 (BL-118): pass onOpenWorkspace(tab) and the Note and Open
 * workspace buttons open the workspace (Note lands on the Notes tab).
 * Without it the buttons stay disabled, as in phase 1.
 */

import { el } from "./dossier.js";
import { developmentCountAction } from "./development-records.js";

const fmtM2 = (m2) => `${m2.toLocaleString("en-CA")} m²`;
const fmtUnits = (area) => `${area.ha.toFixed(2)} ha · ${area.acres.toFixed(2)} acres`;

/** Outline of the clicked parcel, or a neutral placeholder with no geometry. */
export function thumbnail(geometry) {
  const wrap = el("div", undefined, "parcel-thumb");
  const ring =
    geometry?.type === "Polygon"
      ? geometry.coordinates?.[0]
      : geometry?.type === "MultiPolygon"
        ? geometry.coordinates?.[0]?.[0]
        : null;
  if (!ring || ring.length < 3) {
    wrap.classList.add("parcel-thumb-empty");
    wrap.setAttribute("aria-hidden", "true");
    return wrap;
  }
  const xs = ring.map(([x]) => x);
  const ys = ring.map(([, y]) => y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const scale = Math.min(24 / Math.max(maxX - minX, 1e-9), 24 / Math.max(maxY - minY, 1e-9));
  const points = ring
    .map(([x, y]) => `${(3 + (x - minX) * scale).toFixed(1)},${(27 - (y - minY) * scale).toFixed(1)}`)
    .join(" ");
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 30 30");
  svg.setAttribute("aria-hidden", "true");
  const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
  polygon.setAttribute("points", points);
  svg.append(polygon);
  wrap.append(svg);
  return wrap;
}

export function comingTag() {
  const tag = el("span", "coming", "parcel-coming");
  tag.setAttribute("aria-hidden", "true");
  return tag;
}

export function disabledAction(text) {
  const button = el("button", undefined, "parcel-btn");
  button.disabled = true;
  button.append(el("span", text));
  return button;
}

function saveAction(onSave) {
  const button = el("button", "☆ Save", "parcel-btn");
  button.type = "button";
  button.dataset.parcelSave = "";
  button.addEventListener("click", onSave);
  return button;
}

/** Copy-link button: copies the drawer deep link for this parcel. Shared
 * by the drawer and the workspace header (BL-118). */
export function copyLinkButton(summary) {
  const copy = el("button", undefined, "parcel-btn");
  copy.append(el("span", "⧉ Copy link"));
  copy.addEventListener("click", async () => {
    const url = `${location.origin}${location.pathname}#parcel=${encodeURIComponent(summary.key)}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const area = document.createElement("textarea");
      area.value = url;
      document.body.append(area);
      area.select();
      try {
        document.execCommand("copy");
      } catch {
        /* clipboard unavailable; the link stays visible in the address bar */
      }
      area.remove();
    }
    copy.replaceChildren(el("span", "Copied"));
    setTimeout(() => copy.replaceChildren(el("span", "⧉ Copy link")), 1500);
  });
  return copy;
}

function fact(labelText, big, sub) {
  const cell = el("div", undefined, "parcel-fact");
  cell.append(el("small", labelText));
  cell.append(el("b", big));
  if (sub !== undefined && sub !== "") cell.append(el("i", sub));
  return cell;
}

function moreText(labels, total, shown) {
  return total > shown ? labels.t("parcel.more", { n: total - shown }) : "";
}

/** One bar centred along the bottom of the map window (design §5.2). */
export function parcelCardElement(summary, labels, { geometry, onSave, onOpenRecord, onOpenDevelopment, developmentCount = 0, onClose }) {
  const card = el("section", undefined, "parcel-card");
  card.setAttribute("role", "region");
  card.setAttribute("aria-label", "Parcel summary");

  const id = el("div", undefined, "parcel-card-id");
  id.append(thumbnail(geometry));
  const titles = el("div");
  titles.append(el("h2", summary.title, "parcel-title"));
  titles.append(el("p", summary.subtitle, "parcel-sub"));
  id.append(titles);
  card.append(id);
  const development = developmentCountAction(developmentCount, onOpenDevelopment);
  if (development) card.append(development);

  const zoning = summary.land.zoning[0];
  const plan = summary.land.planUse[0];
  card.append(
    fact(labels.t("parcel.tile.area"), summary.area.ha.toFixed(2), fmtM2(summary.area.m2)),
  );
  card.lastElementChild.classList.add("parcel-fact-area");
  const zoneCell = fact(
    labels.t("parcel.field.zoning"),
    zoning ? zoning.class : labels.t("parcel.none_found"),
    [
      zoning?.shareText,
      moreText(labels, summary.land.zoning.length, 1),
    ]
      .filter(Boolean)
      .join(" · "),
  );
  zoneCell.classList.add("parcel-fact-zone");
  card.append(zoneCell);
  const planCell = fact(
    labels.t("parcel.field.plan_use"),
    plan ? plan.class : labels.t("parcel.none_found"),
    [
    plan ? `${plan.layerName}` : "",
      plan?.shareText,
      moreText(labels, summary.land.planUse.length, 1),
    ]
      .filter(Boolean)
      .join(" · "),
  );
  planCell.classList.add("parcel-fact-plan");
  card.append(planCell);
  const settingCell = fact(
    labels.t("parcel.field.setting"),
    summary.setting.boundaryText,
    summary.setting.regulatedText,
  );
  settingCell.classList.add("parcel-fact-setting");
  card.append(settingCell);
  const gapsCell = fact(
    labels.t("parcel.field.gaps"),
    String(summary.gaps.count),
    labels.t("parcel.gaps.known"),
  );
  if (summary.gaps.count > 0) gapsCell.classList.add("parcel-fact-warn");
  gapsCell.classList.add("parcel-fact-gaps");
  card.append(gapsCell);

  const save = el("button", "☆ Save", "parcel-card-save");
  save.type = "button";
  save.dataset.parcelSave = "";
  save.addEventListener("click", onSave);
  card.append(save);

  const open = el("button", undefined, "parcel-go");
  open.append(el("span", "Open record"));
  open.addEventListener("click", onOpenRecord);
  card.append(open);
  const close = el("button", "✕", "parcel-xx");
  close.setAttribute("aria-label", "Close parcel card");
  close.addEventListener("click", onClose);
  card.append(close);
  return card;
}

function landRows(summary, labels) {
  const rows = [];
  const groups = [
    [labels.t("parcel.field.zoning"), summary.land.zoning],
    [labels.t("parcel.field.plan_use"), summary.land.planUse],
    [labels.t("parcel.field.boundary"), summary.land.boundary],
  ];
  for (const [groupLabel, classes] of groups) {
    for (const row of classes.slice(0, 3)) {
      rows.push({ groupLabel, value: row.value, share: row.share, shareText: row.shareText });
    }
    if (classes.length > 3) {
      rows.push({ groupLabel, value: labels.t("parcel.more", { n: classes.length - 3 }), share: null, shareText: "" });
    }
  }
  if (!rows.length) {
    rows.push({ groupLabel: labels.t("parcel.field.zoning"), value: labels.t("parcel.none_found"), share: null, shareText: "" });
  }
  return rows;
}

function tileHeading(text) {
  return el("small", text);
}

/** Dense record drawer rising from the bottom (design §5.3). */
export function parcelDrawerElement(summary, labels, { geometry, releaseId, feedbackUrl, onClose, onSave, onOpenNotes, onOpenWorkspace, developmentCount = 0, onOpenDevelopment }) {
  const drawer = el("section", undefined, "parcel-drawer");
  drawer.setAttribute("role", "region");
  drawer.setAttribute("aria-label", "Parcel record");
  drawer.append(el("div", undefined, "parcel-grab"));

  const detail = el("div", undefined, "parcel-detail");
  detail.hidden = true;
  const detailTitle = el("h3", undefined, "parcel-detail-title");
  const detailList = el("ul", undefined, "parcel-detail-list");
  const detailClose = el("button", "✕", "parcel-xx");
  detailClose.setAttribute("aria-label", "Close details");
  detailClose.addEventListener("click", () => {
    detail.hidden = true;
    detailTitle.textContent = "";
    detailList.replaceChildren();
  });
  detail.append(detailTitle, detailList, detailClose);

  function showDetail(title, items) {
    detailTitle.textContent = title;
    detailList.replaceChildren();
    for (const item of items) {
      const li = el("li");
      if (typeof item === "string") li.textContent = item;
      else li.append(...item);
      detailList.append(li);
    }
    if (!items.length) detailList.append(el("li", labels.t("parcel.none_found")));
    detail.hidden = false;
  }

  const head = el("div", undefined, "parcel-drawer-head");
  head.append(thumbnail(geometry));
  const titles = el("div", undefined, "parcel-drawer-titles");
  titles.append(el("h2", summary.title, "parcel-title"));
  const sub = [summary.subtitle];
  if (summary.roll) sub.push(`Roll ${summary.roll.arnText}`);
  titles.append(el("p", sub.filter(Boolean).join(" · "), "parcel-sub"));
  titles.append(
    el(
      "p",
      summary.roll ? summary.roll.matchText : summary.coverage.text,
      "parcel-match",
    ),
  );
  head.append(titles);

  const actions = el("div", undefined, "parcel-actions");
  const development = developmentCountAction(developmentCount, onOpenDevelopment);
  if (development) actions.append(development);
  actions.append(saveAction(onSave));
  if (onOpenNotes) {
    const note = el("button", undefined, "parcel-btn");
    note.append(el("span", "✎ Note"));
    note.addEventListener("click", onOpenNotes);
    actions.append(note);
  } else {
    actions.append(disabledAction("✎ Note"));
  }
  actions.append(disabledAction("⤓ Export"));
  actions.append(copyLinkButton(summary));
  if (feedbackUrl) {
    const report = el("a", "⚑ Report a problem", "parcel-btn");
    report.href = feedbackUrl;
    report.target = "_blank";
    report.rel = "noreferrer";
    actions.append(report);
  }
  if (onOpenWorkspace) {
    const workspace = el("button", undefined, "parcel-btn parcel-btn-pri");
    workspace.append(el("span", "Open workspace ⤢"));
    workspace.addEventListener("click", () => onOpenWorkspace("notes"));
    actions.append(workspace);
  } else {
    const workspace = disabledAction("Open workspace ⤢");
    workspace.classList.add("parcel-btn-pri");
    actions.append(workspace);
  }
  const close = el("button", "✕", "parcel-btn-ico");
  close.setAttribute("aria-label", "Close record");
  close.addEventListener("click", onClose);
  actions.append(close);
  head.append(actions);
  drawer.append(head);

  const tiles = el("div", undefined, "parcel-tiles");
  const areaTile = el("div", undefined, "parcel-tile parcel-tile-dark");
  areaTile.append(
    tileHeading(labels.t("parcel.tile.area")),
    el("b", fmtM2(summary.area.m2)),
    el("span", fmtUnits(summary.area)),
  );
  tiles.append(areaTile);

  const landTile = el("div", undefined, "parcel-tile parcel-tile-land");
  landTile.append(tileHeading(labels.t("parcel.tile.land")));
  for (const row of landRows(summary, labels)) {
    const line = el("div", undefined, "parcel-lr");
    line.append(el("span", row.groupLabel));
    line.append(el("strong", row.value));
    line.append(el("em", row.shareText));
    if (row.share !== null) {
      const bar = el("div", undefined, "parcel-bar");
      const fill = el("span");
      fill.style.width = `${Math.min(100, Math.max(0, row.share * 100))}%`;
      bar.append(fill);
      line.append(bar);
    }
    landTile.append(line);
  }
  tiles.append(landTile);

  const identityTile = el("div", undefined, "parcel-tile");
  identityTile.append(tileHeading(labels.t("parcel.tile.identity")));
  const identityList = el("ul");
  const rollRow = el("li");
  rollRow.append(el("span", labels.t("parcel.identity.roll")));
  rollRow.append(el("em", summary.roll ? summary.roll.arnText : summary.coverage.text));
  identityList.append(rollRow);
  if (summary.roll) {
    const matchRow = el("li");
    matchRow.append(el("span", labels.t("parcel.identity.roll_match")));
    matchRow.append(el("em", summary.roll.matchText));
    identityList.append(matchRow);
  }
  const addressRow = el("li");
  addressRow.append(el("span", labels.t("parcel.identity.addresses")));
  if (summary.addresses.count === 1) {
    addressRow.append(el("em", summary.addresses.shown[0]?.text ?? ""));
  } else {
    const open = el("button", `${summary.addresses.count} ›`, "parcel-mini");
    open.addEventListener("click", () => {
      const items = summary.addresses.shown.map((a) => a.text);
      if (!summary.addresses.complete) {
        items.unshift(
          labels.t("parcel.addresses.partial", {
            shown: summary.addresses.shown.length,
            count: summary.addresses.count,
          }),
        );
      }
      showDetail(labels.t("parcel.identity.addresses"), items);
    });
    addressRow.append(open);
  }
  identityList.append(addressRow);
  const keyRow = el("li");
  keyRow.append(el("span", labels.t("parcel.identity.parcel_key")));
  const keyButton = el("button", `…${summary.shortKey}`, "parcel-mini");
  keyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(summary.key);
      keyButton.textContent = "Copied";
      setTimeout(() => { keyButton.textContent = `…${summary.shortKey}`; }, 1500);
    } catch {
      /* clipboard unavailable; the key is shown in full in the address bar */
    }
  });
  keyRow.append(keyButton);
  identityList.append(keyRow);
  identityTile.append(identityList);
  tiles.append(identityTile);

  const checkedTile = el("div", undefined, "parcel-tile");
  checkedTile.append(tileHeading(labels.t("parcel.tile.checked")));
  const checkedList = el("ul");
  if (summary.checkedAgainstIncomplete) {
    checkedList.append(el("li", labels.t("dossier.provenance.not_yet_captured")));
  } else {
    for (const row of summary.checkedAgainst) {
      const li = el("li");
      li.append(el("span", row.name));
      const state = el("em", row.inside ? labels.t("parcel.checked.inside") : labels.t("parcel.checked.not_in"));
      if (row.inside) state.classList.add("parcel-inside");
      li.append(state);
      checkedList.append(li);
    }
  }
  checkedTile.append(checkedList);
  tiles.append(checkedTile);

  const attentionTile = el("div", undefined, "parcel-tile");
  attentionTile.append(tileHeading(labels.t("parcel.tile.attention")));
  const attentionList = el("ul");
  const attentionRows = [
    {
      label: labels.t("parcel.attention.gaps"),
      count: summary.attention.gaps.count,
      warn: summary.attention.gaps.count > 0,
      items: summary.attention.gaps.items.map((g) => g.id),
    },
    {
      label: labels.t("parcel.attention.slivers"),
      count: summary.attention.slivers.count,
      warn: false,
      items: summary.attention.slivers.items.map(
        (s) => `${s.name}: ${s.class} — ${s.shareText}`,
      ),
    },
    {
      label: labels.t("parcel.attention.not_yet"),
      count: summary.attention.notYet.count,
      warn: false,
      items: summary.attention.notYet.items.map((n) => `${n.label}: ${n.value}`),
    },
    {
      label: labels.t("parcel.attention.sources"),
      count: summary.attention.sources.count,
      warn: false,
      items: summary.attention.sources.items.map(
        (s) => `${s.label} — ${s.paths.join(", ")}`,
      ),
    },
  ];
  for (const row of attentionRows) {
    const li = el("li");
    const open = el("button", undefined, "parcel-mini parcel-row-btn");
    open.append(el("span", row.label));
    open.append(el("em", String(row.count)));
    if (row.warn) open.classList.add("parcel-warn");
    open.addEventListener("click", () => showDetail(row.label, row.items));
    li.append(open);
    attentionList.append(li);
  }
  attentionTile.append(attentionList);
  tiles.append(attentionTile);
  drawer.append(tiles);

  if (releaseId) {
    const foot = el("div", undefined, "parcel-drawer-foot");
    foot.append(el("span", labels.t("parcel.verified", { id: releaseId }), "parcel-verified"));
    drawer.append(foot);
  }
  drawer.append(detail);
  return drawer;
}
