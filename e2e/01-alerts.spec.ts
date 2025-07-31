import { expect, test } from "@playwright/test";

test("alerts dashboard - layer visibility toggles", async ({ page }) => {
  // 1. Navigate to the index page first to get available tables
  await page.goto("/");

  // Debug: Log page content to understand what's rendered
  console.log("🔍 Page title:", await page.title());
  console.log("🔍 Page URL:", page.url());

  // Debug: Check if there are any links on the page
  const allLinks = page.locator("a");
  const linkCount = await allLinks.count();
  console.log("🔍 Total links on page:", linkCount);

  // Debug: Log all link texts
  for (let i = 0; i < linkCount; i++) {
    const link = allLinks.nth(i);
    const text = await link.textContent();
    const href = await link.getAttribute("href");
    console.log(`🔍 Link ${i}: text="${text?.trim()}", href="${href}"`);
  }

  // Debug: Check if there are any elements with "alerts" text
  const alertsElements = page.locator("*:has-text('alerts')");
  const alertsCount = await alertsElements.count();
  console.log("🔍 Elements containing 'alerts' text:", alertsCount);

  // Debug: Log page HTML for debugging
  const pageContent = await page.content();
  console.log(
    "🔍 Page HTML (first 1000 chars):",
    pageContent.substring(0, 1000),
  );

  // 2. Wait until the index page has rendered the list of available views
  const alertsLink = page.getByRole("link", { name: /alerts/i }).first();
  await alertsLink.waitFor({ state: "visible", timeout: 5000 });

  // 3. Get the href first
  const href = await alertsLink.getAttribute("href");
  console.log("🔍 Alerts link href:", href);

  // 4. Navigate directly to alerts page
  await page.goto(href!);

  // 5. Ensure the route change completed
  await page.waitForURL("http://localhost:8080/alerts/*", { timeout: 5000 });

  // Debug: Check if map container exists
  const mapContainer = page.locator("#map");
  const mapExists = await mapContainer.count();
  console.log("🔍 Map container exists:", mapExists > 0);

  if (mapExists === 0) {
    // Debug: Log the page content to see what's actually there
    const alertsPageContent = await page.content();
    console.log(
      "🔍 Alerts page HTML (first 2000 chars):",
      alertsPageContent.substring(0, 2000),
    );

    // Wait a bit more for the page to load
    await page.waitForTimeout(2000);
  }

  // 6. Wait until the map container has been added to the DOM
  await page.locator("#map").waitFor({ state: "attached", timeout: 10000 });

  // 7. Wait for the map to be ready and the canvas to be visible
  const mapCanvas = page.locator("canvas.mapboxgl-canvas").first();
  await expect(mapCanvas).toBeVisible();

  // 8. Wait for the map to be fully loaded
  await page.waitForFunction(
    () => {
      // @ts-expect-error _testMap is exposed for E2E testing only
      const map = window._testMap;
      return map && map.isStyleLoaded() && map.loaded();
    },
    { timeout: 5000 },
  );

  // 9. Wait for the map legend to be prepared and visible
  // First wait for the map to be idle (which triggers legend preparation)
  await page.waitForFunction(
    () => {
      // @ts-expect-error _testMap is exposed for E2E testing only
      const map = window._testMap;
      return map && !map.isMoving() && map.loaded();
    },
    { timeout: 10000 },
  );

  // Wait a bit more for the legend to be prepared
  await page.waitForTimeout(2000);

  const mapLegend = page.getByTestId("map-legend");

  // Debug: Check if map legend exists
  const legendExists = await mapLegend.count();
  console.log("🔍 Map legend exists:", legendExists > 0);

  if (legendExists === 0) {
    // Debug: Log the page content to see what's actually there
    const alertsPageContent = await page.content();
    console.log(
      "🔍 Alerts page HTML (first 2000 chars):",
      alertsPageContent.substring(0, 2000),
    );

    // Wait a bit more for the page to load
    await page.waitForTimeout(3000);
  }

  // Wait for the map legend to be attached to DOM
  await mapLegend.waitFor({ state: "attached", timeout: 10000 });

  // Then wait for it to be visible
  await expect(mapLegend).toBeVisible();

  // 10. Get all legend checkboxes
  const legendCheckboxes = page.getByTestId("map-legend-checkbox");
  const checkboxCount = await legendCheckboxes.count();
  expect(checkboxCount).toBeGreaterThan(0);

  // 11. Test toggle functionality for each layer
  for (let i = 0; i < checkboxCount; i++) {
    const checkbox = legendCheckboxes.nth(i);
    const label = checkbox.locator("xpath=../label");
    const labelText = await label.textContent();

    console.log(`Testing toggle for layer: ${labelText}`);

    // Get the layer ID from the label text
    await page.evaluate((text) => {
      // @ts-expect-error _testMap is exposed for E2E testing only
      const map = window._testMap;
      const layers = map.getStyle().layers;
      // Find layer that matches the label text
      const layer = layers.find((l: { id: string }) =>
        l.id
          .toLowerCase()
          .includes(text?.toLowerCase().replace(/\s+/g, "-") || ""),
      );
      return layer ? layer.id : null;
    }, labelText);

    // Toggle off
    await checkbox.click();
    await page.waitForTimeout(500);

    // Verify layer is hidden by checking if the checkbox is unchecked
    const isChecked = await checkbox.isChecked();
    expect(isChecked).toBe(false);

    // Toggle on
    await checkbox.click();
    await page.waitForTimeout(500);

    // Verify layer is visible again by checking if the checkbox is checked
    const isCheckedAgain = await checkbox.isChecked();
    expect(isCheckedAgain).toBe(true);
  }
});

