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
import { allPages } from "../src/site/pages.js";
import { renderPage } from "../src/site/layout.js";

const web = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const PAGES_DIR = path.join(web, ".site");
export const OUT_DIR = path.join(web, "dist-site");
const CLIENT = path.join(web, "src/site/client.js");
const SITE_SRC = path.join(web, "src/site");
const PREVIEW_CSS = path.join(SITE_SRC, "preview.css");
/* Static files the public site ships, copied as is. Only these: web/public also
 * holds prototype fixtures (synthetic-parcels.pmtiles) that must never ship. */
export const STATIC_DIRS = ["editorial"];
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
    .map(({ id, country, name, modes }) => ({ id, country, name, modes }));
}

export function renderSite({ preview = false } = {}) {
  const content = loadContent(path.join(web, "../content"), {
    includePreview: preview,
  });
  const themes = availableThemes(content.themes, { preview });
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
        defaultTheme: content.themes.default,
        assets: { css: preview ? [fromPage(PREVIEW_CSS)] : [], js: [rel] },
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

async function main() {
  const argv = process.argv.slice(2);
  const preview = argv.includes("--preview");
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
  console.log(`built: ${path.relative(web, OUT_DIR)}/`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
