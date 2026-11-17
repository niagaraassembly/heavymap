import test from "node:test";
import assert from "node:assert/strict";
import {
  NOTES_KEY,
  addNote,
  allNotes,
  clean,
  createNotesStore,
  deleteNote,
  fresh,
  generalNotes,
  groupsByParcel,
  load,
  notesFor,
  parcelLink,
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
    parcel: { title: "155 Moore Cres", locality: "Ancaster" },
  });
  assert.deepEqual(note, {
    id: "n1",
    key: KEY,
    releaseId: "2026-11-16-d070",
    text: "Check the zoning exception.",
    at: "2026-11-16T20:00:00Z",
    parcel: {
      key: KEY,
      releaseId: "2026-11-16-d070",
      title: "155 Moore Cres",
      locality: "Ancaster",
      link: "/map/#parcel=ia%3Aca%3Aon%3Ahamilton%3Aparcel%3A01M54B6GD9XTMCH94PJVGFN000&view=work",
    },
  });
  assert.equal(notesFor(s, KEY).length, 1);
});

test("the parcel deep link opens the map workspace for that parcel", () => {
  assert.equal(
    parcelLink(KEY),
    "/map/#parcel=ia%3Aca%3Aon%3Ahamilton%3Aparcel%3A01M54B6GD9XTMCH94PJVGFN000&view=work",
  );
});

test("without a parcel argument the snapshot is derived from the key", () => {
  const s = fresh();
  const note = addNote(s, {
    key: KEY,
    releaseId: "2026-11-16-d070",
    text: "derived",
    at: "2026-11-16T20:00:00Z",
    id: "d1",
  });
  assert.deepEqual(note.parcel, {
    key: KEY,
    releaseId: "2026-11-16-d070",
    title: "Parcel VGFN000",
    locality: null,
    link: "/map/#parcel=ia%3Aca%3Aon%3Ahamilton%3Aparcel%3A01M54B6GD9XTMCH94PJVGFN000&view=work",
  });
});

test("an unassociated note has a null key, no snapshot and no link", () => {
  const s = fresh();
  const note = addNote(s, {
    key: null,
    text: "general thought",
    at: "2026-11-16T20:00:00Z",
    id: "g1",
  });
  assert.equal(note.key, null);
  assert.equal(note.parcel, null);
  assert.equal(note.releaseId, "");
  assert.deepEqual(
    notesFor(s, null).map((n) => n.id),
    ["g1"],
  );
  assert.deepEqual(groupsByParcel(s), []);
  assert.deepEqual(
    generalNotes(s).map((n) => n.id),
    ["g1"],
  );
});

test("notes are listed newest first and only for their own parcel", () => {
  const s = fresh();
  addNote(s, {
    key: KEY,
    releaseId: "r",
    text: "first",
    at: "2026-11-16T19:00:00Z",
    id: "a",
  });
  addNote(s, {
    key: KEY,
    releaseId: "r",
    text: "second",
    at: "2026-11-16T20:00:00Z",
    id: "b",
  });
  addNote(s, {
    key: OTHER,
    releaseId: "r",
    text: "elsewhere",
    at: "2026-11-16T21:00:00Z",
    id: "c",
  });
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
  addNote(s, {
    key: KEY,
    releaseId: "r",
    text: "keep",
    at: "2026-11-16T19:00:00Z",
    id: "a",
  });
  addNote(s, {
    key: KEY,
    releaseId: "r",
    text: "drop",
    at: "2026-11-16T20:00:00Z",
    id: "b",
  });
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
  const note = addNote(s, {
    key: KEY,
    releaseId: "r",
    text: `x`.repeat(3000),
    id: "long",
  });
  assert.equal(note.text.length, 2000);
});

test("notes survive a save and reload from storage", () => {
  const storage = memoryStorage();
  const s = fresh();
  addNote(s, {
    key: KEY,
    releaseId: "2026-11-16-d070",
    text: "survives",
    at: "2026-11-16T20:00:00Z",
    id: "a",
  });
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
  const note = store.add({
    key: KEY,
    releaseId: "r",
    text: "in memory",
    id: "m1",
  });
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
      {
        id: "ok",
        key: KEY,
        releaseId: "r",
        text: "fine",
        at: "2026-11-16T20:00:00Z",
      },
      {
        id: 7,
        key: KEY,
        releaseId: "r",
        text: "bad id",
        at: "2026-11-16T20:00:00Z",
      },
      { id: "no-text", key: KEY, releaseId: "r", at: "2026-11-16T20:00:00Z" },
      "not an object",
    ],
  });
  assert.deepEqual(
    state.notes.map((n) => n.id),
    ["ok"],
  );
});

