import { test, expect } from "./fixtures/auth-storage";
import type { Page } from "@playwright/test";

const selectionModifierKey = process.platform === "darwin" ? "Meta" : "Control";

type LngLat = [number, number];

async function getSelectableFeatureLngLat(page: Page): Promise<LngLat | null> {
  // Explicitly target polygons only.
  return await page.evaluate(() => {
    // @ts-expect-error _testMap is exposed for E2E testing only
    const map = window._testMap;
    if (!map) return null;

    const layers = [
      "most-recent-alerts-polygon",
      "previous-alerts-polygon",
    ].filter((layer) => map.getLayer(layer));

    if (layers.length === 0) return null;

    const features = map.queryRenderedFeatures({ layers });
    if (features.length === 0) return null;

    const feature = features[0];

    // Preferred: precomputed centroid stored on properties.
    const centroid = feature?.properties?.geographicCentroid;
    if (typeof centroid === "string") {
      const [lng, lat] = centroid.split(",").map(Number);
      if (Number.isFinite(lng) && Number.isFinite(lat)) return [lng, lat];
    }

    // Fallback: compute centroid from polygon ring coordinates.
    if (feature?.geometry?.type === "Polygon") {
      const ring = feature.geometry.coordinates?.[0];
      if (Array.isArray(ring) && ring.length > 0) {
        const sum = ring.reduce(
          (acc: { lng: number; lat: number }, coord: [number, number]) => {
            return { lng: acc.lng + coord[0], lat: acc.lat + coord[1] };
          },
          { lng: 0, lat: 0 },
        );
        return [sum.lng / ring.length, sum.lat / ring.length];
      }
    }

    return null;
  });
}

async function getSelectableFeatureLngLats(
  page: Page,
  count: number,
): Promise<LngLat[]> {
  // Explicitly target polygons only.
  return await page.evaluate((count: number) => {
    // @ts-expect-error _testMap is exposed for E2E testing only
    const map = window._testMap;
    if (!map) return [];

    const layers = [
      "most-recent-alerts-polygon",
      "previous-alerts-polygon",
    ].filter((layer) => map.getLayer(layer));

    if (layers.length === 0) return [];

    const features = map.queryRenderedFeatures({ layers });
    const lngLats: Array<[number, number]> = [];

    for (const feature of features) {
      if (lngLats.length >= count) break;

      const centroid = feature?.properties?.geographicCentroid;
      if (typeof centroid === "string") {
        const [lng, lat] = centroid.split(",").map(Number);
        if (Number.isFinite(lng) && Number.isFinite(lat)) {
          lngLats.push([lng, lat]);
          continue;
        }
      }

      if (feature?.geometry?.type === "Polygon") {
        const ring = feature.geometry.coordinates?.[0];
        if (Array.isArray(ring) && ring.length > 0) {
          const sum = ring.reduce(
            (acc: { lng: number; lat: number }, coord: [number, number]) => {
              return { lng: acc.lng + coord[0], lat: acc.lat + coord[1] };
            },
            { lng: 0, lat: 0 },
          );
          lngLats.push([sum.lng / ring.length, sum.lat / ring.length]);
        }
      }
    }

    return lngLats;
  }, count);
}

async function projectLngLatToPagePoint(
  page: Page,
  lngLat: LngLat,
): Promise<{ x: number; y: number } | null> {
  return await page.evaluate(([lng, lat]) => {
    // @ts-expect-error _testMap is exposed for E2E testing only
    const map = window._testMap;
    if (!map) return null;

    const point = map.project([lng, lat]);
    const rect = map.getCanvas().getBoundingClientRect();
    return { x: rect.left + point.x, y: rect.top + point.y };
  }, lngLat);
}

/**
 * Helper function to navigate to alerts dashboard
 * Reusable across tests
 */
