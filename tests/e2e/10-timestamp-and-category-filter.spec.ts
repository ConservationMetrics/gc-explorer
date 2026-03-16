import { test, expect } from "@/tests/e2e/fixtures/auth-storage";

test("map page - filter container and optional timestamp filter", async ({
  authenticatedPageAsAdmin: page,
}) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  await page.waitForSelector("[data-testid='dataset-card']", {
    timeout: 15000,
  });

  const datasetCards = page.locator("[data-testid='dataset-card']");
  let mapCard = null;
  for (let i = 0; i < (await datasetCards.count()); i++) {
    const card = datasetCards.nth(i);
    const mapTag = card.locator("[data-testid='view-tag-map']");
    if ((await mapTag.count()) > 0) {
      mapCard = card;
      break;
    }
  }

  if (!mapCard) {
    test.skip();
    return;
  }

  await mapCard.locator("[data-testid='open-dataset-view-link']").click();
  await page.waitForLoadState("networkidle");

  const mapLink = page.locator('a[href^="/map/"]').first();
  await mapLink.waitFor({ state: "visible", timeout: 10000 });
  await mapLink.click();
  await page.waitForURL("**/map/**", { timeout: 5000 });
  await page.waitForLoadState("networkidle");

  const timestampFilter = page.getByTestId("timestamp-filter");
  const timestampVisible = await timestampFilter.isVisible().catch(() => false);

  if (timestampVisible) {
    await expect(page.getByTestId("reset-date-button")).toBeVisible();
    await expect(page.getByTestId("date-slider")).toBeVisible();
    await page.getByTestId("reset-date-button").click();
    await expect(page.getByTestId("date-slider")).toBeVisible();
  }

  await expect(page.locator("#map")).toBeVisible();
});

test("gallery page - filter container and optional timestamp filter", async ({
  authenticatedPageAsAdmin: page,
}) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  await page.waitForSelector("[data-testid='dataset-card']", {
    timeout: 15000,
  });

  const datasetCards = page.locator("[data-testid='dataset-card']");
  let galleryCard = null;
  for (let i = 0; i < (await datasetCards.count()); i++) {
    const card = datasetCards.nth(i);
    const galleryTag = card.locator("[data-testid='view-tag-gallery']");
    if ((await galleryTag.count()) > 0) {
      galleryCard = card;
      break;
    }
  }

  if (!galleryCard) {
    test.skip();
    return;
  }

  await galleryCard.locator("[data-testid='open-dataset-view-link']").click();
  await page.waitForLoadState("networkidle");

  const galleryLink = page.locator('a[href^="/gallery/"]').first();
  await galleryLink.waitFor({ state: "visible", timeout: 10000 });
  await galleryLink.click();
  await page.waitForURL("**/gallery/**", { timeout: 5000 });
  await page.waitForLoadState("networkidle");

  await page
    .getByTestId("filter-container")
    .waitFor({ state: "attached", timeout: 10000 });

  const timestampFilter = page.getByTestId("timestamp-filter");
  const timestampVisible = await timestampFilter.isVisible().catch(() => false);

  if (timestampVisible) {
    await expect(page.getByTestId("reset-date-button")).toBeVisible();
    await expect(page.getByTestId("date-slider")).toBeVisible();
    await page.getByTestId("reset-date-button").click();
    await expect(page.getByTestId("date-slider")).toBeVisible();
  }

  await expect(page.getByTestId("gallery-container")).toBeVisible();
});
