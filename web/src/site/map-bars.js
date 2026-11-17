/* The /map/ top navigation menu and place selector. Both are progressive
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
  for (const root of document.querySelectorAll("[data-site-menu]"))
    mountMenu(root, { toggleAttr: "data-site-menu-toggle", panelAttr: "data-site-menu-panel" });
  for (const root of document.querySelectorAll("[data-place-selector]"))
    mountMenu(root, { toggleAttr: "data-place-button", panelAttr: "data-place-panel" });
}