test("clean migrates v1 notes in place and leaves unassociated notes parcel-less", () => {
  const state = clean({
    version: 1,
    notes: [
      {
        id: "old",
        key: KEY,
        releaseId: "2026-11-16-d070",
        text: "from v1",
        at: "2026-11-16T19:00:00Z",
      },
      {
        id: "gen",
        key: null,
        releaseId: "",
        text: "general",
        at: "2026-11-16T20:00:00Z",
      },
      {
        id: "bad",
        key: 7,
        releaseId: "r",
        text: "bad key",
        at: "2026-11-16T20:00:00Z",
      },
    ],
  });
  assert.deepEqual(
    state.notes.map((n) => n.id),
    ["old", "gen"],
  );
  assert.equal(state.notes[0].parcel.title, "Parcel VGFN000");
  assert.equal(state.notes[0].parcel.link, parcelLink(KEY));
  assert.equal(state.notes[1].parcel, null);
});

test("groups are per parcel, newest first, ordered by newest note; general notes stay apart", () => {
  const s = fresh();
  addNote(s, {
    key: KEY,
    releaseId: "r",
    text: "first",
    at: "2026-11-16T19:00:00Z",
    id: "a",
    parcel: { title: "155 Moore Cres", locality: "Ancaster" },
  });
  addNote(s, {
    key: OTHER,
    releaseId: "r",
    text: "other",
    at: "2026-11-16T21:00:00Z",
    id: "c",
    parcel: { title: "353 James St N", locality: "Hamilton" },
  });
  addNote(s, {
    key: KEY,
    releaseId: "r",
    text: "second",
    at: "2026-11-16T20:00:00Z",
    id: "b",
  });
  addNote(s, {
    key: null,
    text: "general",
    at: "2026-11-16T22:00:00Z",
    id: "g",
  });
  const groups = groupsByParcel(s);
  assert.deepEqual(
    groups.map((g) => g.parcel.key),
    [OTHER, KEY],
  );
  assert.equal(groups[0].parcel.title, "353 James St N");
  assert.deepEqual(
    groups[1].notes.map((n) => n.id),
    ["b", "a"],
  );
  assert.deepEqual(
    generalNotes(s).map((n) => n.id),
    ["g"],
  );
  assert.deepEqual(
    allNotes(s).map((n) => n.id),
    ["g", "c", "b", "a"],
  );
});

test("deleting an unassociated note leaves parcel notes untouched", () => {
  const s = fresh();
  addNote(s, {
    key: KEY,
    releaseId: "r",
    text: "keep",
    at: "2026-11-16T19:00:00Z",
    id: "a",
  });
  addNote(s, { key: null, text: "drop", at: "2026-11-16T20:00:00Z", id: "g" });
  assert.equal(deleteNote(s, "g"), true);
  assert.deepEqual(
    notesFor(s, KEY).map((n) => n.id),
    ["a"],
  );
  assert.deepEqual(generalNotes(s), []);
});

test("the store lists all notes and groups, and unassociated notes round-trip through storage", () => {
  const storage = memoryStorage();
  const store = createNotesStore(storage);
  store.add({
    key: KEY,
    releaseId: "r",
    text: "parcel note",
    id: "s1",
    parcel: { title: "155 Moore Cres", locality: "Ancaster" },
  });
  store.add({ key: null, text: "general note", id: "s2" });
  assert.equal(store.all().length, 2);
  assert.equal(store.groups().length, 1);
  assert.equal(store.general().length, 1);
  const reloaded = createNotesStore(storage);
  assert.equal(reloaded.all().length, 2);
  assert.equal(reloaded.groups()[0].parcel.title, "155 Moore Cres");
  assert.equal(reloaded.general()[0].parcel, null);
});
