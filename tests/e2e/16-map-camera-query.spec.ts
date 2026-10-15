import { test, expect } from "@/tests/e2e/fixtures/auth-storage";
import { navigateToAlertsDashboard } from "./helpers/navigateToAlertsDashboard";
import { waitForTestMap } from "./helpers/testMap";
import { createApiTestView, deleteApiTestView } from "./helpers/apiTestData";

test("alerts navigation ignores temporary API test views", async ({
  authenticatedPageAsAdmin: page,
}) => {
  const temporaryView = await createApiTestView({
    sourceTable: "seed_survey_data",
    viewType: "alerts",
    viewConfig: { ROUTE_LEVEL_PERMISSION: "member" },
  });

  try {
    await navigateToAlertsDashboard(page);
    await expect(page).toHaveURL(/\/alerts\/fake_alerts(?:\?|$)/);
  } finally {
    await deleteApiTestView(temporaryView);
  }
});

test("alerts dashboard - camera query params restore the map view", async ({
  authenticatedPageAsAdmin: page,
}) => {
  await navigateToAlertsDashboard(page);

  const copyButton = page.getByTestId("copy-map-location-button");
  await expect(copyButton).toBeVisible();

  await page.evaluate(() => {
    const map = window.getTestMap();
    map.jumpTo({ center: [-60.02, -3.12], zoom: 11.5 });
  });

  await expect(page).toHaveURL(/[?&]lat=-3\.12/);
  await expect(page).toHaveURL(/[?&]lng=-60\.02/);
  await expect(page).toHaveURL(/[?&]zoom=11\.5/);

  const alertsPath = new URL(page.url()).pathname;
  await page.goto(`${alertsPath}?lat=-3.12000&lng=-60.02000&zoom=11.50`);
  await waitForTestMap(page);

  const camera = await page.evaluate(() => {
    const map = window.getTestMap();
    const center = map.getCenter();
    return { lat: center.lat, lng: center.lng, zoom: map.getZoom() };
  });

  expect(camera.lat).toBeCloseTo(-3.12, 3);
  expect(camera.lng).toBeCloseTo(-60.02, 3);
  expect(camera.zoom).toBeCloseTo(11.5, 1);
});

test("map page - copy location control is visible", async ({
  authenticatedPageAsAdmin: page,
}) => {
  await page.goto("/map/bcmform_responses");
  await page.locator("#map").waitFor({ state: "attached", timeout: 15000 });
  await expect(page.getByTestId("copy-map-location-button")).toBeVisible({
    timeout: 15000,
  });
});
