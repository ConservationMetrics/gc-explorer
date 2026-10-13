import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

import { waitForTestMap } from "./testMap";

/**
 * Navigates from the index page to the seeded alerts map view.
 *
 * @param page - Authenticated Playwright page.
 * @returns Promise that resolves when the map is ready and the test map hook is available.
 */
export const navigateToAlertsDashboard = async (page: Page): Promise<void> => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  await expect(
    page.getByRole("heading", {
      name: /available views|available dataset views/i,
    }),
  ).toBeVisible();

  // Parallel API tests create and delete other alerts views while this page is open.
  await page
    .locator(
      "[data-testid='open-dataset-view-link'][href='/alerts/fake_alerts']",
    )
    .click();
  await page.waitForURL(/\/alerts\/fake_alerts(?:\?|$)/, { timeout: 15000 });

  await page.locator("canvas.mapboxgl-canvas").waitFor();
  await page.locator("#map[data-map-ready='true']").waitFor();
  await waitForTestMap(page);
};
