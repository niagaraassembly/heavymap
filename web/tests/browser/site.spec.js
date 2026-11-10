import { test, expect } from "@playwright/test";

test("home, both Desks, archive and source disclosures form a working reading path", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page).toHaveTitle(/A closer reading of place/);
  await expect(
    page.getByRole("heading", { name: "A closer reading of place." }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Find your Desk" }).click();
  await expect(page.locator(".desk-card")).toHaveCount(2);
  await page
    .getByRole("heading", { name: "Western New York", exact: true })
    .getByRole("link")
    .click();
  await page.getByRole("link", { name: "Open the issue" }).click();
  await expect(page.locator(".issue-story")).toHaveCount(9);
  await expect(page.locator(".archive-note")).toContainText("10 October 2026");
  const solstice = page
    .locator(".issue-story")
    .filter({ hasText: "Solstice to invest $49M" });
  await solstice.locator("summary").click();
  await expect(
    solstice.getByRole("link", { name: /Governor Hochul Announces/ }),
  ).toBeVisible();
  await page.getByRole("link", { name: "02 In development" }).click();
  await expect(page.locator("#section-developing")).toBeInViewport();
  await page.goto("/#/desks/niagara-brant");
  await expect(
    page.getByRole("heading", { name: "Niagara–Brant", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Visit the existing Desk" }),
  ).toHaveAttribute(
    "href",
    "https://niagaraassembly.com/desks/ca/on/niagara-brant/",
  );
  expect(errors).toEqual([]);
});

test("mapping has no unpublished app link and unknown routes have a recovery action", async ({
  page,
}) => {
  await page.goto("/#/mapping");
  await expect(page.locator(".mapping-availability")).toContainText(
    "Preparing for launch",
  );
  await expect(page.locator('a[href*="map.html"]')).toHaveCount(0);
  await expect(page.locator('a[href="#"]')).toHaveCount(0);
  await page.goto("/#/not-a-page");
  await page.getByRole("link", { name: "Back to HeavyMap" }).click();
  await expect(page).toHaveTitle(/A closer reading of place/);
});

test("subscription preview selects independent Desks without network writes or saved email", async ({
  page,
}) => {
  const writes = [];
  page.on("request", (r) => {
    if (!["GET", "HEAD"].includes(r.method())) writes.push(r.url());
  });
  await page.goto("/#/subscribe?desk=western-new-york");
  await expect(
    page.getByRole("checkbox", { name: /Western New York/ }),
  ).toBeChecked();
  await expect(
    page.getByRole("checkbox", { name: /Niagara–Brant/ }),
  ).not.toBeChecked();
  await page.getByRole("checkbox", { name: /Niagara–Brant/ }).check();
  await page.getByLabel("Your email address").fill("preview@example.test");
  await page.getByRole("button", { name: "Preview my selection" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Western New York and Niagara–Brant",
  );
  await expect(page.getByRole("status")).toContainText(
    "Nothing has been sent or saved",
  );
  await page.reload();
  await expect(page.getByLabel("Your email address")).toHaveValue("");
  expect(
    await page.evaluate(() => [localStorage.length, sessionStorage.length]),
  ).toEqual([0, 0]);
  expect(writes).toEqual([]);
  await page.goto("/#/preferences");
  await page.getByLabel("Your email address").fill("preview@example.test");
  await page
    .getByRole("button", { name: "Preview secure-link request" })
    .click();
  await expect(page.getByRole("status")).toContainText("No email was sent");
});

test("all editorial routes fit mobile and navigation stays keyboard accessible", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const path of [
    "",
    "/desks",
    "/desks/western-new-york",
    "/desks/niagara-brant",
    "/desks/western-new-york/issue-one",
    "/mapping",
    "/subscribe",
    "/preferences",
    "/about",
    "/credits",
  ]) {
    await page.goto(`/#${path}`);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `overflow at ${path}`,
    ).toBe(true);
    await expect(page.locator("h1")).toBeVisible();
  }
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to content" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#content")).toBeFocused();
  await expect(page).toHaveTitle(/A closer reading of place/);
});
