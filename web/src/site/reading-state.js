/* Browser-local reading history, schema v2 (spec C section 6).
 * Pure functions over a plain state object, plus load/save against a
 * Storage-like object. No DOM. HeavyMap never touches Niagara Assembly's keys. */

export const READING_KEY = "heavymap-reading-v2";
export const LEGACY_KEY = "heavymap-reader-v1";
export const MAX_ITEMS = 500;
export const MAX_EDITIONS = 50;
export const KINDS = ["news", "finding", "documentation", "editorial", "all"];
export const DEFAULT_FILTERS = {
  kind: "news",
  region: "all",
  q: "",
  unread: false,
};

/** Second-precision timestamp. Spec C section 6.2 proposed minutes; seconds are
 *  needed so a read and an unread in the same minute still order correctly. */
export const stamp = (date = new Date()) =>
  date.toISOString().slice(0, 19) + "Z";
/** One second after `t`, so a new mark always sorts after the opposite one. */
const after = (t) => stamp(new Date(new Date(t).getTime() + 1000));
const atLeastAfter = (t, other) => (other && other >= t ? after(other) : t);

export function fresh() {
  return {
    version: 2,
    items: {},
    editions: {},
    last: null,
    filters: { ...DEFAULT_FILTERS },
    removed: {},
  };
}

export function normaliseFilters(f, regionSlugs = []) {
  const regions = ["all", "heavymap", ...regionSlugs];
  return {
    kind: KINDS.includes(f?.kind) ? f.kind : DEFAULT_FILTERS.kind,
    region: regions.includes(f?.region) ? f.region : "all",
    q: typeof f?.q === "string" ? f.q.slice(0, 120) : "",
    unread: f?.unread === true,
  };
}

/** read is true when readAt exists and is later than any unreadAt (spec C section 3.2). */
export const isRead = (entry) =>
  Boolean(entry?.r && (!entry.u || entry.r > entry.u));

/** Keep only well-formed entries for known IDs (spec C section 6.3). */
function clean(raw, known, regionSlugs) {
  const s = fresh();
  if (!raw || raw.version !== 2) return s;
  for (const [id, e] of Object.entries(raw.items ?? {})) {
    if (!known.has(id) || typeof e !== "object" || !e) continue;
    const p =
      e.p &&
      Number.isInteger(e.p.block) &&
      e.p.block >= 0 &&
      Number.isFinite(e.p.within)
        ? { block: e.p.block, within: Math.min(1, Math.max(0, e.p.within)) }
        : null;
    s.items[id] = {
      o: typeof e.o === "string" ? e.o : null,
      p,
      via: ["read", "reader", "edition"].includes(e.via) ? e.via : null,
      r: typeof e.r === "string" ? e.r : null,
      u: typeof e.u === "string" ? e.u : null,
    };
  }
  for (const [key, e] of Object.entries(raw.editions ?? {})) {
    if (typeof key === "string" && e && typeof e.o === "string")
      s.editions[key] = { o: e.o, at: typeof e.at === "string" ? e.at : null };
  }
  const last = raw.last;
  if (last?.kind === "item" && s.items[last.id])
    s.last = { kind: "item", id: last.id };
  if (last?.kind === "edition" && s.editions[last.id])
    s.last = { kind: "edition", id: last.id };
  s.filters = normaliseFilters(raw.filters, regionSlugs);
  for (const [id, t] of Object.entries(raw.removed ?? {})) {
    if (known.has(id) && typeof t === "string") s.removed[id] = t;
  }
  return s;
}

/** The prototype's heavymap-reader-v1, mapped once (spec C section 6.5). */
export function migrateV1(raw, known, t = stamp()) {
  const s = fresh();
  if (!raw || raw.version !== 1) return s;
  for (const id of Array.isArray(raw.read) ? raw.read : []) {
    if (known.has(id))
      s.items[id] = { o: t, p: null, via: null, r: t, u: null };
  }
  for (const id of Object.keys(raw.progress ?? {})) {
    if (known.has(id) && !s.items[id])
      s.items[id] = { o: t, p: null, via: null, r: null, u: null };
  }
  if (known.has(raw.current)) {
    s.items[raw.current] ??= { o: t, p: null, via: null, r: null, u: null };
    s.last = { kind: "item", id: raw.current };
  }
  const kind =
    { findings: "finding", editorials: "editorial" }[raw.filters?.kind] ??
    raw.filters?.kind;
  s.filters = normaliseFilters({
    kind,
    region: raw.filters?.region,
    q: raw.filters?.query,
    unread: raw.filters?.unreadOnly,
  });
  return s;
}