async function navigateToAlertsDashboard(page: Page) {
  // 1. Navigate to the index page first to get available tables
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // 2. Wait for the main content and heading to be visible
  await page.waitForSelector("main", { timeout: 15000 });
  await expect(
    page.getByRole("heading", {
      name: /available views|available dataset views/i,
    }),
  ).toBeVisible({ timeout: 15000 });

  // 3. Wait for dataset cards to render
  await page.waitForSelector(".grid", { timeout: 15000 });
  await page.waitForSelector("[data-testid='dataset-card']", {
    timeout: 15000,
  });

  // 4. Find a dataset card that has an "alerts" tag
  const datasetCards = page.locator("[data-testid='dataset-card']");
  const cardCount = await datasetCards.count();
  expect(cardCount).toBeGreaterThan(0);

  let alertsCard = null;
  for (let i = 0; i < cardCount; i++) {
    const card = datasetCards.nth(i);
    const alertsTag = card.locator("[data-testid='view-tag-alerts']");
    if ((await alertsTag.count()) > 0) {
      alertsCard = card;
      break;
    }
  }

  expect(alertsCard).not.toBeNull();

  // 5. Click "Open Dataset View" on the card with alerts tag
  const openProjectButton = alertsCard!.locator(
    "[data-testid='open-dataset-view-link']",
  );
  await openProjectButton.waitFor({ state: "visible", timeout: 15000 });
  await openProjectButton.click();
  await page.waitForLoadState("networkidle");

  // 6. Find the alerts link on the dataset page
  const alertsLink = page.locator('a[href^="/alerts/"]').first();
  await alertsLink.waitFor({ state: "visible", timeout: 10000 });

  // 7. Click the alerts link to navigate to the alerts page
  const href = await alertsLink.getAttribute("href");
  await page.goto(href!);
  await page.waitForURL("http://localhost:8080/alerts/*", { timeout: 5000 });

  // 8. Wait for map to load
  await page.locator("#map").waitFor({ state: "attached", timeout: 10000 });
  const mapCanvas = page.locator("canvas.mapboxgl-canvas").first();
  await expect(mapCanvas).toBeVisible();

  // 9. Wait for the map to be fully loaded
  await page.waitForFunction(
    () => {
      // @ts-expect-error _testMap is exposed for E2E testing only
      const map = window._testMap;
      return map?.isStyleLoaded() && map.loaded();
    },
    { timeout: 5000 },
  );
}

test("annotated collections - view saved incidents sidebar", async ({
  authenticatedPageAsAdmin: page,
}) => {
  await navigateToAlertsDashboard(page);

  // Find the checkmark button (view incidents button)
  const viewIncidentsButton = page.getByTestId("incidents-view-button");

  // Click to open sidebar
  await viewIncidentsButton.click();

  // Wait for sidebar to appear
  await page.waitForSelector(".incidents-sidebar", { timeout: 5000 });

  // Verify sidebar shows "Saved Incidents" title
  await expect(
    page.getByRole("heading", { name: /saved incidents/i }),
  ).toBeVisible();

  // Verify sidebar can be closed
  const closeButton = page.locator(".incidents-sidebar .close-btn");
  await closeButton.click();

  // Verify sidebar is closed
  await expect(page.locator(".incidents-sidebar")).not.toBeVisible();
});

test("annotated collections - multi-select mode and create incident", async ({
  authenticatedPageAsAdmin: page,
}) => {
  await navigateToAlertsDashboard(page);

  // Find and click multi-select button (second button in incidents-controls)
  const multiSelectButton = page.getByTestId("incidents-multiselect-button");

  await multiSelectButton.click();

  // Verify multi-select mode is active (button should have active class)
  await expect(multiSelectButton).toHaveClass(/active/);

  // Wait for map to be ready for interactions
  await page.waitForTimeout(1000);

  // Polygon-only selection: pick a polygon and fire a Cmd/Ctrl click.
  const lngLat = await getSelectableFeatureLngLat(page);
  if (!lngLat) {
    test.skip();
    return;
  }

  const clickPoint = await projectLngLatToPagePoint(page, lngLat);
  if (!clickPoint) {
    test.skip();
    return;
  }

  await page.mouse.click(clickPoint.x, clickPoint.y, {
    modifiers: [selectionModifierKey],
  });

  const createButton = page.getByTestId("incidents-create-button");
  await expect(createButton).toBeEnabled({ timeout: 5000 });

  // Disable multi-select mode
  await multiSelectButton.click();
  await expect(multiSelectButton).not.toHaveClass(/active/);
});

