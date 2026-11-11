#!/usr/bin/env node
/* One-off, reviewed render of the static Hamilton map (decision 67): the
 * lower city and the harbourfront, from a dated Protomaps build of
 * OpenStreetMap data. Reads only the tiles it needs over HTTP range requests,
 * writes still images plus a provenance record to web/public/map/.
 *
 *   node build/map/render-hamilton.mjs --build 20261109 */

import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { createServer } from "vite";

const web = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = path.join(web, "public/map");
/* Lower city and harbourfront: Bayfront Park and the west harbour, the North
 * End and piers, downtown and Corktown up to the escarpment, east to the
 * industrial bayfront. [west, south, east, north] */
export const BOUNDS = [-79.905, 43.243, -79.825, 43.29];
const SIZES = [
  { name: "hamilton-lower-city-wide", width: 2000, height: 1250 },
  { name: "hamilton-lower-city-tall", width: 900, height: 1100 },
];

const build = process.argv[process.argv.indexOf("--build") + 1];
if (!/^\d{8}$/.test(build ?? ""))
  throw new Error("pass --build YYYYMMDD (a Protomaps daily build)");
const archive = `https://build.protomaps.com/${build}.pmtiles`;

const server = await createServer({
  root: web,
  configFile: false,
  logLevel: "error",
  server: {
    port: 5181,
    strictPort: true,
    host: "127.0.0.1",
    // build.protomaps.com sends no CORS headers; the dev server proxies it same-origin.
    proxy: {
      "/protomaps-build": {
        target: "https://build.protomaps.com",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/protomaps-build/, ""),
      },
    },
  },
});
await server.listen();
const browser = await chromium.launch({
  args: [
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
  ],
});
fs.mkdirSync(OUT, { recursive: true });
const outputs = [];
try {
  for (const s of SIZES) {
    const page = await browser.newPage({
      viewport: { width: s.width, height: s.height },
    });
    const url = `http://127.0.0.1:5181/build/map/render.html?archive=${encodeURIComponent(`/protomaps-build/${build}.pmtiles`)}&bounds=${encodeURIComponent(
      JSON.stringify([
        [BOUNDS[0], BOUNDS[1]],
        [BOUNDS[2], BOUNDS[3]],
      ]),
    )}`;
    await page.goto(url);
    await page.waitForFunction(
      () => window.__rendered || window.__renderError,
      null,
      { timeout: 180000 },
    );
    const err = await page.evaluate(() => window.__renderError);
    if (err) throw new Error(err);
    const r = await page.evaluate(() => window.__rendered);
    const buf = Buffer.from(r.webp.split(",")[1], "base64");
    const file = `${s.name}.webp`;
    fs.writeFileSync(path.join(OUT, file), buf);
    outputs.push({
      file,
      width: s.width,
      height: s.height,
      bytes: buf.length,
      sha256: createHash("sha256").update(buf).digest("hex"),
      zoom: Number(r.zoom.toFixed(3)),
      bounds: r.bounds,
    });
    await page.close();
  }
} finally {
  await browser.close();
  await server.close();
}
fs.writeFileSync(
  path.join(OUT, "hamilton-lower-city.json"),
  JSON.stringify(
    {
      subject: "Hamilton, Ontario: lower city and harbourfront",
      requested_bounds: BOUNDS,
      source: {
        archive,
        build,
        data: "OpenStreetMap contributors (ODbL), via Protomaps",
      },
      style: "web/build/map/style.js",
      outputs,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  outputs
    .map(
      (o) =>
        `${o.file} ${o.width}x${o.height} ${(o.bytes / 1024).toFixed(0)} KB z${o.zoom}`,
    )
    .join("\n"),
);