/**
 * Read state from storage. Returns { state, persistent }: persistent is false
 * when storage is unavailable, and the caller keeps state in memory.
 */
export function load(storage, known, regionSlugs = []) {
  try {
    const raw = storage.getItem(READING_KEY);
    if (raw)
      return {
        state: clean(JSON.parse(raw), known, regionSlugs),
        persistent: true,
      };
    const legacy = storage.getItem(LEGACY_KEY);
    if (legacy) {
      const state = migrateV1(JSON.parse(legacy), known);
      storage.setItem(READING_KEY, JSON.stringify(state));
      storage.removeItem(LEGACY_KEY);
      return { state, persistent: true };
    }
    return { state: fresh(), persistent: true };
  } catch {
    try {
      storage.getItem(READING_KEY);
      return { state: fresh(), persistent: true }; // malformed JSON: start fresh
    } catch {
      return { state: fresh(), persistent: false };
    }
  }
}

const later = (a, b) => ((a ?? "") >= (b ?? "") ? a : b);

/** Merge two states per item: latest open wins position and surface; r and u keep their latest (spec C section 6.3). */
export function merge(mine, theirs) {
  const out = {
    ...mine,
    items: { ...theirs.items },
    editions: { ...theirs.editions },
  };
  for (const [id, a] of Object.entries(mine.items)) {
    const b = theirs.items[id];
    if (!b) {
      out.items[id] = a;
      continue;
    }
    const newer = (a.o ?? "") >= (b.o ?? "") ? a : b;
    out.items[id] = {
      o: later(a.o, b.o),
      p: newer.p,
      via: newer.via,
      r: later(a.r, b.r),
      u: later(a.u, b.u),
    };
  }
  for (const [key, a] of Object.entries(mine.editions)) {
    const b = theirs.editions[key];
    out.editions[key] = !b || a.o >= b.o ? a : b;
  }
  const lastTime = (s) =>
    s.last
      ? s.last.kind === "item"
        ? s.items[s.last.id]?.o
        : s.editions[s.last.id]?.o
      : null;
  out.last =
    (lastTime(mine) ?? "") >= (lastTime(theirs) ?? "")
      ? mine.last
      : theirs.last;
  // Removals win over entries opened before them, in either tab (decision 29).
  out.removed = { ...(theirs.removed ?? {}) };
  for (const [id, t] of Object.entries(mine.removed ?? {})) {
    out.removed[id] = later(t, out.removed[id]);
  }
  for (const [id, t] of Object.entries(out.removed)) {
    const e = out.items[id];
    if (e && (e.o ?? "") <= t) delete out.items[id];
    if (!out.items[id] && out.last?.kind === "item" && out.last.id === id)
      out.last = null;
  }
  return out;
}

/** Caps: 500 items (drop oldest, read entries last), 50 editions (spec C section 6.3). */
export function prune(state, maxItems = MAX_ITEMS) {
  const gone = Object.keys(state.removed ?? {});
  if (gone.length > maxItems) {
    gone.sort((x, y) => state.removed[x].localeCompare(state.removed[y]));
    for (const id of gone.slice(0, gone.length - maxItems))
      delete state.removed[id];
  }
  const ids = Object.keys(state.items);
  if (ids.length > maxItems) {
    const order = ids.sort((a, b) => {
      const ra = isRead(state.items[a]) ? 1 : 0;
      const rb = isRead(state.items[b]) ? 1 : 0;
      return (
        ra - rb ||
        (state.items[a].o ?? "").localeCompare(state.items[b].o ?? "")
      );
    });
    for (const id of order.slice(0, ids.length - maxItems))
      delete state.items[id];
    if (state.last?.kind === "item" && !state.items[state.last.id])
      state.last = null;
  }
  const keys = Object.keys(state.editions);
  if (keys.length > MAX_EDITIONS) {
    keys.sort((a, b) => state.editions[a].o.localeCompare(state.editions[b].o));
    for (const k of keys.slice(0, keys.length - MAX_EDITIONS))
      delete state.editions[k];
    if (state.last?.kind === "edition" && !state.editions[state.last.id])
      state.last = null;
  }
  return state;
}

