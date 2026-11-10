/* The header theme selector (spec D section 5): a listbox button with a
 * "Recent" group, a mode control for themes with a dark variant (section 7.1),
 * and "Reset to automatic". Prebuilt markup is hidden until this runs. */

import { escapeHtml as esc } from "../desk/escape.js";
import {
  pickTheme,
  readStored,
  resetTheme,
  resolveTheme,
  setMode,
  writeStored,
} from "./theme.js";

const html = document.documentElement;

export function mountThemePicker(root, themes, fallback) {
  if (!root || !themes.length) return;
  const button = root.querySelector("[data-theme-button]");
  const panel = root.querySelector("[data-theme-panel]");
  const list = root.querySelector('[role="listbox"]');
  const modeBox = root.querySelector("[data-theme-modes]");
  const status = root.querySelector('[role="status"]');
  const byId = Object.fromEntries(themes.map((t) => [t.id, t]));
  const darkQuery = matchMedia("(prefers-color-scheme: dark)");
  let active = -1;

  const current = () =>
    resolveTheme(
      readStored(localStorage),
      navigator.languages ?? [],
      darkQuery.matches,
      themes,
      fallback,
    );

  function apply() {
    const r = current();
    html.dataset.theme = r.theme;
    html.dataset.mode = r.mode;
    html.dataset.themeSource = r.source;
    const name = byId[r.theme].name;
    button.querySelector("[data-theme-name]").textContent = name;
    button.setAttribute("aria-label", `Site theme: ${name}`);
    modeBox.hidden = !byId[r.theme].modes.includes("dark");
    root.querySelector("[data-theme-only-light]").hidden = !modeBox.hidden;
    const mode = readStored(localStorage)?.mode ?? "auto";
    for (const input of modeBox.querySelectorAll("input"))
      input.checked = input.value === mode;
    render(r.theme);
  }

  function render(currentId) {
    const stored = readStored(localStorage);
    // Recent: explicit picks only (decision 5); seeded with USA + Canada when empty (decision 6).
    let recent = (stored?.recent ?? []).filter((id) => byId[id]);
    if (!recent.length) recent = ["us", "ca"].filter((id) => byId[id]);
    const showRecent = !(recent.length === 1 && recent[0] === currentId);
    const option = (t, prefix) =>
      `<li role="option" id="hm-theme-${prefix}-${esc(t.id)}" data-id="${esc(t.id)}" aria-selected="${t.id === currentId}">${esc(t.name)}</li>`;
    const all = [...themes].sort((a, b) => a.name.localeCompare(b.name));
    list.innerHTML =
      (showRecent
        ? `<li role="presentation" class="hm-theme-group">Recent</li>${recent.map((id) => option(byId[id], "r")).join("")}`
        : "") +
      `<li role="presentation" class="hm-theme-group">All themes</li>${all.map((t) => option(t, "a")).join("")}`;
    active = -1;
  }

  const options = () => [...list.querySelectorAll('[role="option"]')];
  function setActive(i) {
    const opts = options();
    if (!opts.length) return;
    active = (i + opts.length) % opts.length;
    opts.forEach((o, n) => o.classList.toggle("is-active", n === active));
    list.setAttribute("aria-activedescendant", opts[active].id);
    opts[active].scrollIntoView({ block: "nearest" });
  }
  function open() {
    panel.hidden = false;
    button.setAttribute("aria-expanded", "true");
    const sel = options().findIndex(
      (o) => o.getAttribute("aria-selected") === "true",
    );
    list.focus();
    setActive(Math.max(sel, 0));
  }
  function close({ focusButton = true } = {}) {
    panel.hidden = true;
    button.setAttribute("aria-expanded", "false");
    list.removeAttribute("aria-activedescendant");
    if (focusButton) button.focus();
  }
  function choose(id) {
    writeStored(localStorage, pickTheme(readStored(localStorage), id));
    apply();
    status.textContent = `Theme: ${byId[id].name}`;
    close();
  }

  button.addEventListener("click", () => (panel.hidden ? open() : close()));
  list.addEventListener("click", (e) => {
    const o = e.target.closest('[role="option"]');
    if (o) choose(o.dataset.id);
  });
  list.addEventListener("keydown", (e) => {
    const opts = options();
    if (e.key === "ArrowDown") setActive(active + 1);
    else if (e.key === "ArrowUp") setActive(active - 1);
    else if (e.key === "Home") setActive(0);
    else if (e.key === "End") setActive(opts.length - 1);
    else if (e.key === "Enter" || e.key === " ") {
      if (opts[active]) choose(opts[active].dataset.id);
    } else if (e.key === "Escape") close();
    else if (/^[a-z]$/i.test(e.key)) {
      const i = opts.findIndex(
        (o, n) =>
          n > active &&
          o.textContent.toLowerCase().startsWith(e.key.toLowerCase()),
      );
      const j =
        i !== -1
          ? i
          : opts.findIndex((o) =>
              o.textContent.toLowerCase().startsWith(e.key.toLowerCase()),
            );
      if (j !== -1) setActive(j);
    } else return;
    e.preventDefault();
  });
  root.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !panel.hidden) close();
  });
  document.addEventListener("click", (e) => {
    if (!panel.hidden && !root.contains(e.target))
      close({ focusButton: false });
  });
  modeBox.addEventListener("change", (e) => {
    writeStored(
      localStorage,
      setMode(readStored(localStorage), e.target.value),
    );
    apply();
  });
  root.querySelector("[data-theme-reset]").addEventListener("click", () => {
    writeStored(localStorage, resetTheme(readStored(localStorage)));
    apply();
    status.textContent = "Theme set automatically";
    close();
  });
  darkQuery.addEventListener("change", apply);
  addEventListener("storage", (e) => {
    if (e.key === "heavymap-theme-v1") apply();
  });

  root.hidden = false;
  apply();
}
