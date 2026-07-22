import type { Page } from "@playwright/test";

/** Seeded map view used when no unconfigured datasets remain. */
export const SEEDED_MAP_CONFIG_PATH = "/config/bcmform_responses?view_type=map";

/**
 * Expands the Map collapsible section when it is present and collapsed.
 *
 * @param {Page} page - Playwright page.
 * @returns {Promise<void>}
 */
export async function expandMapSection(page: Page): Promise<void> {
  const mapSectionButton = page.locator(
    '[data-testid="config-section-map-toggle"]',
  );
  if ((await mapSectionButton.count()) === 0) return;

  const mapContent = page
    .locator('[data-testid="basemaps-container"]')
    .or(page.locator('input[id*="MAPBOX_3D"]'));

  const isVisible =
    (await mapContent.count()) > 0 && (await mapContent.first().isVisible());

  if (!isVisible) {
    await mapSectionButton.click();
    await page.waitForTimeout(300);
  }
}

/**
 * Opens a seeded map view edit page with Map section expanded.
 * Prefer this over adding a new dataset: the suite only has a couple of
 * unconfigured warehouse tables, and previous runs leave the DB dirty.
 *
 * @param {Page} page - Playwright page.
 * @returns {Promise<string>} Dataset name opened for editing.
 */
export async function openMapConfigEditPage(page: Page): Promise<string> {
  await page.goto(SEEDED_MAP_CONFIG_PATH);
  await page.waitForLoadState("networkidle");
  await page.waitForSelector("form", { timeout: 15000 });
  await expandMapSection(page);
  return "bcmform_responses";
}

/**
 * Ensures a map config form can be saved: Mapbox token present and a
 * visibility level selected. Newly added views start with empty config.
 *
 * @param {Page} page - Playwright page on a config edit form.
 * @returns {Promise<void>}
 */
export async function ensureMapFormCanSubmit(page: Page): Promise<void> {
  await expandMapSection(page);

  const tokenInput = page.locator('input[id*="MAPBOX_ACCESS_TOKEN"]');
  if ((await tokenInput.count()) > 0) {
    const tokenValue = await tokenInput.inputValue();
    if (!tokenValue?.trim()) {
      await tokenInput.fill("pk.ey_e2e_mapbox_access_token_value");
      await page.waitForTimeout(200);
    }
  }

  const checkedPermission = page.locator('input[type="radio"]:checked');
  if ((await checkedPermission.count()) === 0) {
    const memberRadio = page.locator('input[type="radio"][value="member"]');
    if ((await memberRadio.count()) > 0) {
      await memberRadio.check();
      await page.waitForTimeout(200);
    }
  }
}
