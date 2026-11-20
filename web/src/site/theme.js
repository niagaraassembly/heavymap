/* Theme and mode choice (spec D sections 5–7, decisions 5, 6, 32, 34, 38, 39).
 *
 * resolveTheme() is self-contained on purpose: headScript() inlines its source
 * into <head> so the theme and mode are set before first paint. Keep it free
 * of imports and outer references. */

export const THEME_KEY = "heavymap-theme-v1";

/**
 * Which theme and mode to show.
 * @param {{id:string,country:string,modes:string[]}[]} themes  themes available in this build
 * @param {string} fallback      the default theme id
 * @returns {{theme:string, mode:"light"|"dark", source:"choice"|"hint"|"default"}}
 */
export function resolveTheme(themes, fallback) {
  var byId = {};
  for (var i = 0; i < themes.length; i++) byId[themes[i].id] = themes[i];
  // Locale and appearance are fixed to the initial US English light experience.
  var theme = byId.us ? "us" : byId[fallback] ? fallback : themes[0].id;
  return {
    theme: theme,
    mode: "light",
    source: "default",
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
  return `<script>(function(){var r=(${resolveTheme.toString()})(${list},${JSON.stringify(fallback)});var h=document.documentElement;h.setAttribute("data-theme",r.theme);h.setAttribute("data-mode",r.mode);h.setAttribute("data-theme-source",r.source)})()</script>`;
}
