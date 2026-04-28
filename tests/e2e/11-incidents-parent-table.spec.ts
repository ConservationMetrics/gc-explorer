import { test, expect } from "@/tests/e2e/fixtures/auth-storage";
import type { Page } from "@playwright/test";

const selectionModifierKey = process.platform === "darwin" ? "Meta" : "Control";
type LngLat = [number, number];

/**
 * Navigates directly to an alerts table page and waits for map readiness.
 *
 * @param page - Playwright page.
 * @param tableName - Alerts table route slug.
 * @returns Promise resolved when map style is loaded.
 */
const navigateToAlertsTable = async (
  page: Page,
  tableName: string,
): Promise<void> => {
  await page.goto(`/alerts/${tableName}`);
  await page.waitForLoadState("networkidle");
  await page.locator("canvas.mapboxgl-canvas").waitFor();
  await page.waitForFunction(() => {
    // @ts-expect-error _testMap is exposed for E2E testing only
    const map = window._testMap;
    return map?.isStyleLoaded() && map.loaded();
  });
};

/**
 * Finds a selectable feature and returns its lng/lat (point coordinate or polygon centroid).
 *
 * @param page - Playwright page.
 * @returns LngLat position or null when no selectable features are currently rendered.
 */
const getSelectableFeatureLngLat = async (
  page: Page,
): Promise<LngLat | null> => {
  return await page.evaluate(() => {
    // @ts-expect-error _testMap is exposed for E2E testing only
    const map = window._testMap;
    if (!map) return null;

    const layers = [
      "most-recent-alerts-point",
      "previous-alerts-point",
      "most-recent-alerts-centroids",
      "previous-alerts-centroids",
      "most-recent-alerts-polygon",
      "previous-alerts-polygon",
    ].filter((layer) => map.getLayer(layer));
    if (!layers.length) return null;

    const features = map.queryRenderedFeatures({ layers });
    if (!features.length) return null;

    const feature = features[0];
    if (feature?.geometry?.type === "Point") {
      const [lng, lat] = feature.geometry.coordinates;
      if (Number.isFinite(lng) && Number.isFinite(lat)) return [lng, lat];
    }

    const centroid = feature?.properties?.geographicCentroid;
    if (typeof centroid === "string") {
      const [lng, lat] = centroid.split(",").map(Number);
      if (Number.isFinite(lng) && Number.isFinite(lat)) return [lng, lat];
    }

    return null;
  });
};

/**
 * Projects lng/lat to page coordinates.
 *
 * @param page - Playwright page.
 * @param lngLat - Coordinate tuple.
 * @returns Screen point for mouse click.
 */
const projectLngLatToPagePoint = async (
  page: Page,
  lngLat: LngLat,
): Promise<{ x: number; y: number } | null> => {
  return await page.evaluate(([lng, lat]) => {
    // @ts-expect-error _testMap is exposed for E2E testing only
    const map = window._testMap;
    if (!map) return null;
    const point = map.project([lng, lat]);
    const rect = map.getCanvas().getBoundingClientRect();
    return { x: rect.left + point.x, y: rect.top + point.y };
  }, lngLat);
};

const fetchIncidentNamesForTable = async (
  page: Page,
  tableName: string,
): Promise<string[]> => {
  const response = await page.request.get(
    `/api/incidents?parent_alerts_table=${encodeURIComponent(tableName)}&limit=200`,
    { failOnStatusCode: false },
  );
  expect(response.status()).toBe(200);
  const body = (await response.json()) as {
    incidents?: Array<{ name: string }>;
  };
  return (body.incidents || []).map((incident) => incident.name);
};

/**
 * Creates an incident by selecting one feature in current alerts view.
 *
 * @param page - Playwright page.
 * @param incidentName - Incident name to create.
 * @returns Promise resolved once submit finishes.
 */
const createIncidentFromCurrentTable = async (
  page: Page,
  incidentName: string,
): Promise<void> => {
  await page.getByTestId("incidents-multiselect-button").click();
  const lngLat = await getSelectableFeatureLngLat(page);
  if (!lngLat) {
    test.skip();
    return;
  }

  const point = await projectLngLatToPagePoint(page, lngLat);
  if (!point) {
    test.skip();
    return;
  }

  await page.keyboard.down(selectionModifierKey);
  await page.mouse.click(point.x, point.y);
  await page.keyboard.up(selectionModifierKey);

  await page.getByTestId("incidents-create-button").click();
  await page.getByLabel("Name").fill(incidentName);
  await page
    .getByLabel("Description", { exact: true })
    .fill("Incident scoping test");
  await page.getByLabel("Incident Type").selectOption("Deforestation");
  await page.locator(".submit-btn").click();

  // Wait until the create form has closed after submit.
  await expect(page.locator(".incidents-sidebar .submit-btn")).toHaveCount(0, {
    timeout: 10000,
  });

  // Ensure no stale selection remains before continuing.
  const deselectButton = page.getByTestId("incidents-deselect-button");
  if (await deselectButton.isEnabled()) {
    await deselectButton.click({ force: true });
  }

  // Reset local sidebar mode state before next navigation/assertions.
  const sidebarCloseButton = page.locator(".incidents-sidebar .close-btn");
  if (await sidebarCloseButton.isVisible()) {
    await sidebarCloseButton.click({ force: true });
  }
};

test("incidents list is scoped by parent alerts table", async ({
  authenticatedPageAsAdmin: page,
}) => {
  const suffix = Date.now();
  const fakeIncident = `Scoped fake ${suffix}`;
  const gfwIncident = `Scoped gfw ${suffix}`;

  await navigateToAlertsTable(page, "fake_alerts");
  await createIncidentFromCurrentTable(page, fakeIncident);

  await navigateToAlertsTable(page, "gfw_alerts_viirs");
  await createIncidentFromCurrentTable(page, gfwIncident);

  const gfwIncidents = await fetchIncidentNamesForTable(
    page,
    "gfw_alerts_viirs",
  );
  expect(gfwIncidents).toContain(gfwIncident);
  expect(gfwIncidents).not.toContain(fakeIncident);

  const fakeIncidents = await fetchIncidentNamesForTable(page, "fake_alerts");
  expect(fakeIncidents).toContain(fakeIncident);
  expect(fakeIncidents).not.toContain(gfwIncident);
});
