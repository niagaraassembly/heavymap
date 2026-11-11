/* Build checks (spec G section 2; specs D section 8 and F section 7.4).
 * Each check returns a list of problems; the build fails closed on any.
 * Launch-only gates (decision 36 themes, spec E signup) run with --launch. */

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

/* ---- contrast (spec D section 8, D-T4) ------------------------------------ */

const lum = (hex) => {
  const h = hex.replace("#", "").slice(0, 6);
  const c = [0, 2, 4]
    .map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
    .map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
export const contrast = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

/** { selector: { --token: value } } for every top-level block in a CSS file. */
export function tokenBlocks(css) {
  const out = {};
  for (const m of css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const sel = m[1].trim();
    for (const d of m[2].matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g))
      (out[sel] ??= {})[d[1]] = d[2].trim();
  }
  return out;
}

/** Text tokens that must reach 4.5:1 on every surface; non-text ones 3:1 (WCAG 2.2 AA). */
export const TEXT_TOKENS = [
  "--text",
  "--text-body",
  "--text-muted",
  "--text-faint",
  "--accent-strong",
  "--green-strong",
  "--amount-done",
  "--amount-announced",
  "--flag-warn",
  "--flag-info",
];
export const UI_TOKENS = ["--focus-ring", "--accent", "--green"];
export const SURFACES = ["--surface", "--surface-tint", "--surface-raised"];

/**
 * @param {{name:string, vars:object}[]} variants  resolved token sets (theme × mode)
 */
export function contrastProblems(variants) {
  const problems = [];
  for (const { name, vars } of variants) {
    const resolve = (v, depth = 0) => {
      const val = vars[v];
      const ref = /^var\((--[a-z0-9-]+)\)$/.exec(val ?? "");
      return ref && depth < 5 ? resolve(ref[1], depth + 1) : val;
    };
    for (const [tokens, min] of [
      [TEXT_TOKENS, 4.5],
      [UI_TOKENS, 3],
    ]) {
      for (const t of tokens) {
        for (const s of SURFACES) {
          const fg = resolve(t);
          const bg = resolve(s);
          if (
            !/^#[0-9a-f]{6}/i.test(fg ?? "") ||
            !/^#[0-9a-f]{6}/i.test(bg ?? "")
          )
            continue;
          const r = contrast(fg, bg);
          if (r < min)
            problems.push(
              `${name}: ${t} on ${s} is ${r.toFixed(2)}:1, needs ${min}:1`,
            );
        }
      }
    }
  }
  return problems;
}

/** Every theme and mode this build offers, as resolved token sets. */
export function themeVariants(siteSrc, themes) {
  const base = tokenBlocks(
    fs.readFileSync(path.join(siteSrc, "tokens.css"), "utf8"),
  );
  const light = base[":root"] ?? {};
  const variants = [];
  for (const t of themes) {
    let vars = { ...light };
    if (t.tokens)
      vars = {
        ...vars,
        ...(tokenBlocks(fs.readFileSync(path.join(siteSrc, t.tokens), "utf8"))[
          `:root[data-theme="${t.id}"]`
        ] ?? {}),
      };
    variants.push({ name: `${t.id}/light`, vars });
    if (t.modes.includes("dark"))
      variants.push({
        name: `${t.id}/dark`,
        vars: { ...vars, ...(base[':root[data-mode="dark"]'] ?? {}) },
      });
  }
  return variants;
}

/* ---- output (spec G section 2) --------------------------------------------- */

const walk = (dir) =>
  fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((e) =>
      e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)],
    );
const gz = (buf) => zlib.gzipSync(buf, { level: 9 }).length;

export const BUDGETS = {
  startupData: 50 * 1024, // decision 56: start-up data ≤ 50 KB compressed
  appCode: 500 * 1024, // decision 56: app code ≤ 500 KB compressed
  file: 100 * 1024 * 1024, // each file ≤ 100 MB
  site: 1024 * 1024 * 1024, // site ≤ 1 GB
};

