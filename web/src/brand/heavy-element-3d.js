/* Heavy element in 3D: a dependency-free canvas renderer for the HeavyMap mark.
 *
 * The geometry comes from extract.py (node, rays, fragments in source pixels).
 * Each ray is given a tilt out of the picture plane; with depth = 0 the front
 * view is exactly the flat logo, so every animation can "lock" into the mark.
 *
 * createHeavyElement(canvas, geometry, options) returns a controller:
 *   draw(state)  state = { yaw, pitch, depth, strike, node, dust, glow, flare }
 * The scenes below drive it over time.
 */

const TAU = Math.PI * 2;

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const ease = {
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
  inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outBack: (t) => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2),
  outExpo: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
};
export const clamp01 = (t) => Math.min(1, Math.max(0, t));
export const span = (t, a, b) => clamp01((t - a) / (b - a));

/** Turn flat geometry into a 3D model centred on the node. */
export function buildModel(geometry, { seed = 7, maxTilt = 52 } = {}) {
  const r = rng(seed);
  const { x: cx, y: cy, r: nodeR } = geometry.node;
  const scale = 1 / Math.max(geometry.width, geometry.height) * 2;
  const rays = geometry.rays.map((ray, i) => {
    const ax = (ray.x1 - cx) * scale, ay = (ray.y1 - cy) * scale;
    const bx = (ray.x2 - cx) * scale, by = (ray.y2 - cy) * scale;
    const len = Math.hypot(bx - ax, by - ay);
    const ux = (bx - ax) / len, uy = (by - ay) / len;
    // closest approach of the line to the node: depth grows away from it
    const s0 = -(ax * ux + ay * uy);
    const tilt = (r() * 2 - 1) * maxTilt * Math.PI / 180;
    const k = Math.tan(tilt);
    const nearA = Math.hypot(ax, ay) <= Math.hypot(bx, by);
    return {
      a: [ax, ay, (0 - s0) * k], b: [bx, by, (len - s0) * k],
      // strike grows from the end nearer the node
      from: nearA ? "a" : "b",
      width: ray.width * scale, tone: ray.tone, order: r(), i,
    };
  });
  const fragments = geometry.fragments.map((f) => {
    const x = (f.x - cx) * scale, y = (f.y - cy) * scale;
    const d = Math.hypot(x, y);
    return {
      p: [x, y, (r() * 2 - 1) * (0.25 + d) * 0.9],
      size: f.size * scale, angle: f.angle * Math.PI / 180, tone: f.tone,
      spin: (r() * 2 - 1) * 2.5, drift: [r() * 2 - 1, r() * 2 - 1, r() * 2 - 1],
    };
  });
  return { rays, fragments, nodeR: nodeR * scale, extent: 1 };
}

