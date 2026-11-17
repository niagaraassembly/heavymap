/* Browser check for BL-118 parcel workspace against the built site.
 * Serves web/dist-site (already built with --launch) on 127.0.0.1:4173
 * with Range support (PMTiles needs it; python http.server does not
 * serve ranges) and drives it with Playwright. Usage:
 *   node check-parcel-workspace.mjs
 * Screenshots land in ~/workspace/heavymap-review/. */
import { chromium } from "@playwright/test";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const BASE = "http://127.0.0.1:4173";
const SHOTS = "/home/hatch/workspace/heavymap-review/";
const DIST = path.resolve(import.meta.dirname, "../dist-site");
const TYPICAL = "ia:ca:on:hamilton:parcel:01M54B6GD9XTMCH94PJVGFN000";
const MANY = "ia:ca:on:hamilton:parcel:01M54B6K2D08KQ3CNTH8S56PWR";

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".pmtiles": "application/octet-stream",
  ".woff2": "font/woff2",
  ".webp": "image/webp",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split("?")[0]);
  let file = path.join(DIST, url === "/" ? "index.html" : url);
  if (url.endsWith("/")) file = path.join(file, "index.html");
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) {
      res.writeHead(404);
      res.end("not found");
      return;
    }
    const type = TYPES[path.extname(file)] ?? "application/octet-stream";
    const range = req.headers.range;
    if (range) {
      const m = /bytes=(\d*)-(\d*)/.exec(range);
      const start = m?.[1] ? Number(m[1]) : 0;
      const end = m?.[2] ? Number(m[2]) : st.size - 1;
      res.writeHead(206, {
        "Content-Type": type,
        "Accept-Ranges": "bytes",
        "Content-Range": `bytes ${start}-${end}/${st.size}`,
        "Content-Length": end - start + 1,
      });
      fs.createReadStream(file, { start, end }).pipe(res);
      return;
    }
    res.writeHead(200, { "Content-Type": type, "Accept-Ranges": "bytes", "Content-Length": st.size });
    fs.createReadStream(file).pipe(res);
  });
});
await new Promise((resolve) => server.listen(4173, "127.0.0.1", resolve));

const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

const browser = await chromium.launch({
  args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e.message)));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});

async function mapReady() {
  await page.goto(`${BASE}/map/`);
  await page.locator("#map-status").waitFor();
  await page.waitForFunction(
    () => document.getElementById("map-status")?.textContent.includes("selectable from zoom 14"),
    { timeout: 30000 },
  );
}
async function activeWhere() {
  return page.evaluate(() => {
    const a = document.activeElement;
    if (!a) return "(none)";
    const ws = a.closest(".parcel-workspace");
    return `${a.tagName}.${String(a.className).split(" ")[0]}${ws ? " in-workspace" : ""}`;
  });
}