test("alerts dashboard - LineString buffer click behavior", async ({
  page,
}) => {
  // 1. Navigate to the index page first to get available tables
  await page.goto("/");

  // 2. Wait until the index page has rendered the list of available views
  const alertsLink = page.getByRole("link", { name: /alerts/i }).first();
  await alertsLink.waitFor({ state: "visible", timeout: 5000 });

  // 3. Get the href first
  const href = await alertsLink.getAttribute("href");

  // 4. Navigate directly to alerts page
  await page.goto(href!);

  // 5. Ensure the route change completed
  await page.waitForURL("http://localhost:8080/alerts/*", { timeout: 5000 });

  // 6. Wait until the map container has been added to the DOM
  await page.locator("#map").waitFor({ state: "attached", timeout: 5000 });

  // 7. Wait for the map to be ready and the canvas to be visible
  const mapCanvas = page.locator("canvas.mapboxgl-canvas").first();
  await expect(mapCanvas).toBeVisible();

  // 8. Wait for the map to be fully loaded
  await page.waitForFunction(
    () => {
      // @ts-expect-error _testMap is exposed for E2E testing only
      const map = window._testMap;
      return map && map.isStyleLoaded() && map.loaded();
    },
    { timeout: 5000 },
  );

  // 9. Check if LineString features exist
  const hasLineStrings = await page.evaluate(() => {
    // @ts-expect-error _testMap is exposed for E2E testing only
    const map = window._testMap;
    const features = map.queryRenderedFeatures({
      layers: ["most-recent-alerts-linestring", "previous-alerts-linestring"],
    });
    return features.length > 0;
  });

  if (hasLineStrings) {
    console.log("LineString features found, testing buffer click behavior");

    // 10. Test cursor changes when hovering over LineString features
    const viewport = page.viewportSize();
    if (viewport) {
      // Move mouse to center of map
      await page.mouse.move(viewport.width / 2, viewport.height / 2);

      // Check if cursor changes to pointer when over LineString
      const cursorStyle = await page.evaluate(() => {
        // @ts-expect-error _testMap is exposed for E2E testing only
        return window._testMap.getCanvas().style.cursor;
      });

      // Cursor should be pointer when over LineString features
      expect(cursorStyle).toBe("pointer");
    }

    // 11. Test buffer click functionality
    const lineStringFeatures = await page.evaluate(() => {
      // @ts-expect-error _testMap is exposed for E2E testing only
      const map = window._testMap;
      return map.queryRenderedFeatures({
        layers: ["most-recent-alerts-linestring", "previous-alerts-linestring"],
      });
    });

    if (lineStringFeatures.length > 0) {
      const firstFeature = lineStringFeatures[0];
      const [lng, lat] = firstFeature.geometry.coordinates[0];

      // Click on the LineString feature
      await page.evaluate(
        ([lng, lat]) => {
          // @ts-expect-error _testMap is exposed for E2E testing only
          const map = window._testMap;
          const pt = map.project([lng, lat]);
          map.fire("click", {
            point: pt,
            lngLat: [lng, lat],
            originalEvent: {},
            features: [],
          });
        },
        [lng, lat],
      );

      // 12. Verify sidebar opens after clicking LineString
      await expect(page.getByText(/copy link to alert/i)).toBeVisible();

      // 13. Verify URL contains alertId
      await expect(page).toHaveURL(/\?alertId=/);
    }
  } else {
    console.log("No LineString features found, skipping buffer tests");
  }
});

