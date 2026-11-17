/* <heavy-element-loader>: the HeavyMap mark in 3D as a reusable loader.
 *
 *   <heavy-element-loader theme="dark" mode="spin" style="width:160px;height:160px">
 *
 * theme   "dark"  light ink on a near-black ground (the usual web loader)
 *         "light" dark ink on a pale ground
 *         add the `transparent` attribute to draw on whatever is behind it
 * mode    "spin"  arrives spinning and locks into the flat mark, then repeats
 *         "drift" turns slowly in 3D for as long as loading takes
 *
 * loader.finish() (or removing the `loading` attribute) eases it to the front
 * and flattens it into the mark, then fires "heavy-element-done".
 * Reduced motion shows the still mark. Drawing pauses when off screen.
 */

import geometry from "./heavy-element-geometry.js";
import { createHeavyElement, ease, span } from "./heavy-element-3d.js";

const GROUND = { dark: "#0b0d0e", light: "#eef2f1" };
const SPIN_CYCLE = 2.6; // seconds: spin-in 1.4, hold 1.2

/** Pure frame state for a mode at time t (seconds); exported for tests. */
export function loaderFrame(mode, t) {
  if (mode === "drift") {
    return { yaw: Math.sin(t * 0.9) * 0.8, pitch: Math.sin(t * 0.6) * 0.25, depth: 1, time: t, scale: 0.86 };
  }
  const c = t % SPIN_CYCLE;
  const a = span(c, 0, 1.4);
  return {
    yaw: (1 - ease.outCubic(a)) * -Math.PI * 2.4,
    pitch: (1 - ease.outCubic(a)) * 0.5,
    depth: 1 - ease.inOutCubic(span(c, 1.0, 1.4)),
    scale: 0.55 + 0.31 * ease.outBack(span(c, 0, 0.9)),
    strike: ease.outExpo(span(c, 0.05, 0.9)),
    dust: span(c, 0.2, 0.8),
    time: t,
  };
}

/** Ease any frame to the flat front view; f runs 0 to 1. */
export function finishFrame(from, f) {
  const k = ease.inOutCubic(f);
  return {
    ...from,
    yaw: from.yaw * (1 - k),
    pitch: from.pitch * (1 - k),
    depth: from.depth * (1 - k),
    scale: from.scale + (0.86 - from.scale) * k,
    strike: 1,
    dust: Math.max(from.dust ?? 1, k),
  };
}

export class HeavyElementLoader extends HTMLElement {
  static get observedAttributes() {
    return ["loading", "theme", "mode", "transparent"];
  }

  connectedCallback() {
    if (!this.canvas) {
      this.attachShadow({ mode: "open" }).innerHTML =
        `<style>:host{display:inline-block;width:160px;height:160px;position:relative}
         canvas{position:absolute;inset:0;width:100%;height:100%;display:block}</style><canvas part="canvas"></canvas>`;
      this.canvas = this.shadowRoot.querySelector("canvas");
      if (!this.hasAttribute("role")) this.setAttribute("role", "img");
      if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", "Loading");
    }
    this.setup();
    this.visible = true;
    this.observer = new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting;
      if (this.visible) this.loop();
    });
    this.observer.observe(this);
    this.resizer = new ResizeObserver(() => { this.renderer?.resize(); this.paintNow(); });
    this.resizer.observe(this);
    this.started = performance.now();
    this.loop();
  }

  disconnectedCallback() {
    this.observer?.disconnect();
    this.resizer?.disconnect();
    cancelAnimationFrame(this.frame);
    this.frame = null;
  }

  attributeChangedCallback(name, old, value) {
    if (!this.canvas) return;
    if (name === "loading" && value === null) this.finish();
    else if (name !== "loading") { this.setup(); this.paintNow(); }
  }

  setup() {
    const theme = this.getAttribute("theme") === "light" ? "light" : "dark";
    this.mode = this.getAttribute("mode") === "drift" ? "drift" : "spin";
    this.renderer = createHeavyElement(this.canvas, geometry, {
      seed: this.mode === "drift" ? 11 : 7,
      ink: theme === "light" ? "dark" : "light",
      background: this.hasAttribute("transparent") ? null : GROUND[theme],
    });
    this.reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  /** Lock into the flat mark; resolves when done. */
  finish() {
    if (this.finishing) return this.finishing.done;
    const t = (performance.now() - (this.started ?? performance.now())) / 1000;
    let resolve;
    const done = new Promise((r) => { resolve = r; });
    this.finishing = { at: performance.now(), from: loaderFrame(this.mode, t), resolve, done };
    if (this.reduce) this.complete();
    else this.loop();
    return done;
  }

  complete() {
    this.renderer.draw({ depth: 0, scale: 0.86 });
    cancelAnimationFrame(this.frame);
    this.frame = null;
    this.finished = true;
    this.finishing.resolve();
    this.dispatchEvent(new CustomEvent("heavy-element-done", { bubbles: true }));
  }

  paintNow() {
    if (!this.renderer) return;
    if (this.reduce || this.finished) this.renderer.draw({ depth: 0, scale: 0.86 });
    else this.renderer.draw(loaderFrame(this.mode, (performance.now() - this.started) / 1000));
  }

  loop() {
    if (this.frame || this.finished || !this.isConnected) return;
    if (this.reduce && !this.finishing) { this.paintNow(); return; }
    const step = () => {
      this.frame = null;
      if (!this.isConnected || !this.visible || this.finished) return;
      const now = performance.now();
      if (this.finishing) {
        const f = span(now, this.finishing.at, this.finishing.at + 700);
        this.renderer.draw(finishFrame(this.finishing.from, f));
        if (f >= 1) { this.complete(); return; }
      } else {
        this.renderer.draw(loaderFrame(this.mode, (now - this.started) / 1000));
      }
      this.frame = requestAnimationFrame(step);
    };
    this.frame = requestAnimationFrame(step);
  }
}

if (typeof customElements !== "undefined" && !customElements.get("heavy-element-loader")) {
  customElements.define("heavy-element-loader", HeavyElementLoader);
}
