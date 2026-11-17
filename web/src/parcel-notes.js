/* Parcel notes, first slice (parcel-views design §5.4, BL-118).
 *
 * Plain-text notes for one parcel, stored on the device only, following
 * the reading-store pattern: a versioned localStorage key, an in-memory
 * fallback when storage is unavailable, and a save after every change.
 * Each note stores the parcel key, release id, text and time. No tags,
 * no attached facts, no pinning yet; notes migrate when Save (IndexedDB,
 * BL-106) is designed.
 *
 * Pure functions over a plain state object, plus a small store wrapper.
 * No DOM.
 */

export const NOTES_KEY = "heavymap-parcel-notes-v1";
export const MAX_NOTES = 500;
export const MAX_TEXT = 2000;

export function fresh() {
  return { version: 1, notes: [] };
}

const isNote = (n) =>
  n &&
  typeof n === "object" &&
  typeof n.id === "string" &&
  typeof n.key === "string" &&
  typeof n.releaseId === "string" &&
  typeof n.text === "string" &&
  typeof n.at === "string";

/** Keep only well-formed notes; anything else is dropped, not repaired. */
export function clean(raw) {
  const s = fresh();
  if (!raw || raw.version !== 1 || !Array.isArray(raw.notes)) return s;
  s.notes = raw.notes.filter(isNote);
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
 */
export function addNote(state, { key, releaseId, text, at, id }) {
  const cleanText = String(text ?? "").trim().slice(0, MAX_TEXT);
  if (!cleanText) return null;
  const note = {
    id: id ?? randomId(),
    key,
    releaseId: releaseId ?? "",
    text: cleanText,
    at: at ?? new Date().toISOString(),
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

/** Notes for one parcel, newest first. */
export function notesFor(state, key) {
  return state.notes
    .filter((n) => n.key === key)
    .sort((a, b) => (b.at ?? "").localeCompare(a.at ?? ""));
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
