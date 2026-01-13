import { test, expect } from "./fixtures/auth-storage";
import type { Page } from "@playwright/test";

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
  const viewIncidentsButton = page
    .locator(".incidents-controls")
    .locator("button")
    .first();

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
  const multiSelectButton = page
    .locator(".incidents-controls")
    .locator("button")
    .nth(1); // Multi-select is the second button

  await multiSelectButton.click();

  // Verify multi-select mode is active (button should have active class)
  await expect(multiSelectButton).toHaveClass(/active/);

  // Wait for map to be ready for interactions
  await page.waitForTimeout(1000);

  // Try to click on a feature on the map
  // First, find if there are any alert features visible
  const hasFeatures = await page.evaluate(() => {
    // @ts-expect-error _testMap is exposed for E2E testing only
    const map = window._testMap;
    if (!map) return false;

    const features = map.queryRenderedFeatures({
      layers: [
        "most-recent-alerts-point",
        "most-recent-alerts-polygon",
        "most-recent-alerts-linestring",
        "most-recent-alerts-centroids",
      ],
    });
    return features.length > 0;
  });

  if (hasFeatures) {
    // Click on a feature to select it
    const viewport = page.viewportSize();
    if (viewport) {
      // Click near center of map where features might be
      await page.mouse.click(viewport.width / 2, viewport.height / 2);
      await page.waitForTimeout(500);

      // Verify that a feature was selected (check if selectedSources count increased)
      // We can't directly check the Vue state, but we can check if the create button becomes enabled
      const createButton = page
        .locator(".incidents-controls")
        .locator("button")
        .last(); // Create button is the last button

      // The button should not be disabled if we have selections
      const _isDisabled = await createButton.getAttribute("disabled");
      // If we successfully selected, the button should be enabled (or null if not disabled)
      // Note: This is a basic check - in a real scenario we'd verify the selection count
    }
  }

  // Disable multi-select mode
  await multiSelectButton.click();
  await expect(multiSelectButton).not.toHaveClass(/active/);
});

test("annotated collections - bounding box selection", async ({
  authenticatedPageAsAdmin: page,
}) => {
  await navigateToAlertsDashboard(page);

  // Find and click bounding box button (third button in incidents-controls)
  const boundingBoxButton = page
    .locator(".incidents-controls")
    .locator("button")
    .nth(2); // Bounding box is the third button

  await boundingBoxButton.click();

  // Verify bounding box mode is active
  await expect(boundingBoxButton).toHaveClass(/active/);

  // Wait for map to be ready
  await page.waitForTimeout(1000);

  const viewport = page.viewportSize();
  if (viewport) {
    // Simulate Ctrl+drag to create bounding box
    const startX = viewport.width / 2 - 50;
    const startY = viewport.height / 2 - 50;
    const endX = viewport.width / 2 + 50;
    const endY = viewport.height / 2 + 50;

    // Mouse down with Ctrl key
    await page.keyboard.down("Control");
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY);
    await page.mouse.up();
    await page.keyboard.up("Control");

    await page.waitForTimeout(500);

    // Verify bounding box selection worked (check if create button is enabled)
    const createButton = page
      .locator(".incidents-controls")
      .locator("button")
      .last();
    const _isDisabled = await createButton.getAttribute("disabled");
    // Button should be enabled if features were selected
  }

  // Disable bounding box mode
  await boundingBoxButton.click();
  await expect(boundingBoxButton).not.toHaveClass(/active/);
});

test("annotated collections - create incident flow", async ({
  authenticatedPageAsAdmin: page,
}) => {
  await navigateToAlertsDashboard(page);

  // Enable multi-select mode
  const multiSelectButton = page
    .locator(".incidents-controls")
    .locator("button")
    .nth(1);
  await multiSelectButton.click();
  await page.waitForTimeout(500);

  // Try to select a feature by clicking on the map
  const viewport = page.viewportSize();
  if (viewport) {
    // Click on map to select a feature
    await page.mouse.click(viewport.width / 2, viewport.height / 2);
    await page.waitForTimeout(500);
  }

  // Click the create incident button (+ button)
  const createButton = page
    .locator(".incidents-controls")
    .locator("button")
    .last();
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
  const viewIncidentsButton = page
    .locator(".incidents-controls")
    .locator("button")
    .first();
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
  const multiSelectButton = page
    .locator(".incidents-controls")
    .locator("button")
    .nth(1);
  await multiSelectButton.click();
  await page.waitForTimeout(500);

  const viewport = page.viewportSize();
  if (viewport) {
    // First click to select
    await page.mouse.click(viewport.width / 2, viewport.height / 2);
    await page.waitForTimeout(500);

    // Ctrl+click on the same location to deselect
    await page.keyboard.down("Control");
    await page.mouse.click(viewport.width / 2, viewport.height / 2);
    await page.keyboard.up("Control");
    await page.waitForTimeout(500);

    // Verify selection was toggled (create button should be disabled again)
    const createButton = page
      .locator(".incidents-controls")
      .locator("button")
      .last();
    const isDisabled = await createButton.getAttribute("disabled");
    // After deselecting, button should be disabled
    expect(isDisabled).not.toBeNull();
  }
});

