import "maplibre-gl/dist/maplibre-gl.css";
import "./style.css";
import { parcels, lenses, layerRegistry, matchesLens } from "./fixtures.js";
import { el, renderDossier } from "./dossier.js";
import { FieldMap } from "./map.js";
let lens = "all",
  query = "",
  selected = null,
  opener = null;
const panel = document.getElementById("dossier"),
  tooltip = document.getElementById("tooltip");
function status(text) {
  document.getElementById("map-status").textContent = text;
}
const map = new FieldMap(parcels, select, hover, (text) => {
  const key = new URLSearchParams(location.hash.slice(1)).get("parcel");
  if (key && !parcels.some((p) => p.id === key))
    status("Unknown sample key — choose one of the three invented parcels.");
  else status(text);
});
function hover(p, anchor) {
  tooltip.hidden = !p;
  if (!p) return;
  tooltip.replaceChildren(
    el("strong", `Sample ${p.short} · parcel`),
    el(
      "span",
      `${p.bands.land_use.claims[0].label}: “${p.bands.land_use.claims[0].value}”`,
    ),
    el("small", "Joined · illustrative overlap · review required"),
  );
  const r = anchor.getBoundingClientRect();
  tooltip.style.left = `${Math.max(10, Math.min(innerWidth - 310, r.left - 125))}px`;
  tooltip.style.top = `${Math.max(70, r.top - 100)}px`;
}
function select(p, trigger) {
  selected = p;
  opener = trigger || opener;
  panel.hidden = false;
  hover(null);
  document.body.classList.add("has-dossier");
  renderDossier(p, document.getElementById("dossier-body"));
  document.getElementById("dossier-body").scrollTop = 0;
  document.getElementById("tray").classList.remove("mobile-open");
  document.getElementById("tray-toggle").setAttribute("aria-expanded", "false");
  map.select(p);
  map.setLens(lens);
  history.replaceState(null, "", `#parcel=${encodeURIComponent(p.id)}`);
  document.getElementById("close").focus({ preventScroll: true });
}
function close() {
  if (!selected) return;
  panel.hidden = true;
  document.body.classList.remove("has-dossier");
  selected = null;
  map.close();
  map.setLens(lens);
  history.replaceState(null, "", location.pathname + location.search);
  if (opener?.isConnected && !opener.hidden)
    opener.focus({ preventScroll: true });
  else document.getElementById("search").focus({ preventScroll: true });
}
function results() {
  const holder = document.getElementById("samples");
  holder.replaceChildren();
  const visible = parcels.filter(
    (p) =>
      matchesLens(p, lens) &&
      `${p.name} ${p.id} ${p.address} ${p.bands.identity.claims.map((c) => c.value).join(" ")}`
        .toLowerCase()
        .includes(query),
  );
  document.getElementById("result-count").textContent =
    `${visible.length} samples`;
  for (const p of visible) {
    const button = el("button", undefined, "sample");
    button.append(
      el("span", p.short, "sample-number"),
      el("span", p.name),
      el("span", "›", "sample-arrow"),
    );
    button.addEventListener("click", () => select(p, button));
    holder.append(button);
  }
  document.getElementById("search-status").textContent = visible.length
    ? "All examples are invented."
    : "No sample matches. Try a different lens or search.";
}
for (const l of lenses) {
  const button = el("button", undefined, "lens");
  button.dataset.lens = l.id;
  button.setAttribute("aria-pressed", String(lens === l.id));
  button.append(el("span", l.label), el("small", l.subtitle));
  button.addEventListener("click", () => {
    lens = l.id;
    document
      .querySelectorAll(".lens")
      .forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
    map.setLens(lens);
    results();
  });
  document.getElementById("lenses").append(button);
}
for (const l of layerRegistry) {
  const label = el("label", undefined, "layer");
  const checkbox = el("input");
  checkbox.type = "checkbox";
  checkbox.checked = l.on;
  checkbox.dataset.layer = l.id;
  checkbox.addEventListener("change", () => map.toggle(l.id, checkbox.checked));
  const text = el("span");
  text.append(el("strong", l.label), el("small", l.subtitle));
  label.append(checkbox, text);
  document.getElementById("layers").append(label);
}
document.getElementById("search").addEventListener("input", (e) => {
  query = e.target.value.trim().toLowerCase();
  results();
});
document.getElementById("search-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const first = document.querySelector("#samples button");
  if (first) first.click();
});
document.getElementById("close").addEventListener("click", close);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") close();
});
document
  .getElementById("palette")
  .addEventListener("change", (e) => map.setPalette(e.target.value));
document.getElementById("home").addEventListener("click", () => map.home());
document.getElementById("tray-toggle").addEventListener("click", (e) => {
  const open = document.getElementById("tray").classList.toggle("mobile-open");
  e.currentTarget.setAttribute("aria-expanded", String(open));
});
let resizeTimer;
addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => map.resize(), 150);
});
function route() {
  const key = new URLSearchParams(location.hash.slice(1)).get("parcel");
  if (!key) {
    close();
    return;
  }
  const p = parcels.find((p) => p.id === key);
  if (p) select(p);
  else {
    close();
    status("Unknown sample key — choose one of the three invented parcels.");
  }
}
results();
route();
addEventListener("hashchange", route);
// Read-only dev inspection aids for camera/fixture verification. No network APIs.
if (import.meta.env.DEV) window.__heavymap = { map: map.map, controller: map };
