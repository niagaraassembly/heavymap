/* The map page's opening: the heavy element in 3D as a short title sequence.
 *
 * Dust in the dark, the node ignites, rays strike outward, the camera swings
 * round and everything locks into the flat mark, then the HeavyMap wordmark.
 * The overlay leaves only when the sequence is over (or skipped) and the map
 * is ready, so it never hides a map that is not there yet and never cuts the
 * sequence short unless the visitor asks.
 *
 * The full sequence plays once per browser session; later map loads in the
 * same session get the short arrival. Reduced motion shows the still mark.
 */

import geometry from "./heavy-element-geometry.js";
import { createHeavyElement, ease, span } from "./heavy-element-3d.js";

const SEEN_KEY = "heavymap-title-intro-v1";
const FULL_END = 10.4; // seconds: wordmark in and the light has passed
const SHORT_END = 1.9;

function seenThisSession() {
  try {
    return sessionStorage.getItem(SEEN_KEY) === "seen";
  } catch {
    return false;
  }
}

function markSeen() {
  try {
    sessionStorage.setItem(SEEN_KEY, "seen");
  } catch {
    /* private mode: every load plays the full sequence */
  }
}

/** Frame state for the full sequence at time t (seconds). */
function fullFrame(t) {
  const swing = ease.inOutCubic(span(t, 4.6, 7.4));
  const lock = ease.inOutCubic(span(t, 6.6, 7.6));
  const flare = span(t, 8.6, 10.0);
  return {
    time: t,
    dust: span(t, 0.2, 1.6),
    scatter: (1 - ease.outCubic(span(t, 0, 6.8))) * 1.4,
    node: ease.outBack(span(t, 1.4, 2.2)),
    glow: Math.max(0, 1.4 * (1 - span(t, 2.0, 3.4))) + 0.18,
    strike: (ray) => ease.outExpo(span(t, 2.1 + ray.order * 2.0, 2.6 + ray.order * 2.0)),
    yaw: (1 - swing) * 1.25 + Math.sin(t * 0.35) * 0.08 * (1 - swing),
    pitch: (1 - swing) * 0.32,
    depth: 1.25 * (1 - lock),
    scale: 0.42 + 0.06 * ease.outCubic(span(t, 0, 9)),
    flare: flare > 0 && flare < 1 ? flare : -1,
    word: ease.outCubic(span(t, 7.6, 9.2)),
    // the mark rises a little to make room for the wordmark
    cy: 0.5 - 0.08 * ease.inOutCubic(span(t, 7.2, 8.6)),
  };
}

/** The short arrival for repeat loads: one spin that locks into the mark. */
function shortFrame(t) {
  const a = span(t, 0, 1.4);
  return {
    time: t,
    yaw: (1 - ease.outCubic(a)) * -Math.PI * 2.4,
    pitch: (1 - ease.outCubic(a)) * 0.5,
    depth: 1 - ease.inOutCubic(span(t, 1.0, 1.4)),
    scale: 0.3 + 0.18 * ease.outBack(span(t, 0, 0.9)),
    strike: ease.outExpo(span(t, 0.05, 0.9)),
    dust: span(t, 0.2, 0.8),
    glow: 0.18,
    word: ease.outCubic(span(t, 1.1, 1.8)),
    cy: 0.5 - 0.08 * ease.inOutCubic(span(t, 0.9, 1.6)),
  };
}

const FINAL = { depth: 0, scale: 0.48, glow: 0.18, word: 1, cy: 0.42 };

/**
 * Start the intro inside the loading overlay. Returns { mapReady() } for the
 * page to call when the map can be shown.
 */
export function startTitleIntro(overlay) {
  const canvas = overlay?.querySelector("[data-intro-canvas]");
  if (!overlay || !canvas) return { mapReady() { overlay?.remove(); } };

  const word = overlay.querySelector("[data-intro-word]");
  const statusLine = overlay.querySelector("[data-intro-status]");
  const skipButton = overlay.querySelector("[data-intro-skip]");
  const renderer = createHeavyElement(canvas, geometry, { seed: 5 });
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const short = !reduce && seenThisSession();
  const end = reduce ? 0 : short ? SHORT_END : FULL_END;
  const frame = short ? shortFrame : fullFrame;
  markSeen();

  let start = performance.now();
  let skipped = false;
  let sequenceDone = reduce;
  let mapIsReady = false;
  let leaving = false;

  function paint(state) {
    renderer.draw(state);
    const w = state.word ?? 0;
    if (word) {
      word.style.opacity = String(w);
      word.style.letterSpacing = `${0.5 - 0.54 * w}em`;
    }
    // the status line gives way to the wordmark (it stays for screen readers)
    if (statusLine) statusLine.style.opacity = String(1 - w);
  }

  function leave() {
    if (leaving) return;
    leaving = true;
    removeEventListener("keydown", onKey);
    removeEventListener("resize", onResize);
    overlay.classList.add("is-hidden");
    overlay.addEventListener("transitionend", () => overlay.remove(), { once: true });
    setTimeout(() => overlay.remove(), 700);
  }

  function maybeLeave() {
    if (sequenceDone && mapIsReady) leave();
  }

  function skip() {
    if (skipped || leaving) return;
    skipped = true;
    sequenceDone = true;
    paint(FINAL);
    if (skipButton) skipButton.hidden = true;
    maybeLeave();
  }

  function onKey(event) {
    if (["Escape", "Enter", " "].includes(event.key)) skip();
  }

  function onResize() {
    renderer.resize();
    if (sequenceDone) paint(FINAL);
  }

  function tick() {
    if (leaving || skipped) return;
    // one clock for start and now; the frame timestamp can use another origin
    const t = (performance.now() - start) / 1000;
    paint(frame(t));
    if (t >= end) {
      sequenceDone = true;
      paint(FINAL);
      if (skipButton) skipButton.hidden = true;
      maybeLeave();
      return;
    }
    requestAnimationFrame(tick);
  }

  addEventListener("resize", onResize);
  if (reduce) {
    if (skipButton) skipButton.hidden = true;
    paint(FINAL);
  } else {
    addEventListener("keydown", onKey);
    overlay.addEventListener("click", skip);
    skipButton?.addEventListener("click", (event) => { event.stopPropagation(); skip(); });
    if (short && skipButton) skipButton.hidden = true;
    start = performance.now();
    requestAnimationFrame(tick);
  }

  return {
    mapReady() {
      mapIsReady = true;
      if (statusLine) statusLine.textContent = "Hamilton map ready";
      maybeLeave();
    },
  };
}
