import { expect, test } from "@playwright/test";

test("alerts dashboard - opens sidebar and updates URL on symbol and polygon clicks", async ({
  page,
}) => {
  console.log("🚀 Starting alerts dashboard test");

  await page.goto("/");
  console.log("📄 Navigated to homepage");

  // Wait until the index page has rendered the list of available views
  const alertsLink = page.getByRole("link", { name: /alerts/i }).first();
  await alertsLink.waitFor({ state: "visible", timeout: 5000 });

  // Log all alerts links found
  const allAlertsLinks = page.getByRole("link", { name: /alerts/i });
  const alertsCount = await allAlertsLinks.count();
  console.log(`🔗 Found ${alertsCount} alerts links on the page`);

  // Get the href first
  const href = await alertsLink.getAttribute("href");
  console.log(`🎯 First alerts link href: ${href}`);

  // Navigate directly instead of clicking
  console.log("🖱️ Navigating directly to alerts page...");
  await page.goto(href!);

  // Check for any API errors
  const requests = await page.evaluate(() => {
    return performance
      .getEntriesByType("resource")
      .filter((r) => r.name.includes("/api/"))
      .map((r) => ({ url: r.name }));
  });
  console.log("🌐 API requests made:", requests);

  // Ensure the route change completed
  console.log("⏳ Waiting for URL to change to alerts route...");
  await page.waitForURL("http://localhost:8080/alerts/*", { timeout: 5000 });
  console.log("✅ URL changed to alerts route");

  // Wait until the map container has been added to the DOM
  console.log("🗺️ Waiting for map container to be attached...");
  await page.locator("#map").waitFor({ state: "attached", timeout: 5000 });
  console.log("✅ Map container is attached");

  /* Give Mapbox a gentle nudge: click roughly at 75% of the viewport width
   (vertically centered).  This ensures tiles are rendered and
   the map has focus before we look for pulsing markers. */
  const viewport = page.viewportSize();
  if (viewport) {
    console.log(
      `🖱️ Clicking map at position (${viewport.width * 0.75}, ${viewport.height * 0.5})`,
    );
    await page.mouse.click(viewport.width * 0.75, viewport.height * 0.5);
  }
  await page.locator("#map").waitFor();

  // Wait for the map to be ready and the canvas to be visible
  console.log("🎨 Waiting for map canvas to be visible...");
  const mapCanvas = page.locator("canvas.mapboxgl-canvas").first();
  await expect(mapCanvas).toBeVisible();
  console.log("✅ Map canvas is visible");

  // Ensure the Mapbox instance has been attached to window
  console.log("🔍 Checking if Mapbox instance is attached to window...");
  await page.waitForFunction(() => {
    // @ts-expect-error _testMap is exposed for E2E testing only
    return !!window._testMap;
  });
  console.log("✅ Mapbox instance is attached to window");

  // Wait for the map to be fully loaded and rendered
  console.log("⏳ Waiting for map to be fully loaded and rendered...");
  await page.waitForFunction(
    () => {
      // @ts-expect-error _testMap is exposed for E2E testing only
      const map = window._testMap;
      return map && map.isStyleLoaded() && map.loaded();
    },
    { timeout: 5000 },
  );
  console.log("✅ Map is fully loaded and rendered");

  // pull every symbol feature Mapbox has already rendered
  console.log("🔍 Querying rendered symbol features...");
  const symbolFeatures = await page.evaluate(() => {
    // @ts-expect-error helper exposed in component
    const map = window._testMap;
    const features = map.queryRenderedFeatures({
      layers: ["most-recent-alerts-symbol"],
    });
    return features;
  });
  console.log(`🎯 Found ${symbolFeatures.length} symbol features`);

  // Wait for at least one symbol feature to be rendered
  console.log("⏳ Waiting for at least one symbol feature to be rendered...");
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
  console.log("✅ At least one symbol feature is rendered");

  //
  // loop through them and fire a synthetic click
  console.log(`🔄 Processing ${symbolFeatures.length} symbol features...`);
  for (let i = 0; i < symbolFeatures.length; i++) {
    const feature = symbolFeatures[i];
    console.log(
      `🎯 Processing symbol feature ${i + 1}/${symbolFeatures.length}`,
    );

    // Parse centroid (as string "lat, lng")
    const [lat, lng] = feature.properties.geographicCentroid
      .split(",")
      .map(Number);
    console.log(`📍 Feature centroid: ${lat}, ${lng}`);

    // 1. Click the symbol to zoom
    console.log("🖱️ Clicking symbol to zoom...");
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
    console.log("⏳ Waiting for map to finish panning/zooming...");
    await page.waitForFunction(() => {
      // @ts-expect-error _testMap is exposed for E2E testing only
      const m = window._testMap;
      return m && !m.isMoving();
    });
    console.log("✅ Map finished moving");

    // 3. Project centroid to screen coordinates (use [lng, lat] order!)
    console.log("📐 Projecting centroid to screen coordinates...");
    const { x, y } = await page.evaluate(
      ([lng, lat]) => {
        // @ts-expect-error helper exposed in component
        return window._testMap.project([lng, lat]);
      },
      [lng, lat],
    );
    console.log(`🖥️ Screen coordinates: (${x}, ${y})`);

    // 4. Try to find a polygon at or near that pixel (expand search radius)
    console.log("🔍 Searching for polygon at screen coordinates...");
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
      console.log(`✅ Found polygon at (${found.px}, ${found.py})`);
      // 5. Click the canvas at the found pixel
      console.log("🖱️ Clicking polygon...");
      await page.mouse.click(found.px, found.py);
      // 6. Assert sidebar
      console.log("📋 Checking for sidebar...");
      await expect(page.getByText(/copy link to alert/i)).toBeVisible();
      console.log("✅ Sidebar is visible");
      // 7. Assert the URL contains the alertId query param
      console.log("🔗 Checking URL for alertId parameter...");
      await expect(page).toHaveURL(/\?alertId=/);
      console.log("✅ URL contains alertId parameter");
    } else {
      console.log("❌ No polygon found for this symbol");
    }
  }

  console.log("🎉 Test completed successfully!");
});
