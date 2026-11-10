/* Theme and mode choice (spec D sections 5–7, decisions 5, 6, 32, 34, 38, 39).
 *
 * resolveTheme() is self-contained on purpose: headScript() inlines its source
 * into <head> so the theme and mode are set before first paint. Keep it free
 * of imports and outer references. */

export const THEME_KEY = "heavymap-theme-v1";

/**
 * Which theme and mode to show.
 * @param {object|null} stored   parsed heavymap-theme-v1, or null
 * @param {string[]} languages   navigator.languages
 * @param {boolean} prefersDark  prefers-color-scheme: dark
 * @param {{id:string,country:string,modes:string[]}[]} themes  themes available in this build
 * @param {string} fallback      the default theme id
 * @returns {{theme:string, mode:"light"|"dark", source:"choice"|"hint"|"default"}}
 */
export function resolveTheme(stored, languages, prefersDark, themes, fallback) {
  var byId = {};
  for (var i = 0; i < themes.length; i++) byId[themes[i].id] = themes[i];
  var theme = null;
  var source = "default";
  // 1. An explicit saved choice, if that theme is still available.
  if (stored && stored.version === 1 && byId[stored.choice]) {
    theme = stored.choice;
    source = "choice";
  }
  // 2. The first browser language with a region subtag that has a theme (decision 34).
  if (!theme) {
    for (var j = 0; j < (languages || []).length; j++) {
      var m = /^[a-z]{2,3}(?:-[A-Za-z]{4})?-([A-Za-z]{2})\b/.exec(
        languages[j] || "",
      );
      if (!m) continue;
      for (var k = 0; k < themes.length; k++) {
        if (themes[k].country === m[1].toUpperCase()) theme = themes[k].id;
      }
      if (theme) {
        source = "hint";
        break;
      }
    }
  }
  // 3. The default.
  if (!theme) theme = byId[fallback] ? fallback : themes[0].id;
  // Mode: kept across themes (decision 39); only a theme with a dark variant shows it.
  var wanted =
    stored && (stored.mode === "light" || stored.mode === "dark")
      ? stored.mode
      : "auto";
  var dark = wanted === "dark" || (wanted === "auto" && prefersDark);
  var hasDark = byId[theme].modes.indexOf("dark") !== -1;
  return {
    theme: theme,
    mode: dark && hasDark ? "dark" : "light",
    source: source,
  };
}

/** The stored record after an explicit theme pick: the pick goes first in `recent`, two distinct at most (decision 5). */
export function pickTheme(stored, id) {
  const base =
    stored?.version === 1
      ? stored
      : { version: 1, choice: null, recent: [], mode: "auto" };
  const recent = [id, ...(base.recent ?? []).filter((r) => r !== id)].slice(
    0,
    2,
  );
  return { ...base, version: 1, choice: id, recent };
}

/** "Reset to automatic": clears the choice, keeps recent and mode (spec D section 5). */
export function resetTheme(stored) {
  return stored?.version === 1 ? { ...stored, choice: null } : null;
}

export function setMode(stored, mode) {
  const base =
    stored?.version === 1
      ? stored
      : { version: 1, choice: null, recent: [], mode: "auto" };
  return { ...base, mode };
}

export function readStored(storage) {
  try {
    const raw = storage.getItem(THEME_KEY);
    const v = raw ? JSON.parse(raw) : null;
    return v && v.version === 1 ? v : null;
  } catch {
    return null;
  }
}

export function writeStored(storage, value) {
  try {
    if (value) storage.setItem(THEME_KEY, JSON.stringify(value));
    else storage.removeItem(THEME_KEY);
    return true;
  } catch {
    return false;
  }
}

/** The inline <head> script: sets data-theme and data-mode before first paint. */
export function headScript(themes, fallback) {
  const list = JSON.stringify(
    themes.map(({ id, country, modes }) => ({ id, country, modes })),
  );
  return `<script>(function(){var s=null;try{s=JSON.parse(localStorage.getItem(${JSON.stringify(THEME_KEY)}))}catch(e){}var d=false;try{d=matchMedia("(prefers-color-scheme: dark)").matches}catch(e){}var r=(${resolveTheme.toString()})(s,navigator.languages||[navigator.language],d,${list},${JSON.stringify(fallback)});var h=document.documentElement;h.setAttribute("data-theme",r.theme);h.setAttribute("data-mode",r.mode);h.setAttribute("data-theme-source",r.source)})()</script>`;
}