test("alerts dashboard - geometry type specific interactions", async ({
  page,
}) => {
  // 1. Navigate to the index page first to get available tables
  await page.goto("/");

  // 2. Wait until the index page has rendered the list of available views
  const alertsLink = page.getByRole("link", { name: /alerts/i }).first();
  await alertsLink.waitFor({ state: "visible", timeout: 5000 });

  // 3. Get the href first
  const href = await alertsLink.getAttribute("href");

  // 4. Navigate directly to alerts page
  await page.goto(href!);

  // 5. Ensure the route change completed
  await page.waitForURL("http://localhost:8080/alerts/*", { timeout: 5000 });

  // 6. Wait until the map container has been added to the DOM
  await page.locator("#map").waitFor({ state: "attached", timeout: 5000 });

  // 7. Wait for the map to be ready and the canvas to be visible
  const mapCanvas = page.locator("canvas.mapboxgl-canvas").first();
  await expect(mapCanvas).toBeVisible();

  // 8. Wait for the map to be fully loaded
  await page.waitForFunction(
    () => {
      // @ts-expect-error _testMap is exposed for E2E testing only
      const map = window._testMap;
      return map && map.isStyleLoaded() && map.loaded();
    },
    { timeout: 5000 },
  );

  // 9. Test Point features
  const pointFeatures = await page.evaluate(() => {
    // @ts-expect-error _testMap is exposed for E2E testing only
    const map = window._testMap;
    return map.queryRenderedFeatures({
      layers: ["most-recent-alerts-point", "previous-alerts-point"],
    });
  });

  if (pointFeatures.length > 0) {
    console.log(`Testing ${pointFeatures.length} Point features`);

    const firstPoint = pointFeatures[0];
    const [lng, lat] = firstPoint.geometry.coordinates;

    // Click on Point feature
    await page.evaluate(
      ([lng, lat]) => {
        // @ts-expect-error _testMap is exposed for E2E testing only
        const map = window._testMap;
        const pt = map.project([lng, lat]);
        map.fire("click", {
          point: pt,
          lngLat: [lng, lat],
          originalEvent: {},
          features: [],
        });
      },
      [lng, lat],
    );

    // Verify sidebar opens
    await expect(page.getByText(/copy link to alert/i)).toBeVisible();
    await expect(page).toHaveURL(/\?alertId=/);
  }

  // 10. Test Polygon features
  const polygonFeatures = await page.evaluate(() => {
    // @ts-expect-error _testMap is exposed for E2E testing only
    const map = window._testMap;
    return map.queryRenderedFeatures({
      layers: ["most-recent-alerts-polygon", "previous-alerts-polygon"],
    });
  });

  if (polygonFeatures.length > 0) {
    console.log(`Testing ${polygonFeatures.length} Polygon features`);

    const firstPolygon = polygonFeatures[0];
    // Use centroid of polygon for clicking
    const [lng, lat] = firstPolygon.properties.geographicCentroid
      .split(",")
      .map(Number);

    // Click on Polygon feature
    await page.evaluate(
      ([lng, lat]) => {
        // @ts-expect-error _testMap is exposed for E2E testing only
        const map = window._testMap;
        const pt = map.project([lng, lat]);
        map.fire("click", {
          point: pt,
          lngLat: [lng, lat],
          originalEvent: {},
          features: [],
        });
      },
      [lng, lat],
    );

    // Verify sidebar opens
    await expect(page.getByText(/copy link to alert/i)).toBeVisible();
    await expect(page).toHaveURL(/\?alertId=/);
  }

  // 11. Test LineString features with buffer
  const lineStringFeatures = await page.evaluate(() => {
    // @ts-expect-error _testMap is exposed for E2E testing only
    const map = window._testMap;
    return map.queryRenderedFeatures({
      layers: ["most-recent-alerts-linestring", "previous-alerts-linestring"],
    });
  });

  if (lineStringFeatures.length > 0) {
    console.log(
      `Testing ${lineStringFeatures.length} LineString features with buffer`,
    );

    const firstLineString = lineStringFeatures[0];
    const [lng, lat] = firstLineString.geometry.coordinates[0];

    // Test buffer click behavior
    await page.evaluate(
      ([lng, lat]) => {
        // @ts-expect-error _testMap is exposed for E2E testing only
        const map = window._testMap;
        const pt = map.project([lng, lat]);

        // Simulate buffer click with pixel offset
        const pixelBuffer = 10;
        const bbox = [
          [pt.x - pixelBuffer, pt.y - pixelBuffer],
          [pt.x + pixelBuffer, pt.y + pixelBuffer],
        ];

        const features = map.queryRenderedFeatures(bbox, {
          layers: [
            "most-recent-alerts-linestring",
            "previous-alerts-linestring",
          ],
        });

        if (features.length > 0) {
          map.fire("click", {
            point: pt,
            lngLat: [lng, lat],
            originalEvent: {},
            features: features,
          });
        }
      },
      [lng, lat],
    );

    // Verify sidebar opens after buffer click
    await expect(page.getByText(/copy link to alert/i)).toBeVisible();
    await expect(page).toHaveURL(/\?alertId=/);
  }
});

