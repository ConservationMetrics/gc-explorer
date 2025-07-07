import { expect, test } from "@playwright/test";

test("alerts dashboard - opens sidebar and updates URL on symbol and polygon clicks", async ({
  page,
}) => {
  await page.goto("/");
  // Wait until the index page has rendered the list of available views
  const alertsLink = page.getByRole("link", { name: /alerts/i }).first();
  await alertsLink.waitFor({ state: "visible", timeout: 5000 });

  // Navigate to the alerts dashboard via client-side routing
  await alertsLink.click();

  // Ensure the route change completed
  await page.waitForURL("**/alerts/**", { timeout: 5000 });

  // Wait until the map container has been added to the DOM
  await page.locator("#map").waitFor({ state: "attached", timeout: 5000 });

  /* Give Mapbox a gentle nudge: click roughly at 75% of the viewport width
   (vertically centered).  This ensures tiles are rendered and
   the map has focus before we look for pulsing markers. */
  const viewport = page.viewportSize();
  if (viewport) {
    await page.mouse.click(viewport.width * 0.75, viewport.height * 0.5);
  }
  await page.locator("#map").waitFor();

  // Wait for the map to be ready and the canvas to be visible
  const mapCanvas = page.locator("canvas.mapboxgl-canvas").first();
  await expect(mapCanvas).toBeVisible();

  // Ensure the Mapbox instance has been attached to window
  await page.waitForFunction(() => {
    // @ts-expect-error _testMap is exposed for E2E testing only
    return !!window._testMap;
  });

  // Wait for the map to be fully loaded and rendered
  await page.waitForFunction(
    () => {
      // @ts-expect-error _testMap is exposed for E2E testing only
      const map = window._testMap;
      return map && map.isStyleLoaded() && map.loaded();
    },
    { timeout: 5000 },
  );

  // pull every symbol feature Mapbox has already rendered

  const symbolFeatures = await page.evaluate(() => {
    // @ts-expect-error helper exposed in component
    const map = window._testMap;
    const features = map.queryRenderedFeatures({
      layers: ["most-recent-alerts-symbol"],
    });
    return features;
  });

  // Wait for at least one symbol feature to be rendered
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

  //
  // loop through them and fire a synthetic click
  for (const feature of symbolFeatures) {
    // Parse centroid (as string "lat, lng")
    const [lat, lng] = feature.properties.geographicCentroid
      .split(",")
      .map(Number);

    // 1. Click the symbol to zoom
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

    // 2. Wait until the map has finished panning/zooming
    await page.waitForFunction(() => {
      // @ts-expect-error _testMap is exposed for E2E testing only
      const m = window._testMap;
      return m && !m.isMoving();
    });

    // 3. Project centroid to screen coordinates (use [lng, lat] order!)
    const { x, y } = await page.evaluate(
      ([lng, lat]) => {
        // @ts-expect-error helper exposed in component
        return window._testMap.project([lng, lat]);
      },
      [lng, lat],
    );

    // 4. Try to find a polygon at or near that pixel (expand search radius)
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
      // 5. Click the canvas at the found pixel
      await page.mouse.click(found.px, found.py);
      // 6. Assert sidebar
      await expect(page.getByText(/copy link to alert/i)).toBeVisible();
      // 7. Assert the URL contains the alertId query param
      await expect(page).toHaveURL(/\?alertId=/);
    }
  }
});
