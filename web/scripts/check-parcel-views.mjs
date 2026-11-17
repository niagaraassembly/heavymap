/* Browser check for BL-117 parcel card + drawer against the built site.
 * Serves web/dist-site (already built with --launch) and drives it with
 * Playwright. Usage: node check-parcel-views.mjs
 * Screenshots land in ~/workspace/heavymap-review/. */
import { chromium } from "@playwright/test";

const BASE = "http://127.0.0.1:4173";
const SHOTS = "/home/hatch/workspace/heavymap-review/";
const TYPICAL = "ia:ca:on:hamilton:parcel:01M54B6GD9XTMCH94PJVGFN000";
const MANY = "ia:ca:on:hamilton:parcel:01M54B6K2D08KQ3CNTH8S56PWR";
const NOADDR = "ia:ca:on:hamilton:parcel:01M54B6G7SMYHNYPP6EQDEXS00";

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
  // The load handler ends with "selectable from zoom 14"; reportZoom's
  // "Zoom in…" line only reappears after a zoom change.
  await page.waitForFunction(
    () => document.getElementById("map-status")?.textContent.includes("selectable from zoom 14"),
    { timeout: 30000 },
  );
}
async function activeId() {
  return page.evaluate(() => document.activeElement?.id || document.activeElement?.className || "(none)");
}

