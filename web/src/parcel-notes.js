/* Parcel notes (parcel-views design §5.4, BL-118; standalone service
 * with parcel links, BL-118 follow-up).
 *
 * Plain-text notes, stored on the device only, following the reading-store
 * pattern: a versioned localStorage key, an in-memory fallback when storage
 * is unavailable, and a save after every change.
 *
 * A note created from a parcel carries that parcel's snapshot at creation
 * time (key, release id, title, locality) and the deep link back to the
 * map workspace. A note created on the standalone /notes/ page has no
 * parcel: its key is null, it carries no snapshot and no link. No tags,
 * no attached facts, no pinning yet; notes migrate when Save (IndexedDB,
 * BL-106) is designed.
 *
 * Pure functions over a plain state object, plus a small store wrapper.
 * No DOM.
 */

export const NOTES_KEY = "heavymap-parcel-notes-v1";
export const MAX_NOTES = 500;
export const MAX_TEXT = 2000;

/** The map deep link back to a parcel's workspace. */
export const parcelLink = (key) =>
  `/map/#parcel=${encodeURIComponent(key)}&view=work`;

/** Fallback title for a parcel whose snapshot is missing. */
const parcelTitleFallback = (key) => `Parcel ${key.slice(-7)}`;

/**
 * The parcel snapshot a note carries. Null for unassociated notes. A
 * stored snapshot is kept as captured; a missing or partial one is derived
 * from the note's key and release id, so v1 notes migrate in place.
 */
function normaliseParcel(note) {
  if (note.key === null || note.key === undefined) return null;
  const given =
    note.parcel && typeof note.parcel === "object" ? note.parcel : {};
  return {
    key: note.key,
    releaseId: note.releaseId ?? "",
    title:
      typeof given.title === "string" && given.title.trim()
        ? given.title
        : parcelTitleFallback(note.key),
    locality: typeof given.locality === "string" ? given.locality : null,
    link: parcelLink(note.key),
  };
}

/** "16 November 2026 at 14:03", or the raw value when it is not a date. */
export function formatNoteTime(at) {
  const d = new Date(at);
  if (Number.isNaN(d.getTime())) return at;
  return d.toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" });
}

export function fresh() {
  return { version: 1, notes: [] };
}

const isNote = (n) =>
  n &&
  typeof n === "object" &&
  typeof n.id === "string" &&
  (typeof n.key === "string" || n.key === null) &&
  typeof n.releaseId === "string" &&
  typeof n.text === "string" &&
  typeof n.at === "string" &&
  (n.parcel === undefined || n.parcel === null || typeof n.parcel === "object");

/**
 * Keep only well-formed notes; anything else is dropped, not repaired.
 * Every kept note leaves with its parcel snapshot normalised, so notes
 * written before snapshots existed migrate in place.
 */
export function clean(raw) {
  const s = fresh();
  if (!raw || raw.version !== 1 || !Array.isArray(raw.notes)) return s;
  s.notes = raw.notes
    .filter(isNote)
    .map((n) => ({ ...n, parcel: normaliseParcel(n) }));
  return s;
}

/**
 * Read state from storage. Returns { state, persistent }: persistent is
 * false when storage is unavailable, and the caller keeps state in memory.
 */
export function load(storage) {
  if (!storage) return { state: fresh(), persistent: false };
  try {
    const raw = storage.getItem(NOTES_KEY);
    if (!raw) return { state: fresh(), persistent: true };
    return { state: clean(JSON.parse(raw)), persistent: true };
  } catch {
    try {
      storage.getItem(NOTES_KEY);
      return { state: fresh(), persistent: true }; // malformed JSON: start fresh
    } catch {
      return { state: fresh(), persistent: false };
    }
  }
}

/** Write state to storage. Returns false when storage can't be written. */
export function save(storage, state) {
  if (!storage) return false;
  try {
    storage.setItem(NOTES_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

const randomId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

/**
 * Add a note. Blank text adds nothing (returns null); text over the cap
 * is trimmed to it. Returns the note. Oldest notes are dropped past the cap.
 * `key` is the parcel key, or null for an unassociated note; `parcel`
 * carries the parcel snapshot ({ title, locality }) captured at creation
 * time, and is derived from the key when it is not supplied.
 */
export function addNote(state, { key, releaseId, text, at, id, parcel }) {
  const cleanText = String(text ?? "")
    .trim()
    .slice(0, MAX_TEXT);
  if (!cleanText) return null;
  const note = {
    id: id ?? randomId(),
    key: key ?? null,
    releaseId: releaseId ?? "",
    text: cleanText,
    at: at ?? new Date().toISOString(),
    parcel: normaliseParcel({
      key: key ?? null,
      releaseId: releaseId ?? "",
      parcel,
    }),
  };
  state.notes.push(note);
  if (state.notes.length > MAX_NOTES) {
    state.notes.splice(0, state.notes.length - MAX_NOTES);
  }
  return note;
}

/** Delete a note by id. Returns false when there is no such note. */
export function deleteNote(state, id) {
  const i = state.notes.findIndex((n) => n.id === id);
  if (i === -1) return false;
  state.notes.splice(i, 1);
  return true;
}

/** Notes for one parcel (or, with a null key, the unassociated notes), newest first. */
export function notesFor(state, key) {
  return state.notes
    .filter((n) => n.key === key)
    .sort((a, b) => (b.at ?? "").localeCompare(a.at ?? ""));
}

/** Every note, newest first. */
export function allNotes(state) {
  return [...state.notes].sort((a, b) =>
    (b.at ?? "").localeCompare(a.at ?? ""),
  );
}

/** Unassociated notes, newest first. */
export function generalNotes(state) {
  return notesFor(state, null);
}

/**
 * Parcel notes grouped by parcel: [{ parcel, notes }], groups ordered by
 * their newest note, notes newest first within a group. The group's parcel
 * is the newest note's snapshot. Unassociated notes are not grouped here;
 * see generalNotes.
 */
export function groupsByParcel(state) {
  const byKey = new Map();
  for (const note of allNotes(state)) {
    if (note.key === null) continue;
    const group = byKey.get(note.key) ?? { parcel: note.parcel, notes: [] };
    group.notes.push(note);
    byKey.set(note.key, group);
  }
  return [...byKey.values()];
}

/** Store wrapper: loads once, saves after every change, notifies listeners. */
export function createNotesStore(storage) {
  let { state, persistent } = load(storage);
  const listeners = new Set();

  const store = {
    get state() {
      return state;
    },
    get persistent() {
      return persistent;
    },
    notesFor(key) {
      return notesFor(state, key);
    },
    all() {
      return allNotes(state);
    },
    groups() {
      return groupsByParcel(state);
    },
    general() {
      return generalNotes(state);
    },
    add(fields) {
      const note = addNote(state, fields);
      if (note && persistent && !save(storage, state)) persistent = false;
      if (note) listeners.forEach((l) => l(state));
      return note;
    },
    remove(id) {
      const removed = deleteNote(state, id);
      if (removed && persistent && !save(storage, state)) persistent = false;
      if (removed) listeners.forEach((l) => l(state));
      return removed;
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };

  if (storage && typeof addEventListener === "function") {
    addEventListener("storage", (e) => {
      if (e.key !== NOTES_KEY || !storage) return;
      state = load(storage).state;
      listeners.forEach((l) => l(state));
    });
  }
  return store;
}
