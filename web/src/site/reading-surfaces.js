/* Reading on each surface (spec C sections 2–4): the item article (on its
 * own page and in the Reader pane), edition cards, and the home cue. */

import { escapeHtml as esc } from "../desk/escape.js";

const DWELL_OPEN_MS = 2000; // edition card at least half visible (decision 27)
const DWELL_END_MS = 1000; // end marker visible (spec C section 3)
const SAVE_DEBOUNCE_MS = 300;

/* ---- position against the article body (spec C section 3.1) ------------- */

const blocksOf = (body) =>
  [...body.children].filter(
    (el) => !el.classList.contains("reading-end") && el.offsetHeight > 0,
  );
const topOf = (scrollEl) =>
  scrollEl === window ? 0 : scrollEl.getBoundingClientRect().top;

export function positionOf(body, scrollEl) {
  const top = topOf(scrollEl);
  const blocks = blocksOf(body);
  for (let i = 0; i < blocks.length; i++) {
    const r = blocks[i].getBoundingClientRect();
    if (r.bottom > top + 1) {
      return {
        block: i,
        within: Math.min(1, Math.max(0, (top - r.top) / (r.height || 1))),
      };
    }
  }
  return { block: Math.max(0, blocks.length - 1), within: 1 };
}

export function restorePosition(body, scrollEl, p) {
  if (!p) return;
  const block = blocksOf(body)[p.block];
  if (!block) return; // body changed: stay at the start, no error (spec C section 3.1)
  const r = block.getBoundingClientRect();
  const delta = r.top + r.height * p.within - topOf(scrollEl);
  if (scrollEl === window) window.scrollBy(0, delta);
  else scrollEl.scrollTop += delta;
}

/** Calls fn after `el` has stayed visible for `ms`; cancels when it leaves. */
function dwell(el, ms, root, fn, visible = (e) => e.isIntersecting) {
  let timer = null;
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (visible(e)) timer ??= setTimeout(fn, ms);
        else {
          clearTimeout(timer);
          timer = null;
        }
      }
    },
    { root: root === window ? null : root, threshold: [0, 0.25, 0.5, 0.75, 1] },
  );
  io.observe(el);
  return () => {
    clearTimeout(timer);
    io.disconnect();
  };
}

/* ---- the item article ------------------------------------------------------ */

/**
 * Track reading of one item article. Used by /read/<id>/ (via "read") and the
 * Reader pane (via "reader"). Returns a detach function.
 */
export function attachArticle(
  store,
  article,
  { via, scrollEl = window, announce },
) {
  const { R } = store;
  const id = article.dataset.itemId;
  const item = store.byId.get(id);
  if (!item) return () => {};
  const body = article.querySelector(".hm-reading-body") ?? article;
  const tools = article.querySelector("[data-reading-tools]");
  const markBtn = tools?.querySelector("[data-mark-read]");
  const removeBtn = tools?.querySelector("[data-remove-history]");
  const updated = tools?.querySelector("[data-updated]");
  const status = tools?.querySelector("[data-reading-status]");
  const say = (msg) => {
    if (announce) announce(msg);
    else if (status) status.textContent = msg;
  };
  const cleanups = [];

  store.update((s) => R.opened(s, id, via, undefined, store.suppressed));
  requestAnimationFrame(() =>
    restorePosition(body, scrollEl, store.state.items[id]?.p),
  );

  let saveTimer = null;
  const onScroll = () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      if (store.state.items[id])
        store.update((s) => R.progressed(s, id, positionOf(body, scrollEl)));
    }, SAVE_DEBOUNCE_MS);
  };
  scrollEl.addEventListener("scroll", onScroll, { passive: true });
  cleanups.push(() => {
    clearTimeout(saveTimer);
    scrollEl.removeEventListener("scroll", onScroll);
  });

  const end = body.querySelector(".reading-end");
  if (end)
    cleanups.push(
      dwell(end, DWELL_END_MS, scrollEl, () =>
        store.update((s) => R.endReached(s, id, undefined, store.suppressed)),
      ),
    );

  function render() {
    if (!tools) return;
    const e = store.state.items[id];
    const read = R.isRead(e);
    markBtn.textContent = read ? "Mark as unread" : "Mark as read";
    markBtn.setAttribute("aria-pressed", String(read));
    removeBtn.disabled = !e;
    if (updated)
      updated.hidden = !(
        read &&
        item.updated_on &&
        item.updated_on > e.r.slice(0, 10)
      );
  }
  if (tools) {
    tools.hidden = false;
    markBtn.addEventListener("click", () => {
      const read = R.isRead(store.state.items[id]);
      store.update((s) =>
        read
          ? R.markUnread(s, id, undefined, store.suppressed)
          : R.markRead(s, id, undefined, store.suppressed),
      );
      say(read ? "Marked as unread" : "Marked as read");
    });
    removeBtn.addEventListener("click", () => {
      let undo;
      store.update((s) => {
        undo = R.remove(s, id);
      });
      say("Removed from your history");
      offerUndo(tools, () => {
        store.update((s) => R.undoRemove(s, id, undo));
        say("Restored to your history");
      });
    });
    cleanups.push(store.subscribe(render));
    render();
  }
  return () => cleanups.forEach((fn) => fn());
}

