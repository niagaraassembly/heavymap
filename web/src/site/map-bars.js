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

  const header = document.querySelector(".alt-header--map");
  const toggle = header?.querySelector("[data-search-toggle]");
  const box = header?.querySelector("[data-map-searchbox]");
  const input = box?.querySelector("input[type='search']");
  const close = box?.querySelector("[data-search-close]");
  if (!header || !toggle || !box || !input || !close) return;

  const setOpen = (open) => {
    header.classList.toggle("search-open", open);
    box.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
    if (open) input.focus({ preventScroll: true });
    else toggle.focus({ preventScroll: true });
  };
  toggle.setAttribute("aria-expanded", "false");
  toggle.addEventListener("click", () => setOpen(true));
  close.addEventListener("click", () => setOpen(false));
  box.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      setOpen(false);
    }
  });
}
