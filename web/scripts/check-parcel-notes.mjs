/* Browser check for the standalone Notes service (BL-118 follow-up).
 * Serves web/dist-site (already built with --launch) on 127.0.0.1:4173
 * with Range support (PMTiles needs it; python http.server does not
 * serve ranges) and drives it with Playwright. Usage:
 *   node check-parcel-notes.mjs
 * Screenshots land in ~/workspace/heavymap-review/. */
import { chromium } from "@playwright/test";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const BASE = "http://127.0.0.1:4173";
const SHOTS = "/home/hatch/workspace/heavymap-review/";
const DIST = path.resolve(import.meta.dirname, "../dist-site");
const TYPICAL = "ia:ca:on:hamilton:parcel:01M54B6GD9XTMCH94PJVGFN000";

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
    res.writeHead(200, {
      "Content-Type": type,
      "Accept-Ranges": "bytes",
      "Content-Length": st.size,
    });
    fs.createReadStream(file).pipe(res);
  });
});
await new Promise((resolve) => server.listen(4173, "127.0.0.1", resolve));

const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(
    `${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`,
  );
}

const browser = await chromium.launch({
  args: [
    "--no-sandbox",
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
  ],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e.message)));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});

try {
  // 1. Empty state on a fresh profile.
  await page.goto(`${BASE}/notes/`);
  await page.locator("[data-notes-page]").waitFor({ state: "visible" });
  check("notes page loads", true);
  check(
    "empty state shows with no notes",
    await page.locator("[data-notes-empty]").isVisible(),
  );
  check(
    "no groups with no notes",
    (await page.locator(".hm-notes-group").count()) === 0,
  );

  // 2. A general note, created on the page itself.
  await page
    .locator("[data-notes-compose] textarea")
    .fill("A thought with no parcel.");
  await page.locator("[data-notes-add]").click();
  await page
    .locator('.hm-notes-group:has-text("General notes")')
    .waitFor({ state: "visible" });
  const generalText = await page
    .locator(".hm-notes-group .hm-notes-note p")
    .first()
    .textContent();
  check(
    "general note appears in the General group",
    generalText === "A thought with no parcel.",
    generalText,
  );
  const generalLinks = await page
    .locator('.hm-notes-group:has-text("General notes") a')
    .count();
  check(
    "General group has no parcel link",
    generalLinks === 0,
    `links=${generalLinks}`,
  );
  await page.reload();
  await page.locator("[data-notes-page]").waitFor({ state: "visible" });
  check(
    "general note survives a reload",
    (await page
      .locator(".hm-notes-group .hm-notes-note p")
      .first()
      .textContent()) === "A thought with no parcel.",
  );

  // 3. A parcel note, created in the workspace, groups by its parcel.
  await page.goto(`${BASE}/map/#parcel=${TYPICAL}&view=work`);
  await page
    .locator(".parcel-workspace")
    .waitFor({ state: "visible", timeout: 30000 });
  await page
    .locator(".parcel-ws-compose textarea")
    .fill("Check the zoning exception text.");
  await page.locator('.parcel-ws-compose button:has-text("Add note")').click();
  await page.locator(".parcel-ws-note p").first().waitFor({ state: "visible" });
  const allNotesHref = await page
    .locator(".parcel-ws-all-notes")
    .getAttribute("href");
  check(
    "workspace Notes tab links to /notes/",
    allNotesHref === "/notes/",
    `href=${allNotesHref}`,
  );
  await page.locator(".parcel-ws-all-notes").click();
  await page.locator("[data-notes-page]").waitFor({ state: "visible" });
  check(
    "View all notes lands on /notes/",
    page.url().endsWith("/notes/"),
    page.url(),
  );
  const parcelHeading = await page
    .locator('.hm-notes-group:has-text("155 Moore Cres") h2')
    .textContent();
  check(
    "parcel group is headed by the parcel address",
    parcelHeading === "155 Moore Cres",
    parcelHeading,
  );
  const parcelText = await page
    .locator('.hm-notes-group:has-text("155 Moore Cres") .hm-notes-note p')
    .first()
    .textContent();
  check(
    "parcel note is in its parcel group",
    parcelText === "Check the zoning exception text.",
    parcelText,
  );
  const openHref = await page
    .locator('.hm-notes-group:has-text("155 Moore Cres") .hm-notes-open')
    .getAttribute("href");
  check(
    "Open parcel links back to the map workspace",
    openHref === `/map/#parcel=${encodeURIComponent(TYPICAL)}&view=work`,
    openHref,
  );
  check(
    "General group still present alongside",
    (await page
      .locator('.hm-notes-group:has-text("General notes")')
      .count()) === 1,
  );
  await page.screenshot({ path: `${SHOTS}parcel-notes-page-desktop.png` });

  // 3b. Layout: the notes rules must actually load and the page must read
  // as designed — label above the box, full-width textarea, right-aligned
  // Add button, notes as cards, Open parcel visibly a link.
  const labelBox = await page.locator(".hm-notes-compose label").boundingBox();
  const areaBox = await page
    .locator("[data-notes-compose] textarea")
    .boundingBox();
  const composeBox = await page.locator("[data-notes-compose]").boundingBox();
  check(
    "compose label sits above the textarea, no overlap",
    labelBox.y + labelBox.height <= areaBox.y + 1,
    `label bottom=${Math.round(labelBox.y + labelBox.height)} textarea top=${Math.round(areaBox.y)}`,
  );
  check(
    "textarea is full width",
    areaBox.width >= composeBox.width * 0.9,
    `textarea=${Math.round(areaBox.width)} compose=${Math.round(composeBox.width)}`,
  );
  const addBox = await page.locator("[data-notes-add]").boundingBox();
  check(
    "Add note is right-aligned",
    Math.abs(addBox.x + addBox.width - (composeBox.x + composeBox.width)) <= 2,
    `button right=${Math.round(addBox.x + addBox.width)} compose right=${Math.round(composeBox.x + composeBox.width)}`,
  );
  check(
    "Add note is disabled while the box is empty",
    await page.locator("[data-notes-add]").isDisabled(),
  );
  const cardRadius = await page
    .locator(".hm-notes-note")
    .first()
    .evaluate((e) => getComputedStyle(e).borderTopLeftRadius);
  const cardBorder = await page
    .locator(".hm-notes-note")
    .first()
    .evaluate((e) => getComputedStyle(e).borderTopWidth);
  check(
    "notes render as cards",
    parseFloat(cardRadius) > 0 && parseFloat(cardBorder) >= 1,
    `radius=${cardRadius} border=${cardBorder}`,
  );
  const openLink = page.locator(
    '.hm-notes-group:has-text("155 Moore Cres") .hm-notes-open',
  );
  const openDeco = await openLink.evaluate(
    (e) => getComputedStyle(e).textDecorationLine,
  );
  const openCursor = await openLink.evaluate((e) => getComputedStyle(e).cursor);
  const openBorder = await openLink.evaluate(
    (e) => getComputedStyle(e).borderTopWidth,
  );
  check(
    "Open parcel is a visible button-like link",
    parseFloat(openBorder) >= 1 && openCursor === "pointer",
    `decoration=${openDeco} cursor=${openCursor} border=${openBorder}`,
  );
  check(
    "each group has a header row",
    (await page.locator(".hm-notes-group-head").count()) === 2,
    `heads=${await page.locator(".hm-notes-group-head").count()}`,
  );
  const deskOverflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
  check(
    "no horizontal overflow on desktop notes page",
    deskOverflow <= 0,
    `overflow=${deskOverflow}px`,
  );

  // 4. The Open-parcel link returns to the workspace for that parcel.
  await page
    .locator('.hm-notes-group:has-text("155 Moore Cres") .hm-notes-open')
    .click();
  await page
    .locator(".parcel-workspace")
    .waitFor({ state: "visible", timeout: 30000 });
  check(
    "Open parcel returns to the map workspace",
    page.url().includes(`#parcel=${encodeURIComponent(TYPICAL)}&view=work`),
    page.url(),
  );
  const wsNote = await page.locator(".parcel-ws-note p").first().textContent();
  check(
    "the same note is in the workspace",
    wsNote === "Check the zoning exception text.",
    wsNote,
  );

  // 5. Deleting from /notes/ removes the note everywhere; the other group is untouched.
  await page.goto(`${BASE}/notes/`);
  await page.locator("[data-notes-page]").waitFor({ state: "visible" });
  await page
    .locator(
      '.hm-notes-group:has-text("General notes") .hm-notes-note button:has-text("Delete note")',
    )
    .click();
  check(
    "general note deleted",
    (await page
      .locator('.hm-notes-group:has-text("General notes")')
      .count()) === 0,
  );
  check(
    "parcel note survives the general delete",
    (await page
      .locator('.hm-notes-group:has-text("155 Moore Cres") .hm-notes-note')
      .count()) === 1,
  );
  await page
    .locator(
      '.hm-notes-group:has-text("155 Moore Cres") .hm-notes-note button:has-text("Delete note")',
    )
    .click();
  check(
    "parcel note deleted",
    (await page.locator(".hm-notes-group").count()) === 0,
  );
  check(
    "empty state returns",
    await page.locator("[data-notes-empty]").isVisible(),
  );
  await page.goto(`${BASE}/map/#parcel=${TYPICAL}&view=work`);
  await page
    .locator(".parcel-workspace")
    .waitFor({ state: "visible", timeout: 30000 });
  check(
    "workspace Notes tab is empty too",
    (await page.locator(".parcel-ws-note").count()) === 0,
  );

  // 6. Phone viewport: /notes/ fits and the compose works.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE}/notes/`);
  await page.locator("[data-notes-page]").waitFor({ state: "visible" });
  const mobOverflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
  check(
    "no horizontal overflow on phone notes page",
    mobOverflow <= 0,
    `overflow=${mobOverflow}px`,
  );
  await page.locator("[data-notes-compose] textarea").fill("Phone note.");
  await page.locator("[data-notes-add]").click();
  await page
    .locator('.hm-notes-group:has-text("General notes")')
    .waitFor({ state: "visible" });
  check("general note can be added on phone", true);
  const mobAreaBox = await page
    .locator("[data-notes-compose] textarea")
    .boundingBox();
  const mobComposeBox = await page
    .locator("[data-notes-compose]")
    .boundingBox();
  check(
    "textarea is full width on phone",
    mobAreaBox.width >= mobComposeBox.width * 0.9,
    `textarea=${Math.round(mobAreaBox.width)} compose=${Math.round(mobComposeBox.width)}`,
  );
  const mobRadius = await page
    .locator(".hm-notes-note")
    .first()
    .evaluate((e) => getComputedStyle(e).borderTopLeftRadius);
  check(
    "notes render as cards on phone",
    parseFloat(mobRadius) > 0,
    `radius=${mobRadius}`,
  );
  await page.screenshot({ path: `${SHOTS}parcel-notes-page-mobile.png` });
} catch (e) {
  check("script completed without exception", false, String(e).split("\n")[0]);
} finally {
  check("no page errors", errors.length === 0, errors.slice(0, 3).join(" | "));
  await browser.close();
  server.close();
}

const failed = results.filter((r) => !r.ok);
console.log(
  `\n${results.length - failed.length}/${results.length} checks passed`,
);
process.exit(failed.length ? 1 : 0);
