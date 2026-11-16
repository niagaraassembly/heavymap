/* The /map/ bottom bar and top-bar menus: the Desks split-button's drop-up
 * sitemap and the place selector's dropdown. Both are progressive
 * enhancement over links: without JavaScript the Desks word still links to
 * /desks/ and the place button simply does nothing. */

function mountMenu(root, { toggleAttr, panelAttr }) {
  const toggle = root.querySelector(`[${toggleAttr}]`);
  const panel = root.querySelector(`[${panelAttr}]`);
  if (!toggle || !panel) return;
  const open = () => {
    panel.hidden = false;
    toggle.setAttribute("aria-expanded", "true");
    const first = panel.querySelector("a, [role='option']");
    if (first) first.focus();
  };
  const close = ({ focusToggle = true } = {}) => {
    panel.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
    if (focusToggle) toggle.focus();
  };
  toggle.addEventListener("click", () =>
    panel.hidden ? open() : close({ focusToggle: false }),
  );
  root.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !panel.hidden) close();
  });
  document.addEventListener("click", (e) => {
    if (!panel.hidden && !root.contains(e.target))
      close({ focusToggle: false });
  });
}

export function mountMapBars() {
  for (const root of document.querySelectorAll("[data-desks-menu]"))
    mountMenu(root, { toggleAttr: "data-desks-toggle", panelAttr: "data-desks-panel" });
  for (const root of document.querySelectorAll("[data-place-selector]"))
    mountMenu(root, { toggleAttr: "data-place-button", panelAttr: "data-place-panel" });
}
