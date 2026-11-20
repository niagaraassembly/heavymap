/* Country and language selector shell. Only US English is available yet. */

import { escapeHtml as esc } from "../desk/escape.js";

export function mountThemePicker(root, themes) {
  if (!root || !themes.length) return;
  const button = root.querySelector("[data-theme-button]");
  const panel = root.querySelector("[data-theme-panel]");
  const byId = Object.fromEntries(themes.map((theme) => [theme.id, theme]));
  const current = byId.us ?? themes[0];
  const flag = button.querySelector("[data-theme-flag]");
  if (flag) flag.src = `/${current.flag}`;
  button.setAttribute("aria-label", "Language: USA, English (US)");
  panel.innerHTML = `<p class="hm-language-heading">Language</p><ul class="hm-country-list" aria-label="Country">${themes.map((theme) => `<li class="${theme.id === current.id ? "is-current" : "is-unavailable"}"${theme.id !== current.id ? ' aria-disabled="true"' : ""}><img class="hm-flag" src="/${esc(theme.flag)}" alt="" height="12"><span>${theme.id === "us" ? "USA" : esc(theme.name)}</span>${theme.id === current.id ? '<span class="hm-language-check" aria-label="Selected">✓</span>' : ""}</li>`).join("")}</ul><p class="hm-language-change" aria-disabled="true">Change</p><hr><ul class="hm-language-options" aria-label="Language options"><li class="is-current" aria-current="true"><span>English (US)</span><span class="hm-language-check" aria-label="Selected">✓</span></li><li class="is-unavailable" aria-disabled="true">Spanish (US)</li></ul>`;
  const open = () => {
    panel.hidden = false;
    button.setAttribute("aria-expanded", "true");
  };
  const close = () => {
    panel.hidden = true;
    button.setAttribute("aria-expanded", "false");
  };
  button.addEventListener("click", () => panel.hidden ? open() : close());
  root.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !panel.hidden) {
      close();
      button.focus();
    }
  });
  document.addEventListener("click", (event) => {
    if (!panel.hidden && !root.contains(event.target)) close();
  });
  root.hidden = false;
}