try {
  // 1. Map loads with parcel tiles ready.
  await mapReady();
  check("map loads, parcel tiles ready", true, await page.locator("#map-status").textContent());

  // 2. Deep link opens the drawer on the typical parcel.
  await page.goto(`${BASE}/map/#parcel=${TYPICAL}`);
  await page.locator(".parcel-drawer").waitFor({ state: "visible", timeout: 30000 });
  const title = await page.locator(".parcel-drawer .parcel-title").textContent();
  check("deep link opens drawer", title === "155 Moore Cres", `title=${title}`);
  const tiles = await page.locator(".parcel-drawer .parcel-tile").count();
  check("drawer has five tiles", tiles === 5, `tiles=${tiles}`);
  const verified = await page.locator(".parcel-verified").textContent();
  check("verified line names the release", verified.includes("2026-11-16-d070"), verified);
  const drawerScroll = await page.locator(".parcel-drawer").evaluate((e) => ({
    scroll: e.scrollHeight - e.clientHeight,
    h: e.clientHeight,
  }));
  check("typical parcel needs no scrolling in drawer", drawerScroll.scroll <= 1, `h=${drawerScroll.h} overflow=${drawerScroll.scroll}`);
  const saveDisabled = await page.locator('.parcel-drawer .parcel-btn:has-text("Save")').isDisabled();
  const exportDisabled = await page.locator('.parcel-drawer .parcel-btn:has-text("Export")').isDisabled();
  const noteEnabled = await page.locator('.parcel-drawer .parcel-btn:has-text("Note")').isEnabled();
  const workspaceEnabled = await page.locator('.parcel-drawer .parcel-btn-pri:has-text("Open workspace")').isEnabled();
  const coming = await page.locator(".parcel-drawer .parcel-coming").count();
  check("Save/Export disabled with coming; Note/Open workspace enabled (BL-118)", saveDisabled && exportDisabled && noteEnabled && workspaceEnabled && coming === 2, `coming tags=${coming}`);
  const copyEnabled = await page.locator('.parcel-drawer .parcel-btn:has-text("Copy link")').isEnabled();
  check("Copy link enabled", copyEnabled);
  await page.screenshot({ path: `${SHOTS}parcel-drawer-desktop.png` });

  // 3. Attention row opens its list in place.
  await page.locator('.parcel-drawer .parcel-mini:has-text("Known gaps")').click();
  await page.locator(".parcel-detail").waitFor({ state: "visible" });
  const detailText = await page.locator(".parcel-detail-list").textContent();
  check("Known gaps list opens in place", detailText.includes("GAP-0001") && detailText.includes("GAP-0002"), detailText.trim());

  // 4. Escape steps back to the card; focus lands on Open record.
  await page.keyboard.press("Escape");
  await page.locator(".parcel-card").waitFor({ state: "visible" });
  await page.locator(".parcel-drawer").waitFor({ state: "hidden" });
  check("Escape drawer -> card", true, `focus=${await activeId()}`);
  const cardTitle = await page.locator(".parcel-card .parcel-title").textContent();
  const cardFacts = await page.locator(".parcel-card .parcel-fact b").allTextContents();
  check("card shows the parcel facts", cardTitle === "155 Moore Cres" && cardFacts.join("|").includes("R4-394"), `facts=${cardFacts.join(" | ")}`);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check("no horizontal overflow on desktop", overflow <= 0, `overflow=${overflow}px`);
  await page.screenshot({ path: `${SHOTS}parcel-card-desktop.png` });

  // 5. Escape again closes; focus returns to the search box.
  await page.keyboard.press("Escape");
  await page.locator(".parcel-card").waitFor({ state: "hidden" });
  check("Escape card -> closed, focus back to search", (await activeId()) === "hm-map-search", `focus=${await activeId()}`);

  // 6. Search by key opens the drawer; 947 addresses list.
  await page.locator("#hm-map-search").fill(MANY);
  await page.locator("#hm-map-search").press("Enter");
  await page.locator(".parcel-drawer").waitFor({ state: "visible", timeout: 30000 });
  const manyTitle = await page.locator(".parcel-drawer .parcel-title").textContent();
  check("search opens drawer for 947-address parcel", manyTitle.length > 0, `title=${manyTitle}`);
  await page.locator('.parcel-drawer .parcel-mini:has-text("947")').click();
  const addrCount = await page.locator(".parcel-detail-list li").count();
  check("address list shows all 947", addrCount === 947, `rows=${addrCount}`);
  await page.screenshot({ path: `${SHOTS}parcel-drawer-many-addresses.png` });

  // 7. Parcel with no address falls back to Parcel + short key.
  await page.goto(`${BASE}/map/#parcel=${NOADDR}`);
  await page.locator(".parcel-drawer").waitFor({ state: "visible", timeout: 30000 });
  const noAddrTitle = await page.locator(".parcel-drawer .parcel-title").textContent();
  check("no-address title falls back", noAddrTitle === "Parcel QDEXS00", `title=${noAddrTitle}`);

  // 8. A real map click opens the card.
  await page.goto(`${BASE}/map/`);
  await page.waitForFunction(
    () => document.getElementById("map-status")?.textContent.includes("selectable from zoom 14"),
    { timeout: 30000 },
  );
  await page.locator(".maplibregl-ctrl-zoom-in").click();
  await page.locator(".maplibregl-ctrl-zoom-in").click();
  // The zoom ease can be slow under software WebGL; re-click while the
  // status still says to zoom in.
  let zoomed = false;
  for (let i = 0; i < 6; i++) {
    try {
      await page.waitForFunction(
        () => document.getElementById("map-status")?.textContent.includes("Select a parcel outline"),
        { timeout: 5000 },
      );
      zoomed = true;
      break;
    } catch {
      await page.locator(".maplibregl-ctrl-zoom-in").click();
    }
  }
  const zoomStatus = await page.locator("#map-status").textContent();
  check("map zoomed to parcel level", zoomed, `status=${zoomStatus}`);
  const box = await page.locator("#map").boundingBox();
  let clicked = false;
  for (const [dx, dy] of [[0.5, 0.5], [0.45, 0.45], [0.55, 0.55], [0.4, 0.6], [0.6, 0.4]]) {
    await page.mouse.click(box.x + box.width * dx, box.y + box.height * dy);
    try {
      await page.locator(".parcel-card").waitFor({ state: "visible", timeout: 5000 });
      clicked = true;
      break;
    } catch {
      // try the next point
    }
  }
  check("map click opens the card", clicked);
  if (clicked) {
    const clickTitle = await page.locator(".parcel-card .parcel-title").textContent();
    check("clicked card has a real title", clickTitle.length > 0, `title=${clickTitle}`);
    await page.screenshot({ path: `${SHOTS}parcel-card-click.png` });
  }

  // 9. Phone viewport: drawer as a bottom sheet, card as a block.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE}/map/#parcel=${TYPICAL}`);
  await page.locator(".parcel-drawer").waitFor({ state: "visible", timeout: 30000 });
  const mobOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check("no horizontal overflow on phone drawer", mobOverflow <= 0, `overflow=${mobOverflow}px`);
  await page.screenshot({ path: `${SHOTS}parcel-drawer-mobile.png` });
  await page.keyboard.press("Escape");
  await page.locator(".parcel-card").waitFor({ state: "visible" });
  const planHidden = await page.locator(".parcel-card .parcel-fact-plan").isHidden();
  check("phone card shows four facts (plan hidden)", planHidden);
  await page.screenshot({ path: `${SHOTS}parcel-card-mobile.png` });
} catch (e) {
  check("script completed without exception", false, String(e).split("\n")[0]);
} finally {
  check("no page errors", errors.length === 0, errors.slice(0, 3).join(" | "));
  await browser.close();
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
