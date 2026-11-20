/* Client behaviour shared by every prebuilt page. Pages work without it;
 * this adds conveniences. Reader and history arrive in build step 4. */
import "./styles.css";
if (document.body.classList.contains("hm-home")) {
  void import("../journey/journey.css");
}
import { mountThemePicker } from "./theme-picker.js";
import { mountMapBars } from "./map-bars.js";
import { mountLocalAccount } from "./local-account.js";
import { mountReader } from "./reader-page.js";
import {
  attachArticle,
  attachEdition,
  mountResume,
} from "./reading-surfaces.js";
import { createStore, readCatalogue } from "./reading-store.js";
import { SIGNUP } from "./signup-config.js";
import { mountSignup } from "./signup.js";
import { mountDocsService } from "./docs-service.js";

const picker = document.querySelector("[data-theme-picker]");
if (picker) {
  try {
    mountThemePicker(
      picker,
      JSON.parse(picker.dataset.themes),
    );
  } catch {
    /* The page keeps the theme the head script chose. */
  }
}

/* The /map/ bottom bar and top-bar menus (Desks drop-up, place selector). */
mountMapBars();
mountLocalAccount();
void mountDocsService(document.querySelector("[data-docs-service]"));

/* Home: the page is a sheet over the Hamilton map. Choosing the map drops the sheet, slims the
 * header into the map's bar, then opens /map/. A plain link underneath, so it works without this. */
const homeMap = document.querySelector("[data-home-map]");
if (homeMap) {
  homeMap.addEventListener("click", (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    event.preventDefault();
    document.body.classList.add("hm-home-leaving");
    setTimeout(() => { location.href = homeMap.href; }, 620);
  });
  /* Coming back with the browser's Back button can restore the dropped page from cache. */
  addEventListener("pageshow", (event) => { if (event.persisted) document.body.classList.remove("hm-home-leaving"); });
}

/* The service dock's site directory is a large, keyboard-friendly site map. */
const directoryScrim = document.querySelector("[data-directory-scrim]");
const directoryToggle = document.querySelector("[data-directory-toggle]");
const directoryPanel = document.querySelector("#hm-site-directory");
const directoryClose = document.querySelector("[data-directory-close]");
if (directoryScrim && directoryToggle && directoryPanel && directoryClose) {
  let directoryReturnFocus = null;
  const closeDirectory = () => {
    directoryScrim.hidden = true;
    directoryToggle.setAttribute("aria-expanded", "false");
    directoryToggle.setAttribute("aria-label", "Open site directory");
    directoryToggle.title = "Open site directory";
    document.body.classList.remove("hm-directory-open");
    directoryReturnFocus?.focus();
  };
  directoryToggle.addEventListener("click", () => {
    directoryReturnFocus = directoryToggle;
    directoryScrim.hidden = false;
    directoryToggle.setAttribute("aria-expanded", "true");
    directoryToggle.setAttribute("aria-label", "Close site directory");
    directoryToggle.title = "Close site directory";
    document.body.classList.add("hm-directory-open");
    directoryPanel.focus();
  });
  directoryClose.addEventListener("click", closeDirectory);
  directoryScrim.addEventListener("click", (event) => {
    if (event.target === directoryScrim) closeDirectory();
  });
  document.addEventListener("keydown", (event) => {
    if (directoryScrim.hidden) return;
    if (event.key === "Escape") {
      event.preventDefault();
      closeDirectory();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = [...directoryPanel.querySelectorAll('a[href], button:not([disabled])')];
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && (document.activeElement === first || document.activeElement === directoryPanel)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
}

/* Edition cards: "Copy link" copies the card's permalink. */
document.addEventListener("click", async (e) => {
  const button = e.target.closest?.("[data-copy-link]");
  if (!button) return;
  const id = button.getAttribute("data-copy-link").replace(/^wny-/, "");
  const url = `${location.origin}/read/${encodeURIComponent(id)}/`;
  try {
    await navigator.clipboard.writeText(url);
    button.textContent = "Link copied";
  } catch {
    button.textContent = url;
  }
});

/* Reading history on every reading surface (spec C, D11). */
const catalogue = readCatalogue();
if (catalogue) {
  const store = createStore(catalogue);
  const reader = document.querySelector("[data-reader]");
  const article = document.querySelector("main article[data-item-id]");
  const edition = document.querySelector("[data-edition]");
  const resume = document.querySelector("[data-resume]");
  if (reader) mountReader(store, reader);
  else if (article) attachArticle(store, article, { via: "read" });
  if (edition) attachEdition(store, edition);
  if (resume) mountResume(store, resume);
}

/* Per-Desk signup forms (spec E). /subscribe/?desk=<slug> ticks that Desk. */
const wanted = new URLSearchParams(location.search).get("desk");
for (const form of document.querySelectorAll("[data-signup]")) {
  const knownDesks = [...form.querySelectorAll('[data-field="desk"]')].map(
    (i) => i.value,
  );
  if (wanted && knownDesks.includes(wanted))
    form.querySelector(
      `[data-field="desk"][value="${CSS.escape(wanted)}"]`,
    ).checked = true;
  mountSignup(form, {
    action: SIGNUP.action,
    entries: SIGNUP.entries,
    knownDesks,
  });
}
