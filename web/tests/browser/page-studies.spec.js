import { test, expect } from "@playwright/test";
test("regional directory connects populated and unmigrated Desk pages without inventing editions", async ({
  page,
}) => {
  await page.goto("/alternate.html#/desks");
  await expect(
    page.getByRole("heading", { name: "Find your region." }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Open the Desk" }).first().click();
  await expect(page.locator("h1")).toHaveText("Western New York");
  await expect(page.locator(".archive-row")).toHaveCount(1);
  await page.getByRole("link", { name: "Read Issue One" }).click();
  await expect(page.locator(".edition-brief")).toHaveCount(9);
  await page.goto("/alternate.html#/desks/western-new-york");
  await page.locator(".region-switch summary").click();
  await page
    .locator(".region-switch")
    .getByRole("link", { name: "Niagara–Brant" })
    .click();
  await expect(page.locator("h1")).toHaveText("Niagara–Brant");
  await expect(page.locator(".desk-empty-archive")).toContainText(
    "No publication date or sample issue has been invented",
  );
  await expect(
    page.getByRole("button", { name: "Preview the map transition" }),
  ).toBeVisible();
  await expect(page.locator(".archive-row")).toHaveCount(0);
});
test("edition sections, individual briefs and Reader preserve context and return paths", async ({
  page,
}) => {
  await page.goto("/alternate.html#/editions/western-new-york/issue-one");
  await expect(page.locator(".edition-archive-label")).toContainText(
    "historical reporting",
  );
  await page
    .locator(".edition-contents")
    .getByRole("link", { name: "02 In development" })
    .click();
  await expect(page.locator("#study-developing")).toBeInViewport();
  await page
    .locator("#study-production .edition-brief")
    .first()
    .getByRole("link", { name: "Open the brief" })
    .click();
  await expect(page.locator("h1")).toContainText("Solstice");
  await expect(page.locator(".standalone-sources>a")).toHaveCount(2);
  await expect(page.locator(".publication-record")).toContainText(
    "adds no new reporting or correction",
  );
  await page.getByRole("link", { name: "Open in Reader", exact: true }).click();
  await expect(page.locator("#reader-article h2")).toContainText("Solstice");
  await page
    .locator("#reader-article")
    .getByRole("link", { name: "Read the edition" })
    .click();
  await expect(page.locator("h1")).toHaveText("Issue One.");
});
test("documentation and editorial studies show honest publication status and functional section links", async ({
  page,
}) => {
  await page.goto("/alternate.html#/read/hm-reading-the-evidence");
  await expect(page.locator(".reading-context-label")).toContainText(
    "Unpublished",
  );
  await page
    .getByRole("navigation", { name: "Article sections" })
    .getByRole("link", { name: "03 Source notes are part of the story." })
    .click();
  await expect(page.locator("#study-reading-section-3")).toBeInViewport();
  await page.goto("/alternate.html#/read/editorial-study");
  await expect(page.locator(".standalone-byline")).toContainText(
    "No publication date assigned",
  );
  await expect(page.locator("blockquote")).toContainText(
    "The source is part of the story",
  );
  await expect(page.locator(".publication-record")).toContainText(
    "No named author",
  );
  await page.getByRole("link", { name: "Back to the page studies" }).click();
  await expect(page.locator(".gallery-grid>a")).toHaveCount(6);
});
test("page link copy offers a working action and fallback", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async (text) => {
          if (window.rejectCopy) throw new Error("Clipboard unavailable");
          window.copiedLink = text;
        },
      },
    }),
  );
  await page.goto("/alternate.html#/read/IEVT-2026-000001");
  await page.getByRole("button", { name: "Copy page link" }).click();
  await expect(page.getByRole("status")).toHaveText("Page link copied.");
  expect(await page.evaluate(() => window.copiedLink)).toContain(
    "#/read/IEVT-2026-000001",
  );
});
test("all page studies fit desktop and mobile with meaningful headings and no page errors", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const width of [1440, 390, 360]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of [
      "/studies",
      "/desks",
      "/desks/western-new-york",
      "/desks/niagara-brant",
      "/editions/western-new-york/issue-one",
      "/read/IEVT-2026-000001",
      "/read/hm-reading-the-evidence",
      "/read/editorial-study",
    ]) {
      await page.goto(`/alternate.html#${path}`);
      await expect(page.locator("h1")).toHaveCount(1);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${width}px ${path}`,
      ).toBe(true);
    }
  }
  expect(errors).toEqual([]);
});