/** Sizes and budget problems for a built site. */
export function budgetReport(outDir) {
  const files = walk(outDir);
  const sizes = files.map((f) => ({ f, bytes: fs.statSync(f).size }));
  const total = sizes.reduce((n, s) => n + s.bytes, 0);
  const assets = files.filter((f) => /\/assets\/.+\.(js|css)$/.test(f));
  const appCode = assets.reduce((n, f) => n + gz(fs.readFileSync(f)), 0);
  // Start-up data: the JSON a page embeds (the client catalogue). Largest page counts.
  let startupData = 0;
  for (const f of files.filter((x) => x.endsWith(".html"))) {
    const m =
      /<script type="application\/json" id="hm-catalogue">([\s\S]*?)<\/script>/.exec(
        fs.readFileSync(f, "utf8"),
      );
    if (m) startupData = Math.max(startupData, gz(Buffer.from(m[1])));
  }
  const problems = [];
  if (startupData > BUDGETS.startupData)
    problems.push(
      `start-up data ${kb(startupData)} > ${kb(BUDGETS.startupData)} compressed`,
    );
  if (appCode > BUDGETS.appCode)
    problems.push(
      `app code ${kb(appCode)} > ${kb(BUDGETS.appCode)} compressed`,
    );
  for (const s of sizes)
    if (s.bytes > BUDGETS.file)
      problems.push(`${path.relative(outDir, s.f)} is over 100 MB`);
  if (total > BUDGETS.site) problems.push(`site is ${kb(total)}, over 1 GB`);
  return {
    problems,
    sizes: { startupData, appCode, total, files: files.length },
  };
}
const kb = (n) => `${(n / 1024).toFixed(1)} KB`;

/** Things a public build must never contain. */
export function publicHygiene(outDir, { preview }) {
  const problems = [];
  const files = walk(outDir).map((f) =>
    path.relative(outDir, f).split(path.sep).join("/"),
  );
  for (const f of files) {
    if (/\.pmtiles$/.test(f))
      problems.push(`${f}: map tiles must not ship in v1`);
    if (/^(studies|compare|alternate|site)\b|round-two/.test(f))
      problems.push(`${f}: review-only page in output`);
  }
  if (!preview) {
    for (const f of files.filter((x) => /\.(html|css|js)$/.test(x))) {
      const text = fs.readFileSync(path.join(outDir, f), "utf8");
      if (text.includes("Preview · not public"))
        problems.push(`${f}: preview banner in a public build`);
      if (/data-theme="(ca|jp)"|data-theme=(ca|jp)\b/.test(text))
        problems.push(`${f}: a design-status theme sheet in a public build`);
    }
  }
  return problems;
}

/** Spec F section 7.4: the map introduction carries no Atlas identifiers; no workspace page while preparing. */
export function mapProblems(outDir, regions) {
  const problems = [];
  const intro = path.join(outDir, "map/index.html");
  if (fs.existsSync(intro)) {
    const html = fs.readFileSync(intro, "utf8");
    for (const [re, what] of [
      [/heavymap_id/, "heavymap_id"],
      [/\bhm:[a-z]{2}:/, "an hm: identifier"],
      [/\bLYR-[A-Z]/, "an Atlas layer id"],
      [/\blens(es)?\b/i, "a lens name"],
    ]) {
      if (re.test(html)) problems.push(`map/index.html contains ${what}`);
    }
  }
  for (const r of regions) {
    for (const g of r.geographies ?? []) {
      if (
        g.map?.status !== "published" &&
        fs.existsSync(path.join(outDir, "map", g.slug))
      )
        problems.push(
          `map/${g.slug}/ exists but ${g.name} is ${g.map?.status}`,
        );
    }
  }
  return problems;
}

/* ---- launch gates (only with --launch) ------------------------------------- */

export function launchProblems({ themes, signup }) {
  const problems = [];
  for (const t of themes.themes)
    if (t.status !== "published")
      problems.push(
        `theme ${t.id} is "${t.status}"; decision 36 needs all three themes published at launch (HM-014)`,
      );
  if (!signup.action || Object.values(signup.entries).some((v) => !v))
    problems.push(
      "signup-config.js is not filled in (web/apps-script/README.md step 2)",
    );
  return problems;
}
