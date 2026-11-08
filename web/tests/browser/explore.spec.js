import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
async function ready(page) {
  await page.goto("/");
  await expect(page.locator("#map-status")).toContainText(
    "Local synthetic PMTiles",
  );
  await page.waitForFunction(() => window.__heavymap.map.loaded());
}
async function camera(page) {
  return page.evaluate(() => ({
    center: window.__heavymap.map.getCenter().toArray(),
    zoom: window.__heavymap.map.getZoom(),
  }));
}
async function stopped(page) {
  await page.waitForFunction(() => !window.__heavymap.map.isMoving());
}
test("map, lenses, evidence export, layers, styles and deep link", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await ready(page);
  await expect(page.locator("#samples button")).toHaveCount(3);
  expect(
    await page.evaluate(
      () =>
        window.__heavymap.map.querySourceFeatures("parcels", {
          sourceLayer: "parcels",
        }).length,
    ),
  ).toBeGreaterThanOrEqual(3);
  await page.locator("[data-lens=outdoor]").click();
  await expect(page.locator("#samples button")).toHaveCount(1);
  await page.locator("#samples button").click();
  await expect(page.locator(".dossier-title")).toHaveText(
    "Room around the footprint",
  );
  await stopped(page);
  await expect(page.locator(".band")).toHaveCount(6);
  await expect(page.locator("#dossier-body")).toContainText("not_in_coverage");
  await page.locator(".evidence summary").first().click();
  await expect(page.locator(".evidence[open]")).toContainText("retrieved on");
  const downloadPromise = page.waitForEvent("download");
  await page.locator(".export").click();
  const download = await downloadPromise;
  const exported = JSON.parse(await readFile(await download.path(), "utf8"));
  expect(exported.synthetic).toBe(true);
  expect(Object.keys(exported.bands)).toHaveLength(6);
  expect(exported.bands.identity.refusals[0].object).toBe("Roll alias");
  await page.keyboard.press("Escape");
  await page.locator("[data-lens=all]").click();
  await page.locator(".layers summary").click();
  await page.locator("[data-layer=community]").check();
  expect(
    await page.evaluate(() =>
      window.__heavymap.map.getLayoutProperty("community", "visibility"),
    ),
  ).toBe("visible");
  await page.locator("[data-layer=nature]").uncheck();
  expect(
    await page.evaluate(() =>
      window.__heavymap.map.getLayoutProperty("nature", "visibility"),
    ),
  ).toBe("none");
  await page.locator("#palette").selectOption("wash");
  expect(
    await page.evaluate(() =>
      window.__heavymap.map.getPaintProperty("ground", "background-color"),
    ),
  ).toBe("#eef0e5");
  await page.locator("#search").fill("SYN-ROLL-003");
  await expect(page.locator("#samples button")).toHaveCount(1);
  await page.locator("#search").press("Enter");
  await expect(page.locator(".dossier-title")).toHaveText(
    "At the industrial edge",
  );
  await page.reload();
  await expect(page.locator(".dossier-title")).toHaveText(
    "At the industrial edge",
  );
  expect(errors).toEqual([]);
});
test("camera restores only when user did not move, including switching parcels", async ({
  page,
}) => {
  await ready(page);
  const before = await camera(page);
  await page.locator("#samples button").first().click();
  await stopped(page);
  await page.locator("#samples button").nth(1).click();
  await stopped(page);
  await page.locator("#close").click();
  await stopped(page);
  const restored = await camera(page);
  expect(restored.zoom).toBeCloseTo(before.zoom, 6);
  expect(restored.center[0]).toBeCloseTo(before.center[0], 6);
  await page.locator("#samples button").first().click();
  await stopped(page);
  await page.locator(".maplibregl-ctrl-zoom-in").click();
  await stopped(page);
  const moved = await camera(page);
  await page.locator("#close").click();
  await stopped(page);
  const after = await camera(page);
  expect(after.zoom).toBeCloseTo(moved.zoom, 6);
  expect(after.center[0]).toBeCloseTo(moved.center[0], 6);
});
test("user pan is retained on close and the parcel centres between panels", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await ready(page);
  await page.locator("#samples button").first().click();
  await stopped(page);
  const position = await page.evaluate(() => {
    const p = window.__heavymap.map.project([-79.91, 43.255]);
    const l = document.getElementById("tray").getBoundingClientRect().right,
      r = document.getElementById("dossier").getBoundingClientRect().left;
    return { x: p.x, l, r };
  });
  expect(position.x).toBeGreaterThan(position.l + 50);
  expect(position.x).toBeLessThan(position.r - 50);
  expect(Math.abs(position.x - (position.l + position.r) / 2)).toBeLessThan(30);
  await page.mouse.move(700, 350);
  await page.mouse.down();
  await page.mouse.move(760, 390, { steps: 8 });
  await page.mouse.up();
  await stopped(page);
  const moved = await camera(page);
  await page.locator("#close").click();
  await stopped(page);
  const after = await camera(page);
  expect(after.center[0]).toBeCloseTo(moved.center[0], 6);
  expect(after.center[1]).toBeCloseTo(moved.center[1], 6);
});

test("small-screen keyboard route, no horizontal overflow, invalid key, reduced motion", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await ready(page);
  await page.locator("#tray-toggle").click();
  await page.locator("#samples button").first().focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#dossier")).toBeVisible();
  await stopped(page);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(
    await page.locator("#close").evaluate((e) => e === document.activeElement),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(page.locator("#dossier")).toBeHidden();
  await page.goto("/#parcel=unknown");
  await expect(page.locator("#map-status")).toContainText("Unknown sample key");
  await expect(page.locator("#dossier")).toBeHidden();
});
test("range reads work and failed tiles do not become empty evidence", async ({
  page,
  request,
}) => {
  const r = await request.get("/synthetic-parcels.pmtiles", {
    headers: { Range: "bytes=0-126" },
  });
  expect(r.status()).toBe(206);
  expect(r.headers()["content-range"]).toMatch(/^bytes 0-126\//);
  expect((await r.body()).length).toBe(127);
  await page.route("**/synthetic-parcels.pmtiles", (r) =>
    r.fulfill({ status: 503, body: "Unavailable" }),
  );
  await page.goto("/");
  await expect(page.locator("#map-status")).toContainText("failed");
  await page.locator("#samples button").first().click();
  await expect(page.locator(".band")).toHaveCount(6);
});
