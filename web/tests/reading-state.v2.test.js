import test from "node:test";
import assert from "node:assert/strict";
import * as R from "../src/site/reading-state.js";

const known = new Set(["A", "B", "C"]);
const store = (init = {}) => {
  const m = new Map(Object.entries(init));
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    m,
  };
};
const T = (min, sec = 0) =>
  `2026-11-10T14:${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}Z`;

test("opening records last opened only; it never marks read (D9)", () => {
  const s = R.opened(R.fresh(), "A", "read", T(1));
  assert.equal(R.isRead(s.items.A), false);
  assert.deepEqual(s.last, { kind: "item", id: "A" });
});

test("end reached marks read; marked unread suppresses it until the next open (spec C 3.2)", () => {
  const sup = new Set();
  const s = R.opened(R.fresh(), "A", "read", T(1), sup);
  R.endReached(s, "A", T(2), sup);
  assert.ok(R.isRead(s.items.A));
  R.markUnread(s, "A", T(2), sup);
  assert.equal(
    R.isRead(s.items.A),
    false,
    "unread in the same second still wins",
  );
  R.endReached(s, "A", T(2), sup);
  assert.equal(R.isRead(s.items.A), false, "suppressed in this view");
  R.opened(s, "A", "reader", T(5), sup);
  R.endReached(s, "A", T(6), sup);
  assert.ok(R.isRead(s.items.A), "a later open lifts suppression");
});

test("mark read right after unread in the same second is read", () => {
  const s = R.markUnread(R.markRead(R.fresh(), "A", T(1)), "A", T(1));
  R.markRead(s, "A", T(1));
  assert.ok(R.isRead(s.items.A));
});

test("resume cue: unread last item links to its last surface; read item gives none; edition gives its card (spec C 4)", () => {
  const cat = new Map([["A", { id: "A", title: "Alpha" }]]);
  const eds = new Map([
    [
      "wny/one",
      {
        title: "Issue One",
        deskName: "Western New York",
        href: "/editions/wny/one/",
      },
    ],
  ]);
  const s = R.opened(R.fresh(), "A", "reader", T(1));
  assert.deepEqual(R.resumeTarget(s, cat, eds), {
    kind: "item",
    title: "Alpha",
    href: "/reader/?item=A",
  });
  R.markRead(s, "A", T(2));
  assert.equal(R.resumeTarget(s, cat, eds), null);
  R.editionSeen(s, "wny/one", "B", T(3));
  assert.deepEqual(R.resumeTarget(s, cat, eds), {
    kind: "edition",
    title: "Western New York Issue One",
    href: "/editions/wny/one/#wny-B",
  });
  assert.equal(
    R.resumeTarget(R.opened(R.fresh(), "Z", "read"), cat, eds),
    null,
    "unknown target: no cue",
  );
});

test("per-item removal clears the entry and any cue; undo restores both (decision 29)", () => {
  const s = R.opened(R.fresh(), "A", "read", T(1));
  const undo = R.remove(s, "A");
  assert.equal(s.items.A, undefined);
  assert.equal(s.last, null);
  R.undoRemove(s, "A", undo);
  assert.ok(s.items.A);
  assert.deepEqual(s.last, { kind: "item", id: "A" });
});

test("load drops unknown IDs, survives malformed JSON and missing storage (spec C 6.3)", () => {
  const raw = {
    version: 2,
    items: { A: { o: T(1), p: { block: 2, within: 3 } }, Q: { o: T(1) } },
    editions: {},
    last: { kind: "item", id: "Q" },
    filters: { kind: "bogus" },
  };
  const { state } = R.load(
    store({ [R.READING_KEY]: JSON.stringify(raw) }),
    known,
  );
  assert.deepEqual(Object.keys(state.items), ["A"]);
  assert.equal(state.items.A.p.within, 1);
  assert.equal(state.last, null);
  assert.equal(state.filters.kind, "news");
  assert.equal(
    R.load(store({ [R.READING_KEY]: "{bad" }), known).persistent,
    true,
  );
  const broken = {
    getItem() {
      throw new Error("blocked");
    },
  };
  assert.equal(R.load(broken, known).persistent, false);
});

test("v1 migration maps read, current and filter names, then deletes v1 (spec C 6.5)", () => {
  const v1 = {
    version: 1,
    current: "B",
    progress: { B: 0.5, "hm-old": 0.2 },
    read: ["A", "hm-reading-the-evidence"],
    filters: { kind: "findings", region: "all", query: "x", unreadOnly: true },
  };
  const st = store({ [R.LEGACY_KEY]: JSON.stringify(v1) });
  const { state } = R.load(st, known);
  assert.ok(R.isRead(state.items.A));
  assert.deepEqual(state.last, { kind: "item", id: "B" });
  assert.equal(state.items.B.p, null, "old fractions restart at the top");
  assert.deepEqual(state.filters, {
    kind: "finding",
    region: "all",
    q: "x",
    unread: true,
  });
  assert.equal(st.m.has(R.LEGACY_KEY), false);
  assert.ok(st.m.has(R.READING_KEY));
});

test("save merges with another tab: latest open wins; latest unread still wins over an older read", () => {
  const st = store();
  const tab1 = R.markRead(R.opened(R.fresh(), "A", "read", T(1)), "A", T(2));
  R.save(st, tab1, known);
  const tab2 = R.markUnread(
    R.opened(R.fresh(), "A", "reader", T(3)),
    "A",
    T(4),
  );
  R.opened(tab2, "B", "reader", T(5));
  const merged = R.save(st, tab2, known);
  assert.equal(R.isRead(merged.items.A), false);
  assert.equal(merged.items.A.via, "reader");
  assert.ok(merged.items.B);
});

test("prune keeps the newest entries and drops unread before read", () => {
  const s = R.fresh();
  s.items.old_read = { o: T(1), r: T(1) };
  s.items.old_unread = { o: T(2) };
  s.items.new = { o: T(3) };
  R.prune(s, 2);
  assert.deepEqual(Object.keys(s.items).sort(), ["new", "old_read"]);
});

test("forgetting is a separate key from the theme", () => {
  assert.notEqual(R.READING_KEY, "heavymap-theme-v1");
});

test("a removal survives the merge with what storage still holds, and Undo brings it back", () => {
  const st = store();
  const s = R.opened(R.fresh(), "A", "read", T(1));
  R.save(st, s, known);
  const undo = R.remove(s, "A", T(2));
  let merged = R.save(st, s, known);
  assert.equal(merged.items.A, undefined);
  assert.equal(merged.last, null);
  const stale = R.opened(R.fresh(), "B", "read", T(3));
  stale.items.A = { o: T(1) };
  merged = R.save(st, stale, known);
  assert.equal(
    merged.items.A,
    undefined,
    "another tab's older copy does not resurrect it",
  );
  R.undoRemove(merged, "A", undo);
  merged = R.save(st, merged, known);
  assert.ok(merged.items.A);
  R.opened(merged, "A", "reader", T(9));
  assert.ok(
    R.save(st, merged, known).items.A,
    "opening after a removal records again",
  );
});
