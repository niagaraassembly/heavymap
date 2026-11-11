/* The page's handle on reading history: loads once, saves after every
 * change (read-modify-write, spec C section 6.3), follows other tabs, and
 * keeps state in memory when storage is unavailable. */

import * as R from "./reading-state.js";

export function readCatalogue() {
  try {
    return JSON.parse(
      document.getElementById("hm-catalogue")?.textContent ?? "null",
    );
  } catch {
    return null;
  }
}

export function createStore(catalogue) {
  const known = new Set(catalogue.items.map((i) => i.id));
  const slugs = catalogue.regions.map((r) => r.slug);
  let storage = null;
  try {
    storage = window.localStorage;
  } catch {
    storage = null;
  }
  let { state, persistent } = storage
    ? R.load(storage, known, slugs)
    : { state: R.fresh(), persistent: false };
  const suppressed = new Set();
  const listeners = new Set();

  const store = {
    R,
    catalogue,
    byId: new Map(catalogue.items.map((i) => [i.id, i])),
    editions: new Map(Object.entries(catalogue.editions)),
    suppressed,
    get state() {
      return state;
    },
    get persistent() {
      return persistent;
    },
    /** Apply fn(state) and save. */
    update(fn) {
      fn(state);
      if (persistent) {
        const saved = R.save(storage, state, known);
        if (saved) state = saved;
        else persistent = false;
      }
      listeners.forEach((l) => l(state));
    },
    forget() {
      try {
        storage?.removeItem(R.READING_KEY);
      } catch {
        /* nothing to forget */
      }
      state = R.fresh();
      suppressed.clear();
      listeners.forEach((l) => l(state));
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };

  addEventListener("storage", (e) => {
    if (e.key !== R.READING_KEY || !storage) return;
    state = R.load(storage, known, slugs).state;
    listeners.forEach((l) => l(state));
  });
  return store;
}