try {
  await mapReady();
  check("map loads, parcel tiles ready", true, await page.locator("#map-status").textContent());

  // 1. Deep link opens the workspace on the typical parcel.
  await page.goto(`${BASE}/map/#parcel=${TYPICAL}&view=work`);
  await page.locator(".parcel-workspace").waitFor({ state: "visible", timeout: 30000 });
  const title = await page.locator(".parcel-workspace .parcel-title").textContent();
  check("deep link opens workspace", title === "155 Moore Cres", `title=${title}`);
  const crumb = await page.locator(".parcel-ws-crumb").textContent();
  check("breadcrumb names place and parcel", crumb === "Hamilton › Ancaster › Parcel", crumb);
  const facts = await page.locator(".parcel-ws-fact").count();
  check("record has six fact rows", facts === 6, `facts=${facts}`);
  const sections = await page.locator(".parcel-ws-sec").count();
  check("record has five sections", sections === 5, `sections=${sections}`);
  const tabs = await page.locator(".parcel-ws-tab").count();
  check("work area has six tabs", tabs === 6, `tabs=${tabs}`);
  const notesSelected = await page.locator('.parcel-ws-tab[aria-selected="true"]').textContent();
  check("Notes is the selected tab", notesSelected.includes("Notes"), notesSelected.trim());
  const onDevice = await page.locator(".parcel-ws-ondevice").textContent();
  check("device-only line is visible", onDevice === "Notes stay on this device", onDevice);
  const box = await page.locator(".parcel-workspace").boundingBox();
  const vp = page.viewportSize();
  check(
    "workspace fits the map window",
    box.y >= 0 && box.y + box.height <= vp.height && box.x >= 0 && box.x + box.width <= vp.width,
    `box=${Math.round(box.x)},${Math.round(box.y)} ${Math.round(box.width)}x${Math.round(box.height)} vp=${vp.width}x${vp.height}`,
  );
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check("no horizontal overflow on desktop", overflow <= 0, `overflow=${overflow}px`);
  await page.screenshot({ path: `${SHOTS}parcel-workspace-desktop.png` });

  // 2. A fact row discloses source, join and confidence in place.
  await page.locator('.parcel-ws-fact-btn:has(> .parcel-ws-fact-label:text-is("Area"))').click();
  const disclosure = await page.locator(".parcel-ws-fact-src").first().textContent();
  check(
    "Area fact discloses source, join, confidence",
    disclosure.includes("Hamilton Assessment Parcel") &&
      disclosure.includes("Area of the City parcel polygon") &&
      disclosure.includes("one-to-one or point-in-polygon"),
    disclosure,
  );

  // 3. Sections: Addresses is closed by default for one address; open it.
  const addrExpanded = await page.locator('.parcel-ws-sec[data-sec="addresses"] .parcel-ws-sec-btn').getAttribute("aria-expanded");
  check("Addresses closed by default for one address", addrExpanded === "false", `aria-expanded=${addrExpanded}`);
  await page.locator('.parcel-ws-sec[data-sec="addresses"] .parcel-ws-sec-btn').click();
  const addrText = await page.locator('.parcel-ws-sec[data-sec="addresses"] .parcel-ws-sec-body').textContent();
  check("Addresses list shows the address", addrText.includes("155 MOORE CRESCENT"), addrText.trim().slice(0, 80));
  const gapsCount = await page.locator('.parcel-ws-sec[data-sec="gaps"] .parcel-ws-sec-btn em').textContent();
  check("Known gaps section counts 2", gapsCount === "2", `count=${gapsCount}`);

  // 4. Notes: add, reload, delete.
  await page.locator(".parcel-ws-compose textarea").fill("Check the zoning exception text.");
  await page.locator('.parcel-ws-compose button:has-text("Add note")').click();
  const noteText = await page.locator(".parcel-ws-note p").first().textContent();
  check("note added to the list", noteText === "Check the zoning exception text.", noteText);
  const tabCount = await page.locator(".parcel-ws-tab-count").textContent();
  check("Notes tab counts 1", tabCount === "1", `count=${tabCount}`);
  await page.reload();
  await page.locator(".parcel-workspace").waitFor({ state: "visible", timeout: 30000 });
  const survived = await page.locator(".parcel-ws-note p").first().textContent();
  check("note survives a reload", survived === "Check the zoning exception text.", survived);
  await page.screenshot({ path: `${SHOTS}parcel-workspace-notes.png` });
  await page.locator('.parcel-ws-note button:has-text("Delete note")').click();
  check("note deleted", (await page.locator(".parcel-ws-note").count()) === 0);
  const emptyShown = await page.locator(".parcel-ws-empty").isVisible();
  check("empty state shows after delete", emptyShown);

  // 5. Escape steps back workspace -> drawer -> card -> closed.
  await page.keyboard.press("Escape");
  await page.locator(".parcel-drawer").waitFor({ state: "visible" });
  await page.locator(".parcel-workspace").waitFor({ state: "hidden" });
  check("Escape workspace -> drawer", true, `focus=${await activeWhere()}`);
  await page.keyboard.press("Escape");
  await page.locator(".parcel-card").waitFor({ state: "visible" });
  check("Escape drawer -> card", true);
  await page.keyboard.press("Escape");
  await page.locator(".parcel-card").waitFor({ state: "hidden" });
  check("Escape card -> closed, focus back to search", (await page.evaluate(() => document.activeElement?.id)) === "hm-map-search");

  // 6. Drawer buttons now open the workspace; Note lands on Notes.
  await page.goto(`${BASE}/map/#parcel=${TYPICAL}`);
  await page.locator(".parcel-drawer").waitFor({ state: "visible", timeout: 30000 });
  const openWsDisabled = await page.locator('.parcel-drawer .parcel-btn-pri:has-text("Open workspace")').isDisabled();
  const noteDisabled = await page.locator('.parcel-drawer .parcel-btn:has-text("Note")').isDisabled();
  check("drawer Open workspace and Note are enabled", !openWsDisabled && !noteDisabled);
  await page.locator('.parcel-drawer .parcel-btn:has-text("Note")').click();
  await page.locator(".parcel-workspace").waitFor({ state: "visible" });
  check("Note opens the workspace on the Notes tab", (await page.locator('.parcel-ws-tab[aria-selected="true"]').textContent()).includes("Notes"));

  // 7. Focus stays trapped inside the workspace.
  let trapped = true;
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press("Tab");
    if (!(await activeWhere()).includes("in-workspace")) {
      trapped = false;
      break;
    }
  }
  check("Tab stays inside the workspace", trapped, `focus=${await activeWhere()}`);

  // 8. Section memory: open Addresses, close it, switch parcel, come back.
  // (The reload in step 4 reset the in-memory section state, so open it
  // first if it is closed.)
  const addrBtn = page.locator('.parcel-ws-sec[data-sec="addresses"] .parcel-ws-sec-btn');
  if ((await addrBtn.getAttribute("aria-expanded")) === "false") await addrBtn.click();
  await addrBtn.click();
  const closedAgain = await addrBtn.getAttribute("aria-expanded");
  check("Addresses closes on toggle", closedAgain === "false");
  await page.goto(`${BASE}/map/#parcel=${MANY}&view=work`);
  await page.locator(".parcel-workspace").waitFor({ state: "visible", timeout: 30000 });
  const manyAddrOpen = await page.locator('.parcel-ws-sec[data-sec="addresses"] .parcel-ws-sec-btn').getAttribute("aria-expanded");
  check("Addresses stays closed on the next parcel", manyAddrOpen === "false", `aria-expanded=${manyAddrOpen}`);
  await page.locator('.parcel-ws-sec[data-sec="addresses"] .parcel-ws-sec-btn').click();
  const filterVisible = await page.locator(".parcel-ws-filter").isVisible();
  check("947-address parcel shows the filter box", filterVisible);
  await page.locator(".parcel-ws-filter").fill("43 HUGHSON");
  const filterCount = await page.locator(".parcel-ws-filter-count").textContent();
  const shown = Number(/Showing (\d+) of 947/.exec(filterCount)?.[1] ?? -1);
  check("filter narrows the address list", shown === 1, filterCount);
  const visibleRows = await page.locator('.parcel-ws-sec[data-sec="addresses"] .parcel-ws-list li:not([hidden])').count();
  check("filtered rows are a subset", visibleRows === shown, `rows=${visibleRows} shown=${shown}`);

  // 9. Phone viewport: full screen, Record / Notes switch.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE}/map/#parcel=${TYPICAL}&view=work`);
  await page.locator(".parcel-workspace").waitFor({ state: "visible", timeout: 30000 });
  const mobOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check("no horizontal overflow on phone workspace", mobOverflow <= 0, `overflow=${mobOverflow}px`);
  const switchVisible = await page.locator(".parcel-ws-switch").isVisible();
  const workHidden = await page.locator(".parcel-ws-work").isHidden();
  check("phone shows Record/Notes switch, record first", switchVisible && workHidden);
  await page.locator('.parcel-ws-switch-btn:has-text("Notes")').click();
  const workShown = await page.locator(".parcel-ws-work").isVisible();
  const recordHidden = await page.locator(".parcel-ws-record").isHidden();
  check("phone Notes switch shows the work area", workShown && recordHidden);
  await page.screenshot({ path: `${SHOTS}parcel-workspace-mobile.png` });
} catch (e) {
  check("script completed without exception", false, String(e).split("\n")[0]);
} finally {
  check("no page errors", errors.length === 0, errors.slice(0, 3).join(" | "));
  await browser.close();
  server.close();
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
