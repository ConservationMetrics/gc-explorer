import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Navigates from the index page to a loaded alerts map view (first dataset with an alerts tag).
 *
 * @param page - Authenticated Playwright page.
 * @returns Promise that resolves when the map style is loaded.
 */
export const navigateToAlertsDashboard = async (page: Page): Promise<void> => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  await expect(
    page.getByRole("heading", {
      name: /available views|available dataset views/i,
    }),
  ).toBeVisible();

  const cards = page.locator("[data-testid='dataset-card']");
  const count = await cards.count();
  expect(count).toBeGreaterThan(0);

  let alertsCard = null;
  for (let i = 0; i < count; i++) {
    const card = cards.nth(i);
    if ((await card.locator("[data-testid='view-tag-alerts']").count()) > 0) {
      alertsCard = card;
      break;
    }
  }

  expect(alertsCard).not.toBeNull();

  await alertsCard!.locator("[data-testid='open-dataset-view-link']").click();

  await page.waitForLoadState("networkidle");

  const alertsLink = page.locator('a[href^="/alerts/"]').first();
  const href = await alertsLink.getAttribute("href");
  await page.goto(href!);

  await page.locator("canvas.mapboxgl-canvas").waitFor();

  await page.waitForFunction(() => {
    // @ts-expect-error _testMap is exposed for E2E testing only
    const map = window._testMap;
    return map?.isStyleLoaded() && map.loaded();
  });
};