/** A short-lived Undo button after removal (no dialog; spec C section 6.4). */
function offerUndo(container, fn) {
  container.querySelector("[data-undo]")?.remove();
  const b = document.createElement("button");
  b.type = "button";
  b.dataset.undo = "";
  b.textContent = "Undo";
  b.addEventListener("click", () => {
    fn();
    b.remove();
  });
  container.append(b);
  setTimeout(() => b.remove(), 15000);
}

/* ---- edition cards (decision 27) ------------------------------------------ */

export function attachEdition(store, root) {
  const { R } = store;
  const key = root.dataset.edition;
  for (const card of root.querySelectorAll('li.wny-item[id^="wny-"]')) {
    const id = card.dataset.item;
    if (!store.byId.has(id)) continue;
    // Half visible, or half the viewport for cards taller than it.
    dwell(
      card,
      DWELL_OPEN_MS,
      window,
      () =>
        store.update((s) =>
          R.editionSeen(s, key, id, undefined, store.suppressed),
        ),
      (e) => {
        const need =
          0.5 *
          Math.min(
            e.boundingClientRect.height,
            e.rootBounds?.height ?? innerHeight,
          );
        return e.isIntersecting && e.intersectionRect.height >= need;
      },
    );
    const end = document.createElement("span");
    end.className = "hm-card-end";
    end.setAttribute("aria-hidden", "true");
    card.append(end);
    dwell(end, DWELL_END_MS, window, () =>
      store.update((s) => R.endReached(s, id, undefined, store.suppressed)),
    );
  }
}

/* ---- home: "You left off with …" (spec C section 4) ----------------------- */

export function mountResume(store, el) {
  const { R } = store;
  function render() {
    const t = R.resumeTarget(store.state, store.byId, store.editions);
    if (!t) {
      el.hidden = true;
      el.innerHTML = "";
      return;
    }
    const text =
      t.kind === "item"
        ? `You left off with <a href="${esc(t.href)}">${esc(t.title)}</a>.`
        : `You left off in <a href="${esc(t.href)}">${esc(t.title)}</a>.`;
    el.innerHTML = `<span class="status-dot"></span><p>${text}</p><a class="return-action" href="${esc(t.href)}">${t.kind === "item" ? "Continue reading" : "Continue"} →</a>${forgetControl()}`;
    el.hidden = false;
    bindForget(store, el);
  }
  store.subscribe(render);
  render();
}

export const forgetControl = () =>
  `<button type="button" data-forget>Forget history</button><div data-forget-confirm hidden><p>Forget what you've read on this device? Your theme stays as it is.</p><button type="button" data-forget-yes>Forget</button> <button type="button" data-forget-no>Cancel</button></div>`;

/** "Forget" asks inline, never with a browser dialog (spec C section 6.4). */
export function bindForget(store, root) {
  const ask = root.querySelector("[data-forget]");
  const box = root.querySelector("[data-forget-confirm]");
  if (!ask || !box) return;
  ask.onclick = () => {
    box.hidden = false;
    ask.hidden = true;
    box.querySelector("[data-forget-no]").focus();
  };
  box.querySelector("[data-forget-no]").onclick = () => {
    box.hidden = true;
    ask.hidden = false;
    ask.focus();
  };
  box.querySelector("[data-forget-yes]").onclick = () => {
    store.forget();
    box.hidden = true;
    ask.hidden = false;
  };
}
