/* Label lookup (contract CN-06, drafts/wave-1/contract-label-lookup.md).
 * Wording lives in labels/<domain>.<locale>.json, never in data. A key never
 * changes meaning. A locale entry is used only if reviewed or approved
 * (D-062); otherwise English is shown and marked as a fallback. A missing key
 * shows the key itself and is reported. */

import { sha256Hex } from "./hash.js";

const SHOWABLE = new Set(["reviewed", "approved"]);

const defaultFetchBytes = async (url) => {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url}: ${r.status}`);
  return new Uint8Array(await r.arrayBuffer());
};

/** Load and verify label files. `index` is labels/index.json: {files:[{path, sha256}]}. */
export async function loadLabels({
  base = "labels/",
  locales = ["en"],
  fetchBytes = defaultFetchBytes,
  onReport = () => {},
} = {}) {
  const byLocale = {};
  let index;
  try {
    index = JSON.parse(new TextDecoder().decode(await fetchBytes(base + "index.json")));
  } catch (e) {
    onReport({ kind: "labels_index_unavailable", detail: String(e) });
    return createLabels({ entries: {}, onReport });
  }
  for (const f of index.files ?? []) {
    const locale = f.locale;
    if (!locales.includes(locale)) continue;
    try {
      const bytes = await fetchBytes(base + f.path);
      if ((await sha256Hex(bytes)) !== f.sha256) throw new Error("hash mismatch");
      const doc = JSON.parse(new TextDecoder().decode(bytes));
      Object.assign((byLocale[locale] ??= {}), doc.entries);
    } catch (e) {
      onReport({ kind: "labels_file_unavailable", path: f.path, detail: String(e) });
    }
  }
  return createLabels({ entries: byLocale, locale: locales[0], onReport });
}

export function createLabels({ entries, locale = "en", fallbackLocale = "en", onReport = () => {} }) {
  const plural = new Intl.PluralRules(locale);
  const fill = (template, params, key) =>
    template.replace(/\{(\w+)\}/g, (whole, name) => {
      if (params[name] === undefined) {
        onReport({ kind: "label_param_missing", key, param: name });
        return whole;
      }
      return String(params[name]);
    });
  function pick(key) {
    const own = entries[locale]?.[key];
    if (own && (locale === fallbackLocale || SHOWABLE.has(own.status))) return { entry: own, fallback: false };
    const base = entries[fallbackLocale]?.[key];
    if (base) return { entry: base, fallback: locale !== fallbackLocale };
    return null;
  }
  /** Full result: {text, fallback, missing}. */
  function lookup(key, params = {}) {
    const hit = pick(key);
    if (!hit) {
      onReport({ kind: "label_missing", key });
      return { text: key, fallback: false, missing: true };
    }
    let t = hit.entry.text;
    if (typeof t === "object") {
      const form = plural.select(Number(params.n ?? params.count ?? 0));
      t = t[form] ?? t.other;
    }
    return { text: fill(t, params, key), fallback: hit.fallback, missing: false };
  }
  return { lookup, t: (key, params) => lookup(key, params).text, has: (key) => pick(key) !== null };
}