/**
 * Read-modify-write: merge with what another tab may have written, prune,
 * write. On quota errors prune to 250 and retry once. Returns the merged state,
 * or null when storage can't be written.
 */
export function save(storage, state, known) {
  let merged = state;
  try {
    const raw = storage.getItem(READING_KEY);
    if (raw) merged = merge(state, clean(JSON.parse(raw), known));
  } catch {
    /* Unreadable: our state wins. */
  }
  merged.filters = state.filters;
  prune(merged);
  try {
    storage.setItem(READING_KEY, JSON.stringify(merged));
    return merged;
  } catch {
    try {
      prune(merged, 250);
      storage.setItem(READING_KEY, JSON.stringify(merged));
      return merged;
    } catch {
      return null;
    }
  }
}

/* ---- events (spec C section 3) ------------------------------------------ */

const entry = (s, id) =>
  (s.items[id] ??= { o: null, p: null, via: null, r: null, u: null });

/** `suppressed` is the page view's in-memory set of items marked unread (spec C section 3.2). */
export function opened(s, id, via, t = stamp(), suppressed) {
  const e = entry(s, id);
  e.o = t;
  e.via = via;
  s.last = { kind: "item", id };
  suppressed?.delete(id);
  return s;
}

export function progressed(s, id, position) {
  entry(s, id).p = position;
  return s;
}

/** Reaching the end marks read unless the reader marked it unread in this view. */
export function endReached(s, id, t = stamp(), suppressed) {
  if (suppressed?.has(id)) return s;
  const e = entry(s, id);
  if (!isRead(e)) e.r = atLeastAfter(t, e.u);
  return s;
}

export function markRead(s, id, t = stamp(), suppressed) {
  const e = entry(s, id);
  e.r = atLeastAfter(t, e.u);
  suppressed?.delete(id);
  return s;
}

export function markUnread(s, id, t = stamp(), suppressed) {
  const e = entry(s, id);
  e.u = atLeastAfter(t, e.r);
  suppressed?.add(id);
  return s;
}

/** Per-item removal (decision 29). Returns the removed entry, for Undo. */
export function remove(s, id, t = stamp()) {
  const removed = s.items[id] ?? null;
  delete s.items[id];
  s.removed = { ...(s.removed ?? {}), [id]: atLeastAfter(t, removed?.o) };
  const wasLast = s.last?.kind === "item" && s.last.id === id;
  if (wasLast) s.last = null;
  return { removed, wasLast };
}

export function undoRemove(s, id, { removed, wasLast }) {
  const tomb = s.removed?.[id];
  if (s.removed) delete s.removed[id];
  // Sort after the saved removal so the merge keeps the restored entry.
  if (removed) s.items[id] = { ...removed, o: tomb ? after(tomb) : removed.o };
  if (wasLast) s.last = { kind: "item", id };
  return s;
}

/** An edition card counted as opened (dwell rule, decision 27): records the edition position too. */
export function editionSeen(s, key, itemId, t = stamp(), suppressed) {
  opened(s, itemId, "edition", t, suppressed);
  s.editions[key] = { o: t, at: itemId };
  s.last = { kind: "edition", id: key };
  return s;
}

/* ---- the resume cue (spec C section 4) ------------------------------------ */

/**
 * @param {object} s state
 * @param {Map<string, object>} catalogue published items by id ({ id, title })
 * @param {Map<string, object>} editions edition key -> { title, deskName, href }
 */
export function resumeTarget(s, catalogue, editions) {
  const last = s.last;
  if (!last) return null;
  if (last.kind === "item") {
    const item = catalogue.get(last.id);
    const e = s.items[last.id];
    if (!item || !e || isRead(e)) return null;
    const href =
      e.via === "reader"
        ? `/reader/?item=${encodeURIComponent(item.id)}`
        : `/read/${encodeURIComponent(item.id)}/`;
    return { kind: "item", title: item.title, href };
  }
  const ed = editions.get(last.id);
  const at = s.editions[last.id]?.at;
  if (!ed) return null;
  return {
    kind: "edition",
    title: `${ed.deskName} ${ed.title}`,
    href: `${ed.href}${at ? `#wny-${at}` : ""}`,
  };
}