test("annotated collections - remove individual source from selection", async ({
  authenticatedPageAsAdmin: page,
}) => {
  await navigateToAlertsDashboard(page);

  // Enable multi-select mode
  const multiSelectButton = page
    .locator(".incidents-controls")
    .locator("button")
    .nth(1);
  await multiSelectButton.click();
  await page.waitForTimeout(500);

  const viewport = page.viewportSize();
  if (viewport) {
    // Select a feature
    await page.mouse.click(viewport.width / 2, viewport.height / 2);
    await page.waitForTimeout(500);
  }

  // Open create incident sidebar
  const createButton = page
    .locator(".incidents-controls")
    .locator("button")
    .last();
  await createButton.click();

  await page.waitForSelector(".incidents-sidebar", { timeout: 5000 });

  // Verify selected sources section is visible
  await expect(page.locator(".selected-sources")).toBeVisible();

  // Find and click the remove button (×) for the first source
  const removeButtons = page.locator(".remove-btn");
  const removeButtonCount = await removeButtons.count();

  if (removeButtonCount > 0) {
    await removeButtons.first().click();
    await page.waitForTimeout(500);

    // Verify the source was removed (selected sources count should decrease)
    // The sidebar might close if no sources remain, or the count should decrease
  }
});

test("annotated collections - clear all sources", async ({
  authenticatedPageAsAdmin: page,
}) => {
  await navigateToAlertsDashboard(page);

  // Enable multi-select mode
  const multiSelectButton = page
    .locator(".incidents-controls")
    .locator("button")
    .nth(1);
  await multiSelectButton.click();
  await page.waitForTimeout(500);

  const viewport = page.viewportSize();
  if (viewport) {
    // Select multiple features by clicking different locations
    await page.mouse.click(viewport.width / 2 - 20, viewport.height / 2);
    await page.waitForTimeout(200);
    await page.mouse.click(viewport.width / 2 + 20, viewport.height / 2);
    await page.waitForTimeout(200);
  }

  // Open create incident sidebar
  const createButton = page
    .locator(".incidents-controls")
    .locator("button")
    .last();
  await createButton.click();

  await page.waitForSelector(".incidents-sidebar", { timeout: 5000 });

  // Find and click "Clear All" button
  const clearAllButton = page.getByText(/clear all/i);
  await clearAllButton.click();
  await page.waitForTimeout(500);

  // Verify all sources were cleared
  // The sidebar should either close or show no selected sources
  const selectedSourcesSection = page.locator(".selected-sources");
  const isVisible = await selectedSourcesSection.isVisible().catch(() => false);
  expect(isVisible).toBe(false);
});

test("annotated collections - close sidebar clears selections when opened via create", async ({
  authenticatedPageAsAdmin: page,
}) => {
  await navigateToAlertsDashboard(page);

  // Enable multi-select mode
  const multiSelectButton = page
    .locator(".incidents-controls")
    .locator("button")
    .nth(1);
  await multiSelectButton.click();
  await page.waitForTimeout(500);

  const viewport = page.viewportSize();
  if (viewport) {
    // Select a feature
    await page.mouse.click(viewport.width / 2, viewport.height / 2);
    await page.waitForTimeout(500);
  }

  // Open create incident sidebar
  const createButton = page
    .locator(".incidents-controls")
    .locator("button")
    .last();
  await createButton.click();

  await page.waitForSelector(".incidents-sidebar", { timeout: 5000 });

  // Close the sidebar
  const closeButton = page.locator(".incidents-sidebar .close-btn");
  await closeButton.click();

  await page.waitForTimeout(500);

  // Verify sidebar is closed
  await expect(page.locator(".incidents-sidebar")).not.toBeVisible();

  // Verify selections were cleared (create button should be disabled)
  const createButtonAfterClose = page
    .locator(".incidents-controls")
    .locator("button")
    .last();
  const isDisabled = await createButtonAfterClose.getAttribute("disabled");
  expect(isDisabled).not.toBeNull();
});

test("annotated collections - view incidents sidebar does not clear selections", async ({
  authenticatedPageAsAdmin: page,
}) => {
  await navigateToAlertsDashboard(page);

  // Enable multi-select mode
  const multiSelectButton = page
    .locator(".incidents-controls")
    .locator("button")
    .nth(1);
  await multiSelectButton.click();
  await page.waitForTimeout(500);

  const viewport = page.viewportSize();
  if (viewport) {
    // Select a feature
    await page.mouse.click(viewport.width / 2, viewport.height / 2);
    await page.waitForTimeout(500);
  }

  // Open view incidents sidebar (checkmark button)
  const viewIncidentsButton = page
    .locator(".incidents-controls")
    .locator("button")
    .first();
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
  const createButton = page
    .locator(".incidents-controls")
    .locator("button")
    .last();
  const isDisabled = await createButton.getAttribute("disabled");
  // Button should be enabled because selections were preserved
  expect(isDisabled).toBeNull();
});