test("annotated collections - bounding box selection", async ({
  authenticatedPageAsAdmin: page,
}) => {
  await navigateToAlertsDashboard(page);

  // Find and click bounding box button (third button in incidents-controls)
  const boundingBoxButton = page.getByTestId("incidents-bbox-button");

  await boundingBoxButton.click();

  // Verify bounding box mode is active
  await expect(boundingBoxButton).toHaveClass(/active/);

  // Wait for map to be ready
  await page.waitForTimeout(1000);

  // Find a real feature, then draw a bbox around it (avoids guessing)
  const lngLat = await getSelectableFeatureLngLat(page);

  if (!lngLat) {
    test.skip();
    return;
  }

  const featureLocation = await page.evaluate(([lng, lat]) => {
    // @ts-expect-error _testMap is exposed for E2E testing only
    const map = window._testMap;
    if (!map) return null;

    const point = map.project([lng, lat]);
    const rect = map.getCanvas().getBoundingClientRect();
    return { x: rect.left + point.x, y: rect.top + point.y };
  }, lngLat);

  if (!featureLocation) {
    test.skip();
    return;
  }

  const startX = featureLocation.x - 30;
  const startY = featureLocation.y - 30;
  const endX = featureLocation.x + 30;
  const endY = featureLocation.y + 30;

  await page.keyboard.down(selectionModifierKey);
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(endX, endY);
  await page.mouse.up();
  await page.keyboard.up(selectionModifierKey);

  const createButton = page.getByTestId("incidents-create-button");
  await expect(createButton).toBeEnabled({ timeout: 5000 });

  // Disable bounding box mode
  await boundingBoxButton.click();
  await expect(boundingBoxButton).not.toHaveClass(/active/);
});

test("annotated collections - create incident flow", async ({
  authenticatedPageAsAdmin: page,
}) => {
  await navigateToAlertsDashboard(page);

  // Enable multi-select mode
  const multiSelectButton = page.getByTestId("incidents-multiselect-button");
  await multiSelectButton.click();
  await page.waitForTimeout(500);

  // Find a polygon feature and Cmd/Ctrl+click it.
  const lngLat = await getSelectableFeatureLngLat(page);

  if (!lngLat) {
    test.skip();
    return;
  }

  const clickPoint = await projectLngLatToPagePoint(page, lngLat);
  if (!clickPoint) {
    test.skip();
    return;
  }

  await page.mouse.click(clickPoint.x, clickPoint.y, {
    modifiers: [selectionModifierKey],
  });

  // Verify that a feature was selected by checking if create button is enabled
  const createButton = page.getByTestId("incidents-create-button");

  // Wait for the button to become enabled (feature selection may take a moment)
  await expect(createButton).toBeEnabled({ timeout: 5000 });

  // Click the create incident button (+ button)
  await createButton.click();

  // Wait for sidebar to open with create form
  await page.waitForSelector(".incidents-sidebar", { timeout: 5000 });

  // Verify sidebar shows "Create New Incident" title
  await expect(
    page.getByRole("heading", { name: /create new incident/i }),
  ).toBeVisible();

  // Verify create form is visible
  await expect(page.locator(".create-form")).toBeVisible();

  // Fill out the incident form
  const nameInput = page.locator('input[id="name"]');
  await nameInput.fill("Test Incident E2E");

  const descriptionTextarea = page.locator('textarea[id="description"]');
  await descriptionTextarea.fill(
    "This is a test incident created during E2E testing",
  );

  // Select incident type
  const typeSelect = page.locator('select[id="incident_type"]');
  await typeSelect.selectOption("Deforestation");

  // Submit the form
  const submitButton = page.locator(".submit-btn");
  await submitButton.click();

  // Wait for the incident to be created (sidebar might close or show success)
  await page.waitForTimeout(2000);

  // Verify the incident was created by checking if it appears in saved incidents
  // Open the view incidents sidebar
  const viewIncidentsButton = page.getByTestId("incidents-view-button");
  await viewIncidentsButton.click();

  await page.waitForSelector(".incidents-sidebar", { timeout: 5000 });

  // Check if our test incident appears in the list
  await expect(
    page.getByText("Test Incident E2E", { exact: false }),
  ).toBeVisible({ timeout: 5000 });
});

