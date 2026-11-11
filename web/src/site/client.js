/* Client behaviour shared by every prebuilt page. Pages work without it;
 * this adds conveniences. Reader and history arrive in build step 4. */
import "./styles.css";
import { mountThemePicker } from "./theme-picker.js";
import { mountReader } from "./reader-page.js";
import {
  attachArticle,
  attachEdition,
  mountResume,
} from "./reading-surfaces.js";
import { createStore, readCatalogue } from "./reading-store.js";
import { SIGNUP } from "./signup-config.js";
import { mountSignup } from "./signup.js";

const picker = document.querySelector("[data-theme-picker]");
if (picker) {
  try {
    mountThemePicker(
      picker,
      JSON.parse(picker.dataset.themes),
      document.documentElement.dataset.theme || "us",
    );
  } catch {
    /* The page keeps the theme the head script chose. */
  }
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
