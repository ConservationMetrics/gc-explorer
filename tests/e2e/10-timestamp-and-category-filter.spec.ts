import { test, expect } from "@/tests/e2e/fixtures/warehouse-views";

test("map page - filter container and optional timestamp filter", async ({
  authenticatedPageAsAdmin: page,
  mapView,
}) => {
  await page.goto(`/map/${mapView.primaryDataset}`);
  await page.waitForLoadState("networkidle");

  // MapView is ClientOnly and mounts after /api/.../map resolves
  await page.locator("#map").waitFor({ state: "attached", timeout: 15000 });
  await expect(page.locator("#map")).toBeVisible({ timeout: 10000 });

  const timestampFilter = page.getByTestId("timestamp-filter");
  const timestampVisible = await timestampFilter.isVisible().catch(() => false);

  if (timestampVisible) {
    await expect(page.getByTestId("reset-date-button")).toBeVisible();
    await expect(page.getByTestId("date-slider")).toBeVisible();
    await page.getByTestId("reset-date-button").click();
    await expect(page.getByTestId("date-slider")).toBeVisible();
  }
});

test("map page - admin gear opens config in a new tab", async ({
  authenticatedPageAsAdmin: page,
  mapView,
}) => {
  await page.goto(`/map/${mapView.primaryDataset}`);
  await page.waitForLoadState("networkidle");
  await page.locator("#map").waitFor({ state: "attached", timeout: 15000 });

  const gear = page.getByTestId("admin-config-gear");
  await expect(gear).toBeVisible({ timeout: 15000 });
  await expect(gear).toHaveAttribute("target", "_blank");
  const href = await gear.getAttribute("href");
  expect(href).toContain(`/config/${mapView.primaryDataset}?view_type=map`);
});

test("gallery page - filter container and optional timestamp filter", async ({
  authenticatedPageAsAdmin: page,
  galleryView,
}) => {
  await page.goto(`/gallery/${galleryView.primaryDataset}`);
  await page.waitForLoadState("networkidle");

  await page
    .getByTestId("gallery-container")
    .waitFor({ state: "attached", timeout: 15000 });

  await page
    .getByTestId("filter-container")
    .waitFor({ state: "attached", timeout: 10000 });

  const filterToggle = page.getByTestId("filter-toggle");
  await expect(filterToggle).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByTestId("filter-container")).toBeHidden();
  await expect(page.getByTestId("filter-toolbar")).not.toHaveClass(/sticky/);

  await filterToggle.click();
  await expect(filterToggle).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByTestId("filter-container")).toBeVisible();
  await expect(page.getByTestId("clear-all-filters")).toBeVisible();

  const timestampFilter = page.getByTestId("timestamp-filter");
  const timestampVisible = await timestampFilter.isVisible().catch(() => false);

  if (timestampVisible) {
    await expect(page.getByTestId("reset-date-button")).toBeVisible();
    await expect(page.getByTestId("date-slider")).toBeVisible();
    await page.getByTestId("clear-all-filters").click();
    await expect(page.getByTestId("date-slider")).toBeVisible();
  }

  await expect(page.getByTestId("gallery-container")).toBeVisible();
});