test("annotated collections - toggle selection with ctrl+click", async ({
  authenticatedPageAsAdmin: page,
}) => {
  await navigateToAlertsDashboard(page);

  // Enable multi-select mode
  const multiSelectButton = page.getByTestId("incidents-multiselect-button");
  await multiSelectButton.click();
  await page.waitForTimeout(500);

  const lngLat = await getSelectableFeatureLngLat(page);

  if (!lngLat) {
    test.skip();
    return;
  }

  const clickPoint = await projectLngLatToPagePoint(page, lngLat);
  if (!clickPoint) {
    test.skip();
    return;
  }

  // First click to select
  await page.mouse.click(clickPoint.x, clickPoint.y, {
    modifiers: [selectionModifierKey],
  });

  // Verify feature was selected
  const createButton = page.getByTestId("incidents-create-button");
  await expect(createButton).toBeEnabled({ timeout: 5000 });

  // Second click toggles (deselect)
  await page.mouse.click(clickPoint.x, clickPoint.y, {
    modifiers: [selectionModifierKey],
  });

  // Verify selection was toggled (create button should be disabled again)
  const isDisabled = await createButton.getAttribute("disabled");
  // After deselecting, button should be disabled
  expect(isDisabled).not.toBeNull();
});

test("annotated collections - remove individual source from selection", async ({
  authenticatedPageAsAdmin: page,
}) => {
  await navigateToAlertsDashboard(page);

  // Enable multi-select mode
  const multiSelectButton = page.getByTestId("incidents-multiselect-button");
  await multiSelectButton.click();
  await page.waitForTimeout(500);

  const lngLat = await getSelectableFeatureLngLat(page);

  if (!lngLat) {
    test.skip();
    return;
  }

  const clickPoint = await projectLngLatToPagePoint(page, lngLat);
  if (!clickPoint) {
    test.skip();
    return;
  }

  const clickPoint = await projectLngLatToPagePoint(page, lngLat);
  if (!clickPoint) {
    test.skip();
    return;
  }

  // Select a feature
  await page.mouse.click(clickPoint.x, clickPoint.y, {
    modifiers: [selectionModifierKey],
  });

  // Open create incident sidebar
  const createButton = page.getByTestId("incidents-create-button");
  await expect(createButton).toBeEnabled({ timeout: 5000 });
  await createButton.click();

  await page.waitForSelector(".incidents-sidebar", { timeout: 5000 });

  // Close the sidebar
  const closeButton = page.locator(".incidents-sidebar .close-btn");
  await closeButton.click();

  await page.waitForTimeout(500);

  // Verify sidebar is closed
  await expect(page.locator(".incidents-sidebar")).not.toBeVisible();

  // Verify selections were cleared (create button should be disabled)
  const createButtonAfterClose = page.getByTestId("incidents-create-button");
  const isDisabled = await createButtonAfterClose.getAttribute("disabled");
  expect(isDisabled).not.toBeNull();
});

test("annotated collections - view incidents sidebar does not clear selections", async ({
  authenticatedPageAsAdmin: page,
}) => {
  await navigateToAlertsDashboard(page);

  // Enable multi-select mode
  const multiSelectButton = page.getByTestId("incidents-multiselect-button");
  await multiSelectButton.click();
  await page.waitForTimeout(500);

  const lngLat = await getSelectableFeatureLngLat(page);

  if (!lngLat) {
    test.skip();
    return;
  }

  const clickPoint = await projectLngLatToPagePoint(page, lngLat);
  if (!clickPoint) {
    test.skip();
    return;
  }

  // Select a feature
  await page.mouse.click(clickPoint.x, clickPoint.y, {
    modifiers: [selectionModifierKey],
  });

  // Verify feature was selected
  const createButton = page.getByTestId("incidents-create-button");
  await expect(createButton).toBeEnabled({ timeout: 5000 });

  // Open view incidents sidebar (checkmark button)
  const viewIncidentsButton = page.getByTestId("incidents-view-button");
  await viewIncidentsButton.click();

  await page.waitForSelector(".incidents-sidebar", { timeout: 5000 });

  // Verify sidebar shows "Saved Incidents" (not create form)
  await expect(
    page.getByRole("heading", { name: /saved incidents/i }),
  ).toBeVisible();

  // Close the sidebar
  const closeButton = page.locator(".incidents-sidebar .close-btn");
  await closeButton.click();

  await page.waitForTimeout(500);

  // Verify selections were NOT cleared (create button should still be enabled)
  const isDisabled = await createButton.getAttribute("disabled");
  // Button should be enabled because selections were preserved
  expect(isDisabled).toBeNull();
});
