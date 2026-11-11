#!/usr/bin/env node
/* Builds the public site (spec G section 2): load content/, render every URL
 * to its own HTML file, check every internal link, then bundle with Vite.
 *
 *   node build/prerender.mjs            public build  -> web/dist-site/
 *   node build/prerender.mjs --preview  adds preview content and a banner
 *   node build/prerender.mjs --pages-only   stop after writing web/.site/
 *
 * Fails closed: any content problem or broken internal link stops the build. */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadContent } from "./content-loader.mjs";
import { allPages, clientCatalogue } from "../src/site/pages.js";
import { renderPage } from "../src/site/layout.js";
import { SIGNUP } from "../src/site/signup-config.js";
import {
  budgetReport,
  contrastProblems,
  launchProblems,
  mapProblems,
  publicHygiene,
  themeVariants,
} from "./checks.mjs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";

const web = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const PAGES_DIR = path.join(web, ".site");
export const OUT_DIR = path.join(web, "dist-site");
const CLIENT = path.join(web, "src/site/client.js");
const SITE_SRC = path.join(web, "src/site");
/* Static files the public site ships, copied as is. Only these: web/public also
 * holds prototype fixtures (synthetic-parcels.pmtiles) that must never ship. */
export const STATIC_DIRS = ["editorial", "map", "flags"];
const STATIC_ROOT = path.join(web, "public");

/** "/" -> "index.html", "/a/b/" -> "a/b/index.html", "/404.html" -> "404.html". */
export const fileFor = (urlPath) =>
  urlPath.endsWith("/") ? `${urlPath.slice(1)}index.html` : urlPath.slice(1);

/** Internal links (href="/...") that don't resolve to a generated page or a public asset. */
export function brokenLinks(pages) {
  const known = new Set(pages.map((p) => p.path));
  const broken = [];
  for (const p of pages) {
    for (const [, href] of p.html.matchAll(/href="(\/[^"]*)"/g)) {
      const target = href.replace(/&amp;/g, "&").split(/[?#]/)[0];
      if (known.has(target)) continue;
      const top = target.split("/")[1];
      if (
        STATIC_DIRS.includes(top) &&
        fs.existsSync(path.join(STATIC_ROOT, target))
      )
        continue;
      broken.push(`${p.path} -> ${href}`);
    }
  }
  return broken;
}

/** Themes this build offers (spec D section 4): published ones, plus "design"
 *  ones with a token sheet in preview builds only. */
export function availableThemes(registry, { preview }) {
  return registry.themes
    .filter(
      (t) =>
        t.status === "published" ||
        (preview &&
          t.status === "design" &&
          t.tokens &&
          fs.existsSync(path.join(SITE_SRC, t.tokens))),
    )
    .map(({ id, country, name, modes, flag, tokens }) => ({
      id,
      country,
      name,
      modes,
      flag,
      tokens,
    }));
}

export function renderSite({ preview = false } = {}) {
  const content = loadContent(path.join(web, "../content"), {
    includePreview: preview,
  });
  const themes = availableThemes(content.themes, { preview });
  const catalogue = clientCatalogue(content);
  const pages = allPages(content).map((page) => {
    const file = fileFor(page.path);
    const fromPage = (target) =>
      path
        .relative(path.dirname(path.join(PAGES_DIR, file)), target)
        .split(path.sep)
        .join("/");
    const rel = fromPage(CLIENT);
    return {
      ...page,
      file,
      html: renderPage({
        ...page,
        regions: content.regions,
        preview,
        themes,
        catalogue,
        defaultTheme: content.themes.default,
        // Token sheets for every theme this build offers (spec D section 4).
        assets: {
          css: themes
            .filter((t) => t.tokens)
            .map((t) => fromPage(path.join(SITE_SRC, t.tokens))),
          js: [rel],
        },
      }),
    };
  });
  const dupes = pages
    .map((p) => p.path)
    .filter((p, i, a) => a.indexOf(p) !== i);
  if (dupes.length)
    throw new Error(`duplicate page paths: ${dupes.join(", ")}`);
  const broken = brokenLinks(pages);
  if (broken.length)
    throw new Error(`broken internal links:\n- ${broken.join("\n- ")}`);
  return pages;
}

export function writePages(pages) {
  fs.rmSync(PAGES_DIR, { recursive: true, force: true });
  for (const p of pages) {
    const file = path.join(PAGES_DIR, p.file);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, p.html);
  }
}