test("alerts dashboard - opens sidebar and updates URL on symbol and polygon clicks", async ({
  page,
}) => {
  // 1. Navigate to the index page first to get available tables
  await page.goto("/");

  // Debug: Log page content to understand what's rendered
  console.log("🔍 Page title:", await page.title());
  console.log("🔍 Page URL:", page.url());

  // Debug: Check if there are any links on the page
  const allLinks = page.locator("a");
  const linkCount = await allLinks.count();
  console.log("🔍 Total links on page:", linkCount);

  // Debug: Log all link texts
  for (let i = 0; i < linkCount; i++) {
    const link = allLinks.nth(i);
    const text = await link.textContent();
    const href = await link.getAttribute("href");
    console.log(`🔍 Link ${i}: text="${text?.trim()}", href="${href}"`);
  }

  // Debug: Check if there are any elements with "alerts" text
  const alertsElements = page.locator("*:has-text('alerts')");
  const alertsCount = await alertsElements.count();
  console.log("🔍 Elements containing 'alerts' text:", alertsCount);

  // Debug: Log page HTML for debugging
  const pageContent = await page.content();
  console.log(
    "🔍 Page HTML (first 1000 chars):",
    pageContent.substring(0, 1000),
  );
  // 2. Wait until the index page has rendered the list of available views
  const alertsLink = page.getByRole("link", { name: /alerts/i }).first();
  await alertsLink.waitFor({ state: "visible", timeout: 5000 });

  // 3. Get the href first
  const href = await alertsLink.getAttribute("href");

  // 4. Navigate directly to alerts page
  await page.goto(href!);

  // 5. Ensure the route change completed
  await page.waitForURL("http://localhost:8080/alerts/*", { timeout: 5000 });

  // 6. Wait until the map container has been added to the DOM
  await page.locator("#map").waitFor({ state: "attached", timeout: 5000 });

  // 7. Give Mapbox a gentle nudge: click roughly at 75% of the viewport width
  // (vertically centered). This ensures tiles are rendered and
  // the map has focus before we look for pulsing markers.
  const viewport = page.viewportSize();
  if (viewport) {
    console.log(
      `🖱️ Clicking map at position (${viewport.width * 0.75}, ${viewport.height * 0.5})`,
    );
    await page.mouse.click(viewport.width * 0.75, viewport.height * 0.5);
  }
  await page.locator("#map").waitFor();

  // 8. Wait for the map to be ready and the canvas to be visible
  const mapCanvas = page.locator("canvas.mapboxgl-canvas").first();
  await expect(mapCanvas).toBeVisible();

  // 9. Ensure the Mapbox instance has been attached to window
  await page.waitForFunction(() => {
    // @ts-expect-error _testMap is exposed for E2E testing only
    return !!window._testMap;
  });

  // 10. Wait for the map to be fully loaded and rendered
  await page.waitForFunction(
    () => {
      // @ts-expect-error _testMap is exposed for E2E testing only
      const map = window._testMap;
      return map && map.isStyleLoaded() && map.loaded();
    },
    { timeout: 5000 },
  );

  // 11. Pull every symbol feature Mapbox has already rendered
  const symbolFeatures = await page.evaluate(() => {
    // @ts-expect-error helper exposed in component
    const map = window._testMap;
    const features = map.queryRenderedFeatures({
      layers: ["most-recent-alerts-symbol"],
    });
    return features;
  });

  // 12. Wait for at least one symbol feature to be rendered
  await page.waitForFunction(
    () => {
      // @ts-expect-error _testMap is exposed for E2E testing only
      // We wait for symbol features to render because DOM or API readiness doesn't guarantee map rendering
      const map = window._testMap;
      const features = map.queryRenderedFeatures({
        layers: ["most-recent-alerts-symbol"],
      });
      return features.length > 0;
    },
    { timeout: 5000 },
  );

  // 13. Loop through them and fire a synthetic click
  for (let i = 0; i < symbolFeatures.length; i++) {
    const feature = symbolFeatures[i];
    console.log(
      `🎯 Processing symbol feature ${i + 1}/${symbolFeatures.length}`,
    );

    // 14. Parse centroid (as string "lat, lng")
    const [lat, lng] = feature.properties.geographicCentroid
      .split(",")
      .map(Number);

    // 15. Click the symbol to zoom
    await page.evaluate(
      ([lng, lat]) => {
        // @ts-expect-error helper exposed in component
        const map = window._testMap;
        const pt = map.project([lng, lat]);
        map.fire("click", {
          point: pt,
          lngLat: [lng, lat],
          originalEvent: {},
          features: [],
        });
      },
      [lng, lat],
    );

    // 16. Wait until the map has finished panning/zooming
    await page.waitForFunction(() => {
      // @ts-expect-error _testMap is exposed for E2E testing only
      const m = window._testMap;
      return m && !m.isMoving();
    });

    // 17. Project centroid to screen coordinates (use [lng, lat] order!)
    const { x, y } = await page.evaluate(
      ([lng, lat]) => {
        // @ts-expect-error helper exposed in component
        return window._testMap.project([lng, lat]);
      },
      [lng, lat],
    );

    // 18. Try to find a polygon at or near that pixel (expand search radius)
    const found = await page.evaluate(
      ({ x, y }) => {
        // @ts-expect-error helper exposed in component
        const map = window._testMap;
        // Try a wider offset in case of projection drift
        for (let r = 0; r <= 50; r += 5) {
          // search radius up to 50px, step 5px
          for (let dx = -r; dx <= r; dx += 5) {
            for (let dy = -r; dy <= r; dy += 5) {
              const px = x + dx,
                py = y + dy;
              const poly = map.queryRenderedFeatures([px, py], {
                layers: ["most-recent-alerts-polygon"],
              })[0];
              if (poly) return { found: true, px, py };
            }
          }
        }
        return { found: false };
      },
      { x, y },
    );

    if (found.found) {
      // 19. Click the canvas at the found pixel
      await page.mouse.click(found.px, found.py);

      // 20. Assert sidebar is visible
      await expect(page.getByText(/copy link to alert/i)).toBeVisible();

      // 21. Assert the URL contains the alertId query param
      await expect(page).toHaveURL(/\?alertId=/);
    }
  }
});
