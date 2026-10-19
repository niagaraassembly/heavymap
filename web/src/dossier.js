import { bands, labels, packet, refusalText } from "./fixtures.js";
import { formatAreaShare } from "./contract.js";
export function el(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}
export function renderDossier(parcel, container) {
  container.replaceChildren();
  container.append(
    el("h2", parcel.name, "dossier-title"),
    el("p", parcel.address, "address"),
    el("p", `${parcel.grain} · ${parcel.jurisdiction}`, "subtext"),
    el("p", parcel.id, "spine-key"),
  );
  const note = el("div", undefined, "sample-note");
  note.append(
    el("strong", "A sample, not a site finding."),
    el(
      "p",
      "Every geometry, class and share here is invented to test how evidence reads.",
    ),
  );
  container.append(note);
  for (const [index, band] of bands.entries()) {
    const section = el("section", undefined, "band");
    section.dataset.band = band;
    section.append(
      el("span", String(index + 1).padStart(2, "0"), "band-number"),
      el("h3", labels[band]),
    );
    for (const claim of parcel.bands[band].claims) {
      const card = el(
        "article",
        undefined,
        `claim ${claim.community ? "community" : ""}`,
      );
      card.append(
        el(
          "p",
          `${claim.grade} · ${claim.state}${claim.community ? " · community input" : ""}`,
          "claim-meta",
        ),
      );
      const heading = el("h4", `${claim.label}: “${claim.value}”`);
      card.append(heading);
      if (claim.share !== undefined) {
        const meter = el("div", undefined, "share");
        const fill = el("span");
        fill.style.width = `${claim.share * 100}%`;
        meter.append(fill);
        card.append(
          el(
            "p",
            `${formatAreaShare(claim.share, claim.m2 ?? claim.stamp.inputs?.intersection_m2)} of parcel area`,
            "share-label",
          ),
          meter,
        );
      }
      card.append(
        el("p", claim.comment, "claim-comment"),
        el("p", claim.confidence, "confidence"),
      );
      const details = el("details", undefined, "evidence");
      details.append(el("summary", "Source & method"));
      const dl = el("dl");
      for (const [key, value] of Object.entries(claim.stamp)) {
        dl.append(
          el("dt", key.replaceAll("_", " ")),
          el("dd", typeof value === "object" ? JSON.stringify(value) : value),
        );
      }
      details.append(dl);
      card.append(details);
      section.append(card);
    }
    for (const refusal of parcel.bands[band].refusals) {
      const row = el("div", undefined, "refusal");
      row.append(
        el("strong", refusal.object),
        el("p", refusalText[refusal.reason]),
        el("code", refusal.reason),
      );
      section.append(row);
    }
    if (band === "derived_readings") {
      const next = el("div", undefined, "next-check");
      next.append(el("strong", "Your next check"), el("p", parcel.next));
      section.append(next);
    }
    if (band === "share_export") {
      const button = el("button", "Save local evidence JSON", "export");
      button.addEventListener("click", () => {
        const url = URL.createObjectURL(
          new Blob([JSON.stringify(packet(parcel), null, 2)], {
            type: "application/json",
          }),
        );
        const a = el("a");
        a.href = url;
        a.download = `heavymap-synthetic-${parcel.short}.json`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      });
      section.append(
        button,
        el(
          "p",
          "Includes every claim, stamp and refusal above. Synthetic fixture only.",
          "subtext",
        ),
      );
    }
    container.append(section);
  }
}