export function createHeavyElement(canvas, geometry, { seed = 7, background = null, ink = "light" } = {}) {
  const ctx = canvas.getContext("2d");
  let model = buildModel(geometry, { seed });
  let w = 0, h = 0, dpr = 1;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const box = canvas.getBoundingClientRect();
    w = Math.max(1, Math.round(box.width));
    h = Math.max(1, Math.round(box.height));
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  resize();

  function project(p, st, size) {
    const [x0, y0, z0] = [p[0], p[1], p[2] * st.depth];
    const cyw = Math.cos(st.yaw), syw = Math.sin(st.yaw);
    const x1 = x0 * cyw + z0 * syw;
    const z1 = -x0 * syw + z0 * cyw;
    const cp = Math.cos(st.pitch), sp = Math.sin(st.pitch);
    const y2 = y0 * cp - z1 * sp;
    const z2 = y0 * sp + z1 * cp;
    const camera = st.camera ?? 3.2;
    const f = camera / (camera - z2);
    return { x: w / 2 + x1 * f * size, y: h * (st.cy ?? 0.5) + y2 * f * size, z: z2, f };
  }

  function grey(tone, light, alpha = 1) {
    // light ink for dark grounds; dark ink keeps the same tonal order on light grounds
    const v = ink === "dark"
      ? Math.round(36 + (1 - Math.min(1, tone * light)) * 150)
      : Math.round(255 * Math.min(1, tone * light));
    return `rgba(${v},${v},${v},${alpha})`;
  }

  function draw(state) {
    const st = { yaw: 0, pitch: 0, depth: 1, strike: 1, node: 1, dust: 1, glow: 0, flare: -1, scale: 0.86, tint: null, ...state };
    const size = Math.min(w, h) / 2 * st.scale;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (background) { ctx.fillStyle = background; ctx.fillRect(0, 0, w, h); }
    else ctx.clearRect(0, 0, w, h);
    ctx.lineCap = "round";

    const items = [];
    for (const ray of model.rays) {
      const s = typeof st.strike === "function" ? st.strike(ray) : st.strike;
      if (s <= 0) continue;
      const start = ray[ray.from], end = ray.from === "a" ? ray.b : ray.a;
      const tip = [start[0] + (end[0] - start[0]) * s, start[1] + (end[1] - start[1]) * s, start[2] + (end[2] - start[2]) * s];
      const p = project(start, st, size), q = project(tip, st, size);
      items.push({ kind: "ray", z: (p.z + q.z) / 2, p, q, ray, s });
    }
    for (const fr of model.fragments) {
      if (st.dust <= 0) continue;
      const t = st.time ?? 0;
      const drift = st.scatter ?? 0;
      const pos = [fr.p[0] + fr.drift[0] * drift, fr.p[1] + fr.drift[1] * drift, fr.p[2] + fr.drift[2] * drift];
      const p = project(pos, st, size);
      items.push({ kind: "frag", z: p.z, p, fr, rot: fr.angle + fr.spin * t * 0.4 });
    }
    items.push({ kind: "node", z: 0 });
    items.sort((a, b) => a.z - b.z);

    for (const it of items) {
      if (it.kind === "ray") {
        const light = 0.62 + 0.38 * clamp01((it.z + 1) / 2) ;
        const wpx = Math.max(0.6, it.ray.width * size * (it.p.f + it.q.f) / 2);
        if (st.glow > 0) { ctx.shadowColor = st.tint ?? "rgba(255,255,255,0.9)"; ctx.shadowBlur = st.glow * 14; }
        ctx.strokeStyle = grey(it.ray.tone, light);
        ctx.lineWidth = wpx;
        ctx.beginPath(); ctx.moveTo(it.p.x, it.p.y); ctx.lineTo(it.q.x, it.q.y); ctx.stroke();
        if (st.strike !== 1 && it.s < 1 && it.s > 0) {
          // the striking tip carries a spark
          ctx.shadowBlur = 0;
          ctx.fillStyle = "rgba(255,248,232,0.95)";
          ctx.beginPath(); ctx.arc(it.q.x, it.q.y, wpx * 1.4, 0, TAU); ctx.fill();
        }
      } else if (it.kind === "frag") {
        const s = Math.max(0.8, it.fr.size * size * it.p.f);
        const light = 0.7 + 0.3 * clamp01((it.z + 1) / 2);
        ctx.shadowBlur = st.glow > 0 ? st.glow * 6 : 0;
        ctx.save(); ctx.translate(it.p.x, it.p.y); ctx.rotate(it.rot);
        ctx.fillStyle = grey(it.fr.tone, light, st.dust);
        ctx.fillRect(-s / 2, -s * 0.3, s, s * 0.6);
        ctx.restore();
      } else {
        if (st.node <= 0) continue;
        const c = project([0, 0, 0], st, size);
        const rad = model.nodeR * size * c.f * st.node;
        ctx.shadowBlur = 0;
        if (st.glow > 0) {
          const g = ctx.createRadialGradient(c.x, c.y, rad * 0.4, c.x, c.y, rad * (2.4 + st.glow * 3));
          g.addColorStop(0, `rgba(255,252,240,${0.55 * st.glow})`);
          g.addColorStop(1, "rgba(255,252,240,0)");
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c.x, c.y, rad * (2.4 + st.glow * 3), 0, TAU); ctx.fill();
        }
        const g2 = ctx.createRadialGradient(c.x - rad * 0.35, c.y - rad * 0.4, rad * 0.1, c.x, c.y, rad);
        if (ink === "dark") { g2.addColorStop(0, "#4a5a63"); g2.addColorStop(1, "#22303a"); }
        else { g2.addColorStop(0, "#ffffff"); g2.addColorStop(1, "#d9dddd"); }
        ctx.fillStyle = g2; ctx.beginPath(); ctx.arc(c.x, c.y, rad, 0, TAU); ctx.fill();
      }
    }
    ctx.shadowBlur = 0;

    if (st.flare >= 0 && st.flare <= 1) {
      // a band of light sweeping across, like a lens flare on a studio logo
      const x = -w * 0.3 + st.flare * w * 1.6;
      const g = ctx.createLinearGradient(x - w * 0.07, 0, x + w * 0.07, h * 0.35);
      g.addColorStop(0, "rgba(255,255,255,0)");
      g.addColorStop(0.5, "rgba(255,250,235,0.10)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = "source-over";
    }
  }

  return {
    draw, resize,
    reseed(s) { model = buildModel(geometry, { seed: s }); },
    get model() { return model; },
  };
}
