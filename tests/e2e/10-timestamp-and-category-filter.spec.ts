import { test, expect } from "@/tests/e2e/fixtures/auth-storage";

test("map page - filter container and optional timestamp filter", async ({
  authenticatedPageAsAdmin: page,
}) => {
  // Seeded map view — skip brittle index → dataset → view-card hops
  await page.goto("/map/bcmform_responses");
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

test("gallery page - filter container and optional timestamp filter", async ({
  authenticatedPageAsAdmin: page,
}) => {
  // Seeded gallery view — skip brittle index → dataset → view-card hops
  await page.goto("/gallery/bcmform_responses");
  await page.waitForLoadState("networkidle");

  await page
    .getByTestId("gallery-container")
    .waitFor({ state: "attached", timeout: 15000 });

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
