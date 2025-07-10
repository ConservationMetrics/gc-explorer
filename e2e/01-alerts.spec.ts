import { expect, test } from "@playwright/test";

test("alerts dashboard - opens sidebar and updates URL on symbol and polygon clicks", async ({
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
