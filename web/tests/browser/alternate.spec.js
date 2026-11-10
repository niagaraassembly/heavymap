import { test, expect } from "@playwright/test";
const key = "heavymap-reader-v1";
test("alternate keeps version A available and Reader defaults to Desk news only", async ({
  page,
}) => {
  await page.goto("/alternate.html");
  await expect(
    page.getByRole("heading", { name: "Places change. Keep a closer eye." }),
  ).toBeVisible();
  await expect(page.locator("#map-stage iframe")).toHaveCount(0);
  await page
    .getByRole("link", { name: "Open Reader", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("button", { name: "News", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".library-item")).toHaveCount(9);
  await expect(page.locator(".article-from")).toContainText("Western New York");
  await page
    .getByRole("button", { name: "Documentation", exact: true })
    .click();
  await expect(page.locator(".library-item")).toHaveCount(2);
  await expect(page.locator("#reader-article")).toContainText(
    "Design preview, not a published edition",
  );
  await page.getByRole("button", { name: "Editorials", exact: true }).click();
  await expect(page.locator(".reader-empty")).toContainText(
    "There is no matching material",
  );
  await page.getByRole("button", { name: "Back to news" }).click();
  await page
    .getByLabel("Region", { exact: true })
    .selectOption("niagara-brant");
  await expect(page.locator(".reader-empty")).toContainText(
    "No Niagara–Brant material has been migrated",
  );
  await page.getByRole("link", { name: "Visit the existing Desk" }).isVisible();
  await page.getByRole("link", { name: "Compare first design" }).click();
  await expect(page).toHaveTitle(/A closer reading of place/);
});
test("Reader remembers item, progress and filters; can forget only its own history", async ({
  page,
}) => {
  await page.goto("/alternate.html#/reader");
  await page.evaluate(() => localStorage.setItem("na-reader", "preserve-me"));
  await page
    .getByRole("button", { name: "Documentation", exact: true })
    .click();
  await expect(page.locator("#reader-article h2")).toHaveText(
    "Reading the evidence",
  );
  await page.locator("#reader-scroll").evaluate((el) => {
    el.scrollTop = el.scrollHeight;
    el.dispatchEvent(new Event("scroll"));
  });
  await expect
    .poll(() =>
      page.evaluate(
        (k) =>
          JSON.parse(localStorage.getItem(k)).progress[
            "hm-reading-the-evidence"
          ],
        key,
      ),
    )
    .toBeGreaterThan(0.5);
  await page.getByRole("button", { name: "Mark as read", exact: true }).click();
  await page.getByRole("link", { name: "Back to the edition" }).click();
  await expect(page.locator(".return-line")).toContainText(
    "You left off with Reading the evidence",
  );
  await page.reload();
  await page.getByRole("link", { name: "Continue reading" }).click();
  await expect(
    page.getByRole("button", { name: "Documentation", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#reader-article h2")).toHaveText(
    "Reading the evidence",
  );
  await expect(
    page.getByRole("button", { name: "Mark as unread", exact: true }),
  ).toBeVisible();
  await expect
    .poll(() => page.locator("#reader-scroll").evaluate((el) => el.scrollTop))
    .toBeGreaterThan(100);
  await page
    .getByRole("button", { name: "Forget reading history", exact: true })
    .click();
  await expect(page.locator(".return-line")).not.toContainText("You left off");
  expect(await page.evaluate((k) => localStorage.getItem(k), key)).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem("na-reader"))).toBe(
    "preserve-me",
  );
});
test("search and unread filtering work, malformed or unavailable storage does not break Reader", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("heavymap-reader-v1", "{broken"),
  );
  await page.goto("/alternate.html#/reader");
  await page.getByLabel("Search readable material").fill("Goodyear");
  await expect(page.locator(".library-item")).toHaveCount(1);
  await expect(page.locator("#reader-article h2")).toContainText("Goodyear");
  await page.getByRole("button", { name: "Mark as read", exact: true }).click();
  await page.getByLabel("Unread only").check();
  await expect(page.locator(".library-item")).toHaveCount(0);
  await page.getByRole("button", { name: "Back to news" }).click();
  await expect(page.locator(".library-item")).toHaveCount(9);
  const context = await page.context().browser().newContext();
  const blocked = await context.newPage();
  await blocked.addInitScript(() =>
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new Error("blocked");
      },
    }),
  );
  await blocked.goto("/alternate.html#/reader");
  await expect(blocked.locator(".reader-storage")).toContainText(
    "cannot remember your place",
  );
  await blocked.getByRole("button", { name: "Next item" }).click();
  await expect(blocked.locator("#reader-article h2")).toContainText(
    "Constellation",
  );
  await context.close();
});
test("map strip reveals the synthetic workspace, returns focus and preserves page position", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/alternate.html");
  const opener = page.locator(".map-peek");
  await opener.scrollIntoViewIfNeeded();
  const before = await page.evaluate(() => scrollY);
  await opener.click();
  await expect(page.locator("#site-veneer")).toHaveAttribute("inert", "");
  await expect(
    page.getByRole("link", { name: "Skip to content" }),
  ).toBeHidden();
  await expect(
    page.getByRole("button", { name: "Return to reading" }),
  ).toBeFocused();
  const frame = page.frameLocator(
    'iframe[title="Synthetic Hamilton map — interaction study"]',
  );
  await expect(frame.locator("#map-status")).toContainText(
    "Local synthetic PMTiles",
  );
  await page.getByRole("button", { name: "Return to reading" }).click();
  await expect(page.locator("#map-stage")).toBeHidden();
  await expect(opener).toBeFocused();
  expect(await page.evaluate(() => scrollY)).toBeCloseTo(before, 0);
  await opener.click();
  await page.keyboard.press("Escape");
  await expect(page.locator("#map-stage")).toBeHidden();
});
test("alternate and Reader fit mobile, use keyboard navigation, and expose no horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/alternate.html");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await expect(page.locator("#alt-content")).toBeFocused();
  await page.getByRole("link", { name: "Reader", exact: true }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Next item" }).click();
  await expect(page.locator("#reader-article h2")).toContainText(
    "Constellation",
  );
});
