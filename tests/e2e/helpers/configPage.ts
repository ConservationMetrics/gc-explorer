import type { Page } from "@playwright/test";

/** Seeded map view used when no unconfigured datasets remain. */
export const SEEDED_MAP_CONFIG_PATH = "/config/bcmform_responses?view_type=map";

/** Seeded gallery view used for copy-config and gallery edit tests. */
export const SEEDED_GALLERY_CONFIG_PATH =
  "/config/bcmform_responses?view_type=gallery";

/**
 * Waits for the config edit form instead of network idle.
 * Mapbox telemetry from a test token never quiets the network.
 *
 * @param {Page} page - Playwright page.
 * @returns {Promise<void>}
 */
export const waitForConfigForm = async (page: Page): Promise<void> => {
  await page.waitForSelector("form", { timeout: 15000 });
};

/**
 * Answers Mapbox telemetry so an expanded preview cannot stall later waits.
 *
 * @param {Page} page - Playwright page.
 * @returns {Promise<void>}
 */
export const stubMapboxTelemetry = async (page: Page): Promise<void> => {
  await page.route("https://events.mapbox.com/**", (route) =>
    route.fulfill({ status: 204, body: "" }),
  );
};

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
    await mapContent.first().waitFor({ state: "visible", timeout: 5000 });
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
  await stubMapboxTelemetry(page);
  await page.goto(SEEDED_MAP_CONFIG_PATH);
  await waitForConfigForm(page);
  await expandMapSection(page);
  return "bcmform_responses";
}

/**
 * Opens a seeded gallery view edit page.
 *
 * @param {Page} page - Playwright page.
 * @returns {Promise<string>} Dataset name opened for editing.
 */
export async function openGalleryConfigEditPage(page: Page): Promise<string> {
  await page.goto(SEEDED_GALLERY_CONFIG_PATH);
  await waitForConfigForm(page);
  return "bcmform_responses";
}

/**
 * Ensures a map config form can be saved: required map fields present and a
 * visibility level selected. Newly added views start with empty config.
 *
 * @param {Page} page - Playwright page on a config edit form.
 * @returns {Promise<void>}
 */
export async function ensureMapFormCanSubmit(page: Page): Promise<void> {
  await expandMapSection(page);

  const fillIfEmpty = async (
    locator: ReturnType<Page["locator"]>,
    value: string,
  ) => {
    if ((await locator.count()) === 0) return;
    const current = await locator.inputValue();
    if (!current?.trim()) {
      await locator.fill(value);
      await page.waitForTimeout(200);
    }
  };

  const tokenInputs = page.locator('input[id*="basemap-access-token"]');
  const tokenCount = await tokenInputs.count();
  for (let index = 0; index < tokenCount; index += 1) {
    const tokenInput = tokenInputs.nth(index);
    if ((await tokenInput.count()) === 0) continue;
    const current = await tokenInput.inputValue();
    if (!/^pk\.ey\S+$/.test(current.trim())) {
      await tokenInput.fill("pk.ey_e2e_mapbox_access_token_value");
      await page.waitForTimeout(200);
    }
  }
  await fillIfEmpty(page.locator('input[id*="MAPBOX_ZOOM"]'), "10");
  await fillIfEmpty(page.locator('input[id*="MAPBOX_CENTER_LATITUDE"]'), "0");
  await fillIfEmpty(page.locator('input[id*="MAPBOX_CENTER_LONGITUDE"]'), "0");

  const projectionSelect = page.locator('select[id*="MAPBOX_PROJECTION"]');
  if ((await projectionSelect.count()) > 0) {
    const projectionValue = await projectionSelect.inputValue();
    if (!projectionValue?.trim()) {
      await projectionSelect.selectOption("mercator");
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
