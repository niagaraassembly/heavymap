// HeavyMap has its own history. Never read or overwrite Niagara Assembly's
// na-reader storage, subscription preferences, or any other application's keys.
export const STORAGE_KEY = "heavymap-reader-v1";
export const kinds = ["news", "findings", "editorials", "documentation", "all"];
export function freshState() {
  return {
    version: 1,
    current: null,
    progress: {},
    read: [],
    filters: { kind: "news", region: "all", query: "", unreadOnly: false },
  };
}
export function loadState(storage, items) {
  const clean = freshState(),
    ids = new Set(items.map((i) => i.id));
  try {
    const raw = JSON.parse(storage.getItem(STORAGE_KEY) || "null");
    if (!raw || raw.version !== 1) return clean;
    clean.current = ids.has(raw.current) ? raw.current : null;
    clean.read = Array.isArray(raw.read)
      ? [...new Set(raw.read.filter((id) => ids.has(id)))]
      : [];
    for (const [id, value] of Object.entries(raw.progress || {}))
      if (ids.has(id) && Number.isFinite(value))
        clean.progress[id] = Math.max(0, Math.min(1, value));
    const f = raw.filters || {};
    clean.filters = {
      kind: kinds.includes(f.kind) ? f.kind : "news",
      region: ["all", "western-new-york", "niagara-brant", "heavymap"].includes(
        f.region,
      )
        ? f.region
        : "all",
      query: typeof f.query === "string" ? f.query.slice(0, 120) : "",
      unreadOnly: f.unreadOnly === true,
    };
  } catch {
    /* Reader remains usable without persistence. */
  }
  return clean;
}
export function saveState(storage, state) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}
export function filterItems(items, state) {
  const { kind, region, query, unreadOnly } = state.filters;
  const q = query.toLocaleLowerCase();
  return items.filter(
    (i) =>
      (kind === "all" || i.kind === kind) &&
      (region === "all" || i.region === region) &&
      (!unreadOnly || !state.read.includes(i.id)) &&
      `${i.title} ${i.summary} ${i.publication}`
        .toLocaleLowerCase()
        .includes(q),
  );
}
