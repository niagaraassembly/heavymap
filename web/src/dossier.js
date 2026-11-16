import { bands, labels, packet, refusalText } from "./fixtures.js";
import { adaptDossierRecord } from "./dossier-adapter.js";
import { formatAreaShare } from "./contract.js";

export function el(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

export function renderDossier(parcel, container) {
  container.replaceChildren();
  // Identity header: pinned while the bands scroll, with the band index
  // under it. Buttons, not links: an href="#band-x" would clobber the
  // #parcel= deep link.
  const order = parcel.bandOrder ?? bands;
  const bandLabels = parcel.bandLabels ?? labels;
  const identity = el("header", undefined, "dossier-identity");
  identity.append(el("h2", parcel.name, "dossier-title"));
  // The address line is skipped when the title already is the address
  // (real records carry no name, so the address is the title).
  if (parcel.address && parcel.address !== parcel.name) {
    identity.append(el("p", parcel.address, "address"));
  }
  identity.append(
    el("p", `${parcel.grain} · ${parcel.jurisdiction}`, "subtext"),
    el("p", parcel.id, "spine-key"),
  );
  const nav = el("nav", undefined, "dossier-bands");
  nav.setAttribute("aria-label", "Dossier bands");
  for (const [index, band] of order.entries()) {
    const link = el(
      "button",
      `${String(index + 1).padStart(2, "0")} ${bandLabels[band]}`,
      "dossier-band-link",
    );
    link.addEventListener("click", () => {
      const section = container.querySelector(`[data-band="${band}"]`);
      if (!section) return;
      section.scrollIntoView({
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      });
    });
    nav.append(link);
  }
  identity.append(nav);
  container.append(identity);
  if (parcel.synthetic) {
    const note = el("div", undefined, "sample-note");
    note.append(
      el("strong", "A sample, not a site finding."),
      el("p", "Every geometry, class and share here is invented to test how evidence reads."),
    );
    container.append(note);
  }

  for (const [index, band] of order.entries()) {
    const section = el("section", undefined, "band");
    section.dataset.band = band;
    section.id = `band-${band}`;
    section.append(
      el("span", String(index + 1).padStart(2, "0"), "band-number"),
      el("h3", bandLabels[band]),
    );
    for (const claim of parcel.bands[band].claims) {
      const card = el("article", undefined, `claim ${claim.community ? "community" : ""}`);
      const meta = [claim.grade, claim.state].filter(Boolean).join(" · ");
      if (meta) card.append(el("p", `${meta}${claim.community ? " · community input" : ""}`, "claim-meta"));
      const headingText = claim.kind === "state"
        ? `${claim.label}: ${claim.value}`
        : `${claim.label}: “${claim.value}”`;
      card.append(el("h4", headingText));
      if (claim.share !== undefined) {
        const meter = el("div", undefined, "share");
        const fill = el("span");
        fill.style.width = `${claim.share * 100}%`;
        meter.append(fill);
        card.append(
          el("p", `${formatAreaShare(claim.share, claim.m2 ?? claim.stamp?.inputs?.intersection_m2)} of parcel area`, "share-label"),
          meter,
        );
      }
      if (claim.comment) card.append(el("p", claim.comment, "claim-comment"));
      if (claim.confidence) card.append(el("p", claim.confidence, "confidence"));
      if (claim.stamp && Object.keys(claim.stamp).length) {
        const details = el("details", undefined, "evidence");
        details.append(el("summary", "Source & method"));
        const dl = el("dl");
        for (const [key, value] of Object.entries(claim.stamp)) {
          dl.append(
            el("dt", claim.stampLabels?.[key] ?? key.replaceAll("_", " ")),
            el("dd", typeof value === "object" && value !== null ? JSON.stringify(value) : String(value)),
          );
        }
        details.append(dl);
        card.append(details);
      }
      section.append(card);
    }
    for (const item of parcel.bands[band].refusals) {
      const row = el("div", undefined, "refusal");
      row.append(
        el("strong", item.object),
        el("p", item.text ?? refusalText[item.reason] ?? item.reason),
        el("code", item.reason),
      );
      section.append(row);
    }
    if (band === "derived_readings" && parcel.next) {
      const next = el("div", undefined, "next-check");
      next.append(el("strong", "Your next check"), el("p", parcel.next));
      section.append(next);
    }
    if (band === "share_export" && parcel.synthetic) {
      const button = el("button", "Save local evidence JSON", "export");
      button.addEventListener("click", () => {
        const url = URL.createObjectURL(
          new Blob([JSON.stringify(packet(parcel), null, 2)], { type: "application/json" }),
        );
        const a = el("a");
        a.href = url;
        a.download = `heavymap-synthetic-${parcel.short}.json`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      });
      section.append(
        button,
        el("p", "Includes every claim, stamp and refusal above. Synthetic fixture only.", "subtext"),
      );
    }
    container.append(section);
  }
}

/** Render a verified schema 2 record through the shared dossier view model. */
export function renderSchema2Dossier(core, detail, labelSet, container) {
  renderDossier(adaptDossierRecord(core, detail, labelSet), container);
}

/** Load one pinned schema 2 record and render it; call on parcel selection. */
export async function renderSchema2DossierFromLoader(loader, key, labelSet, container) {
  const coreResult = await loader.core(key);
  if (!coreResult.ok) return coreResult;

  const detailResult = await loader.detail(key);
  const parcel = adaptDossierRecord(
    coreResult.record,
    detailResult.ok ? detailResult.record : null,
    labelSet,
  );
  renderDossier(parcel, container);
  return {
    ok: true,
    release: coreResult.release,
    detail: detailResult,
  };
}