function fail(title, problems) {
  if (!problems.length) return;
  throw new Error(`${title}:\n- ${problems.join("\n- ")}`);
}

const sha256 = (file) =>
  createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const git = (...args) => {
  try {
    return execFileSync("git", ["-C", web, ...args], {
      encoding: "utf8",
    }).trim();
  } catch {
    return null;
  }
};

async function main() {
  const argv = process.argv.slice(2);
  const preview = argv.includes("--preview");
  const launch = argv.includes("--launch");
  if (launch && preview) throw new Error("--launch and --preview don't mix");
  const content = loadContent(path.join(web, "../content"), {
    includePreview: preview,
  });
  const themes = availableThemes(content.themes, { preview });

  // Gates that need no output first, so a bad build fails fast.
  if (launch)
    fail(
      "launch gates (spec G section 9)",
      launchProblems({ themes: content.themes, signup: SIGNUP }),
    );
  fail(
    "contrast (spec D section 8)",
    contrastProblems(
      themeVariants(
        SITE_SRC,
        content.themes.themes.filter((t) => themes.some((a) => a.id === t.id)),
      ),
    ),
  );

  const pages = renderSite({ preview });
  writePages(pages);
  console.log(`prerender: ${pages.length} pages${preview ? " (preview)" : ""}`);
  if (argv.includes("--pages-only")) return;

  const { build } = await import("vite");
  await build({
    configFile: false,
    root: PAGES_DIR,
    publicDir: false,
    base: "/",
    logLevel: "warn",
    build: {
      outDir: OUT_DIR,
      emptyOutDir: true,
      rollupOptions: { input: pages.map((p) => path.join(PAGES_DIR, p.file)) },
    },
  });
  for (const dir of STATIC_DIRS)
    fs.cpSync(path.join(STATIC_ROOT, dir), path.join(OUT_DIR, dir), {
      recursive: true,
    });

  const budgets = budgetReport(OUT_DIR);
  fail("size budgets (decision 56, BETA-GATE section 6)", budgets.problems);
  fail(
    "public build hygiene (spec G section 3)",
    publicHygiene(OUT_DIR, {
      preview,
      unpublished: content.themes.themes
        .filter((t) => t.status !== "published")
        .map((t) => t.id),
    }),
  );
  fail(
    "map checks (spec F section 7.4)",
    mapProblems(OUT_DIR, content.regions),
  );

  const record = {
    kind: preview ? "preview" : launch ? "launch" : "public",
    commit: git("rev-parse", "HEAD"),
    uncommitted_changes: Boolean(git("status", "--porcelain")),
    content_manifest_sha256: sha256(path.join(web, "../content/manifest.json")),
    snapshot: content.snapshot?.inputs ?? [],
    map: JSON.parse(
      fs.readFileSync(
        path.join(STATIC_ROOT, "map/hamilton-lower-city.json"),
        "utf8",
      ),
    ),
    themes: themes.map((t) => t.id),
    pages: pages.length,
    sizes_compressed: {
      startup_data: budgets.sizes.startupData,
      app_code: budgets.sizes.appCode,
    },
    total_bytes: budgets.sizes.total,
    checks: [
      "content",
      "links",
      "contrast",
      "budgets",
      "hygiene",
      "map",
      ...(launch ? ["launch"] : []),
    ],
  };
  fs.writeFileSync(
    path.join(OUT_DIR, "build-record.json"),
    JSON.stringify(record, null, 2) + "\n",
  );
  console.log(
    `built: ${path.relative(web, OUT_DIR)}/ · data ${(budgets.sizes.startupData / 1024).toFixed(1)} KB · app ${(budgets.sizes.appCode / 1024).toFixed(1)} KB compressed · ${budgets.sizes.files} files`,
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
