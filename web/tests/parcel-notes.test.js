import test from "node:test";
import assert from "node:assert/strict";
import {
  NOTES_KEY,
  addNote,
  clean,
  createNotesStore,
  deleteNote,
  fresh,
  load,
  notesFor,
  save,
} from "../src/parcel-notes.js";

/** Minimal Storage-like object for the pure functions. */
function memoryStorage(initial = {}) {
  const data = { ...initial };
  return {
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => {
      data[k] = String(v);
    },
    removeItem: (k) => {
      delete data[k];
    },
  };
}

const KEY = "ia:ca:on:hamilton:parcel:01M54B6GD9XTMCH94PJVGFN000";
const OTHER = "ia:ca:on:hamilton:parcel:01M54B6K2D08KQ3CNTH8S56PWR";

test("a note is stored with parcel key, release id, text and time", () => {
  const s = fresh();
  const note = addNote(s, {
    key: KEY,
    releaseId: "2026-11-16-d070",
    text: "Check the zoning exception.",
    at: "2026-11-16T20:00:00Z",
    id: "n1",
  });
  assert.deepEqual(note, {
    id: "n1",
    key: KEY,
    releaseId: "2026-11-16-d070",
    text: "Check the zoning exception.",
    at: "2026-11-16T20:00:00Z",
  });
  assert.equal(notesFor(s, KEY).length, 1);
});

test("notes are listed newest first and only for their own parcel", () => {
  const s = fresh();
  addNote(s, { key: KEY, releaseId: "r", text: "first", at: "2026-11-16T19:00:00Z", id: "a" });
  addNote(s, { key: KEY, releaseId: "r", text: "second", at: "2026-11-16T20:00:00Z", id: "b" });
  addNote(s, { key: OTHER, releaseId: "r", text: "elsewhere", at: "2026-11-16T21:00:00Z", id: "c" });
  assert.deepEqual(
    notesFor(s, KEY).map((n) => n.id),
    ["b", "a"],
  );
  assert.deepEqual(
    notesFor(s, OTHER).map((n) => n.id),
    ["c"],
  );
});

test("a note can be deleted; deleting an unknown id reports false", () => {
  const s = fresh();
  addNote(s, { key: KEY, releaseId: "r", text: "keep", at: "2026-11-16T19:00:00Z", id: "a" });
  addNote(s, { key: KEY, releaseId: "r", text: "drop", at: "2026-11-16T20:00:00Z", id: "b" });
  assert.equal(deleteNote(s, "b"), true);
  assert.equal(deleteNote(s, "b"), false);
  assert.deepEqual(
    notesFor(s, KEY).map((n) => n.id),
    ["a"],
  );
});

test("blank text adds nothing; long text is capped, not refused", () => {
  const s = fresh();
  assert.equal(addNote(s, { key: KEY, releaseId: "r", text: "   " }), null);
  const note = addNote(s, { key: KEY, releaseId: "r", text: `x`.repeat(3000), id: "long" });
  assert.equal(note.text.length, 2000);
});

test("notes survive a save and reload from storage", () => {
  const storage = memoryStorage();
  const s = fresh();
  addNote(s, { key: KEY, releaseId: "2026-11-16-d070", text: "survives", at: "2026-11-16T20:00:00Z", id: "a" });
  assert.equal(save(storage, s), true);
  const { state, persistent } = load(storage);
  assert.equal(persistent, true);
  assert.deepEqual(
    notesFor(state, KEY).map((n) => n.text),
    ["survives"],
  );
});

test("malformed stored JSON starts fresh instead of throwing", () => {
  const storage = memoryStorage({ [NOTES_KEY]: "{not json" });
  const { state, persistent } = load(storage);
  assert.equal(persistent, true);
  assert.deepEqual(state, fresh());
});

test("a store without storage keeps notes in memory", () => {
  const store = createNotesStore(null);
  assert.equal(store.persistent, false);
  const note = store.add({ key: KEY, releaseId: "r", text: "in memory", id: "m1" });
  assert.equal(note.text, "in memory");
  assert.equal(store.notesFor(KEY).length, 1);
  assert.equal(store.remove("m1"), true);
  assert.equal(store.notesFor(KEY).length, 0);
});

test("the store saves after every change and notifies subscribers", () => {
  const storage = memoryStorage();
  const store = createNotesStore(storage);
  let seen = 0;
  store.subscribe(() => {
    seen++;
  });
  store.add({ key: KEY, releaseId: "r", text: "one", id: "s1" });
  assert.equal(seen, 1);
  assert.equal(JSON.parse(storage.getItem(NOTES_KEY)).notes.length, 1);
  store.remove("s1");
  assert.equal(seen, 2);
  assert.equal(JSON.parse(storage.getItem(NOTES_KEY)).notes.length, 0);
});

test("clean drops malformed entries and keeps the well-formed ones", () => {
  const state = clean({
    version: 1,
    notes: [
      { id: "ok", key: KEY, releaseId: "r", text: "fine", at: "2026-11-16T20:00:00Z" },
      { id: 7, key: KEY, releaseId: "r", text: "bad id", at: "2026-11-16T20:00:00Z" },
      { id: "no-text", key: KEY, releaseId: "r", at: "2026-11-16T20:00:00Z" },
      "not an object",
    ],
  });
  assert.deepEqual(
    state.notes.map((n) => n.id),
    ["ok"],
  );
});
